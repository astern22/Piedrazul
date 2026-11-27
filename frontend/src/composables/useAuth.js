import { ref, computed } from 'vue'
import { authService } from '@/api'
import keycloak, { isE2EMode, setMockAuthenticated } from '@/keycloak'

function resolveCurrentToken() {
  if (isE2EMode()) return 'mock-jwt-token-e2e'
  return authService.getToken()
}

function resolveCurrentUser() {
  if (isE2EMode()) {
    return {
      username: 'paciente1',
      fullName: 'Juan Perez',
      email: 'paciente1@piedrazul.com',
      roles: ['PATIENT'],
    }
  }
  return authService.getCurrentUser()
}

const token = ref(resolveCurrentToken())
const user = ref(resolveCurrentUser())

/** Copia el estado de Keycloak (que no es reactivo) a las refs de Vue. */
export function syncState() {
  if (isE2EMode()) {
    setMockAuthenticated('PATIENT')
  }
  token.value = resolveCurrentToken()
  user.value = resolveCurrentUser()
}

// Keycloak notifica cada cambio de sesion; asi la UI reacciona sin recargar.
keycloak.onReady = syncState
keycloak.onAuthSuccess = syncState
keycloak.onAuthRefreshSuccess = syncState
keycloak.onAuthLogout = syncState
keycloak.onTokenExpired = () => {
  keycloak.updateToken(30).then(syncState).catch(syncState)
}

// Evento global emitido por el cliente HTTP cuando el backend responde 401
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    if (!isE2EMode()) {
      token.value = null
      user.value = null
    }
  })
}

/**
 * Composable para gestionar el estado reactivo de autenticacion y roles en la SPA.
 */
export function useAuth() {
  const isAuthenticated = computed(() => {
    if (isE2EMode()) return true
    return Boolean(token.value && authService.isAuthenticated())
  })

  /** Roles del usuario actual como array reactivo */
  const roles = computed(() => {
    return user.value?.roles || []
  })

  // ─── Helpers de rol ───
  const isAdmin = computed(() => roles.value.includes('ADMIN'))
  const isPatient = computed(() => roles.value.includes('PATIENT'))
  const isProfessional = computed(() => roles.value.includes('PROFESSIONAL'))
  const isScheduler = computed(() => roles.value.includes('SCHEDULER'))
  const isDoctor = computed(() => roles.value.includes('PROFESSIONAL') || roles.value.includes('MEDICO'))
  const canManagePatients = computed(() => isDoctor.value || isAdmin.value)

  /**
   * Verifica si el usuario tiene un rol especifico.
   * @param {string} role
   * @returns {boolean}
   */
  function hasRole(role) {
    return roles.value.includes(role)
  }

  /**
   * Verifica si el usuario tiene al menos uno de los roles indicados.
   * @param {string[]} roleList
   * @returns {boolean}
   */
  function hasAnyRole(roleList) {
    return roleList.some(r => roles.value.includes(r))
  }

  /**
   * Verifica si el usuario puede administrar (ADMIN o SCHEDULER).
   */
  const canManage = computed(() => {
    return isAdmin.value || isScheduler.value
  })

  /**
   * Redirige al login de Keycloak. Al volver, el estado reactivo se actualiza solo.
   * @param {Object} [options] por ejemplo { redirectUri }
   */
  async function login(options = {}) {
    if (isE2EMode()) {
      syncState()
      return Promise.resolve()
    }
    return authService.login(options)
  }

  /**
   * Registra un nuevo paciente (backend + Keycloak).
   */
  async function register(userData) {
    return await authService.register(userData)
  }

  /**
   * Cierra la sesion en Keycloak y reinicia el estado reactivo.
   */
  function logout() {
    token.value = null
    user.value = null
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('piedrazul_e2e_auth')
        window.sessionStorage.removeItem('piedrazul_e2e_auth')
        document.cookie = 'piedrazul_e2e_auth=; Max-Age=0; path=/'
      }
    } catch (e) {}
    return authService.logout()
  }

  return {
    token,
    user,
    isAuthenticated,
    roles,
    isAdmin,
    isPatient,
    isProfessional,
    isScheduler,
    isDoctor,
    canManage,
    canManagePatients,
    hasRole,
    hasAnyRole,
    login,
    register,
    logout,
    syncState,
  }
}
