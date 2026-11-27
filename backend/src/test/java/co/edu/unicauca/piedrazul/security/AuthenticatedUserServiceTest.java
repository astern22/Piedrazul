package co.edu.unicauca.piedrazul.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AuthenticatedUserServiceTest {

    private AuthenticatedUserService service;

    @BeforeEach
    void setUp() {
        service = new AuthenticatedUserService();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetKeycloakUserId_WithJwtAuthenticationToken() {
        Jwt jwt = new Jwt("token-value", Instant.now(), Instant.now().plusSeconds(3600),
                Map.of("alg", "none"), Map.of("sub", "keycloak-sub-123", "preferred_username", "paciente1"));
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals("keycloak-sub-123", service.getKeycloakUserId());
        assertEquals("paciente1", service.getUsername());
    }

    @Test
    void testGetKeycloakUserId_WithUsernamePasswordAuthenticationToken() {
        Jwt jwt = new Jwt("token-value", Instant.now(), Instant.now().plusSeconds(3600),
                Map.of("alg", "none"), Map.of("sub", "keycloak-sub-456", "preferred_username", "paciente2"));
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "paciente2", jwt, List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals("keycloak-sub-456", service.getKeycloakUserId());
        assertEquals("paciente2", service.getUsername());
    }

    @Test
    void testGetKeycloakUserId_NoAuthentication_ThrowsException() {
        assertThrows(IllegalStateException.class, () -> service.getKeycloakUserId());
        assertThrows(IllegalStateException.class, () -> service.getUsername());
    }

    @Test
    void testGetKeycloakUserId_NotJwtCredentials_ThrowsException() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("paciente1", "password");
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThrows(IllegalStateException.class, () -> service.getKeycloakUserId());
        assertEquals("paciente1", service.getUsername());
    }
}
