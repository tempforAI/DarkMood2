# 高清美术规范（HD 程序化矢量美术）

游戏不使用任何外部图片。高清美术由 Canvas 2D **矢量绘制**在运行时按目标分辨率生成：
同一份绘制代码在 540p / 720p / 1080p / 1440p(2K) / 2160p(4K) 下都清晰，并受三项画质参数控制。
第二部没有像素版美术；老设备与手机使用「低」画质预设（540p、低建模、纯色材质、无动态光影）——因此 q=0 的画面必须依然好看。

## 1. 坐标系与输出

| 资源 | 设计尺寸 | 说明 |
|---|---|---|
| 背景 | 1920×1080 | 地平线约 y=680；`locations.js` 的锚点（480×270）**乘以 4** 即为设计坐标 |
| 立绘 | 640×896 | 半身像，透明背景；画面底边 = 屏幕底边；头顶约 y=70～130，下巴约 y=420 |
| 小人 | 128×256 | 全身 Q 版（约 3 头身），透明背景，脚底在 y≈250，水平居中 |
| 图标 | 128×128 | 证据图标，透明背景，主体占 80% |

输出倍率 `q.s = 输出宽 / 设计宽`。绘制函数拿到的 `g` **已经设置好 transform**，直接用设计坐标绘制即可。

## 2. 画质参数 q

```js
q = { s: 1, model: 2, tex: 2, light: 2 }
```

* `model` 建模精度 0/1/2：几何细节——物件数量、装饰线脚、书本/瓦片/发丝条数、褶皱数量。
* `tex` 材质质量 0/1/2：0 用纯色+渐变（`K.matFill` 自动回退）；1/2 用程序化纹理（木纹、石材、灰泥、织物、金属、纸、榻榻米、雪……），2 细节最多。
* `light` 光影质量 0/1/2：0 只有基本明暗；1 加 AO、接触阴影、光池；2 再加投影、体积光柱、浮尘、高光边、反射。
* 三个参数**必须真正生效**：`q=0` 的画面要快（1080p 下单张背景 < 60ms），`q=2` 要精致（1080p 下单张背景 < 500ms）。

用 `K.byModel(q, 低, 中, 高)`、`K.byLight(q, …)` 挑选数量；用 `if (q.light >= 2)` 包住昂贵效果。

## 3. 注册接口

```js
DM.HDBG.def('study', {
  draw: function (g, q, variant) { ... },   // variant: '' 或 'burnt'/'past'/...
  lights: [ { x: 640, y: 560, r: 260, color: '#ffb060', i: 0.7, flicker: 0.35, kind: 'lamp' } ],
             // 或 function (variant) { return [...]; }
  key: { x: -0.6, color: '#ffcf96', amb: '#2c2a40', rim: 0.6 },
  outdoor: false
});
DM.HDIcon.def('knife', function (g, q) { ... });
DM.HDChar.gen = { portrait: function (g, id, expr, q) {...}, sprite: function (g, id, q) {...} };
DM.HDChar.def('ritsu', { /* 角色配置，由生成器定义格式 */ });
```

* `lights`：场景中的光源（设计坐标）。引擎用它们做**动态光影**：烛火/火焰闪烁、夜晚滤镜下光源依旧发亮、泛光。
  `kind`：`candle` `fire` `lamp` `window` `moon` `screen` `glow`；`flicker` 0～1 为闪烁幅度；`i` 强度 0～1。
  背景本身应**烘焙**静态光照（光池、AO、投影）；引擎只叠加动态部分，所以不要在 lights 里重复画很强的光。
* `key`：主光，用于给立绘做**环境光照**：`x` 光从哪边来（-1 左，0 正面，1 右），`color` 主光颜色，`amb` 环境色（暗部色调），`rim` 轮廓光强度 0～1。
* `outdoor: true` 时引擎才会显示雨、雪、雾。

## 4. 画风

* 日式本格推理 × 现代高品质视觉小说背景：**写实偏绘画感**，细节丰富，光影有层次。
* 第二部：**2003 年 2 月，东北深山的雪葬村**。厚雪、冰柱、阴沉的雪云、偶尔透出的冷白天光；木造民家与茅草屋顶、
  黑色雪围（雪囲い）、雪吊（树上的绳伞）、红色的消防栓与防灾广播喇叭杆、地藏的红围兜、神社的朱红鸟居被雪压着、旅馆纸灯笼的暖光、围炉里的炭火。
  主色调：雪白与灰蓝、杉木的深棕与炭黑、朱红点缀、灯火的暖橙。空气感要冷：远景偏蓝、雾气、蒸汽（温泉、水车小屋）。
  雪的材质要讲究：积雪的厚度与圆润的边缘、屋檐积雪的悬垂、阴影偏蓝紫、反光处有细微的闪光颗粒、脚印/车辙的凹陷。
