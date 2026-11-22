# Piedrazul

![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Vue.js](https://img.shields.io/badge/vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)

Sistema web para gestionar pacientes, profesionales, especialidades, disponibilidad y citas médicas. El proyecto está organizado como un monolito modular, con API REST y control de acceso por roles.

## Tecnologías

- Backend: Java 21, Spring Boot y PostgreSQL.
- Frontend: Vue 3, Vite y Node.js 22.18 o superior.
- Autenticación y autorización: Keycloak (OpenID Connect, tokens JWT).

## Requisitos

Descargar Docker Desktop y los servicios de Docker CLI.

## Ejecución local

Desde la raíz del proyecto, inicia el backend:

```powershell
.\mvnw.cmd spring-boot:run
```

En otra terminal, inicia el frontend:

```bash
docker compose build --no-cache
```

Despues de crear los contenedores, hay que ejecutarlos:

```bash
docker compose up -d
```

Para apagarlo:

```bash
docker compose down -v
```

Para remover por completo el proyecto:

```bash
docker compose down --rmi all
```

## Documentación

- [Documento de requisitos IEEE 830](docs/ERS_PiedraAzul_IEEE830_2026-II_FINAL.docx)
- [Documento de arquitectura](docs/Documento-Piedra-azul-documento-arquitectura_corte1.docx)
- [Diagramas de arquitectura C4](docs/c4/README.md)
- [Historias de usuario](docs/epicas/)
