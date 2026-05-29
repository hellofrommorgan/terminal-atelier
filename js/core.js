/* ============================================================================
   ATELIER core — App registry, reactive state, event bus, theme + preview engine.
   Loaded before app.js and all feature modules.

   PUBLIC API (used by feature modules)
   ------------------------------------------------------------------------
   App.registerFeature({
     id, title, icon, order,          // metadata for the nav
     mount(el, ctx)                    // called ONCE with the panel element
   })
     ctx = { get, set, update, subscribe, bus, toast, copy, download,
             applyTheme, state, h }

   App.get(path)            -> value at dot-path, e.g. App.get('font.wght')
   App.set(path, value)     -> set + persist + notify subscribers + sync preview
   App.update(path, fn)     -> functional update
   App.subscribe(path, cb)  -> cb(value, path); '' subscribes to everything
   App.bus.on(ev, cb) / App.bus.emit(ev, data)
   App.injectCSS(id, css)   -> add a <style data-feature=id> once
   App.toast(msg, kind)     -> transient notification
   App.copy(text) / App.download(name, text)
   App.applyTheme(colorsObj)-> overwrite palette CSS vars (theme-studio)
   App.h(tag, attrs, ...kids) -> tiny DOM helper
   App.fmtFeatures(arr)     -> "liga" 1, ... css string from feature-tag list

   STATE SCHEMA (namespaced; features own their slice; export-hub reads these)
   ------------------------------------------------------------------------
   font:   {family, variable, wght, size, lh, tracking, italic, features:[tags]}
   theme:  {name, colors:{base,text,...}}
   prompt: {segments:[{id,type,...}], format, ...}
   keybinds:[{combo, action, target}]
   tmux:   {left:[seg], right:[seg]}
   cursor: {style, blink, color}
   layout: {root split tree}
   rigs:   [{name, state}]
   ============================================================================ */
