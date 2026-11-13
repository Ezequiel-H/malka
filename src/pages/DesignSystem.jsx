import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  ColorInput,
  DatePicker,
  EmptyState,
  Field,
  FileInput,
  Icon,
  Input,
  Modal,
  RadioGroup,
  Select,
  Skeleton,
  SkeletonCards,
  SkeletonRows,
  SkeletonText,
  Spinner,
  Switch,
  Table,
  Textarea,
  badgeTones,
  buttonSizes,
  buttonVariants,
  iconNames,
} from '../components/ui';

/**
 * PÁGINA TEMPORAL — ruta /ds
 *
 * Vitrina del design system para iterar los componentes en aislamiento, sin
 * tener que navegar la app hasta encontrar un caso real.
 *
 * Se borra (junto con su ruta en App.jsx) antes de salir a producción.
 */

const Section = ({ title, hint, children }) => (
  <section className="mb-12">
    <div className="mb-4 border-b border-surface-border pb-2">
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </div>
    {children}
  </section>
);

const Row = ({ label, children }) => (
  <div className="mb-5">
    {label && (
      <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-faint">{label}</p>
    )}
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
);

const Swatch = ({ name, className }) => (
  <div className="w-[104px]">
    <div className={`h-14 rounded-control border border-surface-border ${className}`} />
    <p className="mt-1.5 font-mono text-[11px] leading-tight text-ink-muted">{name}</p>
  </div>
);

const TIPOS = [
  { value: 'unica', label: 'Única', icon: 'activity', description: 'Una sola fecha' },
  { value: 'recurrente', label: 'Recurrente', icon: 'time', description: 'Se repite' },
  { value: 'viaje', label: 'Viaje', icon: 'location', description: 'Con varias jornadas' },
  { value: 'archivada', label: 'Archivada', icon: 'blocked', disabled: true },
];

