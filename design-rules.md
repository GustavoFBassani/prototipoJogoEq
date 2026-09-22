---
description: High-end UI/UX design and anti-AI aesthetic rules for frontend development
alwaysApply: true
---

# Anti-AI & High-End Design Rules

## 1. Layout & Composition Constraints
- **NO Generic Symmetrical Grids:** Never generate the default "Centered Hero title + 3 identical feature cards with icons" layout. Force asymmetrical layouts, broken grids, or intentional editorial spacing.
- **NO Card Containers Everywhere:** Avoid wrapping every single piece of content in a boxed card with a solid background, thin gray border (`border-slate-200`), and standard drop shadow. Use typography, negative space, or subtle background tonal shifts to separate content instead.
- **Intentional Whitespace:** Leave massive breathing room around primary elements. Do not crowd elements with uniform padding.

## 2. Color & Visual Depth
- **BANNED Gradients:** Strictly prohibited from using generic AI multi-color gradients (e.g., mixing indigo, purple, and pink in text or backgrounds). Use solid, sophisticated tones or ultra-subtle, single-hue ambient lighting.
- **NO Pure Black/White:** Never use `#000000` for text/backgrounds on light themes, nor `#FFFFFF` raw extremes on dark themes. Use deep charcoal, slate, or tinted graphites.
- **Strict Color Budget:** Limit accent colors to a single, highly deliberate shade used exclusively for primary CTAs or critical focus states. Do not color-code every icon with a different vibrant hue.

## 3. Typography & Hierarchy
- **Tight Tracking for Headings:** Apply tight letter-spacing (`tracking-tight` or negative tracking) to all prominent uppercase or large display headings to give a dense, magazine-like feel.
- **Muted Body Text:** Never use high-contrast pure black for body copy on light modes; always use secondary slate or neutral text tones to soften visual fatigue.

## 4. Borders & Geometry
- **No Uniform Radius:** Avoid applying heavy rounding (`rounded-xl` or `rounded-2xl`) to every container indiscriminately. Keep structural blocks sharp or minimally rounded, reserving softer curves only for interactive pílulas or buttons.
