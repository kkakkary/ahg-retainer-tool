const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = path.resolve('release/mac-universal/AHG Document Creation Tool.app');
const entitlements = path.resolve('node_modules/app-builder-lib/templates/entitlements.mac.plist');
const identity = 'Developer ID Application: KEVIN CECIL KAKKARY (8YW2S6UN69)';
const tsServer = 'http://timestamp.apple.com/ts01';

function sign(target, extra = '') {
  const cmd = `codesign --sign "${identity}" --force --timestamp="${tsServer}" --options runtime --entitlements "${entitlements}" ${extra} "${target}"`;
  console.log(`Signing: ${path.relative(process.cwd(), target)}`);
  execSync(cmd, { stdio: 'inherit' });
}

function isMachO(f) {
  try { return execSync(`file "${f}"`, { encoding: 'utf8' }).includes('Mach-O'); }
  catch { return false; }
}

function findAll(dir, test) {
  const results = [];
  function walk(d) {
    for (const e of fs.readdirSync(d)) {
      const full = path.join(d, e);
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) { walk(full); continue; }
      if (test(full)) results.push(full);
    }
  }
  walk(dir);
  return results;
}

function findDirs(dir, test) {
  const results = [];
  function walk(d) {
    for (const e of fs.readdirSync(d)) {
      const full = path.join(d, e);
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) continue;
      if (!stat.isDirectory()) continue;
      if (test(full, e)) results.push(full);
      walk(full);
    }
  }
  walk(dir);
  return results;
}

// Step 1: sign all individual Mach-O files (deepest first)
console.log('\n=== Step 1: Sign individual binaries ===');
const binaries = findAll(app, isMachO);
for (const f of binaries) sign(f);

// Step 2: sign helper .app bundles (deepest first)
console.log('\n=== Step 2: Sign helper apps ===');
const helpers = findDirs(app, (_, e) => e.endsWith('.app'));
for (const h of helpers.reverse()) sign(h);

// Step 3: sign .framework bundles
console.log('\n=== Step 3: Sign frameworks ===');
const frameworks = findDirs(app, (_, e) => e.endsWith('.framework'));
for (const fw of frameworks.reverse()) sign(fw);

// Step 4: sign the main app bundle
console.log('\n=== Step 4: Sign main app ===');
sign(app);

// Verify
console.log('\n=== Verifying ===');
execSync(`codesign --verify --deep --strict "${app}"`, { stdio: 'inherit' });
console.log('Verification passed');
