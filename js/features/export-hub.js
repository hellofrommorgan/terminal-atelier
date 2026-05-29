/* Export Hub — turns live Atelier state into usable dotfiles. */
(function () {
  App.injectCSS('export-hub', `
    .ex-wrap{display:flex;flex-direction:column;gap:12px}
    .ex-toolbar{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
    .ex-tabs{gap:8px}
    .ex-tabs .btn{align-items:flex-start;flex-direction:column;gap:2px;line-height:1.25}
    .ex-tabs .muted{font-size:10px;font-weight:400}
    .ex-code{max-height:58vh;min-height:360px}
    .ex-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--overlay1);font-size:11px}
    .ex-meta .ex-file{color:var(--accent);font-weight:700}
  `);

  const ANSI_ROLES = ['surface1', 'red', 'green', 'yellow', 'blue', 'mauve', 'teal', 'subtext1',
    'surface2', 'maroon', 'green', 'peach', 'sapphire', 'pink', 'sky', 'text'];
  const TMUX_TYPES = {
    session: { icon: '▰', text: '#S' }, window_list: { icon: '◫', text: '#I:#W' }, directory: { icon: '', text: '#{pane_current_path}' },
    host: { icon: '󰒋', text: '#H' }, user: { icon: '', text: '#{user}' }, time: { icon: '', text: '%H:%M' }, date: { icon: '', text: '%Y-%m-%d' },
    battery: { icon: '󰁹', text: '#{battery_percentage}' }, pane_info: { icon: '□', text: '#{pane_index}:#{pane_title}' },
    git_branch: { icon: '', text: '#(git branch --show-current 2>/dev/null)' }, cpu: { icon: '󰍛', text: '#{cpu_percentage}' },
    prefix_indicator: { icon: '⌘', text: '#{?client_prefix,PREFIX,}' }
  };
  const PROMPT_TYPES = {
    directory: { module: 'directory', icon: '~' }, git_branch: { module: 'git_branch', icon: '⎇' }, git_status: { module: 'git_status', icon: '✗' },
    cmd_duration: { module: 'cmd_duration', icon: '⏱' }, time: { module: 'time', icon: '⌚' }, username: { module: 'username', icon: 'u' },
    hostname: { module: 'hostname', icon: 'h' }, node_version: { module: 'nodejs', icon: '⬢' }, python_version: { module: 'python', icon: 'py' },
    exit_status: { module: 'status', icon: '✗' }, prompt_char: { module: 'character', icon: '❯' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function str(v, fallback) { return (v == null || v === '') ? fallback : String(v); }
  function bool(v, fallback) { return typeof v === 'boolean' ? v : fallback; }
  function num(v, fallback) { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; }
  function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
  function tomlString(s) { return '"' + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
  function cleanHex(v, fallback) {
    v = String(v || '').trim();
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(c => c + c).join('').toLowerCase();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) return '#' + [m[1], m[2], m[3]].map(x => Math.max(0, Math.min(255, parseInt(x, 10))).toString(16).padStart(2, '0')).join('');
    return fallback || '#ffffff';
  }
  function cssRole(role, stateColors) {
    const root = getComputedStyle(document.documentElement);
    const raw = root.getPropertyValue('--' + role).trim() || (stateColors && stateColors[role]);
    return cleanHex(raw, '#ffffff');
  }
  function roleOrHex(value, stateColors, fallbackRole) {
    if (typeof value === 'string') {
      if (/^#|^rgb/i.test(value.trim())) return cleanHex(value, cssRole(fallbackRole, stateColors));
      if (stateColors && stateColors[value]) return cleanHex(stateColors[value], cssRole(fallbackRole, stateColors));
      const css = getComputedStyle(document.documentElement).getPropertyValue('--' + value).trim();
      if (css) return cleanHex(css, cssRole(fallbackRole, stateColors));
    }
    return cssRole(fallbackRole, stateColors);
  }

  function ghosttyFontFamily(family) {
    return family === 'Geist Mono' ? 'GeistMono Nerd Font Mono' : str(family, 'Geist Mono');
  }
  function ghosttyCursorStyle(style) {
    const s = String(style || 'bar').toLowerCase();
    if (s === 'beam') return 'bar';
    if (['bar', 'block', 'underline'].includes(s)) return s;
    return 'bar';
  }
  function ghosttyFeatureLines(features) {
    const arr = Array.isArray(features) ? features : [];
    const lines = arr.includes('lig')
      ? ['font-feature = +liga', 'font-feature = +calt']
      : ['font-feature = -liga', 'font-feature = -calt'];
    arr.forEach(tag => { if (tag && tag !== 'lig') lines.push('font-feature = +' + tag); });
    return uniq(lines);
  }
  function ansiColors(stateColors) { return ANSI_ROLES.map(role => cssRole(role, stateColors)); }
  function cursorShape(style, fallback) {
    const s = String(style || '').toLowerCase();
    if (s === 'bar' || s === 'beam') return 'beam';
    if (s === 'underline' || s === 'block') return s;
    return fallback || 'beam';
  }
  function cursorBlink(cursor) { return bool(cursor && cursor.blink, false); }
  function luaString(s) { return "'" + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }
  function hexToRgb01(hex) {
    const h = cleanHex(hex, '#ffffff').slice(1);
    return [0, 2, 4].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) / 255 * 1000000) / 1000000);
  }
  function itermColor(hex) {
    const rgb = hexToRgb01(hex);
    return { 'Red Component': rgb[0], 'Green Component': rgb[1], 'Blue Component': rgb[2], 'Color Space': 'sRGB' };
  }

  function generateGhostty(ctx) {
    const font = ctx.get('font') || {};
    const cursor = ctx.get('cursor') || {};
    const theme = ctx.get('theme') || {};
    const colors = theme.colors || {};
    const wght = Math.round(num(font.wght, 420));
    const size = num(font.size, 15);
    const lines = [
      '# Atelier export: Ghostty config',
      'font-family = ' + ghosttyFontFamily(font.family),
      'font-size = ' + size,
      'font-variation = wght=' + wght
    ];
    if (font.variable !== false) {
      lines.push('font-variation-bold = wght=' + Math.max(650, Math.min(900, wght + 260)));
      lines.push('font-variation-italic = wght=' + wght);
      lines.push('font-variation-bold-italic = wght=' + Math.max(650, Math.min(900, wght + 260)));
    }
    lines.push(...ghosttyFeatureLines(font.features));
    lines.push('', '# cursor');
    lines.push('cursor-style = ' + ghosttyCursorStyle(cursor.style));
    lines.push('cursor-style-blink = ' + bool(cursor.blink, false));
    lines.push('', '# theme');
    lines.push('background = ' + cssRole('base', colors));
    lines.push('foreground = ' + cssRole('text', colors));
    lines.push('cursor-color = ' + roleOrHex(cursor.color, colors, 'rosewater'));
    ANSI_ROLES.forEach((role, i) => lines.push('palette = ' + i + '=' + cssRole(role, colors)));
    return lines.join('\n') + '\n';
  }

  function tmuxText(seg) {
    if (seg == null) return '';
    if (typeof seg === 'string') return seg;
    const d = TMUX_TYPES[seg.type] || {};
    return [seg.icon || d.icon, seg.text || d.text || seg.label || seg.name || seg.type || ''].filter(Boolean).join(' ');
  }
  function tmuxColor(seg, key, fallbackRole, stateColors) {
    if (!seg || typeof seg !== 'object') return cssRole(fallbackRole, stateColors);
    return roleOrHex(seg[key] || seg[key + 'Color'] || seg.color, stateColors, fallbackRole);
  }
  function tmuxFmt(seg, i, side, stateColors) {
    const text = tmuxText(seg) || (side === 'left' ? '#S' : '#(date +%H:%M)');
    const fg = tmuxColor(seg, 'fg', i % 2 ? 'base' : 'crust', stateColors);
    const bg = tmuxColor(seg, 'bg', i % 2 ? 'teal' : 'mauve', stateColors);
    const attrs = seg && typeof seg === 'object' && (seg.bold || seg.weight === 'bold') ? ',bold' : '';
    return '#[fg=' + fg + ',bg=' + bg + attrs + '] ' + text.replace(/"/g, '\\"') + ' ';
  }
  function normalizeTmuxKey(combo) {
    return str(combo, '').replace(/Ctrl\+/ig, 'C-').replace(/Control\+/ig, 'C-').replace(/Alt\+/ig, 'M-').replace(/Meta\+/ig, 'M-').replace(/Shift\+/ig, 'S-').replace(/\+/g, '-');
  }
  function generateTmux(ctx) {
    const tmux = ctx.get('tmux') || {};
    const keybinds = Array.isArray(ctx.get('keybinds')) ? ctx.get('keybinds') : [];
    const colors = (ctx.get('theme') || {}).colors || {};
    const left = Array.isArray(tmux.left) ? tmux.left : [];
    const right = Array.isArray(tmux.right) ? tmux.right : [];
    const binds = keybinds.filter(k => String(k && k.target || '').toLowerCase() === 'tmux');
    const lines = ['# Atelier export: tmux.conf'];
    if (left.length || right.length) {
      lines.push('set -g status on');
      lines.push('set -g status-style "bg=' + cssRole('mantle', colors) + ',fg=' + cssRole('text', colors) + '"');
      if (left.length) lines.push('set -g status-left "' + left.map((s, i) => tmuxFmt(s, i, 'left', colors)).join('') + '#[default]"');
      else lines.push('# set -g status-left "#[fg=' + cssRole('crust', colors) + ',bg=' + cssRole('mauve', colors) + ',bold] #S #[default]"');
      if (right.length) lines.push('set -g status-right "' + right.map((s, i) => tmuxFmt(s, i, 'right', colors)).join('') + '#[default]"');
      else lines.push('# set -g status-right "#[fg=' + cssRole('crust', colors) + ',bg=' + cssRole('teal', colors) + '] %H:%M #[default]"');
    } else {
      lines.push('# No tmux status segments configured in Atelier yet.');
      lines.push('# set -g status-left "#[fg=' + cssRole('crust', colors) + ',bg=' + cssRole('mauve', colors) + ',bold] #S #[default]"');
      lines.push('# set -g status-right "#[fg=' + cssRole('crust', colors) + ',bg=' + cssRole('teal', colors) + '] %Y-%m-%d %H:%M #[default]"');
    }
    lines.push('');
    if (binds.length) {
      binds.forEach(k => {
        const key = normalizeTmuxKey(k.combo);
        const action = str(k.action, '').trim();
        if (key && action) lines.push('bind-key ' + key + ' ' + action);
      });
    } else {
      lines.push('# No tmux keybinds configured in Atelier yet.');
      lines.push('# bind-key r source-file ~/.tmux.conf \\; display-message "tmux.conf reloaded"');
    }
    return lines.join('\n') + '\n';
  }

  function promptSegments(prompt) {
    const segs = Array.isArray(prompt.segments) ? prompt.segments.slice() : [];
    if (Array.isArray(prompt.order) && prompt.order.length) {
      const byId = new Map(segs.map(s => [s.id || s.type || s.name, s]));
      const ordered = prompt.order.map(id => byId.get(id)).filter(Boolean);
      segs.forEach(s => { if (!ordered.includes(s)) ordered.push(s); });
      return ordered;
    }
    return segs;
  }
  function promptType(seg) { return PROMPT_TYPES[seg && seg.type] || PROMPT_TYPES.directory; }
  function promptModule(seg) { return promptType(seg).module; }
  function triple(s) { return '"""' + String(s || '').replace(/"""/g, '\\"\\"\\"') + '"""'; }
  function starshipStyle(seg, d) { return 'fg:' + (seg.fg || d.fg || 'text') + (seg.bg ? ' bg:' + seg.bg : ''); }
  function starshipModuleFormat(seg) {
    const d = promptType(seg);
    const icon = tomlString(seg.icon || d.icon || '');
    if (seg.type === 'directory') return ['format = ' + tomlString('[' + (seg.icon || d.icon) + ' $path]($style)')];
    if (seg.type === 'git_branch') return ['symbol = ' + tomlString((seg.icon || d.icon) + ' '), 'format = ' + tomlString('[$symbol$branch]($style)')];
    if (seg.type === 'git_status') return ['format = ' + tomlString('[' + (seg.icon || d.icon) + ' $all_status$ahead_behind]($style)')];
    if (seg.type === 'cmd_duration') return ['min_time = 0', 'format = ' + tomlString('[' + (seg.icon || d.icon) + ' $duration]($style)')];
    if (seg.type === 'time') return ['disabled = false', 'time_format = "%H:%M"', 'format = ' + tomlString('[' + (seg.icon || d.icon) + ' $time]($style)')];
    if (seg.type === 'username') return ['show_always = true', 'format = ' + tomlString('[' + (seg.icon || d.icon) + ' $user]($style)')];
    if (seg.type === 'hostname') return ['ssh_only = false', 'format = ' + tomlString('[' + (seg.icon || d.icon) + ' $hostname]($style)')];
    if (seg.type === 'node_version' || seg.type === 'python_version') return ['symbol = ' + tomlString((seg.icon || d.icon) + ' '), 'format = ' + tomlString('[$symbol($version)]($style)')];
    if (seg.type === 'exit_status') return ['disabled = false', 'format = ' + tomlString('[' + (seg.icon || d.icon) + ' $status]($style)')];
    return ['success_symbol = ' + tomlString('[' + (seg.icon || d.icon || '❯') + '](fg:' + (seg.fg || 'green') + ')'), 'error_symbol = ' + tomlString('[' + (seg.icon || d.icon || '❯') + '](fg:red)')];
  }
  function generateKitty(ctx) {
    const font = ctx.get('font') || {};
    const cursor = ctx.get('cursor') || {};
    const colors = (ctx.get('theme') || {}).colors || {};
    const wght = Math.round(num(font.wght, 420));
    const palette = ansiColors(colors);
    const lines = [
      '# Atelier export: kitty.conf',
      'font_family ' + str(font.family, 'Geist Mono'),
      'font_size ' + num(font.size, 15)
    ];
    if (font.variable !== false) lines.push('# Kitty cannot set arbitrary variable font weights in kitty.conf; Atelier design weight: ' + wght);
    if (bool(font.italic, false)) lines.push('italic_font auto');
    lines.push('bold_font auto');
    lines.push('', '# cursor');
    lines.push('cursor_shape ' + cursorShape(cursor.style, 'beam'));
    lines.push('cursor_blink_interval ' + (cursorBlink(cursor) ? '0.5' : '0'));
    lines.push('', '# theme');
    lines.push('foreground ' + cssRole('text', colors));
    lines.push('background ' + cssRole('base', colors));
    lines.push('cursor ' + roleOrHex(cursor.color, colors, 'rosewater'));
    lines.push('selection_foreground ' + cssRole('text', colors));
    lines.push('selection_background ' + cssRole('surface0', colors));
    palette.forEach((hex, i) => lines.push('color' + i + ' ' + hex));
    return lines.join('\n') + '\n';
  }
  function generateAlacritty(ctx) {
    const font = ctx.get('font') || {};
    const cursor = ctx.get('cursor') || {};
    const colors = (ctx.get('theme') || {}).colors || {};
    const palette = ansiColors(colors);
    const shape = { block: 'Block', beam: 'Beam', bar: 'Beam', underline: 'Underline' }[String(cursor.style || 'bar').toLowerCase()] || 'Beam';
    const lines = [
      '# Atelier export: alacritty.toml',
      '[font]',
      'size = ' + num(font.size, 15),
      '',
      '[font.normal]',
      'family = ' + tomlString(str(font.family, 'Geist Mono')),
      '',
      '[colors.primary]',
      'foreground = ' + tomlString(cssRole('text', colors)),
      'background = ' + tomlString(cssRole('base', colors)),
      '',
      '[colors.cursor]',
      'text = ' + tomlString(cssRole('base', colors)),
      'cursor = ' + tomlString(roleOrHex(cursor.color, colors, 'rosewater')),
      '',
      '[colors.selection]',
      'text = ' + tomlString(cssRole('text', colors)),
      'background = ' + tomlString(cssRole('surface0', colors)),
      '',
      '[colors.normal]'
    ];
    ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].forEach((name, i) => lines.push(name + ' = ' + tomlString(palette[i])));
    lines.push('', '[colors.bright]');
    ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].forEach((name, i) => lines.push(name + ' = ' + tomlString(palette[i + 8])));
    lines.push('', '[cursor]', '', '[cursor.style]', 'shape = ' + tomlString(shape), 'blinking = ' + tomlString(cursorBlink(cursor) ? 'Always' : 'Never'));
    return lines.join('\n') + '\n';
  }
  function generateWezTerm(ctx) {
    const font = ctx.get('font') || {};
    const cursor = ctx.get('cursor') || {};
    const colors = (ctx.get('theme') || {}).colors || {};
    const palette = ansiColors(colors);
    const shape = cursorShape(cursor.style, 'beam');
    const cursorStyle = (cursorBlink(cursor) ? 'Blinking' : 'Steady') + (shape === 'block' ? 'Block' : shape === 'underline' ? 'Underline' : 'Bar');
    const lines = [
      '-- Atelier export: wezterm.lua',
      "local wezterm = require 'wezterm'",
      'local config = wezterm.config_builder()',
      '',
      'config.font = wezterm.font(' + luaString(str(font.family, 'Geist Mono')) + ')',
      'config.font_size = ' + num(font.size, 15),
      'config.default_cursor_style = ' + luaString(cursorStyle),
      'config.colors = {',
      '  foreground = ' + luaString(cssRole('text', colors)) + ',',
      '  background = ' + luaString(cssRole('base', colors)) + ',',
      '  cursor_bg = ' + luaString(roleOrHex(cursor.color, colors, 'rosewater')) + ',',
      '  cursor_fg = ' + luaString(cssRole('base', colors)) + ',',
      '  selection_fg = ' + luaString(cssRole('text', colors)) + ',',
      '  selection_bg = ' + luaString(cssRole('surface0', colors)) + ',',
      '  ansi = { ' + palette.slice(0, 8).map(luaString).join(', ') + ' },',
      '  brights = { ' + palette.slice(8).map(luaString).join(', ') + ' },',
      '}',
      '',
      'return config'
    ];
    return lines.join('\n') + '\n';
  }
  function generateITerm2(ctx) {
    const font = ctx.get('font') || {};
    const cursor = ctx.get('cursor') || {};
    const theme = ctx.get('theme') || {};
    const colors = theme.colors || {};
    const palette = ansiColors(colors);
    const profile = {
      Name: 'Atelier ' + str(theme.name, 'Profile'),
      Guid: 'atelier-dynamic-profile',
      'Normal Font': str(font.family, 'Geist Mono') + ' ' + num(font.size, 15),
      'Foreground Color': itermColor(cssRole('text', colors)),
      'Background Color': itermColor(cssRole('base', colors)),
      'Cursor Color': itermColor(roleOrHex(cursor.color, colors, 'rosewater')),
      'Selection Color': itermColor(cssRole('surface0', colors)),
      'Selected Text Color': itermColor(cssRole('text', colors)),
      'Cursor Type': ({ block: 0, beam: 1, bar: 1, underline: 2 }[String(cursor.style || 'bar').toLowerCase()] || 1)
    };
    palette.forEach((hex, i) => { profile['Ansi ' + i + ' Color'] = itermColor(hex); });
    return JSON.stringify({ Profiles: [profile] }, null, 2) + '\n';
  }

  function generateStarship(ctx) {
    const prompt = ctx.get('prompt') || {};
    let segs = promptSegments(prompt);
    if (!segs.length) segs = [
      { type: 'directory', fg: 'crust', bg: 'blue', icon: '~' },
      { type: 'git_branch', fg: 'crust', bg: 'mauve', icon: '⎇' },
      { type: 'git_status', fg: 'crust', bg: 'peach', icon: '✗' },
      { type: 'prompt_char', fg: 'green', icon: '❯' }
    ];
    const lineSegs = segs.filter(s => s.type !== 'prompt_char');
    const charSeg = segs.find(s => s.type === 'prompt_char') || { type: 'prompt_char', fg: 'green', icon: '❯' };
    const format = typeof prompt.format === 'string' && prompt.format.includes('$') ? prompt.format : (() => {
      if (prompt.format === 'plain') return lineSegs.map(s => '$' + promptModule(s)).join(' ') + '$line_break$character';
      let out = '';
      lineSegs.forEach((s, i) => {
        out += '$' + promptModule(s);
        const next = lineSegs[i + 1];
        out += next ? '[▶](fg:' + (s.bg || 'blue') + ' bg:' + (next.bg || 'base') + ')' : '[▶](fg:' + (s.bg || 'blue') + ')';
      });
      return out + '$line_break$character';
    })();
    const usedRoles = uniq(['red'].concat(segs.flatMap(s => { const d = promptType(s); return [s.fg || d.fg, s.bg || d.bg]; })));
    const lines = ['# Atelier export: starship.toml', 'add_newline = true', 'palette = "atelier"', 'format = ' + triple(format), '', '[palettes.atelier]'];
    const colors = (ctx.get('theme') || {}).colors || {};
    usedRoles.forEach(role => { if (role) lines.push(role + ' = ' + tomlString(cssRole(role, colors))); });
    const seen = new Set();
    lineSegs.concat([charSeg]).forEach(seg => {
      const mod = promptModule(seg);
      if (seen.has(mod)) return;
      seen.add(mod);
      lines.push('', '[' + mod + ']');
      if (mod !== 'character') lines.push('style = ' + tomlString(starshipStyle(seg, promptType(seg))));
      lines.push(...starshipModuleFormat(seg));
    });
    return lines.join('\n') + '\n';
  }

  function bundle(files) {
    return files.map(f => '# === ' + f.filename + ' ===\n' + f.text.trimEnd()).join('\n\n') + '\n';
  }
  function highlight(text) {
    return esc(text).split('\n').map(line => {
      if (/^#/.test(line)) return '<span class="cmt">' + line + '</span>';
      if (/^\[.*\]$/.test(line)) return '<span class="key">' + line + '</span>';
      return line.replace(/^([A-Za-z0-9_.-]+)(\s*=)/, '<span class="prop">$1</span>$2')
        .replace(/(&quot;.*?&quot;)/g, '<span class="q">$1</span>')
        .replace(/(#[0-9a-fA-F]{6})/g, '<span class="v">$1</span>');
    }).join('\n');
  }

  App.registerFeature({
    id: 'export-hub', title: 'Export Configs', icon: '⇩', order: 130,
    subtitle: 'Live settings → real dotfiles. Copy or download.',
    mount(el, ctx) {
      const { h, subscribe, bus, copy, download } = ctx;
      let active = 'ghostty';
      let files = [];
      const tabs = h('div', { class: 'btn-row ex-tabs' });
      const meta = h('div', { class: 'ex-meta tnum' });
      const code = h('pre', { class: 'codeblock ex-code' });
      const copyBtn = h('span', { class: 'btn primary', onclick: () => copy(current().text) }, 'Copy');
      const downBtn = h('span', { class: 'btn', onclick: () => download(current().filename, current().text) }, 'Download');
      const copyAll = h('span', { class: 'btn adv-only', onclick: () => copy(bundle(files)) }, 'Copy all');
      const downAll = h('span', { class: 'btn adv-only', onclick: () => download('dotfiles-bundle.txt', bundle(files)) }, 'Download bundle');

      function current() { return files.find(f => f.id === active) || files[0]; }
      function lineCount(text) { return text.trimEnd() ? text.trimEnd().split('\n').length : 0; }
      function byteSize(text) {
        const bytes = new TextEncoder().encode(text).length;
        return bytes < 1024 ? '< 1 KB' : (bytes / 1024).toFixed(1) + ' KB';
      }
      function keyCount(text) {
        return text.split('\n').filter(line => {
          const t = line.trim();
          return t && !t.startsWith('#');
        }).length;
      }
      function rebuildTabs() {
        tabs.innerHTML = '';
        files.forEach(f => tabs.appendChild(h('span', { class: 'btn' + (f.id === active ? ' sel' : ''), onclick: () => { active = f.id; render(); } },
          h('span', null, f.label),
          h('span', { class: 'muted' }, f.path)
        )));
      }
      function render() {
        const f = current();
        rebuildTabs();
        meta.innerHTML = '<span class="ex-file">' + esc(f.filename) + '</span><span>·</span><span>' + lineCount(f.text) + ' lines</span><span>·</span><span>' + byteSize(f.text) + '</span><span>·</span><span>' + keyCount(f.text) + ' keys</span>';
        code.innerHTML = highlight(f.text);
      }
      function regenerate() {
        try {
          files = [
            { id: 'ghostty', label: 'Ghostty', filename: 'config', path: '~/.config/ghostty/config', text: generateGhostty(ctx) },
            { id: 'kitty', label: 'Kitty', filename: 'kitty.conf', path: '~/.config/kitty/kitty.conf', text: generateKitty(ctx) },
            { id: 'alacritty', label: 'Alacritty', filename: 'alacritty.toml', path: '~/.config/alacritty/alacritty.toml', text: generateAlacritty(ctx) },
            { id: 'wezterm', label: 'WezTerm', filename: 'wezterm.lua', path: '~/.config/wezterm/wezterm.lua', text: generateWezTerm(ctx) },
            { id: 'iterm2', label: 'iTerm2', filename: 'iterm2-dynamic-profile.json', path: '~/Library/Application Support/iTerm2/DynamicProfiles/atelier.json', text: generateITerm2(ctx) },
            { id: 'tmux', label: 'tmux.conf', filename: '.tmux.conf', path: '~/.tmux.conf', text: generateTmux(ctx) },
            { id: 'starship', label: 'starship.toml', filename: 'starship.toml', path: '~/.config/starship.toml', text: generateStarship(ctx) }
          ];
          if (!files.find(f => f.id === active)) active = files[0].id;
          render();
        } catch (e) {
          code.textContent = '# export-hub could not render this state safely\n# ' + (e && e.message ? e.message : e);
        }
      }

      el.classList.add('fill');
      el.appendChild(h('div', { class: 'ex-wrap' },
        h('div', { class: 'ex-toolbar' }, tabs, h('div', { class: 'btn-row' }, copyBtn, downBtn, copyAll, downAll)),
        meta,
        code
      ));
      subscribe('', regenerate);
      bus.on('theme:applied', regenerate);
      regenerate();
    }
  });
})();
