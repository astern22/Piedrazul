package co.edu.unicauca.piedrazul.users.application;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import co.edu.unicauca.piedrazul.patients.infrastructure.persistence.PatientEntity;
import co.edu.unicauca.piedrazul.patients.infrastructure.persistence.PatientRepository;
import co.edu.unicauca.piedrazul.security.KeycloakAdminClient;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.RoleEntity;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.RoleRepository;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.UserEntity;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.UserRepository;
import co.edu.unicauca.piedrazul.users.presentation.dto.RegisterRequest;

@Service
public class RegisterUserService {

    private final UserRepository repository;
    private final RoleRepository roleRepository;
    private final PatientRepository patientRepository;
    private final KeycloakAdminClient keycloakAdminClient;

    public RegisterUserService(
            UserRepository repository,
            RoleRepository roleRepository,
            PatientRepository patientRepository,
            KeycloakAdminClient keycloakAdminClient) {

        this.repository = repository;
        this.roleRepository = roleRepository;
        this.patientRepository = patientRepository;
        this.keycloakAdminClient = keycloakAdminClient;
    }

    public UserEntity register(RegisterRequest request) {

        String documentNumber = request.documentNumber().trim();

        Optional<PatientEntity> existingPatient = patientRepository.findByDocumentNumber(documentNumber);

        if (existingPatient.isPresent() && existingPatient.get().getUserId() != null) {
            throw new RuntimeException("Ya existe una cuenta asociada a este numero de documento");
        }

        if (repository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("El nombre de usuario ya esta en uso");
        }

        if (repository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("El correo electronico ya esta registrado");
        }

        RoleEntity patientRole = roleRepository
                .findByName("PATIENT")
                .orElseThrow(() -> new RuntimeException("Rol PATIENT no encontrado"));

        // La cuenta (credenciales y rol) se crea en Keycloak; aqui solo queda el
        // perfil.
        String keycloakUserId = keycloakAdminClient.createUser(
                request.username(),
                request.email(),
                request.fullName(),
                request.password(),
                "PATIENT");

        try {
            UserEntity user = new UserEntity();
            user.setUsername(request.username());
            user.setFullName(request.fullName());
            user.setEmail(request.email());
            user.setPassword(KeycloakAdminClient.LOCAL_PASSWORD_PLACEHOLDER);
            user.setKeycloakUserId(keycloakUserId);
            user.setEnabled(true);
            user.getRoles().add(patientRole);

            UserEntity savedUser = repository.save(user);

            if (existingPatient.isPresent()) {
                PatientEntity patient = existingPatient.get();
                patient.setUserId(savedUser.getId());
                patientRepository.save(patient);
            } else {
                PatientEntity newPatient = new PatientEntity();
                newPatient.setDocumentNumber(documentNumber);
                newPatient.setUserId(savedUser.getId());
                patientRepository.save(newPatient);
            }

            return savedUser;
        } catch (RuntimeException e) {
            // Si falla la base de datos no dejamos una cuenta huerfana en Keycloak
            keycloakAdminClient.deleteUser(keycloakUserId);
            throw e;
        }
    }
}
