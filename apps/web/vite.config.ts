import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "icons/apple-touch-icon.png",
        "icons/pwa-192x192.png",
        "icons/pwa-512x512.png",
        "icons/pwa-maskable-512x512.png",
      ],
      manifest: {
        name: "OmprengQ — Edukasi Gizi Harian MBG",
        short_name: "OmprengQ",
        description:
          "Edukasi gizi harian Makan Bergizi Gratis (MBG) dan kalkulator selisih gizi lokal untuk sekolah, siswa, dan orang tua.",
        theme_color: "#2E8B47",
        background_color: "#EBF4FD",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "id",
        icons: [
          {
            src: "/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
        globIgnores: ["**/admin-*.js"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/admin(\/|$)/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/(auth|admin)(\/|$)/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/api\/public\/schools\/[^/]+\/(today|week)/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "omprengq-public-menus-v1",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^\/api\/public\/reference\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "omprengq-public-reference-v1",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "omprengq-images-v1",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
