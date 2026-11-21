/* DARK MOOD Ⅱ HD 背景 —— 裁屋（审判背景）、炭烧小屋、诊所、杂货店、公民馆广播室、分校、冬木家旧宅、驻在所
 * 设计坐标 1920x1080；锚点 = locations.js 的 480x270 坐标 ×4。
 * 做法与第一部的塔内背景相同：先画固有色 + 形体明暗，再乘一张低分辨率光照图（环境色 + 光源衰减 + 投影），
 * 最后叠加泛光 / 高光 / 体积光。q.light 决定光照层次，q.tex 决定纹理，q.model 决定物件与细节数量。
 * 只用 ES5 + Canvas 2D 基础 API。
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK;
  if (!K || !DM.HDBG) return;
  var W = 1920, H = 1080, PI = Math.PI, TAU = PI * 2;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function byM(q, a, b, c) { return K.byModel(q, a, b, c); }

  /* =================================================================
   * 共用纹理预设（同参数 + 同 units 的贴图只生成一次）
   * ================================================================= */
  var SUGI_V = { c1: '#2a1a10', c2: '#5a3c26', planks: 4, dir: 'v', seed: 21, gap: '#3e2818', ring: 2.5 };
  var SUGI_H = { c1: '#2a1a10', c2: '#5a3c26', planks: 4, dir: 'h', seed: 21, gap: '#3e2818', ring: 2.5 };
  var WU = 256;
  function woodFill(g, q, fallback, horiz, ox, oy, tint) {
    if (q.tex > 0) {
      g.save(); K.fillTex(g, q, 'wood', horiz ? SUGI_H : SUGI_V, WU, ox || 0, oy || 0); g.restore();
      if (tint) { g.save(); g.globalCompositeOperation = tint[2] || 'source-over'; g.fillStyle = K.rgba(tint[0], tint[1]); g.fill(); g.restore(); }
    } else { g.fillStyle = fallback; g.fill(); }
  }
  var EARTH = { c1: '#6a5a44', c2: '#8a785c', seed: 31, stain: 0.6 };
  function earthFill(g, q, fallback, tint) {
    if (q.tex > 0) {
      g.save(); K.fillTex(g, q, 'plaster', EARTH, 256, 0, 0); g.restore();
      if (tint) { g.save(); g.globalCompositeOperation = tint[2] || 'source-over'; g.fillStyle = K.rgba(tint[0], tint[1]); g.fill(); g.restore(); }
    } else { g.fillStyle = fallback; g.fill(); }
  }
  function grain(g, q, a, pathFn) {
    if (q.tex <= 0) return;
    g.save(); if (pathFn) pathFn(g); else { g.beginPath(); g.rect(0, 0, W, H); }
    g.globalCompositeOperation = 'overlay';
    K.fillTex(g, q, 'noise', { c1: '#383838', c2: '#c8c8c8', scale: 16, oct: 4, seed: 37, contrast: 1.3 }, 256, 0, 0, a || 0.4);
    g.restore();
  }
  function finish(g, q, vig, inner) {
    if (q.tex > 0) {
      g.save(); g.beginPath(); g.rect(0, 0, W, H); g.globalCompositeOperation = 'overlay';
      K.fillTex(g, q, 'noise', { c1: '#3c3c3c', c2: '#c4c4c4', scale: 32, oct: 2, seed: 99, contrast: 1.5 }, 128, 0, 0, q.tex >= 2 ? 0.14 : 0.1);
      g.restore();
    }
    if (vig) K.vignette(g, W, H, vig, inner || 0.45);
  }

  /* =================================================================
   * 光照图
   * ================================================================= */
  function lightMap(q, amb) {
    var k = Math.min(q.s, 1) / 4;
    var w = Math.max(32, Math.round(W * k)), h = Math.max(18, Math.round(H * k));
    var c = K.canvas(w, h), x = c.getContext('2d');
    x.setTransform(w / W, 0, 0, h / H, 0, 0);
    x.fillStyle = amb; x.fillRect(0, 0, W, H);
    return { c: c, g: x, amb: amb };
  }
  function lmLight(L, x, y, r, color, a, sy, rot) {
    var g = L.g; g.save(); g.globalCompositeOperation = 'lighter';
    g.translate(x, y); if (rot) g.rotate(rot); if (sy) g.scale(1, sy);
    g.fillStyle = K.rad(g, 0, 0, 0, r, [[0, K.rgba(color, a)], [0.12, K.rgba(color, a * 0.8)], [0.35, K.rgba(color, a * 0.42)],
      [0.65, K.rgba(color, a * 0.14)], [1, K.rgba(color, 0)]]);
    g.fillRect(-r, -r, 2 * r, 2 * r); g.restore();
  }
  function lmShade(L, a, fn) { var g = L.g; g.save(); g.fillStyle = K.rgba(L.amb, a); fn(g); g.fill(); g.restore(); }
  function lmDark(L, a, fn) { var g = L.g; g.save(); g.fillStyle = 'rgba(0,0,0,' + a + ')'; fn(g); g.fill(); g.restore(); }
  function applyLM(g, L) { g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(L.c, 0, 0, W, H); g.restore(); }
  function softShaft(g, pts, color, a, x0, y0, x1, y1, layers) {
    layers = layers || 5;
    var cx = 0, cy = 0, n = pts.length / 2, i, k;
    for (i = 0; i < pts.length; i += 2) { cx += pts[i]; cy += pts[i + 1]; }
    cx /= n; cy /= n;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (k = 0; k < layers; k++) {
      var f = 1 - k / layers * 0.75, pp = [];
      for (i = 0; i < pts.length; i += 2) pp.push(cx + (pts[i] - cx) * f, pts[i + 1] + (cy - pts[i + 1]) * (1 - f) * 0.15);
      K.poly(g, pp);
      g.fillStyle = K.lin(g, x0, y0, x1, y1, [[0, K.rgba(color, a / layers)], [0.6, K.rgba(color, a / layers * 0.5)], [1, K.rgba(color, 0)]]);
      g.fill();
    }
    g.restore();
  }
  function dust(g, rnd, n, x, y, w, h, color, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var px = x + rnd() * w, py = y + rnd() * h, r = 0.6 + rnd() * 1.3;
      g.fillStyle = K.rgba(color, a * (0.25 + rnd() * 0.75));
      g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
    }
    g.restore();
  }
  function cobweb(g, cx, cy, r, a0, a1, a) {
    var n = 7, rings = 6, i, j;
    g.save(); g.strokeStyle = 'rgba(220,220,230,' + (a || 0.18) + ')'; g.lineWidth = 1;
    for (i = 0; i < n; i++) { var an = lerp(a0, a1, i / (n - 1)); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); g.stroke(); }
    for (j = 1; j <= rings; j++) {
      var rr = r * j / rings; g.beginPath();
      for (i = 0; i < n; i++) { var an2 = lerp(a0, a1, i / (n - 1)), px = cx + Math.cos(an2) * rr, py = cy + Math.sin(an2) * rr; if (i) { var am = lerp(a0, a1, (i - 0.5) / (n - 1)); g.quadraticCurveTo(cx + Math.cos(am) * rr * 0.86, cy + Math.sin(am) * rr * 0.86, px, py); } else g.moveTo(px, py); }
      g.stroke();
    }
    g.restore();
  }

  /* =================================================================
   * 房间几何（正面单点透视；后墙铺满画面，左右只露一条窄墙）
   * ================================================================= */
  function Room(o) {
    var R = { hy: o.hy, top: o.top, bot: o.bot };
    R.fp = function (X, s) { return [960 + X * s, R.hy + (R.bot - R.hy) * s]; };
    R.sAt = function (y) { return (y - R.hy) / (R.bot - R.hy); };
    return R;
  }
  function floorPoly(g, R, pts) {
    g.beginPath();
    for (var i = 0; i < pts.length; i += 2) { var p = R.fp(pts[i], pts[i + 1]); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
    g.closePath();
  }
  // 地板（木板汇聚到消失点；每条木板斜切贴图，木纹沿透视方向）
  function boardFloor(g, q, R, o) {
    o = o || {};
    var n = o.boards || byM(q, 18, 26, 32), sNear = R.sAt(H), span = o.span || 2600, x0 = 960 - span / 2, rnd = K.rng(o.seed || 7);
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]); g.fillStyle = o.base || '#4a3020'; g.fill();
    for (var b = 0; b < n; b++) {
      var Xa = x0 + span * b / n - 960, Xb = x0 + span * (b + 1) / n - 960;
      var fa = R.fp(Xa, 1), fb = R.fp(Xb, 1), na = R.fp(Xa, sNear), nb = R.fp(Xb, sNear), tone = rnd();
      g.save(); K.poly(g, [fa[0], fa[1], fb[0], fb[1], nb[0], nb[1], na[0], na[1]]); g.clip();
      if (q.tex > 0) {
        var cx = (fa[0] + fb[0]) / 2, ncx = (na[0] + nb[0]) / 2, k = (ncx - cx) / (H - R.bot);
        g.save(); g.translate(cx, R.bot); g.transform(1, 0, k, 1, 0, 0);
        K.poly(g, [-400, -40, 400, -40, 400, H, -400, H]);
        K.fillTex(g, q, 'wood', SUGI_V, WU, -150 + tone * 300, -tone * 900);
        g.restore();
        if (o.tint) { g.fillStyle = o.tint; g.fillRect(0, R.bot, W, H - R.bot); }
      }
      K.poly(g, [fa[0], fa[1], fb[0], fb[1], nb[0], nb[1], na[0], na[1]]);
      g.fillStyle = tone < 0.5 ? 'rgba(0,0,0,' + ((0.5 - tone) * 0.3).toFixed(3) + ')' : 'rgba(255,225,190,' + ((tone - 0.5) * 0.1).toFixed(3) + ')';
      g.fill(); g.restore();
      g.strokeStyle = 'rgba(12,6,3,0.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(fa[0], fa[1]); g.lineTo(na[0], na[1]); g.stroke();
    }
    if (q.model > 0) {
      g.strokeStyle = 'rgba(12,6,3,0.6)'; g.lineWidth = 1.8;
      var rows = byM(q, 0, 5, 8);
      for (var r = 0; r < rows; r++) for (var b2 = (r % 2); b2 < n; b2 += 2) {
        var sj = lerp(1, sNear, Math.pow((r + 0.3 + rnd() * 0.5) / rows, 1.5));
        var A = R.fp(x0 + span * b2 / n - 960, sj), B = R.fp(x0 + span * (b2 + 1) / n - 960, sj);
        g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
      }
    }
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]);
    g.fillStyle = K.lin(g, 0, R.bot, 0, H, [[0, 'rgba(0,0,0,0.35)'], [0.4, 'rgba(0,0,0,0.05)'], [1, 'rgba(20,10,0,0.25)']]); g.fill();
    if (q.light > 0) { g.fillStyle = K.lin(g, 0, R.bot - 2, 0, R.bot + 46, ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']); g.fillRect(0, R.bot - 2, W, 48); }
  }
  // 地砖 / 水泥地（土间）
  function tileFloor(g, q, R, o) {
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]); g.fillStyle = o.base; g.fill();
    var cols = o.cols || 14, rows = o.rows || 6, sNear = R.sAt(H), span = o.span || 3000;
    if (o.tiles) {
      var rnd = K.rng(o.seed || 3);
      for (var r = 0; r < rows; r++) {
        var s0 = lerp(1, sNear, Math.pow(r / rows, 1.4)), s1 = lerp(1, sNear, Math.pow((r + 1) / rows, 1.4));
        for (var c = 0; c < cols; c++) {
          var X0 = -span / 2 + span * c / cols, X1 = X0 + span / cols;
          floorPoly(g, R, [X0, s0, X1, s0, X1, s1, X0, s1]);
          g.fillStyle = (r + c) % 2 && o.check ? o.check : 'rgba(' + (rnd() < 0.5 ? '0,0,0,' : '255,255,255,') + (rnd() * 0.06).toFixed(3) + ')'; g.fill();
        }
      }
      g.strokeStyle = o.joint || 'rgba(0,0,0,0.35)'; g.lineWidth = 1.6;
      for (var c2 = 0; c2 <= cols; c2++) { var X = -span / 2 + span * c2 / cols, a = R.fp(X, 1), b = R.fp(X, sNear); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      for (var r2 = 1; r2 < rows; r2++) { var y = R.fp(0, lerp(1, sNear, Math.pow(r2 / rows, 1.4)))[1]; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    }
    grain(g, q, 0.45, function (x) { K.poly(x, [0, R.bot, W, R.bot, W, H, 0, H]); });
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]);
    g.fillStyle = K.lin(g, 0, R.bot, 0, H, [[0, 'rgba(0,0,0,0.3)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.25)']]); g.fill();
    if (q.light > 0) { g.fillStyle = K.lin(g, 0, R.bot - 2, 0, R.bot + 40, ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']); g.fillRect(0, R.bot - 2, W, 42); }
  }
  // 天花板（木板或吸音板，朝消失点汇聚）
  function ceiling(g, q, R, o) {
    K.poly(g, [0, 0, W, 0, W, R.top, 0, R.top]);
    if (o.wood) woodFill(g, q, o.base, true, 0, 0, ['#1a0c04', 0.3]); else { g.fillStyle = o.base; g.fill(); }
    g.strokeStyle = o.line || 'rgba(0,0,0,0.45)'; g.lineWidth = 2;
    for (var cb = -12; cb <= 12; cb++) { var cx0 = 960 + cb * 100, kk = (0 - R.hy) / (R.top - R.hy); g.beginPath(); g.moveTo(cx0, R.top); g.lineTo(960 + (cx0 - 960) * kk, 0); g.stroke(); }
    if (o.cross) { for (var j = 1; j < 3; j++) { var yy = R.top * j / 3; g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke(); } }
    K.poly(g, [0, 0, W, 0, W, R.top, 0, R.top]); g.fillStyle = K.lin(g, 0, 0, 0, R.top, ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']); g.fill();
  }
  // 后墙：灰泥/壁板 + 腰板 + 踢脚
  function backWall(g, q, R, o) {
    K.poly(g, [0, R.top, W, R.top, W, R.bot, 0, R.bot]);
    if (o.tex) K.matFill(g, q, o.base, o.tex[0], o.tex[1], o.tex[2], 0, 0); else { g.fillStyle = o.base; g.fill(); }
    if (o.wain) {
      var wt = o.wain;
      g.beginPath(); g.rect(0, wt, W, R.bot - wt); woodFill(g, q, o.wainColor || '#4a3020', false, 0, wt, o.wainTint || ['#2a1408', 0.15]);
      g.fillStyle = K.lin(g, 0, wt - 12, 0, wt + 6, ['#6a4428', '#3a2210']); g.fillRect(0, wt - 12, W, 18);
      g.fillStyle = 'rgba(255,225,180,0.25)'; g.fillRect(0, wt - 12, W, 3);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, wt + 6, W, 6);
      if (q.model > 0) { g.fillStyle = 'rgba(0,0,0,0.35)'; for (var x = 0; x < W; x += o.wainStep || 120) g.fillRect(x, wt + 6, 3, R.bot - wt - 6); }
    }
    g.fillStyle = o.skirt || '#2a1c12'; g.fillRect(0, R.bot - 30, W, 30);
    g.fillStyle = 'rgba(255,225,190,0.15)'; g.fillRect(0, R.bot - 30, W, 2);
    // 天花线与墙角 AO
    g.fillStyle = K.lin(g, 0, R.top, 0, R.top + 60, ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']); g.fillRect(0, R.top, W, 60);
    if (q.light > 0) { K.ao(g, 0, R.top, W, R.bot - R.top, 90, 0.35, 'lr'); }
  }

  /* =================================================================
   * 通用物件
   * ================================================================= */
  function brassGrad(g, x0, y0, x1, y1, dark) {
    return K.lin(g, x0, y0, x1, y1, dark ? [[0, '#3a2a12'], [0.3, '#8a6a32'], [0.45, '#d8b870'], [0.6, '#7a5a28'], [1, '#2a1c0a']]
      : [[0, '#5a4220'], [0.25, '#b08a44'], [0.42, '#f4dc98'], [0.58, '#a07a38'], [1, '#3a2810']]);
  }
  function ironGrad(g, x0, y0, x1, y1) { return K.lin(g, x0, y0, x1, y1, [[0, '#2a2a30'], [0.3, '#5a5a64'], [0.45, '#8a8a94'], [0.6, '#44444c'], [1, '#141418']]); }
  function steelGrad(g, x0, y0, x1, y1, base) {
    var b = base || '#8a8e94';
    return K.lin(g, x0, y0, x1, y1, [[0, K.shade(b, 0.25)], [0.5, b], [1, K.shade(b, -0.35)]]);
  }
  function rivet(g, q, x, y, r, rust) {
    g.beginPath(); g.arc(x, y, r, 0, TAU);
    g.fillStyle = K.rad(g, x - r * 0.35, y - r * 0.35, 0, r * 1.2, rust ? [[0, '#c07a48'], [0.5, '#6a3a1e'], [1, '#2a1408']] : [[0, '#b0b0b8'], [0.5, '#4e4e56'], [1, '#18181c']]);
    g.fill();
  }
  function flameShape(g, x, y, h, a) {
    var w = h * 0.36;
    g.beginPath(); g.moveTo(x, y - h); g.bezierCurveTo(x + w, y - h * 0.45, x + w * 0.8, y, x, y); g.bezierCurveTo(x - w * 0.8, y, x - w, y - h * 0.45, x, y - h);
    g.fillStyle = K.lin(g, x, y - h, x, y, [[0, 'rgba(255,220,140,' + (0.85 * (a || 1)) + ')'], [0.5, 'rgba(255,170,60,' + (0.95 * (a || 1)) + ')'], [1, 'rgba(200,70,20,' + (0.9 * (a || 1)) + ')']]);
    g.fill();
    K.ellipse(g, x, y - h * 0.3, w * 0.38, h * 0.24); g.fillStyle = 'rgba(255,252,235,0.95)'; g.fill();
  }
  function quad(g, a, b, c, d) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); }
  // 立方体（正面 + 顶面 + 一个侧面），用于柜子、桌子等落地物件。透视：顶面向消失点收，侧面朝画面中心
  function box(g, q, x, y, w, h, d, o) {
    o = o || {};
    var vx = 960, vy = o.vy || 440, k = d / 1000;
    function P(px, py) { return [px + (vx - px) * k, py + (vy - py) * k]; }
    var tl = [x, y], tr = [x + w, y], br = [x + w, y + h], bl = [x, y + h];
    var tl2 = P(x, y), tr2 = P(x + w, y), br2 = P(x + w, y + h), bl2 = P(x, y + h);
    // 侧面
    if (x + w < vx) { quad(g, tr, tr2, br2, br); g.fillStyle = o.side || K.shade(o.front || '#888', -0.3); g.fill(); }
    else if (x > vx) { quad(g, tl, tl2, bl2, bl); g.fillStyle = o.side || K.shade(o.front || '#888', -0.3); g.fill(); }
    // 顶面（视线以下才看得见）
    if (y > vy) { quad(g, tl, tr, tr2, tl2); g.fillStyle = o.top || K.shade(o.front || '#888', 0.15); g.fill(); }
    g.beginPath(); g.rect(x, y, w, h);
    if (o.fill) o.fill(); else { g.fillStyle = o.frontGrad ? o.frontGrad : (o.front || '#888'); g.fill(); }
    return { tl: tl, tr: tr, br: br, bl: bl, tl2: tl2, tr2: tr2, br2: br2, bl2: bl2 };
  }
  // 窗外的雪景（在矩形内）。o: { bldg: function(g, x, y, w, h) 远处房屋, night, seed, ground: 地面相对高度 0..1 }
  function snowView(g, q, x, y, w, h, o) {
    o = o || {};
    var rnd = K.rng(o.seed || 11), gy = y + h * (o.ground === undefined ? 0.62 : o.ground);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    K.vgrad(g, x, y, w, gy - y + 2, o.night ? ['#141a2c', '#222a40', '#2e3650'] : ['#8a92a6', '#a8aebc', '#c4c8d2']);
    // 雪云
    for (var i = 0; i < byM(q, 3, 6, 10); i++) K.blob(g, x + rnd() * w, y + rnd() * (gy - y) * 0.6, 40 + rnd() * 80, o.night ? '#0e1220' : (rnd() < 0.5 ? '#7a8296' : '#d0d4dc'), 0.45);
    // 远山（偏蓝）
    g.fillStyle = o.night ? '#1a2034' : '#9aa2b4';
    g.beginPath(); g.moveTo(x, gy); for (var m = 0; m <= 8; m++) g.lineTo(x + w * m / 8, gy - h * (0.12 + 0.1 * Math.sin(m * 1.7 + (o.seed || 0)) + rnd() * 0.05)); g.lineTo(x + w, gy); g.closePath(); g.fill();
    // 远处雪杉
    for (var t = 0; t < byM(q, 4, 8, 12); t++) {
      var tx = x + rnd() * w, th = h * (0.12 + rnd() * 0.12), tw = th * 0.4, ty = gy + 2;
      g.fillStyle = o.night ? '#0a0e18' : '#4a5a5e';
      K.poly(g, [tx - tw / 2, ty, tx + tw / 2, ty, tx, ty - th]); g.fill();
      g.fillStyle = o.night ? 'rgba(160,170,200,0.5)' : 'rgba(240,244,250,0.85)';
      K.poly(g, [tx - tw * 0.3, ty - th * 0.45, tx + tw * 0.3, ty - th * 0.45, tx, ty - th * 0.95]); g.fill();
    }
    if (o.bldg) o.bldg(x, y, w, h, gy);
    // 积雪地面
    g.fillStyle = K.lin(g, 0, gy, 0, y + h, o.night ? ['#3a4258', '#2a3046'] : ['#e8ecf2', '#c8d0de']); g.fillRect(x, gy, w, y + h - gy);
    if (q.model > 0) { g.fillStyle = o.night ? 'rgba(20,24,40,0.4)' : 'rgba(140,150,180,0.25)'; for (var s = 0; s < 4; s++) { K.ellipse(g, x + rnd() * w, gy + (y + h - gy) * (0.3 + rnd() * 0.6), 30 + rnd() * 50, 4 + rnd() * 4); g.fill(); } }
    // 飘落的雪（静态）
    if (q.model > 0) { g.fillStyle = 'rgba(255,255,255,0.75)'; for (var f = 0; f < byM(q, 0, 14, 28); f++) { g.beginPath(); g.arc(x + rnd() * w, y + rnd() * h, 1 + rnd() * 1.8, 0, TAU); g.fill(); } }
    g.restore();
  }
  // 窗框（铝框推拉窗 / 木框格子窗）与玻璃反光、角落霜花
  function windowFrame(g, q, x, y, w, h, o) {
    o = o || {};
    var fc = o.frame || '#b8bcc0', fw = o.fw || 12;
    // 霜
    if (q.model > 0) {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      var cs = [[x, y + h], [x + w, y + h], [x, y], [x + w, y]];
      for (var c = 0; c < (o.frostTop ? 4 : 2); c++) { g.fillStyle = K.rad(g, cs[c][0], cs[c][1], 0, Math.min(w, h) * 0.35, [[0, 'rgba(235,242,255,0.55)'], [1, 'rgba(235,242,255,0)']]); g.fillRect(x, y, w, h); }
      g.restore();
    }
    if (q.light > 0) {
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(210,220,240,0.10)';
      K.poly(g, [x + w * 0.15, y, x + w * 0.35, y, x + w * 0.05, y + h, x - w * 0.15, y + h]); g.fill();
      K.poly(g, [x + w * 0.62, y, x + w * 0.7, y, x + w * 0.5, y + h, x + w * 0.42, y + h]); g.fill();
      g.restore();
    }
    g.strokeStyle = fc; g.lineWidth = fw; g.strokeRect(x + fw / 2, y + fw / 2, w - fw, h - fw);
    var cols = o.cols || 2, rows = o.rows || 1;
    g.lineWidth = o.mw || fw * 0.8;
    for (var i = 1; i < cols; i++) { var xx = x + w * i / cols; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
    g.lineWidth = o.rw || fw * 0.5;
    for (var j = 1; j < rows; j++) { var yy = y + h * j / rows; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
    if (q.light > 0) { g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, w - 4, h - 4); }
  }
  // 吸顶日光灯
  function fluoLamp(g, q, x, y, w) {
    g.fillStyle = '#d8dadc'; K.rr(g, x - w / 2, y, w, 22, 4); g.fill();
    g.fillStyle = K.lin(g, 0, y + 14, 0, y + 30, ['#ffffff', '#e8f0ff']); K.rr(g, x - w / 2 + 14, y + 16, w - 28, 12, 6); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - w / 2, y + 20, w, 2);
  }
  function wallClock(g, q, x, y, r, hh, mm) {
    if (q.light > 0) K.contact(g, x + 6, y + 8, r * 1.05, r * 1.05, 0.35);
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = K.lin(g, x - r, y - r, x + r, y + r, ['#5a3a22', '#2a180c']); g.fill();
    g.beginPath(); g.arc(x, y, r * 0.84, 0, TAU); g.fillStyle = K.rad(g, x - r * 0.3, y - r * 0.3, 2, r, ['#fffdf4', '#e8e2d0']); g.fill();
    for (var i = 0; i < 12; i++) { var a = i / 12 * TAU; g.strokeStyle = '#2a2018'; g.lineWidth = i % 3 ? 1.5 : 3; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66); g.lineTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); g.stroke(); }
    var ah = (hh % 12 + mm / 60) / 12 * TAU - PI / 2, am = mm / 60 * TAU - PI / 2;
    g.strokeStyle = '#1a1410'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ah) * r * 0.45, y + Math.sin(ah) * r * 0.45); g.stroke();
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(am) * r * 0.66, y + Math.sin(am) * r * 0.66); g.stroke();
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.3)'; K.ellipse(g, x - r * 0.3, y - r * 0.4, r * 0.35, r * 0.15, -0.5); g.fill(); }
  }
  // 挂历（2003 年 2 月）
  function calendar(g, q, x, y, w, h) {
    if (q.light > 0) K.contact(g, x + w / 2 + 6, y + h + 6, w * 0.5, 8, 0.3);
    g.fillStyle = '#f4f0e6'; g.fillRect(x, y, w, h);
    g.fillStyle = '#6a8aa8'; g.fillRect(x, y, w, h * 0.38);
    if (q.model > 0) { g.fillStyle = '#e8eef4'; K.poly(g, [x, y + h * 0.38, x + w * 0.35, y + h * 0.12, x + w * 0.6, y + h * 0.26, x + w, y + h * 0.08, x + w, y + h * 0.38]); g.fill(); }
    K.text(g, '2', x + w * 0.2, y + h * 0.48, h * 0.1, '#c02030', { weight: 'bold', font: 'Arial,sans-serif' });
    g.fillStyle = 'rgba(40,40,50,0.55)';
    for (var r = 0; r < 4; r++) for (var c = 0; c < 7; c++) g.fillRect(x + w * 0.08 + c * w * 0.125, y + h * 0.58 + r * h * 0.1, w * 0.07, h * 0.04);
    if (q.model > 0) { g.strokeStyle = 'rgba(200,30,40,0.8)'; g.lineWidth = 2; K.ellipse(g, x + w * 0.08 + 5 * w * 0.125 + w * 0.035, y + h * 0.58 + 1 * h * 0.1 + h * 0.02, w * 0.06, h * 0.04); g.stroke(); }
    g.fillStyle = '#2a2a30'; g.fillRect(x + w / 2 - 3, y - 6, 6, 8);
  }
  // 石油取暖炉（圆筒形，网罩里的火）
  function keroStove(g, q, x, base, s) {
    s = s || 1;
    var w = 70 * s, h = 120 * s;
    if (q.light > 0) K.contact(g, x, base, w * 0.9, 12 * s, 0.6);
    g.fillStyle = K.lin(g, x - w / 2, 0, x + w / 2, 0, ['#3a3a40', '#8a8e96', '#4a4a52', '#1e1e22']); g.fillRect(x - w / 2, base - h, w, h - 10 * s);
    K.ellipse(g, x, base - h, w / 2, 8 * s); g.fillStyle = '#5a5a62'; g.fill();
    // 燃烧窗
    g.fillStyle = '#1a0a04'; g.fillRect(x - w * 0.32, base - h * 0.78, w * 0.64, h * 0.42);
    g.fillStyle = K.lin(g, 0, base - h * 0.78, 0, base - h * 0.36, ['#ffb050', '#ff6a20', '#b02808']); g.fillRect(x - w * 0.28, base - h * 0.74, w * 0.56, h * 0.34);
    g.strokeStyle = 'rgba(40,30,30,0.8)'; g.lineWidth = 2; for (var i = 1; i < 6; i++) { var gx = x - w * 0.28 + i * w * 0.56 / 6; g.beginPath(); g.moveTo(gx, base - h * 0.74); g.lineTo(gx, base - h * 0.4); g.stroke(); }
    g.fillStyle = K.lin(g, x - w / 2, 0, x + w / 2, 0, ['#2a2a30', '#6a6a72', '#1a1a1e']); g.fillRect(x - w / 2 - 4, base - 12 * s, w + 8, 12 * s);
    // 上面的水壶
    if (q.model > 0) {
      g.fillStyle = K.lin(g, x - 26 * s, 0, x + 26 * s, 0, ['#9a9ea6', '#e0e4ea', '#6a6e76']); K.path(g, 'M-24 0 C-26 -16 -14 -26 0 -26 C14 -26 26 -16 24 0 Z', x, base - h - 4 * s, s); g.fill();
      g.strokeStyle = '#3a3a40'; g.lineWidth = 3 * s; g.beginPath(); g.arc(x, base - h - 26 * s, 14 * s, PI, TAU); g.stroke();
      if (q.light > 0) { g.strokeStyle = 'rgba(230,235,245,0.35)'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x + 22 * s, base - h - 18 * s); g.bezierCurveTo(x + 30 * s, base - h - 40 * s, x + 18 * s, base - h - 54 * s, x + 26 * s, base - h - 76 * s); g.stroke(); }
    }
    return [x, base - h * 0.57];
  }
  // 门（带上部磨砂玻璃的木门 / 钢门）
  function door(g, q, x, y, w, h, o) {
    o = o || {};
    g.fillStyle = o.frame || '#3a2818'; g.fillRect(x - 14, y - 16, w + 28, h + 16);
    g.fillStyle = 'rgba(255,225,190,0.15)'; g.fillRect(x - 14, y - 16, w + 28, 3);
    g.beginPath(); g.rect(x, y, w, h);
    if (o.steel) { g.fillStyle = steelGrad(g, x, 0, x + w, 0, o.steel); g.fill(); }
    else woodFill(g, q, o.fill || '#5a3a22', false, x, y, o.tint || ['#6a4428', 0.1]);
    g.fillStyle = K.lin(g, x, 0, x + w, 0, ['rgba(255,230,200,0.1)', 'rgba(0,0,0,0.3)']); g.fillRect(x, y, w, h);
    if (o.glass) {
      var gx = x + w * 0.16, gy = y + h * 0.08, gw = w * 0.68, gh = h * o.glass;
      g.fillStyle = o.glassColor || '#c4c8cc'; g.fillRect(gx, gy, gw, gh);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'noise', { c1: '#b0b4b8', c2: '#ffffff', scale: 24, oct: 2, seed: 5, contrast: 1.2 }, 128, 0, 0, 0.8); g.restore(); }
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.strokeRect(gx, gy, gw, gh);
    }
    if (o.panels) { g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2.5; g.strokeRect(x + w * 0.14, y + h * 0.58, w * 0.72, h * 0.34); }
    var kx = o.knobLeft ? x + 22 : x + w - 22, ky = y + h * 0.52;
    g.fillStyle = brassGrad(g, kx - 10, 0, kx + 10, 0); K.rr(g, kx - 7, ky - 22, 14, 44, 3); g.fill();
    g.beginPath(); g.arc(kx, ky, 8, 0, TAU); g.fillStyle = K.rad(g, kx - 3, ky - 3, 1, 9, ['#fff0c0', '#b08a44', '#4a3410']); g.fill();
    if (q.light > 0) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y, w, 10); }
  }
  // 贴在墙上的纸（告示、海报）
  function paperSheet(g, q, x, y, w, h, rot, fn, color) {
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot || 0);
    if (q.light > 0) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-w / 2 + 4, -h / 2 + 5, w, h); }
    g.fillStyle = color || '#ece6d6'; g.fillRect(-w / 2, -h / 2, w, h);
    if (fn) fn(-w / 2, -h / 2, w, h);
    g.fillStyle = '#c03030'; g.beginPath(); g.arc(0, -h / 2 + 7, 4, 0, TAU); g.fill();
    g.restore();
  }
  function textLines(g, x, y, w, n, step, color) {
    g.fillStyle = color || 'rgba(40,40,50,0.55)';
    for (var i = 0; i < n; i++) g.fillRect(x, y + i * step, w * (i === n - 1 ? 0.55 : 0.85 + (i * 7 % 3) * 0.05), Math.max(2, step * 0.35));
  }

  /* =================================================================
   * 驻在所 police_box
   * ================================================================= */
  var RPB = Room({ hy: 440, top: 104, bot: 800 });
  function drawPoliceBox(g, q) {
    var R = RPB, i;
    ceiling(g, q, R, { base: '#c8c4b8', line: 'rgba(80,70,60,0.35)', cross: true });
    backWall(g, q, R, { base: '#b8b0a0', tex: ['plaster', { c1: '#a49c8c', c2: '#c4bcaa', seed: 41, stain: 0.7 }, 256], wain: 600, wainColor: '#5a4632', wainStep: 160, skirt: '#3a3026' });
    tileFloor(g, q, R, { base: '#6a6a62', tiles: true, cols: 16, rows: 6, check: 'rgba(0,0,0,0.08)', joint: 'rgba(30,30,28,0.4)', seed: 5 });
    fluoLamp(g, q, 960, 8, 380);

    // 墙上：通缉令、管内地图、挂钟、挂历
    paperSheet(g, q, 360, 176, 140, 104, -0.02, function (x, y, w, h) {
      g.fillStyle = '#d8e0d0'; g.fillRect(x + 8, y + 22, w - 16, h - 30);
      g.strokeStyle = 'rgba(60,90,60,0.7)'; g.lineWidth = 2; K.path(g, 'M20 60 C40 40 70 50 90 40 C110 34 130 50 140 70', x, y, 1); g.stroke();
      g.fillStyle = '#c03030'; g.fillRect(x + 92, y + 52, 6, 6); K.text(g, '管内図', x + w / 2, y + 12, 12, '#2a2a30', { weight: 'bold' });
    });
    if (q.model > 0) {
      for (i = 0; i < 2; i++) paperSheet(g, q, 560 + i * 112, 176 + i * 4, 96, 130, i ? 0.03 : -0.02, function (x, y, w, h) {
        g.fillStyle = '#c02020'; g.fillRect(x + 6, y + 6, w - 12, 18); K.text(g, '指名手配', x + w / 2, y + 15, 12, '#fff', { weight: 'bold' });
        g.fillStyle = '#b8b0a0'; g.fillRect(x + 22, y + 30, w - 44, 48);
        g.fillStyle = '#3a3430'; g.beginPath(); g.arc(x + w / 2, y + 48, 12, 0, TAU); g.fill(); g.fillRect(x + w / 2 - 18, y + 60, 36, 18);
        textLines(g, x + 10, y + 86, w - 20, 4, 9);
      });
    }
    wallClock(g, q, 1440, 200, 44, 9, 50);
    calendar(g, q, 1290, 520, 84, 112);

    // ---- 后门（锚点 24-160, 256-816）----
    door(g, q, 36, 280, 116, R.bot - 280, { glass: 0.34, panels: true, knobLeft: false, frame: '#3a3026' });
    // ---- 窗（锚点 800-1280, 144-472）：正对马路对面的杂货店 ----
    var wx = 812, wy = 158, ww = 456, wh = 300;
    g.fillStyle = '#d4d0c8'; g.fillRect(wx - 18, wy - 18, ww + 36, wh + 40);
    snowView(g, q, wx, wy, ww, wh, { seed: 7, ground: 0.72, bldg: function (x, y, w, h, gy) {
      // 杂货店：瓦顶、亮灯的玻璃门窗、招牌、屋檐下的灰色电话
      var sx = x + w * 0.18, sw = w * 0.66, sy = gy - h * 0.46;
      g.fillStyle = '#5a5048'; g.fillRect(sx, sy, sw, gy - sy);
      g.fillStyle = '#2e3038'; K.poly(g, [sx - 20, sy + 6, sx + sw + 20, sy + 6, sx + sw - 10, sy - 40, sx + 10, sy - 40]); g.fill();
      g.fillStyle = '#eef2f8'; K.poly(g, [sx - 22, sy + 6, sx + sw + 22, sy + 6, sx + sw + 10, sy - 6, sx - 10, sy - 6]); g.fill();
      g.fillStyle = '#eef2f8'; K.poly(g, [sx + 10, sy - 40, sx + sw - 10, sy - 40, sx + sw - 20, sy - 50, sx + 20, sy - 50]); g.fill();
      g.fillStyle = '#e8e0c8'; g.fillRect(sx + sw * 0.18, sy + 10, sw * 0.64, 22); K.text(g, '阿部商店', sx + sw / 2, sy + 21, 15, '#7a1a1a', { weight: 'bold' });
      g.fillStyle = '#ffd890'; g.fillRect(sx + 14, sy + 40, sw * 0.62, gy - sy - 46);
      g.strokeStyle = '#4a4a50'; g.lineWidth = 3; for (var p = 1; p < 4; p++) { g.beginPath(); g.moveTo(sx + 14 + p * sw * 0.155, sy + 40); g.lineTo(sx + 14 + p * sw * 0.155, gy - 6); g.stroke(); }
      g.fillStyle = '#9a9ea4'; g.fillRect(sx + sw * 0.8, sy + 46, 16, 30); g.fillStyle = '#6a6e74'; g.fillRect(sx + sw * 0.8 + 3, sy + 76, 10, gy - sy - 82);
      g.fillStyle = 'rgba(255,255,255,0.85)'; K.ellipse(g, sx + sw / 2, gy, sw * 0.6, 8); g.fill();
    } });
    windowFrame(g, q, wx, wy, ww, wh, { frame: '#b4b8bc', cols: 2, rows: 1, fw: 12 });
    g.fillStyle = K.lin(g, 0, wy + wh, 0, wy + wh + 22, ['#e0dcd2', '#9a9488']); g.fillRect(wx - 26, wy + wh, ww + 52, 22);
    // 半拉的百叶帘
    if (q.model > 0) { g.fillStyle = '#e8e4d8'; g.fillRect(wx, wy, ww, 40); for (i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(wx, wy + 6 + i * 6, ww, 1.5); } g.fillStyle = '#c8c4b8'; g.fillRect(wx, wy + 38, ww, 5); }

    // ---- 储物柜（锚点 1568-1840, 264-824）----
    (function locker() {
      var x = 1586, y = 280, w = 240, h = R.bot + 10 - 280;
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.6, 12, 0.6);
      var b = box(g, q, x, y, w, h, 60, { front: '#8a9096', side: '#5a6066', top: '#a4aab0' });
      g.fillStyle = steelGrad(g, x, 0, x + w, 0, '#8e949a'); g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(30,34,38,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + w / 2, y + 8); g.lineTo(x + w / 2, y + h - 8); g.stroke();
      for (var d = 0; d < 2; d++) {
        var dx = x + d * w / 2;
        g.strokeStyle = 'rgba(30,34,38,0.5)'; g.lineWidth = 2; g.strokeRect(dx + 10, y + 10, w / 2 - 20, h - 20);
        for (var v = 0; v < (q.model > 0 ? 5 : 3); v++) { g.fillStyle = 'rgba(20,24,28,0.7)'; g.fillRect(dx + 26, y + 30 + v * 12, w / 2 - 52, 5); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(dx + 26, y + 35 + v * 12, w / 2 - 52, 1.5); }
        g.fillStyle = '#f0ece0'; g.fillRect(dx + w / 4 - 22, y + 110, 44, 16);
        g.fillStyle = '#c8ccd0'; K.rr(g, d ? dx + 16 : dx + w / 2 - 28, y + h * 0.45, 12, 44, 4); g.fill();
      }
      if (q.model > 0) K.text(g, '真壁', x + w * 0.75, y + 118, 11, '#2a2a30');
      if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 4, y, 10, h); }
      void b;
    })();
    // ---- 衣钩：警服大衣与警帽（锚点 1360-1520, 256-640）----
    (function coatHook() {
      var bx = 1366, by = 286;
      g.fillStyle = K.lin(g, 0, by, 0, by + 26, ['#7a5a3a', '#4a3420']); g.fillRect(bx, by, 150, 26);
      for (var k = 0; k < 3; k++) { var hx = bx + 26 + k * 50; g.fillStyle = brassGrad(g, hx - 5, 0, hx + 5, 0); g.fillRect(hx - 3, by + 18, 6, 22); g.beginPath(); g.arc(hx, by + 40, 6, 0, PI); g.strokeStyle = '#b08a44'; g.lineWidth = 3; g.stroke(); }
      // 大衣
      var cx = 1430, top = by + 36;
      g.beginPath(); g.moveTo(cx - 16, top); g.bezierCurveTo(cx - 60, top + 14, cx - 70, top + 60, cx - 66, top + 120);
      g.lineTo(cx - 74, top + 330); g.quadraticCurveTo(cx - 6, top + 344, cx + 64, top + 330); g.lineTo(cx + 58, top + 120);
      g.bezierCurveTo(cx + 62, top + 60, cx + 52, top + 14, cx + 16, top); g.closePath();
      g.fillStyle = K.lin(g, cx - 70, 0, cx + 64, 0, ['#2a3040', '#1a1e2a', '#0e1018']); g.fill();
      g.save(); g.clip();
      if (q.tex > 0) { g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'fabric', { c1: '#a0a0a8', c2: '#ffffff', threads: 50, seed: 8 }, 64, 0, 0, 0.6); g.globalCompositeOperation = 'source-over'; }
      for (var f = 0; f < 3; f++) { var fx = cx - 40 + f * 36; g.fillStyle = K.lin(g, fx - 8, 0, fx + 8, 0, ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0)']); g.fillRect(fx - 8, top + 120, 16, 230); }
      g.restore();
      // 衣领、肩章、纽扣
      g.fillStyle = '#141820'; K.poly(g, [cx - 16, top, cx + 16, top, cx + 4, top + 70, cx - 4, top + 70]); g.fill();
      for (var bI = 0; bI < 4; bI++) rivet(g, q, cx + 10, top + 90 + bI * 50, 5);
      g.fillStyle = brassGrad(g, cx - 64, 0, cx - 30, 0); g.fillRect(cx - 62, top + 26, 30, 6); g.fillRect(cx + 26, top + 26, 30, 6);
      // 警帽（挂在第三个钩上）
      var px = bx + 126, py = by + 52;
      K.ellipse(g, px, py + 18, 34, 10); g.fillStyle = '#0e1018'; g.fill();
      K.path(g, 'M-30 16 C-32 -4 -18 -14 0 -14 C18 -14 32 -4 30 16 Z', px, py, 1); g.fillStyle = K.lin(g, px - 30, 0, px + 30, 0, ['#2a3040', '#141820']); g.fill();
      g.fillStyle = brassGrad(g, px - 8, 0, px + 8, 0); g.beginPath(); g.arc(px, py + 2, 7, 0, TAU); g.fill();
      g.fillStyle = '#e0c060'; g.fillRect(px - 28, py + 12, 56, 3);
    })();

    // ---- 铁炉（锚点 176-456, 584-880）：棱角锋利的箱形铸铁炉 + 烟囱 ----
    var stoveFire;
    (function stove() {
      var x = 196, y = 616, w = 240, h = 210, base = 868;
      // 烟囱
      g.fillStyle = K.lin(g, 300, 0, 336, 0, ['#2a2a30', '#6a6a74', '#1a1a1e']); g.fillRect(300, R.top - 6, 36, y - R.top + 10);
      for (i = 0; i < 4; i++) { var jy = R.top + 40 + i * 120; g.fillStyle = '#18181c'; g.fillRect(296, jy, 44, 6); }
      g.fillStyle = '#2a2a30'; g.fillRect(286, R.top - 10, 64, 12);
      if (q.light > 0) K.contact(g, x + w / 2, base + 4, w * 0.7, 16, 0.7);
      // 炉脚
      g.fillStyle = '#18181c'; g.fillRect(x + 14, y + h, 18, base - y - h); g.fillRect(x + w - 32, y + h, 18, base - y - h);
      // 顶面 + 侧面 + 正面
      quad(g, [x, y], [x + w, y], [x + w - 34, y - 26], [x + 22, y - 26]); g.fillStyle = K.lin(g, 0, y - 26, 0, y, ['#3a3a42', '#5a5a64']); g.fill();
      quad(g, [x + w, y], [x + w - 34, y - 26], [x + w - 34, y + h - 30], [x + w, y + h]); g.fillStyle = '#26262c'; g.fill();
      g.fillStyle = K.lin(g, x, y, x + w, y + h, ['#4a4a54', '#2a2a30', '#18181c']); g.fillRect(x, y, w, h);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, 'noise', { c1: '#383838', c2: '#c8c8c8', scale: 16, oct: 4, seed: 37, contrast: 1.3 }, 256, 0, 0, 0.5); g.restore(); }
      // 锋利的棱角：亮边
      g.strokeStyle = 'rgba(220,220,230,0.55)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w - 34, y - 26); g.stroke();
      if (q.light >= 2) { g.fillStyle = 'rgba(255,250,240,0.85)'; g.beginPath(); g.arc(x + w, y, 4, 0, TAU); g.fill(); }
      // 炉门（透火）
      var fx = x + 50, fy = y + 60, fw = 140, fh = 100;
      g.fillStyle = '#0c0606'; g.fillRect(fx, fy, fw, fh);
      g.fillStyle = K.rad(g, fx + fw / 2, fy + fh * 0.8, 4, fw * 0.7, ['#ffd070', '#ff7a20', '#8a2008', '#200604']); g.fillRect(fx + 8, fy + 8, fw - 16, fh - 16);
      if (q.model > 0) { flameShape(g, fx + fw * 0.4, fy + fh - 14, 40, 0.9); flameShape(g, fx + fw * 0.62, fy + fh - 12, 30, 0.8); }
      g.strokeStyle = '#1a1a1e'; g.lineWidth = 5; for (var gI = 1; gI < 5; gI++) { g.beginPath(); g.moveTo(fx + gI * fw / 5, fy); g.lineTo(fx + gI * fw / 5, fy + fh); g.stroke(); }
      g.strokeStyle = ironGrad(g, fx, fy, fx + fw, fy + fh); g.lineWidth = 8; g.strokeRect(fx, fy, fw, fh);
      g.fillStyle = '#6a6a72'; g.fillRect(fx + fw + 6, fy + 36, 16, 26);
      stoveFire = [fx + fw / 2, fy + fh / 2];
      // 上面的铝壶
      if (q.model > 0) {
        var kx = x + 130, ky = y - 20;
        g.fillStyle = K.lin(g, kx - 34, 0, kx + 34, 0, ['#8a8e96', '#e0e4ea', '#6a6e76']); K.path(g, 'M-32 0 C-34 -22 -18 -34 0 -34 C18 -34 34 -22 32 0 Z', kx, ky, 1); g.fill();
        g.strokeStyle = '#3a3a40'; g.lineWidth = 4; g.beginPath(); g.arc(kx, ky - 34, 18, PI, TAU); g.stroke();
        g.strokeStyle = '#6a6e76'; g.lineWidth = 6; g.beginPath(); g.moveTo(kx + 28, ky - 12); g.lineTo(kx + 48, ky - 26); g.stroke();
        if (q.light > 0) { g.strokeStyle = 'rgba(230,235,245,0.3)'; g.lineWidth = 5; g.beginPath(); g.moveTo(kx + 50, ky - 30); g.bezierCurveTo(kx + 60, ky - 60, kx + 44, ky - 80, kx + 56, ky - 110); g.stroke(); }
      }
      // 炉前的铁板
      g.fillStyle = 'rgba(40,40,44,0.7)'; K.poly(g, [x - 20, base + 2, x + w + 20, base + 2, x + w + 40, base + 24, x - 40, base + 24]); g.fill();
    })();
    // ---- 无线电（锚点 488-664, 432-552）：墙上搁板 ----
    (function radio() {
      var x = 498, y = 446, w = 156, h = 90;
      g.fillStyle = K.lin(g, 0, y + h, 0, y + h + 16, ['#7a5a3a', '#4a3420']); g.fillRect(x - 20, y + h, w + 40, 14);
      g.fillStyle = '#3a2a1a'; K.poly(g, [x - 6, y + h + 14, x + 6, y + h + 14, x + 6, y + h + 50]); g.fill(); K.poly(g, [x + w - 6, y + h + 14, x + w + 6, y + h + 14, x + w - 6, y + h + 50]); g.fill();
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.55, 6, 0.6);
      g.fillStyle = K.lin(g, 0, y, 0, y + h, ['#5a6058', '#3a3e38', '#22241f']); K.rr(g, x, y, w, h, 6); g.fill();
      g.fillStyle = '#141614'; K.rr(g, x + 10, y + 12, 70, 36, 3); g.fill();
      g.fillStyle = '#9ad08a'; g.fillRect(x + 14, y + 18, 62, 14); g.fillStyle = 'rgba(20,40,20,0.8)'; g.fillRect(x + 20, y + 22, 30, 6);
      for (var k = 0; k < 3; k++) { var kx = x + 98 + k * 18; g.beginPath(); g.arc(kx, y + 28, 7, 0, TAU); g.fillStyle = K.rad(g, kx - 2, y + 26, 1, 8, ['#d8d8e0', '#4a4a52']); g.fill(); }
      if (q.model > 0) { g.fillStyle = '#1a1a1e'; for (var sI = 0; sI < 12; sI++) g.fillRect(x + 12 + sI * 6, y + 58, 3, 22); }
      // 手持话筒 + 卷线
      g.fillStyle = '#18181c'; K.rr(g, x + w - 40, y + 50, 26, 36, 6); g.fill();
      g.strokeStyle = '#18181c'; g.lineWidth = 2.5; g.beginPath(); for (var c = 0; c < 8; c++) { var cy = y + 86 + c * 5; g.moveTo(x + w - 27, cy); g.arc(x + w - 27, cy + 2.5, 4, -PI / 2, PI * 1.5); } g.stroke();
      // 天线
      g.strokeStyle = '#2a2a30'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w - 10, y); g.lineTo(x + w + 20, y - 70); g.stroke();
    })();
    // ---- 桌子（锚点 760-1272, 600-760）+ 便条本 + 烟灰缸 ----
    (function desk() {
      var x0 = 770, x1 = 1262, topY = 590, fy = 612, legY = 846;
      // 椅背（桌后）
      g.fillStyle = K.lin(g, 0, 470, 0, 590, ['#3a3e46', '#22262c']); K.rr(g, 960, 480, 130, 120, 14); g.fill();
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, legY, 300, 22, 0.6);
      // 桌面（灰色钢桌）
      quad(g, [x0 + 16, topY - 26], [x1 - 16, topY - 26], [x1, topY], [x0, topY]); g.fillStyle = K.lin(g, 0, topY - 26, 0, topY, ['#8a9086', '#a8aea2']); g.fill();
      g.fillStyle = K.lin(g, 0, topY, 0, fy, ['#c8ccc0', '#7a8076']); g.fillRect(x0, topY, x1 - x0, fy - topY);
      // 桌下柜（左侧三屉）与右侧挡板
      g.fillStyle = steelGrad(g, x0 + 10, 0, x0 + 190, 0, '#8e948a'); g.fillRect(x0 + 10, fy, 180, legY - fy);
      for (var d = 0; d < 3; d++) { var dy = fy + 10 + d * 74; g.strokeStyle = 'rgba(30,34,30,0.6)'; g.lineWidth = 2; g.strokeRect(x0 + 20, dy, 160, 64); g.fillStyle = '#c8ccc4'; K.rr(g, x0 + 80, dy + 26, 40, 10, 4); g.fill(); }
      g.fillStyle = '#2a2e2a'; g.fillRect(x0 + 190, fy, x1 - x0 - 200, 46);
      g.fillStyle = steelGrad(g, x1 - 40, 0, x1 - 10, 0, '#7e847a'); g.fillRect(x1 - 40, fy, 30, legY - fy);
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x0, topY, x1 - x0, 2);
      // 桌上：电话、笔筒、文件
      g.fillStyle = '#141416'; K.path(g, 'M-40 0 L40 0 L34 -24 L-34 -24 Z', 1100, topY - 4, 1); g.fill();
      g.fillStyle = '#141416'; K.rr(g, 1064, topY - 44, 72, 20, 8); g.fill();
      if (q.model > 0) {
        g.fillStyle = '#e8e4d8'; K.poly(g, [990, topY - 6, 1060, topY - 8, 1064, topY - 2, 994, topY]); g.fill();
        g.fillStyle = '#3a4a6a'; K.rr(g, 900, topY - 44, 26, 40, 3); g.fill(); g.strokeStyle = '#c8a040'; g.lineWidth = 2; g.beginPath(); g.moveTo(906, topY - 44); g.lineTo(902, topY - 64); g.moveTo(916, topY - 44); g.lineTo(922, topY - 60); g.stroke();
      }
      // 便条本（锚点 824-960, 560-600）+ 铅笔
      g.fillStyle = 'rgba(0,0,0,0.3)'; K.poly(g, [834, topY - 4, 948, topY - 6, 954, topY + 2, 838, topY + 4]); g.fill();
      K.poly(g, [830, topY - 18, 944, topY - 20, 950, topY - 4, 834, topY - 2]); g.fillStyle = '#f4f0e0'; g.fill();
      g.strokeStyle = 'rgba(120,140,180,0.6)'; g.lineWidth = 1; for (var l = 0; l < 3; l++) { g.beginPath(); g.moveTo(836, topY - 14 + l * 4); g.lineTo(946, topY - 16 + l * 4); g.stroke(); }
      g.fillStyle = '#3a3a40'; g.fillRect(832, topY - 20, 114, 3);
      g.strokeStyle = '#d8a030'; g.lineWidth = 4; g.beginPath(); g.moveTo(864, topY - 26); g.lineTo(930, topY - 30); g.stroke();
      // 烟灰缸（锚点 1152-1240, 560-600）：给访客用的玻璃烟灰缸
      K.ellipse(g, 1196, topY - 8, 34, 10); g.fillStyle = 'rgba(160,190,200,0.55)'; g.fill(); g.strokeStyle = 'rgba(230,245,255,0.8)'; g.lineWidth = 2; g.stroke();
      K.ellipse(g, 1196, topY - 10, 22, 6); g.fillStyle = 'rgba(90,110,120,0.6)'; g.fill();
      if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.7)'; K.ellipse(g, 1180, topY - 14, 6, 2, -0.2); g.fill(); }
    })();

    // ================= 光照 =================
    var L = lightMap(q, '#7a7884');
    lmLight(L, 960, 60, 1100, '#eef2ff', 0.65, 0.8);                 // 日光灯
    lmLight(L, 1040, 320, 560, '#c8d4ec', 0.45, 0.9);                // 窗
    lmLight(L, stoveFire[0], stoveFire[1] + 40, 420, '#ffa860', q.light > 0 ? 0.6 : 0.45, 0.7);
    if (q.light > 0) {
      lmLight(L, 1000, 880, 520, '#c8d0e0', 0.25, 0.4);
      lmDark(L, 0.2, function (x) { x.beginPath(); x.rect(0, 0, 40, H); x.rect(W - 40, 0, 40, H); });
      lmShade(L, 0.55, function (x) { x.beginPath(); x.rect(960, 620, 290, 220); });
    }
    if (q.light >= 2) {
      lmShade(L, 0.35, function (x) { K.poly(x, [1586, 290, 1826, 290, 1900, 880, 1640, 880]); });
      lmShade(L, 0.3, function (x) { K.poly(x, [1370, 330, 1500, 330, 1540, 700, 1360, 700]); });
    }
    applyLM(g, L);
    if (q.light > 0) {
      K.glow(g, 960, 26, 260, '#e8f0ff', 0.25);
      K.glow(g, stoveFire[0], stoveFire[1], 160, '#ff8a3a', 0.35);
    }
    if (q.light >= 2) {
      softShaft(g, [830, 200, 1250, 200, 1330, 900, 760, 900], '#d0dcf4', 0.08, 1040, 220, 1040, 900, 5);
      dust(g, K.rng(31), byM(q, 10, 18, 26), 820, 220, 440, 500, '#e8f0ff', 0.4);
    }
    finish(g, q, q.light > 0 ? 0.45 : 0.32, 0.5);
  }
  DM.HDBG.def('police_box', {
    draw: drawPoliceBox,
    lights: [
      { x: 960, y: 30, r: 300, color: '#eef2ff', i: 0.45, flicker: 0.02, kind: 'lamp' },
      { x: 316, y: 726, r: 170, color: '#ff8a3a', i: 0.6, flicker: 0.4, kind: 'fire' },
      { x: 1040, y: 310, r: 240, color: '#c8d4ec', i: 0.3, flicker: 0, kind: 'window' }
    ],
    key: { x: 0.1, color: '#eef0f6', amb: '#3a3a48', rim: 0.45 },
    outdoor: false
  });
})(typeof window !== 'undefined' ? window : globalThis);
