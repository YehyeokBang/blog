## Why

현재 피드는 모바일 썸네일 의도와 base spec이 불일치하고, 상단 tag filter의 가로 overflow와 카드·tag link의 조작 범위, 키보드 포커스 계약이 문서에 충분히 정의되어 있지 않다. 정적 콘텐츠 구조를 바꾸지 않고 피드의 반응형 읽기 흐름과 접근성을 명확히 할 필요가 있다.

## What Changes

- 모바일(`sm` 미만)에서는 썸네일을 숨기지 않고 글 정보 위의 가로 이미지로 표시하며, `sm` 이상에서는 우측 고정 비율 이미지로 표시한다.
- 피드 상단 가로 tag filter 목록에 오른쪽 overflow가 남아 있을 때만 클릭을 방해하지 않는 우측 시각 단서를 표시한다.
- 카드의 tag link를 제외한 영역을 하나의 상세 link로 만들고 tag link는 filter 이동을 독립적으로 유지한다.
- 피드의 상세 link와 tag link에 primary 색의 식별 가능한 `focus-visible` 포커스 표시를 제공한다.

## Capabilities

### New Capabilities

- 없음.

### Modified Capabilities

- `blog-rendering`: 피드 썸네일 반응형 배치와 tag filter, card link, keyboard focus 상호작용을 수정한다.

## Impact

- `frontend/components/PostList.tsx`와 피드 overflow 판정 helper·test가 변경된다.
- `docs/design.md`와 `blog-rendering` delta spec이 구현 계약을 기록한다.
- Markdown 콘텐츠, backend API, analytics 및 배포 구조는 변경하지 않는다.

## Non-Goals

- tag filtering query 또는 정적 feed 데이터 계약 변경
- 새 navigation, pagination, animation 또는 범용 scroll abstraction 추가
- thumbnail source, image 최적화 정책 또는 콘텐츠 파일 변경
