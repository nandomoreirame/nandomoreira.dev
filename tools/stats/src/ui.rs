use crate::app::{App, TAB_TITLES, Tab};
use crate::bignum::{big_number, big_width};
use crate::funnel::{STAGES, pass_rate};
use crate::lead::LeadDetail;
use crate::model::Event;
use crate::period::clock;
use crate::theme::Theme;
use chrono::{DateTime, Utc};
use ratatui::Frame;
use ratatui::layout::{Alignment, Constraint, Layout, Margin, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, BorderType, Clear, Padding, Paragraph, Row, Table, Wrap};

/// The headline cards of the live tab, in order.
const HEADLINE: [&str; 7] = [
    "Pessoas hoje",
    "Páginas vistas",
    "Agentes",
    "Robôs",
    "Cliques no /go",
    "Leads",
    "Tools MCP",
];

const HELP: &str = "1-4 abas · r tempo real · [ ] período · Enter lead · q sai";
/// Width of the bar beside a ranked counter.
const BAR: usize = 16;

pub fn draw(frame: &mut Frame, app: &App, now: DateTime<Utc>, theme: &Theme) {
    frame.render_widget(
        Block::new().style(Style::new().fg(theme.fg).bg(theme.bg)),
        frame.area(),
    );

    // Breathing room around everything, and a blank line under the header.
    let area = frame.area().inner(Margin::new(2, 1));
    let [header, _, body, _, status] = Layout::vertical([
        Constraint::Length(1),
        Constraint::Length(1),
        Constraint::Min(0),
        Constraint::Length(1),
        Constraint::Length(1),
    ])
    .areas(area);

    let countdown = countdown_line(app, theme);
    let [tabs, clock_area] = Layout::horizontal([
        Constraint::Min(0),
        Constraint::Length(countdown.width() as u16),
    ])
    .areas(header);
    frame.render_widget(Paragraph::new(header_line(app, theme)), tabs);
    frame.render_widget(
        Paragraph::new(countdown).alignment(Alignment::Right),
        clock_area,
    );
    match app.tab {
        Tab::Live => draw_live(frame, body, app, now, theme),
        Tab::Funnel => draw_funnel(frame, body, app, now, theme),
        Tab::Traffic => draw_traffic(frame, body, app, now, theme),
        Tab::Mcp => draw_mcp(frame, body, app, now, theme),
    }
    frame.render_widget(Paragraph::new(status_line(app, theme)), status);

    if let Some(detail) = &app.detail {
        draw_detail(frame, detail, theme);
    }
}

/// The app name, then the tabs as pills: the active one filled in amber.
fn header_line(app: &App, theme: &Theme) -> Line<'static> {
    let mut spans = vec![
        Span::styled(
            " nandomoreira.dev ",
            Style::new().fg(theme.accent).add_modifier(Modifier::BOLD),
        ),
        Span::raw("   "),
    ];
    for (i, title) in TAB_TITLES.iter().enumerate() {
        let style = if i == app.tab.index() {
            Style::new()
                .fg(theme.bg)
                .bg(theme.accent)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::new().fg(theme.muted).bg(theme.surface)
        };
        spans.push(Span::styled(format!(" {} {title} ", i + 1), style));
        spans.push(Span::raw(" "));
    }
    Line::from(spans)
}

/// Seconds to the next refresh, top right: amber in the fast mode.
fn countdown_line(app: &App, theme: &Theme) -> Line<'static> {
    let style = if app.fast_left_minutes.is_some() {
        Style::new().fg(theme.accent).add_modifier(Modifier::BOLD)
    } else {
        Style::new().fg(theme.muted)
    };
    Line::from(Span::styled(
        format!("Atualização em: {}s ", app.refresh_in_secs),
        style,
    ))
}

