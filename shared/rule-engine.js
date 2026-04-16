/**
 * TabRenamer - 规则引擎
 */

import { MATCH_TYPES, ACTION_TYPES, MATCH_TARGETS } from './constants.js';
import { getMainDomain, safeParseURL, validateRegex } from './utils.js';

/**
 * 规则引擎类
 */
export class RuleEngine {
  /**
   * @param {Array} rules - 规则数组
   */
  constructor(rules = []) {
    this.rules = rules.filter(r => r.enabled);
  }

  /**
   * 查找匹配的规则（返回第一条）
   * @param {Object} tab - 标签页对象
   * @returns {Object|null}
   */
  findMatchingRule(tab) {
    for (const rule of this.rules) {
      if (this.matchRule(rule, tab)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * 匹配单条规则
   * @param {Object} rule - 规则对象
   * @param {Object} tab - 标签页对象
   * @returns {boolean}
   */
  matchRule(rule, tab) {
    const target = rule.matchTarget === MATCH_TARGETS.URL ? tab.url : tab.title;
    if (!target) return false;

    const pattern = rule.pattern;
    const caseSensitive = rule.caseSensitive || false;

    try {
      switch (rule.matchType) {
        case MATCH_TYPES.CONTAINS:
          return caseSensitive
            ? target.includes(pattern)
            : target.toLowerCase().includes(pattern.toLowerCase());

        case MATCH_TYPES.EQUALS:
          return caseSensitive
            ? target === pattern
            : target.toLowerCase() === pattern.toLowerCase();

        case MATCH_TYPES.STARTS_WITH:
          return caseSensitive
            ? target.startsWith(pattern)
            : target.toLowerCase().startsWith(pattern.toLowerCase());

        case MATCH_TYPES.ENDS_WITH:
          return caseSensitive
            ? target.endsWith(pattern)
            : target.toLowerCase().endsWith(pattern.toLowerCase());

        case MATCH_TYPES.REGEX:
          const validation = validateRegex(pattern);
          if (!validation.valid) return false;
          const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
          return regex.test(target);

        default:
          return false;
      }
    } catch (error) {
      console.error('Rule match error:', error);
      return false;
    }
  }

  /**
   * 应用规则生成新标题
   * @param {Object} rule - 规则对象
   * @param {Object} tab - 标签页对象
   * @returns {string}
   */
  applyRule(rule, tab) {
    const originalTitle = tab.title || '';
    let actionValue = rule.actionValue || '';

    // 先应用模板变量
    actionValue = this.applyTemplate(actionValue, tab);

    switch (rule.actionType) {
      case ACTION_TYPES.REPLACE:
        return actionValue;

      case ACTION_TYPES.PREPEND:
        return actionValue + originalTitle;

      case ACTION_TYPES.APPEND:
        return originalTitle + actionValue;

      case ACTION_TYPES.REGEX_REPLACE:
        if (rule.matchType === MATCH_TYPES.REGEX) {
          try {
            const flags = rule.caseSensitive ? 'g' : 'gi';
            const regex = new RegExp(rule.pattern, flags);
            return originalTitle.replace(regex, actionValue);
          } catch (error) {
            console.error('Regex replace error:', error);
            return originalTitle;
          }
        }
        return originalTitle;

      default:
        return originalTitle;
    }
  }

  /**
   * 应用模板变量
   * @param {string} template - 模板字符串
   * @param {Object} tab - 标签页对象
   * @returns {string}
   */
  applyTemplate(template, tab) {
    if (!template) return '';
    if (!tab.url) return template.replace(/\$title/g, tab.title || '');

    const url = safeParseURL(tab.url);
    if (!url) return template.replace(/\$title/g, tab.title || '');

    return template
      .replace(/\$title/g, tab.title || '')
      .replace(/\$host/g, url.hostname || '')
      .replace(/\$domain/g, getMainDomain(url.hostname))
      .replace(/\$url/g, tab.url || '')
      .replace(/\$protocol/g, url.protocol.replace(':', ''));
  }

  /**
   * 测试规则匹配（用于规则预览）
   * @param {Object} rule - 规则对象
   * @param {Object} tab - 标签页对象
   * @returns {Object} 测试结果
   */
  testRule(rule, tab) {
    const result = {
      matched: false,
      matchContent: '',
      error: null,
      originalTitle: tab.title || '',
      newTitle: ''
    };

    // 验证正则表达式
    if (rule.matchType === MATCH_TYPES.REGEX) {
      const validation = validateRegex(rule.pattern);
      if (!validation.valid) {
        result.error = validation.error;
        return result;
      }
    }

    // 测试匹配
    const target = rule.matchTarget === MATCH_TARGETS.URL ? tab.url : tab.title;
    const caseSensitive = rule.caseSensitive || false;

    try {
      switch (rule.matchType) {
        case MATCH_TYPES.CONTAINS:
          result.matched = caseSensitive
            ? target.includes(rule.pattern)
            : target.toLowerCase().includes(rule.pattern.toLowerCase());
          if (result.matched) {
            result.matchContent = rule.pattern;
          }
          break;

        case MATCH_TYPES.EQUALS:
          result.matched = caseSensitive
            ? target === rule.pattern
            : target.toLowerCase() === rule.pattern.toLowerCase();
          if (result.matched) {
            result.matchContent = rule.pattern;
          }
          break;

        case MATCH_TYPES.STARTS_WITH:
          result.matched = caseSensitive
            ? target.startsWith(rule.pattern)
            : target.toLowerCase().startsWith(rule.pattern.toLowerCase());
          if (result.matched) {
            result.matchContent = rule.pattern;
          }
          break;

        case MATCH_TYPES.ENDS_WITH:
          result.matched = caseSensitive
            ? target.endsWith(rule.pattern)
            : target.toLowerCase().endsWith(rule.pattern.toLowerCase());
          if (result.matched) {
            result.matchContent = rule.pattern;
          }
          break;

        case MATCH_TYPES.REGEX:
          const regex = new RegExp(rule.pattern, caseSensitive ? 'g' : 'gi');
          const match = target.match(regex);
          result.matched = !!match;
          if (result.matched) {
            result.matchContent = match[0];
          }
          break;
      }

      // 如果匹配成功，生成预览
      if (result.matched) {
        result.newTitle = this.applyRule(rule, tab);
      }
    } catch (error) {
      result.error = error.message;
    }

    return result;
  }
}

/**
 * 创建新规则对象
 * @param {Object} data - 规则数据
 * @returns {Object}
 */
export function createRule(data) {
  return {
    id: data.id || crypto.randomUUID(),
    name: data.name || '新规则',
    enabled: data.enabled !== undefined ? data.enabled : true,
    createdAt: data.createdAt || Date.now(),
    updatedAt: Date.now(),
    
    matchType: data.matchType || MATCH_TYPES.CONTAINS,
    matchTarget: data.matchTarget || MATCH_TARGETS.URL,
    pattern: data.pattern || '',
    caseSensitive: data.caseSensitive || false,
    
    actionType: data.actionType || ACTION_TYPES.PREPEND,
    actionValue: data.actionValue || '',
    
    lastMatched: null
  };
}
