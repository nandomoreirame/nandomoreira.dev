//! What one page of the web panel shows, read from and written back to the
//! query string (stats-web REQ-010): tab, slice and the optional channel or
//! city filter. Anything malformed is an error for a 400, never a guess.

use crate::range::{Range, Span};
use chrono::NaiveDate;
use std::collections::BTreeMap;

/// Longest channel or city accepted from the URL.
const MAX_FILTER: usize = 80;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Tab {
    #[default]
    Live,
    Funnel,
    Traffic,
    Mcp,
    Sales,
}

pub const TABS: [Tab; 5] = [Tab::Live, Tab::Funnel, Tab::Traffic, Tab::Mcp, Tab::Sales];

impl Tab {
    pub fn slug(self) -> &'static str {
        match self {
            Tab::Live => "live",
            Tab::Funnel => "funnel",
            Tab::Traffic => "traffic",
            Tab::Mcp => "mcp",
            Tab::Sales => "sales",
        }
    }

    pub fn title(self) -> &'static str {
        match self {
            Tab::Live => "Ao vivo",
            Tab::Funnel => "Funil",
            Tab::Traffic => "Tráfego",
            Tab::Mcp => "MCP",
            Tab::Sales => "Vendas",
        }
    }

    pub fn from_slug(slug: &str) -> Option<Tab> {
        TABS.into_iter().find(|tab| tab.slug() == slug)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct View {
    pub tab: Tab,
    pub range: Range,
    /// A past calendar slice keeps its date in the URL; the current one does
    /// not, so "today" and "this week" move on at midnight.
    pub pinned: bool,
    pub channel: Option<String>,
    pub city: Option<String>,
}

fn date(params: &BTreeMap<String, String>, key: &str) -> Result<Option<NaiveDate>, String> {
    match params.get(key).map(String::as_str) {
        None | Some("") => Ok(None),
        Some(text) => NaiveDate::parse_from_str(text, "%Y-%m-%d")
            .map(Some)
            .map_err(|_| format!("data inválida em {key}: use AAAA-MM-DD")),
    }
}

fn filter(params: &BTreeMap<String, String>, key: &str) -> Result<Option<String>, String> {
    match params.get(key).map(|value| value.trim()) {
        None | Some("") => Ok(None),
        Some(value)
            if value.chars().count() > MAX_FILTER || value.chars().any(char::is_control) =>
        {
            Err(format!("filtro inválido em {key}"))
        }
        Some(value) => Ok(Some(value.to_owned())),
    }
}

fn iso(day: NaiveDate) -> String {
    day.format("%Y-%m-%d").to_string()
}

impl View {
    pub fn today(today: NaiveDate) -> View {
        View {
            tab: Tab::Live,
            range: Range::around(Span::Day, today, today),
            pinned: false,
            channel: None,
            city: None,
        }
    }

    pub fn parse(params: &BTreeMap<String, String>, today: NaiveDate) -> Result<View, String> {
        let tab = match params.get("tab") {
            None => Tab::Live,
            Some(slug) => {
                Tab::from_slug(slug).ok_or_else(|| format!("aba desconhecida: {slug}"))?
            }
        };
        let span = match params.get("span") {
            None => Span::Day,
            Some(slug) => {
                Span::from_slug(slug).ok_or_else(|| format!("período desconhecido: {slug}"))?
            }
        };
        let range = if span == Span::Custom {
            let (Some(from), Some(to)) = (date(params, "from")?, date(params, "to")?) else {
                return Err("intervalo livre precisa de from e to".to_owned());
            };
            Range::custom(from, to, today)?
        } else {
            let at = date(params, "at")?.unwrap_or(today);
            if at > today {
                return Err(format!("{} está no futuro", at.format("%d/%m/%Y")));
            }
            Range::around(span, at, today)
        };
        Ok(View {
            tab,
            range,
            pinned: range.span.is_calendar() && range.to < today,
            channel: filter(params, "channel")?,
            city: filter(params, "city")?,
        })
    }

    /// The query string that reproduces this view, keys in a fixed order.
    pub fn query(&self) -> String {
        let mut query = form_urlencoded::Serializer::new(String::new());
        query.append_pair("tab", self.tab.slug());
        query.append_pair("span", self.range.span.slug());
        if self.range.span == Span::Custom {
            query.append_pair("from", &iso(self.range.from));
            query.append_pair("to", &iso(self.range.to));
        } else if self.pinned {
            query.append_pair("at", &iso(self.range.from));
        }
        if let Some(channel) = &self.channel {
            query.append_pair("channel", channel);
        }
        if let Some(city) = &self.city {
            query.append_pair("city", city);
        }
        query.finish()
    }

    pub fn href(&self) -> String {
        format!("/?{}", self.query())
    }

    pub fn with_tab(&self, tab: Tab) -> View {
        View {
            tab,
            ..self.clone()
        }
    }

    pub fn with_range(&self, range: Range, today: NaiveDate) -> View {
        View {
            range,
            pinned: range.span.is_calendar() && range.to < today,
            ..self.clone()
        }
    }

    pub fn with_channel(&self, channel: Option<String>) -> View {
        View {
            channel,
            ..self.clone()
        }
    }

    pub fn with_city(&self, city: Option<String>) -> View {
        View {
            city,
            ..self.clone()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::range::{Range, Span};
    use chrono::NaiveDate;
    use std::collections::BTreeMap;

    fn d(iso: &str) -> NaiveDate {
        iso.parse().unwrap()
    }

    const TODAY: &str = "2026-10-28";

    fn params(query: &str) -> BTreeMap<String, String> {
        form_urlencoded::parse(query.as_bytes())
            .into_owned()
            .collect()
    }

    fn parse(query: &str) -> Result<View, String> {
        View::parse(&params(query), d(TODAY))
    }

    #[test]
    fn an_empty_query_is_today_on_the_live_tab() {
        let view = parse("").unwrap();
        assert_eq!(view, View::today(d(TODAY)));
        assert_eq!(view.query(), "tab=live&span=day");
    }

    #[test]
    fn a_past_slice_keeps_its_anchor_and_round_trips() {
        let view = parse("tab=funnel&span=week&at=2026-10-21").unwrap();
        assert_eq!(view.tab, Tab::Funnel);
        assert_eq!(
            (view.range.from, view.range.to),
            (d("2026-10-19"), d("2026-10-25"))
        );
        assert_eq!(view.query(), "tab=funnel&span=week&at=2026-10-19");
        assert_eq!(parse(&view.query()).unwrap(), view);
    }

    #[test]
    fn the_current_slice_drops_its_anchor_so_it_moves_at_midnight() {
        let view = parse("span=month&at=2026-10-05").unwrap();
        assert!(!view.pinned);
        assert_eq!(view.query(), "tab=live&span=month");
    }

    #[test]
    fn a_free_range_needs_both_ends_and_is_validated() {
        let view = parse("span=custom&from=2026-09-01&to=2026-10-15").unwrap();
        assert_eq!(
            view.query(),
            "tab=live&span=custom&from=2026-09-01&to=2026-10-15"
        );
        assert!(
            parse("span=custom&from=2026-09-01")
                .unwrap_err()
                .contains("from e to")
        );
        assert!(parse("span=custom&from=2026-10-15&to=2026-09-01").is_err());
    }

    #[test]
    fn rejects_what_it_cannot_read() {
        assert!(parse("tab=admin").unwrap_err().contains("aba desconhecida"));
        assert!(
            parse("span=year")
                .unwrap_err()
                .contains("período desconhecido")
        );
        assert!(parse("at=2026-13-40").unwrap_err().contains("AAAA-MM-DD"));
        assert!(parse("at=2027-01-01").unwrap_err().contains("futuro"));
        assert!(
            parse("channel=a%0Ab")
                .unwrap_err()
                .contains("filtro inválido")
        );
        assert!(parse(&format!("city={}", "x".repeat(81))).is_err());
    }

    #[test]
    fn filters_are_encoded_and_come_back_unchanged() {
        let view = parse("channel=a%26b+c&city=%3Cscript%3E").unwrap();
        assert_eq!(view.channel.as_deref(), Some("a&b c"));
        assert_eq!(view.city.as_deref(), Some("<script>"));
        assert!(view.query().ends_with("channel=a%26b+c&city=%3Cscript%3E"));
        assert_eq!(parse(&view.query()).unwrap(), view);
    }

    #[test]
    fn moving_to_another_slice_pins_it_only_when_it_is_past() {
        let today = d(TODAY);
        let view = View::today(today);
        let yesterday = Range::around(Span::Day, d("2026-10-27"), today);
        assert!(view.with_range(yesterday, today).pinned);
        assert!(
            !view
                .with_range(Range::around(Span::Day, today, today), today)
                .pinned
        );
        assert_eq!(view.with_tab(Tab::Sales).href(), "/?tab=sales&span=day");
        assert_eq!(
            view.with_channel(Some("linkedin".into())).href(),
            "/?tab=live&span=day&channel=linkedin"
        );
    }
}
