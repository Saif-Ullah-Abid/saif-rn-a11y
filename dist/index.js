"use strict";
/**
 * index.ts
 *
 * Public API surface for saif-rn-a11y.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.walkJsxTree = exports.resolveStyleExpression = exports.extractStyleSheets = exports.meetsWcagAA = exports.relativeLuminance = exports.contrastRatio = exports.parseColor = exports.analyzeSource = void 0;
var analyzeFile_1 = require("./analyzeFile");
Object.defineProperty(exports, "analyzeSource", { enumerable: true, get: function () { return analyzeFile_1.analyzeSource; } });
var color_1 = require("./color");
Object.defineProperty(exports, "parseColor", { enumerable: true, get: function () { return color_1.parseColor; } });
Object.defineProperty(exports, "contrastRatio", { enumerable: true, get: function () { return color_1.contrastRatio; } });
Object.defineProperty(exports, "relativeLuminance", { enumerable: true, get: function () { return color_1.relativeLuminance; } });
Object.defineProperty(exports, "meetsWcagAA", { enumerable: true, get: function () { return color_1.meetsWcagAA; } });
var styleResolver_1 = require("./styleResolver");
Object.defineProperty(exports, "extractStyleSheets", { enumerable: true, get: function () { return styleResolver_1.extractStyleSheets; } });
Object.defineProperty(exports, "resolveStyleExpression", { enumerable: true, get: function () { return styleResolver_1.resolveStyleExpression; } });
var jsxWalker_1 = require("./jsxWalker");
Object.defineProperty(exports, "walkJsxTree", { enumerable: true, get: function () { return jsxWalker_1.walkJsxTree; } });
