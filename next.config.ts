import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://192.168.1.6:3000', '192.168.1.6'],
  devIndicators: false,
  turbopack: {
    root: path.resolve('.'),
  },
};

export default nextConfig;

