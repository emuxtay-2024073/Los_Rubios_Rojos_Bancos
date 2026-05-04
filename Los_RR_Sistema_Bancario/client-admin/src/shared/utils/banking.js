export const normalizeList = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
  }

  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const formatDateTime = (value) => {
  if (!value) return '—';

  return new Date(value).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const formatMoney = (value, currency = 'Q') => {
  const amount = Number(value ?? 0);
  return `${currency} ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
};

export const toTitleCase = (value) => {
  if (!value) return '—';
  return String(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
};
