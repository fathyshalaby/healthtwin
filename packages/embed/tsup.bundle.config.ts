import { defineConfig } from "tsup";

// Self-contained browser bundle (React + all deps inlined) for iframe / <script> embedding.
export default defineConfig({
  entry: { "embed.bundle": "src/standalone.ts" },
  format: ["esm"],
  platform: "browser",
  noExternal: [/.*/],
  minify: true,
  dts: false,
  clean: false,
  sourcemap: false,
  target: "es2020",
  define: { "process.env.NODE_ENV": '"production"' },
});
