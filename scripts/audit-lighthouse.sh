#!/usr/bin/env bash
# Lighthouse against a SERVED url, never against `astro dev`: measuring the dev
# server measures the dev server. No `set -u`: the Bash tool's shell snapshot
# references unbound vars.
#
# Lighthouse runs through `npx` rather than as a devDependency on purpose:
# @lhci/cli pulls `tmp <=0.2.5`, a HIGH path-traversal advisory, and this repo's
# pre-deploy checklist requires `npm audit` clean of high/critical. An on-demand
# audit tool is not worth a permanent finding in the dependency tree.
#
# Usage: bash scripts/audit-lighthouse.sh <url> [more urls...]
set -eo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: bash scripts/audit-lighthouse.sh <url> [more urls...]" >&2
  exit 2
fi

CHROME="$(command -v google-chrome-stable || command -v chromium || true)"
if [ -z "$CHROME" ]; then
  echo "FAIL: no Chrome or Chromium on PATH; Lighthouse needs one" >&2
  exit 1
fi

OUT_DIR="${OUT_DIR:-/tmp/lighthouse-audit}"
mkdir -p "$OUT_DIR"

echo "chrome: $($CHROME --version)"

for url in "$@"; do
  slug=$(printf '%s' "$url" | sed 's|https\?://||; s|[^A-Za-z0-9]|-|g')

  # The backend runs minInstances: 0, so the first hit pays a cold start and
  # sinks Performance for reasons that have nothing to do with the page. Two
  # discarded requests warm it before anything is measured.
  echo "== warming ${url} =="
  curl -s -o /dev/null "$url" || true
  curl -s -o /dev/null "$url" || true

  echo "== measuring ${url} =="
  CHROME_PATH="$CHROME" npx --yes lighthouse@12 "$url" \
    --quiet \
    --output=json --output=html \
    --output-path="${OUT_DIR}/${slug}" \
    --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
    --only-categories=performance,accessibility,best-practices,seo

  node -e '
    const report = require(process.argv[1]);
    const score = (key) => Math.round((report.categories[key]?.score ?? 0) * 100);
    const row = ["performance", "accessibility", "best-practices", "seo"]
      .map((key) => `${key}=${score(key)}`)
      .join("  ");
    console.log(`SCORES ${process.argv[2]}  ${row}`);
  ' "${OUT_DIR}/${slug}.report.json" "$url"
done

echo "reports in ${OUT_DIR}"
echo "LIGHTHOUSE AUDIT COMPLETE"
