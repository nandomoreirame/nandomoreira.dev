//! Firestore tokens for the web server (stats-web REQ-003, REQ-004): from a
//! service account key when GOOGLE_APPLICATION_CREDENTIALS points at one,
//! otherwise from gcloud, like the TUI. A key that does not read keeps the
//! server up and every refresh reports why (no restart loop).

use anyhow::{Context, anyhow, bail};
use jsonwebtoken::{Algorithm, EncodingKey, Header};
use serde::Serialize;
use serde_json::Value;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::Instant;

const SCOPE: &str = "https://www.googleapis.com/auth/datastore";
const GRANT: &str = "urn:ietf:params:oauth:grant-type:jwt-bearer";
/// Google issues one-hour tokens; renew this long before they end.
const MARGIN: Duration = Duration::from_secs(5 * 60);
/// gcloud does not say when its token ends; the TUI assumes 45 minutes.
const GCLOUD_TTL: Duration = Duration::from_secs(45 * 60);

#[derive(Clone, PartialEq, Eq)]
pub struct ServiceAccountKey {
    pub client_email: String,
    pub private_key: String,
    pub token_uri: String,
}

/// Never prints the private key, not even in a panic or a log line.
impl std::fmt::Debug for ServiceAccountKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ServiceAccountKey")
            .field("client_email", &self.client_email)
            .finish_non_exhaustive()
    }
}

pub fn parse_key(json: &str) -> anyhow::Result<ServiceAccountKey> {
    let value: Value =
        serde_json::from_str(json).context("a chave da conta de serviço não é JSON")?;
    if value.get("type").and_then(Value::as_str) != Some("service_account") {
        bail!("o arquivo não é uma chave de conta de serviço");
    }
    let field = |key: &str| {
        value
            .get(key)
            .and_then(Value::as_str)
            .filter(|text| !text.is_empty())
            .map(str::to_owned)
            .ok_or_else(|| anyhow!("chave da conta de serviço sem {key}"))
    };
    Ok(ServiceAccountKey {
        client_email: field("client_email")?,
        private_key: field("private_key")?,
        token_uri: field("token_uri")?,
    })
}

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct Claims {
    pub iss: String,
    pub scope: String,
    pub aud: String,
    pub iat: u64,
    pub exp: u64,
}

pub fn claims(key: &ServiceAccountKey, now_secs: u64) -> Claims {
    Claims {
        iss: key.client_email.clone(),
        scope: SCOPE.to_owned(),
        aud: key.token_uri.clone(),
        iat: now_secs,
        exp: now_secs + 3600,
    }
}

/// The signed JWT that Google trades for an access token.
pub fn assertion(key: &ServiceAccountKey, now_secs: u64) -> anyhow::Result<String> {
    let pem = EncodingKey::from_rsa_pem(key.private_key.as_bytes())
        .map_err(|_| anyhow!("chave privada da conta de serviço inválida"))?;
    jsonwebtoken::encode(&Header::new(Algorithm::RS256), &claims(key, now_secs), &pem)
        .map_err(|error| anyhow!("não consegui assinar o pedido de token: {error}"))
}

pub fn token_request_body(assertion: &str) -> String {
    form_urlencoded::Serializer::new(String::new())
        .append_pair("grant_type", GRANT)
        .append_pair("assertion", assertion)
        .finish()
}

pub fn parse_token_response(body: &str) -> anyhow::Result<(String, Duration)> {
    let value: Value = serde_json::from_str(body).context("resposta de token ilegível")?;
    let token = value
        .get("access_token")
        .and_then(Value::as_str)
        .ok_or_else(|| anyhow!("o Google não devolveu access_token"))?;
    let ttl = value
        .get("expires_in")
        .and_then(Value::as_u64)
        .unwrap_or(3600);
    Ok((token.to_owned(), Duration::from_secs(ttl)))
}

pub fn needs_renewal(expires_at: Option<Instant>, now: Instant) -> bool {
    expires_at.is_none_or(|end| now + MARGIN >= end)
}

#[derive(Debug)]
pub enum TokenSource {
    Gcloud,
    ServiceAccount(ServiceAccountKey),
    /// A service account file that did not read: every token request fails with this.
    Broken(String),
}

impl TokenSource {
    /// `contents` is the file GOOGLE_APPLICATION_CREDENTIALS points at, if any.
    /// A user credential (gcloud's ADC) goes through gcloud, as in the TUI.
    pub fn choose(contents: Option<&str>) -> TokenSource {
        let Some(json) = contents else {
            return TokenSource::Gcloud;
        };
        let kind = serde_json::from_str::<Value>(json)
            .ok()
            .and_then(|value| value.get("type")?.as_str().map(str::to_owned));
        if kind.as_deref() != Some("service_account") {
            return TokenSource::Gcloud;
        }
        match parse_key(json) {
            Ok(key) => TokenSource::ServiceAccount(key),
            Err(error) => TokenSource::Broken(error.to_string()),
        }
    }
}

pub struct Tokens {
    source: TokenSource,
    http: reqwest::Client,
    current: Option<(String, Instant)>,
}

