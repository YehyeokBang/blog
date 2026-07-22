# Mobile Scroll UX — Task 2 보고서

## 범위

- `frontend/lib/scroll-ux.ts`에 pull-to-refresh와 scroll/TOC의 순수 결정 함수를 추가했다.
- `frontend/lib/scroll-ux.test.ts`에 경계값 unit test를 추가했다.
- `frontend/package.json`에 `test:scroll-ux`를 추가했다.
- OpenSpec task 파일, 문서, backend, 게시글은 변경하지 않았다.

## RED

테스트를 production module보다 먼저 추가한 뒤 다음 명령을 실행했다.

```bash
cd frontend
node --test --experimental-strip-types lib/scroll-ux.test.ts
```

예상대로 exit code 1로 실패했다. `ERR_MODULE_NOT_FOUND`가 `lib/scroll-ux.test.ts`에서 import한 `lib/scroll-ux.ts`를 찾지 못했다고 보고했다. 따라서 테스트가 아직 없는 contract를 실제로 검증함을 확인했다.

## GREEN

최소 구현 후 다음 명령을 실행했다.

```bash
cd frontend
npm run test:scroll-ux
npm run test:engagement
```

최종 결과는 각각 exit code 0이었다.

- `test:scroll-ux`: 4 passed, 0 failed
- `test:engagement`: 5 passed, 0 failed

저항값 테스트는 JavaScript 부동소수 표현 때문에 `39.050000000000004` 및 `55.00000000000001`이 나타날 수 있어, 0.55 resistance 계약은 `0.000001` 오차 범위로 검증했다. 구현은 값을 반올림하지 않아 실제 pull transform의 연속성을 보존한다.

## 구현 대조

- `PULL_REFRESH_THRESHOLD_PX`는 72, `PULL_REFRESH_MAX_OFFSET_PX`는 96이다.
- `PullRefreshPhase`, `PullRefreshState`와 요청된 네 순수 함수를 export한다.
- 음수 raw distance는 0으로 clamp하고, 양수에는 0.55 resistance를 적용한 뒤 96px로 clamp한다.
- 72px 미만은 `pulling`, 72px 이상은 `armed`다.
- reduced motion은 `auto`, 기본은 `smooth`다.
- TOC는 `contentHeight <= viewportHeight - 120`일 때만 sticky다.

## Self-review

`git diff --check`를 통과했고 변경은 Task 2 파일과 이 보고서로 한정됐다. `MODULE_TYPELESS_PACKAGE_JSON` Node warning은 기존 `engagement` suite에서도 동일하게 발생하는 package module-type 경고이며, Task 2 범위를 벗어나므로 변경하지 않았다.

## Follow-up: no-argument scroll behavior contract

리뷰 지적에 따라 `getScrollBehavior()`를 인자 없이 호출하는 assertion을 추가했다.

### RED 시도

```bash
cd frontend
npm run test:scroll-ux
```

명령은 exit code 0으로 4개 test를 모두 통과했다. 기존 JavaScript 삼항식은 `undefined`를 falsy로 취급하므로 런타임 결과가 이미 `"smooth"`였다. 따라서 이번 follow-up에서는 요구된 RED 실패를 재현할 수 없었다.

### 최소 수정과 GREEN

`getScrollBehavior(reducedMotion = false)`로 기본값을 명시해 TypeScript 호출 계약도 no-argument 호출을 허용하도록 수정했다. 이후 다음을 실행했다.

```bash
cd frontend
npm run test:scroll-ux
npm run test:engagement
```

두 명령 모두 exit code 0이었다. `test:scroll-ux`는 4 passed, `test:engagement`는 5 passed다.

### Follow-up self-review

변경은 no-argument assertion, 기본 파라미터, 본 보고서 append로 한정했다. 기존 true/false 동작과 다른 scroll UX helper에는 영향을 주지 않는다.
