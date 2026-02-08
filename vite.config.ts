import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { cartographer } from "@replit/vite-plugin-cartographer";
import tailwindcss from "@tailwindcss/vite";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// ✅ your repo name on GitHub
const REPO_NAME = "Client-Insight-Hub-1";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    // Your React app is inside /client
    root: path.resolve(__dirname, "client"),

    // ✅ THIS is what fixes asset paths on GitHub Pages project sites:
    // Site URL becomes: https://<user>.github.io/Client-Insight-Hub-1/
    base: isProd ? `/${REPO_NAME}/` : "/",

    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),

      // Replit-only stuff should NOT run in production build
      ...(isProd ? [] : [cartographer()]),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@assets": path.resolve(__dirname, "client", "src", "assets"),
      },
    },

    build: {
      // your server build writes to dist/, so keep the SPA build in dist/public
      outDir: path.resolve(__dirname, "dist", "public"),
      emptyOutDir: true,
    },
  };
});
