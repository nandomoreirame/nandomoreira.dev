/// Pages that are not evidence of work: the site's fixed pages and listings,
/// and the sales landing (`/servicos`), which has its own tab.
const FIXED: [&str; 12] = [
    "sobre",
    "contato",
    "now",
    "setup",
    "mcp",
    "privacidade",
    "curriculo",
    "posts",
    "portfolio",
    "lab",
    "eu",
    "servicos",
];

/// REQ-008: a case (`/portfolio/<slug>`, `/lab/<slug>`) or a post (one path
/// segment that is not a fixed page and not a file).
pub fn is_evidence(path: &str) -> bool {
    let segments: Vec<&str> = path
        .split('/')
        .filter(|segment| !segment.is_empty())
        .collect();
    match segments.as_slice() {
        ["portfolio" | "lab", _slug] => true,
        [single] => !FIXED.contains(single) && !single.contains('.'),
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::is_evidence;

    #[test]
    fn counts_cases_and_posts() {
        assert!(is_evidence("/portfolio/bragstack"));
        assert!(is_evidence("/lab/forja/"));
        assert!(is_evidence(
            "/sessoes-do-red-dead-online-p2p-relays-e-nat-duplo"
        ));
    }

    #[test]
    fn leaves_out_fixed_pages_listings_and_files() {
        for path in [
            "/",
            "/sobre",
            "/contato",
            "/now",
            "/setup",
            "/mcp",
            "/privacidade",
            "/curriculo",
            "/posts",
            "/portfolio",
            "/lab",
            "/eu",
            "/posts/arquivo/2017",
            "/servicos",
            "/servicos/site-institucional",
            "/llms.txt",
            "",
        ] {
            assert!(!is_evidence(path), "{path}");
        }
    }
}
