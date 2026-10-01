// Tarifa base: 15 USD / RD$900 por hora (configurable por env)
export const HOURLY_RATE_DOP = Number(process.env.NEXT_PUBLIC_HOURLY_RATE_DOP ?? 900);
export const ITBIS_RATE = Number(process.env.NEXT_PUBLIC_ITBIS_RATE ?? 0.18);

export function basePriceDOP(durationHours: number): number {
  return Math.round(HOURLY_RATE_DOP * durationHours * 100) / 100;
}

// Dado un total (precio final) calcula subtotal + ITBIS.
// Convencion: la tarifa mostrada es el subtotal; el ITBIS se suma encima.
export function invoiceBreakdown(subtotal: number) {
  const itbis = Math.round(subtotal * ITBIS_RATE * 100) / 100;
  const total = Math.round((subtotal + itbis) * 100) / 100;
  return { subtotal, itbis, total };
}
