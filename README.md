# AHG Document Creation Tool

Internal document generation tool for the Law Office of Andrew H. Griffin, III, APC.

---

## What It Does

Generates filled PDF documents from templates using client-provided information. Supports:

- Ch. 7 Retainer (standard + business + Spanish)
- Ch. 11 Retainer
- Ch. 13 Retainer (Central Consumer, Southern Consumer, Southern Business)
- Ch. 13 Fee Estimate
- BK Fee Estimate
- Civil Retainers (Hourly Litigation, Hourly Non-Litigation, Flat Fee, Contingency)
- Family Law Retainer
- Unlawful Detainer Retainer
- Probate Retainer

Generated PDFs are automatically saved to the client's folder on the NAS (`/Volumes/Public/Client Folders A-Z` on Mac, `\\ReadyNAS\Public\Client Folders A-Z` on Windows), organized by last name (A–F, G–L, M–R, S–Z). If no client folder exists, one is created automatically.

---

## Installing on a New Mac (No Prior Setup Required)

1. Download `AHG-Document-Creation-Tool-1.0.0-arm64.dmg` from the [Releases](../../releases/latest) page
2. Open the `.dmg` and drag **AHG Document Creation Tool** into your Applications folder
3. Install **LibreOffice** (required for PDF conversion) — download free at [libreoffice.org](https://www.libreoffice.org/download/libreoffice/)
4. Launch the app from Applications or Spotlight

That's it — no other dependencies needed.

> **First launch on Mac:** macOS may block the app since it's unsigned. If that happens, go to **System Settings → Privacy & Security** and click **Open Anyway**.

---

## Auto-Updates

The app checks for updates automatically on each launch. When a new version is available it will download in the background and prompt you to restart.

---

## Default Save Folder

If the NAS isn't connected, the app falls back to a default folder you can configure. Click **Set Default Folder** in the top-right corner of the app to choose it.

---

## Building & Publishing (Developers)

### Requirements

- macOS with Homebrew
- Node.js (installed by setup.sh if missing)
- LibreOffice (installed by setup.sh if missing)
- GitHub CLI authenticated (`gh auth login`)

### First-time setup

```bash
git clone https://github.com/kkakkary/ahg-retainer-tool.git
cd ahg-retainer-tool
bash setup.sh
```

### Run in development

```bash
npm start
```

### Publish a new release

1. Bump the version in `package.json` (e.g. `1.0.0` → `1.1.0`)
2. Run:
   ```bash
   GH_TOKEN=$(gh auth token) npm run publish
   ```

This builds the app, creates a GitHub Release, and uploads the DMG. Installed copies will auto-update on next launch.

---

## Project Structure

```
ahg-retainer-tool/
├── assets/                  # .docx templates and app icon
├── electron/
│   ├── main.js              # Main process — document generation, IPC, auto-update
│   └── preload.js           # Context bridge
├── scripts/
│   └── rename-electron.js   # Renames Electron binary + replaces icon for dev
├── src/
│   ├── App.jsx              # Tab layout + default folder UI
│   ├── assets/              # Logo for UI header
│   └── components/          # One component per form type
└── public/
    └── index.html
```
