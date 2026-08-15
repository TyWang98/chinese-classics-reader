# Data and notes model

本文件是正文、个人状态和句子身份边界的唯一说明。安装与备份见 [Operations](OPERATIONS.md)，内容校勘见 [Editorial policy](EDITORIAL_POLICY.md)。

## 两个数据入口

### 00-library/

公开、可维护的阅读内容：

- library.json：作品索引。
- works/<work-id>.json：作品元数据、文本依据、章节、原文、直译、LLM 理解、展开解释与不确定性。

这一层不保存 userNote、阅读状态或用户保存时间。

### 01-notes/

个人阅读状态，每部作品一个文件：

- 键是稳定的 sentence.id；
- 每条记录保存精确 original 快照；
- 用户字段只有 userNote、status 和 updatedAt。

新增或修改正文、翻译和解释时，不得写入这一层。

## 稳定身份

- 作品 ID：稳定的小写英文 slug。
- 章节 ID：<work-id>-NN。
- 句子 ID：<work-id>-NN-NN。

一旦句子已有笔记，其 ID 与原句关系不得静默改变。正文原句变更属于显式迁移，而不是普通内容更新。

## 读取流程

服务器分别读取 00-library 与 01-notes，检查同一句的 ID 和原句快照，再只在内存中合并给页面。章节状态和最近修改时间由合并后的句子状态推导，不写回公开正文。

## 保存流程

点击“保存本句”时，前端只提交 userNote 与 status。后端验证作品、章节和句子后，只更新目标作品的笔记文件，并通过临时文件加替换的方式原子写入。同一作品的并发写入会排队，避免不同标签页同时保存时彼此覆盖。

任何涉及保存服务、笔记路径、schema 或句子身份的修改，都必须执行 [项目维护 Skill 的持久化与迁移流程](../99-system/skills/classical-text-reader/SKILL.md)。
