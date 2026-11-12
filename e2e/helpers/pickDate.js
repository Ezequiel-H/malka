/**
 * Elige una fecha en un DatePicker del design system.
 *
 * No es un `<input type="date">`: es un botón que abre un calendario en un
 * portal, así que no se puede `fill()`. Se recorre como lo haría una persona —
 * abrir, dos toques en el título para llegar a los años, año, mes, día.
 *
 *   await pickDate(page, 'Fecha de nacimiento', '1990-05-15');
 */
export async function pickDate(page, etiqueta, iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);

  await page.getByLabel(etiqueta).click();

  /* Por atributo y posición, no por texto: así anda en cualquier idioma. Los
     tres primeros botones son anterior, título y siguiente. */
  const calendario = page.locator('[data-calendario]');
  await calendario.waitFor();

  // El título cicla días → meses → años.
  const titulo = calendario.getByRole('button').nth(1);
  await titulo.click();
  await titulo.click();

  // La grilla muestra 12 años por vez: se retrocede hasta encontrar el buscado.
  for (let intento = 0; intento < 20; intento += 1) {
    const celda = calendario.getByRole('button', { name: String(anio), exact: true });
    if (await celda.count()) {
      await celda.click();
      break;
    }
    const desde = Number((await titulo.textContent()).slice(0, 4));
    await calendario.getByRole('button').nth(anio < desde ? 0 : 2).click();
  }

  await calendario.getByRole('button').nth(3 + mes - 1).click();
  await calendario.getByRole('button', { name: String(dia), exact: true }).click();
}
