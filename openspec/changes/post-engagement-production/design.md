## Context

production frontend는 Next.js static export로 Markdown metadata와 본문을 HTML에 포함하고 Nginx가 제공한다. backend는 classpath slug manifest를 SQLite `Post` read model로 동기화하며 댓글 API를 same-origin `/api/*`로 제공한다. 현재 main에는 게시글 목록 API나 pagination이 없으므로, 전체 목록의 정본을 backend로 옮기면 Markdown 정본·정적 SEO·배포 구조를 불필요하게 바꾸게 된다.

따라서 정적 article 목록은 그대로 두고 backend가 반응 필드만 페이지 단위로 projection한다. frontend는 정적 item을 두 번째 목록 API로 다시 조회하지 않고 projection을 slug로 결합한다. prototype 브랜치의 `localStorage` 데이터는 운영 DB로 migration하지 않으며 운영 코드에도 storage helper를 남기지 않는다. `next-themes`의 테마 저장은 게시글 반응 상태가 아니므로 이 change의 제거 대상이 아니다.

## Goals / Non-Goals

**Goals:**

- 피드의 한 page에 필요한 반응을 한 API 응답으로 받아 N+1을 만들지 않는다.
- 상세 조회·좋아요 선택·취소를 재시도 가능한 HTTP 계약으로 제공한다.
- 무작위 익명 cookie와 SQLite 유니크 제약으로 브라우저당 글당 하나의 like만 저장한다.
- 동시 선택·취소에서도 count가 음수가 되거나 중복 증가하지 않게 한다.
- migration, backup, health, rollback과 실제 Traefik route 검증까지 배포 gate에 포함한다.

**Non-Goals:**

- backend가 Markdown title·description·tag·본문을 제공하는 full article API
- 로그인 사용자 모델, device fingerprint, IP를 visitor 식별자로 저장하는 방식
- count cache table, Redis, distributed rate limiter, 무중단 schema migration
- prototype localStorage 값을 cookie 또는 DB로 가져오는 migration

## Options considered

1. **Full dynamic article list API**: pagination item에 metadata와 count를 모두 넣기 쉽지만 정적 export의 HTML과 Markdown 정본을 중복하고 피드 SEO·로딩 경계를 바꾼다.
2. **글별 engagement API N회 호출**: 구현은 작지만 피드 글 수만큼 요청이 늘고 목록 결과의 정합 시점도 달라진다.
3. **정적 목록 + paged engagement projection** (선택): backend는 active slug와 count만 안정적으로 page 처리하고 frontend는 slug로 결합한다. 기존 정적 목록과 SEO를 보존하면서 N+1을 제거한다.

## API contract

### Feed projection

`GET /api/post-engagements?page={page}&size={size}`는 active post만 `slug ASC`로 정렬한다. page는 zero-based offset page이고 기본값은 `0`, size 기본값은 `20`, 허용 범위는 `1..100`이다. 같은 DB snapshot에서 count와 pagination metadata를 계산하며 같은 데이터 상태에서 page 경계와 순서는 반복 요청마다 안정적이다.

```json
{
  "content": [
    {
      "slug": "java-enum-guide",
      "likeCount": 12,
      "commentCount": 3
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "last": false
}
```

frontend는 정적 목록 조회를 API로 반복하지 않는다. 현재 목록에 필요한 projection page를 각각 한 번만 요청하고, 모든 응답을 slug map으로 만든 뒤 각 `PostMetadata` item에 `likeCount`와 `commentCount`를 결합한다. 개별 slug API를 반복 호출하지 않는다. projection을 기다리는 동안에는 미확인 count를 `0`으로 표시하지 않고 반응 지표 한 줄에만 고정 크기 skeleton을 표시한다. 모든 page fetch가 완료되면 좋아요와 댓글 count를 한 번에 공개한다. projection 실패 시 count를 성공한 것처럼 조작하지 않고 지표 영역에 재시도 가능한 비성공 상태를 표시한다. 정적 article 순서와 tag filtering은 기존 Markdown metadata가 계속 담당한다.

