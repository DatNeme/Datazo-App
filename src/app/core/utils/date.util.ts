export function getDailyString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMonthlyString(): string {
  return new Date().toISOString().substring(0, 7);
}

export function getWeeklyString(): string {
  const d = new Date();
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}
