/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable static generation for problematic pages
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Disable static export to avoid React 19 SSR issues
  output: 'standalone',
}

export default nextConfig
