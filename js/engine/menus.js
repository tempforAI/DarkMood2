/* 菜单：标题画面、系统菜单、存读档、设置（含画质）、侦探手账、对话记录、章节选择、结局一览、片尾 */
(function () {
  'use strict';
  var DM = window.DM, Core = DM.Core, St = DM.State, R = DM.Render, UI = DM.UI, I = DM.Interp, GM = DM.GAME;
  var el = Core.el;
  var M = DM.Menus = {};
  var stack = [];

  function layer() { return UI.layers.menu; }
  function panel(title, cls) {
    var L = layer(); L.classList.remove('hidden');
    var p = el('div', 'panel' + (cls ? ' ' + cls : ''), L);
    p.addEventListener('click', function (e) { e.stopPropagation(); });
    var hd = el('div', 'hd', p);
    el('h2', '', hd, title);
    var tools = el('div', 'tabs', hd);
    el('div', 'sp', hd);
    var x = el('button', 'btn small', hd, '关闭 ✕');
    x.addEventListener('click', function () { DM.Audio.se('select'); M.closeTop(); });
    var bd = el('div', 'bd', p);
    stack.push(p);
    return { p: p, hd: hd, tools: tools, bd: bd };
  }
  M.closeTop = function () {
    var p = stack.pop();
    if (p && p.parentNode) p.parentNode.removeChild(p);
    if (!stack.length) layer().classList.add('hidden');
  };
  M.closeAll = function () { while (stack.length) M.closeTop(); };

  // ---------- 系统菜单 ----------
  M.openSystem = function () {
    if (!St.s) return;
    var P = panel('菜单', 'narrow');
    var box = el('div', 'menu-col', P.bd);
    [['存档', M.openSave], ['读档', M.openLoad], ['侦探手账', M.openNotebook], ['对话记录', M.openLog], ['设置', M.openSettings],
     ['回到标题', function () { confirmBox('回到标题画面？未保存的进度会丢失（自动存档仍在）。', M.toTitle); }]].forEach(function (it) {
      var b = el('button', 'btn', box, it[0]);
      b.addEventListener('click', function () { DM.Audio.se('select'); it[1](); });
    });
  };

  function confirmBox(text, yes) {
    var P = panel('确认', 'confirm');
    el('p', '', P.bd, text).style.fontSize = '19px';
    var f = el('div', 'g-foot', P.bd);
    var y = el('button', 'btn gold', f, '确定');
    var n = el('button', 'btn', f, '取消');
    y.addEventListener('click', function () { M.closeTop(); yes(); });
    n.addEventListener('click', function () { M.closeTop(); });
  }
  M.confirm = confirmBox;

  // ---------- 存读档 ----------
  function slotInfo(d) {
    if (!d) return null;
    var m = d.meta || {};
    return (St.CHAPTER_NAMES[m.chapter] || m.chapter || '') + (m.place ? '　' + m.place : '') + (m.caption ? '　' + m.caption : '');
  }
  M.openSave = function () {
    if (!I.resume || !St.s) return;
    var P = panel('存档');
    saveLocationBar(P);
    var list = el('div', 'save-list', P.bd);
    for (var i = 1; i <= St.SLOTS; i++) (function (i) {
      var d = St.read(i);
      var row = el('div', 'save-slot' + (d ? '' : ' empty'), list);
      el('div', 'no', row, 'No.' + i);
      var info = el('div', 'info', row);
      el('div', '', info, d ? slotInfo(d) : '—— 空 ——');
      if (d) el('div', 's', info, St.fmtTime(d.time) + '　游戏时间 ' + St.fmtPlay(d.s.playMs || 0));
      row.addEventListener('click', function () {
        function doSave() {
          St.s.scene.stage = R.stageSnapshot();
          var ok = St.write(i, St.snapshot(I.resume, { chapter: St.s.chapter, caption: St.s.scene.caption, place: DM.Explore.placeName() }));
          DM.Audio.se(ok ? 'ok' : 'ng');
          M.closeTop(); if (ok) M.openSave();
        }
        if (d) confirmBox('覆盖 No.' + i + ' 的存档？', doSave); else doSave();
      });
    })(i);
  };
  function loadSnap(d) {
    DM.Audio.se('ok');
    M.closeAll();
    UI.layers.title.classList.add('hidden');
    I.loadSnapshot(d).catch(function (e) { console.error(e); alert('读档失败：' + e.message); M.toTitle(); });
  }
  function saveLocationBar(P) {
    var bar = el('div', 'save-loc', P.bd);
    el('span', '', bar, '存档位置：' + DM.Storage.describe());
    var b = el('button', 'btn small', bar, '更改…');
    b.addEventListener('click', function (e) { e.stopPropagation(); DM.Audio.se('select'); M.openSettings('save'); });
  }
  M.openLoad = function () {
    var P = panel('读档');
    saveLocationBar(P);
    var list = el('div', 'save-list', P.bd);
    ['auto', 'cp'].concat([1, 2, 3, 4, 5, 6, 7, 8, 9]).forEach(function (k) {
      var d = St.read(k);
      if (k === 'cp' && !d) return;
      var row = el('div', 'save-slot' + (d ? '' : ' empty'), list);
      el('div', 'no', row, k === 'auto' ? '自动' : k === 'cp' ? '分歧点' : 'No.' + k);
      var info = el('div', 'info', row);
      el('div', '', info, d ? slotInfo(d) : '—— 空 ——');
      if (d) el('div', 's', info, St.fmtTime(d.time) + '　游戏时间 ' + St.fmtPlay(d.s.playMs || 0));
      if (d) row.addEventListener('click', function () { loadSnap(d); });
    });
  };

  // ---------- 设置 ----------
  var setTab = 'gfx';
  M.openSettings = function (tab) {
    var P = panel('设置', 'settings');
    var tabs = {};
    [['gfx', '画面'], ['text', '文字与声音'], ['save', '存档'], ['ctrl', '操作']].forEach(function (t) {
      var b = el('button', 'btn small', P.tools, t[1]);
      b.addEventListener('click', function () { DM.Audio.se('select'); show(t[0]); });
      tabs[t[0]] = b;
    });
    function show(kk) {
      setTab = kk;
      Object.keys(tabs).forEach(function (x) { tabs[x].classList.toggle('on', x === kk); });
      Core.clear(P.bd);
      if (kk === 'gfx') gfxSettings(P.bd); else if (kk === 'text') textSettings(P.bd); else if (kk === 'save') saveSettings(P.bd, function () { show('save'); }); else ctrlSettings(P.bd);
    }
    show(tab || setTab);
  };
  function row(bd, label, note) {
    var r = el('div', 'set-row', bd);
    var l = el('label', '', r, label);
    if (note) el('small', '', l, note);
    return el('div', 'opts', r);
  }
  function opts(bd, label, key, values, onChange, note) {
    var S = St.settings, o = row(bd, label, note);
    values.forEach(function (v) {
      var b = el('button', 'btn small' + (S[key] === v[0] ? ' on' : ''), o, v[1]);
      b.addEventListener('click', function () {
        S[key] = v[0]; St.saveSettings(); DM.Audio.se('select');
        Array.prototype.forEach.call(o.children, function (x) { x.classList.remove('on'); }); b.classList.add('on');
        if (onChange) onChange(v[0]);
      });
    });
    return o;
  }
  function slider(bd, label, key) {
    var S = St.settings, o = row(bd, label);
    var r = el('input', '', o); r.type = 'range'; r.min = 0; r.max = 100; r.value = Math.round(S[key] * 100);
    r.addEventListener('input', function () { S[key] = r.value / 100; DM.Audio.setVolume(key, S[key]); });
    r.addEventListener('change', function () { St.saveSettings(); DM.Audio.se('select'); });
  }

  // 应用画质：必要时加载另一套美术，然后重建渲染
  var applyT = null;
  M.applyGfx = function (styleChanged) {
    clearTimeout(applyT);
    applyT = setTimeout(function () {
      UI.loading(true);
      var p = styleChanged ? Core.loadArt(St.settings.style) : Promise.resolve();
      p.then(Core.frame).then(Core.frame).then(function () {
        R.configure();
        UI.loading(false);
        var info = document.getElementById('gfx-info'); if (info) info.textContent = gfxInfo();
      });
    }, 120);
  };
  function gfxInfo() {
    var sz = R.size(), hd = St.settings.style !== 'pixel';
    return '当前输出：' + sz.w + '×' + sz.h + (hd && DM.HDArt ? '　美术缓存 ' + DM.HDArt.usedMB().toFixed(0) + 'MB' : '') +
      '　推荐预设：' + PRESET_NAMES[St.recommend()];
  }
  var PRESET_NAMES = { low: '低', medium: '中', high: '高', ultra: '极高', custom: '自定义' };
  function gfxSettings(bd) {
    var S = St.settings;
    var info = el('div', 'gfx-info', bd, gfxInfo()); info.id = 'gfx-info';
    if (DM.PX_FILES && DM.PX_FILES.length) opts(bd, '画风', 'style', [['hd', '高清'], ['pixel', '经典像素']], function () { M.applyGfx(true); refresh(); }, '经典像素：最省电，适合很老的设备');
    if (S.style === 'pixel') { el('p', 'set-tip', bd, '经典像素画风使用原版 480×270 像素美术，以下画质选项不生效。'); return; }
    var pr = row(bd, '画质预设', '低＝老设备/省电');
    ['low', 'medium', 'high', 'ultra', 'custom'].forEach(function (name) {
      var b = el('button', 'btn small' + (S.preset === name ? ' on' : ''), pr, PRESET_NAMES[name]);
      b.addEventListener('click', function () {
        DM.Audio.se('select');
        if (name === 'custom') S.preset = 'custom'; else St.applyPreset(name);
        St.saveSettings(); M.applyGfx(false); refresh();
      });
    });
    function custom() { S.preset = 'custom'; St.saveSettings(); M.applyGfx(false); refresh(); }
    var resVals = [['auto', '自动'], [540, '540p'], [720, '720p'], [1080, '1080p'], [1440, '2K'], [2160, '4K']];
    opts(bd, '分辨率', 'res', resVals, custom, '自动＝匹配屏幕');
    opts(bd, '模型精度', 'model', [[0, '低'], [1, '中'], [2, '高']], custom, '人物与场景的几何细节');
    opts(bd, '材质质量', 'tex', [[0, '低'], [1, '中'], [2, '高']], custom, '木纹、石材、布料等纹理');
    opts(bd, '光影质量', 'light', [[0, '关'], [1, '简单'], [2, '完整']], custom, '阴影、光晕、动态烛光');
    opts(bd, '后期效果', 'post', [[0, '关'], [1, '暗角'], [2, '电影感']], custom, '泛光与胶片颗粒');
    opts(bd, '角色环境光', 'charLight', [[true, '开'], [false, '关']], custom, '人物受场景光照与轮廓光');
    opts(bd, '天气粒子', 'particles', [[0, '少'], [1, '中'], [2, '多']], custom);
    opts(bd, '帧率上限', 'fps', [[30, '30'], [60, '60']], custom);
    function refresh() { setTimeout(function () { M.closeTop(); M.openSettings('gfx'); }, 0); }
  }
  function textSettings(bd) {
    opts(bd, '文字速度', 'textSpeed', [[0, '慢'], [1, '中'], [2, '快'], [3, '瞬间']]);
    opts(bd, '文字大小', 'textSize', [[0, '小'], [1, '中'], [2, '大']], function () { UI.applyTextSize(); });
    opts(bd, '自动播放间隔', 'autoDelay', [[0, '短'], [1, '中'], [2, '长']]);
    slider(bd, '音乐音量', 'bgm');
    slider(bd, '音效音量', 'se');
  }
  // 存档位置：云盘 / 外置硬盘文件夹（Chrome、Edge），或导出 / 导入存档文件（所有浏览器）
  function saveSettings(bd, refresh) {
    var SG = DM.Storage;
    var info = el('div', 'gfx-info', bd, '当前存档位置：' + SG.describe());
    if (SG.lastSync && SG.state === 'connected') info.textContent += '　上次同步 ' + St.fmtTime(SG.lastSync);
    function act(btnRow, label, fn, cls) {
      var b = el('button', 'btn small' + (cls ? ' ' + cls : ''), btnRow, label);
      b.addEventListener('click', function (e) {
        e.stopPropagation(); DM.Audio.se('select');
        var r = fn(); if (r && r.then) r.then(function (msg) { if (msg) UI.toast('存档', msg, 'note'); refresh(); }, function (err) {
          if (err && err.name === 'AbortError') return;      // 玩家取消了选择
          UI.toast('存档', (err && err.message) || '操作失败', 'note'); refresh();
        });
      });
      return b;
    }
    var r1 = row(bd, '存档文件夹', '例如 OneDrive / Dropbox 里的文件夹，或外置硬盘');
    if (SG.fsSupported) {
      act(r1, SG.state === 'local' ? '选择文件夹…' : '更换文件夹…', function () {
        return SG.choose().then(function (n) { return '已连接「' + SG.rootName + '」' + (n ? '，取回了 ' + n + ' 项较新的存档' : ''); });
      }, SG.state === 'local' ? 'gold' : '');
      if (SG.state === 'needs-permission') act(r1, '重新授权「' + SG.rootName + '」', function () {
        return SG.reconnect().then(function () { return '已重新连接'; });
      }, 'gold');
      if (SG.state === 'connected') act(r1, '立即同步', function () { return SG.sync().then(function (n) { return n ? '已取回 ' + n + ' 项较新的存档' : '已同步'; }); });
      if (SG.state !== 'local') act(r1, '断开', function () { return SG.disconnect().then(function () { return '已改回浏览器本地存档（文件夹里的存档文件不会被删除）'; }); });
    } else {
      el('span', 'set-note', r1, '当前浏览器不支持直接读写文件夹（需要电脑版 Chrome 或 Edge）。请使用下面的导出 / 导入。');
    }
    var r2 = row(bd, '存档文件', '所有浏览器都可用，适合手机或临时搬运');
    act(r2, '导出存档文件', function () { var n = SG.exportFile(); return Promise.resolve('已导出 ' + n); });
    var inp = el('input', '', bd); inp.type = 'file'; inp.accept = '.dmsave,.json'; inp.style.display = 'none';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      SG.importFile(f).then(function (r) {
        UI.toast('存档', '导入完成：采用 ' + r.taken + ' 个较新的存档' + (r.kept ? '，保留 ' + r.kept + ' 个本地较新的存档' : ''), 'note'); refresh();
      }, function (err) { UI.toast('存档', (err && err.message) || '导入失败', 'note'); });
      inp.value = '';
    });
    act(r2, '导入存档文件…', function () { inp.click(); });
    var tip = el('p', 'set-tip', bd);
    tip.textContent = SG.fsSupported ?
      '怎样换电脑继续玩：\n① 在这台电脑上点「选择文件夹…」，选 OneDrive（或其他云盘、外置硬盘）里的一个文件夹，例如「OneDrive/游戏存档」。\n' +
      '② 之后的存档、自动存档、结局记录都会自动写进其中的「' + (GM.saveFolder || GM.id) + '」子文件夹。\n' +
      '③ 在另一台电脑上用 Chrome / Edge 打开游戏，同样选择这个文件夹，存档就会出现在「读档」里。\n' +
      '两台电脑上的同一个存档位以较新的为准；切回游戏窗口时会自动重新同步。画质设置不会同步。' :
      '怎样换设备继续玩：点「导出存档文件」，把下载的 .dmsave 文件放进云盘；在另一台设备上点「导入存档文件…」选中它即可。\n' +
      '导入时每个存档位以较新的为准，不会覆盖更新的本地存档。';
  }

  function ctrlSettings(bd) {
    opts(bd, '审判难度', 'difficulty', [['easy', '轻松（答错1次即提示）'], ['normal', '标准']]);
    opts(bd, '画面震动', 'shake', [[true, '开'], [false, '关']]);
    if (fsSupported()) {
      var o = row(bd, '全屏');
      var b = el('button', 'btn small', o, isFs() ? '退出全屏' : '进入全屏');
      b.addEventListener('click', function () { toggleFs(); setTimeout(function () { b.textContent = isFs() ? '退出全屏' : '进入全屏'; }, 300); });
    }
    var tip = el('p', 'set-tip', bd);
    tip.textContent = St.device.touch ?
      '操作：点击画面推进对话　点「菜单」打开菜单　点「快进」「自动」切换模式。\n审判中：先点选证据，再点发言中的橙色字句；◀ ▶ 切换发言。\n审判没有失败，答错只会扣除「' + GM.hpName + '」并获得提示；但关键时刻的选择会改变结局。' :
      '操作：点击 / 空格 / 回车 推进对话　按住 Ctrl 快进　A 自动　L 记录　Esc 或右键 打开菜单。\n审判中：数字键选择证据，←→ 切换发言。审判没有失败，答错只会扣除「' + GM.hpName + '」并获得提示；但关键时刻的选择会改变结局。';
  }
  function fsSupported() { var d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen); }
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function toggleFs() {
    try {
      if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { var d = document.documentElement; var r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d); if (r && r.then) r.then(lockLandscape, function () {}); else lockLandscape(); }
    } catch (e) { /* ignore */ }
  }
  function lockLandscape() { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* ignore */ } }
  M.toggleFullscreen = toggleFs;

  // ---------- 对话记录 ----------
  M.openLog = function () {
    var P = panel('对话记录');
    UI.log.slice(-200).forEach(function (l) {
      var it = el('div', 'log-item' + (l.kind === 'think' ? ' think' : ''), P.bd);
      if (l.name) { var w = el('span', 'who', it, l.name); if (l.who) w.style.color = Core.charColor(l.who); }
      it.appendChild(document.createTextNode(l.text));
    });
    setTimeout(function () { P.bd.scrollTop = P.bd.scrollHeight; }, 0);
  };

  // ---------- 侦探手账 ----------
  M.openNotebook = function (tab) {
    if (!St.s) return;
    var P = panel('侦探手账');
    var tabs = {};
    [['ev', '证据'], ['ch', '人物'], ['ru', '规则与歌谣']].forEach(function (t) {
      var b = el('button', 'btn small', P.tools, t[1]);
      b.addEventListener('click', function () { DM.Audio.se('select'); show(t[0]); });
      tabs[t[0]] = b;
    });
    function show(kk) {
      Object.keys(tabs).forEach(function (x) { tabs[x].classList.toggle('on', x === kk); });
      Core.clear(P.bd);
      if (kk === 'ev') evidence(P.bd); else if (kk === 'ch') chars(P.bd); else rules(P.bd);
    }
    show(tab || 'ev');
  };
  function evidence(bd) {
    var wrap = el('div', 'ev-wrap', bd);
    var list = el('div', 'ev-list', wrap), det = el('div', 'ev-detail', wrap);
    var order = St.CHAPTER_ORDER.slice().reverse();
    var cur = St.s.chapter, first = null, rows = [];
    order.forEach(function (ch) {
      var def = DM.chapters[ch]; if (!def || !def.evidence) return;
      var ids = Object.keys(def.evidence).filter(St.hasEv);
      if (!ids.length) return;
      var h = el('div', 'ev-ch' + (ch === cur ? ' cur' : ''), list, St.CHAPTER_NAMES[ch] || ch);
      void h;
      ids.forEach(function (id) {
        var ev = def.evidence[id];
        var r = el('div', 'ev-item', list);
        r.appendChild(Core.canvasFrom(Core.art.icon(ev.icon)));
        el('span', 'nm', r, ev.name);
        function sel() {
          rows.forEach(function (x) { x.classList.toggle('sel', x === r); });
          Core.clear(det);
          det.appendChild(Core.canvasFrom(Core.art.icon(ev.icon)));
          el('h3', '', det, ev.name);
          el('p', '', det, St.s.evUpd[id] || ev.desc);
        }
        r.addEventListener('click', function () { DM.Audio.se('select'); sel(); });
        rows.push(r);
        if (!first) first = sel;
      });
    });
    if (first) first(); else el('p', '', det, '还没有收集到证据。');
  }
  function chars(bd) {
    var chIdx = Math.max(0, St.CHAPTER_ORDER.indexOf(St.s.chapter));
    var grid = el('div', 'chars-grid', bd), info = el('div', 'char-info', bd);
    var cards = [];
    (GM.cast || []).forEach(function (id, i) {
      var c = DM.CHARS[id]; if (!c) return;
      var f = (GM.fates || {})[id], status = f && chIdx >= f[0] ? f[1] : '';
      var ov = GM.fateOverride && GM.fateOverride(id, chIdx); if (ov) status = ov;
      var card = el('div', 'char-card' + (status === '死亡' ? ' dead' : ''), grid);
      card.appendChild(Core.canvasFrom(Core.art.thumb(id, 'normal')));
      el('div', 'nm', card, c.name);
      if (status) el('div', 'st', card, status);
      card.addEventListener('click', function () { DM.Audio.se('select'); sel(); });
      function sel() {
        cards.forEach(function (x) { x.classList.toggle('sel', x === card); });
        Core.clear(info);
        var h = el('div', '', info);
        var t = el('b', '', h, c.name + '　'); t.style.color = c.color;
        h.appendChild(document.createTextNode(c.title + (c.age ? '　' + c.age + '岁' : '')));
        var bond = St.s.bonds[id] || 0;
        if ((GM.noBond || []).indexOf(id) < 0) { var hs = el('span', 'hearts', h, '　' + '♥'.repeat(bond)); hs.title = '羁绊'; }
        el('div', '', info, c.desc);
        var notes = St.s.notes[id];
        if (notes && notes.length) { var ul = el('ul', 'notes', info); notes.forEach(function (n) { el('li', '', ul, n); }); }
      }
      cards.push(card);
      if (i === 0) sel();
    });
  }
  function rules(bd) {
    var r = el('div', 'rules', bd);
    var ru = GM.rules || { title: '规则', lines: [] }, ve = GM.verses || { title: '歌谣', lines: [] };
    el('p', 'rh', r, '【' + ru.title + '】');
    ru.lines.forEach(function (t) { el('p', '', r, t); });
    el('p', 'rh', r, '【' + ve.title + '】');
    var shown = St.CHAPTER_ORDER.indexOf(St.s.chapter) >= (ve.shownFrom || 0) ? ve.lines.length : 0;
    ve.lines.forEach(function (v, i) { el('p', 'verse' + (i < shown ? '' : ' locked'), r, i < shown ? v : '……'); });
    el('p', 'rh', r, '【审判须知】');
    (GM.trialNotes || []).forEach(function (t) { el('p', '', r, t); });
  }

  // ---------- 结局一览 ----------
  M.openEndings = function () {
    var P = panel('结局一览');
    var E = DM.ENDINGS || {}, ids = Object.keys(E).sort(function (a, b) { return (E[a].no || 0) - (E[b].no || 0); });
    var got = ids.filter(St.hasEnding).length;
    el('div', 'end-sum', P.bd, '已达成 ' + got + ' / ' + ids.length);
    var list = el('div', 'end-list', P.bd);
    ids.forEach(function (id) {
      var e = E[id], ok = St.hasEnding(id);
      var cls = e.type === 'HE' ? (e.trueEnd ? 'te' : 'he') : 'be';
      var rw = el('div', 'end-item ' + cls + (ok ? '' : ' locked'), list);
      el('div', 'k', rw, (e.type === 'HE' ? (e.trueEnd ? 'TRUE' : 'HAPPY') : 'BAD') + ' No.' + (e.no || '?'));
      var tx = el('div', 'tx', rw);
      el('div', 't', tx, ok ? e.title : '？？？');
      el('div', 'd', tx, ok ? (e.desc || '') : '提示：' + (e.hint || '……'));
    });
  };

  // 坏结局之后
  M.badEnd = function (en) {
    I.stop(); UI.resetAll();
    R.setTrial(false); R.clearStage(); R.setSprites([]); R.setBg('black'); R.setFilter('none'); R.setWeather('none'); R.setFlashback(false);
    var L = UI.layers.title; Core.clear(L); L.classList.remove('hidden');
    var box = el('div', 'badend', L);
    el('div', 'k', box, 'BAD END');
    el('div', 't', box, en.title || '');
    el('div', 'q', box, '真相，不该在这里结束。');
    var menu = el('div', 'menu', box);
    function b(t, fn) { var x = el('button', 'btn', menu, t); x.addEventListener('click', function (e) { e.stopPropagation(); DM.Audio.se('ok'); fn(); }); return x; }
    var cp = St.read('cp');
    if (cp) b('回到分歧点', function () { L.classList.add('hidden'); I.loadSnapshot(cp); });
    b('读取存档', function () { St.s = St.s || St.fresh(); M.openLoad(); });
    b('结局一览', M.openEndings);
    b('回到标题', M.toTitle);
  };

  // ---------- 标题画面 ----------
  M.toTitle = function () {
    I.stop(); M.closeAll(); UI.resetAll();
    R.setTrial(false); R.clearStage(); R.setSprites([]); R.setDim(0);
    R.setBg(GM.titleBg || 'title'); R.setFilter('none'); R.setWeather(GM.titleWeather || 'fog'); R.setFlashback(false);
    DM.Audio.bgm(GM.titleBgm || 'title');
    St.s = null;
    var L = UI.layers.title; Core.clear(L); L.classList.remove('hidden');
    var logo = el('div', 'logo', L);
    el('div', 'en', logo, GM.title);
    el('div', 'zh', logo, GM.subtitle);
    var menu = el('div', 'menu', L);
    function b(t, fn, dis) { var x = el('button', 'btn', menu, t); if (dis) x.disabled = true; x.addEventListener('click', function (e) { e.stopPropagation(); DM.Audio.init(); DM.Audio.se('ok'); fn(); }); return x; }
    var latest = St.latest();
    if (latest) b('继续游戏', function () { L.classList.add('hidden'); I.loadSnapshot(latest); });
    b('新的游戏', function () { L.classList.add('hidden'); I.startChapter(GM.chapters[0]).catch(fail); });
    b('读取存档', function () { St.s = St.s || null; M.openLoad(); });
    b('章节选择', chapterSelect, St.progress.reached.length < 2);
    var menu2 = el('div', 'menu2', L);
    function b2(t, fn) { var x = el('button', 'btn small', menu2, t); x.addEventListener('click', function (e) { e.stopPropagation(); DM.Audio.init(); DM.Audio.se('ok'); fn(); }); return x; }
    b2('结局一览', M.openEndings);
    b2('设置', function () { M.openSettings(); });
    b2('关于', about);
    var E = DM.ENDINGS || {}, n = Object.keys(E).length, got = Object.keys(E).filter(St.hasEnding).length;
    el('div', 'foot', L, GM.version + '　' + GM.footer + (n ? '　·　结局 ' + got + '/' + n : ''));
    var SG = DM.Storage;
    if (SG && SG.state === 'needs-permission') {
      var rc = el('button', 'btn small gold save-reconnect', L, '连接存档文件夹「' + SG.rootName + '」');
      rc.addEventListener('click', function (e) {
        e.stopPropagation(); DM.Audio.init(); DM.Audio.se('ok');
        SG.reconnect().then(function () { M.toTitle(); UI.toast('存档', '已连接存档文件夹', 'note'); }, function (err) { UI.toast('存档', (err && err.message) || '没有获得授权', 'note'); });
      });
    } else if (SG && SG.state === 'connected') {
      el('div', 'save-badge', L, '存档：「' + SG.rootName + '」');
    }
    if (fsSupported() && St.device.touch) {
      var fsb = el('button', 'btn small fs-btn', L, '全屏');
      fsb.addEventListener('click', function (e) { e.stopPropagation(); toggleFs(); });
    }
    L.addEventListener('click', function () { DM.Audio.init(); });
  };
  function fail(e) { console.error(e); alert('无法开始：' + e.message); M.toTitle(); }

  function chapterSelect() {
    var P = panel('章节选择');
    var list = el('div', 'save-list', P.bd);
    St.CHAPTER_ORDER.forEach(function (ch) {
      var ok = St.progress.reached.indexOf(ch) >= 0;
      var rw = el('div', 'save-slot' + (ok ? '' : ' empty'), list);
      el('div', 'info', rw, ok ? St.CHAPTER_NAMES[ch] : '？？？');
      if (ok) rw.addEventListener('click', function () {
        DM.Audio.se('ok'); M.closeAll(); UI.layers.title.classList.add('hidden');
        I.startChapter(ch).catch(fail);
      });
    });
  }
  function about() {
    var P = panel('关于');
    var t = el('div', 'about', P.bd);
    t.textContent = GM.about;
  }

  // ---------- 片尾 ----------
  M.credits = function (en) {
    I.stop(); UI.resetAll();
    DM.Audio.bgm('ending');
    var L = UI.layers.title; Core.clear(L); L.classList.remove('hidden');
    var c = el('div', 'credits', L);
    var roll = el('div', 'roll', c);
    var C = GM.credits || {};
    roll.innerHTML = '<h1>' + GM.title + '</h1><div>' + GM.subtitle + '</div>' +
      (en && en.title ? '<div class="end-name">' + (en.trueEnd ? 'TRUE END' : 'END') + '　「' + en.title + '」</div>' : '') +
      '<h3>登场人物</h3>' + (C.cast || []).filter(function (id) { return DM.CHARS[id]; })
        .map(function (id) { return DM.CHARS[id].name + '　……　' + DM.CHARS[id].title; }).join('<br>') +
      (C.also && C.also.length ? '<h3>以及</h3>' + C.also.join('<br>') : '') +
      '<h3>' + (C.closingTitle || '') + '</h3>' + (C.closing || '') +
      '<h3>— 完 —</h3><div style="height:200px"></div>谢谢游玩。';
    var t = setTimeout(M.toTitle, 50000);
    c.addEventListener('click', function () { if (c._clicks = (c._clicks || 0) + 1, c._clicks >= 2) { clearTimeout(t); M.toTitle(); } });
  };
})();
