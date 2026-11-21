/* 画布渲染器
 * 所有绘制都在 1920x1080 设计坐标中进行，按输出分辨率缩放（540p～2160p）。
 * 画质由 DM.State.gfx() 控制：建模/材质/光影（交给美术生成器）、后期、角色环境光、粒子、帧率。
 * 性能策略：
 *  - 只在 dirty、补间、或有环境动画（天气/烛火闪烁/颗粒）时重绘，环境动画按帧率上限节流；
 *  - 背景、立绘、受光立绘、暗角、雾、颗粒全部缓存；粒子用定长 TypedArray 对象池，每帧零分配；
 *  - 标签页隐藏时由主循环暂停。
 */
(function () {
  'use strict';
  var DM = window.DM, Core = DM.Core, St = DM.State;
  var R = DM.Render = {};
  var W = 1920, H = 1080, W2 = W * 2;
  var cv, g, k = 1, cfg = null, pixel = false;
  var dirty = true;

  var v = {
    bgId: 'black', variant: null, bg: null, meta: { lights: [], key: null, outdoor: false },
    filter: 'none', weather: 'none', flashback: false,
    trial: false, pan: 0, panFrom: 0, panTo: 0, panT: 1, speaker: null, speakerT: 1,
    stage: [], sprites: [], dim: 0
  };
  R.view = v;
  var POS = { L: 512, C: 960, R: 1408 };

  R.init = function (canvas) {
    cv = canvas;
    g = cv.getContext('2d', { alpha: false });
    R.configure();
  };
  R.markDirty = function () { dirty = true; };

  // ---------- 画质配置 ----------
  R.configure = function () {
    cfg = St.gfx();
    pixel = cfg.style === 'pixel' || !DM.HDArt;
    var cw, ch;
    if (pixel) { cw = 480; ch = 270; }
    else {
      var res = cfg.res === 'auto' ? Core.stagePixelHeight() : +cfg.res;
      res = Core.clamp(res || 1080, 360, cfg.cap || 2160);
      ch = Math.round(res); cw = Math.round(res * 16 / 9);
    }
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    k = cw / W;
    R.k = k;
    if (!pixel) DM.HDArt.setQuality({ s: k, model: cfg.model, tex: cfg.tex, light: cfg.light }, cfg.mem);
    document.body.classList.toggle('pixel', pixel);
    document.body.classList.toggle('hd', !pixel);
    litCache = {}; vignette = null; fogTex = null; small = null;
    if (v.bgId) { v.bg = Core.art.bg(v.bgId, v.variant || undefined); v.meta = Core.art.meta(v.bgId, v.variant || undefined); }
    seedParticles(v.weather);
    dirty = true;
  };
  var resizeT = null;
  R.onResize = function () {
    if (!cfg || cfg.res !== 'auto' || pixel) { dirty = true; return; }
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      var want = Core.clamp(Core.stagePixelHeight(), 360, cfg.cap || 2160);
      if (Math.abs(want - cv.height) / cv.height > 0.15) R.configure();
    }, 400);
  };
  R.size = function () { return { w: cv.width, h: cv.height }; };

  // ---------- 缓存 ----------
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  var dimCache = {};
  function dimmed(src, key) {
    var e = dimCache[key];
    if (e && e.src === src) return e.c;
    var c = mk(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(8,8,20,0.5)'; x.fillRect(0, 0, c.width, c.height);
    dimCache[key] = { src: src, c: c };
    return c;
  }

  // 角色环境光：按场景主光 + 滤镜给立绘上色、加轮廓光
  var litCache = {}, litCount = 0;
  function hexRgb(c) { var h = c.charAt(0) === '#' ? c.slice(1) : c; if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hx(n) { n = Math.round(n); return (n < 16 ? '0' : '') + n.toString(16); }
  function mix(a, b, t) { var x = hexRgb(a), y = hexRgb(b); return '#' + hx(x[0] + (y[0] - x[0]) * t) + hx(x[1] + (y[1] - x[1]) * t) + hx(x[2] + (y[2] - x[2]) * t); }
  function litParams() {
    var key = v.meta && v.meta.key, f = v.filter;
    var p = { amb: key && key.amb || '#4a4658', col: key && key.color || '#fff0dc', rim: key && key.rim != null ? key.rim : 0.3, dir: key && key.x != null ? key.x : -0.4, str: 0.22 };
    if (v.trial) { p.amb = '#5a3038'; p.col = '#ffb090'; p.rim = 0.45; p.dir = 0; p.str = 0.2; }
    if (f === 'night') { p.amb = mix(p.amb, '#34407a', 0.65); p.col = '#a9b8ff'; p.str = 0.42; p.rim = Math.max(p.rim, 0.45); }
    else if (f === 'dark') { p.amb = mix(p.amb, '#3a3446', 0.6); p.str = 0.4; }
    else if (f === 'red') { p.amb = mix(p.amb, '#80202c', 0.6); p.col = '#ff7060'; p.str = 0.38; }
    else if (f === 'cold') { p.amb = mix(p.amb, '#6a7cb0', 0.6); p.col = '#d8e6ff'; p.str = 0.3; }
    else if (f === 'dusk') { p.amb = mix(p.amb, '#a06048', 0.5); p.col = '#ffb478'; p.str = 0.28; }
    else if (f === 'sepia') { p.str = 0.1; p.rim = 0; }
    return p;
  }
  function litPortrait(src, id, expr) {
    var p = litParams();
    var key = id + ':' + expr + ':' + p.amb + p.col + p.rim + p.dir + p.str;
    var e = litCache[key];
    if (e && e.src === src) return e.c;
    var w = src.width, h = src.height, c = mk(w, h), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    // 环境色（暗部色调）
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = mix('#ffffff', p.amb, p.str); x.fillRect(0, 0, w, h);
    // 主光方向：远离光源的一侧更暗
    if (Math.abs(p.dir) > 0.15 && cfg.light >= 1) {
      var gr = x.createLinearGradient(p.dir < 0 ? 0 : w, 0, p.dir < 0 ? w : 0, 0);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(150,145,170,1)');
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
    }
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
    // 轮廓光
    if (p.rim > 0 && cfg.light >= 1) {
      var t = mk(w, h), tx = t.getContext('2d'), d = Math.max(2, w * 0.011);
      var dx = Math.abs(p.dir) < 0.15 ? 0 : (p.dir < 0 ? d : -d), dy = Math.abs(p.dir) < 0.15 ? d : d * 0.35;
      tx.drawImage(src, 0, 0);
      tx.globalCompositeOperation = 'destination-out'; tx.drawImage(src, dx, dy);
      tx.globalCompositeOperation = 'source-in'; tx.fillStyle = p.col; tx.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(0.85, p.rim * 0.7); x.drawImage(t, 0, 0);
      if (cfg.light >= 2) { x.globalAlpha = Math.min(0.4, p.rim * 0.3); x.drawImage(t, -dx * 0.6, -dy * 0.6); }
      x.globalAlpha = 1;
    }
    x.globalCompositeOperation = 'source-over';
    if (++litCount > 40) { litCache = {}; litCount = 0; }
    litCache[key] = { src: src, c: c };
    return c;
  }
  function portrait(id, expr, dim) {
    var src = Core.art.portrait(id, expr || 'normal');
    if (!pixel && cfg.charLight) src = litPortrait(src, id, expr || 'normal');
    return dim ? dimmed(src, id + ':' + expr + ':' + (pixel ? 'p' : 'h')) : src;
  }

  var vignette = null;
  function getVignette(strong) {
    if (vignette && vignette.strong === strong) return vignette.c;
    var c = mk(480, 270), x = c.getContext('2d');
    var gr = x.createRadialGradient(240, 135, 70, 240, 135, 290);
    if (strong) { gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,8,0,0.85)'); }
    else { gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); }
    x.fillStyle = gr; x.fillRect(0, 0, 480, 270);
    vignette = { c: c, strong: strong };
    return c;
  }
  var sepiaVig = null;
  function getSepiaVig() {
    if (sepiaVig) return sepiaVig;
    var c = mk(480, 270), x = c.getContext('2d');
    var gr = x.createRadialGradient(240, 135, 70, 240, 135, 290);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,8,0,0.85)');
    x.fillStyle = gr; x.fillRect(0, 0, 480, 270);
    return (sepiaVig = c);
  }

  var judgeGlow = null;
  function getJudgeGlow() {
    if (judgeGlow) return judgeGlow;
    var c = mk(480, 270), x = c.getContext('2d');
    var gr = x.createRadialGradient(240, 120, 10, 240, 120, 170);
    gr.addColorStop(0, 'rgba(170,0,30,0.55)'); gr.addColorStop(0.6, 'rgba(110,0,20,0.25)'); gr.addColorStop(1, 'rgba(60,0,10,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 480, 270);
    return (judgeGlow = c);
  }

  var fogTex = null;
  function getFog() {
    if (fogTex) return fogTex;
    var FW = 480, FH = 270;
    var c = mk(FW, FH), x = c.getContext('2d'), rnd = Core.rng(77);
    for (var i = 0; i < 46; i++) {
      var cx = rnd() * FW, cy = 60 + rnd() * 200, r = 30 + rnd() * 70;
      for (var off = -FW; off <= FW; off += FW) {
        if (off !== 0 && !(cx - r < 0 && off > 0) && !(cx + r > FW && off < 0)) continue;
        var gr = x.createRadialGradient(cx + off, cy, 0, cx + off, cy, r);
        gr.addColorStop(0, 'rgba(190,195,215,0.18)'); gr.addColorStop(1, 'rgba(190,195,215,0)');
        x.fillStyle = gr; x.fillRect(cx + off - r, cy - r, r * 2, r * 2);
      }
    }
    return (fogTex = c);
  }
  var flake = null;
  function getFlake() {
    if (flake) return flake;
    var c = mk(32, 32), x = c.getContext('2d');
    var gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(240,246,255,0.8)'); gr.addColorStop(1, 'rgba(230,240,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    return (flake = c);
  }
  var grain = null;
  function getGrain() {
    if (grain) return grain;
    var c = mk(160, 160), x = c.getContext('2d'), d = x.createImageData(160, 160), r = Core.rng(99);
    for (var i = 0; i < d.data.length; i += 4) { var n = 100 + r() * 155; d.data[i] = d.data[i + 1] = d.data[i + 2] = n; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    return (grain = c);
  }
  var small = null;
  function getSmall() {
    var sw = Math.max(32, Math.round(cv.width / 8)), sh = Math.max(18, Math.round(cv.height / 8));
    if (!small || small.width !== sw) small = mk(sw, sh);
    return small;
  }

  // ---------- 粒子（对象池） ----------
  var MAXP = 640;
  var px = new Float32Array(MAXP), py = new Float32Array(MAXP), pv = new Float32Array(MAXP), pl = new Float32Array(MAXP), pz = new Float32Array(MAXP);
  var pcount = 0, fogX = 0, time = 0;
  function seedParticles(kind) {
    var rnd = Core.rng(kind === 'rain' ? 11 : 23), lvl = cfg ? cfg.particles : 1;
    var n = { rain: [70, 150, 280], snow: [90, 200, 380], blizzard: [160, 340, 620], embers: [40, 70, 110] }[kind];
    pcount = n ? n[Core.clamp(lvl | 0, 0, 2)] : 0;
    for (var i = 0; i < pcount; i++) {
      px[i] = rnd() * W; py[i] = rnd() * H; pz[i] = 0.25 + rnd() * 0.75;
      if (kind === 'rain') { pv[i] = 1500 + rnd() * 700; pl[i] = 26 + rnd() * 34; }
      else if (kind === 'snow' || kind === 'blizzard') { pv[i] = rnd() * 6.283; pl[i] = 2 + pz[i] * 7; }
      else { pv[i] = 56 + rnd() * 104; pl[i] = 4 + (rnd() < 0.3 ? 4 : 0); }
    }
  }

  // ---------- 场景控制 ----------
  R.setBg = function (id, variant) {
    v.bgId = id; v.variant = variant || null;
    v.bg = Core.art.bg(id, variant || undefined);
    v.meta = Core.art.meta(id, variant || undefined);
    dirty = true;
  };
  R.bgReady = function (id, variant) { return Core.art.hasBg(id, variant || undefined); };
  R.setFilter = function (f) { v.filter = f || 'none'; dirty = true; };
  R.setWeather = function (w) {
    w = w || 'none';
    if (w !== v.weather) { v.weather = w; seedParticles(w); }
    dirty = true;
  };
  R.setFlashback = function (on) { v.flashback = !!on; dirty = true; };
  R.setDim = function (d) { v.dim = d; dirty = true; };

  R.clearStage = function () { v.stage.length = 0; dirty = true; };
  function find(id) { for (var i = 0; i < v.stage.length; i++) if (v.stage[i].id === id && !v.stage[i].out) return v.stage[i]; return null; }
  R.show = function (id, expr, pos) {
    pos = pos || 'C';
    var s = find(id);
    if (s) { s.expr = expr || s.expr; if (s.pos !== pos) { s.pos = pos; s.x0 = s.x; s.t = 0; } dirty = true; return; }
    for (var i = v.stage.length - 1; i >= 0; i--) if (v.stage[i].pos === pos) v.stage.splice(i, 1);
    v.stage.push({ id: id, expr: expr || 'normal', pos: pos, x: POS[pos], x0: POS[pos], a: 0, t: 0, out: false });
    dirty = true;
  };
  R.hide = function (id) {
    for (var i = 0; i < v.stage.length; i++) if (v.stage[i].id === id) { v.stage[i].out = true; v.stage[i].t = 0; }
    dirty = true;
  };
  R.speak = function (id, expr) {
    v.speaking = id;
    if (v.trial) { R.trialSpeaker(id, expr); return; }
    if (id === 'ritsu') { dirty = true; return; }
    var s = find(id);
    if (s) { if (expr) s.expr = expr; dirty = true; return; }
    v.stage.length = 0;
    R.show(id, expr, 'C');
  };
  R.narrate = function () { v.speaking = null; dirty = true; };
  R.stageSnapshot = function () {
    return v.stage.filter(function (s) { return !s.out; }).map(function (s) { return { id: s.id, expr: s.expr, pos: s.pos }; });
  };

  // ---------- 审判模式 ----------
  function seats() { return DM.GAME.seats || []; }
  R.setTrial = function (on) {
    v.trial = !!on;
    v.speaker = null; v.stage.length = 0;
    if (on) { v.pan = v.panTo = 0; v.panT = 1; }
    dirty = true;
  };
  function seatPan(id) {
    if (id === DM.GAME.judgeId) return 0;
    var S = seats(), i = S.indexOf(id);
    if (i < 0) i = Core.hash(id) % Math.max(1, S.length);
    return Math.round((i + 0.5) / Math.max(1, S.length) * W2) % W2;
  }
  R.trialSpeaker = function (id, expr) {
    if (v.speaker && v.speaker.id === id) { if (expr) v.speaker.expr = expr; dirty = true; return; }
    v.speaker = { id: id, expr: expr || 'normal' };
    v.panFrom = v.pan; v.panTo = seatPan(id); v.panT = 0; v.speakerT = 0;
    dirty = true;
  };

  // ---------- 探索小人 ----------
  R.setSprites = function (list) { v.sprites = list || []; dirty = true; };

  // ---------- 预生成（空闲时） ----------
  var queue = [];
  R.prefetch = function (items) {
    if (pixel) return;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], dup = false;
      for (var j = 0; j < queue.length; j++) if (queue[j][0] === it[0] && queue[j][1] === it[1] && queue[j][2] === it[2]) { dup = true; break; }
      if (!dup) queue.push(it);
    }
    if (queue.length > 40) queue.splice(0, queue.length - 40);
  };
  function prefetchOne() {
    while (queue.length) {
      var it = queue.shift();
      if (it[0] === 'bg') { if (!Core.art.hasBg(it[1], it[2])) { Core.art.bg(it[1], it[2]); return true; } }
      else if (it[0] === 'pt') { if (!Core.art.hasPortrait(it[1], it[2])) { Core.art.portrait(it[1], it[2]); return true; } }
    }
    return false;
  }

  // ---------- 动画判断 ----------
  function weatherVisible() {
    if (v.weather === 'none') return false;
    if (v.weather === 'embers') return true;
    return !v.trial && !!(v.meta && v.meta.outdoor);
  }
  function lightsAnimated() {
    if (pixel || cfg.light < 1 || v.trial || !v.meta) return false;
    var L = v.meta.lights;
    for (var i = 0; i < L.length; i++) if (L[i].flicker) return true;
    return false;
  }

  // ---------- 主循环 ----------
  var last = 0, lastDraw = 0;
  R.tick = function (now, idle) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now; time += dt;
    var anim = false;
    for (var i = v.stage.length - 1; i >= 0; i--) {
      var s = v.stage[i];
      if (s.t < 1) { s.t = Math.min(1, s.t + dt / 0.22); anim = true; }
      var e = Core.easeOut(s.t);
      if (s.out) { s.a = 1 - e; if (s.t >= 1) { v.stage.splice(i, 1); } }
      else { s.a = e; s.x = s.x0 + (POS[s.pos] - s.x0) * e; }
    }
    if (v.trial && v.panT < 1) {
      v.panT = Math.min(1, v.panT + dt / 0.38);
      var d = v.panTo - v.panFrom;
      if (d > W) d -= W2; else if (d < -W) d += W2;
      v.pan = (v.panFrom + d * Core.easeOut(v.panT) + W2) % W2;
      anim = true;
    }
    if (v.trial && v.speakerT < 1) { v.speakerT = Math.min(1, v.speakerT + dt / 0.3); anim = true; }

    var wv = weatherVisible(), la = lightsAnimated();
    if (!dirty && !anim) {
      if (!wv && !la) { if (idle) prefetchOne(); return; }
      var fps = wv ? (cfg.fps >= 60 ? 60 : 30) : 24;
      if (now - lastDraw < 1000 / fps - 2) return;
    }
    var fdt = lastDraw ? Math.min(0.1, (now - lastDraw) / 1000) : dt;
    lastDraw = now;
    dirty = false;
    draw(fdt);
  };

  // ---------- 绘制 ----------
  function drawBgImage(img) {
    g.drawImage(img, 0, 0, img.width, img.height, 0, 0, W, H);
  }
  function draw(dt) {
    g.setTransform(k, 0, 0, k, 0, 0);
    g.imageSmoothingEnabled = !pixel;
    if (!pixel && 'imageSmoothingQuality' in g) g.imageSmoothingQuality = 'high';
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    // 背景
    if (v.trial) drawPano();
    else if (v.bg) drawBgImage(v.bg);
    else { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }

    // 探索小人
    for (var i = 0; i < v.sprites.length; i++) {
      var sp = v.sprites[i], img = Core.art.sprite(sp.id), X = sp.x * 4;
      if (!pixel && cfg.light >= 1) {
        g.save(); g.translate(X, 940); g.scale(1, 0.22);
        var cg = g.createRadialGradient(0, 0, 0, 0, 0, 60); cg.addColorStop(0, 'rgba(0,0,0,0.5)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = cg; g.fillRect(-60, -60, 120, 120); g.restore();
      }
      g.drawImage(img, 0, 0, img.width, img.height, X - 64, 944 - 256, 128, 256);
    }

    applyFilter(v.filter);
    if (!pixel && cfg.light >= 1 && !v.trial) drawLights();
    drawWeather(dt);

    // 立绘
    if (v.trial) drawTrialSpeaker();
    else {
      var multi = v.stage.length > 1;
      for (var j = 0; j < v.stage.length; j++) {
        var s = v.stage[j];
        var dim = multi && v.speaking && v.speaking !== s.id && v.speaking !== 'ritsu';
        var im = portrait(s.id, s.expr, dim);
        g.globalAlpha = s.a;
        g.drawImage(im, 0, 0, im.width, im.height, Math.round(s.x - 320), Math.round(H - 896 + (1 - s.a) * 32), 640, 896);
      }
      g.globalAlpha = 1;
    }

    // 后期
    if (!pixel && cfg.post >= 2) bloom();
    if (v.flashback) {
      g.globalCompositeOperation = 'color'; g.fillStyle = '#9a7650'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = '#efdcc0'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over'; g.drawImage(getSepiaVig(), 0, 0, W, H);
    }
    if (!pixel && cfg.post >= 1 && !v.flashback) g.drawImage(getVignette(false), 0, 0, W, H);
    if (!pixel && cfg.post >= 2) {
      var gr = getGrain(), pat = g.createPattern(gr, 'repeat');
      g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.07;
      g.setTransform(1, 0, 0, 1, -Math.floor(Math.random() * 160), -Math.floor(Math.random() * 160));
      g.fillStyle = pat; g.fillRect(0, 0, cv.width + 160, cv.height + 160);
      g.restore();
      g.setTransform(k, 0, 0, k, 0, 0);
    }
    if (v.dim > 0) { g.fillStyle = 'rgba(4,4,12,' + (v.dim * 0.7) + ')'; g.fillRect(0, 0, W, H); }
  }

  function drawPano() {
    var bg = Core.art.bg(DM.GAME.trialBg || 'judgment');
    var o = ((Math.round(v.pan) - 960) % W2 + W2) % W2;
    for (var sh = -W2; sh <= W2; sh += W2) {
      var xa = sh - o, xb = sh + W - o;
      if (xa < W && xa + W > 0) g.drawImage(bg, 0, 0, bg.width, bg.height, xa, 0, W, H);
      if (xb < W && xb + W > 0) {
        g.save(); g.translate(xb + W, 0); g.scale(-1, 1);
        g.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, W, H); g.restore();
      }
    }
    var gr = g.createLinearGradient(0, 600, 0, H);
    gr.addColorStop(0, 'rgba(60,0,10,0)'); gr.addColorStop(1, 'rgba(60,0,10,0.55)');
    g.fillStyle = gr; g.fillRect(0, 600, W, H - 600);
  }

  function applyFilter(f) {
    if (f === 'none' || !f) return;
    g.globalCompositeOperation = 'multiply';
    if (f === 'night') { g.fillStyle = '#5a68a8'; g.fillRect(0, 0, W, H); }
    else if (f === 'dark') { g.fillStyle = '#3e3c50'; g.fillRect(0, 0, W, H); }
    else if (f === 'red') { g.fillStyle = '#d86464'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(140,0,10,0.12)'; g.fillRect(0, 0, W, H); }
    else if (f === 'cold') { g.fillStyle = '#9fb2e0'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(200,215,240,0.08)'; g.fillRect(0, 0, W, H); }
    else if (f === 'dusk') { g.fillStyle = '#e8a880'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(255,140,60,0.06)'; g.fillRect(0, 0, W, H); }
    else if (f === 'sepia') { g.globalCompositeOperation = 'color'; g.fillStyle = '#9a7650'; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = 'source-over';
  }

  // 动态光源：闪烁的光晕；夜晚滤镜下光源依然明亮
  function drawLights() {
    var L = v.meta.lights; if (!L || !L.length) return;
    var f = v.filter, night = f === 'night' || f === 'dark' || f === 'cold';
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < L.length; i++) {
      var l = L[i], kind = l.kind || 'lamp';
      var fl = 1;
      if (l.flicker) fl = 1 + l.flicker * 0.55 * (Math.sin(time * 7.3 + i * 1.7) * 0.5 + Math.sin(time * 13.1 + i * 0.9) * 0.3 + Math.sin(time * 23.7 + i * 2.3) * 0.2);
      var cool = kind === 'window' || kind === 'moon';
      var boost = night ? (cool ? 0.5 : 1.5) : (cool ? 0.25 : 0.45);
      if (f === 'sepia' || v.flashback) boost *= 0.5;
      var a = Math.max(0, (l.i == null ? 0.6 : l.i) * boost * fl * 0.5), r = (l.r || 160) * (0.96 + 0.04 * fl);
      var col = hexRgb(l.color || '#ffb060');
      var gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      gr.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
      gr.addColorStop(0.35, 'rgba(' + col + ',' + (a * 0.35).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gr; g.fillRect(l.x - r, l.y - r, r * 2, r * 2);
      if (cfg.light >= 2 && !cool) {
        var r2 = r * 2.2, a2 = a * 0.18, gr2 = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, r2);
        gr2.addColorStop(0, 'rgba(' + col + ',' + a2.toFixed(3) + ')'); gr2.addColorStop(1, 'rgba(' + col + ',0)');
        g.fillStyle = gr2; g.fillRect(l.x - r2, l.y - r2, r2 * 2, r2 * 2);
      }
    }
    g.restore();
  }

  // 泛光：缩小画面 → 自乘两次只留亮部 → 放大叠加
  function bloom() {
    var s = getSmall(), x = s.getContext('2d');
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    x.drawImage(cv, 0, 0, s.width, s.height);
    x.globalCompositeOperation = 'multiply'; x.drawImage(s, 0, 0); x.drawImage(s, 0, 0);
    x.globalCompositeOperation = 'source-over';
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.32;
    g.drawImage(s, 0, 0, s.width, s.height, 0, 0, W, H);
    g.restore();
  }

  function drawWeather(dt) {
    if (!weatherVisible()) return;
    var w = v.weather, i;
    if (w === 'rain') {
      g.strokeStyle = 'rgba(175,195,235,0.5)'; g.lineWidth = 1.8; g.lineCap = 'round';
      g.beginPath();
      for (i = 0; i < pcount; i++) {
        py[i] += pv[i] * dt; px[i] -= pv[i] * dt * 0.18;
        if (py[i] > H) { py[i] = -pl[i]; px[i] = (px[i] + 389 * i) % (W + 160); }
        if (px[i] < -16) px[i] += W + 32;
        g.moveTo(px[i], py[i]); g.lineTo(px[i] + pl[i] * 0.18, py[i] - pl[i]);
      }
      g.stroke();
      if (!pixel && cfg.particles >= 2) {   // 地面溅起的水花
        g.fillStyle = 'rgba(190,210,240,0.35)';
        for (i = 0; i < pcount; i += 7) { var sx = (px[i] * 1.7 + i * 53) % W, sy = 960 + (i % 9) * 12; g.fillRect(sx, sy, 6, 2); }
      }
    } else if (w === 'snow' || w === 'blizzard') {
      var bz = w === 'blizzard', fl = getFlake(), soft = !pixel && cfg.particles >= 1;
      if (!soft) g.fillStyle = 'rgba(240,245,255,0.9)';
      for (i = 0; i < pcount; i++) {
        var z = pz[i];
        pv[i] += dt * (0.8 + z);
        var vy = bz ? 260 + z * 420 : 40 + z * 110, vx = bz ? -(520 + z * 820) : Math.sin(pv[i]) * 30 * z - 12;
        py[i] += vy * dt; px[i] += vx * dt;
        if (py[i] > H + 10) { py[i] = -10; px[i] = (px[i] + 577 * i) % W; }
        if (px[i] < -20) px[i] += W + 40; else if (px[i] > W + 20) px[i] -= W + 40;
        var sz = pl[i] * (bz ? 1.1 : 1);
        if (soft) { g.globalAlpha = 0.45 + z * 0.55; g.drawImage(fl, px[i] - sz, py[i] - sz, sz * 2, sz * 2); }
        else g.fillRect(px[i], py[i], sz, sz);
      }
      g.globalAlpha = 1;
      if (bz) {
        if (!pixel && cfg.particles >= 1) {
          g.strokeStyle = 'rgba(235,242,255,0.22)'; g.lineWidth = 2; g.beginPath();
          for (i = 0; i < pcount; i += 5) { g.moveTo(px[i], py[i]); g.lineTo(px[i] + 90 * pz[i], py[i] - 34 * pz[i]); }
          g.stroke();
        }
        fogX = (fogX + dt * 260) % W;
        var fg = getFog(), o = fogX;
        g.globalAlpha = 0.85;
        g.drawImage(fg, 0, 0, fg.width, fg.height, -o, 0, W, H);
        g.drawImage(fg, 0, 0, fg.width, fg.height, W - o, 0, W, H);
        g.globalAlpha = 1;
        g.fillStyle = 'rgba(225,232,245,0.16)'; g.fillRect(0, 0, W, H);
      }
    } else if (w === 'fog') {
      var f = getFog();
      fogX = (fogX + dt * 24) % W;
      g.globalAlpha = 0.9;
      g.drawImage(f, 0, 0, f.width, f.height, -fogX, 0, W, H);
      g.drawImage(f, 0, 0, f.width, f.height, W - fogX, 0, W, H);
      g.globalAlpha = 1;
    } else if (w === 'embers') {
      if (!pixel) { g.save(); g.globalCompositeOperation = 'lighter'; }
      for (i = 0; i < pcount; i++) {
        py[i] -= pv[i] * dt; px[i] += Math.sin((py[i] + i * 52) * 0.0125) * 1.6;
        if (py[i] < -8) { py[i] = H + 8; px[i] = (px[i] + 524 * i) % W; }
        g.fillStyle = i % 3 ? 'rgba(255,150,60,0.85)' : 'rgba(255,220,120,0.9)';
        g.fillRect(px[i], py[i], pl[i], pl[i]);
      }
      if (!pixel) g.restore();
    }
  }

  function drawTrialSpeaker() {
    var sp = v.speaker;
    if (!sp) return;
    var t = Core.easeOut(v.speakerT);
    var im = portrait(sp.id, sp.expr, false);
    var x = Math.round(960 - 320 + (1 - t) * 96), y = H - 896 + 24;
    if (sp.id === DM.GAME.judgeId) g.drawImage(getJudgeGlow(), 0, 0, W, H);
    g.globalAlpha = t;
    g.drawImage(im, 0, 0, im.width, im.height, x, y, 640, 896);
    g.globalAlpha = 1;
    if (sp.id !== DM.GAME.judgeId && seats().indexOf(sp.id) >= 0) {
      // 证言台扶手
      if (pixel) {
        g.fillStyle = '#1a0d0a'; g.fillRect(568, 704, 784, 64);
        g.fillStyle = '#4a2a1a'; g.fillRect(568, 704, 784, 12);
        g.fillStyle = '#8a6a3a'; g.fillRect(568, 704, 784, 4);
        g.fillStyle = '#c9a25a'; g.fillRect(904, 724, 112, 24);
      } else {
        var gr = g.createLinearGradient(0, 700, 0, 780);
        gr.addColorStop(0, '#5a3420'); gr.addColorStop(0.15, '#2a160e'); gr.addColorStop(1, '#120806');
        g.fillStyle = gr; g.fillRect(540, 704, 840, 80);
        g.fillStyle = 'rgba(255,210,150,0.35)'; g.fillRect(540, 704, 840, 3);
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(540, 780, 840, 6);
        var pg = g.createLinearGradient(900, 0, 1020, 0);
        pg.addColorStop(0, '#8a6a30'); pg.addColorStop(0.5, '#f0d080'); pg.addColorStop(1, '#8a6a30');
        g.fillStyle = pg; g.fillRect(900, 726, 120, 22);
      }
    }
  }
})();
