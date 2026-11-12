import { useState, useEffect } from 'react';
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

const RESTRICCIONES = [
  'Vegetariano',
  'Vegano',
  'Sin TACC',
  'Sin lactosa',
  'Sin nueces',
  'Diabético',
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
  const [paises] = useState(() => opcionesPaises('es'));

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
      setError('Decinos tu fecha de nacimiento para completar el registro.');
      dots.fail();
      return;
    }
    // Igual que la fecha: el Select y los radios no los valida el navegador.
    if (!formData.nacionalidad || !formData.residencia) {
      setError('Contanos tu nacionalidad y dónde vivís.');
      dots.fail();
      return;
    }

    setLoading(true);

    const result = await register({
      ...formData,
      dni: formData.dni.replace(/ /g, '').trim(),
      telefono: formData.telefono.replace(/\s/g, '').trim(),
      tags
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
      <img src={logoMalka} alt="Malka" className="h-12 w-auto self-start sm:h-14" />
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Registro
      </h1>
      <div>
          {error && (
            <Alert tone="danger" className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="Nombre" required>
              <Input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Apellido" required>
              <Input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Fecha de nacimiento" required>
              <DatePicker
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={(fechaNacimiento) =>
                  setFormData((previo) => ({ ...previo, fechaNacimiento }))
                }
                max={formatLocalDateToString(new Date())}
              />
            </Field>

            <Field label="Nacionalidad" htmlFor="registro-nacionalidad" required>
              <Select
                id="registro-nacionalidad"
                name="nacionalidad"
                options={paises}
                value={formData.nacionalidad}
                onChange={(nacionalidad) => setFormData((previo) => ({ ...previo, nacionalidad: nacionalidad ?? '' }))}
                placeholder="Elegí un país"
                searchable
              />
            </Field>

            <RadioGroup
              label="¿Dónde vivís?"
              name="residencia"
              options={RESIDENCIAS}
              value={formData.residencia}
              onChange={(residencia) => setFormData((previo) => ({ ...previo, residencia }))}
              className="mb-5"
            />

            {formData.residencia && formData.residencia !== 'buenos_aires' && (
              <div className="mb-5 animate-fade-in-up">
                <Field label="¿En qué ciudad?" htmlFor="registro-ciudad" required className="mb-3">
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
                  Después de registrarte te vamos a pedir unos datos más por WhatsApp para terminar el registro.
                </Alert>
              </div>
            )}

            <Field label="DNI" hint="Entre 7 y 10 dígitos, sin puntos" required>
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
                title="Ingresá entre 7 y 10 dígitos"
                {...invalidEs('Ingresá entre 7 y 10 dígitos, sin puntos')}
              />
            </Field>

            <Field label="Email" required>
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

            <Field label="Teléfono" hint="Al menos 8 dígitos. Podés incluir + y código de país" required>
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
                title="Ingresá un teléfono con al menos 8 dígitos (podés usar + y código de país)"
                {...invalidEs('Ingresá un teléfono con al menos 8 dígitos (podés usar + y código de país)')}
              />
            </Field>

            <Field label="Contraseña" hint="Mínimo 6 caracteres" required>
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
                Toda la comida es Kosher. ¿Tenés algún tipo de restricción?
              </legend>
              <div className="space-y-2.5">
                {RESTRICCIONES.map((restriccion) => (
                  <Checkbox
                    key={restriccion}
                    label={restriccion}
                    checked={formData.restriccionesAlimentarias?.includes(restriccion) || false}
                    onChange={() => handleRestriccionChange(restriccion)}
                  />
                ))}
              </div>
            </fieldset>

            <Field label="¿Cómo te enteraste de esta propuesta?" required>
              <Input
                type="text"
                name="comoSeEntero"
                value={formData.comoSeEntero}
                onChange={handleChange}
                placeholder="Escribí cómo te enteraste..."
                required
              />
            </Field>

            <Field
              label="¿Qué te interesa?"
              hint="Elegí una o más áreas. Podés cambiarlas después en «Mis intereses»."
            >
              {tagsLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-ink-muted">
                  <Spinner size="sm" label="Cargando intereses" />
                  Cargando intereses...
                </div>
              ) : (
                <PublicTagPicker
                  availableTags={availableTags}
                  selectedNames={tags}
                  onChange={setTags}
                  emptyHint={
                    <p className="mt-2 text-sm text-ink-muted">
                      Si no aparecen opciones, podés completar tus intereses luego desde tu cuenta.
                    </p>
                  }
                />
              )}
            </Field>

            <Button type="submit" size="lg" fullWidth loading={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            ¿Ya tenés cuenta?{' '}
            <Button variant="link" size="sm" to="/login" className="min-h-0 px-0 py-0 align-baseline">
              Iniciá sesión aquí
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
