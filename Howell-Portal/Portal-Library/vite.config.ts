import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@howell-technologies/portal": new URL("../Admin-Portal-UI/packages/portal/src/index.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "jsdom",
  },
});
