# 기능 로드맵

## Phase 1 — MVP (프로토타입)

프론트엔드 중심. 백엔드 없이 Markdown SSG로 동작하는 블로그.

- 글 목록 페이지 (피드형, 최신순)
- 글 상세 페이지 (Markdown 렌더링, TOC, 코드 하이라이팅)
- 태그 필터링
- 다크/라이트 모드
- SEO 최적화 (메타 태그, OG 이미지, sitemap.xml)
- GA4 연동 (기본 페이지뷰 트래킹)
- 반응형 디자인 (모바일/태블릿/데스크탑)
- Docker 기반 배포

## Phase 2 — 백엔드 실험실

Kotlin + Spring Boot 백엔드 추가. 동적 기능을 직접 구현하며 배우는 단계.

- 조회수 트래킹 API (동시성 고려)
- 검색 API (제목/본문 전문 검색)
- 좋아요 API (비회원, IP/쿠키 기반)
- Firebase Analytics 연동 (이벤트, 이탈률, 스크롤 깊이)
- 시리즈 그룹핑 & 네비게이션
- 관련 글 추천
- RSS 피드

## Phase 3 — 고도화

- 글 작성 웹 에디터 (Markdown WYSIWYG)
- 댓글 기능 (GitHub 기반 또는 자체 구현)
- 이미지 업로드 & CDN
- Velog 글 마이그레이션 도구
- A/B 테스트 (제목, 레이아웃 등)

---

# Markdown 콘텐츠 관리

## 디렉토리 구조 (현상 유지안)

```
content/
└── posts/
    ├── 2025-01-15-query-optimization.md
    └── 2025-02-01-view-count-concurrency.md

frontend/
└── public/
    └── images/
        └── posts/
            └── 2025-01-15-query-optimization/
                └── explain-result.png
```

## Frontmatter 형식

```yaml
---
title: "우리 팀은 이렇게 쿼리를 개선했어요"
description: "쿼리 개선이 처음인 보따리 팀이 1.39초 쿼리를 0.0001초로 만든 이야기"
date: 2025-01-15
tags: [Java, JPA, Database, 쿼리 최적화]
thumbnail: /images/posts/2025-01-15-query-optimization/thumbnail.png
draft: false
---
```

## Velog 마이그레이션 전략

기존 42개 글을 위 구조로 이관할 때의 절차:

1. Velog API 또는 스크래핑으로 Markdown + 이미지 추출
2. Frontmatter 형식에 맞게 변환
3. 이미지를 로컬로 다운로드 → 상대 경로로 변경
4. Git 저장소에 커밋

---

# 결정 사항 및 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| **도메인** | 확보 완료 | `blog.yehyeok.xyz` 운영 중 |
| **DB 선택 (SQLite vs PostgreSQL)** | SQLite로 시작 | Phase 2에서 뷰 카운트 등 API 구현 시 사용 |
| **Velog 동시 운영 전략** | 신규 블로그 정본 | Velog 인기글은 요약 및 링크 처리, 신규 글은 새 블로그에만 작성 |
| **분석 도구** | GA4 | 업계 표준 경험 목적. Phase 2 이후 실험실에서 타 도구 교체/병행 고려 |
