# Tech Stack Document
This document explains in simple terms the technologies we’ve chosen for "StarSpin" and why they make the product reliable, user-friendly, and easy to maintain.

## 1. Frontend Technologies
How we build what the user sees and clicks on.

- **Next.js (React-based PWA)**
  - Creates a very fast, mobile-first web app that feels like a native app without requiring downloads.  
  - Server-side rendering and automatic code splitting help pages load instantly when users scan the QR code.
- **i18next**
  - Handles all text translations so we can offer French, English, Spanish, Arabic, Thai, Chinese out of the box.  
  - Also connects to an automated translation service for adding new languages later.
- **Responsive Design**
  - Uses modern CSS techniques (e.g., CSS modules or utility classes) to ensure the interface adapts gracefully to all screen sizes.

How this helps users
- Instant access to the game without app downloads  
- Automatic language detection and clear instructions in the user’s native language  
- Smooth animations (the spin wheel feels fluid on any device)

## 2. Backend Technologies
How we handle data, security, and business logic behind the scenes.

- **Supabase Auth**
  - Manages user login for merchants (magic links or email/password).  
  - Can also verify customer emails (or SMS with Twilio) before they spin the wheel to limit fraud.
- **Supabase Database (PostgreSQL)**
  - Stores shops’ settings, spin results, customer feedback, subscription tiers, and more in a reliable, structured way.
- **Supabase Edge Functions**
  - Run small pieces of code on demand—e.g., expire coupons after 24/48 hours, send email notifications, generate QR codes.
- **Supabase Storage**
  - Keeps images and assets such as merchant logos, custom coupon designs, and print-ready QR code templates.
- **Stripe**
  - Handles all subscription billing (Starter, Pro, Multi-shop tiers) securely and flexibly.
- **OpenAI API**
  - Analyzes negative feedback to summarize key issues for shop owners (e.g., common complaints about wait times).

Why this matters
- One unified platform (Supabase) for data, auth, storage, and serverless logic  
- Simple integration with payment system (Stripe) and AI tools (OpenAI)  
- Quick development and scaling without juggling many different backends

## 3. Infrastructure and Deployment
How we host, deploy, and maintain the application.

- **Hosting on Vercel**
  - Automatically deploys Next.js frontend and serverless functions when code is updated.  
  - Built-in global CDN ensures pages load quickly anywhere in the world.
- **Version Control with GitHub**
  - All code lives in GitHub repositories. Changes are reviewed via pull requests for safety and quality.
- **CI/CD Pipeline**
  - GitHub Actions run tests and deploy to Vercel/Supabase after each approved change, keeping production stable.

Benefits for reliability and growth
- Automatic rollbacks if something goes wrong  
- Fast, repeatable deployments  
- Clear audit trail of who changed what and when

## 4. Third-Party Integrations
External services that extend functionality without reinventing the wheel.

- **SendGrid**
  - Sends verification and marketing emails (e.g., anti-fraud codes, weekly feedback reports).
- **Twilio (optional for SMS)**
  - Can send SMS codes for stronger anti-fraud checks, if shops choose to enable it.
- **Google Maps Review Link**
  - Directs customers to leave a review without storing or fetching reviews ourselves (keeps us compliant with Google’s policies).
- **Apple/Google Wallet**
  - Optional integration to let customers add their digital coupon directly to their phone’s wallet with reminders before expiry.

How these help
- Trusted, scalable communication channels (email/SMS)  
- Seamless review process that respects platform rules  
- Enhanced customer convenience with Wallet coupons

## 5. Security and Performance Considerations
Steps taken to protect data, prevent abuse, and ensure a smooth experience.

- **Authentication & Authorization**
  - Supabase Auth for merchant login  
  - Role-based access so customers never see admin data
- **Anti-Fraud Measures**
  - Limit one spin per user by IP address or browser storage  
  - Optional email/SMS confirmation before unlocking the game
- **Data Protection**
  - Secure storage of personal data in PostgreSQL with row-level security rules  
  - HTTPS everywhere (Vercel provides automatic SSL)
- **Performance Optimizations**
  - CDN caching for static assets  
  - Image optimization via Next.js Image component  
  - Lazy-loading non-critical code and assets for faster initial load

## 6. Conclusion and Overall Tech Stack Summary
These technology choices were made to align with StarSpin’s goals:

- **Speed & Accessibility**: A PWA built with Next.js loads instantly and works offline/poor connections.  
- **Scalability & Maintainability**: Supabase gives us a single platform for data, auth, storage, and serverless code.  
- **Flexibility & Growth**: Integration with Stripe, SendGrid, Twilio, OpenAI, and Wallet APIs lets us add features over time.  
- **User Experience**: Automatic translations, fraud prevention, and smooth animations create trust and delight for both customers and merchants.

Unique aspects:
- A near-native feel without app installs  
- Built-in AI-driven feedback summaries  
- Multi-language support with both curated and automatic translations  
- Easy QR code and coupon management directly from the merchant dashboard

With this stack, StarSpin is ready to deliver a playful, data-driven gamification experience for physical stores—today and as we grow into new markets and add new features.