/// The refresh mode leads the status bar: in the fast mode it is a filled
/// amber badge with the minutes left, so turning it on is visible at once.
fn status_line(app: &App, theme: &Theme) -> Line<'static> {
    let mode = match app.fast_left_minutes {
        Some(minutes) => Span::styled(
            format!(" ● TEMPO REAL · 5 s · desliga em {minutes} min "),
            Style::new()
                .fg(theme.bg)
                .bg(theme.accent)
                .add_modifier(Modifier::BOLD),
        ),
        None => Span::styled(
            " atualiza a cada 30 s ",
            Style::new().fg(theme.muted).bg(theme.surface),
        ),
    };
    let period = Span::styled(
        format!("  {}  ", app.period.label()),
        Style::new().fg(theme.muted),
    );
    let message = match &app.status {
        Some(notice) => Span::styled(notice.clone(), Style::new().fg(theme.accent)),
        None => Span::styled(HELP, Style::new().fg(theme.muted)),
    };
    Line::from(vec![mode, period, message])
}

/// A rounded panel with a bold title and room inside.
fn panel(title: &str, theme: &Theme) -> Block<'static> {
    Block::bordered()
        .border_type(BorderType::Rounded)
        .border_style(Style::new().fg(theme.surface))
        .title(
            Line::from(format!(" {title} "))
                .style(Style::new().fg(theme.fg).add_modifier(Modifier::BOLD)),
        )
        .padding(Padding::new(2, 2, 1, 0))
}

/// A headline number: big digits centred in a rounded card, amber when it
/// highlights a conversion, with an optional caption under it.
fn card(
    frame: &mut Frame,
    area: Rect,
    label: &str,
    value: i64,
    highlight: bool,
    caption: Option<String>,
    theme: &Theme,
) {
    let block = Block::bordered()
        .border_type(BorderType::Rounded)
        .border_style(Style::new().fg(if highlight {
            theme.accent
        } else {
            theme.surface
        }))
        .title(Line::from(format!(" {label} ")).style(Style::new().fg(theme.muted)))
        .padding(Padding::top(1));
    let inner = block.inner(area);
    frame.render_widget(block, area);

    let colour = if highlight { theme.accent } else { theme.fg };
    let mut lines: Vec<Line> = if big_width(value) <= inner.width as usize {
        big_number(value).into_iter().map(Line::from).collect()
    } else {
        vec![Line::from(value.to_string()).style(Style::new().add_modifier(Modifier::BOLD))]
    };
    if let Some(caption) = caption {
        lines.push(Line::from(caption).style(Style::new().fg(theme.muted)));
    }
    frame.render_widget(
        Paragraph::new(lines)
            .alignment(Alignment::Center)
            .style(Style::new().fg(colour)),
        inner,
    );
}

fn conversion_label(event: &Event) -> String {
    match &event.conversion {
        Some(c) => match (&c.tool, &c.target) {
            (Some(tool), _) => format!("{} {tool}", c.kind),
            (None, Some(target)) => format!("{} {target}", c.kind),
            _ => c.kind.clone(),
        },
        None => String::new(),
    }
}

fn header_row(cells: Vec<String>, theme: &Theme) -> Row<'static> {
    Row::new(cells)
        .style(Style::new().fg(theme.muted))
        .bottom_margin(1)
}

fn draw_live(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let [cards, _, feed] = Layout::vertical([
        Constraint::Length(7),
        Constraint::Length(1),
        Constraint::Min(0),
    ])
    .areas(area);
    let count = |group: &str, key: &str| app.today(now).map_or(0, |d| d.get(group, key));
    let leads = count("conversions", "cv") + count("conversions", "hire");
    let headline: [(&str, i64, bool); HEADLINE.len()] = [
        ("Pessoas hoje", app.people_today(now) as i64, false),
        ("Páginas vistas", count("traffic", "human"), false),
        ("Agentes", count("traffic", "ai_agent"), false),
        (
            "Robôs",
            count("traffic", "search_crawler") + count("traffic", "other_bot"),
            false,
        ),
        ("Cliques no /go", count("conversions", "outbound"), true),
        ("Leads", leads, true),
        ("Tools MCP", count("conversions", "mcp"), true),
    ];
    let slots = Layout::horizontal([Constraint::Ratio(1, HEADLINE.len() as u32); HEADLINE.len()])
        .spacing(1)
        .split(cards);
    for ((label, value, conversion), slot) in headline.into_iter().zip(slots.iter()) {
        card(
            frame,
            *slot,
            label,
            value,
            conversion && value > 0,
            None,
            theme,
        );
    }

    let rows = app
        .log
        .recent(feed.height.saturating_sub(5) as usize)
        .into_iter()
        .map(|e| {
            let style = if e.conversion.is_some() {
                Style::new().fg(theme.accent)
            } else {
                Style::new().fg(theme.fg)
            };
            Row::new(vec![
                clock(e.at),
                e.class.clone(),
                e.visitor.chars().take(6).collect(),
                e.path.clone(),
                e.channel.clone(),
                e.place().or_else(|| e.country.clone()).unwrap_or_default(),
                conversion_label(e),
            ])
            .style(style)
        });
    let widths = [
        Constraint::Length(8),
        Constraint::Length(8),
        Constraint::Length(6),
        Constraint::Min(28),
        Constraint::Length(14),
        Constraint::Length(26),
        Constraint::Length(24),
    ];
    let head = header_row(
        [
            "hora",
            "classe",
            "visit.",
            "página",
            "canal",
            "local",
            "conversão",
        ]
        .map(str::to_owned)
        .to_vec(),
        theme,
    );
    frame.render_widget(
        Table::new(rows, widths)
            .header(head)
            .column_spacing(2)
            .block(panel("Eventos", theme)),
        feed,
    );
}

