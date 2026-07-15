---
name: Helpful Clarity
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ecedf9'
  surface-container-high: '#e6e7f3'
  surface-container-highest: '#e0e2ed'
  on-surface: '#181b24'
  on-surface-variant: '#3d4946'
  inverse-surface: '#2d3039'
  inverse-on-surface: '#eff0fc'
  outline: '#6d7a76'
  outline-variant: '#bcc9c5'
  surface-tint: '#006b5e'
  primary: '#006b5e'
  on-primary: '#ffffff'
  primary-container: '#1fa391'
  on-primary-container: '#00312a'
  inverse-primary: '#65d9c6'
  secondary: '#52625e'
  on-secondary: '#ffffff'
  secondary-container: '#d5e6e1'
  on-secondary-container: '#586864'
  tertiary: '#835400'
  on-tertiary: '#ffffff'
  tertiary-container: '#c4851f'
  on-tertiary-container: '#3e2600'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#83f6e1'
  primary-fixed-dim: '#65d9c6'
  on-primary-fixed: '#00201b'
  on-primary-fixed-variant: '#005046'
  secondary-fixed: '#d5e6e1'
  secondary-fixed-dim: '#b9cac5'
  on-secondary-fixed: '#101e1b'
  on-secondary-fixed-variant: '#3b4a46'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb956'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#faf8ff'
  on-background: '#181b24'
  surface-variant: '#e0e2ed'
  ink: '#14171F'
  paper: '#FAFAF8'
  signal-teal: '#1FA391'
  teal-dark: '#167A6D'
  soft-mint: '#E4F5F0'
  amber: '#E8A33D'
  amber-soft: '#FBEBD2'
  slate: '#6B7280'
  border: '#E5E4DE'
  error-red: '#D64545'
  success-green: '#2E9E5B'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.05'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  heading:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.3'
  mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  xxl: 64px
  giant: 96px
  max-width: 1200px
---

DESIGN.md
Design system reference for this project. Use this to keep every screen — landing page, dashboard, widget — visually consistent, whether generated in Stitch or built directly in code.
Brand personality
Helpful, fast, unintimidating. The audience is a non-technical small business owner, not a developer — nothing should look like a technical tool. The product's core moment is an instant, accurate answer appearing in a chat bubble; the whole visual system should feel calm and responsive, not busy or "AI-hype" styled.
Color palette
Name Hex Usage Ink #14171F Primary text, dark UI surfaces, icons Paper #FAFAF8 Page background — off-white, never pure #FFFFFF Signal Teal #1FA391 Primary accent — CTAs, links, active states, primary buttons Teal Dark #167A6D Hover/pressed state for teal elements Soft Mint #E4F5F0 Secondary surfaces — bot message bubble fill, feature card backgrounds, subtle highlights Amber #E8A33D Reserved exclusively for "needs a human" moments — unresolved conversations, missed-question fallback state, lead-capture prompts. Do not use amber decoratively; it should always mean the same thing everywhere it appears Amber Soft #FBEBD2 Background fill behind amber badges/alerts Slate #6B7280 Secondary/muted text, placeholder text, captions Border #E5E4DE Dividers, input borders, card outlines Error Red #D64545 Form validation errors, failed states only Success Green #2E9E5B Confirmation states, "ready"/"resolved" indicators — kept distinct from Signal Teal so success and brand-accent don't visually collide
Do not introduce additional accent colors. If a new semantic state is needed (e.g. "processing"), reuse Slate or a muted variant of an existing color rather than adding a new hue.
Typography
Role Typeface Notes Display Space Grotesk (or equivalent geometric/grotesk sans) Headlines only. Set large, confident, tight letter-spacing. Weight 600-700 Body Inter Everything else — paragraphs, labels, buttons, nav Mono JetBrains Mono (or equivalent) Reserved specifically for the embed code snippet and anywhere real code/tokens are shown. Using it elsewhere dilutes the "this is real code" signal
Type scale
Token Size Weight Usage display-lg 56px / 1.05 700 Landing page hero headline display-md 36px / 1.1 700 Section headlines heading 24px / 1.2 600 Card titles, page titles in dashboard body-lg 18px / 1.5 400 Hero subheading, intro paragraphs body 16px / 1.5 400 Default body text body-sm 14px / 1.4 400 Secondary text, form helper text caption 12px / 1.3 500 Labels, badges, timestamps
Spacing
8px base unit. Use multiples of 8 for all padding/margin — 8, 16, 24, 32, 48, 64, 96. No arbitrary values (e.g. no 13px or 22px padding). This is the most common source of visual drift between AI-generated screens — hold this strictly.
Layout


