/* Glyph Explorer — searchable glyph grid and ligature comparison gallery. */
(function () {
  App.injectCSS('glyph-explorer', `
    .gx-tools{display:grid;grid-template-columns:minmax(180px,1fr) 220px;gap:12px;align-items:end}
    .gx-chip-row{display:flex;flex-wrap:wrap;gap:6px}
    .gx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px}
    .gx-glyph{min-height:104px;min-width:0;text-align:center;justify-content:center;display:flex;flex-direction:column;gap:5px;padding:10px 8px;border-color:transparent}
    .gx-glyph>*{min-width:0;max-width:100%}
    .gx-glyph .gx-char{font-family:var(--pv-family),var(--mono);font-variation-settings:'wght' var(--pv-wght);letter-spacing:var(--pv-tracking);font-style:var(--pv-style);font-feature-settings:var(--pv-feat);font-size:var(--gx-size,34px);line-height:1.05;color:var(--text)}
    .gx-glyph .gx-code{font-family:var(--mono);font-size:10px;color:var(--mauve)}
    .gx-glyph .gx-label{font-family:var(--mono);font-size:10px;color:var(--overlay1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gx-glyph:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,var(--surface0));color:var(--text)}
    .gx-empty{padding:22px;text-align:center;border:1px dashed var(--surface1);border-radius:var(--radius);color:var(--overlay1)}
    .gx-liga-table{display:grid;gap:8px}
    .gx-liga-head,.gx-liga-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch}
    .gx-liga-head{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--overlay1);font-weight:700}
    .gx-liga-head>div{border-bottom:1px solid var(--surface1);padding:0 2px 5px;color:var(--subtext0)}
    .gx-liga-cell{border:1px solid var(--surface0);border-radius:var(--radius-sm);background:var(--crust);padding:10px 12px;min-height:44px;display:flex;align-items:center;justify-content:flex-start;gap:10px;overflow:hidden}
    .gx-liga-cell .gx-seq{font-size:calc(var(--pv-size) * 1.35);white-space:nowrap;color:var(--text)}
    .gx-liga-off .gx-seq{font-feature-settings:'liga' 0,'calt' 0 !important}
    .gx-liga-on .gx-seq{font-feature-settings:'liga' 1,'calt' 1,'ss11' 1,'ss07' 1 !important}
    .gx-count{font-size:11px;color:var(--overlay1)}
    @media(max-width:760px){.gx-tools,.gx-liga-head,.gx-liga-row{grid-template-columns:1fr}.gx-liga-head{display:none}}
  `);

  App.registerFeature({
    id: 'glyph-explorer', title: 'Glyph Explorer', icon: '∮', order: 85,
    subtitle: 'Browse, copy, and search every symbol. Compare ligatures on and off in the live font.',
    mount(el, ctx) {
      const { h, copy } = ctx;

      const CATEGORIES = [
        ['Coding symbols', [
          ['=>', 'fat arrow'], ['->', 'thin arrow'], ['<-', 'left arrow sequence'], ['!=', 'not equal sequence'],
          ['>=', 'greater than or equal sequence'], ['<=', 'less than or equal sequence'], ['===', 'strict equality'],
          ['!==', 'strict inequality'], ['|>', 'pipe forward'], ['::', 'scope operator'], [':=', 'walrus assignment'],
          ['&&', 'logical and'], ['||', 'logical or'], ['??', 'nullish coalescing'], ['?.', 'optional chaining'],
          ['...', 'ellipsis'], ['***', 'triple star'], ['<!--', 'html comment open'], ['</>', 'jsx fragment']
        ]],
        ['Box drawing', [
          ['│', 'vertical line'], ['─', 'horizontal line'], ['┌', 'top left corner'], ['┐', 'top right corner'],
          ['└', 'bottom left corner'], ['┘', 'bottom right corner'], ['├', 'tee right'], ['┤', 'tee left'],
          ['┬', 'tee down'], ['┴', 'tee up'], ['┼', 'cross'], ['╭', 'rounded top left'], ['╮', 'rounded top right'],
          ['╰', 'rounded bottom left'], ['╯', 'rounded bottom right'], ['═', 'double horizontal'], ['║', 'double vertical'],
          ['╔', 'double top left'], ['╗', 'double top right'], ['╚', 'double bottom left'], ['╝', 'double bottom right']
        ]],
        ['Powerline', [
          ['', 'powerline right separator'], ['', 'powerline right thin separator'], ['', 'powerline left separator'],
          ['', 'powerline left thin separator'], ['', 'powerline right round'], ['', 'powerline right round thin'],
          ['', 'powerline left round'], ['', 'powerline left round thin'], ['', 'flame left'], ['', 'flame right'],
          ['', 'honeycomb left'], ['', 'honeycomb right'], ['', 'lego separator'], ['', 'lego separator inverse']
        ]],
        ['Arrows', [
          ['←', 'left arrow'], ['→', 'right arrow'], ['↑', 'up arrow'], ['↓', 'down arrow'], ['⇒', 'right double arrow'],
          ['⇐', 'left double arrow'], ['↔', 'left right arrow'], ['⟶', 'long right arrow'], ['⟵', 'long left arrow'],
          ['↦', 'maps to'], ['↩', 'return arrow'], ['↪', 'hook arrow'], ['⇢', 'right dashed arrow'], ['⇠', 'left dashed arrow']
        ]],
        ['Math', [
          ['≠', 'not equal'], ['≥', 'greater than or equal'], ['≤', 'less than or equal'], ['∞', 'infinity'],
          ['∑', 'summation'], ['∏', 'product'], ['√', 'square root'], ['∂', 'partial derivative'], ['∫', 'integral'],
          ['π', 'pi'], ['≈', 'approximately equal'], ['±', 'plus minus'], ['÷', 'division'], ['×', 'multiplication'],
          ['λ', 'lambda'], ['∆', 'delta'], ['∇', 'nabla'], ['∈', 'element of'], ['∴', 'therefore']
        ]],
        ['Braille/blocks', [
          ['░', 'light shade'], ['▒', 'medium shade'], ['▓', 'dark shade'], ['█', 'full block'], ['▏', 'left one eighth block'],
          ['▎', 'left one quarter block'], ['▍', 'left three eighths block'], ['▌', 'left half block'], ['▋', 'left five eighths block'],
          ['▊', 'left three quarters block'], ['▉', 'left seven eighths block'], ['▔', 'upper one eighth block'], ['▁', 'lower one eighth block'],
          ['▂', 'lower one quarter block'], ['▃', 'lower three eighths block'], ['▄', 'lower half block'], ['▅', 'lower five eighths block'],
          ['▆', 'lower three quarters block'], ['▇', 'lower seven eighths block'], ['⣿', 'braille full cell'], ['⠿', 'braille top-heavy cell'], ['⡇', 'braille vertical']
        ]]
      ];
      const GLYPHS = CATEGORIES.flatMap(([category, items]) => items.map(([char, label]) => ({ char, label, category })));
      const LIGATURES = ['=>', '->', '<-', '<=>', '==', '===', '!=', '!==', '>=', '<=', '&&', '||', '??', '?.', '::', ':=', '|>', '<|', '...', 'www', '</>', '<!--', '&&=', '||='];

      let activeCategory = 'All';
      let query = '';
      let glyphSize = 34;

      function codepoints(str) {
        return Array.from(str).map(ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
      }

      function slider(id, label, min, max, step, value, fmt, onInput) {
        const val = h('span', { class: 'val' });
        const input = h('input', { type: 'range', min, max, step, id, value });
        const wrap = h('label', { class: 'field' }, h('span', { class: 'row' }, h('span', {}, label), val), input);
        function sync() {
          const v = parseFloat(input.value);
          val.textContent = fmt(v);
          input.style.setProperty('--fill', ((v - min) / (max - min) * 100) + '%');
        }
        input.addEventListener('input', () => { sync(); onInput(parseFloat(input.value)); });
        sync();
        return wrap;
      }

      const search = h('input', { type: 'search', placeholder: 'Search label, category, glyph…', oninput: () => { query = search.value.trim().toLowerCase(); renderGrid(); } });
      const count = h('span', { class: 'gx-count tnum' });
      const sizeControl = slider('gx-size', 'glyph size', 24, 72, 1, glyphSize, v => v + 'px', v => { glyphSize = v; grid.style.setProperty('--gx-size', glyphSize + 'px'); });

      const chipRow = h('div', { class: 'gx-chip-row' });
      ['All'].concat(CATEGORIES.map(c => c[0])).forEach(name => chipRow.appendChild(
        h('span', { class: 'chip', 'data-cat': name, onclick: () => { activeCategory = name; renderChips(); renderGrid(); } }, name)
      ));

      const grid = h('div', { class: 'gx-grid preview-surface', style: { '--gx-size': glyphSize + 'px' } });

      const ligRows = h('div', { class: 'gx-liga-table' },
        h('div', { class: 'gx-liga-head' }, h('div', {}, 'Raw: ligatures off'), h('div', {}, 'Ligated: ligatures on')),
        LIGATURES.map(seq => h('div', { class: 'gx-liga-row' },
          h('div', { class: 'gx-liga-cell gx-liga-off' }, h('span', { class: 'gx-seq preview-surface' }, seq)),
          h('div', { class: 'gx-liga-cell gx-liga-on' }, h('span', { class: 'gx-seq preview-surface' }, seq))
        ))
      );

      el.appendChild(h('div', { class: 'stack' },
        h('div', { class: 'card stack' },
          h('h4', {}, h('span', { class: 'accent' }, '01'), ' glyph grid'),
          h('div', { class: 'gx-tools' }, h('label', { class: 'field' }, 'search', search), sizeControl),
          h('label', { class: 'field' }, 'category', chipRow),
          h('div', { class: 'row-flex' }, count, h('span', { class: 'muted' }, 'Click any tile to copy the glyph or sequence.')),
          grid
        ),
        h('div', { class: 'card stack' },
          h('h4', {}, h('span', { class: 'accent' }, '02'), ' ligature gallery'),
          h('p', { class: 'muted' }, 'Raw cells force liga/calt off; ligated cells force liga/calt plus common coding alternates on. The active font determines whether shapes combine.'),
          ligRows
        ),
        h('p', { class: 'muted' }, 'Note: Nerd Font icon glyphs and powerline separators may render as tofu unless a Nerd Font is installed; the bundled Geist fonts are not patched.')
      ));

      function renderChips() {
        chipRow.querySelectorAll('.chip').forEach(chip => chip.classList.toggle('on', chip.dataset.cat === activeCategory));
      }

      function renderGrid() {
        const filtered = GLYPHS.filter(g => {
          const haystack = (g.char + ' ' + g.label + ' ' + g.category + ' ' + codepoints(g.char)).toLowerCase();
          return (activeCategory === 'All' || g.category === activeCategory) && (!query || haystack.includes(query));
        });
        count.textContent = `${filtered.length} glyph${filtered.length === 1 ? '' : 's'} shown`;
        grid.replaceChildren();
        if (!filtered.length) {
          grid.appendChild(h('div', { class: 'gx-empty' }, 'No matches. Try a different keyword.'));
          return;
        }
        filtered.forEach(g => grid.appendChild(h('button', { class: 'btn gx-glyph preview-surface', type: 'button', title: `${g.label} · ${g.category}`, onclick: () => copy(g.char) },
          h('span', { class: 'gx-char' }, g.char),
          h('span', { class: 'gx-code' }, codepoints(g.char)),
          h('span', { class: 'gx-label' }, g.label)
        )));
      }

      renderChips();
      renderGrid();
    }
  });
})();
