#!/usr/bin/env bash

set -Eeuo pipefail

readonly DATABASE="${DATABASE:-/opt/blog/data/blog.db}"
readonly BACKUP_DIRECTORY="${BACKUP_DIRECTORY:-/opt/blog/backups}"
readonly RETENTION_DAYS="${RETENTION_DAYS:-7}"
readonly LOCK_MODE="${LOCK_MODE:-skip}"

export TZ=Asia/Seoul
umask 077

timestamp="$(date +%Y%m%d-%H%M%S)"
log_file="$BACKUP_DIRECTORY/backup-$timestamp.log"

mkdir -p "$BACKUP_DIRECTORY"
exec 3>&1
exec >>"$log_file" 2>&1

log() {
    printf '[%s] %s\n' "$(date '+%F %T %Z')" "$*"
}

exec 9>"$BACKUP_DIRECTORY/backup.lock"
if ! flock -n 9; then
    log "다른 SQLite 백업이 실행 중이므로 건너뜁니다."
    if [[ "$LOCK_MODE" == "fail" ]]; then
        exit 75
    fi
    exit 0
fi

if [[ ! -f "$DATABASE" ]]; then
    log "SQLite DB 파일이 없습니다: $DATABASE"
    exit 1
fi

temporary_backup="$(mktemp "$BACKUP_DIRECTORY/.blog-$timestamp.XXXXXX.tmp")"
final_backup="$BACKUP_DIRECTORY/blog-$timestamp.db"

cleanup() {
    rm -f "$temporary_backup"
}
trap cleanup EXIT

log "SQLite 백업을 시작합니다."
sqlite3 -cmd '.timeout 5000' "$DATABASE" ".backup '$temporary_backup'"

if [[ "$(sqlite3 "$temporary_backup" 'PRAGMA integrity_check;')" != "ok" ]]; then
    log "SQLite integrity_check가 실패했습니다."
    exit 1
fi

mv "$temporary_backup" "$final_backup"
trap - EXIT
log "SQLite 백업을 완료했습니다: $final_backup"
printf 'BACKUP_CREATED=%s\n' "$final_backup" >&3

find "$BACKUP_DIRECTORY" -maxdepth 1 -type f -name 'blog-*.db' -mtime +"$((RETENTION_DAYS - 1))" -delete
find "$BACKUP_DIRECTORY" -maxdepth 1 -type f -name 'backup-*.log' -mtime +"$((RETENTION_DAYS - 1))" -delete
