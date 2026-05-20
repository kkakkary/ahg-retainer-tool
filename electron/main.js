const { app, BrowserWindow, ipcMain, dialog, nativeImage, shell, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, exec } = require('child_process');
const { autoUpdater } = require('electron-updater');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
libre.convertWithOptionsAsync = require('util').promisify(libre.convertWithOptions);
const { GoogleGenAI } = require('@google/genai');

// ── Allowed template whitelist (path-traversal prevention) ───────────────────

const ALLOWED_TEMPLATES = new Set([
  'biz_ch7_retainer.docx',
  'bk_estimate.docx',
  'ch11_retainer.docx',
  'ch13_central_consumer_retainer.docx',
  'ch13_estimate.docx',
  'ch13_south_business_retainer.docx',
  'ch13_south_consumer_retainer.docx',
  'ch7_blank_retainer.docx',
  'ch7_retainer.docx',
  'civil_contingency_retainer.docx',
  'civil_flat_fee_retainer.docx',
  'civil_hourly_lit_retainer.docx',
  'civil_hourly_nonlit_retainer.docx',
  'family_law_retainer.docx',
  'probate_retainer.docx',
  'spanish_ch7_retainer.docx',
  'template.docx',
  'ud_retainer.docx',
]);

// ── LibreOffice check & install ───────────────────────────────────────────────

const SOFFICE_PATHS = [
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/local/bin/soffice',
  '/opt/homebrew/bin/soffice',
  '/usr/bin/libreoffice',
  '/usr/bin/soffice',
  ...(process.platform === 'win32' ? [
    process.env.LIBRE_OFFICE_EXE,
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'LibreOffice/program/soffice.exe'),
    path.join(process.env.PROGRAMFILES || '', 'LibreOffice/program/soffice.exe'),
    'C:/Program Files/LibreOffice/program/soffice.exe',
    'D:/Program Files/LibreOffice/program/soffice.exe',
  ].filter(Boolean) : []),
];

function isLibreOfficeInstalled() {
  if (process.env.TEST_LIBREOFFICE_MISSING) return false; // test flag
  return SOFFICE_PATHS.some(p => fs.existsSync(p));
}

function installLibreOffice(win) {
  return new Promise((resolve) => {
    // Show progress in the window title
    win.setTitle('Installing LibreOffice…');

    // Try Homebrew first, fall back to direct download via curl + hdiutil
    const brewPath = fs.existsSync('/opt/homebrew/bin/brew')
      ? '/opt/homebrew/bin/brew'
      : fs.existsSync('/usr/local/bin/brew')
        ? '/usr/local/bin/brew'
        : null;

    if (brewPath) {
      exec(`${brewPath} install --cask libreoffice`, (err) => {
        win.setTitle('AHG Document Creation Tool');
        resolve(!err);
      });
    } else {
      // Direct download via shell — curl downloads, hdiutil mounts, then we copy
      const script = `
        set -e
        DMG=$(mktemp /tmp/libreoffice_XXXXXX.dmg)
        curl -L "https://download.documentfoundation.org/libreoffice/stable/25.2.2/mac/aarch64/LibreOffice_25.2.2_MacOS_aarch64.dmg" -o "$DMG"
        MOUNT=$(hdiutil attach "$DMG" -nobrowse -noautoopen | tail -1 | awk '{print $NF}')
        cp -r "$MOUNT/LibreOffice.app" /Applications/
        hdiutil detach "$MOUNT" -quiet
        rm -f "$DMG"
      `;
      exec(script, (err) => {
        win.setTitle('AHG Document Creation Tool');
        resolve(!err);
      });
    }
  });
}

async function ensureLibreOffice(win) {
  if (isLibreOfficeInstalled()) return;

  const { response } = await dialog.showMessageBox(win, {
    type: 'info',
    title: 'LibreOffice Required',
    message: 'LibreOffice is needed to generate PDFs.',
    detail: 'It will be downloaded and installed automatically (~350 MB). This only happens once.',
    buttons: ['Install Now', 'Quit'],
    defaultId: 0,
  });

  if (response === 1) { app.quit(); return; }

  const ok = await installLibreOffice(win);

  if (!ok || !isLibreOfficeInstalled()) {
    await dialog.showMessageBox(win, {
      type: 'error',
      title: 'Installation Failed',
      message: 'Could not install LibreOffice automatically.',
      detail: 'Please download and install it manually from https://www.libreoffice.org, then relaunch the app.',
      buttons: ['OK'],
    });
  }
}

