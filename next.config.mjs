/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your existing webpack config for SSH2
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("ssh2");
    }
    return config;
  },
  
  // Keep your existing image config
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
  
  // Keep server actions config but add hydration-related settings
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // Add these to help with hydration issues
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Add these properties to help with hydration issues
  reactStrictMode: true,
  swcMinify: true,
  
  // This helps with consistent rendering between server and client
  compiler: {
    // Enables the styled-components SWC transform if you're using styled-components
    styledComponents: true
  },
  
  // Optional: Adjust how Next.js handles client/server differences
  outputFileTracing: true,
};

export default nextConfig;