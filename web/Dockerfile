# ==============================================================
# 파일   web\Dockerfile — React 화면을 nginx 로 내보내는 설명서
# 역할   1단계 npm run build → dist 폴더 (HTML · JS · CSS 파일)
#        2단계 nginx 가 dist 를 보여 주고, /api 는 Spring 으로 넘깁니다
#        (개발 때 vite.config.js 의 proxy 가 하던 일을 배포에서는 nginx 가 합니다)
# ==============================================================
# node 로 화면 파일을 만들고, nginx 이미지에는 결과물(dist)만 담습니다.
# 흐름: npm install → npm run build → dist 를 nginx 폴더로 복사 → nginx.conf 적용

# ===== 1단계: 빌드 =====
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
# src · public · index.html · vite.config.js 를 통째로 (node_modules 는 .dockerignore 로 뺍니다)
COPY . .
RUN npm run build                          # → /app/dist

# ===== 2단계: nginx =====
FROM nginx:1.27-alpine
# 기본 설정 파일 자리에 우리 nginx.conf 를 넣습니다
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 1단계에서 만든 dist 를 nginx 가 보여 주는 폴더로 복사합니다
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80