# Build & Deployment Guide

BrewBill is a single web codebase (`index.html` + `css/` + `js/`). There are two ways to get it
onto a device: **install it directly as a PWA** (fastest, no build tools, works today), or
**package it into a native installer/app package** (more setup, gives you a standalone `.exe`
or `.apk`/`.aab` to distribute). Pick whichever fits — both use the exact same source folder.

---

## Path A — Install directly as a PWA (no build step)

This is the fastest route and is genuinely "installable and fully functional" per the brief —
it just needs the app to be served over HTTP(S) rather than opened from disk, because browsers
disable service workers and some storage on `file://` pages.

### 0. Host the folder somewhere reachable

Any of these work:
- **On the same machine/network**, for testing: `python3 -m http.server 8080` (or `npx serve .`)
  from inside the `brewbill/` folder, then browse to `http://<your-computer's-IP>:8080` from
  other devices on the same Wi-Fi.
- **For real deployment**: upload the whole `brewbill/` folder to any static host — GitHub
  Pages, Netlify, Vercel, Cloudflare Pages, or a folder on your own web server. No backend or
  database server is required; it's all static files.

> HTTPS is required for installability everywhere except `localhost`. Every host listed above
> gives you HTTPS automatically.

### 1. Install on Windows desktop

1. Open the site in **Microsoft Edge** or **Google Chrome**.
2. Click the **install icon** in the address bar (a small monitor-with-arrow icon), or open the
   browser menu → **Apps** → **Install this site as an app**.
3. BrewBill now opens in its own window from the Start menu, with no browser chrome, and works
   offline after the first load.

### 2. Install on Android

1. Open the site in **Chrome**.
2. Tap the **⋮** menu → **Add to Home screen** / **Install app** (Chrome may also show an
   automatic "Add BrewBill to Home screen" banner).
3. It installs like a native app, with its own icon and no browser bar.

### 3. Install on iOS

1. Open the site in **Safari** (must be Safari — other iOS browsers can't install PWAs).
2. Tap the **Share** button → **Add to Home Screen**.
3. It launches full-screen from the home screen icon like a native app.

This path has no code signing, no app store review, and updates instantly the next time each
device reconnects and reloads — a good fit for a single shop's own till.

---

## Path B — Windows installer (.exe) with Electron

Use this if you want a traditional double-click installer instead of a browser-based install.

```bash
# From a folder next to (not inside) brewbill/
mkdir brewbill-desktop && cd brewbill-desktop
npm init -y
npm install --save-dev electron electron-builder
cp -r ../brewbill ./app
```

Create `main.js`:

```js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "app/icons/icon-512.png"),
    webPreferences: { contextIsolation: true },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "app/index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
```

Add to `package.json`:

```json
{
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dist": "electron-builder --win"
  },
  "build": {
    "appId": "com.yourshop.brewbill",
    "productName": "BrewBill",
    "files": ["main.js", "app/**/*"],
    "win": { "target": "nsis", "icon": "app/icons/icon-512.png" }
  }
}
```

Then:

```bash
npm run start     # test it opens correctly
npm run dist       # produces dist/BrewBill Setup <version>.exe
```

The generated `.exe` in `dist/` is a standard Windows installer — double-click to install, and
it adds a Start Menu entry and desktop shortcut. IndexedDB data is stored per-installation in
Electron's local user-data folder, fully offline, exactly as in the browser version.

---

## Path C — Android package (.apk / .aab)

### Option 1: PWABuilder (no native code to write)

1. Deploy the app to a public HTTPS URL first (see Path A, step 0).
2. Go to [pwabuilder.com](https://www.pwabuilder.com), enter your URL, and let it analyze the
   manifest and service worker (both are already included in this project).
3. Choose **Android** → download the generated package. PWABuilder wraps the site in a
   **Trusted Web Activity**, which behaves like a native app backed by Chrome.
4. Sign the generated `.aab`/`.apk` with your own keystore (PWABuilder's flow includes this
   step) before uploading to the Play Store, or sideload the signed `.apk` directly onto a
   till's Android tablet for internal use without the Play Store at all.

### Option 2: Capacitor (if you want native plugins or App Store distribution later)

```bash
mkdir brewbill-mobile && cd brewbill-mobile
npm init -y
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npx cap init BrewBill com.yourshop.brewbill --web-dir=www
cp -r ../brewbill/* ./www/
npx cap add android
npx cap sync
npx cap open android
```

This opens the project in **Android Studio**. From there: `Build → Generate Signed Bundle / APK`,
create/select a keystore, and build. The output `.apk`/`.aab` is a standard native Android
package ready to sideload or publish.

---

## Path D — iOS (App Store, via Capacitor)

Apple requires a native wrapper for App Store distribution; Path A's "Add to Home Screen" is
the zero-setup option for internal shop use, and remains fully functional.

```bash
# From the same brewbill-mobile/ folder created in Path C:
npm install @capacitor/ios
npx cap add ios
npx cap sync
npx cap open ios
```

Requires a Mac with **Xcode** installed and an **Apple Developer account** ($99/yr) to sign and
submit. In Xcode: set your Team under Signing & Capabilities, then `Product → Archive` to build
a submittable `.ipa`.

---

## What stays the same across every path

Every option above ships the identical `brewbill/` source — the product catalog, billing logic,
finance tracking, and IndexedDB storage behave the same whether the app is opened in a browser
tab, an installed PWA, an Electron window, or a wrapped native app. Data never leaves the
device in any configuration; back it up via **Settings → Export full backup (JSON)** regardless
of which platform you're on.
