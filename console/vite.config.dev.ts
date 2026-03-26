import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // 开发环境使用空字符串，让前端通过 Vite 代理访问后端
  const apiBaseUrl = "";

  return {
    define: {
      VITE_API_BASE_URL: JSON.stringify(apiBaseUrl),
      TOKEN: JSON.stringify(env.TOKEN || ""),
      MOBILE: false,
    },
    plugins: [react()],
    css: {
      modules: {
        localsConvention: "camelCase",
        generateScopedName: "[name]__[local]__[hash:base64:5]",
      },
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      // 配置代理，将 /api 请求转发到后端
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8088",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${options.target}${req.url}`);
            });
            proxy.on('error', (err, req, res) => {
              console.log(`[Proxy Error] ${req.url}:`, err.message);
            });
          }
        },
        // WebSocket 代理
        "/ws": {
          target: "ws://127.0.0.1:8088",
          ws: true,
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: ["diff"],
    },
  };
})
