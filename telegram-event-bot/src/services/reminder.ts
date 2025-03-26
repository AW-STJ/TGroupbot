import { BotService } from './bot';
import { redis } from './redis';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export class ReminderService {
  private static instance: ReminderService;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  public async start(): Promise<void> {
    // Check for reminders every minute
    this.checkInterval = setInterval(async () => {
      await this.checkReminders();
    }, 60 * 1000);

    logger.info('Reminder service started');
  }

  public async stop(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    logger.info('Reminder service stopped');
  }

  private async checkReminders(): Promise<void> {
    try {
      const now = Date.now();
      const reminders = await redis.getPendingReminders();

      for (const reminder of reminders) {
        if (reminder.timestamp <= now) {
          await this.sendReminder(reminder.eventId, reminder.userId);
          await redis.removeReminder(reminder.eventId, reminder.userId);
        }
      }
    } catch (error) {
      logger.error('Error checking reminders:', error);
    }
  }

  private async sendReminder(eventId: number, userId: number): Promise<void> {
    try {
      const event = await Event.findById(eventId);
      const user = await User.findById(userId);

      if (!event || !user) {
        return;
      }

      const message = `🔔 Reminder: "${event.title}" is starting soon!\n\n` +
        `📅 Date: ${event.event_date}\n` +
        `⏰ Time: ${event.event_time}\n` +
        `📍 Location: ${event.location || 'TBD'}`;

      const bot = BotService.getInstance();
      await bot.sendMessage(user.telegram_id, message);

      logger.info(`Sent reminder to user ${userId} for event ${eventId}`);
    } catch (error) {
      logger.error('Error sending reminder:', error);
    }
  }

  public async scheduleReminder(eventId: number, userId: number, minutesBefore: number): Promise<void> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const eventTime = new Date(`${event.event_date}T${event.event_time}`).getTime();
      const reminderTime = eventTime - (minutesBefore * 60 * 1000);

      await redis.scheduleReminder(eventId, userId, reminderTime);
      logger.info(`Scheduled reminder for user ${userId} for event ${eventId}`);
    } catch (error) {
      logger.error('Error scheduling reminder:', error);
      throw error;
    }
  }
} 