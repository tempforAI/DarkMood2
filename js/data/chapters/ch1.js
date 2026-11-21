/* 第一章「水车之雪」 —— 2003 年 2 月 13 日 ～ 14 日 */
DM.registerChapter({
  id: 'ch1',
  title: '第一章',
  name: '水车之雪',
  next: 'ch2',
  start: 'ch1_start',

  evidence: {
    ch1_body: { name: '有马的尸体', icon: 'body',
      desc: '水车小屋里，有马侧躺在唐臼边，头枕在臼口里，被落下的杵反复砸碎。穿着驼色大衣和长靴，浑身酒气。小屋里没有打斗的痕迹，稻草也没有被踢乱。' },
    ch1_kiriya: { name: '桐谷的验尸', icon: 'testimony',
      desc: '23:10 检查：体温还很高，「死后不到一小时」。死因是杵的反复撞击。手臂、手掌、指甲里都没有任何抵抗伤——「被砸的时候，已经不省人事了。」酒气很重。' },
    ch1_hairpin: { name: '红山茶发簪', icon: 'hairpin',
      desc: '松松地搁在死者摊开的右手里，并没有攥紧。是千雪的发簪——她说 19:00 去女汤时把它放在洗身处的架子上，19:35 发现不见了。' },
    ch1_tracks: { name: '雪上的脚印', icon: 'footprint',
      desc: '从村道（消雪管路面，不留痕迹）拐进水车小屋的小路上，只有一行小号的长靴印：走到小屋的屋檐下，又折回村道。边缘清晰，是雪停（22:00）以后踩的。没有别的脚印。屋檐下没有积雪，看不出有没有进门。——是千雪的靴子。' },
    ch1_snowstop: { name: '律的观察', icon: 'testimony',
      desc: '19:30 起刮起吹雪，风声很大。22:00 整，雪停了，风也停了——律在自己房间的窗边看了表。' },
    ch1_kumagai_snow: { name: '熊谷的话', icon: 'testimony',
      desc: '「吹雪的晚上，半个钟头，雪就把脚印吃干净了。没风的细雪只往脚印里撒一层糖霜，一眼看得出是雪停之前踩的还是之后。」消雪管的路面和屋檐下，什么也留不下。熊谷预报：今晚七点半起吹雪，十点前后停。' },
    ch1_thaw: { name: '莲司的话', icon: 'testimony',
      desc: '冬天水车冻住时，凸轮正好压着杠尾，唐臼的杵悬在半空。开春化冻，要用七轮在轴底下烤一个半钟头左右，冰化开了才转得动——光开闸是不转的。冬天闸门留着一道缝，水渠冰下的水不断。' },
    ch1_minato: { name: '湊的证词', icon: 'clock',
      desc: '「22:45，水车突然咚、咚地捣起来了。我看着电子表。」湊的电子表每天对着公民馆 12:00 的广播报时校准，一秒不差。在那之前，水车一直没有声音。' },
    ch1_notebook: { name: '湊的时刻本', icon: 'book',
      desc: '湊房间桌上的小本子：「20:32 千雪姐姐进了侦探哥哥的房间」「21:05 妈妈说去仓库拿酒」「21:30 去仓库找妈妈，仓库锁着，灯是黑的」「21:33 回房间」「22:00 雪停了」「22:10 千雪姐姐出来了」「22:45 水车！咚、咚」' },
    ch1_shimo_slate: { name: '霜的石板', icon: 'testimony',
      desc: '霜 22:00～22:40 在玄关扫雪，写在石板上一直没擦：「千雪小姐 22:15 出门，22:35 回来。」她写的「雪」字很特别——雨字头的四个点连成一道波浪线，像一只飞着的小蛾子。' },
    ch1_chiyuki: { name: '千雪的证词', icon: 'testimony',
      desc: '「22:15 出门，想看看母亲『杀人』的地方。站在屋檐下，小屋里黑着，没有声音，我没有进去。小屋另一边，好像有一点点红光……我以为看错了。22:35 回来，之后一直一个人在房间。」' },
    ch1_wheel: { name: '水车的冰', icon: 'ice',
      desc: '水车的轮轴底下、冻在冰里的下层叶板上，有一层新的煤黑。附近几根冰柱的尖端熔成了圆疙瘩，又重新冻住——水车底下烤过火。' },
    ch1_shichirin: { name: '冰下的七轮', icon: 'charcoal',
      desc: '下游五六米处，卡在水渠薄冰下的一只七轮（素烧小炭炉）。和熊谷一起凿开冰才捞上来。炭只烧了一半，就被水浸灭了。侧面烙着「白峰屋」三个字。' },
    ch1_shelf: { name: '厨房的七轮架', icon: 'generic',
      desc: '白峰屋厨房的七轮架上，现在只有四只七轮。霜：「晚饭用过的五只，20:55 我全都放回架上了。」20:55～21:40 霜在围炉里之间上酒，厨房里没有人，后门不上锁。' },
    ch1_cup: { name: '有马的酒杯', icon: 'cup',
      desc: '有马房间矮桌上的小酒杯和酒壶（白峰屋的）。杯底残留着一点白色的粉渣，蘸一下舔，发苦。酒壶里还剩小半壶。' },
    ch1_pills: { name: '雅的安眠药', icon: 'medicine',
      desc: '厨房茶柜上，雅的小药箱里的药瓶，贴着桐谷诊所的标签「就寝前一粒」。桐谷：本月 1 日开了三十粒，一晚一粒，到今天应该还剩十八粒左右——瓶里只剩八粒。' },
    ch1_bath_tags: { name: '女汤的入浴札', icon: 'card',
      desc: '女汤门口的札板：入浴的人挂上自己的名札，挂着的时候别人不进去。19:00 挂着千雪、小夜的名札；19:45 起换成了「清扫中」——那是女将用的札。' },
    ch1_shimo_bath: { name: '霜的话', icon: 'testimony',
      desc: '「19:40，女将说今晚女汤她自己来收拾。平时都是我收拾的。我没有进去。」——19:50 千雪来问发簪时，霜也是这样写给她看的。' },
    ch1_miyabi: { name: '雅的证词', icon: 'testimony',
      desc: '「21:00 我给有马先生送了热酒。他说想喝好一点的地酒，21:05 我就去后院的仓库里找。东西堆得乱，找了四十分钟，21:40 拿着两瓶回来。」' },
    ch1_photo: { name: '钱包里的旧照片', icon: 'photo',
      desc: '有马上衣内袋的钱包里，夹着一张旧照片：一个两岁左右、戴毛线帽的男孩。背面用钢笔写着「湊 二歳 平成六年春 有马雅」——和登记簿上女将代笔的字迹一样：「马」字最后一笔的钩，拖着长长的尾巴。' },
    ch1_boots: { name: '有马的长靴', icon: 'shoe',
      desc: '玄关鞋柜里，有马那双东京买的高级长靴不见了——穿在尸体脚上。可是雪停之后的雪地上，没有他的脚印。他是在 22:00 以前去的水车小屋。' },
    ch1_shimo_snow: { name: '霜看见的雪', icon: 'testimony',
      desc: '霜：「21:40 我进厨房洗碗的时候，女将正好拿着酒从后门进来，肩上全是雪。」——可是仓库到后门之间有屋檐连着，只有几步路。' },
    ch1_overheard: { name: '小夜听到的话', icon: 'testimony',
      desc: '20:40 小夜下楼拿点心时，看见有马凑到女将耳边说话，只听见「……钱……今晚……」。女将的脸色很难看，却还是笑着。' },
    ch1_abe_1983: { name: '阿部文的旧事', icon: 'testimony',
      desc: '二十年前惣一死的时候，怀里揣着雪绘的红山茶簪子——「那天晚上在白峰屋，当着大家的面，从她头上扯下来的」。阿部说，今天一早女将来买东西，她也跟女将讲了这件事。' }
  },

  explore: {
    ch1_day: {
      title: '2月13日·自由行动',
      mode: 'free',
      start: 'inn_hearth',
      places: ['inn_hearth', 'inn_kitchen', 'chiyuki_room', 'inn_bath', 'inn_entrance', 'village_road', 'store', 'shiramine_hall', 'shrine'],
      custom: {
        chiyuki_room: { bg: 'inn_room', name: '白峰屋·二楼（千雪的房间）', area: 'inn' }
      },
      filter: 'none',
      weather: 'snow',
      spots: {
        inn_hearth: [
          { anchor: 'irori', label: '围炉里', run: 'ch1_ds_irori' },
          { anchor: 'window', label: '窗外', run: 'ch1_ds_hearthwin' }
        ],
        inn_kitchen: [
          { anchor: 'shichirin_shelf', label: '七轮架', run: 'ch1_ds_shelf' },
          { anchor: 'medicine_box', label: '小药箱', run: 'ch1_ds_medicine' },
          { anchor: 'back_door', label: '后门', run: 'ch1_ds_backdoor' }
        ],
        chiyuki_room: [
          { anchor: 'window', label: '窗外', run: 'ch1_ds_cwindow' }
        ],
        inn_bath: [
          { anchor: 'tag_board', label: '札板', run: 'ch1_ds_tags' },
          { anchor: 'washing_area', label: '洗身处', run: 'ch1_ds_washing' },
          { anchor: 'drain', label: '排水沟', run: 'ch1_ds_drain' }
        ],
        inn_entrance: [
          { anchor: 'shoe_box', label: '鞋柜', run: 'ch1_ds_shoebox' },
          { anchor: 'coat_rack', label: '衣帽架', run: 'ch1_ds_coatrack' }
        ],
        village_road: [
          { anchor: 'nozzles', label: '消雪管', run: 'ch1_ds_nozzles' },
          { anchor: 'yukawa', label: '汤川', run: 'ch1_ds_yukawa' }
        ],
        store: [
          { anchor: 'window', label: '窗外', run: 'ch1_ds_storewin' }
        ],
        shiramine_hall: [
          { anchor: 'documents', label: '旧文书', run: 'ch1_ds_documents' }
        ],
        shrine: [
          { anchor: 'noticeboard', label: '告示板', run: 'ch1_ds_notice' },
          { anchor: 'onnazaka', label: '缓坡小路', run: 'ch1_ds_onnazaka' }
        ]
      },
      people: {
        inn_hearth: [
          { char: 'minato', run: 'ch1_dt_minato', x: 100 },
          { char: 'kiriya', run: 'ch1_dt_kiriya', x: 240 },
          { char: 'arima', run: 'ch1_dt_arima', x: 390 }
        ],
        inn_kitchen: [ { char: 'shimo', run: 'ch1_dt_shimo', x: 250 } ],
        chiyuki_room: [ { char: 'chiyuki', run: 'ch1_dt_chiyuki', x: 220 } ],
        village_road: [ { char: 'makabe', run: 'ch1_dt_makabe', x: 300 } ],
        store: [ { char: 'abe', run: 'ch1_dt_abe', x: 230 } ],
        shiramine_hall: [ { char: 'yomoda', run: 'ch1_dt_yomoda', x: 270 } ],
        shrine: [ { char: 'sumi', run: 'ch1_dt_sumi', x: 300 } ]
      },
      done: {
        need: ['flag:ch1_d_minato', 'flag:ch1_d_kiriya', 'flag:ch1_d_arima', 'flag:ch1_d_shimo',
               'flag:ch1_d_medicine', 'flag:ch1_d_chiyuki'],
        run: 'ch1_day_end',
        prompt: '快到中午了。湊说，十二点要对表。回围炉里之间吧。'
      }
    },

    ch1_inv: {
      title: '搜查开始',
      mode: 'investigate',
      start: 'watermill',
      places: ['watermill', 'village_road', 'inn_entrance', 'inn_hearth', 'inn_kitchen', 'inn_bath', 'arima_room', 'minato_room', 'chiyuki_room'],
      custom: {
        arima_room: { bg: 'inn_room', name: '白峰屋·二楼（有马的房间）', area: 'inn' },
        minato_room: { bg: 'inn_room', name: '白峰屋·二楼（湊的房间）', area: 'inn' },
        chiyuki_room: { bg: 'inn_room', name: '白峰屋·二楼（千雪的房间）', area: 'inn' }
      },
      filter: 'cold',
      weather: 'none',
      spots: {
        watermill: [
          { anchor: 'body', label: '有马的尸体', run: 'ch1_i_body' },
          { anchor: 'pestle', label: '杵', run: 'ch1_i_pestle' },
          { anchor: 'axle', label: '水车的轮轴', run: 'ch1_i_axle' },
          { anchor: 'icicles', label: '冰柱', run: 'ch1_i_icicles' },
          { anchor: 'channel', label: '下游的水渠', run: 'ch1_i_channel' },
          { anchor: 'path', label: '小路上的脚印', run: 'ch1_i_path' },
          { anchor: 'sluice', label: '水闸', run: 'ch1_i_sluice' },
          { anchor: 'iron_rack', label: '铁杵架', run: 'ch1_i_ironrack' }
        ],
        village_road: [
          { anchor: 'nozzles', label: '消雪管的路面', run: 'ch1_i_nozzles' },
          { anchor: 'shed', label: '柴棚', run: 'ch1_i_shed' }
        ],
        inn_entrance: [
          { anchor: 'shoe_box', label: '鞋柜', run: 'ch1_i_shoebox' },
          { anchor: 'register', label: '登记簿', run: 'ch1_i_register' },
          { anchor: 'doorway', label: '玄关的门', run: 'ch1_i_doorway' }
        ],
        inn_hearth: [
          { anchor: 'sake_shelf', label: '酒架', run: 'ch1_i_sakeshelf' },
          { anchor: 'irori', label: '围炉里', run: 'ch1_i_irori' }
        ],
        inn_kitchen: [
          { anchor: 'shichirin_shelf', label: '七轮架', run: 'ch1_i_shelf' },
          { anchor: 'medicine_box', label: '小药箱', run: 'ch1_i_medicine' },
          { anchor: 'back_door', label: '后门', run: 'ch1_i_backdoor' }
        ],
        inn_bath: [
          { anchor: 'tag_board', label: '札板', run: 'ch1_i_tags' },
          { anchor: 'washing_area', label: '洗身处', run: 'ch1_i_washing' },
          { anchor: 'drain', label: '排水沟', run: 'ch1_i_drain' }
        ],
        arima_room: [
          { anchor: 'low_table', label: '矮桌上的酒', run: 'ch1_i_cup' },
          { anchor: 'luggage', label: '公文包', run: 'ch1_i_briefcase' },
          { anchor: 'window', label: '窗', run: 'ch1_i_arimawin' }
        ],
        minato_room: [
          { anchor: 'low_table', label: '桌上的本子', run: 'ch1_i_notebook' },
          { anchor: 'window', label: '窗外的水车', run: 'ch1_i_minatowin' }
        ],
        chiyuki_room: [
          { anchor: 'window', label: '窗', run: 'ch1_i_cwindow' }
        ]
      },
      people: {
        watermill: [
          { char: 'kumagai', run: 'ch1_it_kumagai', x: 110 },
          { char: 'kiriya', run: 'ch1_it_kiriya', x: 400 }
        ],
        inn_entrance: [ { char: 'renji', run: 'ch1_it_renji', x: 360 } ],
        inn_hearth: [
          { char: 'minato', run: 'ch1_it_minato', x: 110 },
          { char: 'miyabi', run: 'ch1_it_miyabi', x: 250 },
          { char: 'sayo', run: 'ch1_it_sayo', x: 390 }
        ],
        inn_kitchen: [ { char: 'shimo', run: 'ch1_it_shimo', x: 250 } ],
        chiyuki_room: [
          { char: 'chiyuki', run: 'ch1_it_chiyuki', x: 200 },
          { char: 'makabe', run: 'ch1_it_makabe', x: 380 }
        ]
      },
      done: {
        need: ['ch1_body', 'ch1_kiriya', 'ch1_hairpin', 'ch1_tracks', 'ch1_snowstop', 'ch1_kumagai_snow', 'ch1_thaw',
               'ch1_minato', 'ch1_notebook', 'ch1_shimo_slate', 'ch1_chiyuki', 'ch1_wheel', 'ch1_shichirin',
               'ch1_shelf', 'ch1_cup', 'ch1_pills', 'ch1_bath_tags', 'ch1_shimo_bath', 'ch1_miyabi', 'ch1_photo'],
        run: 'ch1_inv_end',
        prompt: '该查的都查过了。天亮之后，就是寄合。结束搜查吗？'
      }
    }
  },

  games: {
    ch1_g1: {
      type: 'debate', title: '证言交锋',
      ammo: ['ch1_minato', 'ch1_tracks', 'ch1_hairpin', 'ch1_kiriya', 'ch1_snowstop'],
      lines: [
        { who: 'kumagai', expr: 'angry', text: '雪停以后，往小屋去的只有{那丫头的脚印}！' },
        { who: 'abe', expr: 'angry', text: '二十年前是发簪，今天也是发簪。她{进了小屋}，{拿杵砸死了}那个东京人！' },
        { who: 'villager', expr: 'dark', text: '杀人犯的血，是{洗不掉的}。' },
        { who: 'kiriya', expr: 'sad', text: '头是被杵砸碎的……{一下又一下}。' }
      ],
      answer: { line: 1, weak: 1, ammo: 'ch1_minato' },
      hint: '杵是什么时候开始落下来的？那个时刻，千雪小姐在哪里？',
      wrong: '……不对。这件证据和那句话对不上。'
    },
    ch1_g2: {
      type: 'debate', title: '证言交锋',
      ammo: ['ch1_thaw', 'ch1_minato', 'ch1_kumagai_snow', 'ch1_tracks', 'ch1_shimo_slate'],
      lines: [
        { who: 'kumagai', expr: 'angry', text: '那就是她{打开了水闸}！' },
        { who: 'villager', expr: 'normal', text: '冬天的水车，{开闸就转}，谁都知道。' },
        { who: 'abe', expr: 'angry', text: '她 22:35 跑回来，{等着水车转}——好狠的心肠！' }
      ],
      answer: { line: 1, weak: 0, ammo: 'ch1_thaw' },
      hint: '冻住的水车，光开闸能转起来吗？昨天早上，村长在水车小屋说过什么？',
      wrong: '……不对。要攻击的，是「水车怎么才能转起来」这一点。'
    },
    ch1_g3: {
      type: 'logic', title: '推理回廊',
      questions: [
        { q: '冻住的水车，要在轴底下烤多久才转得动？', opts: ['十分钟左右', '一个半钟头左右', '一整夜'], a: 1 },
        { q: '水车 22:45 开始转。那么，火是几点前后放下去的？', opts: ['22:15 前后', '21:15 前后', '20:00 前后'], a: 1 },
        { q: '那个时候，外面在下什么样的雪？', opts: ['没风的细雪，脚印会留下来', '吹雪，半个钟头就把脚印吃干净', '雪已经停了'], a: 1 },
        { q: '那个时候，千雪小姐在哪里？', opts: ['律的房间（湊的时刻本 20:32～22:10）', '一个人在自己的房间', '在女汤'], a: 0 },
        { q: '有马自己的脚印呢？', opts: ['和千雪的脚印叠在一起', '雪停以后没有——他是 22:00 以前去的', '被千雪踩掉了'], a: 1 },
        { q: '结论是？', opts: ['千雪 22:15 到小屋时，一切早已布置好；她看见的红光就是火', '千雪 22:15 点了火，22:35 跑回旅馆', '水车是自己化冻的'], a: 0 }
      ],
      hint: '从 22:45 往回倒推一个半钟头。那时候的雪，和那时候千雪小姐的行踪，都有人看着。'
    },
    ch1_g4: {
      type: 'present',
      prompt: '放在冻住的水车底下、烤了一个多钟头的热源，是——',
      answer: 'ch1_shichirin',
      hint: '下游的水渠里，冰底下卡着什么东西？'
    },
    ch1_g5: {
      type: 'pick',
      prompt: '19:45 以后，能在女汤捡到千雪小姐发簪的人是——',
      options: ['sayo', 'shimo', 'miyabi', 'sumi'],
      answer: 'miyabi',
      hint: '19:45 以后，女汤门口挂着谁的札？平时收拾女汤的人，那天晚上为什么没有进去？'
    },
    ch1_g6: {
      type: 'rebuttal', who: 'miyabi',
      blades: ['21:30 仓库锁着，灯是黑的', '七轮是 20:55 以后被拿走的', '雪是 22:00 停的'],
      lines: [
        { expr: 'smile', text: '发簪？我收拾的时候{什么都没看见}。' },
        { expr: 'normal', text: '九点过后我{一直在仓库}找地酒，四十分钟才回来。' },
        { expr: 'smile', text: '我和有马先生{只是}生意上的往来。' }
      ],
      answer: { line: 1, weak: 0, blade: 0 },
      hint: '九点半，有人去仓库找过女将。那个人把看到的东西记了下来。',
      wrong: '……刀刃偏了。她的话里，哪一句有人亲眼看过反面？'
    },
    ch1_g7: {
      type: 'present',
      prompt: '能证明女将与有马之间，不只是「生意上的往来」的证据是——',
      answer: 'ch1_photo',
      hint: '有马的钱包里，夹着一样不该出现在生意人身上的东西。背面的字，是谁写的？'
    },
    ch1_g8: {
      type: 'keyword',
      prompt: '让一个大男人乖乖枕在臼口下、被砸也不挣扎的，是溶在酒里的——',
      answer: '安眠药',
      decoys: '酒毒糖盐粉睡',
      hint: '有马的酒杯底下，残留着什么？桐谷医生说，他身上为什么没有抵抗伤？'
    },
    ch1_g9: {
      type: 'debate', title: '证言交锋',
      ammo: ['ch1_pills', 'ch1_cup', 'ch1_kiriya', 'ch1_shelf'],
      lines: [
        { who: 'miyabi', expr: 'normal', text: '安眠药谁都可以{从镇上带来}。' },
        { who: 'miyabi', expr: 'smile', text: '我的药？我{每晚只吃一粒}。' },
        { who: 'kiriya', expr: 'sad', text: '我……确实给女将{开过药}……' }
      ],
      answer: { line: 1, weak: 0, ammo: 'ch1_pills' },
      hint: '桐谷医生这个月初开了多少粒？一晚一粒的话，到今天该剩多少？',
      wrong: '……不对。数一数，哪句话和瓶子里的数字对不上。'
    },
    ch1_g10: {
      type: 'reconstruct', title: '真相重演',
      panels: [
        { text: '19:45，凶手挂上「清扫中」的札进了女汤，捡到了【？】。', opts: ['有马的钱包', '千雪的发簪', '一只七轮'], a: 1 },
        { text: '21:00，凶手给有马送去掺了【？】的热酒，低声约他九点二十分去水车小屋。', opts: ['毒药', '烈酒', '安眠药'], a: 2 },
        { text: '21:05，凶手以【？】为借口，从无人的厨房提走一只装满红炭的七轮，出了后门。', opts: ['去仓库拿酒', '去女汤收拾', '去送客人'], a: 0 },
        { text: '药效发作，昏睡的有马被拖到唐臼边，头枕在臼口——正对着【？】。', opts: ['冻住的水车', '悬在半空的杵', '屋檐的冰柱'], a: 1 },
        { text: '21:30，七轮被放在【？】，添满了炭。吹雪很快抹掉了来回的脚印。', opts: ['冻住的轮轴底下', '唐臼旁边', '小屋门口'], a: 0 },
        { text: '21:42，凶手拿着两瓶地酒回到【？】，此后一直在众人眼前。22:00，雪停。', opts: ['自己的房间', '围炉里之间', '仓库'], a: 1 },
        { text: '22:45，冰化开，杵落下。七轮被叶板刮进水槽，【？】。', opts: ['被冲到下游的冰下', '烧成了灰', '被凶手拿了回来'], a: 0 }
      ]
    },
    ch1_g11: {
      type: 'vote',
      options: ['chiyuki', 'miyabi', 'shimo', 'kumagai', 'renji'],
      answer: 'miyabi'
    }
  },

  script: String.raw`
# ch1_start
@bg black
@bgm stop
@weather none
@filter none
@title 第一章|水车之雪
@wait 400
@bg inn_hearth
@bgm village
@caption 2月13日 07:30 白峰屋·围炉里之间
: 雪在天亮前停了一阵，又细细地下了起来。
: 早饭摆在地炉边。味噌汤、烤咸鱼、一碟腌野泽菜。谁也没怎么动筷子。
: 昨晚那个声音，像一层看不见的霜，落在每一只碗里。
renji: ……早。
@show renji[normal] C
: 莲司的眼睛比昨天更红了。他手里捏着一支没点的七星，在指间转来转去。
renji[normal]: 真壁君一早就去桥头了。熊谷先生也去了。
renji[normal]: 七濑先生……要是可以的话，也去看一看吧。白天看得清楚些。
renji[sad]: 我……一会儿要去离屋，跟父亲说话。
: 他说「说话」两个字的时候，像是咽下了什么苦的东西。
@hide
@show sayo[smile] C
sayo[smile]: 律君，我陪你去～
sayo[normal]: 千雪小姐说她想再睡一会儿。……昨天晚上，她房间的灯一直亮着。
@hide
> 二十年前的事，昨晚的广播，裁屋里的古法。
> 先从能看见的东西开始。

@bg bridge cut
@weather snow
@filter none
@bgm snow
@caption 08:10 白蛾桥·村侧桥头
@se wind
: 白天的断桥，比夜里看起来更荒凉。
: 断掉的主索垂在雪地上，结了一层薄冰。桥面挂在对岸，一直垂进谷底的白雾里，几块木板已经掉了下去。
: 真壁和熊谷站在桥头。熊谷正弯着腰，盯着雪地看。
@show makabe[normal] C
makabe[normal]: 七濑先生，早！
makabe[normal]: 我和熊谷先生沿着谷边看了一圈。想确认一下，有没有人从外面爬上来，或者从这边下去。
@hide
@show kumagai[normal] C
kumagai[normal]: 没有。
kumagai[normal]: 谷边的雪齐着膝盖，平平整整，一个窟窿都没有。兔子倒是来过几只。
kumagai[normal]: 昨晚剪桥的家伙，没从这边下谷，也没从谷里上来。
kumagai[dark]: 剪完，就回村里去了。走的是村道。
ritsu: 村道上留不下脚印。
kumagai[normal]: 哼，你倒是知道。消雪管。
: 熊谷蹲下来，用戴着皮手套的手指，指着雪面上两串小小的爪印。
kumagai[normal]: 东京来的，过来看。
kumagai[normal]: 这一串，边上软塌塌的，里头积着一层雪。半夜细雪下着的时候踩的。
kumagai[normal]: 这一串，边上跟刀切的一样，底下干干净净。天亮雪停那一阵踩的。
: 两串爪印并排着，一串像被糖霜盖过，一串清清楚楚。
kumagai[normal]: 东京来的，记住了：吹雪的晚上，半个钟头，雪就把脚印吃干净了。
kumagai[normal]: 可没风的细雪不一样——它只往脚印里撒一层糖霜。
kumagai[normal]: 你一眼就看得出，那是雪停之前踩的，还是之后踩的。
kumagai[normal]: 还有，消雪管的路面、屋檐底下，什么都留不下。你在那上面跳舞都没人知道。
@get ch1_kumagai_snow
: 他直起腰，眯着眼睛看了看灰色的天。云压得很低，西边的山脊上，一道一道的云像被梳过。
kumagai[normal]: 今晚七点半以后起吹雪。十点前后停。
sayo[surprise]: 连几点都知道？
kumagai[angry]: 我在这山里活了四十六年！
kumagai[normal]: 风从西边山脊上下来的时候，就是这样。错不了。
@hide
: 律走到锚碇边，又蹲了下来。
: 白天的光下，那些断口看得更清楚了。一部分钢丝的断口里，嵌着黄白色的稻草纤维；另一部分干干净净，闪着新铁的光。
> 稻草，只在一部分断口里。
> 如果是一口气剪断的，不该是这样。
: 律看了一会儿，站起身来，什么也没有说。
makabe[normal]: 七濑先生？
ritsu: ……没什么。
makabe[normal]: 录音机和磁带，我锁在驻在所的柜子里了。钥匙在我身上。
makabe[angry]: 无线电没了电池，什么也干不了……我真是个没用的巡查。
ritsu: 至少，你没有被吓住。
makabe[smile]: ……是！
@hide

@bg watermill
@weather snow
@bgm village
@caption 08:50 水车小屋
: 回村的路上，莲司和湊在村道边等着他们。
@show renji[normal] C
renji[normal]: 父亲那边……说完了。
renji[normal]: 湊说想带侦探哥哥看水车。……顺路，我也一起。
@hide
: 水车小屋在村道边的一条岔路尽头，离白峰屋不过百来步。一条灌溉的水渠从山上引下来，从小屋旁边流过。
: 水车整个被冻住了。
: 一人多高的木轮子上挂满了冰柱，长的短的，一根挨着一根，像一圈獠牙。轮子下半截冻在水槽的冰里，纹丝不动。
@show minato[normal] C
minato[normal]: 冬天就是这样。十二月冻上，四月才化。
minato[normal]: 从我房间的窗户，正好看得见水车。每天早上起来，我都先看一眼。
minato[normal]: 今天也没有动。
@hide
: 小屋的门没有锁。莲司推开门，一股陈年稻草和米糠的气味。
: 屋里靠墙放着一架唐臼——地上嵌着一只石臼，一根长长的木杠横架在支点上，一头装着沉甸甸的木杵，另一头伸到墙边。
: 墙那边，是水车的轴。轴上装着一块凸起的木头。
: 那根杵，悬在半空。离石臼一尺多高，一动不动。
sayo[surprise]: 杵……停在半空中？
renji[normal]: 水车转起来的时候，轴上的凸轮一下一下地压那根杠子的尾巴，杵就抬起来、落下去。
renji[normal]: 冻住的那一刻，凸轮刚好压着杠尾。所以杵就停在上面了。一冬天都这样。
renji[normal]: 底下站人可危险。哪天冰一化，「咚」的一声……
: 他没有说下去。
ritsu: 化冻的时候，怎么办？
renji[normal]: 开春的时候，我们用七轮在轴底下烤。旅馆的那种小炭炉，装满炭，放在冻住的轴和叶板底下。
renji[normal]: 冬天冻成这样，要烤一个半钟头才转得动。光开闸是不行的，冰咬着轮子，水推不动它。
renji[normal]: 闸门冬天也留着一道缝，让水一直流。水一停，水渠就冻死了，开春更麻烦。
@get ch1_thaw
: 律走到小屋外面，看了看水渠。水车下游的水渠上盖着一层薄冰，冰底下，隐约能看见水在流动。
: 唐臼旁边的墙上，有一只铁架。架上横放着一根黑黢黢的铁杵，比木杵细，比手臂长。
renji[normal]: 那根是敲冰用的。备着，冬天水槽冻住了，就用它敲开。
renji[sad]: ……二十年前，就是……
: 莲司把烟从口袋里掏出来，又塞了回去。
@show minato[normal] C
minato[normal]: 一片雪，落水车。杵声捣到天明时。
: 湊站在冻住的水车前面，小声地念了一句。
minato[normal]: 学校里……镇上的学校里，没有人会唱这个。只有村里的老人会。
minato[think]: 侦探哥哥，你知道「捣到天明」是什么意思吗？
ritsu: 一直捣，捣到天亮。
minato[normal]: 嗯。可是水车冻住了。冻住的水车，捣不了。
minato[normal]: 所以这首歌，是春天的歌。
@hide
: 雪落在冰柱上，落在冻住的水槽上，落在那根悬在半空的杵上。
: 一点声音也没有。
renji[normal]: ……回去吧。湊，作业。
minato[normal]: 08:59。还有一分钟才九点。
renji[smile]: ……好好，还有一分钟。
@caption 09:10 白峰屋
: 回到白峰屋，太阳从云缝里露了一下脸，又缩了回去。
> 中午之前，在村里走走吧。
> 桥断了，人走不了。可是人总要吃饭、喝茶、说话。说话的时候，就会露出一点什么。
@explore ch1_day

# ch1_ds_irori
: 地炉里的火压得很小，几块炭在灰里红着。早上的鱼骨头还插在灰边。
: 晚上，这里会坐满喝酒的人。
@return

# ch1_ds_hearthwin
: 窗外是白峰屋的后院。雪地上有一溜屋檐，从厨房后门一直连到一座矮矮的土墙仓库。
> 仓库。好一点的地酒放在那里，莲司先生说过。
@return

# ch1_ds_shelf
: 厨房墙边有一只木架。架上整整齐齐摆着五只七轮——素烧的小炭炉，圆筒形，比脸盆小一圈。
: 每一只的侧面，都烙着「白峰屋」三个字。
@if ch1_d_shimo -> ch1_ds_shelf2
> 莲司先生说，开春化冻的时候，用的就是这种七轮。
@return

# ch1_ds_shelf2
> 五只。晚上烤鱼用。霜小姐在石板上写的。
@return

# ch1_ds_medicine
: 茶柜的隔板上放着一只黑漆的小药箱，盖子半开着。里面有一只棕色的小药瓶，贴着诊所的标签。
miyabi: 啊，那个……
@show miyabi[smile] C
: 雅正好端着茶盘进来。她笑着把药箱的盖子合上了。
miyabi[smile]: 让您见笑了。睡不着的职业病。
miyabi[smile]: 当女将的，夜里一点动静都会醒。客人叫一声，就得爬起来。久了，不吃药就睡不着了。
miyabi[normal]: 桐谷先生开的。很轻的那种，不碍事的。
: 她把药箱往茶柜里面推了推。笑容和昨天一模一样，一分也没有变。
@hide
@set ch1_d_medicine
@return

# ch1_ds_backdoor
: 厨房的后门开在灶台旁边，门闩只是一根木棍，没有锁。
: 推开一条缝往外看：一溜屋檐从后门一直连到几步外的土墙仓库，屋檐底下的地面干干的，没有一点雪。
: 仓库的木门上挂着一把老式的铜挂锁。
> 仓库的钥匙，大概在女将手里。
@return

# ch1_ds_cwindow
: 窗外是村道。湿漉漉的路面冒着白气，一个人影也没有。
> 千雪小姐的房间，看不见水车。湊君的房间，在走廊另一头。
@return

# ch1_ds_tags
: 女汤门口的墙上钉着一块札板，上面一排小钉子。旁边的篮子里放着一叠木札，用墨写着「女将」「霜」「客」，还有一块写着「清扫中」。
miyabi: 进去的人，把自己的札挂上。挂着札的时候，别人就不进去了。
miyabi: 打扫的时候挂「清扫中」。平时晚上是霜收拾，偶尔我也会。
> 小旅馆的规矩。谁在里面，看札板就知道。
@return

# ch1_ds_washing
: 洗身处的墙边有一排小木架，放着木桶和肥皂。架子的边缘被水泡得发黑，有一点倾斜。
> 放在上面的小东西，大概很容易滑下去。
@return

# ch1_ds_drain
: 洗身处的地面略微倾斜，一直斜向墙脚的排水沟。沟上盖着木条格子，格子和瓷砖之间有一道指头宽的缝。
@return

# ch1_ds_shoebox
: 玄关的鞋柜里塞满了长靴和木屐。村里人的胶皮长靴，一双双都差不多。
: 最上面一格放着一双不一样的：黑色的皮长靴，鞋帮上钉着一块金色的小牌子，擦得锃亮。
> 有马先生的吧。东京买的高级货，在这个村子里格外显眼。
@return

# ch1_ds_coatrack
: 衣帽架上挂满了棉袄、帽子和围巾。律的灰围巾也挂在上面，夹在一件猎人的毛领外套和一顶毛线帽中间。
> 谁的东西都挂在这里。谁都能拿。
@return

# ch1_ds_nozzles
: 村道的消雪管一刻不停地喷着温水。路面黑亮，雪片一落上去就化了。
> 熊谷先生说，在这上面跳舞都没人知道。
@return

# ch1_ds_yukawa
: 汤川在雪墙外冒着白气，哗哗地流。水面上一片雪也没有。
@return

# ch1_ds_storewin
: 店窗外，马路对面的驻在所亮着灯。真壁不在，门虚掩着。
abe: 去桥头了。一大早就跑出去，跑回来，又跑出去。年轻人，就是有力气。
@return

# ch1_ds_documents
: 矮桌上摊着一册发黄的账本，旁边的笔记本上，四方田用很小的字抄着什么：「昭和五十八年二月十四日　寄合」——下面是空白。
> 二十年前寄合的那一天。只写了日期。
@return

# ch1_ds_notice
: 神社石阶下的告示板上，贴着一张用毛笔写的告示，墨迹还很新。
: 「雪送祭　二月十四日　十七时于白峰屋前集合　雪橇两架　雪灯笼三十盏　人偶一体」
> 字很漂亮。写在一张又白又厚的纸上。
@return

# ch1_ds_onnazaka
: 石阶旁边，社务所的后面，另有一条绕着山坡慢慢往上的小路，路边钉着几根扶手桩。
sumi: 那是女坂。……老人们走不动男坂的石阶，都走这一边。
@return

# ch1_dt_minato
@if ch1_d_minato -> ch1_dt_minato2
@show minato[normal] C
: 湊坐在地炉边，膝盖上摊着那个小本子，一笔一画地写着什么。
ritsu: 在写什么？
minato[normal]: 时刻本。
: 他把本子转过来给律看。一页一页，密密麻麻，全是时间。
: 「07:02 起床」「07:30 早饭」「08:05 侦探哥哥去桥」「08:50 水车（没动）」「09:10 回来」……
minato[normal]: 发生了什么，就写下来。几点几分，在哪里，谁。
minato[normal]: 妈妈说，这是好习惯。
ritsu: 你的表准吗？
minato[smile]: 一秒都不差。每天中午十二点，对着公民馆的报时校准。
minato[normal]: 今天还没对。十二点要回来对。
minato[normal]: 我的房间在二楼最里面。窗户对着水车，晚上睡觉前也看一眼。
: 他忽然压低了声音。
minato[normal]: ……侦探哥哥。那个叔叔，什么时候走？
ritsu: 有马先生？
minato[normal]: 嗯。
minato[normal]: 他来了以后，妈妈晚上，吃两次药。
: 湊说完，又低下头去写本子，不说话了。
@hide
@set ch1_d_minato
@note minato 随身带「时刻本」，几点几分发生了什么都记下来。房间在二楼最里面，窗户对着水车。害怕有马：「他来了以后，妈妈晚上吃两次药。」
@return

# ch1_dt_minato2
minato[normal]: 十二点要对表。……还有多久？
ritsu: 自己看。
minato[smile]: ……嗯。我不猜时间。
@return

# ch1_dt_kiriya
@if ch1_d_kiriya -> ch1_dt_kiriya2
: 桐谷又坐在地炉边了。一大早，面前就摆着一只酒壶。
: 雅端着茶走过来，在他身边放下一杯。
@show kiriya[normal] L
@show miyabi[smile] R
miyabi[smile]: 桐谷先生，一大早就喝，对身体不好哦。
kiriya[smile]: 医生不喝酒，病人就不敢来看病了。哈哈……
kiriya[normal]: 倒是女将你，药别吃太多。
kiriya[normal]: 这月初给你开了三十粒。一晚一粒，吃完了再来拿。别自己多吃。
miyabi[smile]: 知道了，桐谷先生。我心里有数。
: 雅笑着点了点头，端着茶盘走开了。
kiriya[sad]: ……城里来的人，到了山里，都睡不着。
kiriya[sad]: 我刚来的时候也是。后来就靠这个了。
: 他晃了晃手里的酒壶。
@hide
@set ch1_d_kiriya
@note kiriya 对雅说：「这月初给你开了三十粒（安眠药），一晚一粒。」
@return

# ch1_dt_kiriya2
kiriya[smile]: 侦探先生，喝一杯？……不喝？年轻人，没意思。
@return

# ch1_dt_arima
@if ch1_d_arima -> ch1_dt_arima2
@show arima[normal] C
: 有马靠在窗边，手里转着一只金色的打火机。他没有点烟，眼睛盯着地炉另一边的湊。
arima[normal]: ……这孩子。
arima[smile]: 长得真像一个人。
@se glass
: 茶碗翻倒的声音。雅跪在地炉边，正在给客人倒茶，茶水洒了一托盘。
miyabi: ……失礼了。手滑了。
: 她低着头擦着托盘。擦了很久。
: 有马看着她，嘴角挑了一下。然后，他转向了律。
arima[smile]: 名侦探先生。昨晚那出戏，看得过瘾吧？
arima[smile]: 白蛾、古法、寄合。哈哈，二十一世纪了，还有人信这个。
arima[normal]: 我跟你说，这种村子，卖了才是救它。
arima[normal]: 山卖给我，建度假村。老人拿了钱下山去养老，年轻人回来上班。谁都不吃亏。
arima[dark]: 守着一座破山，守着一首破歌，守着二十年前送死人的规矩——那才是要命。
ritsu: 村里的人，好像不这么想。
arima[smile]: 他们会想通的。人嘛，只要价钱合适。
@hide
@set ch1_d_arima
@note arima 盯着湊说「这孩子……长得真像一个人」，雅当场打翻了茶。「这种村子，卖了才是救它。」
@return

# ch1_dt_arima2
arima[smile]: 名侦探先生，晚上一起喝一杯？我请客。……在这种地方，钱也没地方花。
@return

# ch1_dt_shimo
@if ch1_d_shimo -> ch1_dt_shimo2
: 厨房里，霜正在灶台前切萝卜。小夜扒在门框上，眼睛亮晶晶的。
@show sayo[smile] L
@show shimo[normal] R
sayo[smile]: 霜小姐～我在柜子里看到年糕了！可以烤一块吗？就一块！
: 霜放下菜刀，看了看小夜，又看了看墙边那排七轮。她取下石板，写了几个字。
shimo: （石板）七轮　五个　晚上烤鱼用
sayo[smile]: 那用一个嘛～就一个～
: 霜摇了摇头，又写了一行。
shimo: （石板）晚上要全部用。洗好晾干了。用灶。
sayo[sad]: 唔……
: 霜擦掉石板，指了指灶台。她把一张铁网架在灶口上，从柜子里取出两块年糕，放了上去。
sayo[smile]: 哇～霜小姐最好了！
: 年糕慢慢地鼓了起来。霜用筷子翻了一面，又在石板上写了一行，举给律看。
shimo: （石板）今晚　雪大。少出门。
: 律看着那块石板。
> 她写的「雪」字很特别。雨字头的四个点，没有分开写，而是连成了一道弯弯的波浪线。
> 像一只小小的蛾子，正在飞。
: 霜注意到律的视线，把石板放低了一点。左手的毛线手套轻轻按在石板边上。
sayo[smile]: 好香～律君，分你一半？
ritsu: 你自己吃吧。
@hide
@set ch1_d_shimo
@note shimo 用石板写字。厨房的七轮一共五只，「晚上烤鱼用」。她写的「雪」字，雨字头的四点连成一道波浪线，像一只飞着的小蛾子。左手总戴着毛线手套。
@return

# ch1_dt_shimo2
: 霜在洗碗。看见律，她点了点头，在石板上写：
shimo: （石板）年糕　还有。
@return

# ch1_dt_chiyuki
@if ch1_d_chiyuki -> ch1_dt_chiyuki2
: 千雪的房间门开着。小夜不知什么时候已经溜了进来，两个人隔着矮桌坐着。
@show chiyuki[normal] L
@show sayo[smile] R
sayo[smile]: 律君～你来得正好。千雪小姐在给我看宝贝哦。
: 矮桌上放着那支红山茶的发簪。漆过的木簪，簪头是一朵用红色珐琅做的山茶花，花瓣边缘有一点磨损。
chiyuki[normal]: 外婆给的。
chiyuki[normal]: 我十八岁那年，外婆从柜子最里面拿出来，说：「你妈妈最喜欢山茶。」
chiyuki[sad]: 就只说了这一句。
sayo[smile]: 好漂亮。很配千雪小姐哦。
chiyuki[smile]: ……谢谢。
: 千雪把发簪拿起来，对着窗外的光看了看，又插回了发间。
chiyuki[normal]: 早上……我本来想去水车小屋看看的。
chiyuki[sad]: 走到楼梯口，又回来了。
chiyuki[sad]: 我怕看见那个地方，就会相信报纸上写的东西。
sayo[normal]: 那就晚一点再去。不急的。
sayo[smile]: 对了，晚上一起去泡澡吧？旅馆里的女汤。听说是温泉水引下来的哦～
chiyuki[normal]: ……嗯。好。
@hide
@set ch1_d_chiyuki
@note chiyuki 红山茶发簪是外婆给的：「你妈妈最喜欢山茶。」早上想去水车小屋，走到楼梯口又回来了。和小夜约好晚上去女汤。
@return

# ch1_dt_chiyuki2
chiyuki[normal]: 七濑先生。
chiyuki[normal]: 我母亲……真的会拿铁杵砸死人吗。
chiyuki[sad]: ……对不起。我知道您回答不了。
@return

# ch1_dt_makabe
@if ch1_d_makabe -> ch1_dt_makabe2
@show makabe[normal] C
makabe[normal]: 七濑先生！我在挨家挨户问。昨天下午到晚上，有没有人看见谁去了桥头。
makabe[sad]: 没有。这么大的雪，谁也不出门。
makabe[normal]: 阿部婆婆说，她昨天中午看见宫司大人来驻在所送祭典的日程表。我那时候在白峰屋吃饭……
makabe[think]: 日程表倒是放在桌上了。宫司大人说，她敲了门，没人应，就放下走了。
makabe[normal]: 那时候屋里还好好的，她说。
@hide
@set ch1_d_makabe
@return

# ch1_dt_makabe2
makabe[normal]: 我再去问问后山那几户。一定有人看见了什么！
@return

# ch1_dt_abe
@if ch1_d_abe -> ch1_dt_abe2
@show abe[normal] C
abe[normal]: ……侦探小哥。
abe[normal]: 昨晚的事……我那一嗓子，是喊得大了点。
abe[normal]: 可我又没说错。那丫头，就是雪绘的女儿。那双眼睛，那个簪子——
abe[normal]: 跟她妈一模一样的红山茶。
ritsu: 二十年前，雪绘小姐也戴着一样的簪子？
abe[smile]: 戴着呢，天天戴。外来的女人，就是爱打扮。
abe[normal]: 那天晚上在白峰屋，惣一少爷喝醉了，当着大家的面拉扯她，把那支簪子从她头上扯下来，揣进了自己怀里。
abe[normal]: 「想要就来拿」，少爷是这么说的。我就在旁边，听得清清楚楚。
abe[dark]: 后来少爷死在水车小屋里，那支簪子还在他怀里揣着。
abe[normal]: ……今天一大早，女将来买针线，我也跟她讲了。
abe[smile]: 她听得可仔细了。东京来的人，就爱听这种事。
@hide
@get ch1_abe_1983
@set ch1_d_abe
@return

# ch1_dt_abe2
abe[normal]: 还有事？……昨晚那么一闹，今天一上午没人来买东西。都躲在家里呢。
@return

# ch1_dt_yomoda
@if ch1_d_yomoda -> ch1_dt_yomoda2
@show yomoda[normal] C
yomoda[normal]: 七濑君。昨晚……真是吓人的一夜。
yomoda[normal]: 不过，从民俗学的角度来说，「古法的复活」，这可是可遇不可求的——
yomoda[sad]: ……失礼。这种时候，不该这么说。
yomoda[normal]: 老村长的文书里，寄合的记录一直记到昭和五十年代。谁提议，谁投票，结果如何，都写得清清楚楚。
yomoda[think]: 可是听说有一本昭和五十八年的寄合记录本……我翻遍了这里，还没找到。
yomoda[normal]: 偏偏是那一年的，不见了。
: 他推了推圆眼镜，镜片后面的眼睛，看不出在想什么。
@hide
@set ch1_d_yomoda
@return

# ch1_dt_yomoda2
yomoda[smile]: 雪送祭的时候，我给你们讲解。人偶怎么扎、为什么要用雪橇，都有讲究的。
@return

# ch1_dt_sumi
@if ch1_d_sumi -> ch1_dt_sumi2
: 石阶下，澄站在鸟居前，双手合十，面朝断桥的方向，低声念着什么。
: 念完，她才转过身来。
@show sumi[normal] C
sumi[normal]: ……七濑先生。
sumi[normal]: 在为桥祈祷。……昨天才换了新的注连绳，却……
sumi[sad]: 是我的祓除，不够诚心吧。
ritsu: 雪送祭，还要办吗？
sumi[normal]: ……办的。
sumi[normal]: 越是这种时候，村里的人越需要祭典。……老村长也是这么说的。
sumi[normal]: 明天傍晚五点，在白峰屋门前集合。……请一定来。
: 她向律行了一礼。白羽织的下摆，在雪地上拖出一道浅浅的痕迹。
@hide
@set ch1_d_sumi
@return

# ch1_dt_sumi2
sumi[normal]: ……冬天的黄昏，雪地上会有白色的小蛾子飞。
sumi[normal]: 村里的人说，那是白蛾大人的使者。
@return

# ch1_day_end
@bg inn_hearth
@filter none
@bgm village
@caption 12:00 白峰屋·围炉里之间
@se chime
: 窗外的喇叭里，响起了中午的报时旋律。
@show minato[smile] C
minato[smile]: 12:00:00。
minato[smile]: 一秒都不差。
@hide
: 午饭是热腾腾的荞麦面。真壁照例来白峰屋吃饭，一边吸面一边说着上午问了哪几户人家。
: 熊谷也来了。他端着大碗，坐在门边，嗓门大得整个屋子都听得见。
kumagai: 今晚七点半起吹雪！十点前后停！晚上谁都别出门，出了门回不来，别怪山神！
: 雅给他添了一碗面，笑着说：「熊谷先生的天气，从来没有不准的。」
: 律吃完面，看了看窗外。雪还是细细的，没有风。
> 吹雪，七点半到十点。
> 熊谷先生说的话，这屋里的每一个人都听见了。
@freetime 2
@goto ch1_afternoon

# ch1_afternoon
@bg inn_entrance
@bgm mystery
@filter none
@caption 16:30 白峰屋·玄关旁的走廊
: 傍晚，律从二楼下来，想去围炉里之间喝杯茶。
: 走到楼梯拐角，他停住了。
: 走廊尽头，湊贴着墙站着，一动不动。他的脸白得像纸，眼睛直直地看着前面。
arima{男人的声音}: ……你以为躲到这种山沟里，我就找不到了？
miyabi{女人的声音}: ……请放手。孩子在看。
arima{男人的声音}: 看就看。他也该知道——
: 律走下最后一级台阶，故意踩得很响。
@se footsteps
: 走廊拐角的阴影里，有马松开了手。雅退后一步，用另一只手握住了自己的手腕。
@show arima[smile] C
arima[smile]: 哟，名侦探先生。偷听可不是好习惯。
arima[smile]: 我跟女将谈谈房钱的事。……生意上的事。
: 他整了整大衣的领子，从律身边走过，上楼去了。
@hide
@show miyabi[smile] C
miyabi[smile]: ……让您见笑了。有马先生喝多了。
: 她的笑容一点也没有乱。只有握着手腕的那只手，指节白得发青。
: 袖口滑下去一点，露出手腕上几道红红的指印。
miyabi[normal]: 湊。回房间去写作业。
minato: ……16:32。
: 湊小声地说了一句，转身跑上了楼梯。他没有拿出本子来写。
@hide
> 「你以为躲到这种山沟里，我就找不到了」。
> 生意上的事，会这么说吗。

@bg inn_hearth
@bgm village
@caption 18:40 白峰屋·围炉里之间
: 天黑以后，风还没有起来。窗外的雪依然细细的、直直的。
@show sayo[smile] L
@show chiyuki[normal] R
sayo[smile]: 律君，我们七点去泡澡～
sayo[smile]: 女汤哦，不许偷看。
ritsu: 谁要看。
chiyuki[smile]: ……
: 千雪笑了。今天她第一次笑出声。
sayo[normal]: 霜小姐说，女汤门口有块札板，进去的时候要挂名札。我已经学会了～
@hide
@caption 19:00 白峰屋
: 七点，两个人拿着毛巾，沿着走廊往女汤去了。霜跟在后面，替她们把名札挂上了札板。

@bg village_road
@weather blizzard
@filter night
@bgm tension
@caption 19:30 村道
@se wind
: 七点半。
: 像是有人在山脊上推开了一扇门。风一下子从西边扑了下来。
: 雪不再是直直地落，而是横着飞。路灯的光里，白茫茫一片，三步之外什么也看不见。
: 消雪管的路面上，雪一落就化，化了又被风卷起来，打在雪墙上，沙沙作响。
> 吹雪。
> 熊谷先生说得一分不差。

@bg inn_hearth
@weather blizzard
@filter none
@bgm village
@caption 19:35 白峰屋·围炉里之间
: 窗纸被风吹得一鼓一鼓的。地炉里的火苗跟着一歪一歪。
: 小夜和千雪泡完澡回来了，头发还湿着，脸颊红红的。
: 千雪在地炉边坐下，习惯性地抬手去摸头发。
: 手停住了。
@show chiyuki[surprise] C
chiyuki[surprise]: ……发簪。
chiyuki[shock]: 发簪不见了。
sayo[surprise]: 诶？
chiyuki[shock]: 泡澡之前，我摘下来，放在洗身处的架子上……出来的时候，忘了拿……
sayo[normal]: 那就还在女汤呀。我陪你回去找！
@hide
: 两个人匆匆回了女汤。过了十几分钟，又回来了。千雪的脸色发白。
sayo[sad]: ……架子上没有。地上也找了，没找到。
@caption 19:50 白峰屋
: 霜端着一摞碗从厨房出来。千雪拦住了她。
chiyuki[sad]: 霜小姐……我的发簪，落在女汤里了。红山茶的那支。
chiyuki[sad]: 您收拾的时候，能帮我看一看吗？
: 霜看着千雪光秃秃的发髻。她的手在石板上停了很久，才写下一行字。
@show shimo[normal] C
shimo: （石板）女将说，今晚女汤她自己收拾。我去问女将。
: 她把碗放下，快步往女汤那边去了。
@hide

@bg inn_hearth
@caption 20:00 白峰屋·围炉里之间
: 八点，晚饭开始了。
: 矮桌上摆着五只七轮，烧得通红的炭上架着铁网，烤着从镇上带来的竹荚鱼。油滴在炭上，滋滋地冒着烟。
: 屋里挤满了人。熊谷、桐谷、四方田，还有几个来喝酒的老人。莲司在给客人们斟酒。
: 雅从走廊那边进来，走到千雪身边，跪坐下来。
@show miyabi[sad] C
miyabi[sad]: 冬木小姐，女汤我看过了。
miyabi[sad]: 架子上、地上，都没有看见发簪。……真是对不起。
miyabi[normal]: 明天天亮了，我再帮您仔细找一找。灯太暗了，小东西不好找。
chiyuki[sad]: ……谢谢您。麻烦您了。
@hide
: 千雪低下头，用筷子拨着碗里的米饭，一口也没有吃。
: 有马坐在主位上，一杯接一杯地灌着酒。他喝得满脸通红，说话的声音越来越大。
arima: 再来！女将，再来一壶！
arima: 这村子什么都没有，就酒还行！哈哈！
: 雅笑着给他添酒。每添一次，她的笑容就深一点。
: 湊吃完饭，没有像平时那样留在地炉边。他看了有马一眼，抱着本子上楼去了。
@caption 20:30 白峰屋
: 八点半，千雪放下筷子，站起来，走到律身边。
chiyuki[normal]: 七濑先生。……我想跟您谈谈。关于那封信。
chiyuki[normal]: 可以去您的房间吗？乌丸小姐也一起。

@bg inn_room
@filter none
@bgm calm
@caption 20:32 白峰屋·二楼（律的房间）
: 二楼的走廊很暗。走廊尽头的拐角处，湊的房间门开着一道缝，一只眼睛在门缝后面眨了一下。
: 门缝合上了。
> 大概又在本子上写了一笔。
: 律的房间不大。一张矮桌，一个暖炉，一扇对着村道的窗。窗纸被风吹得哗哗地响。
@show chiyuki[normal] C
: 千雪把那只大信封放在矮桌上，又从包里取出一只旧皮夹，从里面抽出一张折得很小的剪报。
chiyuki[normal]: 这是我十五岁时，在外婆柜子里找到的那张报纸。
chiyuki[normal]: 「嫌疑女子雪中逃亡」。
chiyuki[sad]: 我把它带在身上八年了。每次想扔，都扔不掉。
chiyuki[normal]: 七濑先生，您说过「投票不是证据」。
chiyuki[normal]: 那么，二十年前，有证据吗？
ritsu: 报纸上说的，只有三件事。死者是村长的长子；嫌疑人是你母亲；她在暴风雪里不见了。
ritsu: 证据是什么，谁作的证，寄合上说了什么——一个字也没有。
chiyuki[sad]: 阿部婆婆说，她亲眼看见母亲进了水车小屋。
ritsu: 「进了小屋」，和「杀了人」，是两件事。
: 千雪看着律，看了很久。
chiyuki[normal]: ……您真的这么想吗。还是只是在安慰我。
ritsu: 我不会安慰人。
sayo[smile]: 是真的哦。律君一点都不会安慰人～我可以作证。
chiyuki[smile]: ……
@hide
@caption 20:40 白峰屋·二楼
sayo: 啊，说着说着肚子饿了～我下去拿点心！刚才看见霜小姐做了萩饼！
: 小夜一溜烟跑了出去。
: 过了五六分钟，她端着一碟萩饼和三杯茶回来了。
@show sayo[normal] C
sayo[normal]: 楼下好热闹呀。有马先生喝得脸都紫了。
sayo[normal]: ……嗯。
: 她把茶杯放下，像是想说什么，又咬了一口萩饼，没说出来。
@hide
@caption 21:00 白峰屋·二楼
: 窗外的风更大了。整栋楼都在风里轻轻地吱呀作响。
: 走廊里传来脚步声，在斜对面的房门口停住了。
miyabi{女将的声音}: 有马先生，您要的热酒。……失礼了。
: 拉门开了，又合上。过了一会儿，脚步声下楼去了。
@caption 21:30 白峰屋·二楼
: 三个人说着话，不知不觉过了一个钟头。
: 千雪讲了外婆家的事，讲了护士学校，讲了第一次值夜班时，一个老人握着她的手说「好冷」。
chiyuki[normal]: 我想知道，人在最冷的时候，需要什么。……所以当了护士。
: 走廊里，一串小小的脚步声啪嗒啪嗒地跑下了楼梯。
: 过了几分钟，又啪嗒啪嗒地跑了上来。走廊尽头的拉门，轻轻地合上了。
> 湊君吧。这么晚了，下楼做什么。
@caption 22:00 白峰屋·二楼
@bgm stop
: 忽然，风声停了。
: 不是变小，是停了。像一只一直在咆哮的野兽，一下子闭上了嘴。
: 屋子里安静得能听见炭在暖炉里轻轻地爆。
: 律站起来，拉开了窗。
@se wind
: 冷气扑在脸上。窗外的村道上，雪已经不下了。路灯的光里，一片雪花也没有。
: 律看了一眼手表。
: 二十二点，整。
> 七点半起，十点停。熊谷先生的天气，真的从来不会不准。
@bgm calm
sayo[surprise]: 停了？刚才还那么大……
chiyuki[normal]: 山里的雪，都是这样。说停就停。
@caption 22:10 白峰屋·二楼
: 千雪看了一眼胸前的护士表，站了起来。
@show chiyuki[normal] C
chiyuki[normal]: 已经十点十分了。打扰了这么久。
chiyuki[smile]: 谢谢您们。……我回房间了。
chiyuki[normal]: 晚安，七濑先生。
@hide
@se door
: 门轻轻合上了。走廊尽头，湊的房门又开了一道缝，又合上了。
: 律和小夜收拾了茶杯。
@caption 22:20 白峰屋
sayo[smile]: 律君，下去喝点热的吧？房间里好冷～
ritsu: 嗯。

@bg inn_hearth
@bgm village
@caption 22:20 白峰屋·围炉里之间
: 楼下的围炉里之间还很热闹。晚饭的七轮已经收走了，地炉边摆着酒壶和下酒的腌菜。
: 熊谷和桐谷对坐着喝酒，脸都红了。莲司和四方田在角落里翻着一本旧账，低声说着什么。
: 雅跪坐在地炉边，给众人温酒、添菜。她身边放着两只一升瓶，瓶身上还沾着一点灰。
miyabi[smile]: 七濑先生，乌丸小姐。来，喝杯热的甘酒吧。
: 有马不在。他的座位上只剩一只倒着的酒杯。
renji: 有马先生九点前就回房间了。喝成那样……明天早上，大概起不来吧。
@caption 22:30 白峰屋
@se door
: 玄关的门开了。真壁跺着脚上的雪走了进来，警帽上积着一层白。
makabe: 呼——冻死了。巡逻回来了！
makabe: 九点出门，转了一大圈。吹雪里三步之外什么都看不见，差点掉进雪沟里……
: 四方田合上旧账，站起身来，向莲司告辞。
yomoda: 那么，我先回本宅了。……莲司君，明天再接着看。
: 玄关那边，霜正拿着扫帚，一下一下地扫着门口的雪。
@caption 22:45 白峰屋·围炉里之间
: 地炉里的炭轻轻地响着。熊谷在讲他年轻时打熊的故事，讲到一半，打了个酒嗝。
: 律喝着甘酒，看着窗外。
: 没有风了。村子静得像睡着了一样。
@caption 22:47 白峰屋·围炉里之间
@se footsteps
: 楼梯上传来咚咚咚的脚步声。
@show minato[shock] C
minato[shock]: 水车！
minato[shock]: 水车在转！
@bgm stop
: 所有人都停了下来。
minato[shock]: 22:45……我看着表的……突然，咚、咚——
: 屋子里安静下来。
: 然后，大家都听见了。
@se heartbeat
: 很远，很闷。从后院的方向，隔着雪，一下，又一下。
: 咚。
: 咚。
: 咚。
@hide
renji[shock]: ……水车？冻住的水车，怎么会……
kumagai[shock]: 冬天的水车，不可能自己转！
: 熊谷一把推开酒杯，站了起来。
ritsu: 去看看。
@bgm tension
@caption 22:55 白峰屋·玄关
: 莲司、熊谷、真壁、律、小夜，五个人冲出了玄关。霜握着扫帚，站在门边看着他们。

@bg village_road
@weather none
@filter night
@bgm tension
@caption 22:57 村道
: 雪停后的村道一片寂静。消雪管咕嘟咕嘟地冒着温水，路面黑亮，没有一个脚印。
: 「咚。咚。」的声音越来越清楚了。
: 拐进通往水车小屋的岔路时，熊谷的手电照亮了前面的雪地。
: 岔路上的积雪平平整整，新得发亮。只有一行脚印，从村道这头延伸过去，一直通到小屋的屋檐下。
: 又从屋檐下折回来，回到村道上。
: 小小的长靴印。边缘清清楚楚。
ritsu: 别踩那行脚印。
kumagai[angry]: 什么——
ritsu: 走旁边。那行脚印，一会儿要看。
: 熊谷瞪了律一眼，还是绕开了。五个人沿着脚印旁边，深一脚浅一脚地踩着没膝的雪，走向小屋。

@bg watermill
@filter night
@weather none
@caption 23:00 水车小屋
@se creak
: 水车在转。
: 那个冻了一冬天的木轮子，吱呀吱呀地转着，甩下一串串冰碴。水从化开的水槽里哗哗地冲过叶板。
: 小屋里，「咚」的一声，又一声。
: 莲司推开了门。
@se heartbeat
: 熊谷的手电照了进去。
: 唐臼的木杵在光里抬起来，落下去。抬起来，落下去。
: 杵落下的地方——
@shake
: 石臼的旁边，侧躺着一个穿驼色大衣的男人。他的头，枕在臼口里。
@bgm horror
@filter dark
sayo[shock]: ……！
renji[shock]: 有马……先生……
: 杵又落了下来。
kumagai[angry]: 闸门！
: 熊谷扔下手电，冲出小屋，扑到水闸前，用全身的力气扳动闸板。
: 水声变小了。水车吱呀吱呀地又转了半圈，慢了下来。熊谷抄起一根木桩，狠狠地插进了轮辐之间。
@se crash
: 水车停了。
: 小屋里，那根杵最后一次抬起来，停在了半空。
: 一片死寂。
: 律捡起地上的手电，照向石臼。
: 他只看了一眼，就移开了光。
> 头部，几乎已经没有原来的形状了。
: 光扫过死者摊开的右手。手心里，有一点红色的东西。
: 一支红山茶的发簪。
@se heartbeat
sayo[shock]: 那是……千雪小姐的……
kumagai[shock]: 红山茶……
kumagai[shock]: 发簪……水车小屋……
kumagai[dark]: ……跟二十年前，一模一样。
@filter night
@bgm tension
makabe[shock]: 我、我去叫桐谷医生！
: 真壁转身冲了出去。
@caption 23:10 水车小屋
: 桐谷是被真壁半拖半架着来的。酒醒了一大半，脸色比雪还白。
: 他提着诊箱，跪在尸体旁边，手抖得好几次打不开箱扣。
kiriya[sad]: ……死了。当然死了。
kiriya[normal]: 身体还很热。死了……不到一个钟头。
kiriya[normal]: 头是被杵砸的……一下一下……
: 他翻看着死者的手臂和手掌，又凑近闻了闻。
kiriya[normal]: 一身的酒气。手上、胳膊上，一点抓伤、擦伤都没有……
kiriya[sad]: 被砸的时候，大概已经人事不省了。醉成这样……
@caption 23:30 白峰屋·围炉里之间
@bg inn_hearth
@filter none
@bgm tension
: 消息比人跑得还快。回到白峰屋的时候，围炉里之间又挤满了人。阿部文也裹着棉袄赶来了。
: 发簪用手帕包着，放在地炉边的矮桌上。红色的山茶花，在火光里亮得刺眼。
: 千雪是被霜从楼上叫下来的。她穿着浴衣，披着大衣，头发散着。
: 她看见了矮桌上的发簪。
@show chiyuki[shock] C
chiyuki[shock]: ……那是我的。
chiyuki[shock]: 怎么会……我在女汤里弄丢的……
abe[angry]: 弄丢的？哈！
abe[angry]: 二十年前，雪绘也说簪子是被少爷抢走的！
kumagai[angry]: 雪停以后，往水车小屋去的，只有一行小号的长靴印！
kumagai[angry]: 你今晚，去没去过水车小屋！
: 千雪的嘴唇发白。她攥着大衣的前襟，过了很久，才开口。
chiyuki[sad]: ……去过。
chiyuki[sad]: 十点十五分左右。我想看看……母亲「杀人」的地方。
chiyuki[sad]: 我站在屋檐下面。里面黑着，没有声音。我没有进去。
chiyuki[sad]: 十点半多，我就回来了。
@hide
villager{老人}: 杀人犯的女儿……
villager{老人}: 一样的发簪，一样的水车小屋……
abe[dark]: 杀人犯的血，是洗不掉的。
: 低语声像潮水一样涌起来。千雪站在潮水中间，一动不动。
renji: ……我去离屋。跟父亲说。
: 莲司出去了。过了二十分钟，他回来了，站在门口，脸色灰败。
renji[sad]: 父亲说……明天上午十点，裁屋。寄合。
renji[sad]: 冬木小姐，在那之前……请待在自己的房间里。
makabe[normal]: ……我来守着房门。不让任何人进去，也不让冬木小姐被人欺负。
chiyuki[normal]: ……
: 千雪没有哭。她向众人鞠了一躬，跟着真壁上楼去了。
: 走过律身边的时候，她停了一下，没有看他，只是很轻地说了一句。
chiyuki[sad]: 七濑先生。……我没有进去。
@hide
> 我知道。
> 可是「我知道」，在明天的裁屋里，一文不值。
@show sayo[normal] C
sayo[normal]: 律君。
ritsu: 嗯。
sayo[normal]: 要查吧。
ritsu: 天亮之前，全部查完。
sayo[smile]: ……嗯。这才是律君～
@hide
@caption 23:50 白峰屋
@bgm investigate
> 先把能确定的事排出来。
> 一，十九点半起吹雪，二十二点整，雪停了，风也停了。我在窗边看了表。
@get ch1_snowstop
> 二，水车在二十二点四十五分前后开始转，杵开始落下。
> 三，有马先生的手里，放着千雪小姐的发簪。
> 剩下的——去看。
@explore ch1_inv

# ch1_i_body
@if ch1_i_body_seen -> ch1_i_body2
: 有马侧躺在唐臼旁边的稻草上，头枕在石臼的臼口里。杵悬在他头顶一尺的地方。
: 律跪下来，用手电仔细地照。
: 驼色的大衣，系着腰带。脚上穿着那双黑色的皮长靴，鞋帮上的金牌子沾着稻草。浑身一股浓烈的酒气。
: 小屋里的稻草铺得平平整整，没有被踢乱。墙角的米糠堆，也没有被碰过。
> 没有打斗。他是自己躺下的——或者，是被放下的。
@get ch1_body
: 死者的右手摊开着，掌心朝上。发簪就搁在掌心里，松松的，五根手指一根也没有握拢。
> 如果是死前从凶手身上扯下来的，手里应该攥得很紧。
> 这支簪子，是被人「放」在他手里的。
@get ch1_hairpin
: 大衣的内袋鼓鼓的，像是放着什么东西。
> ……等桐谷医生验完，再回来仔细看看。
@set ch1_i_body_seen
@return

# ch1_i_body2
@if has:ch1_photo -> ch1_i_body3
: 律小心地把手伸进死者大衣的内袋。
: 一只黑色的鳄鱼皮钱包。里面有几张万元钞票、一叠名片：「有马开发株式会社　代表取缔役　有马骏」。
: 名片底下，夹着一张旧照片。
: 照片已经褪色了，四个角都磨圆了。一个两岁左右的小男孩，戴着一顶带毛球的毛线帽，坐在公园的长椅上，对着镜头笑。
: 律把照片翻过来。背面，用钢笔写着一行字。
@letter 湊　二歳　平成六年春\n\n　　　　　　　有马雅
@se heartbeat
> 湊。
> 有马……雅。
> 这笔字——「马」字最后一笔的钩，拖着一条长长的尾巴。
> 和登记簿上，女将替我们代笔写下的字，一模一样。
@get ch1_photo
@return

# ch1_i_body3
> 「湊　二歳　平成六年春　有马雅」。
> 一个生意人，为什么把别人家孩子小时候的照片，带在钱包里九年？
@return

# ch1_i_pestle
: 唐臼的木杵悬在半空，杵头上沾着暗红色的东西。长长的木杠架在支点上，尾巴伸到墙边，正被水车轴上的凸轮压着。
: 凸轮转一圈，压一下杠尾，杵就抬起来；凸轮滑过去，杵就落下来。
> 没有人需要去举这根杵。
> 只要水车在转，它就会一下一下地落下来。一直落，「捣到天明」。
@return

# ch1_i_axle
: 律绕到小屋外面，蹲在水车底下，用手电照着轮轴。
: 粗大的木轴底面，有一层新的、黑黑的煤灰。冻在水槽冰面里的那几块下层叶板上，也蒙着同样的黑。
: 用手指一抹，指尖全黑了。
kumagai: ……烤过火。
: 熊谷不知什么时候站在了身后，盯着那片黑。
kumagai[normal]: 是炭火的烟熏的。开春化冻的时候，轴底下就是这个颜色。
@get ch1_wheel
@return

# ch1_i_icicles
: 水车下沿挂着一排冰柱。大部分的尖都是细细的、尖尖的。
: 可是靠近轮轴底下的几根，尖端熔成了一个个圆圆的疙瘩，又重新冻住，像蜡烛滴下来的蜡泪。
@if has:ch1_wheel -> ch1_i_icicles2
> 被什么东西从下面烤过……烤化了一点，火灭了，又冻上了。
@return

# ch1_i_icicles2
> 冰柱的尖化圆了，又冻上了。轮轴底下有煤黑。
> 水车不是自己化冻的。下面有人放过火。
@return

# ch1_i_channel
@if has:ch1_shichirin -> ch1_i_channel3
@if ch1_kumagai_helps -> ch1_i_channel2
: 水车下游的水渠上盖着一层薄冰。冰底下，水在暗暗地流。
: 律用手电沿着水渠往下游照。五六步远的地方，薄冰底下，隐约有一团黑黑的、圆圆的影子。
> 冰下面卡着什么东西。
: 律用靴跟踩了踩冰面。冰比看上去厚，踩不破。
> 一个人凿不开。得找个有力气、又懂冰的人帮忙。
@return

# ch1_i_channel2
: 熊谷提着那根铁杵走了过来。
kumagai[normal]: 让开。
@se crash
: 他抡起铁杵，几下就把冰面凿开了一个窟窿。冰碴子溅了律一身。
: 熊谷伸手进冰水里，咬着牙，把那团黑东西拽了出来。
: 一只七轮。
: 素烧的小炭炉，圆筒形，被水泡得湿透了。里面塞满了炭，有一半还是原来的形状，另一半已经烧成了灰白色的碎块，被水浸得一塌糊涂。
kumagai[shock]: ……七轮？
: 律把它转过来。手电光照在侧面。烙在陶土上的三个字，清清楚楚。
: 「白峰屋」。
@se heartbeat
> 炭只烧了一半，就被水浸灭了。
> 它原本在哪里？——在冻住的轮轴底下。冰化开，水车一转，叶板把它刮进了水槽，冲到了下游的冰底下。
@get ch1_shichirin
@return

# ch1_i_channel3
> 白峰屋的七轮。烧了一半的炭。
> 有人提着它，从白峰屋走到了这里。
@return

# ch1_i_path
: 从村道拐进来的小路上，那行脚印还在。律蹲下来，用手电贴着雪面照。
: 小号的长靴印，前后两行。去的一行，回的一行。从村道的边缘开始，一直走到小屋的屋檐下，又原路折了回去。
: 脚印的边缘像刀切的一样锋利，印底干干净净，没有一片落雪。
> 雪停之后踩的。二十二点以后。
: 屋檐底下的地面是干的，没有积雪。脚印在屋檐的边缘消失了，又在同一个地方出现，转身往回走。
> 屋檐底下留不下脚印。她有没有推门进去，从这里看不出来。
: 除了这两行，整条小路上，再也没有别的脚印。没有死者的，也没有别人的。
@get ch1_tracks
@return

# ch1_i_sluice
: 水闸是一块厚木板，嵌在石槽里，用一根铁杠撬着。现在被熊谷扳到了底，严严实实地关着。
kumagai: 我来的时候，闸开着一道缝，跟冬天平常一样。
kumagai: 冬天闸门留缝，是村里的老规矩。水一停，水渠就冻死了。
> 闸门没有被人动过。水一直在流——只是冰咬着轮子，水推不动它。
@return

# ch1_i_ironrack
: 墙上的铁架里，那根敲冰用的铁杵还横放着，上面落着一层薄灰。
> 没有人碰过它。二十年前用的是它。今晚，凶手连碰都不需要碰。
@return

# ch1_i_nozzles
: 律沿着村道走了一段。消雪管的喷口咕嘟咕嘟地冒着温水，路面黑亮，没有一个脚印。
: 从白峰屋的门口，到水车小屋的岔路口，一直都是这样的路面。
> 从白峰屋到岔路口，谁走过，什么也留不下。
> 能留下痕迹的，只有岔路口到小屋的那几十步。
@return

# ch1_i_shed
: 白峰屋门口的柴棚里，两架祭典用的雪橇靠在柴堆边，上面盖着草席。
> 明天就是雪送祭。……这种时候，还会办吗。
@return

# ch1_i_shoebox
@if has:ch1_boots -> ch1_i_shoebox2
: 鞋柜最上面一格，白天放着那双黑色皮长靴的地方，现在空着。
: 格子里只剩一点干掉的泥印。
> 有马先生的长靴，穿在尸体的脚上。
> 他自己穿上长靴，走到了水车小屋。可是雪停之后的雪地上，没有他的脚印。
> ……他是在二十二点以前去的。在吹雪还没停的时候。
@get ch1_boots
@return

# ch1_i_shoebox2
> 空着的格子。有马先生的长靴，在吹雪里走过去，脚印被雪吃掉了。
@return

# ch1_i_register
: 柜台上的登记簿还摊着。律翻到昨天那一页。
: 「七濑律」「乌丸小夜」「冬木千雪」。上面一行，「有马骏　东京都」。
@if has:ch1_photo -> ch1_i_register2
> 女将的字。「马」字的长尾巴，「成」字像一只展翅的鸟。
@return

# ch1_i_register2
: 律把那张旧照片翻过来，并排放在登记簿旁边。
: 「有马骏」的「马」，「有马雅」的「马」。最后一笔的钩，都拖着一条一模一样的长尾巴。
> 同一个人写的。
@return

# ch1_i_doorway
: 玄关门口的雪被扫得干干净净，堆在两边。门边靠着一把竹扫帚，竹梢上还挂着冰碴。
> 霜小姐十点以后一直在这里扫雪。谁从正门进出，她都看得见。
@return

# ch1_i_sakeshelf
: 地炉边放着两只一升瓶，是女将从仓库拿来的地酒。一瓶已经开了，喝掉了小半瓶。
: 瓶身的肩上，沾着一点灰。
@return

# ch1_i_irori
: 晚饭的七轮早就收走了。地炉里的炭火压得小小的，灰上还留着几个圆圆的印子，是七轮底座压出来的。
> 晚饭的时候，五只七轮都在这里。
@return

# ch1_i_shelf
: 厨房墙边的木架上，摆着七轮。
: 律数了一遍。
: 四只。
: 白天摆着五只的地方，最右边空出了一个圆圆的位置。架板上，还留着一圈浅浅的炭灰印。
shimo: （石板）晚饭用过的五只，八点五十五分，我全都放回去了。
: 霜站在灶台边，把石板举给他看。
shimo: （石板）洗过，摆好。五只。我数了。
ritsu: 那之后，厨房里有人吗？
shimo: （石板）九点到九点四十，我在围炉里上酒。厨房没有人。
> 后门没有锁。从围炉里之间到厨房，也有门相通。
> 八点五十五分以后，有人从这里，拿走了一只七轮。
@get ch1_shelf
@return

# ch1_i_medicine
@if has:ch1_pills -> ch1_i_medicine2
: 茶柜上那只黑漆小药箱还在原处。律打开盖子，取出那只棕色的药瓶。
: 标签上印着「桐谷诊所」，手写着「就寝前一粒」，日期是「二月一日」。
: 律把药片倒在掌心，一粒一粒地数。
: 八粒。
> 桐谷医生今天上午说过：「这月初给你开了三十粒。一晚一粒。」
> 二月一日到昨晚，十二个晚上。一晚一粒，用掉十二粒——应该还剩十八粒左右。
> 少了十粒。
> 湊君说，有马来了以后，妈妈晚上吃两次药。就算这样，也不会少这么多。
@get ch1_pills
@return

# ch1_i_medicine2
> 八粒。该剩十八粒左右的药瓶里，只剩八粒。
@return

# ch1_i_backdoor
: 律拉开厨房的后门。冷气灌了进来。
: 一溜屋檐从后门一直连到几步外的土墙仓库。屋檐底下的地面干干的，只有门口被风吹进来薄薄一层雪。
: 仓库的木门上挂着铜挂锁，锁着。门缝里黑黑的，没有灯。
> 从后门到仓库，只要四五步。头顶一直有屋檐。
> 而从后门出去，绕过仓库，就是通往村道的小路。
@return

# ch1_i_tags
: 女汤门口的札板上，挂着一块木札：「清扫中」。
miyabi: ……那是我挂的。
: 雅不知什么时候站在了走廊里。
miyabi[normal]: 收拾完，忘了取下来。……今晚出了这种事。
: 她走过来，把札取了下来，放回篮子里。
: 篮子里的木札上，用墨写着名字。律翻了翻：「客」的札有几块，背面用铅笔写着「冬木」「乌丸」。
ritsu: 冬木小姐她们七点进去的时候，挂的是这两块？
miyabi[smile]: 是的。霜替她们挂上的。
ritsu: 「清扫中」，是几点挂上去的？
miyabi[normal]: ……八点前吧。七点四十五分左右。她们出来以后，我就去收拾了。
miyabi[smile]: 挂着「清扫中」的时候，谁也不会进去。这是规矩。
: 雅说完，鞠了一躬，回围炉里之间去了。
> 七点：冬木、乌丸。七点四十五分起：「清扫中」——女将的札。
@get ch1_bath_tags
@return

# ch1_i_washing
: 洗身处墙边的小木架。架子的边缘被水泡得发黑，往外倾斜着。
: 律把一枚硬币放在架子边上。硬币慢慢滑了下去，「叮」的一声，滚到了排水沟边。
> 放在上面的发簪，大概也是这样滑下去的。
@return

# ch1_i_drain
: 排水沟的木格盖和瓷砖之间，有一道指头宽的缝。律用手电照进去。
: 缝里积着头发和肥皂渣，还有一小块红色的、碎掉的珐琅片。
> 山茶花瓣边缘磕掉的一小块。
> 发簪确实掉在了这里。千雪小姐她们找的时候，大概没有想到要看缝里。
> 那么，后来把它捡起来的人——是能仔细找、有时间找的人。
@set ch1_saw_chip
@return

# ch1_i_cup
@if has:ch1_cup -> ch1_i_cup2
: 有马的房间里一股酒气。矮桌上放着一只白峰屋的酒壶和一只小酒杯，还有一只托盘。
: 酒壶里还剩小半壶，早就凉了。
: 律拿起酒杯，对着灯看。杯底残留着一层薄薄的白色粉渣，像没化开的盐。
: 他用小指蘸了一点，碰了碰舌尖。
> ……苦。
> 不是酒的味道。
@get ch1_cup
@return

# ch1_i_cup2
> 九点，女将送来的热酒。杯底的白渣，发苦。
@return

# ch1_i_briefcase
: 墙边立着一只黑色的公文包。里面是一叠文件：「白峰村后山度假村开发计划（草案）」，地图上用红笔圈着整片后山。
: 文件最后一页，是一份还没签字的土地买卖意向书。卖方一栏空着。
: 公文包的侧袋里，有一只空的牛皮纸信封，没有封口。
> 空信封。原来装着什么？
@return

# ch1_i_arimawin
: 有马房间的窗户对着后院。从这里看得见厨房的屋顶，和那座土墙仓库。
: 再远一点，雪墙后面，黑黑的一团——是水车小屋的屋顶。
@return

# ch1_i_notebook
: 湊的房间收拾得很整齐。矮桌上摊着作业本，旁边是一本用得卷了边的小本子。
: 时刻本。
: 律翻到最后一页。铅笔的字迹工工整整，每一行前面都是一个时间。
@letter 2月13日\n\n19:30　风变大了\n20:00　晚饭（七轮五个）\n20:30　回房间\n20:32　千雪姐姐进了侦探哥哥的房间\n21:00　妈妈给有马叔叔送酒\n21:05　妈妈说去仓库拿酒
@letter 21:30　去仓库找妈妈。\n　　　仓库锁着，灯是黑的。\n21:33　回房间\n22:00　雪停了\n22:10　千雪姐姐出来了\n22:45　水车！咚、咚
@se heartbeat
> 二十点三十二分，千雪小姐进了我的房间。二十二点十分，出来。
> 这不是我一个人的话。是一个十一岁的孩子，每隔几分钟就看一次表，记下来的。
> 还有——
> 二十一点三十分。仓库锁着，灯是黑的。
: 律在那一行上停了很久。
: 然后，他合上了本子。
@get ch1_notebook
@return

# ch1_i_minatowin
: 湊的窗户正对着后院外的雪野。远处，水车小屋的屋顶和那只巨大的木轮，在雪光里黑黑地立着。
: 窗帘拉了一半。窗台上放着一只小闹钟。
> 从这里，看得见水车。可是吹雪的时候，什么也看不见。
@return

# ch1_i_cwindow
: 千雪房间的窗户对着村道。看不见水车小屋，也看不见后院。
> 她回到房间以后，就算想看，也看不见水车。
@return

# ch1_it_kumagai
@if ch1_kumagai_helps -> ch1_it_kumagai2
@show kumagai[angry] C
kumagai[angry]: 东京来的。你还要查什么？
kumagai[angry]: 发簪在死人手里，雪地上只有那丫头的脚印。还有什么好查的！
ritsu: 熊谷先生，你今晚一直在白峰屋？
kumagai[angry]: 当然！从八点喝到刚才，一步都没出去过！你问桐谷那个酒鬼！
ritsu: 雪地上的脚印，你也看见了。只有一行，来回的。
kumagai[normal]: ……嗯。是雪停以后踩的，边上锋利得很。
kumagai[normal]: 那个东京佬的脚印，一个都没有。他要是走过来的，就是在吹雪里走的。吹雪停之前半个钟头以上，脚印早就吃干净了。
kumagai[dark]: ……二十年前那天晚上，也是我发现的少爷。
kumagai[dark]: 也是在这间小屋。也是……
: 他没有说下去，转身盯着水渠。
kumagai[normal]: 下游那块冰底下，有个黑东西。你看见了没有？
kumagai[normal]: 要凿的话，叫我。你那两条胳膊，凿到天亮也凿不开。
@hide
@set ch1_kumagai_helps
@return

# ch1_it_kumagai2
kumagai[normal]: 水车我卡死了。明天再钉几根桩子。
kumagai[dark]: 这东西，以后谁也别想让它转了。
@return

# ch1_it_kiriya
@if has:ch1_kiriya -> ch1_it_kiriya2
@show kiriya[sad] C
: 桐谷跪在尸体旁边，正在合上诊箱。他的手还在抖。
kiriya[sad]: 侦探先生……我只能看个大概。这里没有解剖的条件。
kiriya[normal]: 二十三点十分，我摸过他的身子。还很热，腋下尤其热。
kiriya[normal]: 死了不到一个钟头。……顶多一个钟头。
kiriya[normal]: 死因是头部受到的重击。不是一下，是很多下。杵一下一下砸下来……
kiriya[normal]: 手臂、手掌、指甲里，干干净净。没有抓伤，没有擦伤，没有挡过的痕迹。
kiriya[sad]: 人在被砸的时候，哪怕是醉了，也会本能地抬手挡一下。他没有。
kiriya[sad]: 被砸的时候，已经不省人事了。
kiriya[normal]: 酒气重得很。喝了不少……
@get ch1_kiriya
@if has:ch1_pills -> ch1_it_kiriya_pills
@hide
@return

# ch1_it_kiriya2
kiriya[sad]: 我、我回诊所去写记录……不，还是在这儿写。一个人回去，我害怕。
@if has:ch1_pills -> ch1_it_kiriya_pills
@return

# ch1_it_kiriya_pills
ritsu: 桐谷医生。女将的安眠药，是您这个月初开的？
kiriya[surprise]: 啊？……是、是的。二月一日。三十粒。一晚一粒，很轻的药。
ritsu: 到今天，应该剩多少？
kiriya[think]: 一号到十二号……一晚一粒的话，十八粒左右吧。怎么了？
ritsu: 只剩八粒。
kiriya[shock]: ……八粒？
kiriya[shock]: 那、那么多药，一次吃下去……加上酒……
: 桐谷的脸色变了。他看了一眼石臼边的尸体，又飞快地移开了视线。
@return

# ch1_it_renji
@if ch1_t_renji -> ch1_it_renji2
@show renji[sad] C
: 莲司站在玄关，靠着柱子抽烟。脚边已经落了三个烟头。
renji[sad]: ……七濑先生。
renji[sad]: 对不起。明天的寄合……我拦不住父亲。长老们也……
ritsu: 莲司先生，今晚你一直在围炉里之间？
renji[normal]: 八点开饭以后，一直在。和四方田先生看旧账，到十点半他回本宅。
renji[normal]: 熊谷先生、桐谷医生也一直在喝酒，没出过门。
ritsu: 女将呢？
renji[normal]: 雅……九点多给有马先生送了一趟热酒。回来说有马先生想喝好一点的地酒，就去后院仓库找。
renji[normal]: 去了挺久的。回来的时候……九点四十多吧，拿着两瓶。
renji[normal]: 那以后就一直在地炉边，给大家温酒。
ritsu: 有马先生是几点回的房间？
renji[normal]: 九点前，八点五十左右。喝得站都站不稳了。我扶他上的楼梯。
renji[sad]: ……没想到，他还能自己穿上靴子出门。
: 莲司又点了一支烟。打火机的火苗，在他手里抖个不停。
@hide
@set ch1_t_renji
@return

# ch1_it_renji2
renji[sad]: 湊……湊吓坏了。他一直在看他的表。
renji[normal]: 七濑先生，那孩子……别吓着他。
@return

# ch1_it_minato
@if has:ch1_minato -> ch1_it_minato2
@show minato[sad] C
: 湊坐在地炉边，双手紧紧攥着手腕上的电子表。莲司刚才披在他身上的棉袄，滑到了一边。
ritsu: 湊君。水车开始响的时候，你在哪里？
minato[sad]: 在房间里。写作业。
minato[normal]: 窗帘拉着。风停了以后，好安静。
minato[normal]: 然后，突然——咚。咚。
minato[normal]: 我马上看了表。22:45。
minato[normal]: 我拉开窗帘，看见水车在转。就跑下楼了。跑到楼下，是 22:47。
ritsu: 在那之前，水车有声音吗？
minato[normal]: 没有。一点都没有。
minato[normal]: 我的表，每天中午对着公民馆的报时，一秒都不差。今天中午也对过了。
: 他把电子表举给律看。液晶屏上的秒数，一跳一跳地走着。
@get ch1_minato
minato[sad]: ……侦探哥哥。
minato[sad]: 那个叔叔，死了？
ritsu: ……嗯。
minato[sad]: ……
: 湊低下头，没有再说话。他的手，一直攥着那只表。
@hide
@return

# ch1_it_minato2
minato[sad]: 我的本子……在房间的桌上。侦探哥哥要看，就去看吧。
minato[sad]: 我都记下来了。……什么都记下来了。
@return

# ch1_it_miyabi
@if has:ch1_miyabi -> ch1_it_miyabi2
@show miyabi[normal] C
: 雅跪坐在地炉边，一下一下地拨着炭。她的发髻还是一丝不乱。
miyabi[normal]: 七濑先生。……真是可怕的一夜。
miyabi[sad]: 有马先生是客人。在我们白峰屋出了这种事……
ritsu: 女将，今晚九点以后，你在哪里？
miyabi[normal]: 九点，我给有马先生送了一壶热酒。他已经醉了，还嚷着要喝。
miyabi[normal]: 他说这里的酒不够好，想喝好一点的地酒。
miyabi[smile]: 客人的要求嘛。九点五分，我就去后院的仓库里找。
miyabi[normal]: 仓库里东西堆得乱，找了半天。九点四十分，才拿着两瓶回来。
miyabi[normal]: 后来就一直在这里。大家都看见的。
@get ch1_miyabi
: 她把拨火棍放下，双手叠在膝上。袖口滑下去一点，手腕上那几道红印，已经变成了青紫色。
@hide
@return

# ch1_it_miyabi2
miyabi[smile]: 七濑先生，要喝点什么吗？甘酒还是热茶？
miyabi[normal]: ……湊今晚，我会陪着他睡。
@return

# ch1_it_sayo
@if ch1_t_sayo -> ch1_it_sayo2
@show sayo[think] C
sayo[think]: 律君。我想起来一件事。
sayo[normal]: 八点四十分，我下楼拿点心的时候，围炉里之间正热闹。
sayo[normal]: 有马先生把女将叫到身边，凑到她耳朵边上说话。声音很小，我只听见几个字。
sayo[normal]: 「……钱……今晚……」
sayo[normal]: 女将的脸色好难看。可是马上又笑了，笑得跟平时一模一样。
sayo[think]: 我当时觉得怪怪的，想跟你说，又觉得是我多心……
@get ch1_overheard
@set ch1_t_sayo
sayo[normal]: ……律君。那个人的笑容，我有点怕。
sayo[sad]: 太完美了。完美得，像一张面具。
@hide
@return

# ch1_it_sayo2
sayo[normal]: 千雪小姐那边，真壁先生守着呢。……她一句话都不说。
sayo[normal]: 律君，天亮之前，一定要找到。
@return

# ch1_it_shimo
@if ch1_t_shimo -> ch1_it_shimo2
@show shimo[normal] C
: 霜站在灶台前，烧着一大锅开水。看见律，她放下了勺子。
ritsu: 霜小姐。今晚十点以后，你在玄关扫雪？
: 霜点点头。她从胸前取下石板，翻过来给律看。石板的背面写着两行字，没有擦掉。
shimo: （石板）千雪小姐　22:15　出门　22:35　回来
> 「雪」字。雨字头的四个点，连成了一道波浪线。像一只飞着的蛾子。
shimo: （石板）扫雪的时候写的。怕忘了。
ritsu: 她出门的时候，有没有说去哪里？
: 霜摇摇头。她把石板翻回正面，写了一行。
shimo: （石板）什么都没说。回来的时候，脸很白。直接上楼了。
@get ch1_shimo_slate
ritsu: 千雪小姐的发簪，七点多落在女汤里了。她来问过你吧。
: 霜点了点头。她擦掉石板，一笔一笔地写。
shimo: （石板）七点四十分，女将来说：今晚女汤，她自己收拾。
shimo: （石板）平时都是我收拾。今晚我没有进去。
shimo: （石板）七点五十分千雪小姐来问，我去找女将。女将在女汤里，说没有看见。
@get ch1_shimo_bath
: 写完，霜看着律，眼睛里有什么东西闪了一下。她又擦掉石板，写了最后一行。
shimo: （石板）千雪小姐不是坏人。
@set ch1_t_shimo
@hide
@return

# ch1_it_shimo2
@if has:ch1_shimo_snow -> ch1_it_shimo3
@show shimo[normal] C
ritsu: 霜小姐，还有一件事。
ritsu: 九点四十分，你从围炉里之间回到厨房的时候，厨房里有人吗？
: 霜想了想，在石板上写。
shimo: （石板）女将正好从后门进来。拿着两瓶酒。
shimo: （石板）肩上全是雪。头发上也是。
: 她顿了一下，又补了一行。
shimo: （石板）我给她拍了拍。
ritsu: 从仓库到后门，有屋檐吧。
: 霜点了点头。然后，她慢慢地停住了，像是也想到了什么。她看着律，没有再写。
@get ch1_shimo_snow
@hide
@return

# ch1_it_shimo3
shimo: （石板）热水烧好了。给大家泡茶。
@return

# ch1_it_chiyuki
@if has:ch1_chiyuki -> ch1_it_chiyuki2
@show chiyuki[sad] C
: 千雪坐在房间的角落里，抱着膝盖。浴衣外面披着大衣，散着的头发垂在脸边。
chiyuki[sad]: ……七濑先生。
ritsu: 把今晚的事，从头说一遍。尽量想清楚。
: 千雪点了点头，深深地吸了一口气。
chiyuki[normal]: 十点十分，我从您的房间出来。回到这里，坐了一会儿。
chiyuki[normal]: 我一直想去水车小屋。白天不敢去，就想……晚上没人，雪也停了，去看一眼。
chiyuki[normal]: 十点十五分，我从玄关出去。霜小姐在扫雪，看见我了。
chiyuki[normal]: 沿着村道走到岔路口，再走那条小路，一直走到小屋的屋檐下面。
chiyuki[sad]: 小屋里黑着。一点声音都没有。我站了很久，没有推门。
chiyuki[sad]: 我怕推开门，就会看见什么……二十年前的什么。
chiyuki[think]: ……啊。
chiyuki[think]: 对了。站在那里的时候，小屋的另一边——水车那一边，好像有一点点红光。
chiyuki[think]: 很淡，一闪一闪的。我以为是眼花了，是雪反的光。
chiyuki[normal]: 然后我就回来了。十点三十五分。之后一直一个人待在房间里。
chiyuki[sad]: 没有人能证明。
@get ch1_chiyuki
chiyuki[sad]: ……我母亲那时候，大概也是这样吧。
chiyuki[sad]: 去过那个地方。没有人能证明她没有做。
@hide
@return

# ch1_it_chiyuki2
chiyuki[sad]: ……我没有进去。
chiyuki[normal]: 七濑先生，我说的每一个字，都是真的。
@return

# ch1_it_makabe
@if ch1_t_makabe -> ch1_it_makabe2
@show makabe[normal] C
: 真壁搬了一把椅子，坐在千雪的房门口，警帽端端正正地戴着。
makabe[normal]: 七濑先生。我在这里守着。谁也不让进。
ritsu: 真壁先生，你九点到十点半在巡逻。看见过什么人吗？
makabe[sad]: ……没有。
makabe[sad]: 吹雪太大了。手电照出去，全是雪，三步之外连人影都看不见。
makabe[normal]: 我先去了神社那边，又绕到后山那几户。回来的时候雪停了，走村道回的白峰屋。
makabe[sad]: 要是我那时候从水车小屋前面走一趟……
makabe[angry]: 我一个人巡逻，没有人能证明我在哪里。明天，村里的人大概也会说我吧。
makabe[normal]: 可是，冬木小姐不是那种人。我看得出来。
@hide
@set ch1_t_makabe
@return

# ch1_it_makabe2
makabe[normal]: 我会守到天亮。七濑先生，拜托了。
@return

# ch1_inv_end
@bg inn_room
@filter night
@weather none
@bgm calm
@caption 2月14日 04:30 白峰屋·二楼（律的房间）
: 律回到房间的时候，天还没有亮。
: 他把手账摊在矮桌上，一页一页地翻。小夜靠着墙坐着，抱着一只坐垫，已经睡着了。
> 发簪。脚印。冻住的水车。冰下的七轮。四只七轮的架子。
> 九点半，锁着的仓库。九点四十，满肩的雪。
> 杯底的白渣。少了十粒的药。还有，一张旧照片。
: 他翻到最后一页，停住了。
> 二十一点三十分，仓库锁着，灯是黑的。
> 写下这一行的，是一个十一岁的孩子。
: 窗外，天边开始泛白。远处，水车小屋的方向，有人在用锤子敲着什么。一下，一下。
: 是熊谷在往水车上钉木桩。
> 天亮了。就要开寄合了。
@fade out
@wait 600

@bg sabakiya
@filter none
@weather none
@fade in
@bgm mystery
@caption 2月14日 09:50 裁屋
: 雪停了。天是铅灰色的，没有风。
: 裁屋的茅草顶上压着厚厚的雪，屋檐下的冰柱一根一根垂到地面。
: 屋里的地炉已经生起了火。村民们一个接一个地进来，在火边坐成一圈。比前天晚上更多，有三十来个人。
: 源一郎又被人用椅子抬了进来，放在上座。他闭着眼睛，像是睡着了，手里却紧紧地攥着拐杖。
: 澄坐在他的身边，白羽织的下摆整整齐齐地铺在榻榻米上。
: 千雪被真壁领着走进来，坐在圆圈的正中央，地炉的前面。一张草席，一个人。
: 所有人的眼睛都在她身上。
@trial on
@bgm trial
renji: ……那么。
renji: 按照……古法。寄合，开始。
: 莲司站在上座的另一边，手里拿着一张纸，声音沙哑。
sumi: 白蛾大人在上。
sumi: ……愿今日的寄合，不送错一个人。
: 澄双手合十，低声念完，又垂下了眼睛。
renji: 先说一下规矩。……这是父亲的意思。
: 【寄合须知】寄合由众人的讨论与「推理」交替进行。
: 【寄合须知】证言交锋：众人的发言中会出现橙色的「弱点」。从侦探手账中选出与之矛盾的证据，射向那个弱点。
: 【寄合须知】一对一对峙：对手只有一个人。你手里不是证据，而是几把「反驳之刃」——选出正确的一把，砍向对方话里的破绽。
: 【寄合须知】此外还有出示证据、指认人物、灵光拼字、推理回廊、真相重演。最后，由在场的每一个人投票。
: 【寄合须知】答错不会失败。只会扣掉一点「信念」——信念归零时会自动恢复。连续答错，会出现提示。
: 【寄合须知】但有些时刻，没有提示，也没有重来。那是你自己的选择。
renji: 投票之前，七濑先生说过……
renji: 如果他能证明真凶，就把真凶关起来，交给警察。证明不了，就按古法。
genichiro: ……哼。说吧。
: 源一郎睁开了眼睛。
genichiro: 东京来的小子。你的约定，就从今天开始算。
renji: 先请桐谷医生……说一下验尸的结果。
kiriya: ……是。
kiriya: 死者，有马骏先生。昨晚二十三点十分，我检查的时候，身体还很热。死后不到一个钟头。
kiriya: 死因是头部受到的重击。杵……一下一下砸下来的。
kiriya: 手臂上、手掌上，一点抵抗的伤都没有。被砸的时候，大概已经人事不省了。
kiriya: 身上酒气很重。……我能说的，就这些。
kumagai: 还有什么好说的！
: 熊谷一拳砸在自己的膝盖上。
kumagai: 雪停以后，往水车小屋去的脚印，只有一行！小号的长靴！
kumagai: 那丫头自己都承认了，她去过！
abe: 还有发簪！死人手里攥着她的红山茶发簪！
abe: 二十年前，惣一少爷怀里也揣着雪绘的红山茶！一模一样！
@if has:ch1_abe_1983 -> ch1_t_abe1983
@goto ch1_t_layer1

# ch1_t_abe1983
> 阿部婆婆说过。二十年前，那支簪子是惣一当着众人的面，从雪绘头上扯下来的。
> 她今天早上，也把这个故事讲给了女将听。
> ……听过这个故事的人，可不止一个。

# ch1_t_layer1
villager{长老}: 杀人犯的女儿……到底还是……
villager{老妇}: 那天晚上的雪绘，也是这样坐在中间的……
chiyuki: ……
: 千雪坐在草席上，背挺得笔直。她的手放在膝上，攥得很紧。
chiyuki: 我去过水车小屋。十点十五分到十点三十五分。
chiyuki: 我站在屋檐下面，没有进去。发簪是我在女汤弄丢的。
chiyuki: 我没有杀人。
abe: 嘴上谁都会说！二十年前，你妈也说「我没有杀人」！
: 千雪的肩膀，轻轻抖了一下。
sayo: 律君……
> 村子已经替她写好了判决。
> 脚印，发簪，二十年前的影子。每一样都看起来说得通。
> 可是「看起来说得通」，不是证据。
ritsu: 先把能确定的事排出来。
ritsu: 熊谷先生，阿部婆婆。你们说的，我一句一句地对一遍。
@bgm debate
@game ch1_g1
@bgm trial
@shout ritsu 不对！
ritsu: 千雪小姐，没有「拿杵砸死」任何人。
ritsu: 那根杵，不是人举起来的。是水车带着它，一下一下落下来的。
ritsu: 冻住的水车，凸轮压着杠尾，杵一直悬在半空。昨天早上我亲眼看过。
ritsu: 水车转起来，杵才会落下。而水车开始转的时刻——
minato: ……22:45。
: 湊从莲司的身边站了起来。他的手里，攥着那只电子表。
minato: 我在房间里，听见咚、咚。马上看了表。22:45。
minato: 在那之前，水车一点声音都没有。我的表，每天中午对着报时。一秒都不差。
ritsu: 谢谢你，湊君。
ritsu: 那么，22:45，千雪小姐在哪里？
shimo: （石板）千雪小姐　22:15　出门　22:35　回来
: 霜从人群后面站起来，把石板高高地举过头顶。
ritsu: 霜小姐在玄关扫雪，亲眼看见她二十二点三十五分回到了白峰屋。
ritsu: 杵开始落下的时候，千雪小姐已经回来十分钟了。
kiriya: 那……一下又一下……确实，人举不起来那么多下……
kiriya: 也对得上……二十三点十分，死了不到一个钟头……
: 人群里起了一阵骚动。熊谷张着嘴，半天没有说出话来。
abe: 那、那又怎么样！
abe: 杵是水车砸的，那水车是谁让它转的？
abe: 她去小屋的时候，弄了什么手脚，让水车过一会儿自己转起来——
kumagai: 对！就是这样！
> 他们换了一个说法。
> 可是，冻住的水车，真的能「过一会儿自己转起来」吗？
@bgm debate
@game ch1_g2
@bgm trial
@shout ritsu 不对！
ritsu: 冬天冻住的水车，开了闸也不会转。
ritsu: 昨天早上，莲司先生亲口告诉我的。冰咬着轮子，水推不动它。
ritsu: 开春化冻的时候，要用七轮在轴底下烤一个半钟头左右，冰化开了，才转得动。
renji: ……是的。村里每年都是这样化冻的。
renji: 光开闸……没有用。
ritsu: 而且，水闸冬天本来就留着一道缝。熊谷先生昨晚去关闸的时候，闸门就是平常的样子。
kumagai: ……
kumagai: ……是开着一道缝。跟平常一样。
ritsu: 那么，水车是怎么转起来的？
ritsu: 请看这个。
: 律从手账里取出一张纸，上面是他连夜画下的水车轴底的样子。
ritsu: 水车的轮轴底下，冻在冰里的叶板上，有一层新的煤黑。轴下面的几根冰柱，尖端都熔成了圆疙瘩，又重新冻住。
ritsu: 水车底下，有人烤过火。
kumagai: ……是真的。我亲眼看见的。
kumagai: 跟开春化冻的时候，一个颜色。
villager{长老}: 烤火……那、那就是她！
abe: 对！她十点十五分去，在水车底下点了火！点完就跑回来，等着水车转！
villager{老人}: 好狠的心……
genichiro: ……侦探。
: 源一郎的声音不大，却让整间屋子安静了下来。
genichiro: 你说她十点十五分以前在你房间里，在那之后才去的小屋。
genichiro: 谁能证明？你？
genichiro: 你自己就是同伙。外来的侦探，护着外来的女人。你的话，在这个村子里，一文不值。
@se heartbeat
: 他用拐杖敲了一下地板。
genichiro: 二十年前，那个女人也是这么说的。「我没有杀人」。……结果呢？
@bgm stop
: 裁屋里一片死寂。
: 所有人的眼睛，又回到了千雪身上。
: 千雪慢慢地站了起来。
: 她的脸色白得透明。一夜没睡，眼睛下面是深深的青影。她看着圈子里的每一张脸，一张，又一张。
chiyuki: ……够了。
chiyuki: 七濑先生，谢谢您。真的……够了。
chiyuki: 二十年了。我一直是「杀人犯的女儿」。
chiyuki: 在学校里，在护士学校里，在医院里。只要有人知道了，就会用那种眼神看我。
chiyuki: 我拼命地想证明，我不是那样的人。……可是，也许，我证明不了。
chiyuki: 也许我身上，真的流着杀人犯的血。
@se heartbeat
chiyuki: ……投我吧。
chiyuki: 如果这样，这个村子就能安心的话。
: 她垂下手，站在地炉前面。像一根被雪压弯、却还没有折断的竹子。
> 她说的，是她自己的决定。
> 一个精疲力尽的人，自己选择了结束。我有什么权利，替她拒绝。
> 而且——源一郎说得没错。我的证言，在这里一文不值。
> 我真的能证明吗？如果我又错了呢？
@checkpoint
@choice
- ……尊重她的决定。 -> ch1_be_ch1
- 不。你母亲的事，和昨晚没有关系——我能证明。 -> ch1_t_prove

# ch1_t_prove
ritsu: 不。
@shout ritsu 不对！
ritsu: 你母亲的事，和昨晚没有关系。
ritsu: 二十年前发生了什么，我还不知道。可是昨晚发生了什么，我能证明。
chiyuki: ……七濑先生……
ritsu: 而且，不需要我的证言。
ritsu: 能证明的东西，不止我一个人看见了。
@bgm trial
genichiro: ……哼。说来听听。
> 冻住的水车，要烤一个半钟头才会转。
> 从这里开始，一步一步往回倒推。
@bgm debate
@game ch1_g3
@bgm truth
ritsu: 整理一下。
ritsu: 水车在二十二点四十五分开始转。冻住的水车，要在轴底下烤一个半钟头左右，冰才会化开。
ritsu: 那么，火是什么时候放下去的？——二十一点十五分前后。
ritsu: 那个时候，外面在刮吹雪。熊谷先生说过：吹雪的晚上，半个钟头，雪就把脚印吃干净了。
kumagai: ……我是说过。
ritsu: 吹雪一直刮到二十二点整。雪停之前留下的脚印，全都被雪吃掉了。
ritsu: 而二十一点十五分，千雪小姐在哪里？
ritsu: 在我的房间里。从二十点三十二分，到二十二点十分。
genichiro: 又是你的话。
ritsu: 不是我的话。
: 律从手账里，取出了一页纸。是他抄下来的、湊的时刻本。
ritsu: 「20:32　千雪姐姐进了侦探哥哥的房间」。「22:10　千雪姐姐出来了」。
ritsu: 这是湊君记的。他每隔几分钟就看一次表，什么都写下来。
minato: ……我写的。我看见的。
renji: 湊……
ritsu: 还有一件事。有马先生自己的脚印。
ritsu: 雪停以后，那条小路上，除了千雪小姐来回的一行，什么都没有。没有有马先生走过去的脚印。
ritsu: 他穿着自己的长靴，走到了水车小屋——那一定是在雪停以前，在吹雪里。
@if has:ch1_boots -> ch1_t_boots
@goto ch1_t_after_g3

# ch1_t_boots
ritsu: 玄关鞋柜里，他那双东京买的长靴不见了。穿在尸体的脚上。他是自己走过去的。

# ch1_t_after_g3
ritsu: 也就是说——
ritsu: 千雪小姐二十二点十五分走到小屋的时候，有马先生早就躺在了杵底下，火早就在水车底下烧着了。
ritsu: 一切，都已经布置好了。
ritsu: 她站在屋檐下，看见小屋另一边「好像有一点点红光」。
ritsu: 那不是雪反的光。那是还在烧着的火。
@se heartbeat
chiyuki: ……！
: 千雪捂住了嘴。
: 裁屋里，第一次响起了不同的声音。不是附和，而是犹豫。
villager{老妇}: 那……那丫头去的时候，人已经……
villager{长老}: 二十一点十五分……那时候吹雪那么大……
abe: 那火是谁放的！用什么放的！
abe: 水车底下，难道会自己烧起来不成？
> 下游的水渠。冰底下，卡着那样东西。
@game ch1_g4
@shout ritsu 就是这个！
ritsu: 这只七轮，是在水车下游五六步远的水渠里找到的。卡在薄冰底下。熊谷先生帮我凿开了冰。
kumagai: ……是我凿的。
ritsu: 炭只烧了一半，就被水浸灭了。
ritsu: 它原本放在冻住的轮轴底下。冰化开，水车一转，叶板一刮，它就翻进了水槽，被水冲到了下游的冰底下。
ritsu: 请看它的侧面。
: 律把七轮转过来，举了起来。
: 烙在陶土上的三个字，在地炉的火光里清清楚楚。
ritsu: 「白峰屋」。
@se heartbeat
: 莲司的脸色变了。
ritsu: 白峰屋厨房的七轮架上，昨天白天，摆着五只七轮。昨晚晚饭的时候，五只全都摆上了桌。
ritsu: 现在，架子上只剩下四只。
ritsu: 霜小姐，晚饭用过的七轮，你是几点收回去的？
shimo: （石板）八点五十五分。五只。我数了。
ritsu: 那么，这只七轮，是八点五十五分以后，从白峰屋的厨房里被拿走的。
ritsu: 八点五十五分到九点四十分，霜小姐在围炉里之间上酒，厨房里没有人。后门不上锁。
yomoda: 八点五十五分以后，从厨房拿走七轮，二十一点十五分前后放到水车底下……
yomoda: 那段时间，千雪小姐在七濑君的房间里。……她做不到。
: 四方田推了推眼镜，低声说。人群里，有几个人跟着点了点头。
abe: 那……那是谁？
abe: 九点到九点四十，不在围炉里的人——
: 阿部的眼睛在人群里转了一圈，停在了门边。
abe: 真壁！你九点出去巡逻，十点半才回来！一个人！
makabe: 我、我……！
villager{老人}: 对啊，巡查一个人在外面……
makabe: 我是在巡逻！神社，后山……可是，没有人能证明……
villager{长老}: 熊谷呢？熊谷那天晚上喝醉了，出去撒过尿吧？
kumagai: 放屁！我从八点到十点四十七，屁股都没离开过垫子！
renji: ……熊谷先生一直在。我可以作证。
> 九点到九点四十分，有谁不在众人眼前——这个问题，很重要。
> 可是，凶手要做的，不只是放一把火。
> 在那之前，还有一样东西，凶手必须先拿到手。
ritsu: 请等一下。
ritsu: 有马先生的手里，放着一支发簪。千雪小姐的红山茶。
ritsu: 那支发簪，昨晚七点多落在了白峰屋的女汤里。凶手要把它放进死者手里，就必须先把它捡到。
ritsu: 七点以后，能进女汤捡到它的人，是谁？
@game ch1_g5
@shout ritsu 就是你！
ritsu: 白峰雅女将。
@se heartbeat
@bgm stop
: 裁屋里，一下子静了。
: 所有人都转过头，看着坐在莲司身边的那个女人。
: 雅跪坐在那里，双手叠在膝上。梅紫色的和服，一丝不乱的发髻。她的脸上，还挂着那个得体的、量过尺寸的笑。
renji: ……雅？
@bgm tension
ritsu: 女汤门口有一块札板。进去的人挂上自己的名札，挂着的时候，别人不进去。
ritsu: 昨晚七点，挂的是千雪小姐和小夜的札。七点四十五分起，挂的是「清扫中」——女将的札。
ritsu: 霜小姐，平时晚上收拾女汤的，是谁？
shimo: （石板）我。
ritsu: 昨晚呢？
shimo: （石板）七点四十分，女将说今晚她自己收拾。我没有进去。
@if ch1_saw_chip -> ch1_t_chip
@goto ch1_t_chip_end

# ch1_t_chip
ritsu: 发簪掉在洗身处架子下面的排水沟缝里。我昨晚在那道缝里，找到了山茶花瓣上磕下来的一小片珐琅。

# ch1_t_chip_end
ritsu: 千雪小姐和小夜回去找过，没有找到。在那之后，挂着「清扫中」的札、一个人在女汤里待了很久的——只有女将。
miyabi[smile]: 七濑先生。
miyabi[smile]: 您在说什么呢？
: 雅笑了。笑容和昨天早上，和前天傍晚，一模一样。
miyabi: 我是去收拾了。可是，我什么都没有捡到。
> 她不会认的。
> 她的话里，一定有一个地方，是有人亲眼看过反面的。
@bgm debate
@game ch1_g6
@bgm tension
@shout ritsu 这就是破绽！
ritsu: 女将。你说你九点五分以后，一直在仓库里找地酒，四十分钟才回来。
ritsu: 可是九点三十分，有人去仓库找过你。
miyabi: ……
ritsu: 那个人，从厨房的后门出去，走到仓库门口。
ritsu: 仓库锁着。门缝里，灯是黑的。
: 律停了一下。
: 他的视线，越过地炉，落在了莲司身边那个小小的身影上。
@se heartbeat
> 证人，是她的儿子。
: 湊低着头。他的手里攥着那只电子表，指节发白。
ritsu: ……「21:30　去仓库找妈妈。仓库锁着，灯是黑的。」
ritsu: 湊君的时刻本上，是这样写的。
minato: ……
: 湊没有抬头。他的肩膀，一下一下地抖着。
miyabi: 湊……
: 雅的笑容，第一次晃了一下。只有一瞬间。
@if has:ch1_shimo_snow -> ch1_t_shimosnow
@goto ch1_t_after_g6

# ch1_t_shimosnow
ritsu: 还有。九点四十分，女将拿着两瓶酒从后门回到厨房。霜小姐看见了。
shimo: （石板）肩上全是雪。头发上也是。
ritsu: 从仓库到后门，有一溜屋檐连着，只有四五步。在仓库里待了四十分钟的人，肩上不会落满雪。
ritsu: 除非，她是从更远的地方，在吹雪里走回来的。

# ch1_t_after_g6
miyabi: ……那又怎么样呢。
: 雅的声音，依然平稳。
miyabi: 也许我记错了时间。也许那时候我刚好出来透透气。
miyabi: 七濑先生，您忘了一件事。我为什么要杀有马先生？
miyabi: 他是我们白峰屋的客人。我和有马先生，只是生意上的往来而已。
> 只是生意上的往来。
> 那张照片——一个生意人，为什么会把它带在钱包里？
@game ch1_g7
@shout ritsu 请看这个！
ritsu: 这是在有马先生上衣内袋的钱包里找到的。
: 律举起那张褪了色的旧照片。一个戴毛线帽的小男孩，坐在公园的长椅上，对着镜头笑。
ritsu: 照片的背面，写着一行字。
ritsu: 「湊　二歳　平成六年春　有马雅」。
@se heartbeat
@bgm stop
: 雅的笑容，碎了。
: 不是慢慢消失的。是像一面镜子被石头击中，一下子，从中间裂开了。
: 她的嘴唇张开了，又合上。叠在膝上的双手，第一次分开了。
ritsu: 这笔字，「马」字最后一笔的钩，拖着一条长长的尾巴。
ritsu: 和白峰屋登记簿上，女将替客人代笔的字，一模一样。
ritsu: 有马雅。……这是你以前的名字吧，女将。
ritsu: 有马骏先生，是你从前的丈夫。
: 裁屋里，有人倒吸了一口冷气。
abe: 前、前夫……？那湊……
renji: ……
: 莲司没有动。他只是闭上了眼睛，像是一直在等这一刻，又一直害怕这一刻。
@if has:ch1_overheard -> ch1_t_overheard
@goto ch1_t_after_g7

# ch1_t_overheard
sayo: ……昨晚八点四十分。我下楼拿点心的时候，看见有马先生凑到女将耳边说话。
sayo: 我只听见了几个字。「……钱……今晚……」
sayo: 女将的脸色很难看。可是马上，又笑了。

# ch1_t_after_g7
@bgm tension
kumagai: ……可是。
kumagai: 一个大男人，喝醉了也是大男人。怎么会乖乖地躺在那里，让人把头放进臼里？
kumagai: 杵砸下来，痛也痛醒了！他怎么一下都没挡？
kiriya: ……那、那是因为……
> 桐谷医生说过，他身上没有一处抵抗伤。被砸的时候，已经不省人事了。
> 只是喝醉，不会醉到那种程度。酒里，还有别的东西。
@game ch1_g8
@shout ritsu 是安眠药！
ritsu: 有马先生房间的矮桌上，放着女将九点送去的酒壶和酒杯。
ritsu: 酒杯的杯底，残留着一层白色的粉渣。我尝过，是苦的。
ritsu: 磨碎的安眠药，溶在热酒里。再加上他晚饭时喝下去的那么多酒——
kiriya: ……那、那就对得上了。没有一处抵抗伤……砸下来也醒不过来……
kiriya: 那种药和酒一起……一次吃下去好几粒的话……
miyabi: ……安眠药？
: 雅抬起头来。她的脸色苍白，声音却还是稳的。
miyabi: 安眠药，又能说明什么呢。
> 她还在退。退到最后一道墙后面。
> 那道墙的砖，我昨晚一块一块数过了。
@bgm debate
@game ch1_g9
@bgm tension
@shout ritsu 不对！
ritsu: 女将。你的药瓶，就放在厨房茶柜的小药箱里。我昨晚打开数过。
ritsu: 桐谷医生，那瓶药，是什么时候开的？开了多少？
kiriya: ……二月一日。三十粒。一晚一粒。
ritsu: 一号到十二号，十二个晚上。一晚一粒，应该还剩十八粒左右。
ritsu: 瓶子里，只剩八粒。
@se heartbeat
ritsu: 少了十粒。
ritsu: 十粒安眠药，磨碎了，溶在一壶热酒里。
kiriya: ……我，我昨天上午还跟女将说……别吃太多……
kiriya: 女将……你……
: 桐谷捂住了脸。
: 雅没有回答。她低头看着自己的双手，看着手腕上那几道已经发紫的指印。
: 裁屋里，没有一个人说话。
renji: ……七濑先生。
: 莲司开口了。他的声音很轻，像是从很远的地方传过来的。
renji: 请你……从头说一遍。
renji: 让所有人，都听清楚。
ritsu: ……好。
@bgm truth
@game ch1_g10
ritsu: 这就是昨晚发生的全部。
ritsu: 昨天早上，女将在阿部婆婆的店里，听说了二十年前的事。惣一少爷死在水车小屋，怀里揣着雪绘小姐的红山茶发簪。
ritsu: 中午，熊谷先生在围炉里之间大声说：今晚七点半起吹雪，十点前后停。
ritsu: 晚上七点，千雪小姐把发簪落在了女汤。七点四十分，女将对霜小姐说，今晚女汤她自己收拾。
ritsu: 七点四十五分，她挂上「清扫中」的札，在排水沟边找到了那支发簪。
ritsu: 八点钟，晚饭。有马先生喝了很多酒，八点五十分回了房间。八点五十五分，霜小姐把五只七轮收回了厨房。
ritsu: 九点，女将给有马先生送去一壶热酒。酒里，溶着十粒磨碎的安眠药。
ritsu: 她低声约他：九点二十分，水车小屋。大概是说，钱在那里。不要让人看见。
ritsu: 九点五分，她说「去仓库拿客人要的地酒」，从没有人的厨房里拿走一只七轮，装满晚饭剩下的、还红着的炭，从后门出去。
ritsu: 她走的是消雪管的村道。什么也不会留下。
@flashback on
@bg watermill
@filter night
@weather blizzard
@caption 2月13日 21:15 水车小屋（推理）
: 吹雪里，有马穿着自己的长靴，摇摇晃晃地走进了水车小屋。
: 女将已经在等着他了。七轮放在屋里，红红的炭火，像是为了取暖。她递给他一只装着钱的信封。
: 九点二十五分，药效发作了。有马倒在了稻草上。
: 她把他拖到唐臼边，让他侧躺下来，头枕在臼口——正对着那根悬在半空的杵。
: 把钱拿回来。把发簪放进他摊开的右手里。
: 九点半，她把七轮提到屋外，放在水车底下冻住的水槽冰面上，正对着轮轴和冻在冰里的叶板，添满了炭。
: 然后，她在吹雪里，走回了白峰屋。
@flashback off
@trial on
@bgm truth
ritsu: 九点三十分，湊君去仓库找妈妈。仓库锁着，灯是黑的。
ritsu: 九点三十八分前后，女将回到后院，打开仓库，拿了两瓶地酒。九点四十分，从后门进了厨房。肩上，落满了雪。
ritsu: 九点四十二分，她回到围炉里之间。从那以后，一直在所有人的眼前。
ritsu: 十点整，雪停了。她和有马先生来回的脚印，早已被吹雪吃得干干净净。
ritsu: 十点十五分，千雪小姐一个人去了水车小屋。站在屋檐下，看见了小屋另一边那一点红光。她没有进去。
ritsu: 十点四十五分，冰化开了。水车挣脱出来，开始转动。凸轮推动唐臼，杵落了下来。
ritsu: 有马先生，在最初的几下里就死了。
ritsu: 七轮被叶板一刮，翻进了化开的水槽，被冲到下游的冰底下。凶手什么也不用回收。
ritsu: 那时候，女将正在围炉里之间，给熊谷先生和桐谷医生温酒。
ritsu: 和二十年前一样的发簪。一样的水车小屋。一样的、雪地上唯一一行脚印。
ritsu: 村子会替她，把罪送进雪里。
@se heartbeat
: 律的话停了。
: 地炉里，炭火轻轻地爆了一声。
genichiro: ……
: 源一郎用拐杖撑着地，盯着律看了很久。然后，他转过头，看着跪坐在那里的雅。
genichiro: ……投票。
renji: ……是。
renji: 每人一票。请把投票札……投给你认为杀了有马骏的人。
@bgm judge
@game ch1_g11
@se gavel
renji: ……开票。
: 莲司打开木箱，一块一块地数着木札。他的手很稳。每数一块，就停一下。
renji: 白峰雅……二十六票。
renji: 冬木千雪……两票。
renji: 白峰雅。……多数。
@se heartbeat
: 两票。律看见阿部文攥着投票札的手，还在微微发抖。
genichiro: ……哼。
genichiro: 约定就是约定。东京来的小子。
genichiro: 关起来。等警察。
@bgm sad
: 雅没有哭。
: 她慢慢地抬起头，看着圈子里的每一个人。最后，看向了千雪。
miyabi: ……我二十二岁的时候，在东京嫁给了他。
miyabi: 有马骏。那时候他是个很会说话的人。
miyabi: 结婚第二个月，他第一次打我。第一年，肋骨断了两根。
: 她抬起左手，把袖口往上拉了一点。手腕内侧，几个圆圆的、发白的旧疤，一个挨着一个。
miyabi: 烟头。他喝醉了，就用烟头烫。一边烫，一边笑。
miyabi: 湊出生以后，他打得少了。可是有一天，湊哭了，他拿起烟灰缸——
miyabi: 平成六年的秋天，我抱着两岁的湊，从那个家里逃了出来。只带了一只包。
miyabi: 改了名字，换了好几个地方。在东京的一家旅馆里打工的时候，遇见了来办事的莲司。
: 她看了莲司一眼。
miyabi: 他什么都没有问。
miyabi: 不问我从哪里来，不问湊的父亲是谁。只问我，愿不愿意去一个下雪的村子。
renji: ……雅。
miyabi: 八年。这是我这辈子，过得最安稳的八年。
miyabi: 去年，有马拿着卖山的合同，找到了这个村子。
miyabi: 他认出了我。认出了湊。
miyabi: 他说要把湊带回去。说要打官司，争抚养权。说要钱，要很多很多钱。
miyabi: 他看湊的眼神……和当年看我的眼神，一模一样。
@se heartbeat
miyabi: 昨天下午，他当着湊的面，掐住了我的手腕。湊就站在走廊里，看着。
miyabi: 我看见湊的脸。……我就想，不行了。
miyabi: 昨天早上，阿部婆婆跟我讲了二十年前的事。发簪，水车小屋，雪地上的脚印。
miyabi: 前天晚上，我也听见了白蛾的广播。
miyabi: 我想……村子会替我，把罪送进雪里。
miyabi: 像二十年前那样。谁也不会去看一只酒杯，谁也不会去数一瓶药。
miyabi: 我只是想让那个人……再也碰不到湊。
: 她站起来，走到千雪面前。在草席边上，跪了下去，深深地低下了头。额头几乎碰到了榻榻米。
miyabi: 冬木小姐。对不起。
miyabi: 我借用了你母亲的故事。
chiyuki: ……
: 千雪看着她，嘴唇在发抖。她想说什么，最后什么也没说出来。只是蹲下身，扶住了雅的肩膀。
minato: ……妈妈。
: 湊从莲司身边站了起来。他手里攥着那个小本子，攥得变了形。
minato: 妈妈……我把时间记下来了……
minato: 我都记下来了……对不起……对不起……
: 他哭了。十一岁的孩子，第一次在所有人面前，哭出了声音。
miyabi: ……湊。
: 雅想伸手，又停住了。她看着儿子，看了很久，然后笑了。不是那个量过尺寸的笑。
miyabi: 湊没有做错。
miyabi: 时间，是不会说谎的。……妈妈很高兴，你是一个不说谎的孩子。
: 莲司走过去，把湊紧紧地抱进了怀里。湊把脸埋在他的棉袄里，哭得浑身发抖。
renji: ……我在。湊，我在。
@trial off
@bg sabakiya
@bgm sad
@caption 2月14日 12:30 裁屋
: 真壁和熊谷一左一右，站到了雅的身边。雅自己站了起来，整了整衣襟。
sumi: ……我先去神社。开雪牢，点灯。
: 澄站起身，向众人行了一礼，先一步走出了裁屋。按照古法的规矩，押送罪人之前，宫司要先去雪牢焚香。
: 澄先一步往神社去了。
: 雅在门口停下来，回头看了一眼。湊还埋在莲司的怀里，没有抬头。
miyabi: ……莲司君。湊，拜托了。
renji: ……嗯。
: 门开了。外面白茫茫的一片。三个人的背影，慢慢地走进了雪里。
: 村民们一个接一个地散去，没有人说话。
: 霜跪在地炉边，一只一只地收着茶碗。千雪走过去，在她身边蹲下，帮她一起收。
@caption 2月14日 12:40 裁屋
@se chime
: 窗外，防灾喇叭响起了提示音。
: 叮——咚——叮——咚——
@bgm stop
: 正要走出门的村民们，一下子全都停住了。
: 霜手里的茶碗，停在了半空。
@filter dark
@bgm horror
hakuga: 一片雪，落水车。杵声捣到天明时。
: 还是那个声音。冰冷，忽高忽低。底下，是很深很深的哀伤。
hakuga: ……我没有杀他。
hakuga: 是你们自己。
@se heartbeat
hakuga: 二片雪，就要落到屋檐上了。
@se chime
: 叮——咚——
: 喇叭沉默了。
@filter none
: 霜还跪在那里，手里捧着那只茶碗，一动不动。千雪轻轻地碰了碰她的手。
chiyuki: ……霜小姐？
: 霜像是被惊醒了一样，低下头，把茶碗放进了托盘里。她的手指，在发抖。
> 白蛾在听着这场寄合。
> 听着我们投票，听着女将被带走——然后，才开口。
@poem 二片雪，落屋檐，雪上不见来时路。

@bg watermill
@weather snow
@filter none
@bgm lament
@caption 2月14日 13:10 水车小屋
@se wind
: 午后，雪又细细地下了起来。
: 水车小屋前，熊谷抡着大锤，把一根根粗木桩砸进水车的轮辐之间。每砸一下，木轮子就发出一声闷闷的呻吟。
@se crash
: 最后一根木桩砸了进去。熊谷扔下锤子，喘着粗气，站在那里看着水车。
: 冰柱已经被砸掉了。木轮子湿漉漉地立着，被木桩死死地卡住，一动也不动。
: 唐臼的杵，又一次悬在了半空。
@show sayo[normal] C
sayo[normal]: ……律君。
ritsu: 嗯。
sayo[normal]: 这次的凶手，不是白蛾。
sayo[normal]: 是女将自己。她用的是白蛾的广播，二十年前的故事，村子的古法。
sayo[think]: 可是白蛾……好像早就知道，会有人这么做。
sayo[normal]: 「一片雪，落水车」。广播在前天晚上就唱了。
sayo[dark]: 就像是……白蛾只是打开了一扇门。走进去的人，是我们自己。
: 小夜的声音里，没有「～」。
@hide
: 律看着那架被钉死的水车。
> 我没有杀他。是你们自己。
> 白蛾说的，也许是真话。
> 可是，打开那扇门的人，又是谁。
: 回去的路上，两个人经过白峰本宅。本宅侧面，雪庭的深处，有一间矮矮的离屋。窗户全用纸糊死了，雨户紧紧地关着。
: 离屋里，传出一个老人含混不清的声音。
@bg snow_garden
@caption 2月14日 13:20 白峰本宅·雪庭
genichiro{离屋里的声音}: ……雪绘……
genichiro{离屋里的声音}: 雪绘……你回来了……
genichiro{离屋里的声音}: 你回来了啊……
@se heartbeat
: 那个声音停了。只剩下雪落在雪上的声音。
: 律和小夜站在雪庭的门口，谁也没有说话。

# ch1_interlude
@fade out
@bgm stop
@bg black
// （技术修正）引擎的黑场遮罩在标题卡之上，先在黑底上淡入，标题卡才看得见
@fade in
@wait 600
@title 雪之间|二
@fade out
@bg charcoal_hut past
@filter dark
@bgm lament
@fade in
@caption 雪之间
: 夜里，我总是梦见水车。
: 冻住的水车。黑黢黢的轮子上挂满了冰柱，像一排獠牙。
@flashback on
@bg watermill
@filter night
: 那天晚上，我推开水车小屋的门。
: 油灯倒在地上，还没有灭。灯光里，躺着一个男人。
: 还有一个女孩。
: 她跪在稻草上，两只手攥着一根铁杵，攥得指节发白。斗篷的红里子翻在外面，像一摊血。
: 她抬起头看我。十六岁的脸，白得像纸。
: 她的嘴唇在动，却发不出声音。——那时候我还不知道，没过几天，我也会变成那样。
: 我从她手里，把铁杵一根一根手指地掰下来，扔进稻草堆。
: 我对她说：
: 「你今晚没有来过这里。」
: 「回去。洗手，睡觉。什么都别说。」
: 「……什么都别说。」
: 她跑了出去。雪地上，她的脚印一路歪歪扭扭地通向山上的神社。
: 我在那里站了一会儿。男人的怀里，露出半截红色的东西——是我的发簪。那天晚上在旅馆，他从我头上扯下来的那一支。
: 我没有去拿。
: 我不知道为什么没有去拿。也许那一刻我已经想好了。也许，我只是太累了。
@flashback off
@bg charcoal_hut past
@filter dark
: 醒来的时候，天还没亮。
@se bell
// 【线索】召集村人的是火见橹的半钟——2003 年那口钟早已裂开、不再响
: 山下传来钟声。是火见橹上的半钟。三下，停一停，又是三下。
: ——那是召集全村的钟。
: 老人坐在门口，抽着烟，一动不动地听着。
gonzo{老人}: 又在敲了。
: 他没有说为什么。我也没有办法问。
: 我只是在心里一遍一遍地想：那个女孩，有没有洗手。有没有睡着。
: 有没有，什么都别说。
@fade out
@filter none
@bg black
@fade in
@chapterend

// ════════════════════════════════════════
//  坏结局一「雪中的母女」
// ════════════════════════════════════════
# ch1_be_ch1
@goto ch1_be_mother

# ch1_be_mother
ritsu: ……
@bgm stop
: 律没有说话。
: 他看着站在地炉前的千雪，张开了嘴，又合上了。
> 她自己选的。
> 一个已经精疲力尽的人，我还能拿什么去拦她。
chiyuki: ……谢谢您，七濑先生。
: 千雪看着他，轻轻地笑了一下。
chiyuki: 没有拦我。
sayo: 律君！
: 小夜抓住了他的袖子。她的声音里，没有「～」。
sayo: 律君，你说话啊！你明明知道的——
: 律没有动。
genichiro: ……哼。
genichiro: 侦探，也就这点能耐。
genichiro: 投票。
@bgm judge
: 投票札一块一块地落进木箱里。木头碰着木头，嗒，嗒，嗒。
: 律手里的那一块，一直攥在掌心里。他没有投。
renji: ……冬木千雪。二十七票。
renji: 白峰雅……一票。
: 那一票，是谁投的，律不知道。
: 也许是小夜。也许是霜。
genichiro: 雪牢。明天黎明，送。
@se gavel
@trial off
@bg snow_prison
@filter cold
@bgm lament
@caption 2月14日 23:00 白蛾神社·雪牢
: 雪牢是神社后面的一间冰室。四面是冻住的冰墙，正面是一排粗木格子，地上铺着一层稻草。
: 一盏油灯挂在冰墙上，火苗一动不动。
: 千雪坐在稻草上，穿着白峰屋的浴衣，外面披着自己的大衣。
@show chiyuki[sad] C
chiyuki[sad]: ……七濑先生，您不用陪我的。
chiyuki[sad]: 外面很冷。
ritsu: ……
chiyuki[normal]: 我想了一个晚上。妈妈那时候，是不是也坐在这里。
chiyuki[normal]: 是不是也这么冷。是不是也……有人在外面，什么都没有说。
@hide
@se snowstep
: 雪地上响起了脚步声。
: 霜提着一只竹篮，走到木格子前面。篮子里，是两只还冒着热气的饭团。
@show shimo[normal] C
: 她把饭团从格子的缝隙里递了进去。千雪接过来，捧在手里。
chiyuki[sad]: ……霜小姐。
: 霜取下胸前的石板。她的手抖得厉害，粉笔断了一次。她捡起半截，又写。
shimo: （石板）活下去
@se heartbeat
: 只有三个字。歪歪扭扭的，被粉笔断开的地方，补了好几笔。
chiyuki[sad]: ……
chiyuki[smile]: 谢谢。饭团，很好吃。
: 霜把石板抱在胸前，跪在冰冷的雪地上，隔着木格子，看着千雪吃完了两只饭团。
: 她一直没有站起来。
@hide
@bg okurimon
@weather blizzard
@filter cold
@bgm stop
@caption 2月15日 05:50 送门
@se wind
: 黎明前，吹雪又刮了起来。
: 送门是村子西北角的一座木门。门外，一条窄窄的小路伸进雪葬谷的白雾里，看不到尽头。
: 村民们提着灯笼，站在门的两边。没有人说话。
: 千雪穿着一身白衣，站在门前。头发散着，没有发簪。
: 熊谷提着一盏灯，站在她的身边。他是「送人」。二十年前，也是他。
@show kumagai[sad] C
kumagai[sad]: ……走吧。
: 他的手在抖。抖得那盏灯笼一晃一晃，火苗几次差点被风吹灭。
: 他用另一只手攥住提灯的手腕，还是提不稳。
kumagai[sad]: ……二十年前……也是这样的雪……
@hide
: 千雪回过头，看了一眼人群。
: 她的目光找到了律。停了一下，又移开了。
: 然后，她转过身，走出了送门。
: 白衣在吹雪里，一下子就看不清了。
@poem 五片雪，落送门，白衣人儿不回头。
: 她没有回头。
: 人群的最后面，有一个人影动了。
: 霜推开身前的人，冲出了送门。左手的毛线手套掉在了雪里，她也没有捡。
kumagai: 喂——！回来！
: 熊谷伸手去拽，只抓住了一把风雪。
: 霜在没膝的雪里跌跌撞撞地追着那个白色的背影。她张大了嘴。
: 她在喊。
: 可是什么声音也没有。
: 她喊不出那个名字。
@se wind
: 两个人影，一前一后，被白雾吞了进去。
: 吹雪很快就把她们的脚印，吃得干干净净。
@bg black
@weather none
@filter none
@bgm lament
@caption 二月十八日 · 之后
: 二月十八日的清晨，除雪车和警车从旧林道开进了村子。
: 有马骏被害一案，报告书上写着：嫌疑人于暴风雪中失踪，推定死亡。
: 和二十年前，一字不差。
: 四月，雪化了。县警沿着送道搜了三天。
: 送道的尽头，什么也没有找到。
: 霜也没有回来。
: 那只掉在雪里的灰色毛线手套，是阿部婆婆在春天的泥水里捡到的。左手的那一只。
: 白峰屋的女将依然每天站在玄关，笑着迎接客人。湊每天中午对着报时校准他的表。
: 一秒都不差。
> 我没有投票。
> 我以为，不投票，就不算是那个村子的一部分。
> 可是那天，在裁屋里，我什么都知道。我知道她没有进去。我知道那一点红光是什么。
> 我只是什么都没有说。
> 二十年前，三十一户人家投了票。没有一个人说「等一等」。
> 二十年后，我站在同一个圈子里。
@bgm stop
@wait 800
@poem 我沉默了。\n和二十年前那个村子一样。
@ending be_ch1
`
});
