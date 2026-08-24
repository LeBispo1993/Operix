#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."

if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then
  echo "Uso: ./scripts/debian/restaurar.sh backups/arquivo.dump"
  exit 1
fi

printf "Esta operacao substitui os dados atuais. Digite RESTAURAR para continuar: "
read -r confirmation
if [ "$confirmation" != "RESTAURAR" ]; then
  echo "Restauracao cancelada."
  exit 1
fi

db_name="$(sed -n 's/^POSTGRES_DB=//p' .env | tail -n 1)"
db_user="$(sed -n 's/^POSTGRES_USER=//p' .env | tail -n 1)"

docker compose exec -T db pg_restore --clean --if-exists --no-owner --no-privileges -U "$db_user" -d "$db_name" < "$1"
echo "Restauracao concluida."
