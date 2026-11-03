#!/usr/bin/env bash
# Opens the analytics reader (tools/stats) already installed in ~/.cargo/bin.
# `--build` (or `--install`) first installs it from this checkout; the first
# run does that on its own when the binary is missing.
# Other arguments go straight to stats, e.g. `scripts/run-stats.sh --project <id>`.
# A leading bare date picks the day: `scripts/run-stats.sh 2026-10-20` (or
# `ontem`) is `stats --day 2026-10-20`.
# No `set -u`: the Bash tool's shell snapshot references unbound vars.
set -eo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# cargo installs into ~/.cargo/bin, which may be missing from PATH.
BIN="${CARGO_HOME:-$HOME/.cargo}/bin/stats"

build=false
args=()
for arg in "$@"; do
  case "$arg" in
    --build | --install) build=true ;;
    *) args+=("$arg") ;;
  esac
done
set -- "${args[@]}"

if [ "$build" = true ] || [ ! -x "$BIN" ]; then
  # --locked: without it cargo re-resolves every dependency against the
  # registry on each run (~18 s of network wait for a build with nothing new).
  cargo install --quiet --locked --path "$ROOT/tools/stats"
fi

# Only a date becomes --day; anything else (the `web` subcommand) passes through.
case "$1" in
  [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] | hoje | ontem) set -- --day "$@" ;;
esac
exec "$BIN" "$@"
