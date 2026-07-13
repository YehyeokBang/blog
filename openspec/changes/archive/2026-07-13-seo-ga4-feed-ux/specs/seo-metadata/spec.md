## ADDED Requirements

### Requirement: 파비콘 제공
시스템은 모든 페이지에서 블로그 고유의 파비콘을 브라우저 탭에 표시해야 한다.

#### Scenario: 파비콘 로딩
- **WHEN** 사용자가 블로그의 임의의 페이지에 접속할 때
- **THEN** 브라우저 탭에 블로그 고유의 파비콘(`favicon.ico`)이 표시되어야 한다.

### Requirement: JSON-LD Article 구조화 데이터
시스템은 각 포스트의 상세 페이지에 `Article` 타입의 JSON-LD 구조화 데이터를 삽입하여 검색 엔진이 콘텐츠를 구조적으로 이해할 수 있도록 해야 한다.

#### Scenario: JSON-LD 스크립트 렌더링
- **WHEN** 사용자가 포스트 상세 페이지(예: `/posts/my-post`)에 접속할 때
- **THEN** 페이지의 HTML에는 `<script type="application/ld+json">` 태그가 포함되며, 그 내용에는 `@type: "Article"`, `headline`, `datePublished`, `author`, `description`, `image`, `url` 필드가 포함되어야 한다.

#### Scenario: 썸네일 없는 포스트의 JSON-LD 이미지 폴백
- **WHEN** 포스트의 frontmatter에 `thumbnail` 속성이 없을 때
- **THEN** JSON-LD의 `image` 필드는 기본 폴백 이미지(`/images/og-default.webp`)의 절대 URL을 사용해야 한다.

## MODIFIED Requirements

### Requirement: 동적 메타데이터 주입
시스템은 마크다운 게시글의 상세 페이지 렌더링 시, 해당 게시글의 Frontmatter 정보를 바탕으로 고유한 메타데이터를 생성하여 주입해야 한다.

#### Scenario: 포스트 상세 페이지의 메타데이터 생성
- **WHEN** 사용자가 특정 게시글(예: `/posts/my-post`)에 접근할 때
- **THEN** 시스템은 `generateMetadata` 함수를 통해 게시글의 `title`, `description`(또는 대체 필드), `thumbnail`을 파싱하여 해당 페이지 전용 메타 태그 및 Open Graph 태그로 렌더링한다.

#### Scenario: 썸네일이 있는 포스트의 OG 이미지
- **WHEN** 포스트의 frontmatter에 `thumbnail` 속성이 존재할 때
- **THEN** 시스템은 해당 이미지 경로를 절대 URL로 변환하여 `og:image` 및 `twitter:image` 메타 태그에 사용해야 한다.

#### Scenario: 썸네일이 없는 포스트의 OG 이미지 폴백
- **WHEN** 포스트의 frontmatter에 `thumbnail` 속성이 없을 때
- **THEN** 시스템은 기본 폴백 이미지(`/images/og-default.webp`)를 `og:image` 및 `twitter:image` 메타 태그에 사용해야 한다.
