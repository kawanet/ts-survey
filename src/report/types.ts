// Report-internal: every report function receives the dispatcher's
// per-name slice (no reportNames, that lives on the dispatcher itself).

import type {RunReportsOpts} from "@kawanet/ts-survey"

export type ReportOpts = Omit<RunReportsOpts, "reportNames">
