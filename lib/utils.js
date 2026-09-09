/**
 * BizScrape Pro - Utility Functions
 * Uses var and window guard to prevent re-declaration errors during content script re-injection.
 */

var Utils = (typeof window !== 'undefined' && window.Utils) ? window.Utils : {
  /**
   * Extract unique email addresses from raw text HTML/content
   */
  extractEmails(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Regular expression for email matching (handles mailto and common email patterns)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const matches = text.match(emailRegex) || [];
    
    // Filter out common false positives (image extensions, generic web strings)
    const filtered = matches.filter(email => {
      const lower = email.toLowerCase();
      return !lower.endsWith('.png') && 
             !lower.endsWith('.jpg') && 
             !lower.endsWith('.jpeg') && 
             !lower.endsWith('.gif') && 
             !lower.endsWith('.svg') &&
             !lower.endsWith('.webp') &&
             !lower.includes('example.com') &&
             !lower.includes('sentry.io') &&
             !lower.includes('domain.com');
    });

    return [...new Set(filtered.map(e => e.toLowerCase()))];
  },

  /**
   * Normalize phone numbers for uniform comparison
   */
  normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  },

  /**
   * Clean and normalize text string
   */
  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  },

  /**
   * Generate a unique fingerprint hash for deduplication
   */
  generateLeadHash(lead) {
    const name = this.cleanText(lead.name).toLowerCase();
    const address = this.cleanText(lead.address).toLowerCase();
    const phone = this.normalizePhone(lead.phone);
    const website = this.cleanText(lead.website).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

    if (phone) return `phone:${phone}`;
    if (website) return `web:${website}`;
    return `name_addr:${name}_${address.slice(0, 30)}`;
  },

  /**
   * Format lead data as a CSV string with BOM for Excel UTF-8 compatibility
   */
  exportToCSV(leads) {
    if (!leads || !leads.length) return '';

    const headers = [
      'SN#',
      'Business Name',
      'Phone Number',
      'Email Address',
      'Address',
      'Website',
      'Rating',
      'Review Count',
      'Category',
      'Google Maps URL',
      'Scraped At'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map((lead, index) => [
      index + 1,
      escapeCSV(lead.name || ''),
      escapeCSV(lead.phone || ''),
      escapeCSV(Array.isArray(lead.emails) ? lead.emails.join('; ') : (lead.email || '')),
      escapeCSV(lead.address || ''),
      escapeCSV(lead.website || ''),
      escapeCSV(lead.rating || ''),
      escapeCSV(lead.reviews || ''),
      escapeCSV(lead.category || ''),
      escapeCSV(lead.placeUrl || ''),
      escapeCSV(lead.scrapedAt ? new Date(lead.scrapedAt).toLocaleString() : '')
    ].join(','));

    // UTF-8 BOM header
    return '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  },

  /**
   * Format lead data as JSON
   */
  exportToJSON(leads) {
    return JSON.stringify(leads, null, 2);
  },

  /**
   * Format duration in seconds to mm:ss
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

if (typeof window !== 'undefined') {
  window.Utils = Utils;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
