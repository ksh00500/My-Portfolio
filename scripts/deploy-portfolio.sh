#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Existing production checkout and Compose project. Never switch branches here.
PROJECT_DIR="${PROJECT_DIR:-$HOME/services/portfolio/portfolio-next}"
BRANCH="${BRANCH:-main}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-portfolio-fullstack}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/api/health}"
PORTFOLIO_URL="${PORTFOLIO_URL:-http://127.0.0.1:3001/api/portfolio}"
STATE_DIR="${STATE_DIR:-$HOME/services/portfolio/.deploy-state}"
LOCK_FILE="${LOCK_FILE:-$HOME/services/portfolio/.deploy.lock}"
HEALTH_ATTEMPTS="${HEALTH_ATTEMPTS:-60}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-2}"
CHECK_ONLY=0
case "${1:-}" in
  '') ;;
  --check) CHECK_ONLY=1 ;;
  *) echo 'Usage: deploy-portfolio.sh [--check]' >&2; exit 2 ;;
esac
[[ $# -le 1 && "$COMPOSE_PROJECT" =~ ^[a-z0-9][a-z0-9_-]*$ &&
   "$HEALTH_ATTEMPTS" =~ ^[1-9][0-9]*$ && "$HEALTH_INTERVAL" =~ ^[0-9]+$ &&
   "${FORCE:-0}" =~ ^[01]$ ]] || { echo 'ERROR: Invalid deployment options.' >&2; exit 2; }
for dependency in git docker curl flock python3; do
  command -v "$dependency" >/dev/null || { echo "ERROR: Missing $dependency" >&2; exit 1; }
done
mkdir -p "$STATE_DIR" "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock -n 9 || { echo 'Another deployment is running; skipped.'; exit 0; }
PROJECT_DIR=$(cd "$PROJECT_DIR" && pwd -P)
cd "$PROJECT_DIR"
STATE_FILE="$STATE_DIR/$COMPOSE_PROJECT.json"
PENDING_FILE="$STATE_DIR/$COMPOSE_PROJECT.pending"
TEMP_STATE=''
cleanup() { if [[ -n "$TEMP_STATE" ]]; then rm -f -- "$TEMP_STATE"; fi; }
trap cleanup EXIT
trap 'echo "ERROR: Deployment failed; success record was not advanced. Retry the same command." >&2' ERR
trap 'exit 130' INT
trap 'exit 143' TERM
compose() { docker compose -p "$COMPOSE_PROJECT" "$@"; }
fail() { echo "ERROR: $*" >&2; exit 1; }
check_source() {
  [[ "$(git branch --show-current)" == "$BRANCH" ]] || fail "Branch must be $BRANCH."
  [[ -z "$(git status --porcelain --untracked-files=normal)" ]] || fail 'Uncommitted/untracked files exist; preserve them before deploying.'
}
check_source
git check-ref-format --branch "$BRANCH" >/dev/null
# An explicit refspec also works when origin normally fetches main only.
git fetch --no-tags origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
TARGET=$(git rev-parse --verify "refs/remotes/origin/$BRANCH^{commit}")
LOCAL=$(git rev-parse HEAD)
LAST_COMMIT=''; LAST_IMAGE=''; LAST_CONTAINER=''
if [[ -f "$STATE_FILE" ]]; then
  if RECORD=$(python3 - "$STATE_FILE" "$BRANCH" "$COMPOSE_PROJECT" "$PROJECT_DIR" <<'PY'
import json, re, sys
try:
    with open(sys.argv[1], encoding='utf-8') as f:
        record = json.load(f)
    assert record['schemaVersion'] == 1
    assert (record['branch'], record['project'], record['directory']) == tuple(sys.argv[2:])
    assert re.fullmatch(r'[0-9a-f]{40,64}', record['commit'])
    assert re.fullmatch(r'sha256:[0-9a-f]{64}', record['imageId'])
    assert re.fullmatch(r'[0-9a-f]{64}', record['containerId'])
    print('\t'.join(record[k] for k in ('commit', 'imageId', 'containerId')))
except (OSError, ValueError, KeyError, TypeError, AssertionError):
    sys.exit(1)
PY
  ); then
    IFS=$'\t' read -r LAST_COMMIT LAST_IMAGE LAST_CONTAINER <<<"$RECORD"
  else
    echo 'Success record is invalid or belongs to another deployment; rebuild required.'
  fi
fi

