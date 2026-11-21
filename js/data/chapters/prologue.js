/* 序章「雪葬之村」 —— 2003 年 2 月 12 日 */
DM.registerChapter({
  id: 'prologue',
  title: '序章',
  name: '雪葬之村',
  next: 'ch1',
  start: 'prologue_start',

  evidence: {
    prologue_letter: { name: '署名「冬木千雪」的信', icon: 'letter',
      desc: '寄到七濑侦探事务所的挂号信：「二十年前的冬天，我的母亲被村子『送进了雪里』……二月十四日，雪送祭。请来。」信纸是一整张没有折过的厚和纸，装在大号牛皮纸信封里平平整整地寄来；对着光，纸里透出一只展翅白蛾的水印。邮戳是山下的小镇。——冬木千雪本人说，她没有写过这封信。' },
    prologue_letter2: { name: '千雪收到的匿名信', icon: 'letter',
      desc: '寄到仙台千雪住处的信，没有署名：「你母亲是无辜的。二月十四日，雪送祭。」同样是一整张没有折痕的厚和纸，对光同样透出白蛾的水印，邮戳也是山下的小镇。千雪没有告诉任何人，自己提前两天来了。' },
    prologue_broadcast: { name: '白蛾的广播', icon: 'radio',
      desc: '21:00，防灾广播的提示音之后，一个经过变声器处理的声音：「这里是白蛾。……桥已经断了。……二十年前的冬天，你们把一个女人送进了雪里。她的女儿，今天回来了。……依照古法，雪封之日，寄合裁之。」随后唱了《雪葬之歌》前六句，第七段只哼了旋律。' },
    prologue_gossip: { name: '阿部文的大叫', icon: 'testimony',
      desc: '18:20，来白峰屋送信的阿部文顺手翻看登记簿，看到「冬木千雪」的名字，大叫：「是雪绘的女儿！」——在那之前，村里没有任何人知道千雪是谁（下午在杂货店，阿部还当着千雪的面讲了「杀人寡妇」的旧事）。消息在围炉里之间当场传开。' },
    prologue_alibi: { name: '三人的行踪', icon: 'testimony',
      desc: '17:00～18:00，莲司与湊带着律、小夜、千雪三人在村里转了一圈，三人始终在一起，向导一步也没离开（湊的时刻本：17:00 公民馆 → 17:58 回到白峰屋）。霜的石板：「六点回来以后，三位客人没有出去过。」——直到 21:05 广播之后众人冲出门。' },
    prologue_bridge: { name: '断开的主索', icon: 'bridge',
      desc: '白蛾桥的主索在村子一侧的锚碇处断开，桥面垂进了雪葬谷。断口整齐，是剪钳一根一根剪断的。一部分钢丝的断口里嵌着细细的稻草纤维，另一部分断口却干干净净、闪着新的亮光。锚碇上新缠的注连绳也被割开了。16:20 三人过桥时，桥还好好的。' },
    prologue_junction: { name: '被剪断的电话线', icon: 'cable',
      desc: '桥头旁的灰色接线箱。全村唯一的一根电话线经这里接出村外，箱门被撬开，线被剪断。16:50，有马还在白峰屋的围炉里之间打过电话——傍晚时线路是通的。' },
    prologue_radio: { name: '没有电池的无线电', icon: 'radio',
      desc: '驻在所桌上的无线电，电池盒是空的。真壁每天只在早上九点与镇上通一次话，今早还好好的。他每天中午去白峰屋吃饭，驻在所从来不锁门——「村里没有小偷」。' },
    prologue_timer: { name: '定时录音机', icon: 'tape',
      desc: '公民馆广播室的盒式录音机，带定时功能，平时收在器材柜里，用来在祭典时自动播放录好的通知。21:40 发现它被接在了播音台上，定时拨在 21:00，磁带还在里面。广播室的门是锁着的。17:00 律看到它时，它还在柜子里。（录音机与磁带已交真壁保管）' },
    prologue_keys: { name: '广播室的钥匙', icon: 'key',
      desc: '广播室的钥匙一共三把：村长的一把挂在白峰屋账房的柱子上；邮局的一把挂在阿部商店柜台后面的钉子上；神社的一把挂在社务所里。都挂在别人看得见、摸得着的地方——只要是村里的人，要借，不难。' }
  },

  explore: {
    prologue_tour: {
      title: '雪葬村·黄昏',
      mode: 'free',
      start: 'community_hall',
      places: ['community_hall', 'watchtower', 'school', 'shiramine_hall', 'jizo', 'village_road', 'store', 'police_box', 'inn_hearth'],
      filter: 'dusk',
      weather: 'snow',
      spots: {
        community_hall: [
          { anchor: 'timer_deck', label: '报时器', run: 'prologue_s_timerdeck' },
          { anchor: 'cabinet', label: '器材柜', run: 'prologue_s_cabinet' },
          { anchor: 'console', label: '播音台', run: 'prologue_s_console' },
          { anchor: 'log_book', label: '广播记录', run: 'prologue_s_logbook' }
        ],
        watchtower: [
          { anchor: 'bell', label: '顶上的钟', run: 'prologue_s_bell' },
          { anchor: 'plaque', label: '木牌', run: 'prologue_s_plaque' },
          { anchor: 'ladder', label: '铁梯', run: 'prologue_s_ladder' }
        ],
        school: [
          { anchor: 'notice', label: '门上的木牌', run: 'prologue_s_schoolnotice' },
          { anchor: 'blackboard', label: '黑板', run: 'prologue_s_blackboard' },
          { anchor: 'desks', label: '课桌', run: 'prologue_s_desks' },
          { anchor: 'organ', label: '风琴', run: 'prologue_s_organ' }
        ],
        shiramine_hall: [
          { anchor: 'portraits', label: '遗像', run: 'prologue_s_portraits' },
          { anchor: 'documents', label: '旧文书', run: 'prologue_s_documents' },
          { anchor: 'butsudan', label: '佛坛', run: 'prologue_s_butsudan' }
        ],
        jizo: [
          { anchor: 'nameless_jizo', label: '没有名字的地藏', run: 'prologue_s_namelessjizo' },
          { anchor: 'jizo_row', label: '一排地藏', run: 'prologue_s_jizorow' }
        ],
        village_road: [
          { anchor: 'nozzles', label: '湿漉漉的路面', run: 'prologue_s_nozzles' },
          { anchor: 'shed', label: '柴棚', run: 'prologue_s_shed' },
          { anchor: 'yukawa', label: '冒热气的小溪', run: 'prologue_s_yukawa' },
          { anchor: 'houses', label: '路边的人家', run: 'prologue_s_houses' }
        ],
        store: [
          { anchor: 'cigarettes', label: '香烟架', run: 'prologue_s_cigarettes' },
          { anchor: 'shelves', label: '杂志架', run: 'prologue_s_magazines' },
          { anchor: 'phone', label: '公用电话', run: 'prologue_s_cardphone' },
          { anchor: 'window', label: '窗外', run: 'prologue_s_storewindow' }
        ],
        police_box: [
          { anchor: 'radio', label: '无线电', run: 'prologue_s_radio' },
          { anchor: 'ashtray', label: '烟灰缸', run: 'prologue_s_ashtray' },
          { anchor: 'stove', label: '铁炉', run: 'prologue_s_stove' },
          { anchor: 'locker', label: '储物柜', run: 'prologue_s_locker' }
        ],
        inn_hearth: [
          { anchor: 'irori', label: '围炉里', run: 'prologue_s_irori' },
          { x: 120, y: 120, label: '黑色电话', run: 'prologue_s_innphone' },
          { anchor: 'sake_shelf', label: '酒架', run: 'prologue_s_sakeshelf' }
        ]
      },
      people: {
        community_hall: [ { char: 'renji', run: 'prologue_t_renji', x: 150 } ],
        watchtower: [ { char: 'minato', run: 'prologue_t_minato', x: 320 } ],
        shiramine_hall: [ { char: 'yomoda', run: 'prologue_t_yomoda', x: 270 } ],
        jizo: [ { char: 'kumagai', run: 'prologue_t_kumagai', x: 340 } ],
        village_road: [ { char: 'villager', run: 'prologue_t_villager', x: 300 } ],
        store: [ { char: 'abe', run: 'prologue_t_abe', x: 230 } ],
        police_box: [ { char: 'makabe', run: 'prologue_t_makabe', x: 260 } ],
        inn_hearth: [
          { char: 'kiriya', run: 'prologue_t_kiriya', x: 140 },
          { char: 'arima', run: 'prologue_t_arima', x: 360 }
        ]
      },
      done: {
        need: ['flag:prologue_met_renji', 'flag:prologue_met_minato', 'flag:prologue_met_yomoda', 'flag:prologue_met_kumagai',
               'flag:prologue_met_abe', 'flag:prologue_met_makabe', 'flag:prologue_met_kiriya', 'flag:prologue_met_arima'],
        run: 'prologue_tour_end',
        prompt: '天快黑透了。莲司说，该回旅馆了。'
      }
    },

    prologue_bridge: {
      title: '断桥',
      mode: 'investigate',
      start: 'bridge_cut',
      places: ['bridge_cut'],
      custom: {
        bridge_cut: { bg: 'bridge', variant: 'cut', name: '白蛾桥·村侧桥头', area: 'bridge' }
      },
      filter: 'cold',
      weather: 'snow',
      spots: {
        bridge_cut: [
          { anchor: 'anchor', label: '锚碇', run: 'prologue_b_anchor' },
          { anchor: 'shimenawa', label: '注连绳', run: 'prologue_b_shimenawa' },
          { anchor: 'junction_box', label: '接线箱', run: 'prologue_b_junction' },
          { anchor: 'valley', label: '垂下去的桥面', run: 'prologue_b_deck' },
          { anchor: 'nameplate', label: '铭牌', run: 'prologue_b_nameplate' },
          { anchor: 'far_tunnel', label: '对岸', run: 'prologue_b_far' }
        ]
      },
      people: {
        bridge_cut: [
          { char: 'kumagai', run: 'prologue_bt_kumagai', x: 120 },
          { char: 'renji', run: 'prologue_bt_renji', x: 250 },
          { char: 'makabe', run: 'prologue_bt_makabe', x: 380 }
        ]
      },
      done: {
        need: ['prologue_bridge', 'prologue_junction'],
        run: 'prologue_bridge_end',
        prompt: '桥这边能看的都看过了。去驻在所，用无线电联络镇上吧。'
      }
    }
  },

  games: {
    prologue_g1: {
      type: 'debate', title: '证言交锋（练习）',
      ammo: ['prologue_timer', 'prologue_letter', 'prologue_bridge', 'prologue_radio'],
      lines: [
        { who: 'kumagai', expr: 'angry', text: '这种东西，是{外人从外面}带进来的录音！在东京录好了，揣在包里带进村的！' },
        { who: 'abe', expr: 'angry', text: '那三个人{一来}就出事，哪有这么巧的事！' },
        { who: 'villager', expr: 'dark', text: '那个判官丫头，最会{装神弄鬼}。宵鸦岛的事，周刊上都写着呢。' }
      ],
      answer: { line: 0, weak: 0, ammo: 'prologue_timer' },
      hint: '那段录音是从哪里、怎么播出来的？播出它的机器，放在一个什么样的房间里？',
      wrong: '……不对。这件证据说明不了那段录音是怎么播出来的。'
    },
    prologue_g2: {
      type: 'debate', title: '证言交锋（练习）',
      ammo: ['prologue_alibi', 'prologue_keys', 'prologue_gossip', 'prologue_broadcast', 'prologue_timer'],
      lines: [
        { who: 'kumagai', expr: 'angry', text: '那就是他们拿了钥匙，{偷偷溜出去}装进了公民馆！' },
        { who: 'abe', expr: 'normal', text: '我店里那把钥匙，{谁都能拿}。挂在钉子上，又没上锁。' },
        { who: 'villager', expr: 'dark', text: '外人在村里走来走去，{有谁盯着}他们了？' },
        { who: 'kiriya', expr: 'sad', text: '定时的机器……{人不在跟前}，也能放出来吧……' }
      ],
      answer: { line: 0, weak: 0, ammo: 'prologue_alibi' },
      hint: '五点以后，三个人身边一直有谁？六点回旅馆以后呢？',
      wrong: '……不对。这件证据推翻不了那句话。'
    },
    prologue_g3: {
      type: 'present',
      prompt: '剪断吊桥的人，当时站在桥的哪一边？能说明这一点的证据是——',
      answer: 'prologue_bridge',
      hint: '主索是在哪一头断开的？三个人过桥的时候，桥又是什么样子？'
    },
    prologue_g4: {
      type: 'logic', title: '推理回廊（练习）',
      questions: [
        { q: '广播里说「她的女儿，今天回来了」。村里人是几点才知道千雪小姐是谁的？', opts: ['16:40 登记入住的时候', '18:20 阿部婆婆翻登记簿的时候', '21:00 听到广播的时候'], a: 1 },
        { q: '那么，把这段录音装进广播室的人，最早什么时候才能进去？', opts: ['17:00 报时的时候', '中午', '18:20 以后'], a: 2 },
        { q: '18:20 以后，律、小夜、千雪三个人在哪里？', opts: ['一直在白峰屋，没有出去过', '在村里到处走', '在吊桥边'], a: 0 },
        { q: '吊桥是从哪一边、什么时候剪断的？', opts: ['对岸，16:20 以前', '村子这一边，16:20 以后', '村子这一边，16:20 以前'], a: 1 },
        { q: '结论是？', opts: ['白蛾是外来者之一', '白蛾已经从对岸逃走了', '白蛾非常熟悉这个村子，此刻就在村子里'], a: 2 }
      ],
      hint: '录音里的内容、广播室的钥匙、断桥的位置——每一样都指向同一个方向。'
    }
  },

  script: String.raw`
# prologue_start
@bg black
@bgm stop
@weather none
@filter none
@wait 800
@poem 一片雪，落水车，杵声捣到天明时。
: ……是孩子们的歌声。从很远很远的地方，被风一阵一阵地送过来。
@poem 二片雪，落屋檐，雪上不见来时路。\n三片雪，落汤池，热汤暖不了冷心。
: 歌声一句比一句远，一句比一句轻。像一列慢慢走进雪里的队伍。
@poem 四片雪，落面上，面具底下是谁的脸。\n五片雪，落送门，白衣人儿不回头。\n六片雪，白蛾归——
: 然后，歌声停了。
: 只剩下一段没有词的旋律。很慢，很轻，像有人在黑暗里，一下一下地拍着一个孩子的背。
: 第七片雪。没有人唱。
@wait 800
@se wind
@bgm snow
@caption 2003年2月12日 13:10 奥羽本线
: 列车在雪原里穿行。
: 窗外的白一直铺到天边。偶尔掠过一根电线杆、一间被雪压弯了屋脊的农舍，又被白吞了回去。
: 暖气开得很足，车窗内侧结着一层水汽。律用指节擦出一小块透明，把信纸贴了上去。
> 纸很厚。不是文具店的信笺，是和纸。手漉的那种，纤维里还看得见一丝一丝的楮皮。
: 雪地的反光从背后透过来。纸的正中，慢慢浮出一个淡淡的影子。
: 一只展开双翅的蛾子。翅膀上有细细的纹路，两根触角像羽毛一样弯着。
> 水印。
> 而且没有一道折痕。寄信的人特意用了一只大信封，让这张纸平平整整地寄到我手上。
@show sayo[smile] C
sayo[smile]: 律君～又在跟那封信大眼瞪小眼？
: 对面的座位上，乌丸小夜捧着一只纸盒。盒盖上印着「雪见大福」四个字，是在仙台换车时买的。
sayo[smile]: 要不要来一个？外面一层雪白的糯米皮，里面是红豆沙，还裹着一整颗草莓哦～
ritsu: 那是第三个了。
sayo[smile]: 第四个。侦探先生的观察力下降了～
: 她用左手拈起一只大福。右手戴着一只白手套，按在膝头摊开的一份小报上。
ritsu: 在看什么。
sayo[smile]: 你看你看——
: 小夜把小报转过来。社会版的角落里，有一张模糊的照片：一个围着红围巾的女孩的侧脸。
: 照片上方，是一行粗黑的标题。
sayo[normal]: 「宵鸦岛的判官，如今是侦探的助手」。
sayo[smile]: 写得好像我是什么吉祥物～「本周的侦探助手」，还附赠一张贴纸的那种。
ritsu: ……你不生气？
sayo[smile]: 生气的话，大福就不好吃了嘛。
sayo[normal]: 而且，他们写的也没错呀。
: 她把小报叠起来，塞进座位边的网兜里。白手套的指尖在报纸的边缘停了一下，才收回去。
@hide
> 乌丸小夜。
> 三年多以前，在一座叫宵鸦岛的岛上，她是戴着乌鸦面具、用广播审判了所有人的「判官」。
> 她要推翻的，是一个十二岁的孩子在法庭上说出的推理。——我的推理。
: 律低头看着自己的左手。掌心有一道笔直的旧疤，从食指根一直划到手腕。
: 他用拇指按了按那道疤。很久以前就不疼了。
@flashback on
@bg black
@caption 1999年10月 东京·记者会（回忆）
@se clock
: 闪光灯。一排又一排的麦克风。
ritsu: 九年前，在「白鹭馆事件」的法庭上作证的那个孩子，是我。
ritsu: 今天，我在这里推翻我自己的推理。
ritsu: ……我的推理，是错的。
: 第二天，所有报纸的头版都印着同一行字：「少年侦探的谎言」。
: 有人叫他「说出真相的侦探」。更多的人，叫他「骗子侦探」。
: 事务所的电话响了一个月。一半是记者，一半是骂人的。剩下的，几乎没有委托。
@flashback off
@bg black
@caption 13:25 奥羽本线
@show sayo[normal] C
sayo[normal]: 又在想记者会的事？
ritsu: ……你怎么知道。
sayo[smile]: 律君每次想那件事，都会去按手上的疤。助手的观察力～
sayo[normal]: 这封信，也是因为那场记者会才寄来的吧。
ritsu: 嗯。
: 律把信纸从车窗上揭下来，又读了一遍。
@letter 七濑侦探事务所　七濑律先生：\n\n冒昧来信。我在旧报纸上，读到了您三年前的那场记者会。\n一个肯当着所有人的面说「我的推理是错的」的侦探——我想，也许只有您，肯来听这个故事。\n\n二十年前的冬天，我的母亲被村子「送进了雪里」。
@letter 村里的人说，那是山神的旨意。说她是自己走进雪里去的。\n雪地上，只有她一个人的脚印。\n\n……二月十四日，雪送祭。\n\n请来。\n\n　　　　　　　　　　　　　冬木 千雪
@get prologue_letter
sayo[think]: 「送进了雪里」……
ritsu: 我查过。
ritsu: 「雪葬村」是俗称，正式的名字叫白峰村。山形和秋田交界的深山里，冬天只有一条路能进去。
ritsu: 县立图书馆里有昭和五十八年的地方报纸。二月十六日，社会版最下面，只有一小块。
@letter 白峰村村长长子遇害　嫌疑女子雪中逃亡\n\n本月十三日深夜，山形县白峰村村长白峰源一郎之长子惣一（二十六岁）于村内水车小屋遇害。\n同村一名女子（二十八岁）被视为嫌疑人，十四日夜于暴风雪中逃亡，下落不明。\n驻在所认为该女子已遇难，推定死亡。
sayo[think]: 「于暴风雪中逃亡」。
sayo[normal]: 和信上写的不太一样呢。报纸说「逃」，信上说「送」。
ritsu: 嗯。
ritsu: 报纸上没有写那个女人的名字。可写信的人姓冬木。二十年前她二十八岁，如果有个孩子——
sayo[normal]: 现在二十三四岁。和我差不多大。
ritsu: 先把能确定的事排出来。
ritsu: 一，二十年前，那个村子死了一个人。一个女人被当成凶手，在暴风雪里不见了。
ritsu: 二，有人用「冬木千雪」这个名字，叫我在二月十四日去那个村子。
ritsu: 三，信封上的邮戳是山下的小镇，不是村子里。
sayo[smile]: 四，二月十四日是情人节～
ritsu: ……那条不算。
sayo[smile]: 怎么不算，很重要的。雪山、温泉、情人节，三件套哦～
sayo[normal]: ……
sayo[normal]: 律君。「送进了雪里」，到底是什么意思呢。
ritsu: 不知道。
ritsu: 所以，要去看。
: 列车钻进一条隧道。车窗一下子黑了，玻璃上映出两个人的脸。
@hide

@bg tunnel
@weather none
@filter none
@bgm snow
@caption 15:50 旧隧道口·巴士终点站
@se wind
: 换乘的巴士在山路上爬了一个多钟头，最后钻出一条长长的旧隧道，在洞口外停了下来。
: 洞口外是一小块铲平的雪地，竖着一块铁皮站牌。漆掉了大半，还勉强认得出字。
: 「白峰村（冬季终点）」
villager{司机}: 冬天就到这儿。前面是吊桥，车过不去，走过去十来分钟。
villager{司机}: 回去的末班车，五点二十从这儿发。错过了，就得等明天中午。
villager{司机}: ……你们去雪葬村？这个季节？
sayo[smile]: 去看雪送祭～
villager{司机}: ……
: 司机没有再说话。他看了小夜一眼，又看了律一眼，关上车门。
: 巴士在雪地上掉了个头，摇摇晃晃地开回隧道里。尾灯的红光在隧道深处缩成两个点，然后不见了。
: 洞口上挂满了冰柱。长的有一人多高，一根挨着一根，像一排倒着长的牙。
@weather snow
: 一片雪，落在律的围巾上。
: 然后是第二片，第三片。
@show sayo[smile] C
sayo[smile]: 下雪了～
: 小夜张开左手去接。雪落在她的掌心，一下就化了。
sayo[normal]: ……化得好快。
@hide
: 隧道口外，是一道很深的山谷。谷底被雪填平了，看不出有多深。
: 对岸的山腰上，隐约能看见几个被雪压住的屋顶，和一缕细细的炊烟。
> 那就是雪葬村。

@bg bridge
@caption 16:10 白蛾桥
@se wind
: 山谷上架着一座吊桥。两根粗大的钢索从对岸桥头的石柱上斜拉过来，挂着一条窄窄的木桥面，在风里轻轻荡着。
: 桥面上每隔几步，挂着一盏小灯。二十几盏灯里，亮着的只有三四盏。
: 桥头站着一个人。
: 一个年轻的女人。深蓝色的呢子大衣，脚边放着一只小小的旅行箱。肩上积了一层雪，像是已经在那里站了很久。
: 她低头看着手里的一只大信封。牛皮纸的，和律口袋里那只一样大。
: 信封口露出一角纸。雪光照在上面，纸里隐约透出一只蛾子的影子。
> ……同样的纸。
ritsu: 请问。
: 女人回过头来。盘起的黑发间，插着一支红山茶的发簪，在一片白里红得刺眼。
ritsu: 我是七濑律。我收到了一封信，署名是——
@show chiyuki[normal] C
chiyuki: 我没有给您写过信。
@se heartbeat
: 她说得很快，很清楚。像是这句话，她已经在心里说过很多遍。
chiyuki[normal]: ……对不起。我在报纸上见过您的照片。三年前，那个记者会。
chiyuki[normal]: 刚才看见您从车上下来，我就想，会不会……
chiyuki[sad]: 有人用我的名字，给您写了信。对吗？
ritsu: 「二十年前的冬天，我的母亲被村子送进了雪里。」
chiyuki[sad]: ……
chiyuki[normal]: 我是冬木千雪。在仙台的医院当护士。
chiyuki[normal]: 我收到的，是这个。
: 她把信封递了过来。里面同样是一整张没有折过的厚和纸。只有两行字。
@letter 你母亲是无辜的。\n\n二月十四日，雪送祭。
@get prologue_letter2
: 没有署名，没有寄信地址。邮戳是山下的小镇。
: 律把两张纸并在一起，对着雪光举起来。两只白蛾，一模一样。
sayo[think]: 同一个人写的。给律君的信冒用了千雪小姐的名字，给千雪小姐的信干脆不写名字。
sayo[normal]: 这个人想让你们两个，在同一天出现在同一个地方。
chiyuki[normal]: 二月十四日。……可我提前来了。
chiyuki[normal]: 我没有告诉任何人。外婆也不知道。她要是知道，一定不让我来。
ritsu: 你什么时候到的？
chiyuki[normal]: 坐的是早一班的车。三点二十左右过的桥。
chiyuki[normal]: 刚才过桥的时候，有位巫女小姐在桥头换绳子。白衣服，红裙子。她对我笑了一下。
chiyuki[sad]: 我连路都没敢问。
chiyuki[sad]: 过了桥，走到村口，看见那些屋顶……就走不动了。
chiyuki[sad]: 我又走回来了。本来打算坐五点二十的车，回仙台去。
: 她低下头，看着自己的靴尖。雪落在她的发簪上，又化了。
chiyuki[normal]: 我母亲叫冬木雪绘。二十年前，她在这个村子里……被说成是杀了人。
chiyuki[normal]: 那年我三岁。什么都不记得。外婆只告诉我，妈妈在山里走丢了。
chiyuki[dark]: 十五岁的时候，我在外婆的柜子里找到了一张旧报纸。从那以后，我就知道了。
chiyuki[dark]: 我是杀人犯的女儿。
@show sayo[normal] L
@show chiyuki[sad] R
sayo[normal]: ……
sayo[smile]: 那，既然都到桥头了，就一起过去吧～
chiyuki[surprise]: 诶？
sayo[smile]: 有侦探在，有助手在。鬼也不敢出来的哦。
sayo[normal]: 而且，你不是想看看吗？不然也不会提前两天来，还在雪里站了这么久。
chiyuki[sad]: ……
chiyuki[normal]: ……您说得对。
chiyuki[normal]: 我来，就是为了看一看。
@hide
@caption 16:20 白蛾桥
@se creak
: 三个人踏上桥面。木板在脚下吱呀作响，整座桥跟着人的步子，轻轻地左右荡起来。
@show sayo[shock] C
sayo[shock]: 哇、哇——晃、晃得好厉害！律君！不许走那么快！
ritsu: 你抓的是我的围巾。
sayo[shock]: 围巾也是律君的一部分！
@hide
: 千雪一只手扶着钢索，一步一步地走，没有往下看。
: 风从谷底卷上来，钢索发出细细的、像琴弦一样的声音。
> ……比想象中晃得厉害。
: 走到桥中央时，律往下看了一眼。谷底是一片看不到边的白。
: 什么也看不见。

@bg bridge
@caption 16:25 白蛾桥·村侧桥头
: 桥的这一头，立着两根粗大的石柱。钢索从石柱后面绕下去，固定在地上一块巨大的水泥墩——锚碇上。
: 锚碇上缠着一圈崭新的注连绳。白生生的稻草，垂着几条折成闪电形状的白纸，在灰扑扑的雪景里格外显眼。
chiyuki[normal]: 就是那位巫女小姐绑的。
: 石柱上嵌着一块铜铭牌，生满了绿锈。律用手套抹掉上面的雪。
: 「白蛾桥　昭和五十七年十月竣工」
ritsu: 昭和五十七年……一九八二年。
sayo[think]: 才二十年？锈成这样。
ritsu: 山里的冬天，大概比城里长得多。
: 桥头另一边，立着一只灰色的铁皮箱子。一根黑色的电线从箱子里牵出来，沿着钢索，一直伸向对岸。
> 电话的接线箱。
> 这么说，这个村子和外面连着的，就是这一根线。
@se wind
: 暮色正在降下来。雪地上，有一个灰白色的小东西，一扑一扑地飞着。
sayo[surprise]: ……蛾子？冬天也有蛾子？
: 一只很小的白蛾，翅膀薄得几乎透明。它在雪面上飞了一小段，落下来，又飞起来，消失在暮色里。
chiyuki[normal]: ……白色的。
> 白色的蛾子。信纸里的那一只。
: 三个人沿着村道往村里走。身后，那座桥在风里轻轻地荡着，二十几盏灯里，只有三四盏亮着。

@bg inn_entrance
@bgm village
@caption 16:40 旅馆「白峰屋」·玄关
@se door
: 旅馆是一栋两层的老木屋，屋檐下挂着一排冰柱，门口的灯笼上写着「白峰屋」三个字。
: 推开格子门，一股暖气扑面而来，混着柴火、味噌和旧榻榻米的气味。
: 门边站着一个穿灰蓝色和服、系白围裙的女人。她深深地弯下腰，鞠了一躬。
@show shimo[normal] C
: 她抬起头时，律看见了她的脸。两边的脸颊上，有一大片发暗的、皱缩的旧伤疤，像是被什么冻坏过。
: 她没有说话。她从胸前取下一块用绳子挂着的小石板，用粉笔写了两个字，举起来给他们看。
shimo: （石板）欢迎。
: 她握粉笔的是右手。左手戴着一只灰色的毛线手套，一直垂在身侧。
@hide
miyabi: 霜，客人来了就快请进来呀。外面那么冷。
@show miyabi[smile] C
: 走廊深处，一个穿梅紫色和服、外罩黑羽织的女人快步走来。发髻梳得一丝不乱，笑容得体得像是量过尺寸。
miyabi[smile]: 欢迎光临白峰屋。我是这里的女将，白峰雅。
miyabi[smile]: 这个季节还有东京来的客人，真是少见呢。村里的人，大概要议论好几天了。
miyabi[normal]: 霜不会说话，请各位多包涵。她干活是一把好手，有什么需要，跟她说就行。
@hide
renji: ……雅，别站在门口说了。
@show renji[normal] C
: 一个穿橄榄色棉夹克的男人从里屋出来，下巴上一层青色的胡茬，眼睛下面挂着很深的阴影。
: 他的手指间夹着半支没点的烟，看见客人，又把它塞回了胸前的口袋里。
renji[normal]: 白峰莲司。这家旅馆的主人……也是村长。说是村长，其实……
renji[normal]: 村里的事，大半还是听老人们的。
renji[normal]: 七濑先生，对吧？听说是从东京来的侦探……
@hide
minato: 16:41。
@show minato[normal] C
: 一个戴着毛线帽的男孩站在楼梯口，低头看着手腕上的黑色电子表，用铅笔在一个小本子上写着什么。
minato[normal]: 客人到达，十六点四十一分。三个人。
renji[smile]: 这是湊。我儿子。……他喜欢记时间。
minato[normal]: 不是喜欢。是要记。不记下来，时间就不见了。
: 男孩抬起头，打量着律。
minato[normal]: 你就是侦探？
ritsu: 嗯。
minato[normal]: ……侦探哥哥。
: 他像是确认了一件事，点点头，又在本子上写了一笔。
@hide
: 玄关的柜台上摊着一本厚厚的登记簿。雅取过毛笔，蘸了蘸墨。
miyabi[smile]: 山里冷，手冻僵了写不好字。我替各位代笔吧，这是白峰屋的老规矩。
: 她的字很漂亮。一笔一画端端正正，又带着一点向右上方斜挑的劲儿。
: 「七濑律」「乌丸小夜」「冬木千雪」——三个名字依次落在纸上。
: 上面一行，是前天的日期，同一种字迹：「有马骏　东京都」。
> 「马」字最后一笔的钩，拖得特别长，像一条小尾巴。「平成」的「成」写得像一只展翅的鸟。
> ……职业病。看见什么都想记下来。
: 霜端着一只茶盘从里屋出来，要给客人递热毛巾。
: 她走到千雪面前，忽然停住了。
@show shimo[normal] C
: 她的视线，落在千雪发间那支红山茶的发簪上。
: 茶盘上的毛巾，冒着白白的热气。她的手停在半空，一动不动。
chiyuki: ……？
: 只有一瞬间。霜垂下眼睛，把热毛巾递到千雪手里，又深深地鞠了一躬，退回了里屋。
@hide
@caption 16:50 白峰屋·玄关
: 围炉里之间的纸门后面，传来一个男人打电话的声音。
arima{男人的声音}: ……对，那片山的事，月底就能签——
arima{男人的声音}: 老头子那边？放心。他儿子比他好说话。……嗯，下礼拜我再打给你。
: 电话「咔」地挂上了。纸门拉开，一个穿驼色大衣、头发梳得油亮的男人走了出来。
@show arima[smile] C
arima[smile]: 哟，又来客人了？这种鬼地方，这个季节。
arima[smile]: ……七濑律？在电视上见过。那个「骗子侦探」。
arima[smile]: 有马骏，有马开发。来这儿谈一笔大生意。名侦探先生，往后几天，多关照了。
: 他笑着拍了拍莲司的肩膀。莲司没有说话。雅在柜台后面合上了登记簿，脸上的笑容一点也没变。
@hide
renji: ……房间在二楼。行李让霜送上去吧。
renji[normal]: 天黑之前，我和湊带你们在村里转一圈？村子小，一个钟头就走完了。
minato: 现在是 16:54。五点有报时。在公民馆听，最清楚。
ritsu: 那就麻烦了。
chiyuki[normal]: ……我也一起去，可以吗。
renji[normal]: 当然。
: 莲司看了千雪一眼。看到她发间的红山茶时，他的眼神晃了一下，又移开了。

@bg community_hall
@filter dusk
@caption 16:59 公民馆·广播室
: 公民馆在村子中央的高处，是一栋平顶的水泥房子。旁边，一座木头搭的瞭望塔直直地戳进灰色的天空。
: 莲司用一把黄铜钥匙打开了广播室的门。屋里很冷，墙上挂着村子的地图，窗边的桌上摆着一排旋钮和一只话筒。
@show minato[normal] C
minato[normal]: 还有十秒。
: 湊抬起手腕，盯着电子表的液晶屏。
minato[normal]: 五，四，三，二，一——
@se chime
: 墙角的一只灰色铁盒「咔哒」响了一声。
: 屋外的喇叭里，流出一段缓慢的旋律。几个简单的音，升上去，又落下来，在雪的山谷里一圈一圈地荡开。
minato[smile]: 17:00:00。
minato[smile]: 我的表一秒都不差。
sayo[smile]: 好厉害～每天都对？
minato[normal]: 每天中午十二点，傍晚五点。一次也没漏过。
: 旋律停了。山谷里的回声又响了一会儿，也停了。
@hide
> 先在村里走走吧。这个村子的样子，还有住在这里的人。
> 二十年前的那个冬天，他们中的很多人，大概都在。
@explore prologue_tour

# prologue_s_timerdeck
: 墙角的灰色铁盒上有一只钟面似的刻度盘，两根指针分别插在「12」和「17」的位置。
renji: 报时器。每天中午和傍晚，自动放那段旋律。镇上的人来装的，比我们村里谁都准。
> 不需要人在场，到点就会响。
@return

# prologue_s_cabinet
: 器材柜里堆着祭典用的喇叭、成卷的电线、几盏旧灯笼。最上层放着一台银色的盒式录音机，比普通的大一圈，侧面有个定时旋钮。
renji: 那台是录通知用的。祭典的时候，事先把要讲的话录好，定好时间，它就自己播。
renji: 一年也用不了两三回。
@set prologue_saw_recorder
> 录音机，在柜子里。我记下了。
@return

# prologue_s_console
: 播音台上有一排旋钮、一只话筒和几个插孔。旋钮上的数字被手指磨得发亮。
renji: 用这个，全村的喇叭都能听见。召集寄合、通知雪送祭、找走丢的老人……都用它。
> 只要进得了这间屋子，谁都能对整个村子说话。
@return

# prologue_s_logbook
: 一本硬皮的广播记录。最后几页，是用圆珠笔写的潦草字迹。
: 「一月三十日　十九时　雪送祭筹备通知（白峰）」「二月一日　十二时　报时」……再往后，就只有报时了。
> 人手写的广播，已经快两个礼拜没有了。
@return

# prologue_t_renji
@if prologue_met_renji -> prologue_t_renji2
@show renji[normal] C
renji[normal]: ……让你们见笑了。这么旧的东西。
renji[normal]: 广播室平时锁着。钥匙一共三把——我一把，邮局的阿部婆婆一把，神社一把。
renji[normal]: 我那把挂在旅馆账房的柱子上。阿部婆婆那把……大概还是挂在她店里的钉子上。
sayo[normal]: 都挂在外面？
renji[smile]: 村里没有小偷。……至少，大家都这么说。
: 他走到窗边，从口袋里摸出一支烟，想了想，又放了回去。
: 窗外的暮色里，是一片被雪压低的屋顶。
renji[normal]: 村里现在只剩十九户。晚上亮灯的，也就十一二户。
renji[normal]: 老人走了，房子就空着。年轻人下了山，就不回来了。
renji[normal]: 我想……让村子跟上时代。修路，装电话，让孩子们不用一大早走三个钟头去镇上上学。
renji[sad]: 可是这种事，要长老们点头。他们……
: 他没有说下去。
@set prologue_met_renji
@note renji 村长，白峰屋的主人。温和、疲惫，说话总留半句。广播室钥匙三把：他（白峰屋账房）、邮局阿部、神社。「村里现在只剩十九户，晚上亮灯的也就十一二户。」
@return

# prologue_t_renji2
renji[normal]: 天黑以前，还能再走两三个地方。
renji[normal]: ……慢慢看吧。这个村子，也没有别的东西给客人看了。
@return

# prologue_s_bell
: 瞭望塔的顶上，挂着一口小小的铜钟。钟身上有一道黑色的裂缝，从钟口一直爬到肩上。
@if prologue_met_minato -> prologue_s_bell2
> 裂了。这样的钟，敲起来大概只会发出哑掉的声音。
@return

# prologue_s_bell2
> 1990 年冬天裂的。从那以后，就再也没响过。
> 以前，这个村子是靠这口钟召集寄合的。
@return

# prologue_s_plaque
: 塔脚下钉着一块木牌，墨迹被风雪磨得很淡。
: 「火见橹　昭和三十年建」。下面又用新一点的墨补了一行小字：「半钟　平成二年冬　破损　停用」。
> 平成二年。一九九〇年。
@return

# prologue_s_ladder
: 一架铁梯贴着塔身一直通到顶上。梯子的横档上结满了冰，像一节一节的玻璃。
renji: 别爬。冬天上去，十个人有九个要摔下来。
@return

# prologue_t_minato
@if prologue_met_minato -> prologue_t_minato2
@show minato[normal] C
: 湊仰着头，看着塔顶那口钟。
minato[normal]: 侦探哥哥，你看见那道裂缝了吗？
ritsu: 看见了。
minato[normal]: 上面的钟，1990 年冬天裂的。从那以后，再也没响过。
minato[normal]: 那时候我还没出生。是爸爸告诉我的。
minato[normal]: 以前村里开寄合，要上去敲钟。三下，停一停，再三下。现在不用了，用广播。
ritsu: 寄合？
minato[normal]: 村里的人聚在一起，商量事情。在裁屋。
minato[think]: ……爷爷说，以前的寄合，还会决定很可怕的事。
minato[normal]: 我问是什么事，爷爷就不说了。
: 他低头看了一眼电子表，在本子上写下「17:12 火见橹」。
minato[normal]: 钟坏了，时间就要靠我来记。
@set prologue_met_minato
@note minato 十一岁，莲司与雅的儿子。电子表每天对着公民馆 12:00 和 17:00 的报时校准，「一秒都不差」，什么都记在时刻本上。称律「侦探哥哥」。火见橹的半钟 1990 年冬天裂了，此后再没响过；以前寄合靠敲钟召集，现在用广播。
@return

# prologue_t_minato2
minato[normal]: 17:2……不对，现在要看一下。
: 他看了看表，又认真地写了一笔。
minato[normal]: 我不猜时间。猜的不算。
@return

# prologue_s_schoolnotice
: 一栋木造的平房，玻璃窗大半都碎了，用木板钉着。门上钉着一块褪色的木牌。
: 「白峰村立白峰小学分校　平成三年三月　停办」
renji: 最后一届，是六个孩子。……后来，村里就没有孩子了。
minato: 有我。
renji[smile]: ……嗯，还有你。你每天走三个钟头去镇上。
@return

# prologue_s_blackboard
: 教室的黑板没有擦。上面用粉笔写着歪歪扭扭的一行大字。
: 「再见了，分校！　平成三年三月十五日」
: 下面是六个孩子的名字，旁边画着一只张开翅膀的蛾子，翅膀上还点了几个圆圆的斑。
> 十二年前的粉笔字。没有人来擦，也没有人来写新的。
@return

# prologue_s_desks
: 一排排矮小的课桌，桌面上落着灰。千雪伸手摸了摸其中一张，指尖上沾了一道白。
@show chiyuki[normal] C
chiyuki[normal]: ……如果我没有离开，大概也会在这里上学吧。
chiyuki[sad]: 坐在哪一张桌子上呢。
: 她把手收回来，在大衣上轻轻擦了擦。
@hide
@return

# prologue_s_organ
: 教室角落里有一架脚踏风琴。琴键黄得像旧牙齿，琴盖上放着一本用麻绳装订的薄册子。
: 封面上用毛笔写着「唱歌」两个字。
> 孩子们在这里唱过歌。现在只剩下风从破窗户里灌进来的声音。
@return

# prologue_s_portraits
: 大广间的长押上，挂着一排黑框的遗像。几代穿着纹付羽织的老人，表情都一样严肃。
: 最边上一张不一样。一个年轻男人，头发向后梳着，嘴角挂着一点满不在乎的笑。
: 相框下面贴着一张小纸条：「白峰惣一　昭和五十八年二月十三日没　享年二十六」
renji: ……我哥哥。
: 莲司只说了这一句，就别开了脸。
@if prologue_met_yomoda -> prologue_s_portraits2
@return

# prologue_s_portraits2
> 四方田先生刚才看这张照片的时候，目光停了一下。
> 停得很短，很轻。像是在看一件早就知道的、不想再看的东西。
@return

# prologue_s_documents
: 榻榻米上堆满了用布包着的旧文书，一摞一摞，有的已经发黄发脆。一张矮桌上摊着放大镜和一叠写满小字的笔记。
yomoda: 那是白峰家几代人的账本、村里的寄合记录、婚丧簿……老村长托我整理的。
yomoda: 民俗学者的宝山啊。一页一页地翻，就像在跟死人说话。
@return

# prologue_s_butsudan
: 一座黑漆的大佛坛，金色的雕饰被香火熏成了暗褐色。供台上的线香刚刚燃尽，还剩一截灰。
> 有人每天来上香。
@return

# prologue_t_yomoda
@if prologue_met_yomoda -> prologue_t_yomoda2
@show yomoda[smile] C
: 一个戴圆眼镜、围着褐色长围巾的男人从文书堆里抬起头，扶了扶眼镜。
yomoda[smile]: 哦呀，客人？……莲司君，这几位就是今天到的？
yomoda[smile]: 四方田圭。研究民俗的。承蒙老村长不嫌弃，借住在本宅二楼，整理旧文书。
yomoda[normal]: 七濑君……是吧。我读过你的报道。
yomoda[normal]: 你们是来看雪送祭的？那可来对了。这一带，只有这个村子还保留着这个祭典。
sayo[smile]: 雪送祭，是什么样的祭典呀？
: 四方田的眼睛一下子亮了。他摘下眼镜擦了擦，又戴回去，像是终于等到了一个提问的学生。
yomoda[smile]: 这个村子的山神，叫「白蛾大人」。一只大得遮住整座山的白蛾子。冬天的雪，就是它抖落的鳞粉。
yomoda[normal]: 从江户时代起，雪封山的时候村里出了罪案，就由全村在裁屋开「寄合」，投票裁定罪人。
yomoda[normal]: 被裁定的人穿上白衣，从送门走上送道，独自走进雪葬谷的暴风雪里。
yomoda[normal]: 叫做「雪送」。交给白蛾大人。
chiyuki[shock]: ……
yomoda[normal]: 据说，无罪的人到了春天，会被山神送回来。
yomoda[dark]: ……当然，没有人回来过。
yomoda[normal]: 如今的雪送祭，只是用稻草扎的人偶代替罪人，用雪橇送到送门，推下送道。和平的祭典。
yomoda[smile]: 还有一首数え唄，《雪葬之歌》。一片雪，落水车——村里的孩子都会唱。
yomoda[normal]: 有意思的是，一共七段，可第七片雪没有歌词。只有一段旋律，大家都只是哼。
yomoda[think]: 为什么只有第七段没有词？是失传了，还是本来就没有？——民俗学上的一个谜。
yomoda[smile]: 我来这个村子，一半就是为了这个谜。
: 他说得兴起，又要往下讲。莲司轻轻咳了一声。
yomoda[smile]: ……哎呀，又说多了。老毛病。
@set prologue_met_yomoda
@note yomoda 民俗学者，圆眼镜、褐色围巾，借住白峰本宅二楼整理旧文书。称律「七濑君」，一讲起传说就停不下来。讲了白蛾大人、雪送与《雪葬之歌》：「第七片雪没有歌词，只有旋律——民俗学上的谜。」
@return

# prologue_t_yomoda2
yomoda[smile]: 雪送祭是后天。到时候我给你们当解说，免费的。
yomoda[normal]: ……一年里，只有那一天，村里的人会把那首歌从头唱到尾。
@return

# prologue_s_namelessjizo
: 一排地藏的最边上，有一尊比别的都新一些的石像。红围兜还很鲜艳，底座上却没有刻名字。
: 它面前放着一只用竹皮包着的饭团，还是温的。
@if prologue_met_kumagai -> prologue_s_namelessjizo2
> 没有名字的地藏。供饭团的人，是谁？
@return

# prologue_s_namelessjizo2
> 熊谷先生供的。他不肯说是给谁的。
@return

# prologue_s_jizorow
: 七八尊小小的石地藏排成一排，戴着褪色的红围兜，头顶积着一层雪，像戴了一顶白帽子。
renji: 从前孩子没养大的人家，就立一尊。……这里的冬天，太长了。
@return

# prologue_t_kumagai
@if prologue_met_kumagai -> prologue_t_kumagai2
@show kumagai[normal] C
: 地藏前蹲着一个高大的男人。橙色的毛线帽，一脸浓密的胡子，背上斜挎着一支猎枪。
: 他把一只饭团端端正正地摆在没有名字的地藏前，双手合十，闭眼站了一会儿。
: 然后他转过身来，看见了律。
kumagai[angry]: ……东京来的？
kumagai[angry]: 趁早滚回去。这不是你们玩的地方。
renji: 熊谷先生……
kumagai[normal]: 莲司，你也是。什么人都往村里领。
kumagai[normal]: 今晚还要下。明天更大。这种天，外人进山，是要出人命的。
: 他的视线扫过千雪，在她发间的红山茶上停了一下。他的嘴唇动了动，什么也没说。
sayo[smile]: 那尊地藏，是给谁的呀？
kumagai[angry]: 少管闲事！
: 熊谷大步走开了，靴子踩得积雪咯吱咯吱响。
renji: ……熊谷大吾先生。村里的猎人。山里的事，雪的事，没有人比他更懂。
renji: 脾气是坏了点。……人不坏。
@set prologue_met_kumagai
@note kumagai 猎人，高大，嗓门大，脾气暴，背着猎枪。叫律「东京来的」。在没有名字的新地藏前供饭团，不肯说是给谁的。「这种天，外人进山，是要出人命的。」
@return

# prologue_t_kumagai2
: 熊谷已经走远了，只留下一行深深的靴印。
> 这么大的雪，脚印一会儿就被填平了。
@return

# prologue_s_nozzles
: 村道的路面是湿的，黑亮黑亮，一点积雪也没有。路中间每隔几步，就有一个小小的喷口，往外冒着温热的水，冒着白气。
renji: 消雪管。路底下埋着管子，抽地下水上来喷。水是温的，雪落下来就化了。
renji: 不然一个冬天，路就被雪埋死了。
> 脚踩上去，只有水声。走过去，什么也留不下。
@return

# prologue_s_shed
: 白峰屋门口有一间带屋檐的柴棚，码着劈好的柴。柴堆旁边靠着两架长长的木雪橇，滑板被磨得发亮。
renji: 雪送祭用的。拉稻草人偶和雪灯笼，从村这头一直拉到送门。
@return

# prologue_s_yukawa
: 雪墙外面，一条小溪从山上流下来，在雪里冒着白白的热气，水面上一点冰也没有。溪水钻进村道下的涵洞，又从另一边流出去。
renji: 汤川。山腰上雪见汤的温泉水流下来的。冬天也不结冰，也不积雪。
sayo[smile]: 温泉的小河？好想把脚泡进去～
renji[smile]: 水只到大腿，泡不了人。猎人们倒是常穿着胶皮裤子在里面走。
@return

# prologue_s_houses
: 村道两边是一人多高的雪墙，雪墙后面露出一个个屋顶。有的窗里透出灯光，有的窗户黑洞洞的，门口的雪齐了膝盖，没有一个脚印。
> 空房子。比有人住的还多。
@return

# prologue_t_villager
@if prologue_met_villager -> prologue_t_villager2
: 路边一户人家的屋檐下，站着两个裹着棉袄的老太太，正在小声说着什么。
: 她们看见三个人走过来，说话声一下子停了。
villager{老太太}: ……那个女的，就是周刊上那个……
villager{老太太}: 宵鸦岛的……判官……
villager{老太太}: 嘘——
: 两个人对视了一眼，转身进了屋。格子门「啪」地合上了。
@show sayo[smile] C
sayo[smile]: 哎呀～我出名了呢。
ritsu: ……小夜。
sayo[smile]: 没关系没关系～在东京也有人这样看我。习惯了。
: 她笑着往前走。右手的白手套，在大衣口袋里攥成了一个拳头。
@hide
@set prologue_met_villager
@return

# prologue_t_villager2
: 那户人家的窗帘拉上了。窗帘的缝里，有一只眼睛。
@return

# prologue_s_cigarettes
: 柜台后面的架子上，整整齐齐码着一排排香烟。每一格上都贴着一张小纸条，用铅笔写着人名。
abe: 别看了。谁抽什么，我闭着眼睛都知道。
abe: 莲司君抽七星，一礼拜两条。桐谷先生抽得杂，有什么抽什么。熊谷那个熊，一根都不抽，说烟味会把猎物吓跑。
@return

# prologue_s_magazines
: 门边的杂志架上插着几本过期的周刊。最上面一本，封面上印着一行字：「宵鸦岛的判官，如今在哪里？」
> 原来是从这里传开的。
@return

# prologue_s_cardphone
: 店门外的屋檐下，挂着一台灰色的插卡公用电话。话筒上落了一层薄雪。
abe: 村里的电话线就一根，从桥头那个铁箱子接出去。这一台，跟旅馆那台，用的都是那根线。
@return

# prologue_s_storewindow
: 店的玻璃窗正对着马路。马路对面，是一栋小小的平房，门口挂着红色的圆灯——驻在所。
abe: 对面那个小巡查，几点出门、几点回来、几点关灯，我比他自己还清楚。
abe: 人老了，没别的事干，就看看窗外。
@return

# prologue_t_abe
@if prologue_met_abe -> prologue_t_abe2
@show abe[normal] C
: 一个矮小的老太太坐在柜台后面的火盆边，老花镜用链子挂在脖子上。她从眼镜上方打量着三个人。
abe[normal]: 哟，生面孔。旅馆的客人？
abe[smile]: 我是阿部文，开店的，也管邮局。全村的信都从我手里过。侦探小哥，有信要寄，找我。
abe[normal]: 来看雪送祭？……哼，这年头，还有人专门来看这个。
abe[smile]: 你们知道吧？这村子二十年前，可是真送过人的。
renji: 阿部婆婆……
abe[smile]: 怕什么，又不是秘密。镇上的报纸都登过。
abe[normal]: 那年冬天，村里来了个外来的寡妇。男人死在雪崩里，她不走，带着个小丫头留在村里。
abe[normal]: 在白峰屋帮工。长得好看，心眼也多。
abe[dark]: 勾引村长家的少爷，后来在水车小屋里，拿铁杵把人砸死了。
@se heartbeat
: 律身边，千雪的身体轻轻一震。
abe[dark]: 少爷怀里还揣着她的红山茶簪子——
abe[normal]: 那天晚上，我亲眼看见她进了水车小屋。是我作的证。
abe[normal]: 第二天寄合，全村投票。她穿着白衣，自己走进了雪里。就这么回事。
: 千雪低着头，一动不动。大衣的袖口里，她的手指攥得发白。
: 阿部没有看她。她的视线早就越过三个人，落到了窗外对面的驻在所上。
abe[normal]: ……哎，那个小巡查，又在门口跺脚了。
@hide
@show chiyuki[sad] C
chiyuki[sad]: ……
chiyuki[normal]: 谢谢您告诉我们。
: 千雪的声音很平，平得像一块冻住的冰面。
@hide
> 阿部婆婆没有认出她。
> 当着女儿的面，说她的母亲是「杀人寡妇」。
@set prologue_met_abe
@note abe 杂货店兼邮局的老板娘，71 岁。爱说闲话，店窗正对驻在所，记得谁抽什么烟。叫律「侦探小哥」。讲了 1983 年「杀人寡妇」的事，说自己「亲眼看见她进了水车小屋，是我作的证」。她没有认出千雪。
@return

# prologue_t_abe2
abe[normal]: 还有事？买东西就买，不买就别挡着光。
abe[smile]: ……那个戴红山茶的丫头，看着有点面熟。是哪里见过呢。
@return

# prologue_s_radio
: 桌上放着一台方方正正的无线电，旁边挂着手持的话筒。机身侧面贴着一张手写的纸条：「每日 9:00 定时联络」。
> 这个村子和外面联系的另一根线。
@return

# prologue_s_ashtray
: 桌角放着一只干干净净的玻璃烟灰缸，一点烟灰也没有。
makabe: 那是给来办事的老人们用的。我自己不抽，闻到烟味就头疼。
@return

# prologue_s_stove
: 屋子中间是一只黑铁的炉子，烧得通红。炉身四四方方，棱角磨得锋利，炉顶坐着一只水壶。
> 撞上去，大概会很疼。
@return

# prologue_s_locker
: 墙边一排铁皮储物柜，漆皮剥落。最下面一格的门上，贴着一张褪色的名牌，钢笔写的字已经洇开了。
: 「真壁铁雄」
> 真壁……和现在这位巡查同姓。
@return

# prologue_t_makabe
@if prologue_met_makabe -> prologue_t_makabe2
@show makabe[smile] C
: 驻在所的门一推就开了。一个穿藏青色警服大衣的年轻人正在炉边烤手，看见他们，立刻站直了身子，敬了个礼。
makabe[smile]: 您好！白峰村驻在所，巡查真壁翔太！
makabe[smile]: 您就是七濑先生吧？莲司先生跟我说了，东京来的侦探！
makabe[smile]: 我看过您那个记者会的新闻。当着那么多人说「我错了」……真了不起。
ritsu: ……谢谢。
makabe[normal]: 我父亲以前，也是这里的巡查。
makabe[normal]: 他走了以后，我考了警察，自己申请调回来的。
makabe[smile]: 一个人的驻在所，什么都要管。走丢的老人、冻住的水管、吵架的邻居……还有那台。
: 他指了指桌上的无线电。
makabe[normal]: 每天早上九点，和镇上的署里通一次话。报个平安。
makabe[normal]: 今天早上也通过了。「白峰村，无异常。」
sayo[smile]: 门都不锁吗？
makabe[smile]: 不锁！我每天中午去白峰屋吃饭，驻在所从来不锁门。村里没有小偷。
makabe[smile]: 要是真有人来偷东西，阿部婆婆在对面一定看得一清二楚。哈哈。
@set prologue_met_makabe
@note makabe 驻在所巡查，27 岁，正直热血。父亲也曾是这里的巡查，他自己申请调回来。讨厌烟味，自己不抽。无线电每天早上九点与镇上通话；他每天中午去白峰屋吃饭，驻在所从来不锁门。
@return

# prologue_t_makabe2
makabe[smile]: 有什么事随时来找我！二十四小时……嗯，除了吃饭和睡觉的时候！
@return

# prologue_s_irori
: 围炉里之间的正中，是一只方形的地炉。炉火上吊着一只黑铁壶，壶嘴冒着白气。炉边的灰里插着几串烤得焦黄的鱼。
> 这个村子的晚上，大概都是在这里过的。
@return

# prologue_s_innphone
: 墙边的小台子上放着一部黑色的拨盘电话。旁边压着一张纸条：「长途请登记　白峰屋」。
renji: 有马先生每天都要打好几通。……生意上的事。
@return

# prologue_s_sakeshelf
: 墙边的酒架上排满了一升瓶，标签上写着山里各家酒藏的名字。有几格是空的。
renji: 好一点的地酒，都放在后院的仓库里。这里只是摆着喝的。
@return

# prologue_t_kiriya
@if prologue_met_kiriya -> prologue_t_kiriya2
@show kiriya[smile] C
: 地炉边盘腿坐着一个头发花白稀疏的老人，鼻头通红，面前已经摆了三只空酒壶。白大褂下面套着一件褐色的开衫。
kiriya[smile]: 哦，客人……东京来的？坐，坐。
kiriya[smile]: 桐谷修平。村里唯一的医生。……唯一的，所以喝醉了也没人替班，哈哈。
kiriya[normal]: 侦探先生，是吧？可别来查我。我这个人，胆子小，一查就什么都招了。
ritsu: 您每天都在这里喝？
kiriya[smile]: 晚上在这儿喝，十二点以后去雪见汤泡一泡，醒醒酒，再回诊所睡觉。几十年了。
kiriya[normal]: 山里冷。不喝点，睡不着。
: 他抬眼看了看千雪，又看了看她发间的红山茶，酒杯在半空停了一下，才送到嘴边。
@set prologue_met_kiriya
@note kiriya 村里唯一的医生，61 岁，爱喝酒、胆小。称律「侦探先生」。每晚在白峰屋喝酒，十二点以后去雪见汤泡汤醒酒。
@return

# prologue_t_kiriya2
kiriya[smile]: 再来一壶……霜，再来一壶。
@return

# prologue_t_arima
@if prologue_met_arima -> prologue_t_arima2
@show arima[smile] C
arima[smile]: 哟，名侦探先生。观光回来了？
arima[smile]: 怎么样，这村子。破破烂烂的，一点看头都没有吧。
arima[normal]: 我打算在后山建一座度假村。温泉旅馆、滑雪场、缆车。三年以后，这条村道上全是东京来的车。
arima[smile]: 老头子们舍不得那片山。可是山能当饭吃吗？再过十年，这村子就没人了。
: 湊端着一只茶盘从厨房出来，给客人送茶。有马伸手揉了揉他的毛线帽。
arima[smile]: 小鬼，过来。叔叔给你零花钱。
minato: ……不要。
: 湊放下茶盘，往后退了一步，躲到了莲司身后。有马的手停在半空，笑了一声，收了回去。
arima[smile]: 怕生。随他妈。
renji: ……
@hide
@set prologue_met_arima
@note arima 有马开发的人，34 岁，油滑、傲慢，叫律「名侦探先生」。前天住进白峰屋，来谈卖山建度假村的生意。16:50 还在围炉里之间打过电话。湊躲着他。
@return

# prologue_t_arima2
arima[smile]: 名侦探先生，你那个「骗子侦探」的外号，可比本名响亮多了。
@return

# prologue_tour_end
@bg inn_entrance
@filter none
@caption 17:58 白峰屋·玄关
: 天黑透的时候，五个人回到了白峰屋。
minato: 17:58。
: 湊在本子上写下最后一行，合上了。
renji: ……走累了吧。晚饭七点。围炉里之间暖和，先去烤烤火。
: 霜在玄关接过三个人的大衣，一件一件挂上衣帽架。衣帽架上已经挂满了村里人的棉袄和帽子。
: 律把围巾也挂了上去，跟着众人进了围炉里之间。
@freetime 1
@goto prologue_sumi

# prologue_sumi
@bg inn_hearth
@bgm village
@filter none
@caption 18:00 白峰屋·围炉里之间
: 地炉里的火噼噼啪啪地响着。桐谷又添了一壶酒，有马靠在墙边看一本经济杂志。雅跪坐在一旁，给客人们倒茶。
@se door
: 玄关的格子门拉开了。一阵冷风卷着雪粒灌进来，又被关在了门外。
: 走进来的，是一个穿白衣绯袴、外罩白羽织的女人。长长的黑发用和纸带子束在脑后，肩上落着薄薄的雪。
@show sumi[smile] C
sumi[smile]: ……晚上好。打扰了。
: 她的声音很轻，很慢，每一句话的末尾，都像要停一拍。
: 莲司把刚点着的烟按灭在烟灰缸里，站了起来。
renji[normal]: 澄……宫司大人。这么大的雪。
sumi[smile]: 听说白峰屋来了东京的客人……就过来看看。
sumi[smile]: 葛城澄。白蛾神社的宫司。……请多关照。
chiyuki[surprise]: 啊……您是，桥头的……
sumi[smile]: ……是的。下午在桥头换注连绳的时候，见过一面呢。
sumi[smile]: 每年这个时候，都要给桥换新的绳子。叫做「桥祓」……保佑过桥的人，平安。
: 她在地炉边跪坐下来，双手放在膝上，坐得笔直。
sumi[normal]: 后天，二月十四日，是雪送祭。……一年一次的祭典。
sumi[normal]: 傍晚，村里的人会拉着雪橇，提着雪灯笼，从这里一直走到送门。
sumi[normal]: 十六日的夜里，神社还有白蛾神乐。……两个人戴着面具，在神乐殿里跳舞。
sumi[smile]: 难得来一趟……请三位务必来看看。
sayo[smile]: 好呀好呀～面具和舞蹈，最喜欢了！
: 澄看着小夜，微微地笑了一下。
sumi[normal]: ……乌丸小姐，是吧。
sayo[surprise]: 诶？您知道我？
sumi[smile]: 周刊上……看到过。
: 雅端着酒壶过来，要给澄斟一杯。澄轻轻摇了摇头，用手掌盖住了杯口。
miyabi[smile]: 啊，失礼了。宫司大人从来不碰酒的。
sumi[smile]: ……一杯热茶就好。
@hide
: 澄和莲司说着祭典的安排。雪橇几架，灯笼几盏，人偶由谁来扎。莲司一直低头听着，偶尔应一声。
: 他说话的时候，眼睛没有看她。可她说话的时候，他的眼睛一直在她身上。
@caption 18:20 白峰屋
@se door
abe: 晚饭前最后一趟！信来喽——
: 玄关传来阿部文的大嗓门。她把一叠信件拍在柜台上，又顺手翻开了那本登记簿。
abe: 东京来的那几个，叫什么名字来着？我得记一笔，让镇上的人知道……
abe: 七濑……乌丸……冬木——
: 声音停住了。
: 停了很久。
@se heartbeat
: 然后，纸门被「哗」地一下拉开了。阿部文站在门口，老花镜滑到了鼻尖上，手指直直地指着千雪。
@show abe[shock] C
abe[shock]: 冬木千雪——
abe[shock]: 是雪绘的女儿！
@bgm stop
: 围炉里之间一下子安静了。
: 桐谷的酒杯停在嘴边。有马合上了杂志。雅倒茶的手停住了，茶水从杯沿溢了出来。
: 澄的脸色，白得像她身上的白衣。她手里的茶杯轻轻地磕了一下杯托，发出一声很小的响。
abe[shock]: 我就说眼熟……那双眼睛……一模一样……
abe[angry]: 你、你下午在店里，听我说了那些，一声都不吭——
@hide
@show chiyuki[normal] C
: 千雪慢慢地站了起来。
chiyuki[normal]: ……是的。
chiyuki[normal]: 我母亲，是冬木雪绘。
: 她没有低头，也没有提高声音。只是这么站着，让所有人看着她。
@hide
: 霜从厨房的门口走了出来。她手里端着一只茶碗，走到千雪身边，轻轻放在她面前的榻榻米上。
: 碗里是刚沏好的热茶。她什么也没写，又退了回去。
renji: ……阿部婆婆，好了。
renji: 客人是来看祭典的。……好了。
abe[normal]: 哼……
: 阿部文扶正了老花镜，嘴里还在嘟囔着什么，退回了玄关。
@bgm mystery
@caption 18:40 白峰屋·玄关
sumi: ……时候不早了。神社那边，还有事。
@show sumi[sad] C
: 澄站起来，向众人行了一礼。行礼的时候，她的视线在千雪身上停了一瞬，又很快地移开了。
sumi[sad]: ……失礼了。
: 莲司送她到玄关。格子门拉开，又合上。白色的身影消失在雪里。
: 莲司在门口站了很久，才回来。
@hide
@get prologue_gossip
> 阿部婆婆刚才那一声，整间屋子的人都听见了。
> 在那之前，这个村子里，没有一个人知道千雪小姐是谁。

@bg inn_hearth
@bgm village
@caption 19:00 白峰屋·围炉里之间
: 晚饭摆在地炉边。山菜、腌萝卜、炖得软烂的野猪肉，还有一锅冒着热气的味噌汤。
: 天黑以后，村里的人陆陆续续来了。熊谷大吾在角落里一个人喝闷酒；四方田从本宅过来，和莲司低声谈着旧文书；阿部文没走，挤在桐谷旁边。
: 还有几个穿棉袄的老人，是来喝一杯的。
: 每一个人进门，都会先往千雪身上看一眼。然后，再往小夜身上看一眼。
villager{老人}: ……那就是雪绘的……
villager{老人}: 还有那个，判官……
: 窃窃私语，像炉灰底下的火星，一刻也不停。
@show arima[smile] C
arima[smile]: 杀人犯的女儿，和判官。
arima[smile]: 哈。这村子热闹了。
@se crash
: 熊谷把酒杯重重地顿在矮桌上。
@show kumagai[angry] C
kumagai[angry]: 东京佬。死人的事，轮不到你来嚼舌头。
arima[smile]: 哟，猎人先生护着她？
kumagai[angry]: ……
: 熊谷瞪了他一眼，没有再说话，又给自己倒满了酒。他始终没有看千雪。
@hide
@show sayo[smile] L
@show chiyuki[sad] R
sayo[smile]: 千雪小姐，这个腌萝卜超好吃哦～
chiyuki[sad]: ……谢谢。
sayo[normal]: 不用理他们。被人盯着看这种事，我比较有经验。
sayo[smile]: 诀窍是：一直吃。嘴里有东西，就不会想哭了～
chiyuki[smile]: ……
: 千雪笑了一下。很浅，很快就没了。可是确实笑了。
@hide
: 霜一直在地炉和厨房之间来回地忙。添饭，温酒，收碗。她走过千雪身边时，总会在她的碗里多添一勺汤。
> 霜小姐……对千雪小姐格外照顾。
@caption 20:58 白峰屋·围炉里之间
: 夜渐渐深了。窗外的雪没有停，风从山谷里一阵一阵地吹上来，把窗纸吹得簌簌发抖。
: 律看了一眼手表。八点五十八分。
minato: ……
: 坐在莲司身边的湊，也在看他的电子表。

@caption 21:00 白峰屋·围炉里之间
@se chime
: 窗外，防灾喇叭里传来了提示音。
: 叮——咚——叮——咚——
minato[surprise]: ……21:00？
minato[surprise]: 这个时间，不该有广播的。
@bgm stop
@wait 600
: 喇叭里沙沙地响了一会儿。
: 然后，传出了一个声音。
@filter dark
@bgm horror
hakuga: 白峰村的各位。这里是白蛾。
: 那不是人的声音。被什么东西处理过，忽高忽低，冰冷，像风刮过冻住的铁皮。
: 可是在那冰冷底下，又像有什么别的东西。很深，很远，像哀伤。
hakuga: ……桥已经断了。
hakuga: 路，被雪吃掉了。
hakuga: 从今夜起，这个村子，只剩下你们自己。
hakuga: 二十年前的冬天，你们把一个女人送进了雪里。
@se glass
: 厨房门口，霜手里的碗掉在了地上，摔成了好几瓣。
hakuga: 她的女儿，今天回来了。
: 所有人的眼睛，都转向了千雪。
hakuga: ——二十年前的罪，今年要还。
hakuga: 依照古法，雪封之日，寄合裁之。
@wait 400
: 喇叭里，响起了歌声。还是那个声音，一个字一个字地唱。
@poem 一片雪，落水车，杵声捣到天明时。\n二片雪，落屋檐，雪上不见来时路。\n三片雪，落汤池，热汤暖不了冷心。
@poem 四片雪，落面上，面具底下是谁的脸。\n五片雪，落送门，白衣人儿不回头。\n六片雪，白蛾归——
: 唱到第六片雪，歌声停了。
: 然后，那个声音哼起了一段没有词的旋律。很慢，很轻。像摇篮曲。
: 律身边，千雪猛地抬起了头。
hakuga: 雪，会一片一片地落下。
@se chime
: 叮——咚——
: 喇叭沉默了。只剩下风声。
@get prologue_broadcast
@filter none
@bgm tension
kumagai[shock]: ……白蛾大人……
kumagai[shock]: 白蛾大人，说话了……
abe[shock]: 是雪绘！是雪绘的鬼魂！她回来了，二十年了，她回来了！
villager{老人}: 寄合……古法的寄合……
kiriya[shock]: 别、别胡说……那是广播，是人的声音……
renji[shock]: 广播室……公民馆是锁着的……
@show arima[angry] C
arima[angry]: 搞什么鬼。桥断了？开什么玩笑。
: 有马大步走到墙边，抓起那部黑色的电话，拨了号码。
: 他把听筒贴在耳边。
: 一秒，两秒。
arima[shock]: ……没声音。
arima[angry]: 怎么会没声音！傍晚还能打！我四点五十还打过！
: 他拼命地拍着电话叉簧。听筒里一点声音也没有。
@hide
@se door
makabe: 刚才的广播——！
@show makabe[shock] C
: 格子门被撞开，真壁冲了进来，帽檐上全是雪，喘得说不出整句话。
makabe[shock]: 刚才的广播，是谁——莲司先生，广播室——
ritsu: 桥。
makabe[shock]: 诶？
ritsu: 广播说桥断了。先去看桥。
@hide
kumagai[angry]: ……我去。手电在柴棚里。
renji[normal]: 我也去。
@show sayo[normal] C
sayo[normal]: 律君，我也一起。
ritsu: 千雪小姐留在这里。
chiyuki[sad]: ……
: 千雪看着地上那只摔碎的碗。霜蹲在那里，一片一片地捡着碎片，左手的毛线手套上沾湿了一块。
@hide
@caption 21:05 白峰屋
: 四个男人和小夜冲进了雪里。

@bg bridge cut
@weather snow
@filter cold
@bgm tension
@caption 21:20 白蛾桥·村侧桥头
@se wind
: 熊谷的手电筒射出一道粗粗的光，在飘飞的雪里切开一条路。
: 光照到石柱上。照到锚碇上。
: 然后，照进了空荡荡的山谷。
: 桥不见了。
: 两根主索中的一根，在锚碇的位置断开了。断掉的钢索像一条死蛇，软软地垂在雪地上。
: 失去了一边的支撑，木桥面整个翻了下去，挂在对岸，垂进了漆黑的谷底。几盏小灯还在下面一晃一晃地亮着，像沉进水里的萤火。
kumagai[shock]: ……真的断了。
renji[shock]: 下午……下午还好好的……
makabe[shock]: 七濑先生，这……
ritsu: 别靠近崖边。先看清楚，是怎么断的。
@explore prologue_bridge

# prologue_b_anchor
@if has:prologue_bridge -> prologue_b_anchor2
: 律蹲在锚碇边，让熊谷把手电照过来。
: 主索是由几十根细钢丝绞成的。断口就在锚碇上方，紧挨着注连绳缠绕的地方。
: 每一根钢丝的断口都很整齐，斜斜的一个小切面。不是磨断的，也不是扯断的。
> 剪钳。一根一根剪断的。
: 律凑近了看。有一部分钢丝的断口里，嵌着几丝细细的、黄白色的纤维，像是被压进了切口里。
: 另一部分钢丝的断口，却干干净净，在手电光里闪着新的亮光。
> 稻草的纤维……注连绳的稻草？
> 为什么只有一部分有。
: 律把这件事记在了心里，没有说出来。
ritsu: 是在村子这一头剪断的。
ritsu: 我们下午四点二十过桥的时候，桥还好好的。
@get prologue_bridge
@return

# prologue_b_anchor2
> 一部分断口嵌着稻草纤维，一部分干干净净。
> 像是……不是同一个时候剪的。
@return

# prologue_b_shimenawa
: 下午还白生生的新注连绳，被人从中间割开了。断成两截的稻草绳搭在锚碇上，白纸垂饰湿透了，贴在雪地上。
: 雪地上散落着一些碎稻草。
renji: 桥祓的时候，澄……宫司大人亲手缠上的。
> 剪钢索的时候，连注连绳一起割开了。
@return

# prologue_b_junction
: 桥头旁那只灰色的铁皮接线箱，箱门被撬开了，歪歪地挂在一边。
: 律用手电往里照。一束黑色的电线从箱底钻进来，接在端子上——被齐齐地剪断了。断头垂在箱子里。
makabe[shock]: 电话线……全村就这一根……
ritsu: 有马先生说，他四点五十还在旅馆打过电话。
ritsu: 那之后，有人来这里剪断了它。
@get prologue_junction
@return

# prologue_b_deck
: 手电光往谷底照下去。桥面挂在对岸的石柱上，整条垂进黑暗里，木板在风里一下一下地撞着崖壁。
: 光照不到底。只看见雪，从上面落进去，一直落进去，没有尽头。
> 掉下去，就回不来了。
@return

# prologue_b_nameplate
: 石柱上那块铜铭牌还在。手电光照上去，绿锈底下的字一个一个浮了出来。
: 「白蛾桥　昭和五十七年十月竣工」
> 二十年。这座桥只走过了二十年。
@return

# prologue_b_far
: 对岸的山腰上，是下午那条隧道的洞口。黑漆漆的，像一只张开的嘴。
: 冰柱在手电光的边缘闪了一下。
> 巴士开回去了。末班车五点二十就走了。
> 现在，那边一个人也没有。
@return

# prologue_bt_kumagai
@if prologue_bt_kumagai_done -> prologue_bt_kumagai2
@show kumagai[angry] C
kumagai[angry]: 是人干的。这么粗的钢索，雪压不断，风也吹不断。
kumagai[normal]: 雪地上什么也看不出来。这么大的雪，脚印早就被盖平了。
kumagai[dark]: ……白蛾大人。
kumagai[dark]: 二十年了。白蛾大人生气了。
ritsu: 山神不用剪钳。
kumagai[angry]: 你懂什么！东京来的！
@set prologue_bt_kumagai_done
@return

# prologue_bt_kumagai2
kumagai[normal]: 手电省着点用。电池……这村子里，电池也金贵。
@return

# prologue_bt_renji
@if prologue_bt_renji_done -> prologue_bt_renji2
@show renji[sad] C
renji[sad]: ……下午三点，神社来做桥祓。我在旁边看了一会儿，开头那段祝词念完，就先回去了。
renji[sad]: 那时候，桥还好好的。七濑先生你们过桥的时候也是。
renji[normal]: 桥断了，电话也……
: 他从口袋里摸出一支七星，手抖得点了三次才点着。
renji[sad]: ……对不起。这个村子，让客人遇到这种事。
@set prologue_bt_renji_done
@return

# prologue_bt_renji2
renji[normal]: 驻在所有无线电。……去驻在所吧。
@return

# prologue_bt_makabe
@if prologue_bt_makabe_done -> prologue_bt_makabe2
@show makabe[angry] C
makabe[angry]: 损坏交通设施，切断通讯线路……这是犯罪。不管是谁干的，我一定要抓住他。
makabe[normal]: 驻在所有无线电。我马上联络镇上的署里，明天一早就能派人——
makabe[think]: ……可是桥断了，人怎么过来……
@set prologue_bt_makabe_done
@return

# prologue_bt_makabe2
makabe[normal]: 先去驻在所！
@return

# prologue_bridge_end
@bg police_box
@filter cold
@bgm tension
@caption 21:35 驻在所
@se door
: 驻在所的门一推就开了。炉子里的火已经暗下去了，屋里只剩一点余温。
: 真壁扑到桌前，抓起无线电的话筒，按下开关。
makabe[shock]: ……？
: 他又按了一次。拧了拧旋钮。机器上的指示灯，一盏也没有亮。
makabe[shock]: 怎么回事……早上还好好的……
: 律把机器翻过来。背面的电池盒盖子，轻轻一碰就掉了下来。
: 里面是空的。
@se heartbeat
makabe[shock]: 电池……被拿走了……
ritsu: 早上九点通话的时候，还好好的？
makabe[shock]: 是、是的！「白峰村，无异常」——我自己说的！
makabe[sad]: 中午我去白峰屋吃饭……门没有锁……驻在所从来不锁门……
makabe[sad]: 可是，谁会偷无线电的电池……
sayo[normal]: 知道这台机器只在早上九点用的人。
sayo[normal]: 白天拿走，到第二天早上九点之前，谁也不会发现。
@get prologue_radio
makabe[angry]: ……可恶！
: 真壁一拳砸在桌上。烟灰缸跳了一下，里面干干净净，一点烟灰也没有。
@hide
@bg community_hall
@caption 21:40 公民馆·广播室
: 广播室的门锁着。莲司从口袋里摸出一把黄铜钥匙。
renji[normal]: 出门的时候……我从账房顺手拿了。我想，总要来看看。
@se door
: 门开了。屋里一片漆黑，冷得像冰窖。真壁拉亮了电灯。
: 播音台上，多了一样东西。
: 一台银色的盒式录音机。比普通的大一圈，侧面有个定时旋钮。一根电线从它背后牵出来，插在播音台的插孔里。
@if prologue_saw_recorder -> prologue_timer_saw
> 定时录音机。
@goto prologue_timer_look

# prologue_timer_saw
> 下午五点，它还放在那边的器材柜里。我亲眼看见的。

# prologue_timer_look
: 定时旋钮上的指针，停在「21:00」。
: 律按下了退带键。「咔」的一声，仓门弹开，里面躺着一盘普通的盒式磁带。标签上什么也没写。
ritsu: 有人进了这间屋子，把录好的磁带装进这台机器，拨到九点，接上播音台，然后锁门出去。
ritsu: 到了九点，它自己就播了。
sayo[normal]: 不需要人在场。
: 小夜盯着那台录音机，很久没有说话。
@get prologue_timer
ritsu: 真壁先生。这台机器和磁带，请你保管。
makabe[normal]: ……是！
: 真壁用手帕把录音机和磁带包好，紧紧地抱在怀里。
ritsu: 莲司先生。广播室的钥匙，一共三把？
renji[normal]: ……是的。我这把，平时挂在白峰屋账房的柱子上。
renji[normal]: 阿部婆婆那把，挂在店里柜台后面的钉子上。神社那把，在社务所……宫司大人保管。
sayo[normal]: 都挂在看得见、摸得着的地方。
renji[sad]: ……村里，没有小偷。
@get prologue_keys
@caption 21:50 公民馆
@se crash
@shake
: 就在这时，远处传来一声闷响。
: 像是整座山，在雪底下翻了个身。窗玻璃嗡嗡地震了好一会儿。
kumagai[shock]: ……是谷那边！

@bg bridge cut
@caption 21:55 白蛾桥·村侧桥头
: 熊谷第一个冲回了桥头。他把手电举过头顶，对准了对岸的山腰。
: 光柱穿过飘飞的雪，落在下午那个隧道口的位置上。
: 那里已经没有洞口了。
: 只有一大片刚刚塌下来的、白得发亮的雪，把整个洞口连同那排冰柱，一起埋了进去。
kumagai[shock]: ……雪崩。
kumagai[normal]: 这个是真的。山上的雪太重了，自己塌下来的。
renji[shock]: 隧道也……
makabe[shock]: 那……那还有别的路吗？
renji[normal]: ……还有旧林道。翻过后山，通到镇上。
renji[sad]: 冬天被雪封死了。人走不过去。
renji[normal]: 每年二月十八日的早上，镇上的除雪车会从林道那头一路推过来，给村里送灯油。
renji[sad]: 在那之前……谁也出不去。
sayo[normal]: 二月十八日……还有六天。
: 雪越下越大。手电的光柱里，雪片像一群白色的蛾子，没完没了地扑下来。
> 桥被剪断。电话线被剪断。无线电的电池被拿走。
> 然后，一场真正的雪崩，替那个人封上了最后一道门。
> 这个村子，现在和外面，一根线也没有了。

@bg inn_hearth
@filter none
@weather none
@bgm tension
@caption 22:10 白峰屋·围炉里之间
: 回到白峰屋时，围炉里之间已经挤满了人。消息早就传开了，村里还醒着的人都来了。
: 律一进门，所有人的眼睛都转了过来。
kumagai[angry]: 就是他们！
kumagai[angry]: 他们一来，桥就断了，白蛾大人就说话了！哪有这么巧的事！
abe[angry]: 杀人犯的女儿，宵鸦岛的判官，还有一个骗子侦探！
villager{老人}: 赶出去……不，桥断了，赶也赶不出去……
@show chiyuki[sad] C
chiyuki[sad]: ……
@hide
: 人群的边上，霜放下了手里的托盘。她取下胸前的石板，用粉笔一笔一笔地写，写完，举了起来。
@show shimo[normal] C
shimo: （石板）六点回来以后，三位客人一直在这里，没有出去过。我一直在。
: 石板上的字小而工整。她举着它，站在众人面前，没有放下。
@hide
renji[normal]: ……五点到六点，我和湊带他们在村里转。一步也没离开过。
minato[normal]: 17:00 公民馆，17:58 回来。我都记着。
kumagai[angry]: 哼……一个哑巴，一个小鬼……
@get prologue_alibi
: 莲司刚要再说什么，玄关的门开了。一个裹着棉袄的老人探进头来。
villager{长老}: 莲司。老村长发话了。
villager{长老}: 十点半，裁屋。寄合。
: 围炉里之间，一下子安静了。
renji[shock]: ……父亲他……
villager{长老}: 老村长说，白蛾大人要寄合，村子就开寄合。
villager{长老}: 外来的三个，也要来。
@hide
@bgm stop

@bg sabakiya
@caption 22:30 裁屋
@se wind
: 裁屋在村子中央，是一座茅草顶的古老会所。厚厚的茅草上压着更厚的雪，屋檐几乎垂到了地上。
: 屋里只有一间大屋。正中是一只地炉，炉火上吊着一只自在钩，铁链被熏得乌黑。
: 二十几个村民围着地炉坐成一圈。大多是老人，裹着棉袄，膝上放着手炉。墙上挂着一块旧木板，钉满了褪色的小木札。
: 门开了。熊谷和一个年轻些的村民，用一把椅子，抬进来一个老人。
: 老人瘦得像一根枯枝，裹着厚厚的棉袍，手里拄着一根拐杖。眼窝深深地陷下去，眼睛却亮得吓人。
: 他被放在地炉正面的上座。所有人都低下了头。
@trial on
@bgm trial
genichiro: ……东京来的小子。
genichiro: 就是你？在报纸上说自己错了的那个。
ritsu: 七濑律。
genichiro: 白峰源一郎。这个村子的前任村长。
genichiro: ……哼。说自己错了。说得倒是轻巧。
renji: 父亲，您的身体……
genichiro: 闭嘴。
genichiro: 村子的事，村子自己办。用不着外人插嘴，也用不着你这个当不了家的。
: 莲司垂下了眼睛。
sumi: ……白蛾大人在上。
: 坐在上座旁边的澄，双手合十，轻声念了一句。她的白衣在炉火里泛着淡淡的红光。
sumi: 寄合……开始。
genichiro: 说吧。熊谷。阿部。
kumagai: 我先说！
kumagai: 桥是人剪断的，电话线也是。驻在所的无线电，电池被拿走了。
kumagai: 然后九点，白蛾大人在广播里说话了。说什么二十年前的罪，今年要还。
kumagai: 这种事，二十年来一次也没有过！偏偏是他们三个来的这一天！
abe: 雪绘的女儿！宵鸦岛的判官！还有一个专门把案子翻过来的侦探！
abe: 这不是来看祭典的，是来报仇的！
villager{长老}: 二十年前的事……雪绘的女儿要替她妈报仇……
: 人群里一片低低的附和声，像风吹过枯草。
> 村子已经有了答案。
> 他们需要的，不是证据。是一个可以指着的人。
sayo[normal]: 律君。
sayo[smile]: 要开始了吗？「侦探的时间」～
sayo[normal]: 我来讲一下规矩吧。这可是助手的工作。
: 【寄合须知·练习】众人的发言中，会有被高亮的橙色「弱点」。
: 【寄合须知·练习】从侦探手账里选出一件证据，射向与它矛盾的弱点，就能击破对方的说法。
: 【寄合须知·练习】选错了也不要紧，只会损失一点「信念」。信念会慢慢恢复，提示也会出现。
sayo[smile]: 简单来说，就是「用证据说话」～律君最擅长的事！
> 熊谷先生认定，广播是我们从外面带进来的东西。
> 可是那段录音，是怎么播出来的？
@bgm debate
@game prologue_g1
@bgm trial
@shout ritsu 不对！
ritsu: 那段广播，不是从外面寄来的，也不是从外面传进来的。
ritsu: 播出它的，是公民馆广播室里的一台定时录音机。接在播音台上，定时旋钮拨在九点整。磁带还在里面。
ritsu: 下午五点我去广播室的时候，那台录音机还放在器材柜里。
ritsu: 广播室是锁着的。有人在五点以后，用钥匙开了门，进去装好磁带、拨好时间，再锁上门出来。
ritsu: 录音是在哪里录的，我不知道。可是把它装进那间屋子的人——那一刻，就站在这个村子里。
makabe: 录音机和磁带，现在在我这里。我可以作证。
kumagai: ……
abe: 钥匙？
abe: 哼，钥匙算什么。我店里那把就挂在钉子上，谁都能拿。
renji: ……我那把，挂在旅馆的账房里。
sumi: ……神社的，挂在社务所的柱子上。
sumi: 来求御札的人……谁都……进得去。
kumagai: 那就对了！
> 熊谷先生的眼睛，又转回了我们身上。
> 他接下来要说什么，我大概猜得到。
@bgm debate
@game prologue_g2
@bgm trial
@shout ritsu 不对！
ritsu: 我们没有「偷偷溜出去」的时间。
ritsu: 五点到六点，村长和湊君一直带着我们三个在村里走。公民馆，也是他们带我们去的。
renji: ……是的。我和湊，一步也没有离开过他们。
minato: 17:00 公民馆，17:58 回到旅馆。都写在我的本子上。
ritsu: 六点回到旅馆以后，我们三个一直在围炉里之间。直到九点零五分，广播之后才冲出去。
shimo: （石板）是真的。我一直在。
: 霜把石板举过头顶，让圈子里的每一个人都看得见。
villager{老妇}: ……那个哑巴，说的倒是实话。我七点来喝酒的时候，他们也在。
kiriya: 我、我也一直在……那个丫头，一直坐在那里吃饭……
kumagai: ……
abe: 那、那就是有人在外面接应！对岸！对岸的人剪了桥，跑了！
kumagai: 对！白蛾说不定根本不在村里！剪了桥，从对岸逃了！
> 白蛾在对岸——
> 可是，那根主索是在哪一头断开的？
@game prologue_g3
@shout ritsu 请看这个！
ritsu: 主索是在村子这一头断开的。就在锚碇上，紧挨着注连绳的地方。
ritsu: 断口很整齐，是剪钳一根一根剪断的。站在对岸，够不到这里。
ritsu: 而且下午四点二十，我们三个过桥的时候，桥还好好的。
ritsu: 剪断它的人，是在那之后，站在村子这一边动的手。
ritsu: 桥断了以后——那个人，就再也回不到对岸去了。
kumagai: ……
villager{长老}: 那、那剪桥的……就在村里……
: 人群里的低语声，变了。不再是附和，而是一种不安的、互相打量的沉默。
ritsu: 先把能确定的事，排出来。
@bgm debate
@game prologue_g4
@bgm truth
ritsu: 整理一下。
ritsu: 第一。广播里说「她的女儿，今天回来了」。
ritsu: 千雪小姐本来该在十四日才来。她提前两天到了，没有告诉任何人。
ritsu: 而这个村子里的人，是到了六点二十分，阿部婆婆翻开登记簿大叫的那一刻，才知道她是谁的。
abe: ……我、我是叫了……
ritsu: 那么，录下这句话、再把它装进广播室的人，最早也只能在六点二十分以后行动。
ritsu: 第二。那段时间，我们三个一直在旅馆里，有十几个人看着。
ritsu: 第三。广播室的门锁着，钥匙在村长、邮局、神社手里。不难借，可是要知道它们挂在哪里。
ritsu: 第四。桥是在村子这一边、四点二十以后剪断的。剪断它的人，回不去对岸。
ritsu: 知道今晚才传开的消息。知道钥匙挂在哪里。知道吊桥的锚碇在哪、怎么剪。知道无线电只在早上九点用。
ritsu: 白蛾，非常熟悉这个村子。
@se heartbeat
ritsu: 而且，此刻就在这个村子里。
@bgm tension
: 裁屋里，没有一个人说话。
: 地炉里的炭「啪」地爆了一下。二十几张脸被火光照着，每一张都在偷偷地看别人。
: 律看着他们。
> 我知道的，只有这么多。
> 是谁，我还不知道。
: 稻草的纤维。只有一部分断口才有的稻草纤维。律想起了它，又把它压回了心底。
genichiro: ……哼。
genichiro: 说完了？东京来的小子。
genichiro: 说了一大堆，你还是不知道是谁。
ritsu: ……是。
genichiro: 那就够了。
@bgm judge
: 老人用拐杖在地板上重重地顿了一下。
genichiro: 白蛾大人要寄合，村子就开寄合。
genichiro: 村子里的事，村子自己办。
renji: 父亲！现在是平成十五年了！出了事，该等警察——
villager{长老}: 警察？桥断了，警察在哪儿？
villager{长老}: 莲司，你还年轻。这种时候，要听老人的。
: 莲司张了张嘴。圈子里的长老们一个接一个地看着他。他最终什么也没说出来，垂下了头。
genichiro: 都听好了。
genichiro: 从今夜起，雪封山的这几天，按古法来。
@poem 一、雪封期间，村中出现死者，全员到裁屋集合，举行寄合。\n二、在场者每人一票，多数决。\n三、被裁定者关进雪牢，翌日黎明，送入雪中。
genichiro: 还有一条老掉牙的。
genichiro: 裁定之后、天亮之前，要是有人拿来新的证据，可以再开一次寄合。
genichiro: ……哼。二十年前，也没人用过。
@poem 四、裁定之后、黎明之前，若有人带来新的证据，可以请求「再寄合」一次。
@se heartbeat
: 「送入雪中」。
: 这四个字落下来的时候，千雪的肩膀轻轻地抖了一下。
> 二十年前，她的母亲，就是这样被「送」走的。
> 这个村子，打算再做一次。
ritsu: ……请等一下。
genichiro: 嗯？
ritsu: 投票，不是证据。
ritsu: 二十个人的「觉得」，加在一起，也不会变成一个事实。
genichiro: 那你要怎么样，侦探？
ritsu: 我来找。
ritsu: 如果在这几天里真的有人死了——在寄合上，我会找出真正的凶手，用证据证明给所有人看。
ritsu: 证明了，就把那个人关起来，交给二月十八日来的警察。
ritsu: 如果我证明不了……你们再按你们的古法。
@se heartbeat
: 裁屋里一片死寂。
: 老人眯起眼睛，打量着律，像在估量一只刚掉进陷阱的狐狸。
: 然后，他冷笑了一声。
genichiro: 好啊，侦探。
genichiro: 证明不了——你也一样。
@trial off
@bgm stop

@bg inn_room
@filter night
@weather none
@bgm sad
@caption 2月13日 0:00 白峰屋·二楼客房
: 律回到房间的时候，已经过了午夜。
: 窗外的雪还在下。没有风了，雪就直直地落，一层一层，把整个世界压得静悄悄的。
: 小夜抱着膝盖坐在窗边的椅子上，没有回自己的房间。
@se knock
: 有人轻轻地敲门。
chiyuki: ……七濑先生。还没睡吧。
@show chiyuki[sad] C
: 千雪站在门口，换上了旅馆的浴衣，外面披着大衣。发簪已经取下来了，握在手里。
chiyuki[sad]: 对不起，这么晚。……睡不着。
ritsu: 进来吧。
: 她在矮桌边跪坐下来，把那支红山茶的发簪放在桌上，看着它。
chiyuki[normal]: 今天，谢谢您。在裁屋。
ritsu: 我什么也没证明。
chiyuki[normal]: 您说了「投票不是证据」。
chiyuki[sad]: 二十年前，大概没有一个人，替我母亲说过这句话。
: 她伸出手指，碰了碰发簪上那朵红色的山茶花。
chiyuki[normal]: 这是外婆给我的。外婆说，妈妈最喜欢山茶。
chiyuki[normal]: 关于妈妈，我知道的，几乎只有这一件事。
chiyuki[sad]: 外婆从来不提她。我问起来，她就说「在山里走丢了」，然后去厨房洗碗，洗很久。
chiyuki[normal]: 我自己记得的，只有一首歌。
ritsu: 歌？
chiyuki[normal]: 摇篮曲。三岁的时候，妈妈哄我睡觉，总是唱那一首。
chiyuki[normal]: 我记不清词了。只记得……有一段，好像本来是没有词的。
chiyuki[normal]: 妈妈自己给它编了词。一句一句，很小声地唱给我听。
chiyuki[sad]: 可是我只记得调子。词，一个字也想不起来。
: 她闭上眼睛，轻轻地哼了起来。
@bgm stop
: 两小节。很慢，很轻。升上去，又落下来。
: 像有人在黑暗里，一下一下地拍着一个孩子的背。
@se heartbeat
: 她停了下来，睁开眼睛。
chiyuki[shock]: ……今晚的广播。
chiyuki[shock]: 最后哼的那一段。就是这个调子。
sayo[surprise]: ……！
chiyuki[sad]: 我一直以为，那是妈妈自己编的歌。
chiyuki[sad]: 原来……是这个村子的歌。是第七片雪。
chiyuki[normal]: 妈妈给这个村子的歌，填了词。唱给我听。
@bgm sad
: 律想起了四方田的话。第七片雪没有歌词，只有旋律。村里的人，都只是哼。
> 可是有一个人，给它填过词。
> 而那个人，二十年前，走进了雪里。
chiyuki[normal]: 七濑先生。
chiyuki[normal]: 我来这个村子，不是为了报仇。也不是为了替妈妈洗清什么。
chiyuki[sad]: 我只是想知道……我的母亲，到底是一个什么样的人。
chiyuki[sad]: 是会拿铁杵砸死人的人，还是会给女儿编摇篮曲的人。
chiyuki[sad]: ……还是，两个都是。
ritsu: ……
ritsu: 那就去查吧。
ritsu: 查清楚了，你自己决定。
chiyuki[normal]: ……嗯。
: 千雪把发簪握回手里，站起来，向律深深地鞠了一躬。
chiyuki[smile]: 晚安，七濑先生。乌丸小姐。
@hide
@se door
: 门轻轻地合上了。走廊里，她的脚步声越走越远。
: 屋里只剩下雪落的声音。
@show sayo[normal] C
: 小夜一直坐在窗边。她没有笑，也没有吃东西。她看着窗外的雪，看了很久。
sayo[normal]: ……律君。
ritsu: 嗯。
sayo[normal]: 这个人，在模仿我。
@se heartbeat
: 她的声音里，没有「～」。
sayo[normal]: 喇叭里的声音。不露脸的「神」。童谣。规则。「依照古法」。
sayo[normal]: 先让所有人都被关在一个出不去的地方。再用广播，告诉他们：你们要自己审判自己。
sayo[dark]: 宵鸦岛上，我就是这么做的。一步一步，一模一样。
sayo[normal]: 连说话的方式都像。冷冰冰的，好像在念一篇早就写好的东西。
sayo[sad]: 可是底下……很难过。
ritsu: ……你听得出来？
sayo[sad]: 听得出来。
sayo[sad]: 因为我那时候，也是这样的。
: 她把右手从口袋里拿出来，放在膝盖上。白手套的指尖，轻轻地蜷了起来。
sayo[normal]: 这个人研究过宵鸦岛。研究过我。
sayo[normal]: 律君。我那时候想要的，不是杀人。是让真相浮出来。
sayo[dark]: 可是到最后，还是有人死了。
sayo[normal]: ……这一次，也会的。
: 律走到窗边，站在她身旁。
: 窗外，雪无声地落着。远处，几盏灯在雪里亮着。十一盏，十二盏。再远的地方，是一片什么也没有的黑。
ritsu: 小夜。
sayo[normal]: 嗯。
ritsu: 这一次，你站在我这边。
: 小夜抬起头看着他。过了一会儿，她笑了。
sayo[smile]: ……当然啦，侦探先生～
@hide
: 雪一直下到天亮。
: 没有人知道，在村子北边的山里，在那片什么也没有的黑暗里，有没有什么东西，正望着这几盏灯。

# prologue_interlude
@fade out
@bgm stop
@bg black
@wait 800
@title 雪之间|一
@bg charcoal_hut past
@filter dark
@weather none
@bgm lament
@fade in
@caption 雪之间
: ——炭的味道。
: 我先闻到的，是炭的味道。然后才是疼。手指、脚趾、脸颊，像有无数根针，一根一根往里钉。
: 我睁开眼睛。头顶是熏黑的椽子，一盏煤油灯，火苗缩得像一粒豆子。
: 我还活着。
: 这件事，花了我很久才弄明白。
gonzo{老人}: ……醒了？
: 一个老人蹲在灶边。他的脸被炉火照得一半红、一半黑，胡子上结着白霜。
gonzo{老人}: 别动。手上的布不能拆。拆了，指头就保不住了。
: 我想问他是谁。想问这是哪里。想问——那个孩子怎么样了。
: 我张开嘴。
: 喉咙里什么也没有。没有声音，连一点气音都没有。像是那场雪，把我的声音也一起埋掉了。
gonzo{老人}: 说不出话？……冻坏了，还是吓坏了，我也不懂。慢慢来。
: 他把一碗稀粥放在我手边。我的手被布缠成两团，捧不住碗。他就一勺一勺喂我。
: 粥很烫。我却一直在发抖。
@se wind
: 风从门缝里灌进来。门缝外面，是漆黑的山，和山脚下的村子。
@bg village_view past
@filter dark
@caption 雪之间
: 村子里亮着灯。我一盏一盏地数。
// 【线索】三十二盏灯——2003 年的村子只剩十来户亮灯
: 三十二盏。
: 每一盏灯底下，都有一户人家。那天晚上，每一户人家，都投了票。
@bg charcoal_hut past
@filter dark
@caption 雪之间
gonzo{老人}: 山神不收你。
: 老人往灶里添了一块炭，火光跳了一下。
gonzo{老人}: 山神不收的人，就得自己活下去。
: 我看着那三十二盏灯，看了很久，很久。
: 雪送，结束了吗？
: 还是说——
: 才刚刚开始。
@fade out
@weather none
@filter none
@chapterend
`
});
