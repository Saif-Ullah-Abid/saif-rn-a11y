/**
 * rules/contrast.ts
 *
 * Flags Text elements whose resolved text color fails WCAG AA contrast
 * against the nearest ancestor background color.
 */

import * as ts from "typescript";
import { JsxNodeInfo } from "../jsxWalker";
import { parseColor, contrastRatio, meetsWcagAA, requiredRatioFor, TextSize } from "../color";

export interface Finding {
  rule: string;
  severity: "error" | "warning";
  line: number;
  column: number;
  message: string;
}

function textSizeFrom(resolvedStyle: JsxNodeInfo["resolvedStyle"]): TextSize {
  const fontSize = typeof resolvedStyle.fontSize === "number" ? resolvedStyle.fontSize : 14;
  const isBold =
    resolvedStyle.fontWeight === "bold" ||
    (typeof resolvedStyle.fontWeight === "string" && Number(resolvedStyle.fontWeight) >= 700);

  // WCAG large-text definition: >=18pt normal, or >=14pt (≈18.66px) bold.
  if (fontSize >= 24) return "large"; // ~18pt at common RN density approximations
  if (isBold && fontSize >= 18.66) return "large";
  return "normal";
}

export function checkContrast(nodes: JsxNodeInfo[]): Finding[] {
  const findings: Finding[] = [];

  for (const node of nodes) {
    if (node.tagName !== "Text") continue;

    var textColorRaw =
      typeof node.resolvedStyle.color === "string" ? node.resolvedStyle.color : undefined;
    var bgRaw = node.inheritedBackgroundColor;

    // Skip entirely (don't guess) if we don't confidently know both colors.
    if (!textColorRaw || !bgRaw) continue;

    const textColor = parseColor(textColorRaw);
    const bgColor = parseColor(bgRaw);
    if (!textColor || !bgColor) continue;

    const ratio = contrastRatio(textColor, bgColor);
    const size = textSizeFrom(node.resolvedStyle);

    if (!meetsWcagAA(ratio, size)) {
      const required = requiredRatioFor(size);
      findings.push({
        rule: "contrast-aa",
        severity: "error",
        line: node.line,
        column: node.column,
        message: `Text color ${textColorRaw} on background ${bgRaw} has a contrast ratio of ${ratio.toFixed(
          2
        )}:1 — below the WCAG AA minimum of ${required}:1 for ${size} text.`,
      });
    }
  }

  return findings;
}
