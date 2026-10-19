//! `stats --demo`: thirty days of made-up traffic, built in memory and fed
//! through the same parser and counters as the real data. Nothing is read
//! from or written to Firestore. For screenshots and trying the TUI out.

use crate::app::App;
use crate::firestore::Document;
use crate::keys::encode_counter_key;
use crate::model::{Daily, Event};
use crate::period::{Period, sao_paulo};
use chrono::{DateTime, Duration, NaiveDate, TimeZone, Utc};
use serde_json::{Value, json};
use std::collections::{BTreeMap, HashMap};

const PAGES: [&str; 14] = [
    "/",
    "/",
    "/sobre",
    "/lab/forja",
    "/portfolio/bragstack",
    "/lab/stats",
    "/analytics-sem-script-medindo-no-servidor-e-lendo-no-terminal",
    "/o-falso-verde",
    "/revisao-cruzada-entre-modelos",
    "/memoria-para-agentes-em-4-camadas",
    "/contato",
    "/now",
    "/servicos",
    "/servicos/site-institucional",
];
const CHANNELS: [&str; 9] = [
    "linkedin",
    "linkedin",
    "google",
    "direct",
    "direct",
    "github",
    "bluesky",
    "utm:linkedin",
    "other",
];
const PLACES: [(&str, &str, &str); 8] = [
    ("São Paulo", "São Paulo", "BR"),
    ("São Paulo", "São Paulo", "BR"),
    ("Curitiba", "Paraná", "BR"),
    ("Belo Horizonte", "Minas Gerais", "BR"),
    ("Rio de Janeiro", "Rio de Janeiro", "BR"),
    ("Florianópolis", "Santa Catarina", "BR"),
    ("Porto Alegre", "Rio Grande do Sul", "BR"),
    ("Lisboa", "Lisboa", "PT"),
];
const TARGETS: [&str; 5] = [
    "contato/linkedin",
    "contato/github",
    "contato/email",
    "lab/forja/repo",
    "portfolio/bragstack/live",
];
const TOOLS: [&str; 5] = [
    "get_profile",
    "list_projects",
    "get_project",
    "check_availability",
    "get_resume",
];
const CLIENTS: [&str; 4] = ["claude-code", "claude-code", "cursor", "vscode"];
const NAMES: [&str; 6] = [
    "Ana Souza",
    "Carlos Lima",
    "Marina Alves",
    "Rafael Costa",
    "Juliana Rocha",
    "Pedro Martins",
];
const BRIEFS: [&str; 3] = [
    "Preciso de um MCP server para o nosso catálogo de produtos.",
    "Queremos colocar um agente de IA em produção no atendimento.",
    "Procuro alguém para revisar a nossa esteira de dados.",
];

/// A small deterministic generator: the demo is the same on every run.
struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }

    fn below(&mut self, n: u64) -> u64 {
        self.next() % n
    }

    fn chance(&mut self, percent: u64) -> bool {
        self.below(100) < percent
    }

    fn pick<'a, T>(&mut self, items: &'a [T]) -> &'a T {
        &items[self.below(items.len() as u64) as usize]
    }

    fn hex(&mut self) -> String {
        format!("{:016x}{:016x}", self.next(), self.next())
    }
}

pub struct DemoWorld {
    rng: Rng,
    documents: Vec<Document>,
    robots: BTreeMap<String, (i64, i64)>,
    records: HashMap<String, Value>,
}

fn iso(at: DateTime<Utc>) -> String {
    at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()
}

impl DemoWorld {
    pub fn new(now: DateTime<Utc>) -> DemoWorld {
        let mut world = DemoWorld {
            rng: Rng(0x5eed_1a7e_2026_1014),
            documents: Vec::new(),
            robots: BTreeMap::new(),
            records: HashMap::new(),
        };
        for day in Period::Month.days(now) {
            world.day(&day, now);
        }
        world
    }

    pub fn documents(&self) -> &[Document] {
        &self.documents
    }

    /// The made-up cv_downloads / hire_requests record behind a lead.
    pub fn record(&self, ref_id: &str) -> Option<&Value> {
        self.records.get(ref_id)
    }

    /// Puts the whole demo into the app: every event and 30 days of counters.
    pub fn load(&self, app: &mut App) {
        app.log.merge(self.documents.clone());
        app.dailies = self.dailies();
    }

    /// One fresh visit "now", so the live tab moves like the real one.
    pub fn tick(&mut self, now: DateTime<Utc>, app: &mut App) {
        let day = crate::period::today(now);
        let visitor = self.rng.hex();
        let (city, region, country) = *self.rng.pick(&PLACES);
        let channel = self.rng.pick(&CHANNELS).to_string();
        let path = self.rng.pick(&PAGES).to_string();
        let start = self.documents.len();
        self.push(json!({"kind": "pageview", "at": iso(now), "day": day, "visitor": visitor, "class": "human",
            "source": "ssr", "path": path, "channel": channel, "country": country, "city": city, "region": region}));
        app.log.merge(self.documents[start..].to_vec());
        app.dailies = self.dailies();
    }

