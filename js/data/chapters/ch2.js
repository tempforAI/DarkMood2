/* 第二章「无迹之雪」—— 二片雪，落屋檐，雪上不见来时路。
 * 2/14 午后 日常 → 17:00 雪送祭 → 21:00 雪停 → 22:30 小夜去离屋 → 2/15 6:30 发现 → 搜查 → 13:00 寄合
 * 被害者：白峰源一郎（离屋）　凶手：四方田圭（冬木雪绘的弟弟，本名篠原圭）　替罪羊：乌丸小夜
 * 诊断：23:20 从本宅二楼窗口推下庇上的雪，埋住离屋被炉的排气管口 → 一氧化碳中毒。雪庭里不需要任何脚印。
 * 坏结局分歧：寄合开场 @checkpoint → ch2_to_be_ch2 → ch2_be_okuri（be_ch2「送行者」）
 */
DM.registerChapter({
  id: 'ch2',
  title: '第二章',
  name: '无迹之雪',
  next: 'ch3',
  start: 'ch2_start',

  evidence: {
    ch2_body: { name: '源一郎的遗体', icon: 'body',
      desc: '离屋，扑倒在掘被炉旁，脸朝下，右手伸向门口的方向。额头有一道伤，出血不多。屋里闷热，有一股浓重的炭味。' },
    ch2_kiriya: { name: '桐谷的验尸', icon: 'testimony',
      desc: '7:00，宿醉的桐谷在离屋的裸灯泡下验尸：「额头遭钝器击打，是有棱有角的硬东西。死亡时间在昨晚十一点到一点之间。」' },
    ch2_lividity: { name: '尸斑', icon: 'body',
      desc: '源一郎颈侧和背上的尸斑。离屋里只有一只裸灯泡，橙黄色的光把一切都染成同一个颜色，看不清尸斑是什么颜色——总觉得「有点怪」。' },
    ch2_iron: { name: '围炉里的铁框', icon: 'generic',
      desc: '掘被炉坑口四周的旧铁框，由从前的围炉里改成，嵌死在地板里，拿不起来。靠门一侧的角上沾着血和几根白发，角的形状与额头的伤口吻合。' },
    ch2_rentan: { name: '燃尽的练炭', icon: 'charcoal',
      desc: '被炉炉膛里的练炭整块烧成了灰白色，一碰就碎，炉膛还有余温。霜每晚 19:30 给老人换上一块新的——昨晚那一块，烧了一整夜。' },
    ch2_flue: { name: '被炉的烟道', icon: 'generic',
      desc: '从掘被炉接出的一根铁皮烟道，贴着地板走，穿过离屋朝向本宅那一侧的侧墙，管口开在墙外。莲司：「练炭危险，桐谷医生让我们装的。」' },
    ch2_shimo: { name: '霜的石板', icon: 'testimony',
      desc: '「6:30 送粥。开门，屋里很闷，炭味。头很晕，想吐。」霜敲着锅盖，先跑去本宅叫醒四方田，再跑到白峰屋叫人。' },
    ch2_tracks: { name: '雪庭的脚印', icon: 'footprint',
      desc: '雪在 21:00 停了。雪停后，雪庭小路上只有小夜往返的脚印（边缘锋利）和霜今早的脚印。更早的脚印（霜 19:30、莲司 20:40）只剩被落雪填平的浅凹。没有一行脚印通往两屋之间的窄缝。' },
    ch2_sayo: { name: '小夜的证词', icon: 'testimony',
      desc: '22:30 一个人进离屋，22:50 出来，关好了门。老人时而清醒、时而说胡话，最后吼着把她赶了出来。「被炉烧得很旺，屋里热得我都出汗了。」' },
    ch2_ritsu: { name: '律的证词', icon: 'testimony',
      desc: '律在本宅大门口等着。22:48 听见离屋里老人吼「滚回去吧，丫头！」；22:50 小夜出来。23:00～0:30，小夜和律、千雪一直在白峰屋律的房间里。' },
    ch2_gap: { name: '屋间的窄缝', icon: 'snow',
      desc: '离屋侧墙与本宅侧墙之间两三米宽的窄缝，堆着一人多高的落雪，人进不去。雪面平平整整，没有任何人走过的痕迹。' },
    ch2_vent: { name: '被埋的排气管口', icon: 'snow',
      desc: '离屋侧墙外的排气管口，被一堆雪块埋得严严实实。雪块棱角分明，断面上有平直的铲痕。从屋檐自然滑落的雪是圆滑的一整片，不会是这个样子。' },
    ch2_snowstop: { name: '庇与雪止', icon: 'snow',
      desc: '排气管口正上方，本宅一楼的庇上装着一排雪止，积雪不会自己滑下来。二楼窗下那一段的积雪缺了一块，断面是铲子切出的直角，断面上没有一点新雪。' },
    ch2_window: { name: '四方田房间的窗台', icon: 'window',
      desc: '本宅二楼客房的窗。窗台下午清过，到 21:00 雪停时应该又积了一层平整的新雪——现在却被拂得乱七八糟，乱痕上没有新雪。窗框内侧还湿着。' },
    ch2_shovel: { name: '壁橱里的雪铲', icon: 'shovel',
      desc: '四方田房间壁橱里的雪铲——昨天下午它还靠在窗边的墙上。铲刃的凹槽里卡着没化完的冰碴，壁橱地板上一滩水还没渗干。房间里的暖炉烧了一整夜。' },
    ch2_yomoda: { name: '四方田的证词', icon: 'testimony',
      desc: '「昨晚九点半回到本宅，十一点就睡了。窗户一整晚都没开过。雪铲？那是下午清窗台用的。」' },
    ch2_record: { name: '1983 年寄合记录本', icon: 'book',
      desc: '源一郎收在离屋柜子里的旧记录本，在四方田的包里找到。昭和五十八年二月十四日寄合：「证人 阿部文」「桐谷：照之前说的写」「全三十一户 有罪」「送人 熊谷大吾」。' },
    ch2_letters: { name: '包底的旧信', icon: 'letter',
      desc: '四方田包底一叠用褪色缎带捆着的旧信。信封上的收信人是「圭」，寄信人只写了一个「姐」字，邮戳是「白峰局」。四方田不肯让人拆看。' },
    ch2_grave: { name: '黑泽权藏之墓', icon: 'generic',
      desc: '墓地角落里一块小小的墓碑：「黑泽权藏之墓 平成七年没」。墓前扫得干干净净，供着半截蜡烛。碑的背面积着厚厚的雪，看不清。阿部文：「炭老头？早死了。」' },
    ch2_pillar: { name: '柱子上的字', icon: 'generic',
      desc: '冬木家旧宅柱子上的身高刻痕，旁边一行小字「千雪 三才」。「雪」字雨字头的四点没有分开写，连成了一道波浪线，像一只飞着的小蛾子。' },
    ch2_festival_voice: { name: '白蛾大人之声', icon: 'radio',
      desc: '雪送祭上，祭典喇叭里传出变过声的祝词，冰冷、平板、分不出男女——和白蛾的广播很像。喇叭线拉进送门旁的帐篷；祭典广播一向由神社的宫司负责。' },
    ch2_genichiro: { name: '源一郎的胡话', icon: 'testimony',
      desc: '离屋里，半睡半醒的源一郎望着门口喃喃：「雪绘……你回来了……是那个女孩……是那个女孩……」' }
  },

  explore: {
    // ---------- 日常（2/14 午后） ----------
    ch2_day: {
      title: '自由行动',
      mode: 'free',
      start: 'inn_hearth',
      places: ['inn_hearth', 'village_road', 'annex', 'shiramine_hall', 'cemetery', 'fuyuki_house', 'shrine_hall', 'clinic', 'store', 'police_box'],
      weather: 'snow',
      spots: {
        inn_hearth: [
          { anchor: 'window', label: '窗外的雪', run: 'ch2_d_hwin' },
          { anchor: 'irori', label: '围炉里', run: 'ch2_d_irori' },
          { anchor: 'sake_shelf', label: '帐场', run: 'ch2_d_counter' }
        ],
        village_road: [
          { anchor: 'shed', label: '柴棚', run: 'ch2_d_shed' },
          { anchor: 'nozzles', label: '消雪管', run: 'ch2_d_nozzle' },
          { anchor: 'yukawa', label: '冒热气的小溪', run: 'ch2_d_yukawa' }
        ],
        annex: [
          { anchor: 'kotatsu', label: '被炉边的老人', run: 'ch2_d_oldman' },
          { anchor: 'lamp', label: '裸灯泡', run: 'ch2_d_lamp' },
          { anchor: 'iron_frame', label: '铁框', run: 'ch2_d_iron' },
          { anchor: 'tansu', label: '柜子', run: 'ch2_d_tansu' },
          { anchor: 'window', label: '糊死的窗', run: 'ch2_d_awin' }
        ],
        shiramine_hall: [
          { anchor: 'documents', label: '稻草人偶', run: 'ch2_d_doll' },
          { anchor: 'portraits', label: '墙上的照片', run: 'ch2_d_portraits' },
          { anchor: 'butsudan', label: '佛坛', run: 'ch2_d_butsudan' },
          { anchor: 'stairs', label: '楼梯', run: 'ch2_d_stairs' }
        ],
        cemetery: [
          { anchor: 'gonzo_grave', label: '角落的小墓碑', run: 'ch2_d_gonzo' },
          { anchor: 'fuyuki_grave', label: '冬木家的墓', run: 'ch2_d_fgrave' },
          { anchor: 'shiramine_grave', label: '白峰家的大墓', run: 'ch2_d_sgrave' }
        ],
        fuyuki_house: [
          { anchor: 'pillar', label: '柱子', run: 'ch2_d_pillar' },
          { anchor: 'doorway', label: '门口', run: 'ch2_d_fdoor' },
          { anchor: 'hearth', label: '冷掉的围炉里', run: 'ch2_d_fhearth' },
          { anchor: 'cupboard', label: '橱柜', run: 'ch2_d_fcup' }
        ],
        shrine_hall: [
          { anchor: 'storeroom', label: '储藏室', run: 'ch2_d_sroom' },
          { anchor: 'offering_box', label: '赛钱箱', run: 'ch2_d_offer' }
        ],
        clinic: [
          { anchor: 'safe', label: '旧保险柜', run: 'ch2_d_safe' },
          { anchor: 'shelf', label: '药架', run: 'ch2_d_cshelf' }
        ],
        store: [
          { anchor: 'shelves', label: '杂志架', run: 'ch2_d_mag' },
          { anchor: 'post_window', label: '邮局窗口', run: 'ch2_d_post' },
          { anchor: 'phone', label: '公用电话', run: 'ch2_d_phone' }
        ],
        police_box: [
          { anchor: 'locker', label: '储物柜', run: 'ch2_d_locker' },
          { anchor: 'radio', label: '无线电', run: 'ch2_d_radio' }
        ]
      },
      people: {
        inn_hearth: [ { char: 'sayo', run: 'ch2_d_sayo', x: 210 } ],
        village_road: [ { char: 'minato', run: 'ch2_d_minato', x: 110 } ],
        shiramine_hall: [ { char: 'yomoda', run: 'ch2_d_yomoda', x: 300 }, { char: 'kumagai', run: 'ch2_d_kumagai', x: 130 } ],
        cemetery: [ { char: 'chiyuki', run: 'ch2_d_chiyuki', x: 240 } ],
        shrine_hall: [ { char: 'sumi', run: 'ch2_d_sumi', x: 250 } ],
        clinic: [ { char: 'kiriya', run: 'ch2_d_kiriya', x: 220 } ],
        store: [ { char: 'abe', run: 'ch2_d_abe', x: 200 } ],
        police_box: [ { char: 'makabe', run: 'ch2_d_makabe', x: 280 } ]
      },
      done: {
        need: ['flag:ch2_d_sayo', 'flag:ch2_d_yomoda', 'flag:ch2_d_chiyuki', 'flag:ch2_d_sumi', 'flag:ch2_d_kiriya'],
        run: 'ch2_day_end',
        prompt: '天色暗下来了。雪送祭五点开始。要结束自由行动吗？'
      }
    },

    // ---------- 雪送祭（2/14 19:00 送门） ----------
    ch2_fest: {
      title: '雪送祭',
      mode: 'free',
      start: 'okurimon',
      places: ['okurimon'],
      filter: 'cold',
      weather: 'snow',
      spots: {
        okurimon: [
          { x: 436, y: 64, label: '祭典喇叭', run: 'ch2_f_speaker' },
          { anchor: 'path', label: '送道', run: 'ch2_f_path' },
          { anchor: 'stones', label: '门边的石头', run: 'ch2_f_stones' },
          { anchor: 'signpost', label: '路标', run: 'ch2_f_sign' }
        ]
      },
      people: {
        okurimon: [ { char: 'kumagai', run: 'ch2_f_kumagai', x: 110 }, { char: 'chiyuki', run: 'ch2_f_chiyuki', x: 280 },
                    { char: 'shimo', run: 'ch2_f_shimo', x: 335 }, { char: 'yomoda', run: 'ch2_f_yomoda', x: 430 } ]
      },
      done: {
        need: ['flag:ch2_f_kumagai', 'flag:ch2_f_chiyuki'],
        run: 'ch2_fest_end',
        prompt: '雪灯笼一盏一盏地熄了。回白峰屋吗？'
      }
    },

    // ---------- 搜查（2/15 清晨） ----------
    ch2_inv: {
      title: '搜查开始',
      mode: 'investigate',
      start: 'annex',
      places: ['annex', 'garden_b', 'shiramine_2f', 'shiramine_hall', 'inn_hearth'],
      custom: {
        garden_b: { bg: 'snow_garden', variant: 'buried', name: '雪庭（离屋侧）', area: 'shiramine' }
      },
      weather: 'none',
      spots: {
        annex: [
          { anchor: 'body', label: '源一郎的遗体', run: 'ch2_i_body' },
          { x: 306, y: 192, label: '颈后的尸斑', run: 'ch2_i_livid' },
          { anchor: 'iron_frame', label: '铁框的角', run: 'ch2_i_iron' },
          { anchor: 'kotatsu', label: '被炉', run: 'ch2_i_kotatsu' },
          { anchor: 'flue', label: '烟道', run: 'ch2_i_flue' },
          { anchor: 'lamp', label: '裸灯泡', run: 'ch2_i_lamp' },
          { anchor: 'window', label: '窗户', run: 'ch2_i_window' },
          { anchor: 'tansu', label: '柜子', run: 'ch2_i_tansu' },
          { anchor: 'tray', label: '打翻的托盘', run: 'ch2_i_tray' }
        ],
        garden_b: [
          { anchor: 'path', label: '小路上的脚印', run: 'ch2_i_path' },
          { anchor: 'gap', label: '窄缝', run: 'ch2_i_gap' },
          { anchor: 'vent', label: '排气管口', run: 'ch2_i_vent' },
          { anchor: 'eave', label: '庇', run: 'ch2_i_eave' },
          { anchor: 'window2f', label: '二楼的窗', run: 'ch2_i_win2f' },
          { anchor: 'gate', label: '本宅大门', run: 'ch2_i_gate' },
          { anchor: 'annex_door', label: '离屋的门', run: 'ch2_i_adoor' }
        ],
        shiramine_2f: [
          { anchor: 'window', label: '窗户', run: 'ch2_i_2fwin' },
          { anchor: 'windowsill', label: '窗台', run: 'ch2_i_sill' },
          { anchor: 'closet', label: '壁橱', run: 'ch2_i_closet' },
          { anchor: 'bag', label: '皮包', run: 'ch2_i_bag' },
          { anchor: 'desk', label: '书桌', run: 'ch2_i_desk' },
          { anchor: 'heater', label: '暖炉', run: 'ch2_i_heater' }
        ],
        shiramine_hall: [
          { anchor: 'stairs', label: '楼梯', run: 'ch2_i_stairs' },
          { anchor: 'portraits', label: '墙上的照片', run: 'ch2_i_portraits' }
        ],
        inn_hearth: [
          { anchor: 'window', label: '窗外', run: 'ch2_i_hwin' }
        ]
      },
      people: {
        annex: [ { char: 'kiriya', run: 'ch2_i_kiriya', x: 410 } ],
        garden_b: [ { char: 'makabe', run: 'ch2_i_makabe', x: 440 } ],
        shiramine_2f: [ { char: 'yomoda', run: 'ch2_i_yomoda', x: 250 } ],
        shiramine_hall: [ { char: 'shimo', run: 'ch2_i_shimo', x: 230 }, { char: 'renji', run: 'ch2_i_renji', x: 340 } ],
        inn_hearth: [ { char: 'sayo', run: 'ch2_i_sayo', x: 200 }, { char: 'chiyuki', run: 'ch2_i_chiyuki', x: 290 },
                      { char: 'kumagai', run: 'ch2_i_kumagai', x: 400 } ]
      },
      done: {
        need: ['ch2_body', 'ch2_kiriya', 'ch2_lividity', 'ch2_iron', 'ch2_rentan', 'ch2_flue', 'ch2_shimo',
               'ch2_tracks', 'ch2_sayo', 'ch2_ritsu', 'ch2_gap', 'ch2_vent', 'ch2_snowstop', 'ch2_window',
               'ch2_shovel', 'ch2_yomoda', 'ch2_record', 'ch2_letters'],
        run: 'ch2_inv_end',
        prompt: '该看的都看过了。十三点，裁屋。结束搜查吗？'
      }
    }
  },

  games: {
    // 1. 「被人击打」
    ch2_g1: { type: 'debate', title: '证言交锋',
      ammo: ['ch2_iron', 'ch2_kiriya', 'ch2_tracks', 'ch2_body', 'ch2_sayo'],
      lines: [
        { who: 'kumagai', expr: 'angry', text: '那丫头跟老爷子{吵了起来}——侦探自己都听见了！' },
        { who: 'kiriya', expr: 'think', text: '额头的伤……是{被人击打}的。有棱有角的硬东西。' },
        { who: 'abe', expr: 'angry', text: '雪停以后进过离屋的，{只有她一个}！' },
        { who: 'villager', expr: 'angry', text: '宵鸦岛的判官，{最会装神弄鬼}。' }
      ],
      answer: { line: 1, weak: 0, ammo: 'ch2_iron' },
      hint: '伤口的形状，和离屋里的哪样东西对得上？那样东西，能被人拿起来挥动吗？' },

    // 2. 写在皮肤上的死因
    ch2_g2: { type: 'present', prompt: '源一郎先生真正的死因，写在他的皮肤上——', answer: 'ch2_lividity',
      hint: '真壁先生的手电照亮离屋的时候，你看见了什么颜色？' },

    // 3. 一氧化碳
    ch2_g3: { type: 'keyword', prompt: '鲜红的尸斑、烧了一整夜的练炭、开门就头晕想吐——充满离屋的是——', answer: '一氧化碳',
      decoys: '氰钾毒酒冻血', hint: '练炭在密不透风的屋子里烧，会生出什么看不见、闻不到的东西？' },

    // 4. 「她堵住了烟道」
    ch2_g4: { type: 'debate', title: '证言交锋',
      ammo: ['ch2_gap', 'ch2_flue', 'ch2_ritsu', 'ch2_rentan', 'ch2_sayo'],
      lines: [
        { who: 'abe', expr: 'angry', text: '那就是她走的时候，绕到屋外{堵住了烟道}！' },
        { who: 'kumagai', expr: 'angry', text: '二十分钟，{足够做手脚}了！' },
        { who: 'villager', expr: 'normal', text: '外人嘛，{什么做不出来}。' },
        { who: 'villager', expr: 'angry', text: '那丫头在岛上，{就是用这种手段}审判人的！' }
      ],
      answer: { line: 0, weak: 0, ammo: 'ch2_gap' },
      hint: '排气管口开在哪里？要走到那里去，雪面上会留下什么？' },

    // 5. 「屋顶的雪自己滑了下来」
    ch2_g5: { type: 'debate', title: '证言交锋',
      ammo: ['ch2_snowstop', 'ch2_gap', 'ch2_window', 'ch2_flue', 'ch2_tracks'],
      lines: [
        { who: 'yomoda', expr: 'think', text: '这么说……是{庇上的雪自己滑了下来}，埋住了管口。真是不幸的意外。' },
        { who: 'renji', expr: 'sad', text: '老爷子……{命不好}……' },
        { who: 'kumagai', expr: 'shock', text: '是{白蛾大人}抖落的雪，把他收走了！' },
        { who: 'abe', expr: 'think', text: '意外？那……就{谁都不用送}了？' }
      ],
      answer: { line: 0, weak: 0, ammo: 'ch2_snowstop' },
      hint: '昨天在雪庭，莲司先生说过——那片庇上装着什么？' },

    // 6. 推理回廊：雪从哪里来
    ch2_g6: { type: 'logic', title: '推理回廊', questions: [
      { q: '埋住排气管口的雪，是从哪里来的？', opts: ['窄缝里原有的积雪', '正上方本宅一楼的庇', '离屋自己的屋顶'], a: 1 },
      { q: '那些雪是怎么下来的？', opts: ['被风吹下来', '越过雪止自己滑下来', '被人用铲子切成块，推了下去'], a: 2 },
      { q: '要够得着那片庇，人得站在哪里？', opts: ['窄缝里的雪堆上', '离屋的屋顶上', '正上方本宅二楼的窗口'], a: 2 },
      { q: '那扇窗，是谁的房间？', opts: ['莲司', '四方田', '没有人住的空房'], a: 1 },
      { q: '这个人动手的时候，需要走过雪庭吗？', opts: ['需要，要绕到窄缝口', '不需要——雪上不见来时路', '需要，要经过离屋门口'], a: 1 }
    ], hint: '把雪庭里的三样东西叠起来看：排气管口、庇、二楼的窗。它们在同一条竖线上。' },

    // 7. 对峙四方田
    ch2_g7: { type: 'rebuttal', who: 'yomoda',
      blades: ['铲刃上的冰碴还没化', '庇上的雪缺了一块直角', '雪停之后再没下过雪'],
      lines: [
        { expr: 'normal', text: '半夜开窗透透气，{有什么奇怪}的？暖炉烧了一整夜，屋里闷得很。' },
        { expr: 'smile', text: '壁橱里的雪铲？那是我{下午清窗台}的时候用的。七濑君，你昨天亲眼看见了。' },
        { expr: 'think', text: '再说……一个研究民俗的人，为什么要杀一个卧病的老人呢？' }
      ],
      answer: { line: 1, weak: 0, blade: 0 },
      hint: '如果雪铲是昨天下午用的，到今天早上过了多少个钟头？房间里还烧着暖炉。' },

    // 8. 消失的记录本
    ch2_g8: { type: 'present', prompt: '从源一郎先生的柜子里消失的东西，就在你的包里——', answer: 'ch2_record',
      hint: '莲司先生说过，老爷子连他都不许碰的那样东西。' },

    // 9. 姐姐
    ch2_g9: { type: 'present', prompt: '包里还有一样东西。它说明了你和二十年前那个女人的关系——', answer: 'ch2_letters',
      hint: '四方田先生不肯让任何人拆开的东西。邮戳是哪里的？寄信人写的是什么？' },

    // 10. 真相重演
    ch2_g10: { type: 'reconstruct', panels: [
      { text: '2 月 14 日午后，凶手借整理文书，从离屋的柜子里拿走了【？】。', opts: ['老人的药', '1983 年的寄合记录本', '一块练炭'], a: 1 },
      { text: '22:50，雪停后的雪庭里，只留下了【？】。', opts: ['霜的脚印', '小夜的脚印', '律的脚印'], a: 1 },
      { text: '23:20，凶手打开了【？】。', opts: ['离屋的门', '本宅二楼客房的窗户', '被炉的炉盖'], a: 1 },
      { text: '凶手探出身子，用【？】把庇上的积雪切成块，越过雪止推了下去。', opts: ['雪铲', '铁火箸', '祭典的雪橇'], a: 0 },
      { text: '雪块落进窄缝，埋住了【？】。', opts: ['离屋的门口', '被炉的排气管口', '雪庭的小路'], a: 1 },
      { text: '一氧化碳充满了密闭的离屋。老人头晕起身，扑倒时额头撞上了【？】——看起来就像被人击打。', opts: ['门框', '围炉里铁框的角', '柜子的抽屉'], a: 1 }
    ] },

    // 11. 投票
    ch2_g11: { type: 'vote', options: ['sayo', 'yomoda', 'kiriya', 'kumagai', 'shimo'], answer: 'yomoda' }
  },

  script: String.raw`
# ch2_start
@bgm stop
@fade out
@title 第二章|无迹之雪
@poem 二片雪，落屋檐，雪上不见来时路。
@bg inn_hearth
@weather snow
@filter none
@fade in
@bgm sad
@caption 2月14日 13:20 白峰屋·围炉里之间
: 寄合散了快一个钟头。白峰屋的围炉里之间，没有人开电视，也没有人说话。
: 铁壶挂在自在钩上，咕嘟咕嘟地响。窗外的雪不大，一片一片，落得很慢。
: 帐场的格子窗后面，女将平时坐的那个位置空着。算盘还摆在原处，算珠停在昨晚的一笔账上。
@show renji[sad] L
@show minato[normal] R
: 白峰湊挨着莲司坐在围炉边。时刻本摊在膝盖上，铅笔捏在手里，很久都没有动。
minato: ……12:40。广播。
: 他在本子上写下一行字。字比平时歪。
renji[sad]: 湊。……今天就不写了，好不好。
minato: 不写的话，就不知道发生过什么了。
renji[sad]: ……
: 莲司伸出手，想摸摸儿子的头，伸到一半，又放下了。
> 湊的时刻本，证明了他母亲在说谎。在寄合上，把那一页念出来的人，是我。
> 他还是一分钟一分钟地记着。好像只要时间排得整整齐齐，世界就不会散掉。
@hide
@show sayo[smile] C
sayo[smile]: 湊君～ 要不要吃这个？车站买的雪见大福，最后一个了哦。
minato: ……不要。
sayo[smile]: 那我放在这里，湊君想吃的时候再吃～
: 小夜把纸包放在湊的手边。湊看了它很久，最后把它收进了口袋。
minato: ……16:00 再吃。
sayo[smile]: 嗯，16:00。约好了～
@hide
: 屋子另一头，两个老人缩在角落里喝着热酒，眼睛一直往这边瞟。
villager{老人}: ……就是那个。宵鸦岛的……
villager{老人}: 嘘。中午的广播你也听见了吧。「二片雪，就要落到屋檐上了」……
: 小夜转过头，朝他们挥了挥戴着白手套的右手。两个老人像被烫了一下，别开了脸。
@show chiyuki[sad] C
: 冬木千雪坐在窗边。她的发间空着——那支红山茶簪，作为证物收进了驻在所。
chiyuki[sad]: 七濑先生。……谢谢您。今天上午的事。
ritsu: 我只是把能确定的事排了出来。
chiyuki[sad]: 可是我总觉得……我被放出来，是因为另一个人被关了进去。
chiyuki: 湊君的妈妈。……我不知道该用什么表情去看他。
ritsu: 什么表情都不用。他需要的，大概是有人坐在旁边。
chiyuki[think]: ……嗯。
@hide
: 厨房的门帘掀开，霜端着一只托盘走出来。托盘上是一碗粥、一碟烤鱼、两样渍物，冒着热气。
shimo: （石板）老爷 午饭 晚了
renji: 啊……对，今天寄合，耽误了。我送你过去。
: 莲司站起来，迟疑了一下，转向律。
renji[sad]: 七濑先生。老爷子……说想见见你。
renji[sad]: 他的原话是：「把那个把白峰家的媳妇送进雪牢的侦探叫来。」
ritsu: ……好。
sayo: 我也去～？
renji[sad]: 今天……还是别去了。老爷子清醒的时候，说话很……
: 莲司没有把话说完。小夜歪了歪头，笑了。
sayo[smile]: 了解～ 那我和千雪小姐留下来看家。律君，早点回来哦。
: 湊一声不响地站起来，攥住了霜围裙的一角。霜低头看了他一眼，用戴着毛线手套的左手，轻轻按了按他的肩。

@bg snow_garden
@bgm snow
@caption 2月14日 13:35 白峰本宅·雪庭
: 白峰本宅就在白峰屋的斜后方，是一栋黑瓦的老宅。大门里是一方小小的雪庭。
: 莲司说，源一郎住的离屋在本宅侧面，从大门沿雪庭的小路绕过去，大约十五步。
: 小路上的雪被霜每天踩出一条窄窄的沟。两侧的积雪齐膝深，石灯笼戴着一顶厚厚的白帽子。
@se snowstep
: 离屋是一间低矮的平房，背对着本宅，门开在朝向雪庭的这一边。门口的屋檐下挂着一串干柿子。

@bg annex
@bgm calm
@caption 2月14日 13:40 白峰本宅·离屋
@se door
: 一进门，热气扑在脸上，带着炭和旧药的味道。
: 屋子不大。窗户糊了好几层纸，外面的雨户关得严严实实，大白天也像夜里。
: 天花板上吊着一只裸灯泡，橙黄色的光照着屋子中央的被炉。
: 被炉是旧式的掘被炉——从前的围炉里改的。地板上挖下去一个方坑，坑口四周，还镶着一圈黑沉沉的铁框，嵌死在地板里。
@show yomoda[smile] C
: 柜子前跪着一个人，身边堆满了用麻绳捆着的旧账簿。圆眼镜，褐色的长围巾。
yomoda[smile]: 啊，七濑君。
yomoda: 老先生的旧文书，我一册一册地整理，整理了一个冬天，还没整理完一半。
: 四方田把最后一捆账簿推回柜子，关上抽屉，拍了拍手上的灰。脚边那只鼓鼓的皮包，搭扣扣得紧紧的。
@hide
@show genichiro[normal] C
: 被炉里，老人半靠在一摞枕头上，被子拉到胸口。脸颊凹陷，眼窝很深。
: 那双眼睛慢慢地转过来，落在律的身上。不浑浊。冷得像井水。
genichiro: ……东京来的小子。
genichiro: 就是你，把白峰家的媳妇送进了雪牢？
ritsu: 是寄合。
genichiro[smile]: 说得好。寄合。
genichiro: 村子的事，村子自己办。媳妇也好，外人也好……投了票，就是村子的决定。
@show renji[sad] L
renji[sad]: 爸。
genichiro[dark]: 你娶回来的女人，杀了人。我早说过，外面来的东西，靠不住。
: 莲司的手指在身侧攥紧了，又慢慢松开。他什么也没说。
@hide
: 霜跪下来，把托盘放在被炉的桌板上，一样一样地摆好。湊挨着她，想在被炉边坐下。
@show shimo[normal] C
shimo: （石板）小心 铁框的角
: 湊低头看了看坑口那圈铁框。四个角都是直角，黑铁的边棱磨得发亮。他挪开半步，小心地坐在了铁框外面。
@hide
ritsu: 屋里只靠这个被炉取暖？
@show renji[normal] C
renji: 老爷子怕冷，一年到头都离不开它。
renji: 练炭危险，桐谷医生让我们装了这根烟道，通到侧墙外头。
: 莲司指了指被炉坑的一侧。一根铁皮烟道从炉膛里接出来，贴着地板走，穿过朝向本宅的那面侧墙。
@get ch2_flue
renji: 窗户也是老爷子让糊死的。他说一丝风都受不了。
shimo: （石板）练炭 每晚七点半 换新的
renji: 霜每天晚上过来换一块。一块能烧到第二天早上。
> 密闭的屋子，一个炭炉，一根通到外面的管子。
> 管子要是出了什么事——
> ……我在想什么。有人装这根管子，就是为了不出事。
@hide
@show genichiro[normal] C
genichiro: 那个丫头呢？
ritsu: 哪个丫头。
genichiro: 审判过一整座岛的那个。宵鸦岛的判官。
genichiro: 我想看看她。
ritsu: 她不是来给您看的。
genichiro[smile]: 哼。
genichiro: 审判过别人的人，眼睛是什么样的……我想看看。
genichiro[dark]: 我也审判过人。
: 屋子里静了一下。铁壶在炉上嘶嘶地响。四方田正在系围巾的手，停住了。
genichiro: ……惣一……今天是十四号吧……
genichiro: 雪送祭……
: 老人的眼神一下子散了，像一盏灯被风吹得矮了下去。他嘟囔着谁也听不懂的话，慢慢闭上了眼睛。
@hide
@show renji[sad] C
renji[sad]: ……让您见笑了。他就是这样。清醒一阵，糊涂一阵。
renji[sad]: 我们出去吧。
@hide
: 四方田拎起皮包，跟在最后。走到门口，他回头看了一眼被炉里的老人，镜片上反着橙黄的光。

@bg snow_garden
@bgm snow
@caption 2月14日 14:00 雪庭
ritsu: 莲司先生。那根烟道，通到外面哪里？
renji: 侧墙外头……不过那边过不去。您看。
: 莲司领着律走到雪庭的尽头。离屋的侧墙和本宅的侧墙之间，夹着一道两三米宽的窄缝。
: 缝里堆满了从两边屋顶滑下来的雪，一人多高，压得结结实实，像一堵白墙。人是挤不进去的。
: 雪堆上方，离屋的侧墙上探出一截铁皮管口，离雪面一尺多高，正冒着淡淡的热气。
: 管口正上方，是本宅一楼伸出来的庇。单坡的小屋檐上积了一尺多厚的雪，边上整整齐齐地立着一排铁齿。
: 再往上，是本宅二楼的一扇窗。
@se creak
: 那扇窗「吱呀」一声开了。四方田探出半个身子，手里拿着一把雪铲。
@show yomoda[smile] C
yomoda[smile]: 七濑君！这是我的房间。
yomoda: 每天下午我都得用铲子清一清窗台，不然窗户都推不开。
: 他用铲子把窗台上的积雪刮下去。雪落在下面的庇上，被那排铁齿拦住，停住了。
yomoda[smile]: 雪国的生活，就是和雪讨价还价。今天它让一寸，明天它就要回去一尺。
: 他笑着缩回屋里，把雪铲靠在窗边的墙上，关上了窗。
@hide
@show renji[normal] C
renji: 那片庇上装了雪止，免得雪滑下来，砸坏老爷子的屋子。
ritsu: 雪止？
renji: 那排铁齿。雪就算积得再厚，也不会整片滑下去。
renji: 四方田先生去年秋天刚来的时候，住在楼下。后来说二楼那间光线好，看得见山，自己要求换了上去。
renji[sad]: 他是个好人。老爷子那种脾气，也只有他受得了。
@hide
: 莲司摸出一支七星，在手指间转了转，又塞回了烟盒。
renji[sad]: ……晚上的雪送祭，我还得去拉雪橇。七濑先生，您随意走走吧。
@se snowstep
: 他踩着小路上的雪沟，回白峰屋去了。
: 律在窄缝口站了一会儿。
> 排气管口。庇。二楼的窗。
> 三样东西，正好叠在一条竖线上。
> ……不知为什么，这个画面在我脑子里停了很久。
> 雪送祭五点开始。在那之前，还有一点时间。
@explore ch2_day
`
