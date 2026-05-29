/* Prompt Builder — Starship-style shell prompt designer. */
(function () {
  App.injectCSS('prompt-builder', `
    .pb-palette{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
    .pb-segments{display:flex;flex-direction:column;gap:8px}
    .pb-seg{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start;padding:10px;border:1px solid var(--surface0);border-radius:var(--radius-sm);background:color-mix(in srgb,var(--surface0) 36%,transparent)}
    .pb-seg-title{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--text)}
    .pb-swatch{width:12px;height:12px;border-radius:3px;border:1px solid color-mix(in srgb,var(--text) 28%,transparent);display:inline-block;box-shadow:0 0 0 1px rgba(0,0,0,.18) inset}
    .pb-mini{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
    .pb-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
    .pb-preview{min-height:122px;display:flex;flex-direction:column;justify-content:center;gap:12px;overflow:auto}
    .pb-line{display:flex;align-items:stretch;white-space:nowrap;min-height:32px}
    .pb-part{display:inline-flex;align-items:center;gap:7px;padding:4px 9px;font-weight:700}
    .pb-sep{display:inline-flex;align-items:center;font-weight:900;padding:4px 0;font-size:1.1em;line-height:1}
    .pb-plain{gap:7px;align-items:center;flex-wrap:wrap}
    .pb-char{font-weight:800;font-size:1.15em}
    .pb-empty{border:1px dashed var(--surface1);border-radius:var(--radius-sm);padding:12px;color:var(--overlay1);text-align:center}
    .pb-export-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
    .pb-format{display:flex;gap:6px;flex-wrap:wrap}
    .pb-advanced{margin-top:9px}
    .pb-icon-input{max-width:11ch}
    @media(max-width:880px){.pb-palette{grid-template-columns:1fr}.pb-seg{grid-template-columns:1fr}.pb-actions{justify-content:flex-start}}
  `);

  App.registerFeature({
    id: 'prompt-builder', title: 'Prompt Builder', icon: '❯', order: 30,
    subtitle: 'Stack prompt segments, pick palette colors, and ship a real starship.toml.',
    mount(el, ctx) {
      const { h, get, set, subscribe, copy, download } = ctx;

      const PALETTE = App.PALETTE_KEYS || ['crust','mantle','base','surface0','surface1','surface2','text','mauve','red','peach','yellow','green','teal','sky','blue','lavender'];
      const DEFAULT_HEX = {
        crust:'#11111b', mantle:'#181825', base:'#1e1e2e', surface0:'#313244', surface1:'#45475a', surface2:'#585b70',
        overlay0:'#6c7086', overlay1:'#7f849c', overlay2:'#9399b2', subtext0:'#a6adc8', subtext1:'#bac2de', text:'#cdd6f4',
        rosewater:'#f5e0dc', flamingo:'#f2cdcd', pink:'#f5c2e7', mauve:'#cba6f7', red:'#f38ba8', maroon:'#eba0ac',
        peach:'#fab387', yellow:'#f9e2af', green:'#a6e3a1', teal:'#94e2d5', sky:'#89dceb', sapphire:'#74c7ec', blue:'#89b4fa',
        lavender:'#b4befe', accent:'#cba6f7'
      };
      const TYPES = {
        directory:       { label:'Directory', icon:'~',  fg:'crust', bg:'blue', sample:'~/dev/atelier', module:'directory' },
        git_branch:      { label:'Git branch', icon:'⎇', fg:'crust', bg:'mauve', sample:'main', module:'git_branch' },
        git_status:      { label:'Git status', icon:'✗', fg:'crust', bg:'peach', sample:'1', module:'git_status' },
        cmd_duration:    { label:'Command time', icon:'⏱', fg:'crust', bg:'yellow', sample:'1.2s', module:'cmd_duration' },
        time:            { label:'Time', icon:'⌚', fg:'crust', bg:'teal', sample:'14:08', module:'time' },
        username:        { label:'Username', icon:'u',  fg:'crust', bg:'green', sample:'dev', module:'username' },
        hostname:        { label:'Hostname', icon:'h',  fg:'crust', bg:'sapphire', sample:'atelierbox', module:'hostname' },
        node_version:    { label:'Node', icon:'⬢', fg:'crust', bg:'green', sample:'20.11', module:'nodejs' },
        python_version:  { label:'Python', icon:'py', fg:'crust', bg:'yellow', sample:'3.12', module:'python' },
        exit_status:     { label:'Exit status', icon:'✗', fg:'crust', bg:'red', sample:'1', module:'status' },
        prompt_char:     { label:'Prompt char', icon:'❯', fg:'green', bg:'base', sample:'', module:'character' }
      };
      const SEED = ['directory', 'git_branch', 'git_status', 'cmd_duration', 'prompt_char'];
      const PREVIEW_SEP = '▶';
      const EXPORT_SEP = '';

      function prompt() {
        const p = get('prompt') || {};
        return { segments: Array.isArray(p.segments) ? p.segments : [], format: p.format === 'plain' ? 'plain' : 'powerline' };
      }
      function uid(type) { return type + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6); }
      function makeSeg(type) { const d = TYPES[type]; return { id: uid(type), type, fg: d.fg, bg: d.bg, icon: d.icon }; }
      function patchSegments(fn) { const p = prompt(); set('prompt.segments', fn(p.segments.slice())); }
      function labelNodes(seg) {
        const d = TYPES[seg.type] || TYPES.directory;
        const nodes = [h('span', {}, seg.icon || d.icon)];
        if (d.sample) nodes.push(h('span', { class: 'tnum' }, d.sample));
        return nodes;
      }
      function cssVar(role) { return `var(--${PALETTE.includes(role) ? role : 'text'})`; }

      if (!prompt().segments.length) {
        set('prompt', { segments: SEED.map(makeSeg), format: prompt().format });
      }

      const paletteBox = h('div', { class: 'pb-palette' });
      Object.keys(TYPES).forEach(type => paletteBox.appendChild(
        h('button', { class: 'btn', onclick: () => patchSegments(a => { a.push(makeSeg(type)); return a; }) }, `${TYPES[type].icon} ${TYPES[type].label}`)
      ));

      const formatRow = h('div', { class: 'pb-format' },
        h('button', { class: 'btn', 'data-format': 'powerline', onclick: () => set('prompt.format', 'powerline') }, 'powerline'),
        h('button', { class: 'btn', 'data-format': 'plain', onclick: () => set('prompt.format', 'plain') }, 'plain')
      );
      const segmentsBox = h('div', { class: 'pb-segments' });
      const stageBody = h('div', { class: 'stage-body preview-surface pb-preview' });
      const codeBox = h('pre', { class: 'codeblock' });

      function colorSelect(seg, key) {
        const sel = h('select', { onchange: () => patchSegments(a => a.map(s => s.id === seg.id ? Object.assign({}, s, { [key]: sel.value }) : s)) });
        PALETTE.forEach(k => sel.appendChild(h('option', { value: k }, k)));
        sel.value = seg[key] || TYPES[seg.type][key];
        return h('label', { class: 'field' }, key, sel);
      }
      function iconControl(seg) {
        const d = TYPES[seg.type] || TYPES.directory;
        const input = h('input', {
          class: 'pb-icon-input', type: 'text', value: seg.icon || d.icon, maxlength: '4',
          oninput: () => patchSegments(a => a.map(s => s.id === seg.id ? Object.assign({}, s, { icon: input.value || d.icon }) : s))
        });
        return h('label', { class: 'field' }, 'glyph', input);
      }

      function renderSegments(p) {
        segmentsBox.innerHTML = '';
        if (!p.segments.length) {
          segmentsBox.appendChild(h('div', { class: 'pb-empty' }, 'No segments. Pick one from the palette.'));
          return;
        }
        p.segments.forEach((seg, i) => {
          const d = TYPES[seg.type] || TYPES.directory;
          segmentsBox.appendChild(h('div', { class: 'pb-seg' },
            h('div', {},
              h('div', { class: 'pb-seg-title' },
                h('span', { class: 'pb-swatch', style: { background: cssVar(seg.bg || d.bg) } }),
                `${seg.icon || d.icon} ${d.label}`,
                h('span', { class: 'muted' }, seg.type)
              ),
              h('div', { class: 'pb-mini' }, colorSelect(seg, 'fg'), colorSelect(seg, 'bg')),
              h('details', { class: 'disclosure pb-advanced' },
                h('summary', {}, 'segment details'),
                h('div', { class: 'disclosure-body' }, iconControl(seg))
              )
            ),
            h('div', { class: 'pb-actions' },
              h('button', { class: 'btn ghost', disabled: i === 0 ? 'true' : null, onclick: () => patchSegments(a => { [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; }) }, 'Up'),
              h('button', { class: 'btn ghost', disabled: i === p.segments.length - 1 ? 'true' : null, onclick: () => patchSegments(a => { [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; }) }, 'Down'),
              h('button', { class: 'btn ghost', onclick: () => patchSegments(a => a.filter(s => s.id !== seg.id)) }, '×')
            )
          ));
        });
      }

      function renderPreview(p) {
        stageBody.innerHTML = '';
        const promptChar = p.segments.find(s => s.type === 'prompt_char') || makeSeg('prompt_char');
        const lineSegs = p.segments.filter(s => s.type !== 'prompt_char');
        const line1 = h('div', { class: 'pb-line' + (p.format === 'plain' ? ' pb-plain' : '') });
        if (!lineSegs.length) line1.appendChild(h('span', { class: 'muted' }, 'add prompt segments to preview line 1'));
        lineSegs.forEach((seg, i) => {
          const d = TYPES[seg.type] || TYPES.directory;
          const fg = seg.fg || d.fg;
          const bg = seg.bg || d.bg;
          line1.appendChild(h('span', { class: 'pb-part', style: { color: cssVar(fg), background: cssVar(bg) } }, labelNodes(seg)));
          if (p.format === 'powerline') {
            const next = lineSegs[i + 1];
            const nextBg = next ? (next.bg || TYPES[next.type].bg) : 'base';
            line1.appendChild(h('span', { class: 'pb-sep', style: { color: cssVar(bg), background: cssVar(nextBg) } }, PREVIEW_SEP));
          }
        });
        stageBody.appendChild(line1);
        stageBody.appendChild(h('div', { class: 'pb-char', style: { color: cssVar(promptChar.fg || 'green') } }, promptChar.icon || TYPES.prompt_char.icon));
      }

      function resolveHex(role) {
        const colors = (get('theme') || {}).colors || {};
        if (colors[role] && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colors[role])) return colors[role];
        const probe = document.createElement('span');
        probe.style.color = `var(--${role})`;
        probe.style.position = 'absolute';
        probe.style.left = '-9999px';
        document.body.appendChild(probe);
        const rgb = getComputedStyle(probe).color;
        probe.remove();
        const nums = (rgb.match(/\d+/g) || []).slice(0, 3).map(Number);
        if (nums.length === 3) return '#' + nums.map(n => n.toString(16).padStart(2, '0')).join('');
        return DEFAULT_HEX[role] || DEFAULT_HEX.text;
      }
      function q(s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
      function moduleFormat(seg) {
        const d = TYPES[seg.type] || TYPES.directory;
        const icon = q(seg.icon || d.icon);
        const style = '$style';
        if (seg.type === 'directory') return `format = "[${icon} $path](${style})"`;
        if (seg.type === 'git_branch') return `symbol = "${icon} "\nformat = "[$symbol$branch](${style})"`;
        if (seg.type === 'git_status') return `format = "[${icon} $all_status$ahead_behind](${style})"`;
        if (seg.type === 'cmd_duration') return `min_time = 0\nformat = "[${icon} $duration](${style})"`;
        if (seg.type === 'time') return `disabled = false\ntime_format = "%H:%M"\nformat = "[${icon} $time](${style})"`;
        if (seg.type === 'username') return `show_always = true\nformat = "[${icon} $user](${style})"`;
        if (seg.type === 'hostname') return `ssh_only = false\nformat = "[${icon} $hostname](${style})"`;
        if (seg.type === 'node_version') return `symbol = "${icon} "\nformat = "[$symbol($version)](${style})"`;
        if (seg.type === 'python_version') return `symbol = "${icon} "\nformat = "[$symbol($version)](${style})"`;
        if (seg.type === 'exit_status') return `disabled = false\nformat = "[${icon} $status](${style})"`;
        return `success_symbol = "[${icon}](fg:${seg.fg || d.fg})"\nerror_symbol = "[${icon}](fg:red)"`;
      }
      function exportToml(p) {
        const lineSegs = p.segments.filter(s => s.type !== 'prompt_char');
        const modules = lineSegs.map(s => '$' + (TYPES[s.type] || TYPES.directory).module);
        let fmt = '';
        if (p.format === 'powerline') {
          lineSegs.forEach((s, i) => {
            const bg = s.bg || TYPES[s.type].bg;
            const next = lineSegs[i + 1];
            fmt += '$' + TYPES[s.type].module;
            fmt += next ? `[${EXPORT_SEP}](fg:${bg} bg:${next.bg || TYPES[next.type].bg})` : `[${EXPORT_SEP}](fg:${bg})`;
          });
        } else {
          fmt = modules.join(' ');
        }
        fmt += '$line_break$character';

        const used = Array.from(new Set(['red'].concat(p.segments.flatMap(s => {
          const d = TYPES[s.type] || TYPES.directory;
          return [s.fg || d.fg, s.bg || d.bg];
        }))));
        const parts = [
          '# Atelier Prompt Builder — starship.toml',
          'add_newline = true',
          'palette = "atelier_prompt"',
          'format = """' + fmt + '"""',
          '',
          '[palettes.atelier_prompt]'
        ];
        used.forEach(k => parts.push(`${k} = "${resolveHex(k)}"`));
        const seen = new Set();
        p.segments.forEach(seg => {
          const d = TYPES[seg.type] || TYPES.directory;
          const mod = d.module;
          if (seen.has(mod)) return;
          seen.add(mod);
          parts.push('', `[${mod}]`);
          if (seg.type !== 'prompt_char') parts.push(`style = "fg:${seg.fg || d.fg} bg:${seg.bg || d.bg}"`);
          parts.push(moduleFormat(seg));
        });
        if (!seen.has('character')) parts.push('', '[character]', moduleFormat(makeSeg('prompt_char')));
        return parts.join('\n');
      }

      const left = h('div', { class: 'stack' },
        h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '+'), 'Add segment'), paletteBox),
        h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '≡'), 'Format'), formatRow),
        h('div', { class: 'card' }, h('h4', {}, h('span', { class: 'accent' }, '↕'), 'Active prompt'), segmentsBox)
      );
      const right = h('div', { class: 'stack' },
        h('div', { class: 'stage grow' }, stageBody, h('div', { class: 'stage-foot' }, 'line 1 segments · line 2 prompt char')),
        h('div', { class: 'card' },
          h('div', { class: 'pb-export-head' }, h('h4', {}, h('span', { class: 'accent' }, '↧'), 'Export'),
            h('div', { class: 'btn-row' },
              h('button', { class: 'btn', onclick: () => copy(codeBox.textContent) }, 'Copy'),
              h('button', { class: 'btn primary', onclick: () => download('starship.toml', codeBox.textContent) }, 'Download')
            )
          ),
          codeBox
        )
      );
      el.classList.add('fill');
      el.appendChild(h('div', { class: 'split' }, left, right));

      function render() {
        const p = prompt();
        formatRow.querySelectorAll('.btn').forEach(b => b.classList.toggle('sel', b.dataset.format === p.format));
        renderSegments(p);
        renderPreview(p);
        codeBox.textContent = exportToml(p);
      }
      subscribe('prompt', render);
      subscribe('font', render);
      subscribe('theme', render);
      render();
    }
  });
})();
