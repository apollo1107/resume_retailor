import { mongoEnabled } from "@/lib/db/mongo";
import * as fsStore from "@/server/persistence/downloads-store-fs";
import * as mongoStore from "@/server/persistence/downloads-store-mongo";

export { inclusiveUtcRangeDayCount } from "@/server/persistence/download-series";

export async function incrementUserDownload(userId, kind) {
  if (mongoEnabled()) return mongoStore.incrementUserDownloadMongo(userId, kind);
  return fsStore.incrementUserDownloadFs(userId, kind);
}

export async function removeStatsForUser(userId) {
  if (mongoEnabled()) return mongoStore.removeStatsForUserMongo(userId);
  return fsStore.removeStatsForUserFs(userId);
}

export async function getDailySeries(userId, numDays = 30) {
  if (mongoEnabled()) return mongoStore.getDailySeriesMongo(userId, numDays);
  return fsStore.getDailySeriesFs(userId, numDays);
}

export async function getDailySeriesRange(userId, fromStr, toStr) {
  if (mongoEnabled()) return mongoStore.getDailySeriesRangeMongo(userId, fromStr, toStr);
  return fsStore.getDailySeriesRangeFs(userId, fromStr, toStr);
}
