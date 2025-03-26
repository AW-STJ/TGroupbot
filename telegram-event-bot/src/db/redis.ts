import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Helper functions
export const setCache = async (key: string, value: any, expireSeconds?: number) => {
  try {
    const stringValue = JSON.stringify(value);
    await redisClient.set(key, stringValue);
    if (expireSeconds) {
      await redisClient.expire(key, expireSeconds);
    }
    return true;
  } catch (error) {
    console.error('Redis Set Error:', error);
    return false;
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis Get Error:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis Delete Error:', error);
    return false;
  }
};

// Background job queue helpers
export const addToQueue = async (queueName: string, data: any) => {
  try {
    await redisClient.lPush(queueName, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Redis Queue Add Error:', error);
    return false;
  }
};

export const processQueue = async (queueName: string): Promise<any | null> => {
  try {
    const data = await redisClient.rPop(queueName);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis Queue Process Error:', error);
    return null;
  }
};

export default redisClient; 