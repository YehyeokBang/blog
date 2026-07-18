## ADDED Requirements

### Requirement: Scheduled SQLite local backup
시스템은 GitHub Actions의 `[self-hosted, ARM64]` Oracle runner에서 매일 02:00 KST(`0 17 * * *`)에 `/opt/blog/data/blog.db`의 SQLite `.backup`을 `/opt/blog/backups`에 생성해야 한다(MUST). runner에는 `sqlite3`와 `flock`이 설치되어 있어야 한다.

#### Scenario: 정상 백업
- **WHEN** scheduled backup workflow가 실행된다
- **THEN** script는 SQLite `.backup` 명령으로 새 backup 파일을 완성한다
- **AND** 실행 로그를 남긴다

### Requirement: Backup overlap prevention and retention
시스템은 `flock -n`으로 동시에 두 backup이 실행되지 않게 하고, 실패를 KST log에 남기며 최근 7일 backup과 log만 보관해야 한다(MUST). backup은 5초 SQLite busy timeout, temporary file, integrity check, 같은 filesystem의 atomic rename을 사용해야 한다.

#### Scenario: 중첩 실행
- **WHEN** 이전 backup이 실행 중인 상태에서 두 번째 backup이 시작된다
- **THEN** 두 번째 실행은 DB backup을 수행하지 않고 건너뜀을 로그에 남긴 뒤 성공 종료한다

#### Scenario: Backup 또는 integrity check 실패
- **WHEN** source DB가 없거나 SQLite backup 또는 integrity check가 실패한다
- **THEN** 임시 backup은 확정 파일로 바뀌지 않는다
- **AND** script와 workflow는 non-zero로 실패한다

#### Scenario: 보존 기간 초과
- **WHEN** backup 완료 후 7일보다 오래된 backup 또는 log가 존재한다
- **THEN** script는 해당 파일을 삭제한다
