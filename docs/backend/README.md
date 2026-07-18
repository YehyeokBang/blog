# 백엔드 컨벤션

- **버전**: 1.1.1
- **최종 수정일**: 2026-07-18
- **적용 범위**: `backend/` 하위 모든 Kotlin 코드
- **기술 스택**: Kotlin 2.3 + Spring Boot 4.1 + JPA(SQLite→PostgreSQL) + WebMVC

> 이 문서는 실제 코드를 기준으로 인터뷰를 통해 확정한 컨벤션입니다.
> AI 에이전트 포함 모든 기여자는 이 문서와 작업 역할에 해당하는 하위 문서를 따릅니다.
> 규칙 변경 시 해당 문서를 먼저 수정하고, 코드를 그 다음에 반영합니다.

## 역할별 읽기 순서

모든 백엔드 작업은 이 문서를 먼저 읽는다. 이후 작업 내용에 맞는 문서를 함께 읽는다.

| 작업 | 필독 문서 |
|---|---|
| 도메인 모델, Repository, Service, Controller, DTO, 예외, 트랜잭션, 검증, 동시성, API | [도메인·API 규칙](domain-and-api.md) |
| 포매팅, 테스트, 로깅, Gradle 의존성, DB 스키마, Git·CI, 코드리뷰 | [품질·운영 규칙](quality-and-operations.md) |
| 일반적인 백엔드 기능 변경 | 두 하위 문서 모두 |

## 원본 섹션 이관표

2026-07-19에 단일 문서를 역할별로 분할했다. 아래 표는 이전 `docs/backend-convention.md`의 규칙이 어디에 있는지 확인하는 누락 방지표다.

| 이전 섹션 | 현재 문서 |
|---|---|
| 1. 코드 포매팅 & 린터 | [품질·운영 규칙](quality-and-operations.md#1-코드-포매팅--린터) |
| 2. 네이밍 | [도메인·API 규칙](domain-and-api.md#2-네이밍) |
| 3. 패키지 구조 & 아키텍처 | [도메인·API 규칙](domain-and-api.md#3-패키지-구조--아키텍처) |
| 4. Null 처리 | [도메인·API 규칙](domain-and-api.md#4-null-처리) |
| 5. JPA Entity 설계 | [도메인·API 규칙](domain-and-api.md#5-jpa-entity-설계) |
| 6. DTO 매핑 전략 | [도메인·API 규칙](domain-and-api.md#6-dto-매핑-전략) |
| 7. 예외 처리 & 에러 응답 | [도메인·API 규칙](domain-and-api.md#7-예외-처리--에러-응답) |
| 8. 트랜잭션 | [도메인·API 규칙](domain-and-api.md#8-트랜잭션) |
| 9. 입력 검증 | [도메인·API 규칙](domain-and-api.md#9-입력-검증) |
| 10. 비동기 / 동시성 | [도메인·API 규칙](domain-and-api.md#10-비동기--동시성) |
| 11. 테스트 | [품질·운영 규칙](quality-and-operations.md#11-테스트) |
| 12. 로깅 | [품질·운영 규칙](quality-and-operations.md#12-로깅) |
| 13. API 설계 | [도메인·API 규칙](domain-and-api.md#13-api-설계) |
| 14. Gradle & 의존성 | [품질·운영 규칙](quality-and-operations.md#14-gradle--의존성) |
| 15. DB 스키마 관리 | [품질·운영 규칙](quality-and-operations.md#15-db-스키마-관리) |
| 16. Git & CI | [품질·운영 규칙](quality-and-operations.md#16-git--ci) |
| 17. 의도적으로 채택하지 않은 것들 | [품질·운영 규칙](quality-and-operations.md#17-의도적으로-채택하지-않은-것들deliberately-rejected) |
| 18. 코드리뷰 체크리스트, 변경 이력 | [품질·운영 규칙](quality-and-operations.md#18-코드리뷰-체크리스트) |
