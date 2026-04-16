/**
 * 清理脚本 - 删除构建产物
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const rootDir = path.join(__dirname, '..');

// 删除 dist 目录
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
  console.log('✅ 已删除 dist 目录');
}

// 删除 zip 文件
const zipFiles = fs.readdirSync(rootDir)
  .filter(file => file.startsWith('tabrenamer-v') && file.endsWith('.zip'));

zipFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  fs.unlinkSync(filePath);
  console.log(`✅ 已删除: ${file}`);
});

console.log('\n✨ 清理完成！');
