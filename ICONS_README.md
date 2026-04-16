# TabRenamer 图标生成说明

## 需要的图标尺寸

Chrome 扩展需要以下尺寸的图标：

- **icon16.png** - 16x16 像素（工具栏图标）
- **icon48.png** - 48x48 像素（扩展管理页面）
- **icon128.png** - 128x128 像素（Chrome Web Store）

## 生成方法

### 方法 1：使用 ImageMagick（推荐）

如果已安装 ImageMagick，可以使用以下命令：

```bash
# 在项目根目录执行
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png
```

### 方法 2：使用在线工具

1. 访问 https://cloudconvert.com/svg-to-png 或类似网站
2. 上传 `icons/icon.svg`
3. 分别生成 16x16、48x48、128x128 三种尺寸的 PNG
4. 下载并保存到 `icons/` 目录

### 方法 3：使用图形编辑软件

1. 在 Adobe Illustrator、Inkscape 或 Figma 中打开 `icons/icon.svg`
2. 导出为 PNG，分别设置尺寸为 16x16、48x48、128x128
3. 保存到 `icons/` 目录

### 方法 4：使用 Node.js 脚本

创建一个 Node.js 脚本：

```javascript
// scripts/generate-icons.js
const sharp = require('sharp');
const path = require('path');

const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, '../icons/icon.svg');

sizes.forEach(size => {
  sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(path.join(__dirname, `../icons/icon${size}.png`))
    .then(() => console.log(`Generated icon${size}.png`))
    .catch(err => console.error(`Error generating icon${size}.png:`, err));
});
```

运行：
```bash
npm install sharp
node scripts/generate-icons.js
```

## 图标设计说明

当前图标设计包含：
- 蓝色圆形背景（#4A90E2）
- 白色标签页图标
- 标题栏和内容线条
- 黄色编辑笔图标

## 验证图标

生成图标后，检查：
1. 所有尺寸的图标都清晰可辨
2. 16x16 尺寸的图标在小尺寸下仍能看清主要元素
3. 颜色正确，无锯齿

## 临时占位图标

如果暂时无法生成 PNG 图标，可以先使用在线生成的占位图标：

1. 访问 https://placeholder.com 或 https://via.placeholder.com
2. 生成对应尺寸的占位图
3. 保存为 icon16.png、icon48.png、icon128.png

**注意**：正式发布前必须替换为正确的图标！
