import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.100.209", "localhost:3000", "192.168.100.*"],
};
export default nextConfig;
