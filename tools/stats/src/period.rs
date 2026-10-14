use chrono::{DateTime, Duration, FixedOffset, Utc};

/// São Paulo has had no daylight saving since 2019; the site makes the same
/// assumption (dailyExpiry in src/lib/analytics/event.ts).
pub fn sao_paulo() -> FixedOffset {
    FixedOffset::west_opt(3 * 3600).expect("a valid offset")
}

/// The `day` field of an event: the São Paulo date.
pub fn today(now: DateTime<Utc>) -> String {
    now.with_timezone(&sao_paulo())
        .format("%Y-%m-%d")
        .to_string()
}

pub fn clock(at: DateTime<Utc>) -> String {
    at.with_timezone(&sao_paulo())
        .format("%H:%M:%S")
        .to_string()
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
        (0..self.length())
            .rev()
            .map(|ago| today(now - Duration::days(ago)))
            .collect()
    }
}

/// The earliest `at` the 30-day load needs, in the stored ISO format:
/// midnight in São Paulo on the first day of the month-long period.
pub fn load_start(now: DateTime<Utc>) -> String {
    format!("{}T03:00:00.000Z", Period::Month.days(now)[0])
}

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
        assert_eq!(
            load_start(at("2026-10-14T18:00:00Z")),
            "2026-09-15T03:00:00.000Z"
        );
    }
}
