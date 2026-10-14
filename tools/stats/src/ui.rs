use crate::app::{App, TAB_TITLES, Tab};
use crate::funnel::{STAGES, pass_rate};
use crate::model::Event;
use crate::period::clock;
use crate::theme::Theme;
use chrono::{DateTime, Utc};
use ratatui::Frame;
use ratatui::layout::{Constraint, Layout, Rect};
use ratatui::style::{Modifier, Style};
use ratatui::text::Line;
use ratatui::widgets::{Block, Borders, Clear, Paragraph, Row, Table, Tabs, Wrap};

const HELP: &str = "1-4 abas · r tempo real · [ ] período · Enter lead · q sai";

pub fn draw(frame: &mut Frame, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let base = Style::new().fg(theme.fg).bg(theme.bg);
    frame.render_widget(Block::new().style(base), frame.area());
    let [tabs, body, status] = Layout::vertical([
        Constraint::Length(1),
        Constraint::Min(0),
        Constraint::Length(1),
    ])
    .areas(frame.area());

    let titles: Vec<Line> = TAB_TITLES
        .iter()
        .enumerate()
        .map(|(i, title)| Line::from(format!(" {} {title} ", i + 1)))
        .collect();
    frame.render_widget(
        Tabs::new(titles)
            .select(app.tab.index())
            .style(Style::new().fg(theme.muted))
            .highlight_style(Style::new().fg(theme.accent).add_modifier(Modifier::BOLD))
            .divider(""),
        tabs,
    );

    match app.tab {
        Tab::Live => draw_live(frame, body, app, now, theme),
        Tab::Funnel => draw_funnel(frame, body, app, now, theme),
        Tab::Traffic => draw_traffic(frame, body, app, now, theme),
        Tab::Mcp => draw_mcp(frame, body, app, now, theme),
    }

    let line = format!(
        " {} · {} · {}",
        app.schedule.label(),
        app.period.label(),
        app.status.as_deref().unwrap_or(HELP)
    );
    frame.render_widget(
        Paragraph::new(line).style(Style::new().fg(theme.muted)),
        status,
    );

    if let Some(detail) = &app.detail {
        draw_detail(frame, detail, theme);
    }
}

fn titled(title: &str, theme: &Theme) -> Block<'static> {
    Block::new()
        .borders(Borders::ALL)
        .border_style(Style::new().fg(theme.muted))
        .title(format!(" {title} "))
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

fn draw_live(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let [header, feed] = Layout::vertical([Constraint::Length(3), Constraint::Min(0)]).areas(area);
    let count = |group: &str, key: &str| app.today(now).map_or(0, |d| d.get(group, key));
    let robots = count("traffic", "search_crawler") + count("traffic", "other_bot");
    let summary = format!(
        "pessoas {} · agentes {} · robôs {} · cliques {} · CV {} · briefings {} · MCP {}",
        count("traffic", "human"),
        count("traffic", "ai_agent"),
        robots,
        count("conversions", "outbound"),
        count("conversions", "cv"),
        count("conversions", "hire"),
        count("conversions", "mcp"),
    );
    frame.render_widget(Paragraph::new(summary).block(titled("Hoje", theme)), header);

    let rows = app
        .log
        .recent(feed.height.saturating_sub(3) as usize)
        .into_iter()
        .map(|e| {
            let style = if e.conversion.is_some() {
                Style::new().fg(theme.accent)
            } else {
                Style::new()
            };
            Row::new(vec![
                clock(e.at),
                e.class.clone(),
                e.visitor.chars().take(6).collect(),
                e.path.clone(),
                e.channel.clone(),
                e.country.clone().unwrap_or_default(),
                conversion_label(e),
            ])
            .style(style)
        });
    let widths = [
        Constraint::Length(9),
        Constraint::Length(9),
        Constraint::Length(7),
        Constraint::Min(30),
        Constraint::Length(14),
        Constraint::Length(4),
        Constraint::Length(24),
    ];
    let header_row = Row::new([
        "hora",
        "classe",
        "visit.",
        "página",
        "canal",
        "país",
        "conversão",
    ])
    .style(Style::new().fg(theme.muted));
    frame.render_widget(
        Table::new(rows, widths)
            .header(header_row)
            .block(titled("Eventos", theme)),
        feed,
    );
}

