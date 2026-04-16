# 更新日志 (Changelog)

所有重要的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-03-12

### ✨ 新增 (Added)

- 首次发布 MVP 版本
- 手动修改当前标签页标题功能
- 规则管理功能（创建、编辑、删除、启用/禁用）
- 规则测试预览功能
- 自动应用规则修改标题
- 模板变量支持（$title, $host, $domain, $url, $protocol）
- 错误提示与反馈
- 全局启用/禁用开关

### 🔧 技术实现

- 使用 Manifest V3 架构
- Service Worker 作为后台脚本
- **chrome.scripting.executeScript 注入标题修改代码**（重要修复）
- chrome.storage.local 本地数据存储
- ES Modules 模块化代码组织
- 正则表达式匹配支持
- 多种匹配方式（包含、等于、开头匹配、结尾匹配、正则）

### 📝 文档

- 完整的 README 文档
- 快速开始指南 (QUICKSTART.md)
- MVP 需求文档
- 项目总结 (PROJECT_SUMMARY.md)
- 图标生成说明 (ICONS_README.md)
- MIT 许可证

### 🐛 已知问题

- 特殊页面（chrome://、chrome-extension://等）无法修改标题
- SPA 应用的 URL 变化检测有限
- 某些严格 CSP 的网站可能无法注入脚本

### 🔒 安全性

- 所有数据存储在本地
- 不收集用户隐私数据
- 不上传数据到服务器
- 明确的权限使用说明

---

## 关键修复历史

### 2026-03-12 - 修复标题修改API问题 🔴

**问题**: 
原始代码使用 `chrome.tabs.update({title: ...})` 尝试修改标签页标题，但该 API **不支持 title 属性**，导致运行时错误。

**错误信息**:
```
TypeError: Error in invocation of tabs.update(...): 
Error at parameter 'updateProperties': Unexpected property: 'title'.
```

**解决方案**:
改用 `chrome.scripting.executeScript` 注入代码修改页面的 `document.title`

**变更文件**:
- ✅ `manifest.json` - 添加 `scripting` 权限和 `content_scripts` 配置
- ✅ `background/service-worker.js` - 新增 `updateTabTitle()` 函数
- ✅ `content/content-script.js` - 新增 Content Script 文件

**影响**:
- 需要重新加载扩展才能生效
- 某些 CSP 严格的网站可能无法修改标题
- 其他功能基本不受影响

---

## 版本规划

### [1.1.0] - 计划中

- 规则导入/导出完善
- 规则分组功能
- 右键菜单支持
- 快捷键支持
- 规则冲突检测
- $time 和 $date 模板变量

### [1.2.0] - 计划中

- 云端同步
- 规则使用统计增强
- 社区规则库
- Firefox 浏览器支持

---

## 贡献指南

如果您发现 bug 或有功能建议，请：

1. 在 GitHub Issues 中搜索是否已有相关问题
2. 如果没有，创建新的 Issue，详细描述问题或建议
3. 如果您想贡献代码，请 Fork 项目并创建 Pull Request

感谢所有贡献者！
