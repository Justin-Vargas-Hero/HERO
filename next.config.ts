import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "frame-src 'self' https://challenges.cloudflare.com https://*.challenges.cloudflare.com;",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
