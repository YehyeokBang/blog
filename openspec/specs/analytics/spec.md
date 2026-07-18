# analytics

## Purpose
검색 유입과 페이지 이용 행동을 관찰하기 위해 GA4 측정 코드를 정적 frontend에 주입하고, 환경별 측정 ID를 build-time에 안전하게 전달하는 기준을 정의한다.

## Requirements

### Requirement: 웹 로그 트래픽 수집
시스템은 사용자 접속 및 행동 이벤트를 추적하기 위해 구글 애널리틱스(GA4) 스크립트를 모든 페이지에 삽입해야 한다(MUST).

#### Scenario: 페이지뷰 트래킹
- **WHEN** 사용자가 블로그의 어떤 페이지에든 접속할 때
- **THEN** 시스템은 `NEXT_PUBLIC_GA_ID` 환경 변수로 주입된 측정 ID를 기반으로 GA4 스크립트를 로드하고 페이지뷰를 전송한다.
