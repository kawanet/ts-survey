import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {parseArgs} from "../parse-args.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../../sample/basic/tsconfig.json")
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

describe("parseArgs rename", () => {
    it("parses --from / --to as a project-wide rename", () => {
        const r = parseArgs(["rename", "--from", "funcA", "--to", "funcB", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "rename")
        assert.equal(r.from, "funcA")
        assert.equal(r.to, "funcB")
        assert.equal(r.renameFile, null)
        assert.equal(r.dryRun, false)
    })

    it("scopes rename to a file, resolved against the tsconfig dir", () => {
        const r = parseArgs(["rename", "libs.ts", "--from", "funcA", "--to", "funcB", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.renameFile, path.resolve(SAMPLE_DIR, "libs.ts"))
    })

    it("accepts --dry-run on either side of rename", () => {
        const r = parseArgs(["--dry-run", "rename", "--from", "funcA", "--to", "funcB", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "rename")
        assert.equal(r.dryRun, true)
    })

    it("errors when --to is missing", () => {
        const r = quiet(() => parseArgs(["rename", "--from", "funcA", "-p", SAMPLE_TSCONFIG]))
        assert.equal(r, undefined)
    })

    it("errors when more than one file is given", () => {
        const r = quiet(() => parseArgs(["rename", "a.ts", "b.ts", "--from", "funcA", "--to", "funcB", "-p", SAMPLE_TSCONFIG]))
        assert.equal(r, undefined)
    })
})
