// Renders a TsSurveyReport as the JSON body of a .prettierrc file.
// Only the fields the prettier CLI itself understands are emitted; the
// caller decides what stream to write to (process.stdout for --format
// prettier, an in-memory sink for tests, etc.).
//
// Mapping:
//   semicolons.mode === "insert"            → semi: true
//   semicolons.mode === "remove"            → semi: false
//   indent.width === <number>               → tabWidth: <number>, useTabs: false
//   memberSeparators.separator === "semi"   → semi: true   (semicolons 未指定時)
//   memberSeparators.separator === "comma"  → semi: false, trailingComma: "all"
//   memberSeparators.separator === "none"   → semi: false, trailingComma: "none"
// Reports that didn't recommend anything contribute no fields, so an
// empty TsSurveyReport renders as `{}`.

import type {Options as PrettierOptions} from "prettier"

import type {TsSurveyReport} from "../report/run-reports.ts"
import type {Writer} from "./writable.ts"

// 推奨が出た項目だけを PrettierOptions に詰め直す。--format prettier の
// 直接出力と、デフォルト Markdown 末尾のフェンス埋め込み、両方の入力源。
function buildPrettierOptions(report: TsSurveyReport): PrettierOptions {
    const opts: PrettierOptions = {}
    if (report.semicolons?.mode === "insert") opts.semi = true
    else if (report.semicolons?.mode === "remove") opts.semi = false
    if (typeof report.indent?.width === "number") {
        opts.tabWidth = report.indent.width
        opts.useTabs = false
    }
    // member-separators マッピング:
    // - semi は statement と member の両方を支配するので、まず semicolons
    //   レポート (= 統計母数が大きい側) の値を優先採用。それが未確定のときだけ
    //   member-separators から導出する。
    // - trailingComma は semi が false 確定のときだけ意味を持つ
    //   (Prettier は semi:true で member を `;` で区切るため)。
    // - semi:true × member=none/comma のような矛盾配置では trailingComma を
    //   出さない: semi 側を真実とみなし、矛盾するシグナルは黙って捨てる。
    const ms = report.memberSeparators?.separator
    if (opts.semi === undefined) {
        if (ms === "semi") opts.semi = true
        else if (ms === "comma" || ms === "none") opts.semi = false
    }
    if (opts.semi === false) {
        if (ms === "comma") opts.trailingComma = "all"
        else if (ms === "none") opts.trailingComma = "none"
    }
    return opts
}

export function writePrettierConfig(report: TsSurveyReport, stream: Writer): void {
    stream.write(JSON.stringify(buildPrettierOptions(report), null, 4) + "\n")
}

// デフォルトの全レポート Markdown 出力末尾に差し込む `.prettierrc` ブロック。
// 推奨が一切出ていないときは丸ごとスキップ (`{}` だけ載せても意味がない)。
// 末尾に空行 1 行を付けるのは他のレポートブロックと同じスタイルに合わせるため。
export function writePrettierMarkdown(report: TsSurveyReport, stream: Writer): void {
    const opts = buildPrettierOptions(report)
    if (Object.keys(opts).length === 0) return
    stream.write("### .prettierrc\n")
    stream.write("\n")
    stream.write("```json\n")
    stream.write(JSON.stringify(opts, null, 4) + "\n")
    stream.write("```\n")
    stream.write("\n")
}
