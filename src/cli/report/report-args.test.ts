import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {parseArgs} from "../parse-args.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../../sample/basic/tsconfig.json")

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

describe("parseArgs report", () => {
    it("collects report-name selector flags with de-duplication", () => {
        const r = parseArgs(["report", "--unused-exports", "--semicolons", "--unused-exports", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "report")
        assert.deepEqual(r.reportNames, ["unused-exports", "semicolons"])
    })

    it("passes unknown report selectors through without rejecting (refineReport validates)", () => {
        const r = parseArgs(["report", "--typo-name", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.reportNames, ["typo-name"])
    })

    it("passes unknown --output names through without rejecting (selectOutput validates)", () => {
        const r = parseArgs(["report", "--output", "typo-format", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.equal(r.output, "typo-format")
    })

    it("accepts report selectors alongside --output", () => {
        const r = parseArgs(["report", "--semicolons", "--output", "ts-refine", "-p", SAMPLE_TSCONFIG])
        assert.ok(r && !("help" in r))
        assert.deepEqual(r.reportNames, ["semicolons"])
        assert.equal(r.output, "ts-refine")
        assert.equal(r.surveyDefault, false)
    })

    it("runs every registered report under a bare `report` (survey default)", () => {
        const r = parseArgs(["report"])
        assert.ok(r && !("help" in r))
        assert.equal(r.command, "report")
        // Survey-style default: every report in the registry runs.
        assert.ok(r.reportNames.includes("semicolons"))
        assert.ok(r.reportNames.includes("bracket-spacing"))
        assert.equal(r.surveyDefault, true)
    })

    it("opts out of the survey-default flag when selectors or --output are given", () => {
        const r1 = parseArgs(["report", "--unused-exports", "-p", SAMPLE_TSCONFIG])
        assert.ok(r1 && !("help" in r1))
        assert.equal(r1.surveyDefault, false)
        const r2 = parseArgs(["report", "--output", "prettier", "-p", SAMPLE_TSCONFIG])
        assert.ok(r2 && !("help" in r2))
        assert.equal(r2.surveyDefault, false)
    })

    it("returns undefined on a stray single-dash option under report", () => {
        const r = quiet(() => parseArgs(["report", "-z", "-p", SAMPLE_TSCONFIG]))
        assert.equal(r, undefined)
    })
})
