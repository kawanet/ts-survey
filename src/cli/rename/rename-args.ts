// `rename`: rename an exported identifier. --from / --to are required; an
// optional positional file scopes the lookup to that file's exports.

import {applyReportNames} from "../../report/report-names.ts"
import {type Globals, type ParseArgsResult, resolvePaths} from "../args-common.ts"

export function parseRename(sub: string[], globals: Globals): ParseArgsResult | undefined {
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
    // rename surveys the project to drive its post-rename organizeImports.
    return {command: "rename", from, to, renameFile: paths[0] ?? null, reportNames: [...applyReportNames], output: null, applyOverrides: {}, surveyDefault: false, tsconfigPath: absTsconfig, dryRun: globals.dryRun, paths: []}
}
