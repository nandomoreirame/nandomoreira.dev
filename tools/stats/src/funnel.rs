use crate::model::Event;
use crate::pages::is_evidence;
use chrono::{DateTime, Utc};
use std::collections::BTreeMap;

pub const STAGES: [&str; 4] = ["Chegou", "Viu evidência", "Agiu", "Virou lead"];

#[derive(Debug, Clone, PartialEq)]
pub struct Lead {
    pub at: DateTime<Utc>,
    pub day: String,
    pub visitor: String,
    /// cv or hire.
    pub kind: String,
    pub ref_id: String,
    pub entry: String,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Funnel {
    pub total: [usize; 4],
    pub by_channel: BTreeMap<String, [usize; 4]>,
    /// Newest first.
    pub leads: Vec<Lead>,
}

/// Share of the previous stage, in whole percent.
pub fn pass_rate(counts: &[usize; 4], stage: usize) -> Option<u32> {
    let previous = *counts.get(stage.checked_sub(1)?)?;
    (previous > 0).then(|| ((counts[stage] * 100 + previous / 2) / previous) as u32)
}

/// REQ-009: the channel of the visit's first pageview that did not come from
/// inside the site; with none, direct.
pub(crate) fn entry_channel(visit: &[&Event]) -> String {
    visit
        .iter()
        .find(|event| event.kind == "pageview" && event.channel != "internal")
        .map(|event| event.channel.clone())
        .unwrap_or_else(|| "direct".to_owned())
}

/// REQ-007: one visit is one (day, visitor) pair of a person within `days`. A
/// visit reaches a stage when it did that stage or any later one, so counts
/// never grow down the funnel.
pub fn funnel(events: &[Event], days: &[String]) -> Funnel {
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

    let mut out = Funnel::default();
    for ((day, visitor), mut visit) in visits {
        visit.sort_by_key(|event| event.at);
        let lead = visit.iter().any(|e| e.is_conversion(&["cv", "hire"]));
        let acted = lead || visit.iter().any(|e| e.is_conversion(&["outbound"]));
        let evidence = acted
            || visit
                .iter()
                .any(|e| e.kind == "pageview" && is_evidence(&e.path));
        let arrived = evidence || visit.iter().any(|e| e.kind == "pageview");
        if !arrived {
            continue;
        }

        let entry = entry_channel(&visit);
        let row = out.by_channel.entry(entry.clone()).or_insert([0; 4]);
        for (stage, reached) in [arrived, evidence, acted, lead].into_iter().enumerate() {
            if reached {
                out.total[stage] += 1;
                row[stage] += 1;
            }
        }

        for event in visit.iter().filter(|e| e.is_conversion(&["cv", "hire"])) {
            let conversion = event.conversion.as_ref().expect("checked above");
            if let Some(ref_id) = &conversion.ref_id {
                out.leads.push(Lead {
                    at: event.at,
                    day: day.to_owned(),
                    visitor: visitor.to_owned(),
                    kind: conversion.kind.clone(),
                    ref_id: ref_id.clone(),
                    entry: entry.clone(),
                });
            }
        }
    }

    out.leads.sort_by_key(|lead| std::cmp::Reverse(lead.at));
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Conversion;

    fn event(
        visitor: &str,
        at: &str,
        kind: &str,
        path: &str,
        channel: &str,
        conversion: Option<(&str, &str)>,
    ) -> Event {
        Event {
            at: at.parse().unwrap(),
            day: "2026-10-14".into(),
            kind: kind.into(),
            visitor: visitor.into(),
            class: "human".into(),
            source: "ssr".into(),
            path: path.into(),
            channel: channel.into(),
            country: Some("BR".into()),
            city: None,
            region: None,
            conversion: conversion.map(|(kind, reference)| Conversion {
                kind: kind.into(),
                target: None,
                ref_id: (!reference.is_empty()).then(|| reference.into()),
                tool: None,
                client: None,
            }),
        }
    }

    fn days() -> Vec<String> {
        vec!["2026-10-14".into()]
    }

    #[test]
    fn counts_each_stage_cumulatively_and_by_entry_channel() {
        let events = vec![
            // a: arrives from LinkedIn, reads a case, clicks the repo, downloads the CV.
            event(
                "a",
                "2026-10-14T12:00:00Z",
                "pageview",
                "/",
                "linkedin",
                None,
            ),
            event(
                "a",
                "2026-10-14T12:01:00Z",
                "pageview",
                "/lab/forja",
                "internal",
                None,
            ),
            event(
                "a",
                "2026-10-14T12:02:00Z",
                "conversion",
                "/go/lab/forja/repo",
                "internal",
                Some(("outbound", "")),
            ),
            event(
                "a",
                "2026-10-14T12:03:00Z",
                "conversion",
                "/api/cv",
                "internal",
                Some(("cv", "cv-1")),
            ),
            // b: arrives from Google and leaves from the home page.
            event("b", "2026-10-14T13:00:00Z", "pageview", "/", "google", None),
            // c: reads a post, from nowhere in particular.
            event(
                "c",
                "2026-10-14T14:00:00Z",
                "pageview",
                "/um-post",
                "direct",
                None,
            ),
        ];

        let funnel = funnel(&events, &days());

        assert_eq!(funnel.total, [3, 2, 1, 1]);
        assert_eq!(funnel.by_channel["linkedin"], [1, 1, 1, 1]);
        assert_eq!(funnel.by_channel["google"], [1, 0, 0, 0]);
        assert_eq!(funnel.leads.len(), 1);
        assert_eq!(funnel.leads[0].ref_id, "cv-1");
        assert_eq!(funnel.leads[0].entry, "linkedin");
    }

    #[test]
    fn a_lead_who_went_straight_to_the_form_still_arrived() {
        let events = vec![event(
            "d",
            "2026-10-14T15:00:00Z",
            "conversion",
            "/api/hire",
            "direct",
            Some(("hire", "h-1")),
        )];
        assert_eq!(funnel(&events, &days()).total, [1, 1, 1, 1]);
    }

    #[test]
    fn leaves_agents_and_other_days_out() {
        let mut agent = event("e", "2026-10-14T16:00:00Z", "pageview", "/", "direct", None);
        agent.class = "ai_agent".into();
        let mut yesterday = event("f", "2026-10-13T16:00:00Z", "pageview", "/", "direct", None);
        yesterday.day = "2026-10-13".into();

        assert_eq!(funnel(&[agent, yesterday], &days()).total, [0, 0, 0, 0]);
    }

    #[test]
    fn takes_the_first_arrival_from_outside_as_the_entry() {
        let events = vec![
            event(
                "g",
                "2026-10-14T10:05:00Z",
                "pageview",
                "/sobre",
                "internal",
                None,
            ),
            event(
                "g",
                "2026-10-14T10:00:00Z",
                "pageview",
                "/",
                "bluesky",
                None,
            ),
        ];
        assert!(funnel(&events, &days()).by_channel.contains_key("bluesky"));

        let inside_only = vec![event(
            "h",
            "2026-10-14T10:00:00Z",
            "pageview",
            "/",
            "internal",
            None,
        )];
        assert!(
            funnel(&inside_only, &days())
                .by_channel
                .contains_key("direct")
        );
    }

    #[test]
    fn rounds_the_pass_rate_and_has_none_for_the_first_stage() {
        assert_eq!(pass_rate(&[3, 2, 1, 1], 0), None);
        assert_eq!(pass_rate(&[3, 2, 1, 1], 1), Some(67));
        assert_eq!(pass_rate(&[0, 0, 0, 0], 1), None);
    }
}
