#!/usr/bin/env bash

set -Eeuo pipefail

readonly REPOSITORY_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
readonly TEST_DIRECTORY="$(mktemp -d)"
readonly DATA_DIRECTORY="$TEST_DIRECTORY/data"
readonly BACKUP_DIRECTORY="$TEST_DIRECTORY/backups"
readonly DATABASE="$DATA_DIRECTORY/blog.db"

cleanup() {
    rm -rf "$TEST_DIRECTORY"
}
trap cleanup EXIT

mkdir -p "$DATA_DIRECTORY" "$BACKUP_DIRECTORY"
sqlite3 "$DATABASE" 'CREATE TABLE comment (id INTEGER PRIMARY KEY, content TEXT); INSERT INTO comment(content) VALUES ("hello");'

run_backup() {
    env DATABASE="$DATABASE" BACKUP_DIRECTORY="$BACKUP_DIRECTORY" \
        bash "$REPOSITORY_ROOT/scripts/backup-sqlite.sh"
}

run_backup
backup_file="$(find "$BACKUP_DIRECTORY" -maxdepth 1 -name 'blog-*.db' -print -quit)"
[[ -n "$backup_file" ]]
[[ "$(sqlite3 "$backup_file" 'PRAGMA integrity_check;')" == "ok" ]]

exec 9>"$BACKUP_DIRECTORY/backup.lock"
flock -n 9
run_backup
exec 9>&-
grep -q '다른 SQLite 백업이 실행 중이므로 건너뜁니다.' "$BACKUP_DIRECTORY"/backup-*.log

exec 9>"$BACKUP_DIRECTORY/backup.lock"
flock -n 9
if env DATABASE="$DATABASE" BACKUP_DIRECTORY="$BACKUP_DIRECTORY" LOCK_MODE=fail \
    bash "$REPOSITORY_ROOT/scripts/backup-sqlite.sh"; then
    printf '%s\n' 'fail-closed backup unexpectedly succeeded while the lock was held.' >&2
    exit 1
fi
exec 9>&-

touch "$BACKUP_DIRECTORY/blog-expired.db" "$BACKUP_DIRECTORY/backup-expired.log"
touch -d '7 days ago' "$BACKUP_DIRECTORY/blog-expired.db" "$BACKUP_DIRECTORY/backup-expired.log"
run_backup
[[ ! -e "$BACKUP_DIRECTORY/blog-expired.db" ]]
[[ ! -e "$BACKUP_DIRECTORY/backup-expired.log" ]]

printf '%s\n' 'SQLite backup, overlap prevention, and retention checks passed.'
