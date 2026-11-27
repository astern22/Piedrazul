package co.edu.unicauca.piedrazul.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cliente minimo de la Admin API de Keycloak. Se autentica con el client confidencial
 * {@code piedrazul-backend} (client_credentials) y permite crear/eliminar usuarios con un
 * rol de realm. Es la unica via por la que el backend crea cuentas: las contrasenas viven
 * en Keycloak y ya no se guardan en la base de datos de la aplicacion.
 */
@Component
public class KeycloakAdminClient {

    /** Valor que se guarda en users.password: la contrasena real solo existe en Keycloak. */
    public static final String LOCAL_PASSWORD_PLACEHOLDER = "{keycloak}";

    private static final Logger log = LoggerFactory.getLogger(KeycloakAdminClient.class);

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {
            };

    private final RestClient restClient;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    public KeycloakAdminClient(
            @Value("${keycloak.admin-url:http://localhost:8081}") String adminUrl,
            @Value("${keycloak.realm:piedrazul}") String realm,
            @Value("${keycloak.admin-client-id:piedrazul-backend}") String clientId,
            @Value("${keycloak.admin-client-secret:backend-dev-secret}") String clientSecret) {

        this.restClient = RestClient.builder().baseUrl(adminUrl).build();
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    /**
     * Crea el usuario en Keycloak (contrasena definitiva, correo verificado) y le asigna el
     * rol de realm indicado.
     *
     * @return el id del usuario en Keycloak
     * @throws IllegalArgumentException si el usuario o el correo ya existen
     * @throws IllegalStateException    si Keycloak no responde o rechaza la solicitud
     */
    public String createUser(String username, String email, String fullName, String password, String roleName) {
        try {
            String token = obtainToken();
            String userId = createKeycloakUser(token, username, email, fullName, password);

            try {
                assignRealmRole(token, userId, roleName);
            } catch (RuntimeException e) {
                // No dejar usuarios a medias (sin rol) en Keycloak
                deleteQuietly(token, userId);
                throw e;
            }

            return userId;
        } catch (HttpClientErrorException.Conflict e) {
            throw new IllegalArgumentException(
                    "El nombre de usuario o el correo electronico ya estan registrados");
        } catch (ResourceAccessException e) {
            log.error("No se pudo conectar con Keycloak", e);
            throw new IllegalStateException(
                    "No se pudo conectar con el servidor de autenticacion (Keycloak)");
        } catch (RestClientResponseException e) {
            log.error("Keycloak rechazo la solicitud: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            String body = e.getResponseBodyAsString();
            if (e.getStatusCode().value() == 400 && body != null) {
                if (body.contains("\"username\"") && body.contains("error-invalid-length")) {
                    throw new IllegalArgumentException(
                            "El nombre de usuario debe tener entre 3 y 50 caracteres");
                }
                if (body.contains("error-username-invalid-character")) {
                    throw new IllegalArgumentException(
                            "El nombre de usuario contiene caracteres no permitidos");
                }
                if (body.contains("error-invalid-email")) {
                    throw new IllegalArgumentException("El correo electronico no es valido");
                }
            }
            throw new IllegalStateException(
                    "El servidor de autenticacion rechazo la solicitud (HTTP "
                            + e.getStatusCode().value() + ")");
        } catch (RestClientException e) {
            log.error("Error al comunicarse con Keycloak", e);
            throw new IllegalStateException("Error al comunicarse con el servidor de autenticacion");
        }
    }

    /**
     * Elimina un usuario de Keycloak. Se usa para deshacer el alta cuando falla el guardado en
     * la base de datos. Nunca lanza excepciones.
     */
    public void deleteUser(String keycloakUserId) {
        if (keycloakUserId == null || keycloakUserId.isBlank()) {
            return;
        }
        try {
            deleteQuietly(obtainToken(), keycloakUserId);
        } catch (RuntimeException e) {
            log.error("No se pudo eliminar el usuario {} de Keycloak", keycloakUserId, e);
        }
    }

    private String obtainToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);

        Map<String, Object> body = restClient.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(MAP_TYPE);

        Object accessToken = body == null ? null : body.get("access_token");
        if (accessToken == null) {
            throw new IllegalStateException("Keycloak no devolvio un token de acceso");
        }
        return accessToken.toString();
    }

    private String createKeycloakUser(String token, String username, String email,
                                      String fullName, String password) {

        String trimmedName = fullName == null ? "" : fullName.trim();
        int firstSpace = trimmedName.indexOf(' ');
        String firstName = firstSpace > 0 ? trimmedName.substring(0, firstSpace) : trimmedName;
        String lastName = firstSpace > 0 ? trimmedName.substring(firstSpace + 1).trim() : "-";

        Map<String, Object> credential = new LinkedHashMap<>();
        credential.put("type", "password");
        credential.put("value", password);
        credential.put("temporary", false);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("username", username);
        payload.put("email", email);
        payload.put("firstName", firstName);
        payload.put("lastName", lastName);
        payload.put("enabled", true);
        payload.put("emailVerified", true);
        payload.put("credentials", List.of(credential));

        ResponseEntity<Void> response = restClient.post()
                .uri("/admin/realms/{realm}/users", realm)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        URI location = response.getHeaders().getLocation();
        if (location != null && location.getPath() != null) {
            String path = location.getPath();
            return path.substring(path.lastIndexOf('/') + 1);
        }

        return findUserIdByUsername(token, username);
    }

    private String findUserIdByUsername(String token, String username) {
        List<Map<String, Object>> users = restClient.get()
                .uri("/admin/realms/{realm}/users?username={username}&exact=true", realm, username)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        if (users == null || users.isEmpty() || users.getFirst().get("id") == null) {
            throw new IllegalStateException("No se pudo obtener el usuario creado en Keycloak");
        }
        return users.getFirst().get("id").toString();
    }

    private void assignRealmRole(String token, String userId, String roleName) {
        Map<String, Object> role = restClient.get()
                .uri("/admin/realms/{realm}/roles/{role}", realm, roleName)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(MAP_TYPE);

        if (role == null || role.get("id") == null) {
            throw new IllegalStateException("El rol " + roleName + " no existe en Keycloak");
        }

        Map<String, Object> roleRepresentation = new LinkedHashMap<>();
        roleRepresentation.put("id", role.get("id"));
        roleRepresentation.put("name", role.get("name"));

        List<Map<String, Object>> roles = new ArrayList<>();
        roles.add(roleRepresentation);

        restClient.post()
                .uri("/admin/realms/{realm}/users/{id}/role-mappings/realm", realm, userId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(roles)
                .retrieve()
                .toBodilessEntity();
    }

    private void deleteQuietly(String token, String userId) {
        try {
            restClient.delete()
                    .uri("/admin/realms/{realm}/users/{id}", realm, userId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException e) {
            log.error("No se pudo eliminar el usuario {} de Keycloak", userId, e);
        }
    }
}
