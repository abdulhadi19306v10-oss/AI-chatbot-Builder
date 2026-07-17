import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['127.0.0.1', '192.168.1.5', 'localhost', 'casually-enlisted-margin.ngrok-free.dev'],
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [
      { source: '/auth/:path*', destination: `${backendUrl}/auth/:path*` },
      { source: '/bots/:path*', destination: `${backendUrl}/bots/:path*` },
      { source: '/chat/:path*', destination: `${backendUrl}/chat/:path*` },
      { source: '/widget/:path*', destination: `${backendUrl}/widget/:path*` },
    ]
  }
};

export default nextConfig;
