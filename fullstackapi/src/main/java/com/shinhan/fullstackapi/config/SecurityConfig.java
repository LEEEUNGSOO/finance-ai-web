// ==============================================================
// 파일   config\SecurityConfig.java — 누가 어느 주소에 들어갈 수 있는지 정하는 곳
// 역할   세션 대신 JWT · 로그인 필요 주소 정하기 · 401/403 JSON · CORS(5174)
//
// 로그인 없이        회원가입·로그인·재발급, Swagger, 대시보드 분석(/api/ai/analysis·health),
//                    토론방 보기(GET /api/posts/**), 금융상품 보기(GET /api/finance/**)
// 로그인 필요        AI 메뉴 1~6 (/api/ai/**), 글쓰기·댓글, 신용 이력, 로그아웃
// ==============================================================
package com.shinhan.fullstackapi.config;

import com.shinhan.fullstackapi.security.JwtAuthenticationFilter;
import com.shinhan.fullstackapi.security.JwtProvider;
import com.shinhan.fullstackapi.security.TokenStore;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final TokenStore tokenStore;

    @Value("${cors.allowed-origin}")
    private String allowedOrigin;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)                 // 토큰 방식이라 CSRF 불필요
                .cors(c -> c.configurationSource(corsSource()))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))   // 세션 안 씀

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/reissue", "/error").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()   // Swagger 화면
                        .requestMatchers(HttpMethod.GET, "/api/ai/health", "/api/ai/analysis").permitAll()      // 대시보드 첫 화면은 누구나
                        .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()      // 토론방 보기는 누구나
                        .requestMatchers(HttpMethod.GET, "/api/finance/**").permitAll()    // 금융상품 보기는 누구나 (AI 의 bank_products 도구도)
                        .anyRequest().authenticated()                                      // 나머지(AI 메뉴 1~6 포함)는 로그인 필요
                )

                // 인증 실패 401, 권한 없음 403 을 JSON 으로
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> writeJson(res, 401, "로그인이 필요합니다"))
                        .accessDeniedHandler((req, res, ex) -> writeJson(res, 403, "권한이 없습니다"))
                )

                // 아이디/비번 필터보다 앞에 JWT 필터를 끼운다
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider, tokenStore), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private CorsConfigurationSource corsSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private void writeJson(jakarta.servlet.http.HttpServletResponse res, int status, String msg)
            throws java.io.IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"status\":" + status + ",\"message\":\"" + msg + "\"}");
    }
}