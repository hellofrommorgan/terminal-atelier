# Terminal Atelier

An interactive terminal & dev-environment configurator. Design your terminal
typography, theme, prompt, keybindings, tmux status bar and more — and watch a
live, Ghostty-style mock session update in real time. Built as a single static
site with no build step and no dependencies.

Styled after a [Ghostty](https://ghostty.org) window running tmux, in the
[Catppuccin Mocha](https://github.com/catppuccin/catppuccin) palette, set in the
[Geist](https://vercel.com/font) type family.

## Features

- **Font Playground** — drive the variable weight axis, OpenType features
  (ligatures, stylistic sets, tabular numerals, fractions), size, line-height,
  tracking and italics. Bring your own font: type any installed font name or
  drop in a `.woff2`/`.woff`/`.ttf`/`.otf` file.
- **Theme Studio** — edit the full Catppuccin-style palette live, pick from a
  curated library (Catppuccin, Gruvbox, Nord, Tokyo Night, Dracula, Solarized,
  Rosé Pine and more), check WCAG contrast and simulate colorblindness.
- **Prompt Builder** — compose a powerline-style shell prompt segment by segment.
- **A/B Compare** — put two font/weight setups side by side to judge them.
- **Keybind Designer** — map and inspect terminal/tmux keybindings.
- **tmux Status Bar** — configure and export a `tmux.conf` status line.
- **Glyph Explorer**, **Layout Designer**, **Cursor Studio**, **Export Configs**
  (Ghostty, Kitty, Alacritty, WezTerm, iTerm2), **Rigs & Share**, and a command palette.
- **Live preview scenes** — code, neovim, lazygit, htop and git-diff mock sessions.
- **Undo / redo** (⌘Z / ⌘⇧Z) with a live "edits vs defaults" indicator and one-click reset.
- **Persistent live preview** dock that reflects every change across all panels.
- **Progressive disclosure** — a guided *Simple* mode and a full *Expert* mode.
- Fully responsive; fills the viewport and reflows down to mobile.

## Running it

It's a static site — no build, no install. Either open `index.html` directly,
or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Tech

Vanilla JavaScript with a tiny self-registering feature-module architecture
(`js/core.js` exposes `window.App`; each panel in `js/features/` registers
itself). Reactive dot-path state, an event bus, and a CSS-variable-driven
preview engine. Styling is a single stylesheet in `css/base.css`.

## Credits & licensing

- **Fonts:** [Geist, Geist Mono, and Geist Pixel](https://vercel.com/font) by
  Vercel, redistributed here under the SIL Open Font License 1.1. The full
  license text is in [`fonts/OFL.txt`](fonts/OFL.txt).
- **Palette:** inspired by [Catppuccin](https://github.com/catppuccin/catppuccin).

The bundled font files remain under the SIL OFL 1.1 (see `fonts/OFL.txt`). All
other code in this repository is the work of the repository author.
