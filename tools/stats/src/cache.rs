//! The raw events already read, kept on disk so a start only asks Firestore
//! for the new ones. Events never change once written and expire after 30
//! days, so the cache drops what is older than the load window. Lead records
//! (name, contact, brief) never come here: they stay in memory (REQ-013).

use crate::firestore::Document;
use crate::model::Daily;
use serde_json::{Value, json};
use std::collections::{BTreeMap, HashSet};
use std::ffi::OsString;
use std::path::{Path, PathBuf};

/// Bumped when the file layout changes; another version reads as empty.
const VERSION: u64 = 1;

/// `$XDG_CACHE_HOME/nandomoreira-stats/<project>/events.json`, falling back to
/// `~/.cache`. A project name that is not a plain id gets no cache.
pub fn cache_path(xdg: Option<OsString>, home: Option<OsString>, project: &str) -> Option<PathBuf> {
    let plain = !project.is_empty()
        && project
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_');
    if !plain {
        return None;
    }
    let base = match xdg.filter(|dir| !dir.is_empty()) {
        Some(dir) => PathBuf::from(dir),
        None => PathBuf::from(home?).join(".cache"),
    };
    Some(
        base.join("nandomoreira-stats")
            .join(project)
            .join("events.json"),
    )
}

fn at_of(document: &Document) -> Option<&str> {
    document.data.get("at")?.as_str()
}

fn decode(text: &str, from_at: &str) -> Vec<Document> {
    let Ok(root) = serde_json::from_str::<Value>(text) else {
        return Vec::new();
    };
    if root.get("version").and_then(Value::as_u64) != Some(VERSION) {
        return Vec::new();
    }
    root.get("documents")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|entry| {
            Some(Document {
                name: entry.get("name")?.as_str()?.to_owned(),
                data: entry.get("data")?.clone(),
            })
        })
        .filter(|document| at_of(document).is_some_and(|at| at >= from_at))
        .collect()
}

/// Writes next to the target and renames, so a crash never leaves half a file.
fn write_private(path: &Path, text: &str) -> std::io::Result<()> {
    use std::io::Write;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let tmp = path.with_extension("json.tmp");
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(&tmp)?;
    file.write_all(text.as_bytes())?;
    file.sync_all()?;
    std::fs::rename(&tmp, path)
}

#[derive(Debug, Default)]
pub struct EventCache {
    path: Option<PathBuf>,
    documents: Vec<Document>,
    seen: HashSet<String>,
    dirty: bool,
}

impl EventCache {
    /// The events on disk with `at` >= `from_at`. No path, a missing file or
    /// one that does not parse all start empty: the load just reads more.
    pub fn open(path: Option<PathBuf>, from_at: &str) -> EventCache {
        let documents = path
            .as_deref()
            .and_then(|path| std::fs::read_to_string(path).ok())
            .map(|text| decode(&text, from_at))
            .unwrap_or_default();
        let seen = documents.iter().map(|d| d.name.clone()).collect();
        EventCache {
            path,
            documents,
            seen,
            dirty: false,
        }
    }

    pub fn documents(&self) -> &[Document] {
        &self.documents
    }

    pub fn add(&mut self, documents: &[Document]) {
        for document in documents {
            if self.seen.insert(document.name.clone()) {
                self.documents.push(document.clone());
                self.dirty = true;
            }
        }
    }

    /// Drops what left the window and writes the file, only when something changed.
    pub fn save(&mut self, from_at: &str) -> std::io::Result<()> {
        let Some(path) = self.path.as_deref() else {
            return Ok(());
        };
        if !self.dirty {
            return Ok(());
        }
        self.documents
            .retain(|document| at_of(document).is_some_and(|at| at >= from_at));
        self.seen = self.documents.iter().map(|d| d.name.clone()).collect();
        let entries: Vec<Value> = self
            .documents
            .iter()
            .map(|d| json!({"name": d.name, "data": d.data}))
            .collect();
        let text = json!({"version": VERSION, "documents": entries}).to_string();
        write_private(path, &text)?;
        self.dirty = false;
        Ok(())
    }
}

/// `dailies.json` next to `events.json`: the counters of days that ended.
pub fn dailies_path(events: &Path) -> PathBuf {
    events.with_file_name("dailies.json")
}

fn counters_of(value: &Value) -> BTreeMap<String, i64> {
    value
        .as_object()
        .into_iter()
        .flatten()
        .filter_map(|(key, n)| Some((key.clone(), n.as_i64()?)))
        .collect()
}

fn decode_dailies(text: &str) -> BTreeMap<String, Daily> {
    let Ok(root) = serde_json::from_str::<Value>(text) else {
        return BTreeMap::new();
    };
    if root.get("version").and_then(Value::as_u64) != Some(VERSION) {
        return BTreeMap::new();
    }
    root.get("days")
        .and_then(Value::as_object)
        .into_iter()
        .flatten()
        .map(|(day, groups)| {
            let groups = groups
                .as_object()
                .into_iter()
                .flatten()
                .map(|(group, counters)| (group.clone(), counters_of(counters)))
                .collect();
            (
                day.clone(),
                Daily {
                    day: day.clone(),
                    groups,
                },
            )
        })
        .collect()
}

