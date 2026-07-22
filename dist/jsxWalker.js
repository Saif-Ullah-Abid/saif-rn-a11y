"use strict";
/**
 * jsxWalker.ts
 *
 * Walks the JSX tree of a parsed React Native source file, tracking the
 * "effective background color" inherited from ancestor Views as it
 * descends - the same way visual inheritance actually works on screen.
 *
 * This is the piece that makes contrast checking possible without a real
 * renderer: we can't run the app, but we CAN reconstruct "what's likely
 * behind this Text component" by walking up the JSX tree structure that's
 * available statically in the source file.
 *
 * Honest scope: this tracks backgroundColor set directly via `style` on
 * View-like ancestors within the SAME file. It does not know about colors
 * coming from a parent component defined elsewhere, global theme
 * providers, or conditional/runtime-computed backgrounds. Where the
 * background can't be determined, contrast checks are skipped rather
 * than guessed.
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
exports.walkJsxTree = walkJsxTree;
const ts = __importStar(require("typescript"));
const styleResolver_1 = require("./styleResolver");
function getOpeningElement(node) {
    return ts.isJsxElement(node) ? node.openingElement : node;
}
function getTagName(opening) {
    return opening.tagName.getText();
}
function getAttributes(opening) {
    const attrs = {};
    for (const attr of opening.attributes.properties) {
        if (ts.isJsxAttribute(attr) && attr.name) {
            const name = attr.name.getText();
            if (!attr.initializer) {
                attrs[name] = true; // e.g. `accessible` with no value = true
            }
            else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                attrs[name] = attr.initializer.expression;
            }
            else if (ts.isStringLiteral(attr.initializer)) {
                // Represent string literal attrs (like accessibilityLabel="x") as
                // a synthetic string-literal expression node for uniform handling.
                attrs[name] = attr.initializer;
            }
        }
    }
    return attrs;
}
function getDirectTextContent(node) {
    const texts = [];
    for (const child of node.children) {
        if (ts.isJsxText(child)) {
            const trimmed = child.text.trim();
            if (trimmed)
                texts.push(trimmed);
        }
    }
    return texts.length > 0 ? texts.join(" ") : undefined;
}
function hasNonTextElementChild(node) {
    for (const child of node.children) {
        if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
            const opening = ts.isJsxElement(child) ? child.openingElement : child;
            const childTag = opening.tagName.getText();
            if (childTag !== "Text") {
                return true;
            }
        }
    }
    return false;
}
function lineAndColumn(sourceFile, pos) {
    const lc = sourceFile.getLineAndCharacterOfPosition(pos);
    return { line: lc.line + 1, column: lc.character + 1 };
}
/**
 * Walks the whole file and returns a flat list of every JSX element found,
 * each annotated with its resolved style and the background color it
 * inherits from its nearest styled ancestor.
 */
function walkJsxTree(sourceFile, styleMap) {
    const results = [];
    function visit(node, inheritedBg) {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            const opening = getOpeningElement(node);
            const tagName = getTagName(opening);
            const attributes = getAttributes(opening);
            const styleExpr = attributes["style"];
            const resolvedStyle = styleExpr && styleExpr !== true
                ? (0, styleResolver_1.resolveStyleExpression)(styleExpr, styleMap)
                : {};
            const ownBg = typeof resolvedStyle.backgroundColor === "string"
                ? resolvedStyle.backgroundColor
                : undefined;
            const { line, column } = lineAndColumn(sourceFile, node.getStart());
            const info = {
                tagName,
                node,
                resolvedStyle,
                inheritedBackgroundColor: inheritedBg,
                line,
                column,
                attributes,
                textContent: ts.isJsxElement(node) ? getDirectTextContent(node) : undefined,
                hasNonTextChild: ts.isJsxElement(node) ? hasNonTextElementChild(node) : false,
            };
            results.push(info);
            // Background propagates downward: a child's "effective background"
            // is its own backgroundColor if set, otherwise whatever it inherited.
            const bgForChildren = ownBg ?? inheritedBg;
            if (ts.isJsxElement(node)) {
                for (const child of node.children) {
                    visit(child, bgForChildren);
                }
            }
            return; // don't also forEachChild into JSX internals below
        }
        ts.forEachChild(node, (child) => visit(child, inheritedBg));
    }
    visit(sourceFile, undefined);
    return results;
}
