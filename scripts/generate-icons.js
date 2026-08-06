const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgIcon = fs.readFileSync(path.join(__dirname, '..', 'public/icons/icon.svg'));
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, '..', 'public/icons/icon-' + size + 'x' + size + '.png'));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().catch(console.error);
