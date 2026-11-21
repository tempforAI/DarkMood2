# DARK MOOD 剧本与数据格式规范（DMS）

所有剧情数据都是普通 JS 文件（非 ES module），通过 `<script>` 加载，可以直接用 `file://` 打开。
每章一个文件：`js/data/chapters/<章节id>.js`。写完后必须运行：

```bash
node tools/validate.js js/data/chapters/ch1.js
```

校验通过（0 error）才算完成。warning 也应尽量消除。

---

## 1. 章节文件模板

```js
DM.registerChapter({
  id: 'ch1',                 // prologue / ch1 … ch6 / epilogue
  title: '第一章',
  name: '笼中之鸦',
  next: 'ch2',               // @chapterend 之后加载的章节；最后一章写 null
  start: 'ch1_start',        // 入口标签
  evidence: { /* 见 §3 */ },
  explore:  { /* 见 §4 */ },
  games:    { /* 见 §5 */ },
  script: String.raw`
# ch1_start
@title 第一章|笼中之鸦
...
`
});
```

* `script` 必须用 `` String.raw`...` ``。正文里**禁止出现反引号 `` ` `` 和 `${`**。
* 标签名、证据 id、游戏 id 必须以本章 id 为前缀（如 `ch1_`），避免与其他章节冲突。
* 换行：对白中写 `\n` 表示强制换行（一般不需要）。

---

## 2. 剧本语法（逐行）

空行忽略；`//` 开头是注释。

| 写法 | 含义 |
|---|---|
| `# 标签名` | 定义标签（跳转目标）。只能用字母数字下划线。 |
| `角色id: 台词` | 对白。角色 id 见 `js/data/characters.js`。冒号可用全角 `：`。 |
| `角色id[表情]: 台词` | 带表情。表情：`normal smile sad angry surprise think shock dark` |
| `角色id{显示名}[表情]: 台词` | 覆盖名字栏，例如 `judge{？？？}: ……`、`shio{少女的声音}[sad]: ……` |
| `: 旁白` | 旁白（无名字栏）。 |
| `> 独白` | 主角律的内心独白（蓝色、带括号显示）。 |
| `@指令 参数` | 见下表。 |

**立绘规则**：非 `ritsu` 的角色说话时，若未在场会自动以居中单人立绘登场（替换其他立绘），表情随台词更新；
`ritsu` 是视角人物，他说话时不显示立绘、也不替换当前立绘。
需要同时显示多人时用 `@show a L` / `@show b R`，此后说话者若已在场则只改表情并高亮。

### 指令一览

| 指令 | 说明 |
|---|---|
| `@bg 场所id [变体] ` | 切换背景（id 见 `js/data/locations.js`），会清空立绘。变体如 `burnt` `past` `tracks`。 |
| `@show 角色id[表情] [L\|C\|R]` | 显示立绘，例：`@show shio[smile] L` |
| `@hide [角色id]` | 隐藏某人；不带参数隐藏全部 |
| `@bgm 曲目` | 曲目：`title daily calm island mystery investigate tension horror sad trial debate truth judge finale ending snow village lament stop` |
| `@se 音效` | 音效：`select ok ng door knock bell thunder scream crash glass footsteps splash fire wave getitem gavel heartbeat shout slash clock phone wind chime snowstep creak` |
| `@weather rain\|fog\|embers\|snow\|blizzard\|none` | 持续天气粒子（雨、雪、雾只在室外背景显示；embers 处处显示） |
| `@filter night\|dark\|sepia\|red\|cold\|dusk\|none` | 画面滤镜（`@bg` 不会清除滤镜）。cold=冷色雪夜，dusk=黄昏 |
| `@flashback on\|off` | 回忆模式（棕褐色 + 暗角） |
| `@shake` | 画面震动 |
| `@flash [white\|red\|black]` | 闪屏 |
| `@fade out\|in` | 黑场淡出/淡入 |
| `@wait 毫秒` | 停顿 |
| `@title 第一章\|笼中之鸦` | 章节标题卡 |
| `@caption 8月13日 21:05 中庭` | 左上角时间地点字幕（持续到下一次 @caption 或 @bg） |
| `@poem 一只乌鸦锁进笼……` | 黑底居中大字（童谣、关键句），点击继续 |
| `@letter 信件全文` | 以信纸样式展示一封信/字条（可用 `\n` 换行），点击关闭 |
| `@shout [角色id] 不对！` | 大字冲击特写（审判中的「不对！」「就是这个！」等） |
| `@goto 标签` | 跳转 |
| `@choice` | 选项，后续每行 `- 选项文字 -> 标签` |
| `@set 旗标 [值]` | 设置旗标（默认 true） |
| `@inc 计数器 [n]` | 计数器 +n |
| `@if 条件 -> 标签` | 条件跳转。条件：`flag` / `!flag` / `has:证据id` / `!has:证据id` / `计数器>=数字` / `bond:角色id>=数字`（羁绊）/ `ending:结局id`（曾达成过该结局，跨周目） |
| `@get 证据id` | 获得证据（弹窗提示），同时写入「侦探手账」 |
| `@update 证据id 新描述` | 更新证据描述（例如调查后得到新信息） |
| `@note 角色id 文本` | 在角色档案里追加一条备注 |
| `@unlock 场所id` / `@lock 场所id` | 地图解锁/上锁（全局） |
| `@explore 探索id` | 进入探索/搜证模式（§4） |
| `@return` | 结束调查点或自由时间事件，回到探索模式/自由时间 |
| `@freetime N` | 自由时间：玩家可选择 N 次与角色共度（事件在 freetime.js） |
| `@game 游戏id` | 进入审判小游戏（§5），成功后继续下一行；**不存在失败**，答错只给提示 |
| `@trial on\|off` | 进入/离开审判模式（审判厅背景 + 证言台演出） |
| `@bond 角色id` | 羁绊 +1（自由时间事件末尾使用） |
| `@checkpoint` | 分歧点：自动保存一个「分歧点存档」。坏结局之后，玩家可以选择「回到分歧点」从这里重来。放在会导向坏结局的 `@choice` 之前 |
| `@ending 结局id` | 播放结局（id 在 `js/data/endings.js` 注册）。坏结局：结局卡 →「回到分歧点 / 回到标题」；好结局：结局卡 → 片尾。之后的指令不再执行 |
| `@chapterend` | 本章结束，存档并加载 `next` 章节 |
| `@end` | 游戏结束，进入片尾 |

### 文字长度
一句台词建议不超过 70 个汉字（对话框三行）。长段落请拆成多句。

---

## 3. 证据 evidence

```js
evidence: {
  ch1_knife: { name: '厨刀', icon: 'knife', desc: '插在死者胸口的刀……' },
}
```

`icon` 可选值：
`knife key note letter rope string feather bottle pill photo book diary clock bell cloth paint shoe footprint tape recorder ring hairpin candle fire map blueprint plate glass cup violin card lamp window door cage sand boat cable wax sequin tooth doll testimony body generic mask moth snow ice charcoal lantern geta shovel radio kimono ticket mill bridge pendant medicine glove`

`testimony` 用于「证词」类证据（某人的证言也是证据）。

---

## 4. 探索 explore

```js
explore: {
  ch1_inv: {
    title: '搜查开始',                    // 进入时的横幅
    mode: 'investigate',                  // investigate=搜证（显示收集进度）  free=日常自由行动
    start: 'study',                       // 起始场所
    places: ['study', 'tower_stairs', 'courtyard', 'kitchen', 'e3'],
    custom: {                             // 可选：自定义场所（同一背景的不同房间）
      e3: { bg: 'east_room', name: '东翼3号室（恭介的房间）', area: 'mansion' }
    },
    filter: 'night',                      // 可选：本次探索所有背景的滤镜
    weather: 'rain',                      // 可选
    spots: {
      study: [
        { anchor: 'bolt', label: '门闩', run: 'ch1_i_bolt' },
        { x: 300, y: 200, label: '血迹', run: 'ch1_i_blood' }   // 也可直接给坐标（480x270）
      ]
    },
    people: {
      courtyard: [ { char: 'mio', run: 'ch1_i_talk_mio', x: 160 } ]   // x: 小人站位(0-480)
    },
    done: { need: ['ch1_knife', 'ch1_bolt', 'flag:ch1_talked_mio'], run: 'ch1_trial_start',
            prompt: '该查的都查过了。前往审判厅吗？' }
  }
}
```

* `spots` / `people` 的 `run` 指向一个标签，该段剧本必须以 `@return` 结束（可以中途 `@get`、`@set`）。
* 同一个调查点可以重复点击；若希望第二次说不同的话，用 `@if 旗标 -> 标签` 自己分支。
* `done.need` 全部满足后，界面出现「结束调查」按钮，点击后跳到 `done.run`。`need` 中 `flag:xxx` 表示旗标。
* `mode: 'free'` 用于日常：`done` 同样适用（例如「和所有人打过招呼」）。
* 场所 id 可用 `locations.js` 中的任意背景 id，或 `custom` 里定义的 id。
* 每个调查点 `spots` 中的 `anchor` 必须是该背景在 `locations.js` 中定义的锚点名。

---

## 5. 审判小游戏 games

**所有小游戏都没有失败惩罚**：答错只扣「信念」（会自动恢复），并逐步给出提示。请为每个游戏写 `hint`。

### 5.1 证言交锋 debate
众人轮流发言，台词中的 `{弱点}` 高亮。玩家选择一件证据，「射向」矛盾的弱点。

```js
ch1_g1: {
  type: 'debate', title: '证言交锋',
  ammo: ['ch1_window', 'ch1_bolt', 'ch1_knife'],        // 可选择的证据（必须是本章 evidence 中的 id）
  lines: [
    { who: 'fuwa', expr: 'angry', text: '恭介杀了人，然后从{窗户}逃走了。' },
    { who: 'kyosuke', expr: 'shock', text: '我、我那时候一直{在自己房间}！' },
    { who: 'kiryu', text: '门可是{从里面闩上的}。' }
  ],
  answer: { line: 0, weak: 0, ammo: 'ch1_window' },      // 第0句的第0个弱点 + 证据
  hint: '窗外墙壁的状况能说明什么？'
}
```
* 每句可以有 0~2 个弱点；`answer.weak` 是该句内第几个 `{}`（从 0 开始）。
* 建议 3~6 句，ammo 3~5 件（包含 1~2 件干扰项）。

### 5.2 一对一对峙 rebuttal
与单个对手对峙；玩家手里不是证据，而是「反驳之刃」（短句）。

```js
ch1_g8: {
  type: 'rebuttal', who: 'mio',
  blades: ['书斋晚饭后才启用', '颜料要几天才干', '雨从八点开始下'],
  lines: [
    { expr: 'normal', text: '那块颜料啊……是我{晚饭前}去书斋送素描时蹭上的。' },
    { expr: 'angry',  text: '这有什么{奇怪}的？' }
  ],
  answer: { line: 0, weak: 0, blade: 0 },
  hint: '书斋是什么时候开始使用的？'
}
```

### 5.3 出示证据 present
```js
ch1_g3: { type: 'present', prompt: '能证明门闩被线拉动过的证据是——', answer: 'ch1_bolt', hint: '……' }
```
证据池 = 本章已获得的全部证据。

### 5.4 指认人物 pick
```js
ch1_g5: { type: 'pick', prompt: '那段时间里，独自待在塔附近的人是？',
          options: ['kyosuke', 'usami', 'mio', 'fuwa'], answer: 'mio', hint: '……' }
```

### 5.5 灵光拼字 keyword
屏幕上漂浮着若干汉字，玩家按顺序点出答案。
```js
ch1_g4: { type: 'keyword', prompt: '拉动钓鱼线的「力量」来自——', answer: '重锤',
          decoys: '钟齿轮绳鸦窗', hint: '钟楼里什么东西会在整点下落？' }
```
答案 2~5 字；decoys 4~8 个干扰字。

### 5.6 推理回廊 logic
连续选择题（每题 3 个选项）。
```js
ch1_g6: { type: 'logic', title: '推理回廊', questions: [
  { q: '昨晚九点，钟敲了几下？', opts: ['九下', '八下', '十下'], a: 1 },
  { q: '少了一下意味着？', opts: ['钟坏了', '重锤被额外的力量拖住', '有人数错了'], a: 1 }
], hint: '……' }
```

### 5.7 真相重演 reconstruct
高潮整理：多格漫画，每格一个空，三选一。
```js
ch1_g9: { type: 'reconstruct', panels: [
  { text: '晚上八点半过后，凶手以【？】为借口拜访书斋。', opts: ['千鹤的日记', '晚餐', '钥匙'], a: 0 },
  ...
] }
```
建议 5~8 格；完成后用对白把完整真相再讲一遍。

### 5.8 投票 vote
```js
ch1_g10: { type: 'vote', options: ['kyosuke', 'usami', 'mio', 'fuwa', 'shiori'], answer: 'mio' }
```

可选通用字段：`wrong: '……'`（答错时律的独白，替代默认文本）。

---

## 6. 自由时间 freetime（js/data/freetime.js）

```js
DM.registerFreetime({
  events: {
    mio: [
      { label: 'ft_mio_1', chapters: ['prologue', 'ch1'], place: 'courtyard' },
      { label: 'ft_mio_2', chapters: ['ch2', 'ch3', 'ch4', 'ch5'], place: 'cells' }
    ]
  },
  script: String.raw`
# ft_mio_1
@bg courtyard
mio: ……
@bond mio
@return
`
});
```
* `@freetime N` 时，列出「下一个事件在当前章节可用」的角色供选择。
* 每个事件以 `@bond 角色id` + `@return` 结束。标签以 `ft_` 开头。

---

## 7. 审判段落的写法

```
# ch1_trial
@bg judgment
@trial on
@bgm trial
@caption 8月14日 10:00 审判厅
judge: 那么，审判开始。
...
@game ch1_g1
...
@trial off
```

* `@trial on` 后，说话者以「证言台」演出显示（背景是审判厅的环形席位）。审判中尽量不要 `@bg`；需要回忆画面时：
  `@flashback on` → `@bg study` → 若干台词 → `@flashback off` → `@trial on`（回到审判厅）。
* 已死亡或已关进鸦笼的角色不能在审判中发言（终章例外：被关押者被带上审判厅）。
* 小游戏之间要有足够的对白：先让众人陷入错误推论，再用小游戏推翻，推翻后要有角色的反应与过渡。
* 小游戏前用一句律的独白或台词提示玩家「接下来要找什么」，但不要直接说出答案。
* 判官（judge）在审判中通过广播发言，名字栏显示「判官」，立绘是乌鸦面具。

## 8. 写作风格

* 日系本格推理（金田一、岛田庄司、绫辻行人）的中文译本腔调：日本人名、「～先生/小姐/君」敬称。
* 推理必须**公平**：真相所需的每一条线索，都要在审判前让玩家看到。
* 审判节奏：错误推论 → 被证据推翻 → 新疑点 → 再推翻……层层反转，最后锁定真凶。
* 角色口吻请严格遵循 `docs/STORY_BIBLE.md` 的角色表。
* 不要出现任何现实中已有作品的角色名、设定名、口号。


## 9. 分支与结局

* 结局在 `js/data/endings.js` 注册：
  ```js
  DM.ENDINGS = {
    be_silence: { no: 1, type: 'BE', title: '沉默之笼', desc: '结局一览中显示的一句话（达成后）', hint: '未达成时的提示（不剧透）' },
    he_dawn:    { no: 8, type: 'HE', trueEnd: true, title: '……', desc: '……', hint: '……' }
  };
  ```
* 坏结局的写法：在分歧选项前 `@checkpoint`，错误选项跳到 `chX_be_xxx` 标签，演出坏结局剧情后 `@ending be_xxx`。
  坏结局剧情要完整、有分量（30～80 行）：交代错误选择的后果、角色的命运、律的独白，最后一句点题。
* 好结局：在终章末尾按条件分流（`@if has:… / bond:… / flag`），各自演出后 `@ending he_xxx`。
* 小游戏没有失败；坏结局只来自玩家在关键时刻的**主动选择**，或缺少某件**可选证据**。选择要有诱惑力（看起来也说得通），不能一眼就是错的。
