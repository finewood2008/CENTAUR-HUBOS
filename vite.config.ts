import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import apiProxyPlugin from './src/vite-api-proxy-plugin'

const BRIDGE_URL = process.env.VITE_BRIDGE_URL || 'http://127.0.0.1:21747'

export default defineConfig({
  base: "/CENTAUR-HUBOS/",
  plugins: [
    react(),
    tailwindcss(),
    apiProxyPlugin(),
  ],
  server: {
    proxy: {
      // /api/* 由 apiProxyPlugin 处理（rewrite/proxy）
      // 以下是 bridge_server 原生支持的路径，直接转发
      '/invoke': { target: BRIDGE_URL, changeOrigin: true },
      '/health': { target: BRIDGE_URL, changeOrigin: true },
      '/agents': { target: BRIDGE_URL, changeOrigin: true },
      '/agent_config': { target: BRIDGE_URL, changeOrigin: true },
      '/sessions': { target: BRIDGE_URL, changeOrigin: true },
      '/knowledge': { target: BRIDGE_URL, changeOrigin: true },
      '/memory': { target: BRIDGE_URL, changeOrigin: true },
      '/skills': { target: BRIDGE_URL, changeOrigin: true },
      '/tools': { target: BRIDGE_URL, changeOrigin: true },
      '/cron': { target: BRIDGE_URL, changeOrigin: true },
      '/gateway': { target: BRIDGE_URL, changeOrigin: true },
      '/wechat': { target: BRIDGE_URL, changeOrigin: true },
    },
  },
})
