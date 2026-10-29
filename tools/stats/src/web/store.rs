//! The web server's memory (stats-web): every event read, the daily counters
//! of the slices asked for, and what the page should say about them.

use crate::app::EventLog;
use crate::model::Daily;
use chrono::{DateTime, Utc};
use std::collections::BTreeMap;
use tokio::time::Instant;

#[derive(Debug, Default)]
pub struct Store {
    pub log: EventLog,
    pub dailies: BTreeMap<String, Daily>,
    /// The last failure, shown while the data on screen stays (REQ-004, REQ-018).
    pub error: Option<String>,
    /// A one-off message, such as the fast mode switching itself off.
    pub notice: Option<String>,
    pub refreshed_at: Option<DateTime<Utc>>,
    /// When the 5-second mode ends (REQ-017).
    pub fast_until: Option<Instant>,
}

#[cfg(test)]
impl Store {
    /// The demo world loaded whole, as the TUI's `--demo` loads it.
    pub fn demo(now: DateTime<Utc>) -> Store {
        let world = crate::demo::DemoWorld::new(now);
        let mut store = Store::default();
        store.log.merge(world.documents().to_vec());
        store.dailies = world.dailies();
        store
    }
}
