# 문서·개발 운영 정리 P1-A 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 백엔드 컨벤션을 역할별로 분할하고, 활성 문서의 발견 가능성·상대 링크·아카이브 상태를 로컬에서 반복 검증한다.

**Architecture:** `docs/backend/README.md`는 모든 백엔드 작업의 진입점과 읽기 경로를 제공하고, 구현 규칙은 `domain-and-api.md`, 품질·운영 규칙은 `quality-and-operations.md`에 둔다. Node 내장 모듈만 사용하는 검사기가 `AGENTS.md`, `docs/`, `openspec/`의 Markdown 링크와 인덱스·아카이브 규칙을 검사하며, OpenSpec 의미 검증은 기존 `validate-openspec.sh`가 계속 맡는다.

**Tech Stack:** Markdown, Node.js 내장 `node:test`·`fs`·`path`, Bash, GitHub CLI

## Global Constraints

- 최신 `main`에서 `refactor/documentation-operations-p1-a`를 만들고 `main`에는 직접 커밋하지 않는다.
- P0 조사·인터뷰·설계 검토, P1-B frontend QA, SQLite restore, 제품 기능·게시물, P2 및 GitHub Actions 변경은 제외한다.
- `content/posts/*.md` 40개의 경로·파일명·내용을 변경하지 않는다.
- 커밋과 PR 제목·본문은 영어 Conventional Commit prefix와 한국어 설명을 사용한다.
- OpenSpec base spec이나 archive를 수정하지 않으며, 최종적으로 `openspec validate --all --strict`와 기존 pre-push 훅을 직접 실행한다.

---

## 분할 누락 방지표

원본 `docs/backend-convention.md`의 모든 본문은 아래 대상에 한 번씩 그대로 옮긴다. `README.md`는 원본의 문서 메타데이터·적용 선언과 역할별 라우팅만 갖고, 규칙 본문을 축약하거나 재해석하지 않는다.

| 원본 섹션 | 대상 문서 |
|---|---|
| 문서 메타데이터, 적용 선언, 목차 | `docs/backend/README.md` |
| 1. 코드 포매팅 & 린터 | `quality-and-operations.md` |
| 2. 네이밍 | `domain-and-api.md` |
| 3. 패키지 구조 & 아키텍처 | `domain-and-api.md` |
| 4. Null 처리 | `domain-and-api.md` |
| 5. JPA Entity 설계 | `domain-and-api.md` |
| 6. DTO 매핑 전략 | `domain-and-api.md` |
| 7. 예외 처리 & 에러 응답 | `domain-and-api.md` |
| 8. 트랜잭션 | `domain-and-api.md` |
| 9. 입력 검증 | `domain-and-api.md` |
| 10. 비동기 / 동시성 | `domain-and-api.md` |
| 11. 테스트 | `quality-and-operations.md` |
| 12. 로깅 | `quality-and-operations.md` |
| 13. API 설계 | `domain-and-api.md` |
| 14. Gradle & 의존성 | `quality-and-operations.md` |
| 15. DB 스키마 관리 | `quality-and-operations.md` |
| 16. Git & CI | `quality-and-operations.md` |
| 17. 의도적으로 채택하지 않은 것들 | `quality-and-operations.md` |
| 18. 코드리뷰 체크리스트, 변경 이력 | `quality-and-operations.md` |

## 파일별 변경과 검증 기준

| 파일 | 책임 | 검증 기준 |
|---|---|---|
| `docs/backend/README.md` | 백엔드 규칙의 적용 범위·버전과 역할별 읽기 순서 | 두 하위 문서를 링크하고 누락 방지표가 원본의 18개 섹션을 모두 가리킨다. |
| `docs/backend/domain-and-api.md` | Kotlin 도메인 모델, 계층, 예외, 트랜잭션, 검증, 동시성, API 규칙 | 원본 2–10·13절의 제목·규칙·근거·예제가 손실 없이 존재한다. |
| `docs/backend/quality-and-operations.md` | 포매팅, 테스트, 로깅, 의존성, DB, CI, 거부 결정, 리뷰 기준 | 원본 1·11·12·14–18절과 변경 이력이 손실 없이 존재한다. |
| `AGENTS.md`, `docs/README.md` | 새 백엔드 진입점과 P1-A 계획의 발견 경로 | 이전 단일 파일 경로가 활성 문서 링크에 남지 않고 새 세 문서가 인덱스에서 발견된다. |
| `scripts/check-documentation.mjs` | 상대 Markdown 링크, 활성 문서 인덱스, archive 상태 검사 | 정상 저장소는 종료 0, 깨진 링크·누락 인덱스·잘못된 archive 상태는 경로와 해결 방법을 포함해 종료 1이다. |
| `scripts/check-documentation.test.mjs` | 검사기의 성공 경로와 대표 실패 메시지 회귀 방지 | `node --test scripts/check-documentation.test.mjs`가 모든 assertion을 통과한다. |
| `docs/README.md`, `docs/archive/README.md`, `docs/git-strategy.md` | 검사 범위, archive 허용 규칙, 실패 메시지, 실행 명령 안내 | 문서가 검사 명령과 OpenSpec 검사의 분리를 설명한다. |

