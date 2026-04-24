const { notarize } = require('@electron/notarize');
const { execSync } = require('child_process');
const path = require('path');

const app = path.resolve('release/mac-universal/AHG Document Creation Tool.app');

async function main() {
  console.log('Submitting for notarization...');
  await notarize({
    appBundleId: 'com.kkai.ahg-retainer',
    appPath: app,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
  console.log('Notarization accepted. Stapling...');
  execSync(`xcrun stapler staple "${app}"`, { stdio: 'inherit' });
  console.log('Stapling complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
