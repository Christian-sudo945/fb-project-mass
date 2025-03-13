/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enabling HTTPS and passing the certificates using environment variables for local dev.
  env: {
    HTTPS: process.env.HTTPS || 'true',
    SSL_CRT_FILE: process.env.SSL_CRT_FILE || './cert.crt',
    SSL_KEY_FILE: process.env.SSL_KEY_FILE || './cert.key',
  },

  // Setting headers to control CORS and security policies
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Open to all origins
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Accept, Authorization' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent embedding in iframes
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.ngrok.io", // Allow ngrok to be an iframe ancestor
          },
        ],
      },
    ];
  },

  // Rewrites for Facebook Graph API
  async rewrites() {
    return [
      {
        source: '/api/facebook/:path*',
        destination: 'https://graph.facebook.com/v16.0/:path*',
      },
    ];
  },

  // Redirects configuration
  async redirects() {
    return [
      {
        source: '/api/auth/callback',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Image optimization configuration for external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
      {
        protocol: 'https',
        hostname: '*.ngrok-free.app',
      },
    ],
  },

  // Additional Next.js configurations can be added here as needed
  // e.g. webpack, experimental, etc.
};

module.exports = nextConfig;
