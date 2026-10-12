import { useMemo, useState } from 'react';

import { fold } from '../../data/biblia';

import './BookIndex.css';

/**
 * Índice al estilo de una obra impresa: Partes y secciones con puntos guía y el
 * folio (número de página) a la derecha, en dos columnas y con buscador fijo.
 * Sustituye al antiguo `<details>` con menú desplegable.
 */

const splitLabel = label => {
  const m = /^Parte\s+([\d.]+)\s*(?:—|-)\s*(.*)$/i.exec(label);
  if (m) return { num: m[1], title: m[2] || label };
  return { num: '', title: label };
};

export default function BookIndex({
  parts,
  sectionById,
  folioOfPart,
  folioOfSection,
  activePartId = null,
  activeSectionId = null,
  onSelect,
  compact = false
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    if (q.length < 2) return parts;
    return parts
      .map(part => {
        const sections = part.sections
          .map(id => sectionById.get(id))
          .filter(Boolean);
        const hitPart = fold(part.label).includes(q);
        const hits = sections.filter(section => fold(section.label).includes(q));
        if (hitPart) return part;
        if (!hits.length) return null;
        return { ...part, sections: hits.map(s => s.id) };
      })
      .filter(Boolean);
  }, [parts, sectionById, query]);

  return (
    <div className={`toc ${compact ? 'toc--compact' : ''}`.trim()}>
      <div className="toc__bar">
        <label className="sr-only" htmlFor="toc-busca">
          Buscar en el índice
        </label>
        <input
          id="toc-busca"
          type="search"
          className="toc__input"
          placeholder="Buscar una parte, un autor, una herejía…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          autoComplete="off"
        />
        <span className="toc__meta">
          {parts.length} partes ·{' '}
          {parts.reduce((acc, part) => acc + part.sections.length, 0)} secciones
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="toc__empty">No hay entradas que coincidan con «{query.trim()}».</p>
      ) : (
        <ol className="toc__list">
          {filtered.map(part => {
            const { num, title } = splitLabel(part.label);
            const isActive = part.id === activePartId;
            return (
              <li className={`toc__item ${isActive ? 'is-active' : ''}`.trim()} key={part.id}>
                <button
                  type="button"
                  className="toc__row toc__row--part"
                  onClick={() => onSelect(part.id)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {num && <span className="toc__num">{num}</span>}
                  <span className="toc__label">{title}</span>
                  <span className="toc__dots" aria-hidden="true" />
                  <span className="toc__folio">{folioOfPart.get(part.id) ?? '—'}</span>
                </button>

                {part.sections.length > 0 && (
                  <ol className="toc__sub">
                    {part.sections.map(id => {
                      const section = sectionById.get(id);
                      if (!section) return null;
                      const active = section.id === activeSectionId;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            className={`toc__row toc__row--h${Math.min(section.level, 4)} ${
                              active ? 'is-active' : ''
                            }`.trim()}
                            onClick={() => onSelect(section.id)}
                            aria-current={active ? 'true' : undefined}
                          >
                            <span className="toc__label">{section.label}</span>
                            <span className="toc__dots" aria-hidden="true" />
                            <span className="toc__folio">{folioOfSection.get(section.id) ?? '—'}</span>
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
      )}
    </div>
  );
}
