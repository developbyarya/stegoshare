# Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (via Supabase or local)
- Supabase account for storage

## Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your database URL and Supabase credentials
   - Set `JWT_SECRET` to a secure random string
   - Set `SECRET_KEY_HASH` to the SHA256 hash of your `secret.key` file

3. **Set up Prisma**
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Push schema to database (for development)
   npm run db:push

   # Or create a migration (for production)
   npm run db:migrate
   ```

4. **Set up Supabase Storage**
   - Create a bucket named `files` in your Supabase project
   - Configure bucket policies as needed

5. **Generate secret key hash**
   ```bash
   # Create your secret.key file, then generate hash:
   node -e "const crypto = require('crypto'); const fs = require('fs'); const hash = crypto.createHash('sha256').update(fs.readFileSync('secret.key')).digest('hex'); console.log(hash);"
   ```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Development

```bash
# Start development server
npm run dev
```

## Database Management

```bash
# Open Prisma Studio to view/edit data
npm run db:studio

# Create a new migration
npm run db:migrate

# Push schema changes (dev only)
npm run db:push
```

