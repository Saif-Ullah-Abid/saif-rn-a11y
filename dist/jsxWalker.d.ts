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
import * as ts from "typescript";
import { StyleMap, ResolvedStyle } from "./styleResolver";
export interface JsxNodeInfo {
    tagName: string;
    node: ts.JsxElement | ts.JsxSelfClosingElement;
    resolvedStyle: ResolvedStyle;
    inheritedBackgroundColor: string | undefined;
    line: number;
    column: number;
    attributes: Record<string, ts.Expression | true>;
    textContent: string | undefined;
    hasNonTextChild: boolean;
}
/**
 * Walks the whole file and returns a flat list of every JSX element found,
 * each annotated with its resolved style and the background color it
 * inherits from its nearest styled ancestor.
 */
export declare function walkJsxTree(sourceFile: ts.SourceFile, styleMap: StyleMap): JsxNodeInfo[];
