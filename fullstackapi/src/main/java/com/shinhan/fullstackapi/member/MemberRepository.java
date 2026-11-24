// ==============================================================
// 파일   member\MemberRepository.java — MEMBER 테이블 조회
// 역할   findByUsername · existsByUsername 같은 쿼리 메서드
// ==============================================================
package com.shinhan.fullstackapi.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // 메서드 이름만으로 쿼리가 만들어진다: select ... where username = ?
    Optional<Member> findByUsername(String username);

    boolean existsByUsername(String username);
}