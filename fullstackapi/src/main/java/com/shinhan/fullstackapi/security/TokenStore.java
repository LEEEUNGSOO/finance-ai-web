// ==============================================================
// 파일   security\TokenStore.java — Redis 에 토큰 저장
// 역할   refresh:{username} = Refresh Token, blacklist:{token} = 로그아웃한 Access Token
// ==============================================================
package com.shinhan.fullstackapi.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

// Redis 에 토큰을 저장하는 곳
//   refresh:{username}  → Refresh Token   (TTL 7일)
//   blacklist:{token}   → "logout"        (TTL = Access 남은 시간)
@Component
@RequiredArgsConstructor
public class TokenStore {

    private static final String REFRESH_PREFIX = "refresh:";
    private static final String BLACKLIST_PREFIX = "blacklist:";

    private final StringRedisTemplate redis;

    public void saveRefreshToken(String username, String refreshToken, long ttlMillis) {
        redis.opsForValue().set(REFRESH_PREFIX + username, refreshToken, Duration.ofMillis(ttlMillis));
    }

    public String getRefreshToken(String username) {
        return redis.opsForValue().get(REFRESH_PREFIX + username);
    }

    public void deleteRefreshToken(String username) {
        redis.delete(REFRESH_PREFIX + username);
    }

    public void addBlacklist(String accessToken, long ttlMillis) {
        redis.opsForValue().set(BLACKLIST_PREFIX + accessToken, "logout", Duration.ofMillis(ttlMillis));
    }

    public boolean isBlacklisted(String accessToken) {
        return Boolean.TRUE.equals(redis.hasKey(BLACKLIST_PREFIX + accessToken));
    }
}