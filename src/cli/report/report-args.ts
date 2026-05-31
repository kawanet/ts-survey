// `report`: collect report-name selectors (`--<report>`), the optional
// `--output`, and positional files. Unknown `--<name>` is treated as a
// report selector (validated later by refineReport), matching how the old
// positional report names behaved.

import {reportNames as knownReportNames} from "../../report/report-names.ts"
import {type Globals, type ParseArgsResult, resolvePaths} from "../args-common.ts"

export function parseReport(sub: string[], globals: Globals): ParseArgsResult | undefined {
    const reportNames: string[] = []
    const files: string[] = []
    let output: string | null = null

    for (let i = 0; i < sub.length; i++) {
        const a = sub[i]
        if (a === "--output") {
            const v = sub[++i]
            if (!v || v.startsWith("-")) {
                console.error("--output requires a value (e.g. --output prettier)")
                return undefined
            }
            output = v
        } else if (a.startsWith("--")) {
            const name = a.slice(2)
            if (!reportNames.includes(name)) reportNames.push(name)
        } else if (a.startsWith("-")) {
            console.error(`unknown option: ${a}`)
            return undefined
        } else {
            files.push(a)
        }
    }

    const surveyDefault = reportNames.length === 0 && output === null
    const effectiveReports = reportNames.length > 0 ? reportNames : [...knownReportNames]
    const {absTsconfig, paths} = resolvePaths(globals.tsconfigPath, files)
    return {command: "report", reportNames: effectiveReports, output, applyOverrides: {}, surveyDefault, tsconfigPath: absTsconfig, dryRun: false, paths}
}
