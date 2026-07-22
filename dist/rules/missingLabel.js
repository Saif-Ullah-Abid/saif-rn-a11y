"use strict";
/**
 * rules/missingLabel.ts
 *
 * Flags interactive elements that have no text content (icon-only
 * buttons are the classic case - a trash icon, a close 'X', a hamburger
 * menu) and no accessibilityLabel to describe their purpose to a screen
 * reader user.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMissingLabel = checkMissingLabel;
const INTERACTIVE_TAGS = new Set([
    "Pressable",
    "TouchableOpacity",
    "TouchableHighlight",
    "TouchableWithoutFeedback",
]);
function checkMissingLabel(nodes) {
    const findings = [];
    for (const node of nodes) {
        if (!INTERACTIVE_TAGS.has(node.tagName))
            continue;
        const isIconOnly = node.hasNonTextChild && !node.textContent;
        if (!isIconOnly)
            continue;
        const hasLabel = "accessibilityLabel" in node.attributes || "aria-label" in node.attributes;
        if (!hasLabel) {
            findings.push({
                rule: "missing-accessibility-label",
                severity: "error",
                line: node.line,
                column: node.column,
                message: `<${node.tagName}> appears to be icon-only with no visible text, and has no accessibilityLabel. Screen reader users won't know what this button does. Add accessibilityLabel="...".`,
            });
        }
    }
    return findings;
}
