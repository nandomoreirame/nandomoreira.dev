//! The page route (stats-web REQ-006, REQ-010): parse the view, make sure its
//! counters are in memory, render. Plus the headers every answer carries.

use super::AppState;
use super::display::{Display, build};
use super::snapshot::snapshot;
use crate::range::today_date;
use crate::source::Source;
use crate::view::View;
use askama::Template;
use axum::extract::{Query, Request, State};
use axum::http::{HeaderValue, StatusCode, header};
use axum::middleware::Next;
use axum::response::{Html, IntoResponse, Response};
use chrono::Utc;
use std::collections::BTreeMap;

#[derive(Template)]
#[template(path = "page.html")]
pub struct PageTemplate<'a> {
    pub d: &'a Display,
}

#[derive(Template)]
#[template(path = "body.html")]
pub struct BodyTemplate<'a> {
    pub d: &'a Display,
}

#[derive(Template)]
#[template(path = "message.html")]
pub struct MessageTemplate<'a> {
    pub title: &'a str,
    pub message: &'a str,
}

/// No inline script or style anywhere: the bars use classes, the SVG is markup.
const CSP: &str = "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

pub fn render(template: &impl Template) -> Response {
    match template.render() {
        Ok(html) => Html(html).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "erro ao montar a página").into_response(),
    }
}

pub fn message(status: StatusCode, title: &str, text: &str) -> Response {
    (
        status,
        render(&MessageTemplate {
            title,
            message: text,
        }),
    )
        .into_response()
}

/// The display of `view` from the hub's memory, reading missing counters first.
pub async fn display_of<S: Source>(state: &AppState<S>, view: &View) -> Display {
    let now = Utc::now();
    state.hub.ensure_dailies(&view.range.days(), now).await;
    let store = state.hub.store.read().await;
    build(
        &snapshot(&store, view, now),
        view,
        &store,
        now,
        tokio::time::Instant::now(),
    )
}

pub async fn page<S: Source>(
    State(state): State<AppState<S>>,
    Query(params): Query<BTreeMap<String, String>>,
) -> Response {
    let view = match View::parse(&params, today_date(Utc::now())) {
        Ok(view) => view,
        Err(error) => return message(StatusCode::BAD_REQUEST, "Pedido inválido", &error),
    };
    let display = display_of(&state, &view).await;
    render(&PageTemplate { d: &display })
}

pub async fn security_headers(request: Request, next: Next) -> Response {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static(CSP),
    );
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("no-referrer"),
    );
    headers.insert(header::X_FRAME_OPTIONS, HeaderValue::from_static("DENY"));
    headers.insert(
        "x-robots-tag",
        HeaderValue::from_static("noindex, nofollow"),
    );
    response
}

#[cfg(test)]
mod tests {
    use crate::source::fake::Fake;
    use crate::web::app;
    use crate::web::test_support::{demo_state, fake_state, get, pageview};
    use axum::http::{StatusCode, header};

    const HOST: &str = "localhost:7878";

