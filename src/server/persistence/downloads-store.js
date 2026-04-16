import * as fsStore from "@/server/persistence/downloads-store-fs";
import * as redisStore from "@/server/persistence/downloads-store-redis";
import { assertPersistenceAvailable, persistenceRedisEnabled } from "@/server/persistence/redis-client";

export { inclusiveUtcRangeDayCount } from "@/server/persistence/download-series";

export async function incrementUserDownload(userId, kind) {
  if (persistenceRedisEnabled()) return redisStore.incrementUserDownloadRedis(userId, kind);
  assertPersistenceAvailable();
  return fsStore.incrementUserDownloadFs(userId, kind);
}

export async function removeStatsForUser(userId) {
  if (persistenceRedisEnabled()) return redisStore.removeStatsForUserRedis(userId);
  assertPersistenceAvailable();
  return fsStore.removeStatsForUserFs(userId);
}

export async function getDailySeries(userId, numDays = 30) {
  if (persistenceRedisEnabled()) return redisStore.getDailySeriesRedis(userId, numDays);
  assertPersistenceAvailable();
  return fsStore.getDailySeriesFs(userId, numDays);
}

export async function getDailySeriesRange(userId, fromStr, toStr) {
  if (persistenceRedisEnabled()) return redisStore.getDailySeriesRangeRedis(userId, fromStr, toStr);
  assertPersistenceAvailable();
  return fsStore.getDailySeriesRangeFs(userId, fromStr, toStr);
}
