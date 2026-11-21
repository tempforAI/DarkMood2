/* 场所注册表 —— DARK MOOD Ⅱ：雪葬村审判
 * 背景 id、所属区域、地图坐标、可调查锚点
 * 坐标系：画布 480x270（像素）。anchors: { 名称: [x, y, w, h] }（HD 版乘以 4）
 * 背景生成器需在锚点范围内画出对应物件；剧本中的调查点用 anchor 名称引用。
 * 室内为正面单点透视，地平线约 y=170；室外天空为冬季阴天（铅灰云层），地面是积雪。
 * 夜晚、吹雪、回忆由引擎滤镜/粒子叠加（@filter cold / @weather snow|blizzard / @flashback）。
 */
(function (root) {
  var DM = root.DM = root.DM || {};

  // 地图上的区域（大地图节点）。雪葬谷自西北向东南绕过村子所在的台地。
  DM.AREAS = {
    bridge:     { name: '白蛾桥·隧道',   map: [440, 214] },
    road:       { name: '村道',          map: [352, 190] },
    inn:        { name: '白峰屋',        map: [262, 176] },
    mill:       { name: '水车小屋',      map: [226, 210] },
    bathhouse:  { name: '雪见汤',        map: [222, 80] },
    kumagai:    { name: '熊谷的小屋',    map: [244, 136] },
    clinic:     { name: '诊所',          map: [300, 214] },
    police:     { name: '驻在所',        map: [372, 168] },
    store:      { name: '杂货店·邮局',   map: [396, 204] },
    sabakiya:   { name: '裁屋',          map: [196, 140] },
    hall:       { name: '公民馆',        map: [148, 108] },
    watchtower: { name: '火见橹',        map: [172, 90] },
    shrine:     { name: '白蛾神社',      map: [96, 60] },
    shiramine:  { name: '白峰本宅',      map: [150, 176] },
    fuyuki:     { name: '冬木家旧宅',    map: [64, 150] },
    cemetery:   { name: '墓地',          map: [84, 204] },
    jizo:       { name: '地藏堂',        map: [136, 228] },
    school:     { name: '分校',          map: [404, 104] },
    okurimon:   { name: '送门·雪葬谷',   map: [46, 108] },
    charcoal:   { name: '炭烧小屋',      map: [30, 40] }
  };

  DM.LOCS = {
    // ---------- 特殊 ----------
    black:   { name: '', area: null, anchors: {} },
    white:   { name: '', area: null, anchors: {} },
    title:   { name: '', area: null, anchors: {} },
    map:     { name: '雪葬村', area: null, anchors: {} },

    // ---------- 隧道与吊桥 ----------
    // 隧道口（对岸一侧）：巴士终点站，雪崩后洞口被雪堵死
    tunnel: { name: '旧隧道口', area: 'bridge', anchors: {
      portal: [150, 58, 180, 150], icicles: [160, 58, 160, 20], avalanche: [176, 110, 128, 98],
      bus_stop: [56, 120, 22, 78], road: [110, 206, 260, 64] } },
    // 吊桥：从村子一侧的桥头望向雪葬谷与对岸的隧道口
    bridge: { name: '白蛾桥', area: 'bridge', anchors: {
      pillar: [24, 90, 48, 120], nameplate: [34, 140, 28, 22], shimenawa: [80, 166, 80, 22],
      anchor: [60, 190, 110, 56], main_cable: [150, 64, 300, 46], deck: [170, 140, 290, 26],
      lamps: [220, 112, 200, 18], far_tunnel: [400, 70, 60, 52], junction_box: [410, 170, 40, 52],
      valley: [176, 200, 220, 70] } },

    // ---------- 村道 ----------
    // 左：白峰屋门面与带屋檐的柴棚；中：消雪管喷水的湿路面；右：雪墙、汤川与涵洞
    village_road: { name: '村道', area: 'road', anchors: {
      inn_front: [10, 52, 130, 100], shed: [40, 152, 80, 40], houses: [160, 70, 200, 70],
      road: [150, 190, 180, 80], nozzles: [196, 236, 90, 14], yukawa: [396, 140, 70, 64],
      culvert: [372, 206, 70, 40] } },

    // ---------- 白峰屋 ----------
    inn_entrance: { name: '白峰屋·玄关', area: 'inn', anchors: {
      shoe_box: [20, 104, 68, 96], register: [110, 154, 56, 14], counter: [92, 168, 104, 38],
      noren: [200, 40, 80, 26], doorway: [196, 66, 88, 124], step: [150, 212, 180, 28],
      umbrella: [346, 168, 24, 40], coat_rack: [388, 74, 44, 130] } },
    inn_hearth: { name: '白峰屋·围炉里之间', area: 'inn', anchors: {
      shoji: [16, 70, 64, 130], tv: [96, 112, 60, 48], jizai: [232, 56, 16, 92],
      kettle: [226, 150, 28, 26], irori: [168, 182, 144, 48], window: [330, 40, 110, 70],
      sake_shelf: [404, 118, 60, 84] } },
    inn_room: { name: '白峰屋·客房', area: 'inn', anchors: {
      tokonoma: [24, 58, 84, 112], heater: [96, 150, 30, 40], luggage: [112, 198, 52, 30],
      low_table: [178, 152, 112, 30], futon: [176, 200, 210, 44], window: [296, 38, 128, 82],
      closet: [404, 70, 64, 124] } },
    inn_kitchen: { name: '白峰屋·厨房', area: 'inn', anchors: {
      stove: [16, 108, 100, 84], shichirin_shelf: [132, 148, 80, 44], table: [170, 200, 150, 38],
      sink: [230, 120, 74, 40], tea_cupboard: [318, 62, 60, 70], medicine_box: [324, 136, 48, 16],
      back_door: [400, 80, 62, 122] } },
    inn_bath: { name: '白峰屋·女汤', area: 'inn', anchors: {
      tag_board: [30, 60, 40, 56], baskets: [80, 110, 80, 64], washing_area: [60, 196, 130, 40],
      drain: [196, 236, 40, 14], tub: [230, 160, 220, 64], window: [300, 36, 130, 60] } },

    // ---------- 雪见汤 ----------
    // 一张图同时画出：左男汤、右女汤两个露天池，中间竹篱（下方有缝），
    // 男汤池边向池心倾斜的岩台，两池溢出的热水在画面下方汇成冒热气的小溪「汤川」
    bathhouse: { name: '雪见汤', area: 'bathhouse', anchors: {
      men_hut: [16, 64, 84, 72], rock_ledge: [60, 132, 90, 34], men_pool: [30, 168, 180, 58],
      men_path: [0, 206, 64, 64], fence: [216, 50, 48, 96], fence_gap: [224, 150, 32, 30],
      women_pool: [272, 168, 180, 58], women_hut: [384, 64, 84, 72], women_path: [418, 206, 62, 64],
      yukawa: [200, 240, 80, 30] } },
    kumagai_hut: { name: '熊谷的小屋', area: 'kumagai', anchors: {
      front_door: [16, 66, 60, 140], wader: [96, 60, 48, 110], rifle_rack: [160, 50, 80, 44],
      stove: [170, 164, 70, 50], pelts: [250, 48, 80, 60], back_door: [360, 70, 60, 130],
      back_steps: [352, 204, 70, 44], stream: [428, 206, 52, 64] } },

    // ---------- 水车小屋 ----------
    // 左半：屋外冻住的水车（挂满冰柱）、水闸、盖着薄冰的水渠；右半：屋内剖面，唐臼（杵与臼）
    watermill: { name: '水车小屋', area: 'mill', anchors: {
      wheel: [20, 36, 150, 170], axle: [78, 108, 40, 30], icicles: [36, 150, 120, 26],
      sluice: [0, 180, 40, 50], channel: [40, 222, 190, 40], path: [196, 214, 100, 56],
      door: [234, 84, 48, 118], cam: [288, 88, 28, 36], pestle: [330, 46, 46, 116],
      mortar: [318, 184, 72, 30], body: [300, 216, 150, 32], iron_rack: [420, 120, 44, 70] } },

    // ---------- 白峰本宅 ----------
    shiramine_hall: { name: '白峰本宅·大广间', area: 'shiramine', anchors: {
      butsudan: [20, 60, 76, 116], stairs: [110, 64, 50, 136], portraits: [190, 24, 110, 36],
      documents: [190, 184, 120, 34], bookshelf: [340, 58, 120, 120] } },
    // 本宅二楼客房（四方田的房间）：窗户正对下方离屋侧墙
    shiramine_2f: { name: '本宅二楼·客房', area: 'shiramine', anchors: {
      books: [20, 80, 56, 100], bag: [62, 198, 72, 36], desk: [84, 140, 96, 40],
      window: [176, 36, 128, 78], windowsill: [176, 116, 128, 12], heater: [320, 170, 40, 40],
      closet: [384, 58, 80, 146] } },
    // 离屋室内：纸糊死的窗与紧闭的雨户、掘被炉（四周是嵌在地板里的旧围炉里铁框）、右墙烟道口、裸灯泡
    annex: { name: '离屋', area: 'shiramine', anchors: {
      door: [18, 70, 60, 134], tansu: [86, 90, 62, 90], lamp: [230, 6, 20, 30],
      kotatsu: [150, 168, 180, 50], iron_frame: [136, 218, 56, 18], body: [196, 204, 140, 30],
      window: [350, 44, 100, 64], flue: [350, 120, 26, 48], tray: [352, 196, 56, 28] } },
    // 雪庭（室外）：左为离屋与门，右为本宅侧墙；两者间的窄缝堆满落雪，
    // 离屋侧墙的排气管口、其上方本宅一楼的庇（带雪止）、再上方二楼窗户
    snow_garden: { name: '雪庭', area: 'shiramine', anchors: {
      stone_lantern: [16, 156, 30, 52], annex_door: [64, 118, 58, 92], path: [70, 214, 240, 50],
      window2f: [300, 24, 64, 52], eave: [262, 86, 150, 22], gap: [268, 126, 110, 86],
      vent: [306, 150, 28, 24], gate: [410, 140, 62, 100] } },

    // ---------- 白蛾神社 ----------
    shrine: { name: '白蛾神社·石阶', area: 'shrine', anchors: {
      noticeboard: [40, 140, 40, 50], lanterns: [110, 120, 32, 64], torii: [176, 18, 128, 116],
      shimenawa: [184, 36, 112, 12], steps: [178, 134, 124, 136], onnazaka: [380, 130, 90, 90] } },
    shrine_hall: { name: '白蛾神社·拜殿', area: 'shrine', anchors: {
      storeroom: [16, 92, 80, 100], hall: [110, 36, 260, 120], bell_rope: [232, 92, 16, 64],
      offering_box: [200, 168, 80, 30], shamusho: [384, 86, 86, 90] } },
    // 神乐殿：左侧男坂石阶顶，中为舞台（前檐），右侧以短廊相连的面藏
    kagura: { name: '神乐殿与面藏', area: 'shrine', anchors: {
      steps_top: [0, 196, 110, 74], stage: [60, 58, 250, 110], eaves: [60, 172, 250, 16],
      snow_lanterns: [130, 200, 60, 30], passage: [310, 92, 50, 30], mask_store: [360, 70, 104, 120],
      masks: [378, 92, 68, 40], body: [366, 200, 96, 34] } },
    snow_prison: { name: '雪牢（冰室）', area: 'shrine', anchors: {
      ice_walls: [0, 0, 140, 90], lantern: [44, 110, 20, 30], lattice: [150, 46, 220, 160],
      straw: [176, 210, 170, 30], door: [400, 60, 64, 150] } },

    // ---------- 裁屋（审判背景） ----------
    sabakiya: { name: '裁屋', area: 'sabakiya', anchors: {
      record_chest: [24, 118, 64, 50], elder_seat: [176, 108, 128, 40], jizai: [232, 40, 16, 120],
      irori: [186, 182, 108, 46], tally_board: [384, 60, 72, 84], ring: [0, 232, 480, 38] } },

    // ---------- 送门与雪葬谷 ----------
    okurimon: { name: '送门', area: 'okurimon', anchors: {
      stones: [56, 156, 44, 62], gate: [168, 36, 144, 160], path: [196, 196, 88, 74],
      offerings: [330, 196, 48, 28], signpost: [380, 120, 30, 70] } },
    valley: { name: '雪葬谷', area: 'okurimon', anchors: {
      ledge: [0, 160, 120, 110], path_end: [150, 120, 80, 40], chasm: [130, 170, 230, 100],
      trees: [370, 36, 110, 170] } },

    // ---------- 炭烧小屋 ----------
    charcoal_hut: { name: '炭烧小屋', area: 'charcoal', anchors: {
      kiln: [16, 88, 104, 112], iron_box: [96, 206, 52, 28], radio: [136, 150, 40, 28],
      shelf: [176, 66, 96, 58], kamidana: [220, 18, 60, 28], brazier: [220, 192, 60, 36],
      bed: [296, 176, 170, 50], floorboard: [312, 228, 100, 26], window: [384, 40, 76, 58] } },
    // 从小屋前的斜坡俯瞰山下村子的夜景（远处右侧是吊桥）
    village_view: { name: '山下的村子', area: 'charcoal', anchors: {
      school: [110, 116, 36, 30], watchtower: [226, 104, 22, 40], bridge: [380, 110, 90, 30],
      lights: [60, 150, 360, 50], valley: [0, 210, 480, 60] } },

    // ---------- 村中各处 ----------
    clinic: { name: '桐谷诊所', area: 'clinic', anchors: {
      shelf: [16, 58, 96, 130], records: [126, 58, 60, 84], desk: [160, 152, 112, 40],
      window: [236, 36, 84, 62], bed: [282, 166, 110, 44], safe: [396, 124, 68, 84] } },
    // 杂货店兼邮局：店内，右侧玻璃门窗正对马路对面的驻在所；屋檐下的灰色插卡电话
    store: { name: '阿部商店（邮局）', area: 'store', anchors: {
      shelves: [16, 50, 120, 130], cigarettes: [160, 92, 70, 40], post_window: [244, 96, 60, 40],
      counter: [150, 148, 160, 44], window: [316, 36, 90, 96], phone: [414, 104, 40, 72] } },
    // 公民馆·防灾广播室
    community_hall: { name: '公民馆·广播室', area: 'hall', anchors: {
      door: [16, 70, 56, 132], key_box: [86, 76, 40, 40], cabinet: [88, 136, 76, 86],
      mic: [244, 98, 20, 28], console: [184, 124, 140, 56], log_book: [200, 184, 60, 16],
      timer_deck: [334, 140, 52, 28], window: [372, 40, 90, 70] } },
    watchtower: { name: '火见橹', area: 'watchtower', anchors: {
      hall_roof: [16, 130, 150, 80], bell: [220, 14, 40, 36], tower: [196, 50, 90, 160],
      ladder: [232, 60, 18, 150], plaque: [300, 176, 44, 28] } },
    school: { name: '废弃的分校', area: 'school', anchors: {
      notice: [24, 40, 64, 52], organ: [20, 120, 70, 74], blackboard: [136, 36, 210, 72],
      songbook: [200, 148, 50, 16], desks: [96, 170, 290, 60], window: [372, 40, 92, 96] } },
    jizo: { name: '地藏堂', area: 'jizo', anchors: {
      hall: [176, 28, 128, 86], jizo_row: [30, 124, 360, 74], nameless_jizo: [400, 124, 50, 74],
      offerings: [196, 206, 90, 26] } },
    cemetery: { name: '墓地', area: 'cemetery', anchors: {
      gonzo_grave: [48, 118, 52, 82], fuyuki_grave: [176, 122, 52, 78], shiramine_grave: [296, 80, 96, 120],
      graves: [400, 110, 70, 90], path: [150, 212, 190, 58] } },
    fuyuki_house: { name: '冬木家旧宅', area: 'fuyuki', anchors: {
      doorway: [30, 68, 70, 132], pillar: [150, 56, 22, 128], hearth: [200, 182, 112, 40],
      window: [332, 40, 96, 66], cupboard: [384, 116, 76, 98] } },
    // 驻在所：左后门与铁炉，桌上便条本与烟灰缸，正面窗户对着杂货店，右侧衣钩（警服大衣、警帽）与储物柜
    police_box: { name: '驻在所', area: 'police', anchors: {
      back_door: [6, 64, 34, 140], stove: [44, 146, 70, 74], radio: [122, 108, 44, 30],
      window: [200, 36, 120, 82], notepad: [206, 140, 34, 10], ashtray: [288, 140, 22, 10],
      desk: [190, 150, 128, 40], coat_hook: [340, 64, 40, 96], locker: [392, 66, 68, 140] } }
  };

  // 背景变体（剧本中 @bg <id> <variant>）：
  //   bridge:cut          —— 主索在村侧锚碇断开，桥面垂进雪葬谷（序章夜起）
  //   village_road:past   —— 1983 年的村道：家家亮灯、人多、店招新
  //   watchtower:past     —— 1983 年：半钟完好、发亮（2003 年钟上有一道裂缝）
  //   snow_garden:buried  —— 排气管口被一堆棱角分明、带铲痕的雪块埋住；庇上积雪缺了一块直角（第二章）
  //   charcoal_hut:past   —— 1983 年有人居住：炭窑有火、草席床铺、木板上的炭字、收音机（幕间用）
  //   village_view:past   —— 1983 年的夜景：三十二盏灯、吊桥上一串灯亮着、分校窗里有光（终章闪回 / 幕间可选）
  //   fuyuki_house:past   —— 1983 年雪绘母女住着时：整洁、围炉里有火、柱上刻痕崭新
  DM.BG_VARIANTS = {
    bridge: ['cut'], village_road: ['past'], watchtower: ['past'], snow_garden: ['buried'],
    charcoal_hut: ['past'], village_view: ['past'], fuyuki_house: ['past']
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DM;
})(typeof window !== 'undefined' ? window : globalThis);
