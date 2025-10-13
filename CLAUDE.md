# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL RULES - MUST FOLLOW

1. **NEVER USE MOCK DATA** - This is a real trading/financial application. All data must be real and from legitimate APIs.
2. **NO FAKE/PLACEHOLDER DATA** - If an API doesn't provide certain data, handle it gracefully with empty states, not fake data.
3. **ACCURACY IS PARAMOUNT** - Financial data must be 100% accurate. Never approximate or generate financial information.
4. **WHEN API DOESN'T EXIST** - If a required API endpoint doesn't exist, inform the user and suggest alternatives, don't fake it.

## Project Overview

HERO is a trading forum and market data platform built with Next.js 15, React 19, TypeScript, Prisma, and PostgreSQL. The application provides real-time market data, user authentication, and a social trading community.

## Development Commands

```bash
# Development
npm run dev                    # Start Next.js dev server on localhost:3000

# Database
npm run db:migrate            # Run Prisma migrations (uses .env.local)
npm run db:push               # Push schema changes to database
npm run db:generate           # Generate Prisma client
npm run db:studio             # Open Prisma Studio for database exploration

# Build & Deploy
npm run build                 # Production build with ESLint enabled
npm run build:prod            # Production build with ESLint disabled (for CI/CD)
npm run start                 # Start production server

# Deployment
npm run prepare-deployment    # Prepare environment files for deployment
npm run check-deployment      # Verify deployment configuration
npm run amplify:build         # AWS Amplify build command
npm run amplify:start         # AWS Amplify start command
```

## Architecture & Key Patterns

### Authentication System
- **NextAuth.js** with JWT strategy (credentials-based)
- Email verification required before login (src/lib/auth.ts:34)
- Session data includes: id, username, profilePicture, name
- Custom session callbacks refresh user data on updates
- Verification tokens stored in database, email sent via AWS SES

### Market Data Architecture
The market data system uses a **three-tier caching strategy** to optimize API usage and performance:

1. **TwelveDataClient** (src/lib/market-data/TwelveDataClient.ts)
   - Singleton client with intelligent rate limiting (600 req/min)
   - Request batching: delays 100ms to collect multiple requests into single API call
   - Smart cache TTL: 10s during market hours, 60s after hours
   - Supports pre/post-market data
   - Methods: `getQuote()`, `getBatchQuotes()`, `getTimeSeries()`

2. **MarketDataService** (src/lib/market-data/MarketDataService.ts)
   - Server-side orchestrator for multiple users
   - Tracks subscriptions and symbol subscribers
   - News cache (5min TTL), events cache (1hr TTL)
   - Automatic cleanup of inactive subscriptions (10min timeout)
   - Methods: `subscribe()`, `unsubscribe()`, `getMarketNews()`, `getMarketEvents()`

3. **API Routes** (src/app/api/market/)
   - `/api/market/quote` - Single quote
   - `/api/market/history` - Time series data
   - `/api/market/news` - Market news
   - `/api/market/movers` - Top gainers/losers
   - `/api/market/calendar/*` - Earnings, dividends, IPO calendars
   - `/api/market/profile/[symbol]` - Company profile

### File Upload System
- **Dual-mode**: S3 (production) or local filesystem (development)
- Controlled by `USE_S3` environment variable
- Base64 encoding for uploads, automatic validation
- Configured types: profilePicture (5MB), postImage (10MB), chart (10MB)
- Profile pictures use consistent naming (`avatar.ext`) to enable overwrites
- Main functions: `uploadFile()`, `deleteFile()`, `uploadProfilePicture()`

### Database Schema
- **User**: firstName, lastName, username, email, password (bcrypt), profilePicture, DOB fields, emailVerified
- **Session**: NextAuth session tokens with cascading delete
- **VerificationToken**: Email verification tokens with expiry
- Generated Prisma client location: src/generated/prisma/

### Middleware
First-time visitor redirect to `/landing` page (production only):
- Uses `hero_visited` cookie (1 year expiry)
- Only applies on production domain (hero.us.org)
- Skips API routes, static files, and auth routes

### Project Structure
```
src/
├── app/
│   ├── api/              # API route handlers
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── market/       # Market data endpoints
│   │   ├── update/       # User profile update endpoints
│   │   └── signup/       # User registration
│   ├── landing/          # Landing page for new visitors
│   ├── market/           # Market overview page
│   ├── ticker/[symbol]/  # Individual ticker detail pages
│   └── layout.tsx        # Root layout with Topbar, SideNav, Footer
├── components/           # React components
│   ├── market/           # Market-specific components
│   └── ...               # Auth, Settings, Dropdowns, etc.
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client singleton
│   ├── s3-service.ts     # File upload service
│   ├── market-data/      # Market data services
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── data/                 # Static data (ticker database)
└── types/                # TypeScript type definitions
```

## Important Considerations

### Rate Limiting
- TwelveData API has 600 requests/minute limit
- Always use `MarketDataService.getBatchQuotes()` for multiple symbols
- Cache is invalidated based on market hours detection

### Database Access
- Always use the Prisma singleton from `src/lib/prisma.ts` in client code
- Use `.env.local` for local development (DATABASE_URL)
- Production uses connection pooling for serverless compatibility
- Email searches are case-insensitive (mode: 'insensitive')

### Environment Variables
Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - Application URL
- `TWELVEDATA_API_KEY` - Market data API key for quotes and historical data
- `STOCKNEWS_API_KEY` - StockNewsAPI key for financial news (optional but recommended)
- `USE_S3` - "true" for S3, omit/false for local uploads
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - For S3
- `S3_BUCKET_NAME` - S3 bucket for uploads
- `EMAIL_FROM` - Sender email for SES

### Next.js Configuration
- ESLint disabled during builds (next.config.ts)
- CSP headers configured for Cloudflare Turnstile
- Uses Next.js 15 App Router (all routes in `src/app/`)
- Fonts: Manrope (headings), Inter (body)

### AWS Amplify Deployment
- See DEPLOYMENT.md for complete deployment guide
- Uses custom build commands: `amplify:build` and `amplify:start`
- Requires RDS PostgreSQL, S3 bucket, IAM user setup
- Supports custom domain (hero.us.org)

## Common Workflows

### Adding a New API Endpoint
1. Create route handler in `src/app/api/[name]/route.ts`
2. Use NextResponse for responses
3. Check authentication with `getServerSession(authOptions)` if needed
4. Follow existing patterns for error handling

### Adding Market Data Features
1. Add method to TwelveDataClient if new API endpoint needed
2. Add orchestration logic to MarketDataService
3. Create API route in `src/app/api/market/`
4. Use caching appropriately based on data freshness requirements

### Modifying Database Schema
1. Update `prisma/schema.prisma`
2. Run `npm run db:migrate` (creates migration)
3. Run `npm run db:generate` (updates Prisma client)
4. Update TypeScript types as needed

### Profile Updates
All profile updates use PATCH endpoints in `/api/update/`:
- `/api/update/email` - Updates email, sends verification
- `/api/update/password` - Updates password (requires old password)
- `/api/update/profile-picture` - Handles S3/local upload

## Testing & Quality

- Use TypeScript strict mode
- All API routes should validate inputs before processing
- Market data components should handle loading and error states
- Profile picture uploads validate size and format before upload