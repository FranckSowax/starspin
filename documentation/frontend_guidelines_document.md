# StarSpin Frontend Guideline Document

This document outlines the frontend architecture, design principles, styling, component structure, state management, routing, performance optimizations, and testing strategy for **StarSpin**, our PWA that gamifies customer reviews and offers a merchant dashboard. The goal is to ensure a clear, maintainable, and scalable frontend setup.

## 1. Frontend Architecture

### 1.1 Overall Stack
- **Framework:** Next.js (React) in PWA mode for customer-facing flows and the merchant dashboard.  
- **Styling:** Tailwind CSS with CSS variables for theming.  
- **Internationalization:** i18next for string management and language detection.  
- **Data & Auth:** Supabase Client (PostgreSQL, Auth, Storage, Edge Functions).  
- **Payments & Emails:** Stripe.js for subscription billing and SendGrid for transactional emails.
- **Hosting:** Vercel for automatic builds and deployments.

### 1.2 Scalability & Maintainability
- **Component-Based Structure:** Promotes reuse and isolation of concerns.  
- **File-Based Routing:** Next.js pages folder provides clear route organization.  
- **Incremental Static Regeneration (ISR):** Speeds up load on low-traffic pages and supports SEO.  
- **Edge Functions:** Handle coupon expiration and email triggers close to the user.

### 1.3 Performance
- **Server-Side Rendering (SSR) + Static Generation:** Ensures fast first paint.  
- **Dynamic Imports & Code Splitting:** Only load heavy modules (e.g., Spin the Wheel) when needed.  
- **Image Optimization:** Next.js `<Image>` component for responsive, lazy-loaded images.

---

## 2. Design Principles

### 2.1 Usability
- **Clear CTAs:** One main action per screen (Scan QR, Rate, Spin, View Coupon).  
- **Progressive Disclosure:** Keep flows short—step by step prompts.

### 2.2 Accessibility
- **WCAG 2.1 AA Compliance:** Keyboard navigation, proper ARIA labels, high color contrast.  
- **Semantic HTML:** Use landmarks (`<main>`, `<header>`, `<nav>`).

### 2.3 Responsiveness
- **Mobile-First:** All screens start with a mobile layout, then scale up.  
- **Fluid Grids & Flexbox:** Tailwind’s responsive utility classes ensure layouts adapt.

### 2.4 Internationalization
- **Auto Language Detection:** Use browser locale to pick initial language.  
- **Fallback & Manual Switch:** Manual switch available for any translation gaps.

---

## 3. Styling and Theming

### 3.1 Styling Approach
- **Tailwind CSS:** Utility-first for rapid development, customizing via `tailwind.config.js`.  
- **CSS Variables:** Define theme colors in `:root` and override in merchant vs. customer sections.

### 3.2 Theming
- **Customer Theme:** Playful, bright color palette.  
- **Dashboard Theme:** Neutral, muted tones for focus and data clarity.
- **Dark Mode (Future):** Plan to add via CSS variable toggles.

### 3.3 Visual Style
- **Style:** Flat & modern with subtle shadows (glassmorphism only for modal overlays).  
- **Font:** Inter (web-safe, readable at small sizes).  

### 3.4 Color Palette
| Role              | Customer Theme         | Dashboard Theme      |
|-------------------|------------------------|----------------------|
| Primary           | #FF6F61 (Coral)        | #4A5568 (Gray-700)   |
| Secondary         | #4CAF50 (Green)        | #A0AEC0 (Gray-400)   |
| Accent            | #FFC107 (Amber)        | #E2E8F0 (Gray-200)   |
| Background        | #FFFFFF (White)        | #F7FAFC (Gray-50)    |
| Text Primary      | #1A202C (Gray-900)     | #2D3748 (Gray-800)   |
| Success/Reward    | #38A169 (Green-600)    | —                    |
| Warning / Danger  | #E53E3E (Red-600)      | —                    |

---

## 4. Component Structure

