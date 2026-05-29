/* Pane Layout Designer — tmux/Ghostty split tree builder; reads/writes state.layout. */
(function () {
  App.injectCSS('layout-designer', `
    .ld-shell{display:grid;grid-template-columns:310px 1fr;gap:16px}
    .ld-canvas{min-height:360px;height:52vh;padding:12px;background:var(--crust);border:1px solid var(--surface0);border-radius:var(--radius);overflow:hidden}
    .ld-canvas>.ld-node,.ld-canvas>.ld-pane{width:100%;height:100%}
    .ld-node{min-width:0;min-height:0;display:flex;gap:8px}
    .ld-node.ld-h{flex-direction:row}.ld-node.ld-v{flex-direction:column}
    .ld-pane{position:relative;display:flex;align-items:center;justify-content:center;min-width:58px;min-height:48px;border:1px solid var(--surface1);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--surface0) 46%,var(--base));color:var(--subtext1);cursor:pointer;overflow:hidden;transition:all var(--speed)}
    .ld-pane:hover{border-color:var(--overlay1);background:color-mix(in srgb,var(--surface0) 62%,var(--base));color:var(--text)}
    .ld-pane.ld-active{border-color:var(--accent);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 65%,transparent);background:color-mix(in srgb,var(--accent) 12%,var(--base));color:var(--text)}
    .ld-pane-label{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;font-weight:700}
    .ld-pane-label small{font-size:10px;color:var(--overlay1);font-weight:500}
    .ld-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
    .ld-note{font-size:11px;line-height:1.5;color:var(--overlay1)}
    .ld-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .ld-code-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
    .ld-code{min-height:180px}
    @media(max-width:980px){.ld-shell{grid-template-columns:1fr}.ld-canvas{height:420px}}
  `);

  const COMMANDS = ['zsh', 'nvim', 'htop', 'logs'];
  let nextPaneId = 1;

  function pane(cmd) { return { id: 'p' + nextPaneId++, type: 'pane', cmd: cmd || 'zsh' }; }
  function split(dir, ratio, a, b) { return { type: 'split', dir, ratio, a, b }; }
  function clone(node) { return JSON.parse(JSON.stringify(node)); }
  function isPane(node) { return node && node.type === 'pane'; }
  function isSplit(node) { return node && node.type === 'split'; }
  function clampRatio(v) { return Math.max(0.1, Math.min(0.9, Number(v) || 0.5)); }
  function normalize(node) {
    if (isPane(node)) return { id: node.id || pane(node.cmd).id, type: 'pane', cmd: node.cmd || 'zsh' };
    if (isSplit(node)) return { type: 'split', dir: node.dir === 'v' ? 'v' : 'h', ratio: clampRatio(node.ratio), a: normalize(node.a), b: normalize(node.b) };
    return pane('zsh');
  }
  function ensureLayout(layout) { return normalize(layout); }

  function eachPane(node, fn) {
    if (isPane(node)) { fn(node); return; }
    if (isSplit(node)) { eachPane(node.a, fn); eachPane(node.b, fn); }
  }
  function firstPaneId(node) {
    if (isPane(node)) return node.id;
    return isSplit(node) ? firstPaneId(node.a) : null;
  }
  function countPanes(node) {
    let n = 0;
    eachPane(node, () => n++);
    return n;
  }
  function renumberIds(node) {
    eachPane(node, p => {
      const n = parseInt(String(p.id || '').replace(/\D/g, ''), 10);
      if (n >= nextPaneId) nextPaneId = n + 1;
    });
  }
  function paneNumberMap(node) {
    const map = new Map();
    let n = 1;
    eachPane(node, p => map.set(p.id, n++));
    return map;
  }
  function findPane(node, id) {
    if (isPane(node)) return node.id === id ? node : null;
    if (!isSplit(node)) return null;
    return findPane(node.a, id) || findPane(node.b, id);
  }
  function findParentSplit(node, id, parent) {
    if (isPane(node)) return node.id === id ? parent : null;
    if (!isSplit(node)) return null;
    return findParentSplit(node.a, id, node) || findParentSplit(node.b, id, node);
  }
  function updatePane(node, id, updater) {
    if (isPane(node)) return node.id === id ? updater(Object.assign({}, node)) : node;
    if (!isSplit(node)) return node;
    return Object.assign({}, node, { a: updatePane(node.a, id, updater), b: updatePane(node.b, id, updater) });
  }
  function replacePaneWithSplit(node, id, dir) {
    if (isPane(node)) return node.id === id ? split(dir, 0.5, Object.assign({}, node), pane(node.cmd)) : node;
    if (!isSplit(node)) return node;
    return Object.assign({}, node, { a: replacePaneWithSplit(node.a, id, dir), b: replacePaneWithSplit(node.b, id, dir) });
  }
  function removePane(node, id) {
    if (isPane(node)) return node.id === id ? null : node;
    if (!isSplit(node)) return node;
    const a = removePane(node.a, id);
    const b = removePane(node.b, id);
    if (!a) return b;
    if (!b) return a;
    return Object.assign({}, node, { a, b });
  }
  function updateFocusedSplit(node, id, ratio) {
    const parent = findParentSplit(node, id, null);
    if (!parent) return node;
    function walk(n) {
      if (n === parent) return Object.assign({}, n, { ratio: clampRatio(ratio) });
      if (!isSplit(n)) return n;
      return Object.assign({}, n, { a: walk(n.a), b: walk(n.b) });
    }
    return walk(node);
  }

  const PRESETS = {
    single: () => pane('zsh'),
    columns: () => split('h', 0.5, pane('zsh'), pane('logs')),
    rows: () => split('v', 0.5, pane('zsh'), pane('logs')),
    mainStack: () => split('h', 0.62, pane('nvim'), split('v', 0.5, pane('zsh'), pane('htop'))),
    grid: () => split('v', 0.5, split('h', 0.5, pane('zsh'), pane('nvim')), split('h', 0.5, pane('htop'), pane('logs'))),
    ide: () => split('h', 0.18, pane('logs'), split('v', 0.72, pane('nvim'), pane('zsh')))
  };

  function shellQuote(text) {
    return "'" + String(text || '').replace(/'/g, "'\\''") + "'";
  }
  function exportTmux(root) {
    const paneNums = paneNumberMap(root);
    const lines = ['# tmux layout generated by Atelier Layout Designer', '# Start in a fresh window with one pane.'];
    let target = 0;
    function build(node, current) {
      if (isPane(node)) {
        const cmd = node.cmd || 'zsh';
        lines.push(`select-pane -t ${current}`);
        lines.push(`# pane ${paneNums.get(node.id)}: ${cmd}`);
        lines.push(`send-keys -t ${current} ${shellQuote(cmd)} C-m`);
        return current;
      }
      if (!isSplit(node)) return current;
      const newTarget = ++target;
      const flag = node.dir === 'h' ? '-h' : '-v';
      const pct = Math.round((1 - clampRatio(node.ratio)) * 100);
      lines.push(`select-pane -t ${current}`);
      lines.push(`split-window ${flag} -p ${pct}`);
      build(node.a, current);
      build(node.b, newTarget);
      return current;
    }
    build(root, 0);
    lines.push('', '# Ghostty note:', '# Bind equivalent actions with new_split:right and new_split:down, then focus panes to mirror the tree.');
    lines.push('# Example: keybind = cmd+shift+right=new_split:right');
    lines.push('#          keybind = cmd+shift+down=new_split:down');
    return lines.join('\n');
  }

  App.registerFeature({
    id: 'layout-designer', title: 'Layout Designer', icon: '田', order: 95,
    subtitle: 'Design your split layout visually. Then get the tmux commands to build it.',
    mount(el, ctx) {
      const { h, get, set, subscribe, copy, download } = ctx;
      let activeId = null;

      const presetRow = h('div', { class: 'ld-presets' },
        h('span', { class: 'btn preset', onclick: () => applyPreset('single') }, 'Single'),
        h('span', { class: 'btn preset', onclick: () => applyPreset('columns') }, 'Two columns'),
        h('span', { class: 'btn preset', onclick: () => applyPreset('rows') }, 'Two rows'),
        h('span', { class: 'btn preset', onclick: () => applyPreset('mainStack') }, 'Main + stack'),
        h('span', { class: 'btn preset', onclick: () => applyPreset('grid') }, 'Grid 2×2'),
        h('span', { class: 'btn preset', onclick: () => applyPreset('ide') }, 'IDE'));

      const splitHBtn = h('span', { class: 'btn', onclick: () => splitActive('h') }, 'Split →');
      const splitVBtn = h('span', { class: 'btn', onclick: () => splitActive('v') }, 'Split ↓');
      const closeBtn = h('span', { class: 'btn ghost', onclick: closeActive }, 'Close pane');
      const cmdSelect = h('select', { onchange: () => setCmd(cmdSelect.value) }, COMMANDS.map(c => h('option', { value: c }, c)));
      const ratioVal = h('span', { class: 'val tnum' }, '—');
      const ratioInput = h('input', { type: 'range', min: 10, max: 90, step: 1, oninput: () => setRatio(ratioInput.value / 100) });
      const ratioField = h('label', { class: 'field' }, h('span', { class: 'row' }, h('span', {}, 'focused split ratio'), ratioVal), ratioInput);

      const canvas = h('div', { class: 'ld-canvas' });
      const codeBox = h('pre', { class: 'codeblock ld-code tnum' });
      const copyBtn = h('span', { class: 'btn', onclick: () => copy(codeBox.textContent) }, 'Copy');
      const dlBtn = h('span', { class: 'btn', onclick: () => download('atelier-layout.tmux', codeBox.textContent) }, 'Download');

      el.appendChild(h('div', { class: 'ld-shell' },
        h('div', { class: 'stack' },
          h('div', { class: 'card stack' }, h('h4', {}, h('span', { class: 'accent' }, '▣'), 'Controls'),
            h('div', { class: 'ld-actions' }, splitHBtn, splitVBtn, closeBtn),
            h('label', { class: 'field' }, 'focused pane command', cmdSelect),
            ratioField,
            h('p', { class: 'ld-note' }, 'Click any pane to focus it. Split creates a sibling; close keeps the final pane safe.')),
          h('div', { class: 'card stack' }, h('h4', {}, h('span', { class: 'accent' }, '◆'), 'Presets'), presetRow)),
        h('div', { class: 'stack' },
          h('div', { class: 'stage' }, canvas, h('div', { class: 'stage-foot' }, '→ horizontal · ↓ vertical')),
          h('div', { class: 'card stack' }, h('h4', {}, h('span', { class: 'accent' }, '$'), 'Export'), codeBox, h('div', { class: 'ld-code-actions' }, copyBtn, dlBtn)))));

      function currentLayout() { return ensureLayout(get('layout')); }
      function saveLayout(tree) { set('layout', tree); }
      function ensureActive(root) {
        if (!activeId || !findPane(root, activeId)) activeId = firstPaneId(root);
      }
      function applyPreset(key) {
        nextPaneId = 1;
        const tree = PRESETS[key] ? PRESETS[key]() : pane('zsh');
        activeId = firstPaneId(tree);
        saveLayout(tree);
      }
      function splitActive(dir) {
        const root = clone(currentLayout());
        ensureActive(root);
        saveLayout(replacePaneWithSplit(root, activeId, dir));
      }
      function closeActive() {
        const root = clone(currentLayout());
        ensureActive(root);
        if (countPanes(root) <= 1) { saveLayout(root); return; }
        const next = removePane(root, activeId) || pane('zsh');
        activeId = firstPaneId(next);
        saveLayout(next);
      }
      function setCmd(cmd) {
        const root = clone(currentLayout());
        ensureActive(root);
        saveLayout(updatePane(root, activeId, p => Object.assign(p, { cmd })));
      }
      function setRatio(ratio) {
        const root = clone(currentLayout());
        ensureActive(root);
        saveLayout(updateFocusedSplit(root, activeId, ratio));
      }
      function renderNode(node, nums) {
        if (isPane(node)) {
          return h('div', { class: 'ld-pane' + (node.id === activeId ? ' ld-active' : ''), onclick: () => { activeId = node.id; render(); } },
            h('div', { class: 'ld-pane-label' }, h('span', { class: 'tnum' }, `${nums.get(node.id)}: ${node.cmd || 'zsh'}`), h('small', { class: 'tnum' }, node.id)));
        }
        const ratio = clampRatio(node.ratio) * 100;
        const wrap = h('div', { class: 'ld-node ld-' + node.dir });
        const a = renderNode(node.a, nums);
        const b = renderNode(node.b, nums);
        a.style.flex = `0 0 calc(${ratio}% - 4px)`;
        b.style.flex = `1 1 calc(${100 - ratio}% - 4px)`;
        wrap.appendChild(a); wrap.appendChild(b);
        return wrap;
      }
      function render() {
        const root = currentLayout();
        renumberIds(root);
        if (get('layout') == null) saveLayout(root);
        ensureActive(root);
        const focused = findPane(root, activeId);
        const parent = findParentSplit(root, activeId, null);

        canvas.innerHTML = '';
        canvas.appendChild(renderNode(root, paneNumberMap(root)));
        cmdSelect.value = focused && focused.cmd ? focused.cmd : 'zsh';
        closeBtn.setAttribute('disabled', countPanes(root) <= 1 ? 'true' : '');
        if (countPanes(root) > 1) closeBtn.removeAttribute('disabled');
        ratioInput.disabled = !parent;
        ratioInput.value = parent ? Math.round(clampRatio(parent.ratio) * 100) : 50;
        ratioVal.textContent = parent ? Math.round(clampRatio(parent.ratio) * 100) + '%' : '—';
        ratioInput.style.setProperty('--fill', parent ? ratioInput.value + '%' : '50%');
        codeBox.textContent = exportTmux(root);
      }

      subscribe('layout', render);
      render();
    }
  });
})();
