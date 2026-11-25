import { Link } from 'react-router-dom';

import data from '../../content/apologetica/adventismo-preguntas.json';
import clavesData from '../../content/apologetica/adventismo-claves.json';
import doctrina from '../../content/apologetica/adventismo-doctrina.json';
import ApologeticaFasciculo from './ApologeticaFasciculo';

/*
 * «Adventismo: 100 preguntas, solo con la Biblia» (/apologetica/adventismo).
 * Datos generados con `node scripts/build-apologetica.mjs --write`.
 */
const ESTUDIO_ADVENTISMO = '/estudio/06-apologetica--origenes-usa--03-adventismo';
const ESTUDIO_JUDAIZANTES = '/estudio/06-apologetica--judaizantes';

const COPY = {
  eyebrow: 'Para miembros y estudiantes adventistas',
  h1Line1: '100 preguntas,',
  h1Line2: 'solo con la Biblia',
  lead:
    'El adventismo afirma sostenerse en «la Biblia y solo la Biblia». Aquí tienes 100 preguntas directas en 10 temas —del sábado y el Día del Señor al santuario celestial, 1844, Azazel, el remanente, la inmortalidad condicional, el don profético y la cristología— leídas en el griego del Codex Sinaiticus y en español, junto al examen de sus publicaciones oficiales y el testimonio de los Padres de la Iglesia.',
  step1: 'Son 100, en 10 temas. No hace falta hacerlas todas: elige un tema y ve despacio.',
  tabPreguntas: '100 preguntas con la Biblia',
  tabDoctrina: '¿Qué cree el Adventismo?',
  bereaExtra: (
    <p className="scj-berea">
      Si quieres profundizar en el contexto histórico de 1844, Elena G. de White, la patrística sobre el Día del Señor y
      la refutación detallada de argumentos sabatistas, lee nuestros estudios{' '}
      <Link to={ESTUDIO_ADVENTISMO}>Adventismo — Miller, 1844 y Ellen G. White</Link> y{' '}
      <Link to={ESTUDIO_JUDAIZANTES}>Judaizantes — El sábado, la Ley y el Día del Señor</Link>, y consulta la{' '}
      <Link to="/biblia">Biblia Patrística</Link>.
    </p>
  ),
  fuenteExtra: (
    <p>
      <strong>Contexto histórico y patrístico:</strong> puedes ampliar el examen de 1844, el argumento de Constantino y
      Laodicea, y las fuentes de los primeros siglos en{' '}
      <Link to={ESTUDIO_ADVENTISMO}>Adventismo — Miller, 1844 y Ellen G. White</Link>,{' '}
      <Link to={ESTUDIO_JUDAIZANTES}>Judaizantes</Link> y la <Link to="/biblia">Biblia Patrística</Link>.
    </p>
  ),
  libroCredito: (
    <p>
      <strong>Fuentes doctrinales e históricas:</strong>{' '}
      <em>Creencias de los Adventistas del Séptimo Día</em> (Asociación Ministerial IASD / ACES, 2007),{' '}
      <em>Manual de la Iglesia</em> (10.ª ed., 2025), Elena G. de White (<em>El conflicto de los siglos</em>),{' '}
      <em>Los adventistas del séptimo día responden a preguntas sobre doctrina</em> (1957; ed. anotada de George R.
      Knight, 2008), LeRoy E. Froom (<em>Movement of Destiny</em>, 1971) y testimonios patrísticos recogidos en nuestra{' '}
      <Link to="/biblia">Biblia Patrística</Link> (traducciones propias de Crux cuando el original está en inglés).
    </p>
  ),
  credosCredito: (
    <p>
      <strong>Credos y confesiones históricas:</strong> Símbolo de los Apóstoles, Credo Niceno-Constantinopolitano (381),
      Definición de Calcedonia (451), Confesión de Augsburgo (1530), Catecismo de Heidelberg (1563), Confesión Belga
      (1561) y Confesión de Fe de Westminster (1647), citados según sus artículos públicos.
    </p>
  )
};

export default function Adventismo() {
  return (
    <ApologeticaFasciculo
      slug="adventismo"
      data={data}
      clavesData={clavesData}
      doctrina={doctrina}
      copy={COPY}
    />
  );
}
