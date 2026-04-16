/**
 * 构建脚本 - 打包扩展
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, '../dist');
const rootDir = path.join(__dirname, '..');

// 需要复制的文件和目录
const filesToCopy = [
  'manifest.json',
  'background',
  'popup',
  'options',
  'shared',
  'icons'
];

// 清空 dist 目录
function cleanDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

// 复制文件
function copyFiles() {
  filesToCopy.forEach(item => {
    const src = path.join(rootDir, item);
    const dest = path.join(distDir, item);
    
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
      console.log(`✅ 已复制: ${item}`);
    } else {
      console.warn(`⚠️  跳过不存在的项: ${item}`);
    }
  });
}

// 创建 zip 包
function createZip() {
  const version = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'))).version;
  const zipName = `tabrenamer-v${version}.zip`;
  const zipPath = path.join(rootDir, zipName);
  
  try {
    // 检查系统是否有 zip 命令
    execSync('zip --version', { stdio: 'pipe' });
    
    // 创建 zip
    process.chdir(distDir);
    execSync(`zip -r "${zipPath}" .`, { stdio: 'inherit' });
    console.log(`\n✨ 已创建发布包: ${zipName}`);
  } catch (error) {
    console.log('\n⚠️  未找到 zip 命令，请手动打包 dist 目录');
    console.log('Windows: 右键 dist 文件夹 → 发送到 → 压缩文件夹');
    console.log('Mac/Linux: cd dist && zip -r ../tabrenamer.zip .');
  }
}

// 主流程
console.log('🚀 开始构建...\n');

cleanDist();
copyFiles();
createZip();

console.log('\n✅ 构建完成！');
