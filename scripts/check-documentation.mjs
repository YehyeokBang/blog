#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const activeDocuments = [
    "AGENTS.md",
    "docs/project-overview.md",
    "docs/architecture.md",
    "docs/roadmap.md",
    "docs/design.md",
    "docs/git-strategy.md",
    "docs/persona.md",
    "docs/backend/README.md",
    "docs/backend/domain-and-api.md",
    "docs/backend/quality-and-operations.md",
    "docs/superpowers/plans/2026-07-18-documentation-operations.md",
    "docs/superpowers/plans/2026-07-19-documentation-operations-p1-a.md",
];

function toRepositoryPath(repositoryRoot, absolutePath) {
    return path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");
}

function collectMarkdownFiles(repositoryRoot, relativeDirectory) {
    const directory = path.join(repositoryRoot, relativeDirectory);

    if (!fs.existsSync(directory)) {
        return [];
    }

    const files = [];
    const visit = (currentDirectory) => {
        for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
            const entryPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath);
            } else if (entry.isFile() && entry.name.endsWith(".md")) {
                files.push(toRepositoryPath(repositoryRoot, entryPath));
            }
        }
    };

    visit(directory);
    return files.sort();
}

function markdownOutsideCodeFences(markdown) {
    const lines = [];
    let inCodeFence = false;

    for (const line of markdown.split(/\r?\n/)) {
        if (line.trimStart().startsWith("```")) {
            inCodeFence = !inCodeFence;
            continue;
        }

        if (inCodeFence) {
            continue;
        }

        lines.push(line);
    }

    return lines;
}

function extractRelativeLinks(markdown) {
    const links = [];

    for (const line of markdownOutsideCodeFences(markdown)) {
        const linkPattern = /!?\[[^\]]*\]\(([^)\n]+)\)/g;
        for (const match of line.matchAll(linkPattern)) {
            const candidate = match[1].trim();
            const target = candidate.startsWith("<")
                ? candidate.slice(1, candidate.indexOf(">"))
                : candidate.split(/\s+/)[0];

            if (
                !target ||
                target.startsWith("#") ||
                target.startsWith("/") ||
                target.startsWith("//") ||
                /^[a-z][a-z0-9+.-]*:/i.test(target)
            ) {
                continue;
            }

            const targetPath = target.split(/[?#]/, 1)[0];
            if (targetPath) {
                links.push(targetPath);
            }
        }
    }

    return links;
}

export function validateRelativeLinks(repositoryRoot, markdownFiles) {
    const errors = [];

    for (const markdownFile of markdownFiles) {
        const absoluteFile = path.join(repositoryRoot, markdownFile);
        if (!fs.existsSync(absoluteFile)) {
            errors.push(`문서 파일 오류: ${markdownFile}이 없습니다`);
            continue;
        }

        for (const target of extractRelativeLinks(fs.readFileSync(absoluteFile, "utf8"))) {
            const resolvedTarget = path.resolve(repositoryRoot, path.dirname(markdownFile), target);
            const relativeTarget = path.relative(repositoryRoot, resolvedTarget);
            if (relativeTarget === ".." || relativeTarget.startsWith(`..${path.sep}`)) {
                errors.push(`상대 링크 범위 오류: ${markdownFile} → ${target} (저장소 밖을 가리킵니다)`);
            } else if (!fs.existsSync(resolvedTarget)) {
                errors.push(`깨진 상대 링크: ${markdownFile} → ${target} (대상이 없습니다)`);
            }
        }
    }

    return errors;
}

function indexedDocumentPaths(repositoryRoot, indexFile) {
    const indexPath = path.join(repositoryRoot, indexFile);
    if (!fs.existsSync(indexPath)) {
        return new Set();
    }

    return new Set(
        extractRelativeLinks(fs.readFileSync(indexPath, "utf8")).map((target) =>
            toRepositoryPath(repositoryRoot, path.resolve(repositoryRoot, path.dirname(indexFile), target)),
        ),
    );
}

