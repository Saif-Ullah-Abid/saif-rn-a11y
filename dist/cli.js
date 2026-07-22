#!/usr/bin/env node
"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const analyzeFile_1 = require("./analyzeFile");
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GRAY = "\x1b[90m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
function isSourceFile(filePath) {
    return /\.(tsx|jsx|ts|js)$/.test(filePath);
}
/** Minimal recursive directory walk - no glob dependency needed. */
function collectFiles(inputPath) {
    const stat = fs.statSync(inputPath);
    if (stat.isFile()) {
        return isSourceFile(inputPath) ? [inputPath] : [];
    }
    if (stat.isDirectory()) {
        const entries = fs.readdirSync(inputPath);
        let files = [];
        for (const entry of entries) {
            if (entry === "node_modules" || entry.startsWith("."))
                continue;
            const fullPath = path.join(inputPath, entry);
            files = files.concat(collectFiles(fullPath));
        }
        return files;
    }
    return [];
}
function printReport(report) {
    if (report.findings.length === 0)
        return;
    console.log(`\n${BOLD}${report.filePath}${RESET}`);
    for (const finding of report.findings) {
        const color = finding.severity === "error" ? RED : YELLOW;
        const label = finding.severity === "error" ? "error" : "warning";
        console.log(`  ${GRAY}${finding.line}:${finding.column}${RESET}  ${color}${label}${RESET}  ${finding.message}  ${GRAY}${finding.rule}${RESET}`);
    }
}
function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Usage: saif-rn-a11y <file-or-directory> [...more]");
        console.log("Example: saif-rn-a11y src/");
        process.exit(0);
    }
    let allFiles = [];
    for (const arg of args) {
        if (!fs.existsSync(arg)) {
            console.error(`${RED}Path not found: ${arg}${RESET}`);
            process.exitCode = 1;
            continue;
        }
        allFiles = allFiles.concat(collectFiles(arg));
    }
    const reports = [];
    for (const filePath of allFiles) {
        const source = fs.readFileSync(filePath, "utf-8");
        reports.push((0, analyzeFile_1.analyzeSource)(filePath, source));
    }
    let errorCount = 0;
    let warningCount = 0;
    for (const report of reports) {
        printReport(report);
        for (const f of report.findings) {
            if (f.severity === "error")
                errorCount++;
            else
                warningCount++;
        }
    }
    console.log("");
    if (errorCount === 0 && warningCount === 0) {
        console.log(`${GREEN}No accessibility issues found in ${allFiles.length} file(s).${RESET}`);
    }
    else {
        console.log(`${BOLD}${errorCount} error(s), ${warningCount} warning(s)${RESET} across ${allFiles.length} file(s) scanned.`);
    }
    if (errorCount > 0) {
        process.exitCode = 1;
    }
}
main();
