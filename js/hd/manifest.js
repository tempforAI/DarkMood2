/* HD 美术脚本清单（按顺序注入；缺失的文件会被跳过） */
(function (root) {
  var DM = root.DM = root.DM || {};
  DM.HD_FILES = [
    'js/hd/kit.js',
    'js/hd/provider.js',
    'js/hd/chars.js',        // 角色生成器（与第一部相同）
    'js/hd/cast.js',         // 本作角色配置
    'js/hd/bg_village.js',   // 村落户外：吊桥、村道、浴场、水车、雪庭、神社、送门、雪谷、墓地、标题、地图
    'js/hd/bg_interior.js',  // 室内：旅馆、熊谷小屋、白峰本宅、离屋、拜殿、神乐殿、雪牢
    'js/hd/bg_places.js',    // 裁屋（审判）、炭烧小屋、诊所、商店、公民馆、分校、冬木旧宅、驻在所
    'js/hd/bg_extra.js',     // 分担：村景、火见橹、墓地、地藏堂、拜殿、神乐殿、雪牢
    'js/hd/icons.js'         // 证据图标（与第一部相同）
  ];
  DM.PX_FILES = [];          // 第二部没有像素版美术；老设备请用「低」画质预设
})(typeof window !== 'undefined' ? window : globalThis);
