use crate::firestore::Document;
use crate::funnel::{Funnel, Lead, funnel};
use crate::lead::LeadDetail;
use crate::model::{Daily, Event};
use crate::period::{Period, today};
use crate::sales::{Sales, sales};
use crate::schedule::Schedule;
use crate::totals::{Totals, sum};
use chrono::{DateTime, Utc};
use crossterm::event::{Event as TermEvent, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use std::collections::{BTreeMap, HashSet};
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Tab {
    #[default]
    Live,
    Funnel,
    Traffic,
    Mcp,
    Sales,
}

pub const TAB_TITLES: [&str; 5] = ["Ao vivo", "Funil", "Tráfego", "MCP", "Vendas"];
const TABS: [Tab; 5] = [Tab::Live, Tab::Funnel, Tab::Traffic, Tab::Mcp, Tab::Sales];

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

/// Shown when ↑, ↓ or Enter are pressed outside the funnel, where they do nothing.
pub const ELSEWHERE_HINT: &str = "↑ ↓ e Enter escolhem um lead na aba 2 Funil";

/// What one terminal event means to the loop.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Input {
    Key(KeyEvent),
    /// A resize or focus change: draw again, nothing else.
    Redraw,
    Ignore,
    /// The terminal stream ended or failed: quit.
    Closed,
}

/// Every terminal event gets an answer. Matching only key presses in the
/// loop's `select!` would disable that branch on a resize until the next
/// refresh, leaving the keys dead for up to 30 s.
pub fn input_of(event: Option<std::io::Result<TermEvent>>) -> Input {
    match event {
        Some(Ok(TermEvent::Key(key))) if key.kind == KeyEventKind::Press => Input::Key(key),
        Some(Ok(TermEvent::Key(_))) => Input::Ignore,
        Some(Ok(_)) => Input::Redraw,
        Some(Err(_)) | None => Input::Closed,
    }
}

/// The daily documents to read on a refresh: today's, plus yesterday's once
/// right after midnight, so its last minutes are not lost.
pub fn days_to_refresh(last: Option<&str>, today: &str) -> Vec<String> {
    match last {
        Some(previous) if previous != today => vec![previous.to_owned(), today.to_owned()],
        _ => vec![today.to_owned()],
    }
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
    /// Whole minutes the fast mode has left, for the status bar; set by `sync`.
    pub fast_left_minutes: Option<u64>,
    /// Whole seconds to the next refresh, for the top-right countdown; set by `sync`.
    pub refresh_in_secs: u64,
}

impl App {
    /// Brings the clock-derived fields up to date before a draw.
    /// `next_refresh` is the loop's refresh deadline (schedule::Ticker).
    pub fn sync(&mut self, now: Instant, next_refresh: Instant) {
        self.fast_left_minutes = self
            .schedule
            .remaining(now)
            .map(|left| left.as_secs().div_ceil(60));
        self.refresh_in_secs = next_refresh
            .saturating_duration_since(now)
            .as_millis()
            .div_ceil(1000) as u64;
    }

    /// Distinct people (human visitor codes) seen today. `traffic.human` in
    /// the daily counter counts page views, not people.
    pub fn people_today(&self, now: DateTime<Utc>) -> usize {
        let day = today(now);
        self.log
            .events()
            .iter()
            .filter(|e| e.class == "human" && e.day == day)
            .map(|e| e.visitor.as_str())
            .collect::<HashSet<_>>()
            .len()
    }

    pub fn funnel(&self, now: DateTime<Utc>) -> Funnel {
        funnel(self.log.events(), &self.period.days(now))
    }

