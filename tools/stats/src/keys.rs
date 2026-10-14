/// Reverses `counterKey` (src/lib/analytics/event.ts): percent-decoding, so
/// `%2Flab%2Fforja%2Emd` reads `/lab/forja.md`, `%5F_proto__` reads
/// `__proto__` and `%00` (the key of the empty string) reads "".
pub fn decode_counter_key(key: &str) -> String {
    if key == "%00" {
        return String::new();
    }

    let bytes = key.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && bytes.len() >= i + 3 {
            let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).ok();
            if let Some(byte) = hex.and_then(|h| u8::from_str_radix(h, 16).ok()) {
                out.push(byte);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

#[cfg(test)]
mod tests {
    use super::decode_counter_key;

    #[test]
    fn decodes_slashes_and_dots() {
        assert_eq!(decode_counter_key("%2Flab%2Fforja%2Emd"), "/lab/forja.md");
    }

    #[test]
    fn decodes_the_escaped_leading_underscore_and_the_empty_key() {
        assert_eq!(decode_counter_key("%5F_proto__"), "__proto__");
        assert_eq!(decode_counter_key("%00"), "");
    }

    #[test]
    fn keeps_literal_keys_and_utf8() {
        assert_eq!(decode_counter_key("utm:linkedin"), "utm:linkedin");
        assert_eq!(decode_counter_key("%2Fsess%C3%B5es"), "/sessões");
    }

    #[test]
    fn leaves_a_broken_escape_as_it_is() {
        assert_eq!(decode_counter_key("100%"), "100%");
        assert_eq!(decode_counter_key("%zz"), "%zz");
    }
}
