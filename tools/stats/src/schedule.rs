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
        if self.fast_since.is_some() {
            FAST
        } else {
            NORMAL
        }
    }

    pub fn label(&self) -> &'static str {
        if self.fast_since.is_some() {
            "tempo real · 5 s"
        } else {
            "a cada 30 s"
        }
    }
}

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
        assert_eq!(
            schedule.expire(start + Duration::from_secs(30 * 60)),
            Some(FAST_OFF_NOTICE)
        );
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
