use chrono::Utc;
use clap::Parser;
use crossterm::event::EventStream;
use futures::StreamExt;
use ratatui::DefaultTerminal;
use stats::app::{Action, App, Input, OLD_DAY_NOTICE, days_to_refresh, input_of};
use stats::auth::{self, Runner, System};
use stats::cache::{EventCache, cache_path};
use stats::client::{Firestore, Unauthorized};
use stats::demo::DemoWorld;
use stats::funnel::Lead;
use stats::lead::{collection_of, lead_detail};
use stats::period::{Period, load_start, parse_day, today};
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

    /// Dados fictícios gerados em memória, sem login e sem Firestore (para prints).
    #[arg(long)]
    demo: bool,

    /// Abre num dia só: AAAA-MM-DD, hoje ou ontem. `,` e `.` trocam o dia na TUI.
    #[arg(long, value_name = "AAAA-MM-DD")]
    day: Option<String>,

    /// Ignora o cache local de eventos e relê os 30 dias do Firestore.
    #[arg(long)]
    no_cache: bool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let palette = theme(std::env::var("COLORTERM").ok().as_deref());
    let period = match args.day.as_deref() {
        Some(day) => parse_day(day, Utc::now()).map_err(anyhow::Error::msg)?,
        None => Period::default(),
    };

    if args.demo {
        let mut terminal = ratatui::init();
        let result = run_demo(&mut terminal, &palette, period).await;
        ratatui::restore();
        return result;
    }

    let runner = System;

    // REQ-001, REQ-002: before any drawing, so the login can use the terminal.
    let token = auth::access_token(&runner)?;
    let adc = auth::adc_path().and_then(|path| std::fs::read_to_string(path).ok());
    auth::ensure_quota_project(&runner, adc.as_deref(), &args.project)?;

    let mut client = Firestore::new(&args.project, token);
    let path = if args.no_cache {
        None
    } else {
        cache_path(
            std::env::var_os("XDG_CACHE_HOME"),
            std::env::var_os("HOME"),
            &args.project,
        )
    };
    let cache = EventCache::open(path, &load_start(Utc::now()));

    // REQ-015: init installs a panic hook that restores the terminal too.
    let mut terminal = ratatui::init();
    let result = run(&mut terminal, &mut client, &runner, &palette, period, cache).await;
    ratatui::restore();
    result
}

async fn run(
    terminal: &mut DefaultTerminal,
    client: &mut Firestore,
    runner: &impl Runner,
    palette: &Theme,
    period: Period,
    cache: EventCache,
) -> anyhow::Result<()> {
    let cached = cache.documents().len();
    let mut app = App {
        period,
        status: Some(if cached > 0 {
            format!("carregando: {cached} eventos do cache, buscando os novos…")
        } else {
            "carregando os últimos 30 dias…".to_owned()
        }),
        ..App::default()
    };
    // The cached events draw at once; the refresh below asks only for newer ones.
    app.log.merge(cache.documents().to_vec());
    let start = Instant::now();
    app.sync(start, start + app.schedule.interval());
    terminal.draw(|frame| ui::draw(frame, &app, Utc::now(), palette))?;

    let mut session = Session {
        token_at: Instant::now(),
        last_day: None,
        cache,
    };
    refresh(&mut app, client, runner, &mut session, true).await;
    save_cache(&mut app, &mut session);
    if app.status.is_none() && !app.period.has_events(Utc::now()) {
        app.status = Some(OLD_DAY_NOTICE.to_owned());
    }

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
                Input::Closed => break,
                Input::Redraw | Input::Ignore => {}
                Input::Key(key) => match app.on_key(key, Instant::now(), Utc::now()) {
                    Action::Quit => break,
                    Action::Refresh => {
                        refresh(&mut app, client, runner, &mut session, false).await;
                        ticker.reschedule(Instant::now(), app.schedule.interval());
                    }
                    Action::OpenLead(lead) => open_lead(&mut app, client, runner, &mut session, &lead).await,
                    Action::LoadDay(day) => load_day(&mut app, client, runner, &mut session, day).await,
                    Action::None => {}
                },
            },
        }
    }
    save_cache(&mut app, &mut session);
    Ok(())
}

/// Writes the events read so far; a failure costs only a slower next start.
fn save_cache(app: &mut App, session: &mut Session) {
    if let Err(error) = session.cache.save(&load_start(Utc::now())) {
        app.status = Some(format!("erro ao gravar o cache: {error}"));
    }
}

/// `--demo`: the same screens and keys over made-up data. Each refresh adds
/// one fresh visit, so the live tab moves; nothing touches the network.
async fn run_demo(
    terminal: &mut DefaultTerminal,
    palette: &Theme,
    period: Period,
) -> anyhow::Result<()> {
    let mut world = DemoWorld::new(Utc::now());
    let mut app = App {
        period,
        ..App::default()
    };
    world.load(&mut app);

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
                world.tick(Utc::now(), &mut app);
                ticker.reschedule(Instant::now(), app.schedule.interval());
            }
            _ = tokio::time::sleep(Duration::from_secs(1)) => {}
            event = keys.next() => match input_of(event) {
                Input::Closed => return Ok(()),
                Input::Redraw | Input::Ignore => {}
                Input::Key(key) => match app.on_key(key, Instant::now(), Utc::now()) {
                    Action::Quit => return Ok(()),
                    Action::Refresh => ticker.reschedule(Instant::now(), app.schedule.interval()),
                    Action::OpenLead(lead) => {
                        app.detail = Some(lead_detail(&lead, world.record(&lead.ref_id), app.log.events()));
                    }
                    // The demo makes up only 30 days; older ones read as empty.
                    Action::LoadDay(_) | Action::None => {}
                },
            },
        }
    }
}

struct Session {
    token_at: Instant,
    /// The São Paulo day of the last refresh, to reread yesterday once after midnight.
    last_day: Option<String>,
    /// Every raw event read, saved after the first load and on quit.
    cache: EventCache,
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
    let fetched = client.events_since(&from).await?;
    session.cache.add(&fetched);
    app.log.merge(fetched);

    let day = today(now);
    let days = if full {
        let mut days = Period::Month.days(now);
        // `--day` older than the load: its counters too.
        if !app.period.has_events(now) {
            days.extend(app.period.days(now));
        }
        days
    } else {
        days_to_refresh(session.last_day.as_deref(), &day)
    };
    for daily in client.dailies(&days).await? {
        app.dailies.insert(daily.day.clone(), daily);
    }
    session.last_day = Some(day);
    Ok(())
}

/// The counters of one day older than the load; its raw events are gone.
async fn load_day(
    app: &mut App,
    client: &mut Firestore,
    runner: &impl Runner,
    session: &mut Session,
    day: String,
) {
    let days = [day];
    let mut dailies = client.dailies(&days).await;
    if unauthorized(&dailies) && renew(client, runner, session).is_ok() {
        dailies = client.dailies(&days).await;
    }
    match dailies {
        Ok(dailies) => {
            for daily in dailies {
                app.dailies.insert(daily.day.clone(), daily);
            }
        }
        Err(error) => app.status = Some(format!("erro ao ler o dia: {error}")),
    }
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
