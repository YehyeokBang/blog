#!/usr/bin/env bash

set -u

readonly REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPOSITORY_ROOT"

if ! command -v openspec >/dev/null 2>&1; then
    cat >&2 <<'EOF'
OpenSpec CLI를 찾을 수 없습니다.
Node.js를 설치한 뒤 다음 명령으로 OpenSpec을 설치하세요:
  npm install --global @fission-ai/openspec@latest
EOF
    exit 127
fi

openspec validate --all --strict
status=$?
exit "$status"
