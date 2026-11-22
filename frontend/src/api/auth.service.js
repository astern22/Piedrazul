import apiClient from './client.js'
import keycloak from '../keycloak.js'

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
    return keycloak.logout({ redirectUri: window.location.origin, ...options })
  },

  /**
   * Obtiene el access token actual.
   * @returns {string|null}
   */
  getToken() {
    return keycloak.authenticated && keycloak.token ? keycloak.token : null
  },

  /**
   * Indica si hay una sesion autenticada en Keycloak.
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(keycloak.authenticated && keycloak.token)
  },

  /**
   * Informacion del usuario autenticado, tomada del token de Keycloak.
   * Los roles salen del claim "realm_access.roles".
   * @returns {{username: string, fullName?: string, email?: string, roles: string[], exp?: number, iat?: number}|null}
   */
  getCurrentUser() {
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
