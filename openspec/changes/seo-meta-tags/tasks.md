## 1. 전역 메타데이터 기본 설정

- [x] 1.1 `frontend/app/layout.tsx`에 `metadata` 객체 정의 (사이트 이름, 기본 설명, 사이트 URL 등)
- [x] 1.2 `frontend/app/layout.tsx`에 Open Graph 기본 속성 정의
- [x] 1.3 `frontend/app/layout.tsx`에 기본 트위터 메타 태그 정의

## 2. 동적 마크다운 페이지 메타데이터 처리

- [x] 2.1 `frontend/app/posts/[slug]/page.tsx`에 `generateMetadata` 함수 추가
- [x] 2.2 `generateMetadata`에서 `getPostMetadataBySlug`를 호출하여 개별 포스트 데이터 가져오기 로직 구현
- [x] 2.3 포스트의 `title`, `description`(`description ?? summary ?? excerpt` 사용), `thumbnail`을 파싱하여 동적 Metadata 반환 객체 구성
- [x] 2.4 동적 페이지의 Open Graph 및 Twitter 메타 태그가 개별 포스트 정보로 덮어씌워지도록 구성

## 3. 정적 페이지 추가 메타데이터 주입

- [x] 3.1 `frontend/app/page.tsx` 메인 페이지 고유의 `metadata` 설정 (Title 템플릿 사용 등)
- [x] 3.2 `frontend/app/about/page.tsx`가 존재한다면 고유 메타데이터 주입

## 4. 사이트맵 자동 생성 (옵션)

- [x] 4.1 `frontend/app/sitemap.ts` 생성 후 모든 정적 페이지 및 `getAllPosts` 데이터를 통해 사이트맵 URL 배열 동적 반환
- [x] 4.2 `frontend/app/robots.txt` 설정

## 5. 검증 및 테스트

- [x] 5.1 로컬 개발 서버 실행 후 소스보기/개발자도구에서 `<head>` 내 `title`, `meta name="description"`, `og:*` 태그 확인
- [x] 5.2 SSG 빌드(`npm run build`)가 정상 수행되며 정적 파일들에 알맞은 `<meta>`가 주입되어 있는지 확인
