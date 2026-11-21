/* 剧本解释器：按顺序执行指令；探索/自由时间通过调用栈返回。
 * 章节脚本按需以 <script> 注入加载（支持 file:// 直接打开）。
 */
(function () {
  'use strict';
  var DM = window.DM, Core = DM.Core, St = DM.State, R = DM.Render, UI = DM.UI;
  var I = DM.Interp = {};
  var progs = I.progs = {};
  DM.chapters = DM.chapters || {};

  // ---------- 注册 ----------
  var waiters = {};
  DM.registerChapter = function (def) {
    DM.chapters[def.id] = def;
    var p = DM.parseScript(def.script || '', def.id);
    if (p.errors.length) console.warn('[剧本错误] ' + def.id, p.errors);
    progs[def.id] = { ops: p.ops, labels: p.labels, def: def };
    if (waiters[def.id]) { waiters[def.id].forEach(function (f) { f(); }); delete waiters[def.id]; }
  };
  DM.registerFreetime = function (def) {
    DM.freetimeDef = def;
    var p = DM.parseScript(def.script || '', 'freetime');
    if (p.errors.length) console.warn('[自由时间剧本错误]', p.errors);
    progs.ft = { ops: p.ops, labels: p.labels, def: def };
  };

  var loading = {};
  I.loadChapter = function (id) {
    if (progs[id]) return Promise.resolve(progs[id]);
    if (loading[id]) return loading[id];
    UI.loading(true);
    loading[id] = new Promise(function (res, rej) {
      (waiters[id] = waiters[id] || []).push(function () { UI.loading(false); res(progs[id]); });
      var s = document.createElement('script');
      s.src = 'js/data/chapters/' + id + '.js';
      s.onerror = function () { UI.loading(false); delete loading[id]; rej(new Error('无法加载章节 ' + id)); };
      document.head.appendChild(s);
    });
    return loading[id];
  };
  // 空闲时预加载下一章
  I.preload = function (id) {
    if (!id || progs[id] || loading[id]) return;
    var go = function () { I.loadChapter(id).catch(function () { /* 稍后再试 */ }); };
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500);
  };

  // ---------- 场景状态同步 ----------
  function sc() { return St.s.scene; }
  I.applyScene = function (scene) {
    R.setTrial(false);
    R.setBg(scene.bg || 'black', scene.variant);
    R.setFilter(scene.filter); R.setWeather(scene.weather); R.setFlashback(scene.flashback);
    if (scene.trial) R.setTrial(true);
    R.clearStage();
    (scene.stage || []).forEach(function (s) { R.show(s.id, s.expr, s.pos); });
    UI.caption(scene.caption);
    DM.Audio.bgm(scene.bgm || 'stop');
  };
  function syncStage() { sc().stage = R.stageSnapshot(); }

  // ---------- 运行 ----------
  var token = 0;
  I.resume = null;           // 当前可存档的位置
  var linesSinceSave = 0;

  I.stop = function () { token++; };
  I.cur = function () { return progs[St.s.prog]; };

  I.jump = function (label, progId) {
    var pid = progId || St.s.prog, p = progs[pid];
    if (!p || p.labels[label] === undefined) { console.error('找不到标签', pid, label); return false; }
    St.s.prog = pid; St.s.ip = p.labels[label];
    return true;
  };

  I.autosave = function (resume) {
    var r = resume || I.resume;
    if (!r) return;
    syncStage();
    var meta = { chapter: St.s.chapter, caption: sc().caption, place: DM.Explore && DM.Explore.placeName ? DM.Explore.placeName() : '' };
    St.write('auto', St.snapshot(r, meta));
  };

  I.run = function () {
    var my = ++token;
    (async function () {
      try {
        while (my === token) {
          var p = progs[St.s.prog];
          if (!p) { console.error('程序未加载', St.s.prog); return; }
          var k = St.s.ip, op = p.ops[k];
          if (!op) { console.warn('程序结束于', St.s.prog); return; }
          St.s.ip = k + 1;
          var r = exec(op, k);
          if (r === STOP) return;
          if (r && r.then) { var v = await r; if (v === STOP || my !== token) return; }
        }
      } catch (e) { console.error(e); }
    })();
  };
  var STOP = {};
  I.STOP = STOP;

  function charName(o) {
    if (o.name !== null && o.name !== undefined && o.name !== '') return o.name;
    var c = DM.CHARS[o.who];
    return c ? c.name : o.who;
  }

  function exec(op, k) {
    var S = St.s;
    if (op.op === 'say' || op.op === 'narr' || op.op === 'think') {
      I.resume = { type: 'op', prog: S.prog, ip: k };
      if (++linesSinceSave >= 25) { linesSinceSave = 0; I.autosave(); }
      if (linesSinceSave % 12 === 0) prefetchAhead(k + 1);
      if (op.op === 'say') {
        R.speak(op.who, op.expr);
        syncStage();
        return UI.say({ kind: 'say', who: op.who, name: charName(op), text: op.text });
      }
      if (op.op === 'narr') R.narrate();
      return UI.say({ kind: op.op, text: op.text });
    }
    var a = op.args || [], s = sc();
    switch (op.cmd) {
      case 'bg': {
        UI.showDialog(false);
        UI.caption(''); s.caption = '';
        s.bg = a[0]; s.variant = a[1] || null; s.stage = [];
        prefetchAhead(k + 1);
        var doBg = function () { R.setTrial(false); s.trial = false; R.setBg(a[0], a[1]); R.clearStage(); };
        if (R.bgReady(a[0], a[1])) { doBg(); return; }
        // 尚未生成的高清背景：先显示「读取中」，让出一帧再生成，避免界面卡住无反馈
        UI.loading(true);
        return Core.frame().then(Core.frame).then(function () { doBg(); UI.loading(false); });
      }
      case 'show': {
        var m = /^([a-z_0-9]+)(\[([a-z]+)\])?$/.exec(a[0] || '');
        if (m) { R.show(m[1], m[3] || null, a[1] || 'C'); syncStage(); }
        return;
      }
      case 'hide': if (a[0]) R.hide(a[0]); else R.clearStage(); syncStage(); return;
      case 'bgm': DM.Audio.bgm(a[0]); s.bgm = a[0] === 'stop' ? null : a[0]; return;
      case 'se': DM.Audio.se(a[0]); return;
      case 'weather': R.setWeather(a[0]); s.weather = a[0]; return;
      case 'filter': R.setFilter(a[0]); s.filter = a[0]; return;
      case 'flashback': R.setFlashback(a[0] === 'on'); s.flashback = a[0] === 'on'; return;
      case 'shake': UI.shake(); return;
      case 'flash': UI.flash(a[0]); return;
      case 'fade': if (a[0] === 'out') UI.showDialog(false); return UI.fade(a[0] === 'out');
      case 'wait': return UI.skipping() ? null : Core.wait(Math.min(5000, +a[0] || 0));
      case 'title': UI.stopSkip(); return UI.titleCard(op.text);
      case 'caption': UI.caption(op.text); s.caption = op.text; return;
      case 'poem': I.resume = { type: 'op', prog: S.prog, ip: k }; return UI.poem(op.text);
      case 'letter': I.resume = { type: 'op', prog: S.prog, ip: k }; return UI.letter(op.text);
      case 'shout':
        if (a[0]) { R.speak(a[0], DM.CHARS[a[0]] && a[0] !== 'ritsu' ? 'angry' : null); syncStage(); }
        UI.showDialog(false); UI.shake();
        return UI.shout(op.text);
      case 'goto': I.jump(a[0]); return;
      case 'if': if (St.evalCond(op.cond)) I.jump(op.target); return;
      case 'choice':
        I.resume = { type: 'op', prog: S.prog, ip: k };
        return UI.choice(op.options).then(function (i) { I.jump(op.options[i].target); });
      case 'set': S.flags[a[0]] = a.length > 1 ? (isNaN(+a[1]) ? a[1] : +a[1]) : true; return;
      case 'inc': S.flags[a[0]] = (+S.flags[a[0]] || 0) + (a[1] ? +a[1] : 1); return;
      case 'get': {
        var ev = findEvidence(a[0]);
        if (St.addEv(a[0]) && ev) {
          DM.Audio.se('getitem');
          UI.toast('获得证据', ev.name, ev.icon);
          UI.log.push({ kind: 'narr', name: '', text: '【获得证据】' + ev.name });
        }
        return;
      }
      case 'update': {
        var ev2 = findEvidence(a[0]);
        S.evUpd[a[0]] = op.text;
        if (ev2 && St.hasEv(a[0])) { DM.Audio.se('ok'); UI.toast('证据更新', ev2.name, ev2.icon); }
        return;
      }
      case 'note': (S.notes[a[0]] = S.notes[a[0]] || []).push(op.text); return;
      case 'unlock': S.unlocked[a[0]] = true; return;
      case 'lock': S.unlocked[a[0]] = false; return;
      case 'bond': S.bonds[a[0]] = (S.bonds[a[0]] || 0) + 1; DM.Audio.se('ok'); UI.toast('羁绊加深', Core.charName(a[0]), 'testimony'); return;
      case 'trial':
        if (a[0] === 'on') {
          R.setTrial(true); s.trial = true; s.stage = []; S.hp = S.hp > 0 ? S.hp : 5;
          R.setWeather('none'); s.weather = 'none'; R.setFilter('none'); s.filter = 'none';
          R.setFlashback(false); s.flashback = false;
        }
        else { R.setTrial(false); s.trial = false; }
        return;
      case 'explore': {
        var def = I.cur().def.explore[a[0]];
        if (!def) { console.error('未定义探索', a[0]); return; }
        S.stack.push({ kind: 'explore', id: a[0], prog: S.prog, place: def.start });
        UI.stopSkip();
        DM.Explore.open();
        return STOP;
      }
      case 'freetime': {
        var n = +a[0] || 1;
        if (!DM.Freetime.available().length) return;
        S.stack.push({ kind: 'freetime', remaining: n, prog: S.prog, ip: S.ip, scene: JSON.parse(JSON.stringify(s)) });
        UI.stopSkip();
        DM.Freetime.open();
        return STOP;
      }
      case 'return': return doReturn();
      case 'game': {
        var g = I.cur().def.games[a[0]];
        if (!g) { console.error('未定义游戏', a[0]); return; }
        UI.stopSkip();
        I.resume = { type: 'op', prog: S.prog, ip: k };
        I.autosave();
        return DM.Games.run(g, a[0]);
      }
      case 'chapterend': return chapterEnd();
      case 'end': UI.stopSkip(); St.markCleared(); DM.Menus.credits(); return STOP;
      case 'checkpoint':
        // 分歧点存档：坏结局后可「回到分歧点」
        syncStage();
        St.write('cp', St.snapshot({ type: 'op', prog: S.prog, ip: k + 1 }, { chapter: S.chapter, caption: s.caption, place: '' }));
        return;
      case 'ending': {
        var en = (DM.ENDINGS || {})[a[0]] || { type: 'BE', title: a[0], no: 0 };
        UI.stopSkip();
        St.markEnding(a[0]);
        if (en.type === 'HE') St.markCleared();
        UI.showDialog(false); UI.caption('');
        return UI.endingCard(en).then(function () {
          if (en.type === 'HE') DM.Menus.credits(en);
          else DM.Menus.badEnd(en);
          return STOP;
        });
      }
    }
  }

  // 预读后续剧本用到的背景与立绘，让高清美术在空闲时提前生成
  function prefetchAhead(from) {
    var p = progs[St.s.prog]; if (!p) return;
    var items = [], end = Math.min(p.ops.length, from + 70), nbg = 0;
    for (var i = from; i < end; i++) {
      var o = p.ops[i];
      if (o.op === 'say' && o.who !== 'ritsu') items.push(['pt', o.who, o.expr || 'normal']);
      else if (o.op === 'cmd') {
        if (o.cmd === 'bg' && o.args[0]) { items.push(['bg', o.args[0], o.args[1] || undefined]); if (++nbg >= 2) break; }
        else if (o.cmd === 'show') { var m = /^([a-z_0-9]+)(\[([a-z]+)\])?$/.exec(o.args[0] || ''); if (m) items.push(['pt', m[1], m[3] || 'normal']); }
        else if (o.cmd === 'trial' && o.args[0] === 'on') items.push(['bg', DM.GAME.trialBg || 'judgment', undefined]);
      }
    }
    R.prefetch(items);
  }
  I.prefetchAhead = prefetchAhead;

  function findEvidence(id) {
    for (var ch in DM.chapters) { var e = DM.chapters[ch].evidence; if (e && e[id]) return e[id]; }
    return null;
  }
  I.findEvidence = findEvidence;

  function doReturn() {
    var S = St.s, top = S.stack[S.stack.length - 1];
    if (!top) { console.warn('@return 没有调用者'); return; }
    if (top.kind === 'explore') { UI.showDialog(false); DM.Explore.open(); return STOP; }
    if (top.kind === 'freetime') {
      top.remaining--;
      if (top.remaining > 0 && DM.Freetime.available().length) { UI.showDialog(false); DM.Freetime.open(); return STOP; }
      S.stack.pop();
      S.prog = top.prog; S.ip = top.ip;
      S.scene = top.scene; I.applyScene(S.scene);
      return;
    }
  }

  function chapterEnd() {
    var S = St.s, def = I.cur().def;
    UI.stopSkip();
    var title = (def.title || '') + ' 「' + (def.name || '') + '」 完';
    UI.showDialog(false);
    return UI.endCard(title).then(function () {
      if (!def.next) { St.markCleared(); DM.Menus.credits(); return STOP; }
      return I.loadChapter(def.next).then(function (p) {
        S.chapter = def.next; S.prog = def.next; S.ip = p.labels[p.def.start] || 0; S.stack = [];
        S.hp = 5;
        St.markReached(def.next);
        I.resume = { type: 'op', prog: S.prog, ip: S.ip };
        I.autosave();
        I.preload(p.def.next);
      }, function (e) {
        console.error(e);
        return UI.say({ kind: 'narr', text: '（下一章的剧本文件尚未就绪：' + def.next + '。请稍后从读档继续。）' }).then(function () { DM.Menus.toTitle(); return STOP; });
      });
    });
  }

  // ---------- 开始 / 读档 ----------
  I.startChapter = function (id) {
    St.newGame(id);
    St.markReached(id);
    UI.resetAll(); R.setTrial(false); R.clearStage(); R.setSprites([]);
    return I.loadChapter(id).then(function (p) {
      St.s.ip = p.labels[p.def.start] || 0;
      I.resume = { type: 'op', prog: id, ip: St.s.ip };
      I.applyScene(St.s.scene);
      I.preload(p.def.next);
      I.run();
    });
  };

  I.loadSnapshot = function (snap) {
    if (!snap) return Promise.resolve();
    I.stop();
    UI.resetAll();
    St.s = JSON.parse(JSON.stringify(snap.s));
    var need = [St.s.chapter];
    St.s.stack.forEach(function (f) { if (f.prog && f.prog !== 'ft') need.push(f.prog); });
    if (St.s.prog !== 'ft') need.push(St.s.prog);
    return Promise.all(need.filter(function (v, i, arr) { return arr.indexOf(v) === i; }).map(I.loadChapter)).then(function () {
      I.applyScene(St.s.scene);
      var r = snap.resume || { type: 'op', prog: St.s.prog, ip: St.s.ip };
      I.preload((DM.chapters[St.s.chapter] || {}).next);
      if (r.type === 'explore') { R.setSprites([]); DM.Explore.open(); return; }
      if (r.type === 'freetime') { DM.Freetime.open(); return; }
      St.s.prog = r.prog; St.s.ip = r.ip;
      I.run();
    });
  };
})();
