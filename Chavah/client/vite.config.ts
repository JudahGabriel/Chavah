import { defineConfig, PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const outDir = "../wwwroot";

export default defineConfig({
  base: "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    // HMR reaches the Vite dev server directly even when the app is viewed
    // through the ASP.NET origin or the spiderloop proxy.
    hmr: { host: "127.0.0.1", clientPort: 5173, protocol: "ws" },
    cors: true,
    // Dev-only: forward API calls to production so data-driven components
    // (song lists, deck, now-playing) render real data during visual checks.
    // Has zero effect on the production build.
    proxy: {
      "/api": {
        target: "https://messianicradio.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir,
    emptyOutDir: false, // wwwroot also holds images/, favicon, manifest.json
    assetsDir: "assets/js",
    target: "ES2022",
    sourcemap: false,
    manifest: true,
    rollupOptions: {
      input: { index: fileURLToPath(new URL("index.html", import.meta.url)) },
    },
  },
  plugins: [
    VitePWA({
      base: "/",
      scope: "/",
      registerType: "autoUpdate",
      injectRegister: null, // registration stays in _Layout.cshtml
      manifest: false, // server already serves /manifest.json
      strategies: "generateSW",
      filename: "service-worker.js",
      workbox: {
        globDirectory: outDir,
        globPatterns: ["assets/js/*.js", "assets/js/*.css"],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }) as PluginOption,
    renameIndexHtmlPlugin(),
  ],
});

// Vite emits index.html into wwwroot; rename it to vite-index.html so it doesn't
// collide with Razor routing, and so ViteAssets.cs can parse the hashed tags.
function renameIndexHtmlPlugin(): PluginOption {
  return {
    name: "rename-index-html",
    apply: "build",
    closeBundle() {
      const from = path.resolve(__dirname, outDir, "index.html");
      const to = path.resolve(__dirname, outDir, "vite-index.html");
      if (fs.existsSync(from)) fs.renameSync(from, to);
    },
  };
}
