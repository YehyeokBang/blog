# 디자인 시스템

이 문서는 현재 UI의 디자인 원칙과 사용법을 설명한다. 토큰의 실제 값은 [`frontend/app/globals.css`](../frontend/app/globals.css)가 단일 출처이며, 문서와 CSS가 다르면 CSS를 기준으로 이 문서를 갱신한다.

## 방향

- 깔끔하고 전문적이되 지나치게 무겁지 않은 개발자 블로그를 지향한다.
- 여백과 타이포그래피를 주요 구조로 사용하고 장식 요소는 최소화한다.
- 긴 기술 글의 가독성, 모바일 사용성, 명확한 상호작용을 시각적 화려함보다 우선한다.
- 색상 accent는 mint 계열 하나를 중심으로 사용한다.
- 과한 shadow나 카드 중첩을 피하고, border와 surface 색은 구획이 필요할 때만 사용한다.

초기 시안은 [피드](feed.png)와 [글 상세](details.png)를 참고하되 현재 구현 계약은 아니다.

## 테마

`next-themes`의 `defaultTheme="system"`을 사용한다. 첫 방문은 운영체제 설정을 따르고, header의 토글로 light/dark를 바꾸면 선택이 local storage에 저장된다.

### 색상 토큰

| 토큰 | Light | Dark | 용도 |
|---|---|---|---|
| `primary` | `#008A63` | `#10B981` | 링크, 선택 상태, 주요 버튼 |
| `primary-hover` | `#007050` | `#34D399` | primary hover |
| `primary-surface` | `#E6F9F4` | `rgba(16, 185, 129, 0.1)` | 선택 tag와 callout 배경 |
| `canvas` | `#FFFFFF` | `#0B0F19` | 페이지 배경 |
| `surface-soft` | `#F9FAFB` | `#151A26` | 보조 배경, comment, inline code |
| `surface-muted` | `#F2F4F6` | `#1F2937` | 비활성 tag, hover surface |
| `hairline` | `#E5E8EB` | `#374151` | 입력과 표의 경계 |
| `hairline-soft` | `#F2F4F6` | `#1F2937` | header·footer·본문의 약한 경계 |
| `ink` | `#191F28` | `#F9FAFB` | 제목과 강한 본문 |
| `body` | `#333D4B` | `#D1D5DB` | 기본 본문 |
| `muted` | `#8B95A1` | `#9CA3AF` | 날짜와 보조 정보 |
| `muted-soft` | `#B0B8C1` | `#6B7280` | 더 약한 정보와 scrollbar |
| `on-primary` | `#FFFFFF` | `#FFFFFF` | primary 버튼 위 글자 |

## 타이포그래피

본문과 UI는 Pretendard를 우선하고 시스템 sans-serif로 fallback한다. 코드는 JetBrains Mono와 시스템 monospace를 사용한다.

| 토큰 | 크기 | 대표 용도 |
|---|---:|---|
| `display-xl` | 52px | 큰 display가 필요한 경우 |
| `display-lg` | 40px | desktop 페이지 제목 |
| `display-md` | 28px | mobile 페이지 제목, 본문 h2 |
| `title-lg` | 22px | 큰 item 제목 |
| `title-md` | 20px | 소제목 |
| `body-lg` | 18px | 글 본문, desktop 소개 본문 |
| `body-md` | 16px | 목록 설명과 기본 UI 본문 |
| `caption` | 15px | 날짜와 읽기 시간 |
| `code` | 15px | code block |
| `tag` | 14px | tag와 작은 action |

제목은 크기와 weight로 위계를 만들고, 본문은 `line-height: 1.6`을 기본으로 긴 문장도 읽기 편하게 유지한다. 순수 검정 대신 `ink`를 사용한다.

## 간격과 형태

- 간격은 4px 단위를 기준으로 `4, 8, 16, 24, 32, 48, 80px` 토큰을 사용한다.
- 공통 shell의 최대 너비는 1000px이고 좌우 padding은 mobile 24px, desktop 24px이다.
- 글 상세의 article은 최대 800px, desktop TOC 열은 250px이다.
- 기본 radius는 12px, 큰 surface는 14px 이상을 사용한다. tag는 pill 형태다.
- 목록 항목은 mobile 48px, desktop 80px 간격으로 분리한다.

