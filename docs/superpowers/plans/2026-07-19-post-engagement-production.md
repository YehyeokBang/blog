# 운영 게시글 반응 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 Markdown 블로그에 서버 정본 좋아요·댓글 수와 익명 cookie 기반 멱등 좋아요를 안전하게 제공한다.

**Architecture:** SQLite의 additive SQL migration이 visitor와 like의 제약을 만들고 Spring feature가 projection·desired-state API를 제공한다. frontend는 정적 metadata를 유지한 채 paged projection을 slug로 결합하고 API 응답만으로 상세 버튼을 갱신한다. Traefik과 deploy workflow가 state-changing route, migration, backup, health 및 rollback 준비를 담당한다.

**Tech Stack:** Kotlin 2.3, Spring Boot 4.1 WebMVC/JPA, SQLite, SQL migration runner, Next.js 16 static export, React 19, Traefik, Docker Compose, GitHub Actions.

## Global Constraints

- Markdown filename slug는 외부 식별자이며 `content/posts/` 파일을 rename/delete/recreate하지 않는다.
- feed는 `♡ {likeCount} 댓글 {commentCount}` 읽기 전용이고 article 목록 API를 다시 호출하거나 N+1을 만들지 않는다.
- detail 버튼은 48px 이상, `aria-pressed`, visible focus, 승인 문구·mint 상태·digit-bucket width를 유지한다.
- engagement는 localStorage에 저장하지 않고 server response만 정본으로 사용한다.
- PUT/DELETE는 exact Origin allowlist, Secure/HttpOnly/SameSite=Lax cookie, Traefik 10/min burst 5를 사용한다.
- backend test는 test-only SQLite를, production은 versioned migration과 `ddl-auto=validate`를 사용한다.
- 모든 Kotlin test는 백틱 한글 이름, given/when/then, JUnit5+kotest assertion을 사용한다.
- commit/PR 제목과 본문은 English Conventional Commit prefix + 한국어 설명을 사용한다.

---

