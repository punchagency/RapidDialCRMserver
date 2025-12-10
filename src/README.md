# RapidDialCRM Server

Backend API server for RapidDialCRM - a sales and appointment scheduling CRM system.

## Overview

This is the Express.js backend that provides:

- RESTful API endpoints for prospect and appointment management
- Database operations using Drizzle ORM with PostgreSQL
- Twilio integration for calling features
- LiveKit integration for real-time communications
- User authentication and authorization
- Geocoding services via HERE Maps API

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon serverless PostgreSQL)
- Twilio account (for calling features)
- LiveKit account (for real-time features)
- HERE Maps API key (for geocoding)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

3. Update the `.env` file with your actual values (see Environment Variables section below)

4. Push database schema:

```bash
npm run db:push
```

5. (Optional) Seed initial data:

```bash
npm run dev
# Then in another terminal:
tsx seedData.ts
# Or for all data:
tsx seedAllData.ts
```

## Environment Variables

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string (e.g., from Neon or local PostgreSQL)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (`development` or `production`)

### Twilio Configuration (Required for calling features)

- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_API_KEY` - Twilio API Key for client SDK
- `TWILIO_API_SECRET` - Twilio API Secret
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number (E.164 format)
- `TWILIO_TWIML_APP_SID` - TwiML App SID for voice

### LiveKit Configuration (Required for real-time features)

- `LIVEKIT_API_KEY` - LiveKit API Key
- `LIVEKIT_API_SECRET` - LiveKit API Secret
- `LIVEKIT_URL` - LiveKit server URL (e.g., `wss://your-project.livekit.cloud`)

### Optional Variables

- `HERE_API_KEY` - HERE Maps API key for geocoding
- `REPLIT_DOMAINS` - For Replit deployments
- `REPLIT_CONNECTORS_HOSTNAME` - For Replit connectors
- `REPL_IDENTITY` - For Replit identity
- `WEB_REPL_RENEWAL` - For Replit web renewal

## Development

Start the development server with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the PORT you specified)

## Scripts

- `npm run dev` - Start development server with tsx watch mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type-check TypeScript
- `npm run db:push` - Push database schema changes

## API Endpoints

### Prospects

- `GET /api/prospects` - List all prospects
- `GET /api/prospects/:id` - Get prospect by ID
- `POST /api/prospects` - Create new prospect
- `PATCH /api/prospects/:id` - Update prospect
- `GET /api/prospects/territory/:territory` - List prospects by territory

### Appointments

- `GET /api/appointments` - List appointments
- `GET /api/appointments/today` - Today's appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment

### Field Reps

- `GET /api/field-reps` - List field reps
- `POST /api/field-reps` - Create field rep
- `PATCH /api/field-reps/:id` - Update field rep

### Users & Auth

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user
- `GET /api/users` - List all users (admin)

### Twilio

- `POST /api/twilio/token` - Generate Twilio client token
- `POST /api/twilio/voice` - TwiML voice webhook
- `POST /api/twilio/status` - Call status callback

### LiveKit

- `POST /api/livekit/token` - Generate LiveKit token

## Database Schema

The database schema is located in `src/db/schema.ts` and includes:

- **prospects** - Business prospects and leads
- **field_reps** - Field sales representatives
- **appointments** - Scheduled appointments
- **call_history** - Call attempt records
- **stakeholders** - Business stakeholders/contacts
- **users** - System users with RBAC
- **user_territories** - User-territory assignments
- **user_professions** - User-profession assignments
- **specialty_colors** - UI color coding for specialties
- **call_outcomes** - Predefined call outcome options
- **issues** - Project tracking/issues (Linear integration)

## Project Structure

```
server-new/
├── src/
│   ├── db/
│   │   └── schema.ts         # Database schema definitions
│   ├── services/
│   │   ├── twilio.ts         # Twilio service functions
│   │   ├── livekit.ts        # LiveKit service functions
│   │   ├── geocoding.ts      # HERE Maps geocoding
│   │   ├── linear.ts         # Linear API integration
│   │   └── optimization.ts   # Route optimization
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API route definitions
│   └── storage.ts            # Database operations layer
├── migrations/               # Drizzle database migrations
├── seedData.ts              # Database seeding script
├── seedAllData.ts           # Complete data seeding
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── .env.example
```

## Deployment

### Building for Production

```bash
npm run build
```

This creates a bundled `dist/index.js` file.

### Running in Production

```bash
NODE_ENV=production npm start
```

Make sure all environment variables are properly set in your production environment.

## Security Notes

- Never commit `.env` file to version control
- Use strong passwords and rotate API keys regularly
- Implement rate limiting in production
- Use HTTPS in production
- Validate all user inputs
- Keep dependencies updated

## Troubleshooting

### Database connection issues

- Verify `DATABASE_URL` is correct
- Check network connectivity to database
- Ensure database exists and is accessible

### Twilio not working

- Verify all Twilio environment variables are set
- Check Twilio console for account status
- Ensure phone number is verified

### Port already in use

- Change `PORT` in `.env` file
- Kill process using the port: `lsof -ti:5000 | xargs kill` (macOS/Linux)

## License

MIT
