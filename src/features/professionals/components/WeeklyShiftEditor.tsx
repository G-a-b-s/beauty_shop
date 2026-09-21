import type { Shift, Weekday } from '../types'

const weekdayLabels: { weekday: Weekday; label: string }[] = [
  { weekday: 1, label: 'Segunda' },
  { weekday: 2, label: 'Terça' },
  { weekday: 3, label: 'Quarta' },
  { weekday: 4, label: 'Quinta' },
  { weekday: 5, label: 'Sexta' },
  { weekday: 6, label: 'Sábado' },
  { weekday: 0, label: 'Domingo' },
]

type Props = {
  shifts: Shift[]
  onChange: (shifts: Shift[]) => void
}

export function WeeklyShiftEditor({ shifts, onChange }: Props) {
  function toggleWeekday(weekday: Weekday, enabled: boolean) {
    if (enabled) {
      onChange([...shifts, { weekday, startTime: '09:00', endTime: '18:00' }])
    } else {
      onChange(shifts.filter((shift) => shift.weekday !== weekday))
    }
  }

  function updateTime(weekday: Weekday, field: 'startTime' | 'endTime', value: string) {
    onChange(
      shifts.map((shift) => (shift.weekday === weekday ? { ...shift, [field]: value } : shift)),
    )
  }

  return (
    <div className="grid gap-2">
      {weekdayLabels.map(({ weekday, label }) => {
        const shift = shifts.find((entry) => entry.weekday === weekday)

        return (
          <div key={weekday} className="flex items-center gap-3">
            <label className="flex w-32 items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={Boolean(shift)}
                onChange={(e) => toggleWeekday(weekday, e.target.checked)}
                className="size-4 rounded border-neutral-300 accent-primary-600"
              />
              {label}
            </label>

            {shift ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={shift.startTime}
                  onChange={(e) => updateTime(weekday, 'startTime', e.target.value)}
                  className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                />
                <span className="text-sm text-neutral-400">às</span>
                <input
                  type="time"
                  value={shift.endTime}
                  onChange={(e) => updateTime(weekday, 'endTime', e.target.value)}
                  className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                />
              </div>
            ) : (
              <span className="text-sm text-neutral-400">Não trabalha</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
