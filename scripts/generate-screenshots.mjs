import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const screenshots = [
  { name: 'dashboard', title: 'Dashboard' },
  { name: 'transactions', title: 'Transacciones' },
  { name: 'goals', title: 'Metas' },
];

const width = 375;
const height = 667;

for (const { name, title } of screenshots) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      <text x="${width/2}" y="${height/2}" font-size="24" text-anchor="middle" fill="#64748b" font-family="system-ui">
        ${title} - Kept
      </text>
      <rect x="20" y="${height - 100}" width="${width - 40}" height="80" rx="12" fill="#2563eb" opacity="0.1"/>
      <text x="${width/2}" y="${height - 55}" font-size="14" text-anchor="middle" fill="#2563eb">iPhone SE 2 (375×667)</text>
    </svg>
  `;
  
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(path.join('public/screenshots', `${name}.png`), pngBuffer);
  console.log(`Generated screenshots/${name}.png`);
}

console.log('Screenshots generated!');