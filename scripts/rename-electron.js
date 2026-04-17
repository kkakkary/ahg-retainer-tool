// Renames the Electron binary on macOS so the menu bar shows the app name
// instead of "Electron" during development. No-op on Windows/Linux.
const fs = require('fs');
const path = require('path');

if (process.platform !== 'darwin') process.exit(0);

const APP_NAME = 'AHG Document Creation Tool';

const electronDir = path.dirname(require.resolve('electron'));
const pathFile = path.join(electronDir, 'path.txt');
if (!fs.existsSync(pathFile)) process.exit(0);

const electronExecRelative = fs.readFileSync(pathFile, 'utf8').trim();
// path.txt is relative to the electron package dist/ folder
const distDir = path.join(electronDir, 'dist');
const electronExec = path.join(distDir, electronExecRelative);

// The .app bundle is two levels up from the Electron binary
// e.g. .../Electron.app/Contents/MacOS/Electron
const appBundle = path.resolve(electronExec, '../../..');
const appBundleName = path.basename(appBundle, '.app');

// ── Replace embedded icon (always, regardless of rename state) ───────────
try {
  const icnsSource = path.join(__dirname, '..', 'assets', 'icon.icns');
  const bundleNames = [`${APP_NAME}.app`, 'Electron.app'];
  for (const name of bundleNames) {
    const dest = path.join(distDir, name, 'Contents', 'Resources', 'electron.icns');
    if (fs.existsSync(dest) && fs.existsSync(icnsSource)) {
      fs.copyFileSync(icnsSource, dest);
      console.log(`Replaced icon in ${name}.`);
      break;
    }
  }
} catch (err) {
  console.warn(`Could not replace icon: ${err.message}`);
}

if (appBundleName === APP_NAME) {
  console.log(`Electron binary already named "${APP_NAME}" — skipping rename.`);
  process.exit(0);
}

const newAppBundle = path.join(path.dirname(appBundle), `${APP_NAME}.app`);
const newExec = path.join(newAppBundle, 'Contents', 'MacOS', APP_NAME);
const oldExec = path.join(appBundle, 'Contents', 'MacOS', appBundleName);

try {
  // Rename the binary inside the bundle
  fs.renameSync(oldExec, path.join(path.dirname(oldExec), APP_NAME));
  // Rename the .app bundle itself
  fs.renameSync(appBundle, newAppBundle);
  // Update path.txt so electron resolves the new path (relative to dist/)
  fs.writeFileSync(pathFile, path.relative(distDir, newExec));
  console.log(`Renamed Electron binary to "${APP_NAME}".`);
} catch (err) {
  // Non-fatal — dev experience only
  console.warn(`Could not rename Electron binary: ${err.message}`);
}

// ── Replace embedded icon ─────────────────────────────────────────────────
// The renamed bundle still has the Electron icon — swap in our own.
try {
  const icnsSource = path.join(__dirname, '..', 'assets', 'icon.icns');
  // Bundle may already be renamed or still be Electron.app
  const bundleNames = [`${APP_NAME}.app`, 'Electron.app'];
  for (const name of bundleNames) {
    const dest = path.join(distDir, name, 'Contents', 'Resources', 'electron.icns');
    if (fs.existsSync(dest) && fs.existsSync(icnsSource)) {
      fs.copyFileSync(icnsSource, dest);
      console.log(`Replaced icon in ${name}.`);
      break;
    }
  }
} catch (err) {
  console.warn(`Could not replace icon: ${err.message}`);
}
