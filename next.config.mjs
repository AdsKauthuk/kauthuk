/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("ssh2");
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'greenglow.in',
        pathname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // These experimental features are supported in Next.js 15
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Remove the unsupported options:
  // - swcMinify (now default in Next.js 15)
  // - outputFileTracing (now default)
  // - compiler.styledComponents (needs different approach in Next.js 15)
  
  // Add React Strict Mode (recommended for Next.js 15)
  reactStrictMode: true,
};

export default nextConfig;