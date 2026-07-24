#!/usr/bin/env bash

set -Eeuo pipefail

readonly REPOSITORY_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPOSITORY_ROOT/frontend"
npm run typecheck
npm test
npm run lint -- --max-warnings=0
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build

cd "$REPOSITORY_ROOT"
node scripts/generate-posts-manifest.test.mjs
node --test scripts/deploy-contract.test.mjs scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
bash scripts/migrate-sqlite.test.sh
bash scripts/backup-sqlite.test.sh
./scripts/validate-openspec.sh

cd "$REPOSITORY_ROOT/backend"
./gradlew ktlintCheck test build
