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
    .ms-tui{display:grid;gap:8px;white-space:normal;font-family:inherit;font-size:calc(var(--pv-size) * .86);line-height:1.28;letter-spacing:var(--pv-tracking);font-style:var(--pv-style);font-feature-settings:var(--pv-feat)}.ms-lg-head{display:flex;gap:10px;align-items:center;padding:7px 10px;border-radius:9px;background:linear-gradient(90deg,color-mix(in srgb,var(--mauve) 38%,var(--surface0)),color-mix(in srgb,var(--blue) 28%,var(--surface0)));font-weight:850}.ms-lg-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ms-pane{min-width:0;border:1px solid var(--surface1);border-radius:9px;background:color-mix(in srgb,var(--mantle) 76%,transparent);overflow:hidden}.ms-pane-title{display:block;padding:4px 8px;color:var(--subtext0);background:var(--surface0);border-bottom:1px solid var(--surface1);font-size:.78em;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.ms-pane-body{display:block;padding:7px 9px;overflow:hidden}.ms-tui-line{display:flex;gap:.6em;align-items:baseline;min-width:0}.ms-grow{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ms-tag{display:inline-block;padding:.08em .42em;border-radius:4px;background:var(--surface0);font-weight:800}.ms-selected{background:color-mix(in srgb,var(--blue) 20%,transparent)}.ms-lg-wide{grid-column:1 / -1}.ms-diff-preview{background:color-mix(in srgb,var(--crust) 50%,transparent);border-radius:6px;padding:5px 7px;white-space:pre;overflow:hidden}
    .ms-nvim{border:1px solid var(--surface1);border-radius:10px;overflow:hidden;background:color-mix(in srgb,var(--crust) 40%,transparent);white-space:normal}.ms-nvim-top{display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--mantle);border-bottom:1px solid var(--surface1);font-size:.78em;color:var(--subtext0)}.ms-dot{width:.55em;height:.55em;border-radius:50%;background:var(--green);box-shadow:1.1em 0 0 var(--yellow),2.2em 0 0 var(--red);margin-right:2em}.ms-nvim-code{display:grid;grid-template-columns:max-content 1fr;column-gap:12px;padding:10px 12px 8px;white-space:pre;overflow:hidden}.ms-ln{color:var(--overlay0);text-align:right;user-select:none;font-variant-numeric:tabular-nums}.ms-code-text{min-width:0;color:var(--text)}.ms-status{display:flex;align-items:center;gap:8px;padding:4px 8px;background:var(--surface0);font-size:.78em}.ms-mode{background:var(--green);color:var(--crust);font-weight:900;padding:1px 7px;border-radius:4px}.ms-right{margin-left:auto;color:var(--subtext0)}
    .ms-bar{display:inline-flex;width:6.8em;height:.82em;border-radius:999px;overflow:hidden;background:var(--surface0);box-shadow:0 0 0 1px var(--surface1) inset}.ms-fill{display:block;height:100%;background:var(--green)}.ms-fill.warn{background:var(--yellow)}.ms-fill.hot{background:var(--red)}.ms-htop-head{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.ms-load{display:flex;flex-wrap:wrap;gap:1em;color:var(--subtext0);font-size:.82em}.ms-proc{width:100%;border-collapse:collapse;white-space:nowrap}.ms-proc th{color:var(--mauve);font-size:.78em;text-align:left;font-weight:800}.ms-proc td{padding:1px 8px 1px 0;color:var(--text)}.ms-proc tr:nth-child(even) td{background:color-mix(in srgb,var(--surface0) 28%,transparent)}
    .ms-udiff{display:block;border:1px solid var(--surface1);border-radius:10px;overflow:hidden;background:color-mix(in srgb,var(--crust) 42%,transparent);white-space:pre}.ms-diff-file{display:block;padding:6px 9px;background:var(--mantle);border-bottom:1px solid var(--surface1);color:var(--blue);font-weight:800}.ms-hunk{display:block;color:var(--mauve);background:color-mix(in srgb,var(--mauve) 11%,transparent)}.ms-dline{display:block;padding:0 9px}.ms-dadd{color:var(--green);background:color-mix(in srgb,var(--green) 12%,transparent)}.ms-drem{color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent)}.ms-dctx{color:var(--subtext0)}
    .ms-cursor{display:inline-block;vertical-align:-0.08em;margin-left:.08em;background:var(--rosewater);box-shadow:0 0 14px color-mix(in srgb,var(--rosewater) 55%,transparent)}.ms-cursor.ms-bar{width:.12em;height:1.18em}.ms-cursor.ms-block{width:.68em;height:1.1em}.ms-cursor.ms-underline{width:.72em;height:.16em;vertical-align:-.34em}.ms-cursor.ms-blink{animation:ms-blink 1.05s steps(2,start) infinite}@keyframes ms-blink{50%{opacity:.16}}
    @media(max-width:720px){.ms-surface{padding:14px;min-height:380px}.ms-neo{grid-template-columns:1fr;gap:.8em}.ms-badge{display:none}}
    .preview-dock-body .ms-wrap{height:100%;min-height:0}
    .preview-dock-body .ms-toolbar{flex:none}
    .preview-dock-body .ms-terminal{flex:1;min-height:0;display:flex;flex-direction:column}
    .preview-dock-body .ms-surface{flex:1;min-height:0;max-height:none}
  `);

  const SCENES = [
    ['code', 'code'], ['ls', 'ls -la'], ['git', 'git'], ['neofetch', 'neofetch'], ['neovim', 'neovim'], ['lazygit', 'lazygit'], ['htop', 'htop'], ['diff', 'git diff'], ['all', 'all']
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

  function neovimScene(ctx) {
    return `${promptLine(ctx, 'nvim js/features/mock-session.js')}` +
`<span class="ms-nvim"><span class="ms-nvim-top"><i class="ms-dot"></i><span class="ms-branch"> mock-session.js</span><span class="ms-muted">atelier</span></span><span class="ms-nvim-code"><span class="ms-ln tnum">  1
  2
  3
  4
  5
  6
  7
  8
  9
 10</span><span class="ms-code-text"><span class="ms-cmt">// live preview scenes react to --pv-* font vars</span>
<span class="ms-kw">const</span> <span class="ms-var">palette</span> <span class="ms-op">=</span> <span class="ms-punc">{</span>
  <span class="ms-var">keyword</span><span class="ms-punc">:</span> <span class="ms-str">'mauve'</span><span class="ms-punc">,</span> <span class="ms-var">string</span><span class="ms-punc">:</span> <span class="ms-str">'green'</span><span class="ms-punc">,</span>
  <span class="ms-var">number</span><span class="ms-punc">:</span> <span class="ms-str">'peach'</span><span class="ms-punc">,</span> <span class="ms-var">comment</span><span class="ms-punc">:</span> <span class="ms-str">'overlay0'</span>
<span class="ms-punc">};</span>
<span class="ms-kw">function</span> <span class="ms-fn">mountScene</span><span class="ms-punc">(</span><span class="ms-var">name</span><span class="ms-punc">)</span> <span class="ms-punc">{</span>
  <span class="ms-kw">return</span> <span class="ms-var">SCENES</span><span class="ms-punc">.</span><span class="ms-fn">find</span><span class="ms-punc">(</span><span class="ms-var">s</span> <span class="ms-op">=&gt;</span> <span class="ms-var">s</span><span class="ms-punc">[</span><span class="ms-num tnum">0</span><span class="ms-punc">]</span> <span class="ms-op">===</span> <span class="ms-var">name</span><span class="ms-punc">);</span>
<span class="ms-punc">}</span>
<span class="ms-cmt">// NORMAL mode, 10 lines, utf-8</span>
<span class="ms-var">render</span><span class="ms-punc">();</span></span></span><span class="ms-status"><span class="ms-mode">NORMAL</span><span>mock-session.js</span><span class="ms-right tnum">10:1  72%</span></span></span>`;
  }

  function lazygitScene(ctx) {
    return `${promptLine(ctx, 'lazygit')}` +
`<span class="ms-tui"><span class="ms-lg-head"><span> lazygit</span><span class="ms-spacer"></span><span class="ms-branch">feature/live-preview</span><span class="tnum">↑2 ↓0</span></span><span class="ms-lg-grid"><span class="ms-pane"><span class="ms-pane-title">status</span><span class="ms-pane-body"><span class="ms-tui-line"><span class="ms-tag" style="color:var(--green)">clean</span><span class="ms-grow">working tree</span></span><span class="ms-tui-line"><span class="ms-tag" style="color:var(--yellow)">2</span><span class="ms-grow">staged files</span></span><span class="ms-tui-line"><span class="ms-tag" style="color:var(--blue)">main</span><span class="ms-grow">tracking origin</span></span></span></span><span class="ms-pane"><span class="ms-pane-title">branches</span><span class="ms-pane-body"><span class="ms-tui-line ms-selected"><span class="ms-branch">● feature/live-preview</span></span><span class="ms-tui-line"><span class="ms-muted">  main</span></span><span class="ms-tui-line"><span class="ms-muted">  theme-studio</span></span></span></span><span class="ms-pane"><span class="ms-pane-title">files</span><span class="ms-pane-body"><span class="ms-tui-line ms-selected"><span class="ms-mod">M</span><span class="ms-grow">js/features/mock-session.js</span></span><span class="ms-tui-line"><span class="ms-add">A</span><span class="ms-grow">docs/preview-notes.md</span></span><span class="ms-tui-line"><span class="ms-del">D</span><span class="ms-grow">old/session-fixture.txt</span></span></span></span><span class="ms-pane"><span class="ms-pane-title">commits</span><span class="ms-pane-body"><span class="ms-tui-line"><span class="ms-hash tnum">8f42c1a</span><span class="ms-grow">polish viewport glow</span></span><span class="ms-tui-line"><span class="ms-hash tnum">6a17b90</span><span class="ms-grow">add cursor hooks</span></span><span class="ms-tui-line"><span class="ms-hash tnum">35d9e2f</span><span class="ms-grow">wire theme bus</span></span></span></span><span class="ms-pane ms-lg-wide"><span class="ms-pane-title">diff</span><span class="ms-pane-body ms-diff-preview"><span class="ms-hunk">@@ -30,6 +30,10 @@</span>
<span class="ms-drem">-  ['all', 'all']</span>
<span class="ms-dadd">+  ['neovim', 'neovim']</span>
<span class="ms-dadd">+  ['lazygit', 'lazygit']</span>
<span class="ms-dadd">+  ['htop', 'htop']</span></span></span></span></span>`;
  }

  function htopScene(ctx) {
    return `${promptLine(ctx, 'htop')}` +
`<span class="ms-tui"><span class="ms-htop-head"><span class="ms-tui-line"><span class="ms-key">CPU1</span><span class="ms-bar"><i class="ms-fill" style="width:72%"></i></span><span class="tnum ms-num">72%</span></span><span class="ms-tui-line"><span class="ms-key">CPU2</span><span class="ms-bar"><i class="ms-fill warn" style="width:48%"></i></span><span class="tnum ms-num">48%</span></span><span class="ms-tui-line"><span class="ms-key">Mem</span><span class="ms-bar"><i class="ms-fill hot" style="width:81%"></i></span><span class="tnum ms-num">12.9G/16G</span></span><span class="ms-tui-line"><span class="ms-key">Swp</span><span class="ms-bar"><i class="ms-fill" style="width:9%"></i></span><span class="tnum ms-num">0.4G/4G</span></span></span><span class="ms-load"><span>Tasks: <b class="tnum">143</b>, <span class="ms-add">312 thr</span></span><span>Load average: <b class="tnum ms-num">1.72</b> <b class="tnum ms-num">1.54</b> <b class="tnum ms-num">1.21</b></span><span>Uptime: <b class="tnum">03:42:18</b></span></span><span class="ms-pane"><span class="ms-pane-title">processes</span><span class="ms-pane-body"><table class="ms-proc"><thead><tr><th>PID</th><th>USER</th><th>CPU%</th><th>MEM%</th><th>COMMAND</th></tr></thead><tbody><tr><td class="tnum">1024</td><td>dev</td><td class="tnum ms-del">38.1</td><td class="tnum">12.4</td><td>node atelier-preview</td></tr><tr><td class="tnum">1842</td><td>dev</td><td class="tnum ms-mod">21.8</td><td class="tnum">8.7</td><td>nvim mock-session.js</td></tr><tr><td class="tnum">2201</td><td>dev</td><td class="tnum ms-add">7.6</td><td class="tnum">3.2</td><td>zsh</td></tr><tr><td class="tnum">2314</td><td>dev</td><td class="tnum">2.3</td><td class="tnum">1.4</td><td>git status --short</td></tr><tr><td class="tnum">2410</td><td>root</td><td class="tnum">0.8</td><td class="tnum">0.6</td><td>WindowServer</td></tr></tbody></table></span></span></span>`;
  }

  function diffScene(ctx) {
    return `${promptLine(ctx, 'git diff -- js/features/mock-session.js')}` +
`<span class="ms-udiff"><span class="ms-diff-file">diff --git a/js/features/mock-session.js b/js/features/mock-session.js</span><span class="ms-dline ms-dctx">index 8f42c1a..b7e5a09 100644</span><span class="ms-dline ms-drem">--- a/js/features/mock-session.js</span><span class="ms-dline ms-dadd">+++ b/js/features/mock-session.js</span><span class="ms-hunk">@@ -30,7 +30,11 @@</span><span class="ms-dline ms-dctx"> const SCENES = [</span><span class="ms-dline ms-dctx">   ['code', 'code'], ['ls', 'ls -la'],</span><span class="ms-dline ms-drem">-  ['git', 'git'], ['neofetch', 'neofetch'], ['all', 'all']</span><span class="ms-dline ms-dadd">+  ['git', 'git'], ['neofetch', 'neofetch'],</span><span class="ms-dline ms-dadd">+  ['neovim', 'neovim'], ['lazygit', 'lazygit'],</span><span class="ms-dline ms-dadd">+  ['htop', 'htop'], ['diff', 'git diff'], ['all', 'all']</span><span class="ms-dline ms-dctx"> ];</span><span class="ms-hunk">@@ -149,6 +153,10 @@ function sceneHTML(ctx, scene) {</span><span class="ms-dline ms-dadd">+  if (scene === 'neovim') return neovimScene(ctx);</span><span class="ms-dline ms-dadd">+  if (scene === 'lazygit') return lazygitScene(ctx);</span><span class="ms-dline ms-dadd">+  if (scene === 'htop') return htopScene(ctx);</span><span class="ms-dline ms-dadd">+  if (scene === 'diff') return diffScene(ctx);</span></span>`;
  }

  function section(title, html) {
    return `<span class="ms-section"><span class="ms-section-title">${esc(title)}</span>${html}</span>`;
  }

  function sceneHTML(ctx, scene) {
    if (scene === 'code') return codeScene(ctx);
    if (scene === 'ls') return lsScene(ctx);
    if (scene === 'git') return gitScene(ctx);
    if (scene === 'neofetch') return neofetchScene(ctx);
    if (scene === 'neovim') return neovimScene(ctx);
    if (scene === 'lazygit') return lazygitScene(ctx);
    if (scene === 'htop') return htopScene(ctx);
    if (scene === 'diff') return diffScene(ctx);
    return section('code', codeScene(ctx, true)) + section('ls -la', lsScene(ctx)) + section('git', gitScene(ctx)) + section('neofetch', neofetchScene(ctx)) + section('neovim', neovimScene(ctx)) + section('lazygit', lazygitScene(ctx)) + section('htop', htopScene(ctx)) + section('git diff', diffScene(ctx));
  }

  function plainScene(scene) {
    const text = {
      code: 'atelier@preview ~/terminal-specimen ❯ pnpm atelier:preview --scene code\n// ligatures: => != >= ->\ntype ThemeName = \'mocha\' | \'latte\';\nconst renderPrompt = (segments) => segments.filter(s => s.visible != false).map(s => `◆ ${s.label}`);',
      ls: 'atelier@preview ~/atelier ❯ ls -la\ntotal 128\ndrwxr-xr-x features/\n-rwxr-xr-x atelier*\ntheme.json -> catppuccin/mocha\nrelease.tar.gz',
      git: 'atelier@preview ~/atelier ❯ git status --short && git log --oneline --graph -4\n## feature/live-preview...origin/main\n M js/features/mock-session.js\n* 8f42c1a (HEAD -> feature/live-preview) polish viewport glow',
      neofetch: 'atelier@preview ~/atelier ❯ neofetch\n◆◆◆ ATELIER ◆◆◆\nOS: Atelier Workstation\nFont: live preview-surface\nTheme: Catppuccin palette vars',
      neovim: "atelier@preview ~/atelier ❯ nvim js/features/mock-session.js\nNORMAL mock-session.js\nconst palette = { keyword: 'mauve', string: 'green' };\nfunction mountScene(name) { return SCENES.find(s => s[0] === name); }",
      lazygit: 'atelier@preview ~/atelier ❯ lazygit\nlazygit feature/live-preview ↑2 ↓0\nfiles: M js/features/mock-session.js, A docs/preview-notes.md\ncommits: 8f42c1a polish viewport glow',
      htop: 'atelier@preview ~/atelier ❯ htop\nCPU1 72% CPU2 48% Mem 12.9G/16G Load average: 1.72 1.54 1.21\nPID USER CPU% MEM% COMMAND\n1024 dev 38.1 12.4 node atelier-preview',
      diff: "atelier@preview ~/atelier ❯ git diff -- js/features/mock-session.js\ndiff --git a/js/features/mock-session.js b/js/features/mock-session.js\n@@ -30,7 +30,11 @@\n-  ['git', 'git'], ['neofetch', 'neofetch'], ['all', 'all']\n+  ['neovim', 'neovim'], ['lazygit', 'lazygit'], ['htop', 'htop'], ['diff', 'git diff']",
      all: 'Live Preview: code + ls + git + neofetch + neovim + lazygit + htop + git diff scenes stacked.'
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
