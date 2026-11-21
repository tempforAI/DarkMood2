/* DARK MOOD Ⅱ HD 背景（分担）—— 远望村子、火见橹、墓地、地藏堂、白蛾神社拜殿、神乐殿与面藏、雪牢
 * 设计坐标 1920x1080；锚点 = locations.js 的 480x270 坐标 ×4。做法与 bg_places.js 相同（固有色 + 光照图 + 后效）。
 * 若同名背景已在 bg_village.js / bg_interior.js 中定义，则不覆盖（def 前检查）。
 * 只用 ES5 + Canvas 2D 基础 API。
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK;
  if (!K || !DM.HDBG) return;
  var W = 1920, H = 1080, PI = Math.PI, TAU = PI * 2;
  function defOnce(id, o) { if (!DM.HDBG.defs[id]) DM.HDBG.def(id, o); }

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

  // 天空（阴天、风暴云）：远处（近地平线）的云小而扁，近处（上方）的云大；每团云由多个柔边云朵组成，云底暗、云顶受光
  // o: { grad, c0 云底色, c1 云体色, c2 受光色, lit:[x,y,r,color] 光源方向的暖色边, seed, n, scale }
  function cloudSky(g, q, x, y, w, h, o) {
    if (o.grad) K.vgrad(g, x, y, w, h, o.grad);
    var rnd = K.rng(o.seed || 5), n = o.n || byM(q, 9, 16, 26), sc = o.scale || 1;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    // 层云条纹
    for (var sI = 0; sI < byM(q, 3, 6, 9); sI++) {
      var sy = y + h * (0.3 + rnd() * 0.65), sw = w * (0.3 + rnd() * 0.5), sx = x + rnd() * w;
      g.save(); g.translate(sx, sy); g.scale(1, 0.05 + rnd() * 0.04);
      g.fillStyle = K.rad(g, 0, 0, 0, sw / 2, [[0, K.rgba(o.c0, 0.35)], [1, K.rgba(o.c0, 0)]]); g.fillRect(-sw / 2, -sw / 2, sw, sw); g.restore();
    }
    for (var i = 0; i < n; i++) {
      var t = (i + rnd() * 0.9) / n;               // 0=地平线（远） → 1=顶部（近）
      var cy = y + h * (1 - t) * 0.92 + h * 0.04;
      var k = (0.3 + t * 1.1) * sc, cw = (240 + rnd() * 420) * k, ch = cw * (0.16 + rnd() * 0.1);
      var cx = x + rnd() * w, np = 4 + Math.floor(rnd() * (q.model >= 2 ? 6 : 4));
      var lit = 0;
      if (o.lit) { var dx = (cx - o.lit[0]) / o.lit[2], dy = (cy - o.lit[1]) / (o.lit[2] * 0.7); lit = clamp(1 - Math.sqrt(dx * dx + dy * dy), 0, 1); }
      var body = K.mix(o.c0, o.c1, 0.4 + rnd() * 0.6), hi = lit > 0 ? K.mix(o.c2, o.lit[3], lit) : o.c2;
      for (var p = 0; p < np; p++) {
        var px = cx + (p / (np - 1 || 1) - 0.5) * cw * (0.8 + rnd() * 0.3), py = cy - rnd() * ch * 0.7 - Math.sin(p / (np - 1 || 1) * PI) * ch * 0.5;
        var r = ch * (0.7 + rnd() * 0.8);
        g.save(); g.translate(px, py); g.scale(1, 0.62);
        g.fillStyle = K.rad(g, 0, r * 0.25, 0, r, [[0, K.rgba(body, 0.75)], [0.6, K.rgba(body, 0.45)], [1, K.rgba(body, 0)]]);
        g.fillRect(-r, -r * 0.8, 2 * r, 2.1 * r);
        if (q.light > 0) {
          g.fillStyle = K.rad(g, -r * 0.1, -r * 0.42, 0, r * 0.75, [[0, K.rgba(hi, 0.3 + lit * 0.45)], [0.6, K.rgba(hi, 0.1 + lit * 0.15)], [1, K.rgba(hi, 0)]]);
          g.fillRect(-r * 0.9, -r * 1.2, r * 1.6, r * 1.6);
        }
        g.restore();
      }
      // 云底的暗带
      g.save(); g.translate(cx, cy + ch * 0.2); g.scale(1, 0.12);
      g.fillStyle = K.rad(g, 0, 0, 0, cw * 0.55, [[0, K.rgba(o.c0, 0.45)], [1, K.rgba(o.c0, 0)]]); g.fillRect(-cw * 0.55, -cw * 0.55, cw * 1.1, cw * 1.1);
      g.restore();
    }
    g.restore();
  }


  /* =================================================================
   * 雪景工具
   * ================================================================= */
  function snowField(g, q, pts, o) {
    o = o || {};
    var i, top = H;
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    for (i = 1; i < pts.length; i += 2) top = Math.min(top, pts[i]);
    g.lineTo(W, H); g.lineTo(0, H); g.closePath();
    g.save();
    g.fillStyle = K.lin(g, 0, top, 0, H, o.night ? ['#4a5878', '#2e3a58', '#1e2640'] : ['#e6ebf3', '#d4dbe8', '#bcc6d8']); g.fill();
    g.clip();
    if (q.tex > 0) { g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'snow', { c1: '#c8d0e0', c2: '#ffffff', seed: 23 }, 256, 0, 0, 0.6); g.globalCompositeOperation = 'source-over'; }
    // 起伏的阴影（偏蓝紫）与受光面
    var rnd = K.rng(o.seed || 5);
    for (i = 0; i < byM(q, 4, 10, 16); i++) {
      var x = rnd() * W, y = top + rnd() * (H - top), r = 80 + rnd() * 220;
      g.save(); g.translate(x, y); g.scale(1, 0.18);
      g.fillStyle = K.rad(g, 0, 0, 0, r, [[0, o.night ? 'rgba(10,14,40,0.3)' : 'rgba(110,120,170,0.16)'], [1, 'rgba(110,120,170,0)']]); g.fillRect(-r, -r, 2 * r, 2 * r);
      g.restore();
    }
    if (q.light >= 2) { // 闪光颗粒
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (i = 0; i < 90; i++) { var sx = rnd() * W, sy = top + Math.pow(rnd(), 0.7) * (H - top); g.fillRect(sx, sy, 1.6, 1.6); }
    }
    g.restore();
  }
  // 沿一条上边线堆一层圆润的积雪（带悬垂的雪檐）
  function snowCap(g, q, x0, y0, x1, y1, th, o) {
    o = o || {};
    var ov = o.ov === undefined ? th * 0.6 : o.ov, droop = o.droop || th * 0.5;
    g.beginPath();
    g.moveTo(x0 - ov, y0 + droop);
    g.bezierCurveTo(x0 - ov - th * 0.3, y0 - th * 0.4, x0 - ov * 0.3, y0 - th, x0 + th * 0.4, y0 - th);
    g.lineTo(x1 - th * 0.4, y1 - th);
    g.bezierCurveTo(x1 + ov * 0.3, y1 - th, x1 + ov + th * 0.3, y1 - th * 0.4, x1 + ov, y1 + droop);
    g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + droop * 0.6, x0 - ov, y0 + droop);
    g.closePath();
    g.fillStyle = K.lin(g, 0, Math.min(y0, y1) - th, 0, Math.max(y0, y1) + droop, o.night ? ['#9aa8c8', '#5a6888'] : ['#ffffff', '#eef2f8', '#b8c2d6']); g.fill();
    if (q.light > 0) { g.strokeStyle = o.night ? 'rgba(20,24,50,0.4)' : 'rgba(110,120,160,0.35)'; g.lineWidth = 1.5; g.stroke(); }
    if (o.icicles && q.model > 0) icicles(g, q, x0 - ov * 0.5, x1 + ov * 0.5, (y0 + y1) / 2 + droop * 0.7, o.icicles, th * 1.4, K.rng(Math.round(x0 + y0)));
  }
  function icicles(g, q, x0, x1, y, n, maxL, rnd) {
    for (var i = 0; i < n; i++) {
      var x = lerp(x0, x1, (i + rnd() * 0.8) / n), l = maxL * (0.25 + rnd() * 0.75), w = 3 + rnd() * 4;
      K.poly(g, [x - w, y - 2, x + w, y - 2, x + 0.5, y + l]);
      g.fillStyle = K.lin(g, x - w, 0, x + w, 0, ['rgba(200,220,240,0.85)', 'rgba(255,255,255,0.95)', 'rgba(150,175,210,0.85)']); g.fill();
    }
  }
  // 雪杉
  function snowSugi(g, q, x, base, h, o) {
    o = o || {};
    var w = h * 0.36, tiers = o.tiers || (q.model > 0 ? 5 : 3), dark = o.night ? '#0a1010' : (o.far ? '#5a6870' : '#1e2e2a');
    g.fillStyle = o.night ? '#060808' : '#2a1e16'; g.fillRect(x - h * 0.02, base - h * 0.15, h * 0.04, h * 0.15);
    for (var t = 0; t < tiers; t++) {
      var tt = t / tiers, ty = base - h * 0.12 - tt * h * 0.85, tw = w * (1 - tt * 0.8), th = h * 0.3;
      K.poly(g, [x - tw, ty, x + tw, ty, x, ty - th]); g.fillStyle = dark; g.fill();
      // 枝上积雪
      g.fillStyle = o.night ? 'rgba(150,165,200,0.85)' : (o.far ? 'rgba(235,240,248,0.75)' : 'rgba(245,248,255,0.95)');
      K.poly(g, [x - tw * 0.85, ty - th * 0.08, x - tw * 0.2, ty - th * 0.38, x + tw * 0.35, ty - th * 0.3, x + tw * 0.9, ty - th * 0.05, x + tw * 0.5, ty - th * 0.16, x - tw * 0.3, ty - th * 0.2]); g.fill();
    }
    g.beginPath(); g.moveTo(x, base - h); g.lineTo(x - w * 0.12, base - h * 0.86); g.lineTo(x + w * 0.12, base - h * 0.86); g.closePath(); g.fillStyle = o.night ? 'rgba(150,165,200,0.9)' : '#ffffff'; g.fill();
  }
  // 远山
  function mountains(g, q, y, amp, color, seed, snowTop) {
    var n = 40, pts = [];
    for (var i = 0; i <= n; i++) { var u = i / n; pts.push(W * u, y - amp * (0.25 + 0.75 * K.fbm(u * 3.2 + seed * 0.37, seed * 0.13, 4, seed, 0)) - amp * 0.35 * Math.abs(Math.sin(u * 7 + seed))); }
    g.beginPath(); g.moveTo(0, H);
    for (i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.lineTo(W, H); g.closePath(); g.fillStyle = color; g.fill();
    if (snowTop && q.model > 0) {
      g.save(); g.clip();
      g.fillStyle = snowTop;
      g.beginPath(); g.moveTo(pts[0], pts[1] - 2);
      for (i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1] - 2);
      for (i = pts.length - 2; i >= 0; i -= 2) { var u2 = pts[i] / W; g.lineTo(pts[i], pts[i + 1] + amp * (0.22 + 0.16 * Math.sin(u2 * 23 + seed) * Math.sin(u2 * 7 + seed * 2))); }
      g.closePath(); g.fill();
      g.restore();
    }
  }
  // 积雪的切妻屋顶（正面看）：屋顶面从 yR（屋脊）到 yE（檐口），x0..x1 为檐口宽
  function snowRoofFront(g, q, x0, x1, yR, yE, o) {
    o = o || {};
    var inset = (x1 - x0) * (o.inset === undefined ? 0.12 : o.inset);
    K.poly(g, [x0, yE, x1, yE, x1 - inset, yR, x0 + inset, yR]); g.fillStyle = o.roof || '#2a2a32'; g.fill();
    // 厚厚的积雪覆盖屋面，前缘圆润悬垂
    var th = o.th || (yE - yR) * 0.3;
    g.beginPath(); g.moveTo(x0 + inset - 6, yR - th * 0.5);
    g.lineTo(x1 - inset + 6, yR - th * 0.5);
    g.lineTo(x1 + th * 0.3, yE - th * 0.2);
    g.bezierCurveTo(x1 + th * 0.6, yE + th * 0.2, x1 + th * 0.2, yE + th * 0.6, x1 - th * 0.2, yE + th * 0.5);
    g.quadraticCurveTo((x0 + x1) / 2, yE + th * 0.75, x0 + th * 0.2, yE + th * 0.5);
    g.bezierCurveTo(x0 - th * 0.2, yE + th * 0.6, x0 - th * 0.6, yE + th * 0.2, x0 - th * 0.3, yE - th * 0.2);
    g.closePath();
    g.fillStyle = K.lin(g, 0, yR - th, 0, yE + th * 0.8, o.night ? ['#9aa8c8', '#7a88a8', '#4a5878'] : ['#ffffff', '#eef2f8', '#c4ccdc']); g.fill();
    if (q.light > 0) { g.fillStyle = K.lin(g, 0, yE, 0, yE + th * 0.7, ['rgba(120,130,170,0)', 'rgba(120,130,170,0.35)']); g.fill(); }
    if (q.model > 0 && o.icicles !== false) icicles(g, q, x0, x1, yE + th * 0.6, o.icicles || Math.round((x1 - x0) / 40), th * 1.2, K.rng(Math.round(x0 * 3 + yE)));
  }

  /* =================================================================
   * 远望村子 village_view（夜景，从炭烧小屋前的斜坡俯瞰）；past = 1983 年三十二盏灯、桥灯一串亮着、分校窗里有光
   * ================================================================= */
  function drawVillageView(g, q, v) {
    var past = v === 'past', i, rnd = K.rng(2003);
    // 夜空
    K.vgrad(g, 0, 0, W, 520, ['#05070e', '#0c1222', '#18203a', '#26304c']);
    var st = K.rng(past ? 83 : 3);
    for (i = 0; i < byM(q, 40, 90, 150); i++) { var sx = st() * W, sy = Math.pow(st(), 1.6) * 380, b = st(); g.fillStyle = 'rgba(220,226,255,' + (0.2 + b * 0.6).toFixed(2) + ')'; g.beginPath(); g.arc(sx, sy, 0.6 + b * 1.4, 0, TAU); g.fill(); }
    cloudSky(g, q, 0, 0, W, 470, { c0: '#060810', c1: '#141a2c', c2: '#3a4462', seed: 41, n: byM(q, 6, 12, 18), scale: 1.1, lit: [1500, 120, 500, '#8a98c0'] });
    // 云后的月光
    if (q.light > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = K.rad(g, 1500, 110, 10, 420, [[0, 'rgba(160,175,220,0.3)'], [1, 'rgba(160,175,220,0)']]); g.fillRect(1080, 0, 840, 520); g.restore(); }
    // 对面的群山（积雪，月光下泛蓝）
    mountains(g, q, 430, 150, '#2a3450', 3, 'rgba(150,165,205,0.55)');
    mountains(g, q, 520, 90, '#1e2640', 9, 'rgba(120,135,180,0.45)');
    // 村子所在的台地（雪地，夜色）
    snowField(g, q, [0, 560, 300, 548, 700, 556, 1100, 546, 1500, 560, 1920, 570], { night: true, seed: 7 });
    // 雪葬谷（右侧的深谷）+ 吊桥（锚点 1520-1880, 440-560）
    g.fillStyle = '#060810'; K.poly(g, [1440, 600, 1520, 560, 1600, 590, 1700, 560, 1800, 600, 1920, 580, 1920, 1080, 1560, 1080]); g.fill();
    g.fillStyle = K.lin(g, 1500, 560, 1700, 900, ['rgba(40,50,80,0.6)', 'rgba(0,0,0,0)']); K.poly(g, [1440, 600, 1520, 560, 1600, 590, 1600, 900, 1500, 900]); g.fill();
    (function bridge() {
      var x0 = 1530, x1 = 1876, yd = 520, tw0 = 1548, tw1 = 1860;
      g.strokeStyle = '#141a28'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(tw0, yd - 70); g.lineTo(tw0, yd + 6); g.moveTo(tw1, yd - 70); g.lineTo(tw1, yd + 6); g.stroke();
      g.lineWidth = 2.5; g.beginPath(); g.moveTo(x0 - 20, yd - 30); g.lineTo(tw0, yd - 70); g.quadraticCurveTo((tw0 + tw1) / 2, yd + 10, tw1, yd - 70); g.lineTo(x1 + 30, yd - 36); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(tw0, yd); g.quadraticCurveTo((tw0 + tw1) / 2, yd + 16, tw1, yd); g.stroke();
      g.lineWidth = 1; g.strokeStyle = 'rgba(40,48,70,0.8)';
      for (var h = 1; h < 12; h++) { var t = h / 12, hx = lerp(tw0, tw1, t), cy = yd - 70 + (80) * 4 * t * (1 - t) * 0.95, dy = yd + 16 * 4 * t * (1 - t); g.beginPath(); g.moveTo(hx, cy); g.lineTo(hx, dy); g.stroke(); }
      // 桥灯：1983 年一串全亮，2003 年只剩一盏
      for (var l = 0; l < 11; l++) {
        var lt = (l + 0.5) / 11, lx = lerp(tw0, tw1, lt), ly = yd + 16 * 4 * lt * (1 - lt) - 8, on = past || l === 3;
        g.fillStyle = on ? '#ffd890' : 'rgba(60,64,80,0.8)'; g.beginPath(); g.arc(lx, ly, on ? 2.6 : 1.6, 0, TAU); g.fill();
        if (on && q.light > 0) K.glow(g, lx, ly, 18, '#ffb860', 0.45);
      }
      if (past && q.light > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate((tw0 + tw1) / 2, yd + 40); g.scale(1, 0.2); g.fillStyle = K.rad(g, 0, 0, 0, 200, [[0, 'rgba(255,190,110,0.18)'], [1, 'rgba(255,190,110,0)']]); g.fillRect(-200, -200, 400, 400); g.restore(); }
    })();
    // ---- 村子的房屋（锚点 lights 240-1680, 600-800）----
    var houses = [], hr = K.rng(1983);
    for (i = 0; i < 40; i++) {
      var hx = 240 + hr() * 1200, hy = 600 + Math.pow(hr(), 0.8) * 200;
      if (hx > 860 && hx < 1030 && hy < 660) continue;      // 给火见橹让位
      if (hx > 420 && hx < 600 && hy < 640) continue;       // 给分校让位
      houses.push([hx, hy, 0.6 + (hy - 600) / 200 * 0.7]);
    }
    houses.sort(function (a, b) { return a[1] - b[1]; });
    var litIdx = past ? 32 : 11, order = [];
    for (i = 0; i < houses.length; i++) order.push(i);
    var lr = K.rng(77); for (i = order.length - 1; i > 0; i--) { var j = Math.floor(lr() * (i + 1)), t2 = order[i]; order[i] = order[j]; order[j] = t2; }
    var litSet = {}; for (i = 0; i < Math.min(litIdx, order.length); i++) litSet[order[i]] = 1;
    for (i = 0; i < houses.length; i++) {
      var h = houses[i], s = h[2], w = 44 * s, hh = 22 * s, x = h[0], y = h[1];
      g.fillStyle = '#10141e'; g.fillRect(x - w / 2, y - hh, w, hh);
      snowRoofFront(g, q, x - w / 2 - 6 * s, x + w / 2 + 6 * s, y - hh - 18 * s, y - hh, { roof: '#0a0c14', th: 9 * s, night: true, icicles: false, inset: 0.18 });
      if (litSet[i]) {
        g.fillStyle = '#ffcf80'; g.fillRect(x - w * 0.3, y - hh * 0.75, w * 0.22, hh * 0.45); if (s > 0.9) g.fillRect(x + w * 0.1, y - hh * 0.75, w * 0.22, hh * 0.45);
        if (q.light > 0) K.glow(g, x - w * 0.2, y - hh * 0.5, 30 * s, '#ffa850', 0.5);
      }
    }
    // 分校（锚点 440-584, 464-584）：1983 年窗里有光
    (function school() {
      var x0 = 452, x1 = 576, y = 576, hh = 46;
      g.fillStyle = '#121620'; g.fillRect(x0, y - hh, x1 - x0, hh);
      snowRoofFront(g, q, x0 - 10, x1 + 10, y - hh - 34, y - hh, { roof: '#0a0c14', th: 12, night: true, icicles: false, inset: 0.1 });
      g.fillStyle = '#121620'; g.fillRect(x0 + 50, y - hh - 60, 22, 30); K.poly(g, [x0 + 44, y - hh - 60, x0 + 78, y - hh - 60, x0 + 61, y - hh - 78]); g.fill();
      for (var k = 0; k < 5; k++) { var wx = x0 + 10 + k * 23; g.fillStyle = past ? '#ffd890' : 'rgba(40,46,64,0.9)'; g.fillRect(wx, y - hh + 12, 14, 18); }
      if (past && q.light > 0) K.glow(g, (x0 + x1) / 2, y - hh + 20, 90, '#ffb860', 0.35);
    })();
    // 火见橹（锚点 904-992, 416-576）
    (function tower() {
      var cx = 948, b = 580, t = 440;
      g.strokeStyle = '#141824'; g.lineWidth = 3.5;
      g.beginPath(); g.moveTo(cx - 26, b); g.lineTo(cx - 10, t + 30); g.moveTo(cx + 26, b); g.lineTo(cx + 10, t + 30); g.stroke();
      g.lineWidth = 2; for (var k = 0; k < 5; k++) { var yy = lerp(b, t + 30, k / 5), dx = lerp(26, 10, k / 5); g.beginPath(); g.moveTo(cx - dx, yy); g.lineTo(cx + dx, yy); g.moveTo(cx - dx, yy); g.lineTo(cx + lerp(26, 10, (k + 1) / 5), lerp(b, t + 30, (k + 1) / 5)); g.stroke(); }
      g.fillStyle = '#141824'; g.fillRect(cx - 14, t + 22, 28, 10);
      K.poly(g, [cx - 18, t + 22, cx + 18, t + 22, cx, t]); g.fill();
      g.fillStyle = 'rgba(160,175,215,0.85)'; K.poly(g, [cx - 14, t + 18, cx + 14, t + 18, cx, t + 3]); g.fill();
      g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(cx, t + 26, 4, 0, PI); g.fill();
    })();
    // ---- 前景：斜坡与雪杉（锚点 valley 0-1920, 840-1080）----
    snowField(g, q, [0, 860, 300, 846, 600, 870, 900, 880, 1200, 868, 1500, 900, 1600, 960, 1920, 1080], { night: true, seed: 11 });
    var tr = K.rng(9);
    for (i = 0; i < byM(q, 4, 7, 10); i++) { var tx = i < 3 ? 40 + i * 110 : 1400 + (i - 3) * 90, tb = 900 + tr() * 140; snowSugi(g, q, tx, tb, 220 + tr() * 160, { night: true }); }
    g.fillStyle = 'rgba(4,6,12,0.8)'; K.poly(g, [1560, 1080, 1620, 980, 1720, 1030, 1920, 960, 1920, 1080]); g.fill();
    // 冷夜色调 + 谷底的雾
    if (q.light > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(1700, 700); g.scale(1, 0.25); g.fillStyle = K.rad(g, 0, 0, 0, 500, [[0, 'rgba(90,110,160,0.18)'], [1, 'rgba(90,110,160,0)']]); g.fillRect(-500, -500, 1000, 1000); g.restore(); }
    finish(g, q, 0.55, 0.45);
  }
  defOnce('village_view', {
    draw: drawVillageView,
    lights: function (v) {
      return v === 'past' ? [{ x: 960, y: 700, r: 520, color: '#ffb060', i: 0.25, flicker: 0.15, kind: 'glow' }, { x: 1700, y: 540, r: 200, color: '#ffc070', i: 0.3, flicker: 0.2, kind: 'lamp' }, { x: 1500, y: 110, r: 260, color: '#a8b8e0', i: 0.25, flicker: 0, kind: 'moon' }]
        : [{ x: 960, y: 700, r: 400, color: '#ffb060', i: 0.12, flicker: 0.15, kind: 'glow' }, { x: 1500, y: 110, r: 260, color: '#a8b8e0', i: 0.25, flicker: 0, kind: 'moon' }];
    },
    key: { x: 0.5, color: '#a8b4d8', amb: '#141a2c', rim: 0.7 },
    outdoor: true
  });


  /* =================================================================
   * 神社共用：朱漆柱、石灯笼、狛犬、纸垂
   * ================================================================= */
  var SHU = '#b8322a';
  function shuPillar(g, q, x, top, bot, w) {
    g.fillStyle = K.lin(g, x - w / 2, 0, x + w / 2, 0, ['#7a1c16', '#d0483a', '#a02a22', '#5a120e']); g.fillRect(x - w / 2, top, w, bot - top);
    if (q.model > 0) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - w / 2, bot - 18, w, 18); }
  }
  function stoneLantern(g, q, x, base, s, lit) {
    s = s || 1;
    if (q.light > 0) K.contact(g, x, base, 40 * s, 8 * s, 0.5);
    var c = ['#8a8a86', '#6a6a66', '#4a4a48'];
    g.fillStyle = K.lin(g, x - 30 * s, 0, x + 30 * s, 0, c); g.fillRect(x - 26 * s, base - 20 * s, 52 * s, 20 * s);
    g.fillRect(x - 8 * s, base - 80 * s, 16 * s, 60 * s);
    g.fillRect(x - 24 * s, base - 92 * s, 48 * s, 12 * s);
    g.fillStyle = lit ? '#ffd890' : '#2a2a2c'; g.fillRect(x - 16 * s, base - 128 * s, 32 * s, 36 * s);
    g.fillStyle = K.lin(g, x - 26 * s, 0, x + 26 * s, 0, c); g.fillRect(x - 20 * s, base - 128 * s, 6 * s, 36 * s); g.fillRect(x + 14 * s, base - 128 * s, 6 * s, 36 * s);
    K.poly(g, [x - 40 * s, base - 128 * s, x + 40 * s, base - 128 * s, x + 12 * s, base - 156 * s, x - 12 * s, base - 156 * s]); g.fill();
    snowCap(g, q, x - 40 * s, base - 140 * s, x + 40 * s, base - 140 * s, 16 * s, { ov: 6 * s, droop: 8 * s });
    snowCap(g, q, x - 24 * s, base - 94 * s, x + 24 * s, base - 94 * s, 8 * s, { ov: 3 * s, droop: 4 * s });
    if (lit && q.light > 0) K.glow(g, x, base - 110 * s, 60 * s, '#ffb860', 0.4);
  }
  function shide(g, x, y, s, col) {
    g.fillStyle = col || '#f8f8f0';
    K.poly(g, [x, y, x + 10 * s, y, x + 10 * s, y + 12 * s, x + 3 * s, y + 12 * s, x + 3 * s, y + 24 * s, x + 12 * s, y + 24 * s, x + 12 * s, y + 36 * s, x, y + 36 * s]); g.fill();
  }
  // 白蛾神乐面（墙上挂的小号）
  function mothMask(g, q, x, y, s, dim) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var white = dim ? '#c8c2b4' : '#f6f2ea';
    g.fillStyle = white;
    K.path(g, 'M-12 -10 C-24 -22 -44 -24 -50 -12 C-52 2 -42 12 -26 14 C-38 20 -38 34 -26 38 C-16 38 -10 28 -8 20 Z'); g.fill();
    K.path(g, 'M12 -10 C24 -22 44 -24 50 -12 C52 2 42 12 26 14 C38 20 38 34 26 38 C16 38 10 28 8 20 Z'); g.fill();
    K.path(g, 'M0 -30 C14 -30 22 -18 22 0 C22 22 12 40 0 48 C-12 40 -22 22 -22 0 C-22 -18 -14 -30 0 -30 Z'); g.fillStyle = K.rad(g, -6, -6, 2, 40, [white, K.shade(white, -0.18)]); g.fill();
    g.strokeStyle = 'rgba(40,30,20,0.5)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#c81e30'; K.path(g, 'M0 -26 C-3 -20 -3 -12 0 -8 C3 -12 3 -20 0 -26 Z'); g.fill();
    g.fillStyle = '#0a0608'; K.path(g, 'M-15 0 C-11 -4 -6 -4 -3 0 C-7 2 -11 2 -15 0 Z'); g.fill(); K.path(g, 'M15 0 C11 -4 6 -4 3 0 C7 2 11 2 15 0 Z'); g.fill();
    g.fillStyle = '#c81e30'; K.ellipse(g, 0, 24, 4, 2.2); g.fill();
    g.strokeStyle = white; g.lineWidth = 2; g.beginPath(); g.moveTo(-4, -28); g.quadraticCurveTo(-10, -46, -24, -52); g.moveTo(4, -28); g.quadraticCurveTo(10, -46, 24, -52); g.stroke();
    if (q.model > 0) { g.lineWidth = 1; for (var f = 0; f < 6; f++) { var t = f / 6; g.beginPath(); g.moveTo(-4 - 20 * t, -28 - 22 * t); g.lineTo(-4 - 20 * t - 4, -28 - 22 * t + 3); g.moveTo(4 + 20 * t, -28 - 22 * t); g.lineTo(4 + 20 * t + 4, -28 - 22 * t + 3); g.stroke(); } }
    g.restore();
  }

  /* =================================================================
   * 白蛾神社·拜殿 shrine_hall
   * ================================================================= */
  function drawShrineHall(g, q) {
    var i;
    cloudSky(g, q, 0, 0, W, 660, { grad: ['#6a7086', '#8a90a2', '#a6aab6', '#bcc0c8', '#c4c6ce'], c0: '#5a6074', c1: '#7a8094', c2: '#d4d6de', seed: 71, lit: [1300, 160, 500, '#e8e6e0'] });
    // 背后的杉林（雪）
    var tr = K.rng(31);
    for (i = 0; i < byM(q, 10, 18, 26); i++) snowSugi(g, q, tr() * W, 470 + tr() * 60, 260 + tr() * 160, { far: i % 2 === 0, tiers: q.model > 0 ? 4 : 3 });
    g.fillStyle = K.lin(g, 0, 300, 0, 640, ['rgba(160,168,184,0)', 'rgba(170,176,192,0.6)']); g.fillRect(0, 300, W, 340);
    // 地面：石板参道 + 两侧积雪
    snowField(g, q, [0, 610, 500, 604, 1000, 612, 1500, 604, 1920, 612], { seed: 21 });
    (function sando() {
      K.poly(g, [860, 640, 1060, 640, 1300, H, 620, H]); g.fillStyle = '#7a7672'; g.fill();
      g.save(); K.poly(g, [860, 640, 1060, 640, 1300, H, 620, H]); g.clip();
      grain(g, q, 0.5); g.strokeStyle = 'rgba(40,38,36,0.5)'; g.lineWidth = 2;
      var rows = [660, 690, 728, 776, 836, 910, 1000];
      for (var r = 0; r < rows.length; r++) { g.beginPath(); g.moveTo(0, rows[r]); g.lineTo(W, rows[r]); g.stroke(); var off = r % 2 ? 0.5 : 0; for (var c = -2; c <= 3; c++) { var t = (c + off) / 2.6, xa = 960 + t * (100 + (rows[r] - 640) * 0.66); g.beginPath(); g.moveTo(xa, rows[r]); g.lineTo(xa, rows[r + 1] || H); g.stroke(); } }
      g.fillStyle = 'rgba(80,90,120,0.15)'; g.fillRect(0, 640, W, 440);
      g.restore();
      // 参道两边的雪堆（铲出来的）
      snowCap(g, q, 600, 1000, 846, 650, 30, { ov: 10, droop: 10 });
      snowCap(g, q, 1074, 650, 1320, 1000, 30, { ov: 10, droop: 10 });
    })();
    // ---- 仓库（锚点 64-384, 368-768）：白壁土藏 ----
    (function storeroom() {
      var x0 = 80, x1 = 372, top = 456, bot = 764;
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, bot, 180, 14, 0.5);
      g.fillStyle = K.lin(g, x0, 0, x1, 0, ['#e8e4dc', '#d0ccc2', '#aaa69c']); g.fillRect(x0, top, x1 - x0, bot - top);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(x0, top, x1 - x0, bot - top); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'plaster', { c1: '#c8c4bc', c2: '#ffffff', seed: 51, stain: 0.6 }, 256, 0, 0, 0.7); g.restore(); }
      g.fillStyle = '#2a2a2e'; g.fillRect(x0, bot - 90, x1 - x0, 90);
      if (q.model > 0) { g.strokeStyle = 'rgba(200,200,200,0.4)'; g.lineWidth = 2; for (var k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x0 + k * 50 - 20, bot - 90); g.lineTo(x0 + k * 50 + 20, bot); g.stroke(); } }
      // 厚门 + 锁
      var dx = (x0 + x1) / 2;
      g.fillStyle = '#3a3a40'; g.fillRect(dx - 66, top + 70, 132, bot - top - 70);
      g.beginPath(); g.rect(dx - 58, top + 78, 116, bot - top - 78); woodFill(g, q, '#4a3020', false, dx, top, ['#2a1408', 0.3]);
      g.fillStyle = ironGrad(g, 0, 0, 0, 0); g.fillStyle = '#2a2a30'; g.fillRect(dx - 58, top + 140, 116, 10); g.fillRect(dx - 58, bot - 90, 116, 10);
      g.fillStyle = brassGrad(g, dx - 12, 0, dx + 12, 0); K.rr(g, dx - 12, top + 170, 24, 30, 3); g.fill();
      snowRoofFront(g, q, x0 - 30, x1 + 30, top - 110, top, { roof: '#2a2a32', th: 40, inset: 0.18, icicles: 9 });
      // 门旁立着的雪橇（运雪灯笼用）
      if (q.model > 0) { g.strokeStyle = '#6a4a2c'; g.lineWidth = 6; g.beginPath(); g.moveTo(x1 + 20, bot); g.lineTo(x1 + 50, bot - 200); g.moveTo(x1 + 60, bot); g.lineTo(x1 + 86, bot - 196); g.stroke(); for (var sl = 0; sl < 4; sl++) { g.lineWidth = 5; g.beginPath(); g.moveTo(x1 + 24 + sl * 7, bot - 30 - sl * 44); g.lineTo(x1 + 64 + sl * 6, bot - 28 - sl * 44); g.stroke(); } }
    })();
    // ---- 拜殿（锚点 440-1480, 144-624）----
    (function hall() {
      var x0 = 470, x1 = 1450, yE = 400, yR = 150, floorY = 560, ground = 640;
      // 正面：白壁 + 朱柱 + 格子门
      g.fillStyle = '#e4dccc'; g.fillRect(x0 + 40, yE, x1 - x0 - 80, floorY - yE);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 + 40, yE, x1 - x0 - 80, 40);
      var cols = [x0 + 60, x0 + 300, 960 - 120, 960 + 120, x1 - 300, x1 - 60];
      // 格子门（中央）
      g.fillStyle = '#2a1c14'; g.fillRect(cols[2], yE + 30, cols[3] - cols[2], floorY - yE - 30);
      g.fillStyle = 'rgba(255,220,160,0.25)'; g.fillRect(cols[2] + 10, yE + 40, cols[3] - cols[2] - 20, floorY - yE - 50);
      g.strokeStyle = '#4a2c1c'; g.lineWidth = 4; for (var gx = cols[2] + 20; gx < cols[3]; gx += 20) { g.beginPath(); g.moveTo(gx, yE + 30); g.lineTo(gx, floorY); g.stroke(); } for (var gy = yE + 50; gy < floorY; gy += 22) { g.beginPath(); g.moveTo(cols[2], gy); g.lineTo(cols[3], gy); g.stroke(); }
      // 两侧的蔀户
      for (var sI = 0; sI < 2; sI++) { var sx0 = sI ? cols[3] + 20 : cols[1] + 20, sx1 = sI ? cols[4] - 20 : cols[2] - 20; g.beginPath(); g.rect(sx0, yE + 40, sx1 - sx0, floorY - yE - 40); woodFill(g, q, '#5a3e28', true, sx0, yE, ['#3a2414', 0.25]); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; for (var lI = 1; lI < 4; lI++) { g.beginPath(); g.moveTo(sx0, yE + 40 + lI * 30); g.lineTo(sx1, yE + 40 + lI * 30); g.stroke(); } }
      for (i = 0; i < cols.length; i++) shuPillar(g, q, cols[i], yE + 10, floorY + 10, 30);
      // 朱色的贯与长押
      g.fillStyle = K.lin(g, 0, yE + 8, 0, yE + 30, ['#d0483a', '#7a1c16']); g.fillRect(x0 + 30, yE + 8, x1 - x0 - 60, 22);
      // 回廊与木阶
      g.fillStyle = K.lin(g, 0, floorY, 0, floorY + 24, ['#6a4a2c', '#3a2414']); g.fillRect(x0, floorY + 6, x1 - x0, 22);
      g.fillStyle = '#1e140c'; g.fillRect(x0 + 10, floorY + 28, x1 - x0 - 20, ground - floorY - 28);
      for (var st = 0; st < 4; st++) { var sy = floorY + 28 + st * 20, sw = 140 + st * 30; g.fillStyle = K.lin(g, 0, sy, 0, sy + 20, ['#7a5434', '#3a2414']); g.fillRect(960 - sw, sy, sw * 2, 20); snowCap(g, q, 960 - sw + 30, sy, 960 - sw + 120, sy, 6, { ov: 2, droop: 2 }); snowCap(g, q, 960 + sw - 120, sy, 960 + sw - 30, sy, 6, { ov: 2, droop: 2 }); }
      // 高栏（朱）
      g.strokeStyle = SHU; g.lineWidth = 6; g.beginPath(); g.moveTo(x0 + 10, floorY - 30); g.lineTo(960 - 150, floorY - 30); g.moveTo(960 + 150, floorY - 30); g.lineTo(x1 - 10, floorY - 30); g.stroke();
      for (var bp = x0 + 30; bp < x1 - 20; bp += 60) { if (bp > 960 - 160 && bp < 960 + 160) continue; g.lineWidth = 4; g.beginPath(); g.moveTo(bp, floorY - 30); g.lineTo(bp, floorY + 6); g.stroke(); }
      // 入母屋大屋顶（深色桧皮），厚雪
      var rw = (x1 - x0) * 0.62;
      g.fillStyle = '#2a201c'; K.poly(g, [x0 - 70, yE + 6, x1 + 70, yE + 6, x1 - 60, yR + 80, 960 + rw * 0.38, yR, 960 - rw * 0.38, yR, x0 + 60, yR + 80]); g.fill();
      // 千鸟破风（中央三角）
      g.fillStyle = '#3a2a22'; K.poly(g, [960 - 210, yE - 30, 960 + 210, yE - 30, 960, yR + 40]); g.fill();
      g.fillStyle = '#e8e2d4'; K.poly(g, [960 - 170, yE - 40, 960 + 170, yE - 40, 960, yR + 74]); g.fill();
      g.strokeStyle = '#1e140c'; g.lineWidth = 3; for (var hI = 1; hI < 5; hI++) { var hy = lerp(yR + 74, yE - 40, hI / 5); g.beginPath(); g.moveTo(960 - 170 * hI / 5, hy); g.lineTo(960 + 170 * hI / 5, hy); g.stroke(); }
      g.fillStyle = brassGrad(g, 940, 0, 980, 0); g.beginPath(); g.arc(960, yE - 110, 16, 0, TAU); g.fill();
      // 深檐的檐底（椽头）
      g.fillStyle = '#1e1612'; g.fillRect(x0 - 60, yE, x1 - x0 + 120, 40);
      if (q.model > 0) { g.fillStyle = 'rgba(200,170,120,0.25)'; for (var rr = x0 - 50; rr < x1 + 60; rr += 22) g.fillRect(rr, yE + 30, 10, 8); }
      // 屋顶积雪（屋面 + 破风上）
      g.beginPath(); g.moveTo(x0 + 40, yR + 70); g.lineTo(960 - rw * 0.4, yR - 26); g.lineTo(960 + rw * 0.4, yR - 26); g.lineTo(x1 - 40, yR + 70);
      g.lineTo(x1 + 90, yE - 6); g.bezierCurveTo(x1 + 110, yE + 26, x1 + 60, yE + 40, x1 + 30, yE + 30); g.quadraticCurveTo(960, yE + 46, x0 - 30, yE + 30);
      g.bezierCurveTo(x0 - 60, yE + 40, x0 - 110, yE + 26, x0 - 90, yE - 6); g.closePath();
      g.fillStyle = K.lin(g, 0, yR - 30, 0, yE + 46, ['#ffffff', '#eef2f8', '#c4ccdc']); g.fill();
      g.save(); g.clip(); g.fillStyle = 'rgba(0,0,0,0)';
      // 破风位置挖出（雪只覆盖屋面两侧）
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = K.lin(g, 0, yR, 0, yE, ['rgba(120,130,170,0)', 'rgba(120,130,170,0.25)']); g.fillRect(0, yR - 40, W, yE - yR + 100);
      g.restore();
      // 破风重新画在雪之上 + 破风上的雪
      g.fillStyle = '#3a2a22'; K.poly(g, [960 - 220, yE - 22, 960 + 220, yE - 22, 960, yR + 30]); g.fill();
      g.fillStyle = '#e8e2d4'; K.poly(g, [960 - 176, yE - 34, 960 + 176, yE - 34, 960, yR + 68]); g.fill();
      g.strokeStyle = '#1e140c'; g.lineWidth = 3; for (var hJ = 1; hJ < 5; hJ++) { var hy2 = lerp(yR + 68, yE - 34, hJ / 5); g.beginPath(); g.moveTo(960 - 176 * hJ / 5, hy2); g.lineTo(960 + 176 * hJ / 5, hy2); g.stroke(); }
      g.fillStyle = brassGrad(g, 940, 0, 980, 0); g.beginPath(); g.arc(960, yE - 104, 16, 0, TAU); g.fill();
      snowCap(g, q, 960 - 226, yE - 22, 960, yR + 26, 16, { ov: 6, droop: 8 });
      snowCap(g, q, 960, yR + 26, 960 + 226, yE - 22, 16, { ov: 6, droop: 8 });
      if (q.model > 0) icicles(g, q, x0 - 60, x1 + 60, yE + 34, 26, 40, K.rng(17));
      // 注连绳 + 纸垂（檐下）
      g.strokeStyle = '#c8b480'; g.lineWidth = 16; g.beginPath(); g.moveTo(cols[1], yE + 50); g.quadraticCurveTo(960, yE + 110, cols[4], yE + 50); g.stroke();
      if (q.model > 0) { g.strokeStyle = 'rgba(90,70,30,0.6)'; g.lineWidth = 2; for (var t = 0; t < 40; t++) { var tt = t / 40, bx = lerp(cols[1], cols[4], tt), by = yE + 50 + 60 * 2 * tt * (1 - tt); g.beginPath(); g.moveTo(bx - 5, by - 7); g.lineTo(bx + 5, by + 7); g.stroke(); } }
      for (var sd = 0; sd < 6; sd++) { var t2 = (sd + 0.5) / 6, dx2 = lerp(cols[1], cols[4], t2), dy2 = yE + 50 + 60 * 2 * t2 * (1 - t2) + 8; shide(g, dx2, dy2, 1.6); }
      // 本坪铃 + 铃绳（锚点 928-992, 368-624）
      var bx2 = 960, by2 = 404;
      g.strokeStyle = '#2a2a30'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx2, yE + 4); g.lineTo(bx2, by2); g.stroke();
      g.beginPath(); g.arc(bx2, by2 + 22, 24, 0, TAU); g.fillStyle = K.rad(g, bx2 - 8, by2 + 14, 2, 26, ['#fff0b8', '#c8a050', '#5a3a10']); g.fill();
      g.fillStyle = '#2a1a08'; g.fillRect(bx2 - 18, by2 + 24, 36, 4);
      // 粗麻绳 + 红白紫三色布
      g.fillStyle = K.lin(g, bx2 - 9, 0, bx2 + 9, 0, ['#8a7a5a', '#d8c898', '#7a6a4a']); g.fillRect(bx2 - 8, by2 + 44, 16, 150);
      if (q.model > 0) { g.strokeStyle = 'rgba(80,60,30,0.7)'; g.lineWidth = 2; for (var rI = 0; rI < 18; rI++) { var ry = by2 + 48 + rI * 8; g.beginPath(); g.moveTo(bx2 - 8, ry); g.lineTo(bx2 + 8, ry + 6); g.stroke(); } }
      var cl = ['#c82030', '#f4f0e8', '#6a2a8a'];
      for (var cI = 0; cI < 3; cI++) { g.fillStyle = cl[cI]; K.poly(g, [bx2 - 14 + cI * 9, by2 + 120, bx2 - 6 + cI * 9, by2 + 120, bx2 - 2 + cI * 9, by2 + 216, bx2 - 12 + cI * 9, by2 + 214]); g.fill(); }
    })();
    // ---- 赛钱箱（锚点 800-1120, 672-792）----
    (function box_() {
      var x0 = 812, x1 = 1108, top = 700, bot = 786;
      if (q.light > 0) K.contact(g, 960, bot, 170, 12, 0.6);
      quad(g, [x0 + 10, top - 20], [x1 - 10, top - 20], [x1, top], [x0, top]); woodFill(g, q, '#6a4a2c', true, x0, top, ['#7a5434', 0.15]);
      g.strokeStyle = '#2a180a'; g.lineWidth = 4; for (var sI = 1; sI < 9; sI++) { var sx = lerp(x0 + 14, x1 - 14, sI / 9); g.beginPath(); g.moveTo(sx, top - 18); g.lineTo(sx + (sx - 960) * 0.02, top - 2); g.stroke(); }
      g.beginPath(); g.rect(x0, top, x1 - x0, bot - top); woodFill(g, q, '#5a3a22', true, x0, top, ['#3a2010', 0.15]);
      g.fillStyle = K.lin(g, 0, top, 0, bot, ['rgba(255,220,180,0.1)', 'rgba(0,0,0,0.35)']); g.fillRect(x0, top, x1 - x0, bot - top);
      K.text(g, '奉　納', 960, top + 42, 34, '#e8d8a8', { weight: 'bold' });
      g.fillStyle = brassGrad(g, x0, 0, x0 + 30, 0); g.fillRect(x0, top, 22, bot - top); g.fillRect(x1 - 22, top, 22, bot - top);
      snowCap(g, q, x0 + 4, top - 20, x1 - 4, top - 20, 12, { ov: 6, droop: 5 });
    })();
    // ---- 社务所（锚点 1536-1880, 344-704）----
    (function shamusho() {
      var x0 = 1550, x1 = 1876, top = 470, bot = 700;
      if (q.light > 0) K.contact(g, (x0 + x1) / 2, bot, 200, 14, 0.5);
      g.beginPath(); g.rect(x0, top, x1 - x0, bot - top); woodFill(g, q, '#6a4a30', false, x0, top, ['#5a3a20', 0.15]);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, top, x1 - x0, 30);
      // 授与所的窗口（暖光）
      var wx = x0 + 40, wy = top + 50, ww = 200, wh = 100;
      g.fillStyle = '#ffd8a0'; g.fillRect(wx, wy, ww, wh);
      g.fillStyle = 'rgba(200,120,60,0.35)'; for (var o = 0; o < 6; o++) g.fillRect(wx + 12 + o * 31, wy + 60, 22, 28);
      g.fillStyle = '#c82030'; for (var o2 = 0; o2 < 6; o2++) g.fillRect(wx + 15 + o2 * 31, wy + 64, 16, 6);
      g.strokeStyle = '#3a2414'; g.lineWidth = 6; g.strokeRect(wx, wy, ww, wh); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
      g.fillStyle = '#4a3020'; g.fillRect(wx - 10, wy + wh, ww + 20, 14);
      // 木牌「社務所」
      g.fillStyle = '#e8dcc0'; g.fillRect(x1 - 66, top + 40, 36, 120); g.strokeStyle = '#2a1a0e'; g.lineWidth = 3; g.strokeRect(x1 - 66, top + 40, 36, 120);
      K.text(g, '社', x1 - 48, top + 64, 22, '#1a0e06', { weight: 'bold' }); K.text(g, '務', x1 - 48, top + 100, 22, '#1a0e06', { weight: 'bold' }); K.text(g, '所', x1 - 48, top + 136, 22, '#1a0e06', { weight: 'bold' });
      snowRoofFront(g, q, x0 - 26, x1 + 50, top - 120, top, { roof: '#2a2a32', th: 40, inset: 0.15, icicles: 10 });
      if (q.light > 0) K.glow(g, wx + ww / 2, wy + wh / 2, 160, '#ffb860', 0.3);
    })();
    // 石灯笼 + 狛犬
    stoneLantern(g, q, 700, 720, 1.1, false); stoneLantern(g, q, 1220, 720, 1.1, false);
    if (q.model >= 2) {
      for (var k2 = 0; k2 < 2; k2++) {
        var kx = k2 ? 1400 : 520, kb = 820, sgn = k2 ? -1 : 1;
        if (q.light > 0) K.contact(g, kx, kb, 70, 10, 0.5);
        g.fillStyle = K.lin(g, kx - 60, 0, kx + 60, 0, ['#8a8a86', '#5a5a58']); g.fillRect(kx - 60, kb - 50, 120, 50);
        g.save(); g.translate(kx, kb - 50); g.scale(sgn, 1);
        g.fillStyle = K.lin(g, -40, -120, 40, 0, ['#9a9a96', '#5a5a58']); K.path(g, 'M-34 0 C-40 -40 -34 -70 -20 -90 C-30 -110 -10 -130 8 -122 C24 -118 30 -100 22 -86 C34 -70 38 -30 34 0 Z'); g.fill();
        g.fillStyle = '#3a3a38'; g.beginPath(); g.arc(4, -106, 4, 0, TAU); g.fill();
        g.restore();
        snowCap(g, q, kx - 28, kb - 168, kx + 20, kb - 172, 14, { ov: 8, droop: 8 });
        snowCap(g, q, kx - 64, kb - 50, kx + 64, kb - 50, 12, { ov: 4, droop: 4 });
      }
    }

    var L = lightMap(q, '#b0b4c2');
    lmLight(L, 1300, 200, 1200, '#f4f2ec', 0.4, 0.8);
    lmLight(L, 1690, 570, 300, '#ffc888', 0.35, 1);
    if (q.light > 0) { lmShade(L, 0.55, function (x) { K.poly(x, [470, 410, 1450, 410, 1450, 640, 470, 640]); }); lmDark(L, 0.12, function (x) { x.beginPath(); x.rect(0, 0, W, 80); }); }
    if (q.light >= 2) lmShade(L, 0.3, function (x) { K.poly(x, [440, 640, 1480, 640, 1560, 700, 360, 700]); });
    applyLM(g, L);
    finish(g, q, 0.3, 0.55);
  }
  defOnce('shrine_hall', {
    draw: drawShrineHall,
    lights: [{ x: 1690, y: 570, r: 160, color: '#ffc070', i: 0.45, flicker: 0.05, kind: 'window' }, { x: 1300, y: 200, r: 400, color: '#f0eee8', i: 0.15, flicker: 0, kind: 'window' }],
    key: { x: 0.3, color: '#e6e8f0', amb: '#4a5064', rim: 0.6 },
    outdoor: false
  });

  /* =================================================================
   * 神乐殿与面藏 kagura：左下男坂石阶顶，中央舞台（前檐），右侧以短廊相连的面藏（门开着，墙上挂白蛾面具）
   * ================================================================= */
  function drawKagura(g, q) {
    var i;
    cloudSky(g, q, 0, 0, W, 800, { grad: ['#646a80', '#848a9e', '#a2a6b4', '#b8bcc6', '#c0c4cc'], c0: '#565c70', c1: '#767c90', c2: '#d0d2da', seed: 81, lit: [700, 140, 500, '#e6e4de'] });
    var tr = K.rng(41);
    for (i = 0; i < byM(q, 12, 20, 30); i++) snowSugi(g, q, tr() * W, 600 + tr() * 50, 300 + tr() * 200, { far: i % 3 === 0, tiers: q.model > 0 ? 5 : 3 });
    g.fillStyle = K.lin(g, 0, 320, 0, 780, ['rgba(160,168,184,0)', 'rgba(170,176,192,0.65)']); g.fillRect(0, 320, W, 460);
    snowField(g, q, [0, 760, 400, 752, 900, 762, 1400, 756, 1920, 764], { seed: 31 });
    // ---- 神乐殿（锚点 stage 240-1240, 232-672）----
    var sx0 = 250, sx1 = 1230, floorY = 610, yE = 360, yR = 236;
    (function stage() {
      // 床下（暗）与束柱
      g.fillStyle = '#1a120c'; g.fillRect(sx0 + 20, floorY + 20, sx1 - sx0 - 40, 70);
      for (var p = 0; p < 7; p++) { var px = lerp(sx0 + 40, sx1 - 40, p / 6); g.fillStyle = '#3a2618'; g.fillRect(px - 8, floorY + 20, 16, 70); }
      // 镜板（背景板上画老松）
      g.fillStyle = '#d8ccae'; g.fillRect(sx0 + 60, yE + 20, sx1 - sx0 - 120, floorY - yE - 20);
      if (q.tex > 0) { g.save(); g.beginPath(); g.rect(sx0 + 60, yE + 20, sx1 - sx0 - 120, floorY - yE - 20); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'wood', SUGI_V, WU, 0, 0, 0.35); g.restore(); }
      (function pine() {
        var px = 740, py = floorY - 10;
        g.strokeStyle = '#3a2a1a'; g.lineWidth = 26; g.beginPath(); g.moveTo(px, py); g.bezierCurveTo(px - 40, py - 80, px + 60, py - 140, px - 20, py - 210); g.stroke();
        g.lineWidth = 12; g.beginPath(); g.moveTo(px + 10, py - 120); g.quadraticCurveTo(px + 140, py - 150, px + 260, py - 130); g.moveTo(px - 10, py - 170); g.quadraticCurveTo(px - 140, py - 200, px - 250, py - 180); g.stroke();
        var cl = [[px + 260, py - 140, 70], [px + 150, py - 160, 60], [px - 250, py - 190, 70], [px - 130, py - 205, 56], [px - 20, py - 225, 64]];
        for (var c = 0; c < cl.length; c++) { g.fillStyle = '#2e4a32'; K.ellipse(g, cl[c][0], cl[c][1], cl[c][2], cl[c][2] * 0.35); g.fill(); if (q.model > 0) { g.fillStyle = 'rgba(80,120,80,0.5)'; K.ellipse(g, cl[c][0] - 10, cl[c][1] - 6, cl[c][2] * 0.6, cl[c][2] * 0.18); g.fill(); } }
      })();
      // 舞台地板（磨亮的桧木）
      quad(g, [sx0 + 40, floorY - 30], [sx1 - 40, floorY - 30], [sx1, floorY + 6], [sx0, floorY + 6]); woodFill(g, q, '#9a7448', true, sx0, floorY, ['#b08858', 0.15]);
      quad(g, [sx0 + 40, floorY - 30], [sx1 - 40, floorY - 30], [sx1, floorY + 6], [sx0, floorY + 6]); g.fillStyle = 'rgba(255,240,220,0.08)'; g.fill();
      g.fillStyle = K.lin(g, 0, floorY + 6, 0, floorY + 24, ['#6a4a2c', '#2a180a']); g.fillRect(sx0, floorY + 6, sx1 - sx0, 18);
      // 高栏（三面）
      g.strokeStyle = SHU; g.lineWidth = 6; g.beginPath(); g.moveTo(sx0, floorY - 26); g.lineTo(sx0 + 40, floorY - 56); g.moveTo(sx1, floorY - 26); g.lineTo(sx1 - 40, floorY - 56); g.stroke();
      g.lineWidth = 4; for (var b2 = 0; b2 < 4; b2++) { var bx = lerp(sx0, sx0 + 40, b2 / 3), byy = lerp(floorY, floorY - 30, b2 / 3); g.beginPath(); g.moveTo(bx, byy); g.lineTo(bx, byy - 26); g.stroke(); bx = lerp(sx1, sx1 - 40, b2 / 3); g.beginPath(); g.moveTo(bx, byy); g.lineTo(bx, byy - 26); g.stroke(); }
      // 柱（四根）
      var cols = [sx0 + 20, 610, 870, sx1 - 20];
      for (var c2 = 0; c2 < cols.length; c2++) shuPillar(g, q, cols[c2], yE, floorY + 8, 26);
      g.fillStyle = K.lin(g, 0, yE, 0, yE + 24, ['#d0483a', '#7a1c16']); g.fillRect(sx0, yE, sx1 - sx0, 24);
      // 屋顶（入母屋，厚雪）
      g.fillStyle = '#2a201c'; K.poly(g, [sx0 - 70, yE + 4, sx1 + 70, yE + 4, sx1 - 80, yR + 50, sx0 + 80, yR + 50]); g.fill();
      snowRoofFront(g, q, sx0 - 70, sx1 + 70, yR, yE + 4, { roof: '#2a201c', th: 48, inset: 0.14, icicles: 24 });
      // 舞台前檐下的雪灯（悬挂的小灯笼）
      for (var lI = 0; lI < 2; lI++) { var lx = lI ? 990 : 490, ly = yE + 70; g.strokeStyle = '#2a2a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, yE + 24); g.lineTo(lx, ly); g.stroke(); g.fillStyle = K.lin(g, lx - 16, 0, lx + 16, 0, ['#e8a060', '#fff0c8', '#d88040']); K.ellipse(g, lx, ly + 24, 16, 24); g.fill(); g.fillStyle = '#2a1a10'; g.fillRect(lx - 10, ly - 2, 20, 6); g.fillRect(lx - 10, ly + 46, 20, 6); if (q.light > 0) K.glow(g, lx, ly + 24, 60, '#ffb060', 0.4); }
    })();
    // ---- 前檐下（锚点 eaves 240-1240, 688-752）：屋檐下没有积雪的干地 + 檐下雪埂 ----
    (function underEave() {
      K.poly(g, [sx0 - 20, 690, sx1 + 20, 690, sx1 + 60, 748, sx0 - 60, 748]); g.fillStyle = '#4a4440'; g.fill();
      grain(g, q, 0.5, function (x) { K.poly(x, [sx0 - 20, 690, sx1 + 20, 690, sx1 + 60, 748, sx0 - 60, 748]); });
      g.fillStyle = 'rgba(0,0,0,0.35)'; K.poly(g, [sx0 - 20, 690, sx1 + 20, 690, sx1 + 30, 706, sx0 - 30, 706]); g.fill();
      if (q.model > 0) { g.fillStyle = 'rgba(120,110,100,0.5)'; var gr = K.rng(5); for (var k = 0; k < 60; k++) { g.fillRect(sx0 + gr() * (sx1 - sx0), 700 + gr() * 44, 3, 2); } }
      snowCap(g, q, sx0 - 70, 760, sx1 + 70, 760, 22, { ov: 10, droop: 8 });
    })();
    // ---- 短廊（锚点 1240-1440, 368-488）----
    (function passage() {
      var x0 = 1220, x1 = 1460, y0 = 420, y1 = 470;
      g.fillStyle = '#2a1c14'; K.poly(g, [x0, floorY - 10, x1, 640, x1, 660, x0, floorY + 10]); g.fill();
      g.beginPath(); K.poly(g, [x0, floorY - 30, x1, 620, x1, 640, x0, floorY - 10]); woodFill(g, q, '#7a5636', true, x0, floorY, ['#8a6040', 0.15]);
      for (var p = 0; p < 3; p++) { var px = lerp(x0 + 20, x1 - 10, p / 2), py0 = lerp(y0 + 10, y1 + 10, p / 2), py1 = lerp(floorY - 20, 630, p / 2); shuPillar(g, q, px, py0, py1, 14); }
      g.strokeStyle = SHU; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, floorY - 60); g.lineTo(x1, 590); g.stroke();
      g.fillStyle = '#2a201c'; K.poly(g, [x0 - 10, y0 - 10, x1 + 10, y1 - 40, x1 + 10, y1, x0 - 10, y0 + 30]); g.fill();
      snowCap(g, q, x0 - 10, y0 - 10, x1 + 10, y1 - 40, 22, { ov: 6, droop: 8 });
      g.fillStyle = 'rgba(0,0,0,0.25)'; K.poly(g, [x0, y0 + 30, x1, y1, x1, 620, x0, floorY - 30]); g.fill();
    })();
    // ---- 面藏（锚点 mask_store 1440-1856, 280-760；masks 1512-1784, 368-528；body 1464-1848, 800-936）----
    (function maskStore() {
      var x0 = 1446, x1 = 1866, yE = 380, sill = 944;
      var dx0 = 1488, dx1 = 1824, dTop = 404;
      var bx0 = 1530, bx1 = 1782, bTop = 384, bBot = 772;   // 内部后墙
      // 外墙（白壁 + 腰板）
      g.fillStyle = K.lin(g, x0, 0, x1, 0, ['#e8e2d6', '#c8c2b6']); g.fillRect(x0, yE, x1 - x0, sill - yE);
      g.beginPath(); g.rect(x0, 760, x1 - x0, sill - 760); woodFill(g, q, '#4a3020', true, x0, 760, ['#2a1408', 0.25]);
      // 门洞内部
      K.poly(g, [dx0, dTop, dx1, dTop, dx1, sill, dx0, sill]); g.fillStyle = '#140e0a'; g.fill();
      g.save(); K.poly(g, [dx0, dTop, dx1, dTop, dx1, sill, dx0, sill]); g.clip();
      // 后墙（木板）+ 两侧内壁 + 地板
      g.beginPath(); g.rect(bx0, bTop, bx1 - bx0, bBot - bTop); woodFill(g, q, '#5a4030', false, bx0, bTop, ['#3a2618', 0.3]);
      K.poly(g, [dx0, dTop, bx0, bTop, bx0, bBot, dx0, sill]); g.fillStyle = '#3a2a1e'; g.fill();
      K.poly(g, [dx1, dTop, bx1, bTop, bx1, bBot, dx1, sill]); g.fillStyle = '#2a1e14'; g.fill();
      // 面藏的地板（尸体区域：空着）
      K.poly(g, [bx0, bBot, bx1, bBot, dx1, sill, dx0, sill]); woodFill(g, q, '#6a4a30', false, bx0, bBot, ['#4a3020', 0.2]);
      g.strokeStyle = 'rgba(10,6,2,0.6)'; g.lineWidth = 2; for (var fl = 1; fl < 6; fl++) { var ta = fl / 6; g.beginPath(); g.moveTo(lerp(bx0, bx1, ta), bBot); g.lineTo(lerp(dx0, dx1, ta), sill); g.stroke(); }
      K.poly(g, [bx0, bBot, bx1, bBot, dx1, sill, dx0, sill]); g.fillStyle = K.lin(g, 0, bBot, 0, sill, ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']); g.fill();
      if (q.light > 0) { g.save(); g.globalCompositeOperation = 'lighter'; K.poly(g, [dx0 + 20, sill, dx1 - 10, sill, bx1 - 30, bBot + 30, bx0 + 30, bBot + 30]); g.fillStyle = K.lin(g, 0, bBot, 0, sill, ['rgba(190,200,225,0)', 'rgba(190,200,225,0.22)']); g.fill(); g.restore(); }
      // 墙上的面具架：白蛾神乐面 ×3 + 其他面
      g.fillStyle = '#3a2618'; g.fillRect(bx0 + 10, 386, bx1 - bx0 - 20, 8);
      var mk = [[1560, 456, 0.9], [1648, 450, 1.0], [1736, 456, 0.9]];
      for (var m = 0; m < mk.length; m++) { g.strokeStyle = '#c8a050'; g.lineWidth = 2; g.beginPath(); g.moveTo(mk[m][0], 394); g.lineTo(mk[m][0], mk[m][1] - 46); g.stroke(); mothMask(g, q, mk[m][0], mk[m][1], mk[m][2], false); }
      if (q.model > 0) {
        // 下排：火男 / 阿龟等其他神乐面
        var others = [[1584, 556, '#d8b08a'], [1680, 560, '#f0e0d0'], [1756, 552, '#a83020']];
        for (var o = 0; o < others.length; o++) { var ox = others[o][0], oy = others[o][1]; K.ellipse(g, ox, oy, 22, 28); g.fillStyle = K.rad(g, ox - 6, oy - 8, 2, 30, [K.shade(others[o][2], 0.2), others[o][2]]); g.fill(); g.fillStyle = '#1a1010'; K.ellipse(g, ox - 8, oy - 4, 3.5, 2); g.fill(); K.ellipse(g, ox + 8, oy - 4, 3.5, 2); g.fill(); g.fillStyle = '#7a2020'; K.ellipse(g, ox + (o === 0 ? 6 : 0), oy + 14, o === 0 ? 6 : 4, o === 0 ? 6 : 2); g.fill(); }
        // 角落的祭具箱与面具系绳
        g.fillStyle = '#3a2a1a'; g.fillRect(bx0 + 6, bBot - 70, 70, 70); g.fillStyle = 'rgba(255,220,170,0.12)'; g.fillRect(bx0 + 6, bBot - 70, 70, 3);
        g.strokeStyle = '#d8d0c0'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx1 - 40, bBot - 120); g.quadraticCurveTo(bx1 - 20, bBot - 60, bx1 - 50, bBot - 30); g.stroke();
      }
      // 内部的暗
      g.fillStyle = K.lin(g, 0, dTop, 0, sill, ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.05)']); g.fillRect(dx0, dTop, dx1 - dx0, sill - dTop);
      g.restore();
      // 门框 + 敞开的两扇门板（向外开）
      g.strokeStyle = '#2a1a0e'; g.lineWidth = 12; g.beginPath(); g.moveTo(dx0, sill); g.lineTo(dx0, dTop); g.lineTo(dx1, dTop); g.lineTo(dx1, sill); g.stroke();
      K.poly(g, [dx0 - 6, dTop, dx0 - 56, dTop + 20, dx0 - 56, sill + 10, dx0 - 6, sill]); woodFill(g, q, '#4a3020', false, dx0, dTop, ['#2a1408', 0.3]);
      K.poly(g, [dx1 + 6, dTop, dx1 + 40, dTop + 16, dx1 + 40, sill + 8, dx1 + 6, sill]); woodFill(g, q, '#3a2414', false, dx1, dTop, ['#1a0a04', 0.4]);
      // 门闩（插销）
      g.fillStyle = ironGrad(g, 0, 640, 0, 660); g.fillRect(dx0 - 50, 648, 40, 12); g.fillRect(dx1 + 4, 648, 32, 12);
      // 门槛
      g.fillStyle = K.lin(g, 0, sill - 4, 0, sill + 14, ['#7a5434', '#2a180a']); g.fillRect(dx0 - 10, sill - 4, dx1 - dx0 + 20, 18);
      // 屋顶（切妻，厚雪）
      snowRoofFront(g, q, x0 - 40, x1 + 40, yE - 110, yE, { roof: '#2a201c', th: 42, inset: 0.2, icicles: 11 });
    })();
    // ---- 男坂石阶顶（锚点 0-440, 784-1080）----
    (function steps() {
      for (var s = 0; s < 6; s++) {
        var y = 790 + s * 50, x1 = 420 - s * 30, x0 = -20;
        g.fillStyle = K.lin(g, 0, y, 0, y + 50, ['#8a8682', '#5a5654']); K.poly(g, [x0, y, x1, y, x1 - 26, y + 50, x0, y + 50]); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0, y + 38, x1 - x0, 12);
        snowCap(g, q, x0, y + 2, x1 * 0.42, y + 2, 14, { ov: 4, droop: 6 });
        snowCap(g, q, x1 * 0.78, y + 2, x1, y + 2, 14, { ov: 4, droop: 6 });
      }
      stoneLantern(g, q, 400, 800, 0.9, false);
    })();
    // ---- 雪灯笼（锚点 520-760, 800-920）----
    (function snowLanterns() {
      var pos = [[560, 900, 1.0], [668, 880, 0.85], [748, 912, 0.75]];
      for (var p = 0; p < pos.length; p++) {
        var x = pos[p][0], b = pos[p][1], s = pos[p][2];
        if (q.light > 0) K.contact(g, x, b + 4, 46 * s, 10 * s, 0.4);
        g.fillStyle = K.lin(g, x - 40 * s, 0, x + 40 * s, 0, ['#ffffff', '#e4eaf2', '#b8c4d8']);
        K.path(g, 'M-34 0 C-38 -40 -30 -70 0 -76 C30 -70 38 -40 34 0 Z', x, b, s); g.fill();
        g.fillStyle = '#ffcf80'; K.path(g, 'M-12 -22 C-12 -40 12 -40 12 -22 Z', x, b, s); g.fill();
        if (q.light > 0) K.glow(g, x, b - 30 * s, 70 * s, '#ffb860', 0.5);
        g.fillStyle = 'rgba(255,240,200,0.9)'; K.ellipse(g, x, b - 26 * s, 4 * s, 6 * s); g.fill();
      }
    })();

    var L = lightMap(q, '#aeb2c0');
    lmLight(L, 700, 160, 1200, '#f2f0ea', 0.4, 0.8);
    lmLight(L, 650, 880, 300, '#ffc080', 0.4, 0.5);
    if (q.light > 0) { lmShade(L, 0.55, function (x) { K.poly(x, [250, 370, 1230, 370, 1270, 690, 210, 690]); }); lmShade(L, 0.45, function (x) { K.poly(x, [250, 690, 1230, 690, 1280, 750, 200, 750]); }); }
    applyLM(g, L);
    if (q.light > 0) { K.glow(g, 490, 454, 70, '#ffb060', 0.35); K.glow(g, 990, 454, 70, '#ffb060', 0.35); }
    finish(g, q, 0.32, 0.55);
  }
  defOnce('kagura', {
    draw: drawKagura,
    lights: [
      { x: 490, y: 454, r: 90, color: '#ffb060', i: 0.5, flicker: 0.3, kind: 'lamp' },
      { x: 990, y: 454, r: 90, color: '#ffb060', i: 0.5, flicker: 0.3, kind: 'lamp' },
      { x: 650, y: 870, r: 120, color: '#ffb860', i: 0.5, flicker: 0.4, kind: 'candle' }
    ],
    key: { x: -0.2, color: '#e4e6ee', amb: '#4a5064', rim: 0.6 },
    outdoor: true
  });

  /* =================================================================
   * 雪牢（神社冰室）snow_prison：冰块砌的墙、木格栅牢门、稻草、提灯、厚木门
   * ================================================================= */
  function iceBlocks(g, q, x, y, w, h, o) {
    o = o || {};
    var bh = o.bh || 70, bw = o.bw || 130, rnd = K.rng(o.seed || 3);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = o.joint || '#6a5a48'; g.fillRect(x, y, w, h);
    for (var r = 0; r * bh < h + bh; r++) {
      var yy = y + r * bh, xx = x - (r % 2 ? bw / 2 : 0);
      while (xx < x + w) {
        var ww = bw * (0.8 + rnd() * 0.4), t = rnd();
        var g0 = K.lin(g, xx, yy, xx + ww, yy + bh, [K.mix('#dfeef8', '#b8d4ea', t), K.mix('#9ac0dc', '#7aa4c8', t), K.mix('#6a92b8', '#4a76a0', t)]);
        K.rr(g, xx + 3, yy + 3, ww - 6, bh - 6, 6); g.fillStyle = g0; g.fill();
        if (q.model > 0) {
          // 冰里的裂纹与气泡
          g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2; g.beginPath(); var cx = xx + ww * rnd(), cy = yy + bh * rnd(); g.moveTo(cx, cy); g.lineTo(cx + 16 - rnd() * 32, cy + 10 + rnd() * 16); g.lineTo(cx + 20 - rnd() * 40, cy + 20 + rnd() * 16); g.stroke();
          if (q.model >= 2) { g.fillStyle = 'rgba(255,255,255,0.6)'; for (var b = 0; b < 4; b++) { g.beginPath(); g.arc(xx + 10 + rnd() * (ww - 20), yy + 10 + rnd() * (bh - 20), 1 + rnd() * 2, 0, TAU); g.fill(); } }
          g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(xx + 6, yy + 5, ww - 12, 3);
          g.fillStyle = 'rgba(20,40,70,0.25)'; g.fillRect(xx + 6, yy + bh - 9, ww - 12, 4);
        }
        xx += ww;
      }
    }
    g.restore();
  }
  function drawSnowPrison(g, q) {
    var i, R = Room({ hy: 440, top: 110, bot: 820 });
    // 天花：厚木板 + 霜
    K.poly(g, [0, 0, W, 0, W, R.top, 0, R.top]); woodFill(g, q, '#2a2420', true, 0, 0, ['#1a1818', 0.35]);
    g.fillStyle = 'rgba(200,215,235,0.25)'; K.poly(g, [0, 0, W, 0, W, R.top, 0, R.top]); g.fill();
    for (i = 0; i < 4; i++) { var by = 20 + i * 24; g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, by, W, 4); }
    // 后墙：冰块
    iceBlocks(g, q, 0, R.top, W, R.bot - R.top, { seed: 11, bh: 80, bw: 150 });
    // 左上的冰墙转角（锚点 0-560, 0-360）：左侧墙面（透视）
    g.save(); K.poly(g, [0, 0, 300, R.top - 20, 300, R.bot - 60, 0, H]); g.clip();
    iceBlocks(g, q, 0, 0, 320, H, { seed: 23, bh: 110, bw: 120 });
    g.fillStyle = K.lin(g, 0, 0, 300, 0, ['rgba(0,10,30,0.15)', 'rgba(0,10,30,0.45)']); g.fillRect(0, 0, 320, H);
    g.restore();
    g.fillStyle = '#2a2420'; K.poly(g, [290, R.top - 22, 312, R.top - 18, 312, R.bot - 56, 290, R.bot - 60]); g.fill();
    // 木柱与横梁
    var posts = [312, 1540];
    for (i = 0; i < posts.length; i++) { g.beginPath(); g.rect(posts[i] - 22, R.top - 10, 44, R.bot - R.top + 10); woodFill(g, q, '#3a2a1c', false, posts[i], 0, ['#1a1008', 0.3]); g.fillStyle = 'rgba(210,225,245,0.25)'; g.fillRect(posts[i] - 22, R.top - 10, 8, R.bot - R.top); }
    g.beginPath(); g.rect(0, R.top - 18, W, 34); woodFill(g, q, '#3a2a1c', true, 0, R.top, ['#1a1008', 0.35]); g.fillStyle = 'rgba(220,235,250,0.35)'; g.fillRect(0, R.top - 18, W, 4);
    if (q.model > 0) icicles(g, q, 40, W - 40, R.top + 16, 30, 40, K.rng(9));
    // 地面：夯土 + 霜 + 木屑
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]); g.fillStyle = '#5a5450'; g.fill();
    grain(g, q, 0.5, function (x) { K.poly(x, [0, R.bot, W, R.bot, W, H, 0, H]); });
    K.poly(g, [0, R.bot, W, R.bot, W, H, 0, H]); g.fillStyle = K.lin(g, 0, R.bot, 0, H, ['rgba(200,215,235,0.25)', 'rgba(0,0,0,0.25)']); g.fill();
    g.fillStyle = K.lin(g, 0, R.bot - 2, 0, R.bot + 40, ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']); g.fillRect(0, R.bot - 2, W, 42);
    // 牢内（格栅之后）：稻草与草席
    g.fillStyle = 'rgba(160,130,70,0.85)'; K.poly(g, [660, R.bot - 4, 1420, R.bot - 4, 1440, R.bot + 16, 640, R.bot + 16]); g.fill();
    // ---- 木格栅（锚点 600-1480, 184-824）----
    (function lattice() {
      var x0 = 608, x1 = 1474, y0 = 196, y1 = R.bot + 4;
      // 上下横木
      function beam(y, h2) { g.beginPath(); g.rect(x0 - 10, y, x1 - x0 + 20, h2); woodFill(g, q, '#4a3624', true, x0, y, ['#2a1a0e', 0.25]); g.fillStyle = 'rgba(220,235,250,0.3)'; g.fillRect(x0 - 10, y, x1 - x0 + 20, 3); }
      var n = byM(q, 12, 16, 20), bw = 22;
      for (var b = 0; b <= n; b++) {
        var bx = lerp(x0, x1, b / n);
        g.beginPath(); g.rect(bx - bw / 2, y0, bw, y1 - y0); woodFill(g, q, '#5a4030', false, bx, y0, ['#3a2618', 0.25]);
        g.fillStyle = K.lin(g, bx - bw / 2, 0, bx + bw / 2, 0, ['rgba(255,220,170,0.15)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']); g.fillRect(bx - bw / 2, y0, bw, y1 - y0);
        if (q.model > 0) { g.fillStyle = 'rgba(230,240,255,0.5)'; g.fillRect(bx - bw / 2, y0 + 20, 3, y1 - y0 - 40); }
      }
      beam(y0 - 16, 30); beam(470, 24); beam(y1 - 26, 30);
      // 低矮的小门（潜り戸）+ 铁锁
      var dx0 = lerp(x0, x1, 0.42), dx1 = lerp(x0, x1, 0.58), dy0 = 560;
      g.strokeStyle = '#2a1a0e'; g.lineWidth = 10; g.strokeRect(dx0, dy0, dx1 - dx0, y1 - dy0 - 26);
      g.fillStyle = ironGrad(g, dx1 - 30, 0, dx1, 0); K.rr(g, dx1 - 34, dy0 + 90, 34, 44, 4); g.fill();
      g.strokeStyle = '#6a6a72'; g.lineWidth = 5; g.beginPath(); g.arc(dx1 - 17, dy0 + 90, 11, PI, TAU); g.stroke();
      g.fillStyle = '#0a0806'; g.fillRect(dx1 - 19, dy0 + 106, 4, 12);
      for (var h3 = 0; h3 < 2; h3++) { g.fillStyle = ironGrad(g, 0, 0, 30, 0); g.fillRect(dx0 - 6, dy0 + 30 + h3 * 150, 28, 10); }
      // 格栅上的霜
      if (q.model > 0) { g.fillStyle = 'rgba(230,240,255,0.35)'; g.fillRect(x0 - 10, y0 - 16, x1 - x0 + 20, 5); }
    })();
    // ---- 稻草（锚点 704-1384, 840-960）：格栅前散落 ----
    (function straw() {
      var sr = K.rng(77);
      K.poly(g, [700, 860, 1380, 850, 1400, 950, 690, 960]); g.fillStyle = 'rgba(150,120,60,0.55)'; g.fill();
      g.strokeStyle = 'rgba(210,180,110,0.85)'; g.lineWidth = 2;
      for (var k = 0; k < byM(q, 40, 90, 160); k++) { var x = 690 + sr() * 720, y = 846 + sr() * 112, a = sr() * PI, l = 16 + sr() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.3); g.stroke(); }
      g.strokeStyle = 'rgba(120,90,40,0.7)'; g.lineWidth = 1.5;
      for (var k2 = 0; k2 < byM(q, 20, 40, 70); k2++) { var x2 = 690 + sr() * 720, y2 = 846 + sr() * 112, a2 = sr() * PI, l2 = 14 + sr() * 24; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + Math.cos(a2) * l2, y2 + Math.sin(a2) * l2 * 0.3); g.stroke(); }
    })();
    // ---- 提灯（锚点 176-256, 440-560）：挂在木架上的纸灯笼 ----
    var lx = 216, ly = 500;
    (function lantern() {
      g.fillStyle = '#3a2a1c'; g.fillRect(lx - 70, 410, 8, 520); g.fillRect(lx - 70, 410, 90, 8);
      if (q.light > 0) K.contact(g, lx - 66, 930, 40, 6, 0.5);
      g.strokeStyle = '#2a2a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, 418); g.lineTo(lx, 446); g.stroke();
      g.fillStyle = '#2a1a10'; g.fillRect(lx - 22, 444, 44, 8); g.fillRect(lx - 22, 548, 44, 8);
      g.fillStyle = K.lin(g, lx - 30, 0, lx + 30, 0, ['#e89a50', '#fff4d0', '#e08a40']); K.ellipse(g, lx, 500, 30, 50); g.fill();
      g.strokeStyle = 'rgba(140,70,30,0.5)'; g.lineWidth = 1.5; for (var r = 0; r < 6; r++) { K.ellipse(g, lx, 462 + r * 15, 30 * Math.sin(PI * (r + 1) / 7.2), 2.5); g.stroke(); }
      K.text(g, '白蛾', lx, 500, 16, 'rgba(120,30,20,0.8)', { weight: 'bold' });
    })();
    // ---- 厚木门（锚点 1600-1856, 240-840）：冰室入口 ----
    (function door_() {
      var x = 1612, y = 256, w = 232, h = R.bot + 10 - 256;
      // 门缝外的冷光
      g.fillStyle = 'rgba(210,225,250,0.9)'; g.fillRect(x - 4, y - 4, w + 8, h + 4);
      g.fillStyle = '#2a2420'; g.fillRect(x - 24, y - 30, w + 48, 30); g.fillRect(x - 24, y - 30, 22, h + 30); g.fillRect(x + w + 2, y - 30, 22, h + 30);
      g.beginPath(); g.rect(x, y, w, h); woodFill(g, q, '#4a3a2a', false, x, y, ['#2a2018', 0.3]);
      g.fillStyle = K.lin(g, x, 0, x + w, 0, ['rgba(255,230,200,0.08)', 'rgba(0,0,0,0.3)']); g.fillRect(x, y, w, h);
      for (var p = 1; p < 4; p++) { g.fillStyle = 'rgba(10,6,2,0.7)'; g.fillRect(x + w * p / 4 - 1.5, y, 3, h); }
      for (var bI = 0; bI < 3; bI++) { var by2 = y + 60 + bI * (h - 120) / 2; g.fillStyle = ironGrad(g, 0, by2 - 8, 0, by2 + 8); g.fillRect(x, by2 - 8, w, 16); for (var rI = 0; rI < 5; rI++) rivet(g, q, x + 20 + rI * (w - 40) / 4, by2, 3.5); }
      g.strokeStyle = '#6a6a72'; g.lineWidth = 7; g.beginPath(); g.arc(x + 40, y + h * 0.5, 18, 0.2, PI - 0.2); g.stroke();
      // 门上的霜与冰柱
      g.fillStyle = 'rgba(220,235,250,0.35)'; g.fillRect(x, y, w, 30);
      if (q.model > 0) icicles(g, q, x - 20, x + w + 20, y - 2, 8, 30, K.rng(3));
    })();

    var L = lightMap(q, '#6a7896');
    lmLight(L, lx, 500, 760, '#ffb878', 0.85, 0.85);
    lmLight(L, 1728, 560, 420, '#c8d8f4', 0.4, 1);
    lmLight(L, 1000, 400, 900, '#9ab0d8', 0.3, 0.7);   // 冰墙的透光感
    if (q.light > 0) { lmDark(L, 0.25, function (x) { x.beginPath(); x.rect(0, 0, W, R.top); }); }
    if (q.light >= 2) lmShade(L, 0.4, function (x) { for (var b = 0; b <= 16; b++) { var bx = lerp(608, 1474, b / 16); x.rect(bx + 14 + (bx - lx) * 0.05, R.bot, 18, 200); } });
    applyLM(g, L);
    if (q.light > 0) { K.glow(g, lx, 500, 200, '#ffb060', 0.45); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = K.rad(g, 420, 440, 20, 600, [[0, 'rgba(255,190,130,0.12)'], [1, 'rgba(255,190,130,0)']]); g.fillRect(0, 0, 1100, H); g.restore(); }
    if (q.light >= 2) { dust(g, K.rng(93), byM(q, 10, 20, 30), 1640, 260, 200, 560, '#e8f0ff', 0.4); softShaft(g, [1610, 260, 1846, 260, 1700, 1000, 1300, 1000], '#d8e6ff', 0.06, 1728, 300, 1600, 1000, 4); }
    finish(g, q, 0.55, 0.45);
  }
  defOnce('snow_prison', {
    draw: drawSnowPrison,
    lights: [{ x: 216, y: 500, r: 200, color: '#ffb060', i: 0.7, flicker: 0.4, kind: 'lamp' }, { x: 1728, y: 540, r: 160, color: '#c8d8f4', i: 0.3, flicker: 0, kind: 'window' }],
    key: { x: -0.6, color: '#ffc08a', amb: '#1e2840', rim: 0.6 },
    outdoor: false
  });
})(typeof window !== 'undefined' ? window : globalThis);
