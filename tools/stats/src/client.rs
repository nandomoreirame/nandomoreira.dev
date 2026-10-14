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
    days.iter()
        .map(|day| format!("{}/analytics_daily/{day}", documents_root(project)))
        .collect()
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
        Firestore {
            http: reqwest::Client::new(),
            project: project.to_owned(),
            token,
        }
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
            bail!(
                "Firestore {status}: {}",
                body.chars().take(200).collect::<String>()
            );
        }
        Ok(Some(response.json().await?))
    }

    async fn post(&self, url: String, body: &Value) -> anyhow::Result<Value> {
        Ok(self
            .send(self.http.post(url).json(body))
            .await?
            .unwrap_or(Value::Null))
    }

    /// Every event with `at` >= `from`, page by page (REQ-003).
    pub async fn events_since(&self, from: &str) -> anyhow::Result<Vec<Document>> {
        let url = format!("{API}/{}:runQuery", documents_root(&self.project));
        let mut cursor = from.to_owned();
        let mut out = Vec::new();
        loop {
            let page = documents_of_query(
                &self
                    .post(url.clone(), &events_since_query(&cursor, PAGE))
                    .await?,
            );
            let full = page.len() == PAGE as usize;
            let last = page
                .last()
                .and_then(|doc| doc.data.get("at")?.as_str().map(str::to_owned));
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
        let response = self
            .post(url, &json!({"documents": daily_names(&self.project, days)}))
            .await?;
        Ok(documents_of_batch(&response)
            .iter()
            .map(|doc| Daily::from_data(doc.id(), &doc.data))
            .collect())
    }

    /// One document, or None when it does not exist (REQ-013).
    pub async fn document(&self, collection: &str, id: &str) -> anyhow::Result<Option<Value>> {
        let response = self
            .send(self.http.get(document_url(&self.project, collection, id)))
            .await?;
        Ok(response.as_ref().and_then(document_of).map(|doc| doc.data))
    }
}

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
        assert_eq!(
            query["where"]["fieldFilter"]["value"]["stringValue"],
            "2026-09-15T03:00:00.000Z"
        );
        assert_eq!(query["orderBy"][0]["field"]["fieldPath"], "at");
        assert_eq!(query["limit"], 500);
    }

    #[test]
    fn names_daily_documents_and_lead_documents() {
        assert_eq!(
            daily_names("nandomoreira-dev", &["2026-10-14".to_owned()]),
            vec![
                "projects/nandomoreira-dev/databases/(default)/documents/analytics_daily/2026-10-14"
            ]
        );
        assert_eq!(
            document_url("nandomoreira-dev", "cv_downloads", "cv-1"),
            "https://firestore.googleapis.com/v1/projects/nandomoreira-dev/databases/(default)/documents/cv_downloads/cv-1"
        );
    }
}
