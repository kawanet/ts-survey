import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {parseArgs} from "../parse-args.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../../sample/basic/tsconfig.json")
const SAMPLE_DIR = path.dirname(SAMPLE_TSCONFIG)

describe("parseArgs inspect", () => {
    it("defaults `inspect` to the full inspector registry", () => {
        const r = parseArgs(["inspect", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "inspect")
        assert.deepEqual(r.inspectorNames, ["exports", "importers"])
    })

    it("collects inspector selectors and dedupes", () => {
        const r = parseArgs(["inspect", "--exports", "--importers", "--exports", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.inspectorNames, ["exports", "importers"])
    })

    it("passes unknown inspector selectors through (refineInspect validates)", () => {
        const r = parseArgs(["inspect", "--typo", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.inspectorNames, ["typo"])
    })

    it("accepts positional files under inspect", () => {
        const r = parseArgs(["inspect", "-p", SAMPLE_TSCONFIG, "a.ts"])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.paths, [path.join(SAMPLE_DIR, "a.ts")])
    })
})
