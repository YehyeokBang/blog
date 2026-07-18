# Git·브랜치·PR 전략

단일 개발자 환경의 단순한 GitHub Flow를 사용한다. `main`은 production 배포 기준이고 모든 변경은 짧은 작업 브랜치와 PR을 거쳐 squash merge한다.

## 저장소 구조

```text
blog/
├── AGENTS.md       # 전체 에이전트 운영 규칙
├── frontend/       # Next.js 정적 frontend
├── backend/        # Kotlin·Spring backend laboratory
├── content/posts/  # Markdown 콘텐츠 정본
├── docs/           # 활성 문서와 과거 기록
├── openspec/       # base spec, change, archive
└── .github/        # PR template과 GitHub Actions
```

frontend와 backend는 같은 저장소에 있지만 실행·배포 단위는 분리한다. API와 consumer를 함께 바꿔야 할 때는 한 PR에서 원자적으로 변경한다.

## 브랜치

- `main`: production-ready 기준. 직접 커밋하지 않는다.
- `develop`은 두지 않는다.
- 작업 브랜치는 최신 `main`에서 `[prefix]/[task-name]` 형식으로 만든다.
- 예: `feat/view-count`, `fix/comment-validation`, `refactor/documentation-operations`

## 커밋

형식은 `<영문 Conventional Commit prefix>: <한국어 설명>`이다.

| Prefix | 용도 |
|---|---|
| `feat` | 사용자에게 보이는 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서만 변경 |
| `style` | 의미 없는 formatting·style 변경 |
| `refactor` | 기능 변화 없는 코드 구조 변경 |
| `perf` | 측정된 성능 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | build, 설정, 보조 도구 |

브랜치에서는 검토 가능한 의미 단위로 커밋한다. PR은 squash merge하므로 `main`에는 PR 하나가 커밋 하나로 남는다.

## OpenSpec 변경 흐름

새 기능이나 동작 변경은 다음 순서를 따른다.

1. 작업 브랜치에서 `openspec/changes/<change>/`의 proposal, design, delta spec, tasks를 작성하고 승인받는다.
2. tasks와 delta spec을 기준으로 구현하고 근거가 확인된 항목만 완료 표시한다.
3. OpenSpec을 수정할 때마다 저장소 루트에서 `./scripts/validate-openspec.sh`를 실행한다.
4. 구현과 테스트를 대조한 뒤 delta spec을 `openspec/specs/`의 base spec에 동기화한다.
5. strict validation과 필요한 배포·운영 검증을 확인한다.
6. `openspec archive <change-name> --yes`로 완료 change를 archive한다.

버그 수정, 오타, 단순 refactor는 별도 change 없이 진행할 수 있다. 다만 기존 요구사항이 바뀌면 관련 base spec을 함께 갱신한다.

## 로컬 pre-push 훅

clone 후 한 번 다음 명령으로 저장소의 추적된 훅을 활성화한다.

```bash
git config core.hooksPath .githooks
```

활성화하면 push 전에 `.githooks/pre-push`가 `scripts/validate-openspec.sh`를 실행한다. 훅 설정은 clone에 포함되지 않으므로 OpenSpec 작업자는 설정 여부와 관계없이 같은 스크립트를 직접 실행해야 한다.

## 문서 검사

문서·아카이브·인덱스를 변경한 PR 전에는 다음 명령을 직접 실행한다.

```bash
node --test scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
```

이 검사는 Markdown 상대 링크, 활성 문서와 base spec의 인덱스 도달성, 일반 문서 archive의 상태 메타데이터를 확인한다. OpenSpec 요구사항 검증은 별도이므로 `./scripts/validate-openspec.sh`도 함께 실행한다.

## Pull Request와 merge

- PR 제목도 `<prefix>: <한국어 설명>` 형식을 따른다.
- 별도 issue tracker 대신 PR이 변경 이유와 검증 기록을 보존한다.
- 본문은 `.github/pull_request_template.md`를 따르고 관련 있는 조건부 체크만 작성한다.
- review와 검증이 끝난 뒤 squash merge한다.

## `gh` 인증

이 저장소의 GitHub 작업은 개인 계정 `YehyeokBang`만 사용한다. `gh` 명령 전에 `gh auth status`로 인증 상태를 확인한다. 인증이 유효하지 않거나 다른 계정이 active이면 임의로 전환하거나 다른 계정을 사용하지 말고 사용자에게 알린다.
