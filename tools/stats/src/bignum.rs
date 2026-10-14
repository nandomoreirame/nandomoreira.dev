//! Compact big digits for the headline numbers: three rows of half blocks,
//! a smaller cousin of the tumodori clock font.

const GLYPHS: [[&str; 3]; 10] = [
    ["█▀█", "█ █", "█▄█"],
    ["▀█ ", " █ ", "▄█▄"],
    ["▀▀█", "█▀▀", "█▄▄"],
    ["▀▀█", " ▀█", "▄▄█"],
    ["█ █", "▀▀█", "  █"],
    ["█▀▀", "▀▀█", "▄▄█"],
    ["█▀▀", "█▀█", "█▄█"],
    ["▀▀█", "  █", "  █"],
    ["█▀█", "█▀█", "█▄█"],
    ["█▀█", "▀▀█", "▄▄█"],
];

/// `value` as three rows of big digits, one column between digits.
pub fn big_number(value: i64) -> [String; 3] {
    let digits: Vec<usize> = value
        .unsigned_abs()
        .to_string()
        .bytes()
        .map(|digit| (digit - b'0') as usize)
        .collect();
    std::array::from_fn(|row| {
        digits
            .iter()
            .map(|digit| GLYPHS[*digit][row])
            .collect::<Vec<_>>()
            .join(" ")
    })
}

/// Columns `big_number(value)` takes.
pub fn big_width(value: i64) -> usize {
    let digits = value.unsigned_abs().to_string().len();
    digits * 3 + digits.saturating_sub(1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn draws_each_digit_three_rows_tall_with_a_space_between() {
        assert_eq!(big_number(7), ["▀▀█", "  █", "  █"]);
        assert_eq!(big_number(10), ["▀█  █▀█", " █  █ █", "▄█▄ █▄█"]);
    }

    #[test]
    fn measures_the_width_it_needs() {
        assert_eq!(big_width(0), 3);
        assert_eq!(big_width(1234), 15);
    }
}