### Task 1: SQLite migration runtime

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__post_engagement.sql`
- Create: `backend/src/main/kotlin/xyz/yehyeok/blog/migration/*`
- Create: `backend/src/test/kotlin/xyz/yehyeok/blog/migration/*`
- Modify: `backend/src/main/resources/application.yml`, `backend/src/test/resources/application.yml`, `backend/build.gradle.kts`

**Interfaces:** `SqliteMigrationRunner.migrate()` applies SQL once under a transaction; it creates `schema_migration`, `anonymous_visitor`, `post_like`, foreign keys, unique `(post_id, visitor_id)`, and indexes.

- [ ] Write a failing migration integration test that creates a legacy `post`/`comment` database, runs `migrate()`, and asserts the schema, migration version, preserved rows, duplicate no-op, and rollback on invalid SQL.
- [ ] Run only the new test and confirm it fails because the runner/resource does not exist.
- [ ] Implement the smallest migration runner and V1 SQL; use `PRAGMA foreign_keys=ON`, a transaction, and idempotent migration-version lookup.
- [ ] Re-run the test and `./gradlew ktlintCheck test`.
- [ ] Commit with `feat: 게시글 반응 SQLite 마이그레이션 추가`.

### Task 2: Engagement domain and HTTP API

**Files:**
- Create: `backend/src/main/kotlin/xyz/yehyeok/blog/engagement/{api,api/dto,domain,infra}/*`
- Create: `backend/src/test/kotlin/xyz/yehyeok/blog/engagement/{api,domain}/*`
- Modify: `backend/src/main/kotlin/xyz/yehyeok/blog/common/exception/*`, `backend/src/main/kotlin/xyz/yehyeok/blog/post/infra/PostRepository.kt`

**Interfaces:**
- `GET /api/post-engagements?page&size → EngagementPageResponse`
- `GET /api/posts/{slug}/engagement → EngagementResponse`
- `PUT|DELETE /api/posts/{slug}/like → EngagementMutationResponse`
- `EngagementService.getPage(page,size)`, `getDetail(slug,cookie)`, `like(slug,cookie)`, `unlike(slug,cookie)`.

- [ ] Write failing service tests for active slug pagination, count aggregation, first/duplicate PUT, first/duplicate DELETE, unknown slug, and concurrent same-visitor PUT/DELETE.
- [ ] Run those tests and confirm missing engagement classes cause the failures.
- [ ] Implement entities/repositories/service with `post_like` aggregate counts, unique conflict handling, a SHA-256 cookie-token digest, and service transaction boundaries.
- [ ] Write failing MockMvc tests for page validation, detail JSON, Set-Cookie attributes, 400/403/404 ProblemDetail, and Origin allowlist.
- [ ] Implement controller, DTO mapper, cookie issuer, Origin validator and `FORBIDDEN` behavior; return server-confirmed values and `changed`.
- [ ] Run targeted tests, then `./gradlew ktlintCheck test build`.
- [ ] Commit with `feat: 익명 게시글 반응 API 추가`.

### Task 3: Frontend server-backed engagement UI

**Files:**
- Create: `frontend/lib/engagement.ts`, `frontend/lib/engagement.test.ts`, `frontend/components/PostEngagement.tsx`, `frontend/components/PostLikeButton.tsx`
- Modify: `frontend/components/PostList.tsx`, `frontend/app/posts/[slug]/page.tsx`, `frontend/package.json`

**Interfaces:** `fetchEngagementPage`, `fetchEngagement`, `setLikeState`; `PostEngagement` renders a read-only metric; `PostLikeButton` only replaces state after a successful API response.

- [ ] Write failing node tests for response parsing, paged slug-map merge, rejected response handling, and `getLikeCountWidth(0|9|10|99|100)`.
- [ ] Run the test command and confirm it fails because the client helpers do not exist.
- [ ] Implement the relative `/api` client with `credentials: "same-origin"`, no localStorage, and exact response types.
- [ ] Implement feed projection loading/error/retry and detail initial loading, disabled mutation, response-confirmed state, error/retry, native focus and digit-bucket layout.
- [ ] Run node tests, `npm run lint`, and `NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build`.
- [ ] Commit with `feat: 서버 기반 게시글 반응 UI 추가`.

### Task 4: Traefik migration deployment and restore tooling

**Files:**
- Create: `scripts/migrate-sqlite.sh`, `scripts/migrate-sqlite.test.sh`
- Modify: `docker-compose.yml`, `.github/workflows/deploy.yml`, `scripts/backup-sqlite.sh`, `scripts/backup-sqlite.test.sh`, `backend/Dockerfile`

**Interfaces:** deploy runs pre-migration backup/integrity, `migrate-sqlite.sh`, SHA-tagged image deploy, health and same-origin smoke; manual input can select the previous backend SHA tag.

- [ ] Write failing shell tests for migration locking, version no-op, failed migration rollback, backup/restore engagement preservation and unique count constraints.
- [ ] Run shell tests and confirm absent scripts/routes fail.
- [ ] Implement migration runner invocation, additive rollback semantics, image resource checks, PUT/DELETE Traefik rate-limit router, SHA image tags and deploy/rollback inputs.
- [ ] Run `docker compose config`, migration/backup shell tests, image inspection where Docker is available, and workflow syntax checks.
- [ ] Commit with `feat: 게시글 반응 배포 안전성 추가`.

### Task 5: End-to-end evidence and OpenSpec completion

**Files:**
- Modify: `openspec/changes/post-engagement-production/tasks.md`, delta/base specs only after evidence exists
- Create or Modify: deployment verification record only if the repository has an established location

- [ ] Run backend unit/integration/concurrency/API contract suites; frontend node/lint/build; OpenSpec and documentation checks.
- [ ] Use `browse` for 375px and 1280px light/dark keyboard and error-state verification against a same-origin local stack.
- [ ] Verify Traefik GET/PUT/DELETE, cookie new/returning flow, Origin rejection, 429, health, migration and restore rehearsal.
- [ ] Mark only evidenced tasks complete, synchronise delta specs to base specs, re-run strict validation, and archive only after production deployment verification.
- [ ] Commit each evidenced documentation/operations update with Korean Conventional Commit text.