fn draw_funnel(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let funnel = app.funnel(now);
    let [stages, channels, leads] = Layout::vertical([
        Constraint::Length(7),
        Constraint::Length(10),
        Constraint::Min(0),
    ])
    .areas(area);

    let stage_rows = STAGES.iter().enumerate().map(|(i, stage)| {
        let rate = pass_rate(&funnel.total, i).map_or(String::new(), |r| format!("{r}%"));
        Row::new(vec![stage.to_string(), funnel.total[i].to_string(), rate])
    });
    frame.render_widget(
        Table::new(
            stage_rows,
            [
                Constraint::Length(16),
                Constraint::Length(8),
                Constraint::Length(8),
            ],
        )
        .block(titled(&format!("Funil · {}", app.period.label()), theme)),
        stages,
    );

    let channel_rows = funnel.by_channel.iter().map(|(channel, counts)| {
        let mut cells = vec![channel.clone()];
        cells.extend(counts.iter().map(usize::to_string));
        Row::new(cells)
    });
    let channel_header = Row::new(["canal", STAGES[0], STAGES[1], STAGES[2], STAGES[3]])
        .style(Style::new().fg(theme.muted));
    frame.render_widget(
        Table::new(
            channel_rows,
            [
                Constraint::Length(16),
                Constraint::Length(14),
                Constraint::Length(14),
                Constraint::Length(14),
                Constraint::Length(14),
            ],
        )
        .header(channel_header)
        .block(titled("Por canal de chegada", theme)),
        channels,
    );

    let lead_rows = funnel.leads.iter().enumerate().map(|(i, lead)| {
        let style = if i == app.selected {
            Style::new().fg(theme.bg).bg(theme.accent)
        } else {
            Style::new()
        };
        Row::new(vec![
            lead.day.clone(),
            clock(lead.at),
            lead.kind.clone(),
            lead.entry.clone(),
            lead.visitor.chars().take(6).collect(),
        ])
        .style(style)
    });
    frame.render_widget(
        Table::new(
            lead_rows,
            [
                Constraint::Length(11),
                Constraint::Length(9),
                Constraint::Length(6),
                Constraint::Length(16),
                Constraint::Length(7),
            ],
        )
        .block(titled("Leads (Enter abre)", theme)),
        leads,
    );
}

fn ranking(frame: &mut Frame, area: Rect, title: &str, rows: Vec<(String, i64)>, theme: &Theme) {
    let rows = rows
        .into_iter()
        .map(|(key, count)| Row::new(vec![key, count.to_string()]));
    frame.render_widget(
        Table::new(rows, [Constraint::Min(20), Constraint::Length(8)]).block(titled(title, theme)),
        area,
    );
}

fn draw_traffic(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let totals = app.totals(now);
    let [top, bottom] =
        Layout::vertical([Constraint::Percentage(50), Constraint::Percentage(50)]).areas(area);
    let [pages, channels] =
        Layout::horizontal([Constraint::Percentage(60), Constraint::Percentage(40)]).areas(top);
    let [countries, outbound] =
        Layout::horizontal([Constraint::Percentage(40), Constraint::Percentage(60)]).areas(bottom);
    let limit = (top.height.saturating_sub(2)) as usize;
    ranking(frame, pages, "Páginas", totals.top("pages", limit), theme);
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
    let [header, lists] = Layout::vertical([Constraint::Length(3), Constraint::Min(0)]).areas(area);
    frame.render_widget(
        Paragraph::new(format!(
            "chamadas de tool (conversões MCP): {}",
            totals.get("conversions", "mcp")
        ))
        .block(titled(&format!("MCP · {}", app.period.label()), theme)),
        header,
    );
    let [tools, clients, methods] = Layout::horizontal([
        Constraint::Ratio(1, 3),
        Constraint::Ratio(1, 3),
        Constraint::Ratio(1, 3),
    ])
    .areas(lists);
    let limit = lists.height.saturating_sub(2) as usize;
    ranking(frame, tools, "Tools", totals.top("mcp.tools", limit), theme);
    ranking(
        frame,
        clients,
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

fn draw_detail(frame: &mut Frame, detail: &crate::lead::LeadDetail, theme: &Theme) {
    let area = frame.area();
    let popup = Rect::new(
        area.width / 8,
        area.height / 8,
        area.width * 3 / 4,
        area.height * 3 / 4,
    );
    let dash = |value: &Option<String>| value.clone().unwrap_or_else(|| "—".to_owned());

    let mut lines = vec![
        Line::from(format!(
            "tipo: {} · chegou por: {}",
            detail.kind, detail.entry
        )),
        Line::from(if detail.found {
            String::new()
        } else {
            "registro não encontrado (expirou ou foi apagado)".to_owned()
        }),
        Line::from(format!("nome: {}", dash(&detail.name))),
        Line::from(format!("contato: {}", dash(&detail.contact))),
    ];
    if detail.kind == "hire" {
        lines.push(Line::from(format!(
            "empresa: {} · orçamento: {}",
            dash(&detail.company),
            dash(&detail.budget)
        )));
        lines.push(Line::from(format!("briefing: {}", dash(&detail.brief))));
    }
    lines.push(Line::from(""));
    lines.push(Line::from("percurso do dia:"));
    if detail.pages.is_empty() {
        lines.push(Line::from("  nenhuma página registrada"));
    }
    lines.extend(
        detail
            .pages
            .iter()
            .map(|(time, path)| Line::from(format!("  {time}  {path}"))),
    );

    frame.render_widget(Clear, popup);
    frame.render_widget(
        Paragraph::new(lines)
            .wrap(Wrap { trim: false })
            .style(Style::new().fg(theme.fg).bg(theme.bg))
            .block(titled("Lead (Esc fecha)", theme).border_style(Style::new().fg(theme.accent))),
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
                "visitor": "abcdef123456", "class": "human", "path": "/lab/forja", "channel": "linkedin", "country": "BR"}) },
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
        assert!(text.contains("pessoas 7"));
        assert!(text.contains("agentes 2"));
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
}
