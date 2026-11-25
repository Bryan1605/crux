import { Link } from 'react-router-dom';

import { exegesisPath } from '../data/exegesis';

/*
 * Pestaña doctrinal de los fascículos de apologética.
 *
 * Admite dos formatos de cita primaria:
 *  - bilingüe (`en` + `es`): inglés original en pergamino y traducción de Crux
 *    en la columna oscura (ej. Lee Man-hee en Shincheonji);
 *  - español original (`es` sin `en`): pergamino a ancho completo con su
 *    página impresa (ej. J. Dwight Pentecost, Editorial Vida).
 */

const pages = list => (list.length > 1 ? `pp. ${list.join(', ')}` : `p. ${list[0]}`);

function Quote({ c }) {
  const pag = pages(c.paginas);
  if (!c.en) {
    const base = c.obra || 'Español · texto del libro';
    const label = c.autorCitado ? `${base} (citando a ${c.autorCitado})` : base;
    return (
      <figure className="scj-pair scj-pair--single scj-lee">
        <blockquote className="scj-col scj-col--en" lang="es">
          <p className="scj-lab">
            <span>{label}</span>
            <span>{pag}</span>
          </p>
          <p className="scj-en">«{c.es}»</p>
          {c.nota && <p className="scj-lee__nota">{c.nota}</p>}
        </blockquote>
      </figure>
    );
  }
  const enLabel = c.obra ? `Inglés · ${c.obra}` : 'Inglés · texto del libro';
  return (
    <figure className="scj-pair scj-lee">
      <blockquote className="scj-col scj-col--en" lang="en">
        <p className="scj-lab">
          <span>{enLabel}</span>
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

function Patristica({ patristica }) {
  const citas = patristica.citas || [];
  const historia = patristica.historia || [];
  return (
    <>
      <h3>{patristica.titulo || 'Lo que testifican los Padres y la historia'}</h3>
      {patristica.intro && <p>{patristica.intro}</p>}
      {citas.length > 0 && (
        <div className="scj-patr-list">
          {citas.map(c => (
            <figure key={`${c.autor}-${c.obra}-${c.cita.slice(0, 20)}`} className="scj-patr-quote">
              <p className="scj-lab">
                <span>
                  {c.autor} · {c.obra}
                </span>
                <span>{c.fecha}</span>
              </p>
              <blockquote lang="es">
                <p className="scj-en">«{c.cita}»</p>
              </blockquote>
              {(c.nota || c.enBiblia) && (
                <figcaption className="scj-patr-foot">
                  {c.nota}
                  {c.nota && c.enBiblia ? ' ' : ''}
                  {c.enBiblia && (
                    <>
                      Fuente: <Link to="/biblia">Biblia Patrística</Link>.
                    </>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      {historia.length > 0 && (
        <>
          <h4 className="scj-patr-sub">{patristica.historiaTitulo || 'Precisiones históricas'}</h4>
          <ul className="scj-doc-list scj-patr-hist">
            {historia.map(h => (
              <li key={h.titulo}>
                <strong>
                  {h.titulo}
                  {h.fecha ? ` (${h.fecha})` : ''}:
                </strong>{' '}
                {h.texto}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Parte({ p, etiquetas }) {
  const { ortodoxia = [], reforma = [] } = p.confiesa || {};
  const citas = p.citas || p.lee || [];
  const citasNota = p.citasNota || p.leeNota;

  return (
    <section id={`parte-${p.id}`} className="scj-block scj-parte" aria-labelledby={`parte-${p.id}-t`}>
      <p className="scj-block__count">Parte {p.id}</p>
      <h2 id={`parte-${p.id}-t`}>{p.titulo}</h2>

      <h3>{etiquetas.citas || 'Lo que enseña Lee'}</h3>
      {citas.map(c => (
        <Quote key={`${c.paginas.join('-')}-${(c.en || c.es).slice(0, 24)}`} c={c} />
      ))}
      {citasNota && <p className="scj-doc-note">{citasNota}</p>}

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

      {p.patristica && <Patristica patristica={p.patristica} />}

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

export default function ApologeticaDoctrina({ doctrina }) {
  const { libro, etiquetas = {} } = doctrina;
  const bilingue = doctrina.partes.some(p => (p.citas || p.lee || []).some(c => Boolean(c.en)));
  const introTitulo = etiquetas.introTitulo || 'Lo que enseña Lee, con su libro en la mano';
  const preguntasId = etiquetas.preguntasId || 'preguntas-lee';
  const preguntasNav = etiquetas.preguntasNav || 'Preguntas con su libro';
  const preguntasTitulo = etiquetas.preguntasTitulo || 'Preguntas con su libro en la mano';
  const preguntasIntro =
    etiquetas.preguntasIntro || 'Cada pregunta indica la página del libro de Lee y el pasaje de la Biblia, para leerlos juntos.';

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
          {doctrina.preguntas?.length > 0 && (
            <li>
              <a href={`#${preguntasId}`}>
                <span>{preguntasNav}</span>
              </a>
            </li>
          )}
        </ul>
      </nav>

      <div className="scj-blocks">
        <section className="scj-card scj-doc-intro" aria-labelledby="scj-doc-t">
          <h2 id="scj-doc-t">{introTitulo}</h2>
          {doctrina.obras?.length > 0 ? (
            <>
              <p>
                Todas las citas proceden literalmente de publicaciones oficiales de la denominación, con indicación de
                la obra y el número de página impreso para que puedas buscarlas y comprobarlas directamente (en obras en
                inglés, se muestra el original junto a la traducción de Crux):
              </p>
              <ul className="scj-doc-list">
                {doctrina.obras.map(o => (
                  <li key={`${o.titulo}-${o.edicion}`}>
                    <strong>{o.autor}:</strong> <em>{o.titulo}</em> ({o.edicion}).
                  </li>
                ))}
              </ul>
            </>
          ) : bilingue ? (
            <p>
              Todas las citas son del libro de {libro.autor} <em>{libro.titulo}</em> ({libro.edicion}), su obra
              doctrinal más completa. A un lado está el texto tal como está impreso en inglés, con su página; al otro,
              nuestra traducción al español. Busca la página en el libro y compruébalo.
            </p>
          ) : (
            <p>
              Todas las citas son del libro de {libro.autor} <em>{libro.titulo}</em> ({libro.edicion}). Se reproducen
              textualmente con su número de página para que puedas buscarlas en el libro y comprobarlas directamente.
            </p>
          )}
          <p>
            Después de cada parte verás qué significa esa enseñanza, lo que la iglesia ha confesado siempre y lo que
            dice la Biblia.
          </p>
          <p className="scj-doc-note">
            <strong>Para ser justos:</strong> {doctrina.equidad}
          </p>
        </section>

        {doctrina.partes.map(p => (
          <Parte key={p.id} p={p} etiquetas={etiquetas} />
        ))}

        {doctrina.preguntas?.length > 0 && (
          <section id={preguntasId} className="scj-block" aria-labelledby={`${preguntasId}-t`}>
            <h2 id={`${preguntasId}-t`}>{preguntasTitulo}</h2>
            <p>{preguntasIntro}</p>
            <ol className="scj-doc-questions">
              {doctrina.preguntas.map(q => (
                <li key={`${q.obra || ''}-${q.pagina}-${q.ref}-${q.texto.slice(0, 16)}`}>
                  <span className="scj-doc-questions__ref">
                    {q.obra ? `${q.obra} · ` : ''}p. {q.pagina} · <Link to={exegesisPath(q.ref)}>{q.ref}</Link>
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
