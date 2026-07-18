# deployment-infrastructure

## Purpose
정적 frontend와 backend API를 Docker Compose와 Traefik으로 같은 도메인에 제공하고, GitHub Actions가 arm64 운영 환경에 일관되게 배포하기 위한 네트워크·TLS·실행 기준을 정의한다.
## Requirements
### Requirement: Nginx 기반 정적 이미지 및 로컬 Native 구동
시스템은 운영 배포용으로 빌드된 정적 리소스(HTML/CSS/JS)를 담은 경량 Nginx 컨테이너를 가동할 수 있어야 하며(MUST), 로컬 개발은 Node.js를 직접 실행할 수 있어야 한다.

#### Scenario: 로컬 개발 환경 가동
- **WHEN** 개발자가 `frontend/` 경로에서 `npm run dev`를 실행할 때
- **THEN** 시스템은 로컬 Node.js 서버를 HTTP 프로토콜의 3000 포트로 띄우고 파일 변경을 핫 리로딩해야 한다.

#### Scenario: 운영 Docker Compose 기동
- **WHEN** 운영 환경 서버에서 `docker-compose up -d`를 실행할 때
- **THEN** Next.js의 정적 빌드 결과물이 탑재된 Nginx 컨테이너와 Traefik 역방향 프록시 컨테이너가 가동된다.

### Requirement: Traefik을 통한 운영 HTTPS 자동 연동
운영 서버에 배치된 Traefik 컨테이너는 등록된 도메인을 통해 접근 시 자동으로 Let's Encrypt SSL/TLS 인증서를 발급하고 갱신하여 443 포트로 안전하게 트래픽을 서빙해야 한다(MUST).

#### Scenario: 도메인 기반 HTTPS 접속
- **WHEN** 외부 사용자가 할당된 도메인(예: `https://blog.yourdomain.com`)으로 접속할 때
- **THEN** Traefik은 유효한 SSL 인증서를 내려주고 트래픽을 내부에 떠 있는 Nginx 프론트엔드 컨테이너로 라우팅한다.

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
