//! The lead detail (stats-web REQ-020): the record read on demand, rendered
//! once and kept nowhere, with headers that keep the browser from storing it.

use super::AppState;
use super::pages::{message, render};
use crate::funnel::funnel;
use crate::lead::{LeadDetail, collection_of, lead_detail};
use crate::period::Period;
use crate::source::Source;
use askama::Template;
use axum::extract::{Query, State};
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::Response;
use chrono::Utc;
use std::collections::BTreeMap;

#[derive(Template)]
#[template(path = "lead.html")]
pub struct LeadTemplate<'a> {
    pub l: &'a LeadDetail,
    pub title: String,
}

/// Document ids the site writes: letters, digits, `-` and `_`. Anything
/// else never reaches the Firestore URL.
pub fn valid_ref(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

fn private(mut response: Response) -> Response {
    let headers = response.headers_mut();
    headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    headers.insert(header::PRAGMA, HeaderValue::from_static("no-cache"));
    response
}

pub async fn lead<S: Source>(
    State(state): State<AppState<S>>,
    Query(params): Query<BTreeMap<String, String>>,
) -> Response {
    let kind = params.get("kind").map(String::as_str).unwrap_or_default();
    let id = params.get("ref").map(String::as_str).unwrap_or_default();
    if !matches!(kind, "cv" | "hire") || !valid_ref(id) {
        return private(message(
            StatusCode::BAD_REQUEST,
            "Pedido inválido",
            "lead sem tipo (cv ou hire) ou com referência inválida",
        ));
    }
    let now = Utc::now();
    let (found, events) = {
        let store = state.hub.store.read().await;
        let events = store.log.events().to_vec();
        let found = funnel(&events, &Period::Month.days(now))
            .leads
            .into_iter()
            .find(|lead| lead.kind == kind && lead.ref_id == id);
        (found, events)
    };
    let Some(found) = found else {
        return private(message(
            StatusCode::NOT_FOUND,
            "Lead não encontrado",
            "o lead não está nos 30 dias de eventos brutos",
        ));
    };
    let record = match state.hub.source.document(collection_of(kind), id).await {
        Ok(record) => record,
        Err(error) => {
            return private(message(
                StatusCode::BAD_GATEWAY,
                "Erro ao abrir o lead",
                &format!("erro ao ler o Firestore: {error}"),
            ));
        }
    };
    let detail = lead_detail(&found, record.as_ref(), &events);
    private(render(&LeadTemplate {
        title: format!("Lead {kind} de {}", found.day),
        l: &detail,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::firestore::Document;
    use crate::source::fake::Fake;
    use crate::web::AppState;
    use crate::web::app;
    use crate::web::test_support::{fake_state, get, pageview};
    use axum::http::{StatusCode, header};
    use chrono::Utc;
    use serde_json::json;

    const HOST: &str = "localhost:7878";

    fn conversion(now: chrono::DateTime<Utc>) -> Document {
        let mut doc = pageview("c", "/curriculo", None, now);
        doc.data["kind"] = json!("conversion");
        doc.data["conversion"] = json!({"type": "cv", "refId": "cv-1"});
        doc
    }

    async fn with_lead() -> (Fake, AppState<Fake>) {
        let now = Utc::now();
        let fake = Fake {
            documents: vec![pageview("p", "/", None, now), conversion(now)],
            records: [(
                "cv-1".to_owned(),
                json!({"name": "Ana <b>", "email": "ana@example.com"}),
            )]
            .into(),
            ..Fake::default()
        };
        let state = fake_state(fake.clone()).await;
        (fake, state)
    }

    #[test]
    fn accepts_only_plain_document_ids() {
        assert!(valid_ref("cv-1_AbC"));
        for bad in ["", "../x", "a/b", "a b", &"x".repeat(129)] {
            assert!(!valid_ref(bad), "{bad}");
        }
    }

    #[tokio::test]
    async fn shows_the_record_once_and_tells_the_browser_not_to_keep_it() {
        let (fake, state) = with_lead().await;
        let (status, headers, body) = get(app(state), "/lead?kind=cv&ref=cv-1", HOST).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(headers[header::CACHE_CONTROL], "no-store");
        assert!(body.contains("Ana &#60;b&#62;") || body.contains("Ana &lt;b&gt;"));
        assert!(!body.contains("Ana <b>"));
        assert_eq!(fake.count("document cv_downloads/cv-1"), 1);
    }

    #[tokio::test]
    async fn refuses_a_bad_kind_or_reference_without_asking_firestore() {
        let (fake, state) = with_lead().await;
        for uri in [
            "/lead?kind=admin&ref=cv-1",
            "/lead?kind=cv&ref=..%2Fx",
            "/lead",
        ] {
            let (status, headers, _) = get(app(state.clone()), uri, HOST).await;
            assert_eq!(status, StatusCode::BAD_REQUEST, "{uri}");
            assert_eq!(headers[header::CACHE_CONTROL], "no-store");
        }
        assert_eq!(fake.count("document"), 0);
    }

    #[tokio::test]
    async fn a_lead_outside_the_raw_events_is_a_404() {
        let (_, state) = with_lead().await;
        assert_eq!(
            get(app(state), "/lead?kind=cv&ref=cv-9", HOST).await.0,
            StatusCode::NOT_FOUND
        );
    }
}
