# ts-refine

[![Node.js CI](https://github.com/kawanet/ts-refine/actions/workflows/nodejs.yml/badge.svg?branch=main)](https://github.com/kawanet/ts-refine/actions/)
[![npm version](https://img.shields.io/npm/v/ts-refine)](https://www.npmjs.com/package/ts-refine)

Zero-config TypeScript refactoring that conforms to your codebase's **own**
conventions instead of imposing its own. `ts-refine` infers how your project
already writes code, then moves files, renames symbols, organizes imports, and
formats — every edit landing in the style it detected, so it blends in rather
than churning the diff. No `.prettierrc`, no rule config: the codebase is the
spec.

- Built on the TypeScript Language Service (via
  [ts-morph](https://github.com/dsherret/ts-morph)) — the same engine your
  editor uses for import rewriting and formatting.
- Safe, low-friction cleanup after code changes — handy for both humans and AI
  coding agents.

## Install

Requires Node.js >= 22.18.

```sh
npx ts-refine <command> [options] [files...]
```

## Synopsis

```sh
# list the available commands
npx ts-refine help

# show each file's exports and how they're used
npx ts-refine list

# survey the code style and print recommendations
npx ts-refine report

# apply the surveyed style and organize imports
npx ts-refine format

# move a file; every import of it is rewritten
npx ts-refine move fileA.ts fileB.ts

# rename an export across the whole project
npx ts-refine rename --from funcA --to funcB
```

## Commands

| Command  | What it does                                                        |
| -------- | ------------------------------------------------------------------ |
| `help`   | Show usage (also `-h`, `--help`, or no args)                       |
| `list`   | List files with export / unused / importer counts                  |
| `report` | Survey the codebase and print Markdown reports + recommendations   |
| `format` | Apply the surveyed style to disk and organize imports              |
| `move`   | Move `.ts` files and rewrite every import that references them      |
| `rename` | Rename an exported identifier and every reference across the project |

`inspect` adds per-file export / importer analysis; see `npx ts-refine --help`.

Global options may appear on either side of the command:

- `-p, --project <path>` — a `tsconfig.json` or a directory containing one
  (defaults to `-p .`).
- `--dry-run` — for `format` / `move` / `rename`, print what would change
  instead of writing.
- `-h, --help` — show usage.

## List

`list` prints every file with its export, unused-export, and importer counts.
Narrow the listing (filters combine with OR): `--no-exports`, `--no-importers`,
`--unused-exports`.

## Report

`report` surveys the code style and prints a Markdown table per dimension
(semicolons, indent, member-separators, new-line, bracket-spacing) with a
recommendation. `--output prettier` emits a `.prettierrc`, and
`--output ts-refine` emits a runnable `format` command, instead of Markdown.

## Format

`format` rewrites every file to the surveyed conventions and organizes imports.
Override any field instead of following the survey: `--indent <N|tab>`,
`--semicolons on|off`, `--new-line lf|crlf`, `--bracket-spacing on|off`,
`--organize-imports on|off`.

## Move

`move <source...> <dest>` relocates `.ts` files and rewrites every import that
references them. `dest` may be a directory (for multiple sources) or a target
filename (to rename a single file). Imports of the touched files are re-sorted
afterward.

## Rename

`rename --from <a> --to <b>` renames an exported identifier and every reference
across the project, keeping importer aliases intact. Pass a file
(`rename <file> --from ...`) to scope the lookup when the name isn't unique.

## Why not just Prettier?

Style unification is Prettier's job, and `ts-refine` does not try to replace
it. The value here is the **refactoring** operations that need to understand
your code as a graph — moving a file and rewriting every importer, organizing
imports the way your project already does — done with zero configuration. The
formatter exists mainly so those edits blend into the surrounding file rather
than fighting it.

## License

MIT
