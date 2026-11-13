import { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Button, FileInput, Modal } from '../../ui';
import { useToast } from '../../../contexts/ToastContext';
import { numero } from '../metricas/piezas';

const fecha = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');

/**
 * Importar la planilla de asistencias (y, si la tiene, la de gastos). Primero
 * muestra qué va a hacer —cuántas personas reconoce, cuántas crea, cuántas
 * visitas y gastos carga, qué saltea y por qué— y recién con «Importar» lo
 * hace. Se puede volver a importar la planilla actualizada: lo que ya está
 * no se duplica.
 */
const ImportarPlanilla = ({ abierto, onCerrar, onImportada }) => {
  const { showSuccess, showError } = useToast();
  const [archivo, setArchivo] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    if (abierto) {
      setArchivo(null);
      setResumen(null);
    }
  }, [abierto]);

  const enviar = async (confirmar) => {
    if (!archivo) return;
    setTrabajando(true);
    const datos = new FormData();
    datos.append('archivo', archivo);
    if (confirmar) datos.append('confirmar', 'si');
    try {
      const r = await axios.post('/historial/importar', datos);
      if (confirmar) {
        showSuccess(`Listo: ${numero(r.data.resumen.visitasNuevas)} visitas importadas`);
        onImportada();
      } else {
        setResumen(r.data.resumen);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'No se pudo leer la planilla');
    } finally {
      setTrabajando(false);
    }
  };

  const nada = resumen && !resumen.visitasNuevas && !resumen.gastosNuevos && !resumen.ingresosNuevos;

  return (
    <Modal
      open={abierto}
      onClose={onCerrar}
      size="lg"
      title="Importar planilla"
      description="La planilla de anotados a eventos (xlsx o csv). Si trae la hoja de gastos, también se cargan."
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
          {resumen ? (
            <Button icon="upload" loading={trabajando} disabled={nada} onClick={() => enviar(true)}>
              Importar
            </Button>
          ) : (
            <Button loading={trabajando} disabled={!archivo} onClick={() => enviar(false)}>
              Revisar la planilla
            </Button>
          )}
        </>
      }
    >
      <FileInput
        accept=".xlsx,.csv"
        onChange={(file) => {
          setArchivo(file ?? null);
          setResumen(null);
        }}
        hint="xlsx o csv, hasta 10 MB"
      />
      <p className="mt-2 text-xs text-ink-muted">
        Se reconocen las columnas por su nombre: Nombre, Apellido, Email, Fecha de Nacimiento, Evento, Fecha, Categoria, Sub-Categoria. En la de gastos: Concepto, Monto, Evento y Fecha.
      </p>

      {resumen && (
        <div className="mt-5 animate-fade-in-up space-y-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['Visitas nuevas', resumen.visitasNuevas],
              ['Eventos', resumen.eventos],
              ['Personas nuevas', resumen.contactosNuevos],
              ['Ya registradas', resumen.reconocidas.usuarios + resumen.reconocidas.contactos],
              ['Gastos', resumen.gastosNuevos],
              ['Recaudaciones', resumen.ingresosNuevos],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta} className="rounded-control border border-surface-border bg-surface-sunken px-3 py-2.5">
                <dt className="text-xs text-ink-muted">{etiqueta}</dt>
                <dd className="text-xl font-semibold tabular-nums text-ink">{numero(valor)}</dd>
              </div>
            ))}
          </dl>
          {resumen.desde && (
            <p className="text-sm text-ink-soft">
              De la hoja «{resumen.hojas.join('» y «')}», del {fecha(resumen.desde)} al {fecha(resumen.hasta)}.
            </p>
          )}
          {resumen.salteadas > 0 && (
            <Alert tone="info" title={`${numero(resumen.salteadas)} filas no se cargan`}>
              <ul className="list-inside list-disc">
                {resumen.motivosSalteadas.map((m) => (
                  <li key={m.motivo}>
                    {m.motivo}: {numero(m.cantidad)}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          {nada && <Alert tone="success">Todo lo de esta planilla ya está cargado. No hay nada nuevo para importar.</Alert>}
        </div>
      )}
    </Modal>
  );
};

export default ImportarPlanilla;
