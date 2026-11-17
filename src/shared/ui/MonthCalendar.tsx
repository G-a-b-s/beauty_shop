import { formatMonthLabel, getMonthGrid, isSameDay, isSameMonth } from '../lib/date'
import { capitalizeFirst } from '../lib/text'

type Props = {
  month: Date
  selectedDate: Date | null
  canGoToPrevious: boolean
  canGoToNext: boolean
  goToPrevious: () => void
  goToNext: () => void
  isDayEnabled: (date: Date) => boolean
  onSelect: (date: Date) => void
}

const weekdayLabels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const arrowStyles =
  'flex h-8 w-8 items-center justify-center rounded-full text-lg text-neutral-600 transition-colors ' +
  'hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

export function MonthCalendar({
  month,
  selectedDate,
  canGoToPrevious,
  canGoToNext,
  goToPrevious,
  goToNext,
  isDayEnabled,
  onSelect,
}: Props) {
  const today = new Date()
  const title = capitalizeFirst(formatMonthLabel(month))

  return (
    <div className="max-w-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          disabled={!canGoToPrevious}
          onClick={goToPrevious}
          className={arrowStyles}
        >
          ‹
        </button>
        <p className="text-sm font-medium text-neutral-700">{title}</p>
        <button
          type="button"
          aria-label="Próximo mês"
          disabled={!canGoToNext}
          onClick={goToNext}
          className={arrowStyles}
        >
          ›
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-400">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {getMonthGrid(month).map((day) => {
          if (!isSameMonth(day, month)) {
            return <span key={day.toISOString()} />
          }

          const enabled = isDayEnabled(day)
          const selected = selectedDate !== null && isSameDay(day, selectedDate)
          const isToday = isSameDay(day, today)

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(day)}
              aria-pressed={selected}
              aria-label={day.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              className={`aspect-square rounded-full text-sm transition-colors ${
                selected
                  ? 'bg-primary-600 font-medium text-white'
                  : enabled
                    ? 'text-neutral-700 hover:bg-primary-50'
                    : 'cursor-not-allowed text-neutral-300'
              } ${isToday && !selected ? 'ring-1 ring-primary-300' : ''}`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
