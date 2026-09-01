/**
 * Date and time helper utilities in Portuguese
 */

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDayMonth(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatFullDatePortuguese(date: Date = new Date()): string {
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  const year = date.getFullYear();

  // Capitalize first letter of weekday
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday}, ${day} de ${month} de ${year}`;
}

export function formatShortDateWithWeekday(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'short' });
  return `${weekday}, ${day} ${month}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
}

export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysOfWeek(currentDateStr: string): { dateStr: string; dayNum: number; dayName: string; isToday: boolean }[] {
  const [y, m, d] = currentDateStr.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const dayOfWeek = current.getDay(); // 0 is Sunday
  
  // Start on Monday (or Sunday)
  const monday = new Date(current);
  const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  monday.setDate(diff);

  const days = [];
  const todayStr = getTodayString();

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);

    const year = dayDate.getFullYear();
    const month = String(dayDate.getMonth() + 1).padStart(2, '0');
    const day = String(dayDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayName = dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();

    days.push({
      dateStr,
      dayNum: dayDate.getDate(),
      dayName: dayName.slice(0, 3),
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

export function getMonthMatrix(year: number, monthIndex: number): { dateStr: string; day: number; isCurrentMonth: boolean; isToday: boolean }[][] {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const todayStr = getTodayString();

  let startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
  startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // 0 is Monday

  const totalDays = lastDay.getDate();
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();

  const matrix: { dateStr: string; day: number; isCurrentMonth: boolean; isToday: boolean }[][] = [];
  let currentWeek: { dateStr: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Previous month overflow
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, monthIndex - 1, day);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    currentWeek.push({
      dateStr,
      day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    currentWeek.push({
      dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });

    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month overflow
  if (currentWeek.length > 0) {
    let nextDay = 1;
    while (currentWeek.length < 7) {
      const nextMonthDate = new Date(year, monthIndex + 1, nextDay);
      const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
      currentWeek.push({
        dateStr,
        day: nextDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
      nextDay++;
    }
    matrix.push(currentWeek);
  }

  return matrix;
}

export function getDaysDifference(earlierDateStr: string, laterDateStr: string): number {
  if (!earlierDateStr || !laterDateStr) return 0;
  const [y1, m1, d1] = earlierDateStr.split('-').map(Number);
  const [y2, m2, d2] = laterDateStr.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((utc2 - utc1) / msPerDay));
}

export interface OverdueDelayInfo {
  isOverdue: boolean;
  daysOverdue: number;
  hoursOverdue: number;
  minutesOverdue: number;
  delayText: string;
  urgency: 'critical' | 'high' | 'medium';
}

export function isTaskOverdue(task: { date: string; time?: string; completed: boolean }): boolean {
  if (!task || task.completed) return false;
  const today = getTodayString();
  
  // Date is earlier than today
  if (task.date < today) return true;
  
  // Date is today with a specific scheduled time
  if (task.date === today && task.time) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = task.time.split(':').map(Number);
    const taskMinutes = (h || 0) * 60 + (m || 0);
    return taskMinutes < currentMinutes;
  }
  
  return false;
}

export function getOverdueDelayInfo(task: { date: string; time?: string; completed: boolean }): OverdueDelayInfo {
  if (!task || task.completed) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      hoursOverdue: 0,
      minutesOverdue: 0,
      delayText: 'Em dia',
      urgency: 'medium',
    };
  }

  const today = getTodayString();
  const now = new Date();

  // 1. Task from previous days (date < today)
  if (task.date < today) {
    const days = getDaysDifference(task.date, today);
    const dayCount = Math.max(1, days);
    const delayText = dayCount === 1 ? 'Atrasada há 1 dia' : `Atrasada há ${dayCount} dias`;
    const urgency: 'critical' | 'high' | 'medium' = dayCount >= 3 ? 'critical' : 'high';

    return {
      isOverdue: true,
      daysOverdue: dayCount,
      hoursOverdue: dayCount * 24,
      minutesOverdue: dayCount * 24 * 60,
      delayText,
      urgency,
    };
  }

  // 2. Task from today with past time (date === today)
  if (task.date === today && task.time) {
    const [h, m] = task.time.split(':').map(Number);
    const taskMinutes = (h || 0) * 60 + (m || 0);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (taskMinutes < currentMinutes) {
      const diffMinutes = currentMinutes - taskMinutes;
      let delayText = '';
      if (diffMinutes < 60) {
        delayText = `Atrasada há ${diffMinutes} min`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        delayText = hours === 1 ? 'Atrasada há 1 hora' : `Atrasada há ${hours} horas`;
      }

      return {
        isOverdue: true,
        daysOverdue: 0,
        hoursOverdue: Math.floor(diffMinutes / 60),
        minutesOverdue: diffMinutes,
        delayText,
        urgency: diffMinutes >= 180 ? 'high' : 'medium',
      };
    }
  }

  return {
    isOverdue: false,
    daysOverdue: 0,
    hoursOverdue: 0,
    minutesOverdue: 0,
    delayText: 'No prazo',
    urgency: 'medium',
  };
}

export function getMinutesUntil(dateStr: string, timeStr?: string): number | null {
  if (!timeStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  const target = new Date(y, m - 1, d, h, min);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / 60000);
}
