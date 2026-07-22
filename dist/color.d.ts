/**
 * color.ts
 *
 * WCAG 2.1 compliant color contrast math.
 *
 * This implements the exact formulas from the W3C spec:
 *   https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *   https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * No approximations - this is the same math browsers and official
 * accessibility auditing tools (like axe-core) use.
 */
export interface RGB {
    r: number;
    g: number;
    b: number;
}
/**
 * Parses a color string into RGB. Supports:
 *   #rgb, #rrggbb, #rrggbbaa
 *   rgb(r, g, b), rgba(r, g, b, a)
 *   a small set of common named colors
 *
 * Returns null if the color can't be confidently parsed - callers should
 * skip the check rather than guess, to avoid false positives/negatives.
 */
export declare function parseColor(input: string): RGB | null;
/**
 * Relative luminance per WCAG 2.1: L = 0.2126*R + 0.7152*G + 0.0722*B
 * using linearized channel values.
 */
export declare function relativeLuminance(color: RGB): number;
/**
 * WCAG contrast ratio between two colors: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter of the two relative luminances.
 * Result ranges from 1 (no contrast) to 21 (black vs white).
 */
export declare function contrastRatio(a: RGB, b: RGB): number;
export type TextSize = "normal" | "large";
/**
 * WCAG 2.1 Level AA minimum contrast requirements:
 *   - Normal text: 4.5:1
 *   - Large text (>=18pt, or >=14pt bold): 3:1
 */
export declare function meetsWcagAA(ratio: number, size: TextSize): boolean;
export declare function requiredRatioFor(size: TextSize): number;
