import data from '../../content/apologetica/dispensacionalismo-preguntas.json';
import clavesData from '../../content/apologetica/dispensacionalismo-claves.json';
import doctrina from '../../content/apologetica/dispensacionalismo-doctrina.json';
import ApologeticaFasciculo from './ApologeticaFasciculo';

/*
 * «Dispensacionalismo: 50 preguntas, solo con la Biblia» (/apologetica/dispensacionalismo).
 * Datos generados con `node scripts/build-apologetica.mjs --write` y citas verificadas
 * de J. Dwight Pentecost, *Eventos del Porvenir* (Editorial Vida).
 */
const COPY = {
  eyebrow: 'Para hermanos y estudiantes dispensacionalistas',
  h1Line1: '50 preguntas,',
  h1Line2: 'solo con la Biblia',
  lead:
    '¿Enseña el Nuevo Testamento dos pueblos de Dios separados, un rapto secreto previo a la tribulación y un retorno a sacrificios de animales? Aquí tienes 50 preguntas para examinarlo directamente en el griego del Codex Sinaiticus y en español, junto con 24 citas textuales de J. Dwight Pentecost.',
  step1: 'Son 50, en 6 temas. No hace falta hacerlas todas: elige un tema y ve despacio.',
  tabPreguntas: '50 preguntas',
  tabDoctrina: '¿Qué enseña el dispensacionalismo?',
  libroCredito: (
    <p>
      <strong>J. Dwight Pentecost:</strong> <em>Eventos del Porvenir: Estudios de Escatología Bíblica</em>, Editorial
      Vida (traducción al español de <em>Things to Come</em>, 1958). Se citan fragmentos literales en español, con su
      número de página impreso, para examinarlos a la luz de la Escritura.
    </p>
  ),
  credosCredito: (
    <p>
      <strong>Credos y confesiones:</strong> Credo de los Apóstoles, Credo Niceno-Constantinopolitano (381),
      Confesión de Augsburgo (1530), Catecismo de Heidelberg (1563), Confesión Belga (1561) y Confesión de Fe de
      Westminster (1646).
    </p>
  )
};

export default function Dispensacionalismo() {
  return (
    <ApologeticaFasciculo
      slug="dispensacionalismo"
      data={data}
      clavesData={clavesData}
      doctrina={doctrina}
      copy={COPY}
    />
  );
}
