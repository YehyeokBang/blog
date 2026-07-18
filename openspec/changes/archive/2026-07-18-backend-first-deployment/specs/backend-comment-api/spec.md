## ADDED Requirements

### Requirement: Active post slug only comment creation
시스템은 build-time manifest에서 active로 동기화된 post slug에 대해서만 댓글 생성을 허용해야 한다(MUST).

#### Scenario: active post 댓글 생성
- **WHEN** 클라이언트가 active slug에 유효한 댓글 본문으로 POST 요청을 보낸다
- **THEN** 시스템은 댓글을 저장하고 HTTP 201을 반환한다

#### Scenario: inactive 또는 unknown slug 댓글 생성
- **WHEN** 클라이언트가 inactive 또는 unknown slug에 POST 요청을 보낸다
- **THEN** 시스템은 HTTP 404 ProblemDetail과 `code: NOT_FOUND`를 반환한다

### Requirement: Comment retrieval preservation
시스템은 기존 댓글 보존을 위해 inactive slug의 댓글도 조회할 수 있어야 한다(MUST).

#### Scenario: Active 또는 inactive post 댓글 조회
- **WHEN** 클라이언트가 active 또는 inactive slug의 댓글을 조회한다
- **THEN** 시스템은 생성 시각 오름차순 댓글 배열과 HTTP 200을 반환한다

#### Scenario: Unknown slug 댓글 조회
- **WHEN** 클라이언트가 한 번도 존재하지 않은 slug의 댓글을 조회한다
- **THEN** 시스템은 빈 배열과 HTTP 200을 반환한다

### Requirement: Markdown-derived post manifest synchronization
시스템은 backend image에 포함된 slug JSON manifest를 시작 시 SQLite posts read model에 멱등으로 동기화해야 한다(MUST). manifest에 없는 기존 slug와 그 댓글은 삭제하지 않고 post만 inactive로 표시해야 한다.

#### Scenario: 동일 manifest로 재시작
- **WHEN** 같은 manifest로 backend를 두 번 시작한다
- **THEN** active posts 결과는 동일하고 중복 post row가 생기지 않는다

#### Scenario: Markdown에서 slug 제거
- **WHEN** 이전 manifest에 있던 slug가 새 manifest에 없다
- **THEN** 기존 post row는 inactive가 된다
- **AND** 해당 post의 기존 comment row는 유지된다

### Requirement: Test database isolation
시스템의 테스트는 `/opt/blog/data/blog.db` 또는 운영 datasource를 사용하면 안 된다(MUST NOT).

#### Scenario: backend test 실행
- **WHEN** CI 또는 개발자가 backend test를 실행한다
- **THEN** 테스트 전용 datasource와 DB 파일만 사용한다
