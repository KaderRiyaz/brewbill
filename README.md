# BrewBill — Coffee Shop Billing App

BrewBill is an offline-first billing, product-catalog and income/expense tracker built for a
single coffee shop counter. It is a **Progressive Web App (PWA)**: one HTML/CSS/JavaScript
codebase that installs like a native app on **Windows desktop, Android and iOS**, and keeps
working with no internet connection because all data is stored locally in the browser's
IndexedDB database.

## Why a PWA (and not separate native apps)

A single web codebase, wrapped three ways, is the most practical way to hit "one project, all
platforms" without maintaining three separate apps:

| Target | How this codebase gets there |
|---|---|
| Windows desktop | Installed directly as a PWA from Edge/Chrome (no build step), **or** packaged as a proper `.exe`/installer with Electron |
| Android | Installed directly as a PWA from Chrome, **or** packaged as a signed `.apk`/`.aab` with a Trusted Web Activity (via [PWABuilder](https://www.pwabuilder.com)) or Capacitor |
| iOS | Installed via Safari's "Add to Home Screen" (Apple does not allow third-party browsers to install PWAs, and a native App Store build needs Capacitor + Xcode + an Apple Developer account) |

See `docs/BUILD_DEPLOY.md` for exact, step-by-step instructions for each path.

## Project structure

```
brewbill/
├── index.html              # App shell — all four screens live here, tab-switched with JS
├── manifest.json           # PWA manifest (name, icons, colors, install behaviour)
├── service-worker.js       # Caches the app shell so it works with zero connectivity
├── css/
│   └── styles.css          # All styling (desktop sidebar layout + mobile bottom-tab layout)
├── js/
│   ├── db.js                # IndexedDB wrapper — all reads/writes go through this
│   ├── products.js          # Product Management module (CRUD, variants, search/filter)
│   ├── billing.js           # Billing & Calculation module (order state, totals, checkout)
│   ├── finance.js           # Income & Expense Tracking module (entries, date-range reports)
│   ├── export.js            # Backup/export/import (JSON + CSV)
│   └── app.js                # Controller — wires the modules above to the UI and events
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── docs/
    ├── BUILD_DEPLOY.md      # Windows + Android + iOS packaging instructions
    ├── DATABASE_SCHEMA.md   # IndexedDB store/record structure
    └── USER_MANUAL.md       # How to use each of the three modules day to day
```

## Quick start (try it locally in under a minute)

Browsers block service workers and some storage APIs on `file://` pages, so serve the folder
over local HTTP rather than double-clicking `index.html`:

```bash
cd brewbill
python3 -m http.server 8080
# or: npx serve .
```

Open `http://localhost:8080` in Chrome or Edge. The app seeds a handful of demo products the
first time it runs (Espresso, Cappuccino, Cold Brew, a croissant, a muffin, and chips) so you
can try billing immediately — edit or delete them from the **Products** tab whenever you're
ready to add your own menu.

## What's included out of the box

- **Product Management** — add/edit/delete products with category, description, and multiple
  priced size/variants (e.g. Small/Medium/Large); live search and category filter.
- **Billing** — tap-to-add product grid, quantity steppers, percentage or fixed discount,
  configurable tax rate, live running total, printable receipt, one-tap clear/reset.
- **Income & Expense Tracking** — every completed sale is logged as income automatically;
  manual income or expense entries with categories (raw materials, rent, utilities, salaries,
  maintenance, or your own); day/week/month reports with income, expenses and net profit.
- **Data Management** — everything persists locally in IndexedDB between sessions; one-tap
  full JSON backup and CSV exports (products, orders, transactions) from **Settings**; JSON
  restore/import.
- **Offline & installable** — a service worker caches the whole app shell, and the manifest
  makes it installable on desktop and mobile home screens.

## Notes and honest limitations

- **This delivers working, install-ready source — not signed installers.** Producing a
  code-signed Windows `.exe`/MSIX or a Play Store `.apk`/`.aab` requires your own signing
  certificates/keystore and developer accounts, which only you can generate. `docs/BUILD_DEPLOY.md`
  gives the exact commands; you'll run the final packaging step yourself.
- **Single-device data.** IndexedDB is local to one browser/device. There is no cloud sync — use
  the JSON export regularly (Settings → Backup & export) as your backup, and import it on
  another device if you switch machines.
- **iOS PWAs have some Apple-imposed restrictions** (e.g. storage can be cleared if the app
  isn't opened for a long time, and installation must happen through Safari specifically). If
  you need guaranteed iOS persistence and an App Store listing, use the Capacitor path in
  `docs/BUILD_DEPLOY.md` to get proper native storage.
