import { createClient } from 'redis';
import { logger } from '../utils/logger';

class RedisService {
  private static instance: RedisService;
  private client;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    await this.client.connect();
  }

  public async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  public async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    try {
      if (expireInSeconds) {
        await this.client.set(key, value, { EX: expireInSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
      throw error;
    }
  }

  // Method to schedule a reminder
  public async scheduleReminder(eventId: number, userId: number, timestamp: number): Promise<void> {
    const key = `reminder:${eventId}:${userId}`;
    await this.set(key, timestamp.toString());
  }

  // Method to get all pending reminders
  public async getPendingReminders(): Promise<{ eventId: number; userId: number; timestamp: number }[]> {
    const pattern = 'reminder:*';
    const keys = await this.client.keys(pattern);
    const reminders = [];

    for (const key of keys) {
      const timestamp = await this.get(key);
      if (timestamp) {
        const [, eventId, userId] = key.split(':');
        reminders.push({
          eventId: parseInt(eventId),
          userId: parseInt(userId),
          timestamp: parseInt(timestamp),
        });
      }
    }

    return reminders;
  }

  // Method to remove a reminder
  public async removeReminder(eventId: number, userId: number): Promise<void> {
    const key = `reminder:${eventId}:${userId}`;
    await this.delete(key);
  }
}

export const redis = RedisService.getInstance(); 