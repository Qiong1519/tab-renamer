/**
 * TabRenamer - Options 页面脚本
 */

import { Storage } from '../shared/storage.js';
import { RuleEngine, createRule } from '../shared/rule-engine.js';
import { validateRegex, formatTimestamp, truncate, escapeHtml, isRulesLimitReached } from '../shared/utils.js';
import { MESSAGE_TYPES, ACTION_TYPES, MATCH_TYPES, MATCH_TARGETS, MAX_RULES } from '../shared/constants.js';

// DOM 元素
let elements = {};

// 当前状态
let rules = [];
let settings = {};
let editingRuleId = null;
let currentTab = null;

// 初始化
document.addEventListener('DOMContentLoaded', init);

/**
 * 初始化
 */
async function init() {
  // 获取 DOM 元素
  elements = {
    // 标签页
    rulesTab: document.getElementById('rulesTab'),
    settingsTab: document.getElementById('settingsTab'),
    navBtns: document.querySelectorAll('.nav-btn'),
    
    // 规则列表
    searchInput: document.getElementById('searchInput'),
    createRuleBtn: document.getElementById('createRuleBtn'),
    rulesCount: document.getElementById('rulesCount'),
    rulesList: document.getElementById('rulesList'),
    emptyState: document.getElementById('emptyState'),
    
    // 设置
    settingGlobalEnabled: document.getElementById('settingGlobalEnabled'),
    resetGuideBtn: document.getElementById('resetGuideBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    
    // 模态框
    ruleModal: document.getElementById('ruleModal'),
    modalTitle: document.getElementById('modalTitle'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    ruleForm: document.getElementById('ruleForm'),
    
    // 表单字段
    ruleName: document.getElementById('ruleName'),
    matchTarget: document.getElementsByName('matchTarget'),
    matchType: document.getElementById('matchType'),
    pattern: document.getElementById('pattern'),
    caseSensitive: document.getElementById('caseSensitive'),
    actionType: document.getElementById('actionType'),
    actionValue: document.getElementById('actionValue'),
    patternError: document.getElementById('patternError'),
    
    // 测试
    testRuleBtn: document.getElementById('testRuleBtn'),
    testResult: document.getElementById('testResult'),
    testMatched: document.getElementById('testMatched'),
    testMatchContent: document.getElementById('testMatchContent'),
    testOriginalTitle: document.getElementById('testOriginalTitle'),
    testNewTitle: document.getElementById('testNewTitle'),
    testError: document.getElementById('testError'),
    
    // 按钮
    cancelBtn: document.getElementById('cancelBtn'),
    saveRuleBtn: document.getElementById('saveRuleBtn'),
    
    toast: document.getElementById('toast')
  };

  // 绑定事件
  bindEvents();

  // 加载数据
  await loadData();
  
  // 检查是否有临时规则（从 Popup 传递）
  await checkTempRule();
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 标签页切换
  elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 搜索
  elements.searchInput.addEventListener('input', debounce(handleSearch, 300));

  // 创建规则
  elements.createRuleBtn.addEventListener('click', () => openModal());

  // 设置
  elements.settingGlobalEnabled.addEventListener('change', handleGlobalEnabledChange);
  elements.resetGuideBtn.addEventListener('click', handleResetGuide);
  elements.exportDataBtn.addEventListener('click', handleExportData);
  elements.clearDataBtn.addEventListener('click', handleClearData);

  // 模态框
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.cancelBtn.addEventListener('click', closeModal);
  elements.saveRuleBtn.addEventListener('click', handleSaveRule);

  // 表单变化时更新测试
  elements.matchType.addEventListener('change', clearTestResult);
  elements.pattern.addEventListener('input', debounce(clearTestResult, 300));
  elements.actionType.addEventListener('change', clearTestResult);
  elements.actionValue.addEventListener('input', debounce(clearTestResult, 300));

  // 测试规则
  elements.testRuleBtn.addEventListener('click', handleTestRule);

  // 点击模态框外部关闭
  elements.ruleModal.addEventListener('click', (e) => {
    if (e.target === elements.ruleModal) {
      closeModal();
    }
  });

  // 正则表达式验证
  elements.pattern.addEventListener('input', validatePatternInput);

  // 监听页面可见性变化（处理 Options 页面已打开时从 Popup 跳转的情况）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkTempRule();
    }
  });
}

