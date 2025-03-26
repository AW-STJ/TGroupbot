require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'telegram_event_bot',
  user: process.env.POSTGRES_USER || 'stj',
  password: process.env.POSTGRES_PASSWORD || '',
});

console.log('Connection settings:', {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'telegram_event_bot',
  user: process.env.POSTGRES_USER || 'stj',
  password: process.env.POSTGRES_PASSWORD ? '***' : '',
});

client.connect()
  .then(() => {
    console.log('Successfully connected to the database');
    return client.query('SELECT current_user, current_database()');
  })
  .then(res => {
    console.log('Current user:', res.rows[0].current_user);
    console.log('Current database:', res.rows[0].current_database);
    return client.end();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }); 