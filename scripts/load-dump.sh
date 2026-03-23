#!/usr/bin/env bash
# Load a plain SQL dump into local Docker Postgres (docker-compose.yml).
# Usage: ./scripts/load-dump.sh [path/to/dump.sql]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DUMP="${1:-$ROOT/dump.sql}"

if [[ ! -f "$DUMP" ]]; then
  echo "File not found: $DUMP"
  echo "Example: pg_dump \"\$DATABASE_URL\" --no-owner --no-acl --clean --if-exists -f dump.sql"
  exit 1
fi

cd "$ROOT"
if ! docker compose exec -T postgres pg_isready -U strapi -d strapi -q 2>/dev/null; then
  echo "Postgres is not ready. Start it with: npm run db:up"
  exit 1
fi

echo "Loading $DUMP ..."
docker compose exec -T postgres psql -U strapi -d strapi < "$DUMP"
echo "Done."
