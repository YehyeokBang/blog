# 저장소 문서·개발 운영 정리 설계

- 상태: 아카이브
- 당시 상태: 승인됨
- 작성일: 2026-07-18
- 아카이브 날짜: 2026-07-19
- 대체 문서: [프로젝트 문서 인덱스](../../README.md)
- 범위: 저장소 문서 정보 구조, OpenSpec 종료 절차, PR 누락 방지
- 근거: 로컬 PR squash 커밋 23개, 전체 Markdown 101개, 현재 코드·문서·OpenSpec 비교
- 제한: GitHub 인증 문제로 PR 본문과 리뷰 코멘트 원문은 확인하지 못함

## 1. 목표

이 정리의 목표는 문서 수를 늘리는 것이 아니라 다음 작업의 진입 비용과 반복 누락을 줄이는 것이다.

1. 현재 상태를 설명하는 활성 문서와 과거 기록을 분리한다.
2. 모든 활성 문서를 짧은 상위 인덱스에서 찾을 수 있게 한다.
3. 구현과 OpenSpec의 완료 상태가 어긋나지 않게 한다.
4. 배포·환경변수·문서 갱신처럼 반복해서 빠진 항목을 PR 전에 확인한다.
5. 에이전트가 읽어야 하는 기본 컨텍스트를 짧게 유지한다.

## 2. 하지 않는 일

- 게시물 Markdown 파일의 이름을 바꾸거나 이동하지 않는다.
- 다중 작성, 복잡한 웹 에디터, 대규모 인프라를 도입하지 않는다.
- 별도 ADR 체계나 릴리스 노트 체계를 추가하지 않는다.
- 현재 역할과 중복되는 커스텀 서브 에이전트를 만들지 않는다.
- OpenSpec 검증을 GitHub Actions CI에 추가하지 않는다.

## 3. 문서 정보 구조

```text
README.md
docs/
  README.md
  project-overview.md
  architecture.md
  roadmap.md
  design.md
  git-strategy.md
  persona.md
  backend/
    README.md
    domain-and-api.md
    quality-and-operations.md
  archive/
    README.md
    reviews/
    plans/
    design/
openspec/
  README.md
  specs/
  changes/
    archive/
```

`docs/README.md`는 활성 문서, 역할별 필독 문서, 아카이브 진입점을 제공한다. `openspec/README.md`는 base spec, 진행 중 change, 완료된 archive를 구분한다. 아카이브의 세부 문서는 기본 필독 목록에 넣지 않는다.

### 3.1 이동·통합 목록

| 현재 경로 | 목표 경로 또는 조치 | 이유 |
|---|---|---|
| `PROJECT-REVIEW.md` | `docs/archive/reviews/2026-07-14-project-review.md` | 2026-07-14 시점의 과거 상태 리뷰 |
| `docs/project-proposal.md` | `docs/archive/plans/initial-project-proposal.md` | 초기 계획 스냅샷 |
| `docs/design-direction.md` | 유효 원칙을 `docs/design.md`에 통합한 뒤 `docs/archive/design/initial-design-direction.md`로 이동 | 현재 디자인 문서와 중복 |
| `docs/feature-roadmap.md` | `docs/roadmap.md` | 인터뷰 결과에 맞춘 pull 방식 로드맵으로 교체 |
| `docs/backend-convention.md` | `docs/backend/README.md`, `domain-and-api.md`, `quality-and-operations.md`로 역할별 분할 | 928줄의 필수 컨텍스트 축소 |
| `frontend/README.md` | 같은 경로에서 프로젝트 전용 안내로 교체 | create-next-app 기본 문서 제거 |
| `.github/pr_body.md` | 삭제 | 특정 PR의 일회성 본문 잔재 |

이동된 아카이브 문서의 첫머리에는 상태, 아카이브 날짜, 대체 문서 링크를 남긴다. Git history가 원문을 보존하므로 원래 경로에 redirect 문서를 추가하지 않는다.

