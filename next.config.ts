import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the fetched scorecard binary into the /report server function so the on-demand
  // (binary) runner works on Vercel (§7 #4 — Vercel-native, no Docker). The binary is fetched
  // at build by the `prebuild` step into ./bin/scorecard.
  outputFileTracingIncludes: {
    "/report": ["./bin/scorecard"],
  },
};

export default nextConfig;
