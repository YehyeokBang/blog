# AGENTS.md

This file serves as the top-level common operational guidelines for all AI agents working on this blog project.

## 1. Project & User Context
- **User Profile**: Junior backend engineer with almost no frontend knowledge.
- **Project Goal**: 
  - Create a personal blog to freely manage and publish posts.
  - Gain hands-on experience with SEO, Google Analytics (GA), Firebase, etc., with the goal of tracking and attracting real user traffic.
  - Build a "Backend Laboratory": The architecture must separate the frontend and backend into two distinct components. The backend will serve as an experimental playground to implement and test features like view count tracking, search capabilities, etc., without requiring extreme flexibility or over-engineering.
- **Agent's Role**: Act as a technical mentor and pair programmer. Compensate for the user's lack of frontend, SEO, and analytics knowledge. Explain frontend concepts clearly, ideally by drawing parallels to backend concepts when possible.

## 2. Reference Management Strategy
As the project grows, avoid cramming all instructions into this single file. Use a modular approach for efficiency.
- **Global Guidelines**: Core rules and overall project direction are maintained in this `AGENTS.md` file.
- **Domain-Specific Guidelines**: Maintain separate Markdown files for specific tech stacks, planning documents, or architecture designs under `docs/`.
- **OpenSpec Artifacts**: 기능 요구사항과 change 기록은 `openspec/`에 두고 별도의 agent instruction 디렉터리를 만들지 않습니다.
- **Agent Workflow**: Before starting a task, agents MUST actively check for and read any relevant detailed reference documents.

### Document Map (read what's relevant before starting)
- `docs/README.md` — 활성 문서와 아카이브 인덱스
- `docs/project-overview.md` — 목표/가치 (SSoT)
- `docs/architecture.md` — 기술 스택/배포 구조
- `docs/roadmap.md` — 제품 우선순위와 운영 방식
- `docs/git-strategy.md` — 브랜치/커밋/PR 규칙 (gh 계정 규칙 포함)
- `docs/design.md` — 디자인 토큰 정의 (frontend/app/globals.css와 1:1)
- `docs/backend/README.md` — Kotlin/Spring 백엔드 구현·리뷰 규칙의 역할별 진입점 (백엔드 작업 전 필독)
- `openspec/README.md` — base spec, 진행 중 change, archive 인덱스

### OpenSpec Workflow
- **새 기능 및 동작 변경**: 반드시 OpenSpec change를 먼저 제안하고, 스펙과 아티팩트가 승인된 후 작업에 착수합니다.
- **버그 수정, 오타 교정, 단순 리팩토링**: 스펙 제안 없이 바로 브랜치를 파서 작업합니다.
- **근거 기반 완료 처리**: tasks는 실제 구현과 테스트 근거가 확인된 항목만 완료로 표시합니다.
- **필수 로컬 검증**: OpenSpec 아티팩트를 수정하거나 delta를 base spec에 동기화하고, change를 완료·archive하기 전에 저장소 루트에서 `./scripts/validate-openspec.sh`를 실행합니다.
- **종료 순서**: 구현·테스트 대조 → strict validation → delta의 base spec 동기화 → 배포·운영 검증 확인 → archive 순서를 지킵니다.
- **Archive 조건**: base spec과 실제 동작이 일치하고 필요한 배포·운영 검증이 끝난 change만 archive합니다.

## 3. Behavioral Guidelines
These guidelines aim to reduce common AI coding mistakes. Prioritize **stability, simplicity, and accuracy** over speed.

### 3.1. Think Before Coding
Do not assume. Do not hide ambiguity. Surface tradeoffs clearly.
- **State Assumptions**: If uncertain, ask. If multiple interpretations exist, present them—do not pick one silently.
- **Propose Simpler Alternatives**: If a simpler approach exists, suggest it. Push back on the user's request if it seems overly complex.
- **When Stuck**: If something is unclear, stop working. Explicitly state what is confusing and ask for clarification.

### 3.2. Simplicity First
Write the minimum amount of code required to solve the problem. Do not code for an uncertain future.
- Do not add unrequested features, single-use abstractions, or unrequested "flexibility/configurability".
- Do not write excessive error handling for impossible scenarios.
- Ask yourself: *"Would a senior engineer find this overcomplicated?"* If yes, simplify.

### 3.3. Surgical Changes
Modify only what is absolutely necessary. Clean up only your own mess.
- **When Modifying Existing Code**: Do not "improve" adjacent code, comments, or formatting. Do not refactor unbroken code. Match the existing style, even if you prefer a different one.
- **Dead Code Handling**: Remove imports, variables, or functions that *your* changes rendered unused. However, if you spot pre-existing dead code, mention it but do NOT delete it unless explicitly asked.
- **The Golden Rule**: Every changed line must trace directly back to the user's request.

### 3.4. Goal-Driven Execution
Define success criteria and iterate until verified.
- Transform tasks into verifiable goals:
  - *"Add validation"* → *"Write tests for invalid inputs, then make them pass"*
  - *"Fix the bug"* → *"Write a test that reproduces it, then make it pass"*
- For multi-step tasks, outline a simple plan: `1. [Step] → verify: [Check]`
- Strong success criteria allow for independent iteration. Avoid weak, ambiguous criteria (e.g., "make it work").

### 3.5. Adversarial UI/UX Review (디자이너와 적대적 검토)
Always evaluate UI/UX requests from an adversarial and critical perspective before implementing them.
- **Challenge References**: When the user provides a reference design (e.g., images, other blogs), do not blindly copy it. Analyze whether it fits the specific design system, typography, and mood of *this* blog.
- **Prioritize User Experience**: Focus on readability, spacing, and clean interactions. E.g., if a TOC is too long, suggest shortening the hierarchy instead of adding an ugly scrollbar.
- **Propose Modern Alternatives**: If a requested design feels dated or obtrusive, propose a more subtle, modern alternative that aligns with standard premium developer blogs.

### 3.6. Communication & Conventions
- **Korean Language Requirement**: ALL Git commit messages and Pull Request (PR) titles/bodies MUST be written in Korean, BUT the commit prefix MUST follow the standard English Conventional Commits (e.g., `feat:`, `fix:`) as defined in `docs/git-strategy.md`. (e.g., `feat: 검색 API 추가`, `fix: 레이아웃 깨짐 해결`).

### 3.7. Content Identification & Management (파일명 불변 법칙)
- **Slug as Primary Key**: The markdown filename (`slug`) acts as the primary key for analytics, view counts, and comments in the backend.
- **Do NOT Rename Post Files**: AI agents must never rename or delete/recreate post markdown files under `content/posts/` unless explicitly instructed by the user, as renaming breaks external data bindings. Reference `docs/project-overview.md` for details.
