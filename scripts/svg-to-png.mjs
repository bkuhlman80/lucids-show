import puppeteer from 'puppeteer';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node svg-to-png.mjs <input.svg> <output.png>');
  process.exit(1);
}

const svgPath = resolve(inputPath);
const pngPath = resolve(outputPath);

const svgContent = await readFile(svgPath, 'utf-8');

// Extract width/height from SVG
const widthMatch = svgContent.match(/width="(\d+)"/);
const heightMatch = svgContent.match(/height="(\d+)"/);
const width = widthMatch ? parseInt(widthMatch[1]) : 1200;
const height = heightMatch ? parseInt(heightMatch[1]) : 630;

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
    }
    svg { display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>
`;

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });

// Wait for fonts to load
await new Promise(r => setTimeout(r, 1000));

const screenshot = await page.screenshot({
  type: 'png',
  clip: { x: 0, y: 0, width, height }
});

await writeFile(pngPath, screenshot);
await browser.close();

console.log(`Created ${pngPath} (${width}x${height})`);
