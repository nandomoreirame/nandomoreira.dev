//! Where the web server reads from (stats-web): Firestore in production, the
//! demo world for `--demo`, and a fake in the tests. One trait, so the server
//! never knows which.

use crate::client::{Firestore, Unauthorized};
use crate::demo::DemoWorld;
use crate::firestore::Document;
use crate::model::Daily;
use crate::token::Tokens;
use serde_json::Value;
use std::future::Future;
use tokio::sync::{Mutex, RwLock};

pub trait Source: Send + Sync + 'static {
    fn events_since(
        &self,
        from: &str,
    ) -> impl Future<Output = anyhow::Result<Vec<Document>>> + Send;
    fn dailies(&self, days: &[String]) -> impl Future<Output = anyhow::Result<Vec<Daily>>> + Send;
    fn document(
        &self,
        collection: &str,
        id: &str,
    ) -> impl Future<Output = anyhow::Result<Option<Value>>> + Send;
}

pub fn is_unauthorized<T>(result: &anyhow::Result<T>) -> bool {
    matches!(result, Err(error) if error.is::<Unauthorized>())
}

/// Firestore with a token renewed before it ends and once more after a 401.
pub struct Remote {
    firestore: RwLock<Firestore>,
    tokens: Mutex<Tokens>,
}

impl Remote {
    pub fn new(project: &str, tokens: Tokens) -> Remote {
        Remote {
            firestore: RwLock::new(Firestore::new(project, String::new())),
            tokens: Mutex::new(tokens),
        }
    }

    async fn authorize(&self, force: bool) -> anyhow::Result<()> {
        let token = self.tokens.lock().await.token(force).await?;
        self.firestore.write().await.set_token(token);
        Ok(())
    }
}

impl Source for Remote {
    async fn events_since(&self, from: &str) -> anyhow::Result<Vec<Document>> {
        self.authorize(false).await?;
        let first = self.firestore.read().await.events_since(from).await;
        if !is_unauthorized(&first) {
            return first;
        }
        self.authorize(true).await?;
        self.firestore.read().await.events_since(from).await
    }

    async fn dailies(&self, days: &[String]) -> anyhow::Result<Vec<Daily>> {
        self.authorize(false).await?;
        let first = self.firestore.read().await.dailies(days).await;
        if !is_unauthorized(&first) {
            return first;
        }
        self.authorize(true).await?;
        self.firestore.read().await.dailies(days).await
    }

    async fn document(&self, collection: &str, id: &str) -> anyhow::Result<Option<Value>> {
        self.authorize(false).await?;
        let first = self.firestore.read().await.document(collection, id).await;
        if !is_unauthorized(&first) {
            return first;
        }
        self.authorize(true).await?;
        self.firestore.read().await.document(collection, id).await
    }
}

/// `stats web --demo`: the made-up world, read as it was generated.
pub struct Demo {
    world: std::sync::Mutex<DemoWorld>,
}

impl Demo {
    pub fn new(world: DemoWorld) -> Demo {
        Demo {
            world: std::sync::Mutex::new(world),
        }
    }
}

impl Source for Demo {
    async fn events_since(&self, from: &str) -> anyhow::Result<Vec<Document>> {
        let world = self
            .world
            .lock()
            .map_err(|_| anyhow::anyhow!("demo envenenada"))?;
        Ok(world
            .documents()
            .iter()
            .filter(|doc| {
                doc.data
                    .get("at")
                    .and_then(Value::as_str)
                    .is_some_and(|at| at >= from)
            })
            .cloned()
            .collect())
    }

    async fn dailies(&self, days: &[String]) -> anyhow::Result<Vec<Daily>> {
        let world = self
            .world
            .lock()
            .map_err(|_| anyhow::anyhow!("demo envenenada"))?;
        let all = world.dailies();
        Ok(days
            .iter()
            .filter_map(|day| all.get(day).cloned())
            .collect())
    }

