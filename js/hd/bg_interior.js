/* DARK MOOD Ⅱ 室内 HD 背景（DM.HDBG）
 * ------------------------------------------------------------------
 * inn_entrance inn_hearth inn_room inn_kitchen inn_bath kumagai_hut
 * shiramine_hall shiramine_2f annex shrine_hall kagura snow_prison
 * 设计坐标 1920x1080；锚点 = locations.js × 4。2003 年 2 月，东北深山的雪葬村。
 * 光照流程：反照率 → AO/接触阴影/投影 → 低分辨率光照贴图 multiply → 自发光（炭火、灯、雪光、蒸汽、浮尘）。
 * 规则：ES5；不用 ctx.filter / Path2D / roundRect；shadowBlur 只经 K.shadow；确定性随机（K.rng）。
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK;
  if (!K || !DM.HDBG) return;
  var W = K.DW, H = K.DH, PI = Math.PI, TAU = PI * 2;
  var KX = -0.3;                       // 当前场景主光的水平方向（-1 左 … 1 右）

  /* ---------------- 基础工具（与第一部 bg_mansion 同源） ---------------- */
  function setKey(kx) { KX = kx; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fillP(g, pts, st) { K.poly(g, pts); g.fillStyle = st; g.fill(); }
  function rect(g, x, y, w, h, st) { g.fillStyle = st; g.fillRect(x, y, w, h); }
  function hi(a) { return 'rgba(255,238,214,' + a + ')'; }
  function lo(a) { return 'rgba(0,0,0,' + a + ')'; }
  function circle(g, x, y, r, st) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = st; g.fill(); }
  function ell(g, x, y, rx, ry, st) { K.ellipse(g, x, y, rx, ry); g.fillStyle = st; g.fill(); }
  function stroke(g, w, st) { g.lineWidth = w; g.strokeStyle = st; g.stroke(); }
  function seg(g, x0, y0, x1, y1, w, st) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); stroke(g, w, st); }
  function M(q, a, b, c) { return K.byModel(q, a, b, c); }
  // 水平方向的圆柱明暗（腿、柱、管子、瓶子）
  function cylGrad(g, x, w, col, o) {
    o = o || {};
    var hl = KX <= 0 ? 0.3 : 0.7;
    return K.lin(g, x, 0, x + w, 0, [
      [0, K.shade(col, -0.55)], [Math.max(0.05, hl - 0.22), K.shade(col, -0.05)],
      [hl, K.shade(col, o.spec || 0.28)], [Math.min(0.95, hl + 0.2), col], [1, K.shade(col, -0.6)]]);
  }
  function cyl(g, x, y, w, h, col, o) { g.fillStyle = cylGrad(g, x, w, col, o); g.fillRect(x, y, w, h); }
  // 金属（黄铜/青铜/铁）渐变
  function metalGrad(g, x0, y0, x1, y1, base) {
    return K.lin(g, x0, y0, x1, y1, [[0, K.shade(base, -0.6)], [0.3, K.shade(base, -0.1)], [0.45, K.shade(base, 0.45)],
      [0.55, K.shade(base, 0.1)], [0.8, K.shade(base, -0.35)], [1, K.shade(base, -0.65)]]);
  }
  // 纹理填充（非等比缩放、可选旋转）；tex=0 时回退纯色
  function texFill(g, q, fallback, t, ox, oy, sx, sy, alpha) {
    if (!t || q.tex <= 0) { if (alpha !== undefined) { g.save(); g.globalAlpha *= alpha; } g.fillStyle = fallback; g.fill(); if (alpha !== undefined) g.restore(); return; }
    var size = K.tileSize(q, t[2]), tile = K.tex(t[0], t[1], size);
    var pat = g.createPattern(tile, 'repeat');
    g.save(); if (alpha !== undefined) g.globalAlpha *= alpha;
    g.translate(ox || 0, oy || 0); var m = t[2] / tile.width; g.scale(m * (sx || 1), m * (sy || 1));
    g.fillStyle = pat; g.fill(); g.restore();
  }
  // 倒角叠加（凸起面板）：上/左（受光侧）亮，下/右暗
  function bevel(g, x, y, w, h, b, ha, la) {
    ha = ha === undefined ? 0.16 : ha; la = la === undefined ? 0.38 : la;
    fillP(g, [x, y, x + w, y, x + w - b, y + b, x + b, y + b], hi(ha));
    fillP(g, [x, y + h, x + b, y + h - b, x + w - b, y + h - b, x + w, y + h], lo(la));
    var L = KX <= 0, l1 = L ? hi(ha * 0.7) : lo(la * 0.6), r1 = L ? lo(la * 0.7) : hi(ha * 0.6);
    fillP(g, [x, y, x + b, y + b, x + b, y + h - b, x, y + h], l1);
    fillP(g, [x + w, y, x + w, y + h, x + w - b, y + h - b, x + w - b, y + b], r1);
  }
  // 凹槽（凹面板，明暗与倒角相反）
  function groove(g, x, y, w, h, b, a) {
    a = a === undefined ? 0.4 : a;
    fillP(g, [x, y, x + w, y, x + w - b, y + b, x + b, y + b], lo(a));
    fillP(g, [x, y + h, x + b, y + h - b, x + w - b, y + h - b, x + w, y + h], hi(a * 0.35));
    fillP(g, [x, y, x + b, y + b, x + b, y + h - b, x, y + h], KX <= 0 ? lo(a * 0.8) : hi(a * 0.3));
    fillP(g, [x + w, y, x + w, y + h, x + w - b, y + h - b, x + w - b, y + b], KX <= 0 ? hi(a * 0.3) : lo(a * 0.8));
  }
  // 柔和矩形阴影（多层叠加近似模糊，不用 shadowBlur）
  function softRect(g, x, y, w, h, r, a, col) {
    col = col || '#000';
    var n = 4;
    for (var i = 0; i < n; i++) {
      var e = r * (1 - i / n);
      K.rr(g, x - e, y - e, w + e * 2, h + e * 2, e + 2);
      g.fillStyle = K.rgba(col, a / n); g.fill();
    }
  }
  function softPoly(g, pts, a, n, grow, cx, cy) {
    n = n || 3;
    for (var i = 0; i < n; i++) {
      var k = 1 + grow * (1 - i / n), arr = [];
      for (var j = 0; j < pts.length; j += 2) arr.push(cx + (pts[j] - cx) * k, cy + (pts[j + 1] - cy) * k);
      fillP(g, arr, lo(a / n));
    }
  }
  // 线脚：从上往下的一组色带 [[高度, 颜色], ...]
  function bands(g, x, y, w, list) {
    var yy = y;
    for (var i = 0; i < list.length; i++) { g.fillStyle = list[i][1]; g.fillRect(x, yy, w, list[i][0]); yy += list[i][0]; }
    return yy;
  }
  // 后墙铺满画面；vx,vy 消失点；base 后墙墙脚 y；top 后墙顶 y；f 相机到后墙的距离（设计像素）
  function Room(vx, vy, base, top, f) {
    var R = { vx: vx, vy: vy, base: base, top: top, f: f || 1500 };
    R.dB = (H - vy) / (base - vy);
    R.p = function (x, y, k) { return [vx + (x - vx) * k, vy + (y - vy) * k]; };
    R.px = function (x, k) { return vx + (x - vx) * k; };
    R.py = function (y, k) { return vy + (y - vy) * k; };
    R.dAt = function (y) { return (y - vy) / (base - vy); };       // 地面 y → 深度缩放（后墙=1）
    R.yAt = function (d) { return vy + (base - vy) * d; };
    R.kWall = function (yf) { return (base - vy) / (yf - vy); };    // 前缘落地在 yf、背面贴后墙时的 k
    // 地面坐标（X 为后墙上的 x，d 为深度缩放）→ 屏幕
    R.fp = function (X, d) { return [vx + (X - vx) * d, vy + (base - vy) * d]; };
    return R;
  }
  // 透视长方体的各个可见面：front 正面 (x,y,w,h)，k 背面缩放（<1）
  function boxGeo(R, x, y, w, h, k) {
    var p = R.p, tl = p(x, y, k), tr = p(x + w, y, k), bl = p(x, y + h, k), br = p(x + w, y + h, k);
    return {
      x: x, y: y, w: w, h: h, k: k, tl: tl, tr: tr, bl: bl, br: br,
      front: [x, y, x + w, y, x + w, y + h, x, y + h],
      top: y > R.vy ? [x, y, x + w, y, tr[0], tr[1], tl[0], tl[1]] : null,
      bottom: y + h < R.vy ? [x, y + h, x + w, y + h, br[0], br[1], bl[0], bl[1]] : null,
      left: x > R.vx ? [x, y, tl[0], tl[1], bl[0], bl[1], x, y + h] : null,
      right: x + w < R.vx ? [x + w, y, x + w, y + h, br[0], br[1], tr[0], tr[1]] : null
    };
  }
  // 画一个带材质的盒子。o: { col, t:纹理, top, side, front:false, edge:高光 }
  function box(g, q, R, x, y, w, h, k, o) {
    o = o || {};
    var b = boxGeo(R, x, y, w, h, k), col = o.col || '#4a2c1a';
    var sideL = KX < 0 ? 0.06 : -0.3, sideR = KX < 0 ? -0.32 : 0.04;
    if (b.left && o.sides !== false) { K.poly(g, b.left); texFill(g, q, o.sideCol || col, o.t); fillP(g, b.left, sideL >= 0 ? hi(sideL) : lo(-sideL)); }
    if (b.right && o.sides !== false) { K.poly(g, b.right); texFill(g, q, o.sideCol || col, o.t); fillP(g, b.right, sideR >= 0 ? hi(sideR) : lo(-sideR)); }
    if (b.bottom && o.bottomFace !== false) fillP(g, b.bottom, K.shade(col, -0.6));
    if (b.top && o.topFace !== false) {
      K.poly(g, b.top); texFill(g, q, o.topCol || K.shade(col, 0.1), o.tt || o.t);
      K.poly(g, b.top); g.fillStyle = K.lin(g, 0, b.tl[1], 0, y, [hi(0.02), hi(o.topHi === undefined ? 0.14 : o.topHi)]); g.fill();
    }
    if (o.front !== false) {
      K.rr(g, x, y, w, h, 0); texFill(g, q, col, o.t);
      g.fillStyle = K.lin(g, 0, y, 0, y + h, [hi(0.05), lo(o.frontLo === undefined ? 0.22 : o.frontLo)]); g.fillRect(x, y, w, h);
    }
    if (o.edge !== false && q.light >= 1 && b.top) { g.fillStyle = hi(0.22); g.fillRect(x, y, w, Math.max(1.2, h * 0.01)); }
    return b;
  }
  // 灰泥墙
  function plasterWall(g, q, x, y, w, h, o) {
    g.beginPath(); g.rect(x, y, w, h);
    texFill(g, q, o.col, o.t || TX.plasterW);
    if (o.tint) { g.save(); g.globalCompositeOperation = 'multiply'; rect(g, x, y, w, h, o.tint); g.restore(); }
    g.fillStyle = K.lin(g, 0, y, 0, y + h, [[0, lo(0.3)], [0.4, lo(0.04)], [1, lo(0.1)]]);
    g.fillRect(x, y, w, h);
  }
  // 透视木地板：木板朝消失点汇聚，逐板做仿射纹理映射
  function plankFloor(g, q, R, o) {
    o = o || {};
    var vx = R.vx, base = R.base, dB = R.dB, pw = o.pw || 70, rnd = K.rng(o.seed || 7);
    var far = o.far || '#2c1a0e', near = o.near || '#5a3a20', t = o.t || TX.floorW;
    K.poly(g, [0, base, W, base, W, H, 0, H]);
    g.fillStyle = K.lin(g, 0, base, 0, H, [far, near]); g.fill();
    var pat = null, N = 0;
    if (q.tex > 0) { N = K.tileSize(q, t[2]); pat = g.createPattern(K.tex(t[0], t[1], N), 'repeat'); }
    var Lz = (o.len || 7) * pw / R.f, zF = 1 / dB;
    for (var X = -pw; X < W + pw; X += pw) {
      var a0 = X, a1 = X + pw, f0 = vx + (a0 - vx) * dB, f1 = vx + (a1 - vx) * dB;
      if (f1 < -50 && a1 < 0) continue;
      if (f0 > W + 50 && a0 > W) continue;
      var pts = [a0, base, a1, base, f1, H, f0, H];
      if (pat) {
        g.save(); K.poly(g, pts); g.clip();
        var wf = f1 - f0, bx = f0 - a0, by = H - base, rep = 2 + rnd() * 1.5;
        g.globalAlpha = 0.95;
        g.transform(wf / N, 0, bx / (N * rep), by / (N * rep), a0, base);
        g.fillStyle = pat; g.fillRect(0, -N, N, N * (rep + 2));
        g.restore();
      }
      var tone = rnd.range(-1, 1);
      fillP(g, pts, tone > 0 ? hi(tone * 0.05) : lo(-tone * 0.16));
      // 端头接缝（错缝）
      if (q.model >= 1) {
        var z = 1 - rnd() * Lz;
        while (z > zF) {
          var d = 1 / z, y = R.yAt(d), xa = vx + (a0 - vx) * d, xb = vx + (a1 - vx) * d;
          rect(g, xa, y - 0.8 * d, xb - xa, 1.4 * d, lo(0.55));
          rect(g, xa, y + 0.6 * d, xb - xa, 0.8 * d, hi(0.06));
          z -= Lz * (0.8 + rnd() * 0.4);
        }
      }
    }
    // 板缝
    for (var X2 = -pw; X2 < W + 2 * pw; X2 += pw) {
      var fx = vx + (X2 - vx) * dB, s = KX <= 0 ? 1 : -1;
      fillP(g, [X2 - 0.7, base, X2 + 0.7, base, fx + 0.7 * dB, H, fx - 0.7 * dB, H], lo(0.6));
      if (q.model >= 1) fillP(g, [X2 + 0.7 * s, base, X2 + 1.4 * s, base, fx + 1.4 * dB * s, H, fx + 0.7 * dB * s, H], hi(0.07));
    }
    // 远处暗、近处略亮
    K.poly(g, [0, base, W, base, W, H, 0, H]);
    g.fillStyle = K.lin(g, 0, base, 0, H, [[0, lo(0.45)], [0.25, lo(0.12)], [1, lo(0)]]); g.fill();
  }
  // 透视方砖/石板地面。o: { tile, cols:[c1,c2] 棋盘或 null, t, mortar, seed, checker }
  function tileFloor(g, q, R, o) {
    o = o || {};
    var vx = R.vx, base = R.base, dB = R.dB, ts = o.tile || 110, rnd = K.rng(o.seed || 9);
    var zF = 1 / dB, dz = ts / R.f;
    K.poly(g, [0, base, W, base, W, H, 0, H]); g.fillStyle = o.mortar || '#141018'; g.fill();
    var gap = o.gap === undefined ? 2.2 : o.gap;
    var rows = [], z = 1;
    while (z > zF - dz) { rows.push(z); z -= dz; }
    for (var r = 0; r < rows.length; r++) {
      var dA = 1 / rows[r], dBn = rows[r] - dz > 0.05 ? 1 / (rows[r] - dz) : dB * 2;
      var yA = R.yAt(dA), yB = R.yAt(dBn);
      if (yA > H) break;
      var off = o.stagger ? (r % 2) * ts * 0.5 : 0;
      for (var X = -ts * 2 - off; X < W + ts * 2; X += ts) {
        var ga = gap * dA * 0.5, gb = gap * dBn * 0.5;
        var x0a = vx + (X - vx) * dA, x1a = vx + (X + ts - vx) * dA, x0b = vx + (X - vx) * dBn, x1b = vx + (X + ts - vx) * dBn;
        if (Math.max(x1a, x1b) < 0 || Math.min(x0a, x0b) > W) continue;
        var pts = [x0a + ga, yA + ga, x1a - ga, yA + ga, x1b - gb, yB - gb, x0b + gb, yB - gb];
        var ci = Math.round(X / ts + (o.stagger ? 0 : r)) & 1;
        var col = o.cols ? o.cols[ci] : o.col;
        var tv = rnd.range(-1, 1);
        K.poly(g, pts);
        var tt = o.ts ? o.ts[ci] : o.t;
        texFill(g, q, col, tt, x0a * 0.37, yA * 0.53, 1, 1);
        fillP(g, pts, tv > 0 ? hi(tv * (o.var || 0.05)) : lo(-tv * (o.var || 0.05) * 2.4));
        if (q.model >= 1 && o.bevel !== false) {
          // 砖面上缘受光、下缘暗
          fillP(g, [x0a + ga, yA + ga, x1a - ga, yA + ga, x1a - ga - 2 * dA, yA + ga + 2.5 * dA, x0a + ga + 2 * dA, yA + ga + 2.5 * dA], hi(0.08));
          fillP(g, [x0b + gb, yB - gb, x1b - gb, yB - gb, x1b - gb, yB - gb - 2.5 * dBn, x0b + gb, yB - gb - 2.5 * dBn], lo(0.25));
        }
      }
    }
    K.poly(g, [0, base, W, base, W, H, 0, H]);
    g.fillStyle = K.lin(g, 0, base, 0, H, [[0, lo(0.5)], [0.3, lo(0.12)], [1, lo(0)]]); g.fill();
  }
  // 地面上的四边形（地面坐标：X 为后墙 x，d 为深度缩放）
  function floorQuad(R, X0, X1, d0, d1) {
    var a = R.fp(X0, d0), b = R.fp(X1, d0), c = R.fp(X1, d1), e = R.fp(X0, d1);
    return [a[0], a[1], b[0], b[1], c[0], c[1], e[0], e[1]];
  }
  // 低分辨率光照贴图 → multiply。list 项：
  //   {x,y,r,ry,c,i,q}  椭圆光（q = 生效所需的最低光影质量）
  //   {pts,c,i,fx0,fy0,fx1,fy1,q}  多边形（沿 f0→f1 渐隐）
  //   {lin:[x0,y0,x1,y1], stops, q}  整屏线性渐变（加色）
  function lightMap(g, q, amb, list) {
    var f = q.light >= 2 ? 0.25 : q.light === 1 ? 0.2 : 0.125;
    var lw = Math.max(32, Math.round(W * q.s * f)), lh = Math.max(18, Math.round(H * q.s * f));
    var c = K.canvas(lw, lh), x = c.getContext('2d');
    x.setTransform(lw / W, 0, 0, lh / H, 0, 0);
    x.fillStyle = K.mix(amb, '#ffffff', 0.07); x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    for (var i = 0; i < list.length; i++) {
      var L = list[i];
      if ((L.q || 0) > q.light) continue;
      if (L.lin) { x.fillStyle = K.lin(x, L.lin[0], L.lin[1], L.lin[2], L.lin[3], L.stops); x.fillRect(0, 0, W, H); continue; }
      if (L.pts) {
        K.poly(x, L.pts); x.fillStyle = K.lin(x, L.fx0, L.fy0, L.fx1, L.fy1, [[0, K.rgba(L.c, L.i)], [1, K.rgba(L.c, 0)]]); x.fill();
        continue;
      }
      x.save(); x.translate(L.x, L.y); x.scale(1, (L.ry || L.r) / L.r);
      var a = L.i, fall = L.fall || 0.4;
      x.fillStyle = K.rad(x, 0, 0, 0, L.r, [[0, K.rgba(L.c, a)], [fall, K.rgba(L.c, a * 0.45)], [1, K.rgba(L.c, 0)]]);
      x.fillRect(-L.r, -L.r, L.r * 2, L.r * 2); x.restore();
    }
    g.save(); g.globalCompositeOperation = 'multiply'; g.drawImage(c, 0, 0, W, H); g.restore();
  }
  // 光柱（窗→地）
  function shaft(g, q, pts, c, a, x0, y0, x1, y1) { if (q.light >= 2) K.shaft(g, pts, c, a, x0, y0, x1, y1); }
  // 收尾：暗角 + 颗粒
  function finish(g, q, o) {
    o = o || {};
    K.vignette(g, W, H, o.vig === undefined ? 0.55 : o.vig, o.inner || 0.4);
    if (q.tex >= 2 && o.grain !== false) {
      g.save(); g.globalCompositeOperation = 'overlay'; g.beginPath(); g.rect(0, 0, W, H);
      texFill(g, q, '#808080', TX.grain, 0, 0, 1, 1, 0.06); g.restore();
    }
  }
  // 地面上的漫反射高光（清漆地板倒映窗/灯）
  function floorSheen(g, q, R, x, w, c, a, y1) {
    if (q.light < 2) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    var y0 = R.base + 2, yy = y1 || H;
    var dB = R.dB, xa = R.vx + (x - R.vx) * ((yy - R.vy) / (R.base - R.vy));
    K.poly(g, [x - w / 2, y0, x + w / 2, y0, xa + w * 0.9, yy, xa - w * 0.9, yy]);
    g.fillStyle = K.lin(g, 0, y0, 0, yy, [[0, K.rgba(c, a)], [0.5, K.rgba(c, a * 0.35)], [1, K.rgba(c, 0)]]); g.fill();
    g.restore(); void dB;
  }
  // 灯光 meta 辅助
  function LT(x, y, r, color, i, flicker, kind) { return { x: x, y: y, r: r, color: color, i: i, flicker: flicker || 0, kind: kind }; }

  /* ================================================================
   * 材质预设（参数固定以共享缓存）
   * ================================================================ */
  var TX = {
    sugi:    ['wood', { c1: '#24160c', c2: '#54361e', gap: '#24160c', planks: 1, dir: 'v', seed: 101, ring: 3 }, 200],
    sugiH:   ['wood', { c1: '#24160c', c2: '#54361e', gap: '#24160c', planks: 1, dir: 'h', seed: 102, ring: 3 }, 200],
    hinoki:  ['wood', { c1: '#8a6a44', c2: '#c8a878', gap: '#8a6a44', planks: 1, dir: 'v', seed: 103, ring: 2 }, 200],
    hinokiH: ['wood', { c1: '#8a6a44', c2: '#c8a878', gap: '#8a6a44', planks: 1, dir: 'h', seed: 104, ring: 2 }, 200],
    keyaki:  ['wood', { c1: '#4a2a14', c2: '#8a5a30', gap: '#4a2a14', planks: 1, dir: 'v', seed: 105, ring: 3.5 }, 200],
    keyakiH: ['wood', { c1: '#4a2a14', c2: '#8a5a30', gap: '#4a2a14', planks: 1, dir: 'h', seed: 106, ring: 3.5 }, 200],
    soot:    ['wood', { c1: '#100a06', c2: '#34241a', gap: '#100a06', planks: 1, dir: 'h', seed: 107, ring: 4 }, 260],
    board:   ['wood', { c1: '#3a2816', c2: '#6a4c2c', gap: '#1a1008', planks: 3, dir: 'v', seed: 108, ring: 2.5 }, 300],
    floorW:  ['wood', { c1: '#24160c', c2: '#4e3420', gap: '#24160c', planks: 1, dir: 'v', seed: 109, ring: 2.4 }, 128],
    floorL:  ['wood', { c1: '#5a4028', c2: '#8a6844', gap: '#5a4028', planks: 1, dir: 'v', seed: 110, ring: 2.2 }, 128],
    tatami:  ['tatami', { c1: '#8a8048', c2: '#bab070', seed: 111, rows: 90 }, 120],
    tatamiO: ['tatami', { c1: '#7a6c42', c2: '#a89a62', seed: 112, rows: 90 }, 120],
    tsuchi:  ['plaster', { c1: '#8a7454', c2: '#a8926c', seed: 113, stain: 0.4 }, 300],
    tsuchiD: ['plaster', { c1: '#5a4a36', c2: '#76644a', seed: 114, stain: 0.6 }, 300],
    plasterW: ['plaster', { c1: '#b8b2a4', c2: '#d4cec0', seed: 115, stain: 0.3 }, 300],
    paper:   ['paper', { c1: '#d8d2c0', c2: '#f4eee0', seed: 117 }, 120],
    tataki:  ['noise', { c1: '#34302c', c2: '#5a544c', scale: 9, oct: 4, seed: 121, contrast: 1.3 }, 200],
    stoneF:  ['noise', { c1: '#3a3a40', c2: '#62626a', scale: 5, oct: 4, seed: 122, contrast: 1.3 }, 200],
    iron:    ['metal', { c1: '#1a1a1e', c2: '#46464e', seed: 123 }, 120],
    snow:    ['snow', { c1: '#b4c0d8', c2: '#f4f8ff', seed: 125 }, 260],
    ice:     ['ice', { c1: '#5a7898', c2: '#c8dcf0', seed: 127 }, 240],
    straw:   ['thatch', { c1: '#5a4a26', c2: '#b09a58', seed: 129 }, 160],
    indigo:  ['fabric', { c1: '#121a32', c2: '#22305a', threads: 50, seed: 131 }, 70],
    futon:   ['fabric', { c1: '#5a1a22', c2: '#8a2c34', threads: 44, seed: 133 }, 70],
    linen:   ['fabric', { c1: '#c8c2b4', c2: '#f0ece2', threads: 48, seed: 135 }, 60],
    stoneW:  ['stone', { c1: '#3a3a40', c2: '#6a6a72', mortar: '#1e1e24', rows: 4, cols: 3, seed: 137, irregular: 1 }, 300],
    grain:   ['noise', { c1: '#000000', c2: '#ffffff', scale: 32, oct: 2, seed: 77, contrast: 1.2 }, 96],
    mottle:  ['noise', { c1: '#000000', c2: '#ffffff', scale: 3, oct: 4, seed: 79, contrast: 1.4 }, 420]
  };
  // 方形釉面砖（浴室）——自带生成器（名字带前缀，避免与其他文件冲突）
  if (K.GEN && !K.GEN.dm2Tile) K.GEN.dm2Tile = function (N, o) {
    var c = K.canvas(N, N), x = c.getContext('2d'), cols = o.cols || 4, rows = o.rows || 4;
    var gw = Math.max(1, N * (o.grout || 0.02)), tw = N / cols, th = N / rows, r = K.rng(o.seed || 1);
    x.fillStyle = o.gc || '#6a665e'; x.fillRect(0, 0, N, N);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var base = K.mix(o.c1, o.c2, r()), tx = i * tw, ty = j * th;
      var gr = x.createLinearGradient(tx, ty, tx + tw, ty + th);
      gr.addColorStop(0, K.shade(base, 0.14)); gr.addColorStop(0.5, base); gr.addColorStop(1, K.shade(base, -0.14));
      x.fillStyle = gr; x.fillRect(tx + gw / 2, ty + gw / 2, tw - gw, th - gw);
      x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(tx + gw / 2, ty + gw / 2, tw - gw, Math.max(1, N / 160));
    }
    return c;
  };
  var TILE_B = ['dm2Tile', { c1: '#7a9aa0', c2: '#9ab8bc', gc: '#4a5a5c', rows: 6, cols: 6, seed: 141 }, 140];
  var TILE_F = ['dm2Tile', { c1: '#5a6a6c', c2: '#7a8a8a', gc: '#2a3234', rows: 4, cols: 4, seed: 143 }, 120];

  /* ================================================================
   * 和室构件：柱、横木、土壁、障子、襖、榻榻米、床之间、窗
   * ================================================================ */
  function post(g, q, x, y, w, h, o) {
    o = o || {};
    var col = o.col || '#3a2414', t = o.t === undefined ? TX.sugi : o.t;
    g.beginPath(); g.rect(x, y, w, h); texFill(g, q, col, t);
    g.fillStyle = K.lin(g, x, 0, x + w, 0, [[0, KX < 0 ? hi(0.16) : lo(0.3)], [0.14, hi(0.05)], [0.5, lo(0.02)], [0.86, lo(0.14)], [1, KX < 0 ? lo(0.4) : hi(0.14)]]);
    g.fillRect(x, y, w, h);
    if (q.light >= 1 && o.ao !== false) {
      g.fillStyle = K.lin(g, 0, y + h - 40, 0, y + h, [lo(0), lo(0.35)]); g.fillRect(x, y + h - 40, w, 40);
      var sx = KX < 0 ? x + w : x - 16;
      g.fillStyle = K.lin(g, KX < 0 ? x + w : x, 0, KX < 0 ? x + w + 16 : x - 16, 0, [lo(0.32), lo(0)]); g.fillRect(sx, y, 16, h);
    }
  }
  function beam(g, q, x, y, w, h, o) {
    o = o || {};
    var col = o.col || '#3a2414', t = o.t === undefined ? TX.sugiH : o.t;
    g.beginPath(); g.rect(x, y, w, h); texFill(g, q, col, t);
    g.fillStyle = K.lin(g, 0, y, 0, y + h, [hi(0.14), lo(0.05), lo(0.38)]); g.fillRect(x, y, w, h);
    rect(g, x, y + h - 1, w, 2, lo(0.5));
    if (q.light >= 1 && o.shadow !== false) { g.fillStyle = K.lin(g, 0, y + h, 0, y + h + (o.sh || 16), [lo(0.35), lo(0)]); g.fillRect(x, y + h, w, o.sh || 16); }
  }
  function earthWall(g, q, x, y, w, h, o) {
    o = o || {};
    g.beginPath(); g.rect(x, y, w, h); texFill(g, q, o.col || '#9a8460', o.t || TX.tsuchi);
    if (q.tex >= 2 && o.age) { g.save(); g.globalCompositeOperation = 'overlay'; g.beginPath(); g.rect(x, y, w, h); texFill(g, q, '#808080', TX.mottle, 0, 0, 1, 1, o.age); g.restore(); }
    g.fillStyle = K.lin(g, 0, y, 0, y + h, [[0, lo(0.3)], [0.4, lo(0.04)], [1, lo(0.12)]]); g.fillRect(x, y, w, h);
  }
  // 障子（纸 + 组子 + 腰板）。lit>0：外面是亮的（雪光），光照之后用 shojiGlow 补亮纸面
  function shoji(g, q, x, y, w, h, o) {
    o = o || {};
    var fc = o.frame || '#6a4a2a', cols = o.cols || 3, rows = o.rows || 6, koshi = o.koshi === undefined ? h * 0.16 : o.koshi;
    var fw = o.fw || Math.max(7, w * 0.04), ph = h - koshi;
    g.beginPath(); g.rect(x, y, w, ph); texFill(g, q, o.paper || '#e6e0d0', TX.paper);
    if (o.torn && q.model >= 1) { var rt = K.rng(o.torn); for (var t = 0; t < 3; t++) { var tx = x + rt() * w, ty = y + rt() * ph; fillP(g, [tx, ty, tx + 14, ty + 4, tx + 6, ty + 16], 'rgba(30,20,10,0.5)'); } }
    g.fillStyle = K.lin(g, 0, y, 0, y + ph, [hi(0.08), lo(0.06)]); g.fillRect(x, y, w, ph);
    var kw = Math.max(2.4, w * 0.012);
    for (var i = 1; i < cols; i++) rect(g, x + w * i / cols - kw / 2, y, kw, ph, fc);
    for (var j = 1; j < rows; j++) rect(g, x, y + ph * j / rows - kw / 2, w, kw, fc);
    if (q.light >= 2) { // 组子在纸上的淡影
      g.save(); g.globalAlpha = 0.12; for (var j2 = 1; j2 < rows; j2++) rect(g, x, y + ph * j2 / rows + kw, w, kw * 1.5, '#000'); g.restore();
    }
    // 框
    g.fillStyle = fc; g.fillRect(x, y, w, fw); g.fillRect(x, y, fw, h); g.fillRect(x + w - fw, y, fw, h); g.fillRect(x, y + ph - fw * 0.5, w, fw);
    rect(g, x, y, w, 1.5, hi(0.2)); rect(g, x + (KX < 0 ? 0 : w - 1.5), y, 1.5, h, hi(0.18));
    if (koshi > 0) {
      g.beginPath(); g.rect(x + fw, y + ph + fw * 0.5, w - fw * 2, koshi - fw); texFill(g, q, K.shade(fc, 0.05), TX.hinokiH);
      g.fillStyle = K.lin(g, 0, y + ph, 0, y + h, [lo(0.1), lo(0.3)]); g.fillRect(x + fw, y + ph, w - fw * 2, koshi);
      rect(g, x, y + h - fw, w, fw, fc);
    }
    if (o.handle !== false) { var hx = o.handleLeft ? x + fw * 2.2 : x + w - fw * 3.2; ell(g, hx + fw / 2, y + ph * 0.55, fw * 0.45, fw * 1.1, lo(0.45)); }
    return { x: x, y: y, w: w, h: ph, cols: cols, rows: rows, kw: kw };
  }
  function shojiGlow(g, q, S, c, a) {
    if (!S || q.light < 1) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    var cw = S.w / S.cols, rh = S.h / S.rows;
    for (var i = 0; i < S.cols; i++) for (var j = 0; j < S.rows; j++) {
      rect(g, S.x + i * cw + S.kw, S.y + j * rh + S.kw, cw - S.kw * 2, rh - S.kw * 2, K.rgba(c, a * (0.75 + 0.25 * (1 - j / S.rows))));
    }
    g.restore();
  }
  // 襖（纸面 + 画 + 漆框 + 引手）
  function fusuma(g, q, x, y, w, h, o) {
    o = o || {};
    var base = o.col || '#d4c8a4', fc = o.frame || '#1a1410';
    g.beginPath(); g.rect(x, y, w, h); texFill(g, q, base, ['paper', { c1: K.shade(base, -0.12), c2: K.shade(base, 0.08), seed: 119 }, 160]);
    if (q.model >= 1 && o.art) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); o.art(g, q, x, y, w, h); g.restore(); }
    g.fillStyle = K.lin(g, 0, y, 0, y + h, [hi(0.05), lo(0.12)]); g.fillRect(x, y, w, h);
    var fw = Math.max(5, w * 0.022);
    g.fillStyle = fc; g.fillRect(x, y, w, fw); g.fillRect(x, y + h - fw, w, fw); g.fillRect(x, y, fw, h); g.fillRect(x + w - fw, y, fw, h);
    rect(g, x, y, w, 1.2, hi(0.25));
    var hx = o.handleLeft ? x + w * 0.12 : x + w * 0.88, hy = y + h * 0.52, hr = Math.max(7, w * 0.035);
    g.fillStyle = metalGrad(g, hx - hr, 0, hx + hr, 0, o.metal || '#6a5a3a'); circle(g, hx, hy, hr, g.fillStyle); circle(g, hx, hy, hr * 0.68, lo(0.55));
  }
  // 水墨远山（襖、挂轴）
  function inkMountains(g, q, x, y, w, h, seed) {
    var rnd = K.rng(seed || 5), layers = M(q, 2, 3, 4);
    for (var l = 0; l < layers; l++) {
      var by = y + h * (0.45 + l * 0.12), a = 0.12 + l * 0.08;
      g.beginPath(); g.moveTo(x, by + h * 0.3);
      for (var i = 0; i <= 12; i++) { var px = x + w * i / 12; g.lineTo(px, by - h * (0.06 + rnd() * 0.18) * (1 - l * 0.15)); }
      g.lineTo(x + w, by + h * 0.3); g.closePath();
      g.fillStyle = K.lin(g, 0, by - h * 0.2, 0, by + h * 0.2, ['rgba(30,30,34,' + a + ')', 'rgba(30,30,34,0)']); g.fill();
    }
    if (q.model >= 2) { // 松枝
      g.strokeStyle = 'rgba(30,26,22,0.45)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + w * 0.1, y + h); g.quadraticCurveTo(x + w * 0.2, y + h * 0.5, x + w * 0.4, y + h * 0.42); g.stroke();
      for (var k = 0; k < 4; k++) { var nx = x + w * (0.22 + k * 0.05), ny = y + h * (0.5 - k * 0.02); K.ellipse(g, nx, ny, w * 0.06, h * 0.02); g.fillStyle = 'rgba(40,50,40,0.35)'; g.fill(); }
    }
  }
  // 榻榻米地面（真实透视：横置/纵置交错；纵置的用仿射映射让纹路朝消失点汇聚）
  function tatamiFloor(g, q, R, o) {
    o = o || {};
    var u = o.u || 300, zF = 1 / R.dB, dz = u / R.f, t = o.t || TX.tatami, col = o.col || '#a49660', heri = o.heri || '#1c1814';
    K.poly(g, [0, R.base, W, R.base, W, H, 0, H]); g.fillStyle = K.shade(col, -0.3); g.fill();
    var pat = null, N = 0;
    if (q.tex > 0) { N = K.tileSize(q, t[2]); pat = g.createPattern(K.tex(t[0], t[1], N), 'repeat'); }
    var rnd = K.rng(o.seed || 3), z = 1, row = 0, x0 = o.x0 || 0;
    var hw = u * 0.035;
    while (z > zF - 0.001 && row < 12) {
      var across = row % 2 === 0, depth = across ? dz : dz * 2, zb = z - depth;
      var dA = 1 / z, dBn = zb > 0.06 ? 1 / zb : R.dB * 4, wX = across ? 2 * u : u;
      var off = x0 + (across ? (row % 4 === 0 ? 0 : -u) : (row % 4 === 1 ? 0 : -u * 0.5));
      for (var X = -wX * 4 + off; X < W + wX * 4; X += wX) {
        var qd = floorQuad(R, X, X + wX, dA, dBn);
        if (Math.max(qd[0], qd[2], qd[4], qd[6]) < -10 || Math.min(qd[0], qd[2], qd[4], qd[6]) > W + 10) continue;
        var tone = rnd.range(-1, 1);
        K.poly(g, qd); g.fillStyle = K.shade(col, tone * 0.06); g.fill();
        if (pat) {
          g.save(); K.poly(g, qd); g.clip(); g.globalAlpha = 0.9;
          if (across) {
            var yA = qd[1], yB = qd[7], dm = (dA + dBn) / 2;
            g.translate(R.px(X, dm), yA); g.scale(wX * dm / N, (yB - yA) / (N * 0.7));
          } else {
            var dxD = qd[6] - qd[0], dyD = qd[7] - qd[1], wf = qd[4] - qd[6];
            g.transform(dxD / N, dyD / N, wf / (N * 0.7), 0, qd[0], qd[1]);
          }
          g.fillStyle = pat; g.fillRect(-N, -N, N * 3, N * 3); g.restore();
        }
        fillP(g, qd, tone > 0 ? hi(tone * 0.05) : lo(-tone * 0.1));
        // 缘（heri）：长边
        if (across) {
          var dA2 = 1 / (z - hw / R.f), dB2 = 1 / (zb + hw / R.f);
          fillP(g, floorQuad(R, X, X + wX, dA, dA2), heri); fillP(g, floorQuad(R, X, X + wX, dB2, dBn), heri);
          if (q.model >= 1) fillP(g, floorQuad(R, X, X + wX, dA2, 1 / (1 / dA2 - 0.002)), hi(0.06));
        } else {
          fillP(g, floorQuad(R, X, X + hw, dA, dBn), heri); fillP(g, floorQuad(R, X + wX - hw, X + wX, dA, dBn), heri);
        }
        K.poly(g, qd); g.lineWidth = 1.2; g.strokeStyle = lo(0.45); g.stroke();
      }
      z = zb; row++;
    }
    K.poly(g, [0, R.base, W, R.base, W, H, 0, H]);
    g.fillStyle = K.lin(g, 0, R.base, 0, H, [[0, lo(0.4)], [0.3, lo(0.1)], [1, lo(0)]]); g.fill();
  }
  // 地面上的矩形（地面坐标 + 真实透视的深度插值）
  function FQ(R, X0, X1, d0, d1) {
    function D(t) { var z0 = 1 / d0, z1 = 1 / d1; return 1 / (z0 + (z1 - z0) * t); }
    return { D: D, q: function (u0, u1, t0, t1) { return floorQuad(R, X0 + (X1 - X0) * u0, X0 + (X1 - X0) * u1, D(t0), D(t1)); }, p: function (u, t) { return R.fp(X0 + (X1 - X0) * u, D(t)); } };
  }
  // 屏幕 x 与地面深度 d → 后墙坐标 X
  function Xat(R, x, d) { return R.vx + (x - R.vx) / d; }

  /* ================================================================
   * 窗外：雪景
   * ================================================================ */
  function snowView(g, q, x, y, w, h, o) {
    o = o || {};
    var rnd = K.rng(o.seed || 7), hz = y + h * (o.horizon === undefined ? 0.5 : o.horizon);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = K.lin(g, 0, y, 0, hz + h * 0.1, ['#8a96aa', '#b4bccb', '#d4d8e0']); g.fillRect(x, y, w, h);
    for (var c = 0; c < M(q, 2, 4, 7); c++) K.blob(g, x + rnd() * w, y + rnd() * h * 0.3, w * (0.2 + rnd() * 0.3), rnd() < 0.5 ? '#7a8498' : '#dfe2ea', 0.35);
    if (o.view === 'down') { o.downFn(g, q, x, y, w, h); g.restore(); return; }
    // 远山（雪覆，偏蓝）
    g.beginPath(); g.moveTo(x, hz);
    for (var i = 0; i <= 10; i++) g.lineTo(x + w * i / 10, hz - h * (0.12 + 0.12 * Math.sin(i * 1.3 + (o.seed || 7)) + rnd() * 0.05));
    g.lineTo(x + w, hz + 2); g.lineTo(x, hz + 2); g.closePath();
    g.fillStyle = K.lin(g, 0, hz - h * 0.3, 0, hz, ['#c8d0dc', '#9aa6ba']); g.fill();
    // 杉林（雪压枝）
    var nt = M(q, 5, 9, 14);
    for (var t = 0; t < nt; t++) {
      var tx = x + (t + rnd() * 0.6) * w / nt, th = h * (0.18 + rnd() * 0.16), tb = hz + h * 0.06 + rnd() * h * 0.05, tw = th * 0.32;
      var tc = K.mix('#26323a', '#7a8a9a', 0.35 + rnd() * 0.2);
      g.beginPath(); g.moveTo(tx, tb - th); g.lineTo(tx + tw, tb); g.lineTo(tx - tw, tb); g.closePath(); g.fillStyle = tc; g.fill();
      if (q.model >= 1) for (var s = 0; s < 3; s++) { var sy = tb - th * (0.72 - s * 0.26), sw = tw * (0.4 + s * 0.28); K.ellipse(g, tx, sy, sw, th * 0.05); g.fillStyle = '#eef2f8'; g.fill(); }
    }
    // 近处雪地 / 屋顶
    g.fillStyle = K.lin(g, 0, hz + h * 0.08, 0, y + h, ['#dfe4ee', '#f2f5fa']); g.fillRect(x, hz + h * 0.08, w, y + h - hz);
    if (o.roof) {
      var ry = y + h * 0.72;
      fillP(g, [x - 10, y + h + 10, x - 10, ry + 26, x + w * 0.6, ry, x + w + 10, ry + 10, x + w + 10, y + h + 10], '#3a3430');
      g.beginPath(); g.moveTo(x - 10, ry + 18); g.quadraticCurveTo(x + w * 0.3, ry - 22, x + w * 0.6, ry - 10); g.quadraticCurveTo(x + w * 0.8, ry - 6, x + w + 10, ry + 2); g.lineTo(x + w + 10, ry + 16); g.lineTo(x - 10, ry + 30); g.closePath();
      g.fillStyle = '#f0f4fa'; g.fill();
      for (var ic = 0; ic < M(q, 4, 8, 14); ic++) { var ix = x + rnd() * w, il = 8 + rnd() * 26, iy = ry + 26 - (ix - x) / w * 16; fillP(g, [ix - 2, iy, ix + 2, iy, ix, iy + il], 'rgba(220,235,250,0.9)'); }
    }
    if (o.fence) { for (var f = 0; f < 8; f++) rect(g, x + f * w / 8, y + h * 0.66, 5, h * 0.2, '#3a3028'); }
    g.restore();
  }
  // 和式玻璃窗（两扇推拉 + 横格）+ 结霜 + 外侧窗台积雪
  function jWindow(g, q, R, x, y, w, h, o) {
    o = o || {};
    var fc = o.frame || '#3a2818', fw = o.fw || 14;
    g.beginPath(); g.rect(x - fw, y - fw, w + fw * 2, h + fw * 2); texFill(g, q, fc, TX.sugiH);
    bevel(g, x - fw, y - fw, w + fw * 2, h + fw * 2, fw * 0.4, 0.15, 0.45);
    var kd = o.depth || 0.97, a = R.p(x, y, kd), b = R.p(x + w, y + h, kd);
    rect(g, x, y, w, h, '#2a2420');
    if (x + w / 2 < R.vx) fillP(g, [x, y, a[0], a[1], a[0], b[1], x, y + h], '#5a4a3a'); else fillP(g, [x + w, y, x + w, y + h, b[0], b[1], b[0], a[1]], '#5a4a3a');
    fillP(g, [x, y, x + w, y, b[0], a[1], a[0], a[1]], '#2a2018');
    var gx = a[0], gy = a[1], gw = b[0] - a[0], gh = b[1] - a[1];
    if (o.view) o.view(g, q, gx, gy, gw, gh); else snowView(g, q, gx, gy, gw, gh, { seed: o.seed, horizon: o.horizon, roof: o.roof });
    // 外窗台积雪
    if (o.sillSnow !== false) {
      g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip();
      g.beginPath(); g.moveTo(gx, gy + gh); g.lineTo(gx, gy + gh - 18); g.quadraticCurveTo(gx + gw * 0.3, gy + gh - 32, gx + gw * 0.55, gy + gh - 26); g.quadraticCurveTo(gx + gw * 0.8, gy + gh - 20, gx + gw, gy + gh - 30); g.lineTo(gx + gw, gy + gh); g.closePath();
      g.fillStyle = K.lin(g, 0, gy + gh - 34, 0, gy + gh, ['#f4f7fc', '#c8d2e2']); g.fill();
      g.restore();
    }
    // 玻璃：反光 + 结霜
    g.fillStyle = K.lin(g, gx, gy, gx + gw, gy + gh, ['rgba(220,230,245,0.12)', 'rgba(150,170,190,0.03)', 'rgba(220,230,245,0.1)']); g.fillRect(gx, gy, gw, gh);
    if (q.model >= 1 && o.frost !== false) {
      g.fillStyle = K.rad(g, gx, gy + gh, 4, gw * 0.35, ['rgba(240,246,255,0.5)', 'rgba(240,246,255,0)']); g.fillRect(gx, gy, gw, gh);
      g.fillStyle = K.rad(g, gx + gw, gy + gh, 4, gw * 0.3, ['rgba(240,246,255,0.45)', 'rgba(240,246,255,0)']); g.fillRect(gx, gy, gw, gh);
    }
    // 窗框（两扇 + 横格）
    var mc = o.muntin || '#2e2014', panes = o.rows || 3;
    rect(g, gx + gw / 2 - 5, gy, 10, gh, mc); rect(g, gx + gw / 2 - 5, gy, 2, gh, hi(0.15));
    for (var r = 1; r < panes; r++) { var ry = gy + gh * r / panes; rect(g, gx, ry - 2.5, gw, 5, mc); rect(g, gx, ry - 2.5, gw, 1.2, hi(0.2)); }
    g.strokeStyle = mc; g.lineWidth = 10; g.strokeRect(gx, gy, gw, gh);
    if (o.lock) { rect(g, gx + gw / 2 - 12, gy + gh * 0.5 - 6, 24, 12, '#8a8a92'); }
    if (q.light >= 1) { g.fillStyle = K.lin(g, 0, gy, 0, gy + 26, [lo(0.35), lo(0)]); g.fillRect(gx, gy, gw, 26); }
    // 内窗台
    if (o.sill !== false) box(g, q, R, x - fw - 8, y + h + fw, w + fw * 2 + 16, 12, 0.97, { col: K.shade(fc, 0.1), t: TX.sugiH });
    return { gx: gx, gy: gy, gw: gw, gh: gh };
  }
  // 雪光在玻璃上的补亮（光照之后）
  function windowGlow(g, q, Wn, a) {
    if (!Wn || q.light < 1) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = K.lin(g, 0, Wn.gy, 0, Wn.gy + Wn.gh, ['rgba(200,214,236,' + a + ')', 'rgba(200,214,236,' + (a * 0.5) + ')']); g.fillRect(Wn.gx, Wn.gy, Wn.gw, Wn.gh);
    g.restore();
  }

  /* ================================================================
   * 灯与取暖
   * ================================================================ */
  // 日式吊灯（木框纸罩或圆形荧光灯罩）
  function paperPendant(g, q, x, y, w, o) {
    o = o || {};
    seg(g, x, 0, x, y - 6, 2, '#1a1a1e');
    var h = w * 0.62;
    g.fillStyle = K.lin(g, x - w / 2, 0, x + w / 2, 0, ['#d8c8a0', '#f6ecd0', '#d0c098']);
    g.beginPath(); g.moveTo(x - w * 0.42, y); g.lineTo(x + w * 0.42, y); g.lineTo(x + w / 2, y + h); g.lineTo(x - w / 2, y + h); g.closePath(); g.fill();
    var fc = o.frame || '#3a2414';
    seg(g, x - w * 0.42, y, x + w * 0.42, y, 4, fc); seg(g, x - w / 2, y + h, x + w / 2, y + h, 5, fc);
    if (q.model >= 1) for (var i = 1; i < 4; i++) { var u = i / 4; seg(g, x - w * 0.42 + w * 0.84 * u, y, x - w / 2 + w * u, y + h, 2, K.rgba(fc, 0.8)); }
    return { x: x, y: y, w: w, h: h };
  }
  function pendantGlow(g, q, P, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.beginPath(); g.moveTo(P.x - P.w * 0.42, P.y); g.lineTo(P.x + P.w * 0.42, P.y); g.lineTo(P.x + P.w / 2, P.y + P.h); g.lineTo(P.x - P.w / 2, P.y + P.h); g.closePath();
    g.fillStyle = K.lin(g, 0, P.y, 0, P.y + P.h, ['rgba(255,210,140,' + (a * 0.6) + ')', 'rgba(255,225,170,' + a + ')']); g.fill();
    g.restore();
    if (q.light >= 1) K.glow(g, P.x, P.y + P.h * 0.6, P.w * 1.8, '#ffc878', 0.32);
  }
  // 裸灯泡
  function bareBulb(g, q, x, y, o) {
    o = o || {};
    seg(g, x, 0, x, y - 14, 2, '#141416');
    g.fillStyle = metalGrad(g, x - 7, 0, x + 7, 0, '#3a3a3e'); K.rr(g, x - 7, y - 18, 14, 12, 2); g.fill();
    g.fillStyle = K.rad(g, x - 3, y + 2, 1, 12, ['#fff8e0', '#ffd890', '#c88a40']); K.ellipse(g, x, y + 4, 10, 13); g.fill();
  }
  function bulbGlow(g, q, x, y, r, a) {
    if (q.light >= 1) K.glow(g, x, y + 4, r, '#ffb860', a);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = K.rad(g, x, y + 4, 1, 22, ['rgba(255,250,225,0.95)', 'rgba(255,200,120,0)']); g.fillRect(x - 22, y - 18, 44, 44); g.restore();
  }
  // 行灯（纸灯，落地）
  function andon(g, q, x, by, h, o) {
    o = o || {};
    var w = h * 0.42, fc = o.frame || '#2a1a10';
    if (q.light >= 1) K.contact(g, x, by, w * 0.8, 8, 0.6);
    for (var l = -1; l <= 1; l += 2) rect(g, x + l * w * 0.5 - 4, by - h, 8, h, fc);
    g.fillStyle = K.lin(g, 0, by - h * 0.9, 0, by - h * 0.2, ['#f0e2c0', '#e0caa0']); g.fillRect(x - w * 0.45, by - h * 0.88, w * 0.9, h * 0.62);
    rect(g, x - w * 0.5, by - h * 0.9, w, 6, fc); rect(g, x - w * 0.5, by - h * 0.26, w, 6, fc); rect(g, x - w * 0.5, by - 10, w, 8, fc);
    if (q.model >= 1) seg(g, x, by - h * 0.88, x, by - h * 0.27, 2, K.rgba(fc, 0.7));
    return { x: x - w * 0.45, y: by - h * 0.88, w: w * 0.9, h: h * 0.62 };
  }
  function andonGlow(g, q, A, a) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = K.lin(g, 0, A.y, 0, A.y + A.h, ['rgba(255,200,120,' + (a * 0.7) + ')', 'rgba(255,214,150,' + a + ')']); g.fillRect(A.x, A.y, A.w, A.h);
    g.restore();
    if (q.light >= 1) K.glow(g, A.x + A.w / 2, A.y + A.h / 2, A.w * 2.4, '#ffbe70', 0.3);
  }
  // 提灯（挂着的圆灯笼），可写字
  function chochin(g, q, x, y, r, o) {
    o = o || {};
    seg(g, x, y - r * 1.5, x, y - r * 1.05, 2, '#1a1410');
    rect(g, x - r * 0.5, y - r * 1.1, r, r * 0.16, '#1a1410'); rect(g, x - r * 0.5, y + r * 0.95, r, r * 0.16, '#1a1410');
    K.ellipse(g, x, y, r * 0.78, r); g.fillStyle = K.rad(g, x - r * 0.2, y - r * 0.1, 2, r, [o.col1 || '#fff0d0', o.col2 || '#e8c890', o.col3 || '#b88a50']); g.fill();
    if (q.model >= 1) for (var i = -3; i <= 3; i++) { var yy = y + i * r * 0.26; K.ellipse(g, x, yy, r * 0.78 * Math.sqrt(1 - (i * 0.26) * (i * 0.26)), r * 0.04); g.strokeStyle = 'rgba(120,80,40,0.3)'; g.lineWidth = 1; g.stroke(); }
    if (o.text) K.text(g, o.text, x, y, r * 0.42, o.ink || '#2a1a10', { weight: 'bold' });
    return { x: x, y: y, r: r };
  }
  function chochinGlow(g, q, C, a) {
    g.save(); g.globalCompositeOperation = 'lighter'; K.ellipse(g, C.x, C.y, C.r * 0.78, C.r); g.fillStyle = K.rad(g, C.x, C.y, 2, C.r, ['rgba(255,220,150,' + a + ')', 'rgba(255,180,90,' + (a * 0.3) + ')']); g.fill(); g.restore();
    if (q.light >= 1) K.glow(g, C.x, C.y, C.r * 3.4, '#ffb868', 0.3);
  }
  // 石油暖炉（圆筒对流式）+ 顶上的水壶
  function oilHeater(g, q, x, by, h, o) {
    o = o || {};
    var w = h * 0.62, body = o.col || '#c8c0b0';
    if (q.light >= 1) K.contact(g, x, by, w * 0.75, 9, 0.6);
    rect(g, x - w * 0.42, by - 14, w * 0.84, 14, '#2a2a2e');
    g.fillStyle = cylGrad(g, x - w / 2, w, body); g.fillRect(x - w / 2, by - h * 0.55, w, h * 0.45);
    // 燃烧窗
    g.fillStyle = cylGrad(g, x - w / 2, w, '#3a3a40'); g.fillRect(x - w / 2, by - h * 0.92, w, h * 0.38);
    for (var i = 1; i < 6; i++) rect(g, x - w / 2 + w * i / 6 - 1.5, by - h * 0.92, 3, h * 0.38, 'rgba(20,20,24,0.7)');
    g.fillStyle = cylGrad(g, x - w / 2 - 3, w + 6, '#8a8a92'); g.fillRect(x - w / 2 - 3, by - h * 0.96, w + 6, 8);
    ell(g, x, by - h * 0.97, w / 2 + 3, 6, '#5a5a62');
    // 水壶
    var kx = x, ky = by - h * 0.98;
    g.fillStyle = metalGrad(g, kx - w * 0.3, 0, kx + w * 0.3, 0, o.kettle || '#b8b8c0');
    g.beginPath(); g.moveTo(kx - w * 0.3, ky); g.quadraticCurveTo(kx - w * 0.32, ky - h * 0.22, kx, ky - h * 0.24); g.quadraticCurveTo(kx + w * 0.32, ky - h * 0.22, kx + w * 0.3, ky); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(kx + w * 0.26, ky - h * 0.1); g.quadraticCurveTo(kx + w * 0.46, ky - h * 0.14, kx + w * 0.5, ky - h * 0.24); stroke(g, 5, '#9a9aa2');
    g.beginPath(); g.arc(kx, ky - h * 0.24, w * 0.22, PI, 0); stroke(g, 3, '#2a2a2e');
    return { win: [x - w / 2, by - h * 0.92, w, h * 0.38], spout: [kx + w * 0.5, ky - h * 0.25] };
  }
  function heaterGlow(g, q, Hh) {
    var r = Hh.win;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = K.lin(g, 0, r[1], 0, r[1] + r[3], ['rgba(255,120,40,0.2)', 'rgba(255,170,70,0.65)', 'rgba(120,150,255,0.4)']); g.fillRect(r[0] + 3, r[1] + 3, r[2] - 6, r[3] - 6);
    g.restore();
    if (q.light >= 1) K.glow(g, r[0] + r[2] / 2, r[1] + r[3] / 2, r[2] * 2, '#ff9a40', 0.3);
  }
  // 蒸汽（热气，加色白雾）
  function steam(g, q, x, y, h, a, seed) {
    if (q.light < 1) return;
    var rnd = K.rng(seed || 3), n = M(q, 3, 5, 9);
    g.save(); g.globalCompositeOperation = 'screen';
    for (var i = 0; i < n; i++) { var t = i / n; K.blob(g, x + Math.sin(t * 6 + rnd()) * h * 0.12, y - t * h, h * (0.08 + t * 0.12), '#e8eef6', a * (1 - t * 0.7)); }
    g.restore();
  }
  // 低桌（座卓）
  function lowTable(g, q, R, x, y, w, by, o) {
    o = o || {};
    var col = o.col || '#4a2a14', t = o.t || TX.keyakiH, k = o.k || 0.8, th = 22;
    if (q.light >= 1) K.contact(g, x + w / 2, by, w * 0.56, 12, 0.6);
    var bl = R.p(x + 16, by, k), br = R.p(x + w - 34, by, k);
    rect(g, bl[0], y + th, 18, bl[1] - y - th, K.shade(col, -0.4)); rect(g, br[0], y + th, 18, br[1] - y - th, K.shade(col, -0.4));
    rect(g, x + 14, y + th, 20, by - y - th, K.shade(col, -0.15)); rect(g, x + w - 34, y + th, 20, by - y - th, K.shade(col, -0.15));
    var b = box(g, q, R, x, y, w, th, k, { col: col, t: t, topHi: 0.25 });
    if (q.light >= 2) { g.save(); g.globalCompositeOperation = 'lighter'; if (b.top) { K.poly(g, b.top); g.fillStyle = K.lin(g, x, 0, x + w, 0, ['rgba(255,240,220,0)', 'rgba(255,240,220,0.08)', 'rgba(255,240,220,0)']); g.fill(); } g.restore(); }
    return b;
  }
  // 茶具（茶壶 + 茶杯 + 茶托）
  function teaSet(g, q, cx, cy, s) {
    s = s || 1;
    ell(g, cx, cy, 60 * s, 12 * s, 'rgba(0,0,0,0.25)');
    var px = cx - 18 * s;
    g.fillStyle = K.rad(g, px - 8 * s, cy - 26 * s, 2, 30 * s, ['#8a7a5a', '#4a3a22', '#2a2014']); K.ellipse(g, px, cy - 16 * s, 26 * s, 18 * s); g.fill();
    ell(g, px, cy - 32 * s, 12 * s, 4 * s, '#3a2c1a'); seg(g, px + 22 * s, cy - 18 * s, px + 36 * s, cy - 26 * s, 4 * s, '#4a3a22');
    g.beginPath(); g.arc(px, cy - 30 * s, 16 * s, PI * 1.1, PI * 1.9); stroke(g, 2 * s, '#2a1a10');
    for (var i = 0; i < 2; i++) { var ux = cx + (26 + i * 28) * s, uy = cy - i * 4 * s; g.fillStyle = cylGrad(g, ux - 9 * s, 18 * s, '#e8e2d4'); g.fillRect(ux - 9 * s, uy - 18 * s, 18 * s, 16 * s); ell(g, ux, uy - 18 * s, 9 * s, 3 * s, '#5a7a3a'); ell(g, ux, uy - 1 * s, 13 * s, 3.5 * s, '#4a3020'); }
  }
  // 坐垫
  function zabuton(g, q, R, X, d, sz, o) {
    o = o || {};
    var c = o.col || '#5a2a3a', f = FQ(R, X - sz / 2, X + sz / 2, d, 1 / (1 / d - sz / R.f));
    var qd = f.q(0, 1, 0, 1);
    if (q.light >= 1) softPoly(g, qd, 0.3, 2, 0.04, (qd[0] + qd[4]) / 2, (qd[1] + qd[5]) / 2);
    K.poly(g, qd); texFill(g, q, c, ['fabric', { c1: K.shade(c, -0.3), c2: c, threads: 40, seed: 139 }, 60]);
    K.poly(g, qd); g.fillStyle = K.lin(g, 0, qd[1], 0, qd[5], [lo(0.1), hi(0.1)]); g.fill();
    fillP(g, [qd[6], qd[7], qd[4], qd[5], qd[4], qd[5] + 8, qd[6], qd[7] + 8], K.shade(c, -0.35));
    if (q.model >= 1) { var cp = f.p(0.5, 0.5); circle(g, cp[0], cp[1], 3, K.shade(c, -0.5)); }
  }
  // 七轮（陶制小炭炉）
  function shichirin(g, q, cx, by, h, o) {
    o = o || {};
    var w = h * 0.95;
    if (q.light >= 1) K.contact(g, cx, by, w * 0.6, 5, 0.5);
    g.fillStyle = cylGrad(g, cx - w / 2, w, o.col || '#c8a878');
    g.beginPath(); g.moveTo(cx - w * 0.5, by - h); g.lineTo(cx + w * 0.5, by - h); g.lineTo(cx + w * 0.42, by); g.lineTo(cx - w * 0.42, by); g.closePath(); g.fill();
    ell(g, cx, by - h, w * 0.5, w * 0.12, '#a88a60'); ell(g, cx, by - h, w * 0.38, w * 0.08, '#2a2018');
    rect(g, cx - w * 0.16, by - h * 0.42, w * 0.32, h * 0.26, '#2a1a10'); rect(g, cx - w * 0.16, by - h * 0.42, w * 0.32, 2, hi(0.2));
    seg(g, cx - w * 0.5, by - h * 0.82, cx + w * 0.5, by - h * 0.82, 2.5, 'rgba(60,40,24,0.5)');
    if (q.model >= 1) K.text(g, '白峰屋', cx, by - h * 0.62, h * 0.14, 'rgba(60,30,14,0.55)', { weight: 'bold' });
  }
  // 壁橱（押入）：两扇襖 + 上方天袋
  function oshiire(g, q, x, y, w, by, o) {
    o = o || {};
    var tb = (by - y) * 0.2;
    fusuma(g, q, x, y, w / 2, tb, { col: o.col || '#cfc4a2', handleLeft: false });
    fusuma(g, q, x + w / 2, y, w / 2, tb, { col: o.col || '#cfc4a2', handleLeft: true });
    beam(g, q, x - 6, y + tb, w + 12, 14, {});
    fusuma(g, q, x, y + tb + 14, w / 2, by - y - tb - 14, { col: o.col || '#cfc4a2', art: o.art, handleLeft: false });
    fusuma(g, q, x + w / 2, y + tb + 14, w / 2, by - y - tb - 14, { col: o.col || '#cfc4a2', art: o.art, handleLeft: true });
  }

  /* ================================================================
   * 白峰屋·玄关 inn_entrance
   * ================================================================ */
  // 暖帘（三片，可写字）
  function noren(g, q, x, y, w, h, o) {
    o = o || {};
    var n = o.n || 3, col = o.col || '#1e2848', gap = 6, pw = (w - gap * (n - 1)) / n;
    seg(g, x - 16, y, x + w + 16, y, 7, '#2a1a10'); seg(g, x - 16, y - 2, x + w + 16, y - 2, 2, hi(0.25));
    for (var i = 0; i < n; i++) {
      var px = x + i * (pw + gap), sway = (i - 1) * 3;
      g.beginPath(); g.moveTo(px, y + 4); g.lineTo(px + pw, y + 4); g.lineTo(px + pw + sway, y + h); g.lineTo(px + sway, y + h); g.closePath();
      texFill(g, q, col, TX.indigo);
      g.beginPath(); g.moveTo(px, y + 4); g.lineTo(px + pw, y + 4); g.lineTo(px + pw + sway, y + h); g.lineTo(px + sway, y + h); g.closePath();
      g.fillStyle = K.lin(g, px, 0, px + pw, 0, [lo(0.3), hi(0.06), lo(0.05), lo(0.35)]); g.fill();
      if (q.model >= 1) for (var f = 1; f < 3; f++) seg(g, px + pw * f / 3, y + 10, px + pw * f / 3 + sway, y + h - 4, 2, lo(0.2));
      if (o.text) K.text(g, o.text.charAt(i), px + pw / 2 + sway * 0.6, y + h * 0.6, pw * 0.5, 'rgba(236,232,220,0.92)', { weight: 'bold' });
      if (o.crest && i === 1) { // 白蛾纹
        var cx = px + pw / 2, cy = y + h * 0.26, r = pw * 0.18;
        g.fillStyle = 'rgba(236,232,220,0.9)';
        for (var s2 = -1; s2 <= 1; s2 += 2) { K.ellipse(g, cx + s2 * r * 0.6, cy - r * 0.2, r * 0.6, r * 0.4, s2 * 0.5); g.fill(); K.ellipse(g, cx + s2 * r * 0.45, cy + r * 0.35, r * 0.38, r * 0.28, -s2 * 0.4); g.fill(); }
        rect(g, cx - 1.5, cy - r * 0.5, 3, r, 'rgba(236,232,220,0.9)');
      }
    }
  }
  // 挂衣架（落地，挂着大衣与围巾）
  function coatRack(g, q, x, y, w, by) {
    var cx = x + w / 2;
    if (q.light >= 1) K.contact(g, cx, by, w * 0.5, 8, 0.6);
    for (var f = -1; f <= 1; f++) seg(g, cx, by - 30, cx + f * w * 0.42, by, 6, '#2a1a10');
    g.fillStyle = cylGrad(g, cx - 7, 14, '#4a2c18'); g.fillRect(cx - 7, y + 10, 14, by - y - 30);
    circle(g, cx, y + 6, 10, '#5a3a20');
    for (var h2 = 0; h2 < 4; h2++) { var a = -0.6 + h2 * 0.4, hx = cx + Math.cos(a + (h2 % 2 ? PI : 0)) * 34; seg(g, cx, y + 30, hx, y + 22, 5, '#4a2c18'); }
    // 深灰长大衣 + 灰围巾
    var c1 = cx - 46;
    g.beginPath(); g.moveTo(c1 + 10, y + 30); g.quadraticCurveTo(c1 - 30, y + 70, c1 - 26, y + 300); g.lineTo(c1 + 56, y + 310); g.quadraticCurveTo(c1 + 50, y + 100, c1 + 28, y + 30); g.closePath();
    g.fillStyle = K.lin(g, c1 - 30, 0, c1 + 56, 0, ['#2a2c32', '#4a4c54', '#24262c']); g.fill();
    if (q.model >= 1) { seg(g, c1 + 14, y + 60, c1 + 6, y + 300, 1.5, lo(0.4)); for (var b = 0; b < 3; b++) circle(g, c1 + 20, y + 120 + b * 50, 3, '#141418'); }
    g.beginPath(); g.moveTo(c1 + 4, y + 34); g.lineTo(c1 + 30, y + 34); g.lineTo(c1 + 28, y + 190); g.lineTo(c1 + 14, y + 196); g.closePath(); g.fillStyle = '#6a6a72'; g.fill();
    if (q.model >= 1) for (var fr = 0; fr < 4; fr++) seg(g, c1 + 15 + fr * 4, y + 196, c1 + 14 + fr * 4, y + 206, 1.5, '#5a5a62');
    // 藏青大衣
    var c2 = cx + 26;
    g.beginPath(); g.moveTo(c2, y + 26); g.quadraticCurveTo(c2 + 50, y + 60, c2 + 52, y + 260); g.lineTo(c2 - 18, y + 270); g.quadraticCurveTo(c2 - 14, y + 90, c2, y + 26); g.closePath();
    g.fillStyle = K.lin(g, c2 - 18, 0, c2 + 52, 0, ['#1a2440', '#2e3c66', '#141c34']); g.fill();
    // 红围巾
    g.beginPath(); g.moveTo(c2 - 6, y + 30); g.quadraticCurveTo(c2 + 26, y + 40, c2 + 22, y + 150); g.lineTo(c2 + 6, y + 150); g.quadraticCurveTo(c2 + 8, y + 60, c2 - 8, y + 40); g.closePath();
    g.fillStyle = K.lin(g, c2, 0, c2 + 26, 0, ['#8a1a20', '#c03030', '#7a1418']); g.fill();
    // 毛线帽
    g.beginPath(); g.arc(cx + 2, y + 2, 22, PI, 0); g.closePath(); g.fillStyle = '#6a4a2a'; g.fill(); circle(g, cx + 2, y - 22, 6, '#8a6a4a');
  }
  function umbrellaStand(g, q, x, y, w, by) {
    var cx = x + w / 2;
    if (q.light >= 1) K.contact(g, cx, by, w * 0.55, 6, 0.6);
    // 伞
    var um = [[cx - 14, '#2a2a30', -0.1], [cx + 4, '#a01a22', 0.05], [cx + 16, '#c8a060', 0.14]];
    for (var i = 0; i < um.length; i++) {
      g.save(); g.translate(um[i][0], by - 60); g.rotate(um[i][2]);
      g.fillStyle = K.lin(g, -8, 0, 8, 0, [K.shade(um[i][1], -0.3), um[i][1], K.shade(um[i][1], -0.4)]);
      g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0); g.lineTo(3, -120); g.lineTo(-3, -120); g.closePath(); g.fill();
      seg(g, 0, -120, 0, -140, 3, '#3a2a1a'); g.beginPath(); g.arc(-6, -140, 6, 0, PI, true); stroke(g, 3, '#3a2a1a');
      g.restore();
    }
    g.fillStyle = cylGrad(g, cx - w * 0.36, w * 0.72, '#3a5a6a'); g.fillRect(cx - w * 0.36, by - 80, w * 0.72, 80);
    ell(g, cx, by - 80, w * 0.36, 7, '#2a4250');
    if (q.model >= 1) { seg(g, cx - w * 0.36, by - 50, cx + w * 0.36, by - 50, 2, 'rgba(200,220,230,0.4)'); }
  }
  function drawEntrance(g, q) {
    setKey(0);
    var R = Room(960, 540, 760, 0, 1500);
    var kam = 160;
    earthWall(g, q, 0, 0, W, R.base, { col: '#9a8662', t: TX.tsuchi, age: 0.3 });
    beam(g, q, 0, 92, W, 30, { col: '#2e1c10', t: TX.sugiH });     // 长押
    beam(g, q, 0, kam - 22, W, 22, { col: '#3a2414' });            // 鸭居
    // 门洞（通往内廊）
    var dx0 = 784, dx1 = 1136, kd = 0.5;
    rect(g, dx0, kam, dx1 - dx0, R.base - kam, '#2a1a10');
    var c0 = R.p(dx0, kam, kd), c1 = R.p(dx1, R.base, kd);
    g.save(); g.beginPath(); g.rect(dx0, kam, dx1 - dx0, R.base - kam); g.clip();
    fillP(g, [dx0, kam, c0[0], c0[1], c0[0], c1[1], dx0, R.base], '#6a5038');
    fillP(g, [dx1, kam, c1[0], c0[1], c1[0], c1[1], dx1, R.base], '#5a4230');
    // 内廊两侧的障子（暖光）
    var nS = 4;
    for (var sI = 0; sI < nS; sI++) {
      var ka = 1 - (1 - kd) * sI / nS, kb = 1 - (1 - kd) * (sI + 0.9) / nS;
      var la = R.p(dx0, kam + 20, ka), lb = R.p(dx0, kam + 20, kb), lc = R.p(dx0, R.base - 40, kb), ld = R.p(dx0, R.base - 40, ka);
      fillP(g, [la[0], la[1], lb[0], lb[1], lc[0], lc[1], ld[0], ld[1]], '#e8d6b0');
      var ra = R.p(dx1, kam + 20, ka), rb = R.p(dx1, kam + 20, kb), rc = R.p(dx1, R.base - 40, kb), rd = R.p(dx1, R.base - 40, ka);
      fillP(g, [ra[0], ra[1], rb[0], rb[1], rc[0], rc[1], rd[0], rd[1]], '#dccaa4');
      for (var gl = 1; gl < 4; gl++) { var yy = kam + 20 + (R.base - 60 - kam) * gl / 4; var p1 = R.p(dx0, yy, ka), p2 = R.p(dx0, yy, kb); seg(g, p1[0], p1[1], p2[0], p2[1], 1.5, '#6a4a2a'); var p3 = R.p(dx1, yy, ka), p4 = R.p(dx1, yy, kb); seg(g, p3[0], p3[1], p4[0], p4[1], 1.5, '#6a4a2a'); }
    }
    // 内廊尽头 + 地板
    rect(g, c0[0], c0[1], c1[0] - c0[0], c1[1] - c0[1], '#3a2818');
    fillP(g, [dx0, R.base, dx1, R.base, c1[0], c1[1], c0[0], c1[1]], '#5a3a20');
    for (var fb = 1; fb < 6; fb++) { var fx = dx0 + (dx1 - dx0) * fb / 6; seg(g, fx, R.base, R.px(fx, kd), c1[1], 1.5, 'rgba(20,10,4,0.6)'); }
    var cp = paperPendant(g, q, (c0[0] + c1[0]) / 2, R.py(kam + 30, 0.7), 60);
    g.restore();
    // 门柱
    post(g, q, dx0 - 30, kam - 22, 30, R.base - kam + 22, {}); post(g, q, dx1, kam - 22, 30, R.base - kam + 22, {});
    post(g, q, 20, 0, 34, R.base, {}); post(g, q, 1880, 0, 34, R.base, {}); post(g, q, 400, 0, 30, R.base, {}); post(g, q, 1500, 0, 30, R.base, {});
    // 挂钟
    if (q.model >= 1) {
      var ckx = 600, cky = 210;
      g.beginPath(); g.rect(ckx - 44, cky - 70, 88, 220); texFill(g, q, '#3a2010', TX.keyaki); bevel(g, ckx - 44, cky - 70, 88, 220, 5, 0.2, 0.45);
      circle(g, ckx, cky - 14, 34, '#e8dcc0'); g.beginPath(); g.arc(ckx, cky - 14, 34, 0, TAU); stroke(g, 3, '#8a6a32');
      for (var h2 = 0; h2 < 12; h2++) { var a2 = h2 / 12 * TAU; seg(g, ckx + Math.cos(a2) * 27, cky - 14 + Math.sin(a2) * 27, ckx + Math.cos(a2) * 31, cky - 14 + Math.sin(a2) * 31, 1.5, '#2a2016'); }
      seg(g, ckx, cky - 14, ckx + 14, cky - 26, 2.5, '#1a1008'); seg(g, ckx, cky - 14, ckx - 4, cky - 40, 2, '#1a1008');
      rect(g, ckx - 26, cky + 30, 52, 100, '#140c06'); seg(g, ckx, cky + 30, ckx, cky + 104, 2, '#b08a48'); circle(g, ckx, cky + 108, 11, '#c9a25a');
      // 扁额
      g.beginPath(); g.rect(1180, 30, 300, 56); texFill(g, q, '#4a2c16', TX.keyakiH); bevel(g, 1180, 30, 300, 56, 4, 0.2, 0.45);
      K.text(g, '雪見', 1330, 59, 34, '#e8dcc0', { weight: 'bold' });
    }
    // 暖帘
    noren(g, q, dx0 + 8, kam + 2, dx1 - dx0 - 16, 250, { text: '白峰屋', crest: true });
    // 抬高的木地板（上框之后）
    var stepY = 850;
    g.save(); g.beginPath(); g.rect(0, R.base, W, stepY - R.base); g.clip();
    plankFloor(g, q, R, { pw: 76, seed: 201, far: '#2a1a0e', near: '#5a3c22', t: TX.floorW });
    g.restore();
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 30, 24, 0.4, 't');
    floorSheen(g, q, R, 960, 260, '#ffd8a0', 0.12, stepY);
    floorSheen(g, q, R, 960, 120, '#c8d4f0', 0.08, stepY);
    // 上框（框木）+ 立面
    g.beginPath(); g.rect(0, stepY, W, 24); texFill(g, q, '#4a2a14', TX.keyakiH);
    g.fillStyle = K.lin(g, 0, stepY, 0, stepY + 24, [hi(0.35), hi(0.05), lo(0.3)]); g.fillRect(0, stepY, W, 24);
    g.beginPath(); g.rect(0, stepY + 24, W, 96); texFill(g, q, '#3a2414', TX.sugiH);
    g.fillStyle = K.lin(g, 0, stepY + 24, 0, stepY + 120, [lo(0.2), lo(0.55)]); g.fillRect(0, stepY + 24, W, 96);
    // 土间
    g.beginPath(); g.rect(0, stepY + 118, W, H - stepY - 118); texFill(g, q, '#4a4440', TX.tataki);
    g.fillStyle = K.lin(g, 0, stepY + 118, 0, H, [lo(0.5), lo(0.1)]); g.fillRect(0, stepY + 118, W, H - stepY - 118);
    // 踏脚石
    K.ellipse(g, 960, 1010, 210, 40); g.fillStyle = K.lin(g, 0, 970, 0, 1050, ['#7a7672', '#4a4644']); g.fill();
    K.ellipse(g, 960, 1004, 200, 32); texFill(g, q, '#6a6662', TX.stoneF, 0, 0, 1, 1, 0.5);
    // 拖鞋（摆在上框边）
    if (q.model >= 1) {
      var sl = [880, 960, 1040];
      for (var s = 0; s < sl.length; s++) for (var lr = -1; lr <= 1; lr += 2) {
        var sx = sl[s] + lr * 14, sy = 832;
        K.ellipse(g, sx, sy, 12, 6); g.fillStyle = s === 1 ? '#6a2a34' : '#3a4a5a'; g.fill(); ell(g, sx, sy - 2, 10, 3, K.shade(s === 1 ? '#6a2a34' : '#3a4a5a', 0.2));
      }
    }
    // 帐场（柜台 + 帐场格子 + 登记簿）
    var cx0 = 372, cw = 408, cty = 690, cby = 826;
    if (q.light >= 1) K.contact(g, cx0 + cw / 2, cby, cw * 0.55, 10, 0.6);
    // 帐场格子
    var lg = R.p(cx0 + 30, cty - 110, 0.97), lgw = cw - 60;
    g.beginPath(); g.rect(lg[0], lg[1], lgw, 104); texFill(g, q, '#3a2210', TX.keyaki);
    for (var gi = 1; gi < 14; gi++) rect(g, lg[0] + lgw * gi / 14 - 2, lg[1] + 10, 4, 84, '#1e1008');
    rect(g, lg[0], lg[1] + 10, lgw, 4, '#1e1008'); rect(g, lg[0], lg[1] + 90, lgw, 4, '#1e1008');
    var cb = box(g, q, R, cx0, cty, cw, cby - cty, 0.86, { col: '#4a2a14', t: TX.keyaki, topHi: 0.25 });
    if (q.model >= 1) { groove(g, cx0 + 20, cty + 24, cw / 2 - 30, cby - cty - 40, 3, 0.4); groove(g, cx0 + cw / 2 + 10, cty + 24, cw / 2 - 30, cby - cty - 40, 3, 0.4); }
    // 登记簿（摊开）+ 笔 + 呼铃
    var rb = R.p(552, cty, 0.93);
    fillP(g, [rb[0] - 100, cty - 2, rb[0] + 100, cty - 2, rb[0] + 94, rb[1] - 4, rb[0] - 94, rb[1] - 4], '#efe6d0');
    seg(g, rb[0], cty - 2, rb[0], rb[1] - 4, 1.5, 'rgba(100,80,60,0.6)');
    if (q.model >= 1) for (var li = 0; li < 4; li++) { var ly = lerp(rb[1] - 2, cty - 4, li / 4 + 0.1); seg(g, rb[0] - 86, ly, rb[0] - 14, ly, 0.8, 'rgba(40,40,60,0.45)'); seg(g, rb[0] + 14, ly, rb[0] + 86, ly, 0.8, 'rgba(40,40,60,0.45)'); }
    seg(g, rb[0] + 60, cty - 6, rb[0] + 104, cty - 14, 3, '#1a1a1e');
    if (q.model >= 1) { g.fillStyle = metalGrad(g, cx0 + 330, 0, cx0 + 360, 0, '#c8c8d0'); K.ellipse(g, cx0 + 345, cty - 10, 15, 10); g.fill(); circle(g, cx0 + 345, cty - 20, 3, '#2a2a30'); }
    void cb;
    // 鞋柜（下駄箱）
    var sbx = 84, sbw = 264, sby = 418, sbb = 802;
    if (q.light >= 1) K.contact(g, sbx + sbw / 2, sbb, sbw * 0.6, 10, 0.6);
    box(g, q, R, sbx, sby, sbw, sbb - sby, 0.9, { col: '#5a3a20', t: TX.hinoki });
    var rows = 5, colsN = 3;
    for (var r = 0; r < rows; r++) for (var c = 0; c < colsN; c++) {
      var bx = sbx + 12 + c * (sbw - 24) / colsN, by2 = sby + 14 + r * (sbb - sby - 40) / rows, bw = (sbw - 24) / colsN - 8, bh = (sbb - sby - 40) / rows - 8;
      groove(g, bx, by2, bw, bh, 2.5, 0.4);
      if (q.model >= 1) { rect(g, bx + bw / 2 - 10, by2 + 8, 20, 12, '#e8dcc0'); K.text(g, String(r * 3 + c + 1), bx + bw / 2, by2 + 14, 9, '#3a2a1a', { font: 'Georgia,serif' }); circle(g, bx + bw / 2, by2 + bh - 12, 3, '#8a6a30'); }
    }
    if (q.model >= 1) { // 柜上的花
      g.fillStyle = cylGrad(g, 200, 32, '#4a5a6a'); g.fillRect(200, sby - 50, 32, 50);
      g.beginPath(); g.moveTo(216, sby - 50); g.quadraticCurveTo(190, sby - 110, 170, sby - 130); stroke(g, 3, '#3a2a1a');
      for (var fl = 0; fl < 4; fl++) circle(g, 176 + fl * 12, sby - 120 + (fl % 2) * 18, 8, '#c02030');
    }
    // 伞架、衣架
    umbrellaStand(g, q, 1384, 672, 96, 832);
    coatRack(g, q, 1552, 296, 176, 818);
    // 吊灯
    var pd = paperPendant(g, q, 600, 30, 110);
    var ch1 = chochin(g, q, 720, 240, 34, { text: '白' }), ch2 = chochin(g, q, 1200, 240, 34, { text: '峰' });
    // ---- 光照 ----
    var Lm = [
      { lin: [0, 0, 0, H], stops: [[0, 'rgba(60,50,40,0.1)'], [0.8, 'rgba(60,60,70,0.1)'], [1, 'rgba(110,120,150,0.35)']] },
      { x: 600, y: 240, r: 760, ry: 600, c: '#ffcf96', i: 0.55, fall: 0.3 },
      { x: 960, y: 520, r: 300, ry: 420, c: '#ffc480', i: 0.5 },
      { x: 960, y: 820, r: 520, ry: 120, c: '#ffd0a0', i: 0.3, q: 1 },
      { x: 960, y: 1080, r: 1100, ry: 260, c: '#a8b8d8', i: 0.45 },
      { x: 720, y: 240, r: 200, c: '#ffb868', i: 0.35, q: 1 }, { x: 1200, y: 240, r: 200, c: '#ffb868', i: 0.35, q: 1 },
      { x: 1640, y: 560, r: 340, ry: 420, c: '#d8c8b0', i: 0.2, q: 2 }
    ];
    lightMap(g, q, '#45404c', Lm);
    pendantGlow(g, q, pd, 0.6); pendantGlow(g, q, cp, 0.4);
    chochinGlow(g, q, ch1, 0.5); chochinGlow(g, q, ch2, 0.5);
    if (q.light >= 2) K.motes(g, K.rng(211), 40, 300, 200, 1300, 600, '#ffe0b0', 0.25);
    finish(g, q, { vig: 0.5 });
  }
  DM.HDBG.def('inn_entrance', {
    draw: function (g, q) { drawEntrance(g, q); },
    lights: [LT(600, 80, 240, '#ffcf96', 0.6, 0.03, 'lamp'), LT(960, 520, 160, '#ffc480', 0.4, 0.03, 'glow'), LT(720, 240, 90, '#ffb868', 0.5, 0.12, 'lamp'), LT(1200, 240, 90, '#ffb868', 0.5, 0.12, 'lamp')],
    key: { x: 0, color: '#ffd8b0', amb: '#3a3646', rim: 0.45 },
    outdoor: false
  });

  /* ================================================================
   * 白峰屋·围炉里之间 inn_hearth
   * ================================================================ */
  // 显像管电视（放在矮柜上）
  function crtTV(g, q, R, x, y, w, by) {
    var th = (by - y) * 0.76, sy = y + th;
    if (q.light >= 1) K.contact(g, x + w / 2, by, w * 0.6, 8, 0.6);
    box(g, q, R, x - 16, sy, w + 32, by - sy, R.kWall(by) * 0.99, { col: '#3a2414', t: TX.keyakiH });
    if (q.model >= 1) { rect(g, x + 6, sy + 12, w - 12, by - sy - 22, '#141012'); rect(g, x + 14, sy + 20, w * 0.5, 14, '#2a2a2e'); circle(g, x + w - 24, sy + 27, 3, '#40ff60'); }
    box(g, q, R, x, y, w, th, 0.93, { col: '#4a4a52', frontLo: 0.3 });
    var sx = x + 14, sw = w - 72, sh = th - 30, syy = y + 14;
    g.fillStyle = '#0c0e10'; K.rr(g, sx - 4, syy - 4, sw + 8, sh + 8, 14); g.fill();
    g.fillStyle = K.rad(g, sx + sw * 0.4, syy + sh * 0.4, 4, sw * 0.8, ['#3a4a58', '#1a222a', '#0a0e12']); K.rr(g, sx, syy, sw, sh, 18); g.fill();
    if (q.model >= 1) { // 天气预报画面
      g.save(); K.rr(g, sx, syy, sw, sh, 18); g.clip();
      rect(g, sx, syy, sw, sh, 'rgba(60,110,160,0.35)'); fillP(g, [sx + sw * 0.3, syy + sh * 0.2, sx + sw * 0.55, syy + sh * 0.3, sx + sw * 0.5, syy + sh * 0.8, sx + sw * 0.35, syy + sh * 0.7], 'rgba(160,190,140,0.45)');
      for (var sn = 0; sn < 4; sn++) K.text(g, '❄', sx + sw * (0.35 + sn * 0.05), syy + sh * (0.35 + sn * 0.1), 12, 'rgba(240,250,255,0.7)');
      for (var sl = 0; sl < sh; sl += 4) rect(g, sx, syy + sl, sw, 1, 'rgba(0,0,0,0.18)');
      g.restore();
    }
    g.fillStyle = 'rgba(220,235,255,0.08)'; K.rr(g, sx, syy, sw * 0.6, sh * 0.4, 18); g.fill();
    for (var k = 0; k < 4; k++) circle(g, x + w - 30, y + 30 + k * 22, 6, '#2a2a30');
    for (var vk = 0; vk < 6; vk++) rect(g, x + w - 46, y + th - 40 + (vk % 3) * 6, 32, 2, '#2a2a30');
    return { scr: [sx, syy, sw, sh] };
  }
  // 粉红公用电话
  function pinkPhone(g, q, x, by) {
    g.fillStyle = K.lin(g, x - 30, 0, x + 30, 0, ['#d87a8a', '#f4a8b4', '#c86878']); K.rr(g, x - 30, by - 56, 60, 56, 8); g.fill();
    rect(g, x - 20, by - 44, 40, 8, '#3a2a2e');
    g.fillStyle = K.lin(g, 0, by - 74, 0, by - 58, ['#f4b0bc', '#c87080']); K.rr(g, x - 34, by - 74, 68, 16, 7); g.fill();
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) circle(g, x - 10 + i * 10, by - 26 + j * 8, 2.5, '#fff0f2');
  }
  // 自在钩 + 铁壶
  function jizai(g, q, x, top, hookY, kettleY) {
    g.fillStyle = cylGrad(g, x - 10, 20, '#5a4a2a'); g.fillRect(x - 10, top, 20, hookY - top - 70);
    if (q.model >= 1) for (var n = 1; n < 5; n++) rect(g, x - 11, top + (hookY - top - 70) * n / 5, 22, 4, 'rgba(30,20,10,0.5)');
    // 横木（鱼形）
    var fy = hookY - 76;
    g.fillStyle = K.lin(g, 0, fy - 18, 0, fy + 18, ['#5a3a1e', '#2a1a0c']);
    g.beginPath(); g.moveTo(x - 64, fy); g.quadraticCurveTo(x - 30, fy - 22, x + 30, fy - 12); g.lineTo(x + 56, fy - 26); g.lineTo(x + 52, fy); g.lineTo(x + 56, fy + 24); g.lineTo(x + 30, fy + 12); g.quadraticCurveTo(x - 30, fy + 22, x - 64, fy); g.closePath(); g.fill();
    if (q.model >= 1) { circle(g, x - 44, fy - 4, 4, '#140c06'); for (var sc = 0; sc < 5; sc++) { g.beginPath(); g.arc(x - 20 + sc * 12, fy, 9, -0.9, 0.9); stroke(g, 1.2, 'rgba(0,0,0,0.3)'); } }
    g.fillStyle = metalGrad(g, x - 4, 0, x + 4, 0, '#3a3a3e'); g.fillRect(x - 3, fy + 10, 6, kettleY - fy - 30);
    g.beginPath(); g.arc(x, kettleY - 20, 10, -PI / 2, PI * 0.8); stroke(g, 5, '#2a2a2e');
  }
  function tetsubin(g, q, x, y, r) {
    g.fillStyle = K.rad(g, x - r * 0.35, y - r * 0.3, 2, r * 1.2, ['#5a5a5e', '#26262a', '#0e0e10']);
    K.ellipse(g, x, y, r, r * 0.82); g.fill();
    if (q.model >= 1) { g.fillStyle = 'rgba(80,80,86,0.6)'; for (var i = 0; i < 24; i++) { var a = (i / 24) * PI * 1.2 + PI * 0.9, rr = r * (0.55 + (i % 3) * 0.12); circle(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8, 2.4, g.fillStyle); } }
    ell(g, x, y - r * 0.72, r * 0.42, r * 0.12, '#1a1a1c'); circle(g, x, y - r * 0.8, r * 0.1, '#2a2a2e');
    g.beginPath(); g.moveTo(x + r * 0.8, y - r * 0.1); g.quadraticCurveTo(x + r * 1.3, y - r * 0.2, x + r * 1.4, y - r * 0.6); stroke(g, r * 0.16, '#1e1e22');
    g.beginPath(); g.arc(x, y - r * 0.8, r * 0.8, PI * 1.05, PI * 1.95); stroke(g, r * 0.1, '#1a1a1c');
    if (q.light >= 1) { g.beginPath(); g.arc(x, y, r * 0.9, PI * 1.15, PI * 1.45); stroke(g, 2, 'rgba(255,220,180,0.3)'); }
  }
  // 围炉里（地面坐标）：炉缘 + 灰 + 炭火
  function irori(g, q, R, X0, X1, d0, d1, o) {
    o = o || {};
    var F = FQ(R, X0, X1, d0, d1), out = F.q(0, 1, 0, 1), inn = F.q(0.08, 0.92, 0.12, 0.88);
    if (q.light >= 1) softPoly(g, out, 0.35, 3, 0.03, (out[0] + out[4]) / 2, (out[1] + out[5]) / 2);
    K.poly(g, out); texFill(g, q, '#3a2010', TX.keyakiH);
    K.poly(g, out); g.fillStyle = K.lin(g, 0, out[1], 0, out[5], [lo(0.2), hi(0.1)]); g.fill();
    K.poly(g, out); g.lineWidth = 2.5; g.strokeStyle = hi(0.25); g.stroke();
    // 炉内：下沉的灰
    var drop = 26 * (d0 + d1) / 2;
    fillP(g, inn, '#141010');
    var ash = [inn[0], inn[1] + drop * 0.3, inn[2], inn[3] + drop * 0.3, inn[4], inn[5], inn[6], inn[7]];
    K.poly(g, ash); g.fillStyle = K.lin(g, 0, ash[1], 0, ash[5], ['#5a5654', '#8a8682']); g.fill();
    if (q.tex >= 1) { K.poly(g, ash); texFill(g, q, '#7a7672', ['noise', { c1: '#5a5652', c2: '#9a9690', scale: 12, oct: 3, seed: 151, contrast: 1.1 }, 120], 0, 0, 1, 1, 0.6); }
    fillP(g, [inn[0], inn[1], inn[2], inn[3], ash[2], ash[3], ash[0], ash[1]], '#2a2420');
    if (q.model >= 1) for (var rk = 1; rk < 6; rk++) { var a = F.p(0.15, 0.2 + rk * 0.12), b = F.p(0.85, 0.2 + rk * 0.12); seg(g, a[0], a[1], b[0], b[1], 1.2, 'rgba(60,56,54,0.35)'); }
    // 炭
    var cc = F.p(0.5, 0.55), rnd = K.rng(o.seed || 153);
    for (var c = 0; c < M(q, 5, 9, 14); c++) {
      var px = cc[0] + (rnd() - 0.5) * 140, py = cc[1] + (rnd() - 0.5) * 34, cw = 22 + rnd() * 26;
      g.save(); g.translate(px, py); g.rotate((rnd() - 0.5) * 0.8); g.fillStyle = K.lin(g, 0, -8, 0, 8, ['#3a3430', '#141010']); K.rr(g, -cw / 2, -8, cw, 16, 6); g.fill(); g.restore();
    }
    // 五德（铁三脚）
    if (q.model >= 1) { for (var l = 0; l < 3; l++) { var a2 = l / 3 * TAU + 0.4; seg(g, cc[0] + Math.cos(a2) * 50, cc[1] + Math.sin(a2) * 14, cc[0] + Math.cos(a2) * 40, cc[1] - 30, 4, '#1a1a1e'); } K.ellipse(g, cc[0], cc[1] - 30, 42, 10); stroke(g, 4, '#1a1a1e'); }
    return { cc: cc };
  }
  function emberGlow(g, q, cc, w, seed) {
    var rnd = K.rng(seed || 155);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = K.rad(g, cc[0], cc[1], 2, w * 0.6, ['rgba(255,150,60,0.55)', 'rgba(255,90,30,0.2)', 'rgba(0,0,0,0)']); K.ellipse(g, cc[0], cc[1], w * 0.6, w * 0.18); g.fill();
    for (var i = 0; i < M(q, 8, 16, 28); i++) circle(g, cc[0] + (rnd() - 0.5) * w * 0.7, cc[1] + (rnd() - 0.5) * w * 0.16, 1.5 + rnd() * 3, 'rgba(255,' + (110 + (rnd() * 90 | 0)) + ',40,0.8)');
    g.restore();
    if (q.light >= 1) K.glow(g, cc[0], cc[1] - 20, w * 1.2, '#ff9040', 0.32);
  }
  // 一升瓶酒架
  function sakeShelf(g, q, R, x, y, w, by) {
    if (q.light >= 1) K.contact(g, x + w / 2, by, w * 0.6, 10, 0.6);
    box(g, q, R, x, y, w, by - y, 0.9, { col: '#3a2414', t: TX.sugi });
    var ix = x + 12, iw = w - 24, rows = 3, sh = (by - y - 30) / rows, rnd = K.rng(161);
    for (var r = 0; r < rows; r++) {
      var sy = y + 14 + r * sh, fl = sy + sh - 6;
      rect(g, ix, sy, iw, sh - 6, '#140c08');
      if (q.light >= 1) { g.fillStyle = K.lin(g, 0, sy, 0, sy + 20, [lo(0.5), lo(0)]); g.fillRect(ix, sy, iw, 20); }
      var bx = ix + 8;
      while (bx < ix + iw - 22) {
        var bw = r === 2 ? 30 : 24, bh = r === 2 ? sh * 0.5 : sh * 0.82, c = rnd.pick(['#1e3a24', '#3a2410', '#5a5a3a', '#2a3a4a']);
        if (r === 2) { g.fillStyle = cylGrad(g, bx, bw, '#c8b89a'); g.fillRect(bx, fl - bh, bw, bh); circle(g, bx + bw / 2, fl - bh * 0.5, bw * 0.3, '#2a3a5a'); bx += bw + 10; continue; }
        g.fillStyle = cylGrad(g, bx, bw, c); K.rr(g, bx, fl - bh * 0.72, bw, bh * 0.72, 6); g.fill(); rect(g, bx + bw * 0.3, fl - bh, bw * 0.4, bh * 0.3, c);
        rect(g, bx + 3, fl - bh * 0.6, bw - 6, bh * 0.3, '#e8dcc0'); if (q.model >= 1) seg(g, bx + bw / 2, fl - bh * 0.56, bx + bw / 2, fl - bh * 0.34, 2, 'rgba(30,20,10,0.6)');
        bx += bw + 6;
      }
      rect(g, ix, fl, iw, 6, '#4a2c18'); rect(g, ix, fl, iw, 1.5, hi(0.25));
    }
  }
  function drawHearth(g, q) {
    setKey(0.25);
    var R = Room(980, 520, 700, 0, 1100), xl = 340, xr = 1780;
    // 后墙
    earthWall(g, q, xl, 0, xr - xl, R.base, { col: '#7a6448', t: TX.tsuchiD, age: 0.5 });
    // 煤黑的横梁与椽（上方）
    beam(g, q, xl, 120, xr - xl, 40, { col: '#1a120c', t: TX.soot });
    // 后墙中部：通往里间的襖
    for (var fI = 0; fI < 4; fI++) fusuma(g, q, 690 + fI * 140, 260, 140, R.base - 262, { col: '#c8bc98', art: function (g2, q2, x, y, w, h) { inkMountains(g2, q2, x - fI * w, y, w * 4, h, 33); }, handleLeft: fI % 2 === 1 });
    beam(g, q, xl, 240, xr - xl, 22, { col: '#24160c' });
    post(g, q, 660, 120, 30, R.base - 120, { col: '#24160c', t: TX.soot }); post(g, q, 1250, 120, 30, R.base - 120, { col: '#24160c', t: TX.soot });
    // 神棚（高处）
    if (q.model >= 1) {
      box(g, q, R, 380, 186, 240, 14, 0.96, { col: '#c8b088', t: TX.hinokiH });
      fillP(g, [430, 186, 570, 186, 552, 150, 448, 150], '#d8c098'); fillP(g, [440, 150, 560, 150, 500, 126], '#5a4a3a');
      seg(g, 380, 168, 620, 168, 3, '#d8c8a0'); for (var sh2 = 0; sh2 < 5; sh2++) fillP(g, [400 + sh2 * 50, 168, 412 + sh2 * 50, 168, 406 + sh2 * 50, 186], '#f0eee8');
    }
    // 窗
    var Wn = jWindow(g, q, R, 1330, 166, 420, 268, { seed: 223, horizon: 0.52, roof: true, rows: 2 });
    // 电视 + 粉红电话
    var tv = crtTV(g, q, R, 392, 448, 224, R.base + 6);
    if (q.model >= 1) { box(g, q, R, 290, 600, 80, 100, 0.95, { col: '#4a2c18', t: TX.keyaki }); pinkPhone(g, q, 330, 600); }
    // 左侧墙（透视）+ 障子
    var dN = (R.vx - 0) / (R.vx - xl);
    function LP(Y, d) { return [R.vx + (xl - R.vx) * d, R.vy + (Y - R.vy) * d]; }
    var lA = LP(-400, 1), lB = LP(-400, dN), lC = LP(R.base, dN), lD = LP(R.base, 1);
    fillP(g, [lA[0], lA[1], lB[0], lB[1], lC[0], lC[1], lD[0], lD[1]], '#4a3a2a');
    var kamY = 262, s0 = 1.03, s1 = 1.43, nP = 3, Sg = [];
    for (var pI = 0; pI < nP; pI++) {
      var da = s0 + (s1 - s0) * pI / nP, db = s0 + (s1 - s0) * (pI + 1) / nP;
      var a = LP(kamY, da), b = LP(kamY, db), c = LP(R.base, db), d = LP(R.base, da), ks = LP(R.base - 110, da), ks2 = LP(R.base - 110, db);
      fillP(g, [a[0], a[1], b[0], b[1], ks2[0], ks2[1], ks[0], ks[1]], '#ece6d6');
      Sg.push([a[0], a[1], b[0], b[1], ks2[0], ks2[1], ks[0], ks[1]]);
      fillP(g, [ks[0], ks[1], ks2[0], ks2[1], c[0], c[1], d[0], d[1]], '#5a4028');
      for (var kc = 1; kc < 3; kc++) { var dd = da + (db - da) * kc / 3, t1 = LP(kamY, dd), t2 = LP(R.base - 110, dd); seg(g, t1[0], t1[1], t2[0], t2[1], 2.5, '#6a4a2a'); }
      for (var kr = 1; kr < 6; kr++) { var yy = kamY + (R.base - 110 - kamY) * kr / 6, u1 = LP(yy, da), u2 = LP(yy, db); seg(g, u1[0], u1[1], u2[0], u2[1], 2.5, '#6a4a2a'); }
      seg(g, a[0], a[1], d[0], d[1], 6 * da, '#4a3018');
    }
    var lk1 = LP(kamY, 1), lk2 = LP(kamY, dN); fillP(g, [lk1[0], lk1[1] - 22, lk2[0], lk2[1] - 22 * dN, lk2[0], lk2[1], lk1[0], lk1[1]], '#24160c');
    var lt1 = LP(120, 1), lt2 = LP(120, dN); fillP(g, [lt1[0], lt1[1], lt2[0], lt2[1], lt2[0], lt2[1] + 40 * dN, lt1[0], lt1[1] + 40], '#140c08');
    seg(g, xl, 0, xl, R.base, 4, lo(0.5));
    // 右侧墙（窄条）
    var rN = (W - R.vx) / (xr - R.vx);
    fillP(g, [xr, -100, W + 10, -100, W + 10, R.py(R.base, rN), xr, R.base], '#3a2c20');
    // 地板（板之间）
    plankFloor(g, q, R, { pw: 70, seed: 225, far: '#24160c', near: '#4a3220', t: TX.floorW });
    if (q.light >= 1) K.ao(g, xl, R.base - 2, xr - xl, 30, 24, 0.4, 't');
    floorSheen(g, q, R, 1540, 260, '#c8d4f0', 0.1);
    // 坐垫（围炉旁）
    var dI0 = 1.22, dI1 = 2.2, X0 = Xat(R, 672, dI1), X1 = Xat(R, 1248, dI1);
    if (q.model >= 1) { zabuton(g, q, R, X0 - 120, 1.3, 150, { col: '#5a3040' }); zabuton(g, q, R, X1 + 120, 1.3, 150, { col: '#3a4a5a' }); zabuton(g, q, R, (X0 + X1) / 2, 1.06, 150, { col: '#5a4a2a' }); }
    // 围炉里
    var IR = irori(g, q, R, X0, X1, dI0, dI1, {});
    // 酒架
    sakeShelf(g, q, R, 1620, 474, 236, 808);
    // 前景大梁 + 自在钩 + 铁壶
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 52); g.quadraticCurveTo(W / 2, 74, 0, 58); g.closePath(); texFill(g, q, '#140c08', TX.soot);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 52); g.quadraticCurveTo(W / 2, 74, 0, 58); g.closePath(); g.fillStyle = K.lin(g, 0, 0, 0, 70, [lo(0.3), hi(0.06), lo(0.5)]); g.fill();
    jizai(g, q, 960, 50, 590, 640);
    tetsubin(g, q, 960, 664, 44);
    // ---- 光照 ----
    var Lm = [
      { lin: [0, 0, W, 0], stops: [[0, 'rgba(110,120,150,0.3)'], [0.5, 'rgba(60,50,40,0.1)'], [1, 'rgba(100,110,140,0.25)']] },
      { x: IR.cc[0], y: IR.cc[1] - 80, r: 760, ry: 520, c: '#ff9a50', i: 0.75, fall: 0.3 },
      { x: IR.cc[0], y: IR.cc[1], r: 460, ry: 140, c: '#ffa060', i: 0.4, q: 1 },
      { x: 1540, y: 300, r: 480, ry: 420, c: '#b8c8e8', i: 0.55 },
      { x: 120, y: 480, r: 360, ry: 520, c: '#c8d4ec', i: 0.5 },
      { x: 504, y: 540, r: 200, ry: 160, c: '#80a0d0', i: 0.25, q: 1 },
      { x: 960, y: 640, r: 160, c: '#ffb070', i: 0.3, q: 1 }
    ];
    lightMap(g, q, '#3e3a46', Lm);
    for (var gI = 0; gI < Sg.length; gI++) { g.save(); g.globalCompositeOperation = 'lighter'; fillP(g, Sg[gI], 'rgba(200,214,240,0.22)'); g.restore(); }
    windowGlow(g, q, Wn, 0.12);
    emberGlow(g, q, IR.cc, 200, 157);
    steam(g, q, 1020, 620, 160, 0.25, 231);
    if (q.light >= 1) { g.save(); g.globalCompositeOperation = 'lighter'; rect(g, tv.scr[0], tv.scr[1], tv.scr[2], tv.scr[3], 'rgba(90,130,170,0.18)'); g.restore(); K.glow(g, tv.scr[0] + tv.scr[2] / 2, tv.scr[1] + tv.scr[3] / 2, 160, '#8ab0e0', 0.12); }
    if (q.light >= 2) { // 炉烟
      g.save(); g.globalCompositeOperation = 'screen'; for (var sI = 0; sI < 5; sI++) K.blob(g, 960 + Math.sin(sI) * 60, 600 - sI * 110, 120 + sI * 30, '#8a8090', 0.06); g.restore();
      K.motes(g, K.rng(233), 50, 700, 200, 520, 600, '#ffc890', 0.3);
    }
    finish(g, q, { vig: 0.55 });
  }
  DM.HDBG.def('inn_hearth', {
    draw: function (g, q) { drawHearth(g, q); },
    lights: [LT(960, 760, 260, '#ff9a48', 0.7, 0.45, 'fire'), LT(1540, 300, 220, '#b8c8e8', 0.45, 0, 'window'), LT(120, 480, 200, '#c8d4ec', 0.35, 0, 'window'), LT(504, 540, 80, '#8ab0e0', 0.3, 0.2, 'screen')],
    key: { x: 0.1, color: '#ffc08a', amb: '#343244', rim: 0.5 },
    outdoor: false
  });

  /* ================================================================
   * 白峰屋·客房 inn_room
   * ================================================================ */
  // 被褥（地面坐标）
  function futonBed(g, q, R, X0, X1, d0, d1, o) {
    o = o || {};
    var F = FQ(R, X0, X1, d0, d1), th = 22;
    var base = F.q(0, 1, 0, 1);
    if (q.light >= 1) softPoly(g, base, 0.35, 3, 0.02, (base[0] + base[4]) / 2, (base[1] + base[5]) / 2);
    // 褥（白）
    fillP(g, [base[6], base[7], base[4], base[5], base[4], base[5] + th, base[6], base[7] + th], '#b8b2a8');
    K.poly(g, base); texFill(g, q, '#e8e4dc', TX.linen);
    // 被（掛布団，花纹）
    var kb = F.q(0.18, 1.02, -0.02, 1.04), col = o.col || '#7a2a34';
    fillP(g, [kb[6], kb[7], kb[4], kb[5], kb[4], kb[5] + th + 10, kb[6], kb[7] + th + 10], K.shade(col, -0.35));
    K.poly(g, kb); texFill(g, q, col, TX.futon);
    K.poly(g, kb); g.fillStyle = K.lin(g, 0, kb[1], 0, kb[5], [lo(0.2), hi(0.12)]); g.fill();
    if (q.model >= 1) { // 花纹（白梅）
      var rnd = K.rng(241);
      for (var i = 0; i < M(q, 0, 10, 18); i++) { var p = F.p(0.25 + rnd() * 0.7, 0.1 + rnd() * 0.85); for (var pe = 0; pe < 5; pe++) { var a = pe / 5 * TAU; circle(g, p[0] + Math.cos(a) * 6, p[1] + Math.sin(a) * 2.6, 3.2, 'rgba(240,230,220,0.55)'); } }
      var f1 = F.p(0.2, 0), f2 = F.p(0.2, 1); seg(g, f1[0], f1[1], f2[0], f2[1], 3, 'rgba(240,236,228,0.7)');
    }
    // 枕
    var pp = F.p(0.09, 0.5);
    g.fillStyle = K.rad(g, pp[0] - 10, pp[1] - 14, 4, 70, ['#ffffff', '#e0dcd2', '#a8a49a']); K.rr(g, pp[0] - 60, pp[1] - 22, 120, 36, 16); g.fill();
  }
  function tokonoma(g, q, R, x, y, w, by, o) {
    o = o || {};
    var kd = 0.9, a = R.p(x, y, kd), b = R.p(x + w, by, kd);
    // 床之间内壁
    g.beginPath(); g.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); texFill(g, q, '#a08a64', TX.tsuchi);
    g.fillStyle = K.lin(g, 0, a[1], 0, b[1], [lo(0.35), lo(0.05)]); g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    fillP(g, [x, y, a[0], a[1], a[0], b[1], x, by], '#7a6648');
    fillP(g, [x, y, x + w, y, b[0], a[1], a[0], a[1]], '#3a2c1e');
    // 床板（略高）
    var fy = b[1] - 30;
    fillP(g, [x, by - 24, x + w, by - 24, b[0], fy, a[0], fy], '#3a2a18');
    K.poly(g, [x, by - 24, x + w, by - 24, b[0], fy, a[0], fy]); texFill(g, q, '#4a3420', TX.keyakiH, 0, 0, 1, 1, 0.8);
    g.beginPath(); g.rect(x, by - 24, w, 24); texFill(g, q, '#141010', null); g.fillStyle = K.lin(g, 0, by - 24, 0, by, [hi(0.3), lo(0.2)]); g.fillRect(x, by - 24, w, 24);
    // 挂轴
    var sx = (a[0] + b[0]) / 2, sw = (b[0] - a[0]) * 0.38, st = a[1] + 26, sb = fy - 90;
    seg(g, sx - sw * 0.3, a[1] + 4, sx, st - 14, 1.2, '#2a2014'); seg(g, sx + sw * 0.3, a[1] + 4, sx, st - 14, 1.2, '#2a2014');
    rect(g, sx - sw / 2 - 4, st - 6, sw + 8, 8, '#3a2a1a');
    rect(g, sx - sw / 2, st, sw, sb - st, '#6a5a3a');
    var px = sx - sw / 2 + 10, pw = sw - 20, py = st + 30, ph = sb - st - 70;
    rect(g, px, py, pw, ph, '#e8e0cc');
    if (o.paint) o.paint(g, q, px, py, pw, ph);
    g.fillStyle = metalGrad(g, sx - sw / 2 - 10, 0, sx + sw / 2 + 10, 0, '#3a2a1a'); g.fillRect(sx - sw / 2 - 10, sb, sw + 20, 10);
    // 花入（山茶）
    var vx = sx + sw * 0.9, vb = fy + 2;
    g.fillStyle = cylGrad(g, vx - 14, 28, '#4a4a3a'); g.beginPath(); g.moveTo(vx - 12, vb); g.lineTo(vx - 14, vb - 60); g.lineTo(vx + 14, vb - 60); g.lineTo(vx + 12, vb); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(vx, vb - 58); g.quadraticCurveTo(vx - 30, vb - 120, vx - 56, vb - 150); stroke(g, 3, '#2a2014');
    g.beginPath(); g.moveTo(vx - 20, vb - 104); g.quadraticCurveTo(vx + 10, vb - 140, vx + 20, vb - 160); stroke(g, 2.5, '#2a2014');
    for (var l = 0; l < 6; l++) { var lx = vx - 40 + l * 12, ly = vb - 130 + (l % 3) * 14; K.ellipse(g, lx, ly, 10, 5, l * 0.6); g.fillStyle = '#1e3a24'; g.fill(); }
    for (var fl = 0; fl < 2; fl++) { var fx = vx - 54 + fl * 70, fyy = vb - 150 - fl * 8; circle(g, fx, fyy, 11, '#b01828'); circle(g, fx, fyy, 4, '#f0d060'); }
    // 床柱（天然木）
    g.fillStyle = K.lin(g, x + w - 4, 0, x + w + 26, 0, ['#6a4a2a', '#a07a4a', '#5a3a1e']); g.fillRect(x + w - 4, y - 40, 30, by - y + 40);
    if (q.model >= 1) for (var kn = 0; kn < 5; kn++) ell(g, x + w + 10, y + 40 + kn * 90, 5, 9, 'rgba(60,40,20,0.5)');
    // 落挂
    beam(g, q, x, y - 20, w, 20, { col: '#2a1a10' });
  }
  function bostonBag(g, q, x, y, w, h) {
    if (q.light >= 1) K.contact(g, x + w / 2, y + h, w * 0.55, 10, 0.65);
    g.fillStyle = K.lin(g, 0, y, 0, y + h, ['#5a3a22', '#3a2412', '#24160a']);
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + 6, y + h * 0.3); g.quadraticCurveTo(x + w / 2, y + h * 0.05, x + w - 6, y + h * 0.3); g.lineTo(x + w, y + h); g.closePath(); g.fill();
    seg(g, x + 12, y + h * 0.32, x + w - 12, y + h * 0.32, 2, '#b08a48');
    g.beginPath(); g.moveTo(x + w * 0.3, y + h * 0.26); g.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.7, y + h * 0.26); stroke(g, 6, '#2a1a0c');
    if (q.light >= 1) { g.beginPath(); g.moveTo(x + 10, y + h * 0.4); g.quadraticCurveTo(x + w / 2, y + h * 0.18, x + w - 10, y + h * 0.4); stroke(g, 2, 'rgba(255,220,180,0.2)'); }
    rect(g, x + w * 0.12, y + h * 0.5, 22, 30, '#e8dcc0');
  }
  function drawRoom(g, q) {
    setKey(0.35);
    var R = Room(960, 520, 700, 20, 1400), kam = 152;
    // 天花（竿缘）
    rect(g, 0, 0, W, 20, '#5a4a36');
    for (var cb = -6; cb < 14; cb++) { var X = cb * 160, t = -20 / (20 - R.vy); seg(g, X, 20, X + (X - R.vx) * t, 0, 2, 'rgba(40,28,16,0.7)'); }
    earthWall(g, q, 0, 20, W, R.base - 20, { col: '#a48e68', t: TX.tsuchi, age: 0.2 });
    beam(g, q, 0, 20, W, 14, { col: '#3a2818', t: TX.hinokiH, sh: 10 });
    beam(g, q, 0, kam - 44, W, 26, { col: '#4a3420', t: TX.hinokiH });
    beam(g, q, 0, kam - 18, W, 18, { col: '#4a3420', t: TX.hinokiH });
    // 床之间
    tokonoma(g, q, R, 96, 236, 336, 690, { paint: function (g2, q2, x, y, w, h) { inkMountains(g2, q2, x, y, w, h, 61); K.text(g2, '雪', x + w * 0.78, y + h * 0.18, w * 0.18, 'rgba(30,24,20,0.8)', { weight: 'bold' }); } });
    // 中间：襖（隔壁）
    var fx0 = 480, fw2 = 168;
    for (var fI = 0; fI < 4; fI++) fusuma(g, q, fx0 + fI * fw2, kam, fw2, R.base - kam, { col: '#d0c4a0', art: function (g2, q2, x, y, w, h) { g2.fillStyle = 'rgba(160,130,60,0.25)'; for (var cl = 0; cl < 4; cl++) { K.ellipse(g2, x + w * ((cl * 0.37 + fI * 0.21) % 1), y + h * (0.2 + cl * 0.18), w * 0.5, h * 0.03); g2.fill(); } }, handleLeft: fI % 2 === 1 });
    // 窗（一扇障子半拉开）
    var Wn = jWindow(g, q, R, 1196, 160, 400, 312, { seed: 243, horizon: 0.55, roof: true, rows: 3 });
    var S = shoji(g, q, 1182, kam, 150, 340, { cols: 2, rows: 5, koshi: 0, handleLeft: true });
    // 窗下：腰壁
    g.beginPath(); g.rect(1180, 500, 432, R.base - 500); texFill(g, q, '#5a4028', TX.hinoki); g.fillStyle = K.lin(g, 0, 500, 0, R.base, [lo(0.1), lo(0.35)]); g.fillRect(1180, 500, 432, R.base - 500);
    // 壁橱
    oshiire(g, q, 1628, kam, 252, R.base, { col: '#cfc4a2' });
    // 柱
    var posts = [80, 456, 1162, 1612, 1886];
    for (var pI = 0; pI < posts.length; pI++) post(g, q, posts[pI], 20, 26, R.base - 20, { col: '#5a3e24', t: TX.hinoki });
    // 地面
    tatamiFloor(g, q, R, { u: 300, seed: 245, x0: 60 });
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 30, 24, 0.4, 't');
    // 窗光落在榻榻米上
    // 暖炉（床之间一角前）
    var HT = oilHeater(g, q, 444, 760, 160, {});
    // 矮桌 + 坐垫 + 茶具
    if (q.model >= 1) zabuton(g, q, R, 936, 1.08, 170, { col: '#6a2a3a' });
    var tb = lowTable(g, q, R, 716, 636, 440, 728, { k: 0.78 });
    teaSet(g, q, 900, 626, 1);
    if (q.model >= 1) { ell(g, 1060, 624, 40, 9, '#e8dcc0'); for (var m = 0; m < 3; m++) circle(g, 1046 + m * 14, 618, 7, ['#f0e8e0', '#e8a0b0', '#a0c890'][m]); }
    void tb;
    // 行李
    bostonBag(g, q, 452, 800, 200, 110);
    // 被褥
    var dF0 = (800 - R.vy) / (R.base - R.vy), dF1 = (976 - R.vy) / (R.base - R.vy);
    futonBed(g, q, R, Xat(R, 704, dF1), Xat(R, 1544, dF1), dF0, dF1, { col: '#7a2a34' });
    // 吊灯
    var pd = paperPendant(g, q, 820, 36, 120);
    // ---- 光照 ----
    var Lm = [
      { lin: [0, 0, W, 0], stops: [[0, 'rgba(80,60,50,0.15)'], [0.6, 'rgba(90,100,130,0.2)'], [1, 'rgba(110,120,150,0.3)']] },
      { x: 1400, y: 300, r: 560, ry: 480, c: '#c0cce8', i: 0.6, fall: 0.3 },
      { pts: [1196, 472, 1596, 472, 1700, 1080, 1000, 1080], c: '#a8b8e0', i: 0.3, fx0: 0, fy0: 472, fx1: 0, fy1: 1080, q: 1 },
      { x: 820, y: 200, r: 820, ry: 600, c: '#ffd0a0', i: 0.5, fall: 0.3 },
      { x: 444, y: 680, r: 260, ry: 200, c: '#ff9a50', i: 0.4, q: 1 },
      { x: 264, y: 420, r: 220, ry: 300, c: '#ffd8b0', i: 0.15, q: 2 }
    ];
    lightMap(g, q, '#46424e', Lm);
    windowGlow(g, q, Wn, 0.14); shojiGlow(g, q, S, '#c8d4f0', 0.18);
    shaft(g, q, [1206, 170, 1586, 170, 1700, 1000, 1040, 1000], '#d0dcf8', 0.06, 0, 170, 0, 1000);
    heaterGlow(g, q, HT); steam(g, q, HT.spout[0], HT.spout[1], 120, 0.25, 247);
    pendantGlow(g, q, pd, 0.55);
    if (q.light >= 2) K.motes(g, K.rng(249), 40, 1100, 200, 500, 600, '#e0e8ff', 0.3);
    finish(g, q, { vig: 0.48 });
  }
  DM.HDBG.def('inn_room', {
    draw: function (g, q) { drawRoom(g, q); },
    lights: [LT(1400, 300, 240, '#c0cce8', 0.5, 0, 'window'), LT(820, 90, 220, '#ffd0a0', 0.55, 0.02, 'lamp'), LT(444, 660, 100, '#ff9a50', 0.45, 0.15, 'fire')],
    key: { x: 0.35, color: '#e8e4dc', amb: '#363444', rim: 0.45 },
    outdoor: false
  });

  /* ================================================================
   * 白峰屋·厨房 inn_kitchen
   * ================================================================ */
  function kamado(g, q, R, x, y, w, by) {
    var top = y + 150, k = R.kWall(by);
    if (q.light >= 1) K.contact(g, x + w / 2, by, w * 0.6, 12, 0.65);
    // 排烟罩 + 烟囱
    fillP(g, [x + 20, top - 60, x + w - 20, top - 60, x + w - 90, top - 170, x + 90, top - 170], '#2a2420');
    g.fillStyle = cylGrad(g, x + w / 2 - 40, 80, '#2a2622'); g.fillRect(x + w / 2 - 40, -10, 80, top - 160);
    // 灶身（灰泥 + 瓷砖贴面）
    box(g, q, R, x, top, w, by - top, k * 0.98, { col: '#8a7a68', t: TX.plasterW, topFace: false });
    var tp = R.p(x, top, 0.9), tp2 = R.p(x + w, top, 0.9);
    fillP(g, [x - 4, top, x + w + 4, top, tp2[0], tp2[1], tp[0], tp[1]], '#3a3430');
    g.beginPath(); g.rect(x, top, w, 18); texFill(g, q, '#4a6a72', TILE_B); rect(g, x, top, w, 2, hi(0.3));
    // 两个灶口 + 羽釜
    for (var i = 0; i < 2; i++) {
      var cx = x + w * (0.28 + i * 0.44), my = top + 70;
      g.beginPath(); g.moveTo(cx - 44, by - 12); g.lineTo(cx - 44, my + 20); g.quadraticCurveTo(cx, my - 14, cx + 44, my + 20); g.lineTo(cx + 44, by - 12); g.closePath(); g.fillStyle = '#0e0a08'; g.fill();
      for (var lg = 0; lg < 3; lg++) { g.save(); g.translate(cx, by - 30); g.rotate(-0.2 + lg * 0.2); g.fillStyle = '#2a1a10'; K.rr(g, -30, -6, 60, 12, 5); g.fill(); g.restore(); }
      var py = (top + tp[1]) / 2;
      g.fillStyle = metalGrad(g, cx - 56, 0, cx + 56, 0, '#3a3a3e'); K.ellipse(g, cx, py, 60, 12); g.fill();
      g.fillStyle = cylGrad(g, cx - 46, 92, i === 0 ? '#2a2a2e' : '#6a5a3a');
      g.beginPath(); g.moveTo(cx - 46, py); g.quadraticCurveTo(cx - 50, py - 50, cx - 38, py - 60); g.lineTo(cx + 38, py - 60); g.quadraticCurveTo(cx + 50, py - 50, cx + 46, py); g.closePath(); g.fill();
      if (i === 0) { g.beginPath(); g.rect(cx - 44, py - 76, 88, 16); texFill(g, q, '#a08060', TX.hinokiH); rect(g, cx - 10, py - 90, 20, 14, '#6a5038'); }
      else ell(g, cx, py - 60, 38, 7, '#4a3a22');
    }
    return { fires: [[x + w * 0.28, by - 40], [x + w * 0.72, by - 40]] };
  }
  function fishPlate(g, q, x, y) {
    ell(g, x, y, 70, 14, '#e8e4dc'); ell(g, x, y - 1, 58, 10, '#c8c4bc');
    for (var f = 0; f < 3; f++) {
      var fy = y - 4 + f * 3, fx = x - 30 + f * 6;
      g.fillStyle = K.lin(g, 0, fy - 6, 0, fy + 6, ['#c8b090', '#7a6040']); g.beginPath(); g.moveTo(fx - 30, fy); g.quadraticCurveTo(fx, fy - 9, fx + 30, fy - 2); g.lineTo(fx + 42, fy - 8); g.lineTo(fx + 40, fy + 6); g.lineTo(fx + 30, fy + 2); g.quadraticCurveTo(fx, fy + 8, fx - 30, fy); g.closePath(); g.fill();
      circle(g, fx - 22, fy - 1, 1.8, '#1a1008');
    }
  }
  function drawKitchen(g, q) {
    setKey(0.2);
    var R = Room(960, 540, 770, 30, 1400);
    rect(g, 0, 0, W, 30, '#2a2018');
    earthWall(g, q, 0, 30, W, 420, { col: '#8a7a66', t: TX.plasterW, age: 0.6 });
    g.fillStyle = 'rgba(20,14,10,0.35)'; g.fillRect(0, 30, 520, 300);   // 灶上方熏黑
    beam(g, q, 0, 30, W, 30, { col: '#1e140c', t: TX.soot });
    beam(g, q, 0, 440, W, 16, { col: '#3a2818' });
    g.beginPath(); g.rect(0, 456, W, R.base - 456); texFill(g, q, '#4a3420', TX.board); g.fillStyle = K.lin(g, 0, 456, 0, R.base, [lo(0.05), lo(0.35)]); g.fillRect(0, 456, W, R.base - 456);
    // 水槽上方的窗
    var Wn = jWindow(g, q, R, 940, 196, 256, 220, { seed: 251, horizon: 0.5, roof: false, rows: 2 });
    // 炉灶
    var KM = kamado(g, q, R, 70, 432, 392, R.base + 6);
    // 七轮架（五格，空一格）
    var sx = 534, sw = 310, sty = 640, sby = 768;
    box(g, q, R, sx, sty, sw, 14, 0.92, { col: '#5a4028', t: TX.hinokiH });
    box(g, q, R, sx, sby - 14, sw, 14, 0.92, { col: '#5a4028', t: TX.hinokiH });
    rect(g, sx + 4, sty + 14, 8, sby - sty - 28, '#4a3020'); rect(g, sx + sw - 12, sty + 14, 8, sby - sty - 28, '#4a3020');
    var slot = sw / 5;
    for (var s = 0; s < 5; s++) {
      var cx = sx + slot * (s + 0.5);
      if (s === 3) { // 空位：灰尘里留下的圆印
        ell(g, cx, sty - 2, slot * 0.36, 5, 'rgba(30,22,14,0.55)'); ell(g, cx, sty - 2, slot * 0.3, 3.5, 'rgba(110,96,80,0.4)');
        continue;
      }
      shichirin(g, q, cx, sty, 56, {});
    }
    if (q.model >= 1) for (var t2 = 0; t2 < 3; t2++) { g.fillStyle = cylGrad(g, sx + 30 + t2 * 90, 60, '#3a3a3e'); g.fillRect(sx + 30 + t2 * 90, sby - 44, 60, 30); }
    // 水槽
    var kx = 908, kw = 320, kty = 600;
    box(g, q, R, kx, kty + 16, kw, R.base + 6 - kty - 16, R.kWall(R.base + 6), { col: '#6a5038', t: TX.hinoki, topFace: false });
    box(g, q, R, kx - 10, kty, kw + 20, 18, 0.95, { col: '#a8a8b0', t: TX.iron });
    var si = R.p(kx + 30, kty, 0.97), si2 = R.p(kx + kw - 30, kty, 0.97);
    fillP(g, [kx + 26, kty, kx + kw - 26, kty, si2[0], si2[1], si[0], si[1]], '#3a3a40');
    g.fillStyle = metalGrad(g, kx + kw / 2 - 6, 0, kx + kw / 2 + 6, 0, '#c8c8d0'); g.fillRect(kx + kw / 2 - 5, kty - 70, 10, 66);
    g.beginPath(); g.moveTo(kx + kw / 2, kty - 66); g.quadraticCurveTo(kx + kw / 2, kty - 92, kx + kw / 2 + 40, kty - 88); stroke(g, 8, '#b8b8c0');
    if (q.model >= 1) { for (var b = 0; b < 3; b++) { ell(g, kx + 60 + b * 20, kty - 4 - b * 6, 28, 7, '#e8e4dc'); } g.fillStyle = cylGrad(g, kx + kw - 70, 30, '#e8a040'); g.fillRect(kx + kw - 70, kty - 50, 30, 46); }
    // 茶柜（吊柜）+ 下方小柜 + 小药箱
    var tcx = 1276, tcw = 232;
    box(g, q, R, tcx, 252, tcw, 272, 0.95, { col: '#4a3020', t: TX.keyaki });
    for (var gd = 0; gd < 2; gd++) {
      var gx = tcx + 12 + gd * (tcw - 24) / 2, gw = (tcw - 24) / 2 - 6;
      rect(g, gx, 268, gw, 236, '#1a1410');
      for (var sh = 0; sh < 3; sh++) {
        var sy = 268 + 78 * (sh + 1) - 6; rect(g, gx, sy, gw, 4, '#5a4028');
        for (var cu = 0; cu < 3; cu++) { var ux = gx + 14 + cu * (gw - 28) / 2; if (sh === 2) { g.fillStyle = cylGrad(g, ux - 12, 24, ['#5a6a3a', '#7a3a2a', '#2a3a5a'][cu]); g.fillRect(ux - 12, sy - 40, 24, 40); } else { g.fillStyle = cylGrad(g, ux - 11, 22, '#e8e2d4'); g.fillRect(ux - 11, sy - 24, 22, 22); ell(g, ux, sy - 24, 11, 3, '#c8c0b0'); } }
      }
      g.fillStyle = K.lin(g, gx, 268, gx + gw, 504, ['rgba(200,215,235,0.16)', 'rgba(0,0,0,0)', 'rgba(200,215,235,0.1)']); g.fillRect(gx, 268, gw, 236);
      g.strokeStyle = '#3a2414'; g.lineWidth = 5; g.strokeRect(gx, 268, gw, 236);
    }
    box(g, q, R, 1270, 612, 244, R.base + 6 - 612, R.kWall(R.base + 6), { col: '#4a3020', t: TX.keyaki });
    groove(g, 1284, 640, 104, 100, 3, 0.4); groove(g, 1396, 640, 104, 100, 3, 0.4);
    // 小药箱（漆盒）
    box(g, q, R, 1318, 566, 148, 44, 0.95, { col: '#4a1014', topHi: 0.3 });
    if (q.model >= 1) { rect(g, 1380, 578, 24, 18, '#c9a25a'); K.text(g, '薬', 1392, 588, 13, '#3a1006', { weight: 'bold' }); }
    // 后门（玻璃格子拉门，外面是雪）
    var bdx = 1604, bdw = 240, bdy = 326, bdb = R.base;
    g.beginPath(); g.rect(bdx - 18, bdy - 18, bdw + 36, bdb - bdy + 18); texFill(g, q, '#3a2818', TX.sugi);
    rect(g, bdx, bdy, bdw, bdb - bdy, '#1a1410');
    g.save(); g.beginPath(); g.rect(bdx + bdw * 0.55, bdy, bdw * 0.45, bdb - bdy); g.clip();
    snowView(g, q, bdx + bdw * 0.55, bdy, bdw * 0.45, bdb - bdy, { seed: 253, horizon: 0.45 });
    g.restore();
    var doorS = [bdx, bdy, bdw * 0.62, bdb - bdy];
    g.beginPath(); g.rect(doorS[0], doorS[1], doorS[2], doorS[3]); texFill(g, q, '#5a4028', TX.sugi);
    var gp = [bdx + 16, bdy + 16, doorS[2] - 32, (bdb - bdy) * 0.5];
    rect(g, gp[0], gp[1], gp[2], gp[3], '#c8d0dc'); g.fillStyle = K.lin(g, 0, gp[1], 0, gp[1] + gp[3], ['rgba(230,236,245,0.5)', 'rgba(170,180,200,0.4)']); g.fillRect(gp[0], gp[1], gp[2], gp[3]);
    for (var gx2 = 1; gx2 < 3; gx2++) rect(g, gp[0] + gp[2] * gx2 / 3 - 2, gp[1], 4, gp[3], '#3a2818');
    for (var gy2 = 1; gy2 < 4; gy2++) rect(g, gp[0], gp[1] + gp[3] * gy2 / 4 - 2, gp[2], 4, '#3a2818');
    groove(g, bdx + 16, bdy + 30 + gp[3], doorS[2] - 32, (bdb - bdy) * 0.4, 3, 0.4);
    // 地面（土间）
    tileFloor(g, q, R, { tile: 150, col: '#4a4440', t: TX.tataki, mortar: '#2a2622', gap: 1.2, seed: 255, var: 0.06, bevel: false });
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 40, 30, 0.45, 't');
    // 后门外漏进来的雪
    if (q.model >= 1) { K.ellipse(g, bdx + bdw * 0.75, R.base + 18, 90, 12); g.fillStyle = 'rgba(230,236,246,0.8)'; g.fill(); }
    // 工作台 + 烤鱼
    var tx = 684, tw = 592, tty = 830, tby = 952, tk = 0.82;
    if (q.light >= 1) K.contact(g, tx + tw / 2, tby, tw * 0.55, 16, 0.6);
    var bl = R.p(tx + 14, tby, tk), br = R.p(tx + tw - 40, tby, tk);
    rect(g, bl[0], tty + 30, 20, bl[1] - tty - 30, '#3a2818'); rect(g, br[0], tty + 30, 20, br[1] - tty - 30, '#3a2818');
    rect(g, tx + 12, tty + 30, 24, tby - tty - 30, '#4a3220'); rect(g, tx + tw - 36, tty + 30, 24, tby - tty - 30, '#4a3220');
    box(g, q, R, tx, tty, tw, 30, tk, { col: '#7a5a38', t: TX.hinokiH, topHi: 0.22 });
    var tp = function (u, v) { return R.p(tx + tw * u, tty, 1 - (1 - tk) * v); };
    if (q.model >= 1) {
      var fp = tp(0.3, 0.5); fishPlate(g, q, fp[0], fp[1]);
      var cbp = tp(0.62, 0.5); fillP(g, [cbp[0] - 90, cbp[1] + 8, cbp[0] + 90, cbp[1] + 8, cbp[0] + 80, cbp[1] - 12, cbp[0] - 80, cbp[1] - 12], '#c8a878'); rect(g, cbp[0] - 90, cbp[1] + 8, 180, 6, '#8a6a48');
      g.save(); g.translate(cbp[0] - 20, cbp[1] - 4); g.rotate(-0.06); g.fillStyle = K.lin(g, 0, -10, 0, 10, ['#f4f2ec', '#c8c4bc']); K.rr(g, -60, -10, 120, 20, 10); g.fill(); g.restore();
      var bw2 = tp(0.86, 0.45); g.fillStyle = K.lin(g, 0, bw2[1] - 26, 0, bw2[1], ['#3a2a4a', '#1a1428']); g.beginPath(); g.moveTo(bw2[0] - 34, bw2[1] - 26); g.quadraticCurveTo(bw2[0] - 30, bw2[1] + 2, bw2[0], bw2[1] + 2); g.quadraticCurveTo(bw2[0] + 30, bw2[1] + 2, bw2[0] + 34, bw2[1] - 26); g.closePath(); g.fill();
      ell(g, bw2[0], bw2[1] - 26, 34, 7, '#f4f0e8');
    }
    // 荧光灯
    rect(g, 760, 80, 420, 16, '#e8e8ea'); rect(g, 752, 70, 436, 12, '#a8a8ae'); seg(g, 800, 30, 800, 70, 2, '#2a2a2e'); seg(g, 1140, 30, 1140, 70, 2, '#2a2a2e');
    // ---- 光照 ----
    var Lm = [
      { x: 970, y: 240, r: 900, ry: 640, c: '#e8eef8', i: 0.55, fall: 0.3 },
      { x: 970, y: 900, r: 640, ry: 200, c: '#e0e6f0', i: 0.28, q: 1 },
      { x: 1068, y: 300, r: 340, ry: 300, c: '#b8c8e8', i: 0.45 },
      { x: 1780, y: 560, r: 260, ry: 360, c: '#b8c8e8', i: 0.35 },
      { x: 266, y: 740, r: 320, ry: 160, c: '#ff8a40', i: 0.45, q: 1 }
    ];
    lightMap(g, q, '#42404a', Lm);
    windowGlow(g, q, Wn, 0.14);
    g.save(); g.globalCompositeOperation = 'lighter'; rect(g, gp[0], gp[1], gp[2], gp[3], 'rgba(200,214,236,0.18)'); rect(g, bdx + bdw * 0.62, bdy, bdw * 0.38, bdb - bdy, 'rgba(200,214,236,0.12)'); rect(g, 762, 84, 416, 10, 'rgba(255,255,255,0.8)'); g.restore();
    if (q.light >= 1) K.glow(g, 970, 90, 260, '#e8f0ff', 0.25);
    for (var fI = 0; fI < 2; fI++) emberGlow(g, q, KM.fires[fI], 90, 257 + fI);
    steam(g, q, 70 + 392 * 0.72, 470, 140, 0.25, 259);
    if (q.light >= 2) K.motes(g, K.rng(261), 30, 900, 200, 400, 500, '#e8eeff', 0.25);
    finish(g, q, { vig: 0.5 });
  }
  DM.HDBG.def('inn_kitchen', {
    draw: function (g, q) { drawKitchen(g, q); },
    lights: [LT(970, 90, 280, '#e8eef8', 0.55, 0.02, 'lamp'), LT(1068, 300, 180, '#b8c8e8', 0.4, 0, 'window'), LT(180, 728, 90, '#ff8a40', 0.5, 0.5, 'fire'), LT(354, 728, 90, '#ff8a40', 0.5, 0.5, 'fire')],
    key: { x: 0.2, color: '#e8ecf4', amb: '#363844', rim: 0.4 },
    outdoor: false
  });

})(typeof window !== 'undefined' ? window : globalThis);
