use serde_json::{Map, Value};

/// A Firestore REST value (`{"stringValue": "x"}`) as plain JSON. Integers
/// arrive as strings and become numbers; timestamps stay ISO strings.
pub fn decode_value(value: &Value) -> Value {
    let Some((kind, inner)) = value.as_object().and_then(|object| object.iter().next()) else {
        return Value::Null;
    };
    match kind.as_str() {
        "stringValue" | "timestampValue" | "referenceValue" | "doubleValue" | "booleanValue" => {
            inner.clone()
        }
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
        .map(|entries| {
            entries
                .iter()
                .filter_map(|entry| Document::from_resource(entry.get("document")?))
                .collect()
        })
        .unwrap_or_default()
}

/// `documents:batchGet` answers `found` or `missing` per requested name.
pub fn documents_of_batch(response: &Value) -> Vec<Document> {
    response
        .as_array()
        .map(|entries| {
            entries
                .iter()
                .filter_map(|entry| Document::from_resource(entry.get("found")?))
                .collect()
        })
        .unwrap_or_default()
}

/// A single `GET` of a document.
pub fn document_of(response: &Value) -> Option<Document> {
    Document::from_resource(response)
}

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
