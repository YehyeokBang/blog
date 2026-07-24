# CTO 프로젝트 진단 보고서

> **2026-07-24 stabilization 정정:** P1-C~F는 `WEEK-1-STABILIZATION-RESULT.md`의 회귀 테스트와 구현으로 수정됐다. 이 문서는 2026-07-23 기준 진단 기록으로 보존하며, 최신 판정과 미확인 운영 항목은 결과 문서를 따른다.

- 평가일: 2026-07-23
- 교차검증일: 2026-07-24
- 평가 기준: `main` 브랜치, commit `4ab0717`
- 평가 범위: 저장소의 코드, 설정, 테스트, 문서, OpenSpec, Git history
- 제외 범위: 브라우저 QA, 실제 iOS 검증, production 접속, GitHub 설정, GA4·Search Console 데이터, 온라인 취약점 조회
- 변경 범위: 이 보고서 파일 생성만 수행했으며 코드와 설정은 변경하지 않음
- 교차검증 방식: 제품 기획자, 독립 CTO 레드팀, 평가 방법론 감사자가 서로 다른 루브릭으로 독립 검토한 뒤 원문과 대조

> **교차검증 정정:** 최초 진단의 방향은 대체로 유지되지만, `66/100`은 앵커와 감점 원장이 없어 재현 가능하지 않았고 `P0` 4건은 severity가 과장됐다. 아래 점수와 심각도는 교차검증 후 수정된 최종 판정이며, 상세 정정 원장은 10절에 있다.

## 1. 결론

### 한 줄 평가

**프로젝트의 핵심 아키텍처와 학습 방향은 좋지만, 현재는 “기능을 더 만들 단계”가 아니라 “정본과 release gate를 다시 믿을 수 있게 만드는 단계”다.**

Markdown 정본, 정적 frontend, 분리된 Spring backend, SQLite, same-origin API, backup·migration 같은 큰 결정은 개인 블로그와 백엔드 학습실이라는 목표에 잘 맞는다. Next build와 실행한 선택적 test suite는 통과했지만 standalone typecheck는 실패했고, 실제 복구·배포 계약에는 코드상 결함이 남아 있다.

그러나 다음 세 가지 때문에 신규 기능 확장은 보류하는 편이 안전하다.

1. 빈 DB에서 현재 schema를 재구축할 baseline migration이 없고, pre-migration backup이 중첩 시 성공으로 건너뛰어질 수 있다.
2. `main`, OpenSpec task, base spec, CI가 서로 다른 완료 상태를 말한다.
3. 최근 투자가 북극성인 측정·콘텐츠 자산보다 custom pull-to-refresh 복잡도에 과도하게 배분됐다.

### 종합 점수

**57 / 100 — 관측 범위 51–66, stateful 확장 보류**

이 점수는 “사이트가 동작하는가”보다 “다음 변경을 안전하고 지속 가능하게 반복할 수 있는가”를 더 크게 본 결과다. 개인 프로젝트라는 규모를 반영해 Kubernetes, MSA, 무중단 배포, 대규모 조직 프로세스는 평가 기준에서 제외했다. production, GitHub required check, 실제 restore, iOS, GA 상태처럼 코드로 확인할 수 없는 항목은 실패로 간주하지 않고 점수 범위에만 반영했다.

| 평가 영역 | 배점 | 영역 점수 | 가중 점수 | 판정 |
|---|---:|---:|---:|---|
| 제품 정렬 | 15 | 6/10 | 9 | 목표는 선명하나 측정 전에 상호작용 복잡도가 증가 |
| 아키텍처·데이터 | 20 | 7/10 | 14 | 경계는 적절하나 빈 DB bootstrap과 failure semantics에 결함 |
| Change assurance | 20 | 5/10 | 10 | 로컬 검사는 있으나 CI·핵심 계약·release gate 연결이 불완전 |
| 보안·개인정보 | 15 | 6/10 | 9 | 기본 방어는 있으나 저장 외부 URL과 host trust gap 존재 |
| 전달·복구·관측 | 20 | 5/10 | 10 | health·local backup은 있으나 backup 실행 경로와 restore가 취약 |
| 거버넌스·유지보수 | 10 | 5/10 | 5 | 문서 구조는 좋지만 task·base spec·main 정합성이 깨짐 |
| **합계** | **100** |  | **57** | **stateful 신규 기능보다 복구·release 안정화 우선** |

산식은 `Σ(영역 배점 × 영역점수 / 10)`이며 영역 점수는 0.5점 단위다.

| 영역 | 동일하게 확인하는 네 control | 가중 점수 범위 |
|---|---|---:|
| 제품 정렬 | 북극성, roadmap trace, 측정, 투자 배분 | 9–10.5 |
| 아키텍처·데이터 | 경계, 식별자, failure semantics, query/data 계약 | 13–15 |
| Change assurance | test coverage, type/static check, CI parity, release gate | 9–11 |
| 보안·개인정보 | untrusted input/resource, cookie/API, host/container, supply chain | 7.5–10.5 |
| 전달·복구·관측 | deploy health, migration/rollback, backup/restore, telemetry | 8–13 |
| 거버넌스·유지보수 | SSoT, task evidence, 문서 동기화, complexity/entrypoint | 4.5–6 |
| **합계** | unknown 외부 상태의 최소–최대 | **51–66** |

- **0점:** 기준이 없거나 기본 경로에서 구조적 실패가 발생한다.
- **5점:** 기준과 일부 통제는 있으나 중요한 경로가 수동이거나 미검증이다.
- **10점:** end-to-end 계약이 자동화된 gate와 운영 근거로 검증된다.
- 같은 원인의 여러 증상은 primary 영역에서 한 번만 감점한다.
- 직접 코드·설정과 대응 테스트는 신뢰도 A, 직접 코드만은 B, 문서·체크박스만은 C, 외부 미확인은 U로 분류한다.

운영 판정 임계값은 `85–100: 확장 가능`, `70–84: 관리된 gap 하 운영`, `50–69: 핵심 운영은 가능하나 고위험 확장 보류`, `<50: stateful 변경 no-ship`으로 고정한다. 현재 point estimate는 57이므로 정적 콘텐츠 운영을 중단할 근거는 없지만 새 migration·동적 상태 기능은 보류한다.

심각도는 점수와 분리한다.

