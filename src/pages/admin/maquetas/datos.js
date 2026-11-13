/**
 * Datos inventados para las maquetas del rediseño. No son personas reales:
 * las maquetas se muestran al cliente y se sacan capturas.
 */
export const PERSONAS = [
  ['Tamar', 'Levin', '+54 9 11 5555-0101', 'Vegetariana'],
  ['Ilan', 'Roitman', '+54 9 11 5555-0102', ''],
  ['Noa', 'Feld', '+54 9 11 5555-0103', 'Sin TACC'],
  ['Uri', 'Kaplan', '+54 9 11 5555-0104', ''],
  ['Maia', 'Stern', '+54 9 11 5555-0105', 'Vegana'],
  ['Gael', 'Berman', '+54 9 11 5555-0106', ''],
  ['Yael', 'Rubin', '+54 9 11 5555-0107', 'Sin lactosa'],
  ['Dan', 'Weiss', '+54 9 11 5555-0108', ''],
  ['Sol', 'Mendel', '+54 9 11 5555-0109', ''],
  ['Ariel', 'Gold', '+54 9 11 5555-0110', 'Vegetariano'],
  ['Lior', 'Katz', '+54 9 11 5555-0111', ''],
  ['Dana', 'Frid', '+54 9 11 5555-0112', ''],
].map(([nombre, apellido, telefono, restricciones], i) => ({
  id: i + 1,
  nombre,
  apellido,
  telefono,
  email: `${nombre}.${apellido}@ejemplo.com`.toLowerCase(),
  restricciones,
  edad: 22 + ((i * 7) % 13),
  estado: i < 9 ? 'aceptada' : i < 11 ? 'pendiente' : 'en_espera',
  pago: i % 3 === 0 ? 'aprobado' : i % 3 === 1 ? 'pendiente' : null,
  tags: [['espiritualidad'], ['cocina', 'música'], ['bienestar'], ['espiritualidad', 'cocina']][i % 4],
}));

/* Los colores de las propuestas salen de los tags (los carga el equipo). */
export const PROPUESTAS = {
  espiritualidad: { color: '#b0567a', icono: 'flame' },
  cocina: { color: '#c98a1e', icono: 'chef' },
  bienestar: { color: '#689b78', icono: 'leaf' },
  música: { color: '#7c5cbf', icono: 'music' },
  arte: { color: '#c4453c', icono: 'color' },
  viajes: { color: '#3d7d99', icono: 'plane' },
};

export const ACTIVIDADES = [
  { id: 'a1', titulo: 'Kabbalat Shabbat', propuesta: 'espiritualidad', cuando: 'Todos los viernes · 20:30', dia: 4, hora: '20:30', proxima: 'vie 15 nov', inscriptos: 34, cupo: 40, precio: 12000, estado: 'publicada', espera: 3, pendientes: 2 },
  { id: 'a2', titulo: 'Kundalini Yoga', propuesta: 'bienestar', cuando: 'Todos los martes · 19:00', dia: 1, hora: '19:00', proxima: 'mar 19 nov', inscriptos: 11, cupo: 20, precio: 0, estado: 'publicada', espera: 0, pendientes: 0 },
  { id: 'a3', titulo: 'Shiur con el Rab', propuesta: 'espiritualidad', cuando: 'Todos los miércoles · 20:00', dia: 2, hora: '20:00', proxima: 'mié 20 nov', inscriptos: 9, cupo: null, precio: 0, estado: 'publicada', espera: 0, pendientes: 1 },
  { id: 'a4', titulo: 'Taller de cerámica', propuesta: 'arte', cuando: 'Todos los jueves · 18:00', dia: 3, hora: '18:00', proxima: 'jue 14 nov', inscriptos: 8, cupo: 8, precio: 9000, estado: 'publicada', espera: 4, pendientes: 0 },
  { id: 'a5', titulo: 'Cocina israelí', propuesta: 'cocina', cuando: 'Sáb 23 nov · 11:00', dia: 5, hora: '11:00', proxima: 'sáb 23 nov', inscriptos: 12, cupo: 16, precio: 8000, estado: 'publicada', espera: 0, pendientes: 3 },
  { id: 'a6', titulo: 'Noche de música en vivo', propuesta: 'música', cuando: 'Jue 28 nov · 21:00', dia: 3, hora: '21:00', proxima: 'jue 28 nov', inscriptos: 22, cupo: 60, precio: 0, estado: 'publicada', espera: 0, pendientes: 0 },
  { id: 'a7', titulo: 'Viaje de Shabat a Bariloche', propuesta: 'viajes', cuando: 'Del 6 al 8 de dic', dia: null, hora: null, proxima: 'vie 6 dic', inscriptos: 18, cupo: 25, precio: 850000, estado: 'borrador', espera: 0, pendientes: 5 },
];

export const ENCUENTROS = [
  { fecha: 'vie 15 nov', personas: 34, proximo: true },
  { fecha: 'vie 8 nov', personas: 31 },
  { fecha: 'vie 1 nov', personas: 36 },
  { fecha: 'vie 25 oct', personas: 29 },
];

export const SEMANA = [
  { mes: 'jun', personas: 128, nuevas: 40 },
  { mes: 'jul', personas: 51, nuevas: 3 },
  { mes: 'ago', personas: 65, nuevas: 16 },
  { mes: 'sep', personas: 218, nuevas: 47 },
  { mes: 'oct', personas: 111, nuevas: 33 },
  { mes: 'nov', personas: 94, nuevas: 21 },
];
