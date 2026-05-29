/* Presets & Share — save complete Atelier setups, starter rigs, URL sharing, JSON import/export. */
(function () {
  App.injectCSS('presets-share', `
    .ps-panel{display:flex;flex-direction:column;gap:16px}
    .ps-banner{border-color:color-mix(in srgb,var(--accent) 50%,var(--surface0));background:color-mix(in srgb,var(--accent) 12%,var(--surface0))}
    .ps-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
    .ps-title{font-weight:700;color:var(--text);font-size:13px}
    .ps-desc{color:var(--overlay1);font-size:11.5px;line-height:1.45;margin-top:4px}
    .ps-save{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}
    .ps-rigs{display:flex;flex-direction:column;gap:8px}
    .ps-rig{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--surface0);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--crust) 42%,transparent)}
    .ps-rig-name{font-weight:700;color:var(--text)}
    .ps-meta{font-size:10.5px;color:var(--overlay1);margin-top:3px}
    .ps-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .ps-card{display:flex;flex-direction:column;gap:10px;min-height:132px;cursor:pointer;transition:border-color var(--speed),transform var(--speed),background var(--speed)}
    .ps-card:hover,.ps-card:focus{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--surface0));outline:none}
    .ps-card:active{transform:translateY(1px)}
    .ps-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .ps-swatch-row{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-top:auto}
    .ps-swatch{height:18px;border-radius:4px;border:1px solid rgba(255,255,255,.14)}
    .ps-json{min-height:300px;resize:vertical;line-height:1.5;white-space:pre;font-size:11px}
    .ps-actions{display:flex;gap:6px;flex-wrap:wrap}
    @media(max-width:1080px){.ps-gallery{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:680px){.ps-gallery{grid-template-columns:1fr}.ps-save,.ps-rig{grid-template-columns:1fr}.ps-rig .btn-row{justify-content:flex-start}}
  `);

  const SWATCH_KEYS = ['accent', 'base', 'text', 'green', 'peach', 'blue'];
  const PREVIEW_FONT_FACES = [
    ['Geist Mono', 'fonts/GeistMono-Variable.woff2', 'normal', '100 900'],
    ['Geist Mono', 'fonts/GeistMono-Italic-Variable.woff2', 'italic', '100 900'],
    ['Geist Sans', 'fonts/Geist-Variable.woff2', 'normal', '100 900'],
    ['Geist Sans', 'fonts/Geist-Italic-Variable.woff2', 'italic', '100 900'],
    ['Geist Pixel Circle', 'fonts/GeistPixel-Circle.woff2', 'normal', '400'],
    ['Geist Pixel Grid', 'fonts/GeistPixel-Grid.woff2', 'normal', '400'],
    ['Geist Pixel Line', 'fonts/GeistPixel-Line.woff2', 'normal', '400'],
    ['Geist Pixel Square', 'fonts/GeistPixel-Square.woff2', 'normal', '400'],
    ['Geist Pixel Triangle', 'fonts/GeistPixel-Triangle.woff2', 'normal', '400']
  ];
  const PREVIEW_STYLE_PROPS = [
    'align-content', 'align-items', 'align-self', 'animation', 'background', 'background-color',
    'border', 'border-bottom', 'border-bottom-color', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-bottom-style', 'border-bottom-width',
    'border-left', 'border-left-color', 'border-left-style', 'border-left-width',
    'border-radius', 'border-right', 'border-right-color', 'border-right-style', 'border-right-width',
    'border-top', 'border-top-color', 'border-top-left-radius', 'border-top-right-radius', 'border-top-style', 'border-top-width',
    'box-shadow', 'box-sizing', 'color', 'display', 'filter', 'flex', 'flex-basis', 'flex-direction', 'flex-grow', 'flex-shrink', 'flex-wrap',
    'font-family', 'font-feature-settings', 'font-size', 'font-style', 'font-variant-ligatures', 'font-variant-numeric', 'font-variation-settings', 'font-weight',
    'gap', 'grid-template-columns', 'height', 'justify-content', 'letter-spacing', 'line-height', 'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top',
    'max-height', 'max-width', 'min-height', 'min-width', 'opacity', 'overflow', 'overflow-x', 'overflow-y',
    'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'tab-size', 'text-align', 'text-shadow', 'text-transform',
    'vertical-align', 'white-space', 'width'
  ];

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function deepMerge(base, over) {
    if (over == null) return base;
    if (Array.isArray(over)) return over.slice();
    if (typeof over === 'object') {
      const out = Object.assign({}, base || {});
      Object.keys(over).forEach(k => {
        const v = over[k];
        out[k] = (v && typeof v === 'object' && !Array.isArray(v) && base && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]))
          ? deepMerge(base[k], v)
          : (v && typeof v === 'object' ? deepClone(v) : v);
      });
      return out;
    }
    return over;
  }
  function isObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }
  function encodeState(state) {
    return btoa(encodeURIComponent(JSON.stringify(state)));
  }
  function decodeState(text) {
    return JSON.parse(decodeURIComponent(atob(text)));
  }
  function fmtDate(ts) {
    try { return new Date(ts).toLocaleString(); } catch (e) { return 'unknown time'; }
  }
  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }
  async function buildEmbeddedFontCSS() {
    const rules = await Promise.all(PREVIEW_FONT_FACES.map(async ([family, url, style, weight]) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Could not fetch ${url}`);
      const b64 = bytesToBase64(new Uint8Array(await res.arrayBuffer()));
      return `@font-face{font-family:${JSON.stringify(family)};src:url(data:font/woff2;base64,${b64}) format("woff2");font-style:${style};font-weight:${weight};font-display:block}`;
    }));
    return rules.join('\n');
  }
  function inlineComputedStyles(source, clone) {
    const sourceNodes = [source].concat(Array.from(source.querySelectorAll('*')));
    const cloneNodes = [clone].concat(Array.from(clone.querySelectorAll('*')));
    sourceNodes.forEach((node, i) => {
      const target = cloneNodes[i];
      if (!target || node.nodeType !== 1) return;
      const cs = getComputedStyle(node);
      PREVIEW_STYLE_PROPS.forEach(prop => {
        const value = cs.getPropertyValue(prop);
        if (value) target.style.setProperty(prop, value);
      });
      target.style.setProperty('animation', 'none');
      target.style.setProperty('transition', 'none');
    });
  }
  function fallbackDownloadBlob(filename, blob, toast) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (toast) toast('↓ ' + filename);
  }

  App.registerFeature({
    id: 'presets-share', title: 'Rigs & Share', icon: '☰', order: 140,
    subtitle: 'Snapshot your rig, load a starter, or share via URL.',
    mount(el, ctx) {
      const { h, get, set, subscribe, toast, copy, download, applyPreset } = ctx;
      let jsonView;
      let importBanner;
      const panel = h('div', { class: 'ps-panel' });

      function currentStateForSaving() {
        const snap = deepClone(App.state || get(''));
        delete snap.rigs;
        return snap;
      }
      function applyState(next, msg) {
        if (!isObject(next)) { toast('Rig JSON must be an object', 'error'); return; }
        const rigs = deepClone(get('rigs') || []);
        const merged = deepClone(next);
        if (!Object.prototype.hasOwnProperty.call(merged, 'rigs')) merged.rigs = rigs;
        App.replaceState(merged);
        toast(msg || 'Rig applied');
      }
      function refreshJsonView() {
        if (jsonView) jsonView.value = JSON.stringify(App.state || get(''), null, 2);
      }
      function renderRigList() {
        rigList.innerHTML = '';
        const rigs = Array.isArray(get('rigs')) ? get('rigs') : [];
        if (!rigs.length) {
          rigList.appendChild(h('div', { class: 'muted' }, 'No rigs saved. Give this config a name and save it.'));
          return;
        }
        rigs.forEach((rig, idx) => {
          const name = (rig && rig.name) || `rig ${idx + 1}`;
          const row = h('div', { class: 'ps-rig' },
            h('div', {},
              h('div', { class: 'ps-rig-name' }, name),
              h('div', { class: 'ps-meta tnum' }, `${fmtDate(rig && rig.ts)} · snapshot ${idx + 1}`)),
            h('div', { class: 'btn-row' },
              h('button', { class: 'btn primary', onclick: () => applyState(rig && rig.state, `Applied ${name}`) }, 'Apply'),
              h('button', { class: 'btn ghost', onclick: () => {
                const next = rigs.slice(); next.splice(idx, 1); set('rigs', next); toast('Rig deleted');
              } }, 'Delete')));
          rigList.appendChild(row);
        });
      }
      function showImportBanner(state) {
        if (importBanner) importBanner.remove();
        importBanner = h('div', { class: 'card ps-banner adv-only' },
          h('div', { class: 'ps-head' },
            h('div', {},
              h('div', { class: 'ps-title' }, 'Shared rig detected.'),
              h('div', { class: 'ps-desc' }, 'This URL carries a full Atelier config. Apply only if you trust the source.')),
            h('div', { class: 'btn-row' },
              h('button', { class: 'btn primary', onclick: () => { applyState(state, 'Shared rig imported'); importBanner.remove(); importBanner = null; } }, 'Apply'),
              h('button', { class: 'btn ghost', onclick: () => { importBanner.remove(); importBanner = null; } }, 'Dismiss'))));
        panel.insertBefore(importBanner, panel.firstChild);
      }
      async function exportPreviewPNG(button) {
        const previousText = button && button.textContent;
        try {
          if (button) { button.disabled = true; button.textContent = 'Exporting…'; }
          const dock = document.getElementById('preview-dock-body');
          const source = dock && (dock.querySelector('.ms-terminal') || dock.querySelector('.ms-surface') || dock);
          if (!source) { toast('Live preview is not ready yet', 'error'); return; }
          const rect = source.getBoundingClientRect();
          const width = Math.max(1, Math.ceil(rect.width));
          const height = Math.max(1, Math.ceil(rect.height));
          const clone = source.cloneNode(true);
          inlineComputedStyles(source, clone);
          clone.style.setProperty('width', width + 'px');
          clone.style.setProperty('height', height + 'px');
          clone.style.setProperty('margin', '0');

          let fontCSS = '';
          try {
            fontCSS = await buildEmbeddedFontCSS();
          } catch (e) {
            toast('Tip: serve over http (python3 -m http.server) to embed exact fonts.', 'warn');
          }

          const wrapper = document.createElement('div');
          wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
          wrapper.style.width = width + 'px';
          wrapper.style.height = height + 'px';
          wrapper.style.margin = '0';
          wrapper.style.overflow = 'hidden';
          if (fontCSS) {
            const style = document.createElement('style');
            style.textContent = fontCSS;
            wrapper.appendChild(style);
          }
          wrapper.appendChild(clone);

          const base = getComputedStyle(document.documentElement).getPropertyValue('--base').trim() || '#1e1e2e';
          const xhtml = new XMLSerializer().serializeToString(wrapper);
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${base}"/><foreignObject width="${width}" height="${height}">${xhtml}</foreignObject></svg>`;
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Preview image could not be rendered'));
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
          });

          const scale = Math.max(1, Math.min(3, window.devicePixelRatio || 2));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const c = canvas.getContext('2d');
          c.scale(scale, scale);
          c.fillStyle = base;
          c.fillRect(0, 0, width, height);
          c.drawImage(img, 0, 0, width, height);

          let blob;
          try {
            blob = await new Promise((resolve, reject) => {
              try {
                canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG export failed')), 'image/png');
              } catch (e) { reject(e); }
            });
          } catch (e) {
            try {
              const dataURL = canvas.toDataURL('image/png');
              const bin = atob(dataURL.split(',')[1]);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              blob = new Blob([bytes], { type: 'image/png' });
            } catch (err) {
              toast('Could not export PNG — browser blocked canvas access.', 'error');
              return;
            }
          }
          fallbackDownloadBlob('atelier-preview.png', blob, toast);
        } catch (e) {
          toast('Could not export preview PNG', 'error');
        } finally {
          if (button) { button.disabled = false; button.textContent = previousText; }
        }
      }

      const nameInput = h('input', { type: 'text', placeholder: 'rig name, e.g. daily-driver' });
      const saveCard = h('div', { class: 'card' },
        h('h4', {}, h('span', { class: 'accent' }, '◆'), 'Snapshots'),
        h('div', { class: 'ps-save' },
          h('label', { class: 'field' }, 'name', nameInput),
          h('button', { class: 'btn primary', onclick: () => {
            const name = (nameInput.value || '').trim() || `Rig ${((get('rigs') || []).length || 0) + 1}`;
            const rigs = Array.isArray(get('rigs')) ? get('rigs').slice() : [];
            rigs.push({ name, ts: Date.now(), state: currentStateForSaving() });
            set('rigs', rigs); nameInput.value = ''; toast('Rig saved');
          } }, 'Save current as rig')),
        h('hr', { class: 'sep' }),
        h('div', { class: 'ps-rigs' }));
      const rigList = saveCard.querySelector('.ps-rigs');

      const gallery = h('div', { class: 'ps-gallery' });
      const presets = Array.isArray(App.PRESETS) ? App.PRESETS : [];
      function applyStarter(preset) {
        applyPreset(preset);
        toast(`Applied ${preset.name}`);
      }
      presets.forEach(preset => {
        const colors = (preset.state && preset.state.theme && preset.state.theme.colors) || {};
        const tags = preset.id === 'mocha-clean' ? [h('span', { class: 'tag-pill on' }, 'recommended')] : [];
        gallery.appendChild(h('div', {
          class: 'card ps-card', role: 'button', tabindex: '0',
          onclick: () => applyStarter(preset),
          onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyStarter(preset); } }
        },
          h('div', {},
            h('div', { class: 'ps-card-head' },
              h('div', { class: 'ps-title' }, preset.name), tags),
            h('div', { class: 'ps-desc' }, preset.blurb || preset.vibe || 'Curated starter rig.')),
          h('div', { class: 'ps-swatch-row', 'aria-label': 'theme swatches' },
            SWATCH_KEYS.map(key => h('span', { class: 'ps-swatch', title: key, style: { background: colors[key] || 'var(--surface0)' } })))));
      });
      const galleryCard = h('div', { class: 'card' },
        h('h4', {}, h('span', { class: 'accent' }, '◆'), 'Starter gallery'), gallery);

      const shareCard = h('div', { class: 'card adv-only' },
        h('h4', {}, h('span', { class: 'accent' }, '◆'), 'Share via URL'),
        h('div', { class: 'ps-desc' }, 'Copy a file://-safe URL hash containing your current Atelier state. Import is always confirmed before applying.'),
        h('div', { class: 'ps-actions', style: { marginTop: '10px' } },
          h('button', { class: 'btn primary', onclick: () => {
            try {
              const encoded = encodeState(App.state || get(''));
              const url = location.href.replace(/#.*$/, '') + '#rig=' + encoded;
              location.hash = 'rig=' + encoded;
              copy(url);
            } catch (e) { toast('Could not create share link', 'error'); }
          } }, 'Copy share link'),
          h('button', { class: 'btn', onclick: (e) => exportPreviewPNG(e.currentTarget) }, 'Export preview as PNG')));

      jsonView = h('textarea', { class: 'ps-json', spellcheck: 'false' });
      const jsonCard = h('div', { class: 'card adv-only' },
        h('h4', {}, h('span', { class: 'accent' }, '◆'), 'Import / export JSON'),
        h('label', { class: 'field' }, 'current state', jsonView),
        h('div', { class: 'ps-actions', style: { marginTop: '10px' } },
          h('button', { class: 'btn', onclick: () => copy(jsonView.value) }, 'Copy'),
          h('button', { class: 'btn', onclick: () => download('atelier-rig.json', jsonView.value) }, 'Download'),
          h('button', { class: 'btn primary', onclick: () => {
            try {
              const parsed = JSON.parse(jsonView.value);
              if (!isObject(parsed)) { toast('JSON must be an object', 'error'); return; }
              applyState(parsed, 'Loaded JSON rig');
            } catch (e) { toast('Invalid JSON', 'error'); }
          } }, 'Load from JSON')));

      panel.appendChild(saveCard);
      panel.appendChild(galleryCard);
      panel.appendChild(shareCard);
      panel.appendChild(jsonCard);
      el.appendChild(panel);

      subscribe('rigs', renderRigList);
      subscribe('', refreshJsonView);
      renderRigList();
      refreshJsonView();

      try {
        const params = new URLSearchParams((location.hash || '').replace(/^#/, ''));
        const encoded = params.get('rig');
        if (encoded) {
          const parsed = decodeState(encoded);
          if (isObject(parsed)) showImportBanner(parsed);
          else toast('Shared rig is not an object', 'error');
        }
      } catch (e) {
        toast('Could not read shared rig', 'error');
      }
    }
  });
})();
