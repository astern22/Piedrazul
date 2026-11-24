import { describe, it, expect, vi, beforeEach } from 'vitest'
import { appointmentService } from './appointment.service.js'
import apiClient from './client.js'

vi.mock('./client.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('appointmentService (F1 y F3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create: envia peticion POST a /api/appointments/create con formato correcto de segundos', async () => {
    const mockCreatedAppointment = {
      id: 101,
      patientId: 1,
      professionalId: 2,
      appointmentDate: '2026-11-25',
      startTime: '10:00:00',
      endTime: '10:30:00',
      status: 'SCHEDULED',
    }

    apiClient.post.mockResolvedValueOnce({ data: mockCreatedAppointment })

    const result = await appointmentService.create({
      patientId: 1,
      professionalId: 2,
      appointmentDate: '2026-11-25',
      startTime: '10:00',
      endTime: '10:30',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/api/appointments/create', {
      patientId: 1,
      professionalId: 2,
      appointmentDate: '2026-11-25',
      startTime: '10:00:00',
      endTime: '10:30:00',
    })
    expect(result).toEqual(mockCreatedAppointment)
  })

  it('getAll: obtiene la lista completa de citas desde /api/appointments', async () => {
    const mockList = [
      { id: 1, status: 'SCHEDULED' },
      { id: 2, status: 'CANCELLED' },
    ]
    apiClient.get.mockResolvedValueOnce({ data: mockList })

    const result = await appointmentService.getAll()

    expect(apiClient.get).toHaveBeenCalledWith('/api/appointments')
    expect(result).toEqual(mockList)
  })

  it('getById: consulta los detalles de una cita especifica', async () => {
    const mockAppointment = { id: 15, patientId: 3, status: 'SCHEDULED' }
    apiClient.get.mockResolvedValueOnce({ data: mockAppointment })

    const result = await appointmentService.getById(15)

    expect(apiClient.get).toHaveBeenCalledWith('/api/appointments/15')
    expect(result).toEqual(mockAppointment)
  })

  it('search: busca citas filtradas por profesional y fecha', async () => {
    const mockSearchResults = [{ id: 45, professionalId: 2, appointmentDate: '2026-11-26' }]
    apiClient.get.mockResolvedValueOnce({ data: mockSearchResults })

    const result = await appointmentService.search({ professionalId: 2, date: '2026-11-26' })

    expect(apiClient.get).toHaveBeenCalledWith('/api/appointments/search', {
      params: { professionalId: 2, date: '2026-11-26' },
    })
    expect(result).toEqual(mockSearchResults)
  })

  it('cancel: envia peticion DELETE a /api/appointments/me/cancel/:id con motivo de justificacion', async () => {
    const mockCancelled = { id: 10, status: 'CANCELLED', cancellationReason: 'Viaje imprevisto' }
    apiClient.delete.mockResolvedValueOnce({ data: mockCancelled })

    const result = await appointmentService.cancel(10, 'Viaje imprevisto')

    expect(apiClient.delete).toHaveBeenCalledWith('/api/appointments/me/cancel/10', {
      data: { reason: 'Viaje imprevisto' },
      params: { reason: 'Viaje imprevisto' },
    })
    expect(result).toEqual(mockCancelled)
  })
})
