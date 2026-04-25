const { app, BrowserWindow, ipcMain, dialog, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, exec } = require('child_process');
const { autoUpdater } = require('electron-updater');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

// ── LibreOffice check & install ───────────────────────────────────────────────

const SOFFICE_PATHS = [
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/local/bin/soffice',
  '/opt/homebrew/bin/soffice',
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

ipcMain.handle('set-title', (_event, title) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.setTitle(title);
});

ipcMain.handle('show-in-folder', (_event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('open-file', async (_event, filePath) => {
  if (!fs.existsSync(filePath)) {
    dialog.showMessageBox({ type: 'warning', title: 'File Not Found', message: `This file has been moved or deleted:\n${filePath}` });
    return;
  }
  shell.openPath(filePath);
});

ipcMain.handle('get-history', () => {
  return (readConfig().history || []);
});

ipcMain.handle('clear-history', () => {
  const config = readConfig();
  config.history = [];
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
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
    const templatePath = path.join(__dirname, '..', 'assets', templateFile);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const buffer = fillTemplate(zip, { ...formData }, templateFile);

    let pdfBuffer;
    try {
      pdfBuffer = await libre.convertAsync(buffer, '.pdf', undefined);
    } catch (convErr) {
      if (/source file could not be loaded/i.test(convErr.message)) {
        await new Promise((resolve) => exec('pkill -9 soffice; sleep 1', resolve));
        pdfBuffer = await libre.convertAsync(buffer, '.pdf', undefined);
      } else {
        throw convErr;
      }
    }

    return { pdfBase64: pdfBuffer.toString('base64') };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('generate-document', async (_event, { formData, templateFile, filenamePrefix }) => {
  try {
    const templatePath = path.join(__dirname, '..', 'assets', templateFile);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const buffer = fillTemplate(zip, formData, templateFile);

    // ── Convert to PDF ───────────────────────────────────────────────────────
    let pdfBuffer;
    try {
      pdfBuffer = await libre.convertAsync(buffer, '.pdf', undefined);
    } catch (convErr) {
      if (/source file could not be loaded/i.test(convErr.message)) {
        await new Promise((resolve) => exec('pkill -9 soffice; sleep 1', resolve));
        pdfBuffer = await libre.convertAsync(buffer, '.pdf', undefined);
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
    const clients    = rawName.split(/\s+and\s+/i);
    const formatted  = clients.map(formatClientName).join(' and ');
    const safeName   = formatted.replace(/[/\\:*?"<>|]/g, '');

    // Use the last name of the first client to pick the alpha folder
    const primaryParts = clients[0].trim().split(/\s+/);
    const primaryLast  = primaryParts[primaryParts.length - 1];
    const alphaFolder  = getAlphaFolder(primaryLast);

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
