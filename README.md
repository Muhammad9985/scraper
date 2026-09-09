# BizScrape Pro - Fast Business Lead Finder & Email Scraper 🚀

**BizScrape Pro** is a lightweight, high-performance **Manifest V3 Chrome Extension** designed for automated business lead generation, contact data scraping, and deep website email extraction directly from Google Maps search results.

Developed by **MR Software** ([mr-software.online](https://mr-software.online/)).

---

## 🌟 Key Features

- **🚀 Automated Search & Scraper**: Enter any Business Category and Target Location (e.g., `Dentists in Miami, FL`), and the bot will open Google Maps, auto-scroll through sidebar results, and collect business details in real time.
- **✉️ Deep Website Email Extractor**: Automatically crawls discovered business websites in the background to extract verified email addresses from homepages and contact pages (`/contact`, `/about-us`, `mailto:` links).
- **🛡️ Strict Contact Info Filter**: Automatically skips or discards businesses missing both phone numbers and email addresses, ensuring your database contains actionable leads.
- **🔢 Real-time Numbered Dashboard (`SN#`)**: Event-driven real-time auto-reloading dashboard (`dashboard.html`) showing live leads count, phone coverage, discovered emails, and 1...N serial numbering.
- **⚡ Smart Deduplication**: Prevents duplicate entries using fingerprint hashing (Phone / Website / Name + Address).
- **📥 One-Click Export**: Export collected leads to **Excel-ready CSV (UTF-8 BOM)** or **JSON**, or copy all email addresses to your clipboard with 1 click.
- **📖 Built-in Setup Guide**: Includes an interactive in-extension user guide (`guide.html`) with visual step-by-step setup instructions.

---

## 🛠️ Installation Guide

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Muhammad9985/scraper.git
   ```
2. Open **Google Chrome** and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left menu.
5. Select the **`Scraper`** project folder (containing `manifest.json`).
6. Pin **BizScrape Pro** to your Chrome toolbar!

---

## 📖 How to Use

1. Click the **BizScrape Pro** icon in your Chrome toolbar.
2. Enter your search criteria:
   - **Business Type / Category**: e.g., `Dentists`, `Plumbers`, `Real Estate`
   - **Target Location**: e.g., `Miami, FL`, `New York, NY`, `London, UK`
   - **Target Goal**: e.g., `100` leads
   - Check **Extract emails from business websites** and **Skip leads missing Phone & Email**.
3. Click **🚀 Start Lead Scraper**.
4. Click **📊 Open Leads Manager Dashboard** to view your leads streaming in real time, filter by keyword, and click **📥 Export CSV (Excel)**.

---

## 📁 Repository & File Structure

```text
Scraper/
├── manifest.json            # Manifest V3 extension configuration
├── popup.html               # Popup control interface
├── popup.js                 # Popup state controller
├── dashboard.html           # Full-page real-time lead manager & data table
├── dashboard.js             # Real-time event listener & export logic
├── guide.html               # In-extension user guide & manual
├── styles.css               # Modern dark-mode glassmorphic design system
├── icons/                   # Extension icons (16x16, 48x48, 128x128)
├── background/
│   └── service_worker.js    # Service worker, session manager, email crawler
├── content_scripts/
│   └── gmaps_scraper.js     # Google Maps auto-scroll DOM extractor
└── lib/
    ├── storage.js           # Chrome storage manager
    └── utils.js             # Email regex parser, deduplication, CSV/JSON exporters
```

---

## 👨‍💻 Developer & Author Details

Created and maintained by **Muhammad Rafique / MR Software**.

- 🌐 **Official Website**: [https://mr-software.online/](https://mr-software.online/)
- 🐙 **GitHub Profile**: [@Muhammad9985](https://github.com/Muhammad9985)
- 💼 **LinkedIn**: [Muhammad Rafique](https://www.linkedin.com/in/muhammad-rafique-944b05159/)
- 📦 **Git Repository**: [https://github.com/Muhammad9985/scraper.git](https://github.com/Muhammad9985/scraper.git)

---

## 📄 License & Copyright

Copyright © MR Software ([mr-software.online](https://mr-software.online/)). All rights reserved.
