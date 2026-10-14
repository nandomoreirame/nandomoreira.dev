# Plano: leitor dos dados de leads (`lead-analytics-reader`)

> **Spec:** `docs/specs/lead-analytics-reader/SPEC.md`
> **Slug:** `lead-analytics-reader` · **Criado:** 2026-10-14
> **Profundidade:** Deep · **Tarefas:** 17 em 4 lotes · commit por tarefa, **nunca push**

**Objetivo:** uma TUI local (`nm-stats`) que lê o Firestore do lead-analytics e mostra o feed
ao vivo, o funil por visitante-dia, o tráfego e o uso do MCP, sem nunca escrever nada.

**Arquitetura:** crate Rust em `tools/stats/`, com biblioteca (`nm_stats`) e binário
(`nm-stats`). Toda decisão mora em funções puras testáveis (`keys`, `firestore`, `model`,
`pages`, `period`, `funnel`, `totals`, `schedule`, `auth`, `lead`, `app`, `ui`); o
`main.rs` só junta autenticação, cliente REST, terminal e o laço de eventos. O cliente HTTP
(`client`) é a única parte que fala com a rede e não tem teste automatizado: a verificação
dele é a Task 17, contra produção.

**Stack:** Rust 1.96 (edition 2024), ratatui 0.30, crossterm 0.29 (`event-stream`),
tokio 1, reqwest 0.13 (rustls, `json`), serde_json, chrono 0.4, clap 4, anyhow, futures.

**Regras desta rodada:**

- Toda tarefa de código começa pelo teste vermelho. Os testes ficam no próprio módulo
  (`#[cfg(test)] mod tests`), como é o costume em Rust.
- Comando de teste: `cargo test --manifest-path tools/stats/Cargo.toml <filtro>`.
- Antes de cada commit: `cargo fmt --manifest-path tools/stats/Cargo.toml` e
  `cargo clippy --manifest-path tools/stats/Cargo.toml --all-targets -- -D warnings`.
  O `rpi-gates.sh` só detecta o `package.json` da raiz e **não** roda o Rust; essas duas
  linhas são o portão desta feature.
- `npm test` continua passando (nada em `src/` muda nesta feature).
- Nenhum teste toca a rede nem o Firestore.
- Texto que aparece na tela em pt-BR; código, identificadores e comentários em inglês.
- **Não fazer push.**

## Fatos verificados

| Fato | Fonte |
|---|---|
| Coleções `analytics_events` e `analytics_daily` | `src/lib/analytics/store.ts:5-6` |
| Evento bruto só para `human` e `ai_agent` | `src/lib/analytics/event.ts:179` (`keepsRawEvent`) |
| `counterKey`: `encodeURIComponent`, `.` como `%2E`, `__` inicial como `%5F_`, vazio como `%00` | `src/lib/analytics/event.ts:138` |
| `at` gravado como `toISOString()` (`YYYY-MM-DDTHH:mm:ss.sssZ`) | `src/lib/analytics/event.ts` (`buildEvent`) |
| Briefing: `from`, `contact`, `brief`, `company`, `budget`, `receivedAt` | `src/lib/hire/store.ts:50` |
| CV: `name`, `email`, `receivedAt` | `src/lib/cv/download.ts:89` |
| ratatui tem `init()`/`restore()` com hook de pânico, `Layout::areas`, `Buffer[(x, y)]` | código do ratatui (0.29 no cache local; 0.30 mantém) |
| reqwest 0.13 usa rustls por padrão (`default-tls = ["rustls"]`) | `Cargo.toml` do reqwest 0.13.5 |

## Lotes

| Lote | Tarefas | Entrega |
|---|---|---|
| 1 | 1–5 | crate, chaves, valores do Firestore, modelo, páginas, períodos |
| 2 | 6–9 | funil, totais, intervalo de atualização, autenticação |
| 3 | 10–13 | cliente REST, detalhe de lead, estado da TUI, tema |
| 4 | 14–17 | telas, laço principal, documentação, verificação em produção |

---

## Lote 1

### Task 1: crate e decodificação das chaves de contador

**Requirement:** REQ-011
**Files:** Create `tools/stats/Cargo.toml`, `tools/stats/src/lib.rs`, `tools/stats/src/main.rs`, `tools/stats/src/keys.rs`; Modify `.gitignore`
**Team:** backend · implementer `backend-engineer` (rust-cli-conventions) · reviewers business-logic-reviewer, test-reviewer

**Step 0: crate**

`tools/stats/Cargo.toml`:

```toml
[package]
name = "nm-stats"
version = "0.1.0"
edition = "2024"
rust-version = "1.88"
description = "Terminal reader for the nandomoreira.dev lead analytics"
publish = false

[lib]
name = "nm_stats"
path = "src/lib.rs"

[[bin]]
name = "nm-stats"
path = "src/main.rs"

[dependencies]
anyhow = "1"
chrono = { version = "0.4", default-features = false, features = ["clock", "std"] }
clap = { version = "4", features = ["derive"] }
crossterm = { version = "0.29", features = ["event-stream"] }
futures = "0.3"
ratatui = "0.30"
reqwest = { version = "0.13", features = ["json"] }
serde_json = "1"
tokio = { version = "1", features = ["macros", "rt-multi-thread", "time"] }
```

`tools/stats/src/lib.rs`:

```rust
//! Reader for the lead-analytics data (docs/specs/lead-analytics-reader).

pub mod keys;
```

`tools/stats/src/main.rs` (provisório; a Task 15 o substitui):

```rust
fn main() {
    println!("nm-stats");
}
```

`.gitignore`: acrescentar a linha `tools/stats/target/`.

**Step 1 (Red), `tools/stats/src/keys.rs`:**

```rust
#[cfg(test)]
mod tests {
    use super::decode_counter_key;

    #[test]
    fn decodes_slashes_and_dots() {
        assert_eq!(decode_counter_key("%2Flab%2Fforja%2Emd"), "/lab/forja.md");
    }

    #[test]
    fn decodes_the_escaped_leading_underscore_and_the_empty_key() {
        assert_eq!(decode_counter_key("%5F_proto__"), "__proto__");
        assert_eq!(decode_counter_key("%00"), "");
    }

    #[test]
    fn keeps_literal_keys_and_utf8() {
        assert_eq!(decode_counter_key("utm:linkedin"), "utm:linkedin");
        assert_eq!(decode_counter_key("%2Fsess%C3%B5es"), "/sessões");
    }

    #[test]
    fn leaves_a_broken_escape_as_it_is() {
        assert_eq!(decode_counter_key("100%"), "100%");
        assert_eq!(decode_counter_key("%zz"), "%zz");
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml keys`, esperado FAIL
(`cannot find function decode_counter_key`).

**Step 3 (Green), início de `tools/stats/src/keys.rs`:**

```rust
/// Reverses `counterKey` (src/lib/analytics/event.ts): percent-decoding, so
/// `%2Flab%2Fforja%2Emd` reads `/lab/forja.md`, `%5F_proto__` reads
/// `__proto__` and `%00` (the key of the empty string) reads "".
pub fn decode_counter_key(key: &str) -> String {
    if key == "%00" {
        return String::new();
    }

    let bytes = key.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && bytes.len() >= i + 3 {
            let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).ok();
            if let Some(byte) = hex.and_then(|h| u8::from_str_radix(h, 16).ok()) {
                out.push(byte);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}
```

**Step 4:** o mesmo comando, esperado PASS (4 testes).

**Step 5:** `/git commit` (`✨ feat(stats): scaffold the analytics reader crate`).

### Task 2: valores da API REST do Firestore

**Requirement:** REQ-003
**Files:** Create `tools/stats/src/firestore.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

**Step 1 (Red), `tools/stats/src/firestore.rs`:**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn decodes_scalars_maps_and_arrays() {
        let fields = json!({
            "at": {"stringValue": "2026-10-14T18:24:38.306Z"},
            "n": {"integerValue": "42"},
            "x": {"doubleValue": 1.5},
            "ok": {"booleanValue": true},
            "none": {"nullValue": null},
            "expiresAt": {"timestampValue": "2026-11-13T18:24:38.306Z"},
            "traffic": {"mapValue": {"fields": {"human": {"integerValue": "3"}}}},
            "tags": {"arrayValue": {"values": [{"stringValue": "a"}]}},
            "empty": {"mapValue": {}}
        });

        assert_eq!(
            decode_fields(&fields),
            json!({
                "at": "2026-10-14T18:24:38.306Z", "n": 42, "x": 1.5, "ok": true, "none": null,
                "expiresAt": "2026-11-13T18:24:38.306Z", "traffic": {"human": 3}, "tags": ["a"], "empty": {}
            })
        );
    }

    #[test]
    fn reads_documents_from_a_query_skipping_entries_without_one() {
        let response = json!([
            {"document": {"name": "projects/p/databases/(default)/documents/analytics_events/abc",
                          "fields": {"path": {"stringValue": "/lab"}}}, "readTime": "x"},
            {"readTime": "x"}
        ]);
        let docs = documents_of_query(&response);

        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].id(), "abc");
        assert_eq!(docs[0].data, json!({"path": "/lab"}));
    }

    #[test]
    fn reads_found_documents_from_a_batch_get() {
        let response = json!([
            {"found": {"name": "projects/p/databases/(default)/documents/analytics_daily/2026-10-14",
                       "fields": {"day": {"stringValue": "2026-10-14"}}}},
            {"missing": "projects/p/databases/(default)/documents/analytics_daily/2026-10-13"}
        ]);
        let docs = documents_of_batch(&response);

        assert_eq!(docs.len(), 1);
        assert_eq!(docs[0].id(), "2026-10-14");
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml firestore`, esperado FAIL.

