import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { BOOK_BY_ID } from '../data/exegesis';
import { LEXICON_LANGS, normalizeStrongQuery, searchLexiconEntries } from '../lib/lexicon';

import './LexiconPanel.css';

const number = new Intl.NumberFormat('es-ES');

const SOURCE_TBESG = 'https://github.com/STEPBible/STEPBible-Data';
const SOURCE_MORPH = 'https://github.com/morphgnt/morphological-analysis-of-greek-new-testament';

const FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'V', label: 'Verbos' },
  { id: 'N', label: 'Sustantivos' },
  { id: 'A', label: 'Adjetivos' },
  { id: 'func', label: 'Nexos / pronombres' },
  { id: 'notes', label: 'Con nota' },
  { id: 'ns', label: 'Nomina sacra' }
];

const SORTS = [
  { id: 'freq', label: 'Frecuencia' },
  { id: 'alpha', label: 'Alfabético (Α–Ω)' },
  { id: 'strong', label: 'Strong (G0001…)' }
];

/**
 * Diccionario léxico del proyecto (V2 multi-idioma).
 *
 * El panel se abre con `?dic=` (vacío para la lista, `?dic=G3056` para una
 * entrada). Busca por lema, formas del Codex (como `θϲ` o `εϲτιν`),
 * transcripción, glosa, nota o código Strong (con o sin ceros: `25` o `G25`),
 * ordena coincidencias exactas primero e incluye pasajes y familia léxica.
 */
