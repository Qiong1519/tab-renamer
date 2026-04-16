/**
 * TabRenamer - Popup 脚本
 */

import { Storage } from '../shared/storage.js';
import { RuleEngine, createRule } from '../shared/rule-engine.js';
import { isSupportedPage, escapeHtml, debounce } from '../shared/utils.js';
import { MESSAGE_TYPES, ACTION_TYPES, MATCH_TYPES, MATCH_TARGETS } from '../shared/constants.js';

// DOM 元素
let elements = {};

// 当前标签页信息
let currentTab = null;

// 初始化
document.addEventListener('DOMContentLoaded', init);

/**
 * 初始化
 */
async function init() {
  // 获取 DOM 元素
  elements = {
    globalEnabled: document.getElementById('globalEnabled'),
    statusBar: document.getElementById('statusBar'),
    mainContent: document.getElementById('mainContent'),
    unsupportedPage: document.getElementById('unsupportedPage'),
    originalTitle: document.getElementById('originalTitle'),
    currentUrl: document.getElementById('currentUrl'),
    modifyType: document.getElementById('modifyType'),
    newContent: document.getElementById('newContent'),
    previewText: document.getElementById('previewText'),
    applyBtn: document.getElementById('applyBtn'),
    saveAsRuleBtn: document.getElementById('saveAsRuleBtn'),
    activeRuleSection: document.getElementById('activeRuleSection'),
    activeRuleName: document.getElementById('activeRuleName'),
    viewRulesBtn: document.getElementById('viewRulesBtn'),
    restoreBtn: document.getElementById('restoreBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    toast: document.getElementById('toast')
  };

  // 绑定事件
  bindEvents();

  // 加载数据
  await loadCurrentTab();
  await loadSettings();
  await checkActiveRule();
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 全局开关
  elements.globalEnabled.addEventListener('change', handleGlobalEnabledChange);

  // 修改方式变化
  elements.modifyType.addEventListener('change', updatePreview);

  // 内容输入（防抖）
  elements.newContent.addEventListener('input', debounce(updatePreview, 300));

  // 应用按钮
  elements.applyBtn.addEventListener('click', handleApply);

  // 保存为规则按钮
  elements.saveAsRuleBtn.addEventListener('click', handleSaveAsRule);

  // 查看规则按钮
  elements.viewRulesBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 设置按钮
  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 恢复原标题按钮
  elements.restoreBtn.addEventListener('click', handleRestore);
}

/**
 * 加载当前标签页信息
 */
async function loadCurrentTab() {
  try {
    const response = await sendMessage({ type: MESSAGE_TYPES.GET_CURRENT_TAB });
    if (response.success) {
      currentTab = response.data;
      
      // 检查是否为支持的页面
      if (!isSupportedPage(currentTab.url)) {
        showUnsupportedPage();
        return;
      }

      // 显示标签页信息
      elements.originalTitle.textContent = currentTab.title || '(无标题)';
      elements.originalTitle.title = currentTab.title || '';
      elements.currentUrl.textContent = currentTab.url || '';
      elements.currentUrl.title = currentTab.url || '';
      
      updatePreview();
    }
  } catch (error) {
    console.error('Failed to load current tab:', error);
    showToast('获取标签页信息失败', 'error');
  }
}

/**
 * 加载设置
 */
async function loadSettings() {
  try {
    const response = await sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS });
    if (response.success) {
      const settings = response.data;
      elements.globalEnabled.checked = settings.globalEnabled;
      updateStatusBar(settings.globalEnabled);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * 检查当前生效的规则
 */
async function checkActiveRule() {
  try {
    const response = await sendMessage({ type: MESSAGE_TYPES.GET_RULES });
    if (response.success) {
      const rules = response.data;
      const engine = new RuleEngine(rules);
      const matchingRule = engine.findMatchingRule(currentTab);
      
      if (matchingRule) {
        elements.activeRuleName.textContent = matchingRule.name;
        elements.activeRuleSection.classList.remove('hidden');
      } else {
        elements.activeRuleSection.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Failed to check active rule:', error);
  }
}

/**
 * 处理全局开关变化
 */
async function handleGlobalEnabledChange(e) {
  const enabled = e.target.checked;
  const response = await sendMessage({
    type: MESSAGE_TYPES.UPDATE_SETTINGS,
    settings: { globalEnabled: enabled }
  });

  if (response.success) {
    updateStatusBar(enabled);
    showToast(enabled ? '扩展已启用' : '扩展已禁用', 'success');
  } else {
    elements.globalEnabled.checked = !enabled;
    showToast('设置失败', 'error');
  }
}

/**
 * 更新状态栏
 */
function updateStatusBar(enabled) {
  if (enabled) {
    elements.statusBar.textContent = '扩展已启用';
    elements.statusBar.classList.remove('disabled');
  } else {
    elements.statusBar.textContent = '扩展已禁用';
    elements.statusBar.classList.add('disabled');
  }
}

/**
 * 更新预览
 */
function updatePreview() {
  const modifyType = elements.modifyType.value;
  const newContent = elements.newContent.value;
  const originalTitle = currentTab?.title || '';

  let preview = '-';
  
  if (newContent) {
    switch (modifyType) {
      case ACTION_TYPES.REPLACE:
        preview = newContent;
        break;
      case ACTION_TYPES.PREPEND:
        preview = newContent + originalTitle;
        break;
      case ACTION_TYPES.APPEND:
        preview = originalTitle + newContent;
        break;
    }
  }

  elements.previewText.textContent = preview;
}

/**
 * 处理应用修改
 */
async function handleApply() {
  const modifyType = elements.modifyType.value;
  const newContent = elements.newContent.value.trim();

  if (!newContent) {
    showToast('请输入内容', 'error');
    return;
  }

  const originalTitle = currentTab?.title || '';
  let newTitle = '';

  switch (modifyType) {
    case ACTION_TYPES.REPLACE:
      newTitle = newContent;
      break;
    case ACTION_TYPES.PREPEND:
      newTitle = newContent + originalTitle;
      break;
    case ACTION_TYPES.APPEND:
      newTitle = originalTitle + newContent;
      break;
  }

  try {
    const response = await sendMessage({
      type: MESSAGE_TYPES.UPDATE_TAB_TITLE,
      tabId: currentTab.id,
      title: newTitle
    });

    if (response.success) {
      showToast('标题已修改', 'success');
      elements.originalTitle.textContent = newTitle;
      elements.originalTitle.title = newTitle;
      
      // 隐藏当前生效规则（手动修改优先）
      elements.activeRuleSection.classList.add('hidden');
    } else {
      showToast('修改失败', 'error');
    }
  } catch (error) {
    console.error('Failed to apply title:', error);
    showToast('修改失败', 'error');
  }
}

/**
 * 处理保存为规则
 */
async function handleSaveAsRule() {
  const modifyType = elements.modifyType.value;
  const newContent = elements.newContent.value.trim();

  if (!newContent) {
    showToast('请输入内容', 'error');
    return;
  }

  // 计算新标题
  const originalTitle = currentTab?.title || '';
  let newTitle = '';

  switch (modifyType) {
    case ACTION_TYPES.REPLACE:
      newTitle = newContent;
      break;
    case ACTION_TYPES.PREPEND:
      newTitle = newContent + originalTitle;
      break;
    case ACTION_TYPES.APPEND:
      newTitle = originalTitle + newContent;
      break;
  }

  // 先应用修改到当前标签页
  try {
    const response = await sendMessage({
      type: MESSAGE_TYPES.UPDATE_TAB_TITLE,
      tabId: currentTab.id,
      title: newTitle
    });

    if (response.success) {
      // 更新显示
      elements.originalTitle.textContent = newTitle;
      elements.originalTitle.title = newTitle;
      
      // 隐藏当前生效规则（手动修改优先）
      elements.activeRuleSection.classList.add('hidden');
    }
  } catch (error) {
    console.error('Failed to apply title:', error);
    showToast('应用修改失败，但仍可保存规则', 'error');
  }

  // 从当前URL提取域名作为默认匹配模式
  let defaultPattern = '';
  try {
    const url = new URL(currentTab.url);
    defaultPattern = url.hostname;
  } catch (e) {
    defaultPattern = currentTab.url;
  }

  // 创建规则数据（不包含 ID，让 options 页面创建新规则）
  const ruleData = {
    name: `规则 ${Date.now()}`,
    matchType: MATCH_TYPES.CONTAINS,
    matchTarget: MATCH_TARGETS.URL,
    pattern: defaultPattern,
    caseSensitive: false,
    actionType: modifyType,
    actionValue: newContent
  };

  // 保存到 storage 供 Options 页面使用
  await chrome.storage.local.set({ tempRule: ruleData });

  // 打开 Options 页面进行编辑
  chrome.runtime.openOptionsPage();
}

/**
 * 处理恢复原标题
 */
async function handleRestore() {
  try {
    // 获取原始标题（从规则匹配前的状态）
    // 这里简单地刷新页面来恢复
    await chrome.tabs.reload(currentTab.id);
    showToast('页面已刷新，标题已恢复', 'success');
    window.close();
  } catch (error) {
    console.error('Failed to restore title:', error);
    showToast('恢复失败', 'error');
  }
}

/**
 * 显示不支持页面
 */
function showUnsupportedPage() {
  elements.mainContent.classList.add('hidden');
  elements.unsupportedPage.classList.remove('hidden');
  elements.applyBtn.disabled = true;
  elements.saveAsRuleBtn.disabled = true;
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2000);
}

/**
 * 发送消息到 Service Worker
 */
function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}