- **P0:** 현재 기본 경로에서 재현되는 데이터 손실·서비스 중단·중대한 보안 침해.
- **P1:** 다음 관련 배포 전에 막아야 하는 고영향 잠재 위험 또는 필수 release gate 누락.
- **P2:** 현재 정확성을 직접 깨지 않는 성능·유지보수·hardening 문제.
- **Decision:** 기능의 유지·축소·제거 같은 제품 투자 판단.

### 기계적 검증 스냅샷

최초 보고서의 `8.2/10`은 공개된 값으로 재현되지 않아 종합 평가에서 삭제했다. 당시 7·7·10을 단순 평균하면 8.0이지만, category별 7점 앵커와 coverage 기준도 없으므로 유효한 건강도 점수로 사용하지 않는다.

| 항목 | 결과 |
|---|---|
| Type check | `tsc --noEmit` 실패, TS5097 3건 |
| Lint | frontend warning 1건, backend ktlint 통과 |
| Tests | frontend 18건, backend 15건, scripts Node 5건(문서 4, manifest 1) 통과 |
| Dead code | 전용 도구 미설치로 제외 |
| Shell lint | `shellcheck` 미설치로 제외 |

**선택적으로 실행한 검사는 대체로 통과하는 반면, 무엇이 production-ready인지 결정하는 통제와 복구 체계가 약하다**는 정성적 결론만 유지한다.

## 2. 현재 프로젝트에 대한 이해

### 제품

- 40개 Markdown 게시글을 정본으로 보유한다.
- 검색 유입 후 의미 있게 읽힌 비율과 추세를 북극성으로 둔다.
- 작성자는 한 명이며 공개 글쓰기 플랫폼이나 범용 CMS를 만들지 않는다.
- frontend·backend를 분리하고 backend를 조회수, 좋아요, 검색 등의 학습 실험실로 사용한다.

### 시스템

```text
content/posts/*.md
       │
       ├── Next.js static export ── Nginx ──┐
       │                                    │
       └── posts.json manifest ─────────┐    │
                                        ▼    ▼
Internet ── Traefik ── /api/* ── Spring Boot
                   └── other ─── frontend    │
                                             ▼
                                /opt/blog/data/blog.db
```

### 전달 흐름

```text
작업 브랜치
  → OpenSpec change
  → PR CI
  → main
  → arm64 image build
  → SQLite backup·migration
  → docker compose health wait
  → production
```

구조 자체는 단순하고 설명 가능하다. 문제는 위 흐름의 각 gate가 선언과 다르게 느슨하다는 점이다.

## 3. 잘한 결정

### 3.1 Markdown filename을 외부 식별자로 고정한 결정

`content/posts/<slug>.md`를 콘텐츠와 backend 동적 데이터의 공통 식별자로 사용하고 rename을 금지했다. 정적 콘텐츠와 DB 데이터를 느슨하게 연결하면서도 영속성을 확보한 현실적인 선택이다.

근거:

- `docs/project-overview.md:24-26`
- `AGENTS.md:76-78`
- `backend/src/main/kotlin/xyz/yehyeok/blog/post/domain/PostManifestSynchronizer.kt`

### 3.2 frontend와 backend의 역할 분리

본문과 SEO는 정적 frontend가, 댓글·좋아요 같은 동적 상태는 backend가 담당한다. backend가 전체 article API를 소유하지 않아 Markdown 정본과 정적 SEO를 유지한다. 개인 블로그에서 backend 학습을 위해 frontend까지 동적으로 바꾸지 않은 것이 좋다.

### 3.3 좋아요 API의 desired-state 계약

`PUT=liked`, `DELETE=unliked`로 재시도 안전성을 확보했고, `(post_id, visitor_id)` unique constraint로 중복 좋아요를 막았다. cookie 원문 대신 SHA-256 digest를 저장하고 `Origin` allowlist, `HttpOnly`, `Secure`, `SameSite=Lax`, edge rate limit을 함께 사용한 점도 좋다.

근거:

- `backend/src/main/kotlin/xyz/yehyeok/blog/engagement/api/EngagementController.kt`
- `backend/src/main/kotlin/xyz/yehyeok/blog/engagement/infra/PostLikeRepository.kt`
- `backend/src/main/resources/db/migration/V1__post_engagement.sql`
- `docker-compose.yml:61-73`

### 3.4 데이터 보존을 image와 분리한 배포 구조

backend는 non-root UID/GID `10001:10001`로 실행하고 SQLite는 host bind mount에 보관한다. backend image에 DB가 들어가지 않도록 `.dockerignore`도 구성했다. SHA image tag와 health wait라는 기반도 있다. 다만 실제 workflow가 변경되지 않은 서비스에 `latest`를 다시 선택하므로 이 기반이 end-to-end rollback 보장으로 이어지지는 않는다.

### 3.5 문서의 진입 구조

`docs/README.md`, `openspec/README.md`, backend 역할별 문서는 새 합류자가 프로젝트를 탐색하기 좋다. 이전 리뷰 이후 활성 문서와 archive를 분리한 개선은 실제 효과가 있다.

### 3.6 과한 플랫폼 도입을 피한 점

현재 규모에서 SQLite, Docker Compose, 단일 Spring application은 적절하다. PostgreSQL, Redis, Kafka, Kubernetes, MSA를 미리 도입하지 않은 것은 올바른 절제다.

## 4. 핵심 문제

### 최초 P0 후보의 교차검증 결과

**최종 판정에서 P0는 0건이다.** 아래 사실은 대부분 유효하지만, 코드만으로 현재 진행 중인 전손·전면 장애·host compromise를 입증하지 못했다. 따라서 release governance와 avatar trust는 P1, 콘텐츠 목록의 방어적 error handling은 P2로 재분류한다.

#### P1-A. `main`과 OpenSpec release evidence가 모순된다

**사실**

- 평가 시작 시 `main`과 `origin/main`은 `4ab0717`이며 기존 변경은 없었다.
- `post-engagement-production`은 `0/31` task 완료 상태이며 approval gate도 미완료로 기록됐지만 engagement 제품 코드와 migration은 commit `1f4043f`로 `main`에 머지됐다.
- `mobile-scroll-ux`는 `21/39`만 완료됐다.
- 실제 iOS Safari gate 3건이 모두 미완료이며, 스펙은 하나라도 미충족이면 release와 base sync를 중단하도록 요구한다.
- 그럼에도 관련 코드는 commits `b816c66`, `4ab0717`로 `main`에 머지됐다.

근거:

