# 기술 아키텍처

## 기술 스택

| 계층 | 기술 | 역할 |
|---|---|---|
| Frontend | Next.js 정적 export + Nginx | Markdown 본문과 정적 사이트 제공 |
| Backend | Kotlin + Spring Boot | 댓글과 이후 실험 기능의 API |
| Database | SQLite | 동적 데이터의 read model 및 댓글 보존 |
| Edge | Traefik | TLS, same-origin routing, 댓글 쓰기 rate limit |
| 배포 | Docker Compose + GitHub Actions | arm64 이미지 배포와 health 확인 |

## 운영 컨테이너 구조

Oracle Cloud host에서 Traefik, frontend Nginx, backend Spring Boot는 하나의 `blog-network` bridge network를 공유한다.

```text
Internet
  │ https://blog.yehyeok.xyz
  ▼
Traefik
  ├─ /api/* ───────────────────► backend:8080
  │                               └─ /data/blog.db
  │                                  ▲ bind mount
  └─ 그 외 요청 ────────────────► frontend Nginx:80
                                     ▲
                               /opt/blog/data/blog.db
```

backend의 8080 포트와 Actuator health endpoint는 host에 publish하지 않는다. public API는 Traefik이 `/api/*`만 backend로 보낸다. `POST /api/posts/{slug}/comments`는 다른 API보다 우선순위가 높은 router에서 RemoteAddr 기준 평균 분당 5회, burst 3회로 제한한다.

frontend는 같은 origin의 `/api/*`를 호출하므로 브라우저 CORS 설정이 필요 없다. Next.js native development에서만 rewrite가 `http://localhost:8080/api/*`로 proxy한다.

## 콘텐츠와 read model

Markdown 파일은 정본이며 `content/posts/<slug>.md` filename은 외부 데이터 식별자다. 배포 build는 `scripts/generate-posts-manifest.mjs`로 `backend/src/main/resources/posts.json`을 만든다. backend JAR는 이 classpath manifest를 읽어 `Post(id, slug, active)` read model을 시작 시 동기화한다.

manifest에 있는 slug는 active가 되고, 사라진 slug는 inactive가 된다. comment row는 삭제하지 않으므로 기존 댓글은 inactive post에서도 조회할 수 있다. Markdown 파일을 rename/delete하면 이 연결이 끊기므로 명시적 데이터 마이그레이션 없이는 금지한다.

## 이미지와 영속 데이터

backend Docker image는 build된 Boot JAR와 classpath `posts.json`만 실행한다. root `.dockerignore`는 실행 JAR만 예외로 허용하고 SQLite DB, WAL/SHM sidecar, Gradle cache, 그 밖의 backend build output을 context에서 제외한다. runtime user는 UID/GID `10001`이며, 운영 DB는 image가 아닌 `/opt/blog/data/blog.db`를 `/data/blog.db`로 bind mount한다.

backend image에는 `curl`이 있어 Compose가 내부 `/actuator/health`를 검사한다. healthcheck는 10초 간격, 3초 timeout, 6회 retry, 30초 start period를 사용한다.

## CI/CD

PR CI는 manifest를 생성한 뒤 backend `./gradlew ktlintCheck test build`와 frontend lint/static build를 각각 실행한다.

`main` deploy workflow는 arm64 runner에서 이미지 build/push를 수행하고 Oracle self-hosted runner가 GHCR에서 `latest`를 pull해 Compose를 적용한다.

| 변경 경로 | frontend image | backend image | deploy |
|---|---:|---:|---:|
| `frontend/**` | build/push | 유지 | 실행 |
| `backend/**` | 유지 | build/push | 실행 |
| `content/posts/**` | build/push | manifest 생성 후 build/push | 실행 |
| `docker-compose.yml`, `scripts/**`, deploy workflow | 유지 | 유지 | 실행 |

수동 dispatch는 두 이미지를 모두 build/push한다. production deploy는 `blog-production` concurrency group으로 직렬화되며 cancel하지 않는다. deploy는 compose와 backup script를 `/opt/blog`, `/opt/blog/scripts`에 배치하고 `docker compose up -d --wait --wait-timeout 120`으로 health를 기다린다. 실패하면 `docker compose ps` 및 backend 최근 로그를 출력한다.

이 방식은 container restart deployment다. 무중단 배포나 자동 롤백을 보장하지 않으며 health 실패 시 workflow만 실패한다.

## SQLite backup

매일 02:00 KST (`0 17 * * *` UTC)에 같은 Oracle self-hosted runner가 `scripts/backup-sqlite.sh`를 실행한다. 스크립트는 `flock -n`으로 중첩을 건너뛰고, `/opt/blog/data/blog.db`를 SQLite `.backup`으로 임시 파일에 복사한다. `integrity_check`가 `ok`일 때만 `/opt/blog/backups`의 최종 파일로 atomic rename한다. KST timestamp log와 backup은 최근 7일만 유지한다.

로컬 backup은 서버 디스크 장애까지 막지 못한다. 원격 backup은 별도 변경으로 검토한다.

## 운영 사전 조건

- Oracle self-hosted runner에 Docker와 Docker Compose v2 (`docker compose up --wait`)가 설치되어 있어야 한다.
- Oracle runner에는 `self-hosted`와 `ARM64` label이 있어야 한다.
- runner에 `sqlite3`, `flock`, 그리고 `/opt/blog`와 Docker daemon 접근 권한이 있어야 한다.
- runner의 `GITHUB_TOKEN`은 GHCR package read 권한이 있어야 한다. 이미지 build job은 package write 권한이 필요하다.
- `/opt/blog/data`와 `blog.db`는 backend runtime UID/GID `10001:10001`이 쓸 수 있어야 한다. `/opt/blog/backups`와 `/opt/blog/scripts`는 self-hosted runner 사용자가 쓸 수 있어야 한다.

## 배포 전 검증 절차

```bash
# Compose의 Traefik router, healthcheck, bind mount를 해석한다.
docker compose config

# backend JAR에는 manifest가 있고 SQLite 파일은 없다.
jar tf backend/build/libs/blog-backend-0.0.1-SNAPSHOT.jar | grep 'BOOT-INF/classes/posts.json'
! jar tf backend/build/libs/blog-backend-0.0.1-SNAPSHOT.jar | grep -E '(^|/)blog\.db(-wal|-shm)?$'

# Docker daemon이 있는 Linux 환경에서 실행 image의 파일을 확인한다.
docker build -f backend/Dockerfile -t blog-backend-local .
! docker run --rm --entrypoint sh blog-backend-local -c 'find / -name "*.db" -o -name "*.db-wal" -o -name "*.db-shm"' | grep .
docker run --rm --entrypoint sh blog-backend-local -c 'jar tf /app/app.jar | grep BOOT-INF/classes/posts.json'

# Linux runner에서 backup의 성공, 중첩 skip, 7일 보존을 확인한다.
bash scripts/backup-sqlite.test.sh
```

실제 Oracle 배포 후에는 같은 IP에서 댓글 POST를 연속 요청해 Traefik이 backend 도달 전 `429`를 반환하는지, `docker compose ps`에서 backend health가 `healthy`인지 확인한다. actuator URL은 public router로 노출하지 않는다.
