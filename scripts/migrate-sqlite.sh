#!/usr/bin/env bash

set -Eeuo pipefail

readonly REPOSITORY_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
readonly DATABASE="${DATABASE:-/opt/blog/data/blog.db}"
readonly MIGRATION_DIRECTORY="${MIGRATION_DIRECTORY:-$REPOSITORY_ROOT/backend/src/main/resources/db/migration}"

if [[ ! -f "$DATABASE" ]]; then
    printf 'SQLite DB 파일이 없습니다: %s\n' "$DATABASE" >&2
    exit 1
fi

if [[ ! -d "$MIGRATION_DIRECTORY" ]]; then
    printf 'SQLite migration 디렉터리가 없습니다: %s\n' "$MIGRATION_DIRECTORY" >&2
    exit 1
fi

shopt -s nullglob
readonly migration_files=("$MIGRATION_DIRECTORY"/V[0-9]*__*.sql)

if [[ "${#migration_files[@]}" -eq 0 ]]; then
    printf '%s\n' '적용할 SQLite migration이 없습니다.' >&2
    exit 1
fi

for migration_file in "${migration_files[@]}"; do
    migration_name="$(basename "$migration_file")"
    migration_version="${migration_name#V}"
    migration_version="${migration_version%%__*}"

    if ! [[ "$migration_version" =~ ^[0-9]+$ ]]; then
        printf '잘못된 migration 파일명입니다: %s\n' "$migration_name" >&2
        exit 1
    fi

    if [[ "$(sqlite3 "$DATABASE" "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'schema_migration';")" == "1" ]] &&
        [[ "$(sqlite3 "$DATABASE" "SELECT COUNT(*) FROM schema_migration WHERE version = $migration_version;")" == "1" ]]; then
        continue
    fi

    migration_sql="$(<"$migration_file")"
    sqlite3 "$DATABASE" <<SQL
PRAGMA foreign_keys = ON;
BEGIN IMMEDIATE;
CREATE TABLE IF NOT EXISTS schema_migration (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
);
$migration_sql
INSERT INTO schema_migration(version, applied_at) VALUES ($migration_version, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
COMMIT;
SQL
done

if [[ "$(sqlite3 "$DATABASE" 'PRAGMA integrity_check;')" != "ok" ]]; then
    printf '%s\n' 'SQLite integrity_check가 실패했습니다.' >&2
    exit 1
fi

printf '%s\n' 'SQLite migration 적용을 완료했습니다.'
