//! The daily series behind the web chart (stats-web REQ-012): people's page
//! views, agents and leads per day from the daily counters, folded into
//! weeks when the slice is too long to read day by day.

use crate::model::Daily;
use chrono::{Datelike, Duration, NaiveDate};
use std::collections::BTreeMap;

/// Above this many days the chart shows weeks; the table keeps the days.
pub const WEEKLY_ABOVE: usize = 120;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Point {
    pub start: String,
    pub label: String,
    pub humans: i64,
    pub agents: i64,
    pub leads: i64,
}

fn short(day: NaiveDate) -> String {
    day.format("%d/%m").to_string()
}

/// One point per day of `days`; a day with no counter document counts 0.
pub fn daily_points(days: &[String], dailies: &BTreeMap<String, Daily>) -> Vec<Point> {
    days.iter()
        .filter_map(|day| {
            let date: NaiveDate = day.parse().ok()?;
            let counters = dailies.get(day);
            let get = |group: &str, key: &str| counters.map_or(0, |d| d.get(group, key));
            Some(Point {
                start: day.clone(),
                label: short(date),
                humans: get("traffic", "human"),
                agents: get("traffic", "ai_agent"),
                leads: get("conversions", "cv") + get("conversions", "hire"),
            })
        })
        .collect()
}

/// The points to draw: the days, or Monday-started weeks above WEEKLY_ABOVE.
pub fn chart_points(points: &[Point]) -> Vec<Point> {
    if points.len() <= WEEKLY_ABOVE {
        return points.to_vec();
    }
    let mut weeks: Vec<Point> = Vec::new();
    for point in points {
        let Ok(date) = point.start.parse::<NaiveDate>() else {
            continue;
        };
        let monday = date - Duration::days(date.weekday().num_days_from_monday().into());
        let key = monday.format("%Y-%m-%d").to_string();
        match weeks.last_mut() {
            Some(week) if week.start == key => {
                week.humans += point.humans;
                week.agents += point.agents;
                week.leads += point.leads;
            }
            _ => weeks.push(Point {
                start: key,
                label: format!("sem. {}", short(monday)),
                humans: point.humans,
                agents: point.agents,
                leads: point.leads,
            }),
        }
    }
    weeks
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Daily;
    use crate::range::Range;
    use serde_json::json;
    use std::collections::BTreeMap;

    fn dailies() -> BTreeMap<String, Daily> {
        let day = Daily::from_data(
            "2026-10-02",
            &json!({"traffic": {"human": 3, "ai_agent": 1}, "conversions": {"cv": 1, "hire": 2}}),
        );
        BTreeMap::from([(day.day.clone(), day)])
    }

    fn days(from: &str, to: &str) -> Vec<String> {
        let today = to.parse().unwrap();
        Range::custom(from.parse().unwrap(), today, today)
            .unwrap()
            .days()
    }

    #[test]
    fn a_day_without_counters_is_zero_and_leads_add_cv_and_hire() {
        let points = daily_points(&days("2026-10-01", "2026-10-02"), &dailies());
        assert_eq!(points.len(), 2);
        assert_eq!(
            (points[0].humans, points[0].agents, points[0].leads),
            (0, 0, 0)
        );
        assert_eq!(
            (points[1].humans, points[1].agents, points[1].leads),
            (3, 1, 3)
        );
        assert_eq!(points[1].label, "02/10");
    }

    #[test]
    fn folds_into_weeks_only_above_120_days() {
        let short = daily_points(&days("2026-06-01", "2026-09-28"), &BTreeMap::new());
        assert_eq!(short.len(), 120);
        assert_eq!(chart_points(&short).len(), 120);

        let long = daily_points(&days("2026-06-01", "2026-09-29"), &dailies());
        assert_eq!(long.len(), 121);
        let weeks = chart_points(&long);
        // 2026-06-01 is a Monday: 121 days are 17 full weeks and 2 days.
        assert_eq!(weeks.len(), 18);
        assert_eq!(weeks[0].start, "2026-06-01");
        assert_eq!(weeks[0].label, "sem. 01/06");
    }

    #[test]
    fn weekly_totals_keep_every_count() {
        let mut counters = dailies();
        let other = Daily::from_data("2026-07-15", &json!({"traffic": {"human": 5}}));
        counters.insert(other.day.clone(), other);
        let points = daily_points(&days("2026-03-01", "2026-10-02"), &counters);
        let weeks = chart_points(&points);
        let sum = |list: &[Point]| list.iter().map(|p| p.humans).sum::<i64>();
        assert_eq!(sum(&weeks), sum(&points));
        assert_eq!(sum(&weeks), 8);
    }
}
