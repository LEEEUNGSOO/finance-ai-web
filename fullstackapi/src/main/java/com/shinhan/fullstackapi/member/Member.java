// ==============================================================
// 파일   member\Member.java — 회원 엔티티 (테이블 MEMBER)
// 역할   USER 는 Oracle 예약어라 MEMBER. 비밀번호는 암호화된 값만 저장
// ==============================================================
package com.shinhan.fullstackapi.member;

import com.shinhan.fullstackapi.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 회원 테이블. USER 는 Oracle 예약어라 MEMBER 로 이름을 정한다
@Entity
@Table(name = "member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)   // JPA 는 기본 생성자가 필요
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "member_seq_gen")
    @SequenceGenerator(name = "member_seq_gen", sequenceName = "member_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;            // 로그인 아이디

    @Column(nullable = false, length = 100)
    private String password;            // BCrypt 로 암호화된 값

    @Column(nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)        // DB 에 'USER' 글자로 저장
    @Column(nullable = false, length = 20)
    private Role role;

    @Builder
    public Member(String username, String password, String nickname, Role role) {
        this.username = username;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
    }
}