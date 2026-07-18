## ADDED Requirements

### Requirement: Backend image safety and persistence
시스템은 backend image에 SQLite DB 또는 build cache를 포함하면 안 되며, 운영 DB는 `/opt/blog/data/blog.db`에서 `/data/blog.db`로 bind mount해야 한다.

#### Scenario: Backend image build
- **WHEN** repository root를 Docker build context로 backend image를 빌드한다
- **THEN** image에는 JAR와 classpath manifest만 포함된다
- **AND** `backend/*.db`, SQLite sidecar, Gradle build cache는 포함되지 않는다

#### Scenario: Container replacement
- **WHEN** backend image를 교체해 compose를 다시 적용한다
- **THEN** host DB 파일과 comment data는 유지된다

### Requirement: Internal health-gated deployment
시스템은 `curl`을 포함한 backend runtime image에서 healthcheck를 실행하고, self-hosted runner는 health 성공 전 deploy를 성공 처리하면 안 된다.

#### Scenario: Backend가 120초 내 healthy
- **WHEN** deploy가 `docker compose up -d --wait --wait-timeout 120`을 실행한다
- **THEN** backend `/actuator/health`가 internal Docker network에서 `UP`이 된 뒤 deploy가 성공한다

#### Scenario: Backend health 실패
- **WHEN** backend가 120초 내 healthy가 되지 않는다
- **THEN** deploy job은 backend logs를 출력하고 실패한다
- **AND** Traefik을 통해 actuator endpoint를 공개하지 않는다

### Requirement: Deterministic deployment workflow
시스템은 frontend, backend, content, infrastructure 변경을 명시된 workflow DAG에 따라 처리하고 production deploy를 직렬화해야 한다.

#### Scenario: Markdown content 변경
- **WHEN** `content/posts/**`만 변경된 main push가 발생한다
- **THEN** frontend와 backend image를 모두 build/push한다
- **AND** 두 image가 성공한 뒤 deploy한다

#### Scenario: Infrastructure-only 변경
- **WHEN** compose, tracked script 또는 deploy workflow만 변경된다
- **THEN** image를 rebuild하지 않고 compose/script artifact를 배치한 뒤 deploy한다
