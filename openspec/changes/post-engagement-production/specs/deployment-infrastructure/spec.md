## ADDED Requirements

### Requirement: Like mutation edge rate limit
시스템은 backend와 SQLite에 요청이 도달하기 전에 `PUT|DELETE /api/posts/{slug}/like`를 IP별 분당 10회, burst 5회로 제한해야 한다(MUST). matcher는 `^/api/posts/[^/]+/like/?$`, router priority 200을 사용하고 RemoteAddr을 기준으로 해야 한다(MUST).

#### Scenario: Like mutation rate exceeded
- **WHEN** 한 IP가 burst를 초과하거나 1분 내 10회를 초과해 PUT 또는 DELETE를 보낸다
- **THEN** Traefik은 backend로 전달하지 않고 HTTP 429를 반환한다

### Requirement: Engagement same-origin cookie routing
시스템은 production frontend의 상대 `/api` 요청에 포함된 Cookie와 Origin을 Traefik이 backend에 전달해야 하고(MUST), engagement를 위해 CORS를 열면 안 된다(MUST NOT).

#### Scenario: Production engagement request
- **WHEN** `https://blog.yehyeok.xyz`의 frontend가 engagement GET, PUT 또는 DELETE를 호출한다
- **THEN** Traefik은 같은 origin의 backend route로 요청을 전달한다
- **AND** Set-Cookie 응답을 browser에 전달한다

#### Scenario: Native development engagement request
- **WHEN** `http://localhost:3000` frontend가 상대 `/api` engagement 경로를 호출한다
- **THEN** Next development rewrite는 Cookie와 Origin을 localhost:8080 backend로 전달한다
