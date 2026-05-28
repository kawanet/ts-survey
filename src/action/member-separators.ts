// The action implementation isn't here yet. `RunMemberSeparatorsOpts`
// exists on its own so the report can return its recommendation in the
// same "action params" shape as `RunSemicolonsOpts` / `RunIndentOpts`,
// which is what both `--format prettier` and `--format ts-survey` build
// their output from. `runMemberSeparators` slots in here when the action
// lands, with no change to the report or formatter wiring.

import type {RunOrganizeImportsOpts} from "./organize-imports.ts"

export interface RunMemberSeparatorsOpts extends RunOrganizeImportsOpts {
    // Vocabulary matches the eventual CLI flag (`--member-separator semi|comma|none`).
    separator: "semi" | "comma" | "none"
}
