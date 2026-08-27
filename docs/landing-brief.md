# Landing de Malka — material para el diseño

Documento de contexto para rediseñar `casamalka.org` como **vitrina pública
dentro de la app** (ruta sin auth) que lleve al registro/login.
Preparado el 2026-08-27, rama `landing` (nace de `redesign-ui-ds`).

No define la dirección visual: la define el command de design. Esto es el
inventario de lo que hay hoy, la identidad ya existente y la estructura sobre
la que iterar.

---

## 1. El sitio actual (casamalka.org)

WordPress + Elementor sobre el theme **Jupiter X (Artbees) demo "yoga2"**, con
el contenido real cargado encima de la plantilla y buena parte de la demo sin
limpiar. Tres páginas: **Agenda**, **Qué es Malka**, **Contacto**.

### Home (`/`)

| Bloque | Contenido |
|---|---|
| Header | Wordmark MALKA · nav *Agenda · Qué es Malka · Contacto* · pill verde **Seguinos** (→ Instagram) |
| Hero | Foto circular (mesa de Shabat) + titular serif enorme en verde **"El punto de encuentro para tu identidad judía"** + pill **"Entrá a tu casa"** — que hoy sólo lleva a `/que-es-malka/` |
| ¿Qué es Malka? | 3 párrafos + foto + botón *Conocé más* |
| Tres columnas con ícono | *¿Cuándo puedo ir?* / *¿Qué puedo hacer?* / *¿Dónde queda?* + botón *¿Tenés más preguntas? Es por acá* |
| Mosaico | 8 fotos reales de encuentros, a todo el ancho |
| Footer | Banda verde con Instagram / WhatsApp / mail + "© 2024 Casa Malka · Powered by Comunidad Amijai" |

### Qué es Malka (`/que-es-malka/`)

Título · **Casa Malka** (texto + foto) · fila de 6 íconos **Judaísmo ·
Actividades · Coworking · Asaditos · Huerta · Música** · **Conocé la casa**
(recorrido en 4 párrafos: salón/Shabat, quincho con parrilla, cowork del primer
piso, La Ieshive) · **La Ieshive** · **Esperá, hay más** (estudio, huerta,
terraza) · **Staff** · banda verde de Instagram · **Preguntas frecuentes**
(acordeón de 8) · footer.

### Agenda (`/agenda/`)

**Está vacía.** Un calendario mensual del plugin de eventos sin un solo evento
cargado, y abajo la banda de Instagram y las FAQ repetidas. Es, textualmente,
el agujero que viene a tapar el sistema nuevo.

### Contacto (`/contacto/`)

Página corta, sin formulario: "¡Hola! Queremos conocerte" + los datos.

### Datos reales a conservar

