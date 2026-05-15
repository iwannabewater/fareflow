# FareFlow Design System

## Visual Theme and Atmosphere

FareFlow uses a warm atlas ledger direction: paper canvas, dark ink totals, passport blue travel cues, and quiet mint success states. The app should feel like a precise travel workbench with a little field-notebook character, not a marketing site or generic finance dashboard.

## Color Palette and Roles

- Canvas `oklch(0.977 0.009 88)`: page background.
- Canvas strong `oklch(0.944 0.012 88)`: adjacent panels and rows.
- Ink `oklch(0.255 0.018 172)`: primary text and main actions.
- Passport blue `oklch(0.34 0.105 224)`: navigation and travel cues.
- Mint `oklch(0.31 0.075 158)`: healthy sync/ready states.
- Tomato `oklch(0.36 0.09 38)`: food and warm category accents.
- Berry `oklch(0.38 0.1 344)`: health category accent.
- Stamp `oklch(0.31 0.064 82)`: offline and pending states.

## Typography Rules

Use LXGW WenKai for Simplified Chinese interface text and Alegreya for English, with ZCOOL KuaiLe / Comic Neue reserved for the FareFlow wordmark and small companion labels. Numbers that change or align in rows use tabular figures. Keep letter spacing at the browser default so compact mobile regions stay readable.

## Component Styling

Buttons are rounded-full for primary bottom actions and 12-16px radius for controls. Cards use the larger atlas radius only for major workbench surfaces. Touch targets are at least 44px. Sheets open from the bottom on mobile with a large top radius and no centered modal pattern.

## Layout Principles

Mobile first: current trip, sync state, total, insights, list, bottom action. Desktop expands to a true workbench: left rail, wide main ledger, and right trip-state panel without changing the mobile workflow. The shell may expand up to `112rem` on wide screens so the app never looks clipped or trapped in a narrow phone layout.

Authentication appears once per visible layout: in the desktop left rail, or in the mobile content stack. Do not duplicate the same sign-in form across the desktop support panel and rail.

## Depth and Elevation

Light mode uses background-color steps plus a minimum `0 1px 3px rgba(35,42,40,0.10)` shadow. Avoid nested cards; repeated expenses are rows.

## Do's and Don'ts

- Do keep add/edit flows in bottom drawers.
- Do show offline and pending states inline.
- Do preserve exchange-rate snapshots with each expense.
- Do not use purple-blue gradients.
- Do not add decorative blobs or glass panels.
- Do not hide cloud sync failures behind generic errors.

## Responsive Behavior

At mobile widths, the add expense action is fixed above the safe-area inset. At large widths, the same action moves to the header and support information appears in side panels.

Trip selection must reserve space for a 44px icon well, two-line trip text, and the chevron. At narrow mobile widths the sync badge may collapse to icon-only with an accessible label so the product name and primary actions do not crowd each other.

When multiple Trips exist, the current Trip must not be the only visible journey. Show a compact, horizontally scrollable Trip switcher directly under the picker so users can see that prior Trips were preserved and can switch without opening the menu. Do not use negative horizontal margins for this switcher; it must never create invisible overflow under the app shell.

## Data Visualization

Category breakdown is a ranked list with meters. The meter color must come from a dedicated chart token, not from the row surface token, so every category remains visible on the paper track. Daily trend uses a compact sparkline with full values in tooltips and short values in mobile labels.

## Localization

Simplified Chinese is the default interface language. English is available from the in-app language control and is persisted on-device. Dates and currency use `Intl.*` formatting for the active locale; date inputs use the Beijing calendar date and new Trips default to CNY. Product names and currency codes remain untranslated where precision matters.

## Agent Prompt Guide

- Create a FareFlow row on `{canvas-strong}` with `16px` radius, `0 1px 3px rgba(35,42,40,0.10)`, text `{ink}`, muted text `{ink-muted}`, and a 44px icon well.
- Create a primary mobile action at height `48px`, rounded-full, background `{ink}`, text `{canvas}`, active `scale(0.95)`.
- Create a pending-sync badge with background `{stamp-100}`, text `{stamp-900}`, height `20px`, rounded-full, tabular count if numeric.
