import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
