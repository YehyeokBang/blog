# 기술 아키텍처

## 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|-----------|
| **Frontend** | Next.js (TypeScript, React) | SSR/SSG로 SEO 최강. 프론트엔드 처음이지만 가장 실용적 |
| **Backend** | Kotlin + Spring Boot | 가장 익숙한 기술 스택. 백엔드 실험실 목적 |
| **Database** | SQLite (MVP) → PostgreSQL (확장 시) | 4GB 메모리 제약. SQLite는 별도 프로세스 불필요 |
| **배포** | Docker Compose | 프론트/백엔드/DB 컨테이너 분리 |
| **트래킹** | GA4 + Firebase Analytics | 이벤트, 이탈률, 스크롤 깊이 등 분석 |
| **CI/CD** | GitHub Actions | 이미 사용 중인 인프라 |

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
| Next.js | ~256MB | 빌드 시에만 메모리 소모 크고, 서빙은 경량 |
| DB (SQLite) | 별도 프로세스 없음 | 라이브러리로 동작 |
| OS + 기타 | ~512MB | |
| **여유분** | ~1.5GB~2GB | |

> **대안**: Next.js를 SSG로 빌드 후 Nginx로 정적 서빙하면 Node.js 프로세스 불필요 → 메모리 더 절약 가능. MVP에서는 우선 Next.js standalone으로 시작하고, 메모리 부족 시 전환 고려.

## 모노레포 구조

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
