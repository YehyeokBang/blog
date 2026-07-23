# 콘텐츠 전용 새로고침과 모바일 상단 여백 정리 계획

## 목표

모바일에서 고정 헤더는 움직이지 않게 유지하면서 아티클 목록과 상세 본문만 당김 새로고침으로 최신 배포본으로 갱신한다. 소개 페이지의 당김 새로고침은 제거하고, 세 페이지의 고정 헤더 아래 첫 콘텐츠 여백을 동일하게 맞춘다.

## 이번 범위에서 확정한 결정

- 새 글 목록과 수정된 글 본문까지 반영한다. 좋아요·댓글처럼 기존에 클라이언트에서 읽는 데이터도 상세 콘텐츠 재마운트 과정에서 기존 방식으로 다시 읽는다.
- 콘텐츠 JSON은 Next.js 정적 export 산출물로 생성한다. 백엔드 API, DB, Markdown 파일명(slug), Traefik의 `/api/*` 라우팅은 변경하지 않는다.
- 헤더 아래 전체를 하나의 전용 스크롤 영역으로 둔다. `body` 문서 스크롤을 사용하지 않아 iOS Chrome의 브라우저 당김 새로고침과 충돌할 가능성을 최대한 낮춘다. 다만 브라우저 제스처를 웹 페이지가 절대 차단할 수는 없다.
- 당김 새로고침은 `/`와 `/posts/[slug]`에서만 활성화한다. `/about`에서는 커스텀 새로고침과 네이티브 당김 동작 모두 제공하지 않는다.
- 프로그레스는 텍스트 없이 SVG 링만 사용한다. 링은 지금보다 굵게 하고, 헤더 하단과 당겨 내려간 콘텐츠 상단 사이의 중앙에 둔다. 정확한 크기·stroke·간격은 구현 시 로컬 화면에서 조정한다.
- 태그 `전체` 선택 문제는 현재 재현되지 않으므로 이번 변경 범위에서 제외한다.
- 고정 헤더 아래 첫 콘텐츠의 기본 여백은 기존 `xl` 토큰(32px)으로 통일한다. 페이지 내부에서 중첩된 `py-xl` 때문에 생긴 추가 상단 여백만 제거한다.

## 변경 구조

```text
Header (비스크롤, 새로고침/스크롤 영역 밖)
└─ ContentScrollShell (100dvh 기준 콘텐츠 스크롤 영역)
   ├─ PullToRefresh (아티클 경로에서만 제스처 처리)
   │  └─ main / footer
   └─ 현재 페이지가 등록한 refresh handler
      ├─ /              → /content-refresh/post-index 의 정적 JSON 재조회
      └─ /posts/[slug]  → /content-refresh/posts/[slug] 의 정적 JSON 재조회
```

`/content-refresh/*`는 frontend Nginx가 제공하는 정적 산출물이다. `/api/*`가 아니므로 기존 Traefik 백엔드 라우팅과 충돌하지 않는다.

## 예상 변경 파일

| 파일 | 역할 |
|---|---|
| `frontend/app/content-refresh/post-index/route.ts` | 빌드 시 정렬된 공개 글 목록 JSON 생성 |
| `frontend/app/content-refresh/posts/[slug]/route.ts` | 빌드 시 각 공개 글의 metadata·변환된 HTML JSON 생성 |
| `frontend/components/ContentScrollShell.tsx` | 콘텐츠 스크롤 영역, 현재 경로별 당김 활성화, refresh handler 연결 |
| `frontend/components/PullToRefresh.tsx` | 문서 스크롤 대신 콘텐츠 컨테이너의 `scrollTop`으로 제스처·진행 상태 처리 |
| `frontend/components/ContentRefreshContext.tsx` | 현재 페이지가 비동기 갱신 함수를 등록하고 shell이 완료 시점을 기다리게 하는 작은 context |
| `frontend/components/PostList.tsx` | 목록 JSON 재조회 후 목록·반응 지표 상태 갱신 |
| `frontend/components/PostDetail.tsx` (신규) | 상세 JSON 재조회와 상세 콘텐츠 하위 UI 재마운트 담당 |
| `frontend/app/posts/[slug]/page.tsx` | 서버의 최초 정적 렌더링·metadata·JSON-LD는 유지하고, UI 본문을 `PostDetail`에 위임 |
| `frontend/components/BackToTopButton.tsx` | 콘텐츠 스크롤 영역을 기준으로 표시·맨 위 이동 처리 |
| `frontend/components/TOC.tsx` | 콘텐츠 스크롤 영역을 기준으로 활성 heading 추적과 목차 이동 처리 |
| `frontend/app/layout.tsx` | header 밖에서 `ContentScrollShell`을 사용하도록 shell 구조 변경 |
| `frontend/app/page.tsx`, `frontend/app/about/page.tsx`, `frontend/app/posts/[slug]/page.tsx` | 중첩된 페이지 상단 `py-xl` 제거 |
| `frontend/app/globals.css` | 전용 스크롤 영역, 문서 overscroll 차단, 텍스트 없는 굵은 링의 위치·모션 스타일 |
| `frontend/lib/scroll-ux.ts`, `frontend/lib/scroll-ux.test.ts` | 컨테이너 기반 스크롤과 경로별 당김 허용 여부의 순수 판단 테스트 |
| `docs/design.md` | 실제 Header/당김 새로고침 동작을 새 계약으로 갱신 |

