"use strict";
/**
 * analyzeFile.ts
 *
 * Given a file path and its source text, parses it and runs every rule,
 * returning a flat list of findings.
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
exports.analyzeSource = analyzeSource;
const ts = __importStar(require("typescript"));
const styleResolver_1 = require("./styleResolver");
const jsxWalker_1 = require("./jsxWalker");
const contrast_1 = require("./rules/contrast");
const touchTarget_1 = require("./rules/touchTarget");
const missingLabel_1 = require("./rules/missingLabel");
function analyzeSource(filePath, sourceText) {
    const scriptKind = filePath.endsWith(".tsx")
        ? ts.ScriptKind.TSX
        : filePath.endsWith(".jsx")
            ? ts.ScriptKind.JSX
            : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
    const styleMap = (0, styleResolver_1.extractStyleSheets)(sourceFile);
    const nodes = (0, jsxWalker_1.walkJsxTree)(sourceFile, styleMap);
    const findings = [
        ...(0, contrast_1.checkContrast)(nodes),
        ...(0, touchTarget_1.checkTouchTargetSize)(nodes),
        ...(0, missingLabel_1.checkMissingLabel)(nodes),
    ];
    findings.sort((a, b) => a.line - b.line || a.column - b.column);
    return { filePath, findings };
}
