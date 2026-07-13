# Git & Branching Strategy

This document outlines the Git workflow and conventions for the blog project. It is based on a simplified GitHub Flow, optimized for a single-developer environment focusing on speed and a clean commit history.

## 1. Repository Structure (Monorepo)
The project follows a **Monorepo** architecture where both frontend and backend codebases live in the same repository. They are separated by root-level directories.
- **Benefits**: Allows atomic commits/PRs across both stacks (e.g., changing an API in the backend and its consumer in the frontend within a single PR).
- **CI/CD**: Workflows will use path-filtering (e.g., `paths: ['backend/**']`) to trigger deployments only for the modified component.

```text
blog/ (Repository Root)
 ├── frontend/      # Frontend application
 ├── backend/       # Backend laboratory application
 ├── .github/       # PR templates, GitHub Actions (CI/CD)
 └── .agents/       # AI Agent guidelines and references
```

## 2. Branching Strategy
- **`main`**: The canonical, production-ready branch. This serves as the unit of deployment.
- **No `develop` branch**: We use a trunk-based approach to minimize merging and mental overhead.
- **Feature Branches**: `[prefix]/[task-name]`
  - Always branch off from `main`.
  - Example: `feat/image-upload`, `fix/login-error`

## 3. Commit Message Convention
We use a slightly modified Conventional Commits standard.
**Format**: `<prefix>: <Description in Korean>`
**Example**: `feat: 이미지 업로드 기능 추가`

### Standard Prefixes
The branch folder name should match the commit prefix (e.g., branch `feat/xxx` -> commit `feat: xxx`).
- `feat`: (Feature) A new feature
- `fix`: (Bug Fix) A bug fix
- `docs`: (Documentation) Documentation only changes
- `style`: (Style) Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor`: (Refactor) A code change that neither fixes a bug nor adds a feature
- `perf`: (Performance) A code change that improves performance
- `test`: (Test) Adding missing tests or correcting existing tests
- `chore`: (Chore) Changes to the build process, configuration, or auxiliary tools

> [!TIP]
> **Squash Merge Benefit**
> Since we use Squash Merge to integrate features into `main`, do not stress over individual commit messages within your feature branch (e.g., `wip`, `test`). The only thing that truly matters is the **final PR title**, as it will become the single commit message on `main`.

## 4. Pull Request (PR) & Merge Strategy
- **Merge Strategy**: **Squash and Merge**. This keeps the `main` branch history clean, linear, and readable (one commit = one PR/Feature).
- **Issue Tracking**: We do not manage separate GitHub issues. The PR itself acts as the sole documentation and context for the change.
- **PR Title**: MUST follow the commit message convention (e.g., `feat: 검색 API 추가`).
- **PR Body**: Must follow the standard template defined in `.github/pull_request_template.md`. Because there are no linked issues, explaining *WHY* this change was made in the PR body is highly important for future reference.

## 5. Tooling & Authentication (`gh` CLI)
- The user utilizes the GitHub CLI (`gh`) for Git operations, including creating Pull Requests.
- **Critical Authentication Rule**: The user's machine has multiple GitHub accounts configured. All operations for this project MUST be performed using the personal account: **`YehyeokBang`**.
- Before performing any `gh` operations (e.g., `gh pr create`), agents should verify that `YehyeokBang` is the active account (using `gh auth status`). If it is not active, agents must switch to it or instruct the user to do so. **Do not reference or use any other account names that may be present on the machine.**