fn draw_funnel(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let funnel = app.funnel(now);
    let [cards, _, bottom] = Layout::vertical([
        Constraint::Length(8),
        Constraint::Length(1),
        Constraint::Min(0),
    ])
    .areas(area);

    let slots = Layout::horizontal([Constraint::Ratio(1, 4); 4])
        .spacing(1)
        .split(cards);
    for (i, stage) in STAGES.iter().enumerate() {
        let caption = match pass_rate(&funnel.total, i) {
            _ if i == 0 => format!("visitas · {}", app.period.label()),
            Some(rate) => format!("{rate}% da anterior"),
            None => "—".to_owned(),
        };
        let value = funnel.total[i] as i64;
        card(
            frame,
            slots[i],
            stage,
            value,
            i == STAGES.len() - 1 && value > 0,
            Some(caption),
            theme,
        );
    }

    let [channels, leads] =
        Layout::horizontal([Constraint::Percentage(55), Constraint::Percentage(45)])
            .spacing(2)
            .areas(bottom);

    let channel_rows = funnel.by_channel.iter().map(|(channel, counts)| {
        let mut cells = vec![channel.clone()];
        cells.extend(counts.iter().map(usize::to_string));
        Row::new(cells)
    });
    let mut head = vec!["canal".to_owned()];
    head.extend(STAGES.iter().map(|s| s.to_string()));
    frame.render_widget(
        Table::new(
            channel_rows,
            [
                Constraint::Length(14),
                Constraint::Length(8),
                Constraint::Length(14),
                Constraint::Length(6),
                Constraint::Length(11),
            ],
        )
        .header(header_row(head, theme))
        .column_spacing(2)
        .block(panel("Por canal de chegada", theme)),
        channels,
    );

    if funnel.leads.is_empty() {
        let message = format!(
            "nenhum lead em {}: aparece aqui quem baixar o CV ou mandar briefing",
            app.period.label()
        );
        frame.render_widget(
            Paragraph::new(message)
                .style(Style::new().fg(theme.muted))
                .wrap(Wrap { trim: true })
                .block(panel("Leads", theme)),
            leads,
        );
        return;
    }
    let lead_rows = funnel.leads.iter().enumerate().map(|(i, lead)| {
        let style = if i == app.selected {
            Style::new()
                .fg(theme.bg)
                .bg(theme.accent)
                .add_modifier(Modifier::BOLD)
        } else {
            Style::new().fg(theme.fg)
        };
        Row::new(vec![
            lead.day.clone(),
            clock(lead.at),
            lead.kind.clone(),
            lead.entry.clone(),
        ])
        .style(style)
    });
    frame.render_widget(
        Table::new(
            lead_rows,
            [
                Constraint::Length(10),
                Constraint::Length(8),
                Constraint::Length(5),
                Constraint::Min(10),
            ],
        )
        .header(header_row(
            ["dia", "hora", "tipo", "canal"].map(str::to_owned).to_vec(),
            theme,
        ))
        .column_spacing(2)
        .block(panel("Leads · ↑ ↓ e Enter", theme)),
        leads,
    );
}

