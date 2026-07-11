## 1. 프로젝트 초기 구조 세팅

- [ ] 1.1 최상위에 `frontend/`, `backend/`, `content/posts/` 독립 디렉토리 구성 (모노레포 도구 없이 단순 분리)
- [ ] 1.2 `frontend/` 경로에서 Next.js 15 (App Router, TS) 프로젝트 초기화
- [ ] 1.3 `frontend/`에 Tailwind CSS v4 세팅 (`app/globals.css`에 `@import "tailwindcss";` 적용 및 PostCSS/Vite 플러그인 연결)
- [ ] 1.4 `frontend/next.config.ts` 파일에 `output: "export"` 옵션을 추가하여 정적 빌드(Static Export) 모드 활성화

## 2. 디자인 및 UI 기본 세팅

- [ ] 2.1 전역 색상, 폰트 등 초기 디자인(feed.png, details.png)에 맞춘 Tailwind v4 `@theme` CSS 변수 설정
- [ ] 2.2 공통 Layout 컴포넌트(네비게이션 헤더, 푸터) 구현 (로컬 `npm run dev`로 동작 확인)
- [ ] 2.3 UI 컴포넌트(게시글 피드 카드, 태그 목록) 마크업 구현

## 3. 블로그 마크다운 렌더링 (blog-rendering)

- [ ] 3.1 `gray-matter`, `remark`, `rehype` 및 `rehype-pretty-code` (Shiki) 의존성 추가
- [ ] 3.2 `content/posts/` 폴더 내 마크다운 파일을 파싱하여 정적 HTML로 변환하는 유틸리티 코드 구현
- [ ] 3.3 피드 페이지(`/`)에 게시글 정적 목록 렌더링 연동
- [ ] 3.4 상세 페이지(`/posts/[slug]`) 동적 세그먼트 생성(`generateStaticParams` 활용) 및 마크다운 본문 파싱 및 Shiki 하이라이팅 적용
- [ ] 3.5 로컬에서 `next build` 명령을 실행해 `out/` 폴더에 완전한 정적 HTML 파일들이 잘 생성되는지 검증

## 4. 인프라 및 배포 세팅 (deployment-infrastructure)

- [ ] 4.1 `frontend/`에 빌드된 `out/` 결과물을 가볍게 서빙하기 위한 Nginx 기반 `Dockerfile` 작성
- [ ] 4.2 최상위 디렉토리에 `docker-compose.yml` 생성 및 Nginx 프론트엔드 서비스 정의
- [ ] 4.3 `docker-compose.yml`에 Traefik 컨테이너 정의 추가 및 글로벌 옵션(포트 80/443 매핑, Let's Encrypt ACME 프로바이더 설정) 기술
- [ ] 4.4 Next.js Nginx 컨테이너에 도메인 라우팅 및 SSL 자동 연동을 위한 Docker Label 지정
- [ ] 4.5 `.github/workflows/deploy.yml` 파일 작성 (GitHub Actions에서 빌드, GHCR 이미지 푸시, 운영 VPS 서버 SSH 접속 후 컨테이너 재기동 자동화)
- [ ] 4.6 로컬 환경에서 Next.js 빌드 후 Nginx Docker 이미지 빌드 및 단독 실행 테스트 (포트 80/HTTP 기반)
