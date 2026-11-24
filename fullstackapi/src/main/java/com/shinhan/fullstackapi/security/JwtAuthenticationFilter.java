// ==============================================================
// 파일   security\JwtAuthenticationFilter.java — 요청마다 Access Token 검사
// 역할   Authorization: Bearer … → 블랙리스트 확인 → 로그인한 사람으로 등록
// ==============================================================
package com.shinhan.fullstackapi.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// 요청마다 한 번: Authorization 헤더의 Access Token 을 검사해서 "로그인한 사람"으로 등록
// @Component 를 붙이지 않는다 → SecurityConfig 에서 직접 new 해서 보안 필터 체인에만 넣는다
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final TokenStore tokenStore;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            // 서명·만료 OK + Access 토큰 + 로그아웃한 토큰 아님 → 인증 등록
            if (jwtProvider.validate(token)
                    && jwtProvider.isAccessToken(token)
                    && !tokenStore.isBlacklisted(token)) {

                UserDetails user = User.withUsername(jwtProvider.getUsername(token))
                        .password("")
                        .roles(jwtProvider.getRole(token))      // "USER" → ROLE_USER
                        .build();

                var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);   // 토큰이 없어도 일단 통과 → 막는 건 SecurityConfig 가 결정
    }
}