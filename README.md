# TabRenamer - 智能标签页标题管理扩展

<p align="center">
  <img src="icons/icon.svg" width="128" height="128" alt="TabRenamer Logo">
</p>

<p align="center">
  <strong>自定义浏览器标签页标题，让标签页更易识别和管理</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#安装">安装</a> •
  <a href="#使用指南">使用指南</a> •
  <a href="#开发">开发</a> •
  <a href="#许可证">许可证</a>
</p>

---

## 功能特性

### ✨ 核心功能

- 📝 **手动修改标题** - 快速修改当前标签页的标题
- ⚙️ **规则管理** - 创建、编辑、删除和启用/禁用规则
- 🎯 **自动应用** - 页面加载时自动应用匹配的规则
- 👁️ **规则测试** - 创建规则前可预览效果
- 🎨 **模板变量** - 支持动态标题内容

### 🔧 匹配方式

- **包含** - URL或标题包含指定字符串
- **等于** - 完全匹配
- **开头匹配** - 以指定字符串开头
- **结尾匹配** - 以指定字符串结尾
- **正则表达式** - 灵活的正则匹配

### 📋 修改动作

- **添加前缀** - 在标题前添加内容
- **添加后缀** - 在标题后添加内容
- **替换** - 完全替换标题
- **正则替换** - 使用正则替换部分标题

### 🎯 模板变量

支持以下动态变量：

| 变量 | 说明 | 示例 |
|------|------|------|
| `$title` | 原始标题 | "我的项目 - GitHub" |
| `$host` | 域名 | "github.com" |
| `$domain` | 主域名 | "github.com" |
| `$url` | 完整URL | "https://github.com/user/repo" |
| `$protocol` | 协议 | "https" |

## 安装

### 从 Chrome Web Store 安装（推荐）

*即将上架*

### 开发者模式安装

1. 下载或克隆此项目到本地
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的根目录

## 使用指南

### 快速开始

1. **安装扩展后**，点击浏览器工具栏中的 TabRenamer 图标
2. **快速修改**：在弹出的窗口中输入新标题，点击"应用修改"
3. **创建规则**：点击"保存为规则"，在打开的页面中完善规则配置

### 创建规则的步骤

1. 点击扩展图标，选择"保存为规则"
2. 在规则管理页面中：
   - 输入规则名称
   - 选择匹配目标（URL或标题）
   - 选择匹配方式（包含、正则等）
   - 输入匹配模式
   - **点击"测试规则"按钮查看效果**
   - 选择修改动作
   - 输入修改内容（可使用模板变量）
   - 保存规则

### 使用示例

#### 示例 1：为 GitHub 添加前缀

```
规则名称：GitHub项目
匹配目标：URL
匹配方式：包含
匹配模式：github.com
修改动作：添加前缀
修改内容：[GitHub] 
```

效果：`[GitHub] 我的项目 - GitHub`

#### 示例 2：简化搜索结果标题

```
规则名称：Google搜索
匹配目标：URL
匹配方式：包含
匹配模式：google.com/search
修改动作：替换
修改内容：搜索：$title
```

效果：`搜索：Chrome扩展开发`

#### 示例 3：添加域名后缀

```
规则名称：工作网站
匹配目标：URL
匹配方式：正则表达式
匹配模式：.*\.(company\.com|work\.net)
修改动作：添加后缀
修改内容： - 工作
```

效果：`项目文档 - 工作`

## 开发

### 项目结构

```
tabrenamer/
├── manifest.json              # 扩展配置文件
├── background/
│   └── service-worker.js      # Service Worker
├── popup/
│   ├── popup.html            # Popup 页面
│   ├── popup.css             # Popup 样式
│   └── popup.js              # Popup 脚本
├── options/
│   ├── options.html          # Options 页面
│   ├── options.css           # Options 样式
│   └── options.js            # Options 脚本
├── shared/
│   ├── constants.js          # 常量定义
│   ├── utils.js              # 工具函数
│   ├── storage.js            # 存储模块
│   └── rule-engine.js        # 规则引擎
├── icons/                     # 图标资源
│   ├── icon.svg              # SVG 源文件
│   ├── icon16.png            # 16x16 图标
│   ├── icon48.png            # 48x48 图标
│   └── icon128.png           # 128x128 图标
└── README.md                  # 项目说明
```

### 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **Vanilla JavaScript** - 无框架依赖，轻量高效
- **ES Modules** - 模块化代码组织
- **Chrome Storage API** - 本地数据持久化

### 本地开发

1. 克隆项目
```bash
git clone https://github.com/YOUR_USERNAME/TabRenamer.git
cd TabRenamer
```

2. 生成图标（可选）
```bash
# 使用 ImageMagick 将 SVG 转换为 PNG
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png
```

3. 在 Chrome 中加载扩展
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录

### 构建发布版本

```bash
# 创建发布目录
mkdir dist

# 复制必要文件
cp -r manifest.json background popup options shared icons dist/

# 打包
cd dist
zip -r ../tabrenamer-v1.0.0.zip .
```

## 隐私政策

### 数据收集

**TabRenamer 不收集任何用户数据。**

### 数据存储

- 所有规则数据存储在用户本地浏览器中（`chrome.storage.local`）
- 数据不会上传到任何服务器
- 用户可以随时导出或删除数据

### 权限使用说明

| 权限 | 用途 |
|------|------|
| `tabs` | 获取标签页信息并修改标签页标题 |
| `storage` | 在本地保存用户的规则配置 |
| `activeTab` | 访问当前活动标签页 |
| `<all_urls>` | 在所有网站应用用户定义的标题规则 |

### 第三方服务

本扩展不使用任何第三方服务。

## 常见问题

### Q: 为什么某些页面无法修改标题？

A: Chrome 内部页面（如 `chrome://`、`chrome-extension://`）、Chrome Web Store 等特殊页面由于浏览器安全限制无法修改标题。

### Q: 刷新页面后标题会恢复吗？

A: 如果页面匹配了某条规则，刷新后会自动重新应用规则。如果没有匹配的规则，标题会恢复为原始内容。

### Q: 规则数量有限制吗？

A: MVP 版本最多支持 50 条规则。

### Q: 规则会同步到其他设备吗？

A: MVP 版本不支持云同步，规则仅存储在本地。后续版本会考虑添加云同步功能。

## 路线图

### v1.0.0 (MVP)

- ✅ 手动修改标题
- ✅ 规则管理（创建、编辑、删除）
- ✅ 自动应用规则
- ✅ 规则测试预览
- ✅ 模板变量支持

### v1.1.0 (计划中)

- 🔲 规则导入/导出
- 🔲 规则分组
- 🔲 右键菜单支持
- 🔲 快捷键支持

### v1.2.0 (计划中)

- 🔲 云端同步
- 🔲 规则统计
- 🔲 社区规则库
- 🔲 Firefox 支持

## 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 问题反馈：[GitHub Issues](https://github.com/YOUR_USERNAME/TabRenamer/issues)

---

<p align="center">
  Made with ❤️ by YOUR_NAME
</p>