    fn push(&mut self, data: Value) {
        let name = format!("demo/{}", self.documents.len());
        self.documents.push(Document { name, data });
    }

    fn day(&mut self, day: &str, now: DateTime<Utc>) {
        let date = NaiveDate::parse_from_str(day, "%Y-%m-%d").expect("a valid day");
        let midnight = sao_paulo()
            .from_local_datetime(&date.and_hms_opt(0, 0, 0).expect("midnight"))
            .single()
            .expect("a fixed offset")
            .with_timezone(&Utc);
        let limit = (now - midnight).num_seconds().clamp(1, 86_399) as u64;
        let at = |rng: &mut Rng| midnight + Duration::seconds(rng.below(limit) as i64);
        self.robots.insert(
            day.to_owned(),
            (8 + self.rng.below(20) as i64, 3 + self.rng.below(10) as i64),
        );

        for _ in 0..(14 + self.rng.below(26)) {
            let start = at(&mut self.rng);
            self.visit(day, start);
        }
        for _ in 0..(2 + self.rng.below(6)) {
            let path = *self
                .rng
                .pick(&["/curriculo", "/", "/lab/forja", "/mcp", "/o-falso-verde"]);
            let visitor = self.rng.hex();
            let start = at(&mut self.rng);
            self.push(json!({"kind": "pageview", "at": iso(start), "day": day, "visitor": visitor, "class": "ai_agent",
                "source": "ssr", "path": path, "channel": "direct", "country": "US"}));
        }
        for _ in 0..(3 + self.rng.below(4)) {
            let start = at(&mut self.rng);
            self.mcp_session(day, start);
        }
    }

    /// One person's visit: a few pages, sometimes a click out, rarely a lead.
    fn visit(&mut self, day: &str, start: DateTime<Utc>) {
        let visitor = self.rng.hex();
        let (city, region, country) = *self.rng.pick(&PLACES);
        let entry = self.rng.pick(&CHANNELS).to_string();
        let place = json!({"country": country, "city": city, "region": region});
        let mut at = start;
        for page in 0..(1 + self.rng.below(4)) {
            let path = self.rng.pick(&PAGES).to_string();
            let channel = if page == 0 {
                entry.clone()
            } else {
                "internal".to_owned()
            };
            let mut data = json!({"kind": "pageview", "at": iso(at), "day": day, "visitor": visitor, "class": "human",
                "source": "ssr", "path": path, "channel": channel});
            merge(&mut data, &place);
            self.push(data);
            at += Duration::seconds(20 + self.rng.below(160) as i64);
        }

        if self.rng.chance(12) {
            let target = self.rng.pick(&TARGETS).to_string();
            let mut data = json!({"kind": "conversion", "at": iso(at), "day": day, "visitor": visitor, "class": "human",
                "source": "api", "path": format!("/go/{target}"), "channel": "internal",
                "conversion": {"type": "outbound", "target": target}});
            merge(&mut data, &place);
            self.push(data);
            at += Duration::seconds(30);
        }

        if self.rng.chance(2) {
            let hire = self.rng.chance(40);
            let ref_id = format!("demo-{}", self.records.len() + 1);
            let name = self.rng.pick(&NAMES).to_string();
            let email = format!(
                "{}@example.com",
                name.split(' ').next().unwrap_or("contato").to_lowercase()
            );
            let (kind, path, record) = if hire {
                let brief = self.rng.pick(&BRIEFS).to_string();
                (
                    "hire",
                    "/api/hire",
                    json!({"from": name, "contact": email, "brief": brief, "company": "Empresa Exemplo", "budget": "a definir"}),
                )
            } else {
                ("cv", "/api/cv", json!({"name": name, "email": email}))
            };
            self.records.insert(ref_id.clone(), record);
            let mut data = json!({"kind": "conversion", "at": iso(at), "day": day, "visitor": visitor, "class": "human",
                "source": "api", "path": path, "channel": "internal", "conversion": {"type": kind, "refId": ref_id}});
            merge(&mut data, &place);
            self.push(data);
        }
    }

    fn mcp_session(&mut self, day: &str, start: DateTime<Utc>) {
        let visitor = self.rng.hex();
        let client = self.rng.pick(&CLIENTS).to_string();
        let mut steps = vec![
            json!({"type": "mcp", "target": "initialize", "client": client}),
            json!({"type": "mcp", "target": "notifications/initialized"}),
            json!({"type": "mcp", "target": "tools/list"}),
        ];
        for _ in 0..(1 + self.rng.below(2)) {
            steps.push(
                json!({"type": "mcp", "target": "tools/call", "tool": self.rng.pick(&TOOLS)}),
            );
        }
        for conversion in steps {
            self.push(json!({"kind": "conversion", "at": iso(start), "day": day, "visitor": visitor, "class": "ai_agent",
                "source": "api", "path": "/api/mcp", "channel": "direct", "country": "US", "conversion": conversion}));
        }
    }

