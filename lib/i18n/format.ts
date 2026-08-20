/**
 * Formatação PT-PT. Valores monetários em cêntimos (inteiros).
 */
const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
});

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' });

const dateTimeFormatter = new Intl.DateTimeFormat('pt-PT', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatShortDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}