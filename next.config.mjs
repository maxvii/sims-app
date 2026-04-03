/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/api/chat': ['./node_modules/pdfkit/js/data/**/*'],
    },
  },
}
export default nextConfig
