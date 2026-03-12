import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8081",
        pathname: "/public/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8081",
        pathname: "/public/**",
      },
    ],
  },
};

export default nextConfig;
