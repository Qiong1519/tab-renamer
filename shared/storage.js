/**
 * TabRenamer - 存储模块
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

/**
 * 存储管理类
 */
export const Storage = {
  /**
   * 获取所有规则
   * @returns {Promise<Array>}
   */
  async getRules() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get('rules', (data) => {
          if (chrome.runtime.lastError) {
            console.error('Storage.getRules - 获取规则失败:', chrome.runtime.lastError);
            resolve([]);
          } else {
            console.log('Storage.getRules - 获取规则成功, 数量:', data.rules?.length || 0);
            resolve(data.rules || []);
          }
        });
      });
    } catch (error) {
      console.error('Failed to get rules:', error);
      return [];
    }
  },

  /**
   * 保存所有规则
   * @param {Array} rules - 规则数组
   * @returns {Promise<boolean>}
   */
  async saveRules(rules) {
    try {
      console.log('Storage.saveRules - 保存规则到存储, 数量:', rules.length);
      console.log('Storage.saveRules - 规则数据:', JSON.stringify(rules, null, 2));
      
      return new Promise((resolve) => {
        chrome.storage.local.set({ rules: rules }, () => {
          if (chrome.runtime.lastError) {
            console.error('Storage.saveRules - Chrome 存储错误:', chrome.runtime.lastError);
            resolve(false);
          } else {
            console.log('Storage.saveRules - 规则保存成功');
            // 验证保存是否成功
            chrome.storage.local.get('rules', (data) => {
              console.log('Storage.saveRules - 验证保存结果, 数量:', data.rules?.length);
              resolve(true);
            });
          }
        });
      });
    } catch (error) {
      console.error('Storage.saveRules - 保存规则失败:', error);
      return false;
    }
  },

  /**
   * 添加单条规则
   * @param {Object} rule - 规则对象
   * @returns {Promise<boolean>}
   */
  async addRule(rule) {
    try {
      console.log('Storage.addRule - 开始添加规则:', rule);
      const rules = await this.getRules();
      console.log('Storage.addRule - 当前规则数量:', rules.length);
      rules.push(rule);
      console.log('Storage.addRule - 添加后规则数量:', rules.length);
      await this.saveRules(rules);
      console.log('Storage.addRule - 规则已保存');
      return true;
    } catch (error) {
      console.error('Storage.addRule - 添加规则失败:', error);
      return false;
    }
  },

  /**
   * 更新规则
   * @param {string} ruleId - 规则ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<boolean>}
   */
  async updateRule(ruleId, updates) {
    try {
      console.log('Storage.updateRule - 开始更新规则:', { ruleId, updates });
      const rules = await this.getRules();
      const index = rules.findIndex(r => r.id === ruleId);
      if (index !== -1) {
        rules[index] = { ...rules[index], ...updates, updatedAt: Date.now() };
        await this.saveRules(rules);
        console.log('Storage.updateRule - 规则已更新');
        return true;
      }
      console.log('Storage.updateRule - 未找到规则:', ruleId);
      return false;
    } catch (error) {
      console.error('Storage.updateRule - 更新规则失败:', error);
      return false;
    }
  },

  /**
   * 删除规则
   * @param {string} ruleId - 规则ID
   * @returns {Promise<boolean>}
   */
  async deleteRule(ruleId) {
    try {
      const rules = await this.getRules();
      const filtered = rules.filter(r => r.id !== ruleId);
      await this.saveRules(filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete rule:', error);
      return false;
    }
  },

  /**
   * 获取单个规则
   * @param {string} ruleId - 规则ID
   * @returns {Promise<Object|null>}
   */
  async getRule(ruleId) {
    try {
      const rules = await this.getRules();
      return rules.find(r => r.id === ruleId) || null;
    } catch (error) {
      console.error('Failed to get rule:', error);
      return null;
    }
  },

  /**
   * 切换规则启用状态
   * @param {string} ruleId - 规则ID
   * @param {boolean} enabled - 启用状态
   * @returns {Promise<boolean>}
   */
  async toggleRule(ruleId, enabled) {
    return this.updateRule(ruleId, { enabled });
  },

  /**
   * 获取设置
   * @returns {Promise<Object>}
   */
  async getSettings() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get('settings', (data) => {
          if (chrome.runtime.lastError) {
            console.error('Storage.getSettings - 获取设置失败:', chrome.runtime.lastError);
            resolve(DEFAULT_SETTINGS);
          } else {
            resolve(data.settings || DEFAULT_SETTINGS);
          }
        });
      });
    } catch (error) {
      console.error('Failed to get settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * 保存设置
   * @param {Object} settings - 设置对象
   * @returns {Promise<boolean>}
   */
  async saveSettings(settings) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.set({ settings: settings }, () => {
          if (chrome.runtime.lastError) {
            console.error('Storage.saveSettings - 保存设置失败:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  },

  /**
   * 更新部分设置
   * @param {Object} updates - 更新内容
   * @returns {Promise<boolean>}
   */
  async updateSettings(updates) {
    try {
      const settings = await this.getSettings();
      const newSettings = { ...settings, ...updates };
      await this.saveSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  },

  /**
   * 获取元数据
   * @returns {Promise<Object>}
   */
  async getMetadata() {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEYS.METADATA);
      return data[STORAGE_KEYS.METADATA] || { lastUpdated: Date.now(), ruleCount: 0 };
    } catch (error) {
      console.error('Failed to get metadata:', error);
      return { lastUpdated: Date.now(), ruleCount: 0 };
    }
  },

  /**
   * 更新元数据
   * @param {Object} updates - 更新内容
   * @returns {Promise<boolean>}
   */
  async updateMetadata(updates) {
    try {
      const metadata = await this.getMetadata();
      const newMetadata = { ...metadata, ...updates, lastUpdated: Date.now() };
      await chrome.storage.local.set({ [STORAGE_KEYS.METADATA]: newMetadata });
      return true;
    } catch (error) {
      console.error('Failed to update metadata:', error);
      return false;
    }
  },

  /**
   * 清空所有数据
   * @returns {Promise<boolean>}
   */
  async clearAll() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }
};
