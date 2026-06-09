import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Jimp } from "jimp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "assets", "icon-source.png");
const iconPath = path.join(root, "assets", "icon.png");

async function buildSquareIcon(size, paddingRatio = 0.08) {
  const source = await Jimp.read(sourcePath);
  const canvas = new Jimp({ width: size, height: size, color: 0xffffffff });
  const inner = Math.round(size * (1 - paddingRatio * 2));
  source.scaleToFit({ w: inner, h: inner });
  const x = Math.round((size - source.bitmap.width) / 2);
  const y = Math.round((size - source.bitmap.height) / 2);
  canvas.composite(source, x, y);
  return canvas;
}

async function writePng(image, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await image.write(targetPath);
}

async function main() {
  const icon1024 = await buildSquareIcon(1024);
  await writePng(icon1024, iconPath);

  const pwa192 = await buildSquareIcon(192);
  const pwa512 = await buildSquareIcon(512);
  const favicon = await buildSquareIcon(32);

  await writePng(pwa192, path.join(root, "public", "pwa-192x192.png"));
  await writePng(pwa512, path.join(root, "public", "pwa-512x512.png"));
  await writePng(favicon, path.join(root, "public", "favicon.png"));
  await copyFile(path.join(root, "public", "favicon.png"), path.join(root, "public", "favicon.ico"));

  console.log("Generated assets/icon.png, public/pwa-*.png, public/favicon.ico");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
