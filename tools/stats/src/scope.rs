//! The raw events a view asks for (stats-web REQ-011, REQ-013): the channel
//! or city filter, and how much of the slice the 30 days of raw events still
//! cover.

use crate::model::Event;
use crate::period::Period;
use crate::range::Range;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Coverage {
    Full,
    Partial,
    None,
}

pub fn coverage(range: &Range, now: DateTime<Utc>) -> Coverage {
    let window = Period::Month.days(now);
    let days = range.days();
    let inside = days.iter().filter(|day| window.contains(day)).count();
    if inside == days.len() {
        Coverage::Full
    } else if inside == 0 {
        Coverage::None
    } else {
        Coverage::Partial
    }
}

/// The events of `channel` and of the place `city` ("City, ST", as
/// `Event::place` prints it in the ranking); None keeps every event.
pub fn filter_events(events: &[Event], channel: Option<&str>, city: Option<&str>) -> Vec<Event> {
    events
        .iter()
        .filter(|event| channel.is_none_or(|channel| event.channel == channel))
        .filter(|event| city.is_none_or(|city| event.place().as_deref() == Some(city)))
        .cloned()
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Event;
    use crate::range::{Range, Span};
    use chrono::{DateTime, NaiveDate, Utc};
    use serde_json::json;

    fn now() -> DateTime<Utc> {
        "2026-10-28T15:00:00Z".parse().unwrap()
    }

    fn d(iso: &str) -> NaiveDate {
        iso.parse().unwrap()
    }

    fn event(channel: &str, city: Option<&str>, region: Option<&str>) -> Event {
        Event::from_data(&json!({
            "kind": "pageview", "at": "2026-10-28T12:00:00.000Z", "day": "2026-10-28",
            "visitor": "v", "class": "human", "path": "/", "channel": channel,
            "country": "BR", "city": city, "region": region,
        }))
        .unwrap()
    }

    #[test]
    fn tells_how_much_of_a_slice_the_raw_events_cover() {
        let today = d("2026-10-28");
        let last30 = Range::around(Span::Last30, today, today);
        assert_eq!(coverage(&last30, now()), Coverage::Full);
        // 29 and 30 September are inside the 30-day window, the rest is not.
        let september = Range::around(Span::Month, d("2026-09-10"), today);
        assert_eq!(coverage(&september, now()), Coverage::Partial);
        let august = Range::around(Span::Month, d("2026-08-10"), today);
        assert_eq!(coverage(&august, now()), Coverage::None);
    }

    #[test]
    fn filters_by_channel_and_by_place_as_the_ranking_prints_it() {
        let events = vec![
            event("linkedin", Some("Curitiba"), Some("Paraná")),
            event("direct", Some("Curitiba"), Some("Paraná")),
            event("linkedin", Some("Recife"), Some("Pernambuco")),
        ];
        assert_eq!(filter_events(&events, None, None).len(), 3);
        assert_eq!(filter_events(&events, Some("linkedin"), None).len(), 2);
        assert_eq!(filter_events(&events, None, Some("Curitiba, PR")).len(), 2);
        assert_eq!(
            filter_events(&events, Some("linkedin"), Some("Curitiba, PR")).len(),
            1
        );
        assert!(filter_events(&events, Some("bluesky"), None).is_empty());
    }
}
