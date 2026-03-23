#!/usr/bin/env bash
# Dump production (PRODUCTION_DATABASE_URL) into a local backup file only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.env.production.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Add: PRODUCTION_DATABASE_URL=postgresql://user:pass@host:port/db"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${PRODUCTION_DATABASE_URL:-}" ]]; then
  echo "Set PRODUCTION_DATABASE_URL in .env.production.local"
  exit 1
fi

PG_DUMP=""
if command -v pg_dump >/dev/null 2>&1; then
  PG_DUMP="$(command -v pg_dump)"
elif [[ -x /opt/homebrew/opt/libpq/bin/pg_dump ]]; then
  PG_DUMP="/opt/homebrew/opt/libpq/bin/pg_dump"
elif [[ -x /usr/local/opt/libpq/bin/pg_dump ]]; then
  PG_DUMP="/usr/local/opt/libpq/bin/pg_dump"
elif command -v brew >/dev/null 2>&1; then
  _prefix="$(brew --prefix libpq 2>/dev/null || true)"
  if [[ -n "$_prefix" && -x "$_prefix/bin/pg_dump" ]]; then
    PG_DUMP="$_prefix/bin/pg_dump"
  fi
fi

if [[ -z "$PG_DUMP" ]]; then
  echo "pg_dump not found. Install: brew install libpq"
  echo "Then add to PATH: export PATH=\"\$(brew --prefix libpq)/bin:\$PATH\""
  exit 1
fi

BACKUP_DIR="$ROOT/backups"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
DUMP="$BACKUP_DIR/prod-${STAMP}.sql"

echo "Dumping production database to $DUMP"
"$PG_DUMP" "$PRODUCTION_DATABASE_URL" --no-owner --no-acl --clean --if-exists -f "$DUMP"
echo "Done."
