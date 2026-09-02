/** @type {import('next').NextConfig} */
export default {
  transpilePackages: [
    "@healthtwin/supabase",
    "@healthtwin/react",
    "@healthtwin/bodymap-react",
    "@healthtwin/bodymap-core",
    "@healthtwin/core",
    "@healthtwin/embed",
    "@healthtwin/insights",
    "@healthtwin/vitals",
    "@healthtwin/ratelimit",
  ],
};
