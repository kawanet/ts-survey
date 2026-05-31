// `move`: positional args are `<source...> <dest>` — the parser only
// validates the count and stores them as `paths`; the runner splits the
// list (last element → dest, the rest → sources) and hands them to refineMove.

import {type CommandGlobals, resolvePaths} from "../args-common.ts"

export interface MoveArgs {
    tsconfigPath: string
    // Flat `<source...> <dest>` list; the runner splits off the destination.
    paths: string[]
    dryRun: boolean
}

export function parseMove(sub: string[], globals: CommandGlobals): MoveArgs | undefined {
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
    return {tsconfigPath: absTsconfig, paths, dryRun: globals.dryRun}
}
