// ==============================================================
// 파일   web\src\api.js — 화면이 서버를 부를 때 쓰는 공통 창구
// 역할   Lab 의 get() · post() 를 그대로 두고 (AI 패널 6개는 한 줄도 안 바꿈)
//        안쪽만 fetch → axios 로 바꿔서 토큰을 자동으로 붙이고, 만료되면 자동으로 재발급한다
//
// AI 메뉴      post("/credit", 고객)        → /api/ai/credit       → Spring AiProxyController → FastAPI :8001/credit
// 서비스 메뉴  http.get("/api/posts")       → /api/posts           → Spring BoardController → Oracle
//
// 토큰 흐름
//   ① 요청 가로채기  localStorage 의 accessToken → 헤더 Authorization: Bearer …
//   ② 응답 가로채기  401(Access 만료) → /api/auth/reissue 로 새 토큰 2개 → 실패했던 요청을 한 번 더
//                    Refresh 도 만료 → 토큰 지우고 로그인 화면으로 (onLogout)
// ==============================================================
import axios from "axios";

export const http = axios.create({ baseURL: "" });   // vite proxy 가 /api → Spring 8081

// ----- ① 요청 가로채기 -----
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ----- ② 응답 가로채기 -----
let reissuing = null;                     // 여러 요청이 동시에 401 이어도 재발급은 한 번만
let onLogout = () => {};                  // App 이 등록 → 토큰이 완전히 만료되면 로그인 화면으로
export const setLogoutHandler = (fn) => { onLogout = fn; };

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem("refreshToken");
    const isAuthUrl = original?.url?.startsWith("/api/auth/");

    if (error.response?.status === 401 && refreshToken && !original._retry && !isAuthUrl) {
      original._retry = true;
      try {
        reissuing = reissuing || axios.post("/api/auth/reissue", { refreshToken });
        const { data } = await reissuing;
        saveTokens(data);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return http(original);            // 실패했던 요청 다시 보내기
      } catch (e) {
        clearTokens();
        onLogout();
        return Promise.reject(e);
      } finally {
        reissuing = null;
      }
    }
    return Promise.reject(error);
  }
);

export function saveTokens(data) {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify({ username: data.username, nickname: data.nickname }));
}

export function clearTokens() {
  ["accessToken", "refreshToken", "user"].forEach((k) => localStorage.removeItem(k));
}

// 에러에서 화면에 보여 줄 글자 꺼내기
//   detail = FastAPI HTTPException, message = Spring GlobalExceptionHandler
export function errorMessage(e) {
  const d = e.response?.data;
  if (e.response?.status === 401) return "로그인이 필요합니다";
  return d?.detail || d?.message || (e.response ? `서버 오류 ${e.response.status}` : "서버에 연결할 수 없습니다 (Spring 8081 이 켜져 있나요?)");
}

// ===== Lab 과 같은 모양: AI 패널은 이 두 함수만 쓴다 =====
const AI = "/api/ai";

export async function get(path) {
  try {
    return (await http.get(AI + path)).data;
  } catch (e) {
    throw new Error(errorMessage(e));
  }
}

export async function post(path, body) {
  try {
    return (await http.post(AI + path, body)).data;
  } catch (e) {
    throw new Error(errorMessage(e));
  }
}