// Classifies a file's indent unit by scanning leading whitespace.
// Shared between the indent report (which buckets files by unit) and the
// indent action (which rewrites each line based on the same unit).
//
// Heuristics:
// - First char is tab → tab-indented line.
// - First char is space → leading-space length recorded.
// - All-blank lines and JSDoc / block-comment continuation lines
//   (first non-space `*`) are skipped so they do not pull the unit down.
// File's unit = "tab" when tab lines outnumber space lines; otherwise the
// smallest leading-space count of at least 2. A line that does not happen
// to be a multiple of that unit (continuation alignment after an operator,
// for instance) is then skipped by the indent action rather than treated
// as a level, which is preferable to a GCD that collapses to 1 the moment
// a single alignment line appears. Returns null when nothing useful
// was sampled.

export type IndentUnit = "tab" | number

export function detectIndent(text: string): {unit: IndentUnit; indentedLines: number} | null {
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
    // Smallest leading count of at least 2. The `>= 2` floor keeps the
    // occasional 1-space stray (e.g., a hand-written single-space comment)
    // from dragging the unit down across the whole file.
    let unit = 0
    for (const c of spaceCounts) {
        if (c < 2) continue
        if (unit === 0 || c < unit) unit = c
    }
    if (unit === 0) {
        // Genuine 1-space-indented file: fall back to the smallest seen.
        for (const c of spaceCounts) {
            if (unit === 0 || c < unit) unit = c
        }
    }
    return {unit, indentedLines: spaceCounts.length}
}
