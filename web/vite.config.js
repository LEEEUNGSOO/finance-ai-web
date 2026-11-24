// ==============================================================
// 파일   web\vite.config.js — React 개발 서버 설정
// 역할   주소 http://localhost:5174 (Lab 은 5173 → 둘을 동시에 켜도 안 부딪힘)
//        /api 로 시작하는 요청은 Spring(8081)으로 넘긴다 → 브라우저는 같은 주소로 보내는 셈이라 CORS 걱정이 줄어든다
// ==============================================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { "/api": "http://localhost:8081" },
  },
});