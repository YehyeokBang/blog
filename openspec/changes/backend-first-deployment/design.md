## Context

공개 도메인은 `https://blog.yehyeok.xyz`이고, frontend 정적 파일과 API는 같은 origin을 사용한다. 현재 backend와 댓글 컴포넌트는 작업 트리에 존재하지만 아직 운영 컨테이너·manifest 동기화·health·백업 경로가 없다. Markdown 파일명(slug)은 외부 데이터의 식별자이므로 삭제나 이름 변경을 수행하지 않는다.

## Goals / Non-Goals

**Goals:**

- 외부에는 Traefik의 80/443만 공개하고 backend 8080은 bridge network 내부에만 둔다.
- `Host(blog.yehyeok.xyz) && PathPrefix(/api)`를 backend로, 그 밖의 같은 Host 요청을 frontend로 보낸다.
- manifest의 active slug만 댓글 작성을 허용하며, 사라진 slug의 기존 DB 데이터와 댓글은 보존한다.
- 이미지 교체에도 SQLite 파일을 보존하고, deploy 후 내부 healthcheck 실패를 workflow 실패로 처리한다.
- 매일 02:00 KST에 충돌 없이 일관된 SQLite backup을 남기고 최근 7일만 유지한다.

**Non-Goals:**

- PostgreSQL, Flyway, 원격·오프사이트 백업, SHA 이미지 태그, 자동 롤백
- 로그인, CAPTCHA, 댓글 수정·삭제, frontend에서 Markdown 본문을 backend DB로 복제
- Oracle 서버에 대한 실제 compose 실행, image push 또는 PR 생성

## Options considered

1. **별도 API subdomain + CORS**: frontend/backend 분리는 분명하지만 인증서·DNS·CORS 설정이 추가된다. 확정된 same-origin 요구와 맞지 않는다.
2. **backend가 Git 또는 frontend 파일 시스템에서 Markdown을 읽음**: 배포 시점 정합성은 확보할 수 있으나 런타임 의존성과 컨테이너 결합이 생긴다.
3. **빌드 시 manifest를 backend 이미지에 포함** (선택): backend가 필요한 최소 slug만 독립적으로 확보한다. GitHub Actions가 `content/posts/*.md` 파일명으로 JSON을 만들고 이미지 build context에 둔다.

## Architecture

```text
Internet
  └─ Traefik :80/:443
       ├─ Host(blog.yehyeok.xyz) + POST PathRegexp(/api/posts/[^/]+/comments)
       │    └─ rate-limit (5/minute, burst 3) → backend:8080
       ├─ Host(blog.yehyeok.xyz) + PathPrefix(/api) → backend:8080
       └─ Host(blog.yehyeok.xyz) → frontend Nginx:80

backend container
  ├─ classpath:/posts.json (JAR image artifact)
  └─ /data/blog.db (bind mount: /opt/blog/data/blog.db)
```

Traefik의 쓰기 전용 router는 priority `200`, 일반 `/api` router는 `100`, frontend router는 `1`을 갖는다. 쓰기 router rule은 `Host(\`blog.yehyeok.xyz\`) && Method(\`POST\`) && PathRegexp(\`^/api/posts/[^/]+/comments/?$\`)`이고 rate-limit middleware를 이 router에만 연결한다. 현재 Traefik이 인터넷의 첫 프록시이므로 rate-limit key는 직접 접속 IP(RemoteAddr)로 한다. backend controller의 `/api` prefix는 그대로 유지하므로 strip-prefix middleware는 사용하지 않는다.

frontend production과 native 개발 모두 브라우저 same-origin을 유지한다. `CommentSection`은 항상 상대 경로 `/api/posts/{slug}/comments`를 호출한다. `next.config.ts`에는 development rewrite `/api/:path* → http://localhost:8080/api/:path*`를 둔다. 이는 Next 개발 서버만 backend에 proxy하며 production static export에는 포함되지 않는다. 따라서 CORS 설정은 삭제한다.

## Data model and synchronization

manifest 형식은 최소인 JSON string 배열로 한다.

```json
["java-enum-guide", "spring-jpa-osiv"]
```

생성 스크립트는 `content/posts`의 일반 `*.md` 파일만 대상으로 UTF-8 JSON을 만들고 basename을 slug로 쓴다. slug는 소문자·숫자·하이픈(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)만 허용한다. 빈 slug, 중복 slug, JSON 생성 실패는 CI build를 실패시킨다. 생성물 `backend/src/main/resources/posts.json`은 Git에 커밋하지 않는 생성 파일이며 backend JAR classpath의 `posts.json`으로만 패키징한다. backend는 classpath `posts.json`만 읽는다. resource 누락, JSON parse 실패, 빈 배열은 모두 startup 실패로 처리하고 기존 DB를 변경하지 않는다. 현재 정본 콘텐츠가 존재하므로 빈 배열은 배포 오류로 간주한다.

`Post` read model은 `id: Long` 대리키, unique `slug`, `active` boolean만 저장한다. `Comment.postSlug`는 FK 없이 slug 문자열을 보관하며 cascade delete를 설정하지 않는다. startup synchronizer는 하나의 transaction에서 manifest slug를 upsert하여 active로 만들고, DB에 남아 있으나 manifest에 없는 slug를 inactive로 바꾼다. 삭제하지 않으므로 해당 slug의 `Comment` rows는 보존된다. 동기화는 같은 manifest로 여러 번 기동해도 결과가 같다.

