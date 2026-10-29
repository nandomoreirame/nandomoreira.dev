//! The web server's single reader (stats-web REQ-016, REQ-018, REQ-019): one
//! refresh feeds every open page, the daily counters a slice needs are read
//! once, and a failure is kept for the page while the data stays.

use super::store::Store;
use crate::app::days_to_refresh;
use crate::cache::{DailyCache, EventCache};
use crate::model::Daily;
use crate::period::{load_start, today};
use crate::range::MAX_DAYS;
use crate::source::Source;
use chrono::{DateTime, Utc};
use std::time::Duration;
use tokio::sync::{Mutex, Notify, RwLock, broadcast};
use tokio::time::Instant;

/// Days per batchGet when a long slice needs counters.
const DAILY_BATCH: usize = 100;
/// The events file holds about 4 MB; rewrite it at most this often.
const SAVE_EVERY: Duration = Duration::from_secs(10 * 60);

pub struct Hub<S: Source> {
    pub source: S,
    pub store: RwLock<Store>,
    events: Mutex<EventCache>,
    dailies: Mutex<DailyCache>,
    last_day: Mutex<Option<String>>,
    saved_at: Mutex<Option<Instant>>,
    pub(crate) tick: broadcast::Sender<()>,
    pub(crate) wake: Notify,
}

impl<S: Source> Hub<S> {
    pub fn new(source: S, events: EventCache, dailies: DailyCache) -> Hub<S> {
        let mut store = Store::default();
        store.log.merge(events.documents().to_vec());
        Hub {
            source,
            store: RwLock::new(store),
            events: Mutex::new(events),
            dailies: Mutex::new(dailies),
            last_day: Mutex::new(None),
            saved_at: Mutex::new(None),
            tick: broadcast::channel(16).0,
            wake: Notify::new(),
        }
    }

    /// New events since the newest one held, and today's counters
    /// (yesterday's once more after midnight); then every open page is told.
    pub async fn refresh(&self, now: DateTime<Utc>) {
        let result = self.try_refresh(now).await;
        {
            let mut store = self.store.write().await;
            match result {
                Ok(()) => {
                    store.error = None;
                    store.refreshed_at = Some(now);
                }
                Err(error) => store.error = Some(format!("erro ao ler o Firestore: {error}")),
            }
        }
        let _ = self.tick.send(());
    }

    async fn try_refresh(&self, now: DateTime<Utc>) -> anyhow::Result<()> {
        let from = self
            .store
            .read()
            .await
            .log
            .cursor()
            .unwrap_or_else(|| load_start(now));
        let fetched = self.source.events_since(&from).await?;
        self.events.lock().await.add(&fetched);
        self.store.write().await.log.merge(fetched);

        let day = today(now);
        let days = days_to_refresh(self.last_day.lock().await.as_deref(), &day);
        let fresh = self.source.dailies(&days).await?;
        {
            let mut cache = self.dailies.lock().await;
            for daily in &fresh {
                cache.keep(daily, &day);
            }
        }
        {
            let mut store = self.store.write().await;
            for daily in fresh {
                store.dailies.insert(daily.day.clone(), daily);
            }
        }
        *self.last_day.lock().await = Some(day);
        Ok(())
    }

    /// REQ-019: the counters of `days` not in memory yet, from the cache or
    /// from Firestore in batches. A day that ended with no document reads as
    /// zero and is not asked for again.
    pub async fn ensure_dailies(&self, days: &[String], now: DateTime<Utc>) {
        let missing: Vec<String> = {
            let store = self.store.read().await;
            days.iter()
                .filter(|day| !store.dailies.contains_key(*day))
                .cloned()
                .collect()
        };
        if missing.is_empty() {
            return;
        }
        let today = today(now);
        let mut found: Vec<Daily> = Vec::new();
        let mut ask: Vec<String> = Vec::new();
        {
            let cache = self.dailies.lock().await;
            for day in missing {
                match cache.get(&day) {
                    Some(daily) => found.push(daily.clone()),
                    None => ask.push(day),
                }
            }
        }
        for batch in ask.chunks(DAILY_BATCH) {
            match self.source.dailies(batch).await {
                Ok(list) => {
                    let mut cache = self.dailies.lock().await;
                    for day in batch {
                        let daily = list
                            .iter()
                            .find(|daily| &daily.day == day)
                            .cloned()
                            .or_else(|| {
                                (day.as_str() < today.as_str()).then(|| Daily {
                                    day: day.clone(),
                                    ..Daily::default()
                                })
                            });
                        if let Some(daily) = daily {
                            cache.keep(&daily, &today);
                            found.push(daily);
                        }
                    }
                }
                Err(error) => {
                    self.store.write().await.error =
                        Some(format!("erro ao ler os contadores diários: {error}"));
                    break;
                }
            }
        }
        let mut store = self.store.write().await;
        for daily in found {
            store.dailies.insert(daily.day.clone(), daily);
        }
    }

