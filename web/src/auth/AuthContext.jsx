// ==============================================================
// 파일   web\src\auth\AuthContext.jsx — 로그인 상태 보관함
// 역할   const { user, login, signup, logout } = useAuth()  → 어느 화면에서나
//        user 가 있으면 로그인한 상태 (새로고침해도 localStorage 에서 다시 꺼낸다)
// ==============================================================
import { createContext, useContext, useState } from "react";
import { http, saveTokens, clearTokens } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  // POST /api/auth/login → {accessToken, refreshToken, username, nickname}
  const login = async (username, password) => {
    const { data } = await http.post("/api/auth/login", { username, password });
    saveTokens(data);
    setUser({ username: data.username, nickname: data.nickname });
  };

  const signup = (form) => http.post("/api/auth/signup", form);

  // 서버: Redis 의 Refresh 삭제 + Access 블랙리스트 → 화면: 토큰 지우기
  const logout = async () => {
    try {
      await http.post("/api/auth/logout");
    } catch {
      /* 이미 만료됐어도 화면에서는 로그아웃 */
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const forget = () => setUser(null);     // 토큰이 완전히 만료됐을 때 api.js 가 부른다

  return <AuthContext.Provider value={{ user, login, signup, logout, forget }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);