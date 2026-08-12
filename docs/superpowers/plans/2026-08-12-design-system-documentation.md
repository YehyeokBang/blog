# 디자인 시스템 문서 구조 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인 비전문가인 사용자와 AI 에이전트가 직관적으로 협업할 수 있는 최소 디자인 지침과 SEED 참고 기록을 만들고, 기존 문서 링크를 보존한다.

**Architecture:** `docs/design-system/README.md`를 프로젝트 디자인 원칙과 협업 방식의 단일 진입점으로 사용하고, `references/seed.md`에는 외부 근거와 채택 결정을 격리한다. `docs/design.md`는 과거 기록의 링크를 깨지 않기 위한 호환 안내로 유지하며, 실제 수치와 동작은 CSS와 컴포넌트를 정본으로 직접 연결한다.

**Tech Stack:** Markdown, Node.js 20 내장 test runner, Git

## Global Constraints

- 이번 작업에서 화면 UI, CSS 토큰, React 컴포넌트 동작을 변경하지 않는다.
- SEED React 또는 SEED CSS 토큰을 설치하지 않는다.
- SEED의 색상, 브랜드 자산, 제품 말투와 정보 구조 전체를 복제하지 않는다.
- 아직 사용하지 않는 SEED 컴포넌트를 프로젝트 요구사항으로 만들지 않는다.
- 디자인 전문 용어는 실제 크기, 간격, 색상, 위치와 사용자 효과로 번역한다.
- As-is와 To-be 비교는 의사결정에 도움이 될 때 로컬 화면이나 스크린샷으로 제공하며 문서 산출물로 강제하지 않는다.
- Git 커밋은 영문 Conventional Commit prefix와 한국어 설명을 사용한다.
- 현재 전체 문서 검사는 OpenSpec 인덱스 누락 3건 때문에 실패한다. 이 작업에 해당 수정은 섞지 않고, 새 실패가 추가되지 않았는지 별도로 확인한다.

---

## 파일 구조

### 생성

- `docs/design-system/README.md`: 프로젝트 디자인 원칙, 직관적 협업 방식, 작업별 AI 읽기 경로, 실제 구현 링크를 제공한다.
- `docs/design-system/references/seed.md`: SEED 공식 출처와 차용·변형·비채택 결정을 기록한다.

### 수정

- `docs/design.md`: 기존 상세 내용을 제거하고 새 진입점으로 연결하는 호환 안내로 바꾼다.
- `docs/README.md`: 활성 디자인 문서와 프론트엔드 시작점을 새 진입점으로 바꾼다.
- `AGENTS.md`: 문서 지도에서 디자인 작업의 진입점을 새 경로로 바꾼다.
- `frontend/AGENTS.md`: UI 작업 유형별 최소 읽기 경로와 직관적 소통 원칙을 추가한다.
- `frontend/README.md`: 프론트엔드 참고 문서 링크를 새 디자인 진입점으로 바꾼다.
- `scripts/check-documentation.mjs`: 활성 문서 목록에서 새 디자인 진입점을 검사한다.
- `scripts/check-documentation.test.mjs`: 호환 문서, 새 진입점, SEED 참고 문서의 연결을 회귀 테스트로 고정한다.

### 유지

- `docs/feed.png`, `docs/details.png`: 초기 시각 참고 자료로 그대로 둔다.
- 과거 계획, OpenSpec change, archive 문서: 기존 `docs/design.md` 링크를 수정하지 않는다.

---

### Task 1: 디자인 시스템 진입점과 SEED 참고 기록

**Files:**
- Create: `docs/design-system/README.md`
- Create: `docs/design-system/references/seed.md`
- Modify: `docs/design.md`
- Modify: `scripts/check-documentation.test.mjs`

**Interfaces:**
- Consumes: `frontend/app/globals.css`, 현재 `docs/design.md`, `docs/persona.md`, 승인된 설계 문서 `docs/superpowers/specs/2026-08-12-design-system-documentation-design.md`
- Produces: 모든 활성 문서와 에이전트 지침이 연결할 `docs/design-system/README.md`; 외부 참고가 필요할 때만 읽는 `docs/design-system/references/seed.md`; 과거 링크를 보존하는 `docs/design.md`

- [ ] **Step 1: 새 진입점의 필수 연결을 검증하는 실패 테스트 작성**

`scripts/check-documentation.test.mjs`에 다음 테스트를 추가한다.