/// The largest counters of a group, each with a bar scaled to the largest.
fn ranking(frame: &mut Frame, area: Rect, title: &str, rows: Vec<(String, i64)>, theme: &Theme) {
    if rows.is_empty() {
        frame.render_widget(
            Paragraph::new("nada no período")
                .style(Style::new().fg(theme.muted))
                .block(panel(title, theme)),
            area,
        );
        return;
    }
    let max = rows
        .iter()
        .map(|(_, count)| *count)
        .max()
        .unwrap_or(1)
        .max(1);
    let rows = rows.into_iter().map(|(key, count)| {
        let filled = ((count as usize * BAR).div_ceil(max as usize)).max(1);
        let bar = Line::from(vec![
            Span::styled("█".repeat(filled), Style::new().fg(theme.accent)),
            Span::styled("█".repeat(BAR - filled), Style::new().fg(theme.surface)),
        ]);
        Row::new(vec![Line::from(key), bar, Line::from(count.to_string())])
    });
    frame.render_widget(
        Table::new(
            rows,
            [
                Constraint::Min(14),
                Constraint::Length(BAR as u16),
                Constraint::Length(6),
            ],
        )
        .column_spacing(2)
        .block(panel(title, theme)),
        area,
    );
}

fn draw_traffic(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let totals = app.totals(now);
    let [top, bottom] = Layout::vertical([Constraint::Percentage(50), Constraint::Percentage(50)])
        .spacing(1)
        .areas(area);
    let [pages, channels] =
        Layout::horizontal([Constraint::Percentage(60), Constraint::Percentage(40)])
            .spacing(2)
            .areas(top);
    let [countries, cities_area, outbound] = Layout::horizontal([
        Constraint::Percentage(22),
        Constraint::Percentage(38),
        Constraint::Percentage(40),
    ])
    .spacing(2)
    .areas(bottom);
    let limit = top.height.saturating_sub(3) as usize;
    let period = app.period.label();
    ranking(
        frame,
        pages,
        &format!("Páginas · {period}"),
        totals.top("pages", limit),
        theme,
    );
    ranking(
        frame,
        channels,
        "Canais",
        totals.top("channels", limit),
        theme,
    );
    ranking(
        frame,
        countries,
        "Países",
        totals.top("countries", limit),
        theme,
    );
    // Cities come from the raw events (30 days), not the daily counters.
    ranking(
        frame,
        cities_area,
        "Cidades · pessoas",
        crate::totals::cities(app.log.events(), &app.period.days(now), limit),
        theme,
    );
    ranking(
        frame,
        outbound,
        "Destinos do /go",
        totals.top("outbound", limit),
        theme,
    );
}

fn draw_mcp(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let totals = app.totals(now);
    let [cards, _, lists] = Layout::vertical([
        Constraint::Length(7),
        Constraint::Length(1),
        Constraint::Min(0),
    ])
    .areas(area);

    let calls = totals.get("conversions", "mcp");
    let messages: i64 = totals
        .top("mcp.methods", usize::MAX)
        .iter()
        .map(|(_, n)| n)
        .sum();
    let clients = totals.top("mcp.clients", usize::MAX).len() as i64;
    let [a, b, c] = Layout::horizontal([Constraint::Ratio(1, 3); 3])
        .spacing(1)
        .areas(cards);
    card(
        frame,
        a,
        &format!("Chamadas de tool · {}", app.period.label()),
        calls,
        calls > 0,
        None,
        theme,
    );
    card(frame, b, "Mensagens MCP", messages, false, None, theme);
    card(frame, c, "Clientes distintos", clients, false, None, theme);

    let [tools, clients_area, methods] = Layout::horizontal([Constraint::Ratio(1, 3); 3])
        .spacing(2)
        .areas(lists);
    let limit = lists.height.saturating_sub(3) as usize;
    ranking(frame, tools, "Tools", totals.top("mcp.tools", limit), theme);
    ranking(
        frame,
        clients_area,
        "Clientes",
        totals.top("mcp.clients", limit),
        theme,
    );
    ranking(
        frame,
        methods,
        "Métodos",
        totals.top("mcp.methods", limit),
        theme,
    );
}