app.name = 'AHG Document Creation Tool';

// ── Persistent config ─────────────────────────────────────────────────────────

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
  } catch {
    return {};
  }
}

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('get-config', (_event, key) => {
  const config = readConfig();
  return config[key];
});

ipcMain.handle('set-config', (_event, key, value) => {
  const config = readConfig();
  config[key] = value;
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
});

ipcMain.handle('set-title', (_event, title) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.setTitle(title);
});

ipcMain.handle('show-in-folder', (_event, filePath) => {
  const allowedPrefixes = [
    app.getPath('downloads'),
    app.getPath('home'),
    '/Volumes/Public/Client Folders A-Z',
    '\\\\ReadyNAS\\Public\\Client Folders A-Z',
  ];
  const resolved = path.resolve(filePath);
  const isAllowed = allowedPrefixes.some(prefix => resolved.startsWith(prefix));
  if (!isAllowed) return;
  shell.showItemInFolder(resolved);
});

ipcMain.handle('open-file', async (_event, filePath) => {
  const allowedPrefixes = [
    app.getPath('downloads'),
    app.getPath('home'),
    '/Volumes/Public/Client Folders A-Z',
    '\\\\ReadyNAS\\Public\\Client Folders A-Z',
  ];
  const resolved = path.resolve(filePath);
  const isAllowed = allowedPrefixes.some(prefix => resolved.startsWith(prefix));
  if (!isAllowed) return;
  if (!fs.existsSync(resolved)) {
    dialog.showMessageBox({ type: 'warning', title: 'File Not Found', message: `This file has been moved or deleted:\n${resolved}` });
    return;
  }
  shell.openPath(resolved);
});

ipcMain.handle('get-history', () => {
  return (readConfig().history || []);
});

ipcMain.handle('clear-history', () => {
  const config = readConfig();
  config.history = [];
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
});

ipcMain.handle('show-open-dialog', (_event, options) => dialog.showOpenDialog(options));

ipcMain.handle('get-gemini-key', () => {
  const config = readConfig();
  if (!config.geminiKeyEncrypted) return '';
  try {
    return safeStorage.decryptString(Buffer.from(config.geminiKeyEncrypted, 'base64'));
  } catch {
    return '';
  }
});

ipcMain.handle('set-gemini-key', (_event, key) => {
  const config = readConfig();
  if (key) {
    config.geminiKeyEncrypted = safeStorage.encryptString(key).toString('base64');
  } else {
    delete config.geminiKeyEncrypted;
  }
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
});

ipcMain.handle('scan-credit-report', async (_event, filePath) => {
  const config = readConfig();
  if (!config.geminiKeyEncrypted) return { success: false, error: 'No Gemini API key configured. Add it in Settings.' };
  let apiKey;
  try {
    apiKey = safeStorage.decryptString(Buffer.from(config.geminiKeyEncrypted, 'base64'));
  } catch {
    return { success: false, error: 'Failed to decrypt API key.' };
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return { success: false, error: 'File not found.' };

  const fileBytes = fs.readFileSync(resolved);
  const base64 = fileBytes.toString('base64');
  const mimeType = resolved.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are extracting creditor data from a credit report for use in bankruptcy notification letters.

Return ONLY a JSON array (no markdown, no explanation) where each element has:
- "name": the creditor's full formal legal name — expand any abbreviations or codes to their complete name (e.g. "DEPTEDNELNET" → "Department of Education/Nelnet", "SYNCB" → "Synchrony Bank", "COMENITY" → "Comenity Bank", "JPMCB" → "JPMorgan Chase Bank", "AMEX" → "American Express", "BOA" → "Bank of America"). If you are unsure of the full name, use your best knowledge of common creditor names.
- "address1": street address line
- "address2": city, state and zip on one line
- "accounts": last 4 digits of the account number only (e.g. "1234")

Include every unique creditor account listed. If address info is missing for a creditor, use empty strings.
Example: [{"name":"Bank of America","address1":"PO Box 12345","address2":"Wilmington, DE 19801","accounts":"4532"}]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ]},
      ],
    });
    const text = (response.text ?? '').trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const raw = JSON.parse(text);

    // Consolidate duplicate creditor names — merge account numbers, keep first address
    const nameMap = new Map();
    const creditors = [];
    for (const c of raw) {
      const key = (c.name || '').trim().toLowerCase();
      if (nameMap.has(key)) {
        const existing = nameMap.get(key);
        if (c.accounts?.trim()) {
          existing.accounts = existing.accounts
            ? `${existing.accounts}, ${c.accounts.trim()}`
            : c.accounts.trim();
        }
      } else {
        const entry = { name: c.name || '', address1: c.address1 || '', address2: c.address2 || '', accounts: c.accounts?.trim() || '' };
        nameMap.set(key, entry);
        creditors.push(entry);
      }
    }

    return { success: true, creditors };
  } catch (err) {
    return { success: false, error: `Gemini error: ${err.message}` };
  }
});

