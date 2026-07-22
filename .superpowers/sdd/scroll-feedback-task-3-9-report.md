# Scroll Feedback Task 3.9 보고서

## 상태

구현 완료, browser 검증 대기. OpenSpec Task 3.9 범위에서 `PullToRefresh`의 프레임별 React 렌더링을 제거했다. 반복 pull/release와 reduced-motion browser 근거가 확인되기 전까지 이 task를 완료 처리하지 않는다.

## 근본 원인

보고된 `installHook.js` stack은 Chrome 확장 프로그램 프레임이므로 애플리케이션 오류가 아니다. 별도로 앱의 `PullToRefresh`는 매 requestAnimationFrame마다 `pullDistance`와 `visualOffset` React state를 바꿔, main·footer를 감싼 surface와 모든 children을 다시 렌더링했다. indicator도 idle에서 조건부 unmount되어 반복 gesture마다 DOM lifecycle 비용이 있었다.

## 변경한 lifecycle

- capability gate가 활성화된 동안 indicator를 fixed sibling으로 계속 mount하고, idle에서는 `visibility: hidden`과 live-region 속성 제거로 숨긴다.
- transformable content surface와 SVG progress stroke에 ref를 두었다. coalesced rAF는 surface의 inline `transform`/`will-change`와 stroke의 `--pull-progress`만 직접 갱신한다.
- React state는 `idle`, `pulling`, `armed`, `refreshing` 경계를 실제로 넘을 때만 갱신한다. 상태 text, busy semantics, 기존 touch gate·제외 조건·임계값·resistance는 유지했다.
- short release, cancel, listener cleanup은 대기 rAF를 취소하고 transform/will-change를 제거하며 ring progress를 0으로 되돌린다.
- armed release는 refreshing phase를 commit한 뒤 기존 post-commit rAF reload effect가 실행되어 indicator DOM이 먼저 표시된다. reload guard와 cleanup은 유지했다.
- surface와 progress transition은 120ms로 맞췄고, existing reduced-motion rule이 transition과 rotation을 제거해 static fill을 유지한다.

## 검증

변경 전:

```text
cd frontend && npm run test:scroll-ux
7 passed, 0 failed
```

변경 후:

```text
cd frontend && npm run test:engagement
5 passed, 0 failed

cd frontend && npm run test:scroll-ux
7 passed, 0 failed

cd frontend && npm run lint
0 errors, existing warning 1
```

`npm run lint` 경고는 이번 변경과 무관한 `frontend/app/about/page.tsx`의 기존 `DetailItem` 미사용 import다.

## 우려 사항

브라우저 QA는 작업 지시대로 실행하지 않았다. 이 변경은 DOM 단위 테스트 runtime이 없는 영역이므로, 실제 coarse-touch 지원 브라우저에서 지원 gate, cancel/release, reduced motion의 시각 동작을 후속 Task 3.9 browser 검증에서 확인해야 한다.
