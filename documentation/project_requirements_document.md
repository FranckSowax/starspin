# StarSpin (Code Name) – Project Requirements Document

## 1. Project Overview

StarSpin is a lightweight, mobile-first SaaS solution that turns customer feedback into a fun, rewarding experience for brick-and-mortar shops. By scanning a shop’s unique QR code, customers land on a fast, multi-language PWA where they rate their visit from 1 to 5 stars. Low ratings (1–3 stars) are routed to a private feedback form for the merchant, while high ratings (4–5 stars) unlock a gamified “Spin the Wheel” reward flow. The result: merchants collect honest feedback, protect their online reputation, and boost positive reviews on Google Maps and social media without technical friction.

We’re building StarSpin to help independent cafés, restaurants, boutiques and service shops (spas, bars, fast-food, etc.) deepen customer engagement, filter out negative experiences internally, and increase visibility through authentic positive reviews. Key success criteria for Version 1 include:\
• 10–15 onboarded shops.\
• Landing page loads in under 2 seconds on 3G.\
• At least 30% of 4–5 star raters complete the reward flow.\
• No more than one spin per device/IP per day.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (MVP)**

*   Mobile-first PWA accessible via QR code

*   Automatic browser-language detection (FR, EN, ES, AR, TH, ZH) with expansions via automated translation later

*   Star rating (1–5) branching logic:

    *   1–3 stars → private feedback form (data sent to merchant dashboard only)
    *   4–5 stars → reward workflow

*   Social engagement prompt (Google review link or “Follow on Instagram/TikTok”) with “Done” button

*   Animated Spin Wheel with merchant-configurable segments and probabilities

*   Digital coupon display (unique code or QR) with 24h/48h countdown

*   Merchant Dashboard:

    *   Supabase Auth (magic link / email+password)
    *   QR code & print-ready asset generation (PDF, PNG) with shop logo & CTA
    *   Statistics: scans, average rating, conversion rate (scan→Google review), rewards distributed
    *   Wheel management: add/edit prizes, set probabilities
    *   Negative-feedback viewer
    *   Subscription tiers via Stripe (Starter, Pro, Multi-shop)

*   Email verification & notifications via SendGrid

*   Basic fraud prevention (one spin per IP or LocalStorage)

**Out-of-Scope (Phase 1)**

*   Native iOS/Android apps (Capacitor/Expo)
*   Direct Google Places API integration to fetch/store reviews
*   SMS-based verification (Twilio)
*   Third-party analytics integrations (Google Analytics, Segment)
*   Apple/Google Wallet coupon storage & push reminders
*   Real-time sentiment analysis reports (OpenAI enhancements)
*   Advanced social-boost scheduling (“Zone Touristique” logic)
*   Multi-bolt device sync or offline-first mode

## 3. User Flow

When a customer visits a shop, they scan the in-store QR code with their phone’s camera. The PWA landing page instantly loads in the customer’s browser language, showing the shop logo, a welcome message, and a prompt to rate their visit with 1–5 stars. No app install is required; they are live in under two seconds.

If the customer gives 1–3 stars, they immediately see a short feedback form (“Tell us what went wrong”) and submit comments. Those comments go straight to the merchant’s dashboard. If they give 4–5 stars, they proceed to an “Engage & Spin” screen where they’re invited to either leave a Google review or follow the shop on Instagram/TikTok. After tapping “Done,” they spin the animated wheel, win a predefined prize, and receive a unique digital coupon (code/QR) valid for 24 or 48 hours.

## 4. Core Features

*   **PWA Landing Page**\
    • QR-code scan entry\
    • Automatic i18n detection (initial: FR, EN, ES, AR, TH, ZH)
*   **Rating System**\
    • 1–3 stars → inline private feedback form\
    • 4–5 stars → reward flow
*   **Social Engagement Prompt**\
    • Link to Google review or social follow\
    • “Done” button to proceed
*   **Spin Wheel Game**\
    • Smooth animation\
    • Merchant-configurable prizes & probabilities
