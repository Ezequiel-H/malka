/**
 * Los textos de la landing en los tres idiomas.
 *
 * La estructura (qué espacio enfoca la cámara, qué ícono lleva cada cosa) vive
 * en `pages/Landing.jsx`; acá sólo lo que se lee. Cada idioma tiene las mismas
 * claves, así que sumar uno es copiar un bloque y traducirlo.
 *
 * El hebreo se escribe en plural (אתם) para no elegir un género por el lector.
 */

export const IDIOMAS = [
  { id: 'es', corto: 'ES', nombre: 'Español', ruta: '/' },
  { id: 'en', corto: 'EN', nombre: 'English', ruta: '/en' },
  { id: 'he', corto: 'עב', nombre: 'עברית', ruta: '/he', rtl: true },
];

export const TEXTOS = {
  es: {
    titulo: 'Malka — Una casa para compartir nuestra espiritualidad judía',
    espacios: {
      mesa: { nombre: 'El salón', corto: 'Salón', que: 'La mesa larga y el Shabat.' },
      cocina: { nombre: 'La cocina', corto: 'Cocina', que: 'Lo que termina en la mesa.' },
      cowork: { nombre: 'El cowork', corto: 'Cowork', que: 'Wifi, escritorio y café.' },
      clase: { nombre: 'El garage', corto: 'Garage', que: 'Los autos, y también yoga.' },
      banda: { nombre: 'La terraza', corto: 'Terraza', que: 'Música y la ciudad abajo.' },
      parrilla: { nombre: 'El fondo', corto: 'Fondo', que: 'La pileta y el quincho.' },
    },
    secciones: {
      quienes: {
        kicker: 'Casa Malka · Comunidad Amijai',
        titulo: 'Esto es Malka',
        entrada: 'Una casa abierta donde siempre hay un mate esperándote.',
        texto:
          'Si buscás un lugar donde sentirte parte, acá lo tenés. Nos juntamos a charlar, aprender, comer y armar cosas entre todos. Para sumarte, alcanza con anotarte.',
      },
      propuestas: {
        kicker: 'Muchas puertas',
        titulo: 'Lo que se puede hacer acá',
        entrada: 'Cada uno vive su propio judaísmo.',
        texto:
          'Por eso Malka tiene muchas puertas, y cada una te lleva a experiencias sociales, culturales y espirituales distintas. La agenda cambia todas las semanas y vive adentro.',
      },
      sauna: { kicker: 'Sauna Sessions', titulo: 'Sí, también hay sauna', entrada: 'Y jacuzzi.' },
    },
    propuestas: {
      judaismo: 'Judaísmo',
      actividades: 'Actividades',
      coworking: 'Coworking',
      asaditos: 'Asaditos',
      huerta: 'Huerta',
      musica: 'Música',
    },
    preguntas: [
      {
        pregunta: '¿Puedo sumarme aunque sepa poco de judaísmo?',
        respuesta: '¡Claro! Vení con tus preguntas y ganas de compartir.',
      },
      {
        pregunta: '¿Puedo ir aunque no conozca a nadie?',
        respuesta: '¡Sí! Te esperamos para que empieces a sentirte en casa.',
      },
      {
        pregunta: '¿Tengo que inscribirme antes de ir?',
        respuesta: 'Sí, anotate en cada actividad para que podamos recibirte.',
      },
      {
        pregunta: '¿Las actividades tienen costo?',
        respuesta: 'Algunas son gratuitas y otras aranceladas. Siempre requieren inscripción.',
      },
      {
        pregunta: '¿A qué se destina lo recaudado?',
        respuesta: 'A sostener Malka y seguir construyendo esta casa juntos.',
      },
    ],
    roles: { direccion: 'Dirección', asistente: 'Asistente de Dirección' },
    contacto: {
      donde: 'Dónde',
      cuando: 'Cuándo',
      horario: 'Lunes a viernes, de 14 a 21',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      mail: 'Mail',
      creada: 'Creada por',
      amijai: 'Comunidad Amijai',
    },
    indice: {
      quienes: 'Quiénes somos',
      propuestas: 'Propuestas',
      sauna: 'Sauna Sessions',
      staff: 'El equipo',
      sumate: 'Sumate',
    },
    ui: {
      principal: 'Principal',
      idioma: 'Idioma',
      iniciarSesion: 'Iniciar sesión',
      registrate: 'Registrate',
      abrirMenu: 'Abrir menú',
      cerrarMenu: 'Cerrar menú',
      verCasa: 'Ver la casa por dentro',
      ingresar: 'Ingresar',
      secciones: 'Secciones',
      casaPorDentro: 'La casa por dentro',
      cerrar: 'Cerrar',
      todaLaCasa: 'Toda la casa',
      elegiEspacio: 'Elegí un espacio y te lo muestro por dentro.',
      h1: 'Una casa para compartir nuestra espiritualidad judía.',
      datos: ['18 a 35 años', 'Lunes a viernes', '3 de Febrero 1325'],
      conoce: 'Conocé la casa',
      entra: 'Entrá a tu casa',
      anotarme: 'Anotarme',
      tocaEspacio: 'Tocá un espacio y la casa te lo muestra',
      faq: 'Preguntas frecuentes',
      staffKicker: 'Quiénes te reciben',
      staffTitulo: 'Te esperamos con una sonrisa',
      staffTexto:
        'Alguien de nuestro staff te va a estar esperando. Si es tu primera vez, avisanos y te mostramos la casa. A la mayoría los vas a encontrar arriba, en la terraza, cuando hay música.',
      sumateTitulo: 'Vení a conocer Malka',
      sumateEntrada: 'Te esperamos en la casa.',
      sumateTexto:
        'Te anotás una vez en la app y desde ahí ves la agenda con todas las actividades y te inscribís a las que quieras.',
    },
  },

  en: {
    titulo: 'Malka — A house to share our Jewish spirituality',
    espacios: {
      mesa: { nombre: 'The hall', corto: 'Hall', que: 'The long table and Shabbat.' },
      cocina: { nombre: 'The kitchen', corto: 'Kitchen', que: 'Where the table gets filled.' },
      cowork: { nombre: 'The cowork', corto: 'Cowork', que: 'Wi-fi, a desk and coffee.' },
      clase: { nombre: 'The garage', corto: 'Garage', que: 'The cars, and yoga too.' },
      banda: { nombre: 'The rooftop', corto: 'Rooftop', que: 'Music and the city below.' },
      parrilla: { nombre: 'The backyard', corto: 'Backyard', que: 'The pool and the grill.' },
    },
    secciones: {
      quienes: {
        kicker: 'Casa Malka · Amijai Community',
        titulo: 'This is Malka',
        entrada: 'An open house where there’s always a mate waiting for you.',
        texto:
          'If you’re looking for a place where you belong, you found it. We get together to talk, learn, eat and make things happen together. To join, all you have to do is sign up.',
      },
      propuestas: {
        kicker: 'Many doors',
        titulo: 'What you can do here',
        entrada: 'Everyone lives their own Judaism.',
        texto:
          'That’s why Malka has many doors, and each one leads to different social, cultural and spiritual experiences. The schedule changes every week and lives inside the app.',
      },
      sauna: { kicker: 'Sauna Sessions', titulo: 'Yes, there’s a sauna too', entrada: 'And a jacuzzi.' },
    },
    propuestas: {
      judaismo: 'Judaism',
      actividades: 'Activities',
      coworking: 'Coworking',
      asaditos: 'Barbecues',
      huerta: 'Garden',
      musica: 'Music',
    },
    preguntas: [
      {
        pregunta: 'Can I join if I don’t know much about Judaism?',
        respuesta: 'Of course! Bring your questions and the will to share.',
      },
      {
        pregunta: 'Can I come even if I don’t know anyone?',
        respuesta: 'Yes! We’re waiting for you so you can start feeling at home.',
      },
      {
        pregunta: 'Do I have to sign up before coming?',
        respuesta: 'Yes, sign up for each activity so we can welcome you.',
      },
      {
        pregunta: 'Do the activities cost anything?',
        respuesta: 'Some are free and some are paid. They always require signing up.',
      },
      {
        pregunta: 'Where does the money go?',
        respuesta: 'To keep Malka going and to keep building this house together.',
      },
    ],
    roles: { direccion: 'Leadership', asistente: 'Leadership Assistant' },
    contacto: {
      donde: 'Where',
      cuando: 'When',
      horario: 'Monday to Friday, 2 to 9 pm',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      mail: 'Email',
      creada: 'Created by',
      amijai: 'Comunidad Amijai',
    },
    indice: {
      quienes: 'About us',
      propuestas: 'What we do',
      sauna: 'Sauna Sessions',
      staff: 'The team',
      sumate: 'Join',
    },
    ui: {
      principal: 'Main',
      idioma: 'Language',
      iniciarSesion: 'Log in',
      registrate: 'Sign up',
      abrirMenu: 'Open menu',
      cerrarMenu: 'Close menu',
      verCasa: 'See inside the house',
      ingresar: 'Log in',
      secciones: 'Sections',
      casaPorDentro: 'Inside the house',
      cerrar: 'Close',
      todaLaCasa: 'The whole house',
      elegiEspacio: 'Pick a space and we’ll show you inside.',
      h1: 'A house to share our Jewish spirituality.',
      datos: ['Ages 18 to 35', 'Monday to Friday', '3 de Febrero 1325'],
      conoce: 'Explore the house',
      entra: 'Come on in',
      anotarme: 'Sign up',
      tocaEspacio: 'Tap a space and the house shows it to you',
      faq: 'Frequently asked questions',
      staffKicker: 'Who welcomes you',
      staffTitulo: 'We’ll greet you with a smile',
      staffTexto:
        'Someone from our staff will be waiting for you. If it’s your first time, let us know and we’ll show you around. You’ll find most of them upstairs, on the rooftop, when there’s music.',
      sumateTitulo: 'Come meet Malka',
      sumateEntrada: 'We’ll be waiting for you at the house.',
      sumateTexto:
        'Sign up once in the app and from there you’ll see the schedule with every activity and join the ones you like.',
    },
  },

  he: {
    titulo: 'מלכה — בית לחלוק בו את הרוחניות היהודית שלנו',
    espacios: {
      mesa: { nombre: 'הסלון', corto: 'סלון', que: 'השולחן הארוך והשבת.' },
      cocina: { nombre: 'המטבח', corto: 'מטבח', que: 'מה שמגיע לשולחן.' },
      cowork: { nombre: 'חלל העבודה', corto: 'עבודה', que: 'וויפיי, שולחן וקפה.' },
      clase: { nombre: 'החניה', corto: 'חניה', que: 'המכוניות, וגם יוגה.' },
      banda: { nombre: 'הגג', corto: 'גג', que: 'מוזיקה והעיר למטה.' },
      parrilla: { nombre: 'החצר', corto: 'חצר', que: 'הבריכה והמנגל.' },
    },
    secciones: {
      quienes: {
        kicker: 'בית מלכה · קהילת אמיג׳אי',
        titulo: 'זו מלכה',
        entrada: 'בית פתוח שבו תמיד מחכה לכם מאטה.',
        texto:
          'מחפשים מקום שבו תרגישו שייכים? הגעתם. אנחנו נפגשים לדבר, ללמוד, לאכול וליצור דברים ביחד. כדי להצטרף, מספיק להירשם.',
      },
      propuestas: {
        kicker: 'הרבה דלתות',
        titulo: 'מה אפשר לעשות כאן',
        entrada: 'כל אחד חי את היהדות שלו.',
        texto:
          'בגלל זה למלכה יש הרבה דלתות, וכל אחת מובילה לחוויות חברתיות, תרבותיות ורוחניות אחרות. הלו״ז משתנה כל שבוע ונמצא באפליקציה.',
      },
      sauna: { kicker: 'Sauna Sessions', titulo: 'כן, יש גם סאונה', entrada: 'וגם ג׳קוזי.' },
    },
    propuestas: {
      judaismo: 'יהדות',
      actividades: 'פעילויות',
      coworking: 'עבודה משותפת',
      asaditos: 'על האש',
      huerta: 'גינה',
      musica: 'מוזיקה',
    },
    preguntas: [
      {
        pregunta: 'אפשר להצטרף גם בלי לדעת הרבה על יהדות?',
        respuesta: 'בטח! בואו עם השאלות שלכם והרצון לחלוק.',
      },
      {
        pregunta: 'אפשר להגיע גם בלי להכיר אף אחד?',
        respuesta: 'כן! מחכים לכם כדי שתתחילו להרגיש בבית.',
      },
      {
        pregunta: 'צריך להירשם לפני שמגיעים?',
        respuesta: 'כן, נרשמים לכל פעילות כדי שנוכל לקבל אתכם.',
      },
      {
        pregunta: 'יש עלות לפעילויות?',
        respuesta: 'חלקן בחינם וחלקן בתשלום. תמיד צריך להירשם.',
      },
      {
        pregunta: 'לאן הולך הכסף שנאסף?',
        respuesta: 'לקיים את מלכה ולהמשיך לבנות את הבית הזה ביחד.',
      },
    ],
    roles: { direccion: 'הנהלה', asistente: 'עוזרת הנהלה' },
    contacto: {
      donde: 'איפה',
      cuando: 'מתי',
      horario: 'שני עד שישי, בין 14:00 ל־21:00',
      whatsapp: 'וואטסאפ',
      instagram: 'אינסטגרם',
      mail: 'מייל',
      creada: 'הוקם על ידי',
      amijai: 'קהילת אמיג׳אי',
    },
    indice: {
      quienes: 'מי אנחנו',
      propuestas: 'מה יש',
      sauna: 'Sauna Sessions',
      staff: 'הצוות',
      sumate: 'הצטרפו',
    },
    ui: {
      principal: 'ראשי',
      idioma: 'שפה',
      iniciarSesion: 'כניסה',
      registrate: 'הרשמה',
      abrirMenu: 'פתיחת תפריט',
      cerrarMenu: 'סגירת תפריט',
      verCasa: 'לראות את הבית מבפנים',
      ingresar: 'כניסה',
      secciones: 'חלקים',
      casaPorDentro: 'הבית מבפנים',
      cerrar: 'סגירה',
      todaLaCasa: 'כל הבית',
      elegiEspacio: 'בחרו חלל ונראה לכם אותו מבפנים.',
      h1: 'בית לחלוק בו את הרוחניות היהודית שלנו.',
      datos: ['גילאי 18 עד 35', 'שני עד שישי', '3 de Febrero 1325'],
      conoce: 'הכירו את הבית',
      entra: 'היכנסו הביתה',
      anotarme: 'להרשמה',
      tocaEspacio: 'לחצו על חלל והבית יראה לכם אותו',
      faq: 'שאלות נפוצות',
      staffKicker: 'מי מקבל אתכם',
      staffTitulo: 'מחכים לכם עם חיוך',
      staffTexto:
        'מישהו מהצוות שלנו יחכה לכם. אם זו הפעם הראשונה, ספרו לנו ונראה לכם את הבית. את רובם תמצאו למעלה, על הגג, כשיש מוזיקה.',
      sumateTitulo: 'בואו להכיר את מלכה',
      sumateEntrada: 'מחכים לכם בבית.',
      sumateTexto: 'נרשמים פעם אחת באפליקציה, ומשם רואים את הלו״ז עם כל הפעילויות ונרשמים למה שבא לכם.',
    },
  },
};
