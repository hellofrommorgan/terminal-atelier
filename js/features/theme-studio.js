/* Theme Studio — full-app palette switching and live color editing. */
(function () {
  const PALETTE_KEYS = ['crust','mantle','base','surface0','surface1','surface2','overlay0','overlay1','overlay2','subtext0','subtext1','text','rosewater','flamingo','pink','mauve','red','maroon','peach','yellow','green','teal','sky','sapphire','blue','lavender','accent'];
  const EDIT_KEYS = ['base','mantle','surface0','surface1','text','subtext1','overlay1','rosewater','flamingo','pink','mauve','red','maroon','peach','yellow','green','teal','sky','sapphire','blue','lavender'];
  const ACCENT_KEYS = ['rosewater','flamingo','pink','mauve','red','maroon','peach','yellow','green','teal','sky','sapphire','blue','lavender'];

  const PALETTES = [
    { name: 'Catppuccin Mocha', colors: { crust:'#11111b', mantle:'#181825', base:'#1e1e2e', surface0:'#313244', surface1:'#45475a', surface2:'#585b70', overlay0:'#6c7086', overlay1:'#7f849c', overlay2:'#9399b2', subtext0:'#a6adc8', subtext1:'#bac2de', text:'#cdd6f4', rosewater:'#f5e0dc', flamingo:'#f2cdcd', pink:'#f5c2e7', mauve:'#cba6f7', red:'#f38ba8', maroon:'#eba0ac', peach:'#fab387', yellow:'#f9e2af', green:'#a6e3a1', teal:'#94e2d5', sky:'#89dceb', sapphire:'#74c7ec', blue:'#89b4fa', lavender:'#b4befe', accent:'#cba6f7' } },
    { name: 'Catppuccin Macchiato', colors: { crust:'#181926', mantle:'#1e2030', base:'#24273a', surface0:'#363a4f', surface1:'#494d64', surface2:'#5b6078', overlay0:'#6e738d', overlay1:'#8087a2', overlay2:'#939ab7', subtext0:'#a5adcb', subtext1:'#b8c0e0', text:'#cad3f5', rosewater:'#f4dbd6', flamingo:'#f0c6c6', pink:'#f5bde6', mauve:'#c6a0f6', red:'#ed8796', maroon:'#ee99a0', peach:'#f5a97f', yellow:'#eed49f', green:'#a6da95', teal:'#8bd5ca', sky:'#91d7e3', sapphire:'#7dc4e4', blue:'#8aadf4', lavender:'#b7bdf8', accent:'#c6a0f6' } },
    { name: 'Catppuccin Latte', colors: { crust:'#dce0e8', mantle:'#e6e9ef', base:'#eff1f5', surface0:'#ccd0da', surface1:'#bcc0cc', surface2:'#acb0be', overlay0:'#9ca0b0', overlay1:'#8c8fa1', overlay2:'#7c7f93', subtext0:'#6c6f85', subtext1:'#5c5f77', text:'#4c4f69', rosewater:'#dc8a78', flamingo:'#dd7878', pink:'#ea76cb', mauve:'#8839ef', red:'#d20f39', maroon:'#e64553', peach:'#fe640b', yellow:'#df8e1d', green:'#40a02b', teal:'#179299', sky:'#04a5e5', sapphire:'#209fb5', blue:'#1e66f5', lavender:'#7287fd', accent:'#8839ef' } },
    { name: 'Tokyo Night', colors: { crust:'#0f0f14', mantle:'#16161e', base:'#1a1b26', surface0:'#24283b', surface1:'#292e42', surface2:'#3b4261', overlay0:'#565f89', overlay1:'#737aa2', overlay2:'#9aa5ce', subtext0:'#a9b1d6', subtext1:'#c0caf5', text:'#c0caf5', rosewater:'#f4b8e4', flamingo:'#ff9e64', pink:'#bb9af7', mauve:'#9d7cd8', red:'#f7768e', maroon:'#db4b4b', peach:'#ff9e64', yellow:'#e0af68', green:'#9ece6a', teal:'#73daca', sky:'#7dcfff', sapphire:'#2ac3de', blue:'#7aa2f7', lavender:'#b4f9f8', accent:'#7aa2f7' } },
    { name: 'Gruvbox Dark', colors: { crust:'#1d2021', mantle:'#282828', base:'#32302f', surface0:'#3c3836', surface1:'#504945', surface2:'#665c54', overlay0:'#7c6f64', overlay1:'#928374', overlay2:'#a89984', subtext0:'#bdae93', subtext1:'#d5c4a1', text:'#ebdbb2', rosewater:'#d3869b', flamingo:'#fb4934', pink:'#d3869b', mauve:'#b16286', red:'#fb4934', maroon:'#cc241d', peach:'#fe8019', yellow:'#fabd2f', green:'#b8bb26', teal:'#8ec07c', sky:'#83a598', sapphire:'#458588', blue:'#83a598', lavender:'#a89984', accent:'#fabd2f' } },
    { name: 'Nord', colors: { crust:'#242933', mantle:'#2e3440', base:'#3b4252', surface0:'#434c5e', surface1:'#4c566a', surface2:'#5b667a', overlay0:'#6f7c91', overlay1:'#8190a5', overlay2:'#8fbcbb', subtext0:'#d8dee9', subtext1:'#e5e9f0', text:'#eceff4', rosewater:'#d8dee9', flamingo:'#d08770', pink:'#b48ead', mauve:'#b48ead', red:'#bf616a', maroon:'#bf616a', peach:'#d08770', yellow:'#ebcb8b', green:'#a3be8c', teal:'#8fbcbb', sky:'#88c0d0', sapphire:'#81a1c1', blue:'#5e81ac', lavender:'#81a1c1', accent:'#88c0d0' } },
    { name: 'Dracula', colors: { crust:'#191a21', mantle:'#21222c', base:'#282a36', surface0:'#343746', surface1:'#44475a', surface2:'#56596d', overlay0:'#6272a4', overlay1:'#7985b8', overlay2:'#8f9acb', subtext0:'#b6b6c8', subtext1:'#d6d6e2', text:'#f8f8f2', rosewater:'#f1fa8c', flamingo:'#ffb86c', pink:'#ff79c6', mauve:'#bd93f9', red:'#ff5555', maroon:'#c94f6d', peach:'#ffb86c', yellow:'#f1fa8c', green:'#50fa7b', teal:'#8be9fd', sky:'#8be9fd', sapphire:'#57c7ff', blue:'#6272a4', lavender:'#bd93f9', accent:'#bd93f9' } },
    { name: 'Rosé Pine', colors: { crust:'#191724', mantle:'#1f1d2e', base:'#26233a', surface0:'#393552', surface1:'#403d52', surface2:'#524f67', overlay0:'#6e6a86', overlay1:'#908caa', overlay2:'#9a95b8', subtext0:'#b1accc', subtext1:'#c4a7e7', text:'#e0def4', rosewater:'#ebbcba', flamingo:'#f6c177', pink:'#eb6f92', mauve:'#c4a7e7', red:'#eb6f92', maroon:'#b4637a', peach:'#f6c177', yellow:'#f6c177', green:'#31748f', teal:'#9ccfd8', sky:'#9ccfd8', sapphire:'#31748f', blue:'#31748f', lavender:'#c4a7e7', accent:'#ebbcba' } },
    { name: 'Everforest Dark', colors: { crust:'#1e2326', mantle:'#272e33', base:'#2d353b', surface0:'#343f44', surface1:'#3d484d', surface2:'#475258', overlay0:'#56635f', overlay1:'#7a8478', overlay2:'#859289', subtext0:'#9da9a0', subtext1:'#d3c6aa', text:'#d3c6aa', rosewater:'#e67e80', flamingo:'#e69875', pink:'#d699b6', mauve:'#a7c080', red:'#e67e80', maroon:'#f85552', peach:'#e69875', yellow:'#dbbc7f', green:'#a7c080', teal:'#83c092', sky:'#7fbbb3', sapphire:'#7fbbb3', blue:'#7fbbb3', lavender:'#d699b6', accent:'#a7c080' } },
    { name: 'Kanagawa', colors: { crust:'#0d0c0c', mantle:'#16161d', base:'#1f1f28', surface0:'#2a2a37', surface1:'#363646', surface2:'#54546d', overlay0:'#727169', overlay1:'#8a8980', overlay2:'#a6a69c', subtext0:'#c8c093', subtext1:'#dcd7ba', text:'#dcd7ba', rosewater:'#d27e99', flamingo:'#ffa066', pink:'#d27e99', mauve:'#957fb8', red:'#c34043', maroon:'#e46876', peach:'#ffa066', yellow:'#c0a36e', green:'#76946a', teal:'#6a9589', sky:'#7e9cd8', sapphire:'#7fb4ca', blue:'#7e9cd8', lavender:'#938aa9', accent:'#7e9cd8' } },
    { name: 'Solarized Dark', colors: { crust:'#00212b', mantle:'#002b36', base:'#073642', surface0:'#0b3a46', surface1:'#174652', surface2:'#28545f', overlay0:'#586e75', overlay1:'#657b83', overlay2:'#839496', subtext0:'#93a1a1', subtext1:'#eee8d5', text:'#fdf6e3', rosewater:'#d33682', flamingo:'#cb4b16', pink:'#d33682', mauve:'#6c71c4', red:'#dc322f', maroon:'#cb4b16', peach:'#cb4b16', yellow:'#b58900', green:'#859900', teal:'#2aa198', sky:'#268bd2', sapphire:'#268bd2', blue:'#268bd2', lavender:'#6c71c4', accent:'#268bd2' } }
  ];

  App.injectCSS('theme-studio', `
.ts-themes{grid-template-columns:repeat(auto-fit,minmax(188px,1fr))}
.ts-card{position:relative;display:flex;flex-direction:column;gap:10px;cursor:pointer;min-height:86px;transition:all var(--speed)}
.ts-card:hover{border-color:var(--overlay0);transform:translateY(-1px)}
.ts-card.ts-selected{border-color:var(--accent);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 45%,transparent);background:color-mix(in srgb,var(--accent) 12%,var(--surface0))}
.ts-card.ts-selected::after{content:"✓";position:absolute;top:7px;right:8px;width:18px;height:18px;display:grid;place-items:center;border:1px solid var(--accent);border-radius:50%;background:var(--base);color:var(--accent);font-size:12px;font-weight:800;line-height:1}
.ts-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;color:var(--text);font-size:12px;padding-right:22px}
.ts-card-head small{color:var(--accent);font-size:10px;font-weight:600}
.ts-swatches{display:flex;gap:3px;align-items:center;flex-wrap:wrap}
.ts-swatch{width:16px;height:16px;border-radius:4px;border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
.ts-editor{display:grid;grid-template-columns:repeat(auto-fit,minmax(144px,1fr));gap:8px}
.ts-color{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px;border:1px solid var(--surface0);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--surface0) 24%,transparent)}
.ts-color span{font-size:10px;color:var(--subtext0);letter-spacing:.03em}
.ts-color input{flex:none}
.ts-contrast{display:grid;grid-template-columns:1fr;gap:9px}
.ts-meter{display:grid;grid-template-columns:minmax(120px,.7fr) minmax(190px,1fr) auto;align-items:center;gap:12px;padding:7px 0;border-bottom:1px dashed var(--surface0)}
.ts-meter:last-child{border-bottom:0}
.ts-meter strong{color:var(--text);font-size:12px;font-weight:700}
.ts-ratio{color:var(--text);font-size:12px;font-weight:700;white-space:nowrap}
.ts-bar-wrap{display:grid;gap:4px}
.ts-bar{position:relative;height:8px;background:var(--surface0);border-radius:999px;overflow:visible}
.ts-fill{display:block;height:100%;border-radius:999px;background:var(--accent)}
.ts-tick{position:absolute;top:-3px;width:1px;height:14px;background:var(--text);opacity:.75}
.ts-tick b{position:absolute;top:15px;left:50%;transform:translateX(-50%);font-size:9px;color:var(--overlay1);font-weight:600;letter-spacing:.04em}
.ts-aa{left:17.5%}.ts-aaa{left:30%}
.ts-scale{display:flex;justify-content:space-between;color:var(--overlay0);font-size:9px;line-height:1.2}
.ts-meter .row-flex{justify-content:flex-end}
.ts-preview{border:1px solid var(--surface0);border-radius:var(--radius);padding:18px;background:var(--base);color:var(--text)}
.ts-preview .ts-sub{color:var(--subtext1)}
.ts-preview .ts-accent{color:var(--accent);font-weight:700}
.ts-actions{justify-content:space-between}
@media(max-width:720px){.ts-meter{grid-template-columns:1fr}.ts-meter .row-flex{justify-content:flex-start}}
  `);

  function cloneColors(colors) {
    const out = {};
    PALETTE_KEYS.forEach(k => out[k] = colors[k]);
    return out;
  }
  function paletteByName(name) { return PALETTES.find(p => p.name === name) || PALETTES[0]; }
  function cleanHex(v) { return /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : '#000000'; }
  function currentTheme(ctx) {
    const theme = ctx.get('theme') || {};
    const base = cloneColors(paletteByName(theme.name).colors);
    const colors = Object.assign(base, theme.colors || {});
    if (!colors.accent) colors.accent = colors.mauve || colors.blue;
    return { name: theme.name || PALETTES[0].name, colors };
  }
  function setTheme(ctx, name, colors) {
    const next = cloneColors(colors);
    ctx.applyTheme(next);
    ctx.set('theme', { name, colors: next });
  }
  function hexToRgb(hex) {
    const h = cleanHex(hex).slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function luminance(hex) {
    return hexToRgb(hex).map(v => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  function contrast(fg, bg) {
    const a = luminance(fg), b = luminance(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  function badge(h, ok, text) { return h('span', { class: 'tag-pill ' + (ok ? 'on' : 'off') }, text); }

  App.registerFeature({
    id: 'theme-studio', title: 'Theme Studio', icon: '◑', order: 20,
    subtitle: 'Swap palettes. Fine-tune every color. Check WCAG contrast — all live.',
    mount(el, ctx) {
      const { h, subscribe } = ctx;
      const themeGrid = h('div', { class: 'grid ts-themes' });
      const editor = h('div', { class: 'ts-editor' });
      const accentRow = h('div', { class: 'btn-row' });
      const contrastBox = h('div', { class: 'ts-contrast' });
      const codeBox = h('pre', { class: 'codeblock' });

      function applyEdit(key, value) {
        const t = currentTheme(ctx);
        t.colors[key] = cleanHex(value);
        setTheme(ctx, t.name, t.colors);
      }
      function applyAccent(key) {
        const t = currentTheme(ctx);
        t.colors.accent = t.colors[key];
        setTheme(ctx, t.name, t.colors);
      }
      function varsText(colors) {
        return ':root {\n' + PALETTE_KEYS.map(k => `  --${k}: ${colors[k]};`).join('\n') + '\n}';
      }
      function renderContrast(colors) {
        contrastBox.innerHTML = '';
        [
          ['text on base', colors.text, colors.base],
          ['subtext1 on surface0', colors.subtext1, colors.surface0],
          ['accent on base', colors.accent, colors.base]
        ].forEach(([label, fg, bg]) => {
          const r = contrast(fg, bg);
          const pct = Math.max(0, Math.min(100, ((r - 1) / 20) * 100));
          contrastBox.appendChild(h('div', { class: 'ts-meter', title: `${fg} → ${bg}` },
            h('strong', {}, label),
            h('div', { class: 'ts-bar-wrap' },
              h('div', { class: 'ts-bar' },
                h('i', { class: 'ts-fill', style: { width: pct.toFixed(1) + '%' } }),
                h('span', { class: 'ts-tick ts-aa' }, h('b', {}, 'AA')),
                h('span', { class: 'ts-tick ts-aaa' }, h('b', {}, 'AAA'))),
              h('div', { class: 'ts-scale' }, h('span', {}, '1:1'), h('span', {}, '21:1'))),
            h('div', { class: 'row-flex' }, h('span', { class: 'ts-ratio tnum' }, r.toFixed(2) + ' : 1'), badge(h, r >= 4.5, 'AA'), badge(h, r >= 7, 'AAA'))));
        });
        contrastBox.appendChild(h('div', { class: 'preview-surface ts-preview' },
          h('div', {}, 'atelier theme preview · ', h('span', { class: 'ts-accent' }, 'accent command')), 
          h('div', { class: 'ts-sub' }, 'Subtext against the active surface shows how panels, nav, and hints will read.')));
      }
      function render() {
        const t = currentTheme(ctx);
        themeGrid.innerHTML = '';
        PALETTES.forEach(p => {
          const swatchKeys = ['base','surface0','text','mauve','red','peach','yellow','green','teal','blue','lavender'];
          themeGrid.appendChild(h('div', { class: 'card ts-card' + (t.name === p.name ? ' ts-selected' : ''), onclick: () => setTheme(ctx, p.name, p.colors) },
            h('div', { class: 'ts-card-head' }, h('span', {}, p.name), t.name === p.name ? h('small', {}, 'active') : null),
            h('div', { class: 'ts-swatches' }, swatchKeys.map(k => h('i', { class: 'ts-swatch', title: k, style: { background: p.colors[k] } })))));
        });

        editor.innerHTML = '';
        EDIT_KEYS.forEach(key => {
          const input = h('input', { type: 'color', value: cleanHex(t.colors[key]), 'aria-label': key, oninput: e => applyEdit(key, e.target.value) });
          editor.appendChild(h('label', { class: 'ts-color' }, h('span', {}, key), input));
        });

        accentRow.innerHTML = '';
        ACCENT_KEYS.forEach(key => accentRow.appendChild(h('span', { class: 'chip' + (cleanHex(t.colors.accent) === cleanHex(t.colors[key]) ? ' on' : ''), onclick: () => applyAccent(key) }, key)));

        renderContrast(t.colors);
        codeBox.textContent = varsText(t.colors);
      }

      const shuffle = h('span', { class: 'btn', onclick: () => applyAccent(ACCENT_KEYS[Math.floor(Math.random() * ACCENT_KEYS.length)]) }, 'shuffle accent');
      const copyBtn = h('span', { class: 'btn primary', onclick: () => ctx.copy(varsText(currentTheme(ctx).colors)) }, 'copy CSS vars');
      const downloadBtn = h('span', { class: 'btn ghost', onclick: () => ctx.download('atelier-theme.css', varsText(currentTheme(ctx).colors)) }, 'download');

      el.appendChild(h('div', { class: 'stack' },
        h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '01'), ' built-in palettes'), themeGrid),
        h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '02'), ' contrast checker'), contrastBox),
        h('div', { class: 'split adv-only' },
          h('div', { class: 'stack' },
            h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '03'), ' custom editor'), editor),
            h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '04'), ' accent'), accentRow, h('hr', { class: 'sep' }), h('div', { class: 'row-flex ts-actions' }, shuffle, copyBtn, downloadBtn))),
          codeBox)));

      subscribe('theme', render);
      render();
    }
  });
})();