/**
 * 加载数据
 */
async function loadData() {
  await Promise.all([
    loadRules(),
    loadSettings(),
    loadCurrentTab()
  ]);
}

/**
 * 加载规则
 */
async function loadRules() {
  try {
    const response = await sendMessage({ type: MESSAGE_TYPES.GET_RULES });
    if (response.success) {
      rules = response.data;
      renderRules();
      updateRulesCount();
    }
  } catch (error) {
    console.error('Failed to load rules:', error);
    showToast('加载规则失败', 'error');
  }
}

/**
 * 加载设置
 */
async function loadSettings() {
  try {
    const response = await sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS });
    if (response.success) {
      settings = response.data;
      elements.settingGlobalEnabled.checked = settings.globalEnabled;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * 加载当前标签页
 */
async function loadCurrentTab() {
  try {
    const response = await sendMessage({ type: MESSAGE_TYPES.GET_CURRENT_TAB });
    if (response.success) {
      currentTab = response.data;
    }
  } catch (error) {
    console.error('Failed to load current tab:', error);
  }
}

/**
 * 检查临时规则
 */
async function checkTempRule() {
  try {
    const data = await chrome.storage.local.get('tempRule');
    console.log('检查临时规则:', data.tempRule);
    
    if (data.tempRule) {
      // 临时规则不包含 ID，所以是创建新规则
      console.log('从 Popup 传递的临时规则，创建新规则');
      openModalWithTempData(data.tempRule);
      await chrome.storage.local.remove('tempRule');
    }
  } catch (error) {
    console.error('Failed to check temp rule:', error);
  }
}

/**
 * 使用临时数据打开模态框
 */
function openModalWithTempData(tempData) {
  console.log('使用临时数据打开模态框:', tempData);
  
  // 重置编辑 ID（确保是创建新规则）
  editingRuleId = null;
  console.log('重置 editingRuleId:', editingRuleId);
  
  elements.modalTitle.textContent = '创建规则';

  // 填充表单
  elements.ruleName.value = tempData.name || '';
  elements.matchType.value = tempData.matchType || MATCH_TYPES.CONTAINS;
  elements.pattern.value = tempData.pattern || '';
  elements.caseSensitive.checked = tempData.caseSensitive || false;
  elements.actionType.value = tempData.actionType || ACTION_TYPES.PREPEND;
  elements.actionValue.value = tempData.actionValue || '';
  
  // 设置匹配目标
  const matchTargetRadios = elements.matchTarget;
  for (const radio of matchTargetRadios) {
    radio.checked = radio.value === (tempData.matchTarget || MATCH_TARGETS.URL);
  }

  // 清空测试结果
  clearTestResult();

  // 显示模态框
  elements.ruleModal.classList.add('active');
}

/**
 * 处理搜索
 */
function handleSearch() {
  const filter = elements.searchInput.value.trim();
  renderRules(filter);
}

/**
 * 更新规则计数
 */
function updateRulesCount() {
  elements.rulesCount.textContent = rules.length;
}

/**
 * 切换标签页
 */
function switchTab(tabName) {
  // 更新导航按钮
  elements.navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 更新内容
  elements.rulesTab.classList.toggle('active', tabName === 'rules');
  elements.settingsTab.classList.toggle('active', tabName === 'settings');
}

/**
 * 渲染规则列表
 */
function renderRules(filter = '') {
  const filteredRules = filter
    ? rules.filter(r => 
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        r.pattern.toLowerCase().includes(filter.toLowerCase())
      )
    : rules;

  if (filteredRules.length === 0) {
    elements.rulesList.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    return;
  }

  elements.emptyState.classList.add('hidden');

  elements.rulesList.innerHTML = filteredRules.map(rule => `
    <div class="rule-card ${rule.enabled ? '' : 'disabled'}" data-rule-id="${rule.id}">
      <div class="rule-header">
        <div class="rule-info">
          <div class="rule-name">${escapeHtml(rule.name)}</div>
          <div class="rule-pattern">${escapeHtml(truncate(rule.pattern, 50))}</div>
        </div>
        <div class="rule-actions">
          <div class="rule-toggle">
            <label class="switch">
              <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-rule-id="${rule.id}">
              <span class="slider"></span>
            </label>
          </div>
          <button class="btn btn-secondary btn-small edit-btn" data-rule-id="${rule.id}">编辑</button>
          <button class="btn btn-danger btn-small delete-btn" data-rule-id="${rule.id}">删除</button>
        </div>
      </div>
      <div class="rule-details">
        <div class="detail-item">
          <div class="detail-label">匹配方式</div>
          <div class="detail-value">${getMatchTypeLabel(rule.matchType)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">匹配目标</div>
          <div class="detail-value">${rule.matchTarget === 'url' ? 'URL' : '标题'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">动作类型</div>
          <div class="detail-value">${getActionTypeLabel(rule.actionType)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">最后匹配</div>
          <div class="detail-value">${rule.lastMatched ? formatTimestamp(rule.lastMatched) : '从未'}</div>
        </div>
      </div>
    </div>
  `).join('');
  
  // 添加事件监听器（避免 CSP 问题）
  attachRuleEventListeners();
}

/**
 * 为规则卡片添加事件监听器
 */
function attachRuleEventListeners() {
  // 切换开关
  elements.rulesList.querySelectorAll('.rule-toggle input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const ruleId = e.target.dataset.ruleId;
      const enabled = e.target.checked;
      await handleToggleRule(ruleId, enabled);
    });
  });
  
  // 编辑按钮
  elements.rulesList.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ruleId = e.target.dataset.ruleId;
      handleEditRule(ruleId);
    });
  });
  
  // 删除按钮
  elements.rulesList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const ruleId = e.target.dataset.ruleId;
      await handleDeleteRule(ruleId);
    });
  });
}

