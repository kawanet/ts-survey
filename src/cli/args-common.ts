// Shared pieces of the CLI argument grammar. parseArgs (in parse-args.ts)
// only resolves the globals and the subcommand; it returns CommonArgs with the
// leftover tokens in `rest`, and the per-command parser in
// src/cli/<command>/<command>-args.ts turns those into its own typed args.

// Result of the common pass: the leading token verbatim (the router decides
// whether it names a real command, help, or nothing), the globals, and the
// still-unparsed tokens to its right. The per-command parser consumes `rest`.
export interface CommonArgs {
    command: string | undefined
    tsconfigPath: string | null
    dryRun: boolean
    rest: string[]
}

// Global options collected position-independently, plus the leftover tokens
// (the subcommand and its own arguments, in order).
export interface Globals {
    tsconfigPath: string | null
    dryRun: boolean
    rest: string[]
}

// The slice of the globals a per-command parser needs: the raw tsconfig path
// (resolved per command via resolvePaths) and the dry-run flag.
export type CommandGlobals = Pick<Globals, "tsconfigPath" | "dryRun">

// Pulls the global options out of argv regardless of position, leaving the
// subcommand and its own args in `rest`. `-p` given more than once (on
// either side) is an error; `--dry-run` repeated is idempotent. So the
// three duplicate shapes — left+left, left+right, right+right — behave
// identically, which is the whole point of treating these as positionless.
export function extractGlobals(argv: string[]): Globals | undefined {
    let tsconfigPath: string | null = null
    let dryRun = false
    const rest: string[] = []

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i]
        if (a === "-p" || a === "--project") {
            const v = argv[++i]
            if (!v || v.startsWith("-")) {
                console.error(`${a} requires a path (e.g. ${a} tsconfig.json)`)
                return undefined
            }
            if (tsconfigPath !== null) {
                console.error(`${a} cannot be combined with another tsconfig path`)
                return undefined
            }
            tsconfigPath = v
        } else if (a === "--dry-run") {
            dryRun = true
        } else {
            rest.push(a)
        }
    }

    return {tsconfigPath, dryRun, rest}
}
