# Operations and recovery

本文件只回答：如何安装、启动、备份、恢复和验证项目。系统组件位置见 [../99-system/README.md](../99-system/README.md)，数据边界见 [DATA_MODEL.md](DATA_MODEL.md)。

## 安装与启动

需要 Node.js 18 或更高版本：

~~~bash
npm install
npm start
~~~

开发模式：

~~~bash
npm run dev
~~~

打开 [http://localhost:3000](http://localhost:3000)。

Windows 用户可双击根目录 [启动古文阅读.cmd](../启动古文阅读.cmd)。启动器会：

1. 复用已经响应阅读器 API 的本地服务器；
2. 依次寻找系统 PATH、常见安装目录和 Codex Desktop 自带 Node.js；
3. 检查 Express 是否已安装；
4. 启动服务器并打开浏览器。

## 数据备份

- 个人笔记全部位于 01-notes/*.json。
- 公开正文与解释位于 00-library/。
- 只保留自己的阅读记录时，备份整个 01-notes/ 即可。
- 需要完整复制当前阅读环境时，同时备份 00-library/ 与 01-notes/。

服务器运行时，不要用其他编辑器同时修改同一个 JSON 文件。

## 恢复

1. 停止本地服务器。
2. 将备份的笔记 JSON 放回 01-notes/。
3. 确认文件名与作品 ID 一致，例如 daodejing.json。
4. 运行 npm test。
5. 启动服务器并打开相应章节。

如果服务器报告 Note-to-source integrity mismatch，不要修改或删除笔记来绕过错误。先比较笔记记录中的 original 与 00-library/works/ 中同一 sentence.id 的原句，再按项目 Skill 的迁移规则处理。

## 验证

~~~bash
npm test
npm start
~~~

修改页面或 API 后，还应打开作品索引、章节索引和至少一个章节页面，确认读取与单句保存正常。

## 常见问题

- 双击 HTML 无法保存：页面必须通过 http://localhost:3000 打开。
- 找不到 Node.js：安装 Node.js LTS，或从 Codex Desktop 环境使用根目录启动器。
- 缺少 Express：在项目根目录运行 npm install。
- 端口 3000 已占用：先确认是否已有阅读器服务器；启动器会自动复用正确的实例。
