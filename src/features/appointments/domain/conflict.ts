export type TimeRange = {
  start: Date
  end: Date
}

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end
}

export function hasConflict(candidate: TimeRange, booked: TimeRange[]): boolean {
  return booked.some((range) => overlaps(candidate, range))
}
