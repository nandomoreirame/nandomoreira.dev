use crate::keys::decode_counter_key;
use crate::model::{Daily, Event};
use std::collections::BTreeMap;
use std::collections::HashSet;

/// Groups whose keys are request-derived and stored through counterKey.
const ENCODED_GROUPS: [&str; 2] = ["pages", "outbound"];

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Totals {
    groups: BTreeMap<String, BTreeMap<String, i64>>,
}

/// The counters of several days added up (REQ-011, REQ-012).
pub fn sum(days: &[&Daily]) -> Totals {
    let mut groups: BTreeMap<String, BTreeMap<String, i64>> = BTreeMap::new();
    for day in days {
        for (group, counters) in &day.groups {
            let target = groups.entry(group.clone()).or_default();
            for (key, count) in counters {
                let key = if ENCODED_GROUPS.contains(&group.as_str()) {
                    decode_counter_key(key)
                } else {
                    key.clone()
                };
                *target.entry(key).or_default() += count;
            }
        }
    }
    Totals { groups }
}

impl Totals {
    pub fn get(&self, group: &str, key: &str) -> i64 {
        self.groups
            .get(group)
            .and_then(|counters| counters.get(key))
            .copied()
            .unwrap_or(0)
    }

    /// The `limit` largest counters of a group, largest first, ties by name.
    pub fn top(&self, group: &str, limit: usize) -> Vec<(String, i64)> {
        let mut entries: Vec<(String, i64)> = self
            .groups
            .get(group)
            .map(|counters| counters.iter().map(|(k, v)| (k.clone(), *v)).collect())
            .unwrap_or_default();
        entries.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
        entries.truncate(limit);
        entries
    }
}

/// Cities ranked by people (distinct visitor-days of humans) within `days`.
/// From the raw events: the city never reaches the daily counters, so this
/// covers at most the 30 days the events live.
pub fn cities(events: &[Event], days: &[String], limit: usize) -> Vec<(String, i64)> {
    let mut seen: HashSet<(&str, &str, String)> = HashSet::new();
    let mut counts: BTreeMap<String, i64> = BTreeMap::new();
    for event in events
        .iter()
        .filter(|e| e.class == "human" && days.contains(&e.day))
    {
        let Some(place) = event.place() else { continue };
        if seen.insert((&event.day, &event.visitor, place.clone())) {
            *counts.entry(place).or_default() += 1;
        }
    }
    let mut ranked: Vec<(String, i64)> = counts.into_iter().collect();
    ranked.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    ranked.truncate(limit);
    ranked
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn sums_days_and_ranks_with_decoded_keys() {
        let a = Daily::from_data(
            "2026-10-13",
            &json!({"pages": {"%2Flab": 2, "%2F": 5}, "channels": {"utm:linkedin": 1}}),
        );
        let b = Daily::from_data(
            "2026-10-14",
            &json!({"pages": {"%2Flab": 4}, "outbound": {"contato%2Fgithub": 3}}),
        );
        let totals = sum(&[&a, &b]);

        assert_eq!(
            totals.top("pages", 10),
            vec![("/lab".to_owned(), 6), ("/".to_owned(), 5)]
        );
        assert_eq!(
            totals.top("outbound", 10),
            vec![("contato/github".to_owned(), 3)]
        );
        assert_eq!(
            totals.top("channels", 10),
            vec![("utm:linkedin".to_owned(), 1)]
        );
        assert_eq!(totals.get("conversions", "mcp"), 0);
    }

    #[test]
    fn breaks_ties_by_name_and_honours_the_limit() {
        let day = Daily::from_data(
            "2026-10-14",
            &json!({"countries": {"US": 2, "BR": 2, "PT": 1}}),
        );
        assert_eq!(
            sum(&[&day]).top("countries", 2),
            vec![("BR".to_owned(), 2), ("US".to_owned(), 2)]
        );
    }

    #[test]
    fn ranks_cities_by_people_in_the_period_from_the_raw_events() {
        let event = |visitor: &str, day: &str, city: Option<&str>| {
            let mut data = json!({"kind": "pageview", "at": format!("{day}T12:00:00Z"), "day": day, "visitor": visitor,
                                  "class": "human", "path": "/", "channel": "direct"});
            if let Some(city) = city {
                data["city"] = json!(city);
                data["region"] = json!("São Paulo");
            }
            crate::model::Event::from_data(&data).unwrap()
        };
        let events = vec![
            event("a", "2026-10-14", Some("Embu das Artes")),
            event("a", "2026-10-14", Some("Embu das Artes")),
            event("b", "2026-10-14", Some("Embu das Artes")),
            event("c", "2026-10-14", Some("Campinas")),
            event("d", "2026-10-14", None),
            event("e", "2026-10-13", Some("Campinas")),
        ];

        assert_eq!(
            cities(&events, &["2026-10-14".to_owned()], 10),
            vec![
                ("Embu das Artes, São Paulo".to_owned(), 2),
                ("Campinas, São Paulo".to_owned(), 1)
            ]
        );
    }
}
