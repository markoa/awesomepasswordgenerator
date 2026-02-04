import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    AstroPWA({
      base: "/",
      scope: "/",
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "favicon-96x96.png",
        "apple-touch-icon.png",
      ],
      registerType: "autoUpdate",
      injectRegister: false,
      devOptions: {
        enabled: true,
        type: "module",
        suppressWarnings: true,
      },
      manifest: {
        name: "Awesome Password Generator",
        short_name: "APG",
        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
