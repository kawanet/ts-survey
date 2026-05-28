/**
 * https://github.com/kawanet/ts-survey
 */

import type {Project} from "ts-morph"

export {}; // external module indicator

// Internal sink contract used by report writers. Consumers never construct
// or name this directly; they pass `process.stdout` or any object with a
// `write(line)` method as `RunReportsOpts.stream`.
type Writer = {write: (line: string) => void}

export interface RunOrganizeImportsOpts {
    absIncludes: string[]
    absExcludes: string[]
    dryRun: boolean
}

export interface RunSemicolonsOpts extends RunOrganizeImportsOpts {
    mode: "remove" | "insert"
}

export interface RunReportsOpts {
    absIncludes: string[]
    absExcludes: string[]
    stream: Writer
    reportNames: string[]
}

export declare function initProject(tsconfigPath: string): Project

export declare function runOrganizeImports(project: Project, opts: RunOrganizeImportsOpts): Promise<void>

export declare function runSemicolons(project: Project, opts: RunSemicolonsOpts): Promise<void>

export declare function runReports(project: Project, opts: RunReportsOpts): Promise<void>
