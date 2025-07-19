import withPWA from "next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {},
  },
  images: {
    domains: ["covers.openlibrary.org"],
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ disables breaking build on ESLint errors
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);
