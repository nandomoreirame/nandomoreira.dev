use chrono::Utc;
use clap::Parser;
use crossterm::event::{Event as TermEvent, EventStream, KeyEventKind};
use futures::StreamExt;
use nm_stats::app::{Action, App};
use nm_stats::auth::{self, Runner, System};
use nm_stats::client::Firestore;
use nm_stats::lead::{collection_of, lead_detail};
use nm_stats::period::{Period, load_start, today};
use nm_stats::theme::{Theme, theme};
use nm_stats::ui;
use ratatui::DefaultTerminal;
use std::time::{Duration, Instant};

/// Gcloud access tokens last an hour; renew well before.
const TOKEN_TTL: Duration = Duration::from_secs(45 * 60);

#[derive(Parser)]
#[command(
    name = "nm-stats",
    about = "Visitas, funil e leads do nandomoreira.dev"
)]
struct Args {
    /// Projeto do Google Cloud (REQ-018).
    #[arg(long, default_value = "nandomoreira-dev")]
    project: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let runner = System;

    // REQ-001, REQ-002: before any drawing, so the login can use the terminal.
    let token = auth::access_token(&runner)?;
    let adc = auth::adc_path().and_then(|path| std::fs::read_to_string(path).ok());
    auth::ensure_quota_project(&runner, adc.as_deref(), &args.project)?;

    let mut client = Firestore::new(&args.project, token);
    let palette = theme(std::env::var("COLORTERM").ok().as_deref());

    // REQ-015: init installs a panic hook that restores the terminal too.
    let mut terminal = ratatui::init();
    let result = run(&mut terminal, &mut client, &runner, &palette).await;
    ratatui::restore();
    result
}

async fn run(
    terminal: &mut DefaultTerminal,
    client: &mut Firestore,
    runner: &impl Runner,
    palette: &Theme,
) -> anyhow::Result<()> {
    let mut app = App {
        status: Some("carregando os últimos 30 dias…".to_owned()),
        ..App::default()
    };
    terminal.draw(|frame| ui::draw(frame, &app, Utc::now(), palette))?;

    load_month(&mut app, client).await;
    refresh(&mut app, client).await;

    let mut keys = EventStream::new();
    let mut token_at = Instant::now();
    loop {
        terminal.draw(|frame| ui::draw(frame, &app, Utc::now(), palette))?;

        tokio::select! {
            _ = tokio::time::sleep(app.schedule.interval()) => {
                if let Some(notice) = app.schedule.expire(Instant::now()) {
                    app.status = Some(notice.to_owned());
                }
                if token_at.elapsed() >= TOKEN_TTL {
                    match auth::refresh_token(runner) {
                        Ok(token) => { client.set_token(token); token_at = Instant::now(); }
                        Err(error) => app.status = Some(format!("erro: {error}")),
                    }
                }
                refresh(&mut app, client).await;
            }
            Some(Ok(TermEvent::Key(key))) = keys.next() => {
                if key.kind != KeyEventKind::Press {
                    continue;
                }
                match app.on_key(key, Instant::now(), Utc::now()) {
                    Action::Quit => return Ok(()),
                    Action::Refresh => refresh(&mut app, client).await,
                    Action::OpenLead(lead) => match client.document(collection_of(&lead.kind), &lead.ref_id).await {
                        Ok(record) => app.detail = Some(lead_detail(&lead, record.as_ref(), app.log.events())),
                        Err(error) => app.status = Some(format!("erro ao abrir o lead: {error}")),
                    },
                    Action::None => {}
                }
            }
        }
    }
}

/// The 30 days of daily counters, once: past days no longer change.
async fn load_month(app: &mut App, client: &Firestore) {
    match client.dailies(&Period::Month.days(Utc::now())).await {
        Ok(dailies) => {
            for daily in dailies {
                app.dailies.insert(daily.day.clone(), daily);
            }
        }
        Err(error) => app.status = Some(format!("erro ao ler os totais: {error}")),
    }
}

/// REQ-003: new events since the last one seen, and today's counters. A
/// failure keeps what is on screen and goes to the status bar (REQ-014).
async fn refresh(app: &mut App, client: &Firestore) {
    let now = Utc::now();
    let from = app.log.cursor().unwrap_or_else(|| load_start(now));
    match client.events_since(&from).await {
        Ok(documents) => {
            app.log.merge(documents);
        }
        Err(error) => {
            app.status = Some(format!("erro ao ler eventos: {error}"));
            return;
        }
    }
    match client.dailies(&[today(now)]).await {
        Ok(dailies) => {
            for daily in dailies {
                app.dailies.insert(daily.day.clone(), daily);
            }
            if app
                .status
                .as_deref()
                .is_some_and(|s| s.starts_with("erro") || s.starts_with("carregando"))
            {
                app.status = None;
            }
        }
        Err(error) => app.status = Some(format!("erro ao ler os totais de hoje: {error}")),
    }
}
