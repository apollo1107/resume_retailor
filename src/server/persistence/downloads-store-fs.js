import fs from "fs";
import path from "path";
import {
  getDailySeriesFromUserDays,
  getDailySeriesRangeFromUserDays,
} from "@/server/persistence/download-series";

const DATA_DIR = path.join(process.cwd(), "data");
const DL_PATH = path.join(DATA_DIR, "download-stats.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readRaw() {
  ensureDataDir();
  if (!fs.existsSync(DL_PATH)) return { byUser: {} };
  try {
    const data = JSON.parse(fs.readFileSync(DL_PATH, "utf8"));
    return data && typeof data.byUser === "object" ? data : { byUser: {} };
  } catch {
    return { byUser: {} };
  }
}

function writeRaw(data) {
  ensureDataDir();
  fs.writeFileSync(DL_PATH, JSON.stringify(data, null, 2), "utf8");
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export function incrementUserDownloadFs(userId, kind) {
  if (kind !== "cv" && kind !== "cover") return;
  const data = readRaw();
  if (!data.byUser[userId]) data.byUser[userId] = {};
  const day = todayUtcDate();
  if (!data.byUser[userId][day]) data.byUser[userId][day] = { cv: 0, cover: 0 };
  data.byUser[userId][day][kind] += 1;
  writeRaw(data);
}

export function removeStatsForUserFs(userId) {
  const data = readRaw();
  if (data.byUser[userId]) {
    delete data.byUser[userId];
    writeRaw(data);
  }
}

export function getDailySeriesFs(userId, numDays = 30) {
  const data = readRaw();
  const userDays = data.byUser[userId] || {};
  return getDailySeriesFromUserDays(userDays, numDays);
}

export function getDailySeriesRangeFs(userId, fromStr, toStr) {
  const data = readRaw();
  const userDays = data.byUser[userId] || {};
  return getDailySeriesRangeFromUserDays(userDays, fromStr, toStr);
}