```js
test("디자인 시스템 진입점과 호환 문서가 연결된다", () => {
    const compatibilityDocument = fs.readFileSync(path.join(repositoryRoot, "docs/design.md"), "utf8");
    const designSystemDocument = fs.readFileSync(
        path.join(repositoryRoot, "docs/design-system/README.md"),
        "utf8",
    );

    assert.match(compatibilityDocument, /\[현재 디자인 시스템\]\(design-system\/README\.md\)/);
    assert.match(designSystemDocument, /\[SEED 참고 기록\]\(references\/seed\.md\)/);
    assert.match(designSystemDocument, /frontend\/app\/globals\.css/);
    assert.match(designSystemDocument, /As-is/);
    assert.match(designSystemDocument, /To-be/);
});
```

- [ ] **Step 2: 테스트가 새 진입점 부재로 실패하는지 확인**

Run:

```bash
node --test --test-name-pattern="디자인 시스템 진입점" scripts/check-documentation.test.mjs
```

Expected: FAIL with `ENOENT` for `docs/design-system/README.md`.

- [ ] **Step 3: `docs/design-system/README.md` 작성**

다음 책임을 가진 절을 작성한다.

```markdown
# 디자인 시스템

## 목적과 범위
## 정본과 판단 권한
## 디자인 방향
## 기초 원칙
### 색상과 상태
### 타이포그래피와 긴 글
### 간격과 레이아웃
### 상호작용과 접근성
## 현재 사용하는 UI 선택 기준
### 버튼과 아이콘 버튼
### 필터 Chip과 정보 Tag
### 입력과 오류
### 로딩과 피드백
## UI 문구 원칙
## 사용자와 디자인을 논의하는 방법
### 현재 모습 → 바꿀 모습 → 사용자 효과
### As-is / To-be 비교 기준
### 직관적인 피드백을 구체화하는 방법
## AI 작업별 읽기 경로
## 실제 구현 위치
## 변경 체크
## 문서 분할 조건
## 외부 참고
```

작성 시 다음 내용을 명시한다.

- 현재 값과 실제 동작은 [`frontend/app/globals.css`](../../frontend/app/globals.css)와 대상 컴포넌트가 정본이다.
- 디자인 원칙은 이 문서, 승인된 동작 요구사항은 관련 OpenSpec, 게시글 문체는 [`docs/persona.md`](../persona.md)가 정본이다.
- 코드와 원칙이 다르면 문서를 자동으로 코드에 맞추지 않고 의도된 변경인지 구현 누락인지 확인한다.
- 사용자의 “줄여줘”, “키워줘”, “답답해”, “너무 튀어”, “뭔가 어색해”를 유효한 피드백으로 취급하고 글자 크기·너비·여백·대비·정렬 후보로 번역한다.
- 시각적 판단이 필요한 경우 로컬 화면이나 스크린샷으로 As-is / To-be를 비교한다.
- 버튼·오류·빈 상태 같은 UI 문구와 게시글 본문의 문체 범위를 분리한다.
- SEED 참고 기록은 평상시 필독이 아니며 새로운 UI 패턴을 검토할 때만 읽는다.
- 실제 공용 UI primitive 5개 이상, 반복 패턴 증가, 문서 300줄 초과 등 설계 문서의 분할 조건을 그대로 기록한다.
- 외부 참고 절에서 `[SEED 참고 기록](references/seed.md)`으로 연결한다.

- [ ] **Step 4: `docs/design-system/references/seed.md` 작성**

다음 구조와 공식 링크를 사용한다.

```markdown
# SEED 참고 기록

- 출처: [SEED](https://seed-design.io/)
- 저장소: [daangn/seed-design](https://github.com/daangn/seed-design)
- 마지막 확인일: 2026-08-12

## 참고 목적
## 차용하는 원칙
## 프로젝트에 맞게 변형하는 원칙
## 채택하지 않는 항목
## 다시 검토하는 조건
## 확인한 공식 문서
```

공식 문서에는 최소한 다음 링크를 기록한다.

- `https://seed-design.io/foundations/design-token`
- `https://seed-design.io/foundations/color`
- `https://seed-design.io/foundations/typography`
- `https://seed-design.io/foundations/inclusive-design`
- `https://seed-design.io/foundations/voice-and-tone`
- `https://seed-design.io/foundations/writing`
- `https://seed-design.io/components/action-button`
- `https://seed-design.io/components/chip`
- `https://seed-design.io/components/tag-group`
- `https://seed-design.io/patterns/loading`

