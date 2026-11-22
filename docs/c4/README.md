# Modelo C4 - Piedrazul Monolito Modular

Documentacion de arquitectura usando el modelo C4.

> Los diagramas incluyen Keycloak como proveedor de identidad (OpenID Connect) y su propia base de datos. Las fuentes `.puml` usan `!pragma layout elk` y `skinparam linetype ortho` para obtener rutas ortogonales; se recomienda PlantUML 1.2025.x o superior con Graphviz instalado. Los SVG de este directorio se generan a partir de esos archivos.

## 1. Contexto del Sistema
![alt](contexto.svg)

## 2. Contenedores
![alt](contenedores.svg)

## 3. Componentes
### Backend
![alt](componente_API.svg)

### Frontend
![alt](componente_front.svg)

### Base de Datos
![alt](componente_bd.svg)

### Modulo Agendamiento
![alt](componente_agendamiento.svg)

### Modulo Citas
![alt](componente_citas.svg)

### Modulo Profesionales
![alt](componente_profesionales.svg)

### Modulo Usuarios
![alt](componente_auth.svg)

### Seguridad
![alt](componente_seguridad.svg)
