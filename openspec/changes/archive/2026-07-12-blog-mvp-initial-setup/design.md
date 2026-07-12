## Context
현재 4GB 메모리 제약이 있는 클라우드 인스턴스를 사용하여 개발 기술 블로그를 운영하고자 합니다. 향후 Kotlin + Spring Boot 백엔드를 연동하는 "백엔드 실험실"로 진화할 예정이므로, 처음부터 프론트엔드와 백엔드의 물리적 경계(Static Client ⇄ API Server)를 명확히 하고, 4GB 메모리를 효율적으로 아낄 수 있는 인프라 구조를 설계해야 합니다.

## Goals / Non-Goals

**Goals:**
- Next.js 15 정적 빌드(Static Export, `output: 'export'`)를 활용한 완전 정적 마크다운 블로그 구축
- GitHub Actions CI 환경에서 HTML/CSS/JS 및 Nginx가 포함된 경량 Docker 이미지 빌드
- 4GB VPS 서버에 Traefik 역방향 프록시를 띄워 자동 HTTPS(SSL/TLS) 라우팅 설정
- 로컬 환경은 Docker 없이 Node.js 네이티브(`npm run dev`)로 가볍고 빠르게 실행

**Non-Goals:**
- Next.js Node.js Standalone 서버 운영 (메모리 낭비 방지를 위해 제외)
- 로컬 개발 환경에서의 Traefik 및 Let's Encrypt SSL 세팅 (로컬은 HTTP로만 테스트)
- Spring Boot 백엔드 및 DB 구축 (Phase 2로 완전히 미룸)
- pnpm/npm Workspaces 등 모노레포 관리 도구 도입 (단순 독립 폴더로 충분)

## Decisions

1. **Repository Structure**: 단순 폴더 분리형 구조 (`frontend/`, `backend/`, `content/`)
   - 대안: pnpm workspaces
   - 이유: 백엔드가 Kotlin 기반이므로 프론트엔드와 코드를 공유할 일이 전혀 없어, 복잡한 워크스페이스 도구는 오버엔지니어링임.

2. **Frontend Framework & Styling**: Next.js 15 + Tailwind CSS v4 + Node.js 22 LTS
   - 대안: Next.js 14 + Tailwind v3
   - 이유: Tailwind v4의 CSS-first 방식을 통해 `tailwind.config.js` 설정 파일을 제거하고 가장 최신의 간결한 스택을 유지.

3. **Rendering & Deploy Strategy**: Static Export + GitHub Actions + VPS Nginx
   - 대안: Next.js Standalone Docker Container
   - 이유: Next.js Node 서버를 상시 구동하면 150MB~200MB 메모리가 낭비됨. Nginx로 정적 파일만 서빙 시 메모리 점유율을 10MB 이하로 낮출 수 있음. 또한 빌드 작업이 GitHub Actions에서 수행되므로 4GB 서버 OOM 리스크 제거.

4. **Local vs Prod Environment**: 로컬 Native 실행, 운영만 Docker Compose + Traefik
   - 대안: 로컬에서도 Docker Compose로 Traefik 가동
   - 이유: 로컬 환경에서는 도메인이 없어 Let's Encrypt SSL 발급이 불가능하므로, 로컬은 Native로 띄워 빠르게 개발하고 Traefik 세팅은 운영 서버 배포 단계로 단일화함.

5. **Markdown Parser & Highlighter**: gray-matter + remark/rehype + rehype-pretty-code (Shiki)
   - 대안: rehype-highlight (Highlight.js)
   - 이유: Shiki는 빌드 시 메모리를 다소 점유하지만, GitHub Actions(7GB RAM 제공)에서 정적 빌드가 일어나므로 메모리 오버헤드가 없음. 결과물은 고품질의 코드 테마를 띄워 가독성을 극대화함.

6. **CI/CD Pipeline & Registry**: GitHub Actions + GitHub Container Registry (GHCR)
   - 대안: VPS 내부에서 직접 빌드 및 Git Pull 배포
   - 이유: 4GB VPS 리소스 보호를 위해 빌드는 GitHub Actions 무료 러너를 이용하며, 보안 및 무료 저장 공간 제공을 위해 GitHub 공식 이미지 저장소(GHCR)를 활용하여 정적 웹 컨테이너를 안전하게 관리함.

7. **Traefik Configuration**: Docker Compose Command 인수 방식 설정
   - 대안: 별도의 `traefik.yml` 마운트
   - 이유: 파일 마운트 방식은 경로 오류가 잦고 관리 포인트가 늘어남. Docker Compose 서비스의 `command` 인수에 ACME 및 엔트리포인트를 직접 정의하여 단일 파일로 배포 설정을 단순화함.

## Risks / Trade-offs
- [Risk] 정적 배포(`output: 'export'`) 시 Next.js의 Dynamic routing, middleware 등 서버 기능 사용 불가능.
  → [Mitigation] 본 프로젝트의 목적은 '백엔드 실험실'로 동적 비즈니스 로직(조회수, 좋아요 등)은 Next.js가 아닌 Spring Boot 백엔드가 전담하도록 설계하여 프론트엔드의 제약을 자연스럽게 극복함.
- [Risk] 글(마크다운) 추가 시 매번 GitHub Actions 빌드 및 서버 Nginx 이미지 교체가 일어나 배포에 수 분이 소요됨.
  → [Mitigation] 개인 블로그 특성상 글 게시 주기가 초 단위로 빠르지 않으므로, 2~3분 내외의 배포 시간은 충분히 감내 가능함.
