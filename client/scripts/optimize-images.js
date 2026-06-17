const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Source images directory (where you uploaded originals)
const srcDir = path.join(__dirname, '..', 'src', 'app', 'portfolio');
// Output directory under public for optimized assets
const outDir = path.join(__dirname, '..', 'public', 'optimized');

const sizes = [
  { name: 'large', width: 1200, height: 800, quality: 80 },
  { name: 'medium', width: 600, height: 400, quality: 75 },
];

async function optimizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext).replace(/\s+/g, '-');
  const inputPath = path.join(srcDir, file);

  for (const s of sizes) {
    const outName = `${base}-${s.width}x${s.height}.webp`;
    const outPath = path.join(outDir, outName);

    await sharp(inputPath)
      .resize(s.width, s.height, { fit: 'cover' })
      .webp({ quality: s.quality })
      .toFile(outPath);

    console.log(`Written ${outPath}`);
  }
}

async function run() {
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory not found: ${srcDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  if (!files.length) {
    console.log('No image files found to optimize.');
    return;
  }

  for (const file of files) {
    try {
      await optimizeFile(file);
    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
    }
  }
}

run();
