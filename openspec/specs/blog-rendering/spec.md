# blog-rendering

## Purpose
TBD - 마크다운 파싱 및 블로그 정적 HTML 렌더링에 대한 핵심 기능과 책임 정의.

## Requirements

### Requirement: 마크다운 정적 파싱 및 피드 렌더링
시스템(Next.js)은 빌드 타임에 `content/posts/` 디렉토리 내의 마크다운 파일 목록을 읽어 최신순으로 정렬된 정적 HTML 블로그 피드 페이지를 생성해야 한다.

#### Scenario: 피드 목록 정적 생성
- **WHEN** 빌드 스크립트(`next build`)가 실행될 때
- **THEN** 시스템은 각 마크다운의 Frontmatter(date, title, tags 등)를 파싱하여 메인 피드 페이지의 HTML 정적 파일을 생성한다.

### Requirement: 마크다운 상세 페이지 및 Shiki 하이라이팅 적용
시스템은 각 마크다운 게시글의 상세 페이지를 개별 정적 HTML 파일로 생성해야 하며, 본문 내의 코드 블록에 Shiki 하이라이팅 스타일 클래스가 정상적으로 삽입되어야 한다.

#### Scenario: 상세 페이지 조회 및 코드 가독성 검증
- **WHEN** 사용자가 특정 게시글 URL(예: `/posts/my-first-post`)의 정적 배포본에 접속할 때
- **THEN** 브라우저에는 마크다운 본문이 HTML로 변환된 화면과 함께 코드 블록에 `rehype-pretty-code`가 적용된 컬러 테마 스타일이 온전히 렌더링된다.
