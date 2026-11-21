#!/usr/bin/env node
/* 剧本校验工具：node tools/validate.js [文件...]
 * 不带参数时校验 js/data/chapters/*.js 与 js/data/freetime.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.resolve(__dirname, '..');
globalThis.window = undefined;
var DM = globalThis.DM = {};
require(path.join(ROOT, 'js/data/characters.js'));
require(path.join(ROOT, 'js/data/locations.js'));
require(path.join(ROOT, 'js/engine/parser.js'));
if (fs.existsSync(path.join(ROOT, 'js/data/endings.js'))) require(path.join(ROOT, 'js/data/endings.js'));
DM.ENDINGS = DM.ENDINGS || {};

var chapters = {};
var freetime = null;
DM.registerChapter = function (c) { chapters[c.id] = c; };
DM.registerFreetime = function (f) { freetime = f; };

var BGM = 'title daily calm island mystery investigate tension horror sad trial debate truth judge finale ending snow village lament stop'.split(' ');
var SE = 'select ok ng door knock bell thunder scream crash glass footsteps splash fire wave getitem gavel heartbeat shout slash clock phone wind chime snowstep creak'.split(' ');
var ICONS = 'knife key note letter rope string feather bottle pill photo book diary clock bell cloth paint shoe footprint tape recorder ring hairpin candle fire map blueprint plate glass cup violin card lamp window door cage sand boat cable wax sequin tooth doll testimony body generic mask moth snow ice charcoal lantern geta shovel radio kimono ticket mill bridge pendant medicine glove'.split(' ');
var WEATHER = ['rain', 'fog', 'embers', 'snow', 'blizzard', 'none'];
var FILTERS = ['night', 'dark', 'sepia', 'red', 'cold', 'dusk', 'none'];
var GAME_TYPES = ['debate', 'rebuttal', 'present', 'pick', 'keyword', 'logic', 'reconstruct', 'vote'];

var files = process.argv.slice(2);
if (!files.length) {
  var dir = path.join(ROOT, 'js/data/chapters');
  if (fs.existsSync(dir)) files = fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); }).map(function (f) { return path.join(dir, f); });
  var ft = path.join(ROOT, 'js/data/freetime.js');
  if (fs.existsSync(ft)) files.push(ft);
}

var totalErr = 0, totalWarn = 0;
function E(file, msg) { totalErr++; console.log('  \x1b[31mERROR\x1b[0m ' + msg); }
function W(file, msg) { totalWarn++; console.log('  \x1b[33mwarn\x1b[0m  ' + msg); }

function checkText(file, s) {
  if (/`/.test(s)) E(file, '剧本中出现了反引号');
}

function validateOps(file, parsed, ctx) {
  var labels = parsed.labels;
  var ops = parsed.ops;
  var referenced = {};
  ops.forEach(function (o) {
    var at = '行' + o.line + ': ';
    if (o.op === 'say') {
      if (!DM.CHARS[o.who]) E(file, at + '未知角色 ' + o.who);
      if (o.expr && DM.EXPRS.indexOf(o.expr) < 0) E(file, at + '未知表情 ' + o.expr);
      if (!o.text) W(file, at + '空台词');
      if (o.text && o.text.length > 90) W(file, at + '台词过长(' + o.text.length + '字)，建议拆分');
      return;
    }
    if (o.op !== 'cmd') return;
    var a = o.args || [];
    switch (o.cmd) {
      case 'bg':
        if (!DM.LOCS[a[0]]) E(file, at + '未知背景 ' + a[0]);
        if (a[1] && !(DM.BG_VARIANTS[a[0]] && DM.BG_VARIANTS[a[0]].indexOf(a[1]) >= 0)) E(file, at + '背景 ' + a[0] + ' 没有变体 ' + a[1]);
        break;
      case 'show':
        var m = /^([a-z_0-9]+)(\[([a-z]+)\])?$/.exec(a[0] || '');
        if (!m || !DM.CHARS[m[1]]) E(file, at + '@show 角色无效 ' + a[0]);
        else if (m[3] && DM.EXPRS.indexOf(m[3]) < 0) E(file, at + '未知表情 ' + m[3]);
        if (a[1] && ['L', 'C', 'R'].indexOf(a[1]) < 0) E(file, at + '@show 位置只能是 L/C/R');
        break;
      case 'hide': if (a[0] && !DM.CHARS[a[0]]) E(file, at + '@hide 未知角色 ' + a[0]); break;
      case 'bgm': if (BGM.indexOf(a[0]) < 0) E(file, at + '未知 BGM ' + a[0]); break;
      case 'se': if (SE.indexOf(a[0]) < 0) E(file, at + '未知音效 ' + a[0]); break;
      case 'weather': if (WEATHER.indexOf(a[0]) < 0) E(file, at + '未知天气 ' + a[0]); break;
      case 'filter': if (FILTERS.indexOf(a[0]) < 0) E(file, at + '未知滤镜 ' + a[0]); break;
      case 'flashback': case 'trial': if (['on', 'off'].indexOf(a[0]) < 0) E(file, at + '@' + o.cmd + ' 只能 on/off'); break;
      case 'fade': if (['in', 'out'].indexOf(a[0]) < 0) E(file, at + '@fade 只能 in/out'); break;
      case 'flash': if (a[0] && ['white', 'red', 'black'].indexOf(a[0]) < 0) E(file, at + '@flash 颜色无效'); break;
      case 'wait': if (!/^\d+$/.test(a[0] || '')) E(file, at + '@wait 需要毫秒数'); break;
      case 'goto': referenced[a[0]] = 1; if (!ctx.hasLabel(a[0])) E(file, at + '@goto 目标不存在 ' + a[0]); break;
      case 'if':
        if (o.target) { referenced[o.target] = 1; if (!ctx.hasLabel(o.target)) E(file, at + '@if 目标不存在 ' + o.target); }
        if (o.cond) {
          var c = o.cond.replace(/^!/, '');
          if (/^has:/.test(c)) { if (!ctx.hasEvidence(c.slice(4))) E(file, at + '@if has: 未知证据 ' + c.slice(4)); }
          else if (/^bond:/.test(c)) { var bm = /^bond:([a-z_0-9]+)>=(\d+)$/.exec(c); if (!bm || !DM.CHARS[bm[1]]) E(file, at + '@if bond 条件格式应为 bond:角色>=数字 ' + o.cond); }
          else if (/^ending:/.test(c)) { if (!DM.ENDINGS[c.slice(7)]) E(file, at + '@if ending: 未知结局 ' + c.slice(7)); }
          else if (!/^[a-zA-Z0-9_]+(>=\d+)?$/.test(c)) E(file, at + '@if 条件格式错误 ' + o.cond);
        }
        break;
      case 'choice':
        o.options.forEach(function (op) { referenced[op.target] = 1; if (!ctx.hasLabel(op.target)) E(file, '行' + op.line + ': 选项目标不存在 ' + op.target); });
        break;
      case 'get': case 'update':
        if (!ctx.hasEvidence(a[0])) E(file, at + '未知证据 ' + a[0]);
        if (o.cmd === 'update' && !o.text) E(file, at + '@update 缺少文本');
        break;
      case 'note': case 'bond': if (!DM.CHARS[a[0]]) E(file, at + '未知角色 ' + a[0]); break;
      case 'unlock': case 'lock': if (!DM.LOCS[a[0]]) E(file, at + '未知场所 ' + a[0]); break;
      case 'explore': if (!ctx.explore || !ctx.explore[a[0]]) E(file, at + '未定义的探索 ' + a[0]); else ctx.usedExplore[a[0]] = 1; break;
      case 'game': if (!ctx.games || !ctx.games[a[0]]) E(file, at + '未定义的游戏 ' + a[0]); else ctx.usedGames[a[0]] = 1; break;
      case 'freetime': if (!/^\d+$/.test(a[0] || '')) E(file, at + '@freetime 需要次数'); break;
      case 'title': if (!/\|/.test(o.text || '')) W(file, at + '@title 建议格式 第X章|标题'); break;
      case 'shout': if (!o.text) E(file, at + '@shout 缺少文本'); break;
      case 'set': case 'inc': if (!a[0]) E(file, at + '@' + o.cmd + ' 缺少名称'); break;
      case 'ending': if (!DM.ENDINGS[a[0]]) E(file, at + '@ending 未知结局（请在 js/data/endings.js 注册）' + a[0]); break;
    }
  });
  return referenced;
}

function validateGames(file, ch, hasEvidence) {
  Object.keys(ch.games || {}).forEach(function (id) {
    var g = ch.games[id];
    var at = '游戏 ' + id + ': ';
    if (GAME_TYPES.indexOf(g.type) < 0) { E(file, at + '未知类型 ' + g.type); return; }
    if (!g.hint && g.type !== 'vote' && g.type !== 'reconstruct') W(file, at + '缺少 hint');
    if (g.type === 'debate' || g.type === 'rebuttal') {
      if (!Array.isArray(g.lines) || !g.lines.length) { E(file, at + '缺少 lines'); return; }
      g.lines.forEach(function (l, i) {
        var who = g.type === 'rebuttal' ? g.who : l.who;
        if (!DM.CHARS[who]) E(file, at + '第' + i + '句未知角色 ' + who);
        if (l.expr && DM.EXPRS.indexOf(l.expr) < 0) E(file, at + '第' + i + '句未知表情 ' + l.expr);
        if (/`/.test(l.text)) E(file, at + '反引号');
      });
      var ans = g.answer;
      if (!ans || typeof ans.line !== 'number') { E(file, at + '缺少 answer.line'); return; }
      var line = g.lines[ans.line];
      if (!line) { E(file, at + 'answer.line 越界'); return; }
      var weaks = DM.splitWeak(line.text).filter(function (p) { return p.weak !== undefined; });
      if (!weaks[ans.weak || 0]) E(file, at + '答案句中没有第 ' + (ans.weak || 0) + ' 个弱点 {}');
      if (g.type === 'debate') {
        if (!Array.isArray(g.ammo) || !g.ammo.length) E(file, at + '缺少 ammo');
        else g.ammo.forEach(function (e) { if (!hasEvidence(e)) E(file, at + 'ammo 未知证据 ' + e); });
        if (g.ammo && g.ammo.indexOf(ans.ammo) < 0) E(file, at + 'answer.ammo 不在 ammo 中');
      } else {
        if (!Array.isArray(g.blades) || g.blades.length < 2) E(file, at + 'blades 至少 2 个');
        else if (!g.blades[ans.blade]) E(file, at + 'answer.blade 越界');
        if (!DM.CHARS[g.who]) E(file, at + 'who 无效');
      }
    } else if (g.type === 'present') {
      if (!g.prompt) E(file, at + '缺少 prompt');
      if (!hasEvidence(g.answer)) E(file, at + 'answer 未知证据 ' + g.answer);
    } else if (g.type === 'pick' || g.type === 'vote') {
      if (!Array.isArray(g.options) || g.options.length < 2) E(file, at + 'options 至少 2 人');
      else g.options.forEach(function (c) { if (!DM.CHARS[c]) E(file, at + 'options 未知角色 ' + c); });
      if (!g.options || g.options.indexOf(g.answer) < 0) E(file, at + 'answer 不在 options 中');
    } else if (g.type === 'keyword') {
      if (!g.answer || g.answer.length < 2 || g.answer.length > 6) E(file, at + 'answer 应为 2~6 字');
      if (!g.prompt) E(file, at + '缺少 prompt');
    } else if (g.type === 'logic' || g.type === 'reconstruct') {
      var arr = g.type === 'logic' ? g.questions : g.panels;
      if (!Array.isArray(arr) || !arr.length) { E(file, at + '缺少题目'); return; }
      arr.forEach(function (q, i) {
        if (!Array.isArray(q.opts) || q.opts.length < 2) E(file, at + '第' + i + '题选项不足');
        else if (typeof q.a !== 'number' || !q.opts[q.a]) E(file, at + '第' + i + '题答案越界');
        if (g.type === 'reconstruct' && q.text.indexOf('【？】') < 0) W(file, at + '第' + i + '格缺少【？】');
      });
    }
  });
}

function validateExplore(file, ch, hasLabel, hasEvidence) {
  Object.keys(ch.explore || {}).forEach(function (id) {
    var x = ch.explore[id];
    var at = '探索 ' + id + ': ';
    var custom = x.custom || {};
    Object.keys(custom).forEach(function (k) {
      var c = custom[k];
      if (!DM.LOCS[c.bg]) E(file, at + 'custom.' + k + ' 背景无效 ' + c.bg);
      if (c.variant && !(DM.BG_VARIANTS[c.bg] || []).includes(c.variant)) E(file, at + 'custom.' + k + ' 变体无效');
      if (!c.name) E(file, at + 'custom.' + k + ' 缺少 name');
    });
    function bgOf(p) { return custom[p] ? custom[p].bg : p; }
    function validPlace(p) { return !!custom[p] || !!DM.LOCS[p]; }
    if (!Array.isArray(x.places) || !x.places.length) E(file, at + '缺少 places');
    (x.places || []).forEach(function (p) { if (!validPlace(p)) E(file, at + '未知场所 ' + p); });
    if (x.places && x.places.indexOf(x.start) < 0) E(file, at + 'start 不在 places 中');
    if (x.filter && FILTERS.indexOf(x.filter) < 0) E(file, at + 'filter 无效');
    if (x.weather && WEATHER.indexOf(x.weather) < 0) E(file, at + 'weather 无效');
    Object.keys(x.spots || {}).forEach(function (p) {
      if (x.places.indexOf(p) < 0) E(file, at + 'spots 场所不在 places 中: ' + p);
      var loc = DM.LOCS[bgOf(p)];
      (x.spots[p] || []).forEach(function (s, i) {
        if (s.anchor) { if (!loc || !loc.anchors[s.anchor]) E(file, at + p + ' 没有锚点 ' + s.anchor); }
        else if (typeof s.x !== 'number' || typeof s.y !== 'number') E(file, at + p + ' 第' + i + '个调查点缺少 anchor 或 x/y');
        if (!s.label) E(file, at + p + ' 调查点缺少 label');
        if (!hasLabel(s.run)) E(file, at + p + ' 调查点 run 标签不存在 ' + s.run);
      });
    });
    Object.keys(x.people || {}).forEach(function (p) {
      if (x.places.indexOf(p) < 0) E(file, at + 'people 场所不在 places 中: ' + p);
      (x.people[p] || []).forEach(function (s) {
        if (!DM.CHARS[s.char]) E(file, at + '未知角色 ' + s.char);
        if (!hasLabel(s.run)) E(file, at + '人物 run 标签不存在 ' + s.run);
      });
    });
    if (!x.done) E(file, at + '缺少 done');
    else {
      if (!hasLabel(x.done.run)) E(file, at + 'done.run 标签不存在 ' + x.done.run);
      (x.done.need || []).forEach(function (n) {
        if (/^flag:/.test(n)) return;
        if (!hasEvidence(n)) E(file, at + 'done.need 未知证据 ' + n);
      });
    }
  });
}

// 检查 run 标签段落最终能走到 @return（简单线性扫描到下一个 @return / @goto）
function checkReturns(file, parsed, runLabels) {
  runLabels.forEach(function (lab) {
    var idx = parsed.labels[lab];
    if (idx === undefined) return;
    for (var k = idx; k < parsed.ops.length; k++) {
      var o = parsed.ops[k];
      if (o.op === 'cmd' && (o.cmd === 'return' || o.cmd === 'goto' || o.cmd === 'choice')) return;
      if (o.op === 'cmd' && (o.cmd === 'chapterend' || o.cmd === 'end' || o.cmd === 'ending')) { W(file, '标签 ' + lab + ' 作为调查点却走到了章节结束'); return; }
    }
    E(file, '标签 ' + lab + ' 之后没有 @return');
  });
}

var allFreetimeLabels = {};

files.forEach(function (f) {
  var file = path.resolve(f);
  console.log('\n\x1b[36m' + path.relative(ROOT, file) + '\x1b[0m');
  var src = fs.readFileSync(file, 'utf8');
  chapters = {}; freetime = null;
  try { vm.runInThisContext(src, { filename: file }); }
  catch (e) { E(file, 'JS 语法/运行错误: ' + e.message); return; }

  var chIds = Object.keys(chapters);
  if (freetime) {
    checkText(file, freetime.script);
    var p = DM.parseScript(freetime.script, path.basename(file));
    p.errors.forEach(function (m) { E(file, m); });
    var ctx = {
      hasLabel: function (l) { return p.labels[l] !== undefined; },
      hasEvidence: function () { return true; }, explore: {}, games: {}, usedExplore: {}, usedGames: {}
    };
    validateOps(file, p, ctx);
    var runs = [];
    Object.keys(freetime.events || {}).forEach(function (c) {
      if (!DM.CHARS[c]) E(file, 'freetime 未知角色 ' + c);
      (freetime.events[c] || []).forEach(function (ev) {
        if (p.labels[ev.label] === undefined) E(file, 'freetime 标签不存在 ' + ev.label);
        if (!/^ft_/.test(ev.label)) E(file, 'freetime 标签应以 ft_ 开头: ' + ev.label);
        if (!Array.isArray(ev.chapters) || !ev.chapters.length) E(file, ev.label + ' 缺少 chapters');
        runs.push(ev.label);
      });
    });
    checkReturns(file, p, runs);
    var nEv = runs.length;
    console.log('  freetime 事件 ' + nEv + ' 个, ' + p.ops.length + ' 条指令');
  }
  if (!chIds.length && !freetime) { E(file, '文件没有调用 DM.registerChapter / DM.registerFreetime'); return; }

  chIds.forEach(function (id) {
    var ch = chapters[id];
    ['id', 'title', 'name', 'start', 'script'].forEach(function (k) { if (!ch[k]) E(file, '章节缺少字段 ' + k); });
    if (ch.next === undefined) W(file, '章节缺少 next（最后一章请写 null）');
    checkText(file, ch.script || '');
    var parsed = DM.parseScript(ch.script || '', path.basename(file));
    parsed.errors.forEach(function (m) { E(file, m); });
    var evid = ch.evidence || {};
    Object.keys(evid).forEach(function (k) {
      var e = evid[k];
      if (!e.name || !e.desc) E(file, '证据 ' + k + ' 缺少 name/desc');
      if (ICONS.indexOf(e.icon) < 0) E(file, '证据 ' + k + ' 图标无效 ' + e.icon);
      if (k.indexOf(id + '_') !== 0) W(file, '证据 id 建议以 ' + id + '_ 开头: ' + k);
    });
    function hasLabel(l) { return parsed.labels[l] !== undefined; }
    function hasEvidence(e) { return !!evid[e]; }
    var ctx = { hasLabel: hasLabel, hasEvidence: hasEvidence, explore: ch.explore, games: ch.games, usedExplore: {}, usedGames: {} };
    if (!hasLabel(ch.start)) E(file, '入口标签不存在 ' + ch.start);
    var referenced = validateOps(file, parsed, ctx);
    validateGames(file, ch, hasEvidence);
    validateExplore(file, ch, hasLabel, hasEvidence);

    // 调查点必须 @return
    var runs = [];
    Object.keys(ch.explore || {}).forEach(function (xid) {
      var x = ch.explore[xid];
      Object.keys(x.spots || {}).forEach(function (p) { (x.spots[p] || []).forEach(function (s) { runs.push(s.run); referenced[s.run] = 1; }); });
      Object.keys(x.people || {}).forEach(function (p) { (x.people[p] || []).forEach(function (s) { runs.push(s.run); referenced[s.run] = 1; }); });
      if (x.done) referenced[x.done.run] = 1;
    });
    checkReturns(file, parsed, runs.filter(function (v, i, a) { return a.indexOf(v) === i; }));

    Object.keys(ch.games || {}).forEach(function (g) { if (!ctx.usedGames[g]) W(file, '游戏 ' + g + ' 未被 @game 使用'); });
    Object.keys(ch.explore || {}).forEach(function (g) { if (!ctx.usedExplore[g]) W(file, '探索 ' + g + ' 未被 @explore 使用'); });
    // 证据是否都能获得
    var gotten = {};
    parsed.ops.forEach(function (o) { if (o.op === 'cmd' && o.cmd === 'get') gotten[o.args[0]] = 1; });
    Object.keys(evid).forEach(function (k) { if (!gotten[k]) W(file, '证据 ' + k + ' 从未通过 @get 获得'); });
    // 未引用标签（入口外）
    referenced[ch.start] = 1;
    Object.keys(parsed.labels).forEach(function (l) {
      // 顺序落入的标签也算可达：检查前一条指令是否为终结指令
      var idx = parsed.labels[l];
      var prev = parsed.ops[idx - 1];
      var fallsIn = prev && !(prev.op === 'cmd' && ['goto', 'return', 'chapterend', 'end', 'choice', 'ending'].indexOf(prev.cmd) >= 0);
      if (!referenced[l] && !fallsIn) W(file, '标签 ' + l + ' 没有被引用，可能无法到达');
    });
    var chars = 0;
    parsed.ops.forEach(function (o) { if (o.text) chars += o.text.length; });
    var nGames = Object.keys(ch.games || {}).length;
    console.log('  ' + id + ' 「' + ch.name + '」: ' + parsed.ops.length + ' 条指令, 文本约 ' + chars + ' 字, 证据 ' + Object.keys(evid).length + ', 小游戏 ' + nGames + ', 探索 ' + Object.keys(ch.explore || {}).length);
  });
});

console.log('\n' + (totalErr ? '\x1b[31m' : '\x1b[32m') + '错误 ' + totalErr + '  \x1b[33m警告 ' + totalWarn + '\x1b[0m');
process.exit(totalErr ? 1 : 0);