잘못된 page/size는 `400 ProblemDetail(code=INVALID_REQUEST)`다. 빈 page는 `200`과 빈 `content`를 반환한다.

### Detail projection

`GET /api/posts/{slug}/engagement`는 다음을 반환한다.

```json
{
  "slug": "java-enum-guide",
  "likeCount": 12,
  "commentCount": 3,
  "liked": true
}
```

active slug는 `200`이다. cookie가 없으면 `liked=false`이고 조회 요청만으로 cookie나 visitor row를 만들지 않는다. inactive 또는 unknown slug는 `404 ProblemDetail(code=NOT_FOUND)`, slug 형식 오류는 `400 ProblemDetail(code=INVALID_REQUEST)`다.

### Idempotent like selection and cancellation

- `PUT /api/posts/{slug}/like`: 현재 브라우저의 desired state를 liked로 만든다.
- `DELETE /api/posts/{slug}/like`: 현재 브라우저의 desired state를 unliked로 만든다.
- request body는 없다. 두 method 모두 성공 시 `200`과 detail projection에 `changed: boolean`을 추가해 반환한다.

첫 PUT은 like row를 만들고 `changed=true`, 중복 PUT은 count를 늘리지 않고 `changed=false`다. 기존 like의 DELETE는 row를 제거하고 `changed=true`, 중복 DELETE 또는 cookie 없는 DELETE는 count를 바꾸지 않고 `changed=false`다. 없는 active slug는 두 method 모두 `404`, 잘못된 slug는 `400`이다. 이 desired-state 계약은 네트워크 재시도가 POST toggle을 두 번 뒤집는 문제를 피한다.

frontend는 응답의 `liked`와 count만 UI 정본으로 사용한다. 요청 중에는 버튼을 disable하고, 실패하면 마지막으로 확인된 서버 상태를 유지하며 사용자에게 실패 안내와 재시도 수단을 제공한다. 성공 응답 전에 count를 증가시키는 optimistic update는 하지 않는다.

## Anonymous visitor cookie and threat model

cookie 이름은 `blog_anonymous_id`이고 cryptographically secure UUID v4 128-bit 무작위 값만 담는다. slug, 좋아요 사실, count, IP, user-agent를 넣지 않는다. 첫 유효 PUT에서만 생성하고 같은 transaction에서 visitor row와 like row를 저장한다.

production 속성은 `Secure; HttpOnly; SameSite=Lax; Path=/api; Max-Age=31536000`이며 `Domain`은 설정하지 않는다. local HTTP 개발 profile만 `Secure=false`로 override하고 나머지 속성은 동일하다. frontend는 cookie를 읽지 않으며 relative `/api` URL과 `credentials: "same-origin"`을 사용한다. production은 같은 origin이므로 CORS를 열거나 `Access-Control-Allow-Credentials`를 추가하지 않는다.

위협 모델은 악성 third-party site가 로그인 없는 방문자의 browser를 이용해 좋아요를 변경하는 CSRF와 자동 반복 요청이다. backend는 PUT/DELETE의 `Origin`을 exact allowlist(`https://blog.yehyeok.xyz`, local profile의 `http://localhost:3000`)와 비교한다. production에서 Origin 누락, `null`, 불일치는 `403 ProblemDetail(code=FORBIDDEN)`다. `SameSite=Lax`는 보조 방어이고 Origin 검증을 대체하지 않는다. XSS가 발생하면 same-origin 요청 자체는 가능하므로 기존 렌더링 안전성, HttpOnly와 rate limit으로 피해를 제한한다.

Traefik은 `PUT|DELETE ^/api/posts/[^/]+/like/?$` 전용 priority 200 router에 RemoteAddr 기준 평균 분당 10회, burst 5회를 적용한다. 초과 요청은 backend/SQLite 도달 전 `429`다. 단일 host·단일 Traefik의 in-memory 제한이며 분산 limiter는 도입하지 않는다.

