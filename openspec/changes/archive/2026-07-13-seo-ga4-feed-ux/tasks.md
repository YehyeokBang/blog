## 1. GA4 연동

- [x] 1.1 `@next/third-parties` 패키지 설치 (`npm install @next/third-parties`)
- [x] 1.2 `frontend/app/layout.tsx`에 `GoogleAnalytics` 컴포넌트 추가 (`NEXT_PUBLIC_GA_ID` 환경 변수 조건부 렌더링)
- [x] 1.3 `.env.local` 예시 및 `.env.production`에 `NEXT_PUBLIC_GA_ID` 추가 (GitHub Actions secrets 활용)
- [x] 1.4 로컬 빌드 후 생성된 HTML에 GA 스크립트 태그가 포함/미포함되는지 검증

## 2. 파비콘 추가

- [x] 2.1 `frontend/app/favicon.ico` 파일 배치 (32×32 ICO 형식)
- [x] 2.2 로컬 dev 서버에서 브라우저 탭에 파비콘이 표시되는지 확인

## 3. OG 이미지 폴백 및 기본 이미지

- [x] 3.1 `frontend/public/images/og-default.webp` 기본 폴백 이미지 배치 (1200×630, 블로그 브랜드 이미지)
- [x] 3.2 `frontend/app/posts/[slug]/page.tsx`의 `generateMetadata`에서 `thumbnail` 없을 때 `/images/og-default.webp`를 OG/트위터 이미지로 사용하도록 수정
- [x] 3.3 `thumbnail`이 있는 포스트와 없는 포스트 각각의 빌드 결과 HTML에서 `og:image` 메타 태그 값 검증

## 4. JSON-LD Article 구조화 데이터

- [x] 4.1 `frontend/app/posts/[slug]/page.tsx`에 `Article` 타입 JSON-LD `<script>` 태그 삽입 로직 추가 (`headline`, `datePublished`, `author`, `description`, `image`, `url` 필드)
- [x] 4.2 JSON 직렬화 시 XSS 방지 및 파싱 에러 예방을 위해 `JSON.stringify(data).replace(/</g, '\\u003c')`와 같이 안전한 이스케이프 처리 적용
- [x] 4.3 JSON-LD의 `image` 필드에 `thumbnail` 폴백 로직 적용 (OG 이미지와 동일한 폴백 경로 사용)
- [x] 4.4 빌드 결과 HTML에서 JSON-LD 스크립트 태그의 구조와 값 검증

## 5. 피드 카드 썸네일 렌더링

- [x] 5.1 `frontend/components/PostList.tsx`에서 `thumbnail`이 있는 포스트의 카드 우측에 썸네일 이미지 렌더링 추가 (수평 레이아웃: 텍스트 좌 + 이미지 우)
- [x] 5.2 썸네일 이미지에 `object-fit: cover` 및 고정 크기 스타일 적용, `rounded` 처리. 단, 모바일 해상도(Tailwind `sm` 미만)에서는 썸네일을 `hidden` 처리하여 텍스트 가독성 확보.
- [x] 5.3 썸네일이 없는 포스트는 기존 텍스트 전용 레이아웃 유지 확인

## 6. 피드 카드 클릭 영역 확대

- [x] 6.1 PostList 카드의 `<article>`에 `position: relative` 적용
- [x] 6.2 제목 `<Link>`에 `::after` pseudo-element로 카드 전체 영역을 덮는 투명 오버레이 추가 (`position: absolute; inset: 0`)
- [x] 6.3 태그 `<button>`에 `position: relative; z-index: 1` 적용하여 오버레이 위에서 독립 클릭 동작 보장
- [x] 6.4 카드 영역 클릭 시 상세 페이지로 이동하고, 태그 버튼 클릭 시 필터링만 동작하는지 검증

## 7. 최종 검증

- [x] 7.1 `npm run build` 성공 확인 (SSG 빌드 에러 없음)
- [x] 7.2 로컬 dev 서버에서 전체 기능 통합 확인 (GA 스크립트, 파비콘, JSON-LD, OG 이미지, 피드 UI)
