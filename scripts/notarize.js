const { notarize } = require('@electron/notarize');
const { execSync } = require('child_process');

exports.default = async function(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;
  console.log(`Notarizing ${appPath}...`);

  await notarize({
    appBundleId: 'com.kkai.ahg-retainer',
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log('Notarization accepted. Stapling...');
  execSync(`xcrun stapler staple "${appPath}"`, { stdio: 'inherit' });
  console.log('Done.');
};
