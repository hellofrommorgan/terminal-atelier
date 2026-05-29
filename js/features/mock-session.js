/* Live Mock Session — static terminal scenes rendered with the live preview font/theme. */
(function () {
  const ID = 'mock-session';

  App.injectCSS(ID, `
    .ms-wrap{display:flex;flex-direction:column;gap:12px}
    .ms-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .ms-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .ms-terminal{border:1px solid color-mix(in srgb,var(--surface1) 70%,var(--crust));border-radius:14px;overflow:hidden;background:var(--base);box-shadow:0 24px 70px -28px rgba(0,0,0,.82),0 0 0 1px color-mix(in srgb,var(--accent) 10%,transparent),inset 0 1px 0 color-mix(in srgb,var(--text) 7%,transparent)}
    .ms-chrome{height:36px;display:flex;align-items:center;gap:10px;padding:0 13px;background:linear-gradient(180deg,color-mix(in srgb,var(--surface0) 70%,var(--base)),var(--mantle));border-bottom:1px solid var(--crust);font-family:var(--mono)}
    .ms-lights{display:flex;gap:7px}.ms-lights i{width:11px;height:11px;border-radius:50%;display:block}.ms-lights .r{background:var(--red)}.ms-lights .y{background:var(--yellow)}.ms-lights .g{background:var(--green)}
    .ms-title{font-size:11px;color:var(--overlay2);white-space:nowrap}.ms-title b{color:var(--text);font-weight:700}.ms-spacer{flex:1}.ms-badge{font-size:10px;color:var(--overlay1);border:1px solid var(--surface1);border-radius:999px;padding:2px 8px;background:color-mix(in srgb,var(--surface0) 55%,transparent)}
    .ms-surface{min-height:470px;max-height:min(64vh,680px);overflow:auto;padding:18px 20px 22px;color:var(--text);background:radial-gradient(760px 280px at 72% -22%,color-mix(in srgb,var(--accent) 12%,transparent),transparent 70%),linear-gradient(180deg,color-mix(in srgb,var(--base) 97%,var(--surface0)),var(--base));white-space:pre;tab-size:2;text-shadow:0 0 18px color-mix(in srgb,var(--text) 7%,transparent);font-variant-ligatures:normal}
    .ms-surface .tnum{font-variant-numeric:tabular-nums;font-feature-settings:var(--pv-feat),"tnum" 1}
    .ms-line{display:block;min-height:calc(1em * var(--pv-lh))}.ms-prompt-line{display:flex;align-items:center;gap:.55em;margin-bottom:.78em;white-space:normal}.ms-command{color:var(--subtext1)}
    .ms-power{display:inline-flex;align-items:stretch;filter:drop-shadow(0 3px 10px rgba(0,0,0,.16));font-family:inherit;font-size:.82em;line-height:1.75}.ms-seg{display:inline-flex;align-items:center;padding:0 .72em;font-weight:700}.ms-sep{width:0;height:0;border-top:.875em solid transparent;border-bottom:.875em solid transparent;border-left:.72em solid var(--seg-bg);margin-right:-1px}
    .ms-defprompt{color:var(--green);font-weight:700}.ms-path{color:var(--blue)}.ms-glyph{color:var(--mauve)}
    .ms-section{margin:0 0 1.35em}.ms-section:not(:last-child){padding-bottom:1.1em;border-bottom:1px dashed color-mix(in srgb,var(--surface1) 70%,transparent)}.ms-section-title{display:block;color:var(--overlay1);font-family:inherit;font-size:.78em;letter-spacing:.12em;text-transform:uppercase;margin:0 0 .7em}
    .ms-kw{color:var(--mauve);font-weight:650}.ms-str{color:var(--green)}.ms-fn{color:var(--blue)}.ms-cmt{color:var(--overlay1);font-style:italic}.ms-num{color:var(--peach);font-variant-numeric:tabular-nums}.ms-op{color:var(--sky)}.ms-var{color:var(--lavender)}.ms-punc{color:var(--overlay2)}
    .ms-dir{color:var(--blue);font-weight:700}.ms-exe{color:var(--green);font-weight:700}.ms-link{color:var(--teal)}.ms-arc{color:var(--red);font-weight:700}.ms-muted{color:var(--overlay1)}.ms-dim{color:var(--overlay0)}.ms-head{color:var(--yellow);font-weight:700}.ms-ref{color:var(--mauve);font-weight:700}.ms-branch{color:var(--green);font-weight:700}.ms-hash{color:var(--peach)}.ms-add{color:var(--green)}.ms-mod{color:var(--yellow)}.ms-del{color:var(--red)}
    .ms-neo{display:grid;grid-template-columns:max-content minmax(220px,1fr);gap:2.3em;align-items:start}.ms-logo{color:var(--mauve);font-weight:800;line-height:1.08;text-shadow:0 0 24px color-mix(in srgb,var(--mauve) 30%,transparent)}.ms-info-row{display:block}.ms-key{color:var(--accent);font-weight:800}.ms-val{color:var(--text)}.ms-swatches{display:flex;gap:.35em;margin-top:.6em}.ms-swatch{width:1.15em;height:.72em;border-radius:2px;box-shadow:0 0 0 1px color-mix(in srgb,var(--text) 18%,transparent) inset}
    .ms-cursor{display:inline-block;vertical-align:-0.08em;margin-left:.08em;background:var(--rosewater);box-shadow:0 0 14px color-mix(in srgb,var(--rosewater) 55%,transparent)}.ms-cursor.ms-bar{width:.12em;height:1.18em}.ms-cursor.ms-block{width:.68em;height:1.1em}.ms-cursor.ms-underline{width:.72em;height:.16em;vertical-align:-.34em}.ms-cursor.ms-blink{animation:ms-blink 1.05s steps(2,start) infinite}@keyframes ms-blink{50%{opacity:.16}}
    @media(max-width:720px){.ms-surface{padding:14px;min-height:380px}.ms-neo{grid-template-columns:1fr;gap:.8em}.ms-badge{display:none}}
    .preview-dock-body .ms-wrap{height:100%;min-height:0}
    .preview-dock-body .ms-toolbar{flex:none}
    .preview-dock-body .ms-terminal{flex:1;min-height:0;display:flex;flex-direction:column}
    .preview-dock-body .ms-surface{flex:1;min-height:0;max-height:none}
  `);

  const SCENES = [
    ['code', 'code'], ['ls', 'ls -la'], ['git', 'git'], ['neofetch', 'neofetch'], ['all', 'all']
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function color(v, fallback) {
    if (!v) return fallback;
    if (String(v).startsWith('#') || String(v).startsWith('rgb') || String(v).startsWith('hsl') || String(v).startsWith('var(')) return v;
    return `var(--${String(v).replace(/^--/, '')})`;
  }

  function segLabel(seg) {
    return seg.label || seg.text || seg.value || seg.name || seg.title || seg.type || 'seg';
  }

  function promptHTML(ctx, command) {
    const p = ctx.get('prompt') || {};
    const segs = Array.isArray(p.segments) ? p.segments.filter(Boolean) : [];
    if (segs.length) {
      const pieces = segs.slice(0, 6).map((seg, i) => {
        const bg = color(seg.bg || seg.background || seg.color || seg.accent, ['var(--mauve)', 'var(--blue)', 'var(--teal)', 'var(--green)', 'var(--peach)', 'var(--pink)'][i % 6]);
        const fg = color(seg.fg || seg.foreground || seg.textColor, 'var(--crust)');
        return `<span class="ms-seg" style="background:${bg};color:${fg}">${esc(seg.icon ? seg.icon + ' ' : '')}${esc(segLabel(seg))}</span><span class="ms-sep" style="--seg-bg:${bg}"></span>`;
      }).join('');
      return `<span class="ms-power">${pieces}</span><span class="ms-command">${esc(command)}</span>`;
    }
    return `<span class="ms-defprompt">dev@atelier</span><span class="ms-dim">:</span><span class="ms-path">~/terminal-specimen</span><span class="ms-glyph"> ❯</span><span class="ms-command"> ${esc(command)}</span>`;
  }

  function cursorHTML(ctx) {
    const c = ctx.get('cursor') || {};
    const style = ['block', 'bar', 'underline'].includes(c.style) ? c.style : 'bar';
    const blink = c.blink === false ? '' : ' ms-blink';
    const col = color(c.color, 'var(--rosewater)');
    return `<span class="ms-cursor ms-${style}${blink}" style="background:${col};box-shadow:0 0 14px color-mix(in srgb,${col} 55%,transparent)">&nbsp;</span>`;
  }

  function promptLine(ctx, command) {
    return `<span class="ms-prompt-line">${promptHTML(ctx, command)}</span>`;
  }

  function fontLabel(ctx) {
    const f = ctx.get('font') || {};
    const family = f.family || 'Geist Mono';
    const size = f.size || 15;
    const weight = f.variable ? (f.wght || 400) : 400;
    return `${esc(family)} <span class="tnum">${esc(size)} px</span> / <span class="tnum">${esc(weight)}</span>`;
  }

  function cursorLabel(ctx) {
    const c = ctx.get('cursor') || {};
    const style = ['block', 'bar', 'underline'].includes(c.style) ? c.style : 'bar';
    return `${esc(style)}${c.blink === false ? '' : ' blink'}`;
  }

  function themeLabel(ctx) {
    const t = ctx.get('theme') || {};
    return esc(t.name || 'Catppuccin Mocha');
  }

  function codeScene(ctx, compact) {
    return `${promptLine(ctx, 'pnpm atelier:preview --scene code')}` +
`<span class="ms-line"><span class="ms-cmt">// ligatures, weights, rhythm: =&gt; != &gt;= -&gt;</span></span>
<span class="ms-line"><span class="ms-kw">type</span> <span class="ms-var">ThemeName</span> <span class="ms-op">=</span> <span class="ms-str">'mocha'</span> <span class="ms-op">|</span> <span class="ms-str">'latte'</span><span class="ms-punc">;</span></span>
<span class="ms-line"><span class="ms-kw">const</span> <span class="ms-fn">renderPrompt</span> <span class="ms-op">=</span> <span class="ms-punc">(</span><span class="ms-var">segments</span><span class="ms-punc">)</span> <span class="ms-op">=&gt;</span> <span class="ms-var">segments</span></span>
<span class="ms-line">  <span class="ms-punc">.</span><span class="ms-fn">filter</span><span class="ms-punc">(</span><span class="ms-var">s</span> <span class="ms-op">=&gt;</span> <span class="ms-var">s</span><span class="ms-punc">.</span><span class="ms-var">visible</span> <span class="ms-op">!=</span> <span class="ms-kw">false</span><span class="ms-punc">)</span></span>
<span class="ms-line">  <span class="ms-punc">.</span><span class="ms-fn">map</span><span class="ms-punc">(</span><span class="ms-var">s</span> <span class="ms-op">=&gt;</span> <span class="ms-str">\`◆ \${s.label}\`</span><span class="ms-punc">)</span><span class="ms-punc">;</span></span>
<span class="ms-line"><span class="ms-kw">if</span> <span class="ms-punc">(</span><span class="ms-var">fps</span> <span class="ms-op">&gt;=</span> <span class="ms-num tnum">60</span><span class="ms-punc">)</span> <span class="ms-fn">ship</span><span class="ms-punc">(</span><span class="ms-str">'gorgeous'</span><span class="ms-punc">)</span><span class="ms-punc">;</span>${compact ? '' : '\n<span class="ms-line"><span class="ms-dim">// static mock shell, live rendered in your selected font</span></span>'}</span>`;
  }

  function lsScene(ctx) {
    return `${promptLine(ctx, 'ls -la ~/atelier')}` +
`<span class="ms-line"><span class="ms-head">total <span class="tnum">128</span></span> <span class="ms-muted">drwxr-xr-x  <span class="tnum">12</span> dev staff   <span class="tnum">384</span> May <span class="tnum">29</span> <span class="tnum">08:17</span> .</span></span>
<span class="ms-line"><span class="ms-muted">drwxr-xr-x  <span class="tnum">48</span> dev staff  <span class="tnum">1536</span> May <span class="tnum">29</span> <span class="tnum">08:16</span> ..</span></span>
<span class="ms-line">drwxr-xr-x   <span class="tnum">6</span> dev staff   <span class="tnum">192</span> May <span class="tnum">29</span> <span class="tnum">08:14</span> <span class="ms-dir">features</span>/</span>
<span class="ms-line">-rwxr-xr-x   <span class="tnum">1</span> dev staff  <span class="tnum">4096</span> May <span class="tnum">29</span> <span class="tnum">08:10</span> <span class="ms-exe">atelier</span>*</span>
<span class="ms-line">lrwxr-xr-x   <span class="tnum">1</span> dev staff    <span class="tnum">18</span> May <span class="tnum">29</span> <span class="tnum">08:11</span> <span class="ms-link">theme.json</span> -&gt; catppuccin/mocha</span>
<span class="ms-line">-rw-r--r--   <span class="tnum">1</span> dev staff  <span class="tnum">8192</span> May <span class="tnum">29</span> <span class="tnum">08:12</span> <span class="ms-arc">release.tar.gz</span></span>
<span class="ms-line">-rw-r--r--   <span class="tnum">1</span> dev staff  <span class="tnum">2264</span> May <span class="tnum">29</span> <span class="tnum">08:17</span> README.md</span>`;
  }

  function gitScene(ctx) {
    return `${promptLine(ctx, 'git status --short && git log --oneline --graph -4')}` +
`<span class="ms-line"><span class="ms-branch">## feature/live-preview</span>...origin/main</span>
<span class="ms-line"> <span class="ms-mod">M</span> js/features/mock-session.js</span>
<span class="ms-line"> <span class="ms-add">A</span> css/catppuccin-preview.css</span>
<span class="ms-line"></span>
<span class="ms-line">* <span class="ms-hash tnum">8f42c1a</span> <span class="ms-ref">(HEAD -&gt; feature/live-preview)</span> polish viewport glow</span>
<span class="ms-line">* <span class="ms-hash tnum">6a17b90</span> add cursor studio hooks</span>
<span class="ms-line">* <span class="ms-hash tnum">35d9e2f</span> <span class="ms-ref">(origin/main)</span> wire theme bus</span>
<span class="ms-line">* <span class="ms-hash tnum">1c0ffee</span> initial atelier shell</span>`;
  }

  function neofetchScene(ctx) {
    return `${promptLine(ctx, 'neofetch --theme catppuccin')}` +
`<span class="ms-neo"><span class="ms-logo">      ◆◆◆
   ◆◆◆◆◆◆◆
 ◆◆  ◆◆◆  ◆◆
◆◆◆◆◆◆◆◆◆◆◆
  ╭────────╮
  │ ATELIER  │
  ╰────────╯
    ◆◆   ◆◆</span><span><span class="ms-info-row"><span class="ms-key">OS</span><span class="ms-muted">:</span> <span class="ms-val">Atelier Workstation</span></span>
<span class="ms-info-row"><span class="ms-key">Shell</span><span class="ms-muted">:</span> <span class="ms-val">zsh <span class="tnum">5.9</span> -&gt; preview</span></span>
<span class="ms-info-row"><span class="ms-key">Uptime</span><span class="ms-muted">:</span> <span class="ms-val tnum">3h 42m</span></span>
<span class="ms-info-row"><span class="ms-key">Memory</span><span class="ms-muted">:</span> <span class="ms-val"><span class="tnum">4.8 GiB</span> / <span class="tnum">16 GiB</span></span></span>
<span class="ms-info-row"><span class="ms-key">Font</span><span class="ms-muted">:</span> <span class="ms-val">${fontLabel(ctx)}</span></span>
<span class="ms-info-row"><span class="ms-key">Theme</span><span class="ms-muted">:</span> <span class="ms-val">${themeLabel(ctx)}</span></span>
<span class="ms-info-row"><span class="ms-key">Cursor</span><span class="ms-muted">:</span> <span class="ms-val">${cursorLabel(ctx)}</span></span>
<span class="ms-swatches"><i class="ms-swatch" style="background:var(--red)"></i><i class="ms-swatch" style="background:var(--peach)"></i><i class="ms-swatch" style="background:var(--yellow)"></i><i class="ms-swatch" style="background:var(--green)"></i><i class="ms-swatch" style="background:var(--teal)"></i><i class="ms-swatch" style="background:var(--blue)"></i><i class="ms-swatch" style="background:var(--mauve)"></i></span></span></span>`;
  }

  function section(title, html) {
    return `<span class="ms-section"><span class="ms-section-title">${esc(title)}</span>${html}</span>`;
  }

  function sceneHTML(ctx, scene) {
    if (scene === 'code') return codeScene(ctx);
    if (scene === 'ls') return lsScene(ctx);
    if (scene === 'git') return gitScene(ctx);
    if (scene === 'neofetch') return neofetchScene(ctx);
    return section('code', codeScene(ctx, true)) + section('ls -la', lsScene(ctx)) + section('git', gitScene(ctx)) + section('neofetch', neofetchScene(ctx));
  }

  function plainScene(scene) {
    const text = {
      code: 'atelier@preview ~/terminal-specimen ❯ pnpm atelier:preview --scene code\n// ligatures: => != >= ->\ntype ThemeName = \'mocha\' | \'latte\';\nconst renderPrompt = (segments) => segments.filter(s => s.visible != false).map(s => `◆ ${s.label}`);',
      ls: 'atelier@preview ~/atelier ❯ ls -la\ntotal 128\ndrwxr-xr-x features/\n-rwxr-xr-x atelier*\ntheme.json -> catppuccin/mocha\nrelease.tar.gz',
      git: 'atelier@preview ~/atelier ❯ git status --short && git log --oneline --graph -4\n## feature/live-preview...origin/main\n M js/features/mock-session.js\n* 8f42c1a (HEAD -> feature/live-preview) polish viewport glow',
      neofetch: 'atelier@preview ~/atelier ❯ neofetch\n◆◆◆ ATELIER ◆◆◆\nOS: Atelier Workstation\nFont: live preview-surface\nTheme: Catppuccin palette vars',
      all: 'Live Preview: code + ls + git + neofetch scenes stacked.'
    };
    return text[scene] || text.code;
  }

  // Mounted once by the shell into the persistent preview dock (not a nav panel),
  // so the live terminal stays visible alongside every feature in both modes.
  App.mountLivePreview = function (el, ctx) {
    if (!el || el.dataset.lpMounted) return;
    el.dataset.lpMounted = '1';
    ctx = ctx || App.ctx();
    const { h, subscribe, bus, copy } = ctx;
    let scene = 'code';

    const sceneRow = h('div', { class: 'btn-row' });
    SCENES.forEach(([key, label]) => sceneRow.appendChild(h('span', { class: 'btn', 'data-scene': key, onclick: () => { scene = key; render(); } }, label)));
    const copyBtn = h('span', { class: 'btn ghost', onclick: () => copy(plainScene(scene)) }, 'copy transcript');
    const surface = h('div', { class: 'ms-surface preview-surface', role: 'img', 'aria-label': 'Live terminal preview' });

    el.appendChild(h('div', { class: 'ms-wrap' },
      h('div', { class: 'ms-toolbar' }, h('label', { class: 'field' }, 'scene', sceneRow), h('div', { class: 'ms-tools' }, copyBtn)),
      h('div', { class: 'ms-terminal' },
        h('div', { class: 'ms-chrome' },
          h('span', { class: 'ms-lights' }, h('i', { class: 'r' }), h('i', { class: 'y' }), h('i', { class: 'g' })),
          h('span', { class: 'ms-title', html: '<b>atelier</b> — live preview' }),
          h('span', { class: 'ms-spacer' }),
          h('span', { class: 'ms-badge' }, 'preview-surface')),
        surface)));

    function render() {
      sceneRow.querySelectorAll('.btn').forEach(btn => btn.classList.toggle('sel', btn.dataset.scene === scene));
      surface.innerHTML = sceneHTML(ctx, scene) + cursorHTML(ctx);
    }

    subscribe('font', render);
    subscribe('cursor', render);
    subscribe('prompt', render);
    subscribe('theme', render);
    bus.on('theme:applied', render);
    bus.on('preset:applied', render);
    render();
  };
})();
