## ADDED Requirements

### Requirement: Nginx 기반 정적 이미지 및 로컬 Native 구동
시스템은 운영 배포용으로 빌드된 정적 리소스(HTML/CSS/JS)를 담은 경량 Nginx 컨테이너를 가동할 수 있어야 하며, 로컬 개발은 Node.js를 직접 실행할 수 있어야 한다.

#### Scenario: 로컬 개발 환경 가동
- **WHEN** 개발자가 `frontend/` 경로에서 `npm run dev`를 실행할 때
- **THEN** 시스템은 로컬 Node.js 서버를 HTTP 프로토콜의 3000 포트로 띄우고 파일 변경을 핫 리로딩해야 한다.

#### Scenario: 운영 Docker Compose 기동
- **WHEN** 운영 환경 서버에서 `docker-compose up -d`를 실행할 때
- **THEN** Next.js의 정적 빌드 결과물이 탑재된 Nginx 컨테이너와 Traefik 역방향 프록시 컨테이너가 가동된다.

### Requirement: Traefik을 통한 운영 HTTPS 자동 연동
운영 서버에 배치된 Traefik 컨테이너는 등록된 도메인을 통해 접근 시 자동으로 Let's Encrypt SSL/TLS 인증서를 발급하고 갱신하여 443 포트로 안전하게 트래픽을 서빙해야 한다.

#### Scenario: 도메인 기반 HTTPS 접속
- **WHEN** 외부 사용자가 할당된 도메인(예: `https://blog.yourdomain.com`)으로 접속할 때
- **THEN** Traefik은 유효한 SSL 인증서를 내려주고 트래픽을 내부에 떠 있는 Nginx 프론트엔드 컨테이너로 라우팅한다.
