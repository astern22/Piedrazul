import { describe, it, expect, vi, beforeEach } from 'vitest'
import { schedulingService } from './scheduling.service.js'
import apiClient from './client.js'

vi.mock('./client.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('schedulingService (F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAvailableSlots: consulta franjas horarias libres para un profesional y fecha', async () => {
    const mockSlots = [
      { startTime: '08:00:00', endTime: '08:30:00' },
      { startTime: '08:30:00', endTime: '09:00:00' },
      { startTime: '09:00:00', endTime: '09:30:00' },
    ]
    apiClient.get.mockResolvedValueOnce({ data: mockSlots })

    const slots = await schedulingService.getAvailableSlots(3, '2026-11-25')

    expect(apiClient.get).toHaveBeenCalledWith('/api/availability/professional/3/slots', {
      params: { date: '2026-11-25' },
    })
    expect(slots).toEqual(mockSlots)
    expect(slots.length).toBe(3)
  })

  it('createWeeklyAvailability: formatea y envia disponibilidad semanal a /api/availability', async () => {
    const mockCreated = {
      id: 5,
      professionalId: 3,
      dayOfWeek: 1,
      startTime: '08:00:00',
      endTime: '12:00:00',
      active: true,
    }
    apiClient.post.mockResolvedValueOnce({ data: mockCreated })

    const result = await schedulingService.createWeeklyAvailability({
      professionalId: 3,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '12:00',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/api/availability', {
      professionalId: 3,
      dayOfWeek: 1,
      startTime: '08:00:00',
      endTime: '12:00:00',
    })
    expect(result).toEqual(mockCreated)
  })

  it('getByProfessional: consulta todas las disponibilidades de un profesional', async () => {
    const mockAvailabilities = [
      { id: 1, dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00' },
      { id: 2, dayOfWeek: 3, startTime: '14:00:00', endTime: '18:00:00' },
    ]
    apiClient.get.mockResolvedValueOnce({ data: mockAvailabilities })

    const result = await schedulingService.getByProfessional(3)

    expect(apiClient.get).toHaveBeenCalledWith('/api/availability/professional/3')
    expect(result).toEqual(mockAvailabilities)
  })

  it('deactivate: desactiva una franja mediante PATCH a /api/availability/:id/deactivate', async () => {
    apiClient.patch.mockResolvedValueOnce({ data: { message: 'Desactivado exitosamente' } })

    const result = await schedulingService.deactivate(8)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/availability/8/deactivate')
    expect(result).toEqual({ message: 'Desactivado exitosamente' })
  })
})
