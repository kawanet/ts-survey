// --report indent: per-file indent unit (number of spaces, or "tab"),
// bucketed by the actually-observed widths. Helps decide which value
// to feed to `--indent N` so the rewrite touches the smallest number
// of files.

import type {Project} from "ts-morph"

import {writeRecommendation} from "../lib/recommendation.ts"
import {displayPath, selectSourceFiles} from "../lib/source-files.ts"
import type {ReportOpts} from "./unused-exports.ts"

type Unit = "tab" | number

type PerFile = {path: string; unit: Unit; indentedLines: number}

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
    const byUnit = new Map<Unit, PerFile[]>()
    for (const f of perFile) {
        const bucket = byUnit.get(f.unit) ?? []
        bucket.push(f)
        byUnit.set(f.unit, bucket)
    }
    const numericKeys = [...byUnit.keys()].filter((k): k is number => typeof k === "number").sort((a, b) => a - b)
    const orderedKeys: Unit[] = [...numericKeys, ...(byUnit.has("tab") ? ["tab" as const] : [])]

    // Recommendation: the unit with the most files. Ties produce no
    // recommendation (the choice is ambiguous and the user should look).
    let max = 0
    let recommendUnit: Unit | undefined
    for (const [unit, files] of byUnit) {
        if (files.length > max) {
            max = files.length
            recommendUnit = unit
        } else if (files.length === max && unit !== recommendUnit) {
            recommendUnit = undefined
        }
    }

    stream.write("### indent\n")
    stream.write("\n")
    stream.write("| indent | files | example |\n")
    stream.write("| --- | --- | --- |\n")
    for (const key of orderedKeys) {
        const files = byUnit.get(key)!
        // Example column: file with the most indented lines in the bucket.
        const example = files.slice().sort((a, b) => b.indentedLines - a.indentedLines || a.path.localeCompare(b.path))[0]
        stream.write(`| ${key} | ${files.length} | ${example.path} |\n`)
    }
    stream.write(`| total | ${perFile.length} | |\n`)
    stream.write("\n")
    if (recommendUnit !== undefined) {
        const flag = recommendUnit === "tab" ? "--indent tab" : `--indent ${recommendUnit}`
        writeRecommendation(stream, flag)
        stream.write("\n")
    }
    console.error(`report indent: ${perFile.length} files counted / ${sourceFiles.length} files total`)
}

// Classifies a file's indent unit by scanning leading whitespace.
// - First char is tab → counted as a tab-indented line.
// - First char is space → counted, leading-space length collected.
// - All-blank lines and JSDoc/block-comment continuation lines
//   (first non-space is `*`) are skipped so they do not pull the GCD down.
// File's unit = "tab" if tab lines outnumber space lines; otherwise the GCD
// of all non-zero space counts. Returns null when no useful sample was found.
export function detectIndent(text: string): {unit: Unit; indentedLines: number} | null {
    let tabLines = 0
    const spaceCounts: number[] = []
    for (const line of text.split("\n")) {
        if (line.length === 0) continue
        const first = line[0]
        if (first === "\t") {
            tabLines++
            continue
        }
        if (first !== " ") continue
        let n = 0
        while (n < line.length && line[n] === " ") n++
        if (n === line.length) continue // all-whitespace line
        if (line[n] === "*") continue // block-comment continuation
        spaceCounts.push(n)
    }
    if (tabLines === 0 && spaceCounts.length === 0) return null
    if (tabLines > spaceCounts.length) {
        return {unit: "tab", indentedLines: tabLines}
    }
    let unit = 0
    for (const c of spaceCounts) {
        unit = unit === 0 ? c : gcd(unit, c)
        if (unit === 1) break
    }
    return {unit, indentedLines: spaceCounts.length}
}

function gcd(a: number, b: number): number {
    while (b !== 0) {
        const t = b
        b = a % b
        a = t
    }
    return a
}
