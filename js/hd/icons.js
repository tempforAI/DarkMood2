/* DARK MOOD HD 证据图标（128x128 设计坐标，透明背景）
 * 风格：半写实的手绘物件图标；统一左上方主光；深色外轮廓保证 32px 下仍能辨认；轻微投影。
 * q.model 控制细节数量，q.light 控制投影 / 高光，q.tex(<=1) 控制纸 / 木 / 布纹理。
 * 只用 ES5 + Canvas 2D 基础 API。
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var K = DM.HK;
  if (!K || !DM.HDIcon) return;
  var PI = Math.PI, TAU = PI * 2;

  /* ---------------- 共用 ---------------- */
  var OUT = 'rgba(20,12,10,0.92)';
  function def(id, fn) { DM.HDIcon.def(id, fn); }
  function lin(g, x0, y0, x1, y1, st) { return K.lin(g, x0, y0, x1, y1, st); }
  function rad(g, x, y, r0, r1, st, fx, fy) { return K.rad(g, x, y, r0, r1, st, fx, fy); }
  function P(g, d, ox, oy, s, noBegin) { K.path(g, d, ox || 0, oy || 0, s || 1, s || 1, noBegin); }
  function ol(g, w) { g.strokeStyle = OUT; g.lineWidth = w || 3; g.lineJoin = 'round'; g.stroke(); }
  // 投影：pathFn 建立轮廓路径；light>0 用柔和 shadowBlur，否则用偏移的半透明副本
  function drop(g, q, pathFn, blur) {
    g.save();
    if (q.light > 0) {
      // 浅色描边光晕：让深色物件在深色界面上也能分辨轮廓
      K.shadow(g, q, 5, 'rgba(255,236,210,0.32)', 0, 0); pathFn(); g.fillStyle = '#000'; g.fill();
      K.shadow(g, q, blur || 7, 'rgba(0,0,0,0.5)', 2.5, 4); pathFn(); g.fill();
    } else { g.translate(3, 4); pathFn(); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fill(); }
    g.restore();
  }
  function hl(g, q, x, y, rx, ry, rot, a) { if (q.light <= 0) return; g.fillStyle = 'rgba(255,255,255,' + (a || 0.55) + ')'; K.ellipse(g, x, y, rx, ry, rot || 0); g.fill(); }
  function line(g, x0, y0, x1, y1, w, c) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w; g.strokeStyle = c; g.stroke(); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  var STEEL = [[0, '#ffffff'], [0.22, '#c8ced8'], [0.48, '#788090'], [0.66, '#b4bac6'], [1, '#383c46']];
  var GOLD = [[0, '#fff6c8'], [0.28, '#eac46c'], [0.55, '#a8782c'], [0.74, '#dcae54'], [1, '#583810']];
  var IRON = [[0, '#9a9ea8'], [0.3, '#5a5e68'], [0.6, '#2e3038'], [1, '#121418']];
  var WOOD = [[0, '#c8925e'], [0.45, '#8a5a32'], [1, '#4a2a12']];
  function wood(g, q, x0, y0, x1, y1, dir) {
    g.fillStyle = lin(g, x0, y0, x1, y1, WOOD); g.fill();
    if (q.tex > 0) { g.save(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'wood', { c1: '#9a8070', c2: '#ffffff', planks: 1, dir: dir || 'h', seed: 5, gap: '#ffffff', ring: 3 }, 64, 0, 0, 0.6); g.restore(); }
  }
  function paper(g, q, x0, y0, x1, y1, c1, c2) {
    g.fillStyle = lin(g, x0, y0, x1, y1, [c1 || '#fffaf0', c2 || '#dccfb0']); g.fill();
    if (q.tex > 0) { g.save(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'paper', { c1: '#d8d0c0', c2: '#ffffff', seed: 19 }, 64, 0, 0, 0.7); g.restore(); }
  }
  function cloth(g, q, c1, c2, x0, y0, x1, y1) {
    g.fillStyle = lin(g, x0, y0, x1, y1, [c1, c2]); g.fill();
    if (q.tex > 0) { g.save(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'fabric', { c1: '#b0b0b0', c2: '#ffffff', threads: 40, seed: 3 }, 48, 0, 0, 0.5); g.restore(); }
  }
  function crow(g, x, y, s) { // 小乌鸦剪影（展翅）
    g.save(); g.translate(x, y); g.scale(s, s);
    P(g, 'M0 -10 C3 -10 4 -8 4 -6 L9 -7 L5 -4 C14 -9 22 -10 28 -8 C22 -4 18 0 16 4 C10 4 6 6 4 8 L5 13 L0 10 L-5 13 L-4 8 C-6 6 -10 4 -16 4 C-18 0 -22 -4 -28 -8 C-22 -10 -14 -9 -5 -4 C-5 -8 -3 -10 0 -10 Z');
    g.restore();
  }

  /* =================================================================
   * 第一部
   * ================================================================= */
  def('knife', function (g, q) {
    g.save(); g.translate(64, 66); g.rotate(-PI / 4);
    function blade() { P(g, 'M-14 -9 L50 -9 C58 -9 64 -7 70 -2 C60 4 40 9 -14 9 Z'); }
    function handle() { K.rr(g, -64, -9, 46, 18, 7); }
    drop(g, q, function () { blade(); g.rect(-64, -9, 52, 18); });
    blade(); g.fillStyle = lin(g, 0, -9, 0, 9, STEEL); g.fill(); ol(g, 2.6);
    // 刃口的研磨面
    g.save(); blade(); g.clip();
    g.fillStyle = lin(g, 0, 2, 0, 9, ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.75)']); g.fillRect(-14, 2, 90, 8);
    if (q.model > 0) { g.fillStyle = 'rgba(160,20,30,0.55)'; K.ellipse(g, 52, 0, 10, 6, 0.1); g.fill(); g.fillStyle = 'rgba(120,10,20,0.6)'; K.ellipse(g, 44, 3, 4, 2); g.fill(); }
    g.restore();
    if (q.light > 0) line(g, -10, -6.5, 54, -6.5, 1.6, 'rgba(255,255,255,0.8)');
    // 护手
    g.fillStyle = lin(g, 0, -10, 0, 10, STEEL); g.fillRect(-18, -10, 6, 20); g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(-18, -10, 6, 20);
    handle(); wood(g, q, -64, -9, -64, 9, 'h'); handle(); g.fillStyle = lin(g, 0, -9, 0, 9, ['rgba(60,30,10,0.0)', 'rgba(40,18,6,0.5)']); g.fill(); ol(g, 2.6);
    for (var i = 0; i < 3; i++) { circ(g, -54 + i * 14, 0, 2.6); g.fillStyle = lin(g, 0, -3, 0, 3, STEEL); g.fill(); }
    hl(g, q, -42, -5, 14, 1.6, 0, 0.35);
    g.restore();
  });

  def('key', function (g, q) {
    g.save(); g.translate(64, 64); g.rotate(-PI / 4);
    function shape() {
      g.beginPath(); g.arc(-38, 0, 20, 0, TAU); g.moveTo(-18, -5); g.lineTo(40, -5); g.lineTo(40, 5); g.lineTo(-18, 5);
      g.rect(24, 5, 8, 16); g.rect(34, 5, 8, 22); g.rect(14, 5, 6, 10);
    }
    drop(g, q, shape);
    // 匙柄（带镂空花纹）
    g.beginPath(); g.arc(-38, 0, 20, 0, TAU); g.arc(-38, 0, 11, 0, TAU, true);
    g.fillStyle = lin(g, -58, -20, -18, 20, GOLD); g.fill(); ol(g, 2.4);
    if (q.model > 0) { g.beginPath(); for (var p = 0; p < 4; p++) { var a = p * PI / 2 + PI / 4; g.moveTo(-38 + Math.cos(a) * 11, Math.sin(a) * 11); g.lineTo(-38 + Math.cos(a) * 4, Math.sin(a) * 4); } g.strokeStyle = lin(g, -50, -10, -26, 10, GOLD); g.lineWidth = 4; g.stroke(); circ(g, -38, 0, 4); g.fillStyle = '#c89a40'; g.fill(); }
    // 匙杆 + 匙齿
    g.beginPath(); g.rect(-19, -5, 61, 10); g.fillStyle = lin(g, 0, -5, 0, 5, GOLD); g.fill(); ol(g, 2.2);
    g.beginPath(); g.rect(24, 5, 8, 16); g.rect(34, 5, 8, 22); g.rect(14, 5, 6, 10); g.fillStyle = lin(g, 14, 5, 42, 27, GOLD); g.fill(); ol(g, 2.2);
    g.fillStyle = lin(g, 0, -9, 0, 9, GOLD); g.fillRect(-22, -8, 6, 16); g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(-22, -8, 6, 16);
    if (q.light > 0) { line(g, -14, -2.5, 38, -2.5, 1.5, 'rgba(255,255,230,0.85)'); g.beginPath(); g.arc(-38, 0, 16, PI * 1.1, PI * 1.55); g.strokeStyle = 'rgba(255,255,230,0.8)'; g.lineWidth = 2; g.stroke(); }
    g.restore();
  });

  def('note', function (g, q) {
    g.save(); g.translate(64, 64); g.rotate(-0.08);
    function shape() { P(g, 'M-38 -46 L32 -48 L40 -40 L38 44 L18 40 L4 46 L-10 41 L-24 47 L-40 44 Z'); }
    drop(g, q, shape);
    shape(); paper(g, q, -40, -48, 40, 46); ol(g, 2.4);
    // 折角
    P(g, 'M32 -48 L40 -40 L31 -39 Z'); g.fillStyle = '#c8b890'; g.fill(); ol(g, 1.6);
    // 手写字迹
    g.strokeStyle = 'rgba(30,24,60,0.8)'; g.lineWidth = 2.2;
    var rows = q.model > 0 ? 7 : 4;
    for (var i = 0; i < rows; i++) {
      var y = -32 + i * 10, len = i === rows - 1 ? 30 : 58 - (i * 7) % 16;
      g.beginPath(); g.moveTo(-28, y);
      for (var x = 0; x < len; x += 6) g.quadraticCurveTo(-28 + x + 2, y - 3 + (x * 7 % 5), -28 + x + 5, y + (x % 3) - 1);
      g.stroke();
    }
    // 折痕
    if (q.model > 0) { line(g, -40, 2, 38, 0, 1, 'rgba(120,100,70,0.35)'); line(g, -40, 3, 38, 1, 1, 'rgba(255,255,255,0.6)'); }
    g.restore();
  });

  def('letter', function (g, q) {
    g.save(); g.translate(64, 66); g.rotate(-0.06);
    function shape() { K.rr(g, -50, -32, 100, 66, 4); }
    drop(g, q, shape);
    shape(); paper(g, q, -50, -32, 50, 34, '#f8f0dc', '#d8c8a4'); ol(g, 2.4);
    // 信封的折边
    g.strokeStyle = 'rgba(120,96,60,0.55)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-48, 32); g.lineTo(-6, 2); g.moveTo(48, 32); g.lineTo(6, 2); g.stroke();
    P(g, 'M-50 -30 L0 8 L50 -30 Z'); g.fillStyle = lin(g, 0, -30, 0, 8, ['#efe4c8', '#d4c49c']); g.fill(); g.strokeStyle = 'rgba(90,70,40,0.7)'; g.lineWidth = 2; g.stroke();
    // 火漆封印（乌鸦纹）
    P(g, 'M0 -10 C10 -12 16 -4 15 4 C17 12 8 18 0 17 C-9 18 -16 11 -15 3 C-16 -5 -9 -12 0 -10 Z');
    g.fillStyle = rad(g, -4, 0, 1, 18, ['#e04a50', '#a01828', '#5a0810']); g.fill(); ol(g, 2);
    g.fillStyle = 'rgba(70,0,10,0.85)'; crow(g, 0, 3, 0.36); g.fill();
    hl(g, q, -6, -4, 4, 2.2, -0.5, 0.6);
    g.restore();
  });

  def('rope', function (g, q) {
    var cx = 62, cy = 60;
    drop(g, q, function () { K.ellipse(g, cx, cy, 46, 38); });
    // 绳圈：多圈叠绕
    var loops = q.model > 0 ? 4 : 3;
    for (var L = loops - 1; L >= 0; L--) {
      var rx = 40 - L * 5, ry = 32 - L * 4, oy = L * 3;
      K.ellipse(g, cx, cy + oy, rx, ry); g.strokeStyle = OUT; g.lineWidth = 12; g.stroke();
      K.ellipse(g, cx, cy + oy, rx, ry); g.strokeStyle = lin(g, cx - rx, cy - ry, cx + rx, cy + ry, ['#e8d098', '#b08a50', '#6a4a20']); g.lineWidth = 8; g.stroke();
      // 麻绳的捻纹
      if (q.model > 0) {
        g.strokeStyle = 'rgba(70,46,16,0.65)'; g.lineWidth = 1.5;
        for (var t = 0; t < 36; t++) { var a = t / 36 * TAU, x = cx + Math.cos(a) * rx, y = cy + oy + Math.sin(a) * ry; g.beginPath(); g.moveTo(x - 2.5, y - 3); g.lineTo(x + 2.5, y + 3); g.stroke(); }
      }
    }
    // 垂下的绳头
    g.beginPath(); g.moveTo(cx + 28, cy + 22); g.bezierCurveTo(cx + 42, cy + 36, cx + 50, cy + 44, cx + 56, cy + 58); g.strokeStyle = OUT; g.lineWidth = 12; g.stroke();
    g.strokeStyle = lin(g, cx + 28, cy + 22, cx + 56, cy + 58, ['#e0c890', '#8a6a36']); g.lineWidth = 8; g.stroke();
    g.strokeStyle = 'rgba(230,210,160,0.8)'; g.lineWidth = 1.5; for (var f = -3; f <= 3; f += 2) { g.beginPath(); g.moveTo(cx + 56, cy + 58); g.lineTo(cx + 58 + f, cy + 66); g.stroke(); }
    if (q.light > 0) { K.ellipse(g, cx, cy, 38, 30); g.save(); g.strokeStyle = 'rgba(255,250,220,0.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse ? g.ellipse(cx, cy - 2, 38, 30, 0, PI * 1.1, PI * 1.6) : 0; g.stroke(); g.restore(); }
  });

  def('string', function (g, q) {
    // 一卷透明尼龙线（木线轴）+ 散开的线
    var cx = 54, cy = 70;
    drop(g, q, function () { K.rr(g, cx - 30, cy - 34, 60, 68, 6); });
    // 线轴两端的木盘
    K.ellipse(g, cx, cy - 30, 30, 9); g.fillStyle = lin(g, cx - 30, 0, cx + 30, 0, WOOD); g.fill(); ol(g, 2);
    // 线（半透明，层层反光）
    g.beginPath(); g.rect(cx - 22, cy - 30, 44, 60); g.fillStyle = lin(g, cx - 22, 0, cx + 22, 0, ['rgba(170,200,230,0.75)', 'rgba(240,250,255,0.95)', 'rgba(150,180,215,0.75)']); g.fill();
    if (q.model > 0) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; for (var i = 0; i < 14; i++) { var y = cy - 28 + i * 4.2; g.beginPath(); g.moveTo(cx - 22, y); g.lineTo(cx + 22, y + 2); g.stroke(); } }
    g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(cx - 22, cy - 30, 44, 60);
    K.ellipse(g, cx, cy + 32, 30, 9); g.fillStyle = lin(g, cx - 30, 0, cx + 30, 0, WOOD); g.fill(); ol(g, 2);
    K.ellipse(g, cx, cy - 32, 30, 9); g.fillStyle = lin(g, cx - 30, 0, cx + 30, 0, ['#d8a470', '#9a6a3a']); g.fill(); ol(g, 2);
    circ(g, cx, cy - 32, 5); g.fillStyle = '#3a2410'; g.fill();
    // 散开的细线
    g.beginPath(); g.moveTo(cx + 22, cy - 6); g.bezierCurveTo(cx + 60, cy - 20, cx + 70, cy + 20, cx + 46, cy + 30); g.bezierCurveTo(cx + 30, cy + 40, cx + 66, cy + 56, cx + 70, cy + 40);
    g.strokeStyle = 'rgba(30,40,60,0.6)'; g.lineWidth = 3; g.stroke();
    g.strokeStyle = 'rgba(235,245,255,0.95)'; g.lineWidth = 1.5; g.stroke();
    hl(g, q, cx - 8, cy - 4, 3, 18, 0, 0.6);
  });

  def('feather', function (g, q) {
    g.save(); g.translate(64, 64); g.rotate(PI / 4);
    function vane() { P(g, 'M0 -58 C12 -44 16 -20 14 6 C12 26 8 40 2 48 L0 48 C-6 40 -12 24 -13 4 C-14 -22 -10 -44 0 -58 Z'); }
    drop(g, q, vane);
    vane(); g.fillStyle = lin(g, -14, 0, 14, 0, ['#1a1a2a', '#2e2a40', '#0e0c14']); g.fill(); ol(g, 2.4);
    // 虹彩（蓝紫光泽）
    if (q.light > 0) { g.save(); vane(); g.clip(); g.fillStyle = lin(g, -14, -40, 14, 30, ['rgba(80,120,220,0.0)', 'rgba(90,110,230,0.45)', 'rgba(150,80,200,0.3)', 'rgba(0,0,0,0)']); g.fillRect(-16, -60, 32, 110); g.restore(); }
    // 羽枝
    if (q.model > 0) {
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.2;
      for (var i = 0; i < 16; i++) { var y = -46 + i * 6; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(8, y + 2, 13, y + 9); g.moveTo(0, y + 1); g.quadraticCurveTo(-8, y + 3, -12, y + 10); g.stroke(); }
      // 羽毛的分叉缺口
      g.fillStyle = 'rgba(0,0,0,0)'; g.strokeStyle = '#0a0a10'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, -6); g.lineTo(6, -2); g.stroke(); g.beginPath(); g.moveTo(-13, 14); g.lineTo(-5, 18); g.stroke();
    }
    // 羽轴
    g.beginPath(); g.moveTo(0, -56); g.quadraticCurveTo(1, 0, 0, 62); g.strokeStyle = '#d8d0c0'; g.lineWidth = 2.6; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(1.5, -40); g.quadraticCurveTo(2, 0, 1.5, 60); g.stroke();
    g.restore();
  });

  def('bottle', function (g, q) {
    function shape() { P(g, 'M54 10 L74 10 L74 30 C74 40 92 44 92 62 L92 112 C92 117 88 120 83 120 L45 120 C40 120 36 117 36 112 L36 62 C36 44 54 40 54 30 Z'); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 36, 0, 92, 0, ['#1a3a22', '#2e6a40', '#123020', '#0a1a10']); g.fill(); ol(g, 2.6);
    // 酒液
    g.save(); shape(); g.clip(); g.fillStyle = 'rgba(120,60,10,0.55)'; g.fillRect(36, 70, 56, 50); g.restore();
    // 瓶塞与封口
    g.fillStyle = lin(g, 52, 0, 76, 0, ['#c49060', '#8a5a2a']); g.fillRect(52, 4, 24, 12); g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(52, 4, 24, 12);
    g.fillStyle = lin(g, 0, 16, 0, 30, ['#c02030', '#701018']); g.fillRect(53, 16, 22, 12);
    // 标签
    K.rr(g, 42, 70, 44, 32, 2); paper(g, q, 42, 70, 86, 102, '#f4ead0', '#c8b48a'); g.strokeStyle = 'rgba(60,40,10,0.7)'; g.lineWidth = 1.5; g.stroke();
    if (q.model > 0) { g.fillStyle = '#8a1a20'; g.fillRect(48, 78, 32, 4); g.fillStyle = 'rgba(60,40,20,0.7)'; g.fillRect(50, 86, 28, 2); g.fillRect(54, 92, 20, 2); }
    // 玻璃高光
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.5)'; K.rr(g, 41, 56, 5, 54, 2.5); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(57, 14, 3, 22); hl(g, q, 82, 62, 3, 6, 0.3, 0.3); }
  });

  def('pill', function (g, q) {
    // 胶囊 + 两粒药片
    g.save(); g.translate(56, 54); g.rotate(-0.7);
    function cap() { K.rr(g, -40, -14, 80, 28, 14); }
    drop(g, q, cap);
    g.save(); cap(); g.clip();
    g.fillStyle = lin(g, 0, -14, 0, 14, ['#ff8a90', '#d02a38', '#7a1018']); g.fillRect(-40, -14, 40, 28);
    g.fillStyle = lin(g, 0, -14, 0, 14, ['#ffffff', '#e4e4ec', '#9a9aa6']); g.fillRect(0, -14, 40, 28);
    g.restore();
    cap(); ol(g, 2.4); line(g, 0, -14, 0, 14, 2, 'rgba(0,0,0,0.4)');
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.7)'; K.rr(g, -32, -9, 60, 5, 2.5); g.fill(); }
    g.restore();
    function tab(x, y, r) {
      drop(g, q, function () { circ(g, x, y, r); });
      circ(g, x, y, r); g.fillStyle = rad(g, x - r * 0.3, y - r * 0.4, 1, r * 1.1, ['#ffffff', '#ecebf2', '#a8a6b4']); g.fill(); ol(g, 2.2);
      if (q.model > 0) line(g, x - r * 0.7, y, x + r * 0.7, y, 1.6, 'rgba(0,0,0,0.3)');
    }
    tab(84, 92, 17); tab(48, 104, 13);
  });

  def('photo', function (g, q) {
    g.save(); g.translate(64, 64); g.rotate(0.07);
    function shape() { g.beginPath(); g.rect(-48, -40, 96, 82); }
    drop(g, q, shape);
    shape(); paper(g, q, -48, -40, 48, 42, '#fbf7ee', '#ddd4c2'); ol(g, 2.4);
    // 照片（褐色调）：海边的两个孩子
    var x0 = -40, y0 = -32, w = 80, h = 58;
    g.fillStyle = lin(g, 0, y0, 0, y0 + h, ['#d8c4a0', '#b09470', '#6a5236']); g.fillRect(x0, y0, w, h);
    g.fillStyle = 'rgba(120,96,70,0.8)'; g.fillRect(x0, y0 + 30, w, 4);
    g.fillStyle = '#5a4430'; K.poly(g, [x0, y0 + h, x0, y0 + 40, x0 + 30, y0 + 36, x0 + 60, y0 + 42, x0 + w, y0 + 38, x0 + w, y0 + h]); g.fill();
    // 两个人影
    g.fillStyle = '#3a2a1c';
    circ(g, -12, -4, 6); g.fill(); K.rr(g, -19, 2, 14, 20, 4); g.fill();
    circ(g, 10, -1, 5); g.fill(); K.poly(g, [3, 4, 17, 4, 20, 22, 0, 22]); g.fill();
    if (q.model > 0) { // 塔的剪影
      g.fillStyle = 'rgba(80,60,40,0.6)'; g.fillRect(26, -26, 7, 26); K.poly(g, [24, -26, 35, -26, 29.5, -34]); g.fill();
    }
    g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 1.5; g.strokeRect(x0, y0, w, h);
    // 卷角
    P(g, 'M48 28 L48 42 L34 42 C40 40 46 34 48 28 Z'); g.fillStyle = '#c8bca4'; g.fill(); ol(g, 1.6);
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.25)'; K.poly(g, [x0, y0, x0 + 30, y0, x0, y0 + 30]); g.fill(); }
    g.restore();
  });

  def('book', function (g, q) {
    function shape() { P(g, 'M28 16 L96 12 L104 20 L104 112 L34 116 L24 108 Z'); }
    drop(g, q, shape);
    // 书页（侧面）
    P(g, 'M96 12 L104 20 L104 112 L96 106 Z'); paper(g, q, 96, 0, 104, 0, '#f0e6cc', '#c8b890'); ol(g, 2);
    if (q.model > 0) { g.strokeStyle = 'rgba(120,100,60,0.4)'; g.lineWidth = 1; for (var i = 0; i < 7; i++) { g.beginPath(); g.moveTo(97 + i, 14 + i); g.lineTo(97 + i, 107 + i * 0.6); g.stroke(); } }
    // 封面（红色皮革）
    P(g, 'M24 18 L96 12 L96 106 L24 112 Z'); g.fillStyle = lin(g, 24, 12, 96, 112, ['#c83440', '#8a1a26', '#4a0a12']); g.fill();
    if (q.tex > 0) { g.save(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'noise', { c1: '#a0a0a0', c2: '#ffffff', scale: 12, oct: 3, seed: 7 }, 48, 0, 0, 0.5); g.restore(); }
    ol(g, 2.6);
    // 书脊
    P(g, 'M24 18 L34 17 L34 111 L24 112 Z'); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fill();
    g.fillStyle = 'rgba(232,196,108,0.9)'; g.fillRect(25, 32, 9, 3); g.fillRect(25, 92, 9, 3);
    // 金色压边 + 书带
    if (q.model > 0) { g.strokeStyle = 'rgba(232,196,108,0.75)'; g.lineWidth = 1.6; P(g, 'M40 24 L90 20 L90 100 L40 104 Z'); g.stroke(); }
    g.fillStyle = lin(g, 70, 0, 78, 0, ['#e0b050', '#8a6020']); P(g, 'M70 106 L78 106 L78 124 L74 119 L70 124 Z'); g.fill(); ol(g, 1.5);
    if (q.light > 0) { g.fillStyle = 'rgba(255,220,220,0.18)'; P(g, 'M34 18 L60 16 L34 60 Z'); g.fill(); }
  });

  def('diary', function (g, q) {
    // 布面日记（刺绣花纹），右下角被火烧焦
    function shape() { P(g, 'M26 14 L100 14 L100 84 C96 92 102 98 94 104 C88 110 90 116 80 116 L26 116 Z'); }
    drop(g, q, shape);
    shape(); cloth(g, q, '#f2e8dc', '#c8b8a4', 26, 14, 100, 116); ol(g, 2.6);
    // 烧焦边缘
    g.save(); shape(); g.clip();
    g.fillStyle = rad(g, 104, 112, 6, 46, [[0, '#120806'], [0.45, '#3a1a0c'], [0.7, 'rgba(120,60,20,0.6)'], [1, 'rgba(120,60,20,0)']]); g.fillRect(50, 60, 60, 60);
    g.restore();
    // 书脊与搭扣
    g.fillStyle = 'rgba(80,60,40,0.3)'; g.fillRect(26, 14, 10, 102);
    g.fillStyle = lin(g, 0, 56, 0, 70, GOLD); K.rr(g, 92, 54, 12, 16, 3); g.fill(); ol(g, 1.6);
    // 刺绣：花与字
    if (q.model > 0) {
      g.strokeStyle = '#8a2a40'; g.lineWidth = 2;
      for (var p = 0; p < 5; p++) { var a = p / 5 * TAU; K.ellipse(g, 62 + Math.cos(a) * 7, 46 + Math.sin(a) * 7, 6, 3.5, a); g.stroke(); }
      circ(g, 62, 46, 3); g.fillStyle = '#d8a030'; g.fill();
      g.strokeStyle = '#4a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(62, 54); g.quadraticCurveTo(58, 66, 64, 76); g.stroke();
      K.text(g, '千鶴', 62, 92, 14, '#6a2a3a', { weight: 'bold' });
    }
  });

  def('clock', function (g, q) {
    // 金色怀表 + 表链
    var cx = 62, cy = 70, r = 40;
    g.beginPath(); g.moveTo(cx + 2, cy - r - 10); g.bezierCurveTo(cx + 40, cy - 70, cx + 60, cy - 50, cx + 56, cy - 20);
    g.strokeStyle = OUT; g.lineWidth = 6; g.stroke(); g.strokeStyle = lin(g, cx, cy - 70, cx + 60, cy - 20, GOLD); g.lineWidth = 3.4; g.stroke();
    if (q.model > 0) { g.setLineDash && g.setLineDash([3, 3]); g.strokeStyle = 'rgba(80,50,10,0.6)'; g.lineWidth = 1.5; g.stroke(); g.setLineDash && g.setLineDash([]); }
    drop(g, q, function () { circ(g, cx, cy, r + 4); });
    circ(g, cx, cy, r + 4); g.fillStyle = lin(g, cx - r, cy - r, cx + r, cy + r, GOLD); g.fill(); ol(g, 2.6);
    // 表冠
    g.fillStyle = lin(g, cx - 7, 0, cx + 7, 0, GOLD); K.rr(g, cx - 7, cy - r - 14, 14, 12, 3); g.fill(); ol(g, 1.8);
    g.beginPath(); g.arc(cx, cy - r - 16, 6, 0, TAU); g.strokeStyle = OUT; g.lineWidth = 4.5; g.stroke(); g.strokeStyle = '#e0b860'; g.lineWidth = 2.5; g.stroke();
    // 表盘
    circ(g, cx, cy, r - 3); g.fillStyle = rad(g, cx - 10, cy - 12, 4, r, ['#fffdf4', '#ece4d0', '#c8bca0']); g.fill();
    g.strokeStyle = 'rgba(60,40,10,0.6)'; g.lineWidth = 1.5; g.stroke();
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * TAU, r0 = i % 3 === 0 ? r - 13 : r - 9;
      line(g, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5), i % 3 === 0 ? 3 : 1.6, '#2a1e14');
    }
    if (q.model > 0) { circ(g, cx, cy + 14, 7); g.strokeStyle = 'rgba(40,30,20,0.5)'; g.lineWidth = 1; g.stroke(); }
    // 指针：九点（八响之谜）
    line(g, cx, cy, cx - 22, cy, 3.4, '#1a120c'); line(g, cx, cy, cx, cy - 30, 2.4, '#1a120c');
    circ(g, cx, cy, 3.5); g.fillStyle = '#1a120c'; g.fill();
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.4)'; P(g, 'M' + (cx - 30) + ' ' + (cy - 14) + ' C' + (cx - 26) + ' ' + (cy - 30) + ' ' + (cx - 12) + ' ' + (cy - 36) + ' ' + (cx + 4) + ' ' + (cy - 36) + ' C' + (cx - 10) + ' ' + (cy - 30) + ' ' + (cx - 22) + ' ' + (cy - 22) + ' ' + (cx - 30) + ' ' + (cy - 14) + ' Z'); g.fill(); }
  });

  def('bell', function (g, q) {
    function shape() { P(g, 'M64 18 C80 18 88 30 88 50 C88 72 92 84 106 94 L106 100 L22 100 L22 94 C36 84 40 72 40 50 C40 30 48 18 64 18 Z'); }
    // 钟舌
    circ(g, 64, 108, 9); g.fillStyle = lin(g, 56, 100, 72, 116, IRON); g.fill(); ol(g, 2);
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 22, 0, 106, 0, [[0, '#3a2408'], [0.2, '#9a6a2a'], [0.36, '#f0c878'], [0.5, '#b0803a'], [0.8, '#5a3a14'], [1, '#2a1806']]); g.fill(); ol(g, 2.6);
    // 唇边
    K.ellipse(g, 64, 98, 42, 6); g.fillStyle = lin(g, 22, 0, 106, 0, ['#5a3a14', '#d8a860', '#4a2c0c']); g.fill(); ol(g, 2);
    if (q.model > 0) { line(g, 41, 54, 87, 54, 2, 'rgba(60,30,6,0.6)'); line(g, 34, 86, 94, 86, 2, 'rgba(60,30,6,0.6)'); line(g, 34, 88, 94, 88, 1.2, 'rgba(255,230,170,0.5)'); }
    // 铜绿
    if (q.model > 0) { g.fillStyle = 'rgba(80,150,120,0.35)'; g.fillRect(74, 60, 4, 22); g.fillRect(50, 66, 3, 16); }
    // 吊环
    g.beginPath(); g.arc(64, 14, 8, PI, TAU); g.lineTo(72, 20); g.moveTo(56, 20); g.lineTo(56, 14); g.strokeStyle = OUT; g.lineWidth = 7; g.stroke(); g.strokeStyle = lin(g, 56, 6, 72, 20, GOLD); g.lineWidth = 4; g.stroke();
    if (q.light > 0) { g.fillStyle = 'rgba(255,250,220,0.55)'; P(g, 'M52 28 C48 40 48 60 46 76 L50 76 C52 60 52 40 56 28 Z'); g.fill(); }
  });

  def('cloth', function (g, q) {
    // 黑丝绒罩布：像罩在圆顶上一样垂下，下摆起伏
    function shape() { P(g, 'M64 10 C84 10 98 22 102 42 C106 62 104 82 114 104 C104 112 96 104 88 112 C80 118 72 108 64 114 C56 108 48 118 40 112 C32 104 24 112 14 104 C24 82 22 62 26 42 C30 22 44 10 64 10 Z'); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 20, 10, 110, 118, ['#4a4058', '#221c2c', '#0a080e']); g.fill(); ol(g, 2.6);
    g.save(); shape(); g.clip();
    // 褶皱：暗槽 + 丝绒的亮脊
    var folds = q.model > 0 ? [30, 46, 64, 82, 98] : [40, 64, 88];
    for (var i = 0; i < folds.length; i++) {
      var x = folds[i], top = 40 + Math.abs(x - 64) * 0.2;
      g.fillStyle = lin(g, x - 9, 0, x + 9, 0, ['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0)']);
      P(g, 'M' + (x - 2) + ' ' + top + ' C' + (x - 4) + ' 70 ' + (x - 8) + ' 92 ' + (x - 9) + ' 118 L' + (x + 9) + ' 118 C' + (x + 6) + ' 92 ' + (x + 3) + ' 70 ' + (x + 2) + ' ' + top + ' Z'); g.fill();
      if (q.light > 0) { g.fillStyle = 'rgba(190,170,220,0.22)'; P(g, 'M' + (x + 6) + ' ' + (top + 8) + ' C' + (x + 8) + ' 72 ' + (x + 11) + ' 94 ' + (x + 13) + ' 116 L' + (x + 17) + ' 116 C' + (x + 14) + ' 94 ' + (x + 11) + ' 72 ' + (x + 9) + ' ' + (top + 8) + ' Z'); g.fill(); }
    }
    // 圆顶的柔和高光（丝绒的边缘反光）
    if (q.light > 0) { g.fillStyle = rad(g, 48, 30, 2, 40, ['rgba(200,180,230,0.4)', 'rgba(200,180,230,0)']); g.fillRect(0, 0, 128, 128); }
    g.restore();
    // 顶部的黄铜吊环露出来
    g.beginPath(); g.arc(64, 8, 6, 0, TAU); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#e0b860'; g.lineWidth = 2.5; g.stroke();
    if (q.model > 0) { P(g, 'M14 104 C24 112 32 104 40 112 C48 118 56 108 64 114 C72 108 80 118 88 112 C96 104 104 112 114 104'); g.strokeStyle = 'rgba(210,170,90,0.8)'; g.lineWidth = 2.2; g.stroke(); }
  });

  def('paint', function (g, q) {
    // 调色板 + 画笔
    function pal() { P(g, 'M20 64 C16 36 44 18 72 20 C100 22 116 44 110 66 C106 80 92 78 84 84 C76 90 86 104 72 108 C46 114 24 92 20 64 Z'); }
    drop(g, q, pal);
    pal(); wood(g, q, 20, 20, 110, 110, 'h'); ol(g, 2.6);
    // 拇指孔
    K.ellipse(g, 46, 80, 9, 7); g.fillStyle = 'rgba(0,0,0,0)'; g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(); g.restore(); K.ellipse(g, 46, 80, 9, 7); ol(g, 2);
    var dabs = [[40, 44, '#c82030'], [58, 34, '#e8c030'], [78, 34, '#2a5ab0'], [94, 48, '#2a8a4a'], [96, 66, '#f4f0e8'], [64, 58, '#6a3a8a']];
    for (var i = 0; i < dabs.length; i++) {
      var d = dabs[i]; P(g, 'M' + (d[0] - 7) + ' ' + d[1] + ' C' + (d[0] - 8) + ' ' + (d[1] - 7) + ' ' + (d[0] + 6) + ' ' + (d[1] - 9) + ' ' + (d[0] + 8) + ' ' + (d[1] - 2) + ' C' + (d[0] + 10) + ' ' + (d[1] + 6) + ' ' + (d[0] - 4) + ' ' + (d[1] + 8) + ' ' + (d[0] - 7) + ' ' + d[1] + ' Z');
      g.fillStyle = d[2]; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.2; g.stroke();
      hl(g, q, d[0] - 2, d[1] - 3, 2.5, 1.5, -0.4, 0.6);
    }
    // 画笔
    g.save(); g.translate(70, 92); g.rotate(-0.75);
    K.rr(g, -6, -4, 60, 8, 4); g.fillStyle = lin(g, 0, -4, 0, 4, ['#d84a3a', '#7a1a10']); g.fill(); ol(g, 2);
    g.fillStyle = lin(g, 0, -4, 0, 4, STEEL); g.fillRect(-16, -4, 11, 8); g.strokeStyle = OUT; g.lineWidth = 1.6; g.strokeRect(-16, -4, 11, 8);
    P(g, 'M-16 -4 C-24 -4 -30 -1 -34 0 C-30 1 -24 4 -16 4 Z'); g.fillStyle = '#2a5ab0'; g.fill(); ol(g, 1.6);
    g.restore();
  });

  def('shoe', function (g, q) {
    function shape() { P(g, 'M20 44 C20 34 30 30 40 32 C52 34 58 46 70 54 C84 62 104 62 112 72 C118 80 114 92 104 94 L24 96 C16 96 14 88 16 80 Z'); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 20, 30, 100, 100, ['#7a5236', '#4a2c18', '#24140a']); g.fill(); ol(g, 2.6);
    // 鞋底
    P(g, 'M14 88 L112 88 C116 92 112 100 104 100 L22 100 C14 100 12 94 14 88 Z'); g.fillStyle = lin(g, 0, 88, 0, 100, ['#3a2a20', '#140c08']); g.fill(); ol(g, 2.2);
    g.fillStyle = '#1a100a'; g.fillRect(18, 92, 26, 10);
    // 鞋带与缝线
    if (q.model > 0) {
      g.strokeStyle = 'rgba(230,210,170,0.8)'; g.lineWidth = 2;
      for (var i = 0; i < 4; i++) { var x = 46 + i * 7, y = 46 + i * 5; g.beginPath(); g.moveTo(x - 4, y + 4); g.lineTo(x + 6, y - 2); g.stroke(); }
      g.setLineDash && g.setLineDash([3, 3]); g.strokeStyle = 'rgba(200,170,120,0.5)'; g.lineWidth = 1.2; P(g, 'M22 84 L106 84'); g.stroke(); g.setLineDash && g.setLineDash([]);
    }
    if (q.light > 0) { g.fillStyle = 'rgba(255,230,200,0.35)'; P(g, 'M74 60 C86 66 100 66 108 72 C98 70 86 70 74 64 Z'); g.fill(); hl(g, q, 30, 42, 6, 3, -0.3, 0.3); }
    // 泥
    if (q.model > 0) { g.fillStyle = 'rgba(90,70,40,0.6)'; K.ellipse(g, 90, 94, 12, 3); g.fill(); }
  });

  def('footprint', function (g, q) {
    // 两枚泥鞋印
    function print(x, y, rot, s) {
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
      function sole() { P(g, 'M0 -36 C12 -36 16 -26 15 -14 C14 -4 10 2 10 8 L10 12 C10 18 4 20 0 20 C-4 20 -10 18 -10 12 L-10 8 C-10 2 -15 -4 -15 -14 C-16 -26 -12 -36 0 -36 Z'); }
      function heel() { K.rr(g, -10, 24, 20, 18, 6); }
      sole(); g.fillStyle = rad(g, -3, -14, 2, 34, ['#7a5e40', '#4a3420', '#2a1a0c']); g.fill(); ol(g, 2.2);
      heel(); g.fillStyle = rad(g, -2, 30, 1, 14, ['#7a5e40', '#3a2814']); g.fill(); ol(g, 2.2);
      if (q.model > 0) { g.strokeStyle = 'rgba(30,18,8,0.7)'; g.lineWidth = 2; for (var i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-10, -26 + i * 6); g.lineTo(10, -26 + i * 6); g.stroke(); } for (var j = 0; j < 3; j++) { g.beginPath(); g.moveTo(-7, 28 + j * 5); g.lineTo(7, 28 + j * 5); g.stroke(); } }
      if (q.light > 0) { g.fillStyle = 'rgba(200,170,120,0.3)'; K.ellipse(g, -6, -22, 4, 8, 0.2); g.fill(); }
      g.restore();
    }
    print(42, 74, -0.2, 1.05); print(86, 50, 0.15, 1.05);
  });

  def('tape', function (g, q) {
    // 微型录音带
    function shape() { K.rr(g, 14, 26, 100, 70, 6); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 14, 26, 114, 96, ['#4a4a54', '#26262e', '#121216']); g.fill(); ol(g, 2.6);
    // 标签
    K.rr(g, 22, 32, 84, 30, 3); paper(g, q, 22, 32, 106, 62, '#f8f4e8', '#d8d0bc'); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#c02a3a'; g.fillRect(22, 36, 84, 4);
    if (q.model > 0) { g.fillStyle = 'rgba(40,40,80,0.7)'; g.fillRect(28, 46, 46, 2); g.fillRect(28, 52, 30, 2); K.text(g, 'A', 98, 52, 10, '#2a2a4a', { weight: 'bold', font: 'Arial,sans-serif' }); }
    // 窗口 + 两个卷盘
    K.rr(g, 34, 64, 60, 22, 4); g.fillStyle = '#0a0a0e'; g.fill(); g.strokeStyle = '#6a6a74'; g.lineWidth = 1.5; g.stroke();
    for (var i = 0; i < 2; i++) {
      var cx = 48 + i * 32; circ(g, cx, 75, i ? 6 : 9); g.fillStyle = '#3a2a1e'; g.fill();
      circ(g, cx, 75, 5); g.fillStyle = '#e8e8f0'; g.fill();
      if (q.model > 0) for (var t = 0; t < 6; t++) { var a = t / 6 * TAU; line(g, cx, 75, cx + Math.cos(a) * 4, 75 + Math.sin(a) * 4, 1.2, '#4a4a54'); }
    }
    // 下沿
    P(g, 'M34 96 L40 88 L88 88 L94 96 Z'); g.fillStyle = '#3a3a44'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke();
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.18)'; K.rr(g, 16, 28, 96, 6, 3); g.fill(); }
  });

  def('recorder', function (g, q) {
    // 手持微型录音机
    function shape() { K.rr(g, 32, 10, 64, 108, 10); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 32, 10, 96, 118, ['#8a8a96', '#4a4a56', '#22222a']); g.fill(); ol(g, 2.6);
    // 磁带仓窗口
    K.rr(g, 40, 20, 48, 34, 4); g.fillStyle = '#0c0c12'; g.fill(); g.strokeStyle = '#9a9aa6'; g.lineWidth = 1.5; g.stroke();
    for (var i = 0; i < 2; i++) { circ(g, 54 + i * 20, 37, 6); g.fillStyle = '#5a5a64'; g.fill(); circ(g, 54 + i * 20, 37, 2.5); g.fillStyle = '#e8e8f0'; g.fill(); }
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.25)'; K.poly(g, [42, 22, 60, 22, 42, 40]); g.fill(); }
    // 喇叭网
    if (q.model > 0) { g.fillStyle = '#1a1a20'; for (var r = 0; r < 5; r++) for (var c = 0; c < 6; c++) { circ(g, 46 + c * 7, 66 + r * 6, 1.6); g.fill(); } }
    else { K.rr(g, 42, 62, 44, 28, 4); g.fillStyle = '#2a2a32'; g.fill(); }
    // 按键（录音键红色）
    var keys = ['#c02030', '#d8d8e0', '#d8d8e0', '#d8d8e0'];
    for (var k = 0; k < 4; k++) { K.rr(g, 40 + k * 12, 96, 10, 14, 2); g.fillStyle = lin(g, 0, 96, 0, 110, [keys[k], K.shade(keys[k], -0.4)]); g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.4; g.stroke(); }
    circ(g, 88, 18, 2.5); g.fillStyle = '#ff3040'; g.fill();
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.3)'; K.rr(g, 35, 14, 6, 98, 3); g.fill(); }
  });

  def('ring', function (g, q) {
    var cx = 64, cy = 76;
    drop(g, q, function () { K.ellipse(g, cx, cy, 38, 30); g.moveTo(cx + 26, cy); K.ellipse(g, cx, cy, 26, 19); }, 6);
    K.ellipse(g, cx, cy, 36, 28); g.strokeStyle = OUT; g.lineWidth = 15; g.stroke();
    K.ellipse(g, cx, cy, 36, 28); g.strokeStyle = lin(g, cx - 36, cy - 28, cx + 36, cy + 28, GOLD); g.lineWidth = 10; g.stroke();
    if (q.light > 0) { g.beginPath(); g.ellipse ? g.ellipse(cx, cy, 38, 30, 0, PI * 0.9, PI * 1.4) : 0; g.strokeStyle = 'rgba(255,255,230,0.8)'; g.lineWidth = 2.5; g.stroke(); }
    // 宝石托与宝石
    P(g, 'M50 50 L78 50 L72 40 L56 40 Z'); g.fillStyle = lin(g, 50, 40, 78, 50, GOLD); g.fill(); ol(g, 2);
    P(g, 'M50 34 L56 22 L72 22 L78 34 L64 50 Z'); g.fillStyle = lin(g, 50, 22, 78, 50, ['#d8f0ff', '#6aa0e8', '#1a3a8a']); g.fill(); ol(g, 2.2);
    if (q.model > 0) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.2; P(g, 'M50 34 L78 34 M56 22 L60 34 L64 50 M72 22 L68 34 L64 50'); g.stroke(); }
    hl(g, q, 59, 28, 3, 2, -0.4, 0.9);
  });

  def('hairpin', function (g, q) {
    // 发簪：细长金属簪杆 + 红色珠花与垂饰
    g.save(); g.translate(64, 64); g.rotate(-0.8);
    function stick() { K.rr(g, -54, -3, 92, 6, 3); }
    drop(g, q, stick);
    stick(); g.fillStyle = lin(g, 0, -3, 0, 3, STEEL); g.fill(); ol(g, 2);
    g.restore();
    // 花
    var fx = 88, fy = 38;
    drop(g, q, function () { circ(g, fx, fy, 20); });
    for (var p = 0; p < 5; p++) {
      var a = p / 5 * TAU - PI / 2, px = fx + Math.cos(a) * 11, py = fy + Math.sin(a) * 11;
      circ(g, px, py, 10); g.fillStyle = rad(g, px - 3, py - 3, 1, 11, ['#ff8a9a', '#d02a44', '#7a0a20']); g.fill(); ol(g, 1.8);
    }
    circ(g, fx, fy, 6); g.fillStyle = rad(g, fx - 2, fy - 2, 1, 7, ['#fff0b0', '#d8a030', '#7a5010']); g.fill(); ol(g, 1.5);
    // 垂饰
    line(g, fx - 10, fy + 14, fx - 18, fy + 40, 1.5, '#c8a050'); line(g, fx + 2, fy + 18, fx, fy + 46, 1.5, '#c8a050');
    circ(g, fx - 18, fy + 43, 4); g.fillStyle = '#d02a44'; g.fill(); ol(g, 1.2);
    circ(g, fx, fy + 49, 4); g.fillStyle = '#e8c860'; g.fill(); ol(g, 1.2);
    hl(g, q, fx - 14, fy - 8, 3, 2, -0.5, 0.7);
  });

  def('candle', function (g, q) {
    // 黄铜烛台 + 白蜡烛 + 火焰
    function base() { K.ellipse(g, 64, 108, 38, 10); }
    drop(g, q, function () { base(); g.rect(46, 44, 36, 64); });
    base(); g.fillStyle = lin(g, 26, 0, 102, 0, GOLD); g.fill(); ol(g, 2.4);
    K.ellipse(g, 64, 104, 26, 6); g.fillStyle = lin(g, 38, 0, 90, 0, ['#fff0c0', '#b08030']); g.fill();
    P(g, 'M58 100 L56 84 L72 84 L70 100 Z'); g.fillStyle = lin(g, 56, 0, 72, 0, GOLD); g.fill(); ol(g, 1.8);
    K.ellipse(g, 64, 84, 16, 5); g.fillStyle = lin(g, 48, 0, 80, 0, GOLD); g.fill(); ol(g, 1.8);
    // 蜡烛 + 蜡泪
    P(g, 'M52 82 L52 44 C52 40 76 40 76 44 L76 82 Z'); g.fillStyle = lin(g, 52, 0, 76, 0, ['#ffffff', '#f2ece0', '#c8bca8']); g.fill(); ol(g, 2.2);
    P(g, 'M52 44 C56 50 54 58 56 62 C58 58 58 50 62 46 Z'); g.fillStyle = '#fbf6ec'; g.fill();
    K.ellipse(g, 64, 43, 12, 3.5); g.fillStyle = '#e8dccc'; g.fill();
    line(g, 64, 42, 64, 34, 2, '#2a2018');
    // 火焰
    if (q.light > 0) K.glow(g, 64, 22, 30, '#ffb050', 0.5, 'source-over');
    P(g, 'M64 4 C72 14 74 24 70 31 C68 35 60 35 58 31 C54 24 56 14 64 4 Z'); g.fillStyle = lin(g, 0, 4, 0, 35, ['#fff2a0', '#ffb030', '#e05010']); g.fill();
    K.ellipse(g, 64, 27, 3.5, 6); g.fillStyle = '#ffffff'; g.fill();
  });

  def('fire', function (g, q) {
    function outer() { P(g, 'M64 6 C72 24 92 30 96 54 C100 40 108 40 108 40 C114 64 112 90 98 106 C88 118 74 122 64 122 C50 122 34 118 26 104 C14 86 16 62 26 46 C28 58 34 62 38 62 C34 40 50 28 64 6 Z'); }
    if (q.light > 0) K.glow(g, 64, 80, 64, '#ff7a20', 0.45, 'source-over');
    drop(g, q, outer);
    outer(); g.fillStyle = lin(g, 0, 6, 0, 122, ['#ffb040', '#f06018', '#a01808']); g.fill(); ol(g, 2.6);
    P(g, 'M64 36 C70 52 86 58 86 78 C90 70 94 72 94 72 C96 90 88 106 76 112 C70 115 58 115 52 112 C40 106 34 92 38 78 C42 84 46 86 48 84 C46 66 56 54 64 36 Z'); g.fillStyle = lin(g, 0, 36, 0, 116, ['#ffe070', '#ffa020', '#e05010']); g.fill();
    P(g, 'M64 66 C70 78 78 84 76 98 C74 108 68 112 64 112 C58 112 52 108 51 100 C50 90 58 82 64 66 Z'); g.fillStyle = lin(g, 0, 66, 0, 112, ['#fffbe0', '#ffe080']); g.fill();
    if (q.model > 0) { // 火星
      var fr = K.rng(3); for (var i = 0; i < 6; i++) { circ(g, 30 + fr() * 70, 10 + fr() * 40, 1.5 + fr() * 1.5); g.fillStyle = 'rgba(255,200,90,0.9)'; g.fill(); }
    }
  });

  def('map', function (g, q) {
    // 折叠的旧地图
    function shape() { P(g, 'M10 24 L44 14 L84 24 L118 14 L118 104 L84 114 L44 104 L10 114 Z'); }
    drop(g, q, shape);
    shape(); paper(g, q, 10, 14, 118, 114, '#efe2bc', '#c4ac78'); ol(g, 2.6);
    // 折面明暗
    P(g, 'M44 14 L84 24 L84 114 L44 104 Z'); g.fillStyle = 'rgba(90,60,20,0.18)'; g.fill();
    P(g, 'M10 24 L44 14 L44 104 L10 114 Z'); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fill();
    line(g, 44, 14, 44, 104, 1.6, 'rgba(90,60,20,0.5)'); line(g, 84, 24, 84, 114, 1.6, 'rgba(90,60,20,0.5)');
    // 岛的轮廓 + 路线 + ×
    P(g, 'M26 60 C24 44 40 36 58 38 C76 36 100 42 102 58 C104 76 90 90 66 92 C44 94 28 80 26 60 Z'); g.fillStyle = 'rgba(110,130,80,0.45)'; g.fill(); g.strokeStyle = 'rgba(90,60,30,0.8)'; g.lineWidth = 2; g.stroke();
    if (q.model > 0) { g.setLineDash && g.setLineDash([4, 4]); P(g, 'M36 80 C46 70 52 60 66 58 C78 56 84 50 90 46'); g.strokeStyle = '#b02020'; g.lineWidth = 2.2; g.stroke(); g.setLineDash && g.setLineDash([]); }
    line(g, 86, 40, 96, 50, 3.4, '#b02020'); line(g, 96, 40, 86, 50, 3.4, '#b02020');
    // 罗盘
    if (q.model > 0) { P(g, 'M24 28 L27 38 L24 48 L21 38 Z'); g.fillStyle = '#5a3a1a'; g.fill(); }
  });

  def('blueprint', function (g, q) {
    // 平铺的蓝图 + 卷起的图纸
    function sheet() { P(g, 'M8 30 L100 22 L106 108 L14 116 Z'); }
    drop(g, q, sheet);
    sheet(); g.fillStyle = lin(g, 8, 22, 106, 116, ['#4a7ac0', '#2a5296', '#1a3a70']); g.fill(); ol(g, 2.6);
    g.save(); sheet(); g.clip();
    g.strokeStyle = 'rgba(220,235,255,0.85)'; g.lineWidth = 1.8;
    P(g, 'M22 40 L92 34 L97 100 L27 106 Z'); g.stroke();
    // 塔的立面
    g.lineWidth = 2; P(g, 'M46 98 L44 54 L60 52 L62 96 Z M42 54 L52 38 L62 52'); g.stroke();
    circ(g, 52, 62, 4); g.stroke();
    if (q.model > 0) { g.lineWidth = 1.2; for (var i = 0; i < 5; i++) { g.beginPath(); g.moveTo(70, 50 + i * 9); g.lineTo(88, 48.5 + i * 9); g.stroke(); } g.beginPath(); g.moveTo(30, 100); g.lineTo(90, 95); g.stroke(); }
    if (q.tex > 0) { g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'paper', { c1: '#c0c8d8', c2: '#ffffff', seed: 23 }, 64, 0, 0, 0.6); }
    g.restore();
    // 图纸筒
    g.save(); g.translate(98, 46); g.rotate(1.2);
    K.rr(g, -46, -9, 92, 18, 9); g.fillStyle = lin(g, 0, -9, 0, 9, ['#e8dcc0', '#c8b890', '#7a6a48']); g.fill(); ol(g, 2.2);
    K.ellipse(g, 44, 0, 5, 9); g.fillStyle = '#a89870'; g.fill(); ol(g, 1.6); K.ellipse(g, 44, 0, 2.5, 5); g.fillStyle = '#5a4a30'; g.fill();
    g.fillStyle = '#b02020'; g.fillRect(-8, -9, 6, 18);
    g.restore();
  });

  def('plate', function (g, q) {
    // 挂在钉子上的铜牌（楼梯牌）
    line(g, 64, 10, 30, 42, 2.2, '#5a4a30'); line(g, 64, 10, 98, 42, 2.2, '#5a4a30');
    circ(g, 64, 10, 5); g.fillStyle = lin(g, 59, 5, 69, 15, IRON); g.fill(); ol(g, 1.6);
    function shape() { K.rr(g, 14, 40, 100, 62, 6); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 14, 40, 114, 102, GOLD); g.fill(); ol(g, 2.6);
    K.rr(g, 22, 48, 84, 46, 4); g.strokeStyle = 'rgba(90,56,10,0.8)'; g.lineWidth = 2; g.stroke();
    if (q.light > 0) { K.rr(g, 23, 49, 84, 46, 4); g.strokeStyle = 'rgba(255,240,190,0.5)'; g.lineWidth = 1; g.stroke(); }
    K.text(g, '西', 64, 72, 36, '#4a2c08', { weight: 'bold', shadow: 'rgba(255,230,160,0.6)' });
    circ(g, 30, 56, 3); g.fillStyle = '#6a4a18'; g.fill(); circ(g, 98, 56, 3); g.fill();
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,230,0.3)'; K.poly(g, [16, 42, 60, 42, 16, 80]); g.fill(); }
  });

  def('glass', function (g, q) {
    function bowl() { P(g, 'M34 14 L94 14 C96 40 88 62 64 66 C40 62 32 40 34 14 Z'); }
    drop(g, q, function () { bowl(); g.rect(60, 64, 8, 40); K.ellipse(g, 64, 108, 28, 7); });
    // 杯脚
    K.ellipse(g, 64, 108, 28, 7); g.fillStyle = 'rgba(200,215,235,0.6)'; g.fill(); ol(g, 2);
    g.beginPath(); g.rect(60, 64, 8, 42); g.fillStyle = lin(g, 60, 0, 68, 0, ['rgba(255,255,255,0.8)', 'rgba(160,180,210,0.6)']); g.fill(); ol(g, 1.8);
    // 酒（红）
    g.save(); bowl(); g.clip(); g.fillStyle = lin(g, 0, 30, 0, 66, ['#c02838', '#6a0a18']); g.fillRect(30, 32, 70, 40);
    K.ellipse(g, 64, 32, 30, 5); g.fillStyle = '#e0505c'; g.fill(); g.restore();
    bowl(); g.fillStyle = 'rgba(210,225,245,0.25)'; g.fill(); ol(g, 2.4);
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.7)'; P(g, 'M40 18 C38 34 42 48 50 56 C44 46 42 32 44 18 Z'); g.fill(); g.fillRect(62, 70, 2, 30); }
  });

  def('cup', function (g, q) {
    // 茶杯与碟（青花）
    function saucer() { K.ellipse(g, 62, 100, 50, 14); }
    drop(g, q, function () { saucer(); g.rect(28, 50, 64, 50); });
    saucer(); g.fillStyle = lin(g, 12, 86, 112, 114, ['#ffffff', '#e4e4ec', '#a8a8b8']); g.fill(); ol(g, 2.4);
    K.ellipse(g, 62, 97, 30, 7); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fill();
    // 杯把
    g.beginPath(); g.arc(94, 70, 12, -PI / 2, PI / 2); g.strokeStyle = OUT; g.lineWidth = 9; g.stroke(); g.strokeStyle = '#ececf4'; g.lineWidth = 5; g.stroke();
    // 杯身
    P(g, 'M28 52 L96 52 C96 80 84 98 62 98 C40 98 28 80 28 52 Z'); g.fillStyle = lin(g, 28, 0, 96, 0, ['#ffffff', '#f2f2f8', '#b8b8c8']); g.fill(); ol(g, 2.4);
    if (q.model > 0) { g.strokeStyle = '#2a4a9a'; g.lineWidth = 2; P(g, 'M32 66 C42 60 50 72 62 66 C74 60 82 72 92 66'); g.stroke(); circ(g, 50, 80, 4); g.stroke(); circ(g, 74, 82, 3.5); g.stroke(); }
    // 茶水
    K.ellipse(g, 62, 52, 34, 7); g.fillStyle = lin(g, 28, 0, 96, 0, ['#8a4a1a', '#5a2a0a']); g.fill(); ol(g, 2);
    K.ellipse(g, 62, 52, 34, 7); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.stroke();
    // 热气
    if (q.model > 0) { g.strokeStyle = 'rgba(200,200,215,0.7)'; g.lineWidth = 2.5; for (var i = 0; i < 3; i++) { var x = 48 + i * 14; g.beginPath(); g.moveTo(x, 42); g.bezierCurveTo(x - 6, 32, x + 6, 26, x, 14); g.stroke(); } }
    hl(g, q, 38, 62, 3, 8, 0, 0.6);
  });

  def('violin', function (g, q) {
    g.save(); g.translate(60, 70); g.rotate(-0.6);
    function body() { P(g, 'M0 -44 C14 -44 20 -36 18 -26 C16 -18 10 -16 10 -10 C10 -4 22 -2 24 14 C26 34 14 46 0 46 C-14 46 -26 34 -24 14 C-22 -2 -10 -4 -10 -10 C-10 -16 -16 -18 -18 -26 C-20 -36 -14 -44 0 -44 Z'); }
    drop(g, q, function () { body(); g.rect(-4, -90, 8, 50); });
    body(); g.fillStyle = rad(g, -6, -10, 4, 52, ['#e08a40', '#a8501c', '#5a2408']); g.fill(); ol(g, 2.6);
    // 琴颈 + 琴头
    g.fillStyle = '#1a120c'; g.fillRect(-4, -84, 8, 60); g.strokeStyle = OUT; g.lineWidth = 1.6; g.strokeRect(-4, -84, 8, 60);
    P(g, 'M-5 -84 C-8 -92 -2 -98 3 -96 C8 -94 6 -88 4 -84 Z'); g.fillStyle = '#5a2a10'; g.fill(); ol(g, 1.6);
    // f 孔、琴码、弦
    g.strokeStyle = '#1a0a04'; g.lineWidth = 2;
    P(g, 'M-11 -2 C-8 4 -12 10 -9 16'); g.stroke(); P(g, 'M11 -2 C8 4 12 10 9 16'); g.stroke();
    g.fillStyle = '#e8d0a0'; g.fillRect(-9, 8, 18, 3);
    g.fillStyle = '#1a120c'; P(g, 'M-6 18 L6 18 L4 40 L-4 40 Z'); g.fill();
    if (q.model > 0) for (var s = -3; s <= 3; s += 2) line(g, s, -82, s * 1.6, 38, 0.8, 'rgba(240,235,220,0.8)');
    if (q.light > 0) { g.fillStyle = 'rgba(255,220,170,0.35)'; K.ellipse(g, -10, -28, 4, 9, 0.3); g.fill(); K.ellipse(g, -14, 18, 5, 12, 0.2); g.fill(); }
    g.restore();
  });

  def('card', function (g, q) {
    function c(x, y, rot, red, sym) {
      g.save(); g.translate(x, y); g.rotate(rot);
      function sh() { K.rr(g, -26, -38, 52, 76, 5); }
      drop(g, q, sh);
      sh(); g.fillStyle = lin(g, -26, -38, 26, 38, ['#ffffff', '#ecebf2']); g.fill(); ol(g, 2.4);
      var col = red ? '#c8102a' : '#14121a';
      if (sym === 'h') { P(g, 'M0 14 C-18 0 -16 -14 -8 -15 C-4 -16 -1 -12 0 -9 C1 -12 4 -16 8 -15 C16 -14 18 0 0 14 Z'); }
      else { P(g, 'M0 -16 C-6 -6 -18 -2 -16 8 C-14 14 -6 14 -2 10 L-5 18 L5 18 L2 10 C6 14 14 14 16 8 C18 -2 6 -6 0 -16 Z'); }
      g.fillStyle = col; g.fill();
      K.text(g, 'A', -17, -27, 13, col, { weight: 'bold', font: 'Georgia,serif' });
      g.save(); g.rotate(PI); K.text(g, 'A', -17, -27, 13, col, { weight: 'bold', font: 'Georgia,serif' }); g.restore();
      g.restore();
    }
    c(48, 62, -0.25, false, 's'); c(80, 68, 0.2, true, 'h');
  });

  def('lamp', function (g, q) {
    // 书斋的台灯：黄铜底座、细灯颈、琥珀色玻璃灯罩
    function base() { K.ellipse(g, 64, 112, 32, 9); }
    drop(g, q, function () { base(); g.rect(60, 50, 8, 60); P(g, 'M22 52 C24 26 42 12 64 12 C86 12 104 26 106 52 Z', 0, 0, 1, true); });
    base(); g.fillStyle = lin(g, 32, 0, 96, 0, GOLD); g.fill(); ol(g, 2.4);
    K.ellipse(g, 64, 106, 20, 6); g.fillStyle = lin(g, 44, 0, 84, 0, GOLD); g.fill(); ol(g, 1.6);
    g.beginPath(); g.rect(60, 52, 8, 54); g.fillStyle = lin(g, 60, 0, 68, 0, GOLD); g.fill(); ol(g, 1.8);
    // 灯颈上的勒痕
    if (q.model > 0) line(g, 59, 78, 69, 76, 1.4, 'rgba(60,30,10,0.9)');
    P(g, 'M20 54 C22 28 40 12 64 12 C88 12 106 28 108 54 Z'); g.fillStyle = lin(g, 20, 0, 108, 0, [[0, '#8a3c0c'], [0.35, '#f0a440'], [0.5, '#ffe0a0'], [0.72, '#d0802c'], [1, '#6a2c08']]); g.fill(); ol(g, 2.6);
    K.ellipse(g, 64, 54, 44, 7); g.fillStyle = 'rgba(255,240,200,0.85)'; g.fill(); ol(g, 1.8);
    circ(g, 64, 12, 5); g.fillStyle = lin(g, 59, 0, 69, 0, GOLD); g.fill(); ol(g, 1.4);
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,240,0.6)'; K.ellipse(g, 44, 34, 5, 13, 0.5); g.fill(); }
  });

  def('window', function (g, q) {
    function shape() { g.beginPath(); g.rect(18, 10, 92, 108); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 18, 10, 110, 118, WOOD); g.fill(); ol(g, 2.6);
    // 玻璃（窗外阴天）
    g.fillStyle = lin(g, 0, 20, 0, 104, ['#9aa4c0', '#c4cad8', '#7a84a0']); g.fillRect(28, 20, 72, 86);
    g.fillStyle = 'rgba(70,72,90,0.8)'; K.poly(g, [28, 106, 28, 86, 48, 80, 70, 86, 86, 78, 100, 84, 100, 106]); g.fill();
    // 窗棂
    g.fillStyle = '#5a3418'; g.fillRect(61, 20, 6, 86); g.fillRect(28, 60, 72, 5);
    g.strokeStyle = OUT; g.lineWidth = 2; g.strokeRect(28, 20, 72, 86);
    // 插销（黄铜，带新划痕）
    g.fillStyle = lin(g, 56, 0, 72, 0, GOLD); K.rr(g, 56, 52, 16, 20, 3); g.fill(); ol(g, 1.6);
    if (q.model > 0) { line(g, 58, 58, 70, 66, 1, 'rgba(255,255,255,0.9)'); line(g, 59, 62, 69, 68, 1, 'rgba(255,255,255,0.7)'); }
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.3)'; K.poly(g, [32, 22, 50, 22, 30, 56]); g.fill(); K.poly(g, [70, 66, 84, 66, 72, 90]); g.fill(); }
    // 窗台
    g.beginPath(); g.rect(12, 112, 104, 10); g.fillStyle = lin(g, 0, 112, 0, 122, ['#b0a898', '#6a6258']); g.fill(); ol(g, 2);
  });

  def('door', function (g, q) {
    function shape() { P(g, 'M28 120 L28 34 C28 16 44 8 64 8 C84 8 100 16 100 34 L100 120 Z'); }
    drop(g, q, shape);
    shape(); wood(g, q, 28, 8, 100, 120, 'v'); ol(g, 2.6);
    g.save(); shape(); g.clip();
    for (var i = 1; i < 4; i++) { line(g, 28 + i * 18, 8, 28 + i * 18, 120, 2, 'rgba(30,14,4,0.7)'); }
    g.fillStyle = lin(g, 28, 0, 100, 0, ['rgba(255,230,200,0.1)', 'rgba(0,0,0,0.3)']); g.fillRect(28, 8, 72, 112);
    g.restore();
    // 铁合页
    for (var h = 0; h < 2; h++) { var y = h ? 92 : 40; g.fillStyle = lin(g, 0, y - 5, 0, y + 5, IRON); P(g, 'M28 ' + (y - 5) + ' L84 ' + (y - 4) + ' C90 ' + y + ' 90 ' + y + ' 84 ' + (y + 4) + ' L28 ' + (y + 5) + ' Z'); g.fill(); ol(g, 1.6); if (q.model > 0) for (var r = 0; r < 3; r++) { circ(g, 38 + r * 18, y, 2.2); g.fillStyle = '#c8c8d0'; g.fill(); } }
    // 门环
    g.beginPath(); g.arc(86, 70, 7, 0.2, PI - 0.2); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#a8a8b2'; g.lineWidth = 2.5; g.stroke();
    circ(g, 86, 66, 3.5); g.fillStyle = lin(g, 82, 62, 90, 70, IRON); g.fill();
  });

  def('cage', function (g, q) {
    // 古董鸟笼：门开着，里面一根乌鸦羽毛
    var cx = 64;
    function shape() { P(g, 'M22 104 L22 54 C22 26 42 14 64 14 C86 14 106 26 106 54 L106 104 Z'); }
    drop(g, q, function () { shape(); }, 6);
    // 后侧笼条
    g.save(); shape(); g.clip(); g.fillStyle = 'rgba(30,24,30,0.35)'; g.fillRect(0, 0, 128, 128); g.restore();
    // 羽毛
    g.save(); g.translate(70, 80); g.rotate(0.9);
    P(g, 'M0 -22 C6 -14 7 -2 5 8 C4 14 2 18 0 20 C-3 16 -6 8 -6 0 C-6 -10 -4 -16 0 -22 Z'); g.fillStyle = lin(g, -6, 0, 6, 0, ['#2a2a40', '#0a0a12']); g.fill(); ol(g, 1.4);
    line(g, 0, -22, 0, 26, 1.4, '#c8c0b0');
    g.restore();
    // 笼条
    var bars = q.model > 0 ? 9 : 6;
    for (var i = 0; i <= bars; i++) {
      var t = i / bars, x = 22 + t * 84, topY = 54 - Math.sin(t * PI) * 34;
      if (i > 0 && i < bars) { g.beginPath(); g.moveTo(x, 104); g.lineTo(x, 54); g.quadraticCurveTo(x, topY + 6, cx, 14); g.strokeStyle = OUT; g.lineWidth = 4; g.stroke(); g.strokeStyle = lin(g, x - 2, 0, x + 2, 0, GOLD); g.lineWidth = 2.2; g.stroke(); }
    }
    shape(); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); shape(); g.strokeStyle = lin(g, 22, 14, 106, 104, GOLD); g.lineWidth = 3; g.stroke();
    // 打开的笼门
    P(g, 'M30 98 L30 70 L50 66 L50 96 Z'); g.strokeStyle = OUT; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#d8a850'; g.lineWidth = 2; g.stroke();
    line(g, 40, 68, 40, 97, 1.6, '#d8a850');
    // 底座 + 吊环
    K.rr(g, 14, 100, 100, 14, 4); g.fillStyle = lin(g, 0, 100, 0, 114, GOLD); g.fill(); ol(g, 2.2);
    g.beginPath(); g.arc(cx, 8, 6, 0, TAU); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#e0b860'; g.lineWidth = 2.5; g.stroke();
    if (q.light > 0) { g.beginPath(); g.arc(cx, 54, 38, PI * 1.15, PI * 1.45); g.strokeStyle = 'rgba(255,250,220,0.7)'; g.lineWidth = 2; g.stroke(); }
  });

  def('sand', function (g, q) {
    function pile() { P(g, 'M10 108 C24 92 40 60 62 54 C84 56 100 88 118 108 Z'); }
    drop(g, q, pile);
    pile(); g.fillStyle = lin(g, 30, 50, 100, 110, ['#f0dca8', '#c8a870', '#8a6a3a']); g.fill(); ol(g, 2.6);
    if (q.tex > 0) { g.save(); pile(); g.clip(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'sand', {}, 48, 0, 0, 0.6); g.restore(); }
    // 颗粒
    var r = K.rng(31);
    for (var i = 0; i < (q.model > 0 ? 70 : 30); i++) { var x = 20 + r() * 90, y = 60 + r() * 46; g.fillStyle = r() < 0.5 ? 'rgba(90,60,20,0.5)' : 'rgba(255,245,220,0.7)'; g.fillRect(x, y, 1.6, 1.6); }
    // 撒落的沙粒与贝壳
    for (var j = 0; j < 10; j++) { var sx = 30 + r() * 70, sy = 30 + r() * 20; circ(g, sx, sy, 1.4); g.fillStyle = '#d8c090'; g.fill(); }
    if (q.model > 0) { P(g, 'M92 100 C92 92 102 90 106 96 C108 100 104 104 98 104 Z'); g.fillStyle = '#f4e8e0'; g.fill(); ol(g, 1.5); }
    if (q.light > 0) { g.fillStyle = 'rgba(255,250,230,0.35)'; P(g, 'M40 80 C48 66 56 58 62 56 C54 64 48 74 44 86 Z'); g.fill(); }
  });

  def('boat', function (g, q) {
    // 旧划艇
    function hull() { P(g, 'M6 58 L122 52 C118 72 104 90 80 94 L40 96 C22 94 10 78 6 58 Z'); }
    drop(g, q, hull);
    hull(); wood(g, q, 6, 52, 122, 96, 'h'); ol(g, 2.6);
    g.save(); hull(); g.clip();
    for (var i = 0; i < 3; i++) line(g, 6, 66 + i * 9, 122, 62 + i * 9, 1.6, 'rgba(40,20,6,0.6)');
    g.fillStyle = lin(g, 0, 52, 0, 96, ['rgba(255,230,200,0.12)', 'rgba(0,0,0,0.35)']); g.fillRect(0, 50, 128, 50);
    g.restore();
    // 船舷内侧
    P(g, 'M10 58 L118 53 C112 58 100 62 64 62 C30 62 16 60 10 58 Z'); g.fillStyle = '#3a2210'; g.fill(); ol(g, 1.6);
    g.fillStyle = '#6a4424'; g.fillRect(48, 54, 26, 6);
    // 桨
    g.save(); g.translate(74, 40); g.rotate(0.35);
    g.fillStyle = lin(g, 0, -3, 0, 3, WOOD); K.rr(g, -50, -3, 80, 6, 3); g.fill(); ol(g, 1.8);
    P(g, 'M30 -3 C40 -9 54 -8 58 0 C54 8 40 9 30 3 Z'); g.fillStyle = lin(g, 30, -9, 58, 9, WOOD); g.fill(); ol(g, 1.8);
    g.restore();
    // 水波
    g.strokeStyle = 'rgba(110,150,190,0.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, 104); g.quadraticCurveTo(20, 100, 36, 104); g.quadraticCurveTo(52, 108, 68, 104); g.stroke();
    g.beginPath(); g.moveTo(70, 110); g.quadraticCurveTo(86, 106, 102, 110); g.quadraticCurveTo(114, 113, 124, 110); g.stroke();
  });

  def('cable', function (g, q) {
    // 钢缆卷 + 索端套环（止挡）
    var cx = 54, cy = 58;
    drop(g, q, function () { circ(g, cx, cy, 42); });
    for (var L = 0; L < 4; L++) {
      var r = 38 - L * 7;
      circ(g, cx, cy, r); g.strokeStyle = OUT; g.lineWidth = 9; g.stroke();
      circ(g, cx, cy, r); g.strokeStyle = lin(g, cx - r, cy - r, cx + r, cy + r, STEEL); g.lineWidth = 6; g.stroke();
      if (q.model > 0) { g.strokeStyle = 'rgba(40,44,52,0.55)'; g.lineWidth = 1; for (var t = 0; t < 40; t++) { var a = t / 40 * TAU, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; g.beginPath(); g.moveTo(x - 2, y - 2); g.lineTo(x + 2, y + 2); g.stroke(); } }
    }
    // 伸出的一段 + 止挡 + 套环
    g.beginPath(); g.moveTo(cx + 30, cy + 26); g.quadraticCurveTo(cx + 46, cy + 44, cx + 56, cy + 52); g.strokeStyle = OUT; g.lineWidth = 9; g.stroke(); g.strokeStyle = lin(g, cx + 30, cy + 26, cx + 56, cy + 52, STEEL); g.lineWidth = 5.5; g.stroke();
    g.save(); g.translate(cx + 50, cy + 47); g.rotate(0.75); K.rr(g, -6, -8, 16, 16, 3); g.fillStyle = lin(g, 0, -8, 0, 8, IRON); g.fill(); ol(g, 1.8); g.restore();
    g.beginPath(); g.arc(cx + 64, cy + 58, 9, 0, TAU); g.strokeStyle = OUT; g.lineWidth = 7; g.stroke(); g.strokeStyle = '#b8bec8'; g.lineWidth = 4; g.stroke();
    // 灰色毛呢纤维
    if (q.model > 0) { g.strokeStyle = 'rgba(150,150,160,0.9)'; g.lineWidth = 1.2; for (var f = 0; f < 4; f++) { g.beginPath(); g.moveTo(cx + 40 + f * 2, cy + 38); g.quadraticCurveTo(cx + 34 + f * 3, cy + 46, cx + 38 + f * 4, cy + 52); g.stroke(); } }
  });

  def('wax', function (g, q) {
    // 一滩凝固的蜡与蜡滴
    function puddle() { P(g, 'M16 92 C14 80 30 74 46 76 C56 66 76 66 86 74 C102 72 116 82 112 94 C110 106 86 108 66 106 C44 110 18 106 16 92 Z'); }
    drop(g, q, puddle);
    puddle(); g.fillStyle = lin(g, 16, 66, 112, 110, ['#fffaf0', '#ece0c8', '#b8a888']); g.fill(); ol(g, 2.4);
    if (q.model > 0) { K.ellipse(g, 64, 90, 30, 8); g.strokeStyle = 'rgba(160,140,110,0.5)'; g.lineWidth = 1.5; g.stroke(); K.ellipse(g, 64, 90, 16, 4); g.stroke(); }
    // 蜡滴
    var drops = [[40, 40, 9], [72, 28, 7], [94, 50, 6], [56, 58, 5]];
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      P(g, 'M' + d[0] + ' ' + (d[1] - d[2] * 1.4) + ' C' + (d[0] + d[2]) + ' ' + (d[1] - d[2] * 0.4) + ' ' + (d[0] + d[2]) + ' ' + (d[1] + d[2]) + ' ' + d[0] + ' ' + (d[1] + d[2]) + ' C' + (d[0] - d[2]) + ' ' + (d[1] + d[2]) + ' ' + (d[0] - d[2]) + ' ' + (d[1] - d[2] * 0.4) + ' ' + d[0] + ' ' + (d[1] - d[2] * 1.4) + ' Z');
      g.fillStyle = rad(g, d[0] - d[2] * 0.3, d[1] - d[2] * 0.3, 1, d[2] * 1.4, ['#ffffff', '#efe4cc', '#bcae90']); g.fill(); ol(g, 2);
      hl(g, q, d[0] - d[2] * 0.35, d[1] - d[2] * 0.2, d[2] * 0.22, d[2] * 0.4, 0, 0.8);
    }
    hl(g, q, 46, 82, 10, 3, -0.1, 0.6);
  });

  def('sequin', function (g, q) {
    // 散落的亮片
    var seq = [[36, 40, 14, '#e8c060'], [80, 30, 11, '#c8a0f0'], [60, 70, 16, '#f0d070'], [96, 74, 12, '#90c0f0'], [32, 92, 12, '#f0a0c8'], [80, 104, 9, '#e8c060']];
    for (var i = 0; i < seq.length; i++) {
      var s = seq[i];
      drop(g, q, function () { circ(g, s[0], s[1], s[2]); }, 4);
      circ(g, s[0], s[1], s[2]); g.fillStyle = rad(g, s[0] - s[2] * 0.4, s[1] - s[2] * 0.4, 1, s[2] * 1.2, ['#ffffff', s[3], K.shade(s[3], -0.5)]); g.fill(); ol(g, 2);
      circ(g, s[0], s[1], s[2] * 0.22); g.fillStyle = 'rgba(30,20,40,0.7)'; g.fill();
      if (q.model > 0) { g.beginPath(); g.arc(s[0], s[1], s[2] * 0.65, 0, TAU); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.stroke(); }
    }
    // 闪光
    if (q.light > 0) {
      var sp = [[44, 32, 7], [70, 62, 9], [104, 66, 6]];
      for (var j = 0; j < sp.length; j++) {
        var x = sp[j][0], y = sp[j][1], r = sp[j][2];
        g.fillStyle = 'rgba(255,255,255,0.95)';
        K.poly(g, [x - r, y, x, y - r * 0.18, x + r, y, x, y + r * 0.18]); g.fill(); K.poly(g, [x, y - r, x + r * 0.18, y, x, y + r, x - r * 0.18, y]); g.fill();
      }
    }
  });

  def('tooth', function (g, q) {
    function shape() { P(g, 'M28 30 C28 14 44 10 52 14 C58 17 70 17 76 14 C84 10 100 14 100 30 C100 46 92 52 90 64 C88 80 86 104 78 114 C72 120 68 110 66 96 C65 88 63 88 62 96 C60 110 56 120 50 114 C42 104 40 80 38 64 C36 52 28 46 28 30 Z'); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 28, 10, 100, 118, ['#ffffff', '#f2ece0', '#c8bca4']); g.fill(); ol(g, 2.6);
    // 牙冠的沟与牙根的阴影
    g.strokeStyle = 'rgba(150,130,100,0.5)'; g.lineWidth = 2; P(g, 'M50 22 C56 30 72 30 78 22'); g.stroke();
    g.fillStyle = 'rgba(160,140,110,0.25)'; P(g, 'M66 96 C70 108 74 112 78 112 C84 100 86 80 88 66 C80 74 72 80 66 96 Z'); g.fill();
    if (q.model > 0) { g.fillStyle = lin(g, 34, 14, 94, 40, ['#d8dce8', '#8a90a0']); P(g, 'M32 30 C32 18 44 14 52 18 C58 21 70 21 76 18 C84 14 96 18 96 30 C88 36 76 34 64 36 C52 34 40 36 32 30 Z'); g.fill(); g.strokeStyle = 'rgba(40,44,56,0.6)'; g.lineWidth = 1.4; g.stroke(); }
    hl(g, q, 42, 36, 5, 10, 0.2, 0.7);
  });

  def('doll', function (g, q) {
    // 市松人偶：黑色齐刘海、红色和服、金色腰带
    function body() { P(g, 'M40 120 C36 96 42 72 48 62 L80 62 C86 72 92 96 88 120 Z'); }
    drop(g, q, function () { body(); circ(g, 64, 42, 26); });
    body(); cloth(g, q, '#d83040', '#7a0c1c', 40, 62, 88, 120); ol(g, 2.4);
    if (q.model > 0) { g.fillStyle = 'rgba(255,220,220,0.6)'; for (var f = 0; f < 6; f++) { circ(g, 50 + (f % 3) * 12, 80 + Math.floor(f / 3) * 22, 3.5); g.fill(); } }
    P(g, 'M58 62 L64 78 L70 62 Z'); g.fillStyle = '#f4f0e8'; g.fill(); ol(g, 1.4);
    g.beginPath(); g.rect(44, 86, 40, 11); g.fillStyle = lin(g, 0, 86, 0, 97, GOLD); g.fill(); ol(g, 1.8);
    // 脸
    circ(g, 64, 42, 22); g.fillStyle = rad(g, 58, 36, 2, 24, ['#ffffff', '#f8eee6', '#d8c4b4']); g.fill(); ol(g, 2.2);
    // 头发（齐刘海 + 两侧）
    P(g, 'M40 44 C38 22 50 14 64 14 C78 14 90 22 88 44 L86 66 L78 66 L80 40 C80 34 48 34 48 40 L50 66 L42 66 Z'); g.fillStyle = lin(g, 40, 14, 88, 66, ['#3a3040', '#141018', '#050408']); g.fill(); ol(g, 2.2);
    g.fillStyle = '#141018'; g.fillRect(48, 30, 32, 8);
    // 五官
    g.fillStyle = '#1a1018'; K.ellipse(g, 57, 46, 2.6, 1.6); g.fill(); K.ellipse(g, 71, 46, 2.6, 1.6); g.fill();
    g.fillStyle = '#c82030'; K.ellipse(g, 64, 55, 2.6, 1.6); g.fill();
    g.fillStyle = 'rgba(255,140,140,0.35)'; circ(g, 52, 52, 4); g.fill(); circ(g, 76, 52, 4); g.fill();
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.3)'; P(g, 'M50 18 C56 15 62 15 66 16 C58 18 52 22 48 28 Z'); g.fill(); }
  });

  def('testimony', function (g, q) {
    // 证言：对话气泡 + 引号
    function bubble() { P(g, 'M18 18 L110 18 C116 18 120 22 120 28 L120 80 C120 86 116 90 110 90 L56 90 L32 114 L36 90 L18 90 C12 90 8 86 8 80 L8 28 C8 22 12 18 18 18 Z'); }
    drop(g, q, bubble);
    bubble(); paper(g, q, 8, 18, 120, 114, '#fbf8f0', '#d8d0c0'); ol(g, 2.8);
    // 引号
    g.fillStyle = '#8a1a26';
    for (var k = 0; k < 2; k++) {
      var x = k ? 74 : 26;
      circ(g, x + 8, 44, 7.5); g.fill(); P(g, 'M' + (x + 1) + ' 44 C' + (x + 1) + ' 34 ' + (x + 6) + ' 28 ' + (x + 13) + ' 26 L' + (x + 14) + ' 29 C' + (x + 9) + ' 32 ' + (x + 7) + ' 38 ' + (x + 7) + ' 44 Z'); g.fill();
      circ(g, x + 24, 44, 7.5); g.fill(); P(g, 'M' + (x + 17) + ' 44 C' + (x + 17) + ' 34 ' + (x + 22) + ' 28 ' + (x + 29) + ' 26 L' + (x + 30) + ' 29 C' + (x + 25) + ' 32 ' + (x + 23) + ' 38 ' + (x + 23) + ' 44 Z'); g.fill();
    }
    // 文字行
    if (q.model > 0) { g.fillStyle = 'rgba(60,50,80,0.6)'; g.fillRect(22, 64, 84, 3.4); g.fillRect(22, 74, 60, 3.4); }
    else { g.fillStyle = 'rgba(60,50,80,0.6)'; g.fillRect(22, 68, 70, 4); }
  });

  def('body', function (g, q) {
    // 粉笔人形轮廓（画在深色地面上）
    function ground() { K.rr(g, 6, 6, 116, 116, 14); }
    drop(g, q, ground, 5);
    ground(); g.fillStyle = lin(g, 6, 6, 122, 122, ['#4a4440', '#2a2624', '#181614']); g.fill(); ol(g, 2.4);
    if (q.tex > 0) { g.save(); ground(); g.clip(); g.globalCompositeOperation = 'overlay'; K.fillTex(g, q, 'noise', { c1: '#404040', c2: '#c0c0c0', scale: 8, oct: 4, seed: 9 }, 64, 0, 0, 0.6); g.restore(); }
    g.save(); g.translate(64, 64); g.rotate(-0.35);
    P(g, 'M0 -44 C9 -44 12 -36 10 -30 C8 -26 6 -24 8 -22 C18 -20 30 -30 40 -36 C44 -36 46 -32 42 -28 C34 -20 22 -12 14 -8 C12 0 12 8 14 14 C20 24 28 34 34 44 C34 48 30 50 26 46 C18 36 10 26 4 20 C0 20 -4 20 -6 22 C-10 32 -16 42 -22 50 C-26 52 -30 50 -28 44 C-22 32 -16 20 -14 12 C-14 4 -14 -2 -14 -8 C-24 -12 -34 -18 -42 -24 C-46 -28 -42 -32 -38 -30 C-28 -24 -18 -20 -8 -22 C-6 -24 -8 -26 -10 -30 C-12 -36 -9 -44 0 -44 Z');
    g.strokeStyle = 'rgba(245,245,250,0.92)'; g.lineWidth = 3.6; g.setLineDash && q.model > 0 && g.setLineDash([9, 2]); g.stroke(); g.setLineDash && g.setLineDash([]);
    g.restore();
    if (q.model > 0) { g.fillStyle = 'rgba(140,20,30,0.55)'; K.ellipse(g, 60, 60, 8, 5, 0.3); g.fill(); }
  });

  def('generic', function (g, q) {
    // 放大镜
    g.save(); g.translate(64, 64);
    function shape() { circ(g, -10, -10, 36); g.rect(14, 14, 14, 14); }
    drop(g, q, function () { circ(g, -10, -10, 38); });
    g.save(); g.rotate(PI / 4); K.rr(g, 34, -7, 48, 14, 6); g.fillStyle = lin(g, 0, -7, 0, 7, WOOD); g.fill(); ol(g, 2.4); g.fillStyle = lin(g, 0, -8, 0, 8, GOLD); g.fillRect(28, -8, 9, 16); g.strokeStyle = OUT; g.lineWidth = 1.8; g.strokeRect(28, -8, 9, 16); g.restore();
    circ(g, -10, -10, 34); g.fillStyle = rad(g, -20, -22, 2, 36, ['rgba(230,245,255,0.9)', 'rgba(150,190,230,0.6)', 'rgba(80,120,170,0.55)']); g.fill();
    circ(g, -10, -10, 34); g.strokeStyle = OUT; g.lineWidth = 11; g.stroke();
    circ(g, -10, -10, 34); g.strokeStyle = lin(g, -44, -44, 24, 24, GOLD); g.lineWidth = 7; g.stroke();
    if (q.light > 0) { g.beginPath(); g.arc(-10, -10, 24, PI * 1.05, PI * 1.5); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.stroke(); }
    void shape;
    g.restore();
  });

  /* =================================================================
   * 续作用（雪国 / 和风）
   * ================================================================= */
  def('mask', function (g, q) {
    // 白蛾神乐面：白漆木面，两颊外展成蛾翅，额上一对羽状触角，细长眼孔，朱红描线
    var cx = 64;
    function wings() {
      g.beginPath();
      P(g, 'M50 50 C36 34 16 30 6 42 C2 56 12 70 30 74 C16 82 14 98 26 104 C38 106 46 94 50 84 Z', 0, 0, 1, true);
      P(g, 'M78 50 C92 34 112 30 122 42 C126 56 116 70 98 74 C112 82 114 98 102 104 C90 106 82 94 78 84 Z', 0, 0, 1, true);
    }
    function face() { P(g, 'M64 22 C82 22 92 36 92 56 C92 82 80 106 64 116 C48 106 36 82 36 56 C36 36 46 22 64 22 Z'); }
    function antenna(side) {
      g.save(); g.translate(cx, 7); g.scale(side, 1);
      g.beginPath(); g.moveTo(6, 30); g.bezierCurveTo(10, 14, 22, 4, 38, 4);
      g.strokeStyle = OUT; g.lineWidth = 4.5; g.stroke(); g.strokeStyle = '#f4f0e6'; g.lineWidth = 2.2; g.stroke();
      // 羽状分枝
      var n = q.model > 0 ? 9 : 5;
      for (var i = 1; i <= n; i++) {
        var t = i / (n + 1), mt = 1 - t;
        var x = mt * mt * mt * 6 + 3 * mt * mt * t * 10 + 3 * mt * t * t * 22 + t * t * t * 38;
        var y = mt * mt * mt * 30 + 3 * mt * mt * t * 14 + 3 * mt * t * t * 4 + t * t * t * 4;
        var l = 7 * (1 - Math.abs(t - 0.45));
        g.strokeStyle = 'rgba(30,24,20,0.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.5, y - l); g.moveTo(x, y); g.lineTo(x + l, y + l * 0.3); g.stroke();
        g.strokeStyle = '#ece6d8'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.5, y - l); g.moveTo(x, y); g.lineTo(x + l, y + l * 0.3); g.stroke();
      }
      g.restore();
    }
    drop(g, q, function () { wings(); face(); });
    antenna(-1); antenna(1);
    // 翅
    wings(); g.fillStyle = lin(g, 0, 30, 0, 106, ['#ffffff', '#ece6da', '#c4bcae']); g.fill(); ol(g, 2.4);
    if (q.model > 0) {
      // 翅上的淡色眼纹与翅脉
      for (var sd = -1; sd <= 1; sd += 2) {
        var ex = cx + sd * 40, ey = 50;
        circ(g, ex, ey, 7); g.fillStyle = 'rgba(150,140,124,0.55)'; g.fill(); circ(g, ex, ey, 3.5); g.fillStyle = 'rgba(214,170,90,0.85)'; g.fill();
        g.strokeStyle = 'rgba(140,128,110,0.6)'; g.lineWidth = 1.2;
        P(g, 'M' + (cx + sd * 16) + ' 60 C' + (cx + sd * 30) + ' 62 ' + (cx + sd * 44) + ' 66 ' + (cx + sd * 52) + ' 72'); g.stroke();
        P(g, 'M' + (cx + sd * 16) + ' 80 C' + (cx + sd * 26) + ' 86 ' + (cx + sd * 34) + ' 94 ' + (cx + sd * 38) + ' 100'); g.stroke();
      }
    }
    // 面
    face(); g.fillStyle = rad(g, 56, 50, 4, 64, ['#ffffff', '#f4f0e8', '#cfc6b6']); g.fill(); ol(g, 2.6);
    // 额上的朱红纹（蛾身）
    P(g, 'M64 28 C60 34 60 44 64 50 C68 44 68 34 64 28 Z'); g.fillStyle = '#c81e30'; g.fill();
    // 细长的眼孔 + 朱红眼线
    g.fillStyle = '#0a0608';
    P(g, 'M44 62 C50 56 58 57 61 62 C56 64 50 65 44 62 Z'); g.fill();
    P(g, 'M84 62 C78 56 70 57 67 62 C72 64 78 65 84 62 Z'); g.fill();
    g.strokeStyle = '#c81e30'; g.lineWidth = 2; P(g, 'M41 58 C48 51 58 52 62 57'); g.stroke(); P(g, 'M87 58 C80 51 70 52 66 57'); g.stroke();
    // 鼻与口（小小的朱唇）
    g.strokeStyle = 'rgba(150,130,110,0.7)'; g.lineWidth = 1.5; P(g, 'M64 66 L62 80 L66 81'); g.stroke();
    P(g, 'M58 92 C61 89 67 89 70 92 C67 95 61 95 58 92 Z'); g.fillStyle = '#c81e30'; g.fill();
    // 系绳孔
    if (q.model > 0) { circ(g, 38, 58, 2.2); g.fillStyle = '#3a2a20'; g.fill(); circ(g, 90, 58, 2.2); g.fill(); }
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.7)'; K.ellipse(g, 52, 76, 5, 11, 0.25); g.fill(); hl(g, q, 22, 46, 6, 3, -0.4, 0.5); }
  });

  def('moth', function (g, q) {
    function wings() {
      g.beginPath();
      P(g, 'M64 54 C50 30 26 18 10 26 C4 40 14 58 34 62 C18 70 16 88 30 96 C44 98 56 82 64 70 Z', 0, 0, 1, true);
      P(g, 'M64 54 C78 30 102 18 118 26 C124 40 114 58 94 62 C110 70 112 88 98 96 C84 98 72 82 64 70 Z', 0, 0, 1, true);
    }
    drop(g, q, wings);
    wings(); g.fillStyle = lin(g, 10, 20, 118, 100, ['#c8b08a', '#8a7050', '#4a3a28']); g.fill(); ol(g, 2.4);
    if (q.tex > 0) { g.save(); wings(); g.clip(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'noise', { c1: '#a09080', c2: '#ffffff', scale: 10, oct: 3, seed: 4 }, 48, 0, 0, 0.6); g.restore(); }
    // 眼斑与纹路
    for (var s = -1; s <= 1; s += 2) {
      var ex = 64 + s * 30, ey = 42;
      circ(g, ex, ey, 9); g.fillStyle = '#2a1e14'; g.fill(); circ(g, ex, ey, 5); g.fillStyle = '#d8b878'; g.fill(); circ(g, ex - s, ey - 1, 2.2); g.fillStyle = '#1a120a'; g.fill();
      if (q.model > 0) { g.strokeStyle = 'rgba(50,36,20,0.6)'; g.lineWidth = 1.5; P(g, 'M64 58 C' + (64 + s * 20) + ' 50 ' + (64 + s * 34) + ' 56 ' + (64 + s * 44) + ' 58'); g.stroke(); P(g, 'M64 66 C' + (64 + s * 16) + ' 74 ' + (64 + s * 24) + ' 82 ' + (64 + s * 30) + ' 90'); g.stroke(); }
    }
    // 身体 + 触角
    K.ellipse(g, 64, 66, 6, 22); g.fillStyle = lin(g, 58, 0, 70, 0, ['#8a7454', '#3a2c1c']); g.fill(); ol(g, 2);
    if (q.model > 0) for (var b = 0; b < 4; b++) line(g, 59, 62 + b * 7, 69, 62 + b * 7, 1.2, 'rgba(30,20,10,0.6)');
    g.strokeStyle = OUT; g.lineWidth = 2; P(g, 'M62 46 C56 34 50 28 42 26 M66 46 C72 34 78 28 86 26'); g.stroke();
  });

  def('snow', function (g, q) {
    // 雪花结晶
    var cx = 64, cy = 64;
    function arms(w, col) {
      g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
      for (var i = 0; i < 6; i++) {
        var a = i / 6 * TAU - PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + ca * 52, cy + sa * 52); g.stroke();
        var br = q.model > 0 ? [[22, 14], [36, 11], [46, 6]] : [[28, 12]];
        for (var b = 0; b < br.length; b++) {
          var d = br[b][0], l = br[b][1], bx = cx + ca * d, by = cy + sa * d;
          for (var s = -1; s <= 1; s += 2) { var a2 = a + s * PI / 3; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a2) * l, by + Math.sin(a2) * l); g.stroke(); }
        }
      }
    }
    if (q.light > 0) { g.save(); K.shadow(g, q, 6, 'rgba(0,10,40,0.45)', 2, 3); arms(9, '#1a3050'); g.restore(); } else arms(9, '#1a3050');
    arms(9, '#1a3050'); arms(5, '#ffffff');
    if (q.light > 0) arms(2, 'rgba(160,200,255,0.9)');
    g.beginPath(); for (var k = 0; k < 6; k++) { var ak = k / 6 * TAU - PI / 2; if (k) g.lineTo(cx + Math.cos(ak) * 12, cy + Math.sin(ak) * 12); else g.moveTo(cx + Math.cos(ak) * 12, cy + Math.sin(ak) * 12); } g.closePath();
    g.fillStyle = rad(g, cx - 3, cy - 3, 1, 14, ['#ffffff', '#b8d4f4']); g.fill(); ol(g, 2.2);
  });

  def('ice', function (g, q) {
    function cube(x, y, s) {
      var top = [x, y - s * 0.55, x + s * 0.9, y - s * 0.1, x, y + s * 0.35, x - s * 0.9, y - s * 0.1];
      var left = [x - s * 0.9, y - s * 0.1, x, y + s * 0.35, x, y + s * 1.3, x - s * 0.9, y + s * 0.85];
      var right = [x + s * 0.9, y - s * 0.1, x, y + s * 0.35, x, y + s * 1.3, x + s * 0.9, y + s * 0.85];
      drop(g, q, function () { K.poly(g, [top[0], top[1], top[2], top[3], right[4], right[5] + 0, right[6], right[7], left[6], left[7], left[0], left[1]]); });
      K.poly(g, left); g.fillStyle = 'rgba(150,190,230,0.85)'; g.fill(); ol(g, 2);
      K.poly(g, right); g.fillStyle = 'rgba(100,150,205,0.85)'; g.fill(); ol(g, 2);
      K.poly(g, top); g.fillStyle = 'rgba(225,242,255,0.95)'; g.fill(); ol(g, 2);
      if (q.model > 0) { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - s * 0.5, y + s * 0.3); g.lineTo(x - s * 0.2, y + s * 0.9); g.moveTo(x + s * 0.4, y + s * 0.5); g.lineTo(x + s * 0.6, y + s * 0.7); g.stroke(); }
      if (q.light > 0) { g.fillStyle = 'rgba(255,255,255,0.8)'; K.poly(g, [x - s * 0.5, y - s * 0.12, x - s * 0.1, y - s * 0.3, x + s * 0.05, y - s * 0.22, x - s * 0.35, y - s * 0.02]); g.fill(); }
    }
    cube(46, 56, 30); cube(86, 76, 26);
    // 融水
    if (q.model > 0) { K.ellipse(g, 66, 116, 46, 6); g.fillStyle = 'rgba(140,180,225,0.45)'; g.fill(); }
  });

  def('charcoal', function (g, q) {
    var lumps = [[44, 78, 26, 20, 0.3], [82, 84, 24, 18, -0.2], [62, 56, 22, 17, 0.1], [92, 60, 14, 11, 0.5]];
    for (var i = 0; i < lumps.length; i++) {
      var l = lumps[i];
      drop(g, q, function () { K.ellipse(g, l[0], l[1], l[2], l[3], l[4]); }, 5);
      g.save(); g.translate(l[0], l[1]); g.rotate(l[4]);
      P(g, 'M' + (-l[2]) + ' 0 L' + (-l[2] * 0.6) + ' ' + (-l[3]) + ' L' + (l[2] * 0.4) + ' ' + (-l[3] * 1.05) + ' L' + l[2] + ' ' + (-l[3] * 0.2) + ' L' + (l[2] * 0.7) + ' ' + l[3] + ' L' + (-l[2] * 0.5) + ' ' + (l[3] * 0.95) + ' Z');
      g.fillStyle = lin(g, -l[2], -l[3], l[2], l[3], ['#5a5660', '#24222a', '#0a0a0e']); g.fill(); ol(g, 2.2);
      if (q.model > 0) { g.strokeStyle = 'rgba(120,118,130,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-l[2] * 0.6, -l[3] * 0.4); g.lineTo(l[2] * 0.5, -l[3] * 0.5); g.moveTo(-l[2] * 0.4, l[3] * 0.3); g.lineTo(l[2] * 0.6, l[3] * 0.2); g.stroke(); }
      g.restore();
    }
    // 余烬
    if (q.light > 0) { K.glow(g, 50, 88, 20, '#ff6a20', 0.6, 'source-over'); g.fillStyle = 'rgba(255,150,60,0.95)'; K.ellipse(g, 50, 90, 6, 2.5, 0.3); g.fill(); g.fillStyle = 'rgba(255,220,140,0.9)'; K.ellipse(g, 52, 89, 2.5, 1.2, 0.3); g.fill(); }
  });

  def('lantern', function (g, q) {
    // 纸灯笼（红白提灯）
    function body() { P(g, 'M64 22 C92 22 104 44 104 64 C104 84 92 106 64 106 C36 106 24 84 24 64 C24 44 36 22 64 22 Z'); }
    if (q.light > 0) K.glow(g, 64, 64, 60, '#ff9a40', 0.35, 'source-over');
    drop(g, q, function () { body(); g.rect(42, 12, 44, 12); g.rect(42, 104, 44, 12); });
    body(); g.fillStyle = rad(g, 58, 58, 6, 50, ['#fff4d8', '#f0b060', '#c04020']); g.fill(); ol(g, 2.4);
    g.save(); body(); g.clip();
    g.fillStyle = 'rgba(200,30,30,0.75)'; g.fillRect(20, 52, 90, 24);
    g.strokeStyle = 'rgba(120,50,20,0.55)'; g.lineWidth = 1.5;
    for (var i = 0; i < (q.model > 0 ? 9 : 5); i++) { var y = 28 + i * 9.5; g.beginPath(); g.moveTo(20, y); g.quadraticCurveTo(64, y + (y - 64) * 0.12, 108, y); g.stroke(); }
    g.restore();
    if (q.model > 0) K.text(g, '祭', 64, 64, 20, '#fff2d0', { weight: 'bold' });
    // 上下框 + 提手
    g.beginPath(); g.rect(40, 12, 48, 12); g.fillStyle = lin(g, 0, 12, 0, 24, ['#3a2a20', '#140c08']); g.fill(); ol(g, 2);
    g.beginPath(); g.rect(40, 104, 48, 12); g.fill(); ol(g, 2);
    g.beginPath(); g.arc(64, 12, 12, PI, TAU); g.strokeStyle = OUT; g.lineWidth = 4; g.stroke();
  });

  def('geta', function (g, q) {
    // 木屐（斜上方俯视）：椭圆木底板 + 下方两枚齿 + 红色鼻绪
    g.save(); g.translate(64, 66); g.rotate(-0.35);
    function board() { K.rr(g, -26, -50, 52, 100, 22); }
    drop(g, q, function () { board(); g.rect(-24, -36, 48, 82); });
    // 齿（板下露出的厚度）
    for (var t = 0; t < 2; t++) { var y = t ? 26 : -34; K.rr(g, -24, y, 48, 16, 3); g.fillStyle = lin(g, 0, y, 0, y + 16, ['#6a4424', '#2a160a']); g.fill(); ol(g, 2); }
    // 板侧厚度
    K.rr(g, -26, -46, 52, 100, 22); g.fillStyle = '#5a361a'; g.fill(); ol(g, 2.2);
    board(); wood(g, q, -26, -50, 26, 50, 'v'); ol(g, 2.6);
    board(); g.fillStyle = lin(g, -26, -50, 26, 50, ['rgba(255,235,200,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)']); g.fill();
    if (q.model > 0) { K.ellipse(g, 0, 10, 14, 30); g.fillStyle = 'rgba(40,20,8,0.18)'; g.fill(); }
    // 鼻绪：前端一点 → 两侧
    g.beginPath(); g.moveTo(0, -34); g.bezierCurveTo(-6, -18, -18, -4, -24, 8); g.moveTo(0, -34); g.bezierCurveTo(6, -18, 18, -4, 24, 8);
    g.strokeStyle = OUT; g.lineWidth = 10; g.stroke(); g.strokeStyle = lin(g, -24, -34, 24, 8, ['#ff6a78', '#c81830', '#7a0818']); g.lineWidth = 6.5; g.stroke();
    if (q.model > 0) { g.strokeStyle = 'rgba(255,210,210,0.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-2, -30); g.bezierCurveTo(-7, -16, -17, -4, -22, 6); g.stroke(); }
    circ(g, 0, -34, 5); g.fillStyle = '#d02a3a'; g.fill(); ol(g, 1.6);
    g.restore();
  });

  def('shovel', function (g, q) {
    g.save(); g.translate(64, 64); g.rotate(-0.7);
    function blade() { P(g, 'M-16 10 L16 10 L18 44 C14 56 6 60 0 62 C-6 60 -14 56 -18 44 Z'); }
    drop(g, q, function () { blade(); g.rect(-4, -60, 8, 72); });
    // 柄 + 握把
    K.rr(g, -4, -54, 8, 66, 3); g.fillStyle = lin(g, -4, 0, 4, 0, WOOD); g.fill(); ol(g, 2);
    g.beginPath(); g.moveTo(-14, -62); g.lineTo(14, -62); g.lineTo(4, -52); g.lineTo(-4, -52); g.closePath(); g.fillStyle = lin(g, 0, -62, 0, -52, WOOD); g.fill(); ol(g, 2);
    K.rr(g, -14, -66, 28, 7, 3); g.fillStyle = lin(g, 0, -66, 0, -59, WOOD); g.fill(); ol(g, 2);
    // 铲面
    blade(); g.fillStyle = lin(g, -18, 10, 18, 60, IRON); g.fill(); ol(g, 2.4);
    g.fillStyle = lin(g, 0, 6, 0, 16, STEEL); g.fillRect(-6, 4, 12, 12); g.strokeStyle = OUT; g.lineWidth = 1.6; g.strokeRect(-6, 4, 12, 12);
    if (q.model > 0) { g.fillStyle = 'rgba(255,255,255,0.85)'; P(g, 'M-14 40 C-10 50 -4 54 0 56 C6 54 12 50 16 42 C10 46 4 48 0 48 C-6 48 -10 46 -14 40 Z'); g.fill(); }
    if (q.light > 0) line(g, -10, 16, -12, 42, 2.4, 'rgba(255,255,255,0.6)');
    g.restore();
  });

  def('radio', function (g, q) {
    // 老式收音机（带拉杆天线）
    line(g, 92, 36, 112, 4, 3, OUT); line(g, 92, 36, 112, 4, 1.6, '#d8d8e0');
    function shape() { K.rr(g, 14, 34, 100, 74, 10); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 14, 34, 114, 108, ['#9a6a42', '#6a4024', '#3a200e']); g.fill(); ol(g, 2.6);
    if (q.tex > 0) { g.save(); shape(); g.clip(); g.globalCompositeOperation = 'multiply'; K.fillTex(g, q, 'wood', { c1: '#9a8070', c2: '#ffffff', planks: 1, dir: 'h', seed: 5, gap: '#ffffff', ring: 3 }, 64, 0, 0, 0.6); g.restore(); }
    // 喇叭布
    K.rr(g, 22, 44, 50, 54, 6); g.fillStyle = lin(g, 22, 44, 72, 98, ['#d8c8a0', '#a08a60']); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    if (q.model > 0) { g.strokeStyle = 'rgba(90,70,40,0.5)'; g.lineWidth = 1; for (var i = 0; i < 9; i++) { line(g, 26, 50 + i * 5.5, 68, 50 + i * 5.5, 1, 'rgba(90,70,40,0.5)'); } }
    // 刻度窗 + 旋钮
    K.rr(g, 78, 44, 28, 20, 3); g.fillStyle = lin(g, 0, 44, 0, 64, ['#fff0c0', '#d8b870']); g.fill(); ol(g, 1.6);
    line(g, 90, 46, 90, 62, 1.6, '#c02020');
    for (var k = 0; k < 2; k++) { var kx = 84 + k * 16; circ(g, kx, 82, 7); g.fillStyle = rad(g, kx - 2, 80, 1, 8, ['#e8e8f0', '#6a6a74', '#2a2a30']); g.fill(); ol(g, 1.6); }
    if (q.light > 0) { g.fillStyle = 'rgba(255,240,220,0.25)'; K.rr(g, 16, 36, 96, 7, 4); g.fill(); }
  });

  def('kimono', function (g, q) {
    // 挂起的和服（T 形）+ 腰带
    function shape() { P(g, 'M8 30 L42 18 L64 30 L86 18 L120 30 L118 62 L96 60 L98 118 L30 118 L32 60 L10 62 Z'); }
    drop(g, q, shape);
    shape(); cloth(g, q, '#4a5aa0', '#1e2650', 8, 18, 120, 118); ol(g, 2.6);
    g.save(); shape(); g.clip();
    // 樱花纹
    if (q.model > 0) {
      var r = K.rng(12);
      for (var i = 0; i < 12; i++) {
        var x = 14 + r() * 100, y = 30 + r() * 86;
        for (var p = 0; p < 5; p++) { var a = p / 5 * TAU; K.ellipse(g, x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6, 3, 2, a); g.fillStyle = 'rgba(255,200,220,0.75)'; g.fill(); }
      }
    }
    // 衣襟
    g.fillStyle = '#f4f0e8'; P(g, 'M52 24 L64 30 L76 24 L72 70 L64 76 L56 70 Z'); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(30, 60, 10, 58); g.fillRect(88, 60, 10, 58);
    g.restore();
    line(g, 64, 30, 60, 118, 1.6, 'rgba(0,0,0,0.4)');
    // 腰带
    g.beginPath(); g.rect(31, 70, 66, 16); g.fillStyle = lin(g, 0, 70, 0, 86, ['#f0c860', '#b08020', '#6a4a10']); g.fill(); ol(g, 2);
    if (q.model > 0) line(g, 31, 78, 97, 78, 1.4, '#c02838');
    // 衣架
    line(g, 4, 28, 124, 28, 4, OUT); line(g, 4, 28, 124, 28, 2, '#8a5a30');
  });

  def('ticket', function (g, q) {
    g.save(); g.translate(64, 64); g.rotate(-0.12);
    function shape() {
      g.beginPath(); g.moveTo(-54, -26); g.lineTo(54, -26); g.lineTo(54, -8); g.arc(54, 0, 8, -PI / 2, PI / 2, true); g.lineTo(54, 26); g.lineTo(-54, 26); g.lineTo(-54, 8); g.arc(-54, 0, 8, PI / 2, -PI / 2, true); g.closePath();
    }
    drop(g, q, shape);
    shape(); paper(g, q, -54, -26, 54, 26, '#f4ecd0', '#d8c898'); ol(g, 2.4);
    // 齿孔线
    g.setLineDash && g.setLineDash([3, 3]); line(g, 26, -24, 26, 24, 1.6, 'rgba(90,70,40,0.7)'); g.setLineDash && g.setLineDash([]);
    g.fillStyle = '#3a6a4a'; g.fillRect(-50, -22, 72, 9);
    K.text(g, '雪見→白川', -14, 0, 11, '#2a2018', { weight: 'bold' });
    if (q.model > 0) { g.fillStyle = 'rgba(40,30,20,0.6)'; g.fillRect(-46, 12, 40, 2.5); g.fillRect(-2, 12, 20, 2.5); K.text(g, '¥', 40, 0, 16, '#8a2a20', { weight: 'bold', font: 'Arial,sans-serif' }); }
    // 剪票孔
    circ(g, 6, -16, 3.5); g.fillStyle = '#5a5048'; g.fill();
    g.restore();
  });

  def('mill', function (g, q) {
    // 木制水车
    var cx = 62, cy = 62, r = 46;
    drop(g, q, function () { circ(g, cx, cy, r + 4); });
    circ(g, cx, cy, r); g.strokeStyle = OUT; g.lineWidth = 11; g.stroke(); circ(g, cx, cy, r); g.strokeStyle = lin(g, cx - r, cy - r, cx + r, cy + r, WOOD); g.lineWidth = 7; g.stroke();
    circ(g, cx, cy, r - 18); g.strokeStyle = OUT; g.lineWidth = 7; g.stroke(); circ(g, cx, cy, r - 18); g.strokeStyle = '#8a5a30'; g.lineWidth = 4; g.stroke();
    var n = q.model > 0 ? 12 : 8;
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU, ca = Math.cos(a), sa = Math.sin(a);
      line(g, cx + ca * 8, cy + sa * 8, cx + ca * (r - 2), cy + sa * (r - 2), 5, OUT); line(g, cx + ca * 8, cy + sa * 8, cx + ca * (r - 2), cy + sa * (r - 2), 2.8, '#a07040');
      // 水斗
      g.save(); g.translate(cx + ca * (r + 2), cy + sa * (r + 2)); g.rotate(a); g.fillStyle = lin(g, -4, 0, 6, 0, WOOD); g.fillRect(-5, -7, 10, 14); g.strokeStyle = OUT; g.lineWidth = 1.6; g.strokeRect(-5, -7, 10, 14); g.restore();
    }
    circ(g, cx, cy, 9); g.fillStyle = rad(g, cx - 3, cy - 3, 1, 10, ['#9a9ea8', '#3a3c44']); g.fill(); ol(g, 2);
    // 水流
    g.strokeStyle = 'rgba(120,170,220,0.85)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cx + 30, 4); g.quadraticCurveTo(cx + 44, 16, cx + 40, 30); g.stroke();
    g.beginPath(); g.moveTo(8, 118); g.quadraticCurveTo(40, 112, 64, 118); g.quadraticCurveTo(90, 124, 120, 116); g.stroke();
  });

  def('bridge', function (g, q) {
    // 吊桥（绳索 + 木板），一端的绳子快断了
    drop(g, q, function () { g.beginPath(); g.moveTo(8, 60); g.quadraticCurveTo(64, 96, 120, 60); g.lineTo(120, 70); g.quadraticCurveTo(64, 108, 8, 70); g.closePath(); });
    // 桥柱
    for (var s = 0; s < 2; s++) { var x = s ? 110 : 10; g.beginPath(); g.rect(x - 5, 30, 10, 50); wood(g, q, x - 5, 30, x + 5, 80, 'v'); ol(g, 2); }
    // 木板
    var n = q.model > 0 ? 14 : 9;
    for (var i = 0; i <= n; i++) {
      var t = i / n, x2 = 12 + t * 96, y = 66 + Math.sin(t * PI) * 26;
      g.save(); g.translate(x2, y); g.rotate((t - 0.5) * 0.8);
      g.fillStyle = lin(g, 0, -4, 0, 4, WOOD); g.fillRect(-4, -9, 8, 18); g.strokeStyle = OUT; g.lineWidth = 1.6; g.strokeRect(-4, -9, 8, 18);
      g.restore();
    }
    // 扶手绳
    function rope(y0, sag, broken) {
      g.beginPath(); g.moveTo(10, y0); g.quadraticCurveTo(64, y0 + sag, broken ? 96 : 110, broken ? y0 + sag * 0.55 : y0);
      g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#c8a870'; g.lineWidth = 2.6; g.stroke();
    }
    rope(34, 40, false); rope(40, 40, true);
    // 断开的绳头（磨损）
    g.strokeStyle = '#c8a870'; g.lineWidth = 1.5; for (var f = -2; f <= 2; f++) { g.beginPath(); g.moveTo(96, 62); g.lineTo(100 + f, 68 + Math.abs(f)); g.stroke(); }
    // 吊索
    if (q.model > 0) for (var k = 1; k < 6; k++) { var tk = k / 6, xk = 12 + tk * 96, yk = 66 + Math.sin(tk * PI) * 26 - 9, yr = 34 + Math.sin(tk * PI) * 20 * 0.98; line(g, xk, yr, xk, yk, 1.4, '#a88850'); }
  });

  def('pendant', function (g, q) {
    // 椭圆形金色吊坠盒 + 链子
    g.beginPath(); g.moveTo(30, 8); g.quadraticCurveTo(64, 50, 98, 8); g.strokeStyle = OUT; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#e0b860'; g.lineWidth = 2; g.stroke();
    if (q.model > 0) { g.setLineDash && g.setLineDash([2.5, 2.5]); g.strokeStyle = 'rgba(90,60,10,0.8)'; g.lineWidth = 1.2; g.stroke(); g.setLineDash && g.setLineDash([]); }
    circ(g, 64, 38, 6); g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#e0b860'; g.lineWidth = 2.6; g.stroke();
    drop(g, q, function () { K.ellipse(g, 64, 80, 32, 38); });
    K.ellipse(g, 64, 80, 32, 38); g.fillStyle = lin(g, 32, 42, 96, 118, GOLD); g.fill(); ol(g, 2.6);
    K.ellipse(g, 64, 80, 24, 30); g.strokeStyle = 'rgba(90,56,10,0.7)'; g.lineWidth = 2; g.stroke();
    // 浮雕花纹（鹭）
    if (q.model > 0) { g.strokeStyle = 'rgba(110,70,16,0.8)'; g.lineWidth = 2; P(g, 'M52 96 C56 80 64 72 72 66 C70 74 70 80 74 86 M64 74 C60 70 58 64 62 60'); g.stroke(); circ(g, 62, 60, 2.5); g.fillStyle = 'rgba(110,70,16,0.8)'; g.fill(); }
    if (q.light > 0) { g.fillStyle = 'rgba(255,255,230,0.65)'; K.ellipse(g, 50, 64, 6, 12, 0.4); g.fill(); }
    circ(g, 64, 44, 4.5); g.fillStyle = lin(g, 60, 40, 68, 48, GOLD); g.fill(); ol(g, 1.4);
  });

  def('medicine', function (g, q) {
    // 茶色药瓶 + 药包
    function bottle() { P(g, 'M50 30 L78 30 L78 40 C88 44 92 50 92 58 L92 110 C92 116 88 118 84 118 L44 118 C40 118 36 116 36 110 L36 58 C36 50 40 44 50 40 Z'); }
    drop(g, q, bottle);
    bottle(); g.fillStyle = lin(g, 36, 0, 92, 0, ['#8a4a1a', '#5a2a0a', '#2a1204']); g.fill(); ol(g, 2.6);
    // 盖
    K.rr(g, 46, 14, 36, 18, 3); g.fillStyle = lin(g, 0, 14, 0, 32, ['#f4f4f8', '#a8a8b4']); g.fill(); ol(g, 2);
    if (q.model > 0) for (var i = 0; i < 6; i++) line(g, 50 + i * 6, 16, 50 + i * 6, 30, 1, 'rgba(0,0,0,0.25)');
    // 标签（红十字）
    K.rr(g, 42, 64, 44, 36, 2); paper(g, q, 42, 64, 86, 100, '#ffffff', '#d8d4c8'); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = '#c81e30'; g.fillRect(59, 70, 10, 24); g.fillRect(52, 77, 24, 10);
    if (q.light > 0) { g.fillStyle = 'rgba(255,230,200,0.45)'; K.rr(g, 40, 52, 5, 56, 2.5); g.fill(); }
    // 药包
    g.save(); g.translate(96, 104); g.rotate(0.3);
    drop(g, q, function () { K.poly(g, [-16, -14, 16, -14, 18, 14, -18, 14]); }, 4);
    K.poly(g, [-16, -14, 16, -14, 18, 14, -18, 14]); paper(g, q, -18, -14, 18, 14, '#ffffff', '#e0dccc'); ol(g, 2);
    line(g, -16, -14, 0, 0, 1, 'rgba(0,0,0,0.3)'); line(g, 16, -14, 0, 0, 1, 'rgba(0,0,0,0.3)');
    g.restore();
  });

  def('glove', function (g, q) {
    function shape() { P(g, 'M40 118 L38 80 C30 74 22 64 18 56 C14 48 22 44 28 50 L38 62 L36 26 C36 18 46 18 46 26 L48 54 L50 18 C50 10 60 10 60 18 L60 52 L64 22 C64 14 74 14 74 22 L72 56 L78 34 C80 26 90 28 88 36 L84 76 C82 90 82 104 84 118 Z'); }
    drop(g, q, shape);
    shape(); g.fillStyle = lin(g, 18, 10, 90, 118, ['#6a4a3a', '#3a2418', '#1a0e08']); g.fill(); ol(g, 2.6);
    // 指缝与缝线
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; P(g, 'M48 54 L48 74 M60 52 L60 74 M72 56 L70 74'); g.stroke();
    if (q.model > 0) { g.setLineDash && g.setLineDash([3, 3]); g.strokeStyle = 'rgba(200,170,130,0.55)'; g.lineWidth = 1.2; P(g, 'M42 112 L42 84 M80 112 L80 84 M44 90 C54 94 68 94 80 90'); g.stroke(); g.setLineDash && g.setLineDash([]); }
    // 袖口
    g.beginPath(); g.rect(38, 106, 48, 14); g.fillStyle = lin(g, 0, 106, 0, 120, ['#4a3020', '#1a0e08']); g.fill(); ol(g, 2);
    if (q.light > 0) { g.fillStyle = 'rgba(255,230,210,0.3)'; K.ellipse(g, 40, 36, 2.5, 10, 0); g.fill(); K.ellipse(g, 53, 30, 2.5, 10, 0); g.fill(); K.ellipse(g, 66, 34, 2.5, 9, 0); g.fill(); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
