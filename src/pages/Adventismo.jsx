import { Link } from 'react-router-dom';

import data from '../../content/apologetica/adventismo-preguntas.json';
import clavesData from '../../content/apologetica/adventismo-claves.json';
import ApologeticaFasciculo from './ApologeticaFasciculo';

/*
 * «Adventismo: 50 preguntas, solo con la Biblia» (/apologetica/adventismo).
 * Datos generados con `node scripts/build-apologetica.mjs --write`.
 */
const ESTUDIO_ADVENTISMO = '/estudio/06-apologetica--origenes-usa--03-adventismo';

const COPY = {
  eyebrow: 'Para miembros y estudiantes adventistas',
  h1Line1: '50 preguntas,',
  h1Line2: 'solo con la Biblia',
  lead:
    'El adventismo afirma sostenerse en «la Biblia y solo la Biblia». Aquí tienes 50 preguntas directas sobre el sábado, la ley, 1844, el juicio investigador, el estado intermedio y el don profético: léelas en el griego del Codex Sinaiticus y en español, sin recortes.',
  step1: 'Son 50, en 6 temas. No hace falta hacerlas todas: elige un tema y ve despacio.',
  bereaExtra: (
    <p className="scj-berea">
      Si quieres conocer además el contexto histórico de 1844 y Ellen G. White, lee nuestro estudio{' '}
      <Link to={ESTUDIO_ADVENTISMO}>Adventismo — Miller, 1844 y Ellen G. White</Link>.
    </p>
  ),
  fuenteExtra: (
    <p>
      <strong>Contexto histórico:</strong> puedes ampliar la revisión histórica de 1844 y las fuentes primarias en el
      estudio <Link to={ESTUDIO_ADVENTISMO}>Adventismo — Miller, 1844 y Ellen G. White</Link>.
    </p>
  )
};

export default function Adventismo() {
  return (
    <ApologeticaFasciculo
      slug="adventismo"
      data={data}
      clavesData={clavesData}
      doctrina={null}
      copy={COPY}
    />
  );
}
