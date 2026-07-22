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
import { StyleMap, resolveStyleExpression, ResolvedStyle } from "./styleResolver";

export interface JsxNodeInfo {
  tagName: string;
  node: ts.JsxElement | ts.JsxSelfClosingElement;
  resolvedStyle: ResolvedStyle;
  inheritedBackgroundColor: string | undefined;
  line: number; // 1-based
  column: number; // 1-based
  attributes: Record<string, ts.Expression | true>;
  textContent: string | undefined; // direct text child, if any
  hasNonTextChild: boolean; // e.g. an Image/Icon child (for icon-only button detection)
}

function getOpeningElement(
  node: ts.JsxElement | ts.JsxSelfClosingElement
): ts.JsxOpeningElement | ts.JsxSelfClosingElement {
  return ts.isJsxElement(node) ? node.openingElement : node;
}

function getTagName(opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string {
  return opening.tagName.getText();
}

function getAttributes(
  opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): Record<string, ts.Expression | true> {
  const attrs: Record<string, ts.Expression | true> = {};
  for (const attr of opening.attributes.properties) {
    if (ts.isJsxAttribute(attr) && attr.name) {
      const name = attr.name.getText();
      if (!attr.initializer) {
        attrs[name] = true; // e.g. `accessible` with no value = true
      } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        attrs[name] = attr.initializer.expression;
      } else if (ts.isStringLiteral(attr.initializer)) {
        // Represent string literal attrs (like accessibilityLabel="x") as
        // a synthetic string-literal expression node for uniform handling.
        attrs[name] = attr.initializer as unknown as ts.Expression;
      }
    }
  }
  return attrs;
}

function getDirectTextContent(node: ts.JsxElement): string | undefined {
  const texts: string[] = [];
  for (const child of node.children) {
    if (ts.isJsxText(child)) {
      const trimmed = child.text.trim();
      if (trimmed) texts.push(trimmed);
    }
  }
  return texts.length > 0 ? texts.join(" ") : undefined;
}

function hasNonTextElementChild(node: ts.JsxElement): boolean {
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

function lineAndColumn(sourceFile: ts.SourceFile, pos: number): { line: number; column: number } {
  const lc = sourceFile.getLineAndCharacterOfPosition(pos);
  return { line: lc.line + 1, column: lc.character + 1 };
}

/**
 * Walks the whole file and returns a flat list of every JSX element found,
 * each annotated with its resolved style and the background color it
 * inherits from its nearest styled ancestor.
 */
export function walkJsxTree(
  sourceFile: ts.SourceFile,
  styleMap: StyleMap
): JsxNodeInfo[] {
  const results: JsxNodeInfo[] = [];

  function visit(node: ts.Node, inheritedBg: string | undefined) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = getOpeningElement(node);
      const tagName = getTagName(opening);
      const attributes = getAttributes(opening);

      const styleExpr = attributes["style"];
      const resolvedStyle =
        styleExpr && styleExpr !== true
          ? resolveStyleExpression(styleExpr as ts.Expression, styleMap)
          : {};

      const ownBg =
        typeof resolvedStyle.backgroundColor === "string"
          ? resolvedStyle.backgroundColor
          : undefined;

      const { line, column } = lineAndColumn(sourceFile, node.getStart());

      const info: JsxNodeInfo = {
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
