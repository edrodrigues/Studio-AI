import fs from "fs";
import path from "path";

const SHARES_FILE = path.join("/tmp", "tryon_shares.json");
const sharesCache = new Map<string, { id: string; images: string[]; createdAt: number }>();

function loadSharesFromDisk() {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      const data = fs.readFileSync(SHARES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => sharesCache.set(item.id, item));
      }
    }
  } catch (err) {
    console.warn("Failed to load shares from disk:", err);
  }
}

function saveSharesToDisk() {
  try {
    const list = Array.from(sharesCache.values());
    fs.writeFileSync(SHARES_FILE, JSON.stringify(list), "utf-8");
  } catch (err) {
    console.warn("Failed to save shares to disk:", err);
  }
}

loadSharesFromDisk();

export function getShare(id: string) {
  return sharesCache.get(id) || null;
}

export function setShare(id: string, images: string[]) {
  const record = { id, images, createdAt: Date.now() };
  sharesCache.set(id, record);
  saveSharesToDisk();
  return record;
}
