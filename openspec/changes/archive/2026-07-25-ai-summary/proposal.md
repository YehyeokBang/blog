## Why

독자들이 긴 기술 포스트의 핵심 내용을 빠르게 파악할 수 있도록 3줄 요약 기능을 제공하여 사용자 경험을 향상시키고자 합니다. 또한 백엔드 엔지니어링 관점에서 Spring AI와 Google Gemini 무료 모델(Flash)을 연동하는 파이프라인을 구축하고, 무단 API 호출 및 DoS 공격으로부터 백엔드를 보호하는 실무 수준의 보안 및 캐싱 아키텍처를 경험하고 적용하는 데 목적이 있습니다.

## What Changes

- Spring AI 프레임워크(`spring-ai-starter-model-google-genai`) 의존성 추가 및 Google AI Studio Gemini Flash 모델 연동
- 포스트 내용을 기반으로 3줄 요약을 생성하고 SSE(Server-Sent Events)를 통해 프론트엔드로 텍스트를 실시간 스트리밍하는 엔드포인트 구현
- 무단 API 호출 방지를 위한 보안/방어 로직 구현 (2계층 캐싱, 인프라 계층(Traefik) Rate Limiting, 일일 호출 한도 등)

## Capabilities

### New Capabilities
- `ai-summary`: 포스트 본문을 활용한 3줄 요약 생성 및 SSE 기반 실시간 스트리밍 (프록시 버퍼링 방지 포함)
- `ai-security`: 퍼블릭 AI 엔드포인트에 대한 어뷰징 방지 (Traefik Rate Limit) 및 캐싱 계층 (SQLite 독립 테이블)

### Modified Capabilities

## Impact

- **Backend**: Spring AI 관련 의존성 추가, SSE API 엔드포인트 구현, SQLite 기반 독립 캐시 테이블(FK 제거) 적용
- **Frontend**: SSE 이벤트를 수신하여 실시간 타이핑 효과를 보여주는 요약 UI 컴포넌트 추가
- **Infrastructure**: Traefik Edge 라우터에 AI 요약 API에 대한 Rate Limit 미들웨어 설정 추가
