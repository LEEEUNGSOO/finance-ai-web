// ==============================================================
// 파일   web\src\components\BoardPanel.jsx — 토론방 CRUD (서비스 메뉴)
// 역할   한 화면 안에서 mode 로 목록 · 상세 · 글쓰기를 바꾼다 (Lab 처럼 라우터 없이 state 로)
//
//   목록    GET    /api/posts?keyword=&page=     누구나
//   상세    GET    /api/posts/{id}               누구나 (조회수 +1)
//   쓰기    POST   /api/posts                    로그인
//   수정    PUT    /api/posts/{id}               작성자만 (아니면 403)
//   삭제    DELETE /api/posts/{id}               작성자만
//   댓글    POST   /api/posts/{id}/comments · DELETE /api/comments/{id}
// 기술 지도  성공할 때마다 JPA · Oracle 불
// ==============================================================
import { useEffect, useState } from "react";
import { http, errorMessage } from "../api";
import { useAuth } from "../auth/AuthContext";

const day = (s) => (s ? s.replace("T", " ").slice(0, 16) : "");

export default function BoardPanel({ onUse, onNeedLogin }) {
  const { user } = useAuth();
  const [mode, setMode] = useState("list");          // list | detail | write
  const [page, setPage] = useState({ content: [], page: 0, totalPages: 0 });
  const [keyword, setKeyword] = useState("");
  const [post, setPost] = useState(null);
  const [form, setForm] = useState({ id: null, title: "", content: "" });
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  // ===== 1. 성공 · 실패 공통 처리 =====
  const ok = () => { setError(""); onUse(["JPA", "Oracle"]); };
  const fail = (e) => setError(errorMessage(e));

  // ===== 2. 읽기 — 목록(GET /api/posts) · 상세(GET /api/posts/{id}) =====
  const loadList = (p = 0, kw = keyword) =>
    http.get("/api/posts", { params: { page: p, size: 10, keyword: kw || undefined } })
      .then(({ data }) => { setPage(data); setMode("list"); ok(); }).catch(fail);

  const open = (id) =>
    http.get(`/api/posts/${id}`).then(({ data }) => { setPost(data); setMode("detail"); ok(); }).catch(fail);

  useEffect(() => { loadList(0, ""); }, []);

  // ===== 3. 쓰기 · 수정 · 삭제 — 로그인 안 했으면 로그인 화면으로 =====
  const startWrite = (p) => {
    if (!user) return onNeedLogin("글쓰기는 로그인 후 할 수 있습니다");
    setForm(p ? { id: p.id, title: p.title, content: p.content } : { id: null, title: "", content: "" });
    setMode("write");
  };

  const save = (e) => {
    e.preventDefault();
    const body = { title: form.title, content: form.content };
    const req = form.id ? http.put(`/api/posts/${form.id}`, body) : http.post("/api/posts", body);
    req.then(({ data }) => open(form.id || data.id)).catch(fail);
  };

  const remove = () => {
    if (!window.confirm("이 글을 삭제할까요?")) return;
    http.delete(`/api/posts/${post.id}`).then(() => loadList(0)).catch(fail);
  };

  // ===== 4. 댓글 쓰기 · 삭제 =====
  const addComment = (e) => {
    e.preventDefault();
    if (!user) return onNeedLogin("댓글은 로그인 후 쓸 수 있습니다");
    http.post(`/api/posts/${post.id}/comments`, { content: comment })
      .then(() => { setComment(""); open(post.id); }).catch(fail);
  };

  const removeComment = (id) => http.delete(`/api/comments/${id}`).then(() => open(post.id)).catch(fail);

  // ===== 5. 화면 — mode 에 따라 목록 / 상세 / 글쓰기 중 하나 =====
  return (
    <>
      {error && <p className="error">{error}</p>}

      {mode === "list" && (
        <div className="card">
          <div className="board-top">
            <form className="input-row" style={{ flex: 1 }} onSubmit={(e) => { e.preventDefault(); loadList(0); }}>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="제목으로 찾기" />
              <button className="btn ghost">검색</button>
            </form>
            <button className="btn" onClick={() => startWrite(null)}>글쓰기</button>
          </div>
          <table className="table">
            <thead><tr><th style={{ width: 60 }}>번호</th><th>제목</th><th>작성자</th><th className="num">조회</th><th>작성일</th></tr></thead>
            <tbody>
              {page.content.map((p) => (
                <tr key={p.id} className="click" onClick={() => open(p.id)}>
                  <td>{p.id}</td><td><b>{p.title}</b></td><td>{p.writer}</td><td className="num">{p.viewCount}</td><td>{day(p.createdAt)}</td>
                </tr>
              ))}
              {page.content.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: "center" }}>아직 글이 없습니다. 첫 글을 써 보세요.</td></tr>}
            </tbody>
          </table>
          {page.totalPages > 1 && (
            <div className="pager">
              {Array.from({ length: page.totalPages }, (_, i) => (
                <button key={i} className={i === page.page ? "chip on" : "chip"} onClick={() => loadList(i)}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "detail" && post && (
        <div className="card">
          <button className="btn ghost" onClick={() => loadList(page.page)}>← 목록</button>
          <h3 className="post-title">{post.title}</h3>
          <p className="muted">{post.writer} · {day(post.createdAt)} · 조회 {post.viewCount}</p>
          <div className="post-body">{post.content}</div>
          {user?.username === post.username && (
            <div className="row-btns">
              <button className="btn ghost" onClick={() => startWrite(post)}>수정</button>
              <button className="btn danger" onClick={remove}>삭제</button>
            </div>
          )}
          <p className="card-title" style={{ marginTop: 20 }}>댓글 {post.comments.length}</p>
          {post.comments.map((c) => (
            <div key={c.id} className="comment">
              <b>{c.writer}</b> <span className="muted">{day(c.createdAt)}</span>
              {user?.username === c.username && <button className="link" onClick={() => removeComment(c.id)}>삭제</button>}
              <p>{c.content}</p>
            </div>
          ))}
          <form className="input-row" onSubmit={addComment}>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={user ? "댓글을 입력하세요" : "로그인 후 댓글을 쓸 수 있습니다"} />
            <button className="btn" disabled={!comment.trim()}>등록</button>
          </form>
        </div>
      )}

      {mode === "write" && (
        <form className="card form" onSubmit={save}>
          <p className="card-title">{form.id ? "글 수정" : "새 글"}</p>
          <label>제목<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} required /></label>
          <label>내용<textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></label>
          <div className="row-btns">
            <button type="button" className="btn ghost" onClick={() => (form.id ? open(form.id) : loadList(0))}>취소</button>
            <button className="btn">저장</button>
          </div>
        </form>
      )}
    </>
  );
}