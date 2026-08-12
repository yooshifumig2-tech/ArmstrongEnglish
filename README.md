# Armstrong English Survival

一个面向小学生的 Minecraft 工作台英语学习站。首页保留第一人称玩家视角：准星对准工作台，点击后 Steve 手臂挥动并打开 3×3 合成界面。学习内容不是虚构关卡，而是从 Minecraft Java Edition 26.2 官方数据包解析出的真实工作台配方。

## 当前实现

- Java Edition 26.2 的 1,120 条工作台配方与 949 种可合成产物
- 原版工作台 GUI、3×3 输入槽、产物槽、27 格背包和 9 格快捷栏
- 从背包自由拖动材料到九宫格；按原版规则识别图形平移、水平镜像与无序排列，匹配后才出现产物
- 搜索、分类和浏览全部配方；特殊动态配方明确标记
- 官方客户端物品纹理生成的像素图集，以及真实工作台、草地、树木和 Steve 手臂素材
- 每件产物的官方英文名、简体中文名、材料词汇和生存英语句型；语音只在点击明确的 `🔊` 按钮后播放
- XP、已完成配方与累计合成次数保存在当前浏览器
- 桌面端与移动端响应式布局

数据和素材的来源、版本哈希及使用说明见 [SOURCES.md](./SOURCES.md)。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

Netlify 的构建与发布目录已在 `netlify.toml` 中配置。

## 刷新官方配方数据

生成后的 JSON 与 PNG 已提交，网站运行时不需要 Minecraft jar。若要重新生成，需要 Python 3、Pillow，以及对应版本的官方客户端、服务端数据 jar 和 `zh_cn.json`：

```bash
python scripts/generate_minecraft_catalog.py \
  --server /path/to/minecraft-26.2-inner.jar \
  --client /path/to/minecraft-26.2-client.jar \
  --zh /path/to/minecraft-26.2-zh_cn.json \
  --project .
```

## 免责声明

This is not an official Minecraft product. It is not approved by or associated with Mojang or Microsoft.
