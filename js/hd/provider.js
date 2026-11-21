/* HD 美术提供者：按当前渲染倍率与画质生成并缓存高清图像（LRU，按字节预算淘汰）
 * 接口与像素美术 DM.Art 保持一致（引擎通过 DM.Core.art 调用）：
 *   getBackground(id, variant) getPortrait(id, expr) getSprite(id) getIcon(id) getMap() meta(id, variant)
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK;
  var A = DM.HDArt = {};

  A.q = K.Q(1, 2, 2, 2);
  A.budget = 256 * 1024 * 1024;   // 缓存预算（字节）
  var cache = {}, used = 0, tick = 0;
  A.stats = { gen: 0, ms: 0, hits: 0 };

  function qkey() { var q = A.q; return q.s.toFixed(3) + '/' + q.model + q.tex + q.light; }
  A.setQuality = function (q, budgetMB) {
    var old = qkey();
    A.q = { s: q.s, model: q.model, tex: q.tex, light: q.light };
    if (budgetMB) A.budget = budgetMB * 1024 * 1024;
    if (qkey() !== old) A.clear();
  };
  A.clear = function () { cache = {}; used = 0; K.clearTexCache(); };

  function evict(need) {
    if (used + need <= A.budget) return;
    var keys = Object.keys(cache).sort(function (a, b) { return cache[a].t - cache[b].t; });
    for (var i = 0; i < keys.length && used + need > A.budget; i++) {
      var e = cache[keys[i]]; if (e.pin) continue;
      used -= e.bytes; delete cache[keys[i]];
    }
  }
  function memo(key, make) {
    var e = cache[key];
    if (e) { e.t = ++tick; A.stats.hits++; return e.c; }
    var t0 = (root.performance || Date).now();
    var c;
    try { c = make(); } catch (err) { if (root.console) console.warn('[HDArt] 生成失败 ' + key, err); c = K.canvas(8, 8); }
    var ms = (root.performance || Date).now() - t0;
    A.stats.gen++; A.stats.ms += ms; A.stats.last = key + ' ' + ms.toFixed(1) + 'ms';
    var bytes = c.width * c.height * 4;
    evict(bytes);
    cache[key] = { c: c, bytes: bytes, t: ++tick };
    used += bytes;
    return c;
  }
  A.has = function (kind, id, v) { return !!cache[kind + ':' + id + ':' + (v || '') + ':' + qkey()]; };
  A.usedMB = function () { return used / 1048576; };

  function fallbackBg(g, id) {
    K.vgrad(g, 0, 0, K.DW, 720, ['#1d1a26', '#2b2735', '#1d1a26']);
    K.vgrad(g, 0, 720, K.DW, 360, ['#17141e', '#0c0a10']);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 718, K.DW, 4);
    K.vignette(g, K.DW, K.DH, 0.6);
    void id;
  }

  A.getBackground = function (id, variant) {
    var v = variant ? String(variant) : '';
    return memo('bg:' + id + ':' + v + ':' + qkey(), function () {
      var q = A.q, def = DM.HDBG.defs[id];
      if (id === 'black' || id === 'white') {
        var c0 = K.canvas(16, 9), x0 = c0.getContext('2d'); x0.fillStyle = id === 'white' ? '#fff' : '#000'; x0.fillRect(0, 0, 16, 9); return c0;
      }
      var S = K.surface(K.DW, K.DH, q.s, false);
      S.g.fillStyle = '#000'; S.g.fillRect(0, 0, K.DW, K.DH);
      if (def && def.draw) {
        S.g.save(); def.draw(S.g, { s: S.s, model: q.model, tex: q.tex, light: q.light }, v); S.g.restore();
      } else fallbackBg(S.g, id);
      K.noShadow(S.g);
      return S.canvas;
    });
  };
  // 背景的光源与主光信息（供动态光影与角色环境光使用）
  A.meta = function (id, variant) {
    var def = DM.HDBG.defs[id] || {};
    var L = typeof def.lights === 'function' ? def.lights(variant || '') : (def.lights || []);
    var key = typeof def.key === 'function' ? def.key(variant || '') : def.key;
    return { lights: L || [], key: key || null, outdoor: !!def.outdoor };
  };
  A.getPortrait = function (id, expr) {
    return memo('pt:' + id + ':' + (expr || 'normal') + ':' + qkey(), function () {
      var q = A.q, S = K.surface(K.PW, K.PH, q.s);
      var gen = DM.HDChar.gen;
      if (gen && gen.portrait) gen.portrait(S.g, id, expr || 'normal', { s: S.s, model: q.model, tex: q.tex, light: q.light });
      else { S.g.fillStyle = 'rgba(60,60,80,0.6)'; K.ellipse(S.g, 320, 300, 150, 180); S.g.fill(); S.g.fillRect(140, 480, 360, 416); }
      K.noShadow(S.g);
      return S.canvas;
    });
  };
  // 缩略图（菜单/手账/投票卡片用）：固定像素宽度，与渲染倍率无关
  A.getPortraitThumb = function (id, expr, w) {
    w = w || 240;
    return memo('pth:' + id + ':' + (expr || 'normal') + ':' + w + ':' + A.q.model + A.q.tex + A.q.light, function () {
      var s = w / K.PW, S = K.surface(K.PW, K.PH, s);
      var gen = DM.HDChar.gen;
      if (gen && gen.portrait) gen.portrait(S.g, id, expr || 'normal', { s: S.s, model: A.q.model, tex: Math.min(1, A.q.tex), light: A.q.light });
      K.noShadow(S.g);
      return S.canvas;
    });
  };
  A.getSprite = function (id) {
    return memo('sp:' + id + ':' + qkey(), function () {
      var q = A.q, S = K.surface(K.SW, K.SH, q.s);
      var gen = DM.HDChar.gen;
      if (gen && gen.sprite) gen.sprite(S.g, id, { s: S.s, model: q.model, tex: q.tex, light: q.light });
      else { S.g.fillStyle = '#556'; K.rr(S.g, 40, 40, 48, 200, 20); S.g.fill(); }
      K.noShadow(S.g);
      return S.canvas;
    });
  };
  // 图标：固定 96px（界面里会缩放显示）
  A.getIcon = function (id) {
    return memo('ic:' + id + ':' + A.q.model + A.q.tex + A.q.light, function () {
      var S = K.surface(K.IW, K.IW, 96 / K.IW);
      var fn = DM.HDIcon.defs[id] || DM.HDIcon.defs.generic;
      if (fn) fn(S.g, { s: S.s, model: A.q.model, tex: Math.min(1, A.q.tex), light: A.q.light });
      else { S.g.fillStyle = '#887'; K.rr(S.g, 24, 24, 80, 80, 12); S.g.fill(); }
      K.noShadow(S.g);
      return S.canvas;
    });
  };
  A.getMap = function () { return A.getBackground('map'); };
})(typeof window !== 'undefined' ? window : globalThis);
