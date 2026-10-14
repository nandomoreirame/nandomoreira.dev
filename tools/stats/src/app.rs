use crate::firestore::Document;
use crate::funnel::{Funnel, Lead, funnel};
use crate::lead::LeadDetail;
use crate::model::{Daily, Event};
use crate::period::{Period, today};
use crate::schedule::Schedule;
use crate::totals::{Totals, sum};
use chrono::{DateTime, Utc};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use std::collections::{BTreeMap, HashSet};
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Tab {
    #[default]
    Live,
    Funnel,
    Traffic,
    Mcp,
}

pub const TAB_TITLES: [&str; 4] = ["Ao vivo", "Funil", "Tráfego", "MCP"];
const TABS: [Tab; 4] = [Tab::Live, Tab::Funnel, Tab::Traffic, Tab::Mcp];

impl Tab {
    pub fn index(self) -> usize {
        TABS.iter().position(|tab| *tab == self).unwrap_or(0)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum Action {
    None,
    Quit,
    Refresh,
    OpenLead(Lead),
}

/// Events seen so far, deduplicated by document name.
#[derive(Debug, Default)]
pub struct EventLog {
    events: Vec<Event>,
    seen: HashSet<String>,
}

impl EventLog {
    /// Adds the documents not seen before; returns how many were new.
    pub fn merge(&mut self, documents: Vec<Document>) -> usize {
        let mut added = 0;
        for document in documents {
            if self.seen.contains(&document.name) {
                continue;
            }
            if let Some(event) = Event::from_data(&document.data) {
                self.seen.insert(document.name);
                self.events.push(event);
                added += 1;
            }
        }
        if added > 0 {
            self.events.sort_by_key(|event| event.at);
        }
        added
    }

    /// The latest `at`, in the stored ISO format, to resume from (REQ-003).
    pub fn cursor(&self) -> Option<String> {
        self.events
            .last()
            .map(|event| event.at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string())
    }

    pub fn events(&self) -> &[Event] {
        &self.events
    }

    /// The `n` newest events, newest first.
    pub fn recent(&self, n: usize) -> Vec<&Event> {
        self.events.iter().rev().take(n).collect()
    }
}

#[derive(Debug, Default)]
pub struct App {
    pub tab: Tab,
    pub period: Period,
    pub schedule: Schedule,
    pub log: EventLog,
    pub dailies: BTreeMap<String, Daily>,
    pub status: Option<String>,
    pub selected: usize,
    pub detail: Option<LeadDetail>,
}

impl App {
    pub fn funnel(&self, now: DateTime<Utc>) -> Funnel {
        funnel(self.log.events(), &self.period.days(now))
    }

    pub fn totals(&self, now: DateTime<Utc>) -> Totals {
        let days = self.period.days(now);
        let dailies: Vec<&Daily> = days
            .iter()
            .filter_map(|day| self.dailies.get(day))
            .collect();
        sum(&dailies)
    }

    pub fn today(&self, now: DateTime<Utc>) -> Option<&Daily> {
        self.dailies.get(&today(now))
    }

    /// One key press. A detail on screen takes the keys first: Esc, Enter or
    /// q close it, so q never quits from inside a lead.
    pub fn on_key(&mut self, key: KeyEvent, now: Instant, wall: DateTime<Utc>) -> Action {
        if self.detail.is_some() {
            if matches!(key.code, KeyCode::Esc | KeyCode::Enter | KeyCode::Char('q')) {
                self.detail = None;
            }
            return Action::None;
        }

        match key.code {
            KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => Action::Quit,
            KeyCode::Char('q') => Action::Quit,
            KeyCode::Char(digit @ '1'..='4') => {
                self.tab = TABS[digit as usize - '1' as usize];
                Action::None
            }
            KeyCode::Tab => {
                self.tab = TABS[(self.tab.index() + 1) % TABS.len()];
                Action::None
            }
            KeyCode::BackTab => {
                self.tab = TABS[(self.tab.index() + TABS.len() - 1) % TABS.len()];
                Action::None
            }
            KeyCode::Char('r') => {
                self.schedule.toggle(now);
                self.status = Some(self.schedule.label().to_owned());
                Action::Refresh
            }
            KeyCode::Char(']') => {
                self.period = self.period.next();
                self.selected = 0;
                Action::None
            }
            KeyCode::Char('[') => {
                self.period = self.period.prev();
                self.selected = 0;
                Action::None
            }
            KeyCode::Down | KeyCode::Char('j') if self.tab == Tab::Funnel => {
                let leads = self.funnel(wall).leads.len();
                self.selected = (self.selected + 1).min(leads.saturating_sub(1));
                Action::None
            }
            KeyCode::Up | KeyCode::Char('k') if self.tab == Tab::Funnel => {
                self.selected = self.selected.saturating_sub(1);
                Action::None
            }
            KeyCode::Enter if self.tab == Tab::Funnel => self
                .funnel(wall)
                .leads
                .get(self.selected)
                .cloned()
                .map_or(Action::None, Action::OpenLead),
            _ => Action::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::firestore::Document;
    use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
    use serde_json::json;

    fn key(code: KeyCode) -> KeyEvent {
        KeyEvent::new(code, KeyModifiers::NONE)
    }

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    fn doc(name: &str, at: &str, conversion: Option<serde_json::Value>) -> Document {
        let mut data = json!({"kind": if conversion.is_some() {"conversion"} else {"pageview"}, "at": at, "day": "2026-10-14",
                              "visitor": "v", "class": "human", "path": "/", "channel": "linkedin"});
        if let Some(c) = conversion {
            data["conversion"] = c;
        }
        Document {
            name: name.into(),
            data,
        }
    }

    #[test]
    fn merges_new_events_once_and_moves_the_cursor() {
        let mut log = EventLog::default();
        assert_eq!(
            log.merge(vec![
                doc("e/1", "2026-10-14T12:00:00.000Z", None),
                doc("e/2", "2026-10-14T12:00:01.500Z", None)
            ]),
            2
        );
        assert_eq!(
            log.merge(vec![doc("e/2", "2026-10-14T12:00:01.500Z", None)]),
            0
        );
        assert_eq!(log.cursor().as_deref(), Some("2026-10-14T12:00:01.500Z"));
        assert_eq!(
            log.recent(1)[0].at.to_rfc3339(),
            "2026-10-14T12:00:01.500+00:00"
        );
    }

    #[test]
    fn skips_documents_that_are_not_valid_events() {
        let mut log = EventLog::default();
        assert_eq!(
            log.merge(vec![Document {
                name: "e/x".into(),
                data: json!({"at": "ontem"})
            }]),
            0
        );
    }

    #[test]
    fn switches_tabs_with_numbers_and_tab() {
        let mut app = App::default();
        app.on_key(key(KeyCode::Char('3')), Instant::now(), now());
        assert_eq!(app.tab, Tab::Traffic);
        app.on_key(key(KeyCode::Tab), Instant::now(), now());
        assert_eq!(app.tab, Tab::Mcp);
        app.on_key(key(KeyCode::Tab), Instant::now(), now());
        assert_eq!(app.tab, Tab::Live);
    }

    #[test]
    fn toggles_the_fast_mode_and_steps_the_period() {
        let mut app = App::default();
        assert_eq!(
            app.on_key(key(KeyCode::Char('r')), Instant::now(), now()),
            Action::Refresh
        );
        assert_eq!(app.schedule.label(), "tempo real · 5 s");
        app.on_key(key(KeyCode::Char(']')), Instant::now(), now());
        assert_eq!(app.period, Period::Week);
        app.on_key(key(KeyCode::Char('[')), Instant::now(), now());
        assert_eq!(app.period, Period::Today);
    }

    #[test]
    fn quits_on_q_and_ctrl_c_but_q_first_closes_a_detail() {
        let mut app = App::default();
        assert_eq!(
            app.on_key(key(KeyCode::Char('q')), Instant::now(), now()),
            Action::Quit
        );
        assert_eq!(
            app.on_key(
                KeyEvent::new(KeyCode::Char('c'), KeyModifiers::CONTROL),
                Instant::now(),
                now()
            ),
            Action::Quit
        );

        app.detail = Some(crate::lead::LeadDetail {
            kind: "cv".into(),
            found: false,
            name: None,
            contact: None,
            brief: None,
            company: None,
            budget: None,
            entry: "direct".into(),
            pages: vec![],
        });
        assert_eq!(
            app.on_key(key(KeyCode::Char('q')), Instant::now(), now()),
            Action::None
        );
        assert!(app.detail.is_none());
    }

    #[test]
    fn opens_the_selected_lead_on_the_funnel_tab() {
        let mut app = App {
            tab: Tab::Funnel,
            ..App::default()
        };
        app.log.merge(vec![
            doc("e/1", "2026-10-14T12:00:00.000Z", None),
            doc(
                "e/2",
                "2026-10-14T12:01:00.000Z",
                Some(json!({"type": "cv", "refId": "cv-1"})),
            ),
        ]);

        match app.on_key(key(KeyCode::Enter), Instant::now(), now()) {
            Action::OpenLead(lead) => assert_eq!(lead.ref_id, "cv-1"),
            other => panic!("expected OpenLead, got {other:?}"),
        }
    }
}
