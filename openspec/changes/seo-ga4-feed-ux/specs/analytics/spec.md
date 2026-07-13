## ADDED Requirements

### Requirement: GA4 페이지뷰 트래킹
시스템은 Google Analytics 4의 측정 스크립트를 모든 페이지에 삽입하여 방문자의 페이지뷰 데이터를 자동으로 수집해야 한다.

#### Scenario: GA4 스크립트 렌더링
- **WHEN** `NEXT_PUBLIC_GA_ID` 환경 변수가 유효한 GA4 Measurement ID(예: `G-XXXXXXXXXX`)로 설정되어 빌드가 실행될 때
- **THEN** 시스템은 모든 정적 HTML 페이지의 `<head>` 영역에 GA4 gtag.js 스크립트 태그를 포함해야 한다.

#### Scenario: GA4 비활성화 (환경 변수 미설정)
- **WHEN** `NEXT_PUBLIC_GA_ID` 환경 변수가 설정되지 않거나 빈 문자열일 때
- **THEN** 시스템은 GA4 관련 스크립트 태그를 렌더링하지 않아야 하며, 페이지는 정상적으로 동작해야 한다.
