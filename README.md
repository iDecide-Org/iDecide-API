# iDecide API

Backend API for **iDecide** — an educational decision support system. Built with **NestJS** + **TypeORM** + **PostgreSQL**, with JWT authentication, Swagger docs (dev-only), file uploads, real-time chat (Socket.IO), and a security-focused middleware stack.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Running](#running)
- [API Docs (Swagger)](#api-docs-swagger)
- [Authentication](#authentication)
- [Database](#database)
- [Uploads](#uploads)
- [Testing](#testing)
- [Security Notes](#security-notes)
- [Scripts](#scripts)
- [License](#license)

## Features

- **Auth & Users**
  - JWT-based auth (`Bearer <token>`)
  - User roles/entities: `User`, `Student`, `Advisor`, `Admin`
- **Domain Modules**
  - Universities
  - Colleges
  - Majors
  - Scholarships
  - Favorites (universities & scholarships)
- **Real-time Chat**
  - Socket.IO-based chat module (see `src/chat`)
- **Email**
  - Email module for notifications and flows (see `src/email`)
- **Security & Validation**
  - Global DTO validation via `class-validator`/`class-transformer`
  - Strict request shaping: whitelist + forbid non-whitelisted fields
  - Helmet security headers + compression + cookie parsing
  - Global exception filter for sanitized errors
  - Request logging interceptor
  - Simple IP-based rate limiting interceptor

More details on the security/validation work are documented in [`SECURITY_IMPLEMENTATION.md`](./SECURITY_IMPLEMENTATION.md).

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: NestJS
- **DB**: PostgreSQL
- **ORM**: TypeORM
- **Auth**: `@nestjs/jwt`, `passport-jwt`
- **Docs**: `@nestjs/swagger`
- **Logging**: `nestjs-pino`
- **HTTP Client**: Axios
- **Uploads**: Multer
- **Realtime**: Socket.IO
- **Testing**: Jest + Supertest

## Project Structure

High-level layout:

- `src/auth` — authentication + user entities
- `src/universities` — universities domain
- `src/colleges` — colleges domain
- `src/majors` — majors domain
- `src/scholarships` — scholarships domain
- `src/favorites` — favorites domain
- `src/chat` — websocket chat
- `src/common` — filters/interceptors/validators
- `uploads/` — uploaded files (runtime directory)

The app uses a global API prefix of `api` (configured in `src/main.ts`), so routes look like:

- `http://localhost:3000/api/...`

## Requirements

- Node.js (recommended: latest LTS)
- npm
- PostgreSQL database instance

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create your `.env` file.

This project loads environment variables from `.env` (see `ConfigModule.forRoot({ envFilePath: '.env' })` in `src/app.module.ts`).

There is an `.env.example` in the repo; copy it to `.env` and fill in values.

3. Start the API in dev mode:

```bash
npm run start:dev
```

The server will start on:

- `http://localhost:3000`
- API base path: `http://localhost:3000/api`

## Environment Variables

This project expects DB configuration via environment variables (with development-friendly defaults):

- `PORT` (default: `3000`)
- `NODE_ENV` (`production` disables Swagger and TypeORM `synchronize`)

Database variables used in `src/app.module.ts`:

- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `32768`)
- `DB_USERNAME` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `DB_DATABASE` (default: `idecide`)

Other variables may be required depending on enabled features (JWT secrets, email SMTP, etc.). Use the repo’s `.env.example` as the source of truth.

## Running

### Development

```bash
npm run start:dev
```

### Debug

```bash
npm run start:debug
```

### Production build + run

```bash
npm run build
npm run start:prod
```

## API Docs (Swagger)

Swagger is enabled **only when `NODE_ENV !== 'production'`**.

Once running in dev, open:

- `http://localhost:3000/api/docs`

The Swagger setup includes JWT bearer auth under the name `JWT-auth`. Authorize using:

- `Authorization: Bearer <your_token>`

## Authentication

This API uses JWT bearer tokens. Typical flow:

1. Sign up / sign in via the auth endpoints (see Swagger in dev).
2. Receive an access token.
3. Call protected endpoints with:

- `Authorization: Bearer <token>`

User-related entities live under `src/auth/users`.

## Database

TypeORM is configured in `src/app.module.ts`.

Important behavior:

- `synchronize` is **enabled only in non-production** (`NODE_ENV !== 'production'`)
- In production, you should use migrations (not included here by default) or another controlled schema strategy.

To connect locally:
- Ensure PostgreSQL is running
- Ensure the database exists (e.g. `idecide`)
- Set `DB_*` values in `.env`

## Uploads

This repo includes an `uploads/` directory at the project root. If you’re using file upload endpoints, ensure the process has permissions to write there (especially in containerized deployments).

## Testing

Run unit tests:

```bash
npm run test
```

Run e2e/integration tests:

```bash
npm run test:e2e
```

Run all test projects:

```bash
npm run test:all
```

Coverage:

```bash
npm run test:cov
```

## Security Notes

Key security choices implemented at the app level (`src/main.ts`):

- Helmet security headers + basic CSP
- CORS configured with:
  - Dev origins: `http://localhost:5173`, `http://localhost:5174`
  - Production placeholder: `https://yourdomain.com` (change this)
- Global `ValidationPipe`:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true` with implicit conversion
  - `disableErrorMessages` in production
- Global exception filter to sanitize error output
- Global logging + rate-limiting interceptors

See [`SECURITY_IMPLEMENTATION.md`](./SECURITY_IMPLEMENTATION.md) for a detailed breakdown.

## Scripts

Common scripts (from `package.json`):

- `npm run start` — start
- `npm run start:dev` — start (watch)
- `npm run start:prod` — run compiled output
- `npm run build` — build
- `npm run lint` — eslint (with `--fix`)
- `npm run format` — prettier
- `npm run test` / `test:e2e` / `test:cov` — Jest test suites
