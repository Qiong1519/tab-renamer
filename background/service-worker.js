/**
 * TabRenamer - Service Worker (Background Script)
 */

import { Storage } from '../shared/storage.js';
import { RuleEngine } from '../shared/rule-engine.js';
import { isSupportedPage } from '../shared/utils.js';
import { MESSAGE_TYPES } from '../shared/constants.js';

// 初始化
console.log('TabRenamer Service Worker initialized');

/**
 * 监听标签页更新
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 仅在页面加载完成时处理
  if (changeInfo.status !== 'complete') return;
  
  // 延迟处理，等待页面可能的 JavaScript 标题更新
  setTimeout(() => applyRulesToTab(tabId), 500);
});

/**
 * 应用规则到标签页
 * @param {number} tabId - 标签页ID
 */
async function applyRulesToTab(tabId) {
  try {
    // 获取最新的标签页信息
    const tab = await chrome.tabs.get(tabId);
    
    // 检查扩展是否启用
    const settings = await Storage.getSettings();
    if (!settings.globalEnabled) return;
    
    // 检查是否为支持的页面
    if (!isSupportedPage(tab.url)) {
      console.log('Unsupported page:', tab.url);
      return;
    }
    
    // 获取规则并匹配
    const rules = await Storage.getRules();
    const engine = new RuleEngine(rules);
    const rule = engine.findMatchingRule(tab);
    
    if (rule) {
      // 应用规则
      const newTitle = engine.applyRule(rule, tab);
      
      // 检查标题是否有变化
      if (newTitle && newTitle !== tab.title) {
        // 使用 Content Script 修改标题
        await updateTabTitle(tabId, newTitle);
        console.log(`Title updated for tab ${tabId}: ${newTitle}`);
        
        // 更新规则元数据
        await Storage.updateRule(rule.id, {
          lastMatched: Date.now()
        });
        
        // 更新元数据
        const currentRules = await Storage.getRules();
        await Storage.updateMetadata({ ruleCount: currentRules.length });
      }
    }
  } catch (error) {
    console.error('Error in applyRulesToTab:', error);
  }
}

/**
 * 更新标签页标题（通过注入脚本）
 * @param {number} tabId - 标签页ID
 * @param {string} newTitle - 新标题
 */
async function updateTabTitle(tabId, newTitle) {
  try {
    // 方案1：尝试注入脚本修改 document.title
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (title) => {
        document.title = title;
        return { success: true, title: document.title };
      },
      args: [newTitle]
    });
  } catch (error) {
    // 如果注入失败（CSP限制等），记录错误
    console.error(`Failed to update title for tab ${tabId}:`, error.message);
    throw error;
  }
}

/**
 * 监听扩展安装
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装
    await Storage.saveSettings({
      globalEnabled: true,
      firstUseCompleted: false,
      version: '1.0.0',
      installDate: Date.now()
    });
    
    console.log('First install: Settings initialized');
  } else if (details.reason === 'update') {
    // 更新
    const settings = await Storage.getSettings();
    await Storage.updateSettings({
      version: '1.0.0'
    });
    
    console.log('Extension updated');
  }
});

/**
 * 监听扩展启动
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('TabRenamer started');
});

/**
 * 消息处理（与 Popup 和 Options 页面通信）
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse);
  return true; // 保持消息通道开启
});

/**
 * 处理消息
 * @param {Object} request - 请求对象
 * @param {Object} sender - 发送者信息
 * @returns {Promise<Object>}
 */
async function handleMessage(request, sender) {
  try {
    // 处理来自 content-script 的标题变化通知
    if (request.action === 'titleChanged' && sender.tab) {
      // 延迟处理，避免频繁触发
      const tabId = sender.tab.id;
      if (!titleChangeTimers) titleChangeTimers = new Map();
      
      if (titleChangeTimers.has(tabId)) {
        clearTimeout(titleChangeTimers.get(tabId));
      }
      
      titleChangeTimers.set(tabId, setTimeout(() => {
        titleChangeTimers.delete(tabId);
        applyRulesToTab(tabId);
      }, 300));
      
      return { success: true };
    }
    
    // 处理 content-script 加载通知
    if (request.action === 'contentScriptReady' && sender.tab) {
      // 页面加载完成后应用规则
      applyRulesToTab(sender.tab.id);
      return { success: true };
    }
    
    switch (request.type) {
      case MESSAGE_TYPES.GET_CURRENT_TAB:
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return { success: true, data: tab };

      case MESSAGE_TYPES.UPDATE_TAB_TITLE:
        await updateTabTitle(request.tabId, request.title);
        return { success: true };

      case MESSAGE_TYPES.GET_RULES:
        const rules = await Storage.getRules();
        return { success: true, data: rules };

      case MESSAGE_TYPES.SAVE_RULE:
        console.log('收到保存规则请求:', { ruleId: request.ruleId, rule: request.rule });
        try {
          const saved = request.ruleId
            ? await Storage.updateRule(request.ruleId, request.rule)
            : await Storage.addRule(request.rule);
          console.log('保存结果:', saved);
          return { success: saved, error: saved ? null : '保存到存储失败' };
        } catch (error) {
          console.error('保存规则时出错:', error);
          return { success: false, error: error.message };
        }

      case MESSAGE_TYPES.DELETE_RULE:
        const deleted = await Storage.deleteRule(request.ruleId);
        return { success: deleted };

      case MESSAGE_TYPES.TEST_RULE:
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const engine = new RuleEngine([request.rule]);
        const testResult = engine.testRule(request.rule, currentTab);
        return { success: true, data: testResult };

      case MESSAGE_TYPES.GET_SETTINGS:
        const settings = await Storage.getSettings();
        return { success: true, data: settings };

      case MESSAGE_TYPES.UPDATE_SETTINGS:
        const updated = await Storage.updateSettings(request.settings);
        return { success: updated };

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('Message handler error:', error);
    return { success: false, error: error.message };
  }
}

// 标题变化防抖计时器
let titleChangeTimers = null;

/**
 * 保持 Service Worker 活跃
 * Chrome Service Worker 会在 30 秒无活动后休眠
 */
function keepAlive() {
  setInterval(() => {
    console.log('Service Worker heartbeat');
  }, 20000);
}

// 启动心跳（仅在开发环境）
if (chrome.runtime.getManifest().version === '1.0.0') {
  keepAlive();
}
