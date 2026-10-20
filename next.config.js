/** @type {import('next').NextConfig} */
const nextConfig = {
  // ────────────────────────────────────────────────────────────────
  // Security Headers
  // Applied to every response via the headers() hook.
  // ────────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent browsers from MIME-sniffing the content type
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Block the page from being embedded in an iframe (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Force HTTPS for 1 year, include sub-domains
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Minimal referrer info sent to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features not needed by this app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Content Security Policy
          // - default-src: block everything not explicitly listed
          // - script-src: Next.js bundles + inline scripts (nonces are set by Next.js)
          // - style-src: Tailwind inline styles need 'unsafe-inline'
          // - img-src: data URIs for inline images, same origin
          // - connect-src: Supabase API calls
          // - frame-ancestors: block all embedding
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://*.supabase.co"} wss://*.supabase.co`,
              "font-src 'self'",
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ────────────────────────────────────────────────────────────────
  // Image domains — restrict Next/Image to known safe origins only
  // ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Production-only: strip source maps so internals aren't exposed
  // ────────────────────────────────────────────────────────────────
  productionBrowserSourceMaps: false,

  // ────────────────────────────────────────────────────────────────
  // Powered-By header removal (don't advertise framework version)
  // ────────────────────────────────────────────────────────────────
  poweredByHeader: false,
};

module.exports = nextConfig;