*   **Digital Coupon**\
    • Unique code or QR\
    • Visible countdown (24h/48h)
*   **Merchant Dashboard**\
    • Supabase Auth (magic link, email/password)\
    • Shop profile & branding\
    • QR-code + print-ready asset generation\
    • Real-time stats (scans, rating avg, conversion rate, distributed prizes)\
    • Prize management & probability editor\
    • Negative feedback viewer\
    • Subscription management via Stripe (Starter/€15, Pro/€59, Multi-shop/€99)
*   **Email & Notifications**\
    • SendGrid integration for verification & alerts
*   **Fraud Prevention**\
    • Limit one spin per IP or LocalStorage

## 5. Tech Stack & Tools

*   Frontend: Next.js (React) **or** Vue.js as PWA
*   Internationalization: i18next (with ability to integrate automated translation)
*   Backend & Database: Supabase (PostgreSQL)
*   Authentication: Supabase Auth (magic link / email+password)
*   Edge Functions: Supabase Edge Functions (coupon expiration, email triggers)
*   Storage: Supabase Storage (logos, prize images)
*   Payments: Stripe (Starter, Pro, Multi-shop tiers)
*   Email Service: SendGrid (verification & marketing)
*   AI (future): OpenAI API (for sentiment summaries)
*   IDE/Plugins (optional): VS Code with “Cursor” for AI pair-programming, Windsurf snippets

## 6. Non-Functional Requirements

*   **Performance**:\
    • Landing page TTI (Time To Interactive) < 2 s on 3G\
    • API response < 200 ms under normal load
*   **Scalability**:\
    • Support up to 1,000 scans/minute across all shops
*   **Security & Compliance**:\
    • GDPR-compliant data processing\
    • HTTPS everywhere (SSL/TLS)\
    • Rate-limit API endpoints (e.g., 1 request/sec per IP)\
    • Data encryption at rest & in transit
*   **Availability**:\
    • 99.9% uptime SLA for merchant dashboard
*   **Usability/Accessibility**:\
    • WCAG 2.1 AA contrast ratios\
    • Mobile-first, responsive design\
    • Clear error messages and toasts

## 7. Constraints & Assumptions

*   **Supabase** will host all backend services (Auth, Database, Edge Functions, Storage).
*   **SendGrid** chosen for email verification; no SMS in MVP.
*   **No Google Places API** usage—reviews are encouraged via direct link only.
*   **Trust-based social step** (“Done” button) due to lack of public follow verification APIs.
*   **Merchants provide initial translations** for main languages; automated translation add-on available later.
*   **PWA only**—no app-store releases in Version 1.
*   **One spin limit** enforced by IP or LocalStorage; not foolproof against VPNs/incognito.

## 8. Known Issues & Potential Pitfalls

*   **Incentivized Review Policy**\
    Google prohibits rewarded positive reviews. Mitigation: present the wheel as a “thank you for visiting,” keep review suggestion optional, and avoid blocking the spin if the review link isn’t clicked.
*   **Fraud Risk**\
    IP and LocalStorage checks can be bypassed. Future SMS/email verification step recommended for high-value prizes.
*   **PWA Limitations on iOS**\
    Limited support for background push notifications and wallet passes. Plan native apps or Wallet integration in later phases.
*   **Social Follow Verification**\
    Users may click “Done” without following. Acknowledge in UI and consider manual or semi-automated audits for high-traffic shops.
*   **Translation Quality**\
    Automated translation can introduce errors. Always allow shop admins to override text in dashboard.
*   **Edge Function Cold Starts**\
    Occasional latency spikes. Mitigate by keeping functions warm or migrating heavy workflows to a background job system.

This PRD outlines all essential aspects of StarSpin’s MVP. It provides crystal-clear boundaries, user journeys, feature definitions, and technical choices so that follow-up documents (Tech Stack, Frontend Guidelines, Backend Structure, etc.) can be authored without ambiguity.
