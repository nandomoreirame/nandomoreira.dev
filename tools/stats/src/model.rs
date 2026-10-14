use chrono::{DateTime, Utc};
use serde_json::Value;
use std::collections::BTreeMap;

/// docs/specs/lead-analytics/SPEC.md, Data Contract: `conversion`.
#[derive(Debug, Clone, PartialEq)]
pub struct Conversion {
    /// `type`: hire, cv, outbound or mcp.
    pub kind: String,
    pub target: Option<String>,
    pub ref_id: Option<String>,
    pub tool: Option<String>,
    pub client: Option<String>,
}

/// One `analytics_events` document.
#[derive(Debug, Clone, PartialEq)]
pub struct Event {
    pub at: DateTime<Utc>,
    pub day: String,
    pub kind: String,
    pub visitor: String,
    pub class: String,
    pub source: String,
    pub path: String,
    pub channel: String,
    pub country: Option<String>,
    /// Approximate, from Cloudflare (cf-ipcity); only on raw events.
    pub city: Option<String>,
    /// The state (cf-region).
    pub region: Option<String>,
    pub conversion: Option<Conversion>,
}

fn text(data: &Value, key: &str) -> Option<String> {
    data.get(key)?.as_str().map(str::to_owned)
}

impl Event {
    /// None when a required field is missing or `at` is not an instant: a
    /// hand-edited document is skipped, never a crash (spec Edge Cases).
    pub fn from_data(data: &Value) -> Option<Event> {
        let at = DateTime::parse_from_rfc3339(data.get("at")?.as_str()?)
            .ok()?
            .with_timezone(&Utc);
        let conversion = data
            .get("conversion")
            .filter(|c| c.is_object())
            .and_then(|c| {
                Some(Conversion {
                    kind: text(c, "type")?,
                    target: text(c, "target"),
                    ref_id: text(c, "refId"),
                    tool: text(c, "tool"),
                    client: text(c, "client"),
                })
            });

        Some(Event {
            at,
            day: text(data, "day")?,
            kind: text(data, "kind")?,
            visitor: text(data, "visitor")?,
            class: text(data, "class")?,
            source: text(data, "source").unwrap_or_default(),
            path: text(data, "path")?,
            channel: text(data, "channel").unwrap_or_else(|| "unknown".to_owned()),
            country: text(data, "country"),
            city: text(data, "city"),
            region: text(data, "region"),
            conversion,
        })
    }

    /// "City, State", or whichever of the two is known.
    pub fn place(&self) -> Option<String> {
        match (&self.city, &self.region) {
            (Some(city), Some(region)) => Some(format!("{city}, {region}")),
            (Some(only), None) | (None, Some(only)) => Some(only.clone()),
            (None, None) => None,
        }
    }

    pub fn is_conversion(&self, kinds: &[&str]) -> bool {
        self.conversion
            .as_ref()
            .is_some_and(|c| kinds.contains(&c.kind.as_str()))
    }
}

/// One `analytics_daily/<day>` document: counters by group. `mcp` nests one
/// level deeper, so its groups are `mcp.methods`, `mcp.tools`, `mcp.clients`.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Daily {
    pub day: String,
    pub groups: BTreeMap<String, BTreeMap<String, i64>>,
}

fn counters_of(value: &Value) -> BTreeMap<String, i64> {
    value
        .as_object()
        .map(|object| {
            object
                .iter()
                .filter_map(|(key, n)| Some((key.clone(), n.as_i64()?)))
                .collect()
        })
        .unwrap_or_default()
}

impl Daily {
    pub fn from_data(day: &str, data: &Value) -> Daily {
        let mut groups = BTreeMap::new();
        if let Some(object) = data.as_object() {
            for (group, value) in object {
                if group == "mcp" {
                    for (name, counters) in value.as_object().into_iter().flatten() {
                        groups.insert(format!("mcp.{name}"), counters_of(counters));
                    }
                } else if value.is_object() {
                    groups.insert(group.clone(), counters_of(value));
                }
            }
        }
        Daily {
            day: day.to_owned(),
            groups,
        }
    }

    pub fn get(&self, group: &str, key: &str) -> i64 {
        self.groups
            .get(group)
            .and_then(|counters| counters.get(key))
            .copied()
            .unwrap_or(0)
    }

    pub fn total(&self, group: &str) -> i64 {
        self.groups
            .get(group)
            .map(|counters| counters.values().sum())
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn data() -> Value {
        json!({
            "kind": "conversion", "at": "2026-10-14T18:25:46.305Z", "day": "2026-10-14",
            "visitor": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", "class": "human", "source": "api",
            "path": "/api/cv", "channel": "internal", "country": "BR", "utm": null,
            "conversion": {"type": "cv", "refId": "cv-1"}
        })
    }

    #[test]
    fn reads_an_event_and_its_conversion() {
        let event = Event::from_data(&data()).expect("valid event");

        assert_eq!(event.day, "2026-10-14");
        assert_eq!(event.class, "human");
        assert_eq!(event.country.as_deref(), Some("BR"));
        let conversion = event.conversion.expect("conversion");
        assert_eq!(conversion.kind, "cv");
        assert_eq!(conversion.ref_id.as_deref(), Some("cv-1"));
    }

    #[test]
    fn skips_an_event_without_a_usable_time() {
        let mut broken = data();
        broken["at"] = json!("ontem");
        assert!(Event::from_data(&broken).is_none());
        broken.as_object_mut().unwrap().remove("at");
        assert!(Event::from_data(&broken).is_none());
    }

    #[test]
    fn groups_daily_counters_and_nests_mcp_one_level_deeper() {
        let daily = Daily::from_data(
            "2026-10-14",
            &json!({
                "day": "2026-10-14", "expiresAt": "2028-10-15T02:59:59.999Z",
                "traffic": {"human": 3, "ai_agent": 1},
                "pages": {"%2F": 3},
                "mcp": {"methods": {"tools/list": 2}, "clients": {"claude-code": 1}}
            }),
        );

        assert_eq!(daily.get("traffic", "human"), 3);
        assert_eq!(daily.total("traffic"), 4);
        assert_eq!(daily.get("mcp.methods", "tools/list"), 2);
        assert_eq!(daily.get("mcp.clients", "claude-code"), 1);
        assert_eq!(daily.get("conversions", "cv"), 0);
        assert!(!daily.groups.contains_key("day"));
    }

    #[test]
    fn reads_the_city_and_state_and_names_the_place() {
        let mut with_place = data();
        with_place["city"] = json!("Curitiba");
        with_place["region"] = json!("Paraná");
        let event = Event::from_data(&with_place).unwrap();
        assert_eq!(event.place().as_deref(), Some("Curitiba, Paraná"));

        let without = Event::from_data(&data()).unwrap();
        assert_eq!(without.city, None);
        assert_eq!(without.place(), None);
    }
}
