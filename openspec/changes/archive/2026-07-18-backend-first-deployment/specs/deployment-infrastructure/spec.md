## ADDED Requirements

### Requirement: Same-origin backend API routing
시스템은 `https://blog.yehyeok.xyz/api/*` 요청을 same-origin backend API로 제공해야 한다(MUST). Traefik, frontend Nginx, backend Spring Boot는 같은 Docker bridge network에 있어야 하고 backend 8080은 host port로 publish하면 안 된다. native Next.js 개발은 `/api/*` rewrite로 `http://localhost:8080/api/*`에 proxy해야 한다.

#### Scenario: API 요청 라우팅
- **WHEN** 사용자가 `https://blog.yehyeok.xyz/api/posts/java-enum-guide/comments`를 요청한다
- **THEN** Traefik은 요청을 backend 컨테이너의 8080 포트로 전달한다
- **AND** frontend router는 해당 요청을 처리하지 않는다

#### Scenario: 정적 페이지 라우팅
- **WHEN** 사용자가 `https://blog.yehyeok.xyz/posts/java-enum-guide`를 요청한다
- **THEN** Traefik은 요청을 frontend Nginx 컨테이너로 전달한다

#### Scenario: Native frontend 개발 댓글 호출
- **WHEN** 개발자가 `frontend/`에서 Next.js 개발 서버와 localhost:8080 backend를 실행한다
- **THEN** 브라우저의 `/api/posts/{slug}/comments` 요청은 Next.js rewrite를 통해 backend로 전달된다

### Requirement: 댓글 쓰기 edge rate limit
시스템은 backend와 SQLite에 요청이 도달하기 전에 `POST /api/posts/{slug}/comments`를 IP별 분당 5회, burst 3회로 제한해야 한다(MUST). matcher는 `^/api/posts/[^/]+/comments/?$`, POST method, router priority 200을 사용하고 RemoteAddr을 기준으로 한다.

#### Scenario: 제한 초과 댓글 생성
- **WHEN** 한 IP가 burst를 초과하거나 1분 내 5회를 초과해 댓글 생성 요청을 보낸다
- **THEN** Traefik은 backend로 전달하지 않고 HTTP 429를 반환한다

### Requirement: Backend internal health check
시스템은 Spring Boot Actuator health만 노출하고, 이를 Docker healthcheck 또는 self-hosted runner가 backend network 내부에서 검사해야 한다(MUST). actuator endpoint는 public `/api` router로 노출하면 안 된다(MUST NOT).

#### Scenario: 배포 후 health 실패
- **WHEN** compose up 뒤 backend `/actuator/health`가 healthy 상태가 되지 않는다
- **THEN** deploy workflow는 실패한다

### Requirement: Persistent SQLite database
시스템은 운영 SQLite 파일을 `/opt/blog/data/blog.db`에 보존하고 backend 컨테이너에는 `/data/blog.db`로 bind mount해야 한다(MUST). host의 data directory와 DB는 runtime UID/GID `10001:10001`이 쓸 수 있어야 한다.

#### Scenario: backend image 교체
- **WHEN** 새 backend image를 pull하고 container를 재생성한다
- **THEN** 기존 `/opt/blog/data/blog.db` 데이터는 유지된다
