import apiClient from './client.js'
import keycloak, { isE2EMode } from '../keycloak.js'

/**
 * Servicio de autenticacion. El inicio y cierre de sesion los gestiona Keycloak
 * (OpenID Connect); el registro de pacientes sigue pasando por el backend (/auth/register).
 */
export const authService = {
  /**
   * Redirige al formulario de inicio de sesion de Keycloak.
   * @param {Object} [options]
   * @param {string} [options.redirectUri] URL absoluta a la que volver tras iniciar sesion
   */
  login(options = {}) {
    if (isE2EMode()) {
      return Promise.resolve()
    }
    return keycloak.login(options)
  },

  /**
   * Registra un nuevo paciente. El backend crea la cuenta en Keycloak y el perfil local.
   * @param {Object} userData
   * @param {string} userData.username
   * @param {string} userData.password
   * @param {string} userData.fullName
   * @param {string} userData.email
   * @param {string} userData.documentNumber
   * @returns {Promise<{username: string}>}
   */
  async register({ username, password, fullName, email, documentNumber }) {
    const response = await apiClient.post('/auth/register', {
      username,
      password,
      fullName,
      email,
      documentNumber,
    })
    return response.data
  },

  /**
   * Cierra la sesion en Keycloak y vuelve a la pagina de inicio.
   * @param {Object} [options]
   */
  logout(options = {}) {
    if (isE2EMode()) {
      keycloak.authenticated = false
      keycloak.token = null
      keycloak.tokenParsed = null
      return Promise.resolve()
    }
    return keycloak.logout({ redirectUri: window.location.origin, ...options })
  },

  /**
   * Obtiene el access token actual.
   * @returns {string|null}
   */
  getToken() {
    if (isE2EMode()) {
      return 'mock-jwt-token-e2e'
    }
    return keycloak.authenticated && keycloak.token ? keycloak.token : null
  },

  /**
   * Indica si hay una sesion autenticada en Keycloak.
   * @returns {boolean}
   */
  isAuthenticated() {
    if (isE2EMode()) {
      return true
    }
    return Boolean(keycloak.authenticated && keycloak.token)
  },

  /**
   * Informacion del usuario autenticado, tomada del token de Keycloak.
   * Los roles salen del claim "realm_access.roles".
   * @returns {{username: string, fullName?: string, email?: string, roles: string[], exp?: number, iat?: number}|null}
   */
  getCurrentUser() {
    if (isE2EMode()) {
      return {
        username: 'paciente1',
        fullName: 'Juan Perez',
        email: 'paciente1@piedrazul.com',
        roles: ['PATIENT'],
        exp: Math.floor(Date.now() / 1000) + 7200,
        iat: Math.floor(Date.now() / 1000),
      }
    }
    const parsed = keycloak.tokenParsed
    if (!keycloak.authenticated || !parsed) return null

    const roles = parsed.realm_access?.roles
    return {
      username: parsed.preferred_username || parsed.sub,
      fullName: parsed.name,
      email: parsed.email,
      roles: Array.isArray(roles) ? roles : [],
      exp: parsed.exp,
      iat: parsed.iat,
    }
  },
}

export default authService
