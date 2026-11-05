import { useEffect, useMemo, useState } from 'react';

import { fold } from '../../data/biblia';
import { STANDARD, headingGlyph, partInfo, plainLabel, standardKind } from '../../lib/bibliaGlyphs';

import './BookIndex.css';

/**
 * Índice de la Biblia Patrística.
 *
 * - Portada: maestro–detalle. A la izquierda los bloques de la obra (0, 1, 2, 3–4)
 *   con sus obras (número, título, fecha, extensión en páginas y folio); a la
 *   derecha la obra elegida con sus tres entradas estándar (Resumen · Citas
 *   clave · Obra completa) y «Dentro de la obra». En móvil, acordeón.
 * - `compact` (cajón del lector): solo el bloque de la página actual, con las
 *   secciones de la obra actual y la sección actual marcada.
 *
 * Los folios salen de la paginación (`folioOfPart` / `folioOfSection`).
 */

const INSIDE_LIMIT = 24;

/** Bloques (Partes sin punto) y sus obras (Partes con punto). */
export function groupWorks(parts) {
  const blocks = [];
  const byNum = new Map();
  for (const part of parts) {
    const info = partInfo(part.label);
    const num = info.num || (part.id === 'p-intro' ? '0' : '');
    if (!num.includes('.')) {
      const block = { id: part.id, num, title: info.title || part.label, part, works: [] };
      blocks.push(block);
      byNum.set(num, block);
      // La introducción no tiene obras: es su propia obra.
      if (part.sections.length) block.works.push({ part, info: { ...info, num } });
      continue;
    }
    const top = num.split('.')[0];
    let block = byNum.get(top);
    if (!block) {
      // Una obra sin encabezado de bloque («Parte 4.1» sin «Parte 4»: Tertuliano;
      // «Parte 5.1»: Cipriano) abre su propio bloque con su número y su nombre.
      block = { id: `${part.id}-bloque`, num: top, title: info.title || part.label, part, works: [] };
      blocks.push(block);
      byNum.set(top, block);
    }
    block.works.push({ part, info });
  }
  return blocks.filter(b => b.works.length);
}

function useNarrow(query = '(max-width: 899px)') {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return narrow;
}

const fmt = n => Number(n).toLocaleString('es-ES');

