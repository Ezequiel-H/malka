import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PublicTagPicker from '../../components/tags/PublicTagPicker';
import { formatLocalDateToString } from '../../utils/dateUtils';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Field,
  Input,
  RadioGroup,
  Select,
  Spinner,
} from '../../components/ui';
import { DotsAccess, useDotsAccess } from '../../components/auth/dots_access';
import logoMalka from '../../assets/logo-malka-positivo.png';
import { invalidEs } from '../../utils/formValidation';
import { RESIDENCIAS, opcionesPaises } from '../../utils/paises';
import { SelectorIdioma, useIdioma } from '../../i18n';

/* El valor se guarda en castellano (lo lee el equipo); lo que se ve, en el
   idioma de quien se registra. */
const RESTRICCIONES = [
  { valor: 'Vegetariano', clave: 'vegetariano' },
  { valor: 'Vegano', clave: 'vegano' },
  { valor: 'Sin TACC', clave: 'sinTacc' },
  { valor: 'Sin lactosa', clave: 'sinLactosa' },
  { valor: 'Sin nueces', clave: 'sinNueces' },
  { valor: 'Diabético', clave: 'diabetico' },
];

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    dni: '',
    telefono: '',
    restriccionesAlimentarias: [],
    comoSeEntero: '',
    nacionalidad: '',
    residencia: '',
    ciudad: ''
  });
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const dots = useDotsAccess();
  const { t, idioma } = useIdioma();
  const paises = useMemo(() => opcionesPaises(idioma), [idioma]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get('/tags?activa=true');
        if (!cancelled) {
          setAvailableTags(res.data?.tags || []);
        }
      } catch (error) {
        console.error('Error cargando tags públicos en registro:', error);
        if (!cancelled) setAvailableTags([]);
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next =
      name === 'dni'
        ? value.replace(/ /g, '').trim()
        : name === 'telefono'
          ? value.replace(/\s/g, '').trim()
          : value;
    setFormData({
      ...formData,
      [name]: next
    });
  };

  const handleRestriccionChange = (restriccion) => {
    setFormData(prev => {
      const restricciones = prev.restriccionesAlimentarias || [];
      if (restricciones.includes(restriccion)) {
        return {
          ...prev,
          restriccionesAlimentarias: restricciones.filter(r => r !== restriccion)
        };
      } else {
        return {
          ...prev,
          restriccionesAlimentarias: [...restricciones, restriccion]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // DatePicker guarda el valor en un input hidden, y el navegador no valida
    // los hidden: el `required` del Field es sólo la marca visual, así que la
    // fecha se chequea acá a mano.
    if (!formData.fechaNacimiento) {
      setError(t('registro.faltaFecha'));
      dots.fail();
      return;
    }
    // Igual que la fecha: el Select y los radios no los valida el navegador.
    if (!formData.nacionalidad || !formData.residencia) {
      setError(t('registro.faltaResidencia'));
      dots.fail();
      return;
    }

    setLoading(true);

    const result = await register({
      ...formData,
      dni: formData.dni.replace(/ /g, '').trim(),
      telefono: formData.telefono.replace(/\s/g, '').trim(),
      tags,
      idioma
    });

    if (result.success) {
      // Fuera de Buenos Aires el registro sigue por WhatsApp: la pantalla de
      // bienvenida le muestra el botón para escribirnos.
      navigate('/dashboard');
    } else {
      setError(result.message);
      dots.fail();
    }

    setLoading(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <img src={logoMalka} alt="Malka" className="h-12 w-auto sm:h-14" />
        <SelectorIdioma />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {t('registro.titulo')}
      </h1>
      <div>
          {error && (
            <Alert tone="danger" className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Field label={t('registro.nombre')} required>
              <Input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label={t('registro.apellido')} required>
              <Input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label={t('registro.fechaNacimiento')} required>
              <DatePicker
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={(fechaNacimiento) =>
                  setFormData((previo) => ({ ...previo, fechaNacimiento }))
                }
                max={formatLocalDateToString(new Date())}
              />
            </Field>

            <Field label={t('registro.nacionalidad')} htmlFor="registro-nacionalidad" required>
              <Select
                id="registro-nacionalidad"
                name="nacionalidad"
                options={paises}
                value={formData.nacionalidad}
                onChange={(nacionalidad) => setFormData((previo) => ({ ...previo, nacionalidad: nacionalidad ?? '' }))}
                placeholder={t('registro.elegiPais')}
                searchable
              />
            </Field>

            <RadioGroup
              label={t('registro.dondeVivis')}
              name="residencia"
              options={RESIDENCIAS.map((r) => ({ value: r.value, label: t(`registro.residencias.${r.value}`) }))}
              value={formData.residencia}
              onChange={(residencia) => setFormData((previo) => ({ ...previo, residencia }))}
              className="mb-5"
            />

            {formData.residencia && formData.residencia !== 'buenos_aires' && (
              <div className="mb-5 animate-fade-in-up">
                <Field label={t('registro.ciudad')} htmlFor="registro-ciudad" required className="mb-3">
                  <Input
                    id="registro-ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    required
                    maxLength={80}
                    autoComplete="address-level2"
                  />
                </Field>
                <Alert tone="info">
                  {t('registro.avisoWhatsapp')}
                </Alert>
              </div>
            )}

            <Field label={t('registro.dni')} hint={t('registro.dniAyuda')} required>
              <Input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                inputMode="numeric"
                autoComplete="off"
                minLength={7}
                maxLength={10}
                pattern="\d{7,10}"
                title={t('registro.dniInvalido')}
                {...invalidEs(t('registro.dniAyuda'))}
              />
            </Field>

            <Field label={t('registro.email')} required>
              <Input
                type="email"
                icon="mail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </Field>

            <Field label={t('registro.telefono')} hint={t('registro.telefonoAyuda')} required>
              <Input
                type="tel"
                icon="phone"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                inputMode="tel"
                autoComplete="tel"
                minLength={8}
                maxLength={22}
                pattern="^[+]?[0-9]{8,20}$"
                title={t('registro.telefonoInvalido')}
                {...invalidEs(t('registro.telefonoInvalido'))}
              />
            </Field>

            <Field label={t('registro.contrasena')} hint={t('registro.contrasenaAyuda')} required>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </Field>

            {/* Grupo de checkboxes: el <fieldset> es lo que hace que un lector
                de pantalla anuncie la pregunta antes de cada opción. */}
            <fieldset className="mb-5">
              <legend className="mb-2 block text-sm font-medium text-ink-soft">
                {t('registro.restriccionesPregunta')}
              </legend>
              <div className="space-y-2.5">
                {RESTRICCIONES.map(({ valor, clave }) => (
                  <Checkbox
                    key={valor}
                    label={t(`registro.restricciones.${clave}`)}
                    checked={formData.restriccionesAlimentarias?.includes(valor) || false}
                    onChange={() => handleRestriccionChange(valor)}
                  />
                ))}
              </div>
            </fieldset>

            <Field label={t('registro.comoTeEnteraste')} required>
              <Input
                type="text"
                name="comoSeEntero"
                value={formData.comoSeEntero}
                onChange={handleChange}
                placeholder={t('registro.comoTeEnterastePlaceholder')}
                required
              />
            </Field>

            <Field
              label={t('registro.intereses')}
              hint={t('registro.interesesAyuda')}
            >
              {tagsLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-ink-muted">
                  <Spinner size="sm" label={t('registro.cargandoIntereses')} />
                  {t('registro.cargandoIntereses')}
                </div>
              ) : (
                <PublicTagPicker
                  availableTags={availableTags}
                  selectedNames={tags}
                  onChange={setTags}
                  emptyHint={
                    <p className="mt-2 text-sm text-ink-muted">
                      {t('registro.sinIntereses')}
                    </p>
                  }
                />
              )}
            </Field>

            <Button type="submit" size="lg" fullWidth loading={loading}>
              {loading ? t('registro.registrando') : t('registro.registrarse')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {t('registro.yaTenesCuenta')}{' '}
            <Button variant="link" size="sm" to="/login" className="min-h-0 px-0 py-0 align-baseline">
              {t('registro.iniciaSesion')}
            </Button>
          </p>
      </div>
    </>
  );
};

const Register = () => (
  <DotsAccess name="Malka" markSrc={logoMalka}>
    <RegisterForm />
  </DotsAccess>
);

export default Register;
