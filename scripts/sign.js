const { signAsync } = require('@electron/osx-sign');
const path = require('path');

const app = path.resolve('release/mac-universal/AHG Document Creation Tool.app');
const entitlements = path.resolve('node_modules/app-builder-lib/templates/entitlements.mac.plist');

signAsync({
  app,
  identity: 'Developer ID Application: KEVIN CECIL KAKKARY (8YW2S6UN69)',
  entitlements,
  'entitlements-inherit': entitlements,
  'hardened-runtime': true,
  timestamp: 'http://timestamp.apple.com/ts01',
}).then(() => {
  console.log('Signing complete');
}).catch(err => {
  console.error('Signing failed:', err);
  process.exit(1);
});
