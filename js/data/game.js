/* 本作配置 —— 引擎（js/engine/*）与第一部完全相同，作品差异都写在这里 */
(function (root) {
  var DM = root.DM = root.DM || {};
  DM.GAME = {
    id: 'darkmood2',
    storage: 'darkmood2_',
    title: 'DARK MOOD Ⅱ',
    subtitle: '雪葬村审判',
    version: 'v1.0',
    footer: '程序化高清美术与合成音乐　·　原创作品',
    titleBg: 'title', titleWeather: 'snow', titleBgm: 'snow',
    mapTitle: '雪葬村',
    hpName: '信念',
    judgeId: 'hakuga',                 // 审判中「广播」发言者（背后显示红色光晕）
    trialBg: 'sabakiya',               // 审判全景使用的背景（裁屋）
    chapters: ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5'],
    chapterNames: {
      prologue: '序章 雪葬之村', ch1: '第一章 水车之雪', ch2: '第二章 无迹之雪', ch3: '第三章 汤烟之雪',
      ch4: '第四章 假面之雪', ch5: '终章 雪葬审判'
    },
    seats: ['ritsu', 'sayo', 'chiyuki', 'renji', 'miyabi', 'minato', 'genichiro', 'sumi', 'shimo', 'kiriya', 'kumagai', 'abe', 'arima', 'makabe', 'yomoda'],
    outdoor: [],
    cast: ['ritsu', 'sayo', 'chiyuki', 'renji', 'miyabi', 'minato', 'genichiro', 'sumi', 'shimo', 'kiriya', 'kumagai', 'abe', 'arima', 'makabe', 'yomoda'],
    noBond: ['ritsu', 'genichiro', 'arima'],
    fates: {
      arima: [2, '死亡'], miyabi: [2, '雪牢'], genichiro: [3, '死亡'], yomoda: [3, '雪牢'],
      kiriya: [4, '死亡'], kumagai: [4, '雪牢'], makabe: [5, '死亡'], renji: [5, '雪牢']
    },
    fateOverride: function () { return null; },
    rules: {
      title: '寄合的规则',
      lines: ['一、雪封山期间，村中出现死者，全员到裁屋集合，举行「寄合」。',
        '二、在场者投票，多数决。',
        '三、被裁定者关进雪牢，翌日黎明送入雪中。',
        '——律的约定：若能在寄合上证明真凶，真凶将被关押、交给警察；若不能，村子按古法行事。']
    },
    verses: {
      title: '雪葬之歌',
      lines: ['一片雪，落水车，杵声捣到天明时。', '二片雪，落屋檐，雪上不见来时路。', '三片雪，落汤池，热汤暖不了冷心。',
        '四片雪，落面上，面具底下是谁的脸。', '五片雪，落送门，白衣人儿不回头。', '六片雪，白蛾归——', '（第七片雪，没有歌词。只有一段哼唱的旋律。）'],
      shownFrom: 0
    },
    trialNotes: ['寄合中的推理没有失败。答错会扣除「信念」，信念耗尽时会自动恢复。',
      '连续答错会出现提示，再答错会高亮正确的证据或选项。',
      '证言交锋：先选择证据，再点击发言中与之矛盾的橙色字句。可随时暂停、前后翻看发言。',
      '但在某些关键时刻，你的选择会决定——黎明时，谁会被送进雪里。'],
    about: '《DARK MOOD Ⅱ：雪葬村审判》\n\n' +
      '2003 年 2 月，东北深山。承认过自己「少年时代的推理是错的」的侦探七濑律，和助手乌丸小夜，\n' +
      '收到一封信：「二十年前的冬天，我的母亲被村子『送进了雪里』。」\n\n' +
      '大雪封山。白蛾的声音从防灾广播里传来——依照古法，雪封之日，由村子自己审判。\n' +
      '投错了票，被裁定的人就会在黎明被送进暴风雪。\n\n' +
      '本格推理 × 审判冒险。所有线索都会在寄合前呈现给你。\n' +
      '游戏中的所有画面与音乐均由程序实时生成。存档保存在本浏览器中。\n' +
      '本作为原创作品，人物、地点、事件均属虚构。',
    credits: {
      cast: ['ritsu', 'sayo', 'chiyuki', 'renji', 'miyabi', 'minato', 'genichiro', 'sumi', 'shimo', 'kiriya', 'kumagai', 'abe', 'arima', 'makabe', 'yomoda'],
      also: ['冬木 雪绘', '白峰 惣一', '黑泽 权藏', '真壁 铁雄'],
      closingTitle: '第七片雪',
      closing: '雪化了。<br>那首歌，终于有了歌词。'
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DM;
})(typeof window !== 'undefined' ? window : globalThis);
