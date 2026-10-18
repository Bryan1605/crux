import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NT_BOOKS, refLabel } from '../data/exegesis';
import { recordsFromIndex, runSearch, snippet } from '../lib/bibleSearch';
import { loadSearchIndex } from '../lib/exegesisTexts';

import './BibleSearch.css';

const MIN_CHARS = 3;

/**
 * Buscador por palabras compartido por los lectores (`/biblia/ntv` y
 * `/exegesis`).
 *
 * Busca primero en los registros que la página ya tiene en memoria (el libro
 * abierto) y, si no hay suerte, ofrece ampliar la búsqueda a todo el Nuevo
 * Testamento; ese índice pesa ~2,5 MB, así que no se descarga hasta que hace
 * falta.
 *
 * @param {{
 *   localRecords: Array<object>,
 *   scopeLabel: string,
 *   onPick: (record: object) => void,
 *   id?: string,
 *   compact?: boolean
 * }} props
 */
export default function BibleSearch({ localRecords, scopeLabel, onPick, id = 'bsearch', compact = false }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [global, setGlobal] = useState({ status: 'idle', records: [] });

  const wrapRef = useRef(null);
  const listRef = useRef(null);

  const useGlobal = global.status === 'ok';
  const scope = useGlobal ? global.records : localRecords;
  const searching = query.trim().length >= MIN_CHARS;
  const { terms, hits, total } = useMemo(
    () => runSearch(scope, searching ? query : ''),
    [scope, query, searching]
  );

  const searchAll = useCallback(() => {
    if (global.status === 'loading' || global.status === 'ok') return;
    setGlobal({ status: 'loading', records: [] });
    loadSearchIndex()
      .then(index => setGlobal({ status: 'ok', records: recordsFromIndex(index, NT_BOOKS) }))
      .catch(() => setGlobal({ status: 'error', records: [] }));
  }, [global.status]);

  const pick = useCallback(
    record => {
      if (!record) return;
      onPick(record);
      setOpen(false);
      setQuery('');
    },
    [onPick]
  );

  const reset = useCallback(() => {
    setQuery('');
    setGlobal({ status: 'idle', records: [] });
    setActive(0);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = event => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [open]);

  // La opción activa se mantiene a la vista dentro de la lista.
  useEffect(() => {
    const list = listRef.current;
    const option = list?.children?.[active];
    if (!list || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [active, hits]);

  const onKeyDown = event => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!searching || !hits.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(a => Math.min(hits.length - 1, a + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(a => Math.max(0, a - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(hits[active]);
    }
  };

  const expanded = open && searching;

  return (
    <div className={`bsearch${compact ? ' bsearch--compact' : ''}`} ref={wrapRef}>
      <div className="bsearch__field">
        <span className="bsearch__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          id={id}
          type="search"
          className="bsearch__input"
          placeholder="Buscar por palabras…"
          value={query}
          autoComplete="off"
          aria-label={`Buscar en ${scopeLabel}`}
          onChange={event => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button type="button" className="bsearch__clear" onClick={reset} aria-label="Borrar la búsqueda">
            ×
          </button>
        )}
      </div>

      {expanded && (
        <div className="bsearch__panel">
          <p className="bsearch__scope" aria-live="polite">
            <span>{useGlobal ? 'Todo el Nuevo Testamento' : scopeLabel}</span>
            <span>
              {total} {total === 1 ? 'versículo' : 'versículos'}
            </span>
          </p>

          {hits.length === 0 ? (
            <div className="bsearch__empty">
              <p>
                Sin resultados para <b>{terms.join(' · ') || query}</b> en {useGlobal ? 'el Nuevo Testamento' : scopeLabel}.
              </p>
              {!useGlobal && (
                <button type="button" className="bsearch__more" onClick={searchAll} disabled={global.status === 'loading'}>
                  {global.status === 'loading' ? 'Preparando el índice…' : 'Buscar en todo el Nuevo Testamento'}
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="bsearch__list" ref={listRef}>
                {hits.map((hit, i) => (
                  <li key={`${hit.witness}.${hit.bookId}.${hit.chapter}.${hit.verse}`}>
                    <button
                      type="button"
                      className={`bsearch__hit${i === active ? ' is-active' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(hit)}
                    >
                      <span className="bsearch__ref">{refLabel(hit.bookId, hit.chapter, hit.verse)}</span>
                      <span className={`bsearch__wit bsearch__wit--${hit.witness}`}>
                        {hit.witness === 'codex' ? 'Codex' : 'NTV'}
                      </span>
                      <span className="bsearch__text">
                        {snippet(hit.text, query).map((seg, k) =>
                          seg.hit ? <mark key={k}>{seg.text}</mark> : <span key={k}>{seg.text}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!useGlobal && (
                <button type="button" className="bsearch__more" onClick={searchAll} disabled={global.status === 'loading'}>
                  {global.status === 'loading' ? 'Preparando el índice…' : 'Buscar en todo el Nuevo Testamento'}
                </button>
              )}
              {useGlobal && total > hits.length && (
                <p className="bsearch__foot">Se muestran los primeros {hits.length} de {total}.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