### 3.2 링크 영향

- `AGENTS.md`의 `docs/feature-roadmap.md` 링크를 `docs/roadmap.md`로 바꾼다.
- `AGENTS.md`의 `docs/backend-convention.md` 링크를 `docs/backend/README.md`로 바꾼다.
- `openspec/changes/backend-first-deployment/tasks.md`의 기존 백엔드 문서 경로는 change 완료 처리 과정에서 새 경로로 고친다.
- `PROJECT-REVIEW.md` 내부의 과거 경로 언급은 역사적 근거이므로 원문을 유지하되, 문서 상단에 현재 인덱스 링크를 둔다.
- `AGENTS.md`를 참조하는 `CLAUDE.md` 계열 redirect는 경로 변경이 없어 유지한다.

## 4. 현재 상태의 단일 출처

| 사실 | 단일 출처 |
|---|---|
| 프로젝트 목표·가치 | `docs/project-overview.md` |
| 실행·배포 구조 | `docs/architecture.md` |
| 제품 우선순위 | `docs/roadmap.md` |
| 디자인 토큰의 실제 값 | `frontend/app/globals.css` |
| 디자인 원칙과 사용법 | `docs/design.md` |
| 백엔드 필수 구현 규칙 | `docs/backend/README.md` |
| 기능별 현재 요구사항 | `openspec/specs/*/spec.md` |
| 변경 중인 요구사항 | `openspec/changes/<change>/` |

문서에는 다른 단일 출처의 값을 복사하지 않고 필요한 경우 링크한다. 특히 색상값은 CSS, 배포 구성은 compose와 architecture, 기능 요구사항은 base spec을 기준으로 한다.

## 5. OpenSpec 종료 절차

`backend-first-deployment` change는 구현된 코드와 작업표를 항목별로 대조한다. 구현이 확인된 작업만 완료 표시한 뒤 delta spec을 base spec에 동기화하고 strict validation을 통과시킨다. 배포 관련 후속 PR #20, #21의 runner label과 SQLite 권한 수정까지 반영한 뒤 archive한다.

모든 이후 change는 다음 순서로 종료한다.

1. 작업표와 구현을 대조한다.
2. 관련 테스트와 문서를 확인한다.
3. strict validation을 실행한다.
4. delta spec을 base spec에 동기화한다.
5. 배포와 운영 검증이 끝난 change만 archive한다.

## 6. 로컬 OpenSpec 검증 설계

CI 대신 하나의 저장소 스크립트를 에이전트 규칙과 선택적 Git 훅이 함께 사용한다.

```text
scripts/validate-openspec.sh
        ^             ^
AGENTS.md 규칙    .githooks/pre-push
```

### 구성요소

- `scripts/validate-openspec.sh`
  - 저장소 루트를 기준으로 실행한다.
  - `openspec` 실행 파일이 없으면 설치 방법과 함께 실패한다.
  - `openspec validate --all --strict`를 실행하고 종료 코드를 그대로 반환한다.
- `.githooks/pre-push`
  - 모든 push 전에 검증 스크립트를 호출한다.
  - 검증 실패 시 push를 중단한다.
- `AGENTS.md`
  - OpenSpec을 수정하거나 change를 완료·동기화·아카이브할 때 검증 스크립트를 반드시 실행하도록 명시한다.
- `docs/git-strategy.md`
  - 최초 1회 `git config core.hooksPath .githooks`로 훅을 활성화하는 방법을 설명한다.

훅은 clone 시 자동 활성화되지 않는다. 따라서 훅 미설치 환경에서도 에이전트 규칙이 같은 스크립트를 직접 실행하게 한다. 검증 로직은 훅과 문서에 중복 작성하지 않는다.

## 7. PR 체크리스트

PR 템플릿은 변경과 관련 있는 항목만 확인하는 조건부 체크리스트로 유지한다.

