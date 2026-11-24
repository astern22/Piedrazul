import { describe, it, expect } from 'vitest'
import {
  required,
  maxLength,
  minLength,
  minValue,
  maxValue,
  isPositiveInteger,
  isEmail,
  noSpaces,
  isTime,
  isDate,
  isFutureOrToday,
  isPastDate,
  isTimeRangeValid,
  firstError,
  validateFields,
  hasErrors,
  usernameFormat,
  validateIntervalMinutes,
  findOverlappingAvailability,
  validateAppointmentForm,
  validateWeeklyAvailabilityForm,
  validateRegisterForm,
  validatePatientForm,
  validateSpecialtyForm,
  validateProfessionalForm,
} from './validators.js'

describe('Validador: required', () => {
  it('retorna error si el valor es null, undefined o vacio', () => {
    expect(required(null)).toBe('Este campo es obligatorio.')
    expect(required(undefined)).toBe('Este campo es obligatorio.')
    expect(required('')).toBe('Este campo es obligatorio.')
    expect(required('   ', 'El nombre')).toBe('El nombre es obligatorio.')
  })

  it('retorna null si el valor no esta vacio', () => {
    expect(required('Hola')).toBeNull()
    expect(required(0)).toBeNull()
    expect(required(false)).toBeNull()
  })
})

describe('Validador: maxLength y minLength', () => {
  it('maxLength valida el limite superior de caracteres', () => {
    expect(maxLength('12345', 5)).toBeNull()
    expect(maxLength('123456', 5, 'Codigo')).toBe('Codigo no debe exceder los 5 caracteres.')
  })

  it('minLength valida el limite inferior de caracteres', () => {
    expect(minLength('12345', 5)).toBeNull()
    expect(minLength('1234', 5, 'Clave')).toBe('Clave debe tener al menos 5 caracteres.')
  })
})

describe('Validador: minValue y maxValue (Valores Límite)', () => {
  it('minValue valida limites numericos', () => {
    expect(minValue(5, 5)).toBeNull()
    expect(minValue(6, 5)).toBeNull()
    expect(minValue(4, 5, 'Duracion')).toBe('Duracion debe ser al menos 5.')
  })

  it('maxValue valida limites numericos superiores', () => {
    expect(maxValue(480, 480)).toBeNull()
    expect(maxValue(479, 480)).toBeNull()
    expect(maxValue(481, 480, 'Duracion')).toBe('Duracion no debe ser mayor a 480.')
  })
})

describe('Validador: isPositiveInteger', () => {
  it('retorna null para enteros positivos', () => {
    expect(isPositiveInteger(1)).toBeNull()
    expect(isPositiveInteger('15')).toBeNull()
    expect(isPositiveInteger('')).toBeNull()
  })

  it('retorna error para 0, negativos o decimales', () => {
    expect(isPositiveInteger(0, 'Cantidad')).toBe('Cantidad debe ser un numero entero positivo.')
    expect(isPositiveInteger(-5, 'Cantidad')).toBe('Cantidad debe ser un numero entero positivo.')
    expect(isPositiveInteger(3.14, 'Cantidad')).toBe('Cantidad debe ser un numero entero positivo.')
  })
})

describe('Validador: isEmail y noSpaces', () => {
  it('isEmail valida correos con formato correcto', () => {
    expect(isEmail('usuario@dominio.com')).toBeNull()
    expect(isEmail('invalido')).toBe('Ingresa un correo electronico valido.')
    expect(isEmail('sin-arroba.com')).toBe('Ingresa un correo electronico valido.')
  })

  it('noSpaces detecta espacios en blanco', () => {
    expect(noSpaces('usuario123')).toBeNull()
    expect(noSpaces('usuario con espacio', 'El usuario')).toBe('El usuario no debe contener espacios.')
  })
})

describe('Validador: isTime y isTimeRangeValid (Reglas F2)', () => {
  it('isTime valida formatos HH:mm y HH:mm:ss', () => {
    expect(isTime('08:30')).toBeNull()
    expect(isTime('08:30:00')).toBeNull()
    expect(isTime('8:30')).toBe('El formato de hora debe ser HH:mm o HH:mm:ss.')
    expect(isTime('invalido')).toBe('El formato de hora debe ser HH:mm o HH:mm:ss.')
  })

  it('isTimeRangeValid valida que hora inicio sea estrictamente anterior a fin', () => {
    // Caso de exito: inicio < fin
    expect(isTimeRangeValid('08:00', '12:00')).toBeNull()
    expect(isTimeRangeValid('07:59', '08:00')).toBeNull()

    // Valores limite invalidos: inicio == fin o inicio > fin
    expect(isTimeRangeValid('08:00', '08:00')).toBe('La hora de inicio debe ser anterior a la hora de fin.')
    expect(isTimeRangeValid('12:00', '08:00')).toBe('La hora de inicio debe ser anterior a la hora de fin.')
  })
})

