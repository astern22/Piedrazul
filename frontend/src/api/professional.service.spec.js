import { describe, it, expect, vi, beforeEach } from 'vitest'
import { professionalService } from './professional.service.js'
import apiClient from './client.js'

vi.mock('./client.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('professionalService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAll: obtiene todos los profesionales', async () => {
    const mockList = [
      { id: 1, fullName: 'Dr. Carlos Perez', specialtyName: 'Medicina General' },
      { id: 2, fullName: 'Dra. Ana Gomez', specialtyName: 'Fisioterapia' },
    ]
    apiClient.get.mockResolvedValueOnce({ data: mockList })

    const result = await professionalService.getAll()

    expect(apiClient.get).toHaveBeenCalledWith('/api/professionals')
    expect(result).toEqual(mockList)
  })

  it('getActive: obtiene unicamente profesionales activos', async () => {
    const mockActive = [{ id: 1, fullName: 'Dr. Carlos Perez', active: true }]
    apiClient.get.mockResolvedValueOnce({ data: mockActive })

    const result = await professionalService.getActive()

    expect(apiClient.get).toHaveBeenCalledWith('/api/professionals/active')
    expect(result).toEqual(mockActive)
  })

  it('updateAppointmentInterval: actualiza la duracion de cita en minutos', async () => {
    const mockUpdated = { id: 1, appointmentIntervalMinutes: 45 }
    apiClient.patch.mockResolvedValueOnce({ data: mockUpdated })

    const result = await professionalService.updateAppointmentInterval(1, 45)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/professionals/1/appointment-interval', {
      appointmentIntervalMinutes: 45,
    })
    expect(result).toEqual(mockUpdated)
  })

  it('getBySpecialty: filtra profesionales por id de especialidad', async () => {
    const mockFiltered = [{ id: 3, specialtyId: 2 }]
    apiClient.get.mockResolvedValueOnce({ data: mockFiltered })

    const result = await professionalService.getBySpecialty(2)

    expect(apiClient.get).toHaveBeenCalledWith('/api/professionals/specialty/2')
    expect(result).toEqual(mockFiltered)
  })
})
