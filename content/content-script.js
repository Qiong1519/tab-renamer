/**
 * TabRenamer - Content Script
 * 
 * 用于修改页面标题的脚本
 */

(function() {
  'use strict';

  /**
   * 修改页面标题
   * @param {string} newTitle - 新标题
   */
  function setTitle(newTitle) {
    if (newTitle && typeof newTitle === 'string') {
      document.title = newTitle;
      return { success: true, title: document.title };
    }
    return { success: false, error: 'Invalid title' };
  }

  /**
   * 获取当前标题
   */
  function getTitle() {
    return document.title;
  }

  /**
   * 恢复原始标题（通过刷新页面）
   */
  function restoreTitle() {
    // 无法真正恢复原始标题，因为页面加载时的标题由页面决定
    // 只能通过刷新页面来恢复
    location.reload();
    return { success: true };
  }

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setTitle') {
      const result = setTitle(request.title);
      sendResponse(result);
    } else if (request.action === 'getTitle') {
      sendResponse({ title: getTitle() });
    } else if (request.action === 'restoreTitle') {
      const result = restoreTitle();
      sendResponse(result);
    }
    return true; // 保持消息通道开启
  });

  // 通知 background 脚本已加载
  if (document.readyState === 'complete') {
    chrome.runtime.sendMessage({ action: 'contentScriptReady' });
  } else {
    window.addEventListener('load', () => {
      chrome.runtime.sendMessage({ action: 'contentScriptReady' });
    });
  }

  // 监听页面标题变化（可选，用于处理动态更新标题的页面）
  let titleObserver = null;
  
  function observeTitle() {
    if (titleObserver) return;
    
    const titleElement = document.querySelector('title');
    if (!titleElement) return;
    
    titleObserver = new MutationObserver((mutations) => {
      // 通知 background 标题发生了变化
      chrome.runtime.sendMessage({
        action: 'titleChanged',
        title: document.title,
        url: location.href
      });
    });
    
    titleObserver.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  
  // 延迟启动观察器，避免影响页面加载性能
  setTimeout(observeTitle, 1000);
})();
