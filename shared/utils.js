/**
 * TabRenamer - 工具函数
 */

import { UNSUPPORTED_PROTOCOLS, MAX_PATTERN_LENGTH, MAX_RULES } from './constants.js';

/**
 * 判断是否为支持的页面
 * @param {string} url - 页面URL
 * @returns {boolean}
 */
export function isSupportedPage(url) {
  if (!url) return false;
  return !UNSUPPORTED_PROTOCOLS.some(protocol => url.startsWith(protocol));
}

/**
 * 生成 UUID v4
 * @returns {string}
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 验证正则表达式是否有效
 * @param {string} pattern - 正则表达式字符串
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateRegex(pattern) {
  if (!pattern) {
    return { valid: false, error: '正则表达式不能为空' };
  }
  
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: `正则表达式长度不能超过 ${MAX_PATTERN_LENGTH} 字符` };
  }
  
  try {
    new RegExp(pattern);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: `正则表达式语法错误: ${e.message}` };
  }
}

/**
 * 获取主域名（去除子域名）
 * @param {string} hostname - 主机名
 * @returns {string}
 */
export function getMainDomain(hostname) {
  if (!hostname) return '';
  
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/**
 * 安全获取 URL 对象
 * @param {string} urlString - URL 字符串
 * @returns {URL|null}
 */
export function safeParseURL(urlString) {
  try {
    return new URL(urlString);
  } catch (e) {
    return null;
  }
}

/**
 * 转义 HTML 特殊字符
 * @param {string} text - 原始文本
 * @returns {string}
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 格式化时间戳为可读字符串
 * @param {number} timestamp - 时间戳
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 截断字符串
 * @param {string} str - 原始字符串
 * @param {number} maxLength - 最大长度
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * 检查规则数量是否已达上限
 * @param {number} currentCount - 当前规则数量
 * @returns {boolean}
 */
export function isRulesLimitReached(currentCount) {
  return currentCount >= MAX_RULES;
}

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 比较两个对象是否相等
 * @param {Object} a - 对象A
 * @param {Object} b - 对象B
 * @returns {boolean}
 */
export function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
