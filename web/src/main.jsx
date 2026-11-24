// ==============================================================
// 파일   web\src\main.jsx — React 시작점
// 역할   index.html 의 <div id="root"> 에 App 을 그린다
//        AuthProvider 로 감싸서 어느 화면에서나 useAuth() 로 로그인 정보를 꺼낼 수 있게 한다
// ==============================================================
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);