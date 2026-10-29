//! Live updates (stats-web REQ-016, REQ-017): one poller reads Firestore only
//! while some page listens, every 30 s or every 5 s in the fast mode; each
//! listener gets its own view re-rendered after every refresh, over SSE.

use super::AppState;
use super::host::same_origin;
use super::hub::Hub;
use super::pages::{BodyTemplate, display_of, message};
use crate::range::today_date;
use crate::source::Source;
use crate::view::View;
use askama::Template;
use axum::extract::{Form, Query, State};
use axum::http::{HeaderMap, StatusCode, header};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Redirect, Response};
use chrono::Utc;
use futures::StreamExt;
use std::collections::BTreeMap;
use std::convert::Infallible;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::Instant;
use tokio_stream::wrappers::BroadcastStream;

pub const SLOW: Duration = Duration::from_secs(30);
pub const FAST: Duration = Duration::from_secs(5);
pub const FAST_FOR: Duration = Duration::from_secs(30 * 60);
pub const FAST_OFF: &str = "tempo real desligado depois de 30 min: atualiza a cada 30 s";

impl<S: Source> Hub<S> {
    /// A page starts listening; the poller wakes for it at once.
    pub fn subscribe(&self) -> tokio::sync::broadcast::Receiver<()> {
        let listener = self.tick.subscribe();
        self.wake.notify_one();
        listener
    }

    pub async fn interval(&self, now: Instant) -> Duration {
        if self
            .store
            .read()
            .await
            .fast_until
            .is_some_and(|end| end > now)
        {
            FAST
        } else {
            SLOW
        }
    }

    /// The 5-second mode on for 30 minutes, or off; returns whether it is on.
    pub async fn toggle_fast(&self, now: Instant) -> bool {
        let on = {
            let mut store = self.store.write().await;
            store.fast_until = match store.fast_until {
                Some(end) if end > now => None,
                _ => Some(now + FAST_FOR),
            };
            store.notice = None;
            store.fast_until.is_some()
        };
        self.wake.notify_one();
        on
    }

    async fn expire_fast(&self, now: Instant) {
        let mut store = self.store.write().await;
        if store.fast_until.is_some_and(|end| end <= now) {
            store.fast_until = None;
            store.notice = Some(FAST_OFF.to_owned());
        }
    }

    /// The poller: idle while nobody listens; otherwise refresh, save when
    /// due and wait for the interval, a new listener or the fast switch.
    pub async fn run(self: Arc<Self>) {
        loop {
            while self.tick.receiver_count() == 0 {
                self.wake.notified().await;
            }
            self.expire_fast(Instant::now()).await;
            let now = Utc::now();
            self.refresh(now).await;
            self.save(now, false).await;
            let wait = self.interval(Instant::now()).await;
            tokio::select! {
                _ = tokio::time::sleep(wait) => {}
                _ = self.wake.notified() => {}
            }
        }
    }
}

async fn render_body<S: Source>(state: &AppState<S>, params: &BTreeMap<String, String>) -> String {
    // Parsed again on every tick, so "today" moves on at midnight.
    let Ok(view) = View::parse(params, today_date(Utc::now())) else {
        return String::new();
    };
    let display = display_of(state, &view).await;
    BodyTemplate { d: &display }.render().unwrap_or_else(|_| {
        r#"<p class="alert" role="alert">erro ao montar a página</p>"#.to_owned()
    })
}

pub async fn events<S: Source>(
    State(state): State<AppState<S>>,
    Query(params): Query<BTreeMap<String, String>>,
) -> Response {
    if let Err(error) = View::parse(&params, today_date(Utc::now())) {
        return message(StatusCode::BAD_REQUEST, "Pedido inválido", &error);
    }
    let ticks = BroadcastStream::new(state.hub.subscribe()).map(|_| ());
    let stream = futures::stream::once(async {})
        .chain(ticks)
        .then(move |()| {
            let state = state.clone();
            let params = params.clone();
            async move {
                let html = render_body(&state, &params).await;
                Ok::<Event, Infallible>(Event::default().event("view").data(html))
            }
        });
    Sse::new(stream)
        .keep_alive(KeepAlive::default())
        .into_response()
}

