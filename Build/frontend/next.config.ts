import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['127.0.0.1', '192.168.1.5', 'localhost', 'casually-enlisted-margin.ngrok-free.dev'],
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: 'http://127.0.0.1:8000/auth/:path*' },
      { source: '/bots/:path*', destination: 'http://127.0.0.1:8000/bots/:path*' },
      { source: '/chat/:path*', destination: 'http://127.0.0.1:8000/chat/:path*' },
      { source: '/widget/:path*', destination: 'http://127.0.0.1:8000/widget/:path*' },
    ]
  }
};

export default nextConfig;