댓글 작성 service는 `Post.active == true`를 확인한 뒤 저장한다. inactive 또는 존재하지 않는 slug는 `NotFoundException`으로 `404 ProblemDetail(code=NOT_FOUND)`를 반환한다. GET은 active/inactive slug 모두 `createdAt` 오름차순의 기존 댓글 배열과 `200`을 반환하고, 한 번도 존재하지 않은 slug는 빈 배열과 `200`을 반환한다. 성공 POST는 기존 DTO JSON과 `201`, `Location: /api/posts/{slug}/comments/{id}`를 반환한다. DTO 길이/빈 값 검증 실패는 `400 ProblemDetail(code=INVALID_REQUEST, fields: ["field: message"])`를 반환한다.

## Runtime configuration and health

production datasource URL은 `jdbc:sqlite:/data/blog.db`로 고정한다. 모든 Gradle 테스트는 `src/test/resources/application.yml`이 main 설정을 override하여 build directory의 test DB와 `ddl-auto=create-drop`만 사용한다. test resource의 고정 `posts.json`은 main resource보다 우선해 manifest synchronizer를 제어한다. 따라서 `./gradlew test` 단독 실행도 운영 DB·실제 Markdown 콘텐츠에 의존하지 않는다. backend `.gitignore`에는 `*.db`, SQLite journal/WAL/SHM, `.gradle/`, `build/`를 포함하고, repository root `.dockerignore`는 `.git`, `backend/*.db`, `backend/*.db-*`, `backend/.gradle`, `backend/build`, frontend build 산출물을 제외한다.

Actuator는 `health`만 web exposure에 포함한다. `/actuator/health`는 backend 컨테이너 network 내부에서만 접근 가능하고 Traefik router를 만들지 않는다. backend runtime image는 `curl`을 포함한다. Compose healthcheck는 `curl --fail --silent http://localhost:8080/actuator/health | grep -q '\"status\":\"UP\"'`를 `interval: 10s`, `timeout: 3s`, `retries: 6`, `start_period: 30s`로 실행한다. deploy는 `docker compose up -d --wait --wait-timeout 120`을 사용하고 실패하면 `docker compose ps`와 `docker compose logs --tail=200 backend`를 출력한 뒤 non-zero로 끝낸다. runner preflight는 Compose v2 CLI에서 `up --help`가 `--wait`를 지원하는지 검사한다.

## CI/CD and backup

PR CI는 frontend 검사와 별도로 backend에서 manifest 생성 후 `./gradlew ktlintCheck test build`를 실행한다. main 배포 workflow는 path-filter job으로 아래 DAG를 고정한다.

| 변경 경로 | frontend image | backend image | deploy artifact |
|---|---:|---:|---:|
| `frontend/**` | build/push | 유지 | compose/scripts 배치 + deploy |
| `backend/**` | 유지 | build/push | compose/scripts 배치 + deploy |
| `content/posts/**` | build/push | manifest 생성 후 build/push | compose/scripts 배치 + deploy |
| `docker-compose.yml`, `scripts/**`, `.github/workflows/deploy.yml` | 유지 | 유지 | compose/scripts 배치 + deploy |
| 그 밖의 경로 | 유지 | 유지 | 실행하지 않음 |

`workflow_dispatch`는 두 image를 모두 build/push하고 deploy한다. deploy workflow에는 `concurrency: { group: blog-production, cancel-in-progress: false }`를 둬 mutable `latest`의 동시 deploy를 직렬화한다. deploy는 필요한 build job이 모두 성공한 뒤에만 실행하며, deploy 시에는 항상 두 `latest` image를 pull하고 compose 전체를 적용한다. self-hosted runner는 GHCR packages read token으로 로그인해야 하며 builder와 Oracle host 모두 `linux/arm64`를 사용한다. deploy job은 compose와 backup script를 artifact로 `/opt/blog` 및 `/opt/blog/scripts`에 배치한다. `/opt/blog/data`, `/opt/blog/backups`, `/opt/blog/scripts`를 만들고 backend runtime UID/GID가 DB file과 parent directory에 쓰기 가능한지 검사한다.

backup workflow는 deploy와 같은 Oracle self-hosted runner label에서 cron `0 17 * * *` 및 수동 실행을 제공한다. host에는 `sqlite3`와 `flock`이 설치되어 있어야 한다. script는 `TZ=Asia/Seoul`로 파일명과 log 시간을 만들고 `flock -n /opt/blog/backups/backup.lock`으로 한 번에 한 실행만 허용한다. lock을 얻지 못하면 “이미 실행 중”을 log에 남기고 성공 종료한다. DB 부재, sqlite3 오류, integrity check 실패는 log에 남기고 non-zero로 종료한다. `sqlite3 -cmd '.timeout 5000'`의 `.backup`을 임시 파일에 만들고 `PRAGMA integrity_check`가 `ok`일 때만 같은 filesystem에서 원자적 rename한다. 매 실행의 stdout/stderr를 log file에 남기며 mtime 기준 7일을 초과한 backup과 log를 실행 완료 후 삭제한다.

## Risks / Trade-offs

- SQLite는 쓰기 부하가 커지면 병목이 될 수 있다. 첫 댓글 MVP의 단일 인스턴스에는 단순성이 더 크며 PostgreSQL 이관은 별도 change로 둔다.
- Traefik의 in-memory rate limit은 컨테이너 재시작 때 초기화되고 단일 Traefik replica에서만 적용된다. 현재 단일 host MVP에는 충분하며 distributed limiter는 범위 밖이다.
- local backup은 서버 디스크 장애를 막지 못한다. 원격 백업 도입 전에는 복구 범위가 단일 인스턴스에 한정된다.
- 이 Compose 구조는 container restart deployment이며 무중단을 보장하지 않는다. 자동 롤백도 하지 않으며 health 실패 시 새 container 상태를 유지한 채 workflow만 실패로 기록한다.
