## 1. 마크다운 유틸리티 개발

- [x] 1.1 `lib/markdown.ts` 파일 생성 및 `fs`를 이용한 마크다운 파일 읽기/목록 가져오기 함수 구현
- [x] 1.2 `gray-matter`를 사용하여 Frontmatter 데이터 파싱 및 `zod`를 활용한 필수 스키마(title, date 등) 유효성 검증 로직 추가
- [x] 1.3 `remark`, `rehype` 파이프라인 구성 (`rehype-pretty-code` 활용한 코드 하이라이팅 및 `rehype-slug`를 활용한 헤딩 ID 추출 포함) 로직 구현
- [x] 1.4 유틸리티를 테스트할 수 있는 더미 마크다운 포스트 및 정적 이미지 추가 (`content/posts/hello-world.md`, `public/images/posts/hello-world/test.webp`)
- [x] 1.5 빌드 시 마크다운 내부 이미지 경로 및 폴더명 slug 일치 여부, WebP 포맷 강제 검증 스크립트 작성

## 2. 메인 페이지 (피드) UI 및 기능 개발

- [x] 2.1 앱 라우터의 `app/page.tsx`에서 마크다운 목록을 가져오도록 로직 연동
- [x] 2.2 메인 페이지에 블로그 피드(글 제목, 날짜, 썸네일 이미지 등)를 나타내는 리스트 UI 컴포넌트 개발
- [x] 2.3 다크/라이트 모드 지원을 위한 테마 토글 버튼 컴포넌트(Header) 추가 및 CSS 세팅
- [x] 2.4 태그 필터링 UI 및 상태 관리 로직 임시 구현 (추후 고도화 대비)

## 3. 상세 페이지 UI 및 기능 개발

- [x] 3.1 `app/posts/[slug]/page.tsx` 동적 라우팅 파일 생성
- [x] 3.2 `generateStaticParams` 함수를 사용하여 빌드 타임에 정적 경로 생성 로직 구현
- [x] 3.3 상세 페이지 렌더링 로직 연동 (`dangerouslySetInnerHTML` 활용하여 파싱된 HTML 출력)
- [x] 3.4 Shiki 코드 블록 상단에 언어명(Language badge) 및 '복사(Copy)' 버튼 UI를 추가하고 클라이언트 측에서 클립보드 복사가 동작하도록 구현 (useEffect DOM 조작 또는 React 파서 활용)
- [x] 3.5 본문 이미지(`<img>` 태그)가 화면 너비에 맞게 반응형으로 나오도록 글로벌 CSS 추가
- [x] 3.6 우측 고정형 TOC(목차) 컴포넌트 마크업 개발 및 파서단에서 추출한 헤딩 데이터를 연동하여 스크롤 네비게이션 구현

## 4. 검증 및 디버깅

- [x] 4.1 로컬 개발 서버(`npm run dev`)에서 라이트/다크 모드 및 코드 하이라이팅이 정상 적용되는지 확인
- [x] 4.2 로컬에서 더미 이미지가 마크다운 내부에서 정상 로드되는지 확인
- [x] 4.3 정적 빌드(`npm run build`) 시 에러가 발생하지 않는지 검증
