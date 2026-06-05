export function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

export function getRelativeDayText(date: Date): string {
  const today = new Date();
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Hoje';
  } else if (isSameDay(date, tomorrow)) {
    return 'Amanhã';
  } else if (isSameDay(date, yesterday)) {
    return 'Ontem';
  } else {
    // Retorna no formato DD/MM se for muito distante
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}
