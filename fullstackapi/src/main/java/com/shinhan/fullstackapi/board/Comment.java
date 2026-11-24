// ==============================================================
// 파일   board\Comment.java — 댓글 엔티티 (테이블 POST_COMMENT)
// 역할   COMMENT 는 Oracle 예약어라 POST_COMMENT
// ==============================================================
package com.shinhan.fullstackapi.board;

import com.shinhan.fullstackapi.common.BaseTimeEntity;
import com.shinhan.fullstackapi.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 댓글. COMMENT 는 Oracle 예약어라 테이블 이름을 post_comment 로 한다
@Entity
@Table(name = "post_comment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "comment_seq_gen")
    @SequenceGenerator(name = "comment_seq_gen", sequenceName = "post_comment_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    public Comment(String content, Post post, Member member) {
        this.content = content;
        this.post = post;
        this.member = member;
    }

    public boolean isWriter(String username) {
        return member.getUsername().equals(username);
    }
}