---
name: A Una Milla
description: An editorial estimate of a cash fare against a points quote the traveller already has.
colors:
  midnight: "#102033"
  parchment: "#f3ecdf"
  sheet: "#faf6ef"
  foam: "#f7f1e6"
  foam-muted: "#d5dee6"
  saffron: "#e0ae3a"
  saffron-press: "#c99622"
  saffron-active: "#b7861c"
  muted: "#3c5160"
  line: "#d4cbbd"
  save: "#1c6b45"
  cost: "#8d2e2e"
typography:
  display:
    fontFamily: "Literata, \"Iowan Old Style\", Palatino, serif"
    fontSize: "2.35rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Literata, \"Iowan Old Style\", Palatino, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Literata, \"Iowan Old Style\", Palatino, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  ui:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  figure:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
rounded:
  control: "6px"
  panel: "12px"
  full: "9999px"
spacing:
  tight: "8px"
  field: "12px"
  stack: "16px"
  gutter: "24px"
  section: "32px"
  chapter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.saffron}"
    textColor: "{colors.midnight}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.saffron-press}"
    textColor: "{colors.midnight}"
  button-primary-active:
    backgroundColor: "{colors.saffron-active}"
    textColor: "{colors.midnight}"
  button-primary-disabled:
    backgroundColor: "{colors.saffron}"
    textColor: "{colors.midnight}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.midnight}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.midnight}"
  button-secondary-active:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.midnight}"
  button-secondary-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.midnight}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "48px"
  choice-card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.panel}"
    padding: "16px"
  choice-card-selected:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.foam}"
    rounded: "{rounded.panel}"
    padding: "16px"
  route-panel:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.foam}"
    rounded: "{rounded.panel}"
---

# Design System: A Una Milla

## Overview

**Creative North Star: "The Mile Marker"**

A Una Milla reads as a warm editorial page for a short, precise comparison. A midnight navy shell carries the wordmark and the drawn route. The page is parchment, with a lighter sheet for fields, the demo line, and unselected choices. Saffron is the marker: it fills the primary action, traces the route, marks the current step, and highlights selection.

The page is a reading column inside a 64rem measure. The first view places the headline beside the route drawing from 1024px; on a narrower screen the drawing follows the action. Later steps stay a single column of hairline chapters: the trip form, the comparison ledger, or the checklist. Literata states the wordmark and the headlines. Schibsted Grotesk carries the interface, the form, and the figures.

The route draws once. An estimate bar runs while the arithmetic is in progress. Both hold still when the reader prefers reduced motion. The demo line remains on the sheet, directly under the header.

**Key Characteristics:**

- Midnight navy shell on a parchment page, with sheet for fields and the demo line
- Saffron as the marker for the action, the route, the current step, and selection
- Literata for headlines and the wordmark; Schibsted Grotesk for UI and figures
- 6px controls, 12px panels, and one soft shadow
- Hairline chapters, with the comparison set as a ruled ledger
- Save green and cost red only for the money outcome
- A drawn SVG mile, and the demo line kept in view

## Colors

A navy-and-parchment editorial pair, with saffron as a scarce marker and green and red reserved for the money outcome.

### Primary

