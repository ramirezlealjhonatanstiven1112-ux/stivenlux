/* Presupuesto de peso: total por debajo del límite general e incremento sobre la base dentro del margen de la spec.
   Entradas en bytes (gzip). Solo lo usa scripts/check-budget.mjs: no entra en el bundle. */
export function budgetCheck({ size, base, allowance, limit }) {
  const delta = size - base;
  return { delta, ok: size <= limit && delta <= allowance };
}
