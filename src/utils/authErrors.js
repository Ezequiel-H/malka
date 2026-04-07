export const normalizePhone = (v) => String(v ?? '').replace(/\s/g, '').trim();

export const formatAuthError = (error, fallback) => {
  const d = error?.response?.data;
  if (!d) return fallback;
  if (typeof d.message === 'string' && d.message.trim()) return d.message.trim();
  if (Array.isArray(d.errors)) {
    const parts = d.errors.map((e) => e?.msg || e?.message).filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  const raw = error?.response?.data && JSON.stringify(error.response.data);
  if (raw && /duplicate key|E11000/i.test(raw)) {
    return 'Ya existe una cuenta con ese email, teléfono o DNI.';
  }
  return fallback;
};
