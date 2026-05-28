// Counts leading whitespace widths per file, line by line.
// Returns a map keyed by either a positive number of leading spaces or the
// literal "tab"; each value is the number of lines in the file that lead
// with that exact width. Empty / all-whitespace lines and JSDoc
// continuation lines (` * ...`) are excluded so they do not pollute the
// buckets. A file with no useful leading whitespace returns an empty map.
//
// The shape is shared between the indent report (aggregates these maps
// across files) and the indent action (picks a per-file unit from the
// numeric keys to drive its rewrite).

export type IndentWidth = "tab" | number
export type IndentCounts = Map<IndentWidth, number>

export function detectIndent(text: string): IndentCounts {
    const counts: IndentCounts = new Map()
    for (const line of text.split("\n")) {
        if (line.length === 0) continue
        const first = line[0]
        if (first === "\t") {
            counts.set("tab", (counts.get("tab") ?? 0) + 1)
            continue
        }
        if (first !== " ") continue
        let n = 0
        while (n < line.length && line[n] === " ") n++
        if (n === line.length) continue // all-whitespace line
        if (line[n] === "*") continue // block-comment continuation
        counts.set(n, (counts.get(n) ?? 0) + 1)
    }
    return counts
}
