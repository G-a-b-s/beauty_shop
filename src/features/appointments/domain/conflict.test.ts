import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { hasConflict, overlaps, type TimeRange } from './conflict.ts'

function range(start: string, end: string): TimeRange {
  return {
    start: new Date(`2026-11-10T${start}:00`),
    end: new Date(`2026-11-10T${end}:00`),
  }
}

describe('sobreposição entre dois horários', () => {
  const booked = range('10:00', '11:00')

  test('identifica horários com início e fim iguais como sobrepostos', () => {
    assert.equal(overlaps(range('10:00', '11:00'), booked), true)
  })

  test('identifica sobreposição quando o horário começa durante o agendamento existente', () => {
    assert.equal(overlaps(range('10:30', '11:30'), booked), true)
  })

  test('identifica sobreposição quando o horário termina durante o agendamento existente', () => {
    assert.equal(overlaps(range('09:30', '10:30'), booked), true)
  })

  test('identifica sobreposição quando o horário solicitado está contido no existente', () => {
    assert.equal(overlaps(range('10:15', '10:45'), booked), true)
  })

  test('identifica sobreposição quando o horário solicitado contém o existente', () => {
    assert.equal(overlaps(range('09:00', '12:00'), booked), true)
  })

  test('não considera sobreposição quando o horário termina no início do existente', () => {
    assert.equal(overlaps(range('09:00', '10:00'), booked), false)
  })

  test('não considera sobreposição quando o horário começa no fim do existente', () => {
    assert.equal(overlaps(range('11:00', '12:00'), booked), false)
  })

  test('não identifica sobreposição entre horários separados', () => {
    assert.equal(overlaps(range('14:00', '15:00'), booked), false)
  })

  test('produz o mesmo resultado independentemente da ordem dos horários', () => {
    const candidate = range('10:30', '11:30')
    assert.equal(overlaps(candidate, booked), overlaps(booked, candidate))
  })
})

describe('conflito com agendamentos existentes', () => {
  test('não encontra conflito quando não há horários agendados', () => {
    assert.equal(hasConflict(range('10:00', '11:00'), []), false)
  })

  test('encontra conflito quando o horário coincide com qualquer agendamento existente', () => {
    const booked = [range('08:00', '09:00'), range('10:30', '11:15'), range('15:00', '16:00')]
    assert.equal(hasConflict(range('10:00', '11:00'), booked), true)
  })

  test('não encontra conflito quando o horário cabe entre os agendamentos existentes', () => {
    const booked = [range('09:00', '10:00'), range('11:00', '12:00')]
    assert.equal(hasConflict(range('10:00', '11:00'), booked), false)
  })
})
