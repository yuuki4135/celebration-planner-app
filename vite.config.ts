import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths"
import env from "vite-plugin-env-compatible";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true
  },
  plugins: [react(), tsconfigPaths(), env({ prefix: "VITE", mountedPath: "process.env" })],
  build: {
    outDir: 'dist',
  },
  assetsInclude: ["robots.txt"],
})
