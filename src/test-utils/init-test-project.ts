// Project factories for tests. Both pin skipLoadingLibFiles: true — the
// refactoring suites operate on their own source symbols and never need the
// standard library declarations, so skipping the lib.d.ts load makes each
// Project's program build dramatically cheaper. This stays test-only:
// production must keep the libs for correct semantics on real projects.

import {Project, type ProjectOptions} from "ts-morph"

// Builds a project from a tsconfig on disk (sample fixtures, on-disk cases).
export function initTestProject(tsConfigFilePath: string): Project {
    return new Project({tsConfigFilePath, skipLoadingLibFiles: true})
}

// Builds an in-memory project; pass compilerOptions for the module/resolution
// variants (ESNext/Bundler, NodeNext, allowImportingTsExtensions) some suites need.
export function initInMemoryTestProject(compilerOptions?: ProjectOptions["compilerOptions"]): Project {
    return new Project({useInMemoryFileSystem: true, compilerOptions, skipLoadingLibFiles: true})
}
