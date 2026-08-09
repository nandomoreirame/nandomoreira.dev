#!/usr/bin/env bash
# REQ-004: an invalid project must break the build, not slip into production.
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

FIXTURE="src/content/projects/__schema-gate__.md"
cleanup() { rm -f "$FIXTURE"; }
trap cleanup EXIT

# Missing `outcome` and both links: violates REQ-001 and REQ-003 at once.
cat > "$FIXTURE" <<'MARKDOWN'
---
slug: schema-gate
title: Schema Gate
block: ai-tooling
summary: fixture
problem: fixture
decisions: fixture
tech:
  - TypeScript
featured: false
confidential: false
---
MARKDOWN

set +e
npm run build > /tmp/schema-gate-build.log 2>&1
BUILD_EXIT=$?
set -e

echo "BUILD_EXIT=${BUILD_EXIT}"

if [ "$BUILD_EXIT" -eq 0 ]; then
  echo "FAIL: the build accepted an invalid project. REQ-004 is not enforced." >&2
  exit 1
fi

grep -qiE "outcome|schema|invalid" /tmp/schema-gate-build.log || {
  echo "FAIL: the build failed, but not with a schema error. Check the log." >&2
  exit 1
}

echo "SCHEMA GATE PASSED: invalid content breaks the build"
