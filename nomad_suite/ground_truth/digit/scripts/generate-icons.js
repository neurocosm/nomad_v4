import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgBuffer = fs.readFileSync('public/icon.svg');

  // 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Generated public/pwa-192x192.png');

  // 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Generated public/pwa-512x512.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated public/apple-touch-icon.png');

  // 512x512 Maskable Icon with 15% safe-zone margin
  // Maskable icons require a solid background extending to edges, with content in the inner 80% circle
  const innerBuffer = await sharp(svgBuffer)
    .resize(410, 410)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 8, b: 17, alpha: 1 }
    }
  })
    .composite([{ input: innerBuffer, top: 51, left: 51 }])
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Generated public/pwa-maskable-512x512.png');
}

generate().catch(console.error);
