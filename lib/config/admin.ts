/**
 * Admin Configuration
 *
 * This file contains the list of authorized admin emails.
 * In production, consider moving this to environment variables or a database table.
 */

// List of email addresses authorized to access the admin dashboard
// Add your admin emails here
export const ADMIN_EMAILS: string[] = [
  // Add admin emails here, e.g.:
  // 'admin@starspin.com',
  // 'owner@starspin.com',
];

// Check if environment variable is set for admin emails (comma-separated)
const envAdminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
const allAdminEmails = [...ADMIN_EMAILS, ...envAdminEmails].map(e => e.toLowerCase());

/**
 * Check if an email is authorized as admin
 * @param email - Email address to check
 * @returns boolean - true if email is authorized
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allAdminEmails.includes(email.toLowerCase());
}

/**
 * Get all admin emails (for debugging purposes only)
 * @returns string[] - List of admin emails (masked for security)
 */
export function getAdminEmailsMasked(): string[] {
  return allAdminEmails.map(email => {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    return `${local.substring(0, 2)}***@${domain}`;
  });
}
