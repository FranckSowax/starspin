# StarSpin - Setup Guide

## Overview
StarSpin is a mobile-first SaaS PWA that gamifies customer feedback for brick-and-mortar businesses. Customers scan QR codes, rate their experience, and spin a wheel to win rewards.

## Prerequisites
- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)
- SendGrid account (for emails)

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `SENDGRID_API_KEY` - SendGrid API key
- `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for dev)

### 3. Set Up Supabase Database

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the schema from `supabase/schema.sql`

This will create all necessary tables with Row Level Security policies.

### 4. Configure Supabase Authentication

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Email provider
3. Configure email templates for magic links
4. Set up SendGrid SMTP in Authentication > Settings

### 5. Set Up Stripe

1. Create products in Stripe Dashboard:
   - Starter: €15/month
   - Pro: €59/month
   - Multi-shop: €99/month
2. Copy the price IDs to your environment variables
3. Set up webhooks pointing to `/api/webhooks/stripe`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── rate/[shopId]/       # Customer rating flow
│   ├── social/[shopId]/     # Social engagement page
│   ├── spin/[shopId]/       # Spin wheel page
│   ├── coupon/[shopId]/     # Coupon display page
│   ├── dashboard/           # Merchant dashboard
│   └── auth/                # Authentication pages
├── components/              # React components
│   ├── atoms/              # Basic UI components
│   ├── molecules/          # Composite components
│   └── organisms/          # Complex components
├── lib/                     # Utilities and configurations
│   ├── supabase/           # Supabase client setup
│   ├── i18n/               # Internationalization
│   └── types/              # TypeScript types
├── supabase/               # Database schema
└── public/                 # Static assets
```

## Key Features

### Customer Flow
1. **QR Code Scan** → Lands on `/rate/[shopId]`
2. **Star Rating** → 1-3 stars = feedback form, 4-5 stars = social engagement
3. **Social Engagement** → Prompt to leave Google review or follow on social media
4. **Spin Wheel** → Gamified prize selection
5. **Digital Coupon** → Unique code with QR and countdown timer

### Merchant Dashboard
- **Statistics** - View scans, ratings, conversions, and rewards
- **Prize Management** - Add/edit prizes with probabilities
- **Feedback Viewer** - Review customer feedback
- **QR Code Generator** - Download print-ready QR codes
- **Subscription Management** - Manage billing via Stripe

## Multi-Language Support

The app supports 6 languages out of the box:
- English (en)
- French (fr)
- Spanish (es)
- Arabic (ar)
- Thai (th)
- Chinese (zh)

Language is auto-detected from browser settings. Translations are in `lib/i18n/locales/`.

## PWA Configuration

The app is configured as a Progressive Web App:
- Service worker for offline support
- Installable on mobile devices
- Optimized for mobile-first experience
- Fast loading with code splitting

## Security Features

- Row Level Security (RLS) in Supabase
- JWT-based authentication
- HTTPS everywhere
- Rate limiting on API endpoints
- Input validation and sanitization
- Fraud prevention (one spin per device/day)

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Environment Variables in Production
Make sure to set all environment variables in your deployment platform.

## Testing

To test the complete flow:
1. Sign up as a merchant at `/auth/signup`
2. Add prizes in the dashboard
3. Generate a QR code
4. Visit the rating URL as a customer
5. Complete the rating → social → spin → coupon flow

## Support

For issues or questions, refer to:
- Project documentation in `/documentation`
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Stripe docs: https://stripe.com/docs

## License

Proprietary - StarSpin SaaS Platform
