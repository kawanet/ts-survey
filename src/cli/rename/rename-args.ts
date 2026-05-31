// `rename`: rename an exported identifier. --from / --to are required; an
// optional positional file scopes the lookup to that file's exports.

import {type CommandGlobals, resolvePaths} from "../args-common.ts"

export interface RenameArgs {
    tsconfigPath: string
    dryRun: boolean
    from: string
    to: string
    // Absolute path that scopes the lookup to one file's exports, or null
    // for a project-wide rename.
    renameFile: string | null
}

export function parseRename(sub: string[], globals: CommandGlobals): RenameArgs | undefined {
    let from: string | undefined
    let to: string | undefined
    const files: string[] = []

    for (let i = 0; i < sub.length; i++) {
        const a = sub[i]
        if (a === "--from") {
            from = sub[++i]
            if (!from || from.startsWith("-")) {
                console.error("--from requires an identifier (e.g. --from oldName)")
                return undefined
            }
        } else if (a === "--to") {
            to = sub[++i]
            if (!to || to.startsWith("-")) {
                console.error("--to requires an identifier (e.g. --to newName)")
                return undefined
            }
        } else if (a.startsWith("-")) {
            console.error(`unknown option: ${a}`)
            return undefined
        } else {
            files.push(a)
        }
    }

    if (from === undefined || to === undefined) {
        console.error("rename requires --from <name> and --to <name>")
        return undefined
    }
    if (files.length > 1) {
        console.error("rename accepts at most one file to scope the lookup")
        return undefined
    }

    const {absTsconfig, paths} = resolvePaths(globals.tsconfigPath, files)
    return {tsconfigPath: absTsconfig, dryRun: globals.dryRun, from, to, renameFile: paths[0] ?? null}
}
