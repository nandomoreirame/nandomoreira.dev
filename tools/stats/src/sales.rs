//! The sales landing (contrate.nandomoreira.dev, served from /servicos) read
//! on its own: who arrived there, from where, and how many of them acted.

use crate::funnel::entry_channel;
use crate::model::Event;
use std::collections::BTreeMap;

pub const STAGES: [&str; 3] = ["Chegou", "Agiu", "Virou lead"];

/// The outbound target of the floating WhatsApp button (`/go/contato/whatsapp`).
pub const WHATSAPP: &str = "contato/whatsapp";

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Sales {
    /// Visits (day, visitor) of people that saw a sales page.
    pub people: usize,
    /// Pageviews of people on the sales pages.
    pub pageviews: usize,
    /// Visits that clicked the WhatsApp button.
    pub whatsapp: usize,
    /// Visits per stage; a later stage implies the earlier ones.
    pub stages: [usize; 3],
    /// Visits by the channel they arrived from, largest first.
    pub channels: Vec<(String, i64)>,
    /// Pageviews by sales page, largest first.
    pub pages: Vec<(String, i64)>,
}

/// `/servicos` and `/servicos/<slug>`: the paths the sales pages are recorded under.
pub fn is_sales_page(path: &str) -> bool {
    path == "/servicos" || path.starts_with("/servicos/")
}

fn ranked(counts: BTreeMap<String, i64>) -> Vec<(String, i64)> {
    let mut rows: Vec<(String, i64)> = counts.into_iter().collect();
    rows.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    rows
}

/// Same visit unit as the funnel (REQ-007): one (day, visitor) pair of a
/// person within `days`, kept only when it saw a sales page. Acting is a
/// click out (WhatsApp or any /go) or a brief; a lead is a brief.
pub fn sales(events: &[Event], days: &[String]) -> Sales {
    let mut visits: BTreeMap<(&str, &str), Vec<&Event>> = BTreeMap::new();
    for event in events
        .iter()
        .filter(|e| e.class == "human" && days.contains(&e.day))
    {
        visits
            .entry((&event.day, &event.visitor))
            .or_default()
            .push(event);
    }

    let mut out = Sales::default();
    let mut channels: BTreeMap<String, i64> = BTreeMap::new();
    let mut pages: BTreeMap<String, i64> = BTreeMap::new();
    for mut visit in visits.into_values() {
        visit.sort_by_key(|event| event.at);
        let views: Vec<&&Event> = visit
            .iter()
            .filter(|e| e.kind == "pageview" && is_sales_page(&e.path))
            .collect();
        if views.is_empty() {
            continue;
        }

        out.people += 1;
        out.pageviews += views.len();
        for view in views {
            *pages.entry(view.path.clone()).or_default() += 1;
        }
        *channels.entry(entry_channel(&visit)).or_default() += 1;

        let whatsapp = visit.iter().any(|e| {
            e.is_conversion(&["outbound"])
                && e.conversion.as_ref().and_then(|c| c.target.as_deref()) == Some(WHATSAPP)
        });
        let lead = visit.iter().any(|e| e.is_conversion(&["hire"]));
        let acted = lead || visit.iter().any(|e| e.is_conversion(&["outbound"]));
        out.whatsapp += usize::from(whatsapp);
        for (stage, reached) in [true, acted, lead].into_iter().enumerate() {
            out.stages[stage] += usize::from(reached);
        }
    }

    out.channels = ranked(channels);
    out.pages = ranked(pages);
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn event(visitor: &str, at: &str, kind: &str, path: &str, channel: &str) -> Event {
        Event::from_data(
            &json!({"kind": kind, "at": at, "day": &at[..10], "visitor": visitor,
                                 "class": "human", "path": path, "channel": channel}),
        )
        .unwrap()
    }

    fn conversion(visitor: &str, at: &str, kind: &str, target: Option<&str>) -> Event {
        let mut data = json!({"kind": "conversion", "at": at, "day": &at[..10], "visitor": visitor,
                              "class": "human", "path": "/api/hire", "channel": "internal",
                              "conversion": {"type": kind}});
        if let Some(target) = target {
            data["conversion"]["target"] = json!(target);
            data["path"] = json!(format!("/go/{target}"));
        }
        Event::from_data(&data).unwrap()
    }

    fn days() -> Vec<String> {
        vec!["2026-10-18".to_owned()]
    }

    #[test]
    fn recognises_the_sales_paths_only() {
        assert!(is_sales_page("/servicos"));
        assert!(is_sales_page("/servicos/site-institucional"));
        assert!(!is_sales_page("/"));
        assert!(!is_sales_page("/servicosx"));
    }

    #[test]
    fn counts_only_the_visits_that_saw_a_sales_page() {
        let events = vec![
            event(
                "a",
                "2026-10-18T10:00:00Z",
                "pageview",
                "/servicos",
                "linkedin",
            ),
            event(
                "a",
                "2026-10-18T10:01:00Z",
                "pageview",
                "/servicos/site-institucional",
                "internal",
            ),
            event("b", "2026-10-18T11:00:00Z", "pageview", "/", "google"),
            event(
                "b",
                "2026-10-18T11:00:30Z",
                "pageview",
                "/sobre",
                "internal",
            ),
        ];
        let out = sales(&events, &days());
        assert_eq!(out.people, 1);
        assert_eq!(out.pageviews, 2);
        assert_eq!(out.stages, [1, 0, 0]);
        assert_eq!(
            out.pages,
            vec![
                ("/servicos".to_owned(), 1),
                ("/servicos/site-institucional".to_owned(), 1)
            ]
        );
        assert_eq!(out.channels, vec![("linkedin".to_owned(), 1)]);
    }

    #[test]
    fn follows_a_visit_from_the_landing_to_whatsapp_and_the_brief() {
        let events = vec![
            event(
                "a",
                "2026-10-18T10:00:00Z",
                "pageview",
                "/servicos",
                "direct",
            ),
            conversion("a", "2026-10-18T10:02:00Z", "outbound", Some(WHATSAPP)),
            event(
                "b",
                "2026-10-18T12:00:00Z",
                "pageview",
                "/servicos",
                "google",
            ),
            conversion("b", "2026-10-18T12:05:00Z", "hire", None),
            event(
                "c",
                "2026-10-18T13:00:00Z",
                "pageview",
                "/servicos",
                "google",
            ),
            // A brief from someone who never saw the landing is not a sales lead.
            conversion("d", "2026-10-18T14:00:00Z", "hire", None),
        ];
        let out = sales(&events, &days());
        assert_eq!(out.people, 3);
        assert_eq!(out.whatsapp, 1);
        assert_eq!(out.stages, [3, 2, 1]);
        assert_eq!(
            out.channels,
            vec![("google".to_owned(), 2), ("direct".to_owned(), 1)]
        );
    }

    #[test]
    fn leaves_out_robots_and_days_outside_the_period() {
        let mut robot = event(
            "r",
            "2026-10-18T10:00:00Z",
            "pageview",
            "/servicos",
            "direct",
        );
        robot.class = "search_crawler".to_owned();
        let events = vec![
            robot,
            event(
                "a",
                "2026-10-17T10:00:00Z",
                "pageview",
                "/servicos",
                "direct",
            ),
        ];
        assert_eq!(sales(&events, &days()), Sales::default());
    }
}