- `openspec/changes/post-engagement-production/tasks.md:3-48`
- `openspec/changes/mobile-scroll-ux/tasks.md:53-62`
- `docs/git-strategy.md:3`
- Git commits `1f4043f`, `b816c66`, `4ab0717`

**판단**

`mobile-scroll-ux`는 명시적인 iOS release gate와 `main` 상태가 직접 충돌한다. 반면 engagement는 production 검증 후 archive하는 흐름 때문에 active change가 `main`에 존재하는 것 자체는 위반이라고 단정할 수 없다. 다만 approval부터 0/31인 기록은 실제 승인·구현 근거를 재현하지 못한다. 즉, **모바일은 release gate 위반이 확인됐고 engagement는 evidence 기록 실패가 확인됐지만 승인 우회 여부는 미확인**이다.

**권고**

신규 기능을 잠시 중단하고 두 change를 먼저 결산한다.

1. 구현·테스트·배포 근거가 있는 task만 체크한다.
2. 근거가 없는 기능은 검증하거나 rollback한다.
3. delta를 base spec에 동기화한다.
4. production 검증 후 archive한다.

특히 custom pull-to-refresh는 추가 투자를 멈추고, iOS gate를 실제 집행한 뒤 유지 또는 rollback을 결정해야 한다.

#### P1-A에 병합. base sync gate가 집행되지 않았다

`./scripts/validate-openspec.sh`는 10/10 통과했다. 그러나 base spec과 실제 코드에는 다음 충돌이 있다.

| 주제 | base spec | 실제 코드·활성 문서 |
|---|---|---|
| mobile thumbnail | `sm` 미만에서 숨김 (`openspec/specs/blog-rendering/spec.md:24`) | mobile에서 상단 가로 이미지 노출 (`docs/design.md:76`, `PostList.tsx:155-158`) |
| feed click target | tag 외 카드 전체 클릭 (`blog-rendering/spec.md:26-28`) | 제목과 thumbnail만 Link |
| local image | `.png` 예시와 응답 (`blog-rendering/spec.md:9-13`) | local image는 `.webp`만 허용 (`frontend/lib/markdown.ts:55-63`) |
| favicon | `/favicon.ico` 32×32 (`seo-metadata/spec.md:25-27`) | `app/icon.svg`만 존재, build route도 `/icon.svg` |
| scroll owner | `window.scrollY`, root document, 소개 포함 | 전용 content scroll container, 소개 제외 |
| current capabilities | base spec이 현재 요구사항의 기준 | engagement와 scroll capability가 base spec에 없음 |

**판단**

validator는 설계대로 OpenSpec 구조를 검사할 뿐 의미 정합성을 보장하지 않는다. 결함의 주체는 validator가 아니라, `AGENTS.md:33-36`과 `docs/git-strategy.md:48-53`이 별도 단계로 정한 구현 대조·base sync·운영 검증이 집행되지 않은 release workflow다. 따라서 P1-A의 동일 원인으로 한 번만 감점한다.

**권고**

- CI에 syntax validation과 별도로 `base spec ↔ 코드/활성 문서 대조` 체크리스트를 둔다.
- 신규 behavior가 `main`에 들어가기 전에 base sync 또는 archive를 필수 required check로 만든다.
- 자동화가 어려운 의미 검증은 PR 본문에 요구사항별 근거 링크를 남긴다.

#### P2-A. 콘텐츠 목록 조회가 fail-fast가 아니라 fail-silent다

`frontend/lib/markdown.ts:91-98`의 `getPostSlugs()`는 디렉터리 읽기 실패를 로그만 남기고 빈 배열로 바꾼다.

```ts
try {
  const files = await fs.readdir(postsDirectory);
  return ...;
} catch (error) {
  console.error(...);
  return [];
}
```

이 함수만 보면 콘텐츠 경로 또는 권한 오류가 “게시글이 0개인 정상 사이트”로 바뀐다. 다만 PR CI가 먼저 `scripts/generate-posts-manifest.mjs`를 실행하고 이 스크립트는 누락·빈 디렉터리에서 실패하므로 현재 pipeline에는 별도의 fail-fast backstop이 있다. 또한 base spec의 명시적 fail-fast scenario는 frontmatter와 이미지 규칙이며 디렉터리 read 실패를 직접 규정하지 않는다. 따라서 최초 P0 판정은 과장이고, 중복된 함수 계약을 정리할 P2 방어 강화로 본다.

**권고**

- 예외를 다시 던져 build를 실패시킨다.
- 빈 콘텐츠 목록도 명시적으로 build 실패시킨다.
- 임시 디렉터리에서 정상, 없는 디렉터리, 빈 디렉터리, 잘못된 frontmatter를 자동 테스트한다.
- 해당 테스트를 frontend CI에서 실행한다.

#### P1-B. 공개 댓글이 임의의 외부 image URL을 영구 주입할 수 있다

댓글 API는 `authorAvatar`를 non-blank, 최대 200자로만 검증한다. frontend는 저장된 값을 그대로 `<img src={comment.authorAvatar}>`에 사용한다.

근거:

- `backend/src/main/kotlin/xyz/yehyeok/blog/comment/api/dto/CommentDto.kt:9-13`
- `frontend/components/CommentSection.tsx:220-228`

공격자는 자신의 서버 URL을 avatar로 저장해 모든 댓글 독자의 IP·User-Agent·접속 시각을 수집하는 tracking pixel을 삽입할 수 있다. 이는 React의 HTML escaping과 무관한 외부 resource trust 문제다.

host compromise나 script 실행 경로는 확인되지 않았으므로 P0는 아니다. 그러나 공개 입력이 제3자 추적을 모든 독자에게 영구 전파하므로 다음 댓글 배포 전에 막아야 할 P1이다.

**권고**

- URL 자체를 저장하지 말고 backend가 허용된 avatar seed 또는 enum만 받는다.
- frontend가 고정된 trusted provider URL을 seed로 조합하거나 avatar를 자체 호스팅한다.
- 단기 완화는 `https://api.dicebear.com/` exact host allowlist와 HTTPS 강제다.
- 기존 DB의 외부 host 값을 점검하고 표시를 차단한다.
- `Content-Security-Policy`의 `img-src`도 allowlist와 맞춘다.

### 교차검증에서 새로 확인한 P1

#### P1-C. 예약 backup이 deploy가 만든 root 소유 lock에서 실패할 수 있다

**사실**

