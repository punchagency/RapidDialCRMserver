# CRM Backend

Node.js backend server for the CRM application, built with TypeScript and Object-Oriented Programming principles.

## Structure

```
crm-backend/
├── server.ts              # Application entry point
├── tsconfig.json          # TypeScript configuration
├── config/
│   ├── security.ts        # Security configuration and middleware
│   └── database.ts        # TypeORM database connection and configuration
├── core/
│   └── Server.ts          # Server class for Express configuration
├── routes/
│   └── index.ts           # API routes manager
├── src/
│   ├── entities/          # TypeORM entity files
│   ├── migrations/        # Database migrations
│   └── subscribers/       # TypeORM subscribers
└── package.json
```

## Features

- **TypeScript**: Full TypeScript support with strict type checking
- **OOP Architecture**: Built with classes and proper separation of concerns
- **TypeORM Integration**: Database connection management with TypeORM
- **Database Support**: PostgreSQL, MySQL, and SQLite support
- **Security**: Helmet, CORS, and rate limiting configured
- **Routes Management**: Organized route structure with versioning
- **Error Handling**: Centralized error handling middleware
- **Health Checks**: Built-in health check endpoint
- **Environment Configuration**: Support for environment variables
- **Graceful Shutdown**: Proper cleanup on application termination

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update environment variables as needed

### Database Configuration

The application supports multiple database types via TypeORM:

- **PostgreSQL** (default)
- **MySQL/MariaDB**
- **SQLite**

Configure your database in `.env`:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=crm_db
DB_SYNCHRONIZE=false  # Set to true only in development
```

## Running the Server

### Development
```bash
npm run dev
```
This uses `nodemon` with `ts-node` to run TypeScript files directly with hot reload and auto-restart on file changes.

### Production
```bash
npm run build  # Compile TypeScript to JavaScript
npm start      # Run the compiled JavaScript
```

### Type Checking
```bash
npm run type-check
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API information endpoint
- `GET /api/v1/contacts` - Contacts endpoint (placeholder)
- `GET /api/v1/users` - Users endpoint (placeholder)
- `GET /api/v1/dashboard` - Dashboard endpoint (placeholder)

## Architecture

### Database Connection (`config/database.ts`)

The `DatabaseManager` class handles all database operations:
- Singleton pattern for database connection
- Supports PostgreSQL, MySQL, and SQLite
- Automatic connection initialization
- Graceful connection closing
- Fully typed with TypeScript

### Routes (`routes/index.ts`)

The `RoutesManager` class manages all API routes:
- Versioned API structure (`/api/v1`)
- Organized route definitions
- Database-aware route handlers
- Easy to extend with new endpoints
- Type-safe request/response handling

### Entry Point (`server.ts`)

The `Application` class orchestrates the entire application:
- Initializes security middleware
- Connects to database
- Sets up routes
- Starts the server
- Handles graceful shutdown
- Fully typed with TypeScript

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Ready for express-validator integration

## TypeORM Entities

Create your entities in `src/entities/` directory. Example:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;
}
```

Then import and use them in your routes via the database manager.

## TypeScript Configuration

The project uses TypeScript with strict mode enabled. Key configuration:
- **Target**: ES2022
- **Module**: ESNext
- **Strict**: Enabled
- **Decorators**: Enabled (for TypeORM)
- **Source Maps**: Enabled for debugging

All files are compiled to the `dist/` directory for production.

