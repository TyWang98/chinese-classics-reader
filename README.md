# Classical Text Reader / 古文逐句阅读与笔记

一个仅在本地运行的古文逐句阅读与笔记 Web 应用。它用原生 HTML、CSS 和 JavaScript 呈现作品、章节和逐句卡片；每一句的笔记和状态都会真实写入本地 JSON 文件。

## 适合什么

- 用自己的 AI 辅助逐句阅读古文。
- 在不离开本地电脑的情况下持续保存阅读笔记。
- 新增作品或章节，同时保持已保存笔记与原句的绑定。
- 以明确的底本、编辑层与异文说明，而不是把某个现代版本伪装成唯一原文。

## 当前功能

- 作品索引 → 章节索引 → 连续逐句阅读。
- 每句显示原文、直译、简明 LLM 理解、可展开的进一步解释、不确定性、笔记和状态。
- 每句单独保存；保存“未开始”会记为“已完成”。
- 阅读页提供悬浮章节导航，可直接切换到任意已收录章节。
- 全站可切换护眼暗色模式；浏览器会记住本机上的选择。
- 笔记与正文分离；同一部作品的并发保存会按顺序写入，不会因两个标签页同时保存而丢掉另一句的更新。
- 作品页公开显示文本依据状态；当前《道德经》样例明确标为“待校勘”。

## 安装与启动

先安装 [Node.js LTS](https://nodejs.org/)，它必须包含 `node` 和 `npm`，并在终端执行：

```bash
cd classical-text-reader
npm install
npm start
```

打开 [http://localhost:3000](http://localhost:3000)。开发时可使用 Node.js 自带的监听重启模式（不需要 nodemon）：

```bash
npm run dev
```

在 Windows 上也可双击 [启动古文阅读.cmd](启动古文阅读.cmd)。它会复用已经运行的阅读器，并依次查找系统 Node.js 或 Codex Desktop 自带的本地 Node 运行时。

页面必须由本地服务器打开，不能直接双击 HTML 文件；后者无法写入 JSON。

## 使用其他 AI 继续阅读

对 Codex：项目根目录的 [AGENTS.md](AGENTS.md) 要求它先读取 [项目维护 Skill](skills/classical-text-reader/SKILL.md)。因此，你可以直接说“新增《庄子》某篇”或“继续《道德经》第四章”，它应更新本地数据、运行测试并返回章节链接。

对其他 AI：在开始前把下面这句话和 [项目维护 Skill](skills/classical-text-reader/SKILL.md) 提供给它：

> 请先完整阅读 `skills/classical-text-reader/SKILL.md` 与 `docs/EDITORIAL_POLICY.md`，再修改本项目；不得破坏 `data/notes/` 中笔记与原句的绑定。

## 数据位置与备份

```text
data/
├── library.json              # 作品索引
├── works/<work-id>.json      # 原文、翻译、解释、文本依据
└── notes/<work-id>.json      # 用户笔记、状态、保存时间、原句快照
```

笔记按稳定句子 ID 保存，并记录当时的精确原句。服务器发现笔记原句与正文原句不一致时会拒绝读取/保存，避免把笔记悄悄接到错误句子上。

备份整个 `data` 文件夹即可保留阅读记录。运行服务器时，不要用其他编辑器同时修改同一个 JSON 文件。

本项目当前允许将已有笔记作为公开样例发布；若你自己的 fork 不希望公开笔记，请在提交前自行排除 `data/notes/*.json`。

## 新增作品或章节

1. 在 `data/library.json` 登记稳定的小写英文作品 ID。
2. 创建 `data/works/<work-id>.json`，并为作品填写 `textBasis`。
3. 章节 ID 使用 `<work-id>-NN`；句子 ID 使用 `<work-id>-NN-NN`。
4. 新章只写正文、翻译、解释和异文说明；不要创建或修改笔记记录。
5. 运行测试并打开章节链接检查。

完整内容与数据规则见 [项目维护 Skill](skills/classical-text-reader/SKILL.md)。

## 文本依据与编辑政策

“通行本”不是充分的校勘说明。每部作品都应提供 `textBasis`：所用底本、见证材料、现代编辑层（简体字、标点、章节标题等）以及尚未核验的限制。

项目不会根据来源所属国家或机构自动判定文本可信度；应比较可识别的文本见证，并公开有意义的异文、断句差异与不确定性。详见 [编辑政策](docs/EDITORIAL_POLICY.md)。

## 测试

```bash
npm test
```

测试只复制公开正文到临时目录，不读取或修改你的正式笔记文件。覆盖内容读取、笔记绑定、原子 JSON 写入、并发保存、状态验证和 API 错误路径。

## 目录

```text
classical-text-reader/
├── .editorconfig             # UTF-8、LF、两空格等基础格式约定
├── AGENTS.md
├── README.md
├── server.js
├── src/                       # API、JSON 存储、验证工具
├── public/                    # 原生页面、CSS 和浏览器脚本
├── data/                      # 本地正文与笔记
├── docs/                      # 编辑政策
├── skills/                    # 项目维护 Skill
├── tests/                     # Node 内置测试
└── 启动古文阅读.cmd            # Windows 便捷入口
```

## 代码与数据格式

仓库使用 `.editorconfig` 约定 UTF-8、LF、文件末尾换行和两空格缩进。HTML、CSS、JavaScript 与 JSON 都保留为可直接审阅的非压缩文本；运行时写回 JSON 时也使用同一格式。项目不为格式化额外引入依赖。
## 当前限制

仅支持单个本地用户与 JSON 文件；没有账号、同步、数据库、LLM API、在线部署、Markdown 编辑器或自动保存。当前《道德经》示例仍是“待校勘”文本，不能当作唯一可靠底本。

## 开源发布前仍需决定

请选择并添加许可证（例如 MIT 或 Apache-2.0）。许可证是他人合法复用项目的必要条件；本项目不会在未得到你的选择前擅自指定。
