// ==============================================================
// 파일   board\PostRepository.java — POST 테이블 조회
// 역할   페이지 목록 · 제목 검색 · @EntityGraph 로 작성자 함께 (N+1 방지)
// ==============================================================
package com.shinhan.fullstackapi.board;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    // 제목 검색 + 페이징. @EntityGraph: 작성자(member)를 JOIN 으로 한 번에 가져와 N+1 문제를 막는다
    @EntityGraph(attributePaths = "member")
    Page<Post> findByTitleContaining(String keyword, Pageable pageable);
}