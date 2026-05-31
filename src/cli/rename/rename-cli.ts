// `rename` runner: survey the project so the post-rename organizeImports
// follows the codebase's conventions, then rename the exported identifier.

import type {Project} from "ts-morph"
import {refineRename, refineReport, type TSR} from "../../index.ts"
import {applyReportNames} from "../../report/report-names.ts"
import {NULL_SINK} from "../cli-io.ts"
import type {RenameArgs} from "./rename-args.ts"

export async function runRename(project: Project, args: RenameArgs): Promise<void> {
    const reportNames = applyReportNames as TSR.ReportName[]
    const report = await refineReport(project, {paths: [], reportNames, stream: NULL_SINK})
    await refineRename(project, {from: args.from, to: args.to, file: args.renameFile, dryRun: args.dryRun, report})
}
