# Backend Structure Document

## 1. Backend Architecture

Overall, StarSpin’s backend is built on a serverless model using Supabase and Vercel. We split responsibilities into small, focused modules that can scale independently.

- Frameworks & Patterns
  - Supabase for database (PostgreSQL), authentication, storage, and edge functions
  - Edge Functions handle business logic (rating submission, spin processing, coupon creation)
  - Modular code organization: each feature (ratings, spins, coupons, dashboard) lives in its own folder/function
  - MVC-like separation:
    - Data Layer: SQL queries and Supabase client
    - Logic Layer: edge function handler
    - API Layer: HTTP endpoints with clear request/response contracts

- Scalability
  - Edge functions auto-scale on demand worldwide
  - Supabase Postgres scales vertically and supports horizontal read replicas in future
  - Vercel’s CDN caches static PWA assets close to users

- Maintainability
  - Feature modules make code easy to update or extend
  - Supabase migrations track schema changes in version control
  - Clear naming conventions and documentation for each function

- Performance
  - Low-latency edge functions at network edge
  - CDN caching for static resources
  - Database indexes on foreign keys and timestamp columns

## 2. Database Management

- Technology
  - PostgreSQL (SQL) managed by Supabase
  - Row-Level Security (RLS) to isolate merchant data

- Data Storage & Access
  - Tables for merchants, feedback, spins, coupons, prizes, QR codes, subscriptions
  - Supabase client libraries (JavaScript/TypeScript) for queries
  - Stored procedures or views for complex reporting

- Data Practices
  - Automated daily backups by Supabase
  - Retention policies to archive or delete very old records if needed
  - CSV export endpoints for merchants to download metrics
  - Supabase migrations ensure consistent schema across environments

## 3. Database Schema

Human-readable overview:

- merchants
  - Unique merchant accounts with email, branding options, subscription info

- prizes
  - Wheel items with name, probability weight, quantity limits, merchant owner

- feedback
  - Every customer rating (1–5 stars), free-text comment if negative, timestamp, merchant link

- spins
  - Records of each spin attempt: merchant, IP hash, spin result, timestamp

- coupons
  - Unique codes generated after a positive spin, expiry timer, used flag, merchant link, spin link

- qr_codes
  - Generated QR assets per merchant (URLs to PNG/PDF), branding metadata

- subscription_tiers
  - Defines each pricing tier (Starter, Pro, Multi-shop) with limits and prices

Detailed SQL schema (PostgreSQL dialect):

```sql
-- 1. Merchants table
drop table if exists merchants;
create table merchants (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  branding jsonb default '{}',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_tier text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Prizes table
drop table if exists prizes;
create table prizes (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  name text not null,
  probability double precision not null,
  quantity integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Feedback table
drop table if exists feedback;
create table feedback (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  is_positive boolean not null,
  created_at timestamptz default now()
);

-- 4. Spins table
drop table if exists spins;
create table spins (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  prize_id uuid references prizes(id),
  ip_hash text,
  user_token text,
  created_at timestamptz default now()
);

-- 5. Coupons table
drop table if exists coupons;
create table coupons (
  id uuid primary key default gen_random_uuid(),
  spin_id uuid references spins(id) on delete cascade,
  merchant_id uuid references merchants(id) on delete cascade,
  code text unique not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- 6. QR Codes table
drop table if exists qr_codes;
create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  asset_url text not null,
  created_at timestamptz default now()
);

-- 7. Subscription Tiers (static reference)
drop table if exists subscription_tiers;
create table subscription_tiers (
  tier_name text primary key,
  max_locations integer not null,
  price numeric(8,2) not null,
  features jsonb default '{}'
);

-- Example tier inserts
insert into subscription_tiers values
('starter', 1, 15.00, '{"features": ["basic stats","1 location"]}'),
('pro', 3, 59.00, '{"features": ["advanced stats","3 locations"]}'),
('multi-shop', -1, 99.00, '{"features": ["unlimited locations","all features"]}');
```

## 4. API Design and Endpoints

All endpoints live as Supabase Edge Functions, secured with JWTs from Supabase Auth. We follow RESTful conventions:

- Authentication header: `Authorization: Bearer <supabase_jwt>`

