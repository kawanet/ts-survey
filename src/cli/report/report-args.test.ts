import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {parseReport} from "./report-args.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../../sample/basic/tsconfig.json")
const G = {tsconfigPath: SAMPLE_TSCONFIG, dryRun: false}

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

describe("parseReport", () => {
    it("collects report-name selector flags with de-duplication", () => {
        const r = parseReport(["--unused-exports", "--semicolons", "--unused-exports"], G)
        assert.ok(r)
        assert.deepEqual(r.reportNames, ["unused-exports", "semicolons"])
    })

    it("passes unknown report selectors through without rejecting (refineReport validates)", () => {
        const r = parseReport(["--typo-name"], G)
        assert.ok(r)
        assert.deepEqual(r.reportNames, ["typo-name"])
    })

    it("passes unknown --output names through without rejecting (selectOutput validates)", () => {
        const r = parseReport(["--output", "typo-format"], G)
        assert.ok(r)
        assert.equal(r.output, "typo-format")
    })

    it("accepts report selectors alongside --output", () => {
        const r = parseReport(["--semicolons", "--output", "ts-refine"], G)
        assert.ok(r)
        assert.deepEqual(r.reportNames, ["semicolons"])
        assert.equal(r.output, "ts-refine")
        assert.equal(r.surveyDefault, false)
    })

    it("runs every registered report under a bare `report` (survey default)", () => {
        const r = parseReport([], G)
        assert.ok(r)
        // Survey-style default: every report in the registry runs.
        assert.ok(r.reportNames.includes("semicolons"))
        assert.ok(r.reportNames.includes("bracket-spacing"))
        assert.equal(r.surveyDefault, true)
    })

    it("opts out of the survey-default flag when selectors or --output are given", () => {
        assert.equal(parseReport(["--unused-exports"], G)?.surveyDefault, false)
        assert.equal(parseReport(["--output", "prettier"], G)?.surveyDefault, false)
    })

    it("returns undefined on a stray single-dash option", () => {
        assert.equal(
            quiet(() => parseReport(["-z"], G)),
            undefined,
        )
    })
})
