import { describe, it, expect, vi, beforeEach } from 'vitest'
import { patientService } from './patient.service.js'
import apiClient from './client.js'

vi.mock('./client.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('patientService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAll: obtiene todos los pacientes registrados', async () => {
    const mockPatients = [
      { id: 1, documentNumber: '1061700101', fullName: 'Carlos Sanchez' },
      { id: 2, documentNumber: '1061700102', fullName: 'Maria Lopez' },
    ]
    apiClient.get.mockResolvedValueOnce({ data: mockPatients })

    const result = await patientService.getAll()

    expect(apiClient.get).toHaveBeenCalledWith('/api/patients')
    expect(result).toEqual(mockPatients)
  })

  it('getMe: obtiene el perfil del paciente vinculado al usuario actual', async () => {
    const mockMe = { id: 1, documentNumber: '1061700101', phone: '3120000001' }
    apiClient.get.mockResolvedValueOnce({ data: mockMe })

    const result = await patientService.getMe()

    expect(apiClient.get).toHaveBeenCalledWith('/api/patients/me')
    expect(result).toEqual(mockMe)
  })

  it('getByDocument: busca paciente por cedula codificando caracteres especiales', async () => {
    const mockPatient = { id: 1, documentNumber: '1061700101' }
    apiClient.get.mockResolvedValueOnce({ data: mockPatient })

    const result = await patientService.getByDocument('1061700101')

    expect(apiClient.get).toHaveBeenCalledWith('/api/patients/document/1061700101')
    expect(result).toEqual(mockPatient)
  })

  it('create: registra un nuevo paciente limpiando espacios en blanco', async () => {
    const payload = {
      documentNumber: '  1061700103  ',
      phone: ' 3150000003 ',
      birthDate: '1995-05-10',
      userId: 7,
    }
    const mockCreated = { id: 3, documentNumber: '1061700103' }
    apiClient.post.mockResolvedValueOnce({ data: mockCreated })

    const result = await patientService.create(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/api/patients', {
      documentNumber: '1061700103',
      phone: '3150000003',
      birthDate: '1995-05-10',
      userId: 7,
    })
    expect(result).toEqual(mockCreated)
  })

  it('delete: elimina un paciente por su id', async () => {
    apiClient.delete.mockResolvedValueOnce({ data: null })

    const result = await patientService.delete(5)

    expect(apiClient.delete).toHaveBeenCalledWith('/api/patients/5')
    expect(result).toBeNull()
  })
})
