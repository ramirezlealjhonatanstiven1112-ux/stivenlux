// Agenda simulada de las demos con cita (spec 004, RF-3). Funciones puras: fechas en ISO (AAAA-MM-DD) y en UTC.

const DAY = 86_400_000;
const WEEKDAY = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
const SATURDAY = ['08:00', '09:00', '10:00', '11:00'];

const toDate = (iso) => new Date(`${iso}T00:00:00Z`);

/** Fecha local del visitante en ISO. */
export function isoDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Próximos `count` días de atención desde mañana: de lunes a sábado. */
export function nextDays(todayIso, count) {
  const days = [];
  for (let t = toDate(todayIso).getTime() + DAY; days.length < count; t += DAY) {
    const date = new Date(t);
    if (date.getUTCDay() !== 0) days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

/** Horas del día; algunas salen ocupadas, siempre las mismas para la misma fecha. */
export function slotsFor(iso) {
  const date = toDate(iso);
  const weekday = date.getUTCDay();
  if (weekday === 0) return [];
  const seed = date.getUTCDate();
  return (weekday === 6 ? SATURDAY : WEEKDAY).map((time, i) => ({ time, free: (seed + i * 2) % 5 !== 0 }));
}

export const STEPS = ['service', 'date', 'time'];

/** Guarda una elección. Cambiar de fecha descarta la hora si ese día no está libre. */
export function choose(state, step, value) {
  const next = { ...state, [step]: value };
  if (step === 'date' && !slotsFor(value).some((slot) => slot.free && slot.time === next.time)) delete next.time;
  return next;
}

/** Quita fecha y hora si el día elegido ya no es posterior a hoy (p. ej. pasó la medianoche). */
export function dropPast(state, todayIso) {
  if (!state.date || state.date > todayIso) return state;
  const next = { ...state };
  delete next.date;
  delete next.time;
  return next;
}

/** Primer paso sin completar, o null si la cita está completa. */
export function firstMissing(state, steps = STEPS) {
  return steps.find((step) => !state[step]) ?? null;
}

export function formatDate(iso, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('es', { ...options, timeZone: 'UTC' }).format(toDate(iso));
}
