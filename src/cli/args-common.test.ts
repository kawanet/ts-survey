// Shared CLI grammar: help, tsconfig/path resolution, position-independent
// globals, and the cross-command errors. Per-command option parsing is
// covered in src/cli/<command>/<command>-args.test.ts.

import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {parseArgs} from "./parse-args.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../sample/basic/tsconfig.json")
const SAMPLE_DIR = path.dirname(SAMPLE_TSCONFIG)

// Silences the expected stderr writes so the test output stays clean.
function quiet<T>(fn: () => T): T {
    const orig = console.error
    console.error = () => {}
    try {
        return fn()
    } finally {
        console.error = orig
    }
}

describe("parseArgs help", () => {
    it("returns {help: true} on help, -h, --help, and no args", () => {
        assert.deepEqual(parseArgs(["help"]), {help: true})
        assert.deepEqual(parseArgs(["--help"]), {help: true})
        assert.deepEqual(parseArgs(["-h"]), {help: true})
        assert.deepEqual(parseArgs([]), {help: true})
    })

    it("treats -h / --help as help even after a subcommand", () => {
        assert.deepEqual(parseArgs(["report", "--help"]), {help: true})
        assert.deepEqual(parseArgs(["format", "-h"]), {help: true})
    })
})

describe("parseArgs tsconfig + path resolution", () => {
    it("defaults tsconfigPath to ./tsconfig.json when none is given", () => {
        const r = parseArgs(["format"])
        assert.ok(r && !("help" in r))
        assert.equal(r.tsconfigPath, path.resolve("tsconfig.json"))
    })

    it("accepts -p with a tsconfig.json path", () => {
        const r = parseArgs(["report", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.tsconfigPath, SAMPLE_TSCONFIG)
    })

    it("accepts --project as the long form of -p", () => {
        const r = parseArgs(["report", "--project", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.tsconfigPath, SAMPLE_TSCONFIG)
    })

    it("treats a non-.json -p value as a directory and appends tsconfig.json", () => {
        const r = parseArgs(["report", "-p", SAMPLE_DIR])
        assert.ok(r && !("help" in r))
        assert.equal(r.tsconfigPath, path.join(SAMPLE_DIR, "tsconfig.json"))
    })

    it("treats `-p .` the same as omitting the path", () => {
        const r = parseArgs(["report", "-p", "."])
        assert.ok(r && !("help" in r))
        assert.equal(r.tsconfigPath, path.resolve("tsconfig.json"))
    })

    it("resolves positional file globs against the tsconfig directory", () => {
        const r = parseArgs(["report", "-p", SAMPLE_TSCONFIG, "src/**", "extra.ts"])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.paths, [path.join(SAMPLE_DIR, "src/**"), path.join(SAMPLE_DIR, "extra.ts")])
    })
})

describe("parseArgs globals (position-independent)", () => {
    // Global options (-p / --project, --dry-run) may sit on either side of
    // the subcommand; the three duplicate shapes behave identically.
    it("accepts -p before the subcommand (global, left side)", () => {
        const r = parseArgs(["-p", SAMPLE_TSCONFIG, "report"])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "report")
        assert.equal(r.tsconfigPath, SAMPLE_TSCONFIG)
    })

    it("accepts --project before the subcommand for any command", () => {
        const r = parseArgs(["--project", SAMPLE_TSCONFIG, "format", "--semicolons", "off"])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "format")
        assert.equal(r.tsconfigPath, SAMPLE_TSCONFIG)
        assert.equal(r.applyOverrides.semicolons, "off")
    })

    it("accepts --dry-run before the subcommand (left side)", () => {
        const r = parseArgs(["--dry-run", "format", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "format")
        assert.equal(r.dryRun, true)
    })

    it("rejects --dry-run for a read command, wherever it sits", () => {
        assert.equal(
            quiet(() => parseArgs(["report", "--dry-run", "-p", SAMPLE_TSCONFIG])),
            undefined,
        )
        assert.equal(
            quiet(() => parseArgs(["--dry-run", "report", "-p", SAMPLE_TSCONFIG])),
            undefined,
        )
    })

    it("rejects -p duplicated across either side, like the right-side duplicate", () => {
        // left+right
        assert.equal(
            quiet(() => parseArgs(["-p", SAMPLE_TSCONFIG, "report", "-p", SAMPLE_TSCONFIG])),
            undefined,
        )
        // left+left
        assert.equal(
            quiet(() => parseArgs(["-p", SAMPLE_TSCONFIG, "-p", SAMPLE_TSCONFIG, "report"])),
            undefined,
        )
        // right+right
        assert.equal(
            quiet(() => parseArgs(["report", "-p", SAMPLE_TSCONFIG, "-p", SAMPLE_TSCONFIG])),
            undefined,
        )
    })
})

describe("parseArgs subcommand errors", () => {
    it("returns undefined on an unknown command", () => {
        const r = quiet(() => parseArgs(["frobnicate", "-p", SAMPLE_TSCONFIG]))
        assert.equal(r, undefined)
    })

    it("returns undefined when options are given without a subcommand", () => {
        const r = quiet(() => parseArgs(["--output", "prettier", "-p", SAMPLE_TSCONFIG]))
        assert.equal(r, undefined)
    })

    it("treats globals with no subcommand as a usage error, not help", () => {
        assert.equal(
            quiet(() => parseArgs(["-p", SAMPLE_TSCONFIG])),
            undefined,
        )
        assert.equal(
            quiet(() => parseArgs(["--dry-run"])),
            undefined,
        )
    })
})
