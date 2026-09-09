/**
 * BizScrape Pro - Dashboard UI Controller
 * Features real-time auto-reload via chrome.storage.onChanged event listeners & fallback polling.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let allLeads = [];
  let filteredLeads = [];
  const selectedHashes = new Set();

  // DOM elements
  const leadsTableBody = document.getElementById('leadsTableBody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');

  const metricTotalLeads = document.getElementById('metricTotalLeads');
  const metricPhoneCount = document.getElementById('metricPhoneCount');
  const metricEmailCount = document.getElementById('metricEmailCount');
  const metricEmailRate = document.getElementById('metricEmailRate');

  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const copyEmailsBtn = document.getElementById('copyEmailsBtn');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

  // Initial load
  await loadLeads();

  // REAL-TIME INSTANT AUTO-RELOAD LISTENER: Listens for background lead updates in storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && (changes.bizscrape_leads || changes.bizscrape_session_state)) {
        loadLeads();
      }
    });
  }

  // Fallback timer: Check every 2 seconds to ensure real-time synchronization
  setInterval(loadLeads, 2000);

  /**
   * Load leads from Chrome Storage & Render
   */
  async function loadLeads() {
    allLeads = await StorageManager.getLeads();
    applyFilter();
    updateMetrics();
  }

  /**
   * Filter leads based on search query
   */
  function applyFilter() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      filteredLeads = [...allLeads];
    } else {
      filteredLeads = allLeads.filter(lead => {
        const name = (lead.name || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const address = (lead.address || '').toLowerCase();
        const category = (lead.category || '').toLowerCase();
        const website = (lead.website || '').toLowerCase();
        const emailsStr = (Array.isArray(lead.emails) ? lead.emails.join(' ') : (lead.email || '')).toLowerCase();

        return name.includes(query) ||
               phone.includes(query) ||
               address.includes(query) ||
               category.includes(query) ||
               website.includes(query) ||
               emailsStr.includes(query);
      });
    }

    renderTable();
  }

  /**
   * Calculate and update top metrics
   */
  function updateMetrics() {
    const total = allLeads.length;
    const phoneCount = allLeads.filter(l => l.phone).length;
    const emailCount = allLeads.filter(l => (Array.isArray(l.emails) && l.emails.length > 0) || l.email).length;
    const rate = total > 0 ? Math.round((emailCount / total) * 100) : 0;

    metricTotalLeads.textContent = total;
    metricPhoneCount.textContent = phoneCount;
    metricEmailCount.textContent = emailCount;
    metricEmailRate.textContent = `${rate}%`;
  }

  /**
   * Render data table rows with SN# column
   */
  function renderTable() {
    leadsTableBody.innerHTML = '';

    if (filteredLeads.length === 0) {
      emptyState.style.display = 'block';
      return;
    } else {
      emptyState.style.display = 'none';
    }

    filteredLeads.forEach((lead, index) => {
      const tr = document.createElement('tr');
      const hash = lead.hash;

      // Extract emails
      const emailList = Array.isArray(lead.emails) ? lead.emails : (lead.email ? [lead.email] : []);
      const emailHtml = emailList.length > 0 
        ? emailList.map(e => `<span class="email-tag"><a href="mailto:${e}" style="color: inherit; text-decoration: none;">✉ ${e}</a></span>`).join(' ')
        : '<span style="color: var(--text-dim);">N/A</span>';

      const phoneHtml = lead.phone 
        ? `<span class="phone-tag"><a href="tel:${lead.phone}" style="color: inherit; text-decoration: none;">📞 ${lead.phone}</a></span>`
        : '<span style="color: var(--text-dim);">N/A</span>';

      const websiteHtml = lead.website 
        ? `<a href="${lead.website}" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">🔗 ${new URL(lead.website).hostname.replace('www.', '')}</a>`
        : '<span style="color: var(--text-dim);">N/A</span>';

      const ratingHtml = lead.rating 
        ? `⭐ ${lead.rating} <span style="color: var(--text-dim); font-size: 11px;">(${lead.reviews || 0})</span>`
        : '<span style="color: var(--text-dim);">N/A</span>';

      const isChecked = selectedHashes.has(hash);

      tr.innerHTML = `
        <td><input type="checkbox" class="row-checkbox" data-hash="${hash}" ${isChecked ? 'checked' : ''}></td>
        <td style="font-weight: 600; color: var(--text-dim); text-align: center;">${index + 1}</td>
        <td>
          <div style="font-weight: 600; color: white;">${escapeHtml(lead.name || 'Unnamed Business')}</div>
          <div style="font-size: 11px; color: var(--text-dim);">${escapeHtml(lead.category || '')}</div>
        </td>
        <td>${phoneHtml}</td>
        <td>${emailHtml}</td>
        <td><span title="${escapeHtml(lead.address || '')}">${escapeHtml(lead.address || 'N/A')}</span></td>
        <td>${ratingHtml}</td>
        <td>${websiteHtml}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            ${lead.placeUrl ? `<a href="${lead.placeUrl}" target="_blank" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; width: auto;" title="View on Google Maps">🗺</a>` : ''}
            <button class="btn btn-danger delete-btn" data-hash="${hash}" style="padding: 4px 8px; font-size: 11px; width: auto;" title="Delete Lead">🗑</button>
          </div>
        </td>
      `;

      leadsTableBody.appendChild(tr);
    });

    // Attach event listeners for checkboxes & delete buttons
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const hash = e.target.getAttribute('data-hash');
        if (e.target.checked) {
          selectedHashes.add(hash);
        } else {
          selectedHashes.delete(hash);
        }
        updateBulkDeleteButton();
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const hash = e.target.getAttribute('data-hash');
        await StorageManager.deleteLead(hash);
        await loadLeads();
      });
    });
  }

  function updateBulkDeleteButton() {
    deleteSelectedBtn.style.display = selectedHashes.size > 0 ? 'inline-flex' : 'none';
    deleteSelectedBtn.textContent = `🗑 Delete Selected (${selectedHashes.size})`;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // Event Listeners
  searchInput.addEventListener('input', applyFilter);

  refreshBtn.addEventListener('click', loadLeads);

  selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    filteredLeads.forEach(l => {
      if (isChecked) selectedHashes.add(l.hash);
      else selectedHashes.delete(l.hash);
    });
    renderTable();
    updateBulkDeleteButton();
  });

  deleteSelectedBtn.addEventListener('click', async () => {
    if (confirm(`Delete ${selectedHashes.size} selected leads?`)) {
      for (const hash of selectedHashes) {
        await StorageManager.deleteLead(hash);
      }
      selectedHashes.clear();
      selectAllCheckbox.checked = false;
      await loadLeads();
      updateBulkDeleteButton();
    }
  });

  exportCsvBtn.addEventListener('click', () => {
    const dataToExport = selectedHashes.size > 0 
      ? allLeads.filter(l => selectedHashes.has(l.hash))
      : filteredLeads;

    if (dataToExport.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const csvStr = Utils.exportToCSV(dataToExport);
    downloadFile(csvStr, `bizscrape_leads_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  });

  exportJsonBtn.addEventListener('click', () => {
    const dataToExport = selectedHashes.size > 0 
      ? allLeads.filter(l => selectedHashes.has(l.hash))
      : filteredLeads;

    if (dataToExport.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const jsonStr = Utils.exportToJSON(dataToExport);
    downloadFile(jsonStr, `bizscrape_leads_${Date.now()}.json`, 'application/json;');
  });

  copyEmailsBtn.addEventListener('click', () => {
    const emailsSet = new Set();
    allLeads.forEach(l => {
      if (Array.isArray(l.emails)) {
        l.emails.forEach(e => emailsSet.add(e));
      } else if (l.email) {
        emailsSet.add(l.email);
      }
    });

    if (emailsSet.size === 0) {
      alert('No emails found in current lead database.');
      return;
    }

    const emailText = Array.from(emailsSet).join('\n');
    navigator.clipboard.writeText(emailText).then(() => {
      alert(`Copied ${emailsSet.size} unique email addresses to clipboard!`);
    });
  });

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