- deploy는 `/opt/blog/backups`를 runner 소유로 만든 뒤 backup을 `sudo`로 실행한다 (`.github/workflows/deploy.yml:156-170`).
- backup script는 `umask 077` 상태에서 `backup.lock`과 log를 만든다 (`scripts/backup-sqlite.sh:9-22`).
- 예약 workflow는 같은 script를 `sudo` 없이 실행한다 (`.github/workflows/backup.yml:8-16`).

**판단**

deploy가 최초 생성한 `backup.lock`이 root 소유 `0600`이면 self-hosted runner가 다음 예약 실행에서 파일을 열지 못할 수 있다. 코드만으로 현재 운영 파일의 실제 소유권은 확인하지 못했지만, 기본 명령 조합 자체에 재현 가능한 권한 불일치가 있다.

**권고**

- deploy와 예약 backup의 실행 사용자를 하나로 통일한다.
- lock, log, backup 파일의 owner/mode를 CI에서 검증한다.
- 마지막 성공 시각과 backup age를 외부에서 확인 가능하게 한다.

#### P1-D. backup 중첩 시 pre-migration backup이 fail-open 된다

backup script는 lock 획득 실패를 성공 코드 `0`으로 종료한다 (`scripts/backup-sqlite.sh:22-25`). deploy는 반환 상태를 구분하지 않고 바로 migration을 실행한다 (`.github/workflows/deploy.yml:167-170`). 예약 backup과 deploy는 공통 concurrency group도 없다.

따라서 두 작업이 겹치면 “다른 backup이 실행 중”이라는 이유로 pre-migration snapshot을 만들지 않고도 migration이 계속될 수 있다. 일반 예약 작업에서는 skip이 합리적이지만 release gate에서는 wait 또는 fail-closed여야 한다.

#### P1-E. 빈 DB에서 현재 schema를 재구축할 수 없다

deploy는 DB가 없으면 빈 파일을 만든다 (`.github/workflows/deploy.yml:162-165`). 그러나 유일한 versioned migration `V1__post_engagement.sql`은 이미 존재하는 `post` table을 FK로 참조하고 `comment` table에 index를 만든다. migration test도 먼저 두 table을 수동 생성한다 (`scripts/migrate-sqlite.test.sh:14-19`). production은 `ddl-auto: validate`라 기본 table을 만들지 않는다 (`backend/src/main/resources/application.yml:10-14`).

이는 신규 host와 완전 재해 복구에서 빈 DB부터 schema를 재현할 수 없다는 뜻이다. 현재 DB가 정상이어도 복구 가능성의 핵심 계약이 빠져 있으므로 stateful 신규 기능보다 먼저 baseline migration과 empty-DB bootstrap test가 필요하다.

#### P1-F. 변경되지 않은 서비스가 검증되지 않은 `latest`로 이동할 수 있다

새로 build된 서비스에는 `sha-<commit>`을 쓰지만, build가 skip된 서비스에는 `latest`를 기록한 뒤 두 image를 모두 pull한다 (`.github/workflows/deploy.yml:171-179`). 예를 들어 backend image build는 성공했지만 deploy가 실패하면 `latest`는 미검증 backend를 가리킬 수 있다. 이후 frontend-only 배포는 backend를 build하지 않고 그 `latest`를 선택해 의도치 않게 backend까지 교체할 수 있다.

**권고**

- 현재 성공 배포의 frontend/backend SHA를 각각 durable state로 기록한다.
- 변경되지 않은 서비스는 그 SHA를 그대로 재사용한다.
- frontend와 backend 모두 직전 성공 SHA rollback 입력과 rehearsal을 제공한다.

#### P1-G. 공개 댓글 운영 계약이 완성되지 않았다

- UI는 부적절한 댓글이 “통보없이 삭제될 수 있다”고 알리지만 API는 GET/POST뿐이며 hide/delete 경로가 없다 (`CommentSection.tsx:188-190`, `CommentController.kt:21-43`).
- `authorName`은 길이 제한이 없고 댓글 조회는 pagination 없이 전체 목록을 반환한다.
- 장기 누적·분산 요청은 DB 저장량뿐 아니라 모든 독자의 응답과 DOM 비용을 함께 키운다.

moderation은 2–3개월 뒤의 새 기능이 아니라 이미 공개 UGC를 연 서비스의 운영 조건이다. 최소 hide/delete, 작성자 이름 제한, pagination 또는 상한을 다음 기능보다 앞당긴다.

### 기존 P1 항목의 교차검증 결과

#### P1-1. CI assurance cluster가 불완전하다

현재 PR CI:

- frontend: `npm run lint`, `npm run build`
- backend: backup shell test, `ktlintCheck test build`

빠진 항목:

- frontend Node tests 18건
- standalone `tsc --noEmit`
- `scripts/migrate-sqlite.test.sh`
- 문서 테스트와 문서 검사
- OpenSpec strict validation
- image/compose/schema verification

`frontend/package.json`에도 통합 `test` script가 없고 세 개의 test script가 분산돼 있다.

**권고 CI 최소선**

```text
frontend:
  npm ci
  npm run typecheck
  npm test
  npm run lint -- --max-warnings=0
  NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build

backend:
  ./gradlew ktlintCheck test build

repository:
  bash scripts/migrate-sqlite.test.sh
  bash scripts/backup-sqlite.test.sh
  node --test scripts/*.test.mjs
  node scripts/check-documentation.mjs
  ./scripts/validate-openspec.sh
```

현재 local `core.hooksPath`도 설정되지 않아 `.githooks/pre-push`가 동작하지 않는다. 개인 설정에 의존하는 검증은 CI required check로 옮기는 편이 안전하다.

#### P1-2. standalone TypeScript type check가 실패한다 — P1-1의 하위 증거

`tsc --noEmit`은 test 파일의 `.ts` extension import 때문에 TS5097 3건으로 실패한다.

- `frontend/lib/content-refresh.test.ts:3`
- `frontend/lib/engagement.test.ts:8`
- `frontend/lib/scroll-ux.test.ts:17`

Next build는 통과하지만 범용 TypeScript 검증은 깨져 있다. `allowImportingTsExtensions`를 명시하거나 app/test용 tsconfig를 분리해 한 가지 공식 typecheck 명령을 만들어야 한다.

#### Decision-1. custom pull-to-refresh의 비용이 사용자 가치보다 클 가능성이 높다

최근 두 commits의 변화량:

- `b816c66`: 1,834 insertions / 59 deletions
- `4ab0717`: 634 insertions / 141 deletions
- 합계: 2,468 insertions / 200 deletions