export default function LexiconPanel({
  lexicon,
  loading = false,
  error = false,
  value = '',
  lang = 'grc',
  onSelect,
  onGoToVerse,
  onClose
}) {
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('freq');

  const searchRef = useRef(null);
  const listRef = useRef(null);
  const detailRef = useRef(null);
  const dialogRef = useRef(null);
  const restoreRef = useRef(null);
  const focusedRef = useRef(false);
  const restoreBrowseFocusRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const adapter = LEXICON_LANGS[lang] || LEXICON_LANGS.grc;
  const entries = useMemo(() => lexicon?.entries || [], [lexicon]);
  const strongMap = useMemo(() => new Map(entries.map(item => [item.strong, item])), [entries]);

  const entry = useMemo(() => {
    if (!value) return null;
    const direct = strongMap.get(value);
    if (direct) return direct;
    const normalized = normalizeStrongQuery(value, adapter.strongPrefix);
    return normalized ? strongMap.get(normalized.toUpperCase()) || strongMap.get(normalized) || null : null;
  }, [strongMap, value, adapter.strongPrefix]);
  const letters = lexicon?.letters || [];

  const filtered = useMemo(
    () => searchLexiconEntries(entries, { query, letter, filter, sort, lang }),
    [entries, query, letter, filter, sort, lang]
  );

  /* Bloquea el scroll y cierra con Escape mientras el panel está abierto. */
  useEffect(() => {
    restoreRef.current = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const items = [
        ...root.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ].filter(element => element.offsetParent !== null || element === document.activeElement);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previous;
      if (restoreRef.current?.isConnected) {
        restoreRef.current.focus({ preventScroll: true });
      }
    };
  }, []);

  /* El primer foco depende del enlace: una entrada concreta o el buscador. */
  useEffect(() => {
    if (focusedRef.current || !lexicon) return;
    if (value) {
      detailRef.current?.focus({ preventScroll: true });
      focusedRef.current = true;
    } else {
      searchRef.current?.focus({ preventScroll: true });
      focusedRef.current = true;
    }
  }, [lexicon, value, entry]);

  /* Al volver de una ficha en móvil, devolver foco al buscador de la lista. */
  useEffect(() => {
    if (!value && restoreBrowseFocusRef.current) {
      restoreBrowseFocusRef.current = false;
      searchRef.current?.focus({ preventScroll: true });
    }
  }, [value]);

  /* Mantén visible la entrada activa al abrir un enlace directo o al elegirla. */
  useEffect(() => {
    const node = listRef.current?.querySelector('.lex__item.is-active');
    node?.scrollIntoView({ block: 'nearest' });
  }, [value, filtered]);

  const handleBackToList = () => {
    restoreBrowseFocusRef.current = true;
    onSelect('');
  };

  const handleSearchKeyDown = event => {
    if (event.key === 'ArrowDown' && filtered.length) {
      event.preventDefault();
      listRef.current?.querySelector('.lex__item')?.focus();
    }
  };

  const handleListKeyDown = event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = [...(listRef.current?.querySelectorAll('.lex__item') || [])];
    const currentIdx = items.indexOf(document.activeElement);
    if (currentIdx < 0) return;
    event.preventDefault();
    if (event.key === 'ArrowDown') {
      items[Math.min(items.length - 1, currentIdx + 1)]?.focus();
    } else if (currentIdx === 0) {
      searchRef.current?.focus();
    } else {
      items[currentIdx - 1]?.focus();
    }
  };

  const formatRef = ref => {
    const [bookId, cap, verse] = ref;
    const meta = BOOK_BY_ID.get(bookId);
    return `${meta?.abbr || bookId} ${cap}:${verse}`;
  };

  const detail = entry ? (
    <article className="lex-entry" aria-labelledby="lex-entry-title">
      <button
        type="button"
        className="lex-entry__back"
        onClick={handleBackToList}
      >
        <span aria-hidden="true">←</span> Volver a la lista
      </button>
      <p className="lex-entry__strong">
        {entry.strong}
        {entry.ns ? ' · nomen sacrum' : ''}
      </p>
      <h3
        id="lex-entry-title"
        className="lex-entry__lemma"
        ref={detailRef}
        tabIndex={-1}
        lang={adapter.langAttr}
        dir={adapter.dir}
      >
        {entry.lemma}
      </h3>
      <p className="lex-entry__translit">
        {entry.translit} · {entry.posLabel}
      </p>
      <p className="lex-entry__gloss">{entry.gloss}</p>
      {entry.note && <p className="lex-entry__note">{entry.note}</p>}

      <dl className="lex-entry__meta">
        <div>
          <dt>Frecuencia en el NT</dt>
          <dd>
            {number.format(entry.count)} apariciones{' '}
            {lexicon?.tokens ? (
              <span className="lex-entry__pct">
                ({((entry.count / lexicon.tokens) * 100).toFixed(2)} %)
              </span>
            ) : null}
          </dd>
        </div>
        {entry.forms?.length ? (
          <div>
            <dt>Formas en el códice</dt>
            <dd className="lex-entry__forms" lang={adapter.langAttr}>
              {entry.forms.join(' · ')}
            </dd>
          </div>
        ) : null}
        {entry.refs?.length ? (
          <div>
            <dt>Pasajes en el códice</dt>
            <dd className="lex-entry__chips">
              {entry.refs.map(ref => {
                const label = formatRef(ref);
                return (
                  <button
                    key={`${ref[0]}-${ref[1]}-${ref[2]}`}
                    type="button"
                    className="lex-ref"
                    onClick={() => onGoToVerse?.(ref[0], ref[1], ref[2])}
                  >
                    {label}
                  </button>
                );
              })}
            </dd>
          </div>
        ) : null}
        {entry.related?.length ? (
          <div>
            <dt>Familia léxica</dt>
            <dd className="lex-entry__chips">
              {entry.related.map(relStrong => {
                const rel = strongMap.get(relStrong);
                if (!rel) return null;
                return (
                  <button
                    key={relStrong}
                    type="button"
                    className="lex-rel"
                    onClick={() => onSelect(relStrong)}
                  >
                    <span className="lex-rel__lemma" lang={adapter.langAttr}>
                      {rel.lemma}
                    </span>{' '}
                    <span className="lex-rel__strong">{relStrong}</span>
                  </button>
                );
              })}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="lex-entry__source">
        Frecuencia y formas medidas sobre la transcripción del Codex Sinaiticus (NT); lema y morfología de
        MorphGNT; glosa base adaptada de TBESG (STEPBible).
      </p>
    </article>
  ) : (
    <div className="lex-empty" ref={detailRef} tabIndex={-1}>
      {value ? (
        <button type="button" className="lex-entry__back" onClick={handleBackToList}>
          <span aria-hidden="true">←</span> Volver a la lista
        </button>
      ) : null}
      <p className="lex-empty__title">
        {value ? 'Entrada no disponible' : 'Elige una palabra'}
      </p>
      <p>
        {value
          ? `La entrada ${value} no figura entre las ${lexicon?.count || ''} fichas curadas publicadas del NT.`
          : 'Busca un lema griego, una forma del códice (θϲ, εϲτιν), transcripción, glosa o Strong (25, G3056).'}
      </p>
    </div>
  );

  return (
    <div className="lex" role="dialog" aria-modal="true" aria-labelledby="lex-title">
      <div className="lex__backdrop" aria-hidden="true" onMouseDown={onClose} />
      <div className={`lex__dialog${entry || value ? ' lex--detail' : ''}`} ref={dialogRef}>
        <header className="lex__head">
          <div>
            <p className="eyebrow">Léxico del Codex</p>
            <h2 id="lex-title">{adapter.title}</h2>
            <p className="lex__sub">
              {lexicon
                ? `${lexicon.count} lemas curados · ${(lexicon.coverage * 100).toFixed(1)} % de las palabras del NT en el códice`
                : 'Preparando el léxico…'}
            </p>
          </div>
          <button type="button" className="lex__close" onClick={onClose} aria-label="Cerrar el diccionario">
            ×
          </button>
        </header>

        <div className="lex__body">
          <section className="lex__browse" aria-label="Buscar en el diccionario">
            <div className="lex__search">
              <label htmlFor="lex-q">Buscar</label>
              <input
                id="lex-q"
                ref={searchRef}
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={adapter.placeholder}
                autoComplete="off"
                spellCheck="false"
                aria-controls="lex-list"
              />
            </div>

            <div className="lex__controls">
              <div>
                <label htmlFor="lex-filter" className="sr-only">
                  Filtrar por categoría
                </label>
                <select
                  id="lex-filter"
                  className="lex__select"
                  value={filter}
                  onChange={event => setFilter(event.target.value)}
                >
                  {FILTERS.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lex-sort" className="sr-only">
                  Ordenar resultados
                </label>
                <select
                  id="lex-sort"
                  className="lex__select"
                  value={sort}
                  onChange={event => setSort(event.target.value)}
                >
                  {SORTS.map(s => (
                    <option key={s.id} value={s.id}>
                      Orden: {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lex__letters" role="group" aria-label="Filtrar por letra inicial">
              <button
                type="button"
                className={`lex__letter${letter ? '' : ' is-active'}`}
                aria-pressed={!letter}
                onClick={() => setLetter('')}
              >
                Todo
              </button>
              {letters.map(item => (
                <button
                  key={item}
                  type="button"
                  className={`lex__letter${letter === item ? ' is-active' : ''}`}
                  aria-pressed={letter === item}
                  onClick={() => setLetter(current => (current === item ? '' : item))}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="lex__count" role="status">
              {loading
                ? 'Cargando…'
                : `${filtered.length} ${filtered.length === 1 ? 'entrada' : 'entradas'}${
                    letter ? ` con ${letter}` : ''
                  }`}
            </p>

            {loading ? (
              <div className="lex__state" role="status">
                Cargando el diccionario…
              </div>
            ) : error ? (
              <div className="lex__state">
                <p>No se pudo cargar el diccionario.</p>
                <p className="muted">Comprueba la conexión y vuelve a abrir el panel.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="lex__state">
                <p>No hay entradas que coincidan.</p>
                <button
                  type="button"
                  className="lex__reset"
                  onClick={() => {
                    setQuery('');
                    setLetter('');
                    setFilter('all');
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <ul className="lex__list" id="lex-list" ref={listRef} onKeyDown={handleListKeyDown}>
                {filtered.map(item => {
                  const active = item.strong === (entry?.strong || value);
                  return (
                    <li key={item.strong}>
                      <button
                        type="button"
                        className={`lex__item${active ? ' is-active' : ''}`}
                        aria-current={active ? 'true' : undefined}
                        onClick={() => onSelect(item.strong)}
                      >
                        <span className="lex__lemma" lang={adapter.langAttr}>
                          {item.lemma}
                        </span>
                        <span className="lex__translit">{item.translit}</span>
                        <span className="lex__gloss">{item.gloss}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <Link
              className="lex__guide"
              to="/exegesis/guia?lengua=griego"
            >
              ¿Empiezas con el alfabeto? Abrir guía de lectura →
            </Link>
          </section>

          <section className="lex__detail" aria-live="polite">
            {detail}
          </section>
        </div>

        <footer className="lex__foot">
          <span>
            Glosas: adaptación propia de{' '}
            <a href={SOURCE_TBESG} target="_blank" rel="noopener noreferrer">
              TBESG
            </a>{' '}
            (CC BY 4.0)
          </span>
          <span>
            Lematización:{' '}
            <a href={SOURCE_MORPH} target="_blank" rel="noopener noreferrer">
              MorphGNT
            </a>{' '}
            (CC BY-SA 3.0)
          </span>
          <span>Strong: dominio público</span>
        </footer>
      </div>
    </div>
  );
}
