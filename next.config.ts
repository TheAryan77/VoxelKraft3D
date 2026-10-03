import type { NextConfig } from "next";

const day = 60 * 60 * 24;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Models: browsers keep a copy but check with the server on every visit
        // (a tiny 304 when unchanged), so a replaced .glb shows up immediately
        // even when it keeps the same file name.
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        // Decoder, lighting and map files rarely change.
        source: "/:dir(draco|hdri|map)/:path*",
        headers: [{ key: "Cache-Control", value: `public, max-age=${day * 30}, stale-while-revalidate=${day * 30}` }],
      },
    ];
  },
};

export default nextConfig;
