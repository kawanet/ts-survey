// `move`: positional args are `<source...> <dest>` — the parser only
// validates the count and stores them as `paths`; the cli/dispatch layer
// splits the list (last element → dest, the rest → sources) and hands
// them to refineMove.

import {applyReportNames} from "../../report/report-names.ts"
import {type Globals, type ParseArgsResult, resolvePaths} from "../args-common.ts"

export function parseMove(sub: string[], globals: Globals): ParseArgsResult | undefined {
    const files: string[] = []
    for (const a of sub) {
        if (a.startsWith("-")) {
            console.error(`unknown option: ${a}`)
            return undefined
        }
        files.push(a)
    }

    if (files.length < 2) {
        console.error("move requires at least one source and a destination (e.g. move foo.ts dest/)")
        return undefined
    }

    const {absTsconfig, paths} = resolvePaths(globals.tsconfigPath, files)
    // move surveys the project to drive its post-move organizeImports.
    return {command: "move", reportNames: [...applyReportNames], output: null, applyOverrides: {}, surveyDefault: false, tsconfigPath: absTsconfig, dryRun: globals.dryRun, paths}
}
