import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
};

export default withSerwist(nextConfig);