- **Saffron** (#e0ae3a): The primary action, the route stroke, the depart node, the current step, the skip link, and text selection. Text on saffron is midnight.
- **Saffron press** (#c99622): Hover on the primary action.
- **Saffron active** (#b7861c): The pressed primary action.

### Neutral

- **Midnight navy** (#102033): Text on parchment, and the inverted shell for the header, a selected mode, the route panel, and the estimate bar.
- **Parchment** (#f3ecdf): The page background.
- **Sheet** (#faf6ef): Inputs, unselected choices, the demo line, and the secondary button on hover.
- **Foam** (#f7f1e6): Text and route nodes on midnight.
- **Muted foam** (#d5dee6): Secondary text on midnight, and the quieter tick on the route.
- **Muted blue-grey** (#3c5160): Supporting copy, hints, placeholders, and steps not yet reached.
- **Line** (#d4cbbd): Hairline rules, input borders, and the step track.

Save green (#1c6b45) colors a redemption that costs less cash. Cost red (#8d2e2e) colors a redemption that costs more cash, and it colors validation text. An even trade stays midnight.

### Named Rules

**The Marker Rule.** Saffron paints the primary action, the route, the current step, the skip link, and text selection. Panels, body copy, and the ledger stay midnight, parchment, or sheet.

**The Outcome Ink Rule.** Save green and cost red color the comparison result and validation text. They stay off chrome, links, and navigation.

## Typography

**Display Font:** Literata (Iowan Old Style, Palatino, serif)

**Body Font:** Schibsted Grotesk (sans-serif)

**Character:** An editorial serif for the promise and the chapter titles, and a plain grotesque for reading, forms, and money. Headlines are semibold, with slight negative tracking. The interface is sentence case.

### Hierarchy

- **Display** (600, 2.35rem, line-height 1.08, tracking -0.03em): The page headline, in midnight, set with a balanced line. From 640px it steps to 3rem.
- **Headline** (600, 1.5rem, line-height 1.33, tracking -0.03em): Section titles and the question above the mode choices. Mode names use the same size and tighten to a 1.25 line-height.
- **Title** (600, 1.25rem, line-height 1, tracking -0.03em): The wordmark in the navy header.
- **Body** (400, 1rem, line-height 1.75): Explanations, in muted blue-grey, held near a prose measure. The opening lede steps to 1.125rem from 640px and keeps the 1.75rem line-height.
- **UI** (600, 1rem, line-height 1.5): Buttons and other emphasized controls, in midnight.
- **Label** (600, 0.875rem, line-height 1.43): Field labels. Hints, the demo line, and quiet notes use the same size at regular weight.
- **Figure** (600, 3rem, line-height 1, tracking -0.025em): The euro result, in Schibsted Grotesk. From 640px it steps to 3.75rem. Its color follows the outcome. Ledger values beside it are 1.125rem semibold with tabular numerals.

### Named Rules

**The Two Voices Rule.** Literata is the wordmark and the headlines. Schibsted Grotesk is the interface, the form, and every figure, including the large euro result.

## Layout

The page opens with a full-bleed navy header, then a full-bleed sheet demo line, then a parchment column. The column is 64rem wide, with 16px of gutter, stepping to 24px from 640px. The footer is muted text under a hairline, with 32px of vertical padding.

The first step is the wide composition. From 1024px the headline column and a 17.5rem route panel sit side by side with 48px between them. Below that breakpoint the route follows the action. The trip form, the comparison, the checklist, loading, and the recoverable error stay within 48rem.

Chapters inside a form open on a hairline. Content sits 32px under the rule, and chapters sit 48px apart. The step rail sits 32px above the step. Buttons span the column below 640px and sit in a row from there, with 12px between them.

### Named Rules

**The Chapter Rule.** Working steps are one column of hairline chapters inside 48rem. The comparison is a ruled ledger and a table. Selectable cards appear when the traveller is choosing Quick Flight or Full Trip Plan.

## Elevation & Depth

Depth is tonal. Midnight sits on parchment, sheet sits on parchment, and hairlines separate chapters. One soft shadow lifts the route panel and a selected mode card. The primary button keeps a 1px inset edge along its bottom; that edge belongs to the control.

### Shadow Vocabulary

- **Route** (`box-shadow: 0 18px 36px -24px rgba(16, 32, 51, 0.6)`): The route drawing and the selected mode card.

### Named Rules

**The One Shadow Rule.** Resting sheets, fields, the header, and the ledger are flat. The route shadow is for the route panel and the selected mode.

## Shapes

Controls — buttons, fields, and the skip link — use a 6px radius. Panels — mode choices and the route drawing — use a 12px radius. Circles belong to the mile and the step rail: a 14px step dot, and the stroked mile mark. Borders are 1px. Unselected edges use the line color and darken to midnight on hover. A selected mode uses a midnight edge. Between origin and destination, a saffron dot sits on a short midnight stroke.

### Named Rules

**The Two Radii Rule.** 6px for controls, 12px for panels. Circles belong to the mile and the step rail.

## Components

Buttons are solid or outlined, 48px tall, semibold, and sentence case. Choices invert from sheet to midnight. The ledger is ruled type, and the mile is a drawing.

### Buttons

- **Shape:** A short corner (6px) and a 48px height.
- **Primary:** Saffron fill, midnight text, 24px of horizontal padding, and a 1px inset edge along the bottom (`inset 0 -1px 0 rgba(16, 32, 51, 0.18)`). Hover moves to saffron press. The pressed state is saffron active. Disabled keeps the saffron fill and midnight text, and shows a not-allowed cursor.
- **Hover / Focus:** Color shifts in 150ms. Focus is a 2px midnight outline, 3px outside the control. The skip link uses the same saffron fill and appears at the top of the page when focused.
- **Secondary:** Transparent, with a midnight border and midnight text. Hover fills with sheet. Pressed fills with parchment. Disabled uses a line border and muted text.

### Cards / Containers

- **Corner Style:** Panel radius (12px). Mode choices are at least 9rem tall.
- **Background:** Sheet when unselected. Midnight when selected, with foam text and muted-foam detail.
- **Shadow Strategy:** The route shadow appears only on the selected mode and on the route panel.
- **Border:** 1px line, darkening to midnight on hover. The selected card uses a midnight edge.
- **Internal Padding:** 16px. A Literata title, a short detail, and a small hop drawing stack inside. Focus on a choice is a 2px saffron outline, 3px outside.

The route panel is midnight, 12px, route shadow, and at most 20rem wide. Its caption is muted foam: “A mile along the route. This drawing is not a flight, a fare, or an award seat.” The saffron path draws over 1.15s with `cubic-bezier(0.16, 1, 0.3, 1)`. Reduced motion leaves the path fully drawn.

### Inputs / Fields

- **Style:** Sheet fill, 1px line border, 6px radius, 48px height, 12px of horizontal padding, midnight text, and tabular numerals.
- **Focus:** Hover darkens the border to midnight. Focus is the 2px midnight outline, 3px outside. The caret is midnight. Placeholder text is muted blue-grey.
- **Error / Disabled:** The error sits under the field in cost red at medium weight. Checkboxes and radios are native, 20px, with a midnight accent. Checklist rows are separated by hairlines and are at least 56px tall.

### Navigation

The header is a midnight bar: a 32px saffron mile mark, the Literata wordmark, and, from 640px, a muted-foam line at the trailing edge (“Points against the cash fare”).

The step rail is four labels — Choose, Trip, Compare, Guidance — on a hairline. The current step is a saffron dot and semibold midnight text. A reached step is a midnight dot. A step not yet available is a parchment dot with a line border and muted text, and it cannot be pressed. Focus uses the midnight outline.

### Comparison ledger

The result is a Schibsted Grotesk figure at the figure size, in save green, cost red, or midnight. Four facts share one ruled row from 640px and wrap to two rows below that. A table with a midnight header rule and line-colored body rules sets the cash fare against the points redemption. Ledger and table figures use tabular numerals.

While the estimate runs, a 4px track in the line color holds a midnight bar. The bar scales from a short mark to full width over 0.9s, alternating, with the same draw easing as the route. Reduced motion holds it still. The word under the header stays: estimates use entered amounts, and the app does not search live fares, check award seats, or book tickets.

### Demo line

A sheet band under the header, with a hairline beneath and small midnight text. The word “Demo.” is semibold.

## Do's and Don'ts

### Do:

- **Do** keep the midnight shell, the parchment page, and sheet fields.
- **Do** set headlines and the wordmark in Literata at semibold, with -0.03em tracking.
- **Do** set interface text and figures in Schibsted Grotesk.
- **Do** use 6px on controls and 12px on panels.
- **Do** separate chapters with a 1px line rule.
- **Do** color a saving in save green and a costlier redemption in cost red, and leave an even result in midnight.
- **Do** draw the mile as the SVG route, and keep the caption that the drawing is not a flight, a fare, or an award seat.
- **Do** keep the demo line under the header.
- **Do** focus with a 2px outline, 3px outside: midnight on controls, saffron on a mode choice.
- **Do** stop the route draw and the estimate bar when the reader prefers reduced motion.

### Don't:

- **Don't** present a live fare, an award seat, or a booking. The estimate is arithmetic on amounts the traveller enters.
- **Don't** turn the comparison into a row of equal metric cards.
- **Don't** wash panels or body text in saffron.
- **Don't** use save green or cost red for decoration, links, or navigation.
- **Don't** set the euro result in Literata.
- **Don't** add another drop shadow to resting surfaces.
- **Don't** replace the mile drawing with emoji.
