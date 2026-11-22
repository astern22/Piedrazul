package co.edu.unicauca.piedrazul.users.presentation;

import co.edu.unicauca.piedrazul.users.application.RegisterUserService;
import co.edu.unicauca.piedrazul.users.infrastructure.persistence.UserEntity;
import co.edu.unicauca.piedrazul.users.presentation.dto.RegisterRequest;
import co.edu.unicauca.piedrazul.users.presentation.dto.RegisterResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints publicos. El inicio de sesion ya no esta aqui: lo gestiona Keycloak
 * (el frontend redirige al login de Keycloak y recibe un JWT).
 */
@RestController
@RequestMapping("/auth")
public class AuthController {
<<<<<<< Updated upstream:src/main/java/co/edu/unicauca/piedrazul/users/presentation/AuthController.java

    private final RegisterUserService registerUserService;

=======
    private final RegisterUserService registerUserService;

>>>>>>> Stashed changes:backend/src/main/java/co/edu/unicauca/piedrazul/users/presentation/AuthController.java
    public AuthController(RegisterUserService registerUserService) {
        this.registerUserService = registerUserService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @RequestBody RegisterRequest request) {

        UserEntity user = registerUserService.register(request);

        return ResponseEntity.ok(
                new RegisterResponse(user.getUsername())
        );
    }
}