    /// The daily counters, built from the events by the site's rules
    /// (dailyIncrements in src/lib/analytics/event.ts), plus the robots,
    /// which only ever exist as counters.
    fn dailies(&self) -> BTreeMap<String, Daily> {
        let mut out: BTreeMap<String, Daily> = BTreeMap::new();
        let mut add = |day: &str, group: &str, key: String| {
            let daily = out.entry(day.to_owned()).or_insert_with(|| Daily {
                day: day.to_owned(),
                ..Daily::default()
            });
            *daily
                .groups
                .entry(group.to_owned())
                .or_default()
                .entry(key)
                .or_default() += 1;
        };

        for document in &self.documents {
            let Some(event) = Event::from_data(&document.data) else {
                continue;
            };
            let day = event.day.as_str();
            if event.kind == "pageview" {
                add(day, "traffic", event.class.clone());
                if event.class == "human" {
                    add(day, "pages", encode_counter_key(&event.path));
                    add(
                        day,
                        "countries",
                        event
                            .country
                            .clone()
                            .unwrap_or_else(|| "unknown".to_owned()),
                    );
                    if event.channel != "internal" {
                        add(day, "channels", event.channel.clone());
                    }
                }
            }
            if let Some(conversion) = &event.conversion {
                match conversion.kind.as_str() {
                    "outbound" if event.class == "human" => {
                        add(day, "conversions", "outbound".to_owned());
                        if let Some(target) = &conversion.target {
                            add(day, "outbound", encode_counter_key(target));
                        }
                    }
                    "mcp" => {
                        if let Some(method) = &conversion.target {
                            add(day, "mcp.methods", method.clone());
                            if method == "tools/call" {
                                add(day, "conversions", "mcp".to_owned());
                            }
                        }
                        if let Some(tool) = &conversion.tool {
                            add(day, "mcp.tools", tool.clone());
                        }
                        if let Some(client) = &conversion.client {
                            add(day, "mcp.clients", client.clone());
                        }
                    }
                    "cv" | "hire" => add(day, "conversions", conversion.kind.clone()),
                    _ => {}
                }
            }
        }

        for (day, (search, other)) in &self.robots {
            let daily = out.entry(day.clone()).or_insert_with(|| Daily {
                day: day.clone(),
                ..Daily::default()
            });
            let traffic = daily.groups.entry("traffic".to_owned()).or_default();
            traffic.insert("search_crawler".to_owned(), *search);
            traffic.insert("other_bot".to_owned(), *other);
        }
        out
    }
}

fn merge(data: &mut Value, extra: &Value) {
    if let (Some(target), Some(source)) = (data.as_object_mut(), extra.as_object()) {
        for (key, value) in source {
            target.insert(key.clone(), value.clone());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app::App;
    use crate::period::Period;

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    fn loaded() -> App {
        let world = DemoWorld::new(now());
        let mut app = App::default();
        world.load(&mut app);
        app
    }

    #[test]
    fn is_the_same_on_every_run() {
        let a = DemoWorld::new(now());
        let b = DemoWorld::new(now());
        assert_eq!(a.documents().len(), b.documents().len());
        assert_eq!(a.documents()[10].data, b.documents()[10].data);
    }

    #[test]
    fn covers_thirty_days_with_people_agents_and_every_funnel_stage() {
        let mut app = loaded();
        app.period = Period::Month;
        assert_eq!(app.dailies.len(), 30);

        let funnel = app.funnel(now());
        assert!(
            funnel.total.iter().all(|stage| *stage > 0),
            "{:?}",
            funnel.total
        );
        assert!(!funnel.leads.is_empty());
        assert!(app.log.events().iter().any(|e| e.class == "ai_agent"));
        assert!(app.log.events().iter().all(|e| e.at <= now()));
    }

    #[test]
    fn has_a_record_for_every_lead() {
        let world = DemoWorld::new(now());
        let mut app = App::default();
        world.load(&mut app);
        app.period = Period::Month;
        for lead in app.funnel(now()).leads {
            assert!(world.record(&lead.ref_id).is_some(), "{}", lead.ref_id);
        }
    }

    #[test]
    fn keeps_the_daily_counters_in_step_with_the_events() {
        let app = loaded();
        let today = app.today(now()).expect("today's counters");
        let human_views = app
            .log
            .events()
            .iter()
            .filter(|e| e.day == today.day && e.class == "human" && e.kind == "pageview")
            .count() as i64;
        assert_eq!(today.get("traffic", "human"), human_views);
        assert!(today.get("traffic", "search_crawler") > 0);

        let mut month = app;
        month.period = Period::Month;
        let totals = month.totals(now());
        assert!(
            totals
                .top("pages", 3)
                .iter()
                .all(|(page, _)| page.starts_with('/'))
        );
        assert!(totals.get("conversions", "mcp") > 0);
        assert!(
            !crate::totals::cities(month.log.events(), &Period::Month.days(now()), 5).is_empty()
        );
    }

    #[test]
    fn adds_a_fresh_visit_on_each_tick() {
        let mut world = DemoWorld::new(now());
        let mut app = App::default();
        world.load(&mut app);
        let before = app.log.events().len();
        let later = now() + chrono::Duration::seconds(30);

        world.tick(later, &mut app);

        assert_eq!(app.log.events().len(), before + 1);
        assert_eq!(app.log.recent(1)[0].at, later);
    }
}
