/**
 * 图标生成脚本
 * 
 * 使用方法：
 * 1. 安装依赖: npm install sharp
 * 2. 将源图标放在 icons/ 目录（支持 icon.png 或 icon.svg）
 * 3. 运行脚本: npm run generate-icons
 * 
 * 输出：icon16.png, icon48.png, icon128.png
 */

const fs = require('fs');
const path = require('path');

// 配置
const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '../icons');
const outputSizes = {
  16: 'icon16.png',
  48: 'icon48.png',
  128: 'icon128.png'
};

// 检查是否安装了 sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  未安装 sharp 包');
  console.log('\n方案 1: 安装 sharp 后运行');
  console.log('  npm install sharp');
  console.log('  npm run generate-icons');
  console.log('\n方案 2: 使用在线工具');
  console.log('  1. 访问 https://www.iloveimg.com/resize-image');
  console.log('  2. 上传源图标文件');
  console.log('  3. 分别导出为 16x16、48x48、128x128 像素的 PNG');
  console.log('  4. 保存到 icons/ 目录，命名为 icon16.png, icon48.png, icon128.png');
  console.log('\n方案 3: 使用图形编辑软件');
  console.log('  Photoshop、GIMP 或 Figma 导出不同尺寸的 PNG');
  process.exit(0);
}

// 查找源图标文件
function findSourceIcon() {
  const pngPath = path.join(iconsDir, 'icon.png');
  const svgPath = path.join(iconsDir, 'icon.svg');
  
  if (fs.existsSync(pngPath)) {
    return { path: pngPath, type: 'png' };
  }
  if (fs.existsSync(svgPath)) {
    return { path: svgPath, type: 'svg' };
  }
  return null;
}

// 生成图标
async function generateIcons() {
  console.log('🎨 开始生成图标...\n');

  // 查找源图标
  const source = findSourceIcon();
  if (!source) {
    console.error('❌ 错误: 找不到源图标文件');
    console.log('\n请在 icons/ 目录下放置以下文件之一:');
    console.log('  - icon.png (推荐，建议尺寸 512x512 或更大)');
    console.log('  - icon.svg');
    process.exit(1);
  }

  console.log(`📁 使用源文件: ${path.basename(source.path)}\n`);

  // 创建输出目录（如果不存在）
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 生成各尺寸图标
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, outputSizes[size]);
    
    try {
      let image = sharp(source.path);
      
      // 如果是 PNG 源文件，确保输出为 PNG 格式
      if (source.type === 'png') {
        image = image.resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'inside'
        });
      } else {
        // SVG 源文件
        image = image.resize(size, size);
      }
      
      await image
        .png()
        .toFile(outputPath);
      
      console.log(`✅ 已生成 icon${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`❌ 生成 icon${size}.png 失败:`, error.message);
    }
  }

  console.log('\n✨ 图标生成完成！');
}

// 运行
generateIcons();
