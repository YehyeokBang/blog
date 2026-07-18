## 1. Build-time post manifest와 posts read model

- [ ] 1.1 `scripts/generate-posts-manifest.mjs`를 추가해 유효한 `content/posts/*.md` basename을 정렬한 JSON 배열로 `backend/src/main/resources/posts.json`에 생성하고, 빈·중복·잘못된 slug는 build를 실패시킨다.
- [ ] 1.2 backend에 `post/api|domain|infra` feature를 추가하고 `slug`, `active`만 가진 `Post` entity/repository와 manifest reader를 구현한다.
- [ ] 1.3 application startup에서 manifest upsert 및 없는 slug inactive 처리를 transaction으로 구현한다.
- [ ] 1.4 `src/test/resources/application.yml`과 고정 `posts.json` fixture를 추가해 `./gradlew test`가 build directory의 test DB만 쓰도록 하고 active/inactive 동기화 단위·통합 테스트를 추가한다.

## 2. 댓글 API를 active post에 연결

- [ ] 2.1 `CommentRepository`를 `comment/infra`로 옮기고 `CommentService`가 active post를 검증한 후 댓글을 생성하도록 변경한다.
- [ ] 2.2 inactive/unknown slug POST가 `404 ProblemDetail`을 반환하는 controller 통합 테스트를 추가한다.
- [ ] 2.3 `frontend/components/CommentSection.tsx`의 GET/POST URL을 상대 경로 `/api/posts/${slug}/comments`로 고정하고, `next.config.ts` development rewrite로 native frontend 개발에서도 backend를 proxy한다.
- [ ] 2.4 `WebConfig` CORS 설정을 제거하고 active/inactive/unknown GET 및 POST의 명시된 HTTP·ProblemDetail 계약을 controller 통합 테스트로 검증한다.

## 3. 컨테이너·라우팅·health

- [ ] 3.1 Actuator 의존성과 `health` 단일 exposure 설정을 추가하고 `curl` 및 명시 runtime UID/GID를 가진 backend Dockerfile을 작성한다.
- [ ] 3.2 repository root `.dockerignore`와 allowlist Dockerfile `COPY`를 추가해 SQLite DB·build cache가 image context에 들어가지 않도록 한다.
- [ ] 3.3 `docker-compose.yml`에 backend image, `/opt/blog/data/blog.db:/data/blog.db` bind mount, 명시된 healthcheck 및 같은 `blog-network` 연결을 추가한다.
- [ ] 3.4 priority 200/100/1의 Traefik router, exact POST 댓글 `PathRegexp`, RemoteAddr rate-limit middleware(average 5, period 1m, burst 3)를 추가한다.
- [ ] 3.5 Docker compose config, image 내 DB 부재, backend container healthcheck, 댓글 rate-limit이 backend 도달 전 429가 되는 검증 절차를 문서화한다.

## 4. CI/CD와 로컬 백업

- [ ] 4.1 PR CI에 manifest 생성 및 `cd backend && ./gradlew ktlintCheck test build` job을 추가한다.
- [ ] 4.2 main deploy workflow를 변경 경로별 image build/push와 명시된 DAG로 확장하고 `blog-production` concurrency, arm64 build, GHCR read preflight를 추가한다.
- [ ] 4.3 deploy job이 compose와 `scripts/backup-sqlite.sh`를 `/opt/blog`·`/opt/blog/scripts`에 배치하고, data/backups·mount 권한을 준비한 뒤 `docker compose up -d --wait --wait-timeout 120`으로 health를 확인하도록 변경한다.
- [ ] 4.4 `backup.yml`과 추적되는 backup script를 추가해 `0 17 * * *`, `flock`, 5초 SQLite busy timeout, `.backup`+integrity check, KST log, 7일 보존을 구현한다.

## 5. 문서와 검증

- [ ] 5.1 `docs/architecture.md`를 실제 domain, network, SQLite mount, manifest, CI/CD, backup 구조로 갱신한다.
- [ ] 5.2 `docs/backend-convention.md`에서 Virtual Threads 명시적 활성화와 repository의 `infra` 위치로 인한 모순만 갱신한다.
- [ ] 5.3 `backend/.gitignore`를 생성 DB와 build 산출물을 제외하도록 갱신한다.
- [ ] 5.4 frontend native development rewrite, frontend lint/build, backend `ktlintCheck test build`, fixed-manifest 동기화, manifest 생성, `docker compose config`, image DB-negative check, isolated compose health, rate-limit, temporary SQLite backup/overlap/retention을 검증하고 결과를 기록한다.