describe('Validador: isFutureOrToday y isDate (Reglas F1)', () => {
  it('isDate valida formato YYYY-MM-DD', () => {
    expect(isDate('2026-11-24')).toBeNull()
    expect(isDate('24-11-2026')).toBe('El formato de fecha debe ser YYYY-MM-DD.')
    expect(isDate('2026-99-99')).toBe('La fecha ingresada no es valida.')
  })

  it('isFutureOrToday rechaza fechas anteriores al dia de hoy (valor limite)', () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    // Fecha de hoy es permitida (limite)
    expect(isFutureOrToday(todayStr)).toBeNull()

    // Fecha futura es permitida
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const tomY = tomorrow.getFullYear()
    const tomM = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const tomD = String(tomorrow.getDate()).padStart(2, '0')
    expect(isFutureOrToday(`${tomY}-${tomM}-${tomD}`)).toBeNull()

    // Fecha pasada es rechazada
    expect(isFutureOrToday('2020-01-01')).toBe('La fecha no puede ser anterior al dia de hoy.')
  })
})

describe('Validador: validateIntervalMinutes (Límites [5, 480])', () => {
  it('acepta valores dentro del rango [5, 480]', () => {
    expect(validateIntervalMinutes(5)).toBeNull()
    expect(validateIntervalMinutes(30)).toBeNull()
    expect(validateIntervalMinutes(480)).toBeNull()
  })

  it('rechaza valores fuera del rango limite', () => {
    expect(validateIntervalMinutes(4)).toBe('La duracion de cita debe ser al menos 5.')
    expect(validateIntervalMinutes(481)).toBe('La duracion de cita no debe ser mayor a 480.')
    expect(validateIntervalMinutes(0)).toBe('La duracion de cita debe ser un numero entero positivo.')
    expect(validateIntervalMinutes(null)).toBe('La duracion de cita es obligatorio.')
  })
})

describe('Validador: findOverlappingAvailability (Reglas F2)', () => {
  const existing = [
    { dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00' },
    { dayOfWeek: 2, startTime: '14:00:00', endTime: '18:00:00' },
  ]

  it('detecta solapamiento parcial y total en el mismo dia', () => {
    // Solapamiento total
    expect(findOverlappingAvailability(existing, { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' })).not.toBeNull()
    // Solapamiento parcial
    expect(findOverlappingAvailability(existing, { dayOfWeek: 1, startTime: '10:00', endTime: '13:00' })).not.toBeNull()
    expect(findOverlappingAvailability(existing, { dayOfWeek: 1, startTime: '07:00', endTime: '09:00' })).not.toBeNull()
  })

  it('permite franjas contiguas en el limite exacto (sin solapamiento)', () => {
    // Contiguo anterior: 06:00 a 08:00
    expect(findOverlappingAvailability(existing, { dayOfWeek: 1, startTime: '06:00', endTime: '08:00' })).toBeNull()
    // Contiguo posterior: 12:00 a 16:00
    expect(findOverlappingAvailability(existing, { dayOfWeek: 1, startTime: '12:00', endTime: '16:00' })).toBeNull()
  })

  it('permite mismo horario en diferente dia de la semana', () => {
    expect(findOverlappingAvailability(existing, { dayOfWeek: 3, startTime: '08:00', endTime: '12:00' })).toBeNull()
  })
})

describe('Validador de Formularios: validateAppointmentForm (F1)', () => {
  it('valida formulario de cita con todos los datos correctos', () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const form = {
      patientId: 1,
      professionalId: 2,
      appointmentDate: todayStr,
      startTime: '10:00',
      endTime: '10:30',
    }
    const errors = validateAppointmentForm(form)
    expect(hasErrors(errors)).toBe(false)
  })

  it('detecta errores de obligatoriedad y rango de hora', () => {
    const form = {
      patientId: null,
      professionalId: '',
      appointmentDate: '2020-01-01',
      startTime: '11:00',
      endTime: '10:00',
    }
    const errors = validateAppointmentForm(form)
    expect(hasErrors(errors)).toBe(true)
    expect(errors.patientId).toBe('El ID del paciente es obligatorio.')
    expect(errors.professionalId).toBe('El profesional es obligatorio.')
    expect(errors.appointmentDate).toBe('La fecha no puede ser anterior al dia de hoy.')
    expect(errors.endTime).toBe('La hora de inicio debe ser anterior a la hora de fin.')
  })
})

describe('Validador de Formularios: validateWeeklyAvailabilityForm (F2)', () => {
  it('valida formulario con parametros correctos', () => {
    const form = {
      professionalId: 5,
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '13:00',
    }
    const errors = validateWeeklyAvailabilityForm(form)
    expect(hasErrors(errors)).toBe(false)
  })

  it('detecta dia de semana fuera del rango 1 a 7', () => {
    const form = {
      professionalId: 5,
      dayOfWeek: 8,
      startTime: '09:00',
      endTime: '13:00',
    }
    const errors = validateWeeklyAvailabilityForm(form)
    expect(hasErrors(errors)).toBe(true)
    expect(errors.dayOfWeek).toBe('El dia de la semana no debe ser mayor a 7.')
  })
})
