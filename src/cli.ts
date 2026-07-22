#!/usr/bin/env node
/**
 * cli.ts
 *
 * Usage:
 *   npx saif-rn-a11y "src/**\/*.tsx"
 *   npx saif-rn-a11y src/screens/HomeScreen.tsx src/screens/ProfileScreen.tsx
 *
 * Exits with code 1 if any error-severity finding exists (for CI use),
 * code 0 otherwise.
 */

import * as fs from "fs";
import * as path from "path";
import { analyzeSource, FileReport } from "./analyzeFile";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GRAY = "\x1b[90m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";

function isSourceFile(filePath: string): boolean {
  return /\.(tsx|jsx|ts|js)$/.test(filePath);
}

/** Minimal recursive directory walk - no glob dependency needed. */
function collectFiles(inputPath: string): string[] {
  const stat = fs.statSync(inputPath);

  if (stat.isFile()) {
    return isSourceFile(inputPath) ? [inputPath] : [];
  }

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(inputPath);
    let files: string[] = [];
    for (const entry of entries) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const fullPath = path.join(inputPath, entry);
      files = files.concat(collectFiles(fullPath));
    }
    return files;
  }

  return [];
}

function printReport(report: FileReport): void {
  if (report.findings.length === 0) return;

  console.log(`\n${BOLD}${report.filePath}${RESET}`);
  for (const finding of report.findings) {
    const color = finding.severity === "error" ? RED : YELLOW;
    const label = finding.severity === "error" ? "error" : "warning";
    console.log(
      `  ${GRAY}${finding.line}:${finding.column}${RESET}  ${color}${label}${RESET}  ${finding.message}  ${GRAY}${finding.rule}${RESET}`
    );
  }
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: saif-rn-a11y <file-or-directory> [...more]");
    console.log("Example: saif-rn-a11y src/");
    process.exit(0);
  }

  let allFiles: string[] = [];
  for (const arg of args) {
    if (!fs.existsSync(arg)) {
      console.error(`${RED}Path not found: ${arg}${RESET}`);
      process.exitCode = 1;
      continue;
    }
    allFiles = allFiles.concat(collectFiles(arg));
  }

  const reports: FileReport[] = [];
  for (const filePath of allFiles) {
    const source = fs.readFileSync(filePath, "utf-8");
    reports.push(analyzeSource(filePath, source));
  }

  let errorCount = 0;
  let warningCount = 0;

  for (const report of reports) {
    printReport(report);
    for (const f of report.findings) {
      if (f.severity === "error") errorCount++;
      else warningCount++;
    }
  }

  console.log("");
  if (errorCount === 0 && warningCount === 0) {
    console.log(`${GREEN}No accessibility issues found in ${allFiles.length} file(s).${RESET}`);
  } else {
    console.log(
      `${BOLD}${errorCount} error(s), ${warningCount} warning(s)${RESET} across ${allFiles.length} file(s) scanned.`
    );
  }

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

main();
