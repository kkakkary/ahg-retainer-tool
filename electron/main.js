const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const mammoth = require('mammoth');

async function convertToPdf(docxBuffer) {
  const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; margin: 1in; line-height: 1.4; }
  p { margin: 0 0 6pt 0; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000; padding: 4px 6px; }
  h1, h2, h3 { margin: 12pt 0 6pt 0; }
</style>
</head>
<body>${html}</body>
</html>`;

  const tmpHtml = path.join(os.tmpdir(), `ahg_${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, fullHtml, 'utf-8');

  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
  try {
    await win.loadFile(tmpHtml);
    const pdfBuffer = await win.webContents.printToPDF({ format: 'Letter', printBackground: true });
    return pdfBuffer;
  } finally {
    win.close();
    try { fs.unlinkSync(tmpHtml); } catch (_) {}
  }
}

app.name = 'AHG Document Creation Tool';

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
}

// ── IPC handler ───────────────────────────────────────────────────────────────

ipcMain.handle('generate-document', async (_event, { formData, templateFile, filenamePrefix }) => {
  try {
    const templatePath = path.join(__dirname, '..', 'assets', templateFile);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    let buffer;

    let xml = zip.file('word/document.xml').asText();

    if (templateFile === 'bk_estimate.docx') {
      // Expand {#fee_rows}...{fee_amount}...{/fee_rows} loop —
      // repeats the template paragraph once per filled fee, removing empty rows
      const feeRows = formData.fee_rows || [];
      const startTag = '{#fee_rows}';
      const endTag   = '{/fee_rows}';
      const itemTag  = '{fee_amount}';
      const si = xml.indexOf(startTag);
      const ei = xml.indexOf(endTag);
      if (si !== -1 && ei !== -1) {
        // Use </w:p> boundaries — unambiguous, won't match <w:pPr> etc.
        const prevCloseBeforeStart = xml.lastIndexOf('</w:p>', si);
        const startParaOpen  = prevCloseBeforeStart !== -1 ? prevCloseBeforeStart + '</w:p>'.length : 0;
        const startParaClose = xml.indexOf('</w:p>', si) + '</w:p>'.length;

        const prevCloseBeforeEnd = xml.lastIndexOf('</w:p>', ei);
        const endParaOpen  = prevCloseBeforeEnd !== -1 ? prevCloseBeforeEnd + '</w:p>'.length : startParaClose;
        const endParaClose = xml.indexOf('</w:p>', ei) + '</w:p>'.length;

        const templatePara = xml.slice(startParaClose, endParaOpen);
        const expanded = feeRows
          .map(({ fee_amount }) => templatePara.replace(itemTag, fee_amount))
          .join('');
        xml = xml.slice(0, startParaOpen) + expanded + xml.slice(endParaClose);
      }

      // Replace all {{}} placeholders (Client_Name, Field_N, Total)
      for (const [key, value] of Object.entries(formData)) {
        if (key !== 'fee_rows') {
          xml = xml.split(`{{${key}}}`).join(value || '');
        }
      }
    } else {
      // <<>> delimiters — normalize split runs then replace
      xml = normalizeSplitPlaceholders(xml, '&lt;&lt;', '&gt;&gt;');
      xml = replacePlaceholders(xml, formData);
    }

    zip.file('word/document.xml', xml);
    buffer = zip.generate({ type: 'nodebuffer' });

    // ── Convert to PDF ───────────────────────────────────────────────────────
    const pdfBuffer = await convertToPdf(buffer);

    // ── Save dialog ─────────────────────────────────────────────────────────
    const FORM_LABELS = {
      'Griffin_Ch7Retainer': 'Ch7 Retainer',
      'Griffin_BkEstimate':  'BK Fee Estimate',
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
    function deepestExisting(fullPath) {
      let current = fullPath;
      while (current && current !== path.dirname(current)) {
        if (fs.existsSync(current)) return current;
        current = path.dirname(current);
      }
      return app.getPath('downloads');
    }

    const alphaDir = path.join(CLIENT_FOLDERS_BASE, alphaFolder);

    // Try to find a client subfolder starting with "LastName, FirstName"
    let defaultDir = deepestExisting(alphaDir);
    if (fs.existsSync(alphaDir)) {
      const search = safeName.toLowerCase();
      const match  = fs.readdirSync(alphaDir).find((entry) => {
        const full = path.join(alphaDir, entry);
        return fs.statSync(full).isDirectory() && entry.toLowerCase().startsWith(search);
      });
      if (match) defaultDir = path.join(alphaDir, match);
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: path.join(defaultDir, `${safeName} - ${formLabel}.pdf`),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return { success: false, error: 'Save cancelled.' };

    fs.writeFileSync(filePath, pdfBuffer);
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
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
