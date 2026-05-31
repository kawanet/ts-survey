// `format` runner: survey the project for the recommendation, then apply it
// (plus any CLI overrides). The Markdown stream is swallowed; refineFormat
// writes the files.

import type {Project} from "ts-morph"
import {refineFormat, refineReport, type TSR} from "../../index.ts"
import {applyReportNames} from "../../report/report-names.ts"
import {NULL_SINK} from "../cli-io.ts"
import type {FormatArgs} from "./format-args.ts"

export async function runFormat(project: Project, args: FormatArgs): Promise<void> {
    const reportNames = applyReportNames as TSR.ReportName[]
    const report = await refineReport(project, {paths: args.paths, reportNames, stream: NULL_SINK})
    await refineFormat(project, {paths: args.paths, dryRun: args.dryRun, report, ...args.applyOverrides})
}
