import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
        pathname: "/public/**",
      },
      {
        protocol: "https",
        hostname: "gw8hy3fdcv.ufs.sh",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
