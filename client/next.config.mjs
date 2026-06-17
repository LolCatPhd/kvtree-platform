// client/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack for stable Netlify builds
  experimental: {
    turbopack: false,
  },
  // Recommended for Netlify
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
