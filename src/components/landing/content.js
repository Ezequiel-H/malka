/**
 * Todo el texto de la landing, en un solo lugar.
 *
 * Casi nada de esto está escrito de cero: son los textos que Malka ya tenía en
 * casamalka.org, movidos tal cual. La voz de la casa ("venite darling", "así
 * que chill", "malkear") es de ellos y se conserva palabra por palabra; lo
 * único reescrito son los títulos de sección y las bajadas que empujan al
 * registro, que en el sitio viejo no existían porque no había a dónde entrar.
 *
 * Separado del JSX para que Malka pueda corregir una coma sin abrir un
 * componente, y para que se vea de un vistazo qué se afirma y qué no.
 */

export const CONTACTO = {
  direccion: '3 de Febrero 1325, CABA',
  mapa: 'https://maps.google.com/?q=3+de+Febrero+1325,+CABA',
  horario: 'Lunes a viernes, de 14 a 21 h',
  instagram: 'https://www.instagram.com/somosmalka/',
  instagramHandle: '@somosmalka',
  whatsapp: 'https://wa.me/5491134405730',
  whatsappVisible: '+54 9 11 3440-5730',
  mail: 'malka@casamalka.org',
  amijai: 'https://amijai.org/',
};

export const NAV = [
  { label: 'La semana', href: '#la-semana' },
  { label: 'La casa', href: '#la-casa' },
  { label: 'Preguntas', href: '#preguntas' },
  { label: 'Contacto', href: '#contacto' },
];

export const HERO = {
  /* El titular va cortado a mano y no librado al ancho de la caja: a tamaño
     de cartel, dónde corta cada línea ES el diseño. Cada una entra por
     separado desde detrás de su propio recorte.
     `titulo` queda como el texto corrido para lectores de pantalla, que no
     tienen por qué escuchar los cortes tipográficos. */
  titulo: 'El punto de encuentro para tu identidad judía',
  lineas: ['El punto', 'de encuentro', 'para tu', 'identidad judía'],
  bajada:
    'Un espacio de reunión, intercambio y actividades para jóvenes judíos de 18 a 35 años que buscan un lugar de pertenencia que los identifique.',
  meta: ['18 a 35 años', 'Lunes a viernes, 14 a 21', '3 de Febrero 1325, CABA'],
  ctaPrimario: 'Entrá a tu casa',
  ctaSecundario: 'Ver la semana',
};

/**
 * El pulso fijo de la casa, no la agenda.
 *
 * Sólo el primer beat afirma días y horario, porque es el único dato
 * confirmado (está publicado hoy en casamalka.org). Shabat y estudio se
 * nombran SIN día: el cronograma real todavía no lo pasó Malka, y la landing
 * es estática — si mañana el Shabat cambia de viernes, nadie se acuerda de
 * venir a editar esto. La fecha vive adentro del sistema, que es justamente
 * el argumento para registrarse.
 */
export const SEMANA = {
  titulo: 'La semana en Malka',
  bajada: 'La agenda cambia todas las semanas. Esto, no.',
  beats: [
    {
      icono: 'time',
      titulo: 'La casa abierta',
      dato: 'Lunes a viernes, 14 a 21',
      texto:
        'Cowork, café con cakes y venir a malkear un rato. Nosotros ponemos el wifi, el lugar y el café; vos traé tu compu y buena energía.',
    },
    {
      icono: 'wine',
      titulo: 'Shabat',
      dato: 'La fecha, en la agenda',
      texto:
        'La mesa larga, las velas y las mejores ceremonias de la casa. Cuándo cae la próxima lo vas a ver en la agenda, adentro.',
    },
    {
      icono: 'book',
      titulo: 'Espacios de estudio',
      dato: 'Días y horarios, en la agenda',
      texto:
        'Shiurim, charlas y bootcamps, más los cursos de La Ieshive. Los días y los horarios se publican en la agenda.',
    },
  ],
  hedge:
    'Eso sí, si es feriado o festividad, puede que estemos cerrados o tengamos horarios especiales, ¡así que chill!',
};