## SQLite schema, migration and consistency

cookie 원문은 DB에 저장하지 않고 SHA-256 digest를 저장한다. digest는 무작위 128-bit token의 lookup key이며 로그에 기록하지 않는다.

```sql
CREATE TABLE anonymous_visitor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE post_like (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    visitor_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE RESTRICT,
    CONSTRAINT fk_post_like_visitor FOREIGN KEY (visitor_id) REFERENCES anonymous_visitor(id) ON DELETE CASCADE,
    CONSTRAINT uk_post_like_post_visitor UNIQUE (post_id, visitor_id)
);

CREATE INDEX idx_post_like_post_id ON post_like(post_id);
CREATE INDEX idx_comment_post_slug ON comment(post_slug);
```

새 migration runner는 `schema_migration(version PRIMARY KEY, applied_at)`와 순번 SQL을 사용한다. deploy는 기존 container 교체 전에 exclusive migration lock을 얻고 SQLite `.backup`과 integrity check를 완료한 뒤 transaction으로 아직 적용되지 않은 additive migration만 실행한다. schema/table/index/foreign key와 `PRAGMA foreign_keys=ON`을 검증한 후에만 새 image를 시작한다. 실패한 transaction은 rollback되고 기존 container는 교체하지 않는다. Hibernate production 설정은 migration과 충돌하지 않도록 `ddl-auto=validate`로 전환하며 test는 격리 DB에 같은 migration을 적용한다.

count 컬럼은 별도로 저장하지 않는다. `likeCount`는 `post_like` row count, `commentCount`는 `comment` row count로 계산하므로 음수 상태가 존재하지 않는다. PUT transaction은 active post와 visitor를 확인/생성한 뒤 unique `(post_id, visitor_id)` insert를 수행한다. 같은 visitor의 동시 PUT 중 하나만 insert되고 나머지는 unique conflict를 정상 중복으로 해석한다. DELETE는 같은 key row를 원자적으로 삭제하며 영향 row 수가 0이면 중복 취소다. mutation과 반환 count 조회는 하나의 service transaction에서 flush 후 수행한다. SQLite write serialization과 unique constraint가 최종 정합성을 보장하며, 서로 경쟁하는 PUT/DELETE의 최종 상태는 DB가 commit한 마지막 desired-state operation이다.

Post 연결은 기존 `Post.id` FK를 사용하지만 API·frontend·분석의 콘텐츠 식별자는 계속 Markdown filename slug다. `content/posts/*.md`는 rename하거나 delete/recreate하지 않는다.

## Static export and deployment

production과 local Next 개발 모두 API base URL은 상대 경로 `/api`다. 새 `NEXT_PUBLIC_API_BASE_URL`은 필요하지 않으며 static export에 환경별 backend host를 bake하지 않는다. production에서는 Traefik이 cookie와 Origin header를 변경하지 않고 backend로 전달하고 local Next rewrite가 localhost backend로 proxy한다.

backend image는 migration SQL과 JAR를 포함하되 DB를 포함하지 않는다. deploy workflow는 immutable commit SHA tag와 `latest`를 push하고, 적용할 SHA를 기록한다. 순서는 preflight → migration 전 backup/integrity → migration → image pull → compose up `--wait` → same-origin smoke test다. health는 datasource와 migration version 검증이 성공해야 `UP`이다.

migration은 additive이므로 이전 backend image는 새 table을 무시하고 기존 댓글 기능을 계속 제공할 수 있다. app health 또는 smoke test 실패 시 직전 SHA tag로 compose를 재적용한다. DB restore는 migration transaction 실패에는 사용하지 않고, migration 후 데이터 손상이 확인된 경우에만 backend를 정지하고 검증된 pre-migration backup을 별도 복구 경로에 restore·integrity check한 뒤 원본과 원자 교체한다. 자동 DB restore는 하지 않는다.

