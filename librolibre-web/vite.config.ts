
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // El manifiesto ya existe en public/site.webmanifest.
      // Evitamos generar otro manifiesto.
      manifest: false,

      // Genera el Service Worker en producción.
      strategies: "generateSW",

      // Solicita una actualización cuando hay una nueva versión.
      registerType: "prompt",

      // No registra el Service Worker durante npm run dev.
      devOptions: {
        enabled: false,
      },

      // Archivos públicos adicionales que se almacenarán.
      includeAssets: [
        "favicon.svg",
        "icons.svg",
        "pwa-192.png",
        "pwa-512.png",
      ],

      workbox: {
        // Archivos estáticos generados por Vite.
        globPatterns: [
          "**/*.{js,css,html,svg,png,ico,woff,woff2}",
        ],

        // Permite que React Router funcione al navegar
        // directamente a las rutas de la aplicación.
        navigateFallback: "/index.html",

        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
        ],

        // No configuramos caché para solicitudes a la API.
        runtimeCaching: [],

        // Limpia recursos antiguos del precaché.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