현재 `PullToRefresh.tsx`는 411줄이고, scroll context, refresh context, static JSON route, TOC와 top button의 scroll owner 변경까지 파급된다. 반면 이 기능이 해결하는 핵심 상황은 “사용자가 페이지를 열어 둔 사이 새 정적 배포가 끝났고, header와 theme를 유지하며 새 payload만 읽고 싶을 때”다.

로드맵의 Now는 측정 기반, 의미 있는 읽기 이벤트, 조회수 API다. 프로젝트가 스스로 선언한 최상위 위험도 유지 복잡성이다.

근거:

- `docs/roadmap.md:16-27`
- `docs/roadmap.md:57-59`
- `frontend/components/PullToRefresh.tsx`
- `frontend/components/ContentScrollShell.tsx`

**CTO 권고**

추가 투자는 중단한다. 코드 규모와 roadmap 이탈은 제거 후보가 될 충분한 신호지만, 실제 사용 가치와 iOS 회귀를 확인하지 않은 코드 전용 검토만으로 즉시 rollback을 확정할 수는 없다. 실기기 gate를 통과시키고 유지 비용을 수용하거나, custom pull-to-refresh와 content refresh route만 제거해 native refresh로 돌아가는 두 선택지를 명시적으로 결정한다. 고정 header, back-to-top, TOC 개선은 독립적으로 유지할 수 있다.

유지를 선택한다면 다음 비용을 받아들여야 한다.

- 실제 iOS Safari 회귀 검증을 release마다 수행
- browser integration test 보유
- inner scroll로 바뀐 focus, anchor, browser find, history restoration, pull gesture를 지속 검증
- OpenSpec을 실제 content scroll 구현으로 재작성

#### P2-B. feed projection이 DB query N+1을 만든다

`EngagementService.getPage()`는 post page를 조회한 뒤 각 post마다 `snapshot()`을 호출한다. 각 snapshot은 좋아요 count와 댓글 count를 별도 query로 실행한다.

20개 page 기준 정적 하한:

```text
post page query 1
+ like count query 20
+ comment count query 20
= 41 queries
```

근거:

- `backend/src/main/kotlin/xyz/yehyeok/blog/engagement/domain/EngagementService.kt:46-48`
- 같은 파일 `:95-105`

Spring Data `Page`의 count query가 실행되면 실제 수는 42 이상일 수 있으나 SQL 계측은 하지 않았다. 현재 트래픽에서는 장애가 아니고 roadmap도 측정된 병목만 최하위 기술 우선순위로 둔다. HTTP N+1을 피하려는 projection 설계는 지키지만 DB aggregation은 비효율적이므로 P1이 아니라 P2다.

**권고**

현재 active page의 post IDs/slugs를 얻은 뒤 두 개의 grouped aggregate query로 like/comment counts를 읽어 map으로 합친다. cache table이나 Redis는 필요 없다.

#### P1-5. engagement 핵심 동시성 계약의 테스트가 없다 — P1-1의 핵심 증거

backend 15개 테스트는 모두 통과했지만 engagement test는 controller integration 3건뿐이다. 다음 OpenSpec 요구는 자동 검증되지 않는다.

- 동시 PUT
- 동시 DELETE
- 경쟁 PUT/DELETE
- invalid page/size
- unknown/inactive/invalid slug
- cookie 전체 속성과 host-only
- cookie 없는 DELETE
- 빈 page와 다중 page
- migration schema version과 restore rehearsal

`EngagementServiceTest`도 없다. 현재 코드의 가장 어려운 계약과 테스트 투자가 반대로 배치돼 있다.

#### P1-6. SQLite backup이 같은 host에만 있다

매일 backup, integrity check, atomic rename, 중첩 방지는 잘 설계됐다. 그러나 source DB와 backup이 같은 Oracle host에 있어 disk/instance/account 손실에는 함께 사라진다. 활성 문서도 이 한계를 인정한다.

근거:

- `docs/architecture.md:66-73`
- `scripts/backup-sqlite.sh`

**권고**

- 원격 object storage 또는 별도 host로 encrypted offsite copy를 추가한다.
- 최소 월 1회 새 임시 경로 restore rehearsal을 자동화한다.
- 7일 daily만 둘지, daily 30일 + monthly 일부 보존이 필요한지 데이터 가치에 맞춰 결정한다.

#### P1-7. migration·deploy 계약이 구현보다 강하게 쓰여 있다

OpenSpec은 다음을 요구하지만 deploy workflow에는 완전히 구현되지 않았다.

- backup부터 migration까지 유지되는 exclusive migration lock
- migration 후 schema 상세 검증
- migration version을 포함한 health
- same-origin API smoke test
- health/smoke 실패 시 자동 또는 명확한 직전 SHA 재적용
- engagement row까지 포함한 restore rehearsal

현재는 backup과 migration이 별도 실행되고, generic actuator health wait 후 workflow가 종료된다. rollback은 수동 dispatch input으로만 준비돼 있다.

**권고**

문서를 낮춰 현재 수동 운영을 정직하게 표현하거나, 실제 gate를 구현한다. 현재 규모에서는 “자동 DB restore”는 여전히 하지 말고, application rollback과 data restore를 분리하는 기존 판단을 유지한다.

#### P2-C. 댓글 조회 실패가 빈 댓글 성공처럼 보인다

`CommentSection`은 non-2xx 응답에서 아무 상태도 설정하지 않고, network error는 console에만 기록한다. 이후 `isLoading=false`가 되어 “가장 먼저 댓글을 남겨보세요”가 표시된다.

근거:

- `frontend/components/CommentSection.tsx:80-94`
- 같은 파일 `:242-246`

이는 사용자 신뢰를 깎는 silent failure다. error state와 retry를 제공하고 JSON schema도 검증해야 한다.

#### P1-9. 운영 관측성이 health와 workflow log에 머문다

코드에서 확인되는 운영 신호는 Actuator health와 GitHub Actions log가 전부다.

최소 권고:

- backend 5xx rate
- API latency
- SQLite busy/locked error
- comment/like mutation 실패 수
- migration/backup 성공 시각과 backup age
- frontend API fetch error

개인 프로젝트에서는 별도 대형 observability stack보다 structured log + 간단한 uptime/alert부터 시작하면 충분하다.

#### P1-10. production host의 trust boundary가 넓다