pub async fn fast<S: Source>(
    State(state): State<AppState<S>>,
    headers: HeaderMap,
    Form(form): Form<BTreeMap<String, String>>,
) -> Response {
    let origin = headers
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok());
    if !same_origin(origin, &state.hosts) {
        return message(
            StatusCode::FORBIDDEN,
            "Origem não permitida",
            "o pedido veio de outro site",
        );
    }
    state.hub.toggle_fast(Instant::now()).await;
    let back: BTreeMap<String, String> = form
        .get("back")
        .map(|query| {
            form_urlencoded::parse(query.as_bytes())
                .into_owned()
                .collect()
        })
        .unwrap_or_default();
    // Rebuilt from a parsed view, so the redirect can only ever be "/?...".
    let target = View::parse(&back, today_date(Utc::now()))
        .map(|view| view.href())
        .unwrap_or_else(|_| "/".to_owned());
    Redirect::to(&target).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cache::{DailyCache, EventCache};
    use crate::source::fake::Fake;
    use crate::web::AppState;
    use crate::web::app;
    use crate::web::hub::Hub;
    use crate::web::test_support::{demo_state, fake_state, get, pageview, send};
    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use http_body_util::BodyExt;
    use std::sync::Arc;
    use std::time::Duration;
    use tokio::time::Instant;

    const HOST: &str = "localhost:7878";

    #[tokio::test(start_paused = true)]
    async fn reads_firestore_only_while_someone_listens() {
        let fake = Fake::default();
        let hub = Arc::new(Hub::new(
            fake.clone(),
            EventCache::open(None, ""),
            DailyCache::open(None),
        ));
        tokio::spawn(hub.clone().run());

        tokio::time::sleep(Duration::from_secs(120)).await;
        assert_eq!(fake.count("events"), 0);

        let listener = hub.subscribe();
        tokio::time::sleep(Duration::from_secs(1)).await;
        assert_eq!(fake.count("events"), 1);
        tokio::time::sleep(SLOW).await;
        assert_eq!(fake.count("events"), 2);

        drop(listener);
        tokio::time::sleep(SLOW * 4).await;
        assert!(
            fake.count("events") <= 3,
            "{} reads after the last page closed",
            fake.count("events")
        );
    }

    #[tokio::test(start_paused = true)]
    async fn the_fast_mode_lasts_30_minutes_and_says_when_it_ends() {
        let hub = Hub::new(
            Fake::default(),
            EventCache::open(None, ""),
            DailyCache::open(None),
        );
        assert_eq!(hub.interval(Instant::now()).await, SLOW);
        assert!(hub.toggle_fast(Instant::now()).await);
        assert_eq!(hub.interval(Instant::now()).await, FAST);

        tokio::time::advance(FAST_FOR + Duration::from_secs(1)).await;
        hub.expire_fast(Instant::now()).await;
        assert_eq!(hub.interval(Instant::now()).await, SLOW);
        assert_eq!(hub.store.read().await.notice.as_deref(), Some(FAST_OFF));

        assert!(hub.toggle_fast(Instant::now()).await);
        assert!(!hub.toggle_fast(Instant::now()).await);
    }

    #[tokio::test]
    async fn the_event_stream_starts_with_the_rendered_view() {
        let request = Request::builder()
            .uri("/events?tab=live")
            .header("host", HOST)
            .body(Body::empty())
            .unwrap();
        let response = tower::ServiceExt::oneshot(app(demo_state().await), request)
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert!(
            response.headers()[header::CONTENT_TYPE]
                .to_str()
                .unwrap()
                .starts_with("text/event-stream")
        );
        let frame = response.into_body().frame().await.unwrap().unwrap();
        let text = String::from_utf8(frame.into_data().unwrap().to_vec()).unwrap();
        assert!(text.starts_with("event: view\n"), "{text}");
        assert!(text.contains("Páginas vistas"));
    }

    #[tokio::test]
    async fn a_bad_stream_query_is_a_400() {
        assert_eq!(
            get(app(demo_state().await), "/events?span=year", HOST)
                .await
                .0,
            StatusCode::BAD_REQUEST
        );
    }

    fn post_fast(origin: &str, back: &str) -> Request<Body> {
        Request::builder()
            .method("POST")
            .uri("/fast")
            .header("host", HOST)
            .header("origin", origin)
            .header("content-type", "application/x-www-form-urlencoded")
            .body(Body::from(format!(
                "back={}",
                form_urlencoded::byte_serialize(back.as_bytes()).collect::<String>()
            )))
            .unwrap()
    }

    #[tokio::test]
    async fn the_fast_switch_refuses_other_sites_and_returns_to_the_same_view() {
        let state = demo_state().await;
        let (status, _, _) = send(
            app(state.clone()),
            post_fast("https://evil.com", "tab=funnel"),
        )
        .await;
        assert_eq!(status, StatusCode::FORBIDDEN);
        assert!(state.hub.store.read().await.fast_until.is_none());

        let (status, headers, _) = send(
            app(state.clone()),
            post_fast("http://localhost:7878", "tab=funnel&span=last7"),
        )
        .await;
        assert_eq!(status, StatusCode::SEE_OTHER);
        assert_eq!(headers[header::LOCATION], "/?tab=funnel&span=last7");
        assert!(state.hub.store.read().await.fast_until.is_some());

        let (_, headers, _) = send(app(state), post_fast("http://localhost:7878", "tab=x")).await;
        assert_eq!(headers[header::LOCATION], "/");
    }

    #[tokio::test]
    async fn a_failing_firestore_shows_an_alert_over_the_data_already_held() {
        let mut cache = EventCache::open(None, "");
        cache.add(&[pageview("a", "/sobre", None, chrono::Utc::now())]);
        let hub = Arc::new(Hub::new(
            Fake {
                fail: true,
                ..Fake::default()
            },
            cache,
            DailyCache::open(None),
        ));
        hub.refresh(chrono::Utc::now()).await;
        let state = AppState {
            hub,
            hosts: crate::web::host::AllowedHosts::new(None),
        };
        let (_, _, body) = get(app(state), "/", HOST).await;
        assert!(body.contains(r#"class="alert" role="alert""#));
        assert!(body.contains("/sobre"));
    }

    #[tokio::test]
    async fn the_page_loads_the_live_script_and_the_fast_switch() {
        let (_, _, body) = get(app(fake_state(Fake::default()).await), "/", HOST).await;
        assert!(body.contains(r#"<script src="/assets/live.js" defer></script>"#));
        assert!(body.contains(r#"action="/fast""#));
        assert!(body.contains(r#"aria-pressed="false""#));
    }
}
