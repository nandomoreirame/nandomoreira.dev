use anyhow::{Context, anyhow, bail};
use serde_json::Value;
use std::path::PathBuf;
use std::process::Command;

pub struct CommandOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

/// Runs gcloud. A trait so the tests never spawn a process.
pub trait Runner {
    fn capture(&self, program: &str, args: &[&str]) -> std::io::Result<CommandOutput>;
    /// Attached to the terminal: the login opens a browser and may prompt.
    fn interactive(&self, program: &str, args: &[&str]) -> std::io::Result<bool>;
}

pub struct System;

impl Runner for System {
    fn capture(&self, program: &str, args: &[&str]) -> std::io::Result<CommandOutput> {
        let output = Command::new(program).args(args).output()?;
        Ok(CommandOutput {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        })
    }

    fn interactive(&self, program: &str, args: &[&str]) -> std::io::Result<bool> {
        Ok(Command::new(program).args(args).status()?.success())
    }
}

pub const LOGIN_COMMAND: &str = "gcloud auth application-default login";
const TOKEN_ARGS: [&str; 3] = ["auth", "application-default", "print-access-token"];
const LOGIN_ARGS: [&str; 3] = ["auth", "application-default", "login"];

fn try_token(runner: &impl Runner) -> anyhow::Result<Option<String>> {
    let output = runner
        .capture("gcloud", &TOKEN_ARGS)
        .context("gcloud não encontrado no PATH")?;
    let token = output.stdout.trim();
    Ok((output.success && !token.is_empty()).then(|| token.to_owned()))
}

/// REQ-001: a token from the gcloud default credentials; with none, the login
/// runs in this terminal (before the TUI draws anything) and is tried again.
pub fn access_token(runner: &impl Runner) -> anyhow::Result<String> {
    if let Some(token) = try_token(runner)? {
        return Ok(token);
    }
    if !runner.interactive("gcloud", &LOGIN_ARGS)? {
        bail!(
            "o login do gcloud falhou ou foi cancelado; rode `{LOGIN_COMMAND}` e abra o stats de novo"
        );
    }
    try_token(runner)?.ok_or_else(|| anyhow!("sem token depois do login; rode `{LOGIN_COMMAND}`"))
}

/// A new token while the TUI is open: never logs in, since the terminal is
/// in raw mode; a failure goes to the status bar (REQ-014).
pub fn refresh_token(runner: &impl Runner) -> anyhow::Result<String> {
    try_token(runner)?.ok_or_else(|| anyhow!("token expirado; saia e rode `{LOGIN_COMMAND}`"))
}

/// The quota project recorded in the ADC file, if any.
pub fn quota_project(adc_json: &str) -> Option<String> {
    serde_json::from_str::<Value>(adc_json)
        .ok()?
        .get("quota_project_id")?
        .as_str()
        .filter(|project| !project.is_empty())
        .map(str::to_owned)
}

/// REQ-002: the Firestore REST API refuses user credentials without a quota
/// project, so one is set when the ADC file has none.
pub fn ensure_quota_project(
    runner: &impl Runner,
    adc_json: Option<&str>,
    project: &str,
) -> anyhow::Result<()> {
    if adc_json.and_then(quota_project).is_some() {
        return Ok(());
    }
    if runner.interactive(
        "gcloud",
        &["auth", "application-default", "set-quota-project", project],
    )? {
        Ok(())
    } else {
        bail!(
            "não consegui definir o projeto de cota; rode `gcloud auth application-default set-quota-project {project}`"
        )
    }
}

/// Where gcloud keeps the default credentials.
pub fn adc_path() -> Option<PathBuf> {
    if let Some(path) = std::env::var_os("GOOGLE_APPLICATION_CREDENTIALS") {
        return Some(PathBuf::from(path));
    }
    let home = std::env::var_os("HOME")?;
    Some(PathBuf::from(home).join(".config/gcloud/application_default_credentials.json"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;
    use std::collections::VecDeque;

    /// Scripted answers, in order; records every call.
    #[derive(Default)]
    struct Fake {
        captures: RefCell<VecDeque<CommandOutput>>,
        interactives: RefCell<VecDeque<bool>>,
        calls: RefCell<Vec<String>>,
    }

    impl Runner for Fake {
        fn capture(&self, program: &str, args: &[&str]) -> std::io::Result<CommandOutput> {
            self.calls
                .borrow_mut()
                .push(format!("{program} {}", args.join(" ")));
            Ok(self
                .captures
                .borrow_mut()
                .pop_front()
                .expect("unexpected capture"))
        }
        fn interactive(&self, program: &str, args: &[&str]) -> std::io::Result<bool> {
            self.calls
                .borrow_mut()
                .push(format!("! {program} {}", args.join(" ")));
            Ok(self
                .interactives
                .borrow_mut()
                .pop_front()
                .expect("unexpected interactive"))
        }
    }

    fn out(success: bool, stdout: &str) -> CommandOutput {
        CommandOutput {
            success,
            stdout: stdout.into(),
            stderr: String::new(),
        }
    }

    #[test]
    fn uses_the_existing_credentials_without_logging_in() {
        let fake = Fake::default();
        fake.captures
            .borrow_mut()
            .push_back(out(true, "ya29.token\n"));

        assert_eq!(access_token(&fake).unwrap(), "ya29.token");
        assert_eq!(
            fake.calls.borrow().as_slice(),
            ["gcloud auth application-default print-access-token"]
        );
    }

    #[test]
    fn runs_the_login_in_the_terminal_when_there_is_no_token() {
        let fake = Fake::default();
        fake.captures
            .borrow_mut()
            .extend([out(false, ""), out(true, "ya29.new")]);
        fake.interactives.borrow_mut().push_back(true);

        assert_eq!(access_token(&fake).unwrap(), "ya29.new");
        assert_eq!(
            fake.calls.borrow()[1],
            "! gcloud auth application-default login"
        );
    }

    #[test]
    fn gives_up_with_the_command_when_the_login_fails() {
        let fake = Fake::default();
        fake.captures.borrow_mut().push_back(out(false, ""));
        fake.interactives.borrow_mut().push_back(false);

        let error = access_token(&fake).unwrap_err().to_string();
        assert!(
            error.contains("gcloud auth application-default login"),
            "{error}"
        );
    }

    #[test]
    fn refreshing_never_logs_in() {
        let fake = Fake::default();
        fake.captures.borrow_mut().push_back(out(false, ""));

        assert!(refresh_token(&fake).is_err());
        assert_eq!(fake.calls.borrow().len(), 1);
    }

    #[test]
    fn sets_the_quota_project_only_when_missing() {
        let fake = Fake::default();
        ensure_quota_project(
            &fake,
            Some(r#"{"quota_project_id":"nandomoreira-dev"}"#),
            "nandomoreira-dev",
        )
        .unwrap();
        assert!(fake.calls.borrow().is_empty());

        fake.interactives.borrow_mut().push_back(true);
        ensure_quota_project(
            &fake,
            Some(r#"{"type":"authorized_user"}"#),
            "nandomoreira-dev",
        )
        .unwrap();
        assert_eq!(
            fake.calls.borrow()[0],
            "! gcloud auth application-default set-quota-project nandomoreira-dev"
        );
    }
}
