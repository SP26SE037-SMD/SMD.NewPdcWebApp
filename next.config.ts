import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  async redirects() {
    return [
      {
        source: "/dashboard/hopdc/subjects",
        destination: "/dashboard/hopdc",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
