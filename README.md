# PhraseTurn

选中英文词句 → 右键 → 在选区附近浮窗立即显示中文译文，看完自动消失的 Chrome 扩展。专为阅读英文文档时不打断节奏而设计。

## 功能

- 选中任意英文文本，右键「翻译选中文本」即可翻译
- 译文浮窗出现在选区右下方，5 秒后自动消失
- 浮窗用 Shadow DOM 隔离宿主页面 CSS，不会被站点样式污染
- 滚动、缩放、点击外部、按 Esc 时浮窗立即关闭
- popup 弹窗显示翻译历史（最近 200 条，最新在上），支持单条删除与一键清空
- 翻译失败时浮窗变红，显示错误消息

## 技术栈

- TypeScript + Vite + [@crxjs/vite-plugin](https://github.com/crxjs/crxjs) 2.0.0-beta.25
- Chrome Manifest V3
- [MyMemory](https://mymemory.translated.net/) 免费 API（无需 Key，国内可访问）
- chrome.storage.local 持久化历史
- Shadow DOM CSS 隔离

## 目录结构

```
PhraseTurn/
├─ manifest.config.ts          # crxjs 用 TS 描述的 manifest
├─ vite.config.ts
├─ tsconfig.json
├─ .npmrc                      # 阿里镜像
└─ src/
   ├─ types.ts                 # TranslationResult / HistoryEntry / TranslateMessage
   ├─ lib/
   │  ├─ translator.ts         # 调用 MyMemory、截断超长文本
   │  └─ storage.ts           # chrome.storage.local 封装，200 条 FIFO
   ├─ background/
   │  └─ service-worker.ts     # 注册右键菜单、调翻译、写历史、发消息
   ├─ content/
   │  ├─ content-script.ts     # 监听消息、Shadow DOM 浮窗、自动消失
   │  └─ content.css           # content_scripts 配置占位
   └─ popup/
      ├─ popup.html
      ├─ popup.ts              # 渲染历史列表 + 清空按钮
      └─ popup.css
```

## 安装与开发

### 安装依赖

```bash
npm install
```

`.npmrc` 已配置阿里镜像（`registry.npmmirror.com`）。

### 开发模式（带 HMR）

```bash
npm run dev
```

crxjs 会监视变更并自动刷新注入的扩展。修改 popup / service worker 也会触发重载。

### 生产构建

```bash
npm run build
```

`dist/` 即可加载到 Chrome。

## 在 Chrome 中加载

1. 打开 `chrome://extensions`
2. 右上角开启「开发者模式」
3. 点「加载已解压的扩展程序」→ 选 `dist/` 目录
4. 扩展卡片点「Service worker」链接可看 service worker DevTools 控制台
5. 改代码后重新 `npm run build`，再在扩展卡片点刷新图标

## 使用流程

1. 打开任意英文页面（如 MDN、Wikipedia、英文文档）
2. 选中一个词或一段文本
3. 右键 → 点「翻译选中文本」
4. 选区右下方出现浮窗：上方小灰字是原文，下方是译文
5. 5 秒后自动消失；滚动、点外部、按 Esc 立即关闭
6. 点工具栏扩展图标查看历史记录，每条历史右侧有「删除」按钮可单独移除，底部「清空」按钮可一键清空

## 关键设计

| 决策点 | 选择 | 理由 |
|---|---|---|
| 翻译引擎 | MyMemory 免费 API | 无需 Key、国内可访问、JSON 响应。5000 字符/天匿名限额对个人阅读够用 |
| 展示方式 | 光标附近浮窗 + Shadow DOM | Shadow DOM 隔离宿主页面 CSS，避免被站点样式污染 |
| 历史存储 | chrome.storage.local | 200 条约 40KB，远低于 10MB 上限 |
| 浮窗定位 | `position: fixed` + 越界翻转 | 直接用选区 rect 坐标，省 scroll 偏移计算；右边/下边越界时翻到选区左/上方 |
| 文本截断 | 单次最多 500 字符 | 避免触发 MyMemory 5000 字符/天限额 |
| 历史上限 | 200 条 FIFO | 满足回看需求，`slice(-200)` 裁掉最旧 |

## 已知限制

- 不支持 iframe 内选区翻译（content script 只注入顶层 frame）
- MyMemory 5000 字符/天匿名限额，超限会报错（不实现 fallback，保持极简）
- 滚动 / resize 时浮窗关闭而非跟随选区
- 翻译失败不自动重试，用户重新右键即可
- service worker 不实现保活/重试队列（`onClicked` await 期间 Chrome 保持活跃）
- `chrome://` 等内置页面无法注入 content script，错误仅显示在 service worker 日志

## 备选方案

如果实测 MyMemory 国内访问不通：

- **选项 A**：换成有道翻译 API（需注册申请 appid + key，存在 options 页输入）
- **选项 B**：本地起 Ollama + qwen 模型（隐私好但要装 Ollama）

默认按 MyMemory 走，实测不行再调整。
