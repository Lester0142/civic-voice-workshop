export function maskNric(nric) {
  if (typeof nric !== "string" || nric.length < 4) return "";

  return `${nric[0]}${"•".repeat(nric.length - 3)}${nric.slice(-2)}`;
}
