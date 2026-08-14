import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
    checkDocumentation,
    validateArchiveState,
    validateArchivePlacement,
    validateDesignDocumentation,
    validateRelativeLinks,
} from "./check-documentation.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

test("현재 문서가 링크, 인덱스, archive 상태 규칙을 만족한다", () => {
    assert.deepEqual(checkDocumentation(repositoryRoot), []);
});

test("디자인 문서 활성 권한과 프론트엔드 라우팅은 알려진 기준선과 독립적으로 유효하다", () => {
    const designErrors = checkDocumentation(repositoryRoot).filter((error) =>
        error.includes("docs/design"),
    );

    assert.deepEqual(designErrors, []);
    assert.deepEqual(validateDesignDocumentation(repositoryRoot), []);
});

test("디자인 문서 진입점과 프론트엔드 라우팅 누락을 함께 보고한다", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "blog-design-docs-"));
    fs.mkdirSync(path.join(fixtureRoot, "docs", "design-system"), { recursive: true });
    fs.mkdirSync(path.join(fixtureRoot, "frontend"));
    fs.writeFileSync(path.join(fixtureRoot, "docs", "README.md"), "[이전 디자인 문서](design.md)\n");
    fs.writeFileSync(path.join(fixtureRoot, "docs", "design.md"), "# 호환 문서\n");
    fs.writeFileSync(path.join(fixtureRoot, "frontend", "AGENTS.md"), "[이전 디자인 문서](../docs/design.md)\n");
    fs.writeFileSync(path.join(fixtureRoot, "frontend", "README.md"), "[이전 디자인 문서](../docs/design.md)\n");

    assert.deepEqual(validateDesignDocumentation(fixtureRoot), [
        "디자인 시스템 문서 오류: docs/design-system/README.md이 없습니다",
        "디자인 시스템 인덱스 오류: docs/README.md가 docs/design-system/README.md를 링크해야 합니다",
        "디자인 시스템 라우팅 오류: frontend/AGENTS.md가 docs/design-system/README.md를 링크해야 합니다",
        "디자인 시스템 라우팅 오류: frontend/README.md가 docs/design-system/README.md를 링크해야 합니다",
    ]);
});

test("깨진 상대 링크의 문서와 대상 경로를 보고한다", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "blog-docs-link-"));
    fs.mkdirSync(path.join(fixtureRoot, "docs"));
    fs.writeFileSync(path.join(fixtureRoot, "docs", "guide.md"), "[없는 문서](missing.md)\n");

    assert.deepEqual(
        validateRelativeLinks(fixtureRoot, ["docs/guide.md"]),
        ["깨진 상대 링크: docs/guide.md → missing.md (대상이 없습니다)"],
    );
});

test("archive 문서의 상태 메타데이터 누락을 보고한다", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "blog-docs-archive-"));
    const archiveFile = path.join(fixtureRoot, "docs", "archive", "note.md");
    fs.mkdirSync(path.dirname(archiveFile), { recursive: true });
    fs.writeFileSync(archiveFile, "# 과거 기록\n");

    assert.deepEqual(
        validateArchiveState(fixtureRoot, ["docs/archive/note.md"]),
        [
            "아카이브 상태 오류: docs/archive/note.md에 `- 상태: 아카이브`가 필요합니다",
            "아카이브 상태 오류: docs/archive/note.md에 `- 아카이브 날짜: YYYY-MM-DD`가 필요합니다",
            "아카이브 상태 오류: docs/archive/note.md에 현재 문서를 가리키는 `- 대체 문서:` 링크가 필요합니다",
        ],
    );
});

test("코드 블록의 archive 예시는 archive 위치로 오인하지 않는다", () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "blog-docs-code-fence-"));
    const planFile = path.join(fixtureRoot, "docs", "plans", "example.md");
    fs.mkdirSync(path.dirname(planFile), { recursive: true });
    fs.writeFileSync(planFile, "```markdown\n- 상태: 아카이브\n```\n");

    assert.deepEqual(validateArchivePlacement(fixtureRoot, ["docs/plans/example.md"]), []);
});
