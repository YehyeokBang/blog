## Context

현재 Next.js App Router를 기반으로 정적 블로그(SSG)가 운영되고 있습니다. 메타데이터(타이틀, 설명, OG 태그 등)가 전역 또는 페이지 단위로 설정되지 않아, 검색 엔진이 콘텐츠를 분석하는 데 불리하며 소셜 공유 시 썸네일이나 요약본이 나타나지 않습니다.

## Goals / Non-Goals

**Goals:**
- Next.js의 내장 Metadata API를 활용한 전역 기본 메타데이터 설정
- `generateMetadata`를 활용하여 각 마크다운 글의 동적 메타데이터(타이틀, 설명, 이미지) 주입
- 검색 엔진에 친화적인 구조 확립

**Non-Goals:**
- 별도의 서드파티 라이브러리(`next-seo` 등) 도입 지양 (Next.js 13+ App Router의 내장 기능으로 충분)
- 복잡한 다국어 SEO 처리 제외 (단일 언어 환경 가정)

## Decisions

- **Metadata API 사용**: Next.js 13+부터 제공되는 내장 `Metadata` 객체 및 `generateMetadata` 함수를 활용합니다.
  - *Rationale*: App Router 구조에 완벽하게 호환되며, 별도의 라이브러리 의존성을 추가할 필요가 없습니다.
- **메타데이터 Fallback 체인**: `description`의 경우 이전 코드 정리 시 작업한 `description ?? summary ?? excerpt` 로직을 재사용합니다.
  - *Rationale*: 데이터 소스(마크다운 Frontmatter)의 구조를 수정하지 않고도 안전하게 메타 태그를 생성할 수 있습니다.

## Risks / Trade-offs

- [Risk] 빌드 타임에 모든 글의 메타데이터를 파싱하여 생성하므로 빌드 속도가 소폭 느려질 수 있음
  → *Mitigation*: 블로그 글의 개수가 수천 개 단위가 아니므로 현재 수준에서는 성능에 미치는 영향이 미미합니다. SSG 캐시를 적극 활용합니다.
