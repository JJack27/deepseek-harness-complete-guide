# DeepSeek Harness Complete Guide

一本可交互的中文电子书：**《DeepSeek Harness 专家之路》**，25 章，带你从「agent harness 是什么」一路读到能上手改 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 仓库的任何需求。

## 在线阅读

打开 GitHub Pages 站点：**https://jjack27.github.io/deepseek-harness-complete-guide/zh/**

## 离线阅读

无需服务器、无需联网、无外部请求：

```sh
git clone https://github.com/JJack27/deepseek-harness-complete-guide.git
open zh/index.html   # 双击文件即可
```

## 书里有什么

- **25 章**：Cordis 插件模型 → 会话日志（事件溯源）→ turn/step 循环 → 工具执行管道 → capability seams → 子代理 → Web UI / RPC / ACP / Python SDK → 测试与贡献流程。
- **每章末尾有小测**（单选/多选/填空/简答），≥ 80% 即「可以继续前进」；进度保存在浏览器 `localStorage`，目录页有总进度面板。
- **17 个内联交互演示**（waterfall 短路、事件日志推导、补丁层叠加、seam 换 provider……），全部本地运行。
- 所有图表为内联 SVG；每个章节文件自包含。

## 目录结构

```
zh/               中文版（当前唯一语言）
  index.html      目录面板（从这里开始）
  01-…html … 25-…html   各章
  assets/         共享样式与脚本（book.js 含演示注册表）
```

## 来源

内容由 [personal-book-forger](https://github.com/) 技能基于 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 仓库真实源码（2026-08 快照）锻造。本书是社区学习材料，不是 DeepSeek 官方文档；仓库演进后细节可能与书中有出入。
