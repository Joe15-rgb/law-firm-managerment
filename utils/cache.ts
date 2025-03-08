import { createClient } from 'redis';
import { errorLogger, requestLogger } from './logger';

const redisClient = createClient({
   url: process.env.REDIS_URL,
});

redisClient.on('error', (err) =>
   errorLogger(new Error('Redis error'), { error: err })
);

const connectRedis = async () => {
   if (!redisClient.isOpen) {
      await redisClient.connect();
   }
};

export const getCache = async (key: string) => {
   await connectRedis();
   const data = await redisClient.get(key);
   return data ? JSON.parse(data) : null;
};

export const setCache = async (key: string, value: unknown, ttl = 3600) => {
   await connectRedis();
   await redisClient.set(key, JSON.stringify(value), { EX: ttl });
};

export const invalidateCacheByPrefix = async (key: string) => {
   await connectRedis();
   await Promise.all([redisClient.del(key), redisClient.del(key)]);
};

export const invalidateUserCache = async (userId: number | string) => {
   await connectRedis();
   await Promise.all([
      redisClient.del(`user:${userId}`),
      redisClient.del('users:all'),
   ]);
};