const DesignSystem = () => {
  const [text, setText] = useState('');
  const [errorText, setErrorText] = useState('valor@invalido');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('unica');
  const [responsable, setResponsable] = useState(null);
  const [frecuencia, setFrecuencia] = useState('semanal');
  const [acepta, setAcepta] = useState(false);
  const [publicada, setPublicada] = useState(true);
  const [color, setColor] = useState('#689b78');
  const [archivo, setArchivo] = useState(null);
  const [fecha, setFecha] = useState('');
  const [mes, setMes] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const responsables = [
    { value: '1', label: 'Ana Groisman', description: 'ana@malka.org', icon: 'user' },
    { value: '2', label: 'Bruno Feldman', description: 'bruno@malka.org', icon: 'user' },
    { value: '3', label: 'Carla Nudelman', description: 'carla@malka.org', icon: 'user' },
    { value: '4', label: 'Diego Rosenthal', description: 'diego@malka.org', icon: 'user' },
    { value: '5', label: 'Elena Tauber', description: 'elena@malka.org', icon: 'user' },
  ];

  const filas = [
    { id: 1, nombre: 'Kundalini Yoga', fecha: '03/09', cupo: '12/20', estado: 'publicada' },
    { id: 2, nombre: 'Cena de Shabat', fecha: '05/09', cupo: '40/40', estado: 'completa' },
    { id: 3, nombre: 'Taller de cerámica', fecha: '11/09', cupo: '3/15', estado: 'borrador' },
  ];

  const columnas = [
    { key: 'nombre', header: 'Actividad' },
    { key: 'fecha', header: 'Fecha', align: 'center' },
    { key: 'cupo', header: 'Cupo', align: 'center' },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge
          tone={
            row.estado === 'publicada' ? 'success' : row.estado === 'completa' ? 'warning' : 'neutral'
          }
          dot
        >
          {row.estado}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: () => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" icon="edit" iconOnly label="Editar" />
          <Button variant="ghost" size="sm" icon="delete" iconOnly label="Eliminar" />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <header className="mb-10">
          <Badge tone="warning" icon="warning">
            Ruta temporal
          </Badge>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Design System · Malka</h1>
          <p className="mt-2 text-ink-muted">
            Vitrina para iterar los componentes. Todo lo que se ve acá sale de{' '}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-sm">
              src/components/ui
            </code>
            .
          </p>
        </header>

        <Section title="Color" hint="Los componentes usan sólo estos tokens. Nada de gray-600 ni hex sueltos.">
          <Row label="Marca">
            <Swatch name="primary-50" className="bg-primary-50" />
            <Swatch name="primary-100" className="bg-primary-100" />
            <Swatch name="primary-300" className="bg-primary-300" />
            <Swatch name="primary-500 ·  DEFAULT" className="bg-primary" />
            <Swatch name="primary-600" className="bg-primary-600" />
            <Swatch name="primary-700" className="bg-primary-700" />
            <Swatch name="primary-900" className="bg-primary-900" />
          </Row>
          <Row label="Tinta (texto)">
            <Swatch name="ink" className="bg-ink" />
            <Swatch name="ink-soft" className="bg-ink-soft" />
            <Swatch name="ink-muted" className="bg-ink-muted" />
            <Swatch name="ink-faint" className="bg-ink-faint" />
          </Row>
          <Row label="Superficies">
            <Swatch name="surface" className="bg-surface" />
            <Swatch name="surface-raised" className="bg-surface-raised" />
            <Swatch name="surface-sunken" className="bg-surface-sunken" />
            <Swatch name="surface-page" className="bg-surface-page" />
            <Swatch name="surface-border" className="bg-surface-border" />
          </Row>
          <Row label="Semánticos">
            <Swatch name="success" className="bg-success-500" />
            <Swatch name="warning" className="bg-warning-500" />
            <Swatch name="danger" className="bg-danger-500" />
            <Swatch name="info" className="bg-info-500" />
          </Row>
        </Section>

        <Section title="Tipografía">
          <div className="space-y-3 rounded-card border border-surface-border bg-surface p-6">
            <p className="font-display text-5xl font-bold text-ink">Cormorant Garamond</p>
            <p className="font-display text-3xl text-ink-soft">Display · títulos y momentos de marca</p>
            <hr className="border-surface-border" />
            <p className="text-base text-ink">
              Sans · cuerpo de texto. Es la que hace el trabajo pesado en toda la app.
            </p>
            <p className="text-sm text-ink-soft">text-sm · el tamaño más usado del sistema</p>
            <p className="text-xs text-ink-muted">text-xs · metadatos, ayudas, contadores</p>
          </div>
        </Section>

        <Section title="Botones" hint="Renderiza button, a o Link según reciba onClick, href o to.">
          {buttonVariants.map((variant) => (
            <Row key={variant} label={variant}>
              {buttonSizes.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size === 'sm' ? 'Chico' : size === 'md' ? 'Mediano' : 'Grande'}
                </Button>
              ))}
              <Button variant={variant} icon="add">
                Con icono
              </Button>
              <Button variant={variant} iconRight="forward">
                Icono derecha
              </Button>
              <Button variant={variant} loading>
                Cargando
              </Button>
              <Button variant={variant} disabled>
                Deshabilitado
              </Button>
              <Button variant={variant} icon="settings" iconOnly label="Ajustes" />
            </Row>
          ))}
          <Row label="Ancho completo">
            <div className="w-full max-w-sm">
              <Button
                fullWidth
                size="lg"
                icon="check"
                loading={loadingDemo}
                onClick={() => {
                  setLoadingDemo(true);
                  setTimeout(() => setLoadingDemo(false), 1600);
                }}
              >
                Probar estado de carga
              </Button>
            </div>
          </Row>
        </Section>

        <Section
          title="Formularios"
          hint="Field cablea label, hint, error y accesibilidad. Los controles lo leen solos."
        >
          <div className="grid gap-6 rounded-card border border-surface-border bg-surface p-6 sm:grid-cols-2">
            <Field label="Nombre" hint="Como figura en el documento" required>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ana Groisman" />
            </Field>

            <Field label="Email" error="Ese email no es válido" required>
              <Input
                type="email"
                icon="mail"
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
              />
            </Field>

            <Field label="Contraseña" hint="Mínimo 8 caracteres">
              <Input type="password" defaultValue="unsecreto" />
            </Field>

            <Field label="Precio" hint="Con sufijo">
              <Input type="number" suffix="ARS" defaultValue="12000" />
            </Field>

            <Field label="Teléfono">
              <Input type="tel" icon="phone" placeholder="11 5555 5555" />
            </Field>

            <Field label="Buscar" >
              <Input type="search" icon="search" placeholder="Buscar actividad..." />
            </Field>

            <Field label="Deshabilitado">
              <Input disabled value="No se puede editar" readOnly />
            </Field>

            <Field label="Fecha" hint="DatePicker propio, portado de TLP">
              <DatePicker value={fecha} onChange={setFecha} clearable />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Descripción" hint="Se muestra en el detalle de la actividad">
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={280}
                  placeholder="Contá de qué se trata..."
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section
          title="Select propio"
          hint="Sin <select> nativo. Teclado completo: ↑↓, Enter, Esc, Home/End y type-ahead."
        >
          <div className="grid gap-6 rounded-card border border-surface-border bg-surface p-6 sm:grid-cols-2">
            <Field label="Tipo de actividad" hint="Probá navegarlo sólo con el teclado">
              <Select options={TIPOS} value={tipo} onChange={setTipo} />
            </Field>

            <Field label="Responsable" hint="Con búsqueda y opción de limpiar">
              <Select
                options={responsables}
                value={responsable}
                onChange={setResponsable}
                placeholder="Elegí un responsable"
                searchable
                clearable
              />
            </Field>

            <Field label="Con error" error="Tenés que elegir una opción">
              <Select options={TIPOS} value={null} onChange={() => {}} />
            </Field>

            <Field label="Deshabilitado">
              <Select options={TIPOS} value="unica" disabled />
            </Field>
          </div>
        </Section>

        <Section
          title="DatePicker"
          hint="Portado de todos-los-perfumes. Vistas días → meses → años: hacé click en el título."
        >
          <div className="grid gap-6 rounded-card border border-surface-border bg-surface p-6 sm:grid-cols-2">
            <Field label="Fecha de la actividad" hint="Click en el título para cambiar de vista">
              <DatePicker value={fecha} onChange={setFecha} clearable />
            </Field>

            <Field label="Mes de referencia" hint="variant='month'">
              <DatePicker value={mes} onChange={setMes} variant="month" clearable />
            </Field>

            <Field label="Desde" hint="Limita el máximo del campo Hasta">
              <DatePicker value={desde} onChange={setDesde} max={hasta || undefined} clearable />
            </Field>

            <Field label="Hasta" hint="No deja elegir antes de Desde">
              <DatePicker value={hasta} onChange={setHasta} min={desde || undefined} clearable />
            </Field>
          </div>
        </Section>

        <Section title="Selección">
          <div className="grid gap-8 rounded-card border border-surface-border bg-surface p-6 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase text-ink-faint">Checkbox</p>
              <Checkbox
                label="Acepto los términos"
                description="Vas a poder darte de baja cuando quieras"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
              />
              <Checkbox label="Indeterminado" indeterminate readOnly checked={false} />
              <Checkbox label="Deshabilitado" disabled />
            </div>

            <div>
              <RadioGroup
                label="Frecuencia"
                name="frecuencia"
                value={frecuencia}
                onChange={setFrecuencia}
                options={[
                  { value: 'diaria', label: 'Diaria' },
                  { value: 'semanal', label: 'Semanal', description: 'La más usada' },
                  { value: 'mensual', label: 'Mensual' },
                ]}
              />
            </div>

            <div className="space-y-3">
              <p className="font-mono text-xs uppercase text-ink-faint">Switch</p>
              <Switch
                label="Actividad publicada"
                description="Se aplica al instante"
                checked={publicada}
                onChange={(e) => setPublicada(e.target.checked)}
              />
              <Switch label="Deshabilitado" disabled />
            </div>
          </div>
        </Section>

        <Section title="Archivo y color">
          <div className="grid gap-6 rounded-card border border-surface-border bg-surface p-6 sm:grid-cols-2">
            <Field label="Comprobante">
              <FileInput
                accept="image/*,.pdf"
                value={archivo}
                onChange={setArchivo}
                maxSize={5 * 1024 * 1024}
              />
            </Field>

            <Field label="Color de la etiqueta">
              <ColorInput value={color} onChange={setColor} />
            </Field>
          </div>
        </Section>

        <Section title="Badges">
          <Row label="Suave (por defecto)">
            {badgeTones.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </Row>
          <Row label="Sólido">
            {badgeTones.map((tone) => (
              <Badge key={tone} tone={tone} solid>
                {tone}
              </Badge>
            ))}
          </Row>
          <Row label="Con punto y con icono">
            <Badge tone="success" dot>
              Confirmada
            </Badge>
            <Badge tone="warning" dot>
              Pendiente
            </Badge>
            <Badge tone="primary" icon="tag">
              Bienestar
            </Badge>
            <Badge tone="danger" icon="close">
              Cancelada
            </Badge>
          </Row>
        </Section>

        <Section title="Alertas" hint="Superficie translúcida con halo de color. El título va en tinta; el color vive en el icono.">
          <div className="space-y-3">
            <Alert tone="success" title="Inscripción confirmada">
              Te esperamos el martes a las 19:00.
            </Alert>
            <Alert tone="warning" title="Cupo casi completo">
              Quedan 2 lugares disponibles.
            </Alert>
            <Alert tone="danger" title="No se pudo guardar" onClose={() => {}}>
              Revisá los campos marcados en rojo.
            </Alert>
            <Alert tone="info">Sin título: una sola línea de contexto.</Alert>
            <Alert
              tone="info"
              title="Con acciones"
              action={
                <>
                  <Button size="sm">Reintentar</Button>
                  <Button size="sm" variant="ghost">
                    Descartar
                  </Button>
                </>
              }
            >
              Las alertas pueden llevar botones sin romper la jerarquía.
            </Alert>
            <Alert tone="success" compact>
              Variante compacta, para confirmaciones breves.
            </Alert>
          </div>

          {/* El desenfoque sólo se aprecia con contenido detrás. */}
          <div className="relative mt-6 overflow-hidden rounded-card p-6"
            style={{ background: 'linear-gradient(120deg, #689b78 0%, #2c3d34 55%, #c98a1e 100%)' }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/70">
              Sobre contenido: acá se ve el backdrop-blur
            </p>
            <Alert tone="warning" title="Cupo casi completo">
              Quedan 2 lugares disponibles.
            </Alert>
          </div>
        </Section>

        <Section title="Card y tabla">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader title="Card simple" subtitle="Sin interacción" />
              <p className="text-sm text-ink-soft">No se mueve en hover porque no lleva a ningún lado.</p>
            </Card>

            <Card interactive>
              <CardHeader title="Card interactiva" subtitle="Pasá el mouse" />
              <p className="text-sm text-ink-soft">Se levanta apenas: promete que es clickeable.</p>
            </Card>

            <Card padding="lg" className="bg-primary-50 border-primary-200">
              <CardHeader title="Con override" subtitle="className encima" />
              <p className="text-sm text-primary-700">tailwind-merge resuelve el conflicto de clases.</p>
            </Card>
          </div>

          <Table columns={columnas} rows={filas} onRowClick={() => {}} />
        </Section>

        <Section
          title="Skeletons de página"
          hint="Lo que se ve mientras cargan los listados. En local la API responde tan rápido que apenas se alcanzan a ver."
        >
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-ink-faint">SkeletonCards</p>
          <SkeletonCards count={3} />
          <p className="mb-2 mt-6 font-mono text-xs uppercase tracking-wide text-ink-faint">SkeletonRows</p>
          <SkeletonRows count={4} />
        </Section>

        <Section title="Estados de carga y vacío">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="mb-3 font-mono text-xs uppercase text-ink-faint">Spinner</p>
              <div className="flex items-center gap-4">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
            </Card>

            <Card>
              <p className="mb-3 font-mono text-xs uppercase text-ink-faint">Skeleton</p>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" rounded="pill" />
                <div className="flex-1">
                  <SkeletonText lines={2} />
                </div>
              </div>
            </Card>

            <Card padding="none">
              <EmptyState
                icon="activity"
                title="Sin actividades"
                description="Todavía no hay nada publicado para este mes."
                action={
                  <Button icon="add" size="sm">
                    Crear actividad
                  </Button>
                }
              />
            </Card>
          </div>
        </Section>

        <Section title="Modal" hint="Atrapa el foco, cierra con Escape y lo devuelve al botón que lo abrió.">
          <Button icon="view" onClick={() => setModalOpen(true)}>
            Abrir modal
          </Button>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirmar inscripción"
            description="Revisá los datos antes de confirmar"
            footer={
              <>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button icon="check" onClick={() => setModalOpen(false)}>
                  Confirmar
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <Alert tone="info">Probá tabular: el foco no se escapa del modal.</Alert>
              <Field label="Comentario" hint="Opcional">
                <Textarea placeholder="Algo que quieras aclarar..." />
              </Field>
              <Field label="Tipo">
                <Select options={TIPOS} value={tipo} onChange={setTipo} />
              </Field>
            </div>
          </Modal>
        </Section>

        <Section title="Iconos" hint={`${iconNames.length} iconos con nombre semántico. Cambiar de librería es tocar un solo archivo.`}>
          <div className="grid grid-cols-3 gap-2 rounded-card border border-surface-border bg-surface p-6 sm:grid-cols-6">
            {iconNames.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1.5 rounded-control p-2 text-ink-soft transition-colors duration-fast hover:bg-primary-50 hover:text-primary"
              >
                <Icon name={name} size="lg" />
                <span className="font-mono text-[10px] text-ink-muted">{name}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default DesignSystem;
