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

describe("parseArgs move", () => {
    it("parses `move` positionals as a flat path list (split happens at dispatch)", () => {
        const r = parseArgs(["move", "a.ts", "b.ts", "dest/", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "move")
        // resolvePaths preserves the trailing `/` so dispatch can detect a directory dest.
        assert.deepEqual(r.paths, [path.join(SAMPLE_DIR, "a.ts"), path.join(SAMPLE_DIR, "b.ts"), path.join(SAMPLE_DIR, "dest") + path.sep])
    })

    it("accepts --dry-run under move", () => {
        const r = parseArgs(["move", "a.ts", "dest", "--dry-run", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.dryRun, true)
    })

    it("rejects move with fewer than two positionals", () => {
        const r = quiet(() => parseArgs(["move", "only-one.ts", "-p", SAMPLE_TSCONFIG]))
        assert.equal(r, undefined)
    })
})
