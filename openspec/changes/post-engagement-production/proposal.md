## Why

현재 피드는 Markdown에서 정적으로 생성되고 댓글 수는 상세 댓글 API를 호출한 브라우저만 알 수 있다. 승인된 반응 UI를 운영에 사용하려면 모든 브라우저가 공유하는 좋아요·댓글 수와 현재 브라우저의 좋아요 상태를 backend가 일관되게 제공해야 한다. prototype의 localStorage는 브라우저별 가짜 정본이므로 운영 데이터로 이관하거나 유지하지 않는다.

## What Changes

- 정적 Markdown 피드는 유지하면서 active post의 `likeCount`·`commentCount`를 페이지 단위 한 번의 projection API로 조회한다.
- 글 상세 반응 조회와 멱등적인 좋아요 선택·취소 API를 추가한다.
- 로그인 대신 first-party 익명 cookie의 무작위 식별자를 사용하고 좋아요 사실과 count는 SQLite만 정본으로 둔다.
- 익명 방문자와 post like schema, additive migration, 유니크 제약과 동시성 처리 기준을 추가한다.
- state-changing 요청에 same-origin 검증과 Traefik rate limit을 적용한다.
- Next static export, same-origin routing, migration 전 backup, health gate와 rollback 절차를 운영 배포 흐름에 포함한다.
- 승인된 피드 지표와 상세 버튼 UI는 문구·위치·접근성·자릿수별 폭 계약을 그대로 사용한다.

## Capabilities

### New Capabilities

- `post-engagement`: 게시글별 운영 반응 조회, 익명 좋아요 선택·취소, count 정합성을 정의한다.

### Modified Capabilities

- `blog-rendering`: 정적 게시글 목록과 상세 화면이 서버 반응 projection을 소비하도록 한다.
- `backend-container-deployment`: SQLite migration과 이전 image rollback이 가능한 배포 순서를 추가한다.
- `deployment-infrastructure`: 좋아요 쓰기 route의 origin 검증 전제와 edge rate limit을 추가한다.
- `sqlite-local-backup`: engagement table을 포함한 migration 전 backup과 restore 검증을 추가한다.

## Impact

- `backend/`에 engagement feature, cookie/origin 설정, migration 실행 경계를 추가한다.
- `frontend/`에 서버 반응 client와 운영 좋아요 버튼을 추가하며 prototype localStorage helper/state는 포함하지 않는다.
- `docker-compose.yml`, deploy workflow와 `scripts/`에 좋아요 rate limit, migration, rollback 준비를 반영한다.
- `content/posts/*.md`의 파일명과 내용은 변경하지 않는다.

## Non-Goals

- 로그인, 계정 간 좋아요 동기화, 사용자에게 방문자 식별자 노출
- 실시간 push, polling, 인기순 정렬, 낙관적 성공 표시
- 댓글 작성 UI·댓글 내용 계약 변경, post Markdown filename rename
- frontend를 backend 기반 동적 article 목록으로 전환하거나 CORS용 별도 API origin을 추가하는 일
