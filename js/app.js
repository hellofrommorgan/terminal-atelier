/* ============================================================================
   ATELIER shell — builds chrome, the mode-aware nav, mounts panels lazily,
   and runs the first-run onboarding walkthrough.
   Runs after core.js + all feature modules have registered.

   Navigation events on App.bus:
     emit 'nav:go' {id}        -> switch to a feature (auto-unlocks Expert if needed)
     on   'feature:shown' {id} -> fired after a panel becomes visible
     on   'mode:changed' m     -> re-render nav, redirect if active panel is hidden
   ============================================================================ */
(function () {
  const mounted = {};   // id -> true once its panel body is built
  let activeId = null;
  const h = App.h;

  function visible() { return App.getVisibleFeatures(); }
  function isVisible(id) { return visible().some(f => f.id === id); }

  function build() {
    const main = document.getElementById('main');

    // one panel per registered feature (mounted lazily, shown by .active)
    App.getFeatures().forEach(f => {
      main.appendChild(h('section', { class: 'feature-panel', 'data-id': f.id }));
    });

    renderNav();
    wireModeToggle();
    mountPreviewDock();
    wireDockCollapse();

    // keyboard: 1-9 jump (visible set), [ ] cycle (visible set)
    document.addEventListener('keydown', (e) => {
      // undo / redo work even while typing in inputs (standard editor behavior)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) { if (App.redo()) e.preventDefault(); }
        else { if (App.undo()) e.preventDefault(); }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || e.key === 'Y')) {
        if (App.redo()) e.preventDefault(); return;
      }
      if (e.target.matches('input,textarea,select,[contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const feats = visible();
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9 && feats[n - 1]) { go(feats[n - 1].id); e.preventDefault(); }
      if (e.key === '[' || e.key === ']') {
        const idx = feats.findIndex(f => f.id === activeId);
        const next = (idx + (e.key === ']' ? 1 : -1) + feats.length) % feats.length;
        if (feats[next]) { go(feats[next].id); e.preventDefault(); }
      }
    });

    App.bus.on('nav:go', (d) => go(d && d.id));
    App.bus.on('mode:changed', onModeChanged);

    // initial route: last feature if still visible, else first visible.
    // (clear a stale id — e.g. a previously-saved panel that no longer exists)
    let last = App.get('ui.lastFeature');
    if (last && !App.getFeatures().some(f => f.id === last)) { App.set('ui.lastFeature', null); last = null; }
    const start = (last && isVisible(last)) ? last : (visible()[0] && visible()[0].id);
    if (start) go(start);

    startClock();
    wireSaveIndicator();
    wireHistory();
    maybeOnboard();
  }

  /* ---- navigation --------------------------------------------------------- */
  function renderNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = '';
    nav.appendChild(h('div', { class: 'nav-head' }, 'configure'));

    const feats = visible();
    feats.forEach((f, i) => {
      nav.appendChild(h('div', {
        class: 'nav-item' + (f.id === activeId ? ' active' : ''), 'data-id': f.id,
        onclick: () => go(f.id)
      },
        h('span', { class: 'ico' }, f.icon || '•'),
        h('span', { class: 'label' }, f.title),
        i < 9 ? h('span', { class: 'num' }, String(i + 1)) : null
      ));
    });

    // novice affordance: how many tools are tucked away in Expert
    if (App.getMode() === 'novice') {
      const hidden = App.getFeatures().length - feats.length;
      if (hidden > 0) {
        nav.appendChild(h('div', {
          class: 'nav-more', onclick: () => App.setMode('expert')
        },
          h('span', { class: 'ico' }, '+'),
          h('span', {}, hidden + ' more in Expert')
        ));
      }
    }
  }

  function onModeChanged() {
    renderNav();
    if (activeId && !isVisible(activeId)) {
      const first = visible()[0];
      if (first) go(first.id);
    }
  }

  function go(id) {
    const f = App.getFeatures().find(x => x.id === id);
    if (!f) return;
    // deep-link / palette jump to an Expert-only tool while in novice: unlock it
    if (!isVisible(id)) { App.setMode('expert'); App.toast('Expert mode unlocked'); }

    activeId = id;
    App.set('ui.lastFeature', id);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.id === id));
    document.querySelectorAll('.feature-panel').forEach(p => p.classList.toggle('active', p.dataset.id === id));

    const panel = document.querySelector(`.feature-panel[data-id="${id}"]`);
    if (panel && !mounted[id]) {
      mounted[id] = true;
      try {
        panel.appendChild(h('h2', { class: 'pg-title' }, h('span', { class: 'ico' }, f.icon || '•'), f.title));
        if (f.subtitle) panel.appendChild(h('div', { class: 'pg-sub' }, f.subtitle));
        const body = h('div', { class: 'feature-body' });
        panel.appendChild(body);
        App.withSeed(() => f.mount(body, App.ctx()));
      } catch (err) {
        console.error('mount failed', id, err);
        panel.appendChild(h('div', { class: 'codeblock' }, 'mount error: ' + err.message));
      }
    }
    App.bus.emit('feature:shown', { id });
  }

  /* ---- persistent live-preview dock -------------------------------------- */
  function mountPreviewDock() {
    const host = document.getElementById('preview-dock-body');
    if (host && App.mountLivePreview) App.mountLivePreview(host, App.ctx());
  }

  function setDockCollapsed(collapsed) {
    document.body.classList.toggle('dock-collapsed', collapsed);
    App.set('ui.dockCollapsed', collapsed);
  }
  function wireDockCollapse() {
    const btn = document.getElementById('pd-collapse');
    const reopen = document.getElementById('pd-reopen');
    document.body.classList.toggle('dock-collapsed', !!App.get('ui.dockCollapsed'));
    if (btn) btn.addEventListener('click', () => setDockCollapsed(true));
    if (reopen) reopen.addEventListener('click', () => setDockCollapsed(false));
  }

  /* ---- mode toggle (titlebar) -------------------------------------------- */
  function wireModeToggle() {
    const seg = document.getElementById('mode-seg');
    if (!seg) return;
    const paint = () => {
      const m = App.getMode();
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
    };
    seg.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => App.setMode(b.dataset.mode));
    });
    App.bus.on('mode:changed', paint);
    paint();
  }

  /* ---- first-run onboarding ---------------------------------------------- */
  function maybeOnboard() {
    if (!App.isFirstRun()) return;
    if (App.get('ui.onboarded')) return;
    openOnboarding();
  }

  function openOnboarding() {
    let chosen = null;
    const back = h('div', { class: 'onb-backdrop' });

    const previewLine = h('div', { class: 'onb-preview preview-surface' }, 'atelier ~ the dev environment you deserve');

    const presetGrid = h('div', { class: 'qs-grid' });
    App.PRESETS.forEach(p => {
      const c = p.state.theme.colors || {};
      const swatches = h('div', { class: 'qs-swatches' },
        ['accent', 'base', 'text', 'green', 'peach', 'blue'].map(k =>
          h('i', { style: { background: c[k] || 'var(--' + k + ')' } })));
      const card = h('div', { class: 'qs-card', 'data-id': p.id, onclick: () => {
        chosen = p.id;
        App.applyPreset(p);
        presetGrid.querySelectorAll('.qs-card').forEach(x => x.classList.toggle('sel', x.dataset.id === p.id));
        startBtn.textContent = 'Start with ' + p.name.split(' · ')[0];
      } },
        h('div', { class: 'qs-name' }, p.name),
        h('div', { class: 'qs-blurb' }, p.blurb),
        swatches
      );
      presetGrid.appendChild(card);
    });

    const modeRow = h('div', { class: 'onb-modes' },
      modeCard('novice', '◐  Keep it simple', 'A focused set of essentials and great presets. Unlock everything anytime.'),
      modeCard('expert', '◆  Expert', 'Every knob, axis, and config surface — all ' + App.getFeatures().length + ' tools.')
    );
    function modeCard(m, title, desc) {
      return h('div', { class: 'onb-mode' + (App.getMode() === m ? ' sel' : ''), 'data-mode': m, onclick: () => {
        App.setMode(m);
        modeRow.querySelectorAll('.onb-mode').forEach(x => x.classList.toggle('sel', x.dataset.mode === m));
      } }, h('div', { class: 'onb-mode-t' }, title), h('div', { class: 'onb-mode-d' }, desc));
    }

    const startBtn = h('button', { class: 'btn primary onb-start', onclick: finish }, 'Start forging');
    function finish() { App.markOnboarded(); back.style.opacity = '0'; setTimeout(() => back.remove(), 200); }

    const modal = h('div', { class: 'onb' },
      h('div', { class: 'onb-head' },
        h('div', { class: 'onb-glyph' }, '◆'),
        h('div', {},
          h('div', { class: 'onb-title' }, 'Welcome to Atelier'),
          h('div', { class: 'onb-sub' }, 'Shape your terminal — fonts, color, prompt, panes — and watch it change live.'))
      ),
      h('div', { class: 'onb-stage' }, previewLine),
      h('div', { class: 'onb-sec-h' }, h('span', { class: 'n' }, '1'), 'Pick a starting point'),
      presetGrid,
      h('div', { class: 'onb-sec-h' }, h('span', { class: 'n' }, '2'), 'How much control do you want?'),
      modeRow,
      h('div', { class: 'onb-foot' },
        h('span', { class: 'onb-skip', onclick: finish }, 'Skip — I\'ll explore'),
        startBtn)
    );
    back.appendChild(modal);
    back.addEventListener('click', e => { if (e.target === back) finish(); });
    document.body.appendChild(back);
  }

  // expose so Help/command-palette can relaunch the tour
  App.openOnboarding = openOnboarding;

  /* ---- status bar -------------------------------------------------------- */
  function startClock() {
    const el = document.getElementById('sb-clock');
    if (!el) return;
    const tick = () => { const d = new Date();
      el.textContent = ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' '; };
    tick(); setInterval(tick, 15000);
  }
  function wireSaveIndicator() {
    const el = document.getElementById('sb-save');
    if (!el) return;
    App.bus.on('saved', () => { el.textContent = ' ✓ saved '; el.style.opacity = '1';
      clearTimeout(el._t); el._t = setTimeout(() => el.style.opacity = '.35', 1200); });
  }

  function wireHistory() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    const diff = document.getElementById('sb-diff');
    if (undoBtn) undoBtn.addEventListener('click', () => App.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => App.redo());
    if (diff) diff.addEventListener('click', () => {
      const d = App.diffFromDefaults();
      if (!d.count) return;
      if (confirm('Reset all ' + d.count + ' customization' + (d.count === 1 ? '' : 's') + ' back to defaults?'))
        App.resetState();
    });
    function paint() {
      if (undoBtn) undoBtn.disabled = !App.canUndo();
      if (redoBtn) redoBtn.disabled = !App.canRedo();
      if (diff) {
        const d = App.diffFromDefaults();
        if (d.count) {
          diff.style.display = '';
          diff.textContent = ' ● ' + d.count + ' edit' + (d.count === 1 ? '' : 's') + ' ';
          diff.title = 'Changed from defaults: ' + d.items.map(i => i.label).join(', ') + ' — click to reset';
        } else {
          diff.style.display = 'none';
        }
      }
    }
    App.bus.on('history:changed', paint);
    App.subscribe('', paint);
    paint();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