ipcMain.handle('open-client-folder', (_event, { clientNames, isBusinessName }) => {
  const CLIENT_FOLDERS_BASE = process.platform === 'win32'
    ? '\\\\ReadyNAS\\Public\\Client Folders A-Z'
    : '/Volumes/Public/Client Folders A-Z';

  function getAlphaFolder(lastName) {
    const c = (lastName[0] || 'A').toUpperCase();
    if (c >= 'A' && c <= 'F') return 'A-F';
    if (c >= 'G' && c <= 'L') return 'G-L';
    if (c >= 'M' && c <= 'R') return 'M-R';
    return 'S-Z';
  }

  function formatClientName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return `${lastName}, ${firstName}`;
  }

  let safeName, alphaFolder;
  if (isBusinessName) {
    safeName = clientNames.replace(/[/\\:*?"<>|]/g, '');
    alphaFolder = getAlphaFolder(clientNames.trim());
  } else {
    const clients = clientNames.split(/\s+and\s+/i);
    const formatted = clients.map(formatClientName).join(' and ');
    safeName = formatted.replace(/[/\\:*?"<>|]/g, '');
    const primaryParts = clients[0].trim().split(/\s+/);
    alphaFolder = getAlphaFolder(primaryParts[primaryParts.length - 1]);
  }

  const alphaDir = path.join(CLIENT_FOLDERS_BASE, alphaFolder);
  if (!fs.existsSync(alphaDir)) {
    shell.openPath(fs.existsSync(CLIENT_FOLDERS_BASE) ? CLIENT_FOLDERS_BASE : app.getPath('home'));
    return;
  }

  const search = safeName.toLowerCase();
  const match = fs.readdirSync(alphaDir).find((entry) => {
    const full = path.join(alphaDir, entry);
    return fs.statSync(full).isDirectory() && entry.toLowerCase().startsWith(search);
  });

  shell.openPath(match ? path.join(alphaDir, match) : alphaDir);
});

// ── Number to words ───────────────────────────────────────────────────────────

function numberToWords(n) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (n === 0) return 'Zero';

  function belowThousand(num) {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + belowThousand(num % 100) : '');
  }

  const parts = [];
  if (n >= 1000000) { parts.push(belowThousand(Math.floor(n / 1000000)) + ' Million'); n %= 1000000; }
  if (n >= 1000)    { parts.push(belowThousand(Math.floor(n / 1000)) + ' Thousand'); n %= 1000; }
  if (n > 0)        { parts.push(belowThousand(n)); }
  return parts.join(' ');
}

function currencyToWords(str) {
  // Parse "$1,750.00" or "1750" → "One Thousand Seven Hundred Fifty Dollars"
  const num = parseFloat(String(str).replace(/[$,]/g, ''));
  if (isNaN(num)) return '';
  const dollars = Math.floor(num);
  const cents   = Math.round((num - dollars) * 100);
  let result = numberToWords(dollars) + ' Dollar' + (dollars !== 1 ? 's' : '');
  if (cents > 0) result += ' and ' + numberToWords(cents) + ' Cent' + (cents !== 1 ? 's' : '');
  return result;
}

// ── Helpers for manual template replacement ───────────────────────────────────

function escXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Normalizes split-run placeholders for any delimiter pair.
// Word breaks delimiters across XML runs; this collapses them back.
function normalizeSplitPlaceholders(xml, startDelim, endDelim) {
  // startDelim/endDelim as they appear literally in the XML (e.g. '{{' or '&lt;&lt;')
  const START_RE = new RegExp(startDelim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*<\\/w:t><\\/w:r>');
  const END_RE   = new RegExp('<w:t[^>]*>\\s*' + endDelim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<\\/w:t><\\/w:r>');

  let result    = '';
  let remaining = xml;

  while (true) {
    const startMatch = START_RE.exec(remaining);
    if (!startMatch) { result += remaining; break; }

    const si         = startMatch.index;
    const afterStart = si + startMatch[0].length;

    const endMatch = END_RE.exec(remaining.slice(afterStart));
    if (!endMatch) { result += remaining; break; }

    const ei     = afterStart + endMatch.index;
    const endLen = endMatch[0].length;

    const middle    = remaining.slice(afterStart, ei);
    const fieldName = [...middle.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map(m => m[1]).join('').trim();

    result    += remaining.slice(0, si);
    result    += `${startDelim}${fieldName}${endDelim}</w:t></w:r>`;
    remaining  = remaining.slice(ei + endLen);
  }

  return result;
}

function replacePlaceholders(xml, formData) {
  for (const [key, value] of Object.entries(formData)) {
    const keyPattern = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escaped = escXml(value || '');
    xml = xml.replace(new RegExp(`&lt;&lt;\\s*${keyPattern}\\s*&gt;&gt;`, 'g'), escaped);
    xml = xml.replace(new RegExp(`<<\\s*${keyPattern}\\s*>>`, 'g'), escaped);
  }
  return xml;
}

// ── Letters to Creditors generation ──────────────────────────────────────────

const LETTERS_IMAGE_ANCHOR = `<w:drawing><wp:anchor distT="0" distB="0" distL="114300" distR="114300" simplePos="0" relativeHeight="251658240" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="0" wp14:anchorId="7B2D5CF1" wp14:editId="16537454"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>914400</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>152400</wp:posOffset></wp:positionV><wp:extent cx="5977128" cy="1191768"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapTopAndBottom/><wp:docPr id="86642" name="Picture 86642"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="86642" name="Picture 86642"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId7"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5977128" cy="1191768"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing>`;

const LETTERS_SECT_PR = `<w:sectPr w:rsidR="00FB6D52" w:rsidSect="009E467C"><w:headerReference w:type="even" r:id="rId11"/><w:headerReference w:type="default" r:id="rId12"/><w:footerReference w:type="even" r:id="rId13"/><w:footerReference w:type="default" r:id="rId14"/><w:headerReference w:type="first" r:id="rId15"/><w:footerReference w:type="first" r:id="rId16"/><w:pgSz w:w="12211" w:h="15206"/><w:pgMar w:top="2886" w:right="1382" w:bottom="5272" w:left="1546" w:header="576" w:footer="720" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="299"/></w:sectPr>`;

function buildOneLetter(letterDate, clientNames, creditor, isFirst = true) {
  const e = escXml;
  const imageRunXml = `<w:r><w:rPr><w:noProof/></w:rPr>${LETTERS_IMAGE_ANCHOR}</w:r>`;
  const pageBreak = isFirst ? '' : '<w:pageBreakBefore/>';

  return (
    `<w:p><w:pPr>${pageBreak}<w:spacing w:after="519"/><w:ind w:left="0" w:firstLine="96"/></w:pPr><w:r><w:t>${e(letterDate)}</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:ind w:left="96"/></w:pPr><w:r><w:t>${e(creditor.name)}</w:t></w:r></w:p>` +
    `<w:p><w:r><w:t>${e(creditor.address1)}</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:spacing w:after="480"/><w:ind w:left="91"/></w:pPr><w:r><w:t>${e(creditor.address2)}</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:jc w:val="left"/><w:tabs><w:tab w:val="left" w:pos="816"/></w:tabs><w:spacing w:after="353"/><w:ind w:left="816" w:right="4416" w:hanging="720"/></w:pPr><w:r><w:t xml:space="preserve">Re:</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>${e(clientNames)}</w:t></w:r><w:r><w:br/></w:r><w:r><w:t xml:space="preserve">Account(s) ending in: ${e(creditor.accounts)}</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:spacing w:after="197"/><w:ind w:left="91"/></w:pPr><w:r><w:t>To Whom It May Concern:</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:spacing w:after="167"/><w:ind w:left="91"/></w:pPr><w:r><w:t>On ${e(letterDate)}, the above-named debtor(s) retained this office to file a voluntary petition under Chapter 7 of the U.S. Bankruptcy Code, in the U.S. Bankruptcy Court, Central District of California.</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:spacing w:after="140"/><w:ind w:left="91"/></w:pPr>${imageRunXml}<w:r><w:t>Once the Case is filed under 11 U.S.C. Section 362 (a), you may not:</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="140"/><w:ind w:hanging="130"/></w:pPr><w:r><w:t>take any action against the debtor(s) or the debtor(s)’s property to collect any debt;</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="142"/><w:ind w:hanging="130"/></w:pPr><w:r><w:t>enforce any lien on debtor(s)’s real or personal property;</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="140"/><w:ind w:hanging="130"/></w:pPr><w:r><w:t>repossess any property in debtor(s)’s possession;</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="140"/><w:ind w:hanging="130"/></w:pPr><w:r><w:t>discontinue any service or benefit currently being provided to the debtor(s) by you;</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="149"/><w:ind w:hanging="130"/></w:pPr><w:r><w:t>take any action to evict the debtor(s) from his/her residential dwelling.</w:t></w:r></w:p>` +
    `<w:p><w:pPr><w:spacing w:after="149"/><w:ind w:left="91"/></w:pPr><w:r><w:t>A violation of these prohibitions may be considered contempt of court and be punished accordingly.</w:t></w:r></w:p>`
  );
}

async function generateLettersBuffer({ clientNames, creditors }) {
  const letterDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const templatePath = path.join(__dirname, '..', 'assets', 'Template - Letters to Creditors 5-8-2026 (Signed).docx');
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  let footer2Xml = zip.file('word/footer2.xml').asText();
  footer2Xml = footer2Xml.replace('<w:r><w:t>1</w:t></w:r>', '');
  zip.file('word/footer2.xml', footer2Xml);

  let footer1Xml = zip.file('word/footer1.xml').asText();
  footer1Xml = footer1Xml.replace('<w:r><w:t>2</w:t></w:r>', '');
  zip.file('word/footer1.xml', footer1Xml);

  let bodyContent = '';
  creditors.forEach((creditor, i) => {
    bodyContent += buildOneLetter(letterDate, clientNames, creditor, i === 0);
  });
  bodyContent += LETTERS_SECT_PR;

  let docXml = zip.file('word/document.xml').asText();
  const bodyStart = docXml.indexOf('<w:body>');
  const bodyEnd = docXml.lastIndexOf('</w:body>') + '</w:body>'.length;
  docXml = docXml.slice(0, bodyStart) + `<w:body>${bodyContent}</w:body>` + docXml.slice(bodyEnd);
  zip.file('word/document.xml', docXml);

  return zip.generate({ type: 'nodebuffer' });
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    resizable: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
  return win;
}

// ── Shared template filling ───────────────────────────────────────────────────

function todayFormatted() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fillTemplate(zip, formData, templateFile) {
  let xml = zip.file('word/document.xml').asText();

  if (['ch11_retainer.docx', 'ch13_central_consumer_retainer.docx', 'ch13_south_consumer_retainer.docx', 'ch13_south_business_retainer.docx'].includes(templateFile)) {
    formData.Contract_Date = todayFormatted();
  }

  if (formData.Attorney_Fee)           formData.Attorney_Fee_Words           = currencyToWords(formData.Attorney_Fee);
  if (formData.Attorney_Fee_Replenish) formData.Attorney_Fee_Replenish_Words = currencyToWords(formData.Attorney_Fee_Replenish);
  if (formData.Retainer_Amount)        formData.Retainer_Amount_Words        = currencyToWords(formData.Retainer_Amount);

  if (templateFile === 'bk_estimate.docx' || templateFile === 'ch13_estimate.docx') {
    const feeRows = formData.fee_rows || [];
    const startTag = '{#fee_rows}';
    const endTag   = '{/fee_rows}';
    const itemTag  = '{fee_amount}';
    const si = xml.indexOf(startTag);
    const ei = xml.indexOf(endTag);
    if (si !== -1 && ei !== -1) {
      const prevCloseBeforeStart = xml.lastIndexOf('</w:p>', si);
      const startParaOpen  = prevCloseBeforeStart !== -1 ? prevCloseBeforeStart + '</w:p>'.length : 0;
      const startParaClose = xml.indexOf('</w:p>', si) + '</w:p>'.length;
      const prevCloseBeforeEnd = xml.lastIndexOf('</w:p>', ei);
      const endParaOpen  = prevCloseBeforeEnd !== -1 ? prevCloseBeforeEnd + '</w:p>'.length : startParaClose;
      const endParaClose = xml.indexOf('</w:p>', ei) + '</w:p>'.length;
      const templatePara = xml.slice(startParaClose, endParaOpen);
      const expanded = feeRows.map(({ fee_amount }) => templatePara.replace(itemTag, fee_amount)).join('');
      xml = xml.slice(0, startParaOpen) + expanded + xml.slice(endParaClose);
    }
    for (const [key, value] of Object.entries(formData)) {
      if (key !== 'fee_rows') xml = xml.split(`{{${key}}}`).join(value || '');
    }
  } else {
    xml = normalizeSplitPlaceholders(xml, '&lt;&lt;', '&gt;&gt;');
    xml = replacePlaceholders(xml, formData);
  }

  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer' });
}

// ── IPC handler ───────────────────────────────────────────────────────────────

ipcMain.handle('generate-preview', async (_event, { formData, templateFile }) => {
  try {
    if (!ALLOWED_TEMPLATES.has(templateFile)) {
      return { error: 'Invalid template file.' };
    }
    const templatePath = path.join(__dirname, '..', 'assets', templateFile);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const buffer = fillTemplate(zip, { ...formData }, templateFile);

    const libreOptions = { sofficeBinaryPaths: SOFFICE_PATHS };
    let pdfBuffer;
    try {
      pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
    } catch (convErr) {
      if (/source file could not be loaded/i.test(convErr.message)) {
        await new Promise((resolve) => exec('pkill -9 soffice; sleep 1', resolve));
        pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
      } else {
        throw convErr;
      }
    }

    return { pdfBase64: pdfBuffer.toString('base64') };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('generate-document', async (_event, { formData, templateFile, filenamePrefix, isBusinessName }) => {
  try {
    if (!ALLOWED_TEMPLATES.has(templateFile)) {
      return { success: false, error: 'Invalid template file.' };
    }
    const templatePath = path.join(__dirname, '..', 'assets', templateFile);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const buffer = fillTemplate(zip, formData, templateFile);

    // ── Convert to PDF ───────────────────────────────────────────────────────
    const libreOptions = { sofficeBinaryPaths: SOFFICE_PATHS };
    let pdfBuffer;
    try {
      pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
    } catch (convErr) {
      if (/source file could not be loaded/i.test(convErr.message)) {
        await new Promise((resolve) => exec('pkill -9 soffice; sleep 1', resolve));
        pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
      } else {
        throw convErr;
      }
    }

    // ── Save dialog ─────────────────────────────────────────────────────────
    const FORM_LABELS = {
      'Griffin_Ch7Retainer':        'Ch7 Retainer',
      'Griffin_BkEstimate':         'BK Fee Estimate',
      'Griffin_BizCh7Retainer':     'Business Ch7 Retainer',
      'Griffin_Ch11Retainer':       'Ch11 Retainer',
      'Griffin_Ch13CentralConsumer':'Ch13 Central Consumer Retainer',
      'Griffin_Ch13SouthConsumer':  'Ch13 South Consumer Retainer',
      'Griffin_Ch13SouthBusiness':  'Ch13 South Business Retainer',
      'Griffin_Ch13Estimate':       'Ch13 Fee Estimate',
      'Griffin_SpanishCh7':         'Ch7 Retainer (Spanish)',
      'Griffin_CivilHourlyLit':     'Civil Retainer (Hourly Litigation)',
      'Griffin_CivilHourlyNonLit':  'Civil Retainer (Hourly Non-Litigation)',
      'Griffin_CivilFlatFee':       'Civil Retainer (Flat Fee)',
      'Griffin_CivilContingency':   'Civil Retainer (Contingency)',
      'Griffin_FamilyLaw':          'Family Law Retainer',
      'Griffin_UD':                 'UD Retainer',
      'Griffin_Probate':            'Probate Retainer',
      'Griffin_LettersToCreditors': 'Letters to Creditors',
    };
    const formLabel = FORM_LABELS[filenamePrefix] || filenamePrefix;

    const CLIENT_FOLDERS_BASE = process.platform === 'win32'
      ? '\\\\ReadyNAS\\Public\\Client Folders A-Z'
      : '/Volumes/Public/Client Folders A-Z';

    function getAlphaFolder(lastName) {
      const c = (lastName[0] || 'A').toUpperCase();
      if (c >= 'A' && c <= 'F') return 'A-F';
      if (c >= 'G' && c <= 'L') return 'G-L';
      if (c >= 'M' && c <= 'R') return 'M-R';
      return 'S-Z';
    }

    function formatClientName(fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      const lastName  = parts[parts.length - 1];
      const firstName = parts.slice(0, -1).join(' ');
      return `${lastName}, ${firstName}`;
    }

    const rawName    = formData.Client_Name || 'Client';
    let safeName, alphaFolder;
    if (isBusinessName) {
      safeName = rawName.replace(/[/\\:*?"<>|]/g, '');
      alphaFolder = getAlphaFolder(rawName.trim());
    } else {
      const clients    = rawName.split(/\s+and\s+/i);
      const formatted  = clients.map(formatClientName).join(' and ');
      safeName   = formatted.replace(/[/\\:*?"<>|]/g, '');
      const primaryParts = clients[0].trim().split(/\s+/);
      const primaryLast  = primaryParts[primaryParts.length - 1];
      alphaFolder  = getAlphaFolder(primaryLast);
    }

    // Walk up the path until we find a directory that exists
    const storedDefault = readConfig().defaultDir;
    function deepestExisting(fullPath) {
      let current = fullPath;
      while (current && current !== path.dirname(current)) {
        if (fs.existsSync(current)) return current;
        current = path.dirname(current);
      }
      return storedDefault || app.getPath('downloads');
    }

    const alphaDir = path.join(CLIENT_FOLDERS_BASE, alphaFolder);

    // Find or create the client subfolder
    let defaultDir = deepestExisting(alphaDir);
    if (fs.existsSync(alphaDir)) {
      const search = safeName.toLowerCase();
      const match  = fs.readdirSync(alphaDir).find((entry) => {
        const full = path.join(alphaDir, entry);
        return fs.statSync(full).isDirectory() && entry.toLowerCase().startsWith(search);
      });
      if (match) {
        // Existing client folder found — use it
        defaultDir = path.join(alphaDir, match);
      } else {
        // No folder found — create one as "LastName, FirstName"
        const newClientDir = path.join(alphaDir, safeName);
        fs.mkdirSync(newClientDir, { recursive: true });
        defaultDir = newClientDir;
      }
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: path.join(defaultDir, `${safeName} - ${formLabel}.pdf`),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return { success: false, error: 'Save cancelled.' };

    fs.writeFileSync(filePath, pdfBuffer);
    shell.openPath(filePath);

    const config = readConfig();
    const history = config.history || [];
    history.unshift({
      clientName: formData.Client_Name || 'Unknown',
      formType: formLabel,
      filePath,
      timestamp: new Date().toISOString(),
    });
    config.history = history.slice(0, 50);
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));

    return { success: true, filePath };
  } catch (err) {
    // Docxtemplater wraps errors — unwrap for a useful message
    if (err.properties && err.properties.errors) {
      const details = err.properties.errors
        .map(e => e.properties ? e.properties.explanation || e.message : e.message)
        .join(' | ');
      return { success: false, error: `Template error: ${details}` };
    }
    return { success: false, error: err.message };
  }
});

// ── Letters to Creditors IPC handlers ────────────────────────────────────────

ipcMain.handle('preview-letters-to-creditors', async (_event, { clientNames, creditors }) => {
  try {
    const buffer = await generateLettersBuffer({ clientNames, creditors });
    const libreOptions = { sofficeBinaryPaths: SOFFICE_PATHS };
    let pdfBuffer;
    try {
      pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
    } catch (convErr) {
      if (/source file could not be loaded/i.test(convErr.message)) {
        await new Promise((resolve) => exec('pkill -9 soffice; sleep 1', resolve));
        pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
      } else {
        throw convErr;
      }
    }
    return { pdfBase64: pdfBuffer.toString('base64') };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('generate-letters-to-creditors', async (_event, { clientNames, creditors, isBusinessName }) => {
  try {
    const buffer = await generateLettersBuffer({ clientNames, creditors });

    const libreOptions = { sofficeBinaryPaths: SOFFICE_PATHS };
    let pdfBuffer;
    try {
      pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
    } catch (convErr) {
      if (/source file could not be loaded/i.test(convErr.message)) {
        await new Promise((resolve) => exec('pkill -9 soffice; sleep 1', resolve));
        pdfBuffer = await libre.convertWithOptionsAsync(buffer, '.pdf', undefined, libreOptions);
      } else {
        throw convErr;
      }
    }

    const formLabel = 'Letters to Creditors';

    const CLIENT_FOLDERS_BASE = process.platform === 'win32'
      ? '\\\\ReadyNAS\\Public\\Client Folders A-Z'
      : '/Volumes/Public/Client Folders A-Z';

    function getAlphaFolderLC(c0) {
      const c = (c0 || 'A').toUpperCase();
      if (c >= 'A' && c <= 'F') return 'A-F';
      if (c >= 'G' && c <= 'L') return 'G-L';
      if (c >= 'M' && c <= 'R') return 'M-R';
      return 'S-Z';
    }

    function fmtClientName(fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
    }

    const rawName = clientNames || 'Client';
    let safeName, alphaFolder;
    if (isBusinessName) {
      safeName = rawName.replace(/[/\\:*?"<>|]/g, '');
      alphaFolder = getAlphaFolderLC(rawName.trim()[0]);
    } else {
      const clients = rawName.split(/\s+and\s+/i);
      const formatted = clients.map(fmtClientName).join(' and ');
      safeName = formatted.replace(/[/\\:*?"<>|]/g, '');
      const primaryParts = clients[0].trim().split(/\s+/);
      alphaFolder = getAlphaFolderLC(primaryParts[primaryParts.length - 1][0]);
    }

    const storedDefault = readConfig().defaultDir;
    function deepestExistingLC(fullPath) {
      let current = fullPath;
      while (current && current !== path.dirname(current)) {
        if (fs.existsSync(current)) return current;
        current = path.dirname(current);
      }
      return storedDefault || app.getPath('downloads');
    }

    const alphaDir = path.join(CLIENT_FOLDERS_BASE, alphaFolder);
    let defaultDir = deepestExistingLC(alphaDir);
    if (fs.existsSync(alphaDir)) {
      const search = safeName.toLowerCase();
      const match = fs.readdirSync(alphaDir).find((entry) => {
        const full = path.join(alphaDir, entry);
        return fs.statSync(full).isDirectory() && entry.toLowerCase().startsWith(search);
      });
      if (match) {
        defaultDir = path.join(alphaDir, match);
      } else {
        const newClientDir = path.join(alphaDir, safeName);
        fs.mkdirSync(newClientDir, { recursive: true });
        defaultDir = newClientDir;
      }
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: path.join(defaultDir, `${safeName} - ${formLabel}.pdf`),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return { success: false, error: 'Save cancelled.' };

    fs.writeFileSync(filePath, pdfBuffer);
    shell.openPath(filePath);

    const config = readConfig();
    const history = config.history || [];
    history.unshift({
      clientName: clientNames || 'Unknown',
      formType: formLabel,
      filePath,
      timestamp: new Date().toISOString(),
    });
    config.history = history.slice(0, 50);
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));

    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    try {
      const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) app.dock.setIcon(icon);
    } catch (err) {
      console.warn('Could not set dock icon:', err.message);
    }
  }
  const win = createWindow();
  ensureLibreOffice(win);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Auto-update — only runs in packaged app, not dev
  if (app.isPackaged) {
    autoUpdater.on('error', (err) => {
      console.error('Auto-update error:', err.message);
    });

    autoUpdater.checkForUpdatesAndNotify();
    setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 60 * 60 * 1000);

    autoUpdater.on('update-available', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. It will download in the background and install when you quit.',
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. The app will restart to apply it.',
        buttons: ['Restart Now', 'Later'],
      }).then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
    });
  }
}).catch((err) => {
  console.error('app.whenReady error:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
