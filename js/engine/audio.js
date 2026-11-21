/* 程序化音频：芯片音乐风 BGM（步进音序器）+ 合成音效。无任何音频文件。
 * 性能：单个 setInterval 调度器（前瞻 0.15s），每个音符一组 osc+gain，用完即释放。
 */
(function () {
  'use strict';
  var DM = window.DM = window.DM || {};
  var A = DM.Audio = {};
  var ctx = null, master, bgmBus, seBus, noiseBuf = null;
  var vol = { bgm: 0.55, se: 0.7 };

  A.ready = false;
  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = vol.bgm * 0.5; bgmBus.connect(comp);
    seBus = ctx.createGain(); seBus.gain.value = vol.se; seBus.connect(comp);
    // 混响（生成的冲激响应）：让合成音色更有空间感；低画质预设（老设备）关闭以省电
    try {
      var lowEnd = DM.State && DM.State.settings.preset === 'low';
      if (!lowEnd && ctx.createConvolver) {
        var len = Math.floor(ctx.sampleRate * 2.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
          var dd = ir.getChannelData(ch), sd = 777 + ch * 31;
          for (var j = 0; j < len; j++) { sd = (sd * 1103515245 + 12345) & 0x7fffffff; dd[j] = (sd / 0x3fffffff - 1) * Math.pow(1 - j / len, 3.2); }
        }
        var conv = ctx.createConvolver(); conv.buffer = ir;
        var wet = ctx.createGain(); wet.gain.value = 0.22; conv.connect(wet); wet.connect(comp);
        var send1 = ctx.createGain(); send1.gain.value = 0.55; bgmBus.connect(send1); send1.connect(conv);
        var send2 = ctx.createGain(); send2.gain.value = 0.35; seBus.connect(send2); send2.connect(conv);
      }
    } catch (e) { /* 不支持就算了 */ }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0), s = 1234567;
    for (var i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
    A.ready = true;
    if (pendingBgm) { var p = pendingBgm; pendingBgm = null; A.bgm(p); }
  };
  A.setVolume = function (kind, v) {
    vol[kind] = v;
    if (!ctx) return;
    if (kind === 'bgm') bgmBus.gain.setTargetAtTime(v * 0.5, ctx.currentTime, 0.05);
    else seBus.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  };

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---------- 基础发声 ----------
  function tone(bus, type, freq, t, dur, gain, opt) {
    opt = opt || {};
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (opt.slideTo) o.frequency.exponentialRampToValueAtTime(opt.slideTo, t + dur);
    if (opt.detune) o.detune.value = opt.detune;
    var a = opt.attack || 0.005, r = opt.release || Math.min(0.12, dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + a);
    g.gain.setValueAtTime(gain, Math.max(t + a, t + dur - r));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(bus, t, dur, gain, ftype, freq, q, opt) {
    opt = opt || {};
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.setValueAtTime(freq || 1000, t);
    if (opt.sweepTo) f.frequency.exponentialRampToValueAtTime(opt.sweepTo, t + dur);
    f.Q.value = q || 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (opt.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  // ---------- 音乐 ----------
  var SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10], hminor: [0, 2, 3, 5, 7, 8, 11], major: [0, 2, 4, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], penta: [0, 3, 5, 7, 10, 12, 15],
    miyako: [0, 1, 5, 7, 8]
  };
  function deg(scale, root, d) {
    var n = scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n;
    return root + scale[i] + 12 * o;
  }
  // 旋律串："4 - 2 . 0" —— 数字=音阶级数，- 延长，. 休止
  function parseMel(str) {
    var tk = str.trim().split(/\s+/).filter(function (t) { return t !== '|'; });
    var notes = [], last = null;
    for (var i = 0; i < tk.length; i++) {
      var t = tk[i];
      if (t === '-') { if (last) last.dur++; continue; }
      if (t === '.') { last = null; continue; }
      last = { start: i, dur: 1, d: parseInt(t, 10) };
      notes.push(last);
    }
    return { notes: notes, len: tk.length };
  }

  // 七鸦之歌（摇篮曲）
  var LULLABY = '4 - 4 - 2 - 4 - | 5 - 4 - 2 - - - | 3 - 3 - 1 - 3 - | 4 - 2 - 0 - - - | ' +
                '4 - 7 - 6 - 5 - | 4 - 2 - 4 - - - | 3 - 2 - 1 - 3 - | 2 - 1 - 0 - - - |';

  var TRACKS = {
    title:   { bpm: 66, root: 57, scale: 'hminor', prog: [0, 5, 3, 4, 0, 5, 1, 4], style: 'pad', mel: LULLABY, melWave: 'triangle', melOct: 12, arp: 'box', drums: null },
    daily:   { bpm: 100, root: 53, scale: 'dorian', prog: [0, 3, 6, 4], style: 'bounce', arp: 'up', mel: '4 . 4 5 4 . 2 . 3 . 2 . 1 . . . | 2 . 2 3 2 . 0 . 1 . 2 . 4 . . . | 4 . 4 5 6 . 5 . 4 . 2 . 3 . . . | 2 . 1 . 0 . 1 . 2 - - - . . . .', melWave: 'square', melOct: 12, drums: 'light' },
    calm:    { bpm: 78, root: 50, scale: 'dorian', prog: [0, 3, 0, 4], style: 'pad', arp: 'slow', drums: null },
    island:  { bpm: 88, root: 52, scale: 'minor', prog: [0, 5, 6, 4], style: 'pad', arp: 'up', mel: '7 . . . 4 . 5 . 4 . 2 . . . . . | 3 . . . 2 . 0 . 2 - - - . . . . | 7 . . . 9 . 7 . 6 . 4 . . . . . | 5 . 4 . 2 . 4 . 4 - - - . . . .', melWave: 'triangle', melOct: 12, drums: null },
    mystery: { bpm: 84, root: 48, scale: 'phrygian', prog: [0, 1, 0, 6], style: 'sparse', arp: 'pizz', mel: '. . 4 . . . 5 . 4 . . . 1 . . . | . . 2 . . . 1 . 0 - - - . . . . | . . 4 . . . 5 . 7 . . . 6 . . . | . . 5 . . . 4 . 1 - - - . . . .', melWave: 'triangle', melOct: 12, drums: 'tick' },
    investigate: { bpm: 104, root: 55, scale: 'minor', prog: [0, 0, 5, 4], style: 'walk', arp: 'pizz', drums: 'hat', mel: '. . . . 4 . 3 . 2 . 3 . 4 . . . | . . . . 5 . 4 . 3 . 2 . 1 . . . | . . . . 4 . 3 . 2 . 3 . 4 . 7 . | 6 . 5 . 4 . 3 . 4 - - - . . . .', melWave: 'square', melOct: 0 },
    tension: { bpm: 120, root: 47, scale: 'phrygian', prog: [0, 1, 0, 1, 0, 6, 5, 1], style: 'pulse', arp: 'none', drums: 'heart' },
    horror:  { bpm: 56, root: 45, scale: 'phrygian', prog: [0, 1], style: 'drone', arp: 'random', drums: null },
    sad:     { bpm: 62, root: 57, scale: 'minor', prog: [0, 5, 3, 4, 0, 5, 1, 4], style: 'pad', arp: 'slow', mel: LULLABY, melWave: 'sine', melOct: 0, drums: null },
    trial:   { bpm: 112, root: 50, scale: 'hminor', prog: [0, 5, 3, 4, 0, 5, 1, 4], style: 'march', arp: 'up', drums: 'march', mel: '4 . 4 . 5 . 4 . 2 - - - . . . . | 3 . 3 . 4 . 3 . 1 - - - . . . . | 4 . 4 . 7 . 6 . 5 . 4 . 3 . 2 . | 1 . 2 . 3 . 1 . 4 - - - . . . . | 7 . 6 . 5 . 4 . 2 - - - . . 4 . | 5 . 4 . 3 . 2 . 1 - - - . . . . | 4 . 5 . 6 . 7 . 8 . 7 . 6 . 4 . | 3 . 2 . 1 . 6 . 0 - - - . . . .', melWave: 'square', melOct: 12 },
    debate:  { bpm: 140, root: 52, scale: 'minor', prog: [0, 5, 6, 4, 0, 5, 3, 4], style: 'drive', arp: 'fast', drums: 'rock', mel: '7 . . 7 . . 6 . 7 . . . 4 . 5 . | 6 . . 6 . . 5 . 4 . . . 2 . . . | 7 . . 7 . . 9 . 10 . . . 9 . 7 . | 6 . 5 . 4 . 5 . 6 - - - . . . . | 4 . . 4 . . 5 . 6 . . . 7 . 6 . | 5 . . 5 . . 4 . 2 . . . 4 . . . | 7 . 6 . 5 . 4 . 3 . 4 . 5 . 6 . | 7 - - - 6 - - - 4 - - - . . . .', melWave: 'square', melOct: 12 },
    truth:   { bpm: 128, root: 48, scale: 'minor', prog: [0, 5, 6, 2, 3, 0, 4, 4], style: 'drive', arp: 'fast', drums: 'rock', mel: '0 . 2 . 4 . 7 - - - 6 . 4 . . . | 5 . 4 . 2 . 4 - - - . . . . . . | 6 . 7 . 9 . 7 - - - 6 . 4 . . . | 5 . 6 . 7 . 4 - - - . . . . . . | 9 . 7 . 6 . 7 - - - 4 . 5 . . . | 6 . 5 . 4 . 2 - - - . . . . . . | 4 . 5 . 6 . 7 . 9 . 10 . 11 . 12 . | 11 - - - 10 - - - 9 - - - 7 - - -', melWave: 'square', melOct: 12 },
    judge:   { bpm: 90, root: 42, scale: 'phrygian', prog: [0, 1, 0, 5], style: 'organ', arp: 'bell', drums: null },
    finale:  { bpm: 132, root: 50, scale: 'hminor', prog: [0, 5, 3, 4, 0, 5, 6, 4], style: 'drive', arp: 'fast', drums: 'rock', mel: LULLABY, melWave: 'square', melOct: 12 },
    ending:  { bpm: 72, root: 60, scale: 'major', prog: [0, 5, 3, 4, 0, 5, 3, 4], style: 'pad', arp: 'box', mel: LULLABY, melWave: 'triangle', melOct: 0, drums: null },
    snow:    { bpm: 60, root: 54, scale: 'minor', prog: [0, 5, 3, 4, 0, 5, 6, 4], style: 'pad', arp: 'box', mel: '4 - - . 3 . 2 - - - . . . . . . | 0 - - . 2 . 3 - - - . . . . . . | 4 - - . 5 . 7 - - - 6 . 5 . . . | 4 - - - - - - - . . . . . . . .', melWave: 'sine', melOct: 12, drums: null },
    village: { bpm: 76, root: 52, scale: 'miyako', prog: [0, 0, 3, 2, 0, 0, 3, 4], style: 'sparse', arp: 'pizz', mel: '. . 4 . 3 . 2 . . . 1 . 0 . . . | . . 2 . 3 . 4 . 5 - - - . . . . | . . 7 . 6 . 5 . . . 4 . 3 . . . | . . 2 . 1 . 0 - - - - - . . . .', melWave: 'triangle', melOct: 12, drums: 'tick' },
    lament:  { bpm: 52, root: 50, scale: 'miyako', prog: [0, 1, 0, 3], style: 'drone', arp: 'bell', mel: '4 - - - 3 - 2 - 1 - - - . . . . | 2 - - - 1 - 0 - - - - - . . . .', melWave: 'sine', melOct: 12, drums: null }
  };

  var DRUMS = {
    light: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
    tick:  { k: 'x...............', s: '................', h: '....x.......x...' },
    hat:   { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
    heart: { k: 'x..x............', s: '................', h: '................' },
    march: { k: 'x.......x.......', s: '....x..x....x.xx', h: 'x.x.x.x.x.x.x.x.' },
    rock:  { k: 'x.....x.x.......', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' }
  };

  function buildTrack(def) {
    var sc = SCALES[def.scale], root = def.root, bars = def.prog.length, steps = bars * 16;
    var ev = []; // {step, midi, dur, wave, gain}
    var mel = def.mel ? parseMel(def.mel) : null;
    for (var b = 0; b < bars; b++) {
      var dg = def.prog[b], base = b * 16;
      var chord = [deg(sc, root, dg), deg(sc, root, dg + 2), deg(sc, root, dg + 4)];
      var bass = chord[0] - 12;
      switch (def.style) {
        case 'pad':
          chord.forEach(function (m) { ev.push({ s: base, m: m, d: 16, w: 'triangle', g: 0.05 }); });
          ev.push({ s: base, m: bass, d: 8, w: 'triangle', g: 0.12 }); ev.push({ s: base + 8, m: bass, d: 8, w: 'triangle', g: 0.1 });
          break;
        case 'bounce':
          [0, 4, 8, 12].forEach(function (k, i) { ev.push({ s: base + k, m: i % 2 ? chord[2] - 12 : bass, d: 3, w: 'triangle', g: 0.13 }); });
          break;
        case 'sparse':
          ev.push({ s: base, m: bass, d: 6, w: 'triangle', g: 0.13 }); ev.push({ s: base + 10, m: bass + 1, d: 4, w: 'triangle', g: 0.08 });
          break;
        case 'walk':
          [0, 4, 8, 12].forEach(function (k, i) { ev.push({ s: base + k, m: deg(sc, root - 12, dg + [0, 2, 4, 3][i]), d: 3, w: 'triangle', g: 0.13 }); });
          break;
        case 'pulse':
          for (var k = 0; k < 16; k += 2) ev.push({ s: base + k, m: bass, d: 1, w: 'sawtooth', g: 0.05 });
          ev.push({ s: base, m: chord[0], d: 16, w: 'triangle', g: 0.04 }); ev.push({ s: base, m: chord[0] + 1, d: 16, w: 'triangle', g: 0.025 });
          break;
        case 'drone':
          ev.push({ s: base, m: root - 12, d: 16, w: 'sawtooth', g: 0.03 }); ev.push({ s: base, m: root - 11 + (b % 2), d: 16, w: 'triangle', g: 0.04 });
          break;
        case 'march':
          [0, 3, 4, 8, 11, 12].forEach(function (k) { ev.push({ s: base + k, m: bass, d: 1, w: 'triangle', g: 0.14 }); });
          chord.forEach(function (m) { ev.push({ s: base, m: m, d: 6, w: 'square', g: 0.025 }); ev.push({ s: base + 8, m: m, d: 6, w: 'square', g: 0.02 }); });
          break;
        case 'drive':
          for (var q = 0; q < 16; q++) ev.push({ s: base + q, m: q % 4 === 3 ? bass + 12 : bass, d: 1, w: 'triangle', g: 0.13 });
          chord.forEach(function (m) { ev.push({ s: base, m: m, d: 14, w: 'sawtooth', g: 0.012 }); });
          break;
        case 'organ':
          chord.forEach(function (m) { ev.push({ s: base, m: m - 12, d: 16, w: 'square', g: 0.025 }); ev.push({ s: base, m: m, d: 16, w: 'sine', g: 0.04 }); });
          break;
      }
      // 琶音
      var ap = def.arp, notes;
      if (ap === 'up') notes = [[0, 0], [4, 1], [8, 2], [12, 1]];
      else if (ap === 'fast') notes = [[0, 0], [2, 1], [4, 2], [6, 1], [8, 0], [10, 1], [12, 2], [14, 3]];
      else if (ap === 'box') notes = [[0, 2], [2, 1], [4, 0], [6, 1], [8, 2], [10, 3], [12, 2], [14, 1]];
      else if (ap === 'slow') notes = [[0, 0], [6, 1], [12, 2]];
      else if (ap === 'pizz') notes = [[2, 2], [6, 1], [10, 2], [14, 0]];
      else if (ap === 'bell') notes = [[0, 3], [7, 2]];
      else if (ap === 'random') notes = [[(b * 7) % 16, (b % 3)]];
      else notes = [];
      notes.forEach(function (n) {
        var m = n[1] === 3 ? chord[0] + 12 : chord[n[1]];
        var w = ap === 'box' || ap === 'bell' ? 'sine' : (ap === 'fast' ? 'square' : 'triangle');
        var g = ap === 'box' ? 0.05 : ap === 'bell' ? 0.07 : ap === 'random' ? 0.04 : 0.04;
        ev.push({ s: base + n[0], m: m + (ap === 'box' || ap === 'bell' || ap === 'random' ? 12 : 0), d: ap === 'bell' ? 6 : 2, w: w, g: g });
      });
    }
    if (mel) {
      var reps = Math.max(1, Math.round(steps / mel.len));
      for (var r = 0; r < reps; r++) mel.notes.forEach(function (n) {
        var st = n.start + r * mel.len;
        if (st < steps) ev.push({ s: st, m: deg(sc, root, n.d) + (def.melOct || 0), d: n.dur, w: def.melWave || 'square', g: def.melWave === 'square' ? 0.045 : 0.08, lead: true });
      });
    }
    // 按步索引
    var byStep = new Array(steps);
    ev.forEach(function (e) { var s = e.s % steps; (byStep[s] = byStep[s] || []).push(e); });
    return { steps: steps, byStep: byStep, spb: 60 / def.bpm / 4, drums: def.drums ? DRUMS[def.drums] : null };
  }

  var cache = {}, cur = null, curId = null, timer = null, nextT = 0, step = 0, pendingBgm = null, trackGain = null;

  function schedule() {
    if (!cur || !ctx) return;
    var ahead = ctx.currentTime + 0.15;
    while (nextT < ahead) {
      var list = cur.byStep[step];
      if (list) for (var i = 0; i < list.length; i++) {
        var e = list[i];
        tone(trackGain, e.w, mtof(e.m), nextT, e.d * cur.spb, e.g, e.lead ? { attack: 0.01, detune: 0 } : null);
      }
      if (cur.drums) {
        var k = step % 16, dr = cur.drums;
        if (dr.k[k] === 'x') tone(trackGain, 'sine', 120, nextT, 0.12, 0.35, { slideTo: 40 });
        if (dr.s[k] === 'x') noise(trackGain, nextT, 0.11, 0.12, 'bandpass', 1800, 0.8);
        if (dr.h[k] === 'x') noise(trackGain, nextT, 0.03, 0.035, 'highpass', 7000, 1);
      }
      nextT += cur.spb;
      step = (step + 1) % cur.steps;
    }
  }

  A.bgm = function (id) {
    if (id === curId) return;
    if (!ctx || !A.ready) { pendingBgm = id; curId = null; return; }
    // 淡出旧轨
    if (trackGain) {
      var old = trackGain;
      old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
      setTimeout(function () { try { old.disconnect(); } catch (e) {} }, 1500);
      trackGain = null;
    }
    curId = id;
    if (!id || id === 'stop' || id === 'none' || !TRACKS[id]) { cur = null; return; }
    cur = cache[id] || (cache[id] = buildTrack(TRACKS[id]));
    trackGain = ctx.createGain(); trackGain.gain.value = 0.0001; trackGain.connect(bgmBus);
    trackGain.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    nextT = ctx.currentTime + 0.08; step = 0;
    if (!timer) timer = setInterval(schedule, 40);
  };
  A.currentBgm = function () { return curId; };
  A.pause = function () { if (ctx && ctx.state === 'running') ctx.suspend(); };
  A.resume = function () { if (ctx && ctx.state === 'suspended') ctx.resume(); };

  // ---------- 音效 ----------
  var SE = {
    select: function (t) { tone(seBus, 'square', 880, t, 0.05, 0.08); },
    ok: function (t) { tone(seBus, 'square', 660, t, 0.07, 0.1); tone(seBus, 'square', 990, t + 0.07, 0.1, 0.1); },
    ng: function (t) { tone(seBus, 'sawtooth', 160, t, 0.22, 0.14, { slideTo: 90 }); },
    door: function (t) { noise(seBus, t, 0.25, 0.4, 'lowpass', 400, 1); tone(seBus, 'sine', 90, t, 0.2, 0.3, { slideTo: 50 }); },
    knock: function (t) { [0, 0.18, 0.36].forEach(function (d) { tone(seBus, 'sine', 160, t + d, 0.08, 0.5, { slideTo: 80 }); noise(seBus, t + d, 0.05, 0.2, 'lowpass', 800); }); },
    bell: function (t) { [1, 2.76, 5.4].forEach(function (h, i) { tone(seBus, 'sine', 196 * h, t, 3.2 - i * 0.8, 0.22 / (i + 1), { attack: 0.002, release: 2.5 - i * 0.6 }); }); },
    thunder: function (t) { noise(seBus, t, 2.6, 0.7, 'lowpass', 300, 0.7, { attack: 0.02, sweepTo: 60 }); noise(seBus, t, 0.3, 0.4, 'lowpass', 1500); },
    scream: function (t) { tone(seBus, 'sawtooth', 900, t, 0.55, 0.12, { slideTo: 1400 }); tone(seBus, 'square', 1300, t + 0.05, 0.5, 0.05, { slideTo: 700 }); },
    crash: function (t) { noise(seBus, t, 0.5, 0.5, 'highpass', 2500, 0.5); noise(seBus, t + 0.05, 0.35, 0.3, 'bandpass', 5000, 2); },
    glass: function (t) { [0, 0.04, 0.09, 0.15].forEach(function (d, i) { tone(seBus, 'sine', 3000 + i * 700, t + d, 0.25, 0.05); }); noise(seBus, t, 0.25, 0.25, 'highpass', 6000); },
    footsteps: function (t) { for (var i = 0; i < 4; i++) noise(seBus, t + i * 0.28, 0.07, 0.3, 'lowpass', 500); },
    splash: function (t) { noise(seBus, t, 0.8, 0.5, 'lowpass', 1800, 0.5, { sweepTo: 300 }); },
    fire: function (t) { for (var i = 0; i < 10; i++) noise(seBus, t + i * 0.09 + Math.random() * 0.05, 0.05, 0.25, 'bandpass', 2000 + Math.random() * 2000, 2); noise(seBus, t, 1.2, 0.2, 'lowpass', 500); },
    wave: function (t) { noise(seBus, t, 2.4, 0.35, 'lowpass', 900, 0.6, { attack: 0.8, sweepTo: 300 }); },
    getitem: function (t) { [0, 4, 7, 12].forEach(function (n, i) { tone(seBus, 'square', mtof(72 + n), t + i * 0.07, 0.16, 0.08); }); },
    gavel: function (t) { tone(seBus, 'sine', 140, t, 0.3, 0.6, { slideTo: 60 }); noise(seBus, t, 0.12, 0.5, 'lowpass', 1200); },
    heartbeat: function (t) { tone(seBus, 'sine', 70, t, 0.14, 0.7, { slideTo: 40 }); tone(seBus, 'sine', 64, t + 0.22, 0.14, 0.5, { slideTo: 38 }); },
    shout: function (t) { [0, 3, 7].forEach(function (n) { tone(seBus, 'sawtooth', mtof(57 + n), t, 0.4, 0.07); }); noise(seBus, t, 0.2, 0.3, 'bandpass', 1500, 1); },
    slash: function (t) { noise(seBus, t, 0.28, 0.5, 'bandpass', 1200, 1.5, { sweepTo: 7000 }); tone(seBus, 'square', 220, t + 0.05, 0.3, 0.08, { slideTo: 880 }); },
    clock: function (t) { tone(seBus, 'square', 2200, t, 0.02, 0.08); tone(seBus, 'square', 1800, t + 0.5, 0.02, 0.08); },
    phone: function (t) { for (var i = 0; i < 6; i++) { tone(seBus, 'square', 1300, t + i * 0.1, 0.05, 0.05); } },
    wind: function (t) { noise(seBus, t, 3.2, 0.32, 'bandpass', 500, 0.9, { attack: 1.1, sweepTo: 1400 }); noise(seBus, t + 0.6, 2.4, 0.18, 'bandpass', 900, 2, { attack: 0.8, sweepTo: 400 }); },
    chime: function (t) { [784, 659, 698, 523].forEach(function (f, i) { tone(seBus, 'sine', f, t + i * 0.55, 1.4, 0.16, { attack: 0.01, release: 1.1 }); tone(seBus, 'sine', f * 2, t + i * 0.55, 0.8, 0.03, { release: 0.6 }); }); },
    snowstep: function (t) { for (var i = 0; i < 4; i++) { noise(seBus, t + i * 0.34, 0.12, 0.28, 'highpass', 1800, 0.7); noise(seBus, t + i * 0.34 + 0.03, 0.09, 0.2, 'lowpass', 600, 1); } },
    creak: function (t) { tone(seBus, 'sawtooth', 120, t, 0.7, 0.07, { slideTo: 190 }); tone(seBus, 'square', 240, t + 0.1, 0.5, 0.03, { slideTo: 170 }); }
  };
  A.se = function (id) {
    if (!ctx || !A.ready || !SE[id]) return;
    try { SE[id](ctx.currentTime + 0.01); } catch (e) { /* ignore */ }
  };

  // 打字音：根据角色哈希变化音高；节流
  var lastBlip = 0;
  A.blip = function (seed) {
    if (!ctx || !A.ready || vol.se <= 0) return;
    var now = ctx.currentTime;
    if (now - lastBlip < 0.055) return;
    lastBlip = now;
    var f = 420 + (seed % 7) * 55;
    tone(seBus, 'square', f, now + 0.005, 0.03, 0.025);
  };
})();
