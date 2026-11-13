/**
 * Los países para elegir nacionalidad. Se guarda el código ISO (AR, IL…) y
 * el nombre lo arma el navegador en el idioma de la pantalla, así la lista
 * sirve igual en castellano, inglés o hebreo.
 */
const CODIGOS = 'AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'.split(' ');

/* Los que más se eligen en Malka van primero. */
const PRIMEROS = ['AR', 'IL', 'UY', 'BR', 'US', 'ES'];

export const opcionesPaises = (idioma = 'es') => {
  let nombres;
  try {
    nombres = new Intl.DisplayNames([idioma], { type: 'region' });
  } catch {
    nombres = { of: (c) => c };
  }
  const opcion = (value) => ({ value, label: nombres.of(value) ?? value });
  const resto = CODIGOS.filter((c) => !PRIMEROS.includes(c))
    .map(opcion)
    .sort((a, b) => a.label.localeCompare(b.label, idioma));
  return [...PRIMEROS.map(opcion), ...resto];
};

export const nombrePais = (codigo, idioma = 'es') => {
  if (!codigo) return '';
  try {
    return new Intl.DisplayNames([idioma], { type: 'region' }).of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
};

export const RESIDENCIAS = [
  { value: 'buenos_aires', label: 'En Buenos Aires (CABA o GBA)' },
  { value: 'argentina', label: 'En otra ciudad de Argentina' },
  { value: 'exterior', label: 'En otro país' },
];

export const etiquetaResidencia = (valor) => RESIDENCIAS.find((r) => r.value === valor)?.label ?? '';
