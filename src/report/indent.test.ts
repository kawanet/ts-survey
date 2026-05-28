import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {Project} from "ts-morph"
import {runReportIndent} from "./indent.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../sample/indents-mixed/tsconfig.json")

describe("runReportIndent (sample/indents-mixed)", () => {
    it("counts each leading width across the project and recommends the file majority", async () => {
        const project = new Project({tsConfigFilePath: SAMPLE_TSCONFIG})
        const lines: string[] = []
        await runReportIndent(project, {stream: {write: (l) => lines.push(l)}, absIncludes: [], absExcludes: []})

        const out = lines.join("")
        assert.match(out, /^### indent\n/)
        // two-space.ts has 4 lines at 2 and 1 line at 4.
        // four-space-a.ts and four-space-b.ts each have 4 lines at 4 and 1 at 8.
        // tab.ts has 5 tab-leading lines; no-indent.ts is excluded.
        // Bucket 2:  lines=4 files=1
        assert.match(out, /\| 2 \| 4 \| 1 \| sample\/indents-mixed\/src\/two-space\.ts \|/)
        // Bucket 4:  lines=1+4+4=9 files=3 (every space-leading file)
        assert.match(out, /\| 4 \| 9 \| 3 \| /)
        // Bucket 8:  lines=2 files=2
        assert.match(out, /\| 8 \| 2 \| 2 \| /)
        // Bucket tab: lines=5 files=1
        assert.match(out, /\| tab \| 5 \| 1 \| sample\/indents-mixed\/src\/tab\.ts \|/)
        assert.match(out, /\| total \| 20 \| 4 \| \|/)
        // The 4-bucket has the most files (3 / 4), so the recommendation is
        // --indent 4 in the grep-able form.
        assert.match(out, /recommendation:\n {4}--indent 4\n/)
        assert.equal(/no-indent\.ts/.test(out), false)
    })
})