fn draw_detail(frame: &mut Frame, detail: &LeadDetail, theme: &Theme) {
    let area = frame.area();
    let popup = Rect::new(
        area.width / 8,
        area.height / 8,
        area.width * 3 / 4,
        area.height * 3 / 4,
    );
    let dash = |value: &Option<String>| value.clone().unwrap_or_else(|| "—".to_owned());
    let label = |text: &str| Span::styled(format!("{text:<10}"), Style::new().fg(theme.muted));

    let mut lines = vec![Line::from(vec![
        label("tipo"),
        Span::raw(format!("{} · chegou por {}", detail.kind, detail.entry)),
    ])];
    if !detail.found {
        lines.push(
            Line::from("registro não encontrado (expirou ou foi apagado)")
                .style(Style::new().fg(theme.accent)),
        );
    }
    lines.push(Line::from(vec![
        label("nome"),
        Span::styled(
            dash(&detail.name),
            Style::new().add_modifier(Modifier::BOLD),
        ),
    ]));
    lines.push(Line::from(vec![
        label("contato"),
        Span::raw(dash(&detail.contact)),
    ]));
    if detail.kind == "hire" {
        lines.push(Line::from(vec![
            label("empresa"),
            Span::raw(dash(&detail.company)),
        ]));
        lines.push(Line::from(vec![
            label("orçamento"),
            Span::raw(dash(&detail.budget)),
        ]));
        lines.push(Line::from(""));
        lines.push(Line::from(dash(&detail.brief)));
    }
    lines.push(Line::from(""));
    lines.push(Line::from("percurso do dia").style(Style::new().fg(theme.muted)));
    if detail.pages.is_empty() {
        lines.push(Line::from("nenhuma página registrada"));
    }
    lines.extend(
        detail
            .pages
            .iter()
            .map(|(time, path)| Line::from(format!("{time}  {path}"))),
    );

    frame.render_widget(Clear, popup);
    frame.render_widget(
        Paragraph::new(lines)
            .wrap(Wrap { trim: false })
            .style(Style::new().fg(theme.fg).bg(theme.bg))
            .block(
                panel("Lead · Esc fecha", theme)
                    .border_style(Style::new().fg(theme.accent))
                    .padding(Padding::new(3, 3, 1, 1)),
            ),
        popup,
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::firestore::Document;
    use crate::model::Daily;
    use crate::theme::theme;
    use ratatui::{Terminal, backend::TestBackend};
    use serde_json::json;

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    fn screen(app: &App) -> String {
        let mut terminal = Terminal::new(TestBackend::new(140, 40)).unwrap();
        terminal
            .draw(|frame| draw(frame, app, now(), &theme(None)))
            .unwrap();
        let buffer = terminal.backend().buffer();
        (0..buffer.area.height)
            .map(|y| {
                (0..buffer.area.width)
                    .map(|x| buffer[(x, y)].symbol())
                    .collect::<String>()
            })
            .collect::<Vec<_>>()
            .join("\n")
    }

    fn app() -> App {
        let mut app = App::default();
        app.log.merge(vec![
            Document { name: "e/1".into(), data: json!({"kind": "pageview", "at": "2026-10-14T17:59:00.000Z", "day": "2026-10-14",
                "visitor": "abcdef123456", "class": "human", "path": "/lab/forja", "channel": "linkedin", "country": "BR",
                "city": "Curitiba", "region": "Paraná"}) },
            Document { name: "e/2".into(), data: json!({"kind": "conversion", "at": "2026-10-14T17:59:30.000Z", "day": "2026-10-14",
                "visitor": "abcdef123456", "class": "human", "path": "/api/cv", "channel": "internal", "country": "BR",
                "conversion": {"type": "cv", "refId": "cv-1"}}) },
        ]);
        app.dailies.insert(
            "2026-10-14".into(),
            Daily::from_data(
                "2026-10-14",
                &json!({
                    "traffic": {"human": 7, "ai_agent": 2}, "conversions": {"cv": 1},
                    "pages": {"%2Flab%2Fforja": 5}, "mcp": {"tools": {"get_profile": 3}}
                }),
            ),
        );
        app
    }

    #[test]
    fn shows_the_tabs_and_the_refresh_mode() {
        let text = screen(&App::default());
        for title in ["Ao vivo", "Funil", "Tráfego", "MCP", "a cada 30 s", "hoje"] {
            assert!(text.contains(title), "missing {title}");
        }
    }

    #[test]
    fn lists_the_live_feed_with_today_totals() {
        let text = screen(&app());
        assert!(text.contains("/lab/forja"));
        assert!(text.contains("abcdef"));
        assert!(!text.contains("abcdef1"));
        // The headline numbers are cards with big digits, not inline text.
        for label in HEADLINE {
            assert!(text.contains(label), "card {label} missing");
        }
        assert!(text.contains("Agentes"));
        for row in crate::bignum::big_number(7) {
            assert!(text.contains(&row), "big 7 row {row:?} missing");
        }
    }

    #[test]
    fn shows_the_funnel_stages_and_the_lead() {
        let mut app = app();
        app.tab = Tab::Funnel;
        let text = screen(&app);
        for stage in [
            "Chegou",
            "Viu evidência",
            "Agiu",
            "Virou lead",
            "linkedin",
            "cv",
        ] {
            assert!(text.contains(stage), "missing {stage}");
        }
    }

    #[test]
    fn ranks_pages_on_the_traffic_tab_and_tools_on_the_mcp_tab() {
        let mut app = app();
        app.tab = Tab::Traffic;
        assert!(screen(&app).contains("/lab/forja"));
        app.tab = Tab::Mcp;
        assert!(screen(&app).contains("get_profile"));
    }

    #[test]
    fn draws_a_lead_detail_over_the_tab() {
        let mut app = app();
        app.detail = Some(crate::lead::LeadDetail {
            kind: "hire".into(),
            found: true,
            name: Some("Ada".into()),
            contact: Some("ada@example.com".into()),
            brief: Some("Preciso de um MCP".into()),
            company: None,
            budget: None,
            entry: "linkedin".into(),
            pages: vec![("14:59:00".into(), "/lab/forja".into())],
        });
        let text = screen(&app);
        assert!(text.contains("Ada"));
        assert!(text.contains("Preciso de um MCP"));
    }

    #[test]
    fn makes_the_fast_mode_stand_out_with_its_countdown() {
        let start = std::time::Instant::now();
        let mut app = App::default();
        app.on_key(
            crossterm::event::KeyEvent::new(
                crossterm::event::KeyCode::Char('r'),
                crossterm::event::KeyModifiers::NONE,
            ),
            start,
            now(),
        );
        app.sync(start, start + std::time::Duration::from_secs(5));
        let text = screen(&app);
        assert!(text.contains("TEMPO REAL"), "{text}");
        assert!(text.contains("desliga em 30 min"));
    }

    #[test]
    fn says_there_are_no_leads_instead_of_an_empty_list() {
        let app = App {
            tab: Tab::Funnel,
            ..App::default()
        };
        assert!(screen(&app).contains("nenhum lead em hoje"));
    }

    #[test]
    fn names_the_app_in_the_header() {
        assert!(screen(&App::default()).contains("nandomoreira.dev"));
    }

    #[test]
    fn shows_each_stage_as_a_card_with_its_pass_rate() {
        let mut app = app();
        app.tab = Tab::Funnel;
        assert!(screen(&app).contains("100% da anterior"));
    }

    #[test]
    fn draws_a_bar_beside_each_ranked_counter() {
        let mut app = app();
        app.tab = Tab::Traffic;
        assert!(screen(&app).contains("████"));
    }

    #[test]
    fn shows_the_countdown_to_the_next_refresh_in_the_top_right_corner() {
        let start = std::time::Instant::now();
        let mut app = App::default();
        app.sync(start, start + std::time::Duration::from_secs(30));
        let text = screen(&app);
        let first_line = text.lines().nth(1).unwrap_or_default();
        assert!(
            first_line.trim_end().ends_with("Atualização em: 30s"),
            "{first_line:?}"
        );

        app.sync(start, start + std::time::Duration::from_secs(5));
        assert!(screen(&app).contains("Atualização em: 5s"));
    }

    #[test]
    fn shows_the_city_in_the_feed_and_ranks_cities_on_the_traffic_tab() {
        let mut app = app();
        assert!(screen(&app).contains("Curitiba, PR"));
        app.tab = Tab::Traffic;
        let text = screen(&app);
        assert!(text.contains("Cidades"));
        assert!(text.contains("Curitiba, PR"));
    }
}
