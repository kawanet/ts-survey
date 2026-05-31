// `list`: cleanup-candidate filters plus positional files. Each flag is a
// boolean; multiple are OR-combined downstream.

import {type Globals, type ParseArgsResult, resolvePaths} from "../args-common.ts"

export function parseList(sub: string[], globals: Globals): ParseArgsResult | undefined {
    const files: string[] = []
    let noExports = false
    let noImporters = false
    let unusedExports = false

    for (const a of sub) {
        if (a === "--no-exports") {
            noExports = true
        } else if (a === "--no-importers") {
            noImporters = true
        } else if (a === "--unused-exports") {
            unusedExports = true
        } else if (a.startsWith("-")) {
            console.error(`unknown option: ${a}`)
            return undefined
        } else {
            files.push(a)
        }
    }

    const {absTsconfig, paths} = resolvePaths(globals.tsconfigPath, files)
    return {command: "list", reportNames: [], output: null, applyOverrides: {}, surveyDefault: false, tsconfigPath: absTsconfig, dryRun: false, paths, listFilters: {noExports, noImporters, unusedExports}}
}
