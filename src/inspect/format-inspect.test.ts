import {strict as assert} from "node:assert"
import {describe, it} from "node:test"
import type {InspectFile} from "@kawanet/ts-survey"
import {writeInspectFile} from "./format-inspect.ts"

function capture(file: InspectFile): string {
    let out = ""
    writeInspectFile(file, {write: (s) => (out += s)})
    return out
}

describe("writeInspectFile", () => {
    it("emits the file heading and the exports table", () => {
        const out = capture({
            file: "src/a.ts",
            exports: [
                {line: 3, kind: "const", name: "x", importers: 2, example: "src/cli.ts"},
                {line: 8, kind: "type", name: "T", importers: 0, example: null},
            ],
        })
        assert.match(out, /^## src\/a\.ts\n/)
        assert.match(out, /^### exports$/m)
        assert.match(out, /\| 3 \| const \| x \| 2 \| src\/cli\.ts \|/)
        // Unused exports show **unused** in the example column.
        assert.match(out, /\| 8 \| type \| T \| 0 \| \*\*unused\*\* \|/)
    })

    it("emits an `(no exports)` line when the file exports nothing", () => {
        const out = capture({file: "src/index.ts", exports: []})
        assert.match(out, /### exports\n\n\(no exports\)\n/)
    })

    it("skips the exports section when the inspector did not run", () => {
        const out = capture({file: "src/a.ts"})
        assert.match(out, /^## src\/a\.ts\n/)
        assert.equal(/### exports/.test(out), false)
    })
})
