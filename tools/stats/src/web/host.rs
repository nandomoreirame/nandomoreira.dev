//! REQ-002: the panel answers only to names it serves. A page on any other
//! site can point a DNS name at 127.0.0.1 (DNS rebinding); its requests then
//! carry that foreign Host, and get 421 before reaching a route.

use axum::Router;
use axum::extract::{Request, State};
use axum::http::{StatusCode, header};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct AllowedHosts(Arc<Vec<String>>);

impl AllowedHosts {
    pub fn new(host_name: Option<&str>) -> AllowedHosts {
        let mut hosts = vec![
            "localhost".to_owned(),
            "127.0.0.1".to_owned(),
            "[::1]".to_owned(),
        ];
        if let Some(name) = host_name {
            hosts.push(name.to_ascii_lowercase());
        }
        AllowedHosts(Arc::new(hosts))
    }

    /// The Host header without its port must be one of ours.
    pub fn allows(&self, host: Option<&str>) -> bool {
        let Some(host) = host else {
            return false;
        };
        let name = if host.starts_with('[') {
            host.split_inclusive(']').next().unwrap_or(host)
        } else {
            host.split(':').next().unwrap_or(host)
        };
        self.0
            .iter()
            .any(|allowed| allowed.eq_ignore_ascii_case(name))
    }
}

/// A form posted from another site carries that site's Origin; ours, or none
/// (same-origin navigation in older browsers), is fine.
pub fn same_origin(origin: Option<&str>, hosts: &AllowedHosts) -> bool {
    match origin {
        None => true,
        Some(origin) => origin
            .strip_prefix("http://")
            .or_else(|| origin.strip_prefix("https://"))
            .is_some_and(|rest| hosts.allows(Some(rest))),
    }
}

async fn guard(State(hosts): State<AllowedHosts>, request: Request, next: Next) -> Response {
    let host = request
        .headers()
        .get(header::HOST)
        .and_then(|value| value.to_str().ok());
    if hosts.allows(host) {
        next.run(request).await
    } else {
        (StatusCode::MISDIRECTED_REQUEST, "host não permitido").into_response()
    }
}

pub fn guarded(routes: Router, hosts: AllowedHosts) -> Router {
    routes.layer(middleware::from_fn_with_state(hosts, guard))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::web::test_support::{get, send};
    use axum::Router;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use axum::routing::get as route_get;

    #[test]
    fn allows_only_loopback_names_and_the_configured_one() {
        let hosts = AllowedHosts::new(Some("stats.home"));
        for host in [
            "localhost:7878",
            "127.0.0.1:7878",
            "127.0.0.1",
            "[::1]:7878",
            "stats.home",
            "STATS.home",
        ] {
            assert!(hosts.allows(Some(host)), "{host}");
        }
        for host in [
            "evil.com",
            "stats.home.evil.com",
            "localhost.evil.com",
            "10.0.0.5:7878",
        ] {
            assert!(!hosts.allows(Some(host)), "{host}");
        }
        assert!(!hosts.allows(None));
        assert!(!AllowedHosts::new(None).allows(Some("stats.home")));
    }

    #[test]
    fn a_posted_origin_must_be_one_of_ours() {
        let hosts = AllowedHosts::new(Some("stats.home"));
        assert!(same_origin(None, &hosts));
        assert!(same_origin(Some("http://localhost:7878"), &hosts));
        assert!(same_origin(Some("http://stats.home"), &hosts));
        assert!(!same_origin(Some("https://evil.com"), &hosts));
        assert!(!same_origin(Some("null"), &hosts));
    }

    #[tokio::test]
    async fn a_foreign_host_gets_421_before_any_route() {
        let router = guarded(
            Router::new().route("/healthz", route_get(|| async { "ok" })),
            AllowedHosts::new(Some("stats.home")),
        );
        assert_eq!(
            get(router.clone(), "/healthz", "evil.com").await.0,
            StatusCode::MISDIRECTED_REQUEST
        );
        let (status, _, body) = get(router.clone(), "/healthz", "localhost:7878").await;
        assert_eq!((status, body.as_str()), (StatusCode::OK, "ok"));
        assert_eq!(
            get(router.clone(), "/healthz", "stats.home").await.0,
            StatusCode::OK
        );
        let bare = Request::builder()
            .uri("/healthz")
            .body(Body::empty())
            .unwrap();
        assert_eq!(send(router, bare).await.0, StatusCode::MISDIRECTED_REQUEST);
    }
}
