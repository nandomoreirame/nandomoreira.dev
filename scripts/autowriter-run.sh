#!/usr/bin/env bash
# Unattended run of the post-autowriter agent: write one draft, publish it to
# the homelab staging and post the link on Discord.
#
# The agent itself never deploys or notifies (its hard limits), so this wrapper
# owns those steps and checks the agent's work before trusting it:
#   1. run `claude -p --agent post-autowriter` headless;
#   2. require exactly one new post file, still `draft: true`;
#   3. deploy with scripts/deploy-staging.sh (evidence: STAGING DEPLOY PASSED);
#   4. require the draft URL to answer 200 on staging;
#   5. post the title, the URL and the agent's report on Discord.
# Any failure is posted on Discord too: silence must mean "it did not run".
#
# Usage:  bash scripts/autowriter-run.sh
# Env:    DISCORD_WEBHOOK_URL   from ~/.config/post-autowriter/env (never in git);
#                               unset, messages go to stdout only
#         AUTOWRITER_ROOT       repo root (default: this script's repo)
#         AUTOWRITER_DEPLOY_CMD deploy command (default: bash scripts/deploy-staging.sh)
#         AUTOWRITER_STAGING_URL (default: http://nandomoreira.home)
# Evidence: the last line is AUTOWRITER RUN PASSED.
#
# No "set -u": the Claude Code shell snapshot references unset variables.
set -eo pipefail

ENV_FILE="${AUTOWRITER_ENV:-$HOME/.config/post-autowriter/env}"
# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && . "$ENV_FILE"

ROOT="${AUTOWRITER_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
DEPLOY_CMD="${AUTOWRITER_DEPLOY_CMD:-bash scripts/deploy-staging.sh}"
STAGING_URL="${AUTOWRITER_STAGING_URL:-http://nandomoreira.home}"
LOG_DIR="${AUTOWRITER_LOG_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/post-autowriter}"
STAMP="$(date +%Y-%m-%d-%H%M)"
REPORT="$LOG_DIR/$STAMP-report.md"
DEPLOY_LOG="$LOG_DIR/$STAMP-deploy.log"

mkdir -p "$LOG_DIR"

# notify <message> [file]: Discord message, with an optional attachment.
notify() {
  if [ -z "$DISCORD_WEBHOOK_URL" ]; then
    echo "NOTIFY: $1"
    return 0
  fi
  local payload
  payload="$(jq -n --arg c "$1" '{content: $c, allowed_mentions: {parse: []}}')"
  if [ -n "$2" ] && [ -s "$2" ]; then
    curl -sS -m 30 -F "payload_json=$payload" -F "files[0]=@$2;type=text/markdown" \
      "$DISCORD_WEBHOOK_URL" >/dev/null || echo "WARN: Discord notification failed" >&2
  else
    curl -sS -m 30 -H 'content-type: application/json' -d "$payload" \
      "$DISCORD_WEBHOOK_URL" >/dev/null || echo "WARN: Discord notification failed" >&2
  fi
}

fail() {
  notify "post-autowriter falhou: $1. Logs em $LOG_DIR ($STAMP)." "$REPORT"
  echo "FAIL: $1" >&2
  exit 1
}

# One run at a time: a timer firing while a manual run is going would race on
# the same posts directory.
exec 9>"$LOG_DIR/run.lock"
flock -n 9 || { echo "another run is in progress" >&2; exit 0; }

cd "$ROOT"
list_posts() { find src/content/posts -maxdepth 1 -name '*.md' | sort; }
before="$(list_posts)"

echo "==> post-autowriter ($STAMP)"
PROMPT='Escreva um rascunho de post para eu revisar. Execução agendada, sem ninguém para responder: não faça perguntas. Pule a sua seção 4 (não pare nem suba o dev server, não rode testes): o script que te chamou faz o build e a verificação. No fim, entregue o relatório da sua seção 6.'
# Deny rules hold even with permissions bypassed: the agent's prompt already
# forbids git writes and the deploy, and these make it mechanical.
claude -p --agent post-autowriter --dangerously-skip-permissions \
  --disallowedTools 'Bash(git commit:*)' 'Bash(git push:*)' 'Bash(git add:*)' \
  'Bash(git stash:*)' 'Bash(git reset:*)' 'Bash(git checkout:*)' 'Bash(*deploy-staging*)' \
  -- "$PROMPT" >"$REPORT" 2>&1 || fail "o agente terminou com erro"

new="$(comm -13 <(echo "$before") <(list_posts))"
count="$(printf '%s' "$new" | grep -c . || true)"
[ "$count" = 1 ] || fail "esperava 1 post novo, achei $count"
grep -q '^draft: true' "$new" || fail "o post novo ($new) não está como draft: true"

slug="$(sed -n 's/^slug: *//p' "$new" | head -1 | tr -d "\"'")"
[ -n "$slug" ] || slug="$(basename "$new" .md)"
title="$(sed -n 's/^title: *//p' "$new" | head -1 | sed -E "s/^[\"'](.*)[\"']$/\1/")"
echo "==> draft: $new ($slug)"

echo "==> deploying to staging"
$DEPLOY_CMD >"$DEPLOY_LOG" 2>&1 || true
grep -q 'STAGING DEPLOY PASSED' "$DEPLOY_LOG" || fail "o deploy da homologação falhou"

url="$STAGING_URL/$slug"
code="$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$url" || true)"
[ "$code" = 200 ] || fail "$url respondeu $code"

notify "Rascunho novo para revisar: **$title**
$url
O relatório do agente (fontes, lacunas e o que confirmar) vai em anexo." "$REPORT"
echo "AUTOWRITER RUN PASSED"
