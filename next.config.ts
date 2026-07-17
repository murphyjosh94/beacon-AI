import type {
  NextConfig,
} from "next";

const nextConfig: NextConfig = {
  poweredByHeader:
    false,

  compress:
    true,

  reactStrictMode:
    true,

  images: {
    formats: [
      "image/avif",
      "image/webp",
    ],
  },

  async headers() {
    return [
      {
        source:
          "/(.*)",

        headers: [
          {
            key:
              "X-Content-Type-Options",

            value:
              "nosniff",
          },

          {
            key:
              "Referrer-Policy",

            value:
              "strict-origin-when-cross-origin",
          },

          {
            key:
              "Permissions-Policy",

            value:
              "camera=(), microphone=(), geolocation=()",
          },
        ],
      },

      {
        source:
          "/images/:path*",

        headers: [
          {
            key:
              "Cache-Control",

            value:
              "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;