import { getMongoDb } from "@/lib/db/mongo";
import {
  getDailySeriesFromUserDays,
  getDailySeriesRangeFromUserDays,
} from "@/server/persistence/download-series";

const DOC_ID = "download_stats";

async function coll() {
  const db = await getMongoDb();
  return db.collection("download_stats");
}

export async function incrementUserDownloadMongo(userId, kind) {
  if (kind !== "cv" && kind !== "cover") return;
  const day = new Date().toISOString().slice(0, 10);
  const c = await coll();
  await c.updateOne(
    { _id: DOC_ID },
    { $inc: { [`byUser.${userId}.${day}.${kind}`]: 1 } },
    { upsert: true }
  );
}

export async function removeStatsForUserMongo(userId) {
  const c = await coll();
  await c.updateOne({ _id: DOC_ID }, { $unset: { [`byUser.${userId}`]: "" } }, { upsert: true });
}

export async function getDailySeriesMongo(userId, numDays = 30) {
  const c = await coll();
  const doc = await c.findOne({ _id: DOC_ID });
  const raw = doc?.byUser?.[userId];
  const userDays = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return getDailySeriesFromUserDays(userDays, numDays);
}

export async function getDailySeriesRangeMongo(userId, fromStr, toStr) {
  const c = await coll();
  const doc = await c.findOne({ _id: DOC_ID });
  const raw = doc?.byUser?.[userId];
  const userDays = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return getDailySeriesRangeFromUserDays(userDays, fromStr, toStr);
}
