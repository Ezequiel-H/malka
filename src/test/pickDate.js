import { screen, within } from '@testing-library/react';

// Los mismos que pinta Calendar: DEFAULT_MONTHS recortado a 3 letras.
const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/**
 * Elige una fecha en un DatePicker del design system.
 *
 * El DatePicker no es un `<input type="date">`: es un botón que abre un
 * calendario en un portal, así que un `user.type()` no sirve. Este helper hace
 * el recorrido que haría una persona — abrir, ir a la vista de años, año, mes,
 * día — y existe para que cada test no lo repita.
 *
 *   await pickDate(user, 'Fecha de nacimiento', '1985-03-20');
 */
export const pickDate = async (user, etiqueta, iso) => {
  const [anio, mes, dia] = iso.split('-').map(Number);

  await user.click(screen.getByLabelText(etiqueta));

  const calendario = await screen.findByRole('dialog', { name: 'Calendario' });

  // El título cicla días → meses → años. Dos toques y estamos eligiendo año.
  const titulo = () => within(calendario).getAllByRole('button')[1];
  await user.click(titulo());
  await user.click(titulo());

  // La grilla muestra 12 años por década: se navega hasta que aparezca el buscado.
  for (let intento = 0; intento < 20; intento += 1) {
    const celda = within(calendario).queryByRole('button', { name: String(anio) });
    if (celda) {
      await user.click(celda);
      break;
    }
    const direccion = anio < Number(titulo().textContent.slice(0, 4)) ? 'Anterior' : 'Siguiente';
    await user.click(within(calendario).getByRole('button', { name: direccion }));
  }

  await user.click(within(calendario).getByRole('button', { name: MESES_CORTOS[mes - 1] }));
  await user.click(within(calendario).getByRole('button', { name: String(dia) }));
};
