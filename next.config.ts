import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.6"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
