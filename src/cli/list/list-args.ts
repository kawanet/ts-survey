// `list`: cleanup-candidate filters plus positional files. Each flag is a
// boolean; multiple are OR-combined downstream.

import {type CommandGlobals, resolvePaths} from "../args-common.ts"

// `list` filter flags; OR-combined when more than one is set.
export interface ListFilters {
    noExports: boolean
    noImporters: boolean
    unusedExports: boolean
}

export interface ListArgs {
    tsconfigPath: string
    paths: string[]
    listFilters: ListFilters
}

export function parseList(sub: string[], globals: CommandGlobals): ListArgs | undefined {
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
    return {tsconfigPath: absTsconfig, paths, listFilters: {noExports, noImporters, unusedExports}}
}
