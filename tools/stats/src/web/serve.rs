//! `stats web` (stats-web REQ-001): picks the source, binds, serves until
//! Ctrl-C and saves the caches on the way out.

use super::host::AllowedHosts;
use super::hub::Hub;
use super::{AppState, app};
use crate::cache::{DailyCache, EventCache, cache_path, dailies_path};
use crate::demo::DemoWorld;
use crate::period::load_start;
use crate::source::{Demo, Remote, Source};
use crate::token::{TokenSource, Tokens};
use chrono::Utc;
use std::ffi::OsString;
use std::future::Future;
use std::net::IpAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::net::TcpListener;

/// How long Ctrl-C waits for open pages before dropping them: an SSE stream
/// never ends on its own, so a graceful shutdown alone would hang.
const DRAIN: Duration = Duration::from_secs(2);

/// Painel web no navegador (docs/specs/stats-web).
#[derive(Debug, Clone, clap::Parser)]
pub struct WebArgs {
    /// Porta do painel.
    #[arg(long, default_value_t = 7878)]
    pub port: u16,
    /// Endereço de escuta. Fora de um container, mantenha o loopback.
    #[arg(long, default_value = "127.0.0.1")]
    pub bind: IpAddr,
    /// Nome extra aceito no cabeçalho Host (o container usa stats.home).
    #[arg(long)]
    pub host_name: Option<String>,
    /// Não abre o navegador.
    #[arg(long)]
    pub no_open: bool,
    /// Dados fictícios, sem credencial e sem Firestore.
    #[arg(long)]
    pub demo: bool,
}

pub fn bind_error(error: &std::io::Error, port: u16) -> String {
    if error.kind() == std::io::ErrorKind::AddrInUse {
        format!("porta {port} em uso; use --port")
    } else {
        format!("não consegui escutar na porta {port}: {error}")
    }
}

/// REQ-003, REQ-004: the key GOOGLE_APPLICATION_CREDENTIALS points at, gcloud
/// without it, and a readable reason when the file cannot be read.
pub fn token_source(credentials: Option<OsString>) -> TokenSource {
    match credentials {
        None => TokenSource::Gcloud,
        Some(path) => match std::fs::read_to_string(&path) {
            Ok(json) => TokenSource::choose(Some(&json)),
            Err(error) => TokenSource::Broken(format!(
                "não consegui ler {}: {error}",
                path.to_string_lossy()
            )),
        },
    }
}

pub fn open_browser(url: &str) {
    let program = if cfg!(target_os = "macos") {
        "open"
    } else {
        "xdg-open"
    };
    let _ = std::process::Command::new(program)
        .arg(url)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn();
}

pub async fn run(args: WebArgs, project: &str, no_cache: bool) -> anyhow::Result<()> {
    let now = Utc::now();
    let listener = TcpListener::bind((args.bind, args.port))
        .await
        .map_err(|error| anyhow::anyhow!(bind_error(&error, args.port)))?;
    if !args.bind.is_loopback() {
        eprintln!(
            "aviso: escutando em {}; fora de um container, isso expõe o painel à rede",
            args.bind
        );
    }
    let hosts = AllowedHosts::new(args.host_name.as_deref());
    let open = (!args.no_open).then(|| format!("http://127.0.0.1:{}/", args.port));
    let shutdown = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    if args.demo {
        let hub = Hub::new(
            Demo::new(DemoWorld::new(now)),
            EventCache::open(None, ""),
            DailyCache::open(None),
        );
        return serve(Arc::new(hub), hosts, listener, open, shutdown).await;
    }
    let events_path = if no_cache {
        None
    } else {
        cache_path(
            std::env::var_os("XDG_CACHE_HOME"),
            std::env::var_os("HOME"),
            project,
        )
    };
    let dailies = DailyCache::open(events_path.as_deref().map(dailies_path));
    let events = EventCache::open(events_path, &load_start(now));
    let tokens = Tokens::new(
        token_source(std::env::var_os("GOOGLE_APPLICATION_CREDENTIALS")),
        reqwest::Client::new(),
    );
    let hub = Hub::new(Remote::new(project, tokens), events, dailies);
    serve(Arc::new(hub), hosts, listener, open, shutdown).await
}