## 현재 컴포넌트 동작

### Header와 footer

- Header는 높이 60px의 비스크롤 surface이며 약한 blur와 bottom hairline을 사용한다. Header와 main·footer는 같은 `100dvh` flex shell의 형제이고, main·footer만 전용 스크롤 surface 안에 둔다. 지원되는 coarse touch browser에서는 아티클 목록과 글 상세에서만 당김 새로고침을 제공하며, 최신 정적 콘텐츠 payload를 다시 읽는 동안 header·theme state는 유지한다. 소개 페이지는 당김 새로고침 대상이 아니다. 상태는 화면상 텍스트 없이 SVG progress ring으로 전달한다. 전용 스크롤 surface와 overscroll 제어로 iOS browser의 네이티브 새로고침 충돌을 줄이되, 브라우저 제스처의 완전 차단은 보장하지 않는다.
- 왼쪽에는 `Yehyeok`, 오른쪽에는 아티클·소개 navigation과 theme toggle이 있다.
- Footer는 GitHub와 소개 링크를 제공한다.

### 아티클 피드

- 최신순 목록과 URL query 기반 tag filter를 제공한다.
- 제목, 설명, 날짜, 읽기 시간, tag를 표시한다.
- thumbnail이 있으면 desktop에서는 우측 고정 비율 이미지로, mobile에서는 글 정보 위의 가로 이미지로 노출한다.
- 제목과 thumbnail이 상세 페이지 링크이며 tag는 filter 링크로 독립 동작한다.

### 글 상세

- 제목, 날짜, 읽기 시간, tag, 선택적 thumbnail을 표시한다.
- 본문은 Markdown을 HTML로 변환하며 h1~h6, 목록, 표, 인용문, inline code를 공통 토큰으로 스타일링한다.
- code block은 테마와 관계없이 GitHub Dark 계열 배경과 복사 버튼을 사용한다.
- Desktop `lg` 이상에서는 실제 높이가 viewport 높이에서 120px을 뺀 값 이하일 때만 오른쪽 TOC를 sticky로 표시하고, 긴 TOC는 내부 scrollbar 없이 document flow에 둔다. 작은 화면의 inline TOC도 모든 item을 document flow에 표시한다.
- TOC는 본문의 h1·h2를 추적하며 현재 section을 mint 색으로 강조한다.
- 게시글 header가 fixed header 위로 사라진 뒤에만, viewport 상단 중앙(`top: 68px`)에 44×44px icon-only `ArrowUp` top control을 표시한다. control은 native button의 `맨 위로 이동` accessible name, visible focus indicator, motion preference를 따르는 top scroll과 절제된 glass/fallback surface를 유지한다.
- 본문 아래에는 익명 profile 기반 댓글 작성과 댓글 목록이 있다.

### 소개

소개, 연락처, 경력, 활동을 같은 1000px shell 안에서 제공한다. mobile과 desktop의 글자 크기만 조정하고 별도 좁은 column을 만들지 않는다.

## 반응형 기준

- 기본 mobile-first layout을 사용한다.
- `sm`(640px)부터 feed가 텍스트와 thumbnail의 가로 배치로 바뀐다.
- `md`(768px)부터 페이지 제목과 본문 일부의 typography가 커진다.
- `lg`(1024px)부터 글 상세의 desktop TOC가 나타나고 mobile inline TOC는 숨긴다.

## 아직 현재 기능이 아닌 항목

MDX custom component, 시리즈 이전·다음, 관련 글, 조회수·좋아요 표시는 현재 구현되어 있지 않다. 필요 시 [로드맵](roadmap.md) 우선순위와 OpenSpec change를 먼저 확정한다.

## 변경 체크

- 새 색이나 간격을 추가하기 전에 기존 CSS token으로 표현 가능한지 확인한다.
- light/dark 양쪽에서 대비와 hover·focus 상태를 확인한다.
- UI 변경은 mobile과 desktop을 모두 확인하고 keyboard 접근성과 label을 점검한다.
- 문서 예시보다 실제 component와 `globals.css`를 먼저 대조한다.
