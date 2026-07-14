## Context

현재 블로그는 Next.js SSG(`output: "export"`) + Nginx로 정적 배포되고 있다. SEO 기초(Metadata API, sitemap, robots)는 이전 change(`seo-meta-tags`)에서 완성되었다. 하지만 아래 3가지가 남아 있다:

1. **방문자 분석 수단 부재**: GA4 등 트래킹 코드가 없어 유입 경로·이탈률·인기 글 등의 데이터를 수집할 수 없다.
2. **SEO 마무리 요소 미비**: 파비콘이 없고(브라우저 탭에 기본 아이콘 노출), JSON-LD 구조화 데이터가 없어 Google Rich Results 자격을 얻지 못한다. 또한 `og:image`가 글별로 적용되지 않아 소셜 공유 시 미리보기 이미지가 없다.
3. **피드 UX 한계**: PostList가 텍스트만 표시하고, 클릭 영역이 제목 텍스트에만 한정되어 있다.

### 기술적 제약
- `output: "export"` (SSG) 모드이므로 서버 컴포넌트 런타임 기능(API Route, 동적 OG 이미지 생성 등)을 사용할 수 없다.
- `@next/third-parties`는 SSG에서도 정상 동작한다 (빌드 시 `<script>` 태그를 HTML에 삽입).

## Goals / Non-Goals

**Goals:**
- GA4를 연동하여 방문자 행동 데이터를 수집한다.
- 파비콘을 추가하고, 포스트 상세 페이지에 JSON-LD Article 구조화 데이터를 삽입한다.
- 포스트의 `thumbnail` frontmatter를 동적 OG 이미지로 활용하고, 없을 때 기본 폴백 이미지를 제공한다.
- 피드 카드에 썸네일을 표시하고, 카드 전체를 클릭 가능하게 한다.

**Non-Goals:**
- RSS 피드 생성 (이번 스코프에서 제외)
- 서버 사이드 동적 OG 이미지 생성 (`next/og` — SSG 모드에서 불가)
- 백엔드 API를 통한 조회수/좋아요 연동 (별도 change에서 진행)
- GA4 커스텀 이벤트 트래킹 (기본 페이지뷰 수집만 목표)

## Decisions

### 1. GA4 연동 방식: `@next/third-parties` 사용

**선택**: `@next/third-parties/google`의 `GoogleAnalytics` 컴포넌트를 사용한다.

**대안 검토**:
- (A) `<Script>` 태그로 gtag.js 직접 삽입 → 가능하지만 보일러플레이트가 많고 Next.js 팀이 공식 래퍼를 제공하므로 불필요.
- (B) `react-ga4` 라이브러리 → 추가 의존성이 필요하고, `@next/third-parties`가 Next.js에 최적화되어 있음.

**근거**: `@next/third-parties`는 Next.js 팀이 관리하는 공식 패키지로, 스크립트 로딩 전략(afterInteractive)이 내장되어 성능 영향을 최소화한다. SSG 빌드에서도 `<script>` 태그가 정적 HTML에 삽입되어 정상 동작한다.

**환경 변수**: `NEXT_PUBLIC_GA_ID`가 설정된 경우에만 GA 스크립트를 렌더링한다. 로컬 개발 시에는 설정하지 않으면 GA가 로드되지 않는다.

### 2. 파비콘 배치: Next.js 파일 기반 규칙 활용

**선택**: `frontend/app/favicon.ico` 경로에 파일을 배치한다.

**근거**: Next.js App Router는 `app/favicon.ico` 파일을 자동으로 인식하여 `<link rel="icon">` 태그를 생성한다. 별도 코드 작성이 필요 없다.

### 3. JSON-LD: `<script type="application/ld+json">`을 직접 삽입

**선택**: 포스트 상세 페이지의 서버 컴포넌트에서 `Article` 타입 JSON-LD를 `<script>` 태그로 직접 삽입한다.

**대안 검토**:
- (A) `next-seo` 라이브러리의 `ArticleJsonLd` → 추가 의존성이 필요. JSON-LD는 단순한 `<script>` 태그이므로 라이브러리 없이도 쉽게 구현 가능.

**근거**: JSON-LD는 순수 데이터 스크립트이므로 SSG에서 문제 없이 정적 HTML에 포함된다. 라이브러리 없이 타입 안전하게 객체를 직렬화하는 것으로 충분하다. 단, XSS 방지 및 파싱 에러 예방을 위해 `JSON.stringify(data).replace(/</g, '\\u003c')`와 같이 태그 문자를 이스케이프하는 안전한 직렬화 처리를 필수로 적용한다.

