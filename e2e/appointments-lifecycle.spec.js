// @ts-check
import { test, expect } from '@playwright/test'
import { setupE2EEnvironment, loginAsPatient } from './helpers/mock-api.js'

test.describe('Pruebas de Punta a Punta (E2E) - Ciclo de Vida de Citas Médicas', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Configurar entorno de simulación de red y autenticación
    await setupE2EEnvironment(page)
  })

  test('E2E-01: Ciclo completo de agendamiento de cita médica', async ({ page }) => {
    // 1. Iniciar sesión y navegar a la pantalla de Citas Médicas
    await loginAsPatient(page)

    // 2. Verificar que se cargue la vista de Citas Médicas
    const title = page.locator('.page-header h1')
    await expect(title).toBeVisible({ timeout: 10000 })
    await expect(title).toContainText(/Gestion de Citas Medicas/i)

    // 3. Abrir el formulario de agendamiento
    const scheduleButton = page.getByRole('button', { name: /Agendar Cita/i })
    await expect(scheduleButton).toBeVisible()
    await scheduleButton.click()

    // 4. Seleccionar profesional médico (Dr. Carlos Perez)
    const professionalSelect = page.locator('#professionalId')
    await expect(professionalSelect).toBeVisible()
    await professionalSelect.selectOption('2')

    // 5. Seleccionar una fecha válida (futura)
    const dateInput = page.locator('#appointmentDate')
    await dateInput.fill('2026-11-28')

    // 6. Esperar y seleccionar una franja horaria libre (slot chip de 10:00 a 10:30)
    const slotChip = page.locator('.slot-chip', { hasText: '10:00' })
    await expect(slotChip).toBeVisible({ timeout: 10000 })
    await slotChip.click()
    await expect(slotChip).toHaveClass(/slot-selected/)

    // 7. Guardar la cita médica
    const saveButton = page.getByRole('button', { name: /Guardar Cita/i })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // 8. Verificar confirmación en pantalla
    const successAlert = page.locator('.alert-success')
    await expect(successAlert).toBeVisible({ timeout: 10000 })
    await expect(successAlert).toContainText(/agendada correctamente/i)

    // 9. Verificar que la cita figure en la tabla en estado PROGRAMADA / SCHEDULED
    const appointmentsTable = page.locator('.data-table')
    await expect(appointmentsTable).toBeVisible()
    await expect(appointmentsTable).toContainText('2026-11-28')
    await expect(appointmentsTable).toContainText(/PROGRAMADA|SCHEDULED/i)
  })

  test('E2E-02: Verificación de persistencia tras recargar página (F5)', async ({ page }) => {
    // 1. Iniciar sesión y cargar la vista de citas
    await loginAsPatient(page)

    // 2. Agendar cita en franja 10:00
    await page.getByRole('button', { name: /Agendar Cita/i }).click()
    await page.locator('#professionalId').selectOption('2')
    await page.locator('#appointmentDate').fill('2026-11-28')

    const slotChip = page.locator('.slot-chip', { hasText: '10:00' })
    await expect(slotChip).toBeVisible({ timeout: 10000 })
    await slotChip.click()
    await page.getByRole('button', { name: /Guardar Cita/i }).click()

    await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10000 })

    // 3. Forzar recarga completa del navegador (F5)
    await page.reload()

    // Si tras recargar se requiere sincronizar vista
    if (page.url().includes('/login')) {
      await loginAsPatient(page)
    }

    // 4. Comprobar que la cita persiste intacta en la tabla tras la recarga
    const table = page.locator('.data-table')
    await expect(table).toBeVisible({ timeout: 10000 })
    await expect(table).toContainText('2026-11-28')
    await expect(table).toContainText('10:00')
    await expect(table).toContainText(/PROGRAMADA|SCHEDULED/i)

    // 5. Intentar agendar nuevamente en la misma fecha y comprobar que la franja ya no está disponible
    await page.getByRole('button', { name: /Agendar Cita/i }).click()
    await page.locator('#professionalId').selectOption('2')
    await page.locator('#appointmentDate').fill('2026-11-28')

    // Esperar a que las franjas carguen confirmando que otra franja disponible está visible
    await expect(page.locator('.slot-chip', { hasText: '08:30' })).toBeVisible({ timeout: 10000 })

    // La franja de 10:00 ya no debe figurar disponible para selección
    await expect(page.locator('.slot-chip', { hasText: '10:00' })).toHaveCount(0)
  })

  test('E2E-03: Cancelación con justificación obligatoria y liberación de horario', async ({ page }) => {
    // 1. Iniciar sesión y abrir vista de citas médicas
    await loginAsPatient(page)

    // 2. Localizar botón cancelar en la cita activa
    const row = page.locator('.data-table tbody tr', { hasText: /PROGRAMADA|SCHEDULED/i }).first()
    await expect(row).toBeVisible({ timeout: 10000 })

    const cancelButton = row.getByRole('button', { name: /Cancelar mi cita|Cancelar/i })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()

    // 3. Verificar que se abre el modal de cancelación
    const modal = page.locator('.modal-card')
    await expect(modal).toBeVisible({ timeout: 5000 })
    await expect(modal).toContainText(/Cancelar Cita Médica/i)

    // 4. Intentar confirmar sin motivo: debe impedirlo mostrando error de validación
    const confirmButton = modal.getByRole('button', { name: /Confirmar Cancelación/i })
    await confirmButton.click()
    await expect(modal.locator('.field-error')).toBeVisible()
    await expect(modal.locator('.field-error')).toContainText(/obligatorio/i)

    // 5. Diligenciar motivo de cancelación justificado
    const reasonInput = modal.locator('#cancellationReasonInput')
    await reasonInput.fill('Imprevisto laboral de fuerza mayor')

    // 6. Confirmar la cancelación
    await confirmButton.click()

    // 7. Verificar que el modal se cierre y la cita pase a estado CANCELADA / CANCELLED
    await expect(modal).not.toBeVisible({ timeout: 10000 })
    const cancelledRow = page.locator('.data-table tbody tr', { hasText: /CANCELADA|CANCELLED/i }).first()
    await expect(cancelledRow).toBeVisible({ timeout: 10000 })

    // 8. Verificar que la franja horaria correspondiente vuelva a estar disponible
    await page.getByRole('button', { name: /Agendar Cita/i }).click()
    await page.locator('#professionalId').selectOption('2')
    await page.locator('#appointmentDate').fill('2026-11-28')

    // La franja liberada (08:00) vuelve a ser visible en las disponibles
    await expect(page.locator('.slot-chip', { hasText: '08:00' })).toBeVisible({ timeout: 10000 })
  })
})
