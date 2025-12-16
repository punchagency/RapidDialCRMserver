# CRM Backend API

A robust, production-ready Node.js backend server for the RapidDial CRM application, built with TypeScript and Object-Oriented Programming principles.

## 🚀 Features

- **TypeScript**: Full type safety with strict mode enabled
- **OOP Architecture**: Clean class-based structure with separation of concerns
- **TypeORM**: Powerful ORM with support for PostgreSQL, MySQL, and SQLite
- **RESTful API**: Comprehensive REST endpoints for all CRM operations
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Third-Party Integrations**: Twilio, LiveKit, HERE Maps, Linear
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Structured logging with Morgan
- **Health Checks**: Built-in health monitoring endpoints

## 📋 Prerequisites

- Node.js 18+ and yarn
- Database: PostgreSQL, MySQL, or SQLite
- (Optional) Twilio account for calling features
- (Optional) LiveKit account for real-time communication
- (Optional) HERE Maps API key for geocoding
- (Optional) Linear API key for issue tracking

## 🛠️ Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd crm-backend
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.development
   ```

4. **Configure your `.env.development` file:**
   ```env
   # Server Configuration
   PORT=3001
   HOST=localhost
   NODE_ENV=development

   # Database Configuration
   DB_TYPE=mysql                    # Options: postgres, mysql, sqlite
   DB_HOST=localhost
   DB_PORT=3306                      # 5432 for PostgreSQL, 3306 for MySQL
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=recrowdly
   DB_SYNCHRONIZE=true               # Set to false in production

   # Twilio Configuration (Optional)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_phone_number

   # LiveKit Configuration (Optional)
   LIVEKIT_URL=your_livekit_url
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret

   # HERE Maps Configuration (Optional)
   HERE_API_KEY=your_here_api_key

   # Linear Configuration (Optional)
   LINEAR_API_KEY=your_linear_api_key
   ```

## 🏃 Running the Server

### Development Mode
```bash
yarn dev
```

This runs TypeScript compilation in watch mode and starts the server with nodemon for hot reloading.

### Production Mode
```bash
# Build TypeScript to JavaScript
yarn build

# Start the server
yarn start
```

### Type Checking
```bash
yarn type-check
```

## 📁 Project Structure

```
crm-backend/
├── server.ts                      # Application entry point
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
├── .env.development               # Environment variables
│
├── src/
│   ├── config/
│   │   ├── database.ts           # TypeORM database connection manager
│   │   └── security.ts           # Security middleware (Helmet, CORS, rate limiting)
│   │
│   ├── core/
│   │   └── Server.ts             # Express server configuration class
│   │
│   ├── entities/                  # TypeORM entity definitions
│   │   ├── Prospect.ts
│   │   ├── User.ts
│   │   ├── FieldRep.ts
│   │   ├── Appointment.ts
│   │   ├── Stakeholder.ts
│   │   ├── CallHistory.ts
│   │   ├── CallOutcome.ts
│   │   ├── SpecialtyColor.ts
│   │   ├── Issue.ts
│   │   ├── UserTerritory.ts
│   │   ├── UserProfession.ts
│   │   └── index.ts
│   │
│   ├── repositories/
│   │   └── StorageRepository.ts  # Data access layer (Repository pattern)
│   │
│   ├── services/                  # Business logic services
│   │   ├── TwilioService.ts      # Twilio integration for calling
│   │   ├── LiveKitService.ts     # LiveKit integration for real-time communication
│   │   ├── GeocodingService.ts   # HERE Maps geocoding
│   │   ├── OptimizationService.ts # Route optimization and priority scoring
│   │   ├── LinearService.ts      # Linear issue tracking integration
│   │   └── types.ts
│   │
│   ├── routes/
│   │   ├── index.ts              # Routes manager and setup
│   │   └── route-links.ts        # All API route definitions
│   │
│   ├── validators/
│   │   └── schemas.ts            # Zod validation schemas
│   │
│   └── logging/
│       └── logger.ts             # Logging utility
│
└── dist/                          # Compiled JavaScript (generated)
```

## 🏗️ Architecture

### Application Entry Point (`server.ts`)

The `Application` class orchestrates the entire application lifecycle:
- Initializes security middleware
- Connects to the database
- Sets up API routes
- Starts the Express server
- Handles graceful shutdown

### Database Layer (`src/config/database.ts`)

The `DatabaseManager` class:
- Manages TypeORM DataSource connection
- Supports PostgreSQL, MySQL, and SQLite
- Handles connection initialization and cleanup
- Provides singleton access to the database

### Repository Pattern (`src/repositories/StorageRepository.ts`)

The `StorageRepository` class provides:
- Type-safe data access methods
- CRUD operations for all entities
- Complex queries and filtering
- Transaction support

### Service Layer (`src/services/`)

Business logic services:
- **TwilioService**: Phone call management
- **LiveKitService**: Real-time communication
- **GeocodingService**: Address geocoding and reverse geocoding
- **OptimizationService**: Route optimization and priority scoring
- **LinearService**: Issue tracking integration

### Route Management (`src/routes/`)

- **index.ts**: Routes manager that sets up and mounts routes
- **route-links.ts**: Centralized route definitions with handlers

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`. The API also supports direct `/v1` access.