- Traefik이 `/var/run/docker.sock`을 직접 mount한다. `:ro`는 Docker API의 write operation을 제한하는 보안 경계가 아니다.
- public-facing Traefik이 탈취되면 Docker daemon과 host까지 영향이 확장될 수 있다.
- GitHub Actions는 third-party action과 official action을 version tag로 참조하고 commit SHA로 pin하지 않는다.
- Gradle wrapper에는 `distributionSha256Sum`이 없다.

직접 Docker socket mount는 public edge compromise의 host blast radius를 키우므로 P1이다. Action tag pinning과 Gradle checksum은 별도 공급망 hardening P2이며 같은 severity로 묶어 감점하지 않는다.

**권고**

- Docker socket proxy로 Traefik이 필요한 read API만 허용하거나 file provider를 검토한다.
- Actions를 immutable commit SHA로 pin하고 Dependabot/Renovate로 갱신한다.
- Gradle distribution checksum을 추가한다.
- frontend Nginx도 non-root, read-only filesystem, capability drop 적용 가능성을 검토한다.

### P2. 안정화 후 개선할 문제

#### P2-1. backend 컨벤션이 실제 migration 전략과 충돌한다

`docs/architecture.md`와 production 설정은 SQLite versioned migration + `ddl-auto: validate`를 사용한다. 반면 `docs/backend/quality-and-operations.md:273-280,314`는 SQLite에서 `ddl-auto: update`를 허용하고 Flyway는 PostgreSQL 전환 시에만 도입한다고 적었다.

현재 실제 전략을 기준으로 backend 품질 문서를 갱신해야 한다. custom migration runner를 유지한다면 Flyway와 혼동되지 않도록 “왜 custom runner인지, 언제 교체할지”를 명시한다.

#### P2-2. 문서가 말한 agent instruction 구조와 저장소가 다르다

`AGENTS.md:17`은 별도 agent instruction 디렉터리를 만들지 않는다고 하지만 `.agent/skills`, `.agent/workflows` 12개 파일이 tracked 상태다.

OpenSpec CLI의 generated adapter를 의도적으로 유지하는 것이라면 예외로 문서화한다. 아니라면 저장소에서 제거해 지침의 단일 출처를 회복한다.

#### P2-3. frontend 집중 복잡도와 readability

- `PullToRefresh.tsx`: 411줄
- `CommentSection.tsx`: 250줄
- `TOC.tsx`: 198줄
- `globals.css`: 469줄
- `PostLikeButton.tsx`: 36줄이지만 핵심 JSX가 한 줄에 압축됨

frontend 규칙은 파일 200줄, component 100줄을 refactoring signal로 정의한다. 무조건 분리할 필요는 없지만, PTR을 유지한다면 gesture lifecycle과 DOM adapter를 분리해야 한다. CommentSection은 fetch state, form, list를 feature 단위로 나누는 것이 적절하다.

#### P2-4. Nginx의 정적 자산·보안 기본값

`frontend/default.conf`에는 immutable static asset cache, compression, security headers가 없다.

우선순위:

1. hashed `/_next/static/*` 장기 immutable cache
2. HTML 짧은 cache 또는 revalidation 정책
3. gzip/brotli 중 운영 환경에 맞는 하나
4. `X-Content-Type-Options`, `Referrer-Policy`
5. GA·외부 이미지 정책과 함께 설계한 CSP

#### Product-Now. GA4는 로드되지만 “의미 있는 읽기”는 코드에 없다

`GoogleAnalytics`는 `NEXT_PUBLIC_GA_ID`가 있을 때만 로드된다. production workflow가 secret을 주입하지만 secret이 비어도 build는 성공한다. roadmap의 Now를 달성하려면 다음이 필요하다.

- production에서 GA ID 누락 시 build 실패 또는 명시적 analytics-off 모드
- meaningful read 이벤트 정의
- privacy/cookie disclosure
- 이벤트 cardinality와 중복 전송 방지

Search Console 소유권과 실제 데이터는 코드만으로 확인할 수 없다.

이는 개선 난이도 기준의 P2가 아니라 제품 북극성과 roadmap Now의 1·2번이다. 안정화가 끝날 때까지 2–3개월 미루지 말고, stateful 기능을 동결한 상태에서 운영 기준선 확인과 이벤트 정의를 병행한다.

#### P2-6. 테스트·린트 명령을 한 번에 실행할 수 없다

저장소 root에서 실행 가능한 `verify` entrypoint가 필요하다. Makefile이나 새 도구를 추가할 필요는 없고 `scripts/verify.sh` 하나로 기존 명령을 순서대로 감싸면 충분하다.

#### P2-7. 검색 자산의 canonical·title·freshness 계약이 약하다

- 상세 metadata에 canonical이 없고 Nginx는 extensionless URL과 `.html` 파일 경로를 모두 제공한다 (`frontend/app/posts/[slug]/page.tsx:24-42`, `frontend/default.conf:5-9`).
- 홈 title `"아티클 | Yehyeok's Blog"`에 root template `"%s | Yehyeok's Blog"`가 다시 적용될 수 있어 중복 suffix 위험이 있다 (`frontend/app/page.tsx:6-13`, `frontend/app/layout.tsx:18-20`).
- sitemap `lastModified`는 수정 시각이 아니라 발행일이고 frontmatter에는 `updated`가 없다 (`frontend/app/sitemap.ts:11-14`, `frontend/lib/markdown.ts:20-30`).

실제 생성 HTML과 검색엔진 상태는 제외 범위이므로 중복 title과 index 중복 발생을 확정하지 않는다. 다만 검색 유입이 북극성인 제품에서 canonical URL, title 규칙, 수정일 모델은 N+1 최적화보다 먼저 코드 계약으로 고정할 가치가 있다.

#### Product-Risk. privacy, 콘텐츠 이관, 반응 cold-start의 설명이 없다

- GA4와 1년 익명 좋아요 cookie를 사용하지만 footer에는 privacy/cookie 설명 링크가 없다 (`frontend/app/layout.tsx:54-72`, `EngagementController.kt:97-115`).
- 기존 Velog 현황은 42개지만 저장소 Markdown은 40개다 (`docs/project-overview.md:8-10`). 의도적 제외인지 누락인지 기록이 없다.
- 기존 인기 글의 Velog 좋아요는 118/110/56이지만 새 피드는 새 backend count를 바로 공개한다 (`docs/persona.md:38-44`, `PostList.tsx:121-139`).

법적 적합성이나 실제 사용자 반응은 코드만으로 판정하지 않는다. 그러나 최상위 가치인 콘텐츠 소유권과 독자 신뢰 관점에서 이관 완료 기준, privacy 설명, 반응 수 cold-start 정책은 제품 결정으로 남겨야 한다.

