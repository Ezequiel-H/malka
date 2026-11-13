import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PageContainer from '../../components/layout/PageContainer';
import { Alert, Badge, Button, Card, DatePicker, Field, Input, Skeleton, Textarea, useConfirm } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import ResumenPersona from '../../components/admin/ResumenPersona';
import { Segmentado } from '../../components/admin/metricas/piezas';
import { buildWaLink } from '../../utils/whatsapp';

const VISTAS = [
  { valor: 'resumen', etiqueta: 'Cómo viene' },
  { valor: 'datos', etiqueta: 'Datos' },
];
const ORIGEN = { importado: 'Vino de la planilla', manual: 'Cargado a mano', sin_anotarse: 'Vino sin anotarse' };

/**
 * La ficha de alguien que vino pero no tiene cuenta: cómo viene (igual que
 * una cuenta) y sus datos para editar, con WhatsApp a mano para escribirle
 * e invitarlo a registrarse.
 */
const ContactoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirmar = useConfirm();
  const { showSuccess, showError } = useToast();
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista') === 'datos' ? 'datos' : 'resumen';
  const [contacto, setContacto] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    axios
      .get(`/historial/contactos/${id}`)
      .then((r) => {
        setContacto(r.data.contacto);
        const c = r.data.contacto;
        setDatos({ nombre: c.nombre ?? '', apellido: c.apellido ?? '', email: c.email ?? '', telefono: c.telefono ?? '', fechaNacimiento: c.fechaNacimiento ?? '', notas: c.notas ?? '' });
      })
      .catch((e) => setError(e.response?.data?.message || 'No se encontró el contacto'));
  }, [id]);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const r = await axios.put(`/historial/contactos/${id}`, datos);
      setContacto(r.data.contacto);
      showSuccess('Datos guardados');
    } catch (err) {
      showError(err.response?.data?.message || 'No se pudieron guardar los datos');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    const ok = await confirmar({
      title: `¿Borrar a ${contacto.nombre} ${contacto.apellido}?`,
      description: 'Se borran también todas sus visitas del historial, y dejan de contar en las métricas.',
      confirmLabel: 'Borrar contacto',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await axios.delete(`/historial/contactos/${id}`);
      showSuccess('Contacto borrado');
      navigate('/admin/historial');
    } catch (err) {
      showError(err.response?.data?.message || 'No se pudo borrar');
    }
  };

  if (error) {
    return (
      <PageContainer title="Contacto">
        <Alert tone="danger">{error}</Alert>
      </PageContainer>
    );
  }
  if (!contacto || !datos) {
    return (
      <PageContainer title="Contacto">
        <Skeleton className="h-96 rounded-card" />
      </PageContainer>
    );
  }

  const whatsapp = contacto.telefono ? buildWaLink(contacto.telefono) : null;
  const cambiar = (campo) => (v) => setDatos((d) => ({ ...d, [campo]: v?.target ? v.target.value : v ?? '' }));

  return (
    <PageContainer
      title={`${contacto.nombre} ${contacto.apellido}`.trim()}
      actions={
        <div className="flex flex-wrap gap-2">
          {whatsapp && (
            <Button variant="secondary" icon="whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">
              Escribirle
            </Button>
          )}
          <Button variant="secondary" icon="back" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmentado
          opciones={VISTAS}
          valor={vista}
          onChange={(v) =>
            setParams(
              (p) => {
                const n = new URLSearchParams(p);
                if (v === 'resumen') n.delete('vista');
                else n.set('vista', v);
                return n;
              },
              { replace: true }
            )
          }
          etiqueta="Qué ver del contacto"
        />
        <Badge tone="neutral">Sin cuenta en la app</Badge>
        <Badge tone="neutral">{ORIGEN[contacto.origen] ?? 'Contacto'}</Badge>
      </div>

      <div key={vista} className="animate-fade-in">
        {vista === 'resumen' ? (
          <ResumenPersona userId={`c:${id}`} />
        ) : (
          <Card as="form" onSubmit={guardar}>
            <div className="grid gap-x-4 md:grid-cols-2">
              <Field label="Nombre" htmlFor="contacto-nombre" required>
                <Input id="contacto-nombre" value={datos.nombre} onChange={cambiar('nombre')} required />
              </Field>
              <Field label="Apellido" htmlFor="contacto-apellido">
                <Input id="contacto-apellido" value={datos.apellido} onChange={cambiar('apellido')} />
              </Field>
              <Field label="Mail" htmlFor="contacto-email">
                <Input id="contacto-email" type="email" icon="mail" value={datos.email} onChange={cambiar('email')} />
              </Field>
              <Field label="Teléfono" htmlFor="contacto-telefono">
                <Input id="contacto-telefono" type="tel" icon="phone" value={datos.telefono} onChange={cambiar('telefono')} />
              </Field>
              <Field label="Fecha de nacimiento" htmlFor="contacto-nacimiento">
                <DatePicker id="contacto-nacimiento" value={datos.fechaNacimiento} onChange={cambiar('fechaNacimiento')} clearable />
              </Field>
              <Field label="Notas" htmlFor="contacto-notas" className="md:col-span-2">
                <Textarea id="contacto-notas" value={datos.notas} onChange={cambiar('notas')} rows={3} maxLength={1000} />
              </Field>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-3 border-t border-surface-border pt-4">
              <Button type="button" variant="danger" icon="delete" onClick={borrar}>
                Borrar contacto
              </Button>
              <Button type="submit" icon="check" loading={guardando}>
                Guardar cambios
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default ContactoDetalle;
