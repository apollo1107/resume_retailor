import {
  getDailySeriesFromUserDays,
  getDailySeriesRangeFromUserDays,
} from "@/server/persistence/download-series";
import { getRedis } from "@/server/persistence/redis-client";

const DL_KEY = "resume_retailor:download_stats:v1";

function parseDoc(raw) {
  if (raw == null) return { byUser: {} };
  if (typeof raw === "string") {
    try {
      const data = JSON.parse(raw);
      return data && typeof data.byUser === "object" ? data : { byUser: {} };
    } catch {
      return { byUser: {} };
    }
  }
  if (typeof raw === "object" && typeof raw.byUser === "object") return raw;
  return { byUser: {} };
}

async function readRaw() {
  const r = getRedis();
  const raw = await r.get(DL_KEY);
  return parseDoc(raw);
}

async function writeRaw(data) {
  const r = getRedis();
  await r.set(DL_KEY, JSON.stringify(data));
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function incrementUserDownloadRedis(userId, kind) {
  if (kind !== "cv" && kind !== "cover") return;
  const data = await readRaw();
  if (!data.byUser[userId]) data.byUser[userId] = {};
  const day = todayUtcDate();
  if (!data.byUser[userId][day]) data.byUser[userId][day] = { cv: 0, cover: 0 };
  data.byUser[userId][day][kind] += 1;
  await writeRaw(data);
}

export async function removeStatsForUserRedis(userId) {
  const data = await readRaw();
  if (data.byUser[userId]) {
    delete data.byUser[userId];
    await writeRaw(data);
  }
}

export async function getDailySeriesRedis(userId, numDays = 30) {
  const data = await readRaw();
  const userDays = data.byUser[userId] || {};
  return getDailySeriesFromUserDays(userDays, numDays);
}

export async function getDailySeriesRangeRedis(userId, fromStr, toStr) {
  const data = await readRaw();
  const userDays = data.byUser[userId] || {};
  return getDailySeriesRangeFromUserDays(userDays, fromStr, toStr);
}
