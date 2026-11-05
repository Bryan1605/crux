import { Link, useParams } from 'react-router-dom';

import { BOOK_BY_ID } from '../data/exegesis';
import { CANON_LABEL, FUENTES, bloquesDe, libroById } from '../data/libros';
import { libroSeo } from '../lib/librosSeo';
import { useSite, useSeo } from '../lib/site';
import NotFound from './NotFound';

import './Estudio.css';
import './Libros.css';

function Bloques({ body }) {
  return bloquesDe(body).map((b, i) =>
    b.kind === 'ol' ? (
      <ol key={i} className="ficha__claves">
        {b.items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    ) : (
      <p key={i}>
        {b.parts.map((part, j) => (
          <span key={j}>
            {j > 0 && ' '}
            {part.capa && <span className={`ficha-capa ficha-capa--${part.capa.toLowerCase()}`}>{part.capa}</span>}
            {part.capa && ' '}
            {part.text}
          </span>
        ))}
      </p>
    )
  );
}

/** Ficha de un libro: técnica, siete secciones, debates y fuentes. */
export default function LibroFicha() {
  const { id } = useParams();
  const site = useSite();
  const ficha = libroById(id);
  // Sin ficha no hay página: NotFound pone su propio título (un título vacío aquí no lo pisa).
  useSeo(ficha ? libroSeo(ficha, site.marca.nombre) : {});
  if (!ficha) return <NotFound />;

  const book = BOOK_BY_ID.get(ficha.id);
  const hasNtv = Boolean(book?.ntv);

  return (
    <main id="main" className="libros ficha">
      <header className="page-head">
        <div className="container">
          <nav className="breadcrumb" aria-label="Migas de pan">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link to="/biblia/libros">Libros</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{ficha.title}</span>
          </nav>
          <p className="eyebrow">
            Ficha del libro · {ficha.testament === 'AT' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
          </p>
          <h1>{ficha.title}</h1>
          <p className="lead">{ficha.summary}</p>
          <p className="ficha__estado">
            {ficha.status === 'borrador' ? 'Borrador, pendiente de revisión' : 'Revisada'} · actualizada el{' '}
            {ficha.updated}
          </p>
          <div className="ficha__lectores">
            {hasNtv && (
              <Link className="btn btn--primary" to={`/biblia/ntv?libro=${ficha.id}&cap=1`}>
                Leer en la NTV
              </Link>
            )}
            <Link className={`btn ${hasNtv ? 'btn--ghost' : 'btn--primary'}`} to={`/exegesis?libro=${ficha.id}&cap=1`}>
              Leer en el Codex
            </Link>
            {book?.codexOnly && (
              <Link className="btn btn--ghost" to={`/exegesis?libro=${ficha.id}&cap=1&modo=trad`}>
                Traducción de trabajo
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container ficha__grid">
        <aside className="ficha__tecnica" aria-labelledby="ficha-tecnica">
          <h2 id="ficha-tecnica">Ficha técnica</h2>
          <dl>
            <dt>Abreviatura</dt>
            <dd>{ficha.abbr}</dd>
            <dt>Género</dt>
            <dd>{ficha.genre.join(' · ')}</dd>
            <dt>Lengua</dt>
            <dd>{ficha.language}</dd>
            <dt>Fecha del relato</dt>
            <dd>{ficha.date.narrative}</dd>
            <dt>Composición</dt>
            <dd>
              {ficha.date.composition} <span className="ficha__certeza">({ficha.date.certainty})</span>
            </dd>
            {Object.entries(CANON_LABEL).map(([k, label]) => (
              <div key={k} className="ficha__canon">
                <dt>{label}</dt>
                <dd>{ficha.canon[k]}</dd>
              </div>
            ))}
          </dl>
          {ficha.date.note && <p className="ficha__nota">{ficha.date.note}</p>}
        </aside>

        <article className="ficha__cuerpo">
          <p className="ficha__neutral">
            Esta ficha distingue lo que el texto dice, lo que la tradición transmite y lo que la investigación
            propone. Las fechas son aproximadas. No decide cuestiones de fe.
          </p>
          {ficha.notice && <p className="ficha__aviso">{ficha.notice}</p>}

          {ficha.sections.map(s => (
            <section key={s.id} id={s.id} className="ficha__seccion" aria-labelledby={`h-${s.id}`}>
              <h2 id={`h-${s.id}`}>{s.title}</h2>
              <Bloques body={s.body} />
            </section>
          ))}

          {ficha.debates?.length > 0 && (
            <section id="debates" className="ficha__seccion" aria-labelledby="h-debates">
              <h2 id="h-debates">Debates</h2>
              {ficha.debates.map(d => (
                <div key={d.question} className="ficha__debate">
                  <h3>{d.question}</h3>
                  <ul>
                    {d.positions.map(p => (
                      <li key={p.body}>
                        <span className={`ficha-capa ficha-capa--${p.label.toLowerCase()}`}>{p.label}</span> {p.body}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          <section id="fuentes" className="ficha__seccion" aria-labelledby="h-fuentes">
            <h2 id="h-fuentes">Fuentes</h2>
            <ol className="ficha__fuentes">
              {ficha.sources.map(key => {
                const f = FUENTES[key];
                return (
                  <li key={key}>
                    {f.autor}, «{f.titulo}», <i>{f.obra}</i>
                    {f.editorial ? `, ${f.editorial}` : ''}, {f.anio}.
                    {f.url && (
                      <>
                        {' '}
                        <a href={f.url} target="_blank" rel="noopener noreferrer">
                          Ver la fuente
                        </a>
                      </>
                    )}
                    <span className="ficha__consultado"> Consultada el {f.consultado}.</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </article>
      </div>
    </main>
  );
}
