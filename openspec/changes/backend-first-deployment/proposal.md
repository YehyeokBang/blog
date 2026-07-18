## Why

댓글 UI와 Spring Boot 백엔드의 초기 구현은 존재하지만, 운영 요청을 같은 origin의 `/api/*`로 안전하게 전달하고 SQLite 데이터를 컨테이너 교체 뒤에도 보존하는 배포 경로가 아직 없다. Markdown 정본과 댓글이 허용되는 글 목록의 정합성, 운영 상태 확인, 로컬 복구 백업도 첫 배포 전에 함께 확정해야 한다.

## What Changes

- Traefik, Nginx frontend, Spring Boot backend의 3개 컨테이너를 단일 bridge network에서 운영하고, `blog.yehyeok.xyz/api/*`를 backend로 라우팅한다.
- GitHub Actions가 `content/posts`에서 slug manifest를 생성해 backend 이미지에 포함하고, backend 시작 시 SQLite posts read model을 멱등 동기화한다.
- 활성 글에 대해서만 댓글을 생성하도록 하고, POST 댓글 요청은 Traefik에서 IP당 분당 5회, burst 3회로 제한한다.
- Actuator health, backend Dockerfile, backend CI, self-hosted runner 배포 검증, SQLite `.backup` 기반의 7일 보관 로컬 백업을 추가한다.
- 운영 구조와 백엔드 컨벤션의 이번 변경 관련 모순을 최소 범위로 문서화한다.

## Capabilities

### New Capabilities

- `backend-comment-api`: 활성 Markdown 글에 한정된 댓글 조회·작성 API와 ProblemDetail 오류 응답
- `backend-post-manifest-sync`: 빌드 산출물 manifest에서 SQLite posts read model을 동기화하는 시작 절차
- `backend-container-deployment`: same-origin API 라우팅, 내부 health check, GHCR 기반 backend 배포
- `sqlite-local-backup`: self-hosted runner에서 수행하는 잠금·보존 정책 포함 SQLite 로컬 백업

### Modified Capabilities

- `deployment-infrastructure`: 공개 도메인, 3개 컨테이너 topology, `/api` 라우팅 및 배포 파이프라인을 현재 운영 결정으로 갱신한다.

## Impact

- `docker-compose.yml`, `.github/workflows/`, `frontend/components/CommentSection.tsx`, `backend/` 및 `docs/`를 변경한다.
- Oracle 호스트에는 영속 DB `/opt/blog/data/blog.db`, 백업 `/opt/blog/backups`, 배포 스크립트 `/opt/blog/scripts`가 필요하다.
- 이번 변경은 SHA 태그, 자동 롤백, PostgreSQL/Flyway, 원격 백업, 로그인·캡차를 포함하지 않는다.
