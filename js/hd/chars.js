/* ======================================================================
 * DARK MOOD HD 角色生成器 —— 立绘（640x896 半身）+ Q 版小人（128x256 全身）
 * ----------------------------------------------------------------------
 * 通用、数据驱动、与具体游戏无关：新作只需 DM.HDChar.def(id, 配置) 即可。
 * 所有尺寸都相对头部几何（r = 头顶到下巴的高度）计算，同一套部件既画立绘也画小人。
 *
 * 渲染管线（每个部件组在一张临时图层上完成，再合成到主画布）：
 *   底色填充 → 形状内阴影/渐变/纹理（裁剪或 source-atop）→ 内部线 → 外轮廓（destination-over）
 *   层次：后发 → 背部配件 → 颈/服装/颈部配件 → 脸（五官、表情特效）→ 前发 → 头部配件/眼镜/面具 → 手与道具
 * 画质：model 0/1/2 = 发束数、睫毛、褶皱、配件细节；tex 0/1/2 = 纯色 / 织物与发丝纹理；
 *       light 0/1/2 = 单阴影色 / +柔和渐变 / +高光、轮廓光、暖色透光阴影边
 *
 * ---------------------------- 配置格式 ----------------------------
 * DM.HDChar.def('id', {
 *   base: 'otherId',          // 继承另一个角色的配置后再覆盖（深合并；数组整体替换）
 *   sex: 'm' | 'f',           // 影响脸宽、眼型高度、颈宽、肩宽
 *   age: 21,                  // <13 儿童比例（大头、窄肩）；>=13 <18 少年；>=50 起出现年龄纹；>=58 老年
 *   height: 174,              // 身高 cm：立绘上下位置、小人缩放
 *   build: 0,                 // 体格 -1 瘦小 … 0 普通 … 1 魁梧（肩宽、颈粗）
 *   skin: '#f1d2b8',
 *   face: 'f'|'soft'|'m'|'sharp'|'square'|'round'|'long'|'child'|'old',   // 脸型（默认按性别/年龄）
 *   head: { w: 1, h: 1 },     // 头部宽高微调
 *   lines: 0..3,              // 年龄纹强度（默认按 age）
 *   blush: 0..1,              // 常态腮红
 *   hair: { style: 'long_straight', color: '#15151c',
 *           // 以下均可选，覆盖发型预设（见 HAIR 表）：
 *           vol, w, hl(发际线高), cap:'smooth'|'tufts'|'buzz'|'swept'|'thin',
 *           bangs:{k:'spiky'|'messy'|'blunt'|'swept'|'parted'|'short'|'none', n:[低,中,高], len, part, irr, spread},
 *           side:{k:'lock'|'blunt'|'sideburn'|'ragged'|'none', len, w, out},
 *           back:{k:'none'|'short'|'long'|'wavy'|'bob'|'ragged'|'spiky', len, w},
 *           extras:[{k:'twin_tails'|'braids'|'bun'|'ponytail'|'low_tail'|'ahoge'|'ribbon'|'tie', ...}],
 *           grey: 0..1 (白发丝比例), hl2: 高光色 },
 *   eyes: { shape: 'round'|'sharp'|'narrow'|'lazy'|'big_calm'|'cold'|'stern'|'half'|'fox'|'cat'|'small'|'jolly'
 *                  |'dreamy'|'proud'|'kind'|'gentle'|'tired'|'big'|'squint'|'mask', color: '#3a5a8a',
 *           size: 1, gap: 1, lash: '#颜色', ...任意 EYE 参数覆盖 },
 *   brows: { shape: 'normal'|'thin'|'thick'|'straight'|'sharp'|'soft'|'bushy'|'short', color, t: 粗细倍率 },
 *   mouth: { w: 1 },  nose: 'small'|'male'|'button'|'long',
 *   marks: ['scar_brow','scar_cheek','burn','frostbite','mole','stubble','mustache','beard_short','beard_full',
 *           'goatee','metal_tooth','freckles','bandage','liver_spots','red_nose','soot'],   // 脸部特征（字符串或 {k, c, side}）
 *   outfit: { k: 'coat'|'suit'|'suit_vest'|'labcoat'|'trench'|'tailcoat'|'butler'|'chef'|'smock'|'sailor_cardigan'
 *                |'sailor'|'blazer'|'cardigan'|'sweater'|'turtleneck'|'dress'|'tshirt'|'work'|'kimono'|'haori'|'miko'
 *                |'police'|'parka'|'robe'|'jacket'|'fisher'|'nurse'|'maid'|'coat_over_sailor'|'shirt'
 *                |'overcoat'|'peacoat'|'duffle'|'quilted'|'hunting'|'hanten'|'dotera'|'tanzen'|'cape'|'gakuran' …,
 *             // 选项示例：overcoat/peacoat/duffle/quilted/labcoat 的 inner:'turtle'|'sweater'|'suit'|'cardigan'|'shirt'；
 *             // kimono 的 apron:'kappogi'|'bib'|'check'、open:1（敞领）；miko 的 haori:'#色'；haori 的 obi:'#色'、mon:1；
 *             // parka 的 fur:'#色'|false；cape 的 lining；gakuran 的 coat:'#色'
 *             c: 主色, c2: 内搭色, c3: 点缀色（领带/丝带/腰带）, tie: 'tie'|'bow'|'ribbon'|'none', ...预设参数 },
 *   acc: [ 'glasses_round', {k:'top_hat', c:'#222', tilt:-0.2}, {k:'scarf', c:'#a08060'}, ... ],   // 配件（见 ACC 表）
 *        // 头：top_hat beret cap police_cap straw_hat bandana headscarf knit_hat earmuffs ribbon white_ribbon hairpin flower
 *        //     camellia kanzashi comb headband maid_headpiece nurse_cap hachimaki pencil_ear
 *        // 脸：glasses(shape round|rect|oval, glare:[表情], chain) monocle earring cigarette toothpick eyepatch
 *        // 颈：scarf muffler towel necklace pendant feather_charm mino   身：badge lawyer_badge police_badge watch_chain
 *        //     sequins paint camera violin_strap nurse_watch cig_pack rifle_sling whistle_cord   背：violin_case rifle ribbon_back
 *        // 手套：gloves {c}（双手）、glove_right（只有右手；配合 hold.glove 使用）
 *   hold: { k: 'notebook'|'book'|'doll'|'cane'|'cards'|'phone'|'clipboard'|'lantern'|'gohei'|'fan'|'crow_mask'
 *              |'slate'|'flask'|'sake'|'briefcase',
 *           c: 颜色, glove: '#fff'(手套色), knit: 1(毛线手套), missing: 2(该手缺指，手套里显得塌), watch: true|'#色',
 *           side: 1(观者右=角色左手)|-1 },          // 手持道具（自带前臂与手）；继承时整体替换
 *   mask: 'crow'|'moth'|'fox'|'cloth'|'half' | { k, c },  // 面具：cover full=不画五官（crow/fox）、upper=遮眼（moth）、lower=遮口（cloth）
 *   hood: { c: '#0a0a10' },   // 兜帽（后片在身后，前缘框住脸）
 *   glow: { c: '#ff3050' }, glowBy: { angry: 1 },   // 面具眼洞发光色；按表情的发光强度（默认表 JUDGE_GLOW）
 *   pose: { think: 'chin' },  // think 表情时拳托下巴（有 hold 道具时不画）
 *   expr: { smile: { eye: { mode: 'happy' }, mouth: 'grin', blush: 0.3 }, normal: { mouth: 'smile_closed' } },
 *           // 按表情覆盖 EXPR 表：eye{open,inDrop,outDrop,iris,pupil,look:[x,y],hl,tear,mode:'happy'|'closed',lowUp,dull}
 *           // brow{y,i,o,asym}  mouth: neutral|smile|smile_closed|grin|smirk|sad|frown|grit|o|side|shock|dark  fx:['pale','sweat','gloom','shadow','vein']
 *   ears: true|false, facialHair: '#色', headScale: 1, xOff: 0, yOff: 0,   // 细调
 *   sprite: { legs:'pants'|'skirt'|'long_skirt'|'shorts'|'dress'|'robe'|'hakama', legC, shoe, sock, coat: 0..1, front:'v'|'sailor'|'cross'|'robe'|'none' }
 * });
 * hair 的其它可选键：tieC 发绳色、greyC 白发丝色、shine 高光强度、ringY 高光带高度、noFly 不画飞出的细发、
 *   extras 中 {k:'twin_tails', len, bow:'#色'}、{k:'braids', len}、{k:'bun', pos:'top'|'back', r}、{k:'low_tail', side}、{k:'ponytail', side, len}。
 * 未注册的 id：若 DM.CHARS[id].visual 存在则据其自动推导（fromVisual），否则画中性的灰色人物占位，任何异常都回退占位，不抛出。
 * 扩展：DM.HDChar.parts.{hair,bangs,sides,backs,extras,outfit,acc,mask,prop,legs,eyes,brows,face,expr,mouth}
 *   例：parts.mask.oni = { cover: 'full', draw: function (C, g, H, B, cf, X, o) {...} }；parts.acc.x = { slot: 'head', draw: fn }
 *   （slot：back 身后 / neck 颈部 / body 衣服上 / face 脸上 / head 头上）。DM.HDChar.resolve(id) 返回合并后的配置。
 * ====================================================================== */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK;
  if (!K) return;
  var HC = DM.HDChar = DM.HDChar || {};
  if (!HC.cast) HC.cast = {};
  if (!HC.def) HC.def = function (id, o) { this.cast[id] = o; };
  var PW = K.PW || 640, PH = K.PH || 896, SW = K.SW || 128, SH = K.SH || 256;
  var PI = Math.PI;

  var HAIR = {}, BANGS = {}, SIDES = {}, BACKS = {}, HEXTRA = {}, OUTFIT = {}, ACC = {}, MASK = {},
    EYE = {}, BROW = {}, FACE = {}, EXPR = {}, MOUTH = {};
  HC.parts = { hair: HAIR, bangs: BANGS, sides: SIDES, backs: BACKS, extras: HEXTRA, outfit: OUTFIT, acc: ACC,
    mask: MASK, eyes: EYE, brows: BROW, face: FACE, expr: EXPR, mouth: MOUTH };

  /* ====================== 基础工具 ====================== */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function isArr(o) { return Object.prototype.toString.call(o) === '[object Array]'; }
  function isObj(o) { return !!o && typeof o === 'object' && !isArr(o); }
  function merge(a, b) {
    var out = {}, k;
    if (isObj(a)) for (k in a) if (a.hasOwnProperty(k)) out[k] = a[k];
    if (isObj(b)) for (k in b) if (b.hasOwnProperty(k)) out[k] = (isObj(b[k]) && isObj(out[k])) ? merge(out[k], b[k]) : b[k];
    return out;
  }
  function lum(c) { var x = K.rgb(c); return (0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]) / 255; }
  function A(c, a) { return K.rgba(c, a); }
  function pickN(v, C) { return isArr(v) ? v[clamp(C.m, 0, v.length - 1)] : v; }
  function bz(a, b, c, d, t) { var m = 1 - t; return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d; }
  function bzd(a, b, c, d, t) { var m = 1 - t; return 3 * m * m * (b - a) + 6 * m * t * (c - b) + 3 * t * t * (d - c); }
  function smooth01(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  /* ====================== 路径 ====================== */
  // 命令数组：['M',x,y,'L',x,y,'Q',qx,qy,x,y,'C',x1,y1,x2,y2,x,y,'Z']；实际 X = ox + sx*x（sx=-1 时左右镜像）
  function P(g, a, ox, sx, cont) {
    ox = ox || 0; sx = sx === undefined ? 1 : sx;
    if (!cont) g.beginPath();
    var i = 0, n = a.length, c;
    while (i < n) {
      c = a[i++];
      if (c === 'M') { g.moveTo(ox + sx * a[i], a[i + 1]); i += 2; }
      else if (c === 'L') { g.lineTo(ox + sx * a[i], a[i + 1]); i += 2; }
      else if (c === 'Q') { g.quadraticCurveTo(ox + sx * a[i], a[i + 1], ox + sx * a[i + 2], a[i + 3]); i += 4; }
      else if (c === 'C') { g.bezierCurveTo(ox + sx * a[i], a[i + 1], ox + sx * a[i + 2], a[i + 3], ox + sx * a[i + 4], a[i + 5]); i += 6; }
      else if (c === 'Z') g.closePath();
    }
  }
  // 左右对称闭合形状：st=[dx,y] 起点（通常在中线上），segs 为左半边各段（dx=距中线距离）：
  // [x,y] 直线 / [qx,qy,x,y] 二次 / [x1,y1,x2,y2,x,y] 三次；末点应回到中线。右半边自动镜像反向。
  function sym(g, cx, st, segs, cont) {
    if (!cont) g.beginPath();
    g.moveTo(cx - st[0], st[1]);
    var i, s, e = [st];
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      if (s.length === 2) g.lineTo(cx - s[0], s[1]);
      else if (s.length === 4) g.quadraticCurveTo(cx - s[0], s[1], cx - s[2], s[3]);
      else g.bezierCurveTo(cx - s[0], s[1], cx - s[2], s[3], cx - s[4], s[5]);
      e.push([s[s.length - 2], s[s.length - 1]]);
    }
    var last = e[e.length - 1];
    if (last[0] !== 0) g.lineTo(cx + last[0], last[1]);
    for (i = segs.length - 1; i >= 0; i--) {
      s = segs[i]; var p = e[i];
      if (s.length === 2) g.lineTo(cx + p[0], p[1]);
      else if (s.length === 4) g.quadraticCurveTo(cx + s[0], s[1], cx + p[0], p[1]);
      else g.bezierCurveTo(cx + s[2], s[3], cx + s[0], s[1], cx + p[0], p[1]);
    }
    g.closePath();
  }
  // 平滑曲线（Catmull-Rom）：pts=[x,y,k,...]，k=1 平滑点，0 尖角
  function spline(g, pts, closed, cont) {
    var n = pts.length / 3, i;
    if (!cont) g.beginPath();
    function I(i) { return closed ? ((i % n) + n) % n : clamp(i, 0, n - 1); }
    function X(i) { return pts[I(i) * 3]; }
    function Y(i) { return pts[I(i) * 3 + 1]; }
    function S(i) { return pts[I(i) * 3 + 2]; }
    g.moveTo(X(0), Y(0));
    var segs = closed ? n : n - 1, ten = 0.19;
    for (i = 0; i < segs; i++) {
      var t0 = S(i) ? ten : 0, t1 = S(i + 1) ? ten : 0;
      g.bezierCurveTo(X(i) + (X(i + 1) - X(i - 1)) * t0, Y(i) + (Y(i + 1) - Y(i - 1)) * t0,
        X(i + 1) - (X(i + 2) - X(i)) * t1, Y(i + 1) - (Y(i + 2) - Y(i)) * t1, X(i + 1), Y(i + 1));
    }
    if (closed) g.closePath();
  }
  // 中点二次平滑折线：pts=[x,y,...]
  function smoothPoly(g, pts, closed, cont) {
    var n = pts.length / 2, i;
    if (!cont) g.beginPath();
    if (closed) {
      g.moveTo((pts[0] + pts[2 * n - 2]) / 2, (pts[1] + pts[2 * n - 1]) / 2);
      for (i = 0; i < n; i++) {
        var j = (i + 1) % n;
        g.quadraticCurveTo(pts[2 * i], pts[2 * i + 1], (pts[2 * i] + pts[2 * j]) / 2, (pts[2 * i + 1] + pts[2 * j + 1]) / 2);
      }
      g.closePath();
    } else {
      g.moveTo(pts[0], pts[1]);
      for (i = 1; i < n - 1; i++) g.quadraticCurveTo(pts[2 * i], pts[2 * i + 1], (pts[2 * i] + pts[2 * i + 2]) / 2, (pts[2 * i + 1] + pts[2 * i + 3]) / 2);
      g.lineTo(pts[2 * n - 2], pts[2 * n - 1]);
    }
  }
  function ell(g, cx, cy, rx, ry, rot, cont) {
    if (!cont) g.beginPath();
    rx = Math.abs(rx); ry = Math.abs(ry);
    if (g.ellipse) { g.moveTo(cx + rx * Math.cos(rot || 0), cy + rx * Math.sin(rot || 0)); g.ellipse(cx, cy, rx, ry, rot || 0, 0, PI * 2); }
    else { g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.scale(1, ry / (rx || 1)); g.moveTo(rx, 0); g.arc(0, 0, rx, 0, PI * 2); g.restore(); }
  }
  function circ(g, x, y, r, cont) { if (!cont) g.beginPath(); g.moveTo(x + r, y); g.arc(x, y, r, 0, PI * 2); }
  function rrect(g, x, y, w, h, r) { K.rr(g, x, y, w, h, r); }
  // 发束（锥形弯曲片）：根部 (x0,y0) 宽 w，尖端 (x1,y1)，bend = 中线沿法线（左手侧）的偏移
  function lock(x0, y0, x1, y1, w, bend, w1) { return { x0: x0, y0: y0, x1: x1, y1: y1, w: w, b: bend || 0, w1: w1 || 0 }; }
  function lockPts(L) {
    var dx = L.x1 - L.x0, dy = L.y1 - L.y0, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    var hw = L.w / 2, b = L.b, tw = L.w1 / 2;
    return {
      l0x: L.x0 + nx * hw, l0y: L.y0 + ny * hw, r0x: L.x0 - nx * hw, r0y: L.y0 - ny * hw,
      l1x: L.x0 + nx * (hw + b * 0.8) + ux * len * 0.36, l1y: L.y0 + ny * (hw + b * 0.8) + uy * len * 0.36,
      l2x: L.x0 + nx * (b * 0.9 + hw * 0.62) + ux * len * 0.8, l2y: L.y0 + ny * (b * 0.9 + hw * 0.62) + uy * len * 0.8,
      r1x: L.x0 + nx * (-hw + b * 0.8) + ux * len * 0.36, r1y: L.y0 + ny * (-hw + b * 0.8) + uy * len * 0.36,
      r2x: L.x0 + nx * (b * 0.9 - hw * 0.62) + ux * len * 0.8, r2y: L.y0 + ny * (b * 0.9 - hw * 0.62) + uy * len * 0.8,
      tlx: L.x1 + nx * tw, tly: L.y1 + ny * tw, trx: L.x1 - nx * tw, try_: L.y1 - ny * tw,
      nx: nx, ny: ny, ux: ux, uy: uy, len: len
    };
  }
  function lockPath(g, L, cont) {
    var p = lockPts(L);
    if (!cont) g.beginPath();
    g.moveTo(p.l0x, p.l0y);
    g.bezierCurveTo(p.l1x, p.l1y, p.l2x, p.l2y, p.tlx, p.tly);
    if (L.w1) g.lineTo(p.trx, p.try_);
    g.bezierCurveTo(p.r2x, p.r2y, p.r1x, p.r1y, p.r0x, p.r0y);
    g.closePath();
  }
  // 子段三次曲线（t0..1）
  function subCubic(x0, y0, x1, y1, x2, y2, x3, y3, t0) {
    var ax = lerp(x0, x1, t0), ay = lerp(y0, y1, t0), bx = lerp(x1, x2, t0), by = lerp(y1, y2, t0), cx_ = lerp(x2, x3, t0), cy_ = lerp(y2, y3, t0);
    var dx = lerp(ax, bx, t0), dy = lerp(ay, by, t0), ex = lerp(bx, cx_, t0), ey = lerp(by, cy_, t0);
    return [lerp(dx, ex, t0), lerp(dy, ey, t0), ex, ey, cx_, cy_, x3, y3];
  }
  // 发束两侧的描线（从 t0 开始，根部不描）
  function lockEdges(g, L, t0) {
    var p = lockPts(L), s;
    g.beginPath();
    s = subCubic(p.l0x, p.l0y, p.l1x, p.l1y, p.l2x, p.l2y, p.tlx, p.tly, t0);
    g.moveTo(s[0], s[1]); g.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]);
    s = subCubic(p.r0x, p.r0y, p.r1x, p.r1y, p.r2x, p.r2y, p.trx, p.try_, t0);
    g.moveTo(s[0], s[1]); g.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]);
  }
  // 发束中线上 t 处的点（u: -1..1 横向位置）
  function lockAt(L, t, u) {
    var p = lockPts(L);
    var lx = bz(p.l0x, p.l1x, p.l2x, p.tlx, t), ly = bz(p.l0y, p.l1y, p.l2y, p.tly, t);
    var rx = bz(p.r0x, p.r1x, p.r2x, p.trx, t), ry = bz(p.r0y, p.r1y, p.r2y, p.try_, t);
    var k = (1 - u) / 2;
    return [lerp(lx, rx, k), lerp(ly, ry, k)];
  }

  /* ====================== 图层 ====================== */
  function mkC(g, W, H, q, lw) {
    q = q || { s: 1, model: 2, tex: 2, light: 2 };
    return { g: g, W: W, H: H, q: q, s: q.s || 1, m: q.model | 0, t: q.tex | 0, l: q.light | 0, lw: lw || 1, L: null, Lg: null };
  }
  function lbegin(C) {
    if (!C.L) { C.L = K.canvas(C.W * C.s, C.H * C.s); C.Lg = C.L.getContext('2d'); }
    var g = C.Lg;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.clearRect(0, 0, C.L.width, C.L.height);
    g.setTransform(C.L.width / C.W, 0, 0, C.L.height / C.H, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    K.noShadow(g);
    return g;
  }
  function lend(C, a) {
    var g = C.g;
    g.save(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = a === undefined ? 1 : a;
    g.drawImage(C.L, 0, 0, C.W, C.H);
    g.restore();
  }
  // 部件：底色/纹理 → 形状内阴影 → 内线 → 外轮廓（destination-over：只出现在剪影外侧）
  function piece(C, g, o) {
    o.f(g);
    if (o.tex && C.t > 0) K.fillTex(g, C.q, o.tex[0], o.tex[1], o.tex[2], o.tex[3] || 0, o.tex[4] || 0);
    else { g.fillStyle = o.fill; g.fill(); }
    if (o.sh) { g.save(); o.f(g); g.clip(); o.sh(g); g.restore(); }
    if (o.ln && o.lw) { (o.e || o.f)(g); g.strokeStyle = o.ln; g.lineWidth = o.lw; g.stroke(); }
    if (o.ow) { g.save(); g.globalCompositeOperation = 'destination-over'; o.f(g); g.strokeStyle = o.oln || o.ln; g.lineWidth = o.ow * 2; g.stroke(); g.restore(); }
  }
  function strokeW(g, col, w) { g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
  function fillC(g, col) { g.fillStyle = col; g.fill(); }

  /* ====================== 调色 ====================== */
  var palCache = {};
  // 通用材质色阶：b 底色 s 阴影 d 深阴影 l 亮部 ln 线色
  function pal(c) {
    c = c || '#808080';
    var key = 'p' + c; if (palCache[key]) return palCache[key];
    var L = lum(c), p = { b: c };
    if (L > 0.8) {
      p.s = K.mix(c, '#8890b4', 0.3); p.d = K.mix(c, '#5a6088', 0.52); p.l = '#ffffff'; p.ln = K.mix(c, '#383a58', 0.74);
    } else if (L < 0.13) {
      p.s = K.mix(c, '#000000', 0.45); p.d = K.mix(c, '#000000', 0.72); p.l = K.mix(c, '#9aa2c8', 0.2); p.ln = K.mix(c, '#000000', 0.66);
    } else {
      p.s = K.mix(K.shade(c, -0.3), '#30306a', 0.14); p.d = K.mix(K.shade(c, -0.52), '#1c1c40', 0.18);
      p.l = K.mix(K.shade(c, 0.24), '#fff2dc', 0.12); p.ln = K.mix(K.shade(c, -0.64), '#1a0c18', 0.3);
    }
    p.m = K.mix(p.b, p.s, 0.5);
    return (palCache[key] = p);
  }
  function skinPal(c) {
    c = c || '#f1d2b8';
    var key = 'k' + c; if (palCache[key]) return palCache[key];
    var p = { b: c };
    p.s = K.mix(K.mix(c, '#e0707a', 0.26), '#402040', 0.08);
    p.d = K.mix(c, '#a04a5a', 0.42);
    p.warm = K.mix(c, '#ff6248', 0.32);
    p.hl = K.mix(c, '#ffffff', 0.62);
    p.blush = '#ff7c88';
    p.ln = K.mix(K.shade(c, -0.6), '#5a1424', 0.36);
    p.lip = K.mix(c, '#d0506a', 0.32);
    p.mouth = '#5c1a28'; p.tongue = '#e06a78';
    return (palCache[key] = p);
  }
  function hairPal(c, hl2) {
    c = c || '#3a3030';
    var key = 'h' + c + (hl2 || ''); if (palCache[key]) return palCache[key];
    var L = lum(c), p = {};
    if (L < 0.12) {
      p.b = K.mix(c, '#363c56', 0.3); p.s = K.mix(c, '#000000', 0.12); p.d = K.mix(c, '#000000', 0.42);
      p.h = K.mix(p.b, '#b4c4f0', 0.52); p.ln = K.mix(c, '#000000', 0.5);
    } else if (L > 0.74) {
      p.b = c; p.s = K.mix(c, '#9890b8', 0.36); p.d = K.mix(c, '#686088', 0.58); p.h = '#ffffff'; p.ln = K.mix(c, '#463c5c', 0.7);
    } else {
      p.b = c; p.s = K.mix(K.shade(c, -0.3), '#2a2050', 0.15); p.d = K.mix(K.shade(c, -0.55), '#140c28', 0.2);
      p.h = K.mix(K.shade(c, 0.4), '#fff4e4', 0.22); p.ln = K.mix(K.shade(c, -0.66), '#180810', 0.32);
    }
    if (hl2) p.h = hl2;
    p.m = K.mix(p.b, p.s, 0.55);
    return (palCache[key] = p);
  }
  function eyePal(c) {
    c = c || '#4a3a30';
    var key = 'e' + c; if (palCache[key]) return palCache[key];
    var L = lum(c), b = L < 0.17 ? K.mix(c, '#6a5848', 0.38) : c, p = { b: b };
    p.d = K.mix(K.shade(b, -0.62), '#100818', 0.2);
    p.l = K.mix(K.shade(b, 0.55), '#ffffff', 0.08);
    p.ring = K.mix(K.shade(b, -0.72), '#000000', 0.2);
    p.pu = K.mix(K.shade(b, -0.86), '#000000', 0.3);
    return (palCache[key] = p);
  }
  // 织物纹理：返回 piece 的 tex 参数
  var CLOTH = {
    cotton: ['fabric', { threads: 20, seed: 13 }, 34, 0.05, 0.05],
    shirt: ['fabric', { threads: 24, seed: 17 }, 30, 0.035, 0.035],
    wool: ['noise', { scale: 12, oct: 3, seed: 7, contrast: 1.3 }, 44, 0.07, 0.05],
    tweed: ['fabric', { threads: 12, seed: 21 }, 34, 0.1, 0.07],
    knit: ['fabric', { threads: 8, seed: 31 }, 26, 0.12, 0.07],
    denim: ['fabric', { threads: 22, seed: 41 }, 30, 0.12, 0.09],
    leather: ['noise', { scale: 16, oct: 2, seed: 5, contrast: 1.6 }, 56, 0.06, 0.06],
    canvas: ['fabric', { threads: 14, seed: 51 }, 30, 0.08, 0.07],
    silk: null
  };
  function clothTex(c, kind) {
    var d = CLOTH[kind || 'cotton'];
    if (!d) return null;
    var o = {}, k;
    for (k in d[1]) o[k] = d[1][k];
    var L = lum(c);
    o.c1 = K.shade(c, -d[3] * (L < 0.15 ? 2.2 : 1)); o.c2 = K.shade(c, d[4] * (L < 0.15 ? 1.6 : 1));
    return [d[0], o, d[2]];
  }

  /* ====================== 几何：头与身体 ====================== */
  // 脸型：jw 下颌宽（相对脸宽 fw）、jy 下颌角高度（相对 r）、cw 下巴宽、hk 脸长倍率、hollow 面颊凹陷
  FACE.f = { jw: 0.64, jy: 0.8, cw: 0.12 };
  FACE.soft = { jw: 0.75, jy: 0.79, cw: 0.2 };
  FACE.m = { jw: 0.74, jy: 0.83, cw: 0.22, ang: 1 };
  FACE.sharp = { jw: 0.68, jy: 0.84, cw: 0.17, ang: 1 };
  FACE.square = { jw: 0.86, jy: 0.86, cw: 0.36, ang: 1.4 };
  FACE.round = { jw: 0.9, jy: 0.79, cw: 0.42 };
  FACE.child = { jw: 0.84, jy: 0.77, cw: 0.3 };
  FACE.long = { jw: 0.73, jy: 0.86, cw: 0.24, hk: 1.06 };
  FACE.old = { jw: 0.72, jy: 0.84, cw: 0.26, hollow: 1 };

  function headGeom(cf, cx, T, r, chibi) {
    var age = cf.age || 22, sex = cf.sex || 'f', hd = cf.head || {};
    var child = age < 13, teen = age >= 13 && age < 18, old = age >= 58;
    var ft = FACE[cf.face] || FACE[child ? 'child' : sex === 'm' ? 'm' : 'f'];
    r *= (ft.hk || 1) * (hd.h || 1);
    var H = { cx: cx, T: T, r: r, u: r / 330, child: child, teen: teen, old: old, sex: sex, age: age, chibi: !!chibi, ft: ft };
    H.fw = r * (child ? 0.4 : sex === 'm' ? 0.365 : 0.36) * (hd.w || 1) * (chibi ? 1.08 : 1);
    H.C = T + r;
    H.eyeY = T + r * (chibi ? 0.6 : child ? 0.6 : 0.575) + (hd.eyeY || 0) * r;
    H.noseY = T + r * (child ? 0.75 : 0.742);
    H.mouthY = T + r * (child ? 0.85 : 0.84);
    if (chibi) { H.noseY = T + r * 0.76; H.mouthY = T + r * 0.85; }
    H.jw = H.fw * ft.jw; H.jawY = T + r * ft.jy; H.cw = H.fw * ft.cw;
    var ey = cf.eyes || {};
    H.ew = H.fw * (sex === 'm' ? 0.47 : 0.5) * (child ? 1.06 : teen ? 1.03 : 1) * (ey.size || 1) * (chibi ? 1.12 : 1);
    H.eh = H.ew * (sex === 'm' ? 0.68 : 0.9) * (child ? 1.08 : 1) * (chibi ? 1.1 : 1);
    H.ex = H.fw * (ey.gap || 1) * (chibi ? 0.52 : 0.5);
    H.browY = H.eyeY - H.eh * 0.5 - r * (sex === 'm' ? 0.04 : 0.056);
    H.earY0 = H.eyeY - r * 0.035; H.earY1 = H.noseY + r * 0.02;
    return H;
  }
  function bodyGeom(cf, H, bot) {
    var r = H.r, sex = cf.sex || 'f', bd = cf.build || 0, kid = H.child;
    var B = { cx: H.cx, r: r, u: H.u, bot: bot, H: H };
    var k = 1 + bd * 0.12;
    B.nw = r * (kid ? 0.12 : sex === 'm' ? 0.155 : 0.118) * (1 + bd * 0.18) * (H.old ? 0.94 : 1);
    B.ny = H.C + r * (kid ? 0.07 : sex === 'm' ? 0.1 : 0.12);
    B.shY = H.C + r * (kid ? 0.22 : 0.3) + (H.old ? r * 0.02 : 0);
    B.sw = r * (kid ? 0.5 : sex === 'm' ? 0.73 : 0.6) * k * (H.old ? 0.94 : 1);
    B.bw = B.sw + r * (kid ? 0.07 : 0.1);
    B.aw = r * (kid ? 0.22 : sex === 'm' ? 0.29 : 0.25) * k;
    return B;
  }

  /* ====================== 头发 ====================== */
  // 发型预设：全部字段可在配置的 hair:{} 中覆盖
  HAIR.short = { vol: 0.05, hl: 0.16, bangs: { k: 'spiky', n: [5, 7, 9], len: 0.45, part: 0.2 }, side: { k: 'sideburn' }, back: { k: 'short' } };
  HAIR.short_messy = { vol: 0.08, w: 1.04, cap: 'tufts', bangs: { k: 'messy', n: [6, 9, 12], len: 0.5, part: -0.15, irr: 1.2 }, side: { k: 'lock', len: 0.35, w: 0.13 }, back: { k: 'spiky', len: 0.02 }, extras: [{ k: 'ahoge' }] };
  HAIR.neat_short = { vol: 0.055, bangs: { k: 'short', n: [6, 8, 11], len: 0.32, part: 0.45 }, side: { k: 'sideburn' }, back: { k: 'short' } };
  HAIR.short_neat = { vol: 0.045, bangs: { k: 'short', n: [6, 8, 10], len: 0.22, part: -0.5 }, side: { k: 'sideburn' }, back: { k: 'short' } };
  HAIR.side_part = { vol: 0.06, hl: 0.15, bangs: { k: 'swept', len: 0.42, part: -0.55 }, side: { k: 'sideburn' }, back: { k: 'short' } };
  HAIR.side_part_grey = { vol: 0.055, hl: 0.15, bangs: { k: 'swept', len: 0.35, part: -0.55 }, side: { k: 'sideburn' }, back: { k: 'short' }, grey: 0.5 };
  HAIR.slicked_back = { vol: 0.09, hl: 0.12, cap: 'swept', bangs: { k: 'none', stray: 1 }, side: { k: 'sideburn', short: 1 }, back: { k: 'short' } };
  HAIR.grey_slick = { vol: 0.05, hl: 0.11, cap: 'swept', recede: 0.5, bangs: { k: 'none' }, side: { k: 'sideburn', short: 1 }, back: { k: 'short' } };
  HAIR.buzz = { vol: 0.015, hl: 0.14, w: 0.97, cap: 'buzz', bangs: { k: 'none' }, side: { k: 'none' }, back: { k: 'none' } };
  HAIR.cropped = { vol: 0.03, hl: 0.15, w: 0.99, bangs: { k: 'short', n: [6, 9, 12], len: 0.14, part: 0 }, side: { k: 'sideburn', short: 1 }, back: { k: 'short', len: -0.05 } };
  HAIR.cropped_grey = HAIR.cropped;
  HAIR.wavy_medium = { vol: 0.09, w: 1.05, cap: 'tufts', wave: 1, bangs: { k: 'swept', len: 0.6, part: 0.5, n: [3, 4, 5] }, side: { k: 'lock', len: 0.55, w: 0.16, wave: 1 }, back: { k: 'spiky', len: -0.06 } };
  HAIR.long_straight = { vol: 0.06, bangs: { k: 'spiky', n: [6, 9, 12], len: 0.48, part: 0.1 }, side: { k: 'lock', len: 2.1, w: 0.2, n: 2 }, back: { k: 'long', len: 1.6, w: 1.32 } };
  HAIR.long_ribbon = HAIR.long_straight;
  HAIR.hime_cut = { vol: 0.05, bangs: { k: 'blunt', len: 0.5 }, side: { k: 'blunt', len: 0.98 }, back: { k: 'long', len: 1.7, w: 1.3, blunt: 1 } };
  HAIR.bob = { vol: 0.07, bangs: { k: 'spiky', n: [6, 9, 11], len: 0.5, part: 0.15 }, side: { k: 'lock', len: 0.9, w: 0.18 }, back: { k: 'bob', len: -0.04, w: 1.18 } };
  HAIR.bob_asym = { vol: 0.07, asym: 1, bangs: { k: 'swept', len: 0.85, part: 0.55, n: [3, 4, 6] }, side: { k: 'lock', len: 0.75, w: 0.2, asym: 0.6 }, back: { k: 'bob', len: 0.02, w: 1.2, asym: 0.5 } };
  HAIR.bun = { vol: 0.04, hl: 0.15, cap: 'swept', bangs: { k: 'parted', len: 0.45, part: -0.3 }, side: { k: 'lock', len: 0.6, w: 0.08, n: 1 }, back: { k: 'short', len: -0.1 }, extras: [{ k: 'bun', pos: 'back' }] };
  HAIR.long_tied = { vol: 0.06, bangs: { k: 'parted', len: 0.66, part: 0.25 }, side: { k: 'lock', len: 0.75, w: 0.12, n: 1 }, back: { k: 'short', len: 0 }, extras: [{ k: 'low_tail', side: 1 }] };
  HAIR.loose_wavy_long = { vol: 0.1, w: 1.08, wave: 1, bangs: { k: 'parted', len: 0.55, part: 0.12, soft: 1 }, side: { k: 'lock', len: 2.0, w: 0.24, n: 2, wave: 1 }, back: { k: 'wavy', len: 1.45, w: 2.05 } };
  HAIR.twin_tails = { vol: 0.06, bangs: { k: 'spiky', n: [6, 9, 11], len: 0.48, part: 0.15 }, side: { k: 'lock', len: 0.9, w: 0.13, n: 1 }, back: { k: 'short', len: 0.05 }, extras: [{ k: 'twin_tails', len: 1.25 }] };
  HAIR.twin_braids = { vol: 0.05, bangs: { k: 'spiky', n: [5, 7, 9], len: 0.42, part: 0.0 }, side: { k: 'lock', len: 0.45, w: 0.1, n: 1 }, back: { k: 'short', len: 0 }, extras: [{ k: 'braids', len: 0.95 }] };
  HAIR.short_ragged = { vol: 0.06, bangs: { k: 'messy', n: [6, 9, 12], len: 0.52, part: 0.3, irr: 1.5 }, side: { k: 'ragged', len: 0.72, w: 0.16 }, back: { k: 'ragged', len: -0.08, w: 1.12 } };
  HAIR.ponytail = { vol: 0.06, cap: 'swept', bangs: { k: 'spiky', n: [4, 6, 8], len: 0.5, part: 0.2 }, side: { k: 'lock', len: 0.7, w: 0.1, n: 1 }, back: { k: 'short', len: -0.1 }, extras: [{ k: 'ponytail', len: 1.1 }] };
  HAIR.low_tail = { vol: 0.05, bangs: { k: 'parted', len: 0.6, part: 0 }, side: { k: 'lock', len: 0.9, w: 0.1, n: 1 }, back: { k: 'long', len: 1.0, w: 1.15 } };
  HAIR.bandana = { vol: 0.02, bangs: { k: 'none' }, side: { k: 'sideburn', short: 1 }, back: { k: 'short', len: -0.02 } };
  HAIR.cap = { vol: 0.02, bangs: { k: 'none' }, side: { k: 'sideburn' }, back: { k: 'short', len: -0.02 } };
  HAIR.balding = { vol: 0.0, hl: 0.3, cap: 'thin', bangs: { k: 'none' }, side: { k: 'sideburn' }, back: { k: 'short', len: -0.04 } };
  HAIR.old_bun = { vol: 0.03, hl: 0.13, cap: 'swept', bangs: { k: 'none' }, side: { k: 'none' }, back: { k: 'short', len: -0.12 }, extras: [{ k: 'bun', pos: 'back', r: 0.17 }] };
  HAIR.child_short = { vol: 0.08, w: 1.05, cap: 'tufts', bangs: { k: 'messy', n: [6, 8, 10], len: 0.48, part: 0, irr: 0.9 }, side: { k: 'lock', len: 0.4, w: 0.14 }, back: { k: 'spiky', len: 0.0 } };
  HAIR.hood = { none: 1 };
  HAIR.none = { none: 1 };

  function resolveHair(h) {
    h = h || {};
    var base = HAIR[h.style] || HAIR.short;
    var o = merge({ vol: 0.06, w: 1, hl: 0.16, cap: 'smooth', bangs: { k: 'spiky' }, side: { k: 'none' }, back: { k: 'short' } }, base);
    o = merge(o, h);
    if (!o.extras) o.extras = [];
    return o;
  }
  function capGeom(H, hs) {
    var r = H.r, vol = (hs.vol || 0) * r;
    var G = { rx: H.fw * 1.1 * (hs.w || 1) + vol * 0.55, top: H.T - vol, cy: H.T + r * 0.44 };
    G.ry = G.cy - G.top;
    G.hl = H.T + r * (hs.hl || 0.16);
    G.sideY = H.eyeY - r * 0.03;
    G.partX = H.cx + ((hs.bangs && hs.bangs.part) || 0) * H.fw * 0.55;
    return G;
  }
  // 头顶发盖
  function capShape(H, G, hs) {
    var cx = H.cx, r = H.r, fw = H.fw, rx = G.rx, ry = G.ry, top = G.top, cy = G.cy, sy = G.sideY, hl = G.hl, k = 0.5523;
    var rec = hs.recede || 0;
    return function (g) {
      sym(g, cx, [0, top], [
        [rx * k, top, rx, cy - ry * k, rx, cy],
        [rx * 1.0, lerp(cy, sy, 0.6), rx * 0.95, sy + r * 0.07],
        [rx * 0.92, sy, fw * 0.95, sy - r * 0.03],
        [fw * 0.9, hl + r * (0.14 - rec * 0.05), fw * (0.78 - rec * 0.05), hl + r * (0.05 - rec * 0.08), fw * 0.5, hl + r * (0.012 - rec * 0.05)],
        [fw * 0.22, hl - r * 0.005, 0, hl]
      ]);
    };
  }
  /* ---- 后发 ---- */
  BACKS.none = function () {};
  BACKS.short = function (o, H, hs, G) {
    var r = H.r, cx = H.cx, b = hs.back, yb = H.jawY + (b.len || 0) * r;
    o.back.push({ tone: 1, f: function (g) {
      sym(g, cx, [0, G.top + r * 0.02], [
        [G.rx * 0.54, G.top + r * 0.02, G.rx * 0.98, G.cy - G.ry * 0.52, G.rx * 0.99, G.cy],
        [G.rx * 1.04, G.cy + r * 0.16, G.rx * 0.92, yb - r * 0.05, G.rx * 0.82, yb],
        [G.rx * 0.5, yb + r * 0.03, 0, yb + r * 0.03]
      ]);
    } });
  };
  BACKS.spiky = function (o, H, hs, G, rnd, C) {
    BACKS.short(o, H, hs, G);
    var r = H.r, cx = H.cx, yb = H.jawY + (hs.back.len || 0) * r, n = K.byModel(C.q, 2, 3, 4);
    for (var s = -1; s <= 1; s += 2) for (var i = 0; i < n; i++) {
      var t = i / Math.max(1, n - 1);
      var x0 = cx + s * G.rx * (0.82 - t * 0.12), y0 = lerp(G.cy, yb - r * 0.05, 0.4 + t * 0.35);
      o.back.push({ tone: 1, L: lock(x0, y0, x0 + s * r * (0.08 + rnd() * 0.06), y0 + r * (0.14 + t * 0.04), r * 0.1, -s * r * 0.03) });
    }
  };
  function backMass(o, H, hs, G, rnd, C, opt) {
    var b = hs.back, r = H.r, cx = H.cx, fw = H.fw;
    var yb = H.C + (b.len === undefined ? 1.2 : b.len) * r;
    var wb = fw * (b.w || 1.4), wave = opt.wave ? r * 0.045 : 0;
    var n = opt.n || K.byModel(C.q, 4, 6, 8), pts = [], i, t;
    var asym = b.asym || 0;
    var sidePts = function (s) {
      var a = [];
      a.push([cx + s * G.rx * 0.99, G.cy, 1]);
      a.push([cx + s * (G.rx * 1.06 + wave * 0.6), lerp(G.cy, H.C, 0.55), 1]);
      a.push([cx + s * (lerp(G.rx * 1.06, wb, 0.5) - wave), lerp(H.C, yb, 0.25), 1]);
      if (yb - H.C > r * 0.6) a.push([cx + s * (wb + wave), lerp(H.C, yb, 0.62), 1]);
      return a;
    };
    var L = sidePts(-1), R = sidePts(1);
    pts.push(cx, G.top + r * 0.02, 1);
    pts.push(cx - G.rx * 0.76, G.top + G.ry * 0.26, 1);
    for (i = 0; i < L.length; i++) pts.push(L[i][0], L[i][1], L[i][2]);
    for (i = 0; i <= n; i++) {
      t = i / n;
      var x = cx + lerp(-wb, wb, t) * (1 - 0.05 * Math.sin(t * PI)), yy = yb + (asym ? (t - 0.5) * asym * r * 0.5 : 0);
      if (opt.blunt) {
        pts.push(x, yy + rnd.jit(0, r * 0.01), i === 0 || i === n ? 0 : 1);
      } else {
        pts.push(x, yy + rnd.jit(0, r * 0.035) + (opt.wave ? Math.sin(t * 9) * r * 0.02 : 0), 0);
        if (i < n) pts.push(x + (wb * 2 / n) * 0.5, yy - r * (opt.ragged ? 0.14 + rnd() * 0.1 : 0.09 + rnd() * 0.05), 1);
      }
    }
    for (i = R.length - 1; i >= 0; i--) pts.push(R[i][0], R[i][1], R[i][2]);
    pts.push(cx + G.rx * 0.76, G.top + G.ry * 0.26, 1);
    o.back.push({ tone: 1, mass: 1, f: function (g) { spline(g, pts, true); } });
    o.backY = yb;
  }
  BACKS.long = function (o, H, hs, G, rnd, C) { backMass(o, H, hs, G, rnd, C, { blunt: hs.back.blunt }); };
  BACKS.wavy = function (o, H, hs, G, rnd, C) { backMass(o, H, hs, G, rnd, C, { wave: 1 }); };
  BACKS.ragged = function (o, H, hs, G, rnd, C) { backMass(o, H, hs, G, rnd, C, { ragged: 1, n: K.byModel(C.q, 5, 7, 9) }); };
  BACKS.bob = function (o, H, hs, G, rnd, C) {
    var b = hs.back, r = H.r, cx = H.cx, yb = H.C + (b.len || 0) * r, wb = H.fw * (b.w || 1.18), asym = b.asym || 0;
    o.back.push({ tone: 1, f: function (g) {
      g.beginPath();
      g.moveTo(cx, G.top + r * 0.02);
      g.bezierCurveTo(cx + G.rx * 0.68, G.top + r * 0.02, cx + G.rx * 1.0, G.cy - G.ry * 0.5, cx + G.rx * 1.08, G.cy);
      g.bezierCurveTo(cx + wb * 1.06, G.cy + r * 0.22, cx + wb * 1.04, yb - r * 0.1 + asym * r * 0.12, cx + wb * 0.9, yb + asym * r * 0.12);
      g.quadraticCurveTo(cx + wb * 0.5, yb + r * 0.05, cx, yb + r * 0.02);
      g.quadraticCurveTo(cx - wb * 0.5, yb + r * 0.05, cx - wb * 0.9, yb - asym * r * 0.1);
      g.bezierCurveTo(cx - wb * 1.04, yb - r * 0.1 - asym * r * 0.1, cx - wb * 1.06, G.cy + r * 0.22, cx - G.rx * 1.08, G.cy);
      g.bezierCurveTo(cx - G.rx * 1.0, G.cy - G.ry * 0.5, cx - G.rx * 0.68, G.top + r * 0.02, cx, G.top + r * 0.02);
      g.closePath();
    } });
  };

  /* ---- 刘海 ---- */
  BANGS.none = function (o, H, hs, G, rnd) {
    if (hs.bangs.stray) {
      var x = H.cx + H.fw * 0.2, r = H.r;
      o.front.push({ L: lock(x, G.hl - r * 0.04, x - r * 0.05, G.hl + r * 0.1, r * 0.03, r * 0.035), thin: 1 });
    }
    void rnd;
  };
  function fanLocks(o, H, hs, G, rnd, C, opt) {
    var b = hs.bangs, r = H.r, cx = H.cx, fw = H.fw, n = pickN(b.n || [6, 8, 11], C), px = G.partX;
    var tipBase = lerp(H.browY - r * 0.02, H.eyeY + H.eh * 0.1, b.len === undefined ? 0.5 : b.len), list = [], i;
    var irr = (b.irr || 0.6) * (opt.irr || 1);
    for (i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1), a = lerp(-1, 1, t) * (b.spread || 1);
      var rx = cx + a * fw * 0.84;
      var ry = G.top + G.ry * 0.36 + a * a * r * 0.05;
      var dir = clamp((rx - px) / fw, -1.2, 1.2);
      var len = tipBase + r * 0.02 * (1 - a * a) - Math.abs(a) * r * (opt.sideUp || 0.03);
      if (opt.slant) len += (a * opt.slant) * r * 0.06;
      var tx = rx + dir * r * (opt.fan || 0.07) + a * r * 0.02 + rnd.jit(0, r * 0.015 * irr);
      var ty = len + rnd.jit(0, r * 0.03 * irr) - (i % 2) * r * 0.045 * (b.alt === undefined ? 1 : b.alt);
      if (opt.messy && i % 3 === 1) { ty -= r * 0.05; tx += (i % 2 ? 1 : -1) * r * 0.03; }
      var w = fw * 2.05 / n * (b.wk || 1.38) * (0.8 + rnd() * 0.45);
      if (rnd() < 0.22) ty += r * 0.035;
      var bend = -a * r * 0.035 - dir * r * 0.02 + rnd.jit(0, r * (opt.messy ? 0.03 : 0.016));
      var Lm = lock(rx, ry, tx, ty, w, bend), dd = Math.abs(rx - px) + (opt.messy ? rnd() * r * 0.05 : 0);
      list.push({ L: Lm, d: dd });
      // 分叉的小发束：与主束重叠、尖端错开，让刘海读作「一簇簇」而不是均匀的尖片
      if (C.m >= 1 && rnd() < (C.m >= 2 ? 0.55 : 0.35)) {
        var su = rnd() < 0.5 ? 0.55 : -0.55, sp0 = lockAt(Lm, 0.3, su);
        var stx = tx + su * w * 0.42 + rnd.jit(0, r * 0.01), sty = ty + rnd.jit(0, r * 0.035) - r * 0.01;
        list.push({ L: lock(sp0[0], sp0[1], stx, sty, w * (0.38 + rnd() * 0.12), bend * 0.7 + su * r * 0.012), d: dd - r * 0.001, sub: 1 });
      }
    }
    list.sort(function (p, q) { return q.d - p.d; });
    for (i = 0; i < list.length; i++) o.front.push({ L: list[i].L, bang: 1, noShine: list[i].sub });
  }
  BANGS.spiky = function (o, H, hs, G, rnd, C) { fanLocks(o, H, hs, G, rnd, C, {}); };
  BANGS.messy = function (o, H, hs, G, rnd, C) { fanLocks(o, H, hs, G, rnd, C, { messy: 1, irr: 1.3, fan: 0.09 }); };
  BANGS.short = function (o, H, hs, G, rnd, C) {
    var b = hs.bangs;
    fanLocks(o, H, hs, G, rnd, C, { fan: 0.12, slant: (b.part || 0) < 0 ? 0.8 : -0.8, sideUp: 0.05 });
  };
  BANGS.blunt = function (o, H, hs, G, rnd, C) {
    var r = H.r, cx = H.cx, fw = H.fw, cut = lerp(H.browY, H.eyeY, hs.bangs.len === undefined ? 0.4 : hs.bangs.len);
    var n = K.byModel(C.q, 6, 10, 14), pts = [], i;
    var xl = cx - fw * 0.98, xr = cx + fw * 0.98;
    pts.push(cx, G.top + G.ry * 0.2, 1);
    pts.push(cx - fw * 0.85, G.top + G.ry * 0.42, 1);
    pts.push(xl, lerp(G.top + G.ry * 0.6, cut, 0.5), 1);
    for (i = 0; i <= n; i++) {
      var t = i / n, x = lerp(xl, xr, t), y = cut + Math.sin(t * PI) * r * 0.015;
      pts.push(x, y + (i % 2 ? -r * 0.012 : r * 0.004), i % 2 ? 1 : 0);
    }
    pts.push(xr, lerp(G.top + G.ry * 0.6, cut, 0.5), 1);
    pts.push(cx + fw * 0.85, G.top + G.ry * 0.42, 1);
    var ep = pts.slice(6, pts.length - 3);
    o.front.push({ bang: 1, blunt: 1, f: function (g) { spline(g, pts, true); }, e: function (g) { spline(g, ep, false); }, cutY: cut });
    if (C.m >= 1) for (i = 1; i < n; i += 2) {
      var tx = lerp(xl, xr, i / n);
      o.front.push({ bang: 1, thin: 1, L: lock(tx + r * 0.005, G.top + G.ry * 0.6, tx, cut - r * 0.02, r * 0.02, 0) });
    }
  };
  BANGS.swept = function (o, H, hs, G, rnd, C) {
    var b = hs.bangs, r = H.r, cx = H.cx, fw = H.fw, ps = (b.part || 0.5) >= 0 ? 1 : -1, px = G.partX;
    var tip = lerp(H.browY, H.eyeY + H.eh * 0.3, b.len === undefined ? 0.5 : b.len), n = pickN(b.n || [2, 3, 4], C), i;
    // 分缝另一侧的短发
    o.front.push({ bang: 1, L: lock(px + ps * fw * 0.1, G.top + G.ry * 0.3, cx + ps * fw * 0.98, H.browY + r * 0.03, fw * 0.55, -ps * r * 0.07) });
    // 主刘海：从分缝扫向另一侧
    for (i = n - 1; i >= 0; i--) {
      var t = n === 1 ? 0 : i / (n - 1);
      var x0 = px - ps * fw * (0.05 + t * 0.25), y0 = G.top + G.ry * (0.28 + t * 0.12);
      var x1 = cx - ps * fw * (0.92 - t * 0.55) + rnd.jit(0, r * 0.01), y1 = tip - t * r * 0.08 + rnd.jit(0, r * 0.02);
      o.front.push({ bang: 1, L: lock(x0, y0, x1, y1, fw * (0.62 - t * 0.12), ps * r * (0.1 - t * 0.03)) });
    }
  };
  BANGS.parted = function (o, H, hs, G, rnd, C) {
    // 中分 / 偏分的帘式刘海：从分缝向两侧垂下，内侧短、外侧长；中间留几缕细发
    var b = hs.bangs, r = H.r, cx = H.cx, fw = H.fw, px = G.partX, s, i, n = K.byModel(C.q, 2, 3, 4);
    var tip = lerp(H.browY, H.eyeY + H.eh * 0.3, b.len === undefined ? 0.6 : b.len), list = [];
    for (s = -1; s <= 1; s += 2) {
      var span = s < 0 ? (px - (cx - fw * 0.95)) : ((cx + fw * 0.95) - px);
      for (i = 0; i < n; i++) {
        var t = (i + 0.5) / n;
        var x0 = px + s * span * (0.06 + t * 0.3), y0 = G.top + G.ry * (0.24 + t * 0.12);
        var x1 = px + s * span * (0.3 + t * 0.68) + rnd.jit(0, r * 0.01);
        var y1 = lerp(H.browY - r * 0.04, tip, 0.3 + t * 0.7) + rnd.jit(0, r * 0.015);
        list.push({ d: -t, L: lock(x0, y0, x1, y1, span * (0.62 - t * 0.12), -s * r * (0.06 + t * 0.03)) });
      }
    }
    list.sort(function (p, q) { return p.d - q.d; });
    for (i = 0; i < list.length; i++) o.front.push({ bang: 1, L: list[i].L });
    if (C.m >= 1) for (i = -1; i <= 1; i += 2) o.front.push({ bang: 1, L: lock(px + i * r * 0.012, G.top + G.ry * 0.32, px + i * r * 0.05, H.browY - r * 0.01, r * 0.035, -i * r * 0.015) });
  };
  /* ---- 侧发 ---- */
  SIDES.none = function () {};
  SIDES.sideburn = function (o, H, hs, G) {
    var r = H.r, cx = H.cx, fw = H.fw, sd = hs.side;
    for (var s = -1; s <= 1; s += 2) {
      var x0 = cx + s * fw * 0.97, y0 = G.sideY - r * 0.07;
      o.front.push({ side: 1, L: lock(x0, y0, x0 - s * r * 0.012, y0 + r * (sd.short ? 0.09 : 0.14), r * 0.075, -s * r * 0.005) });
    }
  };
  SIDES.lock = function (o, H, hs, G, rnd, C) {
    var sd = hs.side, r = H.r, fw = H.fw, cx = H.cx, len = sd.len === undefined ? 1 : sd.len, s;
    var tipY = len <= 1 ? lerp(H.eyeY + r * 0.06, H.C + r * 0.02, len) : H.C + (len - 1) * r * 0.8;
    var out = (sd.out || 0) + (len > 1 ? Math.min(0.45, (len - 1) * 0.42) : 0);
    if (len > 1.3) {
      for (s = -1; s <= 1; s += 2) longSide(o, H, hs, G, rnd, C, s, tipY, (sd.w || 0.2) * (sd.out === undefined ? 1 : 1 + sd.out), sd.wave || hs.wave);
      return;
    }
    for (s = -1; s <= 1; s += 2) {
      var am = sd.asym ? (s > 0 ? 1 + sd.asym * 0.5 : 1 - sd.asym * 0.4) : 1;
      var ty = H.eyeY + (tipY - H.eyeY) * am;
      var x0 = cx + s * fw * 0.93, y0 = G.cy - r * 0.08;
      var x1 = cx + s * fw * (0.86 + out), w = r * (sd.w || 0.16);
      if ((sd.n || 2) >= 2 && C.m >= 1) o.front.push({ side: 1, L: lock(x0 + s * fw * 0.04, y0 + r * 0.04, x1 + s * fw * 0.12, ty - r * (0.12 + rnd() * 0.06), w * 0.8, -s * r * 0.03) });
      o.front.push({ side: 1, L: lock(x0, y0, x1 + (sd.wave ? s * r * 0.02 : 0), ty, w, -s * r * (sd.bend === undefined ? 0.035 : sd.bend)) });
      if (C.m >= 2 && len > 0.6) o.front.push({ side: 1, L: lock(x0 - s * fw * 0.06, y0 + r * 0.06, x1 - s * fw * 0.08, ty - r * 0.18, w * 0.5, -s * r * 0.015) });
    }
  };
  SIDES.ragged = function (o, H, hs, G, rnd, C) {
    var sd = hs.side, r = H.r, fw = H.fw, cx = H.cx, s, i, n = K.byModel(C.q, 2, 3, 4);
    for (s = -1; s <= 1; s += 2) for (i = 0; i < n; i++) {
      var t = i / Math.max(1, n - 1);
      var x0 = cx + s * fw * (0.9 + t * 0.06), y0 = G.cy - r * 0.06 + t * r * 0.04;
      var ty = lerp(H.eyeY + r * 0.06, H.C, (sd.len || 0.7) * (0.7 + rnd() * 0.45)) - t * r * 0.03;
      o.front.push({ side: 1, L: lock(x0, y0, cx + s * fw * (0.84 + t * 0.12 + rnd() * 0.05), ty, r * (sd.w || 0.16) * (1 - t * 0.3), -s * r * 0.03 * (rnd() - 0.3)) });
    }
  };
  SIDES.blunt = function (o, H, hs, G) {
    var r = H.r, fw = H.fw, cx = H.cx, cut = lerp(H.eyeY, H.C, hs.side.len === undefined ? 0.95 : hs.side.len);
    for (var s = -1; s <= 1; s += 2) {
      (function (s) {
        var xi = cx + s * fw * 0.8, xo = cx + s * fw * 1.08;
        var sidePath = function (g, open) {
          g.beginPath();
          g.moveTo(cx + s * fw * 0.72, G.cy - r * 0.12);
          g.bezierCurveTo(cx + s * fw * 0.82, G.cy, xi, cut - r * 0.2, xi + s * r * 0.01, cut);
          g.lineTo(lerp(xi, xo, 0.5), cut + r * 0.008);
          g.lineTo(xo, cut - r * 0.005);
          g.bezierCurveTo(xo + s * r * 0.01, cut - r * 0.25, cx + s * G.rx * 1.02, G.cy + r * 0.05, cx + s * G.rx * 0.98, G.cy - r * 0.12);
          if (!open) g.closePath();
        };
        o.front.push({ side: 1, f: function (g) { sidePath(g, false); }, e: function (g) { sidePath(g, true); } });
      })(s);
    }
  };
  /* ---- 附加：双马尾、麻花辫、发髻、马尾、呆毛 ---- */
  HEXTRA.ahoge = function (o, H, hs, G) {
    var r = H.r, x = H.cx + H.fw * 0.12, y = G.top + r * 0.01;
    o.front.push({ ahoge: 1, f: function (g) {
      g.beginPath(); g.moveTo(x - r * 0.03, y + r * 0.03);
      g.bezierCurveTo(x - r * 0.02, y - r * 0.08, x + r * 0.1, y - r * 0.12, x + r * 0.13, y - r * 0.07);
      g.bezierCurveTo(x + r * 0.07, y - r * 0.09, x + r * 0.02, y - r * 0.04, x + r * 0.03, y + r * 0.03);
      g.closePath();
    } });
  };
  HEXTRA.twin_tails = function (o, H, hs, G, rnd, C, ex) {
    var r = H.r, cx = H.cx, len = ex.len || 1.2, s, yb = H.C + len * r;
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        var x0 = cx + s * G.rx * 0.86, y0 = G.top + G.ry * 0.42;
        var pts = [x0 - s * r * 0.02, y0 - r * 0.08, 1,
          x0 + s * r * 0.2, y0 - r * 0.05, 1,
          x0 + s * r * 0.4, y0 + r * 0.25, 1,
          x0 + s * r * 0.42, lerp(y0, yb, 0.55), 1,
          x0 + s * r * 0.3, yb - r * 0.08, 1,
          x0 + s * r * 0.18, yb, 0,
          x0 + s * r * 0.17, yb - r * 0.18, 1,
          x0 + s * r * 0.08, yb - r * 0.06, 0,
          x0 + s * r * 0.12, lerp(y0, yb, 0.6), 1,
          x0 + s * r * 0.06, y0 + r * 0.2, 1,
          x0 - s * r * 0.04, y0 + r * 0.06, 1];
        o.back.push({ tone: 0, tail: 1, f: function (g) { spline(g, pts, true); } });
        o.front.push({ tie: 1, f: function (g) { ell(g, x0 + s * r * 0.04, y0 - r * 0.005, r * 0.06, r * 0.075, s * 0.4); } , c: ex.c || hs.tieC || '#c02040' });
        if (ex.bow) { o.bows = o.bows || []; o.bows.push({ at: [x0 + s * r * 0.05, y0 - r * 0.01], c: ex.bow, size: ex.bowSize || 1, side: s, rot: s * 0.35 }); }
      })(s);
    }
  };
  HEXTRA.braids = function (o, H, hs, G, rnd, C, ex) {
    var r = H.r, cx = H.cx, len = ex.len || 0.9, s, i, n = K.byModel(C.q, 5, 7, 9);
    for (s = -1; s <= 1; s += 2) {
      var x0 = cx + s * H.fw * 0.96, y0 = H.jawY - r * 0.04, x1 = cx + s * H.fw * 1.1, y1 = H.C + len * r;
      o.front.push({ side: 1, L: lock(cx + s * H.fw * 0.86, G.cy - r * 0.05, x0, y0 + r * 0.04, r * 0.13, -s * r * 0.02) });
      for (i = 0; i < n; i++) {
        (function (i) {
          var t = (i + 0.5) / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t), w = r * 0.075 * (1 - t * 0.25), hh = (y1 - y0) / n * 0.85;
          var sd = i % 2 ? 1 : -1;
          o.front.push({ braid: 1, sliver: [-sd * w * 0.25, -hh * 0.15], f: function (g) { ell(g, x + sd * w * 0.22, y, w * 0.78, hh * 0.72, sd * 0.55); } });
        })(i);
      }
      o.front.push({ tie: 1, c: ex.c || hs.tieC || '#c03040', f: (function (x, y) { return function (g) { rrect(g, x - r * 0.045, y - r * 0.02, r * 0.09, r * 0.04, r * 0.015); }; })(x1, y1 + r * 0.005) });
      o.front.push({ L: lock(x1 - s * r * 0.01, y1 + r * 0.02, x1 + s * r * 0.015, y1 + r * 0.12, r * 0.075, 0) });
    }
  };
  HEXTRA.bun = function (o, H, hs, G, rnd, C, ex) {
    var r = H.r, br = r * (ex.r || 0.2), bx = H.cx + (ex.x || 0) * H.fw, by = ex.pos === 'top' ? G.top + br * 0.2 : G.top + br * 0.55;
    o.back.push({ tone: 0, bun: 1, f: function (g) { ell(g, bx, by, br * 1.05, br * 0.92); }, wrap: [bx, by, br] });
  };
  HEXTRA.ponytail = function (o, H, hs, G, rnd, C, ex) {
    var r = H.r, cx = H.cx, len = ex.len || 1, sd = ex.side || 1, yb = H.C + len * r;
    var pts = [cx + sd * G.rx * 0.5, G.top + r * 0.05, 1, cx + sd * G.rx * 1.25, G.cy - r * 0.05, 1, cx + sd * G.rx * 1.3, lerp(G.cy, yb, 0.6), 1,
      cx + sd * G.rx * 1.1, yb, 0, cx + sd * G.rx * 0.95, lerp(G.cy, yb, 0.55), 1, cx + sd * G.rx * 0.9, G.cy, 1];
    o.back.push({ tone: 0, tail: 1, f: function (g) { spline(g, pts, true); } });
  };
  HEXTRA.low_tail = function (o, H, hs, G, rnd, C, ex) {
    var r = H.r, s = ex.side || 1, x0 = H.cx + s * H.fw * 0.98, y0 = H.C + r * 0.02, yb = H.C + (ex.len || 0.95) * r;
    o.back.push({ tone: 0, L: lock(H.cx + s * H.fw * 0.85, H.jawY - r * 0.12, x0 + s * r * 0.02, y0 + r * 0.08, r * 0.16, -s * r * 0.02) });
    o.front.push({ tail: 1, sliver: [-s * r * 0.05, -r * 0.01], L: lock(x0, y0, x0 + s * r * 0.16, yb, r * 0.17, -s * r * 0.1) });
    if (C.m >= 1) o.front.push({ L: lock(x0 + s * r * 0.03, y0 + r * 0.15, x0 + s * r * 0.08, yb + r * 0.05, r * 0.1, -s * r * 0.06) });
    o.front.push({ tie: 1, c: ex.c || hs.tieC || '#404048', f: function (g) { g.save(); g.translate(x0, y0 + r * 0.04); g.rotate(-s * 0.25); rrect(g, -r * 0.085, -r * 0.025, r * 0.17, r * 0.05, r * 0.02); g.restore(); } });
  };
  HEXTRA.ribbon = function (o, H, hs, G, rnd, C, ex) { o.bows = o.bows || []; o.bows.push(ex); };

  // 头顶翘起的发束（凌乱轮廓）
  function capTufts(o, H, hs, G, rnd, C) {
    var r = H.r, cx = H.cx, n = K.byModel(C.q, 2, 3, 4), s, i;
    for (s = -1; s <= 1; s += 2) for (i = 0; i < n; i++) {
      var th = lerp(0.22, 0.95, (i + 0.5) / n) + rnd.jit(0, 0.08) + (s > 0 ? 0.08 : 0), c = Math.cos(th), sn = Math.sin(th);
      var x0 = cx + s * G.rx * 0.78 * sn, y0 = G.cy - G.ry * 0.8 * c;
      var x1 = cx + s * G.rx * (1.08 + rnd() * 0.06) * Math.sin(th + 0.22), y1 = G.cy - G.ry * (1.07 + rnd() * 0.05) * Math.cos(th + 0.22);
      o.front.push({ tuft: 1, L: lock(x0, y0, x1, y1, r * (0.13 + rnd() * 0.04), -s * r * 0.03) });
    }
  }
  // 长侧发：一束长发锥（外层搭过肩膀、内层沿下颌），发尖高低错落
  function longSide(o, H, hs, G, rnd, C, s, tipY, w, wave) {
    var r = H.r, cx = H.cx, fw = H.fw, k = 1 + (w - 0.2) * 2.5, wv = wave ? 1 : 0;
    var spec = [
      [fw * 0.8, G.cy - r * 0.2, fw * (1.28 + 0.12 * k), 0, r * 0.25 * k, 0.15 + wv * 0.05],
      [fw * 0.82, G.cy - r * 0.1, fw * (1.1 + 0.08 * k), -0.13, r * 0.2 * k, 0.1 + wv * 0.04],
      [fw * 0.84, G.cy, fw * 0.97, -0.3, r * 0.12, 0.05]
    ];
    if (C.m >= 2) spec.splice(1, 0, [fw * 0.84, G.cy - r * 0.16, fw * (1.22 + 0.1 * k), -0.06, r * 0.16 * k, 0.14 + wv * 0.06]);
    for (var i = 0; i < spec.length; i++) {
      var q = spec[i], ty = tipY + q[3] * r + rnd.jit(0, r * 0.025);
      o.front.push({ side: 1, L: lock(cx + s * q[0], q[1], cx + s * q[2], ty, q[4], -s * r * q[5]) });
      if (wave && C.m >= 1 && i < 2) o.front.push({ side: 1, L: lock(cx + s * (q[2] - r * 0.03), ty - r * 0.3, cx + s * (q[2] + r * 0.06), ty + r * 0.04, q[4] * 0.45, s * r * 0.05) });
    }
  }
  function buildHair(C, cf, H) {
    var hs = resolveHair(cf.hair), o = { back: [], front: [], hs: hs, id: cf._id || '' };
    if (hs.none) return o;
    var rnd = K.rng('hair:' + (cf._id || '') + ':' + (hs.seed || 0));
    var G = capGeom(H, hs);
    o.G = G;
    (BACKS[hs.back.k] || BACKS.short)(o, H, hs, G, rnd, C);
    o.front.push({ cap: 1, f: capShape(H, G, hs) });
    if (hs.cap === 'tufts') capTufts(o, H, hs, G, rnd, C);
    if (C.m >= 2 && !hs.noFly && hs.cap !== 'buzz' && hs.cap !== 'thin' && hs.cap !== 'swept') {
      // 几缕飞出的细发，打破头盔般的轮廓
      for (var fsd = -1; fsd <= 1; fsd += 2) {
        var fth = fsd < 0 ? 0.62 : 0.85, fx0 = H.cx + fsd * G.rx * 0.8 * Math.sin(fth), fy0 = G.cy - G.ry * 0.85 * Math.cos(fth);
        o.front.push({ thin: 1, fly: 1, L: lock(fx0, fy0, fx0 + fsd * H.r * 0.11, fy0 - H.r * 0.035, H.r * 0.022, -fsd * H.r * 0.035) });
      }
    }
    (SIDES[hs.side.k] || SIDES.none)(o, H, hs, G, rnd, C);
    (BANGS[hs.bangs.k] || BANGS.spiky)(o, H, hs, G, rnd, C);
    for (var i = 0; i < hs.extras.length; i++) {
      var ex = typeof hs.extras[i] === 'string' ? { k: hs.extras[i] } : hs.extras[i];
      if (HEXTRA[ex.k]) HEXTRA[ex.k](o, H, hs, G, rnd, C, ex);
    }
    return o;
  }
  function itemPath(g, it) { if (it.L) lockPath(g, it.L); else it.f(g); }
  // 绘制一层头发（后发 / 前发）
  function hairLayer(C, H, hp, hd, which) {
    var items = hd[which], hs = hd.hs, G = hd.G;
    if (!items || !items.length) return;
    var g = lbegin(C), u = H.u * C.lw, r = H.r, cx = H.cx, i, it, back = which === 'back';
    var lw = 1.25 * u, ow = 2.4 * u;
    var buzz = hs.cap === 'buzz';
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (it.tie) continue;
      var col = it.tone === 1 ? hp.m : it.tone === 2 ? hp.s : hp.b;
      if (it.cap && buzz) col = K.mix(hp.b, H.skin || '#e0c0a0', 0.2);
      itemPath(g, it); fillC(g, col);
      var shine = !back && !buzz && hs.cap !== 'thin' && !it.braid && !it.thin && !it.noShine;
      if (it.cap && !back && !buzz) capClumps(C, g, H, hp, hd, it);
      if (it.sliver) {
        g.save(); itemPath(g, it); g.clip(); fillC(g, K.mix(col, hp.s, 0.85));
        g.translate(it.sliver[0], it.sliver[1]); itemPath(g, it); fillC(g, col); g.restore();
        if (it.sh) { g.save(); itemPath(g, it); g.clip(); it.sh(g, hp); g.restore(); }
        if (shine && it.L) lockShine(C, g, H, hp, hd, it);
        itemPath(g, it); strokeW(g, hp.ln, lw);
      } else if (it.L && !it.thin) {
        // 发束的冷色阴影边（远离主光的右下侧）
        g.save(); lockPath(g, it.L); g.clip();
        g.fillStyle = it.braid ? hp.s : K.mix(col, hp.s, 0.85); g.fill();
        g.translate(-it.L.w * (it.braid ? 0.22 : 0.2), -r * 0.012);
        lockPath(g, it.L); fillC(g, col);
        g.restore();
        if (shine) lockShine(C, g, H, hp, hd, it);
        lockEdges(g, it.L, it.side || it.braid ? 0.05 : 0.32); strokeW(g, hp.ln, lw * (it.braid ? 0.9 : 1));
      } else if (it.L) {
        lockEdges(g, it.L, 0.1); strokeW(g, hp.ln, lw * 0.8);
      } else if (!it.cap || C.m > 0) {
        if (it.e) it.e(g); else itemPath(g, it);
        strokeW(g, hp.ln, lw * (it.cap ? 0.8 : 1));
      }
      if (it.bun && it.wrap && C.m >= 1) {
        var w = it.wrap;
        g.save(); itemPath(g, it); g.clip();
        for (var k = 0; k < K.byModel(C.q, 2, 3, 5); k++) {
          g.beginPath(); g.arc(w[0] - w[2] * 0.3 + k * w[2] * 0.15, w[1] + w[2] * 0.6, w[2] * (0.75 + k * 0.12), -PI * 0.95, -PI * 0.25);
          strokeW(g, A(hp.s, 0.8), lw);
        }
        g.restore();
      }
    }
    var top = G ? G.top : H.T, bot = Math.max(hd.backY || 0, H.C + r * 1.2);
    // ---- 形状内光影（source-atop：只落在头发上） ----
    g.globalCompositeOperation = 'source-atop';
    if (C.t > 0 && !buzz) {
      g.beginPath(); g.rect(0, 0, C.W, C.H);
      K.fillTex(g, C.q, 'metal', { c1: hp.s, c2: hp.h, dir: 'v', seed: 7 }, 96, 0, 0, back ? 0.1 : 0.14);
    }
    if (buzz) {
      var rb = K.rng('buzz'), nd = K.byModel(C.q, 120, 260, 480);
      g.fillStyle = A(hp.s, 0.55);
      for (i = 0; i < nd; i++) { var bxx = cx + (rb() * 2 - 1) * G.rx, byy = top + rb() * G.ry * 1.3; g.fillRect(bxx, byy, 1.4 * u, 1.4 * u); }
    }
    // 远离主光一侧的大块阴影
    if (C.l >= 1) {
      g.fillStyle = K.rad(g, cx + H.fw * 1.5, H.eyeY, r * 0.1, r * 0.9, [[0, A(hp.s, 0.7)], [0.55, A(hp.s, 0.35)], [1, A(hp.s, 0)]]);
      g.fillRect(cx - r, top - r * 0.2, r * 2.2, bot - top + r * 0.4);
      g.fillStyle = K.lin(g, 0, top, 0, H.C + r * 0.6, [[0, A(hp.h, back ? 0 : 0.12)], [0.45, A(hp.b, 0)], [1, A(hp.d, back ? 0.45 : 0.3)]]);
      g.fillRect(cx - r * 1.6, top - r * 0.1, r * 3.2, bot - top + r * 0.6);
    } else {
      ell(g, cx + H.fw * 1.55, H.eyeY + r * 0.1, H.fw * 0.75, r * 0.85); fillC(g, A(hp.s, 0.55));
    }
    if (back) {
      // 内侧（脸颊两侧可见的后发）更暗
      g.save(); g.translate(cx, H.eyeY + r * 0.2); g.scale(1, 0.62);
      g.fillStyle = K.rad(g, 0, 0, 0, H.fw * 1.5, [[0, A(hp.d, C.l >= 1 ? 0.45 : 0.3)], [0.7, A(hp.d, C.l >= 1 ? 0.25 : 0.2)], [1, A(hp.d, 0)]]);
      g.fillRect(-H.fw * 1.6, -H.fw * 1.6, H.fw * 3.2, H.fw * 3.2); g.restore();
    }
    if (back && C.l >= 1) {
      g.save(); g.globalAlpha = 0.22; g.strokeStyle = hp.h; g.lineWidth = r * 0.012;
      for (i = -3; i <= 3; i++) { if (!i) continue; var bx0 = cx + i * H.fw * 0.42; g.beginPath(); g.moveTo(bx0, H.C - r * 0.1); g.quadraticCurveTo(bx0 + i * r * 0.03, H.C + r * 0.08, bx0 + i * r * 0.05, H.C + r * 0.25); g.stroke(); }
      g.restore();
    }
    // 发丝
    if (C.m >= 1) hairStrands(C, g, H, hp, hd, which);
    // 灰发丝
    if (hs.grey && C.m >= 0) greyStrands(C, g, H, hp, hd, which);
    if (hs.cap === 'thin') for (i = 0; i < items.length; i++) if (items[i].cap) thinCrown(C, g, H, hp, G, items[i], hp.b, u, r, cx);
    // 轮廓光
    if (C.l >= 2) {
      g.save();
      g.strokeStyle = K.lin(g, cx - r * 0.7, 0, cx + r * 0.7, 0, [[0, A('#fff6e8', 0.55)], [0.35, A('#fff6e8', 0)], [0.7, A('#8aa0ff', 0)], [1, A('#8aa0ff', 0.3)]]);
      g.lineWidth = 5 * u;
      for (i = 0; i < items.length; i++) { it = items[i]; if (it.cap || it.tail || (it.mass && back)) { itemPath(g, it); g.stroke(); } else if (it.tuft) { lockEdges(g, it.L, 0.3); g.stroke(); } }
      g.restore();
    }
    // 外轮廓
    g.globalCompositeOperation = 'destination-over';
    for (i = 0; i < items.length; i++) { it = items[i]; if (it.tie) continue; itemPath(g, it); strokeW(g, hp.ln, ow * 2); }
    g.globalCompositeOperation = 'source-over';
    // 发绳 / 发圈
    for (i = 0; i < items.length; i++) {
      it = items[i]; if (!it.tie) continue;
      var tp = pal(it.c || '#c03040');
      piece(C, g, { f: it.f, fill: tp.b, sh: function (g2) { g2.fillStyle = K.lin(g2, cx - r, 0, cx + r, 0, [A(tp.l, 0.6), A(tp.s, 0.6)]); g2.fillRect(0, 0, C.W, C.H); }, ln: tp.ln, lw: lw, ow: ow * 0.7 });
    }
    lend(C);
  }
  function thinCrown(C, g, H, hp, G, it, col, u, r, cx) {
      {
        g.save(); itemPath(g, it); g.clip();
        var sk = H.sp || skinPal(H.skin), cy0 = G.top + G.ry * 0.45;
        g.save(); g.translate(cx, cy0); g.scale(1, 0.8);
        g.fillStyle = K.rad(g, 0, 0, 0, G.rx * 0.95, [[0, sk.b], [0.62, sk.b], [0.8, K.mix(sk.b, col, 0.5)], [1, A(col, 0)]]);
        g.fillRect(-G.rx * 1.2, -G.rx * 1.2, G.rx * 2.4, G.rx * 2.4); g.restore();
        if (C.l >= 1) { ell(g, cx - G.rx * 0.25, G.top + G.ry * 0.25, G.rx * 0.2, G.ry * 0.1, -0.3); fillC(g, A('#ffffff', 0.35)); }
        if (C.m >= 1) { g.strokeStyle = A(col, 0.6); g.lineWidth = 1 * u; for (var tk = 0; tk < 7; tk++) { var tx = cx + (tk - 3) * G.rx * 0.2; g.beginPath(); g.moveTo(tx, G.top + G.ry * 0.25); g.quadraticCurveTo(tx + (tk - 3) * r * 0.02, G.top + G.ry * 0.4, tx + (tk - 3) * r * 0.04, G.top + G.ry * 0.5); g.stroke(); } }
        g.restore();
      }
  }
  // 头顶的发束分组：从分缝附近散开、顺着头型弯到发际线的分界（月牙形阴影），并按发束分段画天使环高光
  function ringAt(H, hd, x) {
    var G = hd.G, rx = G.rx * 0.96, sx = clamp((x - H.cx) / rx, -1, 1);
    return G.top + G.ry * (hd.hs.ringY || 0.34) + H.r * 0.13 * (1 - Math.sqrt(1 - sx * sx));
  }
  function capClumps(C, g, H, hp, hd, it) {
    var G = hd.G, hs = hd.hs, r = H.r, cx = H.cx, u = H.u * C.lw, i, j;
    var rnd = K.rng('clump:' + (hs.style || '') + ':' + (hd.id || ''));
    var n = K.byModel(C.q, 4, 7, 10), px = G.partX, rx = G.rx * 0.96;
    g.save(); itemPath(g, it); g.clip();
    // 体积：头顶受光、四周渐暗
    if (C.l >= 1) {
      g.fillStyle = K.rad(g, cx - G.rx * 0.2, G.top + G.ry * 0.4, r * 0.02, G.rx * 1.35, [[0, A(hp.h, 0.12)], [0.55, A(hp.b, 0)], [1, A(hp.s, 0.2)]]);
      g.fillRect(cx - G.rx * 1.3, G.top - r * 0.05, G.rx * 2.6, G.ry * 1.6);
    }
    // 柔和的分缝（无硬线）
    g.fillStyle = K.rad(g, px, G.top + G.ry * 0.08, 0, r * 0.1, [[0, A(hp.d, 0.42)], [0.6, A(hp.d, 0.15)], [1, A(hp.d, 0)]]);
    g.fillRect(px - r * 0.12, G.top - r * 0.06, r * 0.24, r * 0.26);
    var bx = [];
    for (i = 0; i < n; i++) {
      var ph = lerp(-1.32, 1.32, (i + 0.5) / n) + rnd.jit(0, 0.07), sx = Math.sin(ph), ax = Math.abs(sx);
      var x0 = px + sx * G.rx * (0.12 + rnd() * 0.12), y0 = G.top + G.ry * (0.05 + ax * 0.12 + rnd() * 0.04);
      var x1 = cx + sx * G.rx * 0.99, y1 = lerp(G.hl + r * 0.03, G.sideY + r * 0.02, Math.pow(ax, 1.4));
      var qx = cx + sx * G.rx * (0.8 + 0.1 * ax), qy = lerp(y0, y1, 0.28);
      var w = r * (0.007 + rnd() * 0.007);
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(qx + sx * w * 1.5, qy, x1, y1); g.quadraticCurveTo(qx - sx * w * 0.4, qy, x0, y0); g.closePath();
      fillC(g, A(hp.s, C.l >= 1 ? 0.62 : 0.5));
      if (C.l >= 1 && sx < 0.35) {
        g.beginPath(); g.moveTo(x0 - r * 0.01, y0 + r * 0.01); g.quadraticCurveTo(qx - sx * r * 0.02 - r * 0.012, qy, x1 - sx * r * 0.02 - r * 0.012, y1 - r * 0.02);
        strokeW(g, A(hp.h, 0.16), r * 0.012);
      }
      var hit = x1;
      for (j = 1; j <= 24; j++) { var t = j / 24, m = 1 - t, yy = m * m * y0 + 2 * m * t * qy + t * t * y1, xx = m * m * x0 + 2 * m * t * qx + t * t * x1; if (yy >= ringAt(H, hd, xx)) { hit = xx; break; } }
      bx.push(hit);
    }
    if (hs.cap !== 'thin' && !hs.noRing) {
      bx.sort(function (p, q) { return p - q; });
      var edges = [cx - rx].concat(bx).concat([cx + rx]);
      var a0 = (C.l >= 2 ? 0.62 : C.l >= 1 ? 0.5 : 0.4) * (hs.shine || 1);
      for (i = 0; i < edges.length - 1; i++) {
        var xa = edges[i] + r * 0.008, xb = edges[i + 1] - r * 0.008;
        if (xb - xa < r * 0.03) continue;
        var lit = clamp(1 - ((xa + xb) / 2 - (cx - rx)) / (2 * rx) * 0.82, 0.12, 1), yo = rnd.jit(0, r * 0.012), w0 = r * (0.015 + 0.012 * lit);
        var m2 = Math.max(1, Math.round((xb - xa) / (r * 0.045)));
        g.beginPath();
        for (j = 0; j <= 6; j++) { var xt = lerp(xa, xb, j / 6); var yt = ringAt(H, hd, xt) + yo - w0 * (0.6 + 0.6 * Math.sin(j / 6 * PI)); if (j) g.lineTo(xt, yt); else g.moveTo(xt, yt); }
        for (j = m2; j >= 0; j--) {
          var xz = lerp(xa, xb, j / m2); g.lineTo(xz, ringAt(H, hd, xz) + yo + w0 * 0.2);
          if (j > 0) { var xm = lerp(xa, xb, (j - 0.5) / m2); g.lineTo(xm + (xm - cx) * 0.02, ringAt(H, hd, xm) + yo + r * (0.025 + rnd() * 0.05) * (0.5 + lit * 0.6)); }
        }
        g.closePath(); fillC(g, A(hp.h, a0 * lit));
        if (C.l >= 2 && lit > 0.55) {
          var xc = lerp(xa, xb, 0.35), yc = ringAt(H, hd, xc) + yo;
          g.beginPath(); g.moveTo(xc, yc - w0); g.lineTo(xc + (xc - cx) * 0.03, yc + r * 0.03); strokeW(g, A('#ffffff', 0.45 * lit), 1.4 * u);
        }
      }
    }
    g.restore();
  }
  // 发束上的高光：在天使环高度与发束相交处画一条顺着发束方向的光（裁剪在发束内）
  function lockShine(C, g, H, hp, hd, it) {
    var L = it.L, G = hd.G, hs = hd.hs, r = H.r, cx = H.cx, t, p, hit = -1;
    if (!G || hs.noRing) return;
    for (t = 0.02; t <= 0.8; t += 0.06) { p = lockAt(L, t, 0); if (p[1] >= ringAt(H, hd, p[0])) { hit = t; break; } }
    if (hit < 0) return;
    if (hit <= 0.02) hit = it.side ? 0.1 : 0.15;
    p = lockAt(L, hit, 0);
    var rx = G.rx * 0.96, lit = clamp(1 - (p[0] - (cx - rx)) / (2 * rx) * 0.82, 0.12, 1);
    var a0 = (C.l >= 2 ? 0.6 : C.l >= 1 ? 0.48 : 0.36) * (hs.shine || 1) * lit;
    var t0 = Math.max(0.01, hit - 0.06), t1 = Math.min(0.95, hit + 0.13 + 0.09 * lit), tm = (t0 + t1) / 2;
    var a = lockAt(L, t0, 0.1), c = lockAt(L, t1, 0.05), wa = lockAt(L, tm, 1.5), wb = lockAt(L, tm, -1.3);
    g.save(); lockPath(g, L); g.clip();
    g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(wa[0], wa[1], c[0], c[1]); g.quadraticCurveTo(wb[0], wb[1], a[0], a[1]); g.closePath();
    fillC(g, A(hp.h, a0));
    if (C.l >= 2 && lit > 0.5) {
      var a2 = lockAt(L, t0 + 0.02, 0.3), c2 = lockAt(L, tm + 0.02, 0.3);
      g.beginPath(); g.moveTo(a2[0], a2[1]); g.lineTo(c2[0], c2[1]); strokeW(g, A('#ffffff', 0.4 * lit), 1.3 * H.u * C.lw);
    }
    g.restore();
  }
  function hairStrands(C, g, H, hp, hd, which) {
    var items = hd[which], u = H.u * C.lw, i, j, it, r = H.r;
    var per = C.m >= 2 ? 3 : 1, rnd = K.rng('strand' + which);
    g.lineWidth = 0.9 * u;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (!it.L || it.braid || it.thin) continue;
      for (j = 0; j < per; j++) {
        var uu = lerp(-0.55, 0.6, (j + 0.5) / per) + rnd.jit(0, 0.12), t0 = 0.2 + rnd() * 0.2, t1 = 0.72 + rnd() * 0.22;
        var a = lockAt(it.L, t0, uu), b = lockAt(it.L, (t0 + t1) / 2, uu * 0.8), c = lockAt(it.L, t1, uu * 0.6);
        g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], c[0], c[1]);
        g.strokeStyle = A(hp.s, 0.6); g.stroke();
      }
      if (C.l >= 2 && C.m >= 2) {
        var a2 = lockAt(it.L, 0.25, -0.5), b2 = lockAt(it.L, 0.5, -0.45);
        g.beginPath(); g.moveTo(a2[0], a2[1]); g.lineTo(b2[0], b2[1]); g.strokeStyle = A(hp.h, 0.45); g.stroke();
      }
    }
    for (i = 0; i < items.length; i++) {
      it = items[i]; if (!it.str) continue;
      for (j = 0; j < it.str.length; j++) { var q = it.str[j]; g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(q[2], q[3], q[4], q[5]); g.strokeStyle = A(j % 3 === 2 && C.l >= 2 ? hp.h : hp.s, j % 3 === 2 ? 0.22 : 0.55); g.stroke(); }
    }
    // 发盖与后发：从头顶放射的发丝
    var G = hd.G; if (!G) return;
    if (which === 'front') {
      // 发盖上按发束分组的细发丝（起点分散，不汇聚于一点）
      var cap = null; for (i = 0; i < items.length; i++) if (items[i].cap) cap = items[i];
      if (!cap || hd.hs.cap === 'buzz' || hd.hs.cap === 'thin') return;
      var rs = K.rng('capstr' + (hd.hs.style || '')), m = K.byModel(C.q, 0, 10, 22);
      g.save(); itemPath(g, cap); g.clip();
      for (i = 0; i < m; i++) {
        var ph = lerp(-1.25, 1.25, rs()), sx = Math.sin(ph), ax = Math.abs(sx);
        var xs = G.partX + sx * G.rx * (0.15 + rs() * 0.25), ys = G.top + G.ry * (0.1 + ax * 0.15 + rs() * 0.1);
        var xe = H.cx + sx * G.rx * (0.92 + rs() * 0.06), ye = lerp(G.hl, G.sideY, Math.pow(ax, 1.4)) - rs() * r * 0.05;
        g.beginPath(); g.moveTo(xs, ys); g.quadraticCurveTo(H.cx + sx * G.rx * 0.82, lerp(ys, ye, 0.3), xe, ye);
        g.strokeStyle = A(i % 4 === 3 && C.l >= 2 ? hp.h : hp.s, i % 4 === 3 ? 0.25 : 0.4); g.stroke();
      }
      g.restore();
      return;
    }
    var n = K.byModel(C.q, 0, 6, 12);
    for (i = 0; i < n; i++) {
      var t = (i + 0.5) / n, x0 = H.cx + (t - 0.5) * G.rx * 0.6, y0 = G.top + r * 0.02;
      var x1, y1;
      if (which === 'front') { x1 = H.cx + (t - 0.5) * G.rx * 2.1; y1 = G.top + G.ry * (0.45 + Math.abs(t - 0.5) * 0.7); }
      else { x1 = H.cx + (t - 0.5) * G.rx * 2.6; y1 = (hd.backY || H.C) - r * 0.1; }
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(lerp(x0, x1, 0.2) + (t - 0.5) * r * 0.5, lerp(y0, y1, 0.5), x1, y1);
      g.strokeStyle = A(hp.s, 0.32); g.stroke();
    }
  }
  function greyStrands(C, g, H, hp, hd, which) {
    var hs = hd.hs, G = hd.G, r = H.r, u = H.u * C.lw, n = Math.round(K.byModel(C.q, 6, 12, 22) * hs.grey), i, rnd = K.rng('grey' + which);
    var gc = hs.greyC || '#d8d8dc';
    g.lineWidth = 1.2 * u;
    for (i = 0; i < n; i++) {
      var t = rnd(), side = t < 0.5 ? -1 : 1, x0 = H.cx + side * G.rx * (0.3 + rnd() * 0.6), y0 = G.top + G.ry * (0.2 + rnd() * 0.3);
      var x1 = x0 + side * r * (0.05 + rnd() * 0.08), y1 = y0 + r * (0.12 + rnd() * 0.18);
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + side * r * 0.06, (y0 + y1) / 2, x1, y1);
      g.strokeStyle = A(gc, 0.55 + rnd() * 0.3); g.stroke();
    }
  }
  // 头发投在脸上的阴影
  function hairCast(C, g, H, sp, hd) {
    var it, i, r = H.r;
    var dx = r * 0.016, dy = r * 0.05;
    var cols = C.l >= 2 ? [[dx * 1.3, dy * 1.22, sp.warm, 0.32], [dx, dy, sp.s, 1]] : [[dx, dy, sp.s, 1]];
    for (var k = 0; k < cols.length; k++) {
      g.save(); g.translate(cols[k][0], cols[k][1]); g.globalAlpha = cols[k][3];
      g.fillStyle = cols[k][2];
      for (i = 0; i < hd.front.length; i++) { it = hd.front[i]; if (it.tie || it.braid || it.tail) continue; itemPath(g, it); g.fill(); }
      g.restore();
    }
  }

  /* ====================== 眼睛 ====================== */
  // w/h 尺寸倍率；tilt 外眼角上挑；open 常态睁眼度；iris 虹膜大小；irisH 虹膜高宽比；lash 上睫毛粗细；flick 外眼角睫毛延伸；
  // low 下睫毛；crease 双眼皮；droop 外眼角下垂；bags 眼袋；dull 失神（少高光）；slit 竖瞳；upFlat 上眼睑平直度
  EYE.round = { w: 1, h: 1, tilt: 0.02, iris: 1, irisH: 1.18, lash: 1, flick: 0.8, low: 1, crease: 1 };
  EYE.sharp = { w: 1.04, h: 0.8, tilt: 0.075, iris: 0.92, lash: 1.12, flick: 1, low: 0.7, crease: 0.6, upFlat: 0.3 };
  EYE.narrow = { w: 1, h: 0.6, tilt: 0.03, iris: 0.82, lash: 1.05, flick: 0.4, low: 0.4, crease: 0.3, bags: 0.6, upFlat: 0.4 };
  EYE.lazy = { w: 1, h: 0.84, tilt: -0.02, open: 0.7, iris: 0.96, lash: 1, flick: 0.6, low: 0.6, crease: 1 };
  EYE.big_calm = { w: 1.04, h: 1.06, tilt: 0, open: 0.84, iris: 1.08, irisH: 1.2, dull: 0.7, lash: 1, flick: 0.7, low: 1, crease: 1 };
  EYE.cold = { w: 1, h: 0.76, tilt: 0.07, iris: 0.88, lash: 1.05, flick: 1, low: 0.8, crease: 0.8, upFlat: 0.2 };
  EYE.stern = { w: 1, h: 0.6, tilt: 0.0, iris: 0.8, lash: 1.15, flick: 0.3, low: 0.5, crease: 0.4, bags: 0.6, upFlat: 0.5 };
  EYE.half = { w: 1, h: 0.82, tilt: 0.0, open: 0.64, iris: 0.96, lash: 1, flick: 0.6, low: 0.6, crease: 1 };
  EYE.fox = { w: 1, h: 0.7, tilt: 0.02, open: 0.5, iris: 0.8, lash: 1, flick: 0.5, low: 0.4, crease: 0.4 };
  EYE.cat = { w: 1.03, h: 0.88, tilt: 0.12, iris: 0.92, slit: 1, lash: 1.15, flick: 1.4, low: 0.8, crease: 1, upFlat: 0.1 };
  EYE.small = { w: 0.86, h: 0.7, tilt: 0.0, iris: 0.82, lash: 0.9, flick: 0.3, low: 0.5, crease: 0.3 };
  EYE.jolly = { w: 0.88, h: 0.62, tilt: -0.02, iris: 0.8, lash: 1, flick: 0.2, low: 0.4, crease: 0.4 };
  EYE.dreamy = { w: 1.02, h: 1.0, tilt: -0.04, open: 0.8, iris: 1.05, lash: 1, flick: 0.6, low: 1, crease: 1, droop: 0.18 };
  EYE.proud = { w: 1, h: 0.92, tilt: 0.1, open: 0.9, iris: 0.95, lash: 1.12, flick: 1.3, low: 0.9, crease: 1, upFlat: 0.15 };
  EYE.kind = { w: 0.92, h: 0.62, tilt: -0.05, open: 0.88, iris: 0.82, lash: 0.9, flick: 0.2, low: 0.4, crease: 0.4, bags: 0.8 };
  EYE.gentle = { w: 1, h: 1, tilt: -0.03, iris: 1.02, lash: 1, flick: 0.7, low: 1, crease: 1, droop: 0.1 };
  EYE.tired = { w: 0.96, h: 0.68, tilt: -0.04, open: 0.84, iris: 0.86, lash: 0.95, flick: 0.2, low: 0.6, crease: 0.8, bags: 1 };
  EYE.big = { w: 1.08, h: 1.1, tilt: 0, iris: 1.06, irisH: 1.16, lash: 0.95, flick: 0.4, low: 0.8, crease: 0.4 };
  EYE.squint = { w: 0.86, h: 0.5, open: 0.75, iris: 0.72, lash: 1, flick: 0, low: 0.3, crease: 0.3, bags: 1 };
  EYE.mask = { none: 1 };
  // 兼容旧 visual 名称
  EYE.glasses_cold = EYE.cold; EYE.half_lidded = EYE.half; EYE.smiling_narrow = EYE.fox; EYE.glasses_round = EYE.small;
  EYE.old_kind = EYE.kind; EYE.gentle_tired = EYE.tired; EYE.tired_kind = EYE.tired; EYE.big_curious = EYE.big; EYE.big_round = EYE.big;

  function eyeGeom(H, s, E, X) {
    var W = H.ew * (E.w || 1), Hh = H.eh * (E.h || 1);
    var open = (E.open === undefined ? 1 : E.open) * (X.open === undefined ? 1 : X.open);
    if (open > 1) open = 1 + (open - 1) * (E.open === undefined ? 1 : 1.3);
    var ex = H.cx + s * H.ex, ey = H.eyeY;
    var tilt = (E.tilt || 0) * W, droop = (E.droop || 0) * Hh;
    var G = { s: s, ex: ex, ey: ey, W: W, Hh: Hh, open: open };
    G.ix = ex - s * W * 0.5; G.iy = ey + Hh * 0.1;
    G.ox = ex + s * W * 0.52; G.oy = ey - tilt - Hh * 0.04 + droop * 0.6 + (X.outDrop || 0) * Hh * 0.35;
    var up = Hh * 0.6 * open / 0.75, fl = E.upFlat || 0;
    G.u1x = ex - s * W * (0.28 - fl * 0.05); G.u1y = ey - up * (1.0 - fl * 0.12) + (X.inDrop || 0) * Hh * 1.1;
    G.u2x = ex + s * W * (0.26 + fl * 0.08); G.u2y = ey - up * (0.96 + fl * 0.02) + (X.outDrop || 0) * Hh * 0.7 - tilt * 0.45 + droop * 0.3;
    var lo = Hh * 0.4 * Math.min(1.15, 0.55 + open * 0.45) * (1 - (X.lowUp || 0)) / 0.75;
    G.l1x = ex + s * W * 0.28; G.l1y = ey + lo * 0.92;
    G.l2x = ex - s * W * 0.22; G.l2y = ey + lo * 0.95;
    return G;
  }
  function scleraPath(g, G) {
    g.beginPath(); g.moveTo(G.ix, G.iy);
    g.bezierCurveTo(G.u1x, G.u1y, G.u2x, G.u2y, G.ox, G.oy);
    g.bezierCurveTo(G.l1x, G.l1y, G.l2x, G.l2y, G.ix, G.iy);
    g.closePath();
  }
  function upperAt(G, t) { return [bz(G.ix, G.u1x, G.u2x, G.ox, t), bz(G.iy, G.u1y, G.u2y, G.oy, t), bzd(G.ix, G.u1x, G.u2x, G.ox, t), bzd(G.iy, G.u1y, G.u2y, G.oy, t)]; }
  function lowerAt(G, t) { return [bz(G.ox, G.l1x, G.l2x, G.ix, t), bz(G.oy, G.l1y, G.l2y, G.iy, t)]; }

  function drawEye(C, g, H, s, E, X, ep, sp, lashC) {
    var u = H.u * C.lw, G = eyeGeom(H, s, E, X), W = G.W, Hh = G.Hh, i;
    var mode = X.mode || null;
    if (mode === 'happy' || mode === 'closed') { closedEye(C, g, H, G, E, X, lashC, sp, mode); return; }
    // --- 眼白 ---
    scleraPath(g, G);
    g.fillStyle = C.l >= 1 ? K.lin(g, 0, G.ey - Hh * 0.6, 0, G.ey + Hh * 0.5, ['#dfe1ee', '#fbfbff']) : '#f6f6fa';
    g.fill();
    g.save(); scleraPath(g, G); g.clip();
    // --- 虹膜 ---
    var look = X.look || [0, 0], shake = X.shake ? 1 : 0;
    var yk = clamp((26 - (H.age || 22)) / 8, 0, 1);
    var irx = W * 0.335 * (E.iris || 1) * (X.iris || 1) * (1 + 0.1 * yk), iry = Math.min(irx * (E.irisH || 1.2), Hh * 0.62 * (E.irisH ? 1.1 : 1));
    if (X.iris && X.iris < 0.75) iry = irx * 1.15;
    var icx = G.ex + s * W * 0.02 + look[0] * W * 0.2, icy = G.ey + Hh * 0.06 + look[1] * Hh * 0.18;
    var dull = (E.dull || 0) + (X.dull || 0);
    var ib = ep.b, idk = ep.d;
    if (dull > 0.9) { ib = K.mix(ep.b, '#303040', 0.35); idk = K.mix(ep.d, '#000', 0.3); }
    ell(g, icx, icy, irx, iry);
    if (C.l >= 1) g.fillStyle = K.lin(g, 0, icy - iry, 0, icy + iry, [[0, idk], [0.45, ib], [1, K.mix(ep.l, ib, dull > 0.9 ? 0.6 : 0.15)]]);
    else g.fillStyle = ib;
    g.fill();
    if (C.l === 0) { g.save(); ell(g, icx, icy, irx, iry); g.clip(); g.fillStyle = idk; g.fillRect(icx - irx, icy - iry, irx * 2, iry * 0.85); g.restore(); }
    // 瞳孔
    var ps = (X.pupil || 1) * (E.pupil || 1);
    if (E.slit) ell(g, icx, icy - iry * 0.03, irx * 0.17 * ps, iry * 0.62 * ps);
    else ell(g, icx, icy - iry * 0.04, irx * 0.44 * ps, iry * 0.46 * ps);
    fillC(g, ep.pu);
    // 虹膜放射纹
    if (C.m >= 2 && irx > 6 && C.l >= 1) {
      g.save(); ell(g, icx, icy, irx * 0.94, iry * 0.94); g.clip();
      g.strokeStyle = A(ep.l, 0.22); g.lineWidth = 0.8 * u;
      for (i = 0; i < 14; i++) {
        var an = i / 14 * PI * 2 + 0.2, c0 = Math.cos(an), s0 = Math.sin(an);
        g.beginPath(); g.moveTo(icx + c0 * irx * 0.5, icy + s0 * iry * 0.5); g.lineTo(icx + c0 * irx * 0.92, icy + s0 * iry * 0.92); g.stroke();
      }
      g.restore();
    }
    // 下半虹膜的透光
    if (C.l >= 1 && dull < 0.9) {
      g.save(); ell(g, icx, icy, irx, iry); g.clip();
      g.fillStyle = K.rad(g, icx, icy + iry * 0.75, 0, irx * 0.95, [[0, A(ep.l, 0.85)], [0.6, A(ep.l, 0.35)], [1, A(ep.l, 0)]]);
      g.fillRect(icx - irx, icy - iry, irx * 2, iry * 2);
      g.restore();
    }
    // 虹膜外圈
    ell(g, icx, icy, irx, iry); strokeW(g, ep.ring, 1.3 * u);
    // 上眼睑投下的阴影
    var sh = Hh * 0.22 * Math.min(1, G.open + 0.2);
    g.beginPath(); g.moveTo(G.ix - s * W * 0.1, G.iy - sh * 0.2);
    g.bezierCurveTo(G.u1x, G.u1y, G.u2x, G.u2y, G.ox + s * W * 0.1, G.oy);
    g.lineTo(G.ox + s * W * 0.1, G.oy + sh);
    g.bezierCurveTo(G.u2x, G.u2y + sh * 1.25, G.u1x, G.u1y + sh * 1.25, G.ix - s * W * 0.1, G.iy + sh * 0.4);
    g.closePath();
    fillC(g, A(K.mix(ep.d, '#203060', 0.35), C.l >= 1 ? 0.45 : 0.35));
    // 高光
    var hl = X.hl === undefined ? 1 : X.hl;
    if (dull > 0.5 && hl > 0.5) hl = 0.55;
    if (hl > 0) {
      var hk = Math.min(1, hl + 0.3) * (1 + 0.12 * yk);
      if (C.l >= 2 && hl > 0.7) K.glow(g, icx - irx * 0.35, icy - iry * 0.35, irx * 0.7, '#ffffff', 0.2);
      ell(g, icx - irx * 0.36, icy - iry * 0.4, irx * 0.4 * hk, iry * 0.29 * hk, -0.4);
      fillC(g, A('#ffffff', Math.min(1, hl + 0.2)));
      if (hl > 0.5) { ell(g, icx + irx * 0.4, icy + iry * 0.36, irx * 0.16 * (1 + 0.15 * yk), irx * 0.14 * (1 + 0.15 * yk), 0.3); fillC(g, A('#ffffff', 0.95)); }
      if (C.m >= 1 && hl > 0.7) { circ(g, icx - irx * 0.12, icy + iry * 0.56, irx * 0.075); fillC(g, A('#ffffff', 0.75)); }
      if (C.m >= 2 && hl > 0.7 && yk > 0.3) { circ(g, icx + irx * 0.2, icy - iry * 0.55, irx * 0.05); fillC(g, A('#ffffff', 0.7)); }
    }
    if (X.tear) {
      // 含泪：下缘水光
      g.beginPath(); g.moveTo(G.ix, G.iy - Hh * 0.04);
      var lp = lowerAt(G, 0.5);
      g.quadraticCurveTo(lp[0], lp[1] - Hh * 0.2, G.ox, G.oy + Hh * 0.08);
      g.lineTo(G.ox, G.oy + Hh * 0.4); g.lineTo(G.ix, G.iy + Hh * 0.3); g.closePath();
      fillC(g, A('#cfe4ff', 0.45));
      for (i = 0; i < 3; i++) { circ(g, icx - irx * 0.5 + i * irx * 0.5, icy + iry * 0.62 + (i % 2) * Hh * 0.03, irx * 0.07); fillC(g, A('#ffffff', 0.85)); }
    }
    g.restore();
    if (X.tear && C.l >= 1) {
      // 涌出的泪：沿下眼睑的水光线 + 外眼角将落的泪珠
      g.beginPath();
      for (i = 0; i <= 8; i++) { var tq = lowerAt(G, lerp(0.05, 0.8, i / 8)); if (i) g.lineTo(tq[0], tq[1] - Hh * 0.02); else g.moveTo(tq[0], tq[1] - Hh * 0.02); }
      strokeW(g, A('#e8f4ff', 0.85), Hh * 0.08);
      var tb = lowerAt(G, 0.1), ts = Hh * 0.22;
      g.beginPath(); g.moveTo(tb[0], tb[1] - ts * 0.2); g.quadraticCurveTo(tb[0] + ts * 0.9, tb[1] + ts * 0.9, tb[0], tb[1] + ts * 1.5); g.quadraticCurveTo(tb[0] - ts * 0.9, tb[1] + ts * 0.9, tb[0], tb[1] - ts * 0.2); g.closePath();
      g.fillStyle = K.lin(g, 0, tb[1], 0, tb[1] + ts * 1.5, ['rgba(220,238,255,0.7)', 'rgba(170,205,250,0.9)']); g.fill();
      strokeW(g, 'rgba(90,130,200,0.7)', 1 * u);
      ell(g, tb[0] - ts * 0.25, tb[1] + ts * 0.7, ts * 0.18, ts * 0.3); fillC(g, '#ffffff');
    }
    // --- 上睫毛线 ---
    var N = C.m >= 1 ? 14 : 8, lt = H.r * 0.016 * (E.lash || 1) * (H.sex === 'm' ? 0.85 : 1) * (H.chibi ? 1.3 : 1) * (1 + 0.2 * yk);
    var top = [], bot = [], p, nx, ny, nl, th, t;
    for (i = 0; i < N; i++) {
      t = i / (N - 1); p = upperAt(G, t);
      nl = Math.sqrt(p[2] * p[2] + p[3] * p[3]) || 1; nx = p[3] / nl; ny = -p[2] / nl;
      if (ny > 0) { nx = -nx; ny = -ny; }
      th = lt * (0.3 + 0.95 * smooth01(t * 1.25)) * (t > 0.85 ? 1 + (t - 0.85) * 2 : 1);
      top.push(p[0] + nx * th, p[1] + ny * th); bot.push(p[0] - nx * th * 0.3, p[1] - ny * th * 0.3);
    }
    var fk = (E.flick === undefined ? 0.8 : E.flick) * (H.sex === 'm' ? 0.6 : 1);
    var fx = G.ox + s * W * 0.1 * fk, fy = G.oy - Hh * 0.08 * fk - lt * 0.5;
    var pts = top.slice(0);
    pts.push(fx, fy);
    for (i = N - 1; i >= 0; i--) pts.push(bot[i * 2], bot[i * 2 + 1]);
    smoothPoly(g, pts, true);
    fillC(g, lashC);
    // 睫毛尖
    if (C.m >= 2 && H.sex !== 'm' && fk > 0.3 && !H.chibi) {
      for (i = 0; i < 3; i++) {
        t = 0.68 + i * 0.12; p = upperAt(G, t);
        nl = Math.sqrt(p[2] * p[2] + p[3] * p[3]) || 1; nx = p[3] / nl; ny = -p[2] / nl; if (ny > 0) { nx = -nx; ny = -ny; }
        var bx = p[0] + nx * lt * 0.8, by = p[1] + ny * lt * 0.8, ln = W * (0.08 + i * 0.025) * fk;
        var dx = nx * 0.6 + s * 0.8, dy = ny * 0.6 - 0.2, dl = Math.sqrt(dx * dx + dy * dy);
        g.beginPath(); g.moveTo(bx - s * lt * 0.6, by + lt * 0.3); g.quadraticCurveTo(bx + dx / dl * ln * 0.5, by + dy / dl * ln * 0.5 - lt * 0.3, bx + dx / dl * ln, by + dy / dl * ln);
        g.lineTo(bx + s * lt * 0.5, by + lt * 0.4); g.closePath(); fillC(g, lashC);
      }
    }
    // 双眼皮
    if ((E.crease || 0) > 0.2 && C.m >= 1 && !H.chibi) {
      g.beginPath();
      for (i = 0; i <= 8; i++) {
        t = lerp(0.22, 0.92, i / 8); p = upperAt(G, t);
        var off = Hh * 0.2 + lt * 1.1;
        if (i) g.lineTo(p[0] + s * W * 0.02, p[1] - off); else g.moveTo(p[0] + s * W * 0.02, p[1] - off);
      }
      strokeW(g, A(sp.ln, 0.5 * E.crease), 1.1 * u);
    }
    // 下眼睑
    var lowA = (E.low === undefined ? 0.7 : E.low);
    g.beginPath();
    for (i = 0; i <= 8; i++) { var q = lowerAt(G, lerp(0.02, 0.62, i / 8)); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }
    strokeW(g, A(lashC, 0.35 + 0.35 * lowA), (H.chibi ? 1.3 : 1.15) * u);
    if (lowA > 0.6 && C.m >= 1 && !H.chibi) {
      var q0 = lowerAt(G, 0.04), q1 = lowerAt(G, 0.2);
      g.beginPath(); g.moveTo(q0[0], q0[1]); g.quadraticCurveTo(q1[0], q1[1] + lt * 0.4, q1[0] - s * W * 0.04, q1[1] + lt * 0.2);
      strokeW(g, A(lashC, 0.7), 1.6 * u);
    }
    // 眼袋 / 年龄纹
    var bags = Math.max(E.bags || 0, X.bags || 0, H.lines >= 2 ? 0.7 : 0);
    if (bags > 0.3 && C.m >= 1 && !H.chibi) {
      g.beginPath();
      for (i = 0; i <= 6; i++) { var q2 = lowerAt(G, lerp(0.1, 0.7, i / 6)); var yo = Hh * 0.22 + (i === 0 || i === 6 ? -Hh * 0.05 : 0); if (i) g.lineTo(q2[0], q2[1] + yo); else g.moveTo(q2[0], q2[1] + yo); }
      strokeW(g, A(sp.ln, 0.35 * bags), 1.1 * u);
    }
    if (H.lines >= 2 && C.m >= 1 && !H.chibi) {
      for (i = 0; i < 2; i++) {
        g.beginPath(); g.moveTo(G.ox + s * W * 0.12, G.oy + i * Hh * 0.18); g.lineTo(G.ox + s * W * 0.24, G.oy - Hh * 0.08 + i * Hh * 0.3);
        strokeW(g, A(sp.ln, 0.32), 1 * u);
      }
    }
  }
  function closedEye(C, g, H, G, E, X, lashC, sp, mode) {
    var u = H.u * C.lw, W = G.W, Hh = G.Hh, s = G.s, lt = H.r * 0.016 * (E.lash || 1) * (H.chibi ? 1.3 : 1);
    var ix = G.ix, ox = G.ox, ey = G.ey + Hh * 0.08, lift = mode === 'happy' ? -Hh * 0.55 : Hh * 0.35;
    g.beginPath();
    g.moveTo(ix, ey + Hh * 0.05);
    g.bezierCurveTo(lerp(ix, ox, 0.3), ey + lift, lerp(ix, ox, 0.7), ey + lift, ox, ey + (mode === 'happy' ? Hh * 0.08 : -Hh * 0.05));
    g.bezierCurveTo(lerp(ix, ox, 0.7), ey + lift + lt * 1.6, lerp(ix, ox, 0.3), ey + lift + lt * 1.6, ix, ey + Hh * 0.05 + lt * 0.3);
    g.closePath(); fillC(g, lashC);
    if (C.m >= 1 && H.sex !== 'm' && !H.chibi) {
      g.beginPath(); g.moveTo(ox - s * W * 0.04, ey + Hh * 0.04); g.lineTo(ox + s * W * 0.1, ey + Hh * (mode === 'happy' ? 0.16 : -0.1));
      strokeW(g, lashC, 1.6 * u);
    }
    void sp;
  }

  /* ====================== 眉毛 ====================== */
  BROW.normal = { t: 1, arch: 0.5, len: 1 };
  BROW.thin = { t: 0.7, arch: 0.6, len: 1 };
  BROW.thick = { t: 1.5, arch: 0.35, len: 1.05 };
  BROW.straight = { t: 1.25, arch: 0.15, len: 1.05 };
  BROW.sharp = { t: 1.1, arch: 0.7, len: 1.05, peak: 0.35 };
  BROW.soft = { t: 0.85, arch: 0.5, len: 0.9, inUp: 0.01 };
  BROW.bushy = { t: 1.9, arch: 0.3, len: 1.08, rough: 1 };
  BROW.short = { t: 1.1, arch: 0.3, len: 0.72 };
  function drawBrow(C, g, H, s, Bp, X, col, alpha) {
    var r = H.r, W = H.ew, ex = H.cx + s * H.ex;
    var bx = X || {}, asym = (bx.asym || 0) * (s < 0 ? -1 : 0.6);
    var by = H.browY + (bx.y || 0) * r + asym * r;
    var len = Bp.len || 1;
    var ix = ex - s * W * 0.5, iy = by + (bx.i || 0) * r - (Bp.inUp || 0) * r;
    var ox = ex + s * W * (0.62 * len), oy = by + W * 0.1 + (bx.o || 0) * r;
    var mx = ex + s * W * (Bp.peak === undefined ? 0.12 : Bp.peak), my = Math.min(iy, oy) - (Bp.arch || 0.5) * W * 0.16 + (bx.y || 0) * r * 0.1;
    var th = r * 0.02 * (Bp.t || 1) * (H.sex === 'm' ? 1.2 : 0.9) * (H.chibi ? 1.2 : 1);
    g.save(); if (alpha !== undefined) g.globalAlpha = alpha;
    g.beginPath();
    g.moveTo(ix, iy - th * 0.5);
    g.quadraticCurveTo(mx, my - th * 0.55, ox, oy);
    g.quadraticCurveTo(mx, my + th * 0.6, ix + s * th * 0.2, iy + th * 0.55);
    g.quadraticCurveTo(ix - s * th * 0.5, iy, ix, iy - th * 0.5);
    g.closePath();
    fillC(g, col);
    if (Bp.rough && C.m >= 1) {
      g.strokeStyle = col; g.lineWidth = 0.9 * H.u * C.lw;
      for (var i = 0; i < 6; i++) { var t = i / 5, x = lerp(ix, ox, t), y = lerp(iy, oy, t) - Math.sin(t * PI) * W * 0.08; g.beginPath(); g.moveTo(x, y + th * 0.4); g.lineTo(x + s * th * 0.8, y - th * 0.9); g.stroke(); }
    }
    g.restore();
  }

  /* ====================== 嘴 ====================== */
  function mouthW(H, cf) { return H.fw * (H.sex === 'm' ? 0.36 : 0.31) * ((cf.mouth && cf.mouth.w) || 1) * (H.child ? 0.9 : 1); }
  MOUTH.neutral = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 0.75, x = H.cx, y = H.mouthY;
    g.beginPath(); g.moveTo(x - w * 0.5, y); g.quadraticCurveTo(x, y + H.r * (H.sex === 'm' ? 0.003 : 0.008), x + w * 0.5, y - H.r * 0.002);
    strokeW(g, sp.ln, 1.5 * u);
    lowerLip(C, g, H, sp, w * 0.5);
  };
  function lowerLip(C, g, H, sp, w) {
    if (C.m < 1 || H.chibi) return;
    var u = H.u * C.lw, y = H.mouthY + H.r * 0.03;
    g.beginPath(); g.moveTo(H.cx - w * 0.35, y); g.quadraticCurveTo(H.cx, y + H.r * 0.006, H.cx + w * 0.35, y);
    strokeW(g, A(sp.ln, 0.25), 1.1 * u);
  }
  function openMouth(C, g, H, sp, cf, o) {
    // o: w, top (上缘弧度，负=上弯), depth (下缘深度), teethT, teethB, tongue, dy, skew
    var u = H.u * C.lw, w = mouthW(H, cf) * (o.w || 1), x = H.cx + (o.dx || 0), y = H.mouthY + (o.dy || 0), r = H.r;
    var d = r * (o.depth || 0.05), tc = r * (o.top || 0), sk = r * (o.skew || 0);
    var path = function () {
      g.beginPath();
      g.moveTo(x - w * 0.5, y - sk);
      g.quadraticCurveTo(x, y + tc, x + w * 0.5, y + sk);
      g.bezierCurveTo(x + w * 0.42, y + d * 0.9, x - w * 0.42, y + d * 0.9, x - w * 0.5, y - sk);
      g.closePath();
    };
    path(); fillC(g, sp.mouth);
    g.save(); path(); g.clip();
    if (o.tongue !== false) { ell(g, x + w * 0.05, y + d * 0.8, w * 0.32, d * 0.4); fillC(g, sp.tongue); }
    if (o.teethT && C.m >= 0) {
      g.beginPath(); g.moveTo(x - w * 0.5, y - sk - r * 0.004); g.quadraticCurveTo(x, y + tc - r * 0.004, x + w * 0.5, y + sk - r * 0.004);
      g.lineTo(x + w * 0.5, y + sk + d * o.teethT); g.quadraticCurveTo(x, y + tc + d * o.teethT * 1.1, x - w * 0.5, y - sk + d * o.teethT);
      g.closePath(); fillC(g, '#fbf8f4');
      if (cf._metalTooth) { rrect(g, x + w * 0.12, y + tc * 0.5 - r * 0.004, w * 0.12, d * o.teethT * 1.1, r * 0.003); fillC(g, C.l >= 1 ? K.lin(g, 0, y, 0, y + d * o.teethT, ['#f0f0f4', '#8a8a96']) : '#b8b8c4'); }
    }
    if (o.teethB) {
      g.beginPath(); g.moveTo(x - w * 0.5, y + d); g.quadraticCurveTo(x, y + d * (1 - o.teethB) * 0.9, x + w * 0.5, y + d); g.lineTo(x + w * 0.5, y + d * 1.2); g.lineTo(x - w * 0.5, y + d * 1.2); g.closePath();
      fillC(g, '#f4f0ec');
    }
    if (o.teethLines && C.m >= 1) {
      g.strokeStyle = A('#b0a0a0', 0.8); g.lineWidth = 0.9 * u;
      for (var i = 1; i < 6; i++) { var tx = x - w * 0.5 + w * i / 6; g.beginPath(); g.moveTo(tx, y - r * 0.01); g.lineTo(tx, y + d * 1.1); g.stroke(); }
      g.beginPath(); g.moveTo(x - w * 0.5, y + d * 0.5); g.lineTo(x + w * 0.5, y + d * 0.5); g.stroke();
    }
    g.restore();
    path(); strokeW(g, sp.ln, 1.4 * u);
    if (C.l >= 2 && !H.chibi) { g.beginPath(); g.moveTo(x - w * 0.15, y + d + r * 0.012); g.quadraticCurveTo(x, y + d + r * 0.016, x + w * 0.15, y + d + r * 0.012); strokeW(g, A(sp.hl, 0.5), 1.2 * u); }
  }
  MOUTH.smile = function (C, g, H, sp, cf) { openMouth(C, g, H, sp, cf, { w: 1, top: -0.004, depth: 0.05, teethT: 0.3, skew: 0.008 }); };
  MOUTH.smile_closed = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf), x = H.cx, y = H.mouthY;
    g.beginPath(); g.moveTo(x - w * 0.5, y - H.r * 0.01); g.quadraticCurveTo(x, y + H.r * 0.022, x + w * 0.5, y - H.r * 0.01);
    strokeW(g, sp.ln, 1.6 * u);
    lowerLip(C, g, H, sp, w * 0.5);
  };
  MOUTH.grin = function (C, g, H, sp, cf) { openMouth(C, g, H, sp, cf, { w: 1.25, top: -0.006, depth: 0.065, teethT: 0.35, skew: 0.012 }); };
  MOUTH.smirk = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 0.85, x = H.cx, y = H.mouthY;
    g.beginPath(); g.moveTo(x - w * 0.45, y + H.r * 0.003); g.quadraticCurveTo(x + w * 0.1, y + H.r * 0.01, x + w * 0.5, y - H.r * 0.016);
    strokeW(g, sp.ln, 1.5 * u);
  };
  MOUTH.sad = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 0.7, x = H.cx, y = H.mouthY + H.r * 0.008;
    g.beginPath(); g.moveTo(x - w * 0.5, y + H.r * 0.008); g.quadraticCurveTo(x, y - H.r * 0.012, x + w * 0.5, y + H.r * 0.008);
    strokeW(g, sp.ln, 1.5 * u);
    lowerLip(C, g, H, sp, w * 0.5);
  };
  MOUTH.frown = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 0.9, x = H.cx, y = H.mouthY + H.r * 0.006;
    g.beginPath(); g.moveTo(x - w * 0.5, y + H.r * 0.012); g.quadraticCurveTo(x - w * 0.1, y - H.r * 0.008, x + w * 0.5, y + H.r * 0.01);
    strokeW(g, sp.ln, 1.8 * u);
  };
  MOUTH.grit = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 1.22, x = H.cx, y = H.mouthY - H.r * 0.008, h = H.r * 0.05, r = H.r;
    var path = function () {
      g.beginPath(); g.moveTo(x - w * 0.5, y + h * 0.2);
      g.quadraticCurveTo(x, y - h * 0.25, x + w * 0.5, y + h * 0.2);
      g.quadraticCurveTo(x + w * 0.56, y + h * 0.65, x + w * 0.42, y + h * 1.05);
      g.quadraticCurveTo(x, y + h * 1.25, x - w * 0.42, y + h * 1.05);
      g.quadraticCurveTo(x - w * 0.56, y + h * 0.65, x - w * 0.5, y + h * 0.2);
      g.closePath();
    };
    path(); fillC(g, '#f8f4f0');
    g.save(); path(); g.clip();
    g.strokeStyle = A('#9a8888', 0.9); g.lineWidth = 1 * u;
    g.beginPath(); g.moveTo(x - w * 0.55, y + h * 0.58); g.quadraticCurveTo(x, y + h * 0.7, x + w * 0.55, y + h * 0.58); g.stroke();
    if (C.m >= 1) for (var i = 1; i < 6; i++) { var tx = x - w * 0.5 + w * i / 6; g.beginPath(); g.moveTo(tx, y - h * 0.2); g.lineTo(tx + (i - 3) * r * 0.002, y + h * 1.3); g.stroke(); }
    if (cf._metalTooth) { g.fillStyle = '#a8a8b4'; g.fillRect(x + w * 0.17, y - h * 0.2, w * 0.16, h * 0.78); }
    g.fillStyle = A(sp.mouth, 0.45); g.fillRect(x - w * 0.6, y + h * 0.52, w * 1.2, h * 0.14);
    g.fillStyle = A(sp.mouth, 0.5); g.fillRect(x - w * 0.6, y - h * 0.3, w * 0.12, h * 1.6); g.fillRect(x + w * 0.48, y - h * 0.3, w * 0.12, h * 1.6);
    g.restore();
    path(); strokeW(g, sp.ln, 1.7 * u);
    // 咬紧时嘴角下拉
    for (var gs = -1; gs <= 1; gs += 2) { g.beginPath(); g.moveTo(x + gs * w * 0.5, y + h * 0.2); g.lineTo(x + gs * w * 0.6, y + h * 0.55); strokeW(g, sp.ln, 1.3 * u); }
  };
  MOUTH.o = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 0.42, x = H.cx, y = H.mouthY + H.r * 0.012;
    ell(g, x, y, w * 0.55, w * 0.68); fillC(g, sp.mouth);
    g.save(); ell(g, x, y, w * 0.55, w * 0.68); g.clip(); ell(g, x, y + w * 0.55, w * 0.42, w * 0.32); fillC(g, sp.tongue); g.restore();
    ell(g, x, y, w * 0.55, w * 0.68); strokeW(g, sp.ln, 1.4 * u);
  };
  MOUTH.side = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 0.55, x = H.cx + w * 0.3, y = H.mouthY + H.r * 0.004;
    g.beginPath(); g.moveTo(x - w * 0.5, y - H.r * 0.003); g.quadraticCurveTo(x, y + H.r * 0.004, x + w * 0.5, y + H.r * 0.006);
    strokeW(g, sp.ln, 1.5 * u);
  };
  MOUTH.shock = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 0.8, x = H.cx, y = H.mouthY - H.r * 0.004, r = H.r, i;
    var path = function () {
      g.beginPath(); g.moveTo(x - w * 0.5, y + r * 0.006);
      for (i = 1; i <= 6; i++) g.lineTo(x - w * 0.5 + w * i / 6, y + (i % 2 ? -r * 0.006 : r * 0.004));
      g.bezierCurveTo(x + w * 0.5, y + r * 0.07, x - w * 0.5, y + r * 0.07, x - w * 0.5, y + r * 0.006);
      g.closePath();
    };
    path(); fillC(g, sp.mouth);
    g.save(); path(); g.clip();
    g.fillStyle = '#f8f4f0'; g.fillRect(x - w * 0.6, y - r * 0.02, w * 1.2, r * 0.024);
    ell(g, x, y + r * 0.058, w * 0.3, r * 0.018); fillC(g, sp.tongue);
    g.restore();
    path(); strokeW(g, sp.ln, 1.4 * u);
  };
  MOUTH.dark = function (C, g, H, sp, cf) {
    var u = H.u * C.lw, w = mouthW(H, cf) * 1.45, x = H.cx, y = H.mouthY - H.r * 0.006, r = H.r;
    var path = function () {
      g.beginPath(); g.moveTo(x - w * 0.5, y - r * 0.02);
      g.quadraticCurveTo(x, y + r * 0.012, x + w * 0.5, y - r * 0.03);
      g.quadraticCurveTo(x + w * 0.1, y + r * 0.06, x - w * 0.5, y - r * 0.02);
      g.closePath();
    };
    path(); fillC(g, '#2a0a14');
    g.save(); path(); g.clip();
    g.beginPath(); g.moveTo(x - w * 0.5, y - r * 0.024); g.quadraticCurveTo(x, y + r * 0.008, x + w * 0.5, y - r * 0.034);
    g.lineTo(x + w * 0.5, y - r * 0.016); g.quadraticCurveTo(x, y + r * 0.026, x - w * 0.5, y - r * 0.008); g.closePath(); fillC(g, '#ece6e2');
    if (C.m >= 1) { g.strokeStyle = A('#8a7070', 0.8); g.lineWidth = 0.8 * u; for (var i = 1; i < 8; i++) { var tx = x - w * 0.5 + w * i / 8; g.beginPath(); g.moveTo(tx, y - r * 0.03); g.lineTo(tx, y + r * 0.02); g.stroke(); } }
    g.restore();
    path(); strokeW(g, sp.ln, 1.5 * u);
    g.beginPath(); g.moveTo(x + w * 0.5, y - r * 0.03); g.lineTo(x + w * 0.56, y - r * 0.045); strokeW(g, sp.ln, 1.3 * u);
    g.beginPath(); g.moveTo(x - w * 0.5, y - r * 0.02); g.lineTo(x - w * 0.55, y - r * 0.03); strokeW(g, sp.ln, 1.3 * u);
  };

  /* ====================== 表情表 ====================== */
  // brow: y 整体位移 i 眉头 o 眉尾（r 的比例，正=向下）asym 不对称；eye: open/inDrop/outDrop/iris/pupil/look/hl/tear/mode/lowUp/dull
  EXPR.normal = { brow: {}, eye: {}, mouth: 'neutral' };
  EXPR.smile = { brow: { y: -0.008, i: -0.004 }, eye: { open: 0.8, lowUp: 0.16 }, mouth: 'smile', blush: 0.3 };
  EXPR.sad = { brow: { y: -0.004, i: -0.048, o: 0.02 }, eye: { open: 0.7, outDrop: 0.26, look: [0, 0.4], tear: 1, lowUp: 0.06 }, mouth: 'sad', blush: 0.12 };
  EXPR.angry = { brow: { y: 0.016, i: 0.052, o: -0.026 }, eye: { open: 0.86, inDrop: 0.3, iris: 0.84 }, mouth: 'grit', fx: ['vein', 'furrow'] };
  EXPR.surprise = { brow: { y: -0.05, i: -0.01 }, eye: { open: 1.24, iris: 0.72 }, mouth: 'o' };
  EXPR.think = { brow: { y: 0, asym: 0.022 }, eye: { open: 0.82, look: [0.6, -0.4] }, mouth: 'side', hand: 'chin' };
  EXPR.shock = { brow: { y: -0.026, i: -0.024, o: 0.006 }, eye: { open: 1.2, iris: 0.62, pupil: 0.55, hl: 0.25, shake: 1 }, mouth: 'shock', fx: ['pale', 'sweat', 'gloom'] };
  EXPR.dark = { brow: { y: 0.006, i: 0.02, o: -0.008 }, eye: { open: 0.76, hl: 0, dull: 1, inDrop: 0.08 }, mouth: 'dark', fx: ['shadow'] };

  /* ====================== 脸 ====================== */
  function facePath(H) {
    var cx = H.cx, T = H.T, r = H.r, fw = H.fw, jw = H.jw, jy = H.jawY, C = H.C, cw = H.cw, ey = H.eyeY;
    var chk = H.ft.hollow ? 0.97 : 1, ang = H.ft.ang || 0;
    return function (g) {
      sym(g, cx, [0, T + r * 0.1], [
        [fw * 0.62, T + r * 0.1, fw * 0.98, T + r * 0.24, fw * 0.99, ey - r * 0.1],
        [fw * 1.0, ey - r * 0.03, fw * 1.0, ey + r * 0.03, fw * chk, ey + r * 0.07],
        [fw * (0.985 - ang * 0.01) * chk, ey + r * (0.15 + ang * 0.04), jw + (fw - jw) * (0.35 + ang * 0.15), jy - r * (0.08 - ang * 0.03), jw, jy],
        [jw - (jw - cw) * (0.3 + ang * 0.25), jy + (C - jy) * (0.5 - ang * 0.15), cw * (1.25 + ang * 0.2), C, 0, C]
      ]);
    };
  }
  function earPath(H, s) {
    var x = H.cx + s * H.fw * 0.96, y0 = H.earY0, y1 = H.earY1, w = H.r * 0.075;
    return function (g) {
      g.beginPath(); g.moveTo(x, y0 + (y1 - y0) * 0.05);
      g.bezierCurveTo(x + s * w * 1.1, y0 - (y1 - y0) * 0.12, x + s * w * 1.25, y0 + (y1 - y0) * 0.5, x + s * w * 0.55, y1);
      g.quadraticCurveTo(x + s * w * 0.2, y1 + (y1 - y0) * 0.06, x - s * w * 0.1, y1 - (y1 - y0) * 0.05);
      g.closePath();
    };
  }
  function drawFaceLayer(C, H, cf, X, hd, sp) {
    var g = lbegin(C), u = H.u * C.lw, r = H.r, cx = H.cx, i, s;
    var lw = 1.3 * u, ow = 2.6 * u;
    var showEars = cf._ears;
    var fp = facePath(H);
    // 耳朵
    if (showEars) for (s = -1; s <= 1; s += 2) {
      var ep_ = earPath(H, s);
      piece(C, g, { f: ep_, fill: sp.b, sh: function (g2) {
        var x = cx + s * H.fw * 0.96;
        ell(g2, x + s * r * 0.035, (H.earY0 + H.earY1) / 2, r * 0.02, (H.earY1 - H.earY0) * 0.3); fillC(g2, sp.s);
        g2.beginPath(); g2.moveTo(x + s * r * 0.05, H.earY0 + r * 0.02); g2.quadraticCurveTo(x + s * r * 0.075, (H.earY0 + H.earY1) / 2, x + s * r * 0.035, H.earY1 - r * 0.02);
        strokeW(g2, A(sp.ln, 0.6), lw * 0.9);
      }, ln: sp.ln, lw: lw, ow: ow });
    }
    // 脸底色
    fp(g); fillC(g, sp.b);
    // --- 形状内光影 ---
    g.save(); fp(g); g.clip();
    // 远离光源一侧（右）的赛璐璐阴影
    var sx = cx + H.fw * 1.52, sy = H.eyeY + r * 0.16;
    if (C.l >= 2) { ell(g, sx - r * 0.012, sy, H.fw * 0.78, r * 0.62, -0.08); fillC(g, A(sp.warm, 0.3)); }
    ell(g, sx, sy, H.fw * 0.78, r * 0.62, -0.08); fillC(g, A(sp.s, C.l >= 1 ? 0.75 : 0.85));
    // 下颌下方阴影（下巴底面）
    g.beginPath(); g.moveTo(cx - H.jw * 1.1, H.jawY + r * 0.02); g.quadraticCurveTo(cx, H.C + r * 0.04, cx + H.jw * 1.1, H.jawY + r * 0.02);
    g.lineTo(cx + H.jw * 1.1, H.C + r * 0.1); g.lineTo(cx - H.jw * 1.1, H.C + r * 0.1); g.closePath(); fillC(g, A(sp.s, 0.4));
    if (C.l >= 1) {
      // 柔和体积：额头偏暗（受头发遮挡）、脸颊暖、下巴偏冷
      g.fillStyle = K.lin(g, 0, H.T + r * 0.1, 0, H.C, [[0, A(sp.s, 0.5)], [0.35, A(sp.s, 0)], [0.8, A(sp.b, 0)], [1, A(sp.d, 0.18)]]);
      g.fillRect(cx - r, H.T, r * 2, r * 1.1);
      g.fillStyle = K.rad(g, cx - H.fw * 0.3, H.eyeY + r * 0.05, r * 0.05, r * 0.55, [[0, A(sp.hl, 0.22)], [1, A(sp.hl, 0)]]);
      g.fillRect(cx - r, H.T, r * 2, r * 1.1);
    }
    // 刘海投影
    if (hd && hd.front.length) hairCast(C, g, H, sp, hd);
    // 腮红
    var bl = clamp((cf.blush || 0) + (X.blush || 0), 0, 1.2);
    if (bl > 0.02) blush(C, g, H, sp, bl);
    // 轮廓光
    if (C.l >= 2) {
      fp(g); g.strokeStyle = K.lin(g, cx - H.fw, 0, cx + H.fw * 0.2, 0, [[0, A('#fff8ee', 0.7)], [1, A('#fff8ee', 0)]]); g.lineWidth = 4 * u; g.stroke();
    }
    g.restore();
    // 鼻、嘴、眼、眉
    if (!cf._noFace) {
      drawNose(C, g, H, sp, cf);
      marksUnder(C, g, H, cf, sp, X);
      var mk = X.mouth || 'neutral';
      if (cf._beardMouth && (mk === 'neutral' || mk === 'side')) mk = mk;
      if (!cf._beardMouth && /neutral|smile_closed|sad|side|frown|smirk/.test(mk)) {
        // 唇色：下唇的淡淡红润
        var lw0 = mouthW(H, cf) * (mk === 'smile_closed' ? 0.3 : 0.24);
        ell(g, H.cx + (mk === 'side' ? lw0 * 0.6 : 0), H.mouthY + r * 0.02, lw0, r * 0.009); fillC(g, A(sp.lip, H.sex === 'm' ? 0.22 : 0.45));
        if (C.l >= 2 && H.sex !== 'm') { ell(g, H.cx - lw0 * 0.3, H.mouthY + r * 0.017, lw0 * 0.3, r * 0.003); fillC(g, A('#ffffff', 0.4)); }
      }
      (MOUTH[mk] || MOUTH.neutral)(C, g, H, sp, cf);
      var E = cf._eye, ep = eyePal(cf.eyes && cf.eyes.color), lashC = cf._lashC;
      if (!E.none) for (s = -1; s <= 1; s += 2) drawEye(C, g, H, s, E, X.eye || {}, ep, sp, lashC);
      var Bp = BROW[cf.brows && cf.brows.shape] || BROW[H.sex === 'm' ? 'straight' : 'normal'];
      if (cf.brows && cf.brows.t) Bp = merge(Bp, { t: (Bp.t || 1) * cf.brows.t });
      for (s = -1; s <= 1; s += 2) drawBrow(C, g, H, s, Bp, X.brow || {}, cf._browC);
      marksOver(C, g, H, cf, sp, X);
    }
    // 表情特效（脸内）
    exprFxFace(C, g, H, cf, X, sp, fp);
    // 外轮廓
    g.save(); g.globalCompositeOperation = 'destination-over'; fp(g); strokeW(g, sp.ln, ow * 2); g.restore();
    // 下巴/脸颊内侧轮廓再描一次（让线条在颈部之上清晰）
    lend(C);
  }
  function blush(C, g, H, sp, bl) {
    var r = H.r, u = H.u * C.lw, s, i;
    for (s = -1; s <= 1; s += 2) {
      var x = H.cx + s * H.ex * 1.08, y = H.eyeY + H.eh * 0.62 + r * 0.03;
      if (C.l >= 1) {
        g.fillStyle = K.rad(g, x, y, 0, r * 0.11, [[0, A(sp.blush, 0.32 * bl)], [1, A(sp.blush, 0)]]);
        g.fillRect(x - r * 0.12, y - r * 0.12, r * 0.24, r * 0.24);
      } else { ell(g, x, y, r * 0.075, r * 0.035); fillC(g, A(sp.blush, 0.22 * bl)); }
      if (C.m >= 1 && bl > 0.25 && !H.chibi) {
        g.strokeStyle = A('#e05a6a', 0.45 * Math.min(1, bl)); g.lineWidth = 1.1 * u;
        for (i = 0; i < 3; i++) { var hx = x - r * 0.04 + i * r * 0.035; g.beginPath(); g.moveTo(hx + r * 0.012, y - r * 0.02); g.lineTo(hx - r * 0.008, y + r * 0.018); g.stroke(); }
      }
    }
  }
  function drawNose(C, g, H, sp, cf) {
    var u = H.u * C.lw, r = H.r, x = H.cx, y = H.noseY, k = cf.nose || (H.sex === 'm' ? 'male' : 'small');
    if (H.chibi) { if (C.m >= 1) { g.beginPath(); g.moveTo(x + r * 0.006, y - r * 0.01); g.lineTo(x, y); strokeW(g, A(sp.ln, 0.5), 1 * u); } return; }
    // 鼻梁的柔和阴影与鼻底阴影
    if (C.l >= 1) {
      g.fillStyle = K.lin(g, x, 0, x + r * 0.04, 0, [A(sp.s, 0.38), A(sp.s, 0)]);
      g.beginPath(); g.moveTo(x + r * 0.004, H.eyeY + r * 0.02); g.quadraticCurveTo(x + r * 0.012, y - r * 0.05, x + r * 0.02, y); g.lineTo(x + r * 0.045, y); g.quadraticCurveTo(x + r * 0.035, y - r * 0.06, x + r * 0.02, H.eyeY + r * 0.02); g.closePath(); g.fill();
    }
    ell(g, x + r * 0.004, y + r * 0.014, r * 0.022, r * 0.007); fillC(g, A(sp.s, 0.45));
    // 鼻侧阴影
    g.beginPath(); g.moveTo(x + r * 0.006, y - r * (k === 'male' || k === 'long' ? 0.11 : 0.05));
    g.quadraticCurveTo(x + r * 0.03, y - r * 0.01, x + r * 0.012, y + r * 0.006); g.lineTo(x - r * 0.004, y + r * 0.004); g.closePath();
    fillC(g, A(sp.s, 0.7));
    g.beginPath(); g.moveTo(x + r * 0.014, y - r * 0.02); g.quadraticCurveTo(x + r * 0.016, y + r * 0.002, x - r * 0.004, y + r * 0.004);
    strokeW(g, A(sp.ln, 0.75), 1.3 * u);
    if (k === 'male' || k === 'long') {
      g.beginPath(); g.moveTo(x + r * 0.012, H.eyeY + r * 0.03); g.quadraticCurveTo(x + r * 0.02, y - r * 0.06, x + r * 0.015, y - r * 0.03);
      strokeW(g, A(sp.ln, 0.3), 1 * u);
      g.beginPath(); g.moveTo(x - r * 0.022, y + r * 0.002); g.quadraticCurveTo(x - r * 0.016, y + r * 0.01, x - r * 0.008, y + r * 0.006);
      strokeW(g, A(sp.ln, 0.45), 1 * u);
    }
    if (C.l >= 2) { g.beginPath(); g.moveTo(x - r * 0.006, y - r * 0.05); g.lineTo(x - r * 0.006, y - r * 0.025); strokeW(g, A('#ffffff', 0.4), 1.2 * u); }
  }
  // 脸部特征：在五官之前（胡茬、疤）
  function hasMark(cf, k) { var m = cf.marks || []; for (var i = 0; i < m.length; i++) if ((m[i].k || m[i]) === k) return m[i]; return null; }
  function marksUnder(C, g, H, cf, sp, X) {
    var r = H.r, cx = H.cx, u = H.u * C.lw, i, m, s;
    var hc = cf._fhC || '#3a3434';
    // 年龄纹
    if (H.lines >= 1 && !H.chibi && C.m >= 0) {
      for (s = -1; s <= 1; s += 2) {
        g.beginPath(); g.moveTo(cx + s * r * 0.055, H.noseY - r * 0.005);
        g.quadraticCurveTo(cx + s * r * 0.09, H.mouthY - r * 0.02, cx + s * r * 0.085, H.mouthY + r * 0.025);
        strokeW(g, A(sp.ln, 0.18 + H.lines * 0.08), 1.1 * u);
      }
      if (H.lines >= 2 && C.m >= 1) for (s = -1; s <= 1; s += 2) {
        g.beginPath(); g.moveTo(cx + s * H.jw * 0.75, H.mouthY + r * 0.02); g.quadraticCurveTo(cx + s * H.jw * 0.8, H.jawY + r * 0.04, cx + s * H.jw * 0.62, H.C - r * 0.03);
        strokeW(g, A(sp.ln, 0.18), 1 * u);
      }
    }
    if (H.ft.hollow && !H.chibi) for (s = -1; s <= 1; s += 2) {
      g.beginPath(); g.moveTo(cx + s * H.fw * 0.78, H.eyeY + r * 0.1); g.quadraticCurveTo(cx + s * H.fw * 0.68, H.noseY + r * 0.02, cx + s * H.fw * 0.7, H.mouthY);
      strokeW(g, A(sp.ln, 0.18), 1.1 * u);
    }
    if ((m = hasMark(cf, 'stubble')) && !H.chibi) {
      g.save(); facePath(H)(g); g.clip();
      g.beginPath(); g.moveTo(cx - H.fw * 0.98, H.noseY - r * 0.02);
      g.quadraticCurveTo(cx - H.fw * 0.5, H.noseY + r * 0.06, cx - r * 0.06, H.noseY + r * 0.03);
      g.quadraticCurveTo(cx, H.noseY + r * 0.02, cx + r * 0.06, H.noseY + r * 0.03);
      g.quadraticCurveTo(cx + H.fw * 0.5, H.noseY + r * 0.06, cx + H.fw * 0.98, H.noseY - r * 0.02);
      g.lineTo(cx + H.fw, H.C + r * 0.1); g.lineTo(cx - H.fw, H.C + r * 0.1); g.closePath();
      fillC(g, A(K.mix(hc, '#506080', 0.5), 0.07));
      if (C.m >= 1) {
        var rn = K.rng('stub' + cf._id), nd = K.byModel(C.q, 0, 80, 170);
        g.fillStyle = A(hc, 0.22);
        for (i = 0; i < nd; i++) {
          var a = rn() * 2 - 1, yy = lerp(H.mouthY - r * 0.05, H.C - r * 0.005, rn());
          var hw = H.jw + (H.fw - H.jw) * clamp((H.jawY - yy) / (H.jawY - H.eyeY), 0, 1);
          if (yy > H.jawY) hw = lerp(H.jw, H.cw, (yy - H.jawY) / (H.C - H.jawY));
          var xx = cx + a * hw * 0.95;
          if (Math.abs(xx - cx) < mouthW(H, cf) * 0.55 && Math.abs(yy - H.mouthY) < r * 0.025) continue;
          g.fillRect(xx, yy, 1.1 * u, 1.1 * u);
        }
      }
      g.restore();
    }
    if ((m = hasMark(cf, 'beard_short')) || (m = hasMark(cf, 'beard_full'))) beard(C, g, H, cf, sp, m, hc);
    if ((m = hasMark(cf, 'goatee'))) {
      g.beginPath(); g.moveTo(cx - r * 0.04, H.mouthY + r * 0.035); g.quadraticCurveTo(cx, H.mouthY + r * 0.02, cx + r * 0.04, H.mouthY + r * 0.035);
      g.quadraticCurveTo(cx + r * 0.035, H.C + r * 0.01, cx, H.C + r * 0.02); g.quadraticCurveTo(cx - r * 0.035, H.C + r * 0.01, cx - r * 0.04, H.mouthY + r * 0.035);
      g.closePath(); fillC(g, hc);
    }
    if ((m = hasMark(cf, 'burn')) && !H.chibi) {
      s = m.side || 1;
      var rb = K.rng('burn' + cf._id);
      g.save(); facePath(H)(g); g.clip();
      var pts = [], n = 10;
      for (i = 0; i < n; i++) { var an = i / n * PI * 2, rr = r * (0.13 + rb() * 0.05); pts.push(cx + s * H.fw * 0.5 + Math.cos(an) * rr * 1.1, H.eyeY + r * 0.12 + Math.sin(an) * rr * 1.3); }
      smoothPoly(g, pts, true); fillC(g, A(K.mix(sp.b, '#b05060', 0.45), 0.8));
      if (C.t >= 1 || C.m >= 1) { g.save(); smoothPoly(g, pts, true); g.clip(); for (i = 0; i < 18; i++) { ell(g, cx + s * H.fw * 0.5 + (rb() - 0.5) * r * 0.25, H.eyeY + r * 0.12 + (rb() - 0.5) * r * 0.3, r * 0.02, r * 0.012, rb()); fillC(g, A(rb() < 0.5 ? '#f0c0c0' : '#8a3040', 0.35)); } g.restore(); }
      smoothPoly(g, pts, true); strokeW(g, A(sp.ln, 0.5), 1 * u);
      g.restore();
    }
    if ((m = hasMark(cf, 'freckles'))) {
      var rf = K.rng('frk'); g.fillStyle = A('#b06040', 0.4);
      for (s = -1; s <= 1; s += 2) for (i = 0; i < 6; i++) circ(g, cx + s * (H.ex * 0.7 + rf() * r * 0.08), H.eyeY + H.eh * 0.6 + rf() * r * 0.05, 1.2 * u), g.fill();
    }
    if ((m = hasMark(cf, 'mole'))) { circ(g, cx + (m.side || 1) * H.fw * 0.42, H.mouthY - r * 0.01, 1.8 * u); fillC(g, A('#4a2a2a', 0.8)); }
    marksExtra(C, g, H, cf, sp);
    void X;
  }
  function beard(C, g, H, cf, sp, m, hc) {
    var r = H.r, cx = H.cx, u = H.u * C.lw, full = m === 'beard_full' || m.k === 'beard_full';
    var bp = hairPal(m.c || hc), ext = full ? r * 0.13 : r * 0.03;
    var f = function (g2) {
      g2.beginPath();
      g2.moveTo(cx - H.fw * 0.98, H.eyeY + r * 0.1);
      g2.quadraticCurveTo(cx - H.fw * 0.9, H.noseY + r * 0.04, cx - H.fw * 0.55, H.noseY + r * 0.05);
      g2.quadraticCurveTo(cx - r * 0.07, H.mouthY - r * 0.05, cx, H.mouthY - r * 0.04);
      g2.quadraticCurveTo(cx + r * 0.07, H.mouthY - r * 0.05, cx + H.fw * 0.55, H.noseY + r * 0.05);
      g2.quadraticCurveTo(cx + H.fw * 0.9, H.noseY + r * 0.04, cx + H.fw * 0.98, H.eyeY + r * 0.1);
      g2.bezierCurveTo(cx + H.fw * 1.02, H.jawY, cx + H.jw * 0.9, H.C + ext, cx, H.C + ext + r * 0.02);
      g2.bezierCurveTo(cx - H.jw * 0.9, H.C + ext, cx - H.fw * 1.02, H.jawY, cx - H.fw * 0.98, H.eyeY + r * 0.1);
      g2.closePath();
    };
    g.save();
    f(g); g.fillStyle = bp.b; g.fill();
    g.save(); f(g); g.clip();
    g.fillStyle = K.lin(g, cx - H.fw, 0, cx + H.fw, 0, [A(bp.h, 0.25), A(bp.b, 0), A(bp.s, 0.6)]); g.fillRect(cx - H.fw * 1.1, H.eyeY, H.fw * 2.2, r * 0.8);
    if (C.m >= 1) {
      var rn = K.rng('beard'), n = K.byModel(C.q, 0, 30, 60), i;
      g.strokeStyle = A(bp.s, 0.6); g.lineWidth = 1 * u;
      for (i = 0; i < n; i++) { var a = rn() * 2 - 1, y = lerp(H.noseY, H.C + ext, rn()), x = cx + a * H.fw * 0.9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + a * r * 0.01, y + r * 0.03); g.stroke(); }
      g.strokeStyle = A(bp.h, 0.5);
      for (i = 0; i < n / 2; i++) { var a2 = rn() * 2 - 1.2, y2 = lerp(H.noseY, H.C, rn()), x2 = cx + a2 * H.fw * 0.8; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + a2 * r * 0.01, y2 + r * 0.025); g.stroke(); }
    }
    g.restore();
    f(g); g.strokeStyle = bp.ln; g.lineWidth = 1.3 * u; g.stroke();
    // 嘴部开口（露出皮肤）
    ell(g, cx, H.mouthY + r * 0.008, mouthW(H, cf) * 0.6, r * 0.032); fillC(g, sp.b); strokeW(g, A(bp.ln, 0.6), 1 * u);
    g.restore();
    cf._beardMouth = 1;
  }
  // 五官之后（胡子、疤痕、绷带）
  function marksOver(C, g, H, cf, sp, X) {
    var r = H.r, cx = H.cx, u = H.u * C.lw, m, s, i;
    var hc = cf._fhC || '#3a3434';
    if ((m = hasMark(cf, 'mustache'))) {
      var mp = hairPal(m.c || hc), my = H.noseY + (H.mouthY - H.noseY) * 0.48, mw = mouthW(H, cf) * 0.78;
      var f = function (g2) {
        g2.beginPath(); g2.moveTo(cx, my - r * 0.012);
        g2.bezierCurveTo(cx + mw * 0.5, my - r * 0.03, cx + mw * 0.95, my - r * 0.01, cx + mw * 1.15, my + r * 0.028);
        g2.bezierCurveTo(cx + mw * 0.8, my + r * 0.012, cx + mw * 0.4, my + r * 0.018, cx, my + r * 0.01);
        g2.bezierCurveTo(cx - mw * 0.4, my + r * 0.018, cx - mw * 0.8, my + r * 0.012, cx - mw * 1.15, my + r * 0.028);
        g2.bezierCurveTo(cx - mw * 0.95, my - r * 0.01, cx - mw * 0.5, my - r * 0.03, cx, my - r * 0.012);
        g2.closePath();
      };
      piece(C, g, { f: f, fill: mp.b, sh: function (g2) {
        g2.fillStyle = K.lin(g2, 0, my - r * 0.03, 0, my + r * 0.03, [A(mp.h, C.l >= 1 ? 0.5 : 0.3), A(mp.s, 0.6)]); g2.fillRect(cx - mw * 1.3, my - r * 0.04, mw * 2.6, r * 0.08);
        if (C.m >= 1) { g2.strokeStyle = A(mp.s, 0.8); g2.lineWidth = 0.9 * u; for (var k = -5; k <= 5; k++) { if (!k) continue; var xx = cx + k * mw * 0.2; g2.beginPath(); g2.moveTo(xx, my - r * 0.01); g2.lineTo(xx + k * r * 0.003, my + r * 0.02); g2.stroke(); } }
      }, ln: mp.ln, lw: 1.2 * u });
    }
    if ((m = hasMark(cf, 'scar_brow'))) {
      s = m.side || 1;
      var x0 = cx + s * H.ex * 0.75, y0 = H.browY - r * 0.05, x1 = cx + s * H.ex * 1.05, y1 = H.browY + r * 0.06;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); strokeW(g, A(K.mix(sp.b, '#c06070', 0.5), 0.9), 3 * u);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); strokeW(g, A(sp.ln, 0.7), 1.1 * u);
      if (C.m >= 1) for (i = 1; i < 4; i++) { var t = i / 4, xx2 = lerp(x0, x1, t), yy2 = lerp(y0, y1, t); g.beginPath(); g.moveTo(xx2 - r * 0.012, yy2 + r * 0.006); g.lineTo(xx2 + r * 0.012, yy2 - r * 0.006); strokeW(g, A(sp.ln, 0.5), 1 * u); }
    }
    if ((m = hasMark(cf, 'scar_cheek'))) {
      s = m.side || -1;
      g.beginPath(); g.moveTo(cx + s * H.fw * 0.45, H.eyeY + r * 0.1); g.lineTo(cx + s * H.fw * 0.7, H.noseY + r * 0.02);
      strokeW(g, A(K.mix(sp.b, '#c06070', 0.5), 0.9), 3 * u);
      g.beginPath(); g.moveTo(cx + s * H.fw * 0.45, H.eyeY + r * 0.1); g.lineTo(cx + s * H.fw * 0.7, H.noseY + r * 0.02); strokeW(g, A(sp.ln, 0.6), 1 * u);
    }
    if ((m = hasMark(cf, 'bandage'))) {
      s = m.side || 1;
      g.save(); g.translate(cx + s * H.fw * 0.55, H.eyeY + r * 0.13); g.rotate(s * 0.5);
      rrect(g, -r * 0.06, -r * 0.02, r * 0.12, r * 0.04, r * 0.008); fillC(g, '#f4ead8'); strokeW(g, A(sp.ln, 0.5), 1 * u);
      g.restore();
    }
    void X;
  }
  function exprFxFace(C, g, H, cf, X, sp, fp) {
    var fx = X.fx || [], r = H.r, cx = H.cx, u = H.u * C.lw, i;
    if (!fx.length) return;
    g.save(); g.globalCompositeOperation = 'source-atop';
    if (fx.indexOf('pale') >= 0) {
      g.fillStyle = K.lin(g, 0, H.T, 0, H.C, [[0, 'rgba(70,90,170,0.42)'], [0.55, 'rgba(110,130,200,0.18)'], [1, 'rgba(120,140,210,0.06)']]);
      g.fillRect(cx - r, H.T - r * 0.2, r * 2, r * 1.4);
    }
    if (fx.indexOf('gloom') >= 0 && C.m >= 1) {
      g.strokeStyle = 'rgba(40,50,120,0.5)'; g.lineWidth = 1.6 * u;
      for (i = 0; i < 7; i++) { var x = cx - H.fw * 0.6 + i * H.fw * 0.2; g.beginPath(); g.moveTo(x, H.browY - r * 0.08); g.lineTo(x, H.browY - r * 0.01 - (i % 2) * r * 0.02); g.stroke(); }
    }
    if (fx.indexOf('shadow') >= 0) {
      g.fillStyle = K.lin(g, 0, H.browY - r * 0.12, 0, H.eyeY + H.eh * 0.9, [[0, 'rgba(20,8,30,0)'], [0.35, 'rgba(24,8,36,0.62)'], [0.7, 'rgba(24,8,36,0.62)'], [1, 'rgba(20,8,30,0)']]);
      g.fillRect(cx - r, H.browY - r * 0.12, r * 2, H.eyeY + H.eh * 0.9 - H.browY + r * 0.12);
      g.fillStyle = 'rgba(30,10,40,0.18)'; g.fillRect(cx - r, H.T, r * 2, r * 1.2);
    }
    g.restore();
    if (fx.indexOf('shadow') >= 0) {
      // 阴影中微弱的瞳光
      for (var s = -1; s <= 1; s += 2) {
        var ex = H.cx + s * H.ex + s * H.ew * 0.02, ey = H.eyeY + H.eh * 0.1;
        circ(g, ex, ey, H.ew * 0.05); fillC(g, 'rgba(255,90,110,0.8)');
        if (C.l >= 1) K.glow(g, ex, ey, H.ew * 0.25, '#ff4060', 0.25);
      }
    }
    if (fx.indexOf('furrow') >= 0 && C.m >= 1 && !H.chibi) {
      for (var fs = -1; fs <= 1; fs += 2) { g.beginPath(); g.moveTo(cx + fs * r * 0.022, H.browY - r * 0.01); g.quadraticCurveTo(cx + fs * r * 0.012, H.browY + r * 0.025, cx + fs * r * 0.018, H.browY + r * 0.045); strokeW(g, A(sp.ln, 0.45), 1.1 * u); }
    }
    if (fx.indexOf('vein') >= 0 && C.m >= 1 && !H.chibi) {
      var vx = cx + H.fw * 0.55, vy = H.T + r * 0.2;
      g.save(); g.translate(vx, vy); g.strokeStyle = '#d02838'; g.lineWidth = 2.2 * u;
      for (i = 0; i < 4; i++) { g.rotate(PI / 2); g.beginPath(); g.moveTo(r * 0.012, r * 0.012); g.quadraticCurveTo(r * 0.035, r * 0.01, r * 0.04, r * 0.035); g.stroke(); }
      g.restore();
    }
    void sp; void fp;
  }
  // 冷汗（画在头发之上）
  function sweat(C, g, H) {
    var r = H.r, u = H.u * C.lw, s, k;
    var drops = [[1, H.fw * 0.92, H.browY - r * 0.02, 1], [-1, H.fw * 0.95, H.eyeY + r * 0.02, 0.7]];
    if (C.m >= 1) drops.push([1, H.fw * 1.02, H.eyeY + r * 0.12, 0.55]);
    for (k = 0; k < drops.length; k++) {
      s = drops[k][0]; var x = H.cx + s * drops[k][1], y = drops[k][2], sz = r * 0.045 * drops[k][3];
      g.beginPath(); g.moveTo(x, y - sz * 1.4); g.quadraticCurveTo(x + sz * 0.9, y + sz * 0.1, x, y + sz * 0.8); g.quadraticCurveTo(x - sz * 0.9, y + sz * 0.1, x, y - sz * 1.4); g.closePath();
      g.fillStyle = C.l >= 1 ? K.lin(g, x, y - sz, x, y + sz, ['#e8f4ff', '#8ab8f0']) : '#b8d8ff'; g.fill();
      strokeW(g, '#4a70b0', 1.3 * u);
      ell(g, x - sz * 0.25, y + sz * 0.1, sz * 0.18, sz * 0.3); fillC(g, '#ffffff');
    }
  }

  /* ====================== 身体与服装 ====================== */
  // 身体剪影（左半段，dx 坐标），nl = { y: 领口中心 y, w: 领口半宽, v: V 领 }
  function bodySegs(B, inf, nl) {
    var r = B.r, nw = B.nw, ny = B.ny, shY = B.shY - inf * 0.35, sw = B.sw + inf, bw = B.bw + inf, bot = B.bot + 4;
    var nlw = nl.w || nw * 1.04, nly = nl.y === undefined ? ny + r * 0.04 : nl.y, nty = nl.ty === undefined ? ny - r * 0.05 : nl.ty;
    var neck = nl.v ? [nlw * 0.98, nty] : [nlw * 0.55, nly, nlw * 0.96, nty + (nly - nty) * 0.35, nlw, nty];
    return [neck,
      [nlw + r * 0.06, nty + r * 0.04, sw * 0.52, shY - r * 0.04, sw * 0.86, shY],
      [sw * 0.97, shY + r * 0.005, sw + r * 0.005, shY + r * 0.06, sw + r * 0.012, shY + r * 0.16],
      [sw + r * 0.03, shY + r * 0.45, bw, bot - r * 0.35, bw, bot],
      [0, bot]];
  }
  function bodyPath(B, inf, nl) { var segs = bodySegs(B, inf || 0, nl || {}); var y0 = (nl && nl.y !== undefined) ? nl.y : B.ny + B.r * 0.04; return function (g) { sym(g, B.cx, [0, y0], segs); }; }
  // 只含躯干（无手臂）
  function torsoPath(B, inf, nl) {
    var r = B.r, nw = B.nw, ny = B.ny, shY = B.shY - (inf || 0) * 0.35, sw = B.sw + (inf || 0), aw = B.aw, bot = B.bot + 4;
    nl = nl || {};
    var nlw = nl.w || nw * 1.04, nly = nl.y === undefined ? ny + r * 0.04 : nl.y, nty = ny - r * 0.05;
    return function (g) {
      sym(g, B.cx, [0, nly], [
        nl.v ? [nlw * 0.98, nty] : [nlw * 0.55, nly, nlw * 0.96, nty + (nly - nty) * 0.35, nlw, nty],
        [nlw + r * 0.06, nty + r * 0.04, sw * 0.52, shY - r * 0.04, sw * 0.86, shY],
        [sw * 0.84, shY + r * 0.12, sw - aw * 0.9, shY + r * 0.25, sw - aw * 0.92, shY + r * 0.34],
        [sw - aw * 0.95, shY + r * 0.6, B.bw - aw * 1.02, bot - r * 0.3, B.bw - aw * 1.02, bot],
        [0, bot]]);
    };
  }
  function armLine(g, B, s, inf) {
    var r = B.r, cx = B.cx, sw = B.sw + (inf || 0), aw = B.aw, shY = B.shY, bot = B.bot + 4;
    g.beginPath(); g.moveTo(cx + s * (sw - aw * 0.9), shY + r * 0.3);
    g.bezierCurveTo(cx + s * (sw - aw * 0.96), shY + r * 0.6, cx + s * (B.bw + (inf || 0) - aw * 1.02), bot - r * 0.3, cx + s * (B.bw + (inf || 0) - aw * 1.02), bot);
  }
  // 褶皱：细长月牙形阴影
  function fold(g, x0, y0, x1, y1, bend, w, col) {
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
    g.beginPath(); g.moveTo(x0, y0);
    g.quadraticCurveTo(mx + nx * (bend + w), my + ny * (bend + w), x1, y1);
    g.quadraticCurveTo(mx + nx * (bend - w * 0.2), my + ny * (bend - w * 0.2), x0, y0);
    g.closePath(); fillC(g, col);
  }
  // 通用布料光影（在形状裁剪内调用，绝对坐标 → 多件衣物光影一致）
  function clothShade(C, g, B, p, o) {
    o = o || {};
    var r = B.r, cx = B.cx, sw = B.sw, shY = B.shY, bot = B.bot + 4, u = B.u * C.lw, aw = B.aw, s, i;
    var sa = o.sa === undefined ? 1 : o.sa;
    // 远光侧（右）的赛璐璐阴影
    g.beginPath();
    g.moveTo(cx + sw * 0.3, B.ny - r * 0.2);
    g.bezierCurveTo(cx + sw * 0.5, shY + r * 0.25, cx + sw * 0.28, bot - r * 0.6, cx + sw * 0.4, bot);
    g.lineTo(cx + sw * 3, bot); g.lineTo(cx + sw * 3, B.ny - r * 0.3); g.closePath();
    fillC(g, A(p.s, (C.l >= 1 ? 0.55 : 0.7) * sa));
    // 手臂与躯干交界
    if (!o.noArms) for (s = -1; s <= 1; s += 2) {
      g.save(); armLine(g, B, s, o.inf); g.lineTo(cx + s * (B.bw - aw * 1.02 - r * 0.12), bot); g.lineTo(cx + s * (sw - aw * 1.15), shY + r * 0.34); g.closePath();
      fillC(g, A(p.s, (s > 0 ? 0.55 : 0.4) * sa)); g.restore();
      armLine(g, B, s, o.inf); strokeW(g, A(p.ln, 0.55), 1.2 * u);
    }
    // 第二层（更深的）阴影：远光侧外缘与腋下
    if (C.l >= 1) {
      g.beginPath();
      g.moveTo(cx + sw * 0.72, B.ny - r * 0.1);
      g.bezierCurveTo(cx + sw * 0.86, shY + r * 0.3, cx + sw * 0.7, bot - r * 0.5, cx + sw * 0.8, bot);
      g.lineTo(cx + sw * 3, bot); g.lineTo(cx + sw * 3, B.ny - r * 0.2); g.closePath();
      fillC(g, A(p.d, 0.32 * sa));
      if (!o.noArms) for (s = -1; s <= 1; s += 2) { g.save(); armLine(g, B, s, o.inf); g.lineTo(cx + s * (B.bw - aw * 1.02 - r * 0.05), bot); g.lineTo(cx + s * (sw - aw * 1.0), shY + r * 0.34); g.closePath(); fillC(g, A(p.d, (s > 0 ? 0.4 : 0.28) * sa)); g.restore(); }
    }
    // 颈下投影
    if (!o.noNeckShadow) { ell(g, cx + r * 0.02, B.ny + r * 0.03, B.nw * 1.6, r * 0.09); fillC(g, A(p.s, 0.5 * sa)); if (C.l >= 1) { ell(g, cx + r * 0.02, B.ny + r * 0.015, B.nw * 1.1, r * 0.045); fillC(g, A(p.d, 0.35 * sa)); } }
    if (C.l >= 1) {
      g.fillStyle = K.lin(g, 0, B.ny, 0, bot, [[0, A(p.l, 0.16)], [0.4, A(p.b, 0)], [1, A(p.d, 0.32)]]);
      g.fillRect(cx - sw * 2, B.ny - r * 0.3, sw * 4, bot - B.ny + r * 0.3);
      g.fillStyle = K.lin(g, cx - sw * 1.1, 0, cx + sw * 1.1, 0, [[0, A(p.l, 0.12)], [0.5, A(p.b, 0)], [1, A(p.d, 0.25)]]);
      g.fillRect(cx - sw * 2, B.ny - r * 0.3, sw * 4, bot - B.ny + r * 0.3);
    }
    // 褶皱
    if (C.m >= 1 && !o.noFolds) {
      var fc = A(p.s, 0.75 * sa), n = C.m >= 2 ? 3 : 2;
      for (s = -1; s <= 1; s += 2) {
        for (i = 0; i < n; i++) {
          var ax = cx + s * (sw - aw * (1.0 + i * 0.12)), ay = shY + r * (0.36 + i * 0.07);
          fold(g, ax, ay, ax - s * r * (0.2 + i * 0.05), ay + r * (0.12 + i * 0.05), s * r * 0.02, r * 0.012, fc);
        }
        // 手臂上的竖褶
        var arx = cx + s * (sw + r * 0.01 - aw * 0.45);
        fold(g, arx, shY + r * 0.5, arx + s * r * 0.03, bot - r * 0.05, s * r * 0.015, r * 0.01, fc);
        if (C.m >= 2) fold(g, arx + s * aw * 0.25, shY + r * 0.85, arx + s * aw * 0.3, bot, -s * r * 0.01, r * 0.008, fc);
      }
      if (o.drape) for (i = -2; i <= 2; i++) fold(g, cx + i * sw * 0.18, bot - r * (0.5 + Math.abs(i) * 0.05), cx + i * sw * 0.22, bot, r * 0.01, r * 0.012, fc);
      if (C.m >= 2) for (s = -1; s <= 1; s += 2) {
        // 胸前的张力褶、腰部斜褶、前臂处的堆褶
        fold(g, cx + s * sw * 0.22, B.ny + r * 0.32, cx + s * sw * 0.52, B.ny + r * 0.46, -s * r * 0.012, r * 0.009, A(p.s, 0.6 * sa));
        fold(g, cx + s * sw * 0.45, bot - r * 0.3, cx + s * sw * 0.2, bot - r * 0.08, s * r * 0.015, r * 0.01, A(p.s, 0.6 * sa));
        fold(g, cx + s * (B.bw - aw * 0.25), bot - r * 0.32, cx + s * (B.bw - aw * 0.65), bot - r * 0.18, -s * r * 0.01, r * 0.009, A(p.s, 0.65 * sa));
        if (C.l >= 2) { g.beginPath(); g.moveTo(cx + s * sw * 0.23 - r * 0.006, B.ny + r * 0.31); g.quadraticCurveTo(cx + s * sw * 0.37, B.ny + r * 0.36, cx + s * sw * 0.51, B.ny + r * 0.445); strokeW(g, A(p.l, 0.22 * sa), 1.2 * u); }
      }
    }
    // 肩部轮廓光（左暖右冷）
    if (C.l >= 2 && !o.noArms) for (s = -1; s <= 1; s += 2) {
      var ish = (o.inf || 0) ;
      g.save(); g.translate(0, 2.2 * u);
      P(g, ['M', B.nw * 1.15, B.ny - r * 0.04, 'C', B.nw * 1.15 + r * 0.06, B.ny, (sw + ish) * 0.52, shY - r * 0.04, (sw + ish) * 0.86, shY, 'C', (sw + ish) * 0.97, shY + r * 0.005, sw + ish, shY + r * 0.06, sw + ish + r * 0.01, shY + r * 0.16], cx, s);
      strokeW(g, s < 0 ? A('#fff4e0', 0.38 * sa) : A('#b0c0ff', 0.22 * sa), 3.2 * u);
      g.restore();
    }
    if (o.sheen && C.l >= 2) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = K.lin(g, cx - sw, 0, cx + sw, 0, [[0, A('#ffffff', 0)], [0.25, A('#ffffff', 0.12)], [0.35, A('#ffffff', 0)], [1, A('#ffffff', 0)]]);
      g.fillRect(cx - sw * 1.5, B.ny, sw * 3, bot - B.ny);
      g.restore();
    }
  }
  // 绘制一件衣物（带剪影外轮廓）
  function garment(C, g, B, f, c, o) {
    o = o || {};
    var p = pal(c), u = B.u * C.lw;
    piece(C, g, {
      f: f, fill: p.b, tex: C.t > 0 && o.tex !== false ? clothTex(p.b, o.tex || 'cotton') : null,
      sh: function (g2) { clothShade(C, g2, B, p, o); if (o.sh) o.sh(g2, p); if (C.l >= 2 && !o.noRim) { f(g2); g2.strokeStyle = K.lin(g2, B.cx - B.sw, 0, B.cx, 0, [A('#fff4e4', 0.4), A('#fff4e4', 0)]); g2.lineWidth = 5 * u; g2.stroke(); } },
      ln: p.ln, lw: 1.3 * u, ow: o.ow === undefined ? 2.4 * u : o.ow
    });
    return p;
  }
  function button(C, g, x, y, rad, c, u) {
    var p = pal(c);
    circ(g, x, y, rad); fillC(g, C.l >= 1 ? K.rad(g, x - rad * 0.3, y - rad * 0.3, 0, rad * 1.2, [p.l, p.b, p.s]) : p.b);
    strokeW(g, p.ln, 1 * u);
    if (C.m >= 2 && rad > 2) { g.fillStyle = A(p.d, 0.8); circ(g, x - rad * 0.3, y, rad * 0.14); g.fill(); circ(g, x + rad * 0.3, y, rad * 0.14); g.fill(); }
    if (C.l >= 2) { circ(g, x - rad * 0.35, y - rad * 0.4, rad * 0.22); fillC(g, A('#ffffff', 0.7)); }
  }
  // 颈部与（可选）手臂皮肤
  function skinBody(C, g, H, B, sp, arms) {
    var r = B.r, cx = B.cx, nw = B.nw, ny = B.ny, u = B.u * C.lw;
    var f = function (g2) {
      sym(g2, cx, [0, H.jawY - r * 0.1], [
        [nw * 0.9, H.jawY - r * 0.1],
        [nw * 0.94, H.C - r * 0.02, nw * 0.98, ny - r * 0.08, nw * 1.02, ny - r * 0.03],
        [nw * 1.15, ny + r * 0.03, nw * 1.8, ny + r * 0.06, nw * 2.6, ny + r * 0.1],
        [nw * 2.9, ny + r * 0.7], [0, ny + r * 0.7]]);
    };
    var fa = arms ? bodyPath(B, 0, { y: ny + r * 0.05 }) : null;
    var sh = function (g2) {
      // 下巴投影
      var fp = facePath(H);
      if (C.l >= 2) { g2.save(); g2.translate(r * 0.012, r * 0.1); fp(g2); fillC(g2, A(sp.warm, 0.5)); g2.restore(); }
      g2.save(); g2.translate(r * 0.008, r * 0.085); g2.scale(1, 1); fp(g2); fillC(g2, sp.s); g2.restore();
      g2.fillStyle = A(sp.s, 0.55); g2.fillRect(cx + nw * 0.35, H.jawY, nw * 3, r);
      if (C.l >= 1) { g2.fillStyle = K.lin(g2, 0, H.C, 0, ny + r * 0.3, [A(sp.d, 0.35), A(sp.s, 0)]); g2.fillRect(cx - r, H.C - r * 0.05, r * 2, r * 0.5); }
      if (arms) clothShade(C, g2, B, { s: sp.s, l: sp.hl, b: sp.b, d: sp.d, ln: sp.ln }, { noFolds: 1, noNeckShadow: 1, sa: 0.8 });
      if (C.m >= 1) for (var s = -1; s <= 1; s += 2) {
        g2.beginPath(); g2.moveTo(cx + s * nw * 0.55, ny + r * 0.13); g2.quadraticCurveTo(cx + s * nw * 1.4, ny + r * 0.1, cx + s * nw * 2.3, ny + r * 0.12);
        strokeW(g2, A(sp.ln, 0.28), 1.1 * u);
      }
      if (H.sex === 'm' && C.m >= 2 && !H.chibi) for (var s2 = -1; s2 <= 1; s2 += 2) {
        g2.beginPath(); g2.moveTo(cx + s2 * nw * 0.7, H.C - r * 0.02); g2.quadraticCurveTo(cx + s2 * nw * 0.45, ny - r * 0.02, cx + s2 * nw * 0.25, ny + r * 0.08);
        strokeW(g2, A(sp.ln, 0.18), 1 * u);
      }
    };
    if (fa) piece(C, g, { f: fa, fill: sp.b, sh: sh, ln: sp.ln, lw: 1.2 * u, ow: 2.4 * u });
    piece(C, g, { f: f, fill: sp.b, sh: sh, ln: sp.ln, lw: 1.2 * u, ow: 2.4 * u });
  }

  /* ---- 领子 ---- */
  function collarShirt(C, g, B, c, o) {
    o = o || {};
    var r = B.r, nw = B.nw, ny = B.ny, cx = B.cx, u = B.u * C.lw, p = pal(c), s;
    var spread = o.open ? 1.35 : 1, len = o.len || 1;
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        var f = function (g2) {
          P(g2, ['M', nw * 0.7, ny - r * 0.12,
            'C', nw * 1.1, ny - r * 0.08, nw * 1.2 * spread, ny + r * 0.02, (nw * 0.95 + r * 0.035) * spread, ny + r * 0.13 * len,
            'L', o.open ? nw * 0.45 : r * 0.012, ny + r * (o.open ? 0.1 : 0.035),
            'C', nw * 0.45, ny - r * 0.0, nw * 0.62, ny - r * 0.06, nw * 0.7, ny - r * 0.12, 'Z'], cx, s);
        };
        piece(C, g, { f: f, fill: p.b, sh: function (g2) {
          if (s > 0) { g2.fillStyle = A(p.s, 0.6); g2.fillRect(cx, ny - r * 0.2, r, r * 0.5); }
          g2.fillStyle = A(p.s, 0.45); g2.fillRect(cx - r, ny - r * 0.2, r * 2, r * 0.07);
          if (C.l >= 2) { f(g2); strokeW(g2, A('#ffffff', 0.5), 2.5 * u); }
        }, ln: p.ln, lw: 1.3 * u });
      })(s);
    }
  }
  function collarWing(C, g, B, c) {
    var r = B.r, nw = B.nw, ny = B.ny, cx = B.cx, u = B.u * C.lw, p = pal(c);
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, ny - r * 0.02], [[nw * 0.85, ny - r * 0.1, nw * 1.0, ny - r * 0.1], [nw * 1.0, ny + r * 0.02], [nw * 0.3, ny + r * 0.03], [0, ny + r * 0.06]]); },
      fill: p.b, sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx, ny - r * 0.2, r, r * 0.4); }, ln: p.ln, lw: 1.2 * u });
    for (var s = -1; s <= 1; s += 2) {
      P(g, ['M', r * 0.01, ny + r * 0.03, 'L', r * 0.06, ny + r * 0.06, 'L', r * 0.07, ny + r * 0.025, 'Z'], cx, s);
      fillC(g, p.b); strokeW(g, p.ln, 1.1 * u);
    }
  }
  function collarBand(C, g, B, c, h) {
    var r = B.r, nw = B.nw, ny = B.ny, cx = B.cx, u = B.u * C.lw, p = pal(c);
    h = (h || 0.09) * r;
    var f = function (g2) { sym(g2, cx, [0, ny - h * 0.6], [[nw * 0.7, ny - h * 0.65, nw * 1.06, ny - h * 0.9], [nw * 1.12, ny + h * 0.1], [nw * 0.6, ny + h * 0.55, 0, ny + h * 0.5]]); };
    piece(C, g, { f: f, fill: p.b, sh: function (g2) { g2.fillStyle = A(p.s, 0.55); g2.fillRect(cx + nw * 0.3, ny - h * 2, r, h * 4); g2.fillStyle = A(p.s, 0.4); g2.fillRect(cx - r, ny + h * 0.2, r * 2, h); }, ln: p.ln, lw: 1.3 * u, ow: 2 * u });
  }
  function collarTurtle(C, g, H, B, c, tex) {
    var r = B.r, nw = B.nw, ny = B.ny, cx = B.cx, u = B.u * C.lw, p = pal(c), i;
    var top = H.C + r * 0.02;
    var f = function (g2) { sym(g2, cx, [0, top + r * 0.02], [[nw * 0.7, top, nw * 1.12, top - r * 0.005], [nw * 1.22, ny - r * 0.02, nw * 1.3, ny + r * 0.06], [nw * 0.7, ny + r * 0.1, 0, ny + r * 0.1]]); };
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, tex || 'knit') : null, sh: function (g2) {
      g2.fillStyle = A(p.s, 0.6); g2.fillRect(cx + nw * 0.35, top - r * 0.1, r, r * 0.4);
      ell(g2, cx, top - r * 0.01, nw * 1.1, r * 0.03); fillC(g2, A(p.d, 0.6));
      if (C.m >= 1) { g2.strokeStyle = A(p.s, 0.8); g2.lineWidth = 1 * u; for (i = -6; i <= 6; i++) { var x = cx + i * nw * 0.18; g2.beginPath(); g2.moveTo(x, top); g2.lineTo(x * 1 + i * r * 0.003, ny + r * 0.08); g2.stroke(); } }
    }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
  }
  function collarRound(C, g, B, c, o) {
    o = o || {};
    var r = B.r, nw = B.nw, ny = B.ny, cx = B.cx, u = B.u * C.lw, p = pal(c), s;
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        var f = function (g2) { P(g2, ['M', r * 0.005, ny + r * 0.03, 'C', nw * 0.4, ny + r * 0.02, nw * 0.9, ny - r * 0.06, nw * 1.12, ny - r * 0.05, 'C', nw * 1.9, ny - r * 0.02, nw * 1.95, ny + r * 0.14, nw * 1.4, ny + r * 0.17, 'C', nw * 0.9, ny + r * 0.2, r * 0.04, ny + r * 0.16, r * 0.005, ny + r * 0.03, 'Z'], cx, s); };
        piece(C, g, { f: f, fill: p.b, sh: function (g2) { if (s > 0) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx, ny - r * 0.2, r, r * 0.5); } g2.fillStyle = A(p.s, 0.4); g2.fillRect(cx - r, ny - r * 0.1, r * 2, r * 0.06); }, ln: p.ln, lw: 1.3 * u, ow: 1.8 * u });
        if (o.lace && C.m >= 1) {
          for (var i = 0; i < 6; i++) { var t = i / 5; circ(g, cx + s * lerp(nw * 0.3, nw * 1.8, t), lerp(ny + r * 0.17, ny + r * 0.15, t) + Math.sin(t * PI) * r * 0.03, r * 0.012); strokeW(g, A(p.ln, 0.5), 0.8 * u); }
        }
      })(s);
    }
  }
  // 水手领（含前襟 V 与条纹）
  function collarSailor(C, g, B, c, stripe, o) {
    o = o || {};
    var r = B.r, nw = B.nw, ny = B.ny, cx = B.cx, u = B.u * C.lw, p = pal(c), s, vy = ny + r * (o.vy || 0.34), sw = B.sw;
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        var f = function (g2) {
          P(g2, ['M', nw * 0.9, ny - r * 0.09, 'C', nw * 1.6, ny - r * 0.05, sw * 0.7, B.shY - r * 0.07, sw * 0.9, B.shY - r * 0.01,
            'L', sw * 0.78, B.shY + r * 0.2, 'C', sw * 0.55, B.shY + r * 0.24, r * 0.12, vy - r * 0.15, 0, vy,
            'L', 0, vy - r * 0.08, 'C', nw * 0.4, ny + r * 0.12, nw * 0.7, ny + r * 0.0, nw * 0.9, ny - r * 0.09, 'Z'], cx, s);
        };
        piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'cotton') : null, sh: function (g2) {
          if (s > 0) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx + sw * 0.3, ny - r * 0.2, r, r); }
          if (C.l >= 1) { g2.fillStyle = K.lin(g2, 0, ny, 0, vy, [A(p.l, 0.2), A(p.d, 0.25)]); g2.fillRect(cx - sw, ny - r * 0.1, sw * 2, vy - ny + r * 0.2); }
          if (stripe) {
            g2.strokeStyle = stripe; g2.lineWidth = 2.2 * u;
            for (var k = 0; k < (C.m >= 1 ? 2 : 1); k++) {
              var o1 = r * (0.03 + k * 0.025);
              g2.beginPath(); g2.moveTo(cx + s * (sw * 0.88 - o1 * 1.2), B.shY - r * 0.02 + o1 * 0.2);
              g2.lineTo(cx + s * (sw * 0.77 - o1 * 1.1), B.shY + r * 0.19 - o1 * 0.9);
              g2.bezierCurveTo(cx + s * (sw * 0.55 - o1), B.shY + r * 0.22 - o1, cx + s * (r * 0.12 - o1 * 0.2), vy - r * 0.15 - o1, cx + s * o1 * 0.3, vy - o1 * 1.5);
              g2.stroke();
            }
          }
        }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
      })(s);
    }
    return vy;
  }
  /* ---- 领带类 ---- */
  function tie(C, g, B, kind, c, y0, len, o) {
    o = o || {};
    var r = B.r, cx = B.cx, ny = B.ny, u = B.u * C.lw, p = pal(c), s;
    y0 = y0 === undefined ? ny + r * 0.03 : y0;
    if (kind === 'bow') {
      var bw = r * (o.w || 0.11), bh = r * 0.05;
      for (s = -1; s <= 1; s += 2) {
        (function (s) {
          piece(C, g, { f: function (g2) { P(g2, ['M', 0, y0, 'C', bw * 0.4, y0 - bh * 1.3, bw, y0 - bh * 1.2, bw, y0 - bh * 0.2, 'L', bw * 0.95, y0 + bh * 0.9, 'C', bw * 0.6, y0 + bh * 1.1, bw * 0.3, y0 + bh * 0.5, 0, y0, 'Z'], cx, s); },
            fill: p.b, sh: function (g2) { if (s > 0) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx, y0 - r * 0.1, r, r * 0.2); } g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx - r, y0 + bh * 0.3, r * 2, bh); }, ln: p.ln, lw: 1.2 * u, ow: 1.5 * u });
        })(s);
      }
      rrect(g, cx - r * 0.022, y0 - bh * 0.65, r * 0.044, bh * 1.3, r * 0.01); fillC(g, p.m); strokeW(g, p.ln, 1.1 * u);
      return;
    }
    if (kind === 'ribbon') {
      var rw = r * (o.w || 0.16), rh = r * 0.07;
      for (s = -1; s <= 1; s += 2) {
        (function (s) {
          // 垂下的飘带
          piece(C, g, { f: function (g2) { P(g2, ['M', r * 0.01, y0 + rh * 0.3, 'C', rw * 0.25, y0 + rh * 1.5, rw * 0.45, y0 + rh * 2.6, rw * 0.6, y0 + rh * 3.6, 'L', rw * 0.38, y0 + rh * 3.3, 'L', rw * 0.22, y0 + rh * 3.8, 'C', rw * 0.15, y0 + rh * 2.6, r * 0.01, y0 + rh * 1.4, 0, y0 + rh * 0.3, 'Z'], cx, s); },
            fill: p.b, sh: function (g2) { g2.fillStyle = A(p.s, s > 0 ? 0.6 : 0.3); g2.fillRect(cx - r, y0, r * 2, r * 0.5); }, ln: p.ln, lw: 1.2 * u, ow: 1.5 * u });
        })(s);
      }
      for (s = -1; s <= 1; s += 2) {
        (function (s) {
          piece(C, g, { f: function (g2) { P(g2, ['M', 0, y0, 'C', rw * 0.3, y0 - rh * 1.4, rw * 1.0, y0 - rh * 1.3, rw, y0 - rh * 0.1, 'C', rw * 0.95, y0 + rh * 0.9, rw * 0.4, y0 + rh * 1.0, 0, y0, 'Z'], cx, s); },
            fill: p.b, sh: function (g2) { if (s > 0) { g2.fillStyle = A(p.s, 0.45); g2.fillRect(cx, y0 - r * 0.1, r, r * 0.2); } ell(g2, cx + s * rw * 0.45, y0, rw * 0.2, rh * 0.35); fillC(g2, A(p.d, 0.5)); if (C.l >= 2) { ell(g2, cx + s * rw * 0.55, y0 - rh * 0.55, rw * 0.22, rh * 0.15); fillC(g2, A('#ffffff', 0.35)); } }, ln: p.ln, lw: 1.2 * u, ow: 1.5 * u });
        })(s);
      }
      rrect(g, cx - r * 0.03, y0 - rh * 0.55, r * 0.06, rh * 1.1, r * 0.015); fillC(g, p.m); strokeW(g, p.ln, 1.1 * u);
      return;
    }
    if (kind === 'scarf') {
      // 水手服领巾：结 + 两条垂片
      var sw2 = r * 0.075;
      for (s = -1; s <= 1; s += 2) {
        (function (s) {
          piece(C, g, { f: function (g2) { P(g2, ['M', 0, y0, 'L', sw2 * 0.9, y0 + r * 0.02, 'L', sw2 * 1.7, y0 + r * 0.2, 'L', sw2 * 0.95, y0 + r * 0.24, 'L', sw2 * 0.6, y0 + r * 0.08, 'Z'], cx, s); },
            fill: p.b, sh: function (g2) { g2.fillStyle = A(p.s, s > 0 ? 0.6 : 0.25); g2.fillRect(cx - r, y0, r * 2, r * 0.3); }, ln: p.ln, lw: 1.2 * u, ow: 1.5 * u });
        })(s);
      }
      piece(C, g, { f: function (g2) { sym(g2, cx, [0, y0 - r * 0.03], [[sw2 * 0.9, y0 - r * 0.025], [sw2 * 0.75, y0 + r * 0.045], [0, y0 + r * 0.05]]); }, fill: p.b,
        sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx, y0 - r * 0.1, r, r * 0.2); if (C.l >= 2) { g2.fillStyle = A('#ffffff', 0.3); g2.fillRect(cx - sw2, y0 - r * 0.025, sw2, r * 0.015); } }, ln: p.ln, lw: 1.2 * u, ow: 1.5 * u });
      return;
    }
    if (kind === 'neckerchief') {
      var nk = B.nw * 1.15;
      piece(C, g, { f: function (g2) { sym(g2, cx, [0, ny - r * 0.06], [[nk, ny - r * 0.08], [nk * 1.08, ny + r * 0.03], [nk * 0.5, ny + r * 0.1, 0, ny + r * 0.11]]); }, fill: p.b,
        sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx + nk * 0.3, ny - r * 0.2, r, r * 0.4); }, ln: p.ln, lw: 1.2 * u, ow: 1.8 * u });
      piece(C, g, { f: function (g2) { P(g2, ['M', -r * 0.03, ny + r * 0.06, 'L', r * 0.04, ny + r * 0.06, 'L', r * 0.07, ny + r * 0.2, 'L', r * 0.0, ny + r * 0.24, 'L', -r * 0.06, ny + r * 0.18, 'Z'], cx, 1); }, fill: p.b,
        sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx, ny, r, r * 0.4); }, ln: p.ln, lw: 1.2 * u, ow: 1.5 * u });
      return;
    }
    // 普通领带
    len = len || r * 0.6;
    var kw = r * 0.04, w0 = r * 0.032, w1 = r * 0.058, loose = o.loose ? r * 0.025 : 0;
    var tx = cx + loose * 0.5;
    piece(C, g, { f: function (g2) { P(g2, ['M', -w0, y0 + r * 0.045, 'L', w0, y0 + r * 0.045, 'L', w1, y0 + len - r * 0.05, 'L', 0, y0 + len, 'L', -w1, y0 + len - r * 0.05, 'Z'], tx, 1); }, fill: p.b,
      sh: function (g2) {
        g2.fillStyle = A(p.s, 0.55); g2.fillRect(tx + r * 0.005, y0, r * 0.1, len);
        if (o.stripe && C.m >= 1) { g2.strokeStyle = A(o.stripe, 0.8); g2.lineWidth = r * 0.012; for (var k = 0; k < 8; k++) { var yy = y0 + r * 0.08 + k * r * 0.07; g2.beginPath(); g2.moveTo(tx - r * 0.08, yy); g2.lineTo(tx + r * 0.08, yy - r * 0.05); g2.stroke(); } }
        if (C.l >= 2) { g2.fillStyle = K.lin(g2, tx - w1, 0, tx + w1, 0, [A('#ffffff', 0), A('#ffffff', 0.18), A('#ffffff', 0)]); g2.fillRect(tx - w1, y0, w1 * 2, len); }
      }, ln: p.ln, lw: 1.2 * u, ow: 1.6 * u });
    piece(C, g, { f: function (g2) { P(g2, ['M', -kw, y0 - r * 0.005, 'L', kw, y0 - r * 0.005, 'L', w0 * 1.05, y0 + r * 0.05, 'L', -w0 * 1.05, y0 + r * 0.05, 'Z'], tx, 1); }, fill: p.m,
      sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(tx, y0 - r * 0.02, r * 0.1, r * 0.1); }, ln: p.ln, lw: 1.2 * u, ow: 1.5 * u });
  }

  /* ---- 外套（前开襟 + 翻领） ---- */
  // o: c, tex, inf, lapel 'notch'|'peak'|'shawl'|'wide'|'none'|'stand', lapW, vy(驳头止点 y 相对 ny 的 r 比例), vx, ox(下摆开口), buttons, double, pocket, satin, cut(燕尾前摆), trim
  function jacket(C, g, H, B, o) {
    var r = B.r, cx = B.cx, nw = B.nw, ny = B.ny, u = B.u * C.lw, s, i;
    var p = pal(o.c), inf = (o.inf === undefined ? 0.03 : o.inf) * r;
    var npx = nw + r * 0.01 + inf * 0.15, npy = ny - r * 0.075;
    var vx = (o.vx === undefined ? 0.012 : o.vx) * r, vy = ny + (o.vy === undefined ? 0.55 : o.vy) * r;
    var ox = (o.ox === undefined ? -0.012 : o.ox) * r, bot = B.bot + 4, sw = B.sw + inf, bw = B.bw + inf, shY = B.shY - inf * 0.35;
    var lapW = (o.lapW || 0.2) * r * (o.lapel === 'wide' ? 1.35 : 1);
    var lp = o.lapel || 'notch';
    function panel(sd) {
      return function (g2) {
        var a = ['M', npx, npy,
          'C', npx + r * 0.07, ny - r * 0.01, sw * 0.52, shY - r * 0.04, sw * 0.86, shY,
          'C', sw * 0.97, shY + r * 0.005, sw + r * 0.005, shY + r * 0.06, sw + r * 0.012, shY + r * 0.16,
          'C', sw + r * 0.03, shY + r * 0.45, bw, bot - r * 0.35, bw, bot];
        if (o.cut) { a.push('L', ox + r * 0.2, bot, 'C', ox + r * 0.08, bot - r * 0.1, vx, vy + r * 0.25, vx, vy); }
        else a.push('L', ox, bot, 'C', ox, lerp(vy, bot, 0.5), vx, vy + (bot - vy) * 0.2, vx, vy);
        if (lp === 'stand' || lp === 'none') a.push('C', vx + r * 0.02, lerp(vy, npy, 0.5), npx - r * 0.05, npy + r * 0.12, npx - r * 0.01, npy);
        else a.push('C', vx + r * 0.04, lerp(vy, npy, 0.4), npx - r * 0.04, npy + r * 0.2, npx, npy);
        a.push('Z');
        P(g2, a, cx, sd);
      };
    }
    function lapel(sd) {
      return function (g2) {
        var lx = npx + lapW, ly = ny + r * 0.17, a;
        if (lp === 'shawl') {
          a = ['M', npx, npy, 'C', npx + r * 0.12, npy + r * 0.02, lx + r * 0.02, ny + r * 0.15, lx * 0.9, ny + r * 0.3,
            'C', lx * 0.7, lerp(ny + r * 0.3, vy, 0.6), vx + r * 0.05, vy - r * 0.08, vx, vy];
        } else if (lp === 'peak') {
          a = ['M', npx, npy, 'L', npx + r * 0.09, npy + r * 0.01, 'Q', npx + lapW * 0.55, ny + r * 0.03, npx + lapW * 0.6, ny + r * 0.1,
            'L', npx + lapW * 0.75, ny + r * 0.12, 'L', lx + r * 0.05, ny + r * 0.04, 'L', lx + r * 0.02, ny + r * 0.16,
            'C', lx - r * 0.01, lerp(ly, vy, 0.4), vx + r * 0.07, vy - r * 0.12, vx, vy];
        } else {
          a = ['M', npx, npy, 'L', npx + r * 0.09, npy + r * 0.01, 'Q', npx + lapW * 0.6, ny + r * 0.02, npx + lapW * 0.62, ny + r * 0.11,
            'L', npx + lapW * 0.72, ny + r * 0.155, 'L', lx, ly,
            'C', lx - r * 0.01, lerp(ly, vy, 0.4), vx + r * 0.07, vy - r * 0.12, vx, vy];
        }
        a.push('C', vx + r * 0.04, lerp(vy, npy, 0.4), npx - r * 0.04, npy + r * 0.2, npx, npy, 'Z');
        P(g2, a, cx, sd);
      };
    }
    var tex = o.tex || 'wool';
    for (s = -1; s <= 1; s += 2) {
      garment(C, g, B, panel(s), o.c, { tex: tex, inf: inf, drape: o.drape, sheen: o.sheen, sh: o.sh });
    }
    // 翻领
    if (lp !== 'none' && lp !== 'stand') {
      var lc = o.lapC || (o.satin ? K.mix(o.c, '#000000', 0.15) : o.c), lpal = pal(lc);
      for (s = -1; s <= 1; s += 2) {
        (function (s) {
          var lf = lapel(s);
          piece(C, g, { f: lf, fill: lpal.b, tex: C.t > 0 && !o.satin ? clothTex(lpal.b, tex) : null, sh: function (g2) {
            if (s > 0) { g2.fillStyle = A(lpal.s, 0.55); g2.fillRect(cx, ny - r * 0.2, r, r); }
            // 驳头翻折处的阴影
            g2.save(); g2.translate(s * r * 0.012, r * 0.01); P(g2, ['M', npx, npy, 'C', npx - r * 0.04, npy + r * 0.2, vx + r * 0.04, lerp(vy, npy, 0.4), vx, vy, 'L', vx - r * 0.1, vy, 'L', npx - r * 0.1, npy, 'Z'], cx, s); fillC(g2, A(lpal.d, 0.35)); g2.restore();
            if (C.l >= 1) { g2.fillStyle = K.lin(g2, 0, ny, 0, vy, [A(lpal.l, o.satin ? 0.35 : 0.15), A(lpal.b, 0), A(lpal.d, 0.2)]); g2.fillRect(cx - r, ny - r * 0.2, r * 2, vy - ny + r * 0.3); }
            if (o.satin && C.l >= 2) { g2.save(); g2.globalCompositeOperation = 'lighter'; lf(g2); g2.strokeStyle = A('#ffffff', 0.14); g2.lineWidth = r * 0.04; g2.stroke(); g2.restore(); }
            if (o.trim) { lf(g2); strokeW(g2, o.trim, r * 0.02); }
          }, ln: lpal.ln, lw: 1.3 * u });
          if (C.m >= 1 && !o.satin) { lf(g); g.save(); lf(g); g.clip(); g.setLineDash ? g.setLineDash([3 * u, 3 * u]) : 0; g.translate(s * r * 0.008, 0); lf(g); strokeW(g, A(lpal.ln, 0.35), 0.8 * u); if (g.setLineDash) g.setLineDash([]); g.restore(); }
        })(s);
      }
    }
    if (lp === 'stand') {
      for (s = -1; s <= 1; s += 2) {
        (function (s) {
          piece(C, g, { f: function (g2) { P(g2, ['M', npx - r * 0.01, npy, 'C', npx - r * 0.01, npy - r * 0.06, npx + r * 0.02, npy - r * 0.1, npx + r * 0.08, npy - r * 0.11, 'L', npx + r * 0.12, npy + r * 0.0, 'C', npx + r * 0.06, npy + r * 0.04, npx + r * 0.02, npy + r * 0.06, npx - r * 0.01, npy, 'Z'], cx, s); },
            fill: p.b, sh: function (g2) { g2.fillStyle = A(p.s, s > 0 ? 0.6 : 0.3); g2.fillRect(cx - r, npy - r * 0.2, r * 2, r * 0.3); }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
        })(s);
      }
    }
    // 纽扣
    var bn = o.buttons === undefined ? 1 : o.buttons, bc = o.btnC || K.mix(o.c, '#000000', 0.45), br = r * 0.018;
    for (i = 0; i < bn; i++) {
      var by = vy + r * 0.05 + i * r * 0.17;
      if (by > bot - r * 0.03) break;
      if (o.double) { button(C, g, cx - r * 0.09, by, br, bc, u); button(C, g, cx + r * 0.09, by, br, bc, u); }
      else if (o.ox === undefined || o.ox < 0.03) button(C, g, cx + (o.ox === undefined ? 0 : r * 0.0) - r * 0.02, by, br, bc, u);
    }
    // 胸袋
    if (o.pocket && C.m >= 1) {
      var px = cx + B.sw * 0.48, py = ny + r * 0.44;
      g.beginPath(); g.moveTo(px - r * 0.08, py + r * 0.008); g.lineTo(px + r * 0.08, py - r * 0.01); strokeW(g, p.ln, 1.3 * u);
      if (o.pocketSq) { P(g, ['M', -r * 0.06, py + r * 0.003, 'L', -r * 0.04, py - r * 0.04, 'L', -r * 0.01, py - r * 0.025, 'L', r * 0.015, py - r * 0.045, 'L', r * 0.03, py - r * 0.006, 'Z'], px, 1); fillC(g, o.pocketSq); strokeW(g, pal(o.pocketSq).ln, 1 * u); }
    }
    return { vy: vy, npx: npx, npy: npy, p: p };
  }
  // 背心（只在外套 V 区可见）
  function vest(C, g, B, c, o) {
    o = o || {};
    var r = B.r, cx = B.cx, ny = B.ny, u = B.u * C.lw, vy = ny + r * (o.vy || 0.3), i;
    var f = function (g2) { sym(g2, cx, [0, vy], [[B.nw * 1.05, ny - r * 0.03], [B.sw * 0.7, ny + r * 0.15], [B.sw * 0.72, B.bot + 4], [0, B.bot + 4]]); };
    var p = garment(C, g, B, f, c, { tex: o.tex || 'wool', noArms: 1, noFolds: 1 });
    for (i = 0; i < 5; i++) { var by = vy + r * 0.04 + i * r * 0.12; if (by > B.bot) break; button(C, g, cx, by, r * 0.014, o.btnC || K.mix(c, '#000', 0.4), u); }
    g.beginPath(); g.moveTo(cx, vy); g.lineTo(cx, B.bot + 4); strokeW(g, A(p.ln, 0.6), 1 * u);
    return vy;
  }
  // 通用：上衣（含领口）
  function top(C, g, B, c, o) {
    o = o || {};
    var f = o.sleeve === 'none' || o.sleeve === 'short' ? torsoPath(B, o.inf || 0, o.nl || {}) : bodyPath(B, o.inf || 0, o.nl || {});
    var p = garment(C, g, B, f, c, { tex: o.tex || 'shirt', noArms: o.sleeve === 'none' || o.sleeve === 'short', drape: o.drape, sheen: o.sheen, sh: o.sh, inf: o.inf || 0 });
    if (o.sleeve === 'short') {
      var r = B.r, u = B.u * C.lw;
      for (var s = -1; s <= 1; s += 2) {
        (function (s) {
          var sw = B.sw, shY = B.shY, aw = B.aw;
          garment(C, g, B, function (g2) { P(g2, ['M', sw * 0.8, shY - r * 0.01, 'C', sw * 0.97, shY + r * 0.005, sw + r * 0.01, shY + r * 0.06, sw + r * 0.03, shY + r * 0.2,
            'L', sw + r * 0.05, shY + r * 0.4, 'C', sw - aw * 0.3, shY + r * 0.44, sw - aw * 0.7, shY + r * 0.42, sw - aw * 0.9, shY + r * 0.36, 'L', sw - aw * 0.88, shY + r * 0.24, 'Z'], B.cx, s); }, c, { tex: o.tex || 'shirt', noFolds: 1, ow: 2.4 * u });
        })(s);
      }
    }
    return p;
  }
  function placket(C, g, B, c, y0, n) {
    var r = B.r, cx = B.cx, u = B.u * C.lw, p = pal(c);
    g.beginPath(); g.moveTo(cx - r * 0.025, y0); g.lineTo(cx - r * 0.025, B.bot + 4); g.moveTo(cx + r * 0.025, y0); g.lineTo(cx + r * 0.025, B.bot + 4); strokeW(g, A(p.ln, 0.4), 1 * u);
    for (var i = 0; i < (n || 4); i++) button(C, g, cx, y0 + r * 0.06 + i * r * 0.15, r * 0.011, K.mix(c, '#808080', 0.3), u);
  }

  /* ====================== 服装预设 ====================== */
  // 每个预设：{ draw(C,g,H,B,o), back?(C,g,H,B,o) 颈后部分, sprite: 小人默认 }；o = 配置 outfit 对象（c 主色 c2 内搭 c3 点缀）
  function dk(c, t) { return K.mix(c, '#000000', t); }
  OUTFIT.shirt = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.c, { tex: 'shirt', nl: { y: B.ny + B.r * 0.05 } });
    if (o.tie && o.tie !== 'none') { collarShirt(C, g, B, o.c); tie(C, g, B, o.tie, o.c3 || '#2a3050'); }
    else { collarShirt(C, g, B, o.c, { open: 1 }); }
    if (C.m >= 1) placket(C, g, B, o.c, B.ny + B.r * 0.2, 4);
  }, sprite: { legs: 'pants' } };
  OUTFIT.coat = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.c2 || '#d8d8e0', { tex: 'shirt' });
    collarShirt(C, g, B, o.c2 || '#d8d8e0');
    if (o.tie !== 'none') tie(C, g, B, o.tie || 'tie', o.c3 || dk(o.c, 0.3), undefined, B.r * 0.7, { loose: 1 });
    jacket(C, g, H, B, { c: o.c, tex: 'wool', lapel: 'wide', vy: 0.42, vx: 0.07, ox: 0.2, buttons: 0, inf: 0.045, drape: 1, pocket: 0 });
  }, sprite: { legs: 'pants', coat: 0.75 } };
  OUTFIT.suit = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.c2 || '#f0f0f0', { tex: 'shirt' });
    collarShirt(C, g, B, o.c2 || '#f0f0f0');
    if (o.tie !== 'none') tie(C, g, B, o.tie || 'tie', o.c3 || '#5a2030', undefined, B.r * 0.62, { stripe: o.stripe });
    jacket(C, g, H, B, { c: o.c, tex: 'wool', lapel: o.lapel || 'notch', vy: 0.56, buttons: 2, pocket: 1, pocketSq: o.pocketSq });
  }, sprite: { legs: 'pants', coat: 0.3 } };
  OUTFIT.suit_tie = OUTFIT.suit;
  OUTFIT.suit_vest = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.c2 || '#ece4d4', { tex: 'shirt' });
    collarShirt(C, g, B, o.c2 || '#ece4d4');
    tie(C, g, B, 'tie', o.c3 || '#6a1a24', undefined, B.r * 0.4);
    vest(C, g, B, o.vestC || K.mix(o.c, '#5a4630', 0.45), { vy: 0.3 });
    jacket(C, g, H, B, { c: o.c, tex: 'tweed', lapel: 'notch', vy: 0.62, vx: 0.06, ox: 0.12, buttons: 0, pocket: 1, pocketSq: '#e8e0d0', inf: 0.04 });
  }, sprite: { legs: 'pants', coat: 0.3 } };
  OUTFIT.white_suit = { draw: function (C, g, H, B, o) {
    var sp = H.sp;
    top(C, g, B, o.c2 || '#c04050', { tex: 'silk', nl: { y: B.ny + B.r * 0.2, v: 1, w: B.nw * 1.1 }, sheen: 1 });
    collarShirt(C, g, B, o.c2 || '#c04050', { open: 1 });
    jacket(C, g, H, B, { c: o.c, tex: 'cotton', lapel: 'peak', vy: 0.6, vx: 0.05, ox: 0.03, buttons: 1, pocket: 1, pocketSq: o.c2 || '#c04050', btnC: '#c8c0b0', sheen: 1 });
    void sp;
  }, sprite: { legs: 'pants', legC: '#e4e4e4', shoe: '#e8e0d8', coat: 0.3 } };
  OUTFIT.labcoat = { draw: function (C, g, H, B, o) {
    if (o.inner) innerTop(C, g, H, B, o.inner, o.c2 || '#506070');
    else { top(C, g, B, o.c2 || '#506070', { tex: 'knit', nl: { y: B.ny + B.r * 0.06 } }); collarTurtle(C, g, H, B, o.c2 || '#506070'); }
    var J = jacket(C, g, H, B, { c: o.c || '#f4f4f4', tex: 'cotton', lapel: 'notch', vy: 0.62, vx: 0.08, ox: 0.2, buttons: 0, inf: 0.04, drape: 1 });
    // 胸袋与笔
    if (C.m >= 1) {
      var r = B.r, px = B.cx + B.sw * 0.46, py = B.ny + r * 0.62, u = B.u * C.lw, p = J.p;
      rrect(g, px - r * 0.1, py, r * 0.2, r * 0.24, r * 0.01); strokeW(g, p.ln, 1.2 * u);
      g.fillStyle = '#304080'; g.fillRect(px - r * 0.06, py - r * 0.08, r * 0.022, r * 0.1);
      g.fillStyle = '#b02030'; g.fillRect(px - r * 0.02, py - r * 0.06, r * 0.022, r * 0.08);
      g.fillStyle = '#c0c0c8'; g.fillRect(px - r * 0.06, py - r * 0.01, r * 0.022, r * 0.03);
    }
  }, sprite: { legs: 'skirt', legC: '#3a4050', coat: 0.9 } };
  OUTFIT.trench = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.c2 || '#30343a', { tex: 'cotton', nl: { y: B.ny + B.r * 0.16, v: 1, w: B.nw * 1.1 } });
    collarShirt(C, g, B, o.c2 || '#30343a', { open: 1 });
    var r = B.r, u = B.u * C.lw;
    jacket(C, g, H, B, { c: o.c, tex: 'canvas', lapel: 'wide', lapW: 0.24, vy: 0.4, vx: 0.1, ox: 0.28, buttons: 0, inf: 0.06, drape: 1 });
    // 肩章与双排扣
    for (var s = -1; s <= 1; s += 2) {
      var x0 = B.cx + s * B.sw * 0.55, x1 = B.cx + s * (B.sw + r * 0.04);
      P(g, ['M', B.sw * 0.55, B.shY - r * 0.06, 'L', B.sw + r * 0.04, B.shY + r * 0.0, 'L', B.sw + r * 0.03, B.shY + r * 0.06, 'L', B.sw * 0.56, B.shY + r * 0.0, 'Z'], B.cx, s);
      fillC(g, K.shade(o.c, s > 0 ? -0.12 : 0.04)); strokeW(g, pal(o.c).ln, 1.2 * u);
      button(C, g, lerp(x0, x1, 0.15), B.shY - r * 0.025, r * 0.012, dk(o.c, 0.4), u);
      for (var i = 0; i < 2; i++) button(C, g, B.cx + s * r * 0.3, B.ny + r * (0.72 + i * 0.2), r * 0.018, dk(o.c, 0.45), u);
    }
  }, sprite: { legs: 'pants', coat: 0.85 } };
  OUTFIT.trench_open = OUTFIT.trench;
  OUTFIT.jacket = { draw: function (C, g, H, B, o) {
    if (o.inner === 'turtle') { top(C, g, B, o.c2, { tex: 'knit', nl: { y: B.ny + B.r * 0.06 } }); collarTurtle(C, g, H, B, o.c2); }
    else { top(C, g, B, o.c2 || '#e0e0e0', { tex: 'shirt' }); collarShirt(C, g, B, o.c2 || '#e0e0e0', { open: 1 }); }
    jacket(C, g, H, B, { c: o.c, tex: o.tex || 'tweed', lapel: 'notch', vy: 0.5, vx: 0.06, ox: 0.16, buttons: 0, inf: 0.035, pocket: 1 });
  }, sprite: { legs: 'pants', coat: 0.3 } };
  OUTFIT.jacket_scarf = { draw: function (C, g, H, B, o) { OUTFIT.jacket.draw(C, g, H, B, { c: o.c, c2: o.c2 || '#38383e', inner: 'turtle', tex: 'tweed' }); }, sprite: { legs: 'pants', coat: 0.3 } };
  OUTFIT.tailcoat = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.c2 || '#f4f4f4', { tex: 'shirt' });
    collarWing(C, g, B, o.c2 || '#f4f4f4');
    if (C.m >= 1) placket(C, g, B, o.c2 || '#f4f4f4', B.ny + B.r * 0.14, 3);
    if (o.vestC) vest(C, g, B, o.vestC, { vy: 0.34 });
    tie(C, g, B, 'bow', o.c3 || '#1a1a1a', B.ny + B.r * 0.03);
    jacket(C, g, H, B, { c: o.c, tex: 'wool', lapel: 'peak', satin: 1, vy: 0.5, vx: 0.08, ox: 0.06, cut: 1, buttons: 0, inf: 0.03, lapC: o.lapC, trim: o.trim });
  }, sprite: { legs: 'pants', coat: 0.8 } };
  OUTFIT.butler = { draw: function (C, g, H, B, o) {
    OUTFIT.tailcoat.draw(C, g, H, B, { c: o.c || '#1a1a1a', c2: o.c2 || '#ffffff', c3: o.c3 || '#1a1a1a', vestC: o.vestC || '#3a3a40' });
  }, sprite: { legs: 'pants', coat: 0.8 } };
  OUTFIT.chef = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, c = o.c || '#f2f2f2';
    garment(C, g, B, bodyPath(B, 0.02 * r, { y: B.ny + r * 0.02 }), c, { tex: 'cotton', drape: 1 });
    // 双排扣前襟
    var p = pal(c);
    g.beginPath(); g.moveTo(cx - B.nw * 0.9, B.ny + r * 0.02); g.bezierCurveTo(cx + r * 0.1, B.ny + r * 0.15, cx + r * 0.18, B.ny + r * 0.3, cx + r * 0.2, B.bot + 4); strokeW(g, p.ln, 1.4 * u);
    for (var i = 0; i < 3; i++) { var by = B.ny + r * (0.28 + i * 0.2); button(C, g, cx - r * 0.06, by, r * 0.02, '#e8e4dc', u); button(C, g, cx + r * 0.32, by, r * 0.02, '#e8e4dc', u); }
    collarBand(C, g, B, c, 0.1);
    tie(C, g, B, 'neckerchief', o.c2 || '#c84030');
  }, sprite: { legs: 'pants', legC: '#3a3a40', coat: 0.4 } };
  OUTFIT.smock = { draw: function (C, g, H, B, o) {
    var r = B.r;
    top(C, g, B, o.c2 || '#506878', { tex: 'knit', nl: { y: B.ny + r * 0.06 } });
    collarTurtle(C, g, H, B, o.c2 || '#506878');
    garment(C, g, B, bodyPath(B, 0.05 * r, { y: B.ny + r * 0.2, w: B.nw * 1.9, ty: B.ny + r * 0.03 }), o.c || '#d8d0c0', { tex: 'canvas', drape: 1, inf: 0.05 * r,
      sh: function (g2, p) {
        // 领口抽褶
        if (C.m >= 1) for (var i = -6; i <= 6; i++) { var x = B.cx + i * B.nw * 0.3; fold(g2, x, B.ny + r * 0.05 + Math.abs(i) * r * 0.002, x + i * r * 0.01, B.ny + r * 0.3, r * 0.005, r * 0.008, A(p.s, 0.8)); }
      } });
  }, sprite: { legs: 'long_skirt', legC: '#506878', coat: 0.6 } };
  OUTFIT.sailor = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.blouse || '#f4f2f6', { tex: 'shirt', nl: { y: B.ny + B.r * 0.3, v: 1, w: B.nw * 1.05 } });
    var vy = collarSailor(C, g, B, o.collarC || '#28304e', '#e8e8f0', { vy: 0.3 });
    tie(C, g, B, 'scarf', o.c2 || o.c3 || '#8a2a3a', vy - B.r * 0.02);
  }, sprite: { legs: 'skirt', legC: '#28304e' } };
  OUTFIT.sailor_cardigan = { draw: function (C, g, H, B, o) {
    var r = B.r;
    top(C, g, B, o.blouse || '#f4f2f6', { tex: 'shirt', nl: { y: B.ny + r * 0.3, v: 1, w: B.nw * 1.05 } });
    jacket(C, g, H, B, { c: o.c, tex: 'knit', lapel: 'none', vy: 0.3, vx: 0.2, ox: 0.24, buttons: 0, inf: 0.035, btnC: '#8a7a68', sh: function (g2, p) {
      if (C.m >= 1) { g2.strokeStyle = A(p.s, 0.6); g2.lineWidth = 1 * B.u * C.lw; for (var i = -8; i <= 8; i++) { if (Math.abs(i) < 2) continue; var x = B.cx + i * B.sw * 0.11; g2.beginPath(); g2.moveTo(x, B.ny); g2.lineTo(x + i * r * 0.004, B.bot); g2.stroke(); } }
    } });
    var vy = collarSailor(C, g, B, o.collarC || '#28304e', '#e8e8f0', { vy: 0.3 });
    tie(C, g, B, 'scarf', o.c2 || '#8a2a3a', vy - r * 0.02);
    for (var s = -1; s <= 1; s += 2) for (var i = 0; i < 3; i++) if (s < 0) button(C, g, B.cx - r * 0.22, B.ny + r * (0.62 + i * 0.16), r * 0.016, '#8a7a68', B.u * C.lw);
  }, sprite: { legs: 'skirt', legC: '#28304e', coat: 0.3 } };
  OUTFIT.coat_over_sailor = { draw: function (C, g, H, B, o) {
    var r = B.r;
    top(C, g, B, o.blouse || '#e8e6ec', { tex: 'shirt', nl: { y: B.ny + r * 0.3, v: 1, w: B.nw * 1.05 } });
    var vy = collarSailor(C, g, B, o.collarC || '#22283e', '#d8d8e4', { vy: 0.3 });
    tie(C, g, B, 'scarf', o.c2 || '#8a2a3a', vy - r * 0.02);
    jacket(C, g, H, B, { c: o.c || '#1a1620', tex: 'wool', lapel: 'wide', vy: 0.34, vx: 0.24, ox: 0.3, buttons: 0, inf: 0.06, drape: 1 });
  }, sprite: { legs: 'skirt', legC: '#22283e', coat: 0.9 } };
  OUTFIT.black_coat_over_sailor = OUTFIT.coat_over_sailor;
  OUTFIT.blazer = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    top(C, g, B, o.c2 || '#ffffff', { tex: 'shirt' });
    collarShirt(C, g, B, o.c2 || '#ffffff');
    tie(C, g, B, o.tie || 'ribbon', o.c3 || '#b02840', B.ny + r * 0.04);
    var J = jacket(C, g, H, B, { c: o.c, tex: 'wool', lapel: 'notch', vy: 0.5, vx: 0.02, buttons: 2, btnC: '#c8a860', lapW: 0.17, trim: o.trim });
    // 校徽
    if (C.m >= 1) {
      var ex = B.cx + B.sw * 0.48, ey = B.ny + r * 0.42;
      P(g, ['M', -r * 0.04, ey - r * 0.04, 'L', r * 0.04, ey - r * 0.04, 'L', r * 0.04, ey + r * 0.01, 'Q', r * 0.04, ey + r * 0.04, 0, ey + r * 0.055, 'Q', -r * 0.04, ey + r * 0.04, -r * 0.04, ey + r * 0.01, 'Z'], ex, 1);
      fillC(g, '#c8a860'); strokeW(g, '#7a5a20', 1 * u);
      circ(g, ex, ey, r * 0.014); fillC(g, J.p.b);
    }
  }, sprite: { legs: 'skirt', legC: '#3a3048', sock: '#202028' } };
  OUTFIT.school_blazer = OUTFIT.blazer;
  OUTFIT.cardigan = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    top(C, g, B, o.c2 || '#e8e8e0', { tex: 'shirt' });
    collarShirt(C, g, B, o.c2 || '#e8e8e0');
    if (o.tie && o.tie !== 'none') tie(C, g, B, o.tie, o.c3 || '#2a3a30', undefined, r * 0.5);
    jacket(C, g, H, B, { c: o.c, tex: 'knit', lapel: 'none', vy: 0.42, vx: 0.01, buttons: 4, btnC: dk(o.c, 0.4), inf: 0.03, sh: function (g2, p) {
      if (C.m >= 1) { g2.strokeStyle = A(p.s, 0.55); g2.lineWidth = 1 * u; for (var i = -9; i <= 9; i++) { var x = B.cx + i * B.sw * 0.1; g2.beginPath(); g2.moveTo(x, B.ny + r * 0.1); g2.lineTo(x + i * r * 0.004, B.bot); g2.stroke(); } }
      g2.fillStyle = A(p.d, 0.4); g2.fillRect(B.cx - B.sw * 1.5, B.bot - r * 0.06, B.sw * 3, r * 0.06);
    } });
  }, sprite: { legs: 'pants' } };
  OUTFIT.cardigan_shirt = OUTFIT.cardigan;
  OUTFIT.sweater = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    if (o.inner) { top(C, g, B, o.c2 || '#e8e8e8', { tex: 'shirt' }); collarShirt(C, g, B, o.c2 || '#e8e8e8'); }
    garment(C, g, B, bodyPath(B, 0.03 * r, { y: B.ny + r * (o.v ? 0.3 : 0.05), v: o.v, w: B.nw * 1.08 }), o.c, { tex: 'knit', inf: 0.03 * r, sh: function (g2, p) {
      if (C.m >= 1) { g2.strokeStyle = A(p.s, 0.6); g2.lineWidth = 1.1 * u; for (var i = -7; i <= 7; i++) { var x = B.cx + i * B.sw * 0.13; g2.beginPath(); g2.moveTo(x, B.ny + r * 0.1); g2.lineTo(x + i * r * 0.004, B.bot); g2.stroke(); } }
      if (C.m >= 2 && o.cable) for (var s = -1; s <= 1; s += 2) for (var k = 0; k < 6; k++) { var cy = B.ny + r * (0.25 + k * 0.16); g2.beginPath(); g2.moveTo(B.cx + s * r * 0.18 - r * 0.04, cy); g2.quadraticCurveTo(B.cx + s * r * 0.18, cy + r * 0.12, B.cx + s * r * 0.18 + r * 0.04, cy + r * 0.16); strokeW(g2, A(p.s, 0.7), 1.8 * u); }
    } });
    if (!o.v) { var p2 = pal(o.c); ell(g, B.cx, B.ny + r * 0.03, B.nw * 1.12, r * 0.055); g.save(); ell(g, B.cx, B.ny + r * 0.03, B.nw * 1.12, r * 0.055); g.clip(); fillC(g, p2.m); g.restore(); strokeW(g, p2.ln, 1.2 * u); }
  }, sprite: { legs: 'pants' } };
  OUTFIT.turtleneck = { draw: function (C, g, H, B, o) {
    top(C, g, B, o.c, { tex: 'knit', nl: { y: B.ny + B.r * 0.06 } });
    collarTurtle(C, g, H, B, o.c);
  }, sprite: { legs: 'pants' } };
  OUTFIT.tshirt = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    skinBody(C, g, H, B, H.sp, 1);
    top(C, g, B, o.c, { tex: 'cotton', sleeve: 'short', nl: { y: B.ny + r * 0.06 } });
    var p = pal(o.c2 || '#ffffff');
    g.beginPath(); g.moveTo(B.cx - B.nw * 1.04, B.ny - r * 0.05); g.bezierCurveTo(B.cx - B.nw * 0.6, B.ny + r * 0.06, B.cx + B.nw * 0.6, B.ny + r * 0.06, B.cx + B.nw * 1.04, B.ny - r * 0.05);
    strokeW(g, p.b, r * 0.025); strokeW(g, A(p.ln, 0.4), 1 * u);
    if (o.print && C.m >= 1) { circ(g, B.cx + r * 0.05, B.ny + r * 0.45, r * 0.09); strokeW(g, A(p.b, 0.85), r * 0.02); }
  }, skinArms: 1, sprite: { legs: 'shorts', legC: '#6a5a48', sock: '#ffffff' } };
  OUTFIT.tshirt_shorts = OUTFIT.tshirt;
  OUTFIT.dress = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, sl = o.sleeve || 'long';
    if (sl !== 'long') skinBody(C, g, H, B, H.sp, 1);
    var nl = o.neck === 'square' ? { y: B.ny + r * 0.16, w: B.nw * 1.8, ty: B.ny + r * 0.05 } : o.neck === 'v' ? { y: B.ny + r * 0.25, v: 1, w: B.nw * 1.2 } : { y: B.ny + r * 0.04 };
    var p = top(C, g, B, o.c, { tex: o.tex || 'cotton', sleeve: sl, nl: nl, sheen: o.sheen, drape: 1 });
    if (o.collar === 'round') collarRound(C, g, B, o.c2 || '#ffffff', { lace: o.lace });
    if (o.ribbon) tie(C, g, B, 'ribbon', o.ribbon, o.collar === 'round' ? B.ny + r * 0.08 : nl.y + r * 0.02, 0, { w: 0.12 });
    if (o.lace && C.m >= 1 && o.collar !== 'round') {
      var y = nl.y; g.beginPath();
      for (var i = 0; i <= 12; i++) { var t = i / 12, x = lerp(B.cx - (nl.w || B.nw) * 1.0, B.cx + (nl.w || B.nw) * 1.0, t); g.moveTo(x + r * 0.015, y + Math.sin(t * PI) * r * 0.04); g.arc(x, y + Math.sin(t * PI) * r * 0.04, r * 0.015, 0, PI); }
      strokeW(g, A(p.ln, 0.4), 1 * u);
    }
    if (o.puff && C.m >= 0) for (var s = -1; s <= 1; s += 2) {
      (function (s) { garment(C, g, B, function (g2) { ell(g2, B.cx + s * (B.sw - r * 0.01), B.shY + r * 0.12, r * 0.12, r * 0.13, s * 0.3); }, o.c, { tex: o.tex || 'cotton', noFolds: 1, noArms: 1, ow: 2 * u }); })(s);
    }
  }, sprite: { legs: 'dress' } };
  OUTFIT.black_dress = { draw: function (C, g, H, B, o) { OUTFIT.dress.draw(C, g, H, B, { c: o.c || '#24202c', c2: o.c2 || '#ffffff', collar: 'round', lace: 1, ribbon: o.c3 || null, tex: 'cotton' }); }, sprite: { legs: 'dress', sock: '#f4f4f4', shoe: '#1a1418' } };
  OUTFIT.white_dress = { draw: function (C, g, H, B, o) { OUTFIT.dress.draw(C, g, H, B, { c: o.c || '#f8f4f0', neck: 'square', sleeve: 'short', puff: 1, lace: 1, ribbon: o.c2 || '#d0a0b0', tex: 'cotton', sheen: 1 }); }, sprite: { legs: 'dress', shoe: '#e8e0d8' } };
  OUTFIT.summer_dress = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    skinBody(C, g, H, B, H.sp, 1);
    top(C, g, B, o.c2 || '#ffffff', { tex: 'cotton', sleeve: 'short', nl: { y: B.ny + r * 0.05 } });
    collarRound(C, g, B, o.c2 || '#ffffff');
    garment(C, g, B, function (g2) { sym(g2, B.cx, [0, B.ny + r * 0.32], [[B.sw * 0.42, B.ny + r * 0.28], [B.sw * 0.46, B.ny + r * 0.1], [B.sw * 0.56, B.ny + r * 0.08], [B.sw * 0.62, B.ny + r * 0.3], [B.sw * 0.68, B.bot + 4], [0, B.bot + 4]]); }, o.c, { tex: 'cotton', noArms: 1, drape: 1 });
    for (var s = -1; s <= 1; s += 2) button(C, g, B.cx + s * B.sw * 0.5, B.ny + r * 0.34, r * 0.018, '#ffffff', u);
  }, skinArms: 1, sprite: { legs: 'dress', sock: '#ffffff', shoe: '#a04030' } };
  OUTFIT.work = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    top(C, g, B, o.c2 || '#a09070', { tex: 'cotton', nl: { y: B.ny + r * 0.15, v: 1, w: B.nw * 1.05 } });
    collarShirt(C, g, B, o.c2 || '#a09070', { open: 1 });
    var J = jacket(C, g, H, B, { c: o.c, tex: 'canvas', lapel: 'notch', lapW: 0.15, vy: 0.36, vx: 0.12, ox: 0.18, buttons: 0, inf: 0.035, drape: 1 });
    if (C.m >= 1) for (var s = -1; s <= 1; s += 2) {
      var px = B.cx + s * B.sw * 0.46, py = B.ny + r * 0.55;
      rrect(g, px - r * 0.1, py, r * 0.2, r * 0.2, r * 0.015); strokeW(g, J.p.ln, 1.3 * u);
      g.beginPath(); g.moveTo(px - r * 0.1, py + r * 0.05); g.lineTo(px + r * 0.1, py + r * 0.05); strokeW(g, J.p.ln, 1.1 * u);
      button(C, g, px, py + r * 0.03, r * 0.012, dk(o.c, 0.4), u);
    }
  }, sprite: { legs: 'pants', legC: '#4a4434' } };
  OUTFIT.work_clothes = OUTFIT.work;
  OUTFIT.fisher = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    top(C, g, B, o.c2 || '#806050', { tex: 'knit', nl: { y: B.ny + r * 0.06 } });
    collarTurtle(C, g, H, B, o.c2 || '#806050');
    jacket(C, g, H, B, { c: o.c, tex: 'canvas', lapel: 'stand', vy: 0.12, vx: 0.11, ox: 0.15, buttons: 0, inf: 0.05, drape: 1 });
    for (var s = -1; s <= 1; s += 2) { var px = B.cx + s * B.sw * 0.48, py = B.ny + r * 0.7; rrect(g, px - r * 0.11, py, r * 0.22, r * 0.07, r * 0.01); fillC(g, K.shade(o.c, -0.1)); strokeW(g, pal(o.c).ln, 1.2 * u); }
  }, sprite: { legs: 'pants', legC: '#3a3a3a', shoe: '#2a2a2a' } };
  OUTFIT.fisher_jacket = OUTFIT.fisher;
  OUTFIT.parka = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, i;
    var f = bodyPath(B, 0.07 * r, { y: B.ny + r * 0.0, w: B.nw * 1.25, ty: H.C - r * 0.02 });
    var p = garment(C, g, B, f, o.c, { tex: 'cotton', inf: 0.07 * r, sh: function (g2, p) {
      // 绗缝
      g2.strokeStyle = A(p.s, 0.9); g2.lineWidth = 1.4 * u;
      for (i = 0; i < 6; i++) { var y = B.ny + r * (0.12 + i * 0.17); g2.beginPath(); g2.moveTo(B.cx - B.sw * 1.4, y + r * 0.04); g2.quadraticCurveTo(B.cx, y - r * 0.03, B.cx + B.sw * 1.4, y + r * 0.04); g2.stroke();
        if (C.l >= 1) { g2.save(); g2.translate(0, r * 0.03); g2.beginPath(); g2.moveTo(B.cx - B.sw * 1.4, y + r * 0.04); g2.quadraticCurveTo(B.cx, y - r * 0.03, B.cx + B.sw * 1.4, y + r * 0.04); strokeW(g2, A(p.l, 0.25), r * 0.03); g2.restore(); } }
    } });
    g.beginPath(); g.moveTo(B.cx, B.ny - r * 0.02); g.lineTo(B.cx, B.bot + 4); strokeW(g, p.ln, 1.6 * u);
    if (C.m >= 1) { g.strokeStyle = A('#c0c0c8', 0.9); g.lineWidth = 1 * u; for (i = 0; i < 40; i++) { var zy = B.ny + i * r * 0.03; if (zy > B.bot) break; g.beginPath(); g.moveTo(B.cx - r * 0.008, zy); g.lineTo(B.cx + r * 0.008, zy); g.stroke(); } }
    rrect(g, B.cx - r * 0.012, B.ny - r * 0.02, r * 0.024, r * 0.05, r * 0.005); fillC(g, '#d0d0d8'); strokeW(g, '#505058', 1 * u);
  }, back: function (C, g, H, B, o) {
    // 兜帽（毛边）在颈后
    var r = B.r, u = B.u * C.lw, fc = o.fur || '#d8ccb8', fp = pal(fc), p = pal(o.c);
    piece(C, g, { f: function (g2) { ell(g2, B.cx, B.ny - r * 0.02, B.nw * 2.6, r * 0.18); }, fill: p.s, ln: p.ln, lw: 1.2 * u, ow: 2.2 * u });
    if (o.fur === false) return;
    var rn = K.rng('fur'), n = K.byModel(C.q, 10, 18, 28);
    piece(C, g, { f: function (g2) {
      g2.beginPath();
      for (var i = 0; i <= n; i++) { var a = PI + i / n * PI, rr = (i % 2 ? 1.0 : 1.12) * (1 + rn.jit(0, 0.04)); var x = B.cx + Math.cos(a) * B.nw * 2.75 * rr, y = B.ny - r * 0.04 + Math.sin(a) * r * 0.2 * rr; if (i) g2.lineTo(x, y); else g2.moveTo(x, y); }
      g2.lineTo(B.cx + B.nw * 2.1, B.ny + r * 0.03); g2.lineTo(B.cx - B.nw * 2.1, B.ny + r * 0.03); g2.closePath();
    }, fill: fp.b, sh: function (g2) { g2.fillStyle = K.lin(g2, 0, B.ny - r * 0.25, 0, B.ny, [A(fp.l, 0.4), A(fp.s, 0.6)]); g2.fillRect(B.cx - r, B.ny - r * 0.3, r * 2, r * 0.4); }, ln: fp.ln, lw: 1 * u, ow: 2 * u });
  }, sprite: { legs: 'pants', coat: 0.5 } };
  OUTFIT.police = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, i, c = o.c || '#1e2a48';
    top(C, g, B, o.c2 || '#b8d0e8', { tex: 'shirt' });
    collarShirt(C, g, B, o.c2 || '#b8d0e8');
    tie(C, g, B, 'tie', o.c3 || '#1a2238', undefined, r * 0.6);
    var J = jacket(C, g, H, B, { c: c, tex: 'wool', lapel: 'notch', lapW: 0.17, vy: 0.5, vx: 0.01, buttons: 3, btnC: '#d8d8e0', pocket: 0 });
    for (var s = -1; s <= 1; s += 2) {
      P(g, ['M', B.sw * 0.45, B.shY - r * 0.07, 'L', B.sw * 0.98, B.shY - r * 0.01, 'L', B.sw * 0.98, B.shY + r * 0.05, 'L', B.sw * 0.46, B.shY - r * 0.01, 'Z'], B.cx, s);
      fillC(g, K.shade(c, s > 0 ? -0.15 : 0.05)); strokeW(g, J.p.ln, 1.2 * u);
      var px = B.cx + s * B.sw * 0.48, py = B.ny + r * 0.42;
      P(g, ['M', -r * 0.1, py, 'L', r * 0.1, py, 'L', r * 0.1, py + r * 0.06, 'L', 0, py + r * 0.08, 'L', -r * 0.1, py + r * 0.06, 'Z'], px, 1); fillC(g, K.shade(c, -0.05)); strokeW(g, J.p.ln, 1.2 * u);
      button(C, g, px, py + r * 0.045, r * 0.011, '#d8d8e0', u);
    }
    // 徽章
    var bx = B.cx + B.sw * 0.48, by = B.ny + r * 0.3;
    g.beginPath(); for (i = 0; i < 10; i++) { var a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.022 : r * 0.045; if (i) g.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr); else g.moveTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr); } g.closePath();
    fillC(g, C.l >= 1 ? K.lin(g, 0, by - r * 0.05, 0, by + r * 0.05, ['#fff0b0', '#c8a040']) : '#d8b050'); strokeW(g, '#6a4a10', 1 * u);
  }, sprite: { legs: 'pants', legC: '#1e2a48' } };
  // 和服（左襟在上）
  function kimonoBody(C, g, H, B, c, eri, under, o) {
    o = o || {};
    var r = B.r, cx = B.cx, nw = B.nw, ny = B.ny, u = B.u * C.lw, cross = ny + r * (o.cross || 0.42);
    var p = garment(C, g, B, bodyPath(B, 0.05 * r, { y: ny + r * 0.04 }), c, { tex: o.tex || 'cotton', inf: 0.05 * r, drape: 1 });
    // 内衬 V
    var vf = function (g2) { g2.beginPath(); g2.moveTo(cx - nw * 1.02, ny - r * 0.06); g2.lineTo(cx, cross); g2.lineTo(cx + nw * 1.02, ny - r * 0.06); g2.quadraticCurveTo(cx, ny + r * 0.05, cx - nw * 1.02, ny - r * 0.06); g2.closePath(); };
    piece(C, g, { f: vf, fill: under, sh: function (g2) { g2.fillStyle = A(pal(under).s, 0.5); g2.fillRect(cx, ny - r * 0.1, r, r * 0.6); }, ln: pal(under).ln, lw: 1.1 * u });
    var ew = r * 0.055, ep = pal(eri);
    // 下层（观者左→右下）衣领
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(cx - nw * 1.04, ny - r * 0.07); g2.lineTo(cx - nw * 1.04 - ew * 1.2, ny - r * 0.02); g2.lineTo(cx - ew * 0.2, cross + ew * 1.5); g2.lineTo(cx + ew * 0.4, cross); g2.closePath(); }, fill: ep.b, ln: ep.ln, lw: 1.1 * u });
    // 上层衣片（观者右肩 → 左下）
    var top_ = function (g2) {
      g2.beginPath(); g2.moveTo(cx + nw * 1.04, ny - r * 0.07);
      g2.lineTo(cx - ew * 0.3, cross); g2.lineTo(cx - B.sw * 0.55, B.bot + 4); g2.lineTo(cx + B.bw + r * 0.06, B.bot + 4); g2.lineTo(cx + B.sw + r * 0.06, B.shY); g2.closePath();
    };
    g.save(); bodyPath(B, 0.05 * r, { y: ny + r * 0.04 })(g); g.clip();
    piece(C, g, { f: top_, fill: p.b, tex: C.t > 0 ? clothTex(p.b, o.tex || 'cotton') : null, sh: function (g2) { clothShade(C, g2, B, p, { inf: 0.05 * r, noNeckShadow: 1 }); g2.save(); g2.translate(-r * 0.02, r * 0.01); top_(g2); g2.restore(); }, ln: p.ln, lw: 1.3 * u });
    g.restore();
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(cx + nw * 1.04, ny - r * 0.07); g2.lineTo(cx + nw * 1.04 + ew * 1.2, ny - r * 0.02); g2.lineTo(cx - ew * 0.3 + ew * 0.9, cross + ew * 1.2); g2.lineTo(cx - B.sw * 0.5 + ew, B.bot + 4); g2.lineTo(cx - B.sw * 0.55, B.bot + 4); g2.lineTo(cx - ew * 0.3, cross); g2.closePath(); },
      fill: ep.b, sh: function (g2) { if (C.l >= 1) { g2.fillStyle = K.lin(g2, 0, ny, 0, B.bot, [A(ep.l, 0.2), A(ep.d, 0.2)]); g2.fillRect(cx - r, ny - r * 0.1, r * 2, B.bot); } }, ln: ep.ln, lw: 1.2 * u });
    return { p: p, cross: cross };
  }
  function obi(C, g, B, c, y, o) {
    o = o || {};
    var r = B.r, u = B.u * C.lw, p = pal(c), x0 = B.cx - B.bw + B.aw * 0.95, x1 = B.cx + B.bw - B.aw * 0.95;
    piece(C, g, { f: function (g2) { rrect(g2, x0, y, x1 - x0, B.bot + 10 - y, 2); }, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'tweed') : null,
      sh: function (g2) { g2.fillStyle = K.lin(g2, 0, y, 0, y + r * 0.2, [A(p.l, 0.3), A(p.s, 0.4)]); g2.fillRect(x0, y, x1 - x0, r * 0.4); if (o.cord) { g2.fillStyle = o.cord; g2.fillRect(x0, y + r * 0.06, x1 - x0, r * 0.02); } }, ln: p.ln, lw: 1.3 * u });
  }
  OUTFIT.kimono = { draw: function (C, g, H, B, o) {
    kimonoBody(C, g, H, B, o.c || '#3a4a6a', o.eri || o.c || '#3a4a6a', o.c2 || '#f0ece4', { tex: 'cotton' });
    if (o.obi !== false) obi(C, g, B, o.c3 || '#8a6a3a', B.ny + B.r * 1.08, { cord: o.cord || '#d0b070' });
  }, sprite: { legs: 'robe' } };
  OUTFIT.haori = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    kimonoBody(C, g, H, B, o.c2 || '#4a4a52', o.c2 || '#4a4a52', o.c4 || '#e8e4dc', { tex: 'cotton', cross: 0.36 });
    if (o.obi) obi(C, g, B, o.obi, B.ny + r * 1.06, { cord: o.cord || '#c84060' });
    var J = jacket(C, g, H, B, { c: o.c || '#2a2a30', tex: 'tweed', lapel: 'none', vy: 0.02, vx: 0.2, ox: 0.28, buttons: 0, inf: 0.08, drape: 1 });
    // 平直的领条
    for (var s = -1; s <= 1; s += 2) {
      P(g, ['M', B.nw * 1.0 + r * 0.01, B.ny - r * 0.08, 'L', B.nw * 1.0 + r * 0.09, B.ny - r * 0.06, 'L', 0.28 * r + r * 0.08, B.bot + 4, 'L', 0.28 * r, B.bot + 4, 'Z'], B.cx, s);
      fillC(g, K.shade(o.c || '#2a2a30', -0.12)); strokeW(g, J.p.ln, 1.2 * u);
    }
    // 羽织纽
    var hc = o.c3 || '#e8e0d0';
    g.beginPath(); g.moveTo(B.cx - r * 0.2, B.ny + r * 0.62); g.quadraticCurveTo(B.cx, B.ny + r * 0.7, B.cx + r * 0.2, B.ny + r * 0.62); strokeW(g, hc, r * 0.018);
    circ(g, B.cx, B.ny + r * 0.68, r * 0.03); fillC(g, hc); strokeW(g, pal(hc).ln, 1 * u);
    if (o.mon && C.m >= 1) for (var s2 = -1; s2 <= 1; s2 += 2) { circ(g, B.cx + s2 * B.sw * 0.55, B.ny + r * 0.32, r * 0.04); strokeW(g, '#e8e4dc', 1.6 * u); }
  }, sprite: { legs: 'robe', legC: '#5a5560' } };
  OUTFIT.miko = { draw: function (C, g, H, B, o) {
    var r = B.r;
    kimonoBody(C, g, H, B, o.c || '#fafaf8', o.c || '#fafaf8', o.c2 || '#c02030', { tex: 'cotton', cross: 0.38 });
    obi(C, g, B, o.c2 || '#c02030', B.ny + r * 1.06, {});
    var u = B.u * C.lw, y = B.ny + r * 1.12;
    g.beginPath(); g.moveTo(B.cx - r * 0.12, y); g.quadraticCurveTo(B.cx, y + r * 0.06, B.cx + r * 0.12, y); strokeW(g, '#f8f4f0', r * 0.02);
  }, sprite: { legs: 'hakama', legC: '#c02030' } };
  OUTFIT.robe = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, c = o.c || '#0a0a10', lin = o.c2 || '#300010';
    garment(C, g, B, bodyPath(B, 0.07 * r, { y: B.ny + r * 0.0, w: B.nw * 1.3 }), c, { tex: 'wool', inf: 0.07 * r, drape: 1 });
    // 前开口与暗红内衬
    var lp = pal(lin);
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, B.ny + r * 0.12], [[r * 0.06, B.ny + r * 0.1], [r * 0.12, B.ny + r * 0.6, r * 0.2, B.bot + 4], [0, B.bot + 4]]); }, fill: lp.b,
      sh: function (g2) { g2.fillStyle = K.lin(g2, cx - r * 0.2, 0, cx + r * 0.2, 0, [A(lp.d, 0.7), A(lp.b, 0), A(lp.d, 0.8)]); g2.fillRect(cx - r * 0.3, B.ny, r * 0.6, B.bot); }, ln: pal(c).ln, lw: 1.4 * u });
    for (var s = -1; s <= 1; s += 2) { g.beginPath(); g.moveTo(cx + s * r * 0.05, B.ny + r * 0.1); g.bezierCurveTo(cx + s * r * 0.12, B.ny + r * 0.6, cx + s * r * 0.15, B.bot - r * 0.2, cx + s * r * 0.2, B.bot + 4); strokeW(g, A(pal(c).l, 0.35), 1.6 * u); }
    // 领扣
    var cl = o.clasp || '#a08850';
    circ(g, cx, B.ny + r * 0.12, r * 0.032); fillC(g, C.l >= 1 ? K.rad(g, cx - r * 0.01, B.ny + r * 0.11, 0, r * 0.04, ['#f0e0a0', cl, dk(cl, 0.4)]) : cl); strokeW(g, dk(cl, 0.6), 1.1 * u);
  }, sprite: { legs: 'robe' } };
  OUTFIT.black_robe = OUTFIT.robe;
  OUTFIT.nurse = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    top(C, g, B, o.c || '#f4f6fa', { tex: 'cotton', nl: { y: B.ny + r * 0.22, v: 1, w: B.nw * 1.1 } });
    collarShirt(C, g, B, o.c || '#f4f6fa', { open: 1 });
    placket(C, g, B, o.c || '#f4f6fa', B.ny + r * 0.24, 4);
    var tx = B.cx + B.sw * 0.45, ty = B.ny + r * 0.38;
    rrect(g, tx - r * 0.09, ty, r * 0.18, r * 0.06, r * 0.008); fillC(g, '#ffffff'); strokeW(g, '#6080a0', 1 * u);
    g.fillStyle = '#6080a0'; g.fillRect(tx - r * 0.07, ty + r * 0.025, r * 0.1, r * 0.01);
    if (o.c2) { g.beginPath(); g.moveTo(B.cx - B.nw * 1.2, B.ny - r * 0.02); g.lineTo(B.cx - B.sw * 0.2, B.bot); strokeW(g, A(o.c2, 0.0), 1); }
  }, sprite: { legs: 'skirt', legC: '#f4f6fa', shoe: '#f4f4f4' } };
  OUTFIT.maid = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx;
    top(C, g, B, o.c || '#1e1c24', { tex: 'cotton', nl: { y: B.ny + r * 0.04 } });
    collarRound(C, g, B, '#ffffff', {});
    var ap = pal(o.c2 || '#f8f8f8');
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, B.ny + r * 0.36], [[B.sw * 0.38, B.ny + r * 0.34], [B.sw * 0.45, B.bot + 4], [0, B.bot + 4]]); }, fill: ap.b,
      sh: function (g2) { clothShade(C, g2, B, ap, { noArms: 1, noNeckShadow: 1, drape: 1 }); }, ln: ap.ln, lw: 1.3 * u });
    for (var s = -1; s <= 1; s += 2) {
      (function (s) {
        piece(C, g, { f: function (g2) { P(g2, ['M', B.sw * 0.36, B.ny + r * 0.36, 'C', B.sw * 0.5, B.ny + r * 0.2, B.sw * 0.6, B.shY - r * 0.02, B.sw * 0.72, B.shY - r * 0.05, 'L', B.sw * 0.8, B.shY + r * 0.02, 'C', B.sw * 0.66, B.shY + r * 0.06, B.sw * 0.55, B.ny + r * 0.3, B.sw * 0.44, B.ny + r * 0.42, 'Z'], cx, s); }, fill: ap.b, ln: ap.ln, lw: 1.2 * u });
      })(s);
    }
    tie(C, g, B, 'ribbon', o.c3 || '#1e1c24', B.ny + r * 0.07, 0, { w: 0.1 });
  }, sprite: { legs: 'dress', shoe: '#1a1a1a', sock: '#ffffff' } };
  OUTFIT.tshirt_shorts = OUTFIT.tshirt;

  /* ====================== 手与道具 ====================== */
  // 手：wx,wy 手腕位置；ang 手指朝向；k 尺寸（相对 r）；pose 'fist'|'hold'|'chin'|'open'；c 皮肤或手套色
  // 手：四指轮廓（指尖圆弧 + 指缝线 + 指节）+ 独立拇指；局部坐标手腕在原点、手指朝 -y
  function hand(C, g, H, x, y, ang, k, pose, c, sd, o) {
    o = o || {};
    var r = H.r, u = H.u * C.lw, s = r * 0.19 * k, p = pal(c), sp = o.skin ? H.sp : null, ln = sp ? sp.ln : p.ln, sh = sp ? sp.s : p.s, hl = sp ? sp.hl : p.l, i;
    var open = pose === 'open';
    // 每根手指 [左x, 右x, 指尖y]（食指→小指）；握持时手指弯曲，只看到到第二指节
    var F = open ? [[-0.6, -0.31, -2.05], [-0.3, 0.0, -2.2], [0.01, 0.3, -2.1], [0.31, 0.56, -1.85]]
                 : [[-0.62, -0.32, -1.52], [-0.31, 0.0, -1.62], [0.01, 0.31, -1.56], [0.32, 0.58, -1.4]];
    if (o.missing) for (i = 0; i < o.missing && i < 2; i++) F[3 - i][2] = o.knit ? F[3 - i][2] * 0.86 : -1.0;   // 缺指：手套里的空指略短而塌
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(sd || 1, 1);
    var notchY = function (i) { return Math.max(F[i][2], F[i + 1][2]) + 0.24; };
    var body = function (g2) {
      g2.beginPath(); g2.moveTo(-s * 0.46, s * 0.15);
      g2.bezierCurveTo(-s * 0.6, -s * 0.3, -s * 0.68, -s * 0.7, F[0][0] * s, -s * 0.95);
      for (var j = 0; j < 4; j++) {
        var xl = F[j][0] * s, xr = F[j][1] * s, ty = F[j][2] * s, rr = (xr - xl) / 2;
        g2.lineTo(xl, ty + rr * 1.1);
        g2.quadraticCurveTo(xl, ty, (xl + xr) / 2, ty);
        g2.quadraticCurveTo(xr, ty, xr, ty + rr * 1.1);
        if (j < 3) g2.lineTo(xr, notchY(j) * s);
      }
      g2.lineTo(F[3][1] * s, -s * 0.95);
      g2.bezierCurveTo(s * 0.66, -s * 0.65, s * 0.58, -s * 0.25, s * 0.46, s * 0.15);
      g2.closePath();
    };
    piece(C, g, { f: body, fill: c, sh: function (g2) {
      g2.fillStyle = A(sh, 0.55); g2.fillRect(s * 0.3, -s * 2.4, s, s * 2.7);
      if (!open) { g2.fillStyle = K.lin(g2, 0, -s * 1.1, 0, -s * 1.65, [A(sh, 0), A(sh, 0.45)]); g2.fillRect(-s, -s * 1.7, s * 2, s * 0.6); }
      if (C.l >= 1) { g2.fillStyle = K.rad(g2, -s * 0.2, -s * 0.7, 0, s * 0.7, [A(hl, 0.35), A(hl, 0)]); g2.fillRect(-s, -s * 1.5, s * 2, s * 1.7); }
      // 指节
      if (C.m >= 1) for (var j = 0; j < 4; j++) { var kx = (F[j][0] + F[j][1]) / 2 * s; ell(g2, kx, -s * 1.0, s * 0.1, s * 0.06); fillC(g2, A(hl, 0.32)); if (C.l >= 1) { ell(g2, kx + s * 0.04, -s * 1.0 + s * 0.08, s * 0.08, s * 0.03); fillC(g2, A(sh, 0.3)); } }
    }, ln: ln, lw: 1.1 * u, ow: 1.8 * u });
    // 指缝线（从指缝向下延伸到指节）
    g.strokeStyle = ln; g.lineWidth = 1.1 * u;
    for (i = 0; i < 3; i++) { var nx = F[i][1] * s; g.beginPath(); g.moveTo(nx, notchY(i) * s); g.quadraticCurveTo(nx - s * 0.02, -s * 1.08, nx + s * 0.01, -s * 0.92); g.stroke(); }
    if (!open && C.m >= 1) { g.beginPath(); g.moveTo(F[0][0] * s + s * 0.05, -s * 1.28); g.quadraticCurveTo(0, -s * 1.36, F[3][1] * s - s * 0.05, -s * 1.22); strokeW(g, A(ln, 0.35), 0.9 * u); }
    // 拇指
    var th = function (g2) { g2.beginPath(); g2.moveTo(-s * 0.5, -s * 0.12); g2.bezierCurveTo(-s * 0.92, -s * 0.38, -s * 1.02, -s * 0.9, -s * 0.8, -s * 1.12);
      g2.quadraticCurveTo(-s * 0.68, -s * 1.22, -s * 0.58, -s * 1.08); g2.bezierCurveTo(-s * 0.6, -s * 0.85, -s * 0.5, -s * 0.62, -s * 0.42, -s * 0.48); g2.closePath(); };
    piece(C, g, { f: th, fill: c, sh: function (g2) { if (C.l >= 1) { g2.fillStyle = A(hl, 0.25); g2.fillRect(-s * 1.1, -s * 1.3, s * 0.3, s * 1.2); } g2.fillStyle = A(sh, 0.4); g2.fillRect(-s * 0.7, -s * 1.3, s * 0.3, s * 1.3); }, ln: ln, lw: 1.1 * u, ow: 1.6 * u });
    if (C.m >= 1) { g.beginPath(); g.moveTo(-s * 0.86, -s * 0.98); g.quadraticCurveTo(-s * 0.76, -s * 0.94, -s * 0.66, -s * 1.0); strokeW(g, A(ln, 0.45), 0.9 * u); }
    if (o.glove) { g.beginPath(); g.moveTo(-s * 0.48, s * 0.05); g.quadraticCurveTo(0, s * 0.12, s * 0.48, s * 0.05); strokeW(g, A(p.ln, 0.6), 1.2 * u);
      if (C.m >= 1) { g.beginPath(); g.moveTo(-s * 0.12, -s * 0.15); g.lineTo(-s * 0.1, -s * 0.75); g.moveTo(s * 0.16, -s * 0.15); g.lineTo(s * 0.14, -s * 0.75); strokeW(g, A(p.s, 0.7), 0.9 * u); } }
    if (o.watch) { rrect(g, -s * 0.5, s * 0.12, s, s * 0.26, s * 0.08); fillC(g, o.watch === true ? '#1a1a1e' : o.watch); strokeW(g, '#000000', 1 * u); rrect(g, -s * 0.28, s * 0.1, s * 0.56, s * 0.3, s * 0.06); fillC(g, '#2a2e2a'); rrect(g, -s * 0.2, s * 0.15, s * 0.4, s * 0.2, s * 0.03); fillC(g, '#9ab09a'); }
    if (o.knit && C.m >= 1) { g.save(); body(g); g.clip(); g.strokeStyle = A(p.s, 0.6); g.lineWidth = 0.9 * u; for (i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-s * 0.7, -s * (0.1 + i * 0.18)); g.lineTo(s * 0.7, -s * (0.1 + i * 0.18)); g.stroke(); } g.restore(); g.fillStyle = A(p.d, 0.6); g.fillRect(-s * 0.5, -s * 0.05, s, s * 0.18); }
    g.restore();
  }
  // 从画面下缘伸上来的前臂（袖子）
  function forearm(C, g, B, x0, x1, y1, c, cuff) {
    var r = B.r, u = B.u * C.lw, p = pal(c), w0 = r * 0.2, w1 = r * 0.105, y0 = B.bot + 12;
    var dx = x1 - x0, dy = y1 - y0, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
    var bend = r * 0.035 * (dx > 0 ? -1 : 1);
    var f = function (g2) {
      g2.beginPath(); g2.moveTo(x0 + nx * w0 * 1.1, y0 + ny * w0 * 1.1);
      g2.bezierCurveTo(lerp(x0, x1, 0.4) + nx * (w0 + bend), lerp(y0, y1, 0.4) + ny * (w0 + bend), lerp(x0, x1, 0.8) + nx * (w1 * 1.25 + bend * 0.5), lerp(y0, y1, 0.8) + ny * (w1 * 1.25 + bend * 0.5), x1 + nx * w1, y1 + ny * w1);
      g2.quadraticCurveTo(x1 + dx / l * r * 0.02, y1 + dy / l * r * 0.02, x1 - nx * w1, y1 - ny * w1);
      g2.bezierCurveTo(lerp(x0, x1, 0.8) - nx * (w1 * 1.2 - bend * 0.5), lerp(y0, y1, 0.8) - ny * (w1 * 1.2 - bend * 0.5), lerp(x0, x1, 0.4) - nx * (w0 - bend), lerp(y0, y1, 0.4) - ny * (w0 - bend), x0 - nx * w0 * 1.1, y0 - ny * w0 * 1.1);
      g2.closePath();
    };
    // 前臂在身体上的柔和投影（只落在已画的身体上）
    if (C.l >= 1 && C.g) {
      var mg = C.g; mg.save(); mg.globalCompositeOperation = 'source-atop';
      for (var sk = 0; sk < 3; sk++) { mg.save(); mg.translate(r * (0.012 + sk * 0.012), r * (0.01 + sk * 0.01)); f(mg); mg.fillStyle = 'rgba(20,10,30,' + (0.12 - sk * 0.03) + ')'; mg.fill(); mg.restore(); }
      mg.restore();
    }
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'wool') : null, sh: function (g2) {
      g2.fillStyle = K.lin(g2, x1 - nx * w0, y1 - ny * w0, x1 + nx * w0, y1 + ny * w0, [A(p.d, 0.5), A(p.b, 0), A(p.l, 0.18)]); g2.fillRect(Math.min(x0, x1) - r, Math.min(y0, y1) - r * 0.3, Math.abs(dx) + r * 2, Math.abs(dy) + r * 0.6);
      if (C.l >= 1) { g2.fillStyle = K.lin(g2, 0, y1, 0, y0, [A(p.d, 0), A(p.d, 0.4)]); g2.fillRect(Math.min(x0, x1) - r, y1, Math.abs(dx) + r * 2, y0 - y1 + 20); }
      if (C.m >= 1) for (var wk = 0; wk < 2; wk++) { var tt = 0.86 - wk * 0.08; fold(g2, lerp(x0, x1, tt) - nx * w1 * 0.9, lerp(y0, y1, tt) - ny * w1 * 0.9, lerp(x0, x1, tt - 0.04) + nx * w1 * 0.5, lerp(y0, y1, tt - 0.04) + ny * w1 * 0.5, r * 0.008, r * 0.008, A(p.s, 0.7)); }
      if (C.m >= 1) { fold(g2, lerp(x0, x1, 0.25) - nx * w0 * 0.3, lerp(y0, y1, 0.25) - ny * w0 * 0.3, lerp(x0, x1, 0.7) - nx * w1 * 0.2, lerp(y0, y1, 0.7) - ny * w1 * 0.2, r * 0.015, r * 0.012, A(p.s, 0.7));
        fold(g2, lerp(x0, x1, 0.55) + nx * w0 * 0.4, lerp(y0, y1, 0.55) + ny * w0 * 0.4, lerp(x0, x1, 0.85) + nx * w1 * 0.3, lerp(y0, y1, 0.85) + ny * w1 * 0.3, -r * 0.01, r * 0.01, A(p.s, 0.6)); }
    }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    cuff = cuff || K.shade(c, -0.12);
    if (cuff) {
      var cp = pal(cuff), bx = (x0 - x1) / l * r * 0.05, by = (y0 - y1) / l * r * 0.05;
      g.beginPath(); g.moveTo(x1 + nx * w1 * 1.05, y1 + ny * w1 * 1.05); g.lineTo(x1 - nx * w1 * 1.05, y1 - ny * w1 * 1.05);
      g.lineTo(x1 - nx * w1 + bx, y1 - ny * w1 + by); g.lineTo(x1 + nx * w1 + bx, y1 + ny * w1 + by); g.closePath();
      fillC(g, cp.b); strokeW(g, cp.ln, 1.1 * u);
    }
    return Math.atan2(dy, dx) + PI / 2;
  }
  var PROP = {};
  HC.parts.prop = PROP;
  // 手的选项：手套色/毛线手套/缺指（只作用于道具一侧的手）/手表
  function hopt(o, cf, other) {
    var gl = o.glove || cf._gloveC;
    return { skin: !gl, glove: !!gl, knit: !!o.knit, missing: other ? 0 : (o.missing || 0), watch: other ? null : (o.watch || null) };
  }
  PROP.notebook = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, c = o.c || '#b02838', p = pal(c), sd = o.side || 1;
    var x = cx + sd * B.sw * 0.4, y = B.ny + r * 0.6, w = r * 0.32, h = r * 0.44, ang = -sd * 0.16;
    var wx = x + Math.cos(ang) * (-sd * w * 0.08) - Math.sin(ang) * (h * 0.5 + r * 0.07), wy = y + Math.sin(ang) * (-sd * w * 0.08) + Math.cos(ang) * (h * 0.5 + r * 0.07);
    forearm(C, g, B, cx + sd * B.sw * 0.98, wx, wy + r * 0.02, cf._sleeveC, cf._cuffC);
    g.save(); g.translate(x, y); g.rotate(ang);
    piece(C, g, { f: function (g2) { rrect(g2, -w / 2 + r * 0.01, -h / 2 + r * 0.012, w, h, r * 0.012); }, fill: '#f0e8d8', ln: '#8a7a60', lw: 1 * u });
    piece(C, g, { f: function (g2) { rrect(g2, -w / 2, -h / 2, w, h, r * 0.015); }, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'leather') : null, sh: function (g2) {
      g2.fillStyle = K.lin(g2, -w / 2, -h / 2, w / 2, h / 2, [A(p.l, 0.35), A(p.b, 0), A(p.d, 0.4)]); g2.fillRect(-w, -h, w * 2, h * 2);
      g2.fillStyle = A(p.d, 0.5); g2.fillRect(-w / 2, -h / 2, r * 0.035, h);
      g2.fillStyle = '#e0c070'; g2.fillRect(w * 0.15, -h / 2, r * 0.02, h * 0.3);
      if (C.l >= 2) { g2.fillStyle = A('#ffffff', 0.25); g2.fillRect(-w / 2 + r * 0.05, -h / 2 + r * 0.02, w * 0.6, r * 0.012); }
    }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
    g.restore();
    hand(C, g, H, wx, wy, ang, 0.86, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.book = function (C, g, H, B, o, cf) { PROP.notebook(C, g, H, B, { c: o.c || '#4a3a28', side: o.side, glove: o.glove }, cf); };
  PROP.doll = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, cx = B.cx + (o.dx || 0.04) * r, y = B.bot - r * 0.58, k = 1.35;
    var kc = o.c || '#b02838', kp = pal(kc), hp = hairPal(o.hair || '#141018'), sk = skinPal(o.skin || '#fbeee6'), s;
    var gc = o.glove || cf._gloveC || H.sp.b, sk2 = !(o.glove || cf._gloveC);
    // 和服身体
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, y + r * 0.1 * k], [[r * 0.12 * k, y + r * 0.1 * k], [r * 0.24 * k, y + r * 0.5 * k, r * 0.25 * k, y + r * 0.62 * k], [0, y + r * 0.64 * k]]); }, fill: kp.b, tex: C.t > 0 ? clothTex(kp.b, 'tweed') : null,
      sh: function (g2) { g2.fillStyle = A(kp.s, 0.6); g2.fillRect(cx + r * 0.03, y, r * 0.4, r); if (C.m >= 1) { g2.strokeStyle = A('#f0d080', 0.85); g2.lineWidth = 1.4 * u; for (var i = 0; i < 5; i++) { circ(g2, cx - r * 0.12 + i * r * 0.06, y + r * (0.32 + (i % 2) * 0.1) * k, r * 0.022); g2.stroke(); } }
        g2.fillStyle = '#e8c860'; g2.fillRect(cx - r * 0.3, y + r * 0.3 * k, r * 0.6, r * 0.06 * k); }, ln: kp.ln, lw: 1.2 * u, ow: 2 * u });
    g.beginPath(); g.moveTo(cx - r * 0.09 * k, y + r * 0.1 * k); g.lineTo(cx, y + r * 0.24 * k); g.lineTo(cx + r * 0.09 * k, y + r * 0.1 * k); strokeW(g, '#f4f0e8', r * 0.022);
    // 抱着人偶的双臂
    forearm(C, g, B, cx - B.sw * 0.75, cx - r * 0.12, y + r * 0.55, cf._sleeveC, cf._cuffC);
    forearm(C, g, B, cx + B.sw * 0.8, cx + r * 0.16, y + r * 0.47, cf._sleeveC, cf._cuffC);
    hand(C, g, H, cx - r * 0.12, y + r * 0.56, 1.15, 0.92, 'hold', gc, 1, hopt(o, cf));
    hand(C, g, H, cx + r * 0.16, y + r * 0.48, -1.2, 0.92, 'hold', gc, -1, hopt(o, cf, 1));
    // 头
    var hr = r * 0.11 * k;
    piece(C, g, { f: function (g2) { ell(g2, cx, y, hr, hr * 1.04); }, fill: sk.b, sh: function (g2) { ell(g2, cx + hr * 0.9, y + hr * 0.1, hr * 0.5, hr * 1.1); fillC(g2, A(sk.s, 0.6)); }, ln: sk.ln, lw: 1.2 * u, ow: 1.8 * u });
    // 齐刘海娃娃头
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(cx - hr * 1.14, y + hr * 0.9); g2.bezierCurveTo(cx - hr * 1.38, y - hr * 0.9, cx - hr * 0.7, y - hr * 1.38, cx, y - hr * 1.38);
      g2.bezierCurveTo(cx + hr * 0.7, y - hr * 1.38, cx + hr * 1.38, y - hr * 0.9, cx + hr * 1.14, y + hr * 0.9); g2.lineTo(cx + hr * 0.82, y + hr * 0.9); g2.lineTo(cx + hr * 0.82, y - hr * 0.2);
      g2.lineTo(cx - hr * 0.82, y - hr * 0.2); g2.lineTo(cx - hr * 0.82, y + hr * 0.9); g2.closePath(); }, fill: hp.b,
      sh: function (g2) { g2.fillStyle = A(hp.h, 0.6); g2.fillRect(cx - hr * 0.9, y - hr * 0.95, hr * 0.7, hr * 0.12); g2.fillStyle = A(hp.s, 0.5); g2.fillRect(cx + hr * 0.25, y - hr * 2, hr * 2, hr * 3); }, ln: hp.ln, lw: 1.2 * u, ow: 1.8 * u });
    for (s = -1; s <= 1; s += 2) { ell(g, cx + s * hr * 0.38, y + hr * 0.22, hr * 0.12, hr * 0.16); fillC(g, '#1a1018'); if (C.l >= 1) { circ(g, cx + s * hr * 0.38 - hr * 0.04, y + hr * 0.16, hr * 0.045); fillC(g, '#ffffff'); } }
    circ(g, cx, y + hr * 0.62, hr * 0.07); fillC(g, '#c03040');
    if (C.l >= 1) { for (s = -1; s <= 1; s += 2) { ell(g, cx + s * hr * 0.6, y + hr * 0.5, hr * 0.18, hr * 0.09); fillC(g, A('#ff8090', 0.4)); } }
    // 发饰
    circ(g, cx + hr * 0.95, y - hr * 0.8, hr * 0.2); fillC(g, '#d04050'); strokeW(g, '#6a1020', 1 * u);
  };
  PROP.cane = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.58, y = B.bot - r * 0.3, wc = o.c || '#3a2418', p = pal(wc);
    var top = y - r * 0.12, cr = r * 0.11;
    // 杖身
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(x - r * 0.02, B.bot + 10); g2.lineTo(x - r * 0.02, top); g2.lineTo(x + r * 0.02, top); g2.lineTo(x + r * 0.02, B.bot + 10); g2.closePath(); },
      fill: p.b, sh: function (g2) { g2.fillStyle = K.lin(g2, x - r * 0.02, 0, x + r * 0.02, 0, [A(p.l, 0.6), A(p.b, 0), A(p.d, 0.6)]); g2.fillRect(x - r * 0.03, top, r * 0.06, r); }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
    // 弯柄（朝身体外侧弯）
    var crook = function (g2) { g2.beginPath(); g2.moveTo(x - r * 0.022, top + r * 0.01); g2.bezierCurveTo(x - r * 0.026, top - cr * 1.25, x + sd * cr * 2.1, top - cr * 1.3, x + sd * cr * 2.0, top + cr * 0.1);
      g2.lineTo(x + sd * cr * 1.62, top + cr * 0.1); g2.bezierCurveTo(x + sd * cr * 1.7, top - cr * 0.85, x + r * 0.018, top - cr * 0.8, x + r * 0.022, top + r * 0.01); g2.closePath(); };
    piece(C, g, { f: crook, fill: p.b, sh: function (g2) { g2.fillStyle = K.lin(g2, 0, top - cr * 1.3, 0, top, [A(p.l, 0.5), A(p.d, 0.5)]); g2.fillRect(x - cr * 3, top - cr * 2, cr * 6, cr * 2.5);
      if (C.l >= 2) { g2.beginPath(); g2.arc(x + sd * cr * 0.95, top - cr * 0.1, cr * 0.85, PI * 1.15, PI * 1.6); strokeW(g2, A('#ffffff', 0.35), r * 0.01); } }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
    rrect(g, x - r * 0.026, top + r * 0.005, r * 0.052, r * 0.035, r * 0.006); fillC(g, C.l >= 1 ? K.lin(g, x - r * 0.03, 0, x + r * 0.03, 0, ['#f0f0f8', '#9090a0', '#c8c8d0']) : '#b8b8c4'); strokeW(g, '#505060', 1 * u);
    // 握住杖身的手（手背朝外，手指横向绕住杖身）
    var gx = x, gy = top + r * 0.15;
    forearm(C, g, B, x + sd * r * 0.42, gx + sd * r * 0.15, gy + r * 0.02, cf._sleeveC, cf._cuffC);
    hand(C, g, H, gx + sd * r * 0.13, gy, -sd * PI / 2, 0.72, 'hold', o.glove || cf._gloveC || H.sp.b, -sd, hopt(o, cf));
  };
  PROP.cards = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.82, y = B.shY + r * 0.12, i;
    forearm(C, g, B, B.cx + sd * B.sw * 0.98, x, y + r * 0.2, cf._sleeveC, cf._cuffC);
    var suits = ['#c02030', '#1a1a1a', '#c02030', '#1a1a1a'];
    for (i = 0; i < 4; i++) {
      g.save(); g.translate(x - sd * r * 0.02, y + r * 0.02); g.rotate(-sd * 0.5 + i * sd * 0.28);
      piece(C, g, { f: function (g2) { rrect(g2, -r * 0.075, -r * 0.24, r * 0.15, r * 0.21, r * 0.012); }, fill: '#fbfaf6', sh: function (g2) { g2.fillStyle = A('#8890b0', 0.25); g2.fillRect(0, -r * 0.3, r * 0.1, r * 0.3); }, ln: '#5a5a70', lw: 1 * u, ow: 1.6 * u });
      g.fillStyle = suits[i];
      if (i % 2) { g.beginPath(); g.moveTo(0, -r * 0.17); g.lineTo(r * 0.028, -r * 0.13); g.lineTo(0, -r * 0.09); g.lineTo(-r * 0.028, -r * 0.13); g.closePath(); g.fill(); }
      else { circ(g, -r * 0.012, -r * 0.14, r * 0.016); g.fill(); circ(g, r * 0.012, -r * 0.14, r * 0.016); g.fill(); g.beginPath(); g.moveTo(-r * 0.027, -r * 0.133); g.lineTo(0, -r * 0.1); g.lineTo(r * 0.027, -r * 0.133); g.fill(); }
      g.restore();
    }
    hand(C, g, H, x, y + r * 0.2, sd * 0.25, 0.95, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.phone = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.5, y = B.ny + r * 0.6;
    forearm(C, g, B, B.cx + sd * B.sw * 0.95, x, y + r * 0.22, cf._sleeveC, cf._cuffC);
    piece(C, g, { f: function (g2) { rrect(g2, x - r * 0.065, y - r * 0.24, r * 0.13, r * 0.3, r * 0.025); }, fill: o.c || '#a8acb8', sh: function (g2) { g2.fillStyle = '#304050'; g2.fillRect(x - r * 0.04, y - r * 0.18, r * 0.08, r * 0.09); g2.fillStyle = A('#ffffff', 0.3); g2.fillRect(x - r * 0.04, y - r * 0.18, r * 0.02, r * 0.09); }, ln: '#404048', lw: 1.1 * u, ow: 1.6 * u });
    hand(C, g, H, x, y + r * 0.2, 0, 0.7, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.clipboard = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.4, y = B.ny + r * 0.75;
    forearm(C, g, B, B.cx + sd * B.sw * 0.95, x, y + r * 0.2, cf._sleeveC, cf._cuffC);
    piece(C, g, { f: function (g2) { rrect(g2, x - r * 0.18, y - r * 0.22, r * 0.36, r * 0.46, r * 0.015); }, fill: '#b08a58', ln: '#5a4020', lw: 1.2 * u, ow: 1.8 * u });
    rrect(g, x - r * 0.15, y - r * 0.19, r * 0.3, r * 0.4, r * 0.005); fillC(g, '#fbfaf4');
    g.strokeStyle = A('#8090a8', 0.7); g.lineWidth = 1 * u; for (var i = 0; i < 6; i++) { g.beginPath(); g.moveTo(x - r * 0.12, y - r * 0.12 + i * r * 0.05); g.lineTo(x + r * 0.12, y - r * 0.12 + i * r * 0.05); g.stroke(); }
    rrect(g, x - r * 0.06, y - r * 0.25, r * 0.12, r * 0.05, r * 0.01); fillC(g, '#c0c0c8'); strokeW(g, '#505058', 1 * u);
    hand(C, g, H, x - sd * r * 0.1, y + r * 0.2, 0, 0.95, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.lantern = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.7, y = B.bot - r * 0.3;
    forearm(C, g, B, B.cx + sd * B.sw * 1.0, x, y - r * 0.2, cf._sleeveC, cf._cuffC);
    g.beginPath(); g.moveTo(x, y - r * 0.2); g.lineTo(x, y - r * 0.12); strokeW(g, '#3a3a3a', 2 * u);
    piece(C, g, { f: function (g2) { ell(g2, x, y, r * 0.1, r * 0.12); }, fill: '#f0d8a0', sh: function (g2) { g2.fillStyle = K.rad(g2, x, y, 0, r * 0.12, ['#fff8e0', '#f0c070', '#b07030']); g2.fillRect(x - r * 0.12, y - r * 0.14, r * 0.24, r * 0.28); g2.strokeStyle = A('#8a5020', 0.6); g2.lineWidth = 1 * u; for (var i = -2; i <= 2; i++) { g2.beginPath(); g2.moveTo(x - r * 0.12, y + i * r * 0.04); g2.lineTo(x + r * 0.12, y + i * r * 0.04); g2.stroke(); } }, ln: '#6a4020', lw: 1.2 * u, ow: 1.8 * u });
    if (C.l >= 1) K.glow(g, x, y, r * 0.35, '#ffb060', 0.35);
    hand(C, g, H, x, y - r * 0.18, sd * 0.2, 0.85, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.gohei = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.6, y = B.ny + r * 0.55, i;
    forearm(C, g, B, B.cx + sd * B.sw * 0.98, x, y + r * 0.25, cf._sleeveC, cf._cuffC);
    g.beginPath(); g.moveTo(x - sd * r * 0.05, y + r * 0.35); g.lineTo(x + sd * r * 0.1, y - r * 0.45); strokeW(g, '#c8a870', r * 0.025); strokeW(g, A('#6a4a20', 0.5), 1 * u);
    for (i = 0; i < 4; i++) {
      var px = x + sd * r * (0.08 + i * 0.005), py = y - r * 0.4 + i * r * 0.02, s2 = i % 2 ? 1 : -1;
      P(g, ['M', 0, py, 'L', s2 * r * 0.08, py + r * 0.02, 'L', s2 * r * 0.06, py + r * 0.1, 'L', s2 * r * 0.12, py + r * 0.12, 'L', s2 * r * 0.09, py + r * 0.22, 'L', 0, py + r * 0.08, 'Z'], px, 1);
      fillC(g, '#fbfaf6'); strokeW(g, '#8a8a90', 1 * u);
    }
    hand(C, g, H, x, y + r * 0.22, sd * 0.15, 0.9, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.fan = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.45, y = B.ny + r * 0.6, i;
    forearm(C, g, B, B.cx + sd * B.sw * 0.95, x, y + r * 0.2, cf._sleeveC, cf._cuffC);
    var fc = o.c || '#f0e8d8';
    g.beginPath(); g.moveTo(x, y + r * 0.1); g.arc(x, y + r * 0.1, r * 0.3, -PI * 0.85, -PI * 0.15); g.closePath(); fillC(g, fc); strokeW(g, pal(fc).ln, 1.2 * u);
    g.strokeStyle = A(pal(fc).ln, 0.5); g.lineWidth = 0.9 * u; for (i = 0; i <= 8; i++) { var a = lerp(-PI * 0.85, -PI * 0.15, i / 8); g.beginPath(); g.moveTo(x, y + r * 0.1); g.lineTo(x + Math.cos(a) * r * 0.3, y + r * 0.1 + Math.sin(a) * r * 0.3); g.stroke(); }
    hand(C, g, H, x, y + r * 0.18, 0, 0.85, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  // 手持乌鸦面具（判官的身份揭晓）
  PROP.crow_mask = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || -1, x = B.cx + sd * B.sw * 0.5, y = B.bot - r * 0.62, s, k = 1.55, ang = -sd * 0.35;
    var mc = pal(o.c || '#16161c');
    // 手握住喙尖：喙尖在面具局部坐标 (0.01r, 0.3r)
    var tx = 0.01 * r * k, ty = 0.27 * r * k, hx = x + Math.cos(ang) * tx - Math.sin(ang) * ty, hy = y + Math.sin(ang) * tx + Math.cos(ang) * ty;
    forearm(C, g, B, B.cx + sd * B.sw * 0.9, hx - sd * r * 0.02, hy + r * 0.2, cf._sleeveC, cf._cuffC);
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, k); u /= k;
    piece(C, g, { f: function (g2) { sym(g2, 0, [0, -r * 0.16], [[r * 0.12, -r * 0.17, r * 0.2, -r * 0.08, r * 0.2, r * 0.0], [r * 0.18, r * 0.07, r * 0.08, r * 0.09, 0, r * 0.06]]); }, fill: mc.b,
      sh: function (g2) { g2.fillStyle = K.rad(g2, -r * 0.06, -r * 0.08, r * 0.01, r * 0.25, [A(mc.l, 0.6), A(mc.b, 0), A(mc.d, 0.7)]); g2.fillRect(-r * 0.3, -r * 0.3, r * 0.6, r * 0.5); }, ln: '#000000', lw: 1.2 * u, ow: 2 * u });
    for (s = -1; s <= 1; s += 2) { ell(g, s * r * 0.085, -r * 0.05, r * 0.04, r * 0.033, s * 0.25); fillC(g, '#050206'); if (C.l >= 1) { circ(g, s * r * 0.085, -r * 0.05, r * 0.008); fillC(g, A('#ff3050', 0.35)); } }
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(-r * 0.05, -r * 0.06); g2.bezierCurveTo(-r * 0.07, r * 0.05, -r * 0.03, r * 0.2, r * 0.01, r * 0.3); g2.bezierCurveTo(r * 0.03, r * 0.2, r * 0.07, r * 0.05, r * 0.05, -r * 0.06); g2.closePath(); }, fill: '#22222a',
      sh: function (g2) { g2.fillStyle = K.lin(g2, -r * 0.06, 0, r * 0.06, 0, [A('#8a90b0', 0.5), A('#22222a', 0), A('#000000', 0.6)]); g2.fillRect(-r * 0.1, -r * 0.1, r * 0.2, r * 0.45); }, ln: '#000000', lw: 1.2 * u, ow: 2 * u });
    g.restore();
    hand(C, g, H, hx - sd * r * 0.01, hy + r * 0.2, ang * 0.5, 0.75, 'hold', o.glove || H.sp.b, sd, { skin: !o.glove, glove: !!o.glove });
  };
  // 思考手势：拳托下巴
  function thinkHand(C, g, H, B, cf) {
    var r = H.r, sd = -1, x = H.cx + sd * H.fw * 0.2, y = H.C + r * 0.2;
    forearm(C, g, B, H.cx + sd * B.sw * 0.55, x + sd * r * 0.02, y + r * 0.04, cf._sleeveC, cf._cuffC);
    hand(C, g, H, x, y + r * 0.05, sd * 0.25, 1.02, 'chin', cf._gloveC || H.sp.b, -sd, { skin: !cf._gloveC, glove: !!cf._gloveC });
  }

  /* ====================== 配件 ====================== */
  // ACC[k] = { slot: 'back'|'neck'|'body'|'face'|'head'|'hand', draw(C, g, H, B, o, cf, X, hd) }
  function accList(cf) {
    var a = cf.acc || [], out = [], i;
    for (i = 0; i < a.length; i++) out.push(typeof a[i] === 'string' ? { k: a[i] } : a[i]);
    return out;
  }
  function drawSlot(C, g, H, B, cf, X, hd, slot) {
    var a = accList(cf), i, d;
    for (i = 0; i < a.length; i++) { d = ACC[a[i].k]; if (d && d.slot === slot && d.draw) d.draw(C, g, H, B, a[i], cf, X, hd); }
  }
  function hasAcc(cf, slot) { var a = accList(cf); for (var i = 0; i < a.length; i++) { var d = ACC[a[i].k]; if (d && d.slot === slot) return true; } return false; }

  ACC.glasses = { slot: 'face', draw: function (C, g, H, B, o, cf, X) {
    var r = H.r, u = H.u * C.lw, cx = H.cx, sh = o.shape || 'rect', fc = o.c || '#3a3440', fp = pal(fc), s, i;
    var glare = o.glare && (o.glare === true || o.glare.indexOf(X._name) >= 0);
    var lens = function (g2, s) {
      var ex = cx + s * H.ex, ey = H.eyeY + H.eh * 0.04;
      if (sh === 'round') circ(g2, ex, ey, H.ew * 0.62);
      else if (sh === 'oval') ell(g2, ex, ey, H.ew * 0.68, H.ew * 0.5);
      else { var w = H.ew * 1.32, h = Math.max(H.eh * 1.02, H.ew * 0.72); rrect(g2, ex - w / 2, ey - h * 0.5, w, h, h * 0.25); }
    };
    for (s = -1; s <= 1; s += 2) {
      lens(g, s); fillC(g, glare ? (C.l >= 1 ? K.lin(g, cx - H.fw, H.eyeY - H.eh, cx + H.fw, H.eyeY + H.eh, ['#ffffff', '#cfe0ff', '#f4f8ff']) : '#e8f0ff') : 'rgba(210,228,255,0.13)');
      if (C.l >= 1 && !glare) {
        g.save(); lens(g, s); g.clip();
        g.fillStyle = A('#ffffff', 0.32);
        var ex2 = cx + s * H.ex;
        P(g, ['M', -H.ew * 0.7, H.eyeY - H.eh * 0.2, 'L', -H.ew * 0.25, H.eyeY - H.eh * 0.9, 'L', -H.ew * 0.05, H.eyeY - H.eh * 0.9, 'L', -H.ew * 0.5, H.eyeY - H.eh * 0.1, 'Z'], ex2, 1); g.fill();
        if (C.l >= 2) { P(g, ['M', H.ew * 0.15, H.eyeY + H.eh * 0.6, 'L', H.ew * 0.5, H.eyeY + H.eh * 0.0, 'L', H.ew * 0.58, H.eyeY + H.eh * 0.05, 'L', H.ew * 0.23, H.eyeY + H.eh * 0.65, 'Z'], ex2, 1); g.fill(); }
        g.restore();
      }
      lens(g, s); strokeW(g, fp.ln, 3.6 * u); lens(g, s); strokeW(g, fc, 2.2 * u);
      if (C.l >= 2) { g.save(); lens(g, s); g.clip(); lens(g, s); g.strokeStyle = A('#ffffff', 0.35); g.lineWidth = 1 * u; g.translate(0, 1.2 * u); g.stroke(); g.restore(); }
      // 镜腿
      var lx = cx + s * (H.ex + H.ew * (sh === 'round' ? 0.62 : 0.66)), ly = H.eyeY - H.eh * 0.12;
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(cx + s * H.fw * 0.99, ly - r * 0.01); strokeW(g, fp.ln, 3 * u); g.beginPath(); g.moveTo(lx, ly); g.lineTo(cx + s * H.fw * 0.99, ly - r * 0.01); strokeW(g, fc, 1.8 * u);
    }
    // 鼻梁
    var bx0 = cx - H.ex + H.ew * (sh === 'round' ? 0.62 : 0.66), by = H.eyeY - H.eh * 0.05;
    g.beginPath(); g.moveTo(bx0, by); g.quadraticCurveTo(cx, by - r * 0.03, cx + (cx - bx0), by); strokeW(g, fp.ln, 3.4 * u);
    g.beginPath(); g.moveTo(bx0, by); g.quadraticCurveTo(cx, by - r * 0.03, cx + (cx - bx0), by); strokeW(g, fc, 2 * u);
    if (o.chain) { g.beginPath(); g.moveTo(cx - H.fw * 0.98, H.eyeY); g.quadraticCurveTo(cx - H.fw * 1.1, H.C + r * 0.1, cx - H.fw * 1.05, H.C + r * 0.3); strokeW(g, A(o.chain, 0.9), 1.2 * u); }
    void i;
  } };
  ACC.glasses_round = { slot: 'face', draw: function (C, g, H, B, o, cf, X) { ACC.glasses.draw(C, g, H, B, merge(o, { shape: 'round' }), cf, X); } };
  ACC.glasses_rect = { slot: 'face', draw: function (C, g, H, B, o, cf, X) { ACC.glasses.draw(C, g, H, B, merge(o, { shape: 'rect' }), cf, X); } };
  ACC.monocle = { slot: 'face', draw: function (C, g, H, B, o) {
    var u = H.u * C.lw, ex = H.cx + H.ex, ey = H.eyeY + H.eh * 0.04, rr = H.ew * 0.62, c = o.c || '#c8a040';
    circ(g, ex, ey, rr); fillC(g, 'rgba(220,235,255,0.15)'); strokeW(g, pal(c).ln, 3.4 * u); circ(g, ex, ey, rr); strokeW(g, c, 2 * u);
    g.beginPath(); g.moveTo(ex + rr * 0.7, ey + rr * 0.7); g.quadraticCurveTo(ex + rr * 1.4, H.C, ex + rr, H.C + H.r * 0.3); strokeW(g, c, 1.2 * u);
  } };
  ACC.earring = { slot: 'face', draw: function (C, g, H, B, o) {
    var u = H.u * C.lw, s = o.side || -1, x = H.cx + s * H.fw * 1.0, y = H.earY1 + H.r * 0.01, c = o.c || '#e0c060';
    circ(g, x, y, H.r * 0.012); fillC(g, c); strokeW(g, pal(c).ln, 1 * u);
    if (o.drop !== false) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + H.r * 0.04); strokeW(g, c, 1.4 * u); circ(g, x, y + H.r * 0.05, H.r * 0.012); fillC(g, c); strokeW(g, pal(c).ln, 0.9 * u); }
    if (C.l >= 2) { circ(g, x - H.r * 0.004, y - H.r * 0.004, H.r * 0.004); fillC(g, '#ffffff'); }
  } };
  ACC.cigarette = { slot: 'face', draw: function (C, g, H, B, o, cf, X) {
    var mk = X.mouth; if (mk !== 'neutral' && mk !== 'side' && mk !== 'smirk' && mk !== 'frown' && mk !== 'smile_closed' && mk !== 'sad') return;
    var r = H.r, u = H.u * C.lw, x = H.cx + mouthW(H, cf) * 0.4, y = H.mouthY + r * 0.004, len = r * (o.k === 'toothpick' ? 0.12 : 0.13);
    var ang = 0.35, ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey);
    if (o.k === 'toothpick') { strokeW(g, '#6a4a28', 3.2 * u); g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); strokeW(g, '#d8b880', 1.8 * u); return; }
    strokeW(g, '#5a5050', r * 0.024); g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); strokeW(g, '#f4f0ea', r * 0.017);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len * 0.3, y + Math.sin(ang) * len * 0.3); strokeW(g, '#d8a860', r * 0.017);
    circ(g, ex, ey, r * 0.009); fillC(g, '#ff7040');
    if (C.l >= 1) { K.glow(g, ex, ey, r * 0.04, '#ff6020', 0.5); }
    if (C.m >= 1) { g.beginPath(); g.moveTo(ex, ey - r * 0.01); g.bezierCurveTo(ex + r * 0.05, ey - r * 0.08, ex - r * 0.02, ey - r * 0.14, ex + r * 0.04, ey - r * 0.22); strokeW(g, 'rgba(220,220,230,0.35)', 2.4 * u); }
  } };
  ACC.toothpick = { slot: 'face', draw: function (C, g, H, B, o, cf, X) { ACC.cigarette.draw(C, g, H, B, { k: 'toothpick' }, cf, X); } };
  ACC.eyepatch = { slot: 'face', draw: function (C, g, H, B, o) {
    var u = H.u * C.lw, s = o.side || 1, ex = H.cx + s * H.ex, ey = H.eyeY, c = o.c || '#1a1a20';
    g.beginPath(); g.moveTo(H.cx - s * H.fw, H.browY - H.r * 0.04); g.lineTo(H.cx + s * H.fw, H.eyeY - H.r * 0.06); strokeW(g, c, 2.4 * u);
    ell(g, ex, ey, H.ew * 0.6, H.eh * 0.62); fillC(g, c); strokeW(g, '#000000', 1.4 * u);
  } };
  // ---- 帽子与头饰 ----
  function capG(H, hd) { return hd && hd.G ? hd.G : { rx: H.fw * 1.12, top: H.T - H.r * 0.05, cy: H.T + H.r * 0.44, ry: H.r * 0.49, hl: H.T + H.r * 0.16 }; }
  ACC.top_hat = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#1e1a24', p = pal(c), band = o.band || '#7a3a9a', sc = o.size || 1;
    var x = H.cx + (o.x === undefined ? -0.42 : o.x) * H.fw, y = G.top + r * 0.1, w = r * 0.3 * sc, h = r * 0.3 * sc;
    g.save(); g.translate(x, y); g.rotate(o.tilt === undefined ? -0.3 : o.tilt);
    piece(C, g, { f: function (g2) { ell(g2, 0, 0, w * 0.95, r * 0.055 * sc); }, fill: p.b, sh: function (g2) { ell(g2, w * 0.1, -r * 0.01, w * 0.6, r * 0.03); fillC(g2, A(p.d, 0.8)); }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
    var cr = function (g2) { g2.beginPath(); g2.moveTo(-w * 0.5, -r * 0.01); g2.lineTo(-w * 0.46, -h); g2.quadraticCurveTo(0, -h - r * 0.03, w * 0.46, -h); g2.lineTo(w * 0.5, -r * 0.01); g2.quadraticCurveTo(0, r * 0.025, -w * 0.5, -r * 0.01); g2.closePath(); };
    piece(C, g, { f: cr, fill: p.b, sh: function (g2) {
      g2.fillStyle = K.lin(g2, -w * 0.5, 0, w * 0.5, 0, [[0, A(p.l, 0.45)], [0.3, A(p.b, 0)], [0.75, A(p.d, 0.5)], [1, A(p.d, 0.7)]]); g2.fillRect(-w, -h - r * 0.05, w * 2, h + r * 0.1);
      g2.fillStyle = band; g2.fillRect(-w, -h * 0.32, w * 2, h * 0.2);
      if (C.l >= 2) { g2.fillStyle = A('#ffffff', 0.25); g2.fillRect(-w * 0.32, -h, w * 0.06, h * 0.95); }
    }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
    ell(g, 0, -h - r * 0.012, w * 0.46, r * 0.018); fillC(g, p.m); strokeW(g, p.ln, 1 * u);
    if (o.feather) { g.beginPath(); g.moveTo(w * 0.3, -h * 0.3); g.quadraticCurveTo(w * 0.8, -h * 0.9, w * 0.55, -h * 1.3); strokeW(g, o.feather, 4 * u); }
    g.restore();
    void X;
  } };
  ACC.top_hat_small = ACC.top_hat;
  ACC.beret = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#7a3a40', p = pal(c), s = o.side || 1;
    var cx = H.cx + s * H.fw * 0.12, cy = G.top + r * 0.1;
    var f = function (g2) {
      g2.beginPath();
      g2.moveTo(H.cx - G.rx * 0.95, G.top + G.ry * 0.5);
      g2.bezierCurveTo(H.cx - G.rx * 1.25, cy - r * 0.02, cx - G.rx * 0.6, cy - r * 0.2, cx + G.rx * 0.2, cy - r * 0.16);
      g2.bezierCurveTo(cx + G.rx * 1.1, cy - r * 0.1, cx + G.rx * 1.35, cy + r * 0.12, H.cx + G.rx * 1.0, G.top + G.ry * 0.52);
      g2.quadraticCurveTo(H.cx, G.top + G.ry * 0.25, H.cx - G.rx * 0.95, G.top + G.ry * 0.5);
      g2.closePath();
    };
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'wool') : null, sh: function (g2) {
      g2.fillStyle = C.l >= 1 ? K.rad(g2, cx - G.rx * 0.3, cy - r * 0.08, r * 0.02, G.rx * 1.6, [[0, A(p.l, 0.35)], [0.5, A(p.b, 0)], [1, A(p.d, 0.55)]]) : A(p.s, 0.4);
      g2.fillRect(H.cx - r, cy - r * 0.4, r * 2, r * 0.8);
      if (C.l === 0) { ell(g2, cx + G.rx * 0.8, cy + r * 0.05, G.rx * 0.5, r * 0.2); fillC(g2, A(p.s, 0.6)); }
      g2.beginPath(); g2.moveTo(H.cx - G.rx * 0.95, G.top + G.ry * 0.5); g2.quadraticCurveTo(H.cx, G.top + G.ry * 0.25, H.cx + G.rx * 1.0, G.top + G.ry * 0.52); strokeW(g2, A(p.d, 0.6), r * 0.035);
    }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    g.beginPath(); g.moveTo(cx + G.rx * 0.15, cy - r * 0.16); g.quadraticCurveTo(cx + G.rx * 0.2, cy - r * 0.23, cx + G.rx * 0.28, cy - r * 0.22); strokeW(g, p.ln, 3 * u); g.beginPath(); g.moveTo(cx + G.rx * 0.15, cy - r * 0.16); g.quadraticCurveTo(cx + G.rx * 0.2, cy - r * 0.23, cx + G.rx * 0.28, cy - r * 0.22); strokeW(g, p.b, 1.6 * u);
  } };
  ACC.cap = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#3a4a5a', p = pal(c), cx = H.cx, by = G.hl + r * 0.04;
    var crown = function (g2) { sym(g2, cx, [0, G.top - r * 0.03], [[G.rx * 0.7, G.top - r * 0.04, G.rx * 1.06, G.top + G.ry * 0.25, G.rx * 1.04, by + r * 0.02], [G.rx * 0.5, by - r * 0.02, 0, by - r * 0.03]]); };
    piece(C, g, { f: crown, fill: p.b, tex: C.t > 0 ? clothTex(p.b, o.tex || 'canvas') : null, sh: function (g2) {
      g2.fillStyle = C.l >= 1 ? K.lin(g2, cx - G.rx, 0, cx + G.rx, 0, [A(p.l, 0.3), A(p.b, 0), A(p.d, 0.5)]) : A(p.s, 0.3); g2.fillRect(cx - G.rx * 1.2, G.top - r * 0.1, G.rx * 2.4, r * 0.5);
      if (C.m >= 1) { g2.beginPath(); g2.moveTo(cx, G.top - r * 0.03); g2.lineTo(cx, by); strokeW(g2, A(p.ln, 0.4), 1 * u); }
      g2.fillStyle = A(p.d, 0.5); g2.fillRect(cx - G.rx * 1.2, by - r * 0.04, G.rx * 2.4, r * 0.06);
    }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    var vc = o.visor || dk(c, 0.3), vp = pal(vc);
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, by - r * 0.025], [[G.rx * 0.8, by - r * 0.01], [G.rx * 0.82, by + r * 0.035, G.rx * 0.5, by + r * 0.07, 0, by + r * 0.08]]); }, fill: vp.b,
      sh: function (g2) { if (C.l >= 2) { g2.fillStyle = A('#ffffff', 0.2); g2.fillRect(cx - G.rx * 0.6, by - r * 0.015, G.rx * 0.6, r * 0.012); } }, ln: vp.ln, lw: 1.2 * u, ow: 2 * u });
    if (o.badge) { circ(g, cx, by - r * 0.08, r * 0.035); fillC(g, C.l >= 1 ? K.lin(g, 0, by - r * 0.11, 0, by - r * 0.05, ['#fff0b0', '#c09030']) : '#d0a040'); strokeW(g, '#6a4a10', 1 * u); }
  } };
  ACC.police_cap = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#1e2a48', p = pal(c), cx = H.cx, by = G.hl + r * 0.03;
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, G.top - r * 0.1], [[G.rx * 0.9, G.top - r * 0.12, G.rx * 1.18, G.top - r * 0.02], [G.rx * 1.02, by - r * 0.04], [0, by - r * 0.05]]); }, fill: p.b,
      sh: function (g2) { g2.fillStyle = K.lin(g2, cx - G.rx, 0, cx + G.rx, 0, [A(p.l, 0.25), A(p.b, 0), A(p.d, 0.5)]); g2.fillRect(cx - G.rx * 1.3, G.top - r * 0.2, G.rx * 2.6, r * 0.5); g2.fillStyle = '#101418'; g2.fillRect(cx - G.rx * 1.3, by - r * 0.1, G.rx * 2.6, r * 0.06); }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, by - r * 0.05], [[G.rx * 0.8, by - r * 0.04], [G.rx * 0.8, by + r * 0.02, G.rx * 0.5, by + r * 0.06, 0, by + r * 0.065]]); }, fill: '#0e1014',
      sh: function (g2) { if (C.l >= 1) { g2.fillStyle = A('#ffffff', 0.25); g2.fillRect(cx - G.rx * 0.5, by - r * 0.04, G.rx * 0.5, r * 0.012); } }, ln: '#000000', lw: 1.1 * u, ow: 2 * u });
    var bx = cx, byy = G.top + r * 0.06, i;
    g.beginPath(); for (i = 0; i < 10; i++) { var a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.02 : r * 0.045; if (i) g.lineTo(bx + Math.cos(a) * rr, byy + Math.sin(a) * rr); else g.moveTo(bx + Math.cos(a) * rr, byy + Math.sin(a) * rr); } g.closePath();
    fillC(g, C.l >= 1 ? K.lin(g, 0, byy - r * 0.05, 0, byy + r * 0.05, ['#fff4c0', '#c8a040']) : '#d8b050'); strokeW(g, '#6a4a10', 1 * u);
  } };
  ACC.straw_hat = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#e8d090', p = pal(c), cx = H.cx, by = G.top + G.ry * 0.62, i;
    var brim = function (g2) { ell(g2, cx, by, G.rx * 1.7, r * 0.22, o.tilt || -0.06); };
    var tex = function (g2) { if (C.m >= 1) { g2.strokeStyle = A(p.s, 0.6); g2.lineWidth = 1 * u; for (i = 1; i < 6; i++) { ell(g2, cx, by, G.rx * 1.75 * i / 6 + G.rx * 0.3, r * 0.2 * i / 6 + r * 0.04, o.tilt || -0.06); g2.stroke(); } } };
    piece(C, g, { f: brim, fill: p.b, tex: C.t > 0 ? ['thatch', { c1: K.shade(c, -0.12), c2: K.shade(c, 0.06), seed: 5 }, 40] : null, sh: function (g2) { tex(g2); g2.fillStyle = A(p.d, 0.35); ell(g2, cx + G.rx * 0.2, by + r * 0.05, G.rx * 1.2, r * 0.1); g2.fill(); }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    var crown = function (g2) { g2.beginPath(); g2.moveTo(cx - G.rx * 0.8, by + r * 0.02); g2.bezierCurveTo(cx - G.rx * 0.9, by - r * 0.42, cx + G.rx * 0.9, by - r * 0.42, cx + G.rx * 0.8, by + r * 0.02); g2.quadraticCurveTo(cx, by + r * 0.07, cx - G.rx * 0.8, by + r * 0.02); g2.closePath(); };
    piece(C, g, { f: crown, fill: p.b, sh: function (g2) { g2.fillStyle = K.lin(g2, cx - G.rx * 0.7, 0, cx + G.rx * 0.7, 0, [A(p.l, 0.3), A(p.b, 0), A(p.s, 0.6)]); g2.fillRect(cx - G.rx, by - r * 0.35, G.rx * 2, r * 0.45);
      g2.fillStyle = o.band || '#c03040'; g2.fillRect(cx - G.rx, by - r * 0.07, G.rx * 2, r * 0.06); }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
  } };
  ACC.bandana = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#304070', p = pal(c), cx = H.cx, by = G.hl + r * 0.05, i;
    var f = function (g2) { sym(g2, cx, [0, G.top - r * 0.035], [[G.rx * 0.6, G.top - r * 0.04, G.rx * 1.08, G.top + G.ry * 0.3, G.rx * 1.06, by + r * 0.03], [G.rx * 0.6, by - r * 0.015, 0, by - r * 0.01]]); };
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'cotton') : null, sh: function (g2) {
      g2.fillStyle = C.l >= 1 ? K.lin(g2, cx - G.rx, 0, cx + G.rx, 0, [A(p.l, 0.3), A(p.b, 0), A(p.d, 0.5)]) : A(p.s, 0.35); g2.fillRect(cx - G.rx * 1.2, G.top - r * 0.1, G.rx * 2.4, r * 0.6);
      if (o.dots !== false && C.m >= 1) { g2.fillStyle = A(o.dotC || '#ffffff', 0.75); for (i = 0; i < 26; i++) { var a = i * 2.39996, rr = Math.sqrt(i / 26) * G.rx; circ(g2, cx + Math.cos(a) * rr, G.top + G.ry * 0.3 + Math.sin(a) * rr * 0.4, r * 0.012); g2.fill(); } }
      g2.fillStyle = A(p.d, 0.4); g2.fillRect(cx - G.rx * 1.2, by - r * 0.05, G.rx * 2.4, r * 0.06);
      if (C.m >= 1) for (i = 0; i < 4; i++) fold(g2, cx - G.rx * 0.6 + i * G.rx * 0.4, G.top + G.ry * 0.1, cx - G.rx * 0.7 + i * G.rx * 0.45, by, r * 0.02, r * 0.01, A(p.s, 0.6));
    }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    // 侧结
    var kx = cx + G.rx * 1.0, ky = G.top + G.ry * 0.62;
    piece(C, g, { f: function (g2) { ell(g2, kx, ky, r * 0.045, r * 0.04); }, fill: p.b, ln: p.ln, lw: 1.2 * u, ow: 1.8 * u });
    for (i = 0; i < 2; i++) piece(C, g, { f: (function (i) { return function (g2) { g2.beginPath(); g2.moveTo(kx, ky); g2.lineTo(kx + r * (0.14 + i * 0.03), ky + r * (0.02 + i * 0.09)); g2.lineTo(kx + r * (0.1 + i * 0.04), ky + r * (0.07 + i * 0.1)); g2.closePath(); }; })(i), fill: K.shade(c, -0.1 * i), ln: p.ln, lw: 1.1 * u, ow: 1.6 * u });
  } };
  ACC.headscarf = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#8a6a5a', p = pal(c), cx = H.cx, s;
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        piece(C, g, { f: function (g2) { P(g2, ['M', 0, G.top - r * 0.05, 'C', G.rx * 0.7, G.top - r * 0.05, G.rx * 1.2, G.top + G.ry * 0.4, G.rx * 1.15, G.cy + r * 0.1,
          'C', G.rx * 1.1, H.jawY, H.fw * 0.6, H.C + r * 0.08, 0, H.C + r * 0.1, 'L', 0, H.C + r * 0.03, 'C', H.cw * 1.4, H.C + r * 0.02, H.fw * 1.02, H.jawY, H.fw * 1.02, H.eyeY,
          'C', H.fw * 1.0, H.T + r * 0.2, H.fw * 0.5, G.hl - r * 0.01, 0, G.hl - r * 0.02, 'Z'], cx, s); }, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'cotton') : null,
          sh: function (g2) { clothShade(C, g2, { r: r, cx: cx, sw: H.fw * 1.1, shY: H.eyeY, bot: H.C + r * 0.2, u: H.u, aw: 1, ny: G.top, nw: 1 }, p, { noArms: 1, noNeckShadow: 1, noFolds: 1 }); if (C.m >= 1) fold(g2, cx + s * G.rx * 0.9, G.cy - r * 0.1, cx + s * H.fw * 0.8, H.C, s * r * 0.02, r * 0.012, A(p.s, 0.7)); }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
      })(s);
    }
    piece(C, g, { f: function (g2) { ell(g2, cx, H.C + r * 0.08, r * 0.06, r * 0.045); }, fill: p.b, sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx, H.C, r, r * 0.2); }, ln: p.ln, lw: 1.2 * u, ow: 1.8 * u });
  } };
  ACC.knit_hat = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#a03030', p = pal(c), cx = H.cx, by = G.hl + r * 0.06, i;
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, G.top - r * 0.08], [[G.rx * 0.75, G.top - r * 0.08, G.rx * 1.1, G.top + G.ry * 0.3, G.rx * 1.08, by], [0, by]]); }, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'knit') : null,
      sh: function (g2) { g2.fillStyle = K.lin(g2, cx - G.rx, 0, cx + G.rx, 0, [A(p.l, 0.3), A(p.b, 0), A(p.d, 0.5)]); g2.fillRect(cx - G.rx * 1.2, G.top - r * 0.2, G.rx * 2.4, r * 0.6);
        if (C.m >= 1) { g2.strokeStyle = A(p.s, 0.7); g2.lineWidth = 1.1 * u; for (i = -6; i <= 6; i++) { g2.beginPath(); g2.moveTo(cx + i * G.rx * 0.04, G.top - r * 0.06); g2.quadraticCurveTo(cx + i * G.rx * 0.15, G.top + G.ry * 0.2, cx + i * G.rx * 0.17, by); g2.stroke(); } } }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, by - r * 0.1], [[G.rx * 0.9, by - r * 0.1, G.rx * 1.12, by - r * 0.08], [G.rx * 1.12, by + r * 0.02], [G.rx * 0.6, by + r * 0.03, 0, by + r * 0.035]]); }, fill: p.b,
      sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(cx + G.rx * 0.3, by - r * 0.2, r, r * 0.3); if (C.m >= 1) { g2.strokeStyle = A(p.s, 0.8); g2.lineWidth = 1 * u; for (i = -12; i <= 12; i++) { g2.beginPath(); g2.moveTo(cx + i * G.rx * 0.09, by - r * 0.1); g2.lineTo(cx + i * G.rx * 0.09, by + r * 0.03); g2.stroke(); } } }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    if (o.pom !== false) { var pc = o.pomC || '#f0ece4', pp = pal(pc); piece(C, g, { f: function (g2) { circ(g2, cx, G.top - r * 0.1, r * 0.08); }, fill: pp.b, sh: function (g2) { circ(g2, cx + r * 0.03, G.top - r * 0.08, r * 0.07); fillC(g2, A(pp.s, 0.5)); }, ln: pp.ln, lw: 1 * u, ow: 1.8 * u }); }
  } };
  ACC.earmuffs = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var r = H.r, u = H.u * C.lw, G = capG(H, hd), c = o.c || '#e8d8d0', p = pal(c), cx = H.cx, s;
    g.beginPath(); g.moveTo(cx - G.rx * 1.02, (H.earY0 + H.earY1) / 2); g.bezierCurveTo(cx - G.rx * 1.1, G.top - r * 0.1, cx + G.rx * 1.1, G.top - r * 0.1, cx + G.rx * 1.02, (H.earY0 + H.earY1) / 2);
    strokeW(g, pal(o.band || '#806070').ln, r * 0.03); strokeW(g, o.band || '#806070', r * 0.02);
    for (s = -1; s <= 1; s += 2) piece(C, g, { f: (function (s) { return function (g2) { ell(g2, cx + s * H.fw * 1.05, (H.earY0 + H.earY1) / 2, r * 0.085, r * 0.1); }; })(s), fill: p.b, sh: function (g2) { g2.fillStyle = K.rad(g2, cx - r * 0.2, H.eyeY, r * 0.05, r * 0.6, [A(p.l, 0.3), A(p.s, 0.6)]); g2.fillRect(cx - r, H.eyeY - r * 0.3, r * 2, r * 0.6); }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
  } };
  // 发饰蝴蝶结：pos 'top'|'side'|'back'
  function bow(C, g, H, x, y, w, c, rot, tails) {
    var r = H.r, u = H.u * C.lw, p = pal(c), s;
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    if (tails) for (s = -1; s <= 1; s += 2) piece(C, g, { f: (function (s) { return function (g2) { P(g2, ['M', 0, 0, 'C', w * 0.2, w * 0.4, w * 0.35, w * 0.8, w * 0.45, w * 1.2, 'L', w * 0.25, w * 1.15, 'L', w * 0.12, w * 1.3, 'C', w * 0.08, w * 0.8, 0, w * 0.4, 0, 0, 'Z'], 0, s); }; })(s), fill: p.b, sh: function (g2) { g2.fillStyle = A(p.s, 0.5); g2.fillRect(0, 0, w, w * 1.5); }, ln: p.ln, lw: 1.1 * u, ow: 1.6 * u });
    for (s = -1; s <= 1; s += 2) piece(C, g, { f: (function (s) { return function (g2) { P(g2, ['M', 0, 0, 'C', w * 0.3, -w * 0.6, w * 1.0, -w * 0.55, w * 0.95, -w * 0.05, 'C', w * 0.95, w * 0.45, w * 0.35, w * 0.45, 0, 0, 'Z'], 0, s); }; })(s), fill: p.b,
      sh: function (g2) { ell(g2, s * w * 0.5, 0, w * 0.18, w * 0.22); fillC(g2, A(p.d, 0.4)); g2.fillStyle = A(p.s, s > 0 ? 0.45 : 0.15); g2.fillRect(-w, w * 0.05, w * 2, w); if (C.l >= 2) { ell(g2, s * w * 0.55, -w * 0.28, w * 0.2, w * 0.08); fillC(g2, A('#ffffff', 0.45)); } }, ln: p.ln, lw: 1.2 * u, ow: 1.8 * u });
    rrect(g, -w * 0.15, -w * 0.2, w * 0.3, w * 0.4, w * 0.1); fillC(g, p.m); strokeW(g, p.ln, 1.1 * u);
    g.restore();
  }
  ACC.ribbon = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    if (o.pos === 'back') return;
    var G = capG(H, hd), r = H.r, pos = o.pos || 'side', s = o.side || 1, sz = (o.size || 1) * r * 0.13;
    if (o.at) { bow(C, g, H, o.at[0], o.at[1], sz, o.c || '#c02040', o.rot || 0, o.tails); return; }
    if (pos === 'top') bow(C, g, H, H.cx + s * H.fw * 0.3, G.top + r * 0.04, sz, o.c || '#c02040', s * 0.2, o.tails);
    else bow(C, g, H, H.cx + s * G.rx * 0.82, G.top + G.ry * 0.35, sz, o.c || '#c02040', s * 0.5, o.tails);
  } };
  ACC.ribbon_back = { slot: 'back', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), r = H.r, sz = (o.size || 1.6) * r * 0.13;
    bow(C, g, H, H.cx, G.top + G.ry * 0.3, sz * 1.25, o.c || '#ffffff', 0, false);
  } };
  ACC.white_ribbon = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) { ACC.ribbon.draw(C, g, H, B, merge({ c: '#fbfaf8', pos: 'side', side: -1, size: 1.3, tails: 1 }, o), cf, X, hd); } };
  ACC.hairpin = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), u = H.u * C.lw, s = o.side || 1, x = H.cx + s * H.fw * 0.55, y = G.hl + H.r * 0.04, c = o.c || '#e0c060';
    g.beginPath(); g.moveTo(x - H.r * 0.06, y + H.r * 0.02); g.lineTo(x + H.r * 0.06, y - H.r * 0.03); strokeW(g, pal(c).ln, 4 * u); g.beginPath(); g.moveTo(x - H.r * 0.06, y + H.r * 0.02); g.lineTo(x + H.r * 0.06, y - H.r * 0.03); strokeW(g, c, 2.4 * u);
  } };
  ACC.flower = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), u = H.u * C.lw, s = o.side || 1, x = H.cx + s * G.rx * 0.78, y = G.top + G.ry * 0.45, c = o.c || '#f0a0b0', p = pal(c), i, rr = H.r * 0.035;
    for (i = 0; i < 5; i++) { var a = i / 5 * PI * 2; piece(C, g, { f: (function (a) { return function (g2) { circ(g2, x + Math.cos(a) * rr, y + Math.sin(a) * rr, rr * 0.9); }; })(a), fill: p.b, ln: p.ln, lw: 1 * u, ow: 1.4 * u }); }
    circ(g, x, y, rr * 0.6); fillC(g, '#f0d060'); strokeW(g, '#a08020', 1 * u);
  } };
  ACC.headband = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), r = H.r, u = H.u * C.lw, c = o.c || '#ffffff', p = pal(c), cx = H.cx, y = G.top + G.ry * 0.32, i;
    var f = function (g2) { g2.beginPath(); g2.moveTo(cx - G.rx * 1.0, y + G.ry * 0.3); g2.bezierCurveTo(cx - G.rx * 0.8, y - G.ry * 0.25, cx + G.rx * 0.8, y - G.ry * 0.25, cx + G.rx * 1.0, y + G.ry * 0.3);
      g2.lineTo(cx + G.rx * 0.97, y + G.ry * 0.38); g2.bezierCurveTo(cx + G.rx * 0.78, y - G.ry * 0.12, cx - G.rx * 0.78, y - G.ry * 0.12, cx - G.rx * 0.97, y + G.ry * 0.38); g2.closePath(); };
    if (o.frill) for (i = 0; i <= 10; i++) { var t = i / 10, a = lerp(-1.1, 1.1, t), fx = cx + Math.sin(a) * G.rx * 0.92, fy = y - G.ry * 0.1 + (1 - Math.cos(a)) * G.ry * 0.35; piece(C, g, { f: (function (fx, fy) { return function (g2) { circ(g2, fx, fy - r * 0.03, r * 0.035); }; })(fx, fy), fill: '#ffffff', ln: '#8a8a9a', lw: 1 * u, ow: 1.4 * u }); }
    piece(C, g, { f: f, fill: p.b, ln: p.ln, lw: 1.2 * u, ow: 1.8 * u });
  } };
  ACC.maid_headpiece = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) { ACC.headband.draw(C, g, H, B, { c: o.c || '#1e1c24', frill: 1 }, cf, X, hd); } };
  ACC.nurse_cap = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), r = H.r, u = H.u * C.lw, cx = H.cx, y = G.top + r * 0.02;
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, y - r * 0.08], [[G.rx * 0.45, y - r * 0.07], [G.rx * 0.6, y + r * 0.08], [G.rx * 0.3, y + r * 0.1, 0, y + r * 0.1]]); }, fill: '#fbfcff',
      sh: function (g2) { g2.fillStyle = A('#8890b0', 0.35); g2.fillRect(cx, y - r * 0.1, r, r * 0.3); }, ln: '#6a6a88', lw: 1.2 * u, ow: 2 * u });
    g.fillStyle = '#d02838'; g.fillRect(cx - r * 0.01, y - r * 0.05, r * 0.02, r * 0.07); g.fillRect(cx - r * 0.035, y - r * 0.025, r * 0.07, r * 0.02);
  } };
  ACC.pencil_ear = { slot: 'head', draw: function (C, g, H, B, o) {
    var r = H.r, u = H.u * C.lw, x = H.cx + H.fw * 1.04, y = H.earY0 + r * 0.01;
    g.save(); g.translate(x, y); g.rotate(-0.5);
    rrect(g, -r * 0.13, -r * 0.012, r * 0.26, r * 0.024, r * 0.004); fillC(g, o.c || '#e8c030'); strokeW(g, '#6a5010', 1 * u);
    P(g, ['M', r * 0.13, -r * 0.012, 'L', r * 0.17, 0, 'L', r * 0.13, r * 0.012, 'Z'], 0, 1); fillC(g, '#e8d0a8'); strokeW(g, '#6a5010', 1 * u);
    g.fillStyle = '#e09090'; g.fillRect(-r * 0.15, -r * 0.012, r * 0.025, r * 0.024);
    g.restore();
  } };
  // ---- 颈部 ----
  ACC.scarf = { slot: 'neck', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, c = o.c || '#a8a090', p = pal(c), ny = B.ny, nw = B.nw, i;
    var tex = C.t > 0 ? clothTex(p.b, 'knit') : null;
    var sh = function (g2) { clothShade(C, g2, B, p, { noArms: 1, noNeckShadow: 1, noFolds: 1 }); if (o.stripe && C.m >= 1) { g2.strokeStyle = o.stripe; g2.lineWidth = r * 0.02; for (i = 0; i < 8; i++) { g2.beginPath(); g2.moveTo(cx - r, ny + r * (0.15 + i * 0.12)); g2.lineTo(cx + r, ny + r * (0.15 + i * 0.12)); g2.stroke(); } } };
    // 垂下的长端
    var len = o.long === false ? 0.4 : 1.2;
    piece(C, g, { f: function (g2) { P(g2, ['M', nw * 0.3, ny, 'C', nw * 0.5, ny + r * 0.3, nw * 0.6, ny + r * len * 0.6, nw * 0.7, ny + r * len, 'L', nw * 1.9, ny + r * len, 'C', nw * 1.7, ny + r * len * 0.6, nw * 1.5, ny + r * 0.2, nw * 1.5, ny, 'Z'], cx, 1); }, fill: p.b, tex: tex, sh: sh, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    if (C.m >= 1) { var fy = ny + r * len; for (i = 0; i < 6; i++) { var fx = cx + lerp(nw * 0.72, nw * 1.88, i / 5); g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy + r * 0.05); strokeW(g, p.ln, 2.2 * u); g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy + r * 0.05); strokeW(g, p.b, 1.2 * u); } }
    // 绕颈的部分
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, ny - r * 0.12], [[nw * 0.8, ny - r * 0.14, nw * 1.5, ny - r * 0.14, nw * 1.9, ny - r * 0.04], [nw * 2.1, ny + r * 0.06, nw * 1.6, ny + r * 0.16, nw * 0.9, ny + r * 0.15], [nw * 0.4, ny + r * 0.14, 0, ny + r * 0.1]]); }, fill: p.b, tex: tex,
      sh: function (g2) { sh(g2); if (C.m >= 1) for (i = -3; i <= 3; i++) fold(g2, cx + i * nw * 0.45, ny - r * 0.1, cx + i * nw * 0.5 + r * 0.03, ny + r * 0.13, r * 0.02, r * 0.012, A(p.s, 0.7)); }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
  } };
  ACC.towel = { slot: 'neck', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, c = o.c || '#f4f2ec', p = pal(c), ny = B.ny, nw = B.nw, s;
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        piece(C, g, { f: function (g2) { P(g2, ['M', nw * 0.95, ny - r * 0.1, 'C', nw * 1.6, ny - r * 0.08, nw * 1.7, ny + r * 0.1, nw * 1.5, ny + r * 0.65, 'L', nw * 0.55, ny + r * 0.62, 'C', nw * 0.7, ny + r * 0.2, nw * 0.6, ny + r * 0.0, nw * 0.5, ny - r * 0.02, 'Z'], cx, s); }, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'knit') : null,
          sh: function (g2) { g2.fillStyle = A(p.s, s > 0 ? 0.55 : 0.2); g2.fillRect(cx - r, ny - r * 0.2, r * 2, r); if (o.stripe !== false) { g2.fillStyle = o.stripe || '#6a8ab0'; g2.fillRect(cx - r, ny + r * 0.5, r * 2, r * 0.03); } if (C.m >= 1) fold(g2, cx + s * nw * 1.2, ny, cx + s * nw * 1.0, ny + r * 0.55, s * r * 0.02, r * 0.012, A(p.s, 0.7)); }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
      })(s);
    }
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, ny - r * 0.13], [[nw * 0.9, ny - r * 0.15, nw * 1.3, ny - r * 0.1], [nw * 1.0, ny - r * 0.02, 0, ny - r * 0.04]]); }, fill: p.m, ln: p.ln, lw: 1.2 * u });
  } };
  ACC.towel_neck = ACC.towel;
  ACC.necklace = { slot: 'neck', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, ny = B.ny, nw = B.nw, c = o.c || '#f4f0e8', n = K.byModel(C.q, 9, 13, 17), i, pr = r * (o.k === 'chain' ? 0.006 : 0.016);
    for (i = 0; i <= n; i++) {
      var t = i / n, a = lerp(-1, 1, t), x = cx + a * nw * 1.25, y = ny + r * 0.06 + (1 - a * a) * r * (o.drop || 0.12);
      circ(g, x, y, pr); fillC(g, C.l >= 1 ? K.rad(g, x - pr * 0.3, y - pr * 0.3, 0, pr * 1.2, ['#ffffff', c, K.mix(c, '#9a9088', 0.5)]) : c);
      if (C.m >= 1) strokeW(g, A(pal(c).ln, 0.6), 0.8 * u);
    }
  } };
  ACC.pearl_necklace = ACC.necklace;
  ACC.pendant = { slot: 'neck', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, ny = B.ny, nw = B.nw, c = o.c || '#1a1418', py = ny + r * (o.drop || 0.3);
    g.beginPath(); g.moveTo(cx - nw * 1.05, ny - r * 0.03); g.quadraticCurveTo(cx - nw * 0.3, py - r * 0.04, cx, py); g.quadraticCurveTo(cx + nw * 0.3, py - r * 0.04, cx + nw * 1.05, ny - r * 0.03); strokeW(g, o.cord || '#2a2228', 1.4 * u);
    if (o.k === 'feather' || o.feather) {
      g.save(); g.translate(cx, py); g.rotate(0.2);
      piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(0, 0); g2.bezierCurveTo(r * 0.05, r * 0.04, r * 0.05, r * 0.16, 0, r * 0.22); g2.bezierCurveTo(-r * 0.045, r * 0.15, -r * 0.04, r * 0.05, 0, 0); g2.closePath(); }, fill: c,
        sh: function (g2) { g2.beginPath(); g2.moveTo(0, 0); g2.lineTo(0, r * 0.22); strokeW(g2, A('#6a6a80', 0.8), 1 * u); if (C.l >= 1) { g2.fillStyle = A('#6070a0', 0.35); g2.fillRect(-r * 0.05, 0, r * 0.04, r * 0.2); } }, ln: '#000000', lw: 1 * u, ow: 1.4 * u });
      g.restore();
    } else { circ(g, cx, py, r * 0.022); fillC(g, c); strokeW(g, pal(c).ln, 1 * u); }
  } };
  ACC.feather_charm = { slot: 'neck', draw: function (C, g, H, B, o) { ACC.pendant.draw(C, g, H, B, { k: 'feather', c: o.c || '#141018', drop: 0.34 }); } };
  ACC.crow_feather_charm = ACC.feather_charm;
  // ---- 身上 ----
  ACC.badge = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, x = B.cx + B.sw * (o.x || 0.34), y = B.ny + r * (o.y || 0.24), k = o.kind || 'pin', c = o.c || '#d8b048', i;
    if (k === 'lawyer') {
      for (i = 0; i < 16; i++) { var a = i / 16 * PI * 2; ell(g, x + Math.cos(a) * r * 0.022, y + Math.sin(a) * r * 0.022, r * 0.013, r * 0.006, a); fillC(g, c); }
      circ(g, x, y, r * 0.016); fillC(g, '#8a6a20'); strokeW(g, '#5a4010', 0.8 * u);
    } else if (k === 'police') {
      g.beginPath(); for (i = 0; i < 10; i++) { var a2 = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.016 : r * 0.034; if (i) g.lineTo(x + Math.cos(a2) * rr, y + Math.sin(a2) * rr); else g.moveTo(x + Math.cos(a2) * rr, y + Math.sin(a2) * rr); } g.closePath();
      fillC(g, C.l >= 1 ? K.lin(g, 0, y - r * 0.04, 0, y + r * 0.04, ['#fff0b0', '#c09030']) : c); strokeW(g, '#5a4010', 0.9 * u);
    } else { circ(g, x, y, r * 0.02); fillC(g, c); strokeW(g, pal(c).ln, 1 * u); }
    if (C.l >= 2) { circ(g, x - r * 0.008, y - r * 0.008, r * 0.006); fillC(g, '#ffffff'); }
  } };
  ACC.lawyer_badge = { slot: 'body', draw: function (C, g, H, B, o) { ACC.badge.draw(C, g, H, B, { kind: 'lawyer', c: o.c }); } };
  ACC.police_badge = { slot: 'body', draw: function (C, g, H, B, o) { ACC.badge.draw(C, g, H, B, { kind: 'police', x: 0.36, y: 0.3 }); } };
  ACC.watch_chain = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, y0 = B.ny + r * 0.62, c = o.c || '#d8b048', n = K.byModel(C.q, 8, 14, 22), i;
    for (i = 0; i <= n; i++) {
      var t = i / n, x = lerp(cx + r * 0.01, cx + B.sw * 0.42, t), y = y0 + Math.sin(t * PI) * r * 0.09 - t * r * 0.05;
      ell(g, x, y, r * 0.009, r * 0.006, t * 2); strokeW(g, i % 2 ? K.shade(c, -0.3) : c, 1.6 * u);
    }
    if (C.l >= 1) K.glow(g, cx + B.sw * 0.2, y0 + r * 0.06, r * 0.05, '#ffe080', 0.25);
  } };
  ACC.gold_watch = ACC.watch_chain;
  ACC.sequins = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, rn = K.rng('seq'), n = K.byModel(C.q, 14, 26, 44), i, c = o.c || '#e8d0ff';
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (i = 0; i < n; i++) {
      var s = rn() < 0.5 ? -1 : 1, x = B.cx + s * (B.nw * 1.2 + rn() * B.sw * 0.85), y = B.ny + r * (0.05 + rn() * 0.9);
      if (Math.abs(x - B.cx) < r * 0.1) continue;
      var sz = r * (0.006 + rn() * 0.008);
      g.beginPath(); g.moveTo(x, y - sz * 2); g.lineTo(x + sz, y); g.lineTo(x, y + sz * 2); g.lineTo(x - sz, y); g.closePath(); fillC(g, A(c, 0.85));
      if (C.l >= 1 && rn() < 0.35) { g.globalCompositeOperation = 'source-atop'; circ(g, x, y, sz * 2.5); fillC(g, A('#ffffff', 0.35)); }
    }
    g.restore();
  } };
  ACC.paint = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, rn = K.rng('paint'), cols = o.cols || ['#c03848', '#3a70c0', '#e0b030', '#40a070', '#6a3a90'], n = K.byModel(C.q, 5, 8, 12), i, j, u = B.u * C.lw;
    g.save(); g.globalCompositeOperation = 'source-atop';
    for (i = 0; i < n; i++) {
      var s = rn() < 0.5 ? -1 : 1, x = B.cx + s * (B.nw * 1.6 + rn() * B.sw * 0.9), y = B.ny + r * (0.3 + rn() * 0.7), rr = r * (0.012 + rn() * 0.022), c = cols[i % cols.length];
      var pts = []; for (j = 0; j < 7; j++) { var a = j / 7 * PI * 2; pts.push(x + Math.cos(a) * rr * (0.7 + rn() * 0.6), y + Math.sin(a) * rr * (0.7 + rn() * 0.6)); }
      smoothPoly(g, pts, true); fillC(g, A(c, 0.85));
      if (rn() < 0.5) { circ(g, x + rr * 1.8, y + rr * 0.8, rr * 0.3); fillC(g, A(c, 0.8)); }
    }
    g.restore();
    void u;
  } };
  ACC.paint_stains = ACC.paint;
  ACC.camera = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx + (o.dx === undefined ? 0.14 : o.dx) * r, y = B.ny + r * 0.72, c = o.c || '#2a2a30', p = pal(c);
    g.beginPath(); g.moveTo(B.cx - B.nw * 1.1, B.ny - r * 0.04); g.quadraticCurveTo(B.cx - B.nw * 0.5, y - r * 0.2, cx - r * 0.13, y - r * 0.05);
    g.moveTo(B.cx + B.nw * 1.1, B.ny - r * 0.04); g.quadraticCurveTo(B.cx + B.nw * 1.4, y - r * 0.2, cx + r * 0.13, y - r * 0.05);
    strokeW(g, '#101014', r * 0.022); strokeW(g, '#3a3436', r * 0.012);
    piece(C, g, { f: function (g2) { rrect(g2, cx - r * 0.16, y - r * 0.08, r * 0.32, r * 0.18, r * 0.025); }, fill: p.b, sh: function (g2) {
      g2.fillStyle = '#b8b8c0'; g2.fillRect(cx - r * 0.16, y - r * 0.08, r * 0.32, r * 0.05);
      g2.fillStyle = K.lin(g2, 0, y - r * 0.08, 0, y + r * 0.1, [A('#ffffff', 0.3), A('#000000', 0.3)]); g2.fillRect(cx - r * 0.2, y - r * 0.1, r * 0.4, r * 0.22);
    }, ln: '#08080a', lw: 1.2 * u, ow: 2 * u });
    rrect(g, cx - r * 0.1, y - r * 0.12, r * 0.08, r * 0.045, r * 0.008); fillC(g, '#2a2a2e'); strokeW(g, '#000', 1 * u);
    circ(g, cx + r * 0.02, y + r * 0.025, r * 0.065); fillC(g, '#18181c'); strokeW(g, '#000', 1.2 * u);
    circ(g, cx + r * 0.02, y + r * 0.025, r * 0.045); fillC(g, C.l >= 1 ? K.rad(g, cx, y + r * 0.01, 0, r * 0.05, ['#6a7aa0', '#1a2030', '#000000']) : '#2a3448');
    if (C.l >= 1) { circ(g, cx + r * 0.005, y + r * 0.01, r * 0.012); fillC(g, A('#ffffff', 0.7)); }
  } };
  ACC.violin_case = { slot: 'back', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, c = o.c || '#2a1a22', p = pal(c), s = o.side || -1;
    var x = B.cx + s * B.sw * 0.62, y = B.shY - r * 0.1;
    g.save(); g.translate(x, y); g.rotate(s * -0.45);
    var f = function (g2) { g2.beginPath(); g2.moveTo(-r * 0.09, -r * 0.42); g2.quadraticCurveTo(0, -r * 0.5, r * 0.09, -r * 0.42); g2.lineTo(r * 0.11, -r * 0.1); g2.bezierCurveTo(r * 0.24, -r * 0.0, r * 0.26, r * 0.5, r * 0.2, r * 0.9); g2.lineTo(-r * 0.2, r * 0.9); g2.bezierCurveTo(-r * 0.26, r * 0.5, -r * 0.24, r * 0.0, -r * 0.11, -r * 0.1); g2.closePath(); };
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'leather') : null, sh: function (g2) { g2.fillStyle = K.lin(g2, -r * 0.25, 0, r * 0.25, 0, [A(p.l, 0.4), A(p.b, 0), A(p.d, 0.6)]); g2.fillRect(-r * 0.3, -r * 0.6, r * 0.6, r * 1.6);
      if (C.m >= 1) { g2.save(); g2.scale(0.86, 0.94); f(g2); g2.restore(); strokeW(g2, A(p.l, 0.4), 1.2 * u); } if (C.l >= 2) { g2.fillStyle = A('#ffffff', 0.2); g2.fillRect(-r * 0.07, -r * 0.4, r * 0.025, r * 1.1); } }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    rrect(g, -r * 0.05, -r * 0.2, r * 0.1, r * 0.04, r * 0.01); fillC(g, '#c8b080'); strokeW(g, '#5a4020', 1 * u);
    g.restore();
  } };
  ACC.violin_strap = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, s = o.side || -1;
    g.beginPath(); g.moveTo(B.cx + s * B.sw * 0.65, B.shY - r * 0.02); g.quadraticCurveTo(B.cx, B.ny + r * 0.5, B.cx - s * B.sw * 0.55, B.bot + 4);
    strokeW(g, '#141014', r * 0.05); strokeW(g, o.c || '#3a2a30', r * 0.036);
    if (C.m >= 1) { g.beginPath(); g.moveTo(B.cx + s * B.sw * 0.65, B.shY - r * 0.02); g.quadraticCurveTo(B.cx, B.ny + r * 0.5, B.cx - s * B.sw * 0.55, B.bot + 4); g.strokeStyle = A('#ffffff', 0.15); g.lineWidth = r * 0.008; g.stroke(); }
  } };
  ACC.gloves = { slot: 'none' }; ACC.white_gloves = { slot: 'none' }; ACC.glove_right = { slot: 'none' };
  // 兜帽：后片（背后）+ 前缘（框住脸）
  ACC.hood = { slot: 'back', draw: function (C, g, H, B, o) {
    var r = H.r, u = H.u * C.lw, cx = H.cx, c = o.c || '#0c0c12', p = pal(c);
    piece(C, g, { f: function (g2) { sym(g2, cx, [0, H.T - r * 0.16], [[H.fw * 0.9, H.T - r * 0.17, H.fw * 1.42, H.T + r * 0.05, H.fw * 1.45, H.eyeY], [H.fw * 1.5, H.C, B.nw * 3.4, B.ny + r * 0.05], [0, B.ny + r * 0.1]]); },
      fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'wool') : null, sh: function (g2) { g2.fillStyle = K.lin(g2, cx - H.fw * 1.4, 0, cx + H.fw * 1.4, 0, [A(p.l, 0.4), A(p.b, 0), A(p.d, 0.6)]); g2.fillRect(cx - r, H.T - r * 0.3, r * 2, r * 1.6); }, ln: p.ln, lw: 1.3 * u, ow: 2.4 * u });
  } };
  function hoodFront(C, g, H, B, o) {
    var r = H.r, u = H.u * C.lw, cx = H.cx, c = o.c || '#0c0c12', p = pal(c), s;
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        var f = function (g2) { P(g2, ['M', 0, H.T - r * 0.17, 'C', H.fw * 0.9, H.T - r * 0.18, H.fw * 1.42, H.T + r * 0.05, H.fw * 1.45, H.eyeY, 'C', H.fw * 1.5, H.C, B.nw * 3.0, B.ny, B.nw * 3.3, B.ny + r * 0.1,
          'L', B.nw * 1.6, B.ny + r * 0.06, 'C', H.fw * 1.05, H.C, H.fw * 1.1, H.eyeY + r * 0.1, H.fw * 1.08, H.eyeY - r * 0.05, 'C', H.fw * 1.05, H.T + r * 0.12, H.fw * 0.6, H.T - r * 0.02, 0, H.T - r * 0.04, 'Z'], cx, s); };
        piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'wool') : null, sh: function (g2) {
          g2.fillStyle = s < 0 ? A(p.l, C.l >= 1 ? 0.22 : 0.12) : A(p.d, 0.5); g2.fillRect(cx - r * 1.2, H.T - r * 0.3, r * 2.4, r * 1.6);
          if (C.m >= 1) { fold(g2, cx + s * H.fw * 1.3, H.T + r * 0.1, cx + s * H.fw * 1.35, H.C, s * r * 0.03, r * 0.015, A(p.d, 0.7)); fold(g2, cx + s * H.fw * 0.5, H.T - r * 0.12, cx + s * H.fw * 1.15, H.T + r * 0.15, -s * r * 0.02, r * 0.012, A(p.d, 0.6)); }
          if (C.l >= 2) { f(g2); g2.strokeStyle = s < 0 ? A('#a0a8d0', 0.35) : A('#ff4060', 0.15); g2.lineWidth = 4 * u; g2.stroke(); }
        }, ln: p.ln, lw: 1.3 * u, ow: 2.4 * u });
      })(s);
    }
  }

  /* ====================== 面具 ====================== */
  // MASK[k] = { cover: 'full'|'upper'|'lower', draw(C, g, H, B, cf, X, o) }
  MASK.crow = { cover: 'full', draw: function (C, g, H, B, cf, X, o) {
    var r = H.r, u = H.u * C.lw, cx = H.cx, c = o.c || '#16161c', p = pal(c), gl = X.glow === undefined ? 0.6 : X.glow, gc = (cf.glow && cf.glow.c) || o.glowC || '#ff3050', s, i;
    // 兜帽内的黑暗
    sym(g, cx, [0, H.T - r * 0.03], [[H.fw * 0.7, H.T - r * 0.03, H.fw * 1.1, H.T + r * 0.15, H.fw * 1.1, H.eyeY], [H.fw * 1.1, H.C, 0, H.C + r * 0.1]]);
    g.fillStyle = K.rad(g, cx, H.eyeY, r * 0.1, r * 0.7, ['#140814', '#06030a']); g.fill();
    // 面具上半（额与颊）
    var mf = function (g2) { sym(g2, cx, [0, H.browY - r * 0.16], [[H.fw * 0.55, H.browY - r * 0.18, H.fw * 0.95, H.browY - r * 0.06, H.fw * 0.98, H.eyeY], [H.fw * 0.98, H.noseY - r * 0.02, H.fw * 0.6, H.noseY + r * 0.04, H.fw * 0.25, H.noseY], [0, H.noseY - r * 0.02]]); };
    piece(C, g, { f: mf, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'leather') : null, sh: function (g2) {
      g2.fillStyle = C.l >= 1 ? K.rad(g2, cx - H.fw * 0.4, H.browY, r * 0.02, r * 0.5, [[0, A(p.l, 0.6)], [0.5, A(p.b, 0)], [1, A(p.d, 0.7)]]) : A(p.s, 0.4); g2.fillRect(cx - r, H.T, r * 2, r);
      if (C.m >= 1) for (s = -1; s <= 1; s += 2) for (i = 0; i < 4; i++) { var fx = cx + s * H.fw * (0.35 + i * 0.16), fy = H.browY - r * 0.1 + i * r * 0.04; fold(g2, fx, fy, fx + s * r * 0.09, fy + r * 0.12, s * r * 0.02, r * 0.014, A(p.d, 0.8)); }
    }, ln: '#000000', lw: 1.3 * u, ow: 2.4 * u });
    // 眼洞与红光
    for (s = -1; s <= 1; s += 2) {
      var ex = cx + s * H.ex * 0.95, ey = H.eyeY + r * 0.005;
      ell(g, ex, ey, r * 0.07, r * 0.058, s * 0.25); fillC(g, '#050206'); strokeW(g, A(p.l, 0.5), 1.4 * u);
      ell(g, ex, ey, r * 0.045 * (0.6 + gl * 0.5), r * 0.03 * (0.6 + gl * 0.5), s * 0.25); fillC(g, K.mix('#400010', gc, Math.min(1, 0.4 + gl * 0.6)));
      circ(g, ex + s * r * 0.005, ey, r * 0.012 * (0.5 + gl)); fillC(g, K.mix(gc, '#ffffff', 0.4 * gl));
      if (C.l >= 1) K.glow(g, ex, ey, r * (0.14 + gl * 0.14), gc, 0.25 + gl * 0.45);
    }
    // 喙
    var bf = function (g2) { g2.beginPath(); g2.moveTo(cx - r * 0.09, H.eyeY - r * 0.02); g2.bezierCurveTo(cx - r * 0.13, H.noseY, cx - r * 0.06, H.C + r * 0.12, cx + r * 0.015, H.C + r * 0.3);
      g2.bezierCurveTo(cx + r * 0.05, H.C + r * 0.1, cx + r * 0.13, H.noseY, cx + r * 0.09, H.eyeY - r * 0.02); g2.quadraticCurveTo(cx, H.eyeY - r * 0.07, cx - r * 0.09, H.eyeY - r * 0.02); g2.closePath(); };
    var bp = pal('#22222a');
    piece(C, g, { f: bf, fill: bp.b, sh: function (g2) {
      g2.fillStyle = K.lin(g2, cx - r * 0.12, 0, cx + r * 0.12, 0, [[0, A(bp.l, C.l >= 1 ? 0.7 : 0.4)], [0.4, A(bp.b, 0)], [1, A(bp.d, 0.8)]]); g2.fillRect(cx - r * 0.2, H.eyeY - r * 0.1, r * 0.4, r * 0.8);
      g2.beginPath(); g2.moveTo(cx - r * 0.02, H.eyeY - r * 0.03); g2.quadraticCurveTo(cx - r * 0.03, H.C, cx + r * 0.01, H.C + r * 0.25); strokeW(g2, A('#9aa0c0', C.l >= 2 ? 0.55 : 0.3), 2 * u);
      g2.beginPath(); g2.moveTo(cx - r * 0.1, H.noseY - r * 0.01); g2.quadraticCurveTo(cx, H.noseY + r * 0.04, cx + r * 0.1, H.noseY - r * 0.01); strokeW(g2, A('#000000', 0.7), 1.4 * u);
      for (s = -1; s <= 1; s += 2) { ell(g2, cx + s * r * 0.04, H.noseY - r * 0.05, r * 0.014, r * 0.006, s * 0.4); fillC(g2, '#000000'); }
    }, ln: '#000000', lw: 1.3 * u, ow: 2.4 * u });
    if (C.l >= 2) { g.save(); g.globalCompositeOperation = 'lighter'; g.beginPath(); g.moveTo(cx - r * 0.05, H.eyeY + r * 0.06); g.quadraticCurveTo(cx - r * 0.06, H.noseY + r * 0.1, cx - r * 0.02, H.C + r * 0.12); strokeW(g, A('#8890c0', 0.3), 2.5 * u); g.restore(); }
  } };
  MASK.moth = { cover: 'upper', overHood: true, draw: function (C, g, H, B, cf, X, o) {
    var r = H.r, u = H.u * C.lw, cx = H.cx, c = o.c || '#f4f0e8', p = pal(c), s, i, gl = X.glow === undefined ? 0.4 : X.glow;
    if (o.cover === 'full') {
      sym(g, cx, [0, H.T - r * 0.03], [[H.fw * 0.7, H.T - r * 0.03, H.fw * 1.1, H.T + r * 0.15, H.fw * 1.1, H.eyeY], [H.fw * 1.1, H.C, 0, H.C + r * 0.1]]);
      g.fillStyle = K.rad(g, cx, H.eyeY, r * 0.1, r * 0.7, ['#1a1820', '#08070c']); g.fill();
    }
    for (s = -1; s <= 1; s += 2) {
      (function (s) {
        var wf = function (g2) { P(g2, ['M', r * 0.02, H.browY - r * 0.05, 'C', H.fw * 0.6, H.browY - r * 0.3, H.fw * 1.5, H.browY - r * 0.35, H.fw * 1.55, H.browY - r * 0.05,
          'C', H.fw * 1.6, H.eyeY + r * 0.1, H.fw * 1.1, H.eyeY + r * 0.12, H.fw * 0.9, H.noseY - r * 0.02, 'C', H.fw * 0.6, H.noseY + r * 0.02, r * 0.08, H.noseY - r * 0.04, r * 0.02, H.eyeY + r * 0.05, 'Z'], cx, s); };
        piece(C, g, { f: wf, fill: p.b, tex: C.t > 0 ? ['paper', { c1: K.shade(c, -0.06), c2: c, seed: 3 }, 60] : null, sh: function (g2) {
          g2.fillStyle = K.lin(g2, cx, 0, cx + s * H.fw * 1.5, 0, [A(p.s, 0.1), A(p.s, 0.5)]); g2.fillRect(cx - r * 1.5, H.T, r * 3, r);
          if (C.m >= 1) { g2.strokeStyle = A(p.ln, 0.4); g2.lineWidth = 1 * u; for (i = 0; i < 5; i++) { g2.beginPath(); g2.moveTo(cx + s * r * 0.05, H.eyeY - r * 0.05); g2.quadraticCurveTo(cx + s * H.fw * (0.6 + i * 0.2), H.browY - r * (0.25 - i * 0.04), cx + s * H.fw * (1.0 + i * 0.12), H.eyeY + r * (i * 0.03 - 0.1)); g2.stroke(); } }
          circ(g2, cx + s * H.fw * 1.15, H.browY - r * 0.08, r * 0.06); fillC(g2, A('#6a4a3a', 0.6)); circ(g2, cx + s * H.fw * 1.15, H.browY - r * 0.08, r * 0.03); fillC(g2, A('#2a1a1a', 0.8));
        }, ln: p.ln, lw: 1.3 * u, ow: 2.4 * u });
        ell(g, cx + s * H.ex, H.eyeY, H.ew * 0.42, H.eh * 0.3, s * 0.15); fillC(g, '#0a0608');
        var gcm = (cf.glow && cf.glow.c) || '#e0d8ff';
        circ(g, cx + s * H.ex, H.eyeY, H.ew * 0.08); fillC(g, A(gcm, 0.4 + gl * 0.5));
        if (C.l >= 1 && cf.glow) K.glow(g, cx + s * H.ex, H.eyeY, r * (0.1 + gl * 0.1), gcm, 0.2 + gl * 0.35);
        // 羽状触角：主干 + 两侧细羽枝
        var ax0 = cx + s * r * 0.03, ay0 = H.browY - r * 0.08, c1x = cx + s * r * 0.08, c1y = H.T - r * 0.08, c2x = cx + s * r * 0.26, c2y = H.T - r * 0.2, ax1 = cx + s * r * 0.34, ay1 = H.T - r * 0.08;
        if (C.m >= 1) {
          g.strokeStyle = A(p.ln, 0.8); g.lineWidth = 1 * u;
          for (i = 2; i < 15; i++) {
            var tt = i / 15, bx = bz(ax0, c1x, c2x, ax1, tt), by = bz(ay0, c1y, c2y, ay1, tt), dx2 = bzd(ax0, c1x, c2x, ax1, tt), dy2 = bzd(ay0, c1y, c2y, ay1, tt), dl = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1, fl = r * 0.045 * Math.sin(tt * PI) + r * 0.008;
            g.beginPath(); g.moveTo(bx - dy2 / dl * fl, by + dx2 / dl * fl - fl * 0.3); g.lineTo(bx, by); g.lineTo(bx + dy2 / dl * fl, by - dx2 / dl * fl - fl * 0.3); g.stroke();
          }
        }
        g.beginPath(); g.moveTo(ax0, ay0); g.bezierCurveTo(c1x, c1y, c2x, c2y, ax1, ay1); strokeW(g, p.ln, 3 * u); g.beginPath(); g.moveTo(ax0, ay0); g.bezierCurveTo(c1x, c1y, c2x, c2y, ax1, ay1); strokeW(g, p.b, 1.6 * u);
      })(s);
    }
    ell(g, cx, H.eyeY, r * 0.03, r * 0.12); fillC(g, p.s); strokeW(g, p.ln, 1.2 * u);
  } };
  MASK.fox = { cover: 'full', draw: function (C, g, H, B, cf, X, o) {
    var r = H.r, u = H.u * C.lw, cx = H.cx, c = o.c || '#f8f6f0', p = pal(c), s;
    var f = function (g2) { sym(g2, cx, [0, H.T + r * 0.05], [[H.fw * 0.4, H.T + r * 0.05], [H.fw * 0.75, H.T - r * 0.12], [H.fw * 0.95, H.browY], [H.fw * 1.0, H.noseY, H.fw * 0.5, H.C, 0, H.C + r * 0.04]]); };
    piece(C, g, { f: f, fill: p.b, sh: function (g2) { g2.fillStyle = K.lin(g2, cx - H.fw, 0, cx + H.fw, 0, [A(p.l, 0.3), A(p.s, 0.1), A(p.s, 0.6)]); g2.fillRect(cx - r, H.T - r * 0.2, r * 2, r * 1.3); }, ln: p.ln, lw: 1.3 * u, ow: 2.4 * u });
    for (s = -1; s <= 1; s += 2) {
      P(g, ['M', H.fw * 0.48, H.T + r * 0.02, 'L', H.fw * 0.72, H.T - r * 0.07, 'L', H.fw * 0.8, H.browY - r * 0.04, 'Z'], cx, s); fillC(g, '#d03040');
      P(g, ['M', H.ex - H.ew * 0.45, H.eyeY + r * 0.01, 'Q', H.ex, H.eyeY - r * 0.04, H.ex + H.ew * 0.5, H.eyeY - r * 0.05, 'Q', H.ex + H.ew * 0.1, H.eyeY + r * 0.02, H.ex - H.ew * 0.45, H.eyeY + r * 0.01, 'Z'], cx, s); fillC(g, '#1a0a10');
      P(g, ['M', H.ex - H.ew * 0.2, H.eyeY - r * 0.07, 'Q', H.ex + H.ew * 0.3, H.eyeY - r * 0.12, H.ex + H.ew * 0.7, H.eyeY - r * 0.04], cx, s); strokeW(g, '#d03040', 3 * u);
    }
    g.beginPath(); g.moveTo(cx - r * 0.05, H.mouthY); g.quadraticCurveTo(cx, H.mouthY + r * 0.03, cx + r * 0.05, H.mouthY); strokeW(g, '#d03040', 2.4 * u);
    circ(g, cx, H.noseY, r * 0.015); fillC(g, '#1a0a10');
  } };
  MASK.cloth = { cover: 'lower', draw: function (C, g, H, B, cf, X, o) {
    var r = H.r, u = H.u * C.lw, cx = H.cx, c = o.c || '#f4f4f6', p = pal(c), s, i;
    var f = function (g2) { sym(g2, cx, [0, H.noseY - r * 0.1], [[H.fw * 0.5, H.noseY - r * 0.1, H.fw * 0.92, H.noseY - r * 0.05], [H.fw * 0.88, H.jawY], [H.jw * 0.8, H.C - r * 0.02, 0, H.C + r * 0.01]]); };
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'cotton') : null, sh: function (g2) {
      g2.fillStyle = K.lin(g2, cx - H.fw, 0, cx + H.fw, 0, [A(p.l, 0.3), A(p.b, 0), A(p.s, 0.7)]); g2.fillRect(cx - r, H.noseY - r * 0.2, r * 2, r * 0.6);
      if (C.m >= 1) for (i = 0; i < 3; i++) { g2.beginPath(); g2.moveTo(cx - H.fw * 0.8, H.noseY + r * (0.0 + i * 0.05)); g2.quadraticCurveTo(cx, H.noseY + r * (0.03 + i * 0.05), cx + H.fw * 0.8, H.noseY + r * (0.0 + i * 0.05)); strokeW(g2, A(p.s, 0.6), 1 * u); }
    }, ln: p.ln, lw: 1.3 * u, ow: 2.2 * u });
    for (s = -1; s <= 1; s += 2) { g.beginPath(); g.moveTo(cx + s * H.fw * 0.92, H.noseY - r * 0.04); g.lineTo(cx + s * H.fw * 1.0, H.eyeY + r * 0.02); strokeW(g, p.ln, 1.6 * u); }
  } };
  MASK.half = MASK.cloth;

  /* ====================== 冬装与和装扩展（续作用） ====================== */
  function innerTop(C, g, H, B, kind, c) {
    var r = B.r;
    if (kind === 'turtle') { top(C, g, B, c, { tex: 'knit', nl: { y: B.ny + r * 0.06 } }); collarTurtle(C, g, H, B, c); }
    else if (kind === 'sweater') { OUTFIT.sweater.draw(C, g, H, B, { c: c }); }
    else if (kind === 'suit') { top(C, g, B, '#f0f0f2', { tex: 'shirt' }); collarShirt(C, g, B, '#f0f0f2'); tie(C, g, B, 'tie', '#4a2a3a', undefined, r * 0.6); jacket(C, g, H, B, { c: c, tex: 'wool', lapel: 'notch', vy: 0.56, buttons: 1, inf: 0.025 }); }
    else if (kind === 'cardigan') { top(C, g, B, '#ece8e0', { tex: 'shirt' }); collarShirt(C, g, B, '#ece8e0'); jacket(C, g, H, B, { c: c, tex: 'knit', lapel: 'none', vy: 0.4, vx: 0.01, buttons: 4, btnC: dk(c, 0.4), inf: 0.025 }); }
    else { top(C, g, B, c, { tex: 'shirt' }); collarShirt(C, g, B, c, { open: 1 }); }
  }
  // 长大衣：o.inner 'turtle'|'sweater'|'suit'|'cardigan'|'shirt'
  OUTFIT.overcoat = { draw: function (C, g, H, B, o) {
    innerTop(C, g, H, B, o.inner || 'turtle', o.c2 || '#2a3550');
    jacket(C, g, H, B, { c: o.c, tex: 'wool', lapel: o.lapel || 'wide', vy: o.vy || 0.38, vx: 0.15, ox: 0.3, buttons: 0, inf: 0.065, drape: 1, double: o.double });
  }, sprite: { legs: 'pants', coat: 0.85 } };
  OUTFIT.peacoat = { draw: function (C, g, H, B, o) {
    innerTop(C, g, H, B, o.inner || 'turtle', o.c2 || '#f0ece4');
    jacket(C, g, H, B, { c: o.c, tex: 'wool', lapel: 'wide', lapW: 0.21, vy: 0.36, vx: 0.08, ox: 0.04, double: 1, buttons: 3, btnC: dk(o.c, 0.5), inf: 0.055 });
  }, sprite: { legs: 'skirt', coat: 0.6 } };
  OUTFIT.duffle = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, i, s, tc = o.toggle || '#e8dcc0';
    innerTop(C, g, H, B, o.inner || 'sweater', o.c2 || '#8a2a3a');
    var J = jacket(C, g, H, B, { c: o.c, tex: 'wool', lapel: 'none', vy: 0.14, vx: 0.13, ox: 0.15, buttons: 0, inf: 0.065, drape: 1 });
    for (i = 0; i < 3; i++) {
      var ty = B.ny + r * (0.4 + i * 0.24);
      if (ty > B.bot - r * 0.03) break;
      for (s = -1; s <= 1; s += 2) { g.beginPath(); g.moveTo(B.cx + s * r * 0.2, ty - r * 0.012); g.quadraticCurveTo(B.cx + s * r * 0.08, ty + r * 0.02, B.cx + s * r * 0.01, ty); strokeW(g, '#3a2a1a', r * 0.016); strokeW(g, '#8a7050', r * 0.009); }
      g.save(); g.translate(B.cx - r * 0.02, ty); g.rotate(-0.15);
      piece(C, g, { f: function (g2) { rrect(g2, -r * 0.06, -r * 0.017, r * 0.12, r * 0.034, r * 0.017); }, fill: tc, sh: function (g2) { g2.fillStyle = A(pal(tc).s, 0.6); g2.fillRect(-r * 0.07, 0, r * 0.14, r * 0.03); }, ln: pal(tc).ln, lw: 1 * u, ow: 1.4 * u });
      g.restore();
    }
    void J;
  }, back: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, p = pal(o.c);
    piece(C, g, { f: function (g2) { ell(g2, B.cx, B.ny - r * 0.03, B.nw * 2.5, r * 0.17); }, fill: p.s, sh: function (g2) { ell(g2, B.cx, B.ny - r * 0.06, B.nw * 1.6, r * 0.09); fillC(g2, A(p.d, 0.6)); }, ln: p.ln, lw: 1.2 * u, ow: 2.2 * u });
  }, sprite: { legs: 'skirt', coat: 0.55 } };
  OUTFIT.quilted = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw;
    innerTop(C, g, H, B, o.inner || 'sweater', o.c2 || '#d8d0bc');
    jacket(C, g, H, B, { c: o.c, tex: 'cotton', lapel: 'stand', vy: 0.12, vx: 0.15, ox: 0.2, buttons: 0, inf: 0.06, sh: function (g2, p) {
      g2.strokeStyle = A(p.s, 0.75); g2.lineWidth = 1.1 * u;
      for (var i = -12; i <= 12; i++) { g2.beginPath(); g2.moveTo(B.cx + i * r * 0.14, B.ny - r * 0.2); g2.lineTo(B.cx + i * r * 0.14 + r * 0.9, B.ny + r * 0.7); g2.stroke(); g2.beginPath(); g2.moveTo(B.cx + i * r * 0.14, B.ny - r * 0.2); g2.lineTo(B.cx + i * r * 0.14 - r * 0.9, B.ny + r * 0.7); g2.stroke(); }
    } });
    for (var s = -1; s <= 1; s += 2) { var px = B.cx + s * B.sw * 0.48, py = B.ny + r * 0.62; rrect(g, px - r * 0.1, py, r * 0.2, r * 0.05, r * 0.01); fillC(g, K.shade(o.c, -0.12)); strokeW(g, pal(o.c).ln, 1.1 * u); }
  }, sprite: { legs: 'pants', coat: 0.35 } };
  OUTFIT.hunting = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, n = K.byModel(C.q, 12, 20, 30), i, fc = o.fur || '#c8b494', fp = pal(fc), rn = K.rng('hfur');
    innerTop(C, g, H, B, 'shirt', o.c2 || '#5a4a30');
    var J = jacket(C, g, H, B, { c: o.c, tex: 'canvas', lapel: 'none', vy: 0.18, vx: 0.11, ox: 0.16, buttons: 0, inf: 0.075, drape: 1 });
    // 毛领：沿颈根一圈，前端止于开襟
    piece(C, g, { f: function (g2) {
      g2.beginPath();
      for (i = 0; i <= n; i++) { var t = i / n, a = lerp(PI * 0.82, PI * 2.18, t), rr = (i % 2 ? 1 : 1.13) * (1 + rn.jit(0, 0.04)); var x = B.cx + Math.cos(a) * B.nw * 2.3 * rr, y = B.ny + r * 0.03 + Math.sin(a) * r * 0.16 * rr; if (i) g2.lineTo(x, y); else g2.moveTo(x, y); }
      g2.lineTo(B.cx + r * 0.13, B.ny + r * 0.24); g2.quadraticCurveTo(B.cx + B.nw * 1.1, B.ny + r * 0.06, B.cx + B.nw * 0.9, B.ny - r * 0.05);
      g2.quadraticCurveTo(B.cx, B.ny - r * 0.1, B.cx - B.nw * 0.9, B.ny - r * 0.05); g2.quadraticCurveTo(B.cx - B.nw * 1.1, B.ny + r * 0.06, B.cx - r * 0.13, B.ny + r * 0.24); g2.closePath();
    }, fill: fp.b, tex: C.t > 0 ? ['noise', { c1: fp.s, c2: fp.l, scale: 20, oct: 2, seed: 9 }, 30] : null, sh: function (g2) { g2.fillStyle = A(fp.s, 0.6); g2.fillRect(B.cx + B.nw, B.ny - r * 0.3, r, r * 0.6); }, ln: fp.ln, lw: 1.1 * u, ow: 2 * u });
    for (var s = -1; s <= 1; s += 2) { var px = B.cx + s * B.sw * 0.47, py = B.ny + r * 0.62; rrect(g, px - r * 0.11, py, r * 0.22, r * 0.2, r * 0.015); strokeW(g, J.p.ln, 1.3 * u); P(g, ['M', -r * 0.11, py, 'L', r * 0.11, py, 'L', r * 0.11, py + r * 0.06, 'L', -r * 0.11, py + r * 0.06, 'Z'], px, 1); fillC(g, K.shade(o.c, -0.1)); strokeW(g, J.p.ln, 1.2 * u); }
  }, sprite: { legs: 'pants', legC: '#4a3a28', coat: 0.4 } };
  // 袢缠 / 丹前 / 褞袍：o.eri 领条色（默认黑），o.inner 'kimono'|'sweater'，o.apron
  function shortHaori(C, g, H, B, o, open) {
    var r = B.r, u = B.u * C.lw;
    var J = jacket(C, g, H, B, { c: o.c, tex: 'tweed', lapel: 'none', vy: 0.02, vx: open ? 0.22 : 0.14, ox: open ? 0.3 : 0.2, buttons: 0, inf: 0.1, drape: 1 });
    for (var s = -1; s <= 1; s += 2) {
      P(g, ['M', B.nw * 1.0 + r * 0.01, B.ny - r * 0.08, 'L', B.nw * 1.0 + r * 0.1, B.ny - r * 0.06, 'L', (open ? 0.3 : 0.2) * r + r * 0.09, B.bot + 4, 'L', (open ? 0.3 : 0.2) * r, B.bot + 4, 'Z'], B.cx, s);
      fillC(g, o.eri || '#1e1a1a'); strokeW(g, J.p.ln, 1.2 * u);
      if (C.l >= 1) { P(g, ['M', B.nw * 1.0 + r * 0.03, B.ny - r * 0.07, 'L', (open ? 0.3 : 0.2) * r + r * 0.03, B.bot], B.cx, s); strokeW(g, A('#ffffff', 0.12), r * 0.012); }
    }
    return J;
  }
  function apron(C, g, B, kind, c, c2) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, ap = pal(c || '#f4f2ee'), i;
    var f = function (g2) { sym(g2, cx, [0, B.ny + r * 0.42], [[B.sw * 0.36, B.ny + r * 0.4], [B.sw * 0.44, B.bot + 4], [0, B.bot + 4]]); };
    piece(C, g, { f: f, fill: ap.b, sh: function (g2) {
      clothShade(C, g2, B, ap, { noArms: 1, noNeckShadow: 1, drape: 1 });
      if (kind === 'check') { g2.strokeStyle = A(c2 || '#a04040', 0.5); g2.lineWidth = r * 0.012; for (i = -12; i <= 12; i++) { g2.beginPath(); g2.moveTo(cx + i * r * 0.06, B.ny); g2.lineTo(cx + i * r * 0.06, B.bot + 4); g2.stroke(); g2.beginPath(); g2.moveTo(cx - B.sw, B.ny + r * 0.4 + (i + 12) * r * 0.06); g2.lineTo(cx + B.sw, B.ny + r * 0.4 + (i + 12) * r * 0.06); g2.stroke(); } }
    }, ln: ap.ln, lw: 1.3 * u, ow: 2 * u });
    for (var s = -1; s <= 1; s += 2) { g.beginPath(); g.moveTo(cx + s * B.sw * 0.34, B.ny + r * 0.41); g.lineTo(cx + s * B.nw * 1.3, B.ny - r * 0.02); strokeW(g, ap.ln, r * 0.03); strokeW(g, ap.b, r * 0.02); }
  }
  // 割烹着：带袖的白色罩衫，露出和服领
  function kappogi(C, g, B, c) {
    var r = B.r, cp = pal(c || '#f6f4f0');
    garment(C, g, B, bodyPath(B, 0.09 * r, { y: B.ny + r * 0.42, v: 1, w: B.nw * 2.1 }), cp.b, { tex: 'cotton', inf: 0.09 * r, drape: 1 });
  }
  var _kimonoDraw = OUTFIT.kimono.draw;
  OUTFIT.kimono = { draw: function (C, g, H, B, o) {
    if (o.open) { kimonoBody(C, g, H, B, o.c || '#2a2424', o.eri || dk(o.c || '#2a2424', 0.3), H.sp.b, { tex: 'cotton', cross: 0.58 }); if (o.obi !== false) obi(C, g, B, o.c3 || '#5a3a30', B.ny + B.r * 1.1, {}); return; }
    _kimonoDraw(C, g, H, B, o);
    if (o.apron === 'kappogi') kappogi(C, g, B, o.apronC);
    else if (o.apron) apron(C, g, B, o.apron, o.apronC, o.checkC);
  }, sprite: { legs: 'robe' } };
  OUTFIT.tanzen = { draw: function (C, g, H, B, o) { OUTFIT.kimono.draw(C, g, H, B, merge(o, { open: 1 })); }, sprite: { legs: 'robe' } };
  OUTFIT.dotera = { draw: function (C, g, H, B, o) {
    kimonoBody(C, g, H, B, o.c || '#3a2a24', o.eri || '#141010', o.c2 || '#8a7a68', { tex: 'tweed', cross: 0.4 });
    if (C.m >= 1) { var r = B.r, u = B.u * C.lw; g.save(); bodyPath(B, 0.05 * r, { y: B.ny + r * 0.04 })(g); g.clip(); g.strokeStyle = A(pal(o.c || '#3a2a24').s, 0.6); g.lineWidth = 1.2 * u; for (var i = 0; i < 6; i++) { g.beginPath(); g.moveTo(B.cx - B.bw * 1.2, B.ny + r * (0.2 + i * 0.16)); g.quadraticCurveTo(B.cx, B.ny + r * (0.14 + i * 0.16), B.cx + B.bw * 1.2, B.ny + r * (0.2 + i * 0.16)); g.stroke(); } g.restore(); }
  }, sprite: { legs: 'robe' } };
  OUTFIT.hanten = { draw: function (C, g, H, B, o) {
    if (o.inner === 'sweater') innerTop(C, g, H, B, 'sweater', o.c2 || '#6a6a72');
    else kimonoBody(C, g, H, B, o.c2 || '#5a5a6a', o.c2 || '#5a5a6a', o.c4 || '#e8e0d4', { tex: 'cotton', cross: 0.34 });
    if (o.apron) apron(C, g, B, o.apron, o.apronC, o.checkC);
    shortHaori(C, g, H, B, o, true);
  }, sprite: { legs: 'pants', legC: '#4a4a58', coat: 0.3 } };
  var _hakamaMiko = OUTFIT.miko.draw;
  OUTFIT.miko = { draw: function (C, g, H, B, o) {
    _hakamaMiko(C, g, H, B, o);
    if (o.haori) {
      var J = shortHaori(C, g, H, B, { c: o.haori, eri: o.haoriEri || K.shade(o.haori, -0.06) }, true);
      var hc = o.himo || '#e8e0f0', r = B.r, u = B.u * C.lw;
      g.beginPath(); g.moveTo(B.cx - r * 0.24, B.ny + r * 0.6); g.quadraticCurveTo(B.cx, B.ny + r * 0.68, B.cx + r * 0.24, B.ny + r * 0.6); strokeW(g, pal(hc).ln, r * 0.024); strokeW(g, hc, r * 0.015);
      circ(g, B.cx, B.ny + r * 0.665, r * 0.028); fillC(g, hc); strokeW(g, pal(hc).ln, 1 * u);
      void J;
    }
  }, sprite: { legs: 'hakama', legC: '#c02030' } };
  // 斗篷（红里子）罩在和服外
  OUTFIT.cape = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, s, lin = o.lining || '#c02030';
    kimonoBody(C, g, H, B, o.c2 || '#f6f4f0', o.c2 || '#f6f4f0', o.under || lin, { tex: 'cotton', cross: 0.36 });
    jacket(C, g, H, B, { c: o.c || '#2a2a30', tex: 'wool', lapel: 'none', vy: 0.06, vx: 0.2, ox: 0.4, buttons: 0, inf: 0.11, drape: 1 });
    var npx = B.nw + r * 0.01 + 0.11 * r * 0.15, npy = B.ny - r * 0.075, vx = 0.2 * r, vy = B.ny + 0.06 * r, ox = 0.4 * r, bot = B.bot + 4;
    for (s = -1; s <= 1; s += 2) {
      P(g, ['M', npx - r * 0.01, npy, 'C', npx - r * 0.05, npy + r * 0.12, vx + r * 0.02, lerp(vy, npy, 0.5), vx, vy, 'C', vx, vy + (bot - vy) * 0.2, ox, lerp(vy, bot, 0.5), ox, bot], B.cx, s);
      strokeW(g, lin, r * 0.045); strokeW(g, A(pal(lin).ln, 0.8), 1.1 * u);
    }
    var cl = o.clasp || '#c0a060'; circ(g, B.cx - r * 0.2, B.ny + r * 0.05, r * 0.022); fillC(g, cl); circ(g, B.cx + r * 0.2, B.ny + r * 0.05, r * 0.022); fillC(g, cl);
    g.beginPath(); g.moveTo(B.cx - r * 0.2, B.ny + r * 0.05); g.lineTo(B.cx + r * 0.2, B.ny + r * 0.05); strokeW(g, cl, r * 0.01);
  }, sprite: { legs: 'robe' } };
  // 立领学生服（可外罩棉外套）
  OUTFIT.gakuran = { draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, c = o.c || '#1a1a24', i;
    garment(C, g, B, bodyPath(B, 0.02 * r, { y: B.ny + r * 0.02 }), c, { tex: 'wool' });
    collarBand(C, g, B, c, 0.11);
    g.beginPath(); g.moveTo(B.cx, B.ny + r * 0.06); g.lineTo(B.cx, B.bot + 4); strokeW(g, pal(c).ln, 1.3 * u);
    for (i = 0; i < 5; i++) button(C, g, B.cx, B.ny + r * (0.12 + i * 0.17), r * 0.02, '#d8b050', u);
    if (o.coat) jacket(C, g, H, B, { c: o.coat, tex: 'cotton', lapel: 'stand', vy: 0.15, vx: 0.2, ox: 0.28, buttons: 0, inf: 0.07, sh: function (g2, p) {
      g2.strokeStyle = A(p.s, 0.8); g2.lineWidth = 1.3 * u; for (var k = 0; k < 6; k++) { var y = B.ny + r * (0.15 + k * 0.17); g2.beginPath(); g2.moveTo(B.cx - B.sw * 1.4, y + r * 0.03); g2.quadraticCurveTo(B.cx, y - r * 0.02, B.cx + B.sw * 1.4, y + r * 0.03); g2.stroke(); }
    } });
  }, sprite: { legs: 'pants', legC: '#1a1a24' } };

  /* ---- 新配件 ---- */
  ACC.camellia = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), r = H.r, u = H.u * C.lw, s = o.side || 1, sz = r * 0.06 * (o.size || 1), i;
    var x = H.cx + s * G.rx * (o.x || 0.8), y = G.top + G.ry * (o.y || 0.5), c = o.c || '#c8102e', p = pal(c);
    if (o.pin) { g.beginPath(); g.moveTo(x - s * sz * 0.2, y + sz * 0.3); g.lineTo(x - s * sz * 2.4, y - sz * 1.2); strokeW(g, '#5a4020', 3 * u); strokeW(g, '#c8a060', 1.6 * u); }
    for (i = 0; i < 2; i++) { var la = s * (0.6 + i * 1.6) + PI * 0.5; piece(C, g, { f: (function (la) { return function (g2) { ell(g2, x + Math.cos(la) * sz * 1.25, y + Math.sin(la) * sz * 1.0, sz * 0.75, sz * 0.38, la); }; })(la), fill: '#2a6a3a', sh: function (g2) { g2.fillStyle = A('#103a1a', 0.5); g2.fillRect(x, y - sz * 3, sz * 3, sz * 6); }, ln: '#0e2a14', lw: 1 * u, ow: 1.4 * u }); }
    for (i = 0; i < 6; i++) { var a = i / 6 * PI * 2 + 0.3; piece(C, g, { f: (function (a) { return function (g2) { ell(g2, x + Math.cos(a) * sz * 0.55, y + Math.sin(a) * sz * 0.5, sz * 0.62, sz * 0.5, a); }; })(a), fill: p.b, sh: function (g2) { g2.fillStyle = K.rad(g2, x - sz * 0.3, y - sz * 0.3, 0, sz * 1.4, [A(p.l, 0.4), A(p.b, 0), A(p.d, 0.5)]); g2.fillRect(x - sz * 2, y - sz * 2, sz * 4, sz * 4); }, ln: p.ln, lw: 1 * u, ow: 1.4 * u }); }
    circ(g, x, y, sz * 0.42); fillC(g, K.shade(c, 0.12)); strokeW(g, p.ln, 1 * u);
    for (i = 0; i < 7; i++) { var a2 = i / 7 * PI * 2; circ(g, x + Math.cos(a2) * sz * 0.2, y + Math.sin(a2) * sz * 0.2, sz * 0.09); fillC(g, '#f0d040'); }
  } };
  ACC.kanzashi = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) { ACC.camellia.draw(C, g, H, B, merge({ pin: 1 }, o), cf, X, hd); } };
  ACC.comb = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), r = H.r, u = H.u * C.lw, s = o.side || 1, x = H.cx + s * G.rx * 0.38, y = G.top + G.ry * 0.12, c = o.c || '#8a4a1a', i;
    g.save(); g.translate(x, y); g.rotate(s * 0.35);
    var f = function (g2) { g2.beginPath(); g2.arc(0, r * 0.06, r * 0.1, PI * 1.08, PI * 1.92); g2.lineTo(r * 0.09, r * 0.07); g2.lineTo(-r * 0.09, r * 0.07); g2.closePath(); };
    piece(C, g, { f: f, fill: c, sh: function (g2) { var rn = K.rng('tort'); for (i = 0; i < 12; i++) { ell(g2, (rn() - 0.5) * r * 0.18, rn() * r * 0.06 - r * 0.02, r * 0.02, r * 0.012, rn()); fillC(g2, A(rn() < 0.5 ? '#e0a050' : '#3a1a08', 0.6)); } if (C.l >= 2) { g2.beginPath(); g2.arc(0, r * 0.06, r * 0.09, PI * 1.2, PI * 1.5); strokeW(g2, A('#ffffff', 0.4), r * 0.01); } }, ln: '#2a1006', lw: 1.1 * u, ow: 1.6 * u });
    g.restore();
  } };
  ACC.nurse_watch = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, x = B.cx + B.sw * (o.x || 0.42), y = B.ny + r * (o.y || 0.42);
    g.beginPath(); g.moveTo(x, y - r * 0.08); g.lineTo(x, y - r * 0.035); strokeW(g, '#c0c0c8', 1.6 * u);
    rrect(g, x - r * 0.02, y - r * 0.1, r * 0.04, r * 0.025, r * 0.006); fillC(g, '#c0c0c8'); strokeW(g, '#505058', 0.8 * u);
    circ(g, x, y, r * 0.035); fillC(g, o.c || '#d8d8e0'); strokeW(g, '#40404a', 1.1 * u);
    circ(g, x, y, r * 0.026); fillC(g, '#fbfbf6'); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - r * 0.018); g.moveTo(x, y); g.lineTo(x + r * 0.013, y); strokeW(g, '#202020', 0.9 * u);
  } };
  ACC.cig_pack = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, x = B.cx + B.sw * (o.x || 0.46), y = B.ny + r * (o.y || 0.55);
    rrect(g, x - r * 0.05, y - r * 0.05, r * 0.1, r * 0.08, r * 0.008); fillC(g, '#f0f0f4'); strokeW(g, '#404050', 1 * u);
    g.fillStyle = '#2a4a9a'; g.fillRect(x - r * 0.05, y - r * 0.02, r * 0.1, r * 0.025);
    for (var i = 0; i < 2; i++) { g.fillStyle = '#f4ecdc'; g.fillRect(x - r * 0.03 + i * r * 0.025, y - r * 0.075, r * 0.016, r * 0.03); g.fillStyle = '#d8a860'; g.fillRect(x - r * 0.03 + i * r * 0.025, y - r * 0.075, r * 0.016, r * 0.01); }
  } };
  ACC.rifle = { slot: 'back', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, s = o.side || 1, x = B.cx + s * B.sw * 0.55, y = B.shY - r * 0.1;
    g.save(); g.translate(x, y); g.rotate(s * 0.32);
    piece(C, g, { f: function (g2) { rrect(g2, -r * 0.018, -r * 0.75, r * 0.036, r * 0.95, r * 0.01); }, fill: '#2a2a2e', sh: function (g2) { g2.fillStyle = K.lin(g2, -r * 0.02, 0, r * 0.02, 0, ['rgba(255,255,255,0.3)', 'rgba(0,0,0,0)']); g2.fillRect(-r * 0.02, -r * 0.8, r * 0.04, r); }, ln: '#000000', lw: 1 * u, ow: 1.8 * u });
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(-r * 0.03, r * 0.1); g2.lineTo(r * 0.04, r * 0.1); g2.lineTo(r * 0.06, r * 0.4); g2.lineTo(-r * 0.05, r * 0.42); g2.closePath(); }, fill: '#6a4020', ln: '#2a1408', lw: 1 * u, ow: 1.8 * u });
    g.restore();
  } };
  ACC.rifle_sling = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, s = o.side || 1;
    g.beginPath(); g.moveTo(B.cx + s * B.sw * 0.68, B.shY - r * 0.04); g.quadraticCurveTo(B.cx, B.ny + r * 0.55, B.cx - s * B.sw * 0.5, B.bot + 4);
    strokeW(g, '#1a1008', r * 0.045); strokeW(g, o.c || '#5a3a20', r * 0.032);
  } };
  ACC.whistle_cord = { slot: 'body', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, s = o.side || -1, x0 = B.cx + s * B.sw * 0.62, y0 = B.shY - r * 0.02, x1 = B.cx + s * B.sw * 0.4, y1 = B.ny + r * 0.45;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + s * r * 0.02, lerp(y0, y1, 0.7), x1, y1); strokeW(g, o.c || '#d8d8e0', 2 * u);
    rrect(g, x1 - r * 0.012, y1, r * 0.024, r * 0.06, r * 0.006); fillC(g, '#c8c8d0'); strokeW(g, '#505058', 0.8 * u);
  } };
  ACC.hachimaki = { slot: 'head', draw: function (C, g, H, B, o, cf, X, hd) {
    var G = capG(H, hd), r = H.r, u = H.u * C.lw, c = o.c || '#e8e4d8', p = pal(c), cx = H.cx, y = G.hl + r * 0.03;
    var f = function (g2) { g2.beginPath(); g2.moveTo(cx - G.rx * 1.02, y + r * 0.02); g2.quadraticCurveTo(cx, y - r * 0.08, cx + G.rx * 1.02, y + r * 0.02); g2.lineTo(cx + G.rx * 1.0, y + r * 0.08); g2.quadraticCurveTo(cx, y - r * 0.01, cx - G.rx * 1.0, y + r * 0.08); g2.closePath(); };
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'cotton') : null, sh: function (g2) { g2.fillStyle = K.lin(g2, cx - G.rx, 0, cx + G.rx, 0, [A(p.l, 0.3), A(p.b, 0), A(p.s, 0.6)]); g2.fillRect(cx - G.rx * 1.1, y - r * 0.1, G.rx * 2.2, r * 0.2); if (o.stripe) { g2.fillStyle = o.stripe; g2.fillRect(cx - G.rx * 1.1, y + r * 0.015, G.rx * 2.2, r * 0.012); } }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
    var kx = cx + G.rx * 0.98, ky = y + r * 0.05;
    for (var i = 0; i < 2; i++) piece(C, g, { f: (function (i) { return function (g2) { g2.beginPath(); g2.moveTo(kx, ky); g2.lineTo(kx + r * (0.1 + i * 0.03), ky + r * (0.03 + i * 0.08)); g2.lineTo(kx + r * (0.06 + i * 0.03), ky + r * (0.08 + i * 0.08)); g2.closePath(); }; })(i), fill: K.shade(c, -0.08 * i), ln: p.ln, lw: 1.1 * u, ow: 1.6 * u });
    circ(g, kx, ky, r * 0.028); fillC(g, p.b); strokeW(g, p.ln, 1.1 * u);
  } };
  ACC.mino = { slot: 'neck', draw: function (C, g, H, B, o) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, c = o.c || '#9a8250', p = pal(c), n = K.byModel(C.q, 16, 26, 40), i, rn = K.rng('mino'), by = B.ny + r * 0.7;
    var f = function (g2) {
      g2.beginPath(); g2.moveTo(cx - B.nw * 1.1, B.ny - r * 0.06);
      g2.quadraticCurveTo(cx - B.sw * 0.7, B.ny - r * 0.02, cx - B.sw - r * 0.08, B.shY + r * 0.1);
      for (i = 0; i <= n; i++) { var t = i / n, x = lerp(cx - B.sw - r * 0.1, cx + B.sw + r * 0.1, t); g2.lineTo(x, by + Math.sin(t * PI) * r * 0.08 + (i % 2 ? -r * 0.03 : r * 0.02) + rn.jit(0, r * 0.015)); }
      g2.lineTo(cx + B.sw + r * 0.08, B.shY + r * 0.1); g2.quadraticCurveTo(cx + B.sw * 0.7, B.ny - r * 0.02, cx + B.nw * 1.1, B.ny - r * 0.06); g2.closePath();
    };
    piece(C, g, { f: f, fill: p.b, tex: C.t > 0 ? ['thatch', { c1: K.shade(c, -0.25), c2: K.shade(c, 0.12), seed: 8 }, 50] : null, sh: function (g2) {
      clothShade(C, g2, B, p, { noArms: 1, noNeckShadow: 1, noFolds: 1 });
      g2.strokeStyle = A(p.d, 0.6); g2.lineWidth = 1 * u;
      for (i = 0; i < n * 2; i++) { var x = cx + (rn() * 2 - 1) * (B.sw + r * 0.1), y = B.ny + rn() * r * 0.75; g2.beginPath(); g2.moveTo(x, y); g2.lineTo(x + (x - cx) * 0.04, y + r * 0.1); g2.stroke(); }
      for (i = 0; i < 4; i++) { g2.beginPath(); g2.moveTo(cx - B.sw * 1.2, B.ny + r * (0.15 + i * 0.15)); g2.quadraticCurveTo(cx, B.ny + r * (0.08 + i * 0.15), cx + B.sw * 1.2, B.ny + r * (0.15 + i * 0.15)); strokeW(g2, A(p.d, 0.5), 1.6 * u); }
    }, ln: p.ln, lw: 1.2 * u, ow: 2.2 * u });
    g.beginPath(); g.moveTo(cx - B.nw * 1.1, B.ny - r * 0.04); g.quadraticCurveTo(cx, B.ny + r * 0.06, cx + B.nw * 1.1, B.ny - r * 0.04); strokeW(g, '#5a4020', r * 0.018);
  } };
  ACC.muffler = { slot: 'neck', draw: function (C, g, H, B, o) { ACC.scarf.draw(C, g, H, B, merge({ long: false }, o)); } };
  ACC.glove_right = { slot: 'none' };

  /* ---- 新发型 ---- */
  HAIR.bowl = { vol: 0.09, w: 1.05, bangs: { k: 'blunt', len: 0.32 }, side: { k: 'blunt', len: 0.4 }, back: { k: 'short', len: -0.04 }, noFly: 1 };
  HAIR.shoulder_straight = { vol: 0.06, bangs: { k: 'spiky', n: [6, 9, 11], len: 0.48, part: 0.15 }, side: { k: 'lock', len: 1.12, w: 0.18 }, back: { k: 'long', len: 0.3, w: 1.25 } };
  HAIR.shaggy = { vol: 0.1, w: 1.06, cap: 'tufts', bangs: { k: 'messy', n: [6, 8, 10], len: 0.5, part: 0.2, irr: 1.4 }, side: { k: 'ragged', len: 0.6, w: 0.16 }, back: { k: 'spiky', len: 0.12 } };
  HAIR.updo = { vol: 0.04, hl: 0.15, cap: 'swept', bangs: { k: 'parted', len: 0.4, part: 0.25 }, side: { k: 'lock', len: 0.55, w: 0.07, n: 1 }, back: { k: 'short', len: -0.12 }, extras: [{ k: 'bun', pos: 'back', r: 0.18 }] };

  /* ---- 新道具 ---- */
  PROP.slate = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, cx = B.cx, sd = o.side || 1, x = cx + sd * B.sw * 0.34, y = B.ny + r * 0.66, w = r * 0.42, h = r * 0.3, ang = -sd * 0.12, i;
    var wx = x + Math.cos(ang) * (-sd * w * 0.12) - Math.sin(ang) * (h * 0.5 + r * 0.06), wy = y + Math.sin(ang) * (-sd * w * 0.12) + Math.cos(ang) * (h * 0.5 + r * 0.06);
    forearm(C, g, B, cx + sd * B.sw * 0.98, wx, wy + r * 0.02, cf._sleeveC, cf._cuffC);
    // 挂粉笔的绳
    g.beginPath(); g.moveTo(x - sd * w * 0.45, y - h * 0.4); g.quadraticCurveTo(x - sd * w * 0.7, y + h * 0.3, x - sd * w * 0.55, y + h * 0.75); strokeW(g, '#c8b8a0', 1.6 * u);
    rrect(g, x - sd * w * 0.55 - r * 0.012, y + h * 0.72, r * 0.024, r * 0.07, r * 0.008); fillC(g, '#f4f2ec'); strokeW(g, '#9a9488', 0.8 * u);
    g.save(); g.translate(x, y); g.rotate(ang);
    piece(C, g, { f: function (g2) { rrect(g2, -w / 2, -h / 2, w, h, r * 0.015); }, fill: '#a07850', tex: C.t > 0 ? ['wood', { c1: '#7a5634', c2: '#b08860', planks: 1, dir: 'h', seed: 4 }, 60] : null, ln: '#3a2814', lw: 1.2 * u, ow: 2 * u });
    piece(C, g, { f: function (g2) { rrect(g2, -w / 2 + r * 0.025, -h / 2 + r * 0.025, w - r * 0.05, h - r * 0.05, r * 0.006); }, fill: '#2e3634', sh: function (g2) {
      g2.fillStyle = K.lin(g2, -w / 2, -h / 2, w / 2, h / 2, ['rgba(255,255,255,0.08)', 'rgba(0,0,0,0.2)']); g2.fillRect(-w, -h, w * 2, h * 2);
      // 粉笔字（波浪的「雪」样笔画）
      g2.strokeStyle = 'rgba(240,240,232,0.85)'; g2.lineWidth = 1.4 * u;
      for (i = 0; i < 3; i++) { var lx = -w * 0.32 + i * w * 0.24, ly = -h * 0.15; g2.beginPath(); g2.moveTo(lx, ly - h * 0.12); g2.quadraticCurveTo(lx + w * 0.04, ly - h * 0.2, lx + w * 0.08, ly - h * 0.12); g2.quadraticCurveTo(lx + w * 0.12, ly - h * 0.04, lx + w * 0.16, ly - h * 0.12); g2.moveTo(lx + w * 0.02, ly); g2.lineTo(lx + w * 0.14, ly); g2.moveTo(lx + w * 0.08, ly - h * 0.06); g2.lineTo(lx + w * 0.08, ly + h * 0.22); g2.moveTo(lx + w * 0.02, ly + h * 0.12); g2.lineTo(lx + w * 0.15, ly + h * 0.1); g2.stroke(); }
    }, ln: '#141a18', lw: 1 * u });
    g.restore();
    hand(C, g, H, wx, wy, ang, 0.86, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.flask = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.45, y = B.ny + r * 0.62;
    forearm(C, g, B, B.cx + sd * B.sw * 0.95, x, y + r * 0.22, cf._sleeveC, cf._cuffC);
    piece(C, g, { f: function (g2) { rrect(g2, x - r * 0.075, y - r * 0.2, r * 0.15, r * 0.28, r * 0.03); }, fill: '#b0b4bc', sh: function (g2) { g2.fillStyle = K.lin(g2, x - r * 0.08, 0, x + r * 0.08, 0, ['#e8eaf0', '#a0a4ac', '#70747c']); g2.fillRect(x - r * 0.08, y - r * 0.2, r * 0.16, r * 0.3); }, ln: '#3a3c44', lw: 1.1 * u, ow: 1.8 * u });
    rrect(g, x - r * 0.025, y - r * 0.25, r * 0.05, r * 0.05, r * 0.01); fillC(g, '#808490'); strokeW(g, '#3a3c44', 1 * u);
    hand(C, g, H, x, y + r * 0.2, 0, 0.8, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.sake = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * B.sw * 0.5, y = B.ny + r * 0.58, c = o.c || '#ece4d4';
    forearm(C, g, B, B.cx + sd * B.sw * 0.98, x, y + r * 0.28, cf._sleeveC, cf._cuffC);
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(x - r * 0.025, y - r * 0.24); g2.lineTo(x + r * 0.025, y - r * 0.24); g2.bezierCurveTo(x + r * 0.03, y - r * 0.12, x + r * 0.11, y - r * 0.06, x + r * 0.1, y + r * 0.08); g2.quadraticCurveTo(x, y + r * 0.13, x - r * 0.1, y + r * 0.08); g2.bezierCurveTo(x - r * 0.11, y - r * 0.06, x - r * 0.03, y - r * 0.12, x - r * 0.025, y - r * 0.24); g2.closePath(); }, fill: c,
      sh: function (g2) { g2.fillStyle = K.lin(g2, x - r * 0.1, 0, x + r * 0.1, 0, [A('#ffffff', 0.5), A(c, 0), A('#5a4a3a', 0.4)]); g2.fillRect(x - r * 0.12, y - r * 0.3, r * 0.24, r * 0.45); g2.fillStyle = '#3a4a7a'; g2.fillRect(x - r * 0.1, y - r * 0.06, r * 0.2, r * 0.02); }, ln: pal(c).ln, lw: 1.1 * u, ow: 1.8 * u });
    hand(C, g, H, x, y + r * 0.26, 0, 0.82, 'hold', o.glove || cf._gloveC || H.sp.b, sd, hopt(o, cf));
  };
  PROP.briefcase = function (C, g, H, B, o, cf) {
    var r = B.r, u = B.u * C.lw, sd = o.side || 1, x = B.cx + sd * (B.bw - r * 0.12), y = B.bot - r * 0.24, c = o.c || '#3a2618', p = pal(c);
    forearm(C, g, B, B.cx + sd * (B.bw + r * 0.08), x + sd * r * 0.02, y - r * 0.2, cf._sleeveC, cf._cuffC);
    piece(C, g, { f: function (g2) { rrect(g2, x - r * 0.3, y, r * 0.6, r * 0.4, r * 0.03); }, fill: p.b, tex: C.t > 0 ? clothTex(p.b, 'leather') : null, sh: function (g2) { g2.fillStyle = K.lin(g2, 0, y, 0, y + r * 0.2, [A(p.l, 0.4), A(p.b, 0)]); g2.fillRect(x - r * 0.3, y, r * 0.6, r * 0.2); }, ln: p.ln, lw: 1.2 * u, ow: 2 * u });
    g.beginPath(); g.moveTo(x - r * 0.08, y); g.quadraticCurveTo(x, y - r * 0.12, x + r * 0.08, y); strokeW(g, p.ln, r * 0.03); strokeW(g, p.b, r * 0.018);
    hand(C, g, H, x, y + r * 0.01, PI, 0.75, 'hold', o.glove || cf._gloveC || H.sp.b, -sd, hopt(o, cf));
  };

  /* ---- 新的脸部特征 ---- */
  function marksExtra(C, g, H, cf, sp) {
    var r = H.r, cx = H.cx, u = H.u * C.lw, m, s, i, j;
    if ((m = hasMark(cf, 'frostbite')) && !H.chibi) {
      // 两颊冻疤：不规则的紫红斑 + 发白的疤痕纹
      var rb = K.rng('frost' + cf._id);
      g.save(); facePath(H)(g); g.clip();
      for (s = -1; s <= 1; s += 2) {
        var fx = cx + s * H.fw * 0.56, fy = H.eyeY + H.eh * 0.55 + r * 0.06, pts = [];
        for (i = 0; i < 11; i++) { var an = i / 11 * PI * 2, rr = r * (0.06 + rb() * 0.035); pts.push(fx + Math.cos(an) * rr * 1.25, fy + Math.sin(an) * rr * 0.95); }
        smoothPoly(g, pts, true); fillC(g, A(K.mix(sp.b, '#a84a62', 0.5), C.l >= 1 ? 0.55 : 0.65));
        if (C.l >= 1) { g.fillStyle = K.rad(g, fx, fy, 0, r * 0.12, [A('#9a3a54', 0.25), A('#9a3a54', 0)]); g.fillRect(fx - r * 0.13, fy - r * 0.13, r * 0.26, r * 0.26); }
        if (C.m >= 1) for (j = 0; j < 9; j++) { ell(g, fx + (rb() - 0.5) * r * 0.15, fy + (rb() - 0.5) * r * 0.1, r * 0.012, r * 0.007, rb() * 3); fillC(g, A(rb() < 0.5 ? '#f4d8d0' : '#7a2a40', 0.5)); }
        g.strokeStyle = A('#f6e2da', 0.7); g.lineWidth = 1 * u;
        for (j = 0; j < 3; j++) { var sx0 = fx - r * 0.05 + j * r * 0.035; g.beginPath(); g.moveTo(sx0, fy - r * 0.035); g.lineTo(sx0 + s * r * 0.02, fy + r * 0.035); g.stroke(); }
        smoothPoly(g, pts, true); strokeW(g, A(sp.ln, 0.35), 0.9 * u);
      }
      g.restore();
    }
    if ((m = hasMark(cf, 'liver_spots')) && !H.chibi) {
      var rl = K.rng('liver' + cf._id);
      for (i = 0; i < 9; i++) { var lx = cx + (rl() * 2 - 1) * H.fw * 0.8, ly = rl() < 0.5 ? H.T + r * (0.2 + rl() * 0.12) : H.eyeY + r * (0.08 + rl() * 0.12); if (Math.abs(lx - cx) < H.ex * 0.6 && ly > H.eyeY) continue; ell(g, lx, ly, r * (0.008 + rl() * 0.01), r * (0.006 + rl() * 0.008), rl()); fillC(g, A('#8a5a3a', 0.35)); }
    }
    if ((m = hasMark(cf, 'red_nose'))) {
      ell(g, cx + r * 0.004, H.noseY - r * 0.005, r * 0.035, r * 0.028); fillC(g, A('#e05a5a', 0.35));
      for (s = -1; s <= 1; s += 2) { ell(g, cx + s * H.ex * 1.05, H.eyeY + H.eh * 0.7, r * 0.06, r * 0.03); fillC(g, A('#e06060', 0.18)); }
    }
    if ((m = hasMark(cf, 'soot')) && !H.chibi) {
      var rs = K.rng('soot' + cf._id);
      for (i = 0; i < 4; i++) { var sxx = cx + (i % 2 ? 1 : -1) * H.fw * (0.3 + rs() * 0.4), syy = i < 2 ? H.eyeY + r * (0.12 + rs() * 0.06) : H.T + r * (0.22 + rs() * 0.05); g.fillStyle = K.rad(g, sxx, syy, 0, r * 0.05, [A('#2a2420', 0.45), A('#2a2420', 0)]); g.fillRect(sxx - r * 0.06, syy - r * 0.06, r * 0.12, r * 0.12); }
    }
    void j;
  }

  /* ====================== 配置解析 ====================== */
  var NEUTRAL = { sex: 'm', age: 30, height: 170, skin: '#dccabe', hair: { style: 'short', color: '#4a4a56' }, eyes: { shape: 'round', color: '#505064' },
    outfit: { k: 'shirt', c: '#70747e' }, _placeholder: 1 };
  // 从 DM.CHARS[id].visual 推导配置（新角色未写 cast 时的回退）
  var VIS_ACC = {
    glasses: function (o, v) { o.acc.push(v.eyes === 'glasses_round' ? 'glasses_round' : 'glasses_rect'); },
    white_gloves: function (o) { o.acc.push({ k: 'gloves', c: '#fbfbfd' }); }, white_glove_right: function (o) { o.acc.push({ k: 'glove_right', c: '#fbfbfd' }); },
    red_notebook: function (o) { o.hold = { k: 'notebook', c: '#b02838' }; }, doll: function (o) { o.hold = { k: 'doll' }; }, cane: function (o) { o.hold = { k: 'cane' }; }, cards: function (o) { o.hold = { k: 'cards' }; },
    mustache: function (o) { o.marks.push('mustache'); }, stubble: function (o) { o.marks.push('stubble'); }, beard_short: function (o) { o.marks.push('beard_short'); },
    beard_white: function (o) { o.marks.push({ k: 'beard_full', c: '#e8e4dc' }); }, scar_brow: function (o) { o.marks.push('scar_brow'); },
    round_face: function (o) { o.face = 'round'; }, child: function (o) { if (!o.age || o.age > 12) o.age = 10; }
  };
  function fromVisual(id) {
    var info = DM.CHARS && DM.CHARS[id];
    if (!info || !info.visual) return merge(NEUTRAL, {});
    var v = info.visual, o = { acc: [], marks: [] };
    var fem = /dress|skirt|sailor|smock|maid|miko|nurse/.test(v.outfit || '') || /long|twin|bun|hime|bob|ribbon|braid|wavy_long/.test(v.hair || '');
    o.sex = fem ? 'f' : 'm';
    o.skin = v.skin && v.skin !== '#000000' ? v.skin : '#f0d0b8';
    o.hair = { style: HAIR[v.hair] ? v.hair : (fem ? 'long_straight' : 'short'), color: v.hairColor || '#3a3030' };
    o.eyes = { shape: EYE[v.eyes] ? v.eyes : 'round', color: v.eyeColor || '#4a3a30' };
    o.outfit = { k: OUTFIT[v.outfit] ? v.outfit : 'shirt', c: v.outfitColor || '#606870', c2: v.inner || '#e8e8e8' };
    var acc = (v.accessory || '').split(',');
    for (var i = 0; i < acc.length; i++) {
      var a = acc[i].replace(/^\s+|\s+$/g, '');
      if (!a) continue;
      if (VIS_ACC[a]) VIS_ACC[a](o, v);
      else if (ACC[a]) o.acc.push(a);
      else if (a === 'crow_mask') o.mask = 'crow';
    }
    if (v.hair === 'hood') { o.hood = { c: v.outfitColor || '#0a0a10' }; o.hair = { style: 'none' }; }
    return o;
  }
  function resolve(id) {
    var cast = HC.cast || {}, raw = cast[id], chain = [], guard = 0, i;
    if (!raw) raw = fromVisual(id);
    chain.unshift(raw);
    while (chain[0].base && cast[chain[0].base] && guard++ < 8) chain.unshift(cast[chain[0].base]);
    var cf = {};
    for (i = 0; i < chain.length; i++) cf = merge(cf, chain[i]);
    for (i = chain.length - 1; i >= 0; i--) if (chain[i].hasOwnProperty('hold')) { cf.hold = chain[i].hold; break; }
    for (i = chain.length - 1; i >= 0; i--) if (chain[i].hasOwnProperty('mask')) { cf.mask = chain[i].mask; break; }
    var info = (DM.CHARS && DM.CHARS[id]) || {};
    cf._id = id;
    if (!cf.sex) cf.sex = 'f';
    if (cf.age === undefined) cf.age = info.age || 22;
    if (!cf.height) cf.height = info.height || (cf.sex === 'm' ? 172 : 160);
    cf.skin = cf.skin || '#f1d2b8';
    cf.hair = cf.hair || { style: 'short' };
    if (cf.hood && !cf.hair.style) cf.hair.style = 'none';
    cf.eyes = cf.eyes || {};
    cf.outfit = typeof cf.outfit === 'string' ? { k: cf.outfit } : (cf.outfit || { k: 'shirt' });
    if (!cf.outfit.c) cf.outfit.c = '#606870';
    cf._eye = merge(EYE[cf.eyes.shape || 'round'] || EYE.round, cf.eyes);
    var hp = hairPal(cf.hair.color || '#3a3030');
    cf._lashC = cf.eyes.lash || K.mix(hp.ln, '#1e0a12', lum(cf.hair.color || '#333') > 0.5 ? 0.7 : 0.45);
    cf._browC = (cf.brows && cf.brows.color) || (lum(cf.hair.color || '#333') > 0.6 ? K.mix(hp.s, hp.ln, 0.35) : K.mix(hp.b, hp.ln, 0.45));
    cf._fhC = cf.facialHair || cf.hair.color || '#3a3434';
    var hs = resolveHair(cf.hair);
    cf._ears = cf.ears !== undefined ? cf.ears : !hs.none && (hs.side.k === 'none' || hs.side.k === 'sideburn' || (hs.side.k === 'lock' && (hs.side.len || 1) < 0.5)) && hs.back.k !== 'long' && hs.back.k !== 'wavy';
    var a = accList(cf);
    cf._gloveC = null;
    for (i = 0; i < a.length; i++) if (a[i].k === 'gloves' || a[i].k === 'white_gloves') cf._gloveC = a[i].c || '#fbfbfd';
    if (cf.hold && cf.hold.glove) cf._gloveC = cf.hold.glove;
    var oc = OUTFIT[cf.outfit.k] || OUTFIT.shirt;
    cf._sleeveC = cf.outfit.sleeveC || (oc.skinArms ? cf.skin : cf.outfit.c);
    cf._cuffC = cf.outfit.cuffC || null;
    cf._metalTooth = !!hasMark(cf, 'metal_tooth');
    return cf;
  }
  function exprFor(cf, name) {
    var X = merge(EXPR[name] || EXPR.normal, (cf.expr && cf.expr[name]) || {});
    X._name = name;
    if (!X.eye) X.eye = {}; if (!X.brow) X.brow = {};
    return X;
  }
  var JUDGE_GLOW = { normal: 0.55, smile: 0.7, sad: 0.3, angry: 1, surprise: 0.8, think: 0.45, shock: 0.9, dark: 1.1 };
  function linesFor(cf) { return cf.lines !== undefined ? cf.lines : cf.age >= 70 ? 3 : cf.age >= 58 ? 2 : cf.age >= 45 ? 1 : 0; }

  /* ====================== 立绘 ====================== */
  function drawPortrait(C, cf, expr) {
    var g = C.g, kid = cf.age < 13;
    var r = (cf.sex === 'm' ? 334 : 326) * (kid ? 0.97 : 1) * (cf.headScale || 1);
    var T = clamp(118 + (168 - cf.height) * 1.35, 74, 172) + (cf.yOff || 0);
    var H = headGeom(cf, PW / 2 + (cf.xOff || 0), T, r, false);
    H.lines = linesFor(cf); H.skin = cf.skin; H.sp = skinPal(cf.skin);
    var B = bodyGeom(cf, H, PH);
    var X = exprFor(cf, expr);
    var mask = cf.mask ? MASK[cf.mask.k || cf.mask] : null, mo = isObj(cf.mask) ? cf.mask : {};
    if (mask && mo.cover && mo.cover !== mask.cover) mask = { cover: mo.cover, draw: mask.draw };
    if (mask) { X.glow = (cf.glowBy && cf.glowBy[expr] !== undefined) ? cf.glowBy[expr] : (JUDGE_GLOW[expr] === undefined ? 0.6 : JUDGE_GLOW[expr]); }
    if (mask && mask.cover === 'full') { cf._noFace = 1; X = merge(X, { fx: [] }); }
    if (mask && mask.cover === 'upper') { X.eye = merge(X.eye, { hl: 0 }); }
    if (mask && mask.cover === 'lower') X.mouth = 'neutral';
    var hd = buildHair(C, cf, H);
    var hp = hairPal(cf.hair.color, cf.hair.hl2);
    // 1. 后发
    hairLayer(C, H, hp, hd, 'back');
    // 2. 背后配件（兜帽后片、背后蝴蝶结、琴盒）
    if (cf.hood || hasAcc(cf, 'back')) {
      var gk = lbegin(C);
      if (cf.hood) ACC.hood.draw(C, gk, H, B, cf.hood, cf, X, hd);
      drawSlot(C, gk, H, B, cf, X, hd, 'back');
      lend(C);
    }
    // 3. 身体与服装
    var gb = lbegin(C), oc = OUTFIT[cf.outfit.k] || OUTFIT.shirt, of = merge(cf.outfit, {});
    if (oc.back) oc.back(C, gb, H, B, of);
    if (!oc.skinArms) skinBody(C, gb, H, B, H.sp, 0);
    oc.draw(C, gb, H, B, of);
    drawSlot(C, gb, H, B, cf, X, hd, 'neck');
    drawSlot(C, gb, H, B, cf, X, hd, 'body');
    lend(C);
    // 4. 脸
    if (!(mask && mask.cover === 'full' && cf.hood)) drawFaceLayer(C, H, cf, X, hd, H.sp);
    // 5. 前发
    hairLayer(C, H, hp, hd, 'front');
    // 透过刘海的眉毛
    if (!cf._noFace && C.m >= 1 && hd.front.length > 1) {
      var Bp = BROW[cf.brows && cf.brows.shape] || BROW[H.sex === 'm' ? 'straight' : 'normal'];
      if (cf.brows && cf.brows.t) Bp = merge(Bp, { t: (Bp.t || 1) * cf.brows.t });
      for (var s = -1; s <= 1; s += 2) drawBrow(C, g, H, s, Bp, X.brow, cf._browC, lum(cf.hair.color || '#333') > 0.55 ? 0.3 : 0.22);
    }
    // 6. 脸部配件、面具、头饰、手与道具
    var ga = lbegin(C), mOver = mask && (mask.overHood || (MASK[mo.k || cf.mask] || {}).overHood);
    drawSlot(C, ga, H, B, cf, X, hd, 'face');
    if (mask && !mOver) mask.draw(C, ga, H, B, cf, X, mo);
    if (cf.hood) hoodFront(C, ga, H, B, cf.hood);
    if (mask && mOver) mask.draw(C, ga, H, B, cf, X, mo);
    drawSlot(C, ga, H, B, cf, X, hd, 'head');
    if (hd.bows) for (var i = 0; i < hd.bows.length; i++) ACC.ribbon.draw(C, ga, H, B, hd.bows[i], cf, X, hd);
    if (cf.hold && PROP[cf.hold.k]) PROP[cf.hold.k](C, ga, H, B, cf.hold, cf);
    else if (X.hand === 'chin' && cf.pose && cf.pose.think === 'chin') thinkHand(C, ga, H, B, cf);
    if ((X.fx || []).indexOf('sweat') >= 0 && !cf._noFace) sweat(C, ga, H);
    lend(C);
  }

  /* ====================== 小人（Q 版全身） ====================== */
  var LEGS = {};
  HC.parts.legs = LEGS;
  function legShape(C, g, S, c, x0, x1, y0, y1, w0, w1) {
    var p = pal(c), u = S.u * C.lw;
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(x0 - w0, y0); g2.lineTo(x0 + w0, y0); g2.lineTo(x1 + w1, y1); g2.lineTo(x1 - w1, y1); g2.closePath(); }, fill: p.b,
      sh: function (g2) { g2.fillStyle = A(p.s, 0.6); g2.fillRect(Math.max(x0, x1), y0, w0 * 2, y1 - y0); }, ln: p.ln, lw: 1 * u, ow: 1.6 * u });
  }
  function shoe(C, g, S, x, y, c, sd) {
    var p = pal(c), u = S.u * C.lw, w = S.r * 0.15, h = S.r * 0.09;
    piece(C, g, { f: function (g2) { g2.beginPath(); g2.moveTo(x - w * 0.55 * sd, y - h); g2.quadraticCurveTo(x + w * 0.9 * sd, y - h * 1.1, x + w * 0.85 * sd, y); g2.lineTo(x - w * 0.6 * sd, y); g2.closePath(); }, fill: p.b,
      sh: function (g2) { if (C.l >= 1) { g2.fillStyle = A('#ffffff', 0.25); g2.fillRect(x - w * 0.3, y - h, w * 0.5, h * 0.3); } }, ln: p.ln, lw: 1 * u, ow: 1.6 * u });
  }
  function drawSprite(C, cf) {
    var g = C.g, kid = cf.age < 13, k = clamp(cf.height / 170, 0.74, 1.1), feet = 250;
    var r = 64 * Math.sqrt(k) * (kid ? 1.04 : 1) * (cf.headScale || 1);
    var L = 150 * k * (kid ? 0.86 : 1);
    var Cy = feet - L, T = Cy - r;
    var H = headGeom(cf, SW / 2, T, r, true);
    H.lines = Math.min(1, linesFor(cf)); H.skin = cf.skin; H.sp = skinPal(cf.skin);
    var X = exprFor(cf, 'normal'), u = H.u * C.lw, cx = SW / 2;
    var mask = cf.mask ? MASK[cf.mask.k || cf.mask] : null;
    if (mask && isObj(cf.mask) && cf.mask.cover) mask = { cover: cf.mask.cover, draw: mask.draw };
    if (mask) X.glow = 0.7;
    if (mask && mask.cover === 'full') cf._noFace = 1;
    var oc = OUTFIT[cf.outfit.k] || OUTFIT.shirt, sp0 = merge(oc.sprite || {}, cf.sprite || {});
    var o = cf.outfit, sp = H.sp;
    var bw = r * (cf.sex === 'm' ? 0.44 : 0.38) * (1 + (cf.build || 0) * 0.15) * (kid ? 0.9 : 1);
    var neckY = H.C - r * 0.04, shY = H.C + r * 0.1, hipY = H.C + L * (kid ? 0.45 : 0.44), ankY = feet - r * 0.08;
    var S = { r: r, u: H.u, cx: cx, ny: neckY, nw: r * 0.1, shY: shY, sw: bw, bw: bw * 1.05, aw: r * 0.16, bot: hipY, H: H };
    // 接触阴影
    if (C.l >= 1) K.contact(g, cx, feet, r * 0.6, r * 0.12, 0.35);
    var hd = buildHair(C, cf, H), hp = hairPal(cf.hair.color, cf.hair.hl2);
    hairLayer(C, H, hp, hd, 'back');
    var gb = lbegin(C), legs = sp0.legs || 'pants', legC = sp0.legC || K.mix(o.c, '#202028', 0.45), shoeC = sp0.shoe || '#2a2224', sock = sp0.sock;
    if (cf.hood) ACC.hood.draw(C, gb, H, S, cf.hood, cf, X, hd);
    if (hasAcc(cf, 'back')) { var a0 = accList(cf); for (var ai = 0; ai < a0.length; ai++) if (a0[ai].k === 'violin_case') { gb.save(); gb.translate(cx, shY); gb.scale(0.55, 0.55); gb.translate(-cx, -shY); ACC.violin_case.draw(C, gb, H, { r: r, u: H.u, cx: cx, sw: bw * 1.7, shY: shY, ny: neckY, nw: S.nw, bot: hipY }, a0[ai]); gb.restore(); } }
    // 腿
    var lw = r * (kid ? 0.12 : 0.13), gap = r * 0.12, robeC = o.c;
    if (legs === 'robe' || legs === 'hakama' || legs === 'long_skirt') {
      var rc = legs === 'hakama' ? legC : legs === 'long_skirt' ? legC : robeC, rp = pal(rc), hem = legs === 'long_skirt' ? ankY - r * 0.25 : ankY + r * 0.02;
      if (legs === 'long_skirt') { legShape(C, gb, S, sock || sp.b, cx - gap, cx - gap, hem - r * 0.05, ankY, lw * 0.75, lw * 0.6); legShape(C, gb, S, sock || sp.b, cx + gap, cx + gap, hem - r * 0.05, ankY, lw * 0.75, lw * 0.6); }
      piece(C, gb, { f: function (g2) { g2.beginPath(); g2.moveTo(cx - bw * 0.9, hipY - r * 0.1); g2.lineTo(cx + bw * 0.9, hipY - r * 0.1); g2.lineTo(cx + bw * 1.3, hem); g2.quadraticCurveTo(cx, hem + r * 0.06, cx - bw * 1.3, hem); g2.closePath(); }, fill: rp.b,
        sh: function (g2) { g2.fillStyle = A(rp.s, 0.6); g2.fillRect(cx + bw * 0.2, hipY - r * 0.2, bw * 2, L); if (C.m >= 1) { for (var i = -2; i <= 2; i++) fold(g2, cx + i * bw * 0.35, hipY + r * 0.1, cx + i * bw * 0.5, hem, r * 0.02, r * 0.02, A(rp.s, 0.7)); } }, ln: rp.ln, lw: 1 * u, ow: 1.6 * u });
    } else if (legs === 'skirt' || legs === 'dress') {
      var skC = legs === 'dress' ? robeC : legC, skp = pal(skC), skHem = hipY + (ankY - hipY) * (kid ? 0.42 : 0.4);
      for (var s1 = -1; s1 <= 1; s1 += 2) legShape(C, gb, S, sock || sp.b, cx + s1 * gap * 0.9, cx + s1 * gap * 0.85, skHem - r * 0.1, ankY, lw * 0.8, lw * 0.62);
      if (sock && C.m >= 1) for (var s4 = -1; s4 <= 1; s4 += 2) { gb.fillStyle = sp.b; gb.fillRect(cx + s4 * gap * 0.88 - lw * 0.7, skHem - r * 0.02, lw * 1.4, (ankY - skHem) * 0.35); }
      piece(C, gb, { f: function (g2) { g2.beginPath(); g2.moveTo(cx - bw * 0.85, hipY - r * 0.12); g2.lineTo(cx + bw * 0.85, hipY - r * 0.12); g2.lineTo(cx + bw * 1.35, skHem); g2.quadraticCurveTo(cx, skHem + r * 0.08, cx - bw * 1.35, skHem); g2.closePath(); }, fill: skp.b,
        sh: function (g2) { g2.fillStyle = A(skp.s, 0.6); g2.fillRect(cx + bw * 0.25, hipY - r * 0.2, bw * 2, L); if (C.m >= 1) for (var i = -2; i <= 2; i++) fold(g2, cx + i * bw * 0.3, hipY, cx + i * bw * 0.5, skHem, r * 0.01, r * 0.015, A(skp.s, 0.7)); }, ln: skp.ln, lw: 1 * u, ow: 1.6 * u });
    } else if (legs === 'shorts') {
      for (var s2 = -1; s2 <= 1; s2 += 2) legShape(C, gb, S, sp.b, cx + s2 * gap, cx + s2 * gap * 0.9, hipY, ankY, lw * 0.85, lw * 0.65);
      if (sock) for (var s5 = -1; s5 <= 1; s5 += 2) legShape(C, gb, S, sock, cx + s5 * gap * 0.92, cx + s5 * gap * 0.9, ankY - r * 0.22, ankY, lw * 0.72, lw * 0.66);
      for (var s3 = -1; s3 <= 1; s3 += 2) legShape(C, gb, S, legC, cx + s3 * gap * 0.75, cx + s3 * gap * 1.1, hipY - r * 0.1, hipY + r * 0.32, lw * 1.2, lw * 1.05);
    } else {
      for (var s6 = -1; s6 <= 1; s6 += 2) legShape(C, gb, S, legC, cx + s6 * gap * 0.85, cx + s6 * gap, hipY - r * 0.1, ankY, lw * 1.05, lw * 0.85);
    }
    if (legs !== 'robe' && legs !== 'hakama') { shoe(C, gb, S, cx - gap, ankY + r * 0.09, shoeC, -1); shoe(C, gb, S, cx + gap, ankY + r * 0.09, shoeC, 1); }
    // 外套下摆
    var tc = o.c, tp = pal(tc), coat = sp0.coat || 0, hemY = hipY + (ankY - hipY) * coat * 0.75;
    var torso = function (g2) {
      g2.beginPath(); g2.moveTo(cx - S.nw * 1.3, neckY);
      g2.quadraticCurveTo(cx - bw * 0.9, shY - r * 0.04, cx - bw, shY + r * 0.08);
      g2.lineTo(cx - bw * (coat ? 1.05 + coat * 0.2 : 0.9), coat ? hemY : hipY);
      g2.quadraticCurveTo(cx, (coat ? hemY : hipY) + r * 0.05, cx + bw * (coat ? 1.05 + coat * 0.2 : 0.9), coat ? hemY : hipY);
      g2.lineTo(cx + bw, shY + r * 0.08); g2.quadraticCurveTo(cx + bw * 0.9, shY - r * 0.04, cx + S.nw * 1.3, neckY); g2.closePath();
    };
    var skinArms = oc.skinArms;
    // 手臂
    var armC = cf._sleeveC, ap = pal(armC);
    for (var sa = -1; sa <= 1; sa += 2) {
      (function (sa) {
        piece(C, gb, { f: function (g2) { g2.beginPath(); g2.moveTo(cx + sa * bw * 0.75, shY + r * 0.02); g2.quadraticCurveTo(cx + sa * bw * 1.25, shY + r * 0.05, cx + sa * bw * 1.22, shY + r * 0.25); g2.lineTo(cx + sa * bw * 1.28, hipY + r * 0.02); g2.lineTo(cx + sa * bw * 0.98, hipY + r * 0.02); g2.lineTo(cx + sa * bw * 0.85, shY + r * 0.3); g2.closePath(); },
          fill: ap.b, sh: function (g2) { if (sa > 0) { g2.fillStyle = A(ap.s, 0.6); g2.fillRect(cx, shY - r * 0.1, bw * 2, L); } }, ln: ap.ln, lw: 1 * u, ow: 1.6 * u });
      })(sa);
    }
    var tex = C.t > 0 ? clothTex(tp.b, 'cotton') : null;
    piece(C, gb, { f: torso, fill: tp.b, tex: tex, sh: function (g2) {
      g2.fillStyle = A(tp.s, 0.6); g2.fillRect(cx + bw * 0.3, shY - r * 0.2, bw * 2, L);
      if (C.l >= 1) { g2.fillStyle = K.lin(g2, 0, shY, 0, hipY, [A(tp.l, 0.15), A(tp.d, 0.25)]); g2.fillRect(cx - bw * 2, neckY, bw * 4, L); }
      var fr = sp0.front || (/coat|suit|labcoat|trench|jacket|tailcoat|butler|blazer|cardigan|police|haori|hanten|work|fisher|white_suit|vest|duffle|quilted|hunting|gakuran/.test(cf.outfit.k) ? 'v' : /sailor/.test(cf.outfit.k) ? 'sailor' : /kimono|miko|dotera|tanzen|cape/.test(cf.outfit.k) ? 'cross' : /robe/.test(cf.outfit.k) ? 'robe' : 'none');
      var inC = o.c2 || '#e8e8e8';
      if (fr === 'v') { g2.beginPath(); g2.moveTo(cx - S.nw * 1.4, neckY); g2.lineTo(cx, shY + r * 0.38); g2.lineTo(cx + S.nw * 1.4, neckY); g2.closePath(); fillC(g2, /sailor/.test(cf.outfit.k) ? '#f0f0f4' : inC);
        if (/suit|coat|police|vest|blazer/.test(cf.outfit.k) && cf.outfit.k !== 'white_suit') { g2.beginPath(); g2.moveTo(cx - r * 0.025, neckY + r * 0.02); g2.lineTo(cx + r * 0.025, neckY + r * 0.02); g2.lineTo(cx + r * 0.03, shY + r * 0.3); g2.lineTo(cx, shY + r * 0.36); g2.lineTo(cx - r * 0.03, shY + r * 0.3); g2.closePath(); fillC(g2, o.c3 || (/blazer/.test(cf.outfit.k) ? '#b02840' : '#4a2a30')); }
        g2.beginPath(); g2.moveTo(cx, shY + r * 0.38); g2.lineTo(cx, hipY + r); strokeW(g2, A(tp.ln, 0.6), 1 * u); }
      if (fr === 'sailor') { g2.beginPath(); g2.moveTo(cx - bw * 0.95, shY + r * 0.02); g2.lineTo(cx, shY + r * 0.32); g2.lineTo(cx + bw * 0.95, shY + r * 0.02); g2.lineTo(cx + S.nw * 1.4, neckY); g2.lineTo(cx - S.nw * 1.4, neckY); g2.closePath(); fillC(g2, o.collarC || '#28304e');
        g2.beginPath(); g2.moveTo(cx - r * 0.06, shY + r * 0.26); g2.lineTo(cx + r * 0.06, shY + r * 0.26); g2.lineTo(cx, shY + r * 0.4); g2.closePath(); fillC(g2, o.c2 || '#8a2a3a'); }
      if (fr === 'cross') { g2.beginPath(); g2.moveTo(cx + S.nw * 1.3, neckY); g2.lineTo(cx - bw * 0.5, hipY); strokeW(g2, o.c2 || '#f0ece4', r * 0.05); g2.beginPath(); g2.moveTo(cx - S.nw * 1.3, neckY); g2.lineTo(cx, shY + r * 0.25); strokeW(g2, o.c2 || '#f0ece4', r * 0.05); if (o.c3 || legs === 'hakama') { g2.fillStyle = o.c3 || legC; g2.fillRect(cx - bw, hipY - r * 0.16, bw * 2, r * 0.12); } }
      if (fr === 'robe') { g2.beginPath(); g2.moveTo(cx - r * 0.03, shY); g2.lineTo(cx - r * 0.08, hipY + r); g2.lineTo(cx + r * 0.08, hipY + r); g2.lineTo(cx + r * 0.03, shY); g2.closePath(); fillC(g2, o.c2 || '#300010'); }
      if (fr === 'apron' || /maid/.test(cf.outfit.k)) { g2.beginPath(); g2.moveTo(cx - bw * 0.5, shY + r * 0.15); g2.lineTo(cx + bw * 0.5, shY + r * 0.15); g2.lineTo(cx + bw * 0.7, hipY + r); g2.lineTo(cx - bw * 0.7, hipY + r); g2.closePath(); fillC(g2, o.c2 || '#f8f8f8'); }
      if (/chef/.test(cf.outfit.k)) { g2.fillStyle = o.c2 || '#c84030'; g2.beginPath(); g2.moveTo(cx - S.nw * 1.4, neckY); g2.lineTo(cx + S.nw * 1.4, neckY); g2.lineTo(cx, neckY + r * 0.15); g2.closePath(); g2.fill(); }
      if (/parka/.test(cf.outfit.k)) { g2.beginPath(); g2.moveTo(cx, neckY); g2.lineTo(cx, hipY + r); strokeW(g2, tp.ln, 1.2 * u); }
    }, ln: tp.ln, lw: 1 * u, ow: 1.6 * u });
    // 手
    var hc = cf._gloveC || (skinArms ? sp.b : sp.b), hpal = cf._gloveC ? pal(hc) : { b: sp.b, ln: sp.ln, s: sp.s };
    for (var sh2 = -1; sh2 <= 1; sh2 += 2) { circ(gb, cx + sh2 * bw * 1.13, hipY + r * 0.07, r * 0.085); fillC(gb, hpal.b); strokeW(gb, hpal.ln, 1 * u); }
    // 颈部配件简化
    var acs = accList(cf);
    for (var q = 0; q < acs.length; q++) {
      var ak = acs[q].k;
      if (ak === 'scarf') { var scp = pal(acs[q].c || '#a8a090'); rrect(gb, cx - S.nw * 2.2, neckY - r * 0.04, S.nw * 4.4, r * 0.12, r * 0.05); fillC(gb, scp.b); strokeW(gb, scp.ln, 1 * u); gb.fillStyle = scp.b; gb.fillRect(cx + S.nw * 0.6, neckY, r * 0.1, r * 0.55); gb.strokeStyle = scp.ln; gb.strokeRect(cx + S.nw * 0.6, neckY, r * 0.1, r * 0.55); }
      if (ak === 'towel' || ak === 'towel_neck') { gb.fillStyle = '#f4f2ec'; gb.fillRect(cx - S.nw * 2, neckY - r * 0.02, S.nw * 1.1, r * 0.4); gb.fillRect(cx + S.nw * 0.9, neckY - r * 0.02, S.nw * 1.1, r * 0.4); }
      if (ak === 'camera') { rrect(gb, cx - r * 0.12, shY + r * 0.25, r * 0.24, r * 0.14, r * 0.03); fillC(gb, '#2a2a30'); circ(gb, cx, shY + r * 0.32, r * 0.05); fillC(gb, '#101014'); }
      if (ak === 'violin_strap') { gb.beginPath(); gb.moveTo(cx - bw * 0.8, shY); gb.lineTo(cx + bw * 0.8, hipY); strokeW(gb, '#3a2a30', r * 0.05); }
    }
    lend(C);
    // 头
    if (!(mask && mask.cover === 'full' && cf.hood)) drawFaceLayer(C, H, cf, X, hd, sp);
    hairLayer(C, H, hp, hd, 'front');
    var ga = lbegin(C);
    var mOv = mask && (MASK[(isObj(cf.mask) && cf.mask.k) || cf.mask] || {}).overHood;
    if (mask && !mOv) mask.draw(C, ga, H, S, cf, X, isObj(cf.mask) ? cf.mask : {});
    if (cf.hood) hoodFront(C, ga, H, S, cf.hood);
    if (mask && mOv) mask.draw(C, ga, H, S, cf, X, isObj(cf.mask) ? cf.mask : {});
    drawSlot(C, ga, H, S, cf, X, hd, 'head');
    var fa = accList(cf);
    for (var f2 = 0; f2 < fa.length; f2++) if (/glasses|monocle/.test(fa[f2].k) && ACC[fa[f2].k]) ACC[fa[f2].k].draw(C, ga, H, S, fa[f2], cf, X, hd);
    if (hd.bows) for (var b2 = 0; b2 < hd.bows.length; b2++) ACC.ribbon.draw(C, ga, H, S, hd.bows[b2], cf, X, hd);
    // 小道具
    var hk = cf.hold && cf.hold.k;
    if (hk === 'cane') { var kx = cx + bw * 1.35; ga.beginPath(); ga.moveTo(kx, hipY + r * 0.05); ga.lineTo(kx + r * 0.04, feet - 2); strokeW(ga, '#1a1010', r * 0.06); strokeW(ga, '#4a3020', r * 0.035); }
    if (hk === 'doll') { circ(ga, cx, shY + r * 0.42, r * 0.11); fillC(ga, '#fbeee6'); strokeW(ga, '#8a5048', 1 * u); ga.beginPath(); ga.arc(cx, shY + r * 0.4, r * 0.12, PI, 0); fillC(ga, '#141018'); rrect(ga, cx - r * 0.1, shY + r * 0.5, r * 0.2, r * 0.2, r * 0.04); fillC(ga, '#b02838'); }
    if (hk === 'notebook') { ga.save(); ga.translate(cx + bw * 1.1, hipY - r * 0.05); ga.rotate(-0.2); rrect(ga, -r * 0.08, -r * 0.12, r * 0.16, r * 0.22, r * 0.02); fillC(ga, cf.hold.c || '#b02838'); strokeW(ga, '#4a1018', 1 * u); ga.restore(); }
    if (hk === 'cards') { for (var cc = 0; cc < 3; cc++) { ga.save(); ga.translate(cx + bw * 1.15, hipY - r * 0.02); ga.rotate(-0.4 + cc * 0.3); rrect(ga, -r * 0.05, -r * 0.16, r * 0.1, r * 0.14, r * 0.01); fillC(ga, '#fbfaf6'); strokeW(ga, '#5a5a70', 0.8 * u); ga.restore(); } }
    lend(C);
  }

  /* ====================== 导出 ====================== */
  function run(g, W, Hh, q, lw, fn) {
    var C = mkC(g, W, Hh, q, lw);
    g.save();
    try { fn(C); }
    catch (e) {
      if (root.console && console.warn) console.warn('[HDChar] 绘制失败，改用占位', e);
      for (var i = 0; i < 64; i++) g.restore();
      g.save();
      try { var C2 = mkC(g, W, Hh, q, lw); fn(C2, true); C2.L = null; } catch (e2) { /* 放弃 */ }
    }
    g.restore();
    K.noShadow(g);
    C.L = null; C.Lg = null;
  }
  HC.resolve = resolve;
  HC.gen = {
    portrait: function (g, id, expr, q) {
      run(g, PW, PH, q, 1, function (C, fallback) { var cf = fallback ? resolveNeutral(id) : resolve(id); drawPortrait(C, cf, fallback ? 'normal' : (EXPR[expr] ? expr : 'normal')); });
    },
    sprite: function (g, id, q) {
      run(g, SW, SH, q, 1.55, function (C, fallback) { C.t = 0; drawSprite(C, fallback ? resolveNeutral(id) : resolve(id)); });
    }
  };
  function resolveNeutral(id) { var save = HC.cast[id]; HC.cast['__neutral'] = NEUTRAL; var cf = resolve('__neutral'); delete HC.cast['__neutral']; void save; cf._id = id; return cf; }
})(typeof window !== 'undefined' ? window : globalThis);
