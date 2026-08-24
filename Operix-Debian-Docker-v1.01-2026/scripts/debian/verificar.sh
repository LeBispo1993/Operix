#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."

docker compose config --quiet
docker compose ps

web_port="$(sed -n 's/^WEB_PORT=//p' .env | tail -n 1)"
web_port="${web_port:-8080}"

if command -v curl >/dev/null 2>&1; then
  curl --fail --silent --show-error "http://127.0.0.1:${web_port}/healthz"
  echo
else
  echo "curl nao encontrado; healthcheck externo nao executado."
fi

docker compose exec -T db pg_isready -U "$(sed -n 's/^POSTGRES_USER=//p' .env | tail -n 1)" -d "$(sed -n 's/^POSTGRES_DB=//p' .env | tail -n 1)"
