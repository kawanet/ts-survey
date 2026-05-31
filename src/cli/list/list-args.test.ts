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

describe("parseArgs list", () => {
    it("parses `list` with no filters", () => {
        const r = parseArgs(["list", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "list")
        assert.deepEqual(r.listFilters, {noExports: false, noImporters: false, unusedExports: false})
    })

    it("parses the `list` filter flags", () => {
        const r = parseArgs(["list", "--no-exports", "--unused-exports", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.listFilters, {noExports: true, noImporters: false, unusedExports: true})
    })

    it("accepts positional files under list", () => {
        const r = parseArgs(["list", "-p", SAMPLE_TSCONFIG, "a.ts"])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.paths, [path.join(SAMPLE_DIR, "a.ts")])
    })

    it("returns undefined on an unknown list option", () => {
        const r = quiet(() => parseArgs(["list", "--bogus", "-p", SAMPLE_TSCONFIG]))
        assert.equal(r, undefined)
    })
})
