import {strict as assert} from "node:assert"
import {describe, it} from "node:test"
import {detectIndent} from "./detect-indent.ts"

describe("detectIndent", () => {
    it("returns the line count for tab-leading lines under `tab`", () => {
        const counts = detectIndent("function f() {\n\treturn 1\n}\n")
        assert.equal(counts.get("tab"), 1)
        assert.equal(counts.size, 1)
    })

    it("returns one entry per distinct leading-space width in the file", () => {
        // Mixed widths in one file must produce multiple entries, not a
        // single decision.
        const counts = detectIndent(["function f() {", "  a()", "  b()", "  if (x) {", "    return 1", "  }", "}"].join("\n"))
        assert.equal(counts.get(2), 4)
        assert.equal(counts.get(4), 1)
        assert.equal(counts.has("tab"), false)
    })

    it("skips ` *` block-comment continuation lines so they do not appear under width 1", () => {
        const counts = detectIndent("/**\n * doc line\n * doc line\n */\nfunction f() {\n    return 1\n}\n")
        assert.equal(counts.get(4), 1)
        assert.equal(counts.has(1), false)
    })

    it("returns an empty map for files with no indented lines", () => {
        const counts = detectIndent("const x = 1\nconst y = 2\n")
        assert.equal(counts.size, 0)
    })
})
