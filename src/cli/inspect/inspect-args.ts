// `inspect`: per-file analysis. `--<inspector>` flags select which
// inspectors run (default: all). Unknown `--<name>` becomes a selector
// and is validated at runtime by refineInspect (mirrors parseReport).

import {inspectorNames as knownInspectorNames} from "../../inspect/inspector-names.ts"
import {type Globals, type ParseArgsResult, resolvePaths} from "../args-common.ts"

export function parseInspect(sub: string[], globals: Globals): ParseArgsResult | undefined {
    const inspectorNames: string[] = []
    const files: string[] = []

    for (const a of sub) {
        if (a.startsWith("--")) {
            const name = a.slice(2)
            if (!inspectorNames.includes(name)) inspectorNames.push(name)
        } else if (a.startsWith("-")) {
            console.error(`unknown option: ${a}`)
            return undefined
        } else {
            files.push(a)
        }
    }

    const effective = inspectorNames.length > 0 ? inspectorNames : [...knownInspectorNames]
    const {absTsconfig, paths} = resolvePaths(globals.tsconfigPath, files)
    return {command: "inspect", reportNames: [], inspectorNames: effective, output: null, applyOverrides: {}, surveyDefault: false, tsconfigPath: absTsconfig, dryRun: false, paths}
}