* 光照讲究：主光方向一致；暗部偏冷、亮部偏暖；物件落地处有接触阴影；墙角有 AO；窗户/灯具周围有光晕与光池；玻璃、金属有高光。
* 材质可辨：木头有木纹与漆面高光，石墙有砌块与砂浆，布料有褶皱与织纹，金属有拉丝与反光。
* 透视：室内为单点透视（`K.room` 可用），消失点大致在画面中央偏上；人物小人站在 y≈880～960 的地板上。
* 背景画「常态光照」（白天或室内灯光）；夜晚、雨、回忆棕褐色由引擎滤镜与粒子叠加。室外天空为阴天。
* 不要在背景上写说明文字（标牌、书脊等物件上的字可以）。
* 立绘：现代日系动漫赛璐璐+柔和渐变上色。彩色线稿（深色但非纯黑），大眼睛有虹膜渐变与多个高光，头发分层（底色、阴影、高光带、发丝），
  服装有褶皱阴影；皮肤有腮红与柔和阴影；轮廓清晰、比例协调、一眼能区分每个角色（发型轮廓 + 主色）。

## 5. 工具包 `js/hd/kit.js`（`DM.HK`，下称 K）

* 颜色：`K.mix(a,b,t)` `K.shade(c,±amt)` `K.rgba(c,a)` `K.temp(c,±t)`
* 路径：`K.rr` 圆角矩形、`K.poly(g,[x,y,...])`、`K.ellipse`、`K.path(g,'M.. C.. Z', ox, oy, sx, sy)`（迷你 SVG 路径）
* 渐变：`K.lin` `K.rad` `K.vgrad` `K.hgrad`
* 光影：`K.glow`（加色光晕）`K.pool`（光池）`K.contact`（接触阴影）`K.ao`（AO）`K.shaft`（光柱）`K.motes`（浮尘）`K.vignette` `K.flame`（烛火）
  `K.shadow(g,q,blur,color,ox,oy)` / `K.noShadow(g)`——**shadowBlur 一律用它们设置**（自动乘以 s）
* 材质：先建立路径，再 `K.fillTex(g,q,kind,opts,units)` 或 `K.matFill(g,q,回退色,kind,opts,units)`；
  kind：`noise wood stone brick plaster fabric metal paper snow tatami thatch rock sand ice bark wallpaper shoji carpet`
  （参数见 kit.js 中 GEN.* 的注释；`units` = 一块平铺图在设计坐标中的边长）
* 组合：`K.panel`（带纹理/光照/倒角/AO 的面板）、`K.room`（单点透视房间，返回 `floorAt(t)`、`project(x,y,t)`）、`K.text`、`K.line`、`K.blob`
* 随机：`K.rng(seed)` 带 `.int .range .pick .chance .jit`；噪声 `K.noise` `K.fbm`

## 6. 兼容性（必须遵守——要支持老设备与手机）

* 只用 ES5 语法（`var`、`function`；不用箭头函数、class、模板字符串、解构、`?.`、`??`）。
* 只用基础 Canvas 2D：不要用 `ctx.filter`、`Path2D`、`roundRect`、`DOMMatrix`、`OffscreenCanvas`、`conic gradient`。
  可以用：路径、渐变、pattern、`globalCompositeOperation`（`lighter multiply screen overlay source-atop destination-out`）、`shadowBlur`（经 K.shadow）。
* 不读回整张画布像素（纹理平铺图内部的小尺寸 ImageData 例外，已封装在 kit）。
* 确定性：只用 `K.rng(固定种子)`，不用 `Math.random`。
* 不依赖 DOM（除了 `document.createElement('canvas')`），不启动定时器。
* 内存：不要在绘制中创建大于输出尺寸的临时画布；临时画布用完即弃。

## 7. 预览与自测

`tools/hd_preview.html`（file:// 直接打开）：

```
tools/hd_preview.html?kind=bg&ids=study,hall&s=0.5&q=2&anchors=1&lights=1
tools/hd_preview.html?kind=bg&ids=study&s=0.5&q=0            低画质
tools/hd_preview.html?kind=bg&ids=study&filter=night&s=0.5    夜晚 + 光源
tools/hd_preview.html?kind=pt&ids=ritsu,shio&exprs=all&s=0.5
tools/hd_preview.html?kind=sp   /  kind=ic
```

用 Playwright 截图（`require('playwright')`，`chromium.launch()`），**亲自看图**检查质量并迭代：
构图、锚点物件位置、光影是否可信、材质是否可辨、q=0/1/2 的差异与耗时、s=0.5 与 s=2 是否都清晰。