/** Detalle de una obra: cabecera, entradas estándar y «Dentro de la obra». */
function WorkDetail({ work, block, sectionById, folioOfPart, folioOfSection, pages, hits, onSelect }) {
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [work.part.id]);

  const sections = work.part.sections.map(id => sectionById.get(id)).filter(Boolean);
  const standard = [];
  const rest = [];
  for (const s of sections) {
    const kind = standardKind(s.label);
    if (kind && !standard.some(x => x.kind === kind)) standard.push({ kind, section: s });
    else rest.push(s);
  }
  const top = rest.length ? Math.min(...rest.map(s => s.level)) : 0;
  let inside = rest;
  if (hits) inside = rest.filter(s => hits.has(s.id));
  else if (!showAll && rest.length > INSIDE_LIMIT) inside = rest.filter(s => s.level === top).slice(0, INSIDE_LIMIT);
  const folio = folioOfPart.get(work.part.id);
  const { info } = work;

  return (
    <div className="toc-work">
      <p className="toc-work__kicker">
        {info.num && info.num !== '0' ? `Parte ${info.num} · ` : ''}
        {block.title}
      </p>
      <h3 className="toc-work__title">{info.title || work.part.label}</h3>
      <p className="toc-work__meta">
        {[info.date, pages ? `${fmt(pages)} ${pages === 1 ? 'página' : 'páginas'}` : '', `desde la p. ${fmt(folio ?? 0)}`]
          .filter(Boolean)
          .join(' · ')}
        <button type="button" className="toc-work__open" onClick={() => onSelect(work.part.id)}>
          Empezar a leer →
        </button>
      </p>

      {standard.length > 0 && (
        <ul className="toc-work__entries">
          {standard.map(({ kind, section }) => (
            <li key={section.id}>
              <button
                type="button"
                className={`toc__entry ${hits?.has(section.id) ? 'is-hit' : ''}`.trim()}
                onClick={() => onSelect(section.id)}
              >
                <span className="toc__entry-glyph" aria-hidden="true">
                  {STANDARD[kind].glyph}
                </span>
                <span className="toc__entry-title">{STANDARD[kind].title}</span>
                <span className="toc__folio">{folioOfSection.get(section.id) ?? '—'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {inside.length > 0 && (
        <>
          <h4 className="toc-work__inside-head">Dentro de la obra</h4>
          <ol className="toc-work__inside">
            {inside.map(s => {
              const { glyph, text } = headingGlyph(s.label);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`toc__row toc__row--h${Math.min(Math.max(s.level, 3), 4)} ${hits?.has(s.id) ? 'is-hit' : ''}`.trim()}
                    onClick={() => onSelect(s.id)}
                  >
                    <span className="toc__label">
                      {glyph && <span aria-hidden="true">{glyph} </span>}
                      {text}
                    </span>
                    <span className="toc__dots" aria-hidden="true" />
                    <span className="toc__folio">{folioOfSection.get(s.id) ?? '—'}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {!hits && rest.length > inside.length && (
            <button type="button" className="toc-work__more" onClick={() => setShowAll(true)}>
              Ver todos ({fmt(rest.length)})
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function BookIndex({
  parts,
  sectionById,
  folioOfPart,
  folioOfSection,
  totalPages = 0,
  activePartId = null,
  activeSectionId = null,
  onSelect,
  compact = false
}) {
  const blocks = useMemo(() => groupWorks(parts), [parts]);
  const works = useMemo(() => blocks.flatMap(b => b.works.map(w => ({ ...w, block: b }))), [blocks]);
  const narrow = useNarrow();

  /** Páginas de cada obra: folio de la siguiente − folio propio. */
  const pagesOf = useMemo(() => {
    const starts = parts.map(p => ({ id: p.id, folio: folioOfPart.get(p.id) })).filter(p => p.folio != null);
    const out = new Map();
    starts.forEach((p, i) => {
      const next = starts[i + 1]?.folio ?? totalPages + 1;
      out.set(p.id, Math.max(1, next - p.folio));
    });
    return out;
  }, [parts, folioOfPart, totalPages]);
  const maxPages = Math.max(1, ...works.map(w => pagesOf.get(w.part.id) || 1));

  const activeWork =
    works.find(w => w.part.id === activePartId) ||
    works.find(w => w.block.part.id === activePartId) ||
    works[0];

  const [selectedId, setSelectedId] = useState(activeWork?.part.id);
  useEffect(() => {
    if (activeWork) setSelectedId(activeWork.part.id);
  }, [activeWork]);

  const [query, setQuery] = useState('');
  const q = fold(query.trim());

  /** Con búsqueda: obras que coinciden y, de cada una, las secciones que coinciden. */
  const matches = useMemo(() => {
    if (q.length < 2) return null;
    const out = new Map();
    for (const w of works) {
      const hits = new Set(
        w.part.sections.filter(id => fold(sectionById.get(id)?.label || '').includes(q))
      );
      if (hits.size || fold(w.part.label).includes(q)) out.set(w.part.id, hits);
    }
    return out;
  }, [q, works, sectionById]);

  useEffect(() => {
    if (matches && matches.size && !matches.has(selectedId)) setSelectedId([...matches.keys()][0]);
  }, [matches, selectedId]);

  /* ----------------------------- cajón del lector ---------------------------- */

  if (compact) {
    const block = activeWork?.block;
    if (!block) return null;
    return (
      <nav className="toc toc--compact" aria-label={`Contenido: ${block.title}`}>
        <p className="toc__compact-head">
          <span className="toc__num">{block.num}</span> {block.title}
        </p>
        <ol className="toc__list">
          {block.works.map(w => {
            const isActive = w.part.id === activeWork.part.id;
            return (
              <li className={`toc__item ${isActive ? 'is-active' : ''}`.trim()} key={w.part.id}>
                <button
                  type="button"
                  className="toc__row toc__row--part"
                  onClick={() => onSelect(w.part.id)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="toc__num">{w.info.num}</span>
                  <span className="toc__label">{w.info.title}</span>
                  <span className="toc__dots" aria-hidden="true" />
                  <span className="toc__folio">{folioOfPart.get(w.part.id) ?? '—'}</span>
                </button>
                {isActive && w.part.sections.length > 0 && (
                  <ol className="toc__sub">
                    {w.part.sections.map(id => {
                      const s = sectionById.get(id);
                      if (!s) return null;
                      const current = s.id === activeSectionId;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            className={`toc__row toc__row--h${Math.min(Math.max(s.level, 3), 4)} ${current ? 'is-active' : ''}`.trim()}
                            onClick={() => onSelect(s.id)}
                            aria-current={current ? 'true' : undefined}
                          >
                            <span className="toc__label">{plainLabel(s.label)}</span>
                            <span className="toc__dots" aria-hidden="true" />
                            <span className="toc__folio">{folioOfSection.get(s.id) ?? '—'}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  /* ------------------------------- portada ------------------------------- */

  const selected = works.find(w => w.part.id === selectedId) || works[0];
  const detail = work =>
    work && (
      <WorkDetail
        work={work}
        block={work.block}
        sectionById={sectionById}
        folioOfPart={folioOfPart}
        folioOfSection={folioOfSection}
        pages={pagesOf.get(work.part.id)}
        hits={matches?.get(work.part.id)}
        onSelect={onSelect}
      />
    );

  return (
    <div className="toc toc--master">
      <div className="toc__bar">
        <span className="toc__meta">
          {works.length} obras · {parts.reduce((acc, part) => acc + part.sections.length, 0)} secciones
        </span>
        <label className="sr-only" htmlFor="toc-busca">
          Buscar en el índice
        </label>
        <input
          id="toc-busca"
          type="search"
          className="toc__input"
          placeholder="Buscar una obra, un autor, una herejía…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          autoComplete="off"
        />
      </div>

      {matches && matches.size === 0 ? (
        <p className="toc__empty">No hay entradas que coincidan con «{query.trim()}».</p>
      ) : (
        <div className="toc__md">
          <ol className="toc__list">
            {blocks.map(block => {
              const shown = block.works.filter(w => !matches || matches.has(w.part.id));
              if (!shown.length) return null;
              return (
                <li className="toc__block" key={block.id}>
                  <p className="toc__block-head">
                    <span className="toc__num">{block.num}</span> {block.title}
                  </p>
                  <ol className="toc__works">
                    {shown.map(w => {
                      const pages = pagesOf.get(w.part.id) || 1;
                      const on = w.part.id === selected?.part.id;
                      return (
                        <li key={w.part.id} className={`toc__item ${on ? 'is-active' : ''}`.trim()}>
                          <button
                            type="button"
                            className="toc__row toc__row--part toc__work"
                            aria-pressed={on}
                            aria-expanded={narrow ? on : undefined}
                            onClick={() => setSelectedId(w.part.id)}
                          >
                            <span className="toc__num">{w.info.num === '0' ? '0' : w.info.num}</span>
                            <span className="toc__work-main">
                              <span className="toc__label">{w.info.title}</span>
                              <span className="toc__date">
                                {w.info.date || `${w.part.sections.length} secciones`}
                              </span>
                              <span className="toc__extent" aria-hidden="true">
                                <span
                                  style={{ width: `${Math.max(4, (Math.log(pages + 1) / Math.log(maxPages + 1)) * 100)}%` }}
                                />
                              </span>
                            </span>
                            <span className="toc__folio">{folioOfPart.get(w.part.id) ?? '—'}</span>
                          </button>
                          {narrow && on && <div className="toc__inline">{detail({ ...w, block })}</div>}
                        </li>
                      );
                    })}
                  </ol>
                </li>
              );
            })}
          </ol>
          {!narrow && <aside className="toc__detail">{detail(selected)}</aside>}
        </div>
      )}
    </div>
  );
}
