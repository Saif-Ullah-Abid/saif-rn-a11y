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
import { JsxNodeInfo } from "../jsxWalker";
import { Finding } from "./contrast";
export declare function checkTouchTargetSize(nodes: JsxNodeInfo[]): Finding[];