/**
 * 处理切换规则启用状态
 */
async function handleToggleRule(ruleId, enabled) {
  try {
    const response = await sendMessage({
      type: MESSAGE_TYPES.SAVE_RULE,
      ruleId: ruleId,
      rule: { enabled }
    });

    if (response.success) {
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        rule.enabled = enabled;
      }
      renderRules(elements.searchInput.value.trim());
      showToast(enabled ? '规则已启用' : '规则已禁用', 'success');
    } else {
      showToast('操作失败', 'error');
      await loadRules();
    }
  } catch (error) {
    console.error('Toggle rule error:', error);
    showToast('操作失败', 'error');
  }
}

/**
 * 处理编辑规则
 */
function handleEditRule(ruleId) {
  const rule = rules.find(r => r.id === ruleId);
  if (rule) {
    openModal(rule);
  }
}

/**
 * 处理删除规则
 */
async function handleDeleteRule(ruleId) {
  if (!confirm('确定要删除这条规则吗？')) {
    return;
  }

  try {
    const response = await sendMessage({
      type: MESSAGE_TYPES.DELETE_RULE,
      ruleId: ruleId
    });

    if (response.success) {
      rules = rules.filter(r => r.id !== ruleId);
      renderRules(elements.searchInput.value.trim());
      updateRulesCount();
      showToast('规则已删除', 'success');
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    console.error('Delete rule error:', error);
    showToast('删除失败', 'error');
  }
}

/**
 * 打开模态框
 */
function openModal(rule = null) {
  console.log('打开模态框, 规则:', rule);
  editingRuleId = rule?.id || null;
  console.log('设置 editingRuleId:', editingRuleId);
  
  elements.modalTitle.textContent = rule ? '编辑规则' : '创建规则';

  // 填充表单
  if (rule) {
    elements.ruleName.value = rule.name || '';
    elements.matchType.value = rule.matchType || MATCH_TYPES.CONTAINS;
    elements.pattern.value = rule.pattern || '';
    elements.caseSensitive.checked = rule.caseSensitive || false;
    elements.actionType.value = rule.actionType || ACTION_TYPES.PREPEND;
    elements.actionValue.value = rule.actionValue || '';
    
    // 设置匹配目标
    const matchTargetRadios = elements.matchTarget;
    for (const radio of matchTargetRadios) {
      radio.checked = radio.value === (rule.matchTarget || MATCH_TARGETS.URL);
    }
  } else {
    elements.ruleForm.reset();
    // 自动生成规则名称
    elements.ruleName.value = `规则 ${Date.now()}`;
  }

  // 清空测试结果
  clearTestResult();

  // 显示模态框
  elements.ruleModal.classList.add('active');
}

/**
 * 关闭模态框
 */
function closeModal() {
  console.log('关闭模态框');
  elements.ruleModal.classList.remove('active');
  editingRuleId = null;
  console.log('重置 editingRuleId:', editingRuleId);
  elements.ruleForm.reset();
  clearTestResult();
}

/**
 * 验证正则表达式输入
 */
function validatePatternInput() {
  const matchType = elements.matchType.value;
  const pattern = elements.pattern.value;

  if (matchType === MATCH_TYPES.REGEX && pattern) {
    const validation = validateRegex(pattern);
    if (!validation.valid) {
      elements.patternError.textContent = validation.error;
      return false;
    }
  }

  elements.patternError.textContent = '';
  return true;
}

/**
 * 清空测试结果
 */
function clearTestResult() {
  elements.testResult.classList.add('hidden');
  elements.testError.classList.add('hidden');
}

/**
 * 测试规则
 */
async function handleTestRule() {
  // 验证表单
  if (!elements.ruleName.value.trim()) {
    showToast('请输入规则名称', 'error');
    return;
  }

  if (!elements.pattern.value.trim()) {
    showToast('请输入匹配模式', 'error');
    return;
  }

  if (!elements.actionValue.value.trim()) {
    showToast('请输入修改内容', 'error');
    return;
  }

  // 验证正则
  if (!validatePatternInput()) {
    return;
  }

  // 构建规则对象
  const rule = getFormData();

  // 测试
  try {
    const response = await sendMessage({
      type: MESSAGE_TYPES.TEST_RULE,
      rule: rule
    });

    if (response.success) {
      const result = response.data;
      
      if (result.error) {
        elements.testError.textContent = result.error;
        elements.testError.classList.remove('hidden');
        elements.testResult.classList.add('hidden');
      } else {
        elements.testMatched.textContent = result.matched ? '✓ 匹配成功' : '✗ 不匹配';
        elements.testMatched.style.color = result.matched ? '#28a745' : '#dc3545';
        elements.testMatchContent.textContent = result.matchContent || '-';
        elements.testOriginalTitle.textContent = truncate(result.originalTitle, 50);
        elements.testNewTitle.textContent = truncate(result.newTitle, 50);
        
        elements.testResult.classList.remove('hidden');
        elements.testError.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Test rule error:', error);
    showToast('测试失败', 'error');
  }
}

/**
 * 保存规则
 */
async function handleSaveRule() {
  console.log('=== 开始保存规则 ===');
  console.log('当前 editingRuleId:', editingRuleId);
  
  // 验证表单
  if (!elements.ruleName.value.trim()) {
    showToast('请输入规则名称', 'error');
    elements.ruleName.focus();
    return;
  }

  if (!elements.pattern.value.trim()) {
    showToast('请输入匹配模式', 'error');
    elements.pattern.focus();
    return;
  }

  if (!elements.actionValue.value.trim()) {
    showToast('请输入修改内容', 'error');
    elements.actionValue.focus();
    return;
  }

  // 验证正则
  if (!validatePatternInput()) {
    elements.pattern.focus();
    return;
  }

  // 检查规则数量限制
  if (!editingRuleId && isRulesLimitReached(rules.length)) {
    showToast(`已达到规则上限（${MAX_RULES}条）`, 'error');
    return;
  }

  // 获取表单数据
  const rule = getFormData();
  console.log('表单数据:', rule);
  console.log('规则 ID:', rule.id);
  console.log('是否编辑模式:', !!editingRuleId);

  // 保存
  try {
    console.log('发送保存请求, editingRuleId:', editingRuleId);
    
    const response = await sendMessage({
      type: MESSAGE_TYPES.SAVE_RULE,
      ruleId: editingRuleId, // 明确传递 editingRuleId
      rule: rule
    });

    console.log('保存规则响应:', response);

    if (response.success) {
      showToast(editingRuleId ? '规则已更新' : '规则已创建', 'success');
      closeModal();
      await loadRules();
    } else {
      const errorMsg = response.error || '保存失败（未知错误）';
      console.error('保存规则失败:', errorMsg);
      showToast(errorMsg, 'error');
    }
  } catch (error) {
    console.error('Save rule error:', error);
    showToast(`保存失败: ${error.message}`, 'error');
  }
}

/**
 * 获取表单数据
 */
function getFormData() {
  const matchTarget = Array.from(elements.matchTarget).find(r => r.checked)?.value || MATCH_TARGETS.URL;

  const rule = createRule({
    name: elements.ruleName.value.trim(),
    matchType: elements.matchType.value,
    matchTarget: matchTarget,
    pattern: elements.pattern.value.trim(),
    caseSensitive: elements.caseSensitive.checked,
    actionType: elements.actionType.value,
    actionValue: elements.actionValue.value.trim()
  });

  if (editingRuleId) {
    rule.id = editingRuleId;
  }

  return rule;
}

/**
 * 切换规则启用状态
 */
window.toggleRule = async (ruleId, enabled) => {
  try {
    const response = await sendMessage({
      type: MESSAGE_TYPES.SAVE_RULE,
      ruleId: ruleId,
      rule: { enabled }
    });

    if (response.success) {
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        rule.enabled = enabled;
      }
      renderRules(elements.searchInput.value.trim());
      showToast(enabled ? '规则已启用' : '规则已禁用', 'success');
    } else {
      showToast('操作失败', 'error');
      await loadRules();
    }
  } catch (error) {
    console.error('Toggle rule error:', error);
    showToast('操作失败', 'error');
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
    showToast(enabled ? '扩展已启用' : '扩展已禁用', 'success');
  } else {
    elements.settingGlobalEnabled.checked = !enabled;
    showToast('设置失败', 'error');
  }
}

/**
 * 重置引导
 */
async function handleResetGuide() {
  const response = await sendMessage({
    type: MESSAGE_TYPES.UPDATE_SETTINGS,
    settings: { firstUseCompleted: false }
  });

  if (response.success) {
    showToast('引导已重置', 'success');
  } else {
    showToast('重置失败', 'error');
  }
}

/**
 * 导出数据
 */
async function handleExportData() {
  try {
    const data = {
      rules: rules,
      settings: settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabrenamer-backup-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('导出失败', 'error');
  }
}

/**
 * 清除数据
 */
async function handleClearData() {
  if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    return;
  }

  try {
    await Storage.clearAll();
    rules = [];
    renderRules();
    updateRulesCount();
    showToast('数据已清除', 'success');
  } catch (error) {
    console.error('Clear data error:', error);
    showToast('清除失败', 'error');
  }
}

/**
 * 获取匹配类型标签
 */
function getMatchTypeLabel(type) {
  const labels = {
    [MATCH_TYPES.CONTAINS]: '包含',
    [MATCH_TYPES.EQUALS]: '等于',
    [MATCH_TYPES.STARTS_WITH]: '开头匹配',
    [MATCH_TYPES.ENDS_WITH]: '结尾匹配',
    [MATCH_TYPES.REGEX]: '正则表达式'
  };
  return labels[type] || type;
}

/**
 * 获取动作类型标签
 */
function getActionTypeLabel(type) {
  const labels = {
    [ACTION_TYPES.REPLACE]: '替换',
    [ACTION_TYPES.PREPEND]: '前缀',
    [ACTION_TYPES.APPEND]: '后缀',
    [ACTION_TYPES.REGEX_REPLACE]: '正则替换'
  };
  return labels[type] || type;
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

/**
 * 防抖函数
 */
function debounce(func, wait) {
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
