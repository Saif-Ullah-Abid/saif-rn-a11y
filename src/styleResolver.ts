/**
 * styleResolver.ts
 *
 * Uses the TypeScript Compiler API to find `StyleSheet.create({...})` calls
 * in a source file and resolve them into a plain map of
 * styleName -> { property: value }.
 *
 * Scope and honesty about limits: this resolves LITERAL values only
 * (string/number literals, simple unary minus). It does not evaluate
 * imported theme constants, template literals with variables, or
 * function calls. Anything it can't confidently resolve is simply
 * omitted rather than guessed - a false negative is far better than a
 * false positive in a tool that developers will trust.
 */

import * as ts from "typescript";

export type StyleValue = string | number;
export type ResolvedStyle = Record<string, StyleValue>;
export type StyleMap = Record<string, ResolvedStyle>;

function literalToValue(node: ts.Expression): StyleValue | undefined {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);

  // Handle negative numeric literals, e.g. `marginTop: -4`
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text);
  }

  return undefined;
}

function resolveObjectLiteral(obj: ts.ObjectLiteralExpression): ResolvedStyle {
  const result: ResolvedStyle = {};

  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) continue;

    const key = prop.name.getText().replace(/^["']|["']$/g, "");
    const value = literalToValue(prop.initializer);
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Finds every `StyleSheet.create({ ... })` call in the file and returns a
 * merged map of style name -> resolved properties. If a style name is
 * defined more than once across multiple calls, the last one wins.
 */
export function extractStyleSheets(sourceFile: ts.SourceFile): StyleMap {
  const styles: StyleMap = {};

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "StyleSheet" &&
      node.expression.name.text === "create" &&
      node.arguments.length === 1 &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const arg = node.arguments[0] as ts.ObjectLiteralExpression;
      for (const prop of arg.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) continue;
        if (!ts.isObjectLiteralExpression(prop.initializer)) continue;

        const styleName = prop.name.getText().replace(/^["']|["']$/g, "");
        styles[styleName] = resolveObjectLiteral(prop.initializer);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return styles;
}

/**
 * Resolves a JSX `style={...}` attribute expression into a merged plain
 * style object, given the file's known StyleSheet map.
 *
 * Handles:
 *   style={styles.foo}
 *   style={[styles.foo, styles.bar]}
 *   style={{ color: 'red' }}
 *   style={[styles.foo, { color: 'red' }]}
 *
 * Later entries in an array override earlier ones, matching React
 * Native's real merge behavior for style arrays.
 */
export function resolveStyleExpression(
  expr: ts.Expression | undefined,
  styleMap: StyleMap
): ResolvedStyle {
  if (!expr) return {};

  // style={styles.foo}
  if (
    ts.isPropertyAccessExpression(expr) &&
    ts.isIdentifier(expr.expression) &&
    expr.expression.text === "styles"
  ) {
    return { ...(styleMap[expr.name.text] || {}) };
  }

  // style={{ inline: 'object' }}
  if (ts.isObjectLiteralExpression(expr)) {
    return resolveObjectLiteral(expr);
  }

  // style={[a, b, c]}
  if (ts.isArrayLiteralExpression(expr)) {
    let merged: ResolvedStyle = {};
    for (const el of expr.elements) {
      const resolved = resolveStyleExpression(el as ts.Expression, styleMap);
      merged = { ...merged, ...resolved };
    }
    return merged;
  }

  return {};
}
