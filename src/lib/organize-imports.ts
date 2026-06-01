// The import-organizing bundle the write paths share. type-only marker
// settling, organizeImports, and the semicolon cleanup below always run as a
// set, so callers invoke this instead of organizeImports directly.

import type {FormatCodeSettings, SourceFile} from "ts-morph"
import {Node, ts} from "ts-morph"
import {applyTypeOnlyFixes} from "./type-only-fixes.ts"

export function applyOrganizeImports(sf: SourceFile, settings: FormatCodeSettings): void {
    // Settle type-only markers first so the sort can tell type specifiers
    // apart; on a project without verbatimModuleSyntax/isolatedModules it is a
    // no-op.
    applyTypeOnlyFixes(sf, settings)
    sf.organizeImports(settings)
    stripCommentDeferredSemicolons(sf, settings)
}

// organizeImports re-prints each declaration through the TS printer, which
// commits a deferred `;` whenever a comment follows on the same line — even
// under semicolons:Remove. Remove exactly that artifact: only under Remove,
// only on an import/export declaration, and only when the trailing `;` is the
// one immediately followed by a same-line comment. A `;` with anything else
// after it is left untouched, so a genuinely required terminator never goes.
function stripCommentDeferredSemicolons(sf: SourceFile, settings: FormatCodeSettings): void {
    if (settings.semicolons !== ts.SemicolonPreference.Remove) return
    for (const stmt of sf.getStatements()) {
        if (!Node.isImportDeclaration(stmt) && !Node.isExportDeclaration(stmt)) continue
        const semicolon = stmt.getLastChild()
        if (!semicolon || semicolon.getKind() !== ts.SyntaxKind.SemicolonToken) continue
        const semicolonLine = sf.getLineAndColumnAtPos(semicolon.getEnd()).line
        const followedBySameLineComment = semicolon
            .getTrailingCommentRanges()
            .some((range) => sf.getLineAndColumnAtPos(range.getPos()).line === semicolonLine)
        if (followedBySameLineComment) semicolon.replaceWithText("")
    }
}
