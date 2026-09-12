import type { NextConfig } from "next";

const configuredDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  // The app is sometimes opened from the LAN address during local testing.
  // Next blocks dev assets from unknown origins, which prevents React hydration.
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.151.126.73", ...configuredDevOrigins],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
