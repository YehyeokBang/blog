# Custom pull-to-refresh decision record

이번 안정화 범위에서는 custom pull-to-refresh를 변경하거나 제거하지 않는다. helper test는 존재하지만 실제 iOS Safari gate가 미완료이므로 유지 효용과 회귀 비용을 코드만으로 비교할 수 없다.

- 유지 비용: touch lifecycle, root scroll geometry, accessibility announcement, reduced-motion, iOS browser regression gate를 계속 검증해야 한다.
- 미완료 gate: active OpenSpec `mobile-scroll-ux`의 3.7, 3.9, 6.5, 7.1~7.3.
- 제거 시 보존 가능한 기능: fixed header, home/top navigation, TOC는 pull-to-refresh와 별도다. 제거는 native refresh fallback만 복원하면 된다.

다음 결정은 실제 iOS Safari 검증 증거를 수집한 뒤에만 한다.
