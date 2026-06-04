/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@trinity/core-engine"],
  async headers() {
    return [
      {
        source: "/cards/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