    /// The sales landing alone, over the period (raw events, so at most 30 days).
    pub fn sales(&self, now: DateTime<Utc>) -> Sales {
        sales(self.log.events(), &self.period.days(now))
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
        // A key press acknowledges whatever notice is on the status bar; an
        // error still there is set again by the next refresh that fails.
        self.status = None;

        if self.detail.is_some() {
            if matches!(key.code, KeyCode::Esc | KeyCode::Enter | KeyCode::Char('q')) {
                self.detail = None;
            }
            return Action::None;
        }

        match key.code {
            KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => Action::Quit,
            KeyCode::Char('q') => Action::Quit,
            KeyCode::Char(digit @ '1'..='5') => {
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
                // The loop reschedules right after this key; show the new interval meanwhile.
                self.sync(now, now + self.schedule.interval());
                self.status = Some(
                    if self.schedule.is_fast() {
                        "tempo real ligado: atualiza a cada 5 s por até 30 min"
                    } else {
                        "tempo real desligado: atualiza a cada 30 s"
                    }
                    .to_owned(),
                );
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
            KeyCode::Enter if self.tab == Tab::Funnel => {
                match self.funnel(wall).leads.get(self.selected).cloned() {
                    Some(lead) => Action::OpenLead(lead),
                    None => {
                        self.status =
                            Some(format!("nenhum lead para abrir em {}", self.period.label()));
                        Action::None
                    }
                }
            }
            KeyCode::Up | KeyCode::Down | KeyCode::Enter => {
                self.status = Some(ELSEWHERE_HINT.to_owned());
                Action::None
            }
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
        assert_eq!(app.tab, Tab::Sales);
        app.on_key(key(KeyCode::Tab), Instant::now(), now());
        assert_eq!(app.tab, Tab::Live);
        app.on_key(key(KeyCode::Char('5')), Instant::now(), now());
        assert_eq!(app.tab, Tab::Sales);
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

    #[test]
    fn turns_terminal_events_into_inputs() {
        use crossterm::event::{Event as TermEvent, KeyEventKind};
        let press = key(KeyCode::Char('q'));
        let mut release = press;
        release.kind = KeyEventKind::Release;

        assert_eq!(input_of(Some(Ok(TermEvent::Key(press)))), Input::Key(press));
        assert_eq!(input_of(Some(Ok(TermEvent::Key(release)))), Input::Ignore);
        assert_eq!(input_of(Some(Ok(TermEvent::Resize(80, 24)))), Input::Redraw);
        assert_eq!(input_of(Some(Ok(TermEvent::FocusGained))), Input::Redraw);
        assert_eq!(
            input_of(Some(Err(std::io::Error::other("tty")))),
            Input::Closed
        );
        assert_eq!(input_of(None), Input::Closed);
    }

    #[test]
    fn a_key_clears_a_notice_and_r_does_not_repeat_the_mode_in_the_status() {
        let mut app = App {
            status: Some("tempo real desligado após 30 min".into()),
            ..App::default()
        };
        app.on_key(key(KeyCode::Char('2')), Instant::now(), now());
        assert_eq!(app.status, None);

        app.on_key(key(KeyCode::Char('r')), Instant::now(), now());
        assert!(
            app.status
                .as_deref()
                .unwrap()
                .starts_with("tempo real ligado")
        );
        app.on_key(key(KeyCode::Char('r')), Instant::now(), now());
        assert!(
            app.status
                .as_deref()
                .unwrap()
                .starts_with("tempo real desligado")
        );
    }

    #[test]
    fn rereads_yesterday_once_after_midnight() {
        assert_eq!(
            days_to_refresh(Some("2026-10-14"), "2026-10-14"),
            vec!["2026-10-14"]
        );
        assert_eq!(
            days_to_refresh(Some("2026-10-14"), "2026-10-15"),
            vec!["2026-10-14", "2026-10-15"]
        );
        assert_eq!(days_to_refresh(None, "2026-10-15"), vec!["2026-10-15"]);
    }

    #[test]
    fn says_why_enter_does_nothing_without_leads() {
        let mut app = App {
            tab: Tab::Funnel,
            ..App::default()
        };
        assert_eq!(
            app.on_key(key(KeyCode::Enter), Instant::now(), now()),
            Action::None
        );
        assert_eq!(
            app.status.as_deref(),
            Some("nenhum lead para abrir em hoje")
        );
    }

    #[test]
    fn points_to_the_funnel_when_arrows_or_enter_are_pressed_elsewhere() {
        let mut app = App::default();
        for code in [KeyCode::Down, KeyCode::Up, KeyCode::Enter] {
            app.on_key(key(code), Instant::now(), now());
            assert_eq!(app.status.as_deref(), Some(ELSEWHERE_HINT));
        }
    }

    #[test]
    fn counts_down_the_minutes_left_in_the_fast_mode() {
        let start = Instant::now();
        let mut app = App::default();
        app.sync(start, start);
        assert_eq!(app.fast_left_minutes, None);

        app.on_key(key(KeyCode::Char('r')), start, now());
        app.sync(start + std::time::Duration::from_secs(61), start);
        assert_eq!(app.fast_left_minutes, Some(29));
    }

    #[test]
    fn counts_the_seconds_to_the_next_refresh_rounding_up() {
        let start = Instant::now();
        let mut app = App::default();
        app.sync(start, start + std::time::Duration::from_millis(29_200));
        assert_eq!(app.refresh_in_secs, 30);
        app.sync(start, start + std::time::Duration::from_secs(4));
        assert_eq!(app.refresh_in_secs, 4);
        app.sync(start + std::time::Duration::from_secs(9), start);
        assert_eq!(app.refresh_in_secs, 0);
    }

    #[test]
    fn counts_people_today_as_distinct_visitors_not_page_views() {
        let mut app = App::default();
        app.log.merge(vec![
            doc("e/1", "2026-10-14T12:00:00.000Z", None),
            doc("e/2", "2026-10-14T12:01:00.000Z", None),
            doc("e/3", "2026-10-14T12:02:00.000Z", None),
        ]);
        assert_eq!(app.people_today(now()), 1);
    }
}
