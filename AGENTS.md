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
- **Domain-Specific Guidelines**: Maintain separate Markdown files for specific tech stacks, planning documents, or architecture designs (e.g., under `.agents/references/` or `docs/`).
- **Agent Workflow**: Before starting a task, agents MUST actively check for and read any relevant detailed reference documents.

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
- **Korean Language Requirement**: ALL Git commit messages and Pull Request (PR) titles/bodies MUST be written in Korean. Do not use standard English commit conventions like `feat: ...` unless explicitly requested. Use clear, descriptive Korean (e.g., `기능: ... 추가`, `수정: ... 해결`).
