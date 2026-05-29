import {strict as assert} from "node:assert"
import path from "node:path"
import {describe, it} from "node:test"
import {Project} from "ts-morph"
import type {InspectorName} from "@kawanet/ts-survey"
import {runInspect} from "./run-inspect.ts"

const SAMPLE_TSCONFIG = path.resolve(import.meta.dirname, "../../sample/basic/tsconfig.json")

describe("runInspect", () => {
    it("returns one InspectExport per export with importers count and alphabetical example", async () => {
        const project = new Project({tsConfigFilePath: SAMPLE_TSCONFIG})
        const files = await runInspect(project, {paths: [], inspectorNames: ["exports"]})

        const byName = Object.fromEntries(files.map((f) => [path.basename(f.file), f]))
        const used = byName["used.ts"]
        assert.ok(used.exports)
        // used.ts exports two values, both consumed by index.ts.
        assert.equal(used.exports.length, 2)
        for (const e of used.exports) {
            assert.equal(e.importers, 1)
            assert.equal(e.example, "sample/basic/src/index.ts")
        }
        // unused.ts has two exports, neither referenced externally.
        const unused = byName["unused.ts"]
        assert.deepEqual(
            unused.exports!.map((e) => ({name: e.name, importers: e.importers, example: e.example})),
            [
                {name: "deadConst", importers: 0, example: null},
                {name: "DeadType", importers: 0, example: null},
            ],
        )
    })

    it("scopes to the given file globs", async () => {
        const project = new Project({tsConfigFilePath: SAMPLE_TSCONFIG})
        const dir = path.dirname(SAMPLE_TSCONFIG)
        const files = await runInspect(project, {paths: [path.join(dir, "src/used.ts")], inspectorNames: ["exports"]})
        assert.deepEqual(
            files.map((f) => path.basename(f.file)),
            ["used.ts"],
        )
    })

    it("rejects an unknown inspector name", async () => {
        const project = new Project({tsConfigFilePath: SAMPLE_TSCONFIG})
        await assert.rejects(
            () => runInspect(project, {paths: [], inspectorNames: ["typo" as unknown as InspectorName]}),
            /unknown inspector name: typo/,
        )
    })
})
