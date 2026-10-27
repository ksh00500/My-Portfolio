#!/usr/bin/env bash
# Deploy ONLY the web service against the existing portfolio-postgres database.
# Usage: bash scripts/deploy-existing-server.sh verify|deploy
set -Eeuo pipefail
MODE="${1:-verify}"
if [[ "$MODE" != "verify" && "$MODE" != "deploy" ]]; then
  echo "Usage: bash scripts/deploy-existing-server.sh verify|deploy" >&2
  exit 2
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env; aborting without touching Docker services." >&2
  exit 1
fi
if ! command -v docker >/dev/null || ! command -v npm >/dev/null || ! command -v node >/dev/null; then
  echo "Node.js, npm and Docker are required." >&2
  exit 1
fi

# Verify the existing network and DB container. Never create or recreate a database.
docker network inspect portfolio-net >/dev/null
docker inspect portfolio-postgres >/dev/null
if ! docker ps --format '{{.Names}}' | grep -Fxq 'portfolio-postgres'; then
  echo "Existing portfolio-postgres is not running; aborting." >&2
  exit 1
fi
services="$(docker compose -p portfolio-fullstack config --services)"
if [[ "$services" != "web" ]]; then
  echo "Expected web-only compose service. Refusing to continue." >&2
  exit 1
fi

echo "[1/5] Install packages and run static checks"
npm install --no-audit --no-fund
npm run check:static
echo "[2/5] Verify EXISTING DB (read-only)"
node --env-file=.env scripts/verify-existing-db.mjs
echo "[3/5] Typecheck and Next.js production build"
npm run typecheck
npm run build
echo "[4/5] Build image without replacing the running service"
docker compose -p portfolio-fullstack build web

if [[ "$MODE" == "verify" ]]; then
  echo "Verification completed. Running containers were not replaced."
  echo "To deploy: bash scripts/deploy-existing-server.sh deploy"
  exit 0
fi

echo "[5/5] Replace only the web service"
previous="$(docker inspect --format='{{.Image}}' portfolio-fullstack-web-1 2>/dev/null || true)"
if [[ -n "$previous" ]]; then
  rollback_tag="portfolio-fullstack-web:rollback-$(date -u +%Y%m%dT%H%M%SZ)"
  docker image tag "$previous" "$rollback_tag"
  echo "Saved previous image as $rollback_tag"
fi

docker compose -p portfolio-fullstack up -d --no-deps --no-build --force-recreate web
healthy=0
for attempt in $(seq 1 20); do
  if curl --silent --show-error --fail --max-time 3 http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 3
done
if [[ "$healthy" -ne 1 ]]; then
  echo "Web health check failed. Previous image preserved for manual rollback." >&2
  docker compose -p portfolio-fullstack ps web >&2 || true
  exit 1
fi
PORTFOLIO_BASE_URL=http://127.0.0.1:3001 node --env-file=.env scripts/smoke-readonly.mjs
echo "Web deployed and local smoke checks passed. Verify https://ksh.keyda.site/ko separately."
