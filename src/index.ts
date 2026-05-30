// Public library entry. cli.ts also routes through here so subcommand
// runner modules stay internal.

import {Project} from "ts-morph"
import type * as declared from "ts-refine"

export {refineFormat} from "./format/run-format.ts"
export {refineInspect} from "./inspect/run-inspect.ts"
export {refineList} from "./list/run-list.ts"
export {refineMove} from "./move/run-move.ts"
export {refineRename} from "./rename/run-rename.ts"
export {refineReport} from "./report/run-reports.ts"

// Lets callers avoid a direct ts-morph dependency for the common case.
export const initProject: typeof declared.initProject = (tsconfigPath) => new Project({tsConfigFilePath: tsconfigPath})
