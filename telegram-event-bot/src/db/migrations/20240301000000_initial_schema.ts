import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('telegram_id').unique().notNullable();
    table.string('username').unique();
    table.string('first_name');
    table.string('last_name');
    table.timestamps(true, true);
  });

  // Create events table
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time');
    table.string('location');
    table.integer('max_participants');
    table.integer('creator_id').references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_private').defaultTo(false);
    table.string('event_code').unique();
    table.timestamps(true, true);
  });

  // Create rsvps table
  await knex.schema.createTable('rsvps', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.enum('status', ['attending', 'maybe', 'not_attending']).defaultTo('attending');
    table.timestamp('rsvp_time').defaultTo(knex.fn.now());
    table.text('notes');
    table.unique(['user_id', 'event_id']);
    table.timestamps(true, true);
  });

  // Create event_reminders table
  await knex.schema.createTable('event_reminders', (table) => {
    table.increments('id').primary();
    table.integer('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('reminder_time').notNullable();
    table.boolean('is_sent').defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('event_reminders');
  await knex.schema.dropTableIfExists('rsvps');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('users');
} 