    async fn document(&self, _collection: &str, id: &str) -> anyhow::Result<Option<Value>> {
        let world = self
            .world
            .lock()
            .map_err(|_| anyhow::anyhow!("demo envenenada"))?;
        Ok(world.record(id).cloned())
    }
}

/// A scripted source for the server's tests: fixed answers, every call recorded.
#[cfg(test)]
pub mod fake {
    use super::*;
    use std::collections::BTreeMap;
    use std::sync::Arc;

    #[derive(Default, Clone)]
    pub struct Fake {
        pub documents: Vec<Document>,
        pub dailies: BTreeMap<String, Daily>,
        pub records: BTreeMap<String, Value>,
        pub fail: bool,
        pub calls: Arc<std::sync::Mutex<Vec<String>>>,
    }

    impl Fake {
        fn record(&self, call: String) -> anyhow::Result<()> {
            self.calls.lock().unwrap().push(call);
            if self.fail {
                anyhow::bail!("Firestore fora do ar")
            } else {
                Ok(())
            }
        }

        pub fn count(&self, prefix: &str) -> usize {
            self.calls
                .lock()
                .unwrap()
                .iter()
                .filter(|c| c.starts_with(prefix))
                .count()
        }
    }

    impl Source for Fake {
        async fn events_since(&self, from: &str) -> anyhow::Result<Vec<Document>> {
            self.record(format!("events {from}"))?;
            Ok(self
                .documents
                .iter()
                .filter(|d| {
                    d.data
                        .get("at")
                        .and_then(Value::as_str)
                        .is_some_and(|at| at >= from)
                })
                .cloned()
                .collect())
        }

        async fn dailies(&self, days: &[String]) -> anyhow::Result<Vec<Daily>> {
            self.record(format!("dailies {}", days.join(",")))?;
            Ok(days
                .iter()
                .filter_map(|d| self.dailies.get(d).cloned())
                .collect())
        }

        async fn document(&self, collection: &str, id: &str) -> anyhow::Result<Option<Value>> {
            self.record(format!("document {collection}/{id}"))?;
            Ok(self.records.get(id).cloned())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::client::Unauthorized;
    use chrono::{DateTime, Utc};

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    #[tokio::test]
    async fn the_demo_answers_events_since_an_instant() {
        let demo = Demo::new(DemoWorld::new(now()));
        let all = demo.events_since("").await.unwrap();
        assert!(!all.is_empty());
        let late = demo.events_since("2026-10-14T00:00:00.000Z").await.unwrap();
        assert!(late.len() < all.len());
        assert!(
            late.iter()
                .all(|d| d.data["at"].as_str().unwrap() >= "2026-10-14T00:00:00.000Z")
        );
    }

    #[tokio::test]
    async fn the_demo_answers_only_the_days_asked_for() {
        let demo = Demo::new(DemoWorld::new(now()));
        let days = vec!["2026-10-14".to_owned(), "1999-01-01".to_owned()];
        let dailies = demo.dailies(&days).await.unwrap();
        assert_eq!(dailies.len(), 1);
        assert_eq!(dailies[0].day, "2026-10-14");
    }

    #[test]
    fn spots_a_401_among_other_errors() {
        let unauthorized: anyhow::Result<()> = Err(Unauthorized.into());
        let other: anyhow::Result<()> = Err(anyhow::anyhow!("rede"));
        assert!(is_unauthorized(&unauthorized));
        assert!(!is_unauthorized(&other));
        assert!(!is_unauthorized(&Ok(())));
    }

    #[tokio::test]
    async fn the_fake_records_what_it_was_asked() {
        let fake = fake::Fake::default();
        fake.events_since("x").await.unwrap();
        fake.dailies(&["2026-10-01".to_owned()]).await.unwrap();
        assert_eq!(
            *fake.calls.lock().unwrap(),
            vec!["events x", "dailies 2026-10-01"]
        );
    }
}
