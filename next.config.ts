import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['172.20.10.2:3000', '172.20.10.2', 'localhost:3000'],
  experimental: {
    serverActions: {
      bodySizeLimit: '250mb',
    },
  },
};

export default nextConfig;
