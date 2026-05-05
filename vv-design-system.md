# VV Design System
## A Design Prompt for Building Apps in the Visualize Value Aesthetic

> Derived from a deep inspection of visualizevalue.com — its architecture, frontend, design tokens, OS philosophy, and visual language.

---

## Philosophy First

Before writing a single line of code, internalize this: **Visualize Value is a reduction machine.** Every design decision removes something. The aesthetic is not minimalism for style — it's minimalism as *argument*. The site itself is proof of concept for what it teaches: clarity over complexity, proof over promises, action over theory.

When building in this system, ask of every element: *Does this earn its place? Does it do one thing clearly?*

---

## Architecture Overview

**Framework:** Next.js (App Router)
**Rendering:** Static-first with ISR — pages are fast, server-rendered, pre-built where possible
**Styling:** Tailwind CSS — utility-first, no custom component library overhead
**Font loading:** Next/font with system fallbacks
**Images:** next/image with lazy loading and blur placeholders
**Deployment:** Vercel

**Key structural traits:**
- Flat navigation — max 2 levels deep, never buried
- Section-based single-page layouts with anchor `#` links
- No client-side routing complexity — pages feel like pages
- No loading spinners, no skeleton screens — content is ready or the page isn't shown
- Footer repeats full nav — the site trusts the user to explore

---

## Frontend Architecture

**Component pattern:** Lean, composable, prop-simple
- No giant component files
- No prop drilling through 4 layers
- Each section is its own semantic block: `<section>`, `<article>`, `<aside>`
- Typography hierarchy does the heavy lifting — no decorative components

**CSS approach:**
- Tailwind utilities, but restrained — not every class gets applied
- No CSS-in-JS
- Dark/light handled via `prefers-color-scheme` and CSS variables
- No framework-specific UI libraries (no shadcn, no Radix overuse)

**JavaScript:**
- Minimal. Almost none client-side.
- No animation libraries on page load
- No heavy state management
- Interactive elements are native HTML where possible

---

## Design Tokens

These are the exact or near-exact values derived from studying the VV site. Use these as your system foundation.

### Color

```css
:root {
  /* Base */
  --color-background:   #ffffff;
  --color-surface:      #f9f9f9;
  --color-border:       #e5e5e5;
  --color-border-strong:#d1d1d1;

  /* Text */
  --color-text-primary:   #0a0a0a;
  --color-text-secondary: #6b6b6b;
  --color-text-muted:     #a3a3a3;

  /* Accent — VV uses near-black as its only accent */
  --color-accent:         #0a0a0a;
  --color-accent-hover:   #1a1a1a;

  /* Functional */
  --color-success:        #16a34a;
  --color-warning:        #ca8a04;
  --color-destructive:    #dc2626;
}

/* Dark mode — VV inverts cleanly */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background:   #0a0a0a;
    --color-surface:      #111111;
    --color-border:       #222222;
    --color-border-strong:#333333;

    --color-text-primary:   #fafafa;
    --color-text-secondary: #a3a3a3;
    --color-text-muted:     #6b6b6b;

    --color-accent:         #fafafa;
    --color-accent-hover:   #e5e5e5;
  }
}
```

**Color rule:** VV uses no brand colors. No blue, no teal, no purple. The brand IS the typography and structure. If you must introduce color, use it once, purposefully, and make it earn it.

---

### Typography

```css
:root {
  /* Font families */
  --font-sans:  'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:  'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace;

  /* Scale — modular, tight */
  --text-xs:    0.75rem;   /* 12px */
  --text-sm:    0.875rem;  /* 14px */
  --text-base:  1rem;      /* 16px */
  --text-lg:    1.125rem;  /* 18px */
  --text-xl:    1.25rem;   /* 20px */
  --text-2xl:   1.5rem;    /* 24px */
  --text-3xl:   1.875rem;  /* 30px */
  --text-4xl:   2.25rem;   /* 36px */
  --text-5xl:   3rem;      /* 48px */

  /* Weight */
  --font-normal:  400;
  --font-medium:  500;
  --font-semibold: 600;

  /* Line height */
  --leading-tight:  1.2;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed:1.625;

  /* Letter spacing */
  --tracking-tight:  -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.05em;
  --tracking-widest:  0.1em;
}
```

**Typography rules:**
- Headlines are large, weight 400–500, tracking tight (`-0.025em`)
- Body is 16px, weight 400, line-height 1.5–1.625
- Labels/tags are small caps or uppercase with wide tracking
- **No decorative fonts.** No serifs unless intentionally editorial.
- `font-feature-settings: "ss01", "cv01"` on Geist for optical refinement