전체 SQLite `.backup`은 `anonymous_visitor`, `post_like`, 기존 comment와 migration metadata를 함께 포함한다. restore rehearsal은 cookie 원문을 알 필요 없이 row와 count 정합성, unique 제약, integrity check를 검증한다.

## UI contract

피드 지표는 클릭 동작 없는 `♡ {likeCount} 댓글 {commentCount}`다. 상세 native button은 본문 끝과 댓글 사이 한 번만 두고 최소 48px, 기본 외곽선 `♡ 이 글이 도움됐어요 {count}`, 선택 mint `♥ 이 글이 도움됐어요 {count}`, `aria-pressed`와 보이는 keyboard focus를 유지한다.

피드 projection 로딩 UI는 실제로 대기 중인 반응 지표 영역에만 적용한다. 이미 정적 HTML에 있는 제목, 설명, 날짜, tag와 thumbnail은 가리지 않는다. skeleton은 기존 지표 줄의 높이와 숫자 영역 폭을 예약해 layout shift를 만들지 않고, light/dark의 기존 surface token만 사용한 절제된 shimmer로 대기 상태를 표현한다. `prefers-reduced-motion`에서는 shimmer를 제거한다. 지표 컨테이너는 로딩 중 `aria-busy=true`이며 skeleton 장식은 보조기기에서 숨긴다. 로딩 중에는 실제 count를 뜻하는 label을 제공하지 않는다.

하트는 고정 폭을 예약한다. 숫자 span은 `max(1, decimal digit count) * 1.01ch` 폭과 tabular numerals를 사용해 `0–9`, `10–99`, `100–999` 안에서 버튼 폭이 같고 자릿수 경계에서만 넓어진다. `됐어요`와 count 사이에는 별도의 렌더링 공백을 유지한다. mobile·desktop, light·dark에서 기존 mint token만 사용한다.

## Verification and release gate

OpenSpec 승인 후 TDD로 service 단위 테스트와 controller/migration 통합 테스트를 먼저 실패시킨 뒤 최소 구현한다. 신규·재방문 cookie, 중복 PUT/DELETE, 없는/invalid slug, Origin 거부, concurrency, count aggregation, projection pagination을 자동 검증한다. frontend는 API client 상태 테스트, lint, static build와 browser mobile/desktop·keyboard·실패 UI를 검증한다.

배포 검증은 Docker image에 migration과 manifest가 있고 DB가 없는지, Compose route/health/mount가 올바른지, 임시 SQLite backup/restore가 engagement row를 보존하는지 확인한다. 실제 Oracle 배포 뒤 Traefik을 통한 GET/PUT/DELETE, cookie 속성, 재방문, 429, backend healthy와 rollback target을 확인한다.

배포·운영 근거가 없는 task는 완료 표시하지 않는다. 구현·테스트 대조와 strict validation 뒤 delta를 base spec에 동기화하고, 실제 운영 검증까지 끝난 경우에만 archive한다.

## Risks / Trade-offs

- feed count는 정적 HTML 이후 client에서 채워지므로 JavaScript가 없거나 API가 실패하면 최신 count를 볼 수 없다. article 콘텐츠와 navigation은 계속 사용할 수 있다.
- SHA-256 visitor token digest는 cookie 탈취 자체를 막지 않는다. Secure·HttpOnly·SameSite·Origin 검증이 탈취와 오용 위험을 줄인다.
- count를 매번 aggregate하므로 매우 큰 트래픽에서는 비용이 늘 수 있다. 현재 개인 블로그 규모에서는 redundant counter와 reconciliation 부담보다 단순성과 정합성이 중요하다.
- SQLite migration과 container restart는 짧은 쓰기 중단을 만들 수 있다. 현 단일 instance에서 허용하며 무중단 migration은 범위 밖이다.
