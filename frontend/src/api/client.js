import axios from 'axios'
import keycloak from '../keycloak.js'

/**
 * Clave historica del token en localStorage. Ya no se usa: el token vive en memoria
 * dentro del adaptador de Keycloak. Se conserva solo por compatibilidad de importaciones.
 */
export const TOKEN_KEY = 'piedrazul_token'

/**
 * Obtiene el access token (JWT) actual emitido por Keycloak.
 * @returns {string|null}
 */
export function getToken() {
  return keycloak.authenticated && keycloak.token ? keycloak.token : null
}

/**
 * Compatibilidad: el token lo gestiona Keycloak, no hay nada que almacenar a mano.
 */
export function setToken() {}

/**
 * Descarta el token en memoria (la sesion de Keycloak sigue viva hasta hacer logout).
 */
export function removeToken() {
  if (keycloak.authenticated) {
    keycloak.clearToken()
  }
}

/**
 * Payload decodificado del access token actual.
 * @returns {object|null}
 */
export function decodeToken() {
  return keycloak.authenticated && keycloak.tokenParsed ? keycloak.tokenParsed : null
}

/**
 * Indica si no hay token o ya expiro.
 * @returns {boolean}
 */
export function isTokenExpired() {
  if (!keycloak.authenticated || !keycloak.token) return true
  return keycloak.isTokenExpired()
}

/**
 * Instancia de Axios configurada para el backend Piedrazul.
 */
const apiClient = axios.create({
  baseURL:
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE_URL) ||
    '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

// Interceptor de Peticion: renueva el token si esta por vencer y lo adjunta
apiClient.interceptors.request.use(
  async config => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30)
      } catch (error) {
        // La sesion de Keycloak expiro: se pide iniciar sesion de nuevo
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        keycloak.login({ redirectUri: window.location.href })
        return Promise.reject({
          status: 401,
          message: 'La sesion expiro. Redirigiendo al inicio de sesion...',
        })
      }
      config.headers.Authorization = `Bearer ${keycloak.token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Interceptor de Respuesta: tratamiento unificado de errores
apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response ? error.response.status : null

    if (status === 401) {
      removeToken()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    // Normalizar mensaje de error para la vista
    const errorResponse = {
      status,
      message:
        (error.response && error.response.data && (error.response.data.message || error.response.data.error)) ||
        error.message ||
        'Ha ocurrido un error inesperado al conectar con el servidor',
      data: error.response?.data,
    }

    return Promise.reject(errorResponse)
  }
)

export default apiClient
