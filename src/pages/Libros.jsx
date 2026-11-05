import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { LIBROS, LIBROS_CANON } from '../data/libros';
import { librosIndexSeo } from '../lib/librosSeo';
import { useSite, useSeo } from '../lib/site';

import './Estudio.css';
import './Libros.css';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'AT', label: 'Antiguo Testamento' },
  { id: 'NT', label: 'Nuevo Testamento' },
  { id: 'ficha', label: 'Con ficha' }
];

/** Índice de los libros de la Biblia que lee el sitio, con su ficha si existe. */
export default function Libros() {
  const site = useSite();
  useSeo(librosIndexSeo(site.marca.nombre));
  const [filtro, setFiltro] = useState('todos');

  const lista = useMemo(
    () =>
      LIBROS_CANON.filter(({ book, ficha }) =>
        filtro === 'ficha' ? Boolean(ficha) : filtro === 'todos' ? true : book.testament === filtro
      ),
    [filtro]
  );

  return (
    <main id="main" className="libros">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Biblia</p>
          <h1>Libros de la Biblia</h1>
          <p className="lead">
            Una ficha por libro: qué tipo de texto es, cuándo y cómo se compuso, cómo se ha transmitido y
            qué canon lo recibe. Hay {LIBROS.length} de {LIBROS_CANON.length}; las demás están en preparación.
          </p>
          <div className="chips libros__filtros" role="group" aria-label="Filtrar libros">
            {FILTROS.map(f => (
              <button
                key={f.id}
                type="button"
                className="chip"
                aria-pressed={filtro === f.id}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <h2 className="sr-only">Índice de libros</h2>
          <ol className="libros__lista">
            {lista.map(({ book, ficha }) => (
              <li key={book.id} className={`libros__item${ficha ? ' has-ficha' : ''}`}>
                {ficha ? (
                  <Link className="libros__link" to={`/biblia/libros/${book.id}`}>
                    <span className="libros__abbr">{book.abbr}</span>
                    <span className="libros__main">
                      <span className="libros__name">{book.name}</span>
                      <span className="libros__summary">{ficha.summary}</span>
                    </span>
                    <span className="libros__estado">{ficha.status === 'borrador' ? 'Borrador' : 'Revisada'}</span>
                  </Link>
                ) : (
                  <div className="libros__link">
                    <span className="libros__abbr">{book.abbr}</span>
                    <span className="libros__main">
                      <span className="libros__name">{book.name}</span>
                      <span className="libros__summary">Ficha en preparación.</span>
                    </span>
                    <span className="libros__estado">{book.testament}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
