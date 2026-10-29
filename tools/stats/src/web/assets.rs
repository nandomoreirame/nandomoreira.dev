//! The stylesheet and the client script, compiled into the binary so the
//! server needs no files beside it.

use axum::http::header;
use axum::response::IntoResponse;

pub const CSS: &str = include_str!("../../assets/app.css");
pub const JS: &str = include_str!("../../assets/live.js");

pub async fn css() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "text/css; charset=utf-8"),
            (header::CACHE_CONTROL, "no-cache"),
        ],
        CSS,
    )
}

pub async fn js() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "text/javascript; charset=utf-8"),
            (header::CACHE_CONTROL, "no-cache"),
        ],
        JS,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_client_script_stays_small_and_plain() {
        assert!(JS.len() <= 2048, "live.js has {} bytes", JS.len());
        for banned in [
            "eval(",
            "Function(",
            "document.write",
            "innerHTML +=",
            "localStorage",
        ] {
            assert!(!JS.contains(banned), "{banned}");
        }
        assert!(JS.contains("EventSource"));
    }
}