### Task 1: 계획을 작업 브랜치에 고정

**Files:**
- Create: `docs/superpowers/plans/2026-07-19-documentation-operations-p1-a.md`

- [x] **Step 1: 기준선을 다시 확인하고 작업 브랜치를 만든다.**

Run: `git status --short --branch && git rev-list --left-right --count main...origin/main && git switch -c refactor/documentation-operations-p1-a`

Expected: 변경 전 작업 트리는 비어 있고 `0\t0`이며, 새 브랜치가 checkout된다.

- [x] **Step 2: 계획의 섹션 매핑과 범위를 대조한다.**

Run: `rg -n '^## (1[0-8]|[1-9])\\.' docs/backend-convention.md && rg -n '원본 섹션|domain-and-api|quality-and-operations' docs/superpowers/plans/2026-07-19-documentation-operations-p1-a.md`

Expected: 원본 18개 섹션과 계획의 18개 행이 모두 확인된다.

- [x] **Step 3: 계획을 커밋한다.**

Run: `git add docs/superpowers/plans/2026-07-19-documentation-operations-p1-a.md && git commit -m "docs: P1-A 문서 운영 정리 계획 추가"`

Expected: 계획만 담긴 `docs:` 커밋 하나가 생성된다.

### Task 2: 백엔드 컨벤션을 역할별 문서로 분할

**Files:**
- Create: `docs/backend/README.md`
- Create: `docs/backend/domain-and-api.md`
- Create: `docs/backend/quality-and-operations.md`
- Delete: `docs/backend-convention.md`
- Modify: `AGENTS.md`
- Modify: `docs/README.md`

- [x] **Step 1: 원본을 보존한 채 대상 문서의 섹션 경계를 확인한다.**

Run: `git show main:docs/backend-convention.md > /tmp/backend-convention-before.md && rg -n '^## (1[0-8]|[1-9])\\.' /tmp/backend-convention-before.md`

Expected: 원본 18개 섹션의 기준 사본이 `/tmp/backend-convention-before.md`에 있다.

- [x] **Step 2: README와 두 역할 문서를 작성하고 원본 파일을 제거한다.**

`README.md`에는 문서 메타데이터, 모든 기여자의 시작점, 역할별 읽기 표와 위 누락 방지표를 둔다. `domain-and-api.md`에는 2–10·13절을, `quality-and-operations.md`에는 1·11·12·14–18절과 변경 이력을 제목·본문·코드 예제까지 그대로 옮긴다.

- [x] **Step 3: 상위 인덱스와 에이전트 링크를 갱신한다.**

`AGENTS.md`는 `docs/backend/README.md`를 백엔드 필독 진입점으로 가리킨다. `docs/README.md`는 세 새 문서를 활성 문서 표에 각각 직접 링크하고, 백엔드 시작점도 새 README로 바꾼다. P0 계획 링크의 설명은 완료된 P0 기록임을 표현하고 P1-A 계획을 추가한다.

- [x] **Step 4: 원문 섹션 누락과 링크를 검증한다.**

Run: `for section in $(seq 1 18); do rg -q "## $section\\." docs/backend/domain-and-api.md docs/backend/quality-and-operations.md || exit 1; done; ! test -e docs/backend-convention.md; ! rg -n 'backend-convention\\.md' AGENTS.md docs/README.md`

Expected: 각 원본 번호는 정확히 한 역할 문서에서 발견되고, 활성 링크에는 이전 파일 경로가 없다.

- [x] **Step 5: 분할 단위를 커밋한다.**

Run: `git add AGENTS.md docs/README.md docs/backend docs/backend-convention.md && git commit -m "docs: 백엔드 컨벤션을 역할별로 분할"`

Expected: 규칙 이동과 새 진입점만 담긴 `docs:` 커밋 하나가 생성된다.

### Task 3: 문서 검사기를 테스트 우선으로 추가하고 운영 규칙을 문서화

**Files:**
- Create: `scripts/check-documentation.test.mjs`
- Create: `scripts/check-documentation.mjs`
- Modify: `docs/README.md`
- Modify: `docs/archive/README.md`
- Modify: `docs/git-strategy.md`
- Modify: `docs/archive/reviews/2026-07-18-repository-operations-design.md`

**Interface:** `checkDocumentation(repositoryRoot)`는 오류 문자열 배열을 반환한다. CLI 실행은 배열이 비어 있으면 `문서 검사 통과`를 출력하고 0으로, 아니면 각 오류를 stderr에 출력하고 1로 끝난다.