## 구현 순서

### 1. 정적 콘텐츠 재조회 경로를 먼저 만든다

1. Next.js 16의 static export route handler 규칙을 현재 설치된 Next.js 문서로 확인한다. 동적 slug route가 `generateStaticParams`와 함께 build 결과에 정적 JSON으로 포함되는지 확인한다.
2. `getAllPosts()`를 재사용하는 목록 route handler를 만든다. draft는 제외하고 현재 피드와 동일한 날짜 내림차순 결과를 반환한다.
3. `getPostBySlug()`를 재사용하는 상세 route handler를 만든다. metadata와 변환된 HTML만 반환하고 raw Markdown은 공개하지 않는다.
4. 존재하지 않는 slug는 정적 export가 실패하지 않도록 생성 대상에서 제외하고, 런타임 요청에는 404 응답을 반환한다.
5. `npm run build` 후 `frontend/out/content-refresh/` 아래에 목록과 각 slug의 정적 응답이 생성되는지 확인한다.

### 2. 헤더와 콘텐츠 스크롤 영역을 분리한다

1. `ContentScrollShell`과 최소한의 context를 추가한다. context는 현재 경로가 등록한 `Promise<void>` 갱신 함수를 하나만 유지한다.
2. `layout.tsx`에서 header는 shell 바깥에 그대로 두고, `main`과 footer만 shell 안으로 이동한다.
3. shell은 `/about`에서 당김 리스너·인디케이터를 만들지 않는다. `/`와 `/posts/` 경로에서는 현재 페이지의 handler를 호출하고 완료될 때까지 refreshing 상태를 유지한다.
4. `PullToRefresh`의 시작 조건을 `window.scrollY === 0`에서 콘텐츠 요소의 `scrollTop === 0`으로 교체한다. transform, touch 정리, 한 손가락·수직 우세·interactive target 제외 규칙은 유지한다.
5. 문서 root가 다시 위로 늘어나지 않도록 `html`, `body`, 콘텐츠 surface의 높이·overflow·overscroll 규칙을 추가한다. `100dvh`를 사용해 모바일 브라우저 chrome 변화에도 영역 높이가 맞게 한다.

### 3. 피드를 정적 JSON으로 갱신 가능하게 만든다

1. `PostList`의 `initialPosts`는 첫 paint 용도로 그대로 받는다.
2. shell에 등록할 갱신 함수에서 `/content-refresh/post-index`를 `cache: "no-store"`로 요청한다.
3. 성공 시 목록 상태와 반응 지표 로딩 상태를 초기화한 뒤, 새 목록을 렌더링한다. 실패 시 기존 목록은 유지하고 당김 UI만 원래 위치로 돌아간다.
4. 갱신 중 같은 요청을 중복 시작하지 않는다. URL의 현재 tag query는 유지하므로, 새 목록에서도 선택된 tag가 계속 적용된다.

### 4. 상세 화면을 콘텐츠 단위로 갱신 가능하게 만든다

