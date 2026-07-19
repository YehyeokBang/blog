## 1. Approval gate

- [ ] 1.1 proposal, design, 모든 delta spec과 tasks를 검토·승인한다.
- [ ] 1.2 승인 전에는 backend, frontend, migration, Traefik 제품 코드를 변경하지 않는다.

## 2. Backend TDD and migration

- [ ] 2.1 migration test를 먼저 추가하고 anonymous visitor, post like, unique/FK/index, schema version migration을 구현한다.
- [ ] 2.2 engagement projection service 단위 테스트를 먼저 추가하고 active post pagination·count aggregation을 구현한다.
- [ ] 2.3 detail 조회와 PUT/DELETE service 단위 테스트를 먼저 추가하고 신규·중복·취소·중복 취소·없는 slug 동작을 구현한다.
- [ ] 2.4 controller 통합 테스트를 먼저 추가하고 API JSON, page validation, ProblemDetail 상태와 cookie 속성을 구현한다.
- [ ] 2.5 Origin 검증 통합 테스트를 먼저 추가하고 production/local allowlist와 403 처리를 구현한다.
- [ ] 2.6 동시 PUT, 동시 DELETE, 경쟁 PUT/DELETE 통합 테스트로 unique 제약, non-negative count와 commit 결과를 검증한다.

## 3. Frontend TDD and approved UI

- [ ] 3.1 engagement API client 상태 테스트를 먼저 추가하고 relative `/api`, same-origin credentials, 검증된 응답 parsing과 실패 상태를 구현한다.
- [ ] 3.2 정적 피드 item에 page projection의 `likeCount`·`commentCount`를 slug로 결합하고 개별/N+1 호출이 없음을 검증한다.
- [ ] 3.3 운영 상세 좋아요 버튼을 구현하고 서버 응답 전 성공 상태를 표시하지 않으며 실패 안내·재시도를 제공한다.
- [ ] 3.4 prototype engagement localStorage helper와 prototype-only state가 운영 bundle·코드 경로에 없음을 검사한다.
- [ ] 3.5 승인된 문구, 배치, 48px, `aria-pressed`, focus, 보이는 공백과 자릿수별 폭을 자동 helper test와 browser 측정으로 검증한다.
- [ ] 3.6 피드의 미확인 count와 실제 0을 구분하고 지표 영역 skeleton, count 동시 공개, layout shift 방지, reduced motion과 접근성 상태를 검증한다.

## 4. Deployment and operations

- [ ] 4.1 migration runner를 test-first로 구현하고 lock, pre-migration backup, integrity, transaction rollback, schema 검증을 확인한다.
- [ ] 4.2 Traefik PUT/DELETE rate-limit router를 추가하고 Compose 해석과 10/minute·burst 5의 429 경로를 검증한다.
- [ ] 4.3 deploy workflow에 immutable SHA image, migration-before-replace, health wait, same-origin smoke test와 이전 SHA rollback 입력을 추가한다.
- [ ] 4.4 SQLite backup/restore rehearsal에서 engagement와 migration table, unique 제약, counts와 integrity를 검증한다.
- [ ] 4.5 backend image에 migration/manifest는 있고 SQLite DB는 없으며 runtime UID/GID와 mount가 유지됨을 검증한다.

## 5. Local and production verification

- [ ] 5.1 `cd backend && ./gradlew ktlintCheck test build`를 통과한다.
- [ ] 5.2 `cd frontend && npm run lint`와 `NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build`를 통과한다.
- [ ] 5.3 API 계약, 신규/재방문 cookie, like/unlike idempotency, 동시성, projection pagination을 로컬 same-origin 경로에서 검증한다.
- [ ] 5.4 375px mobile과 1280px desktop의 light/dark UI, keyboard, focus, loading/error와 자릿수 폭을 검증한다.
- [ ] 5.5 Docker Compose 환경에서 Traefik을 통한 실제 GET/PUT/DELETE, Set-Cookie, Origin 거부, 429와 backend health를 검증한다.
- [ ] 5.6 Oracle production에서 동일 경로, migration version, backup, healthy 상태와 이전 SHA rollback target을 검증한다.
- [ ] 5.7 `./scripts/validate-openspec.sh`, `node --test scripts/check-documentation.test.mjs`, `node scripts/check-documentation.mjs`를 통과한다.

## 6. Completion gate

- [ ] 6.1 tasks와 구현·테스트·배포 근거를 항목별 대조하고 근거가 있는 항목만 완료 표시한다.
- [ ] 6.2 strict validation 후 delta를 base specs에 동기화한다.
- [ ] 6.3 production 운영 검증과 rollback 준비가 확인된 뒤 strict validation을 다시 실행한다.
- [ ] 6.4 모든 종료 조건이 충족된 경우에만 `post-engagement-production` change를 archive한다.
