/**
 * BizScrape Pro - Background Service Worker
 * Coordinates scraping tasks, manages Google Maps tab automation,
 * handles storage deduplication, and runs concurrent deep website email crawler.
 * Filters out leads that have neither Phone nor Email contact info.
 */

importScripts('../lib/utils.js', '../lib/storage.js');

console.log('[BizScrape Pro] Background Service Worker initialized.');

let activeEmailQueue = [];
let isProcessingEmailQueue = false;

/**
 * Handle incoming runtime messages from Popup, Dashboard, and Content Scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true;
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'START_JOB':
        await startNewScrapeJob(message.payload);
        sendResponse({ success: true });
        break;

      case 'PAUSE_JOB':
        await pauseScrapeJob();
        sendResponse({ success: true });
        break;

      case 'RESUME_JOB':
        await resumeScrapeJob();
        sendResponse({ success: true });
        break;

      case 'STOP_JOB':
        await stopScrapeJob();
        sendResponse({ success: true });
        break;

      case 'LEADS_FOUND':
        await handleLeadsFound(message.leads);
        sendResponse({ success: true });
        break;

      case 'SCRAPING_FINISHED':
        await handleScrapingFinished(message.reason);
        sendResponse({ success: true });
        break;

      default:
        break;
    }
  } catch (err) {
    console.error('[BizScrape Pro] Error handling background message:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Start a new Business Search & Scraping Job
 */
async function startNewScrapeJob(payload) {
  const { category, location, targetCount, extractEmails, scrapeSpeed, requireContactInfo = true } = payload;

  console.log(`[BizScrape Pro] Starting job: "${category}" in "${location}" (Target: ${targetCount}, RequireContact: ${requireContactInfo})`);

  // Clear or initialize state
  await StorageManager.setSessionState({
    status: 'RUNNING',
    queryCategory: category,
    queryLocation: location,
    targetCount: parseInt(targetCount, 10) || 100,
    currentCount: 0,
    emailsFound: 0,
    duplicatesAvoided: 0,
    startTime: Date.now(),
    error: null
  });

  // Save settings
  await StorageManager.setSettings({ extractEmails, scrapeSpeed, requireContactInfo });

  // Formulate Google Maps Search URL
  const queryStr = `${category} in ${location}`;
  const gmapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(queryStr)}`;

  // Create or focus Google Maps Tab
  const tab = await chrome.tabs.create({ url: gmapsUrl, active: true });

  await StorageManager.setSessionState({ tabId: tab.id });

  // Wait for tab load completion then communicate with content script
  chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
    if (tabId === tab.id && changeInfo.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);

      setTimeout(async () => {
        try {
          // Attempt sending start message to automatically injected manifest content script
          await chrome.tabs.sendMessage(tab.id, {
            action: 'START_SCRAPING',
            targetGoal: targetCount,
            category,
            requireContactInfo
          });
        } catch (err) {
          // Fallback: If not yet loaded, dynamically inject and send message
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['lib/utils.js', 'content_scripts/gmaps_scraper.js']
            });

            await chrome.tabs.sendMessage(tab.id, {
              action: 'START_SCRAPING',
              targetGoal: targetCount,
              category,
              requireContactInfo
            });
          } catch (e) {
            console.error('[BizScrape Pro] Failed to inject content script:', e);
          }
        }
      }, 1500);
    }
  });
}

/**
 * Pause Current Job
 */
async function pauseScrapeJob() {
  const state = await StorageManager.getSessionState();
  if (state.tabId) {
    try {
      await chrome.tabs.sendMessage(state.tabId, { action: 'PAUSE_SCRAPING' });
    } catch (e) {
      console.warn('[BizScrape Pro] Could not send pause to tab:', e.message);
    }
  }
  await StorageManager.setSessionState({ status: 'PAUSED' });
}

/**
 * Resume Current Job
 */
async function resumeScrapeJob() {
  const state = await StorageManager.getSessionState();
  const settings = await StorageManager.getSettings();

  if (state.tabId) {
    try {
      await chrome.tabs.sendMessage(state.tabId, {
        action: 'RESUME_SCRAPING',
        targetGoal: state.targetCount,
        category: state.queryCategory,
        requireContactInfo: settings.requireContactInfo !== false
      });
    } catch (e) {
      console.warn('[BizScrape Pro] Could not send resume to tab:', e.message);
    }
  }
  await StorageManager.setSessionState({ status: 'RUNNING' });
}

/**
 * Stop Current Job
 */
async function stopScrapeJob() {
  const state = await StorageManager.getSessionState();
  if (state.tabId) {
    try {
      await chrome.tabs.sendMessage(state.tabId, { action: 'STOP_SCRAPING' });
    } catch (e) {
      console.warn('[BizScrape Pro] Could not send stop to tab:', e.message);
    }
  }
  await StorageManager.setSessionState({ status: 'STOPPED' });
}

/**
 * Process Batch of Extracted Leads from Content Script
 */
async function handleLeadsFound(newLeads) {
  const state = await StorageManager.getSessionState();
  const settings = await StorageManager.getSettings();

  // Save to local storage with deduplication
  const result = await StorageManager.appendLeads(newLeads);

  const updatedCount = state.currentCount + result.addedCount;
  const updatedDuplicates = state.duplicatesAvoided + result.duplicatesCount;

  await StorageManager.setSessionState({
    currentCount: updatedCount,
    duplicatesAvoided: updatedDuplicates
  });

  console.log(`[BizScrape Pro] Batch saved: +${result.addedCount} new leads. Total: ${updatedCount}/${state.targetCount}`);

  // Enqueue for Deep Website Email Crawler if enabled & website present
  if (settings.extractEmails && result.newLeads.length > 0) {
    result.newLeads.forEach(lead => {
      if (lead.website && !lead.emailsScraped) {
        activeEmailQueue.push(lead);
      }
    });
    processEmailQueue();
  }

  // Check target limit reached
  if (updatedCount >= state.targetCount) {
    await stopScrapeJob();
    await StorageManager.setSessionState({ status: 'COMPLETED' });
  }
}

/**
 * Deep Website Email Extraction Worker Queue
 */
async function processEmailQueue() {
  if (isProcessingEmailQueue || activeEmailQueue.length === 0) return;
  isProcessingEmailQueue = true;

  const settings = await StorageManager.getSettings();
  const requireContact = settings.requireContactInfo !== false;

  while (activeEmailQueue.length > 0) {
    const lead = activeEmailQueue.shift();
    if (!lead || !lead.website) continue;

    try {
      console.log(`[BizScrape Pro Email Crawler] Crawling website: ${lead.website}`);
      const emails = await extractEmailsFromWebsite(lead.website);

      if (emails && emails.length > 0) {
        console.log(`[BizScrape Pro Email Crawler] Found emails for ${lead.name}:`, emails);
        await StorageManager.updateLead(lead.hash, { emails, emailsScraped: true });

        const state = await StorageManager.getSessionState();
        await StorageManager.setSessionState({ emailsFound: state.emailsFound + emails.length });
      } else {
        await StorageManager.updateLead(lead.hash, { emailsScraped: true });

        // STRICT CHECK: If lead has NO Phone AND NO Email was found on website, DISCARD this lead!
        if (requireContact && !lead.phone && (!emails || emails.length === 0)) {
          console.log(`[BizScrape Pro] Discarding lead "${lead.name}" because it has neither phone nor email.`);
          await StorageManager.deleteLead(lead.hash);
          const state = await StorageManager.getSessionState();
          if (state.currentCount > 0) {
            await StorageManager.setSessionState({ currentCount: state.currentCount - 1 });
          }
        }
      }
    } catch (err) {
      console.warn(`[BizScrape Pro Email Crawler] Failed crawling ${lead.website}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 600));
  }

  isProcessingEmailQueue = false;
}

