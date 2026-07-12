## Why

현재 블로그는 Next.js의 SSG 기능을 활용하여 정적 배포되고 있으나, SEO(검색엔진 최적화)를 위한 메타 태그(`title`, `description`, `og:*`, `twitter:*` 등)가 체계적으로 적용되어 있지 않습니다. 이를 표준화하고 자동화하여 검색 엔진 가시성을 높이고 트래픽을 확보해야 합니다. 또한 미래에 소셜 미디어 공유 시 풍부한 미리보기(Rich Preview)를 제공하기 위해 필수적인 작업입니다.

## What Changes

- Next.js의 Metadata API (또는 `next-seo`와 같은 방식)를 활용하여 공통 메타데이터 설정
- `content/posts/*.md`의 Frontmatter (`title`, `description` 등)를 활용하여 동적 라우트(`app/posts/[slug]/page.tsx`)에 메타 태그 자동 주입
- 메인 페이지, About 페이지 등에 대한 정적 메타데이터 추가
- `sitemap.xml` 및 `robots.txt` 자동 생성 로직(필요시) 검토 및 추가

## Capabilities

### New Capabilities
- `seo-metadata`: 페이지별 동적/정적 SEO 메타 태그 주입 및 사이트맵 관련 기능

### Modified Capabilities
- `blog-rendering`: 상세 페이지 렌더링 시 기존 Frontmatter 파싱 데이터를 SEO 메타 태그 생성에도 활용하도록 책임 추가

## Impact

- `frontend/app/layout.tsx` (공통 메타데이터)
- `frontend/app/page.tsx`, `frontend/app/about/page.tsx` 등 (정적 페이지 메타데이터)
- `frontend/app/posts/[slug]/page.tsx` (동적 페이지 메타데이터 - `generateMetadata`)
- 프론트엔드 SEO 설정 관련 유틸리티 파일 추가 가능성 있음