**Step 3 (Green)**, início do arquivo, e `pub mod firestore;` no `lib.rs`:

```rust
use serde_json::{Map, Value};

/// A Firestore REST value (`{"stringValue": "x"}`) as plain JSON. Integers
/// arrive as strings and become numbers; timestamps stay ISO strings.
pub fn decode_value(value: &Value) -> Value {
    let Some((kind, inner)) = value.as_object().and_then(|object| object.iter().next()) else {
        return Value::Null;
    };
    match kind.as_str() {
        "stringValue" | "timestampValue" | "referenceValue" | "doubleValue" | "booleanValue" => inner.clone(),
        "integerValue" => inner
            .as_str()
            .and_then(|text| text.parse::<i64>().ok())
            .or_else(|| inner.as_i64())
            .map(Value::from)
            .unwrap_or(Value::Null),
        "mapValue" => decode_fields(inner.get("fields").unwrap_or(&Value::Null)),
        "arrayValue" => Value::Array(
            inner
                .get("values")
                .and_then(Value::as_array)
                .map(|values| values.iter().map(decode_value).collect())
                .unwrap_or_default(),
        ),
        _ => Value::Null,
    }
}

/// The `fields` of a document or map as a plain JSON object.
pub fn decode_fields(fields: &Value) -> Value {
    let mut out = Map::new();
    if let Some(object) = fields.as_object() {
        for (key, value) in object {
            out.insert(key.clone(), decode_value(value));
        }
    }
    Value::Object(out)
}

#[derive(Debug, Clone, PartialEq)]
pub struct Document {
    /// Full resource name: projects/<p>/databases/(default)/documents/<collection>/<id>.
    pub name: String,
    pub data: Value,
}

impl Document {
    pub fn id(&self) -> &str {
        self.name.rsplit('/').next().unwrap_or_default()
    }

    fn from_resource(resource: &Value) -> Option<Document> {
        Some(Document {
            name: resource.get("name")?.as_str()?.to_owned(),
            data: decode_fields(resource.get("fields").unwrap_or(&Value::Null)),
        })
    }
}

/// `documents:runQuery` answers one entry per result, and one without a
/// document when nothing matched.
pub fn documents_of_query(response: &Value) -> Vec<Document> {
    response
        .as_array()
        .map(|entries| entries.iter().filter_map(|entry| Document::from_resource(entry.get("document")?)).collect())
        .unwrap_or_default()
}

/// `documents:batchGet` answers `found` or `missing` per requested name.
pub fn documents_of_batch(response: &Value) -> Vec<Document> {
    response
        .as_array()
        .map(|entries| entries.iter().filter_map(|entry| Document::from_resource(entry.get("found")?)).collect())
        .unwrap_or_default()
}

/// A single `GET` of a document.
pub fn document_of(response: &Value) -> Option<Document> {
    Document::from_resource(response)
}
```

**Step 4:** PASS (3 testes). **Step 5:** `/git commit` (`✨ feat(stats): decode Firestore REST values`).

### Task 3: modelo de evento e de contador diário

**Requirement:** REQ-006, REQ-011, REQ-012
**Files:** Create `tools/stats/src/model.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

**Step 1 (Red), `tools/stats/src/model.rs`:**

```rust
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
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml model`, esperado FAIL.

**Step 3 (Green)**, início do arquivo, e `pub mod model;` no `lib.rs`:

```rust
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
    pub conversion: Option<Conversion>,
}

fn text(data: &Value, key: &str) -> Option<String> {
    data.get(key)?.as_str().map(str::to_owned)
}

impl Event {
    /// None when a required field is missing or `at` is not an instant: a
    /// hand-edited document is skipped, never a crash (spec Edge Cases).
    pub fn from_data(data: &Value) -> Option<Event> {
        let at = DateTime::parse_from_rfc3339(data.get("at")?.as_str()?).ok()?.with_timezone(&Utc);
        let conversion = data.get("conversion").filter(|c| c.is_object()).and_then(|c| {
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
            conversion,
        })
    }

    pub fn is_conversion(&self, kinds: &[&str]) -> bool {
        self.conversion.as_ref().is_some_and(|c| kinds.contains(&c.kind.as_str()))
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
        .map(|object| object.iter().filter_map(|(key, n)| Some((key.clone(), n.as_i64()?))).collect())
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
        Daily { day: day.to_owned(), groups }
    }

    pub fn get(&self, group: &str, key: &str) -> i64 {
        self.groups.get(group).and_then(|counters| counters.get(key)).copied().unwrap_or(0)
    }

