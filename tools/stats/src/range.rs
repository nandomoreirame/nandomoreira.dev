//! Calendar slices for the web panel (stats-web REQ-007 to REQ-009): a day,
//! a Monday-to-Sunday week, a whole month, the rolling 7 and 30 days or a
//! free range, all São Paulo dates and never past today.

use crate::period::sao_paulo;
use chrono::{DateTime, Datelike, Duration, NaiveDate, Utc};

/// The daily counters live 24 months (DAILY_TTL_MONTHS in src/lib/analytics/event.ts).
pub const MAX_DAYS: i64 = 731;

const MONTHS: [&str; 12] = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Span {
    Day,
    Week,
    Month,
    Last7,
    Last30,
    Custom,
}

const SPANS: [Span; 6] = [
    Span::Day,
    Span::Week,
    Span::Month,
    Span::Last7,
    Span::Last30,
    Span::Custom,
];

impl Span {
    pub fn slug(self) -> &'static str {
        match self {
            Span::Day => "day",
            Span::Week => "week",
            Span::Month => "month",
            Span::Last7 => "last7",
            Span::Last30 => "last30",
            Span::Custom => "custom",
        }
    }

    pub fn from_slug(slug: &str) -> Option<Span> {
        SPANS.into_iter().find(|span| span.slug() == slug)
    }

    /// Day, week and month step with ← →; the rolling and free ranges do not.
    pub fn is_calendar(self) -> bool {
        matches!(self, Span::Day | Span::Week | Span::Month)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Range {
    pub span: Span,
    pub from: NaiveDate,
    pub to: NaiveDate,
}

/// Today in São Paulo, as a date.
pub fn today_date(now: DateTime<Utc>) -> NaiveDate {
    now.with_timezone(&sao_paulo()).date_naive()
}

fn last_of_month(first: NaiveDate) -> NaiveDate {
    let (year, month) = if first.month() == 12 {
        (first.year() + 1, 1)
    } else {
        (first.year(), first.month() + 1)
    };
    NaiveDate::from_ymd_opt(year, month, 1)
        .and_then(|next| next.pred_opt())
        .unwrap_or(first)
}

fn br(day: NaiveDate) -> String {
    day.format("%d/%m/%Y").to_string()
}

impl Range {
    /// The slice of `span` that holds `anchor`, cut at today. A free range
    /// comes from `custom`; here it reads as the anchor day.
    pub fn around(span: Span, anchor: NaiveDate, today: NaiveDate) -> Range {
        let anchor = anchor.min(today);
        let (from, to) = match span {
            Span::Day | Span::Custom => (anchor, anchor),
            Span::Week => {
                let from = anchor - Duration::days(anchor.weekday().num_days_from_monday().into());
                (from, from + Duration::days(6))
            }
            Span::Month => {
                let from = anchor.with_day(1).unwrap_or(anchor);
                (from, last_of_month(from))
            }
            Span::Last7 => (today - Duration::days(6), today),
            Span::Last30 => (today - Duration::days(29), today),
        };
        Range {
            span,
            from,
            to: to.min(today),
        }
    }

    /// REQ-009: start on or before the end, the end not past today, at most 24 months.
    pub fn custom(from: NaiveDate, to: NaiveDate, today: NaiveDate) -> Result<Range, String> {
        if from > to {
            return Err(format!(
                "o início ({}) vem depois do fim ({})",
                br(from),
                br(to)
            ));
        }
        if to > today {
            return Err(format!("o fim ({}) está no futuro", br(to)));
        }
        if (to - from).num_days() + 1 > MAX_DAYS {
            return Err(
                "o intervalo passa de 24 meses, o limite dos contadores diários".to_owned(),
            );
        }
        Ok(Range {
            span: Span::Custom,
            from,
            to,
        })
    }

    pub fn previous(self, today: NaiveDate) -> Option<Range> {
        if !self.span.is_calendar() {
            return None;
        }
        self.from
            .pred_opt()
            .map(|day| Range::around(self.span, day, today))
    }

    /// The next slice, or None once it would start after today.
    pub fn next(self, today: NaiveDate) -> Option<Range> {
        if !self.span.is_calendar() {
            return None;
        }
        let full_end = match self.span {
            Span::Week => self.from + Duration::days(6),
            Span::Month => last_of_month(self.from),
            _ => self.from,
        };
        full_end
            .succ_opt()
            .filter(|day| *day <= today)
            .map(|day| Range::around(self.span, day, today))
    }

    /// `AAAA-MM-DD` of every day in the slice, oldest first.
    pub fn days(self) -> Vec<String> {
        self.from
            .iter_days()
            .take_while(|day| *day <= self.to)
            .map(|day| day.format("%Y-%m-%d").to_string())
            .collect()
    }

    pub fn label(self) -> String {
        match self.span {
            Span::Day => br(self.from),
            Span::Week => format!("semana de {}", br(self.from)),
            Span::Month => format!(
                "{} de {}",
                MONTHS[self.from.month0() as usize],
                self.from.year()
            ),
            Span::Last7 => "últimos 7 dias".to_owned(),
            Span::Last30 => "últimos 30 dias".to_owned(),
            Span::Custom => format!("{} a {}", br(self.from), br(self.to)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    fn d(iso: &str) -> NaiveDate {
        iso.parse().unwrap()
    }

    /// A Wednesday.
    const TODAY: &str = "2026-10-28";

    #[test]
    fn a_week_runs_monday_to_sunday_and_stops_at_today() {
        let past = Range::around(Span::Week, d("2026-10-21"), d(TODAY));
        assert_eq!((past.from, past.to), (d("2026-10-19"), d("2026-10-25")));
        let current = Range::around(Span::Week, d(TODAY), d(TODAY));
        assert_eq!((current.from, current.to), (d("2026-10-26"), d(TODAY)));
        assert_eq!(current.label(), "semana de 26/10/2026");
    }

    #[test]
    fn a_month_is_whole_and_handles_december_and_february() {
        let feb = Range::around(Span::Month, d("2026-02-14"), d(TODAY));
        assert_eq!((feb.from, feb.to), (d("2026-02-01"), d("2026-02-28")));
        assert_eq!(feb.label(), "fevereiro de 2026");
        let dec = Range::around(Span::Month, d("2025-12-31"), d(TODAY));
        assert_eq!((dec.from, dec.to), (d("2025-12-01"), d("2025-12-31")));
        assert_eq!(Range::around(Span::Month, d(TODAY), d(TODAY)).to, d(TODAY));
    }

    #[test]
    fn rolling_windows_end_today_whatever_the_anchor() {
        let month = Range::around(Span::Last30, d("2026-01-01"), d(TODAY));
        assert_eq!((month.from, month.to), (d("2026-09-29"), d(TODAY)));
        assert_eq!(month.days().len(), 30);
        let week = Range::around(Span::Last7, d(TODAY), d(TODAY));
        assert_eq!(week.days().first().unwrap(), "2026-10-22");
        assert_eq!(week.label(), "últimos 7 dias");
    }

    #[test]
    fn steps_calendar_slices_but_never_past_today() {
        let today = d(TODAY);
        let day = Range::around(Span::Day, today, today);
        assert_eq!(day.previous(today).unwrap().from, d("2026-10-27"));
        assert_eq!(day.next(today), None);

        let sept = Range::around(Span::Month, d("2026-09-10"), today);
        assert_eq!(sept.next(today).unwrap().from, d("2026-10-01"));
        assert_eq!(sept.previous(today).unwrap().from, d("2026-08-01"));

        assert_eq!(Range::around(Span::Week, today, today).next(today), None);
        assert_eq!(
            Range::around(Span::Last7, today, today).previous(today),
            None
        );
    }

    #[test]
    fn a_future_anchor_is_cut_to_today() {
        assert_eq!(
            Range::around(Span::Day, d("2027-01-01"), d(TODAY)).from,
            d(TODAY)
        );
    }

    #[test]
    fn validates_a_free_range() {
        let today = d(TODAY);
        let ok = Range::custom(d("2026-09-01"), d("2026-10-15"), today).unwrap();
        assert_eq!(ok.label(), "01/09/2026 a 15/10/2026");
        assert_eq!(ok.days().len(), 45);
        assert!(Range::custom(today, today, today).is_ok());

        let reversed = Range::custom(d("2026-10-15"), d("2026-09-01"), today);
        assert!(reversed.unwrap_err().contains("depois do fim"));
        let future = Range::custom(d("2026-10-01"), d("2026-10-29"), today);
        assert!(future.unwrap_err().contains("futuro"));
        let long = Range::custom(d("2024-10-01"), today, today);
        assert!(long.unwrap_err().contains("24 meses"));
    }

    #[test]
    fn spans_round_trip_through_their_slugs() {
        for span in [
            Span::Day,
            Span::Week,
            Span::Month,
            Span::Last7,
            Span::Last30,
            Span::Custom,
        ] {
            assert_eq!(Span::from_slug(span.slug()), Some(span));
        }
        assert_eq!(Span::from_slug("year"), None);
    }
}