    #[tokio::test]
    async fn serves_the_page_with_tabs_period_and_the_live_region() {
        let (status, headers, body) = get(app(demo_state().await), "/", HOST).await;
        assert_eq!(status, StatusCode::OK);
        assert!(body.contains(r#"<html lang="pt-BR">"#));
        assert!(body.contains(r##"href="#main""##));
        assert!(body.contains(r#"aria-current="page">Ao vivo</a>"#));
        assert!(
            body.contains(r#"<main id="main" data-live data-query="tab=live&amp;span=day">"#)
                || body
                    .contains(r#"<main id="main" data-live data-query="tab=live&#38;span=day">"#)
        );
        assert!(body.contains("Período anterior"));
        assert!(
            headers[header::CONTENT_SECURITY_POLICY]
                .to_str()
                .unwrap()
                .contains("default-src 'none'")
        );
        assert_eq!(headers[header::X_CONTENT_TYPE_OPTIONS], "nosniff");
    }

    #[tokio::test]
    async fn a_bad_query_is_a_400_with_the_reason_escaped() {
        let (status, _, body) = get(app(demo_state().await), "/?tab=%3Cb%3E", HOST).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert!(
            body.contains("aba desconhecida: &#60;b&#62;")
                || body.contains("aba desconhecida: &lt;b&gt;")
        );
        assert!(!body.contains("<b>"));
    }

    #[tokio::test]
    async fn escapes_what_comes_from_firestore() {
        let now = chrono::Utc::now();
        let fake = Fake {
            documents: vec![pageview(
                "x",
                "/<script>alert(1)</script>",
                Some("<img src=x>"),
                now,
            )],
            ..Fake::default()
        };
        let (_, _, body) = get(app(fake_state(fake).await), "/", HOST).await;
        assert!(!body.contains("<script>alert(1)"));
        assert!(!body.contains("<img src=x>"));
        assert!(body.contains("alert(1)"));
    }

    #[tokio::test]
    async fn serves_the_stylesheet_with_its_type() {
        let (status, headers, body) = get(app(demo_state().await), "/assets/app.css", HOST).await;
        assert_eq!(status, StatusCode::OK);
        assert!(
            headers[header::CONTENT_TYPE]
                .to_str()
                .unwrap()
                .starts_with("text/css")
        );
        assert!(body.contains("@media (prefers-color-scheme: light)"));
    }

    #[tokio::test]
    async fn a_foreign_host_never_sees_the_page() {
        assert_eq!(
            get(app(demo_state().await), "/", "evil.com").await.0,
            StatusCode::MISDIRECTED_REQUEST
        );
    }

    async fn tab(query: &str) -> String {
        let (status, _, body) = get(app(demo_state().await), query, HOST).await;
        assert_eq!(status, StatusCode::OK, "{query}");
        body
    }

    #[tokio::test]
    async fn the_live_tab_has_cards_and_a_chart_only_for_longer_slices() {
        let day = tab("/?tab=live").await;
        assert!(day.contains("Páginas vistas") && day.contains("Cliques no /go"));
        assert!(!day.contains("<svg"));
        let month = tab("/?tab=live&span=last30").await;
        assert!(month.contains(r#"<svg class="chart""#));
        assert!(month.contains("Tabela da série"));
    }

    #[tokio::test]
    async fn the_funnel_tab_lists_stages_channels_and_leads() {
        let body = tab("/?tab=funnel&span=last30").await;
        for text in [
            "Chegou",
            "Viu evidência",
            "Agiu",
            "Virou lead",
            "Por canal de chegada",
        ] {
            assert!(body.contains(text), "{text}");
        }
        assert!(body.contains(r#"href="/lead?kind="#));
        assert!(body.contains("channel="));
    }

    #[tokio::test]
    async fn the_traffic_tab_links_pages_to_the_site_in_another_tab() {
        let body = tab("/?tab=traffic&span=last30").await;
        assert!(body.contains(r#"href="https://nandomoreira.dev/"#));
        assert!(body.contains(r#"target="_blank" rel="noopener noreferrer""#));
        assert!(body.contains("Cidades · pessoas") && body.contains("city="));
    }

    #[tokio::test]
    async fn the_mcp_and_sales_tabs_have_their_numbers() {
        let mcp = tab("/?tab=mcp&span=last30").await;
        assert!(mcp.contains("Chamadas de tool") && mcp.contains("Métodos"));
        let sales = tab("/?tab=sales&span=last30").await;
        assert!(sales.contains("Cliques no WhatsApp") && sales.contains("Funil da landing"));
    }

    #[tokio::test]
    async fn a_slice_outside_the_raw_events_says_so() {
        let old = (chrono::Utc::now() - chrono::Duration::days(60)).format("%Y-%m-%d");
        let body = tab(&format!("/?tab=funnel&span=day&at={old}")).await;
        assert!(body.contains("período fora dos 30 dias de eventos brutos"));
    }
}