export const CATEGORIAS = {
  titulo: 'Y además, lo que cambia',
  texto:
    'Como sabemos que cada uno vive su propio judaísmo, Malka tiene muchas puertas. Cada una te lleva a experiencias sociales, culturales y espirituales diferentes, para que puedas vivir y construir tu propia identidad judía.',
  items: [
    { icono: 'book', label: 'Judaísmo' },
    { icono: 'sparkles', label: 'Actividades' },
    { icono: 'coffee', label: 'Coworking' },
    { icono: 'chef', label: 'Asaditos' },
    { icono: 'leaf', label: 'Huerta' },
    { icono: 'music', label: 'Música' },
  ],
  cierre:
    'Cada semana aparece algo nuevo, y la agenda vive adentro. Registrate y mirá qué se viene.',
  cta: 'Registrate',
};

export const CASA = {
  titulo: 'Conocé la casa',
  bajada:
    'Malka es una casa abierta donde siempre hay un mate que te está esperando, un café para compartir y una pileta para disfrutar el verano.',
  /* Los cuatro párrafos son textuales del recorrido de casamalka.org. */
  ambientes: [
    {
      id: 'salon',
      kicker: 'Planta baja',
      titulo: 'El salón',
      foto: 'salonColchonetas',
      texto:
        'Un salón te recibe con diferentes propuestas. Ahí te encontrás con alguien de nuestro staff con una sonrisa, y también es el espacio en el que hacemos las mejores ceremonias de Shabat. Hablamos de Torá y también vivimos experiencias culinarias únicas de la mano de referentes de la gastronomía.',
    },
    {
      id: 'quincho',
      kicker: 'Al fondo',
      titulo: 'El quincho',
      foto: 'parrilla',
      texto:
        'Si seguís caminando vas a ver que cumplimos el sueño del quincho con parrilla, para comer rico mientras charlamos y debatimos. ¿Los temas? Un hermoso variadito que va desde judaísmo moderno, economía, emprendedurismo y lo que pinte. Acá hay lugar para todo lo que sea aprendizaje y compartir ideas.',
    },
    {
      id: 'cowork',
      kicker: 'Primer piso',
      titulo: 'El cowork',
      foto: 'coworkSillon',
      texto:
        'En el primer piso te espera un cowork para que trabajes durante la semana como en casa. Queremos que te apropies del espacio, nosotros ponemos el wifi, el lugar y el café con cakes, vos traé tu compu y buena energía.',
    },
    {
      id: 'estudio',
      kicker: 'Segundo piso',
      titulo: 'El estudio',
      foto: 'tallerTotebags',
      texto:
        'Subite otro piso y conocé nuestro estudio, en el que practicamos talleres como yoga, escritura y cine. También hay un espacio en el que se dan charlas, bootcamps y diferentes clases.',
    },
  ],
};

export const IESHIVE = {
  kicker: 'Acá vive',
  titulo: 'La Ieshive',
  parrafos: [
    'Contamos con un espacio exclusivo de estudio de Torá y espiritualidad para jóvenes, en un ambiente innovador, abierto y plural.',
    'Un lugar de construcción identitaria y de formación judaica con los rabinos más copados del país, en un marco único y transformador.',
  ],
  cierre:
    'Por eso si querés convertirte en uno de los futuros líderes de nuestra comunidad, venite a estudiar a La Ieshive.',
  nota: 'Los shiurim, las charlas y los cursos se anuncian en la agenda.',
};

export const HAY_MAS = {
  titulo: 'Esperá, hay más',
  parrafos: [
    'También vas a encontrarte con nuestra huerta, un espacio que nos conecta con la naturaleza y con la vida.',
    'Pegadita está la terraza, nuestro lugar premium para frenar el tiempo y mirar un ratito las estrellas. Ahí vamos a disfrutar de encuentros, unplugged musicales, algún fueguito y nuevos vínculos.',
  ],
};

