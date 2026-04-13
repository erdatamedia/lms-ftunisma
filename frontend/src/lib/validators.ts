export function isAcademicYear(value: string) {
  return /^\d{4}\/\d{4}$/.test(value);
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongEnoughPassword(value: string) {
  return value.trim().length >= 6;
}

export function isPositiveIntegerString(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0;
}
