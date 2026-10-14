use chrono::Utc;
use clap::Parser;
use crossterm::event::EventStream;
use futures::StreamExt;
use ratatui::DefaultTerminal;
use stats::app::{Action, App, Input, days_to_refresh, input_of};
use stats::auth::{self, Runner, System};
use stats::client::{Firestore, Unauthorized};
use stats::funnel::Lead;
use stats::lead::{collection_of, lead_detail};
use stats::period::{Period, load_start, today};
use stats::schedule::Ticker;
use stats::theme::{Theme, theme};
use stats::ui;
use std::time::{Duration, Instant};

/// Gcloud access tokens last an hour; renew well before.
const TOKEN_TTL: Duration = Duration::from_secs(45 * 60);

#[derive(Parser)]
#[command(name = "stats", about = "Visitas, funil e leads do nandomoreira.dev")]
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
    let start = Instant::now();
    app.sync(start, start + app.schedule.interval());
    terminal.draw(|frame| ui::draw(frame, &app, Utc::now(), palette))?;

    let mut session = Session {
        token_at: Instant::now(),
        last_day: None,
    };
    refresh(&mut app, client, runner, &mut session, true).await;

    let mut keys = EventStream::new();
    let mut ticker = Ticker::new(Instant::now(), app.schedule.interval());
    loop {
        app.sync(Instant::now(), ticker.deadline());
        terminal.draw(|frame| ui::draw(frame, &app, Utc::now(), palette))?;

        tokio::select! {
            _ = tokio::time::sleep_until(tokio::time::Instant::from_std(ticker.deadline())) => {
                if let Some(notice) = app.schedule.expire(Instant::now()) {
                    app.status = Some(notice.to_owned());
                }
                if session.token_at.elapsed() >= TOKEN_TTL
                    && let Err(error) = renew(client, runner, &mut session)
                {
                    app.status = Some(format!("erro: {error}"));
                }
                refresh(&mut app, client, runner, &mut session, false).await;
                ticker.reschedule(Instant::now(), app.schedule.interval());
            }
            // Redraw every second so the countdown in the corner moves.
            _ = tokio::time::sleep(Duration::from_secs(1)) => {}
            event = keys.next() => match input_of(event) {
                Input::Closed => return Ok(()),
                Input::Redraw | Input::Ignore => {}
                Input::Key(key) => match app.on_key(key, Instant::now(), Utc::now()) {
                    Action::Quit => return Ok(()),
                    Action::Refresh => {
                        refresh(&mut app, client, runner, &mut session, false).await;
                        ticker.reschedule(Instant::now(), app.schedule.interval());
                    }
                    Action::OpenLead(lead) => open_lead(&mut app, client, runner, &mut session, &lead).await,
                    Action::None => {}
                },
            },
        }
    }
}

struct Session {
    token_at: Instant,
    /// The São Paulo day of the last refresh, to reread yesterday once after midnight.
    last_day: Option<String>,
}

/// A new token from gcloud. The command blocks, so the runtime is told.
fn renew(
    client: &mut Firestore,
    runner: &impl Runner,
    session: &mut Session,
) -> anyhow::Result<()> {
    let token = tokio::task::block_in_place(|| auth::refresh_token(runner))?;
    client.set_token(token);
    session.token_at = Instant::now();
    Ok(())
}

fn unauthorized<T>(result: &anyhow::Result<T>) -> bool {
    matches!(result, Err(error) if error.is::<Unauthorized>())
}

/// REQ-003: new events since the last one seen, and the daily counters
/// (all 30 days on the first load, then today's, plus yesterday's once after
/// midnight). A 401 renews the token and tries once more; any other failure
/// keeps what is on screen and goes to the status bar (REQ-014).
async fn refresh(
    app: &mut App,
    client: &mut Firestore,
    runner: &impl Runner,
    session: &mut Session,
    full: bool,
) {
    let mut result = try_refresh(app, client, session, full).await;
    if unauthorized(&result) && renew(client, runner, session).is_ok() {
        result = try_refresh(app, client, session, full).await;
    }
    match result {
        Ok(()) => {
            if app
                .status
                .as_deref()
                .is_some_and(|s| s.starts_with("erro") || s.starts_with("carregando"))
            {
                app.status = None;
            }
        }
        Err(error) => app.status = Some(format!("erro ao ler o Firestore: {error}")),
    }
}

async fn try_refresh(
    app: &mut App,
    client: &Firestore,
    session: &mut Session,
    full: bool,
) -> anyhow::Result<()> {
    let now = Utc::now();
    let from = app.log.cursor().unwrap_or_else(|| load_start(now));
    app.log.merge(client.events_since(&from).await?);

    let day = today(now);
    let days = if full {
        Period::Month.days(now)
    } else {
        days_to_refresh(session.last_day.as_deref(), &day)
    };
    for daily in client.dailies(&days).await? {
        app.dailies.insert(daily.day.clone(), daily);
    }
    session.last_day = Some(day);
    Ok(())
}

/// REQ-013: the lead's record, read on demand and held in memory only.
async fn open_lead(
    app: &mut App,
    client: &mut Firestore,
    runner: &impl Runner,
    session: &mut Session,
    lead: &Lead,
) {
    let collection = collection_of(&lead.kind);
    let mut record = client.document(collection, &lead.ref_id).await;
    if unauthorized(&record) && renew(client, runner, session).is_ok() {
        record = client.document(collection, &lead.ref_id).await;
    }
    match record {
        Ok(record) => app.detail = Some(lead_detail(lead, record.as_ref(), app.log.events())),
        Err(error) => app.status = Some(format!("erro ao abrir o lead: {error}")),
    }
}
