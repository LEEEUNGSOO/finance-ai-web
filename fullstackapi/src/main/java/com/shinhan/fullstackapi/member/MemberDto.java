// ==============================================================
// 파일   member\MemberDto.java — 회원 요청·응답 모양
// 역할   SignupRequest · LoginRequest · TokenResponse · MemberResponse 를 record 로 한 파일에
// ==============================================================
package com.shinhan.fullstackapi.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 회원 관련 요청·응답 모양을 한 파일에 모았다
public class MemberDto {

    public record SignupRequest(
            @NotBlank @Size(min = 4, max = 20) String username,
            @NotBlank @Size(min = 4, max = 30) String password,
            @NotBlank @Size(max = 20) String nickname) {
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record ReissueRequest(@NotBlank String refreshToken) {
    }

    public record TokenResponse(String accessToken, String refreshToken, String username, String nickname) {
    }

    public record MemberResponse(Long id, String username, String nickname, String role) {
        public static MemberResponse from(Member m) {
            return new MemberResponse(m.getId(), m.getUsername(), m.getNickname(), m.getRole().name());
        }
    }
}