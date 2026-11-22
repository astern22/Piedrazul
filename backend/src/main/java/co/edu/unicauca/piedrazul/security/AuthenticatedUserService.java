package co.edu.unicauca.piedrazul.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

    public String getKeycloakUserId() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null) {
            throw new IllegalStateException("No hay un usuario autenticado");
        }

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            return jwtAuth.getToken().getSubject();
        }

        if (authentication.getCredentials() instanceof Jwt jwt) {
            return jwt.getSubject();
        }

        throw new IllegalStateException("No hay un usuario autenticado mediante JWT");
    }

    public String getUsername() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null) {
            throw new IllegalStateException("No hay un usuario autenticado");
        }

        if (authentication.getPrincipal() instanceof String username && !username.isBlank()) {
            return username;
        }

        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            String username = jwtAuth.getToken().getClaimAsString("preferred_username");
            if (username != null && !username.isBlank()) {
                return username;
            }
            return jwtAuth.getToken().getSubject();
        }

        if (authentication.getCredentials() instanceof Jwt jwt) {
            String username = jwt.getClaimAsString("preferred_username");
            if (username != null && !username.isBlank()) {
                return username;
            }
            return jwt.getSubject();
        }

        return authentication.getName();
    }
}