/**
 * Crawl website homepage & contact subpage for email addresses
 */
async function extractEmailsFromWebsite(websiteUrl) {
  const foundEmails = new Set();

  const fetchWithTimeout = async (url, timeoutMs = 4000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      clearTimeout(id);
      if (!response.ok) return '';
      return await response.text();
    } catch (e) {
      clearTimeout(id);
      return '';
    }
  };

  let mainUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
  const html = await fetchWithTimeout(mainUrl);
  if (html) {
    const emails = Utils.extractEmails(html);
    emails.forEach(e => foundEmails.add(e));
  }

  if (foundEmails.size === 0 && html) {
    try {
      const baseUrl = new URL(mainUrl).origin;
      const contactUrls = [`${baseUrl}/contact`, `${baseUrl}/contact-us`, `${baseUrl}/about`];

      for (const contactUrl of contactUrls) {
        const contactHtml = await fetchWithTimeout(contactUrl, 3000);
        if (contactHtml) {
          const emails = Utils.extractEmails(contactHtml);
          emails.forEach(e => foundEmails.add(e));
          if (foundEmails.size > 0) break;
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  return Array.from(foundEmails);
}

/**
 * Handle Scraping Finished event from content script
 */
async function handleScrapingFinished(reason) {
  console.log(`[BizScrape Pro] Scraping finished event received: ${reason}`);
  const state = await StorageManager.getSessionState();
  if (state.status === 'RUNNING') {
    await StorageManager.setSessionState({ status: 'COMPLETED' });
  }
}
