//! The series as an inline SVG line chart (stats-web REQ-012): built on the
//! server without a library, coloured by CSS classes so both themes apply.
//! Text inside is escaped here, because the template prints it as `safe`.

use crate::series::Point;
use std::fmt::Write;

const WIDTH: f64 = 720.0;
const HEIGHT: f64 = 220.0;
const PAD: f64 = 24.0;

fn escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

pub fn series_svg(points: &[Point], title: &str) -> String {
    let (Some(first), Some(last)) = (points.first(), points.last()) else {
        return String::new();
    };
    let max = points
        .iter()
        .flat_map(|p| [p.humans, p.agents, p.leads])
        .max()
        .unwrap_or(0)
        .max(1) as f64;
    let step = if points.len() > 1 {
        (WIDTH - 2.0 * PAD) / (points.len() - 1) as f64
    } else {
        0.0
    };
    let x = |i: usize| PAD + step * i as f64;
    let y = |value: i64| HEIGHT - PAD - (HEIGHT - 2.0 * PAD) * (value as f64 / max);
    type Pick = fn(&Point) -> i64;
    let series: [(&str, Pick); 3] = [
        ("chart-humans", |p| p.humans),
        ("chart-agents", |p| p.agents),
        ("chart-leads", |p| p.leads),
    ];

    let mut svg = String::new();
    let _ = write!(
        svg,
        r#"<svg class="chart" viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="chart-title" preserveAspectRatio="none"><title id="chart-title">{}</title>"#,
        escape(title)
    );
    let _ = write!(
        svg,
        r#"<line class="chart-axis" x1="{PAD}" y1="{base:.1}" x2="{right:.1}" y2="{base:.1}"/>"#,
        base = HEIGHT - PAD,
        right = WIDTH - PAD
    );
    for (class, pick) in series {
        let line: Vec<String> = points
            .iter()
            .enumerate()
            .map(|(i, p)| format!("{:.1},{:.1}", x(i), y(pick(p))))
            .collect();
        let _ = write!(
            svg,
            r#"<polyline class="{class}" fill="none" points="{}"/>"#,
            line.join(" ")
        );
    }
    let _ = write!(
        svg,
        r#"<text class="chart-label" x="{PAD}" y="{HEIGHT}">{}</text><text class="chart-label" x="{right:.1}" y="{HEIGHT}" text-anchor="end">{}</text></svg>"#,
        escape(&first.label),
        escape(&last.label),
        right = WIDTH - PAD
    );
    svg
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::series::Point;

    fn point(label: &str, humans: i64) -> Point {
        Point {
            start: "2026-10-01".into(),
            label: label.into(),
            humans,
            agents: 0,
            leads: 0,
        }
    }

    #[test]
    fn nothing_to_draw_is_an_empty_string() {
        assert_eq!(series_svg(&[], "x"), "");
    }

    #[test]
    fn draws_one_line_per_series_scaled_to_the_highest_value() {
        let svg = series_svg(&[point("01/10", 0), point("02/10", 10)], "Série");
        assert_eq!(svg.matches("<polyline").count(), 3);
        assert!(svg.contains(r#"class="chart-humans" fill="none" points="24.0,196.0 696.0,24.0""#));
        assert!(svg.contains(r#"role="img""#));
        assert!(svg.contains(">01/10<") && svg.contains(">02/10<"));
    }

    #[test]
    fn a_single_point_or_all_zeros_never_produce_nan() {
        assert!(!series_svg(&[point("01/10", 0)], "x").contains("NaN"));
        assert!(!series_svg(&[point("a", 0), point("b", 0)], "x").contains("NaN"));
    }

    #[test]
    fn escapes_the_title_and_labels() {
        let svg = series_svg(&[point("<b>", 1)], "<script>x</script>");
        assert!(svg.contains("&lt;script&gt;x&lt;/script&gt;"));
        assert!(svg.contains("&lt;b&gt;"));
        assert!(!svg.contains("<script>"));
    }
}
