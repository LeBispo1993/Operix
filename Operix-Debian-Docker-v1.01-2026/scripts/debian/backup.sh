#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."
mkdir -p backups

db_name="$(sed -n 's/^POSTGRES_DB=//p' .env | tail -n 1)"
db_user="$(sed -n 's/^POSTGRES_USER=//p' .env | tail -n 1)"
stamp="$(date +%Y%m%d-%H%M%S)"
target="backups/operix-${stamp}.dump"

docker compose exec -T db pg_dump --format=custom --clean --if-exists --no-owner --no-privileges -U "$db_user" "$db_name" > "$target"
test -s "$target"
chmod 600 "$target"

echo "Backup criado em $target"
