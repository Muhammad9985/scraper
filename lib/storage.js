/**
 * BizScrape Pro - Storage Manager (chrome.storage.local)
 */

const StorageManager = {
  KEYS: {
    LEADS: 'bizscrape_leads',
    LEAD_HASHES: 'bizscrape_hashes',
    SESSION_STATE: 'bizscrape_session_state',
    SETTINGS: 'bizscrape_settings'
  },

  DEFAULT_SETTINGS: {
    extractEmails: true,
    scrapeSpeed: 'balanced', // 'safe', 'balanced', 'ultra'
    maxConcurrentEmails: 3,
    autoScrollDelayMs: 800
  },

  DEFAULT_SESSION_STATE: {
    status: 'IDLE', // 'IDLE', 'RUNNING', 'PAUSED', 'COMPLETED', 'STOPPED'
    queryCategory: '',
    queryLocation: '',
    targetCount: 100,
    currentCount: 0,
    emailsFound: 0,
    duplicatesAvoided: 0,
    startTime: null,
    tabId: null,
    error: null
  },

  /**
   * Get all stored leads
   */
  async getLeads() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.LEADS], (result) => {
        resolve(result[this.KEYS.LEADS] || []);
      });
    });
  },

  /**
   * Get existing lead hashes set
   */
  async getLeadHashes() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.LEAD_HASHES], (result) => {
        resolve(new Set(result[this.KEYS.LEAD_HASHES] || []));
      });
    });
  },

  /**
   * Append new leads, automatically filtering duplicates using fingerprint hashes
   * Returns: { addedCount: number, duplicatesCount: number, newLeads: Array }
   */
  async appendLeads(newLeads) {
    if (!Array.isArray(newLeads) || newLeads.length === 0) {
      return { addedCount: 0, duplicatesCount: 0, newLeads: [] };
    }

    const existingLeads = await this.getLeads();
    const existingHashes = await this.getLeadHashes();

    const uniqueNewLeads = [];
    let duplicatesCount = 0;

    for (const lead of newLeads) {
      const hash = lead.hash || Utils.generateLeadHash(lead);
      lead.hash = hash;
      lead.scrapedAt = lead.scrapedAt || Date.now();

      if (existingHashes.has(hash)) {
        duplicatesCount++;
      } else {
        existingHashes.add(hash);
        uniqueNewLeads.push(lead);
      }
    }

    if (uniqueNewLeads.length > 0) {
      const updatedLeads = [...existingLeads, ...uniqueNewLeads];
      await new Promise((resolve) => {
        chrome.storage.local.set({
          [this.KEYS.LEADS]: updatedLeads,
          [this.KEYS.LEAD_HASHES]: Array.from(existingHashes)
        }, resolve);
      });
    }

    return {
      addedCount: uniqueNewLeads.length,
      duplicatesCount,
      newLeads: uniqueNewLeads
    };
  },

  /**
   * Update a specific lead (e.g. after deep email parsing)
   */
  async updateLead(hash, updatedFields) {
    const leads = await this.getLeads();
    const index = leads.findIndex(l => l.hash === hash);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updatedFields };
      await new Promise((resolve) => {
        chrome.storage.local.set({ [this.KEYS.LEADS]: leads }, resolve);
      });
      return true;
    }
    return false;
  },

  /**
   * Clear all leads and hashes
   */
  async clearLeads() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [this.KEYS.LEADS]: [],
        [this.KEYS.LEAD_HASHES]: []
      }, resolve);
    });
  },

  /**
   * Delete lead by hash
   */
  async deleteLead(hash) {
    const leads = await this.getLeads();
    const filtered = leads.filter(l => l.hash !== hash);
    const hashes = filtered.map(l => l.hash);
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [this.KEYS.LEADS]: filtered,
        [this.KEYS.LEAD_HASHES]: hashes
      }, resolve);
    });
  },

  /**
   * Get Current Session State
   */
  async getSessionState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.SESSION_STATE], (result) => {
        resolve(result[this.KEYS.SESSION_STATE] || { ...this.DEFAULT_SESSION_STATE });
      });
    });
  },

  /**
   * Set Session State
   */
  async setSessionState(partialState) {
    const currentState = await this.getSessionState();
    const newState = { ...currentState, ...partialState };
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.KEYS.SESSION_STATE]: newState }, () => resolve(newState));
    });
  },

  /**
   * Reset Session State
   */
  async resetSessionState() {
    return this.setSessionState({ ...this.DEFAULT_SESSION_STATE });
  },

  /**
   * Get Settings
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.KEYS.SETTINGS], (result) => {
        resolve(result[this.KEYS.SETTINGS] || { ...this.DEFAULT_SETTINGS });
      });
    });
  },

  /**
   * Set Settings
   */
  async setSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.KEYS.SETTINGS]: updated }, () => resolve(updated));
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