Max content width: 1200px, centered, 24px side padding on mobile

Section vertical rhythm on the landing page: 96px between major sections (128px on desktop above 1440px)

Dashboard content area: 32px padding, cards use 16px internal padding

Border radius: 12px on cards/buttons/inputs, 8px on small elements (badges, tags), 20px on the widget chat bubble/floating launcher — the widget is intentionally rounder than the dashboard to feel more conversational
Components
Buttons


Primary: Signal Teal fill, Paper text, 12px radius, body weight 600. Hover: Teal Dark.

Secondary: transparent fill, Ink text, 1px Border outline. Hover: Soft Mint fill.

Destructive (delete document, delete bot): Error Red text/outline, no fill unless hovered.

Button padding: 12px vertical, 24px horizontal. Never smaller than 40px tap height.
Cards


Paper background, 1px Border outline, 12px radius, subtle shadow only on hover (no shadow at rest — keep the resting UI flat and calm)
Chat bubbles (widget + dashboard conversation view)


Visitor message: Ink background, Paper text, right-aligned, 20px radius with the bottom-right corner slightly squared (4px) to indicate the "tail"

Bot message: Soft Mint background, Ink text, left-aligned, mirrored radius treatment

Fallback/lead-capture message: Amber Soft background, Ink text, with a small amber dot or icon indicating "needs a human" — this is the one moment amber should appear inside the widget
Badges/status indicators


Ready/Resolved: Success Green text on a light green tint background

Pending/Processing: Slate text on a light gray tint background

Failed: Error Red text on a light red tint background

Unresolved/Fallback: Amber text on Amber Soft background
Forms


Input fields: Paper background, 1px Border, 12px radius, 12px padding, Ink text, Slate placeholder text

Focus state: Signal Teal 2px outline (not just a color change — needs to be visible for accessibility)

Error state: Error Red 1px border + small Error Red helper text below the field, never just a red border with no explanation
Empty states
Icon or simple illustration in Slate, one sentence explaining what's missing, one clear action button. Never a blank page with no guidance.
Motion
Minimal and purposeful. The one place motion is used deliberately: the landing page hero's self-typing chat transcript on page load. Elsewhere:


Button hover: 150ms ease color transition, no scale/bounce

Page transitions: none needed, keep navigation instant

Loading states: simple pulse/skeleton, not spinners with personality

Respect prefers-reduced-motion — disable the hero typing animation and show the finished conversation immediately if set
Accessibility floor


All interactive elements have a visible keyboard focus state (Signal Teal outline, as noted above)

Color is never the only signal — status badges pair color with text, not color alone

Minimum contrast: Ink on Paper and Paper on Signal Teal both pass WCAG AA for body text

All form inputs have visible labels, not placeholder-only labels
What NOT to do


No cream background + serif display font + terracotta accent combination

No near-black background with a single neon accent

No numbered markers (01/02/03) outside of the "How it works" step sequence — that's the only place order is real information

No drop shadows at rest on cards — shadow only appears on hover/interaction

No decorative use of Amber outside its reserved "needs a human" meaning

No pure white (#FFFFFF) backgrounds anywhere — always Paper (#FAFAF8)