## Context

Next.js 기반의 빈 프로젝트와 배포 환경이 성공적으로 세팅되었습니다. 이제 블로그의 가장 근본적인 기능인 마크다운 문서를 파싱하여 화면에 보여주는 기능과 관련된 부수적인 처리(이미지 로드, 코드 하이라이팅)를 구현해야 합니다.
블로그 게시글은 DB에 저장되지 않고 `content/posts/` 하위의 마크다운 파일(.md)로 관리되며, 빌드 타임에 Next.js가 이를 읽어 정적 페이지(Static HTML)로 렌더링하는 SSG(Static Site Generation) 방식을 사용합니다.

## Goals / Non-Goals

**Goals:**
- `content/posts/` 폴더 내의 `.md` 파일을 읽고 Frontmatter(title, date 등)와 본문을 파싱하는 코어 유틸리티 작성
- 파싱된 데이터를 기반으로 메인 피드(목록) 및 상세 페이지 구현
- `shiki`를 활용하여 상세 페이지 내 코드 블록 하이라이팅 적용
- `public/images/` 에 저장된 정적 이미지를 마크다운에서 올바르게 참조하고 화면에 렌더링하도록 설정

**Non-Goals:**
- 검색, 좋아요, 조회수 등 백엔드 API 연동 기능 (이후 Phase에서 진행)
- 동적(Client-side) 이미지 업로드 도구 (이미지는 로컬에 직접 파일로 넣는 방식 유지)

## Decisions

1. **마크다운 파싱 생태계: remark & rehype & zod (순수 마크다운 우선)**
   - **Rationale**: Next.js 환경에서 가장 강력하고 유연한 마크다운 파싱 생태계인 Unified(remark/rehype)를 사용합니다. `gray-matter`로 메타데이터를 분리하고, **`zod`를 통해 Frontmatter 스키마(타입 안정성)를 강제 검증합니다.** 본문은 `remark-parse` -> `remark-rehype` -> `rehype-pretty-code`(shiki 기반) -> `rehype-stringify` 파이프라인을 거쳐 HTML 문자열로 최종 변환합니다. 커스텀 컴포넌트(MDX) 도입은 프론트엔드 복잡도를 낮추기 위해 MVP 스펙에서 제외합니다.
   
2. **코드 하이라이팅: rehype-pretty-code**
   - **Rationale**: `shiki` 기반으로 동작하여 빌드 타임에 아주 빠르고 정확하게 코드 스타일링을 인라인으로 처리합니다. 클라이언트 사이드 자바스크립트에 의존하지 않으므로 로딩 속도와 SEO 측면에서 완벽합니다.

3. **정적 이미지 서빙 경로: `public/images/posts/[slug]/` 및 엄격한 컨벤션 검증**
   - **Rationale**: `public/` 디렉토리에 위치한 파일들은 Next.js 앱 빌드 시 정적 자산으로 처리되어 루트 경로(`/`)에서 접근 가능합니다. 마크다운 안에서 `![설명](/images/posts/[slug]/img1.webp)` 와 같이 절대 경로를 사용합니다.
   - **Constraint**: 글 파일과 이미지 폴더가 분리되어 발생하는 파편화를 막기 위해, 빌드 파서(`lib/markdown.ts`) 단계에서 **(1) 마크다운 내부 이미지 경로의 slug 일치 여부**, **(2) WebP 확장자 강제 적용**을 정규식으로 엄격히 검사하고 위반 시 빌드를 즉시 실패(Fail-fast) 처리합니다.

## Risks / Trade-offs

- **빌드 타임 증가**: `rehype-pretty-code` 등 파싱 파이프라인은 정적 생성 시(빌드 시점) 약간의 컴퓨팅 파워를 요구합니다. 하지만 블로그 특성상 글이 수천 개 단위가 아니라면 빌드 속도 차이는 미미할 것으로 판단됩니다.
- **이미지 최적화 기능 제약**: `out` 방식의 Static Export 모드를 사용하고 있기 때문에, Next.js의 동적 이미지 최적화(`<Image />` 컴포넌트의 서버 사이드 리사이징)를 기본 설정으로는 사용할 수 없습니다. 따라서 마크다운 내에서는 일반 `<img>` 태그로 렌더링되는 것에 의존하며, 이미지 원본 크기를 적절히 압축해서 올리는 수동 관리가 필요합니다.
