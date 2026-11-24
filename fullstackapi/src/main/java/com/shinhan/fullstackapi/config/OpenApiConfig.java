// ==============================================================
// 파일   config\OpenApiConfig.java — Swagger 화면 설정
// 역할   http://localhost:8081/swagger-ui.html 에 API 목록이 자동으로 나온다
//        오른쪽 위 Authorize 버튼에 Access Token 을 넣으면 로그인이 필요한 API 도 바로 눌러 볼 수 있다
// ==============================================================
package com.shinhan.fullstackapi.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        SecurityScheme bearer = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT");
        return new OpenAPI()
                .info(new Info().title("Finance AI Web API").version("1.0")
                        .description("회원 · 토론방 · 금융상품 · 신용 이력 · AI 전달(/api/ai/**)"))
                .components(new Components().addSecuritySchemes("bearer", bearer))
                .addSecurityItem(new SecurityRequirement().addList("bearer"));
    }
}