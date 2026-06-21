package com.bankapp.auth;

import com.bankapp.auth.dto.LoginRequest;
import com.bankapp.auth.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerAndLogin_returnsJwt() throws Exception {
        // Register
        var register = new RegisterRequest();
        // Use reflection-free approach: ObjectMapper
        String registerJson = objectMapper.writeValueAsString(
                objectMapper.createObjectNode()
                        .put("email", "test@example.com")
                        .put("password", "Test@1234")
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson))
                .andExpect(status().isCreated());

        // Login
        String loginJson = objectMapper.writeValueAsString(
                objectMapper.createObjectNode()
                        .put("email", "test@example.com")
                        .put("password", "Test@1234")
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.expiresIn").isNumber());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        String json = objectMapper.writeValueAsString(
                objectMapper.createObjectNode()
                        .put("email", "duplicate@example.com")
                        .put("password", "Test@1234")
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        String json = objectMapper.writeValueAsString(
                objectMapper.createObjectNode()
                        .put("email", "nobody@example.com")
                        .put("password", "WrongPass@1")
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());
    }
}
