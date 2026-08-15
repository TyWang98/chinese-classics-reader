# Classical Text Reader / 古文逐句阅读与笔记

一个只在本地运行的古文逐句阅读与笔记 Web 应用。原文、解释和个人笔记分层保存；每句话独立写入本地 JSON，不依赖数据库或云服务。

## 开始使用

请按 [安装与启动](98-docs/OPERATIONS.md#安装与启动) 完成首次设置。服务启动后打开 [http://localhost:3000](http://localhost:3000)；Windows 用户也可使用根目录的 [启动古文阅读.cmd](启动古文阅读.cmd)。

## 从哪里开始

| 我想做什么 | 入口 |
| --- | --- |
| 立即阅读和记笔记 | [打开本地阅读器](http://localhost:3000) |
| 浏览作品原文、翻译和解释 | [00-library/](00-library/) |
| 查看或备份个人笔记 | [01-notes/](01-notes/) |
| 安装、启动、备份、恢复或排错 | [Operations](98-docs/OPERATIONS.md) |
| 了解正文与笔记如何隔离 | [Data and notes model](98-docs/DATA_MODEL.md) |
| 了解原文选择与校勘原则 | [Editorial policy](98-docs/EDITORIAL_POLICY.md) |
| 新增作品、章节或维护解释 | [项目维护 Skill](99-system/skills/classical-text-reader/SKILL.md) |
| 了解运行时代码和权威组件 | [Active reader system](99-system/README.md) |

## Repository map

~~~text
classical-text-reader/
├── 00-library/                 # 公开阅读内容：作品索引与逐句正文
├── 01-notes/                   # 个人状态：笔记、状态、原句快照与保存时间
├── 98-docs/                    # 运维、数据边界与编辑政策
├── 99-system/                  # 应用代码、测试和项目 Skill
├── AGENTS.md                   # Codex 自动发现入口
├── package.json                # npm 命令入口
├── README.md                   # 人类入口与仓库地图
└── 启动古文阅读.cmd             # Windows 双击入口
~~~

顶层编号表达探索顺序：阅读内容从 00- 向上，文档与系统从 99- 向下。根目录只保留用户或工具需要直接发现的入口文件。

## 当前能力

- 作品索引 → 章节索引 → 连续逐句阅读。
- 每句显示原文、直译、简明 LLM 理解、可展开的进一步解释与不确定性。
- 每句独立保存笔记和状态；“未开始”保存后自动记为“已完成”。
- 阅读页提供悬浮章节导航，全站支持可记忆的护眼暗色模式。
- 正文与个人笔记物理隔离，保存时校验句子 ID 与原句绑定。
- 作品页显示文本依据状态；当前《道德经》内容明确标为“待校勘”。

具体保存模型见 [Data and notes model](98-docs/DATA_MODEL.md)，验证方法见 [Operations](98-docs/OPERATIONS.md#验证)。

## 使用 AI 继续扩展

Codex 会通过根目录 [AGENTS.md](AGENTS.md) 进入 [项目维护 Skill](99-system/skills/classical-text-reader/SKILL.md)。你可以直接说“继续《道德经》第四章”或“新增《庄子》某篇”。

给其他 AI 时，请要求它先完整阅读项目 Skill；涉及原文时再遵循 [Editorial policy](98-docs/EDITORIAL_POLICY.md)。

## 当前范围

当前仅支持单个本地用户；没有账号、云同步、数据库、LLM API、在线部署、Markdown 编辑器或自动保存。页面必须通过本地服务器打开，不能直接双击 HTML。

项目尚未选择开源许可证；公开供他人复用前需补充明确许可证。