1. `PostPage`는 현재의 정적 params, metadata, JSON-LD 생성 책임을 유지한다. 최초 `post`를 새 client component인 `PostDetail`에 넘긴다.
2. `PostDetail`은 `/content-refresh/posts/[slug]`를 재조회하는 handler를 등록한다. 성공하면 제목·메타데이터·썸네일·본문을 새 payload로 교체한다.
3. 본문 관련 하위 컴포넌트에는 갱신 version을 key 또는 명시적 prop으로 전달한다. 따라서 새 HTML의 heading을 TOC가 다시 수집하고, 코드 복사 버튼·좋아요·댓글의 기존 mount-time 데이터 로딩도 정상 동작한다.
4. 요청 실패 또는 404에서는 기존 상세 화면을 보존한다. 새로고침이 게시글을 지우거나 not-found 화면으로 바뀌지 않게 한다.

### 5. 컨테이너 스크롤에 의존하는 상세 기능을 함께 전환한다

1. `BackToTopButton`의 observer root, fallback scroll listener, 현재 위치 판정, 클릭 대상 모두 콘텐츠 스크롤 요소로 바꾼다.
2. `TOC`의 활성 heading 계산과 scroll listener를 콘텐츠 스크롤 요소 기준으로 바꾼다. 목차 링크 클릭은 해당 요소가 전용 컨테이너 안에서 보이도록 이동시킨다.
3. 기존 reduced-motion 선택, 44px 상단 이동 버튼의 접근성 이름·focus indicator, desktop sticky TOC 조건은 유지한다.

### 6. 여백과 링을 정리한다

1. 목록·소개 제목 wrapper와 상세 최상단 wrapper에서 추가 `py-xl`을 제거한다. shell 안 `main`의 공통 32px padding만 남겨 세 화면의 첫 콘텐츠 위치를 맞춘다.
2. 인디케이터의 한국어 visible text와 가로 정렬 gap을 제거한다. 스크린리더 상태 알림은 별도 `sr-only` 텍스트로 유지한다.
3. SVG track/progress stroke를 굵게 하고, 링의 fixed 위치를 헤더 하단과 pull transform 최대/현재 위치 사이의 시각적 중앙이 되도록 CSS 변수 또는 단일 상수로 조정한다.
4. 진행 중에는 fill, 완료 후에는 회전이라는 현재 의미를 유지한다. `prefers-reduced-motion`에서는 회전·전환을 제거한다.

### 7. 문서와 자동 검증을 마친다

1. `docs/design.md`의 Header 설명을 “문서 스크롤”이 아닌 “콘텐츠 전용 스크롤” 기준으로 수정하고, 소개 페이지는 당김 새로고침 대상이 아님을 기록한다.
2. `scroll-ux` 단위 테스트에 경로별 활성화, 컨테이너 top 조건, 진행률·threshold·reduced-motion 회귀 케이스를 추가한다.
3. 정적 route handler가 공개하지 않아야 할 draft와 raw Markdown이 결과에 없는지 build 산출물로 확인한다.
4. 다음 자동 검증만 수행한다. 사용자 요청에 따라 브라우저 기반 UI/UX QA는 수행하지 않는다.

```bash
cd frontend && npm run test:engagement
cd frontend && npm run test:content-refresh
cd frontend && npm run test:scroll-ux
cd frontend && npm run lint
cd frontend && NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
cd .. && node --test scripts/check-documentation.test.mjs
cd .. && node scripts/check-documentation.mjs
```

## 완료 기준

- 아티클 목록에서 당기면 최신 배포 목록 JSON을 다시 읽고, header와 theme state는 유지된다.
- 글 상세에서 당기면 같은 slug의 최신 제목·메타데이터·썸네일·본문이 갱신되며, 목차·상단 이동·코드 복사·반응 UI가 계속 동작한다.
- 소개 페이지에서는 커스텀 당김 인디케이터와 새로고침이 나타나지 않는다.
- 모든 대상 페이지에서 header 아래 첫 콘텐츠의 시작 여백이 32px으로 같다.
- 진행 링에는 화면상 텍스트가 없고, 굵어진 링만 중앙 위치에서 진행·새로고침 상태를 나타낸다.
- 정적 export, lint, 기존 단위 테스트, 문서 링크 검사가 통과한다.

## 범위 밖

- 태그 `전체` 선택 문제의 수정 및 예방 코드
- 백엔드 콘텐츠 API, DB 스키마, Traefik 라우팅 변경
- Markdown post 파일의 rename/delete 또는 slug 변경
- 브라우저 UI/UX QA와 운영 배포 검증
