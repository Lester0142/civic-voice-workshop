const WORKSHOP_ID_PATTERN = /^S\d{7}[A-Z]$/;

export function normalizeWorkshopId(value) {
  return value.trim().toUpperCase();
}

export function isValidWorkshopId(value) {
  return WORKSHOP_ID_PATTERN.test(normalizeWorkshopId(value));
}
