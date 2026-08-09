#!/usr/bin/env bash
# REQ-010: a duplicate project slug must break the build, not silently overwrite.
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

FIXTURE="src/content/projects/__unique-slug-gate__.md"
cleanup() { rm -f "$FIXTURE"; }
trap cleanup EXIT

# Same slug as forja.md: would collapse to one store id under the default glob.
cat > "$FIXTURE" <<'MARKDOWN'
---
slug: forja
title: Forja Duplicate
block: ai-tooling
summary: fixture
problem: fixture
decisions: fixture
outcome: fixture
tech:
  - TypeScript
repoUrl: https://example.com/duplicate
liveUrl: null
featured: false
confidential: false
---
MARKDOWN

set +e
npm run build > /tmp/unique-slug-gate-build.log 2>&1
BUILD_EXIT=$?
set -e

echo "BUILD_EXIT=${BUILD_EXIT}"

if [ "$BUILD_EXIT" -eq 0 ]; then
  echo "FAIL: the build accepted a duplicate project slug. REQ-010 is not enforced." >&2
  exit 1
fi

grep -qiE "duplicate|forja|slug" /tmp/unique-slug-gate-build.log || {
  echo "FAIL: the build failed, but not with a duplicate-slug error. Check the log." >&2
  exit 1
}

echo "UNIQUE SLUG GATE PASSED: duplicate slug breaks the build"
