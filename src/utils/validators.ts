export function isValidDDMMYY(dateStr: string): boolean {
  if (!/^\d{6}$/.test(dateStr)) return false;

  const day = parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4));
  const year = parseInt(dateStr.substring(4, 6));
  const fullYear = 2000 + year;
  const date = new Date(fullYear, month - 1, day);

  return (
    date.getFullYear() === fullYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
