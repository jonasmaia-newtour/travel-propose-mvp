/**
 * Formatação PT-PT. Valores monetários em cêntimos (inteiros).
 */
const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
});

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' });

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatShortDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}