import { ReactNode } from "react";

export interface DetailItem {
  text: ReactNode;
  subDetails?: ReactNode[];
}

export interface HistoryItem {
  title: string;
  role?: string;
  period: string;
  description?: string;
  details?: DetailItem[];
}

export const INTRODUCTION: ReactNode[] = [
  "안녕하세요. 백엔드 엔지니어 방예혁입니다.",
  "주인의식을 가지고, 불확실한 문제를 선명하게 만드는 것을 중요하게 생각합니다.",
];

export const CAREERS: HistoryItem[] = [
  {
    title: "짐싸",
    role: "백엔드 엔지니어",
    period: "2026.03 ~",
    description: "이사 견적 비교부터 청소, 설치까지 파편화된 이사 프로세스를 하나로 연결하여, 고객의 불편함을 기술로 해결하는 토탈 무빙 케어 플랫폼",
    details: [
      { text: "재직 중" }
    ],
  },
];

export const ACTIVITIES: HistoryItem[] = [
  {
    title: "우아한테크코스",
    role: "7기 웹 백엔드",
    period: "2025.02 ~ 2025.11",
    description: "우아한형제들이 주관하는 협업 능력과 기술 역량을 함께 키우는 개발자 교육 과정입니다.",
    details: [
      { text: "Java, Spring Boot 기반 웹 백엔드 개발, 데이터베이스, AWS 기반 인프라, 테스트 코드 학습" },
      {
        text: <>페어 프로그래밍과 현업 개발자 코드 리뷰 <strong>과정으로 협업 중심의 문제 해결 역량 강화</strong></>,
        subDetails: [
          <>결제 승인 API <strong>Connection Timeout, Read Timeout 학습 및 적용</strong></>,
          <>복잡해지는 요구사항 속 도메인 간 <strong>강결합 해소 경험</strong></>,
        ]
      },
      { text: <><strong>Race Condition 발생 원리</strong>를 주제로 테코톡 발표 진행</> },
    ],
  },
  {
    title: "Google Developer Groups On Campus",
    role: "Core Member (운영진)",
    period: "2023.08 ~ 2024.07",
    description: "구글 기술과 자기 성장에 관심 있는 대학생, 대학원생 누구나 참여할 수 있는 학생 개발자 오픈 커뮤니티입니다.",
    details: [
      { text: <>서버 개발이 익숙치 않은 멤버 대상으로 <strong>강의 세션</strong> 진행</> },
      { text: <>정규 세션 외 <strong>HTTP와 친해지기</strong> 스터디 기획 및 진행</> },
    ],
  },
  {
    title: "성공회대학교",
    role: "소프트웨어공학 주전공 / 컴퓨터공학 부전공",
    period: "2019.03 ~ 2025.02 (졸업)",
    details: [
      { text: <>총장상 수상 <strong>(전공 평점 4.46 / 4.5 수석 졸업)</strong></> },
      { text: <>제15회 교내 IT 경진대회 금상 수상</> },
      {
        text: <>전공 학습 공동체 멘토로 참여해 학습 방향을 이끌고, <strong>우수 멘토 2회 선정</strong></>,
        subDetails: [
          "Java프로그래밍, 자료구조",
        ]
      },
    ],
  },
];
