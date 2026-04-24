const { signAsync } = require('@electron/osx-sign');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const app = path.resolve('release/mac-universal/AHG Document Creation Tool.app');
const entitlements = path.resolve('node_modules/app-builder-lib/templates/entitlements.mac.plist');
const identity = 'Developer ID Application: KEVIN CECIL KAKKARY (8YW2S6UN69)';

// Find all unsigned binaries (Mach-O files) that @electron/osx-sign might miss
function findBinaries(dir) {
  const results = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d)) {
      const full = path.join(d, entry);
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) { walk(full); continue; }
      try {
        execSync(`file "${full}" 2>/dev/null | grep -q Mach-O`, { stdio: 'pipe' });
        results.push(full);
      } catch {}
    }
  }
  walk(dir);
  return results;
}

const binaries = findBinaries(app);
console.log(`Found ${binaries.length} binaries to sign`);

signAsync({
  app,
  identity,
  entitlements,
  'entitlements-inherit': entitlements,
  'hardened-runtime': true,
  timestamp: 'http://timestamp.apple.com/ts01',
  binaries,
}).then(() => {
  console.log('Signing complete');
}).catch(err => {
  console.error('Signing failed:', err);
  process.exit(1);
});
