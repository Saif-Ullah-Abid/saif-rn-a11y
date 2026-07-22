# saif-rn-a11y

**A static accessibility linter for React Native — catches real WCAG violations at build time, in a component model where no equivalent tool exists today.**

Created by Saif Ullah Abid.

## The gap this fills

Web development has `eslint-plugin-jsx-a11y` and `axe-core` — mature tools that understand `<img>`, `<button>`, `<a>`, and ARIA roles, and can catch accessibility mistakes automatically before they ship.

**React Native has nothing equivalent**, because React Native doesn't have any of that. There's no DOM, no semantic HTML tags, no ARIA. Everything is `<View>`, `<Text>`, and `<Pressable>` — visually rendered, not semantically described. The tools built for the web are structurally blind to React Native apps.

The practical result: most React Native apps ship with **zero automated accessibility checking**. Low-contrast text, tiny touch targets, and unlabeled icon buttons make it to production and stay there until a user complains, or a company gets an accessibility lawsuit — not hypothetical; ADA-related digital accessibility lawsuits have risen sharply in recent years.

`saif-rn-a11y` reconstructs enough of what a real renderer would know — by statically walking your JSX tree and tracking inherited background color the way it actually appears on screen — to catch these issues before you ship, without running your app at all.

## What it checks

1. **Color contrast (WCAG 2.1 AA)** — walks your component tree, tracks which background color each `<Text>` actually sits on (inherited from ancestor `<View>`s, matching real visual inheritance), and flags any text/background pair below the WCAG AA contrast ratio (4.5:1 normal text, 3:1 large text).

2. **Touch target size** — flags `Pressable`, `TouchableOpacity`, `TouchableHighlight`, and `Button` elements sized under the 44×44 minimum (Apple's Human Interface Guidelines baseline), unless `hitSlop` compensates.

3. **Missing accessibility labels** — flags icon-only interactive elements (a trash icon, a close "X", a hamburger menu) that have no `accessibilityLabel`, which means a screen reader user has no idea what the button does.

## Install

```bash
npm install --save-dev saif-rn-a11y
```

## Usage

```bash
npx saif-rn-a11y src/
```

Or target specific files:

```bash
npx saif-rn-a11y src/screens/HomeScreen.tsx src/components/Header.tsx
```

Real output, from the example fixture included in this repo:

```
examples/ExampleScreen.tsx
  30:7  error  Text color #cccccc on background #ffffff has a contrast ratio of 1.61:1 — below the WCAG AA minimum of 4.5:1 for normal text.  contrast-aa
  33:7  warning  <TouchableOpacity> has a resolved size of 20x20, below the recommended 44x44 minimum touch target. Increase the size or add hitSlop.  touch-target-size
  41:7  error  <Pressable> appears to be icon-only with no visible text, and has no accessibilityLabel. Screen reader users won't know what this button does. Add accessibilityLabel="...".  missing-accessibility-label

2 error(s), 1 warning(s) across 1 file(s) scanned.
```

Exits with code `1` if any error-severity finding exists, `0` otherwise — drop it straight into CI:

```yaml
# example GitHub Actions step
- run: npx saif-rn-a11y src/
```

## Programmatic API

```typescript
import { analyzeSource } from "saif-rn-a11y";

const report = analyzeSource("HomeScreen.tsx", sourceCodeString);
console.log(report.findings);
```

## How it actually works (and why this is hard)

Most "linters" pattern-match on text. This one has to reconstruct enough of the *rendered* structure to reason about color inheritance correctly:

1. **`styleResolver`** finds every `StyleSheet.create({...})` call using the TypeScript Compiler API and resolves it into a plain style map.
2. **`jsxWalker`** walks the actual JSX tree, resolving each element's `style` prop (whether it's a `StyleSheet` reference, an inline object, or an array of both) and tracking the *effective inherited background color* as it descends — the same way a background actually propagates down a real component tree.
3. Three independent **rules** run against that walked tree and flag violations with exact file, line, and column.

This is proven correct with 48 automated tests, including a full integration test that plants exactly three deliberate violations in a realistic file and asserts the tool finds precisely those three — no more, no less, no false positives on the clean code sitting right next to them.

## Being honest about scope

This is static analysis, not a real renderer — it has real limits, by design, because a false positive erodes trust in a linter faster than a false negative:

- Only **literal color values** are resolved (`'#cccccc'`, `'red'`). Colors from imported theme constants, template literals, or computed expressions are skipped rather than guessed.
- Background inheritance is tracked **within a single file**. If a `<Text>`'s real background comes from a parent component defined elsewhere, this tool can't see it and will skip that check rather than report an unreliable guess.
- Conditional styles are not evaluated for both branches.

Where the tool can't confidently determine something, it stays silent rather than risk a false alarm. That's a deliberate tradeoff, not an oversight.

## Running the tests yourself

```bash
npm test
```

```
# tests 48
# suites 11
# pass 48
# fail 0
```

## License

MIT

---

Built by [Saif Ullah Abid](https://www.linkedin.com/in/saif-ullah-abid/)
