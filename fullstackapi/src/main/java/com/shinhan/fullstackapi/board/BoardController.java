// ==============================================================
// 파일   board\BoardController.java — 토론방 API 주소
// 역할   /api/posts 목록·상세·쓰기·수정·삭제, /api/posts/{id}/comments 댓글
// ==============================================================
package com.shinhan.fullstackapi.board;

import com.shinhan.fullstackapi.board.BoardDto.*;
import com.shinhan.fullstackapi.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // ===== 1. 읽기 — 누구나 =====
    // GET /api/posts?keyword=금리&page=0&size=10
    @GetMapping("/api/posts")
    public PageResponse<PostListResponse> list(@RequestParam(required = false) String keyword,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return boardService.list(keyword, page, size);
    }

    @GetMapping("/api/posts/{id}")
    public PostDetailResponse detail(@PathVariable Long id) {
        return boardService.detail(id);
    }

    // ===== 2. 쓰기 · 수정 · 삭제 — 로그인 (수정 · 삭제는 Service 에서 작성자 확인) =====
    @PostMapping("/api/posts")
    public ResponseEntity<Map<String, Long>> create(@Valid @RequestBody PostRequest req,
                                                    @AuthenticationPrincipal UserDetails user) {
        Long id = boardService.create(req, user.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    @PutMapping("/api/posts/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @Valid @RequestBody PostRequest req,
                                       @AuthenticationPrincipal UserDetails user) {
        boardService.update(id, req, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/posts/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        boardService.delete(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ===== 3. 댓글 =====
    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long postId,
                                                      @Valid @RequestBody CommentRequest req,
                                                      @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(boardService.addComment(postId, req, user.getUsername()));
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        boardService.deleteComment(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}