- **Dirección**: 3 de Febrero 1325, CABA
- **Horario**: lunes a viernes de 14 a 21 h (feriados y festividades, consultar)
- **Instagram**: [@somosmalka](https://www.instagram.com/somosmalka/)
- **WhatsApp**: +54 9 11 3440-5730 (`wa.me/5491134405730`)
- **Mail**: malka@casamalka.org
- **Público**: jóvenes judíos de 18 a 35 años, movida pluralista
- **Institucional**: creada por la **Comunidad Amijai** (amijai.org)
- **Staff**: Dirección — Wally Liebhaber, Sem. Mati Bomse, Sem. Brian Bruh ·
  Asistente de Dirección — Tami Saban
- **8 preguntas frecuentes** ya redactadas (cuándo, para qué, dónde, quién
  puede sumarse, cómo enterarse, si hay que ser socio, si hay costo, si se
  puede proponer una actividad)
- **Voz de marca**: porteña, cálida y jodona — *"venite darling"*, *"así que
  chill"*, *"malkear"*, *"NO PARE, SIGUE SIGUE"*, *"Esperá, hay más"*,
  *"la pipol"*. Vale la pena sostenerla.

### Qué falta / está roto (lo que el rediseño arregla)

1. **No hay ninguna puerta al sistema.** Ni registro, ni login, ni inscripción.
   El único CTA del hero ("Entrá a tu casa") lleva a una página institucional.
2. **La agenda está vacía**, que es justo lo que la gente va a buscar.
3. **Restos de la demo del theme** sin borrar en el HTML: "Choose The Class For
   You", "Kundalini Yoga", "Upcoming Events", testimonios de *Brandon Pittman,
   Artbees*, un equipo de profesoras de yoga inventadas, un segundo footer con
   "© 2020 Artbees. Jupiter WordPress Theme Demo" y links a las redes de
   Artbees. Algunos están ocultos, pero viajan en el HTML y los ve Google.
4. **Contadores en cero**: "+0 Propuestas anuales", "+0 Jóvenes particiantes"
   (con el typo), "0+ Events Completed" — en inglés y sin cargar.
5. **Sin metadatos**: no hay description ni Open Graph; compartir el link en
   WhatsApp no muestra nada.
6. **Contacto sin formulario** y **FAQ duplicadas** en tres páginas.

### Fotos reales disponibles (descargables del sitio)

`2024/08/`: `malka-1.jpg`, `malka-2.jpg`, `Casa-Malka.jpeg`, `La-Ieshive-malka.jpg`,
`Va-3.jpeg`, `VA-4.jpg`, `VA-5.jpg`, `VA-6.jpg`, `VA-7.jpg`, `va-9.jpg`, `va-10.jpg` ·
`2024/07/`: `home-3.jpg`, `home-4.jpg`, `home-5.jpg`, `Logo-Malka-positivo.png`
(todas bajo `https://www.casamalka.org/wp-content/uploads/…`).
Más los 6 íconos de línea de las categorías (torá, yoga, parrilla, palas, etc.).

---

## 2. Identidad visual que ya existe en la app

### Tokens (`tailwind.config.js`)

- **Verde de marca** `primary` = **#689b78** (escala 50→900; `600` #537f61 para
  hover, `700` #42654d para active). El verde del sitio actual es **#659672**:
  prácticamente el mismo, así que hay continuidad sin tocar nada.
- **Tinta** `ink` #2c3d34 · `ink-soft` #4a5c52 · `ink-muted` #6b7a72 ·
  `ink-faint` #94a29a. Nunca gris neutro.
- **Superficies**: `surface` #ffffff · `raised` #fffcf7 · `sunken` #fdfaf5 ·
  **`page` #f9f2e8 (el crema de marca, fondo del body)** · `border` #ebe4d8.
- **Semánticos**: success / warning / danger / info, cada uno con 50/500/600/700.
- **Radios**: `control` 10px (botones, inputs) · `card` 16px · `panel` 24px · `pill`.
- **Sombras cálidas** (nunca negro puro): `subtle`, `card`, `raised`, `overlay`,
  `focus`.
- **Motion**: duraciones `instant` 60ms → `deliberate` 400ms; easings
  `entrance` / `exit` / `standard` / `spring`; keyframes `fade-in`,
  `fade-in-up`, `scale-in`, `modal-in`, `sheet-in`. Regla del DS: nunca
  `transition-all`, se usan los grupos `transition-control` / `chrome` / `elevate`.

Regla vigente: **los componentes consumen sólo tokens**, nunca colores crudos
de Tailwind ni hex sueltos. Si algo no se puede expresar con un token, se
agrega el token.

### Tipografía

- **Display**: `font-display` → **Cormorant Garamond** (Georgia, serif), cargada
  en `index.html` desde Google Fonts en pesos 500/600/700 + itálica 500. La usan
  el login, el registro y todos los títulos de la app.
- **Texto**: `font-sans` → stack del sistema (`ui-sans-serif`, `system-ui`,
  `-apple-system`, Segoe UI, Roboto).
- El sitio actual usa **Playfair Display** + Roboto. Cormorant es más liviana y
  más cálida; Playfair, más contrastada y editorial. **Decisión abierta para el
  diseño**: mantener Cormorant (coherencia total con la app) o traer Playfair
  sólo a la landing (continuidad con el sitio que la gente ya conoce).

### Logo

`src/assets/logo-malka-positivo.png` — 798×201, PNG con alfa. Wordmark
**MALKA** en verde donde la **K** es una januquiá estilizada de tres llamas. Es
la misma pieza que usa el sitio actual. No hay versión negativa ni SVG en el
repo (la negativa existe en el WordPress si hiciera falta).
En `public/`: favicon 32, apple-touch-icon, `pwa-192`, `pwa-512`,
`maskable-512` (monograma).

### Pantallas públicas como referencia de estilo (`src/pages/auth/Login.jsx`)

Es el lenguaje visual ya aprobado para "afuera de la app":

- Fondo `min-h-screen` con **gradiente crema** `from-surface-sunken via-surface-page to-surface-border`.
- Encima, una **textura suave tipo papel/casa**: tres `radial-gradient` de
  verde al 12% / 8% y crema al 90%, a `opacity-[0.35]`, `pointer-events-none`.
- Logo centrado (`h-14 sm:h-16`) y debajo el titular en `font-display`,
  `font-semibold`, `tracking-tight`, `text-ink` — con el mismo claim del sitio:
  **"El punto de encuentro para tu identidad judía"**.
- Tarjeta `rounded-panel border border-primary/15 bg-surface/95 shadow-raised backdrop-blur-sm`.
- Botón primario verde sólido, `size="lg"`, ancho completo.
- Pie chico en `text-ink-faint` con link a `casamalka.org` y la línea
  *"Casa abierta para la comunidad"*.

### Design system disponible

`src/components/ui` (~24 componentes, se importan siempre desde
`components/ui`): `Button` (variantes primary / secondary / ghost / danger /
link), `Card` + `CardHeader`, `Badge`, `Alert`, `Modal`, `Icon` (lucide),
`Input`, `Field`, `Select`, `Checkbox`, `Switch`, `DatePicker`, `Calendar`,
`Table`, `ImageLightbox`, `Feedback` (Spinner / Skeleton / EmptyState), etc.
La landing debería apoyarse en `Button`, `Card`, `Icon` y `ImageLightbox`, y
agregar sus propias secciones editoriales — que no van a salir del DS de
producto, y está bien: son piezas de landing.

---

## 3. Estructura propuesta de la landing

Página única, scroll largo, con nav sticky que ancla a las secciones. Todo el
contenido sale del sitio actual (arriba), reescrito y ordenado.

### Ruta

Hoy `/` redirige a `/dashboard` o a `/login` según haya sesión
(`src/App.jsx`, última `<Route>`). Propuesta: **`/` pasa a ser la landing,
pública y sin `AppShell`**; el usuario logueado que entre a `/` sigue yendo a
su dashboard (o ve la landing con el botón cambiado a "Ir a mi cuenta").
`/login` y `/register` quedan como están.

### Secciones

1. **Nav** — logo + *Actividades · La casa · Preguntas · Contacto* + dos
   acciones a la derecha: **Iniciar sesión** (link/ghost) y **Registrate**
   (primario). En mobile, hamburguesa; el CTA primario queda siempre visible.

2. **Hero** — el claim de la casa, **"El punto de encuentro para tu identidad
   judía"**, en `font-display` sobre el crema de marca, con foto real de un
   encuentro. Bajada corta: espacio de reunión, intercambio y actividades para
   jóvenes de 18 a 35. CTA primario **"Entrá a tu casa" → registro**, y
   secundario *"Ver qué hay esta semana"* → sección de actividades.
   *El CTA del sitio actual, ahora sí, abre una puerta.*

3. **Actividades / Qué pasa en Malka** — la fila de 6 categorías con ícono que
   ya existe (**Judaísmo · Actividades · Coworking · Asaditos · Huerta ·
   Música**) como tarjetas, más una nota clara de que la agenda y la
   inscripción viven adentro del sistema, con CTA a registrarse.
   *Decisión abierta:* mostrar aquí las **próximas actividades reales** en vivo
   requiere un endpoint público nuevo en el backend — hoy `GET /activities`
   pide `authenticate`, sólo `GET /tags` es público. Arrancamos estático y, si
   se quiere, se suma después.

4. **Quiénes somos / Conocé la casa** — el recorrido por el edificio en cuatro
   momentos (salón y Shabat, quincho con parrilla, cowork del primer piso, La
   Ieshive y el estudio), con las fotos reales. Formato editorial alternado
   texto/imagen. Cierra con la terraza y **"Vení a conocer Malka. Te esperamos
   para que abras la puerta que elijas."** Incluye **La Ieshive** como bloque
   propio y el **Staff** en una tira sobria.

5. **Preguntas frecuentes** — acordeón con las 8 preguntas ya redactadas, una
   sola vez en todo el sitio (hoy están repetidas en tres páginas).

6. **Contacto y ubicación** — dirección, horario, mapa o foto de la fachada,
   Instagram, WhatsApp y mail. Sin formulario: el canal real es WhatsApp e
   Instagram, y quien quiere entrar se registra.

7. **CTA de cierre** — banda verde a todo el ancho, cerrando con la invitación
   a registrarse y el link chico a iniciar sesión para quien ya tiene cuenta.

8. **Footer** — logo, nav corta, redes, "Creada por la Comunidad Amijai"
   (link a amijai.org) y el año actual (no "2024" hardcodeado).

### Además

- **Metadatos**: `<title>`, description, Open Graph e imagen para que el link
  se comparta bien por WhatsApp — hoy no existe nada de eso.
- **Mobile primero**: la mayoría llega desde el link de Instagram.
- **Nada de la demo de Artbees** entra al HTML nuevo.

### Lo que queda por definir (el command de design decide)

- Cormorant vs. Playfair para los titulares.
- Cuánto peso tiene la foto: hero a sangre vs. la composición circular actual.
- Si el crema `surface-page` domina toda la página o si hay secciones en verde
  pleno (hoy el sitio usa una banda verde para Instagram y otra para el footer).
- Tratamiento de las 6 categorías: íconos de línea heredados vs. `Icon` de
  lucide del DS.
- Si el mosaico de fotos sobrevive como galería o se reparte entre secciones.
