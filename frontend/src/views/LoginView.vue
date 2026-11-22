<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AuthCardTemplate from '@/views/components/AuthCardTemplate.vue'

const route = useRoute()
const { login } = useAuth()

const isLoading = ref(false)
const errorMessage = ref('')

/**
 * El inicio de sesion lo gestiona Keycloak: se redirige a su formulario y, al volver,
 * el usuario llega a la ruta que intentaba abrir (o a /appointments).
 */
async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const redirectPath = route.query.redirect || '/appointments'

    await login({
      redirectUri: window.location.origin + redirectPath,
    })
  } catch (error) {
    errorMessage.value =
      error?.message ||
      'No se pudo conectar con el servidor de autenticacion. Intenta nuevamente.'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">

      <AuthCardTemplate />

      <div class="auth-login">
        <div class="auth-header">
          <h2>Iniciar Sesion</h2>
          <p>Accede a Piedrazul con tu cuenta</p>
        </div>

        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <div class="auth-form">
          <p class="auth-hint">
            Seras redirigido al servicio de autenticacion seguro de Piedra Azul
            para ingresar tu usuario y contraseña.
          </p>

          <button
            type="button"
            class="btn-submit"
            :disabled="isLoading"
            @click="handleLogin"
          >
            <span v-if="isLoading" class="spinner"></span>
            <span v-else>Ingresar</span>
          </button>
        </div>

        <div class="auth-footer">
          <p>
            ¿No tienes una cuenta?
            <router-link to="/register">
              Registrate aqui
            </router-link>
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
  padding: 20px;
}

.auth-card {
  width: 900px;
  max-width: 100%;
  min-height: 550px;

  display: grid;
  grid-template-columns: 1fr 1fr;

  background: white;
  border-radius: 20px;
  overflow: hidden;

  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
}

.auth-login {
  background: #ffffff;
  padding: 50px;

  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header h2 {
  margin: 15px 0 8px;
  color: #1f2937;
}

.auth-header p {
  margin: 0;
  color: #6b7280;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-hint {
  margin: 0;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
}

.btn-submit {
  border: none;
  border-radius: 8px;

  padding: 14px;

  background: #7c3aed;
  color: white;

  font-size: 16px;
  font-weight: 600;

  cursor: pointer;
  transition: 0.2s;

  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-submit:hover {
  background: #4d2785;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 25px;
  color: #6b7280;
}

.auth-footer a {
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.alert-error {
  background: #fee2e2;
  color: #b91c1c;

  padding: 12px;
  border-radius: 8px;

  margin-bottom: 20px;
}

.spinner {
  display: inline-block;

  width: 18px;
  height: 18px;

  border: 3px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;

  border-radius: 50%;

  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
