# Page Heading Rhythm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아티클·소개 페이지 제목과 소개 페이지의 경력·활동 섹션에 일관된 간격과 명확한 제목 위계를 적용한다.

**Architecture:** 새 컴포넌트나 CSS 토큰을 만들지 않고 기존 Tailwind theme 토큰을 각 semantic heading과 섹션 컨테이너에 직접 적용한다. 페이지 제목은 동일한 규칙을 공유하고, 소개의 하위 섹션은 한 단계 작은 typography와 부모 `gap-section`으로 구분한다.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript

## Global Constraints

- `/private/tmp/blog-ui-consistency`의 `codex/unify-page-headers` 브랜치에서만 수정한다.
- 페이지 제목 다음 콘텐츠까지의 간격은 `mb-lg` 24px이다.
- 소개, 경력, 활동의 주요 구획 간격은 `gap-section` 80px이다.
- 새 컴포넌트, 새 CSS 토큰, 카드, 배경 surface, 추가 구분선을 만들지 않는다.
- 콘텐츠와 `content/posts/` 파일은 수정하지 않는다.
- CSS class만 조정하므로 로직 회귀 테스트는 추가하지 않는다.
- 사용자의 요청에 따라 브라우저 QA는 수행하지 않는다.

---

### Task 1: 페이지 제목과 소개 섹션 리듬 통일

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/about/page.tsx`
- Modify: `docs/design.md`

**Interfaces:**
- Consumes: `globals.css`의 `text-display-md`, `text-display-lg`, `text-title-lg`, `spacing-lg`, `spacing-section` 토큰
- Produces: 아티클·소개 `h1`의 공통 24px 콘텐츠 간격과 경력·활동 `h2`의 하위 시각 위계

- [x] **Step 1: 아티클 페이지 제목 간격을 명시한다**

`frontend/app/page.tsx`의 제목을 다음 class로 변경한다.

```tsx
<h1 className="text-display-md md:text-display-lg font-extrabold text-ink tracking-tight leading-tight mb-lg">
  아티클
</h1>
```

- [x] **Step 2: 소개 페이지 제목과 주요 섹션 간격을 통일한다**

`HistorySection`의 section margin을 제거하고 제목을 다음과 같이 변경한다.

```tsx
<section>
  <h2 className="text-title-lg md:text-display-md font-extrabold text-ink tracking-tight leading-tight mb-lg">
    {title}
  </h2>
```

소개 페이지 `h1`은 다음 class를 사용한다.

```tsx
<h1 className="text-display-md md:text-display-lg font-extrabold text-ink tracking-tight leading-tight mb-lg">
  소개
</h1>
```

연락처 목록의 `mb-section`을 제거하고, 두 `HistorySection`을 다음 부모로 감싼다.

```tsx
<div className="mt-section flex flex-col gap-section">
  <HistorySection title="경력" items={CAREERS} />
  <HistorySection title="활동" items={ACTIVITIES} />
</div>
```

- [x] **Step 3: 디자인 시스템 문서에 제목 리듬을 기록한다**

`docs/design.md`의 간격과 소개 섹션에 다음 규칙을 반영한다.

```markdown
- 페이지 제목은 mobile 28px, desktop 40px과 `leading-tight`를 사용하고 첫 콘텐츠와 24px 간격을 둔다.
- 소개의 경력·활동 제목은 mobile 22px, desktop 28px과 `leading-tight`를 사용한다.
- 소개, 경력, 활동의 주요 구획 사이는 80px, 섹션 제목과 첫 항목 사이는 24px로 통일한다.
```

- [x] **Step 4: 전체 자동 검증을 실행한다**

Run:

```bash
cd frontend
npm run lint
npm run test:content-refresh
npm run test:engagement
npm run test:scroll-ux
npm run build
```

Expected:

- ESLint exit code 0. 기존 `DetailItem` 미사용 경고 1개만 유지된다.
- 테스트 18개 통과, 실패 0개.
- Next.js static export build exit code 0.

- [x] **Step 5: 변경을 커밋한다**

```bash
git add frontend/app/page.tsx frontend/app/about/page.tsx docs/design.md docs/superpowers/plans/2026-07-24-page-heading-rhythm.md
git commit -m "fix: 페이지 헤더와 섹션 간격 통일"
```

### Task 2: 사용자 확인용 개발 서버 실행

**Files:**
- No file changes

**Interfaces:**
- Consumes: 검증이 끝난 `frontend` 소스
- Produces: 사용자가 직접 확인할 수 있는 localhost URL

- [x] **Step 1: 확인된 로컬 포트에서 개발 서버를 계속 실행되는 세션으로 시작한다**

Run:

```bash
cd frontend
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Expected: Next.js가 `Ready` 상태를 출력하고 `http://127.0.0.1:3000`을 제공한다.
