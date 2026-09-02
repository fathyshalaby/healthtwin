import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
export default {
  outputFileTracingRoot: path.join(pkgDir, "../.."),
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
