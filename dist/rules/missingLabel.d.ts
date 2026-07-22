/**
 * rules/missingLabel.ts
 *
 * Flags interactive elements that have no text content (icon-only
 * buttons are the classic case - a trash icon, a close 'X', a hamburger
 * menu) and no accessibilityLabel to describe their purpose to a screen
 * reader user.
 */
import { JsxNodeInfo } from "../jsxWalker";
import { Finding } from "./contrast";
export declare function checkMissingLabel(nodes: JsxNodeInfo[]): Finding[];
