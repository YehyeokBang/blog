# 프로젝트 종합 리뷰 리포트 (v2 — 적대적 재검증 반영판)

- 상태: 아카이브
- 아카이브 날짜: 2026-07-18
- 대체 문서: [문서 인덱스](../../README.md)

> 작성일: 2026-07-13 · 리뷰 기준 브랜치: `feature/seo-meta` (커밋 `90bb3dc`, `34f7856` 포함, main 미머지·미배포)
>
> **v2 안내**: v1 작성 후, 독립된 검증 에이전트 4개(문서/코드/인프라/SEO)가 v1의 모든 주장을 "반박 목적"으로 재검증했습니다.
> 그 결과 **오류 4건, 과장 6건을 정정**했고, v1이 놓친 **실질 이슈 12건**을 추가했습니다. 상세 판정은 §10 참조.
> 각 항목은 **근거 → 왜 문제인가 → 개선안 → 우선순위** 구조이며, 이 세션에서 프로젝트 코드/문서는 수정하지 않았습니다 (이 리포트 파일 제외).

---

## 0. TL;DR — 전체 평가

**한 줄 요약: 방향은 옳고 실행 품질도 신입 기준으로 좋다. 다만 (1) "fail-fast"라 믿었던 콘텐츠 검증이 실제로는 조용히 실패하는 구조이고, (2) 로컬 빌드 산출물에 localhost URL이 박혀 배포될 수 있는 경로가 열려 있으며, (3) 배포 정의 이중화·문서 드리프트가 진행 중이다.**

| 영역 | 평가 | 비고 |
|------|------|------|
| 아키텍처 방향 (MD 정본 + SSG + 백엔드 분리) | ✅ 타당 | 규모 대비 과설계 없음 |
| 작업 방식 (OpenSpec + GitHub Flow + Squash) | ✅ 타당 | 단, AGENTS.md에 이 흐름이 빠져 있음 |
| 지침서 체계 (AGENTS.md 등) | ⚠️ 구조 개선 필요 | 로딩 보장·디렉토리 이원화·문서 맵 부재 |
| 문서 정확성 | ⚠️ 드리프트 진행 중 | 문서 간 모순, 문서 vs 코드 불일치 다수 (§3) |
| CI/CD·인프라 | ⚠️ 동작하지만 취약 | compose 이중화, 캐시/보안 헤더 전무, PR CI 부재 (§4) |
| 프론트엔드 코드 | 🔶 구조는 양호, 검증은 허상 | **fail-fast가 아니라 fail-silent** — 핵심 정정 (§5.0) |
| SEO/운영 목표 달성도 | 🔶 진행 중 | seo-meta 커밋 완료·미배포, GA4/favicon/canonical 미착수 (§6) |

**종료 기준 판정**: 이 리포트의 P0~P1을 소진하면 남는 이슈는 "중간 레벨 이하"(기능 추가, 정리)입니다. 방향이 갈리는 결정 10건은 §9 인터뷰로 분리했습니다.

---

## 1. 현 위치 스냅샷 (2026-07-13 기준, 라이브 검증 포함)

### 1.1 완료된 것 (Phase 1 MVP 기준)

- **정적 블로그 코어**: Next.js 16 App Router + `output: "export"` SSG. 글 목록/상세/소개, 태그 필터, 다크·라이트 모드, TOC(현재 위치 하이라이트), Shiki 하이라이팅 + 복사 버튼, 읽는 시간.
- **콘텐츠**: `content/posts/*.md` 40개 (Velog 이관분 + 이관 이후 신규 작성분 혼재 — 예: `claude-code-rewind.md`는 2026-04-25 신규 글). 이미지는 WebP로 `frontend/public/images/posts/<slug>/`에 존재, 라이브 200 확인.
  - ~~v1의 "Velog 42개 중 40개 이관 완료"는 부정확~~ → 신규 글이 섞여 있어 이관 수는 40 미만. Velog 원본 42개 전부가 옮겨졌는지는 미확인 (§9 Q2와 연관).
