## Context

`PostList`는 정적 Markdown metadata를 표시하고 URL query 기반 tag filtering을 유지한다. 썸네일은 이미 목록 카드에 존재하므로, 이 change는 이미지의 source나 content pipeline이 아니라 breakpoint별 배치만 바로잡는다. tag filter 목록은 별도의 가로 scroll container이며 카드 안의 post tag link와 구분해야 한다.

## Decisions

### 1. 썸네일은 mobile-first 순서로 유지한다

`sm` 미만에서는 `flex-col-reverse` 구조로 썸네일을 글 정보 위에 가로로 둔다. `sm` 이상에서는 가로 row의 우측 고정 비율 image로 바꾼다. 이미지는 어느 breakpoint에서도 숨기지 않고 기존 `object-fit: cover`를 유지한다.

### 2. 상단 filter overflow만 조건부로 알린다

피드 상단 가로 tag filter 목록은 `scrollWidth > clientWidth + scrollLeft + 1`일 때만 우측 gradient 단서를 표시한다. 단서는 `pointer-events: none`이어서 link 클릭·scroll을 가로막지 않으며, overflow가 없거나 오른쪽 끝이면 숨긴다. 카드 내부 post tag 목록에는 이 단서를 추가하지 않는다.

### 3. 상세 link와 tag filter link의 hit target을 분리한다

각 카드는 tag 영역을 제외한 전체를 하나의 상세 link hit target으로 제공한다. card tag는 별도 filter link여야 하며 nested anchor를 만들지 않는다. tag activation은 post 상세 navigation을 발생시키지 않는다.

### 4. focus-visible만 명시적으로 강조한다

피드 상단 filter link, 카드 상세 link와 카드 tag link는 primary 색의 식별 가능한 `focus-visible` ring 또는 outline을 제공한다. pointer 사용 시의 기존 절제된 외관은 유지하고, `focus:outline-none`을 단독으로 사용하지 않는다.

## Risks / Trade-offs

- 작은 화면에서 가로 thumbnail이 추가 높이를 차지하지만, 이미지가 사라져 목록의 맥락을 잃는 문제보다 읽기 순서가 명확하다.
- gradient는 스크롤 가능성을 암시할 뿐 scrollbar를 대체하지 않는다. 실제 overflow 상태에만 표시해 잘못된 affordance를 피한다.
