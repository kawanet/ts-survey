import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {Project} from "ts-morph"
import {runReportBracketSpacing} from "./bracket-spacing.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../sample/braces-mixed/tsconfig.json")

describe("runReportBracketSpacing (sample/braces-mixed)", () => {
    it("buckets files by primary spacing style and returns the majority", async () => {
        const project = new Project({tsConfigFilePath: SAMPLE_TSCONFIG})
        const lines: string[] = []
        const ret = await runReportBracketSpacing(project, {stream: {write: (l) => lines.push(l)}, absIncludes: [], absExcludes: []})

        const out = lines.join("")
        assert.match(out, /^### bracket-spacing\n/)
        // spaced-a.ts: 3 spaced (2 ObjectLiteral + 1 ObjectBindingPattern)
        // spaced-b.ts: 2 spaced
        // tight.ts:    3 tight (2 ObjectLiteral + 1 ObjectBindingPattern)
        // no-object.ts: skipped
        assert.match(out, /\| `\{ x \}` \| 5 \| 2 \| /)
        assert.match(out, /\| `\{x\}` \| 3 \| 1 \| /)
        assert.match(out, /\| total \| 8 \| 3 \| \|/)
        assert.equal(/no-object\.ts/.test(out), false)
        assert.deepEqual(ret, {bracketSpacing: "on"})
    })

    it("skips empty `{}`, whitespace-only `{ }`, and multi-line forms", async () => {
        const project = new Project({useInMemoryFileSystem: true})
        project.createSourceFile(
            "x.ts",
            ["export const a = {}", "export const b = { }", "export const c = {", "    p: 1,", "}"].join("\n"),
        )
        const lines: string[] = []
        const ret = await runReportBracketSpacing(project, {stream: {write: (l) => lines.push(l)}, absIncludes: [], absExcludes: []})
        // None of the three forms speak to the bracketSpacing convention,
        // so the file should not appear in any bucket.
        assert.match(lines.join(""), /\| total \| 0 \| 0 \| \|/)
        assert.deepEqual(ret, {})
    })

    it("counts ObjectBindingPattern (destructure) alongside ObjectLiteralExpression", async () => {
        const project = new Project({useInMemoryFileSystem: true})
        project.createSourceFile("d.ts", "export const f = ({ a, b }: {a: 1; b: 2}) => a + b\n")
        const lines: string[] = []
        const ret = await runReportBracketSpacing(project, {stream: {write: (l) => lines.push(l)}, absIncludes: [], absExcludes: []})
        // Only the binding pattern (`{ a, b }`) is counted; the type literal
        // `{a: 1; b: 2}` is a TypeLiteralNode and out of scope.
        assert.match(lines.join(""), /\| `\{ x \}` \| 1 \| 1 \| /)
        assert.deepEqual(ret, {bracketSpacing: "on"})
    })
})
