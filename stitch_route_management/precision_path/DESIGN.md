---
name: Precision & Path
colors:
  surface: '#faf8ff'
  surface-dim: '#dad9e1'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3fa'
  surface-container: '#eeedf4'
  surface-container-high: '#e9e7ef'
  surface-container-highest: '#e3e1e9'
  on-surface: '#1a1b21'
  on-surface-variant: '#444651'
  inverse-surface: '#2f3036'
  inverse-on-surface: '#f1f0f7'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006a69'
  on-secondary: '#ffffff'
  secondary-container: '#7df5f4'
  on-secondary-container: '#007070'
  tertiary: '#4b1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e2c00'
  on-tertiary-container: '#f39461'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#7df5f4'
  secondary-fixed-dim: '#5ed9d7'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#00504f'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#773205'
  background: '#faf8ff'
  on-background: '#1a1b21'
  surface-variant: '#e3e1e9'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1440px
  sidebar-width: 260px
  gutter: 24px
---

## Brand & Style

This design system is built for clarity, precision, and efficiency in public transportation logistics. It adopts a **Modern Corporate** aesthetic characterized by high-density information management and a minimal, "engineering-first" visual language. 

Drawing inspiration from high-performance productivity tools, the interface prioritizes functional whitespace and a structured hierarchy. The emotional goal is to evoke a sense of reliability and technical sophistication. Visual noise is eliminated to ensure that complex mapping data remains the focal point. Surfaces are flat or subtly layered, avoiding heavy shadows or decorative gradients in favor of crisp borders and precise typography.

## Colors

The palette is anchored in a deep, authoritative blue to establish trust, complemented by technical teals and emeralds that suggest movement and green-lit efficiency. 

- **Primary & Secondary:** Used for core brand touchpoints, active states, and primary navigation markers.
- **Surface Strategy:** The background uses a very light Slate 50 to reduce eye strain while providing enough contrast for white cards and containers to "pop" via subtle borders.
- **Semantic Logic:** Success, Warning, and Danger colors follow industry standards but are calibrated for high legibility against light backgrounds. 
- **Grays:** A tiered slate gray system is used for secondary text, borders, and disabled states to maintain a monochromatic, clean environment.

## Typography

The design system utilizes **Geist** for its core typography—a typeface designed for precision and technical clarity. Its geometric yet legible nature makes it ideal for data-heavy SaaS environments.

- **Headlines:** Use a tighter letter-spacing and heavier weights to create a strong visual anchor.
- **Labels:** Monospaced **JetBrains Mono** is introduced for small labels, status indicators, and coordinate data. This reinforces the technical, mapping-centric nature of the platform.
- **Hierarchy:** Body text is kept at a comfortable 16px (md) for general use, while 14px (sm) is the standard for sidebar navigation and secondary metadata.

## Layout & Spacing

The layout philosophy follows a rigid 4px baseline grid to ensure mathematical alignment across all components.

- **Admin/Dashboard Layout:** Utilizes a persistent left-hand sidebar (fixed at 260px) and a top navigation bar for global actions. The main content area uses a fluid width for map views but switches to a fixed-width container (max 1440px) for settings and documentation pages.
- **Map-Centric View:** When a map is active, the interface uses "Overlays" rather than traditional columns. Map controls and info-panels float or dock with a 16px margin from the screen edges.
- **Grid:** For data-heavy pages, a 12-column grid is used with 24px gutters. Responsive breakpoints occur at 640px (Mobile), 1024px (Tablet), and 1280px (Desktop).

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Layering** and **Low-Contrast Outlines**. Depth is communicated through color shifts and hairline borders.

- **Level 0 (Background):** Slate 50 (#F8FAFC).
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a 1px border of Slate 200. No shadow.
- **Level 2 (Popovers/Modals):** Pure White with a 1px border and a very soft, diffused ambient shadow (0px 4px 20px rgba(15, 23, 42, 0.05)) to distinguish from the base layer.
- **Interactions:** Hover states on interactive elements are signaled by a subtle background shift (Slate 100) or a primary color border-glow, rather than an increase in elevation.

## Shapes

The shape language is "Soft" (Level 1) to maintain a professional, sharp look while remaining approachable.

- **Standard Components:** Buttons, input fields, and tags use a 0.25rem (4px) corner radius.
- **Containers:** Large cards and modals use a 0.5rem (8px) radius.
- **Interactive Indicators:** Small checkmarks or radio buttons maintain these sharp-yet-soft corners to ensure a consistent geometric DNA throughout the UI.

## Components

### Buttons
- **Primary:** Solid Deep Blue (#1E3A8A) with white text. No gradient. 
- **Secondary:** White background with 1px Slate 200 border. 
- **Tertiary:** Ghost style; text-only with a Slate 100 background appearing on hover.

### Sidebar Navigation
- Vertical stack with 14px Geist Medium text. 
- Active state indicated by a subtle background fill (Teal at 10% opacity) and a 2px vertical teal bar on the leading edge.

### Data Tables
- Minimalist design with no vertical borders. 
- Header rows use Slate 50 background and 11px Monospace labels. 
- Row hover state triggers a Slate 50 highlight.

### Statistic Cards
- White background, 1px border. 
- Large "Display-sm" value in Primary Blue.
- Small sparklines or trend indicators in Emerald (Success) or Red (Danger).

### Map Controls
- Floating groups of icon buttons. 
- White backgrounds with high-contrast Slate 900 icons. 
- Stacked vertically in the bottom-right or top-right of map viewports.

### Input Fields
- 1px Slate 200 border that shifts to Primary Blue on focus. 
- Placeholder text in Slate 400.
- Labels are always positioned above the field in 13px Medium weight.