impl Tokens {
    pub fn new(source: TokenSource, http: reqwest::Client) -> Tokens {
        Tokens {
            source,
            http,
            current: None,
        }
    }

    /// The token to use now, renewed when it is about to end; `force` after a 401.
    pub async fn token(&mut self, force: bool) -> anyhow::Result<String> {
        let now = Instant::now();
        if !force
            && let Some((token, end)) = &self.current
            && !needs_renewal(Some(*end), now)
        {
            return Ok(token.clone());
        }
        let (token, ttl) = match &self.source {
            TokenSource::Broken(reason) => bail!("credencial inválida: {reason}"),
            TokenSource::Gcloud => {
                let token = tokio::task::spawn_blocking(|| {
                    crate::auth::refresh_token(&crate::auth::System)
                })
                .await??;
                (token, GCLOUD_TTL)
            }
            TokenSource::ServiceAccount(key) => {
                let secs = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
                let response = self
                    .http
                    .post(&key.token_uri)
                    .header("content-type", "application/x-www-form-urlencoded")
                    .body(token_request_body(&assertion(key, secs)?))
                    .send()
                    .await?;
                let status = response.status();
                let body = response.text().await?;
                if !status.is_success() {
                    bail!("credencial inválida: o Google recusou a conta de serviço ({status})");
                }
                parse_token_response(&body)?
            }
        };
        self.current = Some((token.clone(), now + ttl));
        Ok(token)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::time::Duration;
    use tokio::time::Instant;

    fn key_json(kind: &str) -> String {
        json!({
            "type": kind,
            "client_email": "stats-reader@nandomoreira-dev.iam.gserviceaccount.com",
            "private_key": "not a pem",
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        .to_string()
    }

    #[test]
    fn reads_a_service_account_key_and_never_prints_the_private_part() {
        let key = parse_key(&key_json("service_account")).unwrap();
        assert_eq!(
            key.client_email,
            "stats-reader@nandomoreira-dev.iam.gserviceaccount.com"
        );
        assert!(!format!("{key:?}").contains("not a pem"));
    }

    #[test]
    fn rejects_files_that_are_not_service_account_keys() {
        assert!(
            parse_key("{")
                .unwrap_err()
                .to_string()
                .contains("não é JSON")
        );
        let user = parse_key(&key_json("authorized_user")).unwrap_err();
        assert!(
            user.to_string()
                .contains("não é uma chave de conta de serviço")
        );
        let missing = json!({"type": "service_account", "client_email": "a@b"}).to_string();
        assert!(
            parse_key(&missing)
                .unwrap_err()
                .to_string()
                .contains("sem private_key")
        );
    }

    #[test]
    fn asks_google_for_a_one_hour_read_token() {
        let key = parse_key(&key_json("service_account")).unwrap();
        let claims = claims(&key, 1_000);
        assert_eq!(claims.iss, key.client_email);
        assert_eq!(claims.aud, "https://oauth2.googleapis.com/token");
        assert_eq!(claims.scope, "https://www.googleapis.com/auth/datastore");
        assert_eq!((claims.iat, claims.exp), (1_000, 4_600));
        let body = token_request_body("abc.def");
        assert_eq!(
            body,
            "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=abc.def"
        );
    }

    #[test]
    fn a_broken_private_key_is_a_clear_error() {
        let key = parse_key(&key_json("service_account")).unwrap();
        assert!(
            assertion(&key, 1_000)
                .unwrap_err()
                .to_string()
                .contains("chave privada")
        );
    }

    #[test]
    fn reads_the_token_endpoint_answer() {
        let (token, ttl) =
            parse_token_response(r#"{"access_token":"ya29.x","expires_in":3599}"#).unwrap();
        assert_eq!((token.as_str(), ttl.as_secs()), ("ya29.x", 3599));
        assert!(parse_token_response(r#"{"error":"invalid_grant"}"#).is_err());
    }

    #[test]
    fn renews_five_minutes_before_the_end() {
        let now = Instant::now();
        assert!(needs_renewal(None, now));
        assert!(!needs_renewal(Some(now + Duration::from_secs(600)), now));
        assert!(needs_renewal(Some(now + Duration::from_secs(240)), now));
    }

    #[test]
    fn picks_the_service_account_only_when_the_file_is_one() {
        assert!(matches!(TokenSource::choose(None), TokenSource::Gcloud));
        let user = key_json("authorized_user");
        assert!(matches!(
            TokenSource::choose(Some(&user)),
            TokenSource::Gcloud
        ));
        let service = key_json("service_account");
        assert!(matches!(
            TokenSource::choose(Some(&service)),
            TokenSource::ServiceAccount(_)
        ));
        let broken = json!({"type": "service_account"}).to_string();
        assert!(matches!(
            TokenSource::choose(Some(&broken)),
            TokenSource::Broken(_)
        ));
    }

    #[tokio::test]
    async fn a_broken_source_keeps_failing_with_its_reason() {
        let mut tokens = Tokens::new(
            TokenSource::Broken("chave sem private_key".into()),
            reqwest::Client::new(),
        );
        let error = tokens.token(false).await.unwrap_err().to_string();
        assert!(error.contains("credencial inválida") && error.contains("sem private_key"));
    }
}
