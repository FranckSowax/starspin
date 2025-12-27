# StarSpin App Flow Document

## Onboarding and Sign-In/Sign-Up

A new customer begins their journey simply by scanning a QR code displayed at a shop using the camera on their smartphone. The QR code is unique to each merchant and immediately redirects the user to a lightweight Progressive Web App landing page. No download is required, and the language of the page automatically matches the browser’s locale, with support for French, English, Spanish, Arabic, Thai, and Chinese out of the box. For merchants, onboarding starts on the StarSpin website where they can click “Get Started” to create an account. They enter their email address and receive a magic link via SendGrid email, or they can choose the classic email and password combination. After clicking the magic link or entering their password, merchants arrive at the dashboard. Signing out is as simple as clicking the profile menu in the top right corner and selecting “Sign Out.” If a merchant forgets their password, they can request a reset link by clicking “Forgot Password” on the sign-in page, entering their email, and following the instructions sent by email to set a new password.

## Main Dashboard or Home Page

When a merchant logs in, they land on the main dashboard which features a top header showing the shop name, current subscription tier, and a notifications icon. Below the header, a row of key metrics displays the number of QR scans, average rating, conversion rate from scans to Google reviews, and total rewards distributed. A left sidebar provides navigation links to Lot Management, Feedback Review, QR Code Generator, Subscription Settings, and Account Settings. For the customer, the landing page after scanning shows the shop logo, a welcome message, and a clear invitation to rate the experience with a five-star scale at the bottom of the screen. A language toggle in the top corner ensures users can switch languages at any time.

## Detailed Feature Flows and Page Transitions

When a customer selects one to three stars, the landing page seamlessly transitions to a short feedback form that asks “Tell us what went wrong.” The user types their feedback and taps “Submit,” sending the response directly to the merchant dashboard under Feedback Review. After submission, the customer sees a thank-you message and a button to return to the welcome screen.

If a customer gives four or five stars, the page immediately invites them to take a social action before spinning the wheel. This screen presents two options: leave a Google review or follow the shop on Instagram or TikTok. The user taps “I’m done,” which relies on their good faith to proceed. The app then transitions to the Spin Wheel page.

The Spin Wheel page features a vibrant animated wheel with segments corresponding to prizes configured by the merchant. The customer taps the center button to spin, and a smooth animation plays until the wheel stops on a prize. After the spin completes, the page shows the prize details and a digital coupon code or QR code. A countdown timer indicates the coupon’s validity for 24 or 48 hours. Below the coupon, a share link allows the user to post the offer on social media or revisit the shop’s main page.

If the merchant has enabled Apple or Google Wallet integration, the coupon page includes a button labeled “Add to Wallet.” Tapping it prompts the wallet interface on the phone and stores the coupon, which will then generate a local push notification reminder before expiration.

On the merchant side, when navigating to Lot Management, the user sees a table of existing rewards and their probabilities. The merchant clicks “Add New Lot,” fills in the prize name, image, probability percentage, and saves. The app returns to the updated list without reloading the entire page. Under QR Code Generator, merchants select a template style and click “Download PDF” or “Download PNG.” The file includes the shop logo and a call-to-action text. The browser’s download manager handles the file automatically.

Under Subscription Settings, merchants view their current plan—Starter, Pro, or Multi-shop—with a button to upgrade or downgrade. Clicking “Change Plan” displays available tiers and pricing details. When the merchant selects a new plan, Stripe Checkout opens in a modal. Completing the Stripe flow redirects the merchant back to the Subscription Settings page with their updated plan reflected.

## Settings and Account Management

Merchants access Account Settings from the sidebar to update their personal information such as business name, contact email, and phone number. A section on notification preferences lets the merchant enable or disable email alerts for new low-score feedback, weekly AI-generated sentiment reports, and coupon expirations. Changing notification preferences immediately saves to the server. The merchant can also configure anti-fraud settings, choosing to require email verification before wheel access or to trust LocalStorage and IP checks alone. After making changes, the merchant clicks “Save” and remains on the Account Settings page, or navigates back to the main dashboard via the sidebar.

## Error States and Alternate Paths

If a customer’s connection drops on the landing page, a friendly error message reads “Oops, something went wrong. Check your connection and try again.” A “Try Again” button attempts to reload the current step without losing progress. If the rating submission fails, an inline error advises “Unable to send feedback. Please tap to retry.” When a customer tries to spin the wheel more than once, the app displays “You’ve already spun the wheel for today,” referencing the anti-fraud limit. If the coupon has expired, opening the coupon link shows “This code has expired,” with a prompt to restart the visit next time.

Merchants encountering an issue with Stripe payments see a modal explaining “Payment failed. Please verify your card details or contact support.” A support link leads to a help page. If QR code generation fails, the dashboard shows “Unable to generate asset. Try again later.” Requesting a password reset with an unrecognized email prompts “No account found with that address.”

## Conclusion and Overall App Journey

From a first-time customer scanning a QR code to a merchant customizing their reward wheel, StarSpin guides every user through a simple and engaging path. Customers enjoy a seamless mobile-first experience that captures their rating, channels negative feedback privately, and rewards positive experiences with a spin that generates a time-limited coupon. Merchants benefit from a clear dashboard that tracks performance, manages rewards, handles subscriptions, and responds to feedback efficiently. Together, these flows form a cohesive journey that elevates customer engagement, filters critical feedback, and helps local businesses grow their online reputation.