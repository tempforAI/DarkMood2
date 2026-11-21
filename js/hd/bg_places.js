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

  /* =================================================================
   * 杂货店兼邮局 store
   * ================================================================= */
  // 货架上的一排商品（x..x+w，底边 y）
  function goodsRow(g, q, x, y, w, maxH, rnd) {
    var cols = ['#c83030', '#e8c040', '#2a6ab0', '#f0f0e8', '#3a8a4a', '#e07020', '#7a3a8a', '#d8d0b8', '#1a4a8a', '#b8a060'];
    var xx = x;
    while (xx < x + w - 10) {
      var kind = rnd(), c = rnd.pick(cols), iw, ih;
      if (kind < 0.35) { // 杯面
        iw = 26 + rnd() * 6; ih = Math.min(maxH, 30 + rnd() * 8);
        g.fillStyle = K.lin(g, xx, 0, xx + iw, 0, [K.shade(c, 0.2), c, K.shade(c, -0.35)]); K.poly(g, [xx, y - ih, xx + iw, y - ih, xx + iw - 3, y, xx + 3, y]); g.fill();
        g.fillStyle = '#f4f0e8'; g.fillRect(xx, y - ih, iw, 5);
      } else if (kind < 0.6) { // 罐头
        iw = 20 + rnd() * 6; ih = Math.min(maxH, 24 + rnd() * 10);
        g.fillStyle = K.lin(g, xx, 0, xx + iw, 0, ['#8a8e94', '#e0e4ea', '#6a6e74']); g.fillRect(xx, y - ih, iw, ih);
        g.fillStyle = K.lin(g, xx, 0, xx + iw, 0, [K.shade(c, 0.15), c, K.shade(c, -0.4)]); g.fillRect(xx, y - ih + 4, iw, ih - 8);
      } else if (kind < 0.8) { // 纸盒
        iw = 24 + rnd() * 22; ih = Math.min(maxH, 36 + rnd() * 26);
        g.fillStyle = K.lin(g, xx, 0, xx + iw, 0, [K.shade(c, 0.15), c, K.shade(c, -0.4)]); g.fillRect(xx, y - ih, iw, ih);
        if (q.model > 0) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(xx + 3, y - ih * 0.7, iw - 6, ih * 0.18); }
      } else { // 瓶子
        iw = 16 + rnd() * 6; ih = Math.min(maxH, 46 + rnd() * 14);
        g.fillStyle = K.lin(g, xx, 0, xx + iw, 0, [K.shade(c, 0.1), c, K.shade(c, -0.45)]);
        K.poly(g, [xx, y, xx, y - ih * 0.6, xx + iw * 0.3, y - ih * 0.75, xx + iw * 0.3, y - ih, xx + iw * 0.7, y - ih, xx + iw * 0.7, y - ih * 0.75, xx + iw, y - ih * 0.6, xx + iw, y]); g.fill();
        if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(xx + 3, y - ih * 0.55, 2.5, ih * 0.45); }
      }
      xx += iw + 2 + rnd() * 3;
    }
  }
  function gondola(g, q, x, y, w, h, rnd) {
    var bot = y + h;
    if (q.light > 0) K.contact(g, x + w / 2, bot, w * 0.55, 12, 0.6);
    g.fillStyle = '#d8dcd8'; g.fillRect(x, y, w, h);
    g.fillStyle = '#9a9e9a'; g.fillRect(x, y, 10, h); g.fillRect(x + w - 10, y, 10, h);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 10, y, w - 20, h);
    var ns = 5, sh = (h - 40) / ns;
    for (var s = 0; s < ns; s++) {
      var sy = y + 20 + (s + 1) * sh;
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 10, sy - sh, w - 20, 16);
      goodsRow(g, q, x + 14, sy - 6, w - 28, sh - 20, rnd);
      g.fillStyle = K.lin(g, 0, sy - 8, 0, sy + 6, ['#f4f4f0', '#a8aca8']); g.fillRect(x + 6, sy - 8, w - 12, 12);
      if (q.model > 0) { g.fillStyle = '#ffffff'; for (var p = 0; p < 3; p++) g.fillRect(x + 30 + p * (w - 70) / 2, sy - 6, 22, 8); g.fillStyle = '#c02020'; for (var p2 = 0; p2 < 3; p2++) g.fillRect(x + 32 + p2 * (w - 70) / 2, sy - 4, 10, 4); }
    }
    g.fillStyle = '#8a8e8a'; g.fillRect(x, bot - 22, w, 22);
  }

  var RST = Room({ hy: 440, top: 100, bot: 790 });
  function drawStore(g, q) {
    var R = RST, rnd = K.rng(7301), i;
    ceiling(g, q, R, { base: '#a89a84', wood: true, line: 'rgba(30,20,10,0.4)' });
    backWall(g, q, R, { base: '#c4b8a0', tex: ['plaster', { c1: '#b0a48c', c2: '#d0c6ae', seed: 43, stain: 0.6 }, 256], skirt: '#5a4a3a' });
    tileFloor(g, q, R, { base: '#7a7670', seed: 9 });
    fluoLamp(g, q, 560, 6, 300); fluoLamp(g, q, 1240, 6, 300);
    // 墙上：「たばこ」招牌、挂钟、挂历、海报
    (function signs() {
      g.fillStyle = 'rgba(0,0,0,0.35)'; K.rr(g, 664, 236, 236, 70, 6); g.fill();
      g.fillStyle = K.lin(g, 0, 228, 0, 296, ['#d83030', '#a01818']); K.rr(g, 656, 228, 236, 68, 6); g.fill();
      g.strokeStyle = '#f4e8d0'; g.lineWidth = 3; K.rr(g, 664, 236, 220, 52, 4); g.stroke();
      K.text(g, 'たばこ', 774, 263, 36, '#f8f0e0', { weight: 'bold' });
      wallClock(g, q, 1100, 230, 40, 17, 5);
      calendar(g, q, 1150, 180, 80, 108);
      if (q.model > 0) paperSheet(g, q, 560, 220, 76, 104, 0.03, function (x, y, w, h) { g.fillStyle = '#2a6ab0'; g.fillRect(x + 6, y + 6, w - 12, 44); K.text(g, '灯油', x + w / 2, y + 28, 16, '#fff', { weight: 'bold' }); textLines(g, x + 8, y + 60, w - 16, 4, 9); }, '#f4f0e4');
    })();
    // ---- 货架（锚点 64-544, 200-720）----
    gondola(g, q, 70, 214, 226, R.bot - 214 + 6, rnd);
    gondola(g, q, 310, 214, 226, R.bot - 214 + 6, rnd);
    // ---- 香烟柜（锚点 640-920, 368-528）----
    (function cigs() {
      var x = 648, y = 372, w = 264, h = 150;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 8, y + 8, w, h);
      g.fillStyle = K.lin(g, 0, y, 0, y + h, ['#6a4a30', '#3a2414']); g.fillRect(x - 8, y - 8, w + 16, h + 16);
      g.fillStyle = '#1e1610'; g.fillRect(x, y, w, h);
      var brands = [['#1e2a5a', '#ffffff', 1], ['#f4f4f0', '#2a5ab0', 0], ['#2a4a8a', '#e8c040', 0], ['#f4f0e8', '#c02020', 0], ['#c8c8c0', '#3a3a3a', 0], ['#1a3a2a', '#e8e0c0', 0], ['#e0e8f0', '#1e3a7a', 0]];
      var rows = 3, perRow = 9, pw = 24, ph = 36;
      for (var r = 0; r < rows; r++) for (var c = 0; c < perRow; c++) {
        var b = brands[(c + r * 2) % brands.length], px = x + 10 + c * 28, py = y + 10 + r * 46;
        g.fillStyle = K.lin(g, px, 0, px + pw, 0, [K.shade(b[0], 0.15), b[0], K.shade(b[0], -0.3)]); g.fillRect(px, py, pw, ph);
        g.fillStyle = b[1]; g.fillRect(px + 3, py + ph * 0.38, pw - 6, ph * 0.18);
        if (b[2] && q.model > 0) { g.fillStyle = '#e8e8f0'; K.poly(g, [px + pw / 2, py + 4, px + pw / 2 + 3, py + 10, px + pw / 2 + 9, py + 10, px + pw / 2 + 4, py + 14, px + pw / 2 + 6, py + 20, px + pw / 2, py + 16, px + pw / 2 - 6, py + 20, px + pw / 2 - 4, py + 14, px + pw / 2 - 9, py + 10, px + pw / 2 - 3, py + 10]); g.fill(); }
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(px, py + ph - 3, pw, 3);
      }
      // 玻璃门
      if (q.light > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(220,230,250,0.12)'; K.poly(g, [x + 30, y, x + 80, y, x + 20, y + h, x - 30, y + h]); g.fill(); g.restore(); }
      g.strokeStyle = '#b8bcc0'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
    })();
    // ---- 邮局窗口（锚点 976-1216, 384-544）----
    (function post() {
      var x = 970, y = 330, w = 256, h = 270;
      g.beginPath(); g.rect(x, y, w, h); woodFill(g, q, '#6a4a30', false, x, y, ['#8a6040', 0.2]);
      g.fillStyle = K.lin(g, x, 0, x + w, 0, ['rgba(255,230,200,0.1)', 'rgba(0,0,0,0.3)']); g.fillRect(x, y, w, h);
      // 标牌：〒 郵便
      g.fillStyle = '#c81e28'; K.rr(g, x + 40, y + 10, w - 80, 40, 4); g.fill();
      K.text(g, '〒 郵便', x + w / 2, y + 31, 24, '#ffffff', { weight: 'bold' });
      // 玻璃窗口 + 小拱形收发口
      var gx = x + 22, gy = y + 60, gw = w - 44, gh = 150;
      g.fillStyle = '#3a4048'; g.fillRect(gx, gy, gw, gh);
      g.fillStyle = 'rgba(200,220,235,0.5)'; g.fillRect(gx, gy, gw, gh);
      // 窗内：秤、邮票册、分拣格
      g.fillStyle = 'rgba(80,60,40,0.7)'; for (var c = 0; c < 5; c++) for (var r = 0; r < 2; r++) g.strokeRect ? (g.strokeStyle = 'rgba(70,50,30,0.8)', g.lineWidth = 2, g.strokeRect(gx + 14 + c * 40, gy + 12 + r * 30, 36, 26)) : 0;
      if (q.model > 0) { g.fillStyle = 'rgba(240,240,250,0.8)'; for (var l = 0; l < 6; l++) g.fillRect(gx + 18 + (l % 5) * 40, gy + 20 + Math.floor(l / 5) * 30, 26, 14); }
      g.fillStyle = 'rgba(160,30,40,0.8)'; g.fillRect(gx + 30, gy + 100, 50, 30);
      g.fillStyle = '#8a8e94'; g.fillRect(gx + 120, gy + 112, 60, 18); K.ellipse(g, gx + 150, gy + 108, 30, 6); g.fill();
      if (q.light > 0) { g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(220,235,250,0.15)'; K.poly(g, [gx + 20, gy, gx + 60, gy, gx, gy + 80]); g.fill(); g.restore(); }
      g.strokeStyle = '#3a2414'; g.lineWidth = 8; g.strokeRect(gx, gy, gw, gh);
      g.fillStyle = '#1a120c'; g.beginPath(); g.moveTo(gx + gw / 2 - 40, gy + gh); g.lineTo(gx + gw / 2 - 40, gy + gh - 26); g.quadraticCurveTo(gx + gw / 2, gy + gh - 52, gx + gw / 2 + 40, gy + gh - 26); g.lineTo(gx + gw / 2 + 40, gy + gh); g.closePath(); g.fill();
    })();
    // ---- 柜台（锚点 600-1240, 592-768）----
    (function counter() {
      var x0 = 606, x1 = 1234, topY = 600, legY = R.bot + 30;
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, legY, 340, 20, 0.6);
      quad(g, [x0 + 14, topY - 22], [x1 - 14, topY - 22], [x1, topY], [x0, topY]); woodFill(g, q, '#7a5636', true, x0, topY, ['#9a6a40', 0.12]);
      quad(g, [x0 + 14, topY - 22], [x1 - 14, topY - 22], [x1, topY], [x0, topY]); g.fillStyle = 'rgba(255,230,200,0.08)'; g.fill();
      g.fillStyle = K.lin(g, 0, topY, 0, topY + 16, ['#9a6e48', '#4a2c18']); g.fillRect(x0, topY, x1 - x0, 16);
      // 玻璃展示柜正面
      var sy = topY + 16;
      g.fillStyle = '#2a2420'; g.fillRect(x0 + 6, sy, x1 - x0 - 12, legY - sy);
      g.fillStyle = 'rgba(190,210,225,0.25)'; g.fillRect(x0 + 16, sy + 10, x1 - x0 - 32, 100);
      // 展示柜里的点心 / 糖果
      var gr = K.rng(77);
      for (var k = 0; k < byM(q, 8, 16, 24); k++) { var gx = x0 + 26 + gr() * (x1 - x0 - 60), gw = 20 + gr() * 24; g.fillStyle = gr.pick(['#e8c040', '#d84040', '#f0e8d0', '#4a8ad0', '#e08030']); g.fillRect(gx, sy + 70 + gr() * 20, gw, 18 + gr() * 12); }
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x0 + 16, sy + 10, x1 - x0 - 32, 3);
      g.beginPath(); g.rect(x0 + 6, sy + 116, x1 - x0 - 12, legY - sy - 116); woodFill(g, q, '#5a3a22', true, x0, sy, ['#3a2010', 0.2]);
      // 收银机
      var cx = 680, cy = topY - 20;
      g.fillStyle = K.lin(g, cx - 50, 0, cx + 50, 0, ['#4a4a50', '#8a8e94', '#3a3a40']); K.poly(g, [cx - 52, cy, cx + 52, cy, cx + 44, cy - 60, cx - 44, cy - 60]); g.fill();
      g.fillStyle = '#1a1a1e'; g.fillRect(cx - 30, cy - 92, 60, 34); g.fillStyle = '#7ad07a'; g.fillRect(cx - 24, cy - 84, 48, 14);
      if (q.model > 0) { g.fillStyle = '#e8e8e0'; for (var b = 0; b < 12; b++) g.fillRect(cx - 38 + (b % 6) * 13, cy - 50 + Math.floor(b / 6) * 14, 9, 9); }
      // 秤 + 一条香烟 + 报纸
      g.fillStyle = '#c8ccd0'; g.fillRect(1100, topY - 30, 70, 14); K.ellipse(g, 1135, topY - 34, 40, 6); g.fill();
      g.fillStyle = '#1e2a5a'; g.fillRect(960, topY - 18, 90, 14); g.fillStyle = '#fff'; g.fillRect(970, topY - 14, 70, 4);
      if (q.model > 0) { g.fillStyle = '#e8e4d8'; K.poly(g, [800, topY - 6, 900, topY - 10, 906, topY - 2, 806, topY]); g.fill(); textLines(g, 812, topY - 8, 80, 2, 3, 'rgba(40,40,40,0.4)'); }
    })();
    // ---- 店面玻璃（锚点 1264-1624, 144-528）：正对马路对面的驻在所 ----
    var wx = 1270, wy = 150, ww = 360, wh = 372;
    g.fillStyle = '#c8ccd0'; g.fillRect(wx - 12, wy - 12, ww + 24, wh + 24);
    snowView(g, q, wx, wy, ww, wh, { seed: 13, ground: 0.7, bldg: function (x, y, w, h, gy) {
      // 驻在所：白墙小屋、红色门灯、亮着的窗
      var bx = x + w * 0.14, bw = w * 0.62, by = gy - h * 0.34;
      g.fillStyle = '#d8d8d0'; g.fillRect(bx, by, bw, gy - by);
      g.fillStyle = '#2a2e36'; K.poly(g, [bx - 14, by + 4, bx + bw + 14, by + 4, bx + bw - 6, by - 24, bx + 6, by - 24]); g.fill();
      g.fillStyle = '#eef2f8'; K.poly(g, [bx - 16, by + 4, bx + bw + 16, by + 4, bx + bw + 6, by - 4, bx - 6, by - 4]); g.fill();
      g.fillStyle = '#eef2f8'; K.poly(g, [bx + 6, by - 24, bx + bw - 6, by - 24, bx + bw - 14, by - 34, bx + 14, by - 34]); g.fill();
      g.fillStyle = '#ffe0a0'; g.fillRect(bx + 14, by + 18, bw * 0.4, (gy - by) * 0.42);
      g.strokeStyle = '#6a6a70'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx + 14 + bw * 0.2, by + 18); g.lineTo(bx + 14 + bw * 0.2, by + 18 + (gy - by) * 0.42); g.stroke();
      g.fillStyle = '#5a5a60'; g.fillRect(bx + bw * 0.62, by + 14, bw * 0.24, gy - by - 14);
      g.fillStyle = '#ffffff'; g.fillRect(bx + bw * 0.6, by + 2, bw * 0.3, 10); K.text(g, '駐在所', bx + bw * 0.75, by + 7, 8, '#1a1a1a', { weight: 'bold' });
      g.beginPath(); g.arc(bx + bw * 0.56, by + 22, 6, 0, TAU); g.fillStyle = '#ff3020'; g.fill();
      if (q.light > 0) K.glow(g, bx + bw * 0.56, by + 22, 26, '#ff4020', 0.5, 'source-over');
      g.fillStyle = 'rgba(255,255,255,0.9)'; K.ellipse(g, bx + bw / 2, gy, bw * 0.7, 6); g.fill();
    } });
    windowFrame(g, q, wx, wy, ww, wh, { frame: '#a8acb0', cols: 2, rows: 2, fw: 10 });
    // 玻璃上反写的店名
    if (q.model > 0) { g.save(); g.translate(wx + ww / 2, wy + wh * 0.82); g.scale(-1, 1); K.text(g, '阿部商店', 0, 0, 34, 'rgba(240,240,250,0.35)', { weight: 'bold' }); g.restore(); }
    // ---- 入口玻璃门外：屋檐下的灰色插卡电话（锚点 1656-1816, 416-704）----
    (function entrance() {
      var x = 1650, y = 150, w = 260, h = R.bot - 150;
      snowView(g, q, x, y, w, h, { seed: 19, ground: 0.78 });
      // 屋檐与冰柱
      g.fillStyle = '#3a3026'; g.fillRect(x, y, w, 70);
      g.fillStyle = '#eef2f8'; g.fillRect(x, y + 60, w, 12);
      if (q.model > 0) { g.fillStyle = 'rgba(220,235,250,0.9)'; for (var ic = 0; ic < 9; ic++) { var ix = x + 14 + ic * 28, il = 14 + (ic * 17 % 30); K.poly(g, [ix - 4, y + 70, ix + 4, y + 70, ix, y + 70 + il]); g.fill(); } }
      // 柱子 + 灰色电话（带小顶棚）
      g.fillStyle = K.lin(g, x + 150, 0, x + 186, 0, ['#5a4632', '#3a2a1c']); g.fillRect(x + 150, y + 70, 36, h - 70);
      var px = x + 60, py = 420;
      if (q.light > 0) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(px + 6, py + 6, 96, 168); }
      g.fillStyle = '#8a9096'; K.rr(g, px - 10, py - 18, 120, 24, 4); g.fill();
      g.fillStyle = K.lin(g, px, 0, px + 100, 0, ['#c4c8cc', '#9ea2a8', '#6a6e74']); K.rr(g, px, py, 100, 170, 8); g.fill();
      g.fillStyle = '#2a2e32'; g.fillRect(px + 14, py + 18, 72, 22); g.fillStyle = '#7ab07a'; g.fillRect(px + 18, py + 22, 40, 12);
      g.fillStyle = '#e8e8e8'; for (var kb = 0; kb < 12; kb++) g.fillRect(px + 20 + (kb % 3) * 22, py + 56 + Math.floor(kb / 3) * 18, 16, 12);
      g.fillStyle = '#1a1a1e'; g.fillRect(px + 70, py + 56, 22, 4);
      g.fillStyle = K.lin(g, px - 20, 0, px, 0, ['#6a6e74', '#b8bcc0']); K.rr(g, px - 22, py + 26, 24, 100, 10); g.fill();
      g.strokeStyle = '#3a3a40'; g.lineWidth = 3; g.beginPath(); g.moveTo(px - 10, py + 126); g.quadraticCurveTo(px - 16, py + 160, px + 10, py + 168); g.stroke();
      g.fillStyle = '#5a5e64'; g.fillRect(px + 30, py + 170, 40, h - (py + 170 - y) - 20);
      // 玻璃门框
      windowFrame(g, q, x, y, w, h, { frame: '#a8acb0', cols: 1, rows: 3, fw: 12 });
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x - 10, y, 12, h);
    })();
    // 石油炉（货架与柜台之间）
    var stove = keroStove(g, q, 560, 900, 1.05);

    // ================= 光照 =================
    var L = lightMap(q, '#7c7880');
    lmLight(L, 560, 60, 760, '#f0f4ff', 0.55, 0.8); lmLight(L, 1240, 60, 760, '#f0f4ff', 0.55, 0.8);
    lmLight(L, 1450, 330, 600, '#d0dcf0', 0.5, 0.9);
    lmLight(L, stove[0], stove[1], 380, '#ffa860', q.light > 0 ? 0.55 : 0.4, 0.7);
    if (q.light > 0) {
      lmLight(L, 1460, 880, 520, '#c8d4ec', 0.3, 0.35);
      lmDark(L, 0.2, function (x) { x.beginPath(); x.rect(0, 0, 40, H); });
      lmShade(L, 0.45, function (x) { x.beginPath(); x.rect(612, 760, 620, 80); });
    }
    if (q.light >= 2) lmShade(L, 0.3, function (x) { K.poly(x, [70, 800, 540, 800, 600, 900, 40, 900]); });
    applyLM(g, L);
    if (q.light > 0) { K.glow(g, 560, 24, 220, '#e8f0ff', 0.22); K.glow(g, 1240, 24, 220, '#e8f0ff', 0.22); K.glow(g, stove[0], stove[1], 120, '#ff8a3a', 0.35); }
    if (q.light >= 2) {
      softShaft(g, [1280, 170, 1620, 170, 1560, 920, 1000, 920], '#d8e4fa', 0.09, 1450, 200, 1300, 920, 5);
      dust(g, K.rng(41), byM(q, 8, 16, 24), 1100, 240, 480, 560, '#eef4ff', 0.4);
    }
    finish(g, q, q.light > 0 ? 0.42 : 0.3, 0.5);
  }
  DM.HDBG.def('store', {
    draw: drawStore,
    lights: [
      { x: 560, y: 24, r: 240, color: '#eef2ff', i: 0.4, flicker: 0.02, kind: 'lamp' },
      { x: 1240, y: 24, r: 240, color: '#eef2ff', i: 0.4, flicker: 0.02, kind: 'lamp' },
      { x: 560, y: 830, r: 140, color: '#ff8a3a', i: 0.5, flicker: 0.2, kind: 'fire' },
      { x: 1450, y: 330, r: 260, color: '#d0dcf0', i: 0.3, flicker: 0, kind: 'window' }
    ],
    key: { x: 0.35, color: '#e8ecf6', amb: '#3a3844', rim: 0.5 },
    outdoor: false
  });

  /* =================================================================
   * 公民馆·防灾广播室 community_hall
   * ================================================================= */
  var RCH = Room({ hy: 440, top: 104, bot: 800 });
  function drawCommunityHall(g, q) {
    var R = RCH, i;
    ceiling(g, q, R, { base: '#d8d4c8', line: 'rgba(80,80,70,0.3)', cross: true });
    // 有孔吸音板墙
    backWall(g, q, R, { base: '#d0c8b4', tex: ['plaster', { c1: '#c4bca8', c2: '#dcd4c0', seed: 47, stain: 0.3 }, 256], wain: 640, wainColor: '#7a6a58', wainStep: 200, skirt: '#4a4038' });
    if (q.model > 0) {
      g.fillStyle = 'rgba(60,50,40,0.35)';
      var step = q.model >= 2 ? 22 : 30;
      for (var yy = R.top + 20; yy < 620; yy += step) for (var xx = 10 + ((yy / step) % 2) * step / 2; xx < W; xx += step) { g.fillRect(xx, yy, 2.6, 2.6); }
      g.strokeStyle = 'rgba(80,70,60,0.35)'; g.lineWidth = 2; for (var px = 0; px < W; px += 300) { g.beginPath(); g.moveTo(px, R.top); g.lineTo(px, 628); g.stroke(); }
    }
    tileFloor(g, q, R, { base: '#8a8478', tiles: true, cols: 18, rows: 6, check: 'rgba(40,50,70,0.12)', joint: 'rgba(40,40,40,0.3)', seed: 11 });
    fluoLamp(g, q, 960, 8, 400);
    // 墙上：挂钟（广播的基准）、广播时刻表、挂历
    wallClock(g, q, 1016, 230, 52, 12, 0);
    paperSheet(g, q, 1150, 176, 150, 120, 0.01, function (x, y, w, h) {
      K.text(g, '定時放送', x + w / 2, y + 18, 16, '#1a1a1a', { weight: 'bold' });
      K.text(g, '12:00', x + w / 2, y + 50, 22, '#1a3a8a', { weight: 'bold', font: 'Arial,sans-serif' });
      K.text(g, '17:00', x + w / 2, y + 82, 22, '#1a3a8a', { weight: 'bold', font: 'Arial,sans-serif' });
      g.fillStyle = 'rgba(40,40,50,0.4)'; g.fillRect(x + 14, y + 100, w - 28, 3);
    }, '#f4f2ea');
    calendar(g, q, 740, 200, 88, 116);

    // ---- 门（锚点 64-288, 280-808）：钢门 + 铁丝网玻璃 + 门牌 ----
    door(g, q, 78, 300, 196, R.bot - 300, { steel: '#8a948a', glass: 0.2, glassColor: '#9aa8b0', frame: '#5a6058', knobLeft: false });
    if (q.model > 0) { g.strokeStyle = 'rgba(40,40,40,0.45)'; g.lineWidth = 1; for (var m = 0; m < 8; m++) { g.beginPath(); g.moveTo(110 + m * 17, 324); g.lineTo(110 + m * 17, 324 + 100); g.stroke(); } }
    g.fillStyle = '#f0ece0'; g.fillRect(118, 252, 116, 30); g.strokeStyle = '#3a3a40'; g.lineWidth = 2; g.strokeRect(118, 252, 116, 30); K.text(g, '放送室', 176, 268, 18, '#1a1a1a', { weight: 'bold' });
    // ---- 钥匙盒（锚点 344-504, 304-464）----
    (function keyBox() {
      var x = 352, y = 312, w = 144, h = 144;
      if (q.light > 0) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 6, y + 8, w, h); }
      g.fillStyle = steelGrad(g, x, y, x + w, y + h, '#9aa09a'); K.rr(g, x, y, w, h, 4); g.fill();
      g.fillStyle = '#e8e4d8'; g.fillRect(x + 10, y + 10, w - 20, h - 20);
      for (var k = 0; k < 6; k++) {
        var kx = x + 30 + (k % 3) * 42, ky = y + 30 + Math.floor(k / 3) * 56;
        rivet(g, q, kx, ky, 3.5);
        if (k === 1 || k === 4) continue; // 空钩
        g.strokeStyle = '#b08a44'; g.lineWidth = 2; g.beginPath(); g.arc(kx, ky + 8, 5, 0, TAU); g.stroke();
        g.fillStyle = brassGrad(g, kx - 4, 0, kx + 4, 0); g.fillRect(kx - 2.5, ky + 12, 5, 18); g.fillRect(kx, ky + 22, 6, 3); g.fillRect(kx, ky + 27, 5, 3);
        g.fillStyle = k % 2 ? '#d84040' : '#4070c0'; K.rr(g, kx + 6, ky + 4, 14, 22, 2); g.fill();
      }
      // 玻璃门
      if (q.light > 0) { g.fillStyle = 'rgba(220,235,250,0.18)'; K.poly(g, [x + 14, y + 10, x + 50, y + 10, x + 14, y + 70]); g.fill(); }
      g.strokeStyle = '#6a706a'; g.lineWidth = 4; g.strokeRect(x + 8, y + 8, w - 16, h - 16);
      g.fillStyle = '#c8c8c0'; g.fillRect(x + w - 18, y + h / 2 - 10, 8, 20);
    })();
    // ---- 祭典器材柜（锚点 352-656, 544-888）----
    (function cabinet() {
      var x = 366, y = 556, w = 278, h = R.bot + 70 - 556;
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.6, 14, 0.6);
      box(g, q, x, y, w, h, 50, { front: '#8a908a', side: '#5a605a', top: '#a8aea8' });
      g.fillStyle = steelGrad(g, x, 0, x + w, 0, '#8e948c'); g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(30,34,30,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + w / 2, y + 8); g.lineTo(x + w / 2, y + h - 8); g.stroke();
      g.strokeStyle = 'rgba(30,34,30,0.45)'; g.lineWidth = 2; g.strokeRect(x + 10, y + 10, w / 2 - 16, h - 20); g.strokeRect(x + w / 2 + 6, y + 10, w / 2 - 16, h - 20);
      g.fillStyle = '#d0d4cc'; K.rr(g, x + w / 2 - 22, y + h * 0.4, 8, 40, 3); g.fill(); K.rr(g, x + w / 2 + 14, y + h * 0.4, 8, 40, 3); g.fill();
      g.fillStyle = '#f4f0e4'; g.fillRect(x + 30, y + 30, 90, 26); K.text(g, '祭典用具', x + 75, y + 43, 14, '#1a1a1a', { weight: 'bold' });
      if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 4, y, 8, h); }
    })();
    // ---- 播音台（锚点 736-1296, 496-720）+ 话筒 + 记录簿 ----
    (function console_() {
      var x0 = 744, x1 = 1290, deskY = 724, frontY = 800, legY = R.bot + 70;
      // 椅子（桌前偏右）
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, legY, 300, 22, 0.6);
      // 桌面
      quad(g, [x0 + 10, deskY], [x1 - 10, deskY], [x1 + 20, frontY], [x0 - 20, frontY]); g.fillStyle = K.lin(g, 0, deskY, 0, frontY, ['#8a8270', '#b8b0a0']); g.fill();
      g.fillStyle = K.lin(g, 0, frontY, 0, frontY + 18, ['#c8c0ae', '#6a6458']); g.fillRect(x0 - 20, frontY, x1 - x0 + 40, 18);
      g.fillStyle = '#5a5448'; g.fillRect(x0 - 10, frontY + 18, 30, legY - frontY - 18); g.fillRect(x1 - 20, frontY + 18, 30, legY - frontY - 18);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x0 + 20, frontY + 18, x1 - x0 - 40, 30);
      // 控制台：斜面面板
      var py0 = 512, py1 = 690;
      quad(g, [x0 + 20, py0], [x1 - 20, py0], [x1, py1], [x0, py1]); g.fillStyle = K.lin(g, 0, py0, 0, py1, ['#c8c0a8', '#a8a088']); g.fill();
      g.fillStyle = K.lin(g, 0, py1, 0, deskY, ['#9a927c', '#6a6454']); g.fillRect(x0, py1, x1 - x0, deskY - py1);
      g.fillStyle = '#7a7462'; g.fillRect(x0 + 20, py0 - 16, x1 - x0 - 40, 16);
      // 两个 VU 表
      for (var v = 0; v < 2; v++) {
        var vx = x0 + 80 + v * 110, vy = py0 + 22;
        g.fillStyle = '#1a1a1e'; K.rr(g, vx - 4, vy - 4, 92, 54, 4); g.fill();
        g.fillStyle = K.lin(g, 0, vy, 0, vy + 46, ['#fff4c8', '#e8d090']); g.fillRect(vx, vy, 84, 46);
        g.strokeStyle = '#2a2018'; g.lineWidth = 1.2; g.beginPath(); g.arc(vx + 42, vy + 52, 38, PI * 1.2, PI * 1.8); g.stroke();
        g.fillStyle = '#c02020'; g.fillRect(vx + 60, vy + 12, 14, 3);
        g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(vx + 42, vy + 46); g.lineTo(vx + 28 + v * 6, vy + 14); g.stroke();
      }
      // 地区选择开关（成排，带指示灯）
      var rows = 2, cols2 = byM(q, 8, 12, 14);
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols2; c++) {
        var t = (r + 1) / 3.2, sx = lerp(x0 + 20, x0, t) + 330 + c * 14, sy = lerp(py0, py1, t);
        g.fillStyle = (c * 7 + r * 3) % 5 === 0 ? '#e83030' : '#4ad04a'; g.beginPath(); g.arc(sx, sy - 10, 3, 0, TAU); g.fill();
        g.fillStyle = '#e8e4d8'; g.fillRect(sx - 4, sy, 8, 14); g.fillStyle = '#5a5448'; g.fillRect(sx - 4, sy + ((c + r) % 2 ? 0 : 7), 8, 7);
      }
      // 推子
      for (var f = 0; f < 5; f++) { var fx = x0 + 90 + f * 40, fy = py0 + 110; g.fillStyle = '#2a2a2e'; g.fillRect(fx - 2, fy, 4, 56); g.fillStyle = '#d8d8d0'; g.fillRect(fx - 9, fy + 10 + (f * 13 % 30), 18, 10); }
      // 报时钟钮 + 紧急按钮（带透明盖）
      g.beginPath(); g.arc(x1 - 120, py0 + 120, 20, 0, TAU); g.fillStyle = K.rad(g, x1 - 126, py0 + 114, 2, 22, ['#80c0ff', '#2060c0', '#0a2a5a']); g.fill();
      g.beginPath(); g.arc(x1 - 60, py0 + 120, 22, 0, TAU); g.fillStyle = K.rad(g, x1 - 66, py0 + 114, 2, 24, ['#ff8080', '#d01818', '#5a0808']); g.fill();
      g.strokeStyle = 'rgba(230,240,255,0.7)'; g.lineWidth = 2; g.strokeRect(x1 - 88, py0 + 92, 56, 56);
      K.text(g, '緊急', x1 - 60, py0 + 160, 12, '#a01010', { weight: 'bold' });
      if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.18)'; quad(g, [x0 + 20, py0], [x1 - 20, py0], [x1 - 18, py0 + 8], [x0 + 18, py0 + 8]); g.fill(); }
      // 话筒（锚点 976-1056, 392-504）：鹅颈话筒，立在控制台顶上
      var mx = 1016, mb = py0 - 14;
      K.ellipse(g, mx, mb, 30, 8); g.fillStyle = '#1a1a1e'; g.fill();
      g.strokeStyle = '#2a2a30'; g.lineWidth = 6; g.beginPath(); g.moveTo(mx, mb); g.bezierCurveTo(mx, mb - 50, mx + 30, mb - 70, mx + 8, mb - 96); g.stroke();
      if (q.model > 0) { g.strokeStyle = 'rgba(160,160,170,0.6)'; g.lineWidth = 1; for (var ring = 0; ring < 10; ring++) { var tt = ring / 10, bx = mx + 30 * 3 * tt * (1 - tt) * tt + 8 * tt * tt * tt, by = mb - 96 * tt; g.beginPath(); g.moveTo(bx - 3, by); g.lineTo(bx + 3, by); g.stroke(); } }
      g.save(); g.translate(mx + 8, mb - 100); g.rotate(-0.4);
      g.fillStyle = K.lin(g, -10, 0, 10, 0, ['#3a3a40', '#8a8a94', '#2a2a30']); K.rr(g, -10, -26, 20, 34, 9); g.fill();
      if (q.model > 0) { g.fillStyle = 'rgba(0,0,0,0.5)'; for (var gI = 0; gI < 4; gI++) g.fillRect(-7, -22 + gI * 6, 14, 2); }
      g.restore();
      // 记录簿（锚点 800-1040, 736-800）
      g.fillStyle = 'rgba(0,0,0,0.3)'; K.poly(g, [812, 752, 1032, 748, 1040, 792, 806, 796]); g.fill();
      K.poly(g, [808, 744, 920, 740, 924, 786, 802, 790]); g.fillStyle = '#f4f0e2'; g.fill();
      K.poly(g, [920, 740, 1030, 742, 1036, 788, 924, 786]); g.fillStyle = '#ece6d4'; g.fill();
      g.strokeStyle = 'rgba(120,140,180,0.5)'; g.lineWidth = 1; for (var lr = 0; lr < 6; lr++) { g.beginPath(); g.moveTo(812, 750 + lr * 6.5); g.lineTo(918, 747 + lr * 6.5); g.moveTo(926, 747 + lr * 6.5); g.lineTo(1030, 749 + lr * 6.5); g.stroke(); }
      textLines(g, 816, 748, 90, 5, 6.5, 'rgba(30,30,60,0.5)');
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(921, 740); g.lineTo(924, 787); g.stroke();
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(960, 778); g.lineTo(1010, 770); g.stroke();
    })();
    // ---- 定时录音机（锚点 1336-1544, 560-672）：小台架上的双卡座 + 定时器 ----
    (function timerDeck() {
      var x = 1342, y = 570, w = 196, legY = R.bot + 40;
      if (q.light > 0) K.contact(g, x + w / 2, legY, w * 0.6, 12, 0.6);
      g.fillStyle = '#5a4a38'; g.fillRect(x - 6, y + 92, w + 12, 12); g.fillRect(x, y + 104, 12, legY - y - 104); g.fillRect(x + w - 12, y + 104, 12, legY - y - 104);
      g.fillStyle = '#4a3a2a'; g.fillRect(x - 6, legY - 70, w + 12, 10);
      // 定时器（上）
      g.fillStyle = K.lin(g, 0, y, 0, y + 34, ['#3a3a40', '#1e1e22']); K.rr(g, x + 20, y, w - 40, 34, 3); g.fill();
      g.fillStyle = '#081008'; g.fillRect(x + 32, y + 7, 72, 20);
      K.text(g, '17:00', x + 68, y + 18, 17, '#5aff6a', { weight: 'bold', font: 'Courier New,monospace' });
      g.fillStyle = '#d0d0d0'; for (var b = 0; b < 3; b++) g.fillRect(x + 116 + b * 14, y + 12, 10, 10);
      // 双卡座（下）
      g.fillStyle = K.lin(g, 0, y + 36, 0, y + 92, ['#c8ccd0', '#8a8e94']); K.rr(g, x, y + 36, w, 56, 4); g.fill();
      for (var d = 0; d < 2; d++) { var dx = x + 14 + d * 92; g.fillStyle = '#1a1a1e'; g.fillRect(dx, y + 44, 76, 32); g.fillStyle = 'rgba(200,210,220,0.3)'; g.fillRect(dx + 4, y + 48, 68, 24); g.fillStyle = '#e8e4d8'; g.fillRect(dx + 14, y + 54, 48, 12); circ(dx + 26, y + 60, 4); circ(dx + 50, y + 60, 4); }
      function circ(cx, cy, r) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fillStyle = '#2a2a2e'; g.fill(); }
      g.fillStyle = '#ff3030'; g.beginPath(); g.arc(x + w - 12, y + 84, 3, 0, TAU); g.fill();
      // 连到控制台的线
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + 70); g.bezierCurveTo(x - 30, y + 110, x - 50, y + 80, 1290, 700); g.stroke();
    })();
    // ---- 窗（锚点 1488-1848, 160-440）：窗外是防灾广播的喇叭杆与火见橹 ----
    var wx = 1500, wy = 172, ww = 340, wh = 256;
    g.fillStyle = '#d8d4c8'; g.fillRect(wx - 16, wy - 16, ww + 32, wh + 36);
    snowView(g, q, wx, wy, ww, wh, { seed: 23, ground: 0.78, bldg: function (x, y, w, h, gy) {
      // 远处的火见橹
      var tx = x + w * 0.72, tb = gy, tt = y + h * 0.18;
      g.strokeStyle = '#4a4a52'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(tx - 18, tb); g.lineTo(tx - 6, tt + 26); g.moveTo(tx + 18, tb); g.lineTo(tx + 6, tt + 26); for (var c = 0; c < 4; c++) { var cy = lerp(tb, tt + 26, c / 4); g.moveTo(tx - 18 + 12 * c / 4, cy); g.lineTo(tx + 18 - 12 * c / 4, cy); } g.stroke();
      g.fillStyle = '#3a3a42'; K.poly(g, [tx - 14, tt + 26, tx + 14, tt + 26, tx, tt]); g.fill();
      g.fillStyle = 'rgba(240,245,250,0.9)'; K.poly(g, [tx - 10, tt + 18, tx + 10, tt + 18, tx, tt + 2]); g.fill();
      // 近处的喇叭杆
      var px = x + w * 0.26;
      g.fillStyle = K.lin(g, px - 6, 0, px + 6, 0, ['#9a9ea4', '#d8dce0', '#7a7e84']); g.fillRect(px - 6, y + 20, 12, h);
      for (var s = 0; s < 3; s++) { var a = -0.6 + s * 0.6, hx = px + Math.sin(a) * 6, hy = y + 50 + s * 6; g.save(); g.translate(hx, hy); g.rotate(a * 0.6); g.fillStyle = K.lin(g, 0, -10, 0, 10, ['#e8ecf0', '#9aa0a8']); K.poly(g, [0, -5, 40 * (s - 1 || 1) * (s === 1 ? 0 : 1) + (s === 1 ? 0 : 0), -5, 0, 5]); g.fill(); g.restore(); }
      g.fillStyle = K.lin(g, 0, y + 36, 0, y + 64, ['#e8ecf0', '#9aa0a8']);
      K.poly(g, [px - 6, y + 44, px - 56, y + 30, px - 56, y + 62, px - 6, y + 52]); g.fill();
      K.poly(g, [px + 6, y + 44, px + 56, y + 30, px + 56, y + 62, px + 6, y + 52]); g.fill();
      K.poly(g, [px - 4, y + 70, px - 30, y + 76, px - 26, y + 104, px - 2, y + 82]); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(px - 56, y + 28, 50, 4); g.fillRect(px + 6, y + 28, 50, 4);
    } });
    windowFrame(g, q, wx, wy, ww, wh, { frame: '#b4b8bc', cols: 2, rows: 1, fw: 11 });
    g.fillStyle = K.lin(g, 0, wy + wh, 0, wy + wh + 20, ['#e8e4d8', '#9a9488']); g.fillRect(wx - 24, wy + wh, ww + 48, 20);

    // ================= 光照 =================
    var L = lightMap(q, '#7c7a84');
    lmLight(L, 960, 60, 1100, '#eef2ff', 0.62, 0.8);
    lmLight(L, 1670, 300, 560, '#d0dcf0', 0.45, 0.9);
    if (q.light > 0) {
      lmLight(L, 1010, 600, 360, '#d8e0f0', 0.2, 0.6);
      lmDark(L, 0.2, function (x) { x.beginPath(); x.rect(0, 0, 40, H); x.rect(W - 40, 0, 40, H); });
      lmShade(L, 0.45, function (x) { x.beginPath(); x.rect(760, 818, 520, 70); });
    }
    if (q.light >= 2) lmShade(L, 0.3, function (x) { K.poly(x, [366, 900, 644, 900, 700, 960, 330, 960]); });
    applyLM(g, L);
    if (q.light > 0) {
      K.glow(g, 960, 26, 260, '#e8f0ff', 0.24);
      K.glow(g, 1410, 588, 30, '#5aff6a', 0.25);
    }
    if (q.light >= 2) {
      softShaft(g, [1510, 190, 1830, 190, 1700, 920, 1200, 920], '#d8e4fa', 0.08, 1660, 200, 1500, 920, 5);
      dust(g, K.rng(51), byM(q, 8, 16, 24), 1300, 240, 520, 560, '#eef4ff', 0.4);
    }
    finish(g, q, q.light > 0 ? 0.42 : 0.3, 0.5);
  }
  DM.HDBG.def('community_hall', {
    draw: drawCommunityHall,
    lights: [
      { x: 960, y: 30, r: 300, color: '#eef2ff', i: 0.45, flicker: 0.02, kind: 'lamp' },
      { x: 1410, y: 588, r: 50, color: '#5aff6a', i: 0.4, flicker: 0, kind: 'screen' },
      { x: 1670, y: 300, r: 220, color: '#d0dcf0', i: 0.3, flicker: 0, kind: 'window' }
    ],
    key: { x: 0.2, color: '#eef0f6', amb: '#3a3a48', rim: 0.45 },
    outdoor: false
  });

  /* =================================================================
   * 桐谷诊所 clinic
   * ================================================================= */
  var RCL = Room({ hy: 440, top: 104, bot: 800 });
  function drawClinic(g, q) {
    var R = RCL, i;
    ceiling(g, q, R, { base: '#c8c8bc', line: 'rgba(80,80,70,0.3)', cross: true });
    backWall(g, q, R, { base: '#dcd8cc', tex: ['plaster', { c1: '#ccc8bc', c2: '#e8e4d8', seed: 53, stain: 0.7 }, 256], wain: 590, wainColor: '#5a7a6a', wainTint: ['#5a8a72', 0.45], wainStep: 180, skirt: '#3a4a40' });
    tileFloor(g, q, R, { base: '#a49a84', tiles: true, cols: 16, rows: 6, check: 'rgba(0,0,0,0.06)', joint: 'rgba(60,50,40,0.3)', seed: 13 });
    fluoLamp(g, q, 900, 8, 360);
    // 视力表 + 挂钟
    paperSheet(g, q, 774, 176, 140, 230, 0, function (x, y, w, h) {
      var sizes = [34, 26, 20, 15, 11, 8, 6];
      for (var r = 0; r < sizes.length; r++) {
        var n = r + 1, sz = sizes[r], yy = y + 26 + r * 28;
        for (var c = 0; c < n && c < 5; c++) {
          var cx = x + w / 2 + (c - (Math.min(n, 5) - 1) / 2) * (sz * 1.6), dir = (r * 3 + c) % 4;
          g.beginPath(); g.arc(cx, yy, sz / 2, dir * PI / 2 + 0.5, dir * PI / 2 + TAU - 0.5); g.strokeStyle = '#1a1a1a'; g.lineWidth = sz * 0.2; g.stroke();
        }
      }
    }, '#f8f8f4');
    wallClock(g, q, 1360, 210, 40, 11, 40);
    // ---- 药品柜（锚点 64-448, 232-752）----
    (function shelf() {
      var x = 74, y = 244, w = 364, h = R.bot + 10 - 244;
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.55, 12, 0.6);
      box(g, q, x, y, w, h, 60, { front: '#e8e8e2', side: '#a8aaa4', top: '#f4f4f0' });
      g.fillStyle = K.lin(g, x, 0, x + w, 0, ['#f4f4ee', '#d8d8d2']); g.fillRect(x, y, w, h);
      var gh = h * 0.62, rnd = K.rng(8801);
      g.fillStyle = '#4a5450'; g.fillRect(x + 14, y + 14, w - 28, gh);
      var ns = 4;
      for (var s = 0; s < ns; s++) {
        var sy = y + 14 + (s + 1) * gh / ns;
        var xx = x + 22;
        while (xx < x + w - 34) {
          var bw = 16 + rnd() * 16, bh = 26 + rnd() * (gh / ns - 40), c = rnd.pick(['#7a3a10', '#5a2a08', '#d8e8f0', '#e8e8e8', '#2a5a8a', '#f4f0e0', '#8ab0c0']);
          if (rnd() < 0.3) { g.fillStyle = K.lin(g, xx, 0, xx + bw * 1.6, 0, ['#f0f0e8', '#c8c8c0']); g.fillRect(xx, sy - 6 - bh * 0.7, bw * 1.6, bh * 0.7); g.fillStyle = '#c02020'; g.fillRect(xx + 3, sy - 6 - bh * 0.5, bw * 1.6 - 6, 4); xx += bw * 1.6 + 4; continue; }
          g.fillStyle = K.lin(g, xx, 0, xx + bw, 0, [K.shade(c, 0.2), c, K.shade(c, -0.4)]);
          K.poly(g, [xx, sy - 6, xx, sy - 6 - bh * 0.78, xx + bw * 0.25, sy - 6 - bh * 0.9, xx + bw * 0.25, sy - 6 - bh, xx + bw * 0.75, sy - 6 - bh, xx + bw * 0.75, sy - 6 - bh * 0.9, xx + bw, sy - 6 - bh * 0.78, xx + bw, sy - 6]); g.fill();
          if (q.model > 0) { g.fillStyle = '#f4f0e4'; g.fillRect(xx + 2, sy - 6 - bh * 0.55, bw - 4, bh * 0.25); }
          if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(xx + 2.5, sy - 6 - bh * 0.7, 2, bh * 0.5); }
          xx += bw + 4;
        }
        g.fillStyle = 'rgba(230,240,240,0.8)'; g.fillRect(x + 14, sy - 6, w - 28, 6);
      }
      // 玻璃门框 + 反光
      g.strokeStyle = '#d0d0ca'; g.lineWidth = 8; g.strokeRect(x + 14, y + 14, w - 28, gh); g.beginPath(); g.moveTo(x + w / 2, y + 14); g.lineTo(x + w / 2, y + 14 + gh); g.stroke();
      if (q.light > 0) { g.save(); g.beginPath(); g.rect(x + 14, y + 14, w - 28, gh); g.clip(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(220,235,250,0.14)'; K.poly(g, [x + 40, y, x + 110, y, x - 20, y + gh, x - 90, y + gh]); g.fill(); K.poly(g, [x + 230, y, x + 260, y, x + 150, y + gh, x + 120, y + gh]); g.fill(); g.restore(); }
      // 下部柜门
      var by = y + 14 + gh + 16;
      g.strokeStyle = 'rgba(80,80,76,0.6)'; g.lineWidth = 2; g.strokeRect(x + 14, by, w / 2 - 20, h - (by - y) - 20); g.strokeRect(x + w / 2 + 6, by, w / 2 - 20, h - (by - y) - 20);
      g.fillStyle = '#9a9a94'; g.fillRect(x + w / 2 - 20, by + 40, 8, 30); g.fillRect(x + w / 2 + 12, by + 40, 8, 30);
      g.fillStyle = '#c02020'; g.fillRect(x + w / 2 - 20, y - 18, 40, 12); g.fillRect(x + w / 2 - 6, y - 32, 12, 40);
    })();
    // ---- 病历柜（锚点 504-744, 232-568）：带铜标签框的小抽屉 ----
    (function records() {
      var x = 512, y = 244, w = 226, h = 318;
      if (q.light > 0) K.contact(g, x + w / 2 + 6, y + h + 6, w * 0.55, 10, 0.4);
      g.beginPath(); g.rect(x, y, w, h); woodFill(g, q, '#6a4a30', false, x, y, ['#7a5434', 0.12]);
      g.fillStyle = K.lin(g, x, 0, x + w, 0, ['rgba(255,230,200,0.1)', 'rgba(0,0,0,0.3)']); g.fillRect(x, y, w, h);
      var cols = 3, rows = 6, dw = (w - 20) / cols, dh = (h - 20) / rows;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var dx = x + 10 + c * dw, dy = y + 10 + r * dh;
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(dx + 2, dy + 2, dw - 4, dh - 4);
        g.fillStyle = K.lin(g, 0, dy, 0, dy + dh, ['rgba(140,96,60,0.6)', 'rgba(80,50,28,0.6)']); g.fillRect(dx + 4, dy + 4, dw - 8, dh - 8);
        g.fillStyle = brassGrad(g, dx + dw / 2 - 18, 0, dx + dw / 2 + 18, 0); g.fillRect(dx + dw / 2 - 18, dy + 12, 36, 14);
        g.fillStyle = '#f4f0e0'; g.fillRect(dx + dw / 2 - 14, dy + 14, 28, 10);
        g.fillStyle = brassGrad(g, dx + dw / 2 - 8, 0, dx + dw / 2 + 8, 0); K.rr(g, dx + dw / 2 - 8, dy + dh - 20, 16, 7, 3); g.fill();
      }
      // 一只抽屉被拉开，露出卡片
      if (q.model > 0) { var ox = x + 10 + dw, oy = y + 10 + 3 * dh; g.fillStyle = '#4a3020'; g.fillRect(ox - 4, oy + dh - 6, dw + 8, 14); g.fillStyle = '#ece6d4'; for (var k = 0; k < 6; k++) g.fillRect(ox + 6 + k * 10, oy + dh - 22 + (k % 2) * 3, 8, 18); }
    })();
    // ---- 窗（锚点 944-1280, 144-392）----
    var wx = 954, wy = 156, ww = 316, wh = 224;
    g.fillStyle = '#5a4632'; g.fillRect(wx - 16, wy - 16, ww + 32, wh + 36);
    snowView(g, q, wx, wy, ww, wh, { seed: 31, ground: 0.66 });
    windowFrame(g, q, wx, wy, ww, wh, { frame: '#6a5038', cols: 2, rows: 2, fw: 10 });
    g.fillStyle = K.lin(g, 0, wy + wh, 0, wy + wh + 18, ['#8a6a48', '#4a3420']); g.fillRect(wx - 24, wy + wh, ww + 48, 18);
    // ---- 诊察床（锚点 1128-1568, 664-840）+ 屏风 ----
    (function bed() {
      // 屏风
      if (q.model > 0) {
        for (var p = 0; p < 3; p++) { var px = 1468 + p * 52, top = 470 + p * 4; g.fillStyle = '#9aa0a0'; g.fillRect(px, top, 4, R.bot + 40 - top); g.fillStyle = K.lin(g, px, 0, px + 50, 0, ['#f0f0ea', '#d0d0ca']); g.fillRect(px + 4, top + 10, 46, 220); }
      }
      var x0 = 1134, x1 = 1556, topY = 696, legY = R.bot + 46;
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, legY, 240, 18, 0.6);
      g.strokeStyle = '#8a8e94'; g.lineWidth = 8; for (var l = 0; l < 2; l++) { var lx = l ? x1 - 24 : x0 + 24; g.beginPath(); g.moveTo(lx, topY + 40); g.lineTo(lx, legY); g.stroke(); }
      g.fillStyle = '#6a6e74'; g.fillRect(x0 + 10, topY + 40, x1 - x0 - 20, 10);
      // 床垫 + 白床单
      quad(g, [x0 + 10, topY - 24], [x1 - 10, topY - 24], [x1, topY], [x0, topY]); g.fillStyle = '#f4f4f0'; g.fill();
      g.fillStyle = K.lin(g, 0, topY, 0, topY + 40, ['#e8e8e4', '#b8bab8']); g.fillRect(x0, topY, x1 - x0, 40);
      if (q.model > 0) { g.strokeStyle = 'rgba(150,150,160,0.5)'; g.lineWidth = 2; for (var f = 0; f < 4; f++) { g.beginPath(); g.moveTo(x0 + 80 + f * 90, topY + 2); g.quadraticCurveTo(x0 + 96 + f * 90, topY + 22, x0 + 84 + f * 90, topY + 40); g.stroke(); } }
      // 枕头 + 叠好的毯子
      K.rr(g, x0 + 20, topY - 46, 110, 34, 14); g.fillStyle = K.lin(g, 0, topY - 46, 0, topY - 12, ['#ffffff', '#d8d8d4']); g.fill();
      K.rr(g, x1 - 150, topY - 40, 120, 26, 4); g.fillStyle = '#7a9ab8'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x1 - 150, topY - 40, 120, 4);
    })();
    // ---- 桌子（锚点 640-1088, 608-768）：台灯、病历、听诊器、一升瓶与杯子 ----
    (function desk() {
      var x0 = 648, x1 = 1080, topY = 612, fy = 632, legY = R.bot + 40;
      // 椅背
      g.fillStyle = K.lin(g, 0, 500, 0, 620, ['#5a3a22', '#2a180a']); K.rr(g, 860, 500, 120, 120, 10); g.fill();
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, legY, 260, 20, 0.6);
      quad(g, [x0 + 14, topY - 24], [x1 - 14, topY - 24], [x1, topY], [x0, topY]); woodFill(g, q, '#6a4a2e', true, x0, topY, ['#7a5434', 0.1]);
      g.fillStyle = K.lin(g, 0, topY, 0, fy, ['#8a6040', '#4a2c18']); g.fillRect(x0, topY, x1 - x0, fy - topY);
      g.beginPath(); g.rect(x0 + 10, fy, 150, legY - fy); woodFill(g, q, '#5a3a22', true, x0, fy, ['#3a2010', 0.15]);
      for (var d = 0; d < 3; d++) { var dy = fy + 12 + d * 62; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.strokeRect(x0 + 20, dy, 130, 52); g.fillStyle = brassGrad(g, x0 + 70, 0, x0 + 100, 0); g.fillRect(x0 + 72, dy + 22, 26, 6); }
      g.fillStyle = '#1e120a'; g.fillRect(x0 + 160, fy, x1 - x0 - 190, 40);
      g.fillStyle = '#4a2c18'; g.fillRect(x1 - 30, fy, 22, legY - fy);
      // 台灯
      var lx = 1020;
      g.fillStyle = '#2a2a2e'; K.ellipse(g, lx, topY - 14, 26, 7); g.fill();
      g.strokeStyle = '#2a2a2e'; g.lineWidth = 5; g.beginPath(); g.moveTo(lx, topY - 14); g.lineTo(lx - 30, topY - 90); g.lineTo(lx - 70, topY - 110); g.stroke();
      K.path(g, 'M-30 0 C-28 -20 -10 -28 6 -26 L20 6 Z', lx - 76, topY - 100, 1); g.fillStyle = K.lin(g, lx - 110, 0, lx - 50, 0, ['#2a5a3a', '#4a8a5a', '#1a3a24']); g.fill();
      // 病历与钢笔
      g.fillStyle = '#e8e2d0'; K.poly(g, [700, topY - 10, 800, topY - 14, 806, topY - 2, 704, topY]); g.fill();
      if (q.model > 0) { textLines(g, 712, topY - 11, 80, 2, 4, 'rgba(30,30,60,0.4)'); g.fillStyle = '#c8b890'; K.poly(g, [720, topY - 16, 790, topY - 20, 794, topY - 14, 724, topY - 12]); g.fill(); }
      // 听诊器
      g.strokeStyle = '#1a1a1e'; g.lineWidth = 3; g.beginPath(); g.moveTo(830, topY - 8); g.bezierCurveTo(850, topY - 30, 880, topY - 30, 890, topY - 10); g.stroke();
      g.beginPath(); g.arc(894, topY - 8, 7, 0, TAU); g.fillStyle = '#b0b4b8'; g.fill();
      // 一升瓶 + 杯（桐谷爱喝酒）
      var bx = 930, by = topY - 8;
      g.fillStyle = K.lin(g, bx - 14, 0, bx + 14, 0, ['#2a4a2a', '#4a7a4a', '#1a2a1a']);
      K.poly(g, [bx - 14, by, bx - 14, by - 70, bx - 6, by - 84, bx - 6, by - 110, bx + 6, by - 110, bx + 6, by - 84, bx + 14, by - 70, bx + 14, by]); g.fill();
      g.fillStyle = '#f0e8d0'; g.fillRect(bx - 12, by - 60, 24, 34); K.text(g, '酒', bx, by - 43, 14, '#1a1a1a', { weight: 'bold' });
      if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(bx - 10, by - 68, 3, 60); }
      g.fillStyle = 'rgba(220,235,240,0.6)'; K.poly(g, [962, by, 980, by, 982, by - 26, 960, by - 26]); g.fill(); g.fillStyle = 'rgba(230,200,140,0.6)'; g.fillRect(962, by - 14, 18, 12);
    })();
    // ---- 保险柜（锚点 1584-1856, 496-832）：深绿色旧铁柜，黄铜转盘，锁边有撬痕 ----
    (function safe() {
      var x = 1600, y = 512, w = 240, h = 266, base = R.bot + 44;
      if (q.light > 0) K.contact(g, x + w / 2, base, w * 0.6, 14, 0.7);
      // 木底座
      g.beginPath(); g.rect(x - 10, y + h, w + 20, base - y - h); woodFill(g, q, '#4a3020', true, x, y + h, ['#2a1408', 0.2]);
      var b = box(g, q, x, y, w, h, 70, { front: '#2a4a3a', side: '#1a2e24', top: '#3a5a4a' });
      g.fillStyle = K.lin(g, x, y, x + w, y + h, ['#3a5e4a', '#26402f', '#142218']); g.fillRect(x, y, w, h);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, 'noise', { c1: '#383838', c2: '#c8c8c8', scale: 16, oct: 4, seed: 37, contrast: 1.3 }, 256, 0, 0, 0.45); g.restore(); }
      // 门（内框）+ 金色饰线
      g.strokeStyle = 'rgba(10,20,14,0.8)'; g.lineWidth = 4; g.strokeRect(x + 16, y + 16, w - 32, h - 32);
      g.strokeStyle = 'rgba(214,178,94,0.75)'; g.lineWidth = 2; g.strokeRect(x + 26, y + 26, w - 52, h - 52);
      if (q.model > 0) { g.fillStyle = 'rgba(214,178,94,0.8)'; K.text(g, 'KIRIYA', x + w / 2, y + 48, 13, 'rgba(214,178,94,0.85)', { font: 'Georgia,serif', weight: 'bold' }); }
      // 转盘
      var dx = x + w * 0.42, dy = y + h * 0.48;
      g.beginPath(); g.arc(dx, dy, 34, 0, TAU); g.fillStyle = K.rad(g, dx - 10, dy - 10, 2, 36, ['#fff0c0', '#c8a050', '#6a4818']); g.fill(); g.strokeStyle = 'rgba(40,24,6,0.9)'; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.arc(dx, dy, 24, 0, TAU); g.fillStyle = K.rad(g, dx - 6, dy - 6, 1, 26, ['#e8d090', '#a07a30']); g.fill();
      for (var t = 0; t < 20; t++) { var a = t / 20 * TAU; g.strokeStyle = 'rgba(40,24,6,0.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(dx + Math.cos(a) * 26, dy + Math.sin(a) * 26); g.lineTo(dx + Math.cos(a) * 32, dy + Math.sin(a) * 32); g.stroke(); }
      // 把手
      var hx = x + w * 0.72, hy = y + h * 0.5;
      g.strokeStyle = brassGrad(g, hx - 20, 0, hx + 20, 0); g.lineWidth = 9; g.beginPath(); g.moveTo(hx, hy - 30); g.lineTo(hx, hy + 30); g.stroke();
      g.beginPath(); g.arc(hx, hy - 30, 8, 0, TAU); g.fillStyle = '#c8a050'; g.fill(); g.beginPath(); g.arc(hx, hy + 30, 8, 0, TAU); g.fill();
      // 钥匙孔
      g.fillStyle = brassGrad(g, dx - 12, 0, dx + 12, 0); K.rr(g, dx - 12, dy + 52, 24, 34, 4); g.fill();
      g.fillStyle = '#0a0806'; g.beginPath(); g.arc(dx, dy + 64, 4, 0, TAU); g.fill(); g.fillRect(dx - 1.5, dy + 64, 3, 12);
      // 撬痕（门缝处的刮伤）
      if (q.model > 0) {
        g.strokeStyle = 'rgba(200,200,190,0.75)'; g.lineWidth = 1.6;
        for (var sI = 0; sI < 5; sI++) { var sy = y + h * 0.36 + sI * 14; g.beginPath(); g.moveTo(x + w - 18, sy); g.lineTo(x + w - 36 - sI * 3, sy + 6); g.stroke(); }
        g.fillStyle = 'rgba(120,60,30,0.5)'; g.fillRect(x + w - 20, y + h * 0.34, 6, 80);
      }
      if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x + 4, y, 10, h); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x, y, w, 4); }
      void b;
    })();
    var stove = keroStove(g, q, 548, 912, 1.05);

    // ================= 光照 =================
    var L = lightMap(q, '#7a7882');
    lmLight(L, 900, 60, 1000, '#f0f4ff', 0.55, 0.8);
    lmLight(L, 1110, 300, 560, '#d0dcf0', 0.45, 0.9);
    lmLight(L, 950, 560, 300, '#ffe0b0', 0.4, 0.7);
    lmLight(L, stove[0], stove[1], 380, '#ffa860', q.light > 0 ? 0.55 : 0.4, 0.7);
    if (q.light > 0) {
      lmDark(L, 0.2, function (x) { x.beginPath(); x.rect(0, 0, 40, H); x.rect(W - 40, 0, 40, H); });
      lmShade(L, 0.45, function (x) { x.beginPath(); x.rect(800, 640, 260, 200); });
    }
    if (q.light >= 2) lmShade(L, 0.3, function (x) { K.poly(x, [1600, 790, 1840, 790, 1900, 860, 1560, 860]); });
    applyLM(g, L);
    if (q.light > 0) { K.glow(g, 900, 26, 240, '#e8f0ff', 0.22); K.glow(g, stove[0], stove[1], 120, '#ff8a3a', 0.35); K.glow(g, 948, 520, 80, '#ffe0a0', 0.2); }
    if (q.light >= 2) {
      softShaft(g, [966, 176, 1260, 176, 1300, 900, 820, 900], '#d8e4fa', 0.08, 1110, 200, 1060, 900, 5);
      dust(g, K.rng(61), byM(q, 8, 16, 24), 900, 220, 420, 560, '#eef4ff', 0.4);
    }
    finish(g, q, q.light > 0 ? 0.42 : 0.3, 0.5);
  }
  DM.HDBG.def('clinic', {
    draw: drawClinic,
    lights: [
      { x: 900, y: 30, r: 280, color: '#eef2ff', i: 0.45, flicker: 0.02, kind: 'lamp' },
      { x: 548, y: 842, r: 140, color: '#ff8a3a', i: 0.5, flicker: 0.2, kind: 'fire' },
      { x: 1110, y: 270, r: 220, color: '#d0dcf0', i: 0.3, flicker: 0, kind: 'window' }
    ],
    key: { x: 0.2, color: '#eef0f6', amb: '#3a3a46', rim: 0.45 },
    outdoor: false
  });

  /* =================================================================
   * 和风物件：围炉里、自在钩、铁壶、障子、坐垫
   * ================================================================= */
  // 围炉里（地板上的下沉炉）：X0..X1, s0..s1 为地面坐标；fire 0..1
  function irori(g, q, R, X0, X1, s0, s1, fire, o) {
    o = o || {};
    var fw = (X1 - X0) * 0.1, fs = (s1 - s0) * 0.16;
    // 炉缘（宽木框）
    floorPoly(g, R, [X0 - fw * 0.4, s0 - fs * 0.3, X1 + fw * 0.4, s0 - fs * 0.3, X1 + fw * 0.4, s1 + fs * 0.4, X0 - fw * 0.4, s1 + fs * 0.4]);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fill();
    floorPoly(g, R, [X0, s0, X1, s0, X1, s1, X0, s1]); woodFill(g, q, '#4a2c18', true, 0, 0, ['#2a1408', 0.25]);
    floorPoly(g, R, [X0, s0, X1, s0, X1, s1, X0, s1]); g.fillStyle = K.lin(g, 0, R.fp(0, s0)[1], 0, R.fp(0, s1)[1], ['rgba(255,220,180,0.06)', 'rgba(255,220,180,0.15)']); g.fill();
    // 炉内（灰床，稍低）
    var ix0 = X0 + fw, ix1 = X1 - fw, is0 = s0 + fs, is1 = s1 - fs;
    floorPoly(g, R, [ix0, is0, ix1, is0, ix1, is1, ix0, is1]); g.fillStyle = '#1a1210'; g.fill();
    var a0 = R.fp(ix0, is0), a1 = R.fp(ix1, is1);
    floorPoly(g, R, [ix0 + fw * 0.15, is0 + fs * 0.35, ix1 - fw * 0.15, is0 + fs * 0.35, ix1 - fw * 0.15, is1, ix0 + fw * 0.15, is1]);
    g.fillStyle = K.lin(g, 0, a0[1], 0, a1[1], fire > 0 ? ['#6a5e56', '#8a7c70'] : ['#5a5654', '#7a7470']); g.fill();
    if (q.tex > 0) { floorPoly(g, R, [ix0, is0, ix1, is0, ix1, is1, ix0, is1]); g.save(); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, 'noise', { c1: '#404040', c2: '#c0c0c0', scale: 24, oct: 3, seed: 61, contrast: 1.4 }, 128, 0, 0, 0.6); g.restore(); }
    // 内壁（前沿看到对面的内侧面）
    var b0 = R.fp(ix0, is0), b1 = R.fp(ix1, is0);
    K.poly(g, [b0[0], b0[1], b1[0], b1[1], b1[0] - 4, b1[1] + 10, b0[0] + 4, b0[1] + 10]); g.fillStyle = '#2a1e18'; g.fill();
    var cx = (a0[0] + a1[0]) / 2, cy = lerp(a0[1], a1[1], 0.5), rw = (a1[0] - a0[0]) * 0.3;
    // 炭
    var rnd = K.rng(o.seed || 71), n = byM(q, 6, 12, 20);
    for (var i = 0; i < n; i++) {
      var px = cx + (rnd() - 0.5) * rw * 1.4, py = cy + (rnd() - 0.5) * rw * 0.3, r = 5 + rnd() * 9;
      g.fillStyle = fire > 0 ? (rnd() < 0.5 ? '#2a1a14' : '#1a100c') : '#1e1c1c'; K.ellipse(g, px, py, r * 1.3, r * 0.7, rnd()); g.fill();
      if (fire > 0) { g.fillStyle = rnd() < fire ? 'rgba(255,140,40,0.9)' : 'rgba(190,60,20,0.8)'; K.ellipse(g, px + 1, py + 1, r * 0.8, r * 0.35, rnd()); g.fill(); }
      else if (q.model > 0) { g.fillStyle = 'rgba(200,196,190,0.4)'; K.ellipse(g, px - 1, py - 2, r * 0.7, r * 0.25); g.fill(); }
    }
    if (fire > 0) {
      if (q.light > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = K.rad(g, cx, cy, 2, rw * 1.4, [[0, 'rgba(255,150,60,' + (0.55 * fire) + ')'], [1, 'rgba(255,100,30,0)']]); g.fillRect(cx - rw * 1.4, cy - rw * 1.4, rw * 2.8, rw * 2.8); g.restore(); }
      if (fire > 0.6) { flameShape(g, cx - rw * 0.2, cy + 2, 26 * fire, 0.8); flameShape(g, cx + rw * 0.15, cy + 4, 18 * fire, 0.7); }
    }
    // 五德（三脚铁架）
    if (o.gotoku !== false) {
      g.strokeStyle = '#141416'; g.lineWidth = 4;
      K.ellipse(g, cx, cy - 18, rw * 0.5, rw * 0.12); g.stroke();
      for (var l = 0; l < 3; l++) { var la = l / 3 * TAU + 0.4, lx = cx + Math.cos(la) * rw * 0.5, ly = cy - 18 + Math.sin(la) * rw * 0.12; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(la) * 6, ly + 22); g.stroke(); }
    }
    return [cx, cy];
  }
  function tetsubin(g, q, x, y, s) {
    s = s || 1;
    if (q.light > 0) K.contact(g, x, y + 2, 40 * s, 6 * s, 0.4);
    g.fillStyle = K.rad(g, x - 12 * s, y - 34 * s, 2, 50 * s, ['#5a5a60', '#2a2a2e', '#0e0e10']);
    K.path(g, 'M-34 -4 C-40 -24 -30 -46 0 -48 C30 -46 40 -24 34 -4 C26 4 -26 4 -34 -4 Z', x, y, s); g.fill();
    if (q.model > 0) { g.fillStyle = 'rgba(120,120,130,0.35)'; for (var i = 0; i < 18; i++) { var a = (i % 6) / 6 * PI + 0.2, rr = Math.floor(i / 6); g.beginPath(); g.arc(x + Math.cos(a + PI) * (30 - rr * 6) * s, y - (16 + rr * 10) * s + Math.sin(a) * 4 * s, 2 * s, 0, TAU); g.fill(); } }
    g.fillStyle = '#1a1a1e'; K.path(g, 'M30 -22 C44 -26 50 -38 52 -46 L48 -46 C44 -36 40 -30 30 -30 Z', x, y, s); g.fill();
    K.ellipse(g, x, y - 48 * s, 14 * s, 4 * s); g.fillStyle = '#2a2a2e'; g.fill();
    g.strokeStyle = '#2a2a30'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x - 30 * s, y - 34 * s); g.quadraticCurveTo(x, y - 86 * s, x + 30 * s, y - 34 * s); g.stroke();
    if (q.light > 0) { g.strokeStyle = 'rgba(255,200,140,0.3)'; g.lineWidth = 2 * s; g.beginPath(); g.arc(x - 6 * s, y - 24 * s, 24 * s, PI * 1.1, PI * 1.5); g.stroke(); }
    return [x, y - 60 * s];
  }
  // 自在钩：竹筒 + 鱼形横木 + 铁钩（+ 铁壶）
  function jizai(g, q, x, yTop, yHook, o) {
    o = o || {};
    var midY = lerp(yTop, yHook, o.mid || 0.55);
    // 竹筒
    g.fillStyle = K.lin(g, x - 9, 0, x + 9, 0, o.rust ? ['#3a2a1c', '#6a5038', '#2a1c10'] : ['#4a3a20', '#a08a50', '#3a2a14']); g.fillRect(x - 8, yTop, 16, midY - yTop);
    if (q.model > 0) for (var n = yTop + 60; n < midY - 20; n += 70) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x - 9, n, 18, 4); }
    // 鱼形横木
    g.save(); g.translate(x, midY);
    g.fillStyle = K.lin(g, 0, -14, 0, 14, o.rust ? ['#4a3a2a', '#2a1c12'] : ['#7a5232', '#3a2010']);
    K.path(g, 'M-58 0 C-48 -14 -20 -16 0 -12 C20 -10 40 -14 52 -4 L64 -14 L62 0 L64 14 L52 4 C40 14 20 10 0 12 C-20 16 -48 14 -58 0 Z'); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#1a0e06'; g.beginPath(); g.arc(-44, -2, 3, 0, TAU); g.fill();
    if (q.model > 0) { g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.5; for (var sc = 0; sc < 4; sc++) { g.beginPath(); g.arc(-10 + sc * 12, 0, 8, -0.8, 0.8); g.stroke(); } }
    g.restore();
    // 铁棒 + 钩
    g.strokeStyle = o.rust ? '#5a3a24' : '#1e1e22'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, midY + 12); g.lineTo(x, yHook - 10); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.arc(x - 8, yHook - 10, 8, 0, PI * 0.95); g.stroke();
    if (o.kettle) return tetsubin(g, q, x - 2, yHook + 66, o.ks || 1);
    return null;
  }
  // 障子：o.glow 透光、o.torn 破损
  function shoji(g, q, x, y, w, h, o) {
    o = o || {};
    g.fillStyle = o.glow ? K.lin(g, 0, y, 0, y + h, ['#f8f4e8', '#ece4d0']) : K.lin(g, 0, y, 0, y + h, ['#d8d0bc', '#bcb49e']); g.fillRect(x, y, w, h);
    if (q.tex > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'paper', { c1: '#d0c8b8', c2: '#ffffff', seed: 19 }, 128, 0, 0, 0.7); g.restore(); }
    if (o.torn) {
      var rnd = K.rng(o.seed || 5);
      for (var t = 0; t < o.torn; t++) {
        var tx = x + rnd() * w, ty = y + rnd() * h, tr = 18 + rnd() * 30;
        g.beginPath(); for (var k = 0; k < 9; k++) { var a = k / 9 * TAU, r = tr * (0.5 + rnd() * 0.6); if (k) g.lineTo(tx + Math.cos(a) * r, ty + Math.sin(a) * r); else g.moveTo(tx + Math.cos(a) * r, ty + Math.sin(a) * r); } g.closePath();
        g.fillStyle = o.hole || '#20242e'; g.fill(); g.strokeStyle = 'rgba(200,190,170,0.8)'; g.lineWidth = 1.5; g.stroke();
      }
    }
    var cols = o.cols || 3, rows = o.rows || 5, fw = o.fw || 4, fc = o.frame || '#5a4028';
    g.fillStyle = fc;
    for (var c = 1; c < cols; c++) g.fillRect(x + w * c / cols - fw / 2, y, fw, h);
    for (var r2 = 1; r2 < rows; r2++) g.fillRect(x, y + h * r2 / rows - fw / 2, w, fw);
    g.strokeStyle = fc; g.lineWidth = fw * 2.6; g.strokeRect(x, y, w, h);
    if (q.light > 0 && o.glow) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = K.rad(g, x + w / 2, y + h / 2, 10, Math.max(w, h) * 0.7, [[0, 'rgba(255,250,235,0.18)'], [1, 'rgba(255,250,235,0)']]); g.fillRect(x, y, w, h); g.restore(); }
  }
  // 坐垫（正对镜头的透视四边形）
  function zabuton(g, q, cx, cy, w, h, col) {
    var t = h * 0.25;
    if (q.light > 0) K.contact(g, cx, cy + h * 0.55, w * 0.6, h * 0.3, 0.5);
    g.beginPath();
    g.moveTo(cx - w * 0.46, cy - h * 0.5); g.quadraticCurveTo(cx, cy - h * 0.58, cx + w * 0.46, cy - h * 0.5);
    g.quadraticCurveTo(cx + w * 0.54, cy, cx + w * 0.5, cy + h * 0.5); g.quadraticCurveTo(cx, cy + h * 0.6, cx - w * 0.5, cy + h * 0.5);
    g.quadraticCurveTo(cx - w * 0.54, cy, cx - w * 0.46, cy - h * 0.5); g.closePath();
    g.fillStyle = K.lin(g, 0, cy - h * 0.5, 0, cy + h * 0.6, [K.shade(col, 0.12), col, K.shade(col, -0.4)]); g.fill();
    if (q.tex > 0) { g.save(); g.clip(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'fabric', { c1: '#b0b0b0', c2: '#ffffff', threads: 40, seed: 3 }, 64, 0, 0, 0.45); g.restore(); }
    // 侧面厚度
    g.fillStyle = K.shade(col, -0.45); K.poly(g, [cx - w * 0.5, cy + h * 0.5, cx + w * 0.5, cy + h * 0.5, cx + w * 0.48, cy + h * 0.5 + t, cx - w * 0.48, cy + h * 0.5 + t]); g.fill();
    if (q.model > 0) { g.fillStyle = 'rgba(0,0,0,0.4)'; K.ellipse(g, cx, cy, w * 0.04, h * 0.06); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - w * 0.1, cy - h * 0.05); g.lineTo(cx + w * 0.1, cy + h * 0.05); g.moveTo(cx + w * 0.1, cy - h * 0.05); g.lineTo(cx - w * 0.1, cy + h * 0.05); g.stroke(); }
  }
  // 土壁 + 柱 + 贯（和风后墙）。posts: [x...]
  function minkaWall(g, q, R, posts, o) {
    o = o || {};
    K.poly(g, [0, R.top, W, R.top, W, R.bot, 0, R.bot]); earthFill(g, q, o.base || '#7a6a50', o.tint);
    if (q.model > 0) { // 土壁的裂缝与斑驳
      var rnd = K.rng(o.seed || 81);
      g.strokeStyle = 'rgba(40,28,16,0.35)'; g.lineWidth = 1.5;
      for (var c = 0; c < byM(q, 0, 6, 12); c++) { var cx = rnd() * W, cy = R.top + rnd() * (R.bot - R.top); g.beginPath(); g.moveTo(cx, cy); for (var k = 0; k < 4; k++) { cx += (rnd() - 0.5) * 40; cy += 10 + rnd() * 20; g.lineTo(cx, cy); } g.stroke(); }
    }
    // 贯（横木）
    var nuki = o.nuki || [R.top + 30, (R.top + R.bot) * 0.5];
    for (var n = 0; n < nuki.length; n++) { g.beginPath(); g.rect(0, nuki[n] - 14, W, 28); woodFill(g, q, '#3a2414', true, 0, nuki[n], ['#1a0c04', 0.4]); g.fillStyle = 'rgba(255,220,170,0.12)'; g.fillRect(0, nuki[n] - 14, W, 3); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, nuki[n] + 14, W, 5); }
    for (var p = 0; p < posts.length; p++) {
      var px = posts[p], pw = o.postW || 40;
      g.beginPath(); g.rect(px - pw / 2, R.top, pw, R.bot - R.top); woodFill(g, q, '#3a2414', false, px, 0, ['#1a0c04', 0.35]);
      g.fillStyle = K.lin(g, px - pw / 2, 0, px + pw / 2, 0, ['rgba(255,220,170,0.14)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']); g.fillRect(px - pw / 2, R.top, pw, R.bot - R.top);
    }
    g.fillStyle = K.lin(g, 0, R.top, 0, R.top + 70, ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']); g.fillRect(0, R.top, W, 70);
    if (q.light > 0) K.ao(g, 0, R.top, W, R.bot - R.top, 100, 0.35, 'lr');
  }
  // 熏黑的椽子天花（朝消失点）
  function rafterCeil(g, q, R, o) {
    o = o || {};
    K.poly(g, [0, 0, W, 0, W, R.top, 0, R.top]); g.fillStyle = o.base || '#1e140c'; g.fill();
    if (q.tex > 0) { K.poly(g, [0, 0, W, 0, W, R.top, 0, R.top]); g.save(); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, o.thatch ? 'thatch' : 'wood', o.thatch ? { c1: '#404040', c2: '#c0c0c0', seed: 31 } : SUGI_H, o.thatch ? 192 : WU, 0, 0, 0.7); g.restore(); }
    var kk = (0 - R.hy) / (R.top - R.hy);
    for (var cb = -10; cb <= 10; cb++) {
      var cx0 = 960 + cb * 120, w0 = 14, ex0 = 960 + (cx0 - w0 - 960) * kk, ex1 = 960 + (cx0 + w0 - 960) * kk;
      K.poly(g, [cx0 - w0, R.top, cx0 + w0, R.top, ex1, 0, ex0, 0]); g.fillStyle = K.lin(g, cx0 - w0, 0, cx0 + w0, 0, ['#3a2414', '#1a0e06']); g.fill();
    }
    g.beginPath(); g.rect(0, R.top - 26, W, 30); woodFill(g, q, '#2a1a0e', true, 0, R.top, ['#0e0804', 0.4]);
    g.fillStyle = 'rgba(255,220,170,0.1)'; g.fillRect(0, R.top - 26, W, 3);
    K.poly(g, [0, 0, W, 0, W, R.top, 0, R.top]); g.fillStyle = K.lin(g, 0, 0, 0, R.top, ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)']); g.fill();
  }
  function snowDrift(g, q, pts, a) {
    K.poly(g, pts); g.fillStyle = K.lin(g, 0, Math.min(pts[1], pts[3]), 0, Math.max(pts[pts.length - 1], pts[5] || 0), ['rgba(250,252,255,' + (a || 0.95) + ')', 'rgba(200,210,230,' + (a || 0.95) + ')']); g.fill();
    if (q.model > 0) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length - 4; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); }
  }

  /* =================================================================
   * 废弃的分校 school
   * ================================================================= */
  var RSC = Room({ hy: 440, top: 100, bot: 790 });
  function drawSchool(g, q) {
    var R = RSC, i;
    ceiling(g, q, R, { base: '#4a3a2a', wood: true, line: 'rgba(20,12,6,0.5)' });
    if (q.model > 0) { g.fillStyle = 'rgba(30,20,10,0.25)'; K.ellipse(g, 700, 50, 160, 30); g.fill(); K.ellipse(g, 1300, 70, 120, 20); g.fill(); }
    backWall(g, q, R, { base: '#b8ae98', tex: ['plaster', { c1: '#a49a84', c2: '#c8bea6', seed: 61, stain: 0.8 }, 256], wain: 560, wainColor: '#5a3e28', wainStep: 90, skirt: '#2a1c12' });
    // 剥落的墙皮
    if (q.model > 0) { var pr = K.rng(91); for (i = 0; i < byM(q, 0, 5, 9); i++) { var px = pr() * W, py = 140 + pr() * 360, pw = 30 + pr() * 60; g.fillStyle = 'rgba(120,100,80,0.4)'; K.poly(g, [px, py, px + pw, py + 6, px + pw * 0.8, py + pw * 0.5, px + 10, py + pw * 0.4]); g.fill(); } }
    boardFloor(g, q, R, { base: '#5a4230', seed: 33 });
    // 地上的灰尘与雪
    if (q.model > 0) { g.fillStyle = 'rgba(200,190,170,0.08)'; K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]); g.fill(); }

    // ---- 布告栏（锚点 96-352, 160-368）----
    (function notice() {
      var x = 104, y = 168, w = 240, h = 192;
      if (q.light > 0) K.contact(g, x + w / 2 + 6, y + h + 6, w * 0.5, 8, 0.35);
      g.fillStyle = '#5a3e28'; g.fillRect(x - 8, y - 8, w + 16, h + 16);
      g.fillStyle = '#a07850'; g.fillRect(x, y, w, h);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'noise', { c1: '#a08060', c2: '#ffffff', scale: 32, oct: 2, seed: 7 }, 64, 0, 0, 0.6); g.restore(); }
      // 孩子的画：雪人、白蛾
      paperSheet(g, q, x + 12, y + 14, 92, 72, -0.06, function (px, py, pw, ph) {
        g.fillStyle = '#9ac8f0'; g.fillRect(px + 4, py + 14, pw - 8, ph - 18);
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(px + pw / 2, py + ph - 20, 14, 0, TAU); g.fill(); g.beginPath(); g.arc(px + pw / 2, py + ph - 40, 10, 0, TAU); g.fill();
        g.fillStyle = '#e04040'; g.fillRect(px + pw / 2 - 10, py + ph - 52, 20, 5);
      });
      paperSheet(g, q, x + 118, y + 18, 104, 76, 0.05, function (px, py, pw, ph) {
        g.fillStyle = '#f4f0e8'; g.fillRect(px + 4, py + 14, pw - 8, ph - 18);
        g.fillStyle = '#d8d8e0'; K.path(g, 'M0 0 C-8 -12 -26 -14 -30 -4 C-28 6 -12 6 0 2 C12 6 28 6 30 -4 C26 -14 8 -12 0 0 Z', px + pw / 2, py + ph / 2 + 6, 1); g.fill();
        g.strokeStyle = '#6a6a7a'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#5a5a6a'; g.fillRect(px + pw / 2 - 2, py + ph / 2 - 4, 4, 20);
      });
      paperSheet(g, q, x + 20, y + 102, 200, 80, 0.01, function (px, py, pw, ph) {
        K.text(g, 'じかんわり', px + pw / 2, py + 14, 12, '#2a2a30', { weight: 'bold' });
        g.strokeStyle = 'rgba(40,40,50,0.6)'; g.lineWidth = 1; for (var c = 0; c <= 6; c++) { g.beginPath(); g.moveTo(px + 10 + c * 30, py + 24); g.lineTo(px + 10 + c * 30, py + ph - 6); g.stroke(); } for (var r = 0; r <= 3; r++) { g.beginPath(); g.moveTo(px + 10, py + 24 + r * 16); g.lineTo(px + 190, py + 24 + r * 16); g.stroke(); }
      }, '#efe8d4');
    })();
    wallClock(g, q, 452, 214, 34, 3, 15);
    // ---- 黑板（锚点 544-1384, 144-432）：最后一届孩子留下的字 ----
    (function board() {
      var x = 556, y = 156, w = 816, h = 266;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 6, y + 8, w + 12, h + 12);
      g.beginPath(); g.rect(x - 14, y - 14, w + 28, h + 28); woodFill(g, q, '#5a3e28', true, x, y, ['#7a5434', 0.15]);
      g.fillStyle = K.lin(g, x, y, x + w, y + h, ['#3a5a46', '#2a4636', '#1e3428']); g.fillRect(x, y, w, h);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, 'noise', { c1: '#404040', c2: '#c0c0c0', scale: 12, oct: 3, seed: 9, contrast: 1.2 }, 128, 0, 0, 0.5); g.restore(); }
      // 板擦痕
      g.fillStyle = 'rgba(220,230,220,0.08)'; for (i = 0; i < 6; i++) { K.ellipse(g, x + 100 + i * 120, y + 60 + (i % 3) * 60, 90, 30, 0.1); g.fill(); }
      var chalk = 'rgba(240,244,236,0.85)';
      K.text(g, 'さようなら　ぶんこう', x + w * 0.42, y + 70, 54, chalk, { weight: 'bold' });
      if (q.model > 0) {
        K.text(g, '平成三年三月', x + w * 0.42, y + 136, 26, 'rgba(240,244,236,0.7)');
        var names = ['あきら', 'ゆき', 'たけし', 'はな', 'けんじ'];
        for (var n = 0; n < names.length; n++) K.text(g, names[n], x + 90 + n * 120, y + 200 + (n % 2) * 12, 24, n % 2 ? 'rgba(255,200,200,0.7)' : 'rgba(240,244,236,0.7)');
        // 雪人与白蛾的涂鸦
        g.strokeStyle = chalk; g.lineWidth = 3;
        g.beginPath(); g.arc(x + w - 110, y + 186, 28, 0, TAU); g.stroke(); g.beginPath(); g.arc(x + w - 110, y + 140, 19, 0, TAU); g.stroke();
        g.beginPath(); g.moveTo(x + w - 138, y + 180); g.lineTo(x + w - 162, y + 166); g.moveTo(x + w - 82, y + 180); g.lineTo(x + w - 58, y + 166); g.stroke();
        g.fillStyle = chalk; g.beginPath(); g.arc(x + w - 117, y + 136, 2.5, 0, TAU); g.arc(x + w - 103, y + 136, 2.5, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(x + w - 130, y + 124); g.lineTo(x + w - 90, y + 124); g.lineTo(x + w - 96, y + 106); g.lineTo(x + w - 124, y + 106); g.closePath(); g.stroke();
        K.path(g, 'M0 0 C-10 -14 -32 -16 -36 -4 C-32 8 -14 8 0 2 C14 8 32 8 36 -4 C32 -16 10 -14 0 0 Z', x + w - 110, y + 64, 1); g.stroke();
        g.beginPath(); g.moveTo(x + w - 114, y + 60); g.lineTo(x + w - 124, y + 44); g.moveTo(x + w - 106, y + 60); g.lineTo(x + w - 96, y + 44); g.stroke();
      }
      // 粉笔槽 + 粉笔 + 板擦
      g.fillStyle = K.lin(g, 0, y + h + 8, 0, y + h + 24, ['#7a5434', '#3a2414']); g.fillRect(x - 10, y + h + 8, w + 20, 16);
      g.fillStyle = '#f4f4ec'; g.fillRect(x + 200, y + h + 4, 26, 6); g.fillStyle = '#f0c0c0'; g.fillRect(x + 240, y + h + 4, 20, 6);
      g.fillStyle = '#3a3a5a'; g.fillRect(x + 600, y + h - 2, 56, 12); g.fillStyle = '#d8d0b0'; g.fillRect(x + 600, y + h - 2, 56, 4);
    })();
    // ---- 风琴（锚点 80-360, 480-776）：踏板风琴 ----
    (function organ() {
      var x = 90, y = 500, w = 260, h = R.bot + 20 - 500;
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.6, 14, 0.6);
      box(g, q, x, y + 60, w, h - 60, 70, { front: '#5a3420', side: '#3a2010', top: '#7a4a2c', fill: function () { woodFill(g, q, '#5a3420', false, x, y, ['#6a3a1c', 0.15]); } });
      // 上部（谱架板）
      g.beginPath(); g.rect(x + 10, y, w - 20, 70); woodFill(g, q, '#5a3420', true, x, y, ['#6a3a1c', 0.15]);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 24, y + 12, w - 48, 44);
      if (q.model > 0) { g.strokeStyle = 'rgba(200,160,100,0.4)'; g.lineWidth = 2; K.ellipse(g, x + w / 2, y + 34, 50, 14); g.stroke(); }
      // 键盘
      var ky = y + 96;
      g.fillStyle = '#2a1a0e'; g.fillRect(x + 6, ky - 10, w - 12, 46);
      g.fillStyle = '#f0ece0'; g.fillRect(x + 14, ky, w - 28, 26);
      g.fillStyle = 'rgba(0,0,0,0.5)'; for (var k = 1; k < 22; k++) g.fillRect(x + 14 + k * (w - 28) / 22, ky, 1.2, 26);
      g.fillStyle = '#1a1210'; for (var b = 0; b < 22; b++) if ([0, 1, 3, 4, 5].indexOf(b % 7) >= 0) g.fillRect(x + 14 + (b + 0.65) * (w - 28) / 22, ky, (w - 28) / 22 * 0.6, 16);
      g.fillStyle = 'rgba(200,190,170,0.18)'; g.fillRect(x + 14, ky, w - 28, 26); // 积灰
      // 踏板
      g.fillStyle = '#1a1210'; g.fillRect(x + 50, y + h - 40, 60, 26); g.fillRect(x + w - 110, y + h - 40, 60, 26);
      g.fillStyle = 'rgba(200,160,100,0.3)'; g.fillRect(x + 54, y + h - 36, 52, 4); g.fillRect(x + w - 106, y + h - 36, 52, 4);
      // 一块盖布半搭着
      if (q.model > 0) { g.fillStyle = 'rgba(200,190,160,0.85)'; K.poly(g, [x + w - 90, y - 4, x + w + 6, y - 4, x + w + 10, y + 140, x + w - 30, y + 120, x + w - 70, y + 60]); g.fill(); g.strokeStyle = 'rgba(120,110,90,0.6)'; g.lineWidth = 1.5; g.stroke(); }
    })();
    // ---- 讲台 + 歌本（锚点 800-1000, 592-656）----
    (function lectern() {
      var x0 = 760, x1 = 1060, topY = 640, legY = R.bot + 40;
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, legY, 180, 16, 0.6);
      quad(g, [x0 + 10, topY - 22], [x1 - 10, topY - 22], [x1, topY], [x0, topY]); woodFill(g, q, '#6a4a2c', true, x0, topY, ['#7a5434', 0.12]);
      g.beginPath(); g.rect(x0, topY, x1 - x0, legY - topY); woodFill(g, q, '#5a3a22', false, x0, topY, ['#3a2010', 0.15]);
      g.fillStyle = K.lin(g, 0, topY, 0, legY, ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.45)']); g.fillRect(x0, topY, x1 - x0, legY - topY);
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; g.strokeRect(x0 + 20, topY + 20, x1 - x0 - 40, legY - topY - 40);
      // 打开的歌本
      g.fillStyle = 'rgba(0,0,0,0.3)'; K.poly(g, [822, topY - 10, 996, topY - 12, 1000, topY - 2, 818, topY]); g.fill();
      K.poly(g, [822, topY - 26, 906, topY - 30, 908, topY - 8, 818, topY - 6]); g.fillStyle = '#f0e8d0'; g.fill();
      K.poly(g, [906, topY - 30, 990, topY - 26, 996, topY - 6, 908, topY - 8]); g.fillStyle = '#e8dfc4'; g.fill();
      g.strokeStyle = 'rgba(40,40,40,0.5)'; g.lineWidth = 1; for (var l = 0; l < 3; l++) { g.beginPath(); g.moveTo(828, topY - 24 + l * 6); g.lineTo(902, topY - 27 + l * 6); g.moveTo(912, topY - 27 + l * 6); g.lineTo(988, topY - 24 + l * 6); g.stroke(); }
      if (q.model > 0) { g.fillStyle = 'rgba(30,30,30,0.6)'; for (var nI = 0; nI < 10; nI++) { g.beginPath(); g.arc(834 + nI * 15 + (nI > 4 ? 12 : 0), topY - 20 + (nI * 3 % 3) * 4, 1.6, 0, TAU); g.fill(); } }
      g.fillStyle = '#c03030'; g.fillRect(904, topY - 30, 4, 24);
    })();
    // ---- 课桌椅（锚点 384-1544, 680-920）：两排小课桌 ----
    (function desks() {
      function desk(X, s) {
        var w = 120, d = 0.06, hgt = 110;
        var fl = R.fp(X - w / 2, s), fr = R.fp(X + w / 2, s), bl = R.fp(X - w / 2, s - d), br = R.fp(X + w / 2, s - d);
        var hh = hgt * s * 0.9;
        if (q.light > 0) K.contact(g, (fl[0] + fr[0]) / 2, fl[1], (fr[0] - fl[0]) * 0.6, 8 * s, 0.55);
        // 椅子（桌后）
        var cb = R.fp(X, s - d - 0.02), cw = 70 * s;
        g.fillStyle = '#4a3020'; g.fillRect(cb[0] - cw / 2, cb[1] - hh * 1.15, cw, hh * 0.35);
        g.strokeStyle = '#6a6e74'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(cb[0] - cw / 2 + 4, cb[1] - hh * 0.8); g.lineTo(cb[0] - cw / 2 + 4, cb[1]); g.moveTo(cb[0] + cw / 2 - 4, cb[1] - hh * 0.8); g.lineTo(cb[0] + cw / 2 - 4, cb[1]); g.stroke();
        // 桌腿（钢管）
        g.strokeStyle = '#5a5e64'; g.lineWidth = 4 * s;
        g.beginPath(); g.moveTo(fl[0] + 6, fl[1] - hh); g.lineTo(fl[0] + 6, fl[1]); g.moveTo(fr[0] - 6, fr[1] - hh); g.lineTo(fr[0] - 6, fr[1]); g.stroke();
        // 抽斗箱 + 桌面
        g.fillStyle = '#3a2618'; g.fillRect(fl[0] + 4, fl[1] - hh + 6, fr[0] - fl[0] - 8, hh * 0.28);
        quad(g, [bl[0], bl[1] - hh], [br[0], br[1] - hh], [fr[0], fr[1] - hh], [fl[0], fl[1] - hh]);
        woodFill(g, q, '#9a7a52', true, fl[0], fl[1], ['#b08a5c', 0.15]);
        quad(g, [bl[0], bl[1] - hh], [br[0], br[1] - hh], [fr[0], fr[1] - hh], [fl[0], fl[1] - hh]); g.fillStyle = 'rgba(210,200,180,0.18)'; g.fill(); // 积灰
        g.fillStyle = K.lin(g, 0, fl[1] - hh, 0, fl[1] - hh + 8 * s, ['#7a5a3a', '#4a3020']); g.fillRect(fl[0], fl[1] - hh, fr[0] - fl[0], 7 * s);
      }
      var back = [-430, -240, -50, 140, 330, 520], front = [-380, -150, 80, 310];
      for (var b = 0; b < back.length; b++) desk(back[b], 1.12);
      for (var f = 0; f < front.length; f++) desk(front[f], 1.4);
    })();
    // ---- 窗（锚点 1488-1856, 160-544）：木框格子窗，一块玻璃破了，雪吹进来 ----
    var wx = 1500, wy = 172, ww = 344, wh = 360;
    g.fillStyle = '#4a3420'; g.fillRect(wx - 16, wy - 16, ww + 32, wh + 36);
    snowView(g, q, wx, wy, ww, wh, { seed: 37, ground: 0.6 });
    // 破洞（无玻璃，雪片更多）
    var hx = wx + ww * 0.5, hy = wy + wh * 0.75;
    windowFrame(g, q, wx, wy, ww, wh, { frame: '#5a3e26', cols: 3, rows: 4, fw: 9, frostTop: true });
    g.strokeStyle = 'rgba(230,240,250,0.8)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(hx + 10, wy + wh * 0.5 + 6); g.lineTo(hx + 40, hy); g.lineTo(hx + 20, wy + wh * 0.75 + 30); g.moveTo(hx + 40, hy); g.lineTo(hx + 90, hy - 20); g.stroke();
    g.fillStyle = K.lin(g, 0, wy + wh, 0, wy + wh + 18, ['#7a5a3c', '#3a2414']); g.fillRect(wx - 24, wy + wh, ww + 48, 18);
    snowDrift(g, q, [wx + ww * 0.3, wy + wh, wx + ww * 0.5, wy + wh - 14, wx + ww * 0.8, wy + wh - 6, wx + ww * 0.95, wy + wh, wx + ww * 0.95, wy + wh + 4, wx + ww * 0.3, wy + wh + 4]);
    snowDrift(g, q, [1480, R.bot + 8, 1600, R.bot - 2, 1720, R.bot + 4, 1800, R.bot + 30, 1640, R.bot + 50, 1460, R.bot + 30]);
    // 废弃的煤炉（达摩炉），冷的
    if (q.model > 0) {
      var sx = 1436, sb = 900;
      if (q.light > 0) K.contact(g, sx, sb, 70, 12, 0.6);
      g.fillStyle = K.lin(g, 0, 0, 0, 0, ['#000', '#000']);
      g.fillStyle = K.lin(g, sx - 50, 0, sx + 50, 0, ['#1a1a1e', '#4a4a52', '#141416']);
      K.path(g, 'M-34 0 L-40 -40 C-52 -80 -48 -130 -30 -150 L30 -150 C48 -130 52 -80 40 -40 L34 0 Z', sx, sb, 1); g.fill();
      g.fillStyle = K.lin(g, sx - 12, 0, sx + 12, 0, ['#1a1a1e', '#4a4a52', '#141416']); g.fillRect(sx - 12, R.top, 24, sb - 150 - R.top);
      g.fillStyle = '#121214'; for (var jI = 0; jI < 4; jI++) g.fillRect(sx - 15, R.top + 60 + jI * 140, 30, 6);
      g.fillStyle = 'rgba(120,60,30,0.45)'; g.fillRect(sx - 30, sb - 90, 20, 30);
      g.fillStyle = '#0a0a0c'; g.fillRect(sx - 20, sb - 70, 40, 24);
    }
    if (q.model >= 2) { cobweb(g, 0, R.top, 150, 0, PI / 2, 0.18); cobweb(g, W, R.top, 130, PI / 2, PI, 0.16); cobweb(g, 350, 500, 50, PI, PI * 1.5, 0.14); }

    // ================= 光照 =================
    var L = lightMap(q, '#6a6a78');
    lmLight(L, 1672, 350, 900, '#d8e2f4', 0.75, 0.85);
    lmLight(L, 1200, 860, 700, '#c8d4ec', 0.35, 0.35);
    if (q.light > 0) {
      lmLight(L, 960, 300, 700, '#b8c0d4', 0.2, 0.6);
      lmDark(L, 0.3, function (x) { x.beginPath(); x.rect(0, 0, 60, H); });
      lmDark(L, 0.2, function (x) { x.beginPath(); x.rect(0, 0, W, 90); });
    }
    if (q.light >= 2) {
      // 窗棂投在地上的影子
      lmShade(L, 0.3, function (x) { for (var k = 0; k < 3; k++) { x.rect(1100 + k * 150, 820, 10, 200); } x.rect(1000, 900, 560, 10); });
      lmShade(L, 0.35, function (x) { K.poly(x, [760, 870, 1060, 870, 900, 960, 600, 960]); });
    }
    applyLM(g, L);
    if (q.light > 0) K.glow(g, 1672, 340, 300, '#c8d4ec', 0.15);
    if (q.light >= 2) {
      softShaft(g, [1510, 190, 1830, 190, 1500, 1000, 980, 1000], '#e0eaff', 0.13, 1670, 220, 1260, 1000, 6);
      dust(g, K.rng(71), byM(q, 14, 28, 44), 1050, 260, 760, 700, '#eef4ff', 0.5);
    }
    finish(g, q, q.light > 0 ? 0.55 : 0.4, 0.45);
  }
  DM.HDBG.def('school', {
    draw: drawSchool,
    lights: [{ x: 1672, y: 350, r: 320, color: '#d8e2f4', i: 0.4, flicker: 0, kind: 'window' }],
    key: { x: 0.6, color: '#dce4f4', amb: '#2e3040', rim: 0.6 },
    outdoor: false
  });

  /* =================================================================
   * 冬木家旧宅 fuyuki_house；variant 'past' = 1983 年雪绘母女住着时
   * ================================================================= */
  var RFY = Room({ hy: 430, top: 96, bot: 760 });
  // 手刻的「雪」字：雨字头里的四点连成一道波浪线（★ch2_pillar）
  function carvedYuki(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-8, -10); g.lineTo(8, -10);                                    // 一
    g.moveTo(-9, -7); g.lineTo(-9, -3); g.moveTo(-9, -7); g.lineTo(9, -7); g.lineTo(9, -3);   // 冖
    g.moveTo(0, -10); g.lineTo(0, -1);                                      // 丨
    g.moveTo(-7, -4); g.quadraticCurveTo(-4, -6, -2, -4); g.quadraticCurveTo(1, -2, 3, -4); g.quadraticCurveTo(5, -6, 7, -4);   // 波浪（代替四点）
    g.moveTo(-6, 1); g.lineTo(6, 1); g.lineTo(6, 9); g.moveTo(-5, 5); g.lineTo(6, 5); g.moveTo(-6, 9); g.lineTo(6, 9);  // ヨ
    g.stroke(); g.restore();
  }
  function drawFuyukiHouse(g, q, v) {
    var past = v === 'past', R = RFY, i;
    rafterCeil(g, q, R, { base: past ? '#24180e' : '#1a120c' });
    minkaWall(g, q, R, [40, 520, 1290, 1880], { base: past ? '#8a785c' : '#6e604c', tint: past ? null : ['#2a2420', 0.2], seed: 83, nuki: [R.top + 34, 400] });
    // ---- 地面：左侧土间 + 右侧木地板（中间是上框）----
    boardFloor(g, q, R, { base: past ? '#5a3c26' : '#4a3424', seed: 41, boards: byM(q, 16, 22, 28) });
    var kam = -420;   // 上框位置（地面 X）
    var dA = R.fp(kam, 1), dB = R.fp(kam, R.sAt(H));
    K.poly(g, [0, R.bot, dA[0], dA[1], dB[0], H, 0, H]); g.fillStyle = past ? '#5a4c3c' : '#4a4038'; g.fill();
    grain(g, q, 0.5, function (x) { K.poly(x, [0, R.bot, dA[0], dA[1], dB[0], H, 0, H]); });
    g.fillStyle = 'rgba(0,0,0,0.25)'; K.poly(g, [0, R.bot, dA[0], dA[1], dB[0], H, 0, H]); g.fill();
    // 上框（厚木，略高于土间）
    K.poly(g, [dA[0] - 6, dA[1] - 4, dA[0] + 14, dA[1] - 4, dB[0] + 70, H, dB[0] + 20, H]); woodFill(g, q, '#4a2c18', false, dA[0], dA[1], ['#2a1408', 0.2]);
    g.strokeStyle = 'rgba(255,220,170,0.2)'; g.lineWidth = 3; g.beginPath(); g.moveTo(dA[0] + 14, dA[1] - 4); g.lineTo(dB[0] + 70, H); g.stroke();
    // 挂历（1983 年 2 月：时间停在那一年）
    calendar(g, q, 340, 170, 90, 120);
    if (!past && q.model > 0) { g.fillStyle = 'rgba(80,60,40,0.4)'; g.fillRect(340, 170, 90, 120); }
    K.text(g, '1983', 385, 186, 14, '#f4f0e6', { weight: 'bold', font: 'Arial,sans-serif' });

    // ---- 入口（锚点 120-400, 272-800）：格子玻璃拉门 ----
    (function doorway() {
      var x = 134, y = 290, w = 250, h = R.bot + 20 - 290;
      g.fillStyle = '#2a1a0e'; g.fillRect(x - 16, y - 18, w + 32, h + 18);
      // 门外的雪
      snowView(g, q, x, y, w, h, { seed: 43, ground: 0.66 });
      if (!past) {
        // 一扇门被拉开一半，雪吹进土间
        var gx = x + w * 0.48;
        g.beginPath(); g.rect(gx, y, w * 0.52, h); woodFill(g, q, '#4a3020', false, gx, y, ['#2a1408', 0.3]);
        g.fillStyle = 'rgba(150,160,180,0.5)'; for (var p = 0; p < 4; p++) g.fillRect(gx + 14, y + 20 + p * 100, w * 0.52 - 28, 80);
        g.fillStyle = '#1e242e'; g.fillRect(gx + 14, y + 220, w * 0.52 - 28, 80);
        g.strokeStyle = 'rgba(230,240,250,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx + 20, y + 230); g.lineTo(gx + 50, y + 262); g.lineTo(gx + 40, y + 296); g.stroke();
        snowDrift(g, q, [x - 10, R.bot + 30, x + 60, R.bot + 6, x + 160, R.bot + 2, x + 260, R.bot + 20, x + 330, R.bot + 70, x + 120, R.bot + 96, x - 10, R.bot + 80]);
        snowDrift(g, q, [x + 4, y + h, x + 60, y + h - 40, x + 110, y + h - 30, x + 120, y + h], 0.9);
      } else {
        for (var d = 0; d < 2; d++) {
          var dx = x + d * w / 2;
          g.beginPath(); g.rect(dx, y, w / 2, h); g.save(); g.clip();
          g.fillStyle = 'rgba(210,220,235,0.35)'; g.fillRect(dx, y, w / 2, h);
          g.restore();
          g.strokeStyle = '#4a3020'; g.lineWidth = 10; g.strokeRect(dx + 5, y + 5, w / 2 - 10, h - 10);
          g.lineWidth = 5; for (var r = 1; r < 5; r++) { g.beginPath(); g.moveTo(dx, y + r * h / 5); g.lineTo(dx + w / 2, y + r * h / 5); g.stroke(); }
        }
      }
      g.strokeStyle = '#2a1a0e'; g.lineWidth = 14; g.strokeRect(x - 7, y - 7, w + 14, h + 7);
      // 门槛
      g.fillStyle = '#3a2414'; g.fillRect(x - 20, R.bot + 14, w + 40, 12);
    })();
    // ---- 大黑柱（锚点 600-688, 224-736）：身高刀痕与「千雪 三才」----
    (function pillar() {
      var x = 604, w = 80, top = R.top - 30, bot = R.bot + 8;
      g.beginPath(); g.rect(x, top, w, bot - top); woodFill(g, q, '#2a1a10', false, x, 0, ['#140a04', 0.35]);
      g.fillStyle = K.lin(g, x, 0, x + w, 0, ['rgba(255,220,170,0.18)', 'rgba(255,220,170,0.05)', 'rgba(0,0,0,0.45)']); g.fillRect(x, top, w, bot - top);
      if (q.light > 0) { g.fillStyle = 'rgba(255,230,190,0.12)'; g.fillRect(x + 8, top, 6, bot - top); }
      // 刀痕
      var marks = [[600, '一才'], [560, '二才'], [520, '三才']];
      for (var m = 0; m < marks.length; m++) {
        var my = marks[m][0];
        g.strokeStyle = past ? 'rgba(220,180,130,0.9)' : 'rgba(170,130,90,0.75)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + 8, my); g.lineTo(x + 44, my); g.stroke();
        g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 8, my + 2); g.lineTo(x + 44, my + 2); g.stroke();
      }
      // 「千雪 三才」竖写（雪字特制）
      var col = past ? 'rgba(230,190,140,0.95)' : 'rgba(180,140,100,0.85)';
      K.text(g, '千', x + 60, 482, 15, col);
      carvedYuki(g, x + 60, 501, 0.75, col);
      K.text(g, '三', x + 60, 522, 14, col); K.text(g, '才', x + 60, 540, 14, col);
    })();
    // ---- 窗（锚点 1328-1712, 160-424）----
    var wx = 1340, wy = 172, ww = 360, wh = 240;
    g.fillStyle = '#2a1a0e'; g.fillRect(wx - 16, wy - 16, ww + 32, wh + 32);
    if (past) {
      shoji(g, q, wx, wy, ww / 2, wh, { glow: true, cols: 3, rows: 4, frame: '#5a3e26' });
      shoji(g, q, wx + ww / 2, wy, ww / 2, wh, { glow: true, cols: 3, rows: 4, frame: '#5a3e26' });
    } else {
      snowView(g, q, wx, wy, ww, wh, { seed: 47, ground: 0.62 });
      shoji(g, q, wx, wy, ww * 0.45, wh, { glow: false, cols: 3, rows: 4, frame: '#3a2818', torn: byM(q, 1, 3, 4), seed: 9, hole: '#8a92a6' });
      // 一块歪斜的雨户板
      g.save(); g.translate(wx + ww * 0.72, wy + wh * 0.5); g.rotate(0.12);
      g.beginPath(); g.rect(-60, -wh * 0.55, 120, wh * 1.1); woodFill(g, q, '#3a2818', false, 0, 0, ['#1a0c04', 0.4]);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-60, -wh * 0.55, 120, wh * 1.1);
      g.restore();
      snowDrift(g, q, [wx, wy + wh, wx + 60, wy + wh - 12, wx + 140, wy + wh - 4, wx + 160, wy + wh, wx + 160, wy + wh + 4, wx, wy + wh + 4]);
    }
    g.fillStyle = '#3a2414'; g.fillRect(wx - 24, wy + wh + 8, ww + 48, 14);
    // ---- 水屋柜（锚点 1536-1840, 464-856）----
    (function cupboard() {
      var x = 1548, y = 476, w = 284, h = 372;
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.6, 14, 0.6);
      box(g, q, x, y, w, h, 60, { front: '#4a2c18', side: '#2a180c', top: '#5a3a22', fill: function () { woodFill(g, q, '#4a2c18', false, x, y, ['#5a3420', 0.15]); } });
      var gy = y + 16, gh = h * 0.48;
      g.fillStyle = '#1a100a'; g.fillRect(x + 14, gy, w - 28, gh);
      // 碗碟
      var plates = past ? 9 : 4, rnd = K.rng(past ? 3 : 5);
      for (var s = 0; s < 2; s++) {
        var sy = gy + (s + 1) * gh / 2 - 6;
        g.fillStyle = '#4a3020'; g.fillRect(x + 14, sy, w - 28, 6);
        for (var p = 0; p < plates; p++) {
          if (!past && rnd() < 0.3) continue;
          var px = x + 30 + p * (w - 60) / Math.max(1, plates - 1) * (past ? 1 : 2.2), c = rnd.pick(['#e8e4dc', '#d0dce8', '#c8a878', '#e0d8c8']);
          if (px > x + w - 30) continue;
          if (p % 3 === 0) { K.ellipse(g, px, sy - 22, 18, 22); g.fillStyle = c; g.fill(); g.strokeStyle = 'rgba(40,60,120,0.6)'; g.lineWidth = 2; K.ellipse(g, px, sy - 22, 12, 15); g.stroke(); }
          else { g.fillStyle = K.lin(g, px - 16, 0, px + 16, 0, [K.shade(c, 0.1), c, K.shade(c, -0.3)]); K.poly(g, [px - 16, sy - 30, px + 16, sy - 30, px + 11, sy, px - 11, sy]); g.fill(); }
        }
      }
      if (!past && q.model > 0) { g.fillStyle = '#e0dcd4'; K.poly(g, [x + 60, y + h - 4, x + 76, y + h - 12, x + 90, y + h - 2]); g.fill(); K.poly(g, [x + 100, y + h + 2, x + 112, y + h - 6, x + 118, y + h + 4]); g.fill(); }
      // 玻璃拉门（一扇半开）
      g.strokeStyle = '#2a180c'; g.lineWidth = 8; g.strokeRect(x + 14, gy, w - 28, gh); g.beginPath(); g.moveTo(x + w / 2, gy); g.lineTo(x + w / 2, gy + gh); g.stroke();
      if (q.light > 0) { g.save(); g.beginPath(); g.rect(x + 14, gy, w - 28, gh); g.clip(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(220,230,250,0.12)'; K.poly(g, [x + 40, gy, x + 80, gy, x + 20, gy + gh, x - 20, gy + gh]); g.fill(); g.restore(); }
      // 下部抽屉
      for (var d = 0; d < 3; d++) { var dy = gy + gh + 16 + d * 58; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.strokeRect(x + 18, dy, w - 36, 48); g.fillStyle = '#1a1a1e'; g.fillRect(x + w / 2 - 18, dy + 20, 36, 6); }
      // 柜顶的人偶（往昔）/ 歪倒的人偶（现在）
      if (q.model > 0) {
        g.save(); g.translate(x + 60, y - 4); if (!past) g.rotate(-1.3);
        g.fillStyle = '#c02838'; K.poly(g, [-14, 0, 14, 0, 10, -34, -10, -34]); g.fill();
        g.fillStyle = '#f4ece4'; g.beginPath(); g.arc(0, -44, 11, 0, TAU); g.fill(); g.fillStyle = '#141018'; g.beginPath(); g.arc(0, -47, 11, PI, TAU); g.fill(); g.fillRect(-11, -47, 4, 12); g.fillRect(7, -47, 4, 12);
        g.restore();
      }
    })();
    // ---- 自在钩 + 围炉里（锚点 800-1248, 728-888）----
    var ir = irori(g, q, R, -150, 270, 1.1, 1.42, past ? 0.9 : 0, { seed: past ? 7 : 8, gotoku: !past });
    var ket = jizai(g, q, ir[0], 0, ir[1] - (past ? 150 : 110), { kettle: past, rust: !past, ks: 1.05 });
    if (past) {
      if (q.light > 0 && ket) { g.strokeStyle = 'rgba(240,240,250,0.3)'; g.lineWidth = 6; g.beginPath(); g.moveTo(ket[0] + 50, ket[1] + 14); g.bezierCurveTo(ket[0] + 64, ket[1] - 30, ket[0] + 40, ket[1] - 60, ket[0] + 58, ket[1] - 110); g.stroke(); }
      // 炉边烤着的红色小手套与小草鞋
      if (q.model > 0) {
        var mp = R.fp(300, 1.3);
        for (var mI = 0; mI < 2; mI++) { g.fillStyle = '#d02838'; K.path(g, 'M0 0 C-8 -2 -12 -14 -8 -24 C-6 -30 2 -30 4 -24 L6 -16 C10 -20 16 -18 14 -12 C12 -4 8 2 0 0 Z', mp[0] + mI * 30, mp[1], 1.2); g.fill(); g.fillStyle = '#f4f0e8'; g.fillRect(mp[0] - 6 + mI * 30, mp[1] - 4, 14, 5); }
        var sp = R.fp(-200, 1.36);
        for (var sI = 0; sI < 2; sI++) { g.fillStyle = '#c8a860'; K.ellipse(g, sp[0] + sI * 34, sp[1], 13, 7, 0.2); g.fill(); g.strokeStyle = '#d02838'; g.lineWidth = 2; g.beginPath(); g.arc(sp[0] + sI * 34, sp[1] - 2, 6, PI, TAU); g.stroke(); }
      }
    } else if (q.model >= 2) {
      cobweb(g, 0, R.top, 160, 0, PI / 2, 0.2); cobweb(g, W, R.top, 140, PI / 2, PI, 0.18); cobweb(g, 684, R.top, 70, 0, PI / 2, 0.16);
      // 灰尘覆盖的地面痕迹 + 倒下的木凳
      var st = R.fp(480, 1.25);
      g.fillStyle = '#3a2618'; g.save(); g.translate(st[0], st[1]); g.rotate(0.3); g.fillRect(-50, -12, 100, 16); g.fillRect(-40, 4, 10, 36); g.fillRect(30, 4, 10, 36); g.restore();
    }

    // ================= 光照 =================
    var L = lightMap(q, past ? '#7a6e72' : '#5e6070');
    if (past) {
      lmLight(L, ir[0], ir[1] - 40, 820, '#ffb070', 0.85, 0.8);
      lmLight(L, 1520, 300, 600, '#fff4e0', 0.45, 0.9);
      lmLight(L, 259, 520, 400, '#d8e0f0', 0.3, 1);
    } else {
      lmLight(L, 1520, 300, 560, '#c8d4ec', 0.5, 0.9);
      lmLight(L, 259, 540, 520, '#d0dcf0', 0.5, 1);
      lmLight(L, 300, 900, 420, '#c8d4ec', 0.35, 0.4);
    }
    if (q.light > 0) {
      lmDark(L, 0.3, function (x) { x.beginPath(); x.rect(0, 0, W, 80); });
      lmDark(L, 0.2, function (x) { x.beginPath(); x.rect(W - 60, 0, 60, H); });
    }
    if (q.light >= 2 && past) lmShade(L, 0.4, function (x) { K.poly(x, [604, 300, 684, 300, 760, 760, 680, 760]); });
    applyLM(g, L);
    if (q.light > 0) {
      if (past) { K.glow(g, ir[0], ir[1], 240, '#ff8a3a', 0.35); K.glow(g, 1520, 290, 260, '#fff0d8', 0.15); }
      else { K.glow(g, 259, 520, 220, '#c8d4ec', 0.15); }
    }
    if (q.light >= 2) {
      if (past) dust(g, K.rng(81), byM(q, 10, 20, 30), ir[0] - 200, ir[1] - 360, 400, 340, '#ffd8a0', 0.5);
      else { softShaft(g, [140, 300, 380, 300, 520, 1000, 60, 1000], '#dce6fa', 0.1, 259, 320, 259, 1000, 5); dust(g, K.rng(82), byM(q, 10, 22, 34), 120, 320, 400, 600, '#eef4ff', 0.45); }
    }
    finish(g, q, past ? 0.5 : 0.6, 0.45);
  }
  DM.HDBG.def('fuyuki_house', {
    draw: drawFuyukiHouse,
    lights: function (v) {
      return v === 'past' ? [
        { x: 1024, y: 760, r: 260, color: '#ff8a3a', i: 0.7, flicker: 0.45, kind: 'fire' },
        { x: 1520, y: 292, r: 220, color: '#fff0d8', i: 0.3, flicker: 0, kind: 'window' }
      ] : [
        { x: 259, y: 520, r: 220, color: '#d0dcf0', i: 0.3, flicker: 0, kind: 'window' },
        { x: 1520, y: 292, r: 200, color: '#c8d4ec', i: 0.25, flicker: 0, kind: 'window' }
      ];
    },
    key: function (v) { return v === 'past' ? { x: 0.1, color: '#ffc890', amb: '#2e2830', rim: 0.5 } : { x: -0.5, color: '#d0d8ec', amb: '#26283a', rim: 0.55 }; },
    outdoor: false
  });

  /* =================================================================
   * 炭烧小屋 charcoal_hut；variant 'past' = 1983 年有人住：炭窑有火、草席床铺、木板上的炭字、收音机
   * ================================================================= */
  var RCH2 = Room({ hy: 430, top: 92, bot: 770 });
  function drawCharcoalHut(g, q, v) {
    var past = v === 'past', R = RCH2, i, rnd = K.rng(past ? 9901 : 9902);
    rafterCeil(g, q, R, { base: '#140e0a', thatch: true });
    // 粗木板墙（竖向，缝里透出冷光）
    K.poly(g, [0, R.top, W, R.top, W, R.bot, 0, R.bot]); woodFill(g, q, '#3a2a1c', false, 0, 0, ['#140c06', past ? 0.35 : 0.5]);
    var pw = 92;
    for (var x = 0; x < W; x += pw) {
      var j = (x * 13 % 7) - 3;
      g.fillStyle = past ? 'rgba(10,6,4,0.8)' : 'rgba(150,165,190,0.55)'; g.fillRect(x - 1.5, R.top, 3, R.bot - R.top);
      g.fillStyle = 'rgba(255,220,180,0.06)'; g.fillRect(x + 2, R.top, 3, R.bot - R.top);
      g.fillStyle = 'rgba(0,0,0,' + (0.1 + (x * 7 % 5) * 0.04).toFixed(2) + ')'; g.fillRect(x, R.top, pw, R.bot - R.top);
      void j;
    }
    g.fillStyle = K.lin(g, 0, R.top, 0, 420, ['rgba(0,0,0,0.65)', 'rgba(0,0,0,0)']); g.fillRect(0, R.top, W, 330);   // 熏黑
    for (var cb = 0; cb < 2; cb++) { var yy = cb ? 600 : 300; g.beginPath(); g.rect(0, yy - 12, W, 24); woodFill(g, q, '#2a1c10', true, 0, yy, ['#0a0604', 0.4]); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, yy + 12, W, 5); }
    // 地面：土间
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]); g.fillStyle = past ? '#4a3e32' : '#3e3630'; g.fill();
    grain(g, q, 0.55, function (x2) { K.poly(x2, [0, R.bot, W, R.bot, W, H, 0, H]); });
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]); g.fillStyle = K.lin(g, 0, R.bot, 0, H, ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']); g.fill();
    if (q.model > 0) { for (i = 0; i < byM(q, 0, 20, 40); i++) { var cp = R.fp((rnd() - 0.5) * 1700, 1 + rnd() * 0.8); g.fillStyle = 'rgba(10,8,8,0.6)'; K.ellipse(g, cp[0], cp[1], 3 + rnd() * 6, 2 + rnd() * 2); g.fill(); } }

    // ---- 神棚（锚点 880-1120, 72-184）----
    (function kamidana() {
      var x = 890, y = 132, w = 220;
      g.fillStyle = '#5a4630'; g.fillRect(x - 10, y + 40, w + 20, 12);
      g.fillStyle = '#2a1c10'; K.poly(g, [x, y + 52, x + 16, y + 52, x + 6, y + 80]); g.fill(); K.poly(g, [x + w, y + 52, x + w - 16, y + 52, x + w - 6, y + 80]); g.fill();
      // 小宫
      var sx = x + w / 2;
      g.fillStyle = K.lin(g, sx - 36, 0, sx + 36, 0, past ? ['#c8a878', '#a08058'] : ['#7a6a52', '#5a4a38']); g.fillRect(sx - 30, y - 6, 60, 46);
      g.fillStyle = past ? '#3a2a1c' : '#2a1e14'; K.poly(g, [sx - 44, y - 4, sx + 44, y - 4, sx + 30, y - 26, sx - 30, y - 26]); g.fill();
      g.fillStyle = '#1a120c'; g.fillRect(sx - 12, y + 6, 24, 32);
      // 榊（往昔鲜绿，现在枯黄）
      for (var s = 0; s < 2; s++) {
        var vx = s ? x + w - 30 : x + 30;
        g.fillStyle = '#e8e4dc'; g.fillRect(vx - 7, y + 18, 14, 22);
        for (var l = 0; l < 6; l++) { var la = -PI / 2 + (l - 2.5) * 0.35; g.fillStyle = past ? '#2a6a3a' : '#7a6a40'; K.ellipse(g, vx + Math.cos(la) * 16, y + 14 + Math.sin(la) * 18, 8, 4, la); g.fill(); }
      }
      // 注连绳 + 纸垂
      g.strokeStyle = past ? '#d8c898' : '#8a7a5a'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 6, y - 30); g.quadraticCurveTo(sx, y - 14, x + w + 6, y - 30); g.stroke();
      g.fillStyle = past ? '#f8f8f0' : '#b8b0a0';
      for (var sd = 0; sd < 4; sd++) { var dx = x + 30 + sd * 54, dy = y - 22 + Math.abs(sd - 1.5) * -3; K.poly(g, [dx, dy, dx + 8, dy, dx + 8, dy + 10, dx + 2, dy + 10, dx + 2, dy + 20, dx + 9, dy + 20, dx + 9, dy + 30, dx, dy + 30]); g.fill(); }
      if (!past && q.model >= 2) cobweb(g, x + w + 10, y + 52, 50, PI * 0.5, PI, 0.18);
    })();
    // ---- 炭窑（锚点 64-480, 352-800）：石与黏土砌的窑口 ----
    var kilnGlow;
    (function kiln() {
      var cx = 272, base = R.bot + 30, top = 372, hw = 200;
      // 窑体（圆拱外形）
      g.beginPath(); g.moveTo(cx - hw, base); g.lineTo(cx - hw, top + 150); g.bezierCurveTo(cx - hw, top - 10, cx + hw, top - 10, cx + hw, top + 150); g.lineTo(cx + hw, base); g.closePath();
      g.save(); g.clip();
      g.fillStyle = past ? '#6a5446' : '#4a3e36'; g.fillRect(cx - hw, top - 20, hw * 2, base - top + 20);
      // 石块
      var kr = K.rng(77);
      for (var r = 0; r < 9; r++) for (var c = 0; c < 7; c++) {
        var bx = cx - hw + c * 62 + (r % 2) * 30 - 10, by = top + r * 48, bw = 50 + kr() * 16, bh = 38 + kr() * 8;
        K.rr(g, bx, by, bw, bh, 10); g.fillStyle = K.mix(past ? '#7a6656' : '#5a4e46', past ? '#9a8470' : '#7a6e64', kr()); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(bx + 4, by + bh - 6, bw - 8, 5);
      }
      grain(g, q, 0.4, function (x2) { x2.beginPath(); x2.rect(cx - hw, top - 20, hw * 2, base - top + 20); });
      // 黏土抹面 + 烟熏
      g.fillStyle = K.lin(g, 0, top, 0, base, ['rgba(20,12,8,0.7)', 'rgba(60,40,28,0.25)', 'rgba(20,12,8,0.4)']); g.fillRect(cx - hw, top - 20, hw * 2, base - top + 20);
      g.restore();
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - hw, base); g.lineTo(cx - hw, top + 150); g.bezierCurveTo(cx - hw, top - 10, cx + hw, top - 10, cx + hw, top + 150); g.lineTo(cx + hw, base); g.stroke();
      // 窑口（拱形）
      var mx = cx, my = base - 10, mw = 120, mh = 190;
      g.beginPath(); g.moveTo(mx - mw / 2, my); g.lineTo(mx - mw / 2, my - mh + 50); g.quadraticCurveTo(mx - mw / 2, my - mh, mx, my - mh); g.quadraticCurveTo(mx + mw / 2, my - mh, mx + mw / 2, my - mh + 50); g.lineTo(mx + mw / 2, my); g.closePath();
      g.fillStyle = '#0a0606'; g.fill();
      g.save(); g.clip();
      if (past) {
        g.fillStyle = K.rad(g, mx, my - 50, 6, mh, ['#fff0a0', '#ffa030', '#c04010', '#300804']); g.fillRect(mx - mw / 2, my - mh, mw, mh);
        flameShape(g, mx - 20, my - 20, 90, 1); flameShape(g, mx + 22, my - 18, 70, 0.95); flameShape(g, mx, my - 30, 110, 0.9);
        // 半掩的铁门
        g.fillStyle = ironGrad(g, mx + 10, 0, mx + mw / 2, 0); g.fillRect(mx + 16, my - mh, mw / 2, mh);
      } else {
        // 冷掉的窑口：掉落的砖与灰
        g.fillStyle = '#1a1614'; g.fillRect(mx - mw / 2, my - mh, mw, mh);
        g.fillStyle = '#3a3634'; K.ellipse(g, mx, my - 6, mw * 0.5, 16); g.fill();
        for (var bI = 0; bI < 5; bI++) { g.fillStyle = '#5a4e46'; K.rr(g, mx - 50 + bI * 22, my - 30 - (bI % 2) * 12, 26, 16, 4); g.fill(); }
        // 生锈的铁门斜靠着
        g.save(); g.translate(mx + mw * 0.45, my); g.rotate(0.18); g.fillStyle = K.lin(g, -40, 0, 20, 0, ['#4a2e1e', '#6a4a30', '#2a1a10']); g.fillRect(-46, -150, 60, 150); g.restore();
      }
      g.restore();
      kilnGlow = [mx, my - 70];
      // 窑口的砖拱
      g.strokeStyle = past ? '#8a6a50' : '#5a4a3e'; g.lineWidth = 16; g.beginPath(); g.moveTo(mx - mw / 2 - 8, my); g.lineTo(mx - mw / 2 - 8, my - mh + 50); g.quadraticCurveTo(mx - mw / 2 - 8, my - mh - 10, mx, my - mh - 10); g.quadraticCurveTo(mx + mw / 2 + 8, my - mh - 10, mx + mw / 2 + 8, my - mh + 50); g.lineTo(mx + mw / 2 + 8, my); g.stroke();
      if (past && q.light > 0) { g.strokeStyle = 'rgba(255,170,80,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(mx - mw / 2, my); g.lineTo(mx - mw / 2, my - mh + 50); g.quadraticCurveTo(mx - mw / 2, my - mh, mx, my - mh); g.stroke(); }
      // 窑顶的裂缝（往昔里透出红光）
      if (q.model > 0) { g.strokeStyle = past ? 'rgba(255,120,40,0.85)' : 'rgba(0,0,0,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx - 60, top + 30); g.lineTo(cx - 40, top + 70); g.lineTo(cx - 52, top + 110); g.moveTo(cx + 70, top + 50); g.lineTo(cx + 84, top + 90); g.stroke(); }
      // 窑前堆着的炭袋 / 柴
      if (q.model > 0) { g.fillStyle = past ? '#6a5a3a' : '#4a4030'; K.path(g, 'M0 0 C-4 -40 4 -60 30 -62 C56 -60 62 -40 58 0 Z', 430, base + 6, 1); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.stroke(); }
    })();
    // ---- 铁箱（锚点 384-592, 824-936）----
    (function ironBox() {
      var x = 394, y = 838, w = 190, h = 86;
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.6, 10, 0.7);
      box(g, q, x, y, w, h, 60, { front: '#4a3022', side: '#2a1a12', top: '#5a3e2c' });
      g.fillStyle = K.lin(g, x, y, x + w, y + h, ['#6a4a34', '#3a2418', '#1e120a']); g.fillRect(x, y, w, h);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, 'noise', { c1: '#383838', c2: '#c8c8c8', scale: 16, oct: 4, seed: 37, contrast: 1.3 }, 256, 0, 0, 0.6); g.restore(); }
      g.fillStyle = 'rgba(160,80,40,0.4)'; g.fillRect(x + 20, y + 10, 40, h - 20); g.fillRect(x + w - 60, y + 30, 30, h - 40);
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 18); g.lineTo(x + w, y + 18); g.stroke();
      // 挂锁（现在：一把新的亮锁）
      var lx = x + w / 2, ly = y + 30;
      g.strokeStyle = past ? '#5a4a3a' : '#c8ccd4'; g.lineWidth = 4; g.beginPath(); g.arc(lx, ly - 4, 8, PI, TAU); g.stroke();
      g.fillStyle = past ? K.lin(g, lx - 10, 0, lx + 10, 0, ['#6a5030', '#3a2810']) : K.lin(g, lx - 10, 0, lx + 10, 0, ['#e8d088', '#a08030']); K.rr(g, lx - 11, ly - 4, 22, 22, 3); g.fill();
      g.fillStyle = '#1a1208'; g.fillRect(lx - 1.5, ly + 4, 3, 8);
      g.fillStyle = '#2a1a10'; g.fillRect(x + 14, y + 4, 16, 8); g.fillRect(x + w - 30, y + 4, 16, 8);
    })();
    // ---- 收音机（锚点 544-704, 600-712）：倒扣木箱上的旧电池收音机 ----
    (function radio() {
      var x = 552, y = 616, w = 146, h = 92, crateTop = y + h;
      if (q.light > 0) K.contact(g, x + w / 2, R.bot + 54, 90, 12, 0.6);
      box(g, q, x - 10, crateTop, w + 20, R.bot + 50 - crateTop, 50, { front: '#5a4430', side: '#3a2c1c', top: '#6a5038', fill: function () { woodFill(g, q, '#5a4430', true, x, crateTop, ['#6a5038', 0.2]); } });
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, crateTop + 50); g.lineTo(x + w + 10, crateTop + 50); g.stroke();
      g.fillStyle = K.lin(g, 0, y, 0, y + h, ['#8a6a48', '#5a4028', '#3a2814']); K.rr(g, x, y, w, h, 10); g.fill();
      g.fillStyle = K.lin(g, 0, y + 10, 0, y + 70, ['#d8c8a0', '#a08a60']); K.rr(g, x + 10, y + 12, 70, 66, 6); g.fill();
      if (q.model > 0) { g.strokeStyle = 'rgba(90,70,40,0.6)'; g.lineWidth = 1.2; for (var l = 0; l < 8; l++) { g.beginPath(); g.moveTo(x + 14, y + 18 + l * 8); g.lineTo(x + 76, y + 18 + l * 8); g.stroke(); } }
      g.fillStyle = past ? '#ffd890' : '#c8b890'; g.fillRect(x + 88, y + 14, 48, 22);
      g.strokeStyle = '#a02020'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 104, y + 16); g.lineTo(x + 104, y + 34); g.stroke();
      for (var k = 0; k < 2; k++) { var kx = x + 100 + k * 24; g.beginPath(); g.arc(kx, y + 58, 9, 0, TAU); g.fillStyle = K.rad(g, kx - 3, y + 55, 1, 10, ['#e8e0d0', '#5a4a3a']); g.fill(); }
      g.strokeStyle = '#3a3a40'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w - 14, y); g.lineTo(x + w + 30, y - 76); g.stroke();
      g.strokeStyle = '#2a1a0e'; g.lineWidth = 4; g.beginPath(); g.arc(x + w / 2, y + 2, 34, PI * 1.1, PI * 1.9); g.stroke();
      if (past && q.light > 0) K.glow(g, x + 112, y + 25, 30, '#ffc870', 0.3);
    })();
    // ---- 搁板（锚点 704-1088, 264-496）----
    (function shelf() {
      var x = 712, w = 370, ys = [380, 486];
      for (var s = 0; s < ys.length; s++) {
        var sy = ys[s];
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 6, sy + 12, w, 10);
        g.fillStyle = K.lin(g, 0, sy, 0, sy + 14, ['#6a5038', '#3a2a1c']); g.fillRect(x, sy, w, 14);
        g.fillStyle = '#2a1c10'; K.poly(g, [x + 20, sy + 14, x + 34, sy + 14, x + 24, sy + 44]); g.fill(); K.poly(g, [x + w - 20, sy + 14, x + w - 34, sy + 14, x + w - 24, sy + 44]); g.fill();
      }
      var sr = K.rng(past ? 11 : 12);
      // 上层：瓶罐、药草束
      var items = past ? 7 : 4;
      for (var it = 0; it < items; it++) {
        var ix = x + 20 + it * (w - 40) / items, c = sr.pick(['#5a3a20', '#8a7a5a', '#2a3a2a', '#c8b898', '#6a2a1a']);
        if (it % 3 === 0) { g.fillStyle = K.lin(g, ix, 0, ix + 30, 0, [K.shade(c, 0.2), c, K.shade(c, -0.4)]); K.path(g, 'M2 0 C-2 -20 4 -40 15 -42 C26 -40 32 -20 28 0 Z', ix, 380, 1); g.fill(); g.fillStyle = '#e8dcc0'; g.fillRect(ix + 10, 380 - 50, 10, 10); }
        else if (it % 3 === 1) { g.fillStyle = K.lin(g, ix, 0, ix + 26, 0, ['#9a9ea4', '#d0d4d8', '#6a6e74']); g.fillRect(ix, 380 - 36, 26, 36); g.fillStyle = 'rgba(160,80,40,0.4)'; g.fillRect(ix, 380 - 20, 26, 8); }
        else { g.fillStyle = 'rgba(200,220,230,0.5)'; g.fillRect(ix + 4, 380 - 46, 16, 46); g.fillStyle = 'rgba(120,80,40,0.6)'; g.fillRect(ix + 4, 380 - 26, 16, 26); }
      }
      if (past && q.model > 0) { for (var h2 = 0; h2 < 3; h2++) { var hx = x + 60 + h2 * 120; g.strokeStyle = '#5a6a3a'; g.lineWidth = 3; for (var st = -2; st <= 2; st++) { g.beginPath(); g.moveTo(hx, 394); g.lineTo(hx + st * 6, 450); g.stroke(); } g.fillStyle = '#c8a860'; g.fillRect(hx - 6, 392, 12, 6); } }
      // 下层：煤油灯（往昔点着放在架上）、斧头靠墙、布包
      g.fillStyle = '#3a3a40'; g.fillRect(x + 280, 486 - 10, 40, 10);
      g.fillStyle = 'rgba(220,230,240,0.5)'; K.path(g, 'M0 0 C-14 -10 -14 -40 0 -54 C14 -40 14 -10 0 0 Z', x + 300, 476, 1); g.fill();
      if (past) { flameShape(g, x + 300, 456, 20, 1); }
      g.fillStyle = '#6a5a40'; K.path(g, 'M0 0 C-8 -24 6 -40 30 -38 C52 -36 58 -20 50 0 Z', x + 60, 486, 1); g.fill();
    })();
    // 木板上的炭字（往昔）
    if (past) {
      var bx0 = 744, by0 = 560, bw = 150, bh = 200;
      g.save(); g.translate(bx0 + bw / 2, by0 + bh / 2); g.rotate(-0.08);
      if (q.light > 0) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(-bw / 2 + 8, -bh / 2 + 8, bw, bh); }
      g.beginPath(); g.rect(-bw / 2, -bh / 2, bw, bh); woodFill(g, q, '#8a6a48', false, 0, 0, ['#a07a50', 0.25]);
      var words = ['为', '什', '么', '救', '我'];
      for (var wI = 0; wI < words.length; wI++) { g.save(); g.translate(-30 + (wI % 2) * 34, -70 + wI * 34); g.rotate((wI * 37 % 7 - 3) * 0.06); K.text(g, words[wI], 0, 0, 30 + (wI % 3) * 3, 'rgba(20,16,14,0.85)'); g.restore(); }
      g.restore();
    }
    // ---- 火钵（锚点 880-1120, 768-912）----
    var brz;
    (function brazier() {
      var cx = 1000, cy = 852, rw = 104, rh = 30;
      if (q.light > 0) K.contact(g, cx, cy + 50, rw * 1.1, 16, 0.65);
      g.fillStyle = K.lin(g, cx - rw, 0, cx + rw, 0, ['#4a3e34', '#7a6a5c', '#3a3028']);
      g.beginPath(); g.moveTo(cx - rw, cy); g.quadraticCurveTo(cx - rw - 4, cy + 50, cx - rw * 0.8, cy + 56); g.lineTo(cx + rw * 0.8, cy + 56); g.quadraticCurveTo(cx + rw + 4, cy + 50, cx + rw, cy); g.closePath(); g.fill();
      K.ellipse(g, cx, cy, rw, rh); g.fillStyle = '#5a4c40'; g.fill();
      K.ellipse(g, cx, cy + 2, rw * 0.84, rh * 0.74); g.fillStyle = past ? '#7a6e64' : '#6a6460'; g.fill();
      var br = K.rng(31);
      for (var c = 0; c < byM(q, 5, 9, 14); c++) {
        var px = cx + (br() - 0.5) * rw * 0.9, py = cy + (br() - 0.5) * rh * 0.5, r = 6 + br() * 6;
        g.fillStyle = '#1a1210'; K.ellipse(g, px, py, r * 1.3, r * 0.7); g.fill();
        if (past) { g.fillStyle = br() < 0.6 ? 'rgba(255,140,40,0.95)' : 'rgba(200,60,20,0.85)'; K.ellipse(g, px, py + 1, r * 0.8, r * 0.35); g.fill(); }
      }
      if (past) {
        if (q.light > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = K.rad(g, cx, cy, 2, rw, [[0, 'rgba(255,150,60,0.5)'], [1, 'rgba(255,100,30,0)']]); g.fillRect(cx - rw, cy - rw, rw * 2, rw * 2); g.restore(); }
        // 小锅
        g.fillStyle = K.lin(g, cx - 44, 0, cx + 44, 0, ['#3a3a40', '#6a6a72', '#1a1a1e']); K.path(g, 'M-40 0 C-42 -28 42 -28 40 0 Z', cx + 6, cy - 6, 1); g.fill();
        g.strokeStyle = '#2a2a2e'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 40, cy - 14); g.lineTo(cx - 66, cy - 20); g.stroke();
        if (q.light > 0) { g.strokeStyle = 'rgba(240,240,250,0.3)'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + 10, cy - 30); g.bezierCurveTo(cx + 24, cy - 70, cx, cy - 100, cx + 14, cy - 150); g.stroke(); }
      }
      brz = [cx, cy];
    })();
    // ---- 床铺（锚点 1184-1864, 704-904）+ 地板（锚点 1248-1648, 912-1016）----
    (function bed() {
      var x0 = 1190, x1 = 1858, topY = 760, front = 880;
      // 木台
      quad(g, [x0 + 30, topY - 40], [x1 - 6, topY - 40], [x1, topY], [x0, topY]); woodFill(g, q, '#5a4430', true, x0, topY, ['#3a2a1a', 0.2]);
      g.beginPath(); g.rect(x0, topY, x1 - x0, front - topY); woodFill(g, q, '#4a3624', true, x0, topY, ['#2a1a0e', 0.25]);
      g.fillStyle = K.lin(g, 0, topY, 0, front, ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']); g.fillRect(x0, topY, x1 - x0, front - topY);
      for (var p = 0; p < 3; p++) { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, topY + 30 + p * 30); g.lineTo(x1, topY + 30 + p * 30); g.stroke(); }
      // 草席
      quad(g, [x0 + 50, topY - 38], [x1 - 20, topY - 38], [x1 - 10, topY - 4], [x0 + 20, topY - 4]);
      g.fillStyle = past ? '#b8a46a' : '#6a5e40'; g.fill();
      if (q.tex > 0) { g.save(); g.clip(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'tatami', { c1: '#a09a80', c2: '#ffffff', seed: 29 }, 128, 0, 0, 0.7); g.restore(); }
      if (past) {
        // 叠好的被褥 + 枕
        K.rr(g, x0 + 340, topY - 92, 260, 70, 12); g.fillStyle = K.lin(g, 0, topY - 92, 0, topY - 22, ['#5a6a8a', '#3a4a6a', '#2a3450']); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + 350, topY - 60); g.lineTo(x0 + 590, topY - 60); g.stroke();
        K.rr(g, x0 + 90, topY - 64, 120, 38, 14); g.fillStyle = K.lin(g, 0, topY - 64, 0, topY - 26, ['#e8e0c8', '#b8ac90']); g.fill();
        if (q.model > 0) { K.rr(g, x0 + 380, topY - 116, 180, 30, 8); g.fillStyle = '#8a3a2a'; g.fill(); }
      } else {
        // 霉烂的草席、撕破的毯子
        if (q.model > 0) { g.fillStyle = 'rgba(30,24,16,0.5)'; for (var hI = 0; hI < 5; hI++) { K.ellipse(g, x0 + 120 + hI * 120, topY - 20, 40, 10, 0.1); g.fill(); } }
        g.fillStyle = '#3a3a44'; K.poly(g, [x0 + 300, topY - 34, x0 + 520, topY - 40, x0 + 560, topY + 30, x0 + 480, topY + 70, x0 + 420, topY + 40, x0 + 330, topY + 20]); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.stroke();
      }
      // 床前的地板：一块松动的木板（锚点 1248-1648, 912-1016）
      var fy0 = 908, fy1 = 1012;
      for (var b = 0; b < 4; b++) {
        var by = fy0 + b * 26, loose = b === 2;
        g.save(); if (loose) { g.translate(0, -4); }
        quad(g, [1240 - b * 4, by], [1660 + b * 6, by], [1666 + b * 6, by + 24], [1236 - b * 4, by + 24]);
        woodFill(g, q, '#4a3626', true, 1240, by, [loose ? '#2a1c12' : '#3a2a1a', loose ? 0.1 : 0.25]);
        if (loose) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(1236, by + 24, 436, 6); g.fillStyle = 'rgba(255,220,180,0.18)'; g.fillRect(1240, by, 424, 2); }
        g.restore();
        g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(1236 - b * 4, by + 24); g.lineTo(1668 + b * 6, by + 24); g.stroke();
        rivet(g, q, 1270, by + 12, 3, true); if (!loose) rivet(g, q, 1630, by + 12, 3, true);
      }
    })();
    // ---- 窗（锚点 1536-1840, 160-392）：小格子窗 ----
    var wx = 1548, wy = 172, ww = 280, wh = 208;
    g.fillStyle = '#1a120a'; g.fillRect(wx - 14, wy - 14, ww + 28, wh + 28);
    snowView(g, q, wx, wy, ww, wh, { seed: 53, ground: 0.72, night: false, bldg: function (x, y, w, h, gy) {
      // 山下远处的村子（几点暖灯）
      var n = past ? 9 : 3, lr = K.rng(5);
      for (var k = 0; k < n; k++) { g.fillStyle = 'rgba(255,200,120,0.9)'; g.fillRect(x + 20 + lr() * (w - 40), gy - 4 - lr() * 10, 3, 3); }
    } });
    if (past) { shoji(g, q, wx, wy, ww * 0.5, wh, { glow: true, cols: 2, rows: 3, frame: '#3a2818' }); }
    windowFrame(g, q, wx, wy, ww, wh, { frame: '#3a2818', cols: past ? 2 : 3, rows: 3, fw: 9 });
    if (!past) {
      g.save(); g.translate(wx + ww * 0.6, wy + wh * 0.4); g.rotate(-0.25);
      g.beginPath(); g.rect(-150, -18, 300, 36); woodFill(g, q, '#4a3624', true, 0, 0, ['#2a1c10', 0.3]); rivet(g, q, -130, 0, 4, true); rivet(g, q, 130, 0, 4, true);
      g.restore();
      snowDrift(g, q, [wx, wy + wh, wx + 80, wy + wh - 10, wx + 200, wy + wh - 6, wx + ww, wy + wh, wx + ww, wy + wh + 4, wx, wy + wh + 4]);
      snowDrift(g, q, [1600, R.bot + 10, 1700, R.bot - 4, 1820, R.bot + 6, 1880, R.bot + 26, 1720, R.bot + 34]);
    }
    // 吊着的煤油灯（往昔点着）
    var lamp = [1000, 236];
    (function hangLamp() {
      g.strokeStyle = '#1a1210'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(lamp[0], R.top - 10); g.lineTo(lamp[0], lamp[1] - 40); g.stroke();
      g.fillStyle = '#3a3a40'; K.ellipse(g, lamp[0], lamp[1] - 40, 22, 5); g.fill();
      g.fillStyle = past ? 'rgba(255,220,150,0.75)' : 'rgba(150,150,160,0.4)'; K.path(g, 'M0 0 C-18 -10 -18 -36 0 -48 C18 -36 18 -10 0 0 Z', lamp[0], lamp[1] + 10, 1); g.fill();
      if (past) flameShape(g, lamp[0], lamp[1], 16, 1);
      g.fillStyle = '#4a3a20'; K.ellipse(g, lamp[0], lamp[1] + 14, 20, 8); g.fill();
      if (!past) { g.strokeStyle = 'rgba(220,230,240,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(lamp[0] - 8, lamp[1] - 30); g.lineTo(lamp[0] + 4, lamp[1] - 16); g.lineTo(lamp[0] - 2, lamp[1] - 4); g.stroke(); }
    })();
    if (!past && q.model >= 2) { cobweb(g, 0, R.top, 170, 0, PI / 2, 0.2); cobweb(g, W, R.top, 150, PI / 2, PI, 0.18); cobweb(g, 1088, 380, 60, 0, PI / 2, 0.16); }

    // ================= 光照 =================
    var L = lightMap(q, past ? '#5e545a' : '#565868');
    if (past) {
      lmLight(L, kilnGlow[0], kilnGlow[1], 760, '#ff9a50', 0.95, 0.85);
      lmLight(L, brz[0], brz[1] - 30, 520, '#ffa860', 0.6, 0.7);
      lmLight(L, lamp[0], lamp[1], 520, '#ffd090', 0.5, 0.9);
      lmLight(L, 1688, 280, 360, '#fff0d8', 0.25, 1);
    } else {
      lmLight(L, 1688, 290, 620, '#c8d4ec', 0.6, 0.9);
      lmLight(L, 1500, 880, 480, '#c0cce4', 0.35, 0.4);
      lmLight(L, 700, 500, 800, '#a8b4cc', 0.2, 0.7);
    }
    if (q.light > 0) {
      lmDark(L, 0.35, function (x2) { x2.beginPath(); x2.rect(0, 0, W, R.top + 40); });
      lmDark(L, 0.2, function (x2) { x2.beginPath(); x2.rect(0, 0, 50, H); x2.rect(W - 50, 0, 50, H); });
    }
    if (q.light >= 2) {
      if (past) lmShade(L, 0.4, function (x2) { K.poly(x2, [560, 710, 700, 710, 900, 900, 600, 900]); });
      else lmShade(L, 0.3, function (x2) { for (var k = 0; k < 3; k++) x2.rect(1400 + k * 90, 820, 8, 200); });
    }
    applyLM(g, L);
    if (q.light > 0) {
      if (past) { K.glow(g, kilnGlow[0], kilnGlow[1], 280, '#ff8a3a', 0.45); K.glow(g, brz[0], brz[1], 160, '#ff8a3a', 0.3); K.glow(g, lamp[0], lamp[1] - 6, 120, '#ffc870', 0.4); }
      else K.glow(g, 1688, 280, 220, '#c8d4ec', 0.15);
    }
    if (q.light >= 2) {
      if (past) dust(g, K.rng(91), byM(q, 10, 20, 30), 100, 300, 500, 500, '#ffc890', 0.5);
      else { softShaft(g, [1556, 190, 1820, 190, 1700, 1000, 1240, 1000], '#dce6fa', 0.1, 1688, 210, 1480, 1000, 5); dust(g, K.rng(92), byM(q, 10, 20, 30), 1250, 260, 560, 640, '#eef4ff', 0.45); }
    }
    finish(g, q, 0.6, 0.42);
  }
  DM.HDBG.def('charcoal_hut', {
    draw: drawCharcoalHut,
    lights: function (v) {
      return v === 'past' ? [
        { x: 272, y: 690, r: 260, color: '#ff8a3a', i: 0.75, flicker: 0.5, kind: 'fire' },
        { x: 1000, y: 830, r: 170, color: '#ff8a3a', i: 0.5, flicker: 0.4, kind: 'fire' },
        { x: 1000, y: 232, r: 140, color: '#ffc870', i: 0.5, flicker: 0.3, kind: 'lamp' }
      ] : [{ x: 1688, y: 280, r: 200, color: '#c8d4ec', i: 0.3, flicker: 0, kind: 'window' }];
    },
    key: function (v) { return v === 'past' ? { x: -0.5, color: '#ffb070', amb: '#2a2028', rim: 0.6 } : { x: 0.55, color: '#ccd6ec', amb: '#24263a', rim: 0.55 }; },
    outdoor: false
  });

  /* =================================================================
   * 裁屋 sabakiya（审判背景）：茅草顶的古老会所，中央下沉的围炉里与自在钩，围成一圈的坐垫，
   * 长老席、记录箱、计票板。审判时引擎把本图与其水平镜像拼成全景：
   * 左右边缘各是一根柱子的中心；墙脚与椽子用以 W 为周期的余弦/正弦曲线，地板接缝水平，所以镜像处连续。
   * ================================================================= */
  var SBR = { hy: 430, bot: 612, top: 0 };
  SBR.fp = function (X, s) { return [960 + X * s, SBR.hy + (SBR.bot - SBR.hy) * s]; };
  SBR.sAt = function (y) { return (y - SBR.hy) / (SBR.bot - SBR.hy); };
  function sbBase(x) { return 640 + 28 * Math.cos(x / W * TAU); }          // 中心 612，边缘 668（边缘斜率为 0）
  function sbEave(x) { return 214 + 22 * Math.cos(x / W * TAU); }          // 墙顶（梁下）：中心 192，边缘 236
  function sbCos(x) { return Math.cos(x / W * TAU); }
  function sbSin(x) { return Math.sin(x / W * TAU); }
  var SB_POSTS = [0, 330, 660, 1260, 1500, 1920];

  function drawSabakiya(g, q) {
    var i, rnd = K.rng(1203);
    // ---- 茅草屋顶内侧（熏黑）----
    K.vgrad(g, 0, 0, W, 300, ['#0c0806', '#1a120c', '#24180e']);
    if (q.tex > 0) { g.save(); g.beginPath(); g.rect(0, 0, W, 300); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, 'thatch', { c1: '#404040', c2: '#c0c0c0', seed: 31 }, 192, 0, 0, 0.75); g.restore(); }
    // 椽子：倾斜量随 sin(2πx/W) 变化，画面中心与左右边缘都是竖直的（镜像连续）
    var nr = byM(q, 16, 24, 32);
    for (i = 0; i <= nr; i++) {
      var rx = W * i / nr, tilt = -sbSin(rx) * 260, by = sbEave(rx) - 20, w0 = 9;
      K.poly(g, [rx - w0, by, rx + w0, by, rx + w0 * 1.8 + tilt, -10, rx - w0 * 1.8 + tilt, -10]);
      g.fillStyle = K.lin(g, rx - w0, 0, rx + w0, 0, ['#2e1e12', '#140c06']); g.fill();
    }
    // 横向的檩条（竹 / 木），水平 → 镜像安全
    for (i = 0; i < 4; i++) {
      var py = 40 + i * 44;
      g.fillStyle = 'rgba(40,28,16,0.9)'; g.fillRect(0, py, W, 7);
      g.fillStyle = 'rgba(255,220,170,0.06)'; g.fillRect(0, py, W, 2);
    }
    // 两根粗大的弯曲原木梁（梁中间略下垂，两端对称）
    function beam(y0, sag, th) {
      g.beginPath(); g.moveTo(0, y0); for (var k = 0; k <= 24; k++) { var bx = W * k / 24; g.lineTo(bx, y0 + sag * (1 - sbCos(bx)) / 2); }
      for (k = 24; k >= 0; k--) { var bx2 = W * k / 24; g.lineTo(bx2, y0 + th + sag * (1 - sbCos(bx2)) / 2 * 0.9); } g.closePath();
    }
    beam(118, 22, 50); woodFill(g, q, '#2a1a0e', true, 0, 118, ['#0e0804', 0.45]);
    beam(118, 22, 50); g.fillStyle = K.lin(g, 0, 118, 0, 190, ['rgba(255,210,160,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']); g.fill();
    beam(184, 14, 26); woodFill(g, q, '#24160c', true, 0, 184, ['#0e0804', 0.45]);
    beam(184, 14, 26); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill();

    // ---- 后墙：土壁 + 柱 + 贯，墙顶 / 墙脚为余弦曲线 ----
    g.save();
    g.beginPath(); for (i = 0; i <= 32; i++) { var wx = W * i / 32; if (i) g.lineTo(wx, sbEave(wx)); else g.moveTo(wx, sbEave(wx)); }
    for (i = 32; i >= 0; i--) { var wx2 = W * i / 32; g.lineTo(wx2, sbBase(wx2) + 4); } g.closePath();
    g.clip();
    g.beginPath(); g.rect(0, 150, W, 560); earthFill(g, q, '#6a5a44', ['#1e140c', 0.25]);
    if (q.model > 0) {
      g.strokeStyle = 'rgba(30,20,10,0.35)'; g.lineWidth = 1.5;
      for (i = 0; i < byM(q, 0, 8, 14); i++) { var cx = rnd() * W, cy = 260 + rnd() * 300; g.beginPath(); g.moveTo(cx, cy); for (var kk = 0; kk < 4; kk++) { cx += (rnd() - 0.5) * 40; cy += 10 + rnd() * 20; g.lineTo(cx, cy); } g.stroke(); }
    }
    // 贯（两道横木，随墙面弯曲）
    function nuki(t) {
      g.beginPath(); for (var k = 0; k <= 24; k++) { var nx = W * k / 24, ny = lerp(sbEave(nx), sbBase(nx), t); if (k) g.lineTo(nx, ny - 12); else g.moveTo(nx, ny - 12); }
      for (k = 24; k >= 0; k--) { var nx2 = W * k / 24, ny2 = lerp(sbEave(nx2), sbBase(nx2), t); g.lineTo(nx2, ny2 + 12); } g.closePath();
    }
    nuki(0.08); woodFill(g, q, '#3a2414', true, 0, 0, ['#140a04', 0.45]);
    nuki(0.44); woodFill(g, q, '#3a2414', true, 0, 0, ['#140a04', 0.45]);
    // 高窗（两侧开间，障子透冷光）
    var hiWin = [[372, 618], [1302, 1458]];
    for (i = 0; i < hiWin.length; i++) { var hx0 = hiWin[i][0], hx1 = hiWin[i][1]; shoji(g, q, hx0, 262, hx1 - hx0, 120, { glow: true, cols: 4, rows: 2, frame: '#3a2818', fw: 5 }); }
    // 熏黑（上暗下亮）
    g.fillStyle = K.lin(g, 0, 190, 0, 680, ['rgba(10,6,2,0.65)', 'rgba(10,6,2,0.15)', 'rgba(0,0,0,0.25)']); g.fillRect(0, 150, W, 560);
    g.restore();
    // 柱
    for (i = 0; i < SB_POSTS.length; i++) {
      var px = SB_POSTS[i], pw = 46, ptop = sbEave(px) - 30, pbot = sbBase(px) + 8;
      g.beginPath(); g.rect(px - pw / 2, ptop, pw, pbot - ptop); woodFill(g, q, '#2a1a0e', false, px, 0, ['#0e0804', 0.4]);
      g.fillStyle = K.lin(g, px - pw / 2, 0, px + pw / 2, 0, ['rgba(255,210,160,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']); g.fillRect(px - pw / 2, ptop, pw, pbot - ptop);
    }
    // 中央开间上方的注连绳
    (function shimenawa() {
      var x0 = 690, x1 = 1230, y0 = 252;
      g.strokeStyle = '#a89060'; g.lineWidth = 12; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(960, y0 + 54, x1, y0); g.stroke();
      if (q.model > 0) { g.strokeStyle = 'rgba(60,44,20,0.7)'; g.lineWidth = 2; for (var t = 0; t < 30; t++) { var tt = t / 30, bx = lerp(x0, x1, tt), byy = y0 + 54 * 2 * tt * (1 - tt) * 1.0; g.beginPath(); g.moveTo(bx - 4, byy - 5); g.lineTo(bx + 4, byy + 5); g.stroke(); } }
      g.fillStyle = '#e8e4d8';
      for (var sd = 0; sd < 4; sd++) { var tt2 = (sd + 0.5) / 4, dx = lerp(x0, x1, tt2), dy = y0 + 54 * 2 * tt2 * (1 - tt2) + 4; K.poly(g, [dx, dy, dx + 10, dy, dx + 10, dy + 14, dx + 3, dy + 14, dx + 3, dy + 28, dx + 12, dy + 28, dx + 12, dy + 42, dx, dy + 42]); g.fill(); }
    })();

    // ---- 地板：水平的深色木板（被磨得发亮）----
    g.save();
    g.beginPath(); g.moveTo(0, H); for (i = 0; i <= 32; i++) { var fx = W * i / 32; g.lineTo(fx, sbBase(fx)); } g.lineTo(W, H); g.closePath(); g.clip();
    g.fillStyle = '#3a2618'; g.fillRect(0, 580, W, 500);
    var rows = [0, 22, 48, 80, 120, 168, 226, 296, 380, 480];
    for (var r = 0; r < rows.length - 1; r++) {
      var ya = rows[r], yb = rows[r + 1];
      g.beginPath();
      for (i = 0; i <= 24; i++) { var bx3 = W * i / 24; if (i) g.lineTo(bx3, sbBase(bx3) + ya * (1 + 0.12 * sbCos(bx3))); else g.moveTo(bx3, sbBase(bx3) + ya * (1 + 0.12 * sbCos(bx3))); }
      for (i = 24; i >= 0; i--) { var bx4 = W * i / 24; g.lineTo(bx4, sbBase(bx4) + yb * (1 + 0.12 * sbCos(bx4))); }
      g.closePath();
      if (q.tex > 0) { g.save(); K.fillTex(g, q, 'wood', SUGI_H, WU, r * 97, r * 31); g.restore(); g.fillStyle = 'rgba(30,16,6,' + (0.25 + (r % 3) * 0.08).toFixed(2) + ')'; g.fill(); }
      else { g.fillStyle = r % 2 ? '#3e2a1a' : '#36241a'; g.fill(); }
      g.strokeStyle = 'rgba(8,4,2,0.75)'; g.lineWidth = 2; g.stroke();
      // 错缝
      if (q.model > 0) { var nj = 5 + r, off = rnd(); for (var j2 = 0; j2 < nj; j2++) { var jx = W * (j2 + off) / nj, jy0 = sbBase(jx) + ya * (1 + 0.12 * sbCos(jx)), jy1 = sbBase(jx) + yb * (1 + 0.12 * sbCos(jx)); g.beginPath(); g.moveTo(jx, jy0); g.lineTo(jx - sbSin(jx) * (yb - ya) * 0.35, jy1); g.stroke(); } }
    }
    // 磨亮的反光（来自炉火）
    if (q.light > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(960, 860); g.scale(1, 0.28); g.fillStyle = K.rad(g, 0, 0, 0, 900, [[0, 'rgba(255,170,100,0.16)'], [0.6, 'rgba(255,170,100,0.05)'], [1, 'rgba(255,170,100,0)']]); g.fillRect(-900, -900, 1800, 1800); g.restore(); }
    g.fillStyle = K.lin(g, 0, 600, 0, H, ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)']); g.fillRect(0, 580, W, 500);
    g.restore();
    if (q.light > 0) { g.beginPath(); for (i = 0; i <= 32; i++) { var ax = W * i / 32; if (i) g.lineTo(ax, sbBase(ax) - 40); else g.moveTo(ax, sbBase(ax) - 40); } for (i = 32; i >= 0; i--) { var ax2 = W * i / 32; g.lineTo(ax2, sbBase(ax2) + 34); } g.closePath(); g.fillStyle = K.lin(g, 0, 600, 0, 680, ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']); g.fill(); }

    // ---- 长老席（锚点 704-1216, 432-592）：屏风 + 高台 + 坐垫 + 凭肘 ----
    (function elderSeat() {
      // 二曲屏风（褪色金箔，绘白蛾）
      var sx0 = 724, sx1 = 1196, st = 436, sb = 586;
      for (var p = 0; p < 2; p++) {
        var a = lerp(sx0, sx1, p / 2), b = lerp(sx0, sx1, (p + 1) / 2), lean = p ? 6 : -6;
        K.poly(g, [a, st + (p ? 6 : 0), b, st + (p ? 0 : 6), b, sb, a, sb]);
        g.fillStyle = K.lin(g, a, st, b, sb, p ? ['#9a8248', '#6a5628'] : ['#b89a58', '#7a6230']); g.fill();
        if (q.tex > 0) { g.save(); g.clip(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'paper', { c1: '#b0a890', c2: '#ffffff', seed: 23 }, 128, 0, 0, 0.8); g.restore(); }
        g.strokeStyle = '#1a0e06'; g.lineWidth = 8; K.poly(g, [a, st + (p ? 6 : 0), b, st + (p ? 0 : 6), b, sb, a, sb]); g.stroke();
        void lean;
      }
      // 白蛾（展翅，带羽状触角）
      var mx = 960, my = 500;
      g.fillStyle = 'rgba(245,242,232,0.85)';
      K.path(g, 'M0 0 C-14 -26 -60 -34 -80 -14 C-76 6 -40 10 -14 4 C-34 14 -46 34 -28 42 C-12 40 -4 22 0 10 C4 22 12 40 28 42 C46 34 34 14 14 4 C40 10 76 6 80 -14 C60 -34 14 -26 0 0 Z', mx, my, 1); g.fill();
      g.strokeStyle = 'rgba(140,120,80,0.6)'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#d8d0c0'; K.ellipse(g, mx, my + 8, 5, 16); g.fill();
      g.strokeStyle = 'rgba(230,226,214,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx - 3, my - 6); g.quadraticCurveTo(mx - 14, my - 30, mx - 26, my - 36); g.moveTo(mx + 3, my - 6); g.quadraticCurveTo(mx + 14, my - 30, mx + 26, my - 36); g.stroke();
      if (q.model > 0) { g.lineWidth = 1; for (var f = 0; f < 6; f++) { var t = 0.3 + f * 0.12; g.beginPath(); g.moveTo(mx - 3 - 23 * t, my - 6 - 30 * t); g.lineTo(mx - 3 - 23 * t - 5, my - 6 - 30 * t + 2); g.moveTo(mx + 3 + 23 * t, my - 6 - 30 * t); g.lineTo(mx + 3 + 23 * t + 5, my - 6 - 30 * t + 2); g.stroke(); } }
      // 高台（榻榻米面）
      var dx0 = 704, dx1 = 1216, dTop = 572, dFront = 604;
      K.poly(g, [dx0 + 16, dTop, dx1 - 16, dTop, dx1, dFront, dx0, dFront]);
      if (q.tex > 0) { g.save(); g.clip(); K.fillTex(g, q, 'tatami', { c1: '#7a7448', c2: '#a8a068', seed: 29 }, 128, 0, 0); g.restore(); } else { g.fillStyle = '#8a8458'; g.fill(); }
      g.fillStyle = '#1a1a14'; g.fillRect(dx0 + 4, dFront - 6, dx1 - dx0 - 8, 5);
      g.fillStyle = K.lin(g, 0, dFront, 0, dFront + 26, ['#5a3a20', '#2a180a']); g.fillRect(dx0, dFront, dx1 - dx0, 26);
      g.fillStyle = 'rgba(255,220,170,0.2)'; g.fillRect(dx0, dFront, dx1 - dx0, 2);
      // 长老的坐垫（厚，紫）+ 凭肘
      zabuton(g, q, 960, 572, 150, 34, '#4a2a4a');
      g.fillStyle = '#2a180c'; g.fillRect(1040, 548, 70, 10); g.fillRect(1046, 558, 8, 22); g.fillRect(1096, 558, 8, 22);
      // 长老席两侧的行灯
      for (var aI = 0; aI < 2; aI++) {
        var ax3 = aI ? 1236 : 684, ab = 640;
        if (q.light > 0) K.contact(g, ax3, ab + 2, 30, 6, 0.6);
        g.fillStyle = '#2a180c'; g.fillRect(ax3 - 22, ab - 8, 44, 8); g.fillRect(ax3 - 20, ab - 82, 4, 76); g.fillRect(ax3 + 16, ab - 82, 4, 76);
        g.fillStyle = K.lin(g, 0, ab - 80, 0, ab - 12, ['#fff4d8', '#f0c880']); g.fillRect(ax3 - 16, ab - 78, 32, 66);
        g.strokeStyle = 'rgba(80,50,20,0.6)'; g.lineWidth = 1.5; g.strokeRect(ax3 - 16, ab - 78, 32, 33); g.strokeRect(ax3 - 16, ab - 45, 32, 33);
        g.fillStyle = '#2a180c'; g.fillRect(ax3 - 22, ab - 86, 44, 6);
      }
    })();
    // ---- 记录箱（锚点 96-352, 472-672）：带铁件的长持 ----
    (function recordChest() {
      var x = 104, y = 512, w = 240, h = 150;
      if (q.light > 0) K.contact(g, x + w / 2, y + h, w * 0.6, 12, 0.7);
      box(g, q, x, y, w, h, 70, { front: '#3a2414', side: '#22140a', top: '#4a301c', vy: 430, fill: function () { woodFill(g, q, '#3a2414', true, x, y, ['#4a2a14', 0.15]); } });
      g.fillStyle = K.lin(g, 0, y, 0, y + h, ['rgba(255,210,160,0.08)', 'rgba(0,0,0,0.35)']); g.fillRect(x, y, w, h);
      // 铁包角、合页、锁扣、提环
      g.fillStyle = ironGrad(g, 0, y, 0, y + 30);
      var corners = [[x, y], [x + w - 34, y], [x, y + h - 34], [x + w - 34, y + h - 34]];
      for (var c = 0; c < 4; c++) { g.fillRect(corners[c][0], corners[c][1], 34, 34); rivet(g, q, corners[c][0] + 17, corners[c][1] + 17, 3.5); }
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, y + 30, w, 3);
      g.fillStyle = ironGrad(g, x + w / 2 - 20, 0, x + w / 2 + 20, 0); g.fillRect(x + w / 2 - 18, y + 20, 36, 46);
      g.fillStyle = '#0a0806'; g.beginPath(); g.arc(x + w / 2, y + 44, 4, 0, TAU); g.fill(); g.fillRect(x + w / 2 - 1.5, y + 44, 3, 12);
      for (var hI = 0; hI < 2; hI++) { var hx = hI ? x + w - 6 : x + 6; g.strokeStyle = '#3a3a40'; g.lineWidth = 4; g.beginPath(); g.arc(hx, y + 70, 12, hI ? -PI / 2 : PI / 2, hI ? PI / 2 : PI * 1.5); g.stroke(); }
      // 箱顶的卷宗与帐簿
      if (q.model > 0) {
        var tp = [x + 36, y - 10];
        g.fillStyle = '#d8ccb0'; K.rr(g, tp[0], tp[1] - 14, 90, 16, 7); g.fill(); g.fillStyle = '#8a2020'; g.fillRect(tp[0] + 40, tp[1] - 14, 6, 16);
        g.fillStyle = '#c8b890'; g.fillRect(tp[0] + 104, tp[1] - 20, 70, 22); g.fillStyle = '#3a2a1a'; g.fillRect(tp[0] + 104, tp[1] - 20, 6, 22);
        K.text(g, '寄合帳', tp[0] + 142, tp[1] - 9, 11, '#2a1a10');
      }
    })();
    // ---- 计票板（锚点 1536-1824, 240-576）----
    (function tallyBoard() {
      var x = 1548, y = 252, w = 266, h = 316;
      if (q.light > 0) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + 8, y + 10, w, h); }
      g.beginPath(); g.rect(x, y, w, h); woodFill(g, q, '#6a4a2c', false, x, y, ['#8a6038', 0.18]);
      g.fillStyle = K.lin(g, x, 0, x + w, 0, ['rgba(255,220,180,0.08)', 'rgba(0,0,0,0.3)']); g.fillRect(x, y, w, h);
      g.strokeStyle = '#2a180a'; g.lineWidth = 8; g.strokeRect(x, y, w, h);
      K.text(g, '寄　合', x + w / 2, y + 26, 22, '#1a0e06', { weight: 'bold' });
      g.fillStyle = '#2a180a'; g.fillRect(x + 10, y + 46, w - 20, 3); g.fillRect(x + w / 2 - 1.5, y + 50, 3, h - 110);
      K.text(g, '有', x + w * 0.25, y + 64, 18, '#1a0e06', { weight: 'bold' }); K.text(g, '無', x + w * 0.75, y + 64, 18, '#1a0e06', { weight: 'bold' });
      // 挂在钉子上的木札（黑 = 有罪，白 = 无罪）
      var tr = K.rng(44);
      for (var c = 0; c < 2; c++) for (var rI = 0; rI < 4; rI++) for (var k = 0; k < 3; k++) {
        if (c === 1 && tr() < 0.5) continue;
        var tx = x + 22 + c * w / 2 + k * 36, ty = y + 84 + rI * 44;
        rivet(g, q, tx + 12, ty, 2.5);
        g.fillStyle = c === 0 ? '#1a1414' : '#e8e2d2'; K.poly(g, [tx + 2, ty + 4, tx + 22, ty + 4, tx + 22, ty + 34, tx + 12, ty + 40, tx + 2, ty + 34]); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.stroke();
      }
      // 炭写的「正」字计数
      var ty2 = y + h - 44;
      g.strokeStyle = 'rgba(20,14,10,0.85)'; g.lineWidth = 3;
      for (var z = 0; z < 3; z++) { var zx = x + 24 + z * 36; g.beginPath(); g.moveTo(zx, ty2); g.lineTo(zx + 26, ty2); g.moveTo(zx + 13, ty2); g.lineTo(zx + 13, ty2 + 26); g.moveTo(zx + 13, ty2 + 12); g.lineTo(zx + 24, ty2 + 12); g.moveTo(zx + 4, ty2 + 10); g.lineTo(zx + 4, ty2 + 26); g.moveTo(zx - 2, ty2 + 26); g.lineTo(zx + 28, ty2 + 26); g.stroke(); }
      g.beginPath(); g.moveTo(x + w * 0.62, ty2); g.lineTo(x + w * 0.62 + 26, ty2); g.moveTo(x + w * 0.62 + 13, ty2); g.lineTo(x + w * 0.62 + 13, ty2 + 26); g.stroke();
    })();

    // ---- 坐垫环（锚点 ring 0-1920, 928-1080 及围炉两侧、后方）----
    var cush = ['#3a3448', '#4a2a2a', '#2a3a3a', '#4a3a24'];
    // 后排（长老席前）
    var backX = [-330, -160, 160, 330];
    for (i = 0; i < backX.length; i++) { var bp = SBR.fp(backX[i], 1.22); zabuton(g, q, bp[0], bp[1], 74 * 1.22, 24 * 1.22, cush[i % 4]); }
    // 两侧（沿围炉向前排开）
    var sideS = [1.5, 1.9, 2.36];
    for (var sI2 = 0; sI2 < sideS.length; sI2++) for (var sd2 = -1; sd2 <= 1; sd2 += 2) { var sp = SBR.fp(sd2 * 250, sideS[sI2]), sc = sideS[sI2]; zabuton(g, q, sp[0], sp[1], 74 * sc, 24 * sc, cush[(sI2 + (sd2 > 0 ? 2 : 0)) % 4]); }
    // 远处两侧再各两张（靠墙）
    var farS = [[-620, 1.12], [-520, 1.32], [520, 1.32], [620, 1.12]];
    for (i = 0; i < farS.length; i++) { var fp2 = SBR.fp(farS[i][0], farS[i][1]); zabuton(g, q, fp2[0], fp2[1], 70 * farS[i][1], 22 * farS[i][1], cush[(i + 1) % 4]); }

    // ---- 围炉里（锚点 744-1176, 728-912）+ 自在钩（锚点 928-992, 160-640）----
    var ir = irori(g, q, SBR, -92, 92, 1.66, 2.6, 0.75, { seed: 17 });
    var ket = jizai(g, q, 960, 196, 726, { kettle: true, ks: 1.15, mid: 0.36 });
    if (q.light > 0 && ket) { g.strokeStyle = 'rgba(240,235,230,0.28)'; g.lineWidth = 7; g.beginPath(); g.moveTo(ket[0] + 56, ket[1] + 6); g.bezierCurveTo(ket[0] + 72, ket[1] - 40, ket[0] + 48, ket[1] - 76, ket[0] + 66, ket[1] - 128); g.stroke(); }

    // 前排（画面底边，横贯全图；间距 240，左右边缘各落在两张之间 → 镜像连续）
    for (i = 0; i < 8; i++) { var fx2 = 120 + i * 240; zabuton(g, q, fx2, 1010, 206, 70, cush[i % 4]); }

    // ================= 光照 =================
    var L = lightMap(q, '#5a4e56');
    lmLight(L, ir[0], ir[1] - 30, 980, '#ffa060', 0.9, 0.62);
    lmLight(L, 684, 600, 300, '#ffc880', 0.5, 0.9); lmLight(L, 1236, 600, 300, '#ffc880', 0.5, 0.9);
    lmLight(L, 495, 320, 360, '#c8d4ec', 0.35, 0.8); lmLight(L, 1380, 320, 360, '#c8d4ec', 0.35, 0.8);
    lmLight(L, 0, 320, 260, '#c8d4ec', 0.12, 0.8); lmLight(L, W, 320, 260, '#c8d4ec', 0.12, 0.8);
    if (q.light > 0) {
      lmDark(L, 0.45, function (x) { x.beginPath(); x.rect(0, 0, W, 120); });
      lmDark(L, 0.2, function (x) { x.beginPath(); x.rect(0, 120, W, 100); });
    }
    if (q.light >= 2) {
      // 铁壶与自在钩挡住炉火，在屏风上投下长影
      lmShade(L, 0.45, function (x) { K.poly(x, [948, 300, 972, 300, 990, 590, 930, 590]); K.ellipse(x, 960, 470, 60, 40); });
    }
    applyLM(g, L);
    if (q.light > 0) {
      K.glow(g, ir[0], ir[1], 300, '#ff8a3a', 0.35);
      K.glow(g, 684, 604, 90, '#ffc070', 0.35); K.glow(g, 1236, 604, 90, '#ffc070', 0.35);
    }
    if (q.light >= 2) {
      // 炉火上升的暖光与浮尘、两侧高窗的冷光柱
      softShaft(g, [ir[0] - 220, ir[1], ir[0] + 220, ir[1], ir[0] + 120, 180, ir[0] - 120, 180], '#ffb070', 0.08, ir[0], ir[1], ir[0], 180, 5);
      dust(g, K.rng(55), byM(q, 14, 26, 40), ir[0] - 260, 300, 520, 460, '#ffd8a0', 0.5);
      softShaft(g, [380, 300, 610, 300, 700, 700, 420, 700], '#d0dcf4', 0.07, 495, 300, 560, 700, 4);
      softShaft(g, [1310, 300, 1450, 300, 1500, 700, 1260, 700], '#d0dcf4', 0.07, 1380, 300, 1380, 700, 4);
    }
    // 镜像全景用：顶部与左右略压暗，不在边缘放强对比的东西
    finish(g, q, q.light > 0 ? 0.5 : 0.38, 0.5);
  }
  DM.HDBG.def('sabakiya', {
    draw: drawSabakiya,
    lights: [
      { x: 960, y: 780, r: 300, color: '#ff8a3a', i: 0.7, flicker: 0.45, kind: 'fire' },
      { x: 684, y: 596, r: 90, color: '#ffc070', i: 0.5, flicker: 0.3, kind: 'lamp' },
      { x: 1236, y: 596, r: 90, color: '#ffc070', i: 0.5, flicker: 0.3, kind: 'lamp' },
      { x: 495, y: 322, r: 140, color: '#c8d4ec', i: 0.25, flicker: 0, kind: 'window' },
      { x: 1380, y: 322, r: 120, color: '#c8d4ec', i: 0.25, flicker: 0, kind: 'window' }
    ],
    key: { x: 0, color: '#ffb478', amb: '#221c26', rim: 0.6 },
    outdoor: false
  });
})(typeof window !== 'undefined' ? window : globalThis);
