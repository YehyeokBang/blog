# 기술 아키텍처

## 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|-----------|
| **Frontend** | Next.js (TypeScript, React) | SSR/SSG로 SEO 최강. 프론트엔드 처음이지만 가장 실용적 |
| **Backend** | Kotlin + Spring Boot | 가장 익숙한 기술 스택. 백엔드 실험실 목적 |
| **Database** | SQLite (MVP) → PostgreSQL (확장 시) | 4GB 메모리 제약. SQLite는 별도 프로세스 불필요 |
| **배포** | Docker Compose | 프론트/백엔드/DB 컨테이너 분리 |
| **트래킹** | GA4 + Firebase Analytics | 이벤트, 이탈률, 스크롤 깊이 등 분석 |
| **CI/CD** | GitHub Actions (Self-hosted Runner) | 보안을 위한 SSH 키 제거 및 배포 자동화 |

## 전체 구조

```
┌──────────────────────────────────────────────────────┐
│                    Docker Host (4GB)                  │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Frontend    │  │  Backend     │  │  DB         │ │
│  │  (Next.js)   │  │  (Kotlin +   │  │  (SQLite/   │ │
│  │              │←→│  Spring Boot)│←→│  PostgreSQL)│ │
│  │  SSR/SSG     │  │              │  │             │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│         ↑                  ↑                         │
│    Markdown 파일      메타데이터/조회수/검색           │
│    (Git 정본)         (Read Model)                   │
└──────────────────────────────────────────────────────┘
         ↑
    git push → Webhook/CI로 빌드 트리거
```

## 콘텐츠 관리: 하이브리드 CQRS 패턴

**핵심 결정**: Markdown 파일이 정본(Source of Truth), DB는 메타데이터/조회수/검색 인덱스 전용.

백엔드 비유:
- MD 파일 = Write Model (SSoT). `git`으로 관리하는 설정 파일처럼.
- DB = Read Model. 검색/조회수/좋아요 등 동적 데이터 전용.
- `git push` 시 웹훅으로 DB 동기화.

### 데이터 흐름

```
[Write Path]
작성자: IDE/에디터에서 MD 작성
  → Git Push
  → CI/CD: 빌드 트리거
  → Next.js: MD 파싱 + SSG 생성
  → Backend: MD 메타데이터 DB 동기화

[Read Path]
사용자 요청
  → Next.js: SSG 페이지 서빙 (글 본문)
  → Backend API: 조회수/좋아요 처리 (동적 데이터)
```

### 글 작성 워크플로우

MVP에서는 IDE(또는 노션 등)에서 Markdown을 작성하고 Git push로 배포한다.
웹 에디터는 Phase 3에서 고려한다.

## 인프라 제약

- **클라우드 인스턴스**: 약 4GB 메모리
- **도메인**: 아직 없음. 클라우드 인스턴스 IP로 우선 운영

### 메모리 배분 전략
| 컴포넌트 | 할당 | 비고 |
|----------|------|------|
| Spring Boot (JVM) | 512MB~768MB | `-Xmx768m`으로 제한 |
| Frontend (Nginx) | ~50MB | Next.js SSG 빌드 결과물을 정적 서빙 |
| Traefik | ~50MB | 리버스 프록시 및 자동 HTTPS (Let's Encrypt) |
| DB (SQLite) | 별도 프로세스 없음 | 라이브러리로 동작 |
| OS + 기타 | ~512MB | |
| **여유분** | ~2GB | |

> **결정 사항**: 서버 메모리 절약과 배포 속도 최적화를 위해 Next.js 서버를 띄우지 않고, **SSG(정적 사이트 생성) + Nginx** 방식을 채택했습니다. 앞단에는 **Traefik**을 두어 라우팅과 HTTPS 인증서 갱신을 완전히 자동화했습니다.

## 배포 파이프라인 (CI/CD)

보안을 강화하기 위해 외부(GitHub)에서 서버로 접근하는 SSH 방식을 폐기하고, 서버가 직접 작업을 가져가는 **GitHub Self-hosted Runner**를 도입했습니다.

1. **Build & Push (GitHub-hosted)**: 코드가 `main`에 머지되면 GitHub 환경에서 Next.js를 빌드하고 Nginx가 포함된 도커 이미지를 만들어 GHCR에 푸시합니다.
2. **Deploy (Self-hosted)**: Oracle Cloud VPS 내부에 상주하는 러너가 동작하여, 스스로 GHCR에서 이미지를 풀(Pull)하고 무중단으로 컨테이너를 재시작(`docker compose up -d`)합니다.


```
blog/ (Repository Root)
├── content/           ← Markdown 글 (정본)
│   └── posts/
├── frontend/          ← Next.js 앱
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── backend/           ← Kotlin + Spring Boot
│   ├── src/
│   ├── build.gradle.kts
│   └── Dockerfile
├── docker-compose.yml ← 전체 서비스 오케스트레이션
├── docs/              ← 프로젝트 문서
├── .github/           ← CI/CD, PR 템플릿
├── .agents/           ← AI Agent 가이드라인
└── AGENTS.md
```
