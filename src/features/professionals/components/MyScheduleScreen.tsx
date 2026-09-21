import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useCurrentProfessionalId } from '../hooks/useCurrentProfessionalId'
import { useMySchedule } from '../hooks/useMySchedule'
import { WeeklyShiftEditor } from './WeeklyShiftEditor'

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-')
  return `${day}/${month}/${year}`
}

export function MyScheduleScreen() {
  const professionalId = useCurrentProfessionalId()
  const {
    shifts,
    upcomingTimeOff,
    loading,
    saveShifts,
    createTimeOff,
    deleteTimeOff,
    todayKey,
  } = useMySchedule(professionalId)

  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  const canAddTimeOff = newDate !== '' && newDate >= todayKey

  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Minha jornada e folgas</h1>

      <Card>
        <h2 className="text-sm font-medium text-neutral-700">Jornada semanal</h2>
        <div className="mt-3">
          <WeeklyShiftEditor shifts={shifts} onChange={saveShifts} />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-neutral-700">Folgas</h2>

        <div className="mt-3 grid gap-2">
          {upcomingTimeOff.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhuma folga futura cadastrada</p>
          )}
          {upcomingTimeOff.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {formatDateKey(entry.date)}
                </p>
                {entry.reason && <p className="text-sm text-neutral-500">{entry.reason}</p>}
              </div>
              <Button variant="secondary" onClick={() => deleteTimeOff(entry.id)}>
                Remover
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 border-t border-neutral-100 pt-5">
          <Input
            label="Data da folga"
            type="date"
            min={todayKey}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <Input
            label="Motivo (opcional)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
          />
          <Button
            disabled={!canAddTimeOff}
            onClick={async () => {
              await createTimeOff(newDate, newReason)
              setNewDate('')
              setNewReason('')
            }}
          >
            Adicionar folga
          </Button>
        </div>
      </Card>
    </div>
  )
}
