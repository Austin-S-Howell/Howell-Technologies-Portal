import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const envDir = new URL(".", import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  const base = env.VITE_PUBLIC_BASE || "/";

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@howell-technologies/portal": new URL("../../packages/portal/src/index.ts", import.meta.url).pathname,
      },
    },
    server: {
      port: 5173,
    },
    test: {
      environment: "jsdom",
    },
  };
});
