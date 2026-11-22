package co.edu.unicauca.piedrazul.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Convierte un JWT de Keycloak en la autenticacion que usa el resto de la aplicacion.
 * <ul>
 *   <li>El principal es el {@code preferred_username} (un String), igual que antes del
 *       cambio a Keycloak, de modo que los controladores siguen usando
 *       {@code (String) authentication.getPrincipal()} / {@code authentication.getName()}.</li>
 *   <li>Los roles se leen de {@code realm_access.roles} y se exponen como {@code ROLE_*}.</li>
 * </ul>
 */
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    /** Roles de negocio de Piedrazul (se ignoran los roles internos de Keycloak). */
    static final Set<String> APPLICATION_ROLES =
            Set.of("ADMIN", "PATIENT", "PROFESSIONAL", "SCHEDULER");

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isBlank()) {
            username = jwt.getSubject();
        }

        return new UsernamePasswordAuthenticationToken(username, jwt, extractAuthorities(jwt));
    }

    private List<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) {
            return List.of();
        }

        Object roles = realmAccess.get("roles");
        if (!(roles instanceof Collection<?> roleCollection)) {
            return List.of();
        }

        return roleCollection.stream()
                .map(String::valueOf)
                .filter(APPLICATION_ROLES::contains)
                .<GrantedAuthority>map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
    }
}
