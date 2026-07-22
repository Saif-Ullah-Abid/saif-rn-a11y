/**
 * analyzeFile.ts
 *
 * Given a file path and its source text, parses it and runs every rule,
 * returning a flat list of findings.
 */
import { Finding } from "./rules/contrast";
export interface FileReport {
    filePath: string;
    findings: Finding[];
}
export declare function analyzeSource(filePath: string, sourceText: string): FileReport;
export type { Finding } from "./rules/contrast";
