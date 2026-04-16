import * as fsStore from "@/server/persistence/downloads-store-fs";

export { inclusiveUtcRangeDayCount } from "@/server/persistence/download-series";

export async function incrementUserDownload(userId, kind) {
  return fsStore.incrementUserDownloadFs(userId, kind);
}

export async function removeStatsForUser(userId) {
  return fsStore.removeStatsForUserFs(userId);
}

export async function getDailySeries(userId, numDays = 30) {
  return fsStore.getDailySeriesFs(userId, numDays);
}

export async function getDailySeriesRange(userId, fromStr, toStr) {
  return fsStore.getDailySeriesRangeFs(userId, fromStr, toStr);
}
