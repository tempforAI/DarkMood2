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
  var SN = { hi: '#f7f9fd', base: '#e3e8f2', sh: '#adb5d2', shd: '#7e86ab', haze: '#c8cdda' };
  var SNOW_T = { c1: '#000000', c2: '#ffffff', seed: 23 };
  // 把折线按步长加密（积雪轮廓需要足够的点做起伏）
  function densify(pts, step) {
    var out = [pts[0], pts[1]];
    for (var i = 2; i < pts.length; i += 2) {
      var ax = pts[i - 2], ay = pts[i - 1], bx = pts[i], by = pts[i + 1], d = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay)), n = Math.max(1, Math.round(d / step));
      for (var k = 1; k <= n; k++) out.push(ax + (bx - ax) * k / n, ay + (by - ay) * k / n);
    }
    return out;
  }
  // 雪原：带透视的柔和起伏（左上受光、背光面偏蓝紫），远处融进雾色。o = { yh, seed, amp, hi, base, sh, haze, cx }
  function snowField(g, q, x, y, w, h, o) {
    o = o || {};
    var hi = C(o.hi || SN.hi), bs = C(o.base || SN.base), sh = C(o.sh || SN.sh), hz = C(o.haze || SN.haze);
    var yh = o.yh === undefined ? y - 160 : o.yh, seed = o.seed || 3, amp = o.amp === undefined ? 1 : o.amp, oct = K.byModel(q, 2, 3, 4), cx = o.cx === undefined ? 960 : o.cx;
    var fr = o.freq || 1, r = fres(q, o.res || 0.18);
    field(g, x, y, w, h, w * r, h * r, function (u, v, out) {
      var px = x + u * w, py = y + v * h, d = Math.max(6, py - yh), X = (px - cx) / d * 1.2 * fr, Z = 160 / d * fr;
      if (o.flat) { X = px * 0.003 * fr; Z = py * 0.0026 * fr; }
      var e = 0.06;
      var h0 = fbm(X, Z * 2.2, oct, seed), h1 = fbm(X - e, Z * 2.2 - e * 0.6, oct, seed);
      var sl = (h1 - h0) * 9 * amp;          // >0 朝向光
      var lum = sat(0.55 + sl + (h0 - 0.5) * 0.25 * amp);
      var R, G, B;
      if (lum > 0.55) { var t = (lum - 0.55) / 0.45; R = bs[0] + (hi[0] - bs[0]) * t; G = bs[1] + (hi[1] - bs[1]) * t; B = bs[2] + (hi[2] - bs[2]) * t; }
      else { var t2 = (0.55 - lum) / 0.55; R = bs[0] + (sh[0] - bs[0]) * t2; G = bs[1] + (sh[1] - bs[1]) * t2; B = bs[2] + (sh[2] - bs[2]) * t2; }
      var fz = sat(1 - (py - yh) / (o.fog || 260));
      fz = fz * fz * (o.fogK === undefined ? 0.85 : o.fogK);
      out[0] = R + (hz[0] - R) * fz; out[1] = G + (hz[1] - G) * fz; out[2] = B + (hz[2] - B) * fz;
      if (o.alpha) out[3] = o.alpha(u, v) * 255;
    });
    if (q.tex > 0 && o.tex !== false) { rectP(g, x, y, w, h); texFill(g, q, 'snow', SNOW_T, 128, 0, 0, 0.08, null, null, null, 'overlay'); }
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
    snowRange(g, q, { x0: -20, x1: 1940, base: 760, top: 120, hf: function (t) { return 260 - Math.sin(t * PI * 1.3 + 0.4) * 80 - Math.sin(t * PI * 3.1) * 30; }, seed: 31, haze: 0.4, trees: 1400, ts: 9, cut: 0.42, forest: '#4a5462', step: 12 });
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
    snowRange(g, q, { x0: -20, x1: 1940, base: 820, top: 150, hf: function (t) { return 330 - Math.sin(t * PI * 1.1 + 0.3) * 120 - Math.sin(t * PI * 4) * 24; }, seed: 41, haze: 0.45, trees: 1800, ts: 12, cut: 0.4, forest: '#46505e' });
    drawGorge(g, q, cut);
    // 对岸的山崖（隧道所在），岩面上的积雪落在朝上的岩块上
    var far = [1150, 1100, 1180, 900, 1230, 760, 1300, 640, 1380, 540, 1480, 460, 1600, 400, 1760, 350, 1940, 320, 1940, 1100];
    g.save(); K.poly(g, far); g.clip();
    snowCliff(g, q, 1140, 300, 800, 800, { seed: 45, rock: 0.55, hz: 0.28 });
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
    snowCliff(g, q, -20, 660, 900, 440, { seed: 49, rock: 0.25, bias: function (u, vv) { return (u - 0.5) * 0.25 + vv * 0.08; } });
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

})(typeof window !== 'undefined' ? window : globalThis);
