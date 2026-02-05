let redis = null;

export const connectRedis = () => {
  console.log('⚠️ Redis disabled - running without cache');
  return null;
};

export const getRedis = () => null;

// Cache utilities - return null/false when Redis is disabled
export const cacheGet = async (key) => {
  return null;
};

export const cacheSet = async (key, data, ttl = 300) => {
  return false;
};

export const cacheDelete = async (pattern) => {
  return false;
};

export default redis;

/*
import Redis from 'ioredis';

let redis = null;

export const connectRedis = () => {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null, // Required for BullMQ
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 100,
    });

    redis.on('connect', () => {
      console.log('✅ Redis Connected');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });

    return redis;
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error.message);
    return null;
  }
};

export const getRedis = () => redis;

// Cache utilities
export const cacheGet = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const cacheSet = async (key, data, ttl = 300) => {
  if (!redis) return false;
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

export const cacheDelete = async (pattern) => {
  if (!redis) return false;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

export default redis;
*/
