/* Keybind Designer — compose Ghostty/tmux bindings with conflict checks. */
(function () {
  App.injectCSS('keybind-designer', `
    .kb-wrap{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.85fr);gap:16px}
    .kb-table{display:flex;flex-direction:column;gap:7px}
    .kb-head,.kb-row{display:grid;grid-template-columns:minmax(130px,1.1fr) minmax(150px,1.2fr) 86px auto;gap:8px;align-items:center}
    .kb-head{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--overlay1);padding:0 8px}
    .kb-row{border:1px solid var(--surface0);border-radius:var(--radius-sm);padding:8px;background:color-mix(in srgb,var(--surface0) 34%,transparent);cursor:pointer;transition:all var(--speed)}
    .kb-row:hover,.kb-row.sel{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,var(--base))}
    .kb-row.conflict{border-color:color-mix(in srgb,var(--red) 70%,var(--surface0));background:color-mix(in srgb,var(--crust) 58%,var(--surface0));box-shadow:0 0 0 1px color-mix(in srgb,var(--red) 24%,transparent)}
    .kb-row.conflict:hover,.kb-row.conflict.sel{background:color-mix(in srgb,var(--crust) 48%,var(--accent))}
    .kb-combo{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
    .kb-warn{color:var(--peach);font-weight:700;margin-right:2px}
    .kb-empty{padding:18px;text-align:center;color:var(--overlay1);border:1px dashed var(--surface1);border-radius:var(--radius)}
    .kb-form{display:grid;grid-template-columns:1fr 1.2fr .8fr auto;gap:8px;align-items:end}
    .kb-record.recording{border-color:var(--accent);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 40%,transparent)}
    .kb-conflicts{margin-left:auto}
    .kb-keyboard{display:flex;flex-direction:column;gap:5px;overflow:auto;padding-bottom:2px}
    .kb-keyrow{display:flex;gap:5px}
    .kb-key{min-width:28px;height:26px;padding:0 7px;border:1px solid var(--surface1);border-bottom-width:2px;border-radius:5px;background:var(--crust);color:var(--subtext0);display:flex;align-items:center;justify-content:center;font-size:10.5px;white-space:nowrap}
    .kb-key.wide{min-width:48px}.kb-key.space{min-width:150px}.kb-key.on{border-color:var(--accent);color:var(--text);background:color-mix(in srgb,var(--accent) 26%,var(--base));box-shadow:0 0 10px color-mix(in srgb,var(--accent) 20%,transparent)}
    .kb-export-head{display:flex;align-items:center;gap:8px;justify-content:space-between}
    .kb-export-actions{display:flex;gap:6px;flex-wrap:wrap}
    @media(max-width:980px){.kb-wrap,.kb-form{grid-template-columns:1fr}.kb-head{display:none}.kb-row{grid-template-columns:1fr}.kb-row .btn{justify-self:start}}
  `);

  App.registerFeature({
    id: 'keybind-designer', title: 'Keybind Designer', icon: '⌨', order: 40,
    subtitle: 'Record combos, catch conflicts, and export a real Ghostty or tmux config.',
    mount(el, ctx) {
      const { h, get, set, subscribe, copy, download, toast } = ctx;
      const DEFAULTS = [
        { id: 'kb-' + Date.now() + '-1', combo: 'super+shift+r', action: 'reload_config', target: 'ghostty' },
        { id: 'kb-' + Date.now() + '-2', combo: 'super+shift+enter', action: 'toggle_split_zoom', target: 'ghostty' },
        { id: 'kb-' + Date.now() + '-3', combo: 'super+t', action: 'new_tab', target: 'ghostty' },
        { id: 'kb-' + Date.now() + '-4', combo: 'prefix-|', action: 'split-window -h', target: 'tmux' },
        { id: 'kb-' + Date.now() + '-5', combo: 'prefix-c', action: 'new-window', target: 'tmux' }
      ];
      if (!Array.isArray(get('keybinds')) || !get('keybinds').length) set('keybinds', DEFAULTS);

      let selectedId = null;
      let draftCombo = '';

      const comboInput = h('input', { type: 'text', placeholder: 'focus or record…', autocomplete: 'off' });
      const recordBtn = h('button', { class: 'btn kb-record', type: 'button', onclick: () => { comboInput.focus(); setRecording(true); } }, 'Record');
      const actionInput = h('input', { type: 'text', placeholder: 'action, e.g. reload_config' });
      const targetSelect = h('select', {}, h('option', { value: 'ghostty' }, 'ghostty'), h('option', { value: 'tmux' }, 'tmux'));
      const addBtn = h('button', { class: 'btn primary', type: 'button', onclick: addBinding }, 'Add');
      const listEl = h('div', { class: 'kb-table' });
      const conflictPill = h('span', { class: 'tag-pill kb-conflicts tnum' }, '0 conflicts');
      const keyboardEl = h('div', { class: 'kb-keyboard' });
      const exportBox = h('pre', { class: 'codeblock' });

      const form = h('div', { class: 'kb-form' },
        h('label', { class: 'field' }, 'combo', h('div', { class: 'row-flex' }, comboInput, recordBtn)),
        h('label', { class: 'field' }, 'action', actionInput),
        h('label', { class: 'field' }, 'target', targetSelect),
        addBtn
      );

      el.classList.add('fill');
      el.appendChild(h('div', { class: 'kb-wrap' },
        h('div', { class: 'stack' },
          h('div', { class: 'card stack' }, h('h4', {}, h('span', { class: 'accent' }, '+'), 'Add binding'), form),
          h('div', { class: 'card stack grow' },
            h('div', { class: 'row-flex' }, h('h4', {}, h('span', { class: 'accent' }, '#'), 'Bindings'), conflictPill),
            h('div', { class: 'kb-head' }, h('span', {}, 'combo'), h('span', {}, 'action'), h('span', {}, 'target'), h('span', {}, '')),
            listEl
          )
        ),
        h('div', { class: 'stack' },
          h('div', { class: 'card stack' }, h('h4', {}, h('span', { class: 'accent' }, '⌨'), 'Visual keyboard'), keyboardEl, h('div', { class: 'muted' }, 'Hover or select a binding to highlight its keys.')),
          h('div', { class: 'card stack grow' },
            h('div', { class: 'kb-export-head' }, h('h4', {}, h('span', { class: 'accent' }, '⇥'), 'Export'),
              h('div', { class: 'kb-export-actions' },
                h('button', { class: 'btn', onclick: () => copy(exportText()) }, 'Copy'),
                h('button', { class: 'btn', onclick: () => download('keybinds.conf', exportText()) }, 'Download'))),
            exportBox
          )
        )
      ));

      comboInput.addEventListener('focus', () => setRecording(true));
      comboInput.addEventListener('blur', () => setRecording(false));
      comboInput.addEventListener('input', () => { draftCombo = normalizeCombo(comboInput.value); comboInput.value = draftCombo; });
      comboInput.addEventListener('keydown', e => {
        if (e.key === 'Tab') return;
        e.preventDefault();
        const combo = eventToCombo(e);
        if (!combo) return;
        draftCombo = combo;
        comboInput.value = combo;
        setRecording(false);
        actionInput.focus();
      });
      [comboInput, actionInput].forEach(input => input.addEventListener('keydown', e => { if (e.key === 'Enter') addBinding(); }));

      function setRecording(on) {
        recordBtn.classList.toggle('recording', on);
        recordBtn.textContent = on ? 'Listening…' : 'Record';
      }

      function addBinding() {
        const combo = normalizeCombo(draftCombo || comboInput.value);
        const action = actionInput.value.trim();
        const target = targetSelect.value === 'tmux' ? 'tmux' : 'ghostty';
        if (!combo || !action) { toast('Combo and action required', 'warn'); return; }
        const next = (get('keybinds') || []).slice();
        next.push({ id: 'kb-' + Date.now() + '-' + Math.random().toString(16).slice(2), combo, action, target });
        set('keybinds', next);
        selectedId = next[next.length - 1].id;
        draftCombo = '';
        comboInput.value = '';
        actionInput.value = '';
        comboInput.focus();
      }

      function removeBinding(id) {
        set('keybinds', (get('keybinds') || []).filter(b => b.id !== id));
        if (selectedId === id) selectedId = null;
      }

      function render() {
        const binds = sanitizeBindings(get('keybinds'));
        const conflicts = conflictKeys(binds);
        listEl.innerHTML = '';
        if (!binds.length) listEl.appendChild(h('div', { class: 'kb-empty' }, 'No bindings. Record your first combo above.'));
        binds.forEach(b => {
          const conflicted = conflicts.has(conflictKey(b));
          const row = h('div', { class: 'kb-row', tabindex: '0' },
            h('div', { class: 'kb-combo' }, conflicted ? h('span', { class: 'kb-warn', title: 'Conflict' }, '⚠') : null, comboChips(b.combo)),
            h('div', {}, b.action || h('span', { class: 'dim' }, 'no action')),
            h('span', { class: 'tag-pill ' + (b.target === 'tmux' ? 'on' : '') }, b.target),
            h('div', { class: 'row-flex' }, conflicted ? h('span', { class: 'tag-pill off' }, 'conflict') : null,
              h('button', { class: 'btn ghost', onclick: e => { e.stopPropagation(); removeBinding(b.id); } }, 'Remove'))
          );
          row.classList.toggle('conflict', conflicted);
          row.classList.toggle('sel', selectedId === b.id);
          row.addEventListener('mouseenter', () => renderKeyboard(b.combo));
          row.addEventListener('mouseleave', () => renderKeyboard(selectedCombo()));
          row.addEventListener('click', () => { selectedId = b.id; render(); });
          row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedId = b.id; render(); } });
          listEl.appendChild(row);
        });
        const conflictCount = conflicts.size;
        conflictPill.className = 'tag-pill kb-conflicts tnum ' + (conflictCount ? 'off' : 'on');
        conflictPill.textContent = conflictCount + (conflictCount === 1 ? ' conflict' : ' conflicts');
        exportBox.textContent = exportText(binds);
        renderKeyboard(selectedCombo(binds));
      }

      function sanitizeBindings(arr) {
        return (Array.isArray(arr) ? arr : []).filter(Boolean).map((b, i) => ({
          id: b.id || 'kb-existing-' + i,
          combo: normalizeCombo(b.combo || ''),
          action: String(b.action || ''),
          target: b.target === 'tmux' ? 'tmux' : 'ghostty'
        }));
      }

      function conflictKey(b) { return b.target + '::' + normalizeCombo(b.combo); }
      function conflictKeys(binds) {
        const counts = new Map();
        binds.forEach(b => { if (b.combo) counts.set(conflictKey(b), (counts.get(conflictKey(b)) || 0) + 1); });
        return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k));
      }

      function selectedCombo(binds) {
        const arr = binds || sanitizeBindings(get('keybinds'));
        const b = arr.find(x => x.id === selectedId);
        return b ? b.combo : '';
      }

      function comboChips(combo) {
        const parts = displayParts(combo);
        return parts.length ? parts.map(p => h('span', { class: 'kbd' }, p)) : [h('span', { class: 'dim' }, 'unset')];
      }

      function displayParts(combo) {
        const labels = { super: '⌘', ctrl: '⌃', control: '⌃', alt: '⌥', option: '⌥', shift: '⇧', enter: 'Enter', escape: 'Esc', esc: 'Esc', space: 'Space', prefix: 'Prefix', cmd: '⌘', meta: '⌘' };
        return normalizeCombo(combo).split(/[+-]/).filter(Boolean).map(part => labels[part] || (part.length === 1 ? part.toUpperCase() : part));
      }

      function normalizeCombo(combo) {
        const raw = String(combo || '').trim().toLowerCase().replace(/\s+/g, '+').replace(/cmd|command|meta|⌘/g, 'super').replace(/control|⌃/g, 'ctrl').replace(/option|⌥/g, 'alt').replace(/⇧/g, 'shift').replace(/\+?\+\+?/g, '+');
        if (!raw) return '';
        if (raw.startsWith('prefix-')) return 'prefix-' + keyName(raw.slice(7));
        const tokens = raw.split('+').filter(Boolean);
        const mods = [];
        ['super', 'ctrl', 'alt', 'shift'].forEach(m => { if (tokens.includes(m)) mods.push(m); });
        const key = tokens.reverse().find(t => !['super', 'ctrl', 'alt', 'shift'].includes(t));
        return mods.concat(key ? [keyName(key)] : []).join('+');
      }

      function keyName(key) {
        const k = String(key || '').toLowerCase();
        const map = { ' ': 'space', spacebar: 'space', return: 'enter', esc: 'escape', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', period: '.', comma: ',', slash: '/', backslash: '\\' };
        return map[k] || k;
      }

      function eventToCombo(e) {
        const k = keyName(e.key);
        if (['shift', 'control', 'ctrl', 'alt', 'meta', 'super'].includes(k)) return '';
        const parts = [];
        if (e.metaKey) parts.push('super');
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        parts.push(k.length === 1 ? k : keyName(k));
        return normalizeCombo(parts.join('+'));
      }

      function comboTokens(combo) {
        const n = normalizeCombo(combo);
        if (!n) return new Set();
        const parts = n.startsWith('prefix-') ? ['prefix', n.slice(7)] : n.split('+');
        return new Set(parts.map(p => p === 'super' ? 'cmd' : p === 'ctrl' ? 'control' : p));
      }

      const KEY_ROWS = [
        ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
        ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
        ['control', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
        ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
        ['prefix', 'cmd', 'alt', 'space', 'alt', 'cmd']
      ];
      function renderKeyboard(combo) {
        const active = comboTokens(combo);
        keyboardEl.innerHTML = '';
        KEY_ROWS.forEach(row => keyboardEl.appendChild(h('div', { class: 'kb-keyrow' }, row.map(k => {
          const cls = 'kb-key ' + (['tab', 'enter', 'shift', 'control', 'prefix'].includes(k) ? 'wide ' : '') + (k === 'space' ? 'space ' : '') + (active.has(k) ? 'on' : '');
          return h('span', { class: cls }, keyLabel(k));
        }))));
      }
      function keyLabel(k) { return { esc: 'Esc', control: 'Ctrl', cmd: '⌘', alt: 'Alt', shift: 'Shift', enter: 'Enter', space: 'Space', prefix: 'Prefix', tab: 'Tab' }[k] || k.toUpperCase(); }

      function exportText(src) {
        const binds = src || sanitizeBindings(get('keybinds'));
        const ghostty = binds.filter(b => b.target === 'ghostty').map(b => 'keybind = ' + b.combo + '=' + b.action);
        const tmux = binds.filter(b => b.target === 'tmux').map(b => 'bind ' + tmuxKey(b.combo) + ' ' + b.action);
        return ['# Ghostty', ghostty.length ? ghostty.join('\n') : '# (none)', '', '# tmux', tmux.length ? tmux.join('\n') : '# (none)'].join('\n');
      }
      function tmuxKey(combo) {
        const n = normalizeCombo(combo);
        if (n.startsWith('prefix-')) return n.slice(7);
        const parts = n.split('+');
        const key = parts.pop() || '';
        if (parts.includes('ctrl')) return 'C-' + key;
        if (parts.includes('alt')) return 'M-' + key;
        return key;
      }

      subscribe('keybinds', render);
      render();
    }
  });
})();
