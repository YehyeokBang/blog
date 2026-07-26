## MODIFIED Requirements

### Requirement: 마크다운 정적 파싱 및 피드 렌더링
시스템(Next.js)은 빌드 타임에 `content/posts/` 디렉토리 내의 마크다운 파일 목록을 읽어 최신순으로 정렬된 정적 HTML 블로그 피드 페이지를 생성해야 한다(MUST).

#### Scenario: 피드 목록 정적 생성
- **WHEN** 빌드 스크립트(`next build`)가 실행될 때
- **THEN** 시스템은 각 마크다운의 Frontmatter(date, title, tags 등)를 파싱하여 메인 피드 페이지의 HTML 정적 파일을 생성한다.

#### Scenario: 피드 목록 내 반응형 이미지 썸네일 노출
- **WHEN** 마크다운 파일의 Frontmatter에 `thumbnail: /images/...` 속성이 존재할 때
- **THEN** 시스템은 메인 피드 목록에서 해당 게시글의 썸네일 이미지를 렌더링한다.
- **AND** 모바일 해상도(`sm` 미만)에서는 글 정보 위의 가로 이미지로, `sm` 이상에서는 카드 우측의 고정 비율 이미지로 표시한다.
- **AND** 이미지는 `object-fit: cover` 처리되어 비율을 유지하며 잘라낸다.

#### Scenario: 피드 카드 전체 클릭 영역
- **WHEN** 사용자가 피드 목록의 카드에서 post tag link를 제외한 제목, 설명, 날짜, thumbnail 또는 여백 영역을 활성화할 때
- **THEN** 시스템은 해당 포스트의 상세 페이지(`/posts/[slug]`)로 이동해야 한다.
- **AND** 상세 이동 영역은 하나의 link여야 하며 nested anchor를 만들면 안 된다.

#### Scenario: 태그 버튼 독립 동작
- **WHEN** 사용자가 피드 카드 내의 post tag link를 활성화할 때
- **THEN** 시스템은 해당 tag로 필터링 동작을 수행하며, 포스트 상세 페이지로의 이동은 발생하지 않아야 한다.

#### Scenario: 피드 상단 tag filter 목록의 조건부 스크롤 단서
- **WHEN** 피드 상단 가로 tag filter 목록의 오른쪽에 아직 보이지 않는 tag가 있을 때
- **THEN** 시스템은 tag를 가리지 않고 pointer interaction을 방해하지 않는 우측 시각 단서를 표시해야 한다.
- **WHEN** 목록에 가로 overflow가 없거나 오른쪽 끝까지 스크롤했을 때
- **THEN** 시스템은 우측 시각 단서를 표시하지 않아야 한다.

#### Scenario: 피드 link의 키보드 포커스
- **WHEN** 사용자가 키보드로 피드 상단 tag filter link, 피드 카드 상세 link 또는 post tag link에 포커스할 때
- **THEN** 시스템은 `focus-visible` 상태에서 primary 색을 사용한 식별 가능한 포커스 표시를 제공해야 한다.
