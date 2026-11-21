/* 游戏状态、存档（localStorage）、设置、画质预设、结局记录 */
(function () {
  'use strict';
  var DM = window.DM = window.DM || {};
  var St = DM.State = {};
  var GM = DM.GAME;

  var P = GM.storage || 'darkmood_';
  var KEY_SAVE = P + 'save_', KEY_SET = P + 'settings', KEY_PROG = P + 'progress';
  St.SLOTS = 9;
  St.CHAPTER_ORDER = GM.chapters;
  St.CHAPTER_NAMES = GM.chapterNames;

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function safeDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  // ---------- 设备探测 ----------
  var ua = navigator.userAgent || '';
  St.device = {
    touch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
    mobile: /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)),
    mem: navigator.deviceMemory || 0,
    cores: navigator.hardwareConcurrency || 0,
    dpr: window.devicePixelRatio || 1
  };
  (function () {
    var ok = false;
    try { var c = document.createElement('canvas'); ok = !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { ok = false; }
    St.device.webgl = ok;
  })();

  // ---------- 画质预设 ----------
  // res: 输出高度（auto = 按屏幕实际像素，受 cap 限制）
  St.PRESETS = {
    low:    { res: 540,    cap: 720,  model: 0, tex: 0, light: 0, post: 0, charLight: false, particles: 0, fps: 30, mem: 48 },
    medium: { res: 720,    cap: 1080, model: 1, tex: 1, light: 1, post: 1, charLight: true,  particles: 1, fps: 60, mem: 112 },
    high:   { res: 1080,   cap: 1440, model: 2, tex: 2, light: 2, post: 1, charLight: true,  particles: 2, fps: 60, mem: 224 },
    ultra:  { res: 'auto', cap: 2160, model: 2, tex: 2, light: 2, post: 2, charLight: true,  particles: 2, fps: 60, mem: 448 }
  };
  St.GFX_KEYS = ['res', 'model', 'tex', 'light', 'post', 'charLight', 'particles', 'fps'];
  St.recommend = function () {
    var d = St.device, mem = d.mem || (d.mobile ? 3 : 8), cores = d.cores || (d.mobile ? 4 : 8);
    // iOS Safari 不提供 deviceMemory，且可能隐藏真实核心数：按屏幕像素粗略判断
    var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
    if (ios) { var px = (screen.width || 0) * (screen.height || 0) * d.dpr * d.dpr; return px >= 2.4e6 ? 'medium' : 'low'; }
    if (mem <= 1 || cores <= 2) return 'low';
    if (d.mobile) return (mem >= 6 && cores >= 8) ? 'high' : (mem >= 3 ? 'medium' : 'low');
    if (mem >= 8 && cores >= 8) return 'ultra';
    if (mem >= 4 && cores >= 4) return 'high';
    return 'medium';
  };

  // ---------- 设置 ----------
  St.settings = {
    textSpeed: 2,      // 0 慢 1 中 2 快 3 瞬间
    autoDelay: 1,      // 0 短 1 中 2 长
    textSize: 1,       // 0 小 1 中 2 大
    bgm: 0.55, se: 0.7,
    difficulty: 'easy',
    shake: true,
    style: 'hd',       // hd 高清 | pixel 经典像素
    preset: '',        // low/medium/high/ultra/custom；空 = 首次启动，自动推荐
    res: 1080, model: 2, tex: 2, light: 2, post: 1, charLight: true, particles: 2, fps: 60
  };
  St.applyPreset = function (name) {
    var p = St.PRESETS[name]; if (!p) return;
    St.GFX_KEYS.forEach(function (k) { St.settings[k] = p[k]; });
    St.settings.preset = name;
  };
  St.loadSettings = function () {
    var raw = safeGet(KEY_SET), o = null;
    if (raw) try { o = JSON.parse(raw); } catch (e) { o = null; }
    if (o) for (var k in o) if (k in St.settings) St.settings[k] = o[k];
    // 旧版存档迁移：particles 曾是布尔值
    if (St.settings.particles === true) St.settings.particles = 2;
    if (St.settings.particles === false) St.settings.particles = 0;
    if (!St.settings.preset) { St.applyPreset(St.recommend()); St.saveSettings(); }
  };
  St.saveSettings = function () { safeSet(KEY_SET, JSON.stringify(St.settings)); };
  // 当前画质（供渲染器与美术使用）
  St.gfx = function () {
    var s = St.settings, p = St.PRESETS[s.preset] || St.PRESETS.high;
    return {
      style: s.style, res: s.res, cap: s.preset === 'custom' ? 2160 : p.cap,
      model: s.model, tex: s.tex, light: s.light, post: s.post, charLight: s.charLight, particles: s.particles, fps: s.fps,
      mem: s.preset === 'custom' ? (s.res === 2160 || s.res === 'auto' ? 448 : s.res >= 1440 ? 320 : s.res >= 1080 ? 224 : 112) : p.mem
    };
  };

  // ---------- 全局进度（章节选择 / 结局一览） ----------
  St.progress = { reached: [GM.chapters[0]], cleared: false, endings: {} };
  St.loadProgress = function () {
    var raw = safeGet(KEY_PROG);
    if (raw) try { var o = JSON.parse(raw); if (o && o.reached) St.progress = o; } catch (e) { /* ignore */ }
    St.progress.endings = St.progress.endings || {};
  };
  function saveProg() { safeSet(KEY_PROG, JSON.stringify(St.progress)); }
  St.markReached = function (ch) {
    if (St.progress.reached.indexOf(ch) < 0) { St.progress.reached.push(ch); saveProg(); }
  };
  St.markCleared = function () { St.progress.cleared = true; saveProg(); };
  St.markEnding = function (id) { if (!St.progress.endings[id]) { St.progress.endings[id] = Date.now(); saveProg(); return true; } return false; };
  St.hasEnding = function (id) { return !!St.progress.endings[id]; };

  // ---------- 游戏状态 ----------
  St.s = null;
  St.fresh = function (chapter) {
    return {
      v: 2,
      chapter: chapter || GM.chapters[0],
      prog: chapter || GM.chapters[0], ip: 0,
      stack: [],
      flags: {}, ev: [], evUpd: {}, notes: {}, bonds: {}, ft: {}, unlocked: {}, visited: {}, talked: {},
      hp: 5,
      scene: { bg: 'black', variant: null, filter: 'none', weather: 'none', flashback: false, trial: false, bgm: null, caption: '', stage: [] },
      playMs: 0
    };
  };
  St.newGame = function (chapter) { St.s = St.fresh(chapter); return St.s; };

  St.hasEv = function (id) { return St.s.ev.indexOf(id) >= 0; };
  St.addEv = function (id) { if (!St.hasEv(id)) { St.s.ev.push(id); return true; } return false; };
  St.flag = function (name) { return !!St.s.flags[name]; };

  St.evalCond = function (cond) {
    var neg = false, c = cond.trim();
    if (c.charAt(0) === '!') { neg = true; c = c.slice(1); }
    var r, m;
    if (c.indexOf('has:') === 0) r = St.hasEv(c.slice(4));
    else if (c.indexOf('ending:') === 0) r = St.hasEnding(c.slice(7));
    else if ((m = /^bond:([a-z_0-9]+)>=(\d+)$/.exec(c))) r = (St.s.bonds[m[1]] || 0) >= +m[2];
    else if ((m = /^([a-zA-Z0-9_]+)>=(\d+)$/.exec(c))) r = (+St.s.flags[m[1]] || 0) >= +m[2];
    else r = !!St.s.flags[c];
    return neg ? !r : r;
  };

  // ---------- 存读档 ----------
  // resume: {type:'op', prog, ip} | {type:'explore'} | {type:'freetime'}
  St.snapshot = function (resume, meta) {
    var s = JSON.parse(JSON.stringify(St.s));
    return { s: s, resume: resume, meta: meta || {}, time: Date.now() };
  };
  St.write = function (slot, snap) { return safeSet(KEY_SAVE + slot, JSON.stringify(snap)); };
  St.read = function (slot) {
    var raw = safeGet(KEY_SAVE + slot);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  };
  St.remove = function (slot) { safeDel(KEY_SAVE + slot); };
  St.latest = function () {
    var best = null;
    for (var i = 0; i <= St.SLOTS; i++) {
      var k = i === 0 ? 'auto' : i, d = St.read(k);
      if (d && (!best || d.time > best.time)) best = d;
    }
    return best;
  };

  St.fmtTime = function (t) {
    var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '/' + p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };
  St.fmtPlay = function (ms) {
    var m = Math.floor(ms / 60000), h = Math.floor(m / 60);
    return h + '小时' + (m % 60) + '分';
  };

  St.loadSettings();
  St.loadProgress();
})();
