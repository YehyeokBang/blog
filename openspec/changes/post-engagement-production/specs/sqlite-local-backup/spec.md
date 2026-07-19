## ADDED Requirements

### Requirement: Migration backup and engagement restore rehearsal
시스템은 production migration 직전에 SQLite `.backup`과 integrity check를 완료해야 하며(MUST), backup은 post, comment, anonymous visitor, post like와 migration metadata를 함께 보존해야 한다(MUST). 자동 DB restore를 수행하면 안 된다(MUST NOT).

#### Scenario: Pre-migration backup
- **WHEN** 아직 적용되지 않은 production migration이 있다
- **THEN** deploy는 migration lock 안에서 timestamped backup과 integrity check를 완료한 뒤 migration을 시작한다

#### Scenario: Restore rehearsal
- **WHEN** 검증용 임시 경로에 backup을 restore한다
- **THEN** integrity check가 ok이고 engagement row, unique/FK/index, migration version과 aggregate counts가 source와 일치한다

#### Scenario: Manual destructive recovery
- **WHEN** migration commit 뒤 실제 data 손상이 확인되어 DB restore가 필요하다
- **THEN** backend를 정지하고 검증된 backup을 별도 경로에 restore·검사한 뒤 원본과 원자 교체한다
- **AND** deploy workflow는 자동으로 운영 DB를 덮어쓰지 않는다