### Public Endpoints (no auth)
- `POST /rating`
  - Purpose: submit a 1–5 star rating
  - Payload: `{ "merchantId","rating","language","userToken" }`
  - Behavior: routes negative (1–3) internally, positive (4–5) to spin logic

- `GET /spin-config?merchantId=`
  - Purpose: fetch wheel prizes and probabilities

- `POST /spin`
  - Purpose: perform the spin
  - Payload: `{ "merchantId","userToken","ipHash" }`
  - Response: prize result or “no prize” outcome

### Merchant-Only Endpoints (require auth)
- `GET /dashboard/stats`
  - Returns: total spins, conversion rates, top prizes, feedback counts

- `GET /feedback/negative`
  - Returns: list of negative feedback comments for review

- `POST /prizes`
- `PUT /prizes/:id`
- `DELETE /prizes/:id`
  - Manage wheel prizes and probabilities

- `GET /qr-codes`
  - Returns: URLs/PDF links of merchant’s QR assets

- `POST /subscription`
  - Manage Stripe subscription via checkout session

- `GET /export?type=csv&data=stats`
  - Returns: CSV file of requested metrics or feedback

## 5. Hosting Solutions

- Supabase (managed cloud)
  - Postgres database
  - Authentication & Row-Level Security
  - Edge Functions run on Supabase’s global edge network
  - Storage for QR assets and coupon images

- Vercel (managed cloud)
  - Hosts the Next.js PWA
  - Global CDN for static files
  - Auto-scaling and zero-config performance

Benefits:
- Reliability: SLAs from both Supabase and Vercel
- Scalability: serverless and auto-scaling by default
- Cost-effectiveness: pay for what you use, minimal ops overhead

## 6. Infrastructure Components

- Load Balancers: transparently handled by Supabase & Vercel
- CDN: Vercel for frontend, Supabase Storage for assets
- Caching:
  - Static asset caching via CDN
  - Edge Function responses can set cache headers for config
- Storage: Supabase Storage (S3-compatible)
- Logging & Monitoring: built-in Supabase logs, Vercel logs, optional 3rd-party (e.g., Sentry)

## 7. Security Measures

- Authentication & Authorization
  - Supabase Auth (magic link or email/password for merchants)
  - JWT on every request
  - Row-Level Security (RLS) policies to ensure merchants can’t see others’ data

- Data Encryption
  - HTTPS/SSL for all traffic
  - Encryption at rest managed by Supabase

- Fraud Prevention
  - One spin per user token/IP per time window enforced in edge functions
  - Optional email verification via SendGrid for higher tiers

- Webhook Security
  - Stripe webhooks verified via signed secrets

- Input Validation & Rate Limiting
  - Validate request bodies in every function
  - Basic rate limits configured at edge level

- CORS
  - Restrict API origins to the PWA domain

## 8. Monitoring and Maintenance

- Performance & Health
  - Supabase dashboard for DB performance metrics
  - Vercel Analytics for frontend and edge function metrics

- Error Tracking
  - Integrate Sentry (or similar) in edge functions for real-time error alerts

- Backups & Migrations
  - Daily automated DB backups by Supabase
  - Schema migrations via Supabase CLI and GitHub Actions

- CI/CD
  - GitHub Actions to lint, test, and deploy edge functions on each push
  - Versioned releases tagged in Git

- Support & Updates
  - Regular dependency updates via Dependabot
  - Scheduled maintenance windows communicated to merchants

## 9. Conclusion and Overall Backend Summary

StarSpin’s backend combines the power of Supabase’s managed services with Vercel’s global CDN and serverless capabilities. This setup:

- Supports a modular, maintainable codebase with clear separation of concerns
- Scales automatically as usage grows, without manual ops work
- Ensures security via row-level policies, JWT auth, encrypted traffic, and rate limiting
- Provides merchants with real-time data, CSV exports, and easy dashboard controls
- Uses edge functions to minimize latency for end users

Unique aspects:
- Supabase Edge Functions drive all custom logic in a serverless, globally distributed fashion
- RLS policies guarantee strict data isolation for each merchant
- Built-in fraud prevention and optional email verification for premium tiers

Together, these components form a reliable, high-performance backend aligned with StarSpin’s goal: make customer feedback fun, safe, and rewarding for local businesses.