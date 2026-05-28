// Two registries that compose into the full report set:
//   - applyReportNames: the recommendation-bearing reports whose values
//     flow into `runApply`. These run in every mode.
//   - extraReportNames: Markdown-only reports added on top of the apply
//     set when the user did NOT pin individual --report names AND --apply
//     is not active. They contribute nothing to the recommendation slot
//     and can perturb ts-morph's LS state (findReferencesAsNodes triggers
//     a StraightReplacementNodeHandler mismatch in subsequent formatText
//     calls), so the apply path skips them.
//
// Display / concat order is extras-first (matches the survey-default
// Markdown ordering before the split).

import type {TsSurveyReportName} from "@kawanet/ts-survey"

export const applyReportNames: readonly TsSurveyReportName[] = [
    "semicolons",
    "indent",
    "member-separators",
    "new-line",
    "bracket-spacing",
] as const

export const extraReportNames: readonly TsSurveyReportName[] = [
    "unused-exports",
] as const

// Full registry used for --report name validation and --help listing.
export const reportNames: readonly TsSurveyReportName[] = [
    ...extraReportNames,
    ...applyReportNames,
] as const
