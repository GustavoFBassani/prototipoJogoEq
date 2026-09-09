# Prompt: EquaLab notebook UI prototype

Copy everything below the line into a new agent chat in this repo.

---

Prototype the EquaLab interface. Question to answer: what should this game look like if it feels like a 7º ano caderno, not a neon lab skin?

Follow `~/.agents/skills/prototype/SKILL.md` and `UI.md`. Sub-shape A: same page as `index.html`, switch with `?variant=`. Three variants, structurally different. Floating bottom bar with arrows + keyboard. Gate the bar so it never ships in production. One command to run, same as the app today (`npm run dev` or whatever this repo already uses).

Throwaway. Mark it as a prototype. Do not rewrite `src/algebra.js`, `src/operations.js`, `src/win.js`, `src/drag.js`, or the level data. Wire variants to the existing game object: same tokens (`+x`, `-x`, `+1`, `-1`), same rule (operation hits both sides), same cancel (drag a token onto its opposite on the same side), same win (`x` isolated, other side a number). Stub sounds and particles if they fight the paper look. A pencil scratch on cancel is fine. Confetti and dust explosions are not.

Copy stays Portuguese (pt-BR). Players are about 12–13, first-degree equations, BNCC-ish: isolate `x` by doing the same thing on both sides, then cancel inverses.

## What the current UI does wrong

Open `index.html` and `src/styles.css`. Do not inherit this look.

- Dark radial gradient, glass cards, glow, gradient logo text, bouncing trophy, particle canvas over the win modal
- Emoji as chrome: scale, map, speaker, lightning, flask, trophy
- Four token colors plus a legend. Kids have to memorize the legend before they play
- Hint dumped on screen at all times, written like a walkthrough
- Fake scale beam that does not move, then disappears on mobile so the two sides stack and the "=" metaphor dies
- Six operation buttons always visible, including `× N` and `÷ N`, before the player needs them
- Labels like "anti-x", "aniquilá-los", "Mestre Alquimista", "Laboratório do Equilíbrio Algébrico"
- Token count ("5 itens") teaches nothing
- No undo. Reset only
- No written record of steps, which is exactly what a caderno would have
- Custom-equation modal sits in the student chrome like another toy

If a draft still has neon, glassmorphism, emoji icons, or a color legend, throw that draft away.

## Theme: notebook + animated scribble

The whole surface is a school notebook on a desk. Lined or quadriculado paper. Pencil and ballpoint. Slightly crooked bits of tape. Margin doodles that stay quiet. No kawaii stickers dump. No dark mode.

Typography: one messy handwritten face for titles, hints, and coach lines. One clear school face (or a restrained serif) for the live equation, so `2x + 3 = 7` stays readable from the back of a classroom. Do not put the equation in a glow pill.

Animated scribble, not fade-in text:

- Titles, coach lines, and "x = …" draw themselves as strokes (SVG path + `stroke-dashoffset`, or a small handwriting path library). Duration short, 400–900 ms. Easing like a hand, not a linear typewriter
- When two opposites cancel, a scribble scratch crosses them out, then they leave. No explosion
- A new operation writes a new line in the caderno, like the student just copied the equation underneath
- Idle motion is tiny: a page curl, a pencil tapping, paper grain. Do not loop decorative animations on every card

Paper must work on a projector: light background, ink contrast high enough to read from 4 m. Tokens at least 48×48 px. Touch-first. No hover-only hints.

Colorblind-safe tokens: shape and mark first, color second. `x` is a letter tile. `1` is a tally or circle. Minus is a clear minus, not "the purple one". If you still need a legend, the design failed.

## Pedagogy. Put these in every variant

Kids this age lose the thread when the screen talks too much and when the next move is buried in six identical buttons.

1. One goal line, always: "Deixe o x sozinho de um lado."
2. After every move, a short coach line that names what just happened, in student words. Example: "Você somou 1 nos dois lados." Then, if a pair can cancel: "Agora junte +1 com −1 no mesmo lado. Eles viram zero."
3. Step log. Each operation adds a written line: the equation before, the operation in the margin, the equation after. This is the caderno. Win is the last line, `x = 3`, circled in pencil. Do not hide the algebra behind tokens only.
4. Undo last step. Reset still exists, quieter.
5. Hint is a closed flap or a "preciso de um empurrão" control. One next action, not the full solution. Default hint text off.
6. Progressive ops. Levels 1–3: only `+1` and `−1`. Then unlock `+x` / `−x` when a level actually has `x` on both sides. `×` and `÷` stay hidden until the division level. Disabled or missing, not greyed in a row of six.
7. First load of level 1: a 2-beat scribble coach. Beat 1: same move on both sides. Beat 2: drag opposites together on one side. Then get out of the way. Skip if they already finished a level this session.
8. Tokens may stack by type so 5 ones do not flood the page, but a tap/peek still shows the units. Do not force stacks if a variant wants loose stickers.
9. Illegal or useless moves get a quiet margin note, not a modal. Division that does not divide evenly: "Ainda não dá pra dividir por 2. Os grupos não estão iguais."
10. Win stays on the page. Circle `x = n`. A small "próxima página" control. No trophy modal, no crown, no "Excelente trabalho!".
11. Custom equation is a teacher corner (long-press on the page number, or a small "outra equação" under the level picker). Not a third footer pill fighting Hint and Reset.
12. Level picker looks like a sumário or numbered pages, with titles a 12-year-old would say. Rewrite the current titles. "Primeiros Passos com Constantes" becomes something like "Só números no caminho do x".
13. Sound is a pencil toggle in the margin. Off must be obvious. Default can be on, but never surprise a classroom.

## Three variants (must disagree on structure)

**A. Caderno aberto.** Two pages side by side. Left page = left side of the equation. Right page = right side. The gutter is `=`. Ops are stamps or pencil marks along the bottom edge of both pages at once. Step log lives as previous lines faintly visible at the top of each page, struck through. On a narrow screen, the spread becomes two stacked pages with a fat `=` strip that never disappears.

**B. Uma página, margem viva.** Single sheet. Big equation at the top in ink. Tokens sit on the ruling like cut-out bits. Left margin is the step log and the coach scribble. Ops are a slim strip under the equation, labeled as verbs: "somar 1", "tirar 1", not "+ 1 aos 2 lados" in tiny caps. This variant is the most classroom-projector friendly.

**C. Carteira + folha.** A desk surface. The equation lives on a loose leaf that can look taped down. Tokens are eraser-able pencil marks you drag. Ops are physical tools at the desk edge (a "+1" stamp used once on the whole sheet). The step history is a small stack of previous leaves, top one current, older ones peeking with crossed-out equations. Win circles the answer and slides the leaf onto a "pronto" pile.

Do not share one layout component across A/B/C. Shared tokens and game state are fine. If two variants look like recolors, redo one.

On every variant switch, print or render the live game state somewhere visible to us (level index, lhs types, rhs types, last op). Kids will not see that in the final game. We need it to judge the prototype.

## Copy tone

Talk like a classmate who already got it, not a mascot and not a textbook.

Yes: "Tira o mesmo dos dois lados." / "Esses dois se cancelam." / "O x ficou sozinho."
No: "Aplique a mesma operação em ambos os lados e depois arraste elementos opostos para aniquilá-los."

Keep "x" as `x`. Do not rename it.

## Done when

I can flip A/B/C in the browser, play level 1 through a cancel and a win on each, and tell you which header, which step log, and which op strip I want to steal. Surface the URLs with `?variant=`.
