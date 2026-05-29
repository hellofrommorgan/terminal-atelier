/* A/B Compare — local, side-by-side font specimen comparison. */
(function () {
  App.injectCSS('ab-compare', `
    .ab-wrap{display:flex;flex-direction:column;gap:12px;min-height:0}
    .ab-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .ab-specimen{min-height:110px;resize:vertical;font-family:var(--pv-family);line-height:1.45}
    .ab-grid{display:flex;gap:12px;align-items:stretch;min-height:0;flex-wrap:wrap}
    .ab-card{flex:1 1 340px;min-width:min(100%,280px);display:flex;flex-direction:column;gap:10px}
    .ab-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .ab-title{font-weight:750;color:var(--text);letter-spacing:.02em}
    .ab-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .ab-controls .field{min-width:0}
    .ab-controls select{width:100%}
    .ab-controls input[type=number]{width:100%}
    .ab-feature-row{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap}
    .ab-preview{min-height:240px;overflow:auto;white-space:pre-wrap;tab-size:2;outline:none}
    .ab-meta{font-size:11px;color:var(--overlay1)}
    @media (max-width:760px){.ab-controls{grid-template-columns:1fr}.ab-grid{flex-direction:column}.ab-card{flex-basis:auto}.ab-preview{min-height:190px}}
  `);

  App.registerFeature({
    id: 'ab-compare', title: 'A/B Compare', icon: '⇋', order: 35,
    subtitle: 'compare two font setups side by side',
    mount(el, ctx) {
      const { h, get, fmtFeatures, toast } = ctx;
      const FAMILIES = [
        'Geist Mono', 'Geist Sans', 'Geist Pixel Circle', 'Geist Pixel Grid',
        'Geist Pixel Line', 'Geist Pixel Square', 'Geist Pixel Triangle',
        'monospace', 'sans-serif'
      ];
      const FEATURE_GROUPS = [
        [['liga', 'calt'], 'ligatures', 'liga/calt'], [['zero'], 'slashed zero', 'zero'],
        [['ss01'], 'set 01', 'ss01'], [['ss02'], 'set 02', 'ss02'], [['tnum'], 'tabular', 'tnum']
      ];
      const DEFAULT_TEXT = [
        'const compare = (fontA, fontB) => fontA !== fontB;',
        '// ligatures: => != >= <= === !== -> <=>',
        '// digits:    0123456789  00:11:22  $123,456.789',
        'if (score >= 900 && ready === true) ship({ mode: "atelier" });',
        '',
        'Pack my box with five dozen liquor jugs — then tune the terminal.'
      ].join('\n');
      const DEFAULT_A = { family: 'Geist Mono', wght: 420, size: 16, lh: 1.5, tracking: 0, italic: false, features: ['liga', 'calt'] };
      const DEFAULT_B = { family: 'Geist Sans', wght: 420, size: 16, lh: 1.5, tracking: 0, italic: false, features: ['liga', 'calt'] };
      const state = { A: cloneFont(DEFAULT_A), B: cloneFont(DEFAULT_B), text: DEFAULT_TEXT };
      const refs = {};

      function cloneFont(f) {
        return {
          family: f.family || 'Geist Mono',
          wght: clampNum(f.wght, 100, 900, 420),
          size: clampNum(f.size, 8, 96, 16),
          lh: clampNum(f.lh, 0.8, 2.6, 1.5),
          tracking: clampNum(f.tracking, -0.12, 0.5, 0),
          italic: !!f.italic,
          features: (f.features || []).slice()
        };
      }
      function fromCurrentFont() { return cloneFont(get('font') || DEFAULT_A); }
      function clampNum(v, min, max, fallback) {
        const n = parseFloat(v);
        return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
      }
      function cssFamily(name) { return /^(monospace|sans-serif|serif|system-ui)$/i.test(name) ? name : '"' + name.replace(/"/g, '\\"') + '"'; }
      function hasAll(font, tags) {
        const features = font.features || [];
        if (tags.includes('liga') && tags.includes('calt') && features.includes('lig')) return true;
        return tags.every(t => features.includes(t));
      }
      function setTags(font, tags, on) {
        const remove = tags.includes('liga') && tags.includes('calt') ? tags.concat('lig') : tags;
        const next = (font.features || []).filter(t => !remove.includes(t));
        font.features = on ? next.concat(tags) : next;
      }
      function slider(side, key, label, min, max, step, fmt) {
        const val = h('span', { class: 'val tnum' });
        const input = h('input', { type: 'range', min, max, step });
        const wrap = h('label', { class: 'field' }, h('span', { class: 'row' }, h('span', {}, label), val), input);
        input.addEventListener('input', () => { state[side][key] = parseFloat(input.value); render(); });
        refs[side].sliders.push({ key, input, val, min, max, fmt });
        return wrap;
      }
      function numberField(side, key, label, min, max, step) {
        const input = h('input', { type: 'number', min, max, step });
        input.addEventListener('input', () => { state[side][key] = clampNum(input.value, min, max, state[side][key]); render(); });
        refs[side].numbers.push({ key, input });
        return h('label', { class: 'field' }, label, input);
      }
      function familySelect(side) {
        const select = h('select', {}, FAMILIES.map(fam => h('option', { value: fam }, fam)));
        select.addEventListener('change', () => { state[side].family = select.value; render(); });
        refs[side].family = select;
        return h('label', { class: 'field' }, 'family', select);
      }
      function featureRow(side) {
        const row = h('div', { class: 'ab-feature-row' });
        FEATURE_GROUPS.forEach(([tags, label, tag]) => {
          const chip = h('span', { class: 'chip', 'data-tags': tags.join(','), html: `${label} <span class="tag">${tag}</span>` });
          chip.addEventListener('click', () => { setTags(state[side], tags, !hasAll(state[side], tags)); render(); });
          refs[side].chips.push(chip);
          row.appendChild(chip);
        });
        return h('label', { class: 'field' }, 'features', row);
      }
      function makePane(side) {
        refs[side] = { sliders: [], numbers: [], chips: [] };
        const preview = h('div', { class: 'stage-body preview-surface ab-preview', contenteditable: 'true', spellcheck: 'false' });
        const meta = h('div', { class: 'ab-meta tnum' });
        preview.addEventListener('input', () => { state.text = preview.textContent; syncText(side); });
        refs[side].preview = preview;
        refs[side].meta = meta;
        const italic = h('span', { class: 'chip', onclick: () => { state[side].italic = !state[side].italic; render(); } }, 'italic');
        refs[side].italic = italic;
        const controls = h('div', { class: 'ab-controls' },
          familySelect(side),
          slider(side, 'wght', 'weight', 100, 900, 10, v => v),
          numberField(side, 'size', 'size px', 8, 96, 1),
          numberField(side, 'lh', 'line-height', 0.8, 2.6, 0.05),
          numberField(side, 'tracking', 'tracking em', -0.12, 0.5, 0.005),
          h('label', { class: 'field' }, 'style', h('div', { class: 'btn-row' }, italic)),
          featureRow(side)
        );
        return h('div', { class: 'card ab-card' },
          h('div', { class: 'ab-head' }, h('div', { class: 'ab-title' }, 'Pane ' + side), meta),
          controls,
          h('div', { class: 'stage grow' }, preview, h('div', { class: 'stage-foot' }, 'editable local preview'))
        );
      }
      function syncText(skipSide) {
        ['A', 'B'].forEach(side => {
          const p = refs[side].preview;
          if (side !== skipSide && p.textContent !== state.text) p.textContent = state.text;
        });
        if (specimen.value !== state.text) specimen.value = state.text;
      }
      function applyInline(side) {
        const font = state[side];
        const pane = refs[side].preview;
        pane.style.fontFamily = cssFamily(font.family);
        pane.style.fontVariationSettings = "'wght' " + font.wght;
        pane.style.fontSize = font.size + 'px';
        pane.style.lineHeight = String(font.lh);
        pane.style.letterSpacing = font.tracking + 'em';
        pane.style.fontStyle = font.italic ? 'italic' : 'normal';
        pane.style.fontFeatureSettings = fmtFeatures(font.features);
      }
      function syncControls(side) {
        const font = state[side];
        refs[side].family.value = font.family;
        refs[side].sliders.forEach(s => {
          const v = font[s.key];
          s.input.value = v; s.val.textContent = s.fmt(v);
          s.input.style.setProperty('--fill', ((v - s.min) / (s.max - s.min) * 100) + '%');
        });
        refs[side].numbers.forEach(n => { n.input.value = font[n.key]; });
        refs[side].italic.classList.toggle('on', font.italic);
        refs[side].chips.forEach(chip => chip.classList.toggle('on', hasAll(font, chip.dataset.tags.split(','))));
        refs[side].meta.textContent = `${font.family} · ${font.wght} · ${font.size}px/${(+font.lh).toFixed(2)}`;
      }
      function render() {
        ['A', 'B'].forEach(side => { syncControls(side); applyInline(side); });
        syncText();
      }
      function copySide(from, to) { state[to] = cloneFont(state[from]); render(); }
      function swap() { const a = state.A; state.A = state.B; state.B = a; render(); }

      const specimen = h('textarea', { class: 'field ab-specimen', spellcheck: 'false' });
      specimen.addEventListener('input', () => { state.text = specimen.value; syncText(); });
      const toolbar = h('div', { class: 'ab-toolbar' },
        h('span', { class: 'btn primary', onclick: () => { state.A = fromCurrentFont(); render(); toast('Pane A seeded from current font.'); } }, 'Seed A from current'),
        h('span', { class: 'btn', onclick: () => copySide('A', 'B') }, 'Copy A→B'),
        h('span', { class: 'btn', onclick: () => copySide('B', 'A') }, 'Copy B→A'),
        h('span', { class: 'btn ghost', onclick: swap }, 'Swap A/B')
      );

      el.classList.add('fill');
      el.appendChild(h('div', { class: 'ab-wrap' },
        toolbar,
        h('label', { class: 'field' }, 'shared specimen', specimen),
        h('div', { class: 'ab-grid' }, makePane('A'), makePane('B'))
      ));
      render();
    }
  });
})();
