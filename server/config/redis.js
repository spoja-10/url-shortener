const Redis = require('ioredis');

let redis = null;

const connectRedis = () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️  Redis URL not set — caching disabled');
    return null;
  }
  try {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️  Redis unavailable — falling back to DB-only mode');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });
    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.warn(`⚠️  Redis error: ${err.message}`));
    return redis;
  } catch (err) {
    console.warn('⚠️  Redis init failed — caching disabled');
    return null;
  }
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };
