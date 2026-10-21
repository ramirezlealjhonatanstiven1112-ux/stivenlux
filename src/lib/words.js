/* Divide un texto en palabras para iluminarlas una a una (sin espacios vacíos). */
export function toWords(text) {
  return String(text ?? '').trim().split(/\s+/).filter(Boolean);
}
