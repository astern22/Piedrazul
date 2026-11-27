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
 * Detecta si la aplicacion esta ejecutandose en modo pruebas E2E o simulacion offline.
 */
export function isE2EMode() {
  if (typeof window === 'undefined') return false
  if (window.__E2E_AUTH__ === true) return true
  try {
    if (window.localStorage && window.localStorage.getItem('piedrazul_e2e_auth') === 'true') return true
    if (window.sessionStorage && window.sessionStorage.getItem('piedrazul_e2e_auth') === 'true') return true
    if (document.cookie && document.cookie.includes('piedrazul_e2e_auth=true')) return true
    if (window.location && window.location.search.includes('e2e=true')) return true
  } catch (e) {}
  return false
}

/**
 * Configura la instancia de Keycloak con una sesion simulada para pruebas.
 */
export function setMockAuthenticated(role = 'PATIENT') {
  keycloak.authenticated = true
  keycloak.token = 'mock-jwt-token-e2e'
  keycloak.tokenParsed = {
    sub: 'patient-e2e-1',
    preferred_username: 'paciente1',
    name: 'Juan Perez',
    email: 'paciente1@piedrazul.com',
    realm_access: {
      roles: [role],
    },
    exp: Math.floor(Date.now() / 1000) + 7200,
    iat: Math.floor(Date.now() / 1000),
  }
  keycloak.isTokenExpired = () => false
  keycloak.updateToken = () => Promise.resolve(false)
  keycloak.clearToken = () => {
    keycloak.authenticated = false
    keycloak.token = null
    keycloak.tokenParsed = null
  }
}

// Si estamos en entorno de pruebas, activar el mock inmediatamente
if (isE2EMode()) {
  setMockAuthenticated('PATIENT')
}

/**
 * Inicializa Keycloak una sola vez. Con "check-sso" se recupera la sesion existente
 * (si el usuario ya inicio sesion) sin forzar el login. Si Keycloak no responde,
 * la app igual arranca como usuario no autenticado (o autenticado si es E2E).
 * @returns {Promise<boolean>} true si hay una sesion autenticada
 */
export function initKeycloak() {
  if (isE2EMode()) {
    setMockAuthenticated('PATIENT')
    if (typeof keycloak.onReady === 'function') {
      keycloak.onReady(true)
    }
    return Promise.resolve(true)
  }

  if (!initPromise) {
    initPromise = keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then(authenticated => {
        return authenticated
      })
      .catch(error => {
        console.warn('No se pudo inicializar Keycloak (modo offline):', error)
        if (isE2EMode()) {
          setMockAuthenticated('PATIENT')
          return true
        }
        return false
      })
  }
  return initPromise
}

export default keycloak
