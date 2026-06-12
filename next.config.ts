import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://192.168.1.6:3000', '192.168.1.6', 'http://192.168.1.5:3000', '192.168.1.5', 'http://127.0.0.1:3000', '127.0.0.1', 'http://localhost:3000', 'localhost'],
  devIndicators: false,
  turbopack: {
    root: path.resolve('.'),
  },
};

export default nextConfig;