## 5. 전략 평가

### 5.1 유지해야 할 것

| 결정 | CTO 판단 |
|---|---|
| Markdown 정본 | 유지. 프로젝트의 가장 강한 자산 |
| frontend/backend 분리 | 유지. 학습 목표와 제품 목표가 함께 맞음 |
| SQLite | 유지. 현재 규모에 충분 |
| same-origin `/api` | 유지. CORS·cookie 복잡도를 줄임 |
| slug 불변 | 유지. 외부 데이터 결합의 명확한 규칙 |
| Docker Compose | 유지. 단일 host에 적합 |
| 단일 Spring application | 유지. MSA 불필요 |
| count를 row aggregate로 계산 | 유지. 현재는 정합성이 cache보다 중요 |

### 5.2 중단하거나 축소할 것

| 항목 | 권고 |
|---|---|
| custom pull-to-refresh | 추가 투자 중단. 실기기 gate를 통과시키거나 축소/제거 |
| content refresh static JSON routes | PTR 결정에 종속; 독립 가치는 입증되지 않음 |
| 더 세밀한 glass/motion polish | 측정 기반 전까지 중단 |
| PostgreSQL 전환 | 실제 SQLite 한계 전까지 보류 |
| Redis/cache counter | 부하 측정 전까지 보류 |
| AI 요약·추천 | meaningful read baseline 전까지 보류 |
| 공개 검색 | 콘텐츠 탐색 문제가 데이터로 확인될 때까지 보류 |

### 5.3 결과 기반 이상적 상태

```text
현재
  Markdown 자산 + 작동하는 블로그 + backend 실험 기능

안정화 종료
  신뢰 가능한 CI/OpenSpec + offsite restore + 측정 baseline

측정 루프 종료
  조회수/읽기 지표 + 소유자용 작은 dashboard + 댓글 관리

탐색 투자 조건 충족
  실제 데이터가 요구한 검색·탐색 기능만 추가된 낮은 운영비용의 콘텐츠 자산
```

성공의 기준은 기능 수가 아니다.

- 새 글 배포가 부담 없을 것
- 데이터 손실 시 복구할 수 있을 것
- 실패가 사용자와 운영자에게 보일 것
- 다음 기능이 실제 관찰 결과에서 나올 것
- 6개월 후에도 혼자 이해하고 고칠 수 있을 것

## 6. 권장 실행 순서

### 1-3일: stateful 배포 안전 확보

1. deploy와 scheduled backup의 실행 사용자·lock 소유권을 통일한다.
2. pre-migration backup의 lock 중첩을 wait 또는 fail-closed로 바꾼다.
3. 빈 DB부터 전체 schema를 재현하는 baseline migration과 bootstrap test를 만든다.
4. 이 세 항목 전까지 새 DB migration과 stateful 기능 배포를 중단한다.

완료 기준:

- 빈 임시 DB에서 production schema와 application startup을 재현
- deploy backup이 skip됐을 때 migration이 시작되지 않음
- 예약 backup이 deploy 이후에도 같은 사용자로 성공
- 마지막 성공 backup 시각을 확인 가능

### 4-10일: 복구·release gate

1. offsite encrypted backup을 추가한다.
2. restore rehearsal을 실행하고 복구 시간을 기록한다.
3. 변경되지 않은 서비스도 직전 성공 SHA를 유지하도록 image 선택을 고친다.
4. migration version health, same-origin smoke, frontend/backend rollback 절차를 확정한다.
5. CI에 frontend tests, typecheck, migration, docs, OpenSpec을 추가하고 root verify와 일치시킨다.
6. engagement 동시성 계약을 자동 검증한다.

완료 기준:

- host 전체 손실을 가정해 새 경로에서 DB 복구 성공
- 실패한 deploy가 어떤 image로 돌아가는지 명확
- root verify 명령과 PR required checks가 동일
- stateful release gate가 fail-closed

### 11-20일: 공개 상호작용과 정본 결산

1. avatar seed/host 제한, authorName 길이, 댓글 error/retry를 고친다.
2. 최소 hide/delete와 댓글 목록 상한 또는 pagination을 추가한다.
3. 두 active OpenSpec change의 실제 근거를 결산하고 base spec을 동기화한다.
4. custom pull-to-refresh는 추가 투자를 멈추고 실기기 gate 통과 또는 축소/rollback 중 하나를 결정한다.
5. Docker socket blast radius와 최소 운영 alert를 정리한다.

### 그다음: 제품 북극성으로 복귀

1. GA4·Search Console baseline과 privacy/cookie 설명을 확인한다.
2. canonical, title, 수정일 계약을 정리한다.
3. meaningful read event를 한 개만 정의한다.
4. 조회수 API를 가장 단순한 형태로 배포한다.
5. 공개 UI보다 소유자용 조회 화면을 우선한다.

## 7. 의사결정 원칙

앞으로 backlog 항목은 다음 질문을 순서대로 통과시키는 것을 권한다.

1. 독자나 운영자의 실제 문제인가?
2. 측정하거나 관찰한 근거가 있는가?
3. browser/native behavior로 해결할 수 없는가?
4. 기존 코드로 80% 해결할 수 없는가?
5. 실패·rollback·관측 방법이 있는가?
6. 6개월 뒤 혼자 유지할 가치가 있는가?

하나라도 답이 약하면 구현보다 보류가 낫다.

## 8. 실행한 검증

