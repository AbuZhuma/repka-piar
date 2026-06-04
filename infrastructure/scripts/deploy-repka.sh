#!/usr/bin/env bash
# Pull latest from git, rebuild Docker images, restart the stack.
#
# Usage:
#     deploy-repka              # deploy main, full rebuild
#     deploy-repka feature-x    # deploy a specific branch
#     deploy-repka --no-build   # restart with existing images (fast)
#     deploy-repka --rollback   # roll back to the previous successful tag
#
# Assumes the install script has been run (so /srv/repka exists, .env.production
# is filled, and the docker group is set up).

set -euo pipefail

APP_DIR="${APP_DIR:-/srv/repka}"
COMPOSE_FILE="$APP_DIR/infrastructure/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/.env.production"
TAG_HISTORY="$APP_DIR/.deploy-tags"   # keeps last N successful tags
KEEP_TAGS=5

# Pull BACKEND_HOST_PORT from env so the local health URL stays in sync if
# someone changes the port mapping. The default 8086 matches the example env.
# We deliberately probe localhost, not the public domain — going through CDN
# (Cloudflare in our case) for a self-check just adds latency and false negatives.
if [ -f "$APP_DIR/.env.production" ]; then
    # shellcheck disable=SC1090
    BACKEND_HOST_PORT="$(grep -E '^BACKEND_HOST_PORT=' "$APP_DIR/.env.production" | tail -1 | cut -d= -f2)"
fi
BACKEND_HOST_PORT="${BACKEND_HOST_PORT:-8086}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${BACKEND_HOST_PORT}/health}"

cd "$APP_DIR"

# ---------------------------------------------------------------- arg parsing
BRANCH="main"
NO_BUILD=0
ROLLBACK=0
while [ $# -gt 0 ]; do
    case "$1" in
        --no-build) NO_BUILD=1 ;;
        --rollback) ROLLBACK=1 ;;
        -h|--help)
            sed -n '1,12p' "$0"; exit 0 ;;
        *) BRANCH="$1" ;;
    esac
    shift
done

log() { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[!] %s\033[0m\n' "$*" >&2; }

if [ ! -f "$ENV_FILE" ]; then
    err "$ENV_FILE is missing. Copy .env.production.example and fill it."
    exit 1
fi

COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

# --------------------------------------------------------------- rollback path
if [ "$ROLLBACK" -eq 1 ]; then
    if [ ! -s "$TAG_HISTORY" ]; then
        err "No tag history at $TAG_HISTORY. Cannot roll back."
        exit 1
    fi
    PREV=$(tail -n 2 "$TAG_HISTORY" | head -n 1)
    if [ -z "$PREV" ]; then
        err "Only one tag in history — nothing to roll back to."
        exit 1
    fi
    log "Rolling back to image tag $PREV"
    IMAGE_TAG="$PREV" "${COMPOSE[@]}" up -d
    log "Done. Active tag: $PREV"
    exit 0
fi

# ---------------------------------------------------------------- git pull
log "Pulling $BRANCH"
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
SHA="$(git rev-parse --short=12 HEAD)"
TAG="$SHA"
log "HEAD is $SHA"

export IMAGE_TAG="$TAG"

# ---------------------------------------------------------------- build images
if [ "$NO_BUILD" -eq 0 ]; then
    log "Building backend + frontend images (tag=$TAG)"
    "${COMPOSE[@]}" build --pull
fi

# ---------------------------------------------------------------- start stack
log "Bringing the stack up"
"${COMPOSE[@]}" up -d --remove-orphans

# ---------------------------------------------------------------- migrations
# Backend applies migrations at startup, so nothing to do here. We wait for
# the health check instead.

# ---------------------------------------------------------------- health
log "Waiting for health (max 60s) — probing $HEALTH_URL"
for i in $(seq 1 30); do
    if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
        log "Healthy after ${i}× 2s"
        OK=1
        break
    fi
    sleep 2
done

if [ "${OK:-0}" -ne 1 ]; then
    err "Health check failed — recent backend logs:"
    "${COMPOSE[@]}" logs --tail=80 backend >&2 || true
    err "Run 'deploy-repka --rollback' if needed."
    exit 1
fi

# ---------------------------------------------------------------- record tag
{ cat "$TAG_HISTORY" 2>/dev/null || true; echo "$TAG"; } \
    | awk '!seen[$0]++' \
    | tail -n "$KEEP_TAGS" \
    > "$TAG_HISTORY.tmp"
mv "$TAG_HISTORY.tmp" "$TAG_HISTORY"

# Prune any dangling images / build cache > 7 days old, keep disk happy.
docker image prune -f >/dev/null || true

log "Deploy OK  ·  tag=$TAG  ·  branch=$BRANCH"
log "Site: https://repka.school"
