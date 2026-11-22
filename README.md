# Piedrazul

Sistema web para gestionar pacientes, profesionales, especialidades, disponibilidad y citas médicas. El proyecto está organizado como un monolito modular, con API REST y control de acceso por roles.

## Tecnologías

- Backend: Java 21, Spring Boot y PostgreSQL.
- Frontend: Vue 3, Vite y Node.js 22.18 o superior.
- Autenticación y autorización: Keycloak (OpenID Connect, tokens JWT).

## Requisitos

Instala Java 21, Node.js, PostgreSQL y npm. Antes de iniciar la aplicación, configura PostgreSQL con la base de datos y el esquema que espera el backend (`piedrazuldb` y `piedrazul`) y revisa las credenciales en `src/main/resources/application.properties`.

> Los scripts de `DB/` pueden borrar y recrear bases de datos o esquemas. Revísalos y respalda los datos antes de ejecutarlos.

## Ejecución local

<<<<<<< Updated upstream
Desde la raíz del proyecto, inicia el backend:
=======
(Opcional) Copiar `.env.example` a `.env` para cambiar contraseñas y URLs. Sin ese archivo se usan valores de desarrollo.

Desde la raíz del proyecto, construir los contenedores de Docker:
>>>>>>> Stashed changes

```powershell
.\mvnw.cmd spring-boot:run
```

En otra terminal, inicia el frontend:

```powershell
cd frontend
npm install
npm run dev
```

Abre la URL que indique Vite (por defecto `http://localhost:5173`). La API corre en `http://localhost:8080`; en desarrollo, Vite redirige las solicitudes `/api` y `/auth` al backend.

Para ejecutar las pruebas del backend desde la raíz:

```powershell
.\mvnw.cmd test
```

Para generar el frontend de producción:

```powershell
cd frontend
npm run build
```

## Documentación

<<<<<<< Updated upstream
- [Documento de requisitos IEEE 830](docs/ERS_PiedraAzul_IEEE830_2026-II_FINAL.docx)
- [Documento de arquitectura](docs/Documento-Piedra-azul-documento-arquitectura_corte1.docx)
- [Diagramas de arquitectura C4](docs/c4/README.md)
- [Historias de usuario](docs/epicas/)
=======
- La API del backend se ejecuta en `http://localhost:8080/api`.

- La aplicacion web se ejecuta en `http://localhost:3000`.

- La base de datos de postgres se ejecuta en `http://localhost:5432`.

- Keycloak se ejecuta en `http://localhost:8081` (consola de administración).

## Autenticación con Keycloak

El login y los tokens los gestiona Keycloak; el backend solo valida el JWT y crea cuentas mediante la Admin API.

```
Navegador (Vue + keycloak-js, PKCE) ──login──► Keycloak (realm "piedrazul")
        │                                          │ emite access token (JWT)
        └── Authorization: Bearer <JWT> ──► Backend Spring (resource server)
                                              └─ valida firma/emisor, lee realm_access.roles
```

- **Realm:** `piedrazul` (importado automáticamente desde `keycloak/piedrazul-realm.json`).
- **Roles de realm:** `ADMIN`, `PATIENT`, `PROFESSIONAL`, `SCHEDULER`.
- **Clients:** `piedrazul-frontend` (público, PKCE) y `piedrazul-backend` (confidencial, service account para crear usuarios).
- **Registro:** `POST /auth/register` crea el usuario en Keycloak (rol `PATIENT`) y su perfil en la base de datos. Los agendadores (`/api/users/schedulers`) y profesionales (`/api/professionals/register`) se crean igual, con su rol.
- La contraseña ya no se guarda en la base de datos (`users.password` queda con el valor `{keycloak}`).

### Usuarios de prueba (se crean con el realm)

| Usuario     | Contraseña  | Rol          |
|-------------|-------------|--------------|
| `admin`     | `Admin123!` | ADMIN        |
| `medico1`   | `1234`      | PROFESSIONAL |
| `paciente1` | `1234`      | PATIENT      |
| `terapeuta1`| `1234`      | PROFESSIONAL (deshabilitado) |

Consola de Keycloak: `http://localhost:8081` (usuario `admin`, contraseña `admin` por defecto, ver `.env`).

> Los usuarios del realm solo se importan la primera vez. Si se cambia `piedrazul-realm.json`
> hay que recrear Keycloak: `docker compose down keycloak keycloak-db -v` y volver a levantar.

### Desarrollo sin Docker para backend/frontend

```bash
docker compose up -d db keycloak-db keycloak   # solo la infraestructura
cd backend && ./mvnw spring-boot:run             # usa keycloak.* de application.properties
cd frontend && npm install && npm run dev        # http://localhost:3000
```
>>>>>>> Stashed changes
