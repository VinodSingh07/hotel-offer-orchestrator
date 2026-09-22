import { createClient } from "redis";
import { Hotel } from "../types/hotel";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        return new Error("Redis connection retry limit reached");
      }
      return 500;
    }
  }
});

redis.on("error", (error) => {
  // Silent warning for redis errors when offline
  if (process.env.NODE_ENV !== "test") {
    console.warn("[Redis] Client connection warning:", error?.message || error);
  }
});

let isConnecting = false;

async function ensureRedisConnection() {
  if (!redis.isOpen && !isConnecting) {
    isConnecting = true;
    try {
      await redis.connect();
    } catch (err) {
      console.error("Failed to connect to Redis:", err);
    } finally {
      isConnecting = false;
    }
  }
}

function getRedisKey(city: string) {
  return `hotels:${city.toLowerCase()}`;
}

export async function saveHotels(
  city: string,
  hotels: Hotel[]
) {
  try {
    await ensureRedisConnection();
    if (!redis.isOpen) return;

    const key = getRedisKey(city);

    // Delete existing key to store fresh deduplicated result set
    await redis.del(key);

    if (hotels.length === 0) {
      return;
    }

    const entries = hotels.map((hotel) => ({
      score: hotel.price,
      value: JSON.stringify({
        name: hotel.name,
        price: hotel.price,
        supplier: hotel.supplier,
        commissionPct: hotel.commissionPct
      })
    }));

    await redis.zAdd(key, entries);
    console.log(`[Redis] Stored ${hotels.length} hotel offers in Redis key: '${key}'`);
  } catch (error) {
    console.error("[Redis] Error saving hotels:", error);
  }
}

export async function getHotelsByPrice(
  city: string,
  minPrice?: number,
  maxPrice?: number
) {
  try {
    await ensureRedisConnection();
    if (!redis.isOpen) {
      console.warn("[Redis] Client not connected. Falling back to empty array.");
      return [];
    }

    const key = getRedisKey(city);

    const min = minPrice !== undefined ? minPrice : "-inf";
    const max = maxPrice !== undefined ? maxPrice : "+inf";

    // Use zRange with BY SCORE option or zRangeByScore
    let results: string[] = [];

    if (typeof (redis as any).zRangeByScore === "function") {
      results = await (redis as any).zRangeByScore(key, min, max);
    } else {
      results = await redis.zRange(key, String(min), String(max), { BY: "SCORE" });
    }

    return results.map((item) => JSON.parse(item));
  } catch (error) {
    console.error("[Redis] Error fetching hotels by price range:", error);
    return [];
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    await ensureRedisConnection();
    if (!redis.isOpen) return false;
    const response = await redis.ping();
    return response === "PONG";
  } catch {
    return false;
  }
}