package co.edu.unicauca.piedrazul.users.application;

import co.edu.unicauca.piedrazul.security.KeycloakAdminClient;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.RoleEntity;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.RoleRepository;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.UserEntity;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.UserRepository;
import co.edu.unicauca.piedrazul.users.presentation.dto.SchedulerRegistrationRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Gestion de las cuentas de agendadores (rol SCHEDULER).
 * Solo el administrador puede crearlas (ver SecurityConfig).
 */
@Service
public class SchedulerUserService {

    public static final String SCHEDULER_ROLE = "SCHEDULER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final KeycloakAdminClient keycloakAdminClient;

    public SchedulerUserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            KeycloakAdminClient keycloakAdminClient) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.keycloakAdminClient = keycloakAdminClient;
    }

    @Transactional
    public UserEntity createScheduler(SchedulerRegistrationRequest request) {

        String username = request.username().trim();
        String email = request.email().trim();
        String fullName = request.fullName().trim();

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException(
                    "El nombre de usuario ya esta en uso"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "El correo electronico ya esta registrado"
            );
        }

        RoleEntity schedulerRole = roleRepository
                .findByName(SCHEDULER_ROLE)
                .orElseThrow(() ->
                        new IllegalStateException("Rol SCHEDULER no encontrado"));

        // La cuenta (credenciales y rol) se crea en Keycloak; aqui solo queda el perfil.
        String keycloakUserId = keycloakAdminClient.createUser(
                username, email, fullName, request.password(), SCHEDULER_ROLE);

        try {
            UserEntity user = new UserEntity();
            user.setUsername(username);
            user.setFullName(fullName);
            user.setEmail(email);
            user.setPassword(KeycloakAdminClient.LOCAL_PASSWORD_PLACEHOLDER);
            user.setKeycloakUserId(keycloakUserId);
            user.setEnabled(true);
            user.getRoles().add(schedulerRole);

            return userRepository.save(user);
        } catch (RuntimeException e) {
            keycloakAdminClient.deleteUser(keycloakUserId);
            throw e;
        }
    }

    public List<UserEntity> findSchedulers() {
        return userRepository.findByRoles_NameOrderByFullNameAsc(SCHEDULER_ROLE);
    }
}
