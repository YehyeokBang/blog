# 프로젝트 문서 인덱스

현재 프로젝트 상태를 이해할 때는 아래 활성 문서를 기준으로 한다. 과거 계획과 리뷰는 참고 기록이며 현재 사실의 출처로 사용하지 않는다.

## 활성 문서

| 문서 | 역할 |
|---|---|
| [프로젝트 개요](project-overview.md) | 목표, 핵심 가치, 콘텐츠 식별 규칙 |
| [기술 아키텍처](architecture.md) | 기술 스택, 실행·배포 구조, 운영 사전 조건 |
| [로드맵](roadmap.md) | 제품 우선순위와 운영 방식 |
| [디자인 시스템](design.md) | 현재 디자인 원칙, 토큰, UI 동작 |
| [Git 전략](git-strategy.md) | 브랜치, 커밋, PR, OpenSpec 종료 흐름 |
| [페르소나](persona.md) | 운영자와 독자, 글쓰기 성향 |
| [백엔드 컨벤션](backend/README.md) | Kotlin·Spring 구현 및 리뷰 규칙의 역할별 진입점 |
| [백엔드 도메인·API 규칙](backend/domain-and-api.md) | 도메인 모델과 HTTP API 구현 규칙 |
| [백엔드 품질·운영 규칙](backend/quality-and-operations.md) | 품질, 테스트, 빌드, 운영·검토 규칙 |

## 역할별 시작점

- 전체 작업: [AGENTS.md](../AGENTS.md)와 작업 영역에 해당하는 활성 문서
- 프론트엔드: [frontend/README.md](../frontend/README.md), [frontend/AGENTS.md](../frontend/AGENTS.md), [디자인 시스템](design.md)
- 백엔드: [백엔드 컨벤션](backend/README.md), [기술 아키텍처](architecture.md)
- 요구사항 변경: [OpenSpec 인덱스](../openspec/README.md), [Git 전략](git-strategy.md)

## 작업 기록과 아카이브

- P0 구현 기록: [문서·개발 운영 정리 구현 계획](superpowers/plans/2026-07-18-documentation-operations.md)
- 현재 P1-A 실행 계획: [문서·개발 운영 정리 P1-A 구현 계획](superpowers/plans/2026-07-19-documentation-operations-p1-a.md)
- 완료되거나 대체된 문서: [아카이브 인덱스](archive/README.md)

활성 문서와 아카이브가 충돌하면 활성 문서와 실제 코드·설정을 우선한다.
