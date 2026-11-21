/* 结局注册表 —— @ending <id> 引用这里的条目
 * type: 'BE'（坏结局）| 'HE'（好结局）；trueEnd: true 表示真结局
 * no: 结局编号（结局一览中的顺序）；hint: 未达成时在结局一览中显示的提示
 */
(function (root) {
  var DM = root.DM = root.DM || {};
  DM.ENDINGS = {
    be_ch1: { no: 1, type: 'BE', title: '雪中的母女',
      desc: '律沉默了。千雪在黎明穿上白衣，走上二十年前母亲走过的送道。',
      hint: '第一章。她说出「投我吧」的时候，你真的要尊重她吗？' },
    be_ch2: { no: 2, type: 'BE', title: '送行者',
      desc: '村子相信了医生。小夜被送进暴风雪，律追着她的脚印走进了雪葬谷。',
      hint: '第二章。昏黄的灯泡下，有些颜色是看不清的。' },
    be_ch3: { no: 3, type: 'BE', title: '无声之人',
      desc: '律不再相信石板上的字。不会说话的女人第二次被村子送进了雪里。',
      hint: '第三章。时间不对，不等于写下时间的人在说谎。' },
    be_ch4: { no: 4, type: 'BE', title: '侦探之死',
      desc: '小夜在深夜打开了雪牢。两个人在吹雪中迷了路，脚下是二十年前的那条送道。',
      hint: '第四章。你曾经在审判里把他逼上绝路——这一次，也请在审判里救他。' },
    be_ch5: { no: 5, type: 'BE', title: '白蛾之舞',
      desc: '律无法证明那个人还活着。宫司穿着白衣跳完最后一支舞，走进了黎明前的雪。',
      hint: '终章。炭烧小屋里，有些东西藏得比白蛾的秘密更深。' },
    he_ch5: { no: 6, type: 'HE', title: '雪融之时',
      desc: '除雪车与警车在黎明到来。这一次，没有人被送进雪里。',
      hint: '走到最后。' },
    te_ch5: { no: 7, type: 'HE', trueEnd: true, title: '春天的白蛾',
      desc: '春天的雪送祭上，修好的半钟第一次响起。暮色里，真正的白蛾在飞。',
      hint: '和她们一起度过更多的时间，并找到那张旧照片。' }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DM;
})(typeof window !== 'undefined' ? window : globalThis);
