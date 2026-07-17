/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable the client-side Router Cache for dynamic pages.
    // Without this, Next.js keeps serving a stale RSC payload for up to
    // 30s after a route was last visited, even on pages marked
    // `dynamic = "force-dynamic"` — that cache lives in the browser and
    // is independent of server-side data/route caching. This is why
    // newly-created tournaments wrote to Supabase correctly but the "/"
    // list kept showing the pre-creation (empty) snapshot until a hard
    // reload.
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
};

export default nextConfig;
