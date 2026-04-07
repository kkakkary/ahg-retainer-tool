# AHG Document Creation Tool

Internal document generation tool for the Law Office of Andrew H. Griffin, III, APC.

---

## What It Does

Generates filled PDF documents from templates using client-provided information. Currently supports:

- **Ch. 7 Retainer Agreement** — fills client name, attorney fee, and discounted fee
- **BK Fee Estimate** — fills client name, total debt, and any applicable additional fees; calculates total

Generated PDFs are automatically saved to the client's folder on the NAS (`\\ReadyNAS\Public\Client Folders A-Z\`), organized by last name (A–F, G–L, M–R, S–Z).

---

## Requirements

Before installing or running the app, the target Windows machine must have:

1. **LibreOffice** — required for PDF conversion  
   Download free at: https://www.libreoffice.org/download/libreoffice/
2. **Access to `\\ReadyNAS\Public\Client Folders A-Z`** — for automatic save directory routing

---

## Installation (Windows)

1. Download `AHG Document Creation Tool Setup.exe` from the [Releases](../../releases) page
2. Run the installer — it installs per-user with no admin rights required
3. Launch **AHG Document Creation Tool** from the Start menu or Desktop

---

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A **Windows machine** (required to build the Windows installer)
- LibreOffice installed on the build machine

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/kkakkary/ahg-retainer-tool.git
cd ahg-retainer-tool

# 2. Install dependencies
npm install

# 3. Run in development mode
npm start

# 4. Build the Windows installer (run on Windows)
npm run build
```

The installer will be output to the `release/` folder as `AHG Document Creation Tool Setup.exe`.

---

## Development

```bash
npm start   # starts webpack dev server + Electron in development mode
npm run dev # same as start
npm run build # production build (Windows installer)
```

### Project Structure

```
ahg-retainer-tool/
├── assets/               # Document templates (.docx) and logo
│   ├── ch7_retainer.docx
│   └── bk_estimate.docx
├── electron/
│   ├── main.js           # Electron main process — document generation & IPC
│   └── preload.js        # Context bridge
├── src/
│   ├── App.jsx           # Tab layout
│   ├── assets/           # Logo for UI
│   └── components/
│       ├── Ch7RetainerForm.jsx
│       └── BkEstimateForm.jsx
└── public/
    └── index.html
```

### Adding a New Template

1. Create the `.docx` template in LibreOffice using `{{FieldName}}` placeholders
2. Save it to `assets/`
3. Add a new form component in `src/components/`
4. Add a tab entry in `src/App.jsx`
5. Add a case in `electron/main.js` under the `generate-document` IPC handler
6. Add the filename prefix → label mapping in the `FORM_LABELS` object in `main.js`

---

## Notes

- Templates must be created or saved in **LibreOffice Writer** (not Microsoft Word) to avoid XML split-run issues with placeholders
- The BK Fee Estimate uses `{#fee_rows}` / `{/fee_rows}` loop syntax in the second section to only render filled fees
- PDF conversion is handled by LibreOffice running headlessly in the background
