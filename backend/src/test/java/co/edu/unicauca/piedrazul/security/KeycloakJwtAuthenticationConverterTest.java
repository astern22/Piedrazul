package co.edu.unicauca.piedrazul.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class KeycloakJwtAuthenticationConverterTest {

    private final KeycloakJwtAuthenticationConverter converter = new KeycloakJwtAuthenticationConverter();

    private Jwt.Builder baseJwt() {
        return Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("11111111-2222-3333-4444-555555555555")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300));
    }

    private Set<String> authorities(AbstractAuthenticationToken auth) {
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toSet());
    }

    @Test
    void testPrincipalIsPreferredUsernameAndRolesAreMapped() {
        Jwt jwt = baseJwt()
                .claim("preferred_username", "juanperez")
                .claim("realm_access", Map.of("roles", List.of("PATIENT", "offline_access", "uma_authorization")))
                .build();

        AbstractAuthenticationToken auth = converter.convert(jwt);

        assertNotNull(auth);
        assertTrue(auth.isAuthenticated());
        assertEquals("juanperez", auth.getPrincipal());
        assertEquals("juanperez", auth.getName());
        // Solo los roles de la aplicacion, con el prefijo ROLE_
        assertEquals(Set.of("ROLE_PATIENT"), authorities(auth));
    }

    @Test
    void testSeveralRoles() {
        Jwt jwt = baseJwt()
                .claim("preferred_username", "admin")
                .claim("realm_access", Map.of("roles", List.of("ADMIN", "SCHEDULER")))
                .build();

        assertEquals(Set.of("ROLE_ADMIN", "ROLE_SCHEDULER"), authorities(converter.convert(jwt)));
    }

    @Test
    void testFallsBackToSubjectWhenNoPreferredUsername() {
        Jwt jwt = baseJwt().claim("scope", "openid").build();

        AbstractAuthenticationToken auth = converter.convert(jwt);

        assertNotNull(auth);
        assertEquals("11111111-2222-3333-4444-555555555555", auth.getPrincipal());
    }

    @Test
    void testNoRealmAccessMeansNoAuthorities() {
        Jwt jwt = baseJwt().claim("preferred_username", "sinroles").build();

        AbstractAuthenticationToken auth = converter.convert(jwt);

        assertNotNull(auth);
        assertTrue(auth.getAuthorities().isEmpty());
    }
}
