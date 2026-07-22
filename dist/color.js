"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseColor = parseColor;
exports.relativeLuminance = relativeLuminance;
exports.contrastRatio = contrastRatio;
exports.meetsWcagAA = meetsWcagAA;
exports.requiredRatioFor = requiredRatioFor;
// A small, common subset of CSS named colors used frequently in RN styles.
// (React Native supports CSS color names via its style system.)
const NAMED_COLORS = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    yellow: { r: 255, g: 255, b: 0 },
    orange: { r: 255, g: 165, b: 0 },
    purple: { r: 128, g: 0, b: 128 },
    pink: { r: 255, g: 192, b: 203 },
    brown: { r: 165, g: 42, b: 42 },
    transparent: { r: 255, g: 255, b: 255 }, // treated as "no color" upstream
};
/**
 * Parses a color string into RGB. Supports:
 *   #rgb, #rrggbb, #rrggbbaa
 *   rgb(r, g, b), rgba(r, g, b, a)
 *   a small set of common named colors
 *
 * Returns null if the color can't be confidently parsed - callers should
 * skip the check rather than guess, to avoid false positives/negatives.
 */
function parseColor(input) {
    if (!input)
        return null;
    const value = input.trim().toLowerCase();
    if (value in NAMED_COLORS)
        return NAMED_COLORS[value];
    const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("");
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    }
    const rgbMatch = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/);
    if (rgbMatch) {
        return {
            r: clamp255(parseInt(rgbMatch[1], 10)),
            g: clamp255(parseInt(rgbMatch[2], 10)),
            b: clamp255(parseInt(rgbMatch[3], 10)),
        };
    }
    return null;
}
function clamp255(n) {
    return Math.min(255, Math.max(0, n));
}
/**
 * Converts a single sRGB channel (0-255) to its linearized value,
 * per the WCAG relative luminance formula.
 */
function linearizeChannel(channel255) {
    const c = channel255 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
/**
 * Relative luminance per WCAG 2.1: L = 0.2126*R + 0.7152*G + 0.0722*B
 * using linearized channel values.
 */
function relativeLuminance(color) {
    const r = linearizeChannel(color.r);
    const g = linearizeChannel(color.g);
    const b = linearizeChannel(color.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/**
 * WCAG contrast ratio between two colors: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter of the two relative luminances.
 * Result ranges from 1 (no contrast) to 21 (black vs white).
 */
function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
}
/**
 * WCAG 2.1 Level AA minimum contrast requirements:
 *   - Normal text: 4.5:1
 *   - Large text (>=18pt, or >=14pt bold): 3:1
 */
function meetsWcagAA(ratio, size) {
    return size === "large" ? ratio >= 3 : ratio >= 4.5;
}
function requiredRatioFor(size) {
    return size === "large" ? 3 : 4.5;
}
