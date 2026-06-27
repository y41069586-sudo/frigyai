import { Jimp } from "jimp";
import { copyFileSync } from "fs";

const SOURCES = {
  male: "C:/Users/doaa5/.cursor/projects/c-Users-doaa5-frigyai/assets/c__Users_doaa5_AppData_Roaming_Cursor_User_workspaceStorage_1d1ccc4be6822ff80a9c06070fba315c_images_Image__30_-2ded862e-c38a-471e-a769-5f8cee9c0f26.png",
  female: "C:/Users/doaa5/.cursor/projects/c-Users-doaa5-frigyai/assets/c__Users_doaa5_AppData_Roaming_Cursor_User_workspaceStorage_1d1ccc4be6822ff80a9c06070fba315c_images_Image__29_-f9451577-2ae0-4f97-824b-aa68fe962528.png",
};

const SELECTED_BG = { r: 212, g: 255, b: 234 }; // #D4FFEA

function isNearWhite(r, g, b) {
  return r > 230 && g > 230 && b > 230;
}

async function buildSelected(srcPath, outPath) {
  const img = await Jimp.read(srcPath);
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (_x, _y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (isNearWhite(r, g, b)) {
      this.bitmap.data[idx] = SELECTED_BG.r;
      this.bitmap.data[idx + 1] = SELECTED_BG.g;
      this.bitmap.data[idx + 2] = SELECTED_BG.b;
      this.bitmap.data[idx + 3] = 255;
    }
  });
  await img.write(outPath);
}

for (const [id, src] of Object.entries(SOURCES)) {
  const base = `public/gender-${id}.png`;
  const selected = `public/gender-${id}-selected.png`;
  copyFileSync(src, base);
  await buildSelected(src, selected);
  console.log("built", base, selected);
}
