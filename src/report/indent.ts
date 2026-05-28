// --report indent: per-file indent unit (number of spaces, or "tab"),
// bucketed by the actually-observed widths. Helps decide which value
// to feed to `--indent N` so the rewrite touches the smallest number
// of files.

import type {Project} from "ts-morph"

import {detectIndent, type IndentUnit} from "../lib/detect-indent.ts"
import {writeRecommendation} from "../lib/recommendation.ts"
import {displayPath, selectSourceFiles} from "../lib/source-files.ts"
import type {ReportOpts} from "./unused-exports.ts"

type PerFile = {path: string; unit: IndentUnit; indentedLines: number}

export async function runReportIndent(project: Project, {stream, absIncludes, absExcludes}: ReportOpts): Promise<void> {
    const sourceFiles = selectSourceFiles(project, {absIncludes, absExcludes}).filter((sf) => !sf.getFilePath().endsWith(".d.ts"))

    const perFile: PerFile[] = []
    for (const sf of sourceFiles) {
        const detected = detectIndent(sf.getFullText())
        if (!detected) continue
        perFile.push({
            path: displayPath(sf.getFilePath()),
            unit: detected.unit,
            indentedLines: detected.indentedLines,
        })
    }

    // Group files by unit; numeric keys come first sorted ascending, "tab" last.
    const byIndentUnit = new Map<IndentUnit, PerFile[]>()
    for (const f of perFile) {
        const bucket = byIndentUnit.get(f.unit) ?? []
        bucket.push(f)
        byIndentUnit.set(f.unit, bucket)
    }
    const numericKeys = [...byIndentUnit.keys()].filter((k): k is number => typeof k === "number").sort((a, b) => a - b)
    const orderedKeys: IndentUnit[] = [...numericKeys, ...(byIndentUnit.has("tab") ? ["tab" as const] : [])]

    // Recommendation: the unit with the most files. Ties produce no
    // recommendation (the choice is ambiguous and the user should look).
    let max = 0
    let recommendIndentUnit: IndentUnit | undefined
    for (const [unit, files] of byIndentUnit) {
        if (files.length > max) {
            max = files.length
            recommendIndentUnit = unit
        } else if (files.length === max && unit !== recommendIndentUnit) {
            recommendIndentUnit = undefined
        }
    }

    stream.write("### indent\n")
    stream.write("\n")
    stream.write("| indent | files | example |\n")
    stream.write("| --- | --- | --- |\n")
    for (const key of orderedKeys) {
        const files = byIndentUnit.get(key)!
        // Example column: file with the most indented lines in the bucket.
        const example = files.slice().sort((a, b) => b.indentedLines - a.indentedLines || a.path.localeCompare(b.path))[0]
        stream.write(`| ${key} | ${files.length} | ${example.path} |\n`)
    }
    stream.write(`| total | ${perFile.length} | |\n`)
    stream.write("\n")
    if (recommendIndentUnit !== undefined) {
        const flag = recommendIndentUnit === "tab" ? "--indent tab" : `--indent ${recommendIndentUnit}`
        writeRecommendation(stream, flag)
        stream.write("\n")
    }
    console.error(`report indent: ${perFile.length} files counted / ${sourceFiles.length} files total`)
}
