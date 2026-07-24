# Week 1 stabilization result

## 판정

### 재현됨·수정됨

1. 빈 SQLite DB는 기존 V1만으로 `post` FK와 `comment` index를 만들 수 없었다. `V0__core_schema.sql`을 추가했고 empty DB, V1만 기록된 기존 DB upgrade, SQL failure rollback, JPA `validate` startup을 테스트했다.
2. backup lock 충돌은 scheduled 경로에서는 성공 skip이고 deploy에서는 fail-open이었다. `LOCK_MODE=fail`과 `BACKUP_CREATED=<path>` exit contract를 추가했고 deploy가 파일 존재를 확인한 뒤에만 migration한다.
3. deploy와 scheduled backup의 실행 identity가 달랐다. 둘 다 root와 `/opt/blog/scripts/backup-sqlite.sh`를 사용하도록 정렬했다.
4. 변경되지 않은 service가 `latest`를 선택했다. 마지막 health 성공 frontend/backend SHA를 별도 파일에 기록하고, missing state는 fail-closed로 바꿨다.
5. 공개 댓글은 arbitrary external avatar와 무제한 authorName을 받았다. DiceBear exact URL pattern과 50자 제한을 적용하고, legacy untrusted avatar는 trusted fallback만 표시한다.

### 반증·미확인

- **반증:** standalone frontend typecheck 실패와 lint warning 1건은 현재 코드에서 재현됐으나 수정 후 typecheck와 warning-0 lint를 통과했다.
- **미확인:** production `/opt/blog`의 실제 lock/log owner, deploy version-state 파일, backup age, rollback rehearsal, migration version health 확인은 production 접속 금지 때문에 확인하지 않았다.
- **미확인:** Traefik same-origin smoke test와 Docker compose health는 Docker/production 경계라 실행하지 않았다.
- **미확인:** custom pull-to-refresh의 iOS Safari gate. 코드만으로 제거하지 않았고 `docs/pull-to-refresh-decision-2026-07-24.md`에 판단을 보류했다.

## 검증

- 통과: `bash scripts/migrate-sqlite.test.sh` — empty bootstrap, existing upgrade, duplicate constraint, rollback.
- 통과: `node --test scripts/deploy-contract.test.mjs` — immutable recorded SHA 및 pre-migration fail-closed 정적 계약.
- 통과: `cd frontend && npm test`, `npm run typecheck`, `npm run lint -- --max-warnings=0`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build`.
- 통과: `cd backend && ./gradlew ktlintCheck test build`.
- 통과: 문서 검사와 `./scripts/validate-openspec.sh` (10/10).
- 미실행/실패 환경 의존: `bash scripts/backup-sqlite.test.sh`와 전체 `bash scripts/verify.sh`는 이 macOS 환경에 `flock`가 없어 실행 불가. CI Ubuntu에는 같은 `scripts/verify.sh`를 연결했다.

## OpenSpec·문서 대조

- base specs에 현재 backup fail-closed, deterministic SHA, comment input boundary를 동기화했다.
- active `post-engagement-production`과 `mobile-scroll-ux` task checkbox는 production/browser/iOS 근거가 없으므로 완료 처리하지 않았다.
- custom pull-to-refresh 유지·제거는 실기기 gate 전까지 보류한다.

## 남은 위험

- **P1:** production에서 root backup ownership, `deployed-image-versions.env` durability, migration version/health contract, rollback target을 실제 rehearsal해야 한다.
- **P1:** local backup은 same-host disk loss를 막지 못하며 automatic restore는 의도적으로 구현하지 않았다.
- **P2:** comment hide/delete와 pagination은 새 사용자 동작이므로 OpenSpec proposal과 승인 전에는 구현하지 않았다.

## 다음 주 최우선 과제

production에서 pre-migration backup→migration→health→SHA state 기록과 이전 SHA rollback을 한 번 rehearsal해 실제 복구·배포 계약을 증명한다.

## CTO rubric 재평가

코드·테스트 범위 point estimate는 **57/100 → 72/100**이다. 회복된 control은 empty DB bootstrap/rollback, fail-closed pre-migration backup, single backup identity, immutable last-success SHA, CI-local parity, comment input boundary다. production restore rehearsal, external backup, real host ownership, browser/iOS gate는 미확인이므로 85점 이상으로 평가는 보류한다.
