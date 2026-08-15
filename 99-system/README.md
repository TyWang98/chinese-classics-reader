# Active reader system

99-system/ 只放当前有效、会影响阅读器行为的代码、测试和 AI 维护规则。本文件是运行时代码的组件索引。

## Authority model

| 主题 | 权威入口 |
| --- | --- |
| AI 内容与维护行为 | [项目维护 Skill](skills/classical-text-reader/SKILL.md) |
| 文本证据与编辑边界 | [Editorial policy](../98-docs/EDITORIAL_POLICY.md) |
| 数据与笔记身份 | [Data and notes model](../98-docs/DATA_MODEL.md) |
| 安装、恢复与验证 | [Operations](../98-docs/OPERATIONS.md) |
| 笔记读取、校验与原子写入 | [jsonStore.js](src/services/jsonStore.js) |
| API 允许的用户输入 | [validation.js](src/utils/validation.js) |

根目录 [AGENTS.md](../AGENTS.md) 是 Codex 自动发现入口，只负责将维护任务导向这些权威文件。

## Component map

~~~text
99-system/
├── server.js                  # Express 入口与静态页面服务
├── public/                    # 原生 HTML、CSS 和浏览器 JavaScript
├── src/
│   ├── routes/api.js          # API 路由和响应摘要
│   ├── services/jsonStore.js  # 内容/笔记合并与安全写入
│   └── utils/validation.js    # PATCH 输入验证
├── tests/                     # Node 内置测试与结构约束
└── skills/
    └── classical-text-reader/
        └── SKILL.md           # Codex 维护规则
~~~

## Runtime flow

~~~text
package.json / 启动古文阅读.cmd
            ↓
99-system/server.js
      ↙             ↘
99-system/public/   99-system/src/
                         ↓
             00-library/ + 01-notes/
~~~

修改代码时按 [Skill](skills/classical-text-reader/SKILL.md) 判断数据风险，按 [Operations 的验证章节](../98-docs/OPERATIONS.md#验证) 完成检查。
