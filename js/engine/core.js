/* 核心工具：舞台缩放（含移动端安全区）、DOM 辅助、计时、美术接口分发、脚本按需加载 */
(function () {
  'use strict';
  var DM = window.DM = window.DM || {};
  var Core = DM.Core = {};

  Core.W = 960; Core.H = 540;     // UI 逻辑尺寸
  Core.DW = 1920; Core.DH = 1080; // 画面设计尺寸
  Core.scale = 1;
  Core.offX = 0; Core.offY = 0;

  Core.$ = function (sel, root) { return (root || document).querySelector(sel); };
  Core.el = function (tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  Core.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); };

  // 安全区（刘海屏、圆角、手势条）
  var safeProbe = null;
  function safeInsets() {
    if (!safeProbe) {
      safeProbe = document.createElement('div');
      safeProbe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
        'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)';
      document.body.appendChild(safeProbe);
    }
    var cs = getComputedStyle(safeProbe);
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  Core.viewport = function () {
    var vv = window.visualViewport;
    return { w: vv ? vv.width : window.innerWidth, h: vv ? vv.height : window.innerHeight };
  };
  Core.fit = function () {
    var stage = document.getElementById('stage');
    var vp = Core.viewport(), ins = safeInsets();
    var w = vp.w - ins.l - ins.r, h = vp.h - ins.t - ins.b;
    var s = Math.min(w / Core.W, h / Core.H);
    Core.scale = s;
    Core.offX = Math.round(ins.l + (w - Core.W * s) / 2);
    Core.offY = Math.round(ins.t + (h - Core.H * s) / 2);
    stage.style.transform = 'translate(' + Core.offX + 'px,' + Core.offY + 'px) scale(' + s + ')';
    if (DM.Render && DM.Render.onResize) DM.Render.onResize();
    if (DM.UI && DM.UI.onResize) DM.UI.onResize();
  };
  // 舞台在屏幕上的实际物理像素高度（用于「自动」分辨率）
  Core.stagePixelHeight = function () { return Math.round(Core.H * Core.scale * (window.devicePixelRatio || 1)); };

  Core.toLocal = function (cx, cy) {
    return { x: (cx - Core.offX) / Core.scale, y: (cy - Core.offY) / Core.scale };
  };

  Core.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  Core.frame = function () { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); };
  Core.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  Core.easeOut = function (t) { return 1 - (1 - t) * (1 - t) * (1 - t); };

  Core.hash = function (s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  Core.rng = function (seed) {
    var a = seed >>> 0 || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  Core.shuffle = function (arr, rnd) {
    rnd = rnd || Math.random;
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  // 复制一张画布用于 DOM 显示
  Core.canvasFrom = function (src, scale, cls) {
    var c = document.createElement('canvas');
    c.width = src ? src.width : 16; c.height = src ? src.height : 16;
    if (src) c.getContext('2d').drawImage(src, 0, 0);
    if (cls) c.className = cls;
    return c;
  };

  // ---------- 脚本按需加载（兼容 file://） ----------
  var loadedScripts = {};
  Core.loadScripts = function (list) {
    return new Promise(function (resolve) {
      var i = 0;
      (function next() {
        if (i >= list.length) { resolve(); return; }
        var src = list[i++];
        if (loadedScripts[src]) { next(); return; }
        var s = document.createElement('script'); s.src = src;
        s.onload = function () { loadedScripts[src] = 1; next(); };
        s.onerror = function () { console.warn('脚本缺失：' + src); loadedScripts[src] = 1; next(); };
        document.head.appendChild(s);
      })();
    });
  };
  // 按画风加载美术模块
  Core.loadArt = function (style) {
    if (style === 'pixel' && !(DM.PX_FILES && DM.PX_FILES.length)) { DM.State.settings.style = style = 'hd'; }
    var list = style === 'pixel' ? DM.PX_FILES : DM.HD_FILES;
    return Core.loadScripts(list || []);
  };

  // ---------- 美术接口分发 ----------
  var ph = {};
  function placeholder(w, h, color) {
    var k = w + 'x' + h + color;
    if (ph[k]) return ph[k];
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, w, h);
    return (ph[k] = c);
  }
  function hd() { return DM.State && DM.State.settings.style !== 'pixel' && DM.HDArt; }
  function px() { return DM.Art; }
  function tryArt(fn, fb) { try { var r = fn(); if (r) return r; } catch (e) { console.warn(e); } return fb(); }
  Core.isHD = function () { return !!hd(); };
  Core.art = {
    bg: function (id, v) {
      return tryArt(function () { return hd() ? DM.HDArt.getBackground(id, v) : px() && px().getBackground(id, v); },
        function () { return placeholder(480, 270, id === 'white' ? '#fff' : '#101018'); });
    },
    hasBg: function (id, v) { return hd() ? DM.HDArt.has('bg', id, v) : true; },
    meta: function (id, v) {
      if (hd()) return DM.HDArt.meta(id, v);
      var out = (DM.GAME.outdoor || []).indexOf(id) >= 0;
      return { lights: [], key: null, outdoor: out };
    },
    portrait: function (id, ex) {
      return tryArt(function () { return hd() ? DM.HDArt.getPortrait(id, ex || 'normal') : px() && px().getPortrait(id, ex || 'normal'); },
        function () { return placeholder(80, 112, '#333'); });
    },
    hasPortrait: function (id, ex) { return hd() ? DM.HDArt.has('pt', id, ex || 'normal') : true; },
    // 界面里用的小立绘（菜单、手账、投票卡片）
    thumb: function (id, ex) {
      return tryArt(function () { return hd() ? DM.HDArt.getPortraitThumb(id, ex || 'normal', 240) : px() && px().getPortrait(id, ex || 'normal'); },
        function () { return placeholder(80, 112, '#333'); });
    },
    sprite: function (id) {
      return tryArt(function () { return hd() ? DM.HDArt.getSprite(id) : px() && px().getSprite(id); },
        function () { return placeholder(16, 32, '#555'); });
    },
    icon: function (id) {
      return tryArt(function () { return hd() ? DM.HDArt.getIcon(id) : px() && px().getIcon(id); },
        function () { return placeholder(16, 16, '#777'); });
    },
    map: function () {
      return tryArt(function () { return hd() ? DM.HDArt.getMap() : px() && px().getMap(); },
        function () { return placeholder(480, 270, '#0b1a2a'); });
    }
  };

  Core.charName = function (id) { var c = DM.CHARS[id]; return c ? c.name : id; };
  Core.charColor = function (id) { var c = DM.CHARS[id]; return c ? c.color : '#ccc'; };
})();