window.App = (function () {
  const LS_KEY = 'forge.state.v1';
  // first run = no persisted state at all (used to decide whether to onboard)
  const FIRST_RUN = !localStorage.getItem(LS_KEY);

  // features a novice sees; everything else is revealed in Expert mode
  const CORE_FEATURES = ['presets-share', 'font-playground', 'theme-studio',
                         'export-hub', 'command-palette'];

  const DEFAULTS = {
    font: { family: 'Geist Mono', variable: true, wght: 420, size: 15, lh: 1.5,
            tracking: 0, italic: false, features: [] },
    theme: { name: 'Catppuccin Mocha', colors: null },
    prompt: { segments: [], format: 'powerline' },
    keybinds: [],
    tmux: { left: [], right: [] },
    cursor: { style: 'bar', blink: false, color: '#f5e0dc' },
    layout: null,
    rigs: [],
    ui: { mode: 'novice', onboarded: false, lastFeature: null, dockCollapsed: false },
    meta: { schemaVersion: 2 }
  };

  // ---- state ----------------------------------------------------------------
  function deepClone(o){ return JSON.parse(JSON.stringify(o)); }
  function deepMerge(base, over){
    if (over == null) return base;
    if (Array.isArray(over)) return over.slice();
    if (typeof over === 'object'){
      const out = Object.assign({}, base);
      for (const k in over) out[k] = (typeof over[k]==='object' && over[k] && !Array.isArray(over[k]) && base && base[k]) ? deepMerge(base[k], over[k]) : (typeof over[k]==='object'?deepClone(over[k]):over[k]);
      return out;
    }
    return over;
  }

  let state;
  try { state = deepMerge(deepClone(DEFAULTS), JSON.parse(localStorage.getItem(LS_KEY) || '{}')); }
  catch (e) { state = deepClone(DEFAULTS); }

  // migration: returning users (had persisted state but no ui block) are already
  // "onboarded" — never interrupt them with the first-run walkthrough.
  try {
    const prev = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (prev && (!prev.ui || prev.ui.onboarded == null)) state.ui.onboarded = true;
  } catch (e) {}

  const subs = [];   // {path, cb}
  function get(path){
    if (!path) return state;
    return path.split('.').reduce((o,k)=> (o==null?undefined:o[k]), state);
  }
  function setRaw(path, value){
    const keys = path.split('.');
    let o = state;
    for (let i=0;i<keys.length-1;i++){ if (o[keys[i]]==null||typeof o[keys[i]]!=='object') o[keys[i]]={}; o=o[keys[i]]; }
    o[keys[keys.length-1]] = value;
  }
  let saveTimer=null;
  function persist(){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{
      try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); bus.emit('saved'); }catch(e){}
    },120);
  }
  function notify(path){
    subs.forEach(s=>{ if (s.path==='' || path===s.path || path.startsWith(s.path+'.') || s.path.startsWith(path+'.')) {
      try{ s.cb(get(s.path), path); }catch(e){ console.error(e); }
    }});
  }
  // Features lazily seed starter content (default prompt segments, tmux bar,
  // keybinds, …) on first mount. Those writes happen inside App.withSeed(),
  // are NOT user edits, and must not pollute undo history or the diff readout.
  let seeding = 0;
  function withSeed(fn){ seeding++; try { return fn(); } finally { seeding--; } }
  function setOn(obj, path, value){
    const keys = path.split('.'); let o = obj;
    for (let i=0;i<keys.length-1;i++){ if (o[keys[i]]==null||typeof o[keys[i]]!=='object') o[keys[i]]={}; o=o[keys[i]]; }
    o[keys[keys.length-1]] = deepClone(value);
  }
  function set(path, value){
    setRaw(path, value); syncPreview(); persist(); notify(path);
    if (seeding){
      // starting content: fold into the baseline AND every existing history
      // snapshot so it's never treated as an edit nor reverted by undo.
      setOn(diffBaseline, path, value);
      history.forEach(snap => setOn(snap, path, value));
    } else recordHistory(path);
  }
  function update(path, fn){ set(path, fn(get(path))); }
  function subscribe(path, cb){ subs.push({path:path||'', cb}); return ()=>{ const i=subs.findIndex(s=>s.cb===cb); if(i>=0)subs.splice(i,1); }; }
  function replaceState(next){ state = deepMerge(deepClone(DEFAULTS), next||{}); applyTheme(get('theme.colors')); syncPreview(); persist(); notify(''); diffBaseline = deepClone(state); recordHistory('', true); }
  function resetState(){ state = deepClone(DEFAULTS); applyTheme(null); syncPreview(); persist(); notify(''); diffBaseline = deepClone(DEFAULTS); recordHistory('', true); }

  // ---- undo / redo history --------------------------------------------------
  // We snapshot the *editable* config only; UI prefs (mode/onboarding/dock) and
  // the saved-rigs library are intentionally excluded so they never get undone.
  const HIST_MAX = 100;
  function histSnapshot(){ const s = deepClone(state); delete s.ui; delete s.rigs; return s; }
  function histSame(a, b){ return JSON.stringify(a) === JSON.stringify(b); }
  let history = [histSnapshot()];
  let hi = 0;            // index of the currently-applied snapshot
  let restoring = false; // suppress recording while we apply a snapshot
  let histTimer = null;
  function pushSnapshot(){
    const snap = histSnapshot();
    if (histSame(snap, history[hi])) return;
    history = history.slice(0, hi + 1);
    history.push(snap);
    if (history.length > HIST_MAX) history.shift();
    hi = history.length - 1;
    bus.emit('history:changed', { canUndo: hi > 0, canRedo: false });
  }
  function recordHistory(path, immediate){
    if (restoring) return;
    if (path && (path === 'ui' || path.startsWith('ui.') || path === 'rigs' || path.startsWith('rigs'))) return;
    clearTimeout(histTimer);
    if (immediate){ pushSnapshot(); return; }
    histTimer = setTimeout(pushSnapshot, 280);   // coalesce slider/typing bursts
  }
  function applySnapshot(snap){
    restoring = true;
    const keepUi = state.ui, keepRigs = state.rigs;
    state = deepMerge(deepClone(DEFAULTS), snap);
    state.ui = keepUi; state.rigs = keepRigs;
    applyTheme(get('theme.colors')); syncPreview(); persist(); notify('');
    restoring = false;
    bus.emit('history:changed', { canUndo: hi > 0, canRedo: hi < history.length - 1 });
  }
  function undo(){
    clearTimeout(histTimer); pushSnapshot();   // flush any pending edit first
    if (hi <= 0) return false;
    hi--; applySnapshot(history[hi]); return true;
  }
  function redo(){
    if (hi >= history.length - 1) return false;
    hi++; applySnapshot(history[hi]); return true;
  }
  function canUndo(){ return hi > 0; }
  function canRedo(){ return hi < history.length - 1; }

  // ---- diff vs defaults -----------------------------------------------------
  const DIFF_SECTIONS = {
    font: 'font', theme: 'theme', prompt: 'prompt', keybinds: 'keybinds',
    tmux: 'tmux', cursor: 'cursor', layout: 'layout'
  };
  let diffBaseline = deepClone(DEFAULTS);   // starting point (DEFAULTS + seeded content)
  function canon(v){
    if (Array.isArray(v)) return '['+v.map(canon).join(',')+']';
    if (v && typeof v === 'object') return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
    return JSON.stringify(v);
  }
  function diffFromDefaults(){
    const items = [];
    for (const key in DIFF_SECTIONS){
      if (key === 'font'){
        for (const fk in DEFAULTS.font){
          const base = (diffBaseline.font ? diffBaseline.font[fk] : DEFAULTS.font[fk]);
          if (canon(get('font.'+fk)) !== canon(base))
            items.push({ path: 'font.'+fk, label: 'font · '+fk });
        }
      } else if (canon(get(key)) !== canon(diffBaseline[key])){
        items.push({ path: key, label: DIFF_SECTIONS[key] });
      }
    }
    return { count: items.length, items };
  }

  // ---- event bus ------------------------------------------------------------
  const handlers = {};
  const bus = {
    on(ev, cb){ (handlers[ev]=handlers[ev]||[]).push(cb); return ()=>{ const a=handlers[ev]; const i=a.indexOf(cb); if(i>=0)a.splice(i,1); }; },
    emit(ev, data){ (handlers[ev]||[]).forEach(cb=>{ try{cb(data);}catch(e){console.error(e);} }); }
  };

  // ---- features registry ----------------------------------------------------
  const features = [];
  function registerFeature(def){
    if (!def || !def.id) throw new Error('feature needs an id');
    if (features.find(f=>f.id===def.id)) return; // idempotent
    features.push(Object.assign({ order: 100, icon:'•' }, def));
    bus.emit('feature:registered', def);
  }
  function getFeatures(){ return features.slice().sort((a,b)=> (a.order-b.order) || a.title.localeCompare(b.title)); }

  // ---- mode / progressive disclosure ---------------------------------------
  function getMode(){ return (state.ui && state.ui.mode) || 'novice'; }
  function isCore(f){ return (f.tier === 'core') || CORE_FEATURES.includes(f.id); }
  function getVisibleFeatures(){
    if (getMode() === 'expert') return getFeatures();
    return getFeatures().filter(isCore);
  }
  function applyMode(){ if (document.body) document.body.dataset.mode = getMode(); }
  function setMode(m){
    if (m !== 'novice' && m !== 'expert') return;
    setRaw('ui.mode', m); applyMode(); persist(); notify('ui.mode'); bus.emit('mode:changed', m);
  }
  function isFirstRun(){ return FIRST_RUN; }
  function markOnboarded(){ setRaw('ui.onboarded', true); persist(); }

  // ---- theme / preview ------------------------------------------------------
  const PALETTE_KEYS = ['crust','mantle','base','surface0','surface1','surface2','overlay0','overlay1','overlay2',
    'subtext0','subtext1','text','rosewater','flamingo','pink','mauve','red','maroon','peach','yellow','green',
    'teal','sky','sapphire','blue','lavender','accent'];
  function applyTheme(colors){
    const root = document.documentElement;
    if (!colors){ // clear inline overrides → fall back to base.css mocha
      PALETTE_KEYS.forEach(k=> root.style.removeProperty('--'+k));
      bus.emit('theme:applied', null); return;
    }
    PALETTE_KEYS.forEach(k=>{ if (colors[k]) root.style.setProperty('--'+k, colors[k]); });
    bus.emit('theme:applied', colors);
  }
  function fmtFeatures(arr){
    // arr of tags; 'lig' expands to coding ligatures; otherwise "tag" 1.
    const pairs=[];
    if ((arr||[]).includes('lig')) ['liga','calt','ss11','ss07'].forEach(t=>pairs.push([t,1]));
    else { pairs.push(['liga',0]); pairs.push(['calt',0]); }
    (arr||[]).forEach(t=>{ if(t!=='lig') pairs.push([t,1]); });
    const seen=new Map(); pairs.forEach(([t,v])=>seen.set(t,v));
    return [...seen.entries()].map(([t,v])=>`"${t}" ${v}`).join(', ');
  }
  function syncPreview(){
    const f = get('font') || DEFAULTS.font;
    const r = document.documentElement.style;
    r.setProperty('--pv-family', `"${f.family}"`);
    r.setProperty('--pv-wght', f.variable ? f.wght : 400);
    r.setProperty('--pv-size', (f.size||15)+'px');
    r.setProperty('--pv-lh', f.lh||1.5);
    r.setProperty('--pv-tracking', (f.tracking||0)+'em');
    r.setProperty('--pv-style', f.italic ? 'italic':'normal');
    r.setProperty('--pv-feat', fmtFeatures(f.features));
    bus.emit('preview:sync', f);
  }

  // ---- utilities ------------------------------------------------------------
  function injectCSS(id, css){
    if (document.querySelector(`style[data-feature="${id}"]`)) return;
    const s=document.createElement('style'); s.setAttribute('data-feature', id); s.textContent=css; document.head.appendChild(s);
  }
  function toast(msg, kind){
    const host=document.getElementById('toast-host')||(()=>{const d=document.createElement('div');d.id='toast-host';document.body.appendChild(d);return d;})();
    const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
    if(kind==='warn') t.style.borderLeftColor='var(--peach)';
    if(kind==='error') t.style.borderLeftColor='var(--red)';
    host.appendChild(t); setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .25s'; setTimeout(()=>t.remove(),260); }, 1700);
  }
  async function copy(text){ try{ await navigator.clipboard.writeText(text); toast('Copied.'); }catch(e){ toast('Copy failed — select and ⌘C.','error'); } }
  function download(name, text){
    const b=new Blob([text],{type:'text/plain'}); const u=URL.createObjectURL(b);
    const a=document.createElement('a'); a.href=u; a.download=name; a.click(); URL.revokeObjectURL(u); toast('↓ '+name);
  }
  function h(tag, attrs, ...kids){
    const el=document.createElement(tag);
    if(attrs) for(const k in attrs){
      if(k==='class') el.className=attrs[k];
      else if(k==='html') el.innerHTML=attrs[k];
      else if(k.startsWith('on')&&typeof attrs[k]==='function') el.addEventListener(k.slice(2).toLowerCase(),attrs[k]);
      else if(k==='style'&&typeof attrs[k]==='object') Object.assign(el.style,attrs[k]);
      else if(attrs[k]!=null) el.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(k=>{ if(k==null||k===false)return; el.appendChild(typeof k==='string'?document.createTextNode(k):k); });
    return el;
  }

  // ---- curated presets (the novice on-ramp; shared by onboarding + presets-share)
  const PALETTES = {
    mocha: { crust:'#11111b',mantle:'#181825',base:'#1e1e2e',surface0:'#313244',surface1:'#45475a',surface2:'#585b70',
      overlay0:'#6c7086',overlay1:'#7f849c',overlay2:'#9399b2',subtext0:'#a6adc8',subtext1:'#bac2de',text:'#cdd6f4',
      rosewater:'#f5e0dc',flamingo:'#f2cdcd',pink:'#f5c2e7',mauve:'#cba6f7',red:'#f38ba8',maroon:'#eba0ac',peach:'#fab387',
      yellow:'#f9e2af',green:'#a6e3a1',teal:'#94e2d5',sky:'#89dceb',sapphire:'#74c7ec',blue:'#89b4fa',lavender:'#b4befe' },
    macchiato: { crust:'#181926',mantle:'#1e2030',base:'#24273a',surface0:'#363a4f',surface1:'#494d64',surface2:'#5b6078',
      overlay0:'#6e738d',overlay1:'#8087a2',overlay2:'#939ab7',subtext0:'#a5adcb',subtext1:'#b8c0e0',text:'#cad3f5',
      rosewater:'#f4dbd6',flamingo:'#f0c6c6',pink:'#f5bde6',mauve:'#c6a0f6',red:'#ed8796',maroon:'#ee99a0',peach:'#f5a97f',
      yellow:'#eed49f',green:'#a6da95',teal:'#8bd5ca',sky:'#91d7e3',sapphire:'#7dc4e4',blue:'#8aadf4',lavender:'#b7bdf8' },
    frappe: { crust:'#232634',mantle:'#292c3c',base:'#303446',surface0:'#414559',surface1:'#51576d',surface2:'#626880',
      overlay0:'#737994',overlay1:'#838ba7',overlay2:'#949cbb',subtext0:'#a5adce',subtext1:'#b5bfe2',text:'#c6d0f5',
      rosewater:'#f2d5cf',flamingo:'#eebebe',pink:'#f4b8e4',mauve:'#ca9ee6',red:'#e78284',maroon:'#ea999c',peach:'#ef9f76',
      yellow:'#e5c890',green:'#a6d189',teal:'#81c8be',sky:'#99d1db',sapphire:'#85c1dc',blue:'#8caaee',lavender:'#babbf1' },
    latte: { crust:'#dce0e8',mantle:'#e6e9ef',base:'#eff1f5',surface0:'#ccd0da',surface1:'#bcc0cc',surface2:'#acb0be',
      overlay0:'#9ca0b0',overlay1:'#8c8fa1',overlay2:'#7c7f93',subtext0:'#6c6f85',subtext1:'#5c5f77',text:'#4c4f69',
      rosewater:'#dc8a78',flamingo:'#dd7878',pink:'#ea76cb',mauve:'#8839ef',red:'#d20f39',maroon:'#e64553',peach:'#fe640b',
      yellow:'#df8e1d',green:'#40a02b',teal:'#179299',sky:'#04a5e5',sapphire:'#209fb5',blue:'#1e66f5',lavender:'#7287fd' }
  };
  function pal(name, accentKey){ const c = Object.assign({}, PALETTES[name]); c.accent = c[accentKey || 'mauve']; return c; }
  const PRESETS = [
    { id:'mocha-clean', name:'Mocha · Clean', vibe:'calm', blurb:'Soft dark, light strokes, generous air.',
      state:{ theme:{name:'Catppuccin Mocha',colors:pal('mocha','mauve')},
        font:{family:'Geist Mono',variable:true,wght:380,size:15,lh:1.55,tracking:0,italic:false,features:[]},
        cursor:{style:'bar',blink:false,color:'#f5e0dc'} } },
    { id:'macchiato-power', name:'Macchiato · Power', vibe:'bold',  blurb:'Bolder weight, powerline-ready blue.',
      state:{ theme:{name:'Catppuccin Macchiato',colors:pal('macchiato','blue')},
        font:{family:'Geist Mono',variable:true,wght:520,size:15,lh:1.4,tracking:0,italic:false,features:[]},
        cursor:{style:'block',blink:true,color:'#f4dbd6'} } },
    { id:'frappe-focus', name:'Frappé · Focus', vibe:'reading', blurb:'Warm, roomy lines for long sessions.',
      state:{ theme:{name:'Catppuccin Frappé',colors:pal('frappe','teal')},
        font:{family:'Geist Mono',variable:true,wght:420,size:16,lh:1.6,tracking:0,italic:false,features:[]},
        cursor:{style:'underline',blink:false,color:'#81c8be'} } },
    { id:'latte-day', name:'Latte · Daylight', vibe:'light', blurb:'A light theme for bright rooms.',
      state:{ theme:{name:'Catppuccin Latte',colors:pal('latte','mauve')},
        font:{family:'Geist Mono',variable:true,wght:450,size:15,lh:1.5,tracking:0,italic:false,features:[]},
        cursor:{style:'bar',blink:false,color:'#dc8a78'} } },
    { id:'mocha-heavy', name:'Mocha · Heavy Ink', vibe:'dense', blurb:'High weight, tight rhythm, all business.',
      state:{ theme:{name:'Catppuccin Mocha',colors:pal('mocha','red')},
        font:{family:'Geist Mono',variable:true,wght:620,size:14,lh:1.35,tracking:-0.01,italic:false,features:[]},
        cursor:{style:'block',blink:false,color:'#f38ba8'} } },
    { id:'mocha-ligature', name:'Mocha · Ligature Lab', vibe:'coder', blurb:'Coding ligatures and alternate glyphs on.',
      state:{ theme:{name:'Catppuccin Mocha',colors:pal('mocha','green')},
        font:{family:'Geist Mono',variable:true,wght:440,size:15,lh:1.5,tracking:0,italic:false,features:['lig','ss02']},
        cursor:{style:'bar',blink:true,color:'#a6e3a1'} } }
  ];
  function applyPreset(preset, opts){
    if (!preset || !preset.state) return;
    opts = opts || {};
    const next = deepMerge(deepClone(state), preset.state);
    if (!opts.destructive) next.rigs = state.rigs;   // never silently drop saved rigs
    next.ui = state.ui;                              // presets never change mode/onboarding
    state = next;
    applyTheme(get('theme.colors')); syncPreview(); persist(); notify('');
    diffBaseline = deepClone(state);
    recordHistory('', true);
    bus.emit('preset:applied', preset.id);
  }

  // ---- context handed to each feature --------------------------------------
  function ctx(){ return { get, set, update, subscribe, bus, toast, copy, download, applyTheme, h, fmtFeatures,
    mode: getMode, setMode, applyPreset, getVisibleFeatures, PRESETS,
    get state(){ return state; } }; }

  // init: apply any persisted theme + preview vars + mode asap
  applyTheme(get('theme.colors'));
  syncPreview();
  applyMode();

  return { registerFeature, getFeatures, getVisibleFeatures, get, set, update, subscribe, bus, injectCSS, toast, copy, download,
           applyTheme, fmtFeatures, syncPreview, h, ctx, replaceState, resetState,
           getMode, setMode, applyMode, applyPreset, isFirstRun, markOnboarded,
           undo, redo, canUndo, canRedo, diffFromDefaults, withSeed,
           get state(){ return state; }, DEFAULTS, PALETTE_KEYS, PRESETS, PALETTES, CORE_FEATURES };
})();
