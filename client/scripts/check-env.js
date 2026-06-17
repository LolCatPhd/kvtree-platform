// client/scripts/check-env.js
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  console.warn('WARNING: NEXT_PUBLIC_API_URL is not set. Client-side API requests may fail in production.');
} else {
  console.log('NEXT_PUBLIC_API_URL is set to:', apiUrl);
}
process.exit(0);
