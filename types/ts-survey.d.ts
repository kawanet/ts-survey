/**
 * https://github.com/kawanet/ts-survey
 */

import type {Project} from "ts-morph";

export {}; // external module indicator

// Sink contract for report writers. Callers pass `process.stdout` or
// any object with `write(line)`.
type Writer = {write: (line: string) => void}

// Common base for every entry. Leaf Opts interfaces inherit it.
interface TsSurveyOpts {
    absIncludes: string[]
    absExcludes: string[]
}

// Recommendation shapes. Not runtime inputs — they describe the value
// type of each `TsSurveyReport` slot.

export interface RunSemicolonsOpts {
    semicolons: "on" | "off"
}

export interface RunIndentOpts {
    width: number
}

export interface RunMemberSeparatorsOpts {
    separator: "semi" | "comma" | "none"
}

export interface RunNewLineOpts {
    newLine: "lf" | "crlf" | "cr"
}

export interface RunBracketSpacingOpts {
    bracketSpacing: "on" | "off"
}

// Every report runReports knows about. Pair with src/report/report-names.ts
// (runtime list) and src/report/run-reports.ts (dispatch).
export type TsSurveyReportName =
    | "unused-exports"
    | "semicolons"
    | "indent"
    | "member-separators"
    | "new-line"
    | "bracket-spacing"

export interface RunReportsOpts extends TsSurveyOpts {
    stream: Writer
    reportNames: TsSurveyReportName[]
}

// Per-report recommendations. A missing key means the report didn't run
// or had nothing to recommend.
export interface TsSurveyReport {
    semicolons?: Partial<RunSemicolonsOpts>
    indent?: Partial<RunIndentOpts>
    memberSeparators?: Partial<RunMemberSeparatorsOpts>
    newLine?: Partial<RunNewLineOpts>
    bracketSpacing?: Partial<RunBracketSpacingOpts>
}

// Input to `runFix`. `report` provides defaults; the top-level overrides
// win per field. `organizeImports` defaults to "on" when omitted.
export interface RunFixOpts extends TsSurveyOpts {
    dryRun: boolean
    report: TsSurveyReport
    organizeImports?: "on" | "off"
    indent?: number
    semicolons?: "on" | "off"
    // LS `newLineCharacter` only accepts \n / \r\n; a `cr` recommendation
    // is logged but not applied.
    newLine?: "lf" | "crlf"
    bracketSpacing?: "on" | "off"
}

export declare function initProject(tsconfigPath: string): Project

export declare function runReports(project: Project, opts: RunReportsOpts): Promise<TsSurveyReport>

export declare function runFix(project: Project, opts: RunFixOpts): Promise<void>
