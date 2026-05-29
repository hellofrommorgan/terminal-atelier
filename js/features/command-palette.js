/* Command Palette + guided tour — global help overlay for Atelier. */
(function () {
  const ID = 'command-palette';
  let modal = null;
  let query = '';
  let activeIndex = 0;
  let items = [];
  let listEl = null;
  let inputEl = null;
  let featureCtx = null;
  let tour = { running: false, index: 0, timer: null, features: [], control: null };

  App.injectCSS(ID, `
    .cp-modal { max-width: 720px; }
    .cp-head { padding: 12px; border-bottom: 1px solid var(--surface0); background: color-mix(in srgb,var(--surface0) 36%,transparent); }
    .cp-input { font-size: 14px !important; padding: 10px 12px !important; }
    .cp-list { max-height: min(430px,52vh); overflow: auto; padding: 8px; }
    .cp-item { display: grid; grid-template-columns: 28px 1fr auto; gap: 10px; align-items: center; padding: 9px 10px; border-radius: var(--radius-sm); cursor: pointer; color: var(--subtext1); border: 1px solid transparent; }
    .cp-item:hover, .cp-item.is-active { background: color-mix(in srgb,var(--accent) 16%,var(--base)); border-color: color-mix(in srgb,var(--accent) 42%,transparent); color: var(--text); }
    .cp-ico { color: var(--accent); text-align: center; font-weight: 700; }
    .cp-title { font-size: 12.5px; color: var(--text); }
    .cp-sub { font-size: 11px; color: var(--overlay1); margin-top: 2px; }
    .cp-kind { font-size: 10px; color: var(--overlay0); text-transform: uppercase; letter-spacing: .08em; }
    .cp-empty { padding: 22px; text-align: center; color: var(--overlay1); }
    .cp-tour { position: fixed; right: 18px; bottom: 18px; z-index: 1001; display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: var(--radius); border: 1px solid var(--surface1); background: var(--base); box-shadow: 0 14px 38px rgba(0,0,0,.52); font-family: var(--mono); }
    .cp-tour-label { color: var(--text); font-size: 12px; min-width: 86px; }
    .cp-help-list { display: grid; gap: 8px; }
    .cp-help-row { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; padding: 8px 0; border-bottom: 1px dashed var(--surface0); }
    .cp-feature-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 10px; }
    .cp-feature { display: flex; gap: 9px; align-items: flex-start; }
    .cp-feature .cp-ico { width: 20px; flex: none; }
  `);

  function shortcutLabel() {
    const mac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
    return mac ? '⌘K' : 'Ctrl+K';
  }

  function normalize(s) { return String(s || '').toLowerCase(); }

  function fuzzyMatch(text, needle) {
    const hay = normalize(text);
    const q = normalize(needle).trim();
    if (!q) return true;
    if (hay.includes(q)) return true;
    let pos = 0;
    for (let i = 0; i < hay.length && pos < q.length; i++) if (hay[i] === q[pos]) pos++;
    return pos === q.length;
  }


  function currentMode() {
    if (featureCtx && typeof featureCtx.mode === 'function') return featureCtx.mode();
    return App.getMode ? App.getMode() : 'novice';
  }

  function setAtelierMode(mode) {
    if (featureCtx && typeof featureCtx.setMode === 'function') featureCtx.setMode(mode);
    else if (App.setMode) App.setMode(mode);
  }

  function openOnboardingTour() {
    closePalette();
    if (typeof App.openOnboarding === 'function') App.openOnboarding();
    else startTour();
  }

  function featureItems() {
    return App.getFeatures().map((f, i) => ({
      type: 'feature',
      id: f.id,
      icon: f.icon || '•',
      title: f.title || f.id,
      subtitle: f.subtitle || 'Open this feature panel',
      key: i < 9 ? String(i + 1) : '',
      run() { App.bus.emit('nav:go', { id: f.id }); closePalette(); }
    }));
  }

  function actionItems() {
    const mode = currentMode();
    const nextMode = mode === 'expert' ? 'novice' : 'expert';
    return [
      { type: 'action', icon: '↺', title: 'Reset everything', subtitle: 'Restore Atelier defaults and clear saved configuration', key: '', run() { if (App.resetState) App.resetState(); App.toast('Everything reset'); closePalette(); } },
      { type: 'action', icon: '◐', title: 'Random theme', subtitle: 'Ask Theme Studio to generate a random palette', key: '', run() { App.bus.emit('action:random-theme', {}); App.toast('Random theme requested'); closePalette(); } },
      { type: 'action', icon: '◐', title: nextMode === 'novice' ? 'Switch to Simple' : 'Switch to Expert', subtitle: nextMode === 'novice' ? ('Show the ' + App.CORE_FEATURES.length + ' core panels and hide advanced tools') : ('Show all ' + App.getFeatures().length + ' panels and advanced controls'), key: '', run() { setAtelierMode(nextMode); App.toast(nextMode === 'novice' ? 'Simple mode on' : 'Expert mode on'); closePalette(); } },
      { type: 'action', icon: '▶', title: 'Take the tour', subtitle: 'Re-run the first-run walkthrough', key: '', run() { openOnboardingTour(); } },
      { type: 'action', icon: '⇩', title: 'Export configs', subtitle: 'Jump to the export hub', key: '', run() { App.bus.emit('nav:go', { id: 'export-hub' }); closePalette(); } }
    ];
  }

  function buildItems() {
    const all = featureItems().concat(actionItems());
    return all.filter(item => fuzzyMatch([item.title, item.subtitle, item.id, item.type].join(' '), query));
  }

  function renderList() {
    if (!listEl) return;
    items = buildItems();
    if (activeIndex >= items.length) activeIndex = 0;
    if (activeIndex < 0) activeIndex = Math.max(items.length - 1, 0);
    listEl.innerHTML = '';
    if (!items.length) {
      listEl.appendChild(App.h('div', { class: 'cp-empty' }, 'No commands found'));
      return;
    }
    items.forEach((item, idx) => {
      const row = App.h('div', { class: 'cp-item' + (idx === activeIndex ? ' is-active' : ''), onclick: () => activate(idx), onmouseenter: () => { activeIndex = idx; renderList(); } },
        App.h('span', { class: 'cp-ico' }, item.icon),
        App.h('span', {}, App.h('div', { class: 'cp-title' }, item.title), App.h('div', { class: 'cp-sub' }, item.subtitle)),
        App.h('span', { class: 'cp-kind' }, item.key ? item.key : item.type)
      );
      listEl.appendChild(row);
    });
    const active = listEl.querySelector('.cp-item.is-active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function activate(idx) {
    const item = items[idx];
    if (item && typeof item.run === 'function') item.run();
  }

  function openPalette() {
    if (modal) return;
    query = '';
    activeIndex = 0;
    inputEl = App.h('input', { class: 'cp-input', type: 'search', placeholder: 'Search features and commands…', autocomplete: 'off' });
    listEl = App.h('div', { class: 'cp-list', role: 'listbox' });
    modal = App.h('div', { class: 'modal-backdrop', onclick: e => { if (e.target === modal) closePalette(); } },
      App.h('div', { class: 'modal cp-modal', role: 'dialog', 'aria-label': 'Command palette' },
        App.h('div', { class: 'cp-head' }, inputEl),
        listEl
      )
    );
    inputEl.addEventListener('input', () => { query = inputEl.value; activeIndex = 0; renderList(); });
    inputEl.addEventListener('keydown', onPaletteKey);
    document.body.appendChild(modal);
    renderList();
    setTimeout(() => inputEl && inputEl.focus(), 0);
  }

  function closePalette() {
    if (!modal) return;
    modal.remove();
    modal = null;
    listEl = null;
    inputEl = null;
  }

  function onPaletteKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closePalette(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      activeIndex = (activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      renderList();
      return;
    }
    if (e.key === 'Enter') { e.preventDefault(); activate(activeIndex); }
  }

  function getTourFeatures() {
    const feats = App.getFeatures().filter(f => f.id !== ID && f.id !== 'export-hub');
    return feats.length ? feats : App.getFeatures();
  }

  function stopTour(message) {
    clearTimeout(tour.timer);
    tour.timer = null;
    tour.running = false;
    if (tour.control) tour.control.remove();
    tour.control = null;
    if (message) App.toast(message);
  }

  function renderTourControl() {
    if (!tour.control) {
      tour.control = App.h('div', { class: 'cp-tour' });
      document.body.appendChild(tour.control);
    }
    tour.control.innerHTML = '';
    tour.control.appendChild(App.h('span', { class: 'cp-tour-label' }, `Tour ${Math.min(tour.index + 1, tour.features.length)}/${tour.features.length}`));
    tour.control.appendChild(App.h('span', { class: 'btn primary', onclick: () => showTourStep(true) }, 'Next'));
    tour.control.appendChild(App.h('span', { class: 'btn ghost', onclick: () => stopTour('Tour stopped') }, 'Stop'));
  }

  function showTourStep(manual) {
    if (!tour.running) return;
    clearTimeout(tour.timer);
    if (manual) {
      if (tour.index >= tour.features.length - 1) { stopTour('Tour complete'); return; }
      tour.index++;
    }
    const f = tour.features[tour.index];
    if (!f) { stopTour('Tour complete'); return; }
    App.bus.emit('nav:go', { id: f.id });
    App.toast(`${f.title}: ${f.subtitle || 'Explore this Atelier feature'}`);
    renderTourControl();
    tour.timer = setTimeout(() => {
      tour.index++;
      if (tour.index >= tour.features.length) stopTour('Tour complete');
      else showTourStep(false);
    }, 2200);
  }

  function startTour() {
    stopTour();
    tour.features = getTourFeatures();
    if (!tour.features.length) { App.toast('No features to tour', 'warn'); return; }
    tour.running = true;
    tour.index = 0;
    showTourStep(false);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal) { e.preventDefault(); closePalette(); return; }
    const isK = String(e.key || '').toLowerCase() === 'k';
    if (!isK || !(e.metaKey || e.ctrlKey) || e.altKey) return;
    e.preventDefault();
    openPalette();
  });

  App.registerFeature({
    id: ID,
    title: 'Help & Palette',
    icon: '⌘',
    order: 200,
    subtitle: 'Jump to any panel. Run quick actions. Take the tour.',
    mount(el, ctx) {
      const { h } = ctx;
      featureCtx = ctx;
      const shortcut = shortcutLabel();

      function render() {
        const feats = App.getFeatures();
        el.innerHTML = '';
        el.appendChild(h('div', { class: 'stack' },
          h('div', { class: 'card' },
            h('h4', {}, h('span', { class: 'accent' }, '⌘'), 'Command center'),
            h('p', { class: 'muted' }, 'Open the command palette from anywhere, jump between panels, toggle Simple or Expert mode, request a random theme, or take the tour.'),
            h('div', { class: 'btn-row', style: { marginTop: '12px' } },
              h('span', { class: 'btn primary', onclick: openPalette }, 'Open command palette'),
              h('span', { class: 'btn', onclick: openOnboardingTour }, 'Take the tour'),
              h('span', { class: 'btn', onclick: () => { const next = currentMode() === 'expert' ? 'novice' : 'expert'; setAtelierMode(next); render(); } }, currentMode() === 'expert' ? 'Switch to Simple' : 'Switch to Expert')
            )
          ),
          h('div', { class: 'grid c2' },
            h('div', { class: 'card' },
              h('h4', {}, h('span', { class: 'accent' }, '⌨'), 'Keyboard shortcuts'),
              h('div', { class: 'cp-help-list' },
                h('div', { class: 'cp-help-row' }, h('span', { class: 'kbd' }, shortcut), h('span', {}, 'Open the command palette from anywhere.')),
                h('div', { class: 'cp-help-row' }, h('span', { class: 'kbd' }, '1–9'), h('span', {}, 'Jump to panels 1–9.')),
                h('div', { class: 'cp-help-row' }, h('span', { class: 'kbd' }, '['), h('span', {}, 'Previous panel.')),
                h('div', { class: 'cp-help-row' }, h('span', { class: 'kbd' }, ']'), h('span', {}, 'Next panel.')),
                h('div', { class: 'cp-help-row' }, h('span', { class: 'kbd' }, 'Esc'), h('span', {}, 'Close the command palette.'))
              )
            ),
            h('div', { class: 'card' },
              h('h4', {}, h('span', { class: 'accent' }, '?'), 'Palette tips'),
              h('p', { class: 'muted' }, 'Type to filter. ↑↓ to move. Enter to run. Esc or click outside to close.')
            )
          ),
          h('div', { class: 'card' },
            h('h4', {}, h('span', { class: 'accent' }, '◐'), 'Simple vs Expert'),
            h('p', { class: 'muted' }, 'Simple shows the ' + App.CORE_FEATURES.length + ' core panels and safe defaults. Expert shows all ' + App.getFeatures().length + ' panels and advanced controls. The live preview stays docked on the right in both modes. Use the mode toggle here, in the titlebar, or from the palette.')
          ),
          h('div', { class: 'card' },
            h('h4', {}, h('span', { class: 'accent' }, '✦'), 'Feature guide'),
            h('div', { class: 'cp-feature-grid' }, feats.map(f => h('div', { class: 'cp-feature' },
              h('span', { class: 'cp-ico' }, f.icon || '•'),
              h('span', {}, h('div', { class: 'cp-title' }, f.title || f.id), h('div', { class: 'cp-sub' }, f.subtitle || 'Atelier feature panel'))
            )))
          )
        ));
      }

      render();
      ctx.bus.on('feature:registered', render);
      ctx.bus.on('mode:changed', render);
    }
  });
})();
