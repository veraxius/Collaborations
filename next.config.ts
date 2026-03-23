import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      backend: "./__next_backend_blocked__.ts",
      "@backend": "./__next_backend_blocked__.ts",
    },
  },
};

export default nextConfig;
