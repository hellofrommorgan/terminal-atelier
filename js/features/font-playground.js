/* Font Playground — drive the Geist family live; reads/writes state.font.
   Reference implementation: shows the standard feature-module pattern. */
(function () {
  App.registerFeature({
    id: 'font-playground', title: 'Font Playground', icon: 'A', order: 10,
    subtitle: 'Drag axes. Toggle features. Or bring your own font — type an installed name or drop a file. Click the preview to type.',
    mount(el, ctx) {
      const { h, get, set, subscribe, fmtFeatures, toast } = ctx;

      const FAMILIES = [
        ['Geist Mono', 'Mono', true], ['Geist Sans', 'Sans', true],
        ['Geist Pixel Circle', 'Circle', false], ['Geist Pixel Grid', 'Grid', false],
        ['Geist Pixel Line', 'Line', false], ['Geist Pixel Square', 'Square', false],
        ['Geist Pixel Triangle', 'Triangle', false]
      ];
      const BASIC_FEATURES = [
        ['lig', 'ligatures', 'liga…'], ['tnum', 'tabular', 'tnum'], ['frac', 'fractions', 'frac']
      ];
      const ADV_FEATURES = [
        ['ss01', 'no-tail a', 'ss01'], ['ss02', 'alt a', 'ss02'],
        ['ss03', 'alt l', 'ss03'], ['ss04', 'alt R', 'ss04'], ['ss06', 'alt G', 'ss06'],
        ['ss08', 'rounded dot', 'ss08'], ['ss10', 'alt ( )', 'ss10'], ['ss09', 'plain 0', 'ss09']
      ];
      const PRESETS = {
        code:    { family: 'Geist Mono', variable: true, wght: 370, size: 22, lh: 1.55, tracking: 0, italic: false, features: ['lig'] },
        status:  { family: 'Geist Mono', variable: true, wght: 640, size: 18, lh: 1.2, tracking: 0.05, italic: false, features: [] },
        comment: { family: 'Geist Mono', variable: true, wght: 390, size: 22, lh: 1.5, tracking: 0, italic: true, features: ['ss02'] },
        banner:  { family: 'Geist Pixel Grid', variable: false, wght: 400, size: 56, lh: 1.1, tracking: 0.02, italic: false, features: [] },
        reset:   { family: 'Geist Mono', variable: true, wght: 420, size: 22, lh: 1.5, tracking: 0, italic: false, features: [] }
      };

      const f = () => get('font');

      // ---------- build UI ----------
      const famRow = h('div', { class: 'btn-row' });
      FAMILIES.forEach(([fam, label, variable]) => famRow.appendChild(
        h('span', { class: 'btn', 'data-fam': fam, 'data-var': variable ? '1' : '0',
          onclick: () => { set('font.family', fam); set('font.variable', variable); if (!variable) set('font.italic', false); } }, label)));

      const featRow = h('div', { class: 'btn-row' });
      BASIC_FEATURES.forEach(([key, label, tag]) => featRow.appendChild(
        h('span', { class: 'chip', 'data-key': key, html: `${label} <span class="tag">${tag}</span>` })));

      const advFeatRow = h('div', { class: 'btn-row' });
      const italicChip = h('span', { class: 'chip', 'data-key': 'italic' }, 'italic');
      advFeatRow.appendChild(italicChip);
      ADV_FEATURES.forEach(([key, label, tag]) => advFeatRow.appendChild(
        h('span', { class: 'chip', 'data-key': key, html: `${label} <span class="tag">${tag}</span>` })));

      const toggleFeature = e => {
        const c = e.target.closest('.chip'); if (!c) return;
        const key = c.dataset.key;
        if (key === 'italic') { if (!f().variable) return; set('font.italic', !f().italic); return; }
        const arr = (f().features || []).slice();
        const i = arr.indexOf(key); i >= 0 ? arr.splice(i, 1) : arr.push(key);
        set('font.features', arr);
      };
      featRow.addEventListener('click', toggleFeature);
      advFeatRow.addEventListener('click', toggleFeature);

      function slider(id, label, min, max, step, path, fmt) {
        const val = h('span', { class: 'val tnum' });
        const input = h('input', { type: 'range', min, max, step, id });
        const wrap = h('label', { class: 'field' },
          h('span', { class: 'row' }, h('span', {}, label), val), input);
        input.addEventListener('input', () => set(path, parseFloat(input.value)));
        wrap._sync = () => { const v = get(path); input.value = v; val.textContent = fmt(v);
          if (path === 'font.wght') val.style.fontVariationSettings = "'wght' " + v;
          input.style.setProperty('--fill', ((v - min) / (max - min) * 100) + '%'); };
        wrap._input = input; wrap._id = id;
        return wrap;
      }
      const fmtTracking = v => {
        const n = +v;
        if (Object.is(n, -0) || Math.abs(n) < 0.0005) return '0em';
        return (n > 0 ? '+' : '') + n.toFixed(3) + 'em';
      };
      const sW = slider('s-wght', 'weight', 100, 900, 10, 'font.wght', v => v);
      const sS = slider('s-size', 'size', 10, 96, 1, 'font.size', v => v + ' px');
      const sL = slider('s-lh', 'line-height', 0.9, 2.4, 0.05, 'font.lh', v => (+v).toFixed(2));
      const sT = slider('s-tr', 'tracking', -0.08, 0.4, 0.005, 'font.tracking', fmtTracking);

      const presetRow = h('div', { class: 'btn-row' });
      Object.keys(PRESETS).forEach(k => presetRow.appendChild(
        h('span', { class: 'btn preset', onclick: () => set('font', Object.assign({}, PRESETS[k])) }, k === 'reset' ? 'reset' : k)));

      // ---------- custom fonts: any installed font, or load/drop a file ----------
      const FONT_EXT = /\.(woff2?|ttf|otf)$/i;
      function addCustomFamily(name) {
        if (famRow.querySelector(`[data-fam="${(window.CSS && CSS.escape) ? CSS.escape(name) : name}"]`)) return;
        famRow.appendChild(h('span', { class: 'btn', 'data-fam': name, 'data-var': '1',
          onclick: () => { set('font.family', name); set('font.variable', true); } }, name));
      }
      function applyCustom(name) {
        name = (name || '').trim(); if (!name) return;
        addCustomFamily(name);
        set('font.family', name); set('font.variable', true);
        customInput.value = '';
      }
      async function loadFontFile(file) {
        if (!file || !FONT_EXT.test(file.name)) { toast('Use a .woff2, .woff, .ttf or .otf file.', 'error'); return; }
        try {
          const buf = await file.arrayBuffer();
          const name = file.name.replace(FONT_EXT, '').replace(/[_]+/g, ' ').trim() || 'Custom Font';
          const face = new FontFace(name, buf);
          await face.load(); document.fonts.add(face);
          addCustomFamily(name); applyCustom(name);
          toast('Loaded "' + name + '"');
        } catch (e) { toast('Could not load that font file.', 'error'); }
      }

      const customInput = h('input', { type: 'text', placeholder: 'installed font, e.g. JetBrains Mono', spellcheck: 'false' });
      customInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyCustom(customInput.value); } });
      const useBtn = h('span', { class: 'btn', onclick: () => applyCustom(customInput.value) }, 'use');
      const fileInput = h('input', { type: 'file', accept: '.woff2,.woff,.ttf,.otf', style: { display: 'none' } });
      fileInput.addEventListener('change', () => { const fl = fileInput.files && fileInput.files[0]; if (fl) loadFontFile(fl); fileInput.value = ''; });
      const loadBtn = h('span', { class: 'btn', onclick: () => fileInput.click() }, 'load file…');
      const customField = h('label', { class: 'field' }, 'custom font',
        customInput,
        h('div', { class: 'btn-row', style: { marginTop: '6px' } }, useBtn, loadBtn, fileInput));

      const advancedControls = h('div', { class: 'stack adv-only' },
        sL, sT,
        h('label', { class: 'field' }, 'advanced features', advFeatRow));
      const controls = h('div', { class: 'stack' },
        h('label', { class: 'field' }, 'family', famRow),
        customField,
        sW, sS,
        h('label', { class: 'field' }, 'features', featRow),
        advancedControls,
        h('label', { class: 'field' }, 'presets', presetRow));

      const SPECIMEN = [
        'const greet = (name) => `hi ${name}`;',
        '// ligatures:  => != >= <= -> === !== |>',
        '// numerals:   0 O o · 1 l I i · 0123456789 · 1/2 3/4',
        'const total = items.reduce((a, b) => a + b, 0);',
        "type Theme = 'mocha' | 'latte' | 'frappe';",
        'if (fps >= 60 && ok !== false) ship(/* go */);',
      ].join('\n');
      const stage = h('div', { class: 'stage-body preview-surface', contenteditable: 'true', spellcheck: 'false',
        style: { minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', textAlign: 'left', whiteSpace: 'pre-wrap', outline: 'none' } },
        SPECIMEN);
      const preview = h('div', { class: 'stage grow' }, stage, h('div', { class: 'stage-foot' }, 'click to edit'));
      const cssBox = h('pre', { class: 'codeblock' });

      el.classList.add('fill');
      el.addEventListener('dragover', e => { e.preventDefault(); });
      el.addEventListener('drop', e => { const fl = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (fl) { e.preventDefault(); loadFontFile(fl); } });
      el.appendChild(h('div', { class: 'split' }, controls, h('div', { class: 'stack' }, preview, cssBox)));

      // ---------- reactive sync ----------
      function render() {
        const v = f();
        famRow.querySelectorAll('.btn').forEach(b => b.classList.toggle('sel', b.dataset.fam === v.family));
        sW._input.disabled = !v.variable; [sW, sS, sL, sT].forEach(s => s._sync());
        italicChip.classList.toggle('on', !!v.italic);
        italicChip.style.opacity = v.variable ? '' : '.32'; italicChip.style.pointerEvents = v.variable ? '' : 'none';
        [featRow, advFeatRow].forEach(row => row.querySelectorAll('.chip').forEach(c => { if (c.dataset.key !== 'italic') c.classList.toggle('on', (v.features || []).includes(c.dataset.key)); }));

        // live CSS
        const lines = [`<span class="prop">font-family</span>: <span class="q">"${v.family}"</span>;`];
        if (v.variable) lines.push(`<span class="prop">font-variation-settings</span>: <span class="q">'wght'</span> <span class="v">${v.wght}</span>;`);
        if (v.italic) lines.push(`<span class="prop">font-style</span>: <span class="v">italic</span>;`);
        lines.push(`<span class="prop">font-size</span>: <span class="v">${v.size}px</span>;`);
        lines.push(`<span class="prop">line-height</span>: <span class="v">${(+v.lh).toFixed(2)}</span>;`);
        if (v.tracking) lines.push(`<span class="prop">letter-spacing</span>: <span class="v">${(+v.tracking).toFixed(3)}em</span>;`);
        lines.push(`<span class="prop">font-feature-settings</span>: ${fmtFeatures(v.features).split(', ').map(p => { const [t, n] = p.split(' '); return `<span class="q">${t}</span> <span class="v">${n}</span>`; }).join(', ')};`);
        cssBox.innerHTML = `<span class="sel-css">.preview</span> {\n  ${lines.join('\n  ')}\n}`;
      }
      subscribe('font', render);
      render();
    }
  });
})();
