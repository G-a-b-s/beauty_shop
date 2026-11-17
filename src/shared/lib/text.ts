export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
