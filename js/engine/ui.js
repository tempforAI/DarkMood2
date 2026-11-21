/* DOM 界面层：对话框（打字机效果）、选项、字幕、全屏卡片、大字冲击、证据提示、输入 */
(function () {
  'use strict';
  var DM = window.DM, Core = DM.Core, St = DM.State;
  var UI = DM.UI = {};
  var el = Core.el;

  var root, dlg, dlgName, dlgText, dlgShown, dlgRest, quick, captionEl, choicesEl, toastEl, shoutEl, flashEl, fadeEl, cardEl, loadingEl;
  UI.layers = {};

  UI.init = function () {
    root = document.getElementById('ui');
    // 顺序决定层级
    UI.layers.explore = el('div', 'layer hidden', root); UI.layers.explore.id = 'explore';
    captionEl = el('div', 'hidden', root); captionEl.id = 'caption';
    dlg = el('div', 'hidden', root); dlg.id = 'dlg';
    var box = el('div', 'box', dlg);
    dlgName = el('div', 'name', box);
    dlgText = el('div', 'text', box);
    dlgShown = el('span', '', dlgText); dlgRest = el('span', 'rest', dlgText);
    el('div', 'next', box);
    quick = el('div', 'hidden', root); quick.id = 'quick';
    choicesEl = el('div', 'hidden', root); choicesEl.id = 'choices';
    UI.layers.game = el('div', 'layer hidden', root); UI.layers.game.id = 'game';
    toastEl = el('div', '', root); toastEl.id = 'toast';
    shoutEl = el('div', '', root); shoutEl.id = 'shout';
    fadeEl = el('div', '', root); fadeEl.id = 'fade';      // 黑场在卡片之下：淡出后标题卡/结束卡仍然可见
    cardEl = el('div', 'layer hidden', root);
    UI.layers.title = el('div', 'layer hidden', root); UI.layers.title.id = 'title';
    UI.layers.menu = el('div', 'layer hidden', root);
    flashEl = el('div', '', root); flashEl.id = 'flash';
    loadingEl = el('div', 'hidden', root); loadingEl.id = 'loading'; loadingEl.textContent = '读取中';

    buildQuick();

    // 移动端：触屏标记、竖屏提示、音频解锁
    document.body.classList.toggle('touch', !!St.device.touch);
    document.body.classList.toggle('mobile', !!St.device.mobile);
    rotateEl = el('div', 'hidden', document.body); rotateEl.id = 'rotate';
    el('div', 'ic', rotateEl, '⟳');
    el('div', 'tx', rotateEl, '请将设备横过来游玩');
    var goOn = el('button', 'btn small', rotateEl, '仍然继续');
    goOn.addEventListener('click', function (e) { e.stopPropagation(); rotateDismissed = true; UI.onResize(); });
    var unlock = function () { DM.Audio.init(); };
    document.addEventListener('touchend', unlock, { passive: true });
    UI.applyTextSize();
    UI.onResize();

    // 点击推进
    root.addEventListener('click', function (e) {
      DM.Audio.init();
      if (e.target.closest('button, .btn, .weakpt, .spot, .person, .panel, input, .g-panel, .ammo, .stmt-nav')) return;
      if (UI.modalOpen()) return;
      UI.advance();
    });
    root.addEventListener('contextmenu', function (e) { e.preventDefault(); if (!UI.modalOpen() && DM.Menus) DM.Menus.openSystem(); });
    window.addEventListener('keydown', function (e) {
      DM.Audio.init();
      if (e.key === 'Control') { UI.ctrlSkip = true; return; }
      if (DM.Games && DM.Games.onKey && DM.Games.onKey(e)) { e.preventDefault(); return; }
      if (UI.modalOpen()) { if (e.key === 'Escape' && DM.Menus) DM.Menus.closeTop(); return; }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); UI.advance(); }
      else if (e.key === 'Escape') { if (DM.Menus && (dlgActive || exploreActive())) DM.Menus.openSystem(); }
      else if (e.key === 'a' || e.key === 'A') UI.toggleAuto();
      else if (e.key === 'l' || e.key === 'L') { if (DM.Menus && dlgActive) DM.Menus.openLog(); }
    });
    window.addEventListener('keyup', function (e) { if (e.key === 'Control') UI.ctrlSkip = false; });
    window.addEventListener('blur', function () { UI.ctrlSkip = false; });
  };
  function exploreActive() { return !UI.layers.explore.classList.contains('hidden'); }

  var rotateEl = null, rotateDismissed = false;
  UI.onResize = function () {
    if (!rotateEl) return;
    var vp = Core.viewport();
    var portrait = St.device.touch && vp.h > vp.w * 1.05;
    rotateEl.classList.toggle('hidden', !portrait || rotateDismissed);
  };
  UI.applyTextSize = function () {
    var z = St.settings.textSize;
    document.body.classList.remove('ts0', 'ts1', 'ts2');
    document.body.classList.add('ts' + (z == null ? 1 : z));
  };

  UI.modalOpen = function () { return !UI.layers.menu.classList.contains('hidden') || !UI.layers.title.classList.contains('hidden'); };

  // ---------- 快捷按钮 ----------
  var autoBtn, skipBtn;
  function buildQuick() {
    function b(label, fn) { var x = el('button', 'btn small', quick, label); x.addEventListener('click', function (e) { e.stopPropagation(); DM.Audio.se('select'); fn(); }); return x; }
    b('记录', function () { DM.Menus.openLog(); });
    autoBtn = b('自动', function () { UI.toggleAuto(); });
    skipBtn = b('快进', function () { UI.toggleSkip(); });
    b('手账', function () { DM.Menus.openNotebook(); });
    b('存档', function () { DM.Menus.openSave(); });
    b('读档', function () { DM.Menus.openLoad(); });
    b('设置', function () { DM.Menus.openSettings(); });
    b('菜单', function () { DM.Menus.openSystem(); });
  }
  UI.mode = 'normal';
  UI.toggleAuto = function () { UI.mode = UI.mode === 'auto' ? 'normal' : 'auto'; syncQuick(); if (UI.mode === 'auto' && waiting && !typing) scheduleAuto(); };
  UI.toggleSkip = function () { UI.mode = UI.mode === 'skip' ? 'normal' : 'skip'; syncQuick(); if (UI.mode === 'skip') UI.advance(); };
  UI.stopSkip = function () { if (UI.mode === 'skip') { UI.mode = 'normal'; syncQuick(); } UI.ctrlSkip = false; };
  function syncQuick() { autoBtn.classList.toggle('on', UI.mode === 'auto'); skipBtn.classList.toggle('on', UI.mode === 'skip'); }
  function skipping() { return UI.mode === 'skip' || UI.ctrlSkip; }
  UI.skipping = skipping;

  // ---------- 对话 ----------
  var dlgActive = false, typing = false, waiting = false, resolveFn = null;
  var full = '', shownN = 0, startT = 0, cps = 40, blipSeed = 0, autoTimer = null;
  UI.log = [];

  UI.showDialog = function (on) {
    dlg.classList.toggle('hidden', !on);
    quick.classList.toggle('hidden', !on);
    dlgActive = on;
  };

  UI.say = function (o) {
    // o: {kind:'say'|'narr'|'think', who, name, text}
    UI.showDialog(true);
    dlg.className = o.kind === 'say' ? '' : o.kind;
    if (o.kind === 'say') {
      dlgName.style.display = '';
      dlgName.textContent = o.name;
      dlgName.style.color = Core.charColor(o.who);
    } else dlgName.style.display = 'none';
    full = o.kind === 'think' ? '（' + o.text + '）' : o.text;
    shownN = 0; startT = performance.now();
    cps = [22, 40, 75, 100000][St.settings.textSpeed] || 40;
    blipSeed = o.who ? Core.hash(o.who) : 0;
    blipOn = o.kind === 'say';
    dlgShown.textContent = ''; dlgRest.textContent = full;
    dlg.classList.remove('done');
    typing = true; waiting = true;
    UI.log.push({ kind: o.kind, name: o.kind === 'say' ? o.name : '', text: full, who: o.who });
    if (UI.log.length > 300) UI.log.shift();
    if (skipping()) finishTyping();
    return new Promise(function (res) { resolveFn = res; });
  };
  var blipOn = false;

  function finishTyping() {
    typing = false; shownN = full.length;
    dlgShown.textContent = full; dlgRest.textContent = '';
    dlg.classList.add('done');
    if (skipping()) { clearTimeout(autoTimer); autoTimer = setTimeout(function () { if (skipping()) UI.advance(); }, 45); }
    else if (UI.mode === 'auto') scheduleAuto();
  }
  function scheduleAuto() {
    clearTimeout(autoTimer);
    var base = [700, 1300, 2200][St.settings.autoDelay] || 1300;
    autoTimer = setTimeout(function () { if (UI.mode === 'auto' && waiting && !typing && !UI.modalOpen()) UI.advance(); }, base + full.length * 45);
  }

  UI.tick = function (now) {
    if (typing) {
      var n = Math.min(full.length, Math.floor((now - startT) / 1000 * cps));
      if (n !== shownN) {
        if (blipOn && n > shownN && full.charAt(n - 1) !== ' ') DM.Audio.blip(blipSeed);
        shownN = n;
        dlgShown.textContent = full.slice(0, n); dlgRest.textContent = full.slice(n);
        if (n >= full.length) finishTyping();
      }
    }
    if (skipping() && waiting && !typing && !UI.modalOpen() && resolveFn && !autoTimer) {
      autoTimer = setTimeout(function () { autoTimer = null; if (skipping()) UI.advance(); }, 45);
    }
    if (pendingClick && !UI.modalOpen()) { var f = pendingClick; pendingClick = null; f(); }
  };
  var pendingClick = null;

  UI.advance = function () {
    if (cardResolve) { var c = cardResolve; cardResolve = null; c(); return; }
    if (!waiting) return;
    if (typing) { finishTyping(); return; }
    waiting = false;
    clearTimeout(autoTimer); autoTimer = null;
    var r = resolveFn; resolveFn = null;
    DM.Audio.se('select');
    if (r) r();
  };
  UI.isWaiting = function () { return waiting; };
  // 空闲（没有在打字、没有卡片动画）——渲染器借此在空闲时预生成高清美术
  UI.idle = function () { return !typing && !cardResolve; };

  // ---------- 选项 ----------
  UI.choice = function (options) {
    UI.stopSkip();
    Core.clear(choicesEl);
    choicesEl.classList.remove('hidden');
    return new Promise(function (res) {
      options.forEach(function (op, i) {
        var b = el('button', 'btn', choicesEl, '▶ ' + op.text);
        b.addEventListener('click', function (e) {
          e.stopPropagation(); DM.Audio.se('ok');
          choicesEl.classList.add('hidden'); Core.clear(choicesEl);
          UI.log.push({ kind: 'narr', name: '', text: '→ ' + op.text });
          res(i);
        });
      });
    });
  };

  // ---------- 字幕 ----------
  UI.caption = function (text) {
    captionEl.textContent = text || '';
    captionEl.classList.toggle('hidden', !text);
  };

  // ---------- 全屏卡片 ----------
  var cardResolve = null;
  function showCard(node, autoMs) {
    Core.clear(cardEl); cardEl.appendChild(node); cardEl.classList.remove('hidden');
    UI.showDialog(false);
    return new Promise(function (res) {
      var done = false;
      function fin() { if (done) return; done = true; cardResolve = null; cardEl.classList.add('hidden'); Core.clear(cardEl); res(); }
      cardResolve = fin;
      if (autoMs) setTimeout(fin, skipping() ? 300 : autoMs);
    });
  }
  UI.titleCard = function (text) {
    var p = (text || '').split('|');
    var n = el('div', 'card-full titlecard');
    el('div', 'ch', n, p[0] || '');
    el('div', 'nm', n, p[1] || '');
    el('div', 'bar', n);
    DM.Audio.se('bell');
    return showCard(n, 3600);
  };
  UI.poem = function (text) {
    var n = el('div', 'card-full poem');
    el('div', 'tx', n, text);
    el('div', 'tapnote', n, '点击继续');
    return showCard(n, 0);
  };
  UI.letter = function (text) {
    var n = el('div', 'card-full letter');
    el('div', 'paper', n, text);
    el('div', 'tapnote', n, '点击继续');
    UI.log.push({ kind: 'narr', name: '', text: '【信】' + text });
    return showCard(n, 0);
  };
  // 结局卡：BAD END / HAPPY END / TRUE END
  UI.endingCard = function (en) {
    var cls = en.type === 'HE' ? (en.trueEnd ? 'te' : 'he') : 'be';
    var n = el('div', 'card-full ending ' + cls);
    el('div', 'kind', n, en.type === 'HE' ? (en.trueEnd ? 'TRUE END' : 'HAPPY END') : 'BAD END');
    if (en.no) el('div', 'no', n, 'No.' + en.no);
    el('div', 'nm', n, en.title || '');
    if (en.desc) el('div', 'ds', n, en.desc);
    el('div', 'tapnote', n, '点击继续');
    DM.Audio.se(en.type === 'HE' ? 'bell' : 'heartbeat');
    UI.log.push({ kind: 'narr', name: '', text: '【' + (en.type === 'HE' ? 'END' : 'BAD END') + '】' + (en.title || '') });
    return showCard(n, 0);
  };
  UI.endCard = function (text) {
    var n = el('div', 'card-full titlecard');
    el('div', 'nm', n, text);
    return showCard(n, 2600);
  };

  // ---------- 冲击 / 闪屏 / 淡入淡出 / 震动 ----------
  UI.shout = function (text) {
    Core.clear(shoutEl);
    el('div', 'bg', shoutEl);
    el('div', 's', shoutEl, text);
    DM.Audio.se('shout');
    return Core.wait(skipping() ? 200 : 950).then(function () { Core.clear(shoutEl); });
  };
  UI.flash = function (color) {
    flashEl.style.background = color === 'red' ? '#d0102a' : color === 'black' ? '#000' : '#fff';
    flashEl.classList.remove('go'); void flashEl.offsetWidth; flashEl.classList.add('go');
  };
  UI.fade = function (out) {
    fadeEl.classList.toggle('on', !!out);
    return Core.wait(skipping() ? 60 : 520);
  };
  UI.shake = function () {
    if (!St.settings.shake) return;
    var c = document.getElementById('screen');
    c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
  };

  // ---------- 证据获得 ----------
  UI.toast = function (title, name, icon) {
    var card = el('div', 'toast-card', toastEl);
    var cv = Core.canvasFrom(Core.art.icon(icon));
    card.appendChild(cv);
    var tx = el('div', '', card);
    el('div', 't1', tx, title);
    el('div', 't2', tx, name);
    setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, 2700);
  };

  UI.loading = function (on) { loadingEl.classList.toggle('hidden', !on); };

  UI.resetAll = function () {
    UI.showDialog(false); UI.caption(''); choicesEl.classList.add('hidden'); Core.clear(choicesEl);
    cardEl.classList.add('hidden'); Core.clear(cardEl); cardResolve = null;
    waiting = false; typing = false; resolveFn = null; clearTimeout(autoTimer); autoTimer = null;
    UI.layers.game.classList.add('hidden'); Core.clear(UI.layers.game);
    UI.layers.explore.classList.add('hidden'); Core.clear(UI.layers.explore);
    fadeEl.classList.remove('on'); Core.clear(shoutEl);
    UI.mode = 'normal'; syncQuick();
  };
})();
