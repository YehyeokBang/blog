# 문서·개발 운영 정리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 P0 범위에서 활성 문서와 아카이브를 분리하고, OpenSpec 종료 절차와 로컬 검증 훅 및 PR 체크리스트를 실제 저장소 상태에 맞게 정리한다.

**Architecture:** `docs/README.md`와 `openspec/README.md`를 각각 일반 문서와 요구사항 문서의 진입점으로 둔다. 과거 문서는 원문을 보존해 `docs/archive/`로 이동하고, 현재 사실은 활성 문서와 base spec에만 남긴다. OpenSpec 검증은 단일 루트 스크립트를 에이전트 규칙과 pre-push 훅이 함께 호출한다.

**Tech Stack:** Markdown, OpenSpec CLI 1.6.0, Bash, Git hooks, GitHub pull request template

## Global Constraints

- 작업 브랜치는 `refactor/documentation-operations`이며 `main`에 직접 커밋하지 않는다.
- `content/posts/*.md` 40개의 경로·파일명·내용을 변경하지 않는다.
- `docs/backend-convention.md` 분할, 링크 자동 검사 스크립트, frontend QA 자동화는 P1로 보류한다.
- OpenSpec 검사를 GitHub Actions에 추가하지 않고 로컬 `.git/config`도 변경하지 않는다.
- 구현이 확인된 OpenSpec 작업만 완료 처리하고, 로컬 또는 운영 근거가 부족한 검증은 미완료 상태와 이유를 기록한다.
- 커밋 메시지는 영어 Conventional Commit prefix와 한국어 설명을 사용한다.

---

### Task 1: 문서 인덱스와 아카이브 구조

**Files:**
- Create: `docs/README.md`
- Create: `docs/archive/README.md`
- Create: `openspec/README.md`
- Move: `PROJECT-REVIEW.md` → `docs/archive/reviews/2026-07-14-project-review.md`
- Move: `docs/project-proposal.md` → `docs/archive/plans/initial-project-proposal.md`
- Move: `docs/design-direction.md` → `docs/archive/design/initial-design-direction.md`
- Delete: `.github/pr_body.md`
- Modify: `frontend/README.md`

**Interfaces:**
- Consumes: 승인된 이동 목록과 현재 저장소 경로
- Produces: 활성 문서, OpenSpec, 아카이브를 각각 찾을 수 있는 세 개의 인덱스

- [ ] **Step 1: 이동 전 링크 영향을 다시 고정한다**

Run: `rg -n "PROJECT-REVIEW\\.md|project-proposal\\.md|design-direction\\.md|feature-roadmap\\.md|backend-convention\\.md" --glob '*.md' --glob '!content/posts/**' .`

Expected: 활성 경로 수정 대상은 `AGENTS.md`, `docs/project-proposal.md`, `openspec/changes/backend-first-deployment/tasks.md`이며 과거 리뷰의 경로 언급은 기록으로 보존한다.

- [ ] **Step 2: 과거 문서를 이동하고 상태 배너를 추가한다**

각 문서 첫머리에 다음 세 필드를 둔다.

```markdown
- 상태: 아카이브
- 아카이브 날짜: 2026-07-18
- 대체 문서: [문서 인덱스](../../README.md)
```

디자인 방향 문서의 대체 링크는 `../../design.md`, 초기 기획서는 `../../project-overview.md`, `../../architecture.md`, `../../roadmap.md`를 함께 가리킨다. 이동한 디자인 문서의 시안 링크는 `../../feed.png`, `../../details.png`로 고친다.

- [ ] **Step 3: 인덱스와 frontend 안내를 작성한다**

`docs/README.md`는 프로젝트 개요, 아키텍처, 로드맵, 디자인, Git 전략, 페르소나, 백엔드 규칙, 현재 구현 계획, OpenSpec, 아카이브를 링크한다. `openspec/README.md`는 base spec, 진행 중 change, archive와 검증·종료 순서를 설명한다. `frontend/README.md`는 저장소 루트 기준 설치·개발·lint·build 명령과 build-time 환경변수 및 정적 export 특성을 설명한다.

- [ ] **Step 4: 문서 이동 단위를 검증하고 커밋한다**

Run: `git status --short && git diff --check`

Expected: 승인된 문서 생성·이동·삭제만 보이고 whitespace 오류가 없다.

Commit: `docs: 문서 인덱스와 아카이브 구조 정리`

### Task 2: 활성 문서 최신화

