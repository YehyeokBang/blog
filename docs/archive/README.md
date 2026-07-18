# 문서 아카이브

완료되었거나 현재 문서로 대체된 계획·리뷰·디자인 방향을 보존한다. 이 문서들은 당시 판단의 근거를 확인할 때만 사용하며 현재 상태는 [프로젝트 문서 인덱스](../README.md)에서 찾는다.

## 리뷰

- [2026-07-14 프로젝트 종합 리뷰](reviews/2026-07-14-project-review.md)
- [2026-07-18 저장소 문서·개발 운영 정리 설계](reviews/2026-07-18-repository-operations-design.md)

## 계획

- [초기 프로젝트 기획서](plans/initial-project-proposal.md)

## 디자인

- [초기 디자인 방향](design/initial-design-direction.md)

아카이브 문서의 경로·수치·상태는 역사적 문맥을 보존할 수 있다. 현재 문서로 되돌려 반영할 내용이 있다면 먼저 활성 문서와 실제 구현을 대조한다.

## 아카이브 규칙

- 일반 문서 archive는 `docs/archive/` 아래에만 둔다. `docs/archive/README.md`는 인덱스이므로 상태 메타데이터 검사 대상에서 제외한다.
- 각 archive 문서에는 `- 상태: 아카이브`, `- 아카이브 날짜: YYYY-MM-DD`, 현재 문서를 가리키는 `- 대체 문서:` Markdown 링크를 둔다.
- `openspec/changes/archive/`는 OpenSpec CLI가 관리하는 change archive다. 일반 문서 상태 배너는 요구하지 않지만, 상대 링크는 문서 검사 대상이다.

규칙과 상대 링크는 저장소 루트에서 `node scripts/check-documentation.mjs`로 확인한다.
