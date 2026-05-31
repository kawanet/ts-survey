// `move` runner: split the flat positional list into sources + destination,
// survey the project so the post-move organizeImports follows the codebase's
// conventions, then relocate.

import type {Project} from "ts-morph"
import {refineMove, refineReport, type TSR} from "../../index.ts"
import {applyReportNames} from "../../report/report-names.ts"
import {NULL_SINK} from "../cli-io.ts"
import type {MoveArgs} from "./move-args.ts"

export async function runMove(project: Project, args: MoveArgs): Promise<void> {
    const sources = args.paths.slice(0, -1)
    const dest = args.paths[args.paths.length - 1]
    const reportNames = applyReportNames as TSR.ReportName[]
    const report = await refineReport(project, {paths: [], reportNames, stream: NULL_SINK})
    await refineMove(project, {sources, dest, dryRun: args.dryRun, report})
}