# Read only these Docker fields: never dump Config.Env or application logs.
read_runtime() {
  local container details
  container=$(compose ps -a -q web) || return 1
  [[ -n "$container" && "$container" != *$'\n'* ]] || return 1
  details=$(docker inspect --format '{{.Id}} {{.Image}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container") || return 1
  read -r RUN_CONTAINER RUN_IMAGE RUN_STATUS RUN_HEALTH <<<"$details"
  [[ "$RUN_STATUS" == running && "$RUN_HEALTH" == healthy ]]
}
probe_apis() {
  curl --fail --silent --show-error --connect-timeout 2 --max-time 5 "$HEALTH_URL" >/dev/null 2>&1 &&
    curl --fail --silent --show-error --connect-timeout 2 --max-time 5 "$PORTFOLIO_URL" >/dev/null 2>&1
}
echo "Target branch: $BRANCH"
echo "Checkout: $LOCAL"
echo "Remote:   $TARGET"
echo "Last successful deployment: ${LAST_COMMIT:-unrecorded}"
if [[ "${FORCE:-0}" != 1 && ! -e "$PENDING_FILE" && "$LOCAL" == "$TARGET" &&
      "$LAST_COMMIT" == "$TARGET" ]] && read_runtime &&
   [[ "$RUN_IMAGE" == "$LAST_IMAGE" && "$RUN_CONTAINER" == "$LAST_CONTAINER" ]] && probe_apis; then
  echo 'Already deployed: recorded commit, running image/container, health and both APIs match.'
  exit 0
fi
if [[ "$CHECK_ONLY" == 1 ]]; then
  echo 'Deployment required. Check only: no merge, build, replacement or success-record write.'
  exit 0
fi

# Do not deploy unpublished local commits or silently discard divergent history.
git merge-base --is-ancestor HEAD "$TARGET" || fail 'Checkout is ahead of/diverged from the remote branch.'
echo '[1/4] Fast-forward checkout to the fetched target'
git merge --ff-only "$TARGET"
[[ "$(git rev-parse HEAD)" == "$TARGET" ]] || fail 'Checkout differs from deployment target.'
check_source

# Even a failed FORCE redeploy of the same SHA must retry on the next run.
printf '%s\n' "$TARGET" >"$PENDING_FILE"
echo '[2/4] Build web image (existing web remains running)'
compose build web
check_source
[[ "$(git rev-parse HEAD)" == "$TARGET" ]] || fail 'Checkout changed during build.'
echo '[3/4] Replace only web; leave the existing PostgreSQL container/volumes alone'
compose up -d --no-deps --no-build --force-recreate web
echo '[4/4] Verify the new container and both APIs'
for ((attempt=1; attempt<=HEALTH_ATTEMPTS; attempt++)); do
  if read_runtime && probe_apis; then
    # The recorded image is the newly recreated, healthy container's actual image.
    VERIFIED_CONTAINER="$RUN_CONTAINER"
    VERIFIED_IMAGE="$RUN_IMAGE"
    check_source
    [[ "$(git rev-parse HEAD)" == "$TARGET" ]] || fail 'Checkout changed during verification.'
    if ! read_runtime || [[ "$RUN_CONTAINER" != "$VERIFIED_CONTAINER" || "$RUN_IMAGE" != "$VERIFIED_IMAGE" ]]; then
      fail 'Container changed during verification; success was not recorded.'
    fi
    TEMP_STATE=$(mktemp "$STATE_DIR/.success.XXXXXX")
    python3 - "$TARGET" "$VERIFIED_IMAGE" "$VERIFIED_CONTAINER" "$BRANCH" "$COMPOSE_PROJECT" "$PROJECT_DIR" >"$TEMP_STATE" <<'PY'
from datetime import datetime, timezone
import json, sys
commit, image, container, branch, project, directory = sys.argv[1:]
json.dump(dict(schemaVersion=1, commit=commit, imageId=image, containerId=container,
               branch=branch, project=project, directory=directory,
               completedAt=datetime.now(timezone.utc).isoformat()), sys.stdout, indent=2)
print()
PY
    mv -f -- "$TEMP_STATE" "$STATE_FILE"
    TEMP_STATE=''
    rm -f -- "$PENDING_FILE"
    echo "Deployment successful: $TARGET"
    echo "Success record: $STATE_FILE"
    exit 0
  fi
  if (( attempt < HEALTH_ATTEMPTS )); then sleep "$HEALTH_INTERVAL"; fi
done
fail 'Health/API verification failed. Previous success record is preserved; next run will retry.'
