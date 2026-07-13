## ADDED Requirements

### Requirement: 전역 기본 메타데이터 및 사이트 속성 제공
시스템은 블로그의 모든 페이지에 대해 기본이 되는 `title`, `description`, `openGraph` 및 `twitter` 메타데이터를 제공해야 한다.

#### Scenario: 루트 레이아웃 렌더링 시 기본 메타데이터 적용
- **WHEN** 사용자가 블로그의 임의의 페이지에 접속할 때
- **THEN** 시스템은 `layout.tsx`에 정의된 기본 메타데이터(블로그 이름, 기본 설명 등)를 `<head>` 태그 내에 렌더링한다.

### Requirement: 동적 메타데이터 주입
시스템은 마크다운 게시글의 상세 페이지 렌더링 시, 해당 게시글의 Frontmatter 정보를 바탕으로 고유한 메타데이터를 생성하여 주입해야 한다.

#### Scenario: 포스트 상세 페이지의 메타데이터 생성
- **WHEN** 사용자가 특정 게시글(예: `/posts/my-post`)에 접근할 때
- **THEN** 시스템은 `generateMetadata` 함수를 통해 게시글의 `title`, `description`(또는 대체 필드), `thumbnail`을 파싱하여 해당 페이지 전용 메타 태그 및 Open Graph 태그로 렌더링한다.
