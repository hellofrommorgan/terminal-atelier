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
          } }, 'Copy share link')));

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
