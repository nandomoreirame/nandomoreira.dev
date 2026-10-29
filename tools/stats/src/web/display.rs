//! Everything a page prints, already formatted (stats-web): the templates
//! only loop and print, and askama escapes every value (REQ-005). Links to
//! the site, to filters and to lead pages are built here, from the view.

use super::snapshot::{RANK, Snapshot};
use super::store::Store;
use crate::funnel::{STAGES, pass_rate};
use crate::model::Event;
use crate::period::clock;
use crate::range::{Range, Span, today_date};
use crate::sales::STAGES as SALES_STAGES;
use crate::scope::Coverage;
use crate::series::{WEEKLY_ABOVE, chart_points};
use crate::svg::series_svg;
use crate::view::{TABS, View};
use chrono::{DateTime, NaiveDate, Utc};
use tokio::time::Instant;

pub const SITE: &str = "https://nandomoreira.dev";
pub const PARTIAL: &str = "parte do período passa dos 30 dias de eventos brutos: funil, vendas, cidades e eventos mostram só o que está dentro deles";
pub const OUTSIDE: &str = "período fora dos 30 dias de eventos brutos: funil, vendas, cidades e eventos ficam vazios; cartões, tráfego, MCP e a série vêm dos contadores diários";

#[derive(Debug, Clone, PartialEq)]
pub struct Link {
    pub label: String,
    pub href: String,
    pub current: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Card {
    pub label: String,
    pub value: i64,
    pub hot: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Ranked {
    pub label: String,
    pub count: i64,
    /// Bar length in tenths, for the `w-0` to `w-10` classes (no inline style, so the CSP stays strict).
    pub bucket: u8,
    pub site: Option<String>,
    pub filter: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FeedRow {
    pub day: String,
    pub time: String,
    pub class: String,
    pub visitor: String,
    pub path: String,
    pub site: Option<String>,
    pub channel: String,
    pub channel_filter: String,
    pub place: String,
    pub place_filter: Option<String>,
    pub conversion: String,
    pub lead: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Stage {
    pub label: &'static str,
    pub count: usize,
    pub rate: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ChannelRow {
    pub channel: String,
    pub filter: String,
    pub arrived: usize,
    pub evidence: usize,
    pub acted: usize,
    pub lead: usize,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LeadRow {
    pub day: String,
    pub time: String,
    pub kind: String,
    pub entry: String,
    pub href: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SeriesRow {
    pub label: String,
    pub humans: i64,
    pub agents: i64,
    pub leads: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Filter {
    pub label: String,
    pub clear: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Nav {
    pub label: String,
    pub prev: Option<String>,
    pub next: Option<String>,
    pub spans: Vec<Link>,
    /// The span the "ir para" date keeps: the calendar one in use, or day.
    pub span: &'static str,
    pub at: String,
    pub from: String,
    pub to: String,
    pub max: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Display {
    pub title: String,
    pub tab: &'static str,
    pub query: String,
    pub tabs: Vec<Link>,
    pub nav: Nav,
    pub filters: Vec<Filter>,
    pub channel: Option<String>,
    pub city: Option<String>,
    pub error: Option<String>,
    pub notice: Option<String>,
    pub coverage: Option<&'static str>,
    /// Minutes the fast mode has left, when on.
    pub fast: Option<u64>,
    pub status: String,
    pub cards: Vec<Card>,
    pub chart: String,
    pub series_unit: &'static str,
    pub series: Vec<SeriesRow>,
    pub feed: Vec<FeedRow>,
    pub stages: Vec<Stage>,
    pub by_channel: Vec<ChannelRow>,
    pub leads: Vec<LeadRow>,
    pub pages: Vec<Ranked>,
    pub channels: Vec<Ranked>,
    pub countries: Vec<Ranked>,
    pub cities: Vec<Ranked>,
    pub outbound: Vec<Ranked>,
    pub mcp_cards: Vec<Card>,
    pub tools: Vec<Ranked>,
    pub clients: Vec<Ranked>,
    pub methods: Vec<Ranked>,
    pub sales_cards: Vec<Card>,
    pub sales_stages: Vec<Stage>,
    pub sales_channels: Vec<Ranked>,
    pub sales_pages: Vec<Ranked>,
}

/// A site path to open in another tab. Only absolute paths and never
/// `//host`, so a stored path can never send the click anywhere else.
pub fn site_href(path: &str) -> Option<String> {
    (path.starts_with('/') && !path.starts_with("//")).then(|| format!("{SITE}{path}"))
}

pub fn lead_href(kind: &str, ref_id: &str) -> String {
    let query = form_urlencoded::Serializer::new(String::new())
        .append_pair("kind", kind)
        .append_pair("ref", ref_id)
        .finish();
    format!("/lead?{query}")
}

pub(crate) fn bucket(count: i64, max: i64) -> u8 {
    if count <= 0 {
        0
    } else {
        ((count * 10 + max - 1) / max).clamp(1, 10) as u8
    }
}

fn ranked(
    rows: Vec<(String, i64)>,
    site: bool,
    filter: Option<&dyn Fn(&str) -> String>,
) -> Vec<Ranked> {
    let max = rows.iter().map(|(_, n)| *n).max().unwrap_or(1).max(1);
    rows.into_iter()
        .map(|(label, count)| Ranked {
            bucket: bucket(count, max),
            site: if site { site_href(&label) } else { None },
            filter: filter.map(|make| make(&label)),
            count,
            label,
        })
        .collect()
}

pub(crate) fn card(label: &str, value: i64, conversion: bool) -> Card {
    Card {
        label: label.to_owned(),
        value,
        hot: conversion && value > 0,
    }
}

fn conversion_label(event: &Event) -> String {
    let Some(conversion) = &event.conversion else {
        return String::new();
    };
    match (
        conversion.kind.as_str(),
        &conversion.target,
        &conversion.tool,
    ) {
        ("mcp", _, Some(tool)) => format!("mcp {tool}"),
        (kind, Some(target), _) => format!("{kind} {target}"),
        (kind, _, _) => kind.to_owned(),
    }
}

fn day_month(day: &str) -> String {
    day.parse::<NaiveDate>()
        .map(|date| date.format("%d/%m").to_string())
        .unwrap_or_else(|_| day.to_owned())
}

fn rate(count: usize, previous: usize) -> String {
    match (count * 100).checked_div(previous) {
        Some(percent) => format!("{percent}% da anterior"),
        None => "—".to_owned(),
    }
}

fn iso(day: NaiveDate) -> String {
    day.format("%Y-%m-%d").to_string()
}

fn nav(view: &View, today: NaiveDate) -> Nav {
    let range = view.range;
    let spans = [
        ("dia", Span::Day),
        ("semana", Span::Week),
        ("mês", Span::Month),
        ("7 dias", Span::Last7),
        ("30 dias", Span::Last30),
    ];
    Nav {
        label: range.label(),
        prev: range
            .previous(today)
            .map(|next| view.with_range(next, today).href()),
        next: range
            .next(today)
            .map(|next| view.with_range(next, today).href()),
        spans: spans
            .into_iter()
            .map(|(label, span)| Link {
                label: label.to_owned(),
                href: view
                    .with_range(Range::around(span, range.to, today), today)
                    .href(),
                current: range.span == span,
            })
            .collect(),
        span: if range.span.is_calendar() {
            range.span.slug()
        } else {
            "day"
        },
        at: iso(range.from),
        from: iso(range.from),
        to: iso(range.to),
        max: iso(today),
    }
}

fn feed_row(event: &Event, view: &View) -> FeedRow {
    let place = event.place();
    let lead = event
        .conversion
        .as_ref()
        .filter(|c| matches!(c.kind.as_str(), "cv" | "hire"))
        .and_then(|c| c.ref_id.as_deref().map(|id| lead_href(&c.kind, id)));
    FeedRow {
        day: day_month(&event.day),
        time: clock(event.at),
        class: event.class.clone(),
        visitor: event.visitor.chars().take(6).collect(),
        path: event.path.clone(),
        site: site_href(&event.path),
        channel: event.channel.clone(),
        channel_filter: view.with_channel(Some(event.channel.clone())).href(),
        place_filter: place
            .as_ref()
            .map(|name| view.with_city(Some(name.clone())).href()),
        place: place.or_else(|| event.country.clone()).unwrap_or_default(),
        conversion: conversion_label(event),
        lead,
    }
}

pub fn build(
    snap: &Snapshot,
    view: &View,
    store: &Store,
    now: DateTime<Utc>,
    instant: Instant,
) -> Display {
    let today = today_date(now);
    let channel_filter = |name: &str| view.with_channel(Some(name.to_owned())).href();
    let city_filter = |name: &str| view.with_city(Some(name.to_owned())).href();
    let totals = &snap.totals;
    let sales = &snap.sales;
    let single = view.range.from == view.range.to;
    let messages: i64 = totals
        .top("mcp.methods", usize::MAX)
        .iter()
        .map(|(_, count)| count)
        .sum();
    let filters = [
        view.channel.as_ref().map(|name| Filter {
            label: format!("canal: {name}"),
            clear: view.with_channel(None).href(),
        }),
        view.city.as_ref().map(|name| Filter {
            label: format!("local: {name}"),
            clear: view.with_city(None).href(),
        }),
    ];
    Display {
        title: format!("{} · {}", view.tab.title(), view.range.label()),
        tab: view.tab.slug(),
        query: view.query(),
        tabs: TABS
            .iter()
            .map(|tab| Link {
                label: tab.title().to_owned(),
                href: view.with_tab(*tab).href(),
                current: *tab == view.tab,
            })
            .collect(),
        nav: nav(view, today),
        filters: filters.into_iter().flatten().collect(),
        channel: view.channel.clone(),
        city: view.city.clone(),
        error: store.error.clone(),
        notice: store.notice.clone(),
        coverage: match snap.coverage {
            Coverage::Full => None,
            Coverage::Partial => Some(PARTIAL),
            Coverage::None => Some(OUTSIDE),
        },
        fast: store
            .fast_until
            .map(|end| {
                end.saturating_duration_since(instant)
                    .as_secs()
                    .div_ceil(60)
            })
            .filter(|minutes| *minutes > 0),
        status: match store.refreshed_at {
            Some(at) => format!("atualizado às {}", clock(at)),
            None => "carregando…".to_owned(),
        },
        cards: vec![
            card(
                if single { "Pessoas" } else { "Visitas" },
                snap.people as i64,
                false,
            ),
            card("Páginas vistas", totals.get("traffic", "human"), false),
            card("Agentes", totals.get("traffic", "ai_agent"), false),
            card(
                "Robôs",
                totals.get("traffic", "search_crawler") + totals.get("traffic", "other_bot"),
                false,
            ),
            card(
                "Cliques no /go",
                totals.get("conversions", "outbound"),
                true,
            ),
            card(
                "Leads",
                totals.get("conversions", "cv") + totals.get("conversions", "hire"),
                true,
            ),
            card("Tools MCP", totals.get("conversions", "mcp"), true),
        ],
        chart: if single {
            String::new()
        } else {
            series_svg(
                &chart_points(&snap.series),
                &format!("Páginas vistas, agentes e leads · {}", view.range.label()),
            )
        },
        series_unit: if snap.series.len() > WEEKLY_ABOVE {
            "semana"
        } else {
            "dia"
        },
        series: snap
            .series
            .iter()
            .map(|point| SeriesRow {
                label: point.label.clone(),
                humans: point.humans,
                agents: point.agents,
                leads: point.leads,
            })
            .collect(),
        feed: snap
            .feed
            .iter()
            .map(|event| feed_row(event, view))
            .collect(),
        stages: STAGES
            .into_iter()
            .enumerate()
            .map(|(index, label)| Stage {
                label,
                count: snap.funnel.total[index],
                rate: if index == 0 {
                    String::new()
                } else {
                    pass_rate(&snap.funnel.total, index)
                        .map_or("—".to_owned(), |value| format!("{value}% da anterior"))
                },
            })
            .collect(),
        by_channel: snap
            .funnel
            .by_channel
            .iter()
            .map(|(name, counts)| ChannelRow {
                channel: name.clone(),
                filter: channel_filter(name),
                arrived: counts[0],
                evidence: counts[1],
                acted: counts[2],
                lead: counts[3],
            })
            .collect(),
        leads: snap
            .funnel
            .leads
            .iter()
            .map(|lead| LeadRow {
                day: day_month(&lead.day),
                time: clock(lead.at),
                kind: lead.kind.clone(),
                entry: lead.entry.clone(),
                href: lead_href(&lead.kind, &lead.ref_id),
            })
            .collect(),
        pages: ranked(totals.top("pages", RANK), true, None),
        channels: ranked(totals.top("channels", RANK), false, Some(&channel_filter)),
        countries: ranked(totals.top("countries", RANK), false, None),
        cities: ranked(snap.cities.clone(), false, Some(&city_filter)),
        outbound: ranked(totals.top("outbound", RANK), false, None),
        mcp_cards: vec![
            card("Chamadas de tool", totals.get("conversions", "mcp"), false),
            card("Mensagens MCP", messages, false),
            card(
                "Clientes distintos",
                totals.top("mcp.clients", usize::MAX).len() as i64,
                false,
            ),
        ],
        tools: ranked(totals.top("mcp.tools", RANK), false, None),
        clients: ranked(totals.top("mcp.clients", RANK), false, None),
        methods: ranked(totals.top("mcp.methods", RANK), false, None),
        sales_cards: vec![
            card(
                if single {
                    "Pessoas na landing"
                } else {
                    "Visitas na landing"
                },
                sales.people as i64,
                false,
            ),
            card("Páginas vistas", sales.pageviews as i64, false),
            card("Cliques no WhatsApp", sales.whatsapp as i64, true),
            card("Leads", sales.stages[2] as i64, true),
        ],
        sales_stages: SALES_STAGES
            .into_iter()
            .enumerate()
            .map(|(index, label)| Stage {
                label,
                count: sales.stages[index],
                rate: if index == 0 {
                    String::new()
                } else {
                    rate(sales.stages[index], sales.stages[index - 1])
                },
            })
            .collect(),
        sales_channels: ranked(sales.channels.clone(), false, Some(&channel_filter)),
        sales_pages: ranked(sales.pages.clone(), true, None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::range::{Range, Span, today_date};
    use crate::view::View;
    use crate::web::snapshot::snapshot;
    use crate::web::store::Store;
    use chrono::{DateTime, NaiveDate, Utc};
    use tokio::time::Instant;

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    fn show(view: &View) -> Display {
        let store = Store::demo(now());
        build(
            &snapshot(&store, view, now()),
            view,
            &store,
            now(),
            Instant::now(),
        )
    }

    fn today() -> NaiveDate {
        today_date(now())
    }

    #[test]
    fn links_only_to_paths_of_the_site() {
        assert_eq!(
            site_href("/sobre").as_deref(),
            Some("https://nandomoreira.dev/sobre")
        );
        assert_eq!(site_href("//evil.com/x"), None);
        assert_eq!(site_href("https://evil.com"), None);
        assert_eq!(lead_href("cv", "a&b"), "/lead?kind=cv&ref=a%26b");
    }

    #[test]
    fn marks_the_current_tab_and_span_and_never_steps_past_today() {
        let d = show(&View::today(today()));
        assert!(
            d.tabs
                .iter()
                .find(|t| t.label == "Ao vivo")
                .unwrap()
                .current
        );
        assert!(
            d.nav
                .spans
                .iter()
                .find(|s| s.label == "dia")
                .unwrap()
                .current
        );
        assert_eq!(d.nav.next, None);
        assert_eq!(
            d.nav.prev.as_deref(),
            Some("/?tab=live&span=day&at=2026-10-13")
        );
        assert_eq!(d.nav.max, "2026-10-14");
    }

    #[test]
    fn a_single_day_has_no_chart_and_a_longer_slice_has_one() {
        assert!(show(&View::today(today())).chart.is_empty());
        let month =
            View::today(today()).with_range(Range::around(Span::Last30, today(), today()), today());
        let d = show(&month);
        assert!(d.chart.starts_with("<svg"));
        assert_eq!(d.series.len(), 30);
        assert_eq!(d.series_unit, "dia");
        assert_eq!(d.cards[0].label, "Visitas");
    }

    #[test]
    fn filters_show_with_a_way_to_clear_them() {
        let d = show(&View::today(today()).with_channel(Some("linkedin".into())));
        assert_eq!(d.filters.len(), 1);
        assert_eq!(d.filters[0].label, "canal: linkedin");
        assert_eq!(d.filters[0].clear, "/?tab=live&span=day");
    }

    #[test]
    fn warns_when_the_slice_leaves_the_raw_events() {
        let august = View::today(today()).with_range(
            Range::around(Span::Month, "2026-08-10".parse().unwrap(), today()),
            today(),
        );
        assert_eq!(show(&august).coverage, Some(OUTSIDE));
        assert_eq!(show(&View::today(today())).coverage, None);
    }

    #[test]
    fn only_conversions_above_zero_are_highlighted() {
        assert!(!card("Leads", 0, true).hot);
        assert!(card("Leads", 2, true).hot);
        assert!(!card("Agentes", 9, false).hot);
        assert_eq!(
            (bucket(0, 5), bucket(5, 5), bucket(1, 10), bucket(3, 10)),
            (0, 10, 1, 3)
        );
    }

    #[test]
    fn rankings_link_pages_to_the_site_and_channels_to_a_filter() {
        let month =
            View::today(today()).with_range(Range::around(Span::Last30, today(), today()), today());
        let d = show(&month);
        assert!(
            d.pages
                .iter()
                .all(|r| r.site.as_deref().is_some_and(|h| h.starts_with(SITE)))
        );
        assert!(
            d.channels
                .iter()
                .all(|r| r.filter.as_deref().is_some_and(|h| h.contains("channel=")))
        );
        assert!(
            d.cities
                .iter()
                .all(|r| r.filter.as_deref().is_some_and(|h| h.contains("city=")))
        );
        assert!(d.leads.iter().all(|l| l.href.starts_with("/lead?kind=")));
    }
}