---

### Spacing

```css
:root {
  /* Base unit: 4px */
  --space-1:   0.25rem;  /* 4px */
  --space-2:   0.5rem;   /* 8px */
  --space-3:   0.75rem;  /* 12px */
  --space-4:   1rem;     /* 16px */
  --space-5:   1.25rem;  /* 20px */
  --space-6:   1.5rem;   /* 24px */
  --space-8:   2rem;     /* 32px */
  --space-10:  2.5rem;   /* 40px */
  --space-12:  3rem;     /* 48px */
  --space-16:  4rem;     /* 64px */
  --space-20:  5rem;     /* 80px */
  --space-24:  6rem;     /* 96px */
  --space-32:  8rem;     /* 128px */
}
```

**Spacing rules:**
- Sections breathe — `padding: 80px 0` minimum on desktop
- Component internal spacing is tight — 8–16px between related items
- Use space to create *hierarchy*, not decoration
- Consistent horizontal margin: max-width container `1200px`, padded `24px` on mobile

---

### Borders & Radius

```css
:root {
  /* VV uses almost no border radius — everything is sharp or very slightly rounded */
  --radius-none:  0;
  --radius-sm:    2px;
  --radius-base:  4px;
  --radius-md:    6px;
  --radius-lg:    8px;

  /* Borders are 1px, always */
  --border-width: 1px;
  --border-style: solid;
}
```

**Border rule:** VV uses borders as *dividers*, not containers. A `1px solid var(--color-border)` line between sections is more powerful than a card with a border-radius. Avoid cards with drop shadows. Use borders instead.

---

### Shadows

```css
:root {
  /* VV uses almost no shadows — flat is the aesthetic */
  --shadow-none: none;
  --shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
  --shadow-base: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}
```

**Shadow rule:** If you're reaching for a box-shadow, ask if a border works instead. 99% of the time in this system, it does.

---

## Layout System

### Container

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Content-width (prose, tool pages) */
.container--narrow {
  max-width: 720px;
}

/* Full-bleed sections still have internal container */
```

### Grid

VV uses simple, sparse grids — never 12-column complexity.

```css
/* The workhorse: 1→2→3 responsive grid */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

/* Two column, equal */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
}