pub async fn serve<S: Source>(
    hub: Arc<Hub<S>>,
    hosts: AllowedHosts,
    listener: TcpListener,
    open: Option<String>,
    shutdown: impl Future<Output = ()> + Send + 'static,
) -> anyhow::Result<()> {
    let address = listener.local_addr()?;
    tokio::spawn(hub.clone().run());
    println!("stats web em http://{address}/");
    if let Some(url) = open {
        open_browser(&url);
    }
    let (told, mut heard) = tokio::sync::watch::channel(false);
    let server = axum::serve(
        listener,
        app(AppState {
            hub: hub.clone(),
            hosts,
        }),
    )
    .with_graceful_shutdown(async move {
        shutdown.await;
        let _ = told.send(true);
    });
    tokio::select! {
        result = server => result?,
        _ = async {
            let _ = heard.wait_for(|stop| *stop).await;
            tokio::time::sleep(DRAIN).await;
        } => {}
    }
    hub.save(Utc::now(), true).await;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cache::{DailyCache, EventCache};
    use crate::demo::DemoWorld;
    use crate::source::Demo;
    use crate::token::TokenSource;
    use crate::web::host::AllowedHosts;
    use crate::web::hub::Hub;
    use chrono::Utc;
    use clap::Parser;
    use std::sync::Arc;
    use tokio::net::TcpListener;

    #[test]
    fn defaults_to_loopback_on_7878_and_opens_the_browser() {
        let args = WebArgs::try_parse_from(["web"]).unwrap();
        assert_eq!(
            (args.port, args.bind.to_string().as_str()),
            (7878, "127.0.0.1")
        );
        assert!(!args.no_open && !args.demo && args.host_name.is_none());
        let custom = WebArgs::try_parse_from([
            "web",
            "--port",
            "9000",
            "--no-open",
            "--host-name",
            "stats.home",
        ])
        .unwrap();
        assert_eq!(
            (custom.port, custom.no_open, custom.host_name.as_deref()),
            (9000, true, Some("stats.home"))
        );
    }

    #[tokio::test]
    async fn a_busy_port_says_which_flag_to_use() {
        let taken = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = taken.local_addr().unwrap().port();
        let error = TcpListener::bind(("127.0.0.1", port)).await.unwrap_err();
        assert_eq!(
            bind_error(&error, port),
            format!("porta {port} em uso; use --port")
        );
    }

    #[test]
    fn an_unreadable_key_path_keeps_the_server_up_with_the_reason() {
        let source = token_source(Some("/nonexistent/sa.json".into()));
        assert!(
            matches!(source, TokenSource::Broken(reason) if reason.contains("/nonexistent/sa.json"))
        );
        assert!(matches!(token_source(None), TokenSource::Gcloud));
    }

    #[tokio::test]
    async fn serves_the_demo_over_http_until_told_to_stop() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        let hub = Arc::new(Hub::new(
            Demo::new(DemoWorld::new(Utc::now())),
            EventCache::open(None, ""),
            DailyCache::open(None),
        ));
        let (stop, stopped) = tokio::sync::oneshot::channel::<()>();
        let server = tokio::spawn(serve(hub, AllowedHosts::new(None), listener, None, async {
            let _ = stopped.await;
        }));

        let base = format!("http://127.0.0.1:{port}");
        let http = reqwest::Client::new();
        assert_eq!(
            http.get(format!("{base}/healthz"))
                .send()
                .await
                .unwrap()
                .text()
                .await
                .unwrap(),
            "ok"
        );
        let page = http
            .get(format!("{base}/?span=last30"))
            .send()
            .await
            .unwrap()
            .text()
            .await
            .unwrap();
        assert!(page.contains("Ao vivo"));
        let foreign = http
            .get(format!("{base}/"))
            .header("host", "evil.com")
            .send()
            .await
            .unwrap();
        assert_eq!(foreign.status(), 421);

        stop.send(()).unwrap();
        server.await.unwrap().unwrap();
    }
}
