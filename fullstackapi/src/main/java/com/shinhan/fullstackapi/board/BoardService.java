// ==============================================================
// 파일   board\BoardService.java — 토론방 CRUD 로직
// 역할   작성자만 수정·삭제(403), 수정은 dirty checking, 상세 볼 때 조회수 +1
// ==============================================================
package com.shinhan.fullstackapi.board;

import com.shinhan.fullstackapi.board.BoardDto.*;
import com.shinhan.fullstackapi.common.PageResponse;
import com.shinhan.fullstackapi.member.Member;
import com.shinhan.fullstackapi.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)     // 기본은 읽기 전용, 쓰는 메서드만 @Transactional 따로
public class BoardService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;

    // ===== 1. 목록 (검색 + 페이징, 최신순) =====
    public PageResponse<PostListResponse> list(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        return PageResponse.of(
                postRepository.findByTitleContaining(keyword == null ? "" : keyword, pageable)
                        .map(PostListResponse::from));
    }

    // ===== 2. 상세 (조회수 +1) =====
    @Transactional
    public PostDetailResponse detail(Long id) {
        Post post = findPost(id);
        post.increaseViewCount();                       // UPDATE 문을 안 써도 반영된다
        List<CommentResponse> comments = commentRepository.findByPostIdOrderByIdAsc(id)
                .stream().map(CommentResponse::from).toList();
        return PostDetailResponse.of(post, comments);
    }

    // ===== 3. 작성 =====
    @Transactional
    public Long create(PostRequest req, String username) {
        Member member = findMember(username);
        return postRepository.save(new Post(req.title(), req.content(), member)).getId();
    }

    // ===== 4. 수정 (작성자만) =====
    @Transactional
    public void update(Long id, PostRequest req, String username) {
        Post post = findPost(id);
        checkWriter(post.isWriter(username));
        post.update(req.title(), req.content());
    }

    // ===== 5. 삭제 (작성자만, 댓글 먼저) =====
    @Transactional
    public void delete(Long id, String username) {
        Post post = findPost(id);
        checkWriter(post.isWriter(username));
        commentRepository.deleteByPostId(id);
        postRepository.delete(post);
    }

    // ===== 6. 댓글 작성 / 삭제 =====
    @Transactional
    public CommentResponse addComment(Long postId, CommentRequest req, String username) {
        Comment comment = new Comment(req.content(), findPost(postId), findMember(username));
        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글이 없습니다"));
        checkWriter(comment.isWriter(username));
        commentRepository.delete(comment);
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다"));
    }

    private Member findMember(String username) {
        return memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원이 없습니다"));
    }

    private void checkWriter(boolean isWriter) {
        if (!isWriter) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 할 수 있습니다");
        }
    }
}