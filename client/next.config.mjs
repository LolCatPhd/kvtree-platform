// client/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: false,
  },
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
