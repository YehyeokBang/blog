# backend-post-manifest-sync Specification

## Purpose
Markdown 파일명을 backend의 최소 post manifest로 만들고 SQLite read model에 멱등 동기화하여, slug가 사라져도 기존 post와 comment 데이터를 보존하는 기준을 정의한다.

## Requirements
### Requirement: Deterministic build-time post manifest
시스템은 `content/posts`의 일반 Markdown 파일명에서 slug를 생성해 backend JAR classpath `posts.json`으로 패키징해야 한다(MUST). manifest는 UTF-8 JSON string 배열이며, 정렬된 유효 slug만 포함해야 한다.

#### Scenario: 유효한 Markdown 목록 생성
- **WHEN** CI 또는 backend build 준비 단계가 실행된다
- **THEN** `content/posts/*.md` basename의 정렬된 JSON 배열이 `backend/src/main/resources/posts.json`에 생성된다
- **AND** backend image의 JAR classpath에서 해당 resource를 읽을 수 있다

#### Scenario: 비정상 manifest 입력
- **WHEN** slug가 비어 있거나 규칙에 맞지 않거나 manifest 생성·parse에 실패한다
- **THEN** build 또는 backend startup은 실패한다
- **AND** 기존 SQLite post row의 active 상태는 변경하지 않는다

#### Scenario: 빈 manifest
- **WHEN** 생성된 manifest가 빈 배열이다
- **THEN** backend startup은 실패한다

### Requirement: Idempotent post read-model synchronization
시스템은 backend 시작 시 classpath manifest로 SQLite `Post(id: Long, slug unique, active)` read model을 멱등 동기화해야 한다(MUST). manifest에서 사라진 post와 그 댓글은 삭제하면 안 된다(MUST NOT).

#### Scenario: Manifest의 active slug 동기화
- **WHEN** backend가 유효한 manifest로 시작한다
- **THEN** manifest의 각 slug는 존재하면 active로, 없으면 새 active post로 저장된다

#### Scenario: Manifest에서 제거된 slug
- **WHEN** DB에 있지만 새 manifest에는 없는 slug가 있다
- **THEN** 해당 post만 inactive가 된다
- **AND** 연결된 comment row는 유지된다

### Requirement: Isolated manifest synchronization tests
시스템의 Gradle 테스트는 고정 test manifest와 test-only SQLite datasource를 사용해야 한다(MUST).

#### Scenario: Standalone Gradle test
- **WHEN** 개발자 또는 CI가 `./gradlew test`를 실행한다
- **THEN** test resource `posts.json`과 build directory의 SQLite DB만 사용한다
- **AND** `/opt/blog/data/blog.db`, `backend/blog.db`, 실제 `content/posts`에 접근하지 않는다
