import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value:
                            "frame-src 'self' https://challenges.cloudflare.com https://*.challenges.cloudflare.com;",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
