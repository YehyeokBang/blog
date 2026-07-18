# OpenSpec 인덱스

OpenSpec은 기능별 현재 요구사항과 변경 중인 요구사항을 구분한다. 현재 동작의 기준은 base spec이며, change는 승인된 변경이 구현·검증되는 동안만 유지한다.

## Base specs

- [analytics](specs/analytics/spec.md)
- [blog-rendering](specs/blog-rendering/spec.md)
- [deployment-infrastructure](specs/deployment-infrastructure/spec.md)
- [seo-metadata](specs/seo-metadata/spec.md)

## 진행 중 change

- [backend-first-deployment](changes/backend-first-deployment/proposal.md): 백엔드 첫 배포 구현과 base spec 동기화 확인 중

## 완료 change

완료된 change와 당시 delta·설계·작업표는 [`changes/archive/`](changes/archive/)에 보존한다.

## 변경 종료 순서

1. 작업표와 실제 구현·테스트를 항목별로 대조한다.
2. `scripts/validate-openspec.sh`를 실행한다.
3. delta spec을 base spec에 동기화한다.
4. 관련 배포와 운영 검증이 끝났는지 확인한다.
5. strict validation을 다시 통과시킨 뒤 change를 archive한다.

Git 훅 활성화와 브랜치 흐름은 [Git 전략](../docs/git-strategy.md)을 따른다.
