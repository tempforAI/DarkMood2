/* 第三章「汤烟之雪」—— 三片雪，落汤池，热汤暖不了冷心。
 * 2/15 17:12 B2 之后（四方田入雪牢）→ 傍晚日常（杂货店、雪见汤、自由行动、自由时间×2）
 * → 22:00 细雪 → 23:00 围炉里的逼问 → 2/16 1:30 水声 → 凌晨搜查 → 10:30 寄合
 * 被害者：桐谷修平　凶手：熊谷大吾　替罪羊：霜
 * 诡计：溺死后放在倾斜岩台的「雪座」上（约 1:30 滑落）＋穿胴长走汤川离场
 */
DM.registerChapter({
  id: 'ch3',
  title: '第三章',
  name: '汤烟之雪',
  next: 'ch4',
  start: 'ch3_start',

  evidence: {
    ch3_body: { name: '桐谷的遗体', icon: 'body',
      desc: '凌晨 1:42，真壁把桐谷修平从雪见汤男汤的池心拖上岸。只围着一条手巾，全身被热汤泡得通红，皮肤起了皱。浴衣、眼镜和空了的扁酒壶，整整齐齐放在男汤更衣小屋的竹篮里。' },
    ch3_chiyuki_exam: { name: '千雪的检查', icon: 'testimony',
      desc: '溺死。气管和口鼻里灌满了带硫磺味的泉水——就是在这个池子里淹死的。热水里的尸体不能用体温推算死亡时间。双肩各有一只大手按压的淤痕，五个指印都在，指距很宽。背部与臀部印着岩石纹路的深压痕：「活人靠一会儿，起身很快就消；这么深，是死后很长时间一直压着。」' },
    ch3_geta: { name: '桐谷的木屐印', icon: 'geta',
      desc: '男汤小路上一行木屐印，只有上山的去程。齿印的轮廓发软、塌了边，每个印子底下都积着一层薄薄的新雪。真壁用尺子量过：印子里的雪约六毫米；路边从 22:00 积起的新雪约三厘米。（路边另有三行边缘锋利的脚印，是 1:42 霜带真壁、熊谷上山时贴着路边踩的。）' },
    ch3_shimo_prints: { name: '霜的脚印', icon: 'footprint',
      desc: '女汤小路上一行女式长靴的脚印，上山、下山各一行。边缘像刀切的一样锋利，底部干干净净，没有一点落雪。下山的那一行步子很乱，是跑着下去的。' },
    ch3_log: { name: '真壁的值班日志', icon: 'note',
      desc: '真壁按父亲的习惯，每天记下天气与时刻的值班日志（守夜时也揣在大衣口袋里）。2/15～16：「22:00 降雪开始，无风」「0:55 出所，小雪」「0:58 熊谷到裁屋（接班）」「1:00 雪止（1:05 补记）」「1:36 霜来报」。' },
    ch3_slate: { name: '霜的石板', icon: 'testimony',
      desc: '霜在裁屋一笔一笔写给律看的字：「厨房 收拾到 1:05」「1:10 雪停了 去女汤打扫」「1:30 水声 男汤」「竹篱下面的缝 看见 有人浮着」。（千雪 0:30 下楼倒水时，霜还在厨房。）「雪」字雨字头的四点，连成一道波浪线。' },
    ch3_habits: { name: '阿部文的话', icon: 'testimony',
      desc: '「那个酒鬼医生，每晚十二点以后都去雪见汤泡汤醒酒；霜呢，每天夜里一点过后去收拾浴场——全村都知道。」' },
    ch3_yukawa: { name: '汤川', icon: 'generic',
      desc: '雪见汤男女两个露天池溢出的热水汇成的小溪。冒着白汽，冬天也不结冰，水面不积一点雪；水深从膝盖到大腿，溪底积着白色的汤花。它一路流下山，经过熊谷小屋的后门，穿过村道底下的涵洞。' },
    ch3_ledge: { name: '岩台上的冰壳', icon: 'ice',
      desc: '男汤池边那块向池心倾斜、长满滑溜汤花的岩台上，残留着一片坐垫大小的冰壳——压实的雪化了一半，又冻上了。边缘有手掌拍打出的纹路。岩台背后，紧挨着一块直立的大岩石。' },
    ch3_banks: { name: '汤川岸边的雪', icon: 'snow',
      desc: '从雪见汤到村道，汤川两岸的积雪平平整整，没有任何脚印，连野兔的足迹都没有。溪水本身冒着白汽，水面上什么也留不下。' },
    ch3_streambed: { name: '溪底的凹坑', icon: 'footprint',
      desc: '清澈的溪水底下，白色汤花的沉积上有一串长靴大小的凹坑，从男汤的溢流口一直往下游延伸。有的脚尖朝上游，有的朝下游——有人在溪水里走上来，又走了下去。' },
    ch3_hutsteps: { name: '后门的石阶', icon: 'generic',
      desc: '熊谷小屋后门下到汤川的几级石阶。最下面几级泡在溪水里，上面几级本该结着薄冰，却是湿漉漉的，留着新鲜的黄白色汤花痕——是从溪里走上来的人带上来的。' },
    ch3_wader: { name: '熊谷的胴长', icon: 'shoe',
      desc: '挂在熊谷小屋墙上的胶皮长靴裤（胴长），一直护到胸口。胶皮外面还是湿的，靴底的纹路里卡着白色的汤花，一股浓浓的硫磺味。小屋里很冷，炉子是凉的。' },
    ch3_makabe: { name: '真壁的证词', icon: 'testimony',
      desc: '「0:58，熊谷先生到裁屋接班。他坐下的时候，裤脚一股硫磺味。他说『傍晚泡过汤』——可他的头发和胡子都是干的，一点潮气都没有。泡过汤的人，头发不会那么干。」' },
    ch3_hearth: { name: '围炉里的逼问', icon: 'testimony',
      desc: '23:00～23:50，熊谷在白峰屋围炉里压低声音逼问桐谷。律和小夜在旁边一桌听见桐谷醉醺醺地说：「……我删掉了……指向另一个人的东西……那个孩子……别问了！」23:50 桐谷说「去泡汤，醒醒酒」；23:55 熊谷说「回去睡一会儿，一点钟守夜」。' },
    ch3_record_line: { name: '记录本里的一行', icon: 'note',
      desc: '1983 年的寄合记录本（第二章寄合上由莲司当众宣读）：「……证人阿部文……桐谷：照之前说的写……全三十一户，有罪……送人，熊谷大吾。」宣读到这一行时，熊谷的脸色变了。' },
    ch3_safe: { name: '被撬的保险柜', icon: 'key',
      desc: '桐谷诊所的旧保险柜。门缝边有新的撬痕，刃口很宽，像猎刀一类的东西。里面只有一本 1983 年的正式验尸记录：「白峰惣一，头部遭铁杵击打致死。」除此之外，什么都没写。' },
    ch3_shimo_hand: { name: '霜的左手', icon: 'glove',
      desc: '霜在寄合上摘下了左手的毛线手套。她的左手只有三根手指——无名指和小指齐根没有了，断处是冻伤留下的、很旧的疤。' },
    ch3_shift: { name: '守夜排班表', icon: 'note',
      desc: '裁屋墙上贴着的源一郎通夜守夜排班：「23:00～1:00 莲司、阿部／1:00～3:00 熊谷、真壁／3:00～5:00 澄、长老」。一点钟，熊谷必须出现在裁屋。' }
  },

  explore: {
    ch3_day: {
      title: '2月15日 傍晚·自由行动',
      mode: 'free',
      start: 'village_road',
      places: ['village_road', 'inn_hearth', 'inn_kitchen', 'kumagai_hut', 'sabakiya', 'police_box', 'store', 'clinic', 'snow_prison', 'jizo'],
      filter: 'dusk',
      weather: 'none',
      spots: {
        village_road: [
          { anchor: 'yukawa', label: '冒着白汽的小溪', run: 'ch3_d_ryukawa' },
          { anchor: 'road', label: '湿漉漉的路面', run: 'ch3_d_road' },
          { anchor: 'shed', label: '柴棚', run: 'ch3_d_shed' }
        ],
        inn_hearth: [
          { anchor: 'irori', label: '围炉里', run: 'ch3_d_irori' },
          { anchor: 'sake_shelf', label: '酒架', run: 'ch3_d_sake' },
          { anchor: 'window', label: '窗外的天色', run: 'ch3_d_hwindow' }
        ],
        inn_kitchen: [
          { anchor: 'shichirin_shelf', label: '七轮架', run: 'ch3_d_shelf' },
          { anchor: 'back_door', label: '后门', run: 'ch3_d_backdoor' }
        ],
        kumagai_hut: [
          { anchor: 'wader', label: '墙上的胶皮裤', run: 'ch3_d_wader' },
          { anchor: 'back_steps', label: '后门的石阶', run: 'ch3_d_steps' },
          { anchor: 'front_door', label: '前门', run: 'ch3_d_front' },
          { anchor: 'rifle_rack', label: '猎枪架', run: 'ch3_d_rifle' }
        ],
        sabakiya: [
          { anchor: 'tally_board', label: '墙上的排班表', run: 'ch3_d_rota' },
          { anchor: 'elder_seat', label: '上座的灵柩', run: 'ch3_d_coffin' }
        ],
        police_box: [
          { anchor: 'desk', label: '值班日志', run: 'ch3_d_logbook' },
          { anchor: 'stove', label: '铁炉', run: 'ch3_d_stove' }
        ],
        store: [
          { anchor: 'cigarettes', label: '香烟柜', run: 'ch3_d_cig' },
          { anchor: 'window', label: '店窗', run: 'ch3_d_swindow' }
        ],
        clinic: [
          { anchor: 'safe', label: '旧保险柜', run: 'ch3_d_safe' },
          { anchor: 'records', label: '病历柜', run: 'ch3_d_records' }
        ],
        snow_prison: [
          { anchor: 'lattice', label: '木格子', run: 'ch3_d_lattice' }
        ],
        jizo: [
          { anchor: 'nameless_jizo', label: '没有名字的地藏', run: 'ch3_d_jizo' },
          { anchor: 'jizo_row', label: '一排地藏', run: 'ch3_d_jizorow' }
        ]
      },
      people: {
        inn_hearth: [ { char: 'renji', run: 'ch3_p_renji', x: 120 } ],
        inn_kitchen: [ { char: 'shimo', run: 'ch3_p_shimo', x: 260 } ],
        kumagai_hut: [ { char: 'kumagai', run: 'ch3_p_kumagai', x: 250 } ],
        sabakiya: [ { char: 'sumi', run: 'ch3_p_sumi', x: 300 } ],
        police_box: [ { char: 'makabe', run: 'ch3_p_makabe', x: 360 } ],
        store: [ { char: 'abe', run: 'ch3_p_abe', x: 230 } ],
        clinic: [ { char: 'kiriya', run: 'ch3_p_kiriya', x: 210 } ],
        snow_prison: [ { char: 'chiyuki', run: 'ch3_p_chiyuki', x: 100 }, { char: 'yomoda', run: 'ch3_p_yomoda', x: 250 }, { char: 'miyabi', run: 'ch3_p_miyabi', x: 330 } ]
      },
      done: { need: ['flag:ch3_d_kumagai', 'flag:ch3_d_kiriya', 'flag:ch3_d_makabe', 'flag:ch3_d_rota', 'flag:ch3_d_shimo'],
              run: 'ch3_day_end', prompt: '天已经黑透了。回白峰屋去吧？' }
    },

    ch3_inv: {
      title: '搜查开始',
      mode: 'investigate',
      start: 'bathhouse',
      places: ['bathhouse', 'village_road', 'kumagai_hut', 'sabakiya', 'police_box', 'clinic', 'inn_hearth'],
      filter: 'cold',
      weather: 'none',
      spots: {
        bathhouse: [
          { anchor: 'men_pool', label: '桐谷的遗体', run: 'ch3_i_body' },
          { anchor: 'rock_ledge', label: '倾斜的岩台', run: 'ch3_i_ledge' },
          { anchor: 'men_path', label: '男汤小路', run: 'ch3_i_menpath' },
          { anchor: 'women_path', label: '女汤小路', run: 'ch3_i_womenpath' },
          { anchor: 'fence_gap', label: '竹篱下的缝', run: 'ch3_i_gap' },
          { anchor: 'yukawa', label: '汤川', run: 'ch3_i_yukawa' },
          { anchor: 'men_hut', label: '男汤更衣小屋', run: 'ch3_i_menhut' }
        ],
        village_road: [
          { anchor: 'culvert', label: '涵洞', run: 'ch3_i_culvert' },
          { anchor: 'road', label: '消雪管的路面', run: 'ch3_i_road' }
        ],
        kumagai_hut: [
          { anchor: 'back_steps', label: '后门的石阶', run: 'ch3_i_steps' },
          { anchor: 'wader', label: '胴长', run: 'ch3_i_wader' },
          { anchor: 'stove', label: '炉子', run: 'ch3_i_hstove' },
          { anchor: 'front_door', label: '前门', run: 'ch3_i_front' }
        ],
        sabakiya: [
          { anchor: 'tally_board', label: '墙上的排班表', run: 'ch3_i_rota' },
          { anchor: 'elder_seat', label: '灵柩', run: 'ch3_i_coffin' }
        ],
        police_box: [
          { anchor: 'desk', label: '摊开的日志', run: 'ch3_i_log' }
        ],
        clinic: [
          { anchor: 'safe', label: '保险柜', run: 'ch3_i_safe' },
          { anchor: 'desk', label: '桌上', run: 'ch3_i_cdesk' }
        ],
        inn_hearth: [
          { anchor: 'irori', label: '桐谷坐过的位置', run: 'ch3_i_irori' },
          { anchor: 'window', label: '窗外', run: 'ch3_i_hwindow' }
        ]
      },
      people: {
        bathhouse: [ { char: 'chiyuki', run: 'ch3_q_chiyuki', x: 150 }, { char: 'renji', run: 'ch3_q_renji', x: 400 } ],
        sabakiya: [ { char: 'shimo', run: 'ch3_q_shimo', x: 240 }, { char: 'kumagai', run: 'ch3_q_kumagai', x: 100 }, { char: 'abe', run: 'ch3_q_abe', x: 370 } ],
        police_box: [ { char: 'makabe', run: 'ch3_q_makabe', x: 360 } ],
        inn_hearth: [ { char: 'sayo', run: 'ch3_q_sayo', x: 300 } ]
      },
      done: { need: ['ch3_body', 'ch3_chiyuki_exam', 'ch3_geta', 'ch3_shimo_prints', 'ch3_ledge', 'ch3_banks', 'ch3_streambed',
                     'ch3_hutsteps', 'ch3_wader', 'ch3_log', 'ch3_makabe', 'ch3_slate', 'ch3_safe', 'flag:ch3_q_kumagai'],
              run: 'ch3_inv_end', prompt: '该查的都查过了。天快亮了——去裁屋吧。' }
    }
  },

  games: {
    // 1. 第一层：雪停后只有霜 → 木屐印里积着雪
    ch3_g1: {
      type: 'debate', title: '证言交锋',
      ammo: ['ch3_geta', 'ch3_shimo_prints', 'ch3_log', 'ch3_slate', 'ch3_body'],
      lines: [
        { who: 'abe', expr: 'angry', text: '雪停以后，上过浴场的，只有{霜一个人}！脚印明明白白摆在那儿。' },
        { who: 'kumagai', expr: 'angry', text: '桐谷是{一点以后}自己走进男汤的！那哑女就在竹篱另一边！' },
        { who: 'villager', expr: 'dark', text: '来历不明的女人，{连话都不会说}。谁知道她心里藏着什么。' },
        { who: 'abe', text: '她自己写的，一点半才「听见水声」。{哪有这么巧}的事？' }
      ],
      answer: { line: 1, weak: 0, ammo: 'ch3_geta' },
      hint: '桐谷先生的木屐印，和霜的脚印，样子一样吗？想想熊谷自己讲过的「细雪」的规矩。',
      wrong: '……不对。要问的是——桐谷先生究竟是什么时候走上那条小路的。'
    },
    // 2. 第二层：霜按住了他？→ 五指俱全的两只大手
    ch3_g2: {
      type: 'present',
      prompt: '如果真是霜把桐谷先生按进了水里——能说明「那双手」是什么样子的证据是——',
      answer: 'ch3_chiyuki_exam',
      hint: '千雪小姐检查遗体时，在桐谷先生的双肩上看见了什么？',
      wrong: '……不对。那双手留下的痕迹，还印在死者身上。'
    },
    // 3. 推理回廊：死亡时间与水声
    ch3_g3: {
      type: 'logic', title: '推理回廊',
      questions: [
        { q: '木屐印里积着约六毫米的雪，路边从十点积起的雪约三厘米。木屐印是什么时候踩下的？',
          opts: ['一点雪停以后', '雪停前半个多钟头——零点二十分前后', '十点刚下雪的时候'], a: 1 },
        { q: '霜的脚印边缘锋利、底部干净。它是什么时候踩下的？', opts: ['一点雪停以后', '一点雪停以前', '和木屐印差不多同时'], a: 0 },
        { q: '桐谷先生背上那么深的岩石压痕，说明什么？', opts: ['他泡汤时常靠着岩石', '他被人在岩石上拖过', '他死后很长时间一直靠坐在岩石上'], a: 2 },
        { q: '倾斜的岩台上，有一片坐垫形的冰壳，边上有手掌拍出的纹路。说明什么？', opts: ['池水溅上去冻成的', '尸体底下曾经垫着什么东西', '霜打扫时洒的水'], a: 1 },
        { q: '那么，霜一点半听见的「哗啦」一声是？', opts: ['尸体从岩台上滑进池里的声音', '凶手逃走的声音', '霜编出来的'], a: 0 },
        { q: '桐谷先生是什么时候死的？', opts: ['一点半，水声响的时候', '一点十分，霜上山的时候', '雪还在下的时候——零点四十分前后'], a: 2 }
      ],
      hint: '「没风的细雪，只往脚印里撒一层糖霜。」再想想，湊君在雪见汤说过的那个雪座位。'
    },
    // 4. 灵光拼字：雪座
    ch3_g4: {
      type: 'keyword',
      prompt: '让桐谷先生的遗体在倾斜的岩台上坐了四十多分钟、一点半才滑进池里的，是——',
      answer: '压实的雪',
      decoys: '冰石热汤岩水',
      hint: '岩台上留下的是一片「坐垫形」的冰壳。冰壳之前，它是什么？'
    },
    // 5. 第四层：凶手怎么离开？→ 汤川
    ch3_g5: {
      type: 'debate', title: '证言交锋',
      ammo: ['ch3_yukawa', 'ch3_banks', 'ch3_geta', 'ch3_ledge', 'ch3_slate'],
      lines: [
        { who: 'kumagai', expr: 'angry', text: '就算死在十二点四十，凶手也得{从小路走出去}——男汤小路上只有桐谷一个人的木屐印！' },
        { who: 'abe', expr: 'shock', text: '那就是{白蛾}……白蛾会飞！三片雪，落汤池——广播里早就说了！' },
        { who: 'villager', text: '浴场后面是{山崖}，没有路。前面就两条小路，一条男汤，一条女汤。' },
        { who: 'renji', expr: 'think', text: '竹篱底下那道缝……{连猫都钻不过去}。' }
      ],
      answer: { line: 0, weak: 0, ammo: 'ch3_yukawa' },
      hint: '从浴场下山，真的只有两条小路吗？湊君说过，两个池子溢出的热水流到哪里去了。',
      wrong: '……不对。要驳倒的是「只能走小路」这个前提。'
    },
    // 6. 汤川里走过的痕迹
    ch3_g6: {
      type: 'present',
      prompt: '凶手在汤川里走过的痕迹——',
      answer: 'ch3_streambed',
      hint: '溪水很清。手电贴近水面时，溪底的白色汤花上有什么？',
      wrong: '……不对。岸上什么都没有。痕迹在「水里」。'
    },
    // 7. 能在汤川里走几百米的人
    ch3_g7: {
      type: 'pick',
      prompt: '冬天能在汤川里走上几百米、腿却不湿也不冻的人——',
      options: ['kumagai', 'makabe', 'renji', 'shimo'],
      answer: 'kumagai',
      hint: '谁冬天穿着什么下河抓岩鱼？汤川又流过谁家的后门？'
    },
    // 8. 对峙熊谷
    ch3_g8: {
      type: 'rebuttal', who: 'kumagai',
      blades: ['汤川就流过你小屋的后门', '真壁闻到你裤脚的硫磺味，可你的头发是干的', '胴长到现在还是湿的'],
      lines: [
        { expr: 'angry', text: '我{零点五十八分}就到裁屋了，真壁可以作证！' },
        { expr: 'angry', text: '我是{从家里走过来}的，干干爽爽！连裤脚都没湿！' },
        { expr: 'dark', text: '胴长是{打猎}用的，挂在家里有什么奇怪！' }
      ],
      answer: { line: 1, weak: 0, blade: 1 },
      hint: '「干干爽爽」——那真壁巡查在他身上闻到的，是什么味道？如果真是傍晚泡的汤……',
      wrong: '……不，这一刀砍不倒他。他最得意的，是「干干爽爽」这一句。'
    },
    // 9. 动机
    ch3_g9: {
      type: 'present',
      prompt: '你撬开诊所的保险柜，想找的是——让你非问清楚不可的那一句话是——',
      answer: 'ch3_record_line',
      hint: '「照之前说的写」。既然有「之前说的」，就一定有一份「之前」的东西。',
      wrong: '……不对。让熊谷先生坐不住的，是第二章寄合上念出来的那一行字。'
    },
    // 10. 真相重演
    ch3_g10: {
      type: 'reconstruct',
      panels: [
        { text: '22:00 前后，凶手趁桐谷在白峰屋喝酒，撬开了【？】，却没有找到想要的东西。', opts: ['诊所的保险柜', '驻在所的储物柜', '白峰本宅的柜子'], a: 0 },
        { text: '23:50，被逼问得发抖的桐谷起身说，要去【？】。', opts: ['诊所睡觉', '泡汤醒酒', '裁屋守夜'], a: 1 },
        { text: '凶手回到小屋，穿上【？】，从后门的石阶走进汤川，逆流而上。', opts: ['雪踏', '胴长', '蓑衣'], a: 1 },
        { text: '0:40，凶手从热气里现身，用两只大手把桐谷【？】。', opts: ['推下岩台', '按进热汤', '拖出池外'], a: 1 },
        { text: '凶手在倾斜湿滑的岩台上拍出一个【？】，让尸体坐在上面，背靠岩石。', opts: ['雪座', '冰块', '石堆'], a: 0 },
        { text: '凶手顺着不结冰、不积雪的【？】回到小屋后门，0:58 出现在裁屋。', opts: ['男汤小路', '汤川', '消雪管的村道'], a: 1 },
        { text: '1:30，热气融塌了雪座，【？】——不会说话的人，听见了那一声。', opts: ['尸体滑进了池里', '岩台裂开了', '竹篱倒了'], a: 0 }
      ]
    },
    // 11. 投票
    ch3_g11: {
      type: 'vote',
      prompt: '把桐谷修平按进热汤的人是——请投下你的一票。',
      options: ['shimo', 'kumagai', 'makabe', 'renji', 'abe'],
      answer: 'kumagai'
    }
  },

  script: String.raw`

# ch3_start
@title 第三章|汤烟之雪
@bgm stop
@poem 三片雪，落汤池，\n热汤暖不了冷心。
@bg inn_kitchen
@filter dusk
@weather none
@caption 2月15日 17:12 白峰屋·厨房
@bgm lament
: 喇叭的余音，还在厨房的窗玻璃上嗡嗡地颤。
: 「三片雪，落汤池。」——白蛾说完这一句，就再也没有声音了。
> 这个时候，四方田圭应该已经被押进了神社的雪牢。
> 押送的人还没走到石阶下面，广播就响了。和昨天一模一样。
: 灶上的锅咕嘟咕嘟地响着。霜站在灶前，手里握着长柄勺，一动不动。
@show minato[think] L
minato: ……17:12。广播一共一分五十秒。
minato: 比昨天的短了二十秒。
@show chiyuki[sad] R
: 千雪坐在灶边的小凳上，两只手捂着一只茶碗。茶早就凉了。
ritsu: 千雪小姐。
chiyuki: ……七濑先生。
chiyuki: 我没事。只是……有点冷。
@show sayo[normal] C
sayo: 骗人～手都在抖呢。
: 小夜在千雪旁边蹲下来，没有再开玩笑。
@hide
@show chiyuki[sad] C
chiyuki: 「舅舅」这个词……我活了二十三年，一次都没有用过。
chiyuki: 外婆从来不提。我只知道妈妈有个弟弟，跟着外婆那边姓，很早就离家了。
chiyuki: 今天下午，他在寄合上看着我说：「你长得真像她。」
chiyuki: 然后，他就被绑起来，带走了。
ritsu: ……
chiyuki[think]: 他为我母亲杀了一个人。
chiyuki: 我应该恨他，还是……应该谢谢他？
chiyuki: 我连该用什么表情去看他，都不知道。
ritsu: 那就先不要决定。
ritsu: 先把能确定的事排出来——他是你的舅舅。他做错了事。这两件都是真的。
ritsu: 剩下的，等你想清楚了再说。
chiyuki[sad]: ……七濑先生说话，总像在写报告。
ritsu: 职业病。
chiyuki[smile]: ……谢谢。
@hide
: 一只冒着热气的茶碗，被轻轻放进了千雪的手心里。凉掉的那一只，被换走了。
: 是霜。她又伸出戴着毛线手套的左手，把千雪滑到肩上的围巾往上拢了拢，掖好。
@show shimo[normal] C
: 霜从围裙口袋里掏出粉笔，在挂在胸前的小石板上写字。
shimo{霜（石板）}: 「千雪小姐　喝热的」
@show chiyuki[surprise] R
chiyuki: ……啊。谢、谢谢您，霜阿姨。
: 霜点点头，转身回到灶前。长柄勺又开始在锅里慢慢地搅。
@show sayo[smile] L
sayo: 霜阿姨对千雪小姐特别好呢～
sayo: 我第一天来的时候，可没有人给我掖围巾哦～
@hide
> 霜的背影没有回头。
> 只是那只握着勺子的左手，停了一拍，才又动起来。
@show minato[normal] C
minato: 晚上七点开饭。八点，爷爷的通夜在裁屋。
minato: 爸爸说，宫司大人要念祝词，大人们要轮流守夜到天亮。
minato[sad]: ……我不用守。爸爸说小孩子要睡觉。
@hide
@show sayo[smile] C
sayo: 那么～离开饭还有一个多钟头！律君，去买点心吧～
ritsu: 你中午才吃过三个大福。
sayo: 那是中午的我。现在的我，是另一个人～
ritsu: 这句话，你在宵鸦岛上也说过。
sayo[normal]: ……嘿嘿。所以才更要去买点心嘛。
@hide
@goto ch3_store

# ch3_store
@bg store
@filter dusk
@caption 2月15日 17:30 阿部商店
@se crash
: 推开店门的一瞬间，货架上的罐头哗啦啦掉了一地。
@bgm tension
: 熊谷把桐谷顶在柜台上，一只手揪着他的衣领。桐谷的脚尖几乎离了地，怀里还死死抱着一只一升瓶。
@show kumagai[angry] L
kumagai: 「照之前说的写」——是什么意思！说！
@show kiriya[shock] R
kiriya: 放、放手……熊谷，你喝多了……
kumagai: 老子今天一滴都没喝！
kumagai: 喝多的是你！二十年来，你喝了多少，就藏了多少！
kiriya: 我、我什么都不知道……那是村长让……
kumagai: 村长让你写什么！
@show sayo[surprise] C
sayo: 喂喂喂～店里还有别的客人哦～
@hide sayo
: 熊谷回过头。就在他手松开的一瞬间，桐谷像一条泥鳅似的从他胳膊底下钻了出去，抱着酒瓶撞开店门，跑进了暮色里。
kumagai: ……桐谷！
@se door
@hide kiriya
: 熊谷追到门口，又停住了。他回过头，狠狠地瞪着律。
kumagai[dark]: 东京来的。少管闲事。
@hide
@se door
: 门被摔上了。玻璃窗嗡嗡地响。
@bgm calm
@show abe[normal] C
abe: ……吵吧，吵吧。
: 阿部文坐在柜台后面，眼皮都没抬一下，慢吞吞地把一颗糖塞进嘴里。
abe: 二十年前的账，总有人要来算的。
ritsu: 他们两个人，平时关系很好吗？
abe: 好啊。每天晚上在白峰屋的围炉边喝到半夜，像一对老夫妻。
abe: 一个想忘的事，一个怕想起来的事——喝着喝着，就喝成了朋友。
abe[think]: 现在那本破本子一念，好了，朋友也做不成了。
abe: 我跟你说，侦探小哥。那个酒鬼医生，每晚十二点以后都去雪见汤泡汤醒酒。
abe: 不泡一泡，他睡不着。雷打不动。
abe: 霜呢，每天夜里一点过后去收拾浴场。也是雷打不动。
abe[smile]: 这村子里谁几点去哪儿、几点回来——全村都知道。
abe: 比你那电子表还准哪，湊少爷。
@show minato[angry] R
minato: 我的表是对着广播报时校准的。阿部婆婆的「知道」，没有校准过。
abe: 哈哈哈，这孩子。
@get ch3_habits
@hide
@show minato[normal] C
minato: 侦探哥哥，你们还没去过雪见汤吧？
ritsu: 还没有。
minato: 那我带你们去！趁天还没黑透。
minato: 从这里走过去要九分钟。我量过。
@hide
@goto ch3_bath_tour

# ch3_bath_tour
@bg bathhouse
@filter dusk
@weather none
@caption 2月15日 17:48 雪见汤
@bgm snow
: 浴场在村子后面的山腰上。从村道拐上去，雪地里分出两条小路：左边插着「男」字的木牌，右边插着「女」字的木牌。
: 两条小路一前一后爬上山坡，在半山腰的一片平地上又靠到了一起。
: 平地上，两个露天池子并排卧在雪里，冒着浓浓的白汽。池子中间，隔着一道比人还高的竹篱。
@show minato[smile] C
minato: 这就是雪见汤。左边是男汤，右边是女汤。
minato: 这个时间，一般没有人泡。大人们都在等通夜。
@show sayo[smile] L
sayo: 哇～好多热气！律君律君，下去泡一下吧～
ritsu: 现在是零下五度。你要在通夜之前感冒吗。
sayo: 泡在热水里怎么会感冒～
ritsu: 出来的那一下会。
@hide sayo
: 律走到男汤池边。热气扑在脸上，带着一股淡淡的硫磺味。
: 池边一圈的岩石被蒸汽烘着，一片雪也没有，黑黢黢地湿着。再往外一两步，才是白白的积雪。
minato[normal]: 侦探哥哥，你看竹篱底下。
: 竹篱下方，离地一掌高的地方，竹子烂了一截，留着一道窄窄的缝。热气从缝里一丝一丝地钻过来。
minato: 那道缝，霜阿姨说不许从那里偷看。
minato[think]: 她在石板上写了一整板子的字。我都没偷看过。……只看过一次。
ritsu: 看见什么了？
minato: 女汤的池子。什么人都没有，霜阿姨在扫雪。
minato: 从那条缝里，看得见对面整个池子哦。两边都是。
@hide
: 男汤池子靠山的一侧，有一块大石头斜斜地伸进池里，像一张向池心歪着的石头台子。
: 台面上长满了黄白色的汤花，摸上去滑溜溜的。台子背后，紧挨着一块直立的大岩石，正好能靠背。
@show minato[normal] C
minato: 那块斜石头，是桐谷医生的位子。
minato: 他每次泡完，都坐在那上面吹风，说酒就醒了。
minato[think]: 我上去试过一次，滑下来了。那上面长满了汤花，跟抹了油一样。
minato: 还有一次更惨。
ritsu: 更惨？
minato: 去年冬天，我和爸爸在池边用雪拍了一个座位。拍得硬邦邦的，想坐在上面泡脚。
minato: 结果坐了没多久，雪座位就被热气吃软了，塌了一半，我整个人滑进了池子里。
minato[angry]: 穿着棉袄滑进去的。
@show sayo[smile] L
sayo: 噗～
minato: 霜阿姨在石板上写了两大板子的字骂我。
ritsu: 「没多久」是多久？
minato[normal]: 四十四分钟。我看着表的。
ritsu: ……你真的看了表。
minato[smile]: 掉进水里的时候，表也进水了。还好是防水的。
@hide
: 两个池子溢出来的热水，从池沿的豁口哗哗地流下去，在竹篱下方汇成一条小溪，沿着山坡往下淌。
: 小溪冒着白汽，水面上一片雪也没有。两岸的积雪都被热气烘得往后退了一截。
: 律在溪边蹲下来，把手伸进水里。
> ……温的。像放了一会儿的洗澡水。
: 水很清，深的地方大概到大腿，浅的地方没过膝盖。溪底铺着一层白色的、像棉絮一样的沉淀。
@show minato[normal] C
minato: 这条小溪叫汤川。冬天也不结冰。
minato: 雪落在上面，一下子就化了。所以汤川上面从来不积雪。
minato: 汤川一直流到村道底下，从涵洞里钻过去。半路上，路过熊谷叔叔家的后门。
minato: 熊谷叔叔在后门的台阶上洗他打来的兔子。
ritsu: 溪底那些白色的东西是什么？
minato: 汤花。温泉里的东西沉下来的。踩上去软软的。
@get ch3_yukawa
@hide
> 两个露天池，一道竹篱，竹篱下一道缝。
> 一块向池心倾斜的岩台，滑溜溜的。
> 一条不结冰、不积雪的小溪，一直流到村子里。
@show sayo[normal] L
sayo: ……律君？又在背东西了～
ritsu: 习惯而已。
ritsu: 白蛾说「三片雪，落汤池」。这个村子里的汤池，就只有这里和白峰屋的室内汤。
sayo[think]: 嗯……
sayo: 那我们以后，是不是最好不要一个人来泡汤？
ritsu: 最好不要。
@show minato[think] R
minato: 桐谷医生每天晚上都一个人来。
: 湊说完这句话，自己也愣了一下。没有人接话。
@hide
@bgm calm
: 天色暗下去了。池子里的热气，在暮色里变成了淡淡的灰紫色。
: 三个人沿着男汤小路下山。新踩出的脚印，一个一个留在身后的雪地上。
@bg village_road
@caption 2月15日 18:05 村道
: 村道上，埋在路面下的消雪管喷着温热的地下水，路面湿漉漉地反着光。一点积雪也没有。
@show minato[normal] C
minato: 我要回去帮霜阿姨摆碗了。
minato: 侦探哥哥，七点开饭，别迟到。迟到一分钟我都会记下来的。
@hide
> 离开饭还有一个钟头。
> 熊谷与桐谷，二十年前的送人与验尸的医生。「照之前说的写」——这一行字，正在这个村子里慢慢发酵。
> 在什么事情发生以前，我想再看一看这个村子。
@explore ch3_day

# ch3_day_end
@bg inn_entrance
@filter night
@caption 2月15日 18:55 白峰屋·玄关
@bgm calm
: 天已经黑透了。玄关的灯下，霜正跪着给客人们的靴子塞报纸，一双一双摆得整整齐齐。
: 她抬头看见律和小夜，在石板上写了几个字，举起来。
@show shimo[smile] C
shimo{霜（石板）}: 「辛苦了　晚饭好了」
@hide
@show sayo[smile] C
sayo: 好香～是炖菜吗？
sayo: 律君，吃完饭，到通夜之前还有一点时间哦～
ritsu: ……嗯。
@hide
> 通夜之前，还能和谁说说话。
@freetime 2
@goto ch3_evening

`
  + String.raw`

// ================= 日常·自由行动 =================

# ch3_d_ryukawa
: 汤川从两道雪墙之间流下来，冒着白汽，一头钻进了村道底下的涵洞。
: 涵洞口挂着一排冰柱，可冰柱底下的水，照样哗哗地流着。
> 这条小溪从浴场一路流下来，路过熊谷先生家的后门，再穿过这里。
@return

# ch3_d_road
: 消雪管的喷嘴每隔几步一个，不停地往路面上喷着温水。路面黑亮黑亮的，没有一片雪。
: 路两边的房子，大多是门直接开在这条路上。一出门，脚底下就是湿的。
> 在这条路上走，走一百趟也留不下一个脚印。第一章的晚上，我已经见识过了。
@return

# ch3_d_shed
: 白峰屋门口带屋檐的柴棚里，靠墙立着一架木头雪橇。是昨天雪送祭运雪灯笼用的。
: 木条缝里还嵌着一点凝固的蜡油。滑板擦得干干净净。
@return

# ch3_d_irori
: 围炉里的炭火压着，还没有添新炭。炉边铺着两块磨得发亮的坐垫。
: 一块是桐谷的，一块是熊谷的。——莲司说，那两个位子二十年都没换过人。
@return

# ch3_d_sake
: 酒架上排着一溜寄存的一升瓶，瓶颈上挂着写了名字的纸签。
: 「桐谷」的那一瓶，只剩下瓶底一点。旁边「熊谷」的那一瓶，几乎还是满的。
> 熊谷先生今晚说「一滴都没喝」。看来他平时，也喝得不多。
@return

# ch3_d_hwindow
: 窗外的天低低地压着，云层是铅灰色的，一点风也没有。
: 远处，雪见汤的方向，一缕一缕的白汽笔直地升上去，在暮色里慢慢散开。
@return

# ch3_p_renji
@if ch3_d_renji -> ch3_p_renji2
@set ch3_d_renji
@show renji[sad] C
: 莲司靠在窗边，指间夹着一支七星。烟灰积了很长一截，他也没有弹。
renji: ……七濑先生。
renji: 今晚是父亲的通夜。在裁屋。
renji: 本来该在本宅办的。可是那间离屋……谁也不想再靠近了。
ritsu: 守夜的人呢？
renji: 我排了班。十一点到一点，我和阿部婆婆。一点到三点，熊谷和真壁君。
renji: 三点到五点，宫司大人和长老们。……排班表贴在裁屋的墙上。
renji[think]: 熊谷说他要守。我本来想……让他歇一歇的。
renji: 今天在寄合上，念到那一行的时候，他的脸……
: 莲司没有说下去。他终于弹了一下烟灰。
renji: 四方田先生在我家住了一年。每天晚上和我下棋。
renji: 我什么都没看出来。……我这个村长，什么都没看出来。
@hide
@return

# ch3_p_renji2
@show renji[sad] C
renji: 通夜八点开始。七濑先生……也来上一炷香吧。
renji: 父亲那个人……也许不配。可是，规矩就是规矩。
@hide
@return

# ch3_d_shelf
: 七轮架上摆着四只七轮。第五只，到现在还在驻在所，贴着「证物」的纸条。
@return

# ch3_d_backdoor
: 后门边的木台上，并排摆着一双女式胶皮长靴，靴口塞着揉皱的报纸。
@show minato[normal] C
minato: 那是霜阿姨的靴子。她每天晚上穿着它去雪见汤。
minato: 塞报纸是为了吸潮。霜阿姨教我的。
@hide
@return

# ch3_p_shimo
@if ch3_d_shimo -> ch3_p_shimo2
@set ch3_d_shimo
: 霜跪在厨房的木台边，正在捏饭团。一只一只捏得圆圆的，在木盘里排成一排。
: 是给通夜守夜的人准备的。
@show shimo[normal] C
ritsu: 霜小姐，打扰了。
: 霜放下饭团，用围裙擦了擦手，拿起石板。
shimo{霜（石板）}: 「七濑先生　有什么事」
ritsu: 听阿部婆婆说，你每天夜里都去打扫雪见汤？
: 霜点点头。粉笔在石板上轻轻地走。
shimo{霜（石板）}: 「每天　一点以后」
shimo{霜（石板）}: 「先扫女汤　换竹篮　扫雪」
shimo{霜（石板）}: 「医生泡完了　再扫男汤」
ritsu: 桐谷医生每天都去？
shimo{霜（石板）}: 「每天　十二点以后」
shimo{霜（石板）}: 「下雪的晚上也去」
@show sayo[smile] L
sayo: 哇，霜阿姨的「雪」字好可爱～
sayo: 上面那四个点，连成了一条波浪线呢。像一只飞着的小蛾子～
: 霜的手停了一下。然后，她用袖口把石板上的字擦掉了。
@hide sayo
ritsu: 千雪小姐呢？刚才还在这里。
shimo{霜（石板）}: 「去雪牢了」
shimo{霜（石板）}: 「去看　四方田先生」
: 写完，霜站起来，从灶边拿过一只小小的保温瓶，塞到律的手里。瓶身是热的。
shimo{霜（石板）}: 「雪牢很冷」
shimo{霜（石板）}: 「请　给千雪小姐」
ritsu: ……好。我会交给她。
@set ch3_thermos
: 霜深深地鞠了一躬，又跪回木台边，捏起下一只饭团。
@hide
> 她的左手始终戴着那只灰色的毛线手套。捏饭团的时候也没有摘。
@return

# ch3_p_shimo2
@show shimo[normal] C
: 霜在捏饭团。见律回来，她抬头看了一眼，在石板上写：
shimo{霜（石板）}: 「保温瓶　送到了吗」
@if ch3_gave_thermos -> ch3_p_shimo3
ritsu: 还没有。我这就去。
: 霜点点头，低下头去，继续捏饭团。
@hide
@return

# ch3_p_shimo3
ritsu: 送到了。她说，茶很甜。
: 霜的手停住了。过了一会儿，她才慢慢点了点头。
@hide
@return

# ch3_d_wader
: 墙上的钉子上，挂着一条胶皮做的长靴裤——靴子和裤腿连在一起，一直护到胸口。
: 胶皮是干的，靴底的纹路里卡着一点干掉的白色东西。
> 胴长。涉水用的。
@return

# ch3_d_steps
@se door
: 推开后门，一股白汽扑了进来。
: 门外是几级石阶，一级一级往下，最下面两级直接泡在汤川里。溪水冒着热气，从石阶脚下流过去。
: 泡在水里的石阶湿漉漉的；水面以上的几级，结着一层薄薄的冰壳，亮晶晶的。
@return

# ch3_d_front
: 前门一开，就是村道。门槛外面一步，便是消雪管喷湿的黑色路面。
: 门前一点积雪也没有。
@return

# ch3_d_rifle
: 猎枪架上横着一支旧猎枪，墙上挂着几张兽皮。
: 枪架下面挂着一只空的刀鞘——熊谷腰上那把猎刀的鞘。刃口足有一指宽。
@return

# ch3_p_kumagai
@if ch3_d_kumagai -> ch3_p_kumagai2
@set ch3_d_kumagai
@bgm tension
: 小屋的门半开着。熊谷坐在炉边，用一块磨刀石，一下一下地磨他那把猎刀。
@show kumagai[angry] C
kumagai: ……谁让你进来的。
ritsu: 门开着。
kumagai: 门开着，就能进别人家？你们东京人都这么没规矩？
@show sayo[smile] L
sayo: 打扰了～我们只是来道个歉。刚才在店里，好像打断了您的话。
kumagai: ……哼。
@hide sayo
: 熊谷把刀插回腰上的刀鞘，站起来。他的个子几乎顶到了房梁。
ritsu: 墙上那条胶皮裤子，是做什么用的？
kumagai[normal]: 胴长。下河用的。
kumagai: 冬天我穿着胴长下河抓岩鱼——冻不死人的。
kumagai: 后门下去就是汤川。热水，冬天也冻不住，岩鱼都往那儿躲。
kumagai: 穿上它，在水里站一个钟头，腿都是干的。
ritsu: 汤川一直能走到浴场？
kumagai[think]: ……能走到哪儿，关你什么事。
: 熊谷走到门口，抬头看了看天。铅灰色的云一动不动。
kumagai[normal]: 东京来的，记住了。今晚十点前后起雪。细雪，没风。
kumagai: 后半夜一点前后就停。
ritsu: 你怎么知道？
kumagai: 我在这山里活了四十六年。
kumagai: 雪什么时候来，什么时候走，我比广播还清楚。
kumagai[dark]: ……出去。我要睡一会儿。一点钟还得去守夜。
@hide
@bgm calm
@note kumagai 有一条涉水用的胴长；后门的石阶直接下到汤川。预言今晚 22:00 前后起细雪、1:00 前后停。
@return

# ch3_p_kumagai2
@show kumagai[angry] C
kumagai: 还不走？
kumagai: 照之前说的写……照之前说的写……
: 熊谷背对着律，像是没意识到自己在出声。
@hide
@return

# ch3_d_rota
@set ch3_d_rota
: 裁屋的墙上，贴着一张毛笔写的排班表。墨迹还新。
@letter 故 白峰源一郎　通夜守夜\n\n二十三时～一时　白峰莲司　阿部文\n一时～三时　熊谷大吾　真壁翔太\n三时～五时　葛城澄　长老
> 一点钟，熊谷先生和真壁巡查接班。三点，宫司大人接班。
@return

# ch3_d_coffin
: 裁屋的上座，摆着一具白木的灵柩。白布、烛台、一只小小的香炉。
: 白峰源一郎躺在这里。二十年前，他就坐在这个位置上，操纵了那一场寄合。
> 「村子的事，村子自己办。」——现在，村子在替他办丧事。
@return

# ch3_p_sumi
@if ch3_d_sumi -> ch3_p_sumi2
@set ch3_d_sumi
@show sumi[normal] C
: 澄跪在灵柩前，正把一根根白蜡烛插上烛台。白羽织的下摆铺在地板上，像一摊雪。
sumi: ……七濑先生。
sumi: 今晚八点，通夜祭。……请您也来。
ritsu: 宫司大人刚才去了雪牢？
sumi[sad]: 嗯。我先一步去开雪牢……点灯，焚香。
sumi: 那是宫司的规矩。押送的人到之前，牢里要先暖起来。
sumi: 我给四方田先生多送了一床被子。……那里，很冷。
@show sayo[normal] L
sayo: 澄小姐，脸色好白哦。没睡好吗？
sumi[smile]: ……这三天，村里谁都没睡好。
sumi: 小夜小姐也是。……请多保重。
@hide sayo
sumi[normal]: 四方田先生的姐姐……
: 澄的手停在烛台上。过了一会儿，她才把那根蜡烛插稳。
sumi: ……不。没什么。
@hide
@return

# ch3_p_sumi2
@show sumi[normal] C
sumi: 祝词，我已经写好了。……人死了，总要有人替他说几句好话。
sumi[sad]: 哪怕是那样的人。
@hide
@return

# ch3_d_logbook
: 桌上摊着一本厚厚的日志。每一页都是工工整整的字，一行一个时刻。
: 「2/14　21:00　雪止，无风」「2/15　6:40　白峰本宅报案」「17:10　白蛾广播」「17:15　四方田圭　收押」
> 天气、时刻、谁来过。一行不落。
@return

# ch3_d_stove
: 铁炉烧得通红。四个角都包着铁皮，棱角锋利。炉边的地板上，摆着一双烤得半干的手套。
@return

# ch3_p_makabe
@if ch3_d_makabe -> ch3_p_makabe2
@set ch3_d_makabe
@show makabe[normal] C
: 真壁坐在桌前，正低头往日志上写字。看见律，他放下笔，站了起来。
makabe: 七濑先生。四方田先生已经收押了。我刚从雪牢回来。
makabe: 17:15。……我记下了。
ritsu: 你每天都记？
makabe[smile]: 是我父亲的习惯。天气、时刻、谁来过、出了什么事——他每天都记。
makabe: 我从小趴在这张桌子边上看他写。他死了以后，我就接着写了。
makabe: 晚上守夜、巡逻的时候，我也揣在大衣口袋里。想到什么，就记下来。
@show sayo[smile] L
sayo: 真壁巡查好认真～
makabe[surprise]: 不、不是认真……只是不记下来，我会忘。
@hide sayo
makabe[normal]: 今晚一点到三点，我和熊谷先生守灵。零点五十五分从这里出门，就来得及。
: 他看了一眼墙角。那里堆着几只落满灰的纸箱，用麻绳捆着。
makabe[sad]: ……那是父亲的旧档案。一直堆在那儿。
makabe: 我一直……不太敢打开。
@hide
@note makabe 每天按父亲的习惯记值班日志（天气、时刻、来人），守夜时也随身带着。
@return

# ch3_p_makabe2
@show makabe[normal] C
makabe: 七濑先生，有什么需要我做的，请随时吩咐。
makabe: 这一次，我想亲手把事情查清楚。……在出事之前。
@hide
@return

# ch3_d_cig
: 香烟柜里码着几种牌子。七星码得最整齐，一条一条叠得像砖。
@return

# ch3_d_swindow
: 店窗正对着马路对面的驻在所。驻在所的窗户里亮着灯，看得见真壁伏在桌上写字的背影。
@return

# ch3_p_abe
@if ch3_d_abe -> ch3_p_abe2
@set ch3_d_abe
@show abe[normal] C
abe: 又来了？点心在左边第二层，小夜丫头。
@show sayo[smile] L
sayo: 阿部婆婆最好了～
@hide sayo
ritsu: 阿部婆婆，霜小姐是什么时候来村里的？
abe[think]: 霜？十年前。秋天。
abe: 说是新潟来的，家里人都没了。前任女将多惠心软，就收下了。
abe: 脸上那个样子，话也不会说，左手一年到头戴着手套。
abe[dark]: 谁知道她以前干过什么。
ritsu: 她在白峰屋做了十年，有人说过她的不是吗？
abe: ……那倒没有。干活倒是勤快。
abe: 可是侦探小哥，不说话的人，心里装的东西才多哪。
@hide
@return

# ch3_p_abe2
@show abe[normal] C
abe: 今晚十一点到一点，我得去裁屋守灵。老骨头了，熬不动喽。
@hide
@return

# ch3_d_safe
: 诊所角落里立着一只旧保险柜，墨绿色的漆斑斑驳驳。转盘锁上落着一层薄灰。
: 门缝严丝合缝，看不出任何被动过的痕迹。
@return

# ch3_d_records
: 病历柜一格一格按年份排着，从昭和四十年代一直到今年。有几格的标签已经褪得看不清了。
@return

# ch3_p_kiriya
@if ch3_d_kiriya -> ch3_p_kiriya2
@set ch3_d_kiriya
@bgm sad
@show kiriya[sad] C
: 桐谷缩在诊所的桌子后面。刚才那只一升瓶摆在桌上，已经下去了一截。他手里攥着一只扁酒壶，手指在抖。
kiriya: ……侦探先生。
kiriya: 你、你也是来问我的吗？
ritsu: 问什么？
kiriya: 照之前说的写……照之前说的写……
kiriya[shock]: 我什么都不知道。我只是个乡下医生。我什么都不知道。
@show sayo[normal] L
sayo: 桐谷医生，您喝得太多了。
kiriya: 喝？不喝，我连觉都睡不着。
kiriya[sad]: 今晚……泡一泡汤就好了。
kiriya: 每天晚上十二点以后，我都去雪见汤。泡一泡，再坐在那块斜石头上看看雪。
kiriya: 酒就醒了。什么都能忘一会儿。
@hide sayo
: 他的目光越过律的肩膀，落在墙角那只墨绿色的保险柜上。只看了一眼，就慌忙移开了。
ritsu: 那只保险柜里，放着什么？
kiriya[dark]: ……我这辈子，最不想看见的东西。
kiriya: 侦探先生。你说……人写错了一个字，要用多少年来还？
: 桐谷没有等律回答。他把扁酒壶举到嘴边，仰头喝了一大口。
@hide
@bgm calm
@note kiriya 每晚十二点后去雪见汤泡汤醒酒，泡完坐在男汤的斜岩台上吹风。对诊所的旧保险柜讳莫如深。
@return

# ch3_p_kiriya2
@show kiriya[sad] C
kiriya: ……走吧，侦探先生。我要喝酒了。
@hide
@return

# ch3_d_lattice
: 神社背后的冰室。墙壁是一层一层冻实的冰，灯笼的光在冰面上晃。
: 木格子隔出几个小间。雅在一间，四方田在一间。最里面那间，还空着。
@return

# ch3_p_chiyuki
@if ch3_d_chiyuki -> ch3_p_chiyuki3
@set ch3_d_chiyuki
@show chiyuki[sad] C
: 千雪站在四方田那间木格子前，手里抱着一床叠好的被子。她已经站了很久了，被子还没递进去。
chiyuki: ……七濑先生。
@if ch3_thermos -> ch3_p_chiyuki2
chiyuki: 我只是……来送被子的。
chiyuki: 送完了就走。
@hide
@return

# ch3_p_chiyuki2
@set ch3_gave_thermos
ritsu: 霜小姐让我带给你的。她说雪牢很冷。
: 律把保温瓶递过去。千雪愣了一下，接过来，拧开盖子。是甜甜的热茶。
chiyuki[surprise]: ……霜阿姨？
chiyuki[smile]: 她怎么知道我会冷……
: 千雪捧着保温瓶，低头喝了一口。热气扑在她的睫毛上。
chiyuki: ……很甜。
chiyuki[smile]: 霜阿姨泡的茶，总是放很多糖。像是泡给小孩子喝的。
@hide
@return

# ch3_p_chiyuki3
@show chiyuki[sad] C
chiyuki: 我还不知道……该怎么叫他。
chiyuki: 再让我站一会儿吧。
@hide
@return

# ch3_p_yomoda
@show yomoda[sad] C
: 四方田坐在稻草上，圆眼镜的镜片上结了一层薄霜。他没有擦。
yomoda: ……七濑君。
yomoda: 千雪……她一直站在那里。不肯走，也不肯说话。
yomoda: 我对她说，不必叫我舅舅。我不配。
@if ch3_d_yomoda -> ch3_p_yomoda2
@set ch3_d_yomoda
yomoda[think]: 七濑君。那本记录本上，「桐谷：照之前说的写」。
yomoda: 寄合上莲司先生念到那一行的时候，我看见熊谷先生的脸了。
yomoda: 那是一个二十年来一直相信自己做了对的事的人的脸。
yomoda[dark]: ……现在，那张脸裂开了。
yomoda: 请当心。裂开的东西，里面装的往往不是悔恨。
@hide
@return

# ch3_p_yomoda2
yomoda: 请替我……照顾她。就当是一个罪人的请求。
@hide
@return

# ch3_p_miyabi
@show miyabi[normal] C
miyabi: 七濑先生。……现在几点了？
ritsu: 六点二十。
miyabi[smile]: 谢谢。这里没有钟。
miyabi: 要是湊在，他一定会告诉我精确到分钟的时间。「六点二十一分零八秒，妈妈。」
miyabi[sad]: ……您看，我连这种小事都要问犯人以外的人。
@hide
@return

# ch3_d_jizo
: 一排地藏的最边上，那尊没有名字的新地藏前，摆着一只饭团。雪被人拂得干干净净。
: 饭团还是软的。供上去，大概还没有一个钟头。
> 熊谷先生每天都来供。……今天，也没有忘。
@return

# ch3_d_jizorow
: 一排石地藏戴着褪色的红围兜，肩上落着雪。最边上那尊没有名字，石头的颜色还很新。
@return

`
  + String.raw`

// ================= 夜：通夜 → 细雪 → 围炉里 =================

# ch3_evening
@bg sabakiya
@filter night
@weather none
@caption 2月15日 20:00 裁屋·源一郎的通夜
@bgm lament
: 裁屋里点满了白蜡烛。茅草顶下的烟气，被烛火映成了淡淡的金色。
: 上座的白木灵柩前，澄捧着写好的祝词，用轻而慢的声音念着。每念完一段，她都停一拍，像在等谁回答。
: 村民们一排一排地坐着，低着头。有人在打瞌睡，有人在偷偷看律和小夜。
@show sumi[normal] C
sumi: ……愿白蛾大人，引此魂，归于山。
sumi: ……归于，雪。
@hide
: 玉串一枝一枝地放到灵前。轮到熊谷的时候，他站在灵柩前很久，一动不动，最后把玉串往案上一扔，转身走回了最后一排。
: 桐谷缩在角落里，扁酒壶揣在怀里。澄从他身边走过时，他举起酒壶，讨好地递过去。
@show kiriya[sad] L
kiriya: 宫司大人……暖暖身子……
@show sumi[normal] R
sumi: ……谢谢。我不喝酒。
: 澄微微鞠了一躬，走开了。桐谷举着酒壶的手，在半空中停了一会儿，又缩了回去。
@hide
@show renji[sad] C
renji: 各位。守夜的班，贴在墙上了。
renji: 十一点到一点，我和阿部婆婆。一点到三点，熊谷和真壁君。三点以后，宫司大人和长老们。
renji: 其他人……请回去休息吧。明天，还有明天的事。
@hide
: 霜端着茶盘，一碗一碗地给守夜的人上茶。千雪跟在她身后，帮她端着另一只茶盘。
: 两个人一句话也没有说——一个是不能说，一个是不知道说什么。可走到门槛前，霜回过身，伸手替千雪托了一下快要倾斜的茶盘。
: 千雪抬头看她。霜已经转过身去了。
@show sayo[normal] C
sayo: ……律君。
sayo: 你看见熊谷先生的眼睛了吗？从刚才起，他一直盯着桐谷医生。
ritsu: 看见了。
sayo[think]: 像猎人看着兔子。……不，像看着一只自己追了二十年的兔子。
@hide
@goto ch3_snowfall

# ch3_snowfall
@bg inn_room
@filter night
@caption 2月15日 22:00 白峰屋·律的房间
@bgm snow
: 律坐在窗边，把记事本摊在膝盖上。
: 楼下的围炉里传来几声闷闷的说话声，又安静了下去。
@weather snow
: 窗外，有什么白色的东西轻轻飘了过去。
: 雪。
: 一片，两片。然后是无数片。细细的，轻轻的，没有一丝风，笔直地落下来。
ritsu: ……十点整。
> 熊谷先生说过，十点前后起雪。细雪，没风。
> 他在第一章的那天早上也说过——吹雪的晚上，半个钟头就把脚印吃干净；
> 可没风的细雪不一样。它只往脚印里撒一层糖霜。
> 雪停之前踩的，还是雪停之后踩的，一眼就看得出来。
@show sayo[smile] C
sayo: 律君～楼下的霜阿姨在煮汁粉哦～
sayo: 夜宵！是夜宵！
ritsu: 现在是十点。
sayo: 十点也是夜宵的时间～这是汁粉的规矩～
ritsu: ……汁粉有规矩吗。
sayo: 有的哦。去吧去吧～
@hide
@goto ch3_hearth_scene

# ch3_hearth_scene
@bg inn_hearth
@filter night
@caption 2月15日 23:00 白峰屋·围炉里之间
@bgm mystery
: 围炉里的炭火压得很低。自在钩上挂着的铁壶，咝咝地冒着白气。
: 炉边只剩下两个人。桐谷，和熊谷。
: 寄存的一升瓶已经空了大半。桐谷的脸红得发紫，眼镜滑到了鼻尖上。熊谷面前的杯子，却几乎没动过。
: 律和小夜坐在靠窗的另一张矮桌边。霜端来两碗汁粉，轻轻放下，又悄无声息地退回了厨房。
@show sayo[normal] C
sayo: （小声）律君～那边的气氛，好像比外面还冷呢。
ritsu: （小声）别看他们。吃你的。
@hide
: 熊谷的声音压得很低。可他的嗓门本来就大，压低了，也像远处的闷雷。
@show kumagai[dark] L
kumagai: ……照之前说的写。
kumagai: 「之前」，是什么？
@show kiriya[sad] R
kiriya: 你、你喝醉了，熊谷……
kumagai: 老子一滴都没喝。我问你，「之前」是什么。
kiriya: 我是医生……我只是……照着写了……
kumagai[angry]: 写了什么！
: 桐谷的手一抖，杯里的酒洒在了膝盖上。
kiriya[shock]: ……我删掉了……
kiriya: 指向……另一个人的东西……
@se heartbeat
: 熊谷的背，一下子僵住了。
kiriya[sad]: 那个孩子……那个孩子才……
kiriya: 别问了！别问了……求求你……
@se glass
: 酒杯从桐谷的手里滚下去，在榻榻米上翻了个身。
@hide
> 「指向另一个人的东西」。
> 二十年前验尸的医生，删掉了某样东西——那样东西，指向冬木雪绘以外的「另一个人」。
> 「那个孩子」……又是谁？
@show sayo[think] C
sayo: （小声）……律君。
ritsu: （小声）嗯。我听见了。
@hide
: 那之后，两个人谁也没有再说话。铁壶咝咝地响着。炉里的炭，一点一点暗了下去。
@caption 2月15日 23:50 白峰屋·围炉里之间
@show kiriya[sad] C
kiriya: ……我、我去泡汤。
kiriya: 醒醒酒。
: 桐谷撑着膝盖站起来，晃了两晃，抓起扁酒壶塞进怀里，踉踉跄跄地往玄关走去。
@hide
@se door
: 玄关的门开了又关。冷风卷进来一小股雪。
@caption 2月15日 23:55 白峰屋·围炉里之间
@show kumagai[normal] C
kumagai: ……我回去睡一会儿。
kumagai: 一点钟，还得守夜。
: 熊谷站起来，把那杯一口没动的酒倒回了瓶子里。经过律的桌边时，他停住了脚步。
kumagai[dark]: 东京来的。你听见什么了？
ritsu: 汁粉很甜。
kumagai: ……哼。
@hide
@se door
: 熊谷走了。他走得很稳。一点醉意也没有。
@show sayo[sad] C
sayo: 律君……桐谷医生一个人去泡汤，没关系吗？
ritsu: 他每天都去。阿部婆婆说过，雷打不动。
ritsu: ……可是今晚，我也不太放心。
sayo: 要不要跟去看看？
ritsu: 跟着一个六十岁的醉汉去男汤？明天村里会怎么说，你想过吗。
sayo[smile]: 「侦探与医生，雪夜的露天温泉」～
ritsu: ……回去睡觉。
@hide
> 我当时，应该跟去的。
@goto ch3_night

# ch3_night
@bg inn_room
@filter night
@weather snow
@caption 2月16日 0:50 白峰屋·律的房间
@bgm snow
: 睡不着。
: 律披着大衣坐在窗边。雪还在下，细细的，静静的，没有风。
: 远处，裁屋的窗里亮着一点橙色的灯。守灵的人还醒着。
: 再远一点，雪见汤的方向，白汽在夜色里一缕一缕地升上去，看不清楚。
> 「指向另一个人的东西」……「那个孩子」……
> 二十年前的验尸记录，被改过。
> 改的是什么？那个「另一个人」，现在还在这个村子里吗？
: 律在记事本上写了几行字，又划掉了。不知什么时候，他靠着窗框睡着了。
@fade out
@wait 600
@weather none
@fade in
@caption 2月16日 1:20 白峰屋·律的房间
: 醒来的时候，雪已经停了。
: 云散开了一角，月亮露出来，把屋顶上新积的雪照得发蓝。四下里一点声音也没有。
> 一点以前停的吗。……我没有看见。
: 律看了一眼表，又闭上了眼睛。
@fade out
@wait 800
@goto ch3_alarm

# ch3_alarm
@bg inn_room
@filter night
@weather none
@fade in
@caption 2月16日 1:55 白峰屋
@se knock
@bgm horror
kumagai{熊谷的声音}: 开门！都起来！给老子起来！
@se knock
kumagai{熊谷的声音}: 桐谷……桐谷淹死了！在雪见汤！
@se footsteps
: 律从窗边跳起来。走廊里一阵乱响，隔壁的门、楼下的门一扇一扇地打开。
@bg inn_entrance
@caption 1:57 白峰屋·玄关
@show kumagai[shock] C
: 熊谷站在玄关的灯下，喘着粗气。他的棉袄敞着，裤腿一直湿到膝盖，靴子上全是雪。
kumagai: 护士！那个当护士的丫头在哪儿！
@show chiyuki[shock] R
chiyuki: 我在这里。
kumagai: 真壁让你去！快！
kumagai[angry]: 是那个哑巴——是那个哑巴看见的！一点半，她跑来裁屋砸门……
@hide
@show renji[shock] L
renji: 桐谷医生……？
@hide
ritsu: 走。路上说。
@goto ch3_discovery

# ch3_discovery
@bg bathhouse
@filter cold
@weather none
@caption 2月16日 2:08 雪见汤
@bgm horror
: 雪停之后的山坡，白得发亮。
: 男汤小路的入口，真壁提着手电等在那里。他的警服大衣从腰往下全湿透了，结了一层白霜。
@show makabe[shock] C
makabe: 七濑先生！请贴着路边走！
makabe: 小路正中间有一行木屐印——我们上去的时候，都是贴着路边走的。
makabe: 七濑先生说过，脚印是证据。
ritsu: ……做得好。
@hide
: 律举着灯，贴着路边往上爬。小路正中间，一行木屐的齿印一直通向山上。
: 平地上，男汤的池子还在冒着热气。池边的黑色岩石上，躺着一个人。
: 桐谷修平。
: 他只围着一条手巾，仰面躺着，全身被热汤泡得通红。眼睛半睁着，望着月亮。
@se heartbeat
> ……三片雪，落汤池。
> 热汤暖不了冷心。
@show makabe[sad] C
makabe: 一点四十二分，我们赶到的时候，他漂在池子正中间。
makabe: 我下水把他拖了上来。……已经没有气了。
makabe: 我按了很久的胸口。没有用。
@hide
: 女汤那一边，霜一个人站在竹篱的尽头。她没有穿外套，围裙上沾着雪，双手紧紧抱着那块小石板，抖得像一片叶子。
: 千雪看了她一眼，脱下自己的外套，披在了霜的肩上。然后，她跪到了桐谷的身边。
@show chiyuki[think] C
chiyuki: 请把灯举近一点。……谢谢。
chiyuki: 我是护士，不是法医。我能说的，只有我看到的。
@hide
@se footsteps
@show kumagai[angry] L
kumagai: 看什么看！还用看吗！
kumagai: 雪停以后，到这浴场来的，就只有那个哑巴！
kumagai: 一点半？谁知道一点半她在这里干了什么！
@show shimo[shock] R
: 霜拼命地摇头。她用发抖的手指在石板上写字，粉笔「啪」地断了一截。
shimo{霜（石板）}: 「我　听见水声」
shimo{霜（石板）}: 「我　没有」
kumagai: 哑巴写的东西，谁信！
@hide
@show renji[sad] C
renji: 熊谷，够了……
renji: 七濑先生。……寄合，明天上午十点半。
renji: 在那之前，要查哪里，就查哪里。我是村长——我准了。谁家的门都可以进。
ritsu: 谢谢。
renji[think]: 霜……先请她去裁屋。那里暖和，有人看着。
@show chiyuki[angry] R
chiyuki: 村长，霜阿姨她——
ritsu: 千雪小姐。让她去裁屋也好。
ritsu: 那里有人一直看着她——也就是说，从现在起到天亮，有人能证明她哪里也没去。
chiyuki: ……
@hide
: 熊谷和两个闻声赶来的村民，一左一右把霜带下了山。霜回过头，看了千雪一眼。
: 千雪攥着拳头站在月光下，什么也没有说。
@bgm investigate
> 一点以后，雪停了。雪停以后，上山的只有霜一个人。
> 村子的「直觉」，已经找好了它要送进雪里的人。
> 来历不明。不会说话。——就像第一章的千雪小姐，第二章的小夜。
> 这一次，被审判的人，连为自己说一句话都做不到。
> 那么，就由我来替她说。
: 天亮之前，还有四个钟头。
@get ch3_hearth
@get ch3_record_line
@explore ch3_inv

`
  + String.raw`

// ================= 搜查 =================

# ch3_i_body
@if has:ch3_body -> ch3_i_body2
: 律在桐谷的身边蹲下来。热汤的白汽从池面上漫过来，扑在脸上。
: 桐谷只围着一条手巾。全身的皮肤被泡得通红，手指和脚趾的皮起了皱，像在水里泡了很久很久。
: 他的眼镜不在脸上。嘴角挂着一点白沫。
: 真壁说，他是在池子正中间找到桐谷的。脸朝下，漂着。池边这块平坦的岩石，就是把他拖上岸放下的地方。
> 一个每天晚上都来泡汤的人，死在了他每天都泡的池子里。
@get ch3_body
@return

# ch3_i_body2
: 桐谷仰面躺在池边的岩石上，身上盖了一条草席。热汽在草席上凝成了水珠。
@return

# ch3_q_chiyuki
@if has:ch3_chiyuki_exam -> ch3_q_chiyuki2
@show chiyuki[think] C
chiyuki: 七濑先生。我先说清楚——我是护士，不是法医。
chiyuki: 下面说的，只是我亲眼看到的东西。
chiyuki: 死因，是溺死。
chiyuki: 口鼻和气管里灌满了水。这个味道……是硫磺。就是这个池子里的泉水。
chiyuki: 他是在这个池子里淹死的。不是在别处淹死、再被搬过来。
ritsu: 什么时候死的？
chiyuki[sad]: ……我说不出来。
chiyuki: 一般是看体温。可是尸体在四十多度的热水里泡着，体温根本降不下来。
chiyuki: 热水里的尸体，不能用体温推算死亡时间。这是常识。
chiyuki[think]: 不过，有两样东西，我想请您看一看。
: 千雪轻轻托起桐谷的肩膀，把灯凑近。
: 左肩和右肩上，各有一片发青的淤痕。凑近看，每一片都是五个椭圆的指印，排成一只摊开的手的形状。
chiyuki: 双肩各有一只手按压的痕迹。五个指印都在。
chiyuki: 指头和指头之间离得很宽。……是一双很大的手。
chiyuki: 有人从正面抓住他的两肩，用力往下按。
: 她又把尸体轻轻侧过来一点。背上和臀部，深深地印着一道一道的纹路，像岩石的纹理拓在了皮肤上。
chiyuki: 还有这个。背部和臀部的岩石压痕。
chiyuki: 活人靠在石头上，也会压出印子。可起身之后，很快就消了。
chiyuki: 这么深、这么清楚——是死后很长时间，一直被压在那里。
chiyuki[sad]: 他死了以后，在某块石头上靠坐了很久。然后才落进水里。
@hide
@get ch3_chiyuki_exam
@return

# ch3_q_chiyuki2
@show chiyuki[sad] C
chiyuki: ……七濑先生。还有一件事。
chiyuki: 零点半左右，我睡不着，下楼去厨房倒水。
chiyuki: 霜阿姨还在厨房里。在洗通夜用的茶碗。
chiyuki: 她看见我，在石板上写「千雪小姐　怎么还不睡」，给我倒了一杯温水，才让我上楼。
chiyuki[angry]: 那样的人……怎么会……
: 她的声音压得很低。低得几乎听不见。
@hide
@return

# ch3_q_renji
@show renji[sad] C
renji: 我在这里守着。……医生的身子，总不能扔在这里。
@if ch3_q_renji_done -> ch3_q_renji2
@set ch3_q_renji_done
renji: 十一点到一点，我和阿部婆婆在裁屋守灵。两个人一直在一起。
renji: 零点五十八分，熊谷来接班。一点，真壁君也到了，我和阿部婆婆就回去了。
renji[think]: 熊谷来的时候……我在给父亲续香，没注意他。
renji: 我该拦着医生的。他醉成那样，还要来泡汤……
renji: 我每天都想拦。每天都没有拦。
@hide
@return

# ch3_q_renji2
renji: 天亮以后……我去给医生找一副棺材。
@hide
@return

# ch3_i_ledge
@if has:ch3_ledge -> ch3_i_ledge2
: 男汤池子靠山的一侧，那块向池心倾斜的岩台。台面上长满了黄白色的汤花，灯光一照，滑溜溜地反着光。
: 台子正中间，贴着一片薄薄的、半透明的东西。
: 律伸手摸了摸。冰的。
: 一片坐垫大小的冰壳，边缘已经化得发圆，中间还留着一层没化透的、压得很实的雪。冰壳的边上，有几道扇形的纹路，像是手掌一下一下拍出来的。
: 岩台背后，紧挨着一块直立的大岩石。岩石的表面，正好是一个人靠背的高度。
> 池边一米以内的岩石都被热汽烘着，一片雪也存不住。
> 可这块冰壳是压实过的——不是从天上落下来的雪，是被人「拍」上去的。
@show sayo[think] C
sayo: ……律君。这块斜石头，就是湊君说的「桐谷医生的位子」吧？
ritsu: 嗯。泡完汤坐在上面吹风的地方。
@hide
@get ch3_ledge
@return

# ch3_i_ledge2
: 岩台上那片坐垫形的冰壳，边上还留着手掌拍打的纹路。背后，是一块正好能靠背的大岩石。
@return

# ch3_i_menpath
@if has:ch3_geta -> ch3_i_menpath2
: 男汤小路。律贴着路边蹲下来，把灯压低，斜斜地照着雪面。
: 小路正中间，是一行木屐的齿印。两齿一组，一组一组地往山上去。只有上山的，没有下山的。
: 齿印的轮廓发软，边沿塌了下去，每个印子底下都积着一层薄薄的新雪，像撒了一层糖霜。
: 路边贴着三行靴印——边缘锋利得像刀切的，底部一点雪也没有。是真壁、熊谷和霜一点四十二分上山时踩的。
: 再往旁边，还有几处浅浅的凹坑，被雪填得几乎平了，看不出形状。
> 那是傍晚我们三个人上下山的脚印。三个钟头的细雪，已经把它们填平了。
> 三种脚印，三种样子。十点以前的，被填平；十点到一点之间的，变软、积雪；一点以后的，清清楚楚。
> 熊谷先生的规矩，一条不差。
: 律用随身带的尺子，量了一个木屐印里的积雪，又量了路边没人踩过的新雪。
ritsu: ……印子里，六毫米。路边，三厘米。
: 真壁回驻在所之前，也蹲在这里量过一次。他说，他把数字记进了日志——「想着七濑先生可能会要」。
@get ch3_geta
@return

# ch3_i_menpath2
: 男汤小路上那一行木屐印，只有去程。软塌塌的轮廓里积着六毫米的雪。路边是三行锋利的救援者的靴印。
@return

# ch3_i_womenpath
@if has:ch3_shimo_prints -> ch3_i_womenpath2
: 女汤小路从村道那头绕上来，在女汤的更衣小屋前到头。
: 雪面上只有一行女式长靴的脚印。上山一行，下山一行。
: 每一个印子的边缘，都像刀切的一样锋利；底部干干净净，没有一点落雪。
: 下山的那一行，步子又大又乱，有几处还滑了一下。
> 霜是跑着下山的。
> 一点以后的脚印。雪停了以后，才踩下去的。
@get ch3_shimo_prints
@return

# ch3_i_womenpath2
: 女汤小路上，霜的一行脚印：上山，下山。边缘锋利，底部干净。
@return

# ch3_i_gap
: 竹篱的最下面，烂掉的那一截留下一道一掌高的缝。
: 律跪下来，把眼睛凑近。从女汤那一侧看过去，男汤的整个池子，在灯光里清清楚楚。
> 霜就是从这道缝里，看见了漂在池子里的人。
: 缝只有一掌高。别说大人，就连湊君也钻不过去。
@return

# ch3_i_yukawa
@if has:ch3_streambed -> ch3_i_yukawa3
@if has:ch3_banks -> ch3_i_yukawa2
: 两个池子溢出的热水，在竹篱下方汇成汤川，冒着白汽往山下流。
: 律举着灯，离岸两步远，沿着溪流一步一步往下走。一直走到看得见村道的地方，又走回来。
: 两岸的积雪平平整整。没有一个脚印。连野兔的足迹都没有。
: 溪水本身冒着热气，雪落进去就化了。水面上，什么也留不下。
@show sayo[normal] C
sayo: 岸上什么都没有呢……
ritsu: 嗯。没有人沿着溪边走过。
@hide
> 岸上没有痕迹。水面上也不会有痕迹。
> ……水底呢？天还太黑了。等一下，再来看一次。
@get ch3_banks
@return

# ch3_i_yukawa2
: 律又回到汤川边。这一次，他在男汤池子的溢流口旁边蹲下来，把灯贴近水面。
: 溪水清得像玻璃。灯光一直照到溪底那层白色的、棉絮一样的汤花上。
: 汤花上，有一串凹坑。
: 一个，又一个。长圆形，比人的脚大一圈，像是穿着长靴踩下去的。凹坑从溢流口开始，顺着溪底，一直往下游延伸，消失在灯光照不到的黑暗里。
: 律把灯移过去，一个一个地看。有的凹坑，脚尖朝着下游；有的，脚尖朝着上游。
> 有人在溪水里走上来，又走了下去。
> 不沾岸，不留脚印。走的是一条，谁也看不见的路。
@show sayo[shock] C
sayo: 律君，这是……
ritsu: 汤川也是一条路。
@hide
@get ch3_streambed
@return

# ch3_i_yukawa3
: 汤川的溪底，汤花上那一串长靴大小的凹坑，从男汤的溢流口一直通向下游。脚尖有的朝上，有的朝下。
@return

# ch3_i_menhut
: 男汤的更衣小屋。门口并排放着一双木屐，齿缝里还夹着雪。
: 竹篮里，浴衣叠得整整齐齐。浴衣上面，放着一副眼镜，和一只空了的扁酒壶。
> 他脱了衣服，叠好，摘下眼镜，放好。然后走进了池子。
> 来的时候，他是一个人。是一个准备好好泡一泡汤的、普通的醉汉。
@return

# ch3_i_culvert
: 汤川从山坡上流下来，钻进村道底下的涵洞。涵洞口的冰柱底下，溪水哗哗地流着，冒着白汽。
: 律回头往上游看。从浴场到这里，大约三百米。半路上，溪边挨着一间低矮的小屋。
> 熊谷先生的小屋。湊君说过，汤川路过他家的后门。
@return

# ch3_i_road
: 消雪管还在喷水。月光下，村道湿漉漉地发着黑光，一片雪也没有。
: 路边的房子，门都直接开在这条路上。从任何一扇门出来，走到任何一扇门里去——都不会留下痕迹。
@return

# ch3_i_steps
@if has:ch3_hutsteps -> ch3_i_steps2
@se door
: 律推开熊谷小屋的后门。白汽从门缝里涌进来。
: 门外的石阶一级一级往下，伸进汤川里。
: 傍晚来的时候，水面以上的几级结着一层亮晶晶的薄冰。
: 现在，那层冰不见了。石阶湿漉漉的，一直湿到门槛下面。
: 石阶的每一级上，都留着黄白色的、黏糊糊的东西。律用指尖抹了一点，凑到鼻子底下。
> 硫磺的味道。……汤花。
> 有人从溪里走上来，踩着这几级石阶，进了这扇门。没过多久。冰还没来得及重新冻上。
@show sayo[think] C
sayo: 律君……我们这样算不算擅闯民宅～
ritsu: 村长准了。
sayo: 那就……算是「正式的」擅闯民宅～
@hide
@get ch3_hutsteps
@return

# ch3_i_steps2
: 后门的石阶湿漉漉的，留着新鲜的汤花痕。傍晚来时那层薄冰，已经不见了。
@return

# ch3_i_wader
@if has:ch3_wader -> ch3_i_wader2
: 墙上的钉子上，挂着那条胴长。
: 傍晚看见的时候，它是干的。
: 现在，胶皮外面挂着一层细细的水珠，摸上去冰凉滑腻。靴底的纹路里，卡着白色的汤花。
: 律凑近闻了一下——一股浓浓的硫磺味，冲得人眼睛发酸。
@show sayo[shock] C
sayo: 湿的……
ritsu: 傍晚是干的。我亲眼看见的。
@hide
> 在这之间，有人穿着它下过水。
@get ch3_wader
@return

# ch3_i_wader2
: 挂在墙上的胴长，胶皮还湿着，靴底卡着汤花，一股硫磺味。
@return

# ch3_i_hstove
: 炉子是凉的。炉灰上连一点火星都没有。
: 墙角的被褥叠得方方正正，没有一点睡过的褶子。
> 「回去睡一会儿」——零点前后回到这间屋子的人，没有生火，也没有睡觉。
> 在零下的晚上，他这一个钟头在做什么？
@return

# ch3_i_front
: 前门一开，就是村道。门槛外面就是消雪管的湿路面，一片雪也没有。
> 从这扇门出去，走到裁屋，两分钟。一路上，不会留下任何东西。
@return

# ch3_i_rota
@if has:ch3_shift -> ch3_i_rota2
: 裁屋墙上那张排班表。墨迹在烛光下发亮。
@letter 故 白峰源一郎　通夜守夜\n\n二十三时～一时　白峰莲司　阿部文\n一时～三时　熊谷大吾　真壁翔太\n三时～五时　葛城澄　长老
> 一点钟，熊谷先生必须坐在这里。这张纸，全村都看见了。
@get ch3_shift
@return

# ch3_i_rota2
: 排班表：一时～三时，熊谷大吾、真壁翔太。
@return

# ch3_i_coffin
: 灵柩前的香，已经换过好几次了。三点一到，澄会来接班。
: 灵柩旁边又多了一张草席，叠好了放着。是给天亮以后的桐谷准备的。
@return

# ch3_q_shimo
@if has:ch3_slate -> ch3_q_shimo2
@bgm sad
: 霜坐在裁屋的角落里，背靠着墙。千雪的外套还披在她的肩上。
: 几个守灵的村民远远地坐着，谁也不靠近她。熊谷坐在门口，像一头堵着洞口的熊。
@show shimo[sad] C
ritsu: 霜小姐。
: 霜抬起头。她的脸颊上，那几道冻疤在烛光里显得更深了。
ritsu: 我想请你把今晚的事，从头写给我看。
ritsu: 慢慢写。我会等。
: 霜看了律很久。然后，她把石板放在膝盖上，捏起粉笔。
: 粉笔在石板上一笔一笔地走。很慢。她的手在抖，可每一个字都写得端端正正。
shimo{霜（石板）}: 「厨房　收拾到　1:05」
shimo{霜（石板）}: 「1:10　雪停了　去女汤打扫」
: 她用袖口擦掉，又写。
shimo{霜（石板）}: 「1:30　水声」
shimo{霜（石板）}: 「男汤」
ritsu: 你怎么知道是一点半？
: 霜从怀里摸出一只旧怀表，打开盖子给律看。表盘上的玻璃裂了一道缝，指针还在走。
shimo{霜（石板）}: 「听见水声　看了表」
shimo{霜（石板）}: 「从竹篱下面的缝　看」
shimo{霜（石板）}: 「有人　浮着」
: 写到这一行，她的手停住了。粉笔在「浮」字的最后一笔上，按断了。
ritsu: ……然后你就跑下山，去了裁屋。
: 霜点点头。
shimo{霜（石板）}: 「我　喊不出来」
shimo{霜（石板）}: 「只能　跑」
: 律看着石板上的字。一行一行，干干净净。「雪」字上面那四个点，连成了一道小小的波浪线。
> 「雪」字的写法，第一章的石板上也是这样。
> 她把自己看见的一切，都交给了这块石板。除了这块石板，她什么也没有。
ritsu: 谢谢你。这些字，我会好好记住。
: 霜看着他。然后，她用那只戴着手套的左手，把石板轻轻抱回了怀里。
@hide
@get ch3_slate
@bgm investigate
@return

# ch3_q_shimo2
@show shimo[sad] C
: 霜抱着石板，安静地坐着。见律过来，她在石板上写了一行字：
shimo{霜（石板）}: 「千雪小姐　冷不冷」
ritsu: 她在浴场，陪着桐谷医生。……她说她不冷。
: 霜低下头。过了一会儿，又写：
shimo{霜（石板）}: 「说不冷的人　最冷」
: 她把披在自己肩上的那件外套脱下来，仔仔细细叠好，双手递给律。
shimo{霜（石板）}: 「请　还给她」
ritsu: ……好。
@hide
@return

# ch3_q_kumagai
@if ch3_q_kumagai -> ch3_q_kumagai2
@set ch3_q_kumagai
@show kumagai[angry] C
kumagai: 又是你。东京来的。
kumagai: 还查什么？凶手就坐在那个角落里。
ritsu: 熊谷先生，昨晚 23:55 你离开白峰屋以后，去了哪里？
kumagai: 回家。睡觉。说过了。
kumagai: 零点五十六分出门，走到这里，零点五十八分。莲司和阿部婆子都看见了。
kumagai: 一点起，我和真壁一直坐在这里守灵。一步都没离开过。
kumagai[dark]: 一点半，那个哑巴砸门。我跟真壁跑上山，真壁下水捞的人。
kumagai: 我从家里走过来的。干干爽爽。你要不要摸摸我的裤脚？
@if has:ch3_makabe -> ch3_q_kumagai_smell
@hide
@note kumagai 自称 23:55 回家睡觉，0:56 出门，0:58 到裁屋，「干干爽爽」。
@return

# ch3_q_kumagai_smell
ritsu: 真壁巡查说，你身上有一股硫磺味。
kumagai[angry]: 傍晚泡过汤！不行吗！
kumagai: 这村子里谁身上没有硫磺味！
@hide
@note kumagai 自称 23:55 回家睡觉，0:56 出门，0:58 到裁屋，「干干爽爽」。说硫磺味是「傍晚泡过汤」。
@return

# ch3_q_kumagai2
@show kumagai[dark] C
kumagai: ……那个哑巴，来村里十年了。
kumagai: 十年来，谁知道她从哪儿来，以前干过什么。
: 熊谷说完，把目光从角落里的霜身上挪开了。像是那里有什么刺眼的东西。
@hide
@return

# ch3_q_abe
@show abe[normal] C
abe: 侦探小哥，这么晚还不睡？
@if ch3_q_abe_done -> ch3_q_abe2
@set ch3_q_abe_done
abe: 我和村长十一点到一点在这里守灵。一步都没离开过——两个人互相盯着，谁也打不了瞌睡。
abe: 熊谷那小子零点五十八分到的。一点整，真壁也来了，我就回家了。
abe[think]: 回去刚躺下，两点前后，就被熊谷那大嗓门吵醒了，满村子喊人。
abe[dark]: 我早就说过。不说话的人，心里装的东西才多。
abe: 一点以后，一个人跑到浴场去……哼。
@hide
@return

# ch3_q_abe2
abe: 三点了吧？宫司大人该来接班了。
@hide
@return

# ch3_i_log
@if has:ch3_log -> ch3_i_log2
: 驻在所的桌上，摊着真壁的值班日志。最新的一页，墨迹还没干透。
@letter 2月15日\n22:00　降雪开始，无风\n\n2月16日\n0:55　出所，小雪\n0:58　熊谷到裁屋（接班）\n1:00　雪止（1:05 补记）\n1:36　霜来报：男汤有人浮着\n1:42　到雪见汤，桐谷医生已无呼吸\n2:05　测量：木屐印内积雪约六毫米，路边新雪约三厘米
> 雪，22:00 开始，1:00 停。
> 零点五十五分他出门的时候还在下。一点零五分在裁屋，他补记了一点整雪停。
@get ch3_log
@return

# ch3_i_log2
: 值班日志：22:00 降雪开始，无风。0:55 出所，小雪。0:58 熊谷到裁屋。1:00 雪止。
@return

# ch3_q_makabe
@if has:ch3_makabe -> ch3_q_makabe2
@show makabe[normal] C
: 真壁换了一条干裤子，正在铁炉边烤他那件湿透的警服大衣。看见律，他站了起来。
makabe: 七濑先生。我回来拿相机和担架，顺便把日志补上了。
ritsu: 你守夜的时候，熊谷先生是什么样子？
makabe[think]: ……这个，我也正想跟您说。
makabe: 0:58，熊谷先生到裁屋接班。在炉边坐下的时候，我闻到他裤脚有一股硫磺味。
makabe: 我随口问了一句。他说「傍晚泡过汤」。
makabe: 可是……他的头发和胡子，都是干的。一点潮气都没有。
makabe: 泡过汤的人，头发不会那么干。就算是傍晚泡的，那么大一把胡子，也不会干得那么透……
makabe: 不，傍晚泡的话，裤脚也不该有那么重的味道。
makabe[sad]: 我是不是……想多了？
ritsu: 你没有想多。你只是把看见的事，记了下来。
makabe[smile]: ……是。我父亲说过，警察能做的，就是把看见的事记下来。
@hide
@get ch3_makabe
@return

# ch3_q_makabe2
@show makabe[normal] C
makabe: 一点到一点半，熊谷先生一直坐在我对面。这一点，我可以作证。
makabe: 可是一点以前……我不知道。
@hide
@return

# ch3_i_safe
@if has:ch3_safe -> ch3_i_safe2
: 诊所的门没有锁。桐谷出门去泡汤的时候，大概什么都没想。
: 角落里那只墨绿色的旧保险柜，门虚掩着。
: 门缝边的漆皮翻了起来，留着几道新的、发亮的撬痕。刃口很宽，像是用一把厚背的刀，硬生生地插进去撬开的。
: 律拉开柜门。里面空荡荡的，只有一本薄薄的册子。
@letter 验尸记录\n昭和五十八年二月十四日\n死者　白峰惣一（二十六岁）\n死因　头部遭铁杵击打致死\n\n记录人　桐谷修平
: 整整一页，就这么几行字。
> 一份「正式」的验尸记录。干净得像一张白纸。
> 撬开这只保险柜的人，想找的一定不是它。——是「之前」的那一份。
> 他没有找到。
@show sayo[think] C
sayo: 刃口这么宽的刀……
ritsu: 傍晚，熊谷先生在炉边磨的那把猎刀，刃口有一指宽。
sayo: ……律君。
@hide
@get ch3_safe
@return

# ch3_i_safe2
: 被撬开的保险柜里，只有那本干干净净的正式验尸记录。
@return

# ch3_i_cdesk
: 桌上摆着傍晚那只一升瓶，已经空了。旁边压着一张处方笺，上面歪歪扭扭写着一个字，又被墨涂掉了。
: 透过墨迹，勉强认得出来——是一个「对」字。
> 「对不起」的「对」？还是「对的」的「对」？
@return

# ch3_i_irori
: 围炉里的炭已经熄了。桐谷坐过的坐垫上，还留着一摊洒出来的酒渍。
: 熊谷的那只杯子，被倒空了，倒扣在炉沿上。
@return

# ch3_i_hwindow
: 窗外，月亮挂在雪见汤的方向。白汽还在一缕一缕地升。
@return

# ch3_q_sayo
@show sayo[normal] C
: 小夜坐在围炉边，把两只手伸到熄了的炉子上方，像在烤一堆不存在的火。
sayo: 律君……
sayo: 刚才在浴场，熊谷先生一喊「是那个哑巴」，大家看霜阿姨的眼神就全变了。
sayo: 和前天看我的眼神，一模一样。
sayo: 被所有人那样看着的时候……想说的话，一句都说不出来。
sayo[sad]: 我好歹还能说。霜阿姨连「不是我」三个字，都喊不出来。
ritsu: 她写了。「我没有」。
sayo: ……嗯。可是写在石板上的字，那些人连看都不看。
: 小夜抬起头。她没有带「～」。
sayo: 律君。这一次，一定要赢。
ritsu: ……嗯。
@hide
@return

# ch3_inv_end
@bg village_road
@filter cold
@weather none
@caption 2月16日 5:40 村道
@bgm calm
: 东边的山脊上，天色开始发白。
: 消雪管还在喷水。湿漉漉的路面上，映着一点灰蓝色的天光。
> 先把能确定的事排出来。
> 雪，从十点下到一点。没有风。
> 木屐印里积着雪——桐谷先生是在雪停之前、零点二十分前后上山的。霜的脚印是一点以后的。
> 他在池子里被一双五指俱全的大手按住，淹死了。死后，在某块石头上靠坐了很久。
> 岩台上，有一片被人拍实的雪留下的冰壳。
> 男汤小路上，只有他上山的木屐印。可溪底的汤花上，有一串长靴的脚印，通向下游。
> 下游，是一间后门石阶湿透了的小屋。墙上，挂着一条湿透了的胴长。
: 律停下脚步，回头望着山腰上的白汽。
> ……还差一件事。
> 霜写的「一点半，水声」。
> 如果人在一点以前就死了——那一点半的那一声，是什么？
@show sayo[normal] C
sayo: 律君，去睡一会儿吧。离寄合还有五个钟头呢。
ritsu: 你先去。我再站一会儿。
sayo[smile]: ……那我陪你站一会儿～
@hide
@goto ch3_morning

# ch3_morning
@bg sabakiya
@filter none
@weather none
@caption 2月16日 8:10 裁屋
@bgm sad
: 天亮了。裁屋的木格窗里透进灰白的光。
: 桐谷的遗体被抬了下来，盖着白布，停在源一郎的灵柩旁边。两具棺木，并排摆在上座。
: 霜还坐在那个角落里。一整夜，她没有合过眼。
: 千雪端着一只木托盘走进来。托盘上是一碗热粥，和一碟腌萝卜。
@show chiyuki[normal] L
chiyuki: 霜阿姨。吃一点吧。
@show shimo[sad] R
: 霜看着那碗粥，摇了摇头。她在石板上写：
shimo{霜（石板）}: 「千雪小姐　一夜没睡」
shimo{霜（石板）}: 「你先吃」
chiyuki: 我是护士。护士熬夜是工作。
chiyuki: 您不是。……您吃一口，我就吃一口。
: 霜看了她很久。然后，她接过勺子，舀了一小口粥，送进嘴里。
: 千雪也拿起另一只勺子，舀了一口。
: 两个人就这样，你一口，我一口，把一碗粥分着吃完了。谁也没有说话。
: 吃完，霜用袖口替千雪擦掉了嘴角的一粒米。那动作快得像一个习惯。
chiyuki[surprise]: ……
: 千雪愣愣地看着她。霜已经低下了头，把空碗放回了托盘上。
: 千雪没有问。霜也没有写。
@hide
: 门外，长老们的木屐声，一个接一个地近了。
@goto ch3_trial

`
  + String.raw`

// ================= 寄合（上） =================

# ch3_trial
@bg sabakiya
@trial on
@bgm trial
@caption 2月16日 10:30 裁屋
: 茅草顶下，围炉里的火烧得很旺。村民们围坐成一圈，膝前各摆着一块写了自家名字的木头投票札。
: 上座并排停着两具棺木。一具是昨天的，一具是今天的。
: 雅、四方田——在雪牢里。源一郎、桐谷——在白布底下。
: 圈子的正中央，坐着霜。她抱着那块小石板，背挺得笔直。戴着毛线手套的左手，紧紧攥着石板的边。
@se gavel
renji: ……时辰到了。寄合，开始。
renji: 规矩，各位都清楚。在场的人每人一票，多数决。被裁定的人关进雪牢，明天黎明……送进雪里。
renji: 还有七濑先生的约定。如果他能在这里证明真凶，真凶就关起来，等警察来。
villager{长老}: 不必念了，村长。
villager{长老}: 来历不明。不会说话。深夜一个人在浴场。
villager{长老}: 还要议什么？
: 圈子里响起一片低低的附和声。有人朝霜的方向啐了一口。
@se footsteps
: 千雪站了起来。她穿过人圈，走到正中央，在霜的身边站定。
chiyuki: 霜阿姨不会说话。
chiyuki: 可是，不会说话，不等于不能为自己辩护。
villager{村妇}: 杀人犯的女儿，又来替别人说话了？
chiyuki: ……是的。所以我知道，被这样看着是什么滋味。
: 霜抬起头，看着千雪。她飞快地在石板上写了几个字，侧过来——只给千雪一个人看。
shimo{霜（石板）}: 「回座位去　会被人说闲话的」
chiyuki: 我已经被说了二十年了。
: 霜的手停在半空中。过了一会儿，她用袖口，很轻很轻地把那一行字擦掉了。又写：
shimo{霜（石板）}: 「……谢谢」
ritsu: 千雪小姐说得对。
ritsu: 霜小姐有她的石板。——还有我。
ritsu: 我替她说话。
kumagai: 哈。东京来的，又要开始表演了。
ritsu: 表演的部分，留给白蛾吧。我只说能确定的事。
> 霜的声音，只有那一块石板。
> 那么，这一次的寄合，我必须把石板上的每一个字，都变成证据。
chiyuki: 先由我来报告。……我是护士，不是法医。我只说我亲眼看到的。
chiyuki: 桐谷医生是溺死的。气管和口鼻里是硫磺泉水——就是在男汤的池子里淹死的。
chiyuki: 尸体泡在热水里。热水里的尸体，不能用体温推算死亡时间。
renji: 那么……什么时候死的，不知道？
kumagai: 用不着知道！
kumagai: 昨晚一点，雪停了。雪停以后，浴场里只有她一个人！
abe: 就是。一点半，她自己写的，「听见水声」。听见？我看是「弄出来的」水声吧。
villager{长老}: 哑巴。你有什么话说？
: 所有人的眼睛都转向了圈子正中央。
: 霜低下头，在石板上写字。粉笔走得很慢，很慢。一笔，一笔。
: 写完，她双手把石板举起来，举过头顶，慢慢地转了一圈——让裁屋里的每一个人都看见。
shimo{霜（石板）}: 「我没有杀人」
@se heartbeat
: 裁屋里安静了一瞬。
: 熊谷别过了脸。
villager{长老}: ……写几个字，谁不会。
kumagai: 听好了，都听好了！桐谷是一点以后自己走进男汤的——小路上那行木屐印就是证据！
kumagai: 那哑女就在竹篱另一边！
> 一点以后，自己走进了男汤。
> 村子的「直觉」，就建在这一句话上。——那一行木屐印，真的是一点以后踩的吗？
@game ch3_g1
@shout ritsu 不对！
@bgm debate
ritsu: 熊谷先生说，桐谷先生是一点以后，自己走进男汤的。
ritsu: 可是，男汤小路上那一行木屐印，轮廓是软的。边沿塌了下去，每一个印子里都积着一层雪。
ritsu: 而女汤小路上，霜小姐的脚印——边缘锋利，底部干干净净。
ritsu: 熊谷先生。这是你在第一章的那天早上，亲口教我的。
ritsu: 「没风的细雪，只往脚印里撒一层糖霜。你一眼就看得出那是雪停之前踩的，还是之后踩的。」
kumagai: ……
ritsu: 昨晚的雪，从十点下到一点，没有风。真壁巡查，你的日志上是这么写的吗？
makabe: 是。22:00 降雪开始，无风。1:00 雪止。我记下的。
ritsu: 那么，积了雪的木屐印，是雪停之前踩的。桐谷先生在一点以前，就已经走进了浴场。
ritsu: 霜小姐的脚印里没有雪。那是一点以后踩的。
villager{长老}: ……熊谷。是这样吗？
: 熊谷的下巴绷紧了。他是村里最懂雪的人。在这个圈子里，他没法对雪说谎。
kumagai: ……细雪的脚印，是会变软。
kumagai: 没错。……没错。
abe: 那又怎么样！
abe: 那就是医生十二点多就泡着了。霜一点半过去，把他按进水里——
abe: 再回头写个「听见水声」！
villager{长老}: 对。先泡着的人，后去的人。不就是这么回事。
villager{村妇}: 一个女人，按住一个喝醉的老头子，有什么难的。
> 按进水里。
> 如果真是霜按住了他——桐谷先生的身上，会留下那双手的形状。
@game ch3_g2
@shout ritsu 就是这个！
ritsu: 千雪小姐。请把你在桐谷先生的双肩上看到的东西，告诉大家。
chiyuki: ……双肩各有一只手按压的淤痕。左肩一只，右肩一只。
chiyuki: 五个指印都在。指头和指头之间离得很宽。
chiyuki: 是一双很大的手。从正面抓住他的两肩，用力往下按。
ritsu: 两只手。每一只，都有五根手指。
: 律转过身，看着圈子正中央的霜。
ritsu: 霜小姐。
ritsu: ……请你摘下左手的手套。
@bgm stop
: 裁屋里，一下子静了下来。
: 霜没有动。她看着律，看了很久。然后，她的目光慢慢移到了千雪的脸上。
: 那眼神，像一个人站在雪地里，回头看着一扇亮着灯的窗。
chiyuki: 霜阿姨……不愿意的话……
: 霜摇了摇头。
@bgm sad
: 她把石板放在膝上，用右手捏住左手手套的指尖，一根，一根，慢慢地往下褪。
: 毛线手套滑落下来。
: 那只手，只有三根手指。
: 拇指、食指、中指。无名指和小指的地方，齐根什么也没有。断处是皱缩的、发亮的旧疤，像被雪咬过的树皮。
@se heartbeat
@get ch3_shimo_hand
: 圈子里，没有一个人出声。围炉里的炭，噼啪响了一下。
: 熊谷看着那只手。他的脸色，变了一下——像是看见了什么不该在这里出现的东西。他把两只拳头压在了膝盖上。
: 千雪蹲下来，用护士的手法，轻轻托起了那只手。
chiyuki: ……是冻伤。很久以前的。
chiyuki: 截得不算整齐。……可是，这只手保住了。
: 霜让她托着，没有抽回去。过了一会儿，才把手轻轻收了回来，把手套重新戴上。
ritsu: 这只手，按不出五个指印。
ritsu: 霜小姐的右手，也只是一只手。双肩上，是两只五指俱全的大手。
abe: ……那、那……
villager{长老}: ……
@bgm tension
kumagai: ……好。
kumagai: 就算……就算按人的不是她。
kumagai: 那她写的「一点半」，又是怎么回事？
kumagai: 照你的说法，医生一点以前就进了浴场。人早就该淹死了！
kumagai: 那哑巴写的「一点半，水声」，就是假的！
villager{长老}: 她在替谁遮掩。
abe: 替她的同伙！一个按人，一个写假时间——
villager{村妇}: 对！哑巴写的字，想怎么编就怎么编！
: 所有人的目光，又回到了那块石板上。
: 霜低着头。石板上「我没有杀人」那一行字，还没有擦掉。
> ……死亡时间，比一点半早。
> 那么，霜写下的「一点半」，是什么？
> 如果人早就死了，一点半就不该有任何声音。她写了一个不存在的时刻——这样想，最简单。
> 不会说话的人，被逼急了，写下一个对自己有利的时间。说得通。完全说得通。
> 可是——
@checkpoint
@choice
- 「霜在说谎——她写的时间是编的。」 -> ch3_be_ch3
- 「霜写的是真的。一点半，确实有水声。」 -> ch3_trust_slate

# ch3_trust_slate
@bgm debate
ritsu: ……霜小姐写的，是真的。
ritsu: 一点半，确实有水声。
kumagai: 胡说！死人会自己跳进水里吗！
ritsu: 会。
@se gavel
: 律的声音不大。可裁屋里所有的声音，都被这一个字压了下去。
ritsu: 人在一点以前就死了。一点半，有一声「哗啦」。
ritsu: 这两件事都是真的。那么能把它们连起来的，只有一种可能。
ritsu: 先把能确定的事，一件一件排出来。
@game ch3_g3
@bgm truth
ritsu: 木屐印里积着六毫米的雪，路边从十点积起的新雪是三厘米。三个钟头三厘米——六毫米，就是雪停前三十几分钟。
ritsu: 桐谷先生是零点二十分前后走上男汤小路的。零点半前后入池。
ritsu: 千雪小姐看到的背上那一道道深深的岩石压痕——是他死后，一直靠坐在岩石上留下的。
ritsu: 他死在雪还在下的时候。零点四十分前后。
ritsu: 然后，他的遗体在岩石上「坐」了很久。一点半，才落进池子里。
ritsu: 霜小姐听见的，就是那一声。
renji: 坐……坐在哪里？
ritsu: 男汤池边，那块向池心倾斜的岩台。湊君说过，那是桐谷先生的位子。
minato: ……可是那块石头，坐不住的。
minato: 上面全是汤花，跟抹了油一样。我上去试过，一下子就滑下来了。
ritsu: 对。一个醒着的人都坐不住。一具没有知觉的身体，更不可能在那上面坐四十多分钟。
ritsu: 除非——他的身子底下，垫着什么东西。
ritsu: 一样能让他坐稳，又会在四十多分钟之后，自己消失的东西。
@game ch3_g4
@shout ritsu 就是这个！
ritsu: 压实的雪。
ritsu: 岩台上，留着一片坐垫大小的冰壳。压实的雪化了一半，又冻上了。边上，还有手掌一下一下拍出来的纹路。
ritsu: 有人从池边抓来积雪，在倾斜的岩台上拍出了一个平平的「雪座」。
ritsu: 让桐谷先生坐在上面，背靠着后面那块大岩石。
minato: ……雪座位。
minato: 我和爸爸拍过的那个……在池边撑了四十四分钟，就被热气吃软了。我滑进了池子里。
minato: 我看着表的。四十四分钟。
renji: ……是去年冬天的事。湊浑身湿透地跑回家……
ritsu: 热汤的蒸汽，从下面一点一点地吃那个雪座。四十多分钟以后，雪座塌了。
ritsu: 遗体顺着滑溜溜的汤花，滑进了池子里——「哗啦」。
ritsu: 那一声，就是一点半。
ritsu: 霜小姐写下的时刻，不是她编造的不在场证明。是凶手亲手设定的、「死亡」的时刻。
@se heartbeat
: 霜慢慢抬起头。她看着律，嘴唇动了一下，却没有声音。
: 她低下头，在石板上写了两个字，又擦掉了。然后，她把石板抱在胸前，抱得紧紧的。
chiyuki: ……霜阿姨。
> 一点半的那一声，凶手是算准了的。
> 每天夜里一点过后，霜会去打扫浴场——全村都知道。
> 凶手要的，就是让她「听见」。让一个不会说话的人，成为第一个、也是唯一一个在场的人。
@bgm tension
kumagai: ……就算是这样。
kumagai: 就算医生死在十二点四十。那凶手呢？凶手往哪儿走？
villager{长老}: 是啊……浴场后面是山崖。
abe: 小路上就那一行木屐印，只有上山的……
> 凶手离开浴场的路。
> 两条小路上，都没有。那么，就在别的地方。
@game ch3_g5
@shout ritsu 不对！
ritsu: 熊谷先生说，凶手「得从小路走出去」。
ritsu: 浴场通往村子的，不只有两条小路。
ritsu: 两个池子溢出的热水，汇成一条小溪，一路流下山——汤川。
ritsu: 它冒着热气，冬天不结冰。雪落进去就化了，水面上从来不积雪。
ritsu: 走在汤川里，什么都不会留下。
villager{村妇}: 汤、汤川？
villager{长老}: 胡扯！大冬天的，谁会走进溪里！
abe: 水到大腿！出来以后，裤子就冻成冰棍了！
villager{长老}: 再说了，岸上的雪平平整整——他总不能飞到溪里去吧！
ritsu: 他不用飞。男汤的溢流口，就在池边。从池子里，一步就能踏进汤川。
> 岸上什么都没有。可溪水，是清的。
@game ch3_g6
@shout ritsu 就是这个！
ritsu: 汤川的溪底，铺着一层白色的汤花。
ritsu: 汤花上，有一串长靴大小的凹坑，从男汤的溢流口，一直往下游延伸。
ritsu: 有的脚尖朝着上游，有的朝着下游。
ritsu: 有人在溪水里走上来，又走了下去。两岸的积雪上，一个脚印也没有。
makabe: ……我跟着七濑先生去看过了。千真万确。
makabe: 灯一照，清清楚楚。一个一个的坑，像排着队一样。
villager{长老}: ……
renji: 可是……走在四十多度的热水里，又是零下的晚上……
renji: 腿一出水就冻上了。走不了几百米的。
ritsu: 普通人，走不了。
ritsu: 可这个村子里，有一个人，冬天会穿着某样东西下河抓岩鱼。
ritsu: 他说过：「在水里站一个钟头，腿都是干的。」
> 冬天在汤川里走上几百米、腿却不湿不冻的人——
@game ch3_g7
@bgm truth
ritsu: ……熊谷大吾先生。
ritsu: 能做到这件事的，是你。
@se shout
: 裁屋里炸开了锅。有人站了起来，有人打翻了茶碗。
villager{长老}: 熊、熊谷？
abe: 侦探小哥，你、你疯了？熊谷是送人……他是二十年前的……
kumagai: 东京来的。
: 熊谷慢慢地站了起来。他的影子投在茅草顶上，大得像一头熊。
kumagai: 你再说一遍。
ritsu: 冬天穿着胴长下河抓岩鱼的人，是你。
ritsu: 汤川流过的，是你小屋的后门。
kumagai: 哈……哈哈哈！
kumagai: 我零点五十八分就到裁屋了！莲司、阿部婆子、真壁，全都看见了！
kumagai: 我是从家里走过来的！干干爽爽！
> 他最有底气的，是那一句「干干爽爽」。
> 那就从这一句，砍下去。
@goto ch3_trial2

`
  + String.raw`

// ================= 寄合（下） =================

# ch3_trial2
@game ch3_g8
@shout ritsu 这就是破绽！
ritsu: 「干干爽爽」？
ritsu: 真壁巡查。你守夜的时候，熊谷先生是什么样子？
makabe: ……0:58，熊谷先生在炉边坐下的时候，我闻到他的裤脚有一股硫磺味。
makabe: 我随口问了一句。他说，傍晚泡过汤。
makabe: 可是他的头发和胡子都是干的。一点潮气都没有。
ritsu: 泡过汤的人，头发不会干成那样。而傍晚泡的汤，到半夜一点，裤脚也不会留下那么重的味道。
ritsu: 你没有泡过汤。你的上半身是干的，下半身，却刚刚从硫磺的水里出来。
ritsu: ——因为你穿着胴长，在汤川里走了三百米。
kumagai: 你……！
ritsu: 傍晚我去你的小屋，墙上那条胴长是干的。后门石阶的上面几级，结着一层薄冰。
ritsu: 凌晨三点，我再去的时候——胴长是湿的。靴底卡着汤花，一股硫磺味。
ritsu: 石阶上的冰不见了。每一级，都留着从溪里带上来的、新鲜的汤花。
ritsu: 你的炉子是凉的。被褥叠得整整齐齐。你说「回去睡一会儿」——可那一个钟头，你既没有生火，也没有睡觉。
kumagai[angry]: 胴长是打猎用的！挂在家里，湿着干着，关你什么事！
kumagai: 我为什么要杀那个酒鬼！我跟他喝了二十年的酒！
kumagai: 二十年！
> 为什么。
> 答案在第二章的寄合上，就已经被念出来了。
@game ch3_g9
@shout ritsu 就是这个！
@bgm truth
ritsu: 「桐谷：照之前说的写。」
ritsu: 1983 年的寄合记录本里的一行字。昨天在这里，村长当众念了出来。
ritsu: 念到这一行的时候，你的脸色变了。我看见了。四方田先生也看见了。
ritsu: 「照之前说的写」——既然有「之前说的」，就一定有一份「之前」的东西。一份被改掉之前的、真正的验尸记录。
ritsu: 昨天傍晚，你在阿部婆婆的店里揪着桐谷先生的领子，问的就是这一句。
ritsu: 晚上十点前后，你趁他在白峰屋喝酒，撬开了诊所的保险柜。门缝上的撬痕，刃口一指宽——和你腰上那把猎刀一样宽。
ritsu: 可是保险柜里，只有那份干干净净的「正式」记录。你没有找到。
ritsu: 所以十一点，你在围炉里逼问他。我和小夜就坐在旁边那张桌子。
ritsu: 桐谷先生说：「我删掉了……指向另一个人的东西。」
sayo: ……「那个孩子……别问了」。我也听见了。
kumagai: ……
ritsu: 指向另一个人。
ritsu: 也就是说——二十年前被送进雪里的冬木雪绘，也许不是凶手。
ritsu: 而送她走到送门的人，是你。
: 熊谷的嘴张开了，又闭上。他站在那里，像一棵被雷劈开的树。
> 把这一夜，从头到尾，重新走一遍。
@game ch3_g10
@bgm truth
ritsu: 昨晚十点前后，你趁桐谷先生在白峰屋喝酒，用猎刀撬开了诊所的保险柜。里面没有你要找的东西。
ritsu: 十一点，你在围炉里逼问他。他说漏了嘴，却不肯说出那个人是谁。
ritsu: 十一点五十分，他说要去泡汤醒酒。每晚十二点以后，他都去雪见汤——全村都知道。
ritsu: 十一点五十五分，你说「回去睡一会儿」。沿着消雪管的村道回到小屋，换上胴长。
ritsu: 零点十五分前后，你从后门的石阶下到汤川，逆着溪水走了三百米，从溢流口进了男汤，躲在池边岩石后面的热气里。
ritsu: 池边一米以内的岩石，被蒸汽烘得一片雪也没有。你在那里，也不会留下脚印。
ritsu: 零点二十分，桐谷先生踩着雪，走上男汤小路。零点半，他进了池子。
ritsu: 你从热气里现身，逼问他。他大概只是哭——没有说出你想听的那个名字。
ritsu: 你用两只大手按住了他的双肩。把他按进了热汤里。
@se heartbeat
ritsu: 然后，你从池边抓来积雪，在那块倾斜的岩台上，拍出一个平平的雪座。
ritsu: 让他坐在上面，背靠着岩石。热汤的蒸汽会一点一点地吃掉雪座——你是这座山里最懂雪的人。你知道要多久。
ritsu: 零点四十七分，你走进汤川，顺流而下。五分钟回到后门，脱下胴长，挂回墙上。
ritsu: 零点五十六分从前门出来，踩着消雪管的路面走到裁屋。零点五十八分，在莲司先生、阿部婆婆和真壁巡查的眼前坐了下来。
ritsu: 一点整，雪停了。从那一刻起，再上山的人，都会留下锋利的脚印。
ritsu: 一点十分，霜小姐像每天夜里一样，去打扫浴场。
ritsu: 一点半，雪座塌了。桐谷先生的遗体滑进了池子里。
ritsu: 一个不会说话的人，听见了那一声。从竹篱下的缝里，看见了浮着的人。她喊不出来。只能跑。
ritsu: 她跑下山，敲开了最近的、亮着灯的门——那扇门里，坐着你。
ritsu: 雪停以后，浴场里只有她一个人。不会说话。来历不明。
ritsu: 你等的，就是这个。
ritsu: ……我说得对吗，熊谷大吾先生。
@bgm stop
: 熊谷没有回答。
: 他的两只大手垂在身体两侧，手指一根一根地张开，又一根一根地握紧。
: 那是一双很大的手。五根手指，指距很宽。
renji: ……投票吧。
@game ch3_g11
@se gavel
@bgm lament
: 投票札一块一块地落进围炉边的木箱。木头碰着木头，嗒，嗒，嗒。
: 最后一块，没有落下来。
: 一位白发的长老，把自己的投票札攥在手里，攥得指节发白。
villager{长老}: ……我不投了。
villager{长老}: 二十年前，我投过一次。
villager{长老}: 那一次……我也是这样，听大家说，跟着大家投的。
: 他把投票札放回了膝前。没有人说话。
: 这是二十年来，雪葬村的寄合上，第一次有人弃权。
renji: 熊谷大吾。……裁定。
@goto ch3_confess

`
  + String.raw`

// ================= 自白 → 白蛾广播 → 章末 =================

# ch3_confess
@bgm sad
: 熊谷没有反抗。
: 他慢慢地坐了下来，坐在圈子的边上，两只手搁在膝盖上。像一头被打倒的熊。
kumagai: ……二十年前，我二十六岁。
kumagai: 我喜欢她。
kumagai: 冬木家的寡妇。仙台来的，在白峰屋帮工。笑起来的时候，眼睛弯弯的。
kumagai: 我一句话都没跟她说过。……连「喜欢」两个字的边，都没敢碰。
kumagai: 那天晚上，惣一在围炉里扯她的头发。我想拦，被他一把推开了。我就那么站着，看着。
kumagai: 第二天，寄合说是她杀了惣一。全村三十一户，都投了「有罪」。
kumagai: 我也投了。
kumagai: 然后，他们让我当送人。说我懂山，懂雪。
@flashback on
@bg okurimon
@weather blizzard
@filter cold
@bgm lament
: 二十年前的送门。风卷着雪，横着往脸上打。
: 熊谷提着灯走在前面。灯光里，一个穿白衣的女人，跟在他身后。
@show yukie[sad] C
: 走到送门前，她停了下来。
yukie: ……熊谷先生。
yukie: 我没有杀人。
@hide
: 她又说了一句什么。风很大。
: 然后，她走进了暴风雪。没有回头。
@flashback off
@bg sabakiya
@trial on
@bgm sad
kumagai: 她在送门前对我说，她没有杀人。
kumagai: 我没信。
@se heartbeat
: 角落里，霜的手指在石板的边缘上，一点一点收紧了。她低着头，谁也看不见她的脸。
: 千雪悄悄伸出手，握住了霜那只戴着手套的左手。
ritsu: ……她还说了什么？
kumagai: ……
: 熊谷咬紧了牙。他的下颌在发抖。
kumagai: 那一句……我不说。
kumagai: 那一句，是她托给我的。……我不说。
kumagai: 二十年来，我在地藏堂边上立了一尊没有名字的地藏。每天供一个饭团。
kumagai: 我告诉自己，那是给一个杀人犯的。一个杀了人、自己走进雪里的女人。
kumagai: 我送走的，是一个杀人犯。我没有做错。……我这么告诉了自己二十年。
kumagai[angry]: 然后，那本破本子念出来了。「照之前说的写」。
kumagai: 我去问桐谷。他喝得烂醉，哭着说，他删掉了指向另一个人的东西。
kumagai: 我把他按在池子里问他——是谁？那个人是谁？
kumagai: 他只会哭。「我照村长说的写了……我只是照村长说的写了……」
kumagai: 一遍，一遍，又一遍。
kumagai[dark]: ……我的手，就没有松开。
kumagai[angry]: 你们让我亲手——亲手，把一个无辜的女人送进了雪里！
kumagai: 你们投了票，回家睡觉。提着灯走到送门的，是我！
kumagai: 二十年！
: 他的吼声撞在茅草顶上，又落下来。没有人敢抬头。
kumagai[sad]: ……我想，那就再让寄合送一个人。
kumagai: 一个哑巴。来历不明。半夜一个人在浴场……就和二十年前一样。
kumagai: 你们一定会投的。我知道。因为二十年前，你们就是这么投的。
kumagai: 我想让你们……再尝一次。
: 熊谷转过头，看向角落里的霜。
: 霜也抬起头，看着他。
kumagai: ……你的眼睛……
: 他张了张嘴，像是要说什么。
: 最终，什么也没有说出来。他把脸埋进了那双大手里。
@wait 800
@bgm lament
: 真壁和两个年轻村民走过去。熊谷自己站了起来，没有让人扶。
: 经过律身边的时候，他停了一下。
kumagai: ……东京来的。
kumagai: 那个哑巴的字……写得很好看。
: 他没有回头，走出了裁屋。
sumi: ……我先去开雪牢。
sumi: 点灯，焚香。……那是宫司的规矩。
: 澄先一步往神社去了。白羽织的下摆，在门槛上轻轻一扫，就不见了。
@wait 600
: 裁屋里，人们没有散。谁也没有站起来。
: 霜还坐在圈子的正中央。千雪跪在她身边，握着她那只摘过手套、又重新戴上的左手。
: 千雪把那只手套，又轻轻地褪了下来。她用自己的两只手，捂住了那只只有三根手指的手。
chiyuki: ……很冷。
: 霜看着她。没有抽回手。
@caption 2月16日 13:40 裁屋
@se chime
@bgm judge
: 柱子上那只防灾喇叭，「滋」地响了一声。
hakuga: 三片雪，落汤池。热汤暖不了冷心。
hakuga: ……你们差一点，又把一个不会说话的人送进了雪里。
hakuga: 我没有杀他。
hakuga: 四片雪——会落在谁的面具上呢。
@se chime
@bgm stop
: 喇叭里传出一声干涩的「咔」，就再也没有声音了。
: 裁屋里，只剩下围炉里炭火的声音。
> 「又」。
> 白蛾说，「又」把一个不会说话的人送进雪里。
> 二十年前的冬木雪绘，在寄合上一句话也不肯说。——白蛾指的，是她吗？
: 霜坐在那里，一动不动。千雪捂着她的手，额头抵在她的肩上。
: 律站在圈子外面，看着那两个人。看了很久。
@trial off
@goto ch3_end

# ch3_end
@bg police_box
@filter none
@weather none
@caption 2月16日 14:20 驻在所
@bgm calm
: 午后的光已经斜了，从窗户照进来，在地板上铺开一块淡黄色的方格。
: 墙角那几只落满灰的纸箱，被搬到了桌边。麻绳解开了，扔在地上。
@show makabe[normal] C
makabe: ……七濑先生，您来了。
makabe: 请坐。我一直想打开这些箱子。父亲留下的旧档案。
makabe: 我一直不敢。可是今天在寄合上，听熊谷先生那样吼……
makabe[sad]: 我想，我父亲当年，也坐在那个裁屋里。也看着她走出送门。
makabe: 他是驻在巡查。他写了报告：「逃亡失踪，推定死亡」。
makabe: 七年以后，他在这间屋子里……
: 他没有说完。他把手按在最上面那只箱子上，像按着一个人的肩膀。
makabe: 刚才翻了一下。夹在档案中间的，有一本不像公文的东西。
makabe[think]: 皮面的。上了一把小锁。是父亲的笔迹。
ritsu: 是日记？
makabe: ……我还不知道。我还没有打开。
@show makabe[normal] C
makabe: 律君。
: 律愣了一下。真壁自己也愣了一下，随即挠了挠头，笑了。
makabe[smile]: ……对不起。我一直想这么叫您。像小夜小姐那样。
makabe: 律君。我父亲……好像留下了什么。
makabe: 等我找到了，第一个给你看。
ritsu: ……好。我等着。
@hide
: 律走出驻在所。马路对面，阿部商店的窗后，阿部文正坐在那里，一动不动地望着这边。
: 山腰上，雪见汤的白汽还在笔直地升上去，在冬天的午后慢慢散开。
> 三片雪，落了。
> 四片雪——会落在谁的面具上？
@fade out
@goto ch3_interlude

# ch3_interlude
@fade out
@bgm stop
@bg black
@wait 600
@title 雪之间|四
@bg charcoal_hut past
@filter dark
@bgm lament
@fade in
@caption 雪之间
: 左手的布，今天拆了。
: 无名指和小指，没有保住。老人用烧过的刀，把发黑的部分切掉了。我咬着一块木头，没有出声。
: 本来也出不了声。
gonzo{老人}: ……对不住。
: 他说这话的时候，没有看我。
: 晚上，他给了我一张包炭用的牛皮纸。我用剩下的三根手指捏着炭条，写了一封信。
: 写给我的女儿。
: 「千雪：
: 妈妈很好。妈妈没有做坏事。
: 等雪化了，等妈妈能说话了，妈妈就去接你。
: 要听外婆的话。要好好吃饭。睡不着的时候，就自己唱那首歌吧。第七片雪的那一段。」
: 写完，我把它折好，压在枕头底下。
: 我知道，这封信寄不出去。
: 一个「在暴风雪中逃亡失踪」的杀人嫌疑人，寄出去的信，只会把警察带到那个孩子身边。
: 只会让所有人知道——她的母亲还活着，而且是个杀人犯。
: 不如就让她以为，妈妈已经被山神带走了。
: 被山神带走的人，至少是干干净净的。
@se wind
: 半夜，我听见老人在门口咳嗽，咳了很久。
: 他的咳嗽声里，有一种我很熟悉的东西——我丈夫死前那一年，也是这样咳的。
: 我在黑暗里睁着眼睛。
: 这个世界上，救过我的人，好像都活不长。
@fade out
@filter none
@chapterend

`
  + String.raw`

// ================= 坏结局：无声之人 =================

# ch3_be_ch3
@bgm stop
# ch3_be_voiceless
ritsu: ……霜小姐写的时间，是编的。
@se heartbeat
: 话一出口，裁屋里静了一瞬。
: 霜抬起头，看着律。她的眼睛里没有愤怒，也没有惊讶。只是很安静地，看着他。
chiyuki: 七濑先生……？
ritsu: 人在一点以前就死了。一点半，不该有任何声音。
ritsu: 她为什么写下一个不存在的时刻，我还不知道。但石板上的字，已经不能当作证词了。
kumagai: 听见没有！连东京来的都这么说！
villager{长老}: 侦探都不信她了。
abe: 我早就说过，那女人写的东西信不得……
: 千雪的声音压得很低。低得几乎听不见。
chiyuki: ……七濑先生。请您收回刚才的话。
ritsu: ……
> 我收不回。推理走到这里，只剩下这一条路。
> ——那时候，我是这样以为的。
@bgm lament
renji: ……投票吧。
: 投票札一块一块落进木箱。嗒，嗒，嗒。一块也没有剩下。
: 霜没有看那只木箱。她低着头，用袖口，把石板上「我没有杀人」那一行字，一点一点地擦干净了。
: 然后，她什么也没有再写。
@se gavel
renji: 霜。……裁定。
: 她没有反抗。真壁去扶她的时候，她自己站了起来，向圈子里的人们，深深地鞠了一躬。
@trial off
@bg snow_prison
@filter cold
@weather none
@caption 2月16日 23:40 雪牢
@bgm sad
: 冰墙上的灯笼，一夜没有灭。
: 千雪跪在木格子外面，额头抵着冰冷的木头。她已经在那里跪了三个钟头。
: 格子里，霜伸出那只三根手指的手，从格子缝里，轻轻替她擦掉了眼泪。
: 然后，她在石板上写字，举到灯笼下面。
shimo{霜（石板）}: 「别哭」
shimo{霜（石板）}: 「千雪小姐　去睡吧」
chiyuki: 我不走。
: 霜看着她，看了很久。没有再写。
: 她把石板抱在胸前，靠着冰墙，闭上了眼睛。像一个哄完孩子、自己终于能歇一歇的人。
@bg okurimon
@filter cold
@weather blizzard
@caption 2月17日 5:50 送门
@bgm lament
@se wind
: 黎明前的风，卷着雪横扫过来。
: 送门的木柱上结满了冰。门外，送道伸进一片灰白，什么也看不见。
: 霜穿着白衣，赤着手。长老们让熊谷当送人——二十年前，也是他。
: 熊谷提着灯，走在她前面。灯在风里摇，他的手抖得几乎提不住。
: 走到门前，霜停了下来。她举起石板，对着熊谷，写了一行字。
shimo{霜（石板）}: 「我没有杀人」
: 熊谷看着那几个字。灯掉在了雪地上，灭了。
kumagai: ……我知道。
kumagai: 我知道。
: 他跪了下去。没有人听清他接下来在说什么。
: 霜转过身，背对着送道，把石板翻过来，在背面写了最后一行字。写得很慢。
: 她把石板放在门边的供石上。
: 然后，她走进了暴风雪。
: 没有回头。
@se wind
: 千雪挣开拉着她的手，跑到送门前。她捧起那块石板。
: 石板上写着——「千雪小姐　要幸福」。
: 「雪」字上面的四个点，连成了一道小小的波浪线，像一只飞着的蛾子。
: 千雪抱着那块石板，跪在雪里，哭了很久，很久。
: 风里，好像有人在哼一段没有词的旋律。千雪抬起头。只有风。
@bg black
@filter none
@weather none
@caption 2003年4月
@bgm sad
: 四月，雪化了。
: 县警在谷口那间废弃的炭烧小屋里，找到了白蛾留下的录音带和变声器。
: 还在草席床铺下面的地板里，找到了一本油布包着的旧日记。是二十年前住在那里的炭烧老人，黑泽权藏的。
@letter 二月十五日　在谷口雪里捡到一个女人。村里送出来的。还有气。\n\n她不说话，也说不出话。用炭条在木板上写字。\n\n三月二日　左手两根指头保不住了。\n\n四月　送她到林道。愿她活着。
: 日记里，夹着一张包炭的牛皮纸。上面是炭条写的字。
: 「千雪：妈妈很好。妈妈没有做坏事。」
: 「雪」字上面的四个点，连成一道波浪线。
> 冬木雪绘，没有死在二十年前的雪里。
> 她活了下来。左手只剩三根手指，再也说不出话。
> 十年后，她换了一个名字，回到了这个村子。守着丈夫的墓。二十年后，又守着一个不能相认的女儿。
> 她坐在那个圈子的正中央，抱着那块石板，一个字一个字地，替自己作证。
> 是我说：那些字，是编的。
: 送道的尽头，什么也没有找到。
: 春天，没有人被送回来。
@wait 1000
@poem 她第二次被这个村子送进了雪里。\n而这一次，送她的人里有我。
@ending be_ch3
`
});
