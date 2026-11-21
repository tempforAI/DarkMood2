/* 审判小游戏：证言交锋 / 一对一对峙 / 出示证据 / 指认 / 灵光拼字 / 推理回廊 / 真相重演 / 投票
 * 设计原则：没有失败。答错只扣「信念」，归零自动恢复；连续答错逐步给出提示与高亮。
 */
(function () {
  'use strict';
  var DM = window.DM, Core = DM.Core, St = DM.State, R = DM.Render, UI = DM.UI;
  var el = Core.el;
  var G = DM.Games = {};
  var active = null;   // 当前游戏的键盘处理
  var MAXHP = 5;

  G.onKey = function (e) { return active && active.key ? active.key(e) : false; };

  function layer() { var L = UI.layers.game; Core.clear(L); L.classList.remove('hidden'); return L; }
  function closeLayer() { var L = UI.layers.game; L.classList.add('hidden'); Core.clear(L); R.setDim(0); active = null; }
  function thresholds() { return St.settings.difficulty === 'normal' ? { hint: 2, hl: 3 } : { hint: 1, hl: 2 }; }

  function banner(L, title) {
    var b = el('div', 'g-banner', L);
    el('div', 'tt', b, title);
    el('div', 'sp', b);
    var nb = el('button', 'btn small', b, '手账');
    nb.addEventListener('click', function (e) { e.stopPropagation(); DM.Audio.se('select'); DM.Menus.openNotebook(); });
    el('span', 'hp-l', b, DM.GAME.hpName || '信念');
    var hp = el('div', 'hp', b);
    function draw() {
      Core.clear(hp);
      for (var i = 0; i < MAXHP; i++) el('span', i < St.s.hp ? '' : 'off', hp, '♥');
    }
    draw();
    return { draw: draw };
  }

  var msgEl = null, msgT = null;
  function msg(L, text, hint) {
    if (msgEl && msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
    msgEl = el('div', 'g-msg' + (hint ? ' hint' : ''), L, text);
    clearTimeout(msgT);
    var m = msgEl;
    msgT = setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, hint ? 7000 : 3200);
  }

  // 答错：扣信念、按次数给提示。返回错误次数
  function wrong(L, ban, def, state, defaultText) {
    state.n++;
    DM.Audio.se('ng'); UI.shake();
    St.s.hp = Math.max(0, St.s.hp - 1);
    var th = thresholds();
    var text = def.wrong || defaultText;
    if (St.s.hp <= 0) {
      St.s.hp = MAXHP;
      text = '（……冷静。线索就在手里。深呼吸，把它们重新排一遍。）——' + (DM.GAME.hpName || '信念') + '恢复了。';
    }
    ban.draw();
    if (state.n >= th.hint && def.hint) msg(L, '提示：' + def.hint, true);
    else msg(L, text);
    return state.n >= th.hl;
  }

  function succeed(text) {
    DM.Audio.se('slash'); UI.flash('white');
    return UI.shout(text);
  }

  function chapterEvidence() {
    var ch = DM.chapters[St.s.chapter];
    var list = [];
    if (ch && ch.evidence) Object.keys(ch.evidence).forEach(function (id) { if (St.hasEv(id)) list.push({ id: id, ev: ch.evidence[id] }); });
    return list;
  }
  function evDesc(id, ev) { return St.s.evUpd[id] || ev.desc; }

  G.run = function (def, id) {
    UI.showDialog(false);
    var cap = document.getElementById('caption'); if (cap) cap.style.visibility = 'hidden';
    if (St.s.hp <= 0 || St.s.hp > MAXHP) St.s.hp = MAXHP;
    var fn = {
      debate: debate, rebuttal: debate, present: present, pick: pick, keyword: keyword,
      logic: logic, reconstruct: reconstruct, vote: vote
    }[def.type];
    if (!fn) { console.error('未知小游戏类型', def.type); return Promise.resolve(); }
    G.current = def;   // 供自动测试脚本读取
    return fn(def).then(function () { G.current = null; closeLayer(); if (cap) cap.style.visibility = ''; });
  };

  // ======================================================
  // 证言交锋 / 一对一对峙
  // ======================================================
  function debate(def) {
    var reb = def.type === 'rebuttal';
    return new Promise(function (done) {
      var L = layer();
      var wasTrial = R.view.trial;
      if (!wasTrial) R.setTrial(true);
      var ban = banner(L, def.title || (reb ? '一对一对峙' : '证言交锋'));
      var state = { n: 0 };
      var lines = def.lines, n = lines.length;

      // 弹药
      var box = el('div', 'ammo', L);
      el('div', 'lbl', box, reb ? '反驳之刃' : '证据');
      var chips = [], selected = null;
      var items = reb ? def.blades.map(function (t, i) { return { key: i, name: t }; })
        : def.ammo.map(function (id) { var e = DM.Interp.findEvidence(id) || { name: id, icon: 'generic' }; return { key: id, name: e.name, icon: e.icon }; });
      items.forEach(function (it, i) {
        var c = el('button', 'chip' + (reb ? ' blade' : ''), box);
        if (!reb) c.appendChild(Core.canvasFrom(Core.art.icon(it.icon)));
        el('span', '', c, it.name);
        el('span', 'k', c, String(i + 1));
        c.addEventListener('click', function (e) { e.stopPropagation(); select(i); });
        chips.push(c);
      });
      function select(i) {
        if (!items[i]) return;
        DM.Audio.se('select');
        selected = items[i];
        chips.forEach(function (c, j) { c.classList.toggle('sel', j === i); });
        loaded.textContent = '已选择：' + selected.name + '　→ 点击发言中的橙色字句';
        loaded.classList.remove('hidden');
      }
      var loaded = el('div', 'loaded hidden', L);

      // 发言
      var band = el('div', 'stmt-band', L);
      var whoEl = el('div', 'who', band);
      var txEl = el('div', 'tx', band);
      var hover = false;
      band.addEventListener('mouseenter', function () { hover = true; clearTimeout(timer); });
      band.addEventListener('mouseleave', function () { hover = false; schedule(); });

      var nav = el('div', 'stmt-nav', L);
      var prevB = el('button', 'btn small', nav, '◀');
      var idxEl = el('span', 'idx', nav);
      var pauseB = el('button', 'btn small', nav, '❚❚');
      var nextB = el('button', 'btn small', nav, '▶');
      var paused = false, timer = null, idx = 0, highlight = false;
      prevB.addEventListener('click', function (e) { e.stopPropagation(); show((idx - 1 + n) % n); });
      nextB.addEventListener('click', function (e) { e.stopPropagation(); show((idx + 1) % n); });
      pauseB.addEventListener('click', function (e) { e.stopPropagation(); paused = !paused; pauseB.textContent = paused ? '▶▶' : '❚❚'; if (paused) clearTimeout(timer); else schedule(); });

      function show(i) {
        if (over) return;
        idx = i;
        var line = lines[i], who = reb ? def.who : line.who;
        R.trialSpeaker(who, line.expr || (reb ? 'angry' : 'normal'));
        whoEl.textContent = Core.charName(who);
        whoEl.style.color = Core.charColor(who);
        Core.clear(txEl);
        DM.splitWeak(line.text).forEach(function (part) {
          if (part.weak === undefined) { txEl.appendChild(document.createTextNode(part.t)); return; }
          var w = el('span', 'weakpt', txEl, part.t);
          if (highlight && i === def.answer.line && part.weak === (def.answer.weak || 0)) w.classList.add('hl');
          w.addEventListener('click', function (e) { e.stopPropagation(); fire(i, part.weak); });
        });
        txEl.classList.remove('in'); void txEl.offsetWidth; txEl.classList.add('in');
        idxEl.textContent = (i + 1) + ' / ' + n;
        schedule();
      }
      function schedule() {
        clearTimeout(timer);
        if (paused || hover) return;
        var len = lines[idx].text.length;
        timer = setTimeout(function () { if (UI.modalOpen()) { schedule(); return; } show((idx + 1) % n); }, 2600 + len * 110);
      }
      var over = false;
      function fire(i, w) {
        if (over) return;
        if (!selected) { DM.Audio.se('ng'); msg(L, '先从左侧选择一' + (reb ? '把反驳之刃' : '件证据') + '（或按数字键）。'); return; }
        var a = def.answer;
        var ok = i === a.line && w === (a.weak || 0) && (reb ? selected.key === a.blade : selected.key === a.ammo);
        if (ok) {
          over = true; clearTimeout(timer); active = null;
          succeed(reb ? '这就是破绽！' : '就是这里！').then(function () {
            if (!wasTrial) R.setTrial(false);
            done();
          });
          return;
        }
        var hl = wrong(L, ban, def, state, reb ? '……不行，这样驳不倒对方。换一把刀，或者换一句话。' : '……不对。这件证据和这句话对不上。');
        if (hl && !highlight) {
          highlight = true;
          var key = reb ? def.answer.blade : def.answer.ammo;
          items.forEach(function (it, j) { if (it.key === key) chips[j].classList.add('hl'); });
          show(def.answer.line);
        }
      }
      active = {
        key: function (e) {
          if (UI.modalOpen()) return false;
          if (/^[1-9]$/.test(e.key)) { select(+e.key - 1); return true; }
          if (e.key === 'ArrowLeft') { show((idx - 1 + n) % n); return true; }
          if (e.key === 'ArrowRight') { show((idx + 1) % n); return true; }
          if (e.key === ' ' || e.key === 'Enter') return true;
          return false;
        }
      };
      DM.Audio.se('gavel');
      msg(L, reb ? '在对方的发言中找到破绽：选择一把「反驳之刃」，再点击橙色字句。' : '在众人的发言中找出矛盾：先选择左侧的证据，再点击与之矛盾的橙色字句。没有时间限制。', true);
      show(0);
    });
  }

  // ======================================================
  // 出示证据
  // ======================================================
  function present(def) {
    return new Promise(function (done) {
      var L = layer(); R.setDim(0.65);
      var ban = banner(L, '出示证据');
      var state = { n: 0 }, highlight = false;
      var p = el('div', 'g-panel', L);
      var pr = el('div', 'g-prompt', p); pr.textContent = def.prompt;
      var wrap = el('div', 'ev-wrap', p); wrap.style.flex = '1'; wrap.style.minHeight = '0';
      var list = el('div', 'ev-list', wrap);
      var det = el('div', 'ev-detail', wrap);
      var foot = el('div', 'g-foot', p);
      var go = el('button', 'btn gold', foot, '出示'); go.disabled = true;
      var sel = null, rows = [], over = false;
      var evs = chapterEvidence();
      evs.forEach(function (it) {
        var r = el('div', 'ev-item', list);
        r.appendChild(Core.canvasFrom(Core.art.icon(it.ev.icon)));
        el('span', 'nm', r, it.ev.name);
        r.addEventListener('click', function (e) {
          e.stopPropagation(); DM.Audio.se('select'); sel = it;
          rows.forEach(function (x) { x.classList.toggle('sel', x === r); });
          Core.clear(det);
          det.appendChild(Core.canvasFrom(Core.art.icon(it.ev.icon)));
          el('h3', '', det, it.ev.name);
          el('p', '', det, evDesc(it.id, it.ev));
          go.disabled = false;
        });
        r.addEventListener('dblclick', function (e) { e.stopPropagation(); go.click(); });
        r._id = it.id; rows.push(r);
      });
      if (!evs.length) el('p', '', det, '（手上还没有证据）');
      go.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!sel || over) return;
        if (sel.id === def.answer) { over = true; succeed('就是这个！').then(done); return; }
        if (wrong(L, ban, def, state, '……不，不是这个。') && !highlight) {
          highlight = true; rows.forEach(function (x) { if (x._id === def.answer) x.classList.add('hl'); });
        }
      });
    });
  }

  // ======================================================
  // 指认人物
  // ======================================================
  function pick(def) {
    return new Promise(function (done) {
      var L = layer(); R.setDim(0.65);
      var ban = banner(L, def.title || '指认');
      var state = { n: 0 };
      var p = el('div', 'g-panel', L);
      var pr = el('div', 'g-prompt', p); pr.textContent = def.prompt;
      var grid = el('div', 'pick-grid', p), cards = [], over = false;
      def.options.forEach(function (c) {
        var card = el('div', 'pick-card', grid);
        card.appendChild(Core.canvasFrom(Core.art.thumb(c, 'normal')));
        el('div', 'nm', card, Core.charName(c));
        card.addEventListener('click', function (e) {
          e.stopPropagation();
          if (over) return;
          if (c === def.answer) { over = true; succeed('就是你！').then(done); return; }
          if (wrong(L, ban, def, state, '……不，不是这个人。')) cards.forEach(function (x) { if (x._c === def.answer) x.classList.add('hl'); });
        });
        card._c = c; cards.push(card);
      });
    });
  }

  // ======================================================
  // 灵光拼字
  // ======================================================
  function keyword(def) {
    return new Promise(function (done) {
      var L = layer(); R.setDim(0.7);
      var ban = banner(L, def.title || '灵光拼字');
      var state = { n: 0 };
      var p = el('div', 'g-panel', L);
      var pr = el('div', 'g-prompt', p); pr.textContent = def.prompt;
      var ans = Array.from(def.answer), pos = 0;
      var slots = el('div', 'kw-slots', p), slotEls = ans.map(function () { return el('div', 'kw-slot', slots); });
      var field = el('div', 'kw-field', p);
      var chars = ans.concat(Array.from(def.decoys || '')).filter(function (c) { return c.trim(); });
      var rnd = Core.rng(Core.hash(def.answer));
      Core.shuffle(chars, rnd);
      var btns = [];
      var cols = Math.min(8, chars.length), rows = Math.ceil(chars.length / cols);
      chars.forEach(function (ch, i) {
        var b = el('button', 'kw-ch', field, ch);
        var cx = (i % cols + 0.5) / cols, cy = (Math.floor(i / cols) + 0.5) / rows;
        b.style.left = (8 + cx * 84 + (rnd() - 0.5) * 6) + '%';
        b.style.top = (14 + cy * 72 + (rnd() - 0.5) * 10) + '%';
        b.style.animationDelay = (-rnd() * 6).toFixed(2) + 's';
        b.style.animationDuration = (4 + rnd() * 4).toFixed(2) + 's';
        b._ch = ch;
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          if (pos >= ans.length) return;
          if (b._ch === ans[pos]) {
            DM.Audio.se('ok');
            b.classList.add('used');
            slotEls[pos].textContent = b._ch; slotEls[pos].classList.add('fill');
            pos++;
            btns.forEach(function (x) { x.classList.remove('hl'); });
            if (pos >= ans.length) { setTimeout(function () { succeed('原来如此！').then(done); }, 250); }
            else if (state.n >= thresholds().hl) hlNext();
          } else {
            b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
            if (wrong(L, ban, def, state, '……这个字接不上。')) hlNext();
          }
        });
        btns.push(b);
      });
      function hlNext() { for (var i = 0; i < btns.length; i++) if (!btns[i].classList.contains('used') && btns[i]._ch === ans[pos]) { btns[i].classList.add('hl'); break; } }
    });
  }

  // ======================================================
  // 推理回廊
  // ======================================================
  function logic(def) {
    return new Promise(function (done) {
      var L = layer();
      var bg = el('div', 'logic-bg', L);
      for (var i = 0; i < 6; i++) { var r = el('div', 'ring', bg); r.style.animationDelay = (-i * 0.4) + 's'; }
      var ban = banner(L, def.title || '推理回廊');
      var qs = def.questions, qi = 0;
      var state = { n: 0 };
      function ask() {
        var old = L.querySelector('.logic-box'); if (old) old.remove();
        var q = qs[qi];
        var box = el('div', 'logic-box', L);
        el('div', 'qn', box, '第 ' + (qi + 1) + ' 问 / 共 ' + qs.length + ' 问');
        el('div', 'q', box, q.q);
        var opts = el('div', 'opts', box), bs = [];
        var local = { n: 0 };
        q.opts.forEach(function (o, j) {
          var b = el('button', 'btn', opts, ['Ａ', 'Ｂ', 'Ｃ', 'Ｄ'][j] + '　' + o);
          b.addEventListener('click', function (e) {
            e.stopPropagation();
            if (box._done) return;
            if (j === q.a) {
              box._done = true;
              DM.Audio.se('ok');
              qi++;
              if (qi >= qs.length) { box.remove(); succeed('推理贯通！').then(done); }
              else { DM.Audio.se('slash'); ask(); }
            } else {
              local.n++;
              var hl = wrong(L, ban, def, state, '……不对，再想想。');
              if (hl || local.n >= thresholds().hl) bs[q.a].classList.add('hl');
            }
          });
          bs.push(b);
        });
      }
      DM.Audio.se('heartbeat');
      ask();
    });
  }

  // ======================================================
  // 真相重演
  // ======================================================
  function reconstruct(def) {
    return new Promise(function (done) {
      var L = layer(); R.setDim(0.75);
      var ban = banner(L, def.title || '真相重演');
      var state = { n: 0 };
      var p = el('div', 'g-panel', L);
      var area = el('div', 'recon-panel', p);
      var panels = def.panels, pi = 0, filled = [];
      function render() {
        Core.clear(area);
        var pnl = panels[pi];
        var fr = el('div', 'recon-frame', area);
        el('div', 'no', fr, '第 ' + (pi + 1) + ' 格 / 共 ' + panels.length + ' 格');
        var parts = pnl.text.split('【？】');
        parts.forEach(function (t, j) {
          fr.appendChild(document.createTextNode(t));
          if (j < parts.length - 1) el('span', 'blank', fr, '？');
        });
        var opts = el('div', 'recon-opts', area), bs = [];
        var local = { n: 0 };
        pnl.opts.forEach(function (o, j) {
          var b = el('button', 'btn', opts, o);
          b.addEventListener('click', function (e) {
            e.stopPropagation();
            if (fr._done) return;
            if (j === pnl.a) {
              fr._done = true;
              DM.Audio.se('ok');
              var bl = fr.querySelector('.blank'); if (bl) bl.textContent = o;
              filled.push(pnl.text.replace('【？】', '【' + o + '】'));
              Array.prototype.forEach.call(opts.children, function (x) { x.disabled = true; });
              setTimeout(function () { pi++; if (pi >= panels.length) summary(); else render(); }, 650);
            } else {
              local.n++;
              if (wrong(L, ban, def, state, '……这一格不对。') || local.n >= thresholds().hl) bs[pnl.a].classList.add('hl');
            }
          });
          bs.push(b);
        });
      }
      function summary() {
        Core.clear(area);
        area.style.justifyContent = 'flex-start';
        var t = el('div', 'g-prompt', area); t.textContent = '真相，就是这样——'; t.style.width = '100%';
        var all = el('div', 'recon-all', area); all.style.width = '100%';
        filled.forEach(function (tx, i) {
          var m = el('div', 'mini', all);
          m.innerHTML = '<b>' + (i + 1) + '.</b> ' + tx.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }).replace(/【([^】]*)】/g, '<b>$1</b>');
        });
        var f = el('div', 'g-foot', area); f.style.width = '100%';
        var b = el('button', 'btn gold', f, '这就是真相');
        b.addEventListener('click', function (e) { e.stopPropagation(); if (b._done) return; b._done = true; succeed('这就是真相！').then(done); });
      }
      render();
    });
  }

  // ======================================================
  // 投票
  // ======================================================
  function vote(def) {
    return new Promise(function (done) {
      var L = layer(); R.setDim(0.7);
      var ban = banner(L, '投票');
      var state = { n: 0 };
      var p = el('div', 'g-panel', L);
      var pr = el('div', 'g-prompt', p); pr.textContent = def.prompt || '凶手是——请投下你的一票。';
      var grid = el('div', 'pick-grid', p), cards = [];
      DM.Audio.se('heartbeat');
      def.options.forEach(function (c) {
        var card = el('div', 'pick-card', grid);
        card.appendChild(Core.canvasFrom(Core.art.thumb(c, 'normal')));
        el('div', 'nm', card, Core.charName(c));
        card.addEventListener('click', function (e) {
          e.stopPropagation();
          if (L.querySelector('.vote-result')) return;
          if (c !== def.answer) {
            wrong(L, ban, def, state, '……真的是这个人吗？把推理再走一遍。');
            card.style.opacity = '.35';
            return;
          }
          DM.Audio.se('gavel');
          var res = el('div', 'vote-result', L);
          el('div', 'r1', res, '投 票 结 果');
          var cv = Core.canvasFrom(Core.art.thumb(c, 'shock')); res.appendChild(cv);
          el('div', 'r2', res, Core.charName(c));
          var r3 = el('div', '', res, '—— 全员一致 ——'); r3.style.cssText = 'margin-top:8px;color:#ff4b67;letter-spacing:6px';
          el('div', 'tapnote', res, '点击继续');
          UI.flash('red');
          res.addEventListener('click', function (ev) { ev.stopPropagation(); DM.Audio.se('select'); done(); });
        });
        card._c = c; cards.push(card);
      });
    });
  }
})();