### 4.1 Directory Layout (Example)
```
/components         # Reusable UI elements
  /atoms            # Buttons, Inputs, Icons
  /molecules        # Combined atoms (Modal, Form Field)
  /organisms        # Page sections (WheelGame, RatingPrompt)
  /templates        # Layouts (CustomerLayout, DashboardLayout)
/pages              # Next.js pages (SSR/ISR)
/public             # Static assets (images, fonts)
/utils              # Helpers (i18n, date formatting)
/services           # API clients (Supabase, Stripe)
```

### 4.2 Reuse & Isolation
- **Single Responsibility:** Each component does one thing well.  
- **Props-Driven:** Pass only needed data & callbacks.  
- **Storybook (Future):** Document components in isolation.

---

## 5. State Management

### 5.1 Data Fetching & Caching
- **React Query:** Handles async data calls to Supabase, caches results, and auto-refetches on focus.  
- **Supabase Hooks:** Supabase JS client wrapped in custom hooks (`useAuth`, `useStats`).

### 5.2 Global State
- **Context API:** For UI states (theme toggle, language).  
- **Local Component State:** For ephemeral UI states (spin result, form inputs).

### 5.3 Shared State
- **Auth State:** Stored in Context, persisted via Supabase Auth listener.  
- **Cart/Session:** Spin eligibility stored in LocalStorage to enforce “one spin per user.”

---

## 6. Routing and Navigation

### 6.1 File-Based Routes
- **Public Routes:** `/` (landing), `/rate/[shopId]`, `/spin`, `/coupon`.  
- **Protected Routes:** `/dashboard`, `/dashboard/stats`, `/dashboard/wheel`, `/dashboard/settings`.

### 6.2 Navigation Patterns
- **Next.js Link:** For internal navigation.  
- **Dynamic Params:** `[shopId]` to load shop-specific rating flows.  
- **Middleware (Future):** Check auth on protected routes.

---

## 7. Performance Optimization

### 7.1 Lazy Loading & Code Splitting
- **Dynamic Imports:** Wrap heavy modules (WheelGame, Chart libraries) in `next/dynamic`.  
- **Route-Based Splitting:** Each Next.js page becomes its own chunk.

### 7.2 Asset Optimization
- **Next/Image:** Automatic resizing and WebP support.  
- **SVG Icons:** Inline or via sprite for low overhead.

### 7.3 Caching & CDN
- **Vercel Edge Cache:** Static assets served via CDN.  
- **React Query Cache:** Keeps data fresh without extra network calls.

---

## 8. Testing and Quality Assurance

### 8.1 Unit Tests
- **Jest + React Testing Library:** Test components render, callbacks fire, accessibility queries.

### 8.2 Integration Tests
- **MSW (Mock Service Worker):** Mock Supabase and Stripe APIs to test flows without real calls.

### 8.3 End-to-End Tests
- **Cypress:** Script key user journeys:
  - QR code landing → star rating → feedback or spin → coupon display.
  - Merchant login → create QR → view stats → manage wheel.

### 8.4 Linting & Formatting
- **ESLint & Prettier:** Enforce code style and catch errors early.  
- **Pre-commit Hooks:** Run `lint-staged` and tests on commit.

### 8.5 CI/CD
- **GitHub Actions:** On every PR, run lint, unit tests, and build.  
- **Vercel Deployment:** On merge to `main`, auto-deploy to production.

---

## 9. Conclusion and Overall Frontend Summary

The StarSpin frontend is built on a modern, component-based framework (Next.js) with PWA capabilities, ensuring a seamless mobile-first experience for end users and a clear, data-driven dashboard for merchants. By adhering to strong design principles—usability, accessibility, and responsiveness—and leveraging Tailwind CSS, React Query, and comprehensive testing, we deliver a fast, maintainable, and scalable application. This setup aligns with our MVP goals: rapid onboarding of shops, simple user flows, and a playful yet professional brand presence.

With this guideline, any team member or new developer should be able to understand how StarSpin’s frontend is structured, styled, and maintained, ensuring consistency and quality as we grow beyond the MVP.