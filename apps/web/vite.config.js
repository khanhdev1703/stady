import { fileURLToPath, URL } from "node:url";
import process from "node:process";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget =
    env.VITE_API_PROXY_TARGET || "http://localhost:5000";

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },

    server: {
      host: "0.0.0.0",
      port: 5173,

      allowedHosts: [
        "stady.io.vn",
      ],

      // Giữ web và API cùng origin trong lúc dev, giống nginx ở
      // production, để cookie phiên học liệu được gửi kèm <video>.
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: false,
        },
        "/uploads": {
          target: apiTarget,
          changeOrigin: false,
        },
      },
    },
  };
});