export const STAFF = {
  titulo: 'Quiénes te reciben',
  bajada: 'Alguien de nuestro staff te va a estar esperando con una sonrisa.',
  personas: [
    { nombre: 'Wally Liebhaber', rol: 'Dirección' },
    { nombre: 'Sem. Mati Bomse', rol: 'Dirección' },
    { nombre: 'Sem. Brian Bruh', rol: 'Dirección' },
    { nombre: 'Tami Saban', rol: 'Asistente de Dirección' },
  ],
};

/* Las ocho de casamalka.org, textuales, una sola vez en todo el sitio.
   Hoy están repetidas en las tres páginas del WordPress. */
export const FAQ = {
  titulo: 'Preguntas frecuentes',
  bajada: '¿Tenés más preguntas? Es por acá.',
  items: [
    {
      q: '¿Cuándo puedo ir a Malka?',
      a: 'Podés caer de lunes a viernes, entre las 14 y las 21 h. Eso sí, si es feriado o festividad, puede que estemos cerrados o tengamos horarios especiales, ¡así que chill!',
    },
    {
      q: '¿Para qué puedo ir a Malka?',
      a: 'Para un montón de cosas: sumarte a nuestras actividades, usar el espacio para laburar, venir a "malkear" (pasar el rato en Malka), charlar con la pipol que viene por acá, traer tus ideas, y mucho más. Acá casi todo se puede.',
    },
    {
      q: '¿Dónde queda Malka?',
      a: 'Estamos donde el aire se siente más dulce (ah re!), pero para que Google Maps no se confunda, la dirección exacta es 3 de Febrero 1325, CABA. Venite darling.',
    },
    {
      q: '¿Quién puede sumarse a las actividades de Malka?',
      a: 'Cualquier persona entre 18 y 35 años. Nuestra movida es judía y pluralista, pero abierta a distintas miradas y experiencias.',
    },
    {
      q: '¿Cómo me entero de lo que está pasando en Malka?',
      a: 'Registrándote acá: la agenda con todas las actividades vive adentro del sistema, y desde ahí mismo te inscribís. También podés seguirnos en Instagram o venir directamente a Malka. ¡Siempre vas a tener algo para hacer acá!',
    },
    {
      q: '¿Necesito ser socio/a para sumarme a las actividades de Malka?',
      a: 'No hace falta asociarte para nuestras actividades, aunque para algunos eventos o programas específicos puede haber algunos requisitos. Lo mejor es que leas bien siempre los forms de inscripción para estar al tanto.',
    },
    {
      q: '¿Hay que poner plata para las actividades en Malka?',
      a: 'Algunas actividades son de acceso gratuito y otras pueden tener un costo para cubrir gastos de materiales y/o que podamos continuar construyendo Malka. Siempre vamos a avisarte antes, así sabés si hay que colaborar con algo.',
    },
    {
      q: '¿Puedo tirar una idea o proponer una actividad en Malka?',
      a: '¡Obvio, nos encantaría! Estamos completamente abiertos a escuchar nuevas ideas y propuestas que sumen a nuestra comunidad y espacio. Si tenés algo en mente, no dudes en hacérnoslo saber.',
    },
  ],
};

export const CONTACTO_SECCION = {
  titulo: '¡Hola! Queremos conocerte',
  bajada:
    'Escribinos por donde te quede más cómodo, o caé directamente: estamos en 3 de Febrero 1325 y la puerta está abierta.',
};

export const CIERRE = {
  titulo: 'Vení a conocer Malka.',
  bajada: 'Te esperamos para que abras la puerta que elijas.',
  cta: 'Entrá a tu casa',
  yaTengoCuenta: '¿Ya tenés cuenta?',
  iniciarSesion: 'Iniciá sesión',
};
