"""Browser checks for `stats web --demo` (docs/specs/stats-web REQ-010,
REQ-014, REQ-015). Usage: check_web.py <stats binary> <port>.

Prints STATS WEB E2E PASSED at the end; that line, not the exit code, is
the evidence."""

import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

TABS = ["live", "funnel", "traffic", "mcp", "sales"]


def wait_until_up(base: str) -> None:
    for _ in range(50):
        try:
            with urllib.request.urlopen(base + "healthz", timeout=1) as answer:
                if answer.status == 200:
                    return
        except OSError:
            time.sleep(0.2)
    raise SystemExit("FAIL: stats web did not come up")


def main() -> None:
    binary, port = sys.argv[1], sys.argv[2]
    base = f"http://127.0.0.1:{port}/"
    server = subprocess.Popen([binary, "web", "--demo", "--no-open", "--port", port])
    try:
        wait_until_up(base)
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path="/usr/bin/chromium")
            page = browser.new_page(viewport={"width": 360, "height": 800})

            for tab in TABS:
                for span in ["day", "last30"]:
                    page.goto(f"{base}?tab={tab}&span={span}")
                    page.wait_for_load_state("load")
                    measure = "document.documentElement.scrollWidth - window.innerWidth"
                    first = page.evaluate(measure)
                    page.wait_for_timeout(500)
                    wide = max(first, page.evaluate(measure))
                    assert wide <= 0, f"FAIL: {tab}/{span} scrolls sideways by {wide}px at 360px"

            page.goto(base)
            page.keyboard.press("Tab")
            first = page.evaluate("document.activeElement.textContent.trim()")
            assert first == "Pular para o conteúdo", f"FAIL: the first Tab stop is {first!r}"
            outline = page.evaluate("getComputedStyle(document.activeElement).outlineStyle")
            assert outline != "none", "FAIL: the focused skip link has no visible outline"

            unlabeled = page.evaluate(
                """[...document.querySelectorAll('input:not([type=hidden]), button, a')]
                   .filter(el => !((el.innerText || '').trim() || el.getAttribute('aria-label') || el.labels?.length))
                   .length"""
            )
            assert unlabeled == 0, f"FAIL: {unlabeled} controls without an accessible name"

            page.get_by_role("link", name="mês", exact=True).click()
            assert "span=month" in page.url, f"FAIL: the month link went to {page.url}"
            assert " de 20" in page.locator("h1").inner_text()
            page.get_by_role("link", name="Período anterior").click()
            assert "at=" in page.url, f"FAIL: the previous month did not pin a date: {page.url}"
            pinned = page.url
            page.reload()
            assert page.url == pinned, "FAIL: reloading lost the slice"

            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=10)
    print("STATS WEB E2E PASSED")


if __name__ == "__main__":
    main()
