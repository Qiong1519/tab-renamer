/**
 * TabRenamer - 常量定义
 */

// 规则相关常量
export const MAX_RULES = 50;
export const MAX_PATTERN_LENGTH = 200;
export const MAX_TITLE_LENGTH = 100;

// 匹配类型
export const MATCH_TYPES = {
  CONTAINS: 'contains',
  EQUALS: 'equals',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  REGEX: 'regex'
};

// 匹配目标
export const MATCH_TARGETS = {
  URL: 'url',
  TITLE: 'title'
};

// 动作类型
export const ACTION_TYPES = {
  REPLACE: 'replace',
  PREPEND: 'prepend',
  APPEND: 'append',
  REGEX_REPLACE: 'regexReplace'
};

// 模板变量
export const TEMPLATE_VARIABLES = {
  TITLE: '$title',
  HOST: '$host',
  DOMAIN: '$domain',
  URL: '$url',
  PROTOCOL: '$protocol'
};

// 不支持的协议
export const UNSUPPORTED_PROTOCOLS = [
  'chrome://',
  'chrome-extension://',
  'file://',
  'about:',
  'edge://',
  'brave://',
  'chrome-search://',
  'devtools://'
];

// 存储键名
export const STORAGE_KEYS = {
  RULES: 'rules',
  SETTINGS: 'settings',
  METADATA: 'metadata'
};

// 默认设置
export const DEFAULT_SETTINGS = {
  globalEnabled: true,
  firstUseCompleted: false,
  version: '1.0.0'
};

// 消息类型（用于 Service Worker 和 UI 通信）
export const MESSAGE_TYPES = {
  GET_CURRENT_TAB: 'getCurrentTab',
  UPDATE_TAB_TITLE: 'updateTabTitle',
  GET_RULES: 'getRules',
  SAVE_RULE: 'saveRule',
  DELETE_RULE: 'deleteRule',
  TEST_RULE: 'testRule',
  GET_SETTINGS: 'getSettings',
  UPDATE_SETTINGS: 'updateSettings'
};
