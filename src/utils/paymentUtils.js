export const getPagoEstadoLabel = (estadoPago) => {
  const labels = {
    pendiente: 'Pago en revisión',
    aprobado: 'Pago aprobado',
    rechazado: 'Pago rechazado',
  };
  return labels[estadoPago] || estadoPago;
};

export const getPagoEstadoBadgeClass = (estadoPago) => {
  const classes = {
    pendiente: 'badge-warning',
    aprobado: 'badge-success',
    rechazado: 'badge-danger',
  };
  return classes[estadoPago] || 'badge-warning';
};

export const postInscription = async (axios, { activityId, fecha, comprobanteFile, esGratuita }) => {
  if (!esGratuita) {
    const formData = new FormData();
    formData.append('activityId', activityId);
    formData.append('fecha', fecha);
    formData.append('comprobante', comprobanteFile);
    return axios.post('/inscriptions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axios.post('/inscriptions', { activityId, fecha });
};

export const putComprobante = async (axios, inscriptionId, comprobanteFile) => {
  const formData = new FormData();
  formData.append('comprobante', comprobanteFile);
  return axios.put(`/inscriptions/${inscriptionId}/comprobante`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const isPdfComprobante = (inscription) => {
  const formato = inscription.pago?.comprobante?.formato?.toLowerCase() || '';
  const name = inscription.pago?.comprobante?.originalName?.toLowerCase() || '';
  const url = inscription.pago?.comprobante?.url?.toLowerCase() || '';
  return formato === 'pdf' || name.endsWith('.pdf') || url.includes('.pdf');
};

/** Cloudinary: primera página del PDF como imagen JPG (evita CORS del visor en el browser). */
export const getPdfPreviewUrl = (url) => {
  if (!url) return '';
  const transform = 'pg_1,w_900,c_limit,q_auto,f_jpg';
  if (url.includes('/raw/upload/')) {
    return url.replace('/raw/upload/', `/image/upload/${transform}/`);
  }
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  return url;
};
