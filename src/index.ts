/**
 * index.ts
 *
 * Public API surface for saif-rn-a11y.
 */

export { analyzeSource } from "./analyzeFile";
export type { FileReport, Finding } from "./analyzeFile";
export { parseColor, contrastRatio, relativeLuminance, meetsWcagAA } from "./color";
export { extractStyleSheets, resolveStyleExpression } from "./styleResolver";
export { walkJsxTree } from "./jsxWalker";
