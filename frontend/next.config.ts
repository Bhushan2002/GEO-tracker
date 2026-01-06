import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'node-cron'],
  output: 'standalone',
  // Force webpack in development to avoid Turbopack symlink issues on Windows
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { isServer }) => {
      // Handle external packages
      if (isServer) {
        config.externals.push('node-cron');
      }
      return config;
    },
  }),
};

export default nextConfig;
