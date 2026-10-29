//! The web panel (docs/specs/stats-web): `stats web` serves it on loopback;
//! the homelab container serves it behind Caddy as stats.home.

pub mod assets;
pub mod display;
pub mod host;
pub mod hub;
pub mod lead;
pub mod pages;
pub mod snapshot;
pub mod store;

#[cfg(test)]
pub(crate) mod test_support;

use crate::source::Source;
use axum::Router;
use axum::middleware;
use axum::routing::get;
use host::AllowedHosts;
use hub::Hub;
use std::sync::Arc;

pub struct AppState<S: Source> {
    pub hub: Arc<Hub<S>>,
    pub hosts: AllowedHosts,
}

impl<S: Source> Clone for AppState<S> {
    fn clone(&self) -> Self {
        AppState {
            hub: self.hub.clone(),
            hosts: self.hosts.clone(),
        }
    }
}

/// Every route behind the Host guard, every answer with the security headers.
pub fn app<S: Source>(state: AppState<S>) -> Router {
    let hosts = state.hosts.clone();
    let routes = Router::new()
        .route("/", get(pages::page::<S>))
        .route("/lead", get(lead::lead::<S>))
        .route("/assets/app.css", get(assets::css))
        .route("/healthz", get(|| async { "ok" }))
        .with_state(state);
    host::guarded(routes, hosts).layer(middleware::from_fn(pages::security_headers))
}
