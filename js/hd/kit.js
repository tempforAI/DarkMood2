/* DARK MOOD HD 美术工具包（DM.HK）
 * ------------------------------------------------------------------
 * 所有高清美术都在「设计坐标系」中用 Canvas 2D 矢量绘制，再按渲染倍率 s 输出：
 *   背景 1920x1080   立绘 640x896   小人 128x256   图标 128x128
 *   s = 输出宽 / 设计宽（540p:0.5  720p:0.667  1080p:1  1440p:1.333  2160p:2）
 * 质量参数 q = { s, model, tex, light }：
 *   model 0/1/2  建模精度（几何细节：物件数量、发丝条数、装饰细节）
 *   tex   0/1/2  材质质量（程序化纹理贴图分辨率与细节）
 *   light 0/1/2  光影质量（烘焙光照层次：AO、投影、光斑、高光、体积光）
 * 规则：
 *   - 只用本文件的辅助函数处理 shadowBlur（它不受 transform 影响，必须乘 s）。
 *   - 生成必须确定（用 K.rng(seed)），不读回整张画布像素，不启动定时器。
 *   - 兼容：ES5 语法 + Canvas 2D 基础 API（不用 ctx.filter / Path2D / roundRect / DOMMatrix）。
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK = {};

  K.DW = 1920; K.DH = 1080;     // 背景
  K.PW = 640;  K.PH = 896;      // 立绘
  K.SW = 128;  K.SH = 256;      // 小人
  K.IW = 128;                   // 图标

  /* ---------------- 注册表 ---------------- */
  // 背景：DM.HDBG.def(id, { draw(g,q,variant), lights, key, outdoor })
  DM.HDBG = DM.HDBG || { defs: {}, def: function (id, o) { this.defs[id] = o; } };
  // 图标：DM.HDIcon.def(id, function(g,q){})
  DM.HDIcon = DM.HDIcon || { defs: {}, def: function (id, fn) { this.defs[id] = fn; } };
  // 角色：生成器 DM.HDChar.gen = { portrait(g,id,expr,q), sprite(g,id,q) }；配置 DM.HDChar.cast[id] = {...}
  DM.HDChar = DM.HDChar || { gen: null, cast: {}, def: function (id, o) { this.cast[id] = o; } };

  /* ---------------- 画布 ---------------- */
  K.canvas = function (w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  };
  // 设计尺寸 dw x dh、倍率 s 的画布；返回的 g 已经设置好 transform，可直接用设计坐标绘制
  K.surface = function (dw, dh, s, alpha) {
    var c = K.canvas(dw * s, dh * s);
    var g = c.getContext('2d', alpha === false ? { alpha: false } : undefined);
    g.setTransform(c.width / dw, 0, 0, c.height / dh, 0, 0);
    g.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in g) g.imageSmoothingQuality = 'high';
    g.lineJoin = 'round'; g.lineCap = 'round';
    return { canvas: c, g: g, s: c.width / dw };
  };

  /* ---------------- 随机数 ---------------- */
  K.hash = function (s) {
    s = String(s); var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  };
  K.rng = function (seed) {
    var a = (typeof seed === 'number' ? seed : K.hash(seed)) >>> 0;
    function r() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    r.int = function (lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); };
    r.range = function (lo, hi) { return lo + r() * (hi - lo); };
    r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    r.chance = function (p) { return r() < p; };
    r.jit = function (v, amt) { return v + (r() * 2 - 1) * amt; };
    return r;
  };

  /* ---------------- 噪声（可平铺的值噪声 / fbm） ---------------- */
  var permCache = {};
  function perm(seed) {
    if (permCache[seed]) return permCache[seed];
    var p = new Uint8Array(512), r = K.rng(seed), i;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 256; i++) p[i + 256] = p[i];
    return (permCache[seed] = p);
  }
  function fade(t) { return t * t * (3 - 2 * t); }
  // 值噪声 [0,1]；period>0 时在该周期上无缝平铺（period 为整数格数）
  K.noise = function (x, y, seed, period) {
    var p = perm(seed | 0), P = period || 256;
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var x0 = ((xi % P) + P) % P, y0 = ((yi % P) + P) % P, x1 = (x0 + 1) % P, y1 = (y0 + 1) % P;
    x0 &= 255; x1 &= 255; y0 &= 255; y1 &= 255;
    var a = p[p[x0] + y0] / 255, b = p[p[x1] + y0] / 255, c = p[p[x0] + y1] / 255, d = p[p[x1] + y1] / 255;
    var u = fade(xf), v = fade(yf);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  };
  K.fbm = function (x, y, oct, seed, period) {
    var s = 0, amp = 0.5, f = 1, norm = 0;
    for (var i = 0; i < oct; i++) {
      s += amp * K.noise(x * f, y * f, seed + i * 31, period ? period * f : 0);
      norm += amp; amp *= 0.5; f *= 2;
    }
    return s / norm;
  };

  /* ---------------- 颜色 ---------------- */
  var rgbCache = {};
  K.rgb = function (c) {
    if (Array.isArray(c)) return c;
    if (rgbCache[c]) return rgbCache[c];
    var r = [128, 128, 128], m;
    if (c.charAt(0) === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h.slice(0, 6), 16);
      r = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    } else if ((m = /rgba?\(([^)]+)\)/.exec(c))) {
      var p = m[1].split(','); r = [+p[0], +p[1], +p[2]];
    }
    return (rgbCache[c] = r);
  };
  function css(r, g, b, a) {
    r = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);
    g = g < 0 ? 0 : g > 255 ? 255 : Math.round(g);
    b = b < 0 ? 0 : b > 255 ? 255 : Math.round(b);
    return a === undefined || a >= 1 ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + (a < 0 ? 0 : +a.toFixed(3)) + ')';
  }
  K.css = css;
  K.mix = function (c1, c2, t, a) {
    var x = K.rgb(c1), y = K.rgb(c2);
    return css(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t, a);
  };
  // amt>0 变亮（向白），amt<0 变暗（向黑）
  K.shade = function (c, amt, a) { return amt >= 0 ? K.mix(c, '#ffffff', amt, a) : K.mix(c, '#000000', -amt, a); };
  K.rgba = function (c, a) { var x = K.rgb(c); return css(x[0], x[1], x[2], a); };
  // 冷暖偏移：t>0 偏暖，t<0 偏冷（用于阴影偏冷、高光偏暖）
  K.temp = function (c, t, a) { return t >= 0 ? K.mix(c, '#ffb070', t, a) : K.mix(c, '#4060a0', -t, a); };

  /* ---------------- 路径 ---------------- */
  K.rr = function (g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  };
  K.poly = function (g, pts, open) {
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    if (!open) g.closePath();
  };
  K.ellipse = function (g, cx, cy, rx, ry, rot) {
    g.beginPath();
    if (g.ellipse) g.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2);
    else { g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.scale(1, ry / rx); g.arc(0, 0, rx, 0, Math.PI * 2); g.restore(); }
  };
  // 迷你 SVG 路径解析：支持 M L H V C S Q T Z（大小写=绝对/相对）。不调用 beginPath 之外的状态。
  // K.path(g, 'M10 10 C 20 0 40 0 50 10 Z', ox, oy, sx, sy)
  var pathCache = {};
  function parsePath(d) {
    if (pathCache[d]) return pathCache[d];
    var toks = d.match(/[MLHVCSQTZmlhvcsqtz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [], out = [], i = 0, cmd = 'M';
    function num() { return parseFloat(toks[i++]); }
    while (i < toks.length) {
      if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
      var n;
      switch (cmd.toUpperCase()) {
        case 'Z': out.push([cmd]); break;
        case 'H': case 'V': n = 1; break;
        case 'M': case 'L': case 'T': n = 2; break;
        case 'S': case 'Q': n = 4; break;
        case 'C': n = 6; break;
        default: i++; continue;
      }
      if (cmd === 'Z' || cmd === 'z') continue;
      var a = [cmd]; for (var k = 0; k < n; k++) a.push(num());
      out.push(a);
      if (cmd === 'M') cmd = 'L'; else if (cmd === 'm') cmd = 'l';
    }
    return (pathCache[d] = out);
  }
  K.path = function (g, d, ox, oy, sx, sy, noBegin) {
    ox = ox || 0; oy = oy || 0; sx = sx === undefined ? 1 : sx; sy = sy === undefined ? sx : sy;
    var cmds = parsePath(d), x = 0, y = 0, sx0 = 0, sy0 = 0, lcx = 0, lcy = 0, lq = null;
    if (!noBegin) g.beginPath();
    function X(v) { return ox + v * sx; } function Y(v) { return oy + v * sy; }
    for (var i = 0; i < cmds.length; i++) {
      var c = cmds[i], t = c[0], rel = t === t.toLowerCase(), T = t.toUpperCase();
      var bx = rel ? x : 0, by = rel ? y : 0;
      if (T === 'M') { x = bx + c[1]; y = by + c[2]; sx0 = x; sy0 = y; g.moveTo(X(x), Y(y)); lcx = x; lcy = y; }
      else if (T === 'L') { x = bx + c[1]; y = by + c[2]; g.lineTo(X(x), Y(y)); lcx = x; lcy = y; }
      else if (T === 'H') { x = bx + c[1]; g.lineTo(X(x), Y(y)); lcx = x; lcy = y; }
      else if (T === 'V') { y = by + c[1]; g.lineTo(X(x), Y(y)); lcx = x; lcy = y; }
      else if (T === 'C') {
        var x1 = bx + c[1], y1 = by + c[2], x2 = bx + c[3], y2 = by + c[4]; x = bx + c[5]; y = by + c[6];
        g.bezierCurveTo(X(x1), Y(y1), X(x2), Y(y2), X(x), Y(y)); lcx = x2; lcy = y2;
      } else if (T === 'S') {
        var rx = 2 * x - lcx, ry = 2 * y - lcy, x2s = bx + c[1], y2s = by + c[2]; x = bx + c[3]; y = by + c[4];
        g.bezierCurveTo(X(rx), Y(ry), X(x2s), Y(y2s), X(x), Y(y)); lcx = x2s; lcy = y2s;
      } else if (T === 'Q') {
        var qx = bx + c[1], qy = by + c[2]; x = bx + c[3]; y = by + c[4];
        g.quadraticCurveTo(X(qx), Y(qy), X(x), Y(y)); lcx = qx; lcy = qy; lq = [qx, qy];
      } else if (T === 'T') {
        var tx = 2 * x - lcx, ty = 2 * y - lcy; x = bx + c[1]; y = by + c[2];
        g.quadraticCurveTo(X(tx), Y(ty), X(x), Y(y)); lcx = tx; lcy = ty;
      } else if (T === 'Z') { g.closePath(); x = sx0; y = sy0; lcx = x; lcy = y; }
    }
  };

  /* ---------------- 渐变 ---------------- */
  function addStops(gr, stops) {
    for (var i = 0; i < stops.length; i++) {
      var st = stops[i];
      if (typeof st === 'string') gr.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), st);
      else gr.addColorStop(st[0], st[1]);
    }
    return gr;
  }
  K.lin = function (g, x0, y0, x1, y1, stops) { return addStops(g.createLinearGradient(x0, y0, x1, y1), stops); };
  K.rad = function (g, cx, cy, r0, r1, stops, fx, fy) {
    return addStops(g.createRadialGradient(fx === undefined ? cx : fx, fy === undefined ? cy : fy, r0, cx, cy, r1), stops);
  };
  K.vgrad = function (g, x, y, w, h, stops) { g.fillStyle = K.lin(g, x, y, x, y + h, stops); g.fillRect(x, y, w, h); };
  K.hgrad = function (g, x, y, w, h, stops) { g.fillStyle = K.lin(g, x, y, x + w, y, stops); g.fillRect(x, y, w, h); };

  /* ---------------- 阴影 / 发光（shadowBlur 以设备像素计，需乘 s） ---------------- */
  K.shadow = function (g, q, blur, color, ox, oy) {
    var s = q && q.s || 1;
    g.shadowBlur = (blur || 0) * s; g.shadowColor = color || 'rgba(0,0,0,0.5)';
    g.shadowOffsetX = (ox || 0) * s; g.shadowOffsetY = (oy || 0) * s;
  };
  K.noShadow = function (g) { g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)'; g.shadowOffsetX = 0; g.shadowOffsetY = 0; };
  // 叠加光晕（加色混合）
  K.glow = function (g, x, y, r, color, a, mode) {
    g.save(); g.globalCompositeOperation = mode || 'lighter';
    g.fillStyle = K.rad(g, x, y, 0, r, [[0, K.rgba(color, a === undefined ? 0.6 : a)], [0.35, K.rgba(color, (a === undefined ? 0.6 : a) * 0.35)], [1, K.rgba(color, 0)]]);
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.restore();
  };
  // 椭圆形光斑（例如灯下地面的光池）
  K.pool = function (g, x, y, rx, ry, color, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.translate(x, y); g.scale(1, ry / rx);
    g.fillStyle = K.rad(g, 0, 0, 0, rx, [[0, K.rgba(color, a)], [0.5, K.rgba(color, a * 0.4)], [1, K.rgba(color, 0)]]);
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  };
  // 柔和的接触阴影（物件脚下的椭圆暗影）
  K.contact = function (g, x, y, rx, ry, a) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    g.fillStyle = K.rad(g, 0, 0, 0, rx, [[0, 'rgba(0,0,0,' + (a === undefined ? 0.55 : a) + ')'], [1, 'rgba(0,0,0,0)']]);
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  };
  // 环境光遮蔽：矩形区域四边向内变暗。edges 字符串含 t/b/l/r
  K.ao = function (g, x, y, w, h, size, a, edges, color) {
    edges = edges || 'tblr'; a = a === undefined ? 0.45 : a; color = color || '#000';
    var c0 = K.rgba(color, a), c1 = K.rgba(color, 0);
    g.save();
    if (edges.indexOf('t') >= 0) { g.fillStyle = K.lin(g, 0, y, 0, y + size, [c0, c1]); g.fillRect(x, y, w, size); }
    if (edges.indexOf('b') >= 0) { g.fillStyle = K.lin(g, 0, y + h, 0, y + h - size, [c0, c1]); g.fillRect(x, y + h - size, w, size); }
    if (edges.indexOf('l') >= 0) { g.fillStyle = K.lin(g, x, 0, x + size, 0, [c0, c1]); g.fillRect(x, y, size, h); }
    if (edges.indexOf('r') >= 0) { g.fillStyle = K.lin(g, x + w, 0, x + w - size, 0, [c0, c1]); g.fillRect(x + w - size, y, size, h); }
    g.restore();
  };
  // 体积光（光柱）：pts 为多边形，从 (x0,y0) 到 (x1,y1) 方向渐隐
  K.shaft = function (g, pts, color, a, x0, y0, x1, y1) {
    g.save(); g.globalCompositeOperation = 'lighter';
    K.poly(g, pts);
    g.fillStyle = K.lin(g, x0, y0, x1, y1, [[0, K.rgba(color, a)], [1, K.rgba(color, 0)]]);
    g.fill(); g.restore();
  };
  // 光柱中的浮尘
  K.motes = function (g, rnd, n, x, y, w, h, color, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var px = x + rnd() * w, py = y + rnd() * h, r = 0.8 + rnd() * 2.2;
      g.fillStyle = K.rgba(color, (a || 0.5) * (0.3 + rnd() * 0.7));
      g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  };
  K.vignette = function (g, w, h, a, inner) {
    w = w || K.DW; h = h || K.DH;
    g.fillStyle = K.rad(g, w / 2, h / 2, Math.min(w, h) * (inner || 0.35), Math.max(w, h) * 0.75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,' + (a === undefined ? 0.5 : a) + ')']]);
    g.fillRect(0, 0, w, h);
  };
  // 高光边（rim）：沿路径描一条亮边
  K.rimStroke = function (g, color, a, w) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = K.rgba(color, a); g.lineWidth = w || 2; g.stroke(); g.restore();
  };

  /* ---------------- 程序化纹理 ---------------- */
  // 纹理以「平铺小图」生成并缓存，然后用 pattern 填充当前路径。
  // 用法：先建立路径（K.rr / K.poly / beginPath+...），再 K.fillTex(g, q, 'wood', {...}, 240)
  //   units = 一块平铺图在设计坐标中的边长；tile 实际像素 = min(units*s, 上限[q.tex])
  var TEX_CAP = [128, 256, 512, 1024];
  var texCache = {}, texCount = 0;
  K.tileSize = function (q, units) {
    var want = units * (q && q.s || 1), cap = TEX_CAP[q ? (q.tex | 0) + (q.tex >= 2 && q.s > 1.4 ? 1 : 0) : 1];
    var sz = Math.min(cap, want);
    var steps = [32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024];
    for (var i = 0; i < steps.length; i++) if (steps[i] >= sz) return steps[i];
    return 1024;
  };
  K.clearTexCache = function () { texCache = {}; texCount = 0; };

  function img(size) { var c = K.canvas(size, size); var x = c.getContext('2d'); return { c: c, x: x, d: x.createImageData(size, size) }; }
  function put(t) { t.x.putImageData(t.d, 0, 0); return t.c; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  var GEN = {};
  // 通用噪声：c1→c2，scale=格数，oct=八度，contrast
  GEN.noise = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#555'), b = K.rgb(o.c2 || '#999'), sc = o.scale || 6, oct = o.oct || 4, seed = o.seed || 1, ct = o.contrast || 1;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var v = K.fbm(x / N * sc, y / N * sc, oct, seed, sc);
      v = clamp01((v - 0.5) * ct + 0.5);
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 木纹：dir 'h'|'v'，planks 每块平铺图中的木板数，c1 暗色 c2 亮色，gap 缝隙颜色
  GEN.wood = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#3a2416'), b = K.rgb(o.c2 || '#6e4628'), gp = K.rgb(o.gap || '#1a0e08');
    var planks = o.planks || 4, seed = o.seed || 3, vert = o.dir === 'v', ring = o.ring || 2.5, gw = Math.max(1, Math.round(N / 180));
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var u = vert ? x : y, w = vert ? y : x;              // u 横跨木板，w 沿木纹
      var pi = Math.floor(u / N * planks), pu = (u / N * planks) - pi;
      var off = (K.hash('p' + pi + seed) % 1000) / 1000;
      var n = K.fbm(w / N * 1.2 + off * 7, pu * 0.35 + pi * 3.1, 3, seed, 0);
      var grain = 0.5 + 0.5 * Math.sin((pu * 3 + n * ring) * Math.PI * 2);
      var fine = K.noise(w / N * 40, u / N * 160, seed + 9, 0);
      var v = clamp01(0.25 + grain * 0.45 + fine * 0.3 + (off - 0.5) * 0.25);
      var i = (y * N + x) * 4;
      var pix = (u % Math.round(N / planks));
      var isGap = pix < gw;
      // 木板端头缝（错缝）
      var seg = Math.floor((w / N + off) * (o.joints || 1) % 1 * 1000) < 1000 * gw / N;
      if (isGap || (o.joints && seg)) { d[i] = gp[0]; d[i + 1] = gp[1]; d[i + 2] = gp[2]; }
      else { d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); }
      d[i + 3] = 255;
    }
    return put(t);
  };
  // 石块墙：rows 行数，cols 每行块数，mortar 砂浆色
  GEN.stone = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#3b3844'), b = K.rgb(o.c2 || '#6a6574'), m = K.rgb(o.mortar || '#1c1a22');
    var rows = o.rows || 4, cols = o.cols || 3, seed = o.seed || 5, mw = (o.mortarW || 0.035);
    for (var y = 0; y < N; y++) {
      var fy = y / N * rows, ry = Math.floor(fy), vy = fy - ry;
      for (var x = 0; x < N; x++) {
        var shift = (ry % 2) * 0.5 + ((K.hash('r' + ry + seed) % 100) / 100) * (o.irregular ? 0.4 : 0);
        var fx = (x / N * cols + shift), rx = Math.floor(fx), vx = fx - rx;
        var id = ((rx % cols) + cols) % cols + ry * 17;
        var tone = (K.hash('s' + id + seed) % 1000) / 1000;
        var n = K.fbm(x / N * 8, y / N * 8, 4, seed, 8);
        var edge = Math.min(vx, 1 - vx) * N / cols, edgeY = Math.min(vy, 1 - vy) * N / rows;
        var i = (y * N + x) * 4, mwp = mw * N;
        if (edge < mwp || edgeY < mwp) { var mn = 0.8 + n * 0.4; d[i] = m[0] * mn; d[i + 1] = m[1] * mn; d[i + 2] = m[2] * mn; }
        else {
          var bev = clamp01(Math.min(edge, edgeY) / (mwp * 3));
          var hl = (vy < 0.5 && edgeY < mwp * 3) ? 0.12 : 0;   // 上缘受光
          var v = clamp01(0.15 + tone * 0.45 + n * 0.5 - (1 - bev) * 0.25 + hl);
          d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v);
        }
        d[i + 3] = 255;
      }
    }
    return put(t);
  };
  GEN.brick = function (N, o) { return GEN.stone(N, { c1: o.c1 || '#4a2420', c2: o.c2 || '#8a4636', mortar: o.mortar || '#2a2220', rows: o.rows || 8, cols: o.cols || 4, seed: o.seed || 7, mortarW: 0.03 }); };
  // 灰泥 / 墙漆：微弱斑驳 + 水渍
  GEN.plaster = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#5a5260'), b = K.rgb(o.c2 || '#6c6472'), seed = o.seed || 11, stain = o.stain || 0.25;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = K.fbm(x / N * 5, y / N * 5, 5, seed, 5), s2 = K.fbm(x / N * 2, y / N * 2, 3, seed + 3, 2);
      var v = clamp01(0.3 + n * 0.55 - (s2 > 0.62 ? (s2 - 0.62) * stain * 4 : 0));
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 织物：经纬交织
  GEN.fabric = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#5a1020'), b = K.rgb(o.c2 || '#8a2034'), seed = o.seed || 13, th = o.threads || 64;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var wx = Math.sin(x / N * th * Math.PI * 2) * 0.5 + 0.5, wy = Math.sin(y / N * th * Math.PI * 2) * 0.5 + 0.5;
      var over = ((Math.floor(x / N * th) + Math.floor(y / N * th)) & 1) ? wx : wy;
      var n = K.fbm(x / N * 6, y / N * 6, 3, seed, 6);
      var v = clamp01(0.3 + over * 0.35 + n * 0.35);
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 拉丝金属
  GEN.metal = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#5a5048'), b = K.rgb(o.c2 || '#b0a090'), seed = o.seed || 17, vert = o.dir === 'v';
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var u = vert ? x : y, w = vert ? y : x;
      var n = K.noise(w / N * 3, u / N * 220, seed, 0) * 0.6 + K.fbm(x / N * 4, y / N * 4, 3, seed + 1, 4) * 0.4;
      var v = clamp01(n);
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 纸张 / 和纸
  GEN.paper = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#d8ccb0'), b = K.rgb(o.c2 || '#f0e6d0'), seed = o.seed || 19;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = K.fbm(x / N * 6, y / N * 6, 4, seed, 6), f = K.noise(x / N * 90, y / N * 12, seed + 5, 0);
      var v = clamp01(0.35 + n * 0.45 + (f > 0.8 ? -0.15 : 0));
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 雪面：柔和起伏 + 闪光颗粒
  GEN.snow = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#b8c4dc'), b = K.rgb(o.c2 || '#f4f8ff'), seed = o.seed || 23, r = K.rng(seed);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = K.fbm(x / N * 4, y / N * 4, 5, seed, 4);
      var v = clamp01(0.35 + n * 0.75);
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    var sp = Math.round(N * N / 900);
    for (var k = 0; k < sp; k++) { var j = (Math.floor(r() * N) * N + Math.floor(r() * N)) * 4; d[j] = 255; d[j + 1] = 255; d[j + 2] = 255; }
    return put(t);
  };
  // 榻榻米：灯芯草编织
  GEN.tatami = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#8a8a50'), b = K.rgb(o.c2 || '#c0b878'), seed = o.seed || 29, rows = o.rows || 90;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var ry = y / N * rows, k = ry - Math.floor(ry);
      var weave = 0.5 + 0.5 * Math.sin(k * Math.PI * 2);
      var n = K.noise(x / N * 30, Math.floor(ry) * 0.7, seed, 0);
      var v = clamp01(0.25 + weave * 0.35 + n * 0.4);
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 茅草 / 稻草
  GEN.thatch = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#4a3a22'), b = K.rgb(o.c2 || '#9a8250'), seed = o.seed || 31;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = K.noise(x / N * 120, y / N * 6 + K.noise(x / N * 10, 0, seed + 2, 10) * 2, seed, 0);
      var v = clamp01(n * 1.1 - 0.05 + K.fbm(x / N * 3, y / N * 3, 3, seed + 4, 3) * 0.3 - 0.15);
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 岩石 / 泥土 / 沙 / 冰 / 水面：都用噪声变体
  GEN.rock = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#24222a'), b = K.rgb(o.c2 || '#5a5662'), seed = o.seed || 37;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = K.fbm(x / N * 5, y / N * 5, 6, seed, 5), r2 = Math.abs(K.fbm(x / N * 3, y / N * 3, 3, seed + 7, 3) - 0.5);
      var v = clamp01(n * 0.9 + (r2 < 0.03 ? -0.35 : 0));
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  GEN.sand = function (N, o) { return GEN.noise(N, { c1: o.c1 || '#6a5e4a', c2: o.c2 || '#a8987a', scale: 24, oct: 3, seed: o.seed || 41, contrast: 1.4 }); };
  GEN.ice = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#7890b0'), b = K.rgb(o.c2 || '#d8e8f8'), seed = o.seed || 43;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = K.fbm(x / N * 3, y / N * 3, 5, seed, 3), cr = Math.abs(K.fbm(x / N * 4, y / N * 4, 4, seed + 2, 4) - 0.5);
      var v = clamp01(n * 0.8 + 0.1 + (cr < 0.02 ? 0.4 : 0));
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  GEN.bark = function (N, o) {
    var t = img(N), d = t.d.data, a = K.rgb(o.c1 || '#1e1610'), b = K.rgb(o.c2 || '#5a4632'), seed = o.seed || 47;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var n = K.noise(x / N * 14, y / N * 2 + K.noise(x / N * 6, y / N * 6, seed + 1, 6), seed, 0);
      var v = clamp01(Math.pow(n, 1.5) * 1.2);
      var i = (y * N + x) * 4; d[i] = lerp(a[0], b[0], v); d[i + 1] = lerp(a[1], b[1], v); d[i + 2] = lerp(a[2], b[2], v); d[i + 3] = 255;
    }
    return put(t);
  };
  // 壁纸：底色 + 用路径画的大马士革式花纹（seed 改变花样）
  GEN.wallpaper = function (N, o) {
    var c = K.canvas(N, N), x = c.getContext('2d');
    var base = o.c1 || '#3a1a26', ink = o.c2 || '#5a2a38', line = o.line || null;
    x.fillStyle = base; x.fillRect(0, 0, N, N);
    var r = K.rng(o.seed || 53), s = N / 128;
    function motif(cx, cy, k) {
      x.save(); x.translate(cx, cy); x.scale(s * k, s * k);
      x.fillStyle = ink;
      for (var side = -1; side <= 1; side += 2) {
        x.save(); x.scale(side, 1);
        x.beginPath(); x.moveTo(0, -30); x.bezierCurveTo(14, -22, 22, -8, 10, 2); x.bezierCurveTo(22, 6, 18, 22, 4, 18);
        x.bezierCurveTo(10, 26, 6, 32, 0, 34); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(6, -8); x.bezierCurveTo(26, -18, 30, 4, 18, 10); x.bezierCurveTo(26, 0, 16, -6, 6, -8); x.fill();
        x.restore();
      }
      x.beginPath(); x.arc(0, -36, 3, 0, Math.PI * 2); x.fill();
      x.restore();
    }
    motif(N / 2, N / 2, 1); motif(0, 0, 1); motif(N, 0, 1); motif(0, N, 1); motif(N, N, 1);
    if (line) { x.fillStyle = line; x.fillRect(0, 0, Math.max(1, N / 128), N); x.fillRect(N / 2, 0, Math.max(1, N / 256), N); }
    // 细微纹理
    var t = x.getImageData(0, 0, N, N), d = t.data;
    for (var i = 0; i < d.length; i += 4) {
      var px = (i / 4) % N, py = Math.floor(i / 4 / N), n = (K.fbm(px / N * 6, py / N * 6, 3, 59, 6) - 0.5) * 30;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    x.putImageData(t, 0, 0);
    void r;
    return c;
  };
  // 障子：纸 + 木格
  GEN.shoji = function (N, o) {
    var c = K.canvas(N, N), x = c.getContext('2d');
    x.drawImage(GEN.paper(N, { c1: o.c1 || '#d6ccb4', c2: o.c2 || '#efe6d2', seed: o.seed || 61 }), 0, 0);
    x.fillStyle = o.frame || '#5a4430';
    var w = Math.max(2, N / 40), cols = o.cols || 2, rows = o.rows || 3;
    for (var i = 0; i <= cols; i++) x.fillRect(i * N / cols - w / 2, 0, w, N);
    for (var j = 0; j <= rows; j++) x.fillRect(0, j * N / rows - w / 2, N, w);
    return c;
  };
  // 地毯：底色 + 菱形花纹
  GEN.carpet = function (N, o) {
    var c = K.canvas(N, N), x = c.getContext('2d');
    x.drawImage(GEN.fabric(N, { c1: o.c1 || '#3a0c16', c2: o.c2 || '#5c1624', threads: 96, seed: o.seed || 67 }), 0, 0);
    x.strokeStyle = o.c3 || 'rgba(201,162,90,0.35)'; x.lineWidth = N / 64;
    x.beginPath(); x.moveTo(N / 2, 0); x.lineTo(N, N / 2); x.lineTo(N / 2, N); x.lineTo(0, N / 2); x.closePath(); x.stroke();
    x.beginPath(); x.arc(N / 2, N / 2, N / 10, 0, Math.PI * 2); x.stroke();
    return c;
  };

  K.GEN = GEN;
  // 取得纹理平铺图（缓存）。opts 中的颜色/参数参与缓存键
  K.tex = function (kind, opts, size) {
    opts = opts || {};
    var key = kind + '|' + size + '|' + JSON.stringify(opts);
    var c = texCache[key];
    if (c) return c;
    var fn = GEN[kind] || GEN.noise;
    c = fn(size, opts);
    if (++texCount > 160) { texCache = {}; texCount = 1; }
    texCache[key] = c;
    return c;
  };
  // 用纹理填充当前路径。units：平铺图在设计坐标中的边长；ox/oy 平铺偏移；alpha 可选
  K.fillTex = function (g, q, kind, opts, units, ox, oy, alpha) {
    var size = K.tileSize(q, units);
    var tile = K.tex(kind, opts, size);
    var pat = g.createPattern(tile, 'repeat');
    g.save();
    if (alpha !== undefined) g.globalAlpha *= alpha;
    g.translate(ox || 0, oy || 0);
    var m = units / tile.width; g.scale(m, m);
    g.fillStyle = pat; g.fill();
    g.restore();
  };
  // 材质质量低时用纯色/渐变代替纹理：K.surfaceFill(g,q,fallbackStyle, kind, opts, units)
  K.matFill = function (g, q, fallback, kind, opts, units, ox, oy, alpha) {
    if (!q || q.tex <= 0) { g.save(); if (alpha !== undefined) g.globalAlpha *= alpha; g.fillStyle = fallback; g.fill(); g.restore(); return; }
    K.fillTex(g, q, kind, opts, units, ox, oy, alpha);
  };

  /* ---------------- 常用组合 ---------------- */
  // 带纹理、渐变光照、AO 的矩形面板（家具、墙板、门等）
  // o: { fill, tex:[kind,opts,units], light:[top,bottom] 两个 rgba 覆盖色, bevel:宽度, radius, ao }
  K.panel = function (g, q, x, y, w, h, o) {
    o = o || {};
    K.rr(g, x, y, w, h, o.radius || 0);
    if (o.tex && q.tex > 0) K.fillTex(g, q, o.tex[0], o.tex[1], o.tex[2], x, y);
    else { g.fillStyle = o.fill || '#444'; g.fill(); }
    if (o.light !== false) {
      K.rr(g, x, y, w, h, o.radius || 0);
      g.fillStyle = K.lin(g, x, y, x, y + h, o.light || ['rgba(255,240,220,0.10)', 'rgba(0,0,0,0.25)']);
      g.fill();
    }
    if (o.bevel) {
      var b = o.bevel;
      g.save();
      g.fillStyle = 'rgba(255,240,220,' + (o.hi || 0.18) + ')'; g.fillRect(x, y, w, b); g.fillRect(x, y, b, h);
      g.fillStyle = 'rgba(0,0,0,' + (o.lo || 0.35) + ')'; g.fillRect(x, y + h - b, w, b); g.fillRect(x + w - b, y, b, h);
      g.restore();
    }
    if (o.ao && q.light > 0) K.ao(g, x, y, w, h, o.ao, 0.35);
    if (o.stroke) { K.rr(g, x, y, w, h, o.radius || 0); g.strokeStyle = o.stroke; g.lineWidth = o.lw || 2; g.stroke(); }
  };

  // 单点透视房间。返回几何信息供后续绘制物件。
  // o: { back:[x,y,w,h], floorY: 地面在屏幕底部的 y（默认 1080）, wall, floor, ceil, side（各为 {fill, tex:[kind,opts,units]}）}
  K.room = function (g, q, o) {
    var b = o.back, W = K.DW, H = K.DH;
    var bx = b[0], by = b[1], bw = b[2], bh = b[3], bx1 = bx + bw, by1 = by + bh;
    function face(pts, f, shadeStops, gx0, gy0, gx1, gy1) {
      K.poly(g, pts);
      if (f.tex && q.tex > 0) K.fillTex(g, q, f.tex[0], f.tex[1], f.tex[2], f.ox || 0, f.oy || 0); else { g.fillStyle = f.fill || '#333'; g.fill(); }
      if (shadeStops) { K.poly(g, pts); g.fillStyle = K.lin(g, gx0, gy0, gx1, gy1, shadeStops); g.fill(); }
    }
    var ceil = [0, 0, W, 0, bx1, by, bx, by];
    var floor = [bx, by1, bx1, by1, W, H, 0, H];
    var left = [0, 0, bx, by, bx, by1, 0, H];
    var right = [W, 0, W, H, bx1, by1, bx1, by];
    if (o.ceil) face(ceil, o.ceil, ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)'], 0, 0, 0, by);
    if (o.side) {
      face(left, o.sideL || o.side, ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.05)'], 0, 0, bx, 0);
      face(right, o.sideR || o.side, ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)'], bx1, 0, W, 0);
    }
    if (o.floor) face(floor, o.floor, ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.25)'], 0, by1, 0, H);
    if (o.wall) face([bx, by, bx1, by, bx1, by1, bx, by1], o.wall, null);
    if (q.light > 0) {
      K.ao(g, bx, by, bw, bh, Math.min(bw, bh) * 0.12, 0.4);
      // 墙脚接缝的暗线
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(bx, by1 - 2, bw, 3);
    }
    return {
      back: b,
      // t: 0=后墙  1=屏幕底部；返回该深度的地面 y 与左右边界 x
      floorAt: function (t) { return { y: by1 + (H - by1) * t, x0: bx * (1 - t), x1: bx1 + (W - bx1) * t }; },
      // 把后墙平面上的点 (x,y) 按深度 t 往前投影
      project: function (x, y, t) {
        var vx = bx + bw / 2, vy = by + bh / 2, k = 1 + t * ((H - by1) / (by1 - vy));
        return { x: vx + (x - vx) * k, y: vy + (y - vy) * k, k: k };
      }
    };
  };

  // 透视地板：在 K.room 返回的几何上画朝消失点汇聚的木板缝与按深度变密的横向接缝
  // o: { boards: 纵向木板数, rows: 横向接缝数, color: 缝隙色, a: 不透明度 }
  K.floorBoards = function (g, q, R, o) {
    o = o || {};
    var b = R.back, by1 = b[1] + b[3], bx = b[0], bx1 = b[0] + b[2], H = K.DH, W = K.DW;
    var n = o.boards || K.byModel(q, 10, 16, 22), rows = o.rows || K.byModel(q, 5, 8, 12);
    g.save(); K.poly(g, [bx, by1, bx1, by1, W, H, 0, H]); g.clip();
    g.strokeStyle = o.color || 'rgba(15,8,4,0.7)'; g.lineWidth = o.lw || 2;
    var span = (W + 400) - (-400);
    for (var i = 0; i <= n; i++) {
      var tx = bx + (bx1 - bx) * i / n, fx = -400 + span * i / n;
      g.beginPath(); g.moveTo(tx, by1); g.lineTo(fx, H); g.stroke();
    }
    for (var j = 1; j <= rows; j++) {
      var t = Math.pow(j / (rows + 1), 1.6), y = by1 + (H - by1) * t, f = R.floorAt(t);
      var k = j % 2;
      for (var i2 = k; i2 < n; i2 += 2) {
        var u0 = i2 / n, u1 = (i2 + 1) / n;
        var xa = f.x0 + (f.x1 - f.x0) * u0, xb = f.x0 + (f.x1 - f.x0) * u1;
        // 从后墙线性插值到屏幕边缘的实际宽度
        var ex0 = bx + (bx1 - bx) * u0, ex1 = bx + (bx1 - bx) * u1, sx0 = -400 + span * u0, sx1 = -400 + span * u1;
        xa = ex0 + (sx0 - ex0) * t; xb = ex1 + (sx1 - ex1) * t;
        g.beginPath(); g.moveTo(xa, y); g.lineTo(xb, y); g.stroke();
      }
    }
    // 远处变暗、近处有一点反光
    if (q.light > 0) {
      K.poly(g, [bx, by1, bx1, by1, W, H, 0, H]);
      g.fillStyle = K.lin(g, 0, by1, 0, H, ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(255,230,200,0.04)']);
      g.fill();
    }
    g.restore();
  };

  // 文字（标牌、书脊等）
  K.text = function (g, str, x, y, size, color, o) {
    o = o || {};
    g.save();
    g.font = (o.weight || 'normal') + ' ' + size + 'px ' + (o.font || '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif');
    g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
    if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, x + size * 0.05, y + size * 0.06); }
    g.fillStyle = color; g.fillText(str, x, y);
    g.restore();
  };
  K.line = function (g, x0, y0, x1, y1, w, color) {
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = color; g.stroke();
  };
  // 柔边椭圆/圆（用于云、雾、树冠等）
  K.blob = function (g, x, y, r, color, a) {
    g.fillStyle = K.rad(g, x, y, 0, r, [[0, K.rgba(color, a === undefined ? 1 : a)], [0.6, K.rgba(color, (a === undefined ? 1 : a) * 0.6)], [1, K.rgba(color, 0)]]);
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // 烛火（烘焙的静态火焰形状 + 光晕；动态闪烁由引擎根据 lights 叠加）
  K.flame = function (g, q, x, y, h, o) {
    o = o || {};
    var w = h * 0.42;
    if (q.light > 0) K.glow(g, x, y - h * 0.4, h * (o.glow || 4), o.color || '#ffb050', o.a || 0.45);
    g.beginPath(); g.moveTo(x, y - h); g.bezierCurveTo(x + w, y - h * 0.4, x + w * 0.7, y, x, y); g.bezierCurveTo(x - w * 0.7, y, x - w, y - h * 0.4, x, y - h);
    g.fillStyle = K.lin(g, x, y - h, x, y, ['rgba(255,250,220,0.95)', 'rgba(255,190,80,0.95)', 'rgba(220,90,30,0.9)']); g.fill();
    g.beginPath(); g.ellipse ? g.ellipse(x, y - h * 0.28, w * 0.28, h * 0.22, 0, 0, Math.PI * 2) : g.arc(x, y - h * 0.28, w * 0.28, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,245,0.9)'; g.fill();
  };

  /* ---------------- 质量对象 ---------------- */
  K.Q = function (s, model, tex, light) { return { s: s || 1, model: model === undefined ? 2 : model, tex: tex === undefined ? 2 : tex, light: light === undefined ? 2 : light }; };
  // 按建模精度挑数量：K.byModel(q, 低, 中, 高)
  K.byModel = function (q, a, b, c) { return q.model <= 0 ? a : q.model === 1 ? b : c; };
  K.byLight = function (q, a, b, c) { return q.light <= 0 ? a : q.light === 1 ? b : c; };
})(typeof window !== 'undefined' ? window : globalThis);
