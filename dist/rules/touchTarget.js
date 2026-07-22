"use strict";
/**
 * rules/touchTarget.ts
 *
 * Flags interactive elements (Pressable, TouchableOpacity,
 * TouchableHighlight, Button) whose resolved size falls below the
 * widely used minimum touch target of 44x44 (Apple Human Interface
 * Guidelines; Material Design recommends 48x48dp, we use the more
 * conservative/common 44 as the floor), unless hitSlop appears to
 * compensate for it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTouchTargetSize = checkTouchTargetSize;
const INTERACTIVE_TAGS = new Set([
    "Pressable",
    "TouchableOpacity",
    "TouchableHighlight",
    "TouchableWithoutFeedback",
    "Button",
]);
const MIN_TARGET_SIZE = 44;
function numericOrUndefined(v) {
    return typeof v === "number" ? v : undefined;
}
function checkTouchTargetSize(nodes) {
    const findings = [];
    for (const node of nodes) {
        if (!INTERACTIVE_TAGS.has(node.tagName))
            continue;
        const width = numericOrUndefined(node.resolvedStyle.width) ??
            numericOrUndefined(node.resolvedStyle.minWidth);
        const height = numericOrUndefined(node.resolvedStyle.height) ??
            numericOrUndefined(node.resolvedStyle.minHeight);
        // If we can't confidently determine BOTH dimensions, skip rather than
        // assume - many components size themselves from content/padding,
        // which this static analysis can't measure.
        if (width === undefined || height === undefined)
            continue;
        const hasHitSlop = "hitSlop" in node.attributes;
        if (hasHitSlop)
            continue; // hitSlop can legitimately compensate
        if (width < MIN_TARGET_SIZE || height < MIN_TARGET_SIZE) {
            findings.push({
                rule: "touch-target-size",
                severity: "warning",
                line: node.line,
                column: node.column,
                message: `<${node.tagName}> has a resolved size of ${width}x${height}, below the recommended ${MIN_TARGET_SIZE}x${MIN_TARGET_SIZE} minimum touch target. Increase the size or add hitSlop.`,
            });
        }
    }
    return findings;
}