차용 항목에는 역할 기반 토큰, 제한된 간격 스케일, 컴포넌트 역할 구분, 접근성, 명확한 문구, 로딩 시간에 따른 피드백을 포함한다. 변형 항목에는 민트 브랜드 색 유지, 차분한 개인 기술 블로그 말투, 기존 Tailwind 토큰 유지가 포함된다. 비채택 항목에는 SEED 패키지 설치, 당근 색상·말투·브랜드 자산, 앱 전용 navigation·sheet 구조, 아직 필요하지 않은 컴포넌트를 포함한다.

- [ ] **Step 5: `docs/design.md`를 호환 안내로 축소**

과거 링크를 유지하도록 다음 내용만 남긴다.

```markdown
# 디자인 시스템

현재 디자인 원칙과 작업 지침은 [현재 디자인 시스템](design-system/README.md)으로 이동했습니다.

이 파일은 과거 계획, OpenSpec, 아카이브 문서의 기존 링크를 보존하기 위해 유지합니다. 현재 UI 값과 실제 동작은 새 디자인 시스템 문서가 안내하는 코드 위치를 기준으로 확인합니다.
```

- [ ] **Step 6: 새 진입점 테스트와 상대 링크 검사 실행**

Run:

```bash
node --test --test-name-pattern="디자인 시스템 진입점" scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
```

Expected:

- 새 진입점 테스트: PASS.
- 전체 문서 검사: 기존 OpenSpec 인덱스 누락 3건만 보고하고, `docs/design-system/**` 또는 `docs/design.md` 관련 오류는 없음.

- [ ] **Step 7: Task 1 커밋**

```bash
git add docs/design.md docs/design-system/README.md docs/design-system/references/seed.md scripts/check-documentation.test.mjs
git commit -m "docs: 디자인 시스템 진입점과 SEED 참고 기록 추가"
```

---

### Task 2: 사람과 AI의 작업별 진입 경로 연결

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/README.md`
- Modify: `frontend/AGENTS.md`
- Modify: `frontend/README.md`

**Interfaces:**
- Consumes: Task 1의 `docs/design-system/README.md`
- Produces: 저장소 전체, 문서 인덱스, 프론트엔드 작업에서 발견 가능한 디자인 진입점과 최소 읽기 규칙

- [ ] **Step 1: 최상위 문서 지도 변경**

`AGENTS.md`의 기존 항목을 다음 의미로 바꾼다.

```markdown
- `docs/design-system/README.md` — 디자인 원칙, UI 선택 기준, 직관적 협업 방식과 작업별 읽기 경로
```

외부 SEED 참고 문서를 모든 작업의 필독으로 추가하지 않는다.

- [ ] **Step 2: `docs/README.md` 활성 문서와 역할별 시작점 변경**

활성 문서 표의 디자인 시스템 링크를 `design-system/README.md`로 바꾸고 역할을 다음처럼 설명한다.

```markdown
| [디자인 시스템](design-system/README.md) | 디자인 원칙, UI 선택 기준, 협업 방식과 구현 정본 안내 |
```

프론트엔드 시작점의 디자인 시스템 링크도 같은 경로로 바꾼다. 호환용 `design.md`는 활성 문서 표에 별도 추가하지 않는다.

- [ ] **Step 3: `frontend/AGENTS.md`에 UI 작업 라우팅 추가**

문서 상단의 Next.js 안내 다음에 `## UI 작업 전 확인` 절을 추가한다.

```markdown
## UI 작업 전 확인

- 색상·타이포그래피·간격 변경: `docs/design-system/README.md`의 기초 원칙과 `frontend/app/globals.css`
- 기존 화면 동작 변경: 관련 OpenSpec과 대상 컴포넌트
- 버튼·필터·입력 UI 추가: 디자인 시스템의 UI 선택 기준과 대상 컴포넌트
- 버튼·오류·빈 상태 문구 변경: 디자인 시스템의 UI 문구 원칙과 `docs/persona.md`
- 새 UI 패턴 비교: `docs/design-system/references/seed.md`와 관련 공식 문서

사용자에게 디자인 전문 용어만으로 설명하지 않는다. 현재 모습, 바꿀 모습, 사용자에게 생기는 효과 순서로 설명하고, 시각적 판단이 필요하면 로컬 화면이나 스크린샷으로 As-is와 To-be를 비교한다.
```

경로는 `frontend/AGENTS.md`의 위치를 고려해 `../docs/...` 형식의 Markdown 링크로 작성한다. 백엔드나 게시글 콘텐츠 작업에는 이 읽기 경로를 적용하지 않는다.

