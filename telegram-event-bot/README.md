# Telegram Event Bot

A Telegram bot for event management. Users can create events, RSVP to events, receive reminders, and more.

## Project Structure

```
telegram-event-bot/
├── src/               # Source code
│   ├── api/           # API endpoints
│   ├── bot/           # Telegram bot implementation
│   ├── db/            # Database connections and migrations
│   ├── models/        # Data models
│   ├── services/      # Business logic
│   ├── utils/         # Helper functions
│   └── webapp/        # Web application
├── tests/             # Test files
├── config/            # Configuration files
└── scripts/           # Utility scripts
```

## Prerequisites

- Node.js (v14+)
- PostgreSQL
- Redis

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd telegram-event-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses PostgreSQL with the following schema:

- **Users**: Store user information from Telegram
- **Events**: Event details including title, description, time, location
- **RSVPs**: Track user responses to events
- **Event Reminders**: Scheduled reminders for upcoming events

## Key Features

- Create and manage events
- RSVP to events
- Public and private events
- Event reminders
- Event search and filtering

## Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Caching**: Redis
- **Telegram API**: Telegraf
- **Payments**: Stripe (if needed)

## Development

- Run tests: `npm test`
- Build for production: `npm run build`
- Start production server: `npm start`

## Contributing

Please read the CONTRIBUTING.md file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License. 