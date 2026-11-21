/* DARK MOOD Ⅱ HD 背景：雪葬村户外（隧道、吊桥、村道、雪见汤、水车小屋、雪庭、神社石阶、送门、雪葬谷、远望、火见橹、墓地、地藏堂、标题、地图）
 * ------------------------------------------------------------------
 * 设计坐标 1920x1080（locations.js 锚点 x4）。程序化矢量 + 低分辨率「场」绘制：
 *   - 天空、雪原、远山、地图地形等柔和的大面积色调用 field()：小画布逐像素计算后平滑放大；
 *   - 物件、积雪轮廓、冰柱、高光等用矢量路径，任何分辨率都清晰；
 *   - 材质用 kit 的程序化纹理（texFill / mat），q.tex=0 时回退为纯色渐变。
 * 光线：2003 年 2 月东北深山，铅灰色雪云，冷白天光从左上方来；雪的阴影偏蓝紫，灯火暖橙。
 * 飘落的雪由引擎叠加，这里只画积雪。
 * 兼容：ES5 + Canvas 2D 基础 API；确定性随机（K.rng 固定种子）。
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK;
  if (!K || !DM.HDBG) return;

  var W = 1920, H = 1080, PI = Math.PI, TAU = PI * 2;

  /* ======================= 数学 / 噪声 ======================= */
  function sat(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sstep(a, b, v) { var t = sat((v - a) / (b - a)); return t * t * (3 - 2 * t); }

  // 快速值噪声（本文件私有；比通用版本少一次表查找，场绘制要算几十万次）
  var NP = new Uint8Array(512), NV = new Float32Array(256);
  (function () {
    var r = K.rng(77031), i;
    for (i = 0; i < 256; i++) { NP[i] = i; NV[i] = r(); }
    for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = NP[i]; NP[i] = NP[j]; NP[j] = t; }
    for (i = 0; i < 256; i++) NP[i + 256] = NP[i];
  })();
  function vn(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    xi &= 255; yi &= 255;
    var x1 = (xi + 1) & 255, y1 = (yi + 1) & 255;
    var a = NV[NP[NP[xi] + yi]], b = NV[NP[NP[x1] + yi]], c = NV[NP[NP[xi] + y1]], d = NV[NP[NP[x1] + y1]];
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct, seed) {
    var s = 0, amp = 0.5, n = 0, ox = (seed || 0) * 31.7, oy = (seed || 0) * 17.3, nx;
    for (var i = 0; i < oct; i++) {
      s += amp * vn(x + ox, y + oy); n += amp;
      nx = x * 1.6 - y * 1.2; y = x * 1.2 + y * 1.6; x = nx;   // 旋转 + 倍频，减少网格感
      amp *= 0.5; ox += 5.3; oy += 9.1;
    }
    return s / n;
  }

  /* ======================= 颜色 ======================= */
  function C(c) { return K.rgb(c); }
  function mixc(a, b, t) { return K.mix(a, b, t); }
  // 确定性随机数（K.rng + 近似高斯）
  function RNG(seed) { var r = K.rng(seed); r.gauss = function () { return (r() + r() + r() - 1.5) * 1.15; }; return r; }

  /* ======================= 场绘制 ======================= */
  // 在 rw x rh 的小画布上逐像素调用 fn(u,v,out)（out=[r,g,b,a]），再平滑放大到设计矩形
  function field(g, x, y, w, h, rw, rh, fn) {
    rw = Math.max(2, Math.round(rw)); rh = Math.max(2, Math.round(rh));
    var c = K.canvas(rw, rh), cx = c.getContext('2d'), im = cx.createImageData(rw, rh), d = im.data, o = [0, 0, 0, 255], k = 0;
    for (var j = 0; j < rh; j++) {
      var v = (j + 0.5) / rh;
      for (var i = 0; i < rw; i++) {
        o[3] = 255; fn((i + 0.5) / rw, v, o);
        d[k] = o[0]; d[k + 1] = o[1]; d[k + 2] = o[2]; d[k + 3] = o[3]; k += 4;
      }
    }
    cx.putImageData(im, 0, 0);
    g.save();
    g.imageSmoothingEnabled = true;
    g.drawImage(c, x, y, w, h);
    g.restore();
  }
  // 场分辨率（每个设计单位多少像素）：随输出倍率与建模精度变化，上限避免 4K 下过慢
  function fres(q, base) { return Math.min(q.s, 1.1) * base * (q.model <= 0 ? 0.55 : q.model === 1 ? 0.78 : 1); }

  // 纹理填充（可独立缩放 x/y、旋转；同一张平铺图可复用于不同比例，避免重复生成）
  function texFill(g, q, kind, opts, units, ox, oy, alpha, sx, sy, rot, mode) {
    var size = K.tileSize(q, units), tile = K.tex(kind, opts, size), pat = g.createPattern(tile, 'repeat');
    g.save();
    if (alpha !== undefined && alpha !== null) g.globalAlpha *= alpha;
    if (mode) g.globalCompositeOperation = mode;
    g.translate(ox || 0, oy || 0);
    if (rot) g.rotate(rot);
    var m = units / tile.width; g.scale(m * (sx || 1), m * (sy || 1));
    g.fillStyle = pat; g.fill();
    g.restore();
  }
  // 材质：q.tex=0 时用回退色
  function mat(g, q, fb, kind, opts, units, ox, oy, alpha, sx, sy, rot) {
    if (q.tex <= 0) { g.save(); if (alpha !== undefined && alpha !== null) g.globalAlpha *= alpha; g.fillStyle = fb; g.fill(); g.restore(); return; }
    texFill(g, q, kind, opts, units, ox, oy, alpha, sx, sy, rot);
  }
  // 在当前路径上叠加一层线性渐变
  function shadeLin(g, x0, y0, x1, y1, stops, mode) {
    g.save(); if (mode) g.globalCompositeOperation = mode;
    g.fillStyle = K.lin(g, x0, y0, x1, y1, stops); g.fill(); g.restore();
  }
  // 椭圆弧（老浏览器没有 ctx.ellipse 时用缩放的 arc 代替）
  function ellArc(g, cx, cy, rx, ry, rot, a0, a1, ccw) {
    if (g.ellipse) { g.ellipse(cx, cy, rx, ry, rot, a0, a1, ccw); return; }
    g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(1, ry / rx); g.arc(0, 0, rx, a0, a1, ccw); g.restore();
  }
  function fillP(g, style, a) { g.save(); if (a !== undefined) g.globalAlpha *= a; g.fillStyle = style; g.fill(); g.restore(); }
  function strokeP(g, style, w, a) { g.save(); if (a !== undefined) g.globalAlpha *= a; g.strokeStyle = style; g.lineWidth = w; g.stroke(); g.restore(); }
  function rectP(g, x, y, w, h) { g.beginPath(); g.rect(x, y, w, h); }
  // 竖直方向的雾/空气透视
  function haze(g, x, y, w, h, color, a0, a1) {
    g.fillStyle = K.lin(g, 0, y, 0, y + h, [[0, K.rgba(color, a0)], [1, K.rgba(color, a1)]]);
    g.fillRect(x, y, w, h);
  }
  // 由点列构造平滑闭合（或开放）曲线（中点二次贝塞尔）
  function smoothPath(g, pts, closed, noBegin) {
    var n = pts.length / 2;
    if (!noBegin) g.beginPath();
    if (n < 3) { g.moveTo(pts[0], pts[1]); for (var k = 1; k < n; k++) g.lineTo(pts[k * 2], pts[k * 2 + 1]); if (closed) g.closePath(); return; }
    if (closed) {
      g.moveTo((pts[0] + pts[2]) / 2, (pts[1] + pts[3]) / 2);
      for (var i = 1; i <= n; i++) {
        var a = i % n, b = (i + 1) % n;
        g.quadraticCurveTo(pts[a * 2], pts[a * 2 + 1], (pts[a * 2] + pts[b * 2]) / 2, (pts[a * 2 + 1] + pts[b * 2 + 1]) / 2);
      }
      g.closePath();
    } else {
      g.moveTo(pts[0], pts[1]);
      for (var j = 1; j < n - 1; j++) g.quadraticCurveTo(pts[j * 2], pts[j * 2 + 1], (pts[j * 2] + pts[j * 2 + 2]) / 2, (pts[j * 2 + 1] + pts[j * 2 + 3]) / 2);
      g.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1]);
    }
  }
  // 起伏的山脊线点列：从 x0 到 x1，高度函数 hf(t) 返回 y；加噪声起伏
  function ridge(x0, x1, step, hf, amp, seed, freq) {
    var pts = [];
    for (var x = x0; x <= x1 + 0.1; x += step) {
      var t = (x - x0) / (x1 - x0);
      pts.push(x, hf(t) - (fbm(x * (freq || 0.01), 3.7, 3, seed) - 0.5) * amp * 2);
    }
    return pts;
  }

  /* ======================= 天空 ======================= */
  // 冬季铅灰雪云（比第一部的台风天更亮、更平、偏蓝）
  var SKY = { top: '#596070', hor: '#c4c8d3', dark: '#4e5464', mid: '#868c9c', lit: '#e8eaf0', glow: '#f7f7fa' };
  // o: { x,y,w,h, seed, gx,gy 云隙中心(区域内 0..1), gw 云隙大小, dens 云量偏移, 以及颜色覆盖 }
  // 三层：高空薄云纱（受光、条纹状）、主云层（有体积：受光的上缘 + 暗的云底）、低空碎积云（暗、破碎）
  function sky(g, q, o) {
    var X = o.x || 0, Y = o.y || 0, Wd = o.w || W, Hd = o.h || 700, seed = o.seed || 1;
    var top = C(o.top || SKY.top), hor = C(o.hor || SKY.hor), dk = C(o.dark || SKY.dark), md = C(o.mid || SKY.mid), lt = C(o.lit || SKY.lit), gl = C(o.glow || SKY.glow);
    var gx = o.gx === undefined ? 0.3 : o.gx, gy = o.gy === undefined ? 0.35 : o.gy, gw = o.gw || 0.16, dens0 = o.dens || 0;
    var oct = K.byModel(q, 3, 4, 5), warp = q.model > 0, lit = q.light > 0, scud = q.model > 0, asp = Wd / Hd;
    var r = fres(q, q.model >= 2 ? 0.3 : 0.24);
    field(g, X, Y, Wd, Hd, Wd * r, Hd * r, function (u, v, out) {
      var t = Math.pow(v, 0.9);
      var R = top[0] + (hor[0] - top[0]) * t, G = top[1] + (hor[1] - top[1]) * t, B = top[2] + (hor[2] - top[2]) * t;
      var gn = warp ? fbm(u * asp * 2.2 + 3.1, v * 4.4, 2, seed + 7) - 0.5 : 0;
      var dx = (u - gx) * asp + gn * 0.22, dy = (v - gy) + gn * 0.12, d2 = dx * dx * 0.45 + dy * dy * 3;
      var gd = Math.exp(-d2 / (gw * gw)), gb = Math.exp(-d2 / (gw * gw * 8));
      // 云隙后面更亮的天空
      R += (gl[0] - R) * gd * 0.5; G += (gl[1] - G) * gd * 0.5; B += (gl[2] - B) * gd * 0.5;
      // 高空云纱
      var hv = fbm(u * asp * 0.9 + 11, v * 7, 3, seed + 21);
      var hvd = sstep(0.45, 0.75, hv) * (0.25 + 0.6 * gb);
      R += (lt[0] - R) * hvd * 0.45; G += (lt[1] - G) * hvd * 0.45; B += (lt[2] - B) * hvd * 0.45;
      // 主云层
      var px = u * asp * 1.35, py = v * 3.3;
      if (warp) { var w1 = fbm(px * 0.55, py * 0.75, 2, seed + 3) - 0.5; px += w1 * 1.7; py += w1 * 0.6; }
      var n = fbm(px, py, oct, seed);
      var th = 0.47 - 0.12 * (1 - v) + gd * 0.2 + gb * 0.06 - dens0;
      var dens = sstep(th - 0.07, th + 0.05, n);
      if (dens > 0.001) {
        var l = 0;
        if (lit) {
          var lx = gx - u, ly = gy - v - 0.25, ll = Math.sqrt(lx * lx * asp * asp + ly * ly) + 1e-3;
          var n2 = fbm(px + lx * asp / ll * 0.1, py + ly / ll * 0.22, oct, seed);
          l = (n - n2) * 6;
        }
        var thick = sat((n - th) * 3);
        var cr = md[0] + (dk[0] - md[0]) * thick, cg = md[1] + (dk[1] - md[1]) * thick, cb = md[2] + (dk[2] - md[2]) * thick;
        if (l > 0) { var le = sat(l) * (0.35 + 0.65 * gb); cr += (lt[0] - cr) * le; cg += (lt[1] - cg) * le; cb += (lt[2] - cb) * le; }
        else { var sh = sat(-l) * 0.35; cr *= 1 - sh; cg *= 1 - sh; cb *= 1 - sh * 0.8; }
        var hz = v * v * v * 0.75;
        cr += (hor[0] - cr) * hz; cg += (hor[1] - cg) * hz; cb += (hor[2] - cb) * hz;
        R += (cr - R) * dens; G += (cg - G) * dens; B += (cb - B) * dens;
      }
      // 低空碎云（台风外围快速移动的暗云）
      if (scud) {
        var n3 = fbm(u * asp * 2.6 + 7, v * 9, 3, seed + 11), sd = sstep(0.56, 0.7, n3) * sstep(0.35, 0.9, v) * 0.5;
        if (sd > 0.001) {
          var n4 = fbm(u * asp * 2.6 + 7, v * 9 - 0.35, 3, seed + 11), sl = sat((n3 - n4) * 5) * (0.4 + 0.6 * gb);
          var sr = dk[0] * 1.15 + (lt[0] - dk[0] * 1.15) * sl * 0.5, sg = dk[1] * 1.15 + (lt[1] - dk[1] * 1.15) * sl * 0.5, sb = dk[2] * 1.18 + (lt[2] - dk[2] * 1.18) * sl * 0.5;
          R += (sr - R) * sd; G += (sg - G) * sd; B += (sb - B) * sd;
        }
      }
      out[0] = R; out[1] = G; out[2] = B;
    });
  }
  // 云隙光柱：从云隙下缘的若干点发出、彼此分离的细光束
  function godRays(g, q, x, y, yEnd, n, seed, a, spread, x0w) {
    if (q.light < 2) return;
    var r = RNG(seed);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var sx = x + r.range(-1, 1) * (x0w || 90), ang = (sx - x) / (x0w || 90) * (spread || 0.5) * 0.5 + r.range(-0.08, 0.08);
      var w0 = r.range(6, 16), w1 = r.range(40, 120), ex = sx + Math.tan(ang) * (yEnd - y), al = (a || 0.05) * r.range(0.4, 1) / 3;
      var grd = K.lin(g, sx, y, ex, yEnd, [[0, 'rgba(240,232,214,0)'], [0.15, K.rgba('#efe6d4', al)], [0.6, K.rgba('#efe6d4', al * 0.45)], [1, 'rgba(240,232,214,0)']]);
      for (var k = 1; k <= 3; k++) {
        var f = k / 3;
        K.poly(g, [sx - w0 * f, y, sx + w0 * f, y, ex + w1 * f, yEnd, ex - w1 * f, yEnd]);
        g.fillStyle = grd; g.fill();
      }
    }
    g.restore();
  }
  // 飞翔的乌鸦（剪影）
  function crowFly(g, x, y, s, color, ph) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var up = ph ? -1 : 1;
    g.beginPath();
    g.moveTo(-14, -4 * up); g.quadraticCurveTo(-7, -7 * up, -2, 0); g.lineTo(0, 1.5); g.lineTo(2, 0);
    g.quadraticCurveTo(7, -7 * up, 14, -4 * up); g.quadraticCurveTo(7, -2 * up, 2, 2.5); g.lineTo(0, 4); g.lineTo(-2, 2.5);
    g.quadraticCurveTo(-7, -2 * up, -14, -4 * up); g.closePath();
    g.fillStyle = color || '#141320'; g.fill();
    g.restore();
  }
  function crows(g, q, seed, n, x, y, w, h, s0, color) {
    var r = RNG(seed), m = K.byModel(q, Math.ceil(n / 2), n, n);
    for (var i = 0; i < m; i++) crowFly(g, x + r() * w, y + r() * h, s0 * r.range(0.55, 1.1), color, r() < 0.5);
  }

  /* ======================= 植被 / 岩石 ======================= */
  // 远景林带：一层锯齿状的针叶林剪影。o = { x0, x1, base(y 或函数), h, color, seed, step, top(可选：顶部高光色) }
  function forestBand(g, q, o) {
    var r = RNG(o.seed || 5), x = o.x0 - 10, step = o.step || 14, pts = [];
    var bf = typeof o.base === 'function' ? o.base : function () { return o.base; };
    g.beginPath(); g.moveTo(o.x0 - 10, bf(0) + 400);
    while (x <= o.x1 + 10) {
      var t = (x - o.x0) / (o.x1 - o.x0), b = bf(t), hh = o.h * (0.55 + 0.45 * fbm(x * 0.012, 1.3, 2, o.seed || 5)) * r.range(0.8, 1.15);
      var w = step * r.range(0.7, 1.3);
      g.lineTo(x, b - hh * 0.3); g.lineTo(x + w * 0.5, b - hh); g.lineTo(x + w, b - hh * 0.3);
      pts.push(x + w * 0.5, b - hh);
      x += w * r.range(0.55, 0.9);
    }
    g.lineTo(o.x1 + 10, bf(1) + 400); g.closePath();
    g.fillStyle = o.color; g.fill();
    return pts;
  }
  // 单棵杉树（神社林）：裸露的直干 + 由许多下垂枝叶团（底缘带针叶流苏）层层叠成的圆锥形树冠
  function sprayPath(g, cx, cy, cw, ch, teeth, droop, r) {
    g.moveTo(cx - cw, cy);
    g.quadraticCurveTo(cx - cw * 0.55, cy - ch * 1.1, cx + cw * 0.1, cy - ch);
    g.quadraticCurveTo(cx + cw * 0.7, cy - ch * 0.8, cx + cw, cy);
    var st = cw * 2 / teeth;
    for (var k = 0; k < teeth; k++) {
      var tx = cx + cw - (k + 0.5) * st, d = droop * (0.6 + 0.4 * Math.sin((k + 0.5) / teeth * PI));
      g.lineTo(tx, cy + d * r.range(0.7, 1.2)); g.lineTo(tx - st * 0.5, cy + d * 0.25);
    }
    g.closePath();
  }
  function cedar(g, q, x, y, h, col, lit, r, shade) {
    var w = h * 0.2, tiers = K.byModel(q, 5, 9, 13), teeth = K.byModel(q, 4, 6, 9);
    var base = y - h * 0.32, top = y - h;
    // 树干（下部无枝）
    K.poly(g, [x - h * 0.016, y, x + h * 0.016, y, x + h * 0.006, top + h * 0.1, x - h * 0.006, top + h * 0.1]);
    fillP(g, K.shade(col, -0.25));
    if (lit && q.light >= 1) { K.poly(g, [x - h * 0.016, y, x - h * 0.006, y, x - h * 0.002, base - h * 0.1, x - h * 0.008, base - h * 0.1]); fillP(g, K.rgba(lit, 0.6)); }
    var sh = [], li = [], i, k;
    g.beginPath();
    for (i = 0; i < tiers; i++) {
      var t = i / (tiers - 1), ty = base - (base - top) * Math.pow(t, 0.95), hw = w * Math.pow(1 - t * 0.92, 0.85) * r.range(0.8, 1.2);
      var nc = t > 0.8 ? 1 : 2 + (r() < 0.5 ? 1 : 0);
      for (k = 0; k < nc; k++) {
        var side = nc === 1 ? 0 : (k / (nc - 1) - 0.5) * 2;
        var cw = hw * (nc === 1 ? 0.9 : 0.62) * r.range(0.8, 1.1), cx = x + side * hw * 0.55 + r.range(-4, 4), cy = ty + Math.abs(side) * hw * 0.18;
        var ch = (base - top) / tiers * r.range(1.1, 1.6);
        sprayPath(g, cx, cy, cw, ch, teeth, ch * 0.45, r);
        sh.push(cx, cy, cw, ch); if (side <= 0.2) li.push(cx, cy, cw, ch);
      }
    }
    // 树梢
    g.moveTo(x - w * 0.12, top + h * 0.06); g.lineTo(x + r.range(-2, 2), top - h * 0.02); g.lineTo(x + w * 0.12, top + h * 0.06); g.closePath();
    g.fillStyle = col; g.fill();
    // 每团枝叶下缘的暗部（层次）
    if (shade && q.model >= 1) {
      g.beginPath();
      for (i = 0; i < sh.length; i += 4) { g.moveTo(sh[i] - sh[i + 2] * 0.9, sh[i + 1] - sh[i + 3] * 0.1); g.quadraticCurveTo(sh[i], sh[i + 1] - sh[i + 3] * 0.35, sh[i] + sh[i + 2] * 0.9, sh[i + 1] - sh[i + 3] * 0.1); g.lineTo(sh[i] + sh[i + 2] * 0.8, sh[i + 1] + sh[i + 3] * 0.2); g.lineTo(sh[i] - sh[i + 2] * 0.8, sh[i + 1] + sh[i + 3] * 0.2); g.closePath(); }
      g.fillStyle = shade; g.fill();
    }
    // 左上受光的叶团上缘
    if (lit && q.light >= 1) {
      g.beginPath();
      for (i = 0; i < li.length; i += 4) {
        var lx = li[i], ly = li[i + 1], lw = li[i + 2], lh = li[i + 3];
        g.moveTo(lx - lw, ly); g.quadraticCurveTo(lx - lw * 0.55, ly - lh * 1.1, lx + lw * 0.1, ly - lh);
        g.quadraticCurveTo(lx - lw * 0.3, ly - lh * 0.65, lx - lw * 0.7, ly - lh * 0.05); g.closePath();
      }
      g.fillStyle = lit; g.fill();
    }
  }
  // 圆润的树冠团（阔叶/松树），用若干叶团叠成
  function canopy(g, q, x, y, rx, ry, col, litCol, r, n) {
    n = n || K.byModel(q, 5, 9, 14);
    for (var i = 0; i < n; i++) {
      var a = r() * TAU, d = Math.sqrt(r()), px = x + Math.cos(a) * rx * d * 0.8, py = y + Math.sin(a) * ry * d * 0.8, rr = (rx + ry) * 0.5 * r.range(0.25, 0.45);
      K.ellipse(g, px, py, rr, rr * 0.8); g.fillStyle = col; g.fill();
      if (litCol && py < y + ry * 0.2) { K.ellipse(g, px - rr * 0.25, py - rr * 0.3, rr * 0.6, rr * 0.45); g.fillStyle = litCol; g.fill(); }
    }
  }
  // 草丛 / 杂草
  function grassTufts(g, q, r, n, x, y, w, h, col, len) {
    g.beginPath(); len = (len || 18) * 1.3;
    for (var i = 0; i < n; i++) {
      var px = x + r() * w, py = y + r() * h, L = (len || 18) * r.range(0.5, 1.2), m = 3 + (r() * 3 | 0);
      for (var k = 0; k < m; k++) { var a = -PI / 2 + r.range(-0.7, 0.7); g.moveTo(px + k * 1.5, py); g.quadraticCurveTo(px + Math.cos(a) * L * 0.4, py + Math.sin(a) * L * 0.5, px + Math.cos(a) * L, py + Math.sin(a) * L); }
    }
    g.strokeStyle = col; g.lineWidth = 1.2; g.stroke();
  }
  // 岩块（单个）：o = { lit, dark, wet, moss, seed, light(0..1 方向) }
  function boulder(g, q, x, y, w, h, o) {
    o = o || {};
    var r = RNG(o.seed || 1), n = 9, pts = [];
    for (var i = 0; i < n; i++) {
      var a = PI + i / (n - 1) * PI, rr = r.range(0.82, 1.05);
      pts.push(x + Math.cos(a) * w / 2 * rr, y + Math.sin(a) * h * rr * (a > PI * 1.15 && a < PI * 1.85 ? 1 : 0.7));
    }
    pts.push(x + w / 2 * 0.98, y + h * 0.06, x - w / 2 * 0.98, y + h * 0.06);
    var base = o.color || '#3a3a46';
    if (q.light >= 1) K.contact(g, x + w * 0.06, y + h * 0.04, w * 0.62, h * 0.16, 0.6);
    smoothPath(g, pts, true);
    mat(g, q, base, 'rock', ROCK, 200, x, y);
    smoothPath(g, pts, true);
    shadeLin(g, x - w * 0.4, y - h, x + w * 0.3, y, [[0, K.rgba(o.lit || '#b6b4c6', 0.32)], [0.45, 'rgba(0,0,0,0)'], [1, 'rgba(6,6,12,0.55)']]);
    if (q.tex <= 0) { smoothPath(g, pts, true); shadeLin(g, 0, y - h, 0, y, [[0, K.rgba(base, 0)], [1, 'rgba(0,0,0,0.25)']]); }
    if (o.moss && q.model >= 1) {
      g.save(); smoothPath(g, pts, true); g.clip();
      for (var m = 0; m < 5; m++) K.blob(g, x + r.range(-0.4, 0.2) * w, y - h * r.range(0.65, 1), w * r.range(0.12, 0.22), o.moss, 0.55);
      g.restore();
    }
    if (o.wet !== false) {
      // 湿润的下半部
      smoothPath(g, pts, true);
      shadeLin(g, 0, y - h * 0.5, 0, y, [[0, 'rgba(10,12,20,0)'], [1, 'rgba(10,12,20,0.45)']]);
      if (q.light >= 2) {
        g.save(); g.globalCompositeOperation = 'lighter';
        g.strokeStyle = 'rgba(230,232,245,0.45)'; g.lineWidth = 1.6;
        g.beginPath();
        for (var s = 0; s < 4; s++) { var sx = x + r.range(-0.4, 0.1) * w, sy = y - h * r.range(0.4, 0.9); g.moveTo(sx, sy); g.lineTo(sx + r.range(5, 16), sy - r.range(1, 4)); }
        g.stroke(); g.restore();
      }
    }
    // 上缘高光
    if (q.light >= 1) {
      g.beginPath(); var k0 = 1;
      g.moveTo(pts[k0 * 2], pts[k0 * 2 + 1]);
      for (var k = k0 + 1; k < 6; k++) g.lineTo(pts[k * 2], pts[k * 2 + 1]);
      strokeP(g, K.rgba(o.lit || '#c8c6d8', 0.35), 2);
    }
  }
  var ROCK = { c1: '#1f1e26', c2: '#5d5a68', seed: 37 };
  var ROCK_WET = { c1: '#15161d', c2: '#4b4c5a', seed: 38 };

  /* ======================= 岩面 ======================= */
  // 晶格（Voronoi）岩面：每个岩块是一个朝向随机的平面 → 明暗分明的块面；块与块之间是裂缝（带 AO）
  // o = { seed, cw, ch 大岩块尺寸, sw, sh 小岩块尺寸, L:[lx,ly,lz] 或 P:[x,y,z] 点光源, att, dark, mid, lite, amb,
  //       crack 裂缝宽度(0..1), wet(u,v), moss(u,v)->0..1, mossCol, tilt 法线朝上偏置, alpha(u,v), res }
  function cellHash(ix, iy, s) { return NV[NP[(NP[(ix + s * 7) & 255] + (iy & 255)) & 511]]; }
  function cellHash2(ix, iy, s) { return NV[NP[(NP[(iy * 3 + s * 13) & 255] + (ix & 255)) & 511]]; }
  function voro(px, py, s, out) {
    var ix = Math.floor(px), iy = Math.floor(py), f1 = 9, f2 = 9, id1x = 0, id1y = 0;
    for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
      var cx = ix + i, cy = iy + j, fx = cx + 0.15 + cellHash(cx, cy, s) * 0.7, fy = cy + 0.15 + cellHash2(cx, cy, s) * 0.7;
      var dx = px - fx, dy = py - fy, d = dx * dx + dy * dy;
      if (d < f1) { f2 = f1; f1 = d; id1x = cx; id1y = cy; out[3] = dx; out[4] = dy; } else if (d < f2) f2 = d;
    }
    out[0] = Math.sqrt(f2) - Math.sqrt(f1); out[1] = id1x; out[2] = id1y;
  }
  function rockCells(g, q, x, y, w, h, o) {
    var dk = C(o.dark || '#141419'), md = C(o.mid || '#3c3a46'), lt = C(o.lite || '#9a97a6'), mc = C(o.mossCol || '#3e4a30');
    var seed = o.seed || 1, cw = o.cw || 90, ch = o.ch || 120, sw = o.sw || cw * 0.35, sh = o.sh || ch * 0.35;
    var amb = o.amb === undefined ? 0.28 : o.amb, crack = o.crack === undefined ? 0.08 : o.crack, tilt = o.tilt === undefined ? 0.2 : o.tilt;
    var L = o.L || [-0.6, -0.6, 0.55], P = o.P, att = o.att || 900, wetf = o.wet, mossf = o.moss, af = o.alpha, spec = q.light >= 2;
    var small = q.model >= 1, detail = q.model >= 2;
    var ll = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]), lx = L[0] / ll, ly = L[1] / ll, lz = L[2] / ll;
    var V1 = [0, 0, 0, 0, 0], V2 = [0, 0, 0, 0, 0];
    var r = fres(q, o.res || 0.42);
    field(g, x, y, w, h, w * r, h * r, function (u, v, out) {
      var px = x + u * w, py = y + v * h;
      var wn = detail ? (fbm(px * 0.01, py * 0.01, 2, seed + 5) - 0.5) : 0;
      voro(px / cw + wn * 0.5, py / ch + wn * 0.3, seed, V1);
      var h1 = cellHash(V1[1], V1[2], seed + 3), h2 = cellHash2(V1[1], V1[2], seed + 9);
      var nx = (h1 - 0.5) * 1.3, ny = (h2 - 0.5) * 1.0 - tilt, nz = 1;
      // 只有一部分岩块边界是真正的裂缝（按噪声遮罩），其余只表现为块面转折
      var cm = sstep(0.42, 0.62, fbm(px * 0.004 + 3, py * 0.004, 2, seed + 41));
      var cr = 1 - (1 - sstep(0, crack, V1[0])) * (0.25 + 0.75 * cm);
      if (small) {
        voro(px / sw, py / sh, seed + 17, V2);
        nx += (cellHash(V2[1], V2[2], seed + 21) - 0.5) * 0.5; ny += (cellHash2(V2[1], V2[2], seed + 23) - 0.5) * 0.4;
      }
      var n = detail ? fbm(px * 0.03, py * 0.03, 3, seed + 31) : 0.5;
      nx += (n - 0.5) * 0.5;
      var nl = Math.sqrt(nx * nx + ny * ny + 1); nx /= nl; ny /= nl; nz = 1 / nl;
      var a = 1;
      if (P) { var dx = P[0] - px, dy = P[1] - py, dz = P[2], dl = Math.sqrt(dx * dx + dy * dy + dz * dz); lx = dx / dl; ly = dy / dl; lz = dz / dl; a = 1 / (1 + (dl / att) * (dl / att)); }
      var dif = nx * lx + ny * ly + nz * lz; dif = dif < 0 ? 0 : dif;
      // 岩块内部：上部受光、下部（悬垂处）偏暗，增加块体感
      var blk = 1 + sat(-V1[4] * 1.4) * 0.12 - sat(V1[4] * 1.6 + 0.1) * 0.32;
      var lum = (amb + (1 - amb) * dif * a) * (0.82 + n * 0.36) * (0.25 + 0.75 * cr) * blk;
      var R, G, B;
      if (lum < 0.5) { var t = lum * 2; R = dk[0] + (md[0] - dk[0]) * t; G = dk[1] + (md[1] - dk[1]) * t; B = dk[2] + (md[2] - dk[2]) * t; }
      else { var t2 = sat((lum - 0.5) * 2); R = md[0] + (lt[0] - md[0]) * t2; G = md[1] + (lt[1] - md[1]) * t2; B = md[2] + (lt[2] - md[2]) * t2; }
      if (mossf) { var mv = mossf(u, v) * sstep(0.45, 0.7, n + (ny < 0 ? -ny * 0.5 : 0)); if (mv > 0) { R += (mc[0] * (0.6 + dif * 0.8) - R) * mv; G += (mc[1] * (0.6 + dif * 0.8) - G) * mv; B += (mc[2] * (0.6 + dif * 0.8) - B) * mv; } }
      if (wetf) {
        var wv = wetf(u, v);
        if (wv > 0) {
          R *= 1 - wv * 0.4; G *= 1 - wv * 0.38; B *= 1 - wv * 0.32;
          if (spec) { var hz = nx * lx * 0.5 + ny * (ly * 0.5 - 0.5) + nz * (lz * 0.5 + 0.5); if (hz > 0.9) { var gm = vn(px * 0.045, py * 0.045); if (gm > 0.74) { var sp = (hz - 0.9) * 10 * (gm - 0.74) * 3.8 * wv * a * cr * 70; R += sp; G += sp; B += sp * 1.06; } } }
        }
      }
      out[0] = R; out[1] = G; out[2] = B;
      if (af) out[3] = af(u, v) * 255;
    });
  }
  // 悬崖上的小松树（被风吹斜）
  function cliffPine(g, q, x, y, s, col, lit, r) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = '#2a2420'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-6, -24, 10, -46); g.quadraticCurveTo(22, -60, 30, -64); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(4, -30); g.lineTo(-18, -40); g.moveTo(12, -48); g.lineTo(36, -50); g.stroke();
    var pads = [[-20, -44, 20, 8], [10, -60, 22, 9], [34, -54, 18, 7], [28, -70, 16, 7], [-4, -56, 14, 6]];
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i];
      K.ellipse(g, p[0], p[1], p[2], p[3]); g.fillStyle = col; g.fill();
      if (lit && q.light >= 1) { K.ellipse(g, p[0] - 3, p[1] - 3, p[2] * 0.7, p[3] * 0.5); g.fillStyle = lit; g.fill(); }
    }
    g.restore();
    void r;
  }

  function weatherField(g, q, x, y, w, h, seed, ground, strength) {
    var k = strength || 1, r = fres(q, 0.1);
    field(g, x, y, w, h, w * r, h * r, function (u, v, out) {
      var px = x + u * w, py = y + v * h;
      var streak = fbm(px * 0.03, py * 0.0025, 3, seed), patch = fbm(px * 0.004, py * 0.006, 3, seed + 5);
      var damp = sstep(ground - 160, ground, py);
      var dark = sat((streak - 0.5) * 2.2) * 0.45 + damp * 0.35 + sat(0.45 - patch) * 0.4;
      var light = sat(patch - 0.62) * 0.9;
      if (light > dark) { out[0] = 190; out[1] = 188; out[2] = 200; out[3] = light * 60 * k; }
      else { var gr = damp * 0.6; out[0] = 12 + gr * 20; out[1] = 12 + gr * 30; out[2] = 16; out[3] = Math.min(255, Math.min(1, dark) * 150 * k); }
    });
  }
  // 石板瓦屋顶（多边形路径已建立后调用）：横向瓦行 + 错缝
  /* ======================= 透视铺石地面 ======================= */
  // o = { y0 远端 y, y1 近端 y, yh 地平线, vx 消失点 x, cw 远端石板宽, dz 每行深度步长, x0,x1 远端左右范围, base, seed, moss, wet, joint }
  var GRAIN = { c1: '#000000', c2: '#ffffff', scale: 32, oct: 3, seed: 77, contrast: 1.2 };
  function pavePersp(g, q, o) {
    var r = RNG(o.seed || 1), yh = o.yh, y0 = o.y0, y1 = o.y1 || H, vx = o.vx, cw = o.cw, dz = o.dz || 0.07;
    var base = o.base || '#4a4954', x0 = o.x0 === undefined ? -2000 : o.x0, x1 = o.x1 === undefined ? 4000 : o.x1;
    var ys = [], z = 1;
    while (true) { var y = yh + (y0 - yh) / z; ys.push(y); if (y > y1 + 2 || z <= dz) break; z -= dz * (q.model >= 1 ? 1 : 1.4); }
    function X(xf, y) { return vx + (xf - vx) * (y - yh) / (y0 - yh); }
    var cLo = Math.floor((x0 - vx) / cw) - 1, cHi = Math.ceil((x1 - vx) / cw) + 1;
    for (var k = 0; k < ys.length - 1; k++) {
      var ya = ys[k], yb = Math.min(ys[k + 1], y1 + 2), off = (k % 2) * 0.5 + r.range(-0.15, 0.15);
      for (var c = cLo; c <= cHi; c++) {
        var fa = vx + (c + off) * cw, fb = vx + (c + 1 + off) * cw;
        var t = r();
        K.poly(g, [X(fa, ya), ya, X(fb, ya), ya, X(fb, yb), yb, X(fa, yb), yb]);
        g.fillStyle = t < 0.5 ? K.rgba('#000000', 0.04 + t * 0.2) : K.rgba('#d8d8e8', (t - 0.5) * 0.12);
        g.fill();
      }
    }
    // 接缝
    g.beginPath();
    for (k = 0; k < ys.length; k++) { g.moveTo(-10, ys[k]); g.lineTo(W + 10, ys[k]); }
    for (k = 0; k < ys.length - 1; k++) {
      var ya2 = ys[k], yb2 = Math.min(ys[k + 1], y1 + 2), off2 = (k % 2) * 0.5;
      for (c = cLo; c <= cHi; c++) { var f = vx + (c + off2) * cw; g.moveTo(X(f, ya2), ya2); g.lineTo(X(f, yb2), yb2); }
    }
    g.strokeStyle = o.joint || 'rgba(14,13,18,0.75)'; g.lineWidth = 2.2; g.stroke();
    // 石板远边的受光细线
    if (q.light >= 1) {
      g.beginPath(); for (k = 1; k < ys.length; k++) { g.moveTo(-10, ys[k] + 1.6); g.lineTo(W + 10, ys[k] + 1.6); }
      g.strokeStyle = 'rgba(200,200,220,0.07)'; g.lineWidth = 1.2; g.stroke();
    }
    // 缝里的青苔
    if (o.moss && q.model >= 1) {
      g.beginPath();
      for (var m = 0; m < K.byModel(q, 0, 50, 110); m++) {
        var kk = 1 + (r() * (ys.length - 2) | 0), yy = ys[kk], mw = (6 + (yy - y0) * 0.1) * r.range(0.6, 1.8), mx = r.range(0, W);
        g.moveTo(mx + mw, yy); g.ellipse ? g.ellipse(mx, yy, mw, mw * 0.16, 0, 0, TAU) : g.arc(mx, yy, mw, 0, TAU);
      }
      g.fillStyle = o.moss; g.fill();
    }
    void base;
  }
  /* ======================= 石阶 ======================= */
  // 通用台阶：steps 为 [x0,x1,yTread,yRiserBottom] 数组（从远到近），颜色与材质
  // 透视石阶：steps 由远到近，每级 { xl, xr 前缘左右 x, y 前缘(踏面外沿) y, td 踏面可见深度, bl, br 踏面后缘左右 x, rh 立面高 }
  // 踏面受光（中间被踩得更亮更光滑、前缘有缺口），立面背光（上方有前缘投影、下方有 AO），两端与接缝长青苔
  function stairFlight(g, q, steps, o) {
    var r = RNG(o.seed || 7), moss = o.moss || 'rgba(70,90,52,0.6)';
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i], xl = s.xl, xr = s.xr, y = s.y, td = s.td, bl = s.bl, br = s.br, rh = s.rh, wv = xr - xl;
      // 踏面
      if (td > 0.5) {
        K.poly(g, [bl, y - td, br, y - td, xr, y, xl, y]); fillP(g, o.top);
        if (q.tex > 0) { K.poly(g, [bl, y - td, br, y - td, xr, y, xl, y]); texFill(g, q, 'noise', STEP_GRAIN, 128, xl, y, 0.35, 1, 1, null, 'overlay'); }
        K.poly(g, [bl, y - td, br, y - td, xr, y, xl, y]);
        fillP(g, K.lin(g, 0, y - td, 0, y, ['rgba(0,0,0,0.3)', 'rgba(220,220,236,0.06)', 'rgba(230,230,245,0.14)']));
        // 磨损：中间被踩得发亮
        if (q.model >= 1) {
          g.save(); K.poly(g, [bl, y - td, br, y - td, xr, y, xl, y]); g.clip();
          var cxm = (xl + xr) / 2 + (o.wearShift || 0);
          g.translate(cxm, y - td * 0.45); g.scale(1, Math.max(0.05, td / wv) * 1.2);
          g.fillStyle = K.rad(g, 0, 0, 0, wv * 0.32, [[0, 'rgba(225,225,240,0.16)'], [1, 'rgba(225,225,240,0)']]); g.fillRect(-wv * 0.4, -wv * 0.4, wv * 0.8, wv * 0.8);
          g.restore();
          // 石板接缝
          var nj = Math.max(1, Math.round(wv / 150));
          g.beginPath();
          for (var j = 1; j <= nj; j++) { var f = j / (nj + 1) + r.range(-0.06, 0.06); g.moveTo(lerp(bl, br, f), y - td); g.lineTo(lerp(xl, xr, f), y); }
          g.strokeStyle = 'rgba(16,15,20,0.6)'; g.lineWidth = 1.6; g.stroke();
        }
        if (o.wet && q.light >= 2) { K.poly(g, [bl, y - td, br, y - td, xr, y, xl, y]); fillP(g, K.lin(g, xl, 0, xr, 0, ['rgba(200,205,225,0)', 'rgba(200,205,225,0.12)', 'rgba(200,205,225,0)'])); }
      }
      // 立面
      rectP(g, xl, y, wv, rh); fillP(g, o.front);
      if (q.tex > 0) { rectP(g, xl, y, wv, rh); texFill(g, q, 'noise', STEP_GRAIN, 128, xl + 37, y, 0.4, 1, 1, null, 'overlay'); }
      rectP(g, xl, y, wv, rh);
      fillP(g, K.lin(g, 0, y, 0, y + rh, ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.45)']));
      // 前缘：受光的圆角 + 缺口
      g.fillStyle = K.rgba(o.edge || '#c4c2d0', q.light >= 1 ? 0.42 : 0.25); g.fillRect(xl, y - 1, wv, Math.max(1.5, rh * 0.08));
      if (q.model >= 1) {
        g.fillStyle = 'rgba(24,23,30,0.45)';
        for (var c = 0; c < 1 + (wv / 200 | 0); c++) { var cx = r.range(xl + 6, xr - 6), cw = r.range(4, 10); K.poly(g, [cx, y - 1, cx + cw, y - 1, cx + cw * 0.5, y + rh * 0.15]); g.fill(); }
      }
      // 青苔：两端与踏面后缘
      if (q.model >= 1) {
        g.beginPath();
        for (var m = 0; m < K.byModel(q, 0, 5, 9); m++) {
          // 青苔团：靠两端（墙脚）与踏面后缘（立面根部）的一簇小点
          var endSide = r() < 0.65, mx = endSide ? (r() < 0.5 ? xl + r.range(0, wv * 0.08) : xr - r.range(0, wv * 0.08)) : r.range(xl, xr);
          var my = y - td + r.range(0, Math.max(1, td * 0.35)), sc = 0.5 + rh / 50;
          for (var d2 = 0; d2 < 4; d2++) { var dx2 = mx + r.range(-10, 10) * sc, dy2 = my + r.range(-1, 2) * sc, dr = r.range(2, 5) * sc; g.moveTo(dx2 + dr, dy2); g.arc(dx2, dy2, dr, 0, TAU); }
        }
        g.fillStyle = moss; g.fill();
        if (q.model >= 2 && o.grass) grassTufts(g, q, r, 2, xl - 4, y - 2, 10, 2, o.grass, 10);
        if (q.model >= 2 && o.grass) grassTufts(g, q, r, 2, xr - 6, y - 2, 10, 2, o.grass, 10);
      }
    }
  }
  var STEP_GRAIN = { c1: '#000000', c2: '#ffffff', scale: 24, oct: 4, seed: 45, contrast: 1.3 };

  /* ======================= 雪 ======================= */
  var SN = { hi: '#f2f5fa', base: '#dce2ec', sh: '#a6aecb', shd: '#7a82a8', haze: '#c4c9d6' };
  var SNOW_T = { c1: '#000000', c2: '#ffffff', seed: 23 };
  // 点列按「点」倒序（不是按数字倒序）
  function revPts(a) { var o = []; for (var i = a.length - 2; i >= 0; i -= 2) o.push(a[i], a[i + 1]); return o; }
  // 把折线按步长加密（积雪轮廓需要足够的点做起伏）
  function densify(pts, step) {
    var out = [pts[0], pts[1]];
    for (var i = 2; i < pts.length; i += 2) {
      var ax = pts[i - 2], ay = pts[i - 1], bx = pts[i], by = pts[i + 1], d = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)), n = Math.max(1, Math.round(d / step));
      for (var k = 1; k <= n; k++) out.push(ax + (bx - ax) * k / n, ay + (by - ay) * k / n);
    }
    return out;
  }
  // 雪原：带透视的起伏（左上受光、背光面蓝紫）、风纹、远处融进雾色。o = { yh, seed, amp, hi, base, sh, haze, cx, flat, fog, fogK, freq, ripples, alpha }
  function snowField(g, q, x, y, w, h, o) {
    o = o || {};
    var hi = C(o.hi || SN.hi), bs = C(o.base || SN.base), sh = C(o.sh || SN.sh), sd = C(o.shd || SN.shd), hz = C(o.haze || SN.haze);
    var yh = o.yh === undefined ? y - 160 : o.yh, seed = o.seed || 3, amp = o.amp === undefined ? 1 : o.amp, oct = K.byModel(q, 2, 3, 4), cx = o.cx === undefined ? 960 : o.cx;
    var fr = o.freq || 1, rip = q.model >= 1 && o.ripples !== false, r = fres(q, o.res || 0.24);
    field(g, x, y, w, h, w * r, h * r, function (u, v, out) {
      var px = x + u * w, py = y + v * h, d = Math.max(6, py - yh), X = (px - cx) / d * 0.55 * fr, Z = 160 / d * fr * 2.6;
      if (o.flat) { X = px * 0.003 * fr; Z = py * 0.0026 * fr; }
      var e = 0.06;
      var h0 = fbm(X, Z * 2.2, oct, seed), h1 = fbm(X - e, Z * 2.2 - e * 0.6, oct, seed);
      var sl = (h1 - h0) * 10 * amp;
      var fz = sat(1 - (py - yh) / (o.fog || 260)); fz = fz * fz * (o.fogK === undefined ? 0.85 : o.fogK);
      var lum = 0.56 + sl + (h0 - 0.5) * 0.4 * amp;
      // 风纹：横向的细波，随透视变密，远处消失
      if (rip) { var rv = Z * (o.flat ? 9 : 30) + fbm(X * 2.4, Z * 3, 2, seed + 5) * 5; lum += (Math.sin(rv * PI) * 0.5) * 0.07 * (1 - fz) * sat(sl * 6 + 0.6); }
      lum = sat(lum);
      var R, G, B;
      if (lum > 0.56) { var t = (lum - 0.56) / 0.44; R = bs[0] + (hi[0] - bs[0]) * t; G = bs[1] + (hi[1] - bs[1]) * t; B = bs[2] + (hi[2] - bs[2]) * t; }
      else if (lum > 0.26) { var t2 = (0.56 - lum) / 0.3; R = bs[0] + (sh[0] - bs[0]) * t2; G = bs[1] + (sh[1] - bs[1]) * t2; B = bs[2] + (sh[2] - bs[2]) * t2; }
      else { var t3 = (0.26 - lum) / 0.26; R = sh[0] + (sd[0] - sh[0]) * t3; G = sh[1] + (sd[1] - sh[1]) * t3; B = sh[2] + (sd[2] - sh[2]) * t3; }
      out[0] = R + (hz[0] - R) * fz; out[1] = G + (hz[1] - G) * fz; out[2] = B + (hz[2] - B) * fz;
      if (o.alpha) out[3] = o.alpha(u, v) * 255;
    });
    if (q.tex > 0 && o.tex !== false) { rectP(g, x, y, w, h); texFill(g, q, 'snow', SNOW_T, 128, 0, 0, 0.1, null, null, null, 'overlay'); }
  }
  // 雪地上的冷色接触阴影（蓝紫，而不是黑）
  function blueContact(g, x, y, rx, ry, a) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    g.fillStyle = K.rad(g, 0, 0, 0, rx, [[0, 'rgba(70,80,128,' + (a === undefined ? 0.45 : a) + ')'], [0.6, 'rgba(80,90,140,' + ((a === undefined ? 0.45 : a) * 0.4) + ')'], [1, 'rgba(90,100,150,0)']]);
    g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  }
  // 堆在墙脚/物件脚下的雪：上缘起伏、受光，下缘与地面融合，正面略带蓝影
  function drift(g, q, x0, x1, base, hgt, seed, o) {
    o = o || {};
    var r = RNG(seed || 3), pts = [x0 - hgt * 0.8, base + hgt * 0.35], n = Math.max(3, Math.round((x1 - x0) / 40)), i;
    pts.push(x0 - hgt * 0.3, base - hgt * 0.5);
    for (i = 0; i <= n; i++) pts.push(x0 + (x1 - x0) * i / n, base - hgt * r.range(0.75, 1.15));
    pts.push(x1 + hgt * 0.3, base - hgt * 0.5, x1 + hgt * 0.8, base + hgt * 0.35);
    var top = pts.slice(2, pts.length - 2);
    g.beginPath(); smoothPath(g, pts, false); g.lineTo(x1 + hgt, base + hgt * 0.6); g.lineTo(x0 - hgt, base + hgt * 0.6); g.closePath();
    g.fillStyle = K.lin(g, 0, base - hgt * 1.1, 0, base + hgt * 0.6, [SN.hi, SN.base, K.rgba(SN.base, 0)]); g.fill();
    if (q.light >= 1) { g.beginPath(); smoothPath(g, top, false); strokeP(g, 'rgba(255,255,255,0.8)', Math.max(1.5, hgt * 0.08)); }
    if (o.shadow !== false && q.light >= 1) blueContact(g, (x0 + x1) / 2 + hgt * 0.4, base + hgt * 0.2, (x1 - x0) * 0.55 + hgt, hgt * 0.4, 0.22);
  }
  // 雪覆盖的山崖：大部分是雪，陡处露出纵向的暗色岩脉（左侧受光、右侧蓝紫阴影）
  // o = { seed, rock(0..1 露岩量), dark, mid, hz(远处雾化), fx, fy, lightX }
  function snowCliff(g, q, x, y, w, h, o) {
    o = o || {};
    var dk = C(o.dark || '#2c2f3a'), md = C(o.mid || '#5e6372'), hi = C(SN.hi), bs = C(SN.base), sh = C(SN.sh), hz = C(SKY.hor);
    var seed = o.seed || 7, rk = o.rock === undefined ? 0.5 : o.rock, fx = o.fx || 0.011, fy = o.fy || 0.0034, hzk = o.hz || 0, oct = K.byModel(q, 3, 4, 5);
    var r = fres(q, o.res || 0.3);
    field(g, x, y, w, h, w * r, h * r, function (u, v, out) {
      var px = x + u * w, py = y + v * h;
      var n = fbm(px * fx, py * fy, oct, seed), n2 = fbm((px - 6) * fx, py * fy, oct, seed);
      var rockA = sstep(0.62 - rk * 0.2, 0.68 - rk * 0.2, n + (o.bias ? o.bias(u, v) : 0));
      var lit = sat(0.55 + (n2 - n) * 12);
      var R, G, B;
      // 雪：朝左（受光）偏白，朝右偏蓝紫
      if (lit > 0.55) { var t = (lit - 0.55) / 0.45; R = bs[0] + (hi[0] - bs[0]) * t; G = bs[1] + (hi[1] - bs[1]) * t; B = bs[2] + (hi[2] - bs[2]) * t; }
      else { var t2 = (0.55 - lit) / 0.55; R = bs[0] + (sh[0] - bs[0]) * t2; G = bs[1] + (sh[1] - bs[1]) * t2; B = bs[2] + (sh[2] - bs[2]) * t2; }
      if (rockA > 0) {
        var rl = sat(0.3 + (n2 - n) * 14 + (fbm(px * 0.05, py * 0.02, 2, seed + 3) - 0.5) * 0.6);
        var rr = dk[0] + (md[0] - dk[0]) * rl, rg = dk[1] + (md[1] - dk[1]) * rl, rb = dk[2] + (md[2] - dk[2]) * rl;
        R += (rr - R) * rockA; G += (rg - G) * rockA; B += (rb - B) * rockA;
      }
      var hk = hzk * (o.hzv ? (1 - v) : 1);
      out[0] = R + (hz[0] - R) * hk; out[1] = G + (hz[1] - G) * hk; out[2] = B + (hz[2] - B) * hk;
    });
  }
  // 雪面上的闪光颗粒
  function sparkle(g, q, x, y, w, h, n, seed, test) {
    if (q.light < 2) return;
    var r = RNG(seed);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.beginPath();
    var stars = [];
    for (var i = 0; i < n; i++) {
      var px = x + r() * w, py = y + r() * h;
      if (test && !test(px, py)) continue;
      var s = r.range(0.6, 1.6);
      g.moveTo(px + s, py); g.arc(px, py, s, 0, TAU);
      if (r() < 0.06) stars.push(px, py, r.range(4, 9));
    }
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
    g.beginPath();
    for (i = 0; i < stars.length; i += 3) { g.moveTo(stars[i] - stars[i + 2], stars[i + 1]); g.lineTo(stars[i] + stars[i + 2], stars[i + 1]); g.moveTo(stars[i], stars[i + 1] - stars[i + 2]); g.lineTo(stars[i], stars[i + 1] + stars[i + 2]); }
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.stroke();
    g.restore();
  }
  // 踩出来的雪径：凹下去的带（受光一侧的内壁有阴影、另一侧亮），中间两道压实的车辙/踏痕，凌乱的脚印凹坑
  function trodPath(g, q, pts, w0, w1, seed, o) {
    o = o || {};
    var r = RNG(seed || 1), n = pts.length / 2, L = [], R = [], CL = [], CR = [], i;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1), x = pts[i * 2], y = pts[i * 2 + 1], nx = pts[Math.min(n - 1, i + 1) * 2] - pts[Math.max(0, i - 1) * 2], ny = pts[Math.min(n - 1, i + 1) * 2 + 1] - pts[Math.max(0, i - 1) * 2 + 1];
      var l = Math.sqrt(nx * nx + ny * ny) || 1, w = lerp(w0, w1, t) * r.range(0.92, 1.08), ux = -ny / l, uy = nx / l * 0.35;
      L.push(x + ux * w, y + uy * w); R.push(x - ux * w, y - uy * w);
      CL.push(x + ux * w * 0.35, y + uy * w * 0.35); CR.push(x - ux * w * 0.35, y - uy * w * 0.35);
    }
    var poly = L.concat(revPts(R));
    smoothPath(g, poly, true); fillP(g, K.lin(g, 0, pts[1], 0, pts[n * 2 - 1], [o.near || '#bcc3d6', o.far || '#c9cfde']));
    if (q.tex > 0) { smoothPath(g, poly, true); texFill(g, q, 'snow', SNOW_T, 96, 0, 0, 0.16, null, null, null, 'overlay'); }
    // 凹槽的内壁：一侧背光（蓝紫阴影带），另一侧受光
    g.save(); smoothPath(g, poly, true); g.clip();
    g.beginPath(); smoothPath(g, L, false); strokeP(g, K.rgba(SN.shd, 0.45), Math.max(4, w0 * 0.22));
    g.beginPath(); smoothPath(g, R, false); strokeP(g, 'rgba(255,255,255,0.45)', Math.max(3, w0 * 0.12));
    // 两道压实的踏痕（略暗、略亮的边）
    if (q.model >= 1 && o.ruts !== false) {
      g.beginPath(); smoothPath(g, CL, false); strokeP(g, K.rgba(SN.shd, 0.22), Math.max(3, w0 * 0.2));
      g.beginPath(); smoothPath(g, CR, false); strokeP(g, K.rgba(SN.shd, 0.22), Math.max(3, w0 * 0.2));
    }
    g.restore();
    // 两侧翻起的雪埂
    g.beginPath(); smoothPath(g, L, false); strokeP(g, 'rgba(252,253,255,0.9)', Math.max(2, w0 * 0.07));
    g.beginPath(); smoothPath(g, R, false); strokeP(g, 'rgba(240,244,250,0.75)', Math.max(2, w0 * 0.06));
    // 脚印凹坑：上沿暗、下沿亮
    if (o.prints !== false) {
      var m = K.byModel(q, 12, 26, 44), dk = [], lt = [];
      for (i = 0; i < m; i++) {
        var tt = r(), k = Math.min(n - 2, Math.floor(tt * (n - 1))), f = tt * (n - 1) - k, ww = lerp(w0, w1, tt);
        var px = lerp(pts[k * 2], pts[k * 2 + 2], f) + r.range(-0.55, 0.55) * ww, py = lerp(pts[k * 2 + 1], pts[k * 2 + 3], f) + r.range(-0.2, 0.2) * ww * 0.35, sz = Math.min(26, ww * 0.075);
        dk.push(px, py, sz); lt.push(px + sz * 0.15, py + sz * 0.3, sz);
      }
      g.beginPath(); for (i = 0; i < lt.length; i += 3) { g.moveTo(lt[i] + lt[i + 2], lt[i + 1]); g.ellipse ? g.ellipse(lt[i], lt[i + 1], lt[i + 2], lt[i + 2] * 0.45, 0, 0, TAU) : g.arc(lt[i], lt[i + 1], lt[i + 2], 0, TAU); }
      g.fillStyle = 'rgba(250,252,255,0.5)'; g.fill();
      g.beginPath(); for (i = 0; i < dk.length; i += 3) { g.moveTo(dk[i] + dk[i + 2], dk[i + 1]); g.ellipse ? g.ellipse(dk[i], dk[i + 1], dk[i + 2], dk[i + 2] * 0.42, 0, 0, TAU) : g.arc(dk[i], dk[i + 1], dk[i + 2], 0, TAU); }
      g.fillStyle = K.rgba(SN.shd, 0.42); g.fill();
    }
    return poly;
  }
  // 积雪盖：沿物体上缘（折线，左→右）堆一层圆润的雪，两端略悬出，下缘有少量垂坠。o = { over, seed, lit, drip, step, col }
  function snowCap(g, q, pts, th, o) {
    o = o || {};
    var r = RNG(o.seed || 5), over = o.over === undefined ? th * 0.6 : o.over, P = densify(pts, o.step || Math.max(12, th * 1.4)), n = P.length / 2, i;
    var top = [P[0] - over, P[1] + th * 0.2, P[0] - over * 0.7, P[1] - th * 0.55];
    for (i = 0; i < n; i++) top.push(P[i * 2], P[i * 2 + 1] - th * r.range(0.82, 1.12));
    top.push(P[(n - 1) * 2] + over * 0.7, P[(n - 1) * 2 + 1] - th * 0.55, P[(n - 1) * 2] + over, P[(n - 1) * 2 + 1] + th * 0.2);
    var bot = [];
    for (i = n - 1; i >= 0; i--) bot.push(P[i * 2], P[i * 2 + 1] + (o.drip && r() < 0.3 ? r.range(1, th * 0.35) : r.range(-1, 2)));
    var ymin = 1e9, ymax = -1e9;
    for (i = 1; i < top.length; i += 2) { if (top[i] < ymin) ymin = top[i]; }
    for (i = 1; i < bot.length; i += 2) { if (bot[i] > ymax) ymax = bot[i]; }
    function path() { smoothPath(g, top, false); for (var k = 0; k < bot.length; k += 2) g.lineTo(bot[k], bot[k + 1]); g.closePath(); }
    path();
    var c = o.col || SN.base;
    g.fillStyle = K.lin(g, 0, ymin, 0, ymax + 2, [o.hi || SN.hi, c, o.sh || SN.sh]); g.fill();
    if (q.light >= 1) {
      // 下缘的蓝紫阴影与上缘高光
      g.beginPath(); g.moveTo(bot[0], bot[1]); for (i = 2; i < bot.length; i += 2) g.lineTo(bot[i], bot[i + 1]);
      strokeP(g, K.rgba(o.shd || SN.shd, 0.45), Math.max(1.2, th * 0.18));
      g.beginPath(); g.moveTo(top[0], top[1]); for (i = 2; i < top.length * 0.6; i += 2) g.lineTo(top[i], top[i + 1]);
      strokeP(g, 'rgba(255,255,255,0.7)', Math.max(1, th * 0.12));
    }
    return top;
  }
  // 冰柱：一排长短不一的锥形冰柱，带高光
  function icicles(g, q, x0, x1, y, len, seed, dens) {
    var r = RNG(seed), x = x0 + r() * 6, step = K.byModel(q, 22, 14, 9) / (dens || 1), hl = [];
    g.beginPath();
    while (x < x1) {
      var L = 5 + len * Math.pow(r(), 1.7), w = 1.6 + L * 0.07;
      g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 0.25, y + L * 0.55, x + r.range(-1, 1), y + L); g.quadraticCurveTo(x + w * 0.25, y + L * 0.55, x + w, y); g.closePath();
      hl.push(x - w * 0.4, y + 2, L * 0.65);
      x += step * r.range(0.5, 1.6);
    }
    g.fillStyle = K.lin(g, 0, y, 0, y + len + 5, ['rgba(236,242,252,0.95)', 'rgba(196,210,234,0.88)', 'rgba(176,196,226,0.55)']); g.fill();
    if (q.light >= 1) {
      g.beginPath(); for (var i = 0; i < hl.length; i += 3) { g.moveTo(hl[i], hl[i + 1]); g.lineTo(hl[i] + 0.4, hl[i + 1] + hl[i + 2]); }
      strokeP(g, 'rgba(255,255,255,0.75)', 1);
    }
  }
  // 蒸汽（温泉、汤川）
  function steam(g, q, x, y, w, h, n, seed, a) {
    var r = RNG(seed), m = K.byModel(q, Math.ceil(n * 0.35), Math.ceil(n * 0.7), n);
    for (var i = 0; i < m; i++) {
      var t = Math.pow(r(), 0.8), px = x + r() * w + t * r.range(-30, 60), py = y + h - t * h, rr = 30 + t * 90 * r.range(0.6, 1.3);
      K.blob(g, px, py, rr, '#eef2f7', (a || 0.2) * (1 - t * 0.7) * r.range(0.5, 1));
    }
  }
  // 雪中的杉树：分层下垂的枝叶团，每团上面压着雪（受光面白、背光面蓝紫）
  function snowCedar(g, q, x, y, h, r, o) {
    o = o || {};
    var hz = o.haze || 0, hzc = o.hazeCol || SN.haze;
    var col = mixc(o.col || '#1d2824', hzc, hz), snw = mixc(o.snow || SN.base, hzc, hz * 0.6), shc = mixc(o.sh || SN.sh, hzc, hz * 0.6);
    var w = h * (o.wf || 0.2), tiers = K.byModel(q, 5, 8, 12), teeth = K.byModel(q, 3, 5, 7), base = y - h * (o.bare === undefined ? 0.22 : o.bare), top = y - h;
    K.poly(g, [x - h * 0.015, y, x + h * 0.015, y, x + h * 0.005, top + h * 0.1, x - h * 0.005, top + h * 0.1]); fillP(g, mixc('#2a2018', hzc, hz));
    var cl = [], i, k;
    g.beginPath();
    for (i = 0; i < tiers; i++) {
      var t = i / (tiers - 1), ty = base - (base - top) * Math.pow(t, 0.95), hw = w * Math.pow(1 - t * 0.92, 0.85) * r.range(0.8, 1.2);
      var nc = t > 0.75 ? 1 : 2 + (r() < 0.4 ? 1 : 0);
      for (k = 0; k < nc; k++) {
        var side = nc === 1 ? 0 : (k / (nc - 1) - 0.5) * 2;
        var cw = hw * (nc === 1 ? 0.9 : 0.62) * r.range(0.8, 1.1), cx = x + side * hw * 0.55 + r.range(-3, 3), cy = ty + Math.abs(side) * hw * 0.15;
        var ch = (base - top) / tiers * r.range(1.1, 1.5);
        sprayPath(g, cx, cy, cw, ch, teeth, ch * 0.4, r);
        cl.push(cx, cy, cw, ch);
      }
    }
    g.moveTo(x - w * 0.1, top + h * 0.06); g.lineTo(x, top - h * 0.02); g.lineTo(x + w * 0.1, top + h * 0.06); g.closePath();
    g.fillStyle = col; g.fill();
    // 枝上的积雪（每团的上缘）
    var amt = o.snowAmt === undefined ? 1 : o.snowAmt;
    g.beginPath();
    for (i = 0; i < cl.length; i += 4) {
      var sx = cl[i], sy = cl[i + 1], sw = cl[i + 2], sh2 = cl[i + 3] * amt;
      g.moveTo(sx - sw * 0.92, sy - sh2 * 0.1);
      g.quadraticCurveTo(sx - sw * 0.55, sy - sh2 * 1.12, sx + sw * 0.1, sy - sh2 * 1.02);
      g.quadraticCurveTo(sx + sw * 0.7, sy - sh2 * 0.85, sx + sw * 0.92, sy - sh2 * 0.15);
      g.quadraticCurveTo(sx + sw * 0.2, sy - sh2 * 0.5, sx - sw * 0.92, sy - sh2 * 0.1);
    }
    g.fillStyle = snw; g.fill();
    if (q.light >= 1) {
      g.beginPath();
      for (i = 0; i < cl.length; i += 4) {
        var bx = cl[i], by = cl[i + 1], bw = cl[i + 2], bh = cl[i + 3] * amt;
        g.moveTo(bx + bw * 0.1, by - bh * 1.0); g.quadraticCurveTo(bx + bw * 0.7, by - bh * 0.85, bx + bw * 0.92, by - bh * 0.15); g.quadraticCurveTo(bx + bw * 0.4, by - bh * 0.5, bx + bw * 0.05, by - bh * 0.6); g.closePath();
      }
      g.fillStyle = shc; g.fill();
    }
  }
  // 远山：山脊剪影 + 积雪 + 针叶林点画 + 空气透视。o = { x0, x1, hf(t)->y, base, seed, snow, forest, haze, trees(密度), ts(树大小) }
  function snowRange(g, q, o) {
    var pts = ridge(o.x0, o.x1, o.step || 14, o.hf, o.amp === undefined ? 10 : o.amp, o.seed || 1, o.freq || 0.01), i;
    var base = o.base;
    g.beginPath(); g.moveTo(o.x0, base);
    for (i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.lineTo(o.x1, base); g.closePath();
    g.fillStyle = K.lin(g, 0, o.top || base - 400, 0, base, [o.snow || '#eef1f7', mixc(o.snow || '#eef1f7', o.forest || '#3a4450', 0.25)]); g.fill();
    function ry(x) { var f = (x - o.x0) / (o.step || 14), k = Math.floor(f) * 2; if (k < 0) return pts[1]; if (k + 3 >= pts.length) return pts[pts.length - 1]; var t = f - Math.floor(f); return pts[k + 1] + (pts[k + 3] - pts[k + 1]) * t; }
    // 针叶林：按噪声成片分布的小树（暗色三角），上面一点白
    var r = RNG((o.seed || 1) * 7 + 3), n = Math.round((o.trees || 400) * (q.model <= 0 ? 0.35 : q.model === 1 ? 0.7 : 1)), ts = o.ts || 10, dk = [], wt = [];
    for (i = 0; i < n; i++) {
      var tx = o.x0 + r() * (o.x1 - o.x0), top = ry(tx), ty = top + r() * (base - top);
      var dens = fbm(tx * 0.006, ty * 0.01, 2, (o.seed || 1) + 9) + (ty - top) / (base - top) * 0.25;
      if (dens < (o.cut || 0.5)) continue;
      var s = ts * r.range(0.7, 1.3) * (0.7 + 0.5 * (ty - top) / (base - top));
      dk.push(tx, ty, s); if (r() < 0.7) wt.push(tx, ty, s);
    }
    g.beginPath(); for (i = 0; i < dk.length; i += 3) { g.moveTo(dk[i] - dk[i + 2] * 0.35, dk[i + 1]); g.lineTo(dk[i], dk[i + 1] - dk[i + 2]); g.lineTo(dk[i] + dk[i + 2] * 0.35, dk[i + 1]); g.closePath(); }
    g.fillStyle = o.forest || '#3a4450'; g.fill();
    if (q.model >= 1) { g.beginPath(); for (i = 0; i < wt.length; i += 3) { g.moveTo(wt[i] - wt[i + 2] * 0.18, wt[i + 1] - wt[i + 2] * 0.5); g.lineTo(wt[i], wt[i + 1] - wt[i + 2] * 0.95); g.lineTo(wt[i] + wt[i + 2] * 0.12, wt[i + 1] - wt[i + 2] * 0.55); g.closePath(); } g.fillStyle = K.rgba(o.snow || '#eef1f7', 0.75); g.fill(); }
    // 空气透视
    g.beginPath(); g.moveTo(o.x0, base); for (i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.lineTo(o.x1, base); g.closePath();
    g.fillStyle = K.lin(g, 0, o.top || base - 400, 0, base, [K.rgba(SKY.hor, o.haze === undefined ? 0.3 : o.haze), K.rgba(SKY.hor, (o.haze === undefined ? 0.3 : o.haze) * 1.6)]); g.fill();
    return pts;
  }
  // 远山（2～3 层重叠）：每层是积雪的山坡 + 沿等高线成带的暗色杉林 + 林间的雪斑 + 层与层之间的雾带
  // o = { top: 最远山脊的基准 y, base: 最近一层的底 y, seed, n 层数, amp }
  function mountainLayers(g, q, o) {
    var n = o.n || 3, base = o.base, seed = o.seed || 1, i, k;
    for (var L = 0; L < n; L++) {
      var t = L / Math.max(1, n - 1), y0 = lerp(o.top, o.base - (o.near || 160), t), hz = lerp(0.62, 0.12, t);
      var amp = (o.amp || 120) * lerp(0.8, 1.15, t), rr = RNG(seed + L * 17);
      var ph = rr.range(0, 6), f1 = rr.range(1.0, 1.8), f2 = rr.range(3, 5);
      var pts = ridge(-20, 1940, 12, function (tt) { return y0 - Math.sin(tt * PI * f1 + ph) * amp * 0.6 - Math.sin(tt * PI * f2 + ph * 2) * amp * 0.25; }, amp * 0.12, seed + L * 31, 0.012);
      var snowC = mixc('#eef1f7', SKY.hor, hz * 0.7), forC = mixc('#1e2a2a', SKY.hor, hz), shC = mixc('#a6aecb', SKY.hor, hz * 0.8);
      g.beginPath(); g.moveTo(-20, base + 40); for (k = 0; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]); g.lineTo(1940, base + 40); g.closePath();
      g.fillStyle = K.lin(g, 0, y0 - amp, 0, base, [snowC, shC]); g.fill();
      // 背光的山谷（竖向的蓝影）
      g.save(); g.clip();
      if (q.model >= 1) for (k = 0; k < 7; k++) { var gx = rr.range(0, 1920), gw = rr.range(60, 160); g.fillStyle = K.lin(g, gx - gw, 0, gx + gw, 0, [K.rgba(shC, 0), K.rgba(shC, 0.55), K.rgba(shC, 0)]); g.fillRect(gx - gw, y0 - amp, gw * 2, base - y0 + amp + 40); }
      // 杉林带：顶缘是锯齿状的树梢，沿山脊下方若干距离
      var bands = q.model >= 1 ? 2 : 1;
      for (var bI = 0; bI < bands; bI++) {
        var off = lerp(40, 110, bI) * lerp(0.6, 1.2, t) + rr.range(0, 30), ts = lerp(8, 18, t), fp = [];
        for (var x = -20; x <= 1940; x += ts * 0.7) {
          var ry = 0, kk = Math.floor((x + 20) / 12) * 2; kk = Math.max(0, Math.min(pts.length - 2, kk)); ry = pts[kk + 1];
          var gap = fbm(x * 0.004, bI * 3.1 + L, 2, seed + 7) < 0.4;
          var yy = ry + off + (fbm(x * 0.01, L + bI, 2, seed + 9) - 0.5) * 60;
          if (gap) yy += 80;
          fp.push(x, yy - ts * rr.range(0.6, 1.3), x + ts * 0.35, yy);
        }
        g.beginPath(); g.moveTo(-20, base + 40); for (k = 0; k < fp.length; k += 2) g.lineTo(fp[k], fp[k + 1]); g.lineTo(1940, base + 40); g.closePath();
        g.fillStyle = K.lin(g, 0, y0, 0, base, [forC, mixc(forC, SKY.hor, 0.15)]); g.fill();
        // 林中的积雪斑点
        if (q.model >= 1) {
          g.beginPath();
          for (k = 0; k < fp.length; k += 4) { var sx = fp[k], sy = fp[k + 1] + rr.range(4, 40); g.moveTo(sx - ts * 0.18, sy); g.lineTo(sx, sy - ts * 0.4); g.lineTo(sx + ts * 0.18, sy); }
          g.fillStyle = K.rgba(snowC, 0.55); g.fill();
        }
      }
      g.restore();
      // 层底的雾带
      g.fillStyle = K.lin(g, 0, base - (o.base - y0) * 0.55, 0, base + 30, [K.rgba(SKY.hor, 0), K.rgba(SKY.hor, 0.55 * (1 - t * 0.5))]); g.fillRect(-20, base - (o.base - y0) * 0.55, 1960, (o.base - y0) * 0.55 + 70);
      g.beginPath(); g.moveTo(-20, base + 40); for (k = 0; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]); g.lineTo(1940, base + 40); g.closePath();
      fillP(g, K.rgba(SKY.hor, hz * 0.35));
    }
    void i;
  }
  // 画面一角伸进来的带雪杉枝（前景）。x,y 为枝根（通常在画面外），ang 伸出方向
  function fgBranch(g, q, x, y, len, ang, seed, o) {
    o = o || {};
    var r = RNG(seed), dx = Math.cos(ang), dy = Math.sin(ang), i;
    g.strokeStyle = '#1a1410'; g.lineWidth = len * 0.03; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dx * len * 0.5, y + dy * len * 0.5 + len * 0.06, x + dx * len, y + dy * len + len * 0.12); g.stroke();
    var n = K.byModel(q, 8, 14, 20), cl = [];
    g.beginPath();
    for (i = 0; i < n; i++) {
      var t = 0.1 + r() * 0.9, bx = x + dx * len * t, by = y + dy * len * t + len * 0.1 * t * t, cw = len * 0.1 * (1.2 - t * 0.6) * r.range(0.7, 1.3), ch = cw * r.range(0.4, 0.6);
      var side = r() < 0.5 ? 1 : -1, cx = bx + (-dy) * side * cw * r.range(0.1, 0.5), cy = by + dx * side * cw * r.range(0.05, 0.3) + r.range(0, cw * 0.3);
      sprayPath(g, cx, cy, cw, ch, K.byModel(q, 4, 6, 8), ch * 0.7, r);
      cl.push(cx, cy, cw, ch);
    }
    g.fillStyle = o.col || '#141c1a'; g.fill();
    // 积雪：沿枝条上缘的一条起伏的雪脊（而不是一团团的雪盘）
    var top = [];
    for (i = 0; i < cl.length; i += 4) top.push([cl[i] - (-dy) * cl[i + 2] * 0.1, cl[i + 1] - cl[i + 3] * 0.75, cl[i + 3]]);
    top.sort(function (p1, p2) { return (p1[0] - x) * dx + (p1[1] - y) * dy - ((p2[0] - x) * dx + (p2[1] - y) * dy); });
    var tp = []; for (i = 0; i < top.length; i++) tp.push(top[i][0], top[i][1]);
    var wv = len * 0.035;
    g.beginPath(); smoothPath(g, tp, false); strokeP(g, o.sh || '#a8b0cc', wv * 1.25);
    g.beginPath(); smoothPath(g, tp, false); strokeP(g, o.snow || '#e8ecf4', wv);
    if (q.light >= 1) { var tp2 = []; for (i = 0; i < tp.length; i += 2) tp2.push(tp[i] - 1, tp[i + 1] - wv * 0.3); g.beginPath(); smoothPath(g, tp2, false); strokeP(g, 'rgba(255,255,255,0.9)', wv * 0.35); }
    // 枝梢零星的雪
    g.beginPath(); for (i = 0; i < cl.length; i += 8) { g.moveTo(cl[i] + cl[i + 2] * 0.4, cl[i + 1] - cl[i + 3] * 0.2); g.arc(cl[i] + cl[i + 2] * 0.3, cl[i + 1] - cl[i + 3] * 0.2, cl[i + 3] * 0.22, 0, TAU); } g.fillStyle = o.snow || '#e8ecf4'; g.fill();
  }
  // 层状岩壁：近水平的岩层（层面有积雪的平台）+ 竖向节理，轮廓清晰（场分辨率较高）
  // o = { seed, dip(倾角), band 层厚, rock, dark, mid, hz, snow(积雪量) }
  function strataCliff(g, q, x, y, w, h, o) {
    o = o || {};
    var dk = C(o.dark || '#1e2129'), md = C(o.mid || '#4a4e5c'), lt = C(o.lite || '#858a9c'), hi = C(SN.hi), sh = C(SN.sh), hz = C(SKY.hor);
    var seed = o.seed || 5, dip = o.dip || 0.08, band = o.band || 46, snw = o.snow === undefined ? 1 : o.snow, hzk = o.hz || 0, oct = K.byModel(q, 2, 3, 3);
    var r = fres(q, o.res || 0.36);
    field(g, x, y, w, h, w * r, h * r, function (u, v, out) {
      var px = x + u * w, py = y + v * h;
      var warp = (fbm(px * 0.002, py * 0.003, 3, seed) - 0.5) * band * 1.5 + (fbm(px * 0.014, py * 0.01, 2, seed + 1) - 0.5) * band * 0.5;
      var sc = (py + px * dip + warp) / band + fbm(px * 0.0015, py * 0.0015, 2, seed + 2) * 1.5, li = Math.floor(sc), f = sc - li;
      var tone = cellHash(li, 5, seed);
      // 竖向节理
      var jx = px / (band * (1.2 + cellHash(li, 9, seed) * 1.6)) + fbm(py * 0.01, li * 1.7, 2, seed + 3) * 1.6, jf = jx - Math.floor(jx), joint = sstep(0.05, 0, Math.min(jf, 1 - jf)) * 0.45 * (cellHash(li, 11, seed) < 0.7 ? 1 : 0);
      var face = fbm(px * 0.03, py * 0.012, oct, seed + 5);
      // 层的上缘受光（平台），下缘是悬垂的阴影
      var lum = 0.28 + tone * 0.34 + face * 0.32 - joint - (f > 0.78 ? (f - 0.78) * 2.6 : 0) + (f < 0.08 ? 0.18 : 0);
      lum = sat(lum);
      var R, G, B;
      if (lum < 0.5) { var t = lum * 2; R = dk[0] + (md[0] - dk[0]) * t; G = dk[1] + (md[1] - dk[1]) * t; B = dk[2] + (md[2] - dk[2]) * t; }
      else { var t2 = (lum - 0.5) * 2; R = md[0] + (lt[0] - md[0]) * t2; G = md[1] + (lt[1] - md[1]) * t2; B = md[2] + (lt[2] - md[2]) * t2; }
      // 层面平台上的积雪（每层上缘一道，宽度随噪声变化），陡处没有
      var ledge = sstep(0.0, 0.03, f) * sstep(0.26 + face * 0.2 * snw, 0.1, f) * Math.min(1, snw) * sstep(0.42, 0.58, fbm(px * 0.006, li * 2.3, 3, seed + 9) + 0.2 * snw) * (cellHash(li, 13, seed) < 0.75 ? 1 : 0.3);
      if (ledge > 0) { var sl2 = sat(0.6 + (face - 0.5)); var sr = sh[0] + (hi[0] - sh[0]) * sl2, sg = sh[1] + (hi[1] - sh[1]) * sl2, sb = sh[2] + (hi[2] - sh[2]) * sl2; R += (sr - R) * ledge; G += (sg - G) * ledge; B += (sb - B) * ledge; }
      var hk = hzk * (o.hzv ? (1 - v * 0.6) : 1);
      out[0] = R + (hz[0] - R) * hk; out[1] = G + (hz[1] - G) * hk; out[2] = B + (hz[2] - B) * hk;
    });
    if (q.tex > 0 && o.tex !== false) { rectP(g, x, y, w, h); texFill(g, q, 'rock', ROCK, 192, 0, 0, 0.22, null, null, null, 'overlay'); }
  }
  // 远处的冬季民家（简化）：雪顶 + 墙 + 窗
  function farHouse(g, q, x, base, w, h, o) {
    o = o || {};
    var rh = h * (o.thatch ? 0.9 : 0.55), wallC = o.wall || '#3a3430';
    rectP(g, x, base - h, w, h); fillP(g, wallC);
    if (o.lit) { var nw = Math.max(1, Math.round(w / 40)); for (var i = 0; i < nw; i++) { var wx = x + (i + 0.5) * w / nw - 5; if (o.lit === true || (o.lit > (i * 0.37 % 1))) { rectP(g, wx, base - h * 0.7, 10, h * 0.35); fillP(g, '#ffc678'); } } }
    K.poly(g, [x - w * 0.08, base - h, x + w * 0.5, base - h - rh, x + w * 1.08, base - h]); fillP(g, o.roof || '#6a5040');
    snowCap(g, q, [x - w * 0.08, base - h, x + w * 0.5, base - h - rh, x + w * 1.08, base - h], Math.max(3, h * 0.22), { seed: (x * 7 + base) | 0, over: w * 0.05, step: Math.max(10, w * 0.2) });
  }

  /* ======================= 通用：混凝土 / 木材 / 雪中小物 ======================= */
  var CONCRETE = { c1: '#000000', c2: '#ffffff', scale: 9, oct: 5, seed: 201, contrast: 1.1 };
  var OLD_WOOD = { c1: '#2a221c', c2: '#5c4e42', gap: '#120d0a', planks: 4, dir: 'v', ring: 2.2, seed: 203 };
  var DARK_WOOD = { c1: '#1e1814', c2: '#463a30', gap: '#0c0907', planks: 5, dir: 'v', ring: 2, seed: 205 };
  // 混凝土面：底色 + 纹理 + 雨水与锈的流痕
  function concrete(g, q, pathFn, x, y, w, h, base, seed, stains) {
    pathFn(); fillP(g, base || '#8a8c92');
    if (q.tex > 0) { pathFn(); texFill(g, q, 'noise', CONCRETE, 192, x, y, 0.12, 1, 1, null, 'overlay'); }
    if (q.model >= 1 && stains !== false) {
      g.save(); pathFn(); g.clip();
      var r = RNG(seed || 1);
      for (var i = 0; i < K.byModel(q, 0, 10, 18); i++) { var sx = x + r() * w, sl = r.range(40, h * 0.7), rust = r() < 0.25; g.fillStyle = K.lin(g, 0, y, 0, y + sl, [[0, rust ? 'rgba(110,64,36,0.35)' : 'rgba(30,30,36,0.28)'], [1, 'rgba(30,30,36,0)']]); g.fillRect(sx, y + r.range(0, 30), r.range(4, 22), sl); }
      g.restore();
    }
  }
  // 道路边的箭头雪杆（红白相间，顶部箭头指向路肩）
  function snowPole(g, q, x, base, h, dir) {
    var w = Math.max(2, h * 0.035), seg = h / 8;
    for (var i = 0; i < 8; i++) { rectP(g, x - w / 2, base - h + i * seg, w, seg); fillP(g, i % 2 ? '#e8e6e2' : '#c4342c'); }
    K.poly(g, [x, base - h - h * 0.02, x + dir * h * 0.22, base - h + h * 0.06, x + dir * h * 0.14, base - h + h * 0.1, x, base - h + h * 0.05]); fillP(g, '#d8362e');
    K.poly(g, [x, base - h + h * 0.05, x + dir * h * 0.14, base - h + h * 0.1, x + dir * h * 0.08, base - h + h * 0.14, x, base - h + h * 0.11]); fillP(g, '#f0eee8');
    snowCap(g, q, [x - w * 1.5, base - h - 1, x + w * 1.5, base - h - 1], w * 1.2, { over: w, seed: x | 0 });
  }
  // 雪墙（道路两侧铲起的雪堤），pts 为上缘折线（左→右），底边 y=base
  function snowBank(g, q, pts, base, o) {
    o = o || {};
    var top = densify(pts, 24), r = RNG(o.seed || 9), i, P = [];
    for (i = 0; i < top.length; i += 2) P.push(top[i], top[i + 1] + r.range(-4, 4));
    g.beginPath(); smoothPath(g, P, false); g.lineTo(P[P.length - 2], base); g.lineTo(P[0], base); g.closePath();
    var minY = 1e9; for (i = 1; i < P.length; i += 2) minY = Math.min(minY, P[i]);
    g.fillStyle = K.lin(g, o.lx === undefined ? 0 : o.lx, minY, o.lx === undefined ? 0 : o.lx2, base, o.stops || [SN.hi, SN.base, SN.sh]); g.fill();
    // 铲雪留下的层理与蓝紫阴影
    if (q.model >= 1) {
      g.save(); g.beginPath(); smoothPath(g, P, false); g.lineTo(P[P.length - 2], base); g.lineTo(P[0], base); g.closePath(); g.clip();
      g.strokeStyle = K.rgba(SN.shd, 0.25); g.lineWidth = 2; g.beginPath();
      for (var k = 0; k < K.byModel(q, 0, 4, 7); k++) { var yy = minY + 14 + k * (base - minY) / 8; g.moveTo(P[0], yy + r.range(-4, 4)); for (i = 2; i < P.length; i += 4) g.lineTo(P[i], yy + (P[i + 1] - minY) * 0.6 + r.range(-3, 3)); }
      g.stroke(); g.restore();
    }
    if (q.light >= 1) { g.beginPath(); smoothPath(g, P, false); strokeP(g, 'rgba(255,255,255,0.75)', 2.5); }
  }

  /* =================================================================
   * 旧隧道口 tunnel（对岸的巴士终点站；隧道口被雪崩堵住）
   * ================================================================= */
  function drawTunnel(g, q, v) {
    var r = RNG(3001);
    sky(g, q, { y: 0, h: 460, seed: 301, gx: 0.3, gy: 0.3, gw: 0.2, dens: 0.05 });
    mountainLayers(g, q, { top: 200, base: 560, seed: 31, amp: 120, near: 80 });
    // 隧道所在的陡坡
    var slope = [-20, 600, 160, 470, 380, 300, 560, 170, 760, 110, 1000, 86, 1220, 120, 1420, 200, 1640, 330, 1800, 430, 1940, 520, 1940, 1100, -20, 1100];
    g.save(); K.poly(g, slope); g.clip();
    snowField(g, q, -20, 80, 1960, 1000, { flat: true, seed: 33, amp: 0.9, fog: 1, freq: 1.4 });
    // 坡面上的岩石露头
    snowCliff(g, q, -20, 80, 1960, 760, { seed: 35, rock: 0.3, hz: 0.1, bias: function (u, vv) { return -Math.abs(u - 0.5) * 0.3 - vv * 0.25; } });
    g.restore();
    // 坡上的杉树（远→近）
    for (var i = 0; i < K.byModel(q, 10, 16, 24); i++) {
      var tx = r() < 0.5 ? r.range(-20, 560) : r.range(1360, 1940), ty = tx < 960 ? 600 - (tx + 20) * 0.75 + r.range(0, 260) : 200 + (tx - 1420) * 0.6 + r.range(0, 280);
      snowCedar(g, q, tx, ty, r.range(120, 260), r, { haze: 0.15 });
    }
    // 洞门（混凝土端墙 + 两侧翼墙）
    var cx = 960, top = 210, gnd = 832;
    function wings() { K.poly(g, [520, 330, 600, top + 10, 600, gnd, 470, gnd]); g.moveTo(1320, top + 10); g.lineTo(1400, 330); g.lineTo(1450, gnd); g.lineTo(1320, gnd); g.closePath(); }
    concrete(g, q, wings, 470, top, 980, gnd - top, '#7c7e86', 3003);
    wings(); fillP(g, 'rgba(10,12,20,0.25)');
    function head() { rectP(g, 600, top, 720, gnd - top); }
    concrete(g, q, head, 600, top, 720, gnd - top, '#8e9098', 3005);
    rectP(g, 600, top, 720, gnd - top); shadeLin(g, 600, 0, 1320, 0, [[0, 'rgba(255,255,255,0.08)'], [1, 'rgba(0,0,30,0.18)']]);
    // 拱圈（略突出的环带）与洞内
    var ax = 280, ay = 250, spring = 530;
    function arch(dx, dy) { g.beginPath(); g.moveTo(cx - ax - dx, gnd); g.lineTo(cx - ax - dx, spring); g.ellipse ? g.ellipse(cx, spring, ax + dx, ay + dy, 0, PI, 0) : g.arc(cx, spring, ax + dx, PI, 0); g.lineTo(cx + ax + dx, gnd); g.closePath(); }
    arch(34, 30); fillP(g, '#9a9ca4'); arch(34, 30); shadeLin(g, cx - ax, 0, cx + ax, 0, [[0, 'rgba(255,255,255,0.12)'], [1, 'rgba(0,0,20,0.2)']]);
    arch(0, 0); fillP(g, K.lin(g, 0, spring - ay, 0, gnd, ['#16181e', '#0c0d12', '#08090c']));
    g.save(); arch(0, 0); g.clip();
    // 洞内的衬砌环与湿痕
    g.strokeStyle = 'rgba(80,84,96,0.35)'; g.lineWidth = 3;
    for (var k = 1; k < 5; k++) { var f = 1 - k * 0.15; g.beginPath(); g.moveTo(cx - ax * f, gnd); g.lineTo(cx - ax * f, spring + (gnd - spring) * (1 - f) * 0.5); g.ellipse ? g.ellipse(cx, spring + (1 - f) * 60, ax * f, ay * f, 0, PI, 0) : g.arc(cx, spring, ax * f, PI, 0); g.lineTo(cx + ax * f, gnd); g.stroke(); }
    if (q.light >= 1) K.glow(g, cx, 300, 260, '#ffb060', 0.12);
    // 洞顶的冰柱
    icicles(g, q, cx - 220, cx + 220, 300, 70, 3007, 1.2);
    g.restore();
    // 雪崩堆积（堵住下半个洞口）
    if (v !== 'clear') drawAvalanche(g, q, cx, gnd);
    // 端墙顶的积雪与挑檐冰柱
    rectP(g, 590, top - 8, 740, 26); fillP(g, '#a2a4ac');
    snowCap(g, q, [584, top - 8, 1336, top - 8], 34, { seed: 3009, over: 26, drip: true });
    icicles(g, q, 600, 1320, top + 18, 96, 3011, 1);
    // 翼墙顶积雪
    snowCap(g, q, [470, 336, 520, 330, 600, top + 12], 22, { seed: 3013 }); snowCap(g, q, [1320, top + 12, 1400, 330, 1450, 336], 22, { seed: 3015 });
    // 钠灯
    K.line(g, cx, top + 40, cx, top + 70, 4, '#2a2a2e'); K.rr(g, cx - 26, top + 66, 52, 18, 6); fillP(g, '#3a3a40'); K.ellipse(g, cx, top + 86, 20, 6); fillP(g, '#ffcc7a');
    if (q.light >= 1) { K.glow(g, cx, top + 88, 140, '#ffb050', 0.32); K.pool(g, cx, 470, 220, 70, '#ffb050', 0.08); }
    drawTunnelRoad(g, q);
    drawBusStop(g, q, 268, 792);
    fgSnowbank(g, q, [-20, 990, 120, 960, 260, 1000, 340, 1090], 3051);
    fgSnowbank(g, q, [1600, 1090, 1700, 1000, 1840, 970, 1940, 980], 3053);
    K.vignette(g, W, H, q.light >= 1 ? 0.4 : 0.3, 0.5);
  }
  function drawAvalanche(g, q, cx, gnd) {
    var r = RNG(3021), i;
    // 雪崩堆：从洞口上方倾泻下来、在洞口前铺开的锥形堆积（上缘破碎，表面满是雪块）
    var pts = [640, gnd + 30];
    for (i = 0; i <= 22; i++) { var t = i / 22, x = 650 + t * 640; pts.push(x, 440 + Math.pow(Math.abs(t - 0.4) * 2.1, 1.25) * 300 + (fbm(t * 9, 1.3, 3, 3025) - 0.5) * 80); }
    pts.push(1290, gnd + 30);
    K.poly(g, pts);
    fillP(g, K.lin(g, 760, 440, 1180, gnd, ['#eef1f8', '#d6dcea', '#aab2cc']));
    if (q.tex > 0) { K.poly(g, pts); texFill(g, q, 'snow', SNOW_T, 96, 0, 0, 0.18, null, null, null, 'overlay'); }
    g.save(); K.poly(g, pts); g.clip();
    // 雪块（受光面亮、背光面蓝紫、底部接触阴影）
    var blocks = K.byModel(q, 14, 30, 52), list = [];
    for (i = 0; i < blocks; i++) list.push([r.range(660, 1270), r.range(470, gnd + 20), r.range(14, 52)]);
    list.sort(function (a2, b2) { return a2[1] - b2[1]; });
    for (i = 0; i < list.length; i++) {
      var bx = list[i][0], by = list[i][1], bs = list[i][2] * (0.6 + (by - 460) / 700), rot = r.range(-0.6, 0.6);
      g.save(); g.translate(bx, by); g.rotate(rot);
      if (q.light >= 1) { K.ellipse(g, bs * 0.2, bs * 0.45, bs * 1.1, bs * 0.25); fillP(g, 'rgba(90,100,140,0.25)'); }
      K.poly(g, [-bs, bs * 0.35, -bs * 0.8, -bs * 0.35, -bs * 0.1, -bs * 0.6, bs * 0.85, -bs * 0.25, bs, bs * 0.3, bs * 0.2, bs * 0.5]);
      fillP(g, '#e6eaf3');
      K.poly(g, [-bs * 0.1, -bs * 0.6, bs * 0.85, -bs * 0.25, bs, bs * 0.3, bs * 0.15, bs * 0.05]); fillP(g, '#b6bed6');
      K.poly(g, [-bs * 0.8, -bs * 0.35, -bs * 0.1, -bs * 0.6, bs * 0.15, bs * 0.05, -bs * 0.6, bs * 0.05]); fillP(g, '#f6f8fc');
      g.restore();
    }
    // 卷进去的折枝与碎冰
    g.strokeStyle = '#3a2c22'; g.lineWidth = 3.5; g.beginPath();
    for (i = 0; i < K.byModel(q, 2, 5, 8); i++) { var sx = r.range(720, 1200), sy = r.range(560, 800); g.moveTo(sx, sy); g.lineTo(sx + r.range(-60, 60), sy + r.range(-26, 10)); g.moveTo(sx + r.range(-20, 20), sy); g.lineTo(sx + r.range(-40, 40), sy - r.range(10, 30)); }
    g.stroke();
    g.restore();
    if (q.light >= 1) { g.beginPath(); g.moveTo(pts[2], pts[3]); for (i = 4; i < pts.length - 2; i += 2) g.lineTo(pts[i], pts[i + 1]); strokeP(g, 'rgba(255,255,255,0.75)', 3); }
    sparkle(g, q, 650, 440, 640, gnd - 420, 120, 3023);
  }
  function drawTunnelRoad(g, q) {
    var y0 = 826, vx = 960;
    // 路面（压实的雪，两道车辙）
    K.poly(g, [700, y0, 1220, y0, 1560, H, 360, H]);
    fillP(g, K.lin(g, 0, y0, 0, H, ['#cfd5e2', '#dfe4ee', '#e8ecf4']));
    if (q.tex > 0) { K.poly(g, [700, y0, 1220, y0, 1560, H, 360, H]); texFill(g, q, 'snow', SNOW_T, 128, 0, 0, 0.12, null, null, null, 'overlay'); }
    var ruts = [[0.3, 0.38], [0.62, 0.7]];
    for (var i = 0; i < ruts.length; i++) {
      var a0 = ruts[i][0], a1 = ruts[i][1];
      K.poly(g, [lerp(700, 1220, a0), y0, lerp(700, 1220, a1), y0, lerp(360, 1560, a1), H, lerp(360, 1560, a0), H]);
      fillP(g, K.lin(g, 0, y0, 0, H, ['rgba(120,128,150,0.35)', 'rgba(110,118,142,0.45)']));
      if (q.model >= 1) { g.strokeStyle = 'rgba(80,86,108,0.3)'; g.lineWidth = 1.5; g.beginPath(); for (var k = 0; k < 14; k++) { var t = Math.pow(k / 14, 1.5), y = y0 + (H - y0) * t, xa = lerp(lerp(700, 360, t), lerp(1220, 1560, t), a0), xb = lerp(lerp(700, 360, t), lerp(1220, 1560, t), a1); g.moveTo(xa, y); g.lineTo(xb, y + 2); } g.stroke(); }
    }
    // 两侧雪墙与箭头雪杆、护栏
    // 两侧的雪墙：顶面（亮）+ 朝路的斜面（左侧背光偏蓝、右侧受光）
    var Lw = [-20, 812, 300, 806, 560, 818, 700, 826, 700, 836, 352, H, -20, H];
    g.save(); K.poly(g, Lw); g.clip(); snowField(g, q, -20, 790, 740, 300, { yh: 700, seed: 3031, amp: 0.8 }); g.restore();
    K.poly(g, [700, 830, 712, 834, 372, H, 344, H]); fillP(g, 'rgba(120,128,166,0.45)');
    var Rw = [1220, 826, 1420, 818, 1700, 808, 1940, 814, 1940, H, 1568, H, 1220, 836];
    g.save(); K.poly(g, Rw); g.clip(); snowField(g, q, 1200, 790, 740, 300, { yh: 700, seed: 3033, amp: 0.8 }); g.restore();
    K.poly(g, [1208, 834, 1220, 830, 1576, H, 1548, H]); fillP(g, 'rgba(255,255,255,0.35)');
    var poles = [[640, 840, 90, 1], [520, 900, 140, 1], [380, 990, 210, 1], [1280, 840, 90, -1], [1400, 900, 140, -1], [1540, 990, 210, -1]];
    for (i = 0; i < poles.length; i++) snowPole(g, q, poles[i][0], poles[i][1], poles[i][2], poles[i][3]);
    // 护栏（右侧，谷侧）
    g.strokeStyle = '#8a8e96'; g.lineWidth = 6; g.beginPath(); g.moveTo(1240, 812); g.lineTo(1940, 836); g.stroke();
    g.strokeStyle = '#5a5e66'; g.lineWidth = 3; g.beginPath(); for (var px = 1260; px < 1940; px += 90) { g.moveTo(px, 812 + (px - 1240) * 0.034); g.lineTo(px, 846 + (px - 1240) * 0.034); } g.stroke();
    snowCap(g, q, [1240, 808, 1940, 832], 8, { seed: 3035, over: 4 });
    sparkle(g, q, 0, 830, W, 250, 260, 3037);
  }
  function drawBusStop(g, q, x, base) {
    if (q.light >= 1) K.contact(g, x + 6, base, 50, 10, 0.4);
    // 底座与立柱
    K.rr(g, x - 30, base - 22, 60, 22, 4); fillP(g, '#5a5c62');
    rectP(g, x - 5, base - 300, 10, 280); fillP(g, K.lin(g, x - 5, 0, x + 5, 0, ['#c8cacf', '#7a7c82']));
    // 圆形站牌
    K.ellipse(g, x, base - 290, 40, 40); fillP(g, '#e8e6e0'); K.ellipse(g, x, base - 290, 40, 40); strokeP(g, '#c43a2e', 6);
    rectP(g, x - 22, base - 302, 44, 20); fillP(g, '#2a4e8a'); K.ellipse(g, x - 12, base - 280, 5, 5); fillP(g, '#2a2a2e'); K.ellipse(g, x + 12, base - 280, 5, 5); fillP(g, '#2a2a2e');
    // 时刻表板
    rectP(g, x - 34, base - 230, 68, 92); fillP(g, '#e8e4d8'); rectP(g, x - 34, base - 230, 68, 92); strokeP(g, '#4a4c52', 3);
    if (q.model >= 1) { g.strokeStyle = 'rgba(40,40,50,0.6)'; g.lineWidth = 1.5; g.beginPath(); for (var k = 0; k < 7; k++) { g.moveTo(x - 26, base - 214 + k * 11); g.lineTo(x + (k % 3 === 0 ? 10 : 24), base - 214 + k * 11); } g.stroke(); rectP(g, x - 26, base - 226, 52, 8); fillP(g, '#2a4e8a'); }
    snowCap(g, q, [x - 40, base - 330, x + 40, base - 330], 14, { seed: 3041, over: 8 });
    snowCap(g, q, [x - 36, base - 232, x + 36, base - 232], 8, { seed: 3043, over: 4 });
    // 底部的雪堆
    K.ellipse(g, x, base - 6, 70, 22); fillP(g, K.lin(g, 0, base - 28, 0, base + 10, [SN.hi, SN.sh]));
  }
  DM.HDBG.def('tunnel', {
    outdoor: true,
    draw: function (g, q, v) { drawTunnel(g, q, v); },
    lights: [{ x: 960, y: 296, r: 160, color: '#ffb050', i: 0.5, flicker: 0.04, kind: 'lamp' }],
    key: { x: -0.4, color: '#e4e8f2', amb: '#5a6078', rim: 0.35 }
  });

  /* =================================================================
   * 白蛾桥 bridge（+ cut：主索在村侧锚碇断开，桥面垂进雪葬谷）
   * ================================================================= */
  function bridgeCurve(t, cut) {
    // 主索：从左侧桥塔顶到对岸桥塔顶的悬链线
    var x = lerp(200, 1712, t), y = lerp(372, 300, t) + Math.sin(t * PI) * 110;
    return [x, y];
  }
  function deckAt(t) { return [lerp(300, 1840, t), lerp(694, 586, t) - Math.sin(t * PI) * 6]; }
  function drawBridge(g, q, v) {
    var cut = v === 'cut', r = RNG(3101);
    sky(g, q, { y: 0, h: 760, seed: 311, gx: 0.42, gy: 0.28, gw: 0.2, dens: 0.04 });
    mountainLayers(g, q, { top: 230, base: 640, seed: 41, amp: 130, near: 100 });
    drawGorge(g, q, cut);
    // 对岸的山崖（隧道所在），岩面上的积雪落在朝上的岩块上
    var far = [1150, 1100, 1180, 900, 1230, 760, 1300, 640, 1380, 540, 1480, 460, 1600, 400, 1760, 350, 1940, 320, 1940, 1100];
    g.save(); K.poly(g, far); g.clip();
    strataCliff(g, q, 1140, 300, 800, 800, { seed: 45, dip: -0.12, band: 52, hz: 0.25, snow: 1 });
    haze(g, 1140, 300, 800, 800, SKY.hor, 0.05, 0.35);
    g.restore();
    if (q.light >= 1) { K.poly(g, far.slice(0, 18)); g.beginPath(); g.moveTo(far[0], far[1]); for (var e = 2; e < 18; e += 2) g.lineTo(far[e], far[e + 1]); strokeP(g, 'rgba(240,244,252,0.6)', 3); }
    for (var i = 0; i < K.byModel(q, 6, 10, 14); i++) { var tx0 = r.range(1300, 1940); snowCedar(g, q, tx0, 400 - (tx0 - 1300) * 0.12 + r.range(0, 40), r.range(70, 130), r, { haze: 0.45 }); }
    // 对岸的隧道口（小）
    var tx = 1720, ty = 470;
    rectP(g, tx - 90, ty - 150, 180, 160); fillP(g, '#9a9ca4');
    g.beginPath(); g.moveTo(tx - 60, ty + 10); g.lineTo(tx - 60, ty - 60); g.ellipse ? g.ellipse(tx, ty - 60, 60, 60, 0, PI, 0) : g.arc(tx, ty - 60, 60, PI, 0); g.lineTo(tx + 60, ty + 10); g.closePath(); fillP(g, '#1a1c22');
    snowCap(g, q, [tx - 96, ty - 152, tx + 96, ty - 152], 14, { seed: 3103 });
    icicles(g, q, tx - 90, tx + 90, ty - 138, 26, 3105, 1.4);
    rectP(g, tx - 90, ty - 152, 180, 162); fillP(g, K.rgba(SKY.hor, 0.32));
    // 近岸（左下）：向谷中落下的雪坡与岩壁
    var nearL = [-20, 680, 240, 676, 520, 700, 700, 760, 820, 880, 860, 1100, -20, 1100];
    g.save(); K.poly(g, nearL); g.clip();
    strataCliff(g, q, -20, 660, 900, 440, { seed: 49, dip: 0.1, band: 44, snow: 1.3 });
    g.restore();
    // 右侧近岸
    var nearR = [1540, 1100, 1580, 880, 1680, 770, 1940, 730, 1940, 1100];
    g.save(); K.poly(g, nearR); g.clip(); snowField(g, q, 1540, 720, 400, 380, { yh: 520, seed: 51, amp: 1 }); g.restore();
    // 桥面与吊索
    if (!cut) drawDeck(g, q); else drawCutDeck(g, q);
    // 左侧桥塔（石柱）与铭牌
    drawPillar(g, q, cut);
    // 锚碇与注连绳
    drawAnchor(g, q, cut);
    // 电话接线箱
    drawJunction(g, q, cut);
    fgSnowbank(g, q, [1500, 1090, 1580, 1030, 1700, 1000, 1940, 990], 3109);
    sparkle(g, q, 0, 700, 900, 380, 200, 3107);
    K.vignette(g, W, H, q.light >= 1 ? 0.42 : 0.3, 0.5);
  }
  function drawGorge(g, q, cut) {
    // 谷中：层层退远、越来越淡的岩壁剪影，谷底被雾吞没
    K.poly(g, [700, 700, 1300, 640, 1300, H, 700, H]); fillP(g, K.lin(g, 0, 640, 0, H, ['#aab0c0', '#8a92a6', '#727a8e']));
    var layers = [['#8a92a6', 0.7, 720], ['#747c92', 0.5, 800], ['#5e667c', 0.3, 880]];
    for (var k = 0; k < 3; k++) {
      var col = layers[k][0], y0 = layers[k][2], r = RNG(3111 + k);
      g.beginPath(); g.moveTo(560, H);
      for (var x = 560; x <= 1010; x += 30) g.lineTo(x, y0 - 60 + (x - 560) * 0.35 + r.range(-14, 14));
      g.lineTo(1010, H); g.closePath(); fillP(g, col);
      g.beginPath(); g.moveTo(1660, H);
      for (x = 1660; x >= 1180; x -= 30) g.lineTo(x, y0 - 80 + (1660 - x) * 0.3 + r.range(-14, 14));
      g.lineTo(1180, H); g.closePath(); fillP(g, col);
      // 岩壁上的雪线
      if (q.model >= 1) { g.strokeStyle = K.rgba('#e8ecf4', 0.35 + k * 0.1); g.lineWidth = 2; g.beginPath(); for (var j = 0; j < 8; j++) { var sx = r.range(580, 1640), sy = y0 + r.range(0, 160); if (sx > 1010 && sx < 1180) continue; g.moveTo(sx, sy); g.lineTo(sx + r.range(20, 60), sy - r.range(4, 16)); } g.stroke(); }
    }
    g.fillStyle = K.lin(g, 0, 760, 0, H, ['rgba(206,212,224,0)', 'rgba(206,212,224,0.6)', 'rgba(214,218,228,0.85)']); g.fillRect(560, 760, 1100, 320);
    steam(g, q, 640, 860, 960, 200, 18, 3111, 0.22);
    void cut;
  }
  function drawDeck(g, q) {
    var N = K.byModel(q, 22, 34, 46), i;
    // 远侧主索
    g.beginPath(); for (i = 0; i <= 40; i++) { var p = bridgeCurve(i / 40); if (i) g.lineTo(p[0] + 10, p[1] - 14 + i * 0.1); else g.moveTo(p[0] + 10, p[1] - 14); }
    strokeP(g, '#3a3c44', 3);
    // 吊索
    g.beginPath();
    for (i = 1; i < N; i++) { var t = i / N, c = bridgeCurve(t), d = deckAt(t); if (d[0] < 300) continue; g.moveTo(c[0], c[1]); g.lineTo(d[0], d[1] - 28 * (1 - t * 0.6)); }
    g.strokeStyle = 'rgba(40,42,50,0.8)'; g.lineWidth = 1.5; g.stroke();
    // 桥面（木板 + 侧梁 + 栏杆），越远越薄
    var top = [], bot = [];
    for (i = 0; i <= 30; i++) { var tt = i / 30, dd = deckAt(tt), th = lerp(26, 9, tt); top.push(dd[0], dd[1]); bot.push(dd[0], dd[1] + th); }
    g.beginPath(); g.moveTo(top[0], top[1]); for (i = 2; i < top.length; i += 2) g.lineTo(top[i], top[i + 1]); for (i = bot.length - 2; i >= 0; i -= 2) g.lineTo(bot[i], bot[i + 1]); g.closePath();
    fillP(g, K.lin(g, 0, 580, 0, 720, ['#4a3c32', '#2a221c']));
    // 桥面积雪
    snowCap(g, q, top.filter(function (_, k) { return k % 4 < 2; }), 7, { seed: 3121, over: 2, step: 30 });
    // 栏杆：竖杆 + 扶手索
    g.beginPath();
    for (i = 0; i <= 30; i++) { var t2 = i / 30, d2 = deckAt(t2), rh = lerp(42, 15, t2); g.moveTo(d2[0], d2[1]); g.lineTo(d2[0], d2[1] - rh); }
    g.strokeStyle = '#3a2e26'; g.lineWidth = 3; g.stroke();
    g.beginPath(); for (i = 0; i <= 30; i++) { var t3 = i / 30, d3 = deckAt(t3), rh3 = lerp(42, 15, t3); if (i) g.lineTo(d3[0], d3[1] - rh3); else g.moveTo(d3[0], d3[1] - rh3); }
    strokeP(g, '#2e2a2a', 3);
    // 桥灯（多数不亮）
    var lamps = [0.38, 0.47, 0.56, 0.65, 0.74, 0.83];
    for (i = 0; i < lamps.length; i++) {
      var dl = deckAt(lamps[i]), lh = lerp(110, 50, lamps[i]), sz = lerp(10, 6, lamps[i]), lit = i === 1 || i === 4;
      K.line(g, dl[0], dl[1], dl[0], dl[1] - lh, 2.5, '#2a2a30');
      K.rr(g, dl[0] - sz / 2, dl[1] - lh - sz * 1.6, sz, sz * 1.6, 2); fillP(g, lit ? '#ffd890' : '#4a4e5a');
      if (lit && q.light >= 1) K.glow(g, dl[0], dl[1] - lh - sz * 0.8, 46, '#ffb860', 0.4);
      snowCap(g, q, [dl[0] - sz * 0.7, dl[1] - lh - sz * 1.6, dl[0] + sz * 0.7, dl[1] - lh - sz * 1.6], 3, { seed: 3130 + i, over: 2 });
    }
    // 近侧主索（粗，带锈）
    g.beginPath(); for (i = 0; i <= 40; i++) { var pp = bridgeCurve(i / 40); if (i) g.lineTo(pp[0], pp[1]); else g.moveTo(pp[0], pp[1]); }
    strokeP(g, '#2a2c32', 6);
    if (q.light >= 1) { g.beginPath(); for (i = 0; i <= 40; i++) { var p2 = bridgeCurve(i / 40); if (i) g.lineTo(p2[0], p2[1] - 2); else g.moveTo(p2[0], p2[1] - 2); } strokeP(g, 'rgba(220,224,236,0.55)', 1.5); }
  }
  function drawCutDeck(g, q) {
    var i;
    // 对岸一端仍挂在桥塔上，村侧一端连同桥面垂进谷底
    function hang(t) { return [lerp(1712, 980, t), lerp(300, 1140, t * t * 0.85 + t * 0.15) + Math.sin(t * PI) * 30]; }
    function deckH(t) { return [lerp(1840, 1010, t), lerp(586, 1180, t * t * 0.7 + t * 0.3)]; }
    g.beginPath(); for (i = 0; i <= 30; i++) { var p = hang(i / 30); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } strokeP(g, '#2a2c32', 5);
    g.beginPath(); for (i = 0; i <= 30; i++) { var t = i / 30, c = hang(t), d = deckH(t); g.moveTo(c[0], c[1]); g.lineTo(d[0], d[1] - 20); } g.strokeStyle = 'rgba(40,42,50,0.7)'; g.lineWidth = 1.4; g.stroke();
    var top = [], bot = [];
    for (i = 0; i <= 30; i++) { var tt = i / 30, dd = deckH(tt), th = lerp(9, 30, tt); top.push(dd[0], dd[1]); bot.push(dd[0] + th * 0.8, dd[1] + th * 0.4); }
    g.beginPath(); g.moveTo(top[0], top[1]); for (i = 2; i < top.length; i += 2) g.lineTo(top[i], top[i + 1]); for (i = bot.length - 2; i >= 0; i -= 2) g.lineTo(bot[i], bot[i + 1]); g.closePath();
    fillP(g, '#3a2e26');
    g.beginPath(); for (i = 0; i <= 30; i += 2) { var d2 = deckH(i / 30); g.moveTo(d2[0], d2[1]); g.lineTo(d2[0] - lerp(12, 34, i / 30), d2[1] - lerp(12, 30, i / 30)); } strokeP(g, '#3a2e26', 3);
    // 断开的桥板碎片与雪雾
    var r = RNG(3141);
    for (i = 0; i < K.byModel(q, 3, 6, 9); i++) { var bx = r.range(1000, 1300), by = r.range(900, 1060); g.save(); g.translate(bx, by); g.rotate(r.range(-1, 1)); rectP(g, -16, -3, 32, 6); fillP(g, '#4a3c30'); g.restore(); }
    steam(g, q, 950, 900, 400, 180, 10, 3143, 0.25);
    // 桥灯垂挂
    for (i = 0; i < 4; i++) { var dl = deckH(0.15 + i * 0.18); K.line(g, dl[0], dl[1], dl[0] - 20, dl[1] - 40, 2, '#2a2a30'); K.rr(g, dl[0] - 26, dl[1] - 52, 9, 13, 2); fillP(g, '#4a4e5a'); }
  }
  function drawPillar(g, q, cut) {
    var x = 112, w = 160, top = 380, bot = 840;
    if (q.light >= 1) K.contact(g, x + w / 2 + 20, bot, 130, 18, 0.5);
    rectP(g, x, top, w, bot - top);
    mat(g, q, '#6a6872', 'stone', { c1: '#4a4854', c2: '#8a8894', mortar: '#2c2b32', rows: 5, cols: 2, seed: 311, irregular: 1, mortarW: 0.02 }, 192, x, top);
    rectP(g, x, top, w, bot - top); shadeLin(g, x, 0, x + w, 0, [[0, 'rgba(255,255,255,0.12)'], [0.5, 'rgba(0,0,0,0.05)'], [1, 'rgba(0,0,30,0.4)']]);
    // 柱头与鞍座
    rectP(g, x - 14, top - 30, w + 28, 32); fillP(g, K.lin(g, 0, top - 30, 0, top + 2, ['#9a98a4', '#5a5862']));
    rectP(g, x + 40, top - 56, 80, 28); fillP(g, '#3a3c44');
    snowCap(g, q, [x - 16, top - 30, x + w + 16, top - 30], 30, { seed: 3151, over: 18, drip: true });
    icicles(g, q, x - 10, x + w + 10, top + 2, 46, 3153, 1);
    // 铭牌（铜板，刻字以笔画暗示）
    var nx = 140, ny = 566, nw = 104, nh = 78;
    rectP(g, nx, ny, nw, nh); fillP(g, K.lin(g, nx, ny, nx + nw, ny + nh, ['#8a7444', '#5a4824', '#3a2e18']));
    rectP(g, nx + 6, ny + 6, nw - 12, nh - 12); strokeP(g, 'rgba(30,22,10,0.6)', 2);
    g.strokeStyle = 'rgba(30,22,10,0.75)'; g.lineWidth = 3; g.beginPath();
    for (var c = 0; c < 3; c++) { var cx = nx + 28 + c * 24; g.moveTo(cx - 7, ny + 18); g.lineTo(cx + 7, ny + 18); g.moveTo(cx, ny + 14); g.lineTo(cx, ny + 40); g.moveTo(cx - 8, ny + 30); g.lineTo(cx + 8, ny + 34); }
    g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(nx + 18, ny + 54); g.lineTo(nx + 86, ny + 54); g.moveTo(nx + 18, ny + 62); g.lineTo(nx + 70, ny + 62); g.stroke();
    if (q.light >= 2) { g.beginPath(); g.moveTo(nx + 4, ny + 4); g.lineTo(nx + nw - 4, ny + 4); strokeP(g, 'rgba(255,230,170,0.5)', 1.5); }
    g.fillStyle = 'rgba(70,110,90,0.35)'; g.fillRect(nx, ny + nh - 10, nw, 10);   // 铜绿
    // 主索穿过柱头向后斜下到锚碇
    if (!cut) { K.line(g, 200, 372, 470, 776, 6, '#2a2c32'); if (q.light >= 1) K.line(g, 198, 370, 468, 774, 1.5, 'rgba(220,224,236,0.5)'); }
    else { K.line(g, 200, 372, 330, 560, 6, '#2a2c32'); g.beginPath(); g.moveTo(330, 560); g.quadraticCurveTo(360, 640, 300, 700); strokeP(g, '#2a2c32', 6); }
    sparkle(g, q, x - 16, top - 60, w + 32, 40, 30, 3155);
  }
  function drawAnchor(g, q, cut) {
    var x0 = 250, y0 = 770, x1 = 670, y1 = 980;
    if (q.light >= 1) K.contact(g, (x0 + x1) / 2, y1, 240, 20, 0.5);
    function blk() { K.poly(g, [x0, y0 + 30, x0 + 60, y0, x1, y0 + 10, x1, y1, x0, y1]); }
    concrete(g, q, blk, x0, y0, x1 - x0, y1 - y0, '#848690', 3161);
    K.poly(g, [x0, y0 + 30, x0 + 60, y0, x1, y0 + 10, x1 - 30, y0 + 40]); fillP(g, 'rgba(255,255,255,0.12)');
    snowCap(g, q, [x0, y0 + 30, x0 + 60, y0, x1, y0 + 10], 26, { seed: 3163, over: 10 });
    // 锚具与钢索
    rectP(g, 440, 760, 60, 40); fillP(g, '#3a3c44'); K.ellipse(g, 470, 780, 14, 14); fillP(g, '#5a5c64');
    if (cut) {
      // 被剪断的钢丝：散开的亮色断头
      g.strokeStyle = '#2a2c32'; g.lineWidth = 6; g.beginPath(); g.moveTo(470, 776); g.lineTo(420, 700); g.stroke();
      g.strokeStyle = 'rgba(210,214,224,0.9)'; g.lineWidth = 1.2; g.beginPath(); for (var k = 0; k < 9; k++) { g.moveTo(420, 700); g.lineTo(420 + Math.cos(-2 + k * 0.25) * 22, 700 + Math.sin(-2 + k * 0.25) * 22); } g.stroke();
    }
    // 新的注连绳（缠在主索与锚碇上）+ 纸垂
    var sx = 330, sy = 700;
    g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(470, 770, 630, 712);
    g.strokeStyle = '#a89058'; g.lineWidth = 18; g.stroke(); g.strokeStyle = '#d4c48a'; g.lineWidth = 9; g.stroke();
    if (q.model >= 1) { g.strokeStyle = 'rgba(110,90,50,0.7)'; g.lineWidth = 2; g.beginPath(); for (var t = 0; t < 26; t++) { var f = t / 26, xx = lerp(sx, 630, f), yy = sy + Math.sin(f * PI) * 38 + (12 * f); g.moveTo(xx - 5, yy - 8); g.lineTo(xx + 5, yy + 8); } g.stroke(); }
    for (var i = 0; i < 4; i++) { var px = 370 + i * 70, py = 724 + Math.sin((i + 0.6) / 4.4 * PI) * 30; g.save(); g.translate(px, py); K.poly(g, [0, 0, 10, 0, 10, 12, 4, 12, 4, 26, 12, 26, 12, 40, 6, 40, 6, 52, 0, 52]); fillP(g, '#f0ece2'); g.restore(); }
    snowCap(g, q, [sx, sy - 8, 470, 760, 630, 704], 6, { seed: 3165, over: 4, step: 30 });
  }
  function drawJunction(g, q, cut) {
    // 电线杆与灰色接线箱
    var px = 1840, bx = 1660, by = 700;
    rectP(g, px - 9, 380, 18, 720); fillP(g, K.lin(g, px - 9, 0, px + 9, 0, ['#8a7a68', '#4a3e34']));
    K.line(g, px - 50, 420, px + 50, 420, 7, '#3a3028');
    snowCap(g, q, [px - 52, 416, px + 52, 416], 6, { seed: 3171 });
    // 电话线：从杆子拉向桥头
    g.beginPath(); g.moveTo(px - 40, 420); g.quadraticCurveTo(1300, 520, 300, 400); strokeP(g, 'rgba(20,20,26,0.7)', 1.6);
    K.line(g, bx + 70, by + 180, bx + 70, 1100, 10, '#6a6c72');
    if (q.light >= 1) K.contact(g, bx + 74, by + 192, 60, 10, 0.4);
    K.rr(g, bx, by, 140, 180, 6); fillP(g, K.lin(g, bx, 0, bx + 140, 0, ['#a8aab0', '#8a8c92', '#62646a']));
    g.strokeStyle = 'rgba(40,40,46,0.6)'; g.lineWidth = 2; g.strokeRect(bx + 10, by + 14, 120, 152);
    K.rr(g, bx + 110, by + 80, 10, 26, 3); fillP(g, '#3a3c42');
    if (q.model >= 1) { rectP(g, bx + 34, by + 30, 70, 22); fillP(g, '#e8e2c8'); g.fillStyle = '#c03a2e'; g.fillRect(bx + 40, by + 36, 10, 10); }
    snowCap(g, q, [bx - 6, by, bx + 146, by], 18, { seed: 3173, over: 8 });
    // 线缆从箱底接到杆上
    if (!cut) { g.beginPath(); g.moveTo(bx + 70, by + 180); g.quadraticCurveTo(1760, 900, px - 6, 620); strokeP(g, '#222228', 3); }
    else { g.beginPath(); g.moveTo(bx + 70, by + 180); g.quadraticCurveTo(1740, 930, 1770, 880); strokeP(g, '#222228', 3); g.strokeStyle = '#c87a3a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(1770, 880); g.lineTo(1778, 874); g.moveTo(1770, 880); g.lineTo(1776, 888); g.stroke(); g.beginPath(); g.moveTo(px - 6, 620); g.quadraticCurveTo(px - 30, 700, px - 20, 760); strokeP(g, '#222228', 3); }
  }
  DM.HDBG.def('bridge', {
    outdoor: true,
    draw: function (g, q, v) { drawBridge(g, q, v); },
    lights: function (v) { if (v === 'cut') return []; var L = [], ts = [0.47, 0.74]; for (var i = 0; i < 2; i++) { var d = deckAt(ts[i]); L.push({ x: d[0], y: d[1] - lerp(110, 50, ts[i]) - 6, r: 50, color: '#ffb860', i: 0.45, flicker: 0.1, kind: 'lamp' }); } return L; },
    key: { x: -0.35, color: '#e4e8f2', amb: '#5a6078', rim: 0.35 }
  });

  /* ======================= 一点透视的民家 ======================= */
  // o = { x 正面左缘, yb 正面底边 y, w, h 墙高, rh 山墙高, kb 后端缩放(0..1), side 'L'(位于路左，露出右侧面)|'R', vx, vy,
  //       roof 屋面色, wall, seed, wins [[fx, fy, fw, fh, lit]...] 正面窗（相对正面宽高的比例）, sideWins, snow 屋面积雪厚, stories }
  function perspHouse(g, q, o) {
    var vx = o.vx, vy = o.vy, x0 = o.x, x1 = o.x + o.w, yb = o.yb, yt = yb - o.h, ap = yt - o.rh, kb = o.kb, ov = o.w * 0.08, r = RNG(o.seed || 1);
    function P(x, y, k) { return [vx + (x - vx) * k, vy + (y - vy) * k]; }
    var sx = o.side === 'L' ? x1 : x0, sxo = o.side === 'L' ? x1 + ov : x0 - ov;
    var b0 = P(sx, yb, kb), b1 = P(sx, yt, kb), pa = P((x0 + x1) / 2, ap, kb), pe = P(sxo, yt + 4, kb);
    var wallC = o.wall || '#3c322a';
    // 侧面（朝路）
    K.poly(g, [sx, yb, sx, yt, b1[0], b1[1], b0[0], b0[1]]);
    mat(g, q, wallC, 'wood', DARK_WOOD, 128, 0, 0);
    K.poly(g, [sx, yb, sx, yt, b1[0], b1[1], b0[0], b0[1]]); fillP(g, o.side === 'L' ? 'rgba(10,12,24,0.45)' : 'rgba(255,255,255,0.04)');
    if (o.sideWins) {
      for (var sw = 0; sw < o.sideWins.length; sw++) {
        var f = o.sideWins[sw], ka = lerp(1, kb, f[0]), kc = lerp(1, kb, f[0] + f[2]), ya = yt + (yb - yt) * f[1], yc = ya + (yb - yt) * f[3];
        var q1 = P(sx, ya, ka), q2 = P(sx, ya, kc), q3 = P(sx, yc, kc), q4 = P(sx, yc, ka);
        K.poly(g, [q1[0], q1[1], q2[0], q2[1], q3[0], q3[1], q4[0], q4[1]]); fillP(g, f[4] ? '#ffc070' : '#2a2c34');
        if (f[4] && q.light >= 1) K.glow(g, (q1[0] + q3[0]) / 2, (q1[1] + q3[1]) / 2, Math.abs(q3[1] - q1[1]) * 1.6, '#ffb050', 0.3);
      }
    }
    // 正面（山墙面）
    K.poly(g, [x0, yb, x0, yt, (x0 + x1) / 2, ap, x1, yt, x1, yb]);
    mat(g, q, wallC, 'wood', DARK_WOOD, 128, x0, yt);
    K.poly(g, [x0, yb, x0, yt, (x0 + x1) / 2, ap, x1, yt, x1, yb]); fillP(g, K.lin(g, x0, 0, x1, 0, ['rgba(255,255,255,0.06)', 'rgba(0,0,20,0.2)']));
    // 二层分隔与正面窗
    if (o.stories === 2) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x0, yt + o.h * 0.48, o.w, 4); }
    var wins = o.wins || [];
    for (var i = 0; i < wins.length; i++) {
      var wn = wins[i], wx = x0 + o.w * wn[0], wy = yt + o.h * wn[1], ww = o.w * wn[2], wh = o.h * wn[3];
      rectP(g, wx - 3, wy - 3, ww + 6, wh + 6); fillP(g, '#1a1612');
      rectP(g, wx, wy, ww, wh); fillP(g, wn[4] ? K.lin(g, 0, wy, 0, wy + wh, ['#ffd690', '#ffb860']) : K.lin(g, wx, wy, wx + ww, wy + wh, ['#6a7084', '#2a2e3a']));
      if (q.model >= 1) { g.strokeStyle = wn[4] ? 'rgba(90,50,20,0.6)' : 'rgba(20,20,26,0.7)'; g.lineWidth = Math.max(1, ww * 0.05); g.beginPath(); for (var gx = 1; gx < 3; gx++) { g.moveTo(wx + ww * gx / 3, wy); g.lineTo(wx + ww * gx / 3, wy + wh); } g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke(); }
      if (wn[4] && q.light >= 1) K.glow(g, wx + ww / 2, wy + wh / 2, Math.max(ww, wh) * 1.3, '#ffb050', 0.3);
      // 窗台积雪
      snowCap(g, q, [wx - 4, wy + wh + 3, wx + ww + 4, wy + wh + 3], Math.max(2, wh * 0.08), { seed: (wx * 3 + wy) | 0, over: 2 });
    }
    // 雪围（下部黑色挡板）
    if (o.kakoi) { rectP(g, x0, yb - o.h * 0.42, o.w, o.h * 0.42); fillP(g, '#16130f'); if (q.model >= 1) { g.strokeStyle = 'rgba(80,70,60,0.5)'; g.lineWidth = 1.5; g.beginPath(); for (var kx = x0 + o.w / 10; kx < x1; kx += o.w / 10) { g.moveTo(kx, yb - o.h * 0.42); g.lineTo(kx, yb); } g.stroke(); } }
    // 屋面（朝路的一面）+ 积雪
    var e0 = [sxo, yt + 4], apx = (x0 + x1) / 2;
    K.poly(g, [apx, ap, e0[0], e0[1], pe[0], pe[1], pa[0], pa[1]]); fillP(g, o.roof || '#5a3a30');
    var sn = o.snow === undefined ? o.h * 0.22 : o.snow;
    var sp = [apx, ap - sn, e0[0] + (o.side === 'L' ? 4 : -4), e0[1] - sn * 0.3, pe[0], pe[1] - sn * 0.3 * kb, pa[0], pa[1] - sn * kb];
    K.poly(g, sp); fillP(g, K.lin(g, apx, ap, e0[0], e0[1], [SN.hi, SN.base, o.side === 'L' ? SN.sh : SN.base]));
    // 山墙边的积雪轮廓与悬垂
    snowCap(g, q, [x0 - ov, yt + 4, apx, ap, x1 + ov, yt + 4], sn, { seed: o.seed || 3, over: ov * 0.5, step: Math.max(12, o.w * 0.08), drip: true });
    if (o.ice !== false) icicles(g, q, x0 - ov * 0.8, x1 + ov * 0.8, yt + 6, Math.max(8, o.h * 0.25), (o.seed || 1) + 7, 0.8);
    // 门前的雪堆
    K.ellipse(g, (x0 + x1) / 2, yb, o.w * 0.62, o.h * 0.07); fillP(g, K.lin(g, 0, yb - o.h * 0.07, 0, yb + o.h * 0.07, [SN.hi, SN.sh]));
    void r;
  }

  /* =================================================================
   * 村道 village_road（+ past：1983 年）
   * ================================================================= */
  var VR = { vx: 980, vy: 470 };
  function vrEdge(side, y) { var t = (y - VR.vy) / (H - VR.vy); return VR.vx + ((side < 0 ? 620 : 1360) - VR.vx) * t; }
  function drawVillageRoad(g, q, v) {
    var past = v === 'past', r = RNG(past ? 4101 : 4103), vx = VR.vx, vy = VR.vy, i;
    sky(g, q, { y: 0, h: 560, seed: 401, gx: 0.55, gy: 0.3, gw: 0.2, dens: 0.05 });
    mountainLayers(g, q, { top: 300, base: 520, seed: 51, amp: 110, near: 60 });
    snowField(g, q, 0, 460, W, 620, { yh: 440, seed: 4105, amp: 0.55, fog: 160, freq: 1.6 });
    // 路两侧紧挨着的民家（立面朝路、随透视退远；深檐、厚雪、冰柱、亮窗）
    var left = [[0.07, 0.13], [0.13, 0.2], [0.2, 0.3], [0.3, 0.42], [0.42, 0.58]], right = [[0.07, 0.12], [0.12, 0.19], [0.19, 0.28], [0.28, 0.4], [0.4, 0.52], [0.52, 0.6]];
    var litL = past ? [1, 1, 1, 1, 1] : [0, 1, 0, 1, 0], litR = past ? [1, 1, 1, 1, 1, 1] : [1, 0, 0, 1, 0, 1];
    for (i = 0; i < left.length; i++) laneHouse(g, q, -1, left[i][0], left[i][1], litL[i], 4110 + i, past);
    for (i = 0; i < right.length; i++) laneHouse(g, q, 1, right[i][0], right[i][1], litR[i], 4120 + i, past);
    drawPoles(g, q, past);
    // 左：白峰屋门面与柴棚；右：汤川与涵洞
    drawInnFront(g, q, past);
    drawYukawaRoad(g, q);
    drawWetRoad(g, q, past);
    drawShed(g, q, past);
    K.vignette(g, W, H, q.light >= 1 ? 0.44 : 0.32, 0.5);
  }
  // 路边一栋（立面平行于路，向消失点退去）。side -1 左 / 1 右；ta,tb 为远、近两端的深度 t（0..1）
  function laneHouse(g, q, side, ta, tb, lit, seed, past) {
    var vx = VR.vx, vy = VR.vy, r = RNG(seed), i;
    function yg(t) { return vy + (H - vy) * t; }
    function xe(t) { return vx + ((side < 0 ? 620 : 1360) - vx) * t + side * 70 * t; }
    var hf = function (t) { return 560 * t * r.range(0.95, 1.0); }, H0 = hf(ta), H1 = hf(tb);
    var a0 = [xe(ta), yg(ta)], a1 = [xe(tb), yg(tb)];
    var face = [a0[0], a0[1], a1[0], a1[1], a1[0], a1[1] - 560 * tb, a0[0], a0[1] - 560 * ta];
    // 立面（木板墙 + 上部灰泥）
    K.poly(g, face); mat(g, q, '#3c3028', 'wood', DARK_WOOD, 96, 0, 0);
    K.poly(g, face); fillP(g, side < 0 ? 'rgba(10,12,28,0.42)' : 'rgba(255,250,240,0.04)');
    if (q.model >= 1) { g.save(); K.poly(g, face); g.clip(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.beginPath(); for (var k = 1; k < 4; k++) { var tk = lerp(ta, tb, k / 4); g.moveTo(xe(tk), yg(tk)); g.lineTo(xe(tk), yg(tk) - 560 * tk); } g.stroke(); g.restore(); }
    // 窗（透视的格子窗，部分亮着）
    var wins = [[0.15, 0.35], [0.55, 0.78]];
    for (i = 0; i < wins.length; i++) {
      var t0 = lerp(ta, tb, wins[i][0]), t1 = lerp(ta, tb, wins[i][1]), on = lit && (i === 1 || past);
      var q0 = [xe(t0), yg(t0) - 560 * t0 * 0.62], q1 = [xe(t1), yg(t1) - 560 * t1 * 0.62], q2 = [xe(t1), yg(t1) - 560 * t1 * 0.34], q3 = [xe(t0), yg(t0) - 560 * t0 * 0.34];
      K.poly(g, [q0[0], q0[1], q1[0], q1[1], q2[0], q2[1], q3[0], q3[1]]); fillP(g, on ? K.lin(g, 0, q1[1], 0, q2[1], ['#ffdc98', '#ffb860']) : '#2c3038');
      if (q.model >= 1) { g.strokeStyle = on ? 'rgba(90,50,20,0.55)' : 'rgba(10,10,14,0.6)'; g.lineWidth = Math.max(1, 3 * tb); g.beginPath(); for (k = 1; k < 3; k++) { var tm = lerp(t0, t1, k / 3); g.moveTo(xe(tm), yg(tm) - 560 * tm * 0.62); g.lineTo(xe(tm), yg(tm) - 560 * tm * 0.34); } g.stroke(); }
      if (on && q.light >= 1) K.glow(g, (q0[0] + q2[0]) / 2, (q0[1] + q2[1]) / 2, 120 * tb + 20, '#ffb050', 0.32);
    }
    // 下部的雪围板 + 墙脚的雪
    var kb = [a0[0], a0[1], a1[0], a1[1], a1[0], a1[1] - 560 * tb * 0.26, a0[0], a0[1] - 560 * ta * 0.26];
    K.poly(g, kb); fillP(g, '#15120f');
    if (q.model >= 1) { g.strokeStyle = 'rgba(90,80,64,0.45)'; g.lineWidth = 1.5; g.beginPath(); for (k = 1; k < 8; k++) { var tb2 = lerp(ta, tb, k / 8); g.moveTo(xe(tb2), yg(tb2)); g.lineTo(xe(tb2), yg(tb2) - 560 * tb2 * 0.26); } g.stroke(); }
    // 深檐：檐口向路伸出，屋面向外侧升起，上面压着厚雪
    function E(t) { return [xe(t) - side * 90 * t, yg(t) - 560 * t - 8 * t]; }
    function Rg(t) { return [xe(t) + side * 200 * t, yg(t) - 560 * t - 70 * t]; }
    var e0 = E(ta), e1 = E(tb), r0 = Rg(ta), r1 = Rg(tb), sn = 70;
    // 檐底（暗）
    K.poly(g, [face[6], face[7], face[4], face[5], e1[0], e1[1], e0[0], e0[1]]); fillP(g, '#1a1614');
    // 屋顶积雪的轮廓（从低处看不到屋面，只看到檐口上方隆起的一整块雪）
    var hump = [e0[0], e0[1] - sn * ta];
    var nh = 6; for (i = 0; i <= nh; i++) { var th = lerp(ta, tb, i / nh), ep2 = E(th), rp2 = Rg(th); hump.push(lerp(ep2[0], rp2[0], 0.35), lerp(ep2[1], rp2[1], 0.35) - sn * th * r.range(1.1, 1.5)); }
    hump.push(e1[0], e1[1] - sn * tb);
    smoothPath(g, hump, true); fillP(g, K.lin(g, 0, Rg(tb)[1] - sn * tb * 1.5, 0, e1[1], [SN.hi, SN.base]));
    if (q.tex > 0) { smoothPath(g, hump, true); texFill(g, q, 'snow', SNOW_T, 128, 0, 0, 0.12, null, null, null, 'overlay'); }
    // 檐口雪檐（厚、圆润、向下卷）
    K.poly(g, [e0[0], e0[1] - sn * ta, e1[0], e1[1] - sn * tb, e1[0], e1[1] + 6 * tb, e0[0], e0[1] + 6 * ta]);
    fillP(g, K.lin(g, 0, e1[1] - sn * tb, 0, e1[1] + 6 * tb, [SN.hi, SN.base, SN.sh]));
    g.beginPath(); g.moveTo(e0[0], e0[1] + 6 * ta); g.lineTo(e1[0], e1[1] + 6 * tb); strokeP(g, K.rgba(SN.shd, 0.6), Math.max(1.5, 6 * tb));
    g.beginPath(); g.moveTo(e0[0], e0[1] - sn * ta); g.lineTo(e1[0], e1[1] - sn * tb); strokeP(g, 'rgba(255,255,255,0.85)', Math.max(1.5, 4 * tb));
    // 冰柱（沿檐口，近大远小）
    if (q.model >= 0) {
      var n = Math.max(3, Math.round((tb - ta) * K.byModel(q, 60, 110, 170))), ice = [];
      g.beginPath();
      for (i = 0; i < n; i++) { var ti = lerp(ta, tb, (i + r()) / n), ep = E(ti), L = (8 + 90 * ti) * Math.pow(r(), 1.5) + 4 * ti, wv = 1.5 + L * 0.07; g.moveTo(ep[0] - wv, ep[1] + 6 * ti); g.lineTo(ep[0], ep[1] + 6 * ti + L); g.lineTo(ep[0] + wv, ep[1] + 6 * ti); ice.push(ep[0] - wv * 0.3, ep[1] + 8 * ti, L * 0.6); }
      g.fillStyle = 'rgba(214,226,244,0.88)'; g.fill();
      if (q.light >= 1) { g.beginPath(); for (i = 0; i < ice.length; i += 3) { g.moveTo(ice[i], ice[i + 1]); g.lineTo(ice[i], ice[i + 1] + ice[i + 2]); } strokeP(g, 'rgba(255,255,255,0.7)', 1); }
    }
    // 近端的山墙面（若与下一栋之间有空隙就看得见）
    var gq = [a1[0], a1[1], a1[0], a1[1] - 560 * tb, Rg(tb)[0], Rg(tb)[1], a1[0] + side * 300 * tb, a1[1] - 560 * tb, a1[0] + side * 300 * tb, a1[1]];
    K.poly(g, gq); mat(g, q, '#3a2e26', 'wood', DARK_WOOD, 96, 0, 0); K.poly(g, gq); fillP(g, 'rgba(0,0,10,0.25)');
    snowCap(g, q, [E(tb)[0], E(tb)[1] - sn * tb * 0.6, Rg(tb)[0], Rg(tb)[1] - sn * tb, a1[0] + side * 320 * tb, a1[1] - 560 * tb - 10 * tb], sn * tb * 0.8, { seed: seed + 3, over: 6 * tb, step: 40 });
    // 墙脚的积雪
    drift(g, q, Math.min(a0[0], a1[0]), Math.max(a0[0], a1[0]), yg((ta + tb) / 2), 40 * tb, seed + 5, { shadow: false });
    void H0; void H1;
  }
  function drawPoles(g, q, past) {
    var vx = VR.vx, vy = VR.vy, i;
    var ts = [0.14, 0.26, 0.44, 0.7];
    for (i = 0; i < ts.length; i++) {
      var t = ts[i], yb = vy + (H - vy) * t, x = vrEdge(1, yb) + 30 * t, hgt = 700 * t, w = Math.max(3, 16 * t);
      rectP(g, x - w / 2, yb - hgt, w, hgt); fillP(g, K.lin(g, x - w / 2, 0, x + w / 2, 0, ['#8a7a6a', '#4a3e34']));
      K.line(g, x - 60 * t, yb - hgt + 20 * t, x + 60 * t, yb - hgt + 20 * t, Math.max(2, 6 * t), '#3a3028');
      snowCap(g, q, [x - 62 * t, yb - hgt + 18 * t, x + 62 * t, yb - hgt + 18 * t], Math.max(2, 6 * t), { seed: 4130 + i });
      // 路灯
      if (i >= 1) { K.line(g, x, yb - hgt * 0.8, x - 70 * t, yb - hgt * 0.82, Math.max(1.5, 4 * t), '#3a3a3e'); K.ellipse(g, x - 70 * t, yb - hgt * 0.8, 10 * t, 5 * t); fillP(g, (past || i === 2) ? '#ffe0a0' : '#8a8e98'); if ((past || i === 2) && q.light >= 1) K.glow(g, x - 70 * t, yb - hgt * 0.79, 120 * t, '#ffb860', 0.35); }
    }
    // 电线
    g.strokeStyle = 'rgba(30,30,36,0.6)'; g.lineWidth = 1.4; g.beginPath();
    for (i = 0; i < ts.length - 1; i++) {
      var ta = ts[i], tb = ts[i + 1], ya = vy + (H - vy) * ta, yb2 = vy + (H - vy) * tb, xa = vrEdge(1, ya) + 30 * ta, xb = vrEdge(1, yb2) + 30 * tb;
      for (var k = -1; k <= 1; k += 2) { g.moveTo(xa + k * 50 * ta, ya - 700 * ta + 20 * ta); g.quadraticCurveTo((xa + xb) / 2, (ya - 700 * ta + yb2 - 700 * tb) / 2 + 30, xb + k * 50 * tb, yb2 - 700 * tb + 20 * tb); }
    }
    g.stroke();
    // 防灾广播喇叭（挂在近处的杆上）
    var t0 = 0.44, y0 = vy + (H - vy) * t0, x0 = vrEdge(1, y0) + 30 * t0;
    for (k = 0; k < 2; k++) { g.save(); g.translate(x0 + (k ? 10 : -10), y0 - 700 * t0 * 0.66); g.rotate(k ? 0.5 : -0.5 + PI); K.poly(g, [0, -6, 34, -16, 34, 16, 0, 6]); fillP(g, '#c8cad0'); K.ellipse(g, 34, 0, 4, 16); fillP(g, '#5a5c62'); g.restore(); }
    // 红色消防栓
    var hx = vrEdge(1, 900) + 70, hy = 900;
    if (q.light >= 1) K.contact(g, hx, hy, 30, 6, 0.4);
    K.rr(g, hx - 12, hy - 70, 24, 70, 4); fillP(g, K.lin(g, hx - 12, 0, hx + 12, 0, ['#e04a3a', '#a42a20']));
    K.ellipse(g, hx, hy - 72, 16, 8); fillP(g, '#b8342a'); K.rr(g, hx - 22, hy - 50, 44, 10, 4); fillP(g, '#c43a2e');
    snowCap(g, q, [hx - 16, hy - 76, hx + 16, hy - 76], 8, { seed: 4141, over: 4 });
    void past;
  }
  function drawInnFront(g, q, past) {
    var x0 = 40, x1 = 560, yb = 640, yt = 260, i;
    // 正面（两层，木造），侧面略露
    var B = [x1, yb, x1, yt, 640, 296, 640, 600];
    K.poly(g, B); mat(g, q, '#3a2e24', 'wood', DARK_WOOD, 128, 0, 0); K.poly(g, B); fillP(g, 'rgba(10,12,24,0.45)');
    rectP(g, x0, yt, x1 - x0, yb - yt); mat(g, q, '#4a3a2c', 'wood', OLD_WOOD, 160, x0, yt);
    rectP(g, x0, yt, x1 - x0, yb - yt); fillP(g, K.lin(g, x0, 0, x1, 0, ['rgba(255,240,220,0.06)', 'rgba(0,0,20,0.2)']));
    if (q.model >= 1) weatherField(g, q, x0, yt, x1 - x0, yb - yt, 4151, yb, past ? 0.5 : 1);
    // 二楼的格子窗（亮灯）与一楼的檐
    for (i = 0; i < 4; i++) {
      var wx = x0 + 30 + i * 124, wy = yt + 34, lit = past || i === 1 || i === 2;
      rectP(g, wx - 4, wy - 4, 100, 84); fillP(g, '#1a140e');
      rectP(g, wx, wy, 92, 76); fillP(g, lit ? K.lin(g, 0, wy, 0, wy + 76, ['#ffe0a0', '#ffb860']) : '#3a3a44');
      g.strokeStyle = '#2a1e14'; g.lineWidth = 3; g.beginPath(); for (var gx = 1; gx < 6; gx++) { g.moveTo(wx + gx * 92 / 6, wy); g.lineTo(wx + gx * 92 / 6, wy + 76); } g.moveTo(wx, wy + 38); g.lineTo(wx + 92, wy + 38); g.stroke();
      if (lit && q.light >= 1) K.glow(g, wx + 46, wy + 38, 110, '#ffb050', 0.25);
    }
    // 一楼的庇（带积雪）
    K.poly(g, [x0 - 20, yt + 160, x1 + 20, yt + 160, x1 + 40, yt + 196, x0 - 40, yt + 196]); fillP(g, '#3a3a44');
    snowCap(g, q, [x0 - 40, yt + 192, x0 - 20, yt + 160, x1 + 20, yt + 160, x1 + 40, yt + 192], 26, { seed: 4153, over: 12, drip: true });
    icicles(g, q, x0 - 36, x1 + 36, yt + 198, 60, 4155, 1);
    // 玄关：暖簾、提灯、玻璃格子门
    var dx = 190, dy = yt + 220, dw = 200, dh = yb - dy;
    rectP(g, dx, dy, dw, dh); fillP(g, K.lin(g, 0, dy, 0, yb, ['#ffcf88', '#e8a050']));
    g.strokeStyle = '#2a1e14'; g.lineWidth = 4; g.beginPath(); for (gx = 1; gx < 4; gx++) { g.moveTo(dx + gx * dw / 4, dy); g.lineTo(dx + gx * dw / 4, yb); } for (var gy = 1; gy < 4; gy++) { g.moveTo(dx, dy + gy * dh / 4); g.lineTo(dx + dw, dy + gy * dh / 4); } g.stroke();
    if (q.light >= 1) K.glow(g, dx + dw / 2, dy + dh / 2, 200, '#ffb050', 0.3);
    // 暖簾（藏青，三幅）
    for (i = 0; i < 3; i++) { K.poly(g, [dx + 6 + i * 64, dy - 6, dx + 66 + i * 64, dy - 6, dx + 64 + i * 64, dy + 58, dx + 8 + i * 64, dy + 60]); fillP(g, past ? '#2a3a6a' : '#26304e'); }
    if (q.model >= 1) { K.ellipse(g, dx + dw / 2, dy + 26, 18, 18); strokeP(g, '#e8e4d8', 3); }
    // 招牌（屋檐下的横匾，字用笔画暗示）
    rectP(g, x0 + 120, yt + 128, 280, 30); fillP(g, past ? '#5a3a20' : '#3a2a1a'); rectP(g, x0 + 120, yt + 128, 280, 30); strokeP(g, past ? '#c8a050' : '#7a6440', 2);
    g.strokeStyle = past ? '#f0d890' : '#c8b48a'; g.lineWidth = 3; g.beginPath(); for (var c = 0; c < 3; c++) { var cx = x0 + 200 + c * 60; g.moveTo(cx - 12, yt + 136); g.lineTo(cx + 12, yt + 136); g.moveTo(cx, yt + 132); g.lineTo(cx, yt + 154); g.moveTo(cx - 10, yt + 146); g.lineTo(cx + 10, yt + 150); } g.stroke();
    // 纸灯笼（门两侧）
    var lx = [dx - 30, dx + dw + 30];
    for (i = 0; i < 2; i++) {
      K.line(g, lx[i], yt + 196, lx[i], yt + 214, 2, '#1a1414');
      K.ellipse(g, lx[i], yt + 246, 22, 32); fillP(g, K.rad(g, lx[i] - 6, yt + 238, 3, 34, ['#fff0c8', '#f0a050', '#b04a2a']));
      g.fillStyle = '#1e1816'; g.fillRect(lx[i] - 16, yt + 212, 32, 6); g.fillRect(lx[i] - 16, yt + 276, 32, 6);
      if (q.light >= 1) K.glow(g, lx[i], yt + 246, 100, '#ffa850', 0.4);
    }
    // 屋顶：大的入母屋，厚积雪
    var rp = [x0 - 50, yt + 6, 300, 120, x1 + 50, yt + 6];
    K.poly(g, [x0 - 50, yt + 6, 150, 150, 450, 150, x1 + 50, yt + 6]); fillP(g, '#2e2c34');
    K.poly(g, [x1 + 50, yt + 6, 450, 150, 660, 210, 690, 300]); fillP(g, '#26242c');
    snowCap(g, q, [x0 - 60, yt + 8, 150, 140, 450, 140, x1 + 60, yt + 8], 46, { seed: 4157, over: 20, drip: true, step: 30 });
    snowCap(g, q, [x1 + 50, yt + 8, 450, 140, 660, 200, 696, 296], 40, { seed: 4159, over: 10, step: 30 });
    icicles(g, q, x0 - 50, x1 + 50, yt + 14, 80, 4161, 1.1);
    void rp;
  }
  function drawShed(g, q, past) {
    // 柴棚：带屋檐的开放式棚子，里面是祭典雪橇与柴垛
    var x0 = 160, x1 = 480, top = 616, bot = 770;
    if (q.light >= 1) K.contact(g, 320, bot, 190, 14, 0.5);
    rectP(g, x0, top, x1 - x0, bot - top); fillP(g, '#1c1612');
    // 柴垛
    var r = RNG(4171);
    for (var row = 0; row < 4; row++) for (var c = 0; c < 9; c++) { var lx = x0 + 18 + c * 15 + (row % 2) * 7, ly = bot - 18 - row * 15; K.ellipse(g, lx, ly, 7, 7); fillP(g, r() < 0.5 ? '#8a6a48' : '#a07a52'); K.ellipse(g, lx, ly, 3, 3); fillP(g, '#5a4028'); }
    // 雪橇（木制，带弯起的滑板）
    var sx = 330, sy = bot - 22;
    K.path(g, 'M0 0 L120 0 Q138 0 140 -16 Q142 -30 130 -34', sx, sy); strokeP(g, past ? '#a07040' : '#6a4a2c', 6);
    rectP(g, sx + 4, sy - 34, 110, 10); fillP(g, past ? '#b08050' : '#7a5838'); for (var k = 0; k < 4; k++) { rectP(g, sx + 10 + k * 30, sy - 26, 6, 26); fillP(g, '#5a3e24'); }
    // 柱与屋檐
    g.fillStyle = '#3a2e24'; g.fillRect(x0, top - 10, 12, bot - top + 10); g.fillRect(x1 - 12, top - 10, 12, bot - top + 10);
    K.poly(g, [x0 - 30, top - 4, x1 + 30, top - 4, x1 + 20, top - 24, x0 - 20, top - 24]); fillP(g, '#3a3a42');
    snowCap(g, q, [x0 - 30, top - 22, x1 + 30, top - 22], 34, { seed: 4173, over: 14, drip: true });
    icicles(g, q, x0 - 26, x1 + 26, top - 2, 50, 4175, 1);
    K.ellipse(g, 320, bot + 4, 220, 18); fillP(g, K.lin(g, 0, bot - 14, 0, bot + 20, [SN.hi, SN.sh]));
  }
  function drawWetRoad(g, q, past) {
    var vx = VR.vx, vy = VR.vy, i;
    // 路面
    var road = [vx - 6, vy + 8, vx + 6, vy + 8, 1360, H, 620, H];
    K.poly(g, road); fillP(g, K.lin(g, 0, vy, 0, H, ['#6a7080', '#3a3f4c', '#262a34']));
    if (q.tex > 0) { K.poly(g, road); texFill(g, q, 'noise', GRAIN, 128, 0, 0, 0.18, 1, 1, null, 'overlay'); }
    g.save(); K.poly(g, road); g.clip();
    // 消雪管的锈色水痕（东北常见的铁锈色路面）
    var r = RNG(4181);
    for (i = 0; i < K.byModel(q, 3, 6, 10); i++) { var t = r.range(0.1, 1), yy = vy + (H - vy) * t, xx = vx + (r.range(-0.6, 0.6) * 500) * t; g.save(); g.translate(xx, yy); g.scale(1, 0.12); K.blob(g, 0, 0, 260 * t, '#8a5030', 0.25); g.restore(); }
    // 倒影：灯笼、窗、路灯（暖色竖向拖影）
    var refl = [[160, 0.6], [420, 0.6], [740, 0.35], [1260, 0.4]];
    g.save(); g.globalCompositeOperation = 'lighter';
    for (i = 0; i < refl.length; i++) { var rx = refl[i][0]; g.fillStyle = K.lin(g, 0, 640, 0, H, ['rgba(255,170,90,0.0)', K.rgba('#ffaa5a', 0.22 * refl[i][1] * (past ? 1.4 : 1)), 'rgba(255,170,90,0)']); g.fillRect(rx - 16, 640, 32, 440); }
    // 天空的反光（远处更亮）
    g.fillStyle = K.lin(g, 0, vy, 0, 760, ['rgba(200,206,220,0.35)', 'rgba(200,206,220,0)']); g.fillRect(0, vy, W, 300);
    g.restore();
    // 水膜的波纹
    if (q.model >= 1) { g.strokeStyle = 'rgba(200,210,226,0.2)'; g.lineWidth = 1.2; g.beginPath(); for (i = 0; i < K.byModel(q, 0, 50, 90); i++) { var tt = Math.pow(r(), 0.8), y2 = vy + (H - vy) * tt, x2 = vx + r.range(-1, 1) * 520 * tt, l2 = 10 + 50 * tt; g.moveTo(x2 - l2, y2); g.quadraticCurveTo(x2, y2 - 2, x2 + l2, y2); } g.stroke(); }
    g.restore();
    // 消雪管喷嘴：沿路中线，喷出扇形的水
    var ds = [0.84, 0.6, 0.43, 0.31, 0.22, 0.155, 0.11];
    for (i = 0; i < ds.length; i++) {
      var d = ds[i], ny = vy + (H - vy) * d, nx = vx + (990 - vx) * d, span = 180 * d, hgt = 36 * d;
      K.ellipse(g, nx, ny, 6 * d + 1, 2.5 * d + 0.5); fillP(g, '#1a1c22');
      g.strokeStyle = 'rgba(226,234,246,0.6)'; g.lineWidth = Math.max(0.8, 2.4 * d); g.beginPath();
      for (var j = 0; j < 5; j++) { var f = 0.35 + j * 0.16; g.moveTo(nx, ny); g.quadraticCurveTo(nx - span * f * 0.5, ny - hgt * (1.2 - f * 0.4), nx - span * f, ny + 2 * d); g.moveTo(nx, ny); g.quadraticCurveTo(nx + span * f * 0.5, ny - hgt * (1.2 - f * 0.4), nx + span * f, ny + 2 * d); }
      g.stroke();
      if (q.light >= 1) { g.save(); g.translate(nx, ny); g.scale(1, 0.18); K.blob(g, 0, 0, span * 1.05, '#c8d4e6', 0.22); g.restore(); }
    }
    // 两侧雪墙（左墙朝路的面背光偏蓝，右墙朝路的面受光）
    var Lt = function (y) { return vrEdge(-1, y); }, Rt = function (y) { return vrEdge(1, y); };
    var hL = function (y) { return (y - vy) * 0.2; };
    var LW = [], RW = [];
    for (var y = vy + 30; y <= H + 40; y += 20) LW.push(Lt(y), y - hL(y) + Math.sin(y * 0.05) * 3);
    var lpoly = [Lt(vy + 30), vy + 30].concat(LW).concat([Lt(H + 40), H + 40]);
    K.poly(g, [Lt(vy + 24), vy + 24, Lt(H + 40), H + 40].concat(revPts(LW)));
    fillP(g, K.lin(g, 0, vy, 0, H, ['#b8c0d4', '#a2aac4', '#8e96b4']));
    if (q.tex > 0) { K.poly(g, [Lt(vy + 24), vy + 24, Lt(H + 40), H + 40].concat(revPts(LW))); texFill(g, q, 'snow', SNOW_T, 128, 0, 0, 0.14, null, null, null, 'overlay'); }
    for (y = vy + 30; y <= H + 40; y += 20) RW.push(Rt(y), y - hL(y) + Math.cos(y * 0.05) * 3);
    K.poly(g, [Rt(vy + 24), vy + 24, Rt(H + 40), H + 40].concat(revPts(RW)));
    fillP(g, K.lin(g, 0, vy, 0, H, ['#d4dae6', '#dce1ec', '#e2e6ef']));
    if (q.tex > 0) { K.poly(g, [Rt(vy + 24), vy + 24, Rt(H + 40), H + 40].concat(revPts(RW))); texFill(g, q, 'snow', SNOW_T, 128, 0, 0, 0.14, null, null, null, 'overlay'); }
    // 雪墙脚被消雪水浸湿的一道暗边
    g.beginPath(); g.moveTo(vx - 6, vy + 8); g.lineTo(620, H); strokeP(g, 'rgba(70,80,110,0.35)', 10); g.beginPath(); g.moveTo(vx + 6, vy + 8); g.lineTo(1360, H); strokeP(g, 'rgba(70,80,110,0.3)', 10);
    // 雪墙顶面
    g.beginPath(); smoothPath(g, LW, false); strokeP(g, 'rgba(255,255,255,0.85)', 3);
    g.beginPath(); smoothPath(g, RW, false); strokeP(g, 'rgba(255,255,255,0.9)', 3);
    // 铲雪痕（层理）
    if (q.model >= 1) {
      g.strokeStyle = K.rgba(SN.shd, 0.22); g.lineWidth = 2; g.beginPath();
      for (var k = 1; k < 4; k++) { for (y = vy + 60; y <= H; y += 30) { var a = y - hL(y) * k / 4; if (y === vy + 60) g.moveTo(Lt(y), a); else g.lineTo(Lt(y), a); } }
      g.stroke();
    }
    // 路边的湿边线
    g.beginPath(); g.moveTo(vx - 6, vy + 8); g.lineTo(620, H); g.moveTo(vx + 6, vy + 8); g.lineTo(1360, H); strokeP(g, 'rgba(20,22,28,0.6)', 3);
    void lpoly;
  }
  function drawYukawaRoad(g, q) {
    // 汤川：从右侧山坡流下，穿过路下的涵洞
    var r = RNG(4191);
    var bankR = [1500, 520, 1940, 470, 1940, 1100, 1480, 1100];
    g.save(); K.poly(g, bankR); g.clip(); snowField(g, q, 1480, 460, 460, 640, { yh: 300, seed: 4193, amp: 1.1 }); g.restore();
    // 溪道（不积雪的暗色流水）
    var L = [], R = [], i;
    for (i = 0; i <= 12; i++) { var t = i / 12, cx = lerp(1880, 1610, t) + Math.sin(t * 5) * 20, cy = lerp(560, 900, t), w = lerp(36, 110, t); L.push(cx - w, cy); R.push(cx + w * 0.8, cy + w * 0.12); }
    var water = L.concat(revPts(R));
    smoothPath(g, water, true); fillP(g, K.lin(g, 0, 560, 0, 900, ['#3a4656', '#28323e', '#1e2630']));
    g.save(); smoothPath(g, water, true); g.clip();
    g.strokeStyle = 'rgba(200,214,230,0.35)'; g.lineWidth = 2; g.beginPath();
    for (i = 0; i < K.byModel(q, 10, 24, 40); i++) { var tt = r(), x = lerp(1880, 1610, tt) + r.range(-60, 60) * (0.4 + tt), y = lerp(560, 900, tt); g.moveTo(x - 14, y); g.quadraticCurveTo(x, y - 3, x + 16, y + 2); }
    g.stroke();
    // 溪底的白色汤花
    for (i = 0; i < 10; i++) { var t2 = r(); K.ellipse(g, lerp(1880, 1610, t2) + r.range(-30, 30), lerp(560, 900, t2), r.range(6, 16), r.range(2, 5)); fillP(g, 'rgba(220,226,214,0.25)'); }
    g.restore();
    // 两岸的雪檐（伸出水面、底部被热气融成圆角）
    g.beginPath(); smoothPath(g, L, false); strokeP(g, SN.hi, 10); g.beginPath(); smoothPath(g, L, false); strokeP(g, K.rgba(SN.shd, 0.5), 3);
    g.beginPath(); smoothPath(g, R, false); strokeP(g, SN.base, 10);
    // 涵洞（混凝土端墙 + 圆管口）
    var cx2 = 1620, cy2 = 920;
    function wall() { K.poly(g, [1488, 840, 1768, 830, 1768, 990, 1488, 990]); }
    concrete(g, q, wall, 1488, 830, 280, 160, '#8a8c94', 4195);
    K.ellipse(g, cx2, cy2, 72, 58); fillP(g, '#0e1014');
    K.ellipse(g, cx2, cy2, 72, 58); strokeP(g, '#6a6c74', 8);
    g.save(); K.ellipse(g, cx2, cy2, 66, 52); g.clip(); K.poly(g, [1540, 940, 1700, 940, 1700, 990, 1540, 990]); fillP(g, '#2a3440'); g.restore();
    snowCap(g, q, [1484, 836, 1772, 826], 20, { seed: 4197, over: 8 });
    icicles(g, q, 1500, 1760, 846, 36, 4199, 0.8);
    // 蒸汽
    steam(g, q, 1520, 600, 360, 360, 20, 4201, 0.22);
  }
  DM.HDBG.def('village_road', {
    outdoor: true,
    draw: function (g, q, v) { drawVillageRoad(g, q, v); },
    lights: function (v) {
      var L = [{ x: 160, y: 506, r: 110, color: '#ffa850', i: 0.6, flicker: 0.12, kind: 'lamp' }, { x: 420, y: 506, r: 110, color: '#ffa850', i: 0.6, flicker: 0.12, kind: 'lamp' },
        { x: 290, y: 560, r: 160, color: '#ffc070', i: 0.45, flicker: 0, kind: 'window' }, { x: 240, y: 332, r: 100, color: '#ffc070', i: 0.4, flicker: 0, kind: 'window' }, { x: 364, y: 332, r: 100, color: '#ffc070', i: 0.4, flicker: 0, kind: 'window' }];
      if (v === 'past') { L.push({ x: 116, y: 332, r: 100, color: '#ffc070', i: 0.4, flicker: 0, kind: 'window' }); L.push({ x: 488, y: 332, r: 100, color: '#ffc070', i: 0.4, flicker: 0, kind: 'window' }); }
      return L;
    },
    key: { x: -0.3, color: '#e2e6f0', amb: '#56607a', rim: 0.35 }
  });

  /* ======================= 露天温泉的部件 ======================= */
  var ONSEN = { deep: '#3f6e74', mid: '#7aa8a8', hi: '#c4dcd6' };
  // 不规则池子：返回轮廓点
  function poolShape(cx, cy, rx, ry, seed) {
    var pts = [];
    for (var i = 0; i < 28; i++) { var a = i / 28 * TAU, k = 0.78 + fbm(Math.cos(a) * 1.4 + 3, Math.sin(a) * 1.4, 3, seed) * 0.45; pts.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
    return pts;
  }
  // 乳白泛蓝的温泉：水面反射天光、靠岸处暗，池缘一圈湿的深色岩石（后岸大、前岸小，后岸岩顶有雪）
  function onsenPool(g, q, pts, cx, cy, rx, ry, seed) {
    var r = RNG(seed), i, n = pts.length / 2;
    // 后岸的大石（先画，被水面遮住下部）
    var back = [];
    for (i = 0; i < n; i++) { var py = pts[i * 2 + 1]; if (py < cy - ry * 0.25) back.push(i); }
    for (i = 0; i < back.length; i += 1) { var k = back[i], bx = pts[k * 2], by = pts[k * 2 + 1], bw = r.range(70, 150), bh = bw * r.range(0.45, 0.7); wetRock(g, q, bx, by + bh * 0.2, bw, bh, seed * 7 + i, true); }
    smoothPath(g, pts, true); fillP(g, '#1e2a2e');
    g.save(); smoothPath(g, pts, true); g.clip();
    g.fillStyle = K.lin(g, 0, cy - ry, 0, cy + ry, [ONSEN.deep, ONSEN.mid, ONSEN.hi]); g.fillRect(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry * 2.6);
    // 天光的反射（中间偏后）与后岸岩石的倒影
    g.save(); g.translate(cx, cy + ry * 0.1); g.scale(1, 0.32); K.blob(g, 0, 0, rx * 0.8, '#e8f2f0', 0.45); g.restore();
    g.fillStyle = K.lin(g, 0, cy - ry, 0, cy - ry * 0.3, ['rgba(16,30,34,0.6)', 'rgba(16,30,34,0)']); g.fillRect(cx - rx * 1.3, cy - ry * 1.3, rx * 2.6, ry);
    if (q.model >= 1) {
      g.strokeStyle = 'rgba(240,248,246,0.35)'; g.lineWidth = 1.4; g.beginPath();
      for (i = 0; i < K.byModel(q, 0, 18, 30); i++) { var px = cx + r.range(-0.75, 0.75) * rx, pyy = cy + r.range(-0.4, 0.7) * ry, l = r.range(14, 46); g.moveTo(px - l, pyy); g.quadraticCurveTo(px, pyy - 2, px + l, pyy); }
      g.stroke();
    }
    smoothPath(g, pts, true); strokeP(g, 'rgba(16,30,34,0.5)', 22);
    g.restore();
    // 前岸与两侧的石头（小、湿）
    for (i = 0; i < n; i++) {
      var py2 = pts[i * 2 + 1]; if (py2 < cy - ry * 0.25 || (py2 > cy + ry * 0.3 && i % 2)) continue;
      var bx2 = pts[i * 2], bw2 = r.range(40, 90) * (py2 > cy + ry * 0.5 ? 0.9 : 1.1), bh2 = bw2 * r.range(0.35, 0.55);
      wetRock(g, q, bx2 + r.range(-10, 10), py2 + bh2 * 0.3, bw2, bh2, seed * 11 + i, false);
    }
  }
  // 湿岩：深色、上缘有高光与雪（top=true 时是后岸的大石）
  function wetRock(g, q, x, y, w, h, seed, top) {
    var r = RNG(seed), pts = [], i;
    var flat = top ? 1 : r.range(0.55, 0.9);
    for (i = 0; i < 9; i++) { var a = PI + i / 8 * PI, k = r.range(0.7, 1.08); pts.push(x + Math.cos(a) * w / 2 * k, y + Math.sin(a) * h * k * flat); }
    pts.push(x + w * 0.48, y + h * 0.12, x - w * 0.48, y + h * 0.12);
    var tone = r.range(-0.12, 0.18), c0 = K.shade('#585a64', tone), c1 = K.shade('#34363e', tone * 0.6);
    smoothPath(g, pts, true); fillP(g, K.lin(g, x - w / 2, y - h, x + w / 2, y, [c0, c1, '#1a1c22']));
    if (q.tex > 0) { smoothPath(g, pts, true); texFill(g, q, 'rock', ROCK_WET, 96, 0, 0, 0.45, null, null, null, 'overlay'); }
    if (q.light >= 1) { g.beginPath(); g.moveTo(pts[2], pts[3]); for (i = 4; i < 12; i += 2) g.lineTo(pts[i], pts[i + 1]); strokeP(g, 'rgba(200,210,230,0.35)', 2); }
    if (q.light >= 2) { g.save(); g.globalCompositeOperation = 'lighter'; K.ellipse(g, x - w * 0.15, y - h * 0.62, w * 0.14, h * 0.07, -0.2); fillP(g, 'rgba(230,236,248,0.45)'); g.restore(); }
    if (top) snowCap(g, q, [x - w * 0.36, y - h * 0.88, x - w * 0.05, y - h * 1.02, x + w * 0.3, y - h * 0.9], h * 0.28, { seed: seed + 3, over: w * 0.05 });
  }
  function smallHut(g, q, x, y, w, h, norenCol, seed, flip) {
    // 小更衣棚：木墙、山墙屋顶厚雪、暖簾、门边小灯
    if (q.light >= 1) K.contact(g, x + w / 2, y + h, w * 0.6, 14, 0.45);
    rectP(g, x, y, w, h); mat(g, q, '#3a2e24', 'wood', OLD_WOOD, 128, x, y);
    rectP(g, x, y, w, h); fillP(g, K.lin(g, x, 0, x + w, 0, ['rgba(255,240,220,0.08)', 'rgba(0,0,20,0.25)']));
    var dx = flip ? x + w * 0.18 : x + w * 0.5, dw = w * 0.32;
    rectP(g, dx, y + h * 0.3, dw, h * 0.7); fillP(g, K.lin(g, 0, y + h * 0.3, 0, y + h, ['#ffd08a', '#e09a50']));
    for (var i = 0; i < 2; i++) { K.poly(g, [dx + i * dw / 2 + 2, y + h * 0.3, dx + (i + 1) * dw / 2 - 2, y + h * 0.3, dx + (i + 1) * dw / 2 - 3, y + h * 0.58, dx + i * dw / 2 + 3, y + h * 0.6]); fillP(g, norenCol); }
    if (q.light >= 1) K.glow(g, dx + dw / 2, y + h * 0.6, w * 0.5, '#ffb050', 0.25);
    var wx = flip ? x + w * 0.62 : x + w * 0.12;
    rectP(g, wx, y + h * 0.32, w * 0.24, h * 0.26); fillP(g, '#2a2c34'); g.strokeStyle = '#1a1410'; g.lineWidth = 3; g.strokeRect(wx, y + h * 0.32, w * 0.24, h * 0.26);
    K.poly(g, [x - w * 0.12, y + 6, x + w / 2, y - h * 0.5, x + w * 1.12, y + 6]); fillP(g, '#2e2c34');
    snowCap(g, q, [x - w * 0.12, y + 6, x + w / 2, y - h * 0.5, x + w * 1.12, y + 6], h * 0.2, { seed: seed, over: w * 0.05, drip: true, step: 26 });
    icicles(g, q, x - w * 0.1, x + w * 1.1, y + 10, h * 0.22, seed + 1, 0.9);
    // 门边的小灯
    var lx = flip ? dx + dw + 16 : dx - 16;
    K.rr(g, lx - 7, y + h * 0.22, 14, 20, 3); fillP(g, '#ffd890'); if (q.light >= 1) K.glow(g, lx, y + h * 0.22 + 10, 60, '#ffb050', 0.35);
  }

  /* =================================================================
   * 雪见汤 bathhouse：男汤（左）与女汤（右）、竹篱（下有缝）、岩台、汤川
   * ================================================================= */
  function drawBathhouse(g, q) {
    var r = RNG(5001), i;
    sky(g, q, { y: 0, h: 520, seed: 501, gx: 0.5, gy: 0.25, gw: 0.22, dens: 0.05 });
    mountainLayers(g, q, { top: 250, base: 470, seed: 61, amp: 110, near: 60 });
    for (i = 0; i < K.byModel(q, 12, 20, 30); i++) snowCedar(g, q, r.range(-20, 1940), r.range(420, 500), r.range(140, 250), r, { haze: 0.3 });
    snowField(g, q, 0, 460, W, 620, { yh: 380, seed: 5003, amp: 0.8, fog: 160 });
    // 两个更衣棚与通往池边的木栈道
    smallHut(g, q, 80, 330, 300, 210, '#2a3a6a', 5005, false);
    smallHut(g, q, 1540, 330, 300, 210, '#a03040', 5007, true);
    boardwalk(g, q, [230, 548, 260, 620, 300, 660], 70, 5009);
    boardwalk(g, q, [1690, 548, 1660, 620, 1620, 660], 70, 5010);
    // 小路（踏出来的雪径）
    trodPath(g, q, [120, 1100, 160, 990, 220, 910, 270, 880], 80, 40, 5017);
    trodPath(g, q, [1800, 1100, 1760, 990, 1700, 910, 1650, 880], 80, 40, 5019);
    // 池子
    var mp = poolShape(560, 772, 380, 118, 5011), wp = poolShape(1370, 772, 380, 118, 5013);
    onsenPool(g, q, wp, 1370, 772, 380, 118, 23);
    drawBambooFence(g, q);
    onsenPool(g, q, mp, 560, 772, 380, 118, 21);
    drawRockLedge(g, q);
    drawYukawaBath(g, q);
    // 分层的蒸汽：贴着水面的低雾 + 往上飘散的烟
    if (q.light >= 1) { for (i = 0; i < 2; i++) { var cxs = i ? 1370 : 560; g.save(); g.translate(cxs, 740); g.scale(1, 0.22); K.blob(g, 0, 0, 420, '#eef2f6', 0.4); g.restore(); } }
    steam(g, q, 200, 470, 760, 320, 34, 5021, 0.24);
    steam(g, q, 1000, 470, 760, 320, 34, 5023, 0.24);
    // 前景：画面下角的雪堆
    fgSnowbank(g, q, [-20, 1000, 120, 990, 240, 1040, 300, 1090], 5025);
    fgSnowbank(g, q, [1620, 1090, 1700, 1030, 1820, 990, 1940, 1000], 5027);
    sparkle(g, q, 0, 480, W, 600, 220, 5029, function (x, y) { return y < 640 || y > 920; });
    K.vignette(g, W, H, q.light >= 1 ? 0.42 : 0.3, 0.5);
  }
  // 木栈道（踏板，透视，覆着薄雪）：pts 为中线（远→近）
  function boardwalk(g, q, pts, w, seed) {
    var r = RNG(seed), n = pts.length / 2, i;
    for (i = 0; i < n - 1; i++) {
      var ax = pts[i * 2], ay = pts[i * 2 + 1], bx = pts[i * 2 + 2], by = pts[i * 2 + 3], steps = 5;
      for (var k = 0; k < steps; k++) {
        var t0 = k / steps, t1 = (k + 0.8) / steps, x0 = lerp(ax, bx, t0), y0 = lerp(ay, by, t0), x1 = lerp(ax, bx, t1), y1 = lerp(ay, by, t1), ww = w * (0.8 + 0.2 * (y0 - 540) / 120);
        K.poly(g, [x0 - ww / 2, y0, x0 + ww / 2, y0, x1 + ww / 2, y1, x1 - ww / 2, y1]); fillP(g, r() < 0.5 ? '#6a5440' : '#5e4a38');
        K.poly(g, [x0 - ww / 2, y0, x0 + ww / 2, y0, x0 + ww / 2, y0 + 3, x0 - ww / 2, y0 + 3]); fillP(g, 'rgba(240,244,250,0.7)');
      }
    }
    blueContact(g, pts[n * 2 - 2], pts[n * 2 - 1] + 10, w, 10, 0.3);
  }
  function drawRockLedge(g, q) {
    // 男汤池边向池心倾斜的岩台：后高前低，前缘没入水中，斜面上覆着滑溜的白色汤花
    var top = [246, 586, 360, 540, 500, 534, 596, 574];
    var pts = top.concat([610, 640, 520, 662, 380, 668, 262, 640]);
    // 岩台的侧面（厚度）
    K.poly(g, [246, 586, 262, 640, 268, 664, 238, 606]); fillP(g, '#2a2c34');
    K.poly(g, pts); mat(g, q, '#50525a', 'rock', ROCK, 160, 0, 0);
    K.poly(g, pts); fillP(g, K.lin(g, 300, 534, 520, 668, ['rgba(255,255,255,0.16)', 'rgba(0,0,0,0)', 'rgba(0,16,24,0.35)']));
    g.save(); K.poly(g, pts); g.clip();
    var r = RNG(5031);
    for (var i = 0; i < K.byModel(q, 6, 12, 20); i++) { var bx = r.range(280, 600), by = r.range(580, 666); g.save(); g.translate(bx, by); g.scale(1, 0.35); K.blob(g, 0, 0, r.range(30, 70), '#ece6c8', 0.6); g.restore(); }
    // 前缘没入水中：水面的半透明覆盖
    g.fillStyle = K.lin(g, 0, 632, 0, 668, ['rgba(143,180,178,0)', 'rgba(143,180,178,0.75)']); g.fillRect(240, 632, 380, 40);
    if (q.light >= 2) { g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.beginPath(); for (i = 0; i < 7; i++) { var sx = r.range(300, 570), sy = r.range(570, 630); g.moveTo(sx, sy); g.lineTo(sx + r.range(16, 40), sy + r.range(2, 9)); } g.stroke(); }
    g.restore();
    // 水线
    g.beginPath(); g.moveTo(258, 634); g.quadraticCurveTo(430, 646, 608, 632); strokeP(g, 'rgba(220,236,234,0.6)', 2);
    snowCap(g, q, [236, 588, 350, 542, 470, 534], 16, { seed: 5033, over: 10 });
  }
  function drawBambooFence(g, q) {
    // 近端柱在 x=1048（高 200→600），远端在 x=890（矮）；我们从右前方看到竹篱的一面
    var nx = 1048, ntop = 196, nbot = 600, fx = 892, ftop = 300, fbot = 520, n = K.byModel(q, 12, 18, 26), r = RNG(5041), i;
    function at(t) { return [lerp(nx, fx, t), lerp(ntop, ftop, t), lerp(nbot, fbot, t)]; }
    // 篱下的缝：看得见篱后（女汤侧）的池缘与蒸汽
    K.poly(g, [nx, nbot, fx, fbot, fx, fbot + 64, nx, nbot + 118]); fillP(g, K.lin(g, 0, fbot, 0, nbot + 118, ['#2a3438', '#4e6a6c']));
    g.save(); K.poly(g, [nx, nbot, fx, fbot, fx, fbot + 64, nx, nbot + 118]); g.clip(); K.blob(g, 980, 650, 90, '#a8c8c4', 0.5); K.blob(g, 940, 600, 60, '#eef2f6', 0.35); g.restore();
    if (q.light >= 1) { K.poly(g, [nx, nbot, fx, fbot, fx, fbot + 10, nx, nbot + 18]); fillP(g, 'rgba(0,0,0,0.45)'); }
    // 竹竿（随透视变短变密）
    for (i = n - 1; i >= 0; i--) {
      var t0 = i / n, t1 = (i + 1) / n, a = at(t0), b = at(t1), jt = r.range(-6, 4) * (1 - t0);
      K.poly(g, [a[0], a[1] + jt, b[0], b[1] + jt, b[0], b[2], a[0], a[2]]);
      fillP(g, K.lin(g, a[0], 0, b[0], 0, ['#cbbb80', '#a8955c', '#76683e']));
      if (q.model >= 1) { g.fillStyle = 'rgba(70,60,36,0.55)'; for (var k = 0; k < 4; k++) { var f = (k + 0.4 + r() * 0.3) / 4.4; g.fillRect(b[0], lerp(a[1], a[2], f), a[0] - b[0], 3 * (1 - t0 * 0.5)); } }
    }
    // 横杆与棕绳（三道）
    var rails = [0.16, 0.5, 0.86];
    for (i = 0; i < rails.length; i++) {
      var f2 = rails[i], ya = lerp(ntop, nbot, f2), yb = lerp(ftop, fbot, f2);
      K.poly(g, [nx + 10, ya - 7, fx - 6, yb - 5, fx - 6, yb + 5, nx + 10, ya + 7]); fillP(g, '#7a6a40');
      snowCap(g, q, [fx - 6, yb - 5, nx + 10, ya - 7], 6, { seed: 5045 + i, over: 3, step: 40 });
    }
    // 柱与顶上的积雪
    rectP(g, nx - 2, ntop - 24, 18, nbot - ntop + 150); fillP(g, K.lin(g, nx, 0, nx + 18, 0, ['#5a4632', '#2a2018']));
    rectP(g, fx - 10, ftop - 14, 12, fbot - ftop + 80); fillP(g, '#3a2e24');
    snowCap(g, q, [fx - 10, ftop - 6, nx + 18, ntop - 8], 20, { seed: 5043, over: 8, step: 30 });
    snowCap(g, q, [nx - 6, ntop - 26, nx + 20, ntop - 26], 9, { seed: 5049, over: 4 });
  }
  function drawYukawaBath(g, q) {
    // 两池前岸溢出的细流沿雪坡汇合，变成画面下方冒热气的小溪「汤川」（水面不积雪，溪底积着白色汤花）
    var r = RNG(5051), i;
    // 主溪：从两池之间的低处流出，蜿蜒着向画面下方变宽
    var cl = [962, 880, 940, 930, 985, 975, 950, 1020, 985, 1060, 950, 1100], L = [], R = [], n = cl.length / 2;
    for (i = 0; i < n; i++) { var w = lerp(18, 130, Math.pow(i / (n - 1), 1.3)) * (0.85 + 0.3 * vn(i * 1.7, 3.3)); L.push(cl[i * 2] - w, cl[i * 2 + 1]); R.push(cl[i * 2] + w, cl[i * 2 + 1]); }
    var poly = L.concat(revPts(R));
    // 两岸的雪（被热气融成圆滑的边，略带湿的灰色）
    g.beginPath(); smoothPath(g, poly, true); strokeP(g, '#9aa2b8', 26);
    smoothPath(g, poly, true); fillP(g, K.lin(g, 0, 970, 0, H, ['#3c5458', '#2a3c40', '#1e2c30']));
    g.save(); smoothPath(g, poly, true); g.clip();
    for (i = 0; i < 12; i++) { K.ellipse(g, r.range(800, 1120), r.range(990, 1090), r.range(10, 30), r.range(3, 7)); fillP(g, 'rgba(232,228,206,0.35)'); }
    g.strokeStyle = 'rgba(220,236,236,0.4)'; g.lineWidth = 1.6; g.beginPath(); for (i = 0; i < 16; i++) { var px = r.range(820, 1100), py = r.range(985, 1085); g.moveTo(px - 14, py); g.quadraticCurveTo(px, py - 3, px + 16, py); } g.stroke();
    g.fillStyle = K.lin(g, 0, 970, 0, 1000, ['rgba(16,24,28,0.5)', 'rgba(16,24,28,0)']); g.fillRect(780, 970, 360, 40);
    g.restore();
    g.beginPath(); smoothPath(g, L, false); strokeP(g, 'rgba(250,252,255,0.8)', 4); g.beginPath(); smoothPath(g, R, false); strokeP(g, 'rgba(240,244,250,0.6)', 4);
    // 岸边的小石
    for (i = 0; i < K.byModel(q, 2, 4, 6); i++) { var sx = i % 2 ? lerp(R[2], R[6], r()) + 10 : lerp(L[2], L[6], r()) - 10, sy = r.range(1010, 1080); wetRock(g, q, sx, sy, r.range(30, 50), r.range(14, 20), 5060 + i, false); }
    steam(g, q, 780, 860, 380, 220, 20, 5053, 0.3);
  }
  DM.HDBG.def('bathhouse', {
    outdoor: true,
    draw: function (g, q) { drawBathhouse(g, q); },
    lights: [{ x: 214, y: 386, r: 70, color: '#ffb050', i: 0.5, flicker: 0.08, kind: 'lamp' }, { x: 1706, y: 386, r: 70, color: '#ffb050', i: 0.5, flicker: 0.08, kind: 'lamp' },
      { x: 278, y: 470, r: 120, color: '#ffc070', i: 0.4, flicker: 0, kind: 'window' }, { x: 1643, y: 470, r: 120, color: '#ffc070', i: 0.4, flicker: 0, kind: 'window' }],
    key: { x: -0.2, color: '#e8eaf2', amb: '#5a6478', rim: 0.4 }
  });

  /* =================================================================
   * 水车小屋 watermill：左为冻住的水车（冰柱、水闸、薄冰水渠），右为屋内剖面（唐臼：凸轮、杠杆、悬在半空的杵、臼）
   * ================================================================= */
  var WM = { cx: 380, cy: 484, R: 300 };
  function drawWatermill(g, q) {
    var r = RNG(5101), i;
    sky(g, q, { y: 0, h: 560, seed: 511, gx: 0.25, gy: 0.3, gw: 0.2, dens: 0.05 });
    mountainLayers(g, q, { top: 250, base: 580, seed: 71, amp: 120, near: 80 });
    for (i = 0; i < K.byModel(q, 6, 10, 14); i++) snowCedar(g, q, r.range(-20, 900), r.range(500, 580), r.range(140, 260), r, { haze: 0.25 });
    snowField(g, q, 0, 560, W, 520, { yh: 470, seed: 5103, amp: 0.9, fog: 140 });
    drawMillHut(g, q);
    drawFlume(g, q);
    // 水车下的木槽（冻住）
    K.poly(g, [60, 760, 700, 760, 720, 900, 40, 900]); fillP(g, '#3a2e24');
    K.poly(g, [76, 772, 684, 772, 700, 892, 60, 892]); fillP(g, K.lin(g, 0, 772, 0, 892, ['#c4d2e6', '#9aaccc']));
    drawWheel(g, q);
    snowCap(g, q, [40, 760, 720, 760], 14, { seed: 5108, over: 8 });
    drawChannel(g, q);
    // 小屋门前的小路与脚印
    trodPath(g, q, [900, 1100, 950, 990, 1000, 900, 1030, 828], 120, 60, 5107);
    fgSnowbank(g, q, [-20, 1040, 120, 1020, 260, 1060, 320, 1090], 5109);
    fencePosts(g, q, [[40, 1050, 150], [150, 1040, 130]], 5111);
    sparkle(g, q, 0, 560, 1140, 520, 200, 5105);
    K.vignette(g, W, H, q.light >= 1 ? 0.42 : 0.3, 0.5);
  }
  function drawMillHut(g, q) {
    var x0 = 900, x1 = 1910, top = 236, floor = 860, cut = 1140, i;
    // 外墙（左段，带门）
    rectP(g, x0, top, cut - x0, floor + 40 - top); mat(g, q, '#3a2e24', 'wood', OLD_WOOD, 128, x0, top);
    rectP(g, x0, top, cut - x0, floor + 40 - top); fillP(g, K.lin(g, x0, 0, cut, 0, ['rgba(255,240,220,0.06)', 'rgba(0,0,20,0.25)']));
    // 门
    var dx = 944, dy = 344, dw = 176, dh = 464;
    rectP(g, dx - 8, dy - 8, dw + 16, dh + 8); fillP(g, '#1e1610');
    rectP(g, dx, dy, dw, dh); mat(g, q, '#4a3a2c', 'wood', { c1: '#2c2218', c2: '#5a4834', gap: '#140e0a', planks: 3, dir: 'v', seed: 207 }, 128, dx, dy);
    g.fillStyle = '#2a2018'; g.fillRect(dx, dy + 60, dw, 10); g.fillRect(dx, dy + dh - 80, dw, 10); g.fillRect(dx + dw - 24, dy + dh * 0.45, 14, 40);
    if (q.light >= 1) K.ao(g, dx, dy, dw, dh, 24, 0.45, 't');
    // 屋内（剖面）：后墙、地面、梁
    rectP(g, cut, top + 40, x1 - cut, floor - top - 40); mat(g, q, '#2e2620', 'wood', DARK_WOOD, 160, cut, top);
    rectP(g, cut, top + 40, x1 - cut, floor - top - 40); fillP(g, K.lin(g, 0, top, 0, floor, ['rgba(0,0,10,0.55)', 'rgba(0,0,10,0.25)', 'rgba(0,0,10,0.45)']));
    // 屋内的小窗（冷光）
    var wx = 1690, wy = 372;
    rectP(g, wx, wy, 120, 86); fillP(g, K.lin(g, 0, wy, 0, wy + 86, ['#c4cad8', '#9aa2b6']));
    g.strokeStyle = '#1a140e'; g.lineWidth = 6; g.strokeRect(wx, wy, 120, 86); K.line(g, wx + 60, wy, wx + 60, wy + 86, 5, '#1a140e');
    if (q.light >= 1) { K.glow(g, wx + 60, wy + 43, 180, '#b8c4dc', 0.18); }
    if (q.light >= 2) K.shaft(g, [wx, wy + 20, wx + 120, wy + 20, wx + 40, floor + 40, wx - 260, floor + 40], '#c4cee6', 0.08, wx + 60, wy, wx - 60, floor);
    // 地面（土间 + 散乱的稻草）
    K.poly(g, [cut, floor - 10, x1, floor - 10, x1, 1000, cut, 1000]); fillP(g, K.lin(g, 0, floor, 0, 1000, ['#3a3028', '#4a3e32']));
    if (q.tex > 0) { K.poly(g, [cut, floor - 10, x1, floor - 10, x1, 1000, cut, 1000]); texFill(g, q, 'noise', GRAIN, 96, 0, 0, 0.25, 1, 1, null, 'overlay'); }
    // 稻草铺地（尸体位置留空的草席区）
    var r = RNG(5111);
    rectP(g, 1220, 880, 560, 100); fillP(g, 'rgba(160,136,80,0.35)');
    g.strokeStyle = 'rgba(196,170,104,0.75)'; g.lineWidth = 1.5; g.beginPath();
    for (i = 0; i < K.byModel(q, 60, 140, 240); i++) { var sx = r.range(1200, 1800), sy = r.range(870, 995), a = r.range(-0.5, 0.5), l = r.range(16, 44); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l * 0.3); }
    g.stroke();
    // 铁杵架（墙上）
    drawIronRack(g, q, 1690, 490);
    // 唐臼：凸轮、杠杆、支架、杵、臼
    drawKarausu(g, q);
    // 剖面边框：屋顶断面、墙的断面、地槛
    rectP(g, cut - 10, top + 30, 20, floor - top); fillP(g, '#20180f');
    rectP(g, cut, floor - 12, x1 - cut, 20); fillP(g, '#2a2018');
    rectP(g, x1 - 18, top + 30, 28, floor - top + 40); fillP(g, '#20180f');
    // 茅草屋顶（剖面可见厚度）+ 厚雪
    var roof = [860, top + 50, 1060, 96, 1760, 96, 1960, top + 50, 1960, top + 96, 860, top + 96];
    K.poly(g, roof); mat(g, q, '#6a5634', 'thatch', { c1: '#3a2c18', c2: '#7a6640', seed: 209 }, 128, 0, 0);
    K.poly(g, roof); fillP(g, K.lin(g, 0, 96, 0, top + 96, ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.45)']));
    snowCap(g, q, [850, top + 50, 1060, 92, 1760, 92, 1970, top + 50], 54, { seed: 5113, over: 24, drip: true, step: 30 });
    icicles(g, q, 860, cut + 10, top + 98, 90, 5115, 1.1);
    rectP(g, cut, top + 96, x1 - cut, 18); fillP(g, 'rgba(0,0,0,0.5)');
    void x0;
  }
  function drawKarausu(g, q) {
    // 轴从水车穿墙进来，轴上的凸轮压住杠尾 → 杵悬在半空
    var ax = 1208, ay = 424;
    rectP(g, 1140, ay - 14, 90, 28); fillP(g, K.lin(g, 0, ay - 14, 0, ay + 14, ['#6a5438', '#3a2c1c']));
    // 凸轮（轴上的两片木凸块）
    K.ellipse(g, ax, ay, 26, 26); fillP(g, '#4a3a28');
    g.save(); g.translate(ax, ay); g.rotate(0.9);
    K.poly(g, [-10, 0, 10, 0, 14, 62, -14, 62]); fillP(g, K.lin(g, -14, 0, 14, 0, ['#7a6040', '#4a3820']));
    g.restore();
    // 支架（两根柱 + 横销）
    var pvx = 1300, pvy = 486;
    rectP(g, pvx - 14, pvy - 10, 28, 870 - pvy); fillP(g, K.lin(g, pvx - 14, 0, pvx + 14, 0, ['#5a4632', '#2e2418']));
    K.ellipse(g, pvx, pvy, 10, 10); fillP(g, '#1e1810');
    // 杠杆（杠尾被凸轮压下，杵头抬起）
    var tail = [1228, 512], head = [1420, 404], th = 26;
    var ang = Math.atan2(head[1] - tail[1], head[0] - tail[0]);
    g.save(); g.translate(tail[0], tail[1]); g.rotate(ang);
    var len = Math.sqrt((head[0] - tail[0]) * (head[0] - tail[0]) + (head[1] - tail[1]) * (head[1] - tail[1])) + 30;
    rectP(g, -10, -th / 2, len, th); mat(g, q, '#6a5438', 'wood', { c1: '#3a2a1a', c2: '#7a6244', gap: '#1a120a', planks: 1, dir: 'h', seed: 211 }, 96, 0, 0);
    rectP(g, -10, -th / 2, len, th); fillP(g, K.lin(g, 0, -th / 2, 0, th / 2, ['rgba(255,230,200,0.12)', 'rgba(0,0,0,0.4)']));
    g.restore();
    // 杵（竖直的木杵，穿过杠头，下端悬在臼上方）
    var px = 1412, pt = 190, pb = 644;
    rectP(g, px - 22, pt, 44, pb - pt); mat(g, q, '#7a6244', 'wood', { c1: '#4a3622', c2: '#8a7050', gap: '#2a1c10', planks: 1, dir: 'v', seed: 213 }, 96, px, pt);
    rectP(g, px - 22, pt, 44, pb - pt); fillP(g, K.lin(g, px - 22, 0, px + 22, 0, ['rgba(255,236,210,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']));
    K.rr(g, px - 30, pb - 70, 60, 70, 10); fillP(g, K.lin(g, px - 30, 0, px + 30, 0, ['#8a7050', '#5a4430', '#3a2a1c']));
    g.fillStyle = '#2a2018'; g.fillRect(px - 24, 400, 48, 12);
    // 臼（埋在地里的木臼）
    var mx = 1416, my = 772;
    if (q.light >= 1) K.contact(g, mx, 856, 150, 14, 0.5);
    K.path(g, 'M-120 0 L120 0 L108 80 L-108 80 Z', mx, my); fillP(g, K.lin(g, mx - 120, 0, mx + 120, 0, ['#6a5238', '#4a3824', '#2a2014']));
    K.ellipse(g, mx, my, 120, 24); fillP(g, '#5a4430'); K.ellipse(g, mx, my + 2, 82, 15); fillP(g, '#1e1610');
    K.ellipse(g, mx, my + 4, 66, 10); fillP(g, 'rgba(220,210,180,0.35)');   // 臼里残留的米糠
    // 杵下的空隙阴影
    if (q.light >= 1) { g.save(); g.translate(px, my - 4); g.scale(1, 0.25); K.blob(g, 0, 0, 40, '#000000', 0.35); g.restore(); }
  }
  function drawIronRack(g, q, x, y) {
    rectP(g, x, y, 160, 14); fillP(g, '#3a2c20'); rectP(g, x, y + 200, 160, 14); fillP(g, '#3a2c20');
    rectP(g, x + 6, y, 10, 270); fillP(g, '#2a2018'); rectP(g, x + 144, y, 10, 270); fillP(g, '#2a2018');
    // 铁杵、火钳、铁棒
    var items = [[x + 36, 230, 14], [x + 70, 250, 10], [x + 104, 220, 16], [x + 130, 200, 8]];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      rectP(g, it[0] - it[2] / 2, y + 6, it[2], it[1]); fillP(g, K.lin(g, it[0] - it[2] / 2, 0, it[0] + it[2] / 2, 0, ['#8a8c94', '#4a4c54', '#2a2c32']));
      if (i === 0 || i === 2) { K.rr(g, it[0] - it[2], y + 6 + it[1] - 34, it[2] * 2, 34, 4); fillP(g, '#3a3c44'); }
    }
    // 第一格空着（少了一根）
    rectP(g, x + 52, y + 2, 8, 6); fillP(g, '#1a140e');
    if (q.light >= 1) K.ao(g, x, y, 160, 270, 20, 0.35);
  }
  function drawWheel(g, q) {
    var cx = WM.cx, cy = WM.cy, R = WM.R, n = K.byModel(q, 16, 20, 24), i;
    if (q.light >= 1) K.contact(g, cx + 30, 900, 320, 30, 0.45);
    // 轮缘（两圈）与辐条
    g.strokeStyle = '#3a2c20';
    g.lineWidth = 22; K.ellipse(g, cx, cy, R, R); g.stroke();
    g.lineWidth = 14; K.ellipse(g, cx, cy, R * 0.72, R * 0.72); g.stroke();
    for (i = 0; i < 8; i++) { var a = i / 8 * TAU + 0.2; K.line(g, cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 16, '#4a3a2a'); }
    // 叶板
    for (i = 0; i < n; i++) {
      var b = i / n * TAU;
      g.save(); g.translate(cx + Math.cos(b) * R * 0.86, cy + Math.sin(b) * R * 0.86); g.rotate(b);
      rectP(g, -R * 0.16, -7, R * 0.32, 14); fillP(g, '#5a4632');
      g.restore();
    }
    // 受光与木纹
    if (q.light >= 1) { g.beginPath(); g.arc(cx, cy, R + 8, PI * 1.05, PI * 1.6); strokeP(g, 'rgba(255,230,200,0.25)', 4); }
    // 轮毂与伸进屋里的轴
    rectP(g, cx, cy - 26, 900 - cx + 30, 52); fillP(g, K.lin(g, 0, cy - 26, 0, cy + 26, ['#7a6244', '#4a3a28', '#2a2014']));
    K.ellipse(g, cx, cy, 56, 56); fillP(g, K.rad(g, cx - 14, cy - 14, 4, 60, ['#6a5438', '#3a2c1c']));
    K.ellipse(g, cx, cy, 20, 20); fillP(g, '#2a2018');
    // 积雪：上半圈的轮缘与叶板上
    g.save(); g.beginPath(); g.rect(cx - R - 40, cy - R - 40, (R + 40) * 2, R * 0.9); g.clip();
    g.strokeStyle = SN.base; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, R + 8, PI * 1.08, PI * 1.92); g.stroke();
    g.strokeStyle = SN.hi; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R + 10, PI * 1.1, PI * 1.6); g.stroke();
    g.restore();
    for (i = 0; i < n; i++) { var c = i / n * TAU; if (Math.sin(c) > -0.2) continue; var ex = cx + Math.cos(c) * R * 0.86, ey = cy + Math.sin(c) * R * 0.86; snowCap(g, q, [ex - R * 0.14, ey - 7, ex + R * 0.14, ey - 7], 7, { seed: 5121 + i, over: 3 }); }
    // 冻住：下半部包着冰，挂满冰柱
    g.save(); g.beginPath(); g.arc(cx, cy, R + 14, 0.15 * PI, 0.85 * PI); g.lineTo(cx - R * 0.8, 870); g.lineTo(cx + R * 0.8, 870); g.closePath(); g.clip();
    g.fillStyle = 'rgba(200,214,236,0.25)'; g.fillRect(cx - R - 20, cy, (R + 20) * 2, R + 100);
    g.restore();
    icicles(g, q, cx - R * 0.8, cx + R * 0.8, 604, 96, 5123, 1.4);
    g.strokeStyle = 'rgba(220,232,248,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R + 6, 0.2 * PI, 0.8 * PI); g.stroke();
  }
  function drawFlume(g, q) {
    // 左侧的木水槽与水闸
    K.poly(g, [-20, 700, 150, 730, 150, 770, -20, 742]); fillP(g, '#4a3a2a');
    for (var i = 0; i < 3; i++) { rectP(g, 10 + i * 50, 740, 14, 180); fillP(g, '#3a2c20'); }
    // 闸门框与闸板
    rectP(g, 40, 700, 16, 230); fillP(g, '#2e2418'); rectP(g, 130, 700, 16, 230); fillP(g, '#2e2418');
    rectP(g, 56, 760, 74, 150); mat(g, q, '#5a4632', 'wood', { c1: '#3a2a1c', c2: '#6a5238', gap: '#1a120a', planks: 3, dir: 'h', seed: 215 }, 64, 56, 760);
    K.line(g, 93, 700, 93, 760, 8, '#4a4c52'); K.ellipse(g, 93, 696, 26, 8); strokeP(g, '#3a3c42', 5);
    snowCap(g, q, [-20, 698, 150, 726], 16, { seed: 5131, over: 6 }); snowCap(g, q, [36, 698, 150, 698], 10, { seed: 5133 });
    icicles(g, q, 0, 150, 744, 40, 5135, 1);
  }
  function drawChannel(g, q) {
    // 石砌水渠，盖着一层薄冰，冰下看得到暗色的水流
    var top = 892, bot = 1044;
    K.poly(g, [150, top, 930, top - 6, 930, bot, 150, bot]); fillP(g, '#2a3440');
    g.save(); K.poly(g, [150, top, 930, top - 6, 930, bot, 150, bot]); g.clip();
    g.fillStyle = K.lin(g, 0, top, 0, bot, ['rgba(200,214,234,0.75)', 'rgba(160,180,210,0.55)', 'rgba(190,206,228,0.7)']); g.fillRect(150, top - 10, 790, 170);
    // 冰下的水流暗影与气泡、冰的裂纹
    var r = RNG(5141);
    for (var i = 0; i < 6; i++) { g.save(); g.translate(r.range(200, 900), r.range(930, 1010)); g.scale(1, 0.2); K.blob(g, 0, 0, r.range(60, 140), '#20303e', 0.4); g.restore(); }
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.4; g.beginPath();
    for (i = 0; i < K.byModel(q, 4, 9, 14); i++) { var cx = r.range(180, 900), cy = r.range(910, 1030); g.moveTo(cx, cy); for (var k = 0; k < 4; k++) { cx += r.range(10, 40); cy += r.range(-10, 10); g.lineTo(cx, cy); } }
    g.stroke();
    if (q.light >= 2) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(200, 912, 500, 3); }
    g.restore();
    // 两侧石岸与积雪
    K.poly(g, [140, top - 26, 940, top - 32, 940, top, 140, top + 4]); fillP(g, '#5a5c66');
    snowCap(g, q, [140, top - 26, 940, top - 32], 18, { seed: 5143, over: 6 });
    K.poly(g, [140, bot, 940, bot, 940, H, 140, H]); fillP(g, K.lin(g, 0, bot, 0, H, ['#5a5c66', '#4a4c56']));
    snowCap(g, q, [140, bot + 2, 940, bot + 2], 26, { seed: 5145, over: 8 });
  }
  DM.HDBG.def('watermill', {
    outdoor: true,
    draw: function (g, q) { drawWatermill(g, q); },
    lights: [{ x: 1750, y: 415, r: 160, color: '#b8c4dc', i: 0.35, flicker: 0, kind: 'window' }],
    key: { x: -0.4, color: '#dde2ee', amb: '#4a5066', rim: 0.35 }
  });

  /* ======================= 雪中小物：石灯笼、雪吊松、门 ======================= */
  // 雪见灯笼（宽伞形的石灯笼，伞上厚厚的雪）
  function yukimiToro(g, q, x, base, s, lit) {
    g.save(); g.translate(x, base); g.scale(s, s);
    if (q.light >= 1) K.contact(g, 6, 0, 70, 12, 0.45);
    var st = '#6a6a72', sd = '#3a3a42';
    // 三只脚
    K.poly(g, [-44, 0, -36, 0, -26, -60, -32, -60]); fillP(g, sd); K.poly(g, [36, 0, 44, 0, 32, -60, 26, -60]); fillP(g, sd); K.poly(g, [-4, 0, 4, 0, 3, -60, -3, -60]); fillP(g, st);
    rectP(g, -40, -70, 80, 12); fillP(g, K.lin(g, -40, 0, 40, 0, [st, sd]));
    // 火袋
    rectP(g, -26, -118, 52, 48); fillP(g, K.lin(g, -26, 0, 26, 0, [st, sd]));
    rectP(g, -12, -108, 24, 28); fillP(g, lit ? '#ffcf80' : '#1a1a1e');
    if (lit && q.light >= 1) K.glow(g, 0, -94, 70, '#ffb050', 0.4);
    // 宽伞
    K.path(g, 'M-76 -116 Q-40 -130 0 -150 Q40 -130 76 -116 L70 -110 L-70 -110 Z'); fillP(g, K.lin(g, -76, 0, 76, 0, ['#7a7a82', '#3a3a42']));
    K.ellipse(g, 0, -156, 9, 9); fillP(g, st);
    g.restore();
    snowCap(g, q, [x - 78 * s, base - 114 * s, x, base - 150 * s, x + 78 * s, base - 114 * s], 30 * s, { seed: (x | 0) + 7, over: 14 * s, drip: true });
  }
  // 雪吊：松树上从中央立杆放射下来的绳伞
  function yukitsuriPine(g, q, x, base, h, r) {
    var top = base - h;
    // 松：几层平展的叶团（带雪）
    K.path(g, 'M0 0 Q-6 -40 4 -80 Q12 -120 0 -160', x, base, h / 200, h / 200); strokeP(g, '#3a2c20', 10 * h / 200);
    var pads = [[-60, -60, 70, 18], [50, -84, 64, 16], [-40, -112, 56, 15], [30, -138, 50, 13], [-8, -168, 40, 12]];
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i], px = x + p[0] * h / 200, py = base + p[1] * h / 200, pw = p[2] * h / 200, ph = p[3] * h / 200;
      K.ellipse(g, px, py, pw, ph); fillP(g, '#22302a');
      snowCap(g, q, [px - pw * 0.95, py - ph * 0.2, px + pw * 0.95, py - ph * 0.2], ph * 0.75, { seed: (px | 0) + i, over: pw * 0.08 });
    }
    // 立杆与放射的绳
    K.line(g, x, base - h * 0.1, x, top - h * 0.12, 3, '#6a5a40');
    g.strokeStyle = 'rgba(200,186,140,0.85)'; g.lineWidth = 1.2; g.beginPath();
    for (var k = 0; k < 13; k++) { var fx = x + (k / 12 - 0.5) * h * 0.95, fy = base - h * 0.32 + Math.abs(k / 12 - 0.5) * h * 0.1; g.moveTo(x, top - h * 0.12); g.quadraticCurveTo((x + fx) / 2, (top + fy) / 2 - h * 0.02, fx, fy); }
    g.stroke();
    void r;
  }

  /* =================================================================
   * 雪庭 snow_garden（+ buried：排气管口被带铲痕的棱角雪块埋住；庇上积雪缺了一块直角）
   * ================================================================= */
  function drawSnowGarden(g, q, v) {
    var buried = v === 'buried', r = RNG(6001), i;
    sky(g, q, { y: 0, h: 520, seed: 601, gx: 0.2, gy: 0.3, gw: 0.2, dens: 0.05 });
    for (i = 0; i < K.byModel(q, 6, 10, 14); i++) snowCedar(g, q, r.range(-20, 1100), r.range(380, 460), r.range(200, 340), r, { haze: 0.3 });
    snowField(g, q, 0, 480, W, 600, { yh: 380, seed: 6003, amp: 0.8, fog: 160 });
    drawMainHouseWall(g, q, buried);
    drawAnnex(g, q, buried);
    drawGapSnow(g, q, buried);
    // 雪吊的松与雪见灯笼
    yukitsuriPine(g, q, 120, 690, 300, r);
    yukimiToro(g, q, 124, 830, 0.95, false);
    // 门（右侧，带小屋顶）
    drawGardenGate(g, q, 1764, 960);
    // 从门到离屋的小路：小夜往返的脚印与今早霜的脚印（雪停之后，轮廓清楚）
    trodPath(g, q, [1700, 1000, 1400, 990, 1000, 980, 600, 950, 380, 870], 46, 34, 6011, { prints: false });
    drawGardenPrints(g, q);
    fgSnowbank(g, q, [-20, 1010, 140, 990, 300, 1040, 380, 1090], 6015);
    sparkle(g, q, 0, 700, W, 380, 260, 6013);
    K.vignette(g, W, H, q.light >= 1 ? 0.42 : 0.3, 0.5);
  }
  function drawMainHouseWall(g, q, buried) {
    var x0 = 1040, x1 = 1730, top = 0, base = 860;
    // 墙：上部白灰泥、下部木板，柱与贯
    rectP(g, x0, top, x1 - x0, base - top); fillP(g, '#d8d4ca');
    if (q.tex > 0) { rectP(g, x0, top, x1 - x0, base - top); texFill(g, q, 'plaster', { c1: '#000000', c2: '#ffffff', seed: 13, stain: 0.6 }, 192, 0, 0, 0.22, null, null, null, 'overlay'); }
    rectP(g, x0, 450, x1 - x0, base - 450); mat(g, q, '#3a2e24', 'wood', OLD_WOOD, 128, x0, 450);
    g.fillStyle = '#2a2018';
    for (var px = x0; px <= x1; px += 230) g.fillRect(px - 8, top, 16, base - top);
    g.fillRect(x0, 330, x1 - x0, 14);
    rectP(g, x0, top, x1 - x0, base - top); fillP(g, K.lin(g, x0, 0, x1, 0, ['rgba(0,0,20,0.18)', 'rgba(0,0,20,0.05)']));
    // 二楼窗（格子玻璃窗，窗台积雪）
    var wx = 1206, wy = 104, ww = 244, wh = 190;
    rectP(g, wx - 12, wy - 12, ww + 24, wh + 24); fillP(g, '#2a2018');
    rectP(g, wx, wy, ww, wh); fillP(g, K.lin(g, wx, wy, wx + ww, wy + wh, ['#8a90a4', '#4a5064', '#2a2e3a']));
    g.strokeStyle = '#2a2018'; g.lineWidth = 6; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
    if (q.light >= 2) { K.poly(g, [wx + 20, wy + wh, wx + 70, wy, wx + 100, wy, wx + 50, wy + wh]); fillP(g, 'rgba(255,255,255,0.12)'); }
    rectP(g, wx - 20, wy + wh + 10, ww + 40, 14); fillP(g, '#3a2e24');
    if (!buried) snowCap(g, q, [wx - 20, wy + wh + 10, wx + ww + 20, wy + wh + 10], 16, { seed: 6021, over: 6 });
    else { snowCap(g, q, [wx - 20, wy + wh + 10, wx + 40, wy + wh + 10], 14, { seed: 6021, over: 4 }); snowCap(g, q, [wx + ww - 50, wy + wh + 10, wx + ww + 20, wy + wh + 10], 14, { seed: 6022, over: 4 }); K.ellipse(g, wx + ww / 2, wy + wh + 8, 80, 5); fillP(g, 'rgba(240,244,250,0.85)'); }
    // 一楼的庇（单坡小屋檐，铁皮，带雪止）
    var ex0 = 1048, ex1 = 1648, ey = 360;
    K.poly(g, [ex0, ey, ex1, ey, ex1 + 10, ey + 64, ex0 - 10, ey + 64]); fillP(g, K.lin(g, 0, ey, 0, ey + 64, ['#4a4e58', '#2a2e36']));
    rectP(g, ex0 - 12, ey + 62, ex1 - ex0 + 24, 10); fillP(g, '#20242a');
    // 庇上的积雪
    if (!buried) snowCap(g, q, [ex0 - 12, ey + 40, ex0, ey, ex1, ey, ex1 + 12, ey + 40], 30, { seed: 6023, over: 8, step: 40 });
    else {
      // 二楼窗正下方缺了一块：断面是铲子切出的直角
      var nx0 = 1250, nx1 = 1410;
      snowCap(g, q, [ex0 - 12, ey + 40, ex0, ey, nx0, ey], 30, { seed: 6023, over: 6, step: 40 });
      snowCap(g, q, [nx1, ey, ex1, ey, ex1 + 12, ey + 40], 30, { seed: 6024, over: 6, step: 40 });
      K.poly(g, [nx0, ey - 30, nx0 + 3, ey - 30, nx0 + 3, ey + 2, nx0, ey + 2]); fillP(g, '#b8c0d8');
      K.poly(g, [nx1 - 3, ey - 30, nx1, ey - 30, nx1, ey + 2, nx1 - 3, ey + 2]); fillP(g, '#c8d0e2');
      rectP(g, nx0, ey - 4, nx1 - nx0, 6); fillP(g, 'rgba(220,226,240,0.6)');
    }
    // 雪止（一排铁件，露在雪外）
    g.fillStyle = '#2a2c32';
    for (var sx = ex0 + 30; sx < ex1; sx += 46) { K.poly(g, [sx - 5, ey + 34, sx + 5, ey + 34, sx + 7, ey + 50, sx - 7, ey + 50]); g.fill(); }
    icicles(g, q, ex0 - 8, ex1 + 8, ey + 72, 60, 6025, 1);
    // 屋檐下没有积雪的墙脚
    if (q.light >= 1) { g.fillStyle = K.lin(g, 0, ey + 72, 0, ey + 160, ['rgba(0,0,20,0.35)', 'rgba(0,0,20,0)']); g.fillRect(ex0, ey + 72, ex1 - ex0, 88); }
  }
  function drawAnnex(g, q, buried) {
    // 离屋：正面（门）+ 朝本宅的侧面（透视退远，排气管在侧面上）
    var x0 = 170, x1 = 1060, yt = 440, yb = 856, sx1 = 1340, syt = 480, syb = 820;
    // 侧面
    K.poly(g, [x1, yt, sx1, syt, sx1, syb, x1, yb]); mat(g, q, '#3a2e24', 'wood', OLD_WOOD, 128, 0, 0);
    K.poly(g, [x1, yt, sx1, syt, sx1, syb, x1, yb]); fillP(g, 'rgba(10,12,30,0.45)');
    // 排气管（从侧墙伸出，管口朝外）
    var vx = 1262, vy = 650;
    K.poly(g, [vx - 6, vy - 16, vx + 46, vy - 22, vx + 46, vy + 14, vx - 6, vy + 14]); fillP(g, K.lin(g, 0, vy - 22, 0, vy + 14, ['#7a7c84', '#3a3c42']));
    K.ellipse(g, vx + 46, vy - 4, 9, 18); fillP(g, '#141418');
    if (!buried && q.light >= 1) { for (var k = 0; k < 4; k++) K.blob(g, vx + 56 + k * 6, vy - 20 - k * 26, 20 + k * 10, '#eef2f6', 0.2 - k * 0.04); }
    // 正面墙
    rectP(g, x0, yt, x1 - x0, yb - yt); mat(g, q, '#4a3a2c', 'wood', OLD_WOOD, 128, x0, yt);
    rectP(g, x0, yt, x1 - x0, yb - yt); fillP(g, K.lin(g, x0, 0, x1, 0, ['rgba(255,240,220,0.06)', 'rgba(0,0,20,0.2)']));
    // 纸糊死的窗与紧闭的雨户
    rectP(g, 600, 540, 260, 150); fillP(g, '#2a2018'); g.strokeStyle = '#1a120c'; g.lineWidth = 3; g.beginPath(); for (var bx = 600; bx < 860; bx += 26) { g.moveTo(bx, 540); g.lineTo(bx, 690); } g.stroke();
    snowCap(g, q, [592, 538, 868, 538], 10, { seed: 6031, over: 4 });
    // 门（拉门）
    var dx = 266, dy = 480, dw = 212, dh = 356;
    rectP(g, dx - 10, dy - 10, dw + 20, dh + 10); fillP(g, '#1e1610');
    rectP(g, dx, dy, dw, dh); mat(g, q, '#5a4836', 'wood', { c1: '#3a2c1e', c2: '#6a5640', gap: '#1a120a', planks: 4, dir: 'v', seed: 217 }, 96, dx, dy);
    g.strokeStyle = '#2a2018'; g.lineWidth = 5; g.strokeRect(dx + 8, dy + 8, dw - 16, dh - 16); K.line(g, dx + dw / 2, dy, dx + dw / 2, dy + dh, 4, '#2a2018');
    if (q.light >= 1) K.ao(g, dx, dy, dw, dh, 26, 0.45, 't');
    // 屋顶（厚雪）
    K.poly(g, [x0 - 60, yt, x1 + 40, yt, sx1 + 20, syt - 10, sx1, syt - 80, x1 - 40, yt - 150, x0 + 40, yt - 150]); fillP(g, '#2e2c34');
    snowCap(g, q, [x0 - 70, yt + 4, x0 + 40, yt - 150, x1 - 40, yt - 150, x1 + 40, yt + 4], 50, { seed: 6033, over: 24, drip: true, step: 34 });
    snowCap(g, q, [x1 + 40, yt + 4, x1 - 40, yt - 150, sx1, syt - 80, sx1 + 24, syt - 8], 40, { seed: 6035, over: 10, step: 34 });
    icicles(g, q, x0 - 60, x1 + 40, yt + 8, 80, 6037, 1);
    // 墙脚的积雪
    K.poly(g, [x0 - 20, yb - 30, x1 + 20, yb - 24, x1 + 40, yb + 20, x0 - 40, yb + 20]); fillP(g, K.lin(g, 0, yb - 30, 0, yb + 20, [SN.hi, SN.base]));
  }
  function drawGapSnow(g, q, buried) {
    // 两屋之间的窄缝：上方是背光的狭窄空间（本宅墙在后），下面堆着一人多高、表面平整的落雪
    K.poly(g, [1062, 440, 1520, 380, 1520, 860, 1062, 860]); fillP(g, K.lin(g, 1062, 0, 1520, 0, ['rgba(30,34,52,0.55)', 'rgba(30,34,52,0.15)']));
    var pts = [1060, 862, 1060, 704, 1120, 690, 1240, 684, 1340, 686, 1440, 692, 1520, 702, 1524, 862];
    smoothPath(g, pts, true); fillP(g, K.lin(g, 1062, 680, 1300, 862, ['#eef1f7', '#d6dcea', '#b4bcd4']));
    if (q.tex > 0) { smoothPath(g, pts, true); texFill(g, q, 'snow', SNOW_T, 128, 0, 0, 0.12, null, null, null, 'overlay'); }
    if (q.light >= 1) { g.beginPath(); g.moveTo(1062, 704); g.quadraticCurveTo(1290, 676, 1520, 702); strokeP(g, 'rgba(255,255,255,0.85)', 3); }
    // 雪堆侧面（朝外）的阴影与层理
    if (q.model >= 1) { g.strokeStyle = K.rgba(SN.shd, 0.25); g.lineWidth = 2; g.beginPath(); for (var k = 0; k < 4; k++) { var yy = 730 + k * 30; g.moveTo(1066, yy); g.quadraticCurveTo(1290, yy - 10, 1518, yy + 4); } g.stroke(); }
    K.ellipse(g, 1290, 862, 280, 24); fillP(g, K.lin(g, 0, 838, 0, 886, [SN.hi, SN.base]));
    if (buried) {
      // 一堆棱角分明、带铲痕的雪块埋住了排气管口（自然滑落的雪是圆滑的一整片，这里明显不是）
      var r = RNG(6041), blocks = [[1268, 676, 66, 46, -0.2], [1330, 662, 72, 50, 0.15], [1296, 626, 58, 40, 0.35], [1356, 694, 56, 40, -0.1], [1236, 700, 52, 36, 0.25], [1340, 618, 48, 34, -0.3]];
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        g.save(); g.translate(b[0], b[1]); g.rotate(b[4]);
        if (q.light >= 1) { rectP(g, -b[2] / 2 + 6, -b[3] / 2 + 8, b[2], b[3]); fillP(g, 'rgba(70,80,120,0.3)'); }
        rectP(g, -b[2] / 2, -b[3] / 2, b[2], b[3]); fillP(g, '#e8ecf4');
        K.poly(g, [-b[2] / 2, -b[3] / 2, b[2] / 2, -b[3] / 2, b[2] / 2 - 8, -b[3] / 2 - 10, -b[2] / 2 - 6, -b[3] / 2 - 10]); fillP(g, '#f6f8fc');
        K.poly(g, [b[2] / 2, -b[3] / 2, b[2] / 2 - 8, -b[3] / 2 - 10, b[2] / 2 - 8, b[3] / 2 - 10, b[2] / 2, b[3] / 2]); fillP(g, '#b8c0d8');
        // 铲痕
        g.strokeStyle = 'rgba(120,130,170,0.55)'; g.lineWidth = 1.5; g.beginPath(); for (var k = 0; k < 3; k++) { var yy = -b[3] / 2 + 8 + k * b[3] / 3.5; g.moveTo(-b[2] / 2 + 4, yy); g.lineTo(b[2] / 2 - 4, yy + r.range(-2, 2)); } g.stroke();
        g.restore();
      }
    }
  }
  function drawGardenGate(g, q, cx, base) {
    var w = 220, h = 360;
    if (q.light >= 1) K.contact(g, cx, base, 150, 14, 0.45);
    rectP(g, cx - w / 2, base - h, 20, h); fillP(g, '#3a2e24'); rectP(g, cx + w / 2 - 20, base - h, 20, h); fillP(g, '#2a2018');
    rectP(g, cx - w / 2, base - h + 30, w, 16); fillP(g, '#3a2e24');
    // 门扇（竹编，半开）
    rectP(g, cx - w / 2 + 20, base - h + 60, w / 2 - 20, h - 80); fillP(g, '#8a7a50');
    g.strokeStyle = '#5a4a2c'; g.lineWidth = 2; g.beginPath(); for (var k = 0; k < 8; k++) { var yy = base - h + 70 + k * 36; g.moveTo(cx - w / 2 + 20, yy); g.lineTo(cx, yy + 8); } g.stroke();
    // 小屋顶
    K.poly(g, [cx - w / 2 - 40, base - h + 4, cx, base - h - 60, cx + w / 2 + 40, base - h + 4]); fillP(g, '#2e2c34');
    snowCap(g, q, [cx - w / 2 - 44, base - h + 6, cx, base - h - 62, cx + w / 2 + 44, base - h + 6], 30, { seed: 6051, over: 12, drip: true });
    icicles(g, q, cx - w / 2 - 36, cx + w / 2 + 36, base - h + 12, 40, 6053, 1);
    K.ellipse(g, cx, base, 150, 18); fillP(g, K.lin(g, 0, base - 18, 0, base + 18, [SN.hi, SN.sh]));
  }
  function drawGardenPrints(g, q) {
    // 两行清楚的脚印（小夜往返、霜今早一趟）：雪停后踩的，边缘锋利、底部干净
    var path = [1700, 1000, 1400, 990, 1000, 980, 600, 950, 380, 870];
    function at(t) { var n = path.length / 2 - 1, k = Math.min(n - 1, Math.floor(t * n)), f = t * n - k; return [lerp(path[k * 2], path[k * 2 + 2], f), lerp(path[k * 2 + 1], path[k * 2 + 3], f)]; }
    var lanes = [-14, 0, 14], cols = [0.5, 0.42, 0.48];
    g.beginPath();
    for (var l = 0; l < 3; l++) {
      for (var i = 0; i < 26; i++) {
        var t = (i + 0.5 + l * 0.3) / 26, p = at(t), sc = 0.7 + (p[1] - 860) / 200 * 0.4, side = i % 2 ? 1 : -1;
        var px = p[0] + side * 6 * sc, py = p[1] + lanes[l] * 0.4 * sc + side * 2;
        g.moveTo(px + 9 * sc, py); g.ellipse ? g.ellipse(px, py, 9 * sc, 3.6 * sc, 0, 0, TAU) : g.arc(px, py, 9 * sc, 0, TAU);
      }
    }
    g.fillStyle = K.rgba(SN.shd, 0.55); g.fill();
    void cols; void q;
  }
  DM.HDBG.def('snow_garden', {
    outdoor: true,
    draw: function (g, q, v) { drawSnowGarden(g, q, v); },
    lights: [],
    key: { x: -0.4, color: '#e2e6f0', amb: '#56607a', rim: 0.35 }
  });

  /* ======================= 鸟居 ======================= */
  function snowTorii(g, q, cx, top, w, h, o) {
    o = o || {};
    var red = o.red || '#b8402c', redD = '#6a2216', blk = '#1a1616', pw = w * 0.07, p1 = cx - w * 0.33, p2 = cx + w * 0.33, bot = top + h, r = RNG(o.seed || 9);
    function pillar(x) {
      K.poly(g, [x - pw * 0.45, top + h * 0.2, x + pw * 0.45, top + h * 0.2, x + pw * 0.55, bot, x - pw * 0.55, bot]);
      fillP(g, K.lin(g, x - pw, 0, x + pw, 0, [K.shade(red, 0.15), red, redD]));
      for (var i = 0; i < K.byModel(q, 1, 3, 5); i++) { K.ellipse(g, x + r.range(-pw * 0.3, pw * 0.3), r.range(top + h * 0.3, bot - h * 0.15), pw * 0.12, pw * 0.3); fillP(g, 'rgba(70,40,30,0.35)'); }
      rectP(g, x - pw * 0.62, bot - h * 0.1, pw * 1.24, h * 0.1); fillP(g, K.lin(g, x - pw, 0, x + pw, 0, ['#3a3434', blk]));
    }
    pillar(p1); pillar(p2);
    // 贯
    var ny = top + h * 0.27;
    rectP(g, cx - w * 0.42, ny, w * 0.84, h * 0.055); fillP(g, K.lin(g, 0, ny, 0, ny + h * 0.055, [K.shade(red, 0.1), redD]));
    snowCap(g, q, [cx - w * 0.42, ny, cx + w * 0.42, ny], h * 0.03, { seed: 9101, over: 6 });
    // 额束与额
    rectP(g, cx - pw * 0.4, top + h * 0.1, pw * 0.8, h * 0.17); fillP(g, red);
    rectP(g, cx - w * 0.07, top + h * 0.11, w * 0.14, h * 0.14); fillP(g, '#1e1a18');
    if (q.model >= 1) { g.strokeStyle = 'rgba(210,180,100,0.8)'; g.lineWidth = Math.max(1.5, w * 0.006); g.beginPath(); g.moveTo(cx, top + h * 0.13); g.lineTo(cx, top + h * 0.23); g.moveTo(cx - w * 0.03, top + h * 0.16); g.lineTo(cx + w * 0.03, top + h * 0.16); g.moveTo(cx - w * 0.025, top + h * 0.2); g.lineTo(cx + w * 0.025, top + h * 0.215); g.stroke(); }
    // 岛木与笠木（两端上翘）
    rectP(g, cx - w * 0.47, top + h * 0.06, w * 0.94, h * 0.045); fillP(g, K.lin(g, 0, top + h * 0.06, 0, top + h * 0.1, [red, redD]));
    K.path(g, 'M-0.53 -0.05 Q-0.5 0.01 -0.42 0.015 L0.42 0.015 Q0.5 0.01 0.53 -0.05 L0.52 0.03 Q0.48 0.07 0.42 0.07 L-0.42 0.07 Q-0.48 0.07 -0.52 0.03 Z', cx, top, w, h);
    fillP(g, K.lin(g, 0, top - h * 0.05, 0, top + h * 0.07, ['#3a3434', blk]));
    snowCap(g, q, [cx - w * 0.54, top - h * 0.045, cx - w * 0.42, top + h * 0.012, cx + w * 0.42, top + h * 0.012, cx + w * 0.54, top - h * 0.045], h * 0.06, { seed: 9103, over: w * 0.02, drip: true, step: 30 });
    icicles(g, q, cx - w * 0.45, cx + w * 0.45, top + h * 0.07, h * 0.08, 9105, 0.7);
    // 注连绳与纸垂
    if (o.rope !== false) {
      var ry = top + h * 0.115;
      g.beginPath(); g.moveTo(cx - w * 0.36, ry); g.quadraticCurveTo(cx, ry + h * 0.07, cx + w * 0.36, ry);
      g.strokeStyle = '#9a8450'; g.lineWidth = h * 0.03; g.stroke(); g.strokeStyle = '#cbbb84'; g.lineWidth = h * 0.015; g.stroke();
      for (var k = 0; k < 4; k++) { var px = cx - w * 0.24 + k * w * 0.16, py = ry + Math.sin((k + 0.5) / 4 * PI) * h * 0.06; g.save(); g.translate(px, py); g.scale(h / 400, h / 400); K.poly(g, [0, 0, 10, 0, 10, 12, 4, 12, 4, 26, 12, 26, 12, 40, 6, 40, 6, 52, 0, 52]); fillP(g, '#f0ece2'); g.restore(); }
    }
  }

  /* =================================================================
   * 白蛾神社·石阶 shrine
   * ================================================================= */
  function drawShrine2(g, q) {
    var r = RNG(6101), i;
    sky(g, q, { y: 0, h: 600, seed: 611, gx: 0.5, gy: 0.18, gw: 0.2, dens: 0.05 });
    // 背后的杉林（层层，越远越淡）
    for (var L = 0; L < 3; L++) for (i = 0; i < K.byModel(q, 10, 16, 22); i++) { var tx = r.range(-40, 1960); if (L === 2 && tx > 640 && tx < 1280) continue; snowCedar(g, q, tx, 560 + L * 60 + r.range(0, 40), r.range(300, 520) * (0.6 + L * 0.25), r, { haze: 0.55 - L * 0.22 }); }
    // 地面与山坡
    snowField(g, q, 0, 520, W, 560, { yh: 300, seed: 6103, amp: 0.5, fog: 200, flat: true, freq: 1.8 });
    // 石阶（从画面下方一直向上通到鸟居）
    drawShrineStairs(g, q);
    snowTorii(g, q, 960, 150, 500, 400, { seed: 6105 });
    // 两侧的近景杉树
    snowCedar(g, q, 600, 800, 640, r, { snowAmt: 0.9 }); snowCedar(g, q, 1340, 820, 660, r, { snowAmt: 0.9 });
    // 石灯笼（左，点着）
    drawStoneLantern(g, q, 504, 736, 1.25, true);
    // 告示板（左）
    drawNoticeBoard(g, q, 240, 760);
    // 女坂（右）：绕过社务所背后的缓坡小路，竹扶手与小灯
    drawOnnazaka(g, q);
    fgSnowbank(g, q, [-20, 1000, 160, 980, 330, 1030, 420, 1090], 6109);
    fgSnowbank(g, q, [1500, 1090, 1600, 1030, 1780, 1000, 1940, 1010], 6111);
    sparkle(g, q, 0, 560, W, 520, 260, 6107);
    K.vignette(g, W, H, q.light >= 1 ? 0.44 : 0.32, 0.5);
  }
  function drawShrineStairs(g, q) {
    // 从下往上看的长石阶：只看得到立面，每级的踏面被雪压成一道白线；中间踩出的小径
    var N = K.byModel(q, 16, 22, 28), y0 = 540, y1 = H + 10, i;
    var ys = [];
    for (i = 0; i <= N; i++) { var t = i / N; ys.push(y0 + (y1 - y0) * Math.pow(t, 1.6)); }
    function XL(y) { return lerp(866, 600, (y - y0) / (y1 - y0)); }
    function XR(y) { return lerp(1054, 1320, (y - y0) / (y1 - y0)); }
    // 两侧的石垣与积雪坡
    K.poly(g, [XL(y0) - 30, y0, XL(y1) - 160, y1, XL(y1), y1, XL(y0), y0]); fillP(g, K.lin(g, 0, y0, 0, y1, ['#c8cede', SN.base]));
    K.poly(g, [XR(y0), y0, XR(y1), y1, XR(y1) + 160, y1, XR(y0) + 30, y0]); fillP(g, K.lin(g, 0, y0, 0, y1, ['#d0d6e4', SN.hi]));
    for (i = 0; i < N; i++) {
      var ya = ys[i], yb = ys[i + 1], hgt = yb - ya, xl = XL(ya), xr = XR(ya), xl2 = XL(yb), xr2 = XR(yb);
      // 立面（石）
      K.poly(g, [xl, ya, xr, ya, xr2, yb, xl2, yb]); fillP(g, i % 2 ? '#5a5c66' : '#545660');
      if (q.tex > 0) { K.poly(g, [xl, ya, xr, ya, xr2, yb, xl2, yb]); texFill(g, q, 'noise', STEP_GRAIN, 128, xl, ya, 0.3, 1, 1, null, 'overlay'); }
      K.poly(g, [xl, ya, xr, ya, xr2, yb, xl2, yb]); fillP(g, K.lin(g, 0, ya, 0, yb, ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.1)']));
      // 踏面上的积雪：两侧厚、中间被踩薄（中间露出一点石面）
      var sh = Math.max(2, hgt * 0.42), mid = (xl + xr) / 2, half = (xr - xl) * 0.18;
      K.poly(g, [xl - 6, ya - sh * 0.4, mid - half, ya - sh * 0.15, mid - half, ya + sh * 0.5, xl - 6, ya + sh * 0.7]); fillP(g, K.lin(g, 0, ya - sh, 0, ya + sh, [SN.hi, SN.base]));
      K.poly(g, [mid + half, ya - sh * 0.15, xr + 6, ya - sh * 0.4, xr + 6, ya + sh * 0.7, mid + half, ya + sh * 0.5]); fillP(g, K.lin(g, 0, ya - sh, 0, ya + sh, [SN.hi, SN.base]));
      K.poly(g, [mid - half, ya - sh * 0.1, mid + half, ya - sh * 0.1, mid + half, ya + sh * 0.3, mid - half, ya + sh * 0.3]); fillP(g, 'rgba(200,206,222,0.85)');
      if (q.light >= 1) { g.fillStyle = 'rgba(255,255,255,0.65)'; g.fillRect(xl - 6, ya - sh * 0.42, (xr - xl) * 0.32, Math.max(1, sh * 0.12)); }
    }
    // 中央的扶手
    g.strokeStyle = '#7a3a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(960, y0 + 20); g.lineTo(960, y1); g.stroke();
    snowCap(g, q, [958, y0 + 20, 958, y1], 3, { seed: 6111, over: 2, step: 60 });
  }
  function drawStoneLantern(g, q, x, base, s, lit) {
    g.save(); g.translate(x, base); g.scale(s, s);
    if (q.light >= 1) K.contact(g, 6, 0, 52, 10, 0.5);
    var st = '#6e6e76', sd = '#3a3a42';
    rectP(g, -34, -18, 68, 18); fillP(g, K.lin(g, -34, 0, 34, 0, [st, sd]));
    rectP(g, -12, -110, 24, 92); fillP(g, K.lin(g, -12, 0, 12, 0, [st, sd]));
    rectP(g, -30, -126, 60, 16); fillP(g, K.lin(g, -30, 0, 30, 0, [st, sd]));
    rectP(g, -24, -176, 48, 50); fillP(g, K.lin(g, -24, 0, 24, 0, [st, sd]));
    rectP(g, -12, -166, 24, 30); fillP(g, lit ? '#ffcf80' : '#1a1a1e');
    if (lit && q.light >= 1) K.glow(g, 0, -150, 80, '#ffb050', 0.45);
    K.path(g, 'M-48 -176 Q-20 -184 0 -204 Q20 -184 48 -176 L42 -170 L-42 -170 Z'); fillP(g, K.lin(g, -48, 0, 48, 0, ['#7a7a82', '#34343c']));
    g.restore();
    snowCap(g, q, [x - 48 * s, base - 174 * s, x, base - 204 * s, x + 48 * s, base - 174 * s], 20 * s, { seed: (x | 0) + 3, over: 8 * s });
    snowCap(g, q, [x - 34 * s, base - 18 * s, x + 34 * s, base - 18 * s], 8 * s, { seed: (x | 0) + 5, over: 4 * s });
  }
  function drawNoticeBoard(g, q, cx, base) {
    if (q.light >= 1) K.contact(g, cx, base, 90, 10, 0.45);
    rectP(g, cx - 74, base - 200, 12, 200); fillP(g, '#3a2e24'); rectP(g, cx + 62, base - 200, 12, 200); fillP(g, '#2a2018');
    rectP(g, cx - 70, base - 190, 140, 110); mat(g, q, '#5a4836', 'wood', OLD_WOOD, 64, cx, base);
    // 贴着的告示（褪色的纸）
    var papers = [[-58, -180, 50, 64, '#e8e2d0'], [0, -176, 56, 44, '#ece6d6'], [-20, -124, 40, 34, '#d8d0bc']];
    for (var i = 0; i < papers.length; i++) { var p = papers[i]; rectP(g, cx + p[0], base + p[1], p[2], p[3]); fillP(g, p[4]); g.strokeStyle = 'rgba(40,40,50,0.5)'; g.lineWidth = 1.2; g.beginPath(); for (var k = 0; k < 4; k++) { g.moveTo(cx + p[0] + p[2] - 8 - k * 9, base + p[1] + 6); g.lineTo(cx + p[0] + p[2] - 8 - k * 9, base + p[1] + p[3] - 6); } g.stroke(); }
    K.poly(g, [cx - 92, base - 196, cx + 92, base - 196, cx + 70, base - 226, cx - 70, base - 226]); fillP(g, '#2e2c34');
    snowCap(g, q, [cx - 94, base - 198, cx - 70, base - 226, cx + 70, base - 226, cx + 94, base - 198], 22, { seed: 6121, over: 8, drip: true });
  }
  function drawOnnazaka(g, q) {
    // 右侧蜿蜒上山的缓坡小路
    var path = [1640, 900, 1560, 820, 1600, 720, 1720, 650, 1780, 580, 1720, 530];
    trodPath(g, q, path, 80, 26, 6131, { prints: true });
    // 竹扶手（沿路外侧的竖桩 + 横竹）
    g.strokeStyle = '#8a7a4a'; g.lineWidth = 4; g.beginPath();
    var posts = [[1720, 890, 60], [1660, 820, 52], [1690, 730, 44], [1800, 665, 36], [1860, 596, 30]];
    for (var i = 0; i < posts.length; i++) { g.moveTo(posts[i][0], posts[i][1]); g.lineTo(posts[i][0], posts[i][1] - posts[i][2]); }
    g.stroke();
    g.beginPath(); for (i = 0; i < posts.length; i++) { if (i) g.lineTo(posts[i][0], posts[i][1] - posts[i][2]); else g.moveTo(posts[i][0], posts[i][1] - posts[i][2]); } strokeP(g, '#a8965c', 5);
    snowCap(g, q, [posts[0][0], posts[0][1] - 62, posts[2][0], posts[2][1] - 46, posts[4][0], posts[4][1] - 32], 4, { seed: 6133, over: 3, step: 40 });
    // 小石灯
    drawStoneLantern(g, q, 1560, 870, 0.5, true);
    // 路旁的小杉
    var r = RNG(6135);
    for (i = 0; i < K.byModel(q, 3, 5, 7); i++) snowCedar(g, q, r.range(1840, 1940), r.range(560, 900), r.range(200, 320), r, { haze: 0.1 });
  }
  DM.HDBG.def('shrine', {
    outdoor: true,
    draw: function (g, q) { drawShrine2(g, q); },
    lights: [{ x: 504, y: 548, r: 100, color: '#ffb050', i: 0.5, flicker: 0.15, kind: 'lamp' }, { x: 1560, y: 795, r: 50, color: '#ffb050', i: 0.4, flicker: 0.15, kind: 'lamp' }],
    key: { x: -0.2, color: '#e4e8f2', amb: '#56607a', rim: 0.35 }
  });

  /* ======================= 墓石 / 地藏 / 卒塔婆 ======================= */
  // 墓石：台座 + 中台 + 竿石（刻字以竖笔画暗示），各层积雪；o = { col, flowers, vase, natural(自然石), plain }
  function graveStone(g, q, x, base, w, h, o) {
    o = o || {};
    var st = o.col || '#5e6068', sd = K.shade(st, -0.45), lt = K.shade(st, 0.25), r = RNG(o.seed || (x | 0));
    if (q.light >= 1) K.contact(g, x + w * 0.1, base, w * 0.8, w * 0.12, 0.5);
    if (o.natural) {
      // 自然石的墓（不规整的石块，立在小台座上）
      rectP(g, x - w * 0.55, base - h * 0.12, w * 1.1, h * 0.12); fillP(g, K.lin(g, x - w * 0.55, 0, x + w * 0.55, 0, [st, sd]));
      var pts = [x - w * 0.38, base - h * 0.12, x - w * 0.44, base - h * 0.6, x - w * 0.2, base - h * 0.98, x + w * 0.16, base - h, x + w * 0.42, base - h * 0.66, x + w * 0.36, base - h * 0.12];
      smoothPath(g, pts, true); mat(g, q, st, 'rock', ROCK, 96, x, base);
      smoothPath(g, pts, true); fillP(g, K.lin(g, x - w * 0.4, 0, x + w * 0.4, 0, ['rgba(255,255,255,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,20,0.4)']));
      g.strokeStyle = 'rgba(20,20,26,0.6)'; g.lineWidth = Math.max(1.5, w * 0.02); g.beginPath(); var er2 = RNG((o.seed || 1) + 91); for (var c = 0; c < 6; c++) { var cy = base - h * 0.85 + c * h * 0.11; g.moveTo(x - w * 0.05 + er2.range(-3, 3), cy); g.lineTo(x + w * 0.03, cy + h * 0.03); g.moveTo(x + er2.range(-4, 4), cy + h * 0.02); g.lineTo(x + er2.range(-6, 6), cy + h * 0.08); } g.stroke();
      snowCap(g, q, [x - w * 0.42, base - h * 0.62, x - w * 0.2, base - h * 0.97, x + w * 0.16, base - h, x + w * 0.4, base - h * 0.66], h * 0.06, { seed: (o.seed || 1) + 1, over: w * 0.04 });
    } else {
      var b1 = h * 0.16, b2 = h * 0.14, tw = w * 0.42, th = h - b1 - b2;
      rectP(g, x - w / 2, base - b1, w, b1); fillP(g, K.lin(g, x - w / 2, 0, x + w / 2, 0, [lt, st, sd]));
      snowCap(g, q, [x - w / 2, base - b1, x + w / 2, base - b1], b1 * 0.35, { seed: (o.seed || 1) + 2, over: w * 0.03 });
      rectP(g, x - w * 0.34, base - b1 - b2, w * 0.68, b2); fillP(g, K.lin(g, x - w * 0.34, 0, x + w * 0.34, 0, [lt, st, sd]));
      snowCap(g, q, [x - w * 0.34, base - b1 - b2, x + w * 0.34, base - b1 - b2], b2 * 0.3, { seed: (o.seed || 1) + 3, over: w * 0.02 });
      rectP(g, x - tw / 2, base - h, tw, th); fillP(g, K.lin(g, x - tw / 2, 0, x + tw / 2, 0, [lt, st, sd]));
      if (q.light >= 2) { rectP(g, x - tw / 2 + 2, base - h + 4, tw * 0.12, th - 8); fillP(g, 'rgba(255,255,255,0.18)'); }
      // 刻字
      // 刻字：一列刻入石面的笔画（凹槽暗、下沿一点亮），不规则，避免像十字
      var nch = o.chars || 5, er = RNG((o.seed || 1) + 77), cw2 = tw * 0.2;
      rectP(g, x - tw * 0.22, base - h + th * 0.08, tw * 0.44, th * 0.84); fillP(g, 'rgba(0,0,0,0.12)');
      g.strokeStyle = 'rgba(16,16,22,0.7)'; g.lineWidth = Math.max(1.2, tw * 0.035); g.beginPath();
      for (var k = 0; k < nch; k++) {
        var yy = base - h + th * 0.12 + k * th * 0.78 / nch, s2 = th * 0.7 / nch;
        for (var st3 = 0; st3 < 3; st3++) { var kind = er(); var ax = x + er.range(-cw2, cw2) * 0.8, ay = yy + er.range(0, s2 * 0.6); if (kind < 0.4) { g.moveTo(ax, ay); g.lineTo(ax + er.range(-2, 2), ay + s2 * er.range(0.3, 0.6)); } else if (kind < 0.7) { g.moveTo(ax - cw2 * 0.5, ay); g.lineTo(ax + cw2 * 0.4, ay + er.range(-2, 3)); } else { g.moveTo(ax, ay); g.lineTo(ax + cw2 * er.range(-0.6, 0.6), ay + s2 * 0.4); } }
      }
      g.stroke();
      if (o.crest) { K.ellipse(g, x, base - h + th * 0.08, tw * 0.16, tw * 0.16); strokeP(g, 'rgba(200,180,120,0.7)', 2); }
      snowCap(g, q, [x - tw / 2 - 2, base - h, x + tw / 2 + 2, base - h], th * 0.08, { seed: (o.seed || 1) + 4, over: tw * 0.08, drip: true });
      // 花立与香炉
      if (o.vase !== false) {
        for (var v2 = -1; v2 <= 1; v2 += 2) { rectP(g, x + v2 * w * 0.3 - w * 0.05, base - b1 - h * 0.18, w * 0.1, h * 0.18); fillP(g, sd); }
        rectP(g, x - w * 0.1, base - b1 - h * 0.06, w * 0.2, h * 0.06); fillP(g, sd);
      }
    }
    if (o.flowers) {
      // 新鲜的供花（红白），在一片白雪中很显眼
      var fl = [[-0.3, '#c8303a'], [0.3, '#c8303a']];
      for (var f = 0; f < fl.length; f++) {
        var fx = x + fl[f][0] * w, fy = base - (o.natural ? h * 0.12 : h * 0.3);
        g.strokeStyle = '#3a5a30'; g.lineWidth = 2; g.beginPath(); for (var st2 = 0; st2 < 4; st2++) { g.moveTo(fx, fy); g.lineTo(fx + (st2 - 1.5) * w * 0.04, fy - h * 0.18); } g.stroke();
        for (st2 = 0; st2 < 5; st2++) { K.ellipse(g, fx + (st2 - 2) * w * 0.035, fy - h * 0.18 - r.range(0, h * 0.04), w * 0.035, w * 0.035); fillP(g, st2 % 2 ? fl[f][1] : '#f2ece2'); }
      }
    }
  }
  function sotoba(g, q, x, base, h, n, seed) {
    var r = RNG(seed);
    for (var i = 0; i < n; i++) {
      var sx = x + i * h * 0.09, sh = h * r.range(0.85, 1.05), a = r.range(-0.06, 0.06);
      g.save(); g.translate(sx, base); g.rotate(a);
      K.poly(g, [-h * 0.03, 0, h * 0.03, 0, h * 0.03, -sh * 0.9, h * 0.015, -sh * 0.93, h * 0.03, -sh * 0.96, 0, -sh, -h * 0.03, -sh * 0.96, -h * 0.015, -sh * 0.93, -h * 0.03, -sh * 0.9]);
      fillP(g, K.lin(g, -h * 0.03, 0, h * 0.03, 0, ['#b8ae98', '#8a8270']));
      g.strokeStyle = 'rgba(30,26,20,0.6)'; g.lineWidth = 1.2; g.beginPath(); for (var k = 0; k < 6; k++) { var yy = -sh * 0.85 + k * sh * 0.12; g.moveTo(-h * 0.012, yy); g.lineTo(h * 0.012, yy + 2); } g.stroke();
      g.restore();
    }
    void q;
  }
  function jizoStatue(g, q, x, base, s, o) {
    o = o || {};
    var st = o.col || '#6a6a70', sd = K.shade(st, -0.45);
    g.save(); g.translate(x, base); g.scale(s, s);
    if (q.light >= 1) K.contact(g, 6, 0, 44, 8, 0.5);
    // 台座（莲台）
    K.rr(g, -36, -20, 72, 20, 4); fillP(g, K.lin(g, -36, 0, 36, 0, [K.shade(st, 0.2), sd]));
    // 身体（袈裟，圆润的轮廓）
    K.path(g, 'M-28 -20 Q-34 -70 -22 -100 Q-14 -116 0 -116 Q14 -116 22 -100 Q34 -70 28 -20 Z');
    fillP(g, K.lin(g, -30, 0, 30, 0, [K.shade(st, 0.22), st, sd]));
    g.strokeStyle = 'rgba(20,20,26,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-16, -96); g.quadraticCurveTo(-4, -60, -10, -24); g.moveTo(16, -96); g.quadraticCurveTo(6, -60, 12, -24); g.stroke();
    // 合掌的手
    K.ellipse(g, 0, -74, 6, 10); fillP(g, K.shade(st, 0.1));
    // 头
    K.ellipse(g, 0, -134, 20, 22); fillP(g, K.rad(g, -6, -140, 2, 24, [K.shade(st, 0.3), st, sd]));
    g.strokeStyle = 'rgba(20,20,26,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-9, -134); g.quadraticCurveTo(-6, -132, -3, -134); g.moveTo(3, -134); g.quadraticCurveTo(6, -132, 9, -134); g.stroke();
    // 红围兜
    if (o.bib !== false) { K.path(g, 'M-24 -112 Q0 -104 24 -112 L18 -88 Q0 -70 -18 -88 Z'); fillP(g, K.lin(g, 0, -112, 0, -74, [o.bibCol || '#c8302c', K.shade(o.bibCol || '#c8302c', -0.35)])); if (q.model >= 1) { K.path(g, 'M-24 -112 Q0 -104 24 -112'); strokeP(g, 'rgba(255,220,210,0.35)', 1.5); } }
    // 红帽（毛线帽）
    if (o.cap) { K.path(g, 'M-21 -140 Q-20 -160 0 -162 Q20 -160 21 -140 Q0 -146 -21 -140 Z'); fillP(g, '#b8282a'); K.ellipse(g, 0, -164, 5, 5); fillP(g, '#d84040'); }
    g.restore();
    // 头与肩上的雪
    snowCap(g, q, [x - 18 * s, base - (o.cap ? 158 : 150) * s, x + 18 * s, base - (o.cap ? 158 : 150) * s], 9 * s, { seed: (x | 0) + 1, over: 4 * s });
    snowCap(g, q, [x - 30 * s, base - 102 * s, x - 14 * s, base - 112 * s], 6 * s, { seed: (x | 0) + 2, over: 3 * s });
    snowCap(g, q, [x + 14 * s, base - 112 * s, x + 30 * s, base - 102 * s], 6 * s, { seed: (x | 0) + 3, over: 3 * s });
  }

  /* =================================================================
   * 送门 okurimon：村子西北端的木门，门外的送道伸进雾中的雪葬谷
   * ================================================================= */
  function drawOkurimon(g, q) {
    var r = RNG(7001), i;
    sky(g, q, { y: 0, h: 640, seed: 701, gx: 0.5, gy: 0.4, gw: 0.25, dens: 0.08, hor: '#cfd2da' });
    // 门外：雾中的谷（越远越白）
    for (var L = 0; L < 3; L++) for (i = 0; i < K.byModel(q, 8, 12, 16); i++) { var tx = r.range(-40, 1960); snowCedar(g, q, tx, 600 + L * 50 + r.range(-20, 20), r.range(180, 300) * (0.6 + L * 0.2), r, { haze: 0.85 - L * 0.22 }); }
    rectP(g, 0, 300, W, 500); fillP(g, K.lin(g, 0, 300, 0, 800, ['rgba(214,218,228,0)', 'rgba(214,218,228,0.75)', 'rgba(214,218,228,0.4)']));
    snowField(g, q, 0, 640, W, 440, { yh: 560, seed: 7003, amp: 0.6, fog: 160 });
    // 送道：穿过门、向谷中下去，消失在雾里
    trodPath(g, q, [960, 1100, 950, 900, 960, 780, 972, 700, 980, 640], 170, 30, 7005, { prints: true });
    g.fillStyle = K.lin(g, 0, 560, 0, 760, ['rgba(220,224,232,0.95)', 'rgba(220,224,232,0)']); g.fillRect(760, 560, 420, 200);
    drawSendGate(g, q);
    // 石堆（左）
    var stones = [[300, 868, 150, 54], [280, 818, 112, 44], [304, 776, 84, 36], [292, 742, 60, 28], [312, 714, 40, 22], [240, 860, 70, 34], [370, 862, 66, 30]];
    for (i = 0; i < stones.length; i++) { var st = stones[i]; boulder(g, q, st[0], st[1], st[2], st[3], { seed: 7010 + i, color: '#4e5058', wet: false }); snowCap(g, q, [st[0] - st[2] * 0.36, st[1] - st[3] * 0.9, st[0] + st[2] * 0.36, st[1] - st[3] * 0.85], st[3] * 0.28, { seed: 7020 + i, over: st[2] * 0.05 }); }
    // 供品（右下）：小木台上的杯、饭团、枯花、蜡烛头
    drawOfferings(g, q, 1416, 892, false);
    // 道标（右）
    var px = 1580;
    if (q.light >= 1) K.contact(g, px, 760, 40, 8, 0.45);
    K.poly(g, [px - 22, 760, px + 22, 760, px + 22, 510, px, 488, px - 22, 510]); fillP(g, K.lin(g, px - 22, 0, px + 22, 0, ['#8a8270', '#5a5446', '#3a3428']));
    g.strokeStyle = 'rgba(24,20,16,0.75)'; g.lineWidth = 3; g.beginPath(); for (var k = 0; k < 6; k++) { var yy = 530 + k * 30; g.moveTo(px - 9, yy); g.lineTo(px + 9, yy); g.moveTo(px, yy - 6); g.lineTo(px, yy + 14); if (k % 2) { g.moveTo(px - 8, yy + 10); g.lineTo(px + 6, yy + 16); } } g.stroke();
    snowCap(g, q, [px - 24, 512, px, 488, px + 24, 512], 10, { seed: 7031, over: 5 });
    fencePosts(g, q, [[90, 1040, 180], [230, 1030, 150], [1700, 1030, 160], [1850, 1050, 190]], 7035);
    fgSnowbank(g, q, [-20, 1040, 150, 1030, 330, 1070, 400, 1090], 7037);
    fgSnowbank(g, q, [1560, 1090, 1680, 1050, 1820, 1040, 1940, 1050], 7039);
    sparkle(g, q, 0, 640, W, 440, 220, 7033);
    K.vignette(g, W, H, q.light >= 1 ? 0.5 : 0.36, 0.45);
  }
  function drawSendGate(g, q) {
    // 两根粗木柱、上下两道横木，挂着褪色的注连绳与纸垂；风化的灰色木头
    var p1 = 744, p2 = 1176, top = 196, bot = 790, pw = 56;
    function post(x) {
      if (q.light >= 1) K.contact(g, x + 10, bot, 60, 10, 0.5);
      K.poly(g, [x - pw / 2, top, x + pw / 2, top, x + pw * 0.55, bot, x - pw * 0.55, bot]);
      mat(g, q, '#6a6458', 'wood', { c1: '#3a3630', c2: '#7a7466', gap: '#2a2620', planks: 1, dir: 'v', ring: 3, seed: 219 }, 128, x, top);
      K.poly(g, [x - pw / 2, top, x + pw / 2, top, x + pw * 0.55, bot, x - pw * 0.55, bot]); fillP(g, K.lin(g, x - pw / 2, 0, x + pw / 2, 0, ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,20,0.45)']));
      g.fillStyle = 'rgba(20,20,26,0.4)'; g.fillRect(x - 3, top + 30, 3, bot - top - 60);
    }
    post(p1); post(p2);
    // 贯
    rectP(g, p1 - 70, 300, p2 - p1 + 140, 34); mat(g, q, '#625c50', 'wood', { c1: '#3a3630', c2: '#7a7466', gap: '#2a2620', planks: 1, dir: 'h', seed: 221 }, 128, 0, 300);
    rectP(g, p1 - 70, 300, p2 - p1 + 140, 34); fillP(g, K.lin(g, 0, 300, 0, 334, ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.35)']));
    snowCap(g, q, [p1 - 70, 300, p2 + 70, 300], 16, { seed: 7041, over: 8 });
    // 笠木
    K.path(g, 'M-0.6 0 Q-0.56 0.12 -0.45 0.14 L0.45 0.14 Q0.56 0.12 0.6 0 L0.6 0.3 L-0.6 0.3 Z', 960, top - 40, 480, 140);
    fillP(g, K.lin(g, 0, top - 40, 0, top + 2, ['#5a564c', '#2e2c26']));
    snowCap(g, q, [672, top - 34, 750, top - 22, 1170, top - 22, 1248, top - 34], 28, { seed: 7043, over: 12, drip: true, step: 30 });
    icicles(g, q, 690, 1230, top + 4, 50, 7045, 0.9);
    // 褪色的注连绳与纸垂
    g.beginPath(); g.moveTo(p1 + 20, 350); g.quadraticCurveTo(960, 420, p2 - 20, 350);
    g.strokeStyle = '#8a7c58'; g.lineWidth = 14; g.stroke(); g.strokeStyle = '#a89a72'; g.lineWidth = 6; g.stroke();
    for (var k = 0; k < 5; k++) { var px = 820 + k * 70, py = 360 + Math.sin((k + 0.5) / 5 * PI) * 34; g.save(); g.translate(px, py); g.scale(1.1, 1.1); K.poly(g, [0, 0, 10, 0, 10, 12, 4, 12, 4, 26, 12, 26, 12, 40, 6, 40, 6, 52, 0, 52]); fillP(g, '#e6e2d6'); g.restore(); }
  }
  function drawOfferings(g, q, cx, base, fresh) {
    if (q.light >= 1) K.contact(g, cx, base, 110, 12, 0.45);
    rectP(g, cx - 90, base - 46, 180, 14); fillP(g, '#5a4632'); rectP(g, cx - 80, base - 32, 10, 32); fillP(g, '#3a2e22'); rectP(g, cx + 70, base - 32, 10, 32); fillP(g, '#3a2e22');
    snowCap(g, q, [cx - 92, base - 46, cx + 92, base - 46], 6, { seed: (cx | 0) + 3, over: 4 });
    // 杯、饭团、蜡烛头、花
    K.path(g, 'M-14 0 L14 0 L10 16 L-10 16 Z', cx - 50, base - 64); fillP(g, '#e8e4dc');
    for (var i = 0; i < 2; i++) { var ox = cx - 4 + i * 30; K.path(g, 'M-14 8 Q-14 -10 0 -14 Q14 -10 14 8 Z', ox, base - 56); fillP(g, '#f0eee8'); rectP(g, ox - 10, base - 54, 20, 8); fillP(g, '#1e2a22'); }
    rectP(g, cx + 54, base - 70, 10, 22); fillP(g, '#e8e2d0'); K.ellipse(g, cx + 59, base - 48, 12, 4); fillP(g, '#6a6a72');
    g.strokeStyle = fresh ? '#3a5a30' : '#6a5a40'; g.lineWidth = 2; g.beginPath(); for (var s2 = 0; s2 < 5; s2++) { g.moveTo(cx - 70, base - 46); g.lineTo(cx - 80 + s2 * 5, base - 92); } g.stroke();
    for (s2 = 0; s2 < 5; s2++) { K.ellipse(g, cx - 80 + s2 * 5, base - 94, 5, 4); fillP(g, fresh ? (s2 % 2 ? '#e8d050' : '#f0ece2') : '#8a7a5a'); }
  }
  DM.HDBG.def('okurimon', {
    outdoor: true,
    draw: function (g, q) { drawOkurimon(g, q); },
    lights: [],
    key: { x: 0, color: '#e6e8f0', amb: '#5c6278', rim: 0.45 }
  });

  /* =================================================================
   * 雪葬谷 valley：送道尽头的岩台，脚下是深谷，对面的山崖消失在雾里
   * ================================================================= */
  function drawValley(g, q) {
    var r = RNG(7101), i;
    sky(g, q, { y: 0, h: 700, seed: 711, gx: 0.45, gy: 0.35, gw: 0.25, dens: 0.1, hor: '#d0d3db' });
    // 对面的山崖：两层，越远越淡，崖顶有成排的雪杉
    var cl = [[0.7, 300, 0.6], [0.4, 420, 0.85]];
    for (i = 0; i < cl.length; i++) {
      var hz = cl[i][0], y0 = cl[i][1], rr = RNG(7110 + i), pts = [-20, H];
      for (var x = -20; x <= 1960; x += 30) pts.push(x, y0 + Math.sin(x * 0.005 + i * 2) * 40 + rr.range(-12, 12));
      pts.push(1960, H);
      g.save(); K.poly(g, pts); g.clip();
      strataCliff(g, q, -20, y0 - 60, 1980, 1140 - y0, { seed: 7120 + i, dip: 0.05 - i * 0.1, band: 40 + i * 14, hz: hz, snow: 1.2, res: 0.24 });
      g.restore();
      for (var tI = 0; tI < K.byModel(q, 8, 14, 20); tI++) { var tx = rr.range(-20, 1960); snowCedar(g, q, tx, y0 + Math.sin(tx * 0.005 + i * 2) * 40 + 10, rr.range(50, 90) * cl[i][2], rr, { haze: hz }); }
      rectP(g, 0, y0 + 80, W, 700); fillP(g, K.lin(g, 0, y0 + 80, 0, y0 + 500, ['rgba(212,216,226,0)', 'rgba(212,216,226,' + (0.55 * hz + 0.2).toFixed(2) + ')']));
    }
    // 深谷：对岸崖壁一直落进谷底（越深越暗），右侧近崖的内壁处于阴影中，谷底是层层雾带
    K.poly(g, [400, 600, 1520, 560, 1520, H, 400, H]); fillP(g, K.lin(g, 0, 560, 0, H, ['rgba(120,128,148,0.2)', 'rgba(52,58,76,0.75)', 'rgba(26,28,40,0.95)']));
    var inner = [1500, 600, 1460, 760, 1380, 880, 1260, 1000, 1180, H, 1520, H];
    g.save(); K.poly(g, inner); g.clip(); strataCliff(g, q, 1150, 580, 380, 520, { seed: 7133, dip: -0.2, band: 50, snow: 0.8 }); rectP(g, 1150, 580, 380, 520); fillP(g, 'rgba(30,34,56,0.55)'); g.restore();
    for (i = 0; i < 5; i++) { g.save(); g.translate(960, 760 + i * 70); g.scale(1, 0.1); K.blob(g, 0, 0, 640 - i * 70, '#d6dae4', 0.42 - i * 0.06); g.restore(); }
    steam(g, q, 600, 860, 700, 220, 18, 7131, 0.18);
    // 右侧近处的山崖与树
    var rc = [1430, H, 1450, 820, 1510, 600, 1590, 420, 1700, 300, 1960, 220, 1960, H];
    g.save(); K.poly(g, rc); g.clip(); strataCliff(g, q, 1420, 200, 550, 900, { seed: 7141, dip: -0.25, band: 60, snow: 1.1 }); g.restore();
    if (q.light >= 1) { g.beginPath(); g.moveTo(1430, H); g.lineTo(1450, 820); g.lineTo(1510, 600); g.lineTo(1590, 420); g.lineTo(1700, 300); strokeP(g, 'rgba(245,248,252,0.7)', 4); }
    for (i = 0; i < K.byModel(q, 5, 8, 11); i++) { var tx2 = r.range(1560, 1940); snowCedar(g, q, tx2, 300 + (1940 - tx2) * 0.35 + r.range(60, 420), r.range(200, 330), r, { haze: 0.05 }); }
    // 左前景的岩台（送道的尽头）
    var ledge = [-20, 640, 200, 620, 420, 600, 640, 560, 900, 600, 920, 640, 760, 720, 600, 800, 520, 960, 500, H, -20, H];
    g.save(); K.poly(g, ledge); g.clip(); snowField(g, q, -20, 540, 960, 560, { yh: 380, seed: 7151, amp: 1.1, fog: 120 }); g.restore();
    // 岩台边缘（崖口）下方露出的暗色岩壁（让人感到脚下是落差）
    K.poly(g, [640, 562, 900, 602, 920, 640, 760, 720, 600, 800, 520, 960, 500, H, 560, H, 600, 960, 700, 820, 860, 740, 980, 660, 960, 610]);
    fillP(g, K.lin(g, 600, 600, 980, 900, ['#4a4e5e', '#2a2e3c', '#1a1c28']));
    // 岩台边缘（崖口）的阴影线与悬出的雪檐
    g.beginPath(); g.moveTo(640, 560); g.lineTo(900, 600); g.lineTo(920, 640); g.lineTo(760, 720); g.lineTo(600, 800); g.lineTo(520, 960); g.lineTo(500, H); strokeP(g, K.rgba(SN.shd, 0.55), 5);
    snowCap(g, q, [640, 560, 900, 600, 920, 640], 14, { seed: 7153, over: 18, drip: true });
    // 路的尽头：踏痕在崖口前断掉；一根旧木桩与系在上面的破绳
    trodPath(g, q, [120, 1100, 300, 900, 520, 720, 700, 600, 780, 580], 150, 40, 7155, { prints: true });
    K.line(g, 820, 610, 828, 520, 10, '#4a3e32'); snowCap(g, q, [814, 520, 834, 520], 7, { seed: 7157, over: 4 });
    g.beginPath(); g.moveTo(828, 540); g.quadraticCurveTo(860, 600, 850, 660); strokeP(g, '#8a7a5a', 3);
    sparkle(g, q, 0, 560, 960, 520, 200, 7159);
    K.vignette(g, W, H, q.light >= 1 ? 0.52 : 0.38, 0.45);
  }
  DM.HDBG.def('valley', {
    outdoor: true,
    draw: function (g, q) { drawValley(g, q); },
    lights: [],
    key: { x: 0.1, color: '#e4e8f0', amb: '#58607a', rim: 0.5 }
  });

  /* =================================================================
   * 火见橹 watchtower（+ past：1983 年，半钟完好、发亮；2003 年钟上有一道裂缝）
   * ================================================================= */
  function drawWatchtower(g, q, v) {
    var past = v === 'past', r = RNG(7201), i;
    sky(g, q, { y: 0, h: 720, seed: 721, gx: 0.6, gy: 0.25, gw: 0.2, dens: 0.05 });
    mountainLayers(g, q, { top: 330, base: 640, seed: 72, amp: 120, near: 80 });
    for (i = 0; i < K.byModel(q, 8, 14, 20); i++) snowCedar(g, q, r.range(-40, 1960), r.range(600, 660), r.range(140, 240), r, { haze: 0.35 });
    snowField(g, q, 0, 620, W, 460, { yh: 520, seed: 7203, amp: 0.8, fog: 180 });
    // 后方的民家（村子的一角）
    var back = [[1180, 700, 150, 70, '#5a3a30', 1], [1360, 690, 170, 80, '#3a4a5a', 0], [1560, 700, 160, 74, '#6a4a3a', 1], [1740, 690, 190, 86, '#4a5a4a', 0], [-20, 690, 120, 60, '#5a4a40', 0]];
    for (i = 0; i < back.length; i++) farHouse(g, q, back[i][0], back[i][1], back[i][2], back[i][3], { lit: past ? true : (back[i][5] ? 0.6 : 0), roof: back[i][4] });
    // 公民馆（左）与火见橹
    drawHallRoof(g, q, past);
    drawFireTower(g, q, past);
    // 右前方的民家（较近，深檐、冰柱）
    perspHouse(g, q, { vx: 960, vy: 520, x: 1560, yb: 880, w: 300, h: 190, rh: 110, kb: 0.86, side: 'R', roof: '#7a3a30', seed: 7205, wins: [[0.15, 0.3, 0.25, 0.35, past ? 1 : 0], [0.6, 0.3, 0.25, 0.35, 1]], kakoi: true });
    // 村道（湿的消雪管路面）横过画面，两侧雪墙
    var ry0 = 900, ry1 = 960;
    K.poly(g, [-20, ry0, 1940, ry0 - 30, 1940, ry1 - 20, -20, ry1]); fillP(g, K.lin(g, 0, ry0 - 30, 0, ry1, ['#4a5060', '#2e333e']));
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = K.lin(g, 0, ry0, 0, ry1, ['rgba(200,206,222,0.18)', 'rgba(200,206,222,0)']); g.fillRect(-20, ry0 - 30, 1960, 70); g.restore();
    snowBank(g, q, [-20, 886, 400, 880, 900, 872, 1400, 862, 1940, 852], ry0 + 2, { seed: 7207, stops: ['#e8ecf4', '#c8cede'] });
    // 电线杆与电线（横过画面）
    var poles = [[300, 900, 560], [1240, 880, 600], [1880, 866, 620]];
    for (i = 0; i < poles.length; i++) {
      var p = poles[i]; rectP(g, p[0] - 8, p[1] - p[2], 16, p[2]); fillP(g, K.lin(g, p[0] - 8, 0, p[0] + 8, 0, ['#8a7a6a', '#4a3e34']));
      K.line(g, p[0] - 60, p[1] - p[2] + 24, p[0] + 60, p[1] - p[2] + 24, 6, '#3a3028'); snowCap(g, q, [p[0] - 62, p[1] - p[2] + 20, p[0] + 62, p[1] - p[2] + 20], 6, { seed: 7210 + i });
      drift(g, q, p[0] - 12, p[0] + 12, p[1], 18, 7215 + i);
    }
    g.strokeStyle = 'rgba(26,26,32,0.65)'; g.lineWidth = 1.6; g.beginPath();
    for (i = 0; i + 1 < poles.length; i++) for (var k = -1; k <= 1; k += 2) { var a0 = poles[i], b0 = poles[i + 1]; g.moveTo(a0[0] + k * 50, a0[1] - a0[2] + 24); g.quadraticCurveTo((a0[0] + b0[0]) / 2, (a0[1] - a0[2] + b0[1] - b0[2]) / 2 + 70, b0[0] + k * 50, b0[1] - b0[2] + 24); }
    g.stroke();
    // 铭牌（塔脚，路边）
    var px = 1288;
    blueContact(g, px, 822, 60, 8, 0.45);
    K.line(g, px, 822, px, 760, 8, '#4a3e32');
    rectP(g, px - 84, 708, 168, 100); fillP(g, past ? '#8a6a44' : '#6a5a46'); rectP(g, px - 84, 708, 168, 100); strokeP(g, '#3a2e22', 4);
    g.strokeStyle = past ? 'rgba(30,20,10,0.85)' : 'rgba(30,24,16,0.6)'; g.lineWidth = 4; g.beginPath(); for (var c = 0; c < 4; c++) { var cx = px - 54 + c * 36; g.moveTo(cx - 10, 734); g.lineTo(cx + 8, 736); g.moveTo(cx + 2, 728); g.lineTo(cx - 1, 760); g.moveTo(cx - 9, 748); g.lineTo(cx + 9, 754); } g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(px - 60, 784); g.lineTo(px + 60, 784); g.stroke();
    snowCap(g, q, [px - 88, 708, px + 88, 708], 12, { seed: 7211, over: 6 });
    drift(g, q, px - 20, px + 20, 822, 16, 7212);
    // 前景雪堆
    fgSnowbank(g, q, [-20, 990, 300, 970, 700, 1010, 900, 1090], 7221);
    fgSnowbank(g, q, [1100, 1090, 1400, 1000, 1700, 985, 1940, 1000], 7223);
    sparkle(g, q, 0, 620, W, 460, 220, 7213);
    K.vignette(g, W, H, q.light >= 1 ? 0.42 : 0.3, 0.5);
  }
  function drawHallRoof(g, q, past) {
    // 公民馆：低矮的建筑，屋顶厚雪，屋檐冰柱，墙上一扇亮着的窗
    var x0 = 40, x1 = 690, eave = 640, base = 860;
    rectP(g, x0 + 30, eave, x1 - x0 - 60, base - eave); mat(g, q, '#9a968c', 'plaster', { c1: '#7a766c', c2: '#b0aca0', seed: 223 }, 192, x0, eave);
    rectP(g, x0 + 30, eave, x1 - x0 - 60, base - eave); fillP(g, K.lin(g, 0, eave, 0, base, ['rgba(0,0,20,0.35)', 'rgba(0,0,20,0.1)']));
    var wins = [[120, 700], [300, 700], [480, 700]];
    for (var i = 0; i < wins.length; i++) { var lit = past || i === 1; rectP(g, wins[i][0], wins[i][1], 110, 80); fillP(g, lit ? K.lin(g, 0, 700, 0, 780, ['#ffd690', '#ffb860']) : '#4a5060'); g.strokeStyle = '#4a4a50'; g.lineWidth = 4; g.strokeRect(wins[i][0], wins[i][1], 110, 80); K.line(g, wins[i][0] + 55, wins[i][1], wins[i][0] + 55, wins[i][1] + 80, 3, '#4a4a50'); if (lit && q.light >= 1) K.glow(g, wins[i][0] + 55, wins[i][1] + 40, 110, '#ffb050', 0.3); }
    K.poly(g, [x0, eave + 6, x0 + 80, 540, x1 - 80, 540, x1, eave + 6]); fillP(g, '#3a3a44');
    snowCap(g, q, [x0 - 10, eave + 8, x0 + 80, 530, x1 - 80, 530, x1 + 10, eave + 8], 50, { seed: 7221, over: 20, drip: true, step: 30 });
    icicles(g, q, x0, x1, eave + 12, 70, 7223, 1);
    drift(g, q, x0 + 20, x1 - 20, base, 34, 7225);
  }
  function drawFireTower(g, q, past) {
    // 四柱钢架塔：越往上越细，X 形斜撑，中央梯子，顶上带小屋顶的瞭望台挂着半钟
    var cx = 964, base = 840, top = 210, i;
    var steel = past ? '#9a3a2a' : '#6a3a2c', steelD = past ? '#5a1e14' : '#3a2018';
    function lx(y, side) { var t = (base - y) / (base - top); return cx + side * lerp(170, 54, t); }
    blueContact(g, cx + 30, base, 240, 22, 0.5);
    // 后两根柱（略细略暗）与前两根
    for (var side = -1; side <= 1; side += 2) {
      K.line(g, lx(base, side) * 0.98 + cx * 0.02, base - 10, lx(top, side) * 0.96 + cx * 0.04, top, 5, steelD);
      K.line(g, lx(base, side), base, lx(top, side), top, 9, steel);
      if (q.light >= 1 && side < 0) K.line(g, lx(base, side) - 2, base, lx(top, side) - 2, top, 2, 'rgba(255,200,170,0.35)');
    }
    // 横梁与 X 斜撑
    var levels = [840, 700, 580, 470, 370, 286, 214];
    g.strokeStyle = steel; g.lineWidth = 4; g.beginPath();
    for (i = 0; i < levels.length - 1; i++) {
      var ya = levels[i], yb = levels[i + 1];
      g.moveTo(lx(ya, -1), ya); g.lineTo(lx(ya, 1), ya);
      g.moveTo(lx(ya, -1), ya); g.lineTo(lx(yb, 1), yb); g.moveTo(lx(ya, 1), ya); g.lineTo(lx(yb, -1), yb);
    }
    g.stroke();
    // 横梁上的积雪
    for (i = 1; i < levels.length; i++) snowCap(g, q, [lx(levels[i], -1), levels[i] - 2, lx(levels[i], 1), levels[i] - 2], 6, { seed: 7230 + i, over: 3 });
    // 锈迹
    if (!past && q.model >= 1) { var r = RNG(7239); for (i = 0; i < 14; i++) { var yy = r.range(top, base), sd = r() < 0.5 ? -1 : 1; K.ellipse(g, lx(yy, sd), yy, 4, 9); fillP(g, 'rgba(140,70,30,0.5)'); } }
    // 中央的梯子
    var ly0 = 840, ly1 = 240;
    K.line(g, cx - 20, ly0, cx - 16, ly1, 4, '#4a4a50'); K.line(g, cx + 20, ly0, cx + 16, ly1, 4, '#4a4a50');
    g.strokeStyle = '#5a5a62'; g.lineWidth = 3; g.beginPath(); for (var yy2 = ly0 - 20; yy2 > ly1; yy2 -= 26) { g.moveTo(cx - 19, yy2); g.lineTo(cx + 19, yy2); } g.stroke();
    if (q.model >= 1) { g.strokeStyle = 'rgba(240,244,250,0.8)'; g.lineWidth = 2; g.beginPath(); for (yy2 = ly0 - 20; yy2 > ly1; yy2 -= 26) { g.moveTo(cx - 18, yy2 - 2); g.lineTo(cx + 18, yy2 - 2); } g.stroke(); }
    // 瞭望台（栏杆）
    rectP(g, cx - 90, 200, 180, 12); fillP(g, steelD);
    g.strokeStyle = steel; g.lineWidth = 3; g.beginPath(); for (var px = cx - 88; px <= cx + 88; px += 22) { g.moveTo(px, 200); g.lineTo(px, 160); } g.moveTo(cx - 90, 160); g.lineTo(cx + 90, 160); g.stroke();
    snowCap(g, q, [cx - 94, 198, cx + 94, 198], 8, { seed: 7241, over: 4 });
    // 小屋顶（四角攒尖）与半钟
    K.line(g, cx - 70, 160, cx - 70, 92, 4, steelD); K.line(g, cx + 70, 160, cx + 70, 92, 4, steelD);
    K.poly(g, [cx - 104, 96, cx, 30, cx + 104, 96]); fillP(g, '#3a3a42');
    snowCap(g, q, [cx - 108, 98, cx, 26, cx + 108, 98], 22, { seed: 7243, over: 10, drip: true });
    icicles(g, q, cx - 100, cx + 100, 102, 28, 7245, 1);
    drawHanshou(g, q, cx, 108, past);
    // 防灾广播的喇叭（绑在塔腰上，朝四方）
    var sy = 420;
    for (i = 0; i < 3; i++) { g.save(); g.translate(cx + (i - 1) * 36, sy); g.rotate([-0.6 + PI, 0.6, PI / 2 + 0.2][i]); K.poly(g, [0, -6, 40, -18, 40, 18, 0, 6]); fillP(g, '#c8cad0'); K.ellipse(g, 40, 0, 4, 18); fillP(g, '#5a5c62'); g.restore(); }
  }
  function drawHanshou(g, q, cx, y, past) {
    // 半钟：青铜吊钟（小），2003 年的有一道明显的裂缝且黯淡
    var w = 64, h = 84;
    K.line(g, cx, y - 14, cx, y + 4, 4, '#2a2a30');
    K.path(g, 'M-0.32 0 Q-0.36 0.1 -0.4 0.55 Q-0.46 0.9 -0.5 1 L0.5 1 Q0.46 0.9 0.4 0.55 Q0.36 0.1 0.32 0 Z', cx, y + 4, w, h);
    fillP(g, past ? K.lin(g, cx - w / 2, 0, cx + w / 2, 0, ['#d8b860', '#a8823a', '#5a4418']) : K.lin(g, cx - w / 2, 0, cx + w / 2, 0, ['#7a7a5a', '#4e5a44', '#2a3024']));
    // 钟身的带纹
    g.strokeStyle = past ? 'rgba(90,60,20,0.6)' : 'rgba(20,26,18,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - w * 0.38, y + 4 + h * 0.4); g.lineTo(cx + w * 0.38, y + 4 + h * 0.4); g.moveTo(cx - w * 0.47, y + 4 + h * 0.86); g.lineTo(cx + w * 0.47, y + 4 + h * 0.86); g.stroke();
    if (past) { if (q.light >= 1) { K.path(g, 'M-0.2 0.06 Q-0.26 0.4 -0.28 0.9', cx, y + 4, w, h); strokeP(g, 'rgba(255,240,190,0.75)', 3); K.glow(g, cx - 8, y + 40, 50, '#ffe0a0', 0.25); } }
    else {
      // 铜绿与裂缝（从钟口斜向上的一道黑线）
      g.save(); K.path(g, 'M-0.32 0 Q-0.36 0.1 -0.4 0.55 Q-0.46 0.9 -0.5 1 L0.5 1 Q0.46 0.9 0.4 0.55 Q0.36 0.1 0.32 0 Z', cx, y + 4, w, h); g.clip();
      g.fillStyle = 'rgba(90,140,110,0.35)'; g.fillRect(cx - w / 2, y + 4 + h * 0.5, w, h * 0.5);
      g.restore();
      g.beginPath(); g.moveTo(cx + 6, y + 4 + h); g.lineTo(cx + 2, y + 4 + h * 0.78); g.lineTo(cx + 9, y + 4 + h * 0.6); g.lineTo(cx + 3, y + 4 + h * 0.42); g.lineTo(cx + 7, y + 4 + h * 0.28);
      strokeP(g, '#0e1210', 3);
      if (q.light >= 1) { g.beginPath(); g.moveTo(cx + 8, y + 4 + h); g.lineTo(cx + 4, y + 4 + h * 0.78); g.lineTo(cx + 11, y + 4 + h * 0.6); strokeP(g, 'rgba(200,210,190,0.35)', 1); }
    }
    // 撞木
    K.line(g, cx + 30, y + 30, cx + 40, y + 70, 4, '#4a3a2a');
    snowCap(g, q, [cx - w * 0.3, y + 4, cx + w * 0.3, y + 4], 6, { seed: 7251, over: 3 });
  }
  DM.HDBG.def('watchtower', {
    outdoor: true,
    draw: function (g, q, v) { drawWatchtower(g, q, v); },
    lights: function (v) { var L = [{ x: 355, y: 740, r: 110, color: '#ffc070', i: 0.45, flicker: 0, kind: 'window' }]; if (v === 'past') { L.push({ x: 175, y: 740, r: 110, color: '#ffc070', i: 0.45, flicker: 0, kind: 'window' }); L.push({ x: 535, y: 740, r: 110, color: '#ffc070', i: 0.45, flicker: 0, kind: 'window' }); } return L; },
    key: { x: 0.3, color: '#e4e8f2', amb: '#56607a', rim: 0.35 }
  });

  /* =================================================================
   * 墓地 cemetery
   * ================================================================= */
  function drawCemetery(g, q) {
    var r = RNG(7301), i, k;
    sky(g, q, { y: 0, h: 620, seed: 731, gx: 0.35, gy: 0.3, gw: 0.2, dens: 0.06 });
    mountainLayers(g, q, { top: 280, base: 470, seed: 73, amp: 110, near: 50 });
    for (i = 0; i < K.byModel(q, 10, 16, 22); i++) snowCedar(g, q, r.range(-40, 1960), r.range(420, 480), r.range(240, 380), r, { haze: 0.4 });
    snowField(g, q, 0, 450, W, 630, { yh: 330, seed: 7303, amp: 0.8, fog: 200 });
    crows(g, q, 7305, 4, 1300, 80, 400, 120, 1.2, '#26242e');
    // 后排（小、偏淡）与中排的墓：透视的行，每块墓地有低矮的石栅
    var rows = [[520, 0.42, 9, 0.55], [600, 0.6, 7, 0.3]];
    for (k = 0; k < rows.length; k++) {
      var ry = rows[k][0], sc = rows[k][1], cnt = rows[k][2], hz = rows[k][3], rr = RNG(7310 + k);
      for (i = 0; i < cnt; i++) {
        var gx = 100 + (i + rr.range(-0.2, 0.2)) * (1720 / (cnt - 1)), gw = 120 * sc, gh = 200 * sc * rr.range(0.85, 1.15);
        plotKerb(g, q, gx, ry, gw * 1.8, gw * 0.5, sc);
        graveStone(g, q, gx, ry - gw * 0.12, gw, gh, { seed: 7320 + k * 20 + i, col: mixc('#6a6c74', SKY.hor, hz), vase: sc > 0.5, chars: 3 });
        if (rr() < 0.5) sotoba(g, q, gx + gw * 0.5, ry - gw * 0.15, gh * 1.1, 2 + (rr() * 3 | 0), 7340 + k * 20 + i);
      }
      rectP(g, 0, ry - 260 * sc, W, 300 * sc); fillP(g, K.lin(g, 0, ry - 260 * sc, 0, ry + 40 * sc, [K.rgba(SKY.hor, hz * 0.5), K.rgba(SKY.hor, hz * 0.2)]));
    }
    // 光秃秃的树（左）
    bareTree(g, q, 520, 840, 560, 7351);
    // 前排：指定的三座墓与其他墓
    // 白峰家的大墓（石栅、灯笼、家纹、卒塔婆）
    plotKerb(g, q, 1376, 790, 400, 70, 1.1);
    sotoba(g, q, 1440, 700, 300, 6, 7325);
    graveStone(g, q, 1376, 772, 230, 440, { seed: 7327, col: '#4e5058', crest: true, chars: 6 });
    drawStoneLantern(g, q, 1226, 772, 0.75, false); drawStoneLantern(g, q, 1526, 772, 0.75, false);
    // 冬木宗介的小墓（总有人供花）
    plotKerb(g, q, 808, 800, 220, 44, 0.9);
    graveStone(g, q, 808, 800, 170, 290, { seed: 7331, col: '#6a6c74', flowers: true, chars: 4 });
    // 黑泽权藏之墓（自然石，木牌）
    plotKerb(g, q, 296, 800, 230, 44, 0.9);
    graveStone(g, q, 296, 800, 190, 300, { seed: 7333, natural: true, col: '#5a5c62' });
    sotoba(g, q, 384, 790, 240, 1, 7335);
    // 右侧其他的墓
    plotKerb(g, q, 1740, 800, 320, 50, 0.95);
    graveStone(g, q, 1660, 790, 120, 220, { seed: 7341, col: '#70727a', chars: 4 });
    graveStone(g, q, 1810, 800, 130, 250, { seed: 7343, col: '#62646c', chars: 5 });
    sotoba(g, q, 1720, 760, 200, 3, 7345);
    // 小路（透视）与前景
    trodPath(g, q, [980, 1100, 960, 960, 900, 870, 840, 830], 200, 80, 7321, { prints: true });
    fgSnowbank(g, q, [-20, 960, 200, 930, 420, 980, 560, 1090], 7361);
    fgSnowbank(g, q, [1380, 1090, 1560, 980, 1760, 950, 1940, 970], 7363);
    sotoba(g, q, 150, 1010, 300, 3, 7365);
    sparkle(g, q, 0, 520, W, 560, 240, 7347);
    K.vignette(g, W, H, q.light >= 1 ? 0.46 : 0.34, 0.45);
  }
  // 墓地四周的低矮石栅（透视的长方形框，顶上积雪）
  function plotKerb(g, q, cx, base, w, d, s) {
    var x0 = cx - w / 2, x1 = cx + w / 2, y0 = base - d, h = 14 * s, col = '#6e7078';
    blueContact(g, cx + 10, base + 4, w * 0.6, d * 0.4, 0.35);
    // 后边、左右边、前边
    K.poly(g, [x0 + d * 0.3, y0, x1 - d * 0.3, y0, x1 - d * 0.3, y0 - h * 0.8, x0 + d * 0.3, y0 - h * 0.8]); fillP(g, K.shade(col, -0.2));
    K.poly(g, [x0, base, x0 + d * 0.3, y0, x0 + d * 0.3, y0 - h * 0.8, x0, base - h]); fillP(g, K.shade(col, 0.1));
    K.poly(g, [x1, base, x1 - d * 0.3, y0, x1 - d * 0.3, y0 - h * 0.8, x1, base - h]); fillP(g, K.shade(col, -0.3));
    rectP(g, x0, base - h, w, h); fillP(g, K.lin(g, 0, base - h, 0, base, [K.shade(col, 0.15), K.shade(col, -0.35)]));
    snowCap(g, q, [x0, base - h, x1, base - h], h * 0.5, { seed: (cx | 0) + 1, over: 4 });
    snowCap(g, q, [x0 + d * 0.3, y0 - h * 0.8, x1 - d * 0.3, y0 - h * 0.8], h * 0.4, { seed: (cx | 0) + 2, over: 3 });
    // 框内的积雪
    K.poly(g, [x0 + 4, base - h, x0 + d * 0.3 + 3, y0 - h * 0.6, x1 - d * 0.3 - 3, y0 - h * 0.6, x1 - 4, base - h]); fillP(g, K.lin(g, 0, y0, 0, base, [SN.base, SN.hi]));
  }
  // 冬天的落叶树：分叉的枝条，枝条上缘有一道雪
  function bareTree(g, q, x, base, h, seed) {
    var r = RNG(seed), segs = [];
    function br(x0, y0, ang, len, w, depth) {
      var x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      segs.push([x0, y0, x1, y1, w]);
      if (depth <= 0 || len < 14) return;
      var n = depth > 2 ? 2 : (r() < 0.5 ? 2 : 3);
      for (var i = 0; i < n; i++) br(x1, y1, ang + r.range(-0.7, 0.7), len * r.range(0.6, 0.78), w * 0.65, depth - 1);
    }
    br(x, base, -PI / 2 + r.range(-0.1, 0.1), h * 0.32, h * 0.045, K.byModel(q, 4, 5, 6));
    blueContact(g, x + 30, base, 120, 18, 0.4);
    g.lineCap = 'round';
    for (var i = 0; i < segs.length; i++) { var sg = segs[i]; K.line(g, sg[0], sg[1], sg[2], sg[3], Math.max(1, sg[4]), '#2a221e'); }
    g.beginPath(); for (i = 0; i < segs.length; i++) { var s2 = segs[i]; if (s2[4] < 1.6) continue; g.moveTo(s2[0], s2[1] - s2[4] * 0.45); g.lineTo(s2[2], s2[3] - s2[4] * 0.45); }
    g.strokeStyle = 'rgba(236,240,248,0.85)'; g.lineWidth = 2; g.stroke();
    drift(g, q, x - 30, x + 30, base, 22, seed + 3);
  }
  DM.HDBG.def('cemetery', {
    outdoor: true,
    draw: function (g, q) { drawCemetery(g, q); },
    lights: [],
    key: { x: -0.35, color: '#e2e6f0', amb: '#56607a', rim: 0.35 }
  });

  /* =================================================================
   * 地藏堂 jizo：小堂、一排戴红围兜的地藏、最边上没有名字的新地藏、供品
   * ================================================================= */
  function drawJizo(g, q) {
    var r = RNG(7401), i;
    sky(g, q, { y: 0, h: 560, seed: 741, gx: 0.6, gy: 0.3, gw: 0.2, dens: 0.05 });
    mountainLayers(g, q, { top: 250, base: 440, seed: 74, amp: 100, near: 50 });
    for (i = 0; i < K.byModel(q, 10, 16, 22); i++) snowCedar(g, q, r.range(-40, 1960), r.range(400, 470), r.range(240, 380), r, { haze: 0.35 });
    // 地面：向前延伸的雪地与小路（透视）
    snowField(g, q, 0, 440, W, 640, { yh: 330, seed: 7403, amp: 0.8, fog: 200 });
    // 地藏堂（小堂）与前面的两级石阶
    var hx0 = 760, hx1 = 1160, hy = 300, hb = 452;
    blueContact(g, 960, hb + 6, 270, 20, 0.45);
    rectP(g, hx0, hy, hx1 - hx0, hb - hy); mat(g, q, '#4a3a2c', 'wood', OLD_WOOD, 128, hx0, hy);
    rectP(g, hx0 + 70, hy + 30, 260, hb - hy - 30); fillP(g, '#1a1410');
    g.strokeStyle = '#4a3624'; g.lineWidth = 3; g.beginPath(); for (var gx = hx0 + 70; gx <= hx0 + 330; gx += 20) { g.moveTo(gx, hy + 30); g.lineTo(gx, hb); } g.stroke();
    rectP(g, hx0 + 170, hy + 60, 60, 80); fillP(g, 'rgba(255,190,110,0.25)');
    if (q.light >= 1) K.glow(g, 960, 400, 90, '#ffb050', 0.25);
    K.poly(g, [hx0 - 60, hy + 6, 960, 130, hx1 + 60, hy + 6]); fillP(g, '#2e2c34');
    snowCap(g, q, [hx0 - 66, hy + 8, 960, 124, hx1 + 66, hy + 8], 46, { seed: 7405, over: 16, drip: true, step: 30 });
    icicles(g, q, hx0 - 56, hx1 + 56, hy + 14, 50, 7407, 1);
    for (i = 0; i < 2; i++) { rectP(g, 860 - i * 30, hb + i * 14, 200 + i * 60, 14); fillP(g, i ? '#5a5c66' : '#666872'); snowCap(g, q, [860 - i * 30, hb + i * 14, 1060 + i * 30, hb + i * 14], 5, { seed: 7408 + i, over: 3 }); }
    for (i = 0; i < 2; i++) { var fx = i ? hx1 + 60 : hx0 - 60; K.line(g, fx, hb + 20, fx, 260, 4, '#5a4a3a'); K.poly(g, [fx + 2, 270, fx + 40, 270, fx + 40, 430, fx + 2, 430]); fillP(g, '#b8302c'); g.strokeStyle = 'rgba(250,240,230,0.7)'; g.lineWidth = 2; g.beginPath(); for (var k = 0; k < 5; k++) { g.moveTo(fx + 21, 290 + k * 28); g.lineTo(fx + 21, 304 + k * 28); } g.stroke(); }
    // 地藏后面的低矮石垣
    var wy = 610;
    K.poly(g, [80, wy, 1600, wy, 1600, 760, 80, 760]); mat(g, q, '#5a5c64', 'stone', { c1: '#3e4048', c2: '#7a7c86', mortar: '#2a2b30', rows: 3, cols: 5, seed: 225, irregular: 1, mortarW: 0.03 }, 192, 0, wy);
    K.poly(g, [80, wy, 1600, wy, 1600, 760, 80, 760]); fillP(g, K.lin(g, 0, wy, 0, 760, ['rgba(0,0,20,0.1)', 'rgba(0,0,20,0.45)']));
    snowCap(g, q, [76, wy, 1604, wy], 22, { seed: 7409, over: 10, step: 40 });
    // 雨棚：一排细柱支着的单坡小屋顶，厚厚的雪
    var ry0 = 486;
    for (i = 0; i < 6; i++) { var px = 110 + i * 290; rectP(g, px - 7, ry0, 14, 300); fillP(g, K.lin(g, px - 7, 0, px + 7, 0, ['#5a4632', '#2e2418'])); }
    K.poly(g, [80, ry0 + 6, 1600, ry0 + 6, 1620, ry0 + 30, 60, ry0 + 30]); fillP(g, '#2a2830');
    rectP(g, 70, ry0 + 28, 1540, 12); fillP(g, '#1e1c22');
    snowCap(g, q, [60, ry0 + 28, 80, ry0 + 4, 1600, ry0 + 4, 1620, ry0 + 28], 40, { seed: 7410, over: 16, drip: true, step: 40 });
    icicles(g, q, 70, 1610, ry0 + 40, 46, 7411, 1);
    if (q.light >= 1) { g.fillStyle = K.lin(g, 0, ry0 + 40, 0, ry0 + 150, ['rgba(20,24,50,0.35)', 'rgba(20,24,50,0)']); g.fillRect(80, ry0 + 40, 1520, 110); }
    // 石台与一排地藏
    K.poly(g, [96, 786, 1584, 786, 1600, 806, 80, 806]); fillP(g, '#6a6c74'); rectP(g, 80, 806, 1520, 20); fillP(g, '#4a4c54');
    snowCap(g, q, [96, 786, 1584, 786], 7, { seed: 7412, over: 6 });
    var n = 8;
    for (i = 0; i < n; i++) { blueContact(g, 214 + i * 178, 786, 46, 7, 0.35); jizoStatue(g, q, 210 + i * 178, 784, 1.55, { cap: i % 3 !== 1, col: ['#6a6a70', '#62646a', '#707076'][i % 3] }); }
    // 没有名字的新地藏（雨棚外，石色更新、更白），前面供着饭团
    drift(g, q, 1620, 1780, 800, 22, 7413);
    jizoStatue(g, q, 1700, 792, 1.35, { cap: false, col: '#8a8c92', bibCol: '#d43a34' });
    for (i = 0; i < 2; i++) { var ox = 1676 + i * 46; K.path(g, 'M-16 8 Q-16 -12 0 -16 Q16 -12 16 8 Z', ox, 816); fillP(g, '#f2f0ea'); rectP(g, ox - 12, 818, 24, 8); fillP(g, '#1e2a22'); }
    blueContact(g, 1704, 826, 80, 9, 0.4);
    // 石台前的积雪
    drift(g, q, 80, 1600, 836, 22, 7415, { shadow: false });
    // 前面的小路（透视）与供品
    trodPath(g, q, [700, 1100, 820, 980, 900, 900, 960, 860], 220, 80, 7417, { prints: true });
    drawOfferings(g, q, 964, 924, true);
    for (i = 0; i < 3; i++) { var wx = 852 + i * 110, wy2 = 846; K.line(g, wx, 900, wx, wy2, 2, '#3a3a40'); for (var b2 = 0; b2 < 4; b2++) { g.save(); g.translate(wx, wy2); g.rotate(b2 * PI / 2 + 0.4); K.poly(g, [0, 0, 16, -4, 12, 10]); fillP(g, b2 % 2 ? '#d83a34' : '#f0e8e0'); g.restore(); } }
    // 前景：两侧的雪堆与竹篱残桩
    fgSnowbank(g, q, [-20, 980, 160, 950, 340, 990, 460, 1090], 7419);
    fgSnowbank(g, q, [1480, 1090, 1620, 990, 1800, 960, 1940, 980], 7421);
    fencePosts(g, q, [[60, 1010, 120], [170, 990, 110], [1760, 1000, 120], [1870, 1016, 130]], 7423);
    sparkle(g, q, 0, 480, W, 600, 220, 7425);
    K.vignette(g, W, H, q.light >= 1 ? 0.44 : 0.32, 0.45);
  }
  // 画面下缘的前景雪堆（大、柔和、带纹理）
  function fgSnowbank(g, q, pts, seed) {
    var P = densify(pts, 30), r = RNG(seed), i, Q2 = [];
    for (i = 0; i < P.length; i += 2) Q2.push(P[i], P[i + 1] + r.range(-6, 6));
    g.beginPath(); smoothPath(g, Q2, false); g.lineTo(Q2[Q2.length - 2], H + 20); g.lineTo(Q2[0], H + 20); g.closePath();
    var minY = 1e9; for (i = 1; i < Q2.length; i += 2) minY = Math.min(minY, Q2[i]);
    g.fillStyle = K.lin(g, 0, minY, 0, H, [SN.hi, SN.base, '#c4cadb']); g.fill();
    if (q.tex > 0) { g.beginPath(); smoothPath(g, Q2, false); g.lineTo(Q2[Q2.length - 2], H + 20); g.lineTo(Q2[0], H + 20); g.closePath(); texFill(g, q, 'snow', SNOW_T, 96, 0, 0, 0.18, null, null, null, 'overlay'); }
    if (q.light >= 1) { g.beginPath(); smoothPath(g, Q2, false); strokeP(g, 'rgba(255,255,255,0.9)', 4); g.save(); g.beginPath(); smoothPath(g, Q2, false); g.lineTo(Q2[Q2.length - 2], H + 20); g.lineTo(Q2[0], H + 20); g.closePath(); g.clip(); blueContact(g, (Q2[0] + Q2[Q2.length - 2]) / 2 + 60, H, (Q2[Q2.length - 2] - Q2[0]) * 0.5, 70, 0.3); g.restore(); }
  }
  // 雪中的木桩 / 竹篱残桩：[[x, base, h], ...]
  function fencePosts(g, q, posts, seed) {
    for (var i = 0; i < posts.length; i++) {
      var p = posts[i], w = Math.max(8, p[2] * 0.12);
      rectP(g, p[0] - w / 2, p[1] - p[2], w, p[2]); fillP(g, K.lin(g, p[0] - w / 2, 0, p[0] + w / 2, 0, ['#6a5844', '#3a2e22', '#1e1810']));
      snowCap(g, q, [p[0] - w * 0.7, p[1] - p[2], p[0] + w * 0.7, p[1] - p[2]], w * 0.7, { seed: seed + i, over: w * 0.3 });
      drift(g, q, p[0] - w, p[0] + w, p[1], w * 1.4, seed + 10 + i);
    }
    if (posts.length > 1) { g.strokeStyle = 'rgba(60,50,40,0.8)'; g.lineWidth = 2; g.beginPath(); for (i = 0; i + 1 < posts.length; i++) { if (Math.abs(posts[i + 1][0] - posts[i][0]) > 300) continue; g.moveTo(posts[i][0], posts[i][1] - posts[i][2] * 0.6); g.quadraticCurveTo((posts[i][0] + posts[i + 1][0]) / 2, (posts[i][1] + posts[i + 1][1]) / 2 - posts[i][2] * 0.4, posts[i + 1][0], posts[i + 1][1] - posts[i + 1][2] * 0.6); } g.stroke(); }
  }
  DM.HDBG.def('jizo', {
    outdoor: true,
    draw: function (g, q) { drawJizo(g, q); },
    lights: [{ x: 960, y: 400, r: 90, color: '#ffb050', i: 0.4, flicker: 0.2, kind: 'candle' }],
    key: { x: 0.25, color: '#e4e8f2', amb: '#56607a', rim: 0.35 }
  });

  /* =================================================================
   * 标题 title：白蛾与苍白月亮下的雪夜村落（上方中央留给标志，下方中央留给菜单）
   * ================================================================= */
  var TITLE_WIN = [[612, 742], [690, 752], [1214, 738], [1296, 758], [866, 766], [1520, 734]];
  function drawTitle(g, q) {
    var r = RNG(8001), i;
    // 夜空
    K.vgrad(g, 0, 0, W, 760, ['#070a16', '#101830', '#22304e', '#3a4866']);
    // 薄云（月光照亮的边）
    var cr = fres(q, 0.16);
    field(g, 0, 0, W, 700, W * cr, 700 * cr, function (u, v, out) {
      var n = fbm(u * 5 + 3, v * 3.4, K.byModel(q, 3, 4, 5), 803), d = sstep(0.5, 0.72, n) * (0.35 + v * 0.5);
      var mx = (u - 0.77) * 2.7, my = (v - 0.33) * 1.5, ml = Math.exp(-(mx * mx + my * my) * 2.2);
      out[0] = 60 + 120 * ml; out[1] = 70 + 120 * ml; out[2] = 100 + 110 * ml; out[3] = d * (90 + 120 * ml);
    });
    // 星（少量，在云的缝隙里）
    if (q.model >= 1) { g.save(); g.globalCompositeOperation = 'lighter'; for (i = 0; i < K.byModel(q, 0, 50, 90); i++) { var sx = r() * W, sy = r() * 420; if (Math.abs(sx - 960) < 420 && sy < 420) continue; K.ellipse(g, sx, sy, r.range(0.6, 1.6), r.range(0.6, 1.6)); fillP(g, K.rgba('#dfe6ff', r.range(0.3, 0.8))); } g.restore(); }
    // 苍白的月亮与月晕
    var mx0 = 1480, my0 = 232;
    if (q.light >= 1) { K.glow(g, mx0, my0, 420, '#9aa8d0', 0.22); K.glow(g, mx0, my0, 180, '#dfe6ff', 0.3); }
    K.ellipse(g, mx0, my0, 66, 66); fillP(g, K.rad(g, mx0 - 18, my0 - 20, 6, 70, ['#fbfbf6', '#e6e8ec', '#c8ccd8']));
    if (q.model >= 1) { for (i = 0; i < 6; i++) { K.ellipse(g, mx0 + r.range(-40, 40), my0 + r.range(-36, 40), r.range(6, 16), r.range(5, 12)); fillP(g, 'rgba(170,176,196,0.25)'); } }
    // 白蛾的意象：横跨夜空、极淡的巨大蛾影（翅脉若隐若现），不打扰上方中央的标志
    drawGhostMoth(g, q, 960, 330, 1500);
    // 月边飞舞的小白蛾
    for (i = 0; i < K.byModel(q, 3, 6, 9); i++) smallMoth(g, q, mx0 + r.range(-260, 220), my0 + r.range(-120, 200), r.range(7, 13), r.range(-0.6, 0.6), r);
    // 远山（月光下的雪线）
    var ranges = [[0.82, 520, '#2a3654', '#7a88aa'], [0.6, 600, '#1e2840', '#5a6888']];
    for (i = 0; i < ranges.length; i++) {
      var rg = ranges[i], pts = ridge(-20, 1940, 16, (function (k) { return function (t) { return rg[1] - Math.sin(t * PI * (1.2 + k * 0.5) + k) * 90 - Math.sin(t * PI * 4.3 + k) * 26; }; })(i), 10, 811 + i, 0.012);
      g.beginPath(); g.moveTo(-20, 900); for (var k = 0; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]); g.lineTo(1940, 900); g.closePath();
      g.fillStyle = K.lin(g, 0, rg[1] - 150, 0, 900, [rg[3], rg[2]]); g.fill();
      if (q.model >= 1) { var tr = RNG(821 + i); g.beginPath(); for (var t2 = 0; t2 < K.byModel(q, 0, 300, 600); t2++) { var tx = tr() * 1960, ty = rg[1] + tr() * 260; if (fbm(tx * 0.006, ty * 0.01, 2, 823 + i) < 0.48) continue; var ts = tr.range(6, 12) * (1 - i * 0.2); g.moveTo(tx - ts * 0.35, ty); g.lineTo(tx, ty - ts); g.lineTo(tx + ts * 0.35, ty); g.closePath(); } g.fillStyle = K.rgba(rg[2], 0.85); g.fill(); }
    }
    // 台地上的村子（雪顶、暖窗）、火见橹、右侧的吊桥
    rectP(g, 0, 700, W, 380); fillP(g, K.lin(g, 0, 700, 0, H, ['#3a4866', '#2a3654', '#141a2c']));
    var houses = [[540, 760, 120, 46], [640, 772, 150, 56], [780, 760, 100, 40], [1150, 760, 130, 50], [1270, 776, 150, 58], [1450, 756, 110, 44], [880, 784, 90, 36]];
    for (i = 0; i < houses.length; i++) { var hs = houses[i]; nightHouse(g, q, hs[0], hs[1], hs[2], hs[3]); }
    for (i = 0; i < TITLE_WIN.length; i++) { rectP(g, TITLE_WIN[i][0] - 6, TITLE_WIN[i][1] - 18, 12, 14); fillP(g, '#ffc070'); if (q.light >= 1) K.glow(g, TITLE_WIN[i][0], TITLE_WIN[i][1] - 11, 40, '#ffb050', 0.4); }
    // 火见橹剪影
    var wx = 1010, wb = 760;
    g.strokeStyle = '#0e1220'; g.lineWidth = 4; g.beginPath(); g.moveTo(wx - 34, wb); g.lineTo(wx - 10, wb - 200); g.moveTo(wx + 34, wb); g.lineTo(wx + 10, wb - 200); for (var lv = 0; lv < 4; lv++) { var y1 = wb - lv * 50, y2 = wb - (lv + 1) * 50; g.moveTo(wx - 34 + lv * 6, y1); g.lineTo(wx + 34 - (lv + 1) * 6, y2); g.moveTo(wx + 34 - lv * 6, y1); g.lineTo(wx - 34 + (lv + 1) * 6, y2); } g.stroke();
    K.poly(g, [wx - 26, wb - 200, wx, wb - 228, wx + 26, wb - 200]); fillP(g, '#0e1220');
    snowCap(g, q, [wx - 28, wb - 200, wx, wb - 230, wx + 28, wb - 200], 6, { seed: 8011, over: 3, hi: '#c8d0e8', col: '#9aa6c8', sh: '#5a6688' });
    // 吊桥（右，桥灯一两盏亮着）
    g.beginPath(); g.moveTo(1560, 700); g.quadraticCurveTo(1700, 740, 1850, 690); strokeP(g, '#0e1220', 2.5);
    g.beginPath(); g.moveTo(1560, 738); g.lineTo(1850, 726); strokeP(g, '#0e1220', 4);
    g.beginPath(); for (i = 1; i < 12; i++) { var bx = lerp(1560, 1850, i / 12); g.moveTo(bx, 738 - i * 1); g.lineTo(bx, 700 + Math.sin(i / 12 * PI) * 30); } strokeP(g, 'rgba(14,18,32,0.8)', 1);
    var bl = [1660, 1760]; for (i = 0; i < 2; i++) { K.ellipse(g, bl[i], 722, 3, 3); fillP(g, '#ffd080'); if (q.light >= 1) K.glow(g, bl[i], 722, 30, '#ffb050', 0.4); }
    // 前景：月光下的雪原（下方中央保持安静，留给菜单）与两侧的雪杉
    var fr = fres(q, 0.16);
    field(g, 0, 820, W, 260, W * fr, 260 * fr, function (u, v, out) {
      var x = u * W, n = fbm(x * 0.003, v * 2.6, 3, 831), l = sat(0.5 + (fbm((x - 30) * 0.003, v * 2.6, 3, 831) - n) * 10);
      out[0] = 60 + l * 50 - v * 30; out[1] = 72 + l * 52 - v * 32; out[2] = 110 + l * 56 - v * 40; out[3] = sstep(0, 0.3, v) * 255;
    });
    for (i = 0; i < 4; i++) { snowCedar(g, q, r.range(-40, 260), r.range(1000, 1120), r.range(420, 640), r, { col: '#070a12', snow: '#5a6688', sh: '#2a3450' }); snowCedar(g, q, r.range(1680, 1960), r.range(1000, 1120), r.range(420, 640), r, { col: '#070a12', snow: '#5a6688', sh: '#2a3450' }); }
    if (q.light >= 2) sparkleNight(g, 0, 840, W, 240, 120, 8021);
    K.vignette(g, W, H, 0.6, 0.4);
  }
  function nightHouse(g, q, x, base, w, h) {
    rectP(g, x, base - h * 0.55, w, h * 0.55); fillP(g, '#141a2a');
    K.poly(g, [x - w * 0.08, base - h * 0.5, x + w * 0.5, base - h * 1.1, x + w * 1.08, base - h * 0.5]); fillP(g, '#1a2034');
    snowCap(g, q, [x - w * 0.1, base - h * 0.5, x + w * 0.5, base - h * 1.12, x + w * 1.1, base - h * 0.5], h * 0.2, { seed: (x | 0) + 3, over: w * 0.05, hi: '#c8d2ee', col: '#94a2c6', sh: '#56628a', shd: '#2a3454' });
  }
  function sparkleNight(g, x, y, w, h, n, seed) {
    var r = RNG(seed);
    g.save(); g.globalCompositeOperation = 'lighter'; g.beginPath();
    for (var i = 0; i < n; i++) { var px = x + r() * w, py = y + r() * h, s2 = r.range(0.5, 1.4); g.moveTo(px + s2, py); g.arc(px, py, s2, 0, TAU); }
    g.fillStyle = 'rgba(210,220,255,0.5)'; g.fill(); g.restore();
  }
  // 极淡的巨大蛾影：两对翅膀（柔和的径向渐变）+ 翅脉细线
  function drawGhostMoth(g, q, cx, cy, span) {
    var a = q.light >= 1 ? 1 : 0.7, s2 = span / 1500;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var side = -1; side <= 1; side += 2) {
      g.save(); g.translate(cx, cy); g.scale(side * s2, s2);
      // 前翅
      K.path(g, 'M0 -10 C120 -150 420 -230 700 -170 C640 -60 420 40 60 30 Z');
      g.fillStyle = K.rad(g, 300, -90, 20, 420, [[0, K.rgba('#cfd6ee', 0.07 * a)], [1, K.rgba('#cfd6ee', 0)]]); g.fill();
      // 后翅
      K.path(g, 'M20 20 C200 60 460 120 520 260 C360 300 140 220 10 70 Z');
      g.fillStyle = K.rad(g, 250, 140, 10, 300, [[0, K.rgba('#cfd6ee', 0.06 * a)], [1, K.rgba('#cfd6ee', 0)]]); g.fill();
      // 眼纹
      K.ellipse(g, 380, -80, 44, 30); g.fillStyle = K.rad(g, 380, -80, 4, 46, [[0, K.rgba('#e8ecff', 0.06 * a)], [1, K.rgba('#e8ecff', 0)]]); g.fill();
      if (q.model >= 1) {
        g.strokeStyle = K.rgba('#dfe4f8', 0.05 * a); g.lineWidth = 2; g.beginPath();
        for (var k = 0; k < 6; k++) { g.moveTo(10, 0); g.quadraticCurveTo(200 + k * 40, -100 - k * 10, 280 + k * 80, -200 + k * 30); }
        for (k = 0; k < 4; k++) { g.moveTo(20, 30); g.quadraticCurveTo(160 + k * 40, 80 + k * 20, 260 + k * 60, 160 + k * 30); }
        g.stroke();
      }
      g.restore();
    }
    // 躯干与触角（更淡）
    K.ellipse(g, cx, cy + 20 * s2, 16 * s2, 90 * s2); fillP(g, K.rgba('#cfd6ee', 0.05 * a));
    g.restore();
  }
  function smallMoth(g, q, x, y, s, rot, r) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s / 10, s / 10);
    K.path(g, 'M0 0 C-4 -10 -14 -14 -18 -6 C-16 2 -6 4 0 2 C6 4 16 2 18 -6 C14 -14 4 -10 0 0 Z'); fillP(g, 'rgba(240,242,250,0.9)');
    K.path(g, 'M0 2 C-4 8 -10 12 -12 8 C-10 4 -4 3 0 2 C4 3 10 4 12 8 C10 12 4 8 0 2 Z'); fillP(g, 'rgba(220,226,240,0.8)');
    g.restore();
    if (q.light >= 1) K.glow(g, x, y, s * 2.4, '#e8ecff', 0.25);
    void r;
  }
  DM.HDBG.def('title', {
    outdoor: true,
    draw: function (g, q) { drawTitle(g, q); },
    lights: (function () { var L = [{ x: 1480, y: 232, r: 260, color: '#c8d4f0', i: 0.5, flicker: 0, kind: 'moon' }]; for (var i = 0; i < TITLE_WIN.length; i++) L.push({ x: TITLE_WIN[i][0], y: TITLE_WIN[i][1] - 11, r: 40, color: '#ffb050', i: 0.5, flicker: 0.05, kind: 'window' }); return L; })(),
    key: { x: 0.5, color: '#b8c4e8', amb: '#1e2640', rim: 0.6 }
  });

  /* =================================================================
   * 地图 map：俯瞰的冬季村落写意图（无文字；节点 = DM.AREAS.map x4）
   * ================================================================= */
  // 雪葬谷：自西北绕过台地西侧与南侧，到东南的吊桥
  var GORGE = [-40, 330, 70, 460, 120, 600, 196, 760, 330, 930, 540, 1016, 900, 1046, 1250, 996, 1550, 932, 1760, 874, 1960, 830];
  // 汤川：自雪见汤流下，经熊谷的小屋、穿过村道下的涵洞，流进雪葬谷
  var YUKAWA = [888, 330, 930, 420, 970, 520, 1020, 610, 1080, 700, 1130, 790, 1180, 900, 1220, 1000];
  function nodeP(id) { var a = DM.AREAS && DM.AREAS[id]; return a ? [a.map[0] * 4, a.map[1] * 4] : [960, 540]; }
  function segDist(px, py, P) {
    var best = 1e9;
    for (var i = 0; i + 3 < P.length; i += 2) {
      var ax = P[i], ay = P[i + 1], bx = P[i + 2], by = P[i + 3], dx = bx - ax, dy = by - ay, t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
      t = t < 0 ? 0 : t > 1 ? 1 : t; var ex = ax + dx * t - px, ey = ay + dy * t - py, d = ex * ex + ey * ey;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  // 到折线的距离与所在一侧（叉积符号），用于峡谷两壁的明暗
  function segDistSide(px, py, P, out) {
    var best = 1e9, side = 1, tx = 1, ty = 0;
    for (var i = 0; i + 3 < P.length; i += 2) {
      var ax = P[i], ay = P[i + 1], bx = P[i + 2], by = P[i + 3], dx = bx - ax, dy = by - ay, t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
      t = t < 0 ? 0 : t > 1 ? 1 : t; var ex = px - (ax + dx * t), ey = py - (ay + dy * t), d = ex * ex + ey * ey;
      if (d < best) { best = d; side = (dx * ey - dy * ex) > 0 ? 1 : -1; tx = dx; ty = dy; }
    }
    out[0] = Math.sqrt(best); out[1] = side;
  }
  function mapForest(x, y) {
    var v = y / H, cx0 = (x - 1020) / 700, cy0 = (y - 640) / 320, clr = Math.exp(-(cx0 * cx0 + cy0 * cy0) * 1.6);
    return fbm(x * 0.006, y * 0.006, 3, 905) * 0.6 + 0.2 + (1 - v) * 0.3 - clr * 0.62;
  }
  function drawMap(g, q) {
    var hi = C('#eef1f7'), bs = C('#d4dae8'), sh = C('#98a2c2'), fz = C('#1a2624'), fz2 = C('#344a40'), dk = C('#141822'), wl = C('#8a90a6'), ws = C('#3a3e52');
    var D = [0, 0], r0 = fres(q, 0.24), rot = -0.35, ca = Math.cos(rot), sa = Math.sin(rot);
    field(g, 0, 0, W, H, W * r0, H * r0, function (u, v, out) {
      var x = u * W, y = v * H;
      segDistSide(x, y, GORGE, D);
      var d = D[0] + (fbm(x * 0.012, y * 0.012, 2, 901) - 0.5) * 36;
      // 地形（北高），雪面的明暗
      var hgt = (1 - v) * 0.6 + fbm(x * 0.004, y * 0.004, 4, 903) * 0.5, h1 = (1 - v - 0.012) * 0.6 + fbm((x - 12) * 0.004, (y - 12) * 0.004, 4, 903) * 0.5;
      var lit = sat(0.55 + (h1 - hgt) * 20);
      var R, G, B;
      if (lit > 0.55) { var t = (lit - 0.55) / 0.45; R = bs[0] + (hi[0] - bs[0]) * t; G = bs[1] + (hi[1] - bs[1]) * t; B = bs[2] + (hi[2] - bs[2]) * t; }
      else { var t2 = (0.55 - lit) / 0.55; R = bs[0] + (sh[0] - bs[0]) * t2; G = bs[1] + (sh[1] - bs[1]) * t2; B = bs[2] + (sh[2] - bs[2]) * t2; }
      // 雪下的田块（村子周围）：转角网格，块与块之间有细细的田埂
      var wq = (fbm(x * 0.004, y * 0.004, 2, 915) - 0.5) * 1.2, fx = (x * ca - y * sa) / 110 + wq, fy = (x * sa + y * ca) / 72 + wq * 0.6, fi = Math.floor(fx), fj = Math.floor(fy), ff = Math.min(fx - fi, 1 - (fx - fi), fy - fj, 1 - (fy - fj));
      var cx0 = (x - 1020) / 760, cy0 = (y - 650) / 360, fieldA = sat(Math.exp(-(cx0 * cx0 + cy0 * cy0) * 1.4) * 1.6 - 0.3);
      if (fieldA > 0) { var tone = (cellHash(fi, fj, 3) - 0.5) * 0.07, bank = sstep(0.04, 0, ff) * 0.1 * (cellHash(fi, fj, 9) < 0.7 ? 1 : 0); R *= 1 + tone - bank * fieldA; G *= 1 + tone - bank * fieldA; B *= 1 + tone * 0.6 - bank * fieldA * 0.6; }
      // 杉林：暗色的树冠，带纹理（一团团的冠影）
      var forest = sstep(0.5, 0.6, mapForest(x, y) + sstep(170, 70, D[0]) * 0.25);
      if (forest > 0) {
        var fn = fbm(x * 0.02, y * 0.02, 3, 907), crown = vn(x * 0.045, y * 0.045), cl = sat(fn * 0.8 + crown * 0.3 - 0.15);
        var fr = fz[0] + (fz2[0] - fz[0]) * cl, fg = fz[1] + (fz2[1] - fz[1]) * cl, fb = fz[2] + (fz2[2] - fz[2]) * cl;
        var sn2 = sstep(0.6, 0.8, crown) * 0.35; fr += (220 - fr) * sn2; fg += (226 - fg) * sn2; fb += (236 - fb) * sn2;   // 树冠上的雪
        R += (fr - R) * forest; G += (fg - G) * forest; B += (fb - B) * forest;
      }
      // 雪葬谷：北壁（受光的岩与雪）、南壁（阴影），谷底的暗流与雾
      if (d < 110) {
        var w = 110, wallT = sat(1 - d / w);
        var wr, wg, wb;
        if (D[1] > 0) { var st = fbm(x * 0.05, y * 0.012, 2, 911); wr = wl[0] * (0.8 + st * 0.4); wg = wl[1] * (0.8 + st * 0.4); wb = wl[2] * (0.8 + st * 0.4); }
        else { wr = ws[0]; wg = ws[1]; wb = ws[2]; }
        var deep = sstep(0.55, 1, wallT);
        wr += (dk[0] - wr) * deep; wg += (dk[1] - wg) * deep; wb += (dk[2] - wb) * deep;
        var mist = sstep(0.8, 1, wallT) * fbm(x * 0.015, y * 0.03, 2, 913) * 0.6;
        wr += (200 - wr) * mist; wg += (206 - wg) * mist; wb += (220 - wb) * mist;
        var k2 = sstep(0, 0.25, wallT);
        R += (wr - R) * k2; G += (wg - G) * k2; B += (wb - B) * k2;
      }
      out[0] = R; out[1] = G; out[2] = B;
    });
    // 树冠（矢量点画，加强林的质感）
    if (q.model >= 1) {
      var rt = RNG(911), dkP = [], snP = [];
      for (var i = 0; i < K.byModel(q, 0, 2400, 4200); i++) {
        var tx = rt() * W, ty = rt() * H;
        segDistSide(tx, ty, GORGE, D); if (D[0] < 50) continue;
        if (mapForest(tx, ty) + (D[0] < 170 ? 0.12 : 0) < 0.58) continue;
        var ts = rt.range(3, 6.5); dkP.push(tx, ty, ts); snP.push(tx - ts * 0.25, ty - ts * 0.25, ts * 0.55);
      }
      g.beginPath(); for (i = 0; i < dkP.length; i += 3) { g.moveTo(dkP[i] + dkP[i + 2] + 2.5, dkP[i + 1] + 2.5); g.arc(dkP[i] + 2.5, dkP[i + 1] + 2.5, dkP[i + 2], 0, TAU); } g.fillStyle = 'rgba(10,16,20,0.35)'; g.fill();
      g.beginPath(); for (i = 0; i < dkP.length; i += 3) { var rr2 = dkP[i + 2]; g.moveTo(dkP[i] + rr2, dkP[i + 1]); for (var a5 = 1; a5 <= 8; a5++) { var an = a5 / 8 * TAU, rad = rr2 * (a5 % 2 ? 0.65 : 1); g.lineTo(dkP[i] + Math.cos(an) * rad, dkP[i + 1] + Math.sin(an) * rad); } } g.fillStyle = 'rgba(28,42,38,0.9)'; g.fill();
      g.beginPath(); for (i = 0; i < snP.length; i += 3) { g.moveTo(snP[i] + snP[i + 2], snP[i + 1]); g.arc(snP[i], snP[i + 1], snP[i + 2], 0, TAU); } g.fillStyle = 'rgba(226,232,244,0.6)'; g.fill();
    }
    // 谷缘的雪檐（白线）
    var off = [-62, 62];
    for (var k = 0; k < 2; k++) { var OP = []; for (i = 0; i < GORGE.length; i += 2) { var nx = i + 2 < GORGE.length ? GORGE[i + 3] - GORGE[i + 1] : GORGE[i + 1] - GORGE[i - 1], ny = i + 2 < GORGE.length ? -(GORGE[i + 2] - GORGE[i]) : -(GORGE[i] - GORGE[i - 2]), l = Math.sqrt(nx * nx + ny * ny) || 1; OP.push(GORGE[i] + nx / l * off[k], GORGE[i + 1] + ny / l * off[k]); } g.beginPath(); smoothPath(g, OP, false); strokeP(g, k ? 'rgba(250,252,255,0.55)' : 'rgba(250,252,255,0.35)', 3); }
    // 汤川（冒热气的暗色小溪，不结冰）
    g.beginPath(); smoothPath(g, YUKAWA, false); strokeP(g, 'rgba(240,244,250,0.8)', 12); g.beginPath(); smoothPath(g, YUKAWA, false); strokeP(g, '#4a5c66', 5);
    if (q.light >= 1) for (i = 0; i < YUKAWA.length; i += 4) K.blob(g, YUKAWA[i] + 10, YUKAWA[i + 1] - 10, 40, '#f4f6fa', 0.25);
    // 道路：村道（消雪管，湿黑）与雪中的小径
    var road = ['bridge', 'store', 'road', 'police', 'road', 'inn', 'mill'];
    var rp = []; for (i = 0; i < road.length; i++) { var n = nodeP(road[i]); rp.push(n[0], n[1]); }
    rp = [nodeP('bridge')[0], nodeP('bridge')[1], nodeP('store')[0], nodeP('store')[1], nodeP('road')[0], nodeP('road')[1], nodeP('inn')[0], nodeP('inn')[1], nodeP('shiramine')[0] + 60, nodeP('shiramine')[1] + 40, nodeP('jizo')[0], nodeP('jizo')[1] - 40];
    g.beginPath(); smoothPath(g, rp, false); strokeP(g, 'rgba(240,244,250,0.9)', 18); g.beginPath(); smoothPath(g, rp, false); strokeP(g, '#3c4250', 10);
    if (q.light >= 1) { g.beginPath(); smoothPath(g, rp, false); strokeP(g, 'rgba(150,160,190,0.35)', 3); }
    // 沿村道成串的小屋（雪顶）
    var hr = RNG(931);
    for (i = 0; i + 3 < rp.length; i += 2) {
      var ax = rp[i], ay = rp[i + 1], bx = rp[i + 2], by = rp[i + 3], len = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)), ang = Math.atan2(by - ay, bx - ax), cnt = Math.floor(len / 70);
      for (var hk = 0; hk < cnt; hk++) {
        var tt = (hk + 0.5) / cnt, hx = lerp(ax, bx, tt), hy = lerp(ay, by, tt), sd = hk % 2 ? 1 : -1, off = hr.range(30, 50);
        if (hr() < 0.25) continue;
        mapHouse(g, q, hx - Math.sin(ang) * off * sd, hy + Math.cos(ang) * off * sd, hr.range(22, 34), hr.range(16, 22), ang + hr.range(-0.2, 0.2), { lit: hr() < 0.3, lx: 0, ly: 0 });
      }
    }
    var trails = [['road', 'police'], ['road', 'school'], ['inn', 'mill'], ['inn', 'kumagai'], ['kumagai', 'bathhouse'], ['inn', 'clinic'], ['inn', 'sabakiya'], ['sabakiya', 'hall'], ['hall', 'watchtower'], ['watchtower', 'shrine'], ['hall', 'shiramine'], ['shiramine', 'fuyuki'], ['fuyuki', 'okurimon'], ['fuyuki', 'cemetery'], ['cemetery', 'jizo'], ['okurimon', 'charcoal'], ['shrine', 'charcoal']];
    g.save(); g.setLineDash && g.setLineDash([12, 8]);
    for (i = 0; i < trails.length; i++) {
      var a = nodeP(trails[i][0]), b = nodeP(trails[i][1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.sqrt(dx * dx + dy * dy) || 1, o2 = ((i * 37) % 7 - 3) * 10;
      g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mx - dy / dl * o2, my + dx / dl * o2, b[0], b[1]);
      g.strokeStyle = 'rgba(110,118,148,0.55)'; g.lineWidth = 5; g.stroke();
    }
    g.restore();
    // 白蛾桥与对岸的隧道
    var bn = nodeP('bridge');
    g.save(); g.translate(bn[0], bn[1]); g.rotate(-1.15);
    if (q.light >= 1) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-90, 4, 180, 10); }
    rectP(g, -90, -6, 180, 12); fillP(g, '#6a5444'); g.strokeStyle = '#2a2a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(-90, -8); g.quadraticCurveTo(0, 2, 90, -8); g.moveTo(-90, 8); g.quadraticCurveTo(0, 18, 90, 8); g.stroke();
    g.restore();
    var tn = [bn[0] + 70, bn[1] + 140];
    K.ellipse(g, tn[0], tn[1], 26, 16); fillP(g, '#16181e'); K.ellipse(g, tn[0], tn[1] - 4, 34, 22); strokeP(g, '#8a8c94', 5);
    // 各个地标
    mapLandmarks(g, q);
    // 谷中的雾（只在峡谷里）
    if (q.light >= 1) { for (i = 2; i < GORGE.length - 2; i += 4) { g.save(); g.translate(GORGE[i], GORGE[i + 1]); g.scale(1, 0.4); K.blob(g, 0, 0, 90, '#e8ecf4', 0.22); g.restore(); } }
    K.vignette(g, W, H, 0.45, 0.45);
  }
  // 俯视的雪顶小屋：屋顶白、背光坡偏蓝，屋檐下暗边，阴影朝右下
  function mapHouse(g, q, x, y, w, h, rot, o) {
    o = o || {};
    if (h > w) { var tt = w; w = h; h = tt; rot += PI / 2; }
    g.save(); g.translate(x, y); g.rotate(rot);
    if (q.light >= 1) { g.save(); g.rotate(-rot); g.translate(7, 8); g.rotate(rot); g.fillStyle = 'rgba(40,46,70,0.4)'; g.fillRect(-w / 2, -h / 2, w, h); g.restore(); }
    rectP(g, -w / 2 - 2, -h / 2 - 2, w + 4, h + 4); fillP(g, o.edge || '#3a3430');
    K.poly(g, [-w / 2, -h / 2, w / 2, -h / 2, w / 2 - h / 2, 0, -w / 2 + h / 2, 0]); fillP(g, '#f4f6fb');
    K.poly(g, [-w / 2, h / 2, w / 2, h / 2, w / 2 - h / 2, 0, -w / 2 + h / 2, 0]); fillP(g, '#aab2cc');
    K.poly(g, [-w / 2, -h / 2, -w / 2 + h / 2, 0, -w / 2, h / 2]); fillP(g, '#d8deea'); K.poly(g, [w / 2, -h / 2, w / 2 - h / 2, 0, w / 2, h / 2]); fillP(g, '#bcc4da');
    if (o.thatch) { g.strokeStyle = 'rgba(120,100,60,0.5)'; g.lineWidth = 1.5; g.strokeRect(-w / 2, -h / 2, w, h); }
    g.restore();
    if (o.lit && q.light >= 1) K.glow(g, x + (o.lx || 0), y + (o.ly || 0), Math.max(w, h) * 0.4, '#ffb050', 0.45);
  }
  function mapLandmarks(g, q) {
    var P = nodeP, n, i;
    // 白峰屋（大的 L 形旅馆，暖窗）
    n = P('inn'); mapHouse(g, q, n[0], n[1], 120, 52, -0.15, { lit: true }); mapHouse(g, q, n[0] + 52, n[1] - 44, 46, 70, -0.15);
    // 村道边的民家（散落）
    var houses = [[1160, 640, 50, 34, 0.1], [1290, 700, 44, 30, -0.2], [1350, 820, 50, 34, 0.15], [1260, 900, 46, 30, 0.3], [960, 760, 44, 30, -0.1], [1520, 760, 48, 32, 0.2], [1660, 760, 40, 28, -0.2], [820, 640, 44, 30, 0.2], [700, 780, 46, 30, -0.3], [1100, 470, 40, 28, 0.1], [1460, 560, 44, 30, -0.1]];
    for (i = 0; i < houses.length; i++) { var hs = houses[i]; mapHouse(g, q, hs[0], hs[1], hs[2], hs[3], hs[4], { lit: i % 3 === 0 }); }
    // 水车小屋（小屋 + 水车）
    n = P('mill'); mapHouse(g, q, n[0] + 16, n[1], 44, 32, 0.4); K.ellipse(g, n[0] - 22, n[1] + 4, 16, 6, 0.4); strokeP(g, '#5a4632', 4);
    // 雪见汤（两池冒热气 + 中间竹篱）
    n = P('bathhouse');
    for (i = -1; i <= 1; i += 2) { K.ellipse(g, n[0] + i * 34, n[1], 28, 18); fillP(g, '#7aa4a4'); K.ellipse(g, n[0] + i * 34, n[1], 28, 18); strokeP(g, '#4a4c54', 4); if (q.light >= 1) K.blob(g, n[0] + i * 34, n[1] - 14, 40, '#f4f6fa', 0.4); }
    K.line(g, n[0], n[1] - 26, n[0], n[1] + 22, 4, '#a8955c');
    // 熊谷的小屋（汤川边）
    n = P('kumagai'); mapHouse(g, q, n[0] - 24, n[1], 38, 28, 0.5);
    // 诊所、驻在所（红灯）、杂货店
    n = P('clinic'); mapHouse(g, q, n[0], n[1], 54, 34, 0.05, { lit: true });
    n = P('police'); mapHouse(g, q, n[0], n[1], 40, 30, -0.1); K.ellipse(g, n[0] + 24, n[1] - 18, 5, 5); fillP(g, '#e03a2e'); if (q.light >= 1) K.glow(g, n[0] + 24, n[1] - 18, 22, '#ff5040', 0.5);
    n = P('store'); mapHouse(g, q, n[0], n[1], 56, 34, 0.1, { lit: true });
    // 裁屋（茅草顶的大会所）
    n = P('sabakiya'); mapHouse(g, q, n[0], n[1], 70, 56, 0.2, { thatch: true, lit: true });
    // 公民馆 + 防灾广播杆
    n = P('hall'); mapHouse(g, q, n[0], n[1], 66, 40, -0.2); K.line(g, n[0] + 40, n[1] - 30, n[0] + 40, n[1] - 4, 3, '#4a4a50');
    // 火见橹（俯视的小塔 + 长影）
    n = P('watchtower');
    if (q.light >= 1) { g.save(); g.translate(n[0], n[1]); g.rotate(0.7); g.fillStyle = 'rgba(40,46,70,0.4)'; g.fillRect(0, -6, 70, 12); g.restore(); }
    rectP(g, n[0] - 12, n[1] - 12, 24, 24); fillP(g, '#7a3a2a'); K.poly(g, [n[0] - 14, n[1] - 14, n[0] + 14, n[1] - 14, n[0], n[1]]); fillP(g, '#f2f4fa'); K.poly(g, [n[0] - 14, n[1] + 14, n[0] + 14, n[1] + 14, n[0], n[1]]); fillP(g, '#a8b0ca');
    // 白蛾神社（拜殿 + 朱红鸟居 + 参道）
    n = P('shrine'); mapHouse(g, q, n[0] + 10, n[1] - 10, 60, 36, 0.1, { lit: false });
    g.save(); g.translate(n[0] - 10, n[1] + 46); g.rotate(-0.3); g.fillStyle = '#c8402e'; g.fillRect(-16, -2, 32, 6); g.fillRect(-12, -6, 4, 12); g.fillRect(8, -6, 4, 12); g.restore();
    // 白峰本宅（大宅 + 离屋）
    n = P('shiramine'); mapHouse(g, q, n[0], n[1], 96, 56, 0.1, { lit: true }); mapHouse(g, q, n[0] - 70, n[1] + 34, 34, 26, 0.1);
    // 冬木家旧宅（荒废：屋顶塌了一角）
    n = P('fuyuki'); mapHouse(g, q, n[0], n[1], 50, 34, -0.2, { edge: '#2a2420' }); K.poly(g, [n[0] + 6, n[1] - 10, n[0] + 22, n[1] - 4, n[0] + 12, n[1] + 10]); fillP(g, '#3a3430');
    // 墓地（一格格的小墓石）
    n = P('cemetery'); g.fillStyle = '#5a5c66'; for (i = 0; i < 12; i++) { var gx = n[0] - 36 + (i % 4) * 24, gy = n[1] - 18 + Math.floor(i / 4) * 18; g.fillRect(gx, gy, 10, 8); }
    // 地藏堂（小堂 + 一排红点）
    n = P('jizo'); mapHouse(g, q, n[0], n[1] - 16, 34, 24, 0); for (i = 0; i < 6; i++) { K.ellipse(g, n[0] - 30 + i * 12, n[1] + 12, 4, 4); fillP(g, '#c8302c'); }
    // 分校（L 形校舍 + 操场）
    n = P('school'); rectP(g, n[0] - 60, n[1] + 12, 120, 50); fillP(g, 'rgba(250,252,255,0.8)'); mapHouse(g, q, n[0], n[1] - 10, 110, 34, 0); mapHouse(g, q, n[0] + 66, n[1] + 20, 30, 60, 0);
    // 送门（门的符号）与通进谷里的送道
    n = P('okurimon'); g.save(); g.setLineDash && g.setLineDash([6, 6]); g.beginPath(); g.moveTo(n[0], n[1]); g.quadraticCurveTo(n[0] - 60, n[1] + 30, n[0] - 80, n[1] + 80); strokeP(g, 'rgba(90,96,120,0.7)', 4); g.restore();
    g.strokeStyle = '#4a4438'; g.lineWidth = 5; g.beginPath(); g.moveTo(n[0] - 16, n[1] - 4); g.lineTo(n[0] + 16, n[1] - 4); g.moveTo(n[0] - 10, n[1] - 4); g.lineTo(n[0] - 10, n[1] + 12); g.moveTo(n[0] + 10, n[1] - 4); g.lineTo(n[0] + 10, n[1] + 12); g.stroke();
    // 炭烧小屋（林中的小屋 + 炭窑的烟）
    n = P('charcoal'); mapHouse(g, q, n[0], n[1], 40, 28, 0.3); K.ellipse(g, n[0] + 30, n[1] + 10, 12, 10); fillP(g, '#3a3430'); if (q.light >= 1) K.blob(g, n[0] + 40, n[1] - 10, 36, '#e4e8f0', 0.35);
    // 村道节点（汤川的涵洞处）
    n = P('road'); K.ellipse(g, n[0], n[1], 10, 6); fillP(g, '#2a3038');
  }
  DM.HDBG.def('map', {
    outdoor: false,
    draw: function (g, q) { drawMap(g, q); },
    lights: [],
    key: { x: -0.3, color: '#e4e8f2', amb: '#56607a', rim: 0.2 }
  });

})(typeof window !== 'undefined' ? window : globalThis);