    /// Writes both caches once SAVE_EVERY has passed, or always with `force` (on shutdown).
    pub async fn save(&self, now: DateTime<Utc>, force: bool) {
        let instant = Instant::now();
        {
            let mut saved = self.saved_at.lock().await;
            if !force && saved.is_some_and(|at| instant.duration_since(at) < SAVE_EVERY) {
                return;
            }
            *saved = Some(instant);
        }
        let oldest = (now - chrono::Duration::days(MAX_DAYS))
            .format("%Y-%m-%d")
            .to_string();
        let events = self.events.lock().await.save(&load_start(now));
        let dailies = self.dailies.lock().await.save(&oldest);
        if let Err(error) = events.and(dailies) {
            self.store.write().await.error = Some(format!("erro ao gravar o cache: {error}"));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cache::{DailyCache, EventCache};
    use crate::model::Daily;
    use crate::source::fake::Fake;
    use crate::web::test_support::pageview;
    use chrono::{DateTime, Utc};
    use serde_json::json;

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    fn hub(fake: Fake, events: EventCache, dailies: DailyCache) -> Hub<Fake> {
        Hub::new(fake, events, dailies)
    }

    #[tokio::test]
    async fn starts_from_the_cached_events_and_asks_only_for_newer_ones() {
        let mut cache = EventCache::open(None, "");
        cache.add(&[pageview("a", "/", None, now())]);
        let fake = Fake::default();
        let hub = hub(fake.clone(), cache, DailyCache::open(None));
        assert_eq!(hub.store.read().await.log.events().len(), 1);
        hub.refresh(now()).await;
        let calls = fake.calls.lock().unwrap().clone();
        assert_eq!(calls[0], "events 2026-10-14T18:00:00.000Z");
        assert_eq!(calls[1], "dailies 2026-10-14");
    }

    #[tokio::test]
    async fn a_failed_refresh_keeps_the_data_and_says_why() {
        let mut cache = EventCache::open(None, "");
        cache.add(&[pageview("a", "/", None, now())]);
        let fake = Fake {
            fail: true,
            ..Fake::default()
        };
        let hub = hub(fake, cache, DailyCache::open(None));
        hub.refresh(now()).await;
        let store = hub.store.read().await;
        assert_eq!(store.log.events().len(), 1);
        assert!(
            store
                .error
                .as_deref()
                .unwrap()
                .contains("Firestore fora do ar")
        );
    }

    #[tokio::test]
    async fn reads_the_counters_of_a_slice_once_and_zero_fills_ended_days() {
        let day = Daily::from_data("2026-10-01", &json!({"traffic": {"human": 2}}));
        let fake = Fake {
            dailies: [(day.day.clone(), day)].into(),
            ..Fake::default()
        };
        let hub = hub(
            fake.clone(),
            EventCache::open(None, ""),
            DailyCache::open(None),
        );
        let days: Vec<String> = ["2026-10-01", "2026-10-02", "2026-10-03"]
            .map(str::to_owned)
            .into();
        hub.ensure_dailies(&days, now()).await;
        hub.ensure_dailies(&days, now()).await;
        assert_eq!(fake.count("dailies"), 1);
        let store = hub.store.read().await;
        assert_eq!(store.dailies["2026-10-01"].get("traffic", "human"), 2);
        assert_eq!(store.dailies["2026-10-02"].get("traffic", "human"), 0);
    }

    #[tokio::test]
    async fn a_cached_day_never_reaches_firestore() {
        let mut dailies = DailyCache::open(None);
        dailies.keep(&Daily::from_data("2026-10-01", &json!({})), "2026-10-14");
        let fake = Fake::default();
        let hub = hub(fake.clone(), EventCache::open(None, ""), dailies);
        hub.ensure_dailies(&["2026-10-01".to_owned()], now()).await;
        assert_eq!(fake.count("dailies"), 0);
    }

    #[tokio::test]
    async fn tells_every_listener_after_a_refresh() {
        let hub = hub(
            Fake::default(),
            EventCache::open(None, ""),
            DailyCache::open(None),
        );
        let mut listener = hub.tick.subscribe();
        hub.refresh(now()).await;
        assert!(listener.try_recv().is_ok());
    }
}
