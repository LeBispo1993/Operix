#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."

./scripts/debian/backup.sh
docker compose build --pull
docker compose up -d
docker image prune -f
docker compose ps

echo "Atualizacao concluida. Execute ./scripts/debian/verificar.sh."