### Health & Status
- `GET /api/v1/health` - Health check endpoint
- `GET /api` - API information and status

### Prospects
- `GET /api/v1/prospects` - List all prospects (supports `territory`, `limit`, `offset` query params)
- `GET /api/v1/prospects/:id` - Get prospect by ID
- `POST /api/v1/prospects` - Create new prospect
- `PATCH /api/v1/prospects/:id` - Update prospect
- `GET /api/v1/prospects/territory/:territory` - Get prospects by territory

### Field Reps
- `GET /api/v1/field-reps` - List all field reps
- `POST /api/v1/field-reps` - Create field rep
- `PATCH /api/v1/field-reps/:id` - Update field rep

### Appointments
- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments/:fieldRepId/:date` - Get appointments by field rep and date
- `GET /api/v1/appointments/today` - Get today's appointments (supports `territory` query param)
- `PATCH /api/v1/appointments/:id` - Update appointment

### Calling List
- `GET /api/v1/calling-list/:fieldRepId` - Generate optimized calling list for field rep

### Stakeholders
- `GET /api/v1/stakeholders/:prospectId` - Get stakeholders by prospect
- `POST /api/v1/stakeholders` - Create stakeholder
- `GET /api/v1/stakeholders/detail/:id` - Get stakeholder details
- `PATCH /api/v1/stakeholders/:id` - Update stakeholder
- `DELETE /api/v1/stakeholders/:id` - Delete stakeholder

### Users
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/email/:email` - Get user by email
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### User Territories
- `GET /api/v1/users/:id/territories` - Get user territories
- `PUT /api/v1/users/:id/territories` - Set user territories
- `GET /api/v1/territories` - List all territories

### User Professions
- `GET /api/v1/users/:id/professions` - Get user professions
- `PUT /api/v1/users/:id/professions` - Set user professions
- `GET /api/v1/professions` - List all professions

### User Assignments
- `GET /api/v1/users/:id/assignments` - Get user assignments (territories + professions)
- `PUT /api/v1/users/:id/assignments` - Set user assignments

### Specialty Colors
- `GET /api/v1/specialty-colors` - List all specialty colors
- `GET /api/v1/specialty-colors/:specialty` - Get color for specialty
- `PATCH /api/v1/specialty-colors/:specialty` - Update specialty color

### Call Outcomes
- `POST /api/v1/call-outcome` - Record call outcome
- `GET /api/v1/call-outcomes` - List all call outcomes
- `POST /api/v1/call-outcomes` - Create call outcome
- `PATCH /api/v1/call-outcomes/:id` - Update call outcome
- `DELETE /api/v1/call-outcomes/:id` - Delete call outcome

### Twilio Integration
- `POST /api/v1/twilio/token` - Generate Twilio access token
- `POST /api/v1/twilio/voice` - Get TwiML for browser calls
- `POST /api/v1/twilio/call` - Make outbound call
- `POST /api/v1/twilio/status` - Call status callback
- `GET /api/v1/twilio/config` - Get Twilio configuration

