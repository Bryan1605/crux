import data from '../../content/apologetica/shincheonji-preguntas.json';
import clavesData from '../../content/apologetica/shincheonji-claves.json';
import doctrina from '../../content/apologetica/shincheonji-doctrina.json';
import ApologeticaFasciculo from './ApologeticaFasciculo';

/*
 * «100 preguntas, solo con la Biblia» (/apologetica/shincheonji).
 * Los datos salen del wiki con `scripts/import-shincheonji.mjs`.
 */
const COPY = {
  eyebrow: 'Para miembros y estudiantes de Shincheonji',
  h1Line1: '100 preguntas,',
  h1Line2: 'solo con la Biblia',
  lead:
    'Shincheonji invita a un examen público de 100 preguntas sobre el Apocalipsis. Aquí tienes otras 100, y se responden de una sola manera: leyendo el versículo. Lo tienes delante, en el griego en que se escribió y en español, para que lo compruebes tú.',
  step1: 'Son 100, en 10 temas. No hace falta hacerlas todas: elige un tema y ve despacio.',
  tabPreguntas: '100 preguntas',
  tabDoctrina: '¿Qué cree Shincheonji?',
  libroCredito: (
    <p>
      <strong>Lee Man-hee:</strong> <em>The Creation of Heaven and Earth</em>, Shincheonji Press, 2.ª edición inglesa,
      2014 (edición coreana 2007). Se citan fragmentos breves, con su página, para comentarlos; el inglés es literal y el
      español es traducción de Crux.
    </p>
  ),
  credosCredito: (
    <p>
      <strong>Credos y confesiones:</strong> Credo de los Apóstoles, Credo Niceno-Constantinopolitano (381), Definición
      de Calcedonia (451), Catecismo de Heidelberg (1563) y Confesión de Fe de Westminster (1646).
    </p>
  )
};

export default function Shincheonji() {
  return (
    <ApologeticaFasciculo
      slug="shincheonji"
      data={data}
      clavesData={clavesData}
      doctrina={doctrina}
      copy={COPY}
    />
  );
}
