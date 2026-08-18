# Product

## Register

product

## Users

OSS self-hosters and the small product/creative teams they serve. They run Planka on a VPS via Docker, expect a familiar kanban feel, and care more than average about self-hosted data, real-time sync, and a UI that doesn't get in the way. A second audience is open-source contributors who need an extensible, readable codebase. The primary surface is the app itself: boards, lists, cards, settings, notifications.

## Product Purpose

Collaborative project management for teams who want Trello-style speed with Markdown, real-time sync, multilingual UI, and no vendor lock-in. Success looks like: a team opens Planka, sees their board instantly, drags a card, and the rest of the room reflects the change without a refresh; i18n never breaks; the data lives where they put it.

## Brand Personality

Utilitarian, neutral, calm. "Get out of the way." Tagline: "Project mastering driven by fun." The fun shows up in small, considered places, not in a saturated brand voice.

## Anti-references

- Generic kanban (Trello/Taiga/Wekan) — every kanban tool looks the same; do not become another one.
- Linear-style minimal monoculture — no ink-on-eggshell default, no all-dark-with-purple-accent reflex.
- Bootstrap/Material admin templates — Planka is not an internal admin tool.
- AI-decorated dark gradient + neon UI — no synthetic "hero gradient" panels, no glassmorphism cards stacked to look impressive.

## Design Principles

1. The board is the product. Every chrome decision answers to "does this help someone move a card or read it?" If it doesn't, cut it.
2. Neutral, not generic. Tinted neutrals carry the surface; one accent at most. Never the SaaS-cream reflex; never the dark-neon reflex either.
3. Respect the data shape. Lists are lists, cards are cards, fields are fields. Don't dress a column as a hero metric.
4. Show the system state. Real-time sync is a core promise; presence, typing, and remote updates are visible without being noisy.
5. Extensibility is a UI concern. Custom fields, webhooks, notification providers, and locales plug in without forking styles. No `!important` walls.

## Accessibility & Inclusion

Best-effort: keyboard reachable, focus visible, semantic form labels, no reliance on color alone for state. The codebase ships 30+ locales; UI must not regress RTL or break right-to-left scripts. No formal WCAG conformance target is declared; treat accessibility defects as bugs.