### LiveKit Integration
- `GET /api/v1/livekit/config` - Get LiveKit configuration
- `POST /api/v1/livekit/token` - Generate LiveKit token
- `POST /api/v1/livekit/call` - Create call room
- `POST /api/v1/livekit/end-call` - End call and record outcome

### Geocoding
- `POST /api/v1/geocode-prospects` - Geocode all prospects without coordinates
- `POST /api/v1/recalculate-priorities` - Recalculate priority scores for prospects

### Bulk Operations
- `POST /api/v1/bulk-search` - Search professionals by specialty and location
- `POST /api/v1/bulk-add` - Bulk add contacts
- `POST /api/v1/update-prospect-addresses` - Update prospect addresses using HERE API

### Issues
- `GET /api/v1/issues` - List issues (supports `status` query param)
- `GET /api/v1/issues/:id` - Get issue by ID
- `POST /api/v1/issues` - Create issue (supports `syncToLinear` option)
- `PATCH /api/v1/issues/:id` - Update issue
- `DELETE /api/v1/issues/:id` - Delete issue

### Linear Integration
- `GET /api/v1/linear/teams` - Get Linear teams
- `GET /api/v1/linear/issues` - Get Linear issues (supports `teamId` query param)

## 📝 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "has_error": false,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "has_error": true,
  "message": "Error description",
  "data": "Additional error details"
}
```

## 🔒 Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Input Validation**: Zod schemas validate all request data
- **SQL Injection Protection**: TypeORM parameterized queries
- **XSS Protection**: Helmet's XSS filter

## 🗄️ Database

### Supported Databases

- **PostgreSQL** (recommended for production)
- **MySQL/MariaDB**
- **SQLite** (good for development/testing)

### Entity Relationships

- **Prospect** ↔ **Stakeholder** (One-to-Many)
- **Prospect** ↔ **Appointment** (One-to-Many)
- **Prospect** ↔ **CallHistory** (One-to-Many)
- **User** ↔ **UserTerritory** (One-to-Many)
- **User** ↔ **UserProfession** (One-to-Many)
- **FieldRep** ↔ **Appointment** (One-to-Many)

### Migrations

TypeORM migrations are supported. Configure migration paths in `.env`:
```env
DB_MIGRATIONS_PATH=src/migrations/**/*.ts
```

## 🧪 Development

### Adding a New Entity

1. Create entity file in `src/entities/`
2. Export from `src/entities/index.ts`
3. Add repository methods in `StorageRepository.ts`
4. Create Zod schema in `src/validators/schemas.ts`
5. Add routes in `src/routes/route-links.ts`

### Adding a New Service

1. Create service class in `src/services/`
2. Implement service methods
3. Add lazy initialization in `route-links.ts`
4. Use service in route handlers

### Adding a New Route

1. Add route definition to `src/routes/route-links.ts`
2. Define handler function
3. Add validation schema if needed
4. Test the endpoint

## 🐛 Troubleshooting

### Database Connection Issues
- Verify database credentials in `.env.development`
- Ensure database server is running
- Check database type matches `DB_TYPE` setting
- Verify network connectivity

### Port Already in Use
- Change `PORT` in `.env.development`
- Kill process using the port: `lsof -ti:3001 | xargs kill`

### TypeScript Compilation Errors
- Run `yarn type-check` to see all errors
- Ensure all imports use `.js` extension (ESM requirement)
- Check `tsconfig.json` configuration

### Module Not Found Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && yarn install`
- Verify all imports use correct paths
- Check `package.json` for missing dependencies

## 📦 Dependencies

### Core
- **express**: Web framework
- **typeorm**: ORM for database operations
- **reflect-metadata**: Required for TypeORM decorators
- **zod**: Schema validation

### Database Drivers
- **pg**: PostgreSQL driver
- **mysql2**: MySQL driver

### Security
- **helmet**: Security headers
- **cors**: CORS middleware
- **express-rate-limit**: Rate limiting

### Third-Party Integrations
- **twilio**: Phone calling
- **livekit-server-sdk**: Real-time communication
- **@linear/sdk**: Issue tracking

### Development
- **typescript**: TypeScript compiler
- **nodemon**: Development server with auto-reload
- **concurrently**: Run multiple commands

## 📄 License

MIT
