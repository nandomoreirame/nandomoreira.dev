//! The web panel (docs/specs/stats-web): `stats web` serves it on loopback;
//! the homelab container serves it behind Caddy as stats.home.

pub mod host;

#[cfg(test)]
pub(crate) mod test_support;
