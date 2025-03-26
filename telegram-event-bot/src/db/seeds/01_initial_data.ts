import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('event_reminders').del();
  await knex('rsvps').del();
  await knex('events').del();
  await knex('users').del();

  // Insert test users
  const [user1, user2] = await knex('users').insert([
    {
      telegram_id: '123456789',
      username: 'user1',
      first_name: 'Test',
      last_name: 'User1'
    },
    {
      telegram_id: '987654321',
      username: 'user2',
      first_name: 'Test',
      last_name: 'User2'
    }
  ]).returning('*');

  // Insert test events
  const [event1, event2] = await knex('events').insert([
    {
      title: 'Tech Meetup',
      description: 'A meetup to discuss latest tech trends',
      start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours after start
      location: 'Tech Hub, Downtown',
      max_participants: 50,
      creator_id: user1.id,
      is_private: false,
      event_code: 'TECH2023'
    },
    {
      title: 'Private Dinner',
      description: 'A private dinner for team members',
      start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours after start
      location: 'Fancy Restaurant',
      max_participants: 10,
      creator_id: user2.id,
      is_private: true,
      event_code: 'DINNER2023'
    }
  ]).returning('*');

  // Insert RSVPs
  await knex('rsvps').insert([
    {
      user_id: user1.id,
      event_id: event2.id,
      status: 'attending',
      notes: 'Looking forward to it!'
    },
    {
      user_id: user2.id,
      event_id: event1.id,
      status: 'maybe',
      notes: 'Will try to make it'
    }
  ]);

  // Insert event reminders
  await knex('event_reminders').insert([
    {
      event_id: event1.id,
      user_id: user2.id,
      reminder_time: new Date(event1.start_time.getTime() - 24 * 60 * 60 * 1000), // 1 day before
      is_sent: false
    },
    {
      event_id: event2.id,
      user_id: user1.id,
      reminder_time: new Date(event2.start_time.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
      is_sent: false
    }
  ]);
} 