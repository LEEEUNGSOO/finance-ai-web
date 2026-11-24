// ==============================================================
// 파일   board\CommentRepository.java — POST_COMMENT 테이블 조회
// 역할   게시글별 댓글 목록 (작성자 함께 가져오기)
// ==============================================================
package com.shinhan.fullstackapi.board;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @EntityGraph(attributePaths = "member")
    List<Comment> findByPostIdOrderByIdAsc(Long postId);

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);    // 게시글 지울 때 댓글 먼저 삭제
}