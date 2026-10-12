import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { groupByTipo, loadSearchIndex, MIN_QUERY, searchItems, TIPOS } from '../data/search';
import { tagLabel, topTemas } from '../data/temas';
import { useSeo, useSite } from '../lib/site';

import './Buscar.css';

export default function Buscar() {
  const site = useSite();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';

  const [input, setInput] = useState(q);
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: `${site.marca.nombre} — Buscar`,
    description: 'Busca a la vez en los estudios, los personajes, los concilios y los vídeos del sitio.'
  });

  // El índice vive en su propio chunk: se carga al entrar, no en la portada.
  useEffect(() => {
    let alive = true;
    loadSearchIndex().then(data => {
      if (!alive) return;
      setIndex(data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Si se llega desde un enlace (/buscar?q=fe), el cuadro refleja la URL.
  useEffect(() => setInput(q), [q]);

  const results = useMemo(() => (index ? searchItems(index, q) : []), [index, q]);
  const groups = useMemo(() => groupByTipo(results), [results]);

  const temas = useMemo(() => topTemas(12), []);
  const trimmed = q.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY;
  const empty = trimmed.length === 0;
  const total = index ? index.items.length : 0;

  const update = value => {
    setInput(value);
    const next = new URLSearchParams(params);
    const v = value.trim();
    if (v) next.set('q', v);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  const status = loading
    ? 'Cargando el índice…'
    : empty
      ? `${total} entradas listas para buscar.`
      : tooShort
        ? `Escribe al menos ${MIN_QUERY} letras.`
        : results.length === 0
          ? `Sin resultados para «${trimmed}».`
          : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'} para «${trimmed}».`;

  const showSuggestions = !loading && (empty || tooShort || results.length === 0);

  return (
    <main id="main" className="buscar-page">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Buscar en el sitio</p>
          <h1>Buscar</h1>
          <p className="lead">
            Un solo cuadro para todo el estudio: estudios, personajes, concilios, herejías y vídeos.
            Escribe un tema, un pasaje o un nombre.
          </p>

          <form
            className="buscar__form"
            role="search"
            onSubmit={e => {
              e.preventDefault();
              update(input);
            }}
          >
            <label className="sr-only" htmlFor="buscar-global">
              Buscar en el sitio
            </label>
            <input
              id="buscar-global"
              type="search"
              className="buscar__input"
              placeholder="Buscar por tema, pasaje, personaje o concilio…"
              value={input}
              onChange={e => update(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            {input && (
              <button
                type="button"
                className="buscar__clear"
                onClick={() => update('')}
                aria-label="Limpiar la búsqueda"
              >
                ×
              </button>
            )}
          </form>
        </div>
      </header>

      <section className="section" aria-labelledby="buscar-resultados">
        <div className="container">
          <h2 id="buscar-resultados" className="sr-only">
            Resultados
          </h2>
          <p className="buscar__status" role="status" aria-live="polite">
            {status}
          </p>

          {groups.map(g => (
            <div key={g.tipo} className="buscar__group">
              <h3 className="buscar__group-title">
                {g.label}
                <span className="buscar__group-count">{g.items.length}</span>
              </h3>
              <ul className="buscar__list">
                {g.items.map(it => (
                  <li key={`${it.tipo}:${it.id}`}>
                    <Link className="buscar__item" to={it.href}>
                      <span className="buscar__item-body">
                        <span className="buscar__item-meta">
                          {TIPOS[it.tipo].label}
                          {it.sub ? <> · {it.sub}</> : null}
                        </span>
                        <span className="buscar__item-title">{it.title}</span>
                        {it.desc ? <span className="buscar__item-desc">{it.desc}</span> : null}
                      </span>
                      <span className="arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {showSuggestions && (
            <div className="buscar__suggest">
              <p className="eyebrow">Temas frecuentes</p>
              <div className="chips">
                {temas.map(t => (
                  <Link key={t.tag} className="chip" to={`/buscar?q=${encodeURIComponent(t.tag)}`}>
                    {tagLabel(t.tag)}
                    <span className="chip__count">{t.count}</span>
                  </Link>
                ))}
              </div>
              <p className="buscar__hint">
                ¿Prefieres curiosear? <Link to="/temas">Explora todos los temas</Link>.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
