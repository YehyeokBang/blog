const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (process.env.NODE_ENV === 'production' && (!siteUrl || siteUrl === 'https://' || siteUrl === 'http://')) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be set and valid in production to avoid localhost leakage in SEO files.');
}
export const SITE_URL = siteUrl || 'http://localhost:3000';
