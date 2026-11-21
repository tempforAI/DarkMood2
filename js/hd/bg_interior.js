/* DARK MOOD Ⅱ 室内 HD 背景（DM.HDBG）
 * ------------------------------------------------------------------
 * inn_entrance inn_hearth inn_room inn_kitchen inn_bath kumagai_hut
 * shiramine_hall shiramine_2f annex（拜殿/神乐殿/雪牢在 bg_extra.js）
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
    if (o.view) { g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip(); o.view(g, q, gx, gy, gw, gh); g.restore(); } else snowView(g, q, gx, gy, gw, gh, { seed: o.seed, horizon: o.horizon, roof: o.roof });
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
  var BOOK_COLS = ['#5a1a1a', '#2a3a2a', '#3a2a1a', '#1e2a40', '#6a4a2a', '#4a1a2a', '#2a2a30', '#7a5a3a', '#3a1010', '#283828', '#4a3a20', '#20283a'];
  // 一排书。返回实际宽度
  function bookRow(g, q, x, by, w, hMax, rnd, o) {
    o = o || {};
    var bx = x;
    while (bx < x + w - 6) {
      var bw = (o.thin ? 4 : 9) + rnd() * (o.thin ? 3 : 12), bh = hMax * (0.6 + rnd() * 0.36);
      if (q.model >= 1 && rnd() < 0.06) { bx += 8 + rnd() * 26; continue; }
      if (bx + bw > x + w - 2) break;
      var c = o.cols ? rnd.pick(o.cols) : rnd.pick(BOOK_COLS);
      if (q.model >= 2 && rnd() < 0.05 && bx + bh * 0.6 < x + w) {
        // 斜靠的书
        g.save(); g.translate(bx, by); g.rotate(-0.35); g.fillStyle = cylGrad(g, 0, bw, c); g.fillRect(0, -bh, bw, bh); g.restore();
        bx += bh * 0.36 + bw; continue;
      }
      g.fillStyle = cylGrad(g, bx, bw, c); g.fillRect(bx, by - bh, bw, bh);
      if (q.model >= 1 && bw > 6) {
        var gc = rnd() < 0.6 ? 'rgba(220,180,100,0.55)' : 'rgba(0,0,0,0.35)';
        rect(g, bx + 1, by - bh + bh * 0.12, bw - 2, 1.6, gc); rect(g, bx + 1, by - bh * 0.18, bw - 2, 1.6, gc);
        if (q.model >= 2 && bw > 10) rect(g, bx + 2, by - bh * 0.6, bw - 4, bh * 0.12, 'rgba(0,0,0,0.25)');
      }
      rect(g, bx, by - bh, bw, 1.5, hi(0.12));
      bx += bw + 0.6;
    }
    return bx - x;
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
    var cx0 = 372, cw = 408, cty = 652, cby = 826;
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
    box(g, q, R, sbx, sby, sbw, sbb - sby, 0.965, { col: '#5a3a20', t: TX.hinoki, sideCol: '#3a2410' });
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
    // 被（掛布団，花纹）：圆润的边缘 + 鼓起的高光
    var kb = F.q(0.2, 1.01, 0.02, 1.0), col = o.col || '#7a2a34';
    var fr = [kb[6], kb[7], kb[4], kb[5]];
    g.beginPath(); g.moveTo(fr[0], fr[1]); g.quadraticCurveTo((fr[0] + fr[2]) / 2, fr[1] + 6, fr[2], fr[3]); g.quadraticCurveTo(fr[2] + 6, fr[3] + th + 4, fr[2] - 10, fr[3] + th + 14);
    g.lineTo(fr[0] + 10, fr[1] + th + 14); g.quadraticCurveTo(fr[0] - 6, fr[1] + th + 4, fr[0], fr[1]); g.closePath(); g.fillStyle = K.shade(col, -0.35); g.fill();
    g.beginPath(); g.moveTo(kb[0], kb[1]); g.quadraticCurveTo((kb[0] + kb[2]) / 2, kb[1] - 6, kb[2], kb[3]); g.quadraticCurveTo(kb[4] + 4, (kb[3] + kb[5]) / 2, kb[4], kb[5]);
    g.quadraticCurveTo((kb[4] + kb[6]) / 2, kb[5] + 6, kb[6], kb[7]); g.quadraticCurveTo(kb[0] - 4, (kb[1] + kb[7]) / 2, kb[0], kb[1]); g.closePath();
    texFill(g, q, col, TX.futon);
    g.fillStyle = K.rad(g, (kb[0] + kb[4]) / 2, (kb[1] + kb[5]) / 2 - 10, 10, (kb[4] - kb[6]) * 0.6, [hi(0.16), hi(0.02), lo(0.25)]); g.fill();
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
    for (var fI = 0; fI < 4; fI++) fusuma(g, q, fx0 + fI * fw2, kam, fw2, R.base - kam, { col: '#d0c4a0', art: function (g2, q2, x, y, w, h) { for (var cl = 0; cl < 3; cl++) { var cy = y + h * (0.22 + cl * 0.24), cx = x - fI * w + w * (0.6 + cl * 1.3); K.rr(g2, cx - w * 0.9, cy - h * 0.022, w * 1.8, h * 0.044, h * 0.022); g2.fillStyle = 'rgba(176,140,70,0.16)'; g2.fill(); g2.strokeStyle = 'rgba(150,110,50,0.22)'; g2.lineWidth = 1.5; g2.stroke(); } }, handleLeft: fI % 2 === 1 });
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
    windowGlow(g, q, Wn, 0.14); shojiGlow(g, q, S, '#c8d4f0', 0.07);
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
    fillP(g, [x + 10, top - 190, x + w - 10, top - 190, x + w - 80, top - 290, x + 80, top - 290], '#2a2420');
    fillP(g, [x + 10, top - 190, x + w - 10, top - 190, x + w - 14, top - 182, x + 14, top - 182], '#4a4440');
    g.fillStyle = cylGrad(g, x + w / 2 - 40, 80, '#2a2622'); g.fillRect(x + w / 2 - 40, -10, 80, top - 280);
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
    g.fillStyle = K.rad(g, 266, 200, 20, 420, ['rgba(20,14,10,0.5)', 'rgba(20,14,10,0.2)', 'rgba(20,14,10,0)']); g.fillRect(0, 30, 760, 420);   // 灶上方熏黑
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


  /* ================================================================
   * 白峰屋·女汤 inn_bath
   * ================================================================ */
  function bathTags(g, q, x, y, w, h) {
    if (q.light >= 1) softRect(g, x + 6, y + 6, w, h, 6, 0.4);
    g.beginPath(); g.rect(x, y, w, h); texFill(g, q, '#7a5a38', TX.hinoki); bevel(g, x, y, w, h, 4, 0.2, 0.4);
    K.text(g, '入浴札', x + w / 2, y + 22, 18, '#2a1a0a', { weight: 'bold' });
    var tags = [['入浴中', '#a01a20', '#f4ece0'], ['清扫中', '#f0eadc', '#2a2a30'], ['', '#d8c8a8', '#3a2a1a']];
    for (var i = 0; i < 3; i++) {
      var tx = x + 22 + i * (w - 44) / 2.4, ty = y + 50;
      circle(g, tx + 14, ty - 4, 3, '#3a3a40'); seg(g, tx + 14, ty - 4, tx + 14, ty + 4, 1.5, '#3a3a40');
      g.fillStyle = tags[i][1]; K.rr(g, tx, ty + 4, 28, h - 74, 3); g.fill(); g.strokeStyle = lo(0.4); g.lineWidth = 1; g.stroke();
      if (tags[i][0]) for (var c = 0; c < 3; c++) K.text(g, tags[i][0].charAt(c), tx + 14, ty + 22 + c * 22, 15, tags[i][2], { weight: 'bold' });
    }
  }
  function basketShelf(g, q, R, x, y, w, by) {
    if (q.light >= 1) K.contact(g, x + w / 2, by, w * 0.6, 8, 0.55);
    box(g, q, R, x, y, w, by - y, R.kWall(by), { col: '#8a6a44', t: TX.hinoki });
    var rows = 2, sh = (by - y - 20) / rows;
    for (var r = 0; r < rows; r++) {
      var sy = y + 10 + r * sh, fl = sy + sh - 6;
      rect(g, x + 10, sy, w - 20, sh - 6, '#3a2a1a');
      if (q.light >= 1) { g.fillStyle = K.lin(g, 0, sy, 0, sy + 20, [lo(0.45), lo(0)]); g.fillRect(x + 10, sy, w - 20, 20); }
      for (var c = 0; c < 3; c++) {
        var bx = x + 18 + c * (w - 36) / 3, bw = (w - 36) / 3 - 10, bh = sh * 0.6;
        g.fillStyle = K.lin(g, 0, fl - bh, 0, fl, ['#c8a060', '#8a6a34']);
        g.beginPath(); g.moveTo(bx, fl - bh); g.lineTo(bx + bw, fl - bh); g.lineTo(bx + bw - 6, fl); g.lineTo(bx + 6, fl); g.closePath(); g.fill();
        if (q.model >= 1) { for (var wv = 1; wv < 5; wv++) seg(g, bx + 3, fl - bh + bh * wv / 5, bx + bw - 3, fl - bh + bh * wv / 5, 1.2, 'rgba(90,60,20,0.5)'); for (var wv2 = 1; wv2 < 6; wv2++) seg(g, bx + bw * wv2 / 6, fl - bh, bx + bw * wv2 / 6, fl, 1, 'rgba(90,60,20,0.35)'); }
        ell(g, bx + bw / 2, fl - bh, bw / 2, 4, '#9a7a44');
        if ((r + c) % 3 === 0) { g.fillStyle = K.lin(g, 0, fl - bh - 16, 0, fl - bh, ['#f4f0e8', '#c8c4bc']); K.rr(g, bx + 8, fl - bh - 14, bw - 16, 18, 6); g.fill(); }
        if (r === 1 && c === 1) { g.fillStyle = K.lin(g, 0, fl - bh - 20, 0, fl - bh, ['#2a3a6a', '#1a2448']); K.rr(g, bx + 6, fl - bh - 18, bw - 12, 22, 6); g.fill(); for (var p = 0; p < 4; p++) circle(g, bx + 18 + p * 14, fl - bh - 8, 3, 'rgba(240,240,250,0.6)'); }
      }
      rect(g, x + 10, fl, w - 20, 6, '#8a6a44'); rect(g, x + 10, fl, w - 20, 1.5, hi(0.3));
    }
  }
  // 黄色洗面盆（「ケロリン」式）+ 小木凳
  function bathStool(g, q, x, by, s) {
    if (q.light >= 1) K.contact(g, x, by, 40 * s, 7 * s, 0.55);
    rect(g, x - 26 * s, by - 34 * s, 8 * s, 34 * s, '#8a6a44'); rect(g, x + 18 * s, by - 34 * s, 8 * s, 34 * s, '#8a6a44');
    g.fillStyle = K.lin(g, 0, by - 44 * s, 0, by - 30 * s, ['#c8a878', '#8a6a44']); K.rr(g, x - 32 * s, by - 44 * s, 64 * s, 14 * s, 4 * s); g.fill();
  }
  function bucket(g, q, x, by, s, col) {
    if (q.light >= 1) K.contact(g, x, by, 34 * s, 6 * s, 0.5);
    g.fillStyle = cylGrad(g, x - 28 * s, 56 * s, col || '#e8c030');
    g.beginPath(); g.moveTo(x - 28 * s, by - 34 * s); g.lineTo(x + 28 * s, by - 34 * s); g.lineTo(x + 22 * s, by); g.lineTo(x - 22 * s, by); g.closePath(); g.fill();
    ell(g, x, by - 34 * s, 28 * s, 7 * s, K.shade(col || '#e8c030', 0.2)); ell(g, x, by - 33 * s, 24 * s, 5 * s, K.shade(col || '#e8c030', -0.25));
    if (q.model >= 1 && !col) K.text(g, 'ケロリン', x, by - 18 * s, 10 * s, '#c02020', { weight: 'bold' });
  }
  function drawBath(g, q) {
    setKey(0.3);
    var R = Room(960, 520, 740, 0, 1300);
    // 后墙：桧木板 + 下部瓷砖
    g.beginPath(); g.rect(0, 0, W, R.base); texFill(g, q, '#a88a60', ['wood', { c1: '#8a6a44', c2: '#c8a878', gap: '#5a4028', planks: 5, dir: 'v', seed: 271, ring: 2 }, 300]);
    g.fillStyle = K.lin(g, 0, 0, 0, R.base, [lo(0.35), lo(0.05), lo(0.15)]); g.fillRect(0, 0, W, R.base);
    g.beginPath(); g.rect(700, 500, W - 700, R.base - 500); texFill(g, q, '#6a8a90', TILE_B);
    g.fillStyle = K.lin(g, 0, 500, 0, R.base, [lo(0.05), lo(0.3)]); g.fillRect(700, 500, W - 700, R.base - 500);
    beam(g, q, 700, 492, W - 700, 10, { col: '#6a4a2a', t: TX.hinokiH });
    // 入口门（左）+ 入浴札 + 篮架
    g.beginPath(); g.rect(-10, 200, 100, R.base - 200); texFill(g, q, '#6a4a2a', TX.hinoki); rect(g, 10, 220, 66, 200, '#d0c8b8'); for (var dl = 1; dl < 4; dl++) rect(g, 10, 220 + dl * 50, 66, 3, '#5a3a20');
    bathTags(g, q, 124, 244, 152, 216);
    basketShelf(g, q, R, 322, 444, 316, 700);
    // 洗身处（后墙上：镜子 + 龙头）
    for (var st = 0; st < 2; st++) {
      var mx = 712 + st * 108;
      if (q.light >= 1) softRect(g, mx + 4, 404, 84, 100, 5, 0.3);
      g.fillStyle = K.lin(g, mx, 400, mx + 84, 500, ['#c8d4e0', '#8a98a8', '#b0bccb']); g.fillRect(mx, 400, 84, 100); g.strokeStyle = '#5a5a62'; g.lineWidth = 3; g.strokeRect(mx, 400, 84, 100);
      g.fillStyle = 'rgba(240,244,250,0.35)'; g.fillRect(mx + 4, 404, 76, 60);
      g.fillStyle = metalGrad(g, mx + 20, 0, mx + 64, 0, '#c8c8d0'); g.fillRect(mx + 14, 560, 56, 10); circle(g, mx + 22, 556, 6, '#d8d8e0'); circle(g, mx + 62, 556, 6, '#d8d8e0');
      seg(g, mx + 42, 570, mx + 42, 590, 5, '#b8b8c0');
      if (q.model >= 1) { rect(g, mx + 8, 520, 68, 8, '#a8a8b0'); g.fillStyle = cylGrad(g, mx + 14, 16, '#f0f0f4'); g.fillRect(mx + 14, 494, 16, 26); g.fillStyle = cylGrad(g, mx + 40, 16, '#e8b0c0'); g.fillRect(mx + 40, 498, 16, 22); }
    }
    // 窗（结满雾气，外面是雪）
    var Wn = jWindow(g, q, R, 1216, 160, 488, 212, { seed: 273, horizon: 0.5, rows: 2, frame: '#6a4a2a', sill: false });
    g.save(); g.globalAlpha = 0.5; g.fillStyle = K.lin(g, 0, Wn.gy, 0, Wn.gy + Wn.gh, ['rgba(230,236,244,0.7)', 'rgba(230,236,244,0.35)']); g.fillRect(Wn.gx, Wn.gy, Wn.gw, Wn.gh); g.restore();
    if (q.model >= 1) { var rd = K.rng(275); for (var dr = 0; dr < 14; dr++) { var ddx = Wn.gx + rd() * Wn.gw, ddy = Wn.gy + rd() * Wn.gh * 0.5; seg(g, ddx, ddy, ddx + rd() * 4 - 2, ddy + 30 + rd() * 60, 1.5, 'rgba(120,140,170,0.35)'); } }
    // 防水壁灯
    var lamp = [1080, 300];
    g.fillStyle = metalGrad(g, lamp[0] - 20, 0, lamp[0] + 20, 0, '#8a8a92'); g.fillRect(lamp[0] - 18, lamp[1] + 30, 36, 10);
    g.fillStyle = K.rad(g, lamp[0] - 6, lamp[1] + 8, 2, 34, ['#fffaf0', '#f0e0c0', '#c8b490']); K.ellipse(g, lamp[0], lamp[1] + 10, 30, 26); g.fill();
    for (var cg = -1; cg <= 1; cg++) seg(g, lamp[0] + cg * 16, lamp[1] - 14, lamp[0] + cg * 16, lamp[1] + 34, 2, '#5a5a62');
    // 地面（湿瓷砖）
    tileFloor(g, q, R, { tile: 90, col: '#5a6a6c', t: TILE_F, mortar: '#2a3032', gap: 1.6, seed: 277, var: 0.05 });
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 30, 24, 0.45, 't');
    // 湿地面的倒影
    floorSheen(g, q, R, 1080, 120, '#fff0d0', 0.18); floorSheen(g, q, R, 1460, 300, '#c8d4f0', 0.12);
    // 浴槽（桧木）：沿后墙，水面冒热气
    var tx0 = 920, tx1 = 1804, trimY = 818, tDepth = 0.72;
    var tk = R.kWall(trimY + 72);
    var fl0 = [tx0, trimY], fl1 = [tx1, trimY], bl0 = R.p(tx0, trimY, tk), bl1 = R.p(tx1, trimY, tk);
    if (q.light >= 1) K.contact(g, (tx0 + tx1) / 2, trimY + 76, (tx1 - tx0) * 0.55, 14, 0.5);
    // 槽壁正面
    g.beginPath(); g.rect(tx0, trimY + 14, tx1 - tx0, 62); texFill(g, q, '#a88458', TX.hinoki);
    g.fillStyle = K.lin(g, 0, trimY + 14, 0, trimY + 76, [hi(0.08), lo(0.35)]); g.fillRect(tx0, trimY + 14, tx1 - tx0, 62);
    if (q.model >= 1) for (var bd = 1; bd < 9; bd++) seg(g, tx0 + (tx1 - tx0) * bd / 9, trimY + 16, tx0 + (tx1 - tx0) * bd / 9, trimY + 74, 1.2, 'rgba(60,40,20,0.35)');
    // 左端面
    fillP(g, [tx0, trimY, bl0[0], bl0[1], bl0[0], R.py(trimY + 76, tk), tx0, trimY + 76], '#7a5a38');
    // 水面
    var wq = [tx0 + 18, trimY + 6, tx1 - 18, trimY + 6, R.px(tx1 - 18, tk + 0.03), R.py(trimY + 6, tk + 0.03), R.px(tx0 + 18, tk + 0.03), R.py(trimY + 6, tk + 0.03)];
    K.poly(g, wq); g.fillStyle = K.lin(g, 0, wq[5], 0, wq[1], ['#3a5a5c', '#5a8a88', '#7aa8a4']); g.fill();
    if (q.model >= 1) { var rw = K.rng(279); for (var rp = 0; rp < M(q, 0, 14, 26); rp++) { var rx = lerp(wq[0], wq[2], rw()), ry = lerp(wq[5], wq[1], rw()); K.ellipse(g, rx, ry, 20 + rw() * 30, 2); g.strokeStyle = 'rgba(220,240,240,0.25)'; g.lineWidth = 1.2; g.stroke(); } }
    // 槽沿（宽木框）
    fillP(g, [tx0 - 6, trimY + 14, tx1 + 6, trimY + 14, tx1 + 6, trimY, tx0 - 6, trimY], '#c8a070');
    K.poly(g, [tx0 - 6, trimY, tx1 + 6, trimY, bl1[0] + 6, bl1[1], bl0[0] - 6, bl0[1]]); g.lineWidth = 6; g.strokeStyle = '#b8925e'; g.stroke();
    rect(g, tx0 - 6, trimY, tx1 - tx0 + 12, 2, hi(0.4));
    // 出汤口（竹筒）
    var sp = [1660, 600];
    g.fillStyle = cylGrad(g, sp[0] - 10, 20, '#6a8a3a'); g.fillRect(sp[0] - 10, sp[1] - 120, 20, 120);
    g.save(); g.translate(sp[0], sp[1]); g.rotate(-0.4); g.fillStyle = K.lin(g, 0, -10, 0, 10, ['#8aaa4a', '#4a6a2a']); g.fillRect(-60, -10, 70, 20); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; g.beginPath(); g.moveTo(sp[0] - 56, sp[1] + 22); g.quadraticCurveTo(sp[0] - 70, sp[1] + 70, sp[0] - 74, R.py(trimY + 6, tk + 0.1)); stroke(g, 6, 'rgba(200,230,240,0.45)'); g.restore();
    // 洗身处（前景）：小凳、盆、置物架、排水沟
    var dg = [784, 950, 944, 996];
    fillP(g, [dg[0], dg[1], dg[2], dg[1], dg[2] + 6, dg[3], dg[0] - 6, dg[3]], '#1a2224');
    for (var gr = 0; gr < 10; gr++) { var gx = lerp(dg[0], dg[2], (gr + 0.5) / 10); seg(g, gx, dg[1] + 2, gx + (gx - 864) * 0.04, dg[3] - 2, 3, '#6a7274'); }
    seg(g, dg[0], dg[1], dg[2], dg[1], 2, hi(0.25));
    bathStool(g, q, 360, 900, 1.3); bucket(g, q, 470, 912, 1.3); bathStool(g, q, 640, 880, 1.2); bucket(g, q, 724, 892, 1.1, '#e8e4dc');
    if (q.model >= 1) { // 洗身处的小架（在墙边的柱上）
      box(g, q, R, 250, 780, 120, 14, 0.94, { col: '#a88458', t: TX.hinokiH });
      g.fillStyle = cylGrad(g, 270, 20, '#f0f0f4'); g.fillRect(270, 752, 20, 28); ell(g, 330, 774, 18, 7, '#f0e8d0');
    }
    // ---- 光照 ----
    var Lm = [
      { x: lamp[0], y: lamp[1] + 40, r: 820, ry: 640, c: '#ffe0b8', i: 0.55, fall: 0.3 },
      { x: 1460, y: 280, r: 520, ry: 380, c: '#c8d4ec', i: 0.55 },
      { x: 1360, y: 860, r: 600, ry: 160, c: '#d8e4ec', i: 0.25, q: 1 },
      { x: 300, y: 500, r: 500, ry: 500, c: '#e8d0b0', i: 0.25 }
    ];
    lightMap(g, q, '#4e4c56', Lm);
    windowGlow(g, q, Wn, 0.16);
    if (q.light >= 1) K.glow(g, lamp[0], lamp[1] + 10, 150, '#fff0d0', 0.4);
    // 蒸汽
    if (q.light >= 1) { g.save(); g.globalCompositeOperation = 'screen'; var rs = K.rng(281); for (var s2 = 0; s2 < M(q, 4, 8, 14); s2++) K.blob(g, 960 + rs() * 860, 420 + rs() * 380, 140 + rs() * 180, '#dfe6ee', 0.12 + rs() * 0.08); g.restore(); }
    if (q.light >= 2) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(200,210,224,0.08)'; g.fillRect(0, 0, W, H); g.restore(); }
    finish(g, q, { vig: 0.45 });
  }
  DM.HDBG.def('inn_bath', {
    draw: function (g, q) { drawBath(g, q); },
    lights: [LT(1080, 310, 220, '#ffe8c8', 0.55, 0.02, 'lamp'), LT(1460, 270, 220, '#c8d4ec', 0.45, 0, 'window')],
    key: { x: 0.3, color: '#f0e8dc', amb: '#3e3c4a', rim: 0.45 },
    outdoor: false
  });

  /* ================================================================
   * 熊谷的小屋 kumagai_hut
   * ================================================================ */
  // 胴长（涉水长靴裤，湿的）
  function waders(g, q, x, y, w, h, wet) {
    var cx = x + w / 2, col = '#4a5438';
    circle(g, cx, y + 6, 6, '#3a2a1a'); seg(g, cx, y + 6, cx - w * 0.3, y + 40, 4, '#1a1e16'); seg(g, cx, y + 6, cx + w * 0.3, y + 40, 4, '#1a1e16');
    g.beginPath();
    g.moveTo(cx - w * 0.36, y + 40); g.lineTo(cx + w * 0.36, y + 40); g.lineTo(cx + w * 0.4, y + h * 0.42);
    g.lineTo(cx + w * 0.42, y + h * 0.82); g.lineTo(cx + w * 0.5, y + h * 0.9); g.lineTo(cx + w * 0.5, y + h); g.lineTo(cx + w * 0.06, y + h); g.lineTo(cx + w * 0.06, y + h * 0.84);
    g.lineTo(cx + w * 0.02, y + h * 0.5); g.lineTo(cx - w * 0.02, y + h * 0.5); g.lineTo(cx - w * 0.06, y + h * 0.84); g.lineTo(cx - w * 0.06, y + h); g.lineTo(cx - w * 0.5, y + h);
    g.lineTo(cx - w * 0.5, y + h * 0.9); g.lineTo(cx - w * 0.42, y + h * 0.82); g.lineTo(cx - w * 0.4, y + h * 0.42); g.closePath();
    g.fillStyle = K.lin(g, cx - w / 2, 0, cx + w / 2, 0, [K.shade(col, -0.4), K.shade(col, 0.2), col, K.shade(col, -0.5)]); g.fill();
    // 靴部
    fillP(g, [cx - w * 0.5, y + h * 0.88, cx - w * 0.06, y + h * 0.88, cx - w * 0.06, y + h, cx - w * 0.5, y + h], '#141410');
    fillP(g, [cx + w * 0.06, y + h * 0.88, cx + w * 0.5, y + h * 0.88, cx + w * 0.5, y + h, cx + w * 0.06, y + h], '#141410');
    if (q.model >= 1) { for (var f = 0; f < 5; f++) seg(g, cx - w * 0.3 + f * 6, y + h * 0.5 + f * 20, cx - w * 0.2 + f * 6, y + h * 0.56 + f * 20, 1.5, 'rgba(0,0,0,0.35)'); rect(g, cx - w * 0.3, y + 70, w * 0.6, 26, K.shade(col, -0.2)); }
    if (wet && q.light >= 1) { // 湿光 + 滴水
      g.save(); g.globalCompositeOperation = 'lighter';
      seg(g, cx - w * 0.22, y + 60, cx - w * 0.26, y + h * 0.8, 3, 'rgba(200,220,230,0.18)'); seg(g, cx + w * 0.28, y + 70, cx + w * 0.3, y + h * 0.8, 2, 'rgba(200,220,230,0.14)');
      g.restore();
      for (var d = 0; d < 4; d++) circle(g, cx - w * 0.3 + d * w * 0.2, y + h + 8 + (d % 2) * 10, 2.2, 'rgba(180,200,210,0.6)');
    }
  }
  function rifleRack(g, q, x, y, w, h) {
    if (q.light >= 1) softRect(g, x + 6, y + 8, w, h, 8, 0.4);
    g.beginPath(); g.rect(x, y, w, 26); texFill(g, q, '#5a3a20', TX.keyakiH); g.beginPath(); g.rect(x, y + h - 26, w, 26); texFill(g, q, '#5a3a20', TX.keyakiH);
    for (var p = 0; p < 3; p++) { var px = x + 30 + p * (w - 60) / 2; rect(g, px - 6, y + 22, 12, 30, '#4a2c18'); rect(g, px - 6, y + h - 52, 12, 30, '#4a2c18'); }
    // 枪套（帆布）
    g.fillStyle = K.lin(g, 0, y + 46, 0, y + 80, ['#6a6040', '#4a4228']); K.rr(g, x + 10, y + 50, w - 20, 30, 14); g.fill();
    seg(g, x + 40, y + 52, x + 40, y + 78, 2, '#2a2414'); seg(g, x + w - 60, y + 52, x + w - 60, y + 78, 2, '#2a2414');
    // 猎枪
    g.fillStyle = K.lin(g, 0, y + h - 70, 0, y + h - 50, ['#6a3a1a', '#3a1e0a']);
    g.beginPath(); g.moveTo(x + 16, y + h - 60); g.lineTo(x + 100, y + h - 66); g.lineTo(x + 130, y + h - 58); g.lineTo(x + 104, y + h - 48); g.lineTo(x + 20, y + h - 44); g.closePath(); g.fill();
    g.fillStyle = metalGrad(g, 0, y + h - 68, 0, y + h - 58, '#3a3a42'); g.fillRect(x + 120, y + h - 68, w - 140, 9);
    if (q.light >= 2) seg(g, x + 122, y + h - 67, x + w - 22, y + h - 67, 1.2, 'rgba(220,230,250,0.4)');
    // 子弹带
    if (q.model >= 1) { g.beginPath(); g.moveTo(x + 40, y + 26); g.quadraticCurveTo(x + w / 2, y + 60, x + w - 40, y + 26); stroke(g, 8, '#5a4a2a'); for (var b = 0; b < 8; b++) { var t = b / 7, bx = lerp(x + 52, x + w - 52, t), byy = y + 26 + Math.sin(t * PI) * 24; rect(g, bx - 3, byy - 8, 6, 12, '#b08a48'); } }
  }
  function pelt(g, q, cx, cy, s, col) {
    g.save(); g.translate(cx, cy); g.scale(s, s);
    K.path(g, 'M0 -70 C20 -72 34 -60 40 -44 L70 -60 L66 -36 C80 -20 84 10 78 34 L100 56 L72 62 C60 80 30 92 0 94 C-30 92 -60 80 -72 62 L-100 56 L-78 34 C-84 10 -80 -20 -66 -36 L-70 -60 L-40 -44 C-34 -60 -20 -72 0 -70 Z');
    g.fillStyle = K.rad(g, 0, 0, 10, 110, [K.shade(col, 0.2), col, K.shade(col, -0.5)]); g.fill();
    if (q.model >= 1) { var r = K.rng(cx | 0); g.strokeStyle = K.rgba(K.shade(col, -0.6), 0.5); g.lineWidth = 1.2; for (var i = 0; i < 40; i++) { var a = r() * TAU, rr = r() * 80; g.beginPath(); g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); g.lineTo(Math.cos(a) * rr + 3, Math.sin(a) * rr + 8); g.stroke(); } }
    g.restore();
    circle(g, cx, cy - 66 * s, 4, '#2a2a2e');
  }
  function woodStove(g, q, R, x, y, w, by) {
    var cx = x + w / 2, top = y + 40;
    if (q.light >= 1) K.contact(g, cx, by, w * 0.6, 10, 0.7);
    g.fillStyle = cylGrad(g, cx - 20, 40, '#2a2a2e'); g.fillRect(cx - 20, -10, 40, top + 10);
    if (q.model >= 1) rect(g, cx - 24, 130, 48, 10, '#3a3a40');
    box(g, q, R, x, top, w, by - top - 24, 0.9, { col: '#22222a', t: TX.iron, frontLo: 0.3 });
    for (var l = 0; l < 2; l++) rect(g, x + 10 + l * (w - 34), by - 26, 14, 26, '#1a1a1e');
    var dx = x + w * 0.22, dw = w * 0.56, dy = top + 30, dh = (by - top - 24) * 0.55;
    rect(g, dx, dy, dw, dh, '#141414'); g.strokeStyle = '#4a4a52'; g.lineWidth = 4; g.strokeRect(dx, dy, dw, dh);
    rect(g, dx + 8, dy + 8, dw - 16, dh - 16, '#3a1a08');
    for (var gI = 1; gI < 4; gI++) rect(g, dx + 8, dy + 8 + (dh - 16) * gI / 4, dw - 16, 3, '#1a1a1e');
    rect(g, dx + dw + 6, dy + dh / 2 - 4, 14, 8, '#8a8a92');
    // 顶上的铝壶
    g.fillStyle = metalGrad(g, cx - 36, 0, cx + 36, 0, '#b8b8c0'); g.beginPath(); g.moveTo(cx - 36, top); g.quadraticCurveTo(cx - 38, top - 40, cx, top - 44); g.quadraticCurveTo(cx + 38, top - 40, cx + 36, top); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + 30, top - 18); g.quadraticCurveTo(cx + 56, top - 24, cx + 60, top - 42); stroke(g, 6, '#9a9aa2');
    return { fire: [dx + 8, dy + 8, dw - 16, dh - 16], spout: [cx + 60, top - 44] };
  }
  function drawKumagai(g, q) {
    setKey(-0.1);
    var R = Room(960, 520, 770, 70, 1300);
    // 天花：椽
    rect(g, 0, 0, W, 70, '#1a120c');
    for (var rf = -8; rf < 16; rf++) { var X = rf * 120, t = -70 / (70 - R.vy); fillP(g, [X - 8, 70, X + 8, 70, X + 8 + (X - R.vx) * t, 0, X - 8 + (X - R.vx) * t, 0], '#2a1a10'); }
    // 板墙
    g.beginPath(); g.rect(0, 70, W, R.base - 70); texFill(g, q, '#3a2818', TX.board);
    g.fillStyle = K.lin(g, 0, 70, 0, R.base, [lo(0.45), lo(0.1), lo(0.25)]); g.fillRect(0, 70, W, R.base - 70);
    beam(g, q, 0, 70, W, 34, { col: '#1e140c', t: TX.soot });
    post(g, q, 340, 70, 34, R.base - 70, { col: '#2a1a10' }); post(g, q, 1360, 70, 34, R.base - 70, { col: '#2a1a10' });
    // 前门（左，厚板拉门，门下漏雪）
    var fdx = 70, fdw = 230, fdy = 268;
    g.beginPath(); g.rect(fdx - 14, fdy - 14, fdw + 28, R.base - fdy + 14); texFill(g, q, '#2a1a10', TX.sugi);
    g.beginPath(); g.rect(fdx, fdy, fdw, R.base - fdy); texFill(g, q, '#4a3420', TX.board);
    for (var cr = 0; cr < 3; cr++) rect(g, fdx, fdy + 40 + cr * 160, fdw, 16, '#2a1a10');
    rect(g, fdx + fdw - 30, fdy + 230, 14, 50, '#1a1a1e');
    if (q.model >= 1) { K.ellipse(g, fdx + fdw / 2, R.base + 6, fdw * 0.45, 10); g.fillStyle = 'rgba(230,236,246,0.8)'; g.fill(); }
    // 胴长（挂着、还湿）
    waders(g, q, 390, 244, 180, 430, true);
    // 枪架
    rifleRack(g, q, 644, 204, 312, 168);
    // 兽皮
    pelt(g, q, 1110, 300, 1.2, '#3a2a1e'); pelt(g, q, 1270, 330, 0.6, '#8a5a2a');
    // 雪踏（かんじき）+ 绳
    if (q.model >= 1) {
      for (var sk = 0; sk < 2; sk++) { K.ellipse(g, 1420 + sk * 50, 220, 26, 44); stroke(g, 5, '#6a4a28'); seg(g, 1400 + sk * 50, 210, 1440 + sk * 50, 230, 2, '#8a6a40'); }
      g.beginPath(); for (var lp = 0; lp < 4; lp++) { g.moveTo(600, 420 + lp * 4); g.quadraticCurveTo(560, 500 + lp * 6, 610, 520 + lp * 4); } stroke(g, 3, '#8a7a50');
      // 山神的神棚
      box(g, q, R, 1520, 150, 160, 12, 0.95, { col: '#6a5030', t: TX.hinokiH }); fillP(g, [1560, 150, 1640, 150, 1630, 120, 1570, 120], '#8a7048'); g.fillStyle = cylGrad(g, 1650, 14, '#e8e4dc'); g.fillRect(1650, 126, 14, 24);
    }
    // 后门（右）
    var bdx = 1444, bdw = 232, bdy = 284;
    g.beginPath(); g.rect(bdx - 14, bdy - 14, bdw + 28, R.base - bdy + 14); texFill(g, q, '#2a1a10', TX.sugi);
    rect(g, bdx, bdy, bdw, R.base - bdy, '#141010');
    g.save(); g.beginPath(); g.rect(bdx + bdw * 0.7, bdy, bdw * 0.3, R.base - bdy); g.clip(); snowView(g, q, bdx + bdw * 0.7, bdy, bdw * 0.3, R.base - bdy, { seed: 291, horizon: 0.4 }); g.restore();
    g.beginPath(); g.rect(bdx, bdy, bdw * 0.72, R.base - bdy); texFill(g, q, '#4a3420', TX.board);
    for (var cr2 = 0; cr2 < 3; cr2++) rect(g, bdx, bdy + 40 + cr2 * 150, bdw * 0.72, 14, '#2a1a10');
    // 地面（土间 + 草席）
    tileFloor(g, q, R, { tile: 170, col: '#3a322c', t: TX.tataki, mortar: '#2a2420', gap: 0.8, seed: 293, var: 0.05, bevel: false });
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 40, 30, 0.5, 't');
    var mat = FQ(R, 520, 1220, 1.08, 1.7), mq = mat.q(0, 1, 0, 1);
    K.poly(g, mq); texFill(g, q, '#8a7a4a', TX.straw); K.poly(g, mq); g.fillStyle = K.lin(g, 0, mq[1], 0, mq[5], [lo(0.3), lo(0.05)]); g.fill();
    // 后门前：通往溪水的石阶（川端）与冒热气的汤川
    var stx = 1400;
    fillP(g, [stx, 812, W + 10, 812, W + 10, H + 10, stx - 40, H + 10], '#1a1a1e');
    var steps = 4;
    for (var s = 0; s < steps; s++) {
      var sy = 812 + s * 46, sx0 = stx + s * 70, sx1 = W + 10;
      fillP(g, [sx0, sy, sx1, sy, sx1, sy + 16, sx0 - 6, sy + 16], K.mix('#a8a8b0', '#5a5a62', s * 0.2));
      K.poly(g, [sx0, sy, sx1, sy, sx1, sy + 16, sx0 - 6, sy + 16]); texFill(g, q, '#7a7a82', TX.stoneF, 0, 0, 1, 1, 0.5);
      fillP(g, [sx0 - 6, sy + 16, sx1, sy + 16, sx1, sy + 46, sx0 - 6, sy + 46], K.mix('#6a6a72', '#2a2a32', s * 0.2));
      rect(g, sx0, sy, sx1 - sx0, 2, hi(0.3));
    }
    // 水面
    var wy = 980;
    K.poly(g, [1640, wy, W + 10, wy - 20, W + 10, H + 10, 1600, H + 10]); g.fillStyle = K.lin(g, 0, wy, 0, H, ['#6a9098', '#3a5258']); g.fill();
    if (q.model >= 1) { var rw = K.rng(295); for (var rp = 0; rp < 10; rp++) { var rx = 1660 + rw() * 260, ry = wy + 10 + rw() * 80; seg(g, rx, ry, rx + 20 + rw() * 30, ry - 2, 1.5, 'rgba(200,230,230,0.35)'); } ell(g, 1760, H - 30, 60, 10, 'rgba(240,240,236,0.35)'); }
    // 柴火堆
    if (q.model >= 1) for (var lg = 0; lg < 7; lg++) { var lx = 520 + (lg % 4) * 34, ly = 820 - Math.floor(lg / 4) * 30; g.fillStyle = K.lin(g, 0, ly - 14, 0, ly + 14, ['#8a6a40', '#4a3420']); K.rr(g, lx - 40, ly - 14, 80, 28, 12); g.fill(); ell(g, lx + 40, ly, 8, 13, '#c8a070'); }
    // 柴炉
    var ST = woodStove(g, q, R, 690, 656, 264, 858);
    // 裸灯泡
    bareBulb(g, q, 1000, 150);
    // ---- 光照 ----
    var Lm = [
      { x: 1000, y: 220, r: 760, ry: 560, c: '#ffc070', i: 0.45, fall: 0.3 },
      { x: 822, y: 760, r: 560, ry: 300, c: '#ff8a40', i: 0.55, fall: 0.3 },
      { x: 1640, y: 560, r: 300, ry: 420, c: '#b8c8e8', i: 0.4 },
      { x: 1780, y: 960, r: 300, ry: 140, c: '#a8c0d8', i: 0.3, q: 1 },
      { x: 185, y: 760, r: 200, ry: 90, c: '#b8c8e8', i: 0.25, q: 1 }
    ];
    Lm.push({ x: 480, y: 460, r: 300, ry: 420, c: '#ffb070', i: 0.3, q: 1 }, { x: 1560, y: 900, r: 360, ry: 200, c: '#c0d0e8', i: 0.35 });
    lightMap(g, q, '#423e4a', Lm);
    g.save(); g.globalCompositeOperation = 'lighter'; var f = ST.fire;
    g.fillStyle = K.lin(g, 0, f[1], 0, f[1] + f[3], ['rgba(255,110,30,0.25)', 'rgba(255,190,80,0.8)']); g.fillRect(f[0], f[1], f[2], f[3]); g.restore();
    if (q.light >= 1) K.glow(g, f[0] + f[2] / 2, f[1] + f[3] / 2, 200, '#ff8a3a', 0.35);
    bulbGlow(g, q, 1000, 150, 160, 0.35);
    steam(g, q, ST.spout[0], ST.spout[1], 110, 0.25, 297);
    steam(g, q, 1780, 1060, 260, 0.3, 299); steam(g, q, 1880, 1080, 220, 0.25, 301);
    if (q.light >= 2) K.motes(g, K.rng(303), 40, 600, 200, 600, 600, '#ffd8a0', 0.25);
    finish(g, q, { vig: 0.6 });
  }
  DM.HDBG.def('kumagai_hut', {
    draw: function (g, q) { drawKumagai(g, q); },
    lights: [LT(822, 760, 200, '#ff8a40', 0.65, 0.45, 'fire'), LT(1000, 160, 200, '#ffc070', 0.5, 0.05, 'lamp'), LT(1640, 560, 160, '#b8c8e8', 0.35, 0, 'window')],
    key: { x: -0.1, color: '#ffb880', amb: '#2e2c38', rim: 0.45 },
    outdoor: false
  });


  /* ================================================================
   * 白峰本宅·大广间 shiramine_hall
   * ================================================================ */
  function butsudan(g, q, R, x, y, w, by) {
    var kd = 0.9, a = R.p(x, y, kd), b = R.p(x + w, by, kd);
    rect(g, x, y, w, by - y, '#0e0a08');
    fillP(g, [x, y, a[0], a[1], a[0], b[1], x, by], '#2a1e14'); fillP(g, [x + w, y, x + w, by, b[0], b[1], b[0], a[1]], '#1e140c');
    // 佛坛本体（黑漆 + 金）
    var bx = a[0] + 10, bw = b[0] - a[0] - 20, bt = a[1] + 10, bb = b[1] - 6;
    g.fillStyle = K.lin(g, bx, 0, bx + bw, 0, ['#141010', '#2a2220', '#0c0a0a']); g.fillRect(bx, bt, bw, bb - bt);
    var ix = bx + bw * 0.14, iw = bw * 0.72, it = bt + 30, ib = bb - (bb - bt) * 0.3;
    g.fillStyle = K.lin(g, 0, it, 0, ib, ['#6a4a1a', '#b88a3a', '#7a5420']); g.fillRect(ix, it, iw, ib - it);
    if (q.model >= 1) { // 宫殿式屋根 + 层台
      fillP(g, [ix + iw * 0.2, it + 40, ix + iw * 0.8, it + 40, ix + iw * 0.66, it + 10, ix + iw * 0.34, it + 10], '#3a2a10');
      for (var tr = 0; tr < 3; tr++) { var ty = it + (ib - it) * (0.45 + tr * 0.18); rect(g, ix + 6, ty, iw - 12, 8, '#c9a25a'); rect(g, ix + 6, ty + 8, iw - 12, 3, lo(0.4)); }
      for (var ih = 0; ih < 3; ih++) { var hx = ix + iw * (0.3 + ih * 0.2); rect(g, hx - 8, it + (ib - it) * 0.45 - 46, 16, 46, '#141010'); rect(g, hx - 6, it + (ib - it) * 0.45 - 40, 12, 3, '#c9a25a'); }
      circle(g, ix + iw / 2, it + (ib - it) * 0.3, 14, '#e8c870');
    }
    // 门扇（打开，金漆格子）
    for (var d = 0; d < 2; d++) {
      var dx = d ? ix + iw : bx, dw = ix - bx;
      g.fillStyle = K.lin(g, dx, 0, dx + dw, 0, ['#1a1410', '#3a2a18']); g.fillRect(dx, it - 10, dw, ib - it + 20);
      for (var lg = 1; lg < 4; lg++) rect(g, dx + 3, it - 10 + (ib - it + 20) * lg / 4, dw - 6, 3, '#a8823e');
    }
    // 下段：香炉、烛台、花、供品
    var sh = ib + 10;
    rect(g, bx + 6, sh, bw - 12, 10, '#c9a25a');
    var cx = bx + bw / 2;
    g.fillStyle = metalGrad(g, cx - 22, 0, cx + 22, 0, '#8a6a32'); K.ellipse(g, cx, sh - 12, 22, 14); g.fill();
    for (var ic = -1; ic <= 1; ic++) seg(g, cx + ic * 5, sh - 22, cx + ic * 6, sh - 60, 1.5, '#a8603a');
    var cands = [cx - bw * 0.3, cx + bw * 0.3];
    for (var c = 0; c < 2; c++) { g.fillStyle = metalGrad(g, cands[c] - 6, 0, cands[c] + 6, 0, '#a8823e'); g.fillRect(cands[c] - 4, sh - 40, 8, 40); rect(g, cands[c] - 4, sh - 70, 8, 30, '#f0e6d0'); }
    if (q.model >= 1) { for (var fl = 0; fl < 2; fl++) { var fx = cx + (fl ? 1 : -1) * bw * 0.16; g.fillStyle = cylGrad(g, fx - 8, 16, '#8a6a32'); g.fillRect(fx - 8, sh - 34, 16, 34); for (var p = 0; p < 4; p++) circle(g, fx - 10 + p * 7, sh - 44 - (p % 2) * 10, 6, p % 2 ? '#e8e0f0' : '#f0d040'); } ell(g, cx, sh + 30, 30, 8, '#d8d0c0'); for (var o = 0; o < 3; o++) circle(g, cx - 12 + o * 12, sh + 22, 9, '#e87830'); }
    // 鉦（铜钵）
    g.fillStyle = metalGrad(g, bx + 20, 0, bx + 56, 0, '#b08a48'); K.ellipse(g, bx + 38, bb - 12, 18, 10); g.fill();
    return { candles: [[cands[0], sh - 72], [cands[1], sh - 72]] };
  }
  // 階段箪笥（楼梯柜）：向左上升
  function stairChest(g, q, R, x0, x1, top, by) {
    var n = 7, stepW = (x1 - x0) / n, stepH = (by - top) / n, k = 0.88;
    for (var i = 0; i < n; i++) {
      var sx = x1 - (i + 1) * stepW, sy = by - (i + 1) * stepH;
      var b = box(g, q, R, sx, sy, stepW + 1, by - sy, k, { col: '#4a2a14', t: TX.keyaki, topHi: 0.3 });
      void b;
      if (q.model >= 1 && i < n - 1) {
        var dh = Math.min(stepH * 0.8, 70);
        for (var dI = 0; dI < Math.floor((by - sy) / (dh + 10)); dI++) {
          var dy = by - 14 - (dI + 1) * (dh + 10);
          if (dy < sy + 10) break;
          groove(g, sx + 8, dy, stepW - 16, dh, 2.5, 0.45);
          g.fillStyle = metalGrad(g, sx + stepW / 2 - 12, 0, sx + stepW / 2 + 12, 0, '#2a2a2e'); g.fillRect(sx + stepW / 2 - 12, dy + dh / 2 - 3, 24, 6);
        }
      }
    }
    // 楼梯口（天花板开口）
    fillP(g, [x0 - 30, 0, x0 + stepW * 2.2, 0, x0 + stepW * 2.2, top - 10, x0 - 30, top - 10], '#0c0806');
    g.fillStyle = K.lin(g, 0, 0, 0, top, ['#000000', 'rgba(40,30,20,0.6)']); g.fillRect(x0 - 30, 0, stepW * 2.2 + 30, top - 10);
    seg(g, x0 - 30, top - 10, x0 + stepW * 2.2, top - 10, 8, '#2a1a0c');
  }
  // 祖先遗影（挂在长押上，微微前倾）
  function ancestorPhotos(g, q, x, y, w, h, n) {
    var pw = (w - (n - 1) * 20) / n;
    for (var i = 0; i < n; i++) {
      var px = x + i * (pw + 20), lean = 8;
      if (q.light >= 1) softRect(g, px + 4, y + 10, pw, h, 6, 0.45);
      fillP(g, [px - lean, y, px + pw + lean, y, px + pw, y + h, px, y + h], '#141010');
      var ix = px + 10, iw = pw - 20, iy = y + 10, ih = h - 20;
      g.fillStyle = K.lin(g, 0, iy, 0, iy + ih, ['#8a8478', '#5a554c']); g.fillRect(ix, iy, iw, ih);
      // 人像（黑白）
      ell(g, ix + iw / 2, iy + ih * 0.4, iw * 0.18, ih * 0.16, '#c8c0b0');
      ell(g, ix + iw / 2, iy + ih * 0.3, iw * 0.2, ih * 0.08, i % 2 ? '#2a2a2a' : '#8a8a86');
      g.beginPath(); g.moveTo(ix + iw * 0.15, iy + ih); g.quadraticCurveTo(ix + iw * 0.2, iy + ih * 0.58, ix + iw / 2, iy + ih * 0.58); g.quadraticCurveTo(ix + iw * 0.8, iy + ih * 0.58, ix + iw * 0.85, iy + ih); g.fillStyle = '#26241e'; g.fill();
      fillP(g, [ix + iw * 0.42, iy + ih * 0.6, ix + iw * 0.58, iy + ih * 0.6, ix + iw / 2, iy + ih * 0.78], '#e0d8c8');
      g.fillStyle = 'rgba(40,30,10,0.18)'; g.fillRect(ix, iy, iw, ih);
      if (i === n - 1) { rect(g, ix, iy, iw, 10, '#141010'); seg(g, ix, iy + 4, ix + iw, iy + 4, 3, '#141010'); }   // 黑丝带
      if (q.light >= 2) { g.save(); g.globalCompositeOperation = 'lighter'; fillP(g, [ix, iy + ih, ix + iw * 0.3, iy + ih, ix + iw * 0.6, iy, ix + iw * 0.3, iy], 'rgba(220,226,240,0.08)'); g.restore(); }
    }
  }
  // 旧文书堆
  function documents(g, q, R, x, w, by, d0) {
    var rnd = K.rng(311), F = FQ(R, Xat(R, x, R.dAt(by)), Xat(R, x + w, R.dAt(by)), R.dAt(by) * 0.88, R.dAt(by));
    // 桐箱
    var items = [[0.08, 0.3, 'box', 70], [0.3, 0.55, 'pile', 60], [0.55, 0.7, 'box', 90], [0.72, 0.95, 'pile', 40]];
    for (var i = 0; i < items.length; i++) {
      var it = items[i], fq = F.q(it[0], it[1], 0.2, 0.9), bx = fq[6], bw = fq[4] - fq[6], bb = fq[7], hh = it[3];
      if (q.light >= 1) K.contact(g, bx + bw / 2, bb, bw * 0.6, 8, 0.55);
      if (it[2] === 'box') {
        box(g, q, R, bx, bb - hh, bw, hh, 0.93, { col: '#c8b490', t: TX.hinoki, topHi: 0.2 });
        if (q.model >= 1) { seg(g, bx + bw / 2, bb - hh, bx + bw / 2, bb, 3, '#6a2a1a'); K.text(g, '文書', bx + bw * 0.3, bb - hh * 0.5, 14, 'rgba(40,24,10,0.6)', { weight: 'bold' }); }
      } else {
        var yy = bb;
        for (var p = 0; p < M(q, 3, 5, 7); p++) { var ph = 8 + rnd() * 10, off = (rnd() - 0.5) * 16; g.fillStyle = K.lin(g, 0, yy - ph, 0, yy, ['#e8dcc0', '#b8a888']); g.fillRect(bx + off, yy - ph, bw, ph); rect(g, bx + off, yy - ph, bw, 1.2, 'rgba(90,70,40,0.5)'); yy -= ph; }
        seg(g, bx + bw * 0.5, yy, bx + bw * 0.5, bb, 2, '#5a3a1a');
      }
    }
    // 散落的纸与卷轴
    if (q.model >= 1) {
      var sp = F.q(0.2, 0.42, 0.85, 1.05); fillP(g, sp, '#efe6d0'); for (var l = 0; l < 4; l++) seg(g, lerp(sp[6], sp[4], 0.15), lerp(sp[1], sp[7], 0.2 + l * 0.18), lerp(sp[6], sp[4], 0.85), lerp(sp[1], sp[7], 0.2 + l * 0.18), 0.8, 'rgba(30,24,20,0.5)');
      var sc = F.p(0.8, 1.0); g.save(); g.translate(sc[0], sc[1]); g.rotate(-0.1); g.fillStyle = cylGrad(g, -60, 120, '#d8c8a0'); g.fillRect(-60, -10, 120, 20); g.restore();
    }
    void d0;
  }
  function glassBookcase(g, q, R, x, y, w, by) {
    if (q.light >= 1) K.contact(g, x + w / 2, by, w * 0.6, 10, 0.6);
    box(g, q, R, x, y, w, by - y, R.kWall(by), { col: '#3a2010', t: TX.keyaki });
    var ix = x + 16, iw = w - 32, iy = y + 20, ih = (by - y) * 0.7, rows = 4, rnd = K.rng(313);
    rect(g, ix, iy, iw, ih, '#140c08');
    for (var r = 0; r < rows; r++) {
      var sy = iy + r * ih / rows, fl = sy + ih / rows - 4, bx = ix + 4;
      while (bx < ix + iw - 10) {
        var bw = 10 + rnd() * 16, bh = ih / rows * (0.55 + rnd() * 0.35), c = rnd.pick(['#5a4a3a', '#2a2a4a', '#4a2a1a', '#6a5a3a', '#e0d4b4', '#3a3a2a']);
        if (rnd() < 0.25) { var sh2 = 8 + rnd() * 8; for (var st = 0; st < 3; st++) rect(g, bx, fl - (st + 1) * sh2, 50, sh2 - 1, rnd.pick(['#d8c8a0', '#c8b890'])); bx += 56; continue; }
        g.fillStyle = cylGrad(g, bx, bw, c); g.fillRect(bx, fl - bh, bw, bh); if (q.model >= 1) rect(g, bx + 2, fl - bh * 0.8, bw - 4, bh * 0.2, 'rgba(240,230,200,0.5)');
        bx += bw + 1;
      }
      rect(g, ix, fl, iw, 4, '#4a2a14');
    }
    for (var dI = 0; dI < 2; dI++) { var gx = ix + dI * iw / 2; g.fillStyle = K.lin(g, gx, iy, gx + iw / 2, iy + ih, ['rgba(200,215,235,0.16)', 'rgba(0,0,0,0)', 'rgba(200,215,235,0.1)']); g.fillRect(gx, iy, iw / 2, ih); g.strokeStyle = '#3a2010'; g.lineWidth = 5; g.strokeRect(gx, iy, iw / 2, ih); }
    groove(g, ix, iy + ih + 14, iw / 2 - 6, by - iy - ih - 30, 3, 0.45); groove(g, ix + iw / 2 + 6, iy + ih + 14, iw / 2 - 6, by - iy - ih - 30, 3, 0.45);
  }
  // 圆形荧光吊灯（2003 年的和室常见）
  function ringLamp(g, q, x, y, w) {
    seg(g, x, 0, x, y - 10, 2, '#1a1a1e');
    g.fillStyle = K.lin(g, x - w / 2, 0, x + w / 2, 0, ['#a89878', '#e8dcc0', '#a89878']);
    g.beginPath(); g.moveTo(x - w * 0.3, y); g.lineTo(x + w * 0.3, y); g.lineTo(x + w / 2, y + w * 0.22); g.lineTo(x - w / 2, y + w * 0.22); g.closePath(); g.fill();
    seg(g, x - w / 2, y + w * 0.22, x + w / 2, y + w * 0.22, 4, '#5a4a30');
    K.ellipse(g, x, y + w * 0.23, w * 0.44, w * 0.05); g.fillStyle = '#f4f2ec'; g.fill();
    seg(g, x, y + w * 0.24, x, y + w * 0.42, 1, '#3a3a3e'); circle(g, x, y + w * 0.43, 3, '#d8c8a0');
    return { x: x, y: y + w * 0.23, w: w };
  }
  function ringGlow(g, q, Lp, c, a) {
    g.save(); g.globalCompositeOperation = 'lighter'; K.ellipse(g, Lp.x, Lp.y, Lp.w * 0.44, Lp.w * 0.05); g.fillStyle = K.rgba(c, a); g.fill(); g.restore();
    if (q.light >= 1) K.glow(g, Lp.x, Lp.y, Lp.w * 1.6, c, 0.3);
  }
  function drawShiraHall(g, q) {
    setKey(0.2);
    var R = Room(960, 520, 720, 0, 1400), kam = 290;
    earthWall(g, q, 0, 0, W, R.base, { col: '#9a8460', t: TX.tsuchi, age: 0.4 });
    beam(g, q, 0, 236, W, 30, { col: '#3a2414', t: TX.keyakiH });
    beam(g, q, 0, kam - 22, W, 22, { col: '#3a2414' });
    // 佛间
    var BD = butsudan(g, q, R, 84, 246, 296, R.base);
    // 楼梯柜
    stairChest(g, q, R, 440, 650, 262, R.base + 70);
    // 正面：襖（松与鹤）
    for (var fI = 0; fI < 4; fI++) fusuma(g, q, 690 + fI * 160, kam, 160, R.base - kam, {
      col: '#d4c49a', handleLeft: fI % 2 === 1, metal: '#8a6a32',
      art: function (g2, q2, x, y, w, h) {
        var gx = x - fI * w, GW = w * 4;
        g2.fillStyle = 'rgba(200,160,70,0.2)'; g2.fillRect(x, y, w, h * 0.12); g2.fillRect(x, y + h * 0.88, w, h * 0.12);
        inkMountains(g2, q2, gx, y + h * 0.1, GW, h * 0.8, 71);
        g2.strokeStyle = 'rgba(40,30,20,0.55)'; g2.lineWidth = 7; g2.beginPath(); g2.moveTo(gx + GW * 0.55, y + h); g2.bezierCurveTo(gx + GW * 0.6, y + h * 0.6, gx + GW * 0.7, y + h * 0.4, gx + GW * 0.9, y + h * 0.3); g2.stroke();
        for (var nd = 0; nd < 6; nd++) { K.ellipse(g2, gx + GW * (0.62 + nd * 0.05), y + h * (0.48 - nd * 0.03), GW * 0.04, h * 0.03); g2.fillStyle = 'rgba(30,50,34,0.45)'; g2.fill(); }
        // 鹤
        var kx = gx + GW * 0.3, ky = y + h * 0.35; g2.fillStyle = 'rgba(250,248,240,0.85)'; K.ellipse(g2, kx, ky, 26, 10); g2.fill();
        g2.beginPath(); g2.moveTo(kx - 20, ky); g2.quadraticCurveTo(kx - 60, ky - 40, kx - 100, ky - 30); g2.quadraticCurveTo(kx - 50, ky - 10, kx - 20, ky + 4); g2.fill();
        g2.beginPath(); g2.moveTo(kx + 20, ky - 4); g2.quadraticCurveTo(kx + 34, ky - 30, kx + 44, ky - 34); stroke(g2, 3, 'rgba(250,248,240,0.85)'); circle(g2, kx + 45, ky - 35, 4, '#c02020');
      }
    });
    // 遗影
    ancestorPhotos(g, q, 768, 98, 424, 136, 4);
    // 柱
    var posts = [60, 384, 676, 1330, 1880];
    for (var pI = 0; pI < posts.length; pI++) post(g, q, posts[pI], 0, 30, R.base, {});
    // 书柜
    glassBookcase(g, q, R, 1364, 236, 472, R.base + 4);
    // 榻榻米
    tatamiFloor(g, q, R, { u: 270, seed: 315, t: TX.tatamiO, col: '#9a8a58', x0: 120 });
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 30, 24, 0.4, 't');
    // 文书
    documents(g, q, R, 764, 472, 872);
    // 座布团 + 矮桌（右前）
    if (q.model >= 1) { zabuton(g, q, R, 1420, 1.25, 170, { col: '#3a2a4a' }); lowTable(g, q, R, 1380, 760, 360, 846, { k: 0.82 }); teaSet(g, q, 1520, 752, 0.9); }
    var LP = ringLamp(g, q, 960, 30, 220);
    // ---- 光照 ----
    var Lm = [
      { lin: [0, 0, W, 0], stops: [[0, 'rgba(70,60,50,0.15)'], [1, 'rgba(90,100,120,0.2)']] },
      { x: 960, y: 260, r: 980, ry: 700, c: '#f0ecd8', i: 0.55, fall: 0.3 },
      { x: 960, y: 820, r: 700, ry: 200, c: '#ece4d0', i: 0.25, q: 1 },
      { x: 232, y: 560, r: 220, ry: 220, c: '#ffb860', i: 0.4, q: 1 },
      { x: 1900, y: 500, r: 380, ry: 560, c: '#b8c8e8', i: 0.35 }
    ];
    lightMap(g, q, '#403c48', Lm);
    ringGlow(g, q, LP, '#f8f4e8', 0.8);
    for (var cI = 0; cI < 2; cI++) K.flame(g, q, BD.candles[cI][0], BD.candles[cI][1], 12, { glow: 4 });
    if (q.light >= 2) { g.save(); g.globalCompositeOperation = 'screen'; K.blob(g, 232, 380, 90, '#c8c0b8', 0.1); g.restore(); K.motes(g, K.rng(317), 40, 600, 200, 700, 600, '#f0e8d8', 0.25); }
    finish(g, q, { vig: 0.5 });
  }
  DM.HDBG.def('shiramine_hall', {
    draw: function (g, q) { drawShiraHall(g, q); },
    lights: [LT(960, 80, 300, '#f0ecd8', 0.55, 0.02, 'lamp'), LT(180, 600, 60, '#ffb860', 0.45, 0.35, 'candle'), LT(284, 600, 60, '#ffb860', 0.45, 0.35, 'candle')],
    key: { x: 0.2, color: '#ece8dc', amb: '#363444', rim: 0.4 },
    outdoor: false
  });

  /* ================================================================
   * 本宅二楼·客房（四方田的房间）shiramine_2f
   * ================================================================ */
  // 俯视：窗下本宅一楼的庇（带雪止）、窄缝、离屋侧墙与屋顶
  function lookDown(g, q, x, y, w, h) {
    var rnd = K.rng(321);
    // 远处树林
    for (var t = 0; t < M(q, 5, 8, 12); t++) { var tx = x + (t + rnd() * 0.5) * w / M(q, 5, 8, 12), th = h * (0.1 + rnd() * 0.08); g.beginPath(); g.moveTo(tx, y + h * 0.06); g.lineTo(tx + th * 0.35, y + h * 0.06 + th); g.lineTo(tx - th * 0.35, y + h * 0.06 + th); g.closePath(); g.fillStyle = '#6a7888'; g.fill(); K.ellipse(g, tx, y + h * 0.06 + th * 0.5, th * 0.2, th * 0.06); g.fillStyle = '#eef2f8'; g.fill(); }
    // 离屋屋顶（厚雪）
    var r0 = y + h * 0.2, r1 = y + h * 0.46;
    fillP(g, [x - 5, r0 + 20, x + w + 5, r0, x + w + 5, r1, x - 5, r1 + 6], '#e8eef6');
    g.fillStyle = K.lin(g, 0, r0, 0, r1, ['#f6f9fd', '#d0dae8']); K.poly(g, [x - 5, r0 + 20, x + w + 5, r0, x + w + 5, r1, x - 5, r1 + 6]); g.fill();
    g.beginPath(); g.moveTo(x - 5, r1 + 6); g.quadraticCurveTo(x + w * 0.5, r1 + 20, x + w + 5, r1); g.lineTo(x + w + 5, r1 + 10); g.quadraticCurveTo(x + w * 0.5, r1 + 30, x - 5, r1 + 16); g.closePath(); g.fillStyle = '#c4cede'; g.fill();
    for (var ic = 0; ic < M(q, 4, 9, 14); ic++) { var ix = x + rnd() * w, il = 10 + rnd() * 30, iy = r1 + 14 + Math.sin((ix - x) / w * PI) * 8; fillP(g, [ix - 2.5, iy, ix + 2.5, iy, ix, iy + il], 'rgba(220,235,250,0.95)'); }
    // 离屋侧墙
    var w0 = r1 + 20, w1 = y + h * 0.78;
    g.beginPath(); g.rect(x, w0, w, w1 - w0); texFill(g, q, '#3a2e24', TX.board);
    g.fillStyle = K.lin(g, 0, w0, 0, w1, [lo(0.5), lo(0.15)]); g.fillRect(x, w0, w, w1 - w0);
    // 窄缝里的雪（远处的缝底）
    g.fillStyle = K.lin(g, 0, w1 - 10, 0, y + h, ['#aab4c8', '#dfe5ee']); g.fillRect(x, w1 - 6, w, y + h - w1 + 6);
    // 窗正下方：一楼的庇 + 雪止
    var e0 = y + h * 0.8;
    g.beginPath(); g.moveTo(x - 5, y + h + 5); g.lineTo(x - 5, e0 + 6); g.quadraticCurveTo(x + w * 0.4, e0 - 8, x + w + 5, e0 + 2); g.lineTo(x + w + 5, y + h + 5); g.closePath();
    g.fillStyle = K.lin(g, 0, e0, 0, y + h, ['#f8fbff', '#d8e0ec']); g.fill();
    g.beginPath(); g.moveTo(x - 5, e0 + 6); g.quadraticCurveTo(x + w * 0.4, e0 - 8, x + w + 5, e0 + 2); stroke(g, 3, 'rgba(160,176,200,0.6)');
    var nss = M(q, 6, 10, 14); for (var ss = 0; ss < nss; ss++) { var sx = x + (ss + 0.5) * w / nss, sy = e0 + 14 + Math.sin(ss) * 2; rect(g, sx - 2, sy - 10, 4, 14, '#3a3a42'); rect(g, sx - 6, sy - 12, 12, 3, '#4a4a52'); K.ellipse(g, sx, sy + 6, 9, 3); g.fillStyle = 'rgba(150,166,190,0.5)'; g.fill(); }
    seg(g, x, e0 + 4, x + w, e0 - 2, 1.5, 'rgba(60,64,72,0.5)');
    // 管口的淡淡热气（从庇下方升起）
    if (q.light >= 1) { g.save(); g.globalCompositeOperation = 'screen'; K.blob(g, x + w * 0.52, e0 - 12, w * 0.08, '#f0f4fa', 0.35); K.blob(g, x + w * 0.54, e0 - 36, w * 0.06, '#f0f4fa', 0.2); g.restore(); }
  }
  function bookPiles(g, q, R, x, w, by) {
    var rnd = K.rng(323), piles = M(q, 3, 4, 5);
    for (var p = 0; p < piles; p++) {
      var px = x + p * w / piles, pw = w / piles - 8, yy = by + (p % 2) * 18, hMax = 180 + rnd() * 220;
      if (q.light >= 1) K.contact(g, px + pw / 2, yy, pw * 0.6, 6, 0.55);
      var hh = 0;
      while (hh < hMax) { var bh = 10 + rnd() * 16, off = (rnd() - 0.5) * 14, c = rnd.pick(['#6a4a2a', '#2a3a5a', '#7a2a2a', '#d8c8a0', '#3a4a3a', '#5a5040']); g.fillStyle = K.lin(g, 0, yy - hh - bh, 0, yy - hh, [K.shade(c, 0.15), K.shade(c, -0.3)]); g.fillRect(px + off, yy - hh - bh, pw, bh); rect(g, px + off + pw - 6, yy - hh - bh, 6, bh, '#efe6d0'); hh += bh; }
    }
  }
  function writingDesk(g, q, R, x, y, w, by) {
    var b = lowTable(g, q, R, x, y, w, by, { k: 0.84, col: '#4a2c16' });
    var tp = function (u, v) { return R.p(x + w * u, y, 1 - 0.16 * v); };
    var pp = tp(0.4, 0.5);
    fillP(g, [pp[0] - 70, pp[1] + 6, pp[0] + 60, pp[1] + 6, pp[0] + 54, pp[1] - 8, pp[0] - 64, pp[1] - 8], '#efe6d0');
    if (q.model >= 1) {
      var nb = tp(0.72, 0.4); fillP(g, [nb[0] - 40, nb[1] + 4, nb[0] + 40, nb[1] + 4, nb[0] + 36, nb[1] - 8, nb[0] - 36, nb[1] - 8], '#7a2a2a');
      // 圆眼镜
      var gl = tp(0.22, 0.4); g.beginPath(); g.arc(gl[0] - 10, gl[1] - 2, 8, 0, TAU); g.moveTo(gl[0] + 16, gl[1] - 2); g.arc(gl[0] + 10, gl[1] - 2, 8, 0, TAU); stroke(g, 1.6, '#2a2a2e');
      var cu = tp(0.9, 0.5); g.fillStyle = cylGrad(g, cu[0] - 9, 18, '#5a4a3a'); g.fillRect(cu[0] - 9, cu[1] - 18, 18, 18);
    }
    // 台灯（鹅颈）
    var lx = x + w * 0.88, ly = y - 2;
    ell(g, lx, ly, 22, 5, '#2a2a2e'); g.beginPath(); g.moveTo(lx, ly); g.quadraticCurveTo(lx - 10, ly - 80, lx - 50, ly - 96); stroke(g, 4, '#3a3a40');
    g.beginPath(); g.moveTo(lx - 30, ly - 110); g.lineTo(lx - 72, ly - 108); g.lineTo(lx - 80, ly - 82); g.lineTo(lx - 20, ly - 84); g.closePath(); g.fillStyle = K.lin(g, lx - 80, 0, lx - 20, 0, ['#3a3a40', '#6a6a72', '#3a3a40']); g.fill();
    return { lamp: [lx - 50, ly - 82], b: b };
  }
  function leatherBag(g, q, x, y, w, h) {
    if (q.light >= 1) K.contact(g, x + w / 2, y + h, w * 0.55, 10, 0.65);
    g.fillStyle = K.lin(g, 0, y, 0, y + h, ['#6a4224', '#4a2c14', '#2a180a']); K.rr(g, x, y + h * 0.15, w, h * 0.85, 10); g.fill();
    g.fillStyle = K.lin(g, 0, y, 0, y + h * 0.4, ['#7a5030', '#5a3a1e']); K.rr(g, x - 4, y + h * 0.12, w + 8, h * 0.3, 8); g.fill();
    rect(g, x + w * 0.42, y + h * 0.3, w * 0.16, h * 0.18, '#b08a48');
    g.beginPath(); g.moveTo(x + w * 0.32, y + h * 0.14); g.quadraticCurveTo(x + w * 0.5, y - h * 0.25, x + w * 0.68, y + h * 0.14); stroke(g, 7, '#3a2210');
    if (q.light >= 1) { g.beginPath(); g.moveTo(x + 12, y + h * 0.2); g.lineTo(x + w - 12, y + h * 0.2); stroke(g, 2, 'rgba(255,220,180,0.2)'); }
  }
  function drawShira2F(g, q) {
    setKey(0.1);
    var R = Room(960, 520, 720, 20, 1400), kam = 132;
    rect(g, 0, 0, W, 20, '#5a4a36');
    earthWall(g, q, 0, 20, W, R.base - 20, { col: '#a08a66', t: TX.tsuchi, age: 0.3 });
    beam(g, q, 0, 20, W, 14, { col: '#3a2818', t: TX.hinokiH, sh: 10 });
    beam(g, q, 0, kam - 40, W, 24, { col: '#4a3420', t: TX.hinokiH });
    beam(g, q, 0, kam - 16, W, 16, { col: '#4a3420', t: TX.hinokiH });
    // 窗（俯视离屋）
    var Wn = jWindow(g, q, R, 714, 152, 492, 352, { seed: 325, rows: 3, view: lookDown, frost: true });
    // 壁橱
    oshiire(g, q, 1540, kam, 312, R.base, { col: '#cfc4a2' });
    // 左侧：低书架
    box(g, q, R, 80, 560, 240, R.base + 4 - 560, R.kWall(R.base + 4), { col: '#4a2c16', t: TX.keyaki });
    rect(g, 92, 576, 216, 70, '#140c08'); bookRow(g, q, 96, 642, 208, 60, K.rng(327));
    var posts = [60, 690, 1222, 1520, 1880];
    for (var pI = 0; pI < posts.length; pI++) post(g, q, posts[pI], 20, 26, R.base - 20, { col: '#5a3e24', t: TX.hinoki });
    tatamiFloor(g, q, R, { u: 300, seed: 329, x0: -40 });
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 30, 24, 0.4, 't');
    // 书堆
    bookPiles(g, q, R, 84, 220, 722);
    // 文机
    var DK = writingDesk(g, q, R, 340, 600, 380, 720);
    // 暖炉
    var HT = oilHeater(g, q, 1360, 840, 160, {});
    // 包
    leatherBag(g, q, 254, 800, 276, 130);
    var pd = paperPendant(g, q, 1040, 40, 110);
    // ---- 光照 ----
    var Lm = [
      { lin: [0, 0, W, 0], stops: [[0, 'rgba(70,60,50,0.15)'], [0.5, 'rgba(110,120,150,0.3)'], [1, 'rgba(70,60,50,0.15)']] },
      { x: 960, y: 320, r: 640, ry: 560, c: '#c8d4ee', i: 0.6, fall: 0.3 },
      { pts: [714, 504, 1206, 504, 1360, 1080, 560, 1080], c: '#b0c0e0', i: 0.3, fx0: 0, fy0: 504, fx1: 0, fy1: 1080, q: 1 },
      { x: 1040, y: 160, r: 700, ry: 520, c: '#ffd8a8', i: 0.35 },
      { x: DK.lamp[0], y: DK.lamp[1] + 60, r: 240, ry: 160, c: '#ffe0b0', i: 0.35, q: 1 },
      { x: 1360, y: 760, r: 240, ry: 180, c: '#ff9a50', i: 0.35, q: 1 }
    ];
    lightMap(g, q, '#46424e', Lm);
    windowGlow(g, q, Wn, 0.14);
    shaft(g, q, [724, 162, 1196, 162, 1340, 1000, 600, 1000], '#d8e2f8', 0.06, 0, 162, 0, 1000);
    heaterGlow(g, q, HT); steam(g, q, HT.spout[0], HT.spout[1], 110, 0.22, 331);
    pendantGlow(g, q, pd, 0.45);
    if (q.light >= 1) { g.save(); g.globalCompositeOperation = 'lighter'; fillP(g, [DK.lamp[0] - 30, DK.lamp[1], DK.lamp[0] + 30, DK.lamp[1], DK.lamp[0] + 40, DK.lamp[1] + 4, DK.lamp[0] - 40, DK.lamp[1] + 4], 'rgba(255,240,200,0.7)'); g.restore(); K.glow(g, DK.lamp[0], DK.lamp[1], 70, '#ffe0b0', 0.3); }
    if (q.light >= 2) K.motes(g, K.rng(333), 40, 740, 180, 460, 600, '#e8eeff', 0.3);
    finish(g, q, { vig: 0.5 });
  }
  DM.HDBG.def('shiramine_2f', {
    draw: function (g, q) { drawShira2F(g, q); },
    lights: [LT(960, 320, 240, '#c8d4ee', 0.5, 0, 'window'), LT(1040, 90, 200, '#ffd8a8', 0.45, 0.02, 'lamp'), LT(1360, 740, 90, '#ff9a50', 0.4, 0.15, 'fire'), LT(620, 520, 70, '#ffe0b0', 0.35, 0.02, 'lamp')],
    key: { x: 0.1, color: '#dce4f4', amb: '#363646', rim: 0.45 },
    outdoor: false
  });

  /* ================================================================
   * 离屋 annex：糊死的窗、掘被炉（旧围炉里铁框）、右墙烟道口、裸灯泡
   * ================================================================ */
  function tansu(g, q, R, x, y, w, by) {
    if (q.light >= 1) K.contact(g, x + w / 2, by, w * 0.6, 8, 0.6);
    box(g, q, R, x, y, w, by - y, R.kWall(by), { col: '#5a3a1e', t: TX.keyaki });
    var rows = [0.18, 0.18, 0.22, 0.22], yy = y + 12;
    for (var r = 0; r < rows.length; r++) {
      var rh = (by - y - 30) * rows[r], cols = r === 0 ? 2 : 1;
      for (var c = 0; c < cols; c++) {
        var dx = x + 10 + c * (w - 20) / cols, dw = (w - 20) / cols - 6;
        groove(g, dx, yy, dw, rh - 6, 2.5, 0.45);
        var hx = dx + dw / 2;
        g.beginPath(); g.arc(hx, yy + rh * 0.45, 12, 0, PI); stroke(g, 3, '#1a1a1e'); rect(g, hx - 18, yy + rh * 0.4 - 4, 36, 8, '#2a2a2e');
      }
      yy += rh;
    }
    for (var cn = 0; cn < 4; cn++) { var cx = cn % 2 ? x + w - 16 : x, cy = cn < 2 ? y : by - 16; rect(g, cx, cy, 16, 16, '#2a2a2e'); }
  }
  // 掘被炉：被子罩着的方桌，四周地板里嵌着旧围炉里的铁框
  function horigotatsu(g, q, R, X0, X1, d0, d1) {
    var F = FQ(R, X0, X1, d0, d1), Yt = 120;
    function T(u, t) { var p = F.p(u, t), d = F.D(t); return [p[0], p[1] - Yt * d]; }
    // 铁框（嵌在地板里）
    var fo = F.q(-0.3, 1.3, -0.35, 1.4), fi = F.q(-0.24, 1.24, -0.27, 1.32);
    if (q.light >= 1) softPoly(g, fo, 0.3, 2, 0.01, (fo[0] + fo[4]) / 2, (fo[1] + fo[5]) / 2);
    K.poly(g, fo); g.fillStyle = '#18181c'; g.fill();
    K.poly(g, fo); texFill(g, q, '#26262c', TX.iron, 0, 0, 1, 1, 0.7);
    g.beginPath(); g.moveTo(fo[6], fo[7]); g.lineTo(fo[4], fo[5]); stroke(g, 3, 'rgba(230,214,196,0.5)');
    g.beginPath(); g.moveTo(fo[0], fo[1]); g.lineTo(fo[6], fo[7]); stroke(g, 2, 'rgba(210,200,190,0.2)');
    fillP(g, fi, '#0c0a0a');
    if (q.model >= 1) { var cs = [[fo[6], fo[7]], [fo[4], fo[5]]]; for (var r = 0; r < 2; r++) { circle(g, cs[r][0] + (r ? -14 : 14), cs[r][1] - 5, 3, '#4a4a52'); } }
    // 被子：左右侧面 + 正面（下摆外扩）
    var quilt = '#6a3436', qt = ['fabric', { c1: '#4a2224', c2: '#7a4446', threads: 26, seed: 343 }, 90];
    var fl = function (u, t) { return F.p(u, t); };
    var Lf = [T(0, 0), T(0, 1), fl(-0.12, 1.14), fl(-0.12, -0.1)], Rf = [T(1, 0), T(1, 1), fl(1.12, 1.14), fl(1.12, -0.1)];
    var sideVis = (X0 + X1) / 2 > R.vx ? Lf : Rf;
    K.poly(g, [sideVis[0][0], sideVis[0][1], sideVis[1][0], sideVis[1][1], sideVis[2][0], sideVis[2][1], sideVis[3][0], sideVis[3][1]]);
    texFill(g, q, quilt, qt); g.fillStyle = lo(0.35); g.fill();
    var otherSide = sideVis === Lf ? Rf : Lf;
    K.poly(g, [otherSide[0][0], otherSide[0][1], otherSide[1][0], otherSide[1][1], otherSide[2][0], otherSide[2][1], otherSide[3][0], otherSide[3][1]]);
    texFill(g, q, quilt, qt); g.fillStyle = lo(0.15); g.fill();
    var a0 = T(0, 1), a1 = T(1, 1), b1 = fl(1.12, 1.14), b0 = fl(-0.12, 1.14), nf = M(q, 4, 7, 11), rnd = K.rng(345);
    g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.quadraticCurveTo(a1[0] + 20, (a1[1] + b1[1]) / 2, b1[0], b1[1]);
    for (var f = nf; f >= 0; f--) { var fx = lerp(b0[0], b1[0], f / nf); g.lineTo(fx, lerp(b0[1], b1[1], f / nf) + (f % 2 ? 7 : 0) + rnd() * 4); }
    g.quadraticCurveTo(a0[0] - 20, (a0[1] + b0[1]) / 2, a0[0], a0[1]); g.closePath();
    texFill(g, q, quilt, qt);
    g.save(); g.clip();
    for (var f2 = 0; f2 < nf; f2++) { var x0 = lerp(b0[0], b1[0], f2 / nf), x1 = lerp(b0[0], b1[0], (f2 + 1) / nf); g.fillStyle = K.lin(g, x0, 0, x1, 0, [lo(0.28), hi(0.08), lo(0.28)]); g.fillRect(x0, a0[1], x1 - x0, b0[1] - a0[1] + 20); }
    g.fillStyle = K.lin(g, 0, a0[1], 0, b0[1], [hi(0.14), lo(0.05), lo(0.45)]); g.fillRect(b0[0] - 30, a0[1], b1[0] - b0[0] + 60, b0[1] - a0[1] + 20);
    if (q.model >= 1) { g.strokeStyle = 'rgba(30,12,12,0.3)'; g.lineWidth = 2; for (var cl = 1; cl < 8; cl++) { var cx = lerp(b0[0], b1[0], cl / 8); seg(g, lerp(a0[0], a1[0], cl / 8), a0[1], cx, b0[1] + 6, 2, 'rgba(30,12,12,0.25)'); } }
    g.restore();
    // 天板
    var t0 = T(-0.05, -0.06), t1 = T(1.05, -0.06), t2 = T(1.05, 1.06), t3 = T(-0.05, 1.06);
    K.poly(g, [t0[0], t0[1], t1[0], t1[1], t2[0], t2[1], t3[0], t3[1]]); texFill(g, q, '#5a3a20', TX.keyakiH);
    K.poly(g, [t0[0], t0[1], t1[0], t1[1], t2[0], t2[1], t3[0], t3[1]]); g.fillStyle = K.lin(g, 0, t0[1], 0, t3[1], [lo(0.2), hi(0.12)]); g.fill();
    fillP(g, [t3[0], t3[1], t2[0], t2[1], t2[0], t2[1] + 14, t3[0], t3[1] + 14], '#2e1c0e'); rect(g, t3[0], t3[1], t2[0] - t3[0], 1.5, hi(0.3));
    // 桌上：茶碗 + 药袋
    if (q.model >= 1) { var cp = T(0.3, 0.5); g.fillStyle = cylGrad(g, cp[0] - 12, 24, '#3a4a5a'); g.fillRect(cp[0] - 12, cp[1] - 20, 24, 20); ell(g, cp[0], cp[1] - 20, 12, 3.5, '#5a6a3a'); var mp = T(0.65, 0.45); fillP(g, [mp[0] - 26, mp[1] + 4, mp[0] + 26, mp[1] + 4, mp[0] + 22, mp[1] - 6, mp[0] - 22, mp[1] - 6], '#e8e4dc'); }
    return { top: [t0, t1, t2, t3], frame: fo, side: [fl(1.12, 0.5)] };
  }
  // 烟道（铁管）：从被炉侧面沿地面伸到墙脚，再沿墙上升，穿进墙上的铁板
  function fluePipe(g, q, R, sx, sy, wx, yWall) {
    var r = 12, by = R.base - 6;
    g.save(); g.lineCap = 'butt';
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(wx, by); stroke(g, r * 2, '#2a2a30');
    g.beginPath(); g.moveTo(sx, sy - r * 0.6); g.lineTo(wx, by - r * 0.6); stroke(g, 3, 'rgba(255,190,120,0.22)');
    g.restore();
    if (q.light >= 1) K.contact(g, (sx + wx) / 2, (sy + by) / 2 + r, Math.abs(wx - sx) * 0.6, 6, 0.45);
    g.fillStyle = cylGrad(g, wx - r, r * 2, '#4a4a52'); g.fillRect(wx - r, yWall, r * 2, by - yWall);
    circle(g, wx, by, r, '#34343a');
    if (q.model >= 1) for (var j = 0; j < 3; j++) rect(g, wx - r, yWall + (by - yWall) * (j + 0.5) / 3, r * 2, 5, 'rgba(0,0,0,0.35)');
    // 穿墙铁板
    var px = wx - 34, py = yWall - 40;
    if (q.light >= 1) softRect(g, px + 4, py + 4, 68, 68, 5, 0.4);
    g.fillStyle = metalGrad(g, px, py, px + 68, py + 68, '#5a5a62'); g.fillRect(px, py, 68, 68);
    for (var rv = 0; rv < 4; rv++) circle(g, px + (rv % 2 ? 60 : 8), py + (rv < 2 ? 8 : 60), 3, '#8a8a92');
    ell(g, wx, yWall - 6, r + 6, r + 4, '#1a1a1e'); ell(g, wx, yWall - 6, r, r - 2, '#0a0a0c');
    g.fillStyle = cylGrad(g, wx - r, r * 2, '#4a4a52'); g.fillRect(wx - r, yWall - 6, r * 2, 10);
    if (q.model >= 1) { g.fillStyle = 'rgba(20,16,12,0.4)'; g.fillRect(px - 6, py - 60, 80, 60); }
  }
  function mealTray(g, q, x, y, w, h) {
    if (q.light >= 1) K.contact(g, x + w / 2, y + h, w * 0.6, 8, 0.6);
    fillP(g, [x, y + h * 0.4, x + w, y + h * 0.4, x + w - 10, y, x + 10, y], '#3a1010');
    fillP(g, [x, y + h * 0.4, x + w, y + h * 0.4, x + w, y + h * 0.4 + 12, x, y + h * 0.4 + 12], '#240808');
    rect(g, x, y + h * 0.4, w, 2, hi(0.3));
    // 粥碗、小碟、筷子
    var cx = x + w * 0.35, cy = y + h * 0.22;
    g.fillStyle = K.lin(g, 0, cy - 22, 0, cy, ['#5a2a1a', '#2a1008']); g.beginPath(); g.moveTo(cx - 30, cy - 18); g.quadraticCurveTo(cx - 28, cy + 4, cx, cy + 4); g.quadraticCurveTo(cx + 28, cy + 4, cx + 30, cy - 18); g.closePath(); g.fill();
    ell(g, cx, cy - 18, 30, 7, '#3a1a10'); ell(g, cx, cy - 17, 26, 5, '#ece6d8');
    ell(g, x + w * 0.72, cy - 4, 22, 6, '#d8d0c0'); ell(g, x + w * 0.72, cy - 5, 16, 4, '#c87a3a');
    seg(g, x + w * 0.18, y + h * 0.34, x + w * 0.86, y + h * 0.3, 2.5, '#c8a878');
  }
  function drawAnnex(g, q) {
    setKey(0);
    var R = Room(960, 520, 740, 0, 1300);
    earthWall(g, q, 0, 0, W, R.base, { col: '#7a6a50', t: TX.tsuchiD, age: 0.8 });
    // 漏雨的水渍
    if (q.model >= 1) { var rs = K.rng(351); for (var st = 0; st < M(q, 0, 4, 7); st++) { var sx = rs() * W, sw = 40 + rs() * 80; g.fillStyle = K.lin(g, 0, 0, 0, 300 + rs() * 200, ['rgba(40,30,20,0.35)', 'rgba(40,30,20,0)']); g.fillRect(sx, 0, sw, 500); } }
    beam(g, q, 0, 0, W, 40, { col: '#2a1a10', t: TX.sugiH });
    beam(g, q, 0, 248, W, 22, { col: '#2e1e12' });
    var posts = [40, 334, 1360, 1860];
    for (var pI = 0; pI < posts.length; pI++) post(g, q, posts[pI], 0, 30, R.base, { col: '#2e1e12' });
    // 门（板戸）
    var dx = 78, dw = 230, dy = 270;
    g.beginPath(); g.rect(dx, dy, dw, R.base + 74 - dy); texFill(g, q, '#4a3420', TX.board);
    g.fillStyle = K.lin(g, 0, dy, 0, R.base, [lo(0.1), lo(0.4)]); g.fillRect(dx, dy, dw, R.base + 74 - dy);
    for (var c = 0; c < 3; c++) rect(g, dx, dy + 60 + c * 180, dw, 12, '#2a1a10');
    rect(g, dx + dw - 30, dy + 260, 12, 40, '#1a1a1e');
    // 柜子
    tansu(g, q, R, 348, 364, 240, R.base);
    // 糊死的窗（纸糊 + 胶带，后面雨户紧闭）
    var wx = 1404, wy = 180, ww = 392, wh = 248;
    g.beginPath(); g.rect(wx - 16, wy - 16, ww + 32, wh + 32); texFill(g, q, '#2e1e12', TX.sugiH);
    g.beginPath(); g.rect(wx, wy, ww, wh); texFill(g, q, '#c8b890', ['paper', { c1: '#b0a078', c2: '#d4c4a0', seed: 353 }, 120]);
    g.fillStyle = K.lin(g, 0, wy, 0, wy + wh, ['rgba(60,40,20,0.15)', 'rgba(60,40,20,0.35)']); g.fillRect(wx, wy, ww, wh);
    rect(g, wx + ww / 2 - 4, wy, 8, wh, '#3a2818'); for (var gr = 1; gr < 3; gr++) rect(g, wx, wy + wh * gr / 3 - 3, ww, 6, '#3a2818');
    if (q.model >= 1) { var rt = K.rng(355); for (var tp = 0; tp < 6; tp++) { var tx = wx + rt() * ww, ty2 = wy + rt() * wh; g.save(); g.translate(tx, ty2); g.rotate((rt() - 0.5) * 0.6); rect(g, -40, -6, 80, 12, 'rgba(220,210,170,0.7)'); g.restore(); } for (var bl = 0; bl < 3; bl++) { var bx = wx + 40 + bl * 120; fillP(g, [bx, wy + wh - 30, bx + 30, wy + wh - 60, bx + 46, wy + wh - 20], 'rgba(90,70,40,0.3)'); } }
    // 烟道口（右墙）
    var flx = 1452, fly = 560;
    // 地面
    tatamiFloor(g, q, R, { u: 290, seed: 357, t: TX.tatamiO, col: '#8a7a4a', heri: '#2a2016', x0: 30 });
    if (q.light >= 1) K.ao(g, 0, R.base - 2, W, 40, 30, 0.5, 't');
    // 掘被炉
    // 坐椅（靠背，在被炉后侧）
    if (q.model >= 1) { g.fillStyle = K.lin(g, 0, 560, 0, 680, ['#3a2a3a', '#1e141e']); K.rr(g, 890, 566, 150, 110, 18); g.fill(); g.strokeStyle = lo(0.4); g.lineWidth = 2; g.stroke(); }
    var HG = horigotatsu(g, q, R, 740, 1180, 1.16, 1.5);
    fluePipe(g, q, R, HG.side[0][0] - 10, HG.side[0][1] - 10, flx, fly);
    // 托盘
    mealTray(g, q, 1412, 790, 216, 100);
    // 裸灯泡
    bareBulb(g, q, 960, 110);
    // ---- 光照（裸灯泡的橙光，昏暗） ----
    var Lm = [
      { x: 960, y: 200, r: 1000, ry: 760, c: '#ffa850', i: 0.6, fall: 0.25 },
      { x: 960, y: 800, r: 600, ry: 200, c: '#ff9a40', i: 0.25, q: 1 },
      { x: 1600, y: 300, r: 260, ry: 200, c: '#c8b088', i: 0.12, q: 1 }
    ];
    lightMap(g, q, '#2a2630', Lm);
    bulbGlow(g, q, 960, 110, 220, 0.42);
    if (q.light >= 2) { g.save(); g.globalCompositeOperation = 'screen'; K.blob(g, 960, 500, 500, '#8a7060', 0.08); g.restore(); K.motes(g, K.rng(359), 50, 600, 150, 700, 500, '#ffc890', 0.3); }
    finish(g, q, { vig: 0.7 });
    void HG;
  }
  DM.HDBG.def('annex', {
    draw: function (g, q) { drawAnnex(g, q); },
    lights: [LT(960, 120, 300, '#ffa850', 0.6, 0.06, 'lamp')],
    key: { x: 0, color: '#ffb070', amb: '#2a2430', rim: 0.35 },
    outdoor: false
  });

})(typeof window !== 'undefined' ? window : globalThis);
