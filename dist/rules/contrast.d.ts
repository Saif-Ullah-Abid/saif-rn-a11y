/**
 * rules/contrast.ts
 *
 * Flags Text elements whose resolved text color fails WCAG AA contrast
 * against the nearest ancestor background color.
 */
import { JsxNodeInfo } from "../jsxWalker";
export interface Finding {
    rule: string;
    severity: "error" | "warning";
    line: number;
    column: number;
    message: string;
}
export declare function checkContrast(nodes: JsxNodeInfo[]): Finding[];