- 테스트 또는 수동 검증 결과
- 환경변수의 build-time/runtime 구분
- DB schema, mount, UID/GID, 백업·복구 영향
- runner label, CPU architecture, container health
- 실패 시 rollback 또는 기능 비활성화 방법
- 문서와 OpenSpec 갱신·아카이브 여부
- 모바일·데스크톱·접근성 확인이 필요한 UI 변경 여부

관련 없는 항목에 긴 설명을 강제하지 않으며, PR 본문이 체크리스트 복사본으로 비대해지지 않게 한다.

## 8. 로드맵 운영 방식

북극성 목표는 검색을 통해 발견된 독자가 콘텐츠를 의미 있게 읽고, 소유자가 운영 부담 없이 글과 기능 실험을 계속 추가할 수 있는 개인 콘텐츠 자산이다.

- 고정된 월간 수량이나 마감일을 두지 않는다.
- 작은 backlog 항목을 한 번에 하나씩 꺼내 처리한다.
- 단기 순서는 측정 기반, 조회수 API, 소유자 대시보드, 댓글 관리다.
- 기술 판단 순서는 신규 아이디어, 데이터 보존, 보안, 기술 부채, 성능이다.
- 작은 기능은 운영에 직접 배포하고, DB 변경이나 복구가 어려운 변경만 별도 검증한다.
- 최상위 위험은 복잡성과 유지 부담 때문에 프로젝트를 가꾸지 않게 되는 것이다.

초기 핵심 지표는 조회수 자체가 아니라 검색 유입 후 의미 있는 읽기의 비율과 추세다. 정확한 이벤트 조건과 수치 목표는 GA4와 Search Console 기준선을 확보한 뒤 결정한다.

## 9. 검증과 완료 조건

정리가 완료되려면 다음 조건을 모두 만족해야 한다.

1. 모든 활성 문서가 `docs/README.md` 또는 `openspec/README.md`에서 발견된다.
2. 이동 후 Markdown 내부 링크 검사에서 깨진 링크가 없다.
3. `openspec validate --all --strict`가 성공한다.
4. `backend-first-deployment` change가 base spec에 반영되고 archive된다.
5. 디자인, 배포, 로드맵 문서가 현재 코드와 충돌하지 않는다.
6. `AGENTS.md`의 필독 문서 목록이 새 경로와 일치한다.
7. 게시물 Markdown 파일 40개의 경로와 이름이 바뀌지 않는다.
8. Git 훅을 활성화한 환경에서 OpenSpec 검증 실패가 push를 중단한다.

## 10. 단계별 적용

- P0: 인덱스, 아카이브 이동, 현재 문서 갱신, OpenSpec 동기화·검증, PR 체크리스트, 검증 스크립트·훅
- P1: 백엔드 문서 분할, 링크·문서 상태 검사, 프론트엔드 QA 체크리스트, 데이터 restore 검증
- P2: 반복 사용이 확인된 readiness 스킬, 원격 브랜치 자동 정리, 근거 기반 성능 검사

이번 실행은 승인된 P0까지만 다룬다. P1과 P2는 별도 시작점에서 범위와 성공 조건을 다시 확인한다.

## 11. 브랜치와 PR

- 모든 변경은 `main`에서 분기한 `refactor/documentation-operations`에서 수행한다.
- 설계 기록, 문서 이동, OpenSpec 정리, 훅과 체크리스트 변경을 `main`에 직접 커밋하지 않는다.
- 전체 검증이 끝나면 작업 브랜치를 push하고 `refactor: 문서·개발 운영 체계 정리` 제목의 PR을 만든다.
- PR 본문에는 이동한 문서, 링크 영향, OpenSpec 동기화 결과, 훅 활성화 방법, 보류한 P1·P2를 기록한다.
- 검토가 끝난 PR만 squash merge하며 `main`은 PR 머지 전까지 `origin/main`과 동일하게 유지한다.
