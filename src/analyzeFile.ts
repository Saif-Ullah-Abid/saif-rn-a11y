/**
 * analyzeFile.ts
 *
 * Given a file path and its source text, parses it and runs every rule,
 * returning a flat list of findings.
 */

import * as ts from "typescript";
import { extractStyleSheets } from "./styleResolver";
import { walkJsxTree } from "./jsxWalker";
import { checkContrast } from "./rules/contrast";
import { checkTouchTargetSize } from "./rules/touchTarget";
import { checkMissingLabel } from "./rules/missingLabel";
import { Finding } from "./rules/contrast";

export interface FileReport {
  filePath: string;
  findings: Finding[];
}

export function analyzeSource(filePath: string, sourceText: string): FileReport {
  const scriptKind = filePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : filePath.endsWith(".jsx")
    ? ts.ScriptKind.JSX
    : ts.ScriptKind.TS;

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const styleMap = extractStyleSheets(sourceFile);
  const nodes = walkJsxTree(sourceFile, styleMap);

  const findings: Finding[] = [
    ...checkContrast(nodes),
    ...checkTouchTargetSize(nodes),
    ...checkMissingLabel(nodes),
  ];

  findings.sort((a, b) => a.line - b.line || a.column - b.column);

  return { filePath, findings };
}

export type { Finding } from "./rules/contrast";
