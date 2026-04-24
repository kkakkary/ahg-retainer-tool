const { signAsync } = require('@electron/osx-sign');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = path.resolve('release/mac-universal/AHG Document Creation Tool.app');
const entitlements = path.resolve('node_modules/app-builder-lib/templates/entitlements.mac.plist');
const identity = 'Developer ID Application: KEVIN CECIL KAKKARY (8YW2S6UN69)';

function isMachO(filePath) {
  try {
    const out = execSync(`file "${filePath}"`, { encoding: 'utf8' });
    return out.includes('Mach-O');
  } catch { return false; }
}

function walkAndSign(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) { walkAndSign(full); continue; }
    if (isMachO(full)) {
      try {
        execSync(
          `codesign --sign "${identity}" --force --timestamp --options runtime --entitlements "${entitlements}" "${full}"`,
          { stdio: 'inherit' }
        );
      } catch (e) {
        console.warn(`Warning: could not sign ${full}: ${e.message}`);
      }
    }
  }
}

console.log('Pre-signing all Mach-O binaries...');
walkAndSign(app);

console.log('Running @electron/osx-sign on app bundle...');
signAsync({
  app,
  identity,
  entitlements,
  'entitlements-inherit': entitlements,
  'hardened-runtime': true,
  timestamp: 'http://timestamp.apple.com/ts01',
}).then(() => {
  console.log('Signing complete');
  execSync(`codesign --verify --deep --strict "${app}"`, { stdio: 'inherit' });
  console.log('Verification passed');
}).catch(err => {
  console.error('Signing failed:', err);
  process.exit(1);
});
