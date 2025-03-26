import { Telegraf, Context } from 'telegraf';
import { Event } from '../models/Event';
import { User, UserData } from '../models/User';
import { RSVP } from '../models/RSVP';
import { redis } from './redis';
import { logger } from '../utils/logger';
import { ReminderService } from './reminder';

interface BotContext extends Context {
  user?: UserData;
}

export class BotService {
  private bot: Telegraf<BotContext>;
  private static instance: BotService;

  private constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    this.bot = new Telegraf<BotContext>(token);
    this.setupMiddleware();
    this.setupCommands();
  }

  public static getInstance(): BotService {
    if (!BotService.instance) {
      BotService.instance = new BotService();
    }
    return BotService.instance;
  }

  private setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      try {
        if (!ctx.from) {
          logger.warn('Middleware - No user data found');
          return next();
        }

        const telegramId = ctx.from.id.toString();
        logger.info('Middleware - Telegram ID:', telegramId);
        
        // Get or create user
        const user = await User.findByTelegramId(telegramId);
        logger.info('Middleware - Found user:', user);

        if (!user) {
          logger.info('Middleware - Creating new user with data:', {
            telegram_id: telegramId,
            username: ctx.from.username,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
          });

          const newUser = await User.create({
            telegram_id: telegramId,
            username: ctx.from.username,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
          });
          logger.info('Middleware - New user created:', newUser);
          ctx.user = newUser;
        } else {
          logger.info('Middleware - Using existing user:', user);
          ctx.user = user;
        }

        return next();
      } catch (error) {
        logger.error('Error in bot middleware:', error);
        return next();
      }
    });
  }

  private setupCommands() {
    // Start command
    this.bot.command('start', async (ctx) => {
      const message = `Welcome to Event Bot! 🎉\n\n` +
        `Here are the available commands:\n` +
        `/create - Create a new event\n` +
        `/events - List all events\n` +
        `/myevents - List your events\n` +
        `/help - Show this help message`;
      
      await ctx.reply(message);
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      const message = `Available commands:\n\n` +
        `/create - Create a new event\n` +
        `/events - List all events\n` +
        `/myevents - List your events\n` +
        `/remind <event_id> <minutes> - Set a reminder for an event\n` +
        `/help - Show this help message`;
      
      await ctx.reply(message);
    });

    // Create event command
    this.bot.command('create', async (ctx) => {
      if (!ctx.user) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      const message = `Let's create a new event! Please provide the following information:\n\n` +
        `Title: (e.g., Team Meeting)\n` +
        `Date: (YYYY-MM-DD)\n` +
        `Time: (HH:MM)\n` +
        `Description: (optional)\n` +
        `Location: (optional)\n\n` +
        `Please send the information in this format:\n` +
        `create:Team Meeting:2024-03-20:14:00:Weekly team sync:Office`;

      await ctx.reply(message);
    });

    // List events command
    this.bot.command('events', async (ctx) => {
      try {
        const events = await Event.findAll();
        if (events.length === 0) {
          await ctx.reply('No events found.');
          return;
        }

        const message = await Promise.all(events.map(async event => {
          const attendees = await RSVP.getEventAttendees(event.id!);
          return `📅 ${event.title}\n` +
            `📅 Date: ${event.start_time}\n` +
            `⏰ Time: ${event.start_time}\n` +
            `📍 Location: ${event.location || 'TBD'}\n` +
            `👥 RSVPs: ${attendees.length}\n` +
            `\nTo RSVP, use: /rsvp ${event.id}\n` +
            `To set a reminder, use: /remind ${event.id} <minutes>`;
        }));

        await ctx.reply(message.join('\n\n'));
      } catch (error) {
        logger.error('Error listing events:', error);
        await ctx.reply('Sorry, there was an error listing events.');
      }
    });

    // My events command
    this.bot.command('myevents', async (ctx) => {
      if (!ctx.user) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      try {
        const events = await Event.findByCreator(ctx.user.id!);
        if (events.length === 0) {
          await ctx.reply('You haven\'t created any events yet.');
          return;
        }

        const message = await Promise.all(events.map(async event => {
          const attendees = await RSVP.getEventAttendees(event.id!);
          return `📅 ${event.title}\n` +
            `📅 Date: ${event.start_time}\n` +
            `⏰ Time: ${event.start_time}\n` +
            `📍 Location: ${event.location || 'TBD'}\n` +
            `👥 RSVPs: ${attendees.length}\n` +
            `\nTo manage RSVPs, use: /rsvps ${event.id}`;
        }));

        await ctx.reply(message.join('\n\n'));
      } catch (error) {
        logger.error('Error listing user events:', error);
        await ctx.reply('Sorry, there was an error listing your events.');
      }
    });

    // RSVP command
    this.bot.command('rsvp', async (ctx) => {
      if (!ctx.user) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      const args = ctx.message.text.split(' ');
      if (args.length !== 2) {
        await ctx.reply('Please provide an event ID. Usage: /rsvp <event_id>');
        return;
      }

      const eventId = parseInt(args[1]);
      if (isNaN(eventId)) {
        await ctx.reply('Invalid event ID. Please provide a valid number.');
        return;
      }

      try {
        const event = await Event.findById(eventId);
        if (!event) {
          await ctx.reply('Event not found.');
          return;
        }

        const existingRSVP = await RSVP.findByUserAndEvent(ctx.user.id!, eventId);
        if (existingRSVP) {
          await ctx.reply('You have already RSVP\'d to this event.');
          return;
        }

        await RSVP.create({
          event_id: eventId,
          user_id: ctx.user.id!,
          status: 'attending',
        });

        await ctx.reply(`You have successfully RSVP'd to "${event.title}"!\n\n` +
          `Would you like to set a reminder? Use:\n` +
          `/remind ${event.id} <minutes>`);
      } catch (error) {
        logger.error('Error processing RSVP:', error);
        await ctx.reply('Sorry, there was an error processing your RSVP.');
      }
    });

    // Remind command
    this.bot.command('remind', async (ctx) => {
      if (!ctx.user) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      const args = ctx.message.text.split(' ');
      if (args.length !== 3) {
        await ctx.reply('Please provide an event ID and minutes. Usage: /remind <event_id> <minutes>');
        return;
      }

      const eventId = parseInt(args[1]);
      const minutes = parseInt(args[2]);

      if (isNaN(eventId) || isNaN(minutes)) {
        await ctx.reply('Invalid event ID or minutes. Please provide valid numbers.');
        return;
      }

      if (minutes <= 0) {
        await ctx.reply('Please provide a positive number of minutes.');
        return;
      }

      try {
        const event = await Event.findById(eventId);
        if (!event) {
          await ctx.reply('Event not found.');
          return;
        }

        const reminderService = ReminderService.getInstance();
        await reminderService.scheduleReminder(eventId, ctx.user.id!, minutes);

        await ctx.reply(`✅ Reminder set! You will be notified ${minutes} minutes before the event.`);
      } catch (error) {
        logger.error('Error setting reminder:', error);
        await ctx.reply('Sorry, there was an error setting the reminder.');
      }
    });

    // Handle create event message
    this.bot.hears(/^create:(.+):(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2}):(.+):(.+)$/, async (ctx) => {
      if (!ctx.user) {
        await ctx.reply('Please start the bot first with /start');
        return;
      }

      const match = ctx.message.text.match(/^create:(.+):(\d{4}-\d{2}-\d{2}):(\d{2}:\d{2}):(.+):(.+)$/);
      if (!match) {
        await ctx.reply('Invalid format. Please use the format shown in the /create command.');
        return;
      }

      const [, title, date, time, description, location] = match;

      try {
        const startTime = new Date(`${date}T${time}`);
        const event = await Event.create({
          title,
          description,
          start_time: startTime,
          location,
          creator_id: ctx.user.id!,
          is_private: false,
        });

        await ctx.reply(`Event "${title}" created successfully!\n\n` +
          `To view all events, use /events\n` +
          `To RSVP to this event, use: /rsvp ${event.id}\n` +
          `To set a reminder, use: /remind ${event.id} <minutes>`);
      } catch (error) {
        logger.error('Error creating event:', error);
        await ctx.reply('Sorry, there was an error creating the event.');
      }
    });
  }

  public async sendMessage(telegramId: number, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(telegramId, message);
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  public async start() {
    try {
      await this.bot.launch();
      logger.info('Bot started successfully');
    } catch (error) {
      logger.error('Error starting bot:', error);
      throw error;
    }
  }

  public async stop() {
    try {
      await this.bot.stop();
      logger.info('Bot stopped successfully');
    } catch (error) {
      logger.error('Error stopping bot:', error);
      throw error;
    }
  }
}