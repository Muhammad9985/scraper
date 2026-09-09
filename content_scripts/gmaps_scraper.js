/**
 * BizScrape Pro - Google Maps Content Script Scraper
 * Automatically scrolls Google Maps search results, extracts lead details,
 * filters leads without phone/email contact info, and sends extracted business items to background service worker.
 */

(function () {
  if (window.bizScrapeInjected) return;
  window.bizScrapeInjected = true;

  console.log('[BizScrape Pro] Content script loaded on Google Maps.');

  let isScrapingActive = false;
  let targetGoal = 100;
  let collectedHashes = new Set();
  let scrollIntervalId = null;
  let noNewDataCount = 0;
  let categoryFilter = '';
  let requireContact = true; // Default: Skip leads missing both Phone and Email/Website

  /**
   * Main Google Maps DOM Extractor
   */
  function extractLeadsFromDOM() {
    const leads = [];
    
    // Find parent container cards
    let cardElements = Array.from(document.querySelectorAll('div[role="article"]'));
    if (cardElements.length === 0) {
      const placeLinks = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      cardElements = placeLinks.map(link => link.closest('div.Nv251d') || link.parentElement).filter(Boolean);
    }

    cardElements.forEach(card => {
      try {
        // Extract Name
        const nameEl = card.querySelector('.fontHeadlineSmall, .qBF1Pd, .fontTitleMedium, [aria-label]') || 
                       card.querySelector('a[aria-label]');
        let name = nameEl ? (nameEl.innerText || nameEl.getAttribute('aria-label') || '').trim() : '';

        if (!name || name.length < 2 || name.toLowerCase().includes('results for')) return;

        // Extract Place URL & Google Place ID
        const linkEl = card.querySelector('a[href*="/maps/place/"]') || (card.tagName === 'A' ? card : null);
        const placeUrl = linkEl ? linkEl.href : window.location.href;

        // Extract Rating & Reviews
        let rating = '';
        let reviews = '';
        const ratingEl = card.querySelector('.MW4etd, span[aria-label*="stars"], span[aria-label*="rating"]');
        if (ratingEl) {
          rating = ratingEl.innerText || ratingEl.getAttribute('aria-label') || '';
        }
        const reviewEl = card.querySelector('.UY7F9, span[aria-label*="reviews"]');
        if (reviewEl) {
          const revText = reviewEl.innerText || reviewEl.getAttribute('aria-label') || '';
          reviews = revText.replace(/[^\d]/g, '');
        }

        // Extract Phone Number, Category, Address from text blocks
        let phone = '';
        let address = '';
        let category = categoryFilter;
        let website = '';

        // Find website button / link
        const websiteEl = card.querySelector('a[aria-label*="website"], a[data-value="Website"], a[href^="http"]:not([href*="google.com"])');
        if (websiteEl) {
          website = websiteEl.href;
        }

        // Parse detail text lines (div.W4Efsd)
        const detailLines = Array.from(card.querySelectorAll('.W4Efsd, .fontBodyMedium'));
        detailLines.forEach(line => {
          const text = line.innerText || '';
          
          // Phone regex matcher: e.g. +1 123-456-7890, (123) 456-7890, 123-456-7890
          const phoneMatch = text.match(/(\+?\d{1,4}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
          if (phoneMatch && !phone) {
            phone = phoneMatch[0];
          }

          // Category identification
          if (!category && text.includes('·')) {
            const parts = text.split('·');
            if (parts.length > 0 && parts[0].trim().length < 30) {
              category = parts[0].trim();
            }
          }

          // Address heuristic
          if (!address && (/\d+\s+[A-Za-z0-9\s,.]+/.test(text) || text.includes(',') || text.match(/[A-Z]{2}\s+\d{5}/))) {
            if (!text.includes('★') && !phoneMatch) {
              address = text.replace(/·/g, ' ').trim();
            }
          }
        });

        // STRICT FILTER: If requireContact is enabled and lead has NO Phone AND NO Website (so zero chance of email), skip it!
        if (requireContact && !phone && !website) {
          return;
        }

        // Deduplication hash creation
        const normName = name.toLowerCase().replace(/\s+/g, ' ');
        const normPhone = phone.replace(/[^\d]/g, '');
        const hash = normPhone ? `phone:${normPhone}` : `name:${normName}_${(address || '').slice(0, 20)}`;

        if (!collectedHashes.has(hash)) {
          collectedHashes.add(hash);
          leads.push({
            name,
            phone,
            address,
            website,
            rating,
            reviews,
            category: category || categoryFilter,
            placeUrl,
            hash,
            emails: [],
            scrapedAt: Date.now()
          });
        }
      } catch (err) {
        console.warn('[BizScrape Pro] Error parsing place card:', err);
      }
    });

    return leads;
  }

  /**
   * Find the Google Maps sidebar scrollable feed element
   */
  function getFeedElement() {
    return document.querySelector('div[role="feed"]') || 
           document.querySelector('div.m6QEuf[aria-label]') || 
           document.querySelector('.ecZr0f');
  }

  /**
   * Perform smooth scroll action to trigger Google Maps lazy loading
   */
  function scrollFeed() {
    if (!isScrapingActive) return;

    const feed = getFeedElement();
    const newLeads = extractLeadsFromDOM();

    if (newLeads.length > 0) {
      console.log(`[BizScrape Pro] Extracted ${newLeads.length} valid contact leads. Total session: ${collectedHashes.size}`);
      chrome.runtime.sendMessage({
        action: 'LEADS_FOUND',
        leads: newLeads,
        totalCollected: collectedHashes.size
      });
      noNewDataCount = 0;
    } else {
      noNewDataCount++;
    }

    // Scroll down the sidebar feed container
    if (feed) {
      feed.scrollTop += 800;
    } else {
      window.scrollBy(0, 800);
    }

    // Check for end of list or target goal
    const endText = document.querySelector('.H2feWe, .fontBodyMedium');
    const isAtEnd = endText && endText.innerText && endText.innerText.includes("reached the end of the list");

    if (isAtEnd || noNewDataCount > 15 || collectedHashes.size >= targetGoal) {
      console.log('[BizScrape Pro] Finished or reached limit/end of results.');
      stopScraping('COMPLETED');
    }
  }

  /**
   * Start auto-scroll scraper loop
   */
  function startScraping(goal, category, requireContactParam = true) {
    if (isScrapingActive) return;

    isScrapingActive = true;
    targetGoal = goal || 100;
    categoryFilter = category || '';
    requireContact = requireContactParam !== false;
    noNewDataCount = 0;

    console.log(`[BizScrape Pro] Starting scraper loop. Target goal: ${targetGoal}, RequireContact: ${requireContact}`);

    scrollFeed();
    scrollIntervalId = setInterval(scrollFeed, 1200);
  }

  /**
   * Pause scraper loop
   */
  function pauseScraping() {
    isScrapingActive = false;
    if (scrollIntervalId) {
      clearInterval(scrollIntervalId);
      scrollIntervalId = null;
    }
    console.log('[BizScrape Pro] Scraping paused.');
  }

  /**
   * Stop scraper loop
   */
  function stopScraping(reason = 'STOPPED') {
    pauseScraping();
    chrome.runtime.sendMessage({
      action: 'SCRAPING_FINISHED',
      reason,
      totalCollected: collectedHashes.size
    });
  }

  /**
   * Message listener from Extension Popup or Background Worker
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'START_SCRAPING':
        collectedHashes.clear();
        startScraping(message.targetGoal, message.category, message.requireContactInfo);
        sendResponse({ success: true, status: 'RUNNING' });
        break;

      case 'PAUSE_SCRAPING':
        pauseScraping();
        sendResponse({ success: true, status: 'PAUSED' });
        break;

      case 'RESUME_SCRAPING':
        startScraping(message.targetGoal, message.category, message.requireContactInfo);
        sendResponse({ success: true, status: 'RUNNING' });
        break;

      case 'STOP_SCRAPING':
        stopScraping('USER_STOPPED');
        sendResponse({ success: true, status: 'STOPPED' });
        break;

      case 'GET_STATUS':
        sendResponse({
          isActive: isScrapingActive,
          collectedCount: collectedHashes.size,
          targetGoal
        });
        break;

      default:
        break;
    }
    return true;
  });

})();
