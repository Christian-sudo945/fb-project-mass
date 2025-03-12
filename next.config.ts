const fs = require('fs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
  images: {
    domains: [
      'scontent.fdvo1-1.fna.fbcdn.net',
      'scontent.fdvo1-2.fna.fbcdn.net',
      'platform-lookaside.fbsbx.com',
      'graph.facebook.com',
      'scontent.xx.fbcdn.net'
    ],
  },
}

module.exports = nextConfig
