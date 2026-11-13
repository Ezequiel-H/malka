/**
 * Mensaje de validación nativa en castellano.
 *
 * Sin esto el navegador antepone su texto en el idioma del sistema
 * ("Please match the requested format...") al `title` del input y el globo
 * queda mitad inglés. `setCustomValidity` lo reemplaza por completo; se
 * limpia en cada input para que el campo pueda volver a ser válido.
 */
export const invalidEs = (mensaje) => ({
  onInvalid: (e) => e.target.setCustomValidity(mensaje),
  onInput: (e) => e.target.setCustomValidity(''),
});