- [x] **Step 1: 실패하는 Node 내장 테스트를 작성한다.**

`scripts/check-documentation.test.mjs`는 `checkDocumentation`을 import하여 현재 저장소의 오류 배열이 비어 있는지 검증하고, 임시 fixture의 `docs/archive/example.md`에 상태 필드가 없을 때 `아카이브 상태`를 포함한 오류가 나오는지 검증한다.

Run: `node --test scripts/check-documentation.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND`로 실패한다. 이는 검사기가 아직 없기 때문이다.

- [x] **Step 2: 최소 검사기를 구현한다.**

검사기는 코드 펜스 밖의 inline Markdown link와 image link에서 상대 경로를 추출해 파일 또는 디렉터리 존재를 검사한다. `AGENTS.md`와 `docs/README.md`가 정한 활성 문서, `openspec/README.md`가 정한 모든 `openspec/specs/*/spec.md`의 링크를 확인한다. `docs/archive/README.md`를 제외한 `docs/archive/**/*.md`에는 `상태: 아카이브`, `아카이브 날짜`, `대체 문서`를 요구한다. `openspec/changes/archive/**`는 OpenSpec CLI가 관리하는 archive이므로 상태 배너 요구의 예외로 둔다.

- [x] **Step 3: RED가 의도한 이유로 실패했는지 확인한 뒤 GREEN을 확인한다.**

Run: `node --test scripts/check-documentation.test.mjs && node scripts/check-documentation.mjs`

Expected: 테스트와 실 저장소 검사가 각각 0으로 끝나고, CLI가 `문서 검사 통과`를 출력한다.

- [x] **Step 4: 운영 문서를 갱신한다.**

`docs/README.md`에는 검사 대상, `node scripts/check-documentation.mjs` 실행법, 링크·인덱스·archive 상태 실패 메시지의 의미를 기록한다. `docs/archive/README.md`에는 허용 경로와 필수 상태 메타데이터를, `docs/git-strategy.md`에는 PR 전 문서 검사 명령을 기록한다. 기존 승인 설계 기록은 archive 상태·날짜·대체 문서 메타데이터를 추가해 새 규칙과 일치시킨다.

- [x] **Step 5: 검사기와 문서화 단위를 커밋한다.**

Run: `git add scripts/check-documentation.mjs scripts/check-documentation.test.mjs docs/README.md docs/archive/README.md docs/git-strategy.md docs/archive/reviews/2026-07-18-repository-operations-design.md && git commit -m "chore: 문서 링크와 상태 검사 추가"`

Expected: 검사기, 회귀 테스트, 검사 운영 규칙만 담긴 `chore:` 커밋 하나가 생성된다.

### Task 4: 전체 검증, push, PR

- [x] **Step 1: 새 문서 검사와 OpenSpec·pre-push 검사를 실행한다.**

Run: `node --test scripts/check-documentation.test.mjs && node scripts/check-documentation.mjs && openspec validate --all --strict && ./.githooks/pre-push`

Expected: 모든 명령이 0으로 끝난다.

- [x] **Step 2: 범위와 콘텐츠 불변성을 확인한다.**

Run: `test "$(git ls-tree -r --name-only main -- content/posts | wc -l | tr -d ' ')" = 40 && test -z "$(git diff --name-only main...HEAD -- content/posts)" && git diff --check main...HEAD && git diff --name-status main...HEAD`

Expected: 게시물 변경은 0개, whitespace 오류는 없고 diff는 계획의 파일 목록에 한정된다.

- [ ] **Step 3: 계정·브랜치 상태를 확인하고 push한다.**

Run: `gh auth status && git push -u origin refactor/documentation-operations-p1-a`

Expected: active 계정은 `YehyeokBang`이고 원격 브랜치가 생성된다. 계정이 다르거나 인증이 없으면 전환하지 않고 중단한다.

- [ ] **Step 4: PR을 생성한다.**

Run: `gh pr create --base main --head refactor/documentation-operations-p1-a --title "refactor: 문서·개발 운영 정리 P1-A" --body-file /tmp/documentation-operations-p1-a-pr.md`

Expected: P1-A 범위, 누락 방지표, 검사 규칙, 실행 결과, 제외 범위를 담은 PR URL이 출력된다.

## 계획 자체 점검

- P1-A의 세 문서 경로, 링크 갱신, 로컬 검사기, 검사 대상·archive 규칙·실행 문서화가 각각 Task 2 또는 3에 있다.
- 범위 밖 기능·게시물·CI·P1-B/P2 작업은 Global Constraints로 명시해 배제했다.
- final task는 Markdown 검사, strict OpenSpec, pre-push, 게시물 40개, diff 범위, push·PR을 모두 새 실행 결과로 확인한다.