**포함 필드**: `@type: "Article"`, `headline`, `datePublished`, `author`, `description`, `image`(thumbnail 또는 폴백), `url`.

### 4. OG 이미지 폴백 전략: 정적 기본 이미지

**선택**: `thumbnail` frontmatter가 없는 포스트는 `/images/og-default.webp`(1200×630)를 OG 이미지로 사용한다.

**근거**: SSG 모드에서는 동적 OG 이미지 생성(`next/og`)을 사용할 수 없다. 따라서 정적 기본 이미지를 제공하여 소셜 공유 시 항상 미리보기 이미지가 존재하도록 보장한다.

**URL 형식**: `metadataBase`(`SITE_URL`)와 결합하여 절대 URL이 자동 생성된다.

### 5. 피드 카드 클릭 영역 확대: CSS `::after` 오버레이 패턴

**선택**: 카드 내부의 제목 `<Link>` 요소에 `::after` pseudo-element를 사용해 카드 전체 영역을 덮는 투명 오버레이를 만든다. 카드 `<article>`을 `position: relative`로 설정하고, `<Link>`의 `::after`를 `position: absolute; inset: 0`으로 확장한다.

**대안 검토**:
- (A) `<article>` 전체를 `<Link>`로 감싸기 → 내부의 태그 `<button>` 클릭과 충돌. `<a>` 안에 `<button>`을 넣는 것은 HTML 스펙 위반.
- (B) `onClick` 핸들러 + `router.push` → 클라이언트 컴포넌트 강제, 키보드 접근성/새 탭 열기 등 `<a>` 기본 동작 상실.

**근거**: `::after` 패턴은 HTML 시맨틱을 유지하면서도 전체 카드를 클릭 가능하게 하는 업계 표준 기법이다. 태그 버튼은 `position: relative; z-index: 1`로 오버레이 위에 떠오르게 하여 독립적으로 동작한다.
*트레이드오프*: 오버레이로 인해 카드 내부 텍스트의 드래그(선택)가 불가능해진다. 하지만 피드 목록에서 텍스트 복사 니즈가 적고, 상세 페이지에서는 정상 작동하므로 수용 가능한 UX 비용으로 판단한다.

### 6. 피드 썸네일 레이아웃: 수평 카드

**선택**: 썸네일이 있는 포스트는 카드 우측에 고정 크기 썸네일을 표시한다. 썸네일이 없는 포스트는 기존과 동일하게 텍스트만 표시한다.

**근거**: 수평 레이아웃(텍스트 좌측 + 이미지 우측)은 스캔 가독성이 높고, 기존 텍스트 전용 카드와의 시각적 일관성을 유지하기 쉽다. 이미지 크기는 `object-fit: cover`로 비율을 유지하며 잘라낸다. `next/image` 대신 네이티브 `<img>`를 사용한다 (`images.unoptimized: true` 설정 유지).
*반응형 대응*: 모바일 화면(Tailwind `sm` 브레이크포인트 미만)에서는 고정 크기 썸네일이 텍스트 영역을 과도하게 압박하므로, CSS `hidden sm:block` 등을 적용해 모바일에서는 썸네일을 숨기고 텍스트 가독성을 우선 확보한다.

## Risks / Trade-offs

- **GA4 스크립트 로딩 성능**: GA 스크립트가 페이지 로딩 속도에 미미한 영향을 줄 수 있다. → `@next/third-parties`의 내장 `afterInteractive` 전략으로 완화. 추후 Lighthouse 점수를 모니터링한다.
- **기본 OG 이미지 품질**: 모든 썸네일 없는 글이 동일한 기본 이미지를 공유한다. → 시각적으로 브랜드를 대표하는 기본 이미지를 준비하여 최소한의 품질을 보장한다. 추후 동적 생성이 필요하면 별도 change로 진행.
- **SSG 제약**: `output: "export"` 모드에서는 서버 사이드 기능을 사용할 수 없다. → 이번 change의 모든 기능은 빌드 타임 정적 생성과 클라이언트 사이드 스크립트로 충분히 구현 가능하다.
- **빌드 타임 GA ID 하드코딩**: Next.js SSG 특성상 `NEXT_PUBLIC_GA_ID`는 런타임이 아닌 빌드 타임에 HTML에 영구 주입된다. → 이 블로그는 CI(GitHub Actions)를 통해서만 프로덕션 배포되므로, CI Secrets에 프로덕션 GA ID를 설정하는 방식으로 환경을 격리하여 의도치 않은 트래킹을 방지한다.
