import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initKeycloak } from './keycloak'

// Se resuelve primero la sesion de Keycloak para que los guards del router
// ya sepan si el usuario esta autenticado cuando se hace la primera navegacion.
initKeycloak().finally(() => {
  const app = createApp(App)

  app.use(router)

  app.mount('#app')
})