- **배포 파이프라인**: main 푸시 → GitHub-hosted ARM 빌더에서 SSG 빌드 → Nginx 이미지로 GHCR 푸시 → VPS 내 self-hosted runner가 pull & `docker compose up -d`. Traefik이 HTTPS(Let's Encrypt) 자동 처리. **SSH 키를 외부에 두지 않은 것은 잘한 보안 결정.** (참고: 이미지는 arm64 단일 아키텍처 — Oracle ARM 서버에 정합. 커밋 `eec3b0e` 제목의 "멀티 플랫폼"은 최종 상태와 다르니 히스토리를 읽을 때 주의.)
- **도메인**: 운영 중 (문서에는 "도메인 없음"으로 남아 있음 — §3.3).
- **디자인 시스템**: `docs/design.md` 토큰 정의가 `globals.css @theme`으로 충실히 구현됨. 문서→코드 대응이 깔끔한 모범 사례.

> ⚠️ **v1 정정**: v1은 "Fail-fast 빌드 검증 — 잘못된 글이 배포되기 전에 빌드가 죽는 설계"를 완료 항목으로 꼽았으나, **재검증 결과 이 주장은 틀렸습니다.** 검증 로직은 존재하지만 모든 호출부가 예외를 삼켜 빌드는 죽지 않습니다. 상세는 §5.0.

### 1.2 진행 중 (`feature/seo-meta` 브랜치 — 커밋 완료, main 미머지)

- `layout.tsx` 전역 메타데이터, `posts/[slug]` `generateMetadata`, `sitemap.ts`, `robots.ts`, `lib/constants.ts`. OpenSpec `seo-meta-tags` tasks 전부 체크 완료 (단, task 2.2의 "getPostMetadataBySlug 호출" 문구와 달리 실제로는 `getPostBySlug` 호출 — 기능상 동등하나 §5.4의 이중 파싱 문제와 연결됨).
- **라이브 반영 전 상태 (재검증 완료)**: `robots.txt` 404, `sitemap.xml` 404, 글 상세에 `og:*` 없음, canonical 없음. 이 브랜치가 머지·배포되어야 SEO 기반이 깔림.

### 1.3 계획 대비 미착수 (Phase 1 로드맵에 있으나 없음)

| 항목 | 로드맵 위치 | 확인 결과 |
|------|------------|----------|
| GA4 연동 | Phase 1 (`docs/feature-roadmap.md:12`) | 라이브 HTML에 gtag/GTM 0건 (재검증) |
| OG 기본 이미지 | Phase 1 "OG 이미지" | 40개 글 중 thumbnail 보유 1개 → 대부분 og:image 없음 |
| favicon | (로드맵에 명시 없으나 기본기) | **라이브 404, head에 icon link도 없음** (v2 추가 발견) |
| 스크롤 프로그레스 바 | MVP (`docs/design-direction.md:59`) | 미구현 |
| 시리즈 이전/다음 네비게이션 | MVP (`docs/design-direction.md:57`) | 미구현 (series 필드도 없음) |
| MDX 커스텀 컴포넌트 | MVP (`docs/design-direction.md:55`) | 미구현 (순수 MD 파이프라인) |
| 피드 썸네일 노출 | OpenSpec `blog-rendering` spec:22 | `PostList.tsx` 썸네일 렌더링 0건 |
| `/tags/[tag]` 페이지 | `docs/design-direction.md:45` | 미구현 (클라이언트 필터로 대체 — 합리적 단순화일 수 있음, §9 Q4) |

- **백엔드**: `backend/`는 `.gitkeep`만 존재. Phase 2 미착수 (계획대로).

> **판단**: 구현이 늦은 게 아니라 **문서상 MVP 범위가 실제 MVP보다 크게 잡혀 있는 것**이 문제. → §3.

---

## 2. 지침서(AGENTS.md) 체계 리뷰 — "여러 모델에서도 타당한가?"

핵심 답: **내용은 모델-중립적으로 잘 쓰였고, 문제는 발견 가능성(discoverability)과 로딩 보장에 있다.** (아래 사실관계는 전부 재검증 CONFIRMED)

### 2.1 ✅ 잘된 점

- **AGENTS.md 표준 채택**: Codex, Gemini CLI, Cursor 등이 읽는 사실상의 크로스-툴 표준. 루트+`frontend/` 2단 구성과 참조 분리 원칙도 옳음.
- **행동 지침의 품질**: Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution은 AI 코딩 실수의 실제 패턴을 정확히 겨냥하고, 특정 모델 기능에 의존하지 않음.
- **`frontend/CLAUDE.md` → `@AGENTS.md` 임포트 패턴**: 정확히 권장되는 멀티 모델 패턴.

### 2.2 ⚠️ 문제 1: 루트에 CLAUDE.md가 없어 루트 AGENTS.md 로딩이 보장되지 않음

- **근거**: 루트에 CLAUDE.md 없음(재확인). 실증: 이번 리뷰 세션에서도 루트 AGENTS.md는 자동 로드되지 않았고, 사용자가 직접 @멘션해서야 컨텍스트에 들어왔다.
- **왜 문제인가**: 최상위 지침이 "위반"이 아니라 "본 적 없는" 상태가 됨. 백엔드 비유: `application.yml`은 잘 썼는데 클래스패스에 안 올라간 상황.
- **개선안**: 루트 `CLAUDE.md` 생성, 내용은 `@AGENTS.md` 한 줄. (다른 도구 병행 여부는 §9 Q5 확인 후 GEMINI.md 등 동일 패턴 추가.)
- **우선순위: P1 / 규모: 5분**

### 2.3 ⚠️ 문제 2: 에이전트 디렉토리 이원화 (`.agent/` vs `.agents/`) + 문서 맵 부재

- **근거**: `.agent/`(단수, OpenSpec 도구 생성 skills/workflows)와 `.agents/`(복수, 직접 작성한 `references/git-strategy.md`)가 공존. `AGENTS.md:16`은 "e.g., under `.agents/references/` or `docs/`"라고 스스로도 위치를 확정하지 못함.
- **왜 문제인가**: "관련 문서를 먼저 읽어라"고 지시했지만 목록이 없음. 특히 **지침대로 `.agents/`(복수)만 탐색하면 OpenSpec 워크플로/스킬이 든 `.agent/`(단수)를 통째로 놓치는 구조적 함정** — glob 탐색 에이전트에게 치명적 (재검증에서 추가 확인된 논점).
- **개선안**:
  1. `.agent/`는 도구 소유물이므로 유지. **직접 작성 참조 문서는 `docs/`로 일원화**, `.agents/references/git-strategy.md` → `docs/git-strategy.md` 이동.
  2. 루트 AGENTS.md에 문서 맵 추가:
     ```markdown
     ## Document Map (read what's relevant before starting)
     - docs/project-overview.md — 목표/가치 (SSoT)
     - docs/architecture.md — 기술 스택/배포 구조
     - docs/feature-roadmap.md — 단계별 로드맵
     - docs/git-strategy.md — 브랜치/커밋/PR 규칙 (gh 계정 규칙 포함)
     - docs/design.md — 디자인 토큰 정의 (frontend/app/globals.css와 1:1)
     - openspec/ — 스펙 주도 변경 관리 (아래 Workflow 참조)
     ```
- **우선순위: P1 / 규모: 30분**

### 2.4 ⚠️ 문제 3: AGENTS.md가 실제 개발 프로세스(OpenSpec)를 언급하지 않음

- **근거**: `grep -i openspec AGENTS.md` → 0건 (재확인). 실제 작업은 OpenSpec으로 진행 중(아카이브 2건 + 진행 1건).
- **왜 문제인가**: AGENTS.md만 읽은 새 세션은 스펙 없이 바로 코드를 고치는 게 기본 동작이 됨. "언제 OpenSpec을 거치는지" 기준이 없으면 모델마다 다르게 행동 — 사용자가 우려한 "모델 간 당위성" 문제의 실체.
- **개선안**: Workflow 섹션 추가 — 새 기능/동작 변경은 OpenSpec change 먼저, 버그/오타는 바로 브랜치 작업, 완료 change는 배포 확인 후 archive.
- **우선순위: P1 / 규모: 20분**

### 2.5 🔶 문제 4: frontend/AGENTS.md에 디자인 시스템 진입점이 없음

- **근거**: frontend/AGENTS.md는 React 원칙과 SSG 환경변수 규칙은 담았지만 디자인 토큰(`docs/design.md` + `globals.css @theme`) 위치를 가리키지 않음.
- **왜 문제인가**: 임의 값이 이미 스며들기 시작함 — 예: `TOC.tsx:70`의 `text-[14px]`는 `@theme`에 `--text-caption: 14px` 토큰이 있는데도 임의 px를 사용한 실제 위반. `PostContent.tsx`의 `text-[11px]`는 대응 토큰조차 없는 임의 값.
  - ~~v1이 예시로 든 `top-4 left-5`는 Tailwind 표준 스페이싱 유틸리티라 "토큰 위반"이 아님~~ (v1 과장 정정).
- **개선안**: frontend/AGENTS.md 상단에 "UI 작업 전 필독: `docs/design.md`, `app/globals.css`. 임의 px/색상 대신 토큰 우선" 규칙 추가.
- **우선순위: P2 / 규모: 15분**

### 2.6 🔶 문제 5: OpenSpec 메타데이터 방치

- **근거**: 두 spec의 Purpose 모두 "TBD", `openspec/config.yaml` context 전부 주석 (재확인).
- **왜 문제인가**: config context는 artifact 생성 시 AI 프롬프트에 들어감 — 비워두면 세션마다 스택을 재추측해 품질 편차. Purpose TBD는 change의 소속 판단 기준 부재.
- **개선안**: context에 스택/컨벤션 5줄 요약, Purpose 각 1문장 확정.
- **우선순위: P2 / 규모: 20분**

---

## 3. 문서 vs 현실 불일치 (드리프트)

스펙 주도 프로세스에서 문서 드리프트는 프로세스 신뢰도 하락이다. 에이전트는 문서를 그대로 믿으므로 어긋난 문서는 사람보다 에이전트에게 더 해롭다.

### 3.1 ❌ 문서 간 정면 모순: 기본 테마 (재검증 CONFIRMED)

- **근거**: `project-proposal.md:44` "다크 모드를 기본" vs `design-direction.md:15` "라이트 모드 기본"(같은 문서 :58에도 반복) vs 실제 `providers.tsx:7` `defaultTheme="system"`.
- **왜 문제인가**: 세 가지 답이 공존 → 에이전트가 어느 문서를 읽느냐에 따라 정상 코드를 "문서에 맞춰" 되돌리는 사고가 나기 좋은 구조.
- **개선안**: 의도 확정(§9 Q1) 후 문서 2곳+구현 일치. `system`이 실사용 표준이라 문서를 고치는 방향 권장.
- **우선순위: P1 / 규모: 10분 (결정 후)**

### 3.2 ❌ 콘텐츠 구조: 문서 스펙과 실제가 다름 + draft 트랩 (재검증: node 재현으로 CONFIRMED)

- **근거**: `feature-roadmap.md:40-66`은 `content/posts/<날짜-slug>/index.md + images/` 구조와 `series`/`draft`/상대경로 thumbnail을 문서화. 실제는 flat `*.md` + `frontend/public/images/` 절대경로. zod 스키마(`lib/markdown.ts:20-31`)에 `series`/`draft` 없음. **실제 재현 결과: frontmatter에 `draft: true`를 넣으면 zod v4가 에러 없이 키를 버리고(strip) 글이 그대로 통과.**
- **왜 문제인가**: (1) 로드맵 문서대로 글을 만들면 빌드가 인식 못 함. (2) draft 글이 조용히 공개 배포됨. (3) thumbnail 경로 규약은 로드맵(상대경로) vs blog-rendering spec:23(절대경로) vs 실제까지 **3자 불일치** (v2 추가).
- **개선안**: ① 현실을 정본으로 문서 갱신(이미지 정책은 §9 Q3 후). ② 스키마 `.strict()`로 unknown key 빌드 실패화 — 단 **§5.0의 fail-silent를 먼저 제거해야 strict가 실효를 가짐** (throw해도 지금은 삼켜지므로). ③ draft/series 지원 여부는 §9 Q4.
- **우선순위: P1 (§5.0과 한 묶음) / 규모: 1시간**

### 3.3 🔶 그 외 낡은/틀린 서술 (일괄 갱신 대상)

| 위치 | 문서 내용 | 현실 |
|------|----------|------|
| `docs/architecture.md:67` | "도메인: 아직 없음. IP로 우선 운영" | 도메인 운영 중 |
| `docs/architecture.md:100-103` | 루트 구조도가 `backend/`에 src/, build.gradle.kts, Dockerfile이 있는 것처럼 표기 | `backend/`는 `.gitkeep`뿐인 빈 폴더 — 구조도가 신규 에이전트를 오도 |
| `docs/architecture.md:86` | "**무중단**으로 컨테이너를 재시작" | `docker compose up -d`는 단일 컨테이너 stop→recreate라 수 초 다운타임 발생. 무중단 아님 (v2 추가) |
| `docs/feature-roadmap.md:83` | "블로그 이름/브랜드 미정, 우선 IP 운영" | 도메인 확보로 절반 해소 |
| `docs/project-overview.md` vs `project-proposal.md` | 같은 내용 2중 서술 | proposal이 overview+roadmap+design-direction 짜깁기 → 4번째 수정 지점화 |

- ~~v1의 "architecture.md 구조도에 frontend/public 표기 없음" 주장은 오류 — `:97`에 `public/`이 실재함~~ (v1 오류 정정).
- **개선안**: `project-proposal.md`를 스냅샷으로 격하 또는 삭제(§9 Q9), 살아있는 문서를 4개로 한정, 낡은 서술 한 PR로 일괄 갱신.
- **우선순위: P2 / 규모: 1시간**

---

## 4. CI/CD · 인프라

### 4.1 ❌ docker-compose 정의 이중화 — 이미 드리프트 발생 (재검증 CONFIRMED)

- **근거**: 실제 배포는 `deploy.yml:83-129` heredoc, 루트 `docker-compose.yml`은 별개. 차이: traefik `v3.1` vs `v3.0`, `DOCKER_API_VERSION=1.41` heredoc에만 존재, 루트에만 deprecated `version: '3.8'` 잔존. 커밋 `b69c7f1`의 수정이 heredoc에만 반영된 것까지 git으로 교차 확인됨.
- **왜 문제인가**: 같은 대상의 정의가 두 곳이면 반드시 한쪽만 고치게 된다(이미 그랬음). 다음에 백엔드 컨테이너를 추가할 때 루트만 고치고 배포가 안 바뀌는 사고가 예정되어 있음.
- **개선안**: 저장소 compose 파일을 단일 정본으로. deploy 잡에서 파일을 서버로 복사:
  ```yaml
  # 방법 A: sparse-checkout (단일 파일은 cone-mode 해제가 정석)
  - uses: actions/checkout@v4
    with:
      sparse-checkout: |
        docker-compose.yml
      sparse-checkout-cone-mode: false
  # 방법 B(권장): build 잡에서 upload-artifact → deploy 잡에서 download-artifact
  #   → VPS에 git 메타데이터가 아예 안 올라가 heredoc의 원래 의도(git 노출 방지)를 온전히 보존
  ```
  ~~v1의 예시(`sparse-checkout: docker-compose.yml` 단독)는 cone-mode 기본값(true)에서 "루트 파일은 항상 포함" 규칙 덕에 우연히만 동작하는 틀린 형태였음~~ (v1 오류 정정). 참고: checkout 방식은 runner 작업 디렉토리에 `.git`+토큰이 잡 동안 존재하므로, 원 의도를 엄격히 지키려면 방법 B.
- **우선순위: P0 / 규모: 1~2시간 (배포 1회 검증 포함)**

### 4.2 ⚠️ PR 단계 CI 부재 (재검증: 사실 CONFIRMED, ~~P0~~ → **P1로 하향 정정**)

- **근거**: 워크플로우는 `deploy.yml`(push: main) 하나뿐.
- **왜 문제인가 (정정된 서술)**: 깨진 머지가 **사이트를 죽이지는 않는다** — main 푸시 시 build 잡이 실패하면 deploy 잡(`needs:`)이 스킵되어 기존 컨테이너가 계속 서빙된다. 즉 게이트는 이미 있고 위치가 PR이 아니라 main일 뿐. 실비용은 "머지 후 발견 → 수정 커밋"이라는 불편이므로 P1이 정직한 책정. ~~v1의 P0~~ 하향.
  - **단, v1의 "빌드가 곧 전체 콘텐츠 검증" 주장도 틀렸다**: §5.0의 fail-silent 때문에 잘못된 frontmatter/이미지는 빌드를 통과한다. CI는 lint/타입/빌드 오류만 잡으며, 콘텐츠 검증 효과는 §5.0 해결 후에야 생긴다.
- **개선안**: `.github/workflows/ci.yml` — `pull_request` 트리거, **반드시 GitHub-hosted runner** (`runs-on: ubuntu-latest` 등. self-hosted로 지정하면 §4.3의 fork PR 공격면이 실제로 열리므로 절대 금지 — v1이 봉합하지 않은 자기모순 정정). `npm ci && npm run lint && npm run build`. main 보호 규칙에서 required check 지정.
- **우선순위: P1 / 규모: 1시간**

### 4.3 ⚠️ Self-hosted runner 보안 위생 (재검증: sudo 존재 CONFIRMED, 위험도는 "현재 낮음"으로 조정)

- **근거**: 저장소 PUBLIC + `deploy.yml:73,75`의 `sudo mkdir`/`sudo chown`. "passwordless sudo"는 **추정**이지만 비대화형 잡에서 sudo가 성공하려면 NOPASSWD가 필요하고 Oracle 기본 이미지가 `NOPASSWD:ALL`이므로 개연성 높음 — 서버에서 `sudo -l`로 확정 필요.
- **왜 문제인가**: 현 트리거(push: main + dispatch)에선 write 권한자만 실행 가능해 **즉시 위험은 낮다.** 리스크는 조건부 — `pull_request` + `runs-on: self-hosted` 워크플로우가 추가되는 순간 열리며(첫 기여자는 승인 필요하나 **PR 1개만 머지되면 이후 자동 실행**), runner가 뚫리면 sudo로 서버 전체가 넘어간다.
- **개선안**: ① Settings → Actions에서 **"Require approval for all outside collaborators"** 설정 확인 (~~v1의 "all external contributors"는 존재하지 않는 명칭~~ 정정). ② `/opt/blog`를 서버에서 1회 수동 생성 후 deploy 스크립트의 sudo 2줄 제거, runner 유저 sudoers 축소. ③ 새 워크플로우 작성 시 "self-hosted는 deploy 잡 전용" 규칙 명문화.
- **우선순위: P1 (위생) / 규모: 30분**

### 4.4 🔶 롤백 경로 부재: `:latest` 단일 태그 × `docker image prune` (v2에서 악화 요인 추가)

- **근거**: `deploy.yml:59` `:latest` 단일 푸시. **추가 발견: `deploy.yml:138`의 `docker image prune -f`가 새 이미지 pull 직후 이전 이미지(dangling화된 롤백 후보)를 즉시 삭제** — 로컬 롤백 가능성을 배포 스크립트가 스스로 제거한다.
- **개선안**: `:latest` + `:${{ github.sha }}` 동시 푸시(동일 다이제스트에 태그만 추가, 재빌드 없음 — 비용 ≈ 0). compose에 `image: ...:${TAG:-latest}` 도입, 롤백은 `.env`의 TAG 지정. prune은 유지해도 됨(GHCR에서 SHA 태그로 재-pull 가능해지므로).
- **우선순위: P3 / 규모: 30분**

### 4.5 🔶 Nginx/응답 레이어 (v2 신규 — v1이 통째로 놓친 영역)

라이브 응답 헤더 실측 결과:

- **캐시 헤더 전무**: 콘텐츠 해시가 박힌 `/_next/static/*` 불변 자산에도 `Cache-Control` 없음. 게다가 Docker COPY가 빌드 시각 mtime을 쓰므로 **배포할 때마다 전 정적 자산의 Last-Modified가 갱신 → 재방문자가 매 배포마다 전부 재다운로드.** `location /_next/static/ { add_header Cache-Control "public, max-age=31536000, immutable"; }` 권장. **P2 / 30분**
- **gzip 미설정**: nginx 기본 이미지에서 gzip off → HTML/JS/CSS 무압축 전송. `gzip on` + 타입 지정. **P2 / 15분**
- **보안 헤더 전무**: HSTS, X-Content-Type-Options, X-Frame-Options 없음. 정적 블로그라 임팩트는 제한적이나 전부 add_header 1줄씩. **P3 / 15분**
- **트레일링 슬래시 403**: `/about/`, `/posts/<slug>/` → **403 Forbidden** (`try_files`의 `$uri/`가 index 없는 디렉토리에 매칭). 외부 링크가 슬래시를 붙이면 403 노출 + 같은 콘텐츠에 상태코드 불일치 신호. 301 정규화 또는 `$uri/` 제거. **P2 / 30분**

### 4.6 🔶 기타 정리

- **머지 완료 브랜치 8개 잔존** (재검증 count 일치): GitHub "Automatically delete head branches" 켜고 일괄 삭제. **P3 / 10분**
- **서드파티 액션이 태그 핀** (`@v4`, `@v5`): build 잡은 `packages: write` 토큰 보유 + 서버가 :latest를 자동 pull하는 구조라, 액션 태그 하이재킹 → 악성 이미지 자동 배포 경로가 이론상 열려 있음. SHA 핀 권장. **P3** (v2 신규)
- **ACME 이메일 평문 노출** (`deploy.yml:102`): 실해 미미. 반대로 공개 도메인명을 secret으로 관리하는 것(`secrets.DOMAIN`)은 시큐리티 시어터에 가까움 — 위협 모델 정리 차원에서 함께 재검토. **P3**
- deploy 잡에 `permissions:` 블록 없음 → 기본 토큰 권한 상속. `permissions: {}` 1줄로 축소 가능. **P3**

---

## 5. 프론트엔드 코드 품질

구조 자체(컴포넌트 분리, 과잉 추상화 없음, 클라이언트/서버 구분)는 깨끗하다. 그러나 재검증에서 v1의 핵심 전제 하나가 뒤집혔다.

### 5.0 ❌ **[v2 최중요 정정] "Fail-fast"는 허상 — 실제로는 fail-silent** (재검증에서 발견)

- **근거**: `getPostBySlug`는 `markdown.ts:139`에서 `throw error`("Fail-fast for build to fail" 주석)하지만, **모든 호출부가 이를 삼킨다**:
  - `generateMetadata` (`page.tsx:17-45`): catch → `return {}` (빈 메타데이터)
  - `PostPage` (`page.tsx:51-56`): catch → `notFound()` (404 프리렌더)
  - `getPostMetadataBySlug` (`markdown.ts:72-88`): 자체 catch → `return null`
  - `getAllPosts` (`markdown.ts:143-155`): null 필터 → 목록/sitemap에서 조용히 누락
- **왜 문제인가**: 잘못된 frontmatter/이미지를 가진 글은 **빌드를 죽이지 않는다.** 목록에서 조용히 사라지거나(스키마 위반), 더 나쁘게는 — 이미지 검증은 `getPostBySlug`(상세)에서만 돌고 `getPostMetadataBySlug`(목록/sitemap)에서는 안 돌기 때문에 — **이미지 규칙 위반 글은 목록과 sitemap에 멀쩡히 노출되면서 클릭하면 404**가 된다. 정상처럼 보이는 깨진 링크: fail-fast의 정반대. OpenSpec `blog-rendering` 스펙의 "Fail-fast" Requirement(빌드 즉시 중단)와도 정면 배치 — **스펙 위반 상태**다.
- **개선안**: 검증 실패는 전파되게 한다 — ① `getPostMetadataBySlug`의 try-catch 제거(throw 전파), ② `generateMetadata`/`PostPage`의 catch에서 "파일 없음(ENOENT)"만 `notFound()`로 처리하고 검증 에러(ZodError, [Fail-fast] 에러)는 rethrow, ③ §3.2의 `.strict()`는 이 수정 이후에 실효. 수정 후 `npm run build`로 고의 오류 글을 넣어 빌드가 실제로 죽는지 확인하는 것까지가 완료 정의.
- **우선순위: P0 (콘텐츠 파이프라인 신뢰의 근간이자 스펙 위반) / 규모: 2시간**

### 5.1 🔶 raw HTML `<img>` 검증 우회 (재검증: 메커니즘 CONFIRMED, ~~P2~~ → **P3로 하향**)

- **근거**: 파이프라인 재현으로 확인 — raw `<img>`는 `visit(tree, 'element')`에 안 걸리고 그대로 출력됨. **단, 전수 grep 결과 현재 40개 글 중 raw `<img>`는 1개 파일뿐이고 그마저 외부 URL(어차피 검증 면제 대상)** — 현재 실질 임팩트 0인 잠재 구멍.
- **개선안**: §5.0 작업에 얹어 remark 단계에서 raw html 노드 발견 시 throw(가장 단순) 또는 `rehype-raw` 도입. 급하지 않음.
- **우선순위: P3 / 규모: 1시간**

### 5.2 ⚠️ 글 상세 페이지에 h1이 여러 개 (재검증 CONFIRMED — 40개 중 25개 글이 본문 h1 사용, 최대 7개)

- **근거**: 템플릿이 제목을 h1로 렌더링(`page.tsx:75`) + 본문 `# 섹션` h1 다수. TOC도 h1/h2 수집(`TOC.tsx:22`).
- **왜 문제인가**: 문서당 h1 1개가 시맨틱/SEO 표준. SEO 작업 중인 지금 같이 잡는 게 맞음.
- **개선안**: rehype 단계에서 헤딩 레벨 일괄 +1 시프트(h1→h2, h2→h3) 플러그인 + TOC 수집 대상을 h2/h3로 변경. 글 작성 컨벤션("본문 최상위는 `#`")은 유지 가능.
- **우선순위: P2 / 규모: 2시간**

### 5.3 🔶 복사 버튼: DOM 직접 조작 (재검증 CONFIRMED + 결함 2건 추가)

- **근거**: `PostContent.tsx:8-63` useEffect + createElement 방식. v2 추가 발견: ① **useEffect cleanup 함수가 아예 없음** — addEventListener/setTimeout 미정리, ② `navigator.clipboard.writeText().then()`에 **`.catch` 없음** — 권한 거부/비보안 컨텍스트에서 조용히 실패해 UI가 멈춤.
- **개선안(급하지 않음)**: 빌드 타임 rehype 플러그인으로 버튼 마크업을 정적 HTML에 포함시키고 클라이언트는 이벤트 위임 1개만 유지. 그 전까지 최소 `.catch` 추가.
- **우선순위: P3 / 규모: 2~3시간**
- (참고: "라이트 모드에서 버튼 대비 문제" 가설은 재검증에서 기각 — `globals.css:224`가 코드블록을 양 테마 모두 다크로 강제하므로 일관됨.)

### 5.4 🔶 소소한 것들 (전부 재검증 CONFIRMED)

- **글당 파이프라인 2회 실행**: `generateMetadata`와 `PostPage`가 각각 `getPostBySlug` 호출 → 40개 글 기준 remark→shiki 풀 파싱 80회. `generateMetadata`는 경량 `getPostMetadataBySlug`로 충분 (§5.0 수정과 같이 정리). **P3** (v2 신규)
- **`../content/posts` 상대경로** (`markdown.ts:17`): frontend/에서 빌드해야만 동작하는 암묵 전제 — 문서화 필요. **P3**
- **sitemap `lastModified: new Date()`** (`sitemap.ts:18,22`): 홈/about만 해당(글은 올바름). 크롤러에 거짓 신호. **P3 / 10분**
- **Pretendard CDN @import** (`globals.css:1`): 렌더 블로킹 + 외부 의존. self-host(woff2 subset) 권장. **P3 / 1시간**
- **테스트 0건** (설정/의존성/파일 전무 확인): `lib/markdown.ts`만 vitest ~10케이스 — §5.0/§5.2 개조의 안전망. 범위는 §9 Q8. **P2 / 2~3시간**
- **접근성 소소**: 태그 필터 버튼 `aria-pressed` 없음, 필터 결과 `aria-live` 없음. **P3**

---

## 6. SEO / 운영 목표 관점

핵심 가치 3번("트래킹 & 분석")이 가장 비어 있는 축. 권고안의 static export 호환성은 Next 16.2.10 번들 문서로 재검증 완료.

| # | 항목 | 상태 | 개선안 | 우선순위 |
|---|------|------|--------|---------|
| 6.0 | **SITE_URL localhost 함정** (v2 신규 — 이번 재검증 최대 실질 리스크) | `lib/constants.ts:1`의 `\|\| 'http://localhost:3000'` 폴백. **실제 `frontend/out/sitemap.xml`·`robots.txt`에 localhost URL이 박혀 있음**(로컬 빌드 산출물). Dockerfile은 `COPY out`이므로 로컬에서 빌드 후 이미지를 만들면 localhost가 박힌 SEO 파일이 그대로 배포됨. `secrets.DOMAIN` 미설정 시 `https://`(빈 도메인)가 되는 것도 같은 계열 | 프로덕션 빌드에서 `NEXT_PUBLIC_SITE_URL` 미설정 시 **빌드 실패**하도록 가드 (`if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SITE_URL) throw`) 또는 폴백을 실제 도메인으로 | **P0** |
| 6.1 | **seo-meta 배포** | 커밋 완료·main 미머지 (라이브 404 재확인) | 머지 → 배포 → Search Console 등록 + sitemap 제출까지가 완료 정의 | **P1** |
| 6.2 | **GA4** | 미착수 (라이브 gtag 0건 재확인) | `@next/third-parties`(미설치 — 설치 필요) `<GoogleAnalytics>`, static export 호환 확인됨. 측정 ID는 CI 주입. 대안은 §9 Q7 | **P1** |
| 6.3 | **canonical + Velog 중복** | 미결정. **v2 실측: Velog 글은 이미 자기 자신을 가리키는 rel=canonical을 갖고 있음** | ~~v1의 "새 블로그에 canonical 설정"은 크로스 도메인 중복의 해법이 아님~~ — 양쪽이 서로 자기를 정본이라 주장하면 구글은 힌트를 무시하고 신호(도메인 파워 등)로 고른다. **실효 수단은 Velog 쪽 정리(삭제/요약화+링크)뿐**이고, 자기 canonical은 트레일링 슬래시/파라미터 중복 방지용 기본기로서만 추가. 결정은 §9 Q2 | **P1(결정)** |
| 6.4 | **OG 기본 이미지** | 40개 중 39개 og:image 없음 | `app/opengraph-image.png` 파일 컨벤션 — static export 동작 문서 확인됨. 동적 생성(ImageResponse)도 빌드 타임 캐시로 가능(한글 폰트 임베드 시 500KB 제한 주의) | **P2** |
| 6.5 | **favicon 전무** (v2 신규) | 라이브 404 + head에 icon link 없음 | `app/icon.png` 파일 컨벤션 1장이면 끝. 브라우저 탭/검색결과 표시 기본기 | **P2 / 10분** |
| 6.6 | **JSON-LD Article** | 없음 | generateMetadata와 같은 데이터로 삽입. 저비용 | **P2** |
| 6.7 | **RSS** | Phase 2 계획 | route handler로 구현 가능하되 **`export const dynamic = 'force-static'` 필수** (fs 접근 시 프리렌더 중단 — 현재 sitemap.ts/robots.ts에 이미 같은 이유로 들어가 있는 그 지시자). 규모는 이스케이프 포함 30~40줄 (~~v1의 "20줄"~~은 낙관) | **P2** |

---

## 7. 작업 방식·프로세스 총평

- **OpenSpec 스펙 주도 + 아카이브 관리**: 실제로 지켜지고 있고 artifact 품질도 좋음. §2.4/§2.6만 보강. 단, §5.0에서 보듯 **스펙의 Requirement(fail-fast)와 구현이 어긋나도 잡아낼 장치가 없다** — 스펙을 쓰는 프로세스와 스펙을 "검증"하는 프로세스는 별개라는 것이 이번 재검증의 교훈. tasks 체크리스트에 "스펙 시나리오를 실제로 재현해 확인" 항목을 넣는 습관 권장.
- **Git 전략 문서**: 솔로 프로젝트에 맞는 단순함. `gh` 다중 계정 규칙 명시는 실질적으로 유효한 좋은 지침.
- **PR 템플릿**: "이슈 트래커 없이 PR이 유일한 기록" 전략과 정합적.
- **구조적 공백**: 계획→구현→PR은 있는데 **자동 검증 게이트(§4.2)가 없다.** 단 v2 정정대로, CI를 넣어도 §5.0을 고치기 전에는 콘텐츠 검증 효과가 없다 — 순서가 중요하다 (§8).

---

## 8. 권장 실행 순서 (로드맵, v2 조정)

```
[Step 0] 인터뷰 (§9) — 30분. Q1~Q5는 이후 작업의 전제
[Step 1] P0 3종 — 반나절
         ① fail-silent 제거 + strict 스키마 (§5.0 + §3.2) ← 이후 모든 검증의 전제
         ② SITE_URL localhost 가드 (§6.0)
         ③ compose 단일화 (§4.1)
[Step 2] seo-meta 마무리: 머지 → 배포 → Search Console + favicon(§6.5) — 1~2시간
[Step 3] P1 인프라·프로세스: PR CI(§4.2, GitHub-hosted 한정) + runner 위생(§4.3)
         + 지침서 정비(§2.2~2.4) — 반나절
[Step 4] 문서 드리프트 일괄 해소 (§3.1~3.3, 인터뷰 결정 반영) — 1~2시간
[Step 5] 콘텐츠/서빙 품질: h1 시프트(§5.2), nginx 캐시·gzip·슬래시(§4.5),
         markdown 단위 테스트(§5.4) — 1일
[Step 6] SEO 마무리: GA4(§6.2), Velog 정리(§6.3), 기본 OG(§6.4), JSON-LD(§6.6), RSS(§6.7) — 1일
[Step 7] Phase 2 (백엔드 실험실) 착수 — 조회수 API부터. 이 시점의 인프라가 그대로 상속됨
```

> Step 4까지 끝나면 P0~P1이 소진되고 남는 것은 기능 추가/정리(P2~P3)뿐 — "빡빡한 종료 기준"(중간 레벨 이하 문제만 잔존) 도달.

---

## 9. 인터뷰 — 다음 세션에서 해소할 결정 사항

> 코드만 봐서는 결정할 수 없는, 운영자 의도 확인이 필요한 항목. 추천안(⭐)대로 일괄 답변도 가능.

**Q1. 기본 테마는 무엇이 의도인가요?** (§3.1)
- (a) ⭐ 시스템 설정 따름(현재 구현) — 문서 2곳을 이에 맞게 수정
- (b) 라이트 기본 / (c) 다크 기본

**Q2. Velog 병행 운영 전략은?** (§6.3 — v2 실측 반영: Velog는 자체 canonical 보유 → 새 블로그의 canonical 선언만으로는 중복이 해소되지 않음)
- (a) ⭐ 신규 블로그를 정본으로: **Velog 인기글을 요약+새 URL 링크로 교체**(또는 삭제), 신규 글은 새 블로그에만
- (b) Velog 완전 철수 (전체 삭제/비공개)
- (c) 양쪽 완전 병행 (검색 유입이 Velog로 계속 갈 위험 감수)
- 부속 질문: Velog 42개 중 이관 안 된 글이 있나요? (현재 40개에 신규 글 혼재 → 실제 이관 수 39개 이하)

**Q3. 이미지 저장 위치 정책은?** (§3.2 — "글의 영속성" 가치와 연결)
- (a) ⭐ 현상 유지(`frontend/public/`) + 문서에 정책 명시 (가장 저렴)
- (b) `content/posts/<slug>/images/`로 이동 + 빌드 시 복사 스크립트 (원칙 부합, 공수 중간)

**Q4. frontmatter 표준 확정** (§3.2, §5.4)
- 4-1. `summary`(24)/`excerpt`(5) → `description` 일괄 마이그레이션 + 별칭 제거? ⭐ 예
- 4-2. `draft` 실제 지원(true면 빌드 제외) vs 금지? ⭐ 지원
- 4-3. `series` + 이전/다음 네비게이션 시점? ⭐ SEO 마무리 후 별도 change
- 4-4. `/tags/[tag]` 정적 페이지 vs 현재 클라이언트 필터? ⭐ Phase 2와 함께

**Q5. 실제 사용하는(할) AI 도구는?** (§2.2) — Claude Code만? Codex/Gemini/Cursor 병행? → CLAUDE.md 외 파일 필요 여부 결정

**Q6. 백엔드 실험실 착수 기준** — 첫 기능 조회수 API? ⭐ 예 / SQLite 시작? ⭐ 예 / 착수 시점 Step 1~6 후? ⭐ 예

**Q7. 분석 도구** (§6.2)
- (a) ⭐ GA4 (업계 표준 경험이 학습 목표)
- (b) self-host Umami/Plausible (실험실 취지 부합, 서버 자원 소모)
- (c) GA4 먼저 + self-host는 Phase 2 실험 소재

**Q8. 테스트 범위** (§5.4)
- (a) ⭐ `lib/markdown.ts` 단위 테스트만 (vitest ~10케이스) + PR CI build
- (b) 컴포넌트 테스트까지 / (c) 당분간 없음

**Q9. `docs/project-proposal.md` 처리** (§3.3)
- (a) ⭐ "최초 기획 스냅샷 — 최신은 overview/architecture/roadmap 참조" 배너 추가
- (b) 삭제

**Q10. 종료 기준 확인** — 이 리포트는 "시니어가 큰 그림을 그릴 수준"을 충족하도록 작성했고, "중간 레벨 이하만 잔존"은 §8 Step 4 완료 시점 도달로 판정. 동의하나요? 추가로 팔 영역(성능 측정, 접근성 감사, 백엔드 설계 선행 리뷰 등)이 있으면 지정.

---

## 10. v2 재검증 이력 — 무엇이 바뀌었나

독립 검증 에이전트 4개(문서·지침 / 프론트엔드 코드 / CI·인프라 / SEO·라이브)가 v1의 전 주장을 반박 목적으로 재검증. 코드 주장은 node로 실제 재현, 인프라 주장은 GitHub 공식 문서 대조, SEO 권고는 Next 16.2.10 번들 문서(`node_modules/next/dist/docs/`) 대조, 라이브 주장은 curl 재실측.

### v1의 오류 (WRONG — 정정 완료)

| # | v1 주장 | 실제 | 반영 위치 |
|---|---------|------|----------|
| 1 | "Fail-fast 빌드 검증 — 잘못된 글이 배포 전 빌드를 죽임" (잘된 점으로 서술) | 모든 호출부가 throw를 삼키는 **fail-silent**. 검증 위반 글은 목록에서 조용히 누락되거나 "목록엔 보이는데 클릭하면 404". OpenSpec 스펙 위반 상태 | §5.0 신설 (P0) |
| 2 | "architecture.md 구조도에 frontend/public 표기 없음" | `:97`에 `public/` 실재. 구조도의 진짜 드리프트는 backend/를 채워진 것처럼 그린 것 | §3.3 |
| 3 | seo-meta 작업이 "미커밋" | 커밋 완료(`90bb3dc`, `34f7856`), main 미머지가 정확한 상태 | 헤더, §1.2 |
| 4 | §4.1 예시 YAML (`sparse-checkout` 단독) / §4.3 설정명 "all external contributors" | cone-mode 해제 누락(우연히만 동작) / 실제 명칭은 "all **outside collaborators**" | §4.1, §4.3 |

### v1의 과장 (OVERSTATED — 하향/정정)

| # | 항목 | 조정 |
|---|------|------|
| 1 | "Velog 42개 중 40개 이관 완료" | 신규 글 혼재 확인 → "이관분+신규분 40개"로 정정 |
| 2 | PR CI 부재 = P0 | 빌드 실패 시 deploy 잡이 스킵되어 사이트는 안 죽음 → **P1** |
| 3 | raw HTML img 우회 = P2 | 메커니즘은 재현됐으나 현 콘텐츠 실질 임팩트 0 → **P3** |
| 4 | runner 보안 서술 | "passwordless sudo"는 추정임을 명시, 현재 위험도 "낮음"으로 조정 (권고 자체는 유지) |
| 5 | `top-4 left-5`를 토큰 위반 예시로 사용 | Tailwind 표준 유틸이라 위반 아님 → 진짜 위반(`text-[14px]`)으로 교체 |
| 6 | canonical 설정을 Velog 중복 해법으로 병기 / RSS "20줄" | Velog가 자체 canonical 보유(실측) → 실효 수단은 Velog 정리뿐 / force-static 필수 조건 추가, 30~40줄 |

### v1이 놓친 이슈 (v2 추가)

- **P0**: SITE_URL localhost 폴백 — `out/sitemap.xml`에 localhost 실재, 로컬 빌드→이미지 빌드 시 그대로 배포되는 경로 (§6.0)
- **P2**: favicon 전무(라이브 404) / 트레일링 슬래시 403 / `_next/static` 캐시 헤더 전무(+배포마다 mtime 갱신으로 전체 재다운로드) / gzip 미설정 (§4.5, §6.5)
- **P3**: `docker image prune`이 롤백 후보를 스스로 삭제(§4.4) / 액션 태그 핀 공급망 경로(§4.6) / 글당 파이프라인 2회 실행 — 40글 80회 파싱(§5.4) / 복사 버튼 cleanup·`.catch` 부재(§5.3) / 보안 응답 헤더 전무(§4.5)
- **문서**: architecture.md "무중단" 서술 거짓 / thumbnail 경로 규약 3자 불일치 / `.agents/`만 안내해 `.agent/`를 놓치게 하는 함정 (§2.3, §3.3)

### 검증 후에도 유지된 v1 판정 (주요)

테마 3중 모순, 콘텐츠 구조 드리프트, draft strip 트랩(node 재현), compose 드리프트 3건(git 교차 확인), frontmatter 키 분포 수치(전수 재계수 일치), 다중 h1(25/40개 글), 라이브 404/OG/GA 상태, opengraph-image·GA4의 static export 호환성, AGENTS.md의 OpenSpec 0회 언급, 머지 브랜치 8개 — 전부 CONFIRMED.

---

## 부록 A. 확인된 사실 (증거 목록, v2 갱신)

- 라이브 (2026-07-13 재실측): 홈 200 / robots.txt 404 / sitemap.xml 404 / favicon.ico 404 / 샘플 이미지 200 / 글 상세 og:*·canonical 없음 / GA·GTM 0건 / `/about/` 등 트레일링 슬래시 403 / HTTP→HTTPS 308 정상 / 404 페이지 상태코드 404 정상 / HSTS·XCTO·XFO·Cache-Control 헤더 전무
- 저장소: PUBLIC / frontmatter 분포: title 40, date 40, tags 35, summary 24, description 11, excerpt 5, thumbnail 1 / series·draft 사용 0 / 테스트 파일·설정 0건 / 본문 h1 사용 글 25/40
- 재현 실험: zod 4.4.3 `z.object()` unknown key strip (draft 조용히 소거) / raw `<img>`가 `visit(tree,'element')` 미포착 / raw img 실사용은 1개 파일·외부 URL뿐
- 문서 모순: proposal:44(다크) vs design-direction:15,58(라이트) vs providers.tsx(system)
- compose 드리프트: heredoc(traefik v3.1, DOCKER_API_VERSION, version 줄 없음) vs 루트(v3.0, env 없음, version '3.8') — `b69c7f1` diff로 교차 확인
- 산출물: `frontend/out/sitemap.xml`·`robots.txt`에 `http://localhost:3000` URL 실재 (로컬 빌드분)
- Velog: 글 페이지가 자체 rel=canonical + og:url 보유 (curl 실측)
- Next 16.2.10 번들 문서 확인: opengraph-image 파일/동적 컨벤션의 static export 호환, route handler의 force-static 조건, metadataBase는 canonical을 자동 생성하지 않음, @next/third-parties GA 호환

## 부록 B. 우선순위 총괄표 (v2)

| 순위 | 항목 | 섹션 | 규모 |
|------|------|------|------|
| P0 | fail-silent 제거 + strict 스키마 (스펙 위반 해소) | §5.0, §3.2 | 2~3h |
| P0 | SITE_URL localhost 빌드 가드 | §6.0 | 30m |
| P0 | compose 정의 단일화 | §4.1 | 1~2h |
| P1 | seo-meta 머지·배포 + Search Console | §6.1 | 1h |
| P1 | PR CI (GitHub-hosted 한정) | §4.2 | 1h |
| P1 | runner 위생 (sudo 제거, 설정 확인) | §4.3 | 30m |
| P1 | 루트 CLAUDE.md (`@AGENTS.md`) | §2.2 | 5m |
| P1 | AGENTS.md 문서 맵 + 참조 일원화 | §2.3 | 30m |
| P1 | AGENTS.md에 OpenSpec 워크플로우 명시 | §2.4 | 20m |
| P1 | 테마 기본값 모순 해소 (Q1) | §3.1 | 10m |
| P1 | Velog 전략 결정 + 실행 (Q2) | §6.3 | 결정+α |
| P1 | GA4 또는 대안 (Q7) | §6.2 | 1~2h |
| P2 | favicon | §6.5 | 10m |
| P2 | 문서 드리프트 일괄 갱신 (무중단·backend 구조도 포함) | §3.3 | 1h |
| P2 | frontmatter 콘텐츠 정규화 (Q4-1) | §5.4 | 1h |
| P2 | 다중 h1 → 헤딩 시프트 | §5.2 | 2h |
| P2 | nginx 캐시 헤더 + gzip + 트레일링 슬래시 | §4.5 | 1~2h |
| P2 | 기본 OG 이미지 + JSON-LD | §6.4, §6.6 | 2h |
| P2 | RSS (force-static) | §6.7 | 1~2h |
| P2 | lib/markdown.ts 단위 테스트 | §5.4 | 2~3h |
| P2 | frontend/AGENTS.md 디자인 토큰 진입점 | §2.5 | 15m |
| P2 | OpenSpec Purpose/context 채우기 | §2.6 | 20m |
| P3 | SHA 태깅 + prune 상호작용 해소 (롤백 경로) | §4.4 | 30m |
| P3 | raw HTML img 차단 | §5.1 | 1h |
| P3 | 복사 버튼 빌드타임 이전 (+당장은 .catch 추가) | §5.3 | 2~3h |
| P3 | generateMetadata 이중 파싱 제거 | §5.4 | 30m |
| P3 | Pretendard self-host / sitemap lastModified / 접근성 | §5.4 | 2h |
| P3 | 보안 응답 헤더 / 액션 SHA 핀 / permissions 축소 | §4.5~4.6 | 1h |
| P3 | 브랜치 정리 + auto-delete | §4.6 | 10m |
| P3 | 루트 README (포트폴리오 첫인상) | — | 30m |