    pub fn total(&self, group: &str) -> i64 {
        self.groups.get(group).map(|counters| counters.values().sum()).unwrap_or(0)
    }
}
```

**Step 4:** PASS (3 testes). **Step 5:** `/git commit` (`✨ feat(stats): model events and daily counters`).

### Task 4: página de evidência

**Requirement:** REQ-008
**Files:** Create `tools/stats/src/pages.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::is_evidence;

    #[test]
    fn counts_cases_and_posts() {
        assert!(is_evidence("/portfolio/bragstack"));
        assert!(is_evidence("/lab/forja/"));
        assert!(is_evidence("/sessoes-do-red-dead-online-p2p-relays-e-nat-duplo"));
    }

    #[test]
    fn leaves_out_fixed_pages_listings_and_files() {
        for path in ["/", "/sobre", "/contato", "/now", "/setup", "/mcp", "/privacidade", "/curriculo",
                     "/posts", "/portfolio", "/lab", "/eu", "/posts/arquivo/2017", "/llms.txt", ""] {
            assert!(!is_evidence(path), "{path}");
        }
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml pages`, esperado FAIL.

**Step 3 (Green)**, e `pub mod pages;` no `lib.rs`:

```rust
/// Pages that are not evidence of work: the site's fixed pages and listings.
const FIXED: [&str; 11] = ["sobre", "contato", "now", "setup", "mcp", "privacidade", "curriculo", "posts", "portfolio", "lab", "eu"];

/// REQ-008: a case (`/portfolio/<slug>`, `/lab/<slug>`) or a post (one path
/// segment that is not a fixed page and not a file).
pub fn is_evidence(path: &str) -> bool {
    let segments: Vec<&str> = path.split('/').filter(|segment| !segment.is_empty()).collect();
    match segments.as_slice() {
        ["portfolio" | "lab", _slug] => true,
        [single] => !FIXED.contains(single) && !single.contains('.'),
        _ => false,
    }
}
```

**Step 4:** PASS. **Step 5:** `/git commit` (`✨ feat(stats): tell evidence pages apart`).

### Task 5: dias e períodos em São Paulo

**Requirement:** REQ-010
**Files:** Create `tools/stats/src/period.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    fn at(iso: &str) -> DateTime<Utc> {
        iso.parse().unwrap()
    }

    #[test]
    fn uses_the_sao_paulo_day() {
        assert_eq!(today(at("2026-10-15T02:30:00Z")), "2026-10-14");
        assert_eq!(today(at("2026-10-15T03:00:00Z")), "2026-10-15");
        assert_eq!(clock(at("2026-10-14T18:24:38Z")), "15:24:38");
    }

    #[test]
    fn lists_the_days_of_a_period_oldest_first() {
        let now = at("2026-10-14T18:00:00Z");
        assert_eq!(Period::Today.days(now), vec!["2026-10-14"]);
        assert_eq!(Period::Week.days(now).first().unwrap(), "2026-10-08");
        assert_eq!(Period::Month.days(now).len(), 30);
        assert_eq!(Period::Month.days(now).last().unwrap(), "2026-10-14");
    }

    #[test]
    fn steps_between_periods_without_wrapping() {
        assert_eq!(Period::Today.next(), Period::Week);
        assert_eq!(Period::Month.next(), Period::Month);
        assert_eq!(Period::Today.prev(), Period::Today);
        assert_eq!(Period::Month.label(), "30 dias");
    }

    #[test]
    fn starts_the_load_at_midnight_in_sao_paulo_29_days_ago() {
        assert_eq!(load_start(at("2026-10-14T18:00:00Z")), "2026-09-15T03:00:00.000Z");
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml period`, esperado FAIL.

**Step 3 (Green)**, e `pub mod period;` no `lib.rs`:

```rust
use chrono::{DateTime, Duration, FixedOffset, Utc};

/// São Paulo has had no daylight saving since 2019; the site makes the same
/// assumption (dailyExpiry in src/lib/analytics/event.ts).
pub fn sao_paulo() -> FixedOffset {
    FixedOffset::west_opt(3 * 3600).expect("a valid offset")
}

/// The `day` field of an event: the São Paulo date.
pub fn today(now: DateTime<Utc>) -> String {
    now.with_timezone(&sao_paulo()).format("%Y-%m-%d").to_string()
}

pub fn clock(at: DateTime<Utc>) -> String {
    at.with_timezone(&sao_paulo()).format("%H:%M:%S").to_string()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Period {
    Today,
    Week,
    Month,
}

impl Period {
    fn length(self) -> i64 {
        match self {
            Period::Today => 1,
            Period::Week => 7,
            Period::Month => 30,
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Period::Today => "hoje",
            Period::Week => "7 dias",
            Period::Month => "30 dias",
        }
    }

    pub fn next(self) -> Period {
        match self {
            Period::Today => Period::Week,
            Period::Week | Period::Month => Period::Month,
        }
    }

    pub fn prev(self) -> Period {
        match self {
            Period::Month => Period::Week,
            Period::Week | Period::Today => Period::Today,
        }
    }

    /// The São Paulo days the period covers, oldest first, ending today.
    pub fn days(self, now: DateTime<Utc>) -> Vec<String> {
        (0..self.length()).rev().map(|ago| today(now - Duration::days(ago))).collect()
    }
}

/// The earliest `at` the 30-day load needs, in the stored ISO format:
/// midnight in São Paulo on the first day of the month-long period.
pub fn load_start(now: DateTime<Utc>) -> String {
    format!("{}T03:00:00.000Z", Period::Month.days(now)[0])
}
```

**Step 4:** PASS. **Step 5:** `/git commit` (`✨ feat(stats): compute São Paulo days and periods`).

---

## Lote 2

### Task 6: funil por visitante-dia

**Requirement:** REQ-007, REQ-009
**Depends on:** Tasks 3, 4
**Files:** Create `tools/stats/src/funnel.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

Regra (documentada no código): uma visita alcança uma etapa quando fez aquela etapa **ou
uma posterior**. Assim as contagens nunca crescem funil abaixo: quem veio direto ao
formulário conta como "chegou" e "viu evidência", e a porcentagem de passagem fica entre 0 e
100.

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Conversion;

    fn event(visitor: &str, at: &str, kind: &str, path: &str, channel: &str, conversion: Option<(&str, &str)>) -> Event {
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
            event("a", "2026-10-14T12:00:00Z", "pageview", "/", "linkedin", None),
            event("a", "2026-10-14T12:01:00Z", "pageview", "/lab/forja", "internal", None),
            event("a", "2026-10-14T12:02:00Z", "conversion", "/go/lab/forja/repo", "internal", Some(("outbound", ""))),
            event("a", "2026-10-14T12:03:00Z", "conversion", "/api/cv", "internal", Some(("cv", "cv-1"))),
            // b: arrives from Google and leaves from the home page.
            event("b", "2026-10-14T13:00:00Z", "pageview", "/", "google", None),
            // c: reads a post, from nowhere in particular.
            event("c", "2026-10-14T14:00:00Z", "pageview", "/um-post", "direct", None),
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
        let events = vec![event("d", "2026-10-14T15:00:00Z", "conversion", "/api/hire", "direct", Some(("hire", "h-1")))];
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
            event("g", "2026-10-14T10:05:00Z", "pageview", "/sobre", "internal", None),
            event("g", "2026-10-14T10:00:00Z", "pageview", "/", "bluesky", None),
        ];
        assert!(funnel(&events, &days()).by_channel.contains_key("bluesky"));

        let inside_only = vec![event("h", "2026-10-14T10:00:00Z", "pageview", "/", "internal", None)];
        assert!(funnel(&inside_only, &days()).by_channel.contains_key("direct"));
    }

    #[test]
    fn rounds_the_pass_rate_and_has_none_for_the_first_stage() {
        assert_eq!(pass_rate(&[3, 2, 1, 1], 0), None);
        assert_eq!(pass_rate(&[3, 2, 1, 1], 1), Some(67));
        assert_eq!(pass_rate(&[0, 0, 0, 0], 1), None);
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml funnel`, esperado FAIL.

**Step 3 (Green)**, e `pub mod funnel;` no `lib.rs`:

```rust
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
fn entry_channel(visit: &[&Event]) -> String {
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
    for event in events.iter().filter(|e| e.class == "human" && days.contains(&e.day)) {
        visits.entry((&event.day, &event.visitor)).or_default().push(event);
    }

    let mut out = Funnel::default();
    for ((day, visitor), mut visit) in visits {
        visit.sort_by_key(|event| event.at);
        let lead = visit.iter().any(|e| e.is_conversion(&["cv", "hire"]));
        let acted = lead || visit.iter().any(|e| e.is_conversion(&["outbound"]));
        let evidence = acted || visit.iter().any(|e| e.kind == "pageview" && is_evidence(&e.path));
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

    out.leads.sort_by(|a, b| b.at.cmp(&a.at));
    out
}
```

**Step 4:** PASS (5 testes). **Step 5:** `/git commit` (`✨ feat(stats): count the funnel per visitor and day`).

### Task 7: totais do período a partir dos contadores diários

**Requirement:** REQ-011, REQ-012
**Depends on:** Tasks 1, 3
**Files:** Create `tools/stats/src/totals.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn sums_days_and_ranks_with_decoded_keys() {
        let a = Daily::from_data("2026-10-13", &json!({"pages": {"%2Flab": 2, "%2F": 5}, "channels": {"utm:linkedin": 1}}));
        let b = Daily::from_data("2026-10-14", &json!({"pages": {"%2Flab": 4}, "outbound": {"contato%2Fgithub": 3}}));
        let totals = sum(&[&a, &b]);

        assert_eq!(totals.top("pages", 10), vec![("/lab".to_owned(), 6), ("/".to_owned(), 5)]);
        assert_eq!(totals.top("outbound", 10), vec![("contato/github".to_owned(), 3)]);
        assert_eq!(totals.top("channels", 10), vec![("utm:linkedin".to_owned(), 1)]);
        assert_eq!(totals.get("conversions", "mcp"), 0);
    }

    #[test]
    fn breaks_ties_by_name_and_honours_the_limit() {
        let day = Daily::from_data("2026-10-14", &json!({"countries": {"US": 2, "BR": 2, "PT": 1}}));
        assert_eq!(sum(&[&day]).top("countries", 2), vec![("BR".to_owned(), 2), ("US".to_owned(), 2)]);
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml totals`, esperado FAIL.

**Step 3 (Green)**, e `pub mod totals;` no `lib.rs`:

```rust
use crate::keys::decode_counter_key;
use crate::model::Daily;
use std::collections::BTreeMap;

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
                let key = if ENCODED_GROUPS.contains(&group.as_str()) { decode_counter_key(key) } else { key.clone() };
                *target.entry(key).or_default() += count;
            }
        }
    }
    Totals { groups }
}

impl Totals {
    pub fn get(&self, group: &str, key: &str) -> i64 {
        self.groups.get(group).and_then(|counters| counters.get(key)).copied().unwrap_or(0)
    }

    /// The `limit` largest counters of a group, largest first, ties by name.
    pub fn top(&self, group: &str, limit: usize) -> Vec<(String, i64)> {
        let mut entries: Vec<(String, i64)> =
            self.groups.get(group).map(|counters| counters.iter().map(|(k, v)| (k.clone(), *v)).collect()).unwrap_or_default();
        entries.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
        entries.truncate(limit);
        entries
    }
}
```

**Step 4:** PASS. **Step 5:** `/git commit` (`✨ feat(stats): add up daily counters over a period`).

### Task 8: intervalo de atualização e tempo real

**Requirement:** REQ-003, REQ-004, REQ-005
**Files:** Create `tools/stats/src/schedule.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_at_30_seconds_and_toggles_to_5() {
        let start = Instant::now();
        let mut schedule = Schedule::default();
        assert_eq!(schedule.interval(), Duration::from_secs(30));
        assert_eq!(schedule.label(), "a cada 30 s");

        schedule.toggle(start);
        assert_eq!(schedule.interval(), Duration::from_secs(5));
        assert_eq!(schedule.label(), "tempo real · 5 s");

        schedule.toggle(start);
        assert_eq!(schedule.interval(), Duration::from_secs(30));
    }

    #[test]
    fn turns_the_fast_mode_off_after_30_minutes_with_a_notice() {
        let start = Instant::now();
        let mut schedule = Schedule::default();
        schedule.toggle(start);

        assert_eq!(schedule.expire(start + Duration::from_secs(29 * 60)), None);
        assert_eq!(schedule.expire(start + Duration::from_secs(30 * 60)), Some(FAST_OFF_NOTICE));
        assert_eq!(schedule.interval(), Duration::from_secs(30));
        assert_eq!(schedule.expire(start + Duration::from_secs(31 * 60)), None);
    }

    #[test]
    fn restarts_the_30_minutes_when_turned_on_again() {
        let start = Instant::now();
        let mut schedule = Schedule::default();
        schedule.toggle(start);
        schedule.toggle(start + Duration::from_secs(60));
        schedule.toggle(start + Duration::from_secs(20 * 60));

        assert_eq!(schedule.expire(start + Duration::from_secs(40 * 60)), None);
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml schedule`, esperado FAIL.

**Step 3 (Green)**, e `pub mod schedule;` no `lib.rs`:

```rust
use std::time::{Duration, Instant};

pub const NORMAL: Duration = Duration::from_secs(30);
pub const FAST: Duration = Duration::from_secs(5);
/// The fast mode is for a moment (right after publishing) and easy to forget
/// on; it turns itself off after this long (REQ-005).
pub const FAST_LIMIT: Duration = Duration::from_secs(30 * 60);
pub const FAST_OFF_NOTICE: &str = "tempo real desligado após 30 min";

#[derive(Debug, Default)]
pub struct Schedule {
    fast_since: Option<Instant>,
}

impl Schedule {
    /// `r` (REQ-004): on starts the 30 minutes over, off goes back to 30 s.
    pub fn toggle(&mut self, now: Instant) {
        self.fast_since = match self.fast_since {
            Some(_) => None,
            None => Some(now),
        };
    }

    /// Turns the fast mode off once it has run for 30 minutes, and returns
    /// the notice for the status bar.
    pub fn expire(&mut self, now: Instant) -> Option<&'static str> {
        match self.fast_since {
            Some(since) if now.duration_since(since) >= FAST_LIMIT => {
                self.fast_since = None;
                Some(FAST_OFF_NOTICE)
            }
            _ => None,
        }
    }

    pub fn interval(&self) -> Duration {
        if self.fast_since.is_some() { FAST } else { NORMAL }
    }

    pub fn label(&self) -> &'static str {
        if self.fast_since.is_some() { "tempo real · 5 s" } else { "a cada 30 s" }
    }
}
```

**Step 4:** PASS. **Step 5:** `/git commit` (`✨ feat(stats): schedule refreshes with a self-ending fast mode`).

### Task 9: autenticação pelo gcloud

**Requirement:** REQ-001, REQ-002
**Files:** Create `tools/stats/src/auth.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · security-reviewer, business-logic-reviewer, test-reviewer

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;
    use std::collections::VecDeque;

    /// Scripted answers, in order; records every call.
    #[derive(Default)]
    struct Fake {
        captures: RefCell<VecDeque<CommandOutput>>,
        interactives: RefCell<VecDeque<bool>>,
        calls: RefCell<Vec<String>>,
    }

    impl Runner for Fake {
        fn capture(&self, program: &str, args: &[&str]) -> std::io::Result<CommandOutput> {
            self.calls.borrow_mut().push(format!("{program} {}", args.join(" ")));
            Ok(self.captures.borrow_mut().pop_front().expect("unexpected capture"))
        }
        fn interactive(&self, program: &str, args: &[&str]) -> std::io::Result<bool> {
            self.calls.borrow_mut().push(format!("! {program} {}", args.join(" ")));
            Ok(self.interactives.borrow_mut().pop_front().expect("unexpected interactive"))
        }
    }

    fn out(success: bool, stdout: &str) -> CommandOutput {
        CommandOutput { success, stdout: stdout.into(), stderr: String::new() }
    }

    #[test]
    fn uses_the_existing_credentials_without_logging_in() {
        let fake = Fake::default();
        fake.captures.borrow_mut().push_back(out(true, "ya29.token\n"));

        assert_eq!(access_token(&fake).unwrap(), "ya29.token");
        assert_eq!(fake.calls.borrow().as_slice(), ["gcloud auth application-default print-access-token"]);
    }

    #[test]
    fn runs_the_login_in_the_terminal_when_there_is_no_token() {
        let fake = Fake::default();
        fake.captures.borrow_mut().extend([out(false, ""), out(true, "ya29.new")]);
        fake.interactives.borrow_mut().push_back(true);

        assert_eq!(access_token(&fake).unwrap(), "ya29.new");
        assert_eq!(fake.calls.borrow()[1], "! gcloud auth application-default login");
    }

    #[test]
    fn gives_up_with_the_command_when_the_login_fails() {
        let fake = Fake::default();
        fake.captures.borrow_mut().push_back(out(false, ""));
        fake.interactives.borrow_mut().push_back(false);

        let error = access_token(&fake).unwrap_err().to_string();
        assert!(error.contains("gcloud auth application-default login"), "{error}");
    }

    #[test]
    fn refreshing_never_logs_in() {
        let fake = Fake::default();
        fake.captures.borrow_mut().push_back(out(false, ""));

        assert!(refresh_token(&fake).is_err());
        assert_eq!(fake.calls.borrow().len(), 1);
    }

    #[test]
    fn sets_the_quota_project_only_when_missing() {
        let fake = Fake::default();
        ensure_quota_project(&fake, Some(r#"{"quota_project_id":"nandomoreira-dev"}"#), "nandomoreira-dev").unwrap();
        assert!(fake.calls.borrow().is_empty());

        fake.interactives.borrow_mut().push_back(true);
        ensure_quota_project(&fake, Some(r#"{"type":"authorized_user"}"#), "nandomoreira-dev").unwrap();
        assert_eq!(fake.calls.borrow()[0], "! gcloud auth application-default set-quota-project nandomoreira-dev");
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml auth`, esperado FAIL.

**Step 3 (Green)**, e `pub mod auth;` no `lib.rs`:

```rust
use anyhow::{Context, anyhow, bail};
use serde_json::Value;
use std::path::PathBuf;
use std::process::Command;

pub struct CommandOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

/// Runs gcloud. A trait so the tests never spawn a process.
pub trait Runner {
    fn capture(&self, program: &str, args: &[&str]) -> std::io::Result<CommandOutput>;
    /// Attached to the terminal: the login opens a browser and may prompt.
    fn interactive(&self, program: &str, args: &[&str]) -> std::io::Result<bool>;
}

pub struct System;

impl Runner for System {
    fn capture(&self, program: &str, args: &[&str]) -> std::io::Result<CommandOutput> {
        let output = Command::new(program).args(args).output()?;
        Ok(CommandOutput {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        })
    }

    fn interactive(&self, program: &str, args: &[&str]) -> std::io::Result<bool> {
        Ok(Command::new(program).args(args).status()?.success())
    }
}

pub const LOGIN_COMMAND: &str = "gcloud auth application-default login";
const TOKEN_ARGS: [&str; 3] = ["auth", "application-default", "print-access-token"];
const LOGIN_ARGS: [&str; 3] = ["auth", "application-default", "login"];

fn try_token(runner: &impl Runner) -> anyhow::Result<Option<String>> {
    let output = runner.capture("gcloud", &TOKEN_ARGS).context("gcloud não encontrado no PATH")?;
    let token = output.stdout.trim();
    Ok((output.success && !token.is_empty()).then(|| token.to_owned()))
}

/// REQ-001: a token from the gcloud default credentials; with none, the login
/// runs in this terminal (before the TUI draws anything) and is tried again.
pub fn access_token(runner: &impl Runner) -> anyhow::Result<String> {
    if let Some(token) = try_token(runner)? {
        return Ok(token);
    }
    if !runner.interactive("gcloud", &LOGIN_ARGS)? {
        bail!("o login do gcloud falhou ou foi cancelado; rode `{LOGIN_COMMAND}` e abra o nm-stats de novo");
    }
    try_token(runner)?.ok_or_else(|| anyhow!("sem token depois do login; rode `{LOGIN_COMMAND}`"))
}

/// A new token while the TUI is open: never logs in, since the terminal is
/// in raw mode; a failure goes to the status bar (REQ-014).
pub fn refresh_token(runner: &impl Runner) -> anyhow::Result<String> {
    try_token(runner)?.ok_or_else(|| anyhow!("token expirado; saia e rode `{LOGIN_COMMAND}`"))
}

/// The quota project recorded in the ADC file, if any.
pub fn quota_project(adc_json: &str) -> Option<String> {
    serde_json::from_str::<Value>(adc_json)
        .ok()?
        .get("quota_project_id")?
        .as_str()
        .filter(|project| !project.is_empty())
        .map(str::to_owned)
}

/// REQ-002: the Firestore REST API refuses user credentials without a quota
/// project, so one is set when the ADC file has none.
pub fn ensure_quota_project(runner: &impl Runner, adc_json: Option<&str>, project: &str) -> anyhow::Result<()> {
    if adc_json.and_then(quota_project).is_some() {
        return Ok(());
    }
    if runner.interactive("gcloud", &["auth", "application-default", "set-quota-project", project])? {
        Ok(())
    } else {
        bail!("não consegui definir o projeto de cota; rode `gcloud auth application-default set-quota-project {project}`")
    }
}

/// Where gcloud keeps the default credentials.
pub fn adc_path() -> Option<PathBuf> {
    if let Some(path) = std::env::var_os("GOOGLE_APPLICATION_CREDENTIALS") {
        return Some(PathBuf::from(path));
    }
    let home = std::env::var_os("HOME")?;
    Some(PathBuf::from(home).join(".config/gcloud/application_default_credentials.json"))
}
```

**Step 4:** PASS (5 testes). **Step 5:** `/git commit` (`✨ feat(stats): authenticate through gcloud default credentials`).

---

## Lote 3

### Task 10: cliente REST do Firestore

**Requirement:** REQ-003, REQ-011, REQ-013
**Depends on:** Tasks 2, 3
**Files:** Create `tools/stats/src/client.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · security-reviewer, business-logic-reviewer, test-reviewer

Os testes cobrem as partes puras (corpo da consulta, nomes dos documentos). As chamadas HTTP
são verificadas na Task 17. Só leitura: `runQuery`, `batchGet`, `GET`.

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn queries_events_from_an_instant_ordered_by_time() {
        let body = events_since_query("2026-09-15T03:00:00.000Z", 500);
        let query = &body["structuredQuery"];

        assert_eq!(query["from"][0]["collectionId"], "analytics_events");
        assert_eq!(query["where"]["fieldFilter"]["field"]["fieldPath"], "at");
        assert_eq!(query["where"]["fieldFilter"]["op"], "GREATER_THAN_OR_EQUAL");
        assert_eq!(query["where"]["fieldFilter"]["value"]["stringValue"], "2026-09-15T03:00:00.000Z");
        assert_eq!(query["orderBy"][0]["field"]["fieldPath"], "at");
        assert_eq!(query["limit"], 500);
    }

    #[test]
    fn names_daily_documents_and_lead_documents() {
        assert_eq!(
            daily_names("nandomoreira-dev", &["2026-10-14".to_owned()]),
            vec!["projects/nandomoreira-dev/databases/(default)/documents/analytics_daily/2026-10-14"]
        );
        assert_eq!(
            document_url("nandomoreira-dev", "cv_downloads", "cv-1"),
            "https://firestore.googleapis.com/v1/projects/nandomoreira-dev/databases/(default)/documents/cv_downloads/cv-1"
        );
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml client`, esperado FAIL.

**Step 3 (Green)**, e `pub mod client;` no `lib.rs`:

```rust
use crate::firestore::{Document, document_of, documents_of_batch, documents_of_query};
use crate::model::Daily;
use anyhow::bail;
use serde_json::{Value, json};

const API: &str = "https://firestore.googleapis.com/v1";
/// Events per page of the 30-day load.
pub const PAGE: u32 = 500;

pub fn documents_root(project: &str) -> String {
    format!("projects/{project}/databases/(default)/documents")
}

/// A single-field range on `at`, ordered by `at`: served by the automatic
/// single-field index, no composite index (spec Verified Claims, assumption).
/// `>=` and not `>`: events of one MCP batch share an `at`, so a page can end
/// in the middle of them; the caller dedupes by document name.
pub fn events_since_query(from_at: &str, limit: u32) -> Value {
    json!({
        "structuredQuery": {
            "from": [{"collectionId": "analytics_events"}],
            "where": {"fieldFilter": {
                "field": {"fieldPath": "at"},
                "op": "GREATER_THAN_OR_EQUAL",
                "value": {"stringValue": from_at}
            }},
            "orderBy": [{"field": {"fieldPath": "at"}, "direction": "ASCENDING"}],
            "limit": limit
        }
    })
}

pub fn daily_names(project: &str, days: &[String]) -> Vec<String> {
    days.iter().map(|day| format!("{}/analytics_daily/{day}", documents_root(project))).collect()
}

pub fn document_url(project: &str, collection: &str, id: &str) -> String {
    format!("{API}/{}/{collection}/{id}", documents_root(project))
}

/// Read-only Firestore client: runQuery, batchGet and GET, nothing else.
pub struct Firestore {
    http: reqwest::Client,
    project: String,
    token: String,
}

impl Firestore {
    pub fn new(project: &str, token: String) -> Firestore {
        Firestore { http: reqwest::Client::new(), project: project.to_owned(), token }
    }

    pub fn set_token(&mut self, token: String) {
        self.token = token;
    }

    async fn send(&self, request: reqwest::RequestBuilder) -> anyhow::Result<Option<Value>> {
        let response = request
            .bearer_auth(&self.token)
            .header("x-goog-user-project", &self.project)
            .send()
            .await?;
        let status = response.status();
        if status == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            bail!("Firestore {status}: {}", body.chars().take(200).collect::<String>());
        }
        Ok(Some(response.json().await?))
    }

    async fn post(&self, url: String, body: &Value) -> anyhow::Result<Value> {
        Ok(self.send(self.http.post(url).json(body)).await?.unwrap_or(Value::Null))
    }

    /// Every event with `at` >= `from`, page by page (REQ-003).
    pub async fn events_since(&self, from: &str) -> anyhow::Result<Vec<Document>> {
        let url = format!("{API}/{}:runQuery", documents_root(&self.project));
        let mut cursor = from.to_owned();
        let mut out = Vec::new();
        loop {
            let page = documents_of_query(&self.post(url.clone(), &events_since_query(&cursor, PAGE)).await?);
            let full = page.len() == PAGE as usize;
            let last = page.last().and_then(|doc| doc.data.get("at")?.as_str().map(str::to_owned));
            out.extend(page);
            match last {
                // A full page whose last `at` moved on: there may be more.
                Some(at) if full && at != cursor => cursor = at,
                _ => break,
            }
        }
        Ok(out)
    }

    /// The daily documents of `days` that exist (REQ-011, REQ-012).
    pub async fn dailies(&self, days: &[String]) -> anyhow::Result<Vec<Daily>> {
        let url = format!("{API}/{}:batchGet", documents_root(&self.project));
        let response = self.post(url, &json!({"documents": daily_names(&self.project, days)})).await?;
        Ok(documents_of_batch(&response).iter().map(|doc| Daily::from_data(doc.id(), &doc.data)).collect())
    }

    /// One document, or None when it does not exist (REQ-013).
    pub async fn document(&self, collection: &str, id: &str) -> anyhow::Result<Option<Value>> {
        let response = self.send(self.http.get(document_url(&self.project, collection, id))).await?;
        Ok(response.as_ref().and_then(document_of).map(|doc| doc.data))
    }
}
```

**Step 4:** PASS. **Step 5:** `/git commit` (`✨ feat(stats): read Firestore through its REST API`).

### Task 11: detalhe de lead

**Requirement:** REQ-013
**Depends on:** Tasks 3, 5, 6
**Files:** Create `tools/stats/src/lead.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · security-reviewer, business-logic-reviewer, test-reviewer

**Step 1 (Red):**

```rust
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
        let events = [view("a", "2026-10-14T12:01:00Z", "/lab/forja"), view("a", "2026-10-14T12:00:00Z", "/"), view("b", "2026-10-14T12:00:00Z", "/x")];
        let detail = lead_detail(&lead("hire"), Some(&record), &events);

        assert!(detail.found);
        assert_eq!(detail.name.as_deref(), Some("Ada"));
        assert_eq!(detail.contact.as_deref(), Some("ada@example.com"));
        assert_eq!(detail.brief.as_deref(), Some("Preciso de um MCP"));
        assert_eq!(detail.pages, vec![("09:00:00".to_owned(), "/".to_owned()), ("09:01:00".to_owned(), "/lab/forja".to_owned())]);
    }

    #[test]
    fn reads_name_and_email_of_a_cv_download() {
        let detail = lead_detail(&lead("cv"), Some(&json!({"name": "Grace", "email": null})), &[]);
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
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml lead`, esperado FAIL.

**Step 3 (Green)**, e `pub mod lead;` no `lib.rs`:

```rust
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
    if kind == "hire" { "hire_requests" } else { "cv_downloads" }
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
        pages: views.iter().map(|e| (clock(e.at), e.path.clone())).collect(),
    }
}
```

**Step 4:** PASS. **Step 5:** `/git commit` (`✨ feat(stats): open a lead with its record and journey`).

### Task 12: estado da TUI e teclado

**Requirement:** REQ-004, REQ-010, REQ-013, REQ-015, REQ-016
**Depends on:** Tasks 3, 5, 6, 7, 8, 11
**Files:** Create `tools/stats/src/app.rs`; Modify `tools/stats/src/lib.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · business-logic-reviewer, test-reviewer

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::firestore::Document;
    use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
    use serde_json::json;

    fn key(code: KeyCode) -> KeyEvent {
        KeyEvent::new(code, KeyModifiers::NONE)
    }

    fn now() -> DateTime<Utc> {
        "2026-10-14T18:00:00Z".parse().unwrap()
    }

    fn doc(name: &str, at: &str, conversion: Option<serde_json::Value>) -> Document {
        let mut data = json!({"kind": if conversion.is_some() {"conversion"} else {"pageview"}, "at": at, "day": "2026-10-14",
                              "visitor": "v", "class": "human", "path": "/", "channel": "linkedin"});
        if let Some(c) = conversion { data["conversion"] = c; }
        Document { name: name.into(), data }
    }

    #[test]
    fn merges_new_events_once_and_moves_the_cursor() {
        let mut log = EventLog::default();
        assert_eq!(log.merge(vec![doc("e/1", "2026-10-14T12:00:00.000Z", None), doc("e/2", "2026-10-14T12:00:01.500Z", None)]), 2);
        assert_eq!(log.merge(vec![doc("e/2", "2026-10-14T12:00:01.500Z", None)]), 0);
        assert_eq!(log.cursor().as_deref(), Some("2026-10-14T12:00:01.500Z"));
        assert_eq!(log.recent(1)[0].at.to_rfc3339(), "2026-10-14T12:00:01.500+00:00");
    }

    #[test]
    fn skips_documents_that_are_not_valid_events() {
        let mut log = EventLog::default();
        assert_eq!(log.merge(vec![Document { name: "e/x".into(), data: json!({"at": "ontem"}) }]), 0);
    }

    #[test]
    fn switches_tabs_with_numbers_and_tab() {
        let mut app = App::default();
        app.on_key(key(KeyCode::Char('3')), Instant::now(), now());
        assert_eq!(app.tab, Tab::Traffic);
        app.on_key(key(KeyCode::Tab), Instant::now(), now());
        assert_eq!(app.tab, Tab::Mcp);
        app.on_key(key(KeyCode::Tab), Instant::now(), now());
        assert_eq!(app.tab, Tab::Live);
    }

    #[test]
    fn toggles_the_fast_mode_and_steps_the_period() {
        let mut app = App::default();
        assert_eq!(app.on_key(key(KeyCode::Char('r')), Instant::now(), now()), Action::Refresh);
        assert_eq!(app.schedule.label(), "tempo real · 5 s");
        app.on_key(key(KeyCode::Char(']')), Instant::now(), now());
        assert_eq!(app.period, Period::Week);
        app.on_key(key(KeyCode::Char('[')), Instant::now(), now());
        assert_eq!(app.period, Period::Today);
    }

    #[test]
    fn quits_on_q_and_ctrl_c_but_q_first_closes_a_detail() {
        let mut app = App::default();
        assert_eq!(app.on_key(key(KeyCode::Char('q')), Instant::now(), now()), Action::Quit);
        assert_eq!(app.on_key(KeyEvent::new(KeyCode::Char('c'), KeyModifiers::CONTROL), Instant::now(), now()), Action::Quit);

        app.detail = Some(crate::lead::LeadDetail {
            kind: "cv".into(), found: false, name: None, contact: None, brief: None, company: None, budget: None,
            entry: "direct".into(), pages: vec![],
        });
        assert_eq!(app.on_key(key(KeyCode::Char('q')), Instant::now(), now()), Action::None);
        assert!(app.detail.is_none());
    }

    #[test]
    fn opens_the_selected_lead_on_the_funnel_tab() {
        let mut app = App { tab: Tab::Funnel, ..App::default() };
        app.log.merge(vec![
            doc("e/1", "2026-10-14T12:00:00.000Z", None),
            doc("e/2", "2026-10-14T12:01:00.000Z", Some(json!({"type": "cv", "refId": "cv-1"}))),
        ]);

        match app.on_key(key(KeyCode::Enter), Instant::now(), now()) {
            Action::OpenLead(lead) => assert_eq!(lead.ref_id, "cv-1"),
            other => panic!("expected OpenLead, got {other:?}"),
        }
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml app`, esperado FAIL.

**Step 3 (Green)**, e `pub mod app;` no `lib.rs`:

```rust
use crate::firestore::Document;
use crate::funnel::{Funnel, Lead, funnel};
use crate::lead::LeadDetail;
use crate::model::{Daily, Event};
use crate::period::{Period, today};
use crate::schedule::Schedule;
use crate::totals::{Totals, sum};
use chrono::{DateTime, Utc};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use std::collections::{BTreeMap, HashSet};
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Tab {
    #[default]
    Live,
    Funnel,
    Traffic,
    Mcp,
}

pub const TAB_TITLES: [&str; 4] = ["Ao vivo", "Funil", "Tráfego", "MCP"];
const TABS: [Tab; 4] = [Tab::Live, Tab::Funnel, Tab::Traffic, Tab::Mcp];

impl Tab {
    pub fn index(self) -> usize {
        TABS.iter().position(|tab| *tab == self).unwrap_or(0)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum Action {
    None,
    Quit,
    Refresh,
    OpenLead(Lead),
}

/// Events seen so far, deduplicated by document name.
#[derive(Debug, Default)]
pub struct EventLog {
    events: Vec<Event>,
    seen: HashSet<String>,
}

impl EventLog {
    /// Adds the documents not seen before; returns how many were new.
    pub fn merge(&mut self, documents: Vec<Document>) -> usize {
        let mut added = 0;
        for document in documents {
            if self.seen.contains(&document.name) {
                continue;
            }
            if let Some(event) = Event::from_data(&document.data) {
                self.seen.insert(document.name);
                self.events.push(event);
                added += 1;
            }
        }
        if added > 0 {
            self.events.sort_by_key(|event| event.at);
        }
        added
    }

    /// The latest `at`, in the stored ISO format, to resume from (REQ-003).
    pub fn cursor(&self) -> Option<String> {
        self.events.last().map(|event| event.at.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string())
    }

    pub fn events(&self) -> &[Event] {
        &self.events
    }

    /// The `n` newest events, newest first.
    pub fn recent(&self, n: usize) -> Vec<&Event> {
        self.events.iter().rev().take(n).collect()
    }
}

#[derive(Debug, Default)]
pub struct App {
    pub tab: Tab,
    pub period: Period,
    pub schedule: Schedule,
    pub log: EventLog,
    pub dailies: BTreeMap<String, Daily>,
    pub status: Option<String>,
    pub selected: usize,
    pub detail: Option<LeadDetail>,
}

impl App {
    pub fn funnel(&self, now: DateTime<Utc>) -> Funnel {
        funnel(self.log.events(), &self.period.days(now))
    }

    pub fn totals(&self, now: DateTime<Utc>) -> Totals {
        let days = self.period.days(now);
        let dailies: Vec<&Daily> = days.iter().filter_map(|day| self.dailies.get(day)).collect();
        sum(&dailies)
    }

    pub fn today(&self, now: DateTime<Utc>) -> Option<&Daily> {
        self.dailies.get(&today(now))
    }

    /// One key press. A detail on screen takes the keys first: Esc, Enter or
    /// q close it, so q never quits from inside a lead.
    pub fn on_key(&mut self, key: KeyEvent, now: Instant, wall: DateTime<Utc>) -> Action {
        if self.detail.is_some() {
            if matches!(key.code, KeyCode::Esc | KeyCode::Enter | KeyCode::Char('q')) {
                self.detail = None;
            }
            return Action::None;
        }

        match key.code {
            KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => Action::Quit,
            KeyCode::Char('q') => Action::Quit,
            KeyCode::Char(digit @ '1'..='4') => {
                self.tab = TABS[digit as usize - '1' as usize];
                Action::None
            }
            KeyCode::Tab => {
                self.tab = TABS[(self.tab.index() + 1) % TABS.len()];
                Action::None
            }
            KeyCode::BackTab => {
                self.tab = TABS[(self.tab.index() + TABS.len() - 1) % TABS.len()];
                Action::None
            }
            KeyCode::Char('r') => {
                self.schedule.toggle(now);
                self.status = Some(self.schedule.label().to_owned());
                Action::Refresh
            }
            KeyCode::Char(']') => {
                self.period = self.period.next();
                self.selected = 0;
                Action::None
            }
            KeyCode::Char('[') => {
                self.period = self.period.prev();
                self.selected = 0;
                Action::None
            }
            KeyCode::Down | KeyCode::Char('j') if self.tab == Tab::Funnel => {
                let leads = self.funnel(wall).leads.len();
                self.selected = (self.selected + 1).min(leads.saturating_sub(1));
                Action::None
            }
            KeyCode::Up | KeyCode::Char('k') if self.tab == Tab::Funnel => {
                self.selected = self.selected.saturating_sub(1);
                Action::None
            }
            KeyCode::Enter if self.tab == Tab::Funnel => {
                self.funnel(wall).leads.get(self.selected).cloned().map_or(Action::None, Action::OpenLead)
            }
            _ => Action::None,
        }
    }
}
```

`Period` precisa de `Default` (hoje): acrescentar `#[derive(Default)]` e `#[default]` em
`Period::Today` no `period.rs` (Task 5), no mesmo commit desta tarefa.

**Step 4:** PASS (6 testes). **Step 5:** `/git commit` (`✨ feat(stats): hold the TUI state and keys`).

### Task 13: tema

**Requirement:** REQ-017
**Files:** Create `tools/stats/src/theme.rs`; Modify `tools/stats/src/lib.rs`
**Team:** frontend · `frontend-engineer` (rust-cli-conventions) · test-reviewer

**Step 1 (Red):**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uses_the_site_palette_with_true_color() {
        let theme = theme(Some("truecolor"));
        assert_eq!(theme.bg, Color::Rgb(0x11, 0x0f, 0x0d));
        assert_eq!(theme.fg, Color::Rgb(0xef, 0xeb, 0xe2));
        assert_eq!(theme.accent, Color::Rgb(0xf0, 0xc3, 0x6f));
        assert_eq!(theme(Some("24bit")).accent, theme.accent);
    }

    #[test]
    fn falls_back_to_ansi_colours() {
        let theme = theme(None);
        assert_eq!(theme.bg, Color::Reset);
        assert_eq!(theme.accent, Color::Yellow);
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml theme`, esperado FAIL.

**Step 3 (Green)**, e `pub mod theme;` no `lib.rs`:

```rust
use ratatui::style::Color;

/// The site's palette (src/styles/global.css), or the 16 ANSI colours when
/// the terminal does not announce true colour (REQ-017).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Theme {
    pub bg: Color,
    pub fg: Color,
    pub muted: Color,
    pub accent: Color,
}

/// `colorterm` is the value of $COLORTERM.
pub fn theme(colorterm: Option<&str>) -> Theme {
    match colorterm {
        Some("truecolor" | "24bit") => Theme {
            bg: Color::Rgb(0x11, 0x0f, 0x0d),
            fg: Color::Rgb(0xef, 0xeb, 0xe2),
            muted: Color::Rgb(0xa2, 0x9e, 0x96),
            accent: Color::Rgb(0xf0, 0xc3, 0x6f),
        },
        _ => Theme { bg: Color::Reset, fg: Color::White, muted: Color::DarkGray, accent: Color::Yellow },
    }
}
```

**Step 4:** PASS. **Step 5:** `/git commit` (`✨ feat(stats): paint the TUI with the site palette`).

---

## Lote 4

### Task 14: telas

**Requirement:** REQ-006, REQ-007, REQ-011, REQ-012, REQ-013, REQ-016
**Depends on:** Tasks 12, 13
**Files:** Create `tools/stats/src/ui.rs`; Modify `tools/stats/src/lib.rs`
**Team:** frontend · `frontend-engineer` (rust-cli-conventions) · test-reviewer, business-logic-reviewer

**Step 1 (Red):**

```rust
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
        terminal.draw(|frame| draw(frame, app, now(), &theme(None))).unwrap();
        let buffer = terminal.backend().buffer();
        (0..buffer.area.height)
            .map(|y| (0..buffer.area.width).map(|x| buffer[(x, y)].symbol()).collect::<String>())
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
        app.dailies.insert("2026-10-14".into(), Daily::from_data("2026-10-14", &json!({
            "traffic": {"human": 7, "ai_agent": 2}, "conversions": {"cv": 1},
            "pages": {"%2Flab%2Fforja": 5}, "mcp": {"tools": {"get_profile": 3}}
        })));
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
        for stage in ["Chegou", "Viu evidência", "Agiu", "Virou lead", "linkedin", "cv"] {
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
            kind: "hire".into(), found: true, name: Some("Ada".into()), contact: Some("ada@example.com".into()),
            brief: Some("Preciso de um MCP".into()), company: None, budget: None, entry: "linkedin".into(),
            pages: vec![("14:59:00".into(), "/lab/forja".into())],
        });
        let text = screen(&app);
        assert!(text.contains("Ada"));
        assert!(text.contains("Preciso de um MCP"));
    }
}
```

**Step 2:** `cargo test --manifest-path tools/stats/Cargo.toml ui`, esperado FAIL.

**Step 3 (Green)**, e `pub mod ui;` no `lib.rs`:

```rust
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
    let [tabs, body, status] =
        Layout::vertical([Constraint::Length(1), Constraint::Min(0), Constraint::Length(1)]).areas(frame.area());

    let titles: Vec<Line> = TAB_TITLES.iter().enumerate().map(|(i, title)| Line::from(format!(" {} {title} ", i + 1))).collect();
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

    let line = format!(" {} · {} · {}", app.schedule.label(), app.period.label(), app.status.as_deref().unwrap_or(HELP));
    frame.render_widget(Paragraph::new(line).style(Style::new().fg(theme.muted)), status);

    if let Some(detail) = &app.detail {
        draw_detail(frame, detail, theme);
    }
}

fn titled(title: &str, theme: &Theme) -> Block<'static> {
    Block::new().borders(Borders::ALL).border_style(Style::new().fg(theme.muted)).title(format!(" {title} "))
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

    let rows = app.log.recent(feed.height.saturating_sub(3) as usize).into_iter().map(|e| {
        let style = if e.conversion.is_some() { Style::new().fg(theme.accent) } else { Style::new() };
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
    let header_row = Row::new(["hora", "classe", "visit.", "página", "canal", "país", "conversão"]).style(Style::new().fg(theme.muted));
    frame.render_widget(Table::new(rows, widths).header(header_row).block(titled("Eventos", theme)), feed);
}

fn draw_funnel(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let funnel = app.funnel(now);
    let [stages, channels, leads] =
        Layout::vertical([Constraint::Length(7), Constraint::Length(10), Constraint::Min(0)]).areas(area);

    let stage_rows = STAGES.iter().enumerate().map(|(i, stage)| {
        let rate = pass_rate(&funnel.total, i).map_or(String::new(), |r| format!("{r}%"));
        Row::new(vec![stage.to_string(), funnel.total[i].to_string(), rate])
    });
    frame.render_widget(
        Table::new(stage_rows, [Constraint::Length(16), Constraint::Length(8), Constraint::Length(8)])
            .block(titled(&format!("Funil · {}", app.period.label()), theme)),
        stages,
    );

    let channel_rows = funnel.by_channel.iter().map(|(channel, counts)| {
        let mut cells = vec![channel.clone()];
        cells.extend(counts.iter().map(usize::to_string));
        Row::new(cells)
    });
    let channel_header = Row::new(["canal", STAGES[0], STAGES[1], STAGES[2], STAGES[3]]).style(Style::new().fg(theme.muted));
    frame.render_widget(
        Table::new(channel_rows, [Constraint::Length(16), Constraint::Length(14), Constraint::Length(14), Constraint::Length(14), Constraint::Length(14)])
            .header(channel_header)
            .block(titled("Por canal de chegada", theme)),
        channels,
    );

    let lead_rows = funnel.leads.iter().enumerate().map(|(i, lead)| {
        let style = if i == app.selected { Style::new().fg(theme.bg).bg(theme.accent) } else { Style::new() };
        Row::new(vec![lead.day.clone(), clock(lead.at), lead.kind.clone(), lead.entry.clone(), lead.visitor.chars().take(6).collect()])
            .style(style)
    });
    frame.render_widget(
        Table::new(lead_rows, [Constraint::Length(11), Constraint::Length(9), Constraint::Length(6), Constraint::Length(16), Constraint::Length(7)])
            .block(titled("Leads (Enter abre)", theme)),
        leads,
    );
}

fn ranking(frame: &mut Frame, area: Rect, title: &str, rows: Vec<(String, i64)>, theme: &Theme) {
    let rows = rows.into_iter().map(|(key, count)| Row::new(vec![key, count.to_string()]));
    frame.render_widget(Table::new(rows, [Constraint::Min(20), Constraint::Length(8)]).block(titled(title, theme)), area);
}

fn draw_traffic(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let totals = app.totals(now);
    let [top, bottom] = Layout::vertical([Constraint::Percentage(50), Constraint::Percentage(50)]).areas(area);
    let [pages, channels] = Layout::horizontal([Constraint::Percentage(60), Constraint::Percentage(40)]).areas(top);
    let [countries, outbound] = Layout::horizontal([Constraint::Percentage(40), Constraint::Percentage(60)]).areas(bottom);
    let limit = (top.height.saturating_sub(2)) as usize;
    ranking(frame, pages, "Páginas", totals.top("pages", limit), theme);
    ranking(frame, channels, "Canais", totals.top("channels", limit), theme);
    ranking(frame, countries, "Países", totals.top("countries", limit), theme);
    ranking(frame, outbound, "Destinos do /go", totals.top("outbound", limit), theme);
}

fn draw_mcp(frame: &mut Frame, area: Rect, app: &App, now: DateTime<Utc>, theme: &Theme) {
    let totals = app.totals(now);
    let [header, lists] = Layout::vertical([Constraint::Length(3), Constraint::Min(0)]).areas(area);
    frame.render_widget(
        Paragraph::new(format!("chamadas de tool (conversões MCP): {}", totals.get("conversions", "mcp")))
            .block(titled(&format!("MCP · {}", app.period.label()), theme)),
        header,
    );
    let [tools, clients, methods] =
        Layout::horizontal([Constraint::Ratio(1, 3), Constraint::Ratio(1, 3), Constraint::Ratio(1, 3)]).areas(lists);
    let limit = lists.height.saturating_sub(2) as usize;
    ranking(frame, tools, "Tools", totals.top("mcp.tools", limit), theme);
    ranking(frame, clients, "Clientes", totals.top("mcp.clients", limit), theme);
    ranking(frame, methods, "Métodos", totals.top("mcp.methods", limit), theme);
}

fn draw_detail(frame: &mut Frame, detail: &crate::lead::LeadDetail, theme: &Theme) {
    let area = frame.area();
    let popup = Rect::new(area.width / 8, area.height / 8, area.width * 3 / 4, area.height * 3 / 4);
    let dash = |value: &Option<String>| value.clone().unwrap_or_else(|| "—".to_owned());

    let mut lines = vec![
        Line::from(format!("tipo: {} · chegou por: {}", detail.kind, detail.entry)),
        Line::from(if detail.found { String::new() } else { "registro não encontrado (expirou ou foi apagado)".to_owned() }),
        Line::from(format!("nome: {}", dash(&detail.name))),
        Line::from(format!("contato: {}", dash(&detail.contact))),
    ];
    if detail.kind == "hire" {
        lines.push(Line::from(format!("empresa: {} · orçamento: {}", dash(&detail.company), dash(&detail.budget))));
        lines.push(Line::from(format!("briefing: {}", dash(&detail.brief))));
    }
    lines.push(Line::from(""));
    lines.push(Line::from("percurso do dia:"));
    if detail.pages.is_empty() {
        lines.push(Line::from("  nenhuma página registrada"));
    }
    lines.extend(detail.pages.iter().map(|(time, path)| Line::from(format!("  {time}  {path}"))));

    frame.render_widget(Clear, popup);
    frame.render_widget(
        Paragraph::new(lines)
            .wrap(Wrap { trim: false })
            .style(Style::new().fg(theme.fg).bg(theme.bg))
            .block(titled("Lead (Esc fecha)", theme).border_style(Style::new().fg(theme.accent))),
        popup,
    );
}
```

**Step 4:** PASS (5 testes). **Step 5:** `/git commit` (`✨ feat(stats): draw the live, funnel, traffic and MCP tabs`).

### Task 15: laço principal

**Requirement:** REQ-001, REQ-002, REQ-003, REQ-005, REQ-013, REQ-014, REQ-015, REQ-018
**Depends on:** Tasks 9, 10, 12, 14
**Files:** Modify `tools/stats/src/main.rs`
**Team:** backend · `backend-engineer` (rust-cli-conventions) · security-reviewer, consequences-reviewer

Casca sem decisão própria: junta autenticação, cliente, terminal e laço. Exceção declarada
ao TDD: não há teste unitário; a prova é `cargo build`, `cargo clippy` e a Task 17.

**Step 1:** confirmar que a suíte inteira passa antes de mexer:
`cargo test --manifest-path tools/stats/Cargo.toml`.

**Step 2:** substituir `tools/stats/src/main.rs`:

```rust
use chrono::Utc;
use clap::Parser;
use crossterm::event::{Event as TermEvent, EventStream, KeyEventKind};
use futures::StreamExt;
use nm_stats::app::{Action, App};
use nm_stats::auth::{self, Runner, System};
use nm_stats::client::Firestore;
use nm_stats::lead::{collection_of, lead_detail};
use nm_stats::period::{Period, load_start, today};
use nm_stats::theme::{Theme, theme};
use nm_stats::ui;
use ratatui::DefaultTerminal;
use std::time::{Duration, Instant};

/// Gcloud access tokens last an hour; renew well before.
const TOKEN_TTL: Duration = Duration::from_secs(45 * 60);

#[derive(Parser)]
#[command(name = "nm-stats", about = "Visitas, funil e leads do nandomoreira.dev")]
struct Args {
    /// Projeto do Google Cloud (REQ-018).
    #[arg(long, default_value = "nandomoreira-dev")]
    project: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let runner = System;

    // REQ-001, REQ-002: before any drawing, so the login can use the terminal.
    let token = auth::access_token(&runner)?;
    let adc = auth::adc_path().and_then(|path| std::fs::read_to_string(path).ok());
    auth::ensure_quota_project(&runner, adc.as_deref(), &args.project)?;

    let mut client = Firestore::new(&args.project, token);
    let palette = theme(std::env::var("COLORTERM").ok().as_deref());

    // REQ-015: init installs a panic hook that restores the terminal too.
    let mut terminal = ratatui::init();
    let result = run(&mut terminal, &mut client, &runner, &palette).await;
    ratatui::restore();
    result
}

async fn run(terminal: &mut DefaultTerminal, client: &mut Firestore, runner: &impl Runner, palette: &Theme) -> anyhow::Result<()> {
    let mut app = App { status: Some("carregando os últimos 30 dias…".to_owned()), ..App::default() };
    terminal.draw(|frame| ui::draw(frame, &app, Utc::now(), palette))?;

    load_month(&mut app, client).await;
    refresh(&mut app, client).await;

    let mut keys = EventStream::new();
    let mut token_at = Instant::now();
    loop {
        terminal.draw(|frame| ui::draw(frame, &app, Utc::now(), palette))?;

        tokio::select! {
            _ = tokio::time::sleep(app.schedule.interval()) => {
                if let Some(notice) = app.schedule.expire(Instant::now()) {
                    app.status = Some(notice.to_owned());
                }
                if token_at.elapsed() >= TOKEN_TTL {
                    match auth::refresh_token(runner) {
                        Ok(token) => { client.set_token(token); token_at = Instant::now(); }
                        Err(error) => app.status = Some(format!("erro: {error}")),
                    }
                }
                refresh(&mut app, client).await;
            }
            Some(Ok(TermEvent::Key(key))) = keys.next() => {
                if key.kind != KeyEventKind::Press {
                    continue;
                }
                match app.on_key(key, Instant::now(), Utc::now()) {
                    Action::Quit => return Ok(()),
                    Action::Refresh => refresh(&mut app, client).await,
                    Action::OpenLead(lead) => match client.document(collection_of(&lead.kind), &lead.ref_id).await {
                        Ok(record) => app.detail = Some(lead_detail(&lead, record.as_ref(), app.log.events())),
                        Err(error) => app.status = Some(format!("erro ao abrir o lead: {error}")),
                    },
                    Action::None => {}
                }
            }
        }
    }
}

/// The 30 days of daily counters, once: past days no longer change.
async fn load_month(app: &mut App, client: &Firestore) {
    match client.dailies(&Period::Month.days(Utc::now())).await {
        Ok(dailies) => {
            for daily in dailies {
                app.dailies.insert(daily.day.clone(), daily);
            }
        }
        Err(error) => app.status = Some(format!("erro ao ler os totais: {error}")),
    }
}

/// REQ-003: new events since the last one seen, and today's counters. A
/// failure keeps what is on screen and goes to the status bar (REQ-014).
async fn refresh(app: &mut App, client: &Firestore) {
    let now = Utc::now();
    let from = app.log.cursor().unwrap_or_else(|| load_start(now));
    match client.events_since(&from).await {
        Ok(documents) => {
            app.log.merge(documents);
        }
        Err(error) => {
            app.status = Some(format!("erro ao ler eventos: {error}"));
            return;
        }
    }
    match client.dailies(&[today(now)]).await {
        Ok(dailies) => {
            for daily in dailies {
                app.dailies.insert(daily.day.clone(), daily);
            }
            if app.status.as_deref().is_some_and(|s| s.starts_with("erro") || s.starts_with("carregando")) {
                app.status = None;
            }
        }
        Err(error) => app.status = Some(format!("erro ao ler os totais de hoje: {error}")),
    }
}
```

**Step 3:** `cargo build --release --manifest-path tools/stats/Cargo.toml`, esperado sucesso;
`cargo clippy --manifest-path tools/stats/Cargo.toml --all-targets -- -D warnings`, esperado
sem avisos; `cargo test --manifest-path tools/stats/Cargo.toml`, esperado PASS.

**Step 4:** `/git commit` (`✨ feat(stats): run the TUI against Firestore`).

### Task 16: documentação

**Requirement:** todas (uso)
**Files:** Create `tools/stats/README.md`; Modify `CLAUDE.md` (seção "Comandos")
**Team:** docs · direto · self-review

`tools/stats/README.md` (pt-BR): o que é, pré-requisitos (`gcloud` no PATH, acesso de leitura
ao projeto), como rodar (`cargo run --release --manifest-path tools/stats/Cargo.toml` ou
`cargo install --path tools/stats` e depois `nm-stats`), a tabela de teclas (`1`–`4`/`Tab`,
`r`, `[`/`]`, `↑`/`↓`, `Enter`, `Esc`, `q`/Ctrl-C), a definição do funil (etapas cumulativas,
visitante-dia, só pessoas) e o custo em leituras (30 s padrão, 5 s por até 30 min).

`CLAUDE.md`, em "Comandos", depois do bloco do Spotify:

```bash
cargo run --release --manifest-path tools/stats/Cargo.toml   # nm-stats: visitas, funil e leads (TUI)
cargo test --manifest-path tools/stats/Cargo.toml            # testes do leitor
```

Commit: `/git commit` (`📝 docs(stats): document the analytics reader`).

### Task 17: verificação contra produção

**Requirement:** REQ-001 a REQ-016 (manual)
**Depends on:** Task 15
**Team:** infra · `infra-engineer` (cloud-cli) · security-reviewer · **com o autor presente**: o login pode abrir o navegador.

1. `cargo run --release --manifest-path tools/stats/Cargo.toml`.
2. A TUI abre sem pedir login (a credencial já existe); se pedir, o navegador abre e a TUI continua.
3. **Ao vivo:** o cabeçalho bate com `analytics_daily/<hoje>` lido pelo console ou por
   `curl` na API REST; uma visita nova ao site (de um navegador **sem** o cookie `nm_self`)
   aparece em até 30 s.
4. `r`: a barra mostra "tempo real · 5 s"; a próxima visita aparece em até 5 s.
5. **Funil, Tráfego, MCP:** os números de hoje batem com o documento diário; `]` troca para 7 e
   30 dias sem erro.
6. Se houver lead nos 30 dias: `Enter` abre o detalhe com nome e percurso; `Esc` fecha.
7. Derrubar a rede (`nmcli networking off`) por um ciclo: a TUI mostra o erro e continua;
   religar e o erro some no ciclo seguinte.
8. `q` sai e o terminal volta ao normal.
9. Se o Firestore recusar a consulta por índice (premissa da spec), anotar o link do erro e
   decidir com o autor entre criar o índice e mudar a consulta.

Resultado anotado no `STATE.md` da feature; sem commit de código nesta tarefa.

---

## Traceability

| REQ | Tarefas |
|---|---|
| REQ-001 | 9, 15, 17 |
| REQ-002 | 9, 15 |
| REQ-003 | 2, 8, 10, 12, 15 |
| REQ-004 | 8, 12 |
| REQ-005 | 8, 15 |
| REQ-006 | 3, 14 |
| REQ-007 | 6, 14 |
| REQ-008 | 4 |
| REQ-009 | 6 |
| REQ-010 | 5, 12 |
| REQ-011 | 1, 3, 7, 10, 14 |
| REQ-012 | 3, 7, 14 |
| REQ-013 | 10, 11, 12, 14, 15 |
| REQ-014 | 15, 17 |
| REQ-015 | 12, 15 |
| REQ-016 | 12, 14 |
| REQ-017 | 13 |
| REQ-018 | 15 |
