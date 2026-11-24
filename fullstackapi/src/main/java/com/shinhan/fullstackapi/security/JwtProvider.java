// ==============================================================
// 파일   security\JwtProvider.java — JWT 만들기 · 검사 · 꺼내기
// 역할   Access 30분 / Refresh 7일, type 클레임으로 둘을 구분
// ==============================================================
package com.shinhan.fullstackapi.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// 토큰을 만들고(create) 검사하고(validate) 꺼내는(get) 곳
@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTokenMillis;
    private final long refreshTokenMillis;

    public JwtProvider(@Value("${jwt.secret}") String secret,
                       @Value("${jwt.access-token-minutes}") long accessMinutes,
                       @Value("${jwt.refresh-token-days}") long refreshDays) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMillis = accessMinutes * 60 * 1000;
        this.refreshTokenMillis = refreshDays * 24 * 60 * 60 * 1000;
    }

    // ===== 1. Access Token: 짧게 (30분), 권한(role) 포함 =====
    public String createAccessToken(String username, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("type", "access")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessTokenMillis))
                .signWith(key)
                .compact();
    }

    // ===== 2. Refresh Token: 길게 (7일), 재발급 용도만 =====
    public String createRefreshToken(String username) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshTokenMillis))
                .signWith(key)
                .compact();
    }

    // ===== 3. 검사: 서명이 맞고 만료되지 않았으면 true =====
    public boolean validate(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        return "access".equals(parse(token).get("type", String.class));
    }

    public String getUsername(String token) {
        return parse(token).getSubject();
    }

    public String getRole(String token) {
        return parse(token).get("role", String.class);
    }

    // 만료까지 남은 시간 (로그아웃 블랙리스트 TTL 로 사용)
    public long getRemainingMillis(String token) {
        return parse(token).getExpiration().getTime() - System.currentTimeMillis();
    }

    public long getRefreshTokenMillis() {
        return refreshTokenMillis;
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token)
                .getPayload();
    }
}