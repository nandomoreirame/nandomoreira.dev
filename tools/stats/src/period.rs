use chrono::{DateTime, Duration, FixedOffset, NaiveDate, Utc};

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

/// The São Paulo date as a value, for stepping day by day.
fn today_date(now: DateTime<Utc>) -> NaiveDate {
    now.with_timezone(&sao_paulo()).date_naive()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Period {
    #[default]
    Today,
    Week,
    Month,
    /// One past São Paulo day, picked with `,` and `.` or `--day`.
    Day(NaiveDate),
}

impl Period {
    pub fn label(self) -> String {
        match self {
            Period::Today => "hoje".to_owned(),
            Period::Week => "7 dias".to_owned(),
            Period::Month => "30 dias".to_owned(),
            Period::Day(day) => day.format("%d/%m/%Y").to_string(),
        }
    }

    /// `]`; from a single day it goes back to today.
    pub fn next(self) -> Period {
        match self {
            Period::Today => Period::Week,
            Period::Week | Period::Month => Period::Month,
            Period::Day(_) => Period::Today,
        }
    }

    /// `[`; from a single day it goes back to today.
    pub fn prev(self) -> Period {
        match self {
            Period::Month => Period::Week,
            Period::Week | Period::Today | Period::Day(_) => Period::Today,
        }
    }

    /// `,`: the day before; a relative period starts at yesterday.
    pub fn earlier(self, now: DateTime<Utc>) -> Period {
        let current = match self {
            Period::Day(day) => day,
            _ => today_date(now),
        };
        current.pred_opt().map_or(self, Period::Day)
    }

    /// `.`: the day after, becoming `Today` on reaching it. Relative periods stay.
    pub fn later(self, now: DateTime<Utc>) -> Period {
        match self {
            Period::Day(day) => match day.succ_opt() {
                Some(next) if next < today_date(now) => Period::Day(next),
                _ => Period::Today,
            },
            other => other,
        }
    }

    /// The São Paulo days the period covers, oldest first, ending today.
    pub fn days(self, now: DateTime<Utc>) -> Vec<String> {
        let length = match self {
            Period::Day(day) => return vec![day.format("%Y-%m-%d").to_string()],
            Period::Today => 1,
            Period::Week => 7,
            Period::Month => 30,
        };
        (0..length)
            .rev()
            .map(|ago| today(now - Duration::days(ago)))
            .collect()
    }

    /// Raw events expire after 30 days (EVENT_TTL_MS in
    /// src/lib/analytics/event.ts), so only the daily counters outlive them.
    pub fn has_events(self, now: DateTime<Utc>) -> bool {
        let window = Period::Month.days(now);
        self.days(now).iter().all(|day| window.contains(day))
    }
}

/// `--day`: `AAAA-MM-DD`, `hoje` or `ontem`, never in the future.
pub fn parse_day(input: &str, now: DateTime<Utc>) -> Result<Period, String> {
    let current = today_date(now);
    let day = match input {
        "hoje" => current,
        "ontem" => current.pred_opt().ok_or("data fora do calendário")?,
        _ => NaiveDate::parse_from_str(input, "%Y-%m-%d")
            .map_err(|_| format!("data inválida: {input} (use AAAA-MM-DD, hoje ou ontem)"))?,
    };
    if day > current {
        return Err(format!("{input} está no futuro"));
    }
    Ok(if day == current {
        Period::Today
    } else {
        Period::Day(day)
    })
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

    fn day(iso: &str) -> NaiveDate {
        iso.parse().unwrap()
    }

    #[test]
    fn a_day_covers_only_itself_and_reads_as_a_brazilian_date() {
        let now = at("2026-10-14T18:00:00Z");
        assert_eq!(Period::Day(day("2026-10-02")).days(now), vec!["2026-10-02"]);
        assert_eq!(Period::Day(day("2026-10-02")).label(), "02/10/2026");
        assert_eq!(Period::Week.label(), "7 dias");
    }

    #[test]
    fn steps_one_day_back_and_forth_until_today() {
        let now = at("2026-10-14T18:00:00Z");
        assert_eq!(Period::Today.earlier(now), Period::Day(day("2026-10-13")));
        assert_eq!(Period::Month.earlier(now), Period::Day(day("2026-10-13")));
        assert_eq!(
            Period::Day(day("2026-10-01")).earlier(now),
            Period::Day(day("2026-09-30"))
        );
        assert_eq!(
            Period::Day(day("2026-10-12")).later(now),
            Period::Day(day("2026-10-13"))
        );
        assert_eq!(Period::Day(day("2026-10-13")).later(now), Period::Today);
        assert_eq!(Period::Week.later(now), Period::Week);
    }

    #[test]
    fn brackets_leave_a_day_for_today() {
        assert_eq!(Period::Day(day("2026-10-02")).next(), Period::Today);
        assert_eq!(Period::Day(day("2026-10-02")).prev(), Period::Today);
    }

    #[test]
    fn parses_the_day_given_on_the_command_line() {
        let now = at("2026-10-15T01:00:00Z"); // still the 14th in São Paulo
        assert_eq!(
            parse_day("2026-10-02", now),
            Ok(Period::Day(day("2026-10-02")))
        );
        assert_eq!(parse_day("ontem", now), Ok(Period::Day(day("2026-10-13"))));
        assert_eq!(parse_day("hoje", now), Ok(Period::Today));
        assert_eq!(parse_day("2026-10-14", now), Ok(Period::Today));
        assert!(parse_day("2026-10-15", now).unwrap_err().contains("futuro"));
        assert!(
            parse_day("14/10/2026", now)
                .unwrap_err()
                .contains("AAAA-MM-DD")
        );
        assert!(parse_day("2026-02-30", now).is_err());
    }

    #[test]
    fn only_the_last_30_days_keep_their_raw_events() {
        let now = at("2026-10-14T18:00:00Z");
        assert!(Period::Month.has_events(now));
        assert!(Period::Day(day("2026-09-15")).has_events(now));
        assert!(!Period::Day(day("2026-09-14")).has_events(now));
    }

    #[test]
    fn starts_the_load_at_midnight_in_sao_paulo_29_days_ago() {
        assert_eq!(
            load_start(at("2026-10-14T18:00:00Z")),
            "2026-09-15T03:00:00.000Z"
        );
    }
}
