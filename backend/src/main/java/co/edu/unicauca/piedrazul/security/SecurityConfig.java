package co.edu.unicauca.piedrazul.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Seguridad de la API como "resource server" de Keycloak: cada peticion debe traer
 * {@code Authorization: Bearer <access_token>} emitido por el realm de Keycloak.
 * La autenticacion (login) ya no la hace el backend.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Registro de pacientes (el login lo hace Keycloak)
                        .requestMatchers(
                                "/auth/**")
                        .permitAll()
                        // Solo el administrador gestiona cuentas internas (agendadores)
                        .requestMatchers("/api/users/**")
                        .hasRole("ADMIN")

                        // Pacientes: cada paciente solo accede a su propio registro (/me)
                        .requestMatchers(HttpMethod.GET, "/api/patients/me")
                        .authenticated()
                        // El resto de datos de pacientes (PII) es solo para el personal
                        .requestMatchers("/api/patients/**")
                        .hasAnyRole("ADMIN", "SCHEDULER", "PROFESSIONAL")

                        // Citas: el paciente solo ve las suyas (/me) y puede agendar
                        .requestMatchers(HttpMethod.GET, "/api/appointments/me")
                        .hasRole("PATIENT")
                        .requestMatchers(HttpMethod.POST, "/api/appointments/create")
                        .hasAnyRole("PATIENT", "ADMIN", "SCHEDULER")
                        .requestMatchers("/api/appointments/me/cancel/*")
                        .hasRole("PATIENT")
                        // Modificar o cancelar citas: solo administracion / agendadores
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/**")
                        .hasAnyRole("ADMIN", "SCHEDULER")
                        .requestMatchers(HttpMethod.DELETE, "/api/appointments/**")
                        .hasAnyRole("ADMIN", "SCHEDULER")
                        // Historial de citas por cedula: solo personal (medico, agendador, terapista,
                        // admin)
                        .requestMatchers(HttpMethod.GET, "/api/appointments/patient/document/*/history")
                        .hasAnyRole("ADMIN", "SCHEDULER", "PROFESSIONAL")
                        // Listados y consultas generales de citas: solo personal
                        .requestMatchers("/api/appointments/**")
                        .hasAnyRole("ADMIN", "SCHEDULER", "PROFESSIONAL")

                        .anyRequest()
                        .authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new KeycloakJwtAuthenticationConverter())));

        return http.build();
    }

    /**
     * Verifica la firma con las claves publicas de Keycloak (jwk-set-uri) y comprueba que el
     * emisor ({@code iss}) y la vigencia del token sean validos.
     * <p>
     * El emisor es la URL publica de Keycloak (la que ve el navegador), mientras que las claves
     * se descargan de una URL que puede ser distinta (por ejemplo {@code http://keycloak:8080}
     * dentro de Docker). Por eso no se usa {@code issuer-uri} para autoconfigurar el decoder.
     */
    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${keycloak.issuer-uri:http://localhost:8081/realms/piedrazul}") String issuerUri,
            @Value("${keycloak.jwk-set-uri:http://localhost:8081/realms/piedrazul/protocol/openid-connect/certs}")
            String jwkSetUri) {

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        OAuth2TokenValidator<Jwt> validator = JwtValidators.createDefaultWithIssuer(issuerUri);
        decoder.setJwtValidator(validator);
        return decoder;
    }
}
