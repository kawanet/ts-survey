// Shared pieces of the CLI argument grammar: the subcommand list, the
// position-independent global options, and the type a per-command parser
// returns. The per-command parsers live in src/cli/<command>/<command>-args.ts
// and lean on the helpers here.

import path from "node:path"
import type {FormatOptions} from "../recommend/format-options.ts"

export type Command = "report" | "format" | "list" | "inspect" | "move" | "rename"

export const COMMANDS: readonly Command[] = ["report", "format", "list", "inspect", "move", "rename"] as const

// `list` filter flags; OR-combined when more than one is set.
export interface ListFilters {
    noExports: boolean
    noImporters: boolean
    unusedExports: boolean
}

export interface ParsedArgs {
    command: Command
    // For report: the requested selectors or the full registry.
    // For format: the recommendation-bearing reports refineFormat consumes.
    reportNames: string[]
    // inspect-only: the requested inspector selectors, or the full registry.
    inspectorNames?: string[]
    // report-only: suppress Markdown and emit the named output instead.
    output: string | null
    applyOverrides: FormatOptions
    // True only for a bare `report` (no selectors, no --output); gates the
    // recommendation + .prettierrc blocks under the per-report Markdown.
    surveyDefault: boolean
    tsconfigPath: string
    dryRun: boolean
    // Positional file arguments, resolved to absolute (globs allowed).
    paths: string[]
    // list-only: which cleanup-candidate filters were requested.
    listFilters?: ListFilters
    // rename-only: the identifier to rename and its replacement, plus an
    // optional file (absolute) that scopes the lookup to its exports.
    from?: string
    to?: string
    renameFile?: string | null
}

export interface HelpRequested {
    help: true
}

export type ParseArgsResult = ParsedArgs | HelpRequested

// Global options collected position-independently, plus the leftover
// tokens (the subcommand and its own arguments, in order).
export interface Globals {
    tsconfigPath: string | null
    dryRun: boolean
    rest: string[]
}

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

// Resolve the tsconfig path and the positional files. Files are resolved
// against the tsconfig dir (not cwd) so the target set doesn't shift with
// the working directory — same basis the removed --include used. A
// trailing `/` on the input survives the resolve (move uses it as a
// "this is a directory" hint).
export function resolvePaths(tsconfigPath: string | null, files: string[]): {absTsconfig: string; paths: string[]} {
    const absTsconfig = resolveTsconfigPath(tsconfigPath ?? ".")
    const tsconfigDir = path.dirname(absTsconfig)
    const paths = files.map((g) => {
        const absolute = path.isAbsolute(g) ? g : path.resolve(tsconfigDir, g)
        return g.endsWith("/") || g.endsWith(path.sep) ? absolute + path.sep : absolute
    })
    return {absTsconfig, paths}
}

// Mirrors `tsc -p`: a non-`.json` value is treated as a directory and
// `tsconfig.json` is appended.
function resolveTsconfigPath(input: string): string {
    const absolute = path.resolve(input)
    if (input.endsWith(".json")) return absolute
    return path.join(absolute, "tsconfig.json")
}
