import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {Project} from "ts-morph"
import {detectIndent} from "../lib/detect-indent.ts"
import {runReportIndent} from "./indent.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../sample/indents-mixed/tsconfig.json")

describe("detectIndent", () => {
    it("classifies a tab-indented file as `tab`", () => {
        const r = detectIndent("function f() {\n\treturn 1\n}\n")
        assert.equal(r?.unit, "tab")
    })

    it("returns the GCD of leading-space counts for a 2-space file", () => {
        const r = detectIndent("function f() {\n  if (x) {\n    return 1\n  }\n}\n")
        assert.equal(r?.unit, 2)
    })

    it("returns 4 for a uniformly 4-space file", () => {
        const r = detectIndent("function f() {\n    if (x) {\n        return 1\n    }\n}\n")
        assert.equal(r?.unit, 4)
    })

    it("ignores ` *` block-comment continuation lines", () => {
        // Without the filter, the ` * ...` lines would pull the GCD down to 1.
        const text = "/**\n * doc line\n * doc line\n */\nfunction f() {\n    return 1\n}\n"
        assert.equal(detectIndent(text)?.unit, 4)
    })

    it("returns null for files with no indented lines", () => {
        assert.equal(detectIndent("const x = 1\nconst y = 2\n"), null)
    })
})

describe("runReportIndent (sample/indents-mixed)", () => {
    it("buckets files by unit and emits a recommendation for the majority", async () => {
        const project = new Project({tsConfigFilePath: SAMPLE_TSCONFIG})
        const lines: string[] = []
        await runReportIndent(project, {stream: {write: (l) => lines.push(l)}, absIncludes: [], absExcludes: []})

        const out = lines.join("")
        assert.match(out, /^### indent\n/)
        // Two 4-space files vs one 2-space vs one tab; no-indent.ts is
        // excluded from totals.
        assert.match(out, /\| 2 \| 1 \| /)
        assert.match(out, /\| 4 \| 2 \| /)
        assert.match(out, /\| tab \| 1 \| /)
        assert.match(out, /\| total \| 4 \| \|/)
        // The 4-space bucket is strictly the largest, so recommendation
        // should be the indent-4 flag in grep-able form.
        assert.match(out, /recommendation:\n {4}--indent 4\n/)
        assert.equal(/no-indent\.ts/.test(out), false)
    })
})