/// The daily counters of days that already ended (stats-web REQ-019): they
/// never change again, so the web panel reads each one from Firestore once.
#[derive(Debug, Default)]
pub struct DailyCache {
    path: Option<PathBuf>,
    days: BTreeMap<String, Daily>,
    dirty: bool,
}

impl DailyCache {
    pub fn open(path: Option<PathBuf>) -> DailyCache {
        let days = path
            .as_deref()
            .and_then(|path| std::fs::read_to_string(path).ok())
            .map(|text| decode_dailies(&text))
            .unwrap_or_default();
        DailyCache {
            path,
            days,
            dirty: false,
        }
    }

    pub fn get(&self, day: &str) -> Option<&Daily> {
        self.days.get(day)
    }

    /// Keeps `daily` only when its day is over: today's counters still move.
    pub fn keep(&mut self, daily: &Daily, today: &str) {
        if daily.day.as_str() < today && self.days.get(&daily.day) != Some(daily) {
            self.days.insert(daily.day.clone(), daily.clone());
            self.dirty = true;
        }
    }

    /// Drops the days before `oldest` and writes the file, when something changed.
    pub fn save(&mut self, oldest: &str) -> std::io::Result<()> {
        let Some(path) = self.path.as_deref() else {
            return Ok(());
        };
        if !self.dirty {
            return Ok(());
        }
        self.days.retain(|day, _| day.as_str() >= oldest);
        let days: serde_json::Map<String, Value> = self
            .days
            .iter()
            .map(|(day, daily)| (day.clone(), json!(daily.groups)))
            .collect();
        write_private(path, &json!({"version": VERSION, "days": days}).to_string())?;
        self.dirty = false;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Daily;
    use serde_json::json;
    use std::ffi::OsString;

    fn doc(id: &str, at: &str) -> Document {
        Document {
            name: format!("projects/p/databases/(default)/documents/analytics_events/{id}"),
            data: json!({"kind": "pageview", "at": at, "day": "2026-10-14", "visitor": "v",
                         "class": "human", "path": "/", "channel": "direct"}),
        }
    }

    /// A fresh directory per test, removed at the end.
    struct Scratch(PathBuf);

    impl Scratch {
        fn new(name: &str) -> Scratch {
            let dir =
                std::env::temp_dir().join(format!("stats-cache-{name}-{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&dir);
            Scratch(dir)
        }
        fn file(&self) -> PathBuf {
            self.0.join("nested/events.json")
        }
    }

    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn lives_under_the_xdg_cache_dir_per_project() {
        assert_eq!(
            cache_path(
                Some(OsString::from("/x/cache")),
                Some(OsString::from("/tmp/u")),
                "nandomoreira-dev"
            ),
            Some(PathBuf::from(
                "/x/cache/nandomoreira-stats/nandomoreira-dev/events.json"
            ))
        );
        assert_eq!(
            cache_path(None, Some(OsString::from("/tmp/u")), "p1"),
            Some(PathBuf::from(
                "/tmp/u/.cache/nandomoreira-stats/p1/events.json"
            ))
        );
        assert_eq!(
            cache_path(
                Some(OsString::from("")),
                Some(OsString::from("/tmp/u")),
                "p1"
            ),
            Some(PathBuf::from(
                "/tmp/u/.cache/nandomoreira-stats/p1/events.json"
            ))
        );
        assert_eq!(cache_path(None, None, "p1"), None);
    }

    #[test]
    fn refuses_a_project_that_would_escape_the_cache_dir() {
        let home = || Some(OsString::from("/tmp/u"));
        assert_eq!(cache_path(None, home(), "../etc"), None);
        assert_eq!(cache_path(None, home(), "a/b"), None);
        assert_eq!(cache_path(None, home(), ""), None);
    }

    #[test]
    fn saves_and_reopens_only_the_events_still_in_the_window() {
        let scratch = Scratch::new("roundtrip");
        let mut cache = EventCache::open(Some(scratch.file()), "2026-09-15T03:00:00.000Z");
        assert!(cache.documents().is_empty());

        cache.add(&[
            doc("old", "2026-09-15T02:59:59.999Z"),
            doc("a", "2026-10-14T12:00:00.000Z"),
            doc("b", "2026-10-14T12:00:01.000Z"),
        ]);
        cache.save("2026-09-15T03:00:00.000Z").unwrap();

        let reopened = EventCache::open(Some(scratch.file()), "2026-10-14T12:00:01.000Z");
        let ids: Vec<&str> = reopened.documents().iter().map(Document::id).collect();
        assert_eq!(ids, vec!["b"]);
        assert_eq!(reopened.documents()[0].data["path"], "/");
    }

    #[test]
    fn adds_each_document_once() {
        let mut cache = EventCache::open(None, "2026-09-15T03:00:00.000Z");
        cache.add(&[doc("a", "2026-10-14T12:00:00.000Z")]);
        cache.add(&[
            doc("a", "2026-10-14T12:00:00.000Z"),
            doc("b", "2026-10-14T12:00:01.000Z"),
        ]);
        assert_eq!(cache.documents().len(), 2);
    }

    #[test]
    fn starts_empty_from_a_missing_corrupt_or_foreign_file() {
        let scratch = Scratch::new("corrupt");
        let from = "2026-09-15T03:00:00.000Z";
        assert!(
            EventCache::open(Some(scratch.file()), from)
                .documents()
                .is_empty()
        );

        std::fs::create_dir_all(scratch.file().parent().unwrap()).unwrap();
        std::fs::write(scratch.file(), "{not json").unwrap();
        assert!(
            EventCache::open(Some(scratch.file()), from)
                .documents()
                .is_empty()
        );

        std::fs::write(scratch.file(), r#"{"version": 99, "documents": []}"#).unwrap();
        assert!(
            EventCache::open(Some(scratch.file()), from)
                .documents()
                .is_empty()
        );

        std::fs::write(
            scratch.file(),
            r#"{"version": 1, "documents": [{"name": 3}, {"name": "x/y", "data": {"at": "2026-10-01T00:00:00.000Z"}}]}"#,
        )
        .unwrap();
        let kept = EventCache::open(Some(scratch.file()), from);
        assert_eq!(kept.documents().len(), 1);
    }

    #[cfg(unix)]
    #[test]
    fn the_file_is_readable_by_the_owner_only() {
        use std::os::unix::fs::PermissionsExt;
        let scratch = Scratch::new("mode");
        let mut cache = EventCache::open(Some(scratch.file()), "2026-09-15T03:00:00.000Z");
        cache.add(&[doc("a", "2026-10-14T12:00:00.000Z")]);
        cache.save("2026-09-15T03:00:00.000Z").unwrap();
        let mode = std::fs::metadata(scratch.file())
            .unwrap()
            .permissions()
            .mode();
        assert_eq!(mode & 0o777, 0o600);
    }

    #[test]
    fn saving_without_a_path_or_changes_writes_nothing() {
        let mut cache = EventCache::open(None, "2026-09-15T03:00:00.000Z");
        cache.add(&[doc("a", "2026-10-14T12:00:00.000Z")]);
        assert!(cache.save("2026-09-15T03:00:00.000Z").is_ok());

        let scratch = Scratch::new("clean");
        let mut clean = EventCache::open(Some(scratch.file()), "2026-09-15T03:00:00.000Z");
        clean.save("2026-09-15T03:00:00.000Z").unwrap();
        assert!(!scratch.file().exists());
    }

    fn daily(day: &str, human: i64) -> Daily {
        Daily::from_data(day, &json!({"traffic": {"human": human}}))
    }

    #[test]
    fn the_daily_file_sits_next_to_the_events_file() {
        assert_eq!(
            dailies_path(Path::new("/c/nandomoreira-stats/p/events.json")),
            PathBuf::from("/c/nandomoreira-stats/p/dailies.json")
        );
    }

    #[test]
    fn keeps_only_days_that_ended_and_reopens_them() {
        let scratch = Scratch::new("dailies");
        let path = scratch.0.join("dailies.json");
        let mut cache = DailyCache::open(Some(path.clone()));
        cache.keep(&daily("2026-10-27", 4), "2026-10-28");
        cache.keep(&daily("2026-10-28", 9), "2026-10-28");
        assert!(cache.get("2026-10-28").is_none());
        cache.save("2026-01-01").unwrap();

        let reopened = DailyCache::open(Some(path));
        assert_eq!(
            reopened.get("2026-10-27").unwrap().get("traffic", "human"),
            4
        );
        assert!(reopened.get("2026-10-28").is_none());
    }

    #[test]
    fn drops_days_older_than_the_counters_live_on_save() {
        let scratch = Scratch::new("dailies-prune");
        let path = scratch.0.join("dailies.json");
        let mut cache = DailyCache::open(Some(path.clone()));
        cache.keep(&daily("2024-09-01", 1), "2026-10-28");
        cache.keep(&daily("2026-10-01", 1), "2026-10-28");
        cache.save("2024-10-28").unwrap();
        let reopened = DailyCache::open(Some(path));
        assert!(reopened.get("2024-09-01").is_none());
        assert!(reopened.get("2026-10-01").is_some());
    }

    #[test]
    fn a_corrupt_daily_file_starts_empty() {
        let scratch = Scratch::new("dailies-corrupt");
        let path = scratch.0.join("dailies.json");
        std::fs::create_dir_all(&scratch.0).unwrap();
        std::fs::write(&path, "{nope").unwrap();
        assert!(DailyCache::open(Some(path)).get("2026-10-01").is_none());
    }
}
