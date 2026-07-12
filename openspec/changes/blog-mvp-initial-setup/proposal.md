## Why

블로그 MVP를 빠르게 구축하고 배포하여 콘텐츠를 세상에 띄우기 위함입니다. 백엔드 등 "나중에 추가해도 되는 것"은 최대한 미루고, 비용이 저렴할 때 미리 결정해야 하는 아키텍처 뼈대(모노레포, 스타일링, 배포 환경)를 견고하게 잡는 것이 목적입니다. 

특히 4GB RAM 제약이 있는 클라우드 인스턴스 환경을 고려하여, Next.js의 정적 빌드(Static Export) 방식을 채택하여 최적의 성능과 메모리 효율을 달성하고자 합니다.

## What Changes

- **독립 폴더 모노레포 구조 세팅**: 최상위 루트 아래 `frontend/`, `backend/`, `content/` 독립 디렉토리 구성 (별도의 Workspace 패키지 설정 없음)
- **프론트엔드 모던 스택 초기화**: `frontend/`에 Next.js 15 (App Router), Tailwind CSS v4, Node.js 22 LTS 세팅
- **정적 빌드(Static Export) 설정**: Next.js 설정에 `output: "export"` 추가하여 빌드 타임에 마크다운을 완전한 HTML/CSS/JS로 컴파일
- **마크다운 렌더링 엔진 세팅**: `gray-matter`와 `remark`/`rehype` 파서 및 고품질 코드 하이라이팅을 위한 `rehype-pretty-code` (Shiki) 도입
- **자체 호스팅 배포 인프라**: GitHub Actions를 통한 정적 Nginx Docker 이미지 빌드 및 실 운영 VPS 배포, Traefik 역방향 프록시를 통한 HTTPS 자동 연동 (로컬은 Native 실행)

## Capabilities

### New Capabilities
- `blog-rendering`: Next.js 15 App Router 기반 마크다운 정적 파싱 및 피드/상세 페이지 SSG 렌더링. Shiki 테마 코드 하이라이팅 지원.
- `deployment-infrastructure`: GitHub Actions 빌드, Docker Compose 및 Traefik을 활용한 실서버 무중단 배포 및 자동 SSL 적용.

### Modified Capabilities
- 해당 없음

## Impact

- 프로젝트의 메인 뼈대가 확립되고 프론트엔드-백엔드 간의 아키텍처 경계(Static HTML ⇄ Spring Boot API)가 명확해집니다.
- 4GB VPS의 메모리 소모를 극도로 아낄 수 있습니다 (프론트엔드 점유율 <10MB).
- 빌드가 외부 서버(GitHub Actions)에서 수행되므로 로컬 및 VPS 서버의 OOM(Out of Memory) 위험이 사라집니다.
