import { useEffect, useMemo, useRef, useState } from 'react';

import { foldGreek, foldText, greekLetter } from '../lib/greek';

import './LexiconPanel.css';

const number = new Intl.NumberFormat('es-ES');

const SOURCE_TBESG = 'https://github.com/STEPBible/STEPBible-Data';
const SOURCE_MORPH = 'https://github.com/morphgnt/morphological-analysis-of-greek-new-testament';

/**
 * Diccionario griego → español del Codex.
 *
 * El panel se abre con `?dic=` (vacío para la lista, `?dic=G3056` para una
 * entrada). La lista se filtra por lema, transcripción, glosa o número Strong;
 * las letras reproducen el abecedario del léxico. En pantallas estrechas la
 * ficha sustituye a la lista y se vuelve con «Volver».
 */
export default function LexiconPanel({
  lexicon,
  loading = false,
  error = false,
  value = '',
  onSelect,
  onClose
}) {
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState('');

  const searchRef = useRef(null);
  const listRef = useRef(null);
  const detailRef = useRef(null);
  const dialogRef = useRef(null);
  const restoreRef = useRef(null);
  const focusedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const entries = lexicon?.entries || [];
  const entry = useMemo(
    () => entries.find(item => item.strong === value) || null,
    [entries, value]
  );
  const letters = lexicon?.letters || [];

  const filtered = useMemo(() => {
    const raw = query.trim();
    const folded = foldText(raw);
    const greek = /[\u0370-\u03ff\u1f00-\u1fff]/.test(raw) ? foldGreek(raw) : '';
    return entries.filter(item => {
      if (letter && greekLetter(item.lemma) !== letter) return false;
      if (!raw) return true;
      if (item.strong.toLowerCase().includes(folded)) return true;
      if (greek && foldGreek(item.lemma).includes(greek)) return true;
      return (
        foldText(item.lemma).includes(folded) ||
        foldText(item.translit).includes(folded) ||
        foldText(item.gloss).includes(folded)
      );
    });
  }, [entries, query, letter]);

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

  /* Mantén visible la entrada activa al abrir un enlace directo o al elegirla. */
  useEffect(() => {
    const node = listRef.current?.querySelector('.lex__item.is-active');
    node?.scrollIntoView({ block: 'nearest' });
  }, [value, filtered]);

  const detail = entry ? (
    <article className="lex-entry" aria-labelledby="lex-entry-title">
      <button
        type="button"
        className="lex-entry__back"
        onClick={() => onSelect('')}
      >
        <span aria-hidden="true">←</span> Volver a la lista
      </button>
      <p className="lex-entry__strong">{entry.strong}</p>
      <h3 id="lex-entry-title" className="lex-entry__lemma" tabIndex={-1} ref={detailRef}>
        {entry.lemma}
      </h3>
      <p className="lex-entry__translit">
        {entry.translit}
        {entry.posLabel ? <span> · {entry.posLabel}</span> : null}
      </p>
      <p className="lex-entry__gloss">{entry.gloss}</p>
      {entry.note ? <p className="lex-entry__note">{entry.note}</p> : null}
      <dl className="lex-entry__meta">
        <div>
          <dt>En el Codex</dt>
          <dd>
            {number.format(entry.count)} {entry.count === 1 ? 'aparición' : 'apariciones'}
            {lexicon?.tokens ? (
              <span className="lex-entry__pct">
                {' '}
                · {((entry.count / lexicon.tokens) * 100).toFixed(2)} % de las palabras
              </span>
            ) : null}
          </dd>
        </div>
        {entry.forms?.length ? (
          <div>
            <dt>Formas más frecuentes</dt>
            <dd className="lex-entry__forms">{entry.forms.join(' · ')}</dd>
          </div>
        ) : null}
        {entry.ns ? (
          <div>
            <dt>Nombre sacro</dt>
            <dd>Aparece abreviado y sobrelineado en el códice.</dd>
          </div>
        ) : null}
      </dl>
      <p className="lex-entry__source">
        Glosa española adaptada de TBESG (STEPBible, CC BY 4.0; Abbott-Smith, 1922).
        Lematización contextual de MorphGNT (CC BY-SA 3.0). Número Strong de dominio público.
      </p>
    </article>
  ) : (
    <div className="lex-empty" ref={detailRef} tabIndex={-1}>
      <p className="lex-empty__title">
        {value ? 'Entrada no disponible' : 'Elige una palabra'}
      </p>
      <p>
        {value
          ? `La entrada ${value} no está entre los 250 lemas publicados.`
          : 'Busca un lema griego, una transcripción o una glosa española; también puedes filtrar por letra.'}
      </p>
    </div>
  );

  return (
    <div className="lex" role="dialog" aria-modal="true" aria-labelledby="lex-title">
      <div className="lex__backdrop" aria-hidden="true" onMouseDown={onClose} />
      <div className={`lex__dialog${entry ? ' lex--detail' : ''}`} ref={dialogRef}>
        <header className="lex__head">
          <div>
            <p className="eyebrow">Léxico del Codex</p>
            <h2 id="lex-title">Diccionario griego → español</h2>
            <p className="lex__sub">
              {lexicon
                ? `${lexicon.count} lemas · ${(lexicon.coverage * 100).toFixed(1)} % de las palabras del códice`
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
                placeholder="λόγος, logos, palabra, G3056"
                autoComplete="off"
                spellCheck="false"
                aria-controls="lex-list"
              />
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
                  }}
                >
                  Limpiar la búsqueda
                </button>
              </div>
            ) : (
              <ul className="lex__list" id="lex-list" ref={listRef}>
                {filtered.map(item => {
                  const active = item.strong === value;
                  return (
                    <li key={item.strong}>
                      <button
                        type="button"
                        className={`lex__item${active ? ' is-active' : ''}`}
                        aria-current={active ? 'true' : undefined}
                        onClick={() => onSelect(item.strong)}
                      >
                        <span className="lex__lemma">{item.lemma}</span>
                        <span className="lex__translit">{item.translit}</span>
                        <span className="lex__gloss">{item.gloss}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
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
