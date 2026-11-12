/**
 * Textos de la plataforma en castellano (el idioma base: si falta una clave en otro idioma, se usa esta).
 * Agrupados por pantalla. No se traduce lo que carga el equipo (títulos y
 * descripciones de actividades, tags, plantillas) ni los errores del back.
 */
const textos = {
  "avisoPush": {
    "titulo": "Activá las notificaciones",
    "activar": "Activar",
    "texto": "Te avisamos cuando haya actividades nuevas, el día de las que te puedan interesar y cuando cambie tu inscripción.",
    "listo": "Listo, te vamos a avisar por acá",
    "error": "No se pudieron activar las notificaciones"
  },
  "bienvenida": {
    "titulo": "Te damos la bienvenida, {nombre}",
    "validandoTitulo": "Tu usuario está siendo validado",
    "misIntereses": "Mis intereses",
    "validandoTexto": "Tu cuenta está siendo validada por nuestro equipo. Este proceso puede tardar unos días. Una vez aprobada, vas a poder inscribirte en las actividades."
  },
  "comun": {
    "idioma": "Idioma",
    "volver": "Volver",
    "guardar": "Guardar",
    "guardando": "Guardando...",
    "cancelar": "Cancelar",
    "cerrar": "Cerrar",
    "gratis": "Gratis",
    "salir": "Salir",
    "cargando": "Cargando..."
  },
  "error": {
    "titulo": "Algo salió mal en esta pantalla",
    "recargar": "Recargar",
    "inicio": "Ir al inicio",
    "texto": "El resto del sistema sigue funcionando — probá recargar, o navegá a otra sección desde el menú."
  },
  "fechaNacimiento": {
    "titulo": "Completá tu fecha de nacimiento",
    "texto": "Necesitamos esta información para completar tu perfil. Solo tenés que ingresarla una vez.",
    "campo": "Fecha de nacimiento",
    "guardada": "Fecha de nacimiento guardada",
    "error": "No se pudo guardar la fecha de nacimiento"
  },
  "instalar": {
    "titulo": "Instalá Malka en tu teléfono",
    "instalar": "Instalar",
    "verComo": "Ver cómo",
    "texto": "La abrís desde un ícono propio, a pantalla completa.",
    "iosTitulo": "Instalar en iPhone o iPad",
    "listo": "Listo",
    "paso1": "Abrí Malka en Safari.",
    "paso2": "Tocá el botón Compartir (el cuadrado con la flecha hacia arriba).",
    "paso3": "Elegí \"Agregar a pantalla de inicio\".",
    "paso4": "Confirmá con \"Agregar\"."
  },
  "login": {
    "titulo": "Iniciar sesión",
    "subtitulo": "El punto de encuentro para tu identidad judía",
    "email": "Email",
    "contrasena": "Contraseña",
    "entrar": "Iniciar sesión",
    "entrando": "Iniciando sesión...",
    "sinCuenta": "¿No tenés cuenta?",
    "registrate": "Registrate aquí",
    "casaAbierta": "Casa abierta para la comunidad"
  },
  "notificaciones": {
    "titulo": "Notificaciones",
    "activadas": "Notificaciones activadas en este dispositivo",
    "desactivadas": "Notificaciones desactivadas en este dispositivo",
    "error": "No se pudo cambiar la configuración",
    "instalar": "En iPhone y iPad las notificaciones llegan sólo con la app instalada: abrí Malka en Safari, tocá Compartir y elegí «Agregar a pantalla de inicio». Después activalas desde acá.",
    "noSoporta": "Este navegador no puede recibir notificaciones.",
    "bloqueadas": "Las notificaciones están bloqueadas para Malka en este navegador. Para recibirlas, habilitalas desde la configuración del sitio (el candado al lado de la dirección).",
    "recibir": "Recibir notificaciones en este dispositivo",
    "queLlega": "Actividades nuevas, recordatorio el día de una actividad a la que no te anotaste y cambios en tus inscripciones (los mismos avisos que te llegan por mail)."
  },
  "registro": {
    "titulo": "Registro",
    "nombre": "Nombre",
    "apellido": "Apellido",
    "fechaNacimiento": "Fecha de nacimiento",
    "nacionalidad": "Nacionalidad",
    "elegiPais": "Elegí un país",
    "dondeVivis": "¿Dónde vivís?",
    "residencias": {
      "buenos_aires": "En Buenos Aires (CABA o GBA)",
      "argentina": "En otra ciudad de Argentina",
      "exterior": "En otro país"
    },
    "ciudad": "¿En qué ciudad?",
    "avisoWhatsapp": "Después de registrarte te vamos a pedir unos datos más por WhatsApp para terminar el registro.",
    "dni": "DNI",
    "dniAyuda": "Entre 7 y 10 dígitos, sin puntos",
    "dniInvalido": "Ingresá entre 7 y 10 dígitos",
    "email": "Email",
    "telefono": "Teléfono",
    "telefonoAyuda": "Al menos 8 dígitos. Podés incluir + y código de país",
    "telefonoInvalido": "Ingresá un teléfono con al menos 8 dígitos (podés usar + y código de país)",
    "contrasena": "Contraseña",
    "contrasenaAyuda": "Mínimo 6 caracteres",
    "restriccionesPregunta": "Toda la comida es Kosher. ¿Tenés algún tipo de restricción?",
    "restricciones": {
      "vegetariano": "Vegetariano",
      "vegano": "Vegano",
      "sinTacc": "Sin TACC",
      "sinLactosa": "Sin lactosa",
      "sinNueces": "Sin nueces",
      "diabetico": "Diabético"
    },
    "comoTeEnteraste": "¿Cómo te enteraste de esta propuesta?",
    "comoTeEnterastePlaceholder": "Escribí cómo te enteraste...",
    "intereses": "¿Qué te interesa?",
    "interesesAyuda": "Elegí una o más áreas. Podés cambiarlas después en «Mis intereses».",
    "cargandoIntereses": "Cargando intereses...",
    "sinIntereses": "Si no aparecen opciones, podés completar tus intereses luego desde tu cuenta.",
    "registrarse": "Registrarse",
    "registrando": "Registrando...",
    "yaTenesCuenta": "¿Ya tenés cuenta?",
    "iniciaSesion": "Iniciá sesión aquí",
    "faltaFecha": "Decinos tu fecha de nacimiento para completar el registro.",
    "faltaResidencia": "Contanos tu nacionalidad y dónde vivís."
  },
  "shell": {
    "principal": "Principal",
    "secciones": "Secciones",
    "irAlInicio": "Ir al inicio",
    "expandir": "Expandir menú",
    "colapsar": "Colapsar menú",
    "links": {
      "actividades": "Actividades",
      "inscripciones": "Mis inscripciones",
      "intereses": "Mis intereses",
      "perfil": "Mi perfil"
    },
    "tabs": {
      "actividades": "Cartelera",
      "inscripciones": "Inscripciones",
      "intereses": "Intereses",
      "perfil": "Perfil"
    }
  },
  "ui": {
    "diasCortos": [
      "Lu",
      "Ma",
      "Mi",
      "Ju",
      "Vi",
      "Sá",
      "Do"
    ],
    "meses": [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre"
    ],
    "mesesCortos": [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic"
    ],
    "anterior": "Anterior",
    "siguiente": "Siguiente",
    "calendario": "Calendario",
    "elegiFecha": "Elegí una fecha",
    "limpiarFecha": "Limpiar fecha",
    "seleccionar": "Seleccionar...",
    "sinResultados": "Sin resultados",
    "limpiarSeleccion": "Limpiar selección",
    "buscar": "Buscar...",
    "buscarOpcion": "Buscar opción",
    "cerrar": "Cerrar",
    "mostrarContrasena": "Mostrar contraseña",
    "ocultarContrasena": "Ocultar contraseña",
    "tablaDeDatos": "Tabla de datos",
    "cargando": "Cargando",
    "confirmarTitulo": "¿Confirmás la acción?",
    "confirmar": "Confirmar",
    "cancelar": "Cancelar",
    "opcional": "Opcional"
  },
  "whatsappRegistro": {
    "titulo": "Terminá tu registro por WhatsApp",
    "boton": "Escribirnos",
    "texto": "Como no vivís en Buenos Aires, necesitamos pedirte unos datos más. Escribinos por WhatsApp y te contamos qué falta."
  }
};

export default textos;
