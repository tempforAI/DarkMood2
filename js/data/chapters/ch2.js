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
  + String.raw`
// ====================================================================
//  日常：自由行动 —— 白峰屋·村道
// ====================================================================

# ch2_d_sayo
@bg inn_hearth
@show sayo[smile] C
@if ch2_d_sayo -> ch2_d_sayo2
sayo[smile]: 啊，律君回来啦～ 老爷子怎么样？
ritsu: 他想见你。
sayo[surprise]: 诶～ 我这么受欢迎？
ritsu: 我替你拒绝了。
sayo: ……
sayo[smile]: 谢谢。
: 小夜膝上摊着一本卷了边的周刊。是来的时候在列车上读的那一本。
: 翻开的那一页，标题印得很大：「宵鸦岛的判官，如今是侦探的助手」。
sayo[smile]: 这个呀，刚才那两位爷爷一直盯着看，我就拿出来读给自己听～
sayo[smile]: 「她用广播、面具和童谣，把一座岛上的人一个一个推上审判台」——写得真有气势呢。
ritsu: 小夜。
sayo[smile]: 不过照片拍得不太好看。我本人明明可爱多了～
: 她合上杂志，用戴着白手套的右手压在封面上。
sayo[think]: ……律君。中午的广播，你听出来了吧。
sayo: 「二片雪，就要落到屋檐上了。」——先把下一句告诉所有人，像给观众发节目单。
sayo: 然后，让所有人自己去猜：落在谁家的屋檐上？
sayo[sad]: 我以前……也这么做过。一模一样。
ritsu: 你现在不是。
sayo[smile]: 嗯。我知道哦。
sayo[sad]: 可是村里的人，不这么想。
: 角落里的两个老人站起来，拿上酒壶，换到了离小夜最远的那张桌子。
sayo[smile]: 你看～ 连座位都给我空出来了。待遇真好。
> 她在笑。笑得很好。
> 宵鸦岛之后，她学会了很多种笑法。这是其中最熟练的一种。
@set ch2_d_sayo
@note sayo 村民认出了她，窃窃私语「宵鸦岛的判官」。她说白蛾的手法和她当年一模一样。
@hide
@return

# ch2_d_sayo2
sayo[smile]: 去忙吧，侦探先生～ 我在这里帮湊君看着他的大福。
sayo: 十六点整，一秒都不能差哦。
@hide
@return

# ch2_d_hwin
@bg inn_hearth
: 窗外是白峰屋门前的村道。路面湿漉漉的，冒着淡淡的白汽——埋在下面的消雪管在喷水。
: 雪落在路面上，一碰就化了。路两边的雪墙，却一天比一天高。
> 这场雪，什么时候停？
@return

# ch2_d_irori
@bg inn_hearth
: 围炉里的炭火烧得很稳。自在钩上的铁壶，壶嘴冒着细细的一缕白汽。
: 炉边摆着一圈烤得焦黄的团子，是霜给湊烤的。湊一个也没吃。
@return

# ch2_d_counter
@bg inn_hearth
: 帐场的格子窗后面，账簿摊开着，墨迹停在二月十三日。
: 墙上的钉子挂着一串钥匙。一块小木牌上写着「广播室」。
> 序章那晚莲司说过：广播室的钥匙三把，村长、邮局、神社。村长的那一把，就挂在这里。
@return

# ch2_d_minato
@bg village_road
@show minato[normal] C
@if ch2_d_minato -> ch2_d_minato2
: 湊一个人站在白峰屋门口的柴棚下，盯着电子表。
minato: 14:52。
ritsu: 在等什么？
minato: 不等什么。我在记。
minato: 中午十二点的报时，我又对过一次表了。一秒都不差。
: 柴棚里立着一架长长的木雪橇。滑板上了蜡，横木上绑着几道麻绳。
minato: 那是祭典的雪橇。晚上要用它运雪灯笼，一直运到送门。
minato[sad]: 每年都是爸爸拉，妈妈在前面提灯。
minato[sad]: ……今年，妈妈不在。
ritsu: 湊。
minato: 侦探哥哥，你不用说什么。
minato: 我记下来的时间，没有错。错的是……
: 他没有说下去，低头按了一下电子表。屏幕亮了一下，又暗了。
minato: 14:53。
@set ch2_d_minato
@note minato 每天对着公民馆 12:00 的报时校准电子表。母亲被关进雪牢后，他仍一分钟一分钟地记着时间。
@hide
@return

# ch2_d_minato2
minato: 晚上我也会记的。祭典开始、结束，雪停……全都记。
@hide
@return

# ch2_d_shed
@bg village_road
: 白峰屋门口带屋檐的柴棚。柴火码得整整齐齐，旁边就是那架祭典的木雪橇。
: 雪橇很长，能躺下一个大人。木条之间留着手指宽的缝。
@return

# ch2_d_nozzle
@bg village_road
: 路面中央一排小小的喷嘴，日夜往外喷着温热的地下水。
: 雪一落下来就化了。路面上一个脚印也没有——连刚才过去的那辆手推车，也没留下一道辙。
@return

# ch2_d_yukawa
@bg village_road
: 路边的雪墙底下，一条小溪冒着白汽流过，钻进村道下的涵洞。
: 是山上雪见汤溢出来的热水，村里人叫它「汤川」。水面上一片雪也存不住。
@return

// ====================================================================
//  日常：离屋（再访）
// ====================================================================

# ch2_d_oldman
@bg annex
@if ch2_d_oldman -> ch2_d_oldman2
: 离屋里比刚才更暗了。老人睡着了，喉咙里呼噜呼噜地响，被炉的被子随着呼吸一起一伏。
: 律放轻脚步，想退出去——
@show genichiro[dark] C
genichiro: ……雪绘……
: 老人没有睁眼。干裂的嘴唇一张一合。
genichiro[dark]: 你回来了……雪绘……
genichiro[dark]: 是那个女孩……是那个女孩……
: 他的眼皮掀开一条缝，浑浊的眼珠转向门口。
: 门口，来收碗的霜站住了。托盘上的碗，轻轻磕了一声。
genichiro: ……不是我……村子的事……村子……
: 老人又沉沉地睡了过去。霜低着头走进来，收起碗筷，一句话也没写，退了出去。
@get ch2_genichiro
> 雪绘。冬木雪绘。千雪的母亲，二十年前被送进雪里的人。
> 「是那个女孩」——哪个女孩？
@set ch2_d_oldman
@hide
@return

# ch2_d_oldman2
: 老人睡得很沉。被炉烧得暖烘烘的，屋里的炭味比外面浓。
@return

# ch2_d_lamp
@bg annex
: 天花板上的裸灯泡，光是橙黄色的。
: 被子、榻榻米、老人的脸——在这种光底下，全都染成了同一种颜色。看不出谁的脸色是红是白。
> 白天也得开着灯。雨户一关，这间屋子就是一口箱子。
@return

# ch2_d_iron
@bg annex
: 掘被炉坑口四周的铁框。从前这里是一只围炉里，铁框是那时候留下来的，四角用铆钉钉死在地板的梁上。
: 律用手试着扳了一下。纹丝不动。
: 角是直角，棱边很利。霜提醒湊「小心铁框的角」，不是随便说说的。
@return

# ch2_d_tansu
@bg annex
: 一只老旧的桐木柜子，抽屉上贴着手写的标签：「昭和三十年代」「昭和四十年代」「昭和五十年代」……
: 塞满了旧账簿和村里的文书。四方田整理过的那几格，麻绳捆得整整齐齐。
: 标着「昭和五十年代」的那一格，比别的格子都空，像是刚被人翻过、又仔细地理好。
@return

# ch2_d_awin
@bg annex
: 窗户糊了三四层纸，纸边用浆糊封得死死的。外面的雨户也关着，一丝光都透不进来。
: 唯一通到屋外的，只有那根铁皮烟道。
@return

// ====================================================================
//  日常：白峰本宅·大广间
// ====================================================================

# ch2_d_yomoda
@bg shiramine_hall
@show yomoda[smile] C
@if ch2_d_yomoda -> ch2_d_yomoda2
: 大广间里，几个老人正围着一个稻草扎的人形，往它身上套一件白衣。四方田蹲在一旁，在野帐上飞快地记着。
yomoda[smile]: 七濑君。来得正好——请看，这就是今晚的主角。
yomoda: 「白衣人偶」。从前雪送祭用的是活人，后来改成了稻草。
ritsu: 从前？
yomoda[think]: 啊，这是我的说法不严谨。准确地说：雪送本身才用活人。祭典，是它的「练习」。
yomoda: 每年二月十四日，村里人把人偶放在雪橇上，用雪灯笼照着，送到送门，推下送道。
yomoda: 民俗学上，这叫「拟死仪礼」。让村子每年都记一遍：罪人该往哪里走，送的人该站在哪里。
yomoda[smile]: 江户中期的文书里就有记载。白峰村的雪送，比周边任何一个村子都完整——
yomoda[smile]: 有寄合，有投票札，有送人，有送门。连「送人」站在门左还是门右，都有规矩。
: 他说着说着，抬眼看了一眼大广间的门口。
: 熊谷大吾抱着一捆稻草站在那里。听见「送人」两个字，他的脸一下子沉了下去。
yomoda: ……送人，要站在门的左边。提着灯。不能回头看被送的人。
: 熊谷把稻草往地上一扔，转身走了出去。拉门被他摔得哐当一响。
yomoda[sad]: ……我失言了。二十年前的送人，就是熊谷先生。
ritsu: 你知道得很清楚。
yomoda[smile]: 研究雪送的人，不可能不知道最后一次雪送。昭和五十八年二月十四日。
yomoda: 被送的是一个外来的寡妇。……文书上只写了这么多。
: 他推了推眼镜，低头在野帐上又记了一笔。笔尖在纸上停了很久，才动起来。
@set ch2_d_yomoda
@note yomoda 研究雪送的民俗学者。说「送人要站在门左，提灯，不能回头看被送的人」。去年秋天自己要求换到本宅二楼正对离屋的房间。
@hide
@return

# ch2_d_yomoda2
yomoda[smile]: 七濑君，晚上的祭典请一定去看。
yomoda: 「白蛾大人之声」那一段，是整个雪送祭最古老的部分。
@hide
@return

# ch2_d_kumagai
@bg shiramine_hall
@show kumagai[angry] C
@if ch2_d_kumagai -> ch2_d_kumagai2
: 熊谷站在本宅的檐廊下，对着院子里的雪喘粗气。
kumagai[angry]: 看什么看，东京来的。
ritsu: 稻草你扔在里面了。
kumagai[angry]: 让那个学者自己去扎！嘴上一套一套的，「送人站在门左」……他懂个屁。
: 他抬头看了看天。铅灰色的云压得很低，雪片细细的，没有风。
kumagai: ……今晚九点前后，雪就停了。
kumagai: 不起风。停了以后，踩下去的脚印一个个都清清楚楚，跟刻上去的一样。
kumagai[dark]: 雪送祭的晚上，雪总是停的。二十年前也是。
ritsu: 二十年前，雪送的那天晚上——
kumagai[angry]: 闭嘴。
: 熊谷瞪了律一眼，踩着雪走了。
@set ch2_d_kumagai
@note kumagai 预报今晚九点前后雪停、不起风；雪停后的脚印「跟刻上去的一样」。
@hide
@return

# ch2_d_kumagai2
: 熊谷已经不在檐廊下了。雪地上一行大脚印，一直通到大门外。
@return

# ch2_d_doll
@bg shiramine_hall
: 稻草扎的人形，和真人差不多大。白衣套在身上，领口用红绳系着。脸是一块空白的布。
: 老人们一边扎，一边低声念着什么。律听不清，只听见一句「白蛾大人收下」。
@return

# ch2_d_portraits
@bg shiramine_hall
: 门楣上挂着一排镜框，是白峰家历代当家的照片。最边上是源一郎，年轻时的脸方正而严厉。
: 旁边还有一张小一些的，系着褪色的黑缎带。一个二十来岁的男人，眉眼和源一郎很像，嘴角挂着轻佻的笑。
: 镜框下面的名牌上写着：「白峰惣一」。
> 二十年前死在水车小屋里的人。
@return

# ch2_d_butsudan
@bg shiramine_hall
: 佛坛的门半开着。一排牌位中间，有一块比其他的都新：「惣一 昭和五十八年二月十三日 行年二十六」。
: 牌位前的线香早就燃尽了。看样子，很久没有人来上过香。
@return

# ch2_d_stairs
@bg shiramine_hall
: 通往二楼的楼梯又陡又窄，踩上去吱嘎作响。
: 莲司说，本宅如今只住着四方田一个人。白峰家的人都住在白峰屋，老爷子住离屋。
@return

// ====================================================================
//  日常：墓地·冬木家旧宅
// ====================================================================

# ch2_d_chiyuki
@bg cemetery
@show chiyuki[normal] C
@if ch2_d_chiyuki -> ch2_d_chiyuki2
: 墓地在村子西边的缓坡上，被雪埋得只剩一排排墓碑的顶。
: 千雪蹲在一块小小的墓碑前，用手套一下一下地拂着碑上的雪。碑上刻着「冬木宗介之墓」。
chiyuki: ……七濑先生。
chiyuki: 是我父亲。我出生的第二年，雪崩，就走了。我一点都不记得他。
: 墓碑前，雪里插着一束松枝。针叶是青的，还挂着新鲜的松脂。
chiyuki[think]: 您看这个。是新的。今天，或者昨天才换上去的。
chiyuki[think]: 冬木家在这个村子里，已经没有人了。……是谁呢？
ritsu: 有人记得他。
chiyuki: 或者……记得我母亲。
: 她把松枝扶正，又在碑前合了掌。合掌的时间很长。
chiyuki: 外婆说，母亲是为了守着父亲的墓，才留在这个村子里的。
chiyuki[sad]: 一个外来的寡妇，留在一个说她闲话的村子里，守着一块墓碑……
chiyuki[sad]: 这样的人，会为了一支发簪去杀人吗？
> 她没有在问我。她是在问那块墓碑。
chiyuki: ……对不起，我说了奇怪的话。
chiyuki: 待会儿……我想去看看我家的旧房子。在墓地下面那条坡道的尽头。
@set ch2_d_chiyuki
@note chiyuki 父亲冬木宗介的墓前插着新鲜的松枝——冬木家在村里已经没有人了，是谁供的？
@hide
@return

# ch2_d_chiyuki2
chiyuki: 墓碑的字，被雪磨得都快看不清了。
chiyuki: 可是供花的人……一直都在。
@hide
@return

# ch2_d_gonzo
@bg cemetery
: 墓地最边上，紧挨着林子，有一块比冬木家的还小的墓碑。
: 碑上的字刻得很朴素：「黑泽权藏之墓 平成七年没」。
: 墓前扫得干干净净，一点积雪都没有。石台上供着半截蜡烛，烛芯是黑的。
: 碑的背面积着厚厚一层雪，冻成了硬壳，看不清刻着什么。
@se snowstep
@show abe[normal] C
: 身后传来踩雪的声音。是杂货店的阿部文，挎着一只装线香的篮子。
abe: 哟，侦探小哥。看炭老头的墓呢？
ritsu: 炭老头？
abe: 黑泽权藏。在谷口的林子里烧炭的，外地来的怪老头。一辈子没跟村里人说过几句话。
abe[smile]: 早死了。平成七年冬天。死在他那间炭小屋里，过了好几天才被人发现。
abe[think]: 谁给他立的碑？……谁知道。反正不是村里出的钱。
: 阿部文撇了撇嘴，挎着篮子往白峰家的大墓那边去了。
@get ch2_grave
> 平成七年——1995 年。八年前。
@hide
@return

# ch2_d_fgrave
@bg cemetery
: 冬木宗介的墓。碑很小，是村里最朴素的那一种。
: 雪里插着新鲜的松枝。碑前的石台上，有一圈浅浅的印子，像是经常有人在这里放一只碗。
@return

# ch2_d_sgrave
@bg cemetery
: 白峰家的大墓占了坡顶最好的位置。黑御影石的碑，比人还高。
: 侧面刻着一行行的戒名。最新的一行：「昭和五十八年二月十三日 惣一 二十六歳」。
: 碑前的花瓶是空的，结着冰。
@return

# ch2_d_pillar
@bg fuyuki_house
@if ch2_d_chiyuki -> ch2_d_pillar_c
: 冬木家旧宅没有上锁。拉门的木框歪了，一推就开。屋里冷得像冰窖。
: 正中的柱子上，有几道刀刻的横痕，一道比一道高。每道刻痕旁边，都写着一行很小的字。
: 最低的那一道旁边：「千雪 二才」。往上一点：「千雪 三才」。再往上，就没有了。
: 律凑近去看。「雪」字的雨字头，四个点没有分开写——它们连成了一道小小的波浪线，像一只张着翅膀飞的蛾子。
> 这种写法……
> 好像在哪里见过。一时想不起来。
@get ch2_pillar
@return

# ch2_d_pillar_c
: 冬木家旧宅没有上锁。千雪在门口站了很久，才伸手拉开那扇歪掉的拉门。
@show chiyuki[normal] C
: 屋里冷得像冰窖。她一步一步地走进来，像怕惊醒什么。
: 正中的柱子上，有几道刀刻的横痕，一道比一道高。每道刻痕旁边，都写着一行很小的字。
: 「千雪 二才」。「千雪 三才」。再往上，就没有了。
: 千雪伸出手，摸着那道最高的刻痕。指尖停在旁边那行小字上。
chiyuki[sad]: ……
: 她张了张嘴，什么也没说出来。
: 律凑近去看。「雪」字的雨字头，四个点没有分开写——它们连成了一道小小的波浪线，像一只张着翅膀飞的蛾子。
> 这种写法……
> 好像在哪里见过。一时想不起来。
chiyuki[sad]: ……三岁。
chiyuki[sad]: 刻完这一道，第二年春天，她就该再刻一道的。
: 千雪把额头轻轻抵在柱子上。很久，很久。
@get ch2_pillar
@hide
@return

# ch2_d_fdoor
@bg fuyuki_house
: 门口的雪地上，有一行别人的脚印，已经被新雪盖软了。踩得很深，脚尖朝着屋里，却没有跨进门槛。
: 那个人在门口站了很久——鞋印周围的雪，被来回挪动的脚压得一片模糊。
> 来过，却没有进去。是谁？
@return

# ch2_d_fhearth
@bg fuyuki_house
: 围炉里早就冷了，炉灰结成了硬块。自在钩上挂着一只生锈的小铁壶。
: 炉边的地板上，有一块小孩子用蜡笔画的涂鸦，褪成了淡淡的红色。
@return

# ch2_d_fcup
@bg fuyuki_house
: 橱柜里只剩几只缺了口的碗。最里面，藏着一只小小的木碗，碗底刻着一个歪歪扭扭的「千」字。
@return

// ====================================================================
//  日常：神社·诊所·杂货店·驻在所
// ====================================================================

# ch2_d_sumi
@bg shrine_hall
@show sumi[normal] C
@if ch2_d_sumi -> ch2_d_sumi2
: 拜殿里点着两盏烛台。葛城澄跪坐在案前，正在写什么。白衣绯袴外罩一件白羽织，背挺得笔直。
sumi: ……七濑先生。
sumi[smile]: 请进。外面冷吧。
: 案上铺着一整张很大的和纸，还没折过。她在上面一行一行地写着祝词，笔迹清秀。
ritsu: 今晚的祝词？
sumi: 是的。雪送祭的「白蛾大人之声」……宫司要替白蛾大人，念给村子听。
: 她写完最后一行，放下笔，把纸轻轻举起来，让墨迹晾干。烛光从纸背透过来——
: 纸里浮出一只白蛾的影子。翅膀张开，触角像两根羽毛。
> 水印。
> 和寄给我的那封信，一模一样的水印。
ritsu: 这纸……
sumi: 是神社自己抄的纸。……很漂亮吧。
sumi: 神社的纸，正月里各家也分到一些。包御札用的。
sumi[sad]: 所以村子里，谁家都有。……您是在想那封信吧。
ritsu: 你知道那封信？
sumi: 千雪小姐给我看过。……「我没有给您写过信」，她说。
: 澄把祝词卷起来，用一根白色的水引系好。
sumi[sad]: 雅女将……今天早上，我给雪牢送了一只火盆。
sumi[sad]: 她一直在问湊君吃饭了没有。……七濑先生，下次去的时候，请告诉她，湊君吃了。
ritsu: 他没吃。
sumi: ……那么，请您让他吃一点。然后再告诉她。
: 她说话很慢，每句话的末尾，都停一拍。像是怕说快了，有什么东西会掉出来。
@set ch2_d_sumi
@note sumi 用整张未折的和纸写祝词，纸里有白蛾水印。「神社的纸，正月里各家也分到一些。」雪送祭由宫司代念「白蛾大人之声」。
@hide
@return

# ch2_d_sumi2
sumi: 祭典六点半开始念祝词。……请站在离喇叭近一点的地方。
sumi[sad]: 那是这个村子，最像它自己的声音。
@hide
@return

# ch2_d_sroom
@bg shrine_hall
: 拜殿旁的储藏室。门半开着，里面堆着祭典用的木箱、卷起来的幔幕、一捆捆注连绳。
: 一只木箱上用墨写着「祭典器材 公民馆借」，箱子是空的。
@return

# ch2_d_offer
@bg shrine_hall
: 赛钱箱的格子缝里积着雪。投进去的硬币，在箱底叮的一声。
@return

# ch2_d_kiriya
@bg clinic
@show kiriya[sad] C
@if ch2_d_kiriya -> ch2_d_kiriya2
: 桐谷诊所的炉子烧得很旺。桐谷修平坐在诊桌后面，手里攥着一只扁酒壶。
kiriya: ……侦探先生。看病？
ritsu: 不。来问问老村长的身体。
kiriya: 心脏不好，肺也不好，脑子时好时坏。七十七了，能熬过这个冬天就算命大。
kiriya[think]: 离屋那根烟道，还是我让莲司装的。练炭那东西……
kiriya: 一不留神，一屋子人睡过去就醒不来了。看不见，闻不到。
: 他拧开酒壶灌了一口。手在抖，酒洒在白大褂的前襟上。
ritsu: 桐谷医生。二十年前，白峰惣一的验尸——
kiriya[shock]: ……！
: 酒壶「咚」地落在桌上。
kiriya[shock]: 1983 年的验尸是我做的……别问了。
kiriya[sad]: 别问了。……我求你。
: 他把酒壶抓回手里，抱在胸口，像抱着一个会被人抢走的东西。
: 墙角那只旧保险柜，漆皮斑驳。他的眼睛往那边瞟了一下，马上又移开了。
@set ch2_d_kiriya
@note kiriya 主张给离屋装烟道（「练炭看不见、闻不到」）。被问到 1983 年的验尸时发抖：「别问了。」眼神瞟向墙角的旧保险柜。
@hide
@return

# ch2_d_kiriya2
kiriya[sad]: 今晚的祭典……我不去了。我在这里喝。
kiriya: 雪送祭的晚上，我一年比一年睡不着。
@hide
@return

# ch2_d_safe
@bg clinic
: 墙角一只老式的铁保险柜，比诊所里任何东西都旧。转盘锁上落着一层灰，把手却是亮的。
@return

# ch2_d_cshelf
@bg clinic
: 药架上，药瓶和酒瓶挤在一起。酒瓶比药瓶多。
@return

# ch2_d_abe
@bg store
@show abe[smile] C
@if ch2_d_abe -> ch2_d_abe2
abe[smile]: 哟，侦探小哥。买点什么？点心？你家那个判官丫头，昨天一口气买了我三包羊羹。
ritsu: ……她叫乌丸小夜。
abe[smile]: 叫什么都一样。全村都知道她是谁。
: 阿部文从柜台下面抽出一本周刊，啪地拍在玻璃上。和小夜膝上的那本是同一期。
abe: 去年进的货，一本都没卖出去。这两天，被人借去看了七八回。
abe[think]: 「用广播、面具和童谣审判一座岛」……你说巧不巧，这村子的白蛾，也是广播、面具、童谣。
ritsu: 白蛾的广播里，提到了二十年前的事。小夜那时候三岁。
abe[smile]: 我又没说是她。我只是说——巧。
: 她眯起眼睛，往窗外瞟了一眼。窗外，马路对面就是驻在所，真壁正在门口扫雪。
abe: 我这个人啊，记性好。谁几点出门，谁买什么烟，谁往哪儿寄信，我都记得。
abe[think]: 二十年前那个寡妇，每个月都来我这儿寄信。厚厚的一叠，寄到东京去。
ritsu: 寄给谁？
abe[smile]: 那我可不能说。邮局有邮局的规矩。
abe: ……再说，早忘了。
@set ch2_d_abe
@note abe 店里的周刊写着「宵鸦岛的判官」。她说二十年前冬木雪绘每个月都往东京寄一叠厚厚的信。
@hide
@return

# ch2_d_abe2
abe[smile]: 七星？那是村长的，你又不抽。
abe: 点心在左边第二格。判官丫头喜欢的那种羊羹，还剩两条。
@hide
@return

# ch2_d_mag
@bg store
: 杂志架上的周刊，最上面那本的封面被人翻得起了毛边。
: 「宵鸦岛的判官，如今是侦探的助手」。配图是一张模糊的远景照片：一个戴白手套的女孩，站在一个青年身后。
@return

# ch2_d_post
@bg store
: 邮局的窗口很小，只容一只手伸进去。窗台上摆着一只黄铜的日期戳，戳面上刻着「白峰局」三个字。
> 从这个村子寄出去的每一封信，都会盖上这个戳。
@return

# ch2_d_phone
@bg store
: 屋檐下的灰色插卡电话。听筒里没有声音，连忙音都没有。
: 桥断的那天晚上，电话线也一起断了。
@return

# ch2_d_makabe
@bg police_box
@show makabe[normal] C
@if ch2_d_makabe -> ch2_d_makabe2
makabe: 七濑先生！辛苦了。上午的寄合……真了不起。
makabe[sad]: 虽然我一想到湊君，就高兴不起来。
ritsu: 雅女将怎么样？
makabe: 我每天晚上十一点去雪牢看一眼，送点热水。今晚也去。
makabe[angry]: 古法也好，什么也好，人关在那里，就是我的责任。等警察来了，我要把她好好交出去。
: 他回头看了看身后的储物柜。
makabe: 千雪小姐的发簪，还有序章那晚找到的定时录音机，都锁在里面。等十八号警察来了，一样一样交上去。
makabe: 一件证物都不能少。我父亲说过，证物是死人留给活人的话。
ritsu: 你父亲也是这里的巡查。
makabe[smile]: 是啊。……他是个怪人，写日记写了一辈子。
: 真壁笑了一下，又正色起来。
makabe[angry]: 对了。村里有人在说乌丸小姐的闲话。说什么判官、白蛾的。
makabe[angry]: 我不管她在岛上做过什么。我只认证据。没有证据的话，谁也别想把她怎么样。
ritsu: ……谢谢。
makabe[smile]: 谢什么。七濑先生不也是这样做的吗？
@set ch2_d_makabe
@note makabe 每晚十一点去雪牢看雅、送热水。千雪的发簪和定时录音机锁在驻在所的储物柜里。「我只认证据。」
@hide
@return

# ch2_d_makabe2
makabe: 我去巡逻了。七濑先生，雪送祭见。
@hide
@return

# ch2_d_locker
@bg police_box
: 墙边的铁皮储物柜，锁得好好的。门上贴着一张手写的纸条：「证物 未经许可不得开启 真壁」。
@return

# ch2_d_radio
@bg police_box
: 桌上的无线电，电池盒的盖子还开着，里面空空的。
: 序章那晚被人拿走的电池，到现在也没找到。
@return
`
  + String.raw`
// ====================================================================
//  傍晚 → 自由时间 → 雪送祭
// ====================================================================

# ch2_day_end
@bg inn_hearth
@filter dusk
@bgm calm
@caption 2月14日 16:30 白峰屋·围炉里之间
: 窗外的天色一点一点地暗下去。雪还在下，细细的，没有风。
: 围炉边，湊的手边放着一张揉平的纸包。大福已经不见了，纸上用铅笔写着一行小字：「16:00」。
> 离雪送祭，还有半个钟头。
> 与其一个人想事情，不如找个人说说话。
@freetime 2
@goto ch2_festival

# ch2_festival
@bg village_road
@filter dusk
@weather snow
@bgm village
@caption 2月14日 17:00 白峰屋门前
: 白峰屋门前聚满了人。披着蓑衣的老人、裹着头巾的妇人，一张张脸被灯笼映得发红。
: 柴棚里的木雪橇被拖了出来。上面码着一层一层的雪灯笼——用雪块垒成的小小的灯龛，里面插着蜡烛。
: 雪橇最上面，躺着那个穿白衣的稻草人偶。空白的布脸朝着天。
@show renji[normal] L
@show minato[normal] R
: 莲司把雪橇的麻绳搭在肩上。湊站在雪橇前面，提着一盏灯笼——往年，那是他母亲的位置。
minato: 17:02。出发。
renji[sad]: ……嗯。出发。
@hide
@se snowstep
: 队伍沿着村道往西北走。每隔十几步，就有人从雪橇上取下一盏雪灯笼，放在路边，点上蜡烛。
: 走在后面的人，脚下便是一串小小的、摇晃的光。
@show sayo[smile] C
: 小夜跟在律旁边，手里也捧着一盏雪灯笼。她走到哪里，前后的人就往两边让开一步。
: 一个裹着红头巾的小女孩回头看她，被母亲一把拽了回去。
sayo[smile]: ……我是不是该在脸上贴一张「不咬人」？
ritsu: 贴了也没人信。
sayo[smile]: 好过分～
: 她把雪灯笼放在路边，弯腰点上蜡烛。火苗在雪龛里抖了两下，稳住了。
@hide
@show chiyuki[sad] L
@show shimo[normal] R
: 千雪走在队伍中间，脸色发白。霜一步不离地走在她身边，手里提着一只小小的手炉。
@hide

@bg okurimon
@filter cold
@bgm lament
@caption 2月14日 18:30 送门
: 天黑透了。
: 村子西北的尽头，立着一扇孤零零的木门。门两边没有墙，只有两根被风雪磨得发黑的门柱。
: 门外，一条窄窄的小道沿着山坡往下，伸进一片看不见底的黑暗。那就是送道。
: 雪灯笼从村道一直摆到门下，又从门下摆出去，沿着送道一盏一盏地往下，越来越小，越来越暗，像一串掉进井里的念珠。
: 门的左边，站着熊谷大吾。他没有提灯，也没有说话，像一根钉在雪里的木桩。
> 「送人，要站在门的左边。」四方田下午说过。
: 门右边搭着一顶小小的白帐篷。帐篷外的竹竿上，绑着一只铁皮喇叭。
: 葛城澄穿着一身白，向众人行了一礼，弯腰走进了帐篷。
@wait 600
@se chime
: 喇叭里响起一阵电流的杂音。然后，一个声音落了下来。
@bgm horror
: 「……白峰之山，白峰之雪。」
: 「雪封之日，罪归于雪。」
: 「白衣之人，往而不返。白蛾大人，请收下吧。」
: 那声音冰冷、平板，分不出男女，也分不出老少。每一个字都像是从很深的雪底下被刨出来的。
: 人群里没有一点声音。连孩子都不哭了。
> 这个声音……
> 前天晚上，防灾广播里那个声音。「这里是白蛾。」
> 当然，不是同一个声音。可是那种冷——那种被抽掉了所有温度的平——像极了。
: 律皱起了眉。
@bgm lament
: 祝词念完了。几个年轻些的男人走上前，把雪橇推到送门下。
: 莲司解开肩上的麻绳。雪橇顺着送道的坡往下滑，载着那个白衣的稻草人偶，滑进灯笼和灯笼之间的黑暗里。
: 没有声音。雪把一切声音都吃掉了。
: 人偶的白衣越来越小，一闪，就看不见了。
@show chiyuki[shock] C
: 千雪的肩膀在发抖。
: 她一直看着人偶消失的地方，眼睛睁得很大。嘴唇动了动，没有发出声音。
@hide
@show shimo[sad] C
: 霜从后面扶住了她的两肩。戴着毛线手套的手，按得很紧。
: 霜自己也在看着那片黑暗。冻疤底下的脸，没有任何表情。
@hide
: 人群的外围，四方田站在一盏雪灯笼旁边。他没有在记笔记。
: 他在看千雪和霜。镜片上落了雪，他也没有去擦。
@explore ch2_fest
`
  + String.raw`
// ====================================================================
//  雪送祭：送门
// ====================================================================

# ch2_f_speaker
@bg okurimon
@if ch2_f_speaker -> ch2_f_speaker2
: 竹竿上绑着的铁皮喇叭，喇叭口结了一圈薄冰。一根黑色的电线顺着竹竿垂下来，钻进旁边的白帐篷。
: 律掀开帐篷的门帘看了一眼。
: 里面一张折叠桌，一台旧式的扩音机，一支话筒。话筒和扩音机之间，接着一只巴掌大的灰色小铁盒，上面有两个旋钮。
@show sumi[normal] C
: 澄正把那只小铁盒放进一只木箱。箱子侧面用墨写着「祭典器材 公民馆」。
sumi: ……七濑先生。
sumi: 祭典的器材，平时都收在公民馆里。……一年只用这一次。
ritsu: 那个盒子，是变声用的？
sumi[smile]: 白蛾大人的声音，不能是宫司自己的声音。……这是规矩。
: 她合上箱盖，轻轻扣好了搭扣。
@hide
> 祭典喇叭、变过声的祝词——和白蛾的广播，像得让人不舒服。
> 祭典的广播，一向由神社的宫司负责。
@get ch2_festival_voice
@set ch2_f_speaker
@return

# ch2_f_speaker2
: 喇叭口的冰又厚了一点。帐篷里的灯已经熄了。
@return

# ch2_f_path
@bg okurimon
: 送道很窄，只容一个人走。两边是没膝的积雪，雪灯笼一盏接一盏，往下一直摆进黑暗。
: 雪橇的滑痕在灯笼之间延伸，越往下越浅，到看不见的地方就断了。
> 二十年前，冬木雪绘就是从这里走下去的。
> 没有雪灯笼。只有暴风雪，和送人手里的一盏灯。
@return

# ch2_f_stones
@bg okurimon
: 送门左边的雪里，露出一排拳头大的石头。圆圆的，排成一行，有十几块。
: 大多数石头上长满了青苔，被雪压得只剩一个顶。最边上那一块却很新，棱角还在。上面什么字也没有刻。
> 一块石头，一个人？
@return

# ch2_f_sign
@bg okurimon
: 门柱边立着一块木牌，字迹被风雪磨得只剩一半：「此去 雪葬谷 白蛾大人之山」。
@return

# ch2_f_kumagai
@bg okurimon
@show kumagai[dark] C
@if ch2_f_kumagai -> ch2_f_kumagai2
: 熊谷一动不动地站在门左边。雪落在他的帽子上、肩膀上，积了薄薄一层，他也不掸。
ritsu: 熊谷先生。
: 没有回答。
ritsu: 你每年都站在这里吗？
kumagai: ……二十年前，我就站在这里。
: 他的声音很低，低得几乎被雪吞掉。
kumagai[dark]: 提着灯。她走在前面。白衣服……那天晚上的风，比今年大得多。
kumagai[dark]: 她走到这道门下面，停了一下——
: 他突然闭上了嘴。下巴上的胡子里，结着细细的冰碴。
kumagai[angry]: ……东京来的。滚。
kumagai[angry]: 别在送门前头问东问西。这地方，不是给外人看热闹的。
@set ch2_f_kumagai
@note kumagai 二十年前作为「送人」提灯把冬木雪绘带到送门。说到「她走到门下停了一下」就闭了嘴。
@hide
@return

# ch2_f_kumagai2
: 熊谷背对着律，盯着送道下面的黑暗。他的肩膀上，雪越积越厚。
@return

# ch2_f_chiyuki
@bg okurimon
@show chiyuki[sad] C
@if ch2_f_chiyuki -> ch2_f_chiyuki2
chiyuki[sad]: ……七濑先生。对不起，让您看见我这个样子。
chiyuki[sad]: 我以为我能忍住的。只是稻草，只是一个祭典。
chiyuki: 可是它滑下去的时候……一点声音都没有。
chiyuki[sad]: 我母亲走下去的时候，大概也是这样。没有声音。没有人叫住她。
ritsu: 回去吧。你在发抖。
chiyuki: 霜阿姨也这么说。
: 她低头看着自己的手。手里握着霜塞给她的那只手炉。
chiyuki[think]: 霜阿姨……一直扶着我，扶得好紧。
chiyuki[think]: 她的手在抖。……我不知道是冷，还是别的什么。
@set ch2_f_chiyuki
@note chiyuki 雪送祭上看着稻草人偶滑下送道，止不住地发抖。霜一直扶着她，霜的手也在抖。
@hide
@return

# ch2_f_chiyuki2
chiyuki: 我没事了。……真的。
@hide
@return

# ch2_f_shimo
@bg okurimon
@show shimo[normal] C
@if ch2_f_shimo -> ch2_f_shimo2
: 霜把手炉留给了千雪，自己的手缩在袖子里。她看见律，在石板上写了几个字。
shimo: （石板）七点半 给老爷 换练炭
shimo: （石板）先走了 千雪小姐 拜托您
: 她向律鞠了一躬，沿着雪灯笼的光，一个人往村子的方向走去。
@set ch2_f_shimo
@hide
@return

# ch2_f_shimo2
: 霜已经走远了。雪灯笼的光里，只剩一行小小的脚印。
@return

# ch2_f_yomoda
@bg okurimon
@show yomoda[normal] C
@if ch2_f_yomoda -> ch2_f_yomoda2
yomoda: ……七濑君。
: 四方田摘下眼镜，用围巾擦了擦镜片上的雪，又戴上。
yomoda: 送门左边那排石头，您看见了吗？
yomoda: 从前每送走一个人，村子就在这里放一块。不刻名字。被送走的人，是没有名字的。
yomoda[sad]: 最边上那一块，是昭和五十八年的。
ritsu: 你连这个都知道。
yomoda[smile]: 研究这个，研究了二十年。
: 他的目光越过律的肩膀，落在千雪身上。千雪正低着头，抱着那只手炉。
yomoda[sad]: ……冬木小姐在发抖。
yomoda: 二十年前的那一夜，大概也是这么冷吧。
yomoda[normal]: 我先回白峰屋吃晚饭了。九点半回本宅，晚上还要整理文书。
@set ch2_f_yomoda
@note yomoda 送门左边的一排石头，每送走一个人放一块，不刻名字。最边上那一块是昭和五十八年的。
@hide
@return

# ch2_f_yomoda2
yomoda: 七濑君，回去吧。祭典的后半，就是喝酒了。
@hide
@return

// ====================================================================
//  祭典之后 → 21:00 雪停 → 22:30 小夜去离屋
// ====================================================================

# ch2_fest_end
@bg village_road
@filter cold
@weather snow
@bgm snow
@caption 2月14日 20:30 村道
: 雪灯笼一盏一盏地熄了。人们三三两两地往回走，嘴里呵着白气。
@show renji[sad] C
renji: 七濑先生，我先去看看老爷子。
renji[sad]: 每年雪送祭的晚上，他都要问一遍「送走了没有」。
@hide
@se snowstep
: 莲司转进白峰本宅的大门。湊抱着那盏熄了的灯笼，一个人站在门口等他。

@bg inn_hearth
@filter none
@weather none
@bgm calm
@caption 2月14日 21:00 白峰屋·围炉里之间
: 祭典之后，村里的人照例聚到白峰屋喝酒。围炉里之间挤得满满的，热气、酒气、人声，把屋顶都要掀开了。
: 熊谷坐在角落里，一个人对着一壶冷酒。桐谷说不去祭典，最后还是来了，缩在熊谷旁边，脸已经红了。
: 四方田和几个老人坐在一起，正讲着什么江户时代的文书。老人们听得直点头。
@show minato[normal] C
: 湊一个人跪在窗边的坐垫上，脸贴着玻璃。
minato: ……21:00。
minato: 侦探哥哥。雪停了。
: 律走到窗边。
: 雪真的停了。云层裂开一道缝，露出几颗星星。屋檐下的冰柱一根也没有晃——没有风。
: 村道两边的雪墙上，积着刚落下的新雪，平平整整，像一块刚刮过的白板。
@hide
@show kumagai[normal] C
kumagai: 我说什么来着。九点。
kumagai: 今晚踩下去的脚印，明天早上还在。一个都跑不掉。
@hide
@show renji[sad] C
: 莲司从门外进来，肩上落着一点残雪。湊立刻跑过去，攥住了他的袖子。
ritsu: 老爷子怎么样？
renji: ……精神还好。还好。
: 他说了两遍「还好」，眼睛却没有看律。
@hide
: 九点半，四方田起身告辞。
@show yomoda[smile] C
yomoda[smile]: 诸位，我先回本宅了。老先生的文书，今晚还想再理几册。
minato: 21:30。
yomoda[smile]: 湊君的表，比公民馆的钟还准。
@hide
@se door
: 门开了又关上。一股冷气卷进来，又被人声挤了出去。

@bg inn_hearth
@caption 2月14日 22:20 白峰屋·围炉里之间
: 喝酒的人走了一大半。剩下熊谷和桐谷，还有两三个老人，在炉边低声说话。
: 莲司在帐场里坐了很久，账簿一页也没翻。手指间夹着一支七星，没有点。
: 后来他站起来，走到小夜面前。
@show renji[sad] L
@show sayo[normal] R
renji[sad]: 乌丸小姐。……有件事。
renji[sad]: 刚才我去看老爷子，他……一直在说，要见你。
renji[sad]: 我没敢告诉你。拖到现在。可他说，你要是不去，他就自己爬过来。
sayo[surprise]: 诶～ 那可不行。老人家在雪地里爬，会感冒的。
ritsu: 小夜。
sayo[smile]: 没关系的，律君。我就去看一眼，说两句话。
ritsu: 我陪你去。
renji[sad]: 老爷子说……只要她一个人。
renji: 湊还没睡，我得带他上楼。……七濑先生，您在本宅大门口等她，好吗？
ritsu: ……好。
@hide
: 角落里，熊谷抬起眼皮，往这边看了一眼，又低下头去喝他的酒。

@bg snow_garden
@filter cold
@weather none
@bgm mystery
@caption 2月14日 22:28 白峰本宅·大门
: 雪停了一个半钟头。夜空干净得像洗过一样，月亮挂在本宅的屋脊上。
: 大门里的雪庭，铺着一层平平整整的新雪。小路上原来的雪沟被填平了，只剩几处浅浅的凹痕——是霜和莲司傍晚踩过的地方，边缘已经软得看不出形状。
: 离屋的门缝里，透出一线橙黄色的光。
@show sayo[smile] C
sayo[smile]: 那我去了～
: 小夜踏上小路。新雪在她的靴底下发出「咯吱」一声。
@se snowstep
sayo[smile]: 律君，你看。
: 她回过头，指了指脚下。
sayo[smile]: 今晚，我是第一个在这里留下脚印的人哦。
ritsu: ……快去快回。
sayo[smile]: 遵命，侦探先生～
@hide
@se snowstep
: 一行小小的脚印，沿着小路往离屋延伸过去。边缘锋利，像是用刀刻在雪上的。
@se door
: 离屋的门开了，又关上。那一线橙黄色的光，被吞了进去。
@wait 800
: 律站在大门的门柱下。没有风，冷气一点一点地从鞋底往上爬。
: 本宅的二楼亮着灯。灯光照在雪庭的雪上，四四方方的一块。
> 宵鸦岛的判官。审判过一整座岛的丫头。
> 那个老人想从她身上看见什么？
@wait 800
@se clock
: 手表的指针走到 22:48。
@se shout
@shake
: 「——滚回去吧，丫头！」
: 离屋里传出老人的吼声，撞在雪庭的墙上，又弹了回来。然后，什么声音都没有了。
@se door
: 22:50。离屋的门开了。小夜走出来，回身把门关好，沿着自己来时的脚印，一步一步地走回来。
@show sayo[normal] C
ritsu: 小夜？
sayo[smile]: ……被赶出来了～
sayo[smile]: 老爷子嗓门真大。耳朵到现在还嗡嗡的。
: 她在笑。笑得比平时慢了半拍。
sayo: ……走吧，律君。好冷。
@hide

@bg inn_room
@filter night
@bgm sad
@caption 2月14日 23:00 白峰屋·律的房间
: 律的房间里，千雪已经泡好了茶在等。暖炉上的水壶嘶嘶地响。
@show chiyuki[normal] L
@show sayo[normal] R
chiyuki: 乌丸小姐，您的手好冰。先喝点热的。
sayo[smile]: 谢谢～ 千雪小姐真是白衣天使。
chiyuki: ……他说了什么？那位老先生。
: 小夜捧着茶碗，看着里面的茶叶慢慢沉下去。
sayo: 说了好多。一会儿清醒，一会儿糊涂。
sayo: 屋里好热哦。被炉烧得很旺，我都出汗了。灯是橙色的，什么都看不太清……
sayo[think]: 他让我坐在被炉对面。然后，盯着我看了好久。
@hide
@flashback on
@bg annex
@bgm stop
@show genichiro[normal] R
genichiro: ……你就是那个丫头。
@show sayo[smile] L
sayo[smile]: 晚上好～ 我是乌丸小夜。听说您想见我？
genichiro: 坐。
genichiro: 你也审判过别人吧。用广播，用童谣，把人一个一个推上台子。
sayo[sad]: ……是。
genichiro: 什么滋味？
sayo[sad]: ……很冷。比这间屋子冷多了。
genichiro[smile]: 冷？哼。
genichiro[dark]: 我也审判过一个女人。全村投的票。我一点都不冷。
genichiro: 村子的事，村子自己办。二十年了，我一直是这么办的。
: 老人的眼神忽然散开了。他往前探着身子，枯瘦的手伸过被炉，抓住了小夜戴着白手套的右手。
genichiro[shock]: ……雪绘？
genichiro[sad]: 你回来了吗……雪绘……你的手……冷不冷……
sayo[surprise]: 我不是雪绘小姐。
genichiro[dark]: ……不是你……我知道不是你……是那个女孩……
genichiro[dark]: 阿部那婆子……
: 他的嘴唇抖了一下，把剩下的半句话咽了回去。
sayo: 老先生。
: 小夜没有抽回手。她的声音里，没有「～」了。
sayo: 二十年前，您审判的那个人——她真的有罪吗？
: 老人的手猛地一缩。那双眼睛又变回了井水的颜色。
@se shout
@shake
genichiro[angry]: ——滚回去吧，丫头！
@hide
@flashback off
@bg inn_room
@filter night
@bgm sad
@show sayo[smile] C
sayo[smile]: ……就这样，被赶出来了～
sayo[smile]: 我是不是很不会讨老人家喜欢？
ritsu: 他提到了阿部婆婆。
sayo: 嗯。只说了半句。
: 小夜低头看着自己的右手。白手套的指尖，被老人攥出了几道皱褶。
sayo[sad]: 律君。那个人的手，好冷。
sayo[sad]: 屋子里那么热……他的手，还是那么冷。
@hide
@show chiyuki[sad] C
chiyuki[sad]: ……「雪绘，你回来了吗」。
chiyuki[sad]: 二十年了。那个人，还在等我母亲回来。
chiyuki: 是怕她回来。……还是，想她回来？
@hide
: 那天晚上，三个人在律的房间里坐了很久。说宵鸦岛，说仙台，说千雪工作的医院里那棵很大的樱花树。
: 谁也没有再提离屋。
@se clock
: 千雪起身告辞的时候，律看了一眼手表。
: 0:30。
> 雪停了，风也停了。今晚的村子，安静得听得见自己的心跳。
> 那时候，我以为这一夜就会这样过去。
@fade out
@wait 800
`
  + String.raw`
// ====================================================================
//  2/15 清晨：发现
// ====================================================================

# ch2_morning
@bg inn_room
@filter none
@weather none
@bgm stop
@caption 2月15日 6:42 白峰屋
@fade in
@se crash
: 铛、铛、铛——
: 楼下传来金属敲打的声音，又急又乱，像是有人拿着锅盖，拼命地敲着什么。
: 紧接着，是湊的喊声。
@bg inn_entrance
@bgm tension
@show shimo[shock] C
: 玄关的土间里，霜扶着门框站着，手里攥着一只铝锅盖。头巾歪了，脸白得像纸，胸口剧烈地起伏。
: 她扔下锅盖，抓起胸前的石板，粉笔在上面划得吱吱响。
shimo: （石板）老爷 倒了 离屋
shimo: （石板）屋里 头晕 不能进
: 她写完，身子晃了一下。千雪从楼梯上冲下来，一把扶住了她。
@show chiyuki[shock] L
chiyuki[shock]: 霜阿姨！您哪里不舒服？
shimo: （石板）头晕 想吐 没事
chiyuki: 怎么会没事……您先坐下。
@hide
@show renji[shock] C
: 莲司光着脚从里屋跑出来，听见「离屋」两个字，脸上的血色一下子退干净了。
renji[shock]: ……爸。
@hide

@bg snow_garden
@bgm horror
@caption 2月15日 6:50 白峰本宅·雪庭
: 早晨的雪庭白得刺眼。雪停了一夜，雪面冻出了一层薄薄的硬壳。
ritsu: 等一下！——别踩小路。
: 律在大门下张开手臂，拦住了身后的人。
ritsu: 沿着墙根走。小路上的脚印，一个都不要碰。
: 小路上有两行脚印。
: 一行是小夜的，昨晚留下的：小小的，一去一回，边缘锋利，冻得硬邦邦的。
: 另一行是新的，步子很大，好几处踩塌了雪壳——从大门到离屋门口，又从离屋门口折到本宅的玄关，再从玄关跑回大门。是霜。
: 本宅的玄关下，站着四方田。他披着一件棉袍，脸色青白。
@show yomoda[shock] C
yomoda[shock]: 七濑君……
yomoda: 霜小姐来敲门，我出来一看，她在石板上写着「老爷 倒了」……
yomoda[sad]: 我想过去，她拼命地摇头，拦着我，比划着……「别进去，头晕」。
yomoda[sad]: 然后她就跑去白峰屋叫人了。我……我一直站在这里，什么也没做。
@hide
: 离屋的门敞着。霜跑出来的时候没有关。门槛上，一只托盘翻倒在地，粥洒在雪上，已经冻住了。

@bg annex
@bgm horror
@caption 2月15日 6:55 离屋
: 律用围巾捂住口鼻，走了进去。
: 屋里闷得像一口箱子。炭味浓得发甜。只待了几秒，太阳穴就一跳一跳地疼。
: 裸灯泡还亮着，橙黄色的光，一动不动。
: 白峰源一郎扑倒在被炉的坑口边。半个身子还在被子里，脸朝下贴着榻榻米，右手伸得长长的，指向门口。
: 额头底下，榻榻米上洇开巴掌大的一块血。
@show renji[shock] C
renji[shock]: 爸……！
: 莲司跪下去，手伸到一半，停在半空。他没有碰父亲。他只是跪在那里，一动也不动。
@hide
ritsu: 莲司先生，先出去。门开着，屋里的气还没散。
@bgm tension
@bg snow_garden
@caption 2月15日 7:00 雪庭
: 没过多久，桐谷被人从被窝里拖了过来。棉袍外面胡乱套着白大褂，一身隔夜的酒气。
: 他在离屋里待了十来分钟。出来的时候，扶着门框干呕了几声。
@show kiriya[sad] C
kiriya: ……额头遭钝器击打。是有棱有角的硬东西。
kiriya: 死亡时间……昨晚十一点到一点之间。
kiriya[sad]: 我……我只能看到这么多。那灯，那灯太暗了……
@hide
: 雪庭外的村道上，人越聚越多。有人披着被子，有人提着灯笼，一张张脸挤在大门外。
@show abe[angry] C
abe[angry]: 十一点到一点？
abe[angry]: 昨晚那个判官丫头，不就是十点半进的离屋吗！熊谷亲耳听见村长去叫她的！
@hide
@show kumagai[angry] C
kumagai[angry]: 看看这雪！九点以后，进过离屋的就只有那一行小脚印！
kumagai[angry]: 东京来的，你那丫头干的好事！
@hide
@show sayo[normal] C
: 小夜站在律身后。她看着小路上自己那一行脚印，看了很久。
sayo[smile]: ……早知道，就不在雪上留脚印了～
: 没有人笑。
@hide
@show renji[shock] C
: 莲司从离屋里走出来，手里什么也没拿，脸上却比刚才还要白。
renji[shock]: ……柜子里的那本东西，不见了。
ritsu: 什么东西？
renji: 老爷子的旧记录本。二十年前……寄合的记录。
renji[sad]: 那本东西，老爷子连我都不许碰。每天晚上睡觉前，都要伸手摸一摸那个抽屉。
@hide
@show abe[angry] C
abe[angry]: 听见没有！二十年前的寄合记录！
abe[angry]: 判官丫头偷走了！她就是来审判二十年前的事的——白蛾就是她！
@hide
: 人群里炸开了一片嗡嗡声。「白蛾」「判官」「宵鸦岛」，一个词接一个词，像雪块一样砸过来。
villager{长老}: 都别吵！
: 一个拄着拐杖的老人从人群里走出来。是村里最年长的长老之一。
villager{长老}: 今天十三点，裁屋，寄合。
villager{长老}: 那丫头关在白峰屋，不许出门。老村长的屋子，寄合之前一样东西都不许动——雨户、窗户、尸首，都不许碰。
@show makabe[angry] L
makabe[angry]: 我是驻在所的巡查。现场由我来看着。
makabe: 七濑先生要调查，我陪着。这样谁都没话说吧？
villager{长老}: ……哼。随你们。
@hide
@show sayo[smile] C
: 熊谷粗着嗓子催小夜走。小夜朝律眨了眨眼睛。
sayo[smile]: 律君。嫌疑人乌丸小夜，在白峰屋随时恭候审问哦～
sayo: ……拜托了。
: 最后那三个字，没有带「～」。
@hide
> 先把能确定的事排出来。
> 昨晚 22:48，我站在大门口，亲耳听见老人在吼。22:50，小夜走出来。之后她一直和我、千雪在一起，直到 0:30。
> 这是我自己的证词。在村子眼里，它不值一分钱。
> ——那就去找值钱的东西。
@get ch2_ritsu
@explore ch2_inv
`
  + String.raw`
// ====================================================================
//  搜查：离屋（案发现场）
// ====================================================================

# ch2_i_body
@bg annex
: 白峰源一郎扑倒在被炉的坑口边，脸朝下。棉袍的下摆还压在被炉的被子里，像是正要从被子里爬出来。
: 右手伸得长长的，五根手指张开，指尖离门口还有两张榻榻米远。
: 额头底下有一道伤，皮肉翻开一点。血不多，在榻榻米上洇开巴掌大的一块，已经发黑了。
> 指甲干净，衣服整齐，没有扭打过的痕迹。
> 他想爬到门口去。为什么？
@get ch2_body
@return

# ch2_i_livid
@bg annex
: 律和真壁一起，把老人的肩膀稍稍抬起一点。
: 贴着榻榻米的那半边脸颊、脖子和胸口，积着一大片尸斑。
: 律凑近去看。裸灯泡的光是橙黄色的，照在什么东西上，都只剩下一种颜色。
> 暗红？……又好像不太像。
> 说不上来。总觉得有点怪。
ritsu: 真壁先生，有手电吗？
@show makabe[sad] C
makabe[sad]: 昨晚去雪牢给雅女将送热水，落在那边了……中午送饭的时候我去拿回来。
@hide
: 长老的话还在耳边：寄合之前，雨户、窗户都不许动。离屋里能用的光，只有这一只灯泡。
@get ch2_lividity
@return

# ch2_i_kiriya
@bg annex
@show kiriya[sad] C
@if ch2_i_kiriya -> ch2_i_kiriya2
: 桐谷靠在门框上，脸色比死人还难看。他从白大褂的口袋里摸出扁酒壶，拧开，又拧上了。
kiriya: ……侦探先生。
kiriya: 额头遭钝器击打。有棱有角的硬东西——伤口的边是直的。
kiriya: 尸体已经硬了，尸斑也压不褪了。死后六到八个钟头……昨晚十一点到一点之间。
ritsu: 尸斑的颜色呢？
kiriya[think]: 颜色？……这灯底下，什么颜色都一个样。暗红吧。正常的。
ritsu: 您昨晚喝到几点？
kiriya[shock]: ……
kiriya[sad]: 十二点半。在白峰屋。熊谷可以作证。
kiriya[sad]: 我知道你想说什么。我今天早上的手是抖的。可这么大一道口子，喝醉了也看得出来。
@get ch2_kiriya
@hide
@return

# ch2_i_kiriya2
kiriya[sad]: 别再问了。我头疼得要裂开……这屋子，待久了就头疼。
@hide
@return

# ch2_i_iron
@bg annex
: 掘被炉坑口四周的铁框，靠门那一侧的角上，粘着一点发黑的血，还有两三根白发。
: 律比了比额头那道伤的形状——直的，长短、角度，都和这个角对得上。
: 他握住铁框，用力往上扳。纹丝不动。铆钉把它钉死在地板下的梁上。
> 这东西，没有人能拿起来挥。
> 不是铁框砸了他的头。是他的头，撞上了铁框。
> 那么——他为什么会倒下去？
@get ch2_iron
@return

# ch2_i_kotatsu
@bg annex
: 律掀开被炉的被子。坑底的炉膛里，一块练炭整块烧成了灰白色，形状还在，一碰就碎成了粉。
: 炉膛的铁壁还有一点余温。
> 霜说过，每晚七点半换一块新的，能烧到第二天早上。
> 昨晚那一块，烧得干干净净。烧了一整夜。
@get ch2_rentan
@return

# ch2_i_flue
@bg annex
: 铁皮烟道从炉膛侧面接出来，贴着地板走了两米多，穿过侧墙。
: 律顺着它一节一节地摸过去。每一个接口都扣得严丝合缝，没有松动，没有被人拆过的痕迹。
: 穿墙的地方，用泥灰封得好好的。
> 屋里这一段，没有人动过。
> 窗户糊死，雨户紧闭。这根管子，是这间屋子唯一的出气口。
@get ch2_flue
@update ch2_flue 从掘被炉接出的一根铁皮烟道，穿过离屋朝向本宅那一侧的侧墙，管口开在墙外。屋里这一段完好，接口严丝合缝，没有被动过的痕迹。窗户糊死、雨户紧闭——这根烟道是这间屋子唯一的出气口。
@return

# ch2_i_lamp
@bg annex
: 天花板上的裸灯泡。罩子都没有，光是橙黄色的，把整间屋子染成一个颜色。
: 桐谷就是在这只灯泡底下验尸的。
@return

# ch2_i_window
@bg annex
: 窗户糊了三四层纸，纸边用浆糊封死。外面的雨户也关着。
: 长老说，寄合之前不许动。律只能隔着纸，听见外面隐约的人声。
@return

# ch2_i_tansu
@bg annex
: 桐木柜子。标着「昭和五十年代」的那一格抽屉被拉开了一半，里面的文书码得整整齐齐——
: 正中间，却空出了一本书那么宽的一道缝。
@if ch2_i_tansu -> ch2_i_tansu2
> 莲司说，老爷子每晚睡前都要摸一摸这个抽屉。
> 二十年前的寄合记录本，原本就在这里。
@set ch2_i_tansu
@return

# ch2_i_tansu2
> 拿走它的人，把剩下的文书又码得整整齐齐。很有耐心，很爱惜纸。
@return

# ch2_i_tray
@bg annex
: 门槛边翻倒着一只托盘。粥洒了一地，冻成了一片白色的硬壳。一只碗滚到了雪庭的台阶下。
> 霜一开门，就扔下了托盘。
@return

// ====================================================================
//  搜查：雪庭（离屋侧）
// ====================================================================

# ch2_i_path
@bg snow_garden buried
: 律蹲在小路边，一行一行地看过去。
: 小夜的脚印。二十三号左右的女靴，一去一回，步幅均匀，没有跑。边缘锋利得像刀切的，底部干干净净——雪停之后踩下去的。
: 霜的脚印。今天早上的，步子很大，好几处踩塌了雪壳。大门到离屋门口，离屋门口到本宅玄关，玄关再到大门。
: 小路两侧还有几处被落雪填平的浅凹，边缘软得认不出形状——是雪停之前，霜七点半来换练炭、莲司八点四十来看父亲时踩的。
: 除此以外，什么都没有。没有一行脚印离开小路，往窄缝那边去。
@get ch2_tracks
@return

# ch2_i_gap
@bg snow_garden buried
: 离屋和本宅之间的窄缝，两三米宽，堆着一人多高的雪。
: 雪面平平整整，被月光冻出了一层壳。没有脚印，没有梯子的印子，没有任何东西压过的痕迹。
> 人进不去。进去了，也一定会留下痕迹。
@get ch2_gap
@return

# ch2_i_vent
@bg snow_garden buried
: 律站在窄缝口，往里看。
: 昨天下午，排气管口还高出雪面一尺多，冒着淡淡的热气。现在，它不见了。
: 管口的位置上，堆着一堆雪块。一块一块的，大的像砖头，小的像拳头，棱角分明。
: 好几块雪的断面上，留着平直的刮痕——像是用什么扁平的东西切出来的。
> 屋檐上自然滑下来的雪，是一整片圆滑的雪舌，不会碎成这种带棱角的块。
> 管口被埋住了。被炉的烟，出不去了。
> ……如果是在老人还活着的时候——
@get ch2_vent
@return

# ch2_i_eave
@bg snow_garden buried
: 管口正上方，是本宅一楼的庇。单坡的小屋檐上，积雪一尺多厚，被那排雪止的铁齿拦得稳稳当当。
: 可是在二楼那扇窗的正下方，庇上的积雪缺了一块。
: 缺口的断面是直的，上下两刀，角是直角。像是用铲子切下了一块豆腐。
: 断面上没有一点新雪。
> 雪是九点停的。这一刀，是雪停之后切的。
@get ch2_snowstop
@return

# ch2_i_win2f
@bg snow_garden buried
: 抬头看，二楼的那扇窗关着，窗帘拉得严严实实。
: 从这里看不见窗台。只看得见窗户、窗下的庇，和庇下面那堆被埋住的雪。
: 三样东西，叠在一条竖线上。
@return

# ch2_i_gate
@bg snow_garden buried
: 昨晚，律就站在这扇大门的门柱下面。
: 从这里，看得见离屋的门。看不见窄缝里面。
@return

# ch2_i_adoor
@bg snow_garden buried
: 离屋的门是一扇普通的木拉门，没有锁。小夜的脚印在门前的石阶上停下，又从这里折回去。
: 门槛边，霜打翻的托盘还在。
@return

# ch2_i_makabe
@bg snow_garden buried
@show makabe[normal] C
@if ch2_i_makabe -> ch2_i_makabe2
: 真壁蹲在小路边，用一把卷尺量着小夜的脚印，在警察手帐上一笔一笔地记。
makabe: 七濑先生。乌丸小姐的鞋印，二十三号。一去一回，步子一样大，没有跑。
makabe: 霜阿姨的是今早的，一路在跑。别的……什么都没有。
makabe[think]: 我昨晚十一点去雪牢看雅女将，送了热水，十一点半回驻在所，一直待到早上。
makabe[sad]: 路过本宅的时候……什么都没注意到。要是我多看一眼就好了。
ritsu: 你那时候不知道要看什么。我也一样。
makabe[angry]: ……七濑先生。乌丸小姐不是那种人。我只认证据——所以，我们去找证据。
@set ch2_i_makabe
@hide
@return

# ch2_i_makabe2
makabe: 现场我看着。谁也别想动一片雪。
@hide
@return

// ====================================================================
//  搜查：本宅二楼（四方田的房间）
// ====================================================================

# ch2_i_yomoda
@bg shiramine_2f
@show yomoda[sad] C
@if ch2_i_yomoda -> ch2_i_yomoda2
: 四方田坐在书桌前，披着那件棉袍，双手捧着一杯早就凉了的茶。
yomoda[sad]: 七濑君……这种时候，还要麻烦您跑上来。
yomoda: 老先生的事……我很难过。我们每天下午都在一起整理文书，他骂我骂了一个冬天。
ritsu: 昨晚您在做什么？
yomoda: 九点半从白峰屋回来，在这张桌子上整理了一会儿文书。
yomoda: 十一点就睡了。睡得很沉，什么都没听见。
yomoda: 早上是霜小姐敲门把我叫醒的。六点半过一点。
ritsu: 窗户呢？
yomoda[smile]: 窗户？一整晚都没开过。外面那么冷。
ritsu: 雪铲呢？
yomoda: 雪铲是我下午清窗台用的。……七濑君，您昨天亲眼看见了吧？
: 他推了推眼镜，笑得很温和。
@get ch2_yomoda
@hide
@return

# ch2_i_yomoda2
yomoda: 乌丸小姐……真是可怜。宵鸦岛的事，我也读过报道。
yomoda[sad]: 一个人只要被贴上那种标签，在这种村子里，是很难撕下来的。
@hide
@return

# ch2_i_2fwin
@bg shiramine_2f
: 律推开窗户。冷气灌进来，带着雪的味道。
: 探出身子往下看——正下方就是一楼的庇。积雪缺了一块的地方，离窗台只有一臂远。
: 再往下，是窄缝，和那堆埋住管口的雪块。
> 从这里伸手出去，用一把铲子，就够得着。
> 不用下楼。不用走过雪庭。
@get ch2_snowstop
@return

# ch2_i_sill
@bg shiramine_2f
: 窗台外侧的积雪被拂得乱七八糟。有的地方刮到了木头，有的地方堆成了一小撮。
: 那些乱痕的边缘是锋利的，上面没有一点新雪。
: 律摸了摸窗框的内侧。湿的。木头的缝里，还渗着化开的雪水。
> 四方田说，他每天下午清一次窗台。
> 可雪一直下到晚上九点。下午清过的窗台，到九点应该又积上了一层平平整整的新雪。
> 现在这副样子——是雪停之后，有人开过这扇窗。
@get ch2_window
@return

# ch2_i_closet
@bg shiramine_2f
: 律拉开壁橱的门。被褥下面，斜靠着一把雪铲。
> 昨天下午，这把铲子靠在窗边的墙上。
: 铲刃的凹槽里，卡着一层半化的冰碴。壁橱的地板上，一滩水还没渗干，洇湿了一角被褥。
@show makabe[think] C
makabe[think]: 这屋里的暖炉烧了一整夜……要是昨天下午用的，十几个钟头，早该干透了。
@hide
@get ch2_shovel
@return

# ch2_i_bag
@bg shiramine_2f
@if ch2_i_bag -> ch2_i_bag2
: 书桌下面放着那只鼓鼓的皮包。昨天下午在离屋，它的搭扣就扣得紧紧的。
@show makabe[normal] L
@show yomoda[normal] R
makabe: 四方田先生。老村长柜子里的记录本不见了，我们在查。可以看一看您的包吗？
yomoda[smile]: 请便。我没什么可藏的。
: 真壁打开搭扣。包里是一叠叠用麻绳捆着的复印件、几本野帐、一支钢笔。
: 最底下，压着一本线装的旧册子。封皮上用毛笔写着：「寄合留 昭和五十八年」。
makabe[surprise]: ……这是！
yomoda[shock]: 啊……
yomoda[sad]: 那是老先生借给我的。他让我帮他整理……前几天的事。
: 律翻开册子。墨迹褪成了褐色，字却还清楚。
@letter 昭和五十八年二月十四日　寄合\n\n事由　白峰惣一殿横死之件\n证人　阿部文\n验尸　桐谷：照之前说的写\n\n裁定　全三十一户　有罪\n被送者　冬木雪绘\n送人　熊谷大吾
@get ch2_record
> 「照之前说的写」——验尸的记录，是按照别人事先说好的写的？
: 册子下面，还有一样东西。一叠旧信，用一根褪了色的缎带捆着。
: 真壁刚伸出手，四方田就把那叠信按住了。
yomoda[angry]: ——那个不行。
yomoda[sad]: 对不起。……那是私人的信。和老先生、和这个村子，都没有关系。
: 他把信抽回去，抱在胸口。可是律已经看见了最上面那只信封：
: 收信人只有一个字——「圭」。寄信人也只有一个字——「姐」。邮戳上的局名是「白峰局」。
> 从这个村子寄出去的信。寄给「圭」。四方田圭。
@get ch2_letters
@set ch2_i_bag
@hide
@return

# ch2_i_bag2
: 四方田把皮包放回了书桌下面，搭扣扣得紧紧的。那叠信，他一直揣在棉袍的怀里。
@return

# ch2_i_desk
@bg shiramine_2f
: 书桌上摊着几本野帐和一沓稿纸。最上面是一本装帧朴素的书：《雪送考——东北山村的拟死仪礼》，四方田圭 著。
: 野帐翻开的那一页，写满了密密麻麻的小字。只有一行，被铅笔重重地划了两道线：
: 「昭和五十八年二月十四日 雪送 被送者：冬木雪绘」
@return

# ch2_i_heater
@bg shiramine_2f
: 煤油暖炉还温着。油箱的刻度降了一大截——烧了一整夜。
: 屋里暖和得让人出汗。
@return

// ====================================================================
//  搜查：本宅大广间
// ====================================================================

# ch2_i_shimo
@bg shiramine_hall
@show shimo[sad] C
@if ch2_i_shimo -> ch2_i_shimo2
: 霜坐在大广间的角落里，千雪给她披了一条毯子。她的脸色还是很白，嘴唇有些发紫。
: 看见律，她拿起石板，一行一行地写。
shimo: （石板）6:30 送粥
shimo: （石板）开门 屋里很闷 炭味
shimo: （石板）头很晕 想吐
shimo: （石板）老爷 倒在被炉边 叫不醒
shimo: （石板）我不能喊 敲锅盖 叫四方田先生 再去叫村长
: 她写字的时候，左手攥着石板的边，毛线手套的指尖空瘪瘪的。
ritsu: 昨晚七点半，是你去换的练炭？
shimo: （石板）是 新的一块 和平常一样
shimo: （石板）那时候 老爷 很好 还骂我慢
: 她把石板放在膝上，低下头，很久没有再写。
@get ch2_shimo
@hide
@return

# ch2_i_shimo2
shimo: （石板）七濑先生 乌丸小姐 不是坏人
shimo: （石板）我知道
@hide
@return

# ch2_i_renji
@bg shiramine_hall
@show renji[sad] C
@if ch2_i_renji -> ch2_i_renji2
: 莲司坐在佛坛前，背对着门。一支七星夹在指间，烟灰积了很长一截，没有掉。
renji[sad]: ……七濑先生。
renji[sad]: 昨晚八点四十，我去看他。他问我「送走了没有」，我说送走了。
renji[sad]: 然后他说，把那个丫头叫来。我说不行。他就一直说，一直说……
renji[sad]: 我拗不过他。是我去叫的乌丸小姐。是我……
ritsu: 那本记录本，您最后一次看见是什么时候？
renji: 前天晚上。他把抽屉拉开，摸了摸它，又关上了。
renji[think]: 那本东西……他连我都不许碰。我小的时候碰过一次，被他打了一顿。
renji[sad]: 二十年了。我一直不知道里面写了什么。也许，是不想知道。
: 烟灰终于掉了下来，落在他的膝盖上。他没有去掸。
@set ch2_i_renji
@hide
@return

# ch2_i_renji2
renji[sad]: 寄合……我来主持。他是我父亲。这件事，白峰家的人得担着。
@hide
@return

# ch2_i_stairs
@bg shiramine_hall
: 通往二楼的楼梯，只有这一道。本宅里如今只住着四方田一个人。
: 楼梯口的鞋柜里，只有他的一双雪靴，鞋底是干的。
> 他昨晚没有出过门。——他自己是这么说的。鞋子也是这么说的。
@return

# ch2_i_portraits
@bg shiramine_hall
: 门楣上的一排照片。系着黑缎带的那一张里，白峰惣一嘴角挂着轻佻的笑。
: 今天晚上，源一郎的照片也会挂上黑缎带吧。
@return

// ====================================================================
//  搜查：白峰屋·围炉里之间
// ====================================================================

# ch2_i_sayo
@bg inn_hearth
@show sayo[smile] C
@if ch2_i_sayo -> ch2_i_sayo2
: 小夜坐在围炉边，膝上盖着毯子。离她两步远，熊谷抱着胳膊坐在门槛上，像一尊门神。
sayo[smile]: 侦探先生～ 嫌疑人乌丸小夜，随时接受审问哦。
ritsu: 那就从头说一遍。
sayo: ……嗯。
sayo: 十点半，我一个人进了离屋。门没有锁，我敲了两下就进去了。
sayo: 屋里很热，被炉烧得很旺，我都出汗了。灯是橙色的。老爷子让我坐在被炉对面。
sayo: 他说了好多话。一会儿清醒，一会儿把我认成「雪绘」。抓着我的手不放。
sayo[sad]: 最后我问他：「二十年前您审判的那个人，真的有罪吗？」
sayo[sad]: 他就吼起来了。「滚回去吧，丫头！」
sayo: 我出来的时候，他还在骂。我把门关好，沿着原来的脚印走回大门。十点五十分。
sayo: 我什么都没碰。被炉也好，烟道也好，柜子也好。
sayo[smile]: ……说完了。侦探先生，判决是？
ritsu: 证词收下了。
sayo[smile]: 好冷淡～
@get ch2_sayo
@hide
@return

# ch2_i_sayo2
sayo[smile]: 熊谷先生一直瞪着我。我要是敢挠一下鼻子，他大概就要扑过来了～
sayo: ……律君。我没事的。去吧。
@hide
@return

# ch2_i_chiyuki
@bg inn_hearth
@show chiyuki[angry] C
@if ch2_i_chiyuki -> ch2_i_chiyuki2
chiyuki[angry]: 七濑先生。我会在寄合上说的。
chiyuki: 昨晚十一点到十二点半，乌丸小姐一直和我们在一起。我可以作证。
ritsu: 村子会说，那是十一点以前的事。
chiyuki[angry]: ……我知道。所以我才生气。
: 她的声音压得很低。
chiyuki: 霜阿姨早上头晕、想吐，嘴唇发紫……可能是吓坏了，也可能是屋子里太闷。
chiyuki[think]: 我是护士，不是医生。验尸的事，我说了不算。
chiyuki[sad]: 可是桐谷医生今天早上……身上的酒味，我在楼梯口都闻得到。
@set ch2_i_chiyuki
@hide
@return

# ch2_i_chiyuki2
chiyuki: 乌丸小姐在笑。……她一直在笑。我看着，心里很难受。
@hide
@return

# ch2_i_kumagai
@bg inn_hearth
@show kumagai[angry] C
@if ch2_i_kumagai -> ch2_i_kumagai2
kumagai[angry]: 别想着把她带走，东京来的。
kumagai: 我说过的：九点雪停，一丝风都没有。停了以后踩下去的脚印，一个都跑不掉。
kumagai[angry]: 进过离屋的，只有那丫头一个。这还用审？
ritsu: 雪停以后没有起过风？
kumagai: 没有。一整夜都没有。屋檐上的雪，一片都没被吹下来。
kumagai[dark]: ……屋檐上的雪，要掉也是自己掉。白蛾大人抖一抖翅膀，什么都盖住了。
@set ch2_i_kumagai
@hide
@return

# ch2_i_kumagai2
kumagai[angry]: 看什么看。审判是下午的事。
@hide
@return

# ch2_i_hwin
@bg inn_hearth
: 窗外的村道上，三三两两的村民往裁屋的方向走。有人回头往白峰屋的窗户里看，指指点点。
@return

// ====================================================================
//  搜查结束
// ====================================================================

# ch2_inv_end
@bg village_road
@filter none
@weather none
@bgm mystery
@caption 2月15日 12:40 村道
: 天放晴了。云层裂开，冬天的太阳白晃晃地照在雪墙上，刺得人睁不开眼。
: 律走在去裁屋的路上。消雪管喷着水，脚下的路湿漉漉的，没有留下他的脚印。
> 先把能确定的事排出来。
> 额头的伤，是撞在铁框的角上。那东西没有人拿得起来。
> 雪停之后，进出过离屋的，只有小夜。她出来的时候，老人还在吼。
> 屋里这一段烟道，没有人碰过。屋外的管口，却被一堆带棱角的雪块埋住了。
> 两个故事。
> 一个是医生说的：有人打了他。
> 另一个，是那根被埋住的管子说的。
@show makabe[normal] C
makabe: 七濑先生。手电，我拿回来了。
: 真壁拍了拍腰间。一支黑色的手电，插在皮带上。
@hide
> 「雪上不见来时路。」
> 可是雪上明明有一行脚印。小夜的脚印。
> 白蛾的童谣，这一次说的究竟是什么？
@goto ch2_trial
`
  + String.raw`
// ====================================================================
//  寄合
// ====================================================================

# ch2_trial
@bg sabakiya
@trial on
@filter none
@weather none
@bgm trial
@caption 2月15日 13:00 裁屋
: 茅草顶下，围炉里的火烧得噼啪作响。村里的人围着火坐成一圈，一层又一层，一直挤到墙根。
: 上座空着。昨天，源一郎还被人抬着坐在那里。今天，那里只横放着他的一根拐杖。
: 雅的位置也空着。
: 圈子的正中央，站着乌丸小夜。
: 她的肩上沾着一团碎雪。走进裁屋的时候，门口不知是谁，朝她扔了一个雪团。
: 她没有去掸。
renji[sad]: ……寄合，开始。
renji: 规则和昨天一样。说出你们知道的事。最后，投票。
villager{长老}: 村长。死的是你爹。你来主持，合适吗？
renji[sad]: ……白峰家的事，白峰家的人担着。
renji: 桐谷医生。请。
kiriya[sad]: ……额头遭钝器击打。有棱有角的硬东西。
kiriya: 死亡时间，昨晚十一点到一点之间。
kumagai[angry]: 九点雪停。之后进过离屋的，只有那丫头一行脚印。
kumagai[angry]: 一去一回，清清楚楚。我在雪里活了四十多年，不会看错。
abe[angry]: 还有老村长柜子里的寄合记录本，也不见了！
: 阿部文从怀里抽出一本卷了边的周刊，「啪」地摔在围炉边的地板上。
abe[angry]: 你们自己看！「宵鸦岛的判官」！
abe: 「她用广播、面具和童谣，把一座岛上的人一个一个推上审判台」——
abe[angry]: 广播！面具！童谣！跟白蛾一模一样！
villager{长老}: 她是来审判老村长的。二十年前的寄合，她要翻案。
villager{村妇}: 老村长昨晚指名要见她，她就去了。去了，老村长就死了。
villager{老人}: 白蛾就是她。从桥断的那天起，就是她。
: 一句接一句，像雪块一样砸进圈子里。
sayo[smile]: 哎呀～ 那篇报道，我也读过好多遍了。
sayo[smile]: 写得真好呢。连我自己读完，都想给自己投一票～
: 有人笑了一声。不是因为好笑。
villager{村妇}: 宵鸦岛上死了几个人？你数过吗？
sayo: ……数过。
: 小夜的笑容停了一瞬。只有一瞬。
sayo[smile]: 每天晚上都数。所以呀，我的算术可好了～
> 她在笑。
> 我的手在发抖。不是因为冷。
> ——冷静。现在发火，只会让他们更确信「侦探是同伙」。
> 先把能确定的事排出来。
chiyuki[angry]: 请等一下。
chiyuki: 昨晚十一点到十二点半，乌丸小姐一直和我、和七濑先生在一起。我可以作证。
villager{长老}: 十一点以后的事，有什么用？
villager{长老}: 她十点半进去，十点五十出来。下手，就在那二十分钟里。
ritsu: 十点四十八分，老人还活着。
ritsu: 我站在本宅大门口，亲耳听见他吼：「滚回去吧，丫头。」两分钟后，小夜出来了。
villager{长老}: 侦探的话？
villager{长老}: 老村长昨天在这里说过：「侦探说她不在场——侦探自己就是同伙。」
kumagai[angry]: 就是！你们三个，从一进村就是一伙的！
kiriya[sad]: ……我验过了。额头上那一下，是被人打的。
kiriya: 我当了四十年医生。那么大一道口子……
villager{长老}: 医生都说了。还有什么好说的？
villager{长老}: 投票。现在就投。
: 圈子里响起一片附和声。有人已经从怀里摸出了投票札。
@bgm tension
> 医生说，死亡时间是十一点到一点。
> 小夜十点五十分就出来了。十一点以后，她一直和我们在一起。
> 只要咬住这一点，也许就够了。现在投票，票数也许会站在我们这一边。
> 可是——
> 那根被埋住的管子。裸灯泡底下，说不清颜色的尸斑。
> 那件事，我还没有确认。
@checkpoint
@choice
- 「相信医生的判断，直接投票。——死亡时间就能救她。」 -> ch2_to_be_ch2
- 「……等一下。我想再看一次尸体。」 -> ch2_trial_recheck

# ch2_to_be_ch2
@goto ch2_be_okuri

# ch2_trial_recheck
ritsu: ……等一下。
ritsu: 我想再看一次尸体。
kumagai[angry]: 你想拖时间！
ritsu: 桐谷医生验尸的时候，离屋里只有一只裸灯泡。
ritsu: 医生，今天早上您自己说过——「那灯太暗了」。
kiriya[shock]: ……
villager{长老}: 尸首就在那里，又不会跑。看一百遍也是那个样子。
renji[sad]: ……去吧。
: 莲司低着头，声音很轻。
renji: 真壁君、桐谷医生，一起去。三十分钟。
renji[sad]: 我父亲……是怎么死的，我也想知道。
@trial off

@bg annex
@bgm mystery
@caption 2月15日 13:25 离屋
: 离屋里还是那股炭味，淡了一些。裸灯泡依旧亮着，橙黄色的光一动不动。
: 律和真壁把老人的肩膀抬起来。真壁打开了手电。
@se heartbeat
: 一道白光，照在老人贴着榻榻米的那半边脸颊上。
: 尸斑不是暗紫色的。
: 是红的。鲜艳的、像熟透的樱桃一样的红。
kiriya[shock]: ……这……这颜色……
kiriya[shock]: 樱桃红……我早上，在那灯底下……
> 四年前，宵鸦岛。我见过一具皮肤泛着红色的尸体。那一次，是氰化物。
> 但这里没有毒药。
> 这里有练炭。
@update ch2_lividity 在真壁的手电白光下看，源一郎的尸斑是鲜艳的樱桃红，而不是常见的暗紫色。裸灯泡的橙光把这个颜色遮住了。
: 律又看了一眼坑口那圈铁框。角上的血已经发黑，几根白发还粘在上面。
makabe[think]: 七濑先生……这是怎么回事？
ritsu: 回裁屋。我说给所有人听。

@bg sabakiya
@trial on
@bgm debate
@caption 2月15日 13:55 裁屋
kumagai[angry]: 看完了？看出花来了？
ritsu: 看出来了。先从额头的伤说起。
villager{长老}: 伤就是伤。是那丫头打的。
kumagai[angry]: 那丫头跟老爷子吵了起来——侦探你自己都听见了！
abe[angry]: 雪停以后进过离屋的，只有她一个！
kiriya[sad]: 额头的伤……确实是被人打的。有棱有角的东西……
> 「有棱有角的硬东西」。
> 离屋里，确实有一样有棱有角的东西。可是，它能被人拿起来吗？
@game ch2_g1
@bgm trial
@shout ritsu 不对！
ritsu: 桐谷医生。那道伤，不是「被人击打」出来的。
ritsu: 掘被炉坑口四周的铁框，靠门那一侧的角上，有血，有几根白发。
ritsu: 伤口的形状、长短、角度，和那个角完全吻合。
kiriya[shock]: 铁框……？
ritsu: 那圈铁框是用铆钉钉死在地板梁上的。我试过，扳不动。
ritsu: 没有人能拿起它来砸人。是老人的额头，撞上了它。
makabe: 我也试过。纹丝不动。
kumagai[angry]: 那就是她把老爷子推倒了！推倒了，撞上去，还不是一样！
ritsu: 推倒一个人，他会往后倒，或者往旁边倒。
ritsu: 可老人是脸朝下扑倒的。半个身子还在被子里，右手伸得长长的，指着门口。
ritsu: 他不是被人推倒的。他是自己想从被炉里爬出来，爬到门口去。
abe[surprise]: 爬到门口？大半夜的，爬到门口做什么？
ritsu: 因为他喘不过气来。
ritsu: 他真正的死因，就写在他的皮肤上。
@game ch2_g2
@bgm truth
@shout ritsu 就是这个！
ritsu: 尸斑。
ritsu: 在裸灯泡的橙光底下，什么颜色都看不清。可是在真壁先生的手电底下——它是樱桃红。
kiriya[shock]: ……是，是红的。我亲眼看见了。
villager{老人}: 红的又怎么样？死人身上的斑，不都是红的？
chiyuki: ……不一样。
: 千雪站了起来。
chiyuki: 普通的尸斑是暗紫色的。鲜红色的尸斑，我只在一种病人身上见过。
chiyuki[sad]: 急诊室里。冬天，在关紧门窗的屋子里烧炭的人。
kiriya[sad]: ……
ritsu: 霜小姐今天早上的石板，请大家再看一遍。
shimo: （石板）开门 屋里很闷 炭味
shimo: （石板）头很晕 想吐
ritsu: 鲜红的尸斑。烧了一整夜、烧得干干净净的练炭。一开门就头晕想吐。
ritsu: 那间离屋里，充满了一样东西。
@game ch2_g3
@bgm truth
@shout ritsu 一氧化碳！
ritsu: 练炭在密不透风的屋子里烧，会生出一氧化碳。看不见，闻不到。
ritsu: 吸进去，人会头晕、想吐、手脚发软。再吸下去，就睡过去，醒不来。
ritsu: 离屋的窗户糊死了，雨户关着。被炉的烟，只有一条出路——那根通到墙外的烟道。
ritsu: 只要烟道是通的，就不会出事。桐谷医生让人装那根烟道，就是为了这个。
kiriya[sad]: ……是我让装的。我说过，一不留神，一屋子人睡过去就醒不来……
ritsu: 老人半夜觉得头晕，想爬到门口去开门。他从被炉里爬出来，撑不住，扑倒了。
ritsu: 额头撞在铁框的角上，昏了过去。之后，就再也没有醒过来。
: 裁屋里静了下来。只有围炉里的炭，噼啪响了一声。
renji[sad]: ……爸。
@bgm debate
abe[angry]: 那……那就是她干的！
abe[angry]: 她走的时候，绕到屋外，把烟道堵上了！二十分钟，什么做不到！
villager{长老}: 对，对。堵上烟道，人就是这么没的。
kumagai[angry]: 就算不是她亲手打的，也是她害死的！
> 她走的时候，堵住了烟道？
> 排气管口，开在什么地方？要走到那里去，雪会告诉我们什么？
@game ch2_g4
@bgm trial
@shout ritsu 不对！
ritsu: 排气管口，不在离屋的门口。它开在离屋朝向本宅的那面侧墙外——两栋屋子之间的窄缝里。
ritsu: 那道窄缝两三米宽，堆着一人多高的雪。今天早上，雪面平平整整，没有任何人走过的痕迹。
ritsu: 小夜的脚印，一去一回，从大门到离屋的门口。一步都没有离开过小路。
makabe: 我量过。一行去，一行回，步子一样大。没有一步往窄缝那边拐。
ritsu: 屋里那一段烟道，我一节一节地摸过。接口严丝合缝，没有人动过。
ritsu: 还有。小夜说，她在屋里的时候，被炉烧得很旺，热得出汗。老人十点四十八分还中气十足地吼人。
ritsu: 如果那时候烟道已经堵上了，屋里的人早该头晕了。
sayo: ……我只觉得热。一点都不晕。
abe[surprise]: 那……那管子是怎么堵上的？
kumagai[angry]: 你说！管子是怎么堵上的！
ritsu: 排气管口，被一堆雪埋住了。
: 圈子里一阵骚动。
@bgm tension
yomoda[think]: ……这么说来。
: 一直坐在圈子外侧做笔记的四方田，推了推眼镜，温和地开了口。
yomoda[sad]: 窄缝上方就是本宅的屋檐。是不是……庇上的雪，自己滑了下来，正好埋住了管口？
yomoda: 那就不是谁的错了。是一场意外。真是不幸。
renji[sad]: 意外……
kumagai[shock]: 白蛾大人……是白蛾大人抖落的雪……
abe[think]: 意外的话，就……谁都不用送了。
: 好几个人松了一口气。那口气，在冷空气里结成了白雾。
> 意外。谁都不用送。
> 这是所有人最想听的结论。——太想听了。
> 昨天在雪庭，莲司先生指着那片庇，说过一句话。
@game ch2_g5
@bgm truth
@shout ritsu 不对！
ritsu: 四方田先生。庇上的雪，不会自己滑下来。
ritsu: 那片庇上装着雪止。莲司先生，昨天下午您亲口告诉我的。
renji[surprise]: ……是。雪止。为了不让雪砸坏老爷子的屋子，我爹特地让人装的。
ritsu: 熊谷先生，昨晚起过风吗？
kumagai: ……没有。一丝都没有。屋檐上的雪，一片都没被吹下来。
ritsu: 更重要的，是埋住管口的那堆雪本身。
@shout ritsu 看看这个！
ritsu: 屋檐上自然滑落的雪，是一整片圆滑的雪舌。可是埋住管口的，是一块一块棱角分明的雪块。
ritsu: 好几块的断面上，留着平直的铲痕。
ritsu: 还有庇。二楼那扇窗的正下方，庇上的积雪缺了一块。缺口上下两刀，角是直角。
ritsu: 断面上没有一点新雪。雪是九点停的——这一刀，是雪停之后切的。
yomoda[shock]: ……
villager{长老}: 铲子……有人用铲子……
ritsu: 有人用铲子，把庇上的雪切成块，越过雪止推了下去。雪块落进窄缝，埋住了管口。
abe[shock]: 可是窄缝里没有脚印！雪庭里也只有那丫头的脚印！那人是从哪里……
ritsu: 那就把三样东西叠在一起看。排气管口。管口正上方的庇。庇正上方的——
@game ch2_g6
@bgm tension
ritsu: ……本宅二楼，那扇窗。
ritsu: 从那扇窗探出身子，伸出一把铲子，就够得着下面的庇。不用下楼，不用走过雪庭。
ritsu: 雪上，一个脚印都不会留下。
ritsu: 「二片雪，落屋檐。雪上不见来时路。」——童谣说的，就是这个。
: 一圈的目光，慢慢地，转向了同一个地方。
ritsu: 那扇窗，是四方田先生的房间。
yomoda[shock]: ……七濑君。
yomoda[smile]: 这个推理，很漂亮。可是，有一点不对。
yomoda: 我昨晚十一点就睡了。窗户一整晚都没有开过。
ritsu: 那么，窗台上的雪是谁拂乱的？
yomoda[surprise]: ……
ritsu: 您每天下午清一次窗台。可是昨天的雪，一直下到晚上九点。
ritsu: 下午清过的窗台，到九点，应该又积上了一层平平整整的新雪。
ritsu: 今天早上，您窗台外面的雪被拂得乱七八糟，乱痕上没有一点新雪。窗框的内侧，还是湿的。
ritsu: 雪停之后，有人开过那扇窗。
yomoda[sad]: ……
yomoda[think]: ……我想起来了。半夜里，我确实开过一次窗。暖炉烧得太闷，透了透气。
yomoda[smile]: 七濑君，开窗透气，总不算犯罪吧？
> 他退了一步，又退得刚刚好。
> 那就逼到他退不下去的地方——
@game ch2_g7
@bgm truth
@shout ritsu 就是这里！
ritsu: 四方田先生。您说，雪铲是下午清窗台时用的。
ritsu: 昨天下午，我在雪庭里看见您用它，用完，把它靠在窗边的墙上。
ritsu: 可今天早上，它不在窗边。它在壁橱里，压在被褥下面。
ritsu: 铲刃的凹槽里还卡着没化完的冰碴。壁橱的地板上，一滩水还没渗干。
makabe: 我亲眼看见的。被褥都洇湿了一角。
ritsu: 您房间里的暖炉，烧了一整夜。如果那把铲子是下午两点用的——到今天早上，已经过了十七八个钟头。
ritsu: 冰早就该化了，水也早就该干了。
ritsu: 它是半夜才用过的。用完，被人藏进了壁橱。
yomoda[shock]: ……
: 四方田的手指，在膝上的野帐上，慢慢收紧。
yomoda[sad]: ……就算是这样。
yomoda[sad]: 七濑君，你还是没有回答我。一个研究民俗的人，为什么要杀一个卧病的老人？
yomoda: 我和他无冤无仇。我们每天一起整理文书，他骂了我一个冬天，我也没有还过一句嘴。
> 为什么。
> 答案，就在他的包里。
@game ch2_g8
@bgm tension
ritsu: 老村长柜子里消失的那本记录本。在您的包里。
makabe: 今天早上，在四方田先生的同意下，我亲手从他的包底找出来的。
yomoda[sad]: 那是老先生借给我的——
renji[angry]: 不可能。
: 莲司抬起头。那是他今天第一次提高声音。
renji[angry]: 那本东西，他连我都不许碰。他会借给你？
renji[sad]: ……真壁君。给我。
: 真壁把那本线装的旧册子递过去。莲司翻开封皮，手抖了一下。
renji[sad]: 「昭和五十八年二月十四日，寄合。事由，白峰惣一横死之件。」
renji[sad]: 「证人，阿部文：看见雪绘进入水车小屋。」
: 阿部文的脸，一下子白了。
renji[sad]: 「验尸，桐谷：照之前说的写。」
@se glass
: 桐谷手里的茶碗掉在地上，摔成了两半。茶水溅了一地，他也不去捡。
kiriya[shock]: ……
renji[sad]: 「裁定，全三十一户，有罪。被送者，冬木雪绘。」
renji[sad]: 「送人，熊谷大吾。」
kumagai[shock]: ……
: 熊谷的脸色变了。他慢慢转过头，看向桐谷。桐谷缩着脖子，不敢看他。
kumagai[dark]: ……照之前说的写？
kumagai[dark]: 桐谷。什么叫「照之前说的写」？
kiriya[sad]: ……
renji: 熊谷。……先坐下。
: 熊谷没有坐下。他站在那里，盯着桐谷，像一头被人在背后捅了一刀的熊。
ritsu: 四方田先生，您拿走这本记录本，是因为您想知道一件事。
ritsu: 二十年前的那场寄合，到底是怎么投出来的。
ritsu: 您找的，不是一个卧病的老人。是二十年前的那一夜。
yomoda[dark]: ……
> 一个民俗学者，为什么要知道这个？
> 包里，还有另一样东西。他宁可被怀疑，也不肯让人拆开的东西。
@game ch2_g9
@bgm sad
ritsu: 那叠旧信。
ritsu: 收信人只写了一个字，「圭」。寄信人也只写了一个字，「姐」。
ritsu: 邮戳上的局名——「白峰局」。是从这个村子，寄出去的信。
@if ch2_d_abe -> ch2_trial_abe
@goto ch2_trial_letters

# ch2_trial_abe
ritsu: 阿部婆婆。您说过，二十年前有一个人，每个月都来您的店里，往东京寄一叠厚厚的信。
abe[shock]: ……那个寡妇。
abe[shock]: 冬木……雪绘。
@goto ch2_trial_letters

# ch2_trial_letters
: 四方田没有说话。他低着头，看着自己的手，看了很久很久。
: 然后，他从怀里取出那叠用缎带捆着的信，解开缎带，抽出最上面的一封。
yomoda[sad]: ……读吧。
yomoda[sad]: 反正，也藏不住了。
: 律展开信纸。纸已经发黄了，字迹却很清秀。
@letter 圭：\n\n山里已经下过三场雪了。\n千雪会叫「妈妈」了。叫得含含糊糊的，像在嚼年糕。\n宗介要是听见，不知道会高兴成什么样。\n\n村里的人还是不太跟我说话。不要紧，我有千雪，有宗介的墓。\n\n只有一件事，我放心不下。\n神社那个叫澄的女孩，最近总是一个人发呆。\n好像被什么人欺负了。她才十六岁。\n我想帮她，可她什么都不肯说。\n\n你在东京，要好好吃饭。\n\n　　　　　　　　昭和五十七年十二月　姐　雪绘
@update ch2_letters 冬木雪绘写给弟弟「圭」的信，署名「姐 雪绘」，邮戳「白峰局」。昭和五十七年十二月的一封写着：「千雪会叫『妈妈』了」「神社那个叫澄的女孩，好像被什么人欺负了，我想帮她」。信里每个「雪」字，雨字头的四点都连成一道波浪线。
: 信里的每一个「雪」字，雨字头的四个点都没有分开写。它们连成一道小小的波浪线，像一只飞着的蛾子。
@if has:ch2_pillar -> ch2_trial_pillar
@goto ch2_trial_after_letter

# ch2_trial_pillar
> 和冬木家旧宅柱子上，「千雪 三才」的那个「雪」字，一模一样。
> 刻下女儿身高的人，和写下这封信的人，是同一只手。
@goto ch2_trial_after_letter

# ch2_trial_after_letter
: 角落里，霜把膝上的石板翻了过去，扣在腿上。没有人注意到。
: 圈子外侧，澄垂着眼睛，一动不动。白羽织的袖口，轻轻地抖了一下。
chiyuki[shock]: ……雪绘。
chiyuki[shock]: 那是……我母亲的名字。
: 千雪看着四方田。四方田没有看她。
> 信的事，我们以后再说。
> 现在，先把昨天夜里发生的一切，从头排一遍。
@game ch2_g10
@bgm truth
ritsu: 昨天下午，您借整理文书，从离屋的柜子里拿走了二十年前的寄合记录本。
ritsu: 「照之前说的写」「全三十一户，有罪」——您确认了您想确认的事。
ritsu: 晚上九点，雪停了。九点半，您回到本宅二楼。
ritsu: 十点半，小夜一个人穿过雪庭，走进离屋；十点五十分，她沿着自己的脚印走了出来。
ritsu: 雪停之后的雪庭里，只剩下她一个人的脚印。
ritsu: 十一点过后，您打开二楼的窗户，探出身子，用那把雪铲，把窗下庇上的积雪切成块，越过雪止推了下去。
ritsu: 雪块落进窄缝，埋住了被炉的排气管口。您关上窗，把湿雪铲塞进壁橱。
ritsu: 密闭的离屋里，一氧化碳一点一点地积起来。半夜，老人觉得头晕，想爬到门口去，扑倒在铁框的角上。
ritsu: 额头上的伤，让医生以为他是被人打死的。雪地上的脚印，让村子以为凶手是小夜。
ritsu: 您不需要走过雪庭。您只需要等——等村子自己，把一个无辜的人送进雪里。
ritsu: 就像二十年前那样。
: 四方田摘下眼镜，用围巾的一角慢慢地擦着。擦了很久。
yomoda[sad]: ……七濑君。你和报纸上写的一样。
yomoda[sad]: 是个会说真话的侦探。
@bgm tension
renji[sad]: ……投票。
renji: 请各位，把札投进箱子里。
@game ch2_g11
@bgm sad
@se gavel
: 莲司一张一张地念着投票札上的名字。
renji: ……四方田。四方田。四方田。
: 绝大多数的札上，都写着同一个名字。
renji[sad]: 四方田圭。
renji: 还有三张……写着「乌丸」。
: 小夜听着，脸上的笑一点也没有变。
sayo[smile]: 三张呢～ 人气还不错嘛。
> 我没有回头去看那三个人是谁。
> 我怕我会记住他们的脸。
@goto ch2_confession
`
