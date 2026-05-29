// `inspect`: per-file export analysis. For each requested file (in scope,
// .d.ts excluded) the exports inspector returns one InspectExport row per
// exported declaration: line / kind / name / importers count / example
// (the alphabetically first importer file path, or null when unused).
//
// The export iteration mirrors what the retired unused-exports report
// did — same getExportedDeclarations() / findReferencesAsNodes() pair —
// but it now drives a richer table rather than a "delete vs unexport"
// suggestion column.

import type * as declared from "@kawanet/ts-survey"
import {Node, type SourceFile} from "ts-morph"

import {displayPath, selectSourceFiles} from "../lib/source-files.ts"
import {inspectorNames} from "./inspector-names.ts"

export const runInspect: typeof declared.runInspect = async (project, opts) => {
    const {paths, inspectorNames: requested} = opts

    for (const name of requested) {
        if (!(inspectorNames as readonly string[]).includes(name)) {
            throw new Error(`unknown inspector name: ${name} (known: ${inspectorNames.join(", ")})`)
        }
    }

    const targets = selectSourceFiles(project, {paths}).filter((sf) => !sf.getFilePath().endsWith(".d.ts"))

    const results: declared.InspectFile[] = []
    for (const sf of targets) {
        const entry: declared.InspectFile = {file: displayPath(sf.getFilePath())}
        if (requested.includes("exports")) entry.exports = gatherExports(sf)
        results.push(entry)
    }

    results.sort((a, b) => a.file.localeCompare(b.file))
    console.error(`inspect: ${results.length} files`)
    return results
}

// Per-file: one row per exported declaration originating in the file
// (re-export passthrough is skipped to avoid double counting). `importers`
// counts distinct external source files using this export; `example` is
// the alphabetically first such file, or null when unused.
function gatherExports(sf: SourceFile): declared.InspectExport[] {
    const out: declared.InspectExport[] = []

    for (const [name, decls] of sf.getExportedDeclarations()) {
        for (const decl of decls) {
            if (decl.getSourceFile() !== sf) continue
            if (!Node.isReferenceFindable(decl)) continue
            const target = "getNameNode" in decl && typeof (decl as any).getNameNode === "function" ? ((decl as any).getNameNode() ?? decl) : decl
            if (!Node.isReferenceFindable(target)) continue

            const declStart = target.getStart()
            const externalFiles = new Set<string>()
            for (const ref of target.findReferencesAsNodes()) {
                const refSf = ref.getSourceFile()
                if (refSf === sf && ref.getStart() === declStart) continue
                if (refSf !== sf) externalFiles.add(displayPath(refSf.getFilePath()))
            }

            const sortedImporters = [...externalFiles].sort((a, b) => a.localeCompare(b))
            const {line} = sf.getLineAndColumnAtPos(decl.getStart())
            out.push({
                line,
                kind: kindLabel(decl),
                name,
                importers: sortedImporters.length,
                example: sortedImporters[0] ?? null,
            })
        }
    }

    out.sort((a, b) => a.line - b.line)
    return out
}

// Map a declaration node to a human-friendly kind label
// (function/class/const/...) instead of ts-morph's raw kind name.
function kindLabel(decl: Node): string {
    if (Node.isFunctionDeclaration(decl)) return "function"
    if (Node.isClassDeclaration(decl)) return "class"
    if (Node.isInterfaceDeclaration(decl)) return "interface"
    if (Node.isTypeAliasDeclaration(decl)) return "type"
    if (Node.isEnumDeclaration(decl)) return "enum"
    if (Node.isModuleDeclaration(decl)) return "namespace"
    if (Node.isVariableDeclaration(decl)) {
        const stmt = decl.getVariableStatement()
        if (stmt) return String(stmt.getDeclarationKind())
        return "var"
    }
    return decl.getKindName()
}