| 검증 | 결과 |
|---|---|
| `git status --short --branch` | 평가 시작 시 `main...origin/main`, 기존 변경 없음; 현재는 이 보고서만 untracked |
| `./node_modules/.bin/tsc --noEmit` | 실패, TS5097 3건 |
| `npm run lint` | 성공, unused `DetailItem` warning 1건 |
| frontend Node tests | 18/18 통과 |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build` | 성공, 88 static pages 생성 |
| `./gradlew ktlintCheck test build --rerun-tasks` | 성공 |
| backend JUnit | 15/15 통과 |
| scripts Node tests | 5/5 통과(문서 검사 4건, manifest 1건) |
| `node scripts/check-documentation.mjs` | 성공 |
| `bash scripts/migrate-sqlite.test.sh` | 성공 |
| `bash scripts/backup-sqlite.test.sh` | local `flock` 미설치로 실행 불가; CI는 Ubuntu에서 실행하도록 구성 |
| `./scripts/validate-openspec.sh` | OpenSpec artifact 10/10 strict validation 통과; 의미 정합성 검증은 아님 |
| `npm ls --depth=0` | exit 0, local optional WASM package 일부 extraneous 표시 |

## 9. 평가에서 확인하지 못한 것

다음은 코드만으로 사실 판정할 수 없다. 실패로 감점하지 않고 최종 점수의 51–66 불확실성 범위에만 반영했다.

- GitHub branch protection과 required checks 활성화 여부
- PR #26, #29, #30의 실제 리뷰·승인 내용
- production의 현재 commit과 health
- Traefik 429, cookie attribute, same-origin smoke의 실제 동작
- 실제 iOS Safari gesture와 접근성
- GA4·Search Console 데이터 수집 상태
- backup 파일의 실제 존재와 restore 성공 이력
- Oracle runner의 sudo·Docker 권한 범위
- npm/Gradle/container dependency의 최신 CVE

## 10. 독립 교차검증 감사

### 검토 독립성

세 검토자는 기존 결론을 반복하지 않도록 서로 다른 질문을 받았다.

| 검토자 | primary 질문 | 독립 결과 |
|---|---|---|
| 제품 기획자 | 검색 독자·운영자 가치와 roadmap 투자가 연결되는가 | 5.3/10, 측정 루프·moderation·SEO 기본기 우선 |
| CTO 레드팀 | 실제 장애·손실·host 영향 경로가 무엇인가 | 4.4/10, stateful NO-SHIP, backup·bootstrap을 최우선 |
| 방법론 감사 | 점수·severity가 같은 근거에서 재현되는가 | 기존 체계 실패, 개선 루브릭 57/100(51–66) |

세 점수는 모집단과 가중치가 달라 단순 평균하지 않았다. 최종 점수는 방법론 감사의 공통 6영역 루브릭으로만 다시 계산했다.

### 기존 핵심 주장 판정표

| 기존 주장 | 기획자 | CTO | 방법론 | 최종 판정 |
|---|---|---|---|---|
| 재작성 불필요, 현재 아키텍처 유지 | 동의 | 동의 | 점수와 별개 | **유지** |
| OpenSpec/main 정합성은 즉시 문제 | 사실 동의, P0 과함 | P1 | governance cluster로 병합 | **P1-A** |
| strict validator가 의미 정합성을 못 잡음 | 사실 동의 | workflow 문제 | validator 책임 표현 반대 | **도구 결함이 아니라 base-sync gate 미집행** |
| `getPostSlugs()` fail-silent | 코드 사실 동의 | P1 | 직접 근거 강함 | **P2-A**; manifest CI backstop을 최초 보고서가 누락 |
| avatar 외부 URL | 동의 | P1 | P1 자연스러움 | **P1-B** |
| PTR 즉시 rollback | 비용 동의, 결정 유보 | 근거 불충분 | severity와 분리 | **Decision-1**; 추가 투자 중단, 유지/축소를 별도 결정 |
| DB N+1을 다음 기능 전 해결 | 구조 동의, 우선순위 반대 | P2 | 하한·계측 한계 지적 | **P2-B** |
| same-host backup·restore 공백 | 동의 | P1 | delivery cluster | **P1 유지** |
| 66점에서 80점대 초반 가능 | 근거 부족 | 다른 가중치로 44점 | 재현 불가 | **삭제** |

### 새로 합의된 최상위 위험

1. **빈 DB bootstrap 불가** — 직접 코드 경로, 신뢰도 B.
2. **pre-migration backup fail-open** — 직접 shell/workflow 경로, 신뢰도 B.
3. **예약 backup lock 권한 불일치** — 명령과 mode로 재현 가능한 잠재 경로, 신뢰도 B.
4. **변경 없는 서비스의 `latest` drift** — workflow 표현식과 pull 경로, 신뢰도 B.
5. **공개 댓글 moderation 부재** — UI 약속과 API surface 직접 대조, 신뢰도 B.

실제 production에서 이미 실패 중인지는 제외 범위이므로 P0로 올리지 않았다. 반대로 “확인하지 못했다”는 이유로 무시하지 않고 다음 관련 배포 전 차단할 P1로 두었다.

### 평가 기준 감사 결과

- 기존 배점 합과 총점 66의 덧셈은 맞았지만 영역 점수의 산출 근거가 없었다.
- 기존 8.2는 공개된 7·7·10의 단순 평균 8.0과도 맞지 않고 category 앵커도 없어 건강도 점수 자체를 삭제했다.
- PTR, OpenSpec, CI 문제는 여러 영역에서 중복 감점될 수 있어 primary control 한 곳에서만 반영했다.
- unknown은 실패로 보수 감점하지 않고 51–66 범위로 표시했다.
- P0와 제품 우선순위를 분리했다. 유지/rollback은 `Decision`, 실제 사고 위험은 P0/P1/P2다.

따라서 이 감사의 일관성 판정은 **“최초 사실 조사는 대체로 유효, 최초 점수·severity 체계는 실패, 교차검증 후 루브릭은 재현 가능”**이다.

## 11. 최종 CTO 판단

이 프로젝트는 재작성 대상이 아니다. 아키텍처의 뼈대는 유지할 가치가 높다.

현재 가장 큰 부채는 두 층이다. 첫째, **빈 DB bootstrap과 backup fail-open 때문에 복구 가능한 stateful system이라는 증거가 없다.** 둘째, OpenSpec, task, base spec, CI, `main`이 서로 다른 완료 상태를 말한다. 전자는 실제 데이터 안전 문제이고 후자는 다음 변경의 신뢰 문제다.

가장 높은 leverage는 새 기능이 아니다.

1. backup 사용자·lock·fail-open과 빈 DB bootstrap을 고친다.
2. offsite restore와 성공 image SHA rollback을 실제 rehearsal한다.
3. CI가 기존 테스트와 release evidence를 집행하게 한다.
4. 공개 댓글의 avatar, 입력 상한, 오류 상태, moderation을 완성한다.
5. PTR 추가 투자를 멈추고 active change를 결산한 뒤 측정 기반으로 돌아간다.

점수 상승 폭은 작업 완료 전 미리 약속하지 않는다. 각 control의 코드·CI·restore 근거가 생길 때 같은 루브릭으로 다시 평가한다. 그 이후의 의미 있는 읽기, 최소 조회수 API와 소유자 dashboard는 프로젝트 목표와도 맞고 backend 학습 자산으로서도 가치가 있다.
