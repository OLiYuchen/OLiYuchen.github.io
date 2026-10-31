# Research Product Design

## Direction

独立的中文研究工作台。延续 `/md` 的浅灰背景、白色表面、深色文字、深绿主操作和 Instrument Sans，但使用更紧凑的产品级字号和标准应用导航。

## Foundations

- Background: `#eef2f4`
- Surface: `#ffffff`
- Secondary surface: `#f7f9fa`
- Ink: `#171c20`
- Muted: `#65717b`
- Border: `#d6dde2`
- Accent: `#246455`
- Accent soft: `#e0ece8`
- Warning: `#8a5a19`
- Critical: `#9a3434`
- Typeface: `Instrument Sans`, followed by system Chinese sans-serif fallbacks

## Layout

Desktop uses a 232px sidebar, a restrained top toolbar, and a content canvas capped near 1180px. Mobile converts the sidebar into an off-canvas navigation and keeps all tables readable as stacked rows. Sections use dividers and whitespace; cards are reserved for repeatable research objects and dialogs.

## Components

Buttons and inputs use 7-8px radii. Tags alone may use full pills. Borders define hierarchy; shadows are reserved for overlays. Icons come from Lucide. Motion is limited to short state transitions and is disabled when reduced motion is requested.

## Content Rules

Current synthesis, recent knowledge changes, open questions, and provenance are always more prominent than counts. AI-generated content is labeled with its basis and review state. Empty states always provide the next relevant action.
