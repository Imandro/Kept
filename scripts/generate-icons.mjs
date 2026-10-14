import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = 'public/icons/icon-base.svg';
const destDir = 'public/icons';

const svgBuffer = fs.readFileSync(svgPath);

for (const size of sizes) {
  const pngBuffer = await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer();
  
  const outputPath = path.join(destDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Generated ${outputPath}`);
}

// Generar shortcuts icons
const shortcuts = ['expense', 'income', 'saving'];
for (const name of shortcuts) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#2563eb"/><text x="256" y="320" font-size="200" text-anchor="middle" fill="white">${name === 'expense' ? '−' : name === 'income' ? '+' : '★'}</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(destDir, `${name}.png`), buf);
  console.log(`Generated ${name}.png`);
}

console.log('All icons generated!');