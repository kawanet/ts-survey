// Renders a TsSurveyReport as the JSON body of a .prettierrc file.
// Only the fields the prettier CLI itself understands are emitted; the
// caller decides what stream to write to (process.stdout for --format
// prettier, an in-memory sink for tests, etc.).
//
// Mapping:
//   semicolons.mode === "insert" → semi: true
//   semicolons.mode === "remove" → semi: false
//   indent.width === <number>    → tabWidth: <number>, useTabs: false
// Reports that didn't recommend anything contribute no fields, so an
// empty TsSurveyReport renders as `{}`.

import type {Options as PrettierOptions} from "prettier"

import type {TsSurveyReport} from "../report/run-reports.ts"
import type {Writer} from "./writable.ts"

export function writePrettierConfig(report: TsSurveyReport, stream: Writer): void {
    const opts: PrettierOptions = {}
    if (report.semicolons?.mode === "insert") opts.semi = true
    else if (report.semicolons?.mode === "remove") opts.semi = false
    if (typeof report.indent?.width === "number") {
        opts.tabWidth = report.indent.width
        opts.useTabs = false
    }
    stream.write(JSON.stringify(opts, null, 4) + "\n")
}
