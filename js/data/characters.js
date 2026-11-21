/* 角色注册表 —— DARK MOOD Ⅱ：雪葬村审判
 * 所有剧本中出现的角色 id 必须在此定义。
 * 时代：2003 年 2 月，东北深山雪村——除回忆角色外，所有人都穿冬装。
 */
(function (root) {
  var DM = root.DM = root.DM || {};

  // 表情列表（立绘生成器为每个角色生成这些表情）
  DM.EXPRS = ['normal', 'smile', 'sad', 'angry', 'surprise', 'think', 'shock', 'dark'];

  // visual 字段供立绘生成器参考：发型/发色/肤色/眼睛/服装/配饰
  DM.CHARS = {
    // ---------- 主角组 ----------
    ritsu: {
      name: '七濑 律', color: '#8fb8ff', title: '侦探', age: 24, height: 175,
      visual: { hair: 'short_messy', hairColor: '#2a2f3a', skin: '#f1d2b8', eyes: 'sharp', eyeColor: '#3a5a8a',
        outfit: 'long_wool_coat_dark_grey', outfitColor: '#3a3d44', inner: '#2a3550',
        accessory: 'grey_knit_scarf,scar_left_palm,navy_turtleneck' },
      desc: '主人公。四年前公开承认自己少年时代的推理是错的，被一些人称为「说出真相的侦探」，也被一些人骂作「骗子侦探」。冷静、内省，有点冷幽默。左掌有一道旧伤疤。'
    },
    sayo: {
      name: '乌丸 小夜', color: '#ff9fb5', title: '侦探助手', age: 23, height: 160,
      visual: { hair: 'shoulder_length_straight', hairColor: '#15151c', skin: '#f6dcc8', eyes: 'round', eyeColor: '#7a3040',
        outfit: 'camel_duffle_coat_toggles', outfitColor: '#c8b48a', inner: '#8a2a3a',
        accessory: 'red_muffler,white_glove_right_hand_only,red_notebook' },
      desc: '律的助手。开朗、爱捉弄人、嗜甜，说话爱拖长音。右手总戴着一只白手套。小报叫她「宵鸦岛的判官」。'
    },
    chiyuki: {
      name: '冬木 千雪', color: '#ff6a6a', title: '护士', age: 23, height: 162,
      visual: { hair: 'low_ponytail_side_bangs', hairColor: '#2a1f1a', skin: '#f4dcc8', eyes: 'earnest', eyeColor: '#4a3a30',
        outfit: 'navy_peacoat', outfitColor: '#2c3a5a', inner: '#f0ece4',
        accessory: 'red_camellia_hairpin,white_turtleneck,nurse_watch_on_chest' },
      desc: '仙台的护士。由外婆抚养长大。认真、倔强、善良，见到律的第一句话是「我没有给您写过信」。发间插着一支红山茶发簪。'
    },

    // ---------- 白峰家与白峰屋 ----------
    renji: {
      name: '白峰 莲司', color: '#c49a6c', title: '村长', age: 35, height: 178,
      visual: { hair: 'tired_short_unkempt', hairColor: '#2a2622', skin: '#e8c8a8', eyes: 'gentle_tired', eyeColor: '#3a3028',
        outfit: 'olive_quilted_work_jacket', outfitColor: '#4a5a48', inner: '#c8c0b0',
        accessory: 'cream_knit_sweater,cigarette_pack_in_pocket,light_stubble' },
      desc: '雪葬村的年轻村长，白峰屋的主人。温和、疲惫，想让村子跟上时代，却总被长老们压着。抽七星。'
    },
    miyabi: {
      name: '白峰 雅', color: '#d070c0', title: '白峰屋女将', age: 34, height: 163,
      visual: { hair: 'neat_low_updo', hairColor: '#1a1414', skin: '#f2dccc', eyes: 'composed_almond', eyeColor: '#3a2a2a',
        outfit: 'plum_kimono_black_haori', outfitColor: '#6a2a4a', inner: '#e8d8c8',
        accessory: 'gold_obi,tortoiseshell_hair_comb,thin_wedding_ring' },
      desc: '白峰屋的女将，莲司的妻子。东京出身，干练、笑容得体，待客无可挑剔。有失眠的毛病。'
    },
    minato: {
      name: '白峰 湊', color: '#50d8e8', title: '小学生', age: 11, height: 140,
      visual: { hair: 'bowl_cut', hairColor: '#1a1a20', skin: '#f6e0d0', eyes: 'big_clever', eyeColor: '#3a3a50',
        outfit: 'blue_kids_down_jacket', outfitColor: '#3a78b0', inner: '#e0e0e0',
        accessory: 'black_digital_watch,knit_cap_with_pompom,small_time_notebook,child' },
      desc: '白峰家的独生子。早熟，爱看钟、爱记时间，随身带着电子表和一本记满时刻的小本子。'
    },
    genichiro: {
      name: '白峰 源一郎', color: '#8a6a50', title: '老村长', age: 77, height: 165,
      visual: { hair: 'bald_white_sides', hairColor: '#d8d8d0', skin: '#dcbca0', eyes: 'stern_old_sunken', eyeColor: '#2a2020',
        outfit: 'padded_dotera_kimono', outfitColor: '#3a2a24', inner: '#8a7a68',
        accessory: 'sparse_white_beard,liver_spots,cane' },
      desc: '前任村长，莲司的父亲。卧病在离屋，时而昏聩、时而清醒；清醒时专横冷酷。'
    },

    // ---------- 村人 ----------
    sumi: {
      name: '葛城 澄', color: '#dccfff', title: '白蛾神社宫司', age: 36, height: 163,
      visual: { hair: 'long_straight_low_tied_paper_ribbon', hairColor: '#101014', skin: '#f6e4d8', eyes: 'gentle_downcast', eyeColor: '#3a3040',
        outfit: 'white_kosode_scarlet_hakama_white_haori', outfitColor: '#f4f2f0', inner: '#b02030',
        accessory: 'white_winter_haori,mizuhiki_hair_tie,prayer_beads' },
      desc: '白蛾神社的宫司，受全村敬重。温柔、端庄，说话轻而慢。冬天白衣绯袴外罩一件白羽织。'
    },
    shimo: {
      name: '霜', color: '#a0acc8', title: '白峰屋女佣', age: 48, height: 155,
      visual: { hair: 'tied_back_bun_greying', hairColor: '#4a4440', skin: '#e8cdb8', eyes: 'quiet_warm', eyeColor: '#3a3030',
        outfit: 'plain_grey_blue_kimono_white_apron', outfitColor: '#5a6274', inner: '#f0ece0',
        accessory: 'frostbite_scars_on_both_cheeks,grey_knitted_gloves,small_slate_with_chalk_on_cord' },
      desc: '白峰屋的女佣，十年前来到村子。脸颊有冻疤，不会说话，用随身的小石板写字交流。总戴着毛线手套。安静、勤快、很会照顾人。'
    },
    kiriya: {
      name: '桐谷 修平', color: '#70d8a8', title: '村诊所医生', age: 61, height: 168,
      visual: { hair: 'thin_grey_messy', hairColor: '#8a8a88', skin: '#e4c4a8', eyes: 'bleary_glasses', eyeColor: '#403830',
        outfit: 'wrinkled_labcoat_over_brown_cardigan', outfitColor: '#ece8e0', inner: '#6a5a48',
        accessory: 'wire_glasses,red_nose,hip_flask' },
      desc: '村里唯一的医生。疲惫、爱喝酒，医术不错，胆子却小。'
    },
    kumagai: {
      name: '熊谷 大吾', color: '#ff9a3a', title: '猎人', age: 46, height: 185,
      visual: { hair: 'shaggy_with_full_beard', hairColor: '#2a2018', skin: '#c89870', eyes: 'fierce', eyeColor: '#201810',
        outfit: 'brown_hunting_jacket_fur_collar', outfitColor: '#8a5a2a', inner: '#5a4a30',
        accessory: 'orange_knit_cap,rifle_sling,hunting_knife_on_belt' },
      desc: '村里的猎人，最懂雪与山。粗壮、嗓门大、迷信，脾气暴躁，看不惯外人。'
    },
    abe: {
      name: '阿部 文', color: '#e0c050', title: '杂货店兼邮局老板娘', age: 71, height: 148,
      visual: { hair: 'grey_bun', hairColor: '#b0aca8', skin: '#e6c8b0', eyes: 'sharp_squint', eyeColor: '#302820',
        outfit: 'red_brown_hanten_over_mompe', outfitColor: '#7a3a3a', inner: '#5a5a6a',
        accessory: 'reading_glasses_on_chain,checkered_apron,arm_covers' },
      desc: '村里杂货店兼邮局的老板娘。爱说闲话、眼尖嘴快，店窗正对着驻在所。'
    },
    arima: {
      name: '有马 骏', color: '#a080f0', title: '有马开发', age: 34, height: 180,
      visual: { hair: 'slicked_side_part', hairColor: '#1a1a1a', skin: '#ecd0b8', eyes: 'arrogant', eyeColor: '#2a2a2a',
        outfit: 'camel_overcoat_over_dark_suit', outfitColor: '#a88a60', inner: '#2a2a3a',
        accessory: 'gold_watch,leather_gloves,briefcase' },
      desc: '开发公司的人，来村里谈卖山建度假村的生意。油滑、傲慢。'
    },
    makabe: {
      name: '真壁 翔太', color: '#8ae070', title: '驻在所巡查', age: 27, height: 176,
      visual: { hair: 'short_neat', hairColor: '#1a1a1a', skin: '#ecd0b4', eyes: 'earnest_bright', eyeColor: '#2a3a50',
        outfit: 'navy_police_winter_coat', outfitColor: '#2a3a5a', inner: '#d8e0f0',
        accessory: 'police_cap,whistle_cord,flashlight' },
      desc: '一个人守着驻在所的年轻巡查。正直、热血，父亲也曾是这里的巡查。'
    },
    yomoda: {
      name: '四方田 圭', color: '#c8c870', title: '民俗学者', age: 44, height: 172,
      visual: { hair: 'swept_back_grey_streak', hairColor: '#3a3430', skin: '#ecd2b8', eyes: 'glasses_kind', eyeColor: '#3a3a30',
        outfit: 'brown_tweed_jacket_long_muffler', outfitColor: '#6a5a40', inner: '#c8b898',
        accessory: 'round_glasses,brown_muffler,field_notebook' },
      desc: '研究雪送习俗的民俗学者，借住在白峰本宅二楼整理旧文书。温文尔雅，一讲起传说就停不下来。'
    },
    hakuga: {
      name: '白蛾', color: '#ffffff', title: '？？？', age: 0, height: 0,
      visual: { hair: 'white_hood', hairColor: '#e8e8f0', skin: '#000000', eyes: 'mask', eyeColor: '#c0d0ff',
        outfit: 'white_cloak', outfitColor: '#f0f0f4', inner: '#c8c8d0',
        accessory: 'white_moth_mask_with_feathery_antennae,powdery_wing_pattern' },
      desc: '戴白蛾面具、以变声器说话的神秘人。只通过防灾广播说话。'
    },
    villager: {
      name: '村民', color: '#b0a898', title: '雪葬村的人们', age: 70, height: 160,
      visual: { hair: 'grey_cropped', hairColor: '#9a968e', skin: '#d8b898', eyes: 'old_suspicious', eyeColor: '#2a2420',
        outfit: 'padded_hanten', outfitColor: '#4a4a52', inner: '#7a6a58',
        accessory: 'knit_cap,wooden_voting_tag' },
      desc: '寄合里围坐的村中长老与村民。'
    },

    // ---------- 回忆角色（1983 年） ----------
    yukie: {
      name: '冬木 雪绘', color: '#ff9a80', title: '二十年前', age: 28, height: 160,
      visual: { hair: 'low_bun_with_kanzashi', hairColor: '#1a1410', skin: '#f6e2d2', eyes: 'gentle_strong', eyeColor: '#3a2a20',
        outfit: 'indigo_work_kimono_with_kappogi', outfitColor: '#3a4a6a', inner: '#f0e8e0',
        accessory: 'red_camellia_kanzashi' },
      desc: '二十年前被村子「送进雪里」的女人。千雪的母亲。'
    },
    soichi: {
      name: '白峰 惣一', color: '#b05050', title: '二十年前', age: 26, height: 180,
      visual: { hair: 'swept_back_messy', hairColor: '#1a1612', skin: '#e2bea0', eyes: 'drunk_cruel', eyeColor: '#2a1a1a',
        outfit: 'dark_tanzen_kimono_open_collar', outfitColor: '#2a2424', inner: '#6a3a30',
        accessory: 'flushed_cheeks,sake_bottle' },
      desc: '源一郎的长子。二十年前死在水车小屋。'
    },
    young_sumi: {
      name: '葛城 澄（16岁）', color: '#e8dcff', title: '二十年前', age: 16, height: 156,
      visual: { hair: 'long_straight_loose', hairColor: '#101014', skin: '#f8e8dc', eyes: 'frightened_gentle', eyeColor: '#3a3040',
        outfit: 'red_lined_cape_over_white_kimono', outfitColor: '#2a2a30', inner: '#c02030',
        accessory: 'cape_lining_scarlet,child' },
      desc: '二十年前的澄。'
    },
    young_renji: {
      name: '白峰 莲司（15岁）', color: '#d8b088', title: '二十年前', age: 15, height: 160,
      visual: { hair: 'short_boyish', hairColor: '#1a1612', skin: '#f2d8c0', eyes: 'wide_shy', eyeColor: '#3a3028',
        outfit: 'black_school_gakuran_with_padded_coat', outfitColor: '#1a1a24', inner: '#4a4a40',
        accessory: 'knit_gloves,child' },
      desc: '二十年前的莲司。'
    },
    gonzo: {
      name: '黑泽 权藏', color: '#9a8a70', title: '炭烧老人', age: 60, height: 166,
      visual: { hair: 'cropped_white_stubble', hairColor: '#c8c4bc', skin: '#a8805c', eyes: 'deep_wrinkled_silent', eyeColor: '#201a14',
        outfit: 'soot_stained_work_clothes_straw_cape', outfitColor: '#4a4034', inner: '#6a5a44',
        accessory: 'towel_headband,charcoal_smudges,straw_mino_cape' },
      desc: '谷口林中独居的炭烧老人。村里人叫他「炭老头」。'
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DM;
})(typeof window !== 'undefined' ? window : globalThis);
