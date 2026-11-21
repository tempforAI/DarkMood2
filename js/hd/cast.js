/* DARK MOOD Ⅱ《雪葬村审判》角色 HD 配置（格式见 js/hd/chars.js 顶部注释）
 * 2003 年 2 月东北深山雪村：除回忆角色（1983）外所有人都穿冬装。
 * 与证据相关的外观要点必须画出：律深灰大衣+围巾、左掌疤；小夜右手白手套、红围巾；千雪红山茶发簪、护士表；
 * 霜左手毛线手套（缺两指）、两颊冻疤、石板；莲司七星烟；湊电子表与时刻本；真壁警帽警服；澄白羽织；四方田圆眼镜与褐色围巾。
 */
(function (root) {
  'use strict';
  var DM = root.DM = root.DM || {};
  var HC = DM.HDChar;
  if (!HC || !HC.def) return;
  var D = function (id, o) { HC.def(id, o); };

  // ---------- 主角组 ----------
  // 律（24）：短乱黑发、锐利蓝眼、深灰长呢大衣 + 藏青高领毛衣 + 灰色针织围巾
  D('ritsu', {
    sex: 'm', age: 24, height: 175, skin: '#f1d2b8', face: 'sharp',
    hair: { style: 'short_messy', color: '#2a2f3a' },
    eyes: { shape: 'sharp', color: '#3a5a8a' }, brows: { shape: 'sharp' },
    outfit: { k: 'overcoat', c: '#3a3d44', inner: 'turtle', c2: '#2a3550' },
    acc: [{ k: 'scarf', c: '#8a8c92' }],
    pose: { think: 'chin' },
    expr: { smile: { mouth: 'smirk', eye: { open: 0.9, lowUp: 0.08 } } }
  });
  // 小夜（23）：齐肩黑直发、驼色牛角扣大衣、红围巾、只有右手戴白手套、红色笔记本
  D('sayo', {
    sex: 'f', age: 23, height: 160, skin: '#f6dcc8', blush: 0.2,
    hair: { style: 'shoulder_straight', color: '#15151c' },
    eyes: { shape: 'round', color: '#8a3444' }, brows: { shape: 'thin' },
    outfit: { k: 'duffle', c: '#c8b48a', c2: '#8a2a3a', inner: 'sweater' },
    acc: [{ k: 'muffler', c: '#c0282c' }, { k: 'glove_right', c: '#fbfbfd' }],
    hold: { k: 'notebook', c: '#b02838', side: -1, glove: '#fbfbfd' },
    expr: { smile: { eye: { mode: 'happy' }, mouth: 'smile', blush: 0.4 } }
  });
  // 千雪（23）：深棕低马尾（搭在肩前）+ 侧分刘海、藏青双排扣呢大衣 + 白高领、红山茶发簪、胸前护士表
  D('chiyuki', {
    sex: 'f', age: 23, height: 162, skin: '#f4dcc8', blush: 0.12,
    hair: { style: 'low_tail', color: '#2a1f1a', bangs: { k: 'swept', len: 0.55, part: 0.45, n: [3, 4, 5] }, extras: [{ k: 'low_tail', side: -1, c: '#3a2a24' }] },
    eyes: { shape: 'round', color: '#4a3a30', tilt: 0.04 }, brows: { shape: 'normal', t: 1.05 },
    outfit: { k: 'peacoat', c: '#2c3a5a', c2: '#f0ece4', inner: 'turtle' },
    acc: [{ k: 'camellia', c: '#c8102e', side: 1, x: 0.82, y: 0.52 }, { k: 'nurse_watch', x: 0.44, y: 0.48 }],
    expr: { smile: { mouth: 'smile_closed', eye: { open: 0.8, lowUp: 0.14 } }, angry: { mouth: 'frown' } }
  });

  // ---------- 白峰家与白峰屋 ----------
  // 莲司（35）：疲惫的乱短发、胡茬、橄榄绿绗缝工作夹克 + 奶油色毛衣、胸袋里的七星烟
  D('renji', {
    sex: 'm', age: 35, height: 178, skin: '#e8c8a8',
    hair: { style: 'short_messy', color: '#2a2622', extras: [], bangs: { k: 'messy', len: 0.42, part: 0.3 } },
    eyes: { shape: 'tired', color: '#3a3028' }, brows: { shape: 'soft', t: 1.1 },
    marks: ['stubble'],
    outfit: { k: 'quilted', c: '#4a5a48', c2: '#d8d0bc', inner: 'sweater' },
    acc: ['cig_pack'],
    expr: { smile: { mouth: 'smile_closed', eye: { open: 0.75, lowUp: 0.12 } }, normal: { eye: { open: 0.9 } } }
  });
  // 雅（34）：整齐低盘发 + 玳瑁梳、梅紫和服 + 黑羽织、金色腰带
  D('miyabi', {
    sex: 'f', age: 34, height: 163, skin: '#f2dccc',
    hair: { style: 'updo', color: '#1a1414' },
    eyes: { shape: 'cold', color: '#3a2a2a', tilt: 0.05 }, brows: { shape: 'thin' },
    outfit: { k: 'haori', c: '#1a1418', c2: '#6a2a4a', c3: '#e8d090', c4: '#e8d8c8', obi: '#c8a040', cord: '#6a2a4a' },
    acc: [{ k: 'comb', c: '#8a4a1a', side: 1 }],
    expr: { normal: { mouth: 'smile_closed' }, smile: { eye: { mode: 'happy' }, mouth: 'smile_closed' } }
  });
  // 湊（11）：西瓜头、蓝色儿童羽绒服、带绒球的毛线帽、手腕上的黑色电子表、随身的时刻本
  D('minato', {
    sex: 'm', age: 11, height: 140, skin: '#f6e0d0',
    hair: { style: 'bowl', color: '#1a1a20' },
    eyes: { shape: 'big', color: '#3a3a50' }, brows: { shape: 'short' },
    outfit: { k: 'parka', c: '#3a78b0', fur: false },
    acc: [{ k: 'knit_hat', c: '#e0ddd4', pomC: '#c83030' }],
    hold: { k: 'notebook', c: '#e8d8a0', side: 1, watch: true },
    expr: { smile: { mouth: 'smile_closed' }, normal: { mouth: 'neutral' } }
  });
  // 源一郎（77）：秃顶白鬓、稀疏白胡、老人斑、深陷严厉的眼、棉褞袍、手杖
  D('genichiro', {
    sex: 'm', age: 77, height: 165, build: -0.3, skin: '#dcbca0', face: 'old', lines: 3,
    hair: { style: 'balding', color: '#d8d8d0' },
    eyes: { shape: 'stern', color: '#2a2020', open: 0.85 }, brows: { shape: 'bushy', color: '#e4e4dc' },
    marks: [{ k: 'beard_short', c: '#e8e4dc' }, 'liver_spots'],
    outfit: { k: 'dotera', c: '#3a2a24', c2: '#8a7a68' },
    hold: { k: 'cane', c: '#2a1a10' },
    expr: { smile: { mouth: 'smirk', eye: { open: 0.7 } } }
  });

  // ---------- 村人 ----------
  // 澄（36）：用和纸丝带低束的长黑发（搭在肩前）、温柔低垂的眼、白衣绯袴 + 冬天的白羽织
  D('sumi', {
    sex: 'f', age: 36, height: 163, skin: '#f6e4d8',
    hair: { style: 'low_tail', color: '#101014', bangs: { k: 'parted', len: 0.6, part: 0.05 }, extras: [{ k: 'low_tail', side: -1, c: '#f8f6f0', len: 1.05 }] },
    eyes: { shape: 'gentle', color: '#3a3040', open: 0.86 }, brows: { shape: 'soft' },
    outfit: { k: 'miko', c: '#fafaf8', c2: '#b02030', haori: '#f2f0ec', himo: '#d8d0e8' },
    expr: { normal: { eye: { look: [0, 0.3] }, mouth: 'smile_closed' }, smile: { eye: { mode: 'happy' }, mouth: 'smile_closed' } }
  });
  // 霜（48）：掺白的盘发、两颊冻疤、安静温暖的眼、灰蓝和服 + 白围裙、灰色毛线手套（左手缺两指）、挂着粉笔的小石板
  D('shimo', {
    sex: 'f', age: 48, height: 155, build: -0.3, skin: '#e8cdb8', lines: 1,
    hair: { style: 'old_bun', color: '#5a5450', grey: 0.5 },
    eyes: { shape: 'kind', color: '#3a3030', h: 1.15 }, brows: { shape: 'soft' },
    marks: ['frostbite'],
    outfit: { k: 'kimono', c: '#5a6274', c2: '#f0ece0', c3: '#3a3e4a', apron: 'bib', apronC: '#f4f2ec' },
    acc: [{ k: 'gloves', c: '#8a8a90' }],
    hold: { k: 'slate', side: 1, glove: '#8a8a90', knit: 1, missing: 2 },
    expr: { normal: { mouth: 'neutral' }, smile: { eye: { mode: 'happy' }, mouth: 'smile_closed' }, surprise: { mouth: 'o' }, angry: { mouth: 'frown' } }
  });
  // 桐谷（61）：稀疏凌乱的灰发、细框圆眼镜、红鼻头、皱巴巴的白大褂 + 棕色开衫、酒壶
  D('kiriya', {
    sex: 'm', age: 61, height: 168, skin: '#e4c4a8', face: 'old', lines: 2,
    hair: { style: 'side_part_grey', color: '#8a8a88', cap: 'tufts', bangs: { k: 'messy', n: [5, 7, 9], len: 0.32, irr: 1.4, part: -0.4 } },
    eyes: { shape: 'tired', color: '#403830', open: 0.8 }, brows: { shape: 'bushy', color: '#9a9a96', t: 0.8 },
    marks: ['red_nose', 'stubble'], facialHair: '#9a9a96',
    outfit: { k: 'labcoat', c: '#ece8e0', c2: '#6a5a48', inner: 'cardigan' },
    acc: [{ k: 'glasses', shape: 'round', c: '#a0a0a8' }],
    hold: { k: 'flask' },
    expr: { smile: { mouth: 'smile_closed', eye: { open: 0.65 } } }
  });
  // 熊谷（46）：蓬乱头发 + 络腮胡、凶狠的眼、棕色狩猎夹克 + 毛领、橙色毛线帽、背着猎枪
  D('kumagai', {
    sex: 'm', age: 46, height: 185, build: 1, skin: '#c89870', face: 'square',
    hair: { style: 'shaggy', color: '#2a2018' },
    eyes: { shape: 'stern', color: '#201810' }, brows: { shape: 'thick', t: 1.15 },
    marks: [{ k: 'beard_full', c: '#2a2018' }],
    outfit: { k: 'hunting', c: '#8a5a2a', c2: '#5a4a30', fur: '#c8b494' },
    acc: [{ k: 'knit_hat', c: '#e07020', pom: false }, { k: 'rifle', side: 1 }, { k: 'rifle_sling', side: 1 }],
    expr: { smile: { mouth: 'grin', eye: { open: 0.8 } }, normal: { brow: { i: 0.012 } } }
  });
  // 阿部文（71）：灰发髻、眯眼、挂链的老花镜、红褐袢缠 + 灰蓝和服、格子围裙
  D('abe', {
    sex: 'f', age: 71, height: 148, build: -0.4, skin: '#e6c8b0', face: 'old', lines: 3,
    hair: { style: 'old_bun', color: '#b0aca8' },
    eyes: { shape: 'squint', color: '#302820', w: 0.95 }, brows: { shape: 'thin', color: '#8a8680' },
    outfit: { k: 'hanten', c: '#7a3a3a', c2: '#5a5a6a', apron: 'check', apronC: '#ece6d8', checkC: '#8a3a3a' },
    acc: [{ k: 'glasses', shape: 'oval', c: '#b09060', chain: '#c8a860' }],
    expr: { normal: { mouth: 'smirk' }, smile: { eye: { mode: 'happy' }, mouth: 'grin' } }
  });
  // 有马（34）：油亮的侧分背头、傲慢的眼、驼色大衣罩深色西装、皮手套、公文包
  D('arima', {
    sex: 'm', age: 34, height: 180, skin: '#ecd0b8', face: 'sharp',
    hair: { style: 'side_part', color: '#1a1a1a', vol: 0.05, shine: 1.3 },
    eyes: { shape: 'cold', color: '#2a2a2a', open: 0.82 }, brows: { shape: 'sharp' },
    outfit: { k: 'overcoat', c: '#a88a60', inner: 'suit', c2: '#2a2a3a' },
    acc: [{ k: 'gloves', c: '#3a2a20' }],
    hold: { k: 'briefcase', side: 1, glove: '#3a2a20' },
    expr: { normal: { mouth: 'smirk' }, smile: { mouth: 'smirk', eye: { open: 0.7 } } }
  });
  // 真壁（27）：短整齐黑发、热血明亮的眼、藏青警察冬季制服、警帽、哨绳
  D('makabe', {
    sex: 'm', age: 27, height: 176, skin: '#ecd0b4',
    hair: { style: 'short_neat', color: '#1a1a1a' },
    eyes: { shape: 'round', color: '#2a3a50' }, brows: { shape: 'straight', t: 1.1 },
    outfit: { k: 'police', c: '#2a3a5a', c2: '#d8e0f0', c3: '#1a2238' },
    acc: [{ k: 'police_cap', c: '#22304e' }, { k: 'whistle_cord', side: -1 }],
    expr: { smile: { mouth: 'grin' } }
  });
  // 四方田（44）：一缕灰白的后梳发、和善的眼、圆眼镜、褐色粗花呢外套 + 长围巾、田野笔记本
  D('yomoda', {
    sex: 'm', age: 44, height: 172, skin: '#ecd2b8',
    hair: { style: 'slicked_back', color: '#3a3430', grey: 0.3, greyC: '#d0d0cc' },
    eyes: { shape: 'kind', color: '#3a3a30', h: 1.2 }, brows: { shape: 'soft', t: 1.1 },
    outfit: { k: 'jacket', c: '#6a5a40', c2: '#c8b898', tex: 'tweed' },
    acc: [{ k: 'glasses', shape: 'round', c: '#5a4a30' }, { k: 'scarf', c: '#7a5030' }],
    hold: { k: 'book', c: '#5a4a30', side: 1 },
    expr: { normal: { mouth: 'smile_closed' }, smile: { eye: { mode: 'happy' }, mouth: 'smile' } }
  });
  // 白蛾：白色兜帽斗篷 + 带羽状触角的白蛾面具，眼洞发冷蓝光（表情只改变发光强度）
  D('hakuga', {
    sex: 'f', age: 36, height: 166, build: 0.3, skin: '#e8d8d0',
    hair: { style: 'none' },
    hood: { c: '#eeeef2' },
    mask: { k: 'moth', c: '#f6f4f0', cover: 'full' },
    glow: { c: '#c0d0ff' },
    outfit: { k: 'robe', c: '#eeeef2', c2: '#c8c8d0', clasp: '#c0c4d0' }
  });
  // 村民（长老）：灰色短发、多疑的眼、棉袢缠、毛线帽
  D('villager', {
    sex: 'm', age: 70, height: 160, skin: '#d8b898', face: 'old', lines: 2,
    hair: { style: 'cropped', color: '#9a968e' },
    eyes: { shape: 'narrow', color: '#2a2420' }, brows: { shape: 'bushy', color: '#8a8680', t: 0.8 },
    outfit: { k: 'hanten', c: '#4a4a52', c2: '#7a6a58' },
    acc: [{ k: 'knit_hat', c: '#6a5a4a', pom: false }],
    expr: { normal: { mouth: 'frown' } }
  });

  // ---------- 回忆角色（1983） ----------
  // 雪绘（28）：低盘发插红山茶簪、温柔而坚强的眼、靛蓝劳作和服 + 白色割烹着（无疤）
  D('yukie', {
    sex: 'f', age: 28, height: 160, skin: '#f6e2d2', blush: 0.15,
    hair: { style: 'updo', color: '#1a1410' },
    eyes: { shape: 'gentle', color: '#3a2a20' }, brows: { shape: 'soft', t: 1.05 },
    outfit: { k: 'kimono', c: '#3a4a6a', c2: '#f0e8e0', apron: 'kappogi' },
    acc: [{ k: 'kanzashi', c: '#c8102e', side: 1, x: 0.7, y: 0.42 }],
    expr: { smile: { eye: { mode: 'happy' }, mouth: 'smile' } }
  });
  // 惣一（26）：凌乱后梳发、醉醺醺的残忍眼神、通红的脸、敞领的深色丹前、酒壶
  D('soichi', {
    sex: 'm', age: 26, height: 180, skin: '#e2bea0', blush: 0.65,
    hair: { style: 'slicked_back', color: '#1a1612', cap: 'tufts', bangs: { k: 'none', stray: 1 } },
    eyes: { shape: 'half', color: '#2a1a1a', open: 0.6 }, brows: { shape: 'sharp', t: 1.1 },
    outfit: { k: 'tanzen', c: '#2a2424', eri: '#141010', c3: '#4a3028' },
    hold: { k: 'sake', side: 1 },
    expr: { normal: { mouth: 'smirk' }, smile: { mouth: 'grin', eye: { open: 0.5 } } }
  });
  // 少女时代的澄（16）：披散的长黑发、受惊的温柔眼神、白和服外罩红里子斗篷
  D('young_sumi', {
    sex: 'f', age: 16, height: 156, skin: '#f8e8dc',
    hair: { style: 'long_straight', color: '#101014' },
    eyes: { shape: 'gentle', color: '#3a3040' }, brows: { shape: 'soft' },
    outfit: { k: 'cape', c: '#2a2a30', c2: '#f6f4f0', lining: '#c02030' },
    expr: { normal: { brow: { i: -0.016 }, eye: { open: 0.95 } } }
  });
  // 少年时代的莲司（15）：男孩短发、害羞睁大的眼、黑色立领学生服外罩棉外套、毛线手套
  D('young_renji', {
    sex: 'm', age: 15, height: 160, skin: '#f2d8c0',
    hair: { style: 'short', color: '#1a1612' },
    eyes: { shape: 'big', color: '#3a3028' }, brows: { shape: 'soft' },
    outfit: { k: 'gakuran', c: '#1a1a24', coat: '#4a4a40' },
    acc: [{ k: 'gloves', c: '#6a5a48' }],
    expr: { normal: { brow: { i: -0.01 } } }
  });
  // 权藏（60）：白色短寸头、炭灰、深皱纹、沉默的眼、熏黑的工作服 + 草蓑、毛巾头带
  D('gonzo', {
    sex: 'm', age: 60, height: 166, skin: '#a8805c', face: 'old', lines: 2,
    hair: { style: 'buzz', color: '#c8c4bc' },
    eyes: { shape: 'squint', color: '#201a14' }, brows: { shape: 'bushy', color: '#c8c4bc' },
    marks: ['stubble', 'soot'], facialHair: '#c8c4bc',
    outfit: { k: 'work', c: '#4a4034', c2: '#6a5a44' },
    acc: ['mino', { k: 'hachimaki', c: '#e0dccc' }]
  });
})(typeof window !== 'undefined' ? window : globalThis);
