/**
 * BizScrape Pro - Popup UI Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const statusBadge = document.getElementById('statusBadge');
  const setupCard = document.getElementById('setupCard');
  const progressCard = document.getElementById('progressCard');

  const categoryInput = document.getElementById('categoryInput');
  const locationInput = document.getElementById('locationInput');
  const targetCountInput = document.getElementById('targetCountInput');
  const scrapeSpeedSelect = document.getElementById('scrapeSpeedSelect');
  const extractEmailsCheck = document.getElementById('extractEmailsCheck');
  const requireContactCheck = document.getElementById('requireContactCheck');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const stopBtn = document.getElementById('stopBtn');
  const openDashboardBtn = document.getElementById('openDashboardBtn');
  const openGuideBtn = document.getElementById('openGuideBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');

  const progressTitle = document.getElementById('progressTitle');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressRatio = document.getElementById('progressRatio');

  const statFound = document.getElementById('statFound');
  const statEmails = document.getElementById('statEmails');
  const statDups = document.getElementById('statDups');

  // Load saved settings & state
  const settings = await StorageManager.getSettings();
  if (settings) {
    extractEmailsCheck.checked = settings.extractEmails !== false;
    requireContactCheck.checked = settings.requireContactInfo !== false;
    scrapeSpeedSelect.value = settings.scrapeSpeed || 'balanced';
  }

  // Poll state loop
  updateUIFromState();
  const pollTimer = setInterval(updateUIFromState, 1000);

  /**
   * Sync UI components with current session state
   */
  async function updateUIFromState() {
    const state = await StorageManager.getSessionState();
    const status = state.status || 'IDLE';

    // Update Status Badge
    statusBadge.className = `badge badge-${status.toLowerCase()}`;
    statusBadge.textContent = status;

    if (status === 'RUNNING' || status === 'PAUSED') {
      progressCard.style.display = 'block';

      const target = state.targetCount || 100;
      const current = state.currentCount || 0;
      const pct = Math.min(100, Math.round((current / target) * 100));

      progressBarFill.style.width = `${pct}%`;
      progressPercent.textContent = `${pct}%`;
      progressRatio.textContent = `${current} / ${target}`;

      statFound.textContent = current;
      statEmails.textContent = state.emailsFound || 0;
      statDups.textContent = state.duplicatesAvoided || 0;

      progressTitle.textContent = status === 'PAUSED' ? 'Scraping Paused' : `Scraping "${state.queryCategory}"...`;

      pauseBtn.style.display = status === 'RUNNING' ? 'block' : 'none';
      resumeBtn.style.display = status === 'PAUSED' ? 'block' : 'none';
    } else if (status === 'COMPLETED') {
      progressCard.style.display = 'block';
      progressBarFill.style.width = '100%';
      progressPercent.textContent = '100%';
      progressTitle.textContent = 'Scraping Goal Reached! 🎉';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
    } else {
      progressCard.style.display = 'none';
    }
  }

  /**
   * Start Button Handler
   */
  startBtn.addEventListener('click', async () => {
    const category = categoryInput.value.trim();
    const location = locationInput.value.trim();
    const targetCount = parseInt(targetCountInput.value, 10) || 100;

    if (!category || !location) {
      alert('Please enter both a business category and a location.');
      return;
    }

    startBtn.disabled = true;
    startBtn.textContent = '⏳ Launching Bot...';

    chrome.runtime.sendMessage({
      action: 'START_JOB',
      payload: {
        category,
        location,
        targetCount,
        extractEmails: extractEmailsCheck.checked,
        requireContactInfo: requireContactCheck.checked,
        scrapeSpeed: scrapeSpeedSelect.value
      }
    }, () => {
      startBtn.disabled = false;
      startBtn.innerHTML = '<span>🚀 Start Lead Scraper</span>';
      updateUIFromState();
    });
  });

  /**
   * Pause Button Handler
   */
  pauseBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'PAUSE_JOB' }, updateUIFromState);
  });

  /**
   * Resume Button Handler
   */
  resumeBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'RESUME_JOB' }, updateUIFromState);
  });

  /**
   * Stop Button Handler
   */
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_JOB' }, updateUIFromState);
  });

  /**
   * Open Full Dashboard Handler
   */
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });

  /**
   * Open User Guide Handler
   */
  if (openGuideBtn) {
    openGuideBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('guide.html') });
    });
  }

  /**
   * Clear Data Handler
   */
  clearDataBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all collected lead data?')) {
      await StorageManager.clearLeads();
      await StorageManager.resetSessionState();
      updateUIFromState();
      alert('Stored leads cleared successfully.');
    }
  });
});
