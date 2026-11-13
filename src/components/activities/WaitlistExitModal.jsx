import { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Checkbox, Modal, Spinner } from '../ui';

const ESTADO_LABEL = {
  aceptada: 'Confirmada',
  pendiente: 'Pendiente',
};

/**
 * Sacar a alguien de la lista de espera.
 *
 * Nadie sale solo de la espera: lo decide el admin, y también decide si la
 * persona recibe el mail de «se liberó un lugar». El mail se ve antes de
 * mandarlo, armado por el back con el estado nuevo (el texto cambia si queda
 * confirmada o pendiente).
 */
const WaitlistExitModal = ({ inscription, estado, onClose, onConfirm }) => {
  const [notificar, setNotificar] = useState(false);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`/inscriptions/${inscription._id}/waitlist-email-preview`, { params: { estado } })
      .then((res) => {
        if (!cancelled) setEmail(res.data.email);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'No se pudo armar la vista previa del mail');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inscription._id, estado]);

  const nombre =
    [inscription.userId?.nombre, inscription.userId?.apellido].filter(Boolean).join(' ').trim() ||
    inscription.userId?.email ||
    'esta persona';

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(notificar);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Sacar de la lista de espera"
      description={`${nombre} pasa a «${ESTADO_LABEL[estado]}».`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} loading={saving}>
            {notificar ? 'Cambiar estado y avisar' : 'Cambiar estado'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Checkbox
          label="Avisarle que se liberó un lugar (mail y notificación)"
          description={email ? `Se manda a ${email.to}.` : undefined}
          checked={notificar}
          onChange={(e) => setNotificar(e.target.checked)}
          disabled={loading || !email}
        />

        {notificar && email && (
          <div className="overflow-hidden rounded-lg border border-surface-border">
            <p className="border-b border-surface-border bg-surface-sunken px-4 py-2 text-sm text-ink-soft">
              <span className="text-ink-muted">Asunto:</span> {email.subject}
            </p>
            {/* El HTML del mail va aislado: sandbox sin scripts ni navegación. */}
            <iframe
              title="Vista previa del mail"
              srcDoc={email.html}
              sandbox=""
              className="block h-96 w-full bg-surface"
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-2">
            <Spinner label="Armando la vista previa del mail" />
          </div>
        )}
        {error && <Alert tone="warning">{error}</Alert>}
      </div>
    </Modal>
  );
};

export default WaitlistExitModal;
