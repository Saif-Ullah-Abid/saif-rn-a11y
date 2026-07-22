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
/**
 * Finds every `StyleSheet.create({ ... })` call in the file and returns a
 * merged map of style name -> resolved properties. If a style name is
 * defined more than once across multiple calls, the last one wins.
 */
export declare function extractStyleSheets(sourceFile: ts.SourceFile): StyleMap;
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
export declare function resolveStyleExpression(expr: ts.Expression | undefined, styleMap: StyleMap): ResolvedStyle;
