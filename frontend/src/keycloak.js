import Keycloak from 'keycloak-js'

/**
 * Instancia unica del adaptador de Keycloak (OpenID Connect, Authorization Code + PKCE).
 * La configuracion viene de variables de entorno de Vite (ver .env.example).
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'piedrazul',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'piedrazul-frontend',
})

let initPromise = null

/**
 * Inicializa Keycloak una sola vez. Con "check-sso" se recupera la sesion existente
 * (si el usuario ya inicio sesion) sin forzar el login. Si Keycloak no responde,
 * la app igual arranca como usuario no autenticado.
 * @returns {Promise<boolean>} true si hay una sesion autenticada
 */
export function initKeycloak() {
  if (!initPromise) {
    initPromise = keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .catch(error => {
        console.error('No se pudo inicializar Keycloak:', error)
        return false
      })
  }
  return initPromise
}

export default keycloak
