// client/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack via environment variable (see netlify.toml)
  // Recommended for Netlify
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
