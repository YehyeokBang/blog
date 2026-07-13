## Why

블로그의 SEO 기초 인프라(메타 태그, sitemap, robots)는 이전 change(`seo-meta-tags`)에서 구축되었지만, 방문자 행동을 추적할 수단이 없고, 파비콘·JSON-LD·OG 이미지 등 SEO 마무리 요소가 빠져 있다. 또한 피드(PostList)의 UX가 텍스트 위주여서 시각적 매력이 부족하고, 클릭 영역이 제목 텍스트에만 한정되어 있어 접근성·사용성이 낮다. 이 세 가지를 한꺼번에 해결하여 "검색 → 유입 → 체류" 순환 고리를 완성한다.

## What Changes

- **GA4 연동**: `@next/third-parties`의 `GoogleAnalytics` 컴포넌트를 루트 레이아웃에 추가하여 방문자 분석을 시작한다. Measurement ID는 환경 변수(`NEXT_PUBLIC_GA_ID`)로 관리한다.
- **파비콘 추가**: `frontend/app/` 디렉토리에 `favicon.ico` 파일을 배치하여 Next.js가 자동으로 인식하도록 한다.
- **JSON-LD Article 구조화 데이터**: 포스트 상세 페이지(`[slug]/page.tsx`)에 `Article` 타입의 JSON-LD `<script>` 태그를 삽입하여 Google Rich Results 자격을 확보한다.
- **썸네일 기반 동적 OG 이미지**: 포스트의 `thumbnail` frontmatter가 있으면 절대 URL로 변환하여 `og:image` / `twitter:image`에 사용하고, 없으면 기본 폴백 이미지(`/images/og-default.webp`)를 사용한다.
- **피드 썸네일 렌더링**: PostList 컴포넌트에서 `thumbnail`이 존재하는 포스트에 대해 카드 우측에 썸네일을 표시한다.
- **피드 카드 클릭 영역 확대**: 제목 `<Link>` 대신 카드 `<article>` 전체를 클릭 가능하게 하여 UX를 개선한다. 태그 버튼은 이벤트 전파를 차단하여 독립 동작을 유지한다.

## Capabilities

### New Capabilities
- `analytics`: GA4 연동 및 환경 변수 기반 Measurement ID 관리

### Modified Capabilities
- `seo-metadata`: 파비콘, JSON-LD Article, 썸네일 기반 동적 OG 이미지 및 폴백 처리 추가
- `blog-rendering`: 피드 카드에 썸네일 렌더링 추가 및 카드 전체 클릭 영역 UX 개선

## Impact

- `frontend/app/layout.tsx` — GA4 `GoogleAnalytics` 컴포넌트 추가
- `frontend/app/favicon.ico` — [NEW] 파비콘 파일 배치
- `frontend/app/posts/[slug]/page.tsx` — JSON-LD 스크립트 삽입, OG 이미지 폴백 로직 강화
- `frontend/components/PostList.tsx` — 썸네일 렌더링 UI 추가, 카드 전체 클릭 영역 개선
- `frontend/public/images/og-default.webp` — [NEW] OG 이미지 기본 폴백 이미지
- `frontend/next.config.ts` — 변경 없음 (SSG 유지)
- `package.json` — `@next/third-parties` 의존성 추가
