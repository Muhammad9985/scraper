<div align="center">

# 🚀 BizScrape Pro
### Fast Business Lead Finder & Deep Email Scraper (Chrome Extension)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![MR Software](https://img.shields.io/badge/Author-MR%20Software-06b6d4?style=for-the-badge&logo=codeforces&logoColor=white)](https://mr-software.online/)
[![License](https://img.shields.io/badge/License-Copyright%20MR%20Software-10b981?style=for-the-badge)](https://mr-software.online/)

<p align="center">
  <b>A lightweight, high-performance Chrome Extension for automated Google Maps business lead extraction, deep website email crawling, contact filtering, and 1-click Excel CSV export.</b>
</p>

[🌐 Official Website](https://mr-software.online/) • [📖 User Guide](#-installation-guide) • [👨‍💻 Developer Profile](#-developer--author) • [🐛 Report Bug](https://github.com/Muhammad9985/scraper/issues)

---

</div>

## 📌 Architecture Overview

```text
 ┌────────────────────────────────────────────────────────┐
 │            Extension Popup & Full Dashboard            │
 │   - Search Setup (Category, Location, Target Goal)     │
 │   - Real-time Event-Driven Auto-Reload Table (SN#)    │
 │   - CSV (Excel UTF-8 BOM) & JSON Export Controls       │
 └──────────────────────────┬─────────────────────────────┘
                            │ Chrome Storage & Event Messaging
 ┌──────────────────────────▼─────────────────────────────┐
 │               Background Service Worker                │
 │   - Session Controller (Start / Pause / Resume / Stop) │
 │   - Lead Fingerprint Deduplication (Phone / Web / Hash)│
 │   - Concurrent Website Deep Email Crawler               │
 └──────────────────────────┬─────────────────────────────┘
                            │ Automation Engine
 ┌──────────────────────────▼─────────────────────────────┐
 │                Google Maps Content Script              │
 │   - Infinite Auto-Scroll Sidebar Results Generator    │
 │   - Extracts Name, Address, Phone, Website, Ratings    │
 │   - Filters out records missing Phone & Email          │
 └────────────────────────────────────────────────────────┘
```

---

## ✨ Features at a Glance

| Feature | Description |
| :--- | :--- |
| **🔍 Automated Scraping** | Automatically opens Google Maps for `{Category} in {Location}` and auto-scrolls results up to your target lead goal. |
| **✉️ Deep Email Finder** | Concurrently fetches business homepages and `/contact` or `/about` subpages to discover hidden emails. |
| **🛡️ Strict Contact Filter** | Automatically skips businesses missing both Phone and Email so your database stays 100% actionable. |
| **🔢 Real-time Dashboard** | Event-driven instant auto-reloading dashboard table with dynamic **`SN#`** (1...N) serial numbering. |
| **⚡ Smart Deduplication** | Fingerprint hash algorithm (`Phone`, `Website`, or `Name + Address`) prevents duplicate records. |
| **📊 1-Click Data Export** | Export directly to **Excel CSV (with UTF-8 BOM)**, **JSON**, or copy all emails to clipboard. |
| **📖 Built-in User Manual** | Includes an interactive visual guide page (`guide.html`) accessible right inside the extension. |

---

## ⚡ Quick Start Guide

### 1. Installation

1. Clone or download this repository to your computer:
   ```bash
   git clone https://github.com/Muhammad9985/scraper.git
   ```
2. Open **Google Chrome** and go to `chrome://extensions/`.
3. In the top-right corner, **turn ON Developer mode**.
4. Click **Load unpacked** in the top-left menu.
5. Select the **`Scraper`** folder (containing `manifest.json`).
6. Pin **BizScrape Pro** 🧩 to your browser toolbar!

---

### 2. How to Run a Business Lead Search

```text
┌────────────────────────────────────────────────────────┐
│  1. Open BizScrape Pro Popup                           │
│  2. Enter Business Category : e.g., "Dentists"        │
│  3. Enter Target Location  : e.g., "Miami, FL"        │
│  4. Set Target Goal Count  : e.g., 100                 │
│  5. Click 🚀 Start Lead Scraper                        │
└────────────────────────────────────────────────────────┘
```

The extension will open Google Maps, auto-scroll the results sidebar, crawl websites in the background for emails, and stream records directly into your **Lead Manager Dashboard**!

---

## 📁 Repository Structure

```text
Scraper/
├── 📄 manifest.json            # Manifest V3 extension setup & permissions
├── 🎨 styles.css               # Modern glassmorphism dark-mode UI design system
├── 🖥️ popup.html               # Extension popup interface
├── ⚙️ popup.js                 # Popup job controller & live state polling
├── 📊 dashboard.html           # Full-page real-time lead manager & data table
├── 📈 dashboard.js             # Event-driven real-time auto-reload & CSV/JSON export
├── 📖 guide.html               # Interactive visual user manual & setup instructions
├── 🖼️ icons/                   # High-res extension icons (16x16, 48x48, 128x128)
├── ⚙️ background/
│   └── service_worker.js    # Background coordinator & deep website email crawler
├── 🕵️ content_scripts/
│   └── gmaps_scraper.js     # Google Maps sidebar DOM extractor & auto-scroller
└── 🛠️ lib/
    ├── storage.js           # Chrome storage local database manager
    └── utils.js             # Email regex parser, deduplication, & CSV formatting
```

---

## 👨‍💻 Developer & Author

<div align="center">

### Developed with ❤️ by **MR Software**

<a href="https://mr-software.online/">
  <img src="https://img.shields.io/badge/Website-mr--software.online-06b6d4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="MR Software Website" />
</a>
<a href="https://github.com/Muhammad9985">
  <img src="https://img.shields.io/badge/GitHub-@Muhammad9985-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Profile" />
</a>
<a href="https://www.linkedin.com/in/muhammad-rafique-944b05159/">
  <img src="https://img.shields.io/badge/LinkedIn-Muhammad%20Rafique-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Profile" />
</a>

</div>

- 🌐 **Official Website**: [https://mr-software.online/](https://mr-software.online/)
- 🐙 **GitHub**: [@Muhammad9985](https://github.com/Muhammad9985)
- 💼 **LinkedIn**: [Muhammad Rafique](https://www.linkedin.com/in/muhammad-rafique-944b05159/)
- 📦 **Git Repository**: [https://github.com/Muhammad9985/scraper.git](https://github.com/Muhammad9985/scraper.git)

---

## ⚖️ License & Copyright

Copyright © **MR Software** ([mr-software.online](https://mr-software.online/)). All rights reserved.
