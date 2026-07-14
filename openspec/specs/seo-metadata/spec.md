# seo-metadata

## Purpose
TBD - 검색 엔진 최적화 및 소셜 미디어 공유를 위한 메타 태그, 파비콘, 구조화 데이터 기능 정의.

## Requirements

### Requirement: 검색엔진 크롤러 메타데이터
시스템은 검색엔진 크롤러가 사이트를 올바르게 식별하고 크롤링할 수 있도록 표준 메타데이터(robots.txt, sitemap.xml, 파비콘)를 제공해야 한다.

#### Scenario: 파비콘 응답
- **WHEN** 브라우저나 크롤러가 `/favicon.ico`를 요청할 때
- **THEN** 시스템은 정적으로 배치된 32x32 크기의 아이콘 파일을 응답하여 브라우저 탭 등에 노출되도록 한다.

### Requirement: 구조화된 데이터 삽입
시스템은 검색 결과(Rich Snippet) 향상을 위해 포스트 상세 페이지에 구조화 데이터(JSON-LD)를 제공해야 한다.

#### Scenario: Article 타입 JSON-LD 제공
- **WHEN** 검색 엔진 봇이나 브라우저가 개별 포스트 페이지에 접속할 때
- **THEN** 시스템은 `Article` 타입의 JSON-LD 스크립트를 페이지 내에 렌더링하며, XSS 방지를 위해 쌍따옴표 및 HTML 태그(`<`)를 안전하게 이스케이프 처리한다.

### Requirement: 소셜 미디어 공유 메타데이터 (Open Graph)
시스템은 링크 공유 시 썸네일과 제목이 정상적으로 노출되도록 동적 OG(Open Graph) 및 Twitter Card 메타 태그를 생성해야 한다.

#### Scenario: 썸네일이 없는 포스트 공유
- **WHEN** Frontmatter에 `thumbnail` 속성이 없는 포스트의 URL이 공유될 때
- **THEN** 시스템은 기본 폴백 이미지(`/images/og-default.webp`)를 `og:image` 및 `twitter:image` 메타 태그 값으로 사용한다.
