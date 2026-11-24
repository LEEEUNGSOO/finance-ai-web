// ==============================================================
// 파일   member\AuthController.java — 회원 API 주소
// 역할   /api/auth/signup · login · reissue · logout, /api/members/me
// ==============================================================
package com.shinhan.fullstackapi.member;

import com.shinhan.fullstackapi.member.MemberDto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ===== 1. 가입 · 로그인 · 재발급 (로그인 없이) =====
    @PostMapping("/api/auth/signup")
    public ResponseEntity<MemberResponse> signup(@Valid @RequestBody SignupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(req));
    }

    @PostMapping("/api/auth/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/api/auth/reissue")
    public TokenResponse reissue(@Valid @RequestBody ReissueRequest req) {
        return authService.reissue(req);
    }

    // ===== 2. 로그아웃 · 내 정보 (로그인 필요) =====
    // 로그인한 사람만 (Authorization: Bearer 토큰 필요)
    @PostMapping("/api/auth/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserDetails user, HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);   // "Bearer " 뒤
        authService.logout(user.getUsername(), token);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/members/me")
    public MemberResponse me(@AuthenticationPrincipal UserDetails user) {
        return authService.me(user.getUsername());
    }
}