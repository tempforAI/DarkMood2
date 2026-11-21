#!/usr/bin/env node
/* 无头浏览器自动通关测试：node tools/autoplay.js [章节id] [--shots 目录] [--max 步数] [--all] [--be 片段] [--ft 角色,角色] [--skip-optional 证据id,...]
 * 自动推进对话、搜遍所有调查点、自动解出所有小游戏。
 * 选项：默认避开通往坏结局（目标标签含 _be_）的选项；--be xxx 则选择目标标签含 xxx 的选项（测试坏结局）。
 * 自由时间：--ft shio,mio 优先选择这些角色（测试羁绊条件）。
 * --skip-optional：调查时不点击会给出这些证据的调查点；--drop 证据id,...：始终从手账移除这些证据（测试缺少可选证据的坏结局）。
 * --pixel：使用经典像素画风；--res 720：指定输出分辨率。
 * 报告：控制台错误、卡死位置、耗时。需要 playwright（开发用）。
 */
'use strict';
var path = require('path');
var fs = require('fs');
var { chromium } = require('playwright');

var args = process.argv.slice(2);
var chapter = args.find(function (a) { return !a.startsWith('--'); }) || 'prologue';
var shotsDir = (function () { var i = args.indexOf('--shots'); return i >= 0 ? args[i + 1] : null; })();
var maxSteps = (function () { var i = args.indexOf('--max'); return i >= 0 ? +args[i + 1] : 20000; })();
var all = args.indexOf('--all') >= 0;   // 章节结束后继续下一章
function opt(name) { var i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; }
var setBond = (opt('--bond') || '').split(',').filter(Boolean), dropEv = (opt('--drop') || '').split(',').filter(Boolean), beWant = opt('--be'), ftPref = (opt('--ft') || '').split(',').filter(Boolean), skipOpt = (opt('--skip-optional') || '').split(',').filter(Boolean);
var thorough = args.indexOf('--thorough') >= 0, pixel = args.indexOf('--pixel') >= 0, resOpt = opt('--res');

