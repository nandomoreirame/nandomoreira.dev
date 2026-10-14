#!/usr/bin/env bash
# Installs the analytics reader (tools/stats) from this checkout and opens it.
# Arguments go straight to stats, e.g. `scripts/run-stats.sh --project <id>`.
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cargo install --quiet --path "$ROOT/tools/stats"

# cargo installs into ~/.cargo/bin, which may be missing from PATH.
BIN="${CARGO_HOME:-$HOME/.cargo}/bin/stats"
exec "$BIN" "$@"
