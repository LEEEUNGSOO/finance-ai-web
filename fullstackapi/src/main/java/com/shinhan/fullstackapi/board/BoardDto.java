// ==============================================================
// 파일   board\BoardDto.java — 토론방 요청·응답 모양
// 역할   PostRequest · CommentRequest · PostListResponse · CommentResponse · PostDetailResponse
// ==============================================================
package com.shinhan.fullstackapi.board;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class BoardDto {

    public record PostRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank String content) {
    }

    public record CommentRequest(@NotBlank @Size(max = 1000) String content) {
    }

    // 목록용: 본문은 빼고 가볍게
    public record PostListResponse(Long id, String title, String writer, int viewCount, LocalDateTime createdAt) {
        public static PostListResponse from(Post p) {
            return new PostListResponse(p.getId(), p.getTitle(), p.getMember().getNickname(),
                    p.getViewCount(), p.getCreatedAt());
        }
    }

    public record CommentResponse(Long id, String content, String writer, String username, LocalDateTime createdAt) {
        public static CommentResponse from(Comment c) {
            return new CommentResponse(c.getId(), c.getContent(), c.getMember().getNickname(),
                    c.getMember().getUsername(), c.getCreatedAt());
        }
    }

    // 상세용: 본문 + 댓글 목록
    public record PostDetailResponse(Long id, String title, String content, String writer, String username,
                                     int viewCount, LocalDateTime createdAt, LocalDateTime updatedAt,
                                     List<CommentResponse> comments) {
        public static PostDetailResponse of(Post p, List<CommentResponse> comments) {
            return new PostDetailResponse(p.getId(), p.getTitle(), p.getContent(),
                    p.getMember().getNickname(), p.getMember().getUsername(),
                    p.getViewCount(), p.getCreatedAt(), p.getUpdatedAt(), comments);
        }
    }
}