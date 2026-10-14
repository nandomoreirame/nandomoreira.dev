use ratatui::style::Color;

/// The site's palette (src/styles/global.css), or the 16 ANSI colours when
/// the terminal does not announce true colour (REQ-017).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Theme {
    pub bg: Color,
    pub fg: Color,
    pub muted: Color,
    pub accent: Color,
    /// A step above the background: pills, inactive tabs, bar tracks.
    pub surface: Color,
}

/// `colorterm` is the value of $COLORTERM.
pub fn theme(colorterm: Option<&str>) -> Theme {
    match colorterm {
        Some("truecolor" | "24bit") => Theme {
            bg: Color::Rgb(0x11, 0x0f, 0x0d),
            fg: Color::Rgb(0xef, 0xeb, 0xe2),
            muted: Color::Rgb(0xa2, 0x9e, 0x96),
            accent: Color::Rgb(0xf0, 0xc3, 0x6f),
            surface: Color::Rgb(0x21, 0x1f, 0x1c),
        },
        _ => Theme {
            bg: Color::Reset,
            fg: Color::White,
            muted: Color::DarkGray,
            accent: Color::Yellow,
            surface: Color::DarkGray,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uses_the_site_palette_with_true_color() {
        let palette = theme(Some("truecolor"));
        assert_eq!(palette.bg, Color::Rgb(0x11, 0x0f, 0x0d));
        assert_eq!(palette.fg, Color::Rgb(0xef, 0xeb, 0xe2));
        assert_eq!(palette.accent, Color::Rgb(0xf0, 0xc3, 0x6f));
        assert_eq!(theme(Some("24bit")).accent, palette.accent);
    }

    #[test]
    fn falls_back_to_ansi_colours() {
        let palette = theme(None);
        assert_eq!(palette.bg, Color::Reset);
        assert_eq!(palette.accent, Color::Yellow);
    }
}
