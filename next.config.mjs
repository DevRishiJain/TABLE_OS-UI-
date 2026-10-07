/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["54.146.192.20", "images.unsplash.com"],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/spadmin", permanent: false },
      { source: "/admin/restaurants", destination: "/spadmin/restaurants", permanent: false },
      { source: "/admin/restaurants/:id", destination: "/spadmin/restaurants/:id", permanent: false },
      { source: "/admin/analytics", destination: "/spadmin", permanent: false },
      { source: "/admin/fraud-review", destination: "/spadmin/fraud", permanent: false },
    ];
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL || "http://54.146.192.20:8088";
    return [
      {
        source: "/healthz",
        destination: `${backendUrl}/healthz`,
      },
    ];
  },
};

export default nextConfig;
