// ==============================================================
// 파일   board\Post.java — 토론방 게시글 엔티티 (테이블 POST)
// 역할   제목 · 내용 · 조회수 · 작성자(MEMBER N:1) (댓글은 Comment 쪽에서 post 를 가리킨다)
// ==============================================================
package com.shinhan.fullstackapi.board;

import com.shinhan.fullstackapi.common.BaseTimeEntity;
import com.shinhan.fullstackapi.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 토론방 게시글
@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "post_seq_gen")
    @SequenceGenerator(name = "post_seq_gen", sequenceName = "post_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob                                   // Oracle 에서는 CLOB 으로 만들어진다
    @Column(nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)     // 게시글 N : 회원 1, 필요할 때만 회원을 조회
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    private int viewCount;

    public Post(String title, String content, Member member) {
        this.title = title;
        this.content = content;
        this.member = member;
    }

    // setter 대신 의미 있는 메서드로 바꾼다 → 트랜잭션 끝날 때 UPDATE 자동 실행 (변경 감지)
    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public boolean isWriter(String username) {
        return member.getUsername().equals(username);
    }
}