function validateActiveDocumentIndexes(repositoryRoot) {
    const errors = [];
    const docsIndex = indexedDocumentPaths(repositoryRoot, "docs/README.md");
    const openSpecIndex = indexedDocumentPaths(repositoryRoot, "openspec/README.md");

    for (const document of activeDocuments) {
        if (!fs.existsSync(path.join(repositoryRoot, document))) {
            errors.push(`활성 문서 오류: ${document}이 없습니다`);
        } else if (!docsIndex.has(document)) {
            errors.push(`활성 문서 인덱스 오류: docs/README.md가 ${document}를 링크해야 합니다`);
        }
    }

    for (const spec of collectMarkdownFiles(repositoryRoot, "openspec/specs").filter((file) => file.endsWith("/spec.md"))) {
        if (!openSpecIndex.has(spec)) {
            errors.push(`활성 문서 인덱스 오류: openspec/README.md가 ${spec}를 링크해야 합니다`);
        }
    }

    return errors;
}

export function validateArchiveState(repositoryRoot, archiveFiles) {
    const errors = [];

    for (const archiveFile of archiveFiles) {
        const markdown = markdownOutsideCodeFences(fs.readFileSync(path.join(repositoryRoot, archiveFile), "utf8")).join("\n");
        if (!/^- 상태: 아카이브$/m.test(markdown)) {
            errors.push(`아카이브 상태 오류: ${archiveFile}에 \`- 상태: 아카이브\`가 필요합니다`);
        }
        if (!/^- 아카이브 날짜: [0-9]{4}-[0-9]{2}-[0-9]{2}$/m.test(markdown)) {
            errors.push(`아카이브 상태 오류: ${archiveFile}에 \`- 아카이브 날짜: YYYY-MM-DD\`가 필요합니다`);
        }
        if (!/^- 대체 문서: .*\[[^\]]+\]\([^)]+\)/m.test(markdown)) {
            errors.push(`아카이브 상태 오류: ${archiveFile}에 현재 문서를 가리키는 \`- 대체 문서:\` 링크가 필요합니다`);
        }
    }

    return errors;
}

export function validateArchivePlacement(repositoryRoot, documentationFiles) {
    const errors = [];

    for (const documentationFile of documentationFiles) {
        if (documentationFile.startsWith("docs/archive/")) {
            continue;
        }

        const markdown = markdownOutsideCodeFences(
            fs.readFileSync(path.join(repositoryRoot, documentationFile), "utf8"),
        ).join("\n");
        if (/^- 상태: 아카이브$/m.test(markdown)) {
            errors.push(`아카이브 위치 오류: ${documentationFile}은 docs/archive/ 아래로 이동해야 합니다`);
        }
    }

    return errors;
}

export function checkDocumentation(repositoryRoot) {
    const documentationFiles = collectMarkdownFiles(repositoryRoot, "docs");
    const openSpecFiles = collectMarkdownFiles(repositoryRoot, "openspec");
    const markdownFiles = ["AGENTS.md", ...documentationFiles, ...openSpecFiles];
    const archiveFiles = documentationFiles.filter(
        (file) => file.startsWith("docs/archive/") && file !== "docs/archive/README.md",
    );

    return [
        ...validateRelativeLinks(repositoryRoot, markdownFiles),
        ...validateActiveDocumentIndexes(repositoryRoot),
        ...validateArchiveState(repositoryRoot, archiveFiles),
        ...validateArchivePlacement(repositoryRoot, documentationFiles),
    ];
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
    const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
    const errors = checkDocumentation(repositoryRoot);

    if (errors.length === 0) {
        console.log("문서 검사 통과");
    } else {
        console.error("문서 검사 실패:");
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        console.error("실행 방법: node scripts/check-documentation.mjs");
        process.exitCode = 1;
    }
}
