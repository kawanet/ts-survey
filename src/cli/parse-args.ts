// argv → CommonArgs. Subcommand grammar (git-style):
//   ts-refine [global...] <command> [command args...] [global...]
//
// Global options may appear on either side of the subcommand:
//   -p / --project <path>   shared by every command
//   --dry-run               consumed by whichever command honors it
//   -h / --help             handled by the router
// Command-specific options stay to the RIGHT of the subcommand.
//
// This common pass only pulls the globals out and splits off the leading
// token; it makes no decision about help, validity, or --dry-run. It returns
// raw values and leaves every such call to the router (refine-cli.ts) and the
// per-command parsers.

import {type CommonArgs, extractGlobals} from "./args-common.ts"

export function parseArgs(argv: string[]): CommonArgs | undefined {
    const globals = extractGlobals(argv)
    if (globals === undefined) return undefined
    const [command, ...rest] = globals.rest
    return {command, tsconfigPath: globals.tsconfigPath, dryRun: globals.dryRun, rest}
}
