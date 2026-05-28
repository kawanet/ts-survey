import {strict as assert} from "node:assert"
import {describe, it} from "node:test"
import {writePrettierConfig} from "./format-prettier.ts"

function capture(report: Parameters<typeof writePrettierConfig>[0]): string {
    let out = ""
    writePrettierConfig(report, {write: (s) => (out += s)})
    return out
}

describe("writePrettierConfig", () => {
    it("maps semicolons.mode=remove → semi: false", () => {
        const out = capture({semicolons: {mode: "remove"}})
        assert.equal(JSON.parse(out).semi, false)
    })

    it("maps semicolons.mode=insert → semi: true", () => {
        const out = capture({semicolons: {mode: "insert"}})
        assert.equal(JSON.parse(out).semi, true)
    })

    it("maps indent.width → tabWidth + useTabs: false", () => {
        const out = capture({indent: {width: 4}})
        const json = JSON.parse(out)
        assert.equal(json.tabWidth, 4)
        assert.equal(json.useTabs, false)
    })

    it("renders an empty {} when nothing was recommended", () => {
        const out = capture({})
        assert.equal(out.trimEnd(), "{}")
    })

    it("combines multiple recommendations into one JSON object", () => {
        const out = capture({semicolons: {mode: "remove"}, indent: {width: 2}})
        const json = JSON.parse(out)
        assert.equal(json.semi, false)
        assert.equal(json.tabWidth, 2)
        assert.equal(json.useTabs, false)
    })

    it("uses 4-space indentation matching the family .prettierrc convention", () => {
        const out = capture({semicolons: {mode: "remove"}})
        assert.match(out, /\n {4}"semi":/)
    })
})
