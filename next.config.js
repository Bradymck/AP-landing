/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    outputFileTracingRoot: process.cwd(),
  }
}

module.exports = nextConfig 