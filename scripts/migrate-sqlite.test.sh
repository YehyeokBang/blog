#!/usr/bin/env bash

set -Eeuo pipefail

readonly REPOSITORY_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
readonly TEST_DIRECTORY="$(mktemp -d)"
readonly DATABASE="$TEST_DIRECTORY/blog.db"

cleanup() {
    rm -rf "$TEST_DIRECTORY"
}
trap cleanup EXIT

sqlite3 "$DATABASE" '
CREATE TABLE post (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, active BOOLEAN NOT NULL);
CREATE TABLE comment (id INTEGER PRIMARY KEY, post_slug TEXT NOT NULL, content TEXT NOT NULL);
INSERT INTO post(id, slug, active) VALUES (1, "active-post", 1);
INSERT INTO comment(id, post_slug, content) VALUES (1, "active-post", "existing comment");
'

run_migration() {
    env DATABASE="$DATABASE" bash "$REPOSITORY_ROOT/scripts/migrate-sqlite.sh"
}

run_migration

[[ "$(sqlite3 "$DATABASE" 'SELECT COUNT(*) FROM schema_migration WHERE version = 1;')" == "1" ]]
[[ "$(sqlite3 "$DATABASE" 'SELECT COUNT(*) FROM anonymous_visitor;')" == "0" ]]
[[ "$(sqlite3 "$DATABASE" 'SELECT COUNT(*) FROM post_like;')" == "0" ]]
[[ "$(sqlite3 "$DATABASE" 'SELECT content FROM comment WHERE id = 1;')" == "existing comment" ]]

sqlite3 "$DATABASE" '
INSERT INTO anonymous_visitor(token_hash, created_at) VALUES ("digest", "2026-07-19T00:00:00Z");
INSERT INTO post_like(post_id, visitor_id, created_at) VALUES (1, 1, "2026-07-19T00:00:00Z");
'

if sqlite3 "$DATABASE" '
INSERT INTO post_like(post_id, visitor_id, created_at) VALUES (1, 1, "2026-07-19T00:00:00Z");
'; then
    printf '%s\n' 'duplicate like insert unexpectedly succeeded.' >&2
    exit 1
fi

run_migration
[[ "$(sqlite3 "$DATABASE" 'SELECT COUNT(*) FROM schema_migration WHERE version = 1;')" == "1" ]]
[[ "$(sqlite3 "$DATABASE" 'PRAGMA integrity_check;')" == "ok" ]]

readonly BROKEN_MIGRATION_DIRECTORY="$TEST_DIRECTORY/broken-migrations"
mkdir -p "$BROKEN_MIGRATION_DIRECTORY"
cp "$REPOSITORY_ROOT/backend/src/main/resources/db/migration/V1__post_engagement.sql" "$BROKEN_MIGRATION_DIRECTORY/"
cat >"$BROKEN_MIGRATION_DIRECTORY/V2__broken.sql" <<'SQL'
CREATE TABLE should_rollback (id INTEGER PRIMARY KEY);
CREATE TABLE should_rollback (id INTEGER PRIMARY KEY);
SQL

if env DATABASE="$DATABASE" MIGRATION_DIRECTORY="$BROKEN_MIGRATION_DIRECTORY" bash "$REPOSITORY_ROOT/scripts/migrate-sqlite.sh"; then
    printf '%s\n' 'broken migration unexpectedly succeeded.' >&2
    exit 1
fi
[[ "$(sqlite3 "$DATABASE" "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'should_rollback';")" == "0" ]]
[[ "$(sqlite3 "$DATABASE" 'SELECT COUNT(*) FROM schema_migration WHERE version = 2;')" == "0" ]]

printf '%s\n' 'SQLite engagement migration checks passed.'
