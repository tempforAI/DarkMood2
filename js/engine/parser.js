/* DMS 剧本解析器：把剧本文本编译为指令数组 + 标签索引。
 * 浏览器与 Node（校验工具）共用。语法见 docs/SCRIPT_SPEC.md
 */
(function (root) {
  var DM = root.DM = root.DM || {};

  var SAY_RE = /^([a-z_][a-z0-9_]*)(\{([^}]*)\})?(\[([a-z_]+)\])?\s*[:：]\s?(.*)$/;

  // 指令 -> 参数解析方式
  //  'words'   : 按空白切分
  //  'text'    : 整行作为文本
  //  'first+text': 第一个词 + 其余文本
  var CMD = {
    bg: 'words', show: 'words', hide: 'words', bgm: 'words', se: 'words',
    weather: 'words', filter: 'words', shake: 'words', flash: 'words', fade: 'words',
    wait: 'words', title: 'text', caption: 'text', poem: 'text', shout: 'words+text',
    goto: 'words', 'if': 'text', set: 'words', inc: 'words', get: 'words',
    update: 'first+text', note: 'first+text', unlock: 'words', lock: 'words',
    explore: 'words', freetime: 'words', game: 'words', trial: 'words', flashback: 'words',
    'return': 'words', chapterend: 'words', end: 'words', bond: 'words', choice: 'words',
    letter: 'text', cg: 'words', ending: 'words', checkpoint: 'words'
  };
  DM.SCRIPT_COMMANDS = CMD;

  function unescapeText(s) {
    return s.replace(/\\n/g, '\n');
  }

  function parse(src, sourceName) {
    var lines = src.split(/\r?\n/);
    var ops = [];
    var labels = {};
    var errors = [];
    var i = 0;

    function err(lineNo, msg) {
      errors.push((sourceName || 'script') + ':' + lineNo + ' ' + msg);
    }

    while (i < lines.length) {
      var raw = lines[i];
      var lineNo = i + 1;
      var line = raw.trim();
      i++;
      if (!line || line.indexOf('//') === 0) continue;

      // 标签
      if (line.charAt(0) === '#') {
        var name = line.slice(1).trim();
        if (!/^[a-zA-Z0-9_]+$/.test(name)) { err(lineNo, '非法标签名: ' + name); continue; }
        if (labels[name] !== undefined) err(lineNo, '重复标签: ' + name);
        labels[name] = ops.length;
        continue;
      }

      // 旁白
      if (line.charAt(0) === ':' || line.charAt(0) === '：') {
        ops.push({ op: 'narr', text: unescapeText(line.slice(1).trim()), line: lineNo });
        continue;
      }

      // 内心独白
      if (line.charAt(0) === '>' || line.charAt(0) === '＞') {
        ops.push({ op: 'think', text: unescapeText(line.slice(1).trim()), line: lineNo });
        continue;
      }

      // 指令
      if (line.charAt(0) === '@') {
        var body = line.slice(1);
        var sp = body.search(/\s/);
        var cmd = sp < 0 ? body : body.slice(0, sp);
        var rest = sp < 0 ? '' : body.slice(sp + 1).trim();
        var mode = CMD[cmd];
        if (!mode) { err(lineNo, '未知指令 @' + cmd); continue; }
        var op = { op: 'cmd', cmd: cmd, line: lineNo };
        if (mode === 'words') op.args = rest ? rest.split(/\s+/) : [];
        else if (mode === 'text') op.text = unescapeText(rest);
        else if (mode === 'first+text') {
          var sp2 = rest.search(/\s/);
          op.args = [sp2 < 0 ? rest : rest.slice(0, sp2)];
          op.text = unescapeText(sp2 < 0 ? '' : rest.slice(sp2 + 1).trim());
        } else if (mode === 'words+text') {
          // @shout [角色id] 文本  —— 第一个词若是角色 id 则视为角色
          var sp3 = rest.search(/\s/);
          var first = sp3 < 0 ? rest : rest.slice(0, sp3);
          if (DM.CHARS && DM.CHARS[first] && sp3 >= 0) {
            op.args = [first];
            op.text = unescapeText(rest.slice(sp3 + 1).trim());
          } else {
            op.args = [];
            op.text = unescapeText(rest);
          }
        }

        if (cmd === 'choice') {
          // 读取紧随其后的 "- 文本 -> 标签" 行
          op.options = [];
          while (i < lines.length) {
            var l2 = lines[i].trim();
            if (!l2) { i++; continue; }
            if (l2.charAt(0) !== '-') break;
            var m = l2.slice(1).split('->');
            if (m.length < 2) { err(i + 1, '选项缺少 "-> 标签"'); i++; continue; }
            var target = m.pop().trim();
            op.options.push({ text: m.join('->').trim(), target: target, line: i + 1 });
            i++;
          }
          if (!op.options.length) err(lineNo, '@choice 没有任何选项');
        }

        if (cmd === 'if') {
          var parts = op.text.split('->');
          if (parts.length !== 2) err(lineNo, '@if 语法应为: @if 条件 -> 标签');
          else { op.cond = parts[0].trim(); op.target = parts[1].trim(); }
        }
        ops.push(op);
        continue;
      }

      // 对白
      var mm = SAY_RE.exec(line);
      if (mm) {
        ops.push({
          op: 'say', who: mm[1], name: mm[3] !== undefined ? mm[3] : null,
          expr: mm[5] || null, text: unescapeText(mm[6]), line: lineNo
        });
        continue;
      }
      err(lineNo, '无法解析的行: ' + line.slice(0, 40));
    }
    return { ops: ops, labels: labels, errors: errors };
  }

  DM.parseScript = parse;

  // 解析辩论台词中的弱点标记 {…}
  DM.splitWeak = function (text) {
    var out = [];
    var re = /\{([^}]*)\}/g, last = 0, m, idx = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ t: text.slice(last, m.index) });
      out.push({ t: m[1], weak: idx++ });
      last = re.lastIndex;
    }
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DM;
})(typeof window !== 'undefined' ? window : globalThis);
