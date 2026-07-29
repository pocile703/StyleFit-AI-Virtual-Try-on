import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones/tablets on the same network use the dev server.
  // Next blocks cross-origin dev requests (HMR, assets) by default, which
  // breaks hydration for any device that isn't localhost. These patterns
  // cover the common private LAN ranges; add your exact IP if yours differs.
  allowedDevOrigins: [
    "10.250.30.203",
    "10.*.*.*",
    "192.168.*.*",
    "172.16.*.*",
    "*.local",
  ],
};

export default nextConfig;
