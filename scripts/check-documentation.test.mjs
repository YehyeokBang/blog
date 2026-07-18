import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
    checkDocumentation,
    validateArchiveState,
    validateArchivePlacement,
    validateRelativeLinks,
} from "./check-documentation.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

test("현재 문서가 링크, 인덱스, archive 상태 규칙을 만족한다", () => {
    assert.deepEqual(checkDocumentation(repositoryRoot), []);
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