**Files:**
- Move: `docs/feature-roadmap.md` → `docs/roadmap.md`
- Modify: `docs/design.md`
- Modify: `docs/git-strategy.md`
- Modify: `docs/architecture.md`
- Modify: `docs/project-overview.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `frontend/app/globals.css`, 현재 UI 컴포넌트, 승인된 로드맵 인터뷰 결과
- Produces: 현재 코드와 충돌하지 않는 활성 문서와 실제 경로를 가리키는 에이전트 문서 맵

- [ ] **Step 1: pull 방식 로드맵으로 교체한다**

`docs/roadmap.md`에 북극성, 운영 원칙, Now/Next/Later, 기술 우선순위, 출시·검증 방식, 최상위 위험을 기록한다. Now는 GA4·Search Console 측정 기반, 의미 있는 읽기 이벤트, 조회수 API이고 Next는 소유자 대시보드와 댓글 관리, Later는 검색·콘텐츠 탐색과 작은 AI 실험이다.

- [ ] **Step 2: 디자인 문서를 실제 CSS와 UI에 맞춘다**

`docs/design.md`는 Pretendard, mint accent, light/dark token 값, system 기본 테마, 1000px shell, 800px article, desktop 250px TOC와 mobile inline TOC, 현재 feed/tag/thumbnail/comment UI를 설명한다. 구현되지 않은 스크롤 진행도, MDX 카드, 시리즈, 조회수·좋아요는 현재 기능처럼 적지 않는다.

- [ ] **Step 3: 운영 문서의 불일치만 최소 수정한다**

`docs/git-strategy.md`의 `.agents/`를 실제 `AGENTS.md`, `docs/`, `openspec/` 구조로 바꾸고 OpenSpec branch→change→검증→base 동기화→배포 확인→archive 흐름과 `git config core.hooksPath .githooks`를 기록한다. `docs/architecture.md`에는 backend `/data` 디렉터리의 UID/GID `10001:10001` 소유와 정확한 bind mount를 반영하고, `docs/project-overview.md`의 분석 목표를 GA4·Search Console 기준으로 좁힌다.

- [ ] **Step 4: AGENTS 문서 맵과 종료 규칙을 갱신한다**

`AGENTS.md`의 로드맵 경로를 `docs/roadmap.md`로 바꾸되 P1인 backend 문서 분할 전까지 `docs/backend-convention.md`는 유지한다. OpenSpec 수정·동기화·완료·archive 전 `scripts/validate-openspec.sh` 실행, base 동기화와 배포·운영 확인 후 archive한다는 규칙을 명시한다.

- [ ] **Step 5: 활성 문서 단위를 검증하고 커밋한다**

Run: `git diff --check && rg -n "docs/feature-roadmap\\.md|\\.agents/" AGENTS.md docs --glob '*.md'`

Expected: 아카이브의 역사 기록 외 활성 문서에 이전 로드맵·잘못된 에이전트 경로가 없다.

Commit: `docs: 활성 프로젝트 문서 최신화`

### Task 3: OpenSpec 대조, 동기화, 아카이브

**Files:**
- Modify then archive: `openspec/changes/backend-first-deployment/**`
- Modify: `openspec/specs/analytics/spec.md`
- Modify: `openspec/specs/blog-rendering/spec.md`
- Modify: `openspec/specs/deployment-infrastructure/spec.md`
- Modify: `openspec/specs/seo-metadata/spec.md`
- Create through archive sync: `openspec/specs/backend-comment-api/spec.md`
- Create through archive sync: `openspec/specs/backend-container-deployment/spec.md`
- Create through archive sync: `openspec/specs/backend-post-manifest-sync/spec.md`
- Create through archive sync: `openspec/specs/sqlite-local-backup/spec.md`

**Interfaces:**
- Consumes: PR #19 구현, #20 `[self-hosted, ARM64]`, #21 runtime `/data` ownership, 로컬 검증 결과
- Produces: strict-valid base specs와 `openspec/changes/archive/2026-07-18-backend-first-deployment/`

- [ ] **Step 1: 작업표를 구현 근거와 대조한다**

각 작업은 관련 source, test, workflow 또는 문서가 현재 HEAD에 있을 때만 `[x]`로 바꾼다. `5.4`의 Linux `flock`, image-negative/isolated health/live rate-limit처럼 현재 환경이나 기록으로 확인할 수 없는 항목은 `[ ]`로 유지하고 확인된 하위 결과와 미확인 이유를 적는다.

- [ ] **Step 2: 후속 운영 수정을 delta에 반영한다**

`design.md`와 delta spec에 self-hosted runner label `[self-hosted, ARM64]`, backend image의 `/data` 생성 및 `10001:10001` 소유, host `/opt/blog/data` 권한 준비를 반영한다.

- [ ] **Step 3: strict validator가 한국어 요구사항을 인식하게 한다**

모든 Requirement 본문에 한국어 문장과 함께 영문 규범 키워드 `MUST`를 일관되게 넣는다. 짧은 `Purpose`는 현재 기능 범위를 50자 이상으로 설명한다.

- [ ] **Step 4: archive 전 strict validation을 실행한다**

Run: `openspec validate --all --strict`

Expected: 현재 4개 base spec과 `backend-first-deployment` change가 모두 통과한다.

- [ ] **Step 5: CLI로 base spec 동기화와 archive를 수행한다**

Run: `openspec archive backend-first-deployment --yes`

Expected: 4개 신규 base spec이 생성되고 deployment delta가 기존 base에 합쳐지며 change가 `openspec/changes/archive/2026-07-18-backend-first-deployment/`로 이동한다. 미완료 task 경고가 있으면 숨기지 않고 최종 보고한다.

- [ ] **Step 6: archive 후 전체 strict validation과 관련 테스트를 실행한다**

Run: `openspec validate --all --strict && node --test scripts/generate-posts-manifest.test.mjs && (cd backend && ./gradlew ktlintCheck test build)`

Expected: OpenSpec 전 항목 통과, manifest 1개 테스트 통과, Gradle build 성공.

- [ ] **Step 7: OpenSpec 단위를 커밋한다**

Commit: `docs: 백엔드 배포 OpenSpec 동기화 및 아카이브`

### Task 4: 로컬 검증 훅과 PR 누락 방지

**Files:**
- Create: `scripts/validate-openspec.sh`
- Create: `.githooks/pre-push`
- Modify: `.github/pull_request_template.md`
- Modify: `AGENTS.md`
- Modify: `docs/git-strategy.md`

**Interfaces:**
- Consumes: repository root와 `openspec` executable
- Produces: root-relative strict validator command와 이를 호출하는 pre-push gate

- [ ] **Step 1: validator wrapper를 작성한다**

스크립트는 자신의 위치에서 저장소 루트를 계산해 `cd`하고, `command -v openspec` 실패 시 공식 npm 설치 명령을 포함한 오류를 stderr로 출력한 뒤 `127`로 끝낸다. 성공 경로에서는 `openspec validate --all --strict`를 직접 실행해 종료 코드를 보존한다.

- [ ] **Step 2: pre-push 훅을 작성하고 실행 권한을 준다**

훅은 저장소 루트의 `scripts/validate-openspec.sh`를 `exec`로 호출한다. `chmod +x scripts/validate-openspec.sh .githooks/pre-push`로 두 파일의 실행 bit를 설정한다.

- [ ] **Step 3: 짧은 조건부 PR 체크리스트를 추가한다**

테스트/수동 검증, build-time/runtime 환경변수, DB·mount·UID/GID·backup/restore, runner label·CPU architecture·container health, rollback/disable, 문서·OpenSpec·archive, UI의 mobile/desktop/accessibility를 “관련 있는 경우” 확인하도록 한다.

- [ ] **Step 4: 훅을 직접 실행해 검증한다**

Run: `./scripts/validate-openspec.sh && ./.githooks/pre-push`

Expected: 두 실행 모두 OpenSpec 전체 통과와 exit 0.

- [ ] **Step 5: 운영 도구 단위를 커밋한다**

Commit: `chore: OpenSpec 로컬 검증과 PR 체크리스트 추가`

### Task 5: 전체 검증, push, PR

**Files:**
- Verify only: repository-wide Markdown, `content/posts/*.md`, `git diff main...HEAD`
- Remote action: push `refactor/documentation-operations`, create PR

**Interfaces:**
- Consumes: 완료된 네 개의 의미 단위 커밋과 기존 설계 커밋 두 개
- Produces: 제목 `refactor: 문서·개발 운영 체계 정리`의 PR

- [ ] **Step 1: Markdown 내부 링크와 인덱스 도달성을 검사한다**

저장소에 검증 스크립트를 추가하지 않고 일회성 로컬 명령으로 상대 Markdown 링크·이미지 대상이 존재하는지 검사한다. `docs/README.md`와 `openspec/README.md`가 모든 활성 문서와 base spec을 직접 링크하는지도 대조한다.

- [ ] **Step 2: 승인 범위와 게시물 불변성을 검사한다**

Run: `test "$(git ls-tree -r --name-only main -- content/posts | wc -l | tr -d ' ')" = 40 && test -z "$(git diff --name-only main...HEAD -- content/posts)" && git diff --check main...HEAD && git diff --name-status main...HEAD`

Expected: main의 게시물 경로가 40개, 작업 브랜치의 게시물 변경 0개, 승인 범위 밖 변경 0개.

- [ ] **Step 3: 최종 검증을 새로 실행한다**

Run: `./scripts/validate-openspec.sh && ./.githooks/pre-push && (cd backend && ./gradlew ktlintCheck test build) && (cd frontend && npm run lint) && docker compose config >/dev/null`

Expected: 명령 exit 0. Frontend build는 sandbox 밖에서 `NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build`로 별도 실행해 성공을 확인한다.

- [ ] **Step 4: GitHub 계정을 확인하고 push한다**

Run: `gh auth status`

Expected: 활성 계정이 `YehyeokBang`. 아니면 다른 계정으로 전환하지 않고 중단해 보고한다. 유효하면 `git push -u origin refactor/documentation-operations`를 실행한다.

- [ ] **Step 5: 한국어 PR을 생성한다**

PR 본문에 변경 목적, 이동·통합·삭제 문서, 링크·검증 결과, OpenSpec 동기화·archive, `git config core.hooksPath .githooks`, 보존 문서와 이유, P1·P2 보류 항목을 포함한다.

Run: `gh pr create --base main --head refactor/documentation-operations --title "refactor: 문서·개발 운영 체계 정리" --body-file /tmp/documentation-operations-pr.md`

Expected: `YehyeokBang/blog` 저장소의 새 PR URL 출력.
