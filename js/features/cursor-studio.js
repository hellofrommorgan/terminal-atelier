/* Cursor Studio — tune cursor style, color, blink, and preview-only timing/thickness. */
(function () {
  App.injectCSS('cursor-studio', `
    .cs-controls .cs-color-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .cs-swatch{width:24px;height:24px;border-radius:7px;border:1px solid var(--surface1);background:var(--cs-color);cursor:pointer;box-shadow:inset 0 0 0 2px rgba(0,0,0,.18);transition:all var(--speed)}
    .cs-swatch:hover{transform:translateY(-1px);border-color:var(--overlay0)}
    .cs-swatch.sel{border-color:var(--text);box-shadow:0 0 0 2px color-mix(in srgb,var(--cs-color) 55%,transparent),inset 0 0 0 2px rgba(0,0,0,.18)}
    .cs-preview{min-height:180px;display:flex;flex-direction:column;justify-content:center;gap:14px;background:radial-gradient(420px 160px at 20% 0%,color-mix(in srgb,var(--accent) 12%,transparent),transparent 70%),var(--crust)}
    .cs-line{white-space:pre-wrap;font-size:1.05em}
    .cs-prompt{color:var(--green)}
    .cs-path{color:var(--blue)}
    .cs-cmd{color:var(--text)}
    .cs-cursor{--cs-rate:650ms;--cs-thick:2px;--cs-color:#f5e0dc;display:inline-block;vertical-align:-0.12em;color:var(--cs-color)}
    .cs-cursor.cs-blinking{animation:cs-blink var(--cs-rate) steps(1,end) infinite}
    .cs-cursor.cs-block{min-width:.62em;text-align:center;background:var(--cs-color);color:var(--crust);border-radius:1px;line-height:1.05}
    .cs-cursor.cs-bar{width:var(--cs-thick);height:1.1em;background:var(--cs-color);margin-left:1px;color:transparent}
    .cs-cursor.cs-underline{width:.62em;height:1.1em;border-bottom:var(--cs-thick) solid var(--cs-color);color:transparent}
    .cs-demo{display:grid;grid-template-columns:repeat(4,max-content);gap:10px;color:var(--overlay1);font-size:.82em;align-items:center}
    .cs-mini{display:inline-flex;align-items:center;min-width:3.8em;gap:2px;color:var(--subtext1)}
    .cs-note{font-size:11px;line-height:1.5;color:var(--overlay1)}
    .cs-actions{display:flex;gap:8px;flex-wrap:wrap}
    @keyframes cs-blink{50%{opacity:0}}
  `);

  App.registerFeature({
    id: 'cursor-studio', title: 'Cursor Studio', icon: '▏', order: 100,
    subtitle: 'Shape, color, and blink your cursor. Export a ready-to-paste Ghostty config.',
    mount(el, ctx) {
      const { h, get, set, subscribe, copy, download } = ctx;
      const DEFAULTS = { style: 'bar', blink: false, blinkRate: 650, color: '#f5e0dc', thickness: 2 };
      const STYLES = ['block', 'bar', 'underline'];
      const PALETTE = [
        ['rosewater', '#f5e0dc'], ['flamingo', '#f2cdcd'], ['pink', '#f5c2e7'], ['mauve', '#cba6f7'],
        ['red', '#f38ba8'], ['peach', '#fab387'], ['yellow', '#f9e2af'], ['green', '#a6e3a1'],
        ['teal', '#94e2d5'], ['sky', '#89dceb'], ['blue', '#89b4fa'], ['lavender', '#b4befe']
      ];

      function cursor() { return Object.assign({}, DEFAULTS, get('cursor') || {}); }
      function cleanHex(value) {
        const v = String(value || '').trim();
        return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : DEFAULTS.color;
      }
      function ensureDefaults() {
        const c = get('cursor') || {};
        const next = Object.assign({}, DEFAULTS, c);
        if (!STYLES.includes(next.style)) next.style = DEFAULTS.style;
        next.blink = !!next.blink;
        next.blinkRate = Math.min(1200, Math.max(200, parseInt(next.blinkRate, 10) || DEFAULTS.blinkRate));
        next.color = cleanHex(next.color);
        next.thickness = Math.min(8, Math.max(1, parseInt(next.thickness, 10) || DEFAULTS.thickness));
        if (JSON.stringify(c) !== JSON.stringify(next)) set('cursor', next);
      }

      function slider(id, label, min, max, step, path, fmt) {
        const val = h('span', { class: 'val tnum' });
        const input = h('input', { type: 'range', min, max, step, id });
        const wrap = h('label', { class: 'field' }, h('span', { class: 'row' }, h('span', {}, label), val), input);
        input.addEventListener('input', () => set(path, parseInt(input.value, 10)));
        wrap._sync = (v, disabled) => {
          input.value = v; val.textContent = fmt(v); input.disabled = !!disabled;
          input.style.setProperty('--fill', ((v - min) / (max - min) * 100) + '%');
        };
        return wrap;
      }

      ensureDefaults();

      const styleRow = h('div', { class: 'btn-row' });
      STYLES.forEach(style => styleRow.appendChild(h('span', {
        class: 'btn', 'data-style': style, onclick: () => set('cursor.style', style)
      }, style)));

      const blinkChip = h('span', { class: 'chip', onclick: () => set('cursor.blink', !cursor().blink) }, 'blink');
      const blinkRate = slider('cs-blink-rate', 'blink rate', 200, 1200, 50, 'cursor.blinkRate', v => v + ' ms');
      const thickness = slider('cs-thickness', 'bar / underline thickness', 1, 8, 1, 'cursor.thickness', v => v + ' px');

      const swatchRow = h('div', { class: 'cs-color-row' });
      PALETTE.forEach(([name, hex]) => swatchRow.appendChild(h('span', {
        class: 'cs-swatch', title: name + ' ' + hex, 'data-color': hex,
        style: { '--cs-color': hex }, onclick: () => set('cursor.color', hex)
      })));
      const colorInput = h('input', { type: 'color', title: 'custom cursor color' });
      colorInput.addEventListener('input', () => set('cursor.color', cleanHex(colorInput.value)));
      swatchRow.appendChild(colorInput);

      const controls = h('div', { class: 'stack cs-controls' },
        h('label', { class: 'field' }, 'style', styleRow),
        h('label', { class: 'field' }, 'animation', h('div', { class: 'btn-row' }, blinkChip)),
        blinkRate,
        h('label', { class: 'field' }, 'color', swatchRow),
        thickness
      );

      const liveLine = h('div', { class: 'cs-line preview-surface' });
      const demo = h('div', { class: 'cs-demo' });
      const preview = h('div', { class: 'stage grow' },
        h('div', { class: 'stage-body preview-surface cs-preview' }, liveLine, demo),
        h('div', { class: 'stage-foot' }, 'live preview')
      );
      const codeBox = h('pre', { class: 'codeblock' });
      const copyBtn = h('span', { class: 'btn primary', onclick: () => copy(exportText()) }, 'Copy');
      const dlBtn = h('span', { class: 'btn ghost', onclick: () => download('ghostty-cursor.conf', exportText()) }, 'Download');
      const exportCard = h('div', { class: 'stack' },
        h('div', { class: 'row-flex' }, copyBtn, dlBtn, h('span', { class: 'cs-note' }, 'Ghostty supports style, blink, and color. Rate/thickness are preview-only.')),
        codeBox
      );

      el.classList.add('fill');
      el.appendChild(h('div', { class: 'split' }, controls, h('div', { class: 'stack' }, preview, exportCard)));

      function cursorEl(c, char) {
        return h('span', {
          class: 'cs-cursor cs-' + c.style + (c.blink ? ' cs-blinking' : ''),
          style: { '--cs-color': c.color, '--cs-rate': c.blinkRate + 'ms', '--cs-thick': c.thickness + 'px' }
        }, c.style === 'block' ? char : ' ');
      }
      function exportText() {
        const c = cursor();
        return [
          'cursor-style = ' + c.style,
          'cursor-style-blink = ' + (c.blink ? 'true' : 'false'),
          'cursor-color = ' + c.color,
          '',
          '# Preview-only in Cursor Studio: blink-rate = ' + c.blinkRate + 'ms, thickness = ' + c.thickness + 'px',
          '# Ghostty has no direct cursor blink-rate or thickness setting.'
        ].join('\n');
      }
      function renderCode() {
        const c = cursor();
        codeBox.innerHTML = [
          '<span class="prop">cursor-style</span> = <span class="v">' + c.style + '</span>',
          '<span class="prop">cursor-style-blink</span> = <span class="v">' + (c.blink ? 'true' : 'false') + '</span>',
          '<span class="prop">cursor-color</span> = <span class="q">' + c.color + '</span>',
          '',
          '<span class="cmt"># preview-only: blink-rate ' + c.blinkRate + 'ms · thickness ' + c.thickness + 'px</span>',
          '<span class="cmt"># Ghostty has no direct setting for those two values.</span>'
        ].join('\n');
      }
      function render() {
        const c = cursor();
        styleRow.querySelectorAll('.btn').forEach(b => b.classList.toggle('sel', b.dataset.style === c.style));
        blinkChip.classList.toggle('on', c.blink);
        blinkRate._sync(c.blinkRate, !c.blink);
        thickness._sync(c.thickness, c.style === 'block');
        colorInput.value = cleanHex(c.color);
        swatchRow.querySelectorAll('.cs-swatch').forEach(s => s.classList.toggle('sel', s.dataset.color.toLowerCase() === cleanHex(c.color)));

        liveLine.replaceChildren(
          h('span', { class: 'cs-prompt' }, 'dev@atelier'), h('span', {}, ' '),
          h('span', { class: 'cs-path' }, '~/terminal-specimen'), h('span', {}, ' % '),
          h('span', { class: 'cs-cmd' }, 'atelier previe'), cursorEl(c, 'w')
        );
        demo.replaceChildren(
          h('span', { class: 'dim' }, 'positions:'),
          h('span', { class: 'cs-mini' }, 'git', cursorEl(c, 's'), 'tatus'),
          h('span', { class: 'cs-mini' }, './r', cursorEl(c, 'u'), 'n'),
          h('span', { class: 'cs-mini' }, 'vim ', cursorEl(c, 'm'), 'ain.js')
        );
        renderCode();
      }
      subscribe('cursor', render);
      render();
    }
  });
})();
