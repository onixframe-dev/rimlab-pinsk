import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = path.resolve('assets/images/source');
const outputDir = path.resolve('public/images/optimized');
const widths = [480, 768, 960, 1280, 1600, 1920, 2560];
const supportedExtensions = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.heic',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
]);

await mkdir(outputDir, { recursive: true });

const files = (await readdir(sourceDir, { withFileTypes: true }))
  .filter(
    file =>
      file.isFile() &&
      supportedExtensions.has(path.extname(file.name).toLowerCase())
  )
  .map(file => file.name);

if (files.length === 0) {
  console.log('Нет исходных растровых изображений в assets/images/source/.');
  process.exit(0);
}

for (const file of files) {
  const inputPath = path.join(sourceDir, file);
  const baseName = path.parse(file).name;
  const metadata = await sharp(inputPath).metadata();
  const outputWidths = widths.filter(width => width < (metadata.width ?? 0));

  if (metadata.width && !outputWidths.includes(metadata.width)) {
    outputWidths.push(metadata.width);
  }

  for (const width of outputWidths) {
    const pipeline = sharp(inputPath).resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
    });
    const suffix = `${baseName}-${width}`;

    await Promise.all([
      pipeline
        .clone()
        .avif({ quality: 55, effort: 4 })
        .toFile(path.join(outputDir, `${suffix}.avif`)),
      pipeline
        .clone()
        .webp({ quality: 80, effort: 4 })
        .toFile(path.join(outputDir, `${suffix}.webp`)),
      metadata.hasAlpha
        ? pipeline
            .clone()
            .png({ compressionLevel: 9 })
            .toFile(path.join(outputDir, `${suffix}.png`))
        : pipeline
            .clone()
            .jpeg({ quality: 82, mozjpeg: true })
            .toFile(path.join(outputDir, `${suffix}.jpg`)),
    ]);
  }

  console.log(`Обработано: ${file}`);
}