/* Numbered list layout (like VV homepage sections) */
.grid-sections {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.grid-sections > * {
  padding-top: var(--space-6);
  border-top: 2px solid var(--color-text-primary);
}
```

---

## Component Patterns

### Navigation

```
[Logo mark]  [Nav link]  [Nav link]  [Nav link]
```
- Logo is initials or wordmark, small, left-aligned
- Nav links are plain text, no buttons, no dropdowns
- No hamburger menus — on mobile, stack or use a minimal toggle
- No sticky nav unless absolutely necessary (VV uses none)
- No active states with heavy backgrounds — underline or weight change only

### Hero Section

```
[Section label — small caps, muted]

[H1 — Large, tight, single thought]

[Subtext — 1-2 lines max, adds context not repetition]

[CTA link →]  [Secondary link →]
```

**Hero rules:**
- The headline does ONE job. Not two.
- No hero images unless they're data-driven (product screenshots, real work)
- No gradient backgrounds, no particle effects, no video loops
- Arrow `→` is the VV CTA convention — not a button with border-radius

### Card / List Item

```
[Number or label]

[Title]

[One-line descriptor]

→
```
- Numbers are for ordered sequences (1. Tools, 2. School, 3. Work)
- Cards have top-border accent, not box shadows
- Links are the entire card surface
- Hover: subtle background shift `var(--color-surface)`

### Tags / Badges

```css
.tag {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding: 2px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
```

Tags like `OSS`, `beta`, `MCP`, `$9/mo` — small, bordered, monospace-optional.

### Tables

VV uses clean `<table>` elements for behavioral specs (like the Do/Don't table on VV OS). No styled table libraries.

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
th {
  text-align: left;
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}
```

### Code Blocks

VV uses inline code prominently (especially on tool/OS pages):

```css
code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 5px;
}

pre {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  padding: var(--space-6);
  overflow-x: auto;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
```

### Footer

Full nav repeat. Four columns: Tools / School / Work / Company. Black background (dark) or white (light). Same hierarchy as the site. Year + company name. Twitter + GitHub links only.

---

## Content & Voice Principles

Drawn from VV OS — apply to all UI copy, labels, tooltips, empty states, CTAs.

### Write like this:

| Do | Don't |
|---|---|
| "Ship it." | "We recommend you consider shipping." |
| "Start here." | "Here's where you might want to begin." |
| "Build things once." | "Our platform enables scalable solutions." |
| "$9/mo" | "Starting at just $9 per month!" |
| "Free" | "Available at no cost" |
| "→" | "Click here to learn more" |

### Naming conventions:

- **Sections:** Action nouns — "Tools", "Work", "School"
- **CTAs:** Imperative verbs — "Start", "Ship", "Build", "See"
- **Labels:** Plain descriptors — "Writing", "Design", "Commerce"
- **States:** Direct — "beta", "OSS", "v1.0.0"

### Numbers as anchors:

VV counts things. "9 tools · 6 open source". "4 courses · 1,400+ posts". "27 projects · 2019–present". Numbers prove reality. Use them.

---

## Interaction Design

**Hover states:**
- Links: color shift to `var(--color-text-secondary)` or underline
- Cards: background to `var(--color-surface)`, no scale transforms
- Buttons/CTAs: opacity 0.85 or slight color darken
- NO: scale, shadow pop, bounce, slide

**Transitions:**
```css
/* The only transition you need */
transition: color 150ms ease, background 150ms ease, opacity 150ms ease;
```

**Focus states:**
```css
:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 2px;
}
```

**Cursor:** Default pointer. No custom cursors. No gimmicks.

---

## What to Never Do

These break the aesthetic immediately:

- ❌ Gradient backgrounds or text gradients
- ❌ Drop shadows on cards (`box-shadow: 0 4px 20px...`)
- ❌ Border radius above 8px
- ❌ Animated hero backgrounds (particles, blobs, waves)
- ❌ Modal-heavy UX — inline is always preferred
- ❌ Loading skeletons on fast operations
- ❌ Confirmation dialogs for simple actions
- ❌ Empty states with large illustrations
- ❌ Tooltips as primary UI — label the thing directly
- ❌ Sycophantic copy ("Great! You've done it!")
- ❌ Progress bars on things that aren't time-based
- ❌ Sticky sidebars on content pages
- ❌ Carousel/slider components
- ❌ "Powered by" badges unless earned

---

## The VV Hierarchy Test

Before shipping any UI, run it through this test:

1. **Can you remove any element without losing meaning?** Remove it.
2. **Does every label state exactly what the thing does?** Rename it if not.
3. **Is any section there to look good rather than to work?** Delete it.
4. **Would this load in under 2 seconds on a slow connection?** If not, cut assets.
5. **Does the copy hedge, qualify, or soften?** Make it direct.

If it passes all five: ship it.

---

## Using This Prompt

When asking Claude (or any AI) to build an app in this system, use this template:

```
Build a [APP TYPE] using the VV design system.

The app does: [ONE SENTENCE — what it does, not how]

Key screens/views:
- [View 1]
- [View 2]
- [View 3]

Use the VV design system:
- Colors: near-black on white, dark mode inverted, no brand colors
- Typography: Geist or system-ui, tight tracking on headlines, plain body
- Borders instead of shadows, 1px lines as dividers
- Spacing: generous section padding, tight component spacing
- Copy: direct, no hedging, imperative CTAs with →
- No gradients, no rounded corners above 6px, no animations beyond 150ms transitions
- Tables use the VV Do/Don't format for behavioral specs
- Tags use: uppercase, small, bordered, spaced tracking

Stack: [React / HTML / Vue / etc.]
```

---

## Quick Reference Card

```
PALETTE        Pure black (#0a0a0a) / Pure white (#fafafa) / Border gray (#e5e5e5)
FONT           Geist Sans + Geist Mono / tight tracking / 400–500 weight
RADIUS         0–6px max / prefer sharp
SHADOWS        None / use borders instead
SPACING        4px base unit / 80px section padding / 16–24px component gaps
TRANSITIONS    150ms ease / color + bg + opacity only
COPY           Short. Direct. Imperative. Numbers. Arrow →.
GRID           Auto-fill minmax(280px, 1fr) / max 3 cols / border-top dividers
AVOID          Gradients, shadows, carousels, modals, hedging copy, decoration
SHIP           If it passes the hierarchy test, ship it.
```

---

*Derived from visualizevalue.com — Jack Butcher's system for tools, school, and work.*
*This prompt is a design language, not a template. Adapt it. The principle is reduction.*