- [ ] **Step 4: `frontend/README.md` 링크 갱신**

기존 `[디자인 시스템](../docs/design.md)` 링크를 `[디자인 시스템](../docs/design-system/README.md)`으로 바꾼다.

- [ ] **Step 5: 활성 문서 연결 검사**

Run:

```bash
rg -n "design-system/README\.md|design\.md" AGENTS.md docs/README.md frontend/AGENTS.md frontend/README.md
node scripts/check-documentation.mjs
```

Expected:

- 네 활성 진입점은 `design-system/README.md`를 가리킴.
- `docs/design.md`는 호환 문서 자체 또는 과거 기록에서만 사용됨.
- 전체 문서 검사는 기존 OpenSpec 인덱스 누락 3건 외에 새 상대 링크 오류가 없음.

- [ ] **Step 6: Task 2 커밋**

```bash
git add AGENTS.md docs/README.md frontend/AGENTS.md frontend/README.md
git commit -m "docs: 디자인 작업별 문서 라우팅 연결"
```

---

### Task 3: 활성 문서 검사 전환과 최종 검증

**Files:**
- Modify: `scripts/check-documentation.mjs`
- Modify: `scripts/check-documentation.test.mjs`

**Interfaces:**
- Consumes: Task 1의 새 디자인 진입점과 Task 2의 `docs/README.md` 활성 링크
- Produces: 새 디자인 진입점의 존재와 인덱스 도달성을 검사하는 문서 검증 계약

- [ ] **Step 1: 활성 문서 목록을 새 진입점으로 변경**

`scripts/check-documentation.mjs`의 `activeDocuments`에서 다음 한 줄만 교체한다.

```js
// Before
"docs/design.md",

// After
"docs/design-system/README.md",
```

호환용 `docs/design.md`는 전체 상대 링크 검사 대상에는 계속 포함되지만 활성 문서 인덱스의 정본으로 요구하지 않는다.

- [ ] **Step 2: 전체 검사에서 새 디자인 관련 실패가 없는지 확인**

Run:

```bash
node --test scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
```

Expected: 두 명령 모두 기존 OpenSpec 인덱스 누락 3건 때문에 실패할 수 있으나, 오류 집합에 다음 문자열은 없어야 한다.

```text
docs/design-system/README.md
docs/design-system/references/seed.md
docs/design.md
깨진 상대 링크
```

- [ ] **Step 3: 기존 기준선과 현재 오류 집합을 기계적으로 비교**

다음 명령으로 현재 오류가 알려진 세 항목뿐인지 확인한다.

```bash
node scripts/check-documentation.mjs 2>&1 | sed -n 's/^- //p'
```

Expected exact set:

```text
활성 문서 인덱스 오류: openspec/README.md가 openspec/specs/ai-security/spec.md를 링크해야 합니다
활성 문서 인덱스 오류: openspec/README.md가 openspec/specs/ai-summary-progress/spec.md를 링크해야 합니다
활성 문서 인덱스 오류: openspec/README.md가 openspec/specs/ai-summary/spec.md를 링크해야 합니다
```

항목이 추가되면 커밋하지 말고 해당 링크 또는 활성 문서 설정을 수정한다. 기존 세 항목을 이번 커밋에 추가로 고치지 않는다.

- [ ] **Step 4: 변경 범위와 UI 무변경 확인**

Run:

```bash
git diff --check
git diff --name-only main...HEAD
git diff -- frontend/app frontend/components frontend/lib frontend/package.json
```

Expected:

- `git diff --check`: exit 0.
- 변경 파일은 설계·계획 문서, 디자인 문서, 문서 인덱스, 에이전트 지침, 문서 검사기와 테스트뿐임.
- UI 코드와 의존성 diff는 비어 있음.

- [ ] **Step 5: Task 3 커밋**

```bash
git add scripts/check-documentation.mjs scripts/check-documentation.test.mjs
git commit -m "test: 디자인 시스템 활성 문서 검사 전환"
```

- [ ] **Step 6: 최종 상태 보고**

다음을 보고한다.

- 새 디자인 진입점과 SEED 참고 기록의 위치
- 사용자와의 직관적 디자인 소통 방식
- AI 작업별 읽기 경로
- 화면 UI와 의존성은 변경되지 않았다는 diff 근거
- 통과한 타깃 테스트와 `git diff --check`
- 전체 문서 검사는 기존 OpenSpec 인덱스 누락 3건만 남아 있다는 사실
