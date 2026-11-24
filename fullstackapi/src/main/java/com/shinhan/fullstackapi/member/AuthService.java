// ==============================================================
// 파일   member\AuthService.java — 회원가입 · 로그인 · 재발급 · 로그아웃 처리
// 역할   비밀번호 BCrypt 암호화, 토큰 2개 발급, Refresh 는 Redis 에 저장·교체(rotation), 로그아웃 시 Access 는 블랙리스트
// ==============================================================
package com.shinhan.fullstackapi.member;

import com.shinhan.fullstackapi.member.MemberDto.*;
import com.shinhan.fullstackapi.security.JwtProvider;
import com.shinhan.fullstackapi.security.TokenStore;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final TokenStore tokenStore;

    // ===== 1. 회원가입 =====
    @Transactional
    public MemberResponse signup(SignupRequest req) {
        if (memberRepository.existsByUsername(req.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다");
        }
        Member member = Member.builder()
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))   // 평문 저장 금지
                .nickname(req.nickname())
                .role(Role.USER)
                .build();
        return MemberResponse.from(memberRepository.save(member));
    }

    // ===== 2. 로그인: 비밀번호 확인 → Access + Refresh 발급 → Refresh 는 Redis 저장 =====
    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest req) {
        Member member = memberRepository.findByUsername(req.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 틀렸습니다"));
        if (!passwordEncoder.matches(req.password(), member.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 틀렸습니다");
        }
        return issueTokens(member);
    }

    // ===== 3. 재발급: Refresh 가 Redis 에 있는 값과 같을 때만 새로 발급 (Rotation) =====
    @Transactional(readOnly = true)
    public TokenResponse reissue(ReissueRequest req) {
        String refreshToken = req.refreshToken();
        if (!jwtProvider.validate(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh Token 이 만료되었습니다. 다시 로그인하세요");
        }
        String username = jwtProvider.getUsername(refreshToken);
        String saved = tokenStore.getRefreshToken(username);
        if (saved == null || !saved.equals(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용할 수 없는 Refresh Token 입니다");
        }
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원이 없습니다"));
        return issueTokens(member);
    }

    // ===== 4. 로그아웃: Redis 의 Refresh 삭제 + 남은 Access 는 블랙리스트 =====
    public void logout(String username, String accessToken) {
        tokenStore.deleteRefreshToken(username);
        long remain = jwtProvider.getRemainingMillis(accessToken);
        if (remain > 0) {
            tokenStore.addBlacklist(accessToken, remain);
        }
    }

    @Transactional(readOnly = true)
    public MemberResponse me(String username) {
        return memberRepository.findByUsername(username)
                .map(MemberResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원이 없습니다"));
    }

    private TokenResponse issueTokens(Member member) {
        String access = jwtProvider.createAccessToken(member.getUsername(), member.getRole().name());
        String refresh = jwtProvider.createRefreshToken(member.getUsername());
        tokenStore.saveRefreshToken(member.getUsername(), refresh, jwtProvider.getRefreshTokenMillis());
        return new TokenResponse(access, refresh, member.getUsername(), member.getNickname());
    }
}