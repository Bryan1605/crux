import { Link } from 'react-router-dom';

import doctrina from '../../content/apologetica/shincheonji-doctrina.json';
import { exegesisPath } from '../data/exegesis';

/*
 * Pestaña «¿Qué cree Shincheonji?» de /apologetica/shincheonji.
 *
 * Cada cita de Lee Man-hee va en el inglés del libro, con su página, y al lado
 * la traducción de Crux. Los datos (content/apologetica/shincheonji-doctrina.json)
 * se comprueban contra el libro con `node scripts/check-shincheonji-lee.mjs`.
 */

const pages = list => (list.length > 1 ? `pp. ${list.join(', ')}` : `p. ${list[0]}`);

function Quote({ c }) {
  const pag = pages(c.paginas);
  return (
    <figure className="scj-pair scj-lee">
      <blockquote className="scj-col scj-col--en" lang="en">
        <p className="scj-lab">
          <span>Inglés · texto del libro</span>
          <span>{pag}</span>
        </p>
        <p className="scj-en">“{c.en}”</p>
      </blockquote>
      <div className="scj-col scj-col--es">
        <p className="scj-lab">
          <span>Español · traducción de Crux</span>
          <span>{pag}</span>
        </p>
        <p className="scj-es">«{c.es}»</p>
        {c.nota && <p className="scj-lee__nota">{c.nota}</p>}
      </div>
    </figure>
  );
}

function Parte({ p }) {
  const { ortodoxia = [], reforma = [] } = p.confiesa || {};
  return (
    <section id={`parte-${p.id}`} className="scj-block scj-parte" aria-labelledby={`parte-${p.id}-t`}>
      <p className="scj-block__count">Parte {p.id}</p>
      <h2 id={`parte-${p.id}-t`}>{p.titulo}</h2>

      <h3>Lo que enseña Lee</h3>
      {p.lee.map(c => (
        <Quote key={`${c.paginas.join('-')}-${c.en.slice(0, 24)}`} c={c} />
      ))}
      {p.leeNota && <p className="scj-doc-note">{p.leeNota}</p>}

      {p.significa?.texto && (
        <>
          <h3>Qué significa esto</h3>
          <p>{p.significa.texto}</p>
          {p.significa.puntos?.length > 0 && (
            <ul className="scj-doc-list">
              {p.significa.puntos.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </>
      )}

      {(ortodoxia.length > 0 || reforma.length > 0) && (
        <>
          <h3>Lo que confiesa la iglesia</h3>
          <div className="scj-confiesa">
            {ortodoxia.length > 0 && (
              <div>
                <h4>Credos antiguos</h4>
                <ul>
                  {ortodoxia.map(t => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {reforma.length > 0 && (
              <div>
                <h4>Reforma</h4>
                <ul>
                  {reforma.map(t => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {p.biblia && (
        <>
          <h3>Lo que dice la Biblia</h3>
          {p.biblia.cita && (
            <blockquote className="scj-doc-verse">
              <p>«{p.biblia.cita.texto}»</p>
              <footer>
                <Link to={exegesisPath(p.biblia.cita.ref)}>{p.biblia.cita.ref}</Link> · NTV
              </footer>
            </blockquote>
          )}
          <ul className="scj-doc-list">
            {p.biblia.puntos.map(b => (
              <li key={b.ref}>
                <Link to={exegesisPath(b.refs[0])}>{b.ref}</Link>: {b.texto}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function ShincheonjiDoctrina() {
  const { libro } = doctrina;
  return (
    <div className="scj-layout">
      <nav className="scj-side" aria-label="Partes del estudio">
        <ul>
          {doctrina.partes.map(p => (
            <li key={p.id}>
              <a href={`#parte-${p.id}`}>
                <span>
                  {p.id}. {p.titulo}
                </span>
              </a>
            </li>
          ))}
          <li>
            <a href="#preguntas-lee">
              <span>Preguntas con su libro</span>
            </a>
          </li>
        </ul>
      </nav>

      <div className="scj-blocks">
        <section className="scj-card scj-doc-intro" aria-labelledby="scj-doc-t">
          <h2 id="scj-doc-t">Lo que enseña Lee, con su libro en la mano</h2>
          <p>
            Todas las citas son del libro de {libro.autor} <em>{libro.titulo}</em> ({libro.edicion}), su obra
            doctrinal más completa. A un lado está el texto tal como está impreso en inglés, con su página; al otro,
            nuestra traducción al español. Busca la página en el libro y compruébalo.
          </p>
          <p>
            Después de cada parte verás qué significa esa enseñanza, lo que la iglesia ha confesado siempre y lo que
            dice la Biblia.
          </p>
          <p className="scj-doc-note">
            <strong>Para ser justos:</strong> {doctrina.equidad}
          </p>
        </section>

        {doctrina.partes.map(p => (
          <Parte key={p.id} p={p} />
        ))}

        {doctrina.preguntas?.length > 0 && (
          <section id="preguntas-lee" className="scj-block" aria-labelledby="preguntas-lee-t">
            <h2 id="preguntas-lee-t">Preguntas con su libro en la mano</h2>
            <p>Cada pregunta indica la página del libro de Lee y el pasaje de la Biblia, para leerlos juntos.</p>
            <ol className="scj-doc-questions">
              {doctrina.preguntas.map(q => (
                <li key={`${q.pagina}-${q.ref}`}>
                  <span className="scj-doc-questions__ref">
                    p. {q.pagina} · <Link to={exegesisPath(q.ref)}>{q.ref}</Link>
                  </span>
                  {q.texto}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
