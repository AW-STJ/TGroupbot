import { BotService } from './services/bot';
import { ReminderService } from './services/reminder';
import { redis } from './services/redis';
import { logger } from './utils/logger';

async function main() {
  try {
    // Connect to Redis
    await redis.connect();

    // Start bot service
    const bot = BotService.getInstance();
    await bot.start();

    // Start reminder service
    const reminderService = ReminderService.getInstance();
    await reminderService.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      await bot.stop();
      await reminderService.stop();
      await redis.disconnect();
      process.exit(0);
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

main(); 