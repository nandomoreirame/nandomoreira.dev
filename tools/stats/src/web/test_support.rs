//! Helpers for the web tests: one request through a router, read back whole.

use crate::firestore::Document;
use axum::Router;
use axum::body::Body;
use axum::http::{HeaderMap, Request, StatusCode, header};
use chrono::{DateTime, Utc};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use tower::ServiceExt;

pub async fn send(router: Router, request: Request<Body>) -> (StatusCode, HeaderMap, String) {
    let response = router.oneshot(request).await.unwrap();
    let status = response.status();
    let headers = response.headers().clone();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        headers,
        String::from_utf8_lossy(&bytes).into_owned(),
    )
}

pub async fn get(router: Router, uri: &str, host: &str) -> (StatusCode, HeaderMap, String) {
    let request = Request::builder()
        .uri(uri)
        .header(header::HOST, host)
        .body(Body::empty())
        .unwrap();
    send(router, request).await
}

/// A human pageview at `now`, on the São Paulo day of `now`.
pub fn pageview(name: &str, path: &str, city: Option<&str>, now: DateTime<Utc>) -> Document {
    Document {
        name: format!("projects/p/databases/(default)/documents/analytics_events/{name}"),
        data: json!({
            "kind": "pageview", "at": now.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string(),
            "day": crate::period::today(now), "visitor": "v1", "class": "human",
            "path": path, "channel": "direct", "country": "BR", "city": city, "region": Value::Null,
        }),
    }
}
