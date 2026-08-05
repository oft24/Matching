const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

async function generateIcon() {
  const source = path.join(__dirname, '..', 'frontend', 'public', 'favicon.svg');
  const outputDirectory = path.join(__dirname, 'assets');
  const output = path.join(outputDirectory, 'icon.png');
  fs.mkdirSync(outputDirectory, { recursive: true });
  await sharp(source).resize(512, 512).png().toFile(output);
  console.log(`DESKTOP_ICON_OK ${output}`);
}

generateIcon().catch((error) => {
  console.error(`DESKTOP_ICON_FAILED ${error.message}`);
  process.exitCode = 1;
});
