#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker nao encontrado. Instale Docker Engine e o plugin Compose antes de continuar."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Plugin Docker Compose v2 nao encontrado."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Arquivo .env criado. Edite as senhas e o APP_ORIGIN antes de executar novamente."
  exit 1
fi

if grep -q 'TROQUE_POR_' .env; then
  echo "O arquivo .env ainda contem valores de exemplo. Troque todos antes de subir o sistema."
  exit 1
fi

docker compose config --quiet
docker compose up --build -d
docker compose ps

echo "OPERIX iniciado. Acesse http://IP-DO-SERVIDOR:$(sed -n 's/^WEB_PORT=//p' .env | tail -n 1)"
