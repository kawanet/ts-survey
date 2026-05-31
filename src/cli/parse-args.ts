// argv → ParsedArgs. Subcommand grammar (git-style):
//   ts-refine [global...] <command> [command args...] [global...]
//
// Global options may appear on either side of the subcommand:
//   -p / --project <path>   shared by every command
//   --dry-run               applies to the write commands (format, move)
//   -h / --help             shown anywhere
// Command-specific options (--output, --semicolons, --no-exports, report /
// inspector selectors, ...) stay to the RIGHT of the subcommand.
//
// This file is the orchestrator: it pulls the globals out, validates the
// subcommand, then dispatches to the per-command parser in
// src/cli/<command>/<command>-args.ts. Any non-dash argument after the
// subcommand is a file path; selector validation stays in the runner.

import {type Command, COMMANDS, extractGlobals, type ParseArgsResult} from "./args-common.ts"
import {parseFormat} from "./format/format-args.ts"
import {parseInspect} from "./inspect/inspect-args.ts"
import {parseList} from "./list/list-args.ts"
import {parseMove} from "./move/move-args.ts"
import {parseRename} from "./rename/rename-args.ts"
import {parseReport} from "./report/report-args.ts"

// The accepted-subcommand list for error messages, derived from COMMANDS
// (plus `help`) so adding a subcommand only touches that array. The exact
// separator / `or` wording isn't load-bearing.
const SUBCOMMAND_LIST = [...COMMANDS, "help"].join(", ")

export function parseArgs(argv: string[]): ParseArgsResult | undefined {
    // `help` is the canonical spelling; -h / --help are aliases that win
    // wherever they appear (a global option, like the rest below).
    if (argv.includes("--help") || argv.includes("-h")) return {help: true}

    const globals = extractGlobals(argv)
    if (globals === undefined) return undefined
    const [command, ...sub] = globals.rest

    if (command === undefined) {
        // Bare invocation is help; globals with no subcommand is a usage error.
        if (globals.tsconfigPath !== null || globals.dryRun) {
            console.error(`expected a subcommand: ${SUBCOMMAND_LIST}`)
            return undefined
        }
        return {help: true}
    }
    if (command === "help") return {help: true}
    if (!(COMMANDS as readonly string[]).includes(command)) {
        if (command.startsWith("-")) {
            console.error(`expected a subcommand: ${SUBCOMMAND_LIST}`)
        } else {
            console.error(`unknown command: ${command} (expected: ${SUBCOMMAND_LIST})`)
        }
        return undefined
    }

    // --dry-run only means something for the write commands.
    if (globals.dryRun && command !== "format" && command !== "move" && command !== "rename") {
        console.error("--dry-run is only valid with format, move, or rename")
        return undefined
    }

    switch (command as Command) {
        case "report":
            return parseReport(sub, globals)
        case "format":
            return parseFormat(sub, globals)
        case "list":
            return parseList(sub, globals)
        case "inspect":
            return parseInspect(sub, globals)
        case "move":
            return parseMove(sub, globals)
        case "rename":
            return parseRename(sub, globals)
    }
}
