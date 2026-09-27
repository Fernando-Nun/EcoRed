import type { Donation, DonationCategory, DonationStatus } from '@workspace/api-client-react';

export const categoryLabels: Record<DonationCategory, string> = {
  electronics: 'Electrónicos',
  plastics: 'Plásticos',
  glass: 'Vidrio',
  paper: 'Papel',
  metal: 'Metal',
  clothing: 'Textil',
  food: 'Orgánicos',
  other: 'Otros',
};

export const statusLabels: Record<DonationStatus, string> = {
  pending: 'En revisión',
  approved: 'Aceptada',
  delivered: 'Entregada',
  rejected: 'Rechazada',
};

export const statusStyles: Record<DonationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-sky-100 text-sky-800 border-sky-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
};

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatQuantity(donation: Pick<Donation, 'quantity' | 'unit'>) {
  return `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(donation.quantity)} ${donation.unit}`;
}

export function getErrorMessage(error: unknown, fallback = 'No pudimos completar la solicitud.') {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
