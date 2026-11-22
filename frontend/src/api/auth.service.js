<<<<<<< Updated upstream
import axios from 'axios'
import apiClient, {
  getToken,
  setToken,
  removeToken,
  decodeToken,
  isTokenExpired,
} from './client.js'
=======
import apiClient from './client.js'
import keycloak from '../keycloak.js'
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  async login({ username, password }) {
  const params = new URLSearchParams()

  params.append('grant_type', 'password')
  params.append('client_id', 'piedrazul-api')
  params.append('username', username)
  params.append('password', password)

  try {
    const response = await axios.post(
      'http://localhost:8081/realms/piedrazul/protocol/openid-connect/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const accessToken = response.data.access_token

    if (!accessToken) {
      throw new Error('Keycloak no devolvió un token')
    }

    setToken(accessToken)

    return {
      token: accessToken,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    }
  } catch (error) {
    console.error('Error iniciando sesión:', error.response?.data || error)
    throw error
  }
},
=======
  login(options = {}) {
    return keycloak.login(options)
  },
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
      username: decoded.preferred_username || decoded.sub,
      roles: decoded.realm_access?.roles || [],
      exp: decoded.exp,
      iat: decoded.iat,
=======
      username: parsed.preferred_username || parsed.sub,
      fullName: parsed.name,
      email: parsed.email,
      roles: Array.isArray(roles) ? roles : [],
      exp: parsed.exp,
      iat: parsed.iat,
>>>>>>> Stashed changes
    }
  },
}

export default authService
