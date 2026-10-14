use crate::funnel::Lead;
use crate::model::Event;
use crate::period::clock;
use serde_json::Value;

/// What the author sees on Enter (REQ-013). Held in memory only.
#[derive(Debug, Clone, PartialEq)]
pub struct LeadDetail {
    pub kind: String,
    pub found: bool,
    pub name: Option<String>,
    pub contact: Option<String>,
    pub brief: Option<String>,
    pub company: Option<String>,
    pub budget: Option<String>,
    pub entry: String,
    /// (São Paulo time, path) of that visitor's pageviews that day.
    pub pages: Vec<(String, String)>,
}

pub fn collection_of(kind: &str) -> &'static str {
    if kind == "hire" {
        "hire_requests"
    } else {
        "cv_downloads"
    }
}

fn text(record: Option<&Value>, key: &str) -> Option<String> {
    record?.get(key)?.as_str().map(str::to_owned)
}

pub fn lead_detail(lead: &Lead, record: Option<&Value>, events: &[Event]) -> LeadDetail {
    let mut views: Vec<&Event> = events
        .iter()
        .filter(|e| e.kind == "pageview" && e.day == lead.day && e.visitor == lead.visitor)
        .collect();
    views.sort_by_key(|e| e.at);

    let hire = lead.kind == "hire";
    LeadDetail {
        kind: lead.kind.clone(),
        found: record.is_some(),
        name: text(record, if hire { "from" } else { "name" }),
        contact: text(record, if hire { "contact" } else { "email" }),
        brief: if hire { text(record, "brief") } else { None },
        company: if hire { text(record, "company") } else { None },
        budget: if hire { text(record, "budget") } else { None },
        entry: lead.entry.clone(),
        pages: views
            .iter()
            .map(|e| (clock(e.at), e.path.clone()))
            .collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn lead(kind: &str) -> Lead {
        Lead {
            at: "2026-10-14T12:03:00Z".parse().unwrap(),
            day: "2026-10-14".into(),
            visitor: "a".into(),
            kind: kind.into(),
            ref_id: "r-1".into(),
            entry: "linkedin".into(),
        }
    }

    fn view(visitor: &str, at: &str, path: &str) -> Event {
        Event {
            at: at.parse().unwrap(),
            day: "2026-10-14".into(),
            kind: "pageview".into(),
            visitor: visitor.into(),
            class: "human".into(),
            source: "ssr".into(),
            path: path.into(),
            channel: "internal".into(),
            country: None,
            conversion: None,
        }
    }

    #[test]
    fn shows_a_briefing_with_the_pages_of_that_visitor_and_day() {
        let record = json!({"from": "Ada", "contact": "ada@example.com", "brief": "Preciso de um MCP", "company": "ACME", "budget": "10k"});
        let events = [
            view("a", "2026-10-14T12:01:00Z", "/lab/forja"),
            view("a", "2026-10-14T12:00:00Z", "/"),
            view("b", "2026-10-14T12:00:00Z", "/x"),
        ];
        let detail = lead_detail(&lead("hire"), Some(&record), &events);

        assert!(detail.found);
        assert_eq!(detail.name.as_deref(), Some("Ada"));
        assert_eq!(detail.contact.as_deref(), Some("ada@example.com"));
        assert_eq!(detail.brief.as_deref(), Some("Preciso de um MCP"));
        assert_eq!(
            detail.pages,
            vec![
                ("09:00:00".to_owned(), "/".to_owned()),
                ("09:01:00".to_owned(), "/lab/forja".to_owned())
            ]
        );
    }

    #[test]
    fn reads_name_and_email_of_a_cv_download() {
        let detail = lead_detail(
            &lead("cv"),
            Some(&json!({"name": "Grace", "email": null})),
            &[],
        );
        assert_eq!(detail.name.as_deref(), Some("Grace"));
        assert_eq!(detail.contact, None);
        assert_eq!(collection_of("cv"), "cv_downloads");
        assert_eq!(collection_of("hire"), "hire_requests");
    }

    #[test]
    fn says_when_the_record_is_gone() {
        assert!(!lead_detail(&lead("cv"), None, &[]).found);
    }
}
