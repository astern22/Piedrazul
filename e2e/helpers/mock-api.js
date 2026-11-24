/**
 * Helper para interceptar llamadas de red y autenticación en pruebas E2E
 * Permite ejecutar las pruebas de punta a punta tanto en modo autónomo (offline/CI)
 * como contra los contenedores reales de Docker (si E2E_USE_REAL_BACKEND=true).
 */

export async function setupE2EEnvironment(page) {
  if (process.env.E2E_USE_REAL_BACKEND === 'true') {
    return
  }

  // 1. Inyectar cookie a nivel de contexto de navegador
  try {
    await page.context().addCookies([
      {
        name: 'piedrazul_e2e_auth',
        value: 'true',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ])
  } catch (e) {}

  // 2. Inyectar banderas en el contexto antes de que cualquier script arranque
  await page.context().addInitScript(() => {
    window.__E2E_AUTH__ = true
    try {
      window.localStorage.setItem('piedrazul_e2e_auth', 'true')
      window.sessionStorage.setItem('piedrazul_e2e_auth', 'true')
      document.cookie = 'piedrazul_e2e_auth=true; path=/'
    } catch (e) {}
  })

  await page.addInitScript(() => {
    window.__E2E_AUTH__ = true
    try {
      window.localStorage.setItem('piedrazul_e2e_auth', 'true')
      window.sessionStorage.setItem('piedrazul_e2e_auth', 'true')
      document.cookie = 'piedrazul_e2e_auth=true; path=/'
    } catch (e) {}
  })

  // Estado en memoria para la sesión de prueba
  const appointments = [
    {
      id: 1,
      patientId: 1,
      professionalId: 2,
      appointmentDate: '2026-11-28',
      startTime: '08:00:00',
      endTime: '08:30:00',
      status: 'SCHEDULED',
      cancellationReason: null,
    },
  ]

  const bookedSlots = new Set(['2026-11-28_2_08:00'])

  const professionals = [
    {
      id: 2,
      userId: 5,
      fullName: 'Dr. Carlos Perez',
      specialtyId: 1,
      specialtyName: 'Medicina General',
      appointmentIntervalMinutes: 30,
      active: true,
    },
    {
      id: 3,
      userId: 6,
      fullName: 'Dra. Ana Gomez',
      specialtyId: 2,
      specialtyName: 'Fisioterapia',
      appointmentIntervalMinutes: 45,
      active: true,
    },
  ]

  const patientMe = {
    id: 1,
    documentNumber: '1061700101',
    fullName: 'Juan Perez',
    phone: '3120000001',
    birthDate: '1995-05-15',
    userId: 10,
  }

  // Interceptar cualquier llamada hacia Keycloak (:8081)
  await page.route(/.*:8081\/.*/, async route => {
    const url = route.request().url()
    if (url.includes('/openid-connect/auth')) {
      const parsed = new URL(url)
      const redirectUri = parsed.searchParams.get('redirect_uri') || 'http://localhost:3000/appointments'
      await route.fulfill({
        status: 302,
        headers: { Location: redirectUri },
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token-e2e',
          expires_in: 7200,
          token_type: 'Bearer',
        }),
      })
    }
  })

  // Interceptar perfil del paciente autenticado
  await page.route('**/api/patients/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(patientMe),
    })
  })

  // Interceptar lista de profesionales
  await page.route('**/api/professionals**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(professionals),
    })
  })

  // Interceptar cálculo de franjas horarias disponibles
  await page.route('**/api/availability/professional/*/slots**', async route => {
    const url = new URL(route.request().url())
    const date = url.searchParams.get('date') || '2026-11-28'

    const allSlots = [
      { startTime: '08:00:00', endTime: '08:30:00' },
      { startTime: '08:30:00', endTime: '09:00:00' },
      { startTime: '09:00:00', endTime: '09:30:00' },
      { startTime: '10:00:00', endTime: '10:30:00' },
      { startTime: '10:30:00', endTime: '11:00:00' },
    ]

    const availableSlots = allSlots.filter(
      s => !bookedSlots.has(`${date}_2_${s.startTime.substring(0, 5)}`)
    )

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(availableSlots),
    })
  })

  // Interceptar cancelación de citas (tanto /api/appointments/me/cancel/* como DELETE /api/appointments/*)
  await page.route(/\/api\/appointments\/(me\/cancel|\d+)(\/.*)?/, async route => {
    if (route.request().method() === 'DELETE' || route.request().method() === 'POST') {
      try {
        const urlStr = route.request().url()
        const url = new URL(urlStr)
        const pathParts = url.pathname.split('/')
        const id = Number(pathParts[pathParts.length - 1]) || 1

        let reason = 'Motivo de prueba justificado'
        if (url.searchParams.get('reason')) {
          reason = url.searchParams.get('reason')
        }
        const postData = route.request().postData()
        if (postData) {
          try {
            const parsed = JSON.parse(postData)
            if (parsed && parsed.reason) reason = parsed.reason
          } catch (e) {}
        }

        const target = appointments.find(a => a.id === id) || appointments[0]
        if (target) {
          target.status = 'CANCELLED'
          target.cancellationReason = reason
          const start5 = String(target.startTime).substring(0, 5)
          const slotKey = `${target.appointmentDate}_${target.professionalId}_${start5}`
          bookedSlots.delete(slotKey)
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(target),
          })
          return
        }
      } catch (e) {}

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, status: 'CANCELLED' }),
      })
      return
    }

    await route.fallback()
  })

  // Interceptar consultas de citas (propias del paciente y generales)
  await page.route(/\/api\/appointments(\/me)?(\?.*)?$/, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(appointments),
      })
    } else {
      await route.fallback()
    }
  })

  // Interceptar creación de citas
  await page.route('**/api/appointments/create', async route => {
    const data = JSON.parse(route.request().postData() || '{}')
    const start5 = String(data.startTime || '10:00').substring(0, 5)
    const slotKey = `${data.appointmentDate}_${data.professionalId}_${start5}`

    if (bookedSlots.has(slotKey)) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'El horario ya no está disponible. Por favor selecciona otra franja.',
        }),
      })
      return
    }

    const newAppointment = {
      id: appointments.length + 101,
      patientId: data.patientId || 1,
      professionalId: Number(data.professionalId),
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'SCHEDULED',
      cancellationReason: null,
    }

    appointments.push(newAppointment)
    bookedSlots.add(slotKey)

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(newAppointment),
    })
  })
}

/**
 * Inicia sesión como paciente y asegura estar en el panel de Citas Médicas
 */
export async function loginAsPatient(page) {
  // Navegar inicialmente a la ruta de citas
  await page.goto('/appointments')

  // Si por alguna razón la ruta redirigió a /login, pulsar "Ingresar"
  if (page.url().includes('/login')) {
    const ingresarBtn = page.getByRole('button', { name: /Ingresar/i })
    if (await ingresarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ingresarBtn.click()
    }

    // Si navegó al formulario externo de Keycloak en localhost:8081
    if (page.url().includes(':8081')) {
      await page.locator('#username').fill('paciente1')
      await page.locator('#password').fill('1234')
      await page.locator('#kc-login').click()
    }
  }

  // Asegurar que estamos en /appointments
  if (!page.url().includes('/appointments')) {
    await page.goto('/appointments')
  }

  // Esperar a que el título principal de Citas Médicas sea visible
  await page.waitForSelector('.page-header h1', { timeout: 15000 })
}