(async function () {
  var browser = await chromium.launch();
  var page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  var errors = [];
  page.on('console', function (m) { if (m.type() === 'error' || m.type() === 'warning') errors.push('[' + m.type() + '] ' + m.text()); });
  page.on('pageerror', function (e) { errors.push('[pageerror] ' + e.message); });
  var url = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?ch=' + chapter;
  await page.addInitScript(function (o) {
    var key = (o.prefix || 'darkmood_') + 'settings';
    try { var cur = JSON.parse(localStorage.getItem(key) || '{}'); cur.style = o.pixel ? 'pixel' : 'hd'; cur.preset = 'custom'; cur.res = o.res ? +o.res : 540; cur.model = 0; cur.tex = 0; cur.light = 1; cur.post = 0; cur.particles = 0; localStorage.setItem(key, JSON.stringify(cur)); } catch (e) {}
  }, { pixel: pixel, res: resOpt, prefix: fs.existsSync(path.resolve(__dirname, '..', 'js/data/game.js')) ? (/storage:\s*'([^']+)'/.exec(fs.readFileSync(path.resolve(__dirname, '..', 'js/data/game.js'), 'utf8')) || [0, 'darkmood_'])[1] : 'darkmood_' });
  await page.goto(url);
  await page.waitForTimeout(1200);
  await page.evaluate(function (o) { DM.State.settings.textSpeed = 3; DM.State.settings.shake = false; window.__AP = o; }, { be: beWant, ft: ftPref, skip: skipOpt, drop: dropEv, bond: setBond, thorough: thorough });
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

  var t0 = Date.now(), steps = 0, shot = 0, stuck = 0, lastSig = '', chaptersSeen = [chapter], ended = false;
  var stats = { lines: 0, games: 0, spots: 0, choices: 0 };
  while (steps++ < maxSteps) {
    var r = await page.evaluate(step);
    if (r.act === 'say') stats.lines++;
    if (r.act && r.act.indexOf('game') === 0) stats.games++;
    if (r.act === 'spot') stats.spots++;
    if (r.act === 'choice') stats.choices++;
    if (r.chapter && chaptersSeen.indexOf(r.chapter) < 0) {
      chaptersSeen.push(r.chapter);
      if (!all) { console.log('到达下一章 ' + r.chapter + '，停止。'); break; }
    }
    if (r.act === 'ending') console.log('结局：' + r.extra);
    if (r.act === 'credits' || r.act === 'title' || r.act === 'badend') { ended = true; console.log('到达' + ({ credits: '片尾', title: '标题', badend: '坏结局画面' })[r.act]); break; }
    if (shotsDir && (r.act.indexOf('game') === 0 || r.act === 'explore' || (r.act === 'say' && stats.lines % 60 === 1))) {
      await page.screenshot({ path: path.join(shotsDir, String(++shot).padStart(4, '0') + '_' + r.act + '.png') });
    }
    var sig = r.sig;
    if (sig === lastSig) { stuck++; await page.waitForTimeout(60); } else { stuck = 0; lastSig = sig; }
    if (stuck > 150) { console.log('卡住了：', JSON.stringify(r)); break; }
    await page.waitForTimeout(r.wait || 8);
  }
  var secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('步数 ' + steps + '，对白 ' + stats.lines + '，小游戏操作 ' + stats.games + '，调查点 ' + stats.spots + '，选项 ' + stats.choices + '，用时 ' + secs + 's，经过章节 ' + chaptersSeen.join(' → '));
  var perf = await page.evaluate(function () { return { heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : 'n/a' }; });
  console.log('JS 堆：' + perf.heap);
  console.log(errors.length ? '控制台错误/警告 ' + errors.length + ' 条：\n  ' + errors.slice(0, 40).join('\n  ') : '没有控制台错误');
  await browser.close();
  process.exit(errors.some(function (e) { return /error/.test(e); }) ? 1 : 0);
})();

// ====== 在页面中执行的一步 ======
function step() {
  var DM = window.DM, St = DM.State, UI = DM.UI;
  function vis(sel) { var e = document.querySelector(sel); return e && e.offsetParent !== null ? e : null; }
  function click(e) { e.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  var sigBase = St.s ? (St.s.prog + ':' + St.s.ip) : 'none';
  var res = function (act, extra) { var o = { act: act, extra: extra, chapter: St.s && St.s.chapter, sig: sigBase + ':' + act + ':' + (extra || '') }; return o; };
  var AP = window.__AP || {};
  if (AP.bond && AP.bond.length && St.s) AP.bond.forEach(function (b) { var kv = b.split('='); if ((St.s.bonds[kv[0]] || 0) < +kv[1]) St.s.bonds[kv[0]] = +kv[1]; });
  if (AP.drop && AP.drop.length && St.s) St.s.ev = St.s.ev.filter(function (e) { return AP.drop.indexOf(e) < 0; });

  if (document.querySelector('.credits')) return res('credits');
  if (document.querySelector('.badend')) return res('badend');
  var endc = document.querySelector('.card-full.ending');
  if (endc && !endc._seen) { endc._seen = 1; return res('ending', endc.textContent.replace('点击继续', '')); }
  if (!St.s && vis('#title .menu')) return res('title');
  // 菜单面板
  var panelClose = document.querySelector('#ui .panel .hd .btn');
  if (panelClose && UI.layers.menu && !UI.layers.menu.classList.contains('hidden')) { click(panelClose); return res('closepanel'); }
  // 全屏卡片
  var card = document.querySelector('.card-full');
  if (card) { UI.advance(); return res('card', card.textContent.slice(0, 20)); }
  // 选项
  var chs = document.querySelectorAll('#choices:not(.hidden) .btn');
  if (chs.length) {
    var cop = null, P = St.s && DM.Interp.progs[St.s.prog];
    if (P) for (var ci = St.s.ip - 1; ci >= Math.max(0, St.s.ip - 3); ci--) if (P.ops[ci] && P.ops[ci].cmd === 'choice') { cop = P.ops[ci]; break; }
    var pickI = 0;
    if (cop) {
      var tg = cop.options.map(function (o) { return o.target; });
      var want = AP.be ? tg.findIndex(function (t) { return t.indexOf(AP.be) >= 0; }) : -1;
      if (want >= 0) pickI = want;
      else { var safe = tg.findIndex(function (t) { return t.indexOf('_be_') < 0 && t.indexOf('_be') !== t.length - 3; }); pickI = safe >= 0 ? safe : 0; }
    }
    var cbtn = chs[pickI] || chs[0];
    click(cbtn); return res('choice', cbtn.textContent);
  }
  // 小游戏
  var G = DM.Games.current;
  var gl = UI.layers.game;
  if (gl && !gl.classList.contains('hidden')) {
    var vr = gl.querySelector('.vote-result');
    if (vr) { click(vr); return res('game_voteresult'); }
    if (!G) {
      // 自由时间选择
      var cards0 = gl.querySelectorAll('.pick-card'), c0 = cards0[0];
      if (AP.ft && AP.ft.length) {
        for (var fi = 0; fi < AP.ft.length && c0 === cards0[0]; fi++) {
          var nmF = DM.CHARS[AP.ft[fi]] && DM.CHARS[AP.ft[fi]].name;
          for (var fj = 0; fj < cards0.length; fj++) if (cards0[fj].querySelector('.nm').textContent === nmF) { c0 = cards0[fj]; break; }
        }
      }
      if (c0) { click(c0); return res('freetime', c0.querySelector('.nm').textContent); }
      return res('game_wait');
    }
    var t = G.type;
    if (t === 'debate' || t === 'rebuttal') {
      var chips = gl.querySelectorAll('.ammo .chip');
      var key = t === 'debate' ? G.ammo.indexOf(G.answer.ammo) : G.answer.blade;
      if (!chips[key] || !chips[key].classList.contains('sel')) { if (chips[key]) click(chips[key]); return res('game_sel', key); }
      var idxText = (gl.querySelector('.stmt-nav .idx') || {}).textContent || '';
      var cur = parseInt(idxText, 10) - 1;
      if (cur !== G.answer.line) { click(gl.querySelectorAll('.stmt-nav .btn')[2]); return res('game_nav', cur); }
      var w = gl.querySelectorAll('.stmt-band .weakpt')[G.answer.weak || 0];
      if (w) { click(w); return res('game_fire', cur); }
      return res('game_wait');
    }
    if (t === 'present') {
      var name = DM.Interp.findEvidence(G.answer).name;
      var items = gl.querySelectorAll('.ev-item');
      for (var i = 0; i < items.length; i++) if (items[i].textContent === name) {
        if (!items[i].classList.contains('sel')) { click(items[i]); return res('game_pick'); }
        click(gl.querySelector('.g-foot .btn')); return res('game_present');
      }
      return res('game_missing_evidence', G.answer);
    }
    if (t === 'pick' || t === 'vote') {
      var nm = DM.CHARS[G.answer].name;
      var cards = gl.querySelectorAll('.pick-card');
      for (var j = 0; j < cards.length; j++) if (cards[j].querySelector('.nm').textContent === nm) { click(cards[j]); return res('game_' + t); }
      return res('game_wait');
    }
    if (t === 'keyword') {
      var filled = gl.querySelectorAll('.kw-slot.fill').length;
      var need = Array.from(G.answer)[filled];
      var bs = gl.querySelectorAll('.kw-ch:not(.used)');
      for (var k = 0; k < bs.length; k++) if (bs[k].textContent === need) { click(bs[k]); return res('game_kw', filled); }
      return res('game_wait');
    }
    if (t === 'logic') {
      var qn = gl.querySelector('.logic-box .qn');
      if (!qn) return res('game_wait');
      var qi = parseInt(qn.textContent.replace(/[^0-9 ]/g, '').trim(), 10) - 1;
      var ob = gl.querySelectorAll('.logic-box .opts .btn')[G.questions[qi].a];
      if (ob) { click(ob); return res('game_logic', qi); }
      return res('game_wait');
    }
    if (t === 'reconstruct') {
      var fin = gl.querySelector('.recon-panel .g-foot .btn');
      if (fin) { click(fin); return res('game_recon_done'); }
      var no = gl.querySelector('.recon-frame .no');
      if (!no) return res('game_wait');
      var pi = parseInt(no.textContent.replace(/[^0-9 ]/g, '').trim(), 10) - 1;
      var obs = gl.querySelectorAll('.recon-opts .btn');
      if (obs[G.panels[pi].a] && !obs[G.panels[pi].a].disabled) { click(obs[G.panels[pi].a]); return res('game_recon', pi); }
      return res('game_wait');
    }
  }
  // 探索
  var ex = UI.layers.explore;
  if (ex && !ex.classList.contains('hidden') && ex.querySelector('.topbar')) {
    var st = St.s.stack, f = st[st.length - 1];
    var def = DM.Interp.progs[f.prog].def.explore[f.id];
    var spots = Array.from(ex.querySelectorAll('.spot:not(.seen)'));
    if (AP.skip && AP.skip.length) {
      var defSpots = (def.spots && def.spots[f.place]) || [];
      spots = spots.filter(function (el2) {
        var lb = el2.textContent, sd = defSpots.find(function (x) { return x.label === lb; });
        if (!sd) return true;
        var Pg = DM.Interp.progs[f.prog], idx = Pg.labels[sd.run], bad = false;
        for (var q2 = idx; q2 < Math.min(Pg.ops.length, idx + 80); q2++) { var o2 = Pg.ops[q2]; if (o2.cmd === 'return') break; if (o2.cmd === 'get' && AP.skip.indexOf(o2.args[0]) >= 0) bad = true; }
        if (bad) el2.classList.add('seen');
        return !bad;
      });
    }
    var spot = spots[0];
    if (spot) { click(spot); return res('spot', f.place); }
    var per = ex.querySelector('.person:not(.talked)');
    if (per) { click(per); return res('spot', f.place + 'p'); }
    // 去下一个还有未调查点的地点
    f._tour = f._tour || {};
    f._tour[f.place] = true;
    for (var pi2 = 0; pi2 < def.places.length; pi2++) {
      var p = def.places[pi2];
      if (!f._tour[p]) { f.place = p; DM.Explore.open(); return res('explore', p); }
    }
    var fin2 = Array.from(ex.querySelectorAll('.topbar .btn')).find(function (b) { return b.classList.contains('gold'); });
    if (fin2 && AP.thorough && !f._thoroughDone) {
      // 像细心的玩家一样，结束前把每个调查点再看一遍
      f._thoroughDone = true;
      Object.keys(St.s.visited).forEach(function (k) { if (k.indexOf(f.id + ':') === 0) delete St.s.visited[k]; });
      delete f._tour; DM.Explore.open();
      return res('explore_thorough');
    }
    if (fin2) { delete f._tour; delete f._rounds; click(fin2); return res('explore_done'); }
    var missing = ((def.done || {}).need || []).filter(function (n) { return n.indexOf('flag:') === 0 ? !St.flag(n.slice(5)) : !St.hasEv(n); });
    // 像玩家一样再仔细看一遍：清空已调查标记，最多重来 3 轮
    f._rounds = (f._rounds || 0) + 1;
    if (f._rounds <= 3) {
      Object.keys(St.s.visited).forEach(function (k) { if (k.indexOf(f.id + ':') === 0) delete St.s.visited[k]; });
      Object.keys(St.s.talked).forEach(function (k) { if (k.indexOf(f.id + ':') === 0) delete St.s.talked[k]; });
      delete f._tour; DM.Explore.open();
      return res('explore_revisit', f._rounds);
    }
    return res('explore_stuck', '缺少: ' + JSON.stringify(missing));
  }
  if (UI.isWaiting()) { UI.advance(); return res('say'); }
  return res('idle');
}
