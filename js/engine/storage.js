/* 存档位置：把存档读写到玩家指定的文件夹（OneDrive / Dropbox 等云盘文件夹、外置硬盘），换电脑也能继续玩。
 *
 *  - Chrome / Edge（桌面）：文件系统访问 API。玩家授权一个文件夹后，所有存档位、自动存档、分歧点存档、
 *    章节/结局进度都会写进「该文件夹/<本作子文件夹>/」，并与浏览器本地存档双向同步（每个存档位以较新的为准）。
 *    文件夹句柄记在 IndexedDB 里，下次打开自动重连（若浏览器要求，再点一次授权即可）；切回游戏窗口时重新同步。
 *  - 其他浏览器（Firefox、Safari、手机）：导出 / 导入存档文件（.dmsave），玩家自己把文件放进云盘。
 *  - 浏览器本地（localStorage）始终作为缓存，读档是同步的；外部文件夹异步写入。
 *  - 画质等设置是设备相关的，不同步。
 * 注意：本文件只用 ES5 语法 + Promise，旧浏览器上即使没有这些 API 也不会报错。
 */
(function () {
  'use strict';
  var DM = window.DM, St = DM.State, GM = DM.GAME;
  var S = DM.Storage = {};

  S.fsSupported = typeof window.showDirectoryPicker === 'function' && !!window.indexedDB;
  S.state = 'local';      // local | connected | needs-permission | error
  S.root = null;          // 玩家选的文件夹
  S.dir = null;           // 本作子文件夹
  S.rootName = '';
  S.lastSync = 0;
  S.lastError = '';
  S.listeners = [];
  var SUB = GM.saveFolder || GM.id || 'darkmood';
  function fname(slot) { return 'slot_' + slot + '.json'; }
  function emit() { S.listeners.forEach(function (f) { try { f(S.state); } catch (e) { /* ignore */ } }); }
  S.onChange = function (f) { S.listeners.push(f); };
  function parse(t) { if (!t) return null; try { return JSON.parse(t); } catch (e) { return null; } }

  // ---------- IndexedDB：记住文件夹句柄 ----------
  var DBN = (GM.storage || 'darkmood_') + 'savedir';
  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      var r;
      try { r = indexedDB.open(DBN, 1); } catch (e) { rej(e); return; }
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onerror = function () { rej(r.error); };
      r.onsuccess = function () {
        var db = r.result, tx, q;
        try { tx = db.transaction('kv', mode); q = fn(tx.objectStore('kv')); } catch (e) { db.close(); rej(e); return; }
        tx.oncomplete = function () { db.close(); res(q ? q.result : undefined); };
        tx.onerror = function () { db.close(); rej(tx.error); };
      };
    });
  }
  function idbGet(k) { return idb('readonly', function (st) { return st.get(k); }); }
  function idbSet(k, v) { return idb('readwrite', function (st) { return st.put(v, k); }); }
  function idbDel(k) { return idb('readwrite', function (st) { return st['delete'](k); }); }

  // ---------- 文件读写 ----------
  function readFile(dir, name) {
    return dir.getFileHandle(name).then(function (fh) { return fh.getFile(); })
      .then(function (f) { return f.text(); })
      .then(null, function () { return null; });
  }
  function writeFile(dir, name, text) {
    return dir.getFileHandle(name, { create: true }).then(function (fh) { return fh.createWritable(); })
      .then(function (w) { return w.write(text).then(function () { return w.close(); }); });
  }
  function fail(e) {
    S.lastError = (e && (e.message || e.name)) || String(e);
    console.warn('[存档文件夹]', e);
    if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) { S.state = 'needs-permission'; S.dir = null; }
    else if (e && e.name === 'NotFoundError') { S.state = 'error'; S.dir = null; }
    emit();
    if (DM.UI && DM.UI.toast && document.getElementById('toast')) DM.UI.toast('存档文件夹', '写入失败，存档已保存在浏览器本地', 'note');
  }

  // ---------- 写入钩子（state.js 的 St.write / 进度保存会调用） ----------
  var pending = {}, timer = null;
  St.persist = function (kind, key, raw) {
    if (!S.dir) return;
    pending[kind === 'progress' ? 'progress.json' : fname(key)] = raw;
    clearTimeout(timer);
    timer = setTimeout(S.flush, 500);
  };
  S.flush = function () {
    clearTimeout(timer); timer = null;
    var dir = S.dir, p = pending; pending = {};
    if (!dir) return Promise.resolve();
    return Promise.all(Object.keys(p).map(function (n) { return writeFile(dir, n, p[n]); }))
      .then(function () { S.lastSync = Date.now(); }, fail);
  };

  // ---------- 双向同步 ----------
  var syncing = null;
  S.sync = function () {
    if (!S.dir) return Promise.resolve(0);
    if (syncing) return syncing;
    var dir = S.dir, pulled = 0;
    var jobs = St.SLOT_KEYS.map(function (k) {
      return readFile(dir, fname(k)).then(function (txt) {
        var remote = parse(txt), local = St.read(k);
        if (remote && remote.s && (!local || (remote.time || 0) > (local.time || 0))) { St.writeLocal(k, remote); pulled++; }
        else if (local && (!remote || (local.time || 0) > (remote.time || 0))) return writeFile(dir, fname(k), JSON.stringify(local));
      });
    });
    jobs.push(readFile(dir, 'progress.json').then(function (txt) {
      if (St.mergeProgress(parse(txt))) pulled++;
      return writeFile(dir, 'progress.json', JSON.stringify(St.progress));
    }));
    syncing = Promise.all(jobs).then(function () {
      syncing = null; S.lastSync = Date.now(); S.state = 'connected'; emit(); return pulled;
    }, function (e) { syncing = null; fail(e); return 0; });
    return syncing;
  };

  function attach(root) {
    return root.getDirectoryHandle(SUB, { create: true }).then(function (dir) {
      S.root = root; S.dir = dir; S.rootName = root.name; S.state = 'connected';
      return idbSet('root', root).then(null, function () { /* 记不住也能用 */ });
    }).then(function () {
      return writeFile(S.dir, '说明.txt',
        GM.title + ' ' + GM.subtitle + ' 的存档文件夹。\r\n' +
        '在另一台电脑上，用 Chrome / Edge 打开游戏，在「设置 → 存档」里选择同一个文件夹，即可继续游戏。\r\n' +
        '请不要手动修改 slot_*.json 与 progress.json。\r\n').then(null, function () {});
    }).then(function () { return S.sync(); });
  }
  S._attach = attach;   // 测试用

  // 选择文件夹（必须在点击事件里调用）
  S.choose = function () {
    if (!S.fsSupported) return Promise.reject(new Error('当前浏览器不支持选择文件夹'));
    var opt = { id: 'darkmood-saves', mode: 'readwrite' };
    try { opt.startIn = 'documents'; } catch (e) { /* ignore */ }
    return window.showDirectoryPicker(opt).then(attach);
  };
  // 重新授权已记住的文件夹（必须在点击事件里调用）
  S.reconnect = function () {
    var root = S.root;
    if (!root) return Promise.reject(new Error('没有记住的文件夹'));
    return root.requestPermission({ mode: 'readwrite' }).then(function (p) {
      if (p !== 'granted') throw new Error('没有获得授权');
      return attach(root);
    });
  };
  S.disconnect = function () {
    return S.flush().then(function () {
      S.root = null; S.dir = null; S.rootName = ''; S.state = 'local'; emit();
      return idbDel('root').then(null, function () {});
    });
  };

  // 启动时：恢复记住的文件夹
  S.init = function () {
    if (!S.fsSupported) return Promise.resolve();
    return idbGet('root').then(function (root) {
      if (!root || !root.queryPermission) return;
      S.root = root; S.rootName = root.name;
      return root.queryPermission({ mode: 'readwrite' }).then(function (p) {
        if (p === 'granted') return attach(root);
        S.state = 'needs-permission'; emit();
      });
    }).then(null, function (e) { console.warn('[存档文件夹] 无法恢复', e); });
  };

  // 切回游戏窗口时，拉取另一台电脑写入的新存档
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (S.dir) S.flush(); return; }
    if (S.dir) S.sync().then(function (n) { if (n && S.onPulled) S.onPulled(n); });
  });
  window.addEventListener('pagehide', function () { if (S.dir) S.flush(); });

  // ---------- 导出 / 导入存档文件（所有浏览器可用） ----------
  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }
  S.bundle = function () {
    var b = { game: GM.id, format: 1, time: Date.now(), slots: {}, progress: St.progress };
    St.SLOT_KEYS.forEach(function (k) { var d = St.read(k); if (d) b.slots[k] = d; });
    return b;
  };
  S.exportFile = function () {
    var text = JSON.stringify(S.bundle());
    // 下载文件名只用 ASCII（部分浏览器会丢弃含中文的 download 文件名）
    var name = (String(SUB).replace(/[^A-Za-z0-9_-]+/g, '').replace(/_+$/, '') || 'DarkMood') + '-save-' + stamp() + '.dmsave';
    var blob = new Blob([text], { type: 'application/octet-stream' });
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { (window.URL || window.webkitURL).revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
    return name;
  };
  // 合并导入：每个存档位以较新的为准；进度取并集。返回 {taken, kept}
  S.importBundle = function (b) {
    if (!b || !b.slots) throw new Error('不是有效的存档文件');
    if (b.game && b.game !== GM.id) throw new Error('这是另一部作品的存档文件');
    var taken = 0, kept = 0;
    St.SLOT_KEYS.forEach(function (k) {
      var r = b.slots[k], l = St.read(k);
      if (!r || !r.s) return;
      if (!l || (r.time || 0) > (l.time || 0)) { St.write(k, r); taken++; } else kept++;
    });
    if (St.mergeProgress(b.progress) && St.persist) St.persist('progress', null, JSON.stringify(St.progress));
    return { taken: taken, kept: kept };
  };
  S.importFile = function (file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { try { res(S.importBundle(JSON.parse(fr.result))); } catch (e) { rej(e); } };
      fr.onerror = function () { rej(fr.error || new Error('读取失败')); };
      fr.readAsText(file);
    });
  };

  S.describe = function () {
    if (S.state === 'connected') return '文件夹「' + S.rootName + '」（自动同步）';
    if (S.state === 'needs-permission') return '文件夹「' + S.rootName + '」（需要重新授权）';
    if (S.state === 'error') return '文件夹不可用，暂存在浏览器本地';
    return '仅浏览器本地';
  };
})();
