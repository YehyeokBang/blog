## ADDED Requirements

### Requirement: Migration-gated immutable deployment and rollback
시스템은 backend image를 commit SHA immutable tag와 `latest`로 게시하고, 새 backend 교체 전에 migration 전 backup·integrity check·versioned migration·schema validation을 완료해야 한다(MUST). health 또는 smoke test 실패 시 직전 SHA image로 application rollback할 수 있어야 한다(MUST).

#### Scenario: Successful engagement deployment
- **WHEN** engagement backend를 production에 배포한다
- **THEN** 검증된 backup과 migration이 완료된 뒤 새 SHA image를 적용한다
- **AND** datasource와 migration version이 포함된 health가 UP이고 Traefik smoke test가 성공한 뒤 deploy를 성공 처리한다

#### Scenario: Migration failure
- **WHEN** migration transaction 또는 schema validation이 실패한다
- **THEN** 기존 container를 교체하지 않고 deploy를 실패 처리한다

#### Scenario: Application health or smoke failure
- **WHEN** migration 뒤 새 image의 health 또는 same-origin smoke test가 실패한다
- **THEN** 운영자는 기록된 직전 SHA image를 재적용할 수 있다
- **AND** additive schema는 보존되어 기존 댓글 backend가 계속 동작한다

### Requirement: Engagement migration image safety
backend image는 versioned migration과 post manifest를 포함해야 하지만(MUST), SQLite DB·WAL·SHM·backup을 포함하면 안 된다(MUST NOT).

#### Scenario: Backend image inspection
- **WHEN** engagement backend image를 검사한다
- **THEN** migration resource와 classpath posts manifest가 존재한다
- **AND** DB, SQLite sidecar와 backup 파일은 존재하지 않는다
