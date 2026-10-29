//! The stylesheet and the client script, compiled into the binary so the
//! server needs no files beside it.

use axum::http::header;
use axum::response::IntoResponse;

pub const CSS: &str = include_str!("../../assets/app.css");

pub async fn css() -> impl IntoResponse {
    (
        [
            (header::CONTENT_TYPE, "text/css; charset=utf-8"),
            (header::CACHE_CONTROL, "no-cache"),
        ],
        CSS,
    )
}
