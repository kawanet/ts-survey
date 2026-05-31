// refineCLI is the whole CLI as a function: parse argv into the common
// (globals + subcommand) shape, then hand the leftover tokens to the matching
// command handler in COMMAND_TABLE. Each handler parses its own options, opens
// the project, and runs. refineCLI writes stdout-bound output to `stream`,
// resolves with the process exit status, and never calls process.exit or
// rejects.
//
// Diagnostics and per-command progress stay on console.error / the runners'
// own console output, which already target the process's stderr/stdout.

import type {CommandGlobals} from "./args-common.ts"
import type {CLIStream} from "./cli-io.ts"
import {runFormat} from "./format/format-cli.ts"
import {runInspect} from "./inspect/inspect-cli.ts"
import {runList} from "./list/list-cli.ts"
import {runMove} from "./move/move-cli.ts"
import {parseArgs} from "./parse-args.ts"
import {runRename} from "./rename/rename-cli.ts"
import {runReport} from "./report/report-cli.ts"
import {usage} from "./usage.ts"

// A command handler parses its own tokens, opens the project, runs, and
// resolves with the exit status. Read-only commands ignore `stream` only by
// taking fewer parameters.
type CommandHandler = (sub: string[], globals: CommandGlobals, stream: CLIStream) => Promise<number>

// The command table is the single source of truth for the set of subcommands:
// membership here is what makes a name valid, so parse-args stays command-
// agnostic. Insertion order also drives the accepted-subcommand error message.
const COMMAND_TABLE = new Map<string, CommandHandler>([
    ["report", runReport],
    ["format", runFormat],
    ["list", runList],
    ["inspect", runInspect],
    ["move", runMove],
    ["rename", runRename],
])

// Write commands accept --dry-run; the rest reject it as a likely mistake.
const DRY_RUN_COMMANDS: ReadonlySet<string> = new Set(["format", "move", "rename"])

function acceptedSubcommands(): string {
    return [...COMMAND_TABLE.keys(), "help"].join(", ")
}

// The whole CLI as a function: parse `args` (argv minus node/script),
// dispatch the subcommand writing stdout-bound output to `stream`, and
// resolve with the process exit status (0 ok, 1 on error). Never throws.
type refineCLI = (args: string[], stream: CLIStream) => Promise<number>

export const refineCLI: refineCLI = async (args, stream) => {
    const parsed = parseArgs(args)

    // parseArgs returns undefined for argv errors (stderr already written),
    // {help} for the help command, or CommonArgs for normal dispatch.
    if (parsed === undefined) {
        console.error(usage())
        return 1
    }
    if ("help" in parsed) {
        stream.write(usage() + "\n")
        return 0
    }

    const handler = COMMAND_TABLE.get(parsed.command)
    if (handler === undefined) {
        // A leading dash means the user gave an option where the subcommand
        // belongs; otherwise it's just an unrecognized command name.
        if (parsed.command.startsWith("-")) {
            console.error(`expected a subcommand: ${acceptedSubcommands()}`)
        } else {
            console.error(`unknown command: ${parsed.command} (expected: ${acceptedSubcommands()})`)
        }
        console.error(usage())
        return 1
    }

    // --dry-run only means something for the write commands.
    if (parsed.dryRun && !DRY_RUN_COMMANDS.has(parsed.command)) {
        console.error("--dry-run is only valid with format, move, or rename")
        return 1
    }

    // Library throws (missing tsconfig, unknown report name) become a clean
    // non-zero status rather than an unhandled rejection.
    try {
        return await handler(parsed.rest, parsed, stream)
    } catch (e) {
        console.error(e instanceof Error ? e.message : String(e))
        return 1
    }
}
