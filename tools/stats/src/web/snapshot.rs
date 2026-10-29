//! What a view shows, computed from the server's memory (stats-web REQ-006):
//! the same lib functions the TUI calls, over the slice's days and the
//! filtered events. The filter narrows the raw events only; the daily
//! counters have no channel or city per visit.

use super::store::Store;
use crate::funnel::{Funnel, funnel};
use crate::model::{Daily, Event};
use crate::sales::{Sales, sales};
use crate::scope::{Coverage, coverage, filter_events};
use crate::series::{Point, daily_points};
use crate::totals::{Totals, cities, sum};
use crate::view::View;
use chrono::{DateTime, Utc};
use std::collections::HashSet;

/// Rows in the event feed.
pub const FEED: usize = 50;
/// Rows in each ranking.
pub const RANK: usize = 15;

#[derive(Debug, Clone, PartialEq)]
pub struct Snapshot {
    /// Distinct (day, visitor) pairs of people: one per person per day.
    pub people: usize,
    pub funnel: Funnel,
    pub sales: Sales,
    pub totals: Totals,
    pub cities: Vec<(String, i64)>,
    pub feed: Vec<Event>,
    pub series: Vec<Point>,
    pub coverage: Coverage,
}

pub fn snapshot(store: &Store, view: &View, now: DateTime<Utc>) -> Snapshot {
    let days = view.range.days();
    let in_range: HashSet<&str> = days.iter().map(String::as_str).collect();
    let events = filter_events(
        store.log.events(),
        view.channel.as_deref(),
        view.city.as_deref(),
    );
    let dailies: Vec<&Daily> = days
        .iter()
        .filter_map(|day| store.dailies.get(day))
        .collect();
    let people = events
        .iter()
        .filter(|e| e.class == "human" && in_range.contains(e.day.as_str()))
        .map(|e| (e.day.as_str(), e.visitor.as_str()))
        .collect::<HashSet<_>>()
        .len();
    Snapshot {
        people,
        funnel: funnel(&events, &days),
        sales: sales(&events, &days),
        totals: sum(&dailies),
        cities: cities(&events, &days, RANK),
        feed: events
            .iter()
            .rev()
            .filter(|e| in_range.contains(e.day.as_str()))
            .take(FEED)
            .cloned()
            .collect(),
        series: daily_points(&days, &store.dailies),
        coverage: coverage(&view.range, now),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app::App;
    use crate::demo::DemoWorld;
    use crate::period::Period;
    use crate::range::{Range, Span, today_date};
    use crate::view::View;
    use crate::web::store::Store;
    use chrono::{DateTime, Utc};

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    fn last30() -> View {
        let today = today_date(now());
        View::today(today).with_range(Range::around(Span::Last30, today, today), today)
    }

    #[test]
    fn matches_the_tui_for_the_same_data() {
        let mut app = App {
            period: Period::Month,
            ..App::default()
        };
        DemoWorld::new(now()).load(&mut app);
        let store = Store::demo(now());

        let month = snapshot(&store, &last30(), now());
        assert_eq!(month.funnel, app.funnel(now()));
        assert_eq!(month.sales, app.sales(now()));
        assert_eq!(month.totals, app.totals(now()));

        app.period = Period::Today;
        let day = snapshot(&store, &View::today(today_date(now())), now());
        assert_eq!(day.people, app.people_today(now()));
        assert_eq!(day.funnel, app.funnel(now()));
    }

    #[test]
    fn a_channel_filter_narrows_the_events_but_not_the_daily_counters() {
        let store = Store::demo(now());
        let all = snapshot(&store, &last30(), now());
        let channel = all.funnel.by_channel.keys().next().unwrap().clone();
        let only = snapshot(&store, &last30().with_channel(Some(channel.clone())), now());
        assert!(only.funnel.total[0] < all.funnel.total[0]);
        assert_eq!(only.totals, all.totals);
        assert!(only.feed.iter().all(|e| e.channel == channel));
    }

    #[test]
    fn the_feed_is_newest_first_capped_and_inside_the_slice() {
        let store = Store::demo(now());
        let feed = snapshot(&store, &last30(), now()).feed;
        assert_eq!(feed.len(), FEED);
        assert!(feed.windows(2).all(|pair| pair[0].at >= pair[1].at));
        let today = snapshot(&store, &View::today(today_date(now())), now()).feed;
        assert!(today.iter().all(|e| e.day == "2026-10-14"));
    }
}
