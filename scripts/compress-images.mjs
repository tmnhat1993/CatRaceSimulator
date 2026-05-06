/**
 * Compress assets/images for web (same filenames & formats).
 * Run: nvm use 20 && node scripts/compress-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, "..", "assets", "images");

async function compressFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const tmp = `${filePath}.compress-tmp`;
  const buf = await fs.promises.readFile(filePath);
  const before = buf.length;

  try {
    if (ext === ".jpg" || ext === ".jpeg") {
      await sharp(buf)
        .jpeg({
          quality: 82,
          mozjpeg: true,
          chromaSubsampling: "4:2:0",
        })
        .toFile(tmp);
    } else if (ext === ".png") {
      await sharp(buf)
        .png({
          quality: 82,
          compressionLevel: 9,
          effort: 10,
          adaptiveFiltering: true,
        })
        .toFile(tmp);
    } else {
      return null;
    }

    const afterStat = await fs.promises.stat(tmp);
    const after = afterStat.size;
    await fs.promises.rename(tmp, filePath);
    return { before, after };
  } catch (e) {
    try {
      await fs.promises.unlink(tmp);
    } catch {
      /* ignore */
    }
    throw e;
  }
}

async function main() {
  const names = await fs.promises.readdir(IMG_DIR);
  let totalBefore = 0;
  let totalAfter = 0;
  const rows = [];

  for (const name of names.sort()) {
    const lower = name.toLowerCase();
    if (!lower.endsWith(".png") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) {
      continue;
    }
    const filePath = path.join(IMG_DIR, name);
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) continue;

    const result = await compressFile(filePath);
    if (!result) continue;
    totalBefore += result.before;
    totalAfter += result.after;
    const pct = (((result.before - result.after) / result.before) * 100).toFixed(1);
    rows.push(`${name}: ${result.before} → ${result.after} (−${pct}%)`);
  }

  console.log(rows.join("\n"));
  const pct =
    totalBefore > 0 ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1) : "0";
  console.log(`\nTotal: ${totalBefore} → ${totalAfter} bytes (−${pct}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
