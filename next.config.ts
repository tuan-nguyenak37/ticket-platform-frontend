import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/dashboard/orders/:orderId/checkout', destination: '/thanh-toan/:orderId', permanent: true },
      { source: '/dashboard/orders/:path*', destination: '/don-hang/:path*', permanent: true },
      { source: '/dashboard/tickets/:path*', destination: '/ve-cua-toi/:path*', permanent: true },
      { source: '/dashboard/profile', destination: '/tai-khoan', permanent: true },
    ];
  },
};

export default nextConfig;
