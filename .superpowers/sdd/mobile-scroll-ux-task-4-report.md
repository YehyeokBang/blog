# Mobile Scroll UX Task 4 보고서

## 범위

- 완료: Task 4.1–4.5 구현
- 제외: Task 4.6 browser QA 및 Task 5 이후 작업
- 구현은 `frontend/`만 변경했고, backend/API/DB/content post/OpenSpec proposal은 변경하지 않았다.

## 구현 내용

- `HeaderHomeLink`가 다른 route에서는 `Link href="/" scroll={true}`를 사용한다.
- root에서는 `tag`만 삭제하고 나머지 query를 보존한 `router.replace(..., { scroll: false })` 뒤에, 현재 scroll이 0보다 클 때만 motion preference를 반영해 top으로 이동한다.
- 게시글 metadata header에 `article-header` id를 부여했다.
- RootLayout의 기존 비변환 sibling인 `BackToTopButton`은 `/posts/` route에서만 header를 관찰한다. IntersectionObserver와 passive scroll + requestAnimationFrame fallback 모두 `header bottom <= 60`, `scrollY > 0` 조건으로 표시를 결정한다.
- top button은 `↑ 위로` visible text와 `맨 위로 이동` accessible name을 사용하고, focus를 강제로 이동시키지 않는다.
- 88×44px centered floating glass CSS, exact backdrop feature/fallback gate, hover/pressed/focus/reduced-motion/forced-colors 상태를 추가했다.

## TDD 근거

### RED

`frontend/lib/scroll-ux.test.ts`에 다음 순수 visibility test를 먼저 추가했다.

```ts
assert.equal(shouldShowBackToTop(true, 59, 100), false);
assert.equal(shouldShowBackToTop(false, 61, 100), false);
assert.equal(shouldShowBackToTop(false, 60, 0), false);
assert.equal(shouldShowBackToTop(false, 60, 1), true);
```

그 뒤 `cd frontend && npm run test:scroll-ux`를 실행했다. 예상대로 export가 아직 없어 RED가 확인됐다.

```text
SyntaxError: The requested module './scroll-ux.ts' does not provide an export named 'shouldShowBackToTop'
✖ lib/scroll-ux.test.ts
ℹ pass 0
ℹ fail 1
```

### GREEN

`shouldShowBackToTop(headerIsIntersecting, headerBottom, scrollY)`를 최소 구현한 뒤 같은 focused suite를 실행했다.

```text
✔ 상세 top control은 article header가 fixed header 위로 사라진 뒤에만 표시한다
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

## 최종 검증

실행 명령:

```bash
cd frontend && npm run test:scroll-ux
cd frontend && npm run test:engagement
cd frontend && npm run lint
cd frontend && git diff --check
```

결과:

| 명령 | 결과 |
| --- | --- |
| `npm run test:scroll-ux` | exit 0, 6/6 통과 |
| `npm run test:engagement` | exit 0, 5/5 통과 |
| `npm run lint` | exit 0, error 0; `frontend/app/about/page.tsx`의 `DetailItem` unused warning 1개 유지 |
| `git diff --check` | exit 0 |

두 Node test command는 package type이 명시되지 않았다는 `MODULE_TYPELESS_PACKAGE_JSON` warning을 출력한다. 이번 Task 범위 밖이므로 변경하지 않았다.

## 변경 파일

- `frontend/components/HeaderHomeLink.tsx` (신규)
- `frontend/components/BackToTopButton.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/posts/[slug]/page.tsx`
- `frontend/app/globals.css`
- `frontend/lib/scroll-ux.ts`
- `frontend/lib/scroll-ux.test.ts`

## 자체 검토

- `HeaderHomeLink`는 `useSearchParams`를 사용하지 않아 static export에서 Suspense boundary를 추가로 요구하지 않는다.
- same-page top 이동의 scroll owner를 component 하나로 유지했고, `scrollY === 0`일 때 `scrollTo`를 호출하지 않는다.
- observer 미지원 fallback은 passive listener에서 frame 하나만 예약해 scroll event마다 layout을 반복 측정하지 않는다.
- route별 visibility state를 사용해 상세 route 간 전환 시 이전 route의 visible button이 새 route에 재사용되지 않게 했다.
- backdrop 지원 여부와 관계없이 hover opacity, focus outline, forced-colors text/focus 식별성을 유지한다.

## 남은 우려 및 인계

- Task 4.6 browser QA는 의도적으로 실행하지 않았다. 375×812와 1280×720의 light/dark에서 visibility geometry, keyboard activation, contrast, backdrop fallback, console error를 controller가 확인해야 한다.
- lint의 about page unused-import warning과 Node test의 module-type warning은 이번 변경과 무관한 기존/설정 이슈로 보이지만, 별도 정리 작업이 필요하면 범위를 분리하는 편이 안전하다.
