/* tmux Status Bar Designer — compose Catppuccin tmux status-left/right. */
(function () {
  const TYPES = {
    session: { label: 'session', icon: '▰', fg: 'crust', bg: 'mauve', text: '#S' },
    window_list: { label: 'window list', icon: '◫', fg: 'text', bg: 'surface0', text: '#I:#W' },
    directory: { label: 'directory', icon: '⌂', fg: 'crust', bg: 'blue', text: '#{pane_current_path}' },
    host: { label: 'host', icon: '⬢', fg: 'crust', bg: 'green', text: '#H' },
    user: { label: 'user', icon: '●', fg: 'crust', bg: 'teal', text: '#(whoami)' },
    time: { label: 'time', icon: '◷', fg: 'crust', bg: 'peach', text: '%H:%M' },
    date: { label: 'date', icon: '◫', fg: 'crust', bg: 'yellow', text: '%Y-%m-%d' },
    battery: { label: 'battery', icon: '▣', fg: 'crust', bg: 'green', text: '#{battery_percentage}' },
    pane_info: { label: 'pane info', icon: '□', fg: 'text', bg: 'surface1', text: '#{pane_index}:#{pane_title}' },
    git_branch: { label: 'git branch', icon: '⎇', fg: 'crust', bg: 'pink', text: '#(git branch --show-current 2>/dev/null)' },
    cpu: { label: 'cpu', icon: '◍', fg: 'crust', bg: 'red', text: '#{cpu_percentage}' },
    prefix_indicator: { label: 'prefix', icon: '⌘', fg: 'crust', bg: 'lavender', text: '#{?client_prefix,PREFIX,}' }
  };
  const PALETTE = ['crust', 'mantle', 'base', 'surface0', 'surface1', 'surface2', 'overlay0', 'overlay1', 'overlay2', 'subtext0', 'subtext1', 'text', 'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender', 'accent'];
  const DEFAULTS = {
    left: [{ type: 'session' }],
    right: [{ type: 'directory' }, { type: 'host' }, { type: 'time' }]
  };
  const SEP_LEFT = '';
  const SEP_RIGHT = '';
  // Preview-only glyphs render without a Nerd Font; the tmux.conf export keeps the real powerline chars.
  const PREV_SEP_LEFT = '▶';
  const PREV_SEP_RIGHT = '◀';

  function uid() { return 'tx-' + Math.random().toString(36).slice(2, 9); }
  function segment(type) {
    const d = TYPES[type] || TYPES.session;
    return { id: uid(), type, fg: d.fg, bg: d.bg, icon: d.icon };
  }
  function normalizeSide(side) { return (side || []).map(s => Object.assign(segment(s.type || 'session'), s)); }
  function labelFor(seg) { return (TYPES[seg.type] || TYPES.session).label; }

  App.injectCSS('tmux-status', `
    .tx-layout{grid-template-columns:320px 1fr}.tx-palette{display:grid;grid-template-columns:1fr 1fr;gap:7px}.tx-type{justify-content:space-between}.tx-lists{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tx-list{display:flex;flex-direction:column;gap:8px;min-height:80px}.tx-seg{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;background:color-mix(in srgb,var(--surface0) 42%,transparent);border:1px solid var(--surface0);border-radius:var(--radius-sm);padding:9px}.tx-seg-title{font-weight:700;color:var(--text);display:flex;gap:8px;align-items:center}.tx-controls{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.tx-swatches{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:8px}.tx-role{display:grid;grid-template-columns:18px 1fr;gap:7px;align-items:center}.tx-role-chip{width:18px;height:18px;border-radius:5px;border:1px solid color-mix(in srgb,var(--text) 20%,transparent);box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)}.tx-preview{padding:16px}.tx-bar{height:32px;display:flex;align-items:stretch;width:100%;overflow:hidden;border-radius:6px;background:var(--mantle);box-shadow:inset 0 0 0 1px var(--crust);font-family:var(--mono);font-size:12px;line-height:32px;white-space:nowrap}.tx-side{display:flex;align-items:stretch}.tx-mid{flex:1;min-width:80px;display:flex;align-items:center;justify-content:center;color:var(--overlay1);background:var(--mantle);padding:0 12px;overflow:hidden}.tx-piece,.tx-sep{height:32px;display:inline-flex;align-items:center}.tx-piece{gap:7px;padding:0 10px;font-weight:700}.tx-sep{font-size:20px;width:15px;justify-content:center}.tx-windows{display:flex;gap:0;align-items:center;height:22px;overflow:hidden;border-radius:4px}.tx-win{padding:3px 9px;background:var(--surface0);color:var(--subtext1)}.tx-win.on{background:var(--mauve);color:var(--crust);font-weight:800}.tx-actions{display:flex;gap:8px;justify-content:flex-end}.tx-empty{color:var(--overlay0);font-size:11px;border:1px dashed var(--surface1);border-radius:var(--radius-sm);padding:10px;text-align:center}.tx-mini{font-size:10px;color:var(--overlay1);margin-top:3px}.tx-icon{opacity:.9}@media(max-width:980px){.tx-lists{grid-template-columns:1fr}.tx-layout{grid-template-columns:1fr}}`);

  App.registerFeature({
    id: 'tmux-status', title: 'tmux Status Bar', icon: '▰', order: 50,
    subtitle: 'Compose your tmux status bar — segments, colors, separators — then copy a working tmux.conf.',
    mount(el, ctx) {
      const { h, get, set, subscribe, bus, copy, download } = ctx;
      const rootStyle = () => getComputedStyle(document.documentElement);
      const hex = role => (rootStyle().getPropertyValue('--' + role).trim() || '#cdd6f4');
      const cssColor = role => 'var(--' + role + ')';
      const tmux = () => get('tmux') || { left: [], right: [] };

      function seedIfEmpty() {
        const v = tmux();
        if (!v.left?.length && !v.right?.length) set('tmux', {
          left: DEFAULTS.left.map(s => segment(s.type)),
          right: DEFAULTS.right.map(s => segment(s.type))
        });
      }
      seedIfEmpty();

      const palette = h('div', { class: 'tx-palette' });
      Object.keys(TYPES).forEach(type => {
        const d = TYPES[type];
        palette.appendChild(h('div', { class: 'btn tx-type', title: 'Add ' + d.label },
          h('span', {}, d.icon + ' ' + d.label),
          h('span', { class: 'row-flex' },
            h('span', { class: 'kbd', onclick: e => { e.stopPropagation(); add(type, 'left'); } }, 'left'),
            h('span', { class: 'kbd', onclick: e => { e.stopPropagation(); add(type, 'right'); } }, 'right'))));
      });

      const leftList = h('div', { class: 'tx-list' });
      const rightList = h('div', { class: 'tx-list' });
      const previewBody = h('div', { class: 'stage-body preview-surface tx-preview' });
      const codeBox = h('pre', { class: 'codeblock tnum' });
      const copyBtn = h('span', { class: 'btn primary', onclick: () => copy(exportConf()) }, 'Copy');
      const dlBtn = h('span', { class: 'btn', onclick: () => download('tmux.conf', exportConf()) }, 'Download');

      const leftColumn = h('div', { class: 'stack' },
        h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '+'), 'Segment palette'), palette),
        h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '↕'), 'Status lists'),
          h('div', { class: 'tx-lists' },
            h('div', {}, h('div', { class: 'muted' }, 'status-left'), leftList),
            h('div', {}, h('div', { class: 'muted' }, 'status-right'), rightList))));
      const rightColumn = h('div', { class: 'stack' },
        h('div', { class: 'stage' }, previewBody, h('div', { class: 'stage-foot' }, 'live Catppuccin tmux preview')),
        h('div', { class: 'card stack grow' }, h('h4', {}, h('span', { class: 'accent' }, '$'), 'tmux.conf export'), h('div', { class: 'tx-actions' }, copyBtn, dlBtn), codeBox));
      el.classList.add('fill');
      el.appendChild(h('div', { class: 'split tx-layout' }, leftColumn, rightColumn));

      function commit(next) { set('tmux', { left: normalizeSide(next.left), right: normalizeSide(next.right) }); }
      function add(type, side) { const v = tmux(); const next = { left: normalizeSide(v.left), right: normalizeSide(v.right) }; next[side].push(segment(type)); commit(next); }
      function remove(side, id) { const v = tmux(); const next = { left: normalizeSide(v.left), right: normalizeSide(v.right) }; next[side] = next[side].filter(s => s.id !== id); commit(next); }
      function move(side, id, dir) {
        const v = tmux(); const next = { left: normalizeSide(v.left), right: normalizeSide(v.right) }; const arr = next[side];
        const i = arr.findIndex(s => s.id === id); const j = i + dir;
        if (i < 0 || j < 0 || j >= arr.length) return;
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; commit(next);
      }
      function editSeg(side, id, key, val) {
        const v = tmux(); const next = { left: normalizeSide(v.left), right: normalizeSide(v.right) };
        next[side] = next[side].map(s => s.id === id ? Object.assign({}, s, { [key]: val }) : s);
        commit(next);
      }

      function selectRole(side, seg, key) {
        const sel = h('select', { onchange: e => editSeg(side, seg.id, key, e.target.value) });
        PALETTE.forEach(role => sel.appendChild(h('option', { value: role, selected: seg[key] === role ? 'selected' : null }, role)));
        return h('label', { class: 'field' }, key,
          h('div', { class: 'tx-role' },
            h('span', { class: 'tx-role-chip', title: seg[key], style: { background: cssColor(seg[key]) } }),
            sel));
      }
      function renderList(host, side, items) {
        host.innerHTML = '';
        if (!items.length) { host.appendChild(h('div', { class: 'tx-empty' }, 'none yet — add one from the palette')); return; }
        items.forEach((seg, i) => host.appendChild(h('div', { class: 'tx-seg' },
          h('div', {},
            h('div', { class: 'tx-seg-title' }, h('span', { class: 'tx-icon' }, seg.icon), labelFor(seg)),
            h('div', { class: 'tx-mini' }, seg.type)),
          h('div', { class: 'tx-controls' },
            h('span', { class: 'btn ghost', disabled: i === 0 ? 'disabled' : null, onclick: () => move(side, seg.id, -1) }, 'Up'),
            h('span', { class: 'btn ghost', disabled: i === items.length - 1 ? 'disabled' : null, onclick: () => move(side, seg.id, 1) }, 'Down'),
            h('span', { class: 'btn', onclick: () => remove(side, seg.id) }, 'Remove')),
          h('div', { class: 'tx-swatches' }, selectRole(side, seg, 'fg'), selectRole(side, seg, 'bg')))));
      }

      function segText(seg, sample) {
        if (sample) {
          return {
            session: 'dev', window_list: '1:zsh 2:nvim 3:git', directory: '~/terminal-specimen', host: 'atelier', user: 'dev',
            time: '14:32', date: '2026-05-29', battery: '87%', pane_info: '0:editor', git_branch: 'main', cpu: '12%', prefix_indicator: 'PREFIX'
          }[seg.type] || labelFor(seg);
        }
        return (TYPES[seg.type] || TYPES.session).text;
      }
      function previewSeg(seg) {
        return h('span', { class: 'tx-piece', style: { color: cssColor(seg.fg), background: cssColor(seg.bg) } }, h('span', {}, seg.icon), h('span', { class: 'tnum' }, segText(seg, true)));
      }
      function renderPreviewSide(side, items) {
        const wrap = h('div', { class: 'tx-side' });
        const visible = items.filter(s => s.type !== 'window_list');
        visible.forEach((seg, i) => {
          if (side === 'right') wrap.appendChild(h('span', { class: 'tx-sep', style: { color: cssColor(seg.bg), background: i ? cssColor(visible[i - 1].bg) : cssColor('mantle') } }, PREV_SEP_RIGHT));
          wrap.appendChild(previewSeg(seg));
          if (side === 'left') wrap.appendChild(h('span', { class: 'tx-sep', style: { color: cssColor(seg.bg), background: i < visible.length - 1 ? cssColor(visible[i + 1].bg) : cssColor('mantle') } }, PREV_SEP_LEFT));
        });
        return wrap;
      }
      function renderMiddle(hasWindows) {
        if (!hasWindows) return h('div', { class: 'tx-mid' }, 'tmux status bar');
        return h('div', { class: 'tx-mid' }, h('div', { class: 'tx-windows' },
          h('span', { class: 'tx-win tnum' }, '0:shell'), h('span', { class: 'tx-win on tnum' }, '1:nvim'), h('span', { class: 'tx-win tnum' }, '2:logs')));
      }

      function tmuxSegment(seg, side, prevBg, nextBg) {
        const fg = hex(seg.fg), bg = hex(seg.bg), before = [], after = [];
        if (side === 'right') before.push('#[fg=' + bg + ',bg=' + hex(prevBg || 'mantle') + ']' + SEP_RIGHT);
        before.push('#[fg=' + fg + ',bg=' + bg + ',bold] ' + seg.icon + ' ' + segText(seg, false) + ' ');
        if (side === 'left') after.push('#[fg=' + bg + ',bg=' + hex(nextBg || 'mantle') + ']' + SEP_LEFT);
        return before.concat(after).join('');
      }
      function exportSide(side, items) {
        const visible = normalizeSide(items).filter(s => s.type !== 'window_list');
        return visible.map((seg, i) => tmuxSegment(seg, side, side === 'right' && i ? visible[i - 1].bg : 'mantle', side === 'left' && i < visible.length - 1 ? visible[i + 1].bg : 'mantle')).join('') + '#[default]';
      }
      function windowListConf(v) {
        if (!normalizeSide(v.left).concat(normalizeSide(v.right)).some(s => s.type === 'window_list')) return '';
        const normal = '#[fg=' + hex('subtext1') + ',bg=' + hex('surface0') + '] #I:#W ';
        const current = '#[fg=' + hex('crust') + ',bg=' + hex('mauve') + ',bold] #I:#W ';
        return '\nset -g window-status-format "' + normal + '"\nset -g window-status-current-format "' + current + '"';
      }
      function exportConf() {
        const v = tmux();
        return 'set -g status on\n' +
          'set -g status-style "bg=' + hex('mantle') + ',fg=' + hex('text') + '"\n' +
          'set -g status-left "' + exportSide('left', v.left) + '"\n' +
          'set -g status-right "' + exportSide('right', v.right) + '"' + windowListConf(v);
      }
      function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
      function renderCode() { codeBox.innerHTML = escapeHtml(exportConf()).replace(/(set -g [^ ]+)/g, '<span class="prop">$1</span>').replace(/(#[^\s"]+)/g, '<span class="q">$1</span>'); }

      function render() {
        const v = { left: normalizeSide(tmux().left), right: normalizeSide(tmux().right) };
        renderList(leftList, 'left', v.left); renderList(rightList, 'right', v.right);
        previewBody.innerHTML = '';
        previewBody.appendChild(h('div', { class: 'tx-bar' }, renderPreviewSide('left', v.left), renderMiddle(v.left.concat(v.right).some(s => s.type === 'window_list')), renderPreviewSide('right', v.right)));
        renderCode();
      }
      subscribe('tmux', render);
      bus.on('theme:applied', render);
      render();
    }
  